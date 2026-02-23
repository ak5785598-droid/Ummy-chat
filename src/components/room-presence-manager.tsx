'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, useUserProfile, addDocumentNonBlocking } from '@/firebase';
import { doc, setDoc, serverTimestamp, onSnapshot, collection } from 'firebase/firestore';

/**
 * Invisible component that maintains Firestore presence while a room is active (minimized or full).
 * Also handles entrance announcements.
 */
export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const currentSeatRef = useRef<number>(0);
  const lastRoomId = useRef<string | null>(null);

  // Sync presence to Firestore
  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user || !userProfile) return;

    const participantRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);

    // Entrance Announcement (Only once per room session)
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

    // Initial presence setup
    setDoc(participantRef, {
      uid: user.uid,
      name: userProfile.username || 'Guest',
      avatarUrl: userProfile.avatarUrl || '',
      activeFrame: userProfile.inventory?.activeFrame || 'None',
      joinedAt: serverTimestamp(),
      isMuted: true,
      seatIndex: currentSeatRef.current,
    }, { merge: true });

    // Listen for seat changes to update local ref
    const unsubscribe = onSnapshot(participantRef, (snap) => {
      if (snap.exists()) {
        currentSeatRef.current = snap.data().seatIndex || 0;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile]);

  return null;
}
