'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, Trophy, Info, Timer, User as UserIcon, Castle, HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { GoldCoinIcon } from '@/components/icons';
import { OfficialTag } from '@/components/official-tag';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AngelicWings = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 400 200" className={cn("fill-yellow-500/80 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wingGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <g className="animate-wing-flap origin-right">
      <path d="M180 150 C120 150, 20 100, 10 40 C10 20, 40 10, 80 40 C120 70, 160 120, 180 150 Z" fill="url(#wingGold)" />
      <path d="M170 140 C110 140, 40 90, 30 50 C30 35, 55 25, 90 50 C120 75, 155 115, 170 140 Z" fill="url(#wingGold)" opacity="0.7" />
    </g>
    <g className="animate-wing-flap origin-left" style={{ transform: 'scaleX(-1) translateX(-400px)' }}>
      <path d="M180 150 C120 150, 20 100, 10 40 C10 20, 40 10, 80 40 C120 70, 160 120, 180 150 Z" fill="url(#wingGold)" />
      <path d="M170 140 C110 140, 40 90, 30 50 C30 35, 55 25, 90 50 C120 75, 155 115, 170 140 Z" fill="url(#wingGold)" opacity="0.7" />
    </g>
  </svg>
);

const LionGuardian = ({ side }: { side: 'left' | 'right' }) => (
  <div className={cn(
    "absolute bottom-0 w-32 h-40 opacity-80 z-10 pointer-events-none",
    side === 'left' ? "left-0" : "right-0 scale-x-[-1]"
  )}>
    <svg viewBox="0 0 100 150" className="w-full h-full">
      <path d="M20 140 L80 140 L80 100 C80 80, 90 60, 70 40 C60 25, 40 25, 30 40 C10 60, 20 80, 20 100 Z" fill="#fbbf24" className="animate-shimmer-gold" />
      <circle cx="50" cy="45" r="20" fill="#fbbf24" opacity="0.4" className="animate-pulse" />
    </svg>
  </div>
);

