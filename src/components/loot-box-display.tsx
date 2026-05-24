"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";

interface LootLevel {
  id: string;
  name: string;
  threshold: number;
  image: string;
  animation: string;
  voice: string;
}

interface LootBoxDisplayProps {
  levels: LootLevel[];
  currentProgress: number;
  isGateOpen: boolean;
  canOpenGate: boolean;
  onOpenGate: () => void;
  currentLevelIndex: number;
  className?: string;
}

const levelIcons: Record<string, string> = {
  home: "🏠",
  bank: "🏦",
  car: "🚗",
  hotel: "",
  bus: "🚌",
  train: "🚂",
  ship: "🚢",
  aeroplane: "✈️",
};

export function LootBoxDisplay({
  levels,
  currentProgress,
  isGateOpen,
  canOpenGate,
  onOpenGate,
  currentLevelIndex,
  className,
  isGateCompleted,
}: LootBoxDisplayProps) {
  const [showLevelPath, setShowLevelPath] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeLevel = levels[activeIndex];
  const currentLevel = levels[currentLevelIndex];
  const nextLevel = levels[currentLevelIndex + 1];

  // Calculate progress within current level
  const lastLevelThreshold = levels[levels.length - 1]?.threshold || 500000;
  const effectiveProgress = currentProgress % lastLevelThreshold;

  const progressPercent = nextLevel
    ? Math.min(
        Math.max(
          ((effectiveProgress - currentLevel.threshold) /
            (nextLevel.threshold - currentLevel.threshold)) * 100,
          0
        ),
        100
      )
    : effectiveProgress >= currentLevel.threshold ? 100 : 0;

  // 1-second auto-scrolling carousel logic
  useEffect(() => {
    // If the active level's gate is completed but still locked, pause scrolling
    const needsGateOpen = canOpenGate && !isGateCompleted;
    if (needsGateOpen) {
      setActiveIndex(currentLevelIndex);
      return;
    }

    if (showLevelPath) return; // Pause scrolling on level path view

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % levels.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [levels.length, canOpenGate, isGateCompleted, currentLevelIndex, showLevelPath]);

  if (isGateOpen) return null;

  // Calculate progress to display for the active carousel level
  let displayPercent = 0;
  if (activeIndex < currentLevelIndex) {
    displayPercent = 100;
  } else if (activeIndex === currentLevelIndex) {
    displayPercent = Math.round(progressPercent);
  } else {
    displayPercent = 0;
  }

  const isCurrentActiveLevel = activeIndex === currentLevelIndex;
  const isLootGateLocked = isCurrentActiveLevel && canOpenGate && !isGateCompleted;

  return (
    <div className={cn("relative select-none", className)}>
      {/* 60x60 Auto-Scrolling Card Carousel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={() => {
          if (isLootGateLocked) {
            onOpenGate();
          } else {
            setShowLevelPath(!showLevelPath);
          }
        }}
        className={cn(
          "w-[60px] h-[60px] rounded-2xl border cursor-pointer active:scale-95 transition-all shadow-lg",
          "bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl",
          "border-purple-500/30 shadow-purple-500/20",
          "flex flex-col items-center justify-between p-1.5 relative overflow-hidden isolate",
          isLootGateLocked && "border-yellow-400 shadow-yellow-500/35 border-2 animate-pulse"
        )}
      >
        {/* Carousel Slide Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-between p-1.5 z-0"
          >
            {/* Background Image / Icon */}
            {activeLevel?.image ? (
              <>
                <img 
                  src={activeLevel.image} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover z-0" 
                />
                <div className="absolute inset-0 bg-black/55 z-[1]" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20 z-0">
                <span className="text-3xl leading-none">{levelIcons[activeLevel?.id] || ""}</span>
              </div>
            )}

            {/* Level Tag & Completion Indicators */}
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="text-[7px] font-black text-white uppercase tracking-tighter leading-none mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {activeLevel?.name || "Home"}
              </span>

              {/* Status Icons */}
              {activeIndex < currentLevelIndex ? (
                <span className="text-[6px] text-green-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">✅</span>
              ) : activeIndex > currentLevelIndex ? (
                <Lock className="h-1.5 w-1.5 text-slate-500/90" />
              ) : null}
            </div>

            {/* Progress indicator */}
            <div className="relative z-10 w-full mt-auto space-y-0.5">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${displayPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[5px] font-black text-purple-200 text-center block leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {displayPercent}%
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* GORGEOUS GLOWING CENTRAL GATE LOCK OVERLAY */}
        {isLootGateLocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-xs"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenGate();
              }}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all",
                "bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-black font-black",
                "shadow-lg shadow-orange-500/50 hover:shadow-orange-500/80 active:scale-90 border-2 border-white/50"
              )}
            >
              <Unlock className="h-4.5 w-4.5 animate-bounce" />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Level Path Popup (Show on Tap) */}
      <AnimatePresence>
        {showLevelPath && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowLevelPath(false)}
            />
            
            {/* Popup Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-[70px] right-0 z-50 w-[280px] bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-purple-500/30 p-5 shadow-2xl shadow-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-base uppercase">
                    {currentLevel?.name || "Home"}
                  </h3>
                  <p className="text-purple-300 text-xs">
                    Level {currentLevelIndex + 1} of {levels.length}
                  </p>
                </div>
                {canOpenGate && !isGateCompleted && (
                  <Button
                    onClick={onOpenGate}
                    size="sm"
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-xs rounded-xl px-4 py-2"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Open Gate
                  </Button>
                )}
              </div>

              {/* Progress Info */}
              <div className="mb-4 p-3 bg-white/5 rounded-2xl">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-purple-300">{effectiveProgress.toLocaleString()} coins</span>
                  <span className="text-purple-300">
                    {nextLevel ? `${nextLevel.threshold.toLocaleString()} to ${nextLevel.name}` : "MAX"}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Level Path */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {levels.map((level, idx) => {
                  const isCompleted = idx < currentLevelIndex;
                  const isCurrent = idx === currentLevelIndex;
                  const isLocked = idx > currentLevelIndex;

                  return (
                    <div
                      key={level.id}
                      className={cn(
                        "flex flex-col items-center gap-1 shrink-0",
                        isCurrent && "scale-110"
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all",
                          isCompleted && "bg-green-500/20 border-green-500/50",
                          isCurrent && "bg-purple-500/30 border-purple-400 shadow-lg shadow-purple-500/30",
                          isLocked && "bg-slate-800/50 border-slate-700/50 opacity-40"
                        )}
                      >
                        {isCompleted ? (
                          "✅"
                        ) : isCurrent ? (
                          level.image ? (
                            <img src={level.image} alt={level.name} className="w-full h-full object-contain rounded-full" />
                          ) : (
                            <span className="text-base">{levelIcons[level.id] || ""}</span>
                          )
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[7px] font-bold uppercase",
                          isCompleted && "text-green-400",
                          isCurrent && "text-purple-300",
                          isLocked && "text-slate-600"
                        )}
                      >
                        {level.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
