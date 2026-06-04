'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from "lottie-react";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { getCachedVideo, isMediaCached } from '@/hooks/use-media-preloader';

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
  category?: 'luxury' | 'hot' | 'event' | 'customized' | 'lucky'; // Naya prop category
  onComplete: () => void;
  targetSeat?: number; 
  avatarRef?: React.RefObject<HTMLDivElement>;
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
  category = 'luxury', // Default luxury
  onComplete, 
  avatarRef,
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showNameplate, setShowNameplate] = useState(false);
  const [useCanvasProcessing, setUseCanvasProcessing] = useState(false);
  const [imageTargetPosition, setImageTargetPosition] = useState({ x: 0, y: 0, scale: 0 });
  const [startImageAnimation, setStartImageAnimation] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionVideoRef = useRef<HTMLVideoElement>(null);
  const nameplateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingActiveRef = useRef(false);
  const processBufferRef = useRef<Uint8ClampedArray | null>(null);

  // Check if banner should be shown (Lucky ke liye band)
  const shouldShowBanner = React.useMemo(() => {
    return category !== 'lucky';
  }, [category]);

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

  const detectBlackBackground = (video: HTMLVideoElement): Promise<boolean> => {
    return new Promise((resolve) => {
      const canvas = detectionCanvasRef.current;
      if (!canvas) {
        resolve(false);
        return;
      }

      if (video.videoWidth <= 0 || video.videoHeight <= 0 || isNaN(video.videoWidth) || isNaN(video.videoHeight)) {
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
      const topRatio = topBlackCount / topTotal;

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
      const bottomRatio = bottomBlackCount / bottomTotal;

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
      const leftRatio = leftBlackCount / leftTotal;

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
      const rightRatio = rightBlackCount / rightTotal;

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
        return blackPixels / Math.max(totalPixels, 1);
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

      const isSolidBlackBackground = allEdgesBlack && allCornersBlack;

      resolve(isSolidBlackBackground);
    });
  };

  const removeBlackBackgroundFromImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onload = () => {
        const canvas = imageCanvasRef.current;
        if (!canvas) {
          resolve(imageUrl);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const BLACK_THRESHOLD = 50;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
            data[i + 3] = 0;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const transparentImageUrl = canvas.toDataURL('image/png');
        resolve(transparentImageUrl);
      };
      
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  const calculateTargetPosition = () => {
    if (avatarRef?.current) {
      const avatarRect = avatarRef.current.getBoundingClientRect();
      const centerX = avatarRect.left + (avatarRect.width / 2);
      const centerY = avatarRect.top + (avatarRect.height / 2);
      setImageTargetPosition({
        x: centerX,
        y: centerY,
        scale: 0.1
      });
      return true;
    }
    setImageTargetPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      scale: 0.05
    });
    return false;
  };

  useEffect(() => {
    if (giftId) {
      setActiveGift({ id: Date.now() });
      setIsVideoReady(false);
      setIsVideoLoading(!!videoUrl);
      setUseCanvasProcessing(false);
      processingActiveRef.current = false;
      setStartImageAnimation(false);
      
      // Sirf tabhi banner dikhao jab category lucky nahi hai
      if (shouldShowBanner) {
        setShowNameplate(true);
        if (nameplateTimerRef.current) clearTimeout(nameplateTimerRef.current);
        nameplateTimerRef.current = setTimeout(() => {
          setShowNameplate(false);
        }, 3500);
      } else {
        setShowNameplate(false);
      }

      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play().catch(e => console.log('Audio error:', e));
      }

      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      if (imageUrl && !videoUrl && !animationUrl) {
        setTimeout(() => {
          calculateTargetPosition();
          setTimeout(() => {
            setStartImageAnimation(true);
          }, 100);
        }, 100);
        
        const finishTimer = setTimeout(() => {
          handleCleanup();
        }, 3000);
        
        return () => clearTimeout(finishTimer);
      }
      
      if (!videoUrl && !animationUrl) {
        const finishTimer = setTimeout(() => {
          handleCleanup();
        }, 4000);
        return () => clearTimeout(finishTimer);
      }
    } else {
      setShowNameplate(false);
      if (nameplateTimerRef.current) clearTimeout(nameplateTimerRef.current);
    }
  }, [giftId, soundUrl, videoUrl, animationUrl, imageUrl, shouldShowBanner]);

  const processBlackFade = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.paused || video.ended || video.videoWidth <= 0 || video.videoHeight <= 0 || isNaN(video.videoWidth) || isNaN(video.videoHeight)) {
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
    const processHeight = Math.round(processWidth * (video.videoHeight / video.videoWidth) || video.videoHeight);
    
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
    const width = offscreen.width;
    const height = offscreen.height;

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
    const processedImageData = new ImageData(processedData, width, height);
    ctx.putImageData(processedImageData, 0, 0);

    animationFrameRef.current = requestAnimationFrame(processBlackFade);
  };

  useEffect(() => {
    if (activeGift && videoUrl && isVideoReady) {
      setUseCanvasProcessing(tier === 'epic' || tier === 'legendary');
    }
  }, [activeGift, videoUrl, isVideoReady, tier]);

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

  const handleCleanup = () => {
    processingActiveRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (nameplateTimerRef.current) {
      clearTimeout(nameplateTimerRef.current);
      nameplateTimerRef.current = null;
    }
    
    setActiveGift(null);
    setLottieData(null);
    setIsVideoReady(false);
    setShowNameplate(false);
    setUseCanvasProcessing(false);
    setStartImageAnimation(false);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (imageCanvasRef.current) {
      const ctx = imageCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, imageCanvasRef.current.width, imageCanvasRef.current.height);
    }
    
    onComplete();
  };

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration * 1000; 
    
    setTimeout(() => {
      handleCleanup();
    }, duration + 500); 
  };

  const handleVideoCanPlay = async () => {
    setIsVideoReady(true);
    setIsVideoLoading(false);
    
    if (videoRef.current) {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const hasSolidBlackBg = await detectBlackBackground(videoRef.current);
      setUseCanvasProcessing(hasSolidBlackBg);
    }
  };

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
      <canvas ref={imageCanvasRef} className="hidden" />
      
      <canvas 
        ref={detectionCanvasRef}
        className="hidden"
      />

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
            {/* SCROLL BANNER - SIRF TABHI DIKHEGA JAB CATEGORY LUCKY NAHI HAI */}
            {shouldShowBanner && showNameplate && senderName && receiverName && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -220 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute text-center w-[480px] z-[1002]"
              >
                <div className="scroll-stage playing">
                  <div className="svg-wrap">
                    <svg viewBox="0 0 1000 400" aria-label="3D Chinese Scroll Banner">
                      <defs>
                        <linearGradient id="gold" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#5e4200"/>
                          <stop offset="10%" stopColor="#FFD700"/>
                          <stop offset="22%" stopColor="#FFF5B0"/>
                          <stop offset="38%" stopColor="#B8860B"/>
                          <stop offset="52%" stopColor="#FFD700"/>
                          <stop offset="66%" stopColor="#FFF5B0"/>
                          <stop offset="82%" stopColor="#D4AF37"/>
                          <stop offset="100%" stopColor="#5a3e00"/>
                        </linearGradient>
                        <linearGradient id="goldEdge" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#FFF5B0"/>
                          <stop offset="45%" stopColor="#D4AF37"/>
                          <stop offset="100%" stopColor="#8a6a10"/>
                        </linearGradient>
                        <linearGradient id="spec" x1="0" x2="1">
                          <stop offset="0%" stopColor="rgba(255,255,255,0)"/>
                          <stop offset="45%" stopColor="rgba(255,255,255,.9)"/>
                          <stop offset="55%" stopColor="rgba(255,255,255,.9)"/>
                          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                        </linearGradient>
                        <radialGradient id="blue" cx="50%" cy="38%" r="78%">
                          <stop offset="0%" stopColor="#1E3AFF"/>
                          <stop offset="38%" stopColor="#1a2fe6"/>
                          <stop offset="72%" stopColor="#0f1fb0"/>
                          <stop offset="100%" stopColor="#0A1A9C"/>
                        </radialGradient>
                        <radialGradient id="blueCap" cx="35%" cy="28%" r="70%">
                          <stop offset="0%" stopColor="#3550ff"/>
                          <stop offset="55%" stopColor="#0A1A9C"/>
                          <stop offset="100%" stopColor="#050c54"/>
                        </radialGradient>
                        <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="rgba(0,0,0,.5)"/>
                          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                        </radialGradient>
                        <filter id="bannerShadow" x="-20%" y="-30%" width="140%" height="180%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b"/>
                          <feOffset dy="18" result="o"/>
                          <feComponentTransfer><feFuncA type="linear" slope="0.8"/></feComponentTransfer>
                          <feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="innerGlow" x="-10%" y="-10%" width="120%" height="120%">
                          <feGaussianBlur stdDeviation="9" result="g"/>
                          <feComposite in="g" in2="SourceAlpha" operator="in"/>
                          <feFlood floodColor="#8aa6ff" floodOpacity=".28"/>
                          <feComposite operator="in" in2="SourceAlpha"/>
                          <feBlend in="SourceGraphic" mode="screen"/>
                        </filter>
                        <filter id="rodDepth" x="-40%" y="-15%" width="180%" height="160%">
                          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#000" floodOpacity=".55"/>
                        </filter>
                        <g id="corner" fill="none" stroke="url(#goldEdge)" strokeWidth="2.4" strokeLinecap="round">
                          <path d="M0 22 v-9 c0-6.2 5-11.2 11.2-11.2 h9.8" opacity=".98"/>
                          <path d="M3.5 19 v-5 c0-3.8 3.1-6.9 6.9-6.9 h5.6" opacity=".6"/>
                        </g>
                      </defs>

                      <g className="floatGroup">
                        <ellipse cx="500" cy="334" rx="300" ry="30" fill="url(#floorShadow)" opacity=".55"/>

                        <g className="bannerGroup" filter="url(#bannerShadow)">
                          <path d="M 145 92 Q 500 118 855 92 L 855 268 Q 500 242 145 268 Z" fill="url(#blue)" stroke="#07105a" strokeWidth="2.5"/>
                          <path d="M 145 92 Q 500 118 855 92 L 855 268 Q 500 242 145 268 Z" fill="none" filter="url(#innerGlow)"/>
                          
                          <foreignObject x="200" y="110" width="600" height="150">
                            <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full flex flex-col items-center justify-center text-center [&>p]:m-0 [&>p]:leading-tight gap-0">
                              <p className="text-white text-[32px] font-black tracking-tight leading-tight m-0 drop-shadow-md">
                                <span className="text-yellow-400">{senderName}</span>
                              </p>
                              <p className="text-white/80 text-[14px] font-bold uppercase tracking-[0.2em] my-0 leading-tight">
                                sent gift to
                              </p>
                              <p className="text-white text-[32px] font-black tracking-tight leading-tight m-0 drop-shadow-md">
                                <span className="text-cyan-400">{receiverName}</span>
                              </p>
                              {giftName && (
                                <p className="text-white/50 text-[12px] font-black uppercase tracking-[0.3em] mt-1 mb-0 leading-tight drop-shadow-lg">
                                  {giftName}
                                </p>
                              )}
                            </div>
                          </foreignObject>

                          <path d="M 167 109 Q 500 129 833 109 L 833 251 Q 500 231 167 251 Z" fill="none" stroke="url(#goldEdge)" strokeWidth="3.2"/>
                          <path d="M 167 109 Q 500 129 833 109 L 833 251 Q 500 231 167 251 Z" fill="none" stroke="#fff3b0" strokeWidth="1" opacity=".35"/>
                          <path d="M 146 93 Q 500 119 854 93" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2"/>
                          <path d="M 146 267 Q 500 241 854 267" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="2.5"/>
                          <g transform="translate(172,114)"><use href="#corner"/></g>
                          <g transform="translate(828,114) rotate(90)"><use href="#corner"/></g>
                          <g transform="translate(828,246) rotate(180)"><use href="#corner"/></g>
                          <g transform="translate(172,246) rotate(270)"><use href="#corner"/></g>
                        </g>

                        <g className="leftRod" filter="url(#rodDepth)">
                          <ellipse cx="120" cy="324" rx="28" ry="9" fill="#000" opacity=".26"/>
                          <rect x="102" y="52" width="36" height="256" rx="18" fill="url(#gold)"/>
                          <rect x="102" y="52" width="36" height="256" rx="18" fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="2"/>
                          <rect x="110" y="58" width="5" height="244" rx="2.5" fill="url(#spec)" opacity=".78"/>
                          <rect x="124.5" y="58" width="2.2" height="244" rx="1.1" fill="rgba(255,255,255,.18)"/>
                          <ellipse cx="120" cy="52" rx="19" ry="7.5" fill="#050a3b"/>
                          <circle cx="120" cy="45" r="14.5" fill="url(#blueCap)" stroke="#02062a" strokeWidth="1.6"/>
                          <ellipse cx="120" cy="45" rx="9" ry="3.8" fill="rgba(255,255,255,.16)"/>
                          <ellipse cx="120" cy="52" rx="18.5" ry="6" fill="none" stroke="url(#goldEdge)" strokeWidth="1.2" opacity=".9"/>
                          <ellipse cx="120" cy="308" rx="19" ry="7.5" fill="#050a3b"/>
                          <circle cx="120" cy="315" r="14.5" fill="url(#blueCap)" stroke="#02062a" strokeWidth="1.6"/>
                          <ellipse cx="120" cy="315" rx="9" ry="4.2" fill="rgba(0,0,0,.38)"/>
                          <rect x="99.5" y="70" width="41" height="6.5" rx="3.25" fill="url(#gold)" stroke="#7a5a00" strokeWidth="1"/>
                          <rect x="99.5" y="283.5" width="41" height="6.5" rx="3.25" fill="url(#gold)" stroke="#7a5a00" strokeWidth="1"/>
                        </g>

                        <g className="rightRod" filter="url(#rodDepth)">
                          <ellipse cx="880" cy="324" rx="28" ry="9" fill="#000" opacity=".26"/>
                          <rect x="862" y="52" width="36" height="256" rx="18" fill="url(#gold)"/>
                          <rect x="862" y="52" width="36" height="256" rx="18" fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="2"/>
                          <rect x="870" y="58" width="5" height="244" rx="2.5" fill="url(#spec)" opacity=".78"/>
                          <rect x="884.5" y="58" width="2.2" height="244" rx="1.1" fill="rgba(255,255,255,.18)"/>
                          <ellipse cx="880" cy="52" rx="19" ry="7.5" fill="#050a3b"/>
                          <circle cx="880" cy="45" r="14.5" fill="url(#blueCap)" stroke="#02062a" strokeWidth="1.6"/>
                          <ellipse cx="880" cy="45" rx="9" ry="3.8" fill="rgba(255,255,255,.16)"/>
                          <ellipse cx="880" cy="52" rx="18.5" ry="6" fill="none" stroke="url(#goldEdge)" strokeWidth="1.2" opacity=".9"/>
                          <ellipse cx="880" cy="308" rx="19" ry="7.5" fill="#050a3b"/>
                          <circle cx="880" cy="315" r="14.5" fill="url(#blueCap)" stroke="#02062a" strokeWidth="1.6"/>
                          <ellipse cx="880" cy="315" rx="9" ry="4.2" fill="rgba(0,0,0,.38)"/>
                          <rect x="859.5" y="70" width="41" height="6.5" rx="3.25" fill="url(#gold)" stroke="#7a5a00" strokeWidth="1"/>
                          <rect x="859.5" y="283.5" width="41" height="6.5" rx="3.25" fill="url(#gold)" stroke="#7a5a00" strokeWidth="1"/>
                        </g>
                      </g>
                    </svg>
                  </div>
                </div>
              </motion.div>
            )}

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
                    style={{
                      filter: useCanvasProcessing ? 'none' : 'none',
                      imageRendering: 'crisp-edges',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  />
                  
                  {useCanvasProcessing && (
                    <canvas 
                      ref={canvasRef}
                      className="w-full h-full object-contain"
                      style={{ 
                        display: isVideoReady ? 'block' : 'none',
                        background: 'transparent',
                        imageRendering: 'auto',
                        mixBlendMode: 'normal',
                        isolation: 'isolate',
                        filter: 'none',
                        opacity: 1
                      }}
                    />
                  )}
                </motion.div>
              ) : imageUrl ? (
                <motion.img 
                  src={imageUrl} 
                  alt={giftName || 'Gift'} 
                  className="max-h-[280px] object-contain drop-shadow-2xl"
                  initial={{ 
                    scale: 0, 
                    rotateZ: -20,
                    x: 0,
                    y: 0
                  }}
                  animate={startImageAnimation ? {
                    scale: imageTargetPosition.scale,
                    x: imageTargetPosition.x - (window.innerWidth / 2),
                    y: imageTargetPosition.y - (window.innerHeight / 2),
                    rotateZ: 0,
                    opacity: 0
                  } : {
                    scale: 1,
                    rotateZ: 0,
                    x: 0,
                    y: 0,
                    opacity: 1
                  }}
                  exit={{ scale: 0, rotateZ: 20, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 18,
                    duration: startImageAnimation ? 0.8 : 0.5
                  }}
                  style={{
                    filter: "drop-shadow(0 0 20px rgba(0,0,0,0.3))",
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: startImageAnimation ? "none" : "translate(-50%, -50%)",
                    marginLeft: startImageAnimation ? 0 : "-50%",
                    marginTop: startImageAnimation ? 0 : "-50%",
                    willChange: "transform"
                  }}
                  onLoad={async (e) => {
                    const img = e.currentTarget;
                    const transparentUrl = await removeBlackBackgroundFromImage(imageUrl);
                    if (transparentUrl !== imageUrl) {
                      img.src = transparentUrl;
                    }
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

      <style>{`
        .scroll-stage {
          width: 100%; max-width: 900px;
          perspective: 1200px;
          filter: drop-shadow(0 40px 60px rgba(0,0,0,.55));
        }
        .scroll-stage .svg-wrap {
          position: relative; transform-style: preserve-3d;
        }
        .scroll-stage svg {
          width: 100%; height: auto; display: block; overflow: visible;
          transform: rotateX(12deg);
          transform-origin: 50% 45%;
        }
        .scroll-stage .leftRod, .scroll-stage .rightRod, .scroll-stage .bannerGroup, .scroll-stage .floatGroup {
          will-change: transform; transform-box: view-box;
        }
        .scroll-stage .bannerGroup { transform-origin: 500px 180px; }
        
        .scroll-stage.playing .leftRod { animation: leftOpen 3.6s cubic-bezier(.68,-.55,.265,1.55) infinite; }
        .scroll-stage.playing .rightRod { animation: rightOpen 3.6s cubic-bezier(.68,-.55,.265,1.55) infinite; }
        .scroll-stage.playing .bannerGroup { animation: bannerOpen 3.6s cubic-bezier(.68,-.55,.265,1.55) infinite; }
        .scroll-stage.playing .floatGroup { animation: floatY 3.6s ease-in-out infinite; }

        @keyframes leftOpen {
          0%, 7% { transform: translate3d(380px, 0, 0); }
          22%, 78% { transform: translate3d(0, 0, 0); }
          93%, 100% { transform: translate3d(380px, 0, 0); }
        }
        @keyframes rightOpen {
          0%, 7% { transform: translate3d(-380px, 0, 0); }
          22%, 78% { transform: translate3d(0, 0, 0); }
          93%, 100% { transform: translate3d(-380px, 0, 0); }
        }
        @keyframes bannerOpen {
          0%, 7% { transform: scaleX(.04); opacity: 0; }
          12% { opacity: 1; }
          22%, 78% { transform: scaleX(1); opacity: 1; }
          86% { opacity: 1; }
          93%, 100% { transform: scaleX(.04); opacity: 0; }
        }
        @keyframes floatY {
          0%, 7% { transform: translateY(10px); }
          20% { transform: translateY(0); }
          35% { transform: translateY(-4px); }
          50% { transform: translateY(2px); }
          65% { transform: translateY(-3px); }
          80%, 86% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-stage.playing .leftRod, .scroll-stage.playing .rightRod, 
          .scroll-stage.playing .bannerGroup, .scroll-stage.playing .floatGroup { animation: none; }
        }
      `}</style>
    </div>
  );
        }
