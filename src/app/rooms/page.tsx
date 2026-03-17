'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Ghost, Star, Sparkles, Trophy, Zap, Heart, Plus, Crown, Home, Gamepad2, Users, Loader } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, doc, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { UmmyLogoIcon } from '@/components/icons';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useTranslation } from '@/hooks/use-translation';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Trophy,
  Gamepad2,
  Zap,
  Star,
  Users,
  Heart
};

/**
 * High-Fidelity Rooms Hub.
 * Re-engineered to support Sovereign Decommissioning Protocol.
 */
export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [headerTab, setHeaderTab] = useState<'recommend' | 'me'>('recommend');

  const CATEGORIES = [
    { id: "All", label: t.home.categories.all },
    { id: "Chat", label: t.home.categories.chat },
    { id: "Games", label: t.home.categories.games },
    { id: "Newcomers", label: t.home.categories.newcomers },
    { id: "Party", label: t.home.categories.party }
  ];

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      orderBy('participantCount', 'desc'),
      limit(100)
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

  const bannerRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'banners'), [firestore]);
  const { data: bannerConfig } = useDoc(bannerRef);

  const displaySlides = useMemo(() => {
    if (bannerConfig?.slides && bannerConfig.slides.length > 0) {
      return bannerConfig.slides;
    }
    return [
      { id: 1, color: 'from-purple-600 to-indigo-600', title: 'Global Event', subtitle: 'Join the frequency', iconName: 'Sparkles' },
      { id: 2, color: 'from-orange-500 to-red-600', title: 'Elite Rewards', subtitle: 'Claim your throne', iconName: 'Trophy' }
    ];
  }, [bannerConfig]);

  /**
   * SOVEREIGN LISTING ENGINE: 
   * Rooms only visible if participantCount > 0 OR pinned.
   * EXCLUSION PROTOCOL: Explicitly hiding decommissioned "Synchronizing" rooms.
   */
  const displayRooms = useMemo(() => {
    if (!roomsData) return [];
    
    let filtered = roomsData.filter(room => {
      const cat = room.category || 'Chat';
      const matchesCategory = activeCategory === "All" || cat === activeCategory;
      
      const hasUsers = (room.participantCount || 0) > 0;
      const isPinned = room.isPinned === true;

      // DECOMMISSIONING SYNC: Exclude synchronizing or decommissioned IDs
      const isDecommissioned = room.id === 'ummy-help-center' || 
                               (room.name && room.name.toUpperCase().includes('SYNCHRONIZING'));

      return matchesCategory && (hasUsers || isPinned) && !isDecommissioned;
    });

    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.participantCount || 0) - (a.participantCount || 0);
    });
  }, [roomsData, activeCategory]);

  const RoomSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
      <div className="space-y-1.5 px-1">
        <Skeleton className="h-3.5 w-3/4 rounded-md" />
        <Skeleton className="h-2.5 w-1/2 rounded-md" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-ummy-gradient flex flex-col font-headline animate-in fade-in duration-700 pb-20">
        
        <header className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setHeaderTab('recommend')}
              className={cn(
                "text-lg font-black uppercase italic tracking-tighter transition-all",
                headerTab === 'recommend' ? "text-slate-900 scale-105" : "text-slate-300"
              )}
            >
              {t.home.recommend}
            </button>
            <button 
              onClick={() => setHeaderTab('me')}
              className={cn(
                "text-lg font-black uppercase italic tracking-tighter transition-all",
                headerTab === 'me' ? "text-slate-900 scale-105" : "text-slate-300"
              )}
            >
              {t.home.mine}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <UserSearchDialog />
            <button 
              onClick={() => user?.uid ? router.push(`/rooms/${user.uid}`) : null}
              className="p-1 bg-white rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-800"
            >
              <Home className="h-4 w-4" />
            </button>
          </div>
        </header>

        {headerTab === 'recommend' ? (
          <>
            <div className="px-5 mb-4 mt-2">
              <Carousel 
                className="w-full" 
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
              >
                <CarouselContent>
                  {displaySlides.map((slide: any, idx: number) => {
                    const Icon = ICON_MAP[slide.iconName] || Sparkles;
                    return (
                      <CarouselItem key={idx}>
                        <div className={cn("h-16 w-full rounded-[1.25rem] bg-gradient-to-br p-3 flex flex-col justify-center relative overflow-hidden shadow-md border-2 border-white/20 active:scale-[0.98] transition-all group", slide.color || 'from-purple-600 to-indigo-600')}>
                           {slide.imageUrl && (
                             <Image 
                               src={slide.imageUrl} 
                               alt="" 
                               fill 
                               className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" 
                               unoptimized 
                             />
                           )}
                           <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] group-hover:animate-shine" />
                           <div className="relative z-10">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                 <Icon className="h-3 w-3 text-white animate-pulse" />
                                 <h3 className="text-sm font-black uppercase italic tracking-tighter text-white drop-shadow-md">{slide.title}</h3>
                              </div>
                              <p className="text-[8px] font-bold text-white/70 uppercase tracking-widest leading-none">{slide.subtitle || slide.sub}</p>
                           </div>
                           <div className="absolute top-0 right-0 p-2 opacity-10">
                              <UmmyLogoIcon className="h-12 w-12 rotate-12" />
                            </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>

            <section className="px-5 grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => router.push('/leaderboard?type=rich')} className="group relative aspect-square rounded-[1rem] bg-gradient-to-br from-[#ffd700] via-[#ff9800] to-[#f57c00] border-2 border-white/30 shadow-lg overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-1.5">
                 <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                 <span className="absolute top-1 left-1.5 text-white font-black uppercase text-[6px] tracking-widest opacity-90">{t.profile.level}</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Crown className="h-7 w-7 text-white fill-yellow-200 drop-shadow-[0_0_8px_#ffffffcc]" />
                 </div>
              </button>
              <button onClick={() => router.push('/leaderboard?type=games')} className="group relative aspect-square rounded-[1rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 border-2 border-white/30 shadow-xl overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-1.5">
                 <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine delay-500" />
                 <span className="absolute top-1 left-1.5 text-white font-black uppercase text-[6px] tracking-widest opacity-90">{t.nav.games}</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="h-7 w-7 text-white fill-indigo-200 drop-shadow-[0_0_8px_#ffffffcc]" />
                 </div>
              </button>
              <button onClick={() => router.push('/cp-challenge')} className="group relative aspect-square rounded-[1rem] bg-gradient-to-br from-[#ff4d4d] via-[#f43f5e] to-[#be123c] border-2 border-white/30 shadow-xl overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-center p-1.5">
                 <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine delay-700" />
                 <span className="absolute top-1 left-1.5 text-white font-black uppercase text-[6px] tracking-widest opacity-90">{t.profile.cp}</span>
                 <div className="relative z-10 group-hover:scale-110 transition-transform">
                    <Heart className="h-7 w-7 text-white fill-pink-200 drop-shadow-[0_0_8px_#ffffffcc]" />
                 </div>
              </button>
            </section>

            <div className="px-5 mb-3">
              <div className="bg-gradient-to-r from-[#9C27B0] via-[#E91E63] to-[#9C27B0] h-8 rounded-full shadow-lg border-2 border-white/40 flex items-center justify-between px-4 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                <div className="flex items-center gap-1.5 relative z-10">
                   <Star className="h-3 w-3 text-yellow-400 fill-current animate-pulse" />
                   <span className="text-white font-black uppercase italic text-[9px] tracking-widest drop-shadow-md">{t.home.topRooms}</span>
                </div>
                <div className="flex -space-x-1 relative z-10">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar key={i} className="h-4 w-4 border-2 border-white shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${i + 50}/100`} />
                      <AvatarFallback className="text-[4px] bg-slate-200">U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 mb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-3 py-0.5 rounded-lg text-[10px] font-black uppercase italic tracking-tighter transition-all whitespace-nowrap border-2 border-transparent",
                      activeCategory === cat.id 
                        ? "bg-white/80 backdrop-blur-md text-purple-600 shadow-sm border-white/40" 
                        : "text-purple-400/70 hover:text-purple-500 hover:bg-white/10"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <main className="px-2 flex-1">
              {isRoomsLoading && !roomsData ? (
                <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
                </div>
              ) : displayRooms.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 pb-8">
                  {displayRooms.map((room: any) => (
                    <ChatRoomCard key={room.id} room={room} variant="modern" />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3 opacity-40">
                   <Ghost className="h-8 w-8 mx-auto text-slate-300" />
                   <p className="font-black uppercase italic text-[9px] tracking-widest">{t.home.noActive}</p>
                </div>
              )}
            </main>
          </>
        ) : (
          <main className="px-2 flex-1 animate-in slide-in-from-right-4 duration-500">
             <section className="mb-6 px-4">
                <h3 className="text-base font-black uppercase italic tracking-tighter text-slate-900 mb-3 flex items-center gap-2">
                   <Zap className="h-3.5 w-3.5 text-primary fill-current" /> {t.profile.id} {t.home.mine}
                </h3>
                {myRoom && !myRoom.name?.toUpperCase().includes('SYNCHRONIZING') ? (
                  <div className="max-w-[160px]">
                     <ChatRoomCard room={myRoom} variant="modern" />
                  </div>
                ) : (
                  <button 
                    onClick={() => router.push('/profile')}
                    className="w-full h-28 rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                     <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Plus className="h-4 w-4" />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.home.launch}</span>
                  </button>
                )}
             </section>

             <section className="px-2">
                <h3 className="text-base font-black uppercase italic tracking-tighter text-slate-900 mb-3 flex items-center gap-2 px-2">
                   <Heart className="h-3.5 w-3.5 text-pink-500 fill-current" /> {t.profile.follow}
                </h3>
                {isFollowedLoading ? (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-6">
                     {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
                  </div>
                ) : followedRooms && followedRooms.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-6 pb-8">
                     {followedRooms.map((room: any) => (
                       <ChatRoomCard key={room.id} room={room} variant="modern" />
                     ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3 opacity-40 bg-white/40 rounded-[1.5rem] border-2 border-dashed border-white/60 mx-2">
                     <Heart className="h-6 w-6 mx-auto text-slate-300" />
                     <p className="font-black uppercase italic text-[8px] tracking-widest">No Followed Tribes</p>
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
