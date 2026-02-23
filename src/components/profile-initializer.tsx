'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

/**
 * Ensures a user profile exists in Firestore after login.
 * This component is "Real" and prevents app features from failing due to missing data.
 */
export function ProfileInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore) return;

    const initProfile = async () => {
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const initialData = {
          id: user.uid,
          username: user.displayName || 'Ummy User',
          avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200`,
          email: user.email || '',
          bio: 'Vibing on Ummy! Join my tribe.',
          wallet: { coins: 500, diamonds: 0 },
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

        // Create initial production-ready profile in subcollection
        await setDoc(profileRef, initialData, { merge: true });
        
        // Also sync basic info to top-level user doc for rankings/leaderboard queries
        await setDoc(userRef, {
          id: user.uid,
          username: initialData.username,
          avatarUrl: initialData.avatarUrl,
          wallet: initialData.wallet,
          stats: initialData.stats,
          level: initialData.level,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    };

    initProfile();
  }, [user, firestore]);

  return null;
}