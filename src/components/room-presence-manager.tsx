'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, useUserProfile, addDocumentNonBlocking } from '@/firebase';
import { doc, setDoc, serverTimestamp, onSnapshot, collection, getDoc } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * Production Ready: Prevents seat loss on refresh and announces entry.
 */
export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const lastRoomId = useRef<string | null>(null);
  const hasHandshakedForSession = useRef<boolean>(false);

  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user || !userProfile) return;

    const participantRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);

    const performSync = async () => {
      // 1. Entrance Announcement (Only once per room switch)
      if (lastRoomId.current !== activeRoom.id) {
        lastRoomId.current = activeRoom.id;
        addDocumentNonBlocking(collection(firestore, 'chatRooms', activeRoom.id, 'messages'), {
          content: 'entered the frequency',
          senderId: user.uid,
          senderName: userProfile.username || 'Tribe Member',
          senderAvatar: userProfile.avatarUrl || '',
          chatRoomId: activeRoom.id,
          timestamp: serverTimestamp(),
          type: 'entrance'
        });
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
      // Intentionally not deleting presence here to support quick page reloads
      // The manual "Leave Room" action handles message and deletion
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile]);

  return null;
}
