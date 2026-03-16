'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, serverTimestamp, increment, writeBatch } from 'firebase/firestore';

/**
 * Production Profile Initializer.
 * Re-engineered for the Dual-ID Protocol, Automated 7-Day Asset Expiration,
 * and the HIGH-FIDELITY DAILY RANKING RESET at 11:59:59 (GMT +5:30 IST).
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
        
        // --- IST HELPER PROTOCOL ---
        const getISTDateString = (date: Date) => {
          return new Intl.DateTimeFormat('en-GB', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(date);
        };

        const now = new Date();
        const currentISTDate = getISTDateString(now);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastSeen = userData.lastSeen?.toDate?.() || new Date(0);
          const lastISTDate = getISTDateString(lastSeen);
          
          const batch = writeBatch(firestore);
          const userSummaryRef = doc(firestore, 'users', profileId);
          const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);

          // --- DAILY RANKING RESET PROTOCOL (GMT +5:30 IST) ---
          if (lastISTDate !== currentISTDate) {
            console.log(`[Ranking Sync] IST 11:59:59 Rollover Detected (${lastISTDate} -> ${currentISTDate}). Purging daily ledgers.`);
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
          
          // Heartbeat and General Cleanup
          batch.update(userSummaryRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          batch.update(profileRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          
          await batch.commit();
          hasInitialized.current = profileId;
          return;
        }
      } catch (e: any) {
        hasInitialized.current = null; 
        console.error("[Identity Sync] Fatal Error:", e);
      }
    };

    initProfile();
  }, [user, firestore]);

  return null;
}