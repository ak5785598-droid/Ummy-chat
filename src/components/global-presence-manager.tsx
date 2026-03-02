'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

/**
 * Elite Global Presence Manager.
 * Synchronizes the user's online status with the tribal graph in real-time.
 */
export function GlobalPresenceManager() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore) return;

    const userRef = doc(firestore, 'users', user.uid);
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

    const setPresence = (online: boolean) => {
      const data = { isOnline: online, updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(userRef, data);
      updateDocumentNonBlocking(profileRef, data);
    };

    // Initial Handshake: Online
    setPresence(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setPresence(true);
      } else {
        // Maintain online status while tab is open but backgrounded
      }
    };

    const handleBeforeUnload = () => setPresence(false);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      setPresence(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, firestore]);

  return null;
}
