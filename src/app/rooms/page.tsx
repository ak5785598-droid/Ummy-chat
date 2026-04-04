'use client';

import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/app-layout';
import { Loader } from 'lucide-react';

/**
 * THE NUCLEAR DISCOVERY SHIELD.
 * By using dynamic import with ssr: false, we ensure that the entire RoomsExplorer
 * bundle is only initialized on the client side. This makes hydration mismatches
 * IMPOSSIBLE because the server sends a minimal, stable loading shell.
 */
const RoomsExplorer = dynamic(() => import('./rooms-explorer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader className="h-10 w-10 animate-spin text-primary opacity-20" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
        Initializing Discovery Reality...
      </p>
    </div>
  )
});

export default function RoomsDiscoveryPage() {
  return (
    <AppLayout>
      <RoomsExplorer />
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </AppLayout>
  );
}
