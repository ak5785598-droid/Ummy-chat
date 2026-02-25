'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, Star, ChevronLeft, Gift, Zap, Timer, Trophy, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { GoldCoinIcon } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const RankingList = ({ items, type, isLoading }: any) => {
  if (isLoading) return <div className="flex flex-col items-center py-40 gap-4"><Loader className="animate-spin text-primary" /><p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Ascending the Throne...</p></div>;
  if (!items || items.length === 0) return <div className="text-center py-40 opacity-40 italic"><TrendingUp className="mx-auto mb-4" /> The chronicles are empty.</div>;

  const top3 = items.slice(0, 3);
  const others = items.slice(3);

  const getValue = (item: any) => {
    if (type === 'rich') return item.wallet?.dailySpent || 0;
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

const RewardItem = ({ rank, amount, color }: { rank: string, amount: string, color: string }) => (
  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs italic", color)}>
        {rank}
      </div>
      <p className="font-bold text-sm uppercase italic text-white/80">Daily Prize</p>
    </div>
    <div className="flex items-center gap-2">
      <GoldCoinIcon className="h-5 w-5" />
      <span className="font-black text-lg text-primary italic">{amount}</span>
    </div>
  </div>
);

export default function LeaderboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms'>('rich');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const reset = new Date();
      reset.setUTCHours(24, 0, 0, 0);
      const diff = reset.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    const timer = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(timer);
  }, []);

  const richUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('wallet.dailySpent', 'desc'), limit(50));
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
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-primary/20 transition-all border border-primary/20 animate-pulse">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-none rounded-t-[3rem] text-white p-0 overflow-hidden sm:max-w-md animate-in slide-in-from-bottom-10 duration-500">
                <DialogHeader className="p-8 pb-4 text-center">
                  <DialogTitle className="text-3xl font-black uppercase italic flex items-center justify-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-400" />
                    Rich Rewards
                  </DialogTitle>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mt-2">Daily Throne Distribution</p>
                </DialogHeader>
                <div className="px-8 pb-12 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3 mb-4">
                    <Timer className="h-4 w-4 text-primary" />
                    <p className="text-[10px] font-bold text-primary/80 uppercase">Cycle Resets in {timeLeft}</p>
                  </div>
                  
                  <RewardItem rank="Top 1" amount="10,000" color="bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                  <RewardItem rank="Top 2" amount="8,000" color="bg-slate-300 text-black" />
                  <RewardItem rank="Top 3" amount="5,000" color="bg-amber-700 text-white" />
                  <RewardItem rank="Top 4" amount="3,000" color="bg-slate-800 text-white" />
                  <RewardItem rank="Top 5-10" amount="1,000" color="bg-slate-900 text-white border border-white/10" />

                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rules of the Throne</p>
                    </div>
                    <ul className="space-y-2">
                      <li className="text-[10px] text-white/40 leading-relaxed">• Ranking is based on your total daily spending across all room frequencies.</li>
                      <li className="text-[10px] text-white/40 leading-relaxed">• Rewards are automatically dispatched to your vault at 12:00 AM UTC daily.</li>
                      <li className="text-[10px] text-white/40 leading-relaxed">• The leaderboard resets instantly upon reward delivery for the next 24-hour cycle.</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="bg-white/10 p-2 rounded-full backdrop-blur-md"><Star className="h-6 w-6 text-yellow-400" /></div>
          </div>
        </header>

        {rankingType === 'rich' && (
          <div className="px-6 mb-6">
             <Card className="bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500/20 rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-2">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-yellow-400 font-black uppercase italic text-xs">
                         <Zap className="h-4 w-4" /> Daily Rich Rewards
                      </div>
                      <div className="flex items-center gap-1.5 text-white/40 font-mono text-[10px]">
                         <Timer className="h-3 w-3" /> {timeLeft}
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="space-y-3">
                   <p className="text-[10px] text-white/60 font-medium">Top spenders at 12AM UTC receive exclusive coin batches:</p>
                   <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                         <p className="text-[8px] font-black uppercase text-yellow-500">Top 1</p>
                         <p className="text-xs font-black">10K <GoldCoinIcon className="h-2 w-2 inline" /></p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                         <p className="text-[8px] font-black uppercase text-slate-300">Top 2</p>
                         <p className="text-xs font-black">8K <GoldCoinIcon className="h-2 w-2 inline" /></p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                         <p className="text-[8px] font-black uppercase text-amber-700">Top 3</p>
                         <p className="text-xs font-black">5K <GoldCoinIcon className="h-2 w-2 inline" /></p>
                      </div>
                   </div>
                   <div className="flex justify-between items-center px-2 pt-1 border-t border-white/5">
                      <span className="text-[8px] font-black text-white/40 uppercase">Top 4: 3,000</span>
                      <span className="text-[8px] font-black text-white/40 uppercase">Top 5-10: 1,000</span>
                   </div>
                </CardContent>
             </Card>
          </div>
        )}

        <div className="px-6 space-y-8">
           <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-2">
             <button onClick={() => setRankingMode('rich')} className={cn("px-6 py-2 rounded-xl font-black uppercase italic transition-all shrink-0", rankingType === 'rich' ? "bg-gradient-to-b from-yellow-100 to-yellow-500 text-black border-b-4 border-yellow-700" : "bg-white/5 text-white/40")}>Daily Rich</button>
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
