'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- 1. COMMON BLUE ROCKET ICON (Yahi andar aur bahar dikhega) ---
const CustomRocketIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={cn("drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]", className)}
  >
    <path d="M25 70 Q15 80 20 100 L35 100 Q40 80 35 70 Z" fill="url(#metallicBlue)" stroke="#FFD700" strokeWidth="1"/>
    <path d="M75 70 Q85 80 80 100 L65 100 Q60 80 65 70 Z" fill="url(#metallicBlue)" stroke="#FFD700" strokeWidth="1"/>
    <path d="M50 10 C30 40 30 80 35 105 L65 105 C70 80 70 40 50 10 Z" fill="url(#metallicBlue)" stroke="#FFD700" strokeWidth="1.5"/>
    <circle cx="50" cy="50" r="8" fill="#1A1A1A" stroke="#FFD700" strokeWidth="2"/>
    <rect x="35" y="75" width="30" height="3" fill="#FFD700" />
    <defs>
      <linearGradient id="metallicBlue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2B5876" />
        <stop offset="50%" stopColor="#4E4376" />
        <stop offset="100%" stopColor="#2B5876" />
      </linearGradient>
    </defs>
  </svg>
);

// --- 2. SAME LEVEL LOGIC (Jo Dialog mein hai) ---
const ROCKET_LEVELS = [
  { level: 1, name: 'Star Fighter', unlockAmount: 100000 },
  { level: 2, name: 'Galaxy Destroyer', unlockAmount: 500000 },
  { level: 3, name: 'Cosmic Emperor', unlockAmount: 2000000 }
];

interface RoomRocketBarProps {
  progress: number;
  target: number;
  totalGifts?: number; // Ye add kiya hai levels check karne ke liye
  countdownUntil?: any | null;
  onOpenRocket?: () => void;
}

export function RoomRocketBar({ progress = 0, target = 10000, totalGifts = 0, countdownUntil, onOpenRocket }: RoomRocketBarProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showFlight, setShowFlight] = useState(false);

  // Check current level based on totalGifts
  const currentLevel = useMemo(() => {
    return [...ROCKET_LEVELS].reverse().find(l => totalGifts >= l.unlockAmount) || null;
  }, [totalGifts]);

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
      <div 
        onClick={onOpenRocket}
        className="fixed bottom-28 right-4 z-[60] flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
      >
        {/* Countdown Timer */}
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

        <div className="relative">
          {/* Progress Ring */}
          <svg className="w-12 h-12 -rotate-90">
            <circle cx="24" cy="24" r="21" fill="rgba(0,0,0,0.6)" className="stroke-white/10" strokeWidth="3" />
            <motion.circle
              cx="24" cy="24" r="21" fill="transparent"
              className={cn("transition-all duration-500", progressPercent >= 100 ? "stroke-yellow-400" : "stroke-blue-400")}
              strokeWidth="3"
              strokeDasharray={131.9}
              animate={{ strokeDashoffset: 131.9 - (131.9 * progressPercent) / 100 }}
              strokeLinecap="round"
            />
          </svg>

          {/* CENTRAL ICON - Ab yahan hamesha Blue Rocket dikhega */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
              <CustomRocketIcon className={cn(
                "h-7 w-7",
                progressPercent >= 100 ? "animate-bounce" : (currentLevel ? "opacity-100" : "opacity-40 grayscale")
              )} />
          </div>

          {/* LVL Label */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 px-1 py-0.5 rounded border border-white/20">
            <span className="text-[6px] font-black text-white uppercase leading-none">
              {currentLevel ? `LVL ${currentLevel.level}` : 'LOCKED'}
            </span>
          </div>
        </div>
      </div>

      {/* BIG FLIGHT ANIMATION */}
      <AnimatePresence>
        {showFlight && (
          <motion.div className="fixed inset-0 z-[100] pointer-events-none">
            <motion.div
              initial={{ x: "80vw", y: "80vh", rotate: -45, scale: 0.5 }}
              animate={{ 
                x: ["80vw", "40vw", "-20vw"],
                y: ["80vh", "20vh", "-20vh"],
                scale: [0.5, 2.5, 0.5],
                rotate: [-45, -45, -90]
              }}
              transition={{ duration: 2.5, ease: "easeIn" }}
              className="absolute"
            >
              <CustomRocketIcon className="h-32 w-32" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-20 bg-blue-400/40 blur-xl rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
