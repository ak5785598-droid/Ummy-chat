'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, ChevronRight, Star, Sparkles, Trophy, Gamepad2, Zap, Heart, Users } from 'lucide-react';
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
    "bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 animate-shimmer-gold"
  )}>
    <span className="text-[7px] font-black text-white uppercase italic tracking-tighter">SVIP {level}</span>
  </div>
);

const LevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#b45309] border border-white/20 scale-90 origin-left shadow-md">
    <Star className="h-2 w-2 text-white fill-current" />
    <span className="text-[7px] font-black text-white italic">Lv.{level}</span>
  </div>
);

const RankingList = ({ items, type, isLoading }: { items: any[] | null, type: string, isLoading: boolean }) => {
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-primary h-8 w-8" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 animate-pulse">Ascending the Throne...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-40">
      <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/20" />
      <p className="font-black uppercase italic text-sm text-white/40">The chronicles are empty.</p>
    </div>
  );

  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];
  const others = items.slice(3);

  const getValue = (item: any) => {
    if (type === 'rich') return item.wallet?.dailySpent || 0;
    if (type === 'charm') return item.stats?.dailyGiftsReceived || 0;
    if (type === 'rooms') return item.stats?.dailyGifts || 0;
    if (type === 'games') return item.stats?.dailyGameWins || 0;
    return 0;
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
          <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="relative z-30 flex flex-col items-center mb-8 group transition-all active:scale-95">
             <div className="relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-24 bg-yellow-500/10 blur-3xl opacity-50" />
                <div className="relative z-10 w-32 h-32">
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
                      <img src="https://img.icons8.com/color/96/crown.png" className="h-10 w-10 drop-shadow-2xl animate-bounce" alt="Crown" />
                   </div>
                   <div className="relative w-full h-full p-1.5 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)] border-[4px] border-[#1a1a1a]">
                      <Avatar className="h-full w-full border-2 border-yellow-200">
                         <AvatarImage src={getDisplayImage(top1)} className="object-cover" />
                         <AvatarFallback className="bg-slate-900 text-white font-black text-xl">1</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-b from-red-500 to-red-700 text-white px-4 py-0.5 rounded-full font-black text-[10px] shadow-xl border border-yellow-400 italic">TOP 1</div>
                   </div>
                </div>
             </div>
             <div className="mt-6 text-center space-y-0.5">
                <h2 className="text-lg font-black text-white uppercase drop-shadow-md tracking-tight">{getDisplayName(top1)}</h2>
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                   <SVIPBadge level={8} />
                   <LevelBadge level={91} />
                </div>
                <div className="flex items-center justify-center gap-1 text-yellow-500 font-black">
                   <GoldCoinIcon className="h-3.5 w-3.5" />
                   <span className="text-base italic">{formatValue(getValue(top1))}</span>
                </div>
             </div>
          </Link>
        )}

        <div className="flex items-end justify-center gap-3 w-full max-sm px-4 relative z-20">
           {top2 && (
             <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex-1 bg-gradient-to-b from-[#252b41] to-[#1a1f30] rounded-[1.5rem] border-2 border-blue-400/20 p-3 pt-10 flex flex-col items-center gap-1 shadow-2xl relative transition-all active:scale-95 group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20">
                   <div className="relative w-full h-full bg-gradient-to-b from-blue-200 to-blue-500 rounded-full p-1 border-4 border-[#1a1a1a]">
                      <Avatar className="h-full w-full border border-white/20">
                         <AvatarImage src={getDisplayImage(top2)} />
                         <AvatarFallback className="font-black">2</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-b from-blue-600 to-blue-800 text-white px-2 py-0.5 rounded-full font-black text-[7px] border border-blue-200 shadow-lg">TOP 2</div>
                   </div>
                </div>
                <p className="font-black text-xs text-[#fbc02d] uppercase truncate w-20 text-center mt-1 tracking-tighter">{getDisplayName(top2)}</p>
                <div className="flex items-center gap-1 scale-[0.65] origin-center -my-1">
                   <SVIPBadge level={5} />
                   <LevelBadge level={61} />
                </div>
                <div className="flex items-center justify-center gap-1 text-yellow-500">
                   <GoldCoinIcon className="h-2.5 w-2.5" />
                   <span className="text-[10px] font-black italic">{formatValue(getValue(top2))}</span>
                </div>
             </Link>
           )}

           {top3 && (
             <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex-1 bg-gradient-to-b from-[#2d221a] to-[#1f1610] rounded-[1.5rem] border-2 border-amber-400/20 p-3 pt-10 flex flex-col items-center gap-1 shadow-2xl relative transition-all active:scale-95 group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20">
                   <div className="relative w-full h-full bg-gradient-to-b from-amber-200 to-amber-500 rounded-full p-1 border-4 border-[#1a1a1a]">
                      <Avatar className="h-full w-full border border-white/20">
                         <AvatarImage src={getDisplayImage(top3)} />
                         <AvatarFallback className="font-black text-xs">3</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-b from-amber-600 to-amber-800 text-white px-2 py-0.5 rounded-full font-black text-[7px] border border-amber-200 shadow-lg">TOP 3</div>
                   </div>
                </div>
                <p className="font-black text-[10px] text-white uppercase truncate w-16 text-center mt-1 tracking-tighter">{getDisplayName(top3)}</p>
                <div className="flex items-center gap-1 scale-[0.65] origin-center -my-1">
                   <SVIPBadge level={2} />
                   <LevelBadge level={94} />
                </div>
                <div className="flex items-center justify-center gap-1 text-yellow-500">
                   <GoldCoinIcon className="h-2 w-2" />
                   <span className="text-[9px] font-black italic">{formatValue(getValue(top3))}</span>
                </div>
             </Link>
           )}
        </div>
      </div>

      <div className="mt-4 space-y-1 px-2">
        {others.map((item, index) => (
          <Link key={item.id} href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`} className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/5 group hover:bg-white/10 transition-all active:scale-[0.98]">
            <span className="w-4 text-center font-black text-white/40 text-[10px] italic">{index + 4}</span>
            <Avatar className="h-9 w-9 border border-white/10 shrink-0">
              <AvatarImage src={getDisplayImage(item)} />
              <AvatarFallback className="font-black text-[10px]">{(index + 4)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[11px] uppercase text-yellow-500 truncate tracking-tight">{getDisplayName(item)}</p>
              <div className="flex items-center gap-1 scale-75 origin-left -mt-0.5">
                 <SVIPBadge level={7} />
                 <LevelBadge level={76} />
              </div>
            </div>
            <div className="text-right flex items-center gap-1 shrink-0">
              <span className="font-black text-[10px] text-white/80 italic">{formatValue(getValue(item))}</span>
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
      <p className="font-black uppercase italic text-xs text-white/40">No active events in the grid.</p>
    </div>
  );

  return (
    <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
       {slides.map((slide: any, idx: number) => {
         const Icon = ICON_MAP[slide.iconName] || Sparkles;
         return (
           <div key={idx} className="relative h-28 w-full rounded-[1.5rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-black group active:scale-[0.98] transition-all">
              <Image src={slide.imageUrl || 'https://picsum.photos/seed/promo/800/200'} alt={slide.title} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" unoptimized />
              <div className={cn("absolute inset-0 bg-gradient-to-r via-transparent to-transparent flex flex-col justify-center px-6", slide.color || "from-black/40")}>
                 <div className="flex items-center gap-2 mb-0.5">
                    <Icon className="h-4 w-4 text-white animate-pulse" />
                    <h4 className="text-white font-black uppercase italic text-xl tracking-tighter leading-none drop-shadow-lg">{slide.title}</h4>
                 </div>
                 <p className="text-white/80 font-bold uppercase text-[8px] tracking-[0.2em] drop-shadow-md">{slide.subtitle}</p>
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

  const richQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('wallet.dailySpent', 'desc'), limit(50)), [firestore]);
  const charmQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('stats.dailyGiftsReceived', 'desc'), limit(50)), [firestore]);
  const roomsQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'chatRooms'), orderBy('stats.dailyGifts', 'desc'), limit(50)), [firestore]);
  const gamesQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, 'users'), orderBy('stats.dailyGameWins', 'desc'), limit(50)), [firestore]);

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
    <div className="min-h-screen bg-[#050505] text-white relative font-headline overflow-x-hidden flex flex-col">
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

        <header className="relative z-50 p-3 pt-6 shrink-0">
          <div className="flex items-center justify-between mb-3">
             <Link href="/rooms" className="text-white hover:scale-110 transition-transform shrink-0"><ChevronLeft className="h-6 w-6" /></Link>
             <h1 className="text-lg font-black uppercase italic tracking-tighter">Ranking</h1>
             <Dialog>
                <DialogTrigger asChild><button className="p-1 rounded-full border border-white/20 text-white/60 hover:text-white transition-all"><HelpCircle className="h-4 w-4" /></button></DialogTrigger>
                <DialogContent className="bg-[#1a1a1a] border-none rounded-t-[2.5rem] text-white p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-yellow-500 text-center mb-4">Ranking Rules</DialogTitle>
                    <DialogDescription className="sr-only">Detailed tribal ranking policy.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 font-body italic text-gray-400 leading-relaxed pt-2 text-sm">
                    <p>1. Rankings are based on daily Gold Coin activity and reset every night at 11:59:59 PM (GMT +5:30 IST).</p>
                    <p>2. Honor (Rich) tracks daily coins dispatched.</p>
                    <p>3. Charm tracks daily coins received as gifts.</p>
                    <p>4. Room rankings track total daily gifts received in a frequency.</p>
                    <p>5. Game rankings track daily Gold Coins won in the 3D Arena.</p>
                  </div>
                </DialogContent>
             </Dialog>
          </div>

          <div className="flex items-center justify-between gap-1 bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/5 shadow-2xl mb-3 overflow-x-auto no-scrollbar">
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
                   "flex-1 min-w-[70px] py-2 rounded-full font-black uppercase italic text-[9px] transition-all duration-500 whitespace-nowrap", 
                   rankingType === cat.id ? "bg-gradient-to-b from-[#f5e1a4] to-[#b88a44] text-black shadow-lg" : "text-white/40"
                 )}
               >
                 {cat.label}
               </button>
             ))}
          </div>

          {rankingType !== 'banner' && (
            <div className="flex items-center justify-center gap-8 px-4">
               {['Daily', 'Weekly', 'Monthly'].map((p) => (
                 <button 
                   key={p} 
                   onClick={() => setTimePeriod(p.toLowerCase() as any)} 
                   className={cn(
                     "text-[10px] font-black uppercase italic transition-all relative", 
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
             <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} />
           )}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#b88a44] via-[#f5e1a4] to-[#b88a44] p-2 h-14 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           <div className="max-w-4xl mx-auto flex items-center gap-2 w-full">
              <span className="w-8 text-center font-black text-black/60 italic text-sm">ME</span>
              <Avatar className="h-9 w-9 border-2 border-black/20 shrink-0 shadow-lg">
                <AvatarImage src={me?.avatarUrl || undefined} />
                <AvatarFallback className="bg-black text-white text-[10px]">U</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase italic text-black truncate leading-none mb-0.5">{me?.username || 'Tribe Member'}</p>
                <div className="scale-[0.65] origin-left -ml-1"><LevelBadge level={me?.level?.rich || 1} /></div>
              </div>
              <div className="text-right flex items-center gap-1 shrink-0">
                <span className="text-base font-black text-black italic leading-none">{myValue.toLocaleString()}</span>
                <GoldCoinIcon className="h-4 w-4 text-black" />
              </div>
           </div>
        </footer>
      </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AppLayout hideSidebarOnMobile>
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
