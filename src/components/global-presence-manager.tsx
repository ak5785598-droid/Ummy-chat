'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useAuth, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, increment, getDoc } from 'firebase/firestore';

/**
 * Elite Global Presence Manager.
 * Synchronizes the user's online status with the tribal graph in real-time.
 * SAFETY NET: Cleans up room state when auth.currentUser becomes null.
 */
export function GlobalPresenceManager() {
 const { user } = useUser();
 const auth = useAuth();
 const firestore = useFirestore();
 const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
 const lastRoomIdRef = useRef<string | null>(null);

 useEffect(() => {
  if (!user || !firestore || !auth) return;

  const userRef = doc(firestore, 'users', user.uid);
  const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

  const setPresence = (online: boolean) => {
   if (!auth.currentUser || !navigator.onLine) return;

   const data = { 
    isOnline: online, 
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp() 
   };
   
   setDocumentNonBlocking(userRef, data, { merge: true });
   setDocumentNonBlocking(profileRef, data, { merge: true });
  };

  setPresence(true);

  const startHeartbeat = () => {
   if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
   heartbeatTimer.current = setInterval(() => {
    setPresence(true);
   }, 30000);
  };

  startHeartbeat();

  const handleVisibilityChange = () => {
   if (document.visibilityState === 'visible') {
    setPresence(true);
    startHeartbeat();
   }
  };

  const handleBeforeUnload = () => {
   setPresence(false);
  };

  // SAFETY NET: Listen for auth state changes (logout, session expiry, app crash)
  const handleAuthStateChange = async (currentUser: any) => {
   if (!currentUser && lastRoomIdRef.current && firestore) {
    // User logged out or session expired while in a room
    const uid = user.uid;
    const roomId = lastRoomIdRef.current;
    
    try {
     const userDoc = await getDoc(userRef);
     const currentRoomId = userDoc.data()?.currentRoomId;
     
     if (currentRoomId) {
      const roomRef = doc(firestore, 'chatRooms', currentRoomId);
      const participantRef = doc(firestore, 'chatRooms', currentRoomId, 'participants', uid);
      
      deleteDocumentNonBlocking(participantRef);
      setDocumentNonBlocking(roomRef, { 
       participantCount: increment(-1), 
       updatedAt: serverTimestamp() 
      }, { merge: true });
     }

     setDocumentNonBlocking(userRef, { 
      isOnline: false, 
      currentRoomId: null, 
      updatedAt: serverTimestamp() 
     }, { merge: true });
     setDocumentNonBlocking(profileRef, { 
      isOnline: false, 
      currentRoomId: null, 
      updatedAt: serverTimestamp() 
     }, { merge: true });
    } catch (e) {
     console.warn('[Presence] Safety net cleanup failed:', e);
    }
   }
  };

  const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
   unsubscribe();
   if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
   window.removeEventListener('beforeunload', handleBeforeUnload);
   document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
 }, [user?.uid, firestore, auth]);

 // Track current room ID for safety net
 useEffect(() => {
  if (!user || !firestore) return;
  
  const userRef = doc(firestore, 'users', user.uid);
  const checkRoom = async () => {
   try {
    const snap = await getDoc(userRef);
    const data = snap.data();
    if (data?.currentRoomId) {
     lastRoomIdRef.current = data.currentRoomId;
    }
   } catch (e) {}
  };
  
  checkRoom();
  const interval = setInterval(checkRoom, 15000);
  return () => clearInterval(interval);
 }, [user?.uid, firestore]);

 return null;
}
