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
    cyan: "shadow-[0_0_20px_rgba(34,211,238,0.4)] border-cyan-400/80",
    purple: "shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-500/80",
    yellow: "shadow-[0_0_30px_rgba(234,179,8,0.5)] border-yellow-400"
  };

  return (
    <div className={cn("relative flex items-center justify-center p-0.5", sizes[size])}>
      <div className={cn("relative w-full h-full border-2 rounded-full flex items-center justify-center overflow-hidden bg-slate-900", glows[glowColor])}>
        <Avatar className="h-full w-full rounded-full">
          <AvatarImage src={src} className="object-cover" />
          <AvatarFallback className="bg-slate-950 text-white font-black">{fallback}</AvatarFallback>
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
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setTime(new Intl.DateTimeFormat('en-GB', options).format(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-transparent via-white/5 to-transparent border-y border-white/5">
      <Clock className="h-3 w-3 text-cyan-400 animate-pulse" />
      <span className="text-[10px] font-mono text-white/50 tracking-[0.2em] uppercase">
        Update: GMT+5:30 <span className="text-cyan-400 font-bold">{time}</span>
      </span>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: string, isLoading: boolean }) => {
 if (isLoading) return (
  <div className="flex flex-col items-center py-40 gap-4">
   <Loader className="animate-spin text-cyan-500 h-10 w-10" />
   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/60">Syncing Global Data...</p>
  </div>
 );

 if (!items || items.length === 0) return (
  <div className="text-center py-40 opacity-40">
   <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/20" />
   <p className="font-bold uppercase text-sm text-white/40">No Legends Found.</p>
  </div>
 );

 const [top1, top2, top3, ...others] = items;

 const getValue = (item: any) => {
  const fieldPrefix = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
  const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
  return (type === 'rich' ? item.wallet?.[`${fieldPrefix}${fieldSuffix}`] : item.stats?.[`${fieldPrefix}${fieldSuffix}`]) || 0;
 };

 const formatValue = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toLocaleString();
 };

 return (
  <div className="animate-in fade-in duration-1000 pb-32">
    {/* Podium Section */}
    <div className="flex items-end justify-center gap-1 pt-12 px-2 relative">
      {/* Background Glow for Top 1 */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/10 blur-[60px] rounded-full -z-10" />
      
      {top2 && (
        <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
           <div className="relative mb-3">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-500 font-black text-2xl italic opacity-30">2</div>
             <CircleAvatar src={top2.avatarUrl || top2.coverUrl} fallback="2" glowColor="cyan" />
           </div>
           <div className="w-full bg-white/5 backdrop-blur-md border-t-2 border-cyan-500/40 pt-4 pb-3 flex flex-col items-center rounded-t-2xl">
             <span className="text-[10px] font-black uppercase text-white/90 truncate w-20 text-center">{top2.username || top2.name || 'User'}</span>
             <span className="text-cyan-400 font-black text-xs">{formatValue(getValue(top2))}</span>
           </div>
        </Link>
      )}

      {top1 && (
        <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 -translate-y-5 scale-110">
           <div className="relative mb-3">
             <Crown className="absolute -top-9 left-1/2 -translate-x-1/2 h-9 w-9 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,1)] animate-pulse" />
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-yellow-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg">1</div>
             <CircleAvatar src={top1.avatarUrl || top1.coverUrl} fallback="1" size="lg" glowColor="yellow" />
           </div>
           <div className="w-full bg-gradient-to-b from-yellow-500/20 to-transparent border-t-2 border-yellow-500 pt-6 pb-4 flex flex-col items-center rounded-t-2xl shadow-[0_-15px_30px_rgba(234,179,8,0.15)]">
             <span className="text-[11px] font-black uppercase text-white truncate w-24 text-center tracking-wide">{top1.username || top1.name || 'User'}</span>
             <span className="text-yellow-400 font-black text-sm">{formatValue(getValue(top1))}</span>
           </div>
        </Link>
      )}

      {top3 && (
        <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex-1 flex flex-col items-center">
           <div className="relative mb-3">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-purple-500 font-black text-2xl italic opacity-30">3</div>
             <CircleAvatar src={top3.avatarUrl || top3.coverUrl} fallback="3" glowColor="purple" />
           </div>
           <div className="w-full bg-white/5 backdrop-blur-md border-t-2 border-purple-500/40 pt-4 pb-3 flex flex-col items-center rounded-t-2xl">
             <span className="text-[10px] font-black uppercase text-white/90 truncate w-20 text-center">{top3.username || top3.name || 'User'}</span>
             <span className="text-purple-400 font-black text-xs">{formatValue(getValue(top3))}</span>
           </div>
        </Link>
      )}
    </div>

    <LiveTimer />

    <div className="px-4 space-y-3">
      {others.map((item, index) => (
        <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} 
          className="flex items-center gap-4 p-3.5 bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all active:scale-[0.98]">
          <span className="text-base font-black italic text-white/10 w-6">{index + 4}</span>
          <CircleAvatar src={item.avatarUrl || item.coverUrl} fallback={(index+4).toString()} size="sm" glowColor="purple" />
          <div className="flex-1">
            <p className="text-xs font-black uppercase text-white/90 tracking-wide">{item.username || item.name || 'User'}</p>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Global Ranking</p>
          </div>
          <div className="text-right flex items-center gap-2">
            <span className="text-cyan-400 font-black text-sm">{formatValue(getValue(item))}</span>
            <GoldCoinIcon className="h-3.5 w-3.5" />
          </div>
        </Link>
      ))}
    </div>
  </div>
 );
};

