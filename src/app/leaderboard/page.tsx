'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';
import { LeaderboardThemeConfig } from '@/components/admin/leaderboard-theme-admin';

// --- Dynamic Theme Background ---
const DynamicThemeBackground = ({ theme }: { theme: LeaderboardThemeConfig | null }) => {
  if (!theme) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#2e152b] via-[#2c1b18] to-[#3b1c32]">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-pink-500/15 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/15 blur-[130px] rounded-full animate-pulse [animation-delay:3s]" />
        <div className="absolute top-[40%] right-[-20%] w-[50%] h-[50%] bg-[#8B4513]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-yellow-500/40 to-transparent" />
          <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-yellow-500/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1a0e14] to-transparent" />
      </div>
    );
  }

  return (
    <>
      {theme.backgroundType === 'image' ? (
        <img
          src={theme.backgroundUrl}
          alt="Theme background"
          className="fixed inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <video
          src={theme.backgroundUrl}
          autoPlay
          loop
          muted
          className="fixed inset-0 w-full h-full object-cover z-0"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1a0e14] to-transparent z-2 pointer-events-none" />
    </>
  );
};

// --- Daily Countdown Component ---
const DailyCountdown = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istTime = new Date(utcTime + (330 * 60000));

      const target = new Date(istTime);
      target.setHours(5, 30, 0, 0);

      if (istTime.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - istTime.getTime();

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

// --- Simple Avatar - AB SAB SQUARE honge (Top 1,2,3 + 4 to 50) ---
const SimpleAvatar = ({ src, fallback, size = "md", rank }: { src?: string; fallback: string; size?: "sm" | "md" | "lg"; rank?: number }) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };
  
  return (
    <div className="relative">
      <div 
        className={cn(
          "relative flex items-center justify-center border-2 border-white/20 bg-slate-900 overflow-hidden rounded-xl",
          sizes[size]
        )}
      >
        <Avatar className="h-full w-full rounded-xl">
          <AvatarImage src={src} className="object-cover rounded-xl" />
          <AvatarFallback className="bg-slate-900 text-white font-black rounded-xl">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

// --- Ranking List ---
const RankingList = ({ items, type, isLoading, theme }: { items: any[] | null; type: string; isLoading: boolean; theme: LeaderboardThemeConfig | null }) => {
  if (isLoading)
    return (
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

  const activePlayers = (items || []).filter((item) => getValue(item) > 0);

  if (activePlayers.length === 0)
    return (
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
      {/* TOP 1 - Square avatar */}
      {top1 && (
        <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="flex flex-col items-center justify-center py-4">
          <div className="relative mb-2">
            <SimpleAvatar src={top1.avatarUrl || top1.coverUrl} fallback="1" size="lg" rank={1} />
            {top1.username && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs font-black text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {top1.username || top1.name || 'User'}
                </span>
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <span className="text-yellow-400 font-black text-lg drop-shadow-md">{formatValue(getValue(top1))}</span>
            <GoldCoinIcon className="h-4 w-4 inline-block ml-1" />
          </div>
        </Link>
      )}

      {/* TOP 2 & TOP 3 - Square avatars */}
      <div className="flex items-center justify-center gap-8 px-4 mt-8">
        {top2 && (
          <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex flex-col items-center flex-1">
            <div className="relative mb-2">
              <SimpleAvatar src={top2.avatarUrl || top2.coverUrl} fallback="2" size="md" rank={2} />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] font-black text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {top2.username || top2.name || 'User'}
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <span className="text-slate-300 font-bold text-sm">{formatValue(getValue(top2))}</span>
              <GoldCoinIcon className="h-3 w-3 inline-block ml-1" />
            </div>
          </Link>
        )}

        {top3 && (
          <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex flex-col items-center flex-1">
            <div className="relative mb-2">
              <SimpleAvatar src={top3.avatarUrl || top3.coverUrl} fallback="3" size="md" rank={3} />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] font-black text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {top3.username || top3.name || 'User'}
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <span className="text-orange-300 font-bold text-sm">{formatValue(getValue(top3))}</span>
              <GoldCoinIcon className="h-3 w-3 inline-block ml-1" />
            </div>
          </Link>
        )}
      </div>

      {/* Countdown here */}
      <DailyCountdown />

      {/* Top 4 to 50 - AB YEH BHI SQUARE avatars ke saath */}
      <div className="px-4 space-y-3 mt-4">
        {others.map((item, index) => (
          <Link
            key={item.id}
            href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`}
            className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group hover:border-[#D4AF37]/70 transition-all backdrop-blur-md"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-yellow-600 opacity-40 group-hover:opacity-100 transition-opacity" />
            <span className="text-lg font-black italic text-white/20 w-6">{index + 4}</span>
            <SimpleAvatar src={item.avatarUrl || item.coverUrl} fallback={(index + 4).toString()} size="sm" rank={index + 4} />
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-white tracking-wide">{item.username || item.name || 'User'}</p>
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

  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms'>(initialType);
  const [mounted, setMounted] = useState(false);
  const [activeTheme, setActiveTheme] = useState<LeaderboardThemeConfig | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!firestore) return;
    const fetchActiveTheme = async () => {
      try {
        const q = query(collection(firestore, 'leaderboardThemes'), where('isActive', '==', true), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
          const themeData = snapshot.docs[0].data() as LeaderboardThemeConfig;
          themeData.id = snapshot.docs[0].id;
          setActiveTheme(themeData);
        }
      } catch (error) {
        console.error('Error fetching active theme:', error);
      }
    };
    fetchActiveTheme();
  }, [firestore]);

  const richQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rich') return null;
      return query(collection(firestore, 'users'), where('wallet.dailySpent', '>', 0), orderBy('wallet.dailySpent', 'desc'), limit(50));
    },
    [firestore, rankingType]
  );

  const charmQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'charm') return null;
      return query(collection(firestore, 'users'), where('stats.dailyGiftsReceived', '>', 0), orderBy('stats.dailyGiftsReceived', 'desc'), limit(50));
    },
    [firestore, rankingType]
  );

  const roomsQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rooms') return null;
      return query(collection(firestore, 'chatRooms'), where('stats.dailyGifts', '>', 0), orderBy('stats.dailyGifts', 'desc'), limit(50));
    },
    [firestore, rankingType]
  );

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmQuery);
  const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);

  const activeItems = useMemo(() => {
    if (rankingType === 'rich') return richUsers;
    if (rankingType === 'charm') return charmUsers;
    if (rankingType === 'rooms') return rankedRooms;
    return null;
  }, [rankingType, richUsers, charmUsers, rankedRooms]);

  const isActiveLoading = rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : isLoadingRooms;

  const myValue = useMemo(() => {
    if (!me) return 0;
    if (rankingType === 'rich') return me.wallet?.dailySpent || 0;
    if (rankingType === 'charm') return (me as any).stats?.dailyGiftsReceived || 0;
    return 0;
  }, [me, rankingType]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen text-white relative font-sans flex flex-col overflow-hidden bg-transparent">
      <DynamicThemeBackground theme={activeTheme} />

      {/* Header */}
      <header className="relative z-50 p-6 pt-safe flex items-center justify-between backdrop-blur-md bg-black/20">
        <Link href="/rooms">
          <ChevronLeft className="h-6 w-6 text-white" />
        </Link>
        <h1 className="text-xl font-black uppercase tracking-[0.2em] italic text-white">Ranking</h1>
        <HelpCircle className="h-5 w-5 text-white" />
      </header>

      {/* Tabs - Honor, Charm, Room */}
      <div className="relative z-50 flex items-center justify-around border-b border-white/20 pb-2 mb-2 bg-black/30 backdrop-blur-sm">
        {[
          { id: 'rich', label: 'Honor' },
          { id: 'charm', label: 'Charm' },
          { id: 'rooms', label: 'Room' }
        ].map((tab) => (
          <div key={tab.id} className="flex flex-col items-center">
            <button
              onClick={() => setRankingMode(tab.id as any)}
              className={cn('text-[10px] font-black uppercase tracking-widest transition-all py-2', rankingType === tab.id ? 'text-[#D4AF37] scale-110' : 'text-white/60')}
            >
              {tab.label}
            </button>
            {rankingType === tab.id && <span className="text-[8px] font-bold text-[#D4AF37] mt-[-4px] animate-pulse shadow-[0_0_10px_#D4AF37]">●</span>}
          </div>
        ))}
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
        <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} theme={activeTheme} />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a0e14]/90 backdrop-blur-xl border-t border-[#D4AF37]/40 p-4 h-20 flex items-center shadow-[0_-10px_30px_rgba(212,175,55,0.1)]">
        <Link href="/profile" className="max-w-4xl mx-auto flex items-center gap-4 w-full active:scale-[0.98] transition-all">
          <span className="text-xs font-black text-[#D4AF37] italic">ME</span>
          <SimpleAvatar src={me?.avatarUrl} fallback="U" size="sm" />
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
