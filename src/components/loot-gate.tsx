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
  levelVideo?: string;
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
  levelVideo,
  entryLimit,
  currentEntries,
  timeRemaining,
  onEnter,
  hasEntered,
  onClose,
}: LootGateProps) {
  const [gatePhase, setGatePhase] = useState<"opening" | "open" | "closing">("opening");
  const [isCinematicActive, setIsCinematicActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsCinematicActive(true);
      setGatePhase("opening");
      
      // 5 seconds full-screen cinematic animation video
      const timer = setTimeout(() => {
        setIsCinematicActive(false);
        setGatePhase("open");
      }, 5000);
      
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <AnimatePresence mode="wait">
            {isCinematicActive ? (
              <motion.div
                key="cinematic"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden"
              >
                {/* Full screen video / image media */}
                {levelVideo ? (
                  <video 
                    src={levelVideo} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover z-0" 
                  />
                ) : levelImage ? (
                  <img src={levelImage} alt="" className="w-full h-full object-cover opacity-80 z-0" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-950 via-slate-900 to-amber-950 opacity-40 z-0" />
                )}

                {/* Vignette cover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black z-1" />

                {/* Glowing Overlay Text */}
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                  className="relative z-10 flex flex-col items-center justify-center text-center p-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(234,179,8,0.5)] border-2 border-white/20"
                  >
                    <span className="text-4xl">🔑</span>
                  </motion.div>

                  <span className="text-xs font-black uppercase text-yellow-400 tracking-[0.3em] mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    🎉 LEVEL COMPLETE! 🎉
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_30px_rgba(234,179,8,0.7)]">
                    {levelName} Gate
                  </h1>
                  <p className="text-yellow-200/90 text-xs md:text-sm font-semibold tracking-widest mt-3 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    Opening Vault Doors in 5 seconds...
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              /* VAULT ENTRANCE DIALOG */
              <motion.div
                key="vault-gate"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 22 }}
                className="relative w-full max-w-md p-4"
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
                            className="flex gap-1 relative items-center justify-center w-64 h-48"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {/* Golden chest vault doors */}
                            <motion.div
                              animate={{ x: [-6, 6, -6, 6, -3, 3, 0], y: [0, -3, 3, -3, 0] }}
                              transition={{ duration: 0.8, ease: "easeInOut" }}
                              className="flex w-full h-full relative"
                            >
                              <motion.div
                                animate={{ x: -220, opacity: 0, rotateY: -95 }}
                                transition={{ duration: 1.1, delay: 0.8, ease: "easeOut" }}
                                className="w-1/2 h-full bg-gradient-to-r from-amber-700 via-yellow-800 to-amber-900 rounded-l-3xl border-y-4 border-l-4 border-yellow-400 flex items-center justify-end pr-3 relative shadow-[inset_-5px_0_15px_rgba(0,0,0,0.5)]"
                              >
                                {/* Gold Latch Left */}
                                <div className="w-7 h-14 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-300 rounded-l-xl shadow-lg flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 bg-black rounded-full border border-yellow-300" />
                                </div>
                              </motion.div>
                              <motion.div
                                animate={{ x: 220, opacity: 0, rotateY: 95 }}
                                transition={{ duration: 1.1, delay: 0.8, ease: "easeOut" }}
                                className="w-1/2 h-full bg-gradient-to-l from-amber-700 via-yellow-800 to-amber-900 rounded-r-3xl border-y-4 border-r-4 border-yellow-400 flex items-center justify-start pl-3 relative shadow-[inset_5px_0_15px_rgba(0,0,0,0.5)]"
                              >
                                {/* Gold Latch Right */}
                                <div className="w-7 h-14 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-300 rounded-r-xl shadow-lg flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 bg-black rounded-full border border-yellow-300" />
                                </div>
                              </motion.div>
                            </motion.div>

                            {/* Blinding golden light flash when doors unlock/split */}
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: [0, 2.5, 4], opacity: [0, 1, 1, 0] }}
                              transition={{ duration: 1.3, delay: 0.7, ease: "easeOut" }}
                              className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 rounded-full blur-xl z-20 pointer-events-none shadow-[0_0_100px_rgba(234,179,8,1)]"
                            />
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: [0, 1.8, 3], opacity: [0, 0.9, 0] }}
                              transition={{ duration: 1.1, delay: 0.8, ease: "easeOut" }}
                              className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full blur-md z-30 pointer-events-none"
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
                        className="w-32 h-32 mx-auto mb-2 flex items-center justify-center bg-black/20 rounded-2xl overflow-hidden"
                      >
                        {levelVideo ? (
                          <video 
                            src={levelVideo} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            className="w-full h-full object-contain" 
                          />
                        ) : levelImage ? (
                          <img src={levelImage} alt={levelName} className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-6xl">
                            {levelName === "Home" && "🏠"}
                          </div>
                        )}
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
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
