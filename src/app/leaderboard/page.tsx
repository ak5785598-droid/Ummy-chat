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

// --- Avatar with Intense Neon Glow ---
const CircleAvatar = ({ src, fallback, size = "md", glowColor = "cyan" }: { src?: string, fallback: string, size?: "sm" | "md" | "lg", glowColor?: string }) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };
  const glows: Record<string, string> = {
    cyan: "shadow-[0_0_20px_rgba(34,211,238,0.5)] border-cyan-400/80 ring-4 ring-cyan-400/5",
    purple: "shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-500/80 ring-4 ring-purple-500/5",
    yellow: "shadow-[0_0_30px_rgba(234,179,8,0.6)] border-yellow-400 ring-4 ring-yellow-400/10"
  };

  return (
    <div className={cn("relative flex items-center justify-center p-0.5", sizes[size])}>
      <div className={cn("relative w-full h-full border-2 rounded-full flex items-center justify-center overflow-hidden bg-slate-900/90 backdrop-blur-md", glows[glowColor])}>
        <Avatar className="h-full w-full">
          <AvatarImage src={src} className="object-cover" />
          <AvatarFallback className="bg-slate-950 text-white font-black">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

// --- Pulsing Live Timer ---
const LiveTimer = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-4 mb-4 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent border-y border-white/5">
      <Clock className="h-3 w-3 text-cyan-400 animate-pulse" />
      <span className="text-[10px] font-mono text-cyan-100/40 tracking-[0.2em] uppercase">
        Next Reset: <span className="text-cyan-400 font-bold">{time}</span> (GMT+5:30)
      </span>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: string, isLoading: boolean }) => {
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-cyan-500 h-10 w-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/60">Loading Galaxy...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-30">
      <Trophy className="mx-auto mb-4 h-16 w-16" />
      <p className="font-bold uppercase text-xs tracking-widest">No Legends Found</p>
    </div>
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
    <div className="animate-in fade-in duration-1000 pb-32">
      {/* Podium Section with Graphic Glows */}
      <div className="flex items-end justify-center gap-1 pt-12 px-2 relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full -z-10 animate-pulse" />
        
        {top2 && (
          <Link href={`/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white/10 font-black text-2xl italic">2</div>
              <CircleAvatar src={top2.avatarUrl} fallback="2" glowColor="cyan" />
            </div>
            <div className="w-full bg-white/5 backdrop-blur-md border-t border-cyan-500/40 pt-4 pb-3 flex flex-col items-center rounded-t-2xl">
              <span className="text-[10px] font-black uppercase text-white/80 truncate w-20 text-center">{top2.username || 'User'}</span>
              <span className="text-cyan-400 font-black text-xs">{formatVal(getValue(top2))}</span>
            </div>
          </Link>
        )}

        {top1 && (
          <Link href={`/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 -translate-y-5 scale-110">
            <div className="relative mb-3">
              <Crown className="absolute -top-9 left-1/2 -translate-x-1/2 h-9 w-9 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,1)] animate-bounce" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-yellow-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg">1</div>
              <CircleAvatar src={top1.avatarUrl} fallback="1" size="lg" glowColor="yellow" />
            </div>
            <div className="w-full bg-gradient-to-b from-yellow-500/20 to-transparent border-t-2 border-yellow-500 pt-6 pb-4 flex flex-col items-center rounded-t-2xl shadow-[0_-15px_30px_rgba(234,179,8,0.15)]">
              <span className="text-[11px] font-black uppercase text-white truncate w-24 text-center tracking-wide">{top1.username || 'User'}</span>
              <span className="text-yellow-400 font-black text-sm">{formatVal(getValue(top1))}</span>
            </div>
          </Link>
        )}

        {top3 && (
          <Link href={`/profile/${top3.id}`} className="flex-1 flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white/10 font-black text-2xl italic">3</div>
              <CircleAvatar src={top3.avatarUrl} fallback="3" glowColor="purple" />
            </div>
            <div className="w-full bg-white/5 backdrop-blur-md border-t border-purple-500/40 pt-4 pb-3 flex flex-col items-center rounded-t-2xl">
              <span className="text-[10px] font-black uppercase text-white/80 truncate w-20 text-center">{top3.username || 'User'}</span>
              <span className="text-purple-400 font-black text-xs">{formatVal(getValue(top3))}</span>
            </div>
          </Link>
        )}
      </div>

      <LiveTimer />

      {/* Modern Rank List */}
      <div className="px-4 space-y-3">
        {others.map((item, index) => (
          <Link key={item.id} href={`/profile/${item.id}`} 
            className="flex items-center gap-4 p-3.5 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-lg font-black italic text-white/5 w-6">{index + 4}</span>
            <CircleAvatar src={item.avatarUrl} fallback={(index+4).toString()} size="sm" glowColor="purple" />
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-white/90 tracking-wide">{item.username || 'User'}</p>
              <p className="text-[9px] text-white/20 font-bold uppercase">Global Ranking</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-cyan-400 font-black text-sm">{formatVal(getValue(item))}</span>
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

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#02040a] text-white relative flex flex-col overflow-hidden">
        
        {/* --- Graphic Design Background Elements --- */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

        <header className="relative z-50 p-6 pt-10">
          <div className="flex items-center justify-between mb-8">
            <Link href="/rooms" className="p-2 -ml-2"><ChevronLeft className="h-6 w-6 text-cyan-400" /></Link>
            <h1 className="text-xl font-black uppercase tracking-[0.2em] italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500">Hall of Fame</h1>
            <HelpCircle className="h-5 w-5 text-white/20" /> 
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-around w-full bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10">
              {['rich', 'charm', 'games', 'rooms'].map((tab) => (
                <button key={tab} onClick={() => setRankingMode(tab as any)} 
                  className={cn("flex-1 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all", 
                  rankingType === tab ? "bg-cyan-500 text-black shadow-lg" : "text-white/30")}>
                  {tab === 'rich' ? 'Honor' : tab === 'charm' ? 'Charm' : tab === 'games' ? 'Game' : 'Room'}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-6 py-1 rounded-full tracking-[0.4em] shadow-[0_0_15px_rgba(34,211,238,0.1)]">DAILY</span>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
          <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
        </main>

        {/* --- Floating Footer Profile --- */}
        <footer className="fixed bottom-6 left-4 right-4 z-[100] bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center shadow-2xl">
          <div className="flex items-center gap-4 w-full">
            <div className="bg-cyan-500/10 p-0.5 rounded-full ring-2 ring-cyan-500/20">
              <CircleAvatar src={me?.avatarUrl} fallback="U" size="sm" glowColor="cyan" />
            </div>
            <div className="flex-1">
              <p className="font-black text-xs uppercase text-white/90 truncate">{me?.username || 'Player'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <GoldCoinIcon className="h-3 w-3" />
                <span className="text-sm font-black text-cyan-400">{(rankingType === 'rich' ? me?.wallet?.dailySpent : me?.stats?.dailyGiftsReceived || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-500 uppercase">Live</span>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
