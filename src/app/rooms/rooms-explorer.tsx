'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  Plus,
  Compass,
  Mail,
  User,
  CalendarCheck,
  CircleDollarSign, 
  X 
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
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { useTranslation } from '@/hooks/use-translation';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { RankingCard, FamilyCard, CpCard } from '@/components/premium-feature-cards';
import { UnreadBadge } from '@/components/unread-badge';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useQuestInitializer } from '@/hooks/use-quest-initializer';
import { VipBadge } from '@/components/vip-badge';
import { GoldCoinIcon } from '@/components/icons';
import { RoomsExplorerGlossy } from './rooms-explorer-glossy';

const ICON_MAP: Record<string, any> = {
 Sparkles,
 Trophy,
};

// ==========================================
// NEW CUSTOM HOME ICON (From 2nd Program)
// ==========================================
const CustomHomeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" className={className}>
    <path 
      fill="currentColor" 
      fillRule="evenodd" 
      d="M 500 80 L 285 285 C 125 410 125 525 125 525 C 125 525 210 565 210 565 L 185 920 L 815 920 L 790 565 C 875 525 875 410 875 410 C 875 410 715 285 715 285 L 500 80 Z M 350 860 L 350 610 Q 350 550 500 550 Q 650 550 650 610 L 650 860 Z"
    />
  </svg>
);

