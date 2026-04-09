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
import { ThemeColorMeta } from '@/components/theme-color-meta';
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
import { RoomsExplorerGlossy } from './rooms-explorer-glossy';

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

export default function RoomsExplorer() {
 const firestore = useFirestore();
 const configRef = useMemo(() => firestore ? doc(firestore, 'appConfig', 'global') : null, [firestore]);
 const { data: config } = useDoc(configRef);
 const theme = config?.appTheme || 'CLASSIC';

 const { user } = useUser();
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

  if (theme === 'GLOSSY') {
   return <RoomsExplorerGlossy />;
  }
  return (
    <div className="h-[100dvh] flex flex-col font-sans animate-in fade-in duration-700 text-slate-900 overflow-hidden bg-white">
      <ThemeColorMeta color="#eef9ff" />
      
      {/* SEAMLESS MOUNTAIN BACKGROUND (Screenshot 2 fix) */}
      <div className="absolute top-0 left-0 right-0 h-[260px] bg-gradient-to-b from-[#eef9ff] via-[#f7f0ff] to-white z-0 overflow-hidden pointer-events-none">
         <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-wall.png")' }} />
         <div className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.15]">
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="h-full w-full fill-blue-500">
               <path d="M0,300 L0,150 L150,220 L300,100 L500,200 L700,50 L850,180 L1000,120 L1000,300 Z" />
            </svg>
         </div>
         <div className="absolute bottom-0 left-0 right-0 h-32 opacity-[0.1]">
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="h-full w-full fill-indigo-600">
               <path d="M0,300 L0,200 L200,100 L400,220 L600,150 L800,250 L1000,180 L1000,300 Z" />
            </svg>
         </div>
      </div>

      <header className="flex items-center justify-between px-4 pt-safe shrink-0 relative z-50 bg-transparent pb-4">
        <div className="flex items-center justify-between w-full">
           <div className="flex items-center gap-3">
              <button onClick={() => setHeaderTab('recommend')} className={cn("text-xl font-bold tracking-tight transition-all", headerTab === 'recommend' ? "text-slate-900" : "text-slate-300 opacity-50")}>Recommend</button>
              <button onClick={() => setHeaderTab('me')} className={cn("text-xl font-bold tracking-tight transition-all", headerTab === 'me' ? "text-slate-900" : "text-slate-300 opacity-50")}>Me</button>
           </div>
           <div className="flex items-center gap-2 text-slate-800">
              <UserSearchDialog />
              <button 
                onClick={() => { if (myRoom?.id) { router.push(`/rooms/${myRoom.id}`) } else { router.push('/rooms'); } }} 
                className="p-1 px-1.5 bg-white/60 backdrop-blur-md rounded-full shadow-md border border-white/20 active:scale-90 transition-all flex items-center"
              >
                <Home className="h-4 w-4" />
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto relative z-10 no-scrollbar pb-32">
        {headerTab === 'recommend' ? (
          <>
            <div className="px-2.5 mb-1 mt-0">
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
                            "h-[110px] w-full rounded-[1.8rem] bg-gradient-to-br p-3 flex flex-col justify-center relative overflow-hidden shadow-2xl border-2 border-white/20 active:scale-[0.98] transition-all group", 
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

            <div className="px-3 mb-2">
              <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 backdrop-blur-3xl rounded-[1.2rem] p-2 border-2 border-white/10 shadow-2xl overflow-hidden relative group h-[72px]">
                <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-1 relative z-10 px-1">
                   <div className="flex items-center gap-1">
                      <Trophy className="h-2.5 w-2.5 text-yellow-400 animate-bounce" />
                      <h2 className="text-[8px] font-black uppercase text-white/90 tracking-widest">Live Frequency</h2>
                   </div>
                   <button onClick={() => router.push('/rooms/all')} className="text-[7px] font-bold text-yellow-400/80 uppercase hover:text-yellow-400 transition-colors flex items-center gap-0.5">Explore <LayoutGrid className="h-2 w-2" /></button>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pt-0.5 pb-0.5 relative z-10 min-h-[40px]">
                   {!showSummary ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                          <div className="h-10 w-10 rounded-full bg-red-900/20 border border-white/10" />
                          <div className="h-1.5 w-8 bg-white/20 rounded-full" />
                        </div>
                      ))
                   ) : (
                     roomsData.slice(0, 10).map((room: any) => (
                       <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-all cursor-pointer group/item">
                          <div className="relative">
                             <Avatar className="h-10 w-10 border-1 border-yellow-400/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover/item:border-yellow-400 transition-all">
                                <AvatarImage src={room.coverUrl} className="object-cover" />
                                <AvatarFallback className="bg-red-900/40 text-white/40 font-black text-[10px]">U</AvatarFallback>
                             </Avatar>
                             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 px-1.5 py-0.5 rounded-full border border-white/20 flex items-center gap-0.5 shadow-xl">
                                <div className="h-1 w-1 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                                <span className="text-[7px] font-black text-white">{room.participantCount || 0}</span>
                             </div>
                          </div>
                          <span className="text-[8px] font-bold text-white/90 uppercase tracking-tighter truncate w-14 text-center drop-shadow-sm">{room.title}</span>
                       </div>
                     ))
                   )}
                </div>
              </div>
            </div>

            <div className="px-2.5 mb-1.5">
              <div className="flex gap-2.5">
                 <RankingCard />
                 <FamilyCard />
                 <CpCard />
              </div>
            </div>

            <div className="px-3 sticky top-0 z-40 bg-white/80 backdrop-blur-md py-2 mb-1 border-b border-slate-100 flex items-center">
              <div className="w-full overflow-x-auto no-scrollbar">
                <div className="flex gap-1.5 px-0.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                        activeCategory === cat.id 
                          ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" 
                          : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <main className="px-3 flex-1 pb-6">
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 pb-8">
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
          </>
        ) : (
          <div className="px-4 flex-1 animate-in slide-in-from-right-4 duration-500 pb-28">
            <div className={cn("transition-opacity duration-300", !isReady ? "opacity-0" : "opacity-100")}>
               {!isReady || !userDoc ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                   <Loader className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Identity...</p>
                 </div>
               ) : (
                 <>
                   <section className="mb-6 mt-2">
                     <div className="flex items-center justify-between bg-white rounded-[2rem] p-4 shadow-xl border border-slate-100 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700" />
                       
                       <div className="flex items-center gap-4 relative z-10 w-full">
                         <div className="relative shrink-0">
                           <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-2xl">
                             <AvatarImage src={userDoc?.avatarUrl} className="object-cover" />
                             <AvatarFallback className="bg-slate-900 text-white font-black text-xl">U</AvatarFallback>
                           </Avatar>
                           <div className="absolute -bottom-1 -right-1">
                             <VipBadge level={userDoc?.level?.rich || 1} />
                           </div>
                         </div>
                         
                         <div className="flex flex-col flex-1 min-w-0 pr-2">
                           <h2 className="text-lg font-bold text-slate-900 truncate">{userDoc?.username || 'Member'}</h2>
                           <div className="flex items-center gap-1">
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {userDoc?.accountNumber || '---'}</span>
                           </div>
                           <div className="flex items-center gap-1.5 mt-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 w-fit">
                             <GoldCoinIcon className="h-2.5 w-2.5" />
                             <span className="text-[10px] font-black text-slate-700">{(userDoc?.wallet?.coins || 0).toLocaleString()}</span>
                           </div>
                         </div>

                         <button 
                           onClick={() => { if (myRoom?.id) router.push(`/rooms/${myRoom.id}`); }}
                           className="shrink-0 bg-slate-900 text-white rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-[0_10px_20_rgba(15,23,42,0.3)] active:scale-95 transition-all"
                         >
                           My Room
                         </button>
                       </div>
                     </div>
                   </section>

                   <div className="flex gap-4 mb-6 px-1 border-b border-slate-200/50">
                     <button 
                       onClick={() => setMeTab('following')} 
                       className={cn(
                         "pb-3 text-xs font-bold uppercase tracking-[0.2em] relative transition-all",
                         meTab === 'following' ? "text-slate-900" : "text-slate-300 opacity-60"
                       )}
                     >
                       Following
                       {meTab === 'following' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-full animate-in fade-in slide-in-from-bottom-1" />}
                     </button>
                     <button 
                       onClick={() => setMeTab('recent')} 
                       className={cn(
                         "pb-3 text-xs font-bold uppercase tracking-[0.2em] relative transition-all",
                         meTab === 'recent' ? "text-slate-900" : "text-slate-300 opacity-60"
                       )}
                     >
                       Recent
                       {meTab === 'recent' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-full animate-in fade-in slide-in-from-bottom-1" />}
                     </button>
                   </div>

                   {meTab === 'following' && (
                     <section className="animate-in fade-in slide-in-from-left-4 duration-300">
                       {isFollowedLoading ? (
                         <div className="grid grid-cols-2 gap-3">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="aspect-square rounded-[2rem] bg-slate-100 animate-pulse" />
                           ))}
                         </div>
                       ) : followedRoomsData && followedRoomsData.length > 0 ? (
                         <div className="grid grid-cols-2 gap-3">
                           {followedRoomsData.map((roomRef: any) => (
                             <div key={roomRef.id} onClick={() => router.push(`/rooms/${roomRef.id}`)} className="group active:scale-95 transition-all cursor-pointer">
                               <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 mb-2">
                                  <Image 
                                   src={roomRef.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                   alt={roomRef.title}
                                   fill
                                   className="object-cover group-hover:scale-105 transition-transform duration-500"
                                   unoptimized
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-3 left-3 right-3 text-white">
                                     <h4 className="text-[11px] font-black uppercase truncate tracking-tight">{roomRef.title}</h4>
                                  </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                           No rooms followed yet
                         </div>
                       )}
                     </section>
                   )}

                   {meTab === 'recent' && (
                     <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                       {isRecentLoading ? (
                         <div className="grid grid-cols-2 gap-3">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="aspect-square rounded-[2rem] bg-slate-100 animate-pulse" />
                           ))}
                         </div>
                       ) : filteredRecentRooms.length > 0 ? (
                         <div className="grid grid-cols-2 gap-3">
                           {filteredRecentRooms.map((visit: any) => (
                             <div key={visit.id} onClick={() => router.push(`/rooms/${visit.id}`)} className="group active:scale-95 transition-all cursor-pointer">
                               <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 mb-2">
                                  <Image 
                                   src={visit.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                   alt={visit.title}
                                   fill
                                   className="object-cover group-hover:scale-105 transition-transform duration-500"
                                   unoptimized
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/30">
                                     <span className="text-[8px] font-black text-white uppercase">Recently</span>
                                  </div>
                                  <div className="absolute bottom-3 left-3 right-3 text-white">
                                     <h4 className="text-[11px] font-black uppercase truncate tracking-tight">{visit.title}</h4>
                                  </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                           No recent visits (last 24h)
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

