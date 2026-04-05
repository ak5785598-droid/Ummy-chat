'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Zap, Timer, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- YE HAI AAPKA NAYA BLUE METALLIC ROCKET COMPONENT ---
const CustomRocketIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={cn("drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]", className)}
  >
    <path d="M22 75 Q12 85 18 105 L35 105 Q40 85 35 75 Z" fill="url(#miniRocketBlue)" stroke="#EAB308" strokeWidth="1"/>
    <path d="M78 75 Q88 85 82 105 L65 105 Q60 85 65 75 Z" fill="url(#miniRocketBlue)" stroke="#EAB308" strokeWidth="1"/>
    <path d="M50 5 C28 40 28 85 35 110 L65 110 C72 85 72 40 50 5 Z" fill="url(#miniRocketBlue)" stroke="#EAB308" strokeWidth="1.5"/>
    <circle cx="50" cy="45" r="9" fill="#0F172A" stroke="#EAB308" strokeWidth="2"/>
    <rect x="35" y="85" width="30" height="4" fill="#EAB308" />
    <defs>
      <linearGradient id="miniRocketBlue" x1="0%" y1="0%" x2="100%" y2="0%">
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
}

export function RoomRocketBar({ progress = 0, target = 10000, countdownUntil }: RoomRocketBarProps) {
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
      
      if (diff === 2 && !showFlight) {
        setShowFlight(true);
      }

      if (diff === 0) {
        clearInterval(timer);
        setTimeout(() => setShowFlight(false), 3000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdownActive, countdownUntil, showFlight]);

  return (
    <>
      {/* 1. COMPACT ROCKET WIDGET */}
      <div className="fixed bottom-28 right-4 z-[60] flex flex-col items-center gap-1.5">
        
        {/* Countdown Bubble */}
        <AnimatePresence>
          {isCountdownActive && timeLeft !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow-lg flex items-center gap-1"
            >
              <Timer className="h-2.5 w-2.5 animate-spin" />
              <span>{timeLeft}S</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Rocket Icon Circle */}
        <div className="relative group cursor-pointer active:scale-90 transition-all">
          <svg className="w-12 h-12 -rotate-90">
            <circle cx="24" cy="24" r="20" fill="rgba(0,0,0,0.6)" className="stroke-white/10" strokeWidth="3" />
            <motion.circle
              cx="24" cy="24" r="20" fill="transparent"
              className={cn("transition-all duration-500", progressPercent >= 100 ? "stroke-red-500" : "stroke-blue-400")}
              strokeWidth="3"
              strokeDasharray={125.6}
              animate={{ strokeDashoffset: 125.6 - (125.6 * progressPercent) / 100 }}
              strokeLinecap="round"
            />
          </svg>

          {/* CENTRAL ICON - AB YAHAN NAYA ROCKET HAI */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
               "h-9 w-9 rounded-full flex items-center justify-center transition-all p-1",
               progressPercent >= 100 ? "bg-red-600/20 shadow-[0_0_10px_red]" : "bg-blue-500/10"
            )}>
              <CustomRocketIcon className={cn(
                "h-7 w-7 transition-all",
                progressPercent >= 100 ? "animate-bounce" : "opacity-90",
                progressPercent > 80 && progressPercent < 100 && "animate-pulse"
              )} />
            </div>
          </div>

          {!isCountdownActive && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 px-1 py-0.5 rounded-md border border-white/10">
              <span className="text-[7px] font-black text-white whitespace-nowrap">
                {Math.round(progressPercent)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ROCKET FLIGHT ANIMATION */}
      <AnimatePresence>
        {showFlight && (
          <motion.div className="fixed inset-0 z-[100] pointer-events-none">
            <motion.div
              initial={{ x: "80vw", y: "80vh", rotate: -45, scale: 0.5 }}
              animate={{ 
                x: ["80vw", "40vw", "-20vw"],
                y: ["80vh", "20vh", "-20vh"],
                scale: [0.5, 1.8, 0.5],
                rotate: [-45, -45, -90]
              }}
              transition={{ duration: 2.5, ease: "easeIn" }}
              className="absolute"
            >
              <CustomRocketIcon className="h-24 w-24" />
              {/* Engine Glow for Big Rocket */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-12 bg-blue-400 blur-md animate-pulse rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
