
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Loader, Flame, Crown, Heart, Users, Home, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { MomentsFeed } from '@/components/moments-feed';

export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
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

  // Real-time Following Sync
  const followingRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'followingRooms'), orderBy('followedAt', 'desc'));
  }, [firestore, user]);

  const { data: followingData } = useCollection(followingRoomsQuery);

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
    if (navTab === 'mine') return [];
    if (!roomsData) return [];
    let rooms = [...roomsData];
    if (activeTab !== 'All') {
      if (activeTab === 'Hot') return rooms.slice(0, 10);
      if (activeTab === 'New') return rooms.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);
    }
    return rooms;
  }, [roomsData, activeTab, navTab]);

  const mineItems = useMemo(() => {
    if (navTab !== 'mine') return [];
    const owned = myRoomData?.map(r => ({ ...r, isOwned: true })) || [];
    const followed = followingData?.map(f => ({ 
      id: f.roomId, 
      title: f.roomName, 
      coverUrl: f.coverUrl, 
      participantCount: 0, 
      isOwned: false 
    })) || [];
    return [...owned, ...followed];
  }, [myRoomData, followingData, navTab]);

  const RankingCard = ({ title, color, items, icon: Icon, type }: any) => (
    <Link 
      href={`/leaderboard?type=${type}`} 
      className={cn(
        "relative flex-1 min-w-0 rounded-2xl p-3 h-24 overflow-hidden border border-white/10 shadow-lg block transition-transform active:scale-95", 
        color
      )}
    >
       <div className="flex justify-between items-start mb-1">
          <span className="text-white font-black text-[9px] uppercase tracking-widest opacity-60">{title}</span>
          <Icon className="h-2.5 w-2.5 text-white/40" />
       </div>
       <div className="flex justify-center items-center h-10">
          <Avatar className="h-10 w-10 border-2 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
             <AvatarImage src={items?.[0]?.avatarUrl || items?.[0]?.coverUrl} />
             <AvatarFallback className="bg-black/20 text-white font-black">{items?.[0]?.username?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
       </div>
       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </Link>
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-white flex flex-col p-4 space-y-6 pb-32">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <button onClick={() => setNavTab('chatroom')} className={cn("text-xl font-black transition-all whitespace-nowrap", navTab === 'chatroom' ? "text-gray-900" : "text-gray-200")}>Chatroom</button>
            <button onClick={() => setNavTab('moments')} className={cn("text-xl font-black transition-all whitespace-nowrap", navTab === 'moments' ? "text-gray-900" : "text-gray-200")}>Moments</button>
            <button onClick={() => setNavTab('mine')} className={cn("text-xl font-black transition-all whitespace-nowrap", navTab === 'mine' ? "text-gray-900" : "text-gray-200")}>Mine</button>
          </div>
          <div className="flex items-center gap-3">
             <UserSearchDialog />
             <button className="text-gray-800 hover:scale-110 transition-transform"><Home className="h-5 w-5" /></button>
          </div>
        </header>

        {navTab === 'chatroom' && (
          <>
            <div className="w-full overflow-hidden rounded-[2rem] shadow-2xl">
              <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {[1, 2, 3].map((i) => (
                    <CarouselItem key={i}>
                      <div className="relative aspect-[16/7] rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#ffd700] via-[#ff9800] to-[#ff4081] flex flex-col justify-center px-8 border-[4px] border-white shadow-inner">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                         <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg relative z-10 leading-[0.9]">RISING HOST<br/><span className="text-black/80">CONTEST</span></h2>
                         <div className="flex gap-1 mt-4 relative z-10">
                            {Array.from({length: 8}).map((_, dot) => (
                              <div key={dot} className={cn("h-2 w-2 rounded-full bg-white/40 shadow-sm", dot === 0 && "bg-white w-5")} />
                            ))}
                         </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            <div className="flex gap-2">
               <RankingCard title="RICH" color="bg-gradient-to-br from-[#4a3a1a] to-[#2a1a0a]" items={topRich} icon={Crown} type="rich" />
               <RankingCard title="CHARM" color="bg-gradient-to-br from-[#4a0a1a] to-[#2a050a]" items={topCharm} icon={Heart} type="charm" />
               <RankingCard title="ROOM" color="bg-gradient-to-br from-[#0a2a0a] to-[#051a05]" items={topRoomsRanking} icon={Users} type="rooms" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button onClick={() => setActiveTab('All')} className={cn("flex items-center gap-2 px-6 h-9 rounded-full text-xs font-black uppercase transition-all whitespace-nowrap shadow-md", activeTab === 'All' ? "bg-[#ffd700] text-gray-900 border-2 border-white ring-2 ring-[#ffd700]/20" : "bg-gray-100 text-gray-400")}>All</button>
              <button onClick={() => setActiveTab('Hot')} className={cn("px-8 h-9 rounded-full text-xs font-black uppercase transition-all whitespace-nowrap", activeTab === 'Hot' ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400")}>Hot</button>
              <button onClick={() => setActiveTab('New')} className={cn("px-8 h-9 rounded-full text-xs font-black uppercase transition-all whitespace-nowrap", activeTab === 'New' ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400")}>New</button>
            </div>

            {isRoomsLoading ? (
              <div className="flex justify-center py-20"><Loader className="animate-spin text-primary h-8 w-8" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                {filteredRooms.map((room: any) => (
                  <ChatRoomCard key={room.id} room={room} variant="modern" />
                ))}
              </div>
            )}
          </>
        )}

        {navTab === 'moments' && <MomentsFeed />}
        {navTab === 'mine' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase">My Frequencies</h3>
                <CreateRoomDialog />
             </div>
             
             {mineItems.length > 0 ? (
               <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {mineItems.map((item: any) => (
                    <div key={item.id} className="relative">
                       <ChatRoomCard room={item} variant="modern" />
                       <Badge className={cn("absolute top-2 left-2 pointer-events-none uppercase text-[8px] font-black", item.isOwned ? "bg-yellow-500" : "bg-blue-500")}>
                          {item.isOwned ? 'Owner' : 'Following'}
                       </Badge>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300"><Flame className="h-12 w-12" /></div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase">No Connections Yet</h3>
                    <p className="text-muted-foreground font-body max-w-xs">Follow rooms or launch your own frequency to see them listed here.</p>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
