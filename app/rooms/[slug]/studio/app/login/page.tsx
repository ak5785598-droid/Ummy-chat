'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Re-engineered Studio Entry Portal.
 * Redirects to the root login frequency to ensure absolute compilation integrity.
 */
export default function StudioLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="h-screen w-full bg-[#140028] flex items-center justify-center">
       <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
