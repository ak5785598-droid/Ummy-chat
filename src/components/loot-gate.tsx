"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Zap, Clock } from "lucide-react";

interface LootGateProps {
  isOpen: boolean;
  levelName: string;
  levelImage?: string;
  entryLimit: number;
  currentEntries: number;
  timeRemaining: number;
  onEnter: () => void;
  hasEntered: boolean;
  onClose: () => void;
}

export function LootGate({
  isOpen,
  levelName,
  levelImage,
  entryLimit,
  currentEntries,
  timeRemaining,
  onEnter,
  hasEntered,
  onClose,
}: LootGateProps) {
  const [gatePhase, setGatePhase] = useState<"opening" | "open" | "closing">("opening");

  useEffect(() => {
    if (isOpen) {
      setGatePhase("opening");
      const timer = setTimeout(() => setGatePhase("open"), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timeRemaining <= 0 && gatePhase === "open") {
      setGatePhase("closing");
      const timer = setTimeout(() => onClose(), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, gatePhase, onClose]);

  const spotsLeft = entryLimit - currentEntries;
  const isFull = currentEntries >= entryLimit;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md"
          >
            {/* Gate Animation */}
            <div className="relative bg-gradient-to-br from-yellow-900/90 via-amber-900/90 to-orange-900/90 backdrop-blur-xl rounded-3xl border-2 border-yellow-500/50 p-8 shadow-2xl shadow-yellow-500/30 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400/30 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -100],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Gate Doors */}
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <AnimatePresence>
                    {gatePhase === "opening" && (
                      <motion.div
                        className="flex gap-4"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          animate={{ x: -150, opacity: 0 }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          className="w-24 h-32 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-lg border-2 border-yellow-400"
                        />
                        <motion.div
                          animate={{ x: 150, opacity: 0 }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          className="w-24 h-32 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-lg border-2 border-yellow-400"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Level Info */}
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-6xl"
                  >
                    {levelName === "Home" && "🏠"}
                    {levelName === "Bank" && "🏦"}
                    {levelName === "Car" && "🚗"}
                    {levelName === "Hotel" && "🏨"}
                    {levelName === "Bus" && "🚌"}
                    {levelName === "Train" && "🚂"}
                    {levelName === "Ship" && "🚢"}
                    {levelName === "Aeroplane" && "✈️"}
                  </motion.div>

                  <h2 className="text-3xl font-black text-white uppercase tracking-wider">
                    {levelName} Loot!
                  </h2>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <Clock className="h-5 w-5" />
                    <span className="text-2xl font-bold">{timeRemaining}s</span>
                  </div>

                  {/* Entry Counter */}
                  <div className="bg-black/30 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-200">Entries</span>
                      <span className="text-white font-bold">
                        {currentEntries} / {entryLimit}
                      </span>
                    </div>
                    <div className="w-full bg-yellow-900/50 rounded-full h-2">
                      <motion.div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          isFull ? "bg-red-500" : "bg-green-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentEntries / entryLimit) * 100}%` }}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-xs font-bold",
                        isFull ? "text-red-400" : spotsLeft <= 5 ? "text-orange-400" : "text-green-400"
                      )}
                    >
                      {isFull
                        ? "GATE FULL!"
                        : `${spotsLeft} spots left`}
                    </p>
                  </div>

                  {/* Enter Button */}
                  {!hasEntered && !isFull && gatePhase === "open" && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Button
                        onClick={onEnter}
                        className="w-full h-16 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-black font-black uppercase text-xl rounded-2xl shadow-lg shadow-green-500/30"
                      >
                        <Zap className="h-6 w-6 mr-2" />
                        ENTER NOW!
                      </Button>
                    </motion.div>
                  )}

                  {hasEntered && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-green-500/20 border border-green-500/50 rounded-2xl p-4"
                    >
                      <p className="text-green-300 font-bold text-lg">
                        ✅ You're inside! Start looting!
                      </p>
                    </motion.div>
                  )}

                  {isFull && !hasEntered && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4">
                      <p className="text-red-300 font-bold text-lg">
                        ❌ Gate is full! Try next time.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
