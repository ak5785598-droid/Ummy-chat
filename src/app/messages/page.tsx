'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';
import { UmmyLogoIcon } from '@/components/icons';
import { Suspense } from 'react';

/**
 * THE MESSAGES GATEWAY.
 * Wrapping the entire Messaging experience into a non-SSR dynamic bundle.
 * This eliminates all hydration mismatches from dynamic dates and real-time queries.
 */
const MessagesView = dynamic(() => import('./messages-view'), {
  ssr: false,
  loading: () => null
});

export default function MessagesGatewayPage() {
  return (
    <main className="min-h-screen bg-[#f3e5f5]">
      <Suspense fallback={null}>
        <MessagesGateway />
      </Suspense>
    </main>
  );
}

// Internal name for clarity in devtools
function MessagesGateway() {
  return <MessagesView />;
}
