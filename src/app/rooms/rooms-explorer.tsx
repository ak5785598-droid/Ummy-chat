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
  X,
  Users,
  Music,
  Gamepad2,
  PartyPopper,
  MessageCircle
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
// ENHANCED CUSTOM HOME ICON (Premium Look)
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
// 3D GLOSSY CALENDAR ICON (High Graphic)
// ==========================================
const GlossyCalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" className={className}>
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.32" r="0.78">
        <stop offset="0%" stopColor="#B06EF5"/>
        <stop offset="48%" stopColor="#8A2BE2"/>
        <stop offset="100%" stopColor="#5D149E"/>
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

// Skeleton (Shimmer effect removed)
const RoomSkeleton = () => (
  <div className="flex flex-col gap-3 min-w-[280px] snap-center">
    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-r from-slate-100 via-slate-200/50 to-slate-100 animate-pulse">
    </div>
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
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Enhanced category icons mapping
  const getCategoryIcon = (categoryId: string) => {
    switch(categoryId) {
      case 'Chat': return <MessageCircle className="h-2.5 w-2.5" />;
      case 'Game': return <Gamepad2 className="h-2.5 w-2.5" />;
      case 'Music': return <Music className="h-2.5 w-2.5" />;
      case 'Party': return <PartyPopper className="h-2.5 w-2.5" />;
      default: return null;
    }
  };

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

  useQuestInitializer();

  const CATEGORIES = [
    { id: "All", label: t.home.categories.all },
    { id: "Chat", label: t.home.categories.chat, icon: <MessageCircle className="h-2.5 w-2.5" /> },
    { id: "Game", label: t.home.categories.game, icon: <Gamepad2 className="h-2.5 w-2.5" /> },
    { id: "Music", label: t.home.categories.music, icon: <Music className="h-2.5 w-2.5" /> },
    { id: "Party", label: t.home.categories.party, icon: <PartyPopper className="h-2.5 w-2.5" /> }
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

  const showSummary = isReady && isHydrated && !isRoomsLoading && roomsData;

  return (
    <div className="h-[100dvh] flex flex-col font-sans antialiased animate-in fade-in duration-700 text-slate-900 overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white relative">
      <ThemeColorMeta color="#8b5cf6" />
      
      {/* TOP PURPLE GRADIENT - PRESERVED */}
      <div className="absolute top-0 left-0 right-0 h-[10vh] bg-purple-500 z-0 pointer-events-none" />
      <div className="absolute top-[10vh] left-0 right-0 h-[25vh] bg-gradient-to-b from-purple-500 to-transparent z-0 pointer-events-none" />

      {/* Header with improved glass effect */}
      <header className="flex items-center justify-between px-5 pt-safe shrink-0 relative z-50 bg-transparent pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setHeaderTab('recommend')} 
              className={cn(
                "text-2xl font-black tracking-tight transition-all duration-300 relative pb-1",
                headerTab === 'recommend' 
                  ? "text-black" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Recommend
              {headerTab === 'recommend' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full animate-in slide-in-from-left-2" />
              )}
            </button>
            <button 
              onClick={() => setHeaderTab('me')} 
              className={cn(
                "text-2xl font-black tracking-tight transition-all duration-300 relative pb-1",
                headerTab === 'me' 
                  ? "text-black" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Me
              {headerTab === 'me' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full animate-in slide-in-from-left-2" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-3 text-slate-800">
            <UserSearchDialog />
            {myRoom ? (
              <button 
                onClick={() => router.push(`/rooms/${myRoom.id}`)} 
                className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/60 active:scale-95 transition-all hover:shadow-xl"
              >
                <CustomHomeIcon className="h-4 w-4 text-slate-700" />
              </button>
            ) : (
              <CreateRoomDialog 
                iconOnly 
                trigger={
                  <button className="p-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg active:scale-95 transition-all hover:shadow-xl">
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                } 
              />
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto relative z-10 no-scrollbar pb-32">
        {headerTab === 'recommend' ? (
          <>
            {/* Enhanced Banner Carousel */}
            <div className="px-4 mb-3">
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
                            "h-[130px] w-full rounded-3xl bg-gradient-to-br p-4 flex flex-col justify-center relative overflow-hidden shadow-xl border border-white/30 active:scale-[0.98] transition-all duration-300 group cursor-pointer",
                            slide.color || 'from-violet-500 to-indigo-500'
                          )}
                        >
                          {slide.imageUrl && (
                            <Image 
                              src={slide.imageUrl} 
                              alt="" 
                              fill 
                              className="object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" 
                              unoptimized 
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          {!slide.imageUrl && (
                            <div className="relative z-10 px-3">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/25 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-lg">
                                  <Icon className="h-6 w-6 text-white drop-shadow-md" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight text-white drop-shadow-lg">{slide.title}</h3>
                              </div>
                              <p className="text-xs font-black text-white/90 drop-shadow-md uppercase tracking-[0.2em] ml-1">{slide.subtitle || slide.sub}</p>
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Premium Feature Cards */}
            <div className="px-4 mb-3">
              <div className="flex gap-2.5">
                <RankingCard />
                <FamilyCard />
                <CpCard />
              </div>
            </div>

            {/* Enhanced Category Bar */}
            <div className="px-4 sticky top-0 z-40 bg-white/95 backdrop-blur-md py-3 mb-2 border-b border-slate-100">
              <div className="w-full overflow-x-auto no-scrollbar">
                <div className="flex gap-2.5 px-0.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap shadow-sm flex items-center gap-1.5",
                        activeCategory === cat.id 
                          ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md ring-2 ring-purple-400/30 scale-105" 
                          : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 hover:shadow-md"
                      )}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rooms Grid with enhanced cards */}
            <main className="px-4 flex-1 pb-6">
              <div className="grid grid-cols-2 gap-3 pb-8">
                {!showSummary ? (
                  Array.from({ length: 6 }).map((_, i) => <RoomSkeleton key={i} />)
                ) : displayRooms.length > 0 ? (
                  displayRooms.map((room: any) => (
                    <div key={room.id} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <ChatRoomCard key={room.id} room={room} variant="modern" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-16 text-center space-y-4 opacity-50">
                    <Ghost className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="font-black uppercase text-[10px] tracking-wider">{t.home.noActive}</p>
                  </div>
                )}
              </div>
            </main>
          </>
        ) : (
          <div className="px-5 flex-1 animate-in slide-in-from-right-4 duration-500 pb-28">
            <div className={cn("transition-opacity duration-300", !isReady ? "opacity-0" : "opacity-100")}>
              {!isReady || !userDoc ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader className="h-10 w-10 animate-spin text-slate-300 mx-auto" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Synchronizing Identity...</p>
                </div>
              ) : (
                <>
                  {/* Premium User Card */}
                  <section className="mb-8 mt-2">
                    <div className="relative bg-gradient-to-br from-white via-white to-purple-50/30 rounded-3xl p-5 shadow-2xl border border-slate-100/80 overflow-hidden group backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5" />
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-bl from-purple-200/40 to-transparent rounded-full blur-2xl" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-purple-600 blur-md opacity-60" />
                          <Avatar className="h-20 w-20 rounded-2xl border-3 border-white shadow-xl relative">
                            <AvatarImage src={userDoc?.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white font-black text-2xl">
                              {userDoc?.username?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1">
                            <VipBadge level={userDoc?.level?.rich || 1} />
                          </div>
                        </div>
                        
                        <div className="flex flex-col flex-1 min-w-0">
                          <h2 className="text-xl font-black text-slate-800 truncate">{userDoc?.username || 'Member'}</h2>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: {userDoc?.accountNumber || '---'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 bg-gradient-to-r from-amber-50 to-amber-100/50 px-3 py-1 rounded-full border border-amber-200 w-fit shadow-sm">
                            <GoldCoinIcon className="h-3 w-3 text-amber-500" />
                            <span className="text-sm font-black text-slate-700">{(userDoc?.wallet?.coins || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        {myRoom ? (
                          <button 
                            onClick={() => router.push(`/rooms/${myRoom.id}`)}
                            className="shrink-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl px-5 py-2.5 text-[11px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all duration-200 hover:shadow-xl hover:from-slate-900 hover:to-slate-950"
                          >
                            My Room
                          </button>
                        ) : (
                          <CreateRoomDialog 
                            trigger={
                              <button className="shrink-0 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-2xl px-5 py-2.5 text-[11px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all duration-200 hover:shadow-xl">
                                Create Room
                              </button>
                            } 
                          />
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Enhanced Tabs */}
                  <div className="flex gap-8 mb-6 px-1 border-b border-slate-200/60">
                    <button 
                      onClick={() => setMeTab('following')} 
                      className={cn(
                        "pb-3 text-sm font-black uppercase tracking-[0.15em] relative transition-all duration-300",
                        meTab === 'following' ? "text-slate-800" : "text-slate-300 hover:text-slate-400"
                      )}
                    >
                      Following
                      {meTab === 'following' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full animate-in fade-in slide-in-from-bottom-1" />
                      )}
                    </button>
                    <button 
                      onClick={() => setMeTab('recent')} 
                      className={cn(
                        "pb-3 text-sm font-black uppercase tracking-[0.15em] relative transition-all duration-300",
                        meTab === 'recent' ? "text-slate-800" : "text-slate-300 hover:text-slate-400"
                      )}
                    >
                      Recent
                      {meTab === 'recent' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full animate-in fade-in slide-in-from-bottom-1" />
                      )}
                    </button>
                  </div>

                  {/* Enhanced Following/Recent Grids */}
                  {meTab === 'following' && (
                    <section className="animate-in fade-in slide-in-from-left-4 duration-300">
                      {isFollowedLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
                          ))}
                        </div>
                      ) : followedRoomsData && followedRoomsData.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {followedRoomsData.map((roomRef: any) => (
                            <div key={roomRef.id} onClick={() => router.push(`/rooms/${roomRef.id}`)} className="group active:scale-95 transition-all duration-200 cursor-pointer">
                              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl border border-slate-100/80 mb-2">
                                <Image 
                                  src={roomRef.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                  alt={roomRef.title}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                  <h4 className="text-sm font-black uppercase truncate drop-shadow-lg">{roomRef.title}</h4>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Users className="h-2.5 w-2.5 text-white/80" />
                                    <span className="text-[9px] font-bold text-white/80">{roomRef.participantCount || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-16 text-center text-[11px] font-black uppercase tracking-widest text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
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
                            <div key={i} className="aspect-square rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
                          ))}
                        </div>
                      ) : filteredRecentRooms.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {filteredRecentRooms.map((visit: any) => (
                            <div key={visit.id} onClick={() => router.push(`/rooms/${visit.id}`)} className="group active:scale-95 transition-all duration-200 cursor-pointer">
                              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl border border-slate-100/80 mb-2">
                                <Image 
                                  src={visit.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&h=400&auto=format&fit=crop'} 
                                  alt={visit.title}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
                                  <span className="text-[9px] font-black text-white uppercase">24h</span>
                                </div>
                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                  <h4 className="text-sm font-black uppercase truncate drop-shadow-lg">{visit.title}</h4>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Users className="h-2.5 w-2.5 text-white/80" />
                                    <span className="text-[9px] font-bold text-white/80">{visit.participantCount || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-16 text-center text-[11px] font-black uppercase tracking-widest text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
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

      {/* Enhanced Glossy Calendar Button */}
      {isHydrated && (
        <div className="fixed bottom-[6rem] right-5 z-[90] animate-in fade-in zoom-in duration-500 group">
          <button 
            onClick={() => setShowRewardsModal(true)}
            className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-0 rounded-2xl shadow-2xl border border-purple-400/50 active:scale-95 transition-all duration-200 hover:shadow-3xl hover:scale-105 flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
            <GlossyCalendarIcon className="h-14 w-14 text-white relative z-10 drop-shadow-lg" />
          </button>
        </div>
      )}

      {/* Enhanced Daily Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-5 animate-in fade-in duration-200 gap-6">
          <div className="w-full max-w-sm h-[60vh] bg-gradient-to-b from-white to-slate-50 rounded-3xl border-4 border-purple-200 shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-5 pb-3 px-4 relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              <h2 className="text-2xl font-black text-white text-center drop-shadow-md relative z-10 tracking-wide">
                Daily Rewards
              </h2>
            </div>

            <div className="bg-purple-100/50 py-2.5 px-4 text-center border-b border-purple-200 flex-shrink-0">
              <p className="text-purple-800 font-bold text-xs uppercase tracking-wider">
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
                  <div key={item.day} className="bg-white border border-slate-200 rounded-xl relative pt-6 pb-2 px-1 flex flex-col items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-all">
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-br-lg">
                      {item.day}
                    </div>
                    <CircleDollarSign className="h-7 w-7 text-amber-500 mb-1.5 drop-shadow-sm" fill="#fef08a" strokeWidth={1.5} />
                    <div className="flex items-center gap-0.5 mt-auto bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                      <GoldCoinIcon className="h-2 w-2 text-amber-500" />
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
                  <div key={item.day} className="bg-white border border-slate-200 rounded-2xl relative pt-7 pb-3 px-2 flex flex-col items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-all">
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-black px-2.5 py-0.5 rounded-br-xl">
                      {item.day}
                    </div>
                    <CircleDollarSign className="h-10 w-10 text-amber-500 mb-2 drop-shadow-md" fill="#fef08a" strokeWidth={1.5} />
                    <div className="flex items-center gap-1 mt-auto bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                      <GoldCoinIcon className="h-3 w-3 text-amber-500" />
                      <span className="text-[11px] font-bold text-slate-700 leading-none">{item.amount}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl relative pt-8 pb-4 px-3 flex flex-col items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-all mt-1">
                <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[11px] font-black px-3 py-1 rounded-br-2xl flex items-center gap-1 shadow-sm uppercase tracking-wide">
                  <span className="text-yellow-300 text-sm">7</span> Big Rewards
                </div>
                <CircleDollarSign className="h-14 w-14 text-amber-500 mb-2 drop-shadow-lg" fill="#fef08a" strokeWidth={1.5} />
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  <GoldCoinIcon className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-slate-700 leading-none">10000</span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-2 bg-white flex-shrink-0 z-10 border-t border-slate-100">
              <button className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white rounded-2xl py-3.5 font-black text-sm shadow-xl active:scale-95 transition-all duration-200 uppercase tracking-widest">
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

      {/* Enhanced Bottom Navigation - Premium Glassmorphic */}
      {isHydrated && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/90 backdrop-blur-xl border-t border-white/40 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center justify-around h-16 pb-safe transition-all">
            <Link href="/rooms" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname === '/rooms' ? "text-purple-600" : "text-slate-400 hover:text-slate-600")}>
              {pathname === '/rooms' && <div className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 shadow-sm" />}
              <CustomHomeIcon className={cn("h-6 w-6 transition-transform group-hover:scale-110", pathname === '/rooms' ? "fill-current" : "")} />
              <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.home || 'Home'}</span>
            </Link>

            <Link href="/discover" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname === '/discover' ? "text-purple-600" : "text-slate-400 hover:text-slate-600")}>
              {pathname === '/discover' && <div className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 shadow-sm" />}
              <Compass className={cn("h-6 w-6 transition-transform group-hover:scale-110", pathname === '/discover' ? "fill-current" : "")} />
              <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.discover || 'Discover'}</span>
            </Link>

            <Link href="/messages" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname === '/messages' ? "text-purple-600" : "text-slate-400 hover:text-slate-600")}>
              {pathname === '/messages' && <div className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 shadow-sm" />}
              <div className="relative">
                <Mail className={cn("h-6 w-6 transition-transform group-hover:scale-110", pathname === '/messages' ? "fill-current" : "")} />
                <UnreadBadge size="sm" className="absolute -top-2 -right-2 border-2 border-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.message || 'Message'}</span>
            </Link>

            <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-95 relative group", pathname?.startsWith('/profile') ? "text-purple-600" : "text-slate-400 hover:text-slate-600")}>
              {pathname?.startsWith('/profile') && <div className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 shadow-sm" />}
              <User className={cn("h-6 w-6 transition-transform group-hover:scale-110", pathname?.startsWith('/profile') ? "fill-current" : "")} />
              <span className="text-[9px] font-black uppercase tracking-tight">{t?.nav?.me || 'Me'}</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
