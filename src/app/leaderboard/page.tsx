'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, TrendingUp, Loader, ChevronLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';


// ✅ Countdown Hook (IST)
const useCountdownIST = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();

      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);

      const endOfDay = new Date(istTime);
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay.getTime() - istTime.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeLeft;
};


// ✅ Circle Avatar (Updated)
const AvatarCircle = ({ src, fallback, size = "md", glowColor = "cyan" }: any) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };

  const glows: any = {
    cyan: "shadow-[0_0_15px_rgba(34,211,238,0.5)] border-cyan-400",
    purple: "shadow-[0_0_15px_rgba(168,85,247,0.5)] border-purple-500",
    yellow: "shadow-[0_0_20px_rgba(234,179,8,0.6)] border-yellow-400"
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size])}>
      <div className={cn(
        "w-full h-full rounded-full border-2 overflow-hidden bg-[#0a0a0a]",
        glows[glowColor]
      )}>
        <Avatar className="h-full w-full">
          <AvatarImage src={src} className="object-cover" />
          <AvatarFallback className="bg-slate-900 text-white font-black">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};


// ✅ Ranking List
const RankingList = ({ items, isLoading }: any) => {
  const timer = useCountdownIST();

  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-cyan-500 h-10 w-10" />
      <p className="text-xs text-cyan-400">Loading...</p>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="text-center py-40 opacity-40">
      <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/20" />
      <p>No Data</p>
    </div>
  );

  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];
  const others = items.slice(3);

  return (
    <div className="space-y-6 pb-32">

      {/* 🏆 TOP 3 */}
      <div className="flex items-end justify-center gap-4 pt-10">

        {/* 2 */}
        {top2 && (
          <div className="text-center">
            <AvatarCircle src={top2.avatarUrl} fallback="2" />
            <p className="text-xs">{top2.username}</p>
          </div>
        )}

        {/* 1 */}
        {top1 && (
          <div className="text-center scale-110">
            <Crown className="mx-auto text-yellow-400 mb-1" />
            <AvatarCircle src={top1.avatarUrl} fallback="1" size="lg" glowColor="yellow" />
            <p className="text-sm font-bold">{top1.username}</p>
          </div>
        )}

        {/* 3 */}
        {top3 && (
          <div className="text-center">
            <AvatarCircle src={top3.avatarUrl} fallback="3" glowColor="purple" />
            <p className="text-xs">{top3.username}</p>
          </div>
        )}
      </div>

      {/* ⏳ TIMER */}
      <div className="flex justify-center">
        <div className="px-4 py-2 rounded-full bg-white/5 border border-cyan-500/20">
          <p className="text-[10px] text-white/40 text-center">Next Reset (GMT+5:30)</p>
          <p className="text-sm font-bold text-cyan-400 text-center">{timer}</p>
        </div>
      </div>

      {/* 📜 LIST */}
      <div className="px-4 space-y-3">
        {others.map((item: any, index: number) => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
            <span>{index + 4}</span>
            <AvatarCircle src={item.avatarUrl} fallback="U" size="sm" />
            <p className="flex-1">{item.username}</p>
            <span className="text-cyan-400">{item.coins || 0}</span>
          </div>
        ))}
      </div>

    </div>
  );
};


function LeaderboardContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile: me } = useUserProfile(user?.uid);

  const queryData = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('coins', 'desc'), limit(50));
  }, [firestore]);

  const { data, isLoading } = useCollection(queryData);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <Link href="/rooms"><ChevronLeft /></Link>
        <h1 className="font-bold">Hall of Fame</h1>
        <HelpCircle />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <RankingList items={data} isLoading={isLoading} />
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-white/10 flex items-center gap-4">
        <AvatarCircle src={me?.avatarUrl} fallback="U" size="sm" />
        <p>{me?.username}</p>
        <span className="ml-auto text-cyan-400">{me?.coins || 0}</span>
      </footer>

    </div>
  );
}

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={<Loader className="animate-spin" />}>
        <LeaderboardContent />
      </Suspense>
    </AppLayout>
  );
        }
