'use client';
import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export interface UserProfile {
    id: string;
    specialId: string;
    specialIdColor?: string;
    username: string;
    avatarUrl: string;
    bio?: string;
    email: string;
    gender?: 'Male' | 'Female' | null;
    country?: string | null;
    interests?: string[];
    wallet?: {
      coins: number;
      diamonds: number;
      totalSpent: number;
      dailySpent: number;
    };
    stats?: {
      followers: number;
      fans: number;
      dailyFans: number;
      dailyGameWins?: number;
    };
    level?: {
      rich: number;
      charm: number;
    };
    inventory?: {
      activeFrame?: string;
      activeFrameExpiresAt?: any; // 7-day expiration logic
      activeBubble?: string;
      activeWave?: string;
      ownedItems: string[];
    };
    banStatus?: {
      isBanned: boolean;
      bannedUntil: any;
      reason: string;
    };
    tags?: string[];
    createdAt?: any;
    updatedAt?: any;
    lastSignInAt?: any;
    lastMoneyTreeClaimAt?: any;
    isNewUser?: boolean;
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
