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
  targetSeat?: number; 
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
  const [isVideoReady, setIsVideoReady] = useState(false); // Ye video loading flash rokenge
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

  // Animation trigger logic
  useEffect(() => {
    if (giftId) {
      setActiveGift({ id: Date.now() });
      setIsVideoReady(false); // Reset video ready state on new gift

      // 1. Play Sound
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play().catch(e => console.log('Audio error:', e));
      }

      // 2. Haptics
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      // 3. Dynamic Timeout Logic
      if (!videoUrl) {
        const finishTimer = setTimeout(() => {
          handleCleanup();
        }, 4000);
        return () => clearTimeout(finishTimer);
      }
    }
  }, [giftId, soundUrl, videoUrl]);

  // Cleanup function to avoid repetition
  const handleCleanup = () => {
    setActiveGift(null);
    setLottieData(null);
    setIsVideoReady(false);
    onComplete();
  };

  // Handle Video Metadata
  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration * 1000; 
    
    setTimeout(() => {
      handleCleanup();
    }, duration + 500); 
  };

  // Handle Video Auto-play Force
  useEffect(() => {
    if (activeGift && videoUrl && videoRef.current) {
      const playVideo = async () => {
        try {
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
            // Yahan se scale:0 aur scale:1 hata diya hai. Ab sirf smooth fade in/out hoga
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }} 
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
              <div className={cn(
                "absolute inset-0 blur-[60px] rounded-full scale-150 opacity-40 animate-pulse",
                tier === 'legendary' ? "bg-yellow-400" : tier === 'epic' ? "bg-purple-500" : "bg-cyan-400"
              )} />
              
              {lottieData ? (
                <div className="w-[280px] h-[280px]">
                  <Lottie animationData={lottieData} loop={true} className="w-full h-full" />
                </div>
              ) : videoUrl ? (
                // Video ke liye ab koi full screen ya mask nahi. Center mein aayegi direct.
                <div className="w-[300px] h-[300px] relative flex items-center justify-center pointer-events-none z-[2000]">
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    autoPlay 
                    playsInline
                    webkit-playsinline="true"
                    preload="auto"
                    onLoadedMetadata={handleVideoMetadata} 
                    onEnded={handleCleanup} 
                    // Jaise hi play hone ke layak hogi (bina loading ke), opacity 100 kar denge
                    onCanPlay={() => setIsVideoReady(true)}
                    className={cn(
                      "w-full h-full object-contain bg-transparent transition-opacity duration-300",
                      isVideoReady ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              ) : null} 
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN AMBIANCE */}
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
