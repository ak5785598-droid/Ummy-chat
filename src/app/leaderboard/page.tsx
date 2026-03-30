'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, where, collectionGroup } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, ChevronRight, Star, Sparkles, Trophy, Gamepad2, Zap, Heart, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
import Image from 'next/image';

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Trophy,
  Gamepad2,
  Zap,
  Star,
  Users,
  Heart
};

/**
 * Mobile-Safe IST Countdown.
 */
const RankingCountdown = ({ period }: { period: 'daily' | 'weekly' | 'monthly' }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (3600000 * 5.5));
      let target = new Date(istDate.getTime());

      if (period === 'daily') {
        target.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        const day = istDate.getDay(); 
        const diffToMonday = (day === 0 ? 1 : 8 - day);
        target.setDate(istDate.getDate() + diffToMonday);
        target.setHours(0, 0, 0, 0);
      } else if (period === 'monthly') {
        target.setMonth(istDate.getMonth() + 1, 1); 
        target.setHours(0, 0, 0, 0);
      }
      
      const diff = target.getTime() - istDate.getTime();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      if (period === 'daily') {
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [period]);

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col items-center gap-1 opacity-60">
       <span className="text-[8px] font-black uppercase text-cyan-400 tracking-widest">Resets In</span>
       <span className="text-sm font-black text-white tabular-nums">{timeLeft}</span>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: 'daily' | 'weekly' | 'monthly', isLoading: boolean }) => {
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-cyan-400 h-10 w-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 animate-pulse">Syncing Arena...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-40">
      <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/20" />
      <p className="font-black uppercase italic text-sm text-white/40">Chronicles are empty.</p>
    </div>
  );

  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];
  const others = items.slice(3);

  const getValue = (item: any) => {
    const pKey = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
    if (type === 'rich') return item.wallet?.[`${pKey}Spent`] || 0;
    if (type === 'charm') return item.stats?.[`${pKey}GiftsReceived`] || 0;
    if (type === 'rooms') return item.stats?.[`${pKey}Gifts`] || 0;
    if (type === 'games') return item.stats?.[`${pKey}GameWins`] || 0;
    return 0;
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  const getDisplayName = (item: any) => {
    if (type === 'rooms') return item.name || item.title || 'Tribe Room';
    return item.username || 'Ummy User';
  };

  const getDisplayImage = (item: any) => {
    if (type === 'rooms') return item.coverUrl || undefined;
    return item.avatarUrl || undefined;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-40">
      {/* 3D Cyber Podium */}
      <div className="relative pt-20 flex justify-center items-end px-4 gap-2">
        
        {/* Rank 2 (Left) */}
        {top2 && (
          <div className="flex-1 flex flex-col items-center animate-in slide-in-from-left-10 duration-700">
             <div className="relative mb-4">
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
                <div className="h-20 w-20 relative z-10 border-2 border-slate-400 rounded-full p-1 bg-[#1a1f2e]">
                   <Avatar className="h-full w-full">
                      <AvatarImage src={getDisplayImage(top2)} />
                      <AvatarFallback>2</AvatarFallback>
                   </Avatar>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-black h-6 w-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-black">2</div>
             </div>
             <div className="w-full h-24 bg-gradient-to-b from-white/10 to-transparent border-t-2 border-white/20 rounded-t-3xl flex flex-col items-center justify-center p-2 text-center">
                <p className="text-[10px] font-black uppercase text-white truncate w-full">{getDisplayName(top2)}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{formatValue(getValue(top2))}</p>
             </div>
          </div>
        )}

        {/* Rank 1 (Center) */}
        {top1 && (
          <div className="flex-[1.2] flex flex-col items-center z-20 animate-in zoom-in duration-1000">
             <div className="relative mb-6">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce">
                   <Crown className="h-10 w-10 text-yellow-400 fill-current drop-shadow-[0_0_15px_#facc15]" />
                </div>
                <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full" />
                <div className="h-28 w-28 relative z-10 border-4 border-cyan-400 rounded-full p-1.5 bg-[#1a1f2e] glow-cyan">
                   <Avatar className="h-full w-full">
                      <AvatarImage src={getDisplayImage(top1)} />
                      <AvatarFallback>1</AvatarFallback>
                   </Avatar>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-black h-8 w-8 rounded-md rotate-45 flex items-center justify-center font-black text-lg border-2 border-black">
                   <span className="-rotate-45">1</span>
                </div>
             </div>
             <div className="w-full h-32 bg-gradient-to-b from-cyan-400/20 to-transparent border-t-2 border-cyan-400/40 rounded-t-3xl flex flex-col items-center justify-center p-2 text-center">
                <p className="text-sm font-black uppercase text-white truncate w-full drop-shadow-md">{getDisplayName(top1)}</p>
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-tight">{formatValue(getValue(top1))}</p>
             </div>
          </div>
        )}

        {/* Rank 3 (Right) */}
        {top3 && (
          <div className="flex-1 flex flex-col items-center animate-in slide-in-from-right-10 duration-700">
             <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full" />
                <div className="h-20 w-20 relative z-10 border-2 border-purple-500 rounded-full p-1 bg-[#1a1f2e]">
                   <Avatar className="h-full w-full">
                      <AvatarImage src={getDisplayImage(top3)} />
                      <AvatarFallback>3</AvatarFallback>
                   </Avatar>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white h-6 w-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-black">3</div>
             </div>
             <div className="w-full h-20 bg-gradient-to-b from-purple-500/10 to-transparent border-t-2 border-purple-500/20 rounded-t-3xl flex flex-col items-center justify-center p-2 text-center">
                <p className="text-[10px] font-black uppercase text-white truncate w-full">{getDisplayName(top3)}</p>
                <p className="text-[9px] font-bold text-purple-400 uppercase">{formatValue(getValue(top3))}</p>
             </div>
          </div>
        )}
      </div>

      {/* Arena List Dimension */}
      <div className="px-4 space-y-3 pb-20">
        {others.map((item, index) => (
          <Link 
            key={item.id} 
            href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} 
            className="group block animate-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="glass-card-dark rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group-active:scale-[0.98] transition-all">
               {/* Rank Hexagon Badge */}
               <div className="h-10 w-10 shrink-0 bg-[#1a1f2e] border border-cyan-400/30 flex items-center justify-center relative transform transition-transform group-hover:rotate-12" style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}>
                  <span className="text-white font-black text-sm italic">{index + 4}</span>
               </div>

               {/* Profile Hexagon Frame */}
               <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-magenta-500/20 blur-md rounded-full" />
                  <div className="h-14 w-14 bg-gradient-to-br from-magenta-500 to-purple-600 p-0.5" style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}>
                     <div className="h-full w-full bg-[#1a1f2e]" style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}>
                        <Avatar className="h-full w-full rounded-none">
                           <AvatarImage src={getDisplayImage(item)} className="object-cover" />
                           <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                     </div>
                  </div>
               </div>

               <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white uppercase italic tracking-tight truncate group-hover:text-cyan-400 transition-colors">{getDisplayName(item)}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">LVL {Math.floor(Math.random() * 50) + 1}</p>
                  <p className="text-lg font-black italic tracking-tighter text-cyan-400 leading-none mt-1">
                     {formatValue(getValue(item))}
                  </p>
               </div>

               {/* Mini Trend Signature */}
               <div className="shrink-0 flex items-center gap-2">
                  <svg width="40" height="20" className="opacity-40">
                     <path d="M0 15 Q10 10, 20 12 T40 5" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400" />
                  </svg>
                  <div className="flex -space-x-1">
                     <div className="h-4 w-4 rounded-full bg-slate-400 border border-black flex items-center justify-center text-[6px]">🥈</div>
                     <div className="h-4 w-4 rounded-full bg-yellow-500 border border-black flex items-center justify-center text-[6px]">🥇</div>
                  </div>
               </div>
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
  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>(initialType);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (initialType) setRankingMode(initialType); }, [initialType]);

  const periodKey = timePeriod === 'daily' ? 'daily' : timePeriod === 'weekly' ? 'weekly' : 'monthly';

  const richQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = `wallet.${periodKey}Spent`;
    return query(collectionGroup(firestore, 'profile'), where(field, '>', 0), orderBy(field, 'desc'), limit(50));
  }, [firestore, periodKey]);

  const charmQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = `stats.${periodKey}GiftsReceived`;
    return query(collectionGroup(firestore, 'profile'), where(field, '>', 0), orderBy(field, 'desc'), limit(50));
  }, [firestore, periodKey]);

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = `stats.${periodKey}Gifts`;
    return query(collection(firestore, 'chatRooms'), where(field, '>', 0), orderBy(field, 'desc'), limit(50));
  }, [firestore, periodKey]);

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = `stats.${periodKey}GameWins`;
    return query(collectionGroup(firestore, 'profile'), where(field, '>', 0), orderBy(field, 'desc'), limit(50));
  }, [firestore, periodKey]);

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmQuery);
  const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);
  const { data: gameUsers, isLoading: isLoadingGames } = useCollection(gamesQuery);

  const activeItems = useMemo(() => {
    if (rankingType === 'rich') return richUsers;
    if (rankingType === 'charm') return charmUsers;
    if (rankingType === 'rooms') return rankedRooms;
    if (rankingType === 'games') return gameUsers;
    return null;
  }, [rankingType, richUsers, charmUsers, rankedRooms, gameUsers]);

  const isActiveLoading = rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : rankingType === 'rooms' ? isLoadingRooms : isLoadingGames;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white relative font-headline overflow-x-hidden flex flex-col">
        {/* Background Visual Frequency */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-cyan-950/20 via-transparent to-transparent" />
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-radial from-cyan-500/5 via-transparent to-transparent animate-pulse" />
        </div>

        <header className="relative z-50 p-6 pt-12 shrink-0">
          <div className="flex items-center justify-between mb-8">
             <Link href="/rooms" className="text-cyan-400 hover:scale-110 transition-transform shrink-0 p-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                <ChevronLeft className="h-6 w-6" />
             </Link>
             <div className="flex flex-col items-center">
                <h1 className="text-2xl font-black uppercase italic tracking-[0.2em] text-white drop-shadow-[0_0_10px_#fff]">Global Rankings</h1>
                <div className="h-0.5 w-12 bg-cyan-400 mt-1 shadow-[0_0_8px_#00E5FF]" />
             </div>
             <div className="w-10" />
          </div>

          {/* Cyber Tab Protocol */}
          <div className="bg-[#1a1f2e]/60 backdrop-blur-xl rounded-2xl p-1.5 border border-white/5 shadow-2xl flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
             {[
               { id: 'rich', label: 'Rich' },
               { id: 'charm', label: 'Charm' },
               { id: 'games', label: 'Game' },
               { id: 'rooms', label: 'Room' }
             ].map((cat) => (
               <button 
                 key={cat.id} 
                 onClick={() => setRankingMode(cat.id as any)} 
                 className={cn(
                   "flex-1 min-w-[80px] py-3 rounded-xl font-black uppercase italic text-xs transition-all duration-500 whitespace-nowrap", 
                   rankingType === cat.id ? "bg-white/10 text-cyan-400 border border-cyan-400/40 shadow-[inset_0_0_15px_#00E5FF22]" : "text-white/30"
                 )}
               >
                 {cat.label}
               </button>
             ))}
          </div>

          <div className="mt-6 flex items-center justify-between px-2">
             <div className="flex gap-6">
                {['Daily', 'Weekly', 'Monthly'].map((p) => (
                  <button 
                    key={p} 
                    onClick={() => setTimePeriod(p.toLowerCase() as any)} 
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-all relative", 
                      timePeriod === p.toLowerCase() ? "text-white" : "text-white/20"
                    )}
                  >
                    {p}
                    {timePeriod === p.toLowerCase() && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full glow-cyan" />}
                  </button>
                ))}
             </div>
             <RankingCountdown period={timePeriod} />
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-2">
           <RankingList items={activeItems} type={rankingType} period={timePeriod} isLoading={isActiveLoading} />
        </main>
      </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AppLayout hideSidebarOnMobile>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
          <Loader className="animate-spin text-cyan-400 h-8 w-8" />
        </div>
      }>
        <LeaderboardContent />
      </Suspense>
    </AppLayout>
  );
}