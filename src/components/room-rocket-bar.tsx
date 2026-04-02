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
      
      // TRIGGER FLIGHT: Start flight animation 2 seconds before launch completes
      if (diff === 2 && !showFlight) {
        setShowFlight(true);
      }

      if (diff === 0) {
        clearInterval(timer);
        setTimeout(() => setShowFlight(false), 3000); // Reset flight after it finishes
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdownActive, countdownUntil, showFlight]);

  return (
    <>
      {/* 1. COMPACT ROCKET WIDGET (Bottom Right Positioned) */}
      <div className="fixed bottom-28 right-4 z-[60] flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-700">
        
        {/* Countdown Bubble if active */}
        <AnimatePresence>
          {isCountdownActive && timeLeft !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="bg-red-500/90 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-1"
            >
              <Timer className="h-2.5 w-2.5 animate-spin duration-1000" />
              <span>{timeLeft}S</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Rocket Icon Circle */}
        <div className="relative group cursor-pointer active:scale-95 transition-all">
          {/* Progress Ring (SVG) */}
          <svg className="w-12 h-12 -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="rgba(0,0,0,0.4)"
              className="stroke-white/10"
              strokeWidth="3"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="transparent"
              className={cn(
                "transition-all duration-500",
                progressPercent >= 100 ? "stroke-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "stroke-cyan-500"
              )}
              strokeWidth="3"
              strokeDasharray={125.6}
              animate={{ strokeDashoffset: 125.6 - (125.6 * progressPercent) / 100 }}
              strokeLinecap="round"
            />
          </svg>

          {/* Central Rocket Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
               "h-8 w-8 rounded-full flex items-center justify-center transition-all",
               progressPercent >= 100 ? "bg-red-500 shadow-inner" : "bg-white/5"
            )}>
              <Rocket className={cn(
                "h-4 w-4 transition-all",
                progressPercent >= 100 ? "text-white animate-bounce" : "text-white/40",
                progressPercent > 80 && progressPercent < 100 && "animate-vibrate"
              )} />
            </div>
          </div>

          {/* % Label */}
          {!isCountdownActive && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 px-1 py-0.5 rounded-md border border-white/10">
              <span className="text-[7px] font-black text-white leading-none whitespace-nowrap">
                {Math.round(progressPercent)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ROCKET FLIGHT ANIMATION OVERLAY */}
      <AnimatePresence>
        {showFlight && (
          <motion.div 
             className="fixed inset-0 z-[100] pointer-events-none"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
          >
            {/* The Big Flying Rocket */}
            <motion.div
              initial={{ x: "80vw", y: "80vh", rotate: -45, scale: 0.5 }}
              animate={{ 
                x: ["80vw", "40vw", "10vw", "-20vw"],
                y: ["80vh", "30vh", "10vh", "-20vh"],
                scale: [0.5, 1.5, 1, 0.5],
                rotate: [-45, -45, -60, -90]
              }}
              transition={{ duration: 3, ease: "easeIn" }}
              className="absolute pointer-events-auto"
            >
              <div className="relative">
                <Rocket className="h-24 w-24 text-red-500 filter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                {/* Fire Exhaust */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-4 h-12 bg-gradient-to-t from-transparent via-yellow-400 to-red-500 rounded-full animate-pulse" />
                  <div className="w-2 h-8 bg-white/40 rounded-full blur-sm -mt-6 animate-pulse" />
                </div>
                {/* Particles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute bg-yellow-400 rounded-full"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ 
                      opacity: 0, 
                      scale: 0,
                      x: (Math.random() - 0.5) * 50,
                      y: 50 + Math.random() * 50
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    style={{ width: 4, height: 4, left: '50%' }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Launch Glow */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: [0, 0.4, 0] }}
               transition={{ duration: 1 }}
               className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes vibrate {
          0%, 100% { transform: translate(0,0); }
          25% { transform: translate(1px, 1px); }
          50% { transform: translate(-1px, -1px); }
          75% { transform: translate(1px, -1px); }
        }
        .animate-vibrate {
          animation: vibrate 0.1s infinite;
        }
      `}</style>
    </>
  );
}
