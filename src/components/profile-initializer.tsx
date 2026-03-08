'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, collection, increment, writeBatch } from 'firebase/firestore';

/**
 * Production Profile Initializer.
 * GHOST IDENTITY RECOVERY: 
 * If a user returns and has a stale currentRoomId, we perform an immediate physical cleanup 
 * of the previous frequency participant record before allowing a new entry.
 * REGISTRATION GUARD: Synchronized counter update allows unique sequence ID generation.
 * ACCOUNT NUMBER SYNC: Persists the original sequential ID for future restoration.
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
        
        // 1. GHOST IDENTITY RECOVERY PROTOCOL
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const staleRoomId = userData.currentRoomId;
          
          if (staleRoomId) {
            console.log(`[Identity Sync] Commencing absolute purge of stale presence in room: ${staleRoomId}`);
            try {
              const batch = writeBatch(firestore);
              const roomDocRef = doc(firestore, 'chatRooms', staleRoomId);
              const participantRef = doc(firestore, 'chatRooms', staleRoomId, 'participants', profileId);
              const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);
              
              batch.update(roomDocRef, { 
                participantCount: increment(-1), 
                updatedAt: serverTimestamp() 
              });
              batch.delete(participantRef);
              batch.update(userRef, { 
                currentRoomId: null, 
                isOnline: true, 
                lastSeen: serverTimestamp(),
                updatedAt: serverTimestamp() 
              });
              batch.update(profileRef, { 
                currentRoomId: null, 
                isOnline: true, 
                lastSeen: serverTimestamp(),
                updatedAt: serverTimestamp() 
              });
              
              await batch.commit();
              console.log(`[Identity Sync] Stale presence successfully terminated.`);
            } catch (e) {
              console.warn(`[Identity Sync] Cleanup handshake aborted:`, e);
            }
          } else {
            const pulseBatch = writeBatch(firestore);
            const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);
            pulseBatch.update(userRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
            pulseBatch.update(profileRef, { isOnline: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() });
            await pulseBatch.commit();
          }
          
          hasInitialized.current = profileId;
          return;
        }

        // 2. NEW IDENTITY CREATION
        hasInitialized.current = profileId;

        const finalData = await runTransaction(firestore, async (transaction) => {
          const countersRef = doc(firestore, 'appConfig', 'counters');
          const countersSnap = await transaction.get(countersRef);
          let nextUserId = 1;

          if (countersSnap.exists()) {
            const current = countersSnap.data().userCounter || 0;
            nextUserId = current + 1;
          }

          transaction.set(countersRef, { userCounter: nextUserId }, { merge: true });
          const specialId = String(nextUserId).padStart(3, '0');

          const initialData = {
            id: profileId,
            specialId: specialId,
            accountNumber: specialId, // THE ANCHOR IDENTITY: Stored for future reversion
            username: user.displayName || `Tribe_${specialId}`,
            avatarUrl: user.photoURL || '', 
            email: user.email || '',
            bio: 'Synchronized with the Ummy frequency.',
            gender: null,
            country: null,
            currentRoomId: null,
            isOnline: true,
            lastSeen: serverTimestamp(),
            wallet: { 
              coins: 1000000, 
              diamonds: 0,
              totalSpent: 0,
              dailySpent: 0 
            },
            inventory: { ownedItems: [], activeFrame: 'f5', activeBubble: 'Default' },
            stats: { followers: 0, fans: 0, dailyFans: 0 },
            level: { rich: 1, charm: 1 },
            tags: ['Tribe Member'], 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isNewUser: true,
          };

          return initialData;
        });

        const userSummaryRef = doc(firestore, 'users', profileId);
        const userProfileRef = doc(firestore, 'users', profileId, 'profile', profileId);

        await setDoc(userSummaryRef, {
          id: profileId,
          specialId: finalData.specialId,
          accountNumber: finalData.accountNumber,
          username: finalData.username,
          avatarUrl: finalData.avatarUrl,
          wallet: finalData.wallet,
          stats: finalData.stats,
          level: finalData.level,
          tags: finalData.tags, 
          isOnline: true,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
          joinedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(userProfileRef, finalData, { merge: true });

        addDocumentNonBlocking(collection(firestore, 'users', profileId, 'notifications'), {
          title: 'Welcome Reward',
          content: `Welcome! Your Tribal ID is ${finalData.specialId}.`,
          type: 'system',
          timestamp: serverTimestamp(),
          isRead: false
        });

      } catch (e: any) {
        hasInitialized.current = null; 
        console.error("Initialization Error:", e);
      }
    };

    initProfile();
  }, [user, firestore]);

  return null;
}
