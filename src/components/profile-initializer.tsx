'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * Production Profile Initializer.
 * Re-engineered for the Dual-ID Protocol and Automated Periodic Resets.
 * SECURITY SYNC: Handles banStatus gracefully to prevent security rule violations.
 */
export function ProfileInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const hasInitialized = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !firestore || hasInitialized.current === user.uid || user.uid === CREATOR_ID) return;

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
        const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);
        
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // --- BAN FREQUENCY CHECK ---
          // Prevent initialization writes for restricted accounts to avoid permission errors
          const banStatus = userData.banStatus;
          if (banStatus?.isBanned) {
            const bannedUntil = banStatus.bannedUntil?.toDate?.() || null;
            if (!bannedUntil || bannedUntil > now) {
              console.log("[Identity Sync] Restricted frequency detected. Synchronization deferred.");
              hasInitialized.current = profileId;
              return;
            }
          }

          const lastSeen = userData.lastSeen?.toDate?.() || new Date(0);
          const lastIST = getISTParts(lastSeen);
          
          const batch = writeBatch(firestore);
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

          // Weekly Reset (Monday)
          if ((nowIST.fullDate !== lastIST.fullDate && nowIST.day === 1) || (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24) >= 7) {
            needsReset = true;
            resetData['wallet.weeklySpent'] = 0;
            resetData['stats.weeklyGiftsReceived'] = 0;
            resetData['stats.weeklyGameWins'] = 0;
          }

          // Monthly Reset
          if (nowIST.month !== lastIST.month || nowIST.year !== lastIST.year) {
            needsReset = true;
            resetData['wallet.monthlySpent'] = 0;
            resetData['stats.monthlyGiftsReceived'] = 0;
            resetData['stats.monthlyGameWins'] = 0;
          }

          if (needsReset) {
            batch.update(userRef, resetData);
            batch.update(profileRef, resetData);
          }

          // Presence Handshake
          batch.update(userRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          batch.update(profileRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
          
          await batch.commit();
          hasInitialized.current = profileId;
        } else {
          // New User Handshake fallback (in case login handshake failed)
          console.warn("[Identity Sync] Missing user doc in initializer. Redirecting to Handshake.");
        }
      } catch (e: any) {
        console.error("[Identity Sync] Initialization Error:", e);
      }
    };

    initProfile();
  }, [user, firestore]);

  return null;
}