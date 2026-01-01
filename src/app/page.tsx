
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    // We only want to redirect once the user's auth state is definitive.
    if (!isLoading) {
      if (user) {
        // If there's a user, go to the main app.
        router.replace('/rooms');
      } else {
        // If there's no user, go to the login page.
        router.replace('/login');
      }
    }
    // The effect depends on the loading state and the user object.
  }, [isLoading, user, router]);

  // Show a loading spinner while we determine the auth state.
  return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
  );
}
