'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader } from 'lucide-react';

/**
 * Root Profile Gateway
 * Safely redirects the user to their specific profile or the login screen.
 * Synchronized with the correct isUserLoading frequency.
 */
export default function ProfileGateway() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only perform navigation once authentication state is definitive.
    if (!isUserLoading) {
      if (user) {
        // Use replace to prevent back-button loops
        router.replace(`/profile/${user.uid}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background space-y-4">
      <Loader className="h-10 w-10 animate-spin text-primary" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
        Synchronizing Identity...
      </p>
    </div>
  );
}
