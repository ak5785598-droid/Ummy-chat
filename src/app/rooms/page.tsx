
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Loader, Trophy, Heart, ArrowRight, Gamepad2, Sparkles, Zap, Users, Star, Camera, Upload, Pin } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc, useStorage } from '@/firebase';
import { collection, query, limit, orderBy, doc, where, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Trophy,
  Gamepad2,
  Zap,
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

interface ScrollingBannerProps {
  slides?: any[];
  isSovereign?: boolean;
}

/**
 * High-Fidelity Scrolling Banner.
 */
function ScrollingBanner({ slides: customSlides, isSovereign }: ScrollingBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const slides = customSlides || DEFAULT_SLIDES;

  useEffect(() => {
    setMounted(true);
    if (slides.length <= 1 || isUploading) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isUploading]);

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSovereign && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore || !storage) return;

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const sRef = ref(storage, `banners/slide_${currentSlide}_${timestamp}.jpg`);
      const result = await uploadBytes(sRef, file);
      const url = await getDownloadURL(result.ref);

      const bannerConfigRef = doc(firestore, 'appConfig', 'banners');
      const newSlides = [...slides];
      const baseSlide = slides[currentSlide] || DEFAULT_SLIDES[currentSlide] || DEFAULT_SLIDES[0];
      newSlides[currentSlide] = { ...baseSlide, imageUrl: url };
      
      await setDoc(bannerConfigRef, { slides: newSlides }, { merge: true });
      toast({ title: 'Banner Synchronized' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Sync Failed' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!mounted || slides.length === 0) return <div className="col-span-2 my-2 rounded-[1.5rem] h-28 bg-black/5 animate-pulse" />;

  const slide = slides[currentSlide];
  const Icon = ICON_MAP[slide.iconName] || Sparkles;

  return (
    <div className="col-span-2 my-2 rounded-[1.5rem] overflow-hidden relative h-28 shadow-xl border-2 border-white/20 group active:scale-[0.98] transition-all cursor-pointer bg-black">
      <div key={currentSlide} className="absolute inset-0 animate-in fade-in slide-in-from-right-4 duration-700">
        <Image 
          src={slide.imageUrl || undefined} 
          alt={slide.title} 
          fill 
          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[5000ms]"
          unoptimized
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
        {isSovereign ? (
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className="h-10 w-10 bg-primary backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-black shadow-xl hover:scale-110 active:scale-95 transition-all"
          >
            {isUploading ? <Loader className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
        ) : (
          <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_: any, i: number) => (
          <div key={i} className={cn("h-1 rounded-full transition-all duration-500", currentSlide === i ? "bg-white w-4" : "bg-white/30 w-1")} />
        ))}
      </div>
    </div>
  );
}

const RoomSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-[4/5] w-full rounded-[1.2rem]" />
    <div className="flex gap-2 px-1">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 flex-1 rounded-md" />
    </div>
  </div>
);

export default function RoomsPage() {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Popular' | 'Me'>('Popular');

  const isSovereign = user?.uid === CREATOR_ID || 
                      userProfile?.tags?.some(t => ['Admin', 'Official', 'Super Admin', 'App Manager', 'Supreme Creator'].includes(t));

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      orderBy('participantCount', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const myRoomQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid), limit(1));
  }, [firestore, user]);

  // Followed Rooms Sync
  const followedRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'followedRooms'), orderBy('followedAt', 'desc'), limit(20));
  }, [firestore, user]);

  const bannerRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appConfig', 'banners');
  }, [firestore]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(roomsQuery);
  const { data: myRooms, isLoading: isMyRoomLoading } = useCollection(myRoomQuery);
  const { data: followedRooms, isLoading: isFollowedLoading } = useCollection(followedRoomsQuery);
  const { data: bannerConfig } = useDoc(bannerRef);

  const displayRooms = useMemo(() => {
    return roomsData || [];
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
            <div className="relative">
              <button 
                onClick={() => setActiveTab('Me')}
                className={cn(
                  "text-2xl font-black uppercase italic tracking-tighter transition-colors",
                  activeTab === 'Me' ? "text-gray-900" : "text-gray-400"
                )}
              >
                Me
              </button>
              {activeTab === 'Me' && (
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
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {Array.from({ length: 6 }).map((_, i) => <RoomSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {displayRooms.map((room: any, index: number) => (
                    <React.Fragment key={room.id}>
                      <ChatRoomCard room={room} variant="modern" />
                      {index === 3 && <ScrollingBanner slides={bannerConfig?.slides} isSovereign={isSovereign} />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-10">
               {/* My Room Section */}
               <section className="space-y-4">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter px-2 flex items-center gap-2">
                     <Pin className="h-5 w-5 text-primary" /> My Frequency
                  </h3>
                  {isMyRoomLoading ? (
                    <div className="flex justify-center p-10"><Loader className="animate-spin text-primary h-8 w-8" /></div>
                  ) : myRooms && myRooms.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                       <ChatRoomCard room={myRooms[0]} variant="modern" />
                    </div>
                  ) : (
                    <div className="text-center space-y-6 px-8 py-12 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 w-full">
                       <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto">
                          <Zap className="h-10 w-10" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-xl font-black uppercase italic">Define Your Frequency</h3>
                          <p className="text-muted-foreground font-body italic text-sm">Gather your tribe and start broadcasting.</p>
                       </div>
                       <CreateRoomDialog trigger={<Button className="w-full h-14 rounded-2xl font-black uppercase italic shadow-xl">Launch Room</Button>} />
                    </div>
                  )}
               </section>

               {/* Followed Rooms Section */}
               <section className="space-y-4">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter px-2 flex items-center gap-2">
                     <Heart className="h-5 w-5 text-red-500 fill-current" /> Followed Tribes
                  </h3>
                  {isFollowedLoading ? (
                    <div className="grid grid-cols-2 gap-4">
                       {Array.from({ length: 2 }).map((_, i) => <RoomSkeleton key={i} />)}
                    </div>
                  ) : followedRooms && followedRooms.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                       {followedRooms.map((room: any) => (
                         <ChatRoomCard key={room.id} room={room} variant="modern" />
                       ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-20 italic bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                       <p className="font-bold text-sm">No followed frequencies detected.</p>
                    </div>
                  )}
               </section>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
