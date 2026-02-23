'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, collection } from 'firebase/firestore';
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
      const userRef = doc(firestore, 'users', profileId);
      const profileRef = doc(firestore, 'users', profileId, 'profile', profileId);
      const countersRef = doc(firestore, 'appConfig', 'counters');
      
      try {
        const userSnap = await getDoc(userRef);
        
        // Prevent double initialization if document already exists
        if (userSnap.exists()) {
          hasInitialized.current = profileId;
          return;
        }

        hasInitialized.current = profileId;

        // 1. Atomically get and increment the sequential ID
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

        // 2. Synchronize root summary (Required for rules and leaderboards)
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

        // 3. Synchronize detailed profile
        await setDoc(profileRef, finalData, { merge: true });

        // 4. Send Welcome Message to user's local inbox
        addDocumentNonBlocking(collection(firestore, 'users', profileId, 'notifications'), {
          title: 'Welcome to the Tribe!',
          content: `Your unique Tribe ID is ${finalData.specialId}. We've gifted you 1,500 Gold Coins to get started in the Boutique!`,
          type: 'system',
          timestamp: serverTimestamp(),
          isRead: false
        });

        toast({
          title: 'Welcome to Ummy!',
          description: `Your Tribe ID is ${finalData.specialId}. Enjoy 1,500 free coins!`,
        });

      } catch (e: any) {
        hasInitialized.current = null;
        if (e.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${user.uid}`,
            operation: 'create',
          }));
        }
      }
    };

    initProfile();
  }, [user, firestore, toast]);

  return null;
}