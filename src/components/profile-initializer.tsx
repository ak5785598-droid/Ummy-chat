'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * Ensures a user profile exists in Firestore after login.
 * Syncs critical fields to top-level user doc for security rules compliance.
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
      
      try {
        const profileSnap = await getDoc(profileRef);
        hasInitialized.current = profileId;

        if (!profileSnap.exists()) {
          const initialData = {
            id: profileId,
            username: user.displayName || `Ummy_${profileId.substring(0, 5)}`,
            avatarUrl: user.photoURL || `https://picsum.photos/seed/${profileId}/400`,
            email: user.email || '',
            bio: 'Vibing on Ummy! Join my tribe.',
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

          // Background sync for detailed profile
          await setDoc(profileRef, initialData, { merge: true });
          
          // Background sync for user summary - REQUIRED for Security Rules
          await setDoc(userRef, {
            id: profileId,
            username: initialData.username,
            avatarUrl: initialData.avatarUrl,
            wallet: initialData.wallet,
            stats: initialData.stats,
            level: initialData.level,
            tags: initialData.tags, 
            updatedAt: serverTimestamp(),
            joinedAt: serverTimestamp(),
          }, { merge: true });

          toast({
            title: 'Welcome to Ummy!',
            description: 'Enjoy 1,500 free coins!',
          });
        }
      } catch (e) {
        console.error("Profile initialization error:", e);
      }
    };

    initProfile();
  }, [user, firestore, toast]);

  return null;
}