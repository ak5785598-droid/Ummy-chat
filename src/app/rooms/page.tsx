'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Ghost, Star, Sparkles, Trophy, Zap, Heart, Plus, Crown, Home, Gamepad2, Users, Loader, ArrowRight, LayoutGrid, Shield } from 'lucide-react';
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
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { RankingCard, FamilyCard, CpCard } from '@/components/premium-feature-cards';
import { VipBadge } from '@/components/vip-badge';
import { GoldCoinIcon } from '@/components/icons';

const ICON_MAP: Record<string, any> = {
 Sparkles,
 Trophy,
 Gamepad2,
 Zap,
 Star,
 Users,
 Heart
};

const RoomSkeleton = () => (
  <div className="flex flex-col gap-3 min-w-[280px] snap-center animate-pulse">
    <div className="aspect-square w-full rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200" />
    <div className="space-y-2 px-1">
      <div className="h-4 w-3/4 rounded-full bg-slate-100" />
      <div className="h-3 w-1/2 rounded-full bg-slate-50" />
    </div>
  </div>
);

export default function RoomsPage() {
 const { user } = useUser();
 const firestore = useFirestore();
 const router = useRouter();
 const { t } = useTranslation();
 const [activeCategory, setActiveCategory] = useState("All");
 const [headerTab, setHeaderTab] = useState<'recommend' | 'me'>('recommend');




 const userRef = useMemoFirebase(() => !firestore || !user ? null : doc(firestore, 'users', user.uid), [firestore, user]);
 const { data: userDoc } = useDoc(userRef);

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
   const isDecommissioned = room.id === 'ummy-help-center' || (room.name && room.name.toUpperCase().includes('SYNCHRONIZING'));
   return matchesCategory && (hasUsers || isPinned) && !isDecommissioned;
  });

  return [...filtered].sort((a, b) => {
   if (a.isPinned && !b.isPinned) return -1;
   if (!a.isPinned && b.isPinned) return 1;
   return (b.participantCount || 0) - (a.participantCount || 0);
  });
 }, [roomsData, activeCategory]);



 return (
  <AppLayout>
   <div className="min-h-full flex flex-col font-sans animate-in fade-in duration-700">
    
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 pt-10 pb-3 shrink-0 bg-white/70 backdrop-blur-3xl border-b border-black/5 transition-all duration-300">
      <div className="flex items-center justify-between w-full">
         <div className="flex items-center gap-6">
            <button 
              onClick={() => setHeaderTab('recommend')} 
              className={cn(
                "relative text-2xl font-black uppercase tracking-tighter italic transition-all duration-500", 
                headerTab === 'recommend' ? "text-slate-900 scale-110" : "text-slate-300 opacity-40 hover:opacity-70"
              )}
            >
              Recommend
              {headerTab === 'recommend' && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full animate-in slide-in-from-left duration-300" />}
            </button>
            <button 
              onClick={() => setHeaderTab('me')} 
              className={cn(
                "relative text-2xl font-black uppercase tracking-tighter italic transition-all duration-500", 
                headerTab === 'me' ? "text-slate-900 scale-110" : "text-slate-300 opacity-40 hover:opacity-70"
              )}
            >
              Me
              {headerTab === 'me' && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full animate-in slide-in-from-left duration-300" />}
            </button>
         </div>
         <div className="flex items-center gap-2">
            <UserSearchDialog />
            <div className="h-8 w-px bg-black/5 mx-1" />
            <button 
              onClick={() => { if (myRoom?.id) { router.push(`/rooms/${myRoom.id}`) } else { router.push('/rooms'); } }} 
              className="p-2.5 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white active:scale-90 transition-all hover:bg-white hover:shadow-2xl"
            >
              <Home className="h-5 w-5 text-slate-800" />
            </button>
         </div>
      </div>
    </header>

     {headerTab === 'recommend' ? (
      <>
        <div className="px-2.5 mb-2 mt-0">
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
                      "h-[160px] w-full rounded-[2.5rem] bg-gradient-to-br p-4 flex flex-col justify-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 active:scale-[0.98] transition-all group", 
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
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
                    {!slide.imageUrl && (
                      <div className="relative z-10 px-2 text-center">
                        <div className="flex flex-col items-center gap-2 mb-2">
                          <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md border border-white/30 shadow-xl">
                            <Icon className="h-6 w-6 text-white animate-pulse" />
                          </div>
                          <h3 className="text-4xl font-black uppercase tracking-tighter text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] leading-none">{slide.title}</h3>
                        </div>
                        <p className="text-[10px] font-black text-white/80 drop-shadow-lg uppercase tracking-[0.6em] leading-none">{slide.subtitle || slide.sub}</p>
                      </div>
                    )}
                  </div>
                 </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Global News Ticker */}
        <div className="px-3 mb-4">
          <div className="bg-white/40 backdrop-blur-3xl rounded-2xl h-8 border border-white/20 flex items-center overflow-hidden shadow-sm relative">
            <div className="absolute left-0 top-0 bottom-0 bg-slate-900 text-white px-3 flex items-center gap-2 z-10 rounded-r-xl shadow-lg">
              <Zap className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-[8px] font-black uppercase tracking-widest italic">Live News</span>
            </div>
            <div className="flex-1 whitespace-nowrap overflow-hidden relative">
              <div className="inline-block animate-marquee pl-[100%]">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mx-4">Welcome to Ummy Chat! Join your favorite rooms and connect with friends.</span>
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mx-4">Don't miss the Elite Rewards event live now!</span>
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mx-4">Invite 10 friends and get exclusive 50k coin rewards.</span>
              </div>
            </div>
          </div>
        </div>

         <div className="px-3 mb-4">
          <div className="bg-gradient-to-r from-[#ff0844] via-[#ffb199] to-[#ff0844] bg-[length:200%_auto] animate-gradient-slow backdrop-blur-3xl rounded-[2.5rem] p-3 border-2 border-white/20 shadow-[0_20px_50px_rgba(255,8,68,0.3)] overflow-hidden relative group h-[95px]">
            <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2 relative z-10 px-2">
               <div className="flex items-center gap-2">
                  <div className="relative">
                    <Trophy className="h-4 w-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    <div className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-yellow-400 rounded-full animate-ping" />
                  </div>
                  <h2 className="text-[10px] font-black uppercase text-white tracking-[0.2em] drop-shadow-md italic">Live Frequency</h2>
               </div>
               <button onClick={() => router.push('/rooms/all')} className="text-[9px] font-black text-white px-3 py-1 bg-white/20 rounded-full border border-white/20 uppercase backdrop-blur-md hover:bg-white/40 transition-all active:scale-95 flex items-center gap-1">
                 Explore <ArrowRight className="h-2.5 w-2.5" />
               </button>
            </div>
            <div className="h-full flex items-center gap-5 overflow-x-auto no-scrollbar pt-1 pb-1 relative z-10">
               {roomsData?.slice(0, 10).map((room: any) => (
                 <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-all cursor-pointer group/item">
                    <div className="relative">
                       <div className="absolute inset-0 rounded-full bg-white/20 blur-md group-hover/item:blur-lg transition-all" />
                       <Avatar className="h-11 w-11 border-2 border-white/40 shadow-2xl relative z-10 group-hover/item:border-white group-hover/item:scale-110 transition-all">
                          <AvatarImage src={room.coverUrl} className="object-cover" />
                          <AvatarFallback className="bg-white/20 text-white font-black text-[12px]">U</AvatarFallback>
                       </Avatar>
                       <div className="absolute -bottom-1 -right-1 bg-white px-2 py-0.5 rounded-full border-2 border-[#ff0844] flex items-center gap-1 shadow-lg z-20">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                          <span className="text-[8px] font-black text-[#ff0844]">{room.participantCount || 0}</span>
                       </div>
                    </div>
                    <span className="text-[9px] font-black text-white uppercase tracking-tighter truncate w-16 text-center drop-shadow-xl">{room.title}</span>
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

      <div className="px-3 sticky top-[100px] z-40 bg-white/70 backdrop-blur-3xl py-3 mb-2 border-b border-black/5">
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <div className="flex gap-2.5 pt-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-90",
                  activeCategory === cat.id 
                    ? "bg-slate-900 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] shadow-slate-900/40" 
                    : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100/50"
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
                <AvatarImage src={userDoc?.avatarUrl} />
                <AvatarFallback className="bg-slate-900 text-white font-black text-xl">U</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <VipBadge level={userDoc?.level?.rich || 1} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">{userDoc?.username || 'Tribe Member'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tribal ID: {userDoc?.accountNumber || '---'}</p>
              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                <GoldCoinIcon className="h-3 w-3" />
                <span className="text-xs font-black text-slate-700">{(userDoc?.wallet?.coins || 0).toLocaleString()}</span>
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
