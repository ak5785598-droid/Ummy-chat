'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Ghost } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * AI Vibe Match Page - Root Migration.
 */
export default function MatchPage() {
 const router = useRouter();

 useEffect(() => {
  router.replace('/rooms');
 }, [router]);

 return (
  <AppLayout>
   <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 opacity-20">
    <Ghost className="h-12 w-12" />
    <p className="font-bold uppercase ">Feature Removed</p>
   </div>
  </AppLayout>
 );
}
