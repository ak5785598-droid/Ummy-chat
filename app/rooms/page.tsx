'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Loader, Search, Plus, Trophy, Users, Heart, ArrowRight, Gamepad2, Sparkles, Zap, Flame, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Trophy,
  Gamepad2,
  Zap,
  Flame,
  Star,
  Users,
  Heart
};

const DEFAULT_SLIDES = [
  {
    title: "Tribe Events",
    subtitle: "Global Frequency Sync",
    iconName: "Sparkles",
    color: "from-orange-500/40",
    imageUrl: 'https://picsum.photos/seed/banner1/800/200'
  },
  {
    title: "Elite Rewards",
    subtitle: "Claim Your Daily Throne",
    iconName: "Trophy",
    color: "from-yellow-500/40",
    imageUrl: 'https://picsum.photos/seed/banner2/800/200'
  },
  {
    title: "Game Zone",
    subtitle: "Enter the 3D Arena",
    iconName: "Gamepad2",
    color: "from-purple-500/40",
    imageUrl: 'https://picsum.photos/seed/banner3/800/200'
  }
];

function ScrollingBanner({ slides: customSlides }: { slides?: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = customSlides || DEFAULT_SLIDES;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];
  const Icon = ICON_MAP[slide.iconName] || Sparkles;

  return (
    <div className="col-span-2 my-2 rounded-[1.5rem] overflow-hidden relative h-28 shadow-xl border-2 border-white/20 group active:scale-[0.98] transition-all cursor-pointer bg-black">
      <div key={currentSlide} className="absolute inset-0 animate-in fade-in slide-in-from-right-4 duration-700">
        <Image 
          src={slide.imageUrl} 
          alt={slide.title} 
          fill 
          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[5000ms]"
        />
        <div className={cn("absolute inset-0 bg-gradient-to-r via-transparent to-transparent flex flex-col justify-center px-8", slide.color || "from-black/40")}>
          <div className="flex items-center gap-2 mb-1">
             <Icon className="h-4 w-4 text-white animate-pulse" />
             <h4 className="text-white font-black uppercase italic text-xl tracking-tighter leading-none drop-shadow-lg">{slide.title}</h4>
          </div>
          <p className="text-white/80 font-bold uppercase text-[8px] tracking-[0.3em] drop-shadow-md">{slide.subtitle}</p>
        </div>
      </div>
      
      <div className="absolute top-1/2 right-6 -translate-y-1/2 z-20">
        <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
          <ArrowRight className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_: any, i: number) => (
          <div key={i} className={cn("h-1 rounded-full transition-all duration-500", currentSlide === i ? "bg-white w-4" : "bg-white/30 w-1")} />
        ))}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Popular' | 'Me'>('Popular');

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      orderBy('participantCount', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const bannerRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appConfig', 'banners');
  }, [firestore]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(roomsQuery);
  const { data: bannerConfig } = useDoc(bannerRef);

  const displayRooms = useMemo(() => {
    const helpRoomBase: any = {
      id: 'ummy-help-center',
      roomNumber: '0000',
      title: 'Ummy Official Help',
      topic: 'Ask any app related question quick and fast.',
      category: 'Chat',
      coverUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1000',
      ownerId: 'official-support-bot',
      participantCount: 0,
      isOfficial: true
    };

    if (!roomsData) return [helpRoomBase];
    const syncedHelpRoom = roomsData.find(r => r.id === 'ummy-help-center');
    const finalHelpRoom = syncedHelpRoom ? { ...helpRoomBase, ...syncedHelpRoom, isOfficial: true } : helpRoomBase;
    return [finalHelpRoom, ...roomsData.filter(r => r.id !== 'ummy-help-center')];
  }, [roomsData]);

  const CategoryCard = ({ title, label, gradient, onClick }: { title: string, label: string, gradient: string, onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={cn(
      "relative flex-1 min-w-0 rounded-2xl h-24 overflow-hidden border-2 border-white/20 shadow-lg flex flex-col items-center justify-center gap-1 group active:scale-95 transition-all cursor-pointer",
      gradient
    )}>
       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
       <span className="text-white font-black text-[10px] uppercase tracking-widest drop-shadow-md z-10">{label}</span>
       <div className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full z-10">
          <p className="text-[8px] font-black text-white uppercase">{title}</p>
       </div>
       <div className="absolute -bottom-2 -right-2 opacity-20 rotate-12">
          {title === 'Ranking' && <Trophy className="h-16 w-16 text-white" />}
          {title === 'Family' && <Users className="h-16 w-16 text-white" />}
          {title === 'CP' && <Heart className="h-16 w-16 text-white" />}
       </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-[#f8f9fa] flex flex-col space-y-6 pb-32 font-headline animate-in fade-in duration-700">
        <header className="flex items-center justify-between px-6 pt-6 bg-white shrink-0">
          <div className="flex items-center gap-8">
            <div className="relative">
              <button 
                onClick={() => setActiveTab('Popular')}
                className={cn(
                  "text-2xl font-black uppercase italic tracking-tighter transition-colors",
                  activeTab === 'Popular' ? "text-gray-900" : "text-gray-400"
                )}
              >
                Popular
              </button>
              {activeTab === 'Popular' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-[#00E5FF] rounded-full" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <UserSearchDialog />
             <CreateRoomDialog iconOnly />
          </div>
        </header>

        <div className="px-4 space-y-6 overflow-y-auto no-scrollbar flex-1">
          {activeTab === 'Popular' ? (
            <>
              <div className="flex gap-2">
                 <CategoryCard title="Ranking" label="Ranking" gradient="bg-gradient-to-br from-orange-400 to-yellow-600" onClick={() => router.push('/leaderboard')} />
                 <CategoryCard title="CP" label="CP" gradient="bg-gradient-to-br from-pink-400 to-purple-600" onClick={() => router.push('/cp-challenge')} />
              </div>

              {isRoomsLoading && !roomsData ? (
                <div className="flex justify-center py-20"><Loader className="animate-spin text-primary h-8 w-8" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {displayRooms.map((room: any, index: number) => (
                    <React.Fragment key={room.id}>
                      <ChatRoomCard room={room} variant="modern" />
                      {index === 3 && <ScrollingBanner slides={bannerConfig?.slides} />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
               <Loader className="animate-spin h-8 w-8 text-primary mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Followed Rooms...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
