
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Search, Loader, Flame, Crown, Heart, Users, Home, Plus, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

/**
 * High-Fidelity Discovery Hub.
 * Features real-time presence-based visibility and dedicated "Mine" command center.
 */
export default function RoomsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('All');
  const [navTab, setNavTab] = useState<'chatroom' | 'mine'>('chatroom');
  const [api, setApi] = useState<CarouselApi>();

  // Auto-scroll logic: 5-second frequency
  useEffect(() => {
    if (!api) return;

    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [api]);

  // Fetch rooms: Only show rooms with at least 1 active participant for Chatroom tab
  const roomsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      where('participantCount', '>', 0),
      orderBy('participantCount', 'desc'),
      limit(50)
    );
  }, [firestore, isUserLoading, user]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(roomsQuery);

  // Fetch My Room: Always show owner's room in Mine tab, even if empty
  const myRoomQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid), limit(1));
  }, [firestore, user]);

  const { data: myRoomData } = useCollection(myRoomQuery);
  const myRoomId = myRoomData?.[0]?.id;

  // Fetch Top Users for Ranking Cards
  const topRichQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('wallet.dailySpent', 'desc'), limit(3));
  }, [firestore]);
  const { data: topRich } = useCollection(topRichQuery);

  const topCharmQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('stats.dailyFans', 'desc'), limit(3));
  }, [firestore]);
  const { data: topCharm } = useCollection(topCharmQuery);

  const topRoomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'chatRooms'), orderBy('stats.dailyGifts', 'desc'), limit(3));
  }, [firestore]);
  const { data: topRoomsRanking } = useCollection(topRoomsQuery);

  const filteredRooms = useMemo(() => {
    if (navTab === 'mine') {
      return myRoomData || [];
    }
    
    if (!roomsData) return [];
    let rooms = [...roomsData];
    
    if (activeTab !== 'All') {
      if (activeTab === 'Hot') return rooms.slice(0, 10);
      if (activeTab === 'New') return rooms.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 5);
    }
    return rooms;
  }, [roomsData, myRoomData, activeTab, navTab, user]);

  const RankingCard = ({ title, color, items, icon: Icon, type }: any) => (
    <Link 
      href={`/leaderboard?type=${type}`} 
      className={cn(
        "relative flex-1 rounded-2xl p-3 h-28 overflow-hidden border border-white/10 shadow-lg block transition-transform active:scale-95 hover:scale-[1.02]", 
        color
      )}
    >
       <div className="flex justify-between items-center mb-2">
          <span className="text-white font-black text-[10px] uppercase italic">{title}</span>
          <Icon className="h-3 w-3 text-white/40" />
       </div>
       <div className="flex justify-center items-end gap-1 mt-2">
          {items?.[1] && <Avatar className="h-8 w-8 border-2 border-slate-300/50"><AvatarImage src={items[1].avatarUrl || items[1].coverUrl} /><AvatarFallback>2</AvatarFallback></Avatar>}
          {items?.[0] && <Avatar className="h-10 w-10 border-2 border-yellow-400 shadow-[0_0_10px_rgba(255,214,0,0.5)] -mt-2"><AvatarImage src={items[0].avatarUrl || items[0].coverUrl} /><AvatarFallback>1</AvatarFallback></Avatar>}
          {items?.[2] && <Avatar className="h-8 w-8 border-2 border-amber-700/50"><AvatarImage src={items[2].avatarUrl || items[2].coverUrl} /><AvatarFallback>3</AvatarFallback></Avatar>}
       </div>
       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </Link>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        {/* Top Specific Navigation */}
        <header className="px-4 pt-10 pb-4 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setNavTab('chatroom')}
                className={cn("text-2xl font-black transition-all", navTab === 'chatroom' ? "text-gray-900" : "text-gray-300")}
              >
                Chatroom
              </button>
              <button 
                onClick={() => setNavTab('mine')}
                className={cn("text-2xl font-black transition-all", navTab === 'mine' ? "text-gray-900" : "text-gray-300")}
              >
                Mine
              </button>
            </div>
            <div className="flex items-center gap-4">
               <button className="p-1 hover:scale-110 active:scale-90 transition-all">
                  <Search className="h-6 w-6 text-gray-800" />
               </button>
               {myRoomId ? (
                 <Link href={`/rooms/${myRoomId}`} className="p-1 hover:scale-110 active:scale-90 transition-all">
                    <Home className="h-6 w-6 text-gray-800" />
                 </Link>
               ) : (
                 <button 
                   onClick={() => toast({ title: "No Frequency Found", description: "You need to launch a room in the 'Mine' tab first." })}
                   className="p-1 opacity-20 hover:scale-110 active:scale-90 transition-all"
                 >
                    <Home className="h-6 w-6 text-gray-800" />
                 </button>
               )}
            </div>
          </div>
        </header>

        <div className="px-4 space-y-6">
          {/* Main Contest Banner - Auto-Scrolling every 5 seconds */}
          <div className="w-full overflow-hidden rounded-[2rem] shadow-xl">
            <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
              <CarouselContent>
                {[1, 2, 3].map((i) => (
                  <CarouselItem key={i}>
                    <div className="relative aspect-[16/7] rounded-[2rem] overflow-hidden">
                      <Image
                        src={`https://picsum.photos/seed/rising-host-${i}/800/400`}
                        alt="Rising Host Contest"
                        fill
                        className="object-cover"
                        data-ai-hint="stage microphone"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent flex flex-col justify-center px-8">
                         <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">Rising Host<br/><span className="text-yellow-400">Contest</span></h2>
                         <div className="flex gap-1 mt-2">
                            {Array.from({length: 8}).map((_, dot) => (
                              <div key={dot} className={cn("h-1 w-1 rounded-full bg-white/40", dot === 0 && "bg-white w-3")} />
                            ))}
                         </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Ranking Triplets */}
          <div className="flex gap-2">
             <RankingCard title="Rich" color="bg-gradient-to-br from-[#b88a44] to-[#63441a]" items={topRich} icon={Crown} type="rich" />
             <RankingCard title="Charm" color="bg-gradient-to-br from-[#9e1b32] to-[#4a0a16]" items={topCharm} icon={Heart} type="charm" />
             <RankingCard title="Room" color="bg-gradient-to-br from-[#2d5a27] to-[#143311]" items={topRoomsRanking} icon={Users} type="rooms" />
          </div>

          {/* Category Pills (Only shown in Chatroom tab) */}
          {navTab === 'chatroom' && (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setActiveTab('All')}
                className={cn(
                  "flex items-center gap-2 px-6 h-10 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-md",
                  activeTab === 'All' ? "bg-gradient-to-r from-[#ffe082] to-[#ffca28] text-gray-900 border-2 border-white" : "bg-gray-100 text-gray-400"
                )}
              >
                <div className="bg-white/40 p-0.5 rounded-full"><Star className="h-3 w-3 fill-yellow-600 text-yellow-600" /></div>
                All
              </button>
              <button
                onClick={() => setActiveTab('Hot')}
                className={cn(
                  "px-8 h-10 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === 'Hot' ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400"
                )}
              >
                Hot
              </button>
              <button
                onClick={() => setActiveTab('New')}
                className={cn(
                  "px-8 h-10 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === 'New' ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400"
                )}
              >
                New
              </button>
            </div>
          )}

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
                  <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center">
                     <Plus className="h-8 w-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-black uppercase text-xs">
                    {navTab === 'mine' ? 'Launch your own frequency' : 'No Frequencies Active'}
                  </p>
                  {navTab === 'mine' && <CreateRoomDialog />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
