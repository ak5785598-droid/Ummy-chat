'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

/**
 * Production Profile Initializer.
 * Re-engineered for the Dual-ID Protocol and Automated Periodic Resets.
 * Hardened for mobile compatibility by using UTC-offset based IST calculations.
 * ASSET AUDIT: Handles expiration of frames, themes, and vehicles.
 */
export function ProfileInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const hasInitialized = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !firestore || hasInitialized.current === user.uid) return;

    const initProfile = async () => {
      const profileId = user.uid;
      
      try {
        const getISTParts = (date: Date) => {
          const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
          const ist = new Date(utc + (3600000 * 5.5));
          return {
            fullDate: ist.toDateString(),
            month: ist.getMonth(),
            year: ist.getFullYear(),
            day: ist.getDay()
          };
        };

        const now = new Date();
        const nowIST = getISTParts(now);

        const userRef = doc(firestore, 'users', profileId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastSeen = userData.lastSeen?.toDate?.() || new Date(0);
          const lastIST = getISTParts(lastSeen);
          
          const batch = writeBatch(firestore);
          const userSummaryRef = doc(firestore, 'users', profileId);
          const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);

          const resetData: any = { updatedAt: serverTimestamp() };
          let needsReset = false;

          // --- PERIODIC LEDGER RESETS (IST) ---
          if (nowIST.fullDate !== lastIST.fullDate) {
            needsReset = true;
            resetData['wallet.dailySpent'] = 0;
            resetData['stats.dailyGiftsReceived'] = 0;
            resetData['stats.dailyGameWins'] = 0;
            resetData['stats.dailyFans'] = 0;
          }

          if ((nowIST.fullDate !== lastIST.fullDate && nowIST.day === 1) || (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24) >= 7) {
            needsReset = true;
            resetData['wallet.weeklySpent'] = 0;
            resetData['stats.weeklyGiftsReceived'] = 0;
            resetData['stats.weeklyGameWins'] = 0;
          }

          if (nowIST.month !== lastIST.month || nowIST.year !== lastIST.year) {
            needsReset = true;
            resetData['wallet.monthlySpent'] = 0;
            resetData['stats.monthlyGiftsReceived'] = 0;
            resetData['stats.monthlyGameWins'] = 0;
          }

          if (needsReset) {
            batch.update(userSummaryRef, resetData);
            batch.update(profileRef, resetData);
          }

          // --- ASSET EXPIRATION AUDIT ---
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profData = profileSnap.data();
            const expiries = profData.inventory?.expiries || {};
            const ownedItems = profData.inventory?.ownedItems || [];
            const activeFrame = profData.inventory?.activeFrame;
            const activeTheme = profData.inventory?.activeTheme;

            let hasExpiredItems = false;
            const updatedOwnedItems = [...ownedItems];
            const updatedExpiries = { ...expiries };
            let updatedActiveFrame = activeFrame;
            let updatedActiveTheme = activeTheme;

            Object.entries(expiries).forEach(([itemId, expiry]: [string, any]) => {
              if (expiry && expiry.toDate() < now) {
                hasExpiredItems = true;
                const idx = updatedOwnedItems.indexOf(itemId);
                if (idx > -1) updatedOwnedItems.splice(idx, 1);
                delete updatedExpiries[itemId];
                
                if (updatedActiveFrame === itemId) updatedActiveFrame = 'None';
                if (updatedActiveTheme === itemId) updatedActiveTheme = 'Default';
              }
            });

            if (hasExpiredItems) {
              const expireUpdate = {
                'inventory.ownedItems': updatedOwnedItems,
                'inventory.expiries': updatedExpiries,
                'inventory.activeFrame': updatedActiveFrame,
                'inventory.activeTheme': updatedActiveTheme,
                'updatedAt': serverTimestamp()
              };
              batch.update(userSummaryRef, expireUpdate);
              batch.update(profileRef, expireUpdate);
            }
          }
          
          batch.update(userSummaryRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          batch.update(profileRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          
          await batch.commit();
          hasInitialized.current = profileId;
        }
      } catch (e: any) {
        console.error("[Identity Sync] Initialization Error:", e);
      }
    };

    initProfile();
  }, [user, firestore]);

  return null;
}
