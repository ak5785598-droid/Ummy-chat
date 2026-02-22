'use client';
import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export interface UserProfile {
    id: string;
    username: string;
    avatarUrl: string;
    bio?: string;
    email: string;
    interests?: string[];
    coins?: number;
    details?: {
      gender?: string;
      hometown?: string;
      age?: number;
    };
    wallet?: {
      coins: number;
      diamonds: number;
    };
    stats?: {
      followers: number;
      fans: number;
    };
    level?: {
      rich: number;
      charm: number;
    };
    frame?: string;
    tags?: string[];
}

/**
 * Hook to fetch a specific user's profile from Firestore in real-time.
 */
export function useUserProfile(userId: string | undefined) {
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !userId) return null;
        return doc(firestore, 'users', userId, 'profile', userId);
    }, [firestore, userId]);
    
    const { data, isLoading, error } = useDoc<UserProfile>(userProfileRef);

    return { userProfile: data, isLoading, error };
}
