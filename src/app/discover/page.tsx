'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

/**
 * THE DISCOVER GATEWAY.
 * Wrapping the entire Discover experience into a non-SSR dynamic bundle.
 * This eliminates all hydration mismatches from dynamic dates and complex UI.
 */
const DiscoverView = dynamic(() => import('./discover-view'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[9999] bg-[#0F011F] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
        <Loader className="absolute inset-0 m-auto h-6 w-6 text-purple-400 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400/60">
        Syncing Discovery Frequencies...
      </p>
    </div>
  )
});

export default function DiscoverGatewayPage() {
  return (
    <main className="min-h-screen bg-[#0F011F]">
      <DiscoverGateway />
    </main>
  );
}

// Internal name for clarity in devtools
function DiscoverGateway() {
  return <DiscoverView />;
}
