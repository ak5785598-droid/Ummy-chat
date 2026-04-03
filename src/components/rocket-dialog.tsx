'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Rocket, Lock, Trophy, Gift, Users, X, Zap, CheckCircle2 } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';

interface RocketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalGifts: number;
  roomName: string;
}

const ROCKET_LEVELS = [
  {
    level: 1,
    name: 'Star Fighter',
    unlockAmount: 100000, // 1 Lakh
    color: 'from-green-400 to-green-600',
    glowColor: 'shadow-green-500/50',
    icon: '🚀',
    rewards: [
      { type: 'frame', name: 'Star Frame', days: 1 },
      { type: 'car', name: 'Sports Car', days: 1 },
      { type: 'exp', name: 'EXP', amount: 10000 }
    ]
  },
  {
    level: 2,
    name: 'Galaxy Destroyer',
    unlockAmount: 500000, // 5 Lakh
    color: 'from-purple-400 to-purple-600',
    glowColor: 'shadow-purple-500/50',
    icon: '🚀',
    rewards: [
      { type: 'frame', name: 'Galaxy Frame', days: 3 },
      { type: 'jet', name: 'Private Jet', days: 3 },
      { type: 'exp', name: 'EXP', amount: 50000 }
    ]
  },
  {
    level: 3,
    name: 'Cosmic Emperor',
    unlockAmount: 2000000, // 20 Lakh
    color: 'from-red-400 via-orange-400 to-yellow-400',
    glowColor: 'shadow-orange-500/50',
    icon: '🚀',
    rewards: [
      { type: 'frame', name: 'Emperor Frame', days: 7 },
      { type: 'yacht', name: 'Luxury Yacht', days: 7 },
      { type: 'exp', name: 'EXP', amount: 200000 }
    ]
  }
];

export function RocketDialog({ open, onOpenChange, totalGifts, roomName }: RocketDialogProps) {
  const currentLevel = useMemo(() => {
    for (let i = ROCKET_LEVELS.length - 1; i >= 0; i--) {
      if (totalGifts >= ROCKET_LEVELS[i].unlockAmount) {
        return ROCKET_LEVELS[i];
      }
    }
    return null;
  }, [totalGifts]);

  const nextLevel = useMemo(() => {
    return ROCKET_LEVELS.find(l => totalGifts < l.unlockAmount) || null;
  }, [totalGifts]);

  const progressPercent = useMemo(() => {
    if (!nextLevel) return 100;
    const prevLevel = ROCKET_LEVELS.find(l => l.level === nextLevel.level - 1);
    const prevAmount = prevLevel ? prevLevel.unlockAmount : 0;
    const progress = ((totalGifts - prevAmount) / (nextLevel.unlockAmount - prevAmount)) * 100;
    return Math.min(progress, 100);
  }, [totalGifts, nextLevel]);

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return cr % 1 === 0 ? `${cr}Cr` : `${cr.toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
      const lakh = amount / 100000;
      return lakh % 1 === 0 ? `${lakh}L` : `${lakh.toFixed(1)}L`;
    }
    if (amount >= 1000) {
      const k = amount / 1000;
      return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    return amount.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] w-[92%] bg-[#0f141e]/90 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden text-white shadow-[0_0_80px_rgba(30,58,138,0.4)] rounded-[2.5rem] border-white/20 outline-none ring-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Rocket System</DialogTitle>
          <DialogDescription>Unlock powerful rockets by sending gifts</DialogDescription>
        </DialogHeader>

        {/* Header with current rocket */}
        <div className="relative p-6 pt-8 bg-gradient-to-b from-blue-600/20 to-transparent">
          {/* Close Button - More prominence */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-xl text-white/80 hover:text-white hover:bg-white/20 transition-all z-50 border border-white/10 active:scale-90"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/5 px-4 py-1 rounded-full border border-white/10 mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">{roomName}</h2>
            </div>
            
            {/* Current Rocket Display */}
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
              {currentLevel ? (
                <div className={cn(
                  "w-36 h-36 rounded-full bg-gradient-to-br flex items-center justify-center text-7xl shadow-2xl relative z-10 border-4 border-white/10",
                  currentLevel.color,
                  currentLevel.glowColor
                )}>
                  <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] animate-bounce-slow">{currentLevel.icon}</span>
                </div>
              ) : (
                <div className="w-36 h-36 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-6xl border-2 border-white/10 relative z-10">
                  <Lock className="h-14 w-14 text-white/20" />
                </div>
              )}
              
              {/* Level Badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-[#12161f] shadow-xl z-20">
                {currentLevel ? `Level ${currentLevel.level}` : 'Locked'}
              </div>
            </div>

            <h3 className="mt-6 text-xl font-black uppercase tracking-tighter italic">
              {currentLevel ? currentLevel.name : 'Initiate Sequence'}
            </h3>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1 italic">Atmospheric Goal</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-6 py-4 bg-white/5 backdrop-blur-sm border-y border-white/10">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Engine Power</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GoldCoinIcon className="h-3 w-3" />
              <span className="text-xs font-black text-white">{formatAmount(totalGifts)}</span>
            </div>
          </div>
          
          {/* Progress Bar - More Premium */}
          <div className="relative h-4 bg-black/40 rounded-full border border-white/10 p-0.5 shadow-inner">
            <div 
              className="absolute inset-y-0.5 left-0.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {nextLevel && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <p className="text-[8px] font-black uppercase tracking-widest text-blue-400/80 italic">
                Need {formatAmount(nextLevel.unlockAmount - totalGifts)} for Lv.{nextLevel.level}
              </p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
          )}
        </div>

        {/* Rocket Levels List */}
        <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
          {ROCKET_LEVELS.map((rocket) => {
            const isUnlocked = totalGifts >= rocket.unlockAmount;
            const isCurrent = currentLevel?.level === rocket.level;
            
            return (
              <div 
                key={rocket.level}
                className={cn(
                  "relative rounded-3xl p-4 border transition-all duration-500",
                  isUnlocked 
                    ? "bg-white/10 border-white/20 shadow-lg" 
                    : "bg-black/20 border-white/5 opacity-40 grayscale-[0.5]"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Rocket Icon */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2 border-white/5 shadow-inner",
                    isUnlocked 
                      ? `bg-gradient-to-br ${rocket.color}` 
                      : "bg-white/5"
                  )}>
                    {isUnlocked ? rocket.icon : <Lock className="h-6 w-6 text-white/20" />}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-tight">{rocket.name}</span>
                      {isCurrent && (
                        <div className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-2 w-2 text-blue-400" />
                          <span className="text-[7px] font-black uppercase text-blue-400">Current</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 opacity-60">
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Goal:</span>
                      <GoldCoinIcon className="h-2 w-2" />
                      <span className="text-[9px] font-black">{formatAmount(rocket.unlockAmount)}</span>
                    </div>

                    {/* Rewards */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {rocket.rewards.map((reward, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                          <span className="text-[7px] font-black uppercase text-white/50">{reward.name || 'EXP'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-white/5 flex items-center justify-center gap-6 border-t border-white/10">
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default group">
            <Trophy className="h-3 w-3 text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60">Top Rewards</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default group">
            <Users className="h-3 w-3 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60">Team Drive</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
