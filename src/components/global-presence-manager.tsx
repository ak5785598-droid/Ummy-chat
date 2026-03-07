
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useAuth, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

/**
 * Elite Global Presence Manager.
 * Synchronizes the user's online status with the tribal graph in real-time.
 * PULSE PROTOCOL: Updates online heartbeat every 20s for high-fidelity detection.
 * RESILIENCE: Avoids teardown writes during route changes to prevent "auth null" permission errors.
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
      // PROTECTION: Ensure we are still authenticated before attempting a background write
      if (!auth.currentUser) return;

      const data = { 
        isOnline: online, 
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp() 
      };
      
      // Perform non-blocking sync to maintain UI fluidity
      setDocumentNonBlocking(userRef, data, { merge: true });
      setDocumentNonBlocking(profileRef, data, { merge: true });
    };

    // Initial Synchronization
    setPresence(true);

    // High-Frequency Pulse Engine (20s)
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = setInterval(() => {
      setPresence(true);
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Heartbeat pause on backgrounding
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        setPresence(false);
      } else {
        // Resume frequency on return
        setPresence(true);
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = setInterval(() => {
          setPresence(true);
        }, 20000);
      }
    };

    const handleBeforeUnload = () => {
      // Tab closure protocol - mark offline before hardware disconnect
      setPresence(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // CLEANUP PROTOCOL:
      // We ONLY clear intervals and listeners. We DO NOT mark offline here because
      // route changes trigger unmounts, and we want users to stay "online" between pages.
      // True disconnects are handled by beforeunload or the server-side timeout.
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uid, firestore, auth]);

  return null;
}
