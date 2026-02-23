'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Production Profile Initializer.
 * Assigns a unique sequential numeric ID and standard starting balance.
 * Hardened: Synchronizes root identity before detailed profile for Security Rules compliance.
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
            bio: 'Synchronized with the Ummy frequency.',
            wallet: { 
              coins: 500, // Standard production starting bonus
              diamonds: 0,
              totalSpent: 0
            },
            inventory: { ownedItems: [], activeFrame: 'None', activeBubble: 'Default' },
            stats: { followers: 0, fans: 0 },
            level: { rich: 1, charm: 1 },
            tags: ['Tribe Member'],
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

        // Step 1: Set Root Identity (Critical for Security Rules)
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
          title: 'Welcome to Ummy!',
          content: `Your unique Tribe ID is ${finalData.specialId}. We've gifted you 500 Gold Coins to explore the Boutique!`,
          type: 'system',
          timestamp: serverTimestamp(),
          isRead: false
        });

        toast({
          title: 'Identity Synchronized!',
          description: `Welcome to the tribe. ID: ${finalData.specialId}`,
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
