'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Bell, User, Ghost, Star, Sparkles, Trophy, Zap, Heart, Plus, Loader, Crown, Home, Gamepad2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, doc, where } from 'firebase/firestore';
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
import { UserSearchDialog } from '@/components/user-search-dialog';

const CATEGORIES = ["All", "Chat", "Games", "Newcomers", "Party"];

export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [headerTab, setHeaderTab] = useState<'recommend' | 'me'>('recommend');

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      where('participantCount', '>', 0), 
      orderBy('participantCount', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(roomsQuery);

  const myRoomRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'chatRooms', user.uid);
  }, [firestore, user]);
  const { data: myRoom } = useDoc(myRoomRef);

  const followedRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'followedRooms'), limit(20));
  }, [firestore, user]);
  const { data: followedRooms, isLoading: isFollowedLoading } = useCollection(followedRoomsQuery);

  const displayRooms = useMemo(() => {
    if (!roomsData) return [];
    return roomsData.filter(room => (room.participantCount || 0) > 0);
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
        
        <header className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setHeaderTab('recommend')}
              className={cn(
                "text-2xl font-black uppercase italic tracking-tighter transition-all",
                headerTab === 'recommend' ? "text-slate-900 scale-105" : "text-slate-300"
              )}
            >
              Recommend
            </button>
            <button 
              onClick={() => setHeaderTab('me')}
              className={cn(
                "text-2xl font-black uppercase italic tracking-tighter transition-all",
                headerTab === 'me' ? "text-slate-900 scale-105" : "text-slate-300"
              )}
            >
              Me
            </button>
          </div>
          <div className="flex items-center gap-2">
            <UserSearchDialog />
            <button 
              onClick={() => user?.uid ? router.push(`/rooms/${user.uid}`) : null}
              className="p-2 bg-white rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-800"
            >
              <Home className="h-6 w-6" />
            </button>
          </div>
        </header>

        {headerTab === 'recommend' ? (
          <>
            <section className="px-6 grid grid-cols-3 gap-4 mb-8">
              <button onClick={() => router.push('/leaderboard?type=rich')} className="group relative h-24 rounded-[1.5rem] bg-gradient-to-br from-[#ffd700] via-[#ff9800] to-[#f57c00] border-2 border-white/30 shadow-xl overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-2">
                 <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
                 <span className="absolute top-2 left-3 text-white font-black uppercase text-[8px] tracking-widest opacity-90">Rich</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Crown className="h-10 w-10 text-white fill-yellow-200 drop-shadow-[0_0_15px_#ffffffcc]" />
                 </div>
              </button>
              <button onClick={() => router.push('/leaderboard?type=games')} className="group relative h-24 rounded-[1.5rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 border-2 border-white/30 shadow-xl overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-2">
                 <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine delay-500" />
                 <span className="absolute top-2 left-3 text-white font-black uppercase text-[8px] tracking-widest opacity-90">Game</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="h-10 w-10 text-white fill-indigo-200 drop-shadow-[0_0_15px_#ffffffcc]" />
                 </div>
              </button>
              <button onClick={() => router.push('/cp-challenge')} className="group relative h-24 rounded-[1.5rem] bg-gradient-to-br from-[#ff4d4d] via-[#f43f5e] to-[#be123c] border-2 border-white/30 shadow-xl overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-2">
                 <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine delay-700" />
                 <span className="absolute top-2 left-3 text-white font-black uppercase text-[8px] tracking-widest opacity-90">Cp</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Heart className="h-10 w-10 text-white fill-pink-200 drop-shadow-[0_0_15px_#ffffffcc]" />
                 </div>
              </button>
            </section>

            <div className="px-6 mb-8">
              <div className="bg-gradient-to-r from-[#9C27B0] via-[#E91E63] to-[#9C27B0] h-14 rounded-full shadow-2xl border-2 border-white/40 flex items-center justify-between px-8 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
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

            <div className="px-6 mb-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[12px] font-black uppercase italic tracking-tighter transition-all whitespace-nowrap border-2 border-transparent",
                      activeCategory === cat 
                        ? "bg-white/80 backdrop-blur-md text-purple-600 shadow-lg border-white/40 scale-[1.05]" 
                        : "text-purple-400/70 hover:text-purple-500 hover:bg-white/10"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <main className="px-4 flex-1">
              {isRoomsLoading && !roomsData ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
                </div>
              ) : displayRooms.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-10">
                  {/* First 4 Rooms */}
                  {displayRooms.slice(0, 4).map((room: any) => (
                    <ChatRoomCard key={room.id} room={room} variant="modern" />
                  ))}

                  {/* High-Fidelity Banner Synchronized after 4 rooms */}
                  <div className="col-span-2 py-2">
                    <Carousel className="w-full" opts={{ loop: true }}>
                      <CarouselContent>
                        {[
                          { id: 1, color: 'from-purple-600 to-indigo-600', title: 'Global Event', sub: 'Join the frequency', icon: Sparkles },
                          { id: 2, color: 'from-orange-500 to-red-600', title: 'Elite Rewards', sub: 'Claim your throne', icon: Trophy }
                        ].map((b) => (
                          <CarouselItem key={b.id}>
                            <div className={cn("h-24 w-full rounded-[2.5rem] bg-gradient-to-br p-4 flex flex-col justify-center relative overflow-hidden shadow-xl border-2 border-white/20 active:scale-[0.98] transition-all group", b.color)}>
                               <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] group-hover:animate-shine" />
                               <div className="relative z-10">
                                  <div className="flex items-center gap-2 mb-1">
                                     <b.icon className="h-4 w-4 text-white animate-pulse" />
                                     <h3 className="text-lg font-black uppercase italic tracking-tighter text-white drop-shadow-md">{b.title}</h3>
                                  </div>
                                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{b.sub}</p>
                               </div>
                               <div className="absolute top-0 right-0 p-4 opacity-10">
                                  <UmmyLogoIcon className="h-20 w-20 rotate-12" />
                                </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  </div>

                  {/* Remaining Rooms */}
                  {displayRooms.slice(4).map((room: any) => (
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
          </>
        ) : (
          <main className="px-6 flex-1 animate-in slide-in-from-right-4 duration-500">
             <section className="mb-10">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-6 flex items-center gap-2">
                   <Zap className="h-5 w-5 text-primary fill-current" /> My Room
                </h3>
                {myRoom ? (
                  <div className="max-w-[200px]">
                     <ChatRoomCard room={myRoom} variant="modern" />
                  </div>
                ) : (
                  <button 
                    onClick={() => router.push('/profile')}
                    className="w-full h-40 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                     <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Plus className="h-6 w-6" />
                     </div>
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Launch Frequency</span>
                  </button>
                )}
             </section>

             <section>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-6 flex items-center gap-2">
                   <Heart className="h-5 w-5 text-pink-500 fill-current" /> Following
                </h3>
                {isFollowedLoading ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-10">
                     {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
                  </div>
                ) : followedRooms && followedRooms.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-10 pb-10">
                     {followedRooms.map((room: any) => (
                       <ChatRoomCard key={room.id} room={room} variant="modern" />
                     ))}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4 opacity-40 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-white/60">
                     <Heart className="h-10 w-10 mx-auto text-slate-300" />
                     <p className="font-black uppercase italic text-[10px] tracking-widest">No Followed Tribes</p>
                  </div>
                )}
             </section>
          </main>
        )}

      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </AppLayout>
  );
}
