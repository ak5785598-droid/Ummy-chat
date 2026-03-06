'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

/**
 * Elite Global Presence Manager.
 * Synchronizes the user's online status with the tribal graph in real-time.
 * HEARTBEAT: Updates online pulse every 30s to detect app-cuts.
 */
export function GlobalPresenceManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !firestore) return;

    const userRef = doc(firestore, 'users', user.uid);
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

    const setPresence = (online: boolean) => {
      const data = { isOnline: online, updatedAt: serverTimestamp() };
      setDocumentNonBlocking(userRef, data, { merge: true });
      setDocumentNonBlocking(profileRef, data, { merge: true });
    };

    // Initial Handshake: Online
    setPresence(true);

    // Global Pulse Engine
    heartbeatTimer.current = setInterval(() => {
      setPresence(true);
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setPresence(true);
      }
    };

    const handleBeforeUnload = () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      setPresence(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      setPresence(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, firestore]);

  return null;
}
