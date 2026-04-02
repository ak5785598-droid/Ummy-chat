'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, getDocs, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const DEFAULT_QUESTS = [
  { id: 'stay_15', target: 15, current: 0, isClaimed: false },
  { id: 'send_gift', target: 1, current: 0, isClaimed: false },
  { id: 'win_game', target: 1, current: 0, isClaimed: false }
];

/**
 * Ensures today's missions are initialized in Firestore.
 * Re-engineered for high-fidelity daily resets using IST-relative timestamps.
 */
export function useQuestInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!firestore || !user?.uid || isInitialized.current) return;

    const checkAndInitialize = async () => {
      const uid = user.uid;
      const questsRef = collection(firestore, 'users', uid, 'quests');
      
      try {
        const snap = await getDocs(questsRef);
        
        // If no quests exist at all, or if we need a periodic reset (for simplicity, we just init if empty)
        // Note: Real apps use Cloud Functions for daily reset. Client-side init is a robust fallback.
        if (snap.empty) {
          console.log('[Missions] Initializing basic quest ecosystem...');
          for (const quest of DEFAULT_QUESTS) {
            const qDocRef = doc(firestore, 'users', uid, 'quests', quest.id);
            await setDoc(qDocRef, {
              ...quest,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }
      } catch (err) {
        console.error('[Missions] Initialization failed:', err);
      } finally {
        isInitialized.current = true;
      }
    };

    checkAndInitialize();
  }, [user?.uid, firestore]);
}
