'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser, useUserProfile } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, Trophy, Info, Timer, User as UserIcon, Castle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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

  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];
  const others = items.slice(3);

  const getValue = (item: any) => {
    if (type === 'rich') return item.wallet?.dailySpent || 0;
    if (type === 'charm') return item.stats?.dailyFans || 0;
    if (type === 'rooms') return item.stats?.dailyGifts || 0;
    if (type === 'games') return item.stats?.dailyGameWins || 0;
    return 0;
  };

  const getDisplayName = (item: any) => {
    if (type === 'rooms') return item.name || item.title || 'Tribe Room';
    return item.username || 'Ummy User';
  };

  const getDisplayImage = (item: any) => {
    if (type === 'rooms') return item.coverUrl || '';
    return item.avatarUrl || '';
  };

  const getProfileLink = (id: string) => type === 'rooms' ? `/rooms/${id}` : `/profile/${id}`;

  return (
    <div className="space-y-4 animate-in fade-in duration-1000 relative pb-32">
      <div className="relative pt-10 pb-6 flex flex-col items-center">
        {top1 && (
          <Link href={getProfileLink(top1.id)} className="relative z-20 flex flex-col items-center mb-8 group active:scale-95 transition-transform">
             <div className="relative">
                <div className="absolute inset-0 scale-[2.2] z-0 opacity-80 pointer-events-none">
                   <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                      <path d="M100 50 C 60 0, 20 20, 0 80 C 30 70, 60 80, 100 50 Z" fill="url(#goldGradient)" />
                      <path d="M100 50 C 140 0, 180 20, 200 80 C 170 70, 140 80, 100 50 Z" fill="url(#goldGradient)" />
                      <defs>
                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B4513" />
                          <stop offset="50%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#B8860B" />
                        </linearGradient>
                      </defs>
                   </svg>
                </div>
                <div className="relative z-10">
                   <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 h-12 w-12 text-yellow-400 drop-shadow-2xl animate-bounce" />
                   <Avatar className="h-32 w-32 border-[6px] border-yellow-500 shadow-[0_0_40px_rgba(255,215,0,0.6)]">
                      <AvatarImage src={getDisplayImage(top1)} />
                      <AvatarFallback className="bg-black text-4xl">{type === 'rooms' ? <Castle className="h-12 w-12" /> : <UserIcon className="h-12 w-12" />}</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-300 to-yellow-600 text-black px-6 py-1 rounded-full font-black text-xs italic shadow-xl ring-4 ring-black">TOP 1</div>
                </div>
             </div>
             <div className="mt-8 text-center space-y-1">
                <h2 className="text-xl font-black text-cyan-400 uppercase italic tracking-tighter drop-shadow-md">{getDisplayName(top1)}</h2>
                <div className="flex items-center justify-center gap-1">
                   <span className="text-lg font-black text-yellow-500 italic">{(getValue(top1)).toLocaleString()}</span>
                   <GoldCoinIcon className="h-4 w-4" />
                </div>
             </div>
          </Link>
        )}

        <div className="flex items-end justify-center gap-4 w-full max-w-md px-4">
           {top2 && (
             <Link href={getProfileLink(top2.id)} className="flex-1 bg-gradient-to-b from-blue-900/40 to-black/60 rounded-[2.5rem] border-2 border-blue-500/30 p-6 flex flex-col items-center gap-3 shadow-xl backdrop-blur-md active:scale-95 transition-transform">
                <div className="relative">
                   <Avatar className="h-20 w-20 border-4 border-blue-400/50">
                      <AvatarImage src={getDisplayImage(top2)} />
                      <AvatarFallback className="bg-black">{type === 'rooms' ? <Castle className="h-8 w-8" /> : <UserIcon className="h-8 w-8" />}</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white h-6 w-6 rounded-full flex items-center justify-center font-black text-xs italic shadow-lg ring-2 ring-black">2</div>
                </div>
                <div className="text-center space-y-1">
                   <p className="font-black text-sm text-pink-300 uppercase italic truncate w-32">{getDisplayName(top2)}</p>
                   <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-black text-yellow-500">{(getValue(top2)).toLocaleString()}</span>
                      <GoldCoinIcon className="h-3 w-3" />
                   </div>
                </div>
             </Link>
           )}
           {top3 && (
             <Link href={getProfileLink(top3.id)} className="flex-1 bg-gradient-to-b from-amber-900/40 to-black/60 rounded-[2.5rem] border-2 border-amber-500/30 p-6 flex flex-col items-center gap-3 shadow-xl backdrop-blur-md active:scale-95 transition-transform">
                <div className="relative">
                   <Avatar className="h-20 w-20 border-4 border-amber-400/50">
                      <AvatarImage src={getDisplayImage(top3)} />
                      <AvatarFallback className="bg-black">{type === 'rooms' ? <Castle className="h-8 w-8" /> : <UserIcon className="h-8 w-8" />}</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white h-6 w-6 rounded-full flex items-center justify-center font-black text-xs italic shadow-lg ring-2 ring-black">3</div>
                </div>
                <div className="text-center space-y-1">
                   <p className="font-black text-sm text-white uppercase italic truncate w-32">{getDisplayName(top3)}</p>
                   <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-black text-yellow-500">{(getValue(top3)).toLocaleString()}</span>
                      <GoldCoinIcon className="h-3 w-3" />
                   </div>
                </div>
             </Link>
           )}
        </div>
      </div>

      <div className="rounded-t-[3.5rem] bg-gradient-to-b from-[#151515] to-black border-t border-white/5 shadow-2xl overflow-hidden mt-8">
        <CardContent className="p-0">
          {others.map((item, index) => (
            <Link key={item.id} href={getProfileLink(item.id)} className="flex items-center gap-4 p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
              <span className="w-8 text-center font-black text-white/20 italic">{index + 4}</span>
              <Avatar className="h-14 w-14 border-2 border-white/10">
                <AvatarImage src={getDisplayImage(item)} />
                <AvatarFallback>{type === 'rooms' ? <Castle className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-black text-sm uppercase text-white/90 truncate italic tracking-tighter">{getDisplayName(item)}</p>
                <Badge variant="outline" className="text-[8px] border-yellow-500/20 text-yellow-500/60 font-black h-4 mt-1">
                  {type === 'rooms' ? (item.category || 'Tribe') : `Lv.${(item.level?.rich || 1)}`}
                </Badge>
              </div>
              <div className="text-right flex items-center gap-1">
                <span className={cn("font-black text-sm", 
                  type === 'rich' ? "text-yellow-500" : 
                  type === 'charm' ? "text-pink-500" : 
                  type === 'games' ? "text-cyan-400" :
                  "text-blue-400")}>
                  {getValue(item).toLocaleString()}
                </span>
                <GoldCoinIcon className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </CardContent>
      </div>
    </div>
  );
};

const RewardItem = ({ rank, amount, color, emoji }: { rank: string, amount: string, color: string, emoji: string }) => (
  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center font-black text-lg", color)}>
        {emoji}
      </div>
      <div>
        <p className="font-bold text-xs uppercase tracking-widest text-white/40">{rank}</p>
        <p className="font-black text-sm uppercase italic text-white">Daily Prize</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <GoldCoinIcon className="h-5 w-5" />
      <span className="font-black text-xl text-primary italic">{amount}</span>
    </div>
  </div>
);

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as any) || 'rich';
  
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>(initialType);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (initialType) setRankingMode(initialType);
  }, [initialType]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      let target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 30, 0));
      if (now.getTime() >= target.getTime()) {
        target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 18, 30, 0));
      }
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
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
    return query(collection(firestore, 'users'), orderBy('stats.dailyFans', 'desc'), limit(50));
  }, [firestore, user]);

  const gamesUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('stats.dailyGameWins', 'desc'), limit(50));
  }, [firestore, user]);

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), orderBy('stats.dailyGifts', 'desc'), limit(50));
  }, [firestore, user]);

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richUsersQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmUsersQuery);
  const { data: gamesUsers, isLoading: isLoadingGames } = useCollection(gamesUsersQuery);
  const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);

  const activeItems = rankingType === 'rich' ? richUsers : rankingType === 'charm' ? charmUsers : rankingType === 'games' ? gamesUsers : rankedRooms;
  const isActiveLoading = rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : rankingType === 'games' ? isLoadingGames : isLoadingRooms;

  return (
    <div className="min-h-screen bg-black text-white relative font-headline overflow-x-hidden">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-black/40 to-black" />
        </div>

        <header className="relative z-10 p-6 pt-10">
          <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar pb-2">
             <Link href="/rooms" className="text-yellow-500 hover:scale-110 transition-transform shrink-0"><ChevronLeft className="h-8 w-8" /></Link>
             <div className="flex gap-6 px-4">
                <button onClick={() => setRankingMode('rich')} className={cn("text-lg font-black uppercase italic tracking-tighter pb-1 border-b-2 transition-all", rankingType === 'rich' ? "text-yellow-500 border-yellow-500" : "text-white/40 border-transparent")}>Rich</button>
                <button onClick={() => setRankingMode('charm')} className={cn("text-lg font-black uppercase italic tracking-tighter pb-1 border-b-2 transition-all", rankingType === 'charm' ? "text-yellow-500 border-yellow-500" : "text-white/40 border-transparent")}>Charm</button>
                <button onClick={() => setRankingMode('games')} className={cn("text-lg font-black uppercase italic tracking-tighter pb-1 border-b-2 transition-all", rankingType === 'games' ? "text-yellow-500 border-yellow-500" : "text-white/40 border-transparent")}>Game</button>
                <button onClick={() => setRankingMode('rooms')} className={cn("text-lg font-black uppercase italic tracking-tighter pb-1 border-b-2 transition-all", rankingType === 'rooms' ? "text-yellow-500 border-yellow-500" : "text-white/40 border-transparent")}>Room</button>
             </div>
             <Dialog>
                <DialogTrigger asChild>
                   <button className="bg-yellow-500/20 p-1 rounded-full border border-yellow-500/40 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.3)] shrink-0">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                   </button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-none rounded-t-[3rem] text-white p-0 overflow-hidden h-[85vh] sm:max-w-md animate-in slide-in-from-bottom-full duration-500">
                  <DialogHeader className="p-8 pb-4 text-center">
                    <DialogTitle className="text-3xl font-black uppercase italic flex items-center justify-center gap-3">
                      <Trophy className="h-8 w-8 text-yellow-400" />
                      Daily Rewards
                    </DialogTitle>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mt-2">Daily IST Throne Distribution</p>
                  </DialogHeader>
                  <div className="px-8 pb-12 space-y-4 h-full overflow-y-auto no-scrollbar">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3 mb-4">
                      <Timer className="h-4 w-4 text-primary" />
                      <p className="text-[10px] font-bold text-primary/80 uppercase">Next IST Reset in {timeLeft}</p>
                    </div>
                    
                    <RewardItem emoji="🥇" rank="Top 1" amount="10,000" color="bg-yellow-500/20" />
                    <RewardItem emoji="🥈" rank="Top 2" amount="8,000" color="bg-slate-300/20" />
                    <RewardItem emoji="🥉" rank="Top 3" amount="5,000" color="bg-amber-700/20" />
                    <RewardItem emoji="🏅" rank="Top 4" amount="3,000" color="bg-slate-800/20" />
                    <RewardItem emoji="🎗" rank="Top 5-10" amount="1,000" color="bg-slate-900/20 border border-white/5" />

                    <div className="pt-6 border-t border-white/5 space-y-3 pb-20">
                      <div className="flex items-center gap-2">
                        <Info className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rules of the Daily Throne</p>
                      </div>
                      <ul className="space-y-2">
                        <li className="text-[10px] text-white/40 leading-relaxed">• Rewards apply to all categories.</li>
                        <li className="text-[10px] text-white/40 leading-relaxed">• Dispatched daily at 12:00 AM IST (GMT+5:30).</li>
                        <li className="text-[10px] text-white/40 leading-relaxed">• Game wins reset instantly upon delivery.</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
             </Dialog>
          </div>

          <div className="flex items-center justify-between gap-2 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
             <button onClick={() => setTimePeriod('daily')} className={cn("flex-1 py-2 rounded-full font-black uppercase text-[10px] italic transition-all", timePeriod === 'daily' ? "bg-gradient-to-b from-yellow-100 to-yellow-500 text-black" : "text-white/40")}>Daily</button>
             <button onClick={() => setTimePeriod('weekly')} className={cn("flex-1 py-2 rounded-full font-black uppercase text-[10px] italic transition-all", timePeriod === 'weekly' ? "bg-gradient-to-b from-yellow-100 to-yellow-500 text-black" : "text-white/40")}>Weekly</button>
             <button onClick={() => setTimePeriod('monthly')} className={cn("flex-1 py-2 rounded-full font-black uppercase text-[10px] italic transition-all", timePeriod === 'monthly' ? "bg-gradient-to-b from-yellow-100 to-yellow-500 text-black" : "text-white/40")}>Monthly</button>
             <button className="px-4 py-2 font-black uppercase text-[8px] text-yellow-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> IST Today</button>
          </div>
        </header>

        <div className="relative z-10 px-4">
           <RankingList 
             items={activeItems} 
             type={rankingType} 
             isLoading={isActiveLoading} 
           />
        </div>

        <div className="relative z-10 w-full py-2 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent border-y border-yellow-500/10 flex justify-center items-center gap-2 mb-4">
           <Timer className="h-4 w-4 text-yellow-500" />
           <span className="text-xs font-mono font-bold text-yellow-500 tracking-widest">{timeLeft} (IST)</span>
        </div>
      </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AppLayout hideSidebarOnMobile>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><Loader className="animate-spin text-primary" /></div>}>
        <LeaderboardContent />
      </Suspense>
    </AppLayout>
  );
}
