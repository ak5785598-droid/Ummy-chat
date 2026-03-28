'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
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

      // 2. Clear Stale Participants
      const standingThreshold = new Date(Date.now() - 60000); 
      const seatedThreshold = new Date(Date.now() - 300000); // 5 minute grace for seated users
      
      const snap = await getDocs(collection(firestore, 'chatRooms', roomId, 'participants'));
      
      if (!snap.empty) {
       const purgeBatch = writeBatch(firestore);
       let activeCount = 0;
       snap.docs.forEach(d => {
        const p = d.data();
        const lastSeen = p.lastSeen?.toDate?.() || new Date(0);
        const threshold = (p.seatIndex > 0) ? seatedThreshold : standingThreshold;
        
        if (lastSeen < threshold && d.id !== uid) {
          purgeBatch.delete(d.ref);
          console.warn(`[Presence-Purge] User: ${d.id} (Seat: ${p.seatIndex})`);
        } else {
          activeCount++;
        }
       });
       purgeBatch.update(roomDocRef, { participantCount: activeCount, updatedAt: serverTimestamp() });
       purgeBatch.commit().catch(() => {});
      }
     }, 30000); 
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
    cleanupInterval.current = null;
    heartbeatInterval.current = null;
   };
  }, [firestore, activeRoom?.id, user?.uid, activeRoom?.ownerId, activeRoom?.moderatorIds]); 

  // EFFECT 2: SEPARATE PROFILE METADATA SYNC
  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user || !hasJoinedRef.current) return;
    
    const participantRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);
    updateDocumentNonBlocking(participantRef, {
      name: userMetadata.username || 'Guest',
      avatarUrl: userMetadata.avatarUrl || null,
      activeFrame: userMetadata.activeFrame || 'None',
      activeWave: userMetadata.activeWave || 'Default',
      activeBubble: userMetadata.activeBubble || 'None',
      accountNumber: userMetadata.accountNumber || null,
      lastSeen: serverTimestamp(),
    });
  }, [userMetadata, firestore, activeRoom?.id, user?.uid]);

  return null;
}
