'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from "lottie-react";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { getCachedVideo } from '@/hooks/use-media-preloader';

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
  isLuckyGift?: boolean;
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
  targetSeat,
  isLuckyGift = false,
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [useScreenBlend, setUseScreenBlend] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Detection canvas for checking black background once on load
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [flyCoordinates, setFlyCoordinates] = useState<{ x: number; y: number } | null>(null);

  // Calculate seat relative translation offsets for fly animation
  useEffect(() => {
    if (activeGift && targetSeat !== undefined && targetSeat !== null) {
      const timer = setTimeout(() => {
        const seatEl = document.getElementById(`room-seat-${targetSeat}`);
        const containerEl = containerRef.current;
        if (seatEl && containerEl) {
          const seatRect = seatEl.getBoundingClientRect();
          const containerRect = containerEl.getBoundingClientRect();
          
          // Center of the target seat
          const seatCenterX = seatRect.left + seatRect.width / 2;
          const seatCenterY = seatRect.top + seatRect.height / 2;
          
          // Center of the container
          const containerCenterX = containerRect.left + containerRect.width / 2;
          const containerCenterY = containerRect.top + containerRect.height / 2;
          
          // Difference
          const xDiff = seatCenterX - containerCenterX;
          const yDiff = seatCenterY - containerCenterY;
          
          setFlyCoordinates({ x: xDiff, y: yDiff });
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setFlyCoordinates(null);
    }
  }, [activeGift, targetSeat]);

  // Fast black background detection
  const detectBlackBgFromMedia = (media: HTMLVideoElement | HTMLImageElement, w: number, h: number): boolean => {
    if (w <= 0 || h <= 0 || isNaN(w) || isNaN(h)) return false;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(w, 100); // Check a tiny scaled down version to prevent performance hit
    canvas.height = Math.round(canvas.width * (h / w));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Sample a few pixels from edges and corners
      const BLACK_THRESHOLD = 35;
      let blackPixels = 0;
      const samplePoints = [
        [0, 0], [canvas.width - 1, 0], 
        [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1],
        [Math.floor(canvas.width / 2), 2],
        [2, Math.floor(canvas.height / 2)]
      ];
      
      for (const [x, y] of samplePoints) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx] < BLACK_THRESHOLD && data[idx + 1] < BLACK_THRESHOLD && data[idx + 2] < BLACK_THRESHOLD) {
          blackPixels++;
        }
      }
      return blackPixels >= 4; // If most edge/corner samples are black, assume black bg keying
    } catch (e) {
      return false;
    }
  };

  // Image load detection
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const isBlack = detectBlackBgFromMedia(img, img.naturalWidth, img.naturalHeight);
    setUseScreenBlend(isBlack);
  };

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
      setIsVideoReady(false);
      setIsVideoLoading(!!videoUrl);
      setUseScreenBlend(false);

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

  // Cleanup function
  const handleCleanup = () => {
    setActiveGift(null);
    setLottieData(null);
    setIsVideoReady(false);
    setUseScreenBlend(false);
    onComplete();
  };

  // Handle Video Metadata
  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration * 1000; 
    setTimeout(() => {
      handleCleanup();
    }, duration + 500); 
  };

  // Handle Video Ready - Detect black background
  const handleVideoCanPlay = () => {
    setIsVideoReady(true);
    setIsVideoLoading(false);
    
    if (videoRef.current) {
      const isBlack = detectBlackBgFromMedia(videoRef.current, videoRef.current.videoWidth, videoRef.current.videoHeight);
      setUseScreenBlend(isBlack);
    }
  };

  // Handle Video Auto-play with enhanced fallback
  useEffect(() => {
    if (activeGift && videoUrl && videoRef.current) {
      const playVideo = async () => {
        try {
          const video = videoRef.current!;
          const cachedVideo = getCachedVideo(videoUrl);
          if (cachedVideo && cachedVideo.readyState >= 2) {
            video.src = cachedVideo.src;
            video.currentTime = 0;
          } else {
            video.defaultMuted = false;
            video.muted = false;
            video.playbackRate = 1.0;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.preload = 'auto';
            video.load();
          }
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err) {
          console.warn('[Gift Video] Playback failed, trying muted fallback:', err);
          try {
            if (videoRef.current) {
              videoRef.current.muted = true;
              await videoRef.current.play();
            }
          } catch (e) {
            console.error('[Gift Video] Complete playback failure', e);
          }
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
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.4, ease: "easeInOut" }} 
            className="absolute flex flex-col items-center justify-center z-[1001]"
          >
            <div className="relative flex items-center justify-center">
              {lottieData ? (
                <div className="w-[280px] h-[280px]">
                  <Lottie animationData={lottieData} loop={true} className="w-full h-full" />
                </div>
              ) : videoUrl ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isVideoReady ? 1 : 0, 
                    scale: isVideoReady ? 1 : 0.8 
                  }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="fixed inset-0 w-screen h-screen flex items-center justify-center z-[2000] pointer-events-none"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, transparent 100%)'
                  }}
                >
                  {/* Loading state while video buffers */}
                  {isVideoLoading && !isVideoReady && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn(
                        "h-16 w-16 rounded-full border-4 border-t-transparent animate-spin",
                        tier === 'legendary' ? "border-yellow-400" : tier === 'epic' ? "border-purple-500" : "border-cyan-400"
                      )} />
                    </div>
                  )}
                  
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    autoPlay 
                    playsInline
                    webkit-playsinline="true"
                    preload="auto"
                    disablePictureInPicture
                    controls={false}
                    onCanPlay={handleVideoCanPlay} 
                    onLoadedMetadata={handleVideoMetadata} 
                    onEnded={handleCleanup} 
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                    style={{
                      imageRendering: 'auto',
                      mixBlendMode: useScreenBlend ? 'screen' : 'normal',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  />
                </motion.div>
              ) : imageUrl ? (
                <motion.img 
                  src={imageUrl}
                  alt={giftName || 'Gift'} 
                  className="max-h-[280px] object-contain drop-shadow-2xl"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                  style={{
                    mixBlendMode: useScreenBlend ? 'screen' : 'normal'
                  }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={flyCoordinates ? {
                    scale: 0.05,
                    x: flyCoordinates.x,
                    y: flyCoordinates.y,
                    opacity: 0
                  } : {
                    scale: 1,
                    x: 0,
                    y: 0,
                    opacity: 1
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={flyCoordinates ? {
                    duration: 0.8,
                    ease: [0.25, 1, 0.5, 1]
                  } : {
                    type: "spring",
                    stiffness: 200,
                    damping: 18
                  }}
                />
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
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[900]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
