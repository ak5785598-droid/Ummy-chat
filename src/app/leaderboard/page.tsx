'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, ChevronLeft, HelpCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';

// --- Countdown Timer Component (GMT +5:30) ---
const ResetTimer = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Calculate IST end of day (24:00:00)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
      
      const endOfDay = new Date(istNow);
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - istNow.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mins = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      
      setTimeLeft(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[#d4af37] italic font-serif text-lg">Timing</span>
      <span className="text-white font-bold tracking-widest text-lg uppercase">Global Rankings</span>
      <span className="ml-4 text-xs bg-black/40 px-2 py-0.5 rounded border border-yellow-600/30 text-yellow-500">IST {timeLeft}</span>
    </div>
  );
};

const CircularAvatar = ({ src, fallback, size = "md", border = "gold" }: { src?: string, fallback: string, size?: "sm" | "md" | "lg", border?: string }) => {
  const sizes = { sm: "h-12 w-12", md: "h-20 w-20", lg: "h-28 w-28" };
  const borderStyles: Record<string, string> = {
    gold: "border-2 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]",
    silver: "border-2 border-slate-300 shadow-[0_0_10px_rgba(200,200,200,0.3)]",
    bronze: "border-2 border-[#cd7f32] shadow-[0_0_10px_rgba(205,127,50,0.3)]"
  };

  return (
    <div className={cn("relative rounded-full overflow-hidden bg-black flex items-center justify-center", sizes[size], borderStyles[border])}>
      <Avatar className="h-full w-full rounded-full">
        <AvatarImage src={src} className="object-cover" />
        <AvatarFallback className="bg-[#1a1a1a] text-yellow-500 font-bold">{fallback}</AvatarFallback>
      </Avatar>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: 'daily' | 'weekly' | 'monthly', isLoading: boolean }) => {
 if (isLoading) return (
  <div className="flex flex-col items-center py-40 gap-4">
   <Loader className="animate-spin text-yellow-500 h-10 w-10" />
  </div>
 );

 if (!items || items.length === 0) return <div className="text-center py-40 text-yellow-600/40 uppercase font-bold">No Legends Recorded.</div>;

 const top1 = items[0]; const top2 = items[1]; const top3 = items[2];
 const others = items.slice(3);

 const getValue = (item: any) => {
    const fieldPrefix = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
    const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
    return type === 'rich' ? (item.wallet?.[`${fieldPrefix}${fieldSuffix}`] || 0) : (item.stats?.[`${fieldPrefix}${fieldSuffix}`] || 0);
 };

 const formatValue = (val: number) => {
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toLocaleString();
 };

 return (
  <div className="pb-32">
    {/* Podium Area */}
    <div className="relative flex items-end justify-center gap-1 pt-16 px-4 mb-10">
      
      {/* Rank 2 */}
      {top2 && (
        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom duration-700">
           <div className="relative mb-2">
             <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-slate-300 font-black text-3xl italic opacity-40">2</div>
             <CircularAvatar src={top2.avatarUrl} fallback="2" border="silver" />
           </div>
           <div className="w-full bg-[#1a140a] border-t-2 border-slate-400 p-2 text-center rounded-t-xl">
             <p className="text-[10px] font-black uppercase text-white truncate">{top2.username || 'User'}</p>
             <p className="text-slate-300 font-bold text-xs">{formatValue(getValue(top2))} XP</p>
           </div>
        </div>
      )}

      {/* Rank 1 */}
      {top1 && (
        <div className="flex-1 flex flex-col items-center z-10 -translate-y-6 scale-110 animate-in zoom-in duration-500">
           <div className="relative mb-3">
             <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 h-10 w-10 text-yellow-400 drop-shadow-[0_0_15px_gold] animate-pulse" />
             <CircularAvatar src={top1.avatarUrl} fallback="1" size="lg" border="gold" />
           </div>
           <div className="w-full bg-gradient-to-b from-[#3d2b0a] to-[#0a0a0a] border-t-4 border-[#d4af37] py-4 px-2 text-center rounded-t-2xl shadow-[0_-10px_30px_rgba(212,175,55,0.3)]">
             <p className="text-[11px] font-black uppercase text-white truncate">{top1.username || 'King'}</p>
             <p className="text-yellow-400 font-black text-sm">{formatValue(getValue(top1))} XP</p>
           </div>
        </div>
      )}

      {/* Rank 3 */}
      {top3 && (
        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom duration-700">
           <div className="relative mb-2">
             <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[#cd7f32] font-black text-3xl italic opacity-40">3</div>
             <CircularAvatar src={top3.avatarUrl} fallback="3" border="bronze" />
           </div>
           <div className="w-full bg-[#140e0a] border-t-2 border-[#cd7f32] p-2 text-center rounded-t-xl">
             <p className="text-[10px] font-black uppercase text-white truncate">{top3.username || 'User'}</p>
             <p className="text-[#cd7f32] font-bold text-xs">{formatValue(getValue(top3))} XP</p>
           </div>
        </div>
      )}
    </div>

    {/* List View */}
    <div className="px-4 space-y-4">
      {others.map((item, index) => (
        <div key={item.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#1a1a1a] to-transparent border border-yellow-900/30 rounded-2xl relative">
          <span className="text-xl font-black italic text-yellow-700/50 w-6">{index + 4}</span>
          <CircularAvatar src={item.avatarUrl} fallback="U" size="sm" border="gold" />
          <div className="flex-1">
            <p className="text-sm font-black uppercase text-white">{item.username || 'Legend'}</p>
            <p className="text-[10px] text-yellow-600/60 font-bold tracking-widest">LVL {item.stats?.level || 1}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-yellow-500 font-black text-sm">{formatValue(getValue(item))}</span>
            <span className="text-[8px] text-white/40 uppercase">Global XP</span>
          </div>
        </div>
      ))}
    </div>
  </div>
 );
};

export default function LeaderboardPage() {
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: me } = useUserProfile(user?.uid);
 const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'games' | 'rooms'>('rich');

 const currentQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let field = 'wallet.weeklySpent'; // Default
    if (rankingType === 'rich') field = 'wallet.dailySpent';
    if (rankingType === 'charm') field = 'stats.dailyGiftsReceived';
    if (rankingType === 'games') field = 'stats.dailyGameWins';
    if (rankingType === 'rooms') field = 'stats.dailyGifts';
    return query(collection(firestore, rankingType === 'rooms' ? 'chatRooms' : 'users'), orderBy(field, 'desc'), limit(50));
 }, [firestore, rankingType]);

 const { data: activeItems, isLoading } = useCollection(currentQuery);

 return (
  <AppLayout>
   <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
     {/* Background Decor */}
     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none" />
     <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#3d2b0a]/20 to-transparent pointer-events-none" />

    <header className="relative z-50 p-6 pt-10">
     <div className="flex items-center justify-between mb-8">
       <Link href="/rooms"><ChevronLeft className="h-6 w-6 text-yellow-500" /></Link>
       <ResetTimer />
       <HelpCircle className="h-5 w-5 text-white/20" />
     </div>

     {/* Gold Navigation Tabs */}
     <div className="flex items-center justify-between bg-black/60 border border-yellow-600/30 rounded-full p-1 shadow-inner">
       {['rich', 'charm', 'games', 'rooms'].map((tab) => (
        <button key={tab} onClick={() => setRankingMode(tab as any)} 
          className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-tighter transition-all rounded-full", 
          rankingType === tab ? "bg-gradient-to-b from-[#d4af37] to-[#8a6d3b] text-black shadow-lg" : "text-yellow-600/60")}>
          {tab}
        </button>
       ))}
     </div>
    </header>

    <main className="relative z-10 flex-1 overflow-y-auto max-h-[80vh] no-scrollbar">
       <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
    </main>

    {/* Royal Footer */}
    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-xl border-t-2 border-[#d4af37]/30 p-4 h-24 flex items-center">
      <div className="max-w-4xl mx-auto flex items-center gap-4 w-full px-4">
       <div className="relative">
         <CircularAvatar src={me?.avatarUrl} fallback="ME" size="sm" border="gold" />
         <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[8px] font-black px-1 rounded">YOU</div>
       </div>
       <div className="flex-1">
        <p className="font-black text-xs uppercase text-white">{me?.username || 'Gamer'}</p>
        <div className="flex items-center gap-1">
           <GoldCoinIcon className="h-3 w-3" />
           <span className="text-sm font-black text-yellow-500">
             {rankingType === 'rich' ? (me?.wallet?.dailySpent || 0).toLocaleString() : (me?.stats?.dailyGiftsReceived || 0).toLocaleString()}
           </span>
        </div>
       </div>
       <div className="border-2 border-yellow-600/50 px-4 py-2 rounded-lg bg-[#d4af37]/10">
         <p className="text-[10px] font-black text-yellow-500 italic uppercase">Ranking...</p>
       </div>
      </div>
    </footer>
   </div>
  </AppLayout>
 );
}
