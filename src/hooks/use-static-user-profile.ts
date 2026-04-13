'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from './use-user-profile';

// Global cache to prevent multiple fetches for the same user in the same session
const profileCache: Record<string, UserProfile> = {};

/**
 * STATIC PROFILE HOOK
 * Fetches user data ONCE and remains static for the component lifetime.
 * Extremely efficient for lists (Room Discovery) where real-time tracking 
 * of 100+ owners is not needed.
 */
export function useStaticUserProfile(userId: string | undefined) {
  const { firestore, isHydrated } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(profileCache[userId || ''] || null);
  const [isLoading, setIsLoading] = useState(!profileCache[userId || '']);

  useEffect(() => {
    if (!firestore || !userId || !isHydrated) return;
    
    // If already in cache, no need to fetch again
    if (profileCache[userId]) {
      setUserProfile(profileCache[userId]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchStaticProfile() {
      try {
        const docRef = doc(firestore!, 'users', userId!, 'profile', userId!);
        const snap = await getDoc(docRef);
        
        if (snap.exists() && isMounted) {
          const data = { id: snap.id, ...snap.data() } as UserProfile;
          profileCache[userId!] = data; // Cache it
          setUserProfile(data);
        }
      } catch (e) {
        console.warn(`[StaticProfile] Fetch failed for ${userId}:`, e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchStaticProfile();

    return () => {
      isMounted = false;
    };
  }, [firestore, userId, isHydrated]);

  return { userProfile, isLoading };
}
