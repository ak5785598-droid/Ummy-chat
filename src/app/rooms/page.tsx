'use client';

import { useState, useMemo } from 'react';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Search, Loader, Flame, Gamepad2, Music, Crown, Heart, Users, Home } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export default function RoomsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('Popular');

  const allRoomsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    // Simplified query to prevent index-related hangs during initial load
    return query(collection(firestore, 'chatRooms'), limit(50));
  }, [firestore, isUserLoading, user]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(allRoomsQuery);

  const categories = [
    { id: 'Popular', label: 'Popular', icon: Flame },
    { id: 'Game', label: 'Game', icon: Gamepad2 },
    { id: 'Video/Music', label: 'Video/Music', icon: Music },
  ];

  const filteredRooms = useMemo(() => {
    if (!roomsData) return [];
    if (activeTab === 'Popular') return roomsData.slice(0, 10);
    return roomsData.filter((r: any) => r.category === activeTab);
  }, [roomsData, activeTab]);

  return (
    <AppLayout hideSidebarOnMobile>
      <div className="min-h-screen bg-background pb-20">
        {/* Top Header Section - Yellow Style */}
        <header className="bg-gradient-to-b from-primary to-primary/80 px-4 pt-10 pb-6 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <Home className="h-5 w-5 text-black" />
            </div>
            <div className="flex items-center gap-8 text-black">
              <button className="text-xl font-bold opacity-60 hover:opacity-100 transition-opacity">Mine</button>
              <button className="text-2xl font-black border-b-4 border-black pb-1">Popular</button>
            </div>
            <button className="bg-white/20 p-2 rounded-full backdrop-blur-sm" aria-label="Search rooms">
              <Search className="h-6 w-6 text-black" />
            </button>
          </div>

          {/* Featured Banner Carousel */}
          <div className="w-full mt-4 overflow-hidden rounded-2xl">
            <Carousel className="w-full">
              <CarouselContent>
                {[1, 2, 3].map((i) => (
                  <CarouselItem key={i}>
                    <div className="relative aspect-[1536/681] rounded-2xl overflow-hidden shadow-xl mx-2">
                      <Image
                        src={`https://picsum.photos/seed/ummy-banner-${i}/800/400`}
                        alt={`Featured community event banner ${i}`}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </header>

        <div className="px-4 mt-6 space-y-6">
          {/* Quick Access Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/leaderboard" className="relative h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 p-3 shadow-lg hover:scale-105 transition-transform group overflow-hidden">
               <span className="text-white font-bold text-sm uppercase relative z-10">Ranking</span>
               <Crown className="absolute -bottom-2 -right-2 h-16 w-16 text-white/20 group-hover:scale-110 transition-transform" />
            </Link>
            <Link href="/match" className="relative h-24 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 p-3 shadow-lg hover:scale-105 transition-transform group overflow-hidden">
               <span className="text-white font-bold text-sm uppercase relative z-10">CP</span>
               <Heart className="absolute -bottom-2 -right-2 h-16 w-16 text-white/20 group-hover:scale-110 transition-transform" />
            </Link>
            <div className="relative h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 p-3 shadow-lg hover:scale-105 transition-transform group overflow-hidden cursor-pointer">
               <span className="text-white font-bold text-sm uppercase relative z-10">Family</span>
               <Users className="absolute -bottom-2 -right-2 h-16 w-16 text-white/20 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === cat.id 
                    ? 'bg-primary text-black shadow-md scale-105' 
                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {cat.id === 'Popular' && <Flame className="h-4 w-4 fill-current" />}
                {cat.label}
              </button>
            ))}
            <div className="ml-auto">
              <CreateRoomDialog />
            </div>
          </div>

          {/* Rooms Grid */}
          {isRoomsLoading ? (
            <div className="flex justify-center py-20"><Loader className="h-10 w-10 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-24">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room: any) => (
                  <ChatRoomCard key={room.id} room={room} variant="modern" />
                ))
              ) : (
                <div className="col-span-2 py-20 text-center text-muted-foreground bg-secondary/10 rounded-3xl border border-dashed border-muted">
                   <p className="font-bold uppercase tracking-widest text-xs">No active rooms in this frequency.</p>
                   <p className="text-[10px] mt-2 italic">Be the first to start a vibe!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
