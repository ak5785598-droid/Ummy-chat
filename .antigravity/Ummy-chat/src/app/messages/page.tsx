'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';
import { UmmyLogoIcon } from '@/components/icons';

/**
 * THE MESSAGES GATEWAY.
 * Wrapping the entire Messaging experience into a non-SSR dynamic bundle.
 * This eliminates all hydration mismatches from dynamic dates and real-time queries.
 */
const MessagesView = dynamic(() => import('./messages-view'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[9999] bg-[#f3e5f5] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <UmmyLogoIcon className="absolute inset-0 m-auto h-8 w-8 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">
        Synchronizing Frequencies...
      </p>
    </div>
  )
});

export default function MessagesGatewayPage() {
  return (
    <main className="min-h-screen bg-[#f3e5f5]">
      <MessagesGateway />
    </main>
  );
}

// Internal name for clarity in devtools
function MessagesGateway() {
  return <MessagesView />;
}