const RankingList = ({ items, type, isLoading, currentUid }: any) => {
  if (isLoading) return <div className="flex flex-col items-center py-40 gap-4"><Loader className="animate-spin text-primary" /><p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Ascending the Throne...</p></div>;
  if (!items || items.length === 0) return <div className="text-center py-40 opacity-40"><TrendingUp className="mx-auto mb-4" /> The chronicles are empty.</div>;

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

  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-1000 relative pb-40">
      <div className="relative pt-10 pb-6 flex flex-col items-center min-h-[60vh]">
        <div className="absolute bottom-0 inset-x-0 h-full z-0 overflow-hidden pointer-events-none">
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-gradient-to-t from-yellow-900/40 via-transparent to-transparent flex flex-col-reverse items-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-full border-t border-yellow-500/10 h-12" style={{ width: `${100 - i * 5}%` }} />
              ))}
           </div>
           <LionGuardian side="left" />
           <LionGuardian side="right" />
        </div>

        {top1 && (
          <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="relative z-20 flex flex-col items-center mb-16 group active:scale-95 transition-transform mt-4">
             <div className="relative">
                <AngelicWings className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-40 z-0" />
                <div className="relative z-10">
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 animate-bounce">
                      <Crown className="h-14 w-14 text-yellow-400 drop-shadow-2xl fill-yellow-400" />
                   </div>
                   <div className="relative">
                      <div className="absolute -inset-2 rounded-full border-[6px] border-yellow-500/40 animate-pulse shadow-[0_0_50px_rgba(251,191,36,0.4)]" />
                      <Avatar className="h-36 w-36 border-[6px] border-yellow-500 shadow-2xl relative z-10">
                         <AvatarImage src={getDisplayImage(top1)} />
                         <AvatarFallback className="bg-black text-4xl">{type === 'rooms' ? <Castle className="h-12 w-12" /> : <UserIcon className="h-12 w-12" />}</AvatarFallback>
                      </Avatar>
                   </div>
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 text-black px-10 py-1.5 rounded-full font-black text-lg shadow-2xl ring-4 ring-[#1a1a1a] italic tracking-tighter">TOP 1</div>
                </div>
             </div>
             <div className="mt-12 text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-md">{getDisplayName(top1)}</h2>
                  <span className="text-xl">🇮🇳</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2 bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
                   <span className="text-lg font-black text-yellow-500">{formatValue(getValue(top1))}</span>
                   <GoldCoinIcon className="h-5 w-5" />
                </div>
             </div>
          </Link>
        )}

        <div className="flex items-end justify-center gap-4 w-full max-w-md px-4 relative z-20">
           {top2 && (
             <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex-1 bg-gradient-to-b from-blue-900/60 to-black/80 rounded-[2.5rem] border-2 border-blue-400/40 p-6 flex flex-col items-center gap-3 shadow-2xl backdrop-blur-xl active:scale-95 transition-transform min-h-[220px]">
                <div className="relative">
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30"><Crown className="h-8 w-8 text-blue-300 fill-blue-300 drop-shadow-lg" /></div>
                   <Avatar className="h-24 w-24 border-4 border-blue-400/50 shadow-xl">
                      <AvatarImage src={getDisplayImage(top2)} />
                      <AvatarFallback className="bg-black">U</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-black text-lg shadow-lg ring-2 ring-black">2</div>
                </div>
                <div className="text-center space-y-1 mt-2">
                   <p className="font-black text-base text-white uppercase truncate w-32 tracking-tighter">{getDisplayName(top2)}</p>
                   <div className="flex items-center justify-center gap-1 mt-2 bg-white/5 px-3 py-0.5 rounded-full border border-white/5">
                      <span className="text-xs font-black text-yellow-500">{formatValue(getValue(top2))}</span>
                      <GoldCoinIcon className="h-3.5 w-3.5" />
                   </div>
                </div>
             </Link>
           )}
           {top3 && (
             <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex-1 bg-gradient-to-b from-amber-900/60 to-black/80 rounded-[2.5rem] border-2 border-amber-400/40 p-6 flex flex-col items-center gap-3 shadow-2xl backdrop-blur-xl active:scale-95 transition-transform min-h-[220px]">
                <div className="relative">
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30"><Crown className="h-8 w-8 text-amber-300 fill-amber-300 drop-shadow-lg" /></div>
                   <Avatar className="h-24 w-24 border-4 border-amber-400/50 shadow-xl">
                      <AvatarImage src={getDisplayImage(top3)} />
                      <AvatarFallback className="bg-black">U</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-black text-lg shadow-lg ring-2 ring-black">3</div>
                </div>
                <div className="text-center space-y-1 mt-2">
                   <p className="font-black text-base text-white uppercase truncate w-32 tracking-tighter">{getDisplayName(top3)}</p>
                   <div className="flex items-center justify-center gap-1 mt-2 bg-white/5 px-3 py-0.5 rounded-full border border-white/5">
                      <span className="text-xs font-black text-yellow-500">{formatValue(getValue(top3))}</span>
                      <GoldCoinIcon className="h-3.5 w-3.5" />
                   </div>
                </div>
             </Link>
           )}
        </div>
      </div>

      <div className="rounded-t-[3.5rem] bg-gradient-to-b from-[#1a1a1a] to-black border-t border-white/10 shadow-2xl overflow-hidden mt-8">
        <CardContent className="p-0">
          {others.map((item, index) => (
            <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} className="flex items-center gap-4 p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
              <span className="w-10 text-center font-black text-white/20 text-lg">{index + 4}</span>
              <div className="relative">
                 <Avatar className="h-16 w-16 border-2 border-white/10">
                   <AvatarImage src={getDisplayImage(item)} />
                   <AvatarFallback>{type === 'rooms' ? <Castle className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}</AvatarFallback>
                 </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-base uppercase text-white/90 truncate tracking-tighter">{getDisplayName(item)}</p>
                  {item.tags?.includes('Official') && <OfficialTag size="sm" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <Badge variant="outline" className="text-[8px] border-yellow-500/20 text-yellow-500/60 font-black h-4 px-2">
                     {type === 'rooms' ? (item.category || 'Tribe') : `Lv.${(item.level?.rich || 1)}`}
                   </Badge>
                </div>
              </div>
              <div className="text-right flex items-center gap-1.5">
                <span className={cn("font-black text-base text-yellow-500")}>
                  {formatValue(getValue(item))}
                </span>
                <GoldCoinIcon className="h-4 w-4" />
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
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center font-black text-lg", color)}>{emoji}</div>
      <div>
        <p className="font-bold text-xs uppercase tracking-widest text-white/40">{rank}</p>
        <p className="font-black text-sm uppercase text-white">Prize Pool</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <GoldCoinIcon className="h-5 w-5" />
      <span className="font-black text-xl text-primary">{amount}</span>
    </div>
  </div>
);

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as any) || 'rich';
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile: me } = useUserProfile(user?.uid);
  
  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>(initialType);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => { if (initialType) setRankingMode(initialType); }, [initialType]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      let target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 30, 0));
      if (now.getTime() >= target.getTime()) target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 18, 30, 0));
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    const timer = setInterval(updateTimer, 1000); updateTimer();
    return () => clearInterval(timer);
  }, []);

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('wallet.dailySpent', 'desc'), limit(50)), [firestore]));
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('stats.dailyFans', 'desc'), limit(50)), [firestore]));
  const { data: gamesUsers, isLoading: isLoadingGames } = useCollection(useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('stats.dailyGameWins', 'desc'), limit(50)), [firestore]));
  const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'chatRooms'), orderBy('stats.dailyGifts', 'desc'), limit(50)), [firestore]));

  const activeItems = rankingType === 'rich' ? richUsers : rankingType === 'charm' ? charmUsers : rankingType === 'games' ? gamesUsers : rankedRooms;
  const isActiveLoading = rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : rankingType === 'games' ? isLoadingGames : isLoadingRooms;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative font-headline overflow-x-hidden flex flex-col">
        <div className="absolute inset-0 z-0 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-[80vh] bg-gradient-to-b from-yellow-900/20 via-[#050505] to-[#050505]" />
           <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150%] h-[100%] bg-gradient-radial from-yellow-500/5 to-transparent opacity-40 animate-pulse" />
        </div>

        <header className="relative z-50 p-6 pt-10 shrink-0">
          <div className="flex items-center justify-between mb-8">
             <Link href="/rooms" className="text-yellow-500 hover:scale-110 transition-transform shrink-0"><ChevronLeft className="h-8 w-8" /></Link>
             <div className="flex gap-6 px-4">
                {['Rich', 'Charm', 'Room', 'Game'].map((cat) => (
                  <button key={cat} onClick={() => setRankingMode(cat.toLowerCase() as any)} className={cn("text-xl font-black uppercase italic tracking-tighter pb-1 border-b-4 transition-all", rankingType === cat.toLowerCase() ? "text-yellow-500 border-yellow-500" : "text-white/20 border-transparent")}>{cat}</button>
                ))}
             </div>
             <Dialog>
                <DialogTrigger asChild><button className="bg-yellow-500/20 p-1.5 rounded-full border border-yellow-500/40 animate-pulse shrink-0"><HelpCircle className="h-6 w-6 text-yellow-500" /></button></DialogTrigger>
                <DialogContent className="bg-slate-900 border-none rounded-t-[3rem] text-white p-0 overflow-hidden h-[85vh] sm:max-w-md animate-in slide-in-from-bottom-full duration-500">
                  <DialogHeader className="p-8 pb-4 text-center">
                    <DialogTitle className="text-3xl font-black uppercase flex items-center justify-center gap-3"><Trophy className="h-8 w-8 text-yellow-400" />Daily Rewards</DialogTitle>
                    <DialogDescription className="sr-only">Rules</DialogDescription>
                  </DialogHeader>
                  <div className="px-8 pb-12 space-y-4 h-full overflow-y-auto no-scrollbar">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3 mb-4"><Timer className="h-4 w-4 text-primary" /><p className="text-[10px] font-bold text-primary/80 uppercase">Next Reset in {timeLeft} (IST)</p></div>
                    <RewardItem emoji="🥇" rank="Top 1" amount="100,000" color="bg-yellow-500/20" />
                    <RewardItem emoji="🥈" rank="Top 2" amount="80,000" color="bg-slate-300/20" />
                    <RewardItem emoji="🥉" rank="Top 3" amount="50,000" color="bg-amber-700/20" />
                    <RewardItem emoji="🏅" rank="Top 4" amount="35,000" color="bg-slate-800/20" />
                    <RewardItem emoji="🎗" rank="Top 5-10" amount="20,000" color="bg-slate-900/20 border border-white/5" />
                  </div>
                </DialogContent>
             </Dialog>
          </div>
          <div className="flex items-center justify-between gap-2 bg-[#1a1a1a]/80 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-2xl relative">
             {['Daily', 'Weekly', 'Monthly'].map((p) => (
               <button key={p} onClick={() => setTimePeriod(p.toLowerCase() as any)} className={cn("flex-1 py-3 rounded-full font-black uppercase italic text-xs transition-all duration-500", timePeriod === p.toLowerCase() ? "bg-gradient-to-b from-yellow-100 to-yellow-500 text-black shadow-lg" : "text-white/40")}>{p}</button>
             ))}
          </div>
        </header>

        <div className="relative z-10 w-full py-3 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent border-y border-white/5 flex flex-col items-center gap-1 shrink-0">
           <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-yellow-500" /><span className="text-base font-mono font-bold text-yellow-500 tracking-[0.2em]">{timeLeft}</span></div>
        </div>

        <div className="relative z-10 px-4 flex-1 overflow-y-auto no-scrollbar">
           <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} currentUid={user?.uid} />
        </div>

        <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a1a1a] border-t border-yellow-500/20 p-4">
           <div className="max-w-4xl mx-auto flex items-center gap-4">
              <span className="w-12 text-center font-black text-yellow-500 italic text-xl">50+</span>
              <Avatar className="h-14 w-14 border-2 border-white/20"><AvatarImage src={me?.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
              <div className="flex-1"><p className="font-black text-lg uppercase italic tracking-tighter">{me?.username || 'Tribe Member'}</p><Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-500 font-black italic px-2 h-5">Lv. {me?.level?.rich || 1}</Badge></div>
              <div className="text-right flex items-center gap-1"><span className="text-2xl font-black text-yellow-500 italic">0</span><GoldCoinIcon className="h-6 w-6" /></div>
           </div>
        </footer>
      </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AppLayout hideSidebarOnMobile>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><Loader className="animate-spin text-primary" /></div>}><LeaderboardContent /></Suspense>
    </AppLayout>
  );
}
