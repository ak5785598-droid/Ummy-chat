'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Ghost, Star, Sparkles, Trophy, Zap, Heart, Plus, Crown, Home, Gamepad2, Users, Loader, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, doc, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
 Carousel,
 CarouselContent,
 CarouselItem,
} from "@/components/ui/carousel";
import { UmmyLogoIcon, GoldCoinIcon } from '@/components/icons';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { RankingCard, FamilyCard, CpCard } from '@/components/premium-feature-cards';
import { VipBadge } from '@/components/vip-badge';
import { Shield, ShieldCheck } from 'lucide-react';

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
 * Re-engineered to support Sovereign Room Info Sync.
 */
export default function RoomsPage() {
 const { user } = useUser();
 const firestore = useFirestore();
 const router = useRouter();
 const { t } = useTranslation();
 const [activeCategory, setActiveCategory] = useState("All");
 const [headerTab, setHeaderTab] = useState<'recommend' | 'me'>('recommend');

 const userRef = useMemoFirebase(() => !firestore || !user ? null : doc(firestore, 'users', user.uid), [firestore, user]);
 const { data: userProfile } = useDoc(userRef);

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

 // SOVEREIGN SYNC: Query by ownerId to find the user's room instead of doc ID
 const myRoomQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid), limit(1));
 }, [firestore, user]);
 const { data: myRoomsData } = useCollection(myRoomQuery);
 const myRoom = myRoomsData?.[0];

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

 const displayRooms = useMemo(() => {
  if (!roomsData) return [];
  
  let filtered = roomsData.filter(room => {
   const cat = room.category || 'Chat';
   const matchesCategory = activeCategory === "All" || cat === activeCategory;
   
   const hasUsers = (room.participantCount || 0) > 0;
   const isPinned = room.isPinned === true;

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
   <Skeleton className="aspect-square w-full rounded-2xl" />
   <div className="space-y-1.5 px-1">
    <Skeleton className="h-3.5 w-3/4 rounded-md" />
    <Skeleton className="h-2.5 w-1/2 rounded-md" />
   </div>
  </div>
 );

 return (
  <AppLayout>
   <div className="min-h-full flex flex-col font-sans animate-in fade-in duration-700">
    
    <header className="flex items-center justify-between px-3 pt-safe pb-0 shrink-0">
      <div className="pt-0.5 flex items-center justify-between w-full">
         <div className="flex items-center gap-3">
            <button onClick={() => setHeaderTab('recommend')} className={cn("text-xl font-black uppercase tracking-tighter italic transition-all", headerTab === 'recommend' ? "text-slate-900" : "text-slate-300 opacity-50")}>Recommend</button>
            <button onClick={() => setHeaderTab('me')} className={cn("text-xl font-black uppercase tracking-tighter italic transition-all", headerTab === 'me' ? "text-slate-900" : "text-slate-300 opacity-50")}>Me</button>
         </div>
         <div className="flex items-center gap-1.5 text-slate-800">
            <UserSearchDialog />
            <button onClick={() => user?.uid ? router.push(`/rooms/${user.uid}`) : null} className="p-1 bg-white/60 backdrop-blur-md rounded-full shadow-md border border-white/20 active:scale-90 transition-all"><Home className="h-4.5 w-4.5" /></button>
         </div>
      </div>
    </header>

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
              <div className={cn("h-[100px] w-full rounded-[1.5rem] bg-gradient-to-br p-3 flex flex-col justify-center relative overflow-hidden shadow-2xl border-2 border-white/20 active:scale-[0.98] transition-all group", slide.color || 'from-purple-600 to-indigo-600')}>
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
                <div className="relative z-10 px-2">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-white/20 p-1 rounded-lg backdrop-blur-md border border-white/30">
                     <Icon className="h-5 w-5 text-white animate-pulse" />
                   </div>
                   <h3 className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{slide.title}</h3>
                 </div>
                 <p className="text-[11px] font-black text-white drop-shadow-lg uppercase tracking-[0.4em] leading-none ml-1">{slide.subtitle || slide.sub}</p>
                </div>
              </div>
             </CarouselItem>
            );
          })}
        </CarouselContent>
       </Carousel>
      </div>

        <div className="px-3 mb-3">
          <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 backdrop-blur-3xl rounded-[1.5rem] p-3 border-2 border-white/10 shadow-2xl overflow-hidden relative group h-[80]">
            <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3 relative z-10 px-1">
               <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-yellow-300 to-yellow-600 p-1 rounded-lg shadow-lg">
                     <Trophy className="h-3 w-3 text-red-700 fill-current" />
                  </div>
                  <span className="font-black uppercase text-[12px] tracking-tight text-yellow-300 italic drop-shadow-md">TOP ROOMS GRID</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  <ArrowRight className="h-3 w-3 text-white/50" />
               </div>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1 relative z-10">
               {roomsData?.slice(0, 10).map((room: any) => (
                 <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer group/item">
                    <div className="relative">
                       <Avatar className="h-10 w-10 border-1 border-yellow-400/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover/item:border-yellow-400 transition-all">
                          <AvatarImage src={room.coverUrl} className="object-cover" />
                          <AvatarFallback className="bg-red-900/40 text-white/40 font-black">U</AvatarFallback>
                       </Avatar>
                       <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 shadow-xl">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                          <span className="text-[8px] font-black text-white">{room.participantCount || 0}</span>
                       </div>
                    </div>
                    <span className="text-[9px] font-bold text-white/90 uppercase tracking-tighter truncate w-16 text-center drop-shadow-sm">{room.title}</span>
                 </div>
               ))}
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

      <div className="px-3 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md py-1 mb-1 border-b border-slate-200/50">
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <div className="flex gap-1.5 pt-0.5">
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
          <p className="font-bold uppercase text-[9px] tracking-wider">{t.home.noActive}</p>
        </div>
       )}
      </main>
     </>
    ) : (
      <main className="px-4 flex-1 animate-in slide-in-from-right-4 duration-500 pb-20">
        {/* Profile Card */}
        <section className="mb-6 bg-white rounded-[2rem] p-5 shadow-xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-white shadow-2xl">
                <AvatarImage src={userProfile?.avatarUrl} />
                <AvatarFallback className="bg-slate-900 text-white font-black text-xl">U</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <VipBadge level={userProfile?.level?.rich || 1} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">{userProfile?.username || 'Tribe Member'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tribal ID: {userProfile?.accountNumber || '---'}</p>
              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                <GoldCoinIcon className="h-3 w-3" />
                <span className="text-xs font-black text-slate-700">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Missions */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Daily Missions
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Resets in 8h</span>
          </div>
          <div className="space-y-3">
            {[
              { id: '1', title: 'Daily Check-in', sub: 'Claim 5k coins', icon: Shield, progress: 100, color: 'bg-blue-500' },
              { id: '2', title: 'Gift Master', sub: 'Send 3 Lucky gifts', icon: Sparkles, progress: 33, color: 'bg-pink-500' },
              { id: '3', title: 'Social Star', sub: 'Stay 20m in voice', icon: Users, progress: 60, color: 'bg-emerald-500' },
            ].map(task => (
              <div key={task.id} className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl text-white shadow-lg", task.color)}>
                    <task.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-black uppercase text-slate-900 leading-tight">{task.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{task.sub}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] font-black text-slate-900">{task.progress}%</span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-1000", task.color)} style={{ width: `${task.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* My Frequency Section */}
        <section className="mb-8 p-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 px-1 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary fill-current" /> My Frequency
          </h3>
          {myRoom && !myRoom.name?.toUpperCase().includes('SYNCHRONIZING') ? (
            <div className="flex flex-col gap-3">
              <div className="max-w-[200px]">
                <ChatRoomCard room={myRoom} variant="modern" />
              </div>
            </div>
          ) : (
            <CreateRoomDialog 
              trigger={
                <button className="w-full h-32 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary transition-all active:scale-95 group">
                  <div className="bg-slate-50 p-3 rounded-full group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Open My Room</span>
                </button>
              }
            />
          )}
        </section>
      </main>
    )}

   </div>
   <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
  </AppLayout>
 );
}
