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
    <div className={cn("relative flex items-center justify-center p-0.5 animate-in zoom-in duration-500", sizes[size])}>
      <div className={cn("relative w-full h-full border-2 rounded-full flex items-center justify-center overflow-hidden bg-slate-900/90 backdrop-blur-md", glows[glowColor])}>
        <Avatar className="h-full w-full rounded-full">
          <AvatarImage src={src} className="object-cover" />
          <AvatarFallback className="bg-slate-950 text-white font-black">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

// --- Pulsing Live Timer (GMT+5:30) with Neon Pulse ---
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
    <div className="flex items-center justify-center gap-3 py-4 mb-4 relative overflow-hidden bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse" />
      <Clock className="h-4 w-4 text-cyan-400 animate-spin-slow" />
      <span className="text-[11px] font-mono text-cyan-100/60 tracking-[0.3em] uppercase z-10">
        Update: GMT+5:30 <span className="text-cyan-400 font-bold">{time}</span>
      </span>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: string, isLoading: boolean }) => {
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-cyan-500 h-10 w-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/60">Loading galaxy depth...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-30">
      <Trophy className="mx-auto mb-4 h-16 w-16" />
      <p className="font-bold uppercase text-xs tracking-widest">No Legends Detected</p>
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-40">
      {/* Podium Section with 3D Depth Auras */}
      <div className="flex items-end justify-center gap-1.5 pt-16 px-3 relative mb-4">
        {/* Dynamic Neon Background Aura for Winners */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -z-10 animate-pulse" />
        
        {top2 && (
          <Link href={`/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-slate-400 font-black text-3xl italic opacity-20">2</div>
              <CircleAvatar src={top2.avatarUrl} fallback="2" glowColor="cyan" />
            </div>
            <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 border-t-cyan-500/50 pt-5 pb-4 flex flex-col items-center rounded-2xl shadow-2xl transition-transform hover:scale-[1.02]">
              <span className="text-[10px] font-black uppercase text-white/90 truncate w-20 text-center tracking-tighter">{top2.username || 'User'}</span>
              <span className="text-cyan-400 font-black text-sm mt-1">{formatVal(getValue(top2))}</span>
            </div>
          </Link>
        )}

        {top1 && (
          <Link href={`/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 -translate-y-8 scale-[1.15]">
            <div className="relative mb-4">
              <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 h-10 w-10 text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,1)] animate-bounce" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-[10px] font-black px-3 py-0.5 rounded-full shadow-xl ring-2 ring-black">1</div>
              <CircleAvatar src={top1.avatarUrl} fallback="1" size="lg" glowColor="yellow" />
            </div>
            <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-yellow-500/30 border-t-yellow-500 pt-7 pb-5 flex flex-col items-center rounded-2xl shadow-[0_-20px_40px_rgba(234,179,8,0.15)] transition-transform hover:scale-[1.02]">
              <span className="text-[11px] font-black uppercase text-white truncate w-24 text-center tracking-wider">{top1.username || 'User'}</span>
              <span className="text-yellow-400 font-black text-base drop-shadow-sm">{formatVal(getValue(top1))}</span>
            </div>
          </Link>
        )}

        {top3 && (
          <Link href={`/profile/${top3.id}`} className="flex-1 flex flex-col items-center group">
            <div className="relative mb-4">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-purple-400 font-black text-3xl italic opacity-20">3</div>
              <CircleAvatar src={top3.avatarUrl} fallback="3" glowColor="purple" />
            </div>
            <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 border-t-purple-500/50 pt-5 pb-4 flex flex-col items-center rounded-2xl shadow-2xl transition-transform hover:scale-[1.02]">
              <span className="text-[10px] font-black uppercase text-white/90 truncate w-20 text-center tracking-tighter">{top3.username || 'User'}</span>
              <span className="text-purple-400 font-black text-sm mt-1">{formatVal(getValue(top3))}</span>
            </div>
          </Link>
        )}
      </div>

      <LiveTimer />

      {/* 3D Glass Ranking List (No Falling Coins) */}
      <div className="px-5 space-y-4">
        {others.map((item, index) => (
          <Link key={item.id} href={`/profile/${item.id}`} 
            className="flex items-center gap-4 p-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl relative overflow-hidden group hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-500 opacity-20 group-hover:opacity-100 transition-opacity" />
            <span className="text-xl font-black italic text-white/5 w-8 text-center">{index + 4}</span>
            <CircleAvatar src={item.avatarUrl} fallback={(index+4).toString()} size="sm" glowColor="purple" />
            <div className="flex-1">
              <p className="text-sm font-black uppercase text-white/90 tracking-wide">{item.username || 'User'}</p>
              <p className="text-[10px] text-cyan-400/40 font-bold uppercase tracking-widest">Global Elite Player</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-cyan-400 font-black text-base">{formatVal(getValue(item))}</span>
              <GoldCoinIcon className="h-4 w-4" />
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
      <div className="min-h-screen bg-[#03070c] text-white relative font-sans flex flex-col overflow-hidden">
        
        {/* --- Advanced 3D Space Background Layering --- */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-cyan-600/10 via-transparent to-transparent -z-10 animate-flicker-slow" />
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -z-10 animate-pulse-slow" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full -z-10" />
        
        {/* Subtly animated mesh Pattern for 3D depth overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10 animate-noise-slow" />

        <header className="relative z-50 p-6 pt-12">
          <div className="flex items-center justify-between mb-10">
            <Link href="/rooms" className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-transform"><ChevronLeft className="h-6 w-6 text-cyan-400" /></Link>
            <h1 className="text-2xl font-black uppercase tracking-[0.3em] italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">Hall of Fame</h1>
            <HelpCircle className="h-6 w-6 text-white/20" /> 
          </div>

          <div className="flex flex-col items-center">
            {/* Glass Tab Bar with Neon Glow Tabs */}
            <div className="flex items-center justify-around w-full bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              {['rich', 'charm', 'games', 'rooms'].map((tab) => (
                <button key={tab} onClick={() => setRankingMode(tab as any)} 
                  className={cn("flex-1 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all", 
                  rankingType === tab ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]" : "text-white/40 hover:text-white/70")}>
                  {tab === 'rich' ? 'Honor' : tab === 'charm' ? 'Charm' : tab === 'games' ? 'Game' : 'Room'}
                </button>
              ))}
            </div>
            <div className="mt-5 relative">
              <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full" />
              <span className="relative text-[10px] font-black text-cyan-400 bg-black border border-cyan-400/30 px-8 py-1.5 rounded-full tracking-[0.5em] shadow-inner">DAILY</span>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
          <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
        </main>

        {/* --- Floating Footer Profile (No Coins falling behind) --- */}
        <footer className="fixed bottom-6 left-4 right-4 z-[100] bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20" />
              <CircleAvatar src={me?.avatarUrl} fallback="U" size="sm" glowColor="cyan" />
            </div>
            <div className="flex-1">
              <p className="font-black text-xs uppercase text-white tracking-widest truncate">{me?.username || 'Player Tribe'}</p>
              <div className="flex items-center gap-2 mt-1">
                <GoldCoinIcon className="h-4 w-4" />
                <span className="text-base font-black text-cyan-400">{(rankingType === 'rich' ? me?.wallet?.dailySpent : me?.stats?.dailyGiftsReceived || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-2xl flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]" />
              <span className="text-[10px] font-black text-green-500 uppercase">Synced Live</span>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
