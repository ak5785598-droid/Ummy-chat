'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  useUser, 
  useCollection, 
  useMemoFirebase, 
  useFirestore, 
  useDoc,
  updateDocumentNonBlocking
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  doc, 
  limit, 
  increment 
} from 'firebase/firestore';
import { 
  Search, 
  MessageSquare, 
  Plus, 
  Flame, 
  Users, 
  Shield, 
  Crown, 
  Trophy, 
  Settings, 
  Heart,
  Ghost,
  Loader,
  Sparkles,
  CheckCircle2,
  Home,
  Gamepad2,
  ArrowRight,
  LayoutGrid,
  Zap,
  Star
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
import { CreateRoomDialog } from '@/components/create-room-dialog';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { RankingCard, FamilyCard, CpCard } from '@/components/premium-feature-cards';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useQuestInitializer } from '@/hooks/use-quest-initializer';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
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
  <div className="flex flex-col gap-3 min-w-[280px] snap-center">
   <Skeleton className="aspect-square w-full rounded-2xl" />
   <div className="space-y-1.5 px-1">
    <Skeleton className="h-3.5 w-3/4 rounded-md" />
    <Skeleton className="h-2.5 w-1/2 rounded-md" />
   </div>
  </div>
 );

export default function RoomsPage() {
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: userDoc, isLoading: isUserLoading } = useUserProfile(user?.uid);
 const { toast } = useToast();
 const router = useRouter();
 const { t } = useTranslation();
 const [activeCategory, setActiveCategory] = useState("All");
 const [headerTab, setHeaderTab] = useState<'recommend' | 'me'>('recommend');

  const followedRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'followedRooms'), orderBy('followedAt', 'desc'), limit(20));
  }, [firestore, user?.uid]);

  const { data: followedRoomsData, isLoading: isFollowedLoading } = useCollection(followedRoomsQuery);

 // ⚡ DAILY QUEST INITIALIZER: High-Fidelity Reset logic
 useQuestInitializer();

 const questsQuery = useMemoFirebase(() => {
   if (!firestore || !user?.uid) return null;
   return collection(firestore, 'users', user.uid, 'quests');
 }, [firestore, user?.uid]);

 const { data: questsData, isLoading: isQuestsLoading } = useCollection(questsQuery);

 const userRef = useMemoFirebase(() => !firestore || !user ? null : doc(firestore, 'users', user.uid), [firestore, user]);

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
    
    <header className="flex items-center justify-between px-4 pt-2 pb-0 shrink-0">
      <div className="pt-0 flex items-center justify-between w-full">
         <div className="flex items-center gap-3">
            <button onClick={() => setHeaderTab('recommend')} className={cn("text-xl font-black uppercase tracking-tighter italic transition-all", headerTab === 'recommend' ? "text-slate-900" : "text-slate-300 opacity-50")}>Recommend</button>
            <button onClick={() => setHeaderTab('me')} className={cn("text-xl font-black uppercase tracking-tighter italic transition-all", headerTab === 'me' ? "text-slate-900" : "text-slate-300 opacity-50")}>Me</button>
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
                  "h-[140px] w-full rounded-[1.8rem] bg-gradient-to-br p-3 flex flex-col justify-center relative overflow-hidden shadow-2xl border-2 border-white/20 active:scale-[0.98] transition-all group", 
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
                      <h3 className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{slide.title}</h3>
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
          <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 backdrop-blur-3xl rounded-[1.2rem] p-2 border-2 border-white/10 shadow-2xl overflow-hidden relative group h-[80px]">
            <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-1 relative z-10 px-1">
               <div className="flex items-center gap-1">
                  <Trophy className="h-2.5 w-2.5 text-yellow-400 animate-bounce" />
                  <h2 className="text-[8px] font-black uppercase text-white/90 tracking-widest">Live Frequency</h2>
               </div>
               <button onClick={() => router.push('/rooms/all')} className="text-[7px] font-bold text-yellow-400/80 uppercase hover:text-yellow-400 transition-colors flex items-center gap-0.5">Explore <LayoutGrid className="h-2 w-2" /></button>
            </div>
            <div className="h-full flex items-center gap-4 overflow-x-auto no-scrollbar pt-0.5 pb-0.5 relative z-10">
               {roomsData?.slice(0, 10).map((room: any) => (
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
      <main className="px-4 flex-1 animate-in slide-in-from-right-4 duration-500 pb-28">
        {/* Profile Card */}
        <section className="mb-4 bg-white rounded-[2rem] p-5 shadow-xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-white shadow-2xl">
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

        {/* My Frequency Section - Top Priority */}
        <section className="mb-6 p-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3 px-1 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary fill-current" /> My Frequency
          </h3>
          {myRoom && !myRoom.name?.toUpperCase().includes('SYNCHRONIZING') ? (
            <div className="flex flex-col gap-3">
              <div className="max-w-full">
                <ChatRoomCard room={myRoom} variant="modern" />
              </div>
            </div>
          ) : (
            <CreateRoomDialog 
              trigger={
                <button className="w-full h-24 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-primary hover:border-primary transition-all active:scale-95 group">
                  <Plus className="h-5 w-5 bg-slate-50 p-1.5 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Open My Room</span>
                </button>
              }
            />
          )}
        </section>

        {/* Followed Frequency Section */}
        <section className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 px-1 flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 text-pink-500 fill-current" /> Following
          </h3>
          {isFollowedLoading ? (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shrink-0 w-32 aspect-square rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : followedRoomsData && followedRoomsData.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {followedRoomsData.map((roomRef: any) => (
                <div key={roomRef.id} onClick={() => router.push(`/rooms/${roomRef.id}`)} className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-all cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border border-slate-100 shadow-xl">
                      <AvatarImage src={roomRef.coverUrl} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-xs">U</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter truncate w-16 text-center">{roomRef.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-[9px] font-black uppercase tracking-widest text-slate-300 border border-dashed rounded-3xl">
              Follow rooms to find them here!
            </div>
          )}
        </section>

        {/* Daily Missions - Global Resilience */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" /> Daily Missions
            </h3>
            <span className="text-[8px] font-bold text-slate-300 uppercase">Resets Daily</span>
          </div>
          
          <div className="space-y-2.5">
            {isQuestsLoading ? (
              <div className="py-6 text-center animate-pulse flex flex-col items-center gap-2">
                 <Loader className="h-5 w-5 text-slate-200 animate-spin" />
              </div>
            ) : questsData?.length === 0 ? (
              <div className="py-6 text-center text-slate-200 font-bold uppercase text-[9px] tracking-widest bg-slate-50 rounded-3xl border border-dashed">
                Loading...
              </div>
            ) : questsData?.map((quest: any) => {
              const isCompleted = quest.current >= quest.target;
              const meta: Record<string, any> = {
                stay_15: { title: 'Resident', sub: 'Stay 15m', icon: Shield, color: 'bg-blue-500', reward: 500 },
                send_gift: { title: 'Giver', sub: 'Send 1 gift', icon: Sparkles, color: 'bg-pink-500', reward: 1000 },
                win_game: { title: 'Victor', sub: 'Win 1 game', icon: Trophy, color: 'bg-yellow-500', reward: 2000 }
              };
              const currentMeta = meta[quest.id] || { title: quest.id, sub: 'Task', icon: Trophy, color: 'bg-slate-500', reward: 100 };

              const handleClaim = async () => {
                if (!firestore || !user?.uid) return;
                try {
                  const questRef = doc(firestore, 'users', user.uid, 'quests', quest.id);
                  const userRef = doc(firestore, 'users', user.uid);
                  await updateDocumentNonBlocking(questRef, { isClaimed: true });
                  await updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(currentMeta.reward) });
                  toast({ title: 'Reward Claimed!', description: `+${currentMeta.reward} Gold` });
                } catch (e) {
                  toast({ variant: 'destructive', title: 'Error' });
                }
              };

              return (
                <div key={quest.id} className={cn(
                  "p-3.5 rounded-[1.5rem] border shadow-sm transition-all duration-300",
                  isCompleted ? "bg-primary/5 border-primary/10" : "bg-white border-slate-50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm", currentMeta.color)}>
                      <currentMeta.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-tight">{currentMeta.title}</h4>
                        <div className="flex items-center gap-1">
                          <GoldCoinIcon className="h-2.5 w-2.5" />
                          <span className="text-[9px] font-black text-slate-600">+{currentMeta.reward}</span>
                        </div>
                      </div>
                      <Progress value={Math.min((quest.current / quest.target) * 100, 100)} className="h-1 bg-slate-100" />
                    </div>
                    
                    {isCompleted && !quest.isClaimed && (
                      <button onClick={handleClaim} className="ml-2 px-3 py-1.5 bg-primary text-black font-black uppercase text-[9px] rounded-lg shadow-lg">
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    )}

   </div>
    <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
   </AppLayout>
  );
}
