'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, collection, increment, writeBatch } from 'firebase/firestore';

/**
 * Production Profile Initializer.
 * Re-engineered for the Dual-ID Protocol:
 * 1. Automatic 8-digit Account Number (e.g. 10046272) using staggered increments.
 * 2. Special 3-digit ID remains NULL until manually assigned by Admin.
 */
export function ProfileInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const hasInitialized = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !firestore || hasInitialized.current === user.uid) return;

    const initProfile = async () => {
      const profileId = user.uid;
      const userRef = doc(firestore, 'users', profileId);
      
      try {
        const userSnap = await getDoc(userRef);
        
        // 1. IDENTITY SYNC & RECOVERY
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const staleRoomId = userData.currentRoomId;
          const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);
          
          if (staleRoomId) {
            console.log(`[Identity Sync] Purging stale room reference: ${staleRoomId}`);
            try {
              const batch = writeBatch(firestore);
              const roomDocRef = doc(firestore, 'chatRooms', staleRoomId);
              const participantRef = doc(firestore, 'chatRooms', staleRoomId, 'participants', profileId);
              
              batch.update(roomDocRef, { participantCount: increment(-1), updatedAt: serverTimestamp() });
              batch.delete(participantRef);
              batch.update(userRef, { currentRoomId: null, isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
              batch.update(profileRef, { currentRoomId: null, isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
              await batch.commit();
            } catch (e) {
              console.warn(`[Identity Sync] Background cleanup handshake aborted.`);
            }
          } else {
            const pulseBatch = writeBatch(firestore);
            pulseBatch.update(userRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
            pulseBatch.update(profileRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
            await pulseBatch.commit();
          }
          
          hasInitialized.current = profileId;
          return;
        }

        // 2. NEW IDENTITY REGISTRATION (Staggered 8-digit Account ID)
        hasInitialized.current = profileId;

        const finalData = await runTransaction(firestore, async (transaction) => {
          const countersRef = doc(firestore, 'appConfig', 'counters');
          const countersSnap = await transaction.get(countersRef);
          
          let nextAccBase = 10000000;
          if (countersSnap.exists() && countersSnap.data().accCounter) {
            nextAccBase = countersSnap.data().accCounter;
          }

          // Generate a non-sequential but unique 8-digit step
          // Adding a random step between 1000 and 9999 makes the IDs look "different" as requested
          const randomStep = Math.floor(Math.random() * 9000) + 1000; 
          const newAccCounter = nextAccBase + randomStep;
          const accountNumber = String(newAccCounter);

          transaction.set(countersRef, { accCounter: newAccCounter }, { merge: true });

          return {
            id: profileId,
            specialId: null, // RESTRICTED: Admin only assignment
            accountNumber: accountNumber,
            username: user.displayName || `Tribe_${accountNumber}`,
            avatarUrl: user.photoURL || '', 
            email: user.email || '',
            bio: 'Synchronized with the Ummy frequency.',
            isOnline: true,
            lastSeen: serverTimestamp(),
            wallet: { coins: 1000000, diamonds: 0, totalSpent: 0, dailySpent: 0 },
            inventory: { ownedItems: [], activeFrame: 'f5', activeBubble: 'Default' },
            stats: { followers: 0, fans: 0, dailyFans: 0, friends: 0, following: 0 },
            level: { rich: 1, charm: 1 },
            tags: ['Tribe Member'], 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
        });

        const userSummaryRef = doc(firestore, 'users', profileId);
        const userProfileRef = doc(firestore, 'users', profileId, 'profile', profileId);

        await setDoc(userSummaryRef, {
          id: profileId,
          specialId: null,
          accountNumber: finalData.accountNumber,
          username: finalData.username,
          avatarUrl: finalData.avatarUrl,
          wallet: finalData.wallet,
          isOnline: true,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(userProfileRef, finalData, { merge: true });

        addDocumentNonBlocking(collection(firestore, 'users', profileId, 'notifications'), {
          title: 'Tribe Established',
          content: `Welcome to Ummy! Your Tribal ID is ${finalData.accountNumber}.`,
          type: 'system',
          timestamp: serverTimestamp(),
          isRead: false
        });

      } catch (e: any) {
        hasInitialized.current = null; 
        console.error("[Identity Sync] Fatal Error:", e);
      }
    };

    initProfile();
  }, [user, firestore]);

  return null;
}
