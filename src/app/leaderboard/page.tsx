'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  useFirestore, 
  useCollection,
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Crown, Loader, TrendingUp, Clock, Trophy } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

// --- MAIN LEADERBOARD PAGE ---
export default function LeaderboardPage() {
  const [type, setType] = useState<'rich' | 'charm'>('rich');
  const firestore = useFirestore();

  // Logic: Rich = dailySpent, Charm = dailyGiftsReceived
  const rankingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const field = type === 'rich' ? 'wallet.dailySpent' : 'stats.dailyGiftsReceived';
    return query(
      collection(firestore, 'users'),
      orderBy(field, 'desc'),
      limit(20)
    );
  }, [firestore, type]);

  const { data: items, isLoading } = useCollection<any>(rankingQuery);

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white font-sans pb-20">
      {/* Header Tabs: Sirf Rich aur Charm (Baki removed as per your request) */}
      <div className="pt-6 px-4">
        <div className="flex justify-center gap-4 bg-white/5 p-1.5 rounded-2xl backdrop-blur-md border border-white/5">
          <button 
            onClick={() => setType('rich')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${type === 'rich' ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'text-white/40'}`}
          >
            Rich
          </button>
          <button 
            onClick={() => setType('charm')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${type === 'charm' ? 'bg-pink-600 shadow-lg shadow-pink-600/20 text-white' : 'text-white/40'}`}
          >
            Charm
          </button>
        </div>
      </div>

      <div className="text-center mt-6">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 italic">Daily Rankings</span>
      </div>

      <RankingList items={items} type={type} isLoading={isLoading} />
    </div>
  );
}

// --- RANKING LIST COMPONENT ---
const RankingList = ({ items, type, isLoading }: { items: any[] | null, type: string, isLoading: boolean }) => {
  
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-yellow-500 h-8 w-8" />
      <p className="text-[10px] font-bold uppercase text-white/20">Syncing Coins...</p>
    </div>
  );

  // Filter: Reset rule - Agar coins 0 hain toh user show nahi hoga
  const activeParticipants = items?.filter(item => {
    const val = type === 'rich' ? (item.wallet?.dailySpent || 0) : (item.stats?.dailyGiftsReceived || 0);
    return val > 0;
  }) || [];

  const top1 = activeParticipants[0] || null;
  const top2 = activeParticipants[1] || null;
  const top3 = activeParticipants[2] || null;
  const others = activeParticipants.slice(3);

  const formatCoins = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  // Empty Seat Placeholder
  const EmptySeat = ({ rank }: { rank: number }) => (
    <div className={`flex flex-col items-center opacity-20 ${rank === 1 ? 'w-32 scale-110' : 'w-24'}`}>
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center mb-2">
        <span className="text-xs font-bold">{rank}</span>
      </div>
      <div className="w-full bg-white/5 h-16 rounded-t-xl border-t border-white/10" />
    </div>
  );

  return (
    <div className="px-2">
      {/* PODIUM SECTION */}
      <div className="flex items-end justify-center gap-2 pt-20 mb-10 h-[280px] relative">
        {/* Rank 2 */}
        {top2 ? (
          <Link href={`/profile/${top2.id}`} className="flex-1 flex flex-col items-center">
            <div className="relative mb-2">
               <Avatar className="h-20 w-20 border-2 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.4)]">
                 <AvatarImage src={top2.avatarUrl} className="object-cover" />
                 <AvatarFallback>2</AvatarFallback>
               </Avatar>
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-[10px] font-black px-2 rounded">2</div>
            </div>
            <div className="w-full bg-gradient-to-b from-blue-900/20 to-transparent h-20 rounded-t-xl border-t border-blue-500/50 flex flex-col items-center justify-center">
               <p className="text-[10px] font-bold text-white truncate w-16">{top2.username}</p>
               <p className="text-[10px] text-blue-400 font-black">{formatCoins(top2.wallet?.dailySpent || top2.stats?.dailyGiftsReceived)}</p>
            </div>
          </Link>
        ) : <EmptySeat rank={2} />}

        {/* Rank 1 */}
        {top1 ? (
          <Link href={`/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 scale-110 -translate-y-6">
            <div className="relative mb-2">
               <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-7 w-7 text-yellow-400 fill-current drop-shadow-glow" />
               <Avatar className="h-24 w-24 border-4 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.5)]">
                 <AvatarImage src={top1.avatarUrl} className="object-cover" />
                 <AvatarFallback>1</AvatarFallback>
               </Avatar>
            </div>
            <div className="w-full bg-gradient-to-b from-yellow-500/20 to-transparent h-28 rounded-t-xl border-t-2 border-yellow-500 flex flex-col items-center justify-center">
               <p className="text-[11px] font-black text-yellow-500 truncate w-20">{top1.username}</p>
               <p className="text-[12px] text-white font-black">{formatCoins(top1.wallet?.dailySpent || top1.stats?.dailyGiftsReceived)}</p>
            </div>
          </Link>
        ) : <EmptySeat rank={1} />}

        {/* Rank 3 */}
        {top3 ? (
          <Link href={`/profile/${top3.id}`} className="flex-1 flex flex-col items-center">
            <div className="relative mb-2">
               <Avatar className="h-20 w-20 border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                 <AvatarImage src={top3.avatarUrl} className="object-cover" />
                 <AvatarFallback>3</AvatarFallback>
               </Avatar>
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-[10px] font-black px-2 rounded">3</div>
            </div>
            <div className="w-full bg-gradient-to-b from-orange-900/20 to-transparent h-16 rounded-t-xl border-t border-orange-500/50 flex flex-col items-center justify-center">
               <p className="text-[10px] font-bold text-white truncate w-16">{top3.username}</p>
               <p className="text-[10px] text-orange-400 font-black">{formatCoins(top3.wallet?.dailySpent || top3.stats?.dailyGiftsReceived)}</p>
            </div>
          </Link>
        ) : <EmptySeat rank={3} />}
      </div>

      {/* LIST SECTION */}
      <div className="mt-4 space-y-2 pb-10">
        {others.map((item, index) => (
          <Link key={item.id} href={`/profile/${item.id}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
             <span className="text-xs font-black text-white/20 w-4">{index + 4}</span>
             <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={item.avatarUrl} />
             </Avatar>
             <div className="flex-1">
                <p className="text-xs font-bold truncate">{item.username}</p>
                <p className="text-[9px] text-white/40 uppercase">Lv.{item.level || 1}</p>
             </div>
             <div className="text-right">
                <p className="text-xs font-black text-blue-400">{formatCoins(type === 'rich' ? item.wallet?.dailySpent : item.stats?.dailyGiftsReceived)}</p>
                <p className="text-[8px] uppercase text-white/20">Coins</p>
             </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
