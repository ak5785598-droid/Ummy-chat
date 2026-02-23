'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Ensures a user profile exists in Firestore after login.
 * Assigns a unique sequential numeric ID (starting from 1001).
 * Synchronizes identity across root summary and detailed profile.
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
      const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);
      const userRef = doc(firestore, 'users', profileId);
      const countersRef = doc(firestore, 'appConfig', 'counters');
      
      try {
        const profileSnap = await getDoc(profileRef);
        hasInitialized.current = profileId;

        if (!profileSnap.exists()) {
          // Use transaction to get and increment the user ID counter starting at 1001
          const finalData = await runTransaction(firestore, async (transaction) => {
            const countersSnap = await transaction.get(countersRef);
            let nextUserId = 1001;

            if (countersSnap.exists()) {
              nextUserId = (countersSnap.data().userCounter || 1000) + 1;
            }

            transaction.set(countersRef, { userCounter: nextUserId }, { merge: true });

            const initialData = {
              id: profileId,
              specialId: String(nextUserId),
              username: user.displayName || `Ummy_${profileId.substring(0, 5)}`,
              avatarUrl: user.photoURL || `https://picsum.photos/seed/${profileId}/400`,
              email: user.email || '',
              bio: 'Vibing on the Ummy frequency! Join my tribe.',
              wallet: { 
                coins: 1500, 
                diamonds: 0,
                totalSpent: 0
              },
              inventory: { ownedItems: [], activeFrame: 'None', activeBubble: 'Default' },
              stats: { followers: 0, fans: 0 },
              level: { rich: 1, charm: 1 },
              tags: ['Newcomer'],
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

          // Background sync for detailed profile
          await setDoc(profileRef, finalData, { merge: true });
          
          // Background sync for user summary - REQUIRED for Security Rules & Global Rankings
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

          toast({
            title: 'Welcome to Ummy!',
            description: `Your Tribe ID is ${finalData.specialId}. Enjoy 1,500 free coins!`,
          });
        }
      } catch (e: any) {
        if (e.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            path: `users/${user.uid}`,
            operation: 'create',
          });
          errorEmitter.emit('permission-error', contextualError);
        }
      }
    };

    initProfile();
  }, [user, firestore, toast]);

  return null;
}
