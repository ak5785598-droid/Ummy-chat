
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Trophy, Crown, TrendingUp, Heart, Loader, Gem, Star, ShieldCheck, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Global Ranking Page - Redesigned to match Premium Graphic Design
 */
export default function LeaderboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const richUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users'), 
      orderBy('wallet.totalSpent', 'desc'), 
      limit(50)
    );
  }, [firestore, user]);

  const charmUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users'), 
      orderBy('stats.followers', 'desc'), 
      limit(50)
    );
  }, [firestore, user]);

  const topRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), limit(50));
  }, [firestore, user]);

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richUsersQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmUsersQuery);
  const { data: rooms, isLoading: isLoadingRooms } = useCollection(topRoomsQuery);

  const RankingList = ({ items, type, isLoading }: { items: any[] | null, type: 'rich' | 'charm' | 'room', isLoading: boolean }) => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Ascending the Throne...</p>
      </div>
    );

    if (!items || items.length === 0) return (
      <div className="text-center py-40 space-y-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary/5">
          <TrendingUp className="h-10 w-10 text-muted-foreground/20" />
        </div>
        <p className="text-muted-foreground/40 font-body text-lg italic max-w-xs mx-auto">The chronicles are empty. Be the first to claim glory.</p>
      </div>
    );

    const top3 = items.slice(0, 3);
    const others = items.slice(3);

    return (
      <div className="space-y-4 animate-in fade-in duration-1000">
        {/* Ornate Podium Section */}
        <div className="flex justify-center items-end gap-2 md:gap-4 py-16 relative">
          
          {/* TOP 2 - Silver */}
          {top3[1] && (
            <div className="flex flex-col items-center order-1 relative z-10 w-1/3">
              <div className="relative mb-6">
                <div className="absolute -inset-2 bg-gradient-to-b from-slate-400 to-slate-100 rounded-full blur-sm opacity-50" />
                <div className="relative p-1 bg-gradient-to-b from-slate-200 to-slate-400 rounded-full">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-slate-900 shadow-2xl">
                    <AvatarImage src={type === 'room' ? `https://picsum.photos/seed/${top3[1].id}/200` : top3[1].avatarUrl} />
                    <AvatarFallback>{(top3[1].username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Crown className="text-slate-300 h-8 w-8 drop-shadow-lg" />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-0.5 rounded-sm border border-white/20 shadow-lg">
                    TOP 2
                  </div>
                </div>
              </div>
              <p className="font-black text-xs uppercase text-slate-300 truncate max-w-full italic">{top3[1].username || top3[1].name}</p>
              <div className="flex flex-col items-center mt-2 gap-1">
                <div className="flex items-center gap-1 bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full text-[8px] font-black border border-purple-400/20">
                  <Star className="h-2 w-2 fill-current" /> SVIP 2
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                   <div className="h-3 w-3 rounded-full bg-yellow-500 border border-white/20 shadow-sm" />
                   {(type === 'rich' ? (top3[1].wallet?.totalSpent || 0) : (top3[1].stats?.followers || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          {/* TOP 1 - Gold */}
          {top3[0] && (
            <div className="flex flex-col items-center order-2 scale-125 relative z-20 w-1/3 -mt-10">
              <div className="relative mb-8">
                <div className="absolute -inset-4 bg-gradient-to-b from-yellow-500 to-amber-700 rounded-full blur-xl opacity-30 animate-pulse" />
                <div className="relative p-1.5 bg-gradient-to-b from-yellow-300 via-yellow-500 to-amber-700 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                  <Avatar className="h-24 w-24 md:h-28 md:w-28 border-2 border-slate-900 shadow-2xl">
                    <AvatarImage src={type === 'room' ? `https://picsum.photos/seed/${top3[0].id}/200` : top3[0].avatarUrl} />
                    <AvatarFallback>{(top3[0].username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                    <Crown className="text-yellow-400 h-10 w-10 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-bounce" />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-1 rounded-sm border-2 border-yellow-200/40 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    TOP 1
                  </div>
                </div>
              </div>
              <h2 className="font-black text-sm uppercase text-yellow-400 tracking-tighter drop-shadow-md italic">{top3[0].username || top3[0].name}</h2>
              <div className="flex flex-col items-center mt-3 gap-1">
                <div className="flex items-center gap-1 bg-blue-600/20 text-blue-400 px-3 py-0.5 rounded-full text-[8px] font-black border border-blue-400/20">
                  <Star className="h-2.5 w-2.5 fill-current" /> SVIP 3
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]">
                   <div className="h-4 w-4 rounded-full bg-yellow-500 border-2 border-white/40 shadow-md" />
                   {(type === 'rich' ? (top3[0].wallet?.totalSpent || 0) : (top3[0].stats?.followers || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* TOP 3 - Bronze */}
          {top3[2] && (
            <div className="flex flex-col items-center order-3 relative z-10 w-1/3">
              <div className="relative mb-6">
                <div className="absolute -inset-2 bg-gradient-to-b from-amber-800 to-amber-900 rounded-full blur-sm opacity-50" />
                <div className="relative p-1 bg-gradient-to-b from-amber-600 to-amber-900 rounded-full">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-slate-900 shadow-2xl">
                    <AvatarImage src={type === 'room' ? `https://picsum.photos/seed/${top3[2].id}/200` : top3[2].avatarUrl} />
                    <AvatarFallback>{(top3[2].username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Crown className="text-amber-700 h-8 w-8 drop-shadow-lg" />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-800 to-amber-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-0.5 rounded-sm border border-white/20 shadow-lg">
                    TOP 3
                  </div>
                </div>
              </div>
              <p className="font-black text-xs uppercase text-amber-700 truncate max-w-full italic">{top3[2].username || top3[2].name}</p>
              <div className="flex flex-col items-center mt-2 gap-1">
                <div className="flex items-center gap-1 bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full text-[8px] font-black border border-green-400/20">
                  <Star className="h-2 w-2 fill-current" /> SVIP 1
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                   <div className="h-3 w-3 rounded-full bg-yellow-500 border border-white/20 shadow-sm" />
                   {(type === 'rich' ? (top3[2].wallet?.totalSpent || 0) : (top3[2].stats?.followers || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rank 4-50 Luxury List */}
        <div className="rounded-t-[3rem] bg-gradient-to-b from-[#111] to-black border-t border-yellow-500/10 shadow-2xl overflow-hidden mt-8">
          <CardContent className="p-0">
            {others.map((item, index) => (
              <div 
                key={item.id} 
                className="flex items-center gap-4 p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all group"
              >
                <span className="w-8 text-center font-black text-white/20 italic group-hover:text-yellow-500 transition-colors">{index + 4}</span>
                <Avatar className="h-14 w-14 border-2 border-white/10 p-0.5">
                   <AvatarImage 
                     src={type === 'room' ? `https://picsum.photos/seed/${item.id}/200` : item.avatarUrl} 
                   />
                  <AvatarFallback className="font-bold">{(item.username || item.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm uppercase text-white/90 truncate italic">{item.username || item.name}</p>
                    <div className="flex items-center gap-1 bg-purple-600/30 text-purple-300 px-1.5 py-0 rounded-sm text-[7px] font-black border border-purple-500/10">
                       SVIP 2
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[7px] border-yellow-500/20 text-yellow-500/60 font-black h-4 rounded-sm">Lv.{(type === 'rich' ? item.level?.rich : item.level?.charm) || 1}</Badge>
                    <span className="text-[8px] text-white/20 font-mono">ID:{item.id.substring(0, 6)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                   <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 font-black text-sm text-yellow-500">
                        {(type === 'rich' ? (item.wallet?.totalSpent || 0) : (item.stats?.followers || 0)).toLocaleString()}
                        <div className="h-4 w-4 rounded-full bg-yellow-500 border border-white/20 shadow-sm" />
                      </div>
                   </div>
                </div>
              </div>
            ))}
            
            {/* User Personal Sticky Rank Bar (Hallucinated placeholder for self) */}
            <div className="sticky bottom-0 bg-gradient-to-r from-amber-700 to-amber-900 p-4 flex items-center justify-between border-t border-white/20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-4">
                  <span className="font-black text-white italic">100+</span>
                  <Avatar className="h-12 w-12 border-2 border-white/20">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-black text-sm uppercase text-white italic">{user?.displayName || 'king'}</p>
                    <Badge className="bg-amber-100/20 text-white border-none text-[8px] h-4">Lv.3</Badge>
                  </div>
               </div>
               <div className="flex items-center gap-1 text-white font-black">
                  0 <div className="h-4 w-4 rounded-full bg-yellow-500 border border-white/20" />
               </div>
            </div>
          </CardContent>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black text-white overflow-hidden pb-10">
        <header className="relative p-6 pt-10 flex items-center justify-between">
          <Link href="/rooms" className="bg-white/10 p-2 rounded-full backdrop-blur-md">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-headline text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
            Ranking
          </h1>
          <div className="bg-white/10 p-2 rounded-full backdrop-blur-md">
             <Star className="h-6 w-6 text-yellow-400" />
          </div>
        </header>

        <div className="px-6 space-y-8">
           <div className="flex justify-center">
             <button className="bg-gradient-to-b from-yellow-100 to-yellow-500 text-black px-10 py-2 rounded-xl font-black uppercase italic shadow-[0_0_20px_rgba(234,179,8,0.4)] border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all">
                Honor
             </button>
           </div>

           <Tabs defaultValue="rich" className="w-full">
            <TabsList className="flex justify-around w-full bg-transparent border-b border-white/5 h-12 mb-8 rounded-none p-0">
              <TabsTrigger 
                value="daily" 
                className="flex-1 rounded-none text-xs font-black uppercase text-white/40 data-[state=active]:text-yellow-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 transition-all"
              >
                Daily
              </TabsTrigger>
              <TabsTrigger 
                value="rich" 
                className="flex-1 rounded-none text-xs font-black uppercase text-white/40 data-[state=active]:text-yellow-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 transition-all"
              >
                Weekly
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="flex-1 rounded-none text-xs font-black uppercase text-white/40 data-[state=active]:text-yellow-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 transition-all"
              >
                Monthly
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="m-0"><RankingList items={richUsers} type="rich" isLoading={isLoadingRich} /></TabsContent>
            <TabsContent value="rich" className="m-0"><RankingList items={richUsers} type="rich" isLoading={isLoadingRich} /></TabsContent>
            <TabsContent value="monthly" className="m-0"><RankingList items={richUsers} type="rich" isLoading={isLoadingRich} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
