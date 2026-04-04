'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useRoomContext } from '@/components/room-provider';
import { doc, increment, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

/**
 * QuestTracker - Background monitor for Daily Quests.
 * In a real-time app, this handles progress syncing without user intervention.
 */
export function QuestTracker() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeRoom } = useRoomContext();
  const pathname = usePathname();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !firestore) return;

    // 1. Initial Reset Check
    const checkReset = async () => {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const snap = await getDoc(userRef);
      const data = snap.data();
      
      const lastReset = data?.lastQuestReset?.toDate() || new Date(0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (lastReset < today) {
        // Reset Quests in Firestore
        const quests = [
          { id: 'stay_15', current: 0, target: 15, isClaimed: false },
          { id: 'send_gift', current: 0, target: 1, isClaimed: false },
          { id: 'win_game', current: 0, target: 1, isClaimed: false }
        ];

        for (const quest of quests) {
          await setDoc(doc(firestore, 'users', user.uid, 'quests', quest.id), {
            ...quest,
            updatedAt: serverTimestamp()
          });
        }

        await updateDocumentNonBlocking(userRef, { lastQuestReset: serverTimestamp() });
        await updateDocumentNonBlocking(profileRef, { lastQuestReset: serverTimestamp() });
      }
    };

    checkReset();
  }, [user, firestore]);

  useEffect(() => {
    if (!user || !firestore || !activeRoom) return;

    // 2. Incremental "Stay in Room" Progress
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 60000) { // Every 1 minute
        const questRef = doc(firestore, 'users', user.uid, 'quests', 'stay_15');
        
        // Atomic increment of progress
        getDoc(questRef).then(snap => {
          if (snap.exists() && snap.data().current < snap.data().target) {
            updateDocumentNonBlocking(questRef, { 
              current: increment(1),
              updatedAt: serverTimestamp()
            });
          }
        });
        
        lastUpdateRef.current = now;
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [user, firestore, activeRoom]);

  return null;
}
