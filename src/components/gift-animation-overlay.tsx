'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  videoUrl?: string | null;
  soundUrl?: string | null;
  tier?: 'normal' | 'epic' | 'legendary';
  onComplete: () => void;
  targetSeat?: number; // Prop waise hi rakha hai taaki pichhe ka logic break na ho
}

export function GiftAnimationOverlay({ 
  giftId, 
  giftName,
  senderName,
  receiverName,
  imageUrl,
  animationUrl,
  videoUrl,
  soundUrl,
  tier = 'normal',
  onComplete, 
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

      // 1. Play Sound
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play().catch(e => console.log('Audio error:', e));
      }

      // 2. Haptics
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      // 3. Timelines - Direct finish after 4 seconds (Seat pe jane wala phase hata diya)
      const finishTimer = setTimeout(() => {
        setActiveGift(null);
        setLottieData(null);
        onComplete();
      }, 4000);

      return () => {
        clearTimeout(finishTimer);
      };
    }
  }, [giftId, soundUrl, onComplete]);

  // Handle Video Auto-play Force (Sound On)
  useEffect(() => {
    if (activeGift && videoUrl && videoRef.current) {
      const playVideo = async () => {
        try {
          // Muted true tha, usko hata diya taaki sound play ho
          videoRef.current!.muted = false;
          await videoRef.current!.play();
        } catch (err) {
          console.warn('Video Playback Failed:', err);
        }
      };
      playVideo();
    }
  }, [activeGift, videoUrl]);

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
              scale: 1, // Hamesha center me full size rahega
              x: 0,     // Move nahi hoga
              y: 0,     // Move nahi hoga
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
            {/* NAME BANNER */}
            {senderName && receiverName && (
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
              ) : videoUrl ? (
                <div className="fixed inset-0 w-screen h-screen flex items-center justify-center z-[2000] pointer-events-none">
                  {/* Video se 'muted' hata diya gaya hai */}
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    autoPlay 
                    playsInline
                    webkit-playsinline="true"
                    preload="auto"
                    onEnded={onComplete}
                    className="w-full h-full object-contain bg-transparent"
                  />
                </div>
              ) : imageUrl ? (
                <div className="relative h-48 w-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                  <img src={imageUrl} alt="gift" className="h-full w-full object-contain" />
                </div>
              ) : null /* Ye default '🎁' box hata diya gaya hai */} 
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN AMBIANCE (Only for Legendary) */}
      <AnimatePresence>
        {activeGift && tier === 'legendary' && (
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
