'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Loader, TrendingUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const RankingList = ({ items, type, period, isLoading }: { items: any[] | null, type: string, period: string, isLoading: boolean }) => {
  
  // 1. Loading State
  if (isLoading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader className="animate-spin text-yellow-500 h-10 w-10" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 animate-pulse">Syncing Leaderboard...</p>
    </div>
  );

  // 2. Daily & Coins Filter Logic
  // Rich = dailySpent | Charm = dailyGiftsReceived
  // Agar coins 0 hain toh user list mein nahi aayega (Reset Rule)
  const activeParticipants = items?.filter(item => {
    const coins = type === 'rich' 
      ? (item.wallet?.dailySpent || 0) 
      : (item.stats?.dailyGiftsReceived || 0);
    return coins > 0;
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

  // 3. Empty Seat UI (Jab koi participate na kar raha ho)
  const EmptySeat = ({ rank }: { rank: number }) => (
    <div className={`flex flex-col items-center opacity-30 ${rank === 1 ? 'scale-110 -translate-y-4' : ''}`}>
      <div className={`relative mb-2 w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center`}>
        <span className="text-white/20 font-black">{rank}</span>
      </div>
      <div className={`w-full bg-white/5 ${rank === 1 ? 'h-32' : 'h-24'} rounded-t-xl border-t border-white/10 flex items-center justify-center`}>
        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Empty</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-1000 relative pb-40 px-2">
      
      {/* --- PODIUM SECTION (Avatars & Style preserved) --- */}
      <div className="flex items-end justify-center gap-2 pt-16 mb-12 relative h-[320px]">
        
        {/* Rank 2 (Left) */}
        {top2 ? (
          <Link href={`/profile/${top2.id}`} className="flex-1 flex flex-col items-center animate-in slide-in-from-left">
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-blue-400 to-transparent shadow-[0_0_15px_rgba(147,197,253,0.3)]">
                <Avatar className="h-full w-full border-2 border-[#1a1a1a] rounded-full">
                  <AvatarImage src={top2.avatarUrl} className="object-cover" />
                  <AvatarFallback>2</AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#252b41] border border-blue-400 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">2</div>
            </div>
            <div className="w-full bg-gradient-to-b from-[#252b41] to-[#121212] h-24 rounded-t-xl border-t-2 border-blue-400/50 flex flex-col items-center justify-center p-2 text-center shadow-2xl">
              <p className="text-[10px] font-black uppercase text-blue-300 truncate w-full">{top2.username}</p>
              <p className="text-[12px] font-bold text-white mt-1">{formatCoins(type === 'rich' ? top2.wallet?.dailySpent : top2.stats?.dailyGiftsReceived)} <span className="text-[8px] text-blue-400">Coins</span></p>
            </div>
          </Link>
        ) : <EmptySeat rank={2} />}

        {/* Rank 1 (Center) */}
        {top1 ? (
          <Link href={`/profile/${top1.id}`} className="flex-1 flex flex-col items-center z-10 scale-110 -translate-y-4 animate-in zoom-in">
            <div className="relative mb-2">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce">
                <Crown className="h-8 w-8 text-yellow-400 fill-current drop-shadow-[0_0_10px_rgba(251,191,36,1)]" />
              </div>
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-yellow-400 via-yellow-200 to-transparent shadow-[0_0_25px_rgba(251,191,36,0.5)]">
                <Avatar className="h-full w-full border-2 border-[#1a1a1a] rounded-full">
                  <AvatarImage src={top1.avatarUrl} className="object-cover" />
                  <AvatarFallback>1</AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-3 py-0.5 rounded-full shadow-xl">1</div>
            </div>
            <div className="w-full bg-gradient-to-b from-[#2a2a22] to-[#121212] h-32 rounded-t-xl border-t-2 border-yellow-500 flex flex-col items-center justify-center p-2 text-center shadow-[0_-10px_30px_rgba(251,191,36,0.15)]">
              <p className="text-[11px] font-black uppercase text-yellow-500 truncate w-full">{top1.username}</p>
              <p className="text-[14px] font-black text-white mt-1 underline decoration-yellow-500/30">{formatCoins(type === 'rich' ? top1.wallet?.dailySpent : top1.stats?.dailyGiftsReceived)} <span className="text-[8px] text-yellow-500">Coins</span></p>
            </div>
          </Link>
        ) : <EmptySeat rank={1} />}

        {/* Rank 3 (Right) */}
        {top3 ? (
          <Link href={`/profile/${top3.id}`} className="flex-1 flex flex-col items-center animate-in slide-in-from-right">
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-orange-400 to-transparent shadow-[0_0_15px_rgba(251,146,60,0.3)]">
                <Avatar className="h-full w-full border-2 border-[#1a1a1a] rounded-full">
                  <AvatarImage src={top3.avatarUrl} className="object-cover" />
                  <AvatarFallback>3</AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2d221a] border border-orange-400 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">3</div>
            </div>
            <div className="w-full bg-gradient-to-b from-[#2d221a] to-[#121212] h-20 rounded-t-xl border-t-2 border-orange-400/50 flex flex-col items-center justify-center p-2 text-center shadow-2xl">
              <p className="text-[10px] font-black uppercase text-orange-400 truncate w-full">{top3.username}</p>
              <p className="text-[12px] font-bold text-white mt-1">{formatCoins(type === 'rich' ? top3.wallet?.dailySpent : top3.stats?.dailyGiftsReceived)} <span className="text-[8px] text-orange-400">Coins</span></p>
            </div>
          </Link>
        ) : <EmptySeat rank={3} />}
        
        <div className="absolute bottom-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* --- LIST SECTION --- */}
      <div className="mt-8 space-y-3 px-1">
        {others.map((item, index) => (
          <Link key={item.id} href={`/profile/${item.id}`} 
            className="flex items-center gap-3 p-3 bg-[#161b22]/40 backdrop-blur-md rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
            <div className="w-8 h-8 flex items-center justify-center bg-[#0d1117] rounded-lg border border-white/10 font-black text-xs text-white/60">
              {index + 4}
            </div>
            <Avatar className="h-12 w-12 border-2 border-blue-500/20">
              <AvatarImage src={item.avatarUrl} />
              <AvatarFallback>{index + 4}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[13px] uppercase text-white/90 truncate tracking-tight">{item.username}</p>
              <p className="text-[10px] text-white/40 uppercase">Daily Participant</p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-black text-blue-400 tracking-tight">{formatCoins(type === 'rich' ? item.wallet?.dailySpent : item.stats?.dailyGiftsReceived)}</p>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Coins</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
