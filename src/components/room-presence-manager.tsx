'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * RE-ENGINEERED: Separates Join/Leave lifecycle from Identity updates to prevent auto-kick loops.
 * GHOST PREVENTION: Uses an atomic batch for entry and exit to ensure counts and presence stay synced.
 */
export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const lastRoomId = useRef<string | null>(null);

  // 1. PRIMARY PRESENCE LIFECYCLE (Join/Leave)
  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user) {
      return;
    }

    const roomId = activeRoom.id;
    const uid = user.uid;

    const performJoin = async () => {
      if (lastRoomId.current === roomId) return;
      lastRoomId.current = roomId;

      const batch = writeBatch(firestore);
      const roomDocRef = doc(firestore, 'chatRooms', roomId);
      const userRef = doc(firestore, 'users', uid);
      const profileRef = doc(firestore, 'users', uid, 'profile', uid);
      const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

      // Broadcast entrance (Non-blocking)
      addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
        content: 'entered the frequency',
        senderId: uid,
        senderName: userProfile?.username || 'Tribe Member',
        senderAvatar: userProfile?.avatarUrl || '',
        chatRoomId: roomId,
        timestamp: serverTimestamp(),
        type: 'entrance'
      });

      // Atomic Entry Protocol
      if (roomId === 'ummy-help-center') {
        batch.set(roomDocRef, { 
          id: 'ummy-help-center',
          title: 'Ummy Official Help',
          ownerId: 'official-support-bot',
          category: 'Chat',
          participantCount: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        batch.update(roomDocRef, { 
          participantCount: increment(1),
          updatedAt: serverTimestamp() 
        });
      }

      batch.update(userRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
      batch.update(profileRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });

      // Initial Participant Document
      batch.set(participantRef, {
        uid: uid,
        name: userProfile?.username || 'Guest',
        avatarUrl: userProfile?.avatarUrl || '',
        activeFrame: userProfile?.inventory?.activeFrame || 'None',
        joinedAt: serverTimestamp(),
        isMuted: true,
        seatIndex: 0,
      }, { merge: true });

      try {
        await batch.commit();
      } catch (e) {
        console.error("[Presence Sync] Join failed:", e);
        lastRoomId.current = null;
      }
    };

    performJoin();

    const handleExit = async () => {
      if (lastRoomId.current === roomId) {
        const batch = writeBatch(firestore);
        const roomDocRef = doc(firestore, 'chatRooms', roomId);
        const userRef = doc(firestore, 'users', uid);
        const profileRef = doc(firestore, 'users', uid, 'profile', uid);
        const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

        // Atomic Exit Protocol
        if (roomId === 'ummy-help-center') {
          batch.set(roomDocRef, { 
            participantCount: increment(-1),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          batch.update(roomDocRef, { 
            participantCount: increment(-1),
            updatedAt: serverTimestamp()
          });
        }

        batch.delete(participantRef);
        batch.update(userRef, { currentRoomId: null, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: null, updatedAt: serverTimestamp() });
        
        try {
          await batch.commit();
        } catch (e) {
          console.warn("[Presence Sync] Exit batch failed:", e);
        }
        
        lastRoomId.current = null;
      }
    };

    // Attempt to cleanup on tab close
    window.addEventListener('beforeunload', handleExit);

    return () => {
      handleExit();
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile?.username, userProfile?.avatarUrl, userProfile?.inventory?.activeFrame]); 

  // 2. IDENTITY SYNCHRONIZATION
  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user || !userProfile) return;

    const participantRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);
    setDocumentNonBlocking(participantRef, {
      name: userProfile.username || 'Guest',
      avatarUrl: userProfile.avatarUrl || '',
      activeFrame: userProfile.inventory?.activeFrame || 'None',
    }, { merge: true });
  }, [
    userProfile?.username, 
    userProfile?.avatarUrl, 
    userProfile?.inventory?.activeFrame, 
    firestore, 
    activeRoom?.id, 
    user?.uid
  ]);

  return null;
}
