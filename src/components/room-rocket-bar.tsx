'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- 1. NEW PREMIUM GOLD ROCKET (Direct SVG) ---
const CustomGoldRocket = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]", className)}>
    {/* Fins */}
    <path d="M25 70 Q15 80 20 100 L35 100 Q40 80 35 70 Z" fill="url(#goldGrad)" stroke="#F59E0B" strokeWidth="1"/>
    <path d="M75 70 Q85 80 80 100 L65 100 Q60 80 65 70 Z" fill="url(#goldGrad)" stroke="#F59E0B" strokeWidth="1"/>
    {/* Body */}
    <path d="M50 10 C30 40 30 80 35 105 L65 105 C70 80 70 40 50 10 Z" fill="url(#goldGrad)" stroke="#FCD34D" strokeWidth="1.5"/>
    {/* Window */}
    <circle cx="50" cy="45" r="7" fill="#1A1A1A" stroke="#F59E0B" strokeWidth="2"/>
    {/* Flame Effect if Launching */}
    <path d="M40 105 Q50 125 60 105" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
    
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);

export function RoomRocketBar({ progress = 0, target = 10000, countdownUntil, onOpenRocket }: any) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showFlight, setShowFlight] = useState(false);

  const progressPercent = Math.min(100, Math.max(0, (progress / target) * 100));

  useEffect(() => {
    if (!countdownUntil) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const end = typeof countdownUntil.toDate === 'function' ? countdownUntil.toDate().getTime() : new Date(countdownUntil).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      if (diff === 2 && !showFlight) setShowFlight(true);
      if (diff === 0) { clearInterval(timer); setTimeout(() => setShowFlight(false), 3000); }
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownUntil, showFlight]);

  return (
    <>
      <div 
        onClick={onOpenRocket} 
        className="fixed bottom-[68px] right-2 z-[40] flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all group"
      >
        
        {/* Timer/Status Bubble */}
        <AnimatePresence>
          {countdownUntil && timeLeft !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.5, y: 10 }} 
              className="bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20 shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center gap-1.5 mb-1"
            >
              <Timer className="h-3 w-3 animate-spin" />
              <span>{timeLeft}S</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "relative p-1.5 rounded-2xl transition-all duration-300 shadow-xl border overflow-hidden",
          "bg-gradient-to-br from-amber-500/10 to-orange-600/20 backdrop-blur-sm border-amber-500/30 group-hover:border-amber-500/50 shadow-amber-900/20"
        )}>
          {/* Progress Ring - Compact Size (Restored) */}
          <div className="relative h-12 w-12 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="21" fill="transparent" className="stroke-white/5" strokeWidth="2" />
              <motion.circle
                cx="24" cy="24" r="21" fill="transparent"
                className={cn("transition-all duration-700", progressPercent >= 100 ? "stroke-amber-400" : "stroke-orange-500")}
                strokeWidth="2.5" strokeDasharray={131.95}
                animate={{ strokeDashoffset: 131.95 - (131.95 * progressPercent) / 100 }}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))' }}
              />
            </svg>

            {/* THE ROCKET ICON - Compact Size (Restored) */}
            <CustomGoldRocket className={cn("h-7.5 w-7.5 relative z-10 transition-transform duration-500 group-hover:scale-110", progressPercent >= 100 && "animate-bounce")} />
          </div>

          {!countdownUntil && (
            <div className="absolute top-1 right-1">
              <div className="bg-amber-500 h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
            </div>
          )}
        </div>

        {/* Floating Percentage Label */}
        {!countdownUntil && (
          <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 shadow-lg">
            <span className="text-[8px] font-black text-amber-400 tracking-tighter uppercase">{Math.round(progressPercent)}% READY</span>
          </div>
        )}
      </div>

      {/* FLYING ANIMATION */}
      <AnimatePresence>
        {showFlight && (
          <motion.div className="fixed inset-0 z-[100] pointer-events-none">
            <motion.div
              initial={{ x: "80vw", y: "80vh", rotate: -45, scale: 0.5 }}
              animate={{ x: ["80vw", "40vw", "-20vw"], y: ["80vh", "20vh", "-20vh"], scale: [0.5, 2.5, 0.5], rotate: [-45, -45, -90] }}
              transition={{ duration: 2.5, ease: "easeIn" }}
              className="absolute"
            >
              <CustomGoldRocket className="h-40 w-40" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
