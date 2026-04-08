'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { 
  useUser, 
  useCollection, 
  useMemoFirebase, 
  useFirestore, 
  useDoc,
  useFirebase
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  doc, 
  limit, 
} from 'firebase/firestore';
import { 
  Trophy, 
  Ghost,
  Loader,
  Sparkles,
  Home,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
 Carousel,
 CarouselContent,
 CarouselItem,
} from "@/components/ui/carousel";
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useTranslation } from '@/hooks/use-translation';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { RankingCard, FamilyCard, CpCard } from '@/components/premium-feature-cards';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useQuestInitializer } from '@/hooks/use-quest-initializer';
import { VipBadge } from '@/components/vip-badge';
import { GoldCoinIcon } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<string, any> = {
 Sparkles,
 Trophy,
};

const RoomSkeleton = () => (
  <div className="flex flex-col gap-3 min-w-[280px] snap-center">
   <Skeleton className="aspect-square w-full rounded-2xl" />
   <div className="space-y-1.5 px-1">
    <Skeleton className="h-3.5 w-3/4 rounded-md" />
    <Skeleton className="h-2.5 w-1/2 rounded-md" />
   </div>
  </div>
 );

export function RoomsExplorerGlossy() {
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: userDoc } = useUserProfile(user?.uid);
 const router = useRouter();
 const { t } = useTranslation();
 const { isHydrated } = useFirebase();
 const [activeCategory, setActiveCategory] = useState("All");
 const [headerTab, setHeaderTab] = useState<'recommend' | 'me'>('recommend');
 const [meTab, setMeTab] = useState<'following' | 'recent'>('following');

 // LOCKDOWN: Dynamic Mount Tracker
 const [isReady, setIsReady] = useState(false);
 useEffect(() => {
   setIsReady(true);
 }, []);

 const followedRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isHydrated) return null;
    return query(collection(firestore, 'users', user.uid, 'followedRooms'), orderBy('followedAt', 'desc'), limit(20));
  }, [firestore, user?.uid, isHydrated]);

 const { data: followedRoomsData, isLoading: isFollowedLoading } = useCollection(followedRoomsQuery);

 const recentRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isHydrated) return null;
    return query(collection(firestore, 'users', user.uid, 'recentVisits'), orderBy('visitedAt', 'desc'), limit(20));
  }, [firestore, user?.uid, isHydrated]);

 const { data: recentRoomsData, isLoading: isRecentLoading } = useCollection(recentRoomsQuery);

 const filteredRecentRooms = useMemo(() => {
   if (!recentRoomsData || !isHydrated) return [];
   const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
   return recentRoomsData.filter((visit: any) => {
     const visitTime = visit.visitedAt?.toDate?.().getTime() || 0;
     return visitTime > oneDayAgo;
   });
 }, [recentRoomsData, isHydrated]);

 // ⭐ DAILY QUEST INITIALIZER
 useQuestInitializer();

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

 const myRoomQuery = useMemoFirebase(() => {
   if (!firestore || !user?.uid || !isHydrated) return null;
   return query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid), limit(1));
  }, [firestore, user?.uid, isHydrated]);
 const { data: myRoomsData } = useCollection(myRoomQuery);
 const myRoom = myRoomsData?.[0];

 const bannerRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'banners'), [firestore]);
 const { data: bannerConfig } = useDoc(bannerRef);

 const displaySlides = useMemo(() => {
  if (!isHydrated || !bannerConfig?.slides || bannerConfig.slides.length === 0) {
    return [
     { id: 1, color: 'from-purple-600 to-indigo-600', title: 'Global Event', subtitle: 'Join the frequency', iconName: 'Sparkles' },
     { id: 2, color: 'from-orange-500 to-red-600', title: 'Elite Rewards', subtitle: 'Claim your throne', iconName: 'Trophy' }
    ];
  }
  return bannerConfig.slides;
 }, [bannerConfig, isHydrated]);

 const displayRooms = useMemo(() => {
  if (!roomsData || !isHydrated) return [];
  
  let filtered = roomsData.filter(room => {
   const cat = room.category || 'Chat';
   const matchesCategory = activeCategory === "All" || cat === activeCategory;
   const hasUsers = (room.participantCount || 0) > 0;
   const isPinned = room.isPinned === true;
   const isDecommissioned = room.id === 'ummy-help-center' || (room.name && room.name.toUpperCase().includes('SYNCHRONIZING'));
   return matchesCategory && (hasUsers || isPinned) && !isDecommissioned;
  });

  return [...filtered].sort((a, b) => {
   if (a.isPinned && !b.isPinned) return -1;
   if (!a.isPinned && b.isPinned) return 1;
   return (b.participantCount || 0) - (a.participantCount || 0);
  });
 }, [roomsData, activeCategory, isHydrated]);

  // STABILITY GUARD: Combine all signals for final flip.
  const showSummary = isReady && isHydrated && !isRoomsLoading && roomsData;

  return (
      <div className="flex-1 flex flex-col font-sans animate-in fade-in duration-700 bg-[#F4F7FE] h-screen overflow-hidden">
        
        {/* FIXED GLOSSY HEADER */}
        <header className="sticky top-0 z-[100] w-full bg-white/70 backdrop-blur-3xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-4 py-3 shrink-0">
          <div className="flex items-center justify-between w-full max-w-lg mx-auto">
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => setHeaderTab('recommend')} 
                  className={cn(
                    "text-[20px] font-black tracking-tighter transition-all duration-300 relative px-1", 
                    headerTab === 'recommend' ? "text-slate-900" : "text-slate-300 hover:text-slate-400"
                  )}
                >
                  Recommend
                  {headerTab === 'recommend' && (
                    <motion.div layoutId="header-active-line" className="absolute -bottom-1.5 left-0 right-0 h-1 bg-slate-900 rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => setHeaderTab('me')} 
                  className={cn(
                    "text-[20px] font-black tracking-tighter transition-all duration-300 relative px-1", 
                    headerTab === 'me' ? "text-slate-900" : "text-slate-300 hover:text-slate-400"
                  )}
                >
                  Me
                  {headerTab === 'me' && (
                    <motion.div layoutId="header-active-line" className="absolute -bottom-1.5 left-0 right-0 h-1 bg-slate-900 rounded-full" />
                  )}
                </button>
             </div>
             <div className="flex items-center gap-2">
                <div className="p-1 px-1.5 bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-white/80 active:scale-95 transition-all">
                  <UserSearchDialog />
                </div>
                <button 
                  onClick={() => { if (myRoom?.id) { router.push(`/rooms/${myRoom.id}`) } else { router.push('/rooms'); } }} 
                  className="p-2 bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-white/80 active:scale-95 transition-all flex items-center group"
                >
                  <Home className="h-5 w-5 text-slate-900" />
                </button>
             </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32">
          {headerTab === 'recommend' ? (
            <div className="max-w-lg mx-auto">
              {/* BANNER SECTION */}
              <div className="px-3 mb-2 mt-3">
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
                          <div 
                            onClick={() => slide.link && router.push(slide.link)}
                            className={cn(
                              "h-[120px] w-full rounded-[2rem] bg-gradient-to-br p-3 flex flex-col justify-center relative overflow-hidden shadow-xl border border-white/20 active:scale-[0.98] transition-all group", 
                              slide.link ? "cursor-pointer" : "",
                              slide.color || 'from-purple-600 to-indigo-600'
                            )}
                          >
                            {slide.imageUrl && (
                              <Image 
                                src={slide.imageUrl} 
                                alt="" 
                                fill 
                                className="object-cover opacity-100 group-hover:scale-105 transition-transform duration-1000" 
                                unoptimized 
                              />
                            )}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {!slide.imageUrl && (
                              <div className="relative z-10 px-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="bg-white/20 p-1 rounded-lg backdrop-blur-md border border-white/30">
                                    <Icon className="h-5 w-5 text-white animate-pulse" />
                                  </div>
                                  <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{slide.title}</h3>
                                </div>
                                <p className="text-[11px] font-black text-white drop-shadow-lg uppercase tracking-[0.4em] leading-none ml-1">{slide.subtitle || slide.sub}</p>
                              </div>
                            )}
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                </Carousel>
              </div>

              {/* LIVE FREQUENCY SECTION */}
              <div className="px-3 mb-3">
                <div className="bg-white/60 backdrop-blur-3xl rounded-[2rem] p-3 border border-white shadow-xl overflow-hidden relative group">
                  <div className="flex items-center justify-between mb-3 relative z-10 px-1">
                     <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <h2 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Live Now</h2>
                     </div>
                     <button onClick={() => router.push('/rooms/all')} className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 hover:text-slate-900 transition-colors">View All <LayoutGrid className="h-2.5 w-2.5" /></button>
                  </div>
                  <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1 relative z-10">
                     {!showSummary ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                            <div className="h-12 w-12 rounded-full bg-slate-100 border border-white" />
                            <div className="h-2 w-10 bg-slate-100 rounded-full" />
                          </div>
                        ))
                     ) : (
                       roomsData.slice(0, 10).map((room: any) => (
                         <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-all cursor-pointer group/item">
                            <div className="relative">
                               <Avatar className="h-12 w-12 border-2 border-white shadow-md group-hover/item:border-slate-900 transition-all">
                                  <AvatarImage src={room.coverUrl} className="object-cover" />
                                  <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-[10px]">U</AvatarFallback>
                               </Avatar>
                               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-1.5 py-0.2 rounded-full border border-slate-100 flex items-center gap-0.5 shadow-sm">
                                  <div className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
                                  <span className="text-[7px] font-black text-slate-800">{room.participantCount || 0}</span>
                               </div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-600 uppercase truncate w-14 text-center">{room.title}</span>
                         </div>
                       ))
                     )}
                  </div>
                </div>
              </div>

              {/* PREMIUM FEATURE CARDS */}
              <div className="px-3 mb-4">
                <div className="flex gap-3">
                   <RankingCard />
                   <FamilyCard />
                   <CpCard />
                </div>
              </div>

              {/* CATEGORY SELECTOR - STICKY INSIDE SCROLL AREA */}
              <div className="px-3 sticky top-0 z-40 bg-[#F4F7FE]/80 backdrop-blur-md py-2 border-b border-slate-200/20">
                <div className="w-full overflow-x-auto no-scrollbar">
                  <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                          activeCategory === cat.id 
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                            : "bg-white text-slate-500 border border-white hover:bg-slate-50 shadow-sm"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROOM LISTING */}
              <main className="px-3 pb-6">
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 pt-2">
                  {!showSummary ? (
                     Array.from({ length: 6 }).map((_, i) => <RoomSkeleton key={i} />)
                  ) : displayRooms.length > 0 ? (
                    displayRooms.map((room: any) => (
                      <ChatRoomCard key={room.id} room={room} variant="modern" />
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center space-y-3 opacity-40">
                      <Ghost className="h-8 w-8 mx-auto text-slate-300" />
                      <p className="font-bold uppercase text-[9px] tracking-wider">{t.home.noActive}</p>
                    </div>
                  )}
                </div>
              </main>
            </div>
          ) : (
            <div className="max-w-lg mx-auto px-4 animate-in slide-in-from-right-4 duration-500 mt-4">
              <div className={cn("transition-opacity duration-300", !isReady ? "opacity-0" : "opacity-100")}>
                 {!isReady || !userDoc ? (
                   <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                     <Loader className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Identity...</p>
                   </div>
                 ) : (
                   <>
                     <section className="mb-6">
                       <div className="flex items-center justify-between bg-white rounded-[2.5rem] p-5 shadow-xl border border-white relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                         
                         <div className="flex items-center gap-4 relative z-10 w-full">
                           <div className="relative shrink-0">
                             <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-lg">
                               <AvatarImage src={userDoc?.avatarUrl} className="object-cover" />
                               <AvatarFallback className="bg-slate-900 text-white font-black text-xl">U</AvatarFallback>
                             </Avatar>
                             <div className="absolute -bottom-1 -right-1">
                               <VipBadge level={userDoc?.level?.rich || 1} />
                             </div>
                           </div>
                           
                           <div className="flex flex-col flex-1 min-w-0">
                             <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">{userDoc?.username || 'Member'}</h2>
                             <div className="flex items-center gap-1.5 opacity-40">
                               <span className="text-[9px] font-black uppercase tracking-widest">ID: {userDoc?.accountNumber || '---'}</span>
                             </div>
                             <div className="flex items-center gap-2 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                               <GoldCoinIcon className="h-3 w-3" />
                               <span className="text-[11px] font-black text-slate-700">{(userDoc?.wallet?.coins || 0).toLocaleString()}</span>
                             </div>
                           </div>

                           <button 
                             onClick={() => { if (myRoom?.id) router.push(`/rooms/${myRoom.id}`); }}
                             className="shrink-0 bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg active:scale-90 transition-all"
                           >
                             <Home className="h-5 w-5" />
                           </button>
                         </div>
                       </div>
                     </section>

                     <div className="flex gap-6 mb-6 px-1">
                       <button 
                         onClick={() => setMeTab('following')} 
                         className={cn(
                           "text-sm font-black uppercase tracking-widest relative pb-2 transition-all",
                           meTab === 'following' ? "text-slate-900" : "text-slate-300"
                         )}
                       >
                         Following
                         {meTab === 'following' && <motion.div layoutId="me-active-line" className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-full" />}
                       </button>
                       <button 
                         onClick={() => setMeTab('recent')} 
                         className={cn(
                           "text-sm font-black uppercase tracking-widest relative pb-2 transition-all",
                           meTab === 'recent' ? "text-slate-900" : "text-slate-300"
                         )}
                       >
                         Recent
                         {meTab === 'recent' && <motion.div layoutId="me-active-line" className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-full" />}
                       </button>
                     </div>

                     {meTab === 'following' && (
                       <section className="animate-in fade-in slide-in-from-left-4 duration-300">
                         {isFollowedLoading ? (
                           <div className="grid grid-cols-2 gap-4">
                             {Array.from({ length: 4 }).map((_, i) => (
                               <div key={i} className="aspect-square rounded-[2rem] bg-white animate-pulse" />
                             ))}
                           </div>
                         ) : followedRoomsData && followedRoomsData.length > 0 ? (
                           <div className="grid grid-cols-2 gap-4">
                             {followedRoomsData.map((roomRef: any) => (
                               <div key={roomRef.id} onClick={() => router.push(`/rooms/${roomRef.id}`)} className="group active:scale-95 transition-all cursor-pointer">
                                 <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-lg border border-white mb-2">
                                    <Image 
                                     src={roomRef.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                     alt={roomRef.title}
                                     fill
                                     className="object-cover group-hover:scale-110 transition-transform duration-700"
                                     unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                       <h4 className="text-[12px] font-black text-white uppercase truncate tracking-tight">{roomRef.title}</h4>
                                    </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 border-2 border-dashed border-white rounded-[3rem] bg-white/40">
                             No rooms followed yet
                           </div>
                         )}
                       </section>
                     )}

                     {meTab === 'recent' && (
                       <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                         {isRecentLoading ? (
                           <div className="grid grid-cols-2 gap-4">
                             {Array.from({ length: 4 }).map((_, i) => (
                               <div key={i} className="aspect-square rounded-[2rem] bg-white animate-pulse" />
                             ))}
                           </div>
                         ) : filteredRecentRooms.length > 0 ? (
                           <div className="grid grid-cols-2 gap-4">
                             {filteredRecentRooms.map((visit: any) => (
                               <div key={visit.id} onClick={() => router.push(`/rooms/${visit.id}`)} className="group active:scale-95 transition-all cursor-pointer">
                                 <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-lg border border-white mb-2">
                                    <Image 
                                     src={visit.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                     alt={visit.title}
                                     fill
                                     className="object-cover group-hover:scale-110 transition-transform duration-700"
                                     unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-2.5 py-1 shadow-sm">
                                       <span className="text-[8px] font-black text-slate-900 uppercase tracking-tighter">Recent</span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                       <h4 className="text-[12px] font-black uppercase truncate tracking-tight">{visit.title}</h4>
                                    </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 border-2 border-dashed border-white rounded-[3rem] bg-white/40">
                             No recent visits in 24h
                           </div>
                         )}
                       </section>
                     )}
                   </>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
