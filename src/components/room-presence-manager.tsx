
'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, useUserProfile, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, getDoc, increment } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * Production Ready: Prevents seat loss on refresh and manages real-time participant count.
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
    if (!firestore || !activeRoom?.id || !user || !userProfile) return;

    const roomId = activeRoom.id;
    const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
    const roomDocRef = doc(firestore, 'chatRooms', roomId);

    const performSync = async () => {
      // 1. Entrance Announcement (Only once per room switch)
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

        // Increment Participant Count for global list visibility
        if (hasIncrementedCount.current !== roomId) {
          updateDocumentNonBlocking(roomDocRef, { participantCount: increment(1) });
          hasIncrementedCount.current = roomId;
        }
      }

      // 2. Seat Preservation Logic: Check if we are already in a seat
      let existingSeatIndex = 0;
      if (!hasHandshakedForSession.current) {
        try {
          const snap = await getDoc(participantRef);
          if (snap.exists()) {
            existingSeatIndex = snap.data().seatIndex || 0;
          }
        } catch (e) {
          console.warn("Presence handshake delay:", e);
        }
        hasHandshakedForSession.current = true;
      }

      // 3. Update Real-time Presence
      setDoc(participantRef, {
        uid: user.uid,
        name: userProfile.username || 'Guest',
        avatarUrl: userProfile.avatarUrl || '',
        activeFrame: userProfile.inventory?.activeFrame || 'None',
        joinedAt: serverTimestamp(),
        isMuted: true,
        seatIndex: existingSeatIndex, // Preserve seat across refreshes
      }, { merge: true });
    };

    performSync();

    return () => {
      // Decrement Count when navigating away (best effort client-side cleanup)
      if (hasIncrementedCount.current === roomId) {
        updateDocumentNonBlocking(roomDocRef, { participantCount: increment(-1) });
        hasIncrementedCount.current = null;
      }
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile]);

  return null;
}
