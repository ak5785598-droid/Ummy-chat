'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * High-Fidelity SVIP Signature Badge.
 */
const SVIPBadge = ({ level }: { level: number }) => (
  <div className={cn(
    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm border border-orange-500/50 shadow-lg scale-90 origin-left",
    "bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 animate-shimmer-gold"
  )}>
    <span className="text-[7px] font-black text-white uppercase italic tracking-tighter">SVIP {level}</span>
  </div>
);

/**
 * High-Fidelity Level Signature Badge.
 */
const LevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#b45309] border border-white/20 scale-90 origin-left shadow-md">
    <Star className="h-2 w-2 text-white fill-current" />
    <span className="text-[7px] font-black text-white italic">Lv.{level}</span>
  </div>
);

/**
 * Specialized Ranking List Component.
 */
const RankingList = ({ items, type, isLoading }: { items: any[] | null, type: string, isLoading: boolean }) => {
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-primary h-10 w-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 animate-pulse">Ascending the Throne...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-40">
      <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/20" />
      <p className="font-black uppercase italic text-sm text-white/40">The chronicles are empty.</p>
    </div>
  );

  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];
  const others = items.slice(3);

  const getValue = (item: any) => {
    if (type === 'rich') return item.wallet?.dailySpent || 0;
    if (type === 'charm') return item.stats?.dailyFans || 0;
    if (type === 'rooms') return item.stats?.dailyGifts || 0;
    return 0;
  };

  const getDisplayName = (item: any) => {
    if (type === 'rooms') return item.name || item.title || 'Tribe Room';
    return item.username || 'Ummy User';
  };

  const getDisplayImage = (item: any) => {
    if (type === 'rooms') return item.coverUrl || undefined;
    return item.avatarUrl || undefined;
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-1000 relative pb-40">
      <div className="relative pt-4 flex flex-col items-center">
        {top1 && (
          <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="relative z-30 flex flex-col items-center mb-12 group transition-all active:scale-95">
             <div className="relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-500/10 blur-3xl opacity-50" />
                <div className="relative z-10 w-44 h-44">
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
                      <img src="https://img.icons8.com/color/96/crown.png" className="h-12 w-12 drop-shadow-2xl animate-bounce" alt="Crown" />
                   </div>
                   <div className="relative w-full h-full p-2 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.5)] border-[6px] border-[#1a1a1a]">
                      <Avatar className="h-full w-full border-4 border-yellow-200">
                         <AvatarImage src={getDisplayImage(top1) || 'https://img.icons8.com/color/512/lion.png'} className="object-cover" />
                         <AvatarFallback className="bg-slate-900 text-white font-black text-2xl">1</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-b from-red-500 to-red-700 text-white px-6 py-1 rounded-full font-black text-xs shadow-xl border-2 border-yellow-400 italic">TOP 1</div>
                   </div>
                </div>
             </div>
             <div className="mt-8 text-center space-y-1">
                <h2 className="text-xl font-black text-white uppercase drop-shadow-md tracking-tight">{getDisplayName(top1)}</h2>
                <div className="flex items-center justify-center gap-2 mb-1">
                   <SVIPBadge level={8} />
                   <LevelBadge level={91} />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-yellow-500 font-black">
                   <GoldCoinIcon className="h-4 w-4" />
                   <span className="text-lg italic">{formatValue(getValue(top1))}</span>
                </div>
             </div>
          </Link>
        )}

        <div className="flex items-end justify-center gap-3 w-full max-w-sm px-2 relative z-20">
           {top2 && (
             <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex-1 bg-gradient-to-b from-[#252b41] to-[#1a1f30] rounded-[2rem] border-2 border-blue-400/20 p-4 pt-12 flex flex-col items-center gap-2 shadow-2xl relative transition-all active:scale-95 group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24">
                   <div className="relative w-full h-full bg-gradient-to-b from-blue-200 to-blue-500 rounded-full p-1.5 border-4 border-[#1a1a1a]">
                      <Avatar className="h-full w-full border-2 border-white/20">
                         <AvatarImage src={getDisplayImage(top2)} />
                         <AvatarFallback className="font-black">2</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-b from-blue-600 to-blue-800 text-white px-3 py-0.5 rounded-full font-black text-[8px] border border-blue-200 shadow-lg">TOP 2</div>
                   </div>
                </div>
                <p className="font-black text-sm text-[#fbc02d] uppercase truncate w-24 text-center mt-2 tracking-tighter">{getDisplayName(top2)}</p>
                <div className="flex items-center gap-1 scale-75 origin-center">
                   <SVIPBadge level={5} />
                   <LevelBadge level={61} />
                </div>
                <div className="flex items-center justify-center gap-1 mt-1 text-yellow-500">
                   <GoldCoinIcon className="h-3 w-3" />
                   <span className="text-xs font-black italic">{formatValue(getValue(top2))}</span>
                </div>
             </Link>
           )}

           {top3 && (
             <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex-1 bg-gradient-to-b from-[#2d221a] to-[#1f1610] rounded-[2rem] border-2 border-amber-400/20 p-4 pt-12 flex flex-col items-center gap-2 shadow-2xl relative transition-all active:scale-95 group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24">
                   <div className="relative w-full h-full bg-gradient-to-b from-amber-200 to-amber-500 rounded-full p-1.5 border-4 border-[#1a1a1a]">
                      <Avatar className="h-full w-full border-2 border-white/20">
                         <AvatarImage src={getDisplayImage(top3)} />
                         <AvatarFallback className="font-black">3</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-b from-amber-600 to-amber-800 text-white px-3 py-0.5 rounded-full font-black text-[8px] border border-amber-200 shadow-lg">TOP 3</div>
                   </div>
                </div>
                <p className="font-black text-sm text-white uppercase truncate w-24 text-center mt-2 tracking-tighter">{getDisplayName(top3)}</p>
                <div className="flex items-center gap-1 scale-75 origin-center">
                   <SVIPBadge level={2} />
                   <LevelBadge level={94} />
                </div>
                <div className="flex items-center justify-center gap-1 mt-1 text-yellow-500">
                   <GoldCoinIcon className="h-3 w-3" />
                   <span className="text-xs font-black italic">{formatValue(getValue(top3))}</span>
                </div>
             </Link>
           )}
        </div>
      </div>

      <div className="mt-10 space-y-2 px-2">
        {others.map((item, index) => (
          <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 group hover:bg-white/10 transition-all active:scale-[0.98]">
            <span className="w-6 text-center font-black text-white/40 text-sm italic">{index + 4}</span>
            <Avatar className="h-14 w-14 border border-white/10 shrink-0">
              <AvatarImage src={getDisplayImage(item)} />
              <AvatarFallback className="font-black">{(index + 4)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm uppercase text-yellow-500 truncate tracking-tight mb-1">{getDisplayName(item)}</p>
              <div className="flex items-center gap-1">
                 <SVIPBadge level={7} />
                 <LevelBadge level={76} />
              </div>
            </div>
            <div className="text-right flex items-center gap-1.5 shrink-0">
              <span className="font-black text-sm text-white/80 italic">{formatValue(getValue(item))}</span>
              <GoldCoinIcon className="h-4 w-4 text-yellow-500" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as any) || 'rich';
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile: me } = useUserProfile(user?.uid);
  
  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms'>(initialType);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
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

  const richQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('wallet.dailySpent', 'desc'), limit(50)), [firestore]);
  const charmQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('stats.dailyFans', 'desc'), limit(50)), [firestore]);
  const roomsQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'chatRooms'), orderBy('stats.dailyGifts', 'desc'), limit(50)), [firestore]);

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmQuery);
  const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);

  const activeItems = useMemo(() => {
    if (rankingType === 'rich') return richUsers;
    if (rankingType === 'charm') return charmUsers;
    if (rankingType === 'rooms') return rankedRooms;
    return null;
  }, [rankingType, richUsers, charmUsers, rankedRooms]);

  const isActiveLoading = rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : isLoadingRooms;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative font-headline overflow-x-hidden flex flex-col">
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-[#1a1a1a] via-[#050505] to-transparent" />
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        </div>

        <header className="relative z-50 p-6 pt-10 shrink-0">
          <div className="flex items-center justify-between mb-8">
             <Link href="/rooms" className="text-white hover:scale-110 transition-transform shrink-0"><ChevronLeft className="h-8 w-8" /></Link>
             <h1 className="text-2xl font-black uppercase italic tracking-tighter">Ranking</h1>
             <Dialog>
                <DialogTrigger asChild><button className="p-1.5 rounded-full border border-white/20 text-white/60 hover:text-white transition-all"><HelpCircle className="h-6 w-6" /></button></DialogTrigger>
                <DialogContent className="bg-[#1a1a1a] border-none rounded-t-[3rem] text-white p-8">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-yellow-500 text-center mb-4">Ranking Rules</DialogTitle>
                    <DialogDescription className="sr-only">Detailed tribal ranking policy.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 font-body italic text-gray-400 leading-relaxed pt-2">
                    <p>1. Honor rankings are based on the total Gold Coins spent during the selected period.</p>
                    <p>2. Charm rankings reflect the increase in fan count during the period.</p>
                    <p>3. Room rankings track the total gifts received in specific frequencies.</p>
                  </div>
                </DialogContent>
             </Dialog>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white/5 backdrop-blur-md rounded-full p-1.5 border border-white/5 shadow-2xl mb-6">
             {[
               { id: 'rich', label: 'Honor' },
               { id: 'charm', label: 'Charm' },
               { id: 'rooms', label: 'Room' }
             ].map((cat) => (
               <button 
                 key={cat.id} 
                 onClick={() => setRankingMode(cat.id as any)} 
                 className={cn(
                   "flex-1 py-3 rounded-full font-black uppercase italic text-sm transition-all duration-500", 
                   rankingType === cat.id ? "bg-gradient-to-b from-[#f5e1a4] to-[#b88a44] text-black shadow-lg" : "text-white/40"
                 )}
               >
                 {cat.label}
               </button>
             ))}
          </div>

          <div className="flex items-center justify-center gap-12 px-4">
             {['Daily', 'Weekly', 'Monthly'].map((p) => (
               <button 
                 key={p} 
                 onClick={() => setTimePeriod(p.toLowerCase() as any)} 
                 className={cn(
                   "text-sm font-black uppercase italic transition-all relative", 
                   timePeriod === p.toLowerCase() ? "text-yellow-500 scale-110" : "text-white/20 hover:text-white/40"
                 )}
               >
                 {p}
                 {timePeriod === p.toLowerCase() && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-yellow-500 rounded-full" />}
               </button>
             ))}
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-2">
           <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} />
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#b88a44] via-[#f5e1a4] to-[#b88a44] p-4 h-20 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           <div className="max-w-4xl mx-auto flex items-center gap-4 w-full">
              <span className="w-12 text-center font-black text-black/60 italic text-xl">100+</span>
              <Avatar className="h-14 w-14 border-2 border-black/20 shrink-0 shadow-lg">
                <AvatarImage src={me?.avatarUrl || undefined} />
                <AvatarFallback className="bg-black text-white">ME</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg uppercase italic text-black truncate leading-none mb-1">{me?.username || 'Tribe Member'}</p>
                <div className="scale-75 origin-left"><LevelBadge level={me?.level?.rich || 1} /></div>
              </div>
              <div className="text-right flex items-center gap-1 shrink-0">
                <span className="text-2xl font-black text-black italic leading-none">0</span>
                <GoldCoinIcon className="h-6 w-6 text-black" />
              </div>
           </div>
        </footer>
      </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AppLayout hideSidebarOnMobile>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-[#050505]">
          <Loader className="animate-spin text-primary h-10 w-10" />
        </div>
      }>
        <LeaderboardContent />
      </Suspense>
    </AppLayout>
  );
}
