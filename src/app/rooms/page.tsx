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
import { cn } from '@/lib/utils';

/**
 * Explore Rooms Page - Yari Elite Edition.
 * Now features functional Mine vs Popular filtering and high-fidelity discovery grid.
 */
export default function RoomsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('Popular');
  const [filterType, setFilterType] = useState<'popular' | 'mine'>('popular');

  const allRoomsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
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
    let rooms = [...roomsData];
    
    if (filterType === 'mine' && user) {
      rooms = rooms.filter((r: any) => r.ownerId === user.uid);
    }
    
    if (activeTab !== 'Popular') {
      rooms = rooms.filter((r: any) => r.category === activeTab);
    }
    
    return rooms;
  }, [roomsData, activeTab, filterType, user]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8F8F8]">
        {/* Yari High-Energy Header */}
        <header className="bg-gradient-to-b from-[#FFF5A5] to-[#FFFFFF] px-4 pt-10 pb-4 shadow-sm sticky top-0 z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 p-2 rounded-full">
              <div className="bg-white/80 p-1.5 rounded-xl shadow-sm border border-yellow-200">
                 <Home className="h-5 w-5 text-gray-700" />
              </div>
            </div>
            <div className="flex items-center gap-8">
              <button 
                onClick={() => setFilterType('mine')}
                className={cn(
                  "text-xl font-bold transition-all",
                  filterType === 'mine' ? "text-gray-900 scale-110" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Mine
              </button>
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => setFilterType('popular')}
                  className={cn(
                    "text-2xl font-black transition-all",
                    filterType === 'popular' ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Popular
                </button>
                {filterType === 'popular' && <div className="h-1.5 w-6 bg-gray-900 rounded-full mt-1" />}
              </div>
            </div>
            <button className="p-2" aria-label="Search">
              <Search className="h-6 w-6 text-gray-800" />
            </button>
          </div>

          <div className="w-full mt-2 overflow-hidden rounded-2xl">
            <Carousel className="w-full">
              <CarouselContent>
                {[1, 2, 3].map((i) => (
                  <CarouselItem key={i}>
                    <div className="relative aspect-[1536/681] rounded-2xl overflow-hidden shadow-md mx-1">
                      <Image
                        src={`https://picsum.photos/seed/yari-banner-${i}/800/400`}
                        alt={`Featured event ${i}`}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </header>

        <div className="px-4 mt-4 space-y-6">
          {/* Discovery Ribbons - Triple Card Layout */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/leaderboard" className="relative h-28 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] p-3 shadow-md hover:scale-[1.02] transition-transform group overflow-hidden border border-yellow-300">
               <span className="text-white font-black text-sm uppercase tracking-tight relative z-10">Ranking</span>
               <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-1 opacity-80">
                  <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30" />
                  <div className="h-12 w-12 rounded-full bg-white/30 border border-white/40 -mt-2" />
                  <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30" />
               </div>
               <Crown className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10" />
            </Link>
            
            <Link href="/match" className="relative h-28 rounded-2xl bg-gradient-to-br from-[#FF69B4] to-[#FF1493] p-3 shadow-md hover:scale-[1.02] transition-transform group overflow-hidden border border-pink-300">
               <span className="text-white font-black text-sm uppercase tracking-tight relative z-10">CP Match</span>
               <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <Heart className="h-16 w-16 text-white" />
               </div>
               <div className="absolute bottom-2 left-2 right-2 flex justify-center items-end gap-1">
                  <div className="h-8 w-8 rounded-lg bg-white/20 rotate-12" />
                  <Heart className="h-6 w-6 text-white/80 animate-pulse mb-1" />
                  <div className="h-8 w-8 rounded-lg bg-white/20 -rotate-12" />
               </div>
            </Link>

            <Link href="/leaderboard" className="relative h-28 rounded-2xl bg-gradient-to-br from-[#00CED1] to-[#1E90FF] p-3 shadow-md hover:scale-[1.02] transition-transform group overflow-hidden border border-blue-300">
               <span className="text-white font-black text-sm uppercase tracking-tight relative z-10">Family</span>
               <div className="absolute bottom-2 left-2 right-2 flex flex-wrap justify-center gap-1 opacity-60">
                  {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="h-6 w-6 rounded-full bg-white/30" />
                  ))}
               </div>
               <Users className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10" />
            </Link>
          </div>

          {/* Category Pill Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${
                  activeTab === cat.id 
                    ? 'bg-[#00E5FF] text-white border-[#00E5FF] scale-105' 
                    : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
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

          {isRoomsLoading ? (
            <div className="flex justify-center py-20">
              <Loader className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 pb-12">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room: any) => (
                  <ChatRoomCard key={room.id} room={room} variant="modern" />
                ))
              ) : (
                <div className="col-span-2 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs italic">
                  No Frequencies Found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