// ==========================================
// 3D GLOSSY CALENDAR ICON (Converted from SVG)
// ==========================================
const GlossyCalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" className={className}>
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.32" r="0.78">
        <stop offset="0%" stopColor="#C084F5"/>
        <stop offset="48%" stopColor="#9D4EDD"/>
        <stop offset="100%" stopColor="#6B21A8"/>
      </radialGradient>
      <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="12%" stopColor="#F7F7F8"/>
        <stop offset="100%" stopColor="#D5D7DD"/>
      </linearGradient>
      <linearGradient id="headHi" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45"/>
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
      </linearGradient>
      <filter id="inner" x="-10%" y="-10%" width="120%" height="120%">
        <feOffset dy="18" in="SourceAlpha" result="o"/>
        <feGaussianBlur in="o" stdDeviation="26" result="b"/>
        <feFlood floodColor="#000" floodOpacity="0.28" result="c"/>
        <feComposite in="c" in2="b" operator="in" result="s"/>
        <feComposite in="SourceGraphic" in2="s" operator="over"/>
      </filter>
      <filter id="shadow" x="-40%" y="-20%" width="180%" height="180%">
        <feDropShadow dx="0" dy="36" stdDeviation="32" floodColor="#210645" floodOpacity="0.3"/>
      </filter>
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="b"/>
        <feFlood floodColor="#FFFFFF" floodOpacity="0.9" result="f"/>
        <feComposite in="f" in2="b" operator="in" result="g"/>
        <feMerge>
          <feMergeNode in="g"/>
          <feMergeNode in="g"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <clipPath id="clip">
        <rect x="-230" y="-272" width="460" height="540" rx="34"/>
      </clipPath>
    </defs>

    <rect x="0" y="0" width="1024" height="1024" rx="228" fill="url(#bg)" filter="url(#inner)"/>
    <ellipse cx="512" cy="190" rx="560" ry="310" fill="#FFFFFF" opacity="0.06"/>

    <g filter="url(#glow)" opacity="0.98">
      <g transform="translate(260 350)">
        <path d="M0-72c5.5 28 26 48.5 72 54 -46 5.5 -66.5 26 -72 54 -5.5-28 -26-48.5-72-54 46-5.5 66.5-26 72-54z" fill="#FFFFFF"/>
      </g>
      <g transform="translate(188 232) scale(0.56)">
        <path d="M0-72c5.5 28 26 48.5 72 54 -46 5.5 -66.5 26 -72 54 -5.5-28 -26-48.5-72-54 46-5.5 66.5-26 72-54z" fill="#FFFFFF"/>
      </g>
    </g>

    <g transform="translate(588 552) rotate(-9)" filter="url(#shadow)">
      <rect x="-220" y="-256" width="460" height="540" rx="36" fill="#C5C8D1" transform="translate(10 16)"/>
      <rect x="-230" y="-272" width="460" height="540" rx="34" fill="#FFFFFF"/>
      <g clipPath="url(#clip)">
        <rect x="-230" y="-272" width="460" height="122" fill="#4FC3F7"/>
        <rect x="-230" y="-272" width="460" height="122" fill="url(#headHi)"/>
      </g>
      <rect x="206" y="-248" width="18" height="496" rx="9" fill="#000000" opacity="0.04"/>
      <rect x="-228" y="250" width="456" height="18" rx="9" fill="#E9EBEF" opacity="0.9"/>
      
      <path d="M-88 18 L-16 90 L108 -56" fill="none" stroke="#00A6ED" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M-88 18 L-16 90 L108 -56" fill="none" stroke="#FFFFFF" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round" opacity="0.07" transform="translate(0 -4)"/>

      <g transform="translate(-98 -262)">
        <ellipse cx="0" cy="30" rx="27" ry="9.5" fill="#000" opacity="0.12"/>
        <rect x="-26" y="-38" width="52" height="68" rx="26" fill="url(#ring)"/>
        <ellipse cx="0" cy="-32" rx="17.5" ry="6" fill="#FFFFFF"/>
        <ellipse cx="0" cy="-24" rx="14" ry="3.5" fill="#000" opacity="0.06"/>
        <rect x="-26" y="12" width="52" height="22" fill="#FFFFFF"/>
      </g>
      <g transform="translate(98 -262)">
        <ellipse cx="0" cy="30" rx="27" ry="9.5" fill="#000" opacity="0.12"/>
        <rect x="-26" y="-38" width="52" height="68" rx="26" fill="url(#ring)"/>
        <ellipse cx="0" cy="-32" rx="17.5" ry="6" fill="#FFFFFF"/>
        <ellipse cx="0" cy="-24" rx="14" ry="3.5" fill="#000" opacity="0.06"/>
        <rect x="-26" y="12" width="52" height="22" fill="#FFFFFF"/>
      </g>
    </g>
  </svg>
);


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
  const { data: config, isLoading } = useDoc(configRef);
  const { isHydrated } = useFirebase();

  if (!isHydrated || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader className="h-8 w-8 animate-spin text-slate-200" />
      </div>
    );
  }

  const theme = config?.appTheme || 'CLASSIC';

  if (theme === 'GLOSSY') {
    return <RoomsExplorerGlossy />;
  }

  return <RoomsExplorerClassic />;
}

/**
 * THE CLASSIC ROOMS EXPLORER (Refined: Clean, Clear, High-Graphic UI)
 */
