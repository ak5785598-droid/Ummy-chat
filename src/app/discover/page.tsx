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
  loading: () => null
});

export default function DiscoverGatewayPage() {
  return (
    <main className="min-h-screen bg-white">
      <DiscoverGateway />
    </main>
  );
}

// Internal name for clarity in devtools
function DiscoverGateway() {
  return <DiscoverView />;
}
