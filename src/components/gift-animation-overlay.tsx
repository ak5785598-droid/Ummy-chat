'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  isLuckyGift,
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [useCanvasProcessing, setUseCanvasProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingActiveRef = useRef(false);
  const processBufferRef = useRef<Uint8ClampedArray | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [flyCoordinates, setFlyCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  // Cleanup function
  const handleCleanup = useCallback(() => {
    processingActiveRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    
    setActiveGift(null);
    setLottieData(null);
    setIsVideoReady(false);
    setIsVideoLoading(false);
    setUseCanvasProcessing(false);
    setProcessedImageUrl(null);
    setFlyCoordinates(null);
    
    // Clear canvases
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    if (offscreenCanvasRef.current) {
      offscreenCanvasRef.current = null;
    }
    
    processBufferRef.current = null;
    
    // Use ref to avoid stale closure
    onCompleteRef.current();
  }, []);

  // Calculate seat coordinates for fly animation
  useEffect(() => {
    if (activeGift && targetSeat !== undefined && targetSeat !== null) {
      const timer = setTimeout(() => {
        const seatEl = document.getElementById(`room-seat-${targetSeat}`);
        const containerEl = containerRef.current;
        if (seatEl && containerEl) {
          const seatRect = seatEl.getBoundingClientRect();
          const containerRect = containerEl.getBoundingClientRect();
          
          const seatCenterX = seatRect.left + seatRect.width / 2;
          const seatCenterY = seatRect.top + seatRect.height / 2;
          const containerCenterX = containerRect.left + containerRect.width / 2;
          const containerCenterY = containerRect.top + containerRect.height / 2;
          
          setFlyCoordinates({ 
            x: seatCenterX - containerCenterX, 
            y: seatCenterY - containerCenterY 
          });
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setFlyCoordinates(null);
    }
  }, [activeGift, targetSeat]);

  // IMAGE BLACK BACKGROUND REMOVAL
  useEffect(() => {
    if (imageUrl && !animationUrl && !videoUrl) {
      setProcessedImageUrl(null);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      
      img.onload = () => {
        const maxSize = 280;
        let width = img.width;
        let height = img.height;
        
        if (height > maxSize) {
          const ratio = maxSize / height;
          width = Math.floor(width * ratio);
          height = maxSize;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          setProcessedImageUrl(imageUrl);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const BLACK_THRESHOLD = 35;
        const DARK_EDGE_THRESHOLD = 60;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
            data[i + 3] = 0;
          } 
          else if (r <= DARK_EDGE_THRESHOLD && g <= DARK_EDGE_THRESHOLD && b <= DARK_EDGE_THRESHOLD) {
            const darkness = Math.max(0, 1 - ((r + g + b) / (3 * DARK_EDGE_THRESHOLD)));
            const newAlpha = Math.floor(255 * (1 - darkness * 0.85));
            data[i + 3] = Math.max(0, Math.min(255, newAlpha));
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        requestAnimationFrame(() => {
          setProcessedImageUrl(canvas.toDataURL('image/png'));
        });
      };
      
      img.onerror = () => {
        setProcessedImageUrl(imageUrl);
      };
    } else {
      setProcessedImageUrl(null);
    }
  }, [imageUrl, animationUrl, videoUrl]);

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

  // Black background detection for video
  const detectBlackBackground = (video: HTMLVideoElement): Promise<boolean> => {
    return new Promise((resolve) => {
      const canvas = detectionCanvasRef.current;
      if (!canvas) {
        resolve(false);
        return;
      }

      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        resolve(false);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(false);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const BLACK_THRESHOLD = 35;
      const BLACK_PIXEL_RATIO = 0.92;
      const EDGE_DEPTH = 5;

      // Check top edge
      let topBlackCount = 0;
      let topTotal = 0;
      for (let y = 0; y < EDGE_DEPTH; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          topTotal++;
          if (data[index] < BLACK_THRESHOLD && 
              data[index + 1] < BLACK_THRESHOLD && 
              data[index + 2] < BLACK_THRESHOLD) {
            topBlackCount++;
          }
        }
      }
      const topRatio = topTotal > 0 ? topBlackCount / topTotal : 0;

      // Check bottom edge
      let bottomBlackCount = 0;
      let bottomTotal = 0;
      for (let y = height - EDGE_DEPTH; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          bottomTotal++;
          if (data[index] < BLACK_THRESHOLD && 
              data[index + 1] < BLACK_THRESHOLD && 
              data[index + 2] < BLACK_THRESHOLD) {
            bottomBlackCount++;
          }
        }
      }
      const bottomRatio = bottomTotal > 0 ? bottomBlackCount / bottomTotal : 0;

      // Check left edge
      let leftBlackCount = 0;
      let leftTotal = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < EDGE_DEPTH; x++) {
          const index = (y * width + x) * 4;
          leftTotal++;
          if (data[index] < BLACK_THRESHOLD && 
              data[index + 1] < BLACK_THRESHOLD && 
              data[index + 2] < BLACK_THRESHOLD) {
            leftBlackCount++;
          }
        }
      }
      const leftRatio = leftTotal > 0 ? leftBlackCount / leftTotal : 0;

      // Check right edge
      let rightBlackCount = 0;
      let rightTotal = 0;
      for (let y = 0; y < height; y++) {
        for (let x = width - EDGE_DEPTH; x < width; x++) {
          const index = (y * width + x) * 4;
          rightTotal++;
          if (data[index] < BLACK_THRESHOLD && 
              data[index + 1] < BLACK_THRESHOLD && 
              data[index + 2] < BLACK_THRESHOLD) {
            rightBlackCount++;
          }
        }
      }
      const rightRatio = rightTotal > 0 ? rightBlackCount / rightTotal : 0;

      // Check corners
      const checkCorner = (startX: number, startY: number, radius: number = 15) => {
        let blackPixels = 0;
        let totalPixels = 0;
        for (let dy = 0; dy < radius; dy++) {
          for (let dx = 0; dx < radius; dx++) {
            const px = startX + dx;
            const py = startY + dy;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const index = (py * width + px) * 4;
              totalPixels++;
              if (data[index] < BLACK_THRESHOLD && 
                  data[index + 1] < BLACK_THRESHOLD && 
                  data[index + 2] < BLACK_THRESHOLD) {
                blackPixels++;
              }
            }
          }
        }
        return totalPixels > 0 ? blackPixels / totalPixels : 0;
      };

      const topLeftCorner = checkCorner(0, 0);
      const topRightCorner = checkCorner(width - 15, 0);
      const bottomLeftCorner = checkCorner(0, height - 15);
      const bottomRightCorner = checkCorner(width - 15, height - 15);

      const allEdgesBlack = topRatio > BLACK_PIXEL_RATIO && 
                           bottomRatio > BLACK_PIXEL_RATIO && 
                           leftRatio > BLACK_PIXEL_RATIO && 
                           rightRatio > BLACK_PIXEL_RATIO;

      const allCornersBlack = topLeftCorner > 0.85 && 
                             topRightCorner > 0.85 && 
                             bottomLeftCorner > 0.85 && 
                             bottomRightCorner > 0.85;

      resolve(allEdgesBlack && allCornersBlack);
    });
  };

  // Black Fade Processor
  const processBlackFade = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.paused || video.ended || video.videoWidth <= 0 || video.videoHeight <= 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      processingActiveRef.current = false;
      return;
    }

    processingActiveRef.current = true;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    
    const offscreen = offscreenCanvasRef.current;
    
    const processWidth = Math.min(video.videoWidth, 360);
    const processHeight = Math.round(processWidth * (video.videoHeight / video.videoWidth));
    
    if (canvas.width !== processWidth || canvas.height !== processHeight) {
      canvas.width = processWidth;
      canvas.height = processHeight;
      offscreen.width = processWidth;
      offscreen.height = processHeight;
    }

    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: true 
    });
    
    const offCtx = offscreen.getContext('2d', { 
      willReadFrequently: true,
      alpha: true 
    });
    
    if (!ctx || !offCtx) return;

    offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);

    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;

    if (!processBufferRef.current || processBufferRef.current.length !== data.length) {
      processBufferRef.current = new Uint8ClampedArray(data);
    } else {
      processBufferRef.current.set(data);
    }
    const processedData = processBufferRef.current;

    const BLACK_R_THRESHOLD = 25;
    const BLACK_G_THRESHOLD = 25;  
    const BLACK_B_THRESHOLD = 25;
    const DARK_GRAY_THRESHOLD = 45;
    const ALPHA_REDUCTION = 0.92;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue;
      
      const isPureBlack = (r <= BLACK_R_THRESHOLD && 
                          g <= BLACK_G_THRESHOLD && 
                          b <= BLACK_B_THRESHOLD);
      
      const isDarkGray = (r <= DARK_GRAY_THRESHOLD && 
                         g <= DARK_GRAY_THRESHOLD && 
                         b <= DARK_GRAY_THRESHOLD);
      
      if (isPureBlack) {
        const newAlpha = Math.floor(a * (1 - ALPHA_REDUCTION));
        processedData[i + 3] = newAlpha;
        if (newAlpha < 20) {
          processedData[i] = Math.floor(r * 0.9);
          processedData[i + 1] = Math.floor(g * 0.9);
          processedData[i + 2] = Math.floor(b * 0.9);
        }
      } else if (isDarkGray) {
        const darknessFactor = 1 - ((r + g + b) / (3 * DARK_GRAY_THRESHOLD));
        const softAlphaReduction = ALPHA_REDUCTION * darknessFactor * 0.7;
        const newAlpha = Math.floor(a * (1 - softAlphaReduction));
        processedData[i + 3] = Math.max(0, Math.min(255, newAlpha));
        if (darknessFactor > 0.5) {
          const blend = darknessFactor * 0.3;
          processedData[i] = Math.floor(r * (1 - blend));
          processedData[i + 1] = Math.floor(g * (1 - blend));
          processedData[i + 2] = Math.floor(b * (1 - blend));
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const processedImageData = new ImageData(processedData, offscreen.width, offscreen.height);
    ctx.putImageData(processedImageData, 0, 0);

    animationFrameRef.current = requestAnimationFrame(processBlackFade);
  };

  // Animation trigger logic
  useEffect(() => {
    if (giftId) {
      setActiveGift({ id: Date.now() });
      setIsVideoReady(false);
      setIsVideoLoading(!!videoUrl);
      setUseCanvasProcessing(false);
      processingActiveRef.current = false;

      // Play Sound
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play().catch(e => console.log('Audio error:', e));
      }

      // Haptics
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      // Timeout for non-video gifts
      if (!videoUrl) {
        cleanupTimerRef.current = setTimeout(() => {
          handleCleanup();
        }, 4000);
      }
    }
    
    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };
  }, [giftId, soundUrl, videoUrl, handleCleanup]);

  // Canvas processing for video
  useEffect(() => {
    if (activeGift && videoUrl && isVideoReady) {
      setUseCanvasProcessing(tier === 'epic' || tier === 'legendary');
    }
  }, [activeGift, videoUrl, isVideoReady, tier]);

  // Start/Stop Black Fade Processor
  useEffect(() => {
    if (activeGift && videoUrl && isVideoReady && useCanvasProcessing) {
      const startTimer = setTimeout(() => {
        processingActiveRef.current = true;
        processBlackFade();
      }, 100);
      
      return () => {
        clearTimeout(startTimer);
        processingActiveRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [activeGift, videoUrl, isVideoReady, useCanvasProcessing]);

  // Handle Video Metadata
  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration * 1000; 
    
    cleanupTimerRef.current = setTimeout(() => {
      handleCleanup();
    }, duration + 500); 
  };

  // Handle Video Ready
  const handleVideoCanPlay = async () => {
    setIsVideoReady(true);
    setIsVideoLoading(false);
    
    if (videoRef.current) {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const hasSolidBlackBg = await detectBlackBackground(videoRef.current);
      setUseCanvasProcessing(hasSolidBlackBg);
    }
  };

  // Handle Video Auto-play
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
            video.muted = false;
            video.playbackRate = 1.0;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.preload = 'auto';
            video.load();
          }
          
          await video.play();
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
      <canvas ref={detectionCanvasRef} className="hidden" />

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
                >
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
                    className={useCanvasProcessing ? "hidden" : "w-full h-full object-contain"}
                    crossOrigin="anonymous"
                  />
                  
                  {useCanvasProcessing && (
                    <canvas 
                      ref={canvasRef}
                      className="w-full h-full object-contain"
                      style={{ 
                        display: isVideoReady ? 'block' : 'none',
                        background: 'transparent'
                      }}
                    />
                  )}
                </motion.div>
              ) : imageUrl ? (
                <motion.img 
                  src={processedImageUrl || imageUrl}
                  alt={giftName || 'Gift'} 
                  className="max-h-[280px] object-contain drop-shadow-2xl"
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