function RoomsExplorerClassic() {
  const firestore = useFirestore();

 const { user } = useUser();
 const { userProfile: userDoc } = useUserProfile(user?.uid);
 const router = useRouter();
 const { t } = useTranslation();
 const pathname = usePathname();
 const { isHydrated } = useFirebase();
 const [activeCategory, setActiveCategory] = useState("All");
 const [headerTab, setHeaderTab] = useState<'recommend' | 'me'>('recommend');
 const [meTab, setMeTab] = useState<'following' | 'recent'>('following');

 // Naya State: Daily Rewards Modal Open/Close Manage karne ke liye
 const [showRewardsModal, setShowRewardsModal] = useState(false);

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
   { id: "Game", label: t.home.categories.game },
   { id: "Music", label: t.home.categories.music },
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
   
   // Pre-sort by participant count and pin status once
   const sorted = [...roomsData].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.participantCount || 0) - (a.participantCount || 0);
   });

   return sorted.filter(room => {
    const cat = room.category || 'Chat';
    const matchesCategory = activeCategory === "All" || cat === activeCategory;
    const hasUsers = (room.participantCount || 0) > 0;
    const isPinned = room.isPinned === true;
    const isDecommissioned = room.id === 'ummy-help-center' || (room.name && room.name.toUpperCase().includes('SYNCHRONIZING'));
    return matchesCategory && (hasUsers || isPinned) && !isDecommissioned;
   });
  }, [roomsData, activeCategory, isHydrated]);


  // STABILITY GUARD: Combine all signals for final flip.
  const showSummary = isReady && isHydrated && !isRoomsLoading && roomsData;
  return (
    <div className="h-[100dvh] flex flex-col font-sans antialiased animate-in fade-in duration-700 text-slate-900 overflow-hidden bg-white relative">
      <ThemeColorMeta color="#8b5cf6" />
      
      {/* TOP 5Vh HALKA PURPLE */}
      <div className="absolute top-0 left-0 right-0 flex flex-col z-0 pointer-events-none">
        <div className="h-[3qvh] bg-purple-400" />
        <div className="h-[25vh] bg-gradient-to-b from-purple-400 via-purple-300/40 to-transparent" />
      </div>

      {/* TOP HEADER (FIXED - WON'T SCROLL) */}
      <header className="flex items-center justify-between px-4 pt-safe shrink-0 relative z-50 bg-transparent pb-4">
        <div className="flex items-center justify-between w-full">
           <div className="flex items-center gap-3">
              {/* Recommend Tab - Active Black text, inactive gray-500 */}
              <button 
                onClick={() => setHeaderTab('recommend')} 
                className={cn(
                  "text-xl font-bold tracking-tight transition-all duration-200", 
                  headerTab === 'recommend' 
                    ? "text-black drop-shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Recommend
              </button>
              {/* Me Tab - Active Black text, inactive gray-500 */}
              <button 
                onClick={() => setHeaderTab('me')} 
                className={cn(
                  "text-xl font-bold tracking-tight transition-all duration-200", 
                  headerTab === 'me' 
                    ? "text-black drop-shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Me
              </button>
           </div>
           <div className="flex items-center gap-2 text-slate-800">
              <UserSearchDialog />
               {myRoom ? (
                 <button 
                   onClick={() => router.push(`/rooms/${myRoom.id}`)} 
                   className="active:scale-90 transition-all flex items-center"
                 >
                   <CustomHomeIcon className="h-[22px] w-[22px] text-slate-800" />
                 </button>
               ) : (
                 <CreateRoomDialog 
                   iconOnly 
                   trigger={
                     <button className="p-1 px-1.5 bg-slate-800 rounded-full shadow-md active:scale-90 transition-all flex items-center">
                       <Plus className="h-4 w-4 text-white" />
                     </button>
                   } 
                 />
               )}
           </div>
        </div>
      </header>

      {/* MAIN SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto relative z-10 no-scrollbar pb-32">
        {headerTab === 'recommend' ? (
          <>
            {/* Banner (Will Scroll) */}
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
                            "h-[110px] w-full rounded-[1.8rem] bg-gradient-to-br p-3 flex flex-col justify-center relative overflow-hidden shadow-lg border border-white/20 active:scale-[0.98] transition-all duration-300 group", 
                            slide.link ? "cursor-pointer" : "",
                            slide.color || 'from-violet-500 to-indigo-500'
                          )}
                        >
                          {slide.imageUrl && (
                            <Image 
                              src={slide.imageUrl} 
                              alt="" 
                              fill 
                              className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
                              unoptimized 
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {!slide.imageUrl && (
                            <div className="relative z-10 px-2">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-white/20 backdrop-blur-sm p-1 rounded-xl border border-white/30">
                                  <Icon className="h-5 w-5 text-white drop-shadow-md" />
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{slide.title}</h3>
                              </div>
                              <p className="text-[11px] font-black text-white drop-shadow-md uppercase tracking-[0.3em] leading-none ml-1">{slide.subtitle || slide.sub}</p>
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Ranking Cards (Will Scroll) */}
            <div className="px-2 mb-1.5">
              <div className="flex gap-1.5">
                 <RankingCard />
                 <FamilyCard />
                 <CpCard />
              </div>
            </div>

            {/* STICKY CATEGORY BAR - Scroll karne par Top Header ke theek niche atak jayega */}
            <div className="px-3 sticky top-0 z-40 bg-white/95 backdrop-blur-md py-2 mb-1 border-b border-slate-100/80 flex items-center">
              <div className="w-full overflow-x-auto no-scrollbar">
                <div className="flex gap-2 px-0.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap shadow-sm",
                        activeCategory === cat.id 
                          ? "bg-slate-800 text-white shadow-md ring-1 ring-white/30" 
                          : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/80"
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
                     <div className="flex items-center justify-between bg-white rounded-[2rem] p-4 shadow-xl border border-slate-100/80 relative overflow-hidden group backdrop-blur-sm">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-100/40 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700" />
                       
                       <div className="flex items-center gap-4 relative z-10 w-full">
                         <div className="relative shrink-0">
                           <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-lg ring-1 ring-slate-200">
                             <AvatarImage src={userDoc?.avatarUrl} className="object-cover" />
                             <AvatarFallback className="bg-slate-800 text-white font-black text-xl">U</AvatarFallback>
                           </Avatar>
                           <div className="absolute -bottom-1 -right-1">
                             <VipBadge level={userDoc?.level?.rich || 1} />
                           </div>
                         </div>
                         
                         <div className="flex flex-col flex-1 min-w-0 pr-2">
                           <h2 className="text-lg font-bold text-slate-800 truncate">{userDoc?.username || 'Member'}</h2>
                           <div className="flex items-center gap-1">
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ID: {userDoc?.accountNumber || '---'}</span>
                           </div>
                           <div className="flex items-center gap-1.5 mt-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 w-fit">
                             <GoldCoinIcon className="h-2.5 w-2.5 text-amber-500" />
                             <span className="text-[10px] font-black text-slate-700">{(userDoc?.wallet?.coins || 0).toLocaleString()}</span>
                           </div>
                         </div>

                           {myRoom ? (
                             <button 
                               onClick={() => router.push(`/rooms/${myRoom.id}`)}
                               className="shrink-0 bg-slate-800 text-white rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all duration-200 hover:bg-slate-900"
                             >
                               My Room
                             </button>
                           ) : (
                             <CreateRoomDialog 
                               trigger={
                                 <button className="shrink-0 bg-slate-800 text-white rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all duration-200 hover:bg-slate-900">
                                   Create Room
                                 </button>
                               } 
                             />
                           )}
                       </div>
                     </div>
                   </section>

                   <div className="flex gap-6 mb-6 px-1 border-b border-slate-200/50">
                     <button 
                       onClick={() => setMeTab('following')} 
                       className={cn(
                         "pb-3 text-xs font-bold uppercase tracking-[0.2em] relative transition-all duration-200",
                         meTab === 'following' ? "text-slate-800" : "text-slate-300"
                       )}
                     >
                       Following
                       {meTab === 'following' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full animate-in fade-in slide-in-from-bottom-1" />}
                     </button>
                     <button 
                       onClick={() => setMeTab('recent')} 
                       className={cn(
                         "pb-3 text-xs font-bold uppercase tracking-[0.2em] relative transition-all duration-200",
                         meTab === 'recent' ? "text-slate-800" : "text-slate-300"
                       )}
                     >
                       Recent
                       {meTab === 'recent' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full animate-in fade-in slide-in-from-bottom-1" />}
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
                             <div key={roomRef.id} onClick={() => router.push(`/rooms/${roomRef.id}`)} className="group active:scale-95 transition-all duration-200 cursor-pointer">
                               <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-md border border-slate-100/80 mb-2">
                                  <Image 
                                   src={roomRef.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                   alt={roomRef.title}
                                   fill
                                   className="object-cover group-hover:scale-105 transition-transform duration-500"
                                   unoptimized
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  <div className="absolute bottom-3 left-3 right-3 text-white">
                                     <h4 className="text-[11px] font-black uppercase truncate tracking-tight drop-shadow-sm">{roomRef.title}</h4>
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
                             <div key={visit.id} onClick={() => router.push(`/rooms/${visit.id}`)} className="group active:scale-95 transition-all duration-200 cursor-pointer">
                               <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-md border border-slate-100/80 mb-2">
                                  <Image 
                                   src={visit.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                   alt={visit.title}
                                   fill
                                   className="object-cover group-hover:scale-105 transition-transform duration-500"
                                   unoptimized
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20">
                                     <span className="text-[8px] font-black text-white uppercase">Recent</span>
                                  </div>
                                  <div className="absolute bottom-3 left-3 right-3 text-white">
                                     <h4 className="text-[11px] font-black uppercase truncate tracking-tight drop-shadow-sm">{visit.title}</h4>
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

      {/* GLOSSY CALENDAR BUTTON (Slightly Lighter bg-purple-400) */}
      {isHydrated && (
        <div className="fixed bottom-[5.5rem] right-4 z-[90] animate-in fade-in zoom-in duration-500">
          <button 
            onClick={() => setShowRewardsModal(true)}
            className="relative bg-purple-400 hover:bg-purple-500 p-0 rounded-[1.2rem] shadow-lg border border-purple-300/50 active:scale-95 transition-all duration-200 group flex items-center justify-center overflow-hidden"
          >
            <GlossyCalendarIcon className="h-14 w-14 text-white group-hover:scale-105 transition-transform z-10 relative" />
          </button>
        </div>
      )}

      {/* DAILY REWARDS MODAL OVERLAY */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-5 animate-in fade-in duration-200 gap-6">
          
          <div className="w-full max-w-sm h-[60vh] bg-white rounded-3xl border-4 border-purple-200 shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">

             <div className="bg-purple-500 pt-5 pb-3 px-4 relative flex-shrink-0">
               <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
               <h2 className="text-[1.3rem] font-black text-white text-center drop-shadow-md relative z-10 tracking-wide">
                 Daily Rewards
               </h2>
             </div>

             <div className="bg-purple-100 py-2.5 px-4 text-center border-b border-purple-200 flex-shrink-0">
               <p className="text-purple-800 font-bold text-[11px] uppercase tracking-wider">
                 Sign in for 7 days for rich Rewards
               </p>
             </div>

             <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 justify-center">
               
               <div className="grid grid-cols-4 gap-2">
                 {[
                   { day: 1, amount: 5000 },
                   { day: 2, amount: 10000 },
                   { day: 3, amount: 10000 },
                   { day: 4, amount: 10000 }
                 ].map((item) => (
                   <div key={item.day} className="bg-slate-50 border border-slate-200 rounded-xl relative pt-6 pb-2 px-1 flex flex-col items-center justify-center overflow-hidden shadow-sm">
                     <div className="absolute top-0 left-0 bg-purple-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-br-lg">
                       {item.day}
                     </div>
                     
                     <CircleDollarSign className="h-7 w-7 text-amber-500 mb-1.5 drop-shadow-sm" fill="#fef08a" strokeWidth={1.5} />
                     
                     <div className="flex items-center gap-0.5 mt-auto bg-white px-1 py-0.5 rounded-full border border-slate-100">
                       <GoldCoinIcon className="h-2 w-2" />
                       <span className="text-[9px] font-bold text-slate-700 leading-none">{item.amount}</span>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-2 gap-3">
                 {[
                   { day: 5, amount: 10000 },
                   { day: 6, amount: 10000 }
                 ].map((item) => (
                   <div key={item.day} className="bg-slate-50 border border-slate-200 rounded-2xl relative pt-7 pb-3 px-2 flex flex-col items-center justify-center overflow-hidden shadow-sm">
                     <div className="absolute top-0 left-0 bg-purple-400 text-white text-xs font-black px-2.5 py-0.5 rounded-br-xl">
                       {item.day}
                     </div>
                     <CircleDollarSign className="h-10 w-10 text-amber-500 mb-2 drop-shadow-md" fill="#fef08a" strokeWidth={1.5} />
                     <div className="flex items-center gap-1 mt-auto bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm">
                       <GoldCoinIcon className="h-3 w-3" />
                       <span className="text-[11px] font-bold text-slate-700 leading-none">{item.amount}</span>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] relative pt-8 pb-4 px-3 flex flex-col items-center justify-center overflow-hidden shadow-sm mt-1">
                  <div className="absolute top-0 left-0 bg-purple-400 text-white text-[11px] font-black px-3 py-1 rounded-br-2xl flex items-center gap-1 shadow-sm uppercase tracking-wide">
                    <span className="text-yellow-300 text-sm">7</span> Big Rewards
                  </div>
                  <CircleDollarSign className="h-14 w-14 text-amber-500 mb-2 drop-shadow-lg" fill="#fef08a" strokeWidth={1.5} />
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                    <GoldCoinIcon className="h-4 w-4" />
                    <span className="text-sm font-bold text-slate-700 leading-none">10000</span>
                  </div>
               </div>

             </div>

             <div className="p-4 pt-2 bg-white flex-shrink-0 z-10 border-t border-slate-100">
               <button className="w-full bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white rounded-2xl py-3.5 font-black text-[15px] shadow-[0_4px_15px_rgba(168,85,247,0.3)] active:scale-95 transition-all duration-200 uppercase tracking-widest">
                 Sign in Today
               </button>
             </div>
          </div>

          <button 
             onClick={() => setShowRewardsModal(false)} 
             className="bg-white/20 hover:bg-white/30 border border-white/50 backdrop-blur-md transition-colors text-white rounded-full p-3.5 shadow-xl hover:scale-105 active:scale-95 z-50 animate-in slide-in-from-bottom-5 duration-300"
          >
             <X className="h-6 w-6 drop-shadow-md" />
          </button>

        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      {isHydrated && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-8px_30px_rgba(0,0,0,0.02)]"
        >
          <div className="flex items-center justify-around h-16 pb-safe transition-all">
            <Link href="/rooms" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname === '/rooms' ? "text-violet-600" : "text-slate-400 hover:text-slate-600")}>
               {pathname === '/rooms' && <div className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm" />}
               <CustomHomeIcon className={cn("h-6 w-6 transition-transform group-hover:scale-105", pathname === '/rooms' ? "fill-current" : "")} />
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.home || 'Home'}</span>
            </Link>

            <Link href="/discover" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname === '/discover' ? "text-violet-600" : "text-slate-400 hover:text-slate-600")}>
               {pathname === '/discover' && <div className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm" />}
               <Compass className={cn("h-6 w-6 transition-transform group-hover:scale-105", pathname === '/discover' ? "fill-current" : "")} />
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.discover || 'Discover'}</span>
            </Link>

            <Link href="/messages" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname === '/messages' ? "text-violet-600" : "text-slate-400 hover:text-slate-600")}>
               {pathname === '/messages' && <div className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm" />}
               <div className="relative">
                 <Mail className={cn("h-6 w-6 transition-transform group-hover:scale-105", pathname === '/messages' ? "fill-current" : "")} />
                 <UnreadBadge size="sm" className="absolute -top-2 -right-2 border-2 border-white" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.message || 'Message'}</span>
            </Link>

            <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname?.startsWith('/profile') ? "text-violet-600" : "text-slate-400 hover:text-slate-600")}>
               {pathname?.startsWith('/profile') && <div className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm" />}
               <User className={cn("h-6 w-6 transition-transform group-hover:scale-105", pathname?.startsWith('/profile') ? "fill-current" : "")} />
               <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.me || 'Me'}</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}

