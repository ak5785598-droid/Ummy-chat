'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, increment, writeBatch, getDoc, onSnapshot } from 'firebase/firestore';
import { ROOM_TASKS, RoomTask } from '@/constants/room-tasks';
import { useToast } from '@/hooks/use-toast';

interface TaskState {
  current: number;
  isCompleted: boolean;
  lastUpdated: any;
}

export function useRoomTasks(roomId: string, participants: any[], roomOwnerId: string, isModerator: boolean) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [achievedTasks, setAchievedTasks] = useState<string[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<string[]>([]);
  
  const micTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simMicTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch persistent progress for today
  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const today = new Date().toISOString().split('T')[0];
    const questsRef = collection(firestore, 'users', user.uid, 'roomQuests');
    
    const unsub = onSnapshot(questsRef, (snap) => {
      const data: Record<string, number> = {};
      const achieved: string[] = [];
      const claimed: string[] = [];
      
      snap.docs.forEach(doc => {
        const d = doc.data();
        const updatedAt = d.updatedAt?.toDate() || new Date();
        const updatedAtKey = updatedAt.toISOString().split('T')[0];
        
        if (updatedAtKey === today) {
          data[doc.id] = d.current || 0;
          if (d.isCompleted) achieved.push(doc.id);
          if (d.isClaimed) claimed.push(doc.id);
        }
      });
      
      setTaskProgress(data);
      setAchievedTasks(achieved);
      setClaimedTasks(claimed);
    });

    return () => unsub();
  }, [firestore, user?.uid]);

  // 2. Helper to increment task progress (NO AUTO-AWARD)
  const updateTask = async (taskId: string, incrementBy: number = 1) => {
    if (!firestore || !user?.uid) return;
    
    const task = ROOM_TASKS.find(t => t.id === taskId);
    // Don't update if already claimed
    if (!task || claimedTasks.includes(taskId)) return;

    const currentVal = (taskProgress[taskId] || 0) + incrementBy;
    const isNowComplete = currentVal >= task.target;

    const taskRef = doc(firestore, 'users', user.uid, 'roomQuests', taskId);
    
    await updateDocumentNonBlocking(taskRef, {
      current: currentVal,
      target: task.target,
      isCompleted: isNowComplete,
      updatedAt: serverTimestamp()
    });
  };

  // 3. NEW: Manual Claim Function
  const claimTask = async (taskId: string) => {
    if (!firestore || !user?.uid) return;

    const task = ROOM_TASKS.find(t => t.id === taskId);
    if (!task || claimedTasks.includes(taskId)) return;
    
    const isAchieved = achievedTasks.includes(taskId) || (taskProgress[taskId] || 0) >= task.target;
    if (!isAchieved) return;

    try {
      const batch = writeBatch(firestore);
      const taskRef = doc(firestore, 'users', user.uid, 'roomQuests', taskId);
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

      batch.update(taskRef, {
        isClaimed: true,
        updatedAt: serverTimestamp()
      });

      const rewardUpdate = {
        'wallet.coins': increment(task.reward),
        updatedAt: serverTimestamp()
      };
      batch.update(userRef, rewardUpdate);
      batch.update(profileRef, rewardUpdate);

      await batch.commit();
      
      toast({
        title: 'Reward Claimed!',
        description: `Successfully claimed ${task.reward.toLocaleString()} Gold Coins!`,
      });
    } catch (e) {
      console.error('[Missions] Claim failed:', e);
      toast({
        title: 'Claim Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // 3. Logic for "On Mic" tasks (10, 30, 60 mins)
  useEffect(() => {
    const isMeOnMic = participants.some(p => p.uid === user?.uid && p.seatIndex > 0);
    
    if (isMeOnMic && !micTimerRef.current) {
      micTimerRef.current = setInterval(() => {
        updateTask('mic_10', 1);
        updateTask('mic_30', 1);
        updateTask('mic_60', 1);
      }, 60000); // Check every minute
    } else if (!isMeOnMic && micTimerRef.current) {
      clearInterval(micTimerRef.current);
      micTimerRef.current = null;
    }

    return () => {
      if (micTimerRef.current) clearInterval(micTimerRef.current);
    };
  }, [participants, user?.uid]);

  // 4. Logic for "3 Users on Mic" tasks
  useEffect(() => {
    const usersOnMic = participants.filter(p => p.seatIndex > 0);
    const hasThreeOnMic = usersOnMic.length >= 3;
    
    if (hasThreeOnMic && !simMicTimerRef.current) {
      simMicTimerRef.current = setInterval(() => {
        updateTask('sim_mic_1', 1);
        updateTask('sim_mic_10', 1);
        
        const newUsersOnMic = usersOnMic.filter(p => {
          // Check if user is "new" (placeholder: registered in last 24h)
          // Since we don't have createdAt easily available for all participants in the list, 
          // this would require a more complex check or data sync.
          return false; // To be implemented with user metadata
        });
        
        if (newUsersOnMic.length >= 3) {
          updateTask('sim_mic_new_5', 1);
        }

      }, 60000);
    } else if (!hasThreeOnMic && simMicTimerRef.current) {
      clearInterval(simMicTimerRef.current);
      simMicTimerRef.current = null;
    }

    return () => {
      if (simMicTimerRef.current) clearInterval(simMicTimerRef.current);
    };
  }, [participants]);

  // 5. Logic for "Room Entry" and "Invitation" tasks
  const uniqueEntries = useRef<Set<string>>(new Set());
  const prevSeatOccupants = useRef<string[]>([]);

  useEffect(() => {
    if (!participants) return;

    // Traffic tracking
    participants.forEach(p => {
      if (!uniqueEntries.current.has(p.uid)) {
        uniqueEntries.current.add(p.uid);
        const count = uniqueEntries.current.size;
        if (count === 3) updateTask('entry_3');
        if (count === 10) updateTask('entry_10');
      }
    });

    // Invitation tracking (simplified: if owner/mod and someone new joins a seat)
    const currentOnMic = participants.filter(p => p.seatIndex > 0).map(p => p.uid);
    const isAdmin = roomOwnerId === user?.uid || isModerator;

    if (isAdmin) {
      const newlyJoined = currentOnMic.filter(uid => !prevSeatOccupants.current.includes(uid));
      if (newlyJoined.length > 0) {
        newlyJoined.forEach(() => {
          updateTask('invite_1');
          updateTask('invite_10');
          // For simplicity, we trigger these, the persistent current/target handles the rest
        });
      }
    }
    prevSeatOccupants.current = currentOnMic;
  }, [participants, user?.uid, roomOwnerId, isModerator]);

  return {
    taskProgress,
    achievedTasks,
    claimedTasks,
    claimTask,
    triggerTask: updateTask
  };
}
