'use client';

import { useState, useEffect } from 'react';
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

// --- Avatar with Standard Tailwind Glow ---
const CircleAvatar = ({ src, fallback, size = "md", color = "blue" }: { src?: string, fallback: string, size?: "sm" | "md" | "lg", color?: string }) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };
  const borderColors: Record<string, string> = {
    blue: "border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    purple: "border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
    yellow: "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.6)]"
  };

  return (
    <div className={cn("relative flex items-center justify-center rounded-full border-2 bg-slate-900", sizes[size], borderColors[color])}>
      <Avatar className="h-full w-full rounded-full">
        <AvatarImage src={src} className="object-cover" />
        <AvatarFallback className="bg-slate-950 text-white font-bold">{fallback}</AvatarFallback>
      </Avatar>
    </div>
  );
};

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: string, isLoading: boolean }) => {
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-blue-500 h-8 w-8" />
      <p className="text-[10px] font-bold text-blue-400/60 uppercase">Loading...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-30"><Trophy className="mx-auto mb-4 h-12 w-12" /></div>
  );

  const [top1, top2, top3, ...others] = items;
  const getValue = (item: any) => {
    const p = period === 'daily' ? 'daily' : 'weekly';
    const s = type === 'rich' ? 'Spent' : 'GiftsReceived';
    return (type === 'rich' ? item.wallet?.[`${p}${s}`] : item.stats?.[`${p}${s}`]) || 0;
  };

  const formatVal = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    return v.toLocaleString();
  };

  return (
    <div className="pb-32 px-4">
      {/* 3D-Look Podium Section */}
      <div className="flex items-end justify-center gap-2 pt-16 pb-8">
        {top2 && (
          <Link href={`/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
            <CircleAvatar src={top2.avatarUrl} fallback="2" color="blue" />
            <div className="w-full mt-2 bg-slate-800/40 border-t border-blue-500/30 p-2 rounded-xl text-center">
              <span className="text-[9px] font-bold text-white/70 block truncate">{top2.username || 'User'}</span>
              <span className="text-blue-400 font-black text-xs">{formatVal(getValue(top2))}</span>
            </div>
          </Link>
        )}

        {top1 && (
          <Link href={`/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 -translate-y-4 scale-110">
            <Crown className="h-8 w-8 text-yellow-400 mb-1 drop-shadow-md" />
            <CircleAvatar src={top1.avatarUrl} fallback="1" size="lg" color="yellow" />
            <div className="w-full mt-2 bg-slate-800/60 border-t-2 border-yellow-500 p-3 rounded-xl text-center shadow-lg">
              <span className="text-[10px] font-black text-white block truncate uppercase">{top1.username || 'User'}</span>
              <span className="text-yellow-400 font-black text-sm">{formatVal(getValue(top1))}</span>
            </div>
          </Link>
        )}

        {top3 && (
          <Link href={`/profile/${top3.id}`} className="flex-1 flex flex-col items-center">
            <CircleAvatar src={top3.avatarUrl} fallback="3" color="purple" />
            <div className="w-full mt-2 bg-slate-800/40 border-t border-purple-500/30 p-2 rounded-xl text-center">
              <span className="text-[9px] font-bold text-white/70 block truncate">{top3.username || 'User'}</span>
              <span className="text-purple-400 font-black text-xs">{formatVal(getValue(top3))}</span>
            </div>
          </Link>
        )}
      </div>

      {/* Rank List Items */}
      <div className="space-y-2">
        {others.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-white/5 rounded-2xl">
            <span className="text-sm font-bold text-white/20 w-5">{index + 4}</span>
            <CircleAvatar src={item.avatarUrl} fallback="U" size="sm" color="purple" />
            <div className="flex-1">
              <p className="text-xs font-bold text-white/90">{item.username || 'User'}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400 font-bold text-xs">{formatVal(getValue(item))}</span>
              <GoldCoinIcon className="h-3 w-3" />
            </div>
          </div>
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
  
  const activeQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let coll = rankingType === 'rooms' ? 'chatRooms' : 'users';
    let field = rankingType === 'rich' ? 'wallet.dailySpent' : 'stats.dailyGiftsReceived';
    return query(collection(firestore, coll), orderBy(field, 'desc'), limit(50));
  }, [firestore, rankingType]);

  const { data: activeItems, isLoading } = useCollection(activeQuery);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#05070a] text-white flex flex-col">
        {/* Simple Background Glows */}
        <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-900/20 to-transparent -z-10" />

        <header className="p-6 pt-10">
          <div className="flex items-center justify-between mb-8">
            <Link href="/rooms"><ChevronLeft className="h-6 w-6 text-blue-400" /></Link>
            <h1 className="text-lg font-black uppercase tracking-widest italic">Hall of Fame</h1>
            <HelpCircle className="h-5 w-5 opacity-20" />
          </div>

          <div className="flex items-center justify-around bg-slate-900/80 p-1 rounded-2xl border border-white/5">
            {['rich', 'charm', 'games', 'rooms'].map((tab) => (
              <button key={tab} onClick={() => setRankingMode(tab as any)} 
                className={cn("flex-1 text-[10px] font-bold uppercase py-3 rounded-xl transition-all", 
                rankingType === tab ? "bg-blue-600 text-white shadow-lg" : "text-white/40")}>
                {tab === 'rich' ? 'Honor' : tab === 'charm' ? 'Charm' : tab === 'games' ? 'Game' : 'Room'}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <RankingList items={activeItems} type={rankingType} period="daily" isLoading={isLoading} />
        </main>
      </div>
    </AppLayout>
  );
}

