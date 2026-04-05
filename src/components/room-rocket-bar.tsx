'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- 1. NEW METALLIC BLUE ROCKET (Direct SVG) ---
const CustomBlueRocket = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]", className)}>
    <path d="M25 70 Q15 80 20 100 L35 100 Q40 80 35 70 Z" fill="url(#blueGrad)" stroke="#FFD700" strokeWidth="1"/>
    <path d="M75 70 Q85 80 80 100 L65 100 Q60 80 65 70 Z" fill="url(#blueGrad)" stroke="#FFD700" strokeWidth="1"/>
    <path d="M50 10 C30 40 30 80 35 105 L65 105 C70 80 70 40 50 10 Z" fill="url(#blueGrad)" stroke="#FFD700" strokeWidth="1.5"/>
    <circle cx="50" cy="50" r="8" fill="#1A1A1A" stroke="#FFD700" strokeWidth="2"/>
    <defs>
      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2B5876" /><stop offset="50%" stopColor="#4E4376" /><stop offset="100%" stopColor="#2B5876" />
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
      <div onClick={onOpenRocket} className="fixed bottom-28 right-4 z-[60] flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
        
        {/* Timer Bubble */}
        <AnimatePresence>
          {countdownUntil && timeLeft !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow-lg flex items-center gap-1">
              <Timer className="h-2.5 w-2.5 animate-spin" />
              <span>{timeLeft}S</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          {/* Progress Ring */}
          <svg className="w-12 h-12 -rotate-90">
            <circle cx="24" cy="24" r="21" fill="rgba(0,0,0,0.7)" className="stroke-white/10" strokeWidth="3" />
            <motion.circle
              cx="24" cy="24" r="21" fill="transparent"
              className={cn("transition-all duration-500", progressPercent >= 100 ? "stroke-yellow-500" : "stroke-blue-500")}
              strokeWidth="3" strokeDasharray={131.9}
              animate={{ strokeDashoffset: 131.9 - (131.9 * progressPercent) / 100 }}
              strokeLinecap="round"
            />
          </svg>

          {/* THE ROCKET ICON - ISME AB KOI LOGIC NAHI HAI, DIRECT NAYA ROCKET HAI */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
              <CustomBlueRocket className={cn("h-7 w-7", progressPercent >= 100 && "animate-bounce")} />
          </div>

          {!countdownUntil && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 px-1 py-0.5 rounded border border-white/20 shadow-xl">
              <span className="text-[7px] font-black text-white">{Math.round(progressPercent)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* FLYING ANIMATION */}
      <AnimatePresence>
        {showFlight && (
          <motion.div className="fixed inset-0 z-[100] pointer-events-none">
            <motion.div
              initial={{ x: "80vw", y: "80vh", rotate: -45, scale: 0.5 }}
              animate={{ x: ["80vw", "40vw", "-20vw"], y: ["80vh", "20vh", "-20vh"], scale: [0.5, 2, 0.5], rotate: [-45, -45, -90] }}
              transition={{ duration: 2.5, ease: "easeIn" }}
              className="absolute"
            >
              <CustomBlueRocket className="h-32 w-32" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
