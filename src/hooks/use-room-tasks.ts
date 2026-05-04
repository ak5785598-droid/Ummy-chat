'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp, increment, writeBatch, onSnapshot } from 'firebase/firestore';
import { ROOM_TASKS } from '@/constants/room-tasks';
import { useToast } from '@/hooks/use-toast';

export function useRoomTasks(roomId: string, participants: any[], roomOwnerId: string, isModerator: boolean) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [achievedTasks, setAchievedTasks] = useState<string[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<string[]>([]);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Refs for latest values (stale closure problem solved)
  const taskProgressRef = useRef<Record<string, number>>({});
  const claimedTasksRef = useRef<string[]>([]);
  const micTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simMicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsMeOnMic = useRef<boolean>(false);
  const prevHasThreeOnMic = useRef<boolean>(false);
  const uniqueEntries = useRef<Set<string>>(new Set());
  const prevSeatOccupants = useRef<string[]>([]);

  // Sync state with refs
  useEffect(() => {
    taskProgressRef.current = taskProgress;
    claimedTasksRef.current = claimedTasks;
  }, [taskProgress, claimedTasks]);

  // ------------------------------------------------------------------
  // 🔒 5:30 AM RESET LOCK - Sirf ek baar trigger hoga din me
  // ------------------------------------------------------------------
  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];
      const lastResetDate = localStorage.getItem('lastResetDate');

      // Agar time 5:30 AM ho chuka hai aur aaj reset nahi hua to karo
      if ((currentHour > 5 || (currentHour === 5 && currentMinutes >= 30)) && lastResetDate !== todayStr) {
        localStorage.setItem('lastResetDate', todayStr);
        setResetTrigger(prev => prev + 1); // Force re-fetch tasks
        // Local state clear
        setTaskProgress({});
        setAchievedTasks([]);
        setClaimedTasks([]);
        uniqueEntries.current.clear();
        prevSeatOccupants.current = [];
        // 🔒 Lock effect: ab koi bhi purana task claim nahi ho sakta
        // kyunki naye snapshot me sirf aaj ke tasks aayenge
      }
    };
    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's tasks (resetTrigger change pe fresh data)
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
        // Sirf aaj ke tasks dikhao (purane tasks invisible)
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
  }, [firestore, user?.uid, resetTrigger]);

  // Core update function (refs use karta hai, stale closure se bachta hai)
  const updateTask = async (taskId: string, incrementBy: number = 1) => {
    if (!firestore || !user?.uid) return;
    const task = ROOM_TASKS.find(t => t.id === taskId);
    if (!task) return;

    // 🔒 Lock: agar task already claimed hai to update hi mat karo
    if (claimedTasksRef.current.includes(taskId)) return;

    const currentVal = (taskProgressRef.current[taskId] || 0) + incrementBy;
    const isNowComplete = currentVal >= task.target;

    const taskRef = doc(firestore, 'users', user.uid, 'roomQuests', taskId);

    await setDocumentNonBlocking(taskRef, {
      current: currentVal,
      target: task.target,
      isCompleted: isNowComplete,
      isClaimed: claimedTasksRef.current.includes(taskId),
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  // Claim reward
  const claimTask = async (taskId: string) => {
    if (!firestore || !user?.uid) return;
    const task = ROOM_TASKS.find(t => t.id === taskId);
    if (!task || claimedTasksRef.current.includes(taskId)) return;

    const isAchieved = achievedTasks.includes(taskId) || (taskProgressRef.current[taskId] || 0) >= task.target;
    if (!isAchieved) return;

    try {
      const batch = writeBatch(firestore);
      const taskRef = doc(firestore, 'users', user.uid, 'roomQuests', taskId);
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

      batch.update(taskRef, { isClaimed: true, updatedAt: serverTimestamp() });
      batch.set(userRef, { wallet: { coins: increment(task.reward) }, updatedAt: serverTimestamp() }, { merge: true });
      batch.set(profileRef, { wallet: { coins: increment(task.reward) }, updatedAt: serverTimestamp() }, { merge: true });

      await batch.commit();

      toast({
        title: '🎉 Reward Claimed!',
        description: `${task.reward.toLocaleString()} Gold Coins mil gaye!`,
      });
    } catch (e) {
      console.error('[Claim] Error:', e);
      toast({ title: 'Claim Failed', description: 'Kuch galat ho gaya, phir try karo.', variant: 'destructive' });
    }
  };

  // 🎤 On-Mic tasks (10,30,60 min)
  useEffect(() => {
    if (!user?.uid) return;
    const isMeOnMic = participants.some(p => p.uid === user.uid && p.seatIndex > 0);

    if (isMeOnMic && !prevIsMeOnMic.current) {
      if (micTimerRef.current) clearInterval(micTimerRef.current);
      micTimerRef.current = setInterval(() => {
        updateTask('mic_10', 1);
        updateTask('mic_30', 1);
        updateTask('mic_60', 1);
      }, 60000);
    } else if (!isMeOnMic && prevIsMeOnMic.current) {
      if (micTimerRef.current) {
        clearInterval(micTimerRef.current);
        micTimerRef.current = null;
      }
    }
    prevIsMeOnMic.current = isMeOnMic;
    return () => {
      if (micTimerRef.current) clearInterval(micTimerRef.current);
    };
  }, [participants, user?.uid]);

  // 👥 3+ Users on Mic (sim_mic_1, sim_mic_10, sim_mic_new_5)
  useEffect(() => {
    const usersOnMic = participants.filter(p => p.seatIndex > 0);
    const hasThreeOnMic = usersOnMic.length >= 3;

    if (hasThreeOnMic && !prevHasThreeOnMic.current) {
      if (simMicTimerRef.current) clearInterval(simMicTimerRef.current);
      simMicTimerRef.current = setInterval(() => {
        updateTask('sim_mic_1', 1);
        updateTask('sim_mic_10', 1);

        const currentMicUsers = participants.filter(p => p.seatIndex > 0);
        const newUserCount = currentMicUsers.filter(p => {
          if (p.createdAt) {
            let createdAtDate;
            if (typeof p.createdAt === 'object' && p.createdAt.toDate) {
              createdAtDate = p.createdAt.toDate();
            } else {
              createdAtDate = new Date(p.createdAt);
            }
            const hoursSinceJoin = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60);
            return hoursSinceJoin <= 24;
          }
          return false;
        }).length;
        if (newUserCount >= 3) updateTask('sim_mic_new_5', 1);
      }, 60000);
    } else if (!hasThreeOnMic && prevHasThreeOnMic.current) {
      if (simMicTimerRef.current) {
        clearInterval(simMicTimerRef.current);
        simMicTimerRef.current = null;
      }
    }
    prevHasThreeOnMic.current = hasThreeOnMic;
    return () => {
      if (simMicTimerRef.current) clearInterval(simMicTimerRef.current);
    };
  }, [participants]);

  // 🚪 Room Entry & Invitation
  useEffect(() => {
    if (!participants || !user?.uid) return;

    participants.forEach(p => {
      if (!uniqueEntries.current.has(p.uid)) {
        uniqueEntries.current.add(p.uid);
        const count = uniqueEntries.current.size;
        if (count === 3) updateTask('entry_3');
        if (count === 10) updateTask('entry_10');
      }
    });

    const currentOnMic = participants.filter(p => p.seatIndex > 0).map(p => p.uid);
    const isAdmin = roomOwnerId === user?.uid || isModerator;

    if (isAdmin) {
      const newlyJoined = currentOnMic.filter(uid => !prevSeatOccupants.current.includes(uid));
      if (newlyJoined.length > 0) {
        newlyJoined.forEach(() => {
          updateTask('invite_1');
          updateTask('invite_10');
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
    triggerTask: updateTask, // Share, follow, etc. ke liye
  };
    }
