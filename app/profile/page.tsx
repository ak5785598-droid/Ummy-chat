'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';

/**
 * Root Profile Gateway.
 * Correctly identifies the authenticated user and redirects to their dynamic dashboard.
 */
export default function ProfileGateway() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace(`/profile/${user.uid}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FFCC00] space-y-6 font-headline">
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
        <UmmyLogoIcon className="h-24 w-24 relative z-10 animate-bounce" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">
        Syncing Identity
      </p>
    </div>
  );
}
