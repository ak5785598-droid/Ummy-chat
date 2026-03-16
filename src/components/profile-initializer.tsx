'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, collection, increment, writeBatch, Timestamp } from 'firebase/firestore';

/**
 * Production Profile Initializer.
 * Re-engineered for the Dual-ID Protocol, Automated 7-Day Asset Expiration,
 * and the HIGH-FIDELITY DAILY RANKING RESET at 11:59:59.
 */
export function ProfileInitializer() {
  const { user } = userHook();
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
          const lastSeen = userData.lastSeen?.toDate?.() || new Date(0);
          const now = new Date();
          
          // --- DAILY RANKING RESET PROTOCOL ---
          // Check if the last activity was on a previous calendar day
          const isNewDay = lastSeen.getDate() !== now.getDate() || 
                           lastSeen.getMonth() !== now.getMonth() || 
                           lastSeen.getFullYear() !== now.getFullYear();

          const batch = writeBatch(firestore);
          const userSummaryRef = doc(firestore, 'users', profileId);
          const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);

          if (isNewDay) {
            console.log(`[Ranking Sync] 11:59:59 Rollover Detected. Purging daily coin ledgers.`);
            const dailyResetData = {
              'wallet.dailySpent': 0,
              'stats.dailyGiftsReceived': 0,
              'stats.dailyGameWins': 0,
              'stats.dailyFans': 0,
              'updatedAt': serverTimestamp()
            };
            batch.update(userSummaryRef, dailyResetData);
            batch.update(profileRef, dailyResetData);
          }

          // --- TEMPORAL ASSET AUDIT PROTOCOL (7-Day Expiry) ---
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profData = profileSnap.data();
            const expiries = profData.inventory?.expiries || {};
            const ownedItems = profData.inventory?.ownedItems || [];
            const activeFrame = profData.inventory?.activeFrame;

            let hasExpiredItems = false;
            const updatedOwnedItems = [...ownedItems];
            const updatedExpiries = { ...expiries };
            let updatedActiveFrame = activeFrame;

            Object.entries(expiries).forEach(([itemId, expiry]: [string, any]) => {
              if (expiry && expiry.toDate() < now) {
                hasExpiredItems = true;
                const idx = updatedOwnedItems.indexOf(itemId);
                if (idx > -1) updatedOwnedItems.splice(idx, 1);
                delete updatedExpiries[itemId];
                if (updatedActiveFrame === itemId) updatedActiveFrame = 'None';
              }
            });

            if (hasExpiredItems) {
              const expireData = {
                'inventory.ownedItems': updatedOwnedItems,
                'inventory.expiries': updatedExpiries,
                'inventory.activeFrame': updatedActiveFrame,
                'updatedAt': serverTimestamp()
              };
              batch.update(userSummaryRef, expireData);
              batch.update(profileRef, expireData);
            }
          }
          
          // Cleanup stale room participation
          const staleRoomId = userData.currentRoomId;
          if (staleRoomId) {
            const roomDocRef = doc(firestore, 'chatRooms', staleRoomId);
            const participantRef = doc(firestore, 'chatRooms', staleRoomId, 'participants', profileId);
            batch.update(roomDocRef, { participantCount: increment(-1), updatedAt: serverTimestamp() });
            batch.delete(participantRef);
            batch.update(userSummaryRef, { currentRoomId: null });
            batch.update(profileRef, { currentRoomId: null });
          }

          // Heartbeat
          batch.update(userSummaryRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          batch.update(profileRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          
          await batch.commit();
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

          const randomStep = Math.floor(Math.random() * 9000) + 1000; 
          const newAccCounter = nextAccBase + randomStep;
          const accountNumber = String(newAccCounter);

          transaction.set(countersRef, { accCounter: newAccCounter }, { merge: true });

          return {
            id: profileId,
            specialId: null, 
            accountNumber: accountNumber,
            username: user.displayName || `Tribe_${accountNumber}`,
            avatarUrl: user.photoURL || '', 
            email: user.email || '',
            bio: 'Synchronized with the Ummy frequency.',
            isOnline: true,
            lastSeen: serverTimestamp(),
            wallet: { coins: 1000000, diamonds: 0, totalSpent: 0, dailySpent: 0 },
            inventory: { ownedItems: [], activeFrame: 'None', activeBubble: 'Default', expiries: {} },
            stats: { followers: 0, fans: 0, dailyFans: 0, dailyGiftsReceived: 0, dailyGameWins: 0, friends: 0, following: 0 },
            level: { rich: 1, charm: 1 },
            tags: [], 
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

// Internal helper to avoid direct useUser call cycle if needed
function userHook() {
  const { user, isUserLoading } = useUser();
  return { user, isUserLoading };
}
