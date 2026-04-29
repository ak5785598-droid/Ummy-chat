'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs, getDoc } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * Re-engineered for high-fidelity cleanup and IST (GMT+5:30) Periodic Reset logic.
 * Feature: Anti-Kick backgrounding resilience for seated users.
 */
 export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  
  const lastRoomId = useRef<string | null>(null);
  const hasJoinedRef = useRef<boolean>(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);
  const stayTimeRef = useRef<number>(0);
  const hasStayAwarded = useRef<boolean>(false);

  const userMetadata = useMemo(() => ({
   username: userProfile?.username,
   avatarUrl: userProfile?.avatarUrl,
   activeFrame: userProfile?.inventory?.activeFrame,
   activeWave: userProfile?.inventory?.activeWave,
   activeBubble: userProfile?.inventory?.activeBubble,
   accountNumber: userProfile?.accountNumber
  }), [userProfile?.username, userProfile?.avatarUrl, userProfile?.inventory?.activeFrame, userProfile?.inventory?.activeWave, userProfile?.inventory?.activeBubble, userProfile?.accountNumber]);

  // EFFECT 1: JOIN & CLEANUP & BACKGROUND RESILIENCE
  useEffect(() => {
   if (!firestore || !activeRoom?.id || !user) return;

   const roomId = activeRoom.id;
   const uid = user.uid;
   const isOwner = uid === activeRoom.ownerId;
   const isMod = activeRoom.moderatorIds?.includes(uid);
   const canCleanup = isOwner || isMod;

   const performJoin = async () => {
    const isNewRoom = lastRoomId.current !== roomId;
    if (!isNewRoom && hasJoinedRef.current) return;

    const roomDocRef = doc(firestore, 'chatRooms', roomId);
    const userRef = doc(firestore, 'users', uid);
    const profileRef = doc(firestore, 'users', uid, 'profile', uid);
    const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

    try {
      const existingSnap = await getDoc(participantRef);
      const batch = writeBatch(firestore);
      
      if (isNewRoom) {
        lastRoomId.current = roomId;
        hasJoinedRef.current = true;

        // Send entrance message
        addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
         content: 'entered the room',
         senderId: uid,
         senderName: userMetadata.username || 'Tribe Member',
         senderAvatar: userMetadata.avatarUrl || null,
         chatRoomId: roomId,
         timestamp: serverTimestamp(),
         type: 'entrance'
        });

        // Initialize participant if they don't exist
        if (!existingSnap.exists()) {
         batch.update(roomDocRef, { participantCount: increment(1), updatedAt: serverTimestamp() });
         batch.set(participantRef, {
          uid: uid,
          name: userMetadata.username || 'Guest',
          avatarUrl: userMetadata.avatarUrl || null,
          activeFrame: userMetadata.activeFrame || 'None',
          activeWave: userMetadata.activeWave || 'Default',
          activeBubble: userMetadata.activeBubble || 'None',
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          isMuted: true,
          seatIndex: 0,
          accountNumber: userMetadata.accountNumber || null,
         }, { merge: true });
        } else {
          // If they exist, just update lastSeen to keep them alive
          batch.update(participantRef, { lastSeen: serverTimestamp() });
        }

        batch.update(userRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
        await batch.commit();
      }
    } catch (err) {
      console.error('[Presence] Join failed:', err);
    }

    // HEARTBEAT: Standardized at 10s for mobile responsiveness
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    heartbeatInterval.current = setInterval(() => {
     setDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp() }, { merge: true });
     
     // ⚡ QUEST TRACKING: Stay 15 Mins
     if (!hasStayAwarded.current) {
       stayTimeRef.current += 10;
       if (stayTimeRef.current >= 900) { // 15 minutes
         console.log('[Missions] Stay time reached! Awarding progress...');
         const questRef = doc(firestore, 'users', uid, 'quests', 'stay_15');
         updateDocumentNonBlocking(questRef, { current: increment(15) });
         hasStayAwarded.current = true;
       }
     }
    }, 10000);

    // CLEANUP: Admin-only task to purge stale sessions
    // Re-engineered for mobile resilience (Seated users get 5 min grace)
    if (canCleanup && !cleanupInterval.current) {
     cleanupInterval.current = setInterval(async () => {
      // 1. Periodic IST Resets
      const roomSnap = await getDoc(roomDocRef);
      if (roomSnap.exists()) {
       const now = new Date();
       const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
       const istNow = new Date(utc + (3600000 * 5.5));
       const roomData = roomSnap.data();
       const lastUpdated = roomData.updatedAt?.toDate() || new Date(0);
       
       const lastUtc = lastUpdated.getTime() + (lastUpdated.getTimezoneOffset() * 60000);
       const istLast = new Date(lastUtc + (3600000 * 5.5));

       const resetData: any = { updatedAt: serverTimestamp() };
       let needsReset = false;

       if (istLast.toDateString() !== istNow.toDateString()) {
        needsReset = true;
        resetData['stats.dailyGifts'] = 0;
        if (istNow.getDay() === 1) resetData['stats.weeklyGifts'] = 0;
       }
       if (istLast.getMonth() !== istNow.getMonth()) {
        needsReset = true;
        resetData['stats.monthlyGifts'] = 0;
       }

       if (needsReset) updateDocumentNonBlocking(roomDocRef, resetData);
      }

       // 2. Clear Stale Participants (Ghost Removal)
       // Standardized 2-minute inactivity threshold for ALL users
       const ghostThreshold = new Date(Date.now() - 120000); // 2 minutes
       
       const snap = await getDocs(collection(firestore, 'chatRooms', roomId, 'participants'));
       
       if (!snap.empty) {
        const purgeBatch = writeBatch(firestore);
        let activeCount = 0;
        snap.docs.forEach(d => {
         const p = d.data();
         const lastSeen = p.lastSeen?.toDate?.() || new Date(0);
         
         // Remove ANY user (seated or audience) if they are inactive for > 2 mins
         // This handles cases where the user killed the app or lost connection
         if (lastSeen < ghostThreshold && d.id !== uid) {
           purgeBatch.delete(d.ref);
           console.warn(`[Presence-Purge] Ghost user removed: ${d.id} (${p.name})`);
         } else {
           activeCount++;
         }
        });
        purgeBatch.update(roomDocRef, { participantCount: activeCount, updatedAt: serverTimestamp() });
        purgeBatch.commit().catch(() => {});
       }
      }, 15000); 
     }
    };
 
    performJoin();
 
    // Visibility Listener: Instant refresh upon returning to app
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user?.uid && activeRoom?.id) {
        const pRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);
        setDocumentNonBlocking(pRef, { lastSeen: serverTimestamp() }, { merge: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
 
    return () => {
     if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
     if (cleanupInterval.current) clearInterval(cleanupInterval.current);
     document.removeEventListener('visibilitychange', handleVisibility);
     
     // 🚀 INSTANT LEAVE: Try to remove participant document immediately when navigating away
     if (firestore && user?.uid && activeRoom?.id) {
       const pRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);
       const rRef = doc(firestore, 'chatRooms', activeRoom.id);
       const uRef = doc(firestore, 'users', user.uid);
       const profRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
       
       // Non-blocking cleanup
       deleteDocumentNonBlocking(pRef);
       updateDocumentNonBlocking(rRef, { participantCount: increment(-1), updatedAt: serverTimestamp() });
       updateDocumentNonBlocking(uRef, { currentRoomId: null, updatedAt: serverTimestamp() });
       updateDocumentNonBlocking(profRef, { currentRoomId: null, updatedAt: serverTimestamp() });
     }

     cleanupInterval.current = null;
     heartbeatInterval.current = null;
    };
  }, [firestore, activeRoom?.id, user?.uid, activeRoom?.ownerId, activeRoom?.moderatorIds]); 

  const lastSyncMetadata = useRef<string>('');

  // EFFECT 2: SEPARATE PROFILE METADATA SYNC (Guarded & Debounced)
  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user || !hasJoinedRef.current || !userProfile) return;
    
    // Create a stable string representation for comparison (excluding lastSeen)
    const currentMetaString = JSON.stringify({
      n: userMetadata.username,
      a: userMetadata.avatarUrl,
      f: userMetadata.activeFrame,
      w: userMetadata.activeWave,
      b: userMetadata.activeBubble,
      acc: userMetadata.accountNumber
    });

    // GUARD: Only sync if metadata actually changed to prevent 403/Quota issues
    if (currentMetaString === lastSyncMetadata.current) return;

    const syncMetadata = async () => {
      try {
        const participantRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);
        await updateDocumentNonBlocking(participantRef, {
          name: userMetadata.username || 'Guest',
          avatarUrl: userMetadata.avatarUrl || null,
          activeFrame: userMetadata.activeFrame || 'None',
          activeWave: userMetadata.activeWave || 'Default',
          activeBubble: userMetadata.activeBubble || 'None',
          accountNumber: userMetadata.accountNumber || null,
          lastSeen: serverTimestamp(),
        });
        lastSyncMetadata.current = currentMetaString;
      } catch (err) {
        // Silent catch for transient permission issues during room entry
        console.warn('[Presence] Metadata sync suppressed (Transient):', err);
      }
    };

    // DEBOUNCE: Allow profile state to stabilize before hitting Firestore
    const timer = setTimeout(syncMetadata, 800);
    return () => clearTimeout(timer);
  }, [userMetadata, firestore, activeRoom?.id, user?.uid, userProfile]);

  return null;
}
