'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, ChevronLeft, HelpCircle, Clock, Loader, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';

// --- Simple Neon Avatar ---
const CircleAvatar = ({ src, fallback, size = "md", glowColor = "cyan" }: { src?: string, fallback: string, size?: "sm" | "md" | "lg", glowColor?: string }) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };
  const glows: Record<string, string> = {
    cyan: "shadow-[0_0_15px_rgba(34,211,238,0.4)] border-cyan-400/60",
    purple: "shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-500/60",
    yellow: "shadow-[0_0_25px_rgba(234,179,8,0.5)] border-yellow-400/80"
  };

  return (
    <div className={cn("relative flex items-center justify-center p-0.5", sizes[size])}>
      <div className={cn("relative w-full h-full border-2 rounded-full flex items-center justify-center overflow-hidden bg-slate-900/90", glows[glowColor])}>
        <Avatar className="h-full w-full">
          <AvatarImage src={src} className="object-cover" />
          <AvatarFallback className="bg-slate-950 text-white font-bold">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

const LiveTimer = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-3 mb-4 bg-white/5 border-y border-white/5">
      <Clock className="h-3 w-3 text-cyan-400 animate-pulse" />
      <span className="text-[10px] font-mono text-cyan-100/40 tracking-widest uppercase">
        RESET: <span className="text-cyan-400 font-bold">{time}</span>
      </span>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: string, isLoading: boolean }) => {
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-cyan-500 h-8 w-8" />
      <p className="text-[10px] font-bold text-cyan-400/60 tracking-widest uppercase">Syncing Data...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-30"><Trophy className="mx-auto mb-4 h-12 w-12" /><p className="text-xs uppercase">No Data</p></div>
  );

  const [top1, top2, top3, ...others] = items;
  const getValue = (item: any) => {
    const p = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
    const s = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
    return (type === 'rich' ? item.wallet?.[`${p}${s}`] : item.stats?.[`${p}${s}`]) || 0;
  };

  const formatVal = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    return v.toLocaleString();
  };

  return (
    <div className="pb-32 px-4">
      {/* 3D-Look Podium */}
      <div className="flex items-end justify-center gap-1.5 pt-12 pb-8 relative">
        {/* Central Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full -z-10" />
        
        {top2 && (
          <Link href={`/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
            <CircleAvatar src={top2.avatarUrl} fallback="2" glowColor="cyan" />
            <div className="w-full mt-3 bg-white/5 backdrop-blur-lg border-t border-cyan-500/30 p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/70 truncate w-full text-center uppercase">{top2.username || 'User'}</span>
              <span className="text-cyan-400 font-black text-xs">{formatVal(getValue(top2))}</span>
            </div>
          </Link>
        )}

        {top1 && (
          <Link href={`/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 -translate-y-4 scale-110">
            <div className="relative mb-2">
              <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-400 drop-shadow-lg" />
              <CircleAvatar src={top1.avatarUrl} fallback="1" size="lg" glowColor="yellow" />
            </div>
            <div className="w-full bg-yellow-500/10 backdrop-blur-xl border-t-2 border-yellow-500 p-4 rounded-xl flex flex-col items-center shadow-2xl">
              <span className="text-[11px] font-black text-white truncate w-full text-center uppercase tracking-tight">{top1.username || 'User'}</span>
              <span className="text-yellow-400 font-black text-sm">{formatVal(getValue(top1))}</span>
            </div>
          </Link>
        )}

        {top3 && (
          <Link href={`/profile/${top3.id}`} className="flex-1 flex flex-col items-center">
            <CircleAvatar src={top3.avatarUrl} fallback="3" glowColor="purple" />
            <div className="w-full mt-3 bg-white/5 backdrop-blur-lg border-t border-purple-500/30 p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/70 truncate w-full text-center uppercase">{top3.username || 'User'}</span>
              <span className="text-purple-400 font-black text-xs">{formatVal(getValue(top3))}</span>
            </div>
          </Link>
        )}
      </div>

      <LiveTimer />

      <div className="space-y-3">
        {others.map((item, index) => (
          <Link key={item.id} href={`/profile/${item.id}`} 
            className="flex items-center gap-4 p-3 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <span className="text-lg font-black italic text-white/10 w-6">{index + 4}</span>
            <CircleAvatar src={item.avatarUrl} fallback="U" size="sm" glowColor="purple" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase text-white/90">{item.username || 'User'}</p>
              <p className="text-[9px] text-white/30 font-bold uppercase">Ranking Player</p>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
              <span className="text-cyan-400 font-black text-xs">{formatVal(getValue(item))}</span>
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

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#05070a] text-white relative flex flex-col overflow-hidden">
        
        {/* --- Graphic Design Elements (Simplified to prevent errors) --- */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[20%] right-[-10%] w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <header className="relative z-50 p-6 pt-10">
          <div className="flex items-center justify-between mb-8">
            <Link href="/rooms" className="p-2 -ml-2"><ChevronLeft className="h-6 w-6 text-cyan-400" /></Link>
            <h1 className="text-xl font-black uppercase tracking-widest italic text-white/90">Hall of Fame</h1>
            <HelpCircle className="h-5 w-5 text-white/20" /> 
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-around w-full bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10">
              {['rich', 'charm', 'games', 'rooms'].map((tab) => (
                <button key={tab} onClick={() => setRankingMode(tab as any)} 
                  className={cn("flex-1 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all", 
                  rankingType === tab ? "bg-cyan-500 text-black shadow-lg" : "text-white/40 hover:text-white/60")}>
                  {tab === 'rich' ? 'Honor' : tab === 'charm' ? 'Charm' : tab === 'games' ? 'Game' : 'Room'}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-6 py-1 rounded-full tracking-[0.3em]">DAILY</span>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
          <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
        </main>

        <footer className="fixed bottom-6 left-4 right-4 z-[100] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex items-center shadow-2xl">
          <div className="flex items-center gap-4 w-full">
            <CircleAvatar src={me?.avatarUrl} fallback="U" size="sm" glowColor="cyan" />
            <div className="flex-1">
              <p className="font-bold text-xs uppercase text-white/90 truncate">{me?.username || 'Player'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <GoldCoinIcon className="h-3 w-3" />
                <span className="text-sm font-black text-cyan-400">{(rankingType === 'rich' ? me?.wallet?.dailySpent : me?.stats?.dailyGiftsReceived || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 uppercase">Live</span>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
