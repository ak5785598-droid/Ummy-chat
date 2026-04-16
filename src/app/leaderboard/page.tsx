'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';

// --- MST THEME BACKGROUND (UPDATED: Purple, Brown, Pink Mix without Box Grid) ---
const ThemeBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#2e152b] via-[#2c1b18] to-[#3b1c32]">
    {/* Pink and Purple Dynamic Orbs */}
    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-pink-500/15 blur-[130px] rounded-full animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/15 blur-[130px] rounded-full animate-pulse [animation-delay:3s]" />
    
    {/* Brown tint overlay for depth */}
    <div className="absolute top-[40%] right-[-20%] w-[50%] h-[50%] bg-[#8B4513]/20 blur-[120px] rounded-full pointer-events-none" />

    {/* Vertical Scanning Light Beams (Golden Leaderboard Effect) */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-yellow-500/40 to-transparent" />
      <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-yellow-500/40 to-transparent" />
    </div>

    {/* Bottom Vignette for better readability of fixed footer */}
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1a0e14] to-transparent" />
  </div>
);

// --- Daily Countdown Component (UPDATED: 5:30 AM IST Reset Trigger Logic) ---
const DailyCountdown = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Get current UTC time, then convert to IST (UTC + 5:30)
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istTime = new Date(utcTime + (330 * 60000)); 
      
      // Target time: 5:30 AM IST
      const target = new Date(istTime);
      target.setHours(5, 30, 0, 0);
      
      // Agar aaj ke 5:30 AM nikal chuke hain, toh target agle din ka 5:30 AM hoga
      if (istTime.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      
      const diff = target.getTime() - istTime.getTime();
      
      // Reset Logic: 5:30 AM par UI refresh karega
      if (diff <= 1000) {
        window.location.reload();
      }

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-[#D4AF37]/10 border-y border-[#D4AF37]/30 my-4 backdrop-blur-md relative z-10 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
      <Clock className="h-4 w-4 text-[#D4AF37]" />
      <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-tighter">Resets at 5:30 AM in: {timeLeft}</span>
    </div>
  );
};

// --- CircleAvatar (UPDATED: Strictly Golden Borders) ---
const CircleAvatar = ({ src, fallback, size = "md" }: { src?: string, fallback: string, size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };
  const goldenGlow = "shadow-[0_0_15px_rgba(212,175,55,0.6)] border-[#D4AF37]"; // Pure Gold Theme

  return (
    <div className={cn("relative flex items-center justify-center p-0.5 rounded-full border-2 bg-slate-900", sizes[size], goldenGlow)}>
        <Avatar className="h-full w-full">
          <AvatarImage src={src} className="object-cover rounded-full" />
          <AvatarFallback className="bg-slate-900 text-[#D4AF37] font-black rounded-full">{fallback}</AvatarFallback>
        </Avatar>
    </div>
  );
};

