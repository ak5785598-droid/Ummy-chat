'use client';

import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

export interface GameWinner {
  name: string;
  avatar?: string | null;
  win: number;
}

interface GameResultOverlayProps {
  gameId: string;
  winningSymbol?: string | React.ReactNode; 
  winAmount: number;
  winners?: GameWinner[]; // Keep for immediate user result
}

/**
 * High-Fidelity Game Result Overlay.
 * Dynamically queries the globalGameWins ledger for real-time winners.
 */
export function GameResultOverlay({ gameId, winningSymbol, winAmount, winners: localWinners }: GameResultOverlayProps) {
  const firestore = useFirestore();

  const winsQuery = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return query(
      collection(firestore, 'globalGameWins'),
      where('gameId', '==', gameId),
      orderBy('timestamp', 'desc'),
      limit(3)
    );
  }, [firestore, gameId]);

  const { data: dbWinners } = useCollection(winsQuery);

  const displayWinners = useMemo(() => {
    if (!dbWinners || dbWinners.length === 0) return localWinners || [];
    return dbWinners.map(w => ({
      name: w.username,
      avatar: w.avatarUrl,
      win: w.amount
    }));
  }, [dbWinners, localWinners]);

  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-500 font-headline p-4 select-none pointer-events-auto">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* YOU WIN Header - 3D Typography Sync */}
        <div className="mb-4 relative">
           <h2 className="text-7xl font-black text-yellow-400 uppercase italic tracking-tighter drop-shadow-[0_6px_0_#8b4513] text-center animate-bounce">
             YOU WIN
           </h2>
        </div>

        {/* Reward Bar - Marquee Protocol */}
        <div className="w-full relative mb-4">
           <div className="absolute -top-2 left-0 right-0 flex justify-between px-4 z-20">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-yellow-200 rounded-full shadow-[0_0_8px_#fff] animate-pulse" style={{ animationDelay: `${i*0.1}s` }} />
              ))}
           </div>
           <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-4 z-20">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-yellow-200 rounded-full shadow-[0_0_8px_#fff] animate-pulse" style={{ animationDelay: `${i*0.1}s` }} />
              ))}
           </div>

           <div className="bg-[#5d1a2a] rounded-2xl border-4 border-[#fbbf24]/40 shadow-2xl flex items-center h-24 px-8 overflow-hidden relative">
              <div className="flex items-center gap-6 flex-1">
                 <div className="text-6xl drop-shadow-2xl flex items-center justify-center">
                    {winningSymbol || '🏆'}
                 </div>
                 <div className="h-12 w-[3px] bg-white/20 rounded-full" />
                 <div className="flex items-center gap-3">
                    <GoldCoinIcon className="h-10 w-10 text-yellow-400 drop-shadow-md" />
                    <span className="text-5xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-lg">
                       {winAmount.toLocaleString()}
                    </span>
                 </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
           </div>
        </div>

        {/* Winners List - Burgundy Dimension */}
        <div className="w-full bg-[#4a1424] rounded-[2.5rem] border-2 border-[#fbbf24]/20 shadow-2xl overflow-hidden p-2">
           <div className="divide-y divide-white/5">
              {displayWinners.map((winner, idx) => (
                <div key={idx} className="flex items-center justify-between py-4 px-6 group">
                   <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center w-10 h-10">
                         <span className="text-4xl filter drop-shadow-md">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                         </span>
                      </div>
                      <Avatar className={cn(
                        "h-12 w-12 border-2 shadow-lg",
                        idx === 0 ? "border-yellow-400" : idx === 1 ? "border-blue-300" : "border-orange-400"
                      )}>
                         <AvatarImage src={winner.avatar || undefined} className="object-cover" />
                         <AvatarFallback className="bg-slate-800 text-white font-black text-xs">{(winner.name || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-black text-white uppercase italic tracking-tight truncate w-28">
                         {winner.name}
                      </span>
                   </div>
                   <div className="flex items-center gap-2">
                      <GoldCoinIcon className="h-5 w-5 text-yellow-400" />
                      <span className="text-lg font-black text-yellow-500 italic">
                         {formatValue(winner.win)}
                      </span>
                   </div>
                </div>
              ))}
              {displayWinners.length === 0 && (
                <div className="py-12 text-center opacity-40">
                   <p className="text-xs font-black uppercase italic tracking-widest text-white/60">Awaiting Real Winners...</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}