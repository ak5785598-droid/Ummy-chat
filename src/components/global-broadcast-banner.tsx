'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Gift, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * High-Fidelity Global Broadcast Portal.
 * DEFERRED SYNC: Prevents hydration mismatch.
 */
export function GlobalBroadcastBanner() {
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  // DEFERRED IDENTITY SYNC
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const broadcastsQuery = useMemoFirebase(() => {
    if (!firestore || !now) return null;
    return query(
      collection(firestore, 'globalBroadcasts'),
      where('expiresAt', '>', Timestamp.fromDate(now)),
      orderBy('expiresAt', 'desc'),
      limit(1)
    );
  }, [firestore, now]);

  const { data: broadcasts } = useCollection(broadcastsQuery);
  const activeBroadcast = broadcasts?.[0];

  const isSelfRoom = activeBroadcast && pathname === `/rooms/${activeBroadcast.roomId}`;

  if (!activeBroadcast || isSelfRoom || !now) return null;

  return (
    <div 
      onClick={() => router.push(`/rooms/${activeBroadcast.roomId}`)}
      className="fixed top-20 left-4 right-4 z-[400] animate-in slide-in-from-top-full duration-500 cursor-pointer group"
    >
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 p-0.5 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)] border-2 border-yellow-400/40">
         <div className="bg-black/60 backdrop-blur-xl rounded-[calc(1rem-2px)] px-4 py-3 flex items-center justify-between overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-45deg] animate-shine" style={{ animationDuration: '3s' }} />
            
            <div className="flex items-center gap-3 relative z-10">
               <div className="h-10 w-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce">
                  <Gift className="h-6 w-6 text-red-600 fill-current" />
               </div>
               <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase text-yellow-400 tracking-widest leading-none mb-1 flex items-center gap-1">
                    <Zap className="h-2 w-2 fill-current" /> Lucky Bag Broadcast
                  </p>
                  <h4 className="text-[11px] font-black text-white uppercase italic tracking-tighter truncate w-40 sm:w-64">
                     {activeBroadcast.senderName} sent a Bag in Room #{activeBroadcast.roomNumber}
                  </h4>
               </div>
            </div>

            <div className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-1.5 rounded-full font-black uppercase italic text-[9px] shadow-lg group-hover:scale-105 transition-transform shrink-0 relative z-10">
               Enter Room <ChevronRight className="h-3 w-3" />
            </div>
         </div>
      </div>
    </div>
  );
}
