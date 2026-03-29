
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, ChevronRight, Star, Sparkles, Trophy, Gamepad2, Zap, Heart, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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
import { PlaceHolderImages } from '@/lib/placeholder-images';

const ICON_MAP: Record<string, any> = {
 Sparkles,
 Trophy,
 Gamepad2,
 Zap,
 Star,
 Users,
 Heart
};

const SVIPBadge = ({ level }: { level: number }) => (
 <div className={cn(
  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm border border-orange-500/50 shadow-lg scale-90 origin-left",
  "bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 animate-shimmer-fast"
 )}>
  <span className="text-[7px] font-black text-white uppercase tracking-tighter leading-none">SVIP {level || 1}</span>
 </div>
);

const LevelBadge = ({ level }: { level: number | any }) => {
  const displayLevel = typeof level === 'number' ? level : (level?.rich || 1);
  return (
   <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#b45309] border border-white/20 scale-90 origin-left shadow-md">
    <Star className="h-2 w-2 text-white fill-current" />
    <span className="text-[7px] font-bold text-white leading-none">Lv.{displayLevel}</span>
   </div>
  );
};

const RankingCountdown = ({ period }: { period: 'daily' | 'weekly' | 'monthly' }) => {
 const [timeLeft, setTimeLeft] = useState<string | null>(null);

 useEffect(() => {
  const updateCountdown = () => {
   const now = new Date();
   // Get current time in IST (GMT +5:30)
   const istTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
   const istDate = new Date(istTimeStr);
   
   let target = new Date(istTimeStr);

   if (period === 'daily') {
    // Daily reset: 23:59:59 today
    target.setHours(23, 59, 59, 999);
   } else if (period === 'weekly') {
    // Weekly reset: End of Sunday
    const day = target.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToSunday = 7 - (day === 0 ? 7 : day);
    target.setDate(target.getDate() + diffToSunday);
    target.setHours(23, 59, 59, 999);
   } else if (period === 'monthly') {
    // Monthly reset: Last day of month
    target.setMonth(target.getMonth() + 1, 0); // Last day of current month
    target.setHours(23, 59, 59, 999);
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
    // Days/Hours/Mins/Sec format for Weekly and Monthly
    setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
   }
  };

  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
  return () => clearInterval(interval);
 }, [period]);

 if (!timeLeft) return <div className="h-12" />;

 return (
  <div className="mt-8 mb-4 flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-1000">
    <div className="bg-black/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/5 flex items-center gap-2">
     <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
     <span className="text-[8px] font-bold uppercase text-white/40 tracking-[0.3em] ">Reset Sync (GMT+5:30)</span>
    </div>
    <span className="text-2xl font-bold text-white drop-shadow-lg tabular-nums tracking-tight uppercase">{timeLeft}</span>
  </div>
 );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: 'daily' | 'weekly' | 'monthly', isLoading: boolean }) => {
 if (isLoading) return (
  <div className="flex flex-col items-center py-40 gap-4">
   <Loader className="animate-spin text-primary h-10 w-10" />
   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 animate-pulse">Ascending the Throne...</p>
  </div>
 );

 if (!items || items.length === 0) return (
  <div className="text-center py-40 opacity-40">
   <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/20" />
   <p className="font-bold uppercase text-sm text-white/40">The chronicles are empty.</p>
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

 const getDisplayName = (item: any) => {
  if (type === 'rooms') return item.name || item.title || 'Tribe Room';
  return item.username || 'Ummy User';
 };

 const getDisplayImage = (item: any) => {
  if (type === 'rooms') return item.coverUrl || undefined;
  return item.avatarUrl || undefined;
 };

 const formatValue = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toLocaleString();
 };

 return (
  <div className="space-y-4 animate-in fade-in duration-1000 relative pb-40">
   <div className="relative pt-4 flex flex-col items-center">
    {top1 && (
     <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="relative z-30 flex flex-col items-center mb-12 group transition-all active:scale-95">
       <div className="relative">
         <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 h-24 bg-yellow-500/10 blur-3xl opacity-50" />
         <div className="relative z-10 w-28 h-28 aspect-square">
           <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
            <img src="https://img.icons8.com/color/96/crown.png" className="h-10 w-10 drop-shadow-2xl animate-bounce" alt="Crown" />
           </div>
           <div className="relative w-full h-full p-1 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)] border-[3px] border-[#1a1a1a]">
            <Avatar className="h-full w-full border-2 border-yellow-200 rounded-full overflow-hidden">
              <AvatarImage src={getDisplayImage(top1)} className="object-cover h-full w-full" />
              <AvatarFallback className="bg-slate-900 text-white font-black text-xl">1</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-b from-red-500 to-red-700 text-white px-3 py-0.5 rounded-full font-black text-[9px] shadow-xl border border-yellow-400 whitespace-nowrap z-20">TOP 1</div>
           </div>
         </div>
       </div>
       <div className="mt-6 text-center space-y-1">
        <h2 className="text-[15px] font-black text-white uppercase drop-shadow-md tracking-tighter leading-none mb-2">{getDisplayName(top1)}</h2>
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          {top1.svip && <SVIPBadge level={top1.svip} />}
          <LevelBadge level={top1.level} />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-yellow-500 font-bold">
          <GoldCoinIcon className="h-4 w-4" />
          <span className="text-base ">{formatValue(getValue(top1))}</span>
        </div>
       </div>
     </Link>
    )}

    <div className="flex items-end justify-center gap-3 w-full max-sm px-2 relative z-20">
      {top2 && (
       <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex-1 bg-gradient-to-b from-[#252b41] to-[#1a1f30] rounded-2xl border-2 border-blue-400/20 p-3 pt-10 flex flex-col items-center gap-1.5 shadow-2xl relative transition-all active:scale-95 group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 aspect-square">
          <div className="relative w-full h-full bg-gradient-to-b from-blue-200 to-blue-500 rounded-full p-1 border-[3px] border-[#1a1a1a]">
           <Avatar className="h-full w-full border border-white/20 rounded-full overflow-hidden">
             <AvatarImage src={getDisplayImage(top2)} className="object-cover h-full w-full" />
             <AvatarFallback className="font-bold">2</AvatarFallback>
           </Avatar>
           <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-b from-blue-600 to-blue-800 text-white px-2 py-0.5 rounded-full font-bold text-[7px] border border-blue-200 shadow-lg">TOP 2</div>
          </div>
        </div>
        <p className="font-black text-xs text-[#fbc02d] uppercase truncate w-24 text-center mt-2 tracking-tighter leading-none">{getDisplayName(top2)}</p>
        <div className="flex items-center gap-1 scale-[0.7] origin-center my-0.5">
          {top2.svip && <SVIPBadge level={top2.svip} />}
          <LevelBadge level={top2.level} />
        </div>
        <div className="flex items-center justify-center gap-1 text-yellow-500">
          <GoldCoinIcon className="h-2.5 w-2.5" />
          <span className="text-[10px] font-bold ">{formatValue(getValue(top2))}</span>
        </div>
       </Link>
      )}

      {top3 && (
       <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex-1 bg-gradient-to-b from-[#2d221a] to-[#1f1610] rounded-2xl border-2 border-amber-400/20 p-3 pt-10 flex flex-col items-center gap-1.5 shadow-2xl relative transition-all active:scale-95 group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 aspect-square">
          <div className="relative w-full h-full bg-gradient-to-b from-amber-200 to-amber-500 rounded-full p-1 border-[3px] border-[#1a1a1a]">
           <Avatar className="h-full w-full border border-white/20 rounded-full overflow-hidden">
             <AvatarImage src={getDisplayImage(top3)} className="object-cover h-full w-full" />
             <AvatarFallback className="font-bold text-xs">3</AvatarFallback>
           </Avatar>
           <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-b from-amber-600 to-amber-800 text-white px-2 py-0.5 rounded-full font-bold text-[7px] border border-amber-200 shadow-lg">TOP 3</div>
          </div>
        </div>
        <p className="font-black text-xs text-white uppercase truncate w-24 text-center mt-2 tracking-tighter leading-none">{getDisplayName(top3)}</p>
        <div className="flex items-center gap-1 scale-[0.7] origin-center my-0.5">
          {top3.svip && <SVIPBadge level={top3.svip} />}
          <LevelBadge level={top3.level} />
        </div>
        <div className="flex items-center justify-center gap-1 text-yellow-500">
          <GoldCoinIcon className="h-2.5 w-2.5" />
          <span className="text-[10px] font-bold ">{formatValue(getValue(top3))}</span>
        </div>
       </Link>
      )}
    </div>

    <RankingCountdown period={period} />
   </div>

   <div className="mt-6 space-y-1 px-2">
    {others.map((item, index) => (
     <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} className="flex items-center gap-2.5 p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/5 group hover:bg-white/10 transition-all active:scale-[0.98]">
      <span className="w-4 text-center font-bold text-white/40 text-[10px] ">{index + 4}</span>
      <Avatar className="h-9 w-9 border border-white/10 shrink-0">
       <AvatarImage src={getDisplayImage(item)} />
       <AvatarFallback className="font-bold text-[10px]">{(index + 4)}</AvatarFallback>
      </Avatar>
       <div className="flex-1 min-w-0">
        <p className="font-black text-[12px] uppercase text-yellow-500 truncate tracking-tighter leading-none mb-1.5">{getDisplayName(item)}</p>
        <div className="flex items-center gap-1 scale-[0.8] origin-left">
          {item.svip && <SVIPBadge level={item.svip} />}
          <LevelBadge level={item.level} />
        </div>
       </div>
      <div className="text-right flex items-center gap-1 shrink-0">
       <span className="font-bold text-[11px] text-white/80 ">{formatValue(getValue(item))}</span>
       <GoldCoinIcon className="h-3 w-3 text-yellow-500" />
      </div>
     </Link>
    ))}
   </div>
  </div>
 );
};

const BannerDisplay = () => {
 const firestore = useFirestore();
 const bannerRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'banners'), [firestore]);
 const { data: bannerConfig, isLoading } = useDoc(bannerRef);

 if (isLoading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-primary h-8 w-8" /></div>;

 const slides = bannerConfig?.slides || [];

 if (slides.length === 0) return (
  <div className="text-center py-20 opacity-40">
   <p className="font-bold uppercase text-xs text-white/40">No active events in the grid.</p>
  </div>
 );

 return (
  <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
    {slides.map((slide: any, idx: number) => {
     const Icon = ICON_MAP[slide.iconName] || Sparkles;
     return (
      <div key={idx} className="relative h-24 w-full rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black group active:scale-[0.98] transition-all">
       <Image src={slide.imageUrl || 'https://picsum.photos/seed/promo/800/200'} alt={slide.title} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" unoptimized />
       <div className={cn("absolute inset-0 bg-gradient-to-r via-transparent to-transparent flex flex-col justify-center px-8", slide.color || "from-black/40")}>
         <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-white animate-pulse" />
          <h4 className="text-white font-bold uppercase text-2xl tracking-tight leading-none drop-shadow-lg">{slide.title}</h4>
         </div>
         <p className="text-white/80 font-bold uppercase text-[10px] tracking-[0.3em] drop-shadow-md">{slide.subtitle}</p>
       </div>
       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>
     );
    })}
  </div>
 );
};

