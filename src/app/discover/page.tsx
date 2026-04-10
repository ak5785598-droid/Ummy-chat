'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

/**
 * THE DISCOVER GATEWAY.
 * Wrapping the entire Discover experience into a non-SSR dynamic bundle.
 * This eliminates all hydration mismatches from dynamic dates and complex UI.
 */
const DiscoverView = dynamic(() => import('./discover-view-glossy'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[9999] bg-[#FF91B5] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <Loader className="absolute inset-0 m-auto h-6 w-6 text-white animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
        Syncing Discovery Frequencies...
      </p>
    </div>
  )
});

export default function DiscoverGatewayPage() {
  return (
    <main className="min-h-screen bg-[#FF91B5]">
      <DiscoverGateway />
    </main>
  );
}

// Internal name for clarity in devtools
function DiscoverGateway() {
  return <DiscoverView />;
}
