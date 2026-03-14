'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Loader, Bell, User, Star, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
      <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-ummy-gradient flex flex-col font-headline animate-in fade-in duration-700 pb-20">
        
        {/* Recommend Header Section */}
        <header className="flex items-center justify-between px-6 pt-10 pb-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Recommend</h1>
            <Badge className="bg-[#9C27B0] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-none">
              TASK
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform">
              <Bell className="h-6 w-6 text-slate-800" />
              <div className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button onClick={() => router.push('/profile')} className="h-10 w-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback><User className="h-5 w-5 text-slate-400" /></AvatarFallback>
              </Avatar>
            </button>
          </div>
        </header>

        {/* Featured Category Grid */}
        <section className="px-6 grid grid-cols-3 gap-4 mb-8">
          <button className="flex flex-col items-center gap-2">
            <div className="w-full aspect-[4/5] bg-gradient-to-br from-orange-400 to-red-500 rounded-[2rem] shadow-xl border-2 border-white/20 flex items-center justify-center p-4 relative overflow-hidden active:scale-95 transition-transform">
               <span className="absolute top-4 left-4 text-white font-black uppercase text-xs">Official</span>
               <div className="text-5xl drop-shadow-lg">🐷</div>
            </div>
          </button>
          <button className="flex flex-col items-center gap-2">
            <div className="w-full aspect-[4/5] bg-gradient-to-br from-purple-500 to-pink-600 rounded-[2rem] shadow-xl border-2 border-white/20 flex items-center justify-center p-4 relative overflow-hidden active:scale-95 transition-transform">
               <span className="absolute top-4 left-4 text-white font-black uppercase text-xs">Party</span>
               <div className="text-5xl drop-shadow-lg animate-reaction-float">🔮</div>
            </div>
          </button>
          <button className="flex flex-col items-center gap-2">
            <div className="w-full aspect-[4/5] bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[2rem] shadow-xl border-2 border-white/20 flex items-center justify-center p-4 relative overflow-hidden active:scale-95 transition-transform">
               <span className="absolute top-4 left-4 text-white font-black uppercase text-xs">Speed</span>
               <div className="text-5xl drop-shadow-lg">🚀</div>
            </div>
          </button>
        </section>

        {/* Sub-Category Navigation */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-[15px] font-black uppercase transition-all whitespace-nowrap relative",
                  activeCategory === cat ? "text-slate-900 scale-110" : "text-slate-400"
                )}
              >
                {cat}
                {activeCategory === cat && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-slate-900 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Top Rooms Banner */}
        <div className="px-6 mb-8">
          <div className="bg-gradient-to-r from-[#9C27B0] to-[#E91E63] h-12 rounded-full shadow-lg border border-white/20 flex items-center justify-between px-6">
            <span className="text-white font-black uppercase italic text-sm tracking-tight">Top Rooms</span>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <Avatar key={i} className="h-7 w-7 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://picsum.photos/seed/${i + 10}/100`} />
                  <AvatarFallback className="text-[8px]">U</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        {/* Room Grid Dimension */}
        <main className="px-4 flex-1">
          {isRoomsLoading && !roomsData ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-10">
              {displayRooms.map((room: any) => (
                <ChatRoomCard key={room.id} room={room} variant="modern" />
              ))}
            </div>
          )}
        </main>

      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </AppLayout>
  );
}