function LeaderboardContent() {
 const searchParams = useSearchParams();
 const initialType = (searchParams.get('type') as any) || 'rich';
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile: me } = useUserProfile(user?.uid);
 
 const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'banner' | 'games'>(initialType);
 const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
 const [mounted, setMounted] = useState(false);

 useEffect(() => { setMounted(true); }, []);
 useEffect(() => { if (initialType) setRankingMode(initialType); }, [initialType]);

  const richQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = timePeriod === 'daily' ? 'wallet.dailySpent' : timePeriod === 'weekly' ? 'wallet.weeklySpent' : 'wallet.monthlySpent';
    return query(collection(firestore, 'users'), orderBy(field, 'desc'), limit(50));
  }, [firestore, timePeriod]);

  const charmQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = timePeriod === 'daily' ? 'stats.dailyGiftsReceived' : timePeriod === 'weekly' ? 'stats.weeklyGiftsReceived' : 'stats.monthlyGiftsReceived';
    return query(collection(firestore, 'users'), orderBy(field, 'desc'), limit(50));
  }, [firestore, timePeriod]);

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = timePeriod === 'daily' ? 'stats.dailyGifts' : timePeriod === 'weekly' ? 'stats.weeklyGifts' : 'stats.monthlyGifts';
    return query(collection(firestore, 'chatRooms'), orderBy(field, 'desc'), limit(50));
  }, [firestore, timePeriod]);

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = timePeriod === 'daily' ? 'stats.dailyGameWins' : timePeriod === 'weekly' ? 'stats.weeklyGameWins' : 'stats.monthlyGameWins';
    return query(collection(firestore, 'users'), orderBy(field, 'desc'), limit(50));
  }, [firestore, timePeriod]);

 const { data: richUsers, isLoading: isLoadingRich } = useCollection(richQuery);
 const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmQuery);
 const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);
 const { data: gameUsers, isLoading: isLoadingGames } = useCollection(gamesQuery);

 const rankingsConfigRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'rankings'), [firestore]);
 const { data: rankingsConfig } = useDoc(rankingsConfigRef);

 const activeItems = useMemo(() => {
  if (rankingType === 'rich') return richUsers;
  if (rankingType === 'charm') return charmUsers;
  if (rankingType === 'rooms') return rankedRooms;
  if (rankingType === 'games') return gameUsers;
  return null;
 }, [rankingType, richUsers, charmUsers, rankedRooms, gameUsers]);

 const isActiveLoading = rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : rankingType === 'rooms' ? isLoadingRooms : isLoadingGames;

 const currentBG = useMemo(() => {
  if (rankingType === 'rich') return rankingsConfig?.honor;
  if (rankingType === 'charm') return rankingsConfig?.charm;
  if (rankingType === 'rooms') return rankingsConfig?.room;
  if (rankingType === 'games') return rankingsConfig?.arena;
  return null;
 }, [rankingType, rankingsConfig]);

 const myValue = useMemo(() => {
  if (!me) return 0;
  if (rankingType === 'rich') return me.wallet?.dailySpent || 0;
  if (rankingType === 'charm') return me.stats?.dailyGiftsReceived || 0;
  if (rankingType === 'games') return me.stats?.dailyGameWins || 0;
  return 0;
 }, [me, rankingType]);

 if (!mounted) return null;

 return (
  <div className="min-h-screen bg-[#050505] text-white relative font-sans overflow-x-hidden flex flex-col">
    <div className="absolute inset-0 z-0 pointer-events-none">
      {currentBG ? (
       <Image src={currentBG} fill className="object-cover opacity-60 animate-in fade-in duration-1000" alt="BG" unoptimized />
      ) : (
       <>
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#1a1a1a] via-[#050505] to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
       </>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505]" />
    </div>

    <header className="relative z-50 p-4 pt-8 shrink-0">
     <div className="flex items-center justify-between mb-4">
       <Link href="/rooms" className="text-white hover:scale-110 transition-transform shrink-0"><ChevronLeft className="h-7 w-7" /></Link>
       <h1 className="text-xl font-bold uppercase tracking-tight">Ranking</h1>
       <Dialog>
        <DialogTrigger asChild><button className="p-1 rounded-full border border-white/20 text-white/60 hover:text-white transition-all"><HelpCircle className="h-5 w-5" /></button></DialogTrigger>
        <DialogContent className="bg-[#1a1a1a] border-none rounded-t-[3rem] text-white p-6">
         <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-tight text-yellow-500 text-center mb-4">Ranking Rules</DialogTitle>
          <DialogDescription className="sr-only">Detailed tribal ranking policy.</DialogDescription>
         </DialogHeader>
         <div className="space-y-3 font-body text-gray-400 leading-relaxed pt-2 text-sm">
          <p>1. Rankings are based on daily Gold Coin activity and reset every night at 11:59:59 PM (GMT +5:30 IST).</p>
          <p>2. Honor (Rich) tracks daily coins dispatched.</p>
          <p>3. Charm tracks daily coins received as gifts.</p>
          <p>4. Room rankings track total daily gifts received in a frequency.</p>
          <p>5. Game rankings track daily Gold Coins won in the 3D Arena.</p>
         </div>
        </DialogContent>
       </Dialog>
     </div>

     <div className="flex items-center justify-between gap-1.5 bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/5 shadow-2xl mb-4 overflow-x-auto no-scrollbar">
       {[
        { id: 'rich', label: 'Honor' },
        { id: 'charm', label: 'Charm' },
        { id: 'rooms', label: 'Room' },
        { id: 'games', label: 'Game' },
        { id: 'banner', label: 'Banner' }
       ].map((cat) => (
        <button 
         key={cat.id} 
         onClick={() => setRankingMode(cat.id as any)} 
         className={cn(
          "flex-1 min-w-[80px] py-2.5 rounded-full font-bold uppercase text-[10px] transition-all duration-500 whitespace-nowrap", 
          rankingType === cat.id ? "bg-gradient-to-b from-[#f5e1a4] to-[#b88a44] text-black shadow-lg" : "text-white/40"
         )}
        >
         {cat.label}
        </button>
       ))}
     </div>

     {rankingType !== 'banner' && (
      <div className="flex items-center justify-center gap-10 px-4">
        {['Daily', 'Weekly', 'Monthly'].map((p) => (
         <button 
          key={p} 
          onClick={() => setTimePeriod(p.toLowerCase() as any)} 
          className={cn(
           "text-[11px] font-bold uppercase transition-all relative", 
           timePeriod === p.toLowerCase() ? "text-yellow-500 scale-110" : "text-white/20 hover:text-white/40"
          )}
         >
          {p}
          {timePeriod === p.toLowerCase() && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-yellow-500 rounded-full" />}
         </button>
        ))}
      </div>
     )}
    </header>

    <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-2">
      {rankingType === 'banner' ? (
       <BannerDisplay />
      ) : (
       <RankingList items={activeItems} type={rankingType} period={timePeriod} isLoading={isActiveLoading} />
      )}
    </main>

    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#b88a44] via-[#f5e1a4] to-[#b88a44] p-2.5 h-14 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto flex items-center gap-3 w-full">
       <span className="w-10 text-center font-bold text-black/60 text-lg">ME</span>
       <Avatar className="h-9 w-9 border-2 border-black/20 shrink-0 shadow-lg">
        <AvatarImage src={me?.avatarUrl || undefined} />
        <AvatarFallback className="bg-black text-white text-xs">U</AvatarFallback>
       </Avatar>
       <div className="flex-1 min-w-0">
        <p className="font-black text-sm uppercase text-black truncate leading-none mb-1 shadow-sm">{me?.username || 'Tribe Member'}</p>
        <div className="flex items-center gap-1 scale-[0.75] origin-left">
           {me?.svip && <SVIPBadge level={me.svip} />}
           <LevelBadge level={me?.level} />
        </div>
       </div>
       <div className="text-right flex items-center gap-1 shrink-0">
        <span className="text-lg font-black text-black leading-none drop-shadow-sm">{myValue.toLocaleString()}</span>
        <GoldCoinIcon className="h-4.4 w-4.4 text-black" />
       </div>
      </div>
    </footer>
   </div>
 );
}

export default function LeaderboardPage() {
 return (
  <AppLayout>
   <Suspense fallback={
    <div className="flex h-screen items-center justify-center bg-[#050505]">
     <Loader className="animate-spin text-primary h-8 w-8" />
    </div>
   }>
    <LeaderboardContent />
   </Suspense>
  </AppLayout>
 );
}
