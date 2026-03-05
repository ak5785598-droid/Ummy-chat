'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UmmyLogoIcon } from '@/components/icons';

/**
 * Root Profile Gateway
 * Redirects to the user's specific high-fidelity persona card.
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
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FFCC00] space-y-4 font-headline">
      <UmmyLogoIcon className="h-16 w-16 animate-pulse" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white animate-pulse">
        Syncing Identity...
      </p>
    </div>
  );
}
