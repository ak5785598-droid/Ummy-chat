"use client";

import { useState } from "react";
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
}: LootBoxDisplayProps) {
  const [showLevelPath, setShowLevelPath] = useState(false);
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

  if (isGateOpen) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Main 60x60 Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={() => setShowLevelPath(!showLevelPath)}
        className={cn(
          "w-[60px] h-[60px] rounded-2xl border cursor-pointer active:scale-95 transition-all shadow-lg",
          "bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl",
          "border-purple-500/30 shadow-purple-500/20",
          "flex flex-col items-center justify-center p-1.5 relative"
        )}
      >
        {/* Level Icon */}
        <div className="text-xl leading-none mb-0.5 w-full h-full flex items-center justify-center overflow-hidden">
          {currentLevel?.image ? (
            <img src={currentLevel.image} alt={currentLevel.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            levelIcons[currentLevel?.id] || ""
          )}
        </div>

        {/* Level Name */}
        <span className="text-[7px] font-bold text-white uppercase tracking-tighter leading-none">
          {currentLevel?.name || "Home"}
        </span>

        {/* Progress Bar - Rounded Rectangle */}
        <div className="w-full mt-1.5 space-y-0.5">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[6px] font-bold text-purple-300 text-center block leading-none">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Open Gate Icon Overlay */}
        {canOpenGate && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-1 -right-1"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenGate();
              }}
              className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 cursor-pointer"
            >
              <Unlock className="h-3 w-3 text-black" />
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
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
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
                {canOpenGate && (
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
                            <img src={level.image} alt={level.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            levelIcons[level.id] || ""
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
