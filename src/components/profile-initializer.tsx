
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Production Profile Initializer.
 * Assigns a unique sequential 6-digit numeric ID (starting from 100,000).
 * Ensuring that once avatarUrl is set, it is NEVER overwritten by initializer defaults.
 */
export function ProfileInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const hasInitialized = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !firestore || hasInitialized.current === user.uid) return;

    const initProfile = async () => {
      const profileId = user.uid;
      const userRef = doc(firestore, 'users', profileId);
      
      try {
        // Critical: Check existence FIRST to prevent overwriting user-selected images or data
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          hasInitialized.current = profileId;
          return;
        }

        hasInitialized.current = profileId;

        // Atomic Transaction for unique 6-digit ID assignment
        const finalData = await runTransaction(firestore, async (transaction) => {
          const countersRef = doc(firestore, 'appConfig', 'counters');
          const countersSnap = await transaction.get(countersRef);
          let nextUserId = 100000;

          if (countersSnap.exists()) {
            const current = countersSnap.data().userCounter || 99999;
            nextUserId = current + 1;
          }

          transaction.set(countersRef, { userCounter: nextUserId }, { merge: true });

          const initialData = {
            id: profileId,
            specialId: String(nextUserId),
            username: user.displayName || `Tribe_${String(nextUserId).substring(2)}`,
            avatarUrl: user.photoURL || '', 
            email: user.email || '',
            bio: 'Synchronized with the Ummy frequency.',
            wallet: { 
              coins: 100000000, 
              diamonds: 0,
              totalSpent: 0,
              dailySpent: 0 
            },
            inventory: { ownedItems: [], activeFrame: 'None', activeBubble: 'Default' },
            stats: { followers: 0, fans: 0 },
            level: { rich: 1, charm: 1 },
            tags: ['Admin', 'Official', 'Tribe Member'], 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            details: {
              gender: 'Secret',
              hometown: 'India',
              age: 22
            }
          };

          return initialData;
        });

        // Split document for indexing vs full profile
        const userSummaryRef = doc(firestore, 'users', profileId);
        const userProfileRef = doc(firestore, 'users', profileId, 'profile', profileId);

        await setDoc(userSummaryRef, {
          id: profileId,
          specialId: finalData.specialId,
          username: finalData.username,
          avatarUrl: finalData.avatarUrl,
          wallet: finalData.wallet,
          stats: finalData.stats,
          level: finalData.level,
          tags: finalData.tags, 
          updatedAt: serverTimestamp(),
          joinedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(userProfileRef, finalData, { merge: true });

        addDocumentNonBlocking(collection(firestore, 'users', profileId, 'notifications'), {
          title: 'Welcome to the Tribe!',
          content: `Your unique Tribe ID is ${finalData.specialId}. We've gifted you 100,000,000 Gold Coins to explore the Boutique!`,
          type: 'system',
          timestamp: serverTimestamp(),
          isRead: false
        });

      } catch (e: any) {
        hasInitialized.current = null; 
        console.error("Initialization Error:", e);
        if (e.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${user.uid}`,
            operation: 'create',
          }));
        }
      }
    };

    initProfile();
  }, [user, firestore]);

  return null;
}
