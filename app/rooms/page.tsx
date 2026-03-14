'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Bell, User, Ghost, Star, Sparkles, Trophy, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { UmmyLogoIcon } from '@/components/icons';

const CATEGORIES = ["All", "Chat", "Games", "Newcomers", "Party"];

export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      orderBy('participantCount', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(roomsQuery);

  const displayRooms = useMemo(() => {
    if (!roomsData) return [];
    const activeRooms = roomsData.filter(room => (room.participantCount || 0) > 0);
    return activeRooms.sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0));
  }, [roomsData]);

  const RoomSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/5] w-full rounded-[2.5rem]" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-ummy-gradient flex flex-col font-headline animate-in fade-in duration-700 pb-24">
        
        <header className="flex items-center justify-between px-6 pt-10 pb-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Recommend</h1>
            <Badge className="bg-[#9C27B0] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-none shadow-sm">
              TASK
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 bg-white rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all">
              <Bell className="h-6 w-6 text-slate-800" />
              <div className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button onClick={() => router.push('/profile')} className="h-10 w-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 active:scale-95 transition-all">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback><User className="h-5 w-5 text-slate-400" /></AvatarFallback>
              </Avatar>
            </button>
          </div>
        </header>

        {/* Banners Section */}
        <section className="px-6 mb-6">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {[
                { id: 1, color: 'from-purple-600 to-indigo-600', title: 'Global Event', sub: 'Join the frequency', icon: Sparkles },
                { id: 2, color: 'from-orange-500 to-red-600', title: 'Elite Rewards', sub: 'Claim your throne', icon: Trophy }
              ].map((b) => (
                <CarouselItem key={b.id}>
                  <div className={cn("h-32 w-full rounded-[2.5rem] bg-gradient-to-br p-6 flex flex-col justify-center relative overflow-hidden shadow-lg", b.color)}>
                     <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                           <b.icon className="h-4 w-4 text-white animate-pulse" />
                           <h3 className="text-xl font-black uppercase italic tracking-tighter text-white drop-shadow-md">{b.title}</h3>
                        </div>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{b.sub}</p>
                     </div>
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <UmmyLogoIcon className="h-32 w-32 rotate-12" />
                     </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>

        {/* Featured Categories: Decreased Length aspect-[16/10] */}
        <section className="px-6 grid grid-cols-3 gap-4 mb-8">
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-full aspect-[16/10] bg-gradient-to-br from-orange-400 to-red-600 rounded-[1.5rem] shadow-xl border-2 border-white/20 flex flex-col items-center justify-center p-2 relative overflow-hidden active:scale-95 transition-all">
               <span className="absolute top-2 left-3 text-white font-black uppercase text-[8px] tracking-widest opacity-80">Official</span>
               <div className="text-3xl drop-shadow-2xl group-hover:scale-110 transition-transform">🐷</div>
            </div>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-full aspect-[16/10] bg-gradient-to-br from-purple-500 to-pink-600 rounded-[1.5rem] shadow-xl border-2 border-white/20 flex flex-col items-center justify-center p-2 relative overflow-hidden active:scale-95 transition-all">
               <span className="absolute top-2 left-3 text-white font-black uppercase text-[8px] tracking-widest opacity-80">Party</span>
               <div className="text-3xl drop-shadow-2xl animate-reaction-float group-hover:scale-110 transition-transform">🔮</div>
            </div>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-full aspect-[16/10] bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[1.5rem] shadow-xl border-2 border-white/20 flex flex-col items-center justify-center p-2 relative overflow-hidden active:scale-95 transition-all">
               <span className="absolute top-2 left-3 text-white font-black uppercase text-[8px] tracking-widest opacity-80">Speed</span>
               <div className="text-3xl drop-shadow-2xl group-hover:scale-110 transition-transform">🚀</div>
            </div>
          </button>
        </section>

        {/* Top Rooms Pill: Moved above tabs */}
        <div className="px-6 mb-8">
          <div className="bg-gradient-to-r from-[#9C27B0] to-[#E91E63] h-14 rounded-full shadow-2xl border-2 border-white/30 flex items-center justify-between px-8 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
            <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] group-hover:animate-shine" />
            <div className="flex items-center gap-3 relative z-10">
               <Star className="h-5 w-5 text-yellow-400 fill-current animate-pulse" />
               <span className="text-white font-black uppercase italic text-sm tracking-widest drop-shadow-md">Top Rooms Grid</span>
            </div>
            <div className="flex -space-x-3 relative z-10">
              {[1, 2, 3, 4].map((i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-white shadow-xl">
                  <AvatarImage src={`https://picsum.photos/seed/${i + 50}/100`} />
                  <AvatarFallback className="text-[8px] bg-slate-200">U</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-Category Navigation: Transparent and positioned below pill */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex-1 px-6 py-2.5 rounded-xl text-[14px] font-black uppercase italic tracking-tighter transition-all whitespace-nowrap",
                  activeCategory === cat 
                    ? "bg-white text-purple-600 shadow-sm scale-[1.02]" 
                    : "text-purple-400/70 hover:text-purple-500"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <main className="px-4 flex-1">
          {isRoomsLoading && !roomsData ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10">
              {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
            </div>
          ) : displayRooms.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 pb-10">
              {displayRooms.map((room: any) => (
                <ChatRoomCard key={room.id} room={room} variant="modern" />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 opacity-40">
               <Ghost className="h-12 w-12 mx-auto text-slate-300" />
               <p className="font-black uppercase italic text-xs tracking-widest">No Active Frequencies</p>
            </div>
          )}
        </main>

      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </AppLayout>
  );
}