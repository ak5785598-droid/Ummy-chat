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

      try {
        const currentAccNum = String(userData.accountNumber || '');
        
        // STRICT CHECK: Sirf wahi IDs allow hongi jo exactly 6 digits ki numeric ho
        // EXCEPTION: Creator ke liye 0000 ID mandatory hai
        const isStrictlySixDigits = /^\d{6}$/.test(currentAccNum);
        
        // Agar ID exist nahi karti, ya usme alphabets hain, ya Creator ID '0000' nahi hai, toh sync trigger hoga
        const needsUserSync = (user.uid === CREATOR_ID && currentAccNum !== '0000') || (user.uid !== CREATOR_ID && (!currentAccNum || !isStrictlySixDigits));

        if (needsUserSync) {
          await runTransaction(firestore, async (transaction) => {
            let newId = '';
            let idFound = false;

            if (user.uid === CREATOR_ID) {
              newId = '0000';
              const creatorRef = doc(firestore, 'assigned_ids', newId);
              const docSnap = await transaction.get(creatorRef);
              if (!docSnap.exists()) {
                transaction.set(creatorRef, { uid: user.uid, assignedAt: serverTimestamp() });
              }
            } else {
              // ULTRA-FAST STRICT 6-DIGIT GENERATOR (100000 se 999999 ke beech)
              while (!idFound) {
                const tempId = Math.floor(100000 + Math.random() * 900000).toString();

                const idRef = doc(firestore, 'assigned_ids', tempId);
                const idDoc = await transaction.get(idRef);

                if (!idDoc.exists()) {
                  transaction.set(idRef, { uid: user.uid, assignedAt: serverTimestamp() });
                  newId = tempId;
                  idFound = true;
                }
              }
            }

            transaction.set(userRef, { accountNumber: newId, updatedAt: serverTimestamp() }, { merge: true });
            transaction.set(profileRef, { accountNumber: newId, updatedAt: serverTimestamp() }, { merge: true });
          });
          console.log(`✅ Strictly 6-Digit Number ID Synced: ${user.uid}`);
        }
      } catch (e: any) {
        const isAssignedIdsError = e?.message?.includes('assigned_ids');
        if (e?.code === 'permission-denied') {
          if (!isAssignedIdsError) {
            console.warn("[Identity Sync] ID access restricted (403). Profile using defaults.");
          }
        } else {
          console.error("[Identity Sync] User ID Error:", e);
        }
      }

      // Room ID logic bilkul waisa hi hai jaisa tha
      try {
        const roomRef = doc(firestore, 'chatRooms', user.uid);
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
          const currentRoomNum = roomSnap.data().roomNumber;
          const needsRoomSync = !currentRoomNum || (user.uid === CREATOR_ID && currentRoomNum !== '100');
          
          if (needsRoomSync) {
            const counterRef = doc(firestore, 'appConfig', 'counters');
            await runTransaction(firestore, async (transaction) => {
              const counterDoc = await transaction.get(counterRef);
              let nextRoomId = 101;

               if (user.uid === CREATOR_ID) {
                 nextRoomId = 100;
               } else {
                 const lastId = counterDoc.data()?.lastRoomId || 100;
                 nextRoomId = lastId + 1;
               }

               const newCounterValue = user.uid === CREATOR_ID ? (counterDoc.data()?.lastRoomId || 100) : nextRoomId;
              transaction.set(counterRef, { lastRoomId: newCounterValue }, { merge: true });
              transaction.set(roomRef, { roomNumber: nextRoomId.toString(), updatedAt: serverTimestamp() }, { merge: true });
            });
            console.log(`✅ Sequential Room ID Synced: ${user.uid}`);
          }
        }
      } catch (e: any) {
        if (e?.code === 'permission-denied') {
          console.warn("[Identity Sync] Room ID access restricted (403).");
        } else {
          console.error("[Identity Sync] Room ID Error:", e);
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
