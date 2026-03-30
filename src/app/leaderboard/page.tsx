'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, Clock, Sparkles, Trophy, Gamepad2, Zap, Star, Heart, Users } from 'lucide-react';
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

const ICON_MAP: Record<string, any> = { Sparkles, Trophy, Gamepad2, Zap, Star, Users, Heart };

const SVIPBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm border border-orange-500/50 bg-gradient-to-r from-orange-600 to-red-600 scale-75 origin-left">
  <span className="text-[8px] font-black text-white uppercase italic">SVIP {level || 1}</span>
 </div>
);

const LevelBadge = ({ level }: { level: number | any }) => {
  const displayLevel = typeof level === 'number' ? level : (level?.rich || 1);
  return (
   <div className="flex items-center gap-0.5 px-1 bg-[#1a1a1a] border border-blue-500/50 rounded-sm scale-75 origin-left">
    <span className="text-[8px] font-bold text-blue-400">LV.{displayLevel}</span>
   </div>
  );
};

const RankingCountdown = ({ period }: { period: 'daily' | 'weekly' | 'monthly' }) => {
 const [timeLeft, setTimeLeft] = useState<string | null>(null);
 useEffect(() => {
  const updateCountdown = () => {
   const now = new Date();
   const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
   let target = new Date(istDate);
   if (period === 'daily') target.setHours(23, 59, 59, 999);
   else if (period === 'weekly') {
    const day = target.getDay();
    target.setDate(target.getDate() + (7 - (day === 0 ? 7 : day)));
    target.setHours(23, 59, 59, 999);
   } else target.setMonth(target.getMonth() + 1, 0), target.setHours(23, 59, 59, 999);
   const diff = target.getTime() - istDate.getTime();
   if (diff <= 0) return setTimeLeft("00:00:00");
   const h = Math.floor((diff / (1000 * 60 * 60)) % 24), m = Math.floor((diff / (1000 * 60)) % 60), s = Math.floor((diff / 1000) % 60);
   setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  };
  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
  return () => clearInterval(interval);
 }, [period]);
 return <div className="text-[10px] font-mono text-blue-400/60 mt-2">Reset in: {timeLeft}</div>;
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: 'daily' | 'weekly' | 'monthly', isLoading: boolean }) => {
 if (isLoading) return <div className="flex flex-col items-center py-40 gap-4"><Loader className="animate-spin text-blue-500 h-10 w-10" /><p className="text-[10px] uppercase text-blue-400 animate-pulse">Loading Rankings...</p></div>;
 if (!items || items.length === 0) return <div className="text-center py-40 opacity-40"><p className="text-sm text-white/40 uppercase font-black">No Data</p></div>;

 const top1 = items[0], top2 = items[1], top3 = items[2], others = items.slice(3);
 const getValue = (item: any) => {
  const prefix = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
  const suffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
  return (type === 'rich' ? item.wallet?.[`${prefix}${suffix}`] : item.stats?.[`${prefix}${suffix}`]) || 0;
 };
 const formatValue = (val: number) => val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val.toLocaleString();

 return (
  <div className="space-y-6 animate-in fade-in duration-700 pb-32">
   {/* --- NEON PODIUM SECTION (Image 2 Style) --- */}
   <div className="flex items-end justify-center gap-0 pt-10 px-2 h-64 relative">
    
    {/* Rank 2 */}
    {top2 && (
     <div className="flex-1 flex flex-col items-center z-0">
      <div className="relative mb-2 flex flex-col items-center">
        <span className="text-gray-400 font-black text-2xl italic mb-1">2</span>
        <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-gray-400 rounded-lg rotate-45 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(156,163,175,0.3)]">
          <img src={type === 'rooms' ? top2.coverUrl : top2.avatarUrl} className="-rotate-45 w-[140%] h-[140%] object-cover" />
        </div>
      </div>
      <div className="w-full bg-[#161b22] h-20 border-t-2 border-gray-400 flex flex-col items-center justify-center p-1 rounded-tl-xl">
        <p className="text-[9px] font-black text-white truncate w-20 text-center uppercase">{type === 'rooms' ? top2.name : top2.username}</p>
        <p className="text-[10px] font-bold text-gray-400">{formatValue(getValue(top2))} XP</p>
      </div>
     </div>
    )}

    {/* Rank 1 */}
    {top1 && (
     <div className="flex-1 flex flex-col items-center z-10 scale-110">
      <div className="relative mb-2 flex flex-col items-center">
        <Crown className="h-6 w-6 text-yellow-500 fill-current absolute -top-6 animate-bounce" />
        <span className="text-yellow-500 font-black text-2xl italic mb-1">1</span>
        <div className="w-20 h-20 bg-[#1a1a1a] border-2 border-yellow-500 rounded-lg rotate-45 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.5)]">
          <img src={type === 'rooms' ? top1.coverUrl : top1.avatarUrl} className="-rotate-45 w-[140%] h-[140%] object-cover" />
        </div>
      </div>
      <div className="w-full bg-[#1c2128] h-28 border-x-2 border-t-2 border-blue-400 flex flex-col items-center justify-center p-1 shadow-[0_-10px_20px_rgba(59,130,246,0.2)] rounded-t-lg">
        <p className="text-[10px] font-black text-white truncate w-24 text-center uppercase">{type === 'rooms' ? top1.name : top1.username}</p>
        <p className="text-[11px] font-black text-blue-400">{formatValue(getValue(top1))} XP</p>
      </div>
     </div>
    )}

    {/* Rank 3 */}
    {top3 && (
     <div className="flex-1 flex flex-col items-center z-0">
      <div className="relative mb-2 flex flex-col items-center">
        <span className="text-orange-500 font-black text-2xl italic mb-1">3</span>
        <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-orange-500 rounded-lg rotate-45 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          <img src={type === 'rooms' ? top3.coverUrl : top3.avatarUrl} className="-rotate-45 w-[140%] h-[140%] object-cover" />
        </div>
      </div>
      <div className="w-full bg-[#161b22] h-16 border-t-2 border-orange-500 flex flex-col items-center justify-center p-1 rounded-tr-xl">
        <p className="text-[9px] font-black text-white truncate w-20 text-center uppercase">{type === 'rooms' ? top3.name : top3.username}</p>
        <p className="text-[10px] font-bold text-orange-500">{formatValue(getValue(top3))} XP</p>
      </div>
     </div>
    )}
   </div>

   {/* --- LIST SECTION (Image 2 Cards Style) --- */}
   <div className="space-y-3 px-3">
    {others.map((item, index) => (
     <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} 
       className="flex items-center gap-4 p-3 bg-[#0d1117] border border-blue-900/30 rounded-xl relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/20 group-hover:bg-blue-500 transition-all" />
      <span className="text-lg font-black italic text-white/40 w-6">{index + 4}</span>
      <div className="w-12 h-12 bg-[#1a1a1a] border border-purple-500/50 rounded-lg rotate-45 flex items-center justify-center overflow-hidden shrink-0">
        <img src={type === 'rooms' ? item.coverUrl : item.avatarUrl} className="-rotate-45 w-[140%] h-[140%] object-cover" />
      </div>
      <div className="flex-1 min-w-0 ml-2">
        <p className="font-black text-[13px] uppercase text-white truncate tracking-tighter">{type === 'rooms' ? item.name : item.username}</p>
        <div className="flex items-center gap-1 mt-1">
          <LevelBadge level={item.level} />
          {item.svip && <SVIPBadge level={item.svip} />}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-blue-400 italic">{formatValue(getValue(item))} XP</p>
        <div className="w-16 h-1 bg-blue-900/50 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-blue-500 w-[70%]" />
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
 const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'banner' | 'games'>((searchParams.get('type') as any) || 'rich');
 const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: me } = useUserProfile(user?.uid);

 // Firebase Queries
 const getQuery = (col: string, field: string) => firestore ? query(collection(firestore, col), orderBy(field, 'desc'), limit(50)) : null;
 const qField = (p: string, s: string) => `${p === 'daily' ? 'daily' : p === 'weekly' ? 'weekly' : 'monthly'}${s}`;
 
 const { data: richUsers, isLoading: l1 } = useCollection(useMemoFirebase(() => getQuery('users', `wallet.${qField(timePeriod, 'Spent')}`), [firestore, timePeriod]));
 const { data: charmUsers, isLoading: l2 } = useCollection(useMemoFirebase(() => getQuery('users', `stats.${qField(timePeriod, 'GiftsReceived')}`), [firestore, timePeriod]));
 const { data: rooms, isLoading: l3 } = useCollection(useMemoFirebase(() => getQuery('chatRooms', `stats.${qField(timePeriod, 'Gifts')}`), [firestore, timePeriod]));
 const { data: games, isLoading: l4 } = useCollection(useMemoFirebase(() => getQuery('users', `stats.${qField(timePeriod, 'GameWins')}`), [firestore, timePeriod]));

 const activeItems = rankingType === 'rich' ? richUsers : rankingType === 'charm' ? charmUsers : rankingType === 'rooms' ? rooms : games;
 const loading = l1 || l2 || l3 || l4;

 return (
  <div className="min-h-screen bg-[#05070a] text-white flex flex-col">
    <header className="p-4 pt-8 bg-[#0d1117] border-b border-white/5">
     <div className="flex items-center justify-between mb-6">
       <Link href="/rooms"><ChevronLeft className="h-7 w-7" /></Link>
       <h1 className="text-lg font-black uppercase tracking-widest text-blue-100 italic">Global Rankings</h1>
       <RankingCountdown period={timePeriod} />
     </div>

     <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 mb-4">
       {['rich', 'charm', 'game', 'room'].map((id) => (
        <button key={id} onClick={() => setRankingMode(id as any)} className={cn("flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all", rankingType === id ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-white/40")}>
          {id}
        </button>
       ))}
     </div>

     <div className="flex justify-center gap-8">
        {['Daily', 'Weekly', 'Monthly'].map((p) => (
         <button key={p} onClick={() => setTimePeriod(p.toLowerCase() as any)} className={cn("text-[10px] font-black uppercase tracking-widest pb-1 transition-all", timePeriod === p.toLowerCase() ? "text-blue-400 border-b-2 border-blue-400" : "text-white/20")}>
          {p}
         </button>
        ))}
     </div>
    </header>

    <main className="flex-1 overflow-y-auto no-scrollbar pt-4">
       <RankingList items={activeItems} type={rankingType} period={timePeriod} isLoading={loading} />
    </main>

    {/* --- ME FOOTER (Image 2 Style) --- */}
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] border-t border-blue-500/30 p-3 h-16 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-4xl mx-auto flex items-center gap-4 w-full px-2">
       <span className="text-xl font-black italic text-blue-500">ME</span>
       <div className="w-10 h-10 bg-[#1a1a1a] border border-blue-500 rounded-lg rotate-45 flex items-center justify-center overflow-hidden shrink-0">
        <img src={me?.avatarUrl} className="-rotate-45 w-[140%] h-[140%] object-cover" />
       </div>
       <div className="flex-1 min-w-0 ml-2">
        <p className="font-black text-sm uppercase text-white truncate">{me?.username || 'GUEST'}</p>
        <LevelBadge level={me?.level} />
       </div>
       <div className="text-right">
        <p className="text-lg font-black text-blue-400 italic">{(me?.wallet?.dailySpent || 0).toLocaleString()} <span className="text-[10px]">XP</span></p>
       </div>
      </div>
    </footer>
   </div>
 );
}

export default function LeaderboardPage() {
 return (
  <AppLayout>
   <Suspense fallback={<div className="h-screen bg-[#05070a]" />}><LeaderboardContent /></Suspense>
  </AppLayout>
 );
}

