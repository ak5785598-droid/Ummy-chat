'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs, getDoc } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * Re-engineered for high-fidelity cleanup and IST (GMT+5:30) Periodic Reset logic.
 */
export function RoomPresenceManager() {
 const { activeRoom } = useRoomContext();
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 
 const lastRoomId = useRef<string | null>(null);
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

 useEffect(() => {
  if (!firestore || !activeRoom?.id || !user) return;

  const roomId = activeRoom.id;
  const uid = user.uid;
  const isOwner = uid === activeRoom.ownerId;
  const isMod = activeRoom.moderatorIds?.includes(uid);
  const canCleanup = isOwner || isMod;

  const performJoin = async () => {
   const roomDocRef = doc(firestore, 'chatRooms', roomId);
   const userRef = doc(firestore, 'users', uid);
   const profileRef = doc(firestore, 'users', uid, 'profile', uid);
   const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

   const existingSnap = await getDoc(participantRef);
   const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const isNewRoom = lastRoomId.current !== roomId;
    // Fix: Redundant check for Guest status to ensure profile sync once loaded
    const needsProfileSync = userProfile && (existingData?.name === 'Guest' || !existingData?.avatarUrl || existingData?.name !== userMetadata.username);

    if (isNewRoom || needsProfileSync) {
     lastRoomId.current = roomId;

     const batch = writeBatch(firestore);
     
     if (isNewRoom) {
       addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
        content: 'entered the room',
        senderId: uid,
        senderName: userMetadata.username || 'Tribe Member',
        senderAvatar: userMetadata.avatarUrl || null,
        chatRoomId: roomId,
        timestamp: serverTimestamp(),
        type: 'entrance'
       });

       if (!existingSnap.exists()) {
        batch.update(roomDocRef, { participantCount: increment(1), updatedAt: serverTimestamp() });
        
        // ONLY set initial seat/mute status if it's a completely new participant
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
       }

       batch.update(userRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
       batch.update(profileRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
     }

     // PROFILE SYNC - ONLY update metadata fields, NEVER touch seatIndex or isMuted here
     if (needsProfileSync) {
       batch.update(participantRef, {
         name: userMetadata.username || 'Guest',
         avatarUrl: userMetadata.avatarUrl || null,
         activeFrame: userMetadata.activeFrame || 'None',
         activeWave: userMetadata.activeWave || 'Default',
         activeBubble: userMetadata.activeBubble || 'None',
         accountNumber: userMetadata.accountNumber || null,
         lastSeen: serverTimestamp(),
       });
     }

     batch.commit().catch(console.error);
    }

   if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
   heartbeatInterval.current = setInterval(() => {
    setDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp() }, { merge: true });
   }, 15000);

   if (canCleanup && !cleanupInterval.current) {
    cleanupInterval.current = setInterval(async () => {
     const now = new Date();
     
     // MOBILE-SAFE IST CALCULATION
     const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
     const istNow = new Date(utc + (3600000 * 5.5));
     const istDateString = istNow.toDateString();
     const istMonth = istNow.getMonth();
     const istDay = istNow.getDay();

     const roomSnap = await getDoc(roomDocRef);
     if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      const lastUpdated = roomData.updatedAt?.toDate() || new Date(0);
      
      const lastUtc = lastUpdated.getTime() + (lastUpdated.getTimezoneOffset() * 60000);
      const istLast = new Date(lastUtc + (3600000 * 5.5));
      const lastISTDateString = istLast.toDateString();
      const lastISTMonth = istLast.getMonth();

      const resetData: any = { updatedAt: serverTimestamp() };
      let needsReset = false;

      // IST DAILY RESET
      if (lastISTDateString !== istDateString) {
       needsReset = true;
       resetData['stats.dailyGifts'] = 0;
      }

      // IST WEEKLY RESET (Monday)
      if (lastISTDateString !== istDateString && istDay === 1) {
       needsReset = true;
       resetData['stats.weeklyGifts'] = 0;
      }

      // IST MONTHLY RESET
      if (lastISTMonth !== istMonth) {
       needsReset = true;
       resetData['stats.monthlyGifts'] = 0;
      }

      if (needsReset) {
       updateDocumentNonBlocking(roomDocRef, resetData);
      }
     }

     const staleThreshold = new Date(Date.now() - 45000); 
     const snap = await getDocs(collection(firestore, 'chatRooms', roomId, 'participants'));
     
     if (!snap.empty) {
      const purgeBatch = writeBatch(firestore);
      let activeCount = 0;
      snap.docs.forEach(d => {
       const lastSeen = d.data().lastSeen?.toDate?.() || new Date(0);
       if (lastSeen < staleThreshold && d.id !== uid) purgeBatch.delete(d.ref);
       else activeCount++;
      });
      purgeBatch.update(roomDocRef, { participantCount: activeCount, updatedAt: serverTimestamp() });
      purgeBatch.commit().catch(() => {});
     }
    }, 30000); 
   }
  };

  performJoin();
 }, [firestore, activeRoom?.id, user?.uid, userMetadata, activeRoom?.ownerId, activeRoom?.moderatorIds]); 

 useEffect(() => {
  return () => {
   if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
   if (cleanupInterval.current) clearInterval(cleanupInterval.current);
  };
 }, []);

 return null;
}
