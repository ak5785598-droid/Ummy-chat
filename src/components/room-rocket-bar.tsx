'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Rocket, Zap, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoomRocketBarProps {
  progress: number;
  target: number;
  countdownUntil?: any | null; // Firebase Timestamp or ISO string
}

export function RoomRocketBar({ progress = 0, target = 10000, countdownUntil }: RoomRocketBarProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const progressPercent = Math.min(100, Math.max(0, (progress / target) * 100));
  const isCountdownActive = !!countdownUntil;

  useEffect(() => {
    if (!isCountdownActive) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const end = typeof countdownUntil.toDate === 'function' ? countdownUntil.toDate().getTime() : new Date(countdownUntil).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdownActive, countdownUntil]);

  const barColor = useMemo(() => {
    if (progressPercent < 30) return 'from-blue-500 to-cyan-400';
    if (progressPercent < 70) return 'from-yellow-400 to-orange-500';
    return 'from-orange-500 to-red-600';
  }, [progressPercent]);

  return (
    <div className="w-full px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="relative h-10 w-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-1 overflow-hidden shadow-2xl group">
        
        {/* Progress Fill */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className={cn("absolute inset-y-1 left-1 rounded-xl bg-gradient-to-r shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all duration-500", barColor)}
        >
          {/* Animated Shine for progress fill */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full skew-x-[-45deg] animate-shine" style={{ animationDuration: '2s' }} />
        </motion.div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 z-10">
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center transition-all",
              progressPercent >= 100 ? "bg-yellow-400 animate-bounce" : "bg-white/10"
            )}>
              <Rocket className={cn(
                "h-4 w-4 transition-all",
                progressPercent >= 100 ? "text-red-600 scale-110" : "text-white/40",
                progressPercent > 80 && progressPercent < 100 && "animate-reaction-float"
              )} />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-white/40 tracking-widest leading-none mb-0.5">
                Room Rocket Goal
              </span>
              <span className="text-[11px] font-bold text-white leading-none">
                {progress.toLocaleString()} / {target.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="z-10 flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isCountdownActive ? (
                <motion.div 
                  key="countdown"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                >
                  <Timer className="h-3 w-3 animate-spin duration-1000" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    Launching in {timeLeft}s
                  </span>
                </motion.div>
              ) : (
                <div className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <Zap className={cn("h-3 w-3", progressPercent >= 100 ? "text-yellow-400 fill-current" : "text-white/20")} />
                  <span className="text-[10px] font-black text-white/60 tracking-tighter uppercase italic">
                    {Math.round(progressPercent)}% Full
                  </span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Glow effect for high progress */}
        {progressPercent > 90 && (
          <div className="absolute inset-0 bg-yellow-400/5 animate-pulse pointer-events-none" />
        )}
      </div>
    </div>
  );
}
