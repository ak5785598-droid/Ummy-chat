'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Supreme Identity Enforcement Guard.
 * Monitors the social graph for active ban signatures and redirects restricted frequencies.
 */
export function GlobalBanGuard({ children }: { children: React.ReactNode }) {
 const { user, isUserLoading } = useUser();
 const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
 const router = useRouter();
 const pathname = usePathname();

 useEffect(() => {
  if (isUserLoading || isProfileLoading || !userProfile) return;

  const banStatus = userProfile.banStatus;
  const isBanned = banStatus?.isBanned === true;
  
  if (isBanned) {
   // Check for expiration
   if (banStatus.bannedUntil) {
    const until = banStatus.bannedUntil.toDate();
    if (until < new Date()) {
     // Ban frequency expired - restoration protocol (server side update preferred but client side redirect safe)
     return;
    }
   }

   // Enforcement redirect
   if (pathname !== '/banned' && !pathname.startsWith('/login') && pathname !== '/') {
    console.warn(`[Ban Guard] Redirecting restricted frequency: ${user?.uid}`);
    router.replace('/banned');
   }
  } else {
   // Automatic Restoration: If user was on banned page but is no longer banned
   if (pathname === '/banned') {
    router.replace('/rooms');
   }
  }
 }, [userProfile, isUserLoading, isProfileLoading, router, pathname, user?.uid]);

 return <>{children}</>;
}
