'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs } from 'firebase/firestore';

/**
 * Maintains Firestore presence while a room is active.
 * RE-ENGINEERED: Includes a High-Fidelity Heartbeat to prevent ghost identities.
 * SELF-HEALING: Performs a hard count of participants on entry to fix stale data.
 */
export function RoomPresenceManager() {
  const { activeRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const lastRoomId = useRef<string | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

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

      console.log(`[Presence Sync] Activating presence for room: ${roomId}`);
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

      // SELF-HEALING PROTOCOL: Fetch actual participant size to fix "Aarohi" style ghost counts
      let actualCount = 1;
      try {
        const participantsSnap = await getDocs(collection(firestore, 'chatRooms', roomId, 'participants'));
        // Count includes everyone minus the current user (if they weren't already in)
        actualCount = participantsSnap.docs.filter(d => d.id !== uid).length + 1;
      } catch (e) {
        console.warn("[Presence Sync] Could not fetch participant size for healing, falling back to document field.");
      }

      const batch = writeBatch(firestore);

      // Atomic Entry & Healing Protocol
      if (roomId === 'ummy-help-center') {
        batch.set(roomDocRef, { 
          id: 'ummy-help-center',
          title: 'Ummy Official Help',
          ownerId: 'official-support-bot',
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

      // Initial Participant Document with Heartbeat
      batch.set(participantRef, {
        uid: uid,
        name: userProfile?.username || 'Guest',
        avatarUrl: userProfile?.avatarUrl || '',
        activeFrame: userProfile?.inventory?.activeFrame || 'None',
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isMuted: true,
        seatIndex: 0,
      }, { merge: true });

      try {
        await batch.commit();
        
        // Start Heartbeat Frequency
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = setInterval(() => {
          updateDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp() });
        }, 30000); // 30s Heartbeat

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
        // DETACH LOCK IMMEDIATELY to prevent double-decrement race conditions
        lastRoomId.current = null;
        
        console.log(`[Presence Sync] Deactivating presence for room: ${roomId}`);
        const batch = writeBatch(firestore);
        const roomDocRef = doc(firestore, 'chatRooms', roomId);
        const userRef = doc(firestore, 'users', uid);
        const profileRef = doc(firestore, 'users', uid, 'profile', uid);
        const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

        // Atomic Exit Protocol (Zero-Floor safe via decrement)
        batch.update(roomDocRef, { 
          participantCount: increment(-1),
          updatedAt: serverTimestamp()
        });

        batch.delete(participantRef);
        batch.update(userRef, { currentRoomId: null, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: null, updatedAt: serverTimestamp() });
        
        try {
          await batch.commit();
        } catch (e) {
          console.warn("[Presence Sync] Exit batch failed:", e);
        }
      }
    };

    // Explicit cleanup on tab close
    window.addEventListener('beforeunload', handleExit);

    return () => {
      handleExit();
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [firestore, activeRoom?.id, user?.uid, userProfile?.username, userProfile?.avatarUrl, userProfile?.inventory?.activeFrame]); 

  return null;
}
