'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Gift, ChevronRight, Zap, Sparkles } from 'lucide-react';

/**
 * High-Fidelity Global Broadcast Portal (Lucky Bag & Rocket Deploy).
 */
export function GlobalBroadcastBanner() {
 const firestore = useFirestore();
 const router = useRouter();
 const pathname = usePathname();
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
   className="fixed top-16 left-4 right-4 z-[9990] max-w-[520px] mx-auto animate-in slide-in-from-top-full duration-500 cursor-pointer group"
  >
   {/* 3D Fiery Gold-Red Outer Ring */}
   <div className="p-[2px] rounded-3xl bg-gradient-to-r from-[#FF4D4D] via-[#FFD700] to-[#FF0055] shadow-[0_8px_35px_rgba(255,215,0,0.5)]">
     <div className="bg-gradient-to-r from-[#180828] via-[#2A0835] to-[#120520] backdrop-blur-2xl rounded-[calc(1.5rem-2px)] px-4 py-2.5 flex items-center justify-between overflow-hidden relative border border-white/10">
      
      {/* Light Reflection Sweep Line */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-35deg] animate-shine" style={{ animationDuration: '2.5s' }} />
      
      <div className="flex items-center gap-3 relative z-10 min-w-0">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#FFE566] to-[#F59E0B] p-0.5 shadow-[0_0_15px_rgba(255,229,102,0.6)] animate-bounce shrink-0">
         <div className="w-full h-full bg-[#3B1100] rounded-[14px] flex items-center justify-center">
          <Gift className="h-6 w-6 text-[#FFE566] fill-current" />
         </div>
        </div>

        <div className="min-w-0 flex-1">
         <div className="flex items-center gap-1.5 mb-0.5">
          <span className="px-2 py-0.2 rounded-full bg-red-500/20 border border-red-500/40 text-[8px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 fill-current" /> LUCKY BAG BROADCAST
          </span>
          <Sparkles className="h-3 w-3 text-yellow-400 animate-spin" />
         </div>
         <h4 className="text-[12px] font-black text-white uppercase tracking-tight truncate">
           <span className="text-[#FFE566]">{activeBroadcast.senderName}</span> sent a Bag in Room <span className="text-emerald-400">#{activeBroadcast.roomNumber}</span>
         </h4>
        </div>
      </div>

      {/* Floating 3D Gold Action CTA Button */}
      <div className="flex items-center gap-1 bg-gradient-to-r from-[#FFE566] to-[#F59E0B] text-[#3B1100] px-3.5 py-1.5 rounded-full font-black uppercase text-[10px] shadow-[0_4px_15px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform shrink-0 relative z-10 ml-2 border border-white/40">
        ENTER <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
      </div>
     </div>
   </div>
  </div>
 );
}