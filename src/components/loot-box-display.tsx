"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Lock, Unlock, Zap } from "lucide-react";

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

export function LootBoxDisplay({
  levels,
  currentProgress,
  isGateOpen,
  canOpenGate,
  onOpenGate,
  currentLevelIndex,
  className,
}: LootBoxDisplayProps) {
  const currentLevel = levels[currentLevelIndex];
  const nextLevel = levels[currentLevelIndex + 1];
  const progressToNext = nextLevel
    ? Math.min(
        ((currentProgress - currentLevel.threshold) /
          (nextLevel.threshold - currentLevel.threshold)) *
          100,
        100
      )
    : 100;

  const levelIcons: Record<string, string> = {
    home: "🏠",
    bank: "🏦",
    car: "🚗",
    hotel: "🏨",
    bus: "🚌",
    train: "🚂",
    ship: "🚢",
    aeroplane: "✈️",
  };

  return (
    <div className={cn("relative w-full", className)}>
      <AnimatePresence>
        {!isGateOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-slate-900/90 backdrop-blur-xl rounded-3xl border border-purple-500/30 p-6 shadow-2xl shadow-purple-500/20"
          >
            {/* Current Level Display */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{levelIcons[currentLevel?.id] || "🎁"}</div>
                <div>
                  <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                    {currentLevel?.name || "Home"}
                  </h3>
                  <p className="text-purple-300 text-xs font-medium">
                    Level {currentLevelIndex + 1} of {levels.length}
                  </p>
                </div>
              </div>
              {canOpenGate && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Button
                    onClick={onOpenGate}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-black uppercase text-sm rounded-2xl px-6 py-3 shadow-lg shadow-orange-500/30"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Open Gate
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-purple-300 font-medium">
                  {currentProgress.toLocaleString()} coins
                </span>
                <span className="text-purple-300 font-medium">
                  {nextLevel ? `${nextLevel.threshold.toLocaleString()} to ${nextLevel.name}` : "MAX LEVEL"}
                </span>
              </div>
              <Progress
                value={progressToNext}
                className="h-3 bg-purple-950/50 border border-purple-500/20"
              />
            </div>

            {/* Level Path */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
              {levels.map((level, idx) => {
                const isCompleted = idx < currentLevelIndex;
                const isCurrent = idx === currentLevelIndex;
                const isLocked = idx > currentLevelIndex;

                return (
                  <div
                    key={level.id}
                    className={cn(
                      "flex flex-col items-center gap-1 min-w-[48px]",
                      isCurrent && "scale-110"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
                        isCompleted &&
                          "bg-green-500/20 border-green-500/50 opacity-70",
                        isCurrent &&
                          "bg-purple-500/30 border-purple-400 shadow-lg shadow-purple-500/30",
                        isLocked &&
                          "bg-slate-800/50 border-slate-700/50 opacity-40"
                      )}
                    >
                      {isCompleted ? (
                        "✅"
                      ) : isCurrent ? (
                        levelIcons[level.id] || "🎁"
                      ) : (
                        <Lock className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase truncate w-full text-center",
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
        )}
      </AnimatePresence>
    </div>
  );
}
