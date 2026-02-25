
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
      const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);
      const countersRef = doc(firestore, 'appConfig', 'counters');
      
      try {
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          hasInitialized.current = profileId;
          return;
        }

        hasInitialized.current = profileId;

        // Atomic Transaction for unique 6-digit ID assignment
        const finalData = await runTransaction(firestore, async (transaction) => {
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
            avatarUrl: user.photoURL || `https://picsum.photos/seed/${profileId}/400`,
            email: user.email || '',
            bio: 'Synchronized with the Ummy frequency.',
            wallet: { 
              coins: 100000000, // Refilled to 100M for prototype testing
              diamonds: 0,
              totalSpent: 0,
              dailySpent: 0 // Track daily rich leaderboard
            },
            inventory: { ownedItems: [], activeFrame: 'None', activeBubble: 'Default' },
            stats: { followers: 0, fans: 0 },
            level: { rich: 1, charm: 1 },
            tags: ['Admin', 'Official', 'Tribe Member'], // Granted Admin for dev testing
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

        // Step 1: Set Root Identity (Essential for system-wide lookup)
        await setDoc(userRef, {
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

        // Step 2: Set Detailed Profile
        await setDoc(profileRef, finalData, { merge: true });

        // Step 3: Welcome Notification
        addDocumentNonBlocking(collection(firestore, 'users', profileId, 'notifications'), {
          title: 'Welcome to the Tribe!',
          content: `Your unique Tribe ID is ${finalData.specialId}. We've gifted you 100,000,000 Gold Coins to explore the Boutique!`,
          type: 'system',
          timestamp: serverTimestamp(),
          isRead: false
        });

      } catch (e: any) {
        hasInitialized.current = null; // Allow retry on failure
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
