'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs } from 'firebase/firestore';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * Maintains Firestore presence while a room is active.
 * OPTIMIZED: Synchronizes participantCount document field for grid-wide efficiency.
 */
export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const lastRoomId = useRef<string | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user) {
      return;
    }

    const roomId = activeRoom.id;
    const uid = user.uid;

    const performJoin = async () => {
      if (lastRoomId.current === roomId) return;
      lastRoomId.current = roomId;

      const roomDocRef = doc(firestore, 'chatRooms', roomId);
      const userRef = doc(firestore, 'users', uid);
      const profileRef = doc(firestore, 'users', uid, 'profile', uid);
      const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

      // Broadcast entrance
      addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
        content: 'entered the room',
        senderId: uid,
        senderName: userProfile?.username || 'Tribe Member',
        senderAvatar: userProfile?.avatarUrl || null,
        chatRoomId: roomId,
        timestamp: serverTimestamp(),
        type: 'entrance'
      });

      // SELF-HEALING: Fetch actual participant size to maintain count accuracy
      let actualCount = 1;
      try {
        const participantsSnap = await getDocs(collection(firestore, 'chatRooms', roomId, 'participants'));
        actualCount = participantsSnap.docs.filter(d => d.id !== uid).length + 1;
      } catch (e) {
        console.warn("[Presence Sync] Fallback to optimistic count");
      }

      const batch = writeBatch(firestore);

      if (roomId === 'ummy-help-center') {
        batch.set(roomDocRef, { 
          id: 'ummy-help-center',
          title: 'Ummy Official Help',
          ownerId: CREATOR_ID,
          category: 'Chat',
          participantCount: actualCount,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        batch.update(roomDocRef, { 
          participantCount: actualCount,
          updatedAt: serverTimestamp() 
        });
      }

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
        seatIndex: 0,
      }, { merge: true });

      try {
        await batch.commit();
        
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = setInterval(() => {
          setDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp() }, { merge: true });
        }, 30000);

      } catch (e) {
        console.error("[Presence Sync] Join failed:", e);
        lastRoomId.current = null;
      }
    };

    performJoin();

    const handleExit = async () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }

      if (lastRoomId.current === roomId) {
        lastRoomId.current = null;
        
        const batch = writeBatch(firestore);
        const roomDocRef = doc(firestore, 'chatRooms', roomId);
        const userRef = doc(firestore, 'users', uid);
        const profileRef = doc(firestore, 'users', uid, 'profile', uid);
        const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

        batch.update(roomDocRef, { 
          participantCount: increment(-1),
          updatedAt: serverTimestamp()
        });

        batch.delete(participantRef);
        batch.update(userRef, { currentRoomId: null, isOnline: true, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: null, isOnline: true, updatedAt: serverTimestamp() });
        
        try {
          await batch.commit();
        } catch (e) {
          console.warn("[Presence Sync] Exit failed:", e);
        }
      }
    };

    window.addEventListener('beforeunload', handleExit);
    return () => {
      handleExit();
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile?.username, userProfile?.avatarUrl, userProfile?.inventory?.activeFrame, userProfile?.inventory?.activeWave]); 

  return null;
}
