'use client';
import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  accountNumber: string;
  isInternalId?: boolean;
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
   weeklySpent?: number;
   monthlySpent?: number;
  };
  stats?: {
   followers: number;
   fans: number;
   dailyFans: number;
   dailyGiftsReceived?: number;
   weeklyGiftsReceived?: number;
   monthlyGiftsReceived?: number;
   dailyGifts?: number;
   weeklyGifts?: number;
   monthlyGifts?: number;
   dailyGameWins?: number;
   weeklyGameWins?: number;
   monthlyGameWins?: number;
  };
  level?: {
   rich: number;
   charm: number;
  };
  inventory?: {
   activeFrame?: string;
   activeWave?: string;
   activeBubble?: string;
   activeTheme?: string;
   ownedItems: string[];
  };
  banStatus?: {
   isBanned: boolean;
   bannedUntil: any;
   reason: string;
  };
  relationship?: {
    type: 'CP' | 'BFF' | 'Love' | 'None';
    partnerUid: string;
    partnerName: string;
    partnerAvatar: string;
    level: number;
    startDate: any;
  };
  tags?: string[];
  createdAt?: any;
  updatedAt?: any;
  lastSignInAt?: any;
  lastMoneyTreeClaimAt?: any;
  isAdmin?: boolean;
  activityPoints?: number;
  idColor?: 'red' | 'blue' | 'purple' | 'none';
  isBudgetId?: boolean;
  isOnline?: boolean;
  svip?: number;
}

/**
 * Hook to fetch a specific user's profile from Firestore in real-time.
 * Supports optional useDoc options for error suppression.
 */
export function useUserProfile(userId: string | undefined, options?: { suppressGlobalError?: boolean }) {
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId, 'profile', userId);
  }, [firestore, userId]);
  
  const { data, isLoading, error } = useDoc<UserProfile>(userProfileRef, options);

  return { userProfile: data, isLoading, error };
}