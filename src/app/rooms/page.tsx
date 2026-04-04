'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

/**
 * THE ULTIMATE NUCLEAR GATEWAY.
 * We are wrapping the ENTIRE discovery experience (AppLayout + RoomsExplorer) 
 * into a single non-SSR dynamic bundle. This means the server 
 * only renders a matching loading shell, and everything else 
 * initializes strictly on the client. #310 IS DEAD.
 */
const RoomsDiscoveryView = dynamic(() => import('./rooms-discovery-view'), {
  ssr: false,
  loading: () => (
    /* Themed Pink Gradient Shell to match App aesthetic (Screenshot 1 fix) */
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#ff8ebb] via-[#ffade0] to-[#f472b6] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <Loader className="absolute inset-0 m-auto h-6 w-6 text-white animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 drop-shadow-sm">
        Initializing Universal Reality...
      </p>
    </div>
  )
});

export default function RoomsGatewayPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FE]">
      <RoomsDiscoveryView />
    </main>
  );
}
