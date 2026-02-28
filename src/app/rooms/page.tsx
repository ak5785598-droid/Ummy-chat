'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Loader, Flame, Crown, Heart, Users, Home, Plus, Star, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { MomentsFeed } from '@/components/moments-feed';
import { PublishMomentDialog } from '@/components/publish-moment-dialog';

/**
 * High-Fidelity Discovery Hub.
 * Optimized for Android Real-Time Screen Arrangement.
 */
export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('All');
  const [navTab, setNavTab] = useState<'chatroom' | 'moments' | 'mine'>('chatroom');
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [api]);

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      where('participantCount', '>', 0),
      orderBy('participantCount', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(roomsQuery);

  const myRoomQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid), limit(1));
  }, [firestore, user]);

  const { data: myRoomData } = useCollection(myRoomQuery);
  const myRoomId = myRoomData?.[0]?.id;

  const topRichQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('wallet.dailySpent', 'desc'), limit(3));
  }, [firestore, user]);
  const { data: topRich } = useCollection(topRichQuery);

  const topCharmQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('stats.dailyFans', 'desc'), limit(3));
  }, [firestore, user]);
  const { data: topCharm } = useCollection(topCharmQuery);

  const topRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), orderBy('stats.dailyGifts', 'desc'), limit(3));
  }, [firestore, user]);
  const { data: topRoomsRanking } = useCollection(topRoomsQuery);

  const filteredRooms = useMemo(() => {
    if (navTab === 'mine') return myRoomData || [];
    if (!roomsData) return [];
    
    let rooms = [...roomsData];
    if (activeTab !== 'All') {
      if (activeTab === 'Hot') return rooms.slice(0, 10);
      if (activeTab === 'New') return rooms.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);
    }
    return rooms;
  }, [roomsData, myRoomData, activeTab, navTab]);

  const RankingCard = ({ title, color, items, icon: Icon, type }: any) => (
    <Link 
      href={`/leaderboard?type=${type}`} 
      className={cn(
        "relative flex-1 min-w-0 rounded-2xl p-2 h-24 overflow-hidden border border-white/10 shadow-lg block transition-transform active:scale-95", 
        color
      )}
    >
       <div className="flex justify-between items-center mb-1">
          <span className="text-white font-black text-[8px] uppercase italic opacity-80">{title}</span>
          <Icon className="h-2.5 w-2.5 text-white/40" />
       </div>
       <div className="flex justify-center items-end gap-0.5 mt-1">
          {items?.[1] && <Avatar className="h-6 w-6 border border-slate-300/50"><AvatarImage src={items[1].avatarUrl || items[1].coverUrl} /><AvatarFallback className="text-[8px]">2</AvatarFallback></Avatar>}
          {items?.[0] && <Avatar className="h-8 w-8 border-2 border-yellow-400 shadow-[0_0_8px_rgba(255,214,0,0.5)] -mt-1"><AvatarImage src={items[0].avatarUrl || items[0].coverUrl} /><AvatarFallback className="text-[10px]">1</AvatarFallback></Avatar>}
          {items?.[2] && <Avatar className="h-6 w-6 border border-amber-700/50"><AvatarImage src={items[2].avatarUrl || items[2].coverUrl} /><AvatarFallback className="text-[8px]">3</AvatarFallback></Avatar>}
       </div>
       <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </Link>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        <header className="px-4 pt-6 pb-2 sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-50">
          <div className="flex items-center justify-between gap-2 max-w-full">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
              <button onClick={() => setNavTab('chatroom')} className={cn("text-xl font-black transition-all whitespace-nowrap", navTab === 'chatroom' ? "text-gray-900" : "text-gray-300")}>Chatroom</button>
              <button onClick={() => setNavTab('moments')} className={cn("text-xl font-black transition-all whitespace-nowrap", navTab === 'moments' ? "text-gray-900" : "text-gray-300")}>Moments</button>
              <button onClick={() => setNavTab('mine')} className={cn("text-xl font-black transition-all whitespace-nowrap", navTab === 'mine' ? "text-gray-900" : "text-gray-300")}>Mine</button>
            </div>
            <div className="flex items-center gap-3 shrink-0">
               <UserSearchDialog />
               {navTab === 'moments' && <PublishMomentDialog />}
               {myRoomId ? (
                 <Link href={`/rooms/${myRoomId}`} className="p-1 hover:scale-110 active:scale-90 transition-all"><Home className="h-6 w-6 text-gray-800" /></Link>
               ) : (
                 <button onClick={() => toast({ title: "No Frequency Found", description: "You need to launch a room in the 'Mine' tab first." })} className="p-1 opacity-20 hover:scale-110 active:scale-90 transition-all"><Home className="h-6 w-6 text-gray-800" /></button>
               )}
            </div>
          </div>
        </header>

        <div className="px-4 space-y-6 pt-4">
          {navTab === 'chatroom' && (
            <>
              <div className="w-full overflow-hidden rounded-[2rem] shadow-xl">
                <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {[1, 2, 3].map((i) => (
                      <CarouselItem key={i}>
                        <div className="relative aspect-[16/7] rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent flex flex-col justify-center px-8 border-4 border-white shadow-inner">
                           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                           <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg relative z-10 leading-none">Rising Host<br/><span className="text-black">Contest</span></h2>
                           <div className="flex gap-1 mt-4 relative z-10">
                              {Array.from({length: 8}).map((_, dot) => (
                                <div key={dot} className={cn("h-1.5 w-1.5 rounded-full bg-white/40", dot === 0 && "bg-white w-4")} />
                              ))}
                           </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>

              <div className="flex gap-2 px-1">
                 <RankingCard title="RICH" color="bg-gradient-to-br from-[#b88a44] to-[#63441a]" items={topRich} icon={Crown} type="rich" />
                 <RankingCard title="CHARM" color="bg-gradient-to-br from-[#9e1b32] to-[#4a0a16]" items={topCharm} icon={Heart} type="charm" />
                 <RankingCard title="ROOM" color="bg-gradient-to-br from-[#2d5a27] to-[#143311]" items={topRoomsRanking} icon={Users} type="rooms" />
              </div>

              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                <button onClick={() => setActiveTab('All')} className={cn("flex items-center gap-2 px-6 h-10 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-md", activeTab === 'All' ? "bg-gradient-to-r from-[#ffe082] to-[#ffca28] text-gray-900 border-2 border-white" : "bg-gray-100 text-gray-400")}><div className="bg-white/40 p-0.5 rounded-full"><Star className="h-3 w-3 fill-yellow-600 text-yellow-600" /></div>All</button>
                <button onClick={() => setActiveTab('Hot')} className={cn("px-8 h-10 rounded-full text-sm font-bold transition-all whitespace-nowrap", activeTab === 'Hot' ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400")}>Hot</button>
                <button onClick={() => setActiveTab('New')} className={cn("px-8 h-10 rounded-full text-sm font-bold transition-all whitespace-nowrap", activeTab === 'New' ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400")}>New</button>
              </div>

              {isRoomsLoading ? (
                <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-6 pb-32">
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room: any) => (
                      <ChatRoomCard key={room.id} room={room} variant="modern" />
                    ))
                  ) : (
                    <div className="col-span-2 py-20 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center"><Plus className="h-8 w-8 text-gray-200" /></div>
                      <p className="text-gray-400 font-black uppercase text-xs">No Active Frequencies</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {navTab === 'moments' && (
            <div className="pb-32">
               <MomentsFeed />
            </div>
          )}

          {navTab === 'mine' && (
            <div className="pb-32">
               {myRoomData && myRoomData.length > 0 ? (
                 <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                    {myRoomData.map((room: any) => (
                      <ChatRoomCard key={room.id} room={room} variant="modern" />
                    ))}
                 </div>
               ) : (
                 <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Flame className="h-10 w-10" /></div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-black uppercase italic">Start Your Frequency</h3>
                       <p className="text-gray-400 font-body text-sm max-w-xs">Gather your tribe and become an official Ummy host today.</p>
                    </div>
                    <CreateRoomDialog />
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
