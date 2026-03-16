'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs, getDoc } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * Re-engineered for high-fidelity cleanup and IST (GMT+5:30) Daily Reset logic.
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
    const isMod = activeRoom.moderatorIds?.includes(uid);
    const canCleanup = isOwner || isMod;

    const performJoin = async () => {
      const roomDocRef = doc(firestore, 'chatRooms', roomId);
      const userRef = doc(firestore, 'users', uid);
      const profileRef = doc(firestore, 'users', uid, 'profile', uid);
      const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

      if (lastRoomId.current !== roomId) {
        lastRoomId.current = roomId;

        const existingSnap = await getDoc(participantRef);
        const existingData = existingSnap.exists() ? existingSnap.data() : null;

        const batch = writeBatch(firestore);
        
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
      }

      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = setInterval(() => {
        setDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp() }, { merge: true });
      }, 15000);

      if (canCleanup && !cleanupInterval.current) {
        cleanupInterval.current = setInterval(async () => {
          const now = new Date();
          const getISTDateString = (d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
          const currentISTDate = getISTDateString(now);

          const roomSnap = await getDoc(roomDocRef);
          if (roomSnap.exists()) {
            const roomData = roomSnap.data();
            const lastUpdated = roomData.updatedAt?.toDate() || new Date(0);
            const lastISTDate = getISTDateString(lastUpdated);

            // IST DAILY RESET FOR ROOMS (GMT +5:30)
            if (lastISTDate !== currentISTDate) {
              updateDocumentNonBlocking(roomDocRef, {
                'stats.dailyGifts': 0,
                updatedAt: serverTimestamp()
              });
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