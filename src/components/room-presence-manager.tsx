'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, setDoc, serverTimestamp, collection, getDoc, increment } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * Production Ready: Manages participantCount atomically.
 * Sole owner of room participantCount management to ensure real-time discovery synchronization.
 * AUTOMATIC REMOVAL PROTOCOL: When count hits 0, room disappears from homepage discovery.
 */
export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const lastRoomId = useRef<string | null>(null);
  const hasHandshakedForSession = useRef<boolean>(false);
  const hasIncrementedCount = useRef<string | null>(null);

  useEffect(() => {
    // Safety check for undefined identity states during mobile entrance
    if (!firestore || !activeRoom?.id || !user || !userProfile) {
      return;
    }

    const roomId = activeRoom.id;
    const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
    const roomDocRef = doc(firestore, 'chatRooms', roomId);

    const performSync = async () => {
      if (lastRoomId.current !== roomId) {
        lastRoomId.current = roomId;
        addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
          content: 'entered the frequency',
          senderId: user.uid,
          senderName: userProfile.username || 'Tribe Member',
          senderAvatar: userProfile.avatarUrl || '',
          chatRoomId: roomId,
          timestamp: serverTimestamp(),
          type: 'entrance'
        });

        // Atomic Entry Protocol
        if (hasIncrementedCount.current !== roomId) {
          updateDocumentNonBlocking(roomDocRef, { participantCount: increment(1) });
          hasIncrementedCount.current = roomId;
        }
      }

      let existingSeatIndex = 0;
      if (!hasHandshakedForSession.current) {
        try {
          const snap = await getDoc(participantRef);
          if (snap.exists()) {
            existingSeatIndex = snap.data().seatIndex || 0;
          }
        } catch (e) {}
        hasHandshakedForSession.current = true;
      }

      setDoc(participantRef, {
        uid: user.uid,
        name: userProfile.username || 'Guest',
        avatarUrl: userProfile.avatarUrl || '',
        activeFrame: userProfile.inventory?.activeFrame || 'None',
        joinedAt: serverTimestamp(),
        isMuted: true,
        seatIndex: existingSeatIndex,
      }, { merge: true });
    };

    performSync();

    return () => {
      // Atomic Exit Protocol: Ensures room closes from discovery instantly if empty
      if (hasIncrementedCount.current === roomId) {
        updateDocumentNonBlocking(roomDocRef, { participantCount: increment(-1) });
        hasIncrementedCount.current = null;
        hasHandshakedForSession.current = false;
      }
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile]);

  return null;
}
