'use client';

import React, { useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Compass, Loader, Sparkles } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { ChatRoomCard } from '@/components/chat-room-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Tribal Discovery Dimension.
 */
export default function DiscoverPage() {
 const firestore = useFirestore();
 
 const discoverQuery = useMemoFirebase(() => {
   if (!firestore) return null;
   return query(
     collection(firestore, 'chatRooms'),
     orderBy('participantCount', 'desc'),
     limit(20)
   );
 }, [firestore]);

 const { data: rooms, isLoading } = useCollection(discoverQuery);

 if (isLoading) {
  return (
   <AppLayout>
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-8 text-center px-8 font-sans animate-pulse">
     <div className="relative">
       <div className="absolute -inset-10 bg-primary/20 blur-3xl rounded-full animate-ping" />
       <div className="h-32 w-32 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-2xl border-4 border-primary/20 relative z-10">
        <Compass className="h-16 w-16 animate-spin-slow" />
       </div>
     </div>
     <div className="space-y-3">
      <h1 className="text-4xl font-black uppercase tracking-tight italic">Discover Dimension</h1>
      <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.3em]">Calibrating Global Frequencies...</p>
     </div>
    </div>
   </AppLayout>
  );
 }

 return (
  <AppLayout>
   <div className="min-h-screen bg-white font-sans overflow-x-hidden">
    <header className="pt-12 pb-6 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
            Global Radar <Sparkles className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Live Tribal Frequency</p>
        </div>
        <div className="bg-primary/20 p-2 rounded-2xl ring-1 ring-primary/30">
          <Compass className="h-6 w-6 text-primary" />
        </div>
      </div>
    </header>

    <main className="px-5 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 gap-6">
        {rooms?.map((room, index) => (
          <div key={room.id} className={cn("animate-in fade-in slide-in-from-right-10 duration-500", `delay-[${index * 100}ms]`)}>
            <ChatRoomCard room={room} />
          </div>
        ))}

        {(!rooms || rooms.length === 0) && (
          <div className="py-20 text-center space-y-4 opacity-20 flex flex-col items-center">
            <Compass className="h-16 w-16 text-slate-300" />
            <p className="font-black uppercase tracking-widest text-xs">No active frequencies detected.</p>
          </div>
        )}
      </div>
    </main>
   </div>
  </AppLayout>
 );
}
