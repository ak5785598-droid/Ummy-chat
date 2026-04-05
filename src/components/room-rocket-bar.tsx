'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Zap, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- YE HAI NAYA BLUE METALLIC ROCKET (CHOTE ICON KE LIYE) ---
const MiniBlueRocket = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={cn("drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]", className)}
  >
    {/* Side Thrusters */}
    <path d="M25 70 Q15 80 20 100 L35 100 Q40 80 35 70 Z" fill="url(#blueGrad)" stroke="#FFD700" strokeWidth="1"/>
    <path d="M75 70 Q85 80 80 100 L65 100 Q60 80 65 70 Z" fill="url(#blueGrad)" stroke="#FFD700" strokeWidth="1"/>
    {/* Body */}
    <path d="M50 10 C30 40 30 80 35 105 L65 105 C70 80 70 40 50 10 Z" fill="url(#blueGrad)" stroke="#FFD700" strokeWidth="1.5"/>
    <circle cx="50" cy="50" r="8" fill="#000" stroke="#FFD700" strokeWidth="1"/>
    <defs>
      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
  </svg>
);

interface RoomRocketBarProps {
  progress: number;
  target: number;
  countdownUntil?: any | null;
  onOpenRocket?: () => void; // Click handle karne ke liye
}

export function RoomRocketBar({ progress = 0, target = 10000, countdownUntil, onOpenRocket }: RoomRocketBarProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showFlight, setShowFlight] = useState(false);

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
      if (diff === 2 && !showFlight) setShowFlight(true);
      if (diff === 0) {
        clearInterval(timer);
        setTimeout(() => setShowFlight(false), 3000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCountdownActive, countdownUntil, showFlight]);

  return (
    <>
      {/* 1. FLOATING WIDGET (Jo screen par dikhta hai) */}
      <div 
        onClick={onOpenRocket}
        className="fixed bottom-28 right-4 z-[60] flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
      >
        {/* Countdown Bubble */}
        <AnimatePresence>
          {isCountdownActive && timeLeft !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-lg flex items-center gap-1"
            >
              <Timer className="h-2.5 w-2.5 animate-spin" />
              <span>{timeLeft}S</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer Ring & Blue Rocket Icon */}
        <div className="relative">
          {/* Progress Ring */}
          <svg className="w-12 h-12 -rotate-90">
            <circle cx="24" cy="24" r="21" fill="rgba(0,0,0,0.5)" className="stroke-white/10" strokeWidth="3" />
            <motion.circle
              cx="24" cy="24" r="21" fill="transparent"
              className={cn("transition-all duration-500", progressPercent >= 100 ? "stroke-yellow-400" : "stroke-blue-400")}
              strokeWidth="3"
              strokeDasharray={131.9}
              animate={{ strokeDashoffset: 131.9 - (131.9 * progressPercent) / 100 }}
              strokeLinecap="round"
            />
          </svg>

          {/* Central Blue Rocket Icon - AB YE CHANGE HOGA */}
          <div className="absolute inset-0 flex items-center justify-center p-2.5">
            <div className={cn(
               "h-full w-full rounded-full flex items-center justify-center transition-all",
               progressPercent >= 100 ? "bg-blue-500/20 shadow-[0_0_10px_#3b82f6]" : "bg-black/20"
            )}>
              {/* Yahan humne naya Blue Rocket icon daal diya hai */}
              <MiniBlueRocket className={cn(
                "h-7 w-7",
                progressPercent >= 100 ? "animate-bounce" : "opacity-90"
              )} />
            </div>
          </div>

          {/* % Label */}
          {!isCountdownActive && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 px-1 py-0.5 rounded-md border border-white/10">
              <span className="text-[7px] font-black text-white leading-none">
                {Math.round(progressPercent)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ROCKET FLIGHT (Bada Rocket jab udta hai) */}
      <AnimatePresence>
        {showFlight && (
          <motion.div className="fixed inset-0 z-[100] pointer-events-none">
            <motion.div
              initial={{ x: "80vw", y: "80vh", rotate: -45, scale: 0.5 }}
              animate={{ 
                x: ["80vw", "40vw", "-20vw"],
                y: ["80vh", "20vh", "-20vh"],
                scale: [0.5, 2, 0.5],
                rotate: [-45, -45, -90]
              }}
              transition={{ duration: 2.5, ease: "easeIn" }}
              className="absolute"
            >
              {/* Udta hua rocket bhi Blue wala hoga */}
              <MiniBlueRocket className="h-28 w-28" />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4 h-16 bg-blue-400 blur-lg rounded-full animate-pulse" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