const RankingList = ({ items, type, isLoading }: { items: any[] | null, type: string, isLoading: boolean }) => {
 if (isLoading) return (
  <div className="flex flex-col items-center py-40 gap-4 relative z-10">
   <Loader className="animate-spin text-[#D4AF37] h-10 w-10" />
   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]/60 animate-pulse">Syncing Daily Data...</p>
  </div>
 );

 const getValue = (item: any) => {
  const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
  if (type === 'rich') return item.wallet?.[`daily${fieldSuffix}`] || 0;
  return item.stats?.[`daily${fieldSuffix}`] || 0;
 };

 const activePlayers = (items || []).filter(item => getValue(item) > 0);

 if (activePlayers.length === 0) return (
  <div className="text-center py-40 opacity-40 relative z-10">
   <TrendingUp className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]/50" />
   <p className="font-bold uppercase text-sm text-[#D4AF37]/70">No Daily Legends Yet.</p>
  </div>
 );

 const top1 = activePlayers[0];
 const top2 = activePlayers[1];
 const top3 = activePlayers[2];
 const others = activePlayers.slice(3);

 const formatValue = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toLocaleString();
 };

 return (
  <div className="space-y-2 animate-in fade-in duration-700 pb-32 relative z-10">
    <div className="flex items-end justify-center gap-2 pt-10 px-2">
      {top2 && (
        <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
           <div className="relative mb-2">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#D4AF37] font-black text-2xl italic opacity-70">2</div>
             <CircleAvatar src={top2.avatarUrl || top2.coverUrl} fallback="2" />
           </div>
           <div className="w-full bg-gradient-to-b from-[#D4AF37]/20 to-transparent border-t-2 border-[#D4AF37]/60 pt-4 pb-2 flex flex-col items-center rounded-t-lg">
             <span className="text-[10px] font-black uppercase text-white truncate w-20 text-center">{top2.username || top2.name || 'User'}</span>
             <span className="text-[#D4AF37] font-bold text-xs">{formatValue(getValue(top2))} Coins</span>
           </div>
        </Link>
      )}

      {top1 && (
        <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 -translate-y-4 scale-110">
           <div className="relative mb-2">
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-black text-[10px] font-black px-3 py-0.5 rounded-full shadow-md">1</div>
             <CircleAvatar src={top1.avatarUrl || top1.coverUrl} fallback="1" size="lg" />
           </div>
           <div className="w-full bg-gradient-to-b from-[#D4AF37]/30 to-transparent border-t-2 border-[#D4AF37] pt-6 pb-2 flex flex-col items-center rounded-t-lg shadow-[0_-10px_20px_rgba(212,175,55,0.2)]">
             <span className="text-[11px] font-black uppercase text-white truncate w-24 text-center drop-shadow-md">{top1.username || top1.name || 'User'}</span>
             <span className="text-yellow-400 font-black text-sm drop-shadow-md">{formatValue(getValue(top1))} Coins</span>
           </div>
        </Link>
      )}

      {top3 && (
        <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex-1 flex flex-col items-center">
           <div className="relative mb-2">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#D4AF37] font-black text-2xl italic opacity-70">3</div>
             <CircleAvatar src={top3.avatarUrl || top3.coverUrl} fallback="3" />
           </div>
           <div className="w-full bg-gradient-to-b from-[#D4AF37]/20 to-transparent border-t-2 border-[#D4AF37]/60 pt-4 pb-2 flex flex-col items-center rounded-t-lg">
             <span className="text-[10px] font-black uppercase text-white truncate w-20 text-center">{top3.username || top3.name || 'User'}</span>
             <span className="text-[#D4AF37] font-bold text-xs">{formatValue(getValue(top3))} Coins</span>
           </div>
        </Link>
      )}
    </div>

    <DailyCountdown />

    <div className="px-4 space-y-3">
      {others.map((item, index) => (
        <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} 
          className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group hover:border-[#D4AF37]/70 transition-all backdrop-blur-md">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-yellow-600 opacity-40 group-hover:opacity-100 transition-opacity" />
          <span className="text-lg font-black italic text-white/20 w-6">{index + 4}</span>
          <CircleAvatar src={item.avatarUrl || item.coverUrl} fallback={(index+4).toString()} size="sm" />
          <div className="flex-1">
            <p className="text-xs font-black uppercase text-white tracking-wide">{item.username || item.name || 'User'}</p>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Global Player</p>
          </div>
          <div className="text-right flex items-center gap-2">
            <span className="text-[#D4AF37] font-black text-sm">{formatValue(getValue(item))}</span>
            <GoldCoinIcon className="h-3 w-3" />
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
 
 const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>(initialType);
 const [mounted, setMounted] = useState(false);

 useEffect(() => { setMounted(true); }, []);
 
 const richQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('wallet.dailySpent', '>', 0), orderBy('wallet.dailySpent', 'desc'), limit(50));
 }, [firestore]);

 const charmQuery = useMemoFirebase(() => {
  if (!firestore) return null;
  return query(collection(firestore, 'users'), where('stats.dailyGiftsReceived', '>', 0), orderBy('stats.dailyGiftsReceived', 'desc'), limit(50));
 }, [firestore]);

 const roomsQuery = useMemoFirebase(() => {
  if (!firestore) return null;
  return query(collection(firestore, 'chatRooms'), where('stats.dailyGifts', '>', 0), orderBy('stats.dailyGifts', 'desc'), limit(50));
 }, [firestore]);

 const gamesQuery = useMemoFirebase(() => {
  if (!firestore) return null;
  return query(collection(firestore, 'users'), where('stats.dailyGameWins', '>', 0), orderBy('stats.dailyGameWins', 'desc'), limit(50));
 }, [firestore]);

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

 const myValue = useMemo(() => {
  if (!me) return 0;
  if (rankingType === 'rich') return me.wallet?.dailySpent || 0;
  if (rankingType === 'charm') return (me as any).stats?.dailyGiftsReceived || 0;
  if (rankingType === 'games') return (me as any).stats?.dailyGameWins || 0;
  return 0;
 }, [me, rankingType]);

 if (!mounted) return null;

 return (
  <div className="min-h-screen text-white relative font-sans flex flex-col overflow-hidden bg-transparent">
    <ThemeBackground />
    
    <header className="relative z-50 p-6 pt-safe flex items-center justify-between backdrop-blur-md bg-black/20">
       <Link href="/rooms"><ChevronLeft className="h-6 w-6 text-[#D4AF37]" /></Link>
       <h1 className="text-xl font-black uppercase tracking-[0.2em] italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600">Hall of Fame</h1>
       <HelpCircle className="h-5 w-5 text-white/40" />
    </header>

    <div className="relative z-50 flex items-center justify-around border-b border-[#D4AF37]/20 pb-2 mb-2 bg-black/30 backdrop-blur-sm">
       {[
        { id: 'rich', label: 'Honor' },
        { id: 'charm', label: 'Charm' },
        { id: 'games', label: 'Game' },
        { id: 'rooms', label: 'Room' }
       ].map((tab) => (
        <div key={tab.id} className="flex flex-col items-center">
          <button onClick={() => setRankingMode(tab.id as any)} 
            className={cn("text-[10px] font-black uppercase tracking-widest transition-all py-2", rankingType === tab.id ? "text-[#D4AF37] scale-110" : "text-white/40")}>
            {tab.label}
          </button>
          {rankingType === tab.id && <span className="text-[8px] font-bold text-[#D4AF37] mt-[-4px] animate-pulse shadow-[0_0_10px_#D4AF37]">●</span>}
        </div>
       ))}
     </div>

     <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
       <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} />
    </main>

    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a0e14]/90 backdrop-blur-xl border-t border-[#D4AF37]/40 p-4 h-20 flex items-center shadow-[0_-10px_30px_rgba(212,175,55,0.1)]">
      <Link href="/profile" className="max-w-4xl mx-auto flex items-center gap-4 w-full active:scale-[0.98] transition-all">
       <span className="text-xs font-black text-[#D4AF37] italic">ME</span>
       <CircleAvatar src={me?.avatarUrl} fallback="U" size="sm" />
       <div className="flex-1">
        <p className="font-black text-xs uppercase text-white truncate">{me?.username || 'Tribe Member'}</p>
        <div className="flex items-center gap-2">
           <GoldCoinIcon className="h-3 w-3" />
           <span className="text-sm font-black text-[#D4AF37]">{myValue.toLocaleString()}</span>
        </div>
       </div>
       <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.2)]">
         <span className="text-[10px] font-black text-[#D4AF37]">SYNCED</span>
       </div>
      </Link>
    </footer>
   </div>
 );
}

export default function LeaderboardPage() {
 return (
  <AppLayout>
   <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#2e152b]"><Loader className="animate-spin text-[#D4AF37]" /></div>}>
    <LeaderboardContent />
   </Suspense>
  </AppLayout>
 );
}

