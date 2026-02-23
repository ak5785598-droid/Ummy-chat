'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, Star, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const RankingList = ({ items, type, isLoading }: any) => {
  if (isLoading) return <div className="flex flex-col items-center py-40 gap-4"><Loader className="animate-spin text-primary" /><p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Ascending the Throne...</p></div>;
  if (!items || items.length === 0) return <div className="text-center py-40 opacity-40 italic"><TrendingUp className="mx-auto mb-4" /> The chronicles are empty.</div>;

  const top3 = items.slice(0, 3);
  const others = items.slice(3);

  const getValue = (item: any) => {
    if (type === 'rich') return item.wallet?.totalSpent || 0;
    if (type === 'charm') return item.stats?.fans || 0;
    return item.stats?.totalGifts || 0;
  };

  const getDisplayName = (item: any) => {
    if (type === 'rooms') return item.name || item.title || 'Tribe Room';
    return item.username || 'Ummy User';
  };

  const getDisplayImage = (item: any) => {
    if (type === 'rooms') return item.coverUrl || `https://picsum.photos/seed/${item.id}/400`;
    return item.avatarUrl || `https://picsum.photos/seed/${item.id}/200`;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-1000">
      <div className="flex justify-center items-end gap-4 py-16 relative">
        {top3[1] && (
          <div className="flex flex-col items-center order-1 w-1/3">
            <div className="relative">
               <Avatar className="h-20 w-20 border-4 border-slate-300 shadow-lg">
                 <AvatarImage src={getDisplayImage(top3[1])} />
                 <AvatarFallback>{getDisplayName(top3[1]).charAt(0)}</AvatarFallback>
               </Avatar>
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-300 text-black text-[8px] font-black px-2 py-0.5 rounded-full">2</div>
            </div>
            <p className="font-black text-[10px] mt-4 uppercase text-slate-300 truncate w-full text-center px-2 italic">{getDisplayName(top3[1])}</p>
            <div className="text-[10px] font-bold text-yellow-500">
              {getValue(top3[1]).toLocaleString()}
            </div>
          </div>
        )}
        {top3[0] && (
          <div className="flex flex-col items-center order-2 scale-125 w-1/3 -mt-10">
            <div className="relative">
              <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 h-10 w-10 animate-bounce" />
              <Avatar className="h-24 w-24 border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.6)]">
                 <AvatarImage src={getDisplayImage(top3[0])} />
                 <AvatarFallback>{getDisplayName(top3[0]).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black px-3 py-0.5 rounded-full ring-2 ring-black">1</div>
            </div>
            <h2 className="font-black text-xs mt-6 uppercase text-yellow-400 truncate w-full text-center px-2 italic">{getDisplayName(top3[0])}</h2>
            <div className="text-xs font-black text-yellow-500">
              {getValue(top3[0]).toLocaleString()}
            </div>
          </div>
        )}
        {top3[2] && (
          <div className="flex flex-col items-center order-3 w-1/3">
            <div className="relative">
               <Avatar className="h-20 w-20 border-4 border-amber-700 shadow-lg">
                 <AvatarImage src={getDisplayImage(top3[2])} />
                 <AvatarFallback>{getDisplayName(top3[2]).charAt(0)}</AvatarFallback>
               </Avatar>
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[8px] font-black px-2 py-0.5 rounded-full">3</div>
            </div>
            <p className="font-black text-[10px] mt-4 uppercase text-amber-700 truncate w-full text-center px-2 italic">{getDisplayName(top3[2])}</p>
            <div className="text-[10px] font-bold text-yellow-500">
              {getValue(top3[2]).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-t-[3.5rem] bg-gradient-to-b from-[#151515] to-black border-t border-white/5 shadow-2xl overflow-hidden mt-8">
        <CardContent className="p-0">
          {others.map((item, index) => (
            <div key={item.id} className="flex items-center gap-4 p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
              <span className="w-8 text-center font-black text-white/20 italic">{index + 4}</span>
              <Avatar className="h-14 w-14 border-2 border-white/10">
                <AvatarImage src={getDisplayImage(item)} />
                <AvatarFallback>{getDisplayName(item).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-black text-sm uppercase text-white/90 truncate italic tracking-tighter">{getDisplayName(item)}</p>
                <Badge variant="outline" className="text-[7px] border-yellow-500/20 text-yellow-500/60 font-black h-4 mt-1">
                  {type === 'rooms' ? (item.category || 'Tribe') : `Lv.${(item.level?.rich || 1)}`}
                </Badge>
              </div>
              <div className="text-right">
                <div className={cn("font-black text-sm", type === 'rich' ? "text-yellow-500" : type === 'charm' ? "text-pink-500" : "text-blue-400")}>
                  {getValue(item).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </div>
    </div>
  );
};

/**
 * Enterprise Leaderboard - Premium Podium Design.
 * Optimized performance by moving RankList subcomponent outside.
 */
export default function LeaderboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms'>('rich');

  const richUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('wallet.totalSpent', 'desc'), limit(50));
  }, [firestore, user]);

  const charmUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('stats.fans', 'desc'), limit(50));
  }, [firestore, user]);

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), orderBy('stats.totalGifts', 'desc'), limit(50));
  }, [firestore, user]);

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richUsersQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmUsersQuery);
  const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);

  return (
    <AppLayout>
      <div className="min-h-screen bg-black text-white overflow-hidden pb-10">
        <header className="relative p-6 pt-10 flex items-center justify-between">
          <Link href="/rooms" className="bg-white/10 p-2 rounded-full backdrop-blur-md"><ChevronLeft className="h-6 w-6" /></Link>
          <h1 className="font-headline text-3xl font-black italic uppercase tracking-tighter">
            {rankingType === 'rich' ? 'Wealth Ranking' : rankingType === 'charm' ? 'Charm Ranking' : 'Room Ranking'}
          </h1>
          <div className="bg-white/10 p-2 rounded-full backdrop-blur-md"><Star className="h-6 w-6 text-yellow-400" /></div>
        </header>

        <div className="px-6 space-y-8">
           <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-2">
             <button onClick={() => setRankingMode('rich')} className={cn("px-6 py-2 rounded-xl font-black uppercase italic transition-all shrink-0", rankingType === 'rich' ? "bg-gradient-to-b from-yellow-100 to-yellow-500 text-black border-b-4 border-yellow-700" : "bg-white/5 text-white/40")}>Rich</button>
             <button onClick={() => setRankingMode('charm')} className={cn("px-6 py-2 rounded-xl font-black uppercase italic transition-all shrink-0", rankingType === 'charm' ? "bg-gradient-to-b from-pink-100 to-pink-500 text-black border-b-4 border-pink-700" : "bg-white/5 text-white/40")}>Charm</button>
             <button onClick={() => setRankingMode('rooms')} className={cn("px-6 py-2 rounded-xl font-black uppercase italic transition-all shrink-0", rankingType === 'rooms' ? "bg-gradient-to-b from-blue-100 to-blue-500 text-black border-b-4 border-blue-700" : "bg-white/5 text-white/40")}>Rooms</button>
           </div>
           <RankingList 
             items={rankingType === 'rich' ? richUsers : rankingType === 'charm' ? charmUsers : rankedRooms} 
             type={rankingType} 
             isLoading={rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : isLoadingRooms} 
           />
        </div>
      </div>
    </AppLayout>
  );
}