export default function LeaderboardPage() {
 const searchParams = useSearchParams();
 const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>((searchParams.get('type') as any) || 'rich');
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: me } = useUserProfile(user?.uid);
 const [mounted, setMounted] = useState(false);

 useEffect(() => setMounted(true), []);
 
 const activeQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let coll = rankingType === 'rooms' ? 'chatRooms' : 'users';
    let field = rankingType === 'rich' ? 'wallet.dailySpent' : rankingType === 'charm' ? 'stats.dailyGiftsReceived' : rankingType === 'rooms' ? 'stats.dailyGifts' : 'stats.dailyGameWins';
    return query(collection(firestore, coll), orderBy(field, 'desc'), limit(50));
 }, [firestore, rankingType]);

 const { data: activeItems, isLoading } = useCollection(activeQuery);
 const myValue = useMemo(() => {
  if (!me) return 0;
  return (rankingType === 'rich' ? me.wallet?.dailySpent : me.stats?.dailyGiftsReceived) || 0;
 }, [me, rankingType]);

 if (!mounted) return null;

 return (
  <AppLayout>
  <div className="min-h-screen bg-[#020408] text-white relative font-sans flex flex-col overflow-hidden">
    {/* Subtle Animated Background Elements */}
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/5 blur-[120px] rounded-full" />
    <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />

    <header className="relative z-50 p-6 pt-10">
     <div className="flex items-center justify-between mb-8">
       <Link href="/rooms" className="p-2 -ml-2"><ChevronLeft className="h-6 w-6 text-cyan-400" /></Link>
       <h1 className="text-xl font-black uppercase tracking-[0.2em] italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500">Hall of Fame</h1>
       <div className="w-6" /> 
     </div>

     <div className="flex flex-col items-center">
        <div className="flex items-center justify-around w-full border-b border-white/5 pb-2">
        {[{ id: 'rich', label: 'Honor' }, { id: 'charm', label: 'Charm' }, { id: 'games', label: 'Game' }, { id: 'rooms', label: 'Room' }].map((tab) => (
            <button key={tab.id} onClick={() => setRankingMode(tab.id as any)} 
            className={cn("text-[10px] font-black uppercase tracking-widest transition-all px-2 py-1", rankingType === tab.id ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/20")}>
            {tab.label}
            </button>
        ))}
        </div>
        <div className="mt-3">
            <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-5 py-1 rounded-full tracking-[0.4em] shadow-[0_0_15px_rgba(34,211,238,0.1)]">DAILY</span>
        </div>
     </div>
    </header>

    <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
       <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
    </main>

    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-[#05070a]/80 backdrop-blur-xl border-t border-white/5 p-4 h-22 flex items-center shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto flex items-center gap-4 w-full">
       <div className="bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20"><span className="text-[10px] font-black text-cyan-500 italic">ME</span></div>
       <CircleAvatar src={me?.avatarUrl} fallback="U" size="sm" glowColor="cyan" />
       <div className="flex-1">
        <p className="font-black text-xs uppercase text-white/90 truncate">{me?.username || 'Player'}</p>
        <div className="flex items-center gap-2 mt-0.5">
           <GoldCoinIcon className="h-3 w-3" />
           <span className="text-sm font-black text-cyan-400">{myValue.toLocaleString()}</span>
        </div>
       </div>
       <div className="flex flex-col items-end gap-1">
         <div className="bg-green-500/10 border border-green-500/20 px-3 py-0.5 rounded-full flex items-center gap-1">
           <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
           <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">Live</span>
         </div>
       </div>
      </div>
    </footer>
   </div>
   </AppLayout>
 );
}
