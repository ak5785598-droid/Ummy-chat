
'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, setDoc, serverTimestamp, collection, getDoc, increment, writeBatch } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * Production Ready: Manages participantCount atomically.
 * AUTOMATIC REMOVAL PROTOCOL: When user goes offline or navigates away, 
 * they are purged from the participant list and the count is decremented instantly.
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
    // Identity Sync Check: Wait until user AND userProfile are both synchronized
    if (!firestore || !activeRoom?.id || !user || !userProfile) {
      return;
    }

    const roomId = activeRoom.id;
    const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
    const roomDocRef = doc(firestore, 'chatRooms', roomId);
    const userRef = doc(firestore, 'users', user.uid);
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

    const performSync = async () => {
      // 1. Send Entrance Broadcast and Increment Atomic Count
      if (lastRoomId.current !== roomId) {
        lastRoomId.current = roomId;
        
        const batch = writeBatch(firestore);
        
        // Broadcast entrance
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
          batch.update(roomDocRef, { participantCount: increment(1) });
          batch.update(userRef, { currentRoomId: roomId, updatedAt: serverTimestamp() });
          batch.update(profileRef, { currentRoomId: roomId, updatedAt: serverTimestamp() });
          hasIncrementedCount.current = roomId;
        }

        // Handle Seat Presence Identity
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

        batch.set(participantRef, {
          uid: user.uid,
          name: userProfile.username || 'Guest',
          avatarUrl: userProfile.avatarUrl || '',
          activeFrame: userProfile.inventory?.activeFrame || 'None',
          joinedAt: serverTimestamp(),
          isMuted: true,
          seatIndex: existingSeatIndex,
        }, { merge: true });

        await batch.commit();
      }
    };

    performSync();

    const handleExit = async () => {
      if (hasIncrementedCount.current === roomId) {
        // Atomic Exit Protocol: Decrement count, delete identity, and clear user state
        const batch = writeBatch(firestore);
        batch.update(roomDocRef, { participantCount: increment(-1) });
        batch.delete(participantRef);
        batch.update(userRef, { currentRoomId: null, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: null, updatedAt: serverTimestamp() });
        
        await batch.commit();
        
        hasIncrementedCount.current = null;
        hasHandshakedForSession.current = false;
        lastRoomId.current = null;
      }
    };

    // Ensure exit on window close or navigation
    window.addEventListener('beforeunload', handleExit);

    return () => {
      handleExit();
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile]);

  return null;
}
