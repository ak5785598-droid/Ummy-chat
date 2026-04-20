'use client';
import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useFirebase } from '@/firebase';
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
  birthday?: string;
  spaceImages?: string[];
  wallet?: {
   coins: number;
   diamonds: number;
   totalSpent: number;
   dailySpent: number;
   weeklySpent?: number;
   monthlySpent?: number;
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
  stats?: {
   followers: number;
   fans: number;
   dailyFans: number;
   receivedGifts?: Record<string, number>;
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
   activeVehicle?: string;
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
  whatsapp?: string;
  showWhatsapp?: boolean;
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
  familyId?: string;
  familyRole?: string;
  medals?: string[];
}

/**
 * Hook to fetch a specific user's profile from Firestore in real-time.
 * Unified with global isHydrated signal to prevent React 18 hydration crashes.
 * DATA DEDUPLICATED: Now shares the same Firestore connection across all components.
 */
export function useUserProfile(userId: string | undefined, options?: { suppressGlobalError?: boolean }) {
  const { isHydrated, firestore } = useFirebase();

  // Guard the reference itself with useMemo to keep it stable.
  const userProfileRef = useMemo(() => {
    if (!firestore || !userId || !isHydrated) return null;
    return doc(firestore, 'users', userId, 'profile', userId);
  }, [firestore, userId, isHydrated]);
  
  const { data, isLoading, error } = useDoc<UserProfile>(userProfileRef, options);

  // Memoize the final return object to prevent downstream re-render loops.
  return useMemo(() => ({ 
    userProfile: isHydrated ? data : null, 
    isLoading: !isHydrated || isLoading, 
    error 
  }), [data, isLoading, error, isHydrated]);
}