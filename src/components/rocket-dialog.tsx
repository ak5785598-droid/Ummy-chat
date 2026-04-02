'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Rocket, Lock, Trophy, Gift, Users } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[380px] bg-[#0a0c10] border border-blue-500/30 p-0 overflow-hidden text-white shadow-[0_0_50px_rgba(0,100,255,0.3)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Rocket System</DialogTitle>
          <DialogDescription>Unlock powerful rockets by sending gifts</DialogDescription>
        </DialogHeader>

        {/* Header with current rocket */}
        <div className="relative bg-gradient-to-b from-blue-900/40 to-transparent p-4">
          <div className="absolute inset-0 bg-[url('https://img.icons8.com/color/96/space.png')] opacity-10 bg-center bg-no-repeat" />
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-lg font-bold text-center mb-1">{roomName}</h2>
            <p className="text-xs text-white/60 mb-4">Rocket Progress</p>
            
            {/* Current Rocket Display */}
            <div className="relative">
              {currentLevel ? (
                <div className={cn(
                  "w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center text-6xl shadow-lg",
                  currentLevel.color,
                  currentLevel.glowColor
                )}>
                  <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">{currentLevel.icon}</span>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-6xl border-2 border-white/20">
                  <Lock className="h-12 w-12 text-white/40" />
                </div>
              )}
              
              {/* Level Badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                {currentLevel ? `Lv.${currentLevel.level}` : 'Locked'}
              </div>
            </div>

            <p className="mt-4 text-sm font-medium">
              {currentLevel ? currentLevel.name : 'Unlock Your First Rocket'}
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-4 py-3 bg-black/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">Progress</span>
            <span className="text-xs font-bold text-blue-400">{formatAmount(totalGifts)}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {nextLevel && (
            <p className="text-xs text-center mt-2 text-white/60">
              Need {formatAmount(nextLevel.unlockAmount - totalGifts)} more to unlock Lv.{nextLevel.level}
            </p>
          )}
        </div>

        {/* Rocket Levels */}
        <div className="p-4 space-y-3">
          {ROCKET_LEVELS.map((rocket) => {
            const isUnlocked = totalGifts >= rocket.unlockAmount;
            const isCurrent = currentLevel?.level === rocket.level;
            
            return (
              <div 
                key={rocket.level}
                className={cn(
                  "relative rounded-xl p-3 border transition-all",
                  isUnlocked 
                    ? "bg-gradient-to-r from-white/10 to-transparent border-white/20" 
                    : "bg-white/5 border-white/10 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Rocket Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-lg flex items-center justify-center text-3xl",
                    isUnlocked 
                      ? `bg-gradient-to-br ${rocket.color} shadow-lg ${rocket.glowColor}` 
                      : "bg-white/10"
                  )}>
                    {isUnlocked ? rocket.icon : <Lock className="h-5 w-5 text-white/40" />}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{rocket.name}</span>
                      {isCurrent && (
                        <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">
                      Unlock at {formatAmount(rocket.unlockAmount)}
                    </p>
                  </div>
                  
                  {/* Level Badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isUnlocked ? "bg-blue-500 text-white" : "bg-white/10 text-white/40"
                  )}>
                    {rocket.level}
                  </div>
                </div>

                {/* Rewards Preview */}
                {isUnlocked && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                    {rocket.rewards.map((reward, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[10px] text-white/70">
                        <Gift className="h-3 w-3" />
                        <span>
                          {reward.type === 'exp' ? `${formatAmount(reward.amount)} EXP` : `${reward.days}d ${reward.name}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-3 bg-blue-900/20 border-t border-white/10">
          <div className="flex items-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-400" />
              <span>Top 3 get special rewards</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>All room members contribute</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
