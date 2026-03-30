'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, ChevronLeft, HelpCircle, Loader, Trophy, Star, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';

// --- Countdown Timer (GMT +5:30 / IST) ---
const ResetTimer = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Calculate IST (GMT+5:30)
      const offset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + offset);
      
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
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[#d4af37] italic font-serif text-lg leading-none">Timing</span>
        <span className="text-white font-black tracking-widest text-2xl uppercase leading-none">GLOBAL RANKINGS</span>
      </div>
      <div className="text-[10px] bg-yellow-600/20 px-2.5 py-1 rounded border border-yellow-600/30 text-yellow-500 font-bold uppercase tracking-widest">
        RESET IN: {timeLeft}
          </div>
    </div>
  );
};

// --- Ornate Circular Avatar with Crowns and Wreaths ---
const OrnateAvatar = ({ src, fallback, rank, size = "md", withCrown, withWreath }: { src?: string, fallback: string, rank: number, size?: "sm" | "md" | "lg", withCrown?: boolean, withWreath?: boolean }) => {
  const baseClasses = "relative flex items-center justify-center p-1 overflow-visible";
  const sizes = { sm: "h-16 w-16", md: "h-24 w-24", lg: "h-32 w-32" };
  const borderStyles: Record<string, string> = {
    gold: "border-4 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.6)]",
    silver: "border-4 border-slate-300 shadow-[0_0_15px_rgba(200,200,200,0.5)]",
    bronze: "border-4 border-[#cd7f32] shadow-[0_0_15px_rgba(205,127,50,0.5)]"
  };

  const getBorderColor = () => {
    if (rank === 1) return borderStyles.gold;
    if (rank === 2) return borderStyles.silver;
    if (rank === 3) return borderStyles.bronze;
    return "border-4 border-[#d4af37]"; // default for other lists
  };

  return (
    <div className={cn(baseClasses, sizes[size])}>
      {/* Crown for Top 1 */}
      {withCrown && rank === 1 && (
        <Crown className="absolute -top-12 left-1/2 -translate-x-1/2 h-10 w-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce" />
      )}
      
      {/* Wreath for Top 2 */}
      {withWreath && rank === 2 && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-12 w-16 text-slate-300">
          <Zap className="h-full w-full opacity-30"/> {/* Place holder for wreath until custom svg is needed */}
        </div>
      )}

      {/* Main Avatar Container */}
      <div className={cn("relative w-full h-full rounded-full overflow-hidden bg-[#111] z-10 flex items-center justify-center", getBorderColor())}>
        <Avatar className="h-full w-full rounded-full">
          <AvatarImage src={src} className="object-cover" />
          <AvatarFallback className="bg-zinc-900 text-yellow-500 font-bold text-3xl">{fallback}</AvatarFallback>
        </Avatar>
      </div>

      {/* Smaller Ornate Rank Circle (1, 2, 3) */}
      {(rank === 1 || rank === 2 || rank === 3) && (
        <div className={cn("absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border-4 border-black z-20 flex items-center justify-center font-bold text-lg", rank===1 ? "bg-yellow-500 text-black h-10 w-10" : rank===2 ? "bg-slate-300 text-black h-8 w-8" : "bg-[#cd7f32] text-white h-8 w-8")}>
          {rank}
        </div>
      )}
    </div>
  );
};

