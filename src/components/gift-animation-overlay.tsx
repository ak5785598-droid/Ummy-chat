'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from "lottie-react";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';

interface GiftAnimationOverlayProps {
  giftId: string | null;
  giftName?: string;
  senderName?: string;
  receiverName?: string;
  imageUrl?: string | null;
  animationUrl?: string | null;
  soundUrl?: string | null;
  tier?: 'normal' | 'epic' | 'legendary';
  onComplete: () => void;
  targetSeat?: number;
}

export function GiftAnimationOverlay({ 
  giftId, 
  giftName,
  senderName,
  receiverName,
  imageUrl,
  animationUrl,
  soundUrl,
  tier = 'normal',
  onComplete, 
  targetSeat = 1,
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [phase, setPhase] = useState<'center' | 'target'>('center');
  const [targetCoords, setTargetCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 3x3 Grid Layout - Each seat position with pixel coordinates
  const getSeatTarget = (seat: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: 0, y: 0 };

    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    // Optimized for Mobile (closer seats)
    const spacing = 120; 

    const positions: Record<number, { x: number; y: number }> = {
      1: { x: -spacing, y: -spacing * 2 },   // Top-left
      2: { x: 0,        y: -spacing * 2 },   // Top-center
      3: { x: spacing,  y: -spacing * 2 },   // Top-right
      4: { x: -spacing, y: -spacing },       // Middle-left
      5: { x: 0,        y: -spacing },       // Center
      6: { x: spacing,  y: -spacing },       // Middle-right
      7: { x: -spacing, y: 0 },              // Bottom-left
      8: { x: 0,        y: 0 },              // Bottom-center
      9: { x: spacing,  y: 0 },              // Bottom-right
    };

    return positions[seat] || { x: 0, y: 0 };
  };

  // Recalculate target
  useEffect(() => {
    if (activeGift) {
      setTargetCoords(getSeatTarget(targetSeat));
    }
  }, [activeGift, targetSeat]);

  // Load Lottie Data
  useEffect(() => {
    if (animationUrl) {
      fetch(animationUrl)
        .then(res => res.json())
        .then(data => setLottieData(data))
        .catch(err => console.error('Lottie Load Failed:', err));
    } else {
      setLottieData(null);
    }
  }, [animationUrl]);

  // Animation trigger
  useEffect(() => {
    if (giftId) {
      setActiveGift({ id: Date.now() });
      setPhase('center');

      // 1. Play Sound
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play().catch(e => console.log('Audio error:', e));
      }

      // 2. Haptics
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      // 3. Timelines
      // Show in center for 2 seconds
      const targetTimer = setTimeout(() => {
        setPhase('target');
      }, 2000);

      // Finish after 4 seconds
      const finishTimer = setTimeout(() => {
        setActiveGift(null);
        setLottieData(null);
        onComplete();
      }, 4000);

      return () => {
        clearTimeout(targetTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [giftId, soundUrl, onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden"
    >
      <AnimatePresence>
        {activeGift && (
          <motion.div
            key={activeGift.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: phase === 'center' ? 1 : 0.4,
              x: phase === 'center' ? 0 : targetCoords.x,
              y: phase === 'center' ? 0 : targetCoords.y,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 70,
              damping: 15,
              mass: 1
            }}
            className="absolute flex flex-col items-center justify-center z-[1001]"
          >
            {/* NAME BANNER (Only in Center Phase) */}
            {phase === 'center' && senderName && receiverName && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -180 }}
                exit={{ opacity: 0 }}
                className="absolute text-center w-[300px]"
              >
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-2xl">
                  <p className="text-white text-lg font-black tracking-tight leading-tight">
                    <span className="text-yellow-400">{senderName}</span>
                  </p>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] my-0.5">sent gift to</p>
                  <p className="text-white text-lg font-black tracking-tight leading-tight">
                    <span className="text-cyan-400">{receiverName}</span>
                  </p>
                </div>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mt-3 drop-shadow-lg">
                  {giftName || 'Special Gift'}
                </p>
              </motion.div>
            )}

            {/* THE GIFT ITSELF */}
            <div className="relative flex items-center justify-center">
              {/* Premium Glow */}
              <div className={cn(
                "absolute inset-0 blur-[60px] rounded-full scale-150 opacity-40 animate-pulse",
                tier === 'legendary' ? "bg-yellow-400" : tier === 'epic' ? "bg-purple-500" : "bg-cyan-400"
              )} />
              
              {lottieData ? (
                <div className="w-[280px] h-[280px]">
                  <Lottie 
                    animationData={lottieData} 
                    loop={true} 
                    className="w-full h-full"
                  />
                </div>
              ) : imageUrl ? (
                <div className="relative h-48 w-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                  <img src={imageUrl} alt="gift" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="text-9xl animate-bounce">🎁</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN AMBIANCE (Only for Legendary) */}
      <AnimatePresence>
        {activeGift && phase === 'center' && tier === 'legendary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[900]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
