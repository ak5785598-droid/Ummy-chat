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
      const until = banStatus.bannedUntil?.toDate?.() || null;
      if (until && until < new Date()) {
        // Ban frequency expired
        return;
       }

      // Enforcement redirect
      if (pathname !== '/login') {
        console.warn(`[Ban Guard] Redirecting restricted frequency: ${user?.uid}`);
        router.replace('/login');
      }
    } else {
      // Automatic Restoration
      if (pathname === '/banned') {
        router.replace('/rooms');
      }
    }
  }, [userProfile, isUserLoading, isProfileLoading, router, pathname, user?.uid]);

  // CRITICAL: Block children if user is banned or still loading to prevent permission errors
  if (isUserLoading || isProfileLoading) {
    return null; // Or a high-level loading state
  }

  const isBanned = userProfile?.banStatus?.isBanned === true;
  const until = userProfile?.banStatus?.bannedUntil?.toDate?.() || null;
  const isActiveBan = isBanned && (!until || until > new Date());

  if (isActiveBan && pathname !== '/login') {
    return null; // Stop children (RoomProvider, etc) from rendering
  }

  return <>{children}</>;
}
