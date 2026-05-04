'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter, usePathname } from 'next/navigation';
import { useSilentBan } from '@/hooks/use-silent-ban';
import { Loader2 } from 'lucide-react';

/**
 * Supreme Identity Enforcement Guard.
 * Monitors the social graph for active ban signatures and redirects restricted frequencies.
 */
export function GlobalBanGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const { isSilentBanned, isLoading: isSilentLoading } = useSilentBan();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading || isProfileLoading || isSilentLoading || isSilentBanned) return;
    if (!userProfile) return;

    const banStatus = userProfile.banStatus;
    const isBanned = banStatus?.isBanned === true;
    
    if (isBanned) {
      // Check for expiration
      const until = banStatus.bannedUntil?.toDate?.() || null;
      if (until && until < new Date()) return;

      // Enforcement redirect (Normal Ban)
      if (pathname !== '/login' && pathname !== '/banned') {
        router.replace('/login');
      }
    }
  }, [userProfile, isUserLoading, isProfileLoading, isSilentLoading, isSilentBanned, router, pathname, user?.uid]);

  // SILENT GHOSTING: Show infinite loader if device is blacklisted
  if (isSilentBanned) {
    return (
      <div className="fixed inset-0 bg-[#030014] z-[999] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-primary/40 animate-spin mb-4" />
        <p className="text-white/20 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
          Connecting to Secure Node...
        </p>
        <p className="text-white/10 text-[9px] mt-8 max-w-[200px] leading-relaxed">
          The network is currently congested. Please wait while we stabilize your connection.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
