'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * Ensures a user profile exists in Firestore after login.
 * Optimized to run only once per session or identity change.
 */
export function ProfileInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const hasInitialized = useRef<string | null>(null);

  useEffect(() => {
    // Prevent redundant initialization if already checked for this user ID.
    if (!user || !firestore || hasInitialized.current === user.uid) return;

    const initProfile = async () => {
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      
      try {
        const profileSnap = await getDoc(profileRef);
        hasInitialized.current = user.uid;

        if (!profileSnap.exists()) {
          const initialData = {
            id: user.uid,
            username: user.displayName || `Ummy_${user.uid.substring(0, 5)}`,
            avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/400`,
            email: user.email || '',
            bio: 'Vibing on Ummy! Join my tribe.',
            wallet: { 
              coins: 1500, // Starting balance
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

          // Background sync
          await setDoc(profileRef, initialData, { merge: true });
          
          await setDoc(userRef, {
            id: user.uid,
            username: initialData.username,
            avatarUrl: initialData.avatarUrl,
            wallet: initialData.wallet,
            stats: initialData.stats,
            level: initialData.level,
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