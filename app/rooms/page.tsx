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
    <div className="space-y-2">
      <Skeleton className="aspect-square w-full rounded-[2rem]" />
      <div className="space-y-1.5 px-1">
        <Skeleton className="h-3.5 w-3/4 rounded-md" />
        <Skeleton className="h-2.5 w-1/2 rounded-md" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-ummy-gradient flex flex-col font-headline animate-in fade-in duration-700 pb-20">
        
        <header className="flex items-center justify-between px-5 pt-4 pb-1 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setHeaderTab('recommend')}
              className={cn(
                "text-xl font-black uppercase italic tracking-tighter transition-all",
                headerTab === 'recommend' ? "text-slate-900 scale-105" : "text-slate-300"
              )}
            >
              Recommend
            </button>
            <button 
              onClick={() => setHeaderTab('me')}
              className={cn(
                "text-xl font-black uppercase italic tracking-tighter transition-all",
                headerTab === 'me' ? "text-slate-900 scale-105" : "text-slate-300"
              )}
            >
              Me
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <UserSearchDialog />
            <button 
              onClick={() => user?.uid ? router.push(`/rooms/${user.uid}`) : null}
              className="p-1.5 bg-white rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-800"
            >
              <Home className="h-5 w-5" />
            </button>
          </div>
        </header>

        {headerTab === 'recommend' ? (
          <>
            <section className="px-5 grid grid-cols-3 gap-3 mb-4">
              <button onClick={() => router.push('/leaderboard?type=rich')} className="group relative aspect-square rounded-[1.25rem] bg-gradient-to-br from-[#ffd700] via-[#ff9800] to-[#f57c00] border-2 border-white/30 shadow-lg overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-2">
                 <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                 <span className="absolute top-1.5 left-2 text-white font-black uppercase text-[7px] tracking-widest opacity-90">Rich</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Crown className="h-9 w-9 text-white fill-yellow-200 drop-shadow-[0_0_10px_#ffffffcc]" />
                 </div>
              </button>
              <button onClick={() => router.push('/leaderboard?type=games')} className="group relative aspect-square rounded-[1.25rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 border-2 border-white/30 shadow-xl overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-2">
                 <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine delay-500" />
                 <span className="absolute top-1.5 left-2 text-white font-black uppercase text-[7px] tracking-widest opacity-90">Game</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="h-9 w-9 text-white fill-indigo-200 drop-shadow-[0_0_10px_#ffffffcc]" />
                 </div>
              </button>
              <button onClick={() => router.push('/cp-challenge')} className="group relative aspect-square rounded-[1.25rem] bg-gradient-to-br from-[#ff4d4d] via-[#f43f5e] to-[#be123c] border-2 border-white/30 shadow-xl overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-2">
                 <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine delay-700" />
                 <span className="absolute top-1.5 left-2 text-white font-black uppercase text-[7px] tracking-widest opacity-90">Cp</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Heart className="h-9 w-9 text-white fill-pink-200 drop-shadow-[0_0_10px_#ffffffcc]" />
                 </div>
              </button>
            </section>

            <div className="px-5 mb-4">
              <div className="bg-gradient-to-r from-[#9C27B0] via-[#E91E63] to-[#9C27B0] h-10 rounded-full shadow-lg border-2 border-white/40 flex items-center justify-between px-5 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                <div className="flex items-center gap-2 relative z-10">
                   <Star className="h-3.5 w-3.5 text-yellow-400 fill-current animate-pulse" />
                   <span className="text-white font-black uppercase italic text-[10px] tracking-widest drop-shadow-md">Top Rooms Grid</span>
                </div>
                <div className="flex -space-x-1.5 relative z-10">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar key={i} className="h-5 w-5 border-2 border-white shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${i + 50}/100`} />
                      <AvatarFallback className="text-[5px] bg-slate-200">U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 mb-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-3.5 py-1 rounded-lg text-[11px] font-black uppercase italic tracking-tighter transition-all whitespace-nowrap border-2 border-transparent",
                      activeCategory === cat 
                        ? "bg-white/80 backdrop-blur-md text-purple-600 shadow-md border-white/40 scale-[1.03]" 
                        : "text-purple-400/70 hover:text-purple-500 hover:bg-white/10"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <main className="px-3.5 flex-1">
              {isRoomsLoading && !roomsData ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                  {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
                </div>
              ) : displayRooms.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 pb-10">
                  {displayRooms.slice(0, 4).map((room: any) => (
                    <ChatRoomCard key={room.id} room={room} variant="modern" />
                  ))}

                  <div className="col-span-2 py-1">
                    <Carousel className="w-full" opts={{ loop: true }}>
                      <CarouselContent>
                        {[
                          { id: 1, color: 'from-purple-600 to-indigo-600', title: 'Global Event', sub: 'Join the frequency', icon: Sparkles },
                          { id: 2, color: 'from-orange-500 to-red-600', title: 'Elite Rewards', sub: 'Claim your throne', icon: Trophy }
                        ].map((b) => (
                          <CarouselItem key={b.id}>
                            <div className={cn("h-20 w-full rounded-[1.75rem] bg-gradient-to-br p-3.5 flex flex-col justify-center relative overflow-hidden shadow-lg border-2 border-white/20 active:scale-[0.98] transition-all group", b.color)}>
                               <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] group-hover:animate-shine" />
                               <div className="relative z-10">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                     <b.icon className="h-3.5 w-3.5 text-white animate-pulse" />
                                     <h3 className="text-base font-black uppercase italic tracking-tighter text-white drop-shadow-md">{b.title}</h3>
                                  </div>
                                  <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest">{b.sub}</p>
                               </div>
                               <div className="absolute top-0 right-0 p-3 opacity-10">
                                  <UmmyLogoIcon className="h-16 w-16 rotate-12" />
                                </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  </div>

                  {displayRooms.slice(4).map((room: any) => (
                    <ChatRoomCard key={room.id} room={room} variant="modern" />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3 opacity-40">
                   <Ghost className="h-10 w-10 mx-auto text-slate-300" />
                   <p className="font-black uppercase italic text-[10px] tracking-widest">No Active Frequencies</p>
                </div>
              )}
            </main>
          </>
        ) : (
          <main className="px-5 flex-1 animate-in slide-in-from-right-4 duration-500">
             <section className="mb-8">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 mb-4 flex items-center gap-2">
                   <Zap className="h-4 w-4 text-primary fill-current" /> My Room
                </h3>
                {myRoom ? (
                  <div className="max-w-[180px]">
                     <ChatRoomCard room={myRoom} variant="modern" />
                  </div>
                ) : (
                  <button 
                    onClick={() => router.push('/profile')}
                    className="w-full h-32 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all"
                  >
                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Plus className="h-5 w-5" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Launch Frequency</span>
                  </button>
                )}
             </section>

             <section>
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 mb-4 flex items-center gap-2">
                   <Heart className="h-4 w-4 text-pink-500 fill-current" /> Following
                </h3>
                {isFollowedLoading ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-8">
                     {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
                  </div>
                ) : followedRooms && followedRooms.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-8 pb-10">
                     {followedRooms.map((room: any) => (
                       <ChatRoomCard key={room.id} room={room} variant="modern" />
                     ))}
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-3 opacity-40 bg-white/40 rounded-[2rem] border-2 border-dashed border-white/60">
                     <Heart className="h-8 w-8 mx-auto text-slate-300" />
                     <p className="font-black uppercase italic text-[9px] tracking-widest">No Followed Tribes</p>
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
