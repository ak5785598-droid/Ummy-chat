'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, Star, Trophy, Gamepad2, Zap, Heart, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';

// --- Circle Avatar Component ---
const CircleAvatar = ({ src, fallback, size = "md", glowColor = "cyan" }: { src?: string, fallback: string, size?: "sm" | "md" | "lg", glowColor?: string }) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };
  const glows: Record<string, string> = {
    cyan: "shadow-[0_0_15px_rgba(34,211,238,0.5)] border-cyan-400",
    purple: "shadow-[0_0_15px_rgba(168,85,247,0.5)] border-purple-500",
    yellow: "shadow-[0_0_20px_rgba(234,179,8,0.6)] border-yellow-400"
  };

  return (
    <div className={cn("relative flex items-center justify-center p-0.5", sizes[size])}>
      <div className={cn("relative w-full h-full border-2 rounded-full flex items-center justify-center overflow-hidden bg-[#0a0a0a]", glows[glowColor])}>
        <Avatar className="h-full w-full rounded-full">
          <AvatarImage src={src} className="object-cover" />
          <AvatarFallback className="bg-slate-900 text-white font-black">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

// --- Live GMT+5:30 Timer Component ---
const LiveTimer = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setTime(new Intl.DateTimeFormat('en-GB', options).format(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1 mt-2 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
      <Clock className="h-2.5 w-2.5 text-cyan-400" />
      <span className="text-[9px] font-mono text-white/70">GMT+5:30 {time}</span>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: string, isLoading: boolean }) => {
 if (isLoading) return (
  <div className="flex flex-col items-center py-40 gap-4">
   <Loader className="animate-spin text-cyan-500 h-10 w-10" />
   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/60 animate-pulse">Syncing Global Data...</p>
  </div>
 );

 if (!items || items.length === 0) return (
  <div className="text-center py-40 opacity-40">
   <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/20" />
   <p className="font-bold uppercase text-sm text-white/40">No Legends Found.</p>
  </div>
 );

 const top1 = items[0];
 const top2 = items[1];
 const top3 = items[2];
 const others = items.slice(3);

 const getValue = (item: any) => {
  const fieldPrefix = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
  const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
  if (type === 'rich') return item.wallet?.[`${fieldPrefix}${fieldSuffix}`] || 0;
  return item.stats?.[`${fieldPrefix}${fieldSuffix}`] || 0;
 };

 const formatValue = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toLocaleString();
 };

 return (
  <div className="space-y-6 animate-in fade-in duration-700 pb-32">
    {/* Podium Section */}
    <div className="flex items-end justify-center gap-2 pt-10 px-2">
      {top2 && (
        <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
           <div className="relative mb-2">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-400 font-black text-2xl italic opacity-50">2</div>
             <CircleAvatar src={top2.avatarUrl || top2.coverUrl} fallback="2" glowColor="cyan" />
           </div>
           <div className="w-full bg-gradient-to-b from-cyan-950/40 to-transparent border-t-2 border-cyan-500/50 pt-4 pb-2 flex flex-col items-center rounded-t-lg">
             <span className="text-[10px] font-black uppercase text-white truncate w-20 text-center">{top2.username || top2.name || 'User'}</span>
             <span className="text-cyan-400 font-bold text-xs">{formatValue(getValue(top2))}</span>
             <LiveTimer />
           </div>
        </Link>
      )}

      {top1 && (
        <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 -translate-y-4 scale-110">
           <div className="relative mb-2">
             <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-bounce" />
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-yellow-500 text-black text-[10px] font-black px-2 rounded-full">1</div>
             <CircleAvatar src={top1.avatarUrl || top1.coverUrl} fallback="1" size="lg" glowColor="yellow" />
           </div>
           <div className="w-full bg-gradient-to-b from-yellow-500/20 to-transparent border-t-2 border-yellow-500 pt-6 pb-2 flex flex-col items-center rounded-t-lg shadow-[0_-10px_20px_rgba(234,179,8,0.2)]">
             <span className="text-[11px] font-black uppercase text-white truncate w-24 text-center">{top1.username || top1.name || 'User'}</span>
             <span className="text-yellow-400 font-black text-sm">{formatValue(getValue(top1))}</span>
             <LiveTimer />
           </div>
        </Link>
      )}

      {top3 && (
        <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex-1 flex flex-col items-center group">
           <div className="relative mb-2">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-purple-400 font-black text-2xl italic opacity-50">3</div>
             <CircleAvatar src={top3.avatarUrl || top3.coverUrl} fallback="3" glowColor="purple" />
           </div>
           <div className="w-full bg-gradient-to-b from-purple-950/40 to-transparent border-t-2 border-purple-500/50 pt-4 pb-2 flex flex-col items-center rounded-t-lg">
             <span className="text-[10px] font-black uppercase text-white truncate w-20 text-center">{top3.username || top3.name || 'User'}</span>
             <span className="text-purple-400 font-bold text-xs">{formatValue(getValue(top3))}</span>
             <LiveTimer />
           </div>
        </Link>
      )}
    </div>

    {/* Scrollable List */}
    <div className="px-4 space-y-3">
      {others.map((item, index) => (
        <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} 
          className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-500 opacity-40" />
          <span className="text-lg font-black italic text-white/20 w-6">{index + 4}</span>
          <CircleAvatar src={item.avatarUrl || item.coverUrl} fallback={(index+4).toString()} size="sm" glowColor="purple" />
          <div className="flex-1">
            <p className="text-xs font-black uppercase text-white tracking-wide">{item.username || item.name || 'User'}</p>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Global Player</p>
          </div>
          <div className="text-right flex items-center gap-2">
            <span className="text-cyan-400 font-black text-sm">{formatValue(getValue(item))}</span>
            <GoldCoinIcon className="h-3 w-3" />
          </div>
        </Link>
      ))}
    </div>
  </div>
 );
};

