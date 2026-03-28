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
import { UmmyLogoIcon } from '@/components/icons';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { RankingCard, FamilyCard, CpCard } from '@/components/premium-feature-cards';

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

 const followedRoomsQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(collection(firestore, 'users', user.uid, 'followedRooms'), limit(20));
 }, [firestore, user]);
 const { data: followedRooms, isLoading: isFollowedLoading } = useCollection(followedRoomsQuery);

 // Filter out owned rooms from the followed list
 const filteredFollowedRooms = useMemo(() => {
  if (!followedRooms) return [];
  if (!user) return followedRooms;
  return followedRooms.filter(r => r.ownerId !== user.uid && r.id !== user.uid);
 }, [followedRooms, user]);

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
             <div className={cn("h-[120px] w-full rounded-[1.5rem] bg-gradient-to-br p-6 flex flex-col justify-center relative overflow-hidden shadow-2xl border-2 border-white/20 active:scale-[0.98] transition-all group", slide.color || 'from-purple-600 to-indigo-600')}>
               {slide.imageUrl && (
                <Image 
                 src={slide.imageUrl} 
                 alt="" 
                 fill 
                 className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
                 unoptimized 
                />
               )}
               <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] group-hover:animate-shine" />
               <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-5 w-5 text-white animate-pulse" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">{slide.title}</h3>
                </div>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.4em] leading-none drop-shadow-md">{slide.subtitle || slide.sub}</p>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-10">
                <UmmyLogoIcon className="h-20 w-20 rotate-12" />
               </div>
             </div>
            </CarouselItem>
           );
          })}
        </CarouselContent>
       </Carousel>
      </div>

       <div className="px-3 mb-1.5">
         <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-purple-500/10 backdrop-blur-xl rounded-[1.2rem] p-2.5 border border-white/10 shadow-lg overflow-hidden relative group">
           <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex items-center justify-between mb-1.5 relative z-10 px-1">
              <div className="flex items-center gap-1.5 text-white/60">
                 <div className="bg-yellow-400 p-0.5 rounded-full shadow-md">
                    <Star className="h-2.5 w-2.5 text-white fill-current" />
                 </div>
                 <span className="font-black uppercase text-[10px] tracking-widest italic">Top Rooms Grid</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-white/30" />
           </div>
           <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 relative z-10">
              {roomsData?.slice(0, 10).map((room: any) => (
                <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="flex flex-col items-center gap-1 shrink-0 active:scale-90 transition-all cursor-pointer">
                   <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-white/30 shadow-xl">
                         <AvatarImage src={room.coverUrl} className="object-cover" />
                         <AvatarFallback className="bg-slate-200">U</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-1.5 py-0 rounded-full border border-white/10 flex items-center gap-1 shadow-lg">
                         <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[7px] font-black text-white">{room.participantCount || 0}</span>
                      </div>
                   </div>
                   <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter truncate w-14 text-center">{room.title}</span>
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
     <main className="px-2 flex-1 animate-in slide-in-from-right-4 duration-500">
       <section className="mb-6 px-4">
        <h3 className="text-base font-bold uppercase tracking-tight text-slate-900 mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary fill-current" /> MY FREQUENCY
        </h3>
        {myRoom && !myRoom.name?.toUpperCase().includes('SYNCHRONIZING') ? (
         <div className="flex flex-col gap-3">
          <div className="max-w-[160px]">
            <ChatRoomCard room={myRoom} variant="modern" />
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between">
            <div className="flex flex-col">
             <span className="text-[10px] font-bold uppercase text-slate-400">Tribal ID Sync</span>
             <span className="text-lg font-bold text-slate-900 tracking-tight">#{myRoom.roomNumber}</span>
            </div>
            <Button size="sm" className="rounded-xl px-6 h-10 font-bold uppercase text-xs shadow-lg" onClick={() => router.push(`/rooms/${myRoom.id}`)}>
             Enter Room <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
         </div>
        ) : (
         <CreateRoomDialog 
          trigger={
           <button 
            className="w-full h-28 rounded-xl border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
           >
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Plus className="h-4 w-4" />
             </div>
             <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{t.home.launch}</span>
           </button>
          }
         />
        )}
       </section>

       <section className="px-2">
        <h3 className="text-base font-bold uppercase tracking-tight text-slate-900 mb-3 flex items-center gap-2 px-2">
          <Heart className="h-3.5 w-3.5 text-pink-500 fill-current" /> {t.profile.follow}
        </h3>
        {isFollowedLoading ? (
         <div className="grid grid-cols-2 gap-x-2 gap-y-6">
           {Array.from({ length: 4 }).map((_, i) => <RoomSkeleton key={i} />)}
         </div>
        ) : filteredFollowedRooms.length > 0 ? (
         <div className="grid grid-cols-2 gap-x-2 gap-y-6 pb-8">
           {filteredFollowedRooms.map((room: any) => (
            <ChatRoomCard key={room.id} room={room} variant="modern" />
           ))}
         </div>
        ) : (
         <div className="py-12 text-center space-y-3 opacity-40 bg-white/40 rounded-xl border-2 border-dashed border-white/60 mx-2">
           <Heart className="h-6 w-6 mx-auto text-slate-300" />
           <p className="font-bold uppercase text-[8px] tracking-wider">No Followed Tribes</p>
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