// --- Ornate Platform Base for Podium ---
const OrnatePlatform = ({ rank, children }: { rank: number, children: React.ReactNode }) => {
  const goldText = "bg-gradient-to-b from-[#d4af37] to-[#8a6d3b] text-transparent bg-clip-text";
  
  const baseClasses = "relative flex flex-col items-center flex-1";
  const tieredYClasses = rank === 1 ? "-translate-y-12" : "";
  consttieredWidthClasses = rank === 1 ? "scale-110" : "scale-95";

  const getRankClasses = () => {
    if (rank === 1) return "h-32 bg-gradient-to-b from-[#2a1f0a] to-black";
    if (rank === 2) return "h-28 bg-[#1a1a1a]";
    return "h-24 bg-[#1a110a]";
  };

  const borderStyles: Record<string, string> = {
    gold: "border-t-4 border-[#d4af37] shadow-[0_-15px_35px_rgba(212,175,55,0.25)]",
    silver: "border-t-4 border-slate-400 shadow-[0_-10px_20px_rgba(200,200,200,0.2)]",
    bronze: "border-t-4 border-[#cd7f32] shadow-[0_-10px_20px_rgba(205,127,50,0.2)]"
  };

  return (
    <div className={cn(baseClasses, tieredYClasses, tieredWidthClasses)}>
      {/* Decorative Wreaths/Numbers behind Avatar */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 z-0 opacity-10">
        <Trophy className="h-20 w-20 text-[#d4af37] rotate-[15deg]"/>
        <Trophy className="h-20 w-20 text-[#d4af37] -rotate-[15deg]"/>
      </div>
      
      {children}
      
      {/* Platform */}
      <div className={cn("w-full mt-4 py-6 px-1 text-center rounded-t-3xl", getRankClasses(), rank === 1 ? borderStyles.gold : rank===2 ? borderStyles.silver : borderStyles.bronze)}>
          <div className="text-center w-full max-w-[120px] mx-auto">
            {/* Ornate Username */}
            <p className="text-[11px] font-black uppercase text-white truncate drop-shadow-[0_2px_4px_black] tracking-tight mb-0.5">
              {children && React.Children.only(children).props.item?.username || 'GUEST PLAYER'}
            </p>
            {/* Coins Value */}
            <p className={cn("font-black text-sm", rank===1 ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]" : rank===2 ? "text-slate-300" : "text-[#cd7f32]")}>
              {children && formatValue(getValue(React.Children.only(children).props.item, children.props.type)) + ' Coins'}
            </p>
          </div>
      </div>
      
      {/* Supporting Golden Lion element for platforms */}
      <div className="absolute -bottom-2 -left-3 h-10 w-10 text-yellow-600/30">
        < Zap className="h-full w-full rotate-[-45deg]" /> {/* Placeholder for custom lion asset */}
      </div>
      <div className="absolute -bottom-2 -right-3 h-10 w-10 text-yellow-600/30">
        < Zap className="h-full w-full rotate-[45deg]" /> {/* Placeholder for custom lion asset */}
      </div>
    </div>
  );
};

// Helper to get Coins value based on query fields
const getValue = (item: any, type: string) => {
    if (!item) return 0;
    if (type === 'rich') return item.wallet?.dailySpent || 0;
    if (type === 'charm') return item.stats?.dailyGiftsReceived || 0;
    if (type === 'games') return item.stats?.dailyGameWins || 0;
    if (type === 'rooms') return item.stats?.dailyGifts || 0;
    return 0;
};

// Helper for formatting values
const formatValue = (val: number) => {
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toLocaleString();
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: 'daily' | 'weekly' | 'monthly', isLoading: boolean }) => {
 if (isLoading) return (
  <div className="flex flex-col items-center py-40 gap-4">
   <Loader className="animate-spin text-yellow-500 h-10 w-10" />
   <p className="text-[10px] font-black uppercase text-yellow-600/60 tracking-widest">Loading Legends...</p>
  </div>
 );

 if (!items || items.length === 0) return <div className="text-center py-40 text-yellow-600/40 uppercase font-black">No Records Found</div>;

 const top1 = items[0]; const top2 = items[1]; const top3 = items[2];
 const others = items.slice(3);

 return (
  <div className="pb-40">
    {/* Podium Section */}
    <div className="relative flex items-end justify-center gap-1 pt-24 px-4 mb-16">
      
      {/* Rank 2 */}
      <OrnatePlatform rank={2}>
        <div item={top2} type={type}>
          <div className="relative mb-2">
            {/* Decorative Rank Number behind */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-slate-300 font-black text-6xl italic opacity-30 z-0 drop-shadow-[0_2px_4px_black]">2</div>
            <OrnateAvatar src={top2?.avatarUrl} fallback="2" rank={2} size="md" withWreath />
          </div>
        </div>
      </OrnatePlatform>

      {/* Rank 1 (Middle) */}
      <OrnatePlatform rank={1}>
        <div item={top1} type={type}>
          <div className="relative mb-2">
            {/* Decorative Rank Number behind */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-yellow-500 font-black text-7xl italic opacity-30 z-0 drop-shadow-[0_2px_4px_black]">1</div>
            <OrnateAvatar src={top1?.avatarUrl} fallback="1" rank={1} size="lg" withCrown />
          </div>
        </div>
      </OrnatePlatform>

      {/* Rank 3 */}
      <OrnatePlatform rank={3}>
        <div item={top3} type={type}>
          <div className="relative mb-2">
            {/* Decorative Rank Number behind */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-[#cd7f32] font-black text-6xl italic opacity-30 z-0 drop-shadow-[0_2px_4px_black]">3</div>
            <OrnateAvatar src={top3?.avatarUrl} fallback="3" rank={3} size="md" />
          </div>
        </div>
      </OrnatePlatform>
    </div>

    {/* Scrollable List for 4+ */}
    <div className="px-5 space-y-4">
      {others.map((item, index) => {
        const rank = index + 4;
        return (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-[#111] border border-[#d4af37]/10 rounded-2xl relative group overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] hover:border-yellow-600/20 transition-all">
            {/* Left Decorative Gold Line and Large Rank Number */}
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-600 to-transparent" />
            <div className="shrink-0 flex items-center justify-center h-12 w-10 text-[#d4af37] z-10">
              <span className="text-5xl font-black italic drop-shadow-[0_2px_4px_black]">{rank}</span>
            </div>

            {/* Circular Avatar */}
            <OrnateAvatar src={item.avatarUrl} fallback={(rank).toString()} rank={4} size="sm" />
            
            {/* Player Info */}
            <div className="flex-1 px-1">
              <p className="text-xs font-black uppercase text-white tracking-wide drop-shadow-[0_1px_2px_black] truncate">{item.username || 'Global Player'}</p>
              {/* LVL Placeholder */}
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">LVL 45 • Ranked Legend</p>
            </div>

            {/* Value and Small Icons */}
            <div className="text-right shrink-0">
                <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-yellow-500 font-black text-lg drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]">{formatValue(getValue(item, type))}</span>
                    <GoldCoinIcon className="h-4 w-4 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
                </div>
                <div className="flex items-center gap-1 justify-end opacity-40">
                    {item.wallet?.dailySpent > 0 && < Zap className="h-3 w-3 text-red-500"/>}
                    {item.stats?.dailyGiftsReceived > 0 && < Heart className="h-3 w-3 text-pink-500"/>}
                </div>
            </div>
            
            {/* Subtle ornate background texture for cards */}
            <div className="absolute bottom-0 right-0 h-10 w-10 text-yellow-600/20 z-0">
              < Zap className="h-full w-full rotate-[15deg]"/>
            </div>
          </div>
        );
      })}
    </div>
  </div>
 );
};

export default function LeaderboardPage() {
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: me } = useUserProfile(user?.uid);
 const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'games' | 'rooms'>('rich');

 // Queries ignore timePeriod and only fetch Daily
 const currentQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let field = 'wallet.dailySpent';
    if (rankingType === 'rich') field = 'wallet.dailySpent';
    if (rankingType === 'charm') field = 'stats.dailyGiftsReceived';
    if (rankingType === 'games') field = 'stats.dailyGameWins';
    if (rankingType === 'rooms') field = 'stats.dailyGifts';
    return query(collection(firestore, rankingType === 'rooms' ? 'chatRooms' : 'users'), orderBy(field, 'desc'), limit(50));
 }, [firestore, rankingType]);

 const { data: activeItems, isLoading } = useCollection(currentQuery);

 return (
  <AppLayout>
   <div className="min-h-screen bg-[#000] text-white relative flex flex-col font-serif">
     {/* Rich Ornate Gilded Architecture Background */}
     <div className="fixed inset-0 bg-[url('/bg-marble- ornate.jpg')] opacity-20 bg-cover bg-center pointer-events-none" />
     <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-900/40 via-black to-black pointer-events-none" />
     <div className="fixed top-0 left-0 h-screen w-full flex justify-between px-1 pointer-events-none">
       <div className="h-full w-10 bg-gradient-to-b from-yellow-700 to-transparent z-0"/>
       <div className="h-full w-10 bg-gradient-to-b from-yellow-700 to-transparent z-0"/>
     </div>
     
    <header className="relative z-50 p-6 pt-10">
     <div className="flex items-center justify-between mb-8">
       <Link href="/rooms"><ChevronLeft className="h-7 w-7 text-yellow-500" /></Link>
       <ResetTimer />
       <HelpCircle className="h-6 w-6 text-zinc-600" />
     </div>

     {/* Gilded Tab Controls */}
     <div className="flex items-center justify-between bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 shadow-3xl">
       {['rich', 'charm', 'game', 'room'].map((label) => {
         const id = label === 'game' ? 'games' : label === 'room' ? 'rooms' : label;
         return (
            <button key={id} onClick={() => setRankingMode(id as any)} 
              className={cn("flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl", 
              rankingType === id ? "bg-gradient-to-b from-[#d4af37] to-[#8a6d3b] text-black shadow-lg shadow-yellow-600/30" : "text-zinc-500 hover:text-white")}>
              {label}
            </button>
         );
       })}
     </div>
     
     {/* Subtitle "DAILY......" (Static as queries are Daily) */}
     <div className="text-center w-full mt-4">
       <span className="text-[#d4af37] italic font-serif text-lg leading-none drop-shadow-[0_1px_2px_black]">DAILY......</span>
     </div>
    </header>

    <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
       <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
    </main>

    {/* Fixed Bottom Ornate Profile Card */}
    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-b from-black/80 to-black/95 backdrop-blur-2xl border-t-2 border-[#d4af37]/30 p-5 h-26 flex items-center shadow-[0_-10px_20px_rgba(0,0,0,0.4)]">
      <div className="max-w-4xl mx-auto flex items-center gap-4 w-full px-4">
       <div className="relative">
         <OrnateAvatar src={me?.avatarUrl} fallback="ME" rank={me?.richRank || me?.charmRank || 0} size="sm" />
         <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg drop-shadow-[0_1px_2px_black]">YOU</div>
       </div>
       <div className="flex-1 px-1">
        <p className="font-black text-xs uppercase text-white mb-0.5 drop-shadow-[0_1px_2px_black] truncate">{me?.username || 'Guest Legend'}</p>
        <div className="flex items-center gap-1.5">
           <GoldCoinIcon className="h-4 w-4 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
           <span className="text-sm font-black text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]">
             {formatValue(getValue(me, rankingType)) + ' Coins'}
           </span>
        </div>
       </div>
       <div className="bg-[#d4af37]/10 border-2 border-[#d4af37]/30 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.2)]">
         <span className="text-xs font-black text-[#d4af37] italic uppercase tracking-widest drop-shadow-[0_1px_2px_black]">SYNCED</span>
       </div>
      </div>
    </footer>
   </div>
  </AppLayout>
 );
}