export default function LeaderboardPage() {
 const searchParams = useSearchParams();
 const initialType = (searchParams.get('type') as any) || 'rich';
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: me } = useUserProfile(user?.uid);
 
 const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>(initialType);
 const [mounted, setMounted] = useState(false);

 useEffect(() => { setMounted(true); }, []);
 
 const activeQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let coll = rankingType === 'rooms' ? 'chatRooms' : 'users';
    let field = '';
    
    if (rankingType === 'rich') field = 'wallet.dailySpent';
    else if (rankingType === 'charm') field = 'stats.dailyGiftsReceived';
    else if (rankingType === 'rooms') field = 'stats.dailyGifts';
    else if (rankingType === 'games') field = 'stats.dailyGameWins';

    return query(collection(firestore, coll), orderBy(field, 'desc'), limit(50));
 }, [firestore, rankingType]);

 const { data: activeItems, isLoading } = useCollection(activeQuery);

 const myValue = useMemo(() => {
  if (!me) return 0;
  if (rankingType === 'rich') return me.wallet?.dailySpent || 0;
  if (rankingType === 'charm') return me.stats?.dailyGiftsReceived || 0;
  return 0;
 }, [me, rankingType]);

 if (!mounted) return null;

 return (
  <AppLayout>
  <div className="min-h-screen bg-[#05070a] text-white relative font-sans flex flex-col">
    <header className="relative z-50 p-6 pt-10">
     <div className="flex items-center justify-between mb-8">
       <Link href="/rooms"><ChevronLeft className="h-6 w-6 text-cyan-400" /></Link>
       <h1 className="text-xl font-black uppercase tracking-[0.2em] italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Hall of Fame</h1>
       <HelpCircle className="h-5 w-5 text-white/20" />
     </div>

     {/* Filter Tabs with Daily Subtitle */}
     <div className="flex flex-col items-center">
        <div className="flex items-center justify-around w-full border-b border-white/10 pb-2">
        {[
            { id: 'rich', label: 'Honor' },
            { id: 'charm', label: 'Charm' },
            { id: 'games', label: 'Game' },
            { id: 'rooms', label: 'Room' }
        ].map((tab) => (
            <button key={tab.id} onClick={() => setRankingMode(tab.id as any)} 
            className={cn("text-[10px] font-black uppercase tracking-widest transition-all", rankingType === tab.id ? "text-cyan-400 border-b-2 border-cyan-400 pb-2" : "text-white/30")}>
            {tab.label}
            </button>
        ))}
        </div>
        <div className="mt-2">
            <span className="text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-4 py-0.5 rounded-full tracking-[0.3em]">DAILY</span>
        </div>
     </div>
    </header>

    <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
       <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
    </main>

    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0c10]/95 backdrop-blur-lg border-t border-cyan-500/20 p-4 h-20 flex items-center">
      <div className="max-w-4xl mx-auto flex items-center gap-4 w-full">
       <span className="text-xs font-black text-cyan-500 italic">ME</span>
       <CircleAvatar src={me?.avatarUrl} fallback="U" size="sm" glowColor="cyan" />
       <div className="flex-1">
        <p className="font-black text-xs uppercase text-white truncate">{me?.username || 'User'}</p>
        <div className="flex items-center gap-2">
           <GoldCoinIcon className="h-3 w-3" />
           <span className="text-sm font-black text-cyan-400">{myValue.toLocaleString()}</span>
        </div>
       </div>
       <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
         <span className="text-[10px] font-black text-cyan-400">SYNCED</span>
       </div>
      </div>
    </footer>
   </div>
   </AppLayout>
 );
}
