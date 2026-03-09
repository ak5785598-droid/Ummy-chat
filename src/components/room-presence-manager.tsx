'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs, getDoc } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
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
    activeWave: userProfile?.inventory?.activeWave
  }), [userProfile?.username, userProfile?.avatarUrl, userProfile?.inventory?.activeFrame, userProfile?.inventory?.activeWave]);

  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user) return;

    const roomId = activeRoom.id;
    const uid = user.uid;
    const isOwner = uid === activeRoom.ownerId;

    const performJoin = async () => {
      const roomDocRef = doc(firestore, 'chatRooms', roomId);
      const userRef = doc(firestore, 'users', uid);
      const profileRef = doc(firestore, 'users', uid, 'profile', uid);
      const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

      if (lastRoomId.current !== roomId) {
        lastRoomId.current = roomId;

        const existingSnap = await getDoc(participantRef);
        const existingData = existingSnap.exists() ? existingSnap.data() : null;

        // AUTH HANDSHAKE: Ensure clean slate
        const batch = writeBatch(firestore);
        
        // Broadcast entrance only if not already established
        if (!existingSnap.exists()) {
          addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
            content: 'entered the room',
            senderId: uid,
            senderName: userMetadata.username || 'Tribe Member',
            senderAvatar: userMetadata.avatarUrl || null,
            chatRoomId: roomId,
            timestamp: serverTimestamp(),
            type: 'entrance'
          });
          batch.update(roomDocRef, { participantCount: increment(1), updatedAt: serverTimestamp() });
        }

        batch.update(userRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });

        batch.set(participantRef, {
          uid: uid,
          name: userMetadata.username || 'Guest',
          avatarUrl: userMetadata.avatarUrl || null,
          activeFrame: userMetadata.activeFrame || 'None',
          activeWave: userMetadata.activeWave || 'Default',
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          isMuted: true,
          seatIndex: existingData?.seatIndex ?? 0,
        }, { merge: true });

        batch.commit().catch(console.error);
      } else {
        setDocumentNonBlocking(participantRef, {
          name: userMetadata.username || 'Guest',
          avatarUrl: userMetadata.avatarUrl || null,
          activeFrame: userMetadata.activeFrame || 'None',
          activeWave: userMetadata.activeWave || 'Default',
          lastSeen: serverTimestamp(),
        }, { merge: true });
      }

      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = setInterval(() => {
        setDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp() }, { merge: true });
      }, 20000);

      if (isOwner && !cleanupInterval.current) {
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

            purgeBatch.commit().catch(() => {});
          }
        }, 45000); 
      }
    };

    performJoin();

    return () => {};
  }, [firestore, activeRoom?.id, user?.uid, userMetadata, activeRoom?.ownerId]); 

  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (cleanupInterval.current) clearInterval(cleanupInterval.current);
      heartbeatInterval.current = null;
      cleanupInterval.current = null;
    };
  }, []);

  return null;
}
