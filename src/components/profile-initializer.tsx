'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, serverTimestamp, writeBatch, setDoc, runTransaction } from 'firebase/firestore';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * Production Profile Initializer.
 * Re-engineered for mobile-safe IST (GMT+5:30) synchronization.
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
     // Manual IST offset for mobile browsers that fail on timeZone option
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
     
     // BAN FREQUENCY CHECK: Prevent permission errors for restricted accounts
     const banStatus = userData.banStatus;
     if (banStatus?.isBanned) {
      const bannedUntil = banStatus.bannedUntil?.toDate?.() || null;
      if (!bannedUntil || bannedUntil > now) {
       console.log("[Identity Sync] Restricted frequency detected.");
       hasInitialized.current = profileId;
       return;
      }
     }

     const lastSeen = userData.lastSeen?.toDate?.() || new Date(0);
     const lastIST = getISTParts(lastSeen);
     
     const batch = writeBatch(firestore);
     const resetData: any = { updatedAt: serverTimestamp() };
     let needsReset = false;

     // IST PERIODIC RESET SYNC
     if (nowIST.fullDate !== lastIST.fullDate) {
      needsReset = true;
      resetData['wallet.dailySpent'] = 0;
      resetData['stats.dailyGiftsReceived'] = 0;
      resetData['stats.dailyGifts'] = 0;
      resetData['stats.dailyGameWins'] = 0;
      resetData['stats.dailyFans'] = 0;
     }

     // Weekly Reset (Monday)
     if ((nowIST.fullDate !== lastIST.fullDate && nowIST.day === 1)) {
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
      batch.set(userRef, resetData, { merge: true });
      batch.set(profileRef, resetData, { merge: true });
     }

     // Heartbeat Handshake
     batch.set(userRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
     batch.set(profileRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
     
     await batch.commit();

     // 1. SEQUENTIAL USER ID HANDSHAKE
     const currentAccNum = userData.accountNumber || '';
     const needsUserSync = !currentAccNum || currentAccNum.length !== 4 || isNaN(parseInt(currentAccNum)) || (user.uid === CREATOR_ID && currentAccNum !== '0000');

     if (needsUserSync) {
       const counterRef = doc(firestore, 'appConfig', 'counters');
       await runTransaction(firestore, async (transaction) => {
         const counterDoc = await transaction.get(counterRef);
         let nextUserId = 1;

         if (user.uid === CREATOR_ID) {
           nextUserId = 0;
         } else {
           const lastId = counterDoc.data()?.lastUserId;
           if (lastId === undefined || lastId > 5000) nextUserId = 1;
           else nextUserId = lastId + 1;
         }

         const paddedId = nextUserId.toString().padStart(4, '0');
         const newCounterValue = user.uid === CREATOR_ID ? (counterDoc.data()?.lastUserId || 0) : nextUserId;
         transaction.set(counterRef, { lastUserId: newCounterValue }, { merge: true });
         transaction.set(userRef, { accountNumber: paddedId, updatedAt: serverTimestamp() }, { merge: true });
         transaction.set(profileRef, { accountNumber: paddedId, updatedAt: serverTimestamp() }, { merge: true });
       });
       console.log(`✅ Sequential User ID Synced: ${user.uid}`);
     }

     // 2. ROOM ID HANDSHAKE
     const roomRef = doc(firestore, 'chatRooms', user.uid);
     const roomSnap = await getDoc(roomRef);
     if (roomSnap.exists()) {
       const currentRoomNum = roomSnap.data().roomNumber;
       const needsRoomSync = !currentRoomNum || parseInt(currentRoomNum) < 100 || currentRoomNum.length > 4 || (user.uid === CREATOR_ID && currentRoomNum !== '100');
       
       if (needsRoomSync) {
         const counterRef = doc(firestore, 'appConfig', 'counters');
         await runTransaction(firestore, async (transaction) => {
           const counterDoc = await transaction.get(counterRef);
           let nextRoomId = 101;

           if (user.uid === CREATOR_ID) {
             nextRoomId = 100;
           } else {
             const lastId = counterDoc.data()?.lastRoomId;
             if (lastId === undefined || lastId < 100 || lastId > 10000) nextRoomId = 101;
             else nextRoomId = lastId + 1;
           }

           const newCounterValue = user.uid === CREATOR_ID ? (counterDoc.data()?.lastRoomId || 100) : nextRoomId;
           transaction.set(counterRef, { lastRoomId: newCounterValue }, { merge: true });
           transaction.set(roomRef, { roomNumber: nextRoomId.toString(), updatedAt: serverTimestamp() }, { merge: true });
         });
         console.log(`✅ Sequential Room ID Synced: ${user.uid}`);
       }
     }

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