'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

/**
 * Production Profile Initializer.
 * Re-engineered for the Dual-ID Protocol, Automated 7-Day Asset Expiration,
 * and the HIGH-FIDELITY PERIODIC RANKING RESET at 11:59:59 (GMT +5:30 IST).
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
        const getISTDateParts = (date: Date) => {
          const istStr = date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
          const istDate = new Date(istStr);
          return {
            fullDate: istDate.toDateString(),
            month: istDate.getMonth(),
            year: istDate.getFullYear(),
            day: istDate.getDay() // 0=Sun, 1=Mon
          };
        };

        // Determine if it's a new week (Monday rollover)
        const isStartOfWeek = (d: Date) => {
          const parts = getISTDateParts(d);
          return parts.day === 1; // Monday
        };

        const now = new Date();
        const nowIST = getISTDateParts(now);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastSeen = userData.lastSeen?.toDate?.() || new Date(0);
          const lastIST = getISTDateParts(lastSeen);
          
          const batch = writeBatch(firestore);
          const userSummaryRef = doc(firestore, 'users', profileId);
          const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);

          const resetData: any = { updatedAt: serverTimestamp() };
          let needsReset = false;

          // --- DAILY RESET ---
          if (nowIST.fullDate !== lastIST.fullDate) {
            needsReset = true;
            resetData['wallet.dailySpent'] = 0;
            resetData['stats.dailyGiftsReceived'] = 0;
            resetData['stats.dailyGameWins'] = 0;
            resetData['stats.dailyFans'] = 0;
          }

          // --- WEEKLY RESET (Monday 00:00:00 IST) ---
          // If the day changed and it's Monday, or if we skipped a whole week
          const dayDiff = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
          if ((nowIST.fullDate !== lastIST.fullDate && nowIST.day === 1) || dayDiff >= 7) {
            needsReset = true;
            resetData['wallet.weeklySpent'] = 0;
            resetData['stats.weeklyGiftsReceived'] = 0;
            resetData['stats.weeklyGameWins'] = 0;
          }

          // --- MONTHLY RESET ---
          if (nowIST.month !== lastIST.month || nowIST.year !== lastIST.year) {
            needsReset = true;
            resetData['wallet.monthlySpent'] = 0;
            resetData['stats.monthlyGiftsReceived'] = 0;
            resetData['stats.monthlyGameWins'] = 0;
          }

          if (needsReset) {
            console.log(`[Ranking Sync] Rollover Detected. Purging stale periods.`);
            batch.update(userSummaryRef, resetData);
            batch.update(profileRef, resetData);
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
