
'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs, getDoc } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * ANTI-GHOST PROTOCOL: 
 * 1. 20s Heartbeat for live tracking.
 * 2. Optimized Cleanup: ONLY the Room Owner performs roster sweeps to save quota.
 * 3. Exact Count Sync: Forces room count to match actual active roster size.
 */
export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const lastRoomId = useRef<string | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user) {
      return;
    }

    const roomId = activeRoom.id;
    const uid = user.uid;
    const isOwner = uid === activeRoom.ownerId;

    const performJoin = async () => {
      const roomDocRef = doc(firestore, 'chatRooms', roomId);
      const userRef = doc(firestore, 'users', uid);
      const profileRef = doc(firestore, 'users', uid, 'profile', uid);
      const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

      // Identity Sync Guard: Only perform the full join logic once per frequency transition
      if (lastRoomId.current !== roomId) {
        lastRoomId.current = roomId;

        const existingSnap = await getDoc(participantRef);
        const existingData = existingSnap.exists() ? existingSnap.data() : null;

        // Broadcast Entrance
        addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
          content: 'entered the room',
          senderId: uid,
          senderName: userProfile?.username || 'Tribe Member',
          senderAvatar: userProfile?.avatarUrl || null,
          chatRoomId: roomId,
          timestamp: serverTimestamp(),
          type: 'entrance'
        });

        // Atomic Join Handshake
        const batch = writeBatch(firestore);
        batch.update(roomDocRef, { participantCount: increment(1), updatedAt: serverTimestamp() });
        batch.update(userRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });

        batch.set(participantRef, {
          uid: uid,
          name: userProfile?.username || 'Guest',
          avatarUrl: userProfile?.avatarUrl || null,
          activeFrame: userProfile?.inventory?.activeFrame || 'None',
          activeWave: userProfile?.inventory?.activeWave || 'Default',
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          isMuted: true,
          seatIndex: existingData?.seatIndex ?? 0,
        }, { merge: true });

        await batch.commit();
      } else {
        // Metadata Refresh: If already joined, ensure participant record matches current profile
        updateDocumentNonBlocking(participantRef, {
          name: userProfile?.username || 'Guest',
          avatarUrl: userProfile?.avatarUrl || null,
          activeFrame: userProfile?.inventory?.activeFrame || 'None',
          activeWave: userProfile?.inventory?.activeWave || 'Default',
          lastSeen: serverTimestamp(),
        });
      }

      // Start Heartbeat Sync (20s)
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = setInterval(() => {
        setDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp() }, { merge: true });
      }, 20000);

      // SOVEREIGN ROSTER CLEANUP: Only the owner sweeps to save Firestore costs
      if (isOwner) {
        if (cleanupInterval.current) clearInterval(cleanupInterval.current);
        cleanupInterval.current = setInterval(async () => {
          const staleThreshold = new Date(Date.now() - 60000); 
          const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
          const snap = await getDocs(participantsRef);
          
          if (!snap.empty) {
            const purgeBatch = writeBatch(firestore);
            let activeCount = 0;
            
            snap.docs.forEach(d => {
              const data = d.data();
              const lastSeen = data.lastSeen?.toDate?.() || new Date(0);
              if (lastSeen < staleThreshold && d.id !== uid) {
                purgeBatch.delete(d.ref);
              } else {
                activeCount++;
              }
            });

            purgeBatch.update(roomDocRef, { 
              participantCount: activeCount,
              updatedAt: serverTimestamp() 
            });

            await purgeBatch.commit();
          }
        }, 45000); 
      }
    };

    performJoin();

    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (cleanupInterval.current) clearInterval(cleanupInterval.current);
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile, activeRoom?.ownerId]); 

  return null;
}
