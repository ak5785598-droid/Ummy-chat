'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useAuth, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

/**
 * Elite Global Presence Manager.
 * Synchronizes the user's online status with the tribal graph in real-time.
 */
export function GlobalPresenceManager() {
 const { user } = useUser();
 const auth = useAuth();
 const firestore = useFirestore();
 const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

 useEffect(() => {
  if (!user || !firestore || !auth) return;

  const userRef = doc(firestore, 'users', user.uid);
  const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

  const setPresence = (online: boolean) => {
   // PERMISSION GUARD: Ensure auth is active before background write
   if (!auth.currentUser) return;

   const data = { 
    isOnline: online, 
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp() 
   };
   
   setDocumentNonBlocking(userRef, data, { merge: true });
   setDocumentNonBlocking(profileRef, data, { merge: true });
  };

  setPresence(true);

  if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
  heartbeatTimer.current = setInterval(() => {
   setPresence(true);
  }, 20000);

  const handleVisibilityChange = () => {
   if (document.visibilityState === 'hidden') {
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    setPresence(false);
   } else {
    setPresence(true);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = setInterval(() => {
     setPresence(true);
    }, 20000);
   }
  };

  const handleBeforeUnload = () => {
   setPresence(false);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
   if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
   window.removeEventListener('beforeunload', handleBeforeUnload);
   document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
 }, [user?.uid, firestore, auth]);

 return null;
}
