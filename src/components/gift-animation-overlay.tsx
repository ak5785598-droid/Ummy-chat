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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showNameplate, setShowNameplate] = useState(false);
  const [useCanvasProcessing, setUseCanvasProcessing] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nameplateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Canvas refs for transparency processing and detection
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Check if checkerboard pattern is CONNECTED on ALL 4 sides
  const detectTransparencyPattern = (video: HTMLVideoElement): Promise<boolean> => {
    return new Promise((resolve) => {
      const canvas = detectionCanvasRef.current;
      if (!canvas) {
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

      const CHECK_SIZE = 8;
      const WHITE_THRESHOLD = 200;
      const GRAY_MIN = 100;
      const GRAY_MAX = 170;
      const COLOR_VARIANCE_THRESHOLD = 30;

      // Function to check if a checker square is valid
      const isCheckerSquare = (startX: number, startY: number): boolean => {
        if (startX < 0 || startY < 0 || startX + CHECK_SIZE > width || startY + CHECK_SIZE > height) {
          return false;
        }

        let avgR = 0, avgG = 0, avgB = 0;
        let pixelCount = 0;

        for (let dy = 0; dy < CHECK_SIZE; dy++) {
          for (let dx = 0; dx < CHECK_SIZE; dx++) {
            const px = startX + dx;
            const py = startY + dy;
            const index = (py * width + px) * 4;
            
            avgR += data[index];
            avgG += data[index + 1];
            avgB += data[index + 2];
            pixelCount++;
          }
        }

        avgR /= pixelCount;
        avgG /= pixelCount;
        avgB /= pixelCount;

        const avgBrightness = (avgR + avgG + avgB) / 3;
        const colorVariance = Math.max(Math.abs(avgR - avgG), Math.abs(avgG - avgB), Math.abs(avgR - avgB));

        const isLightChecker = avgBrightness > WHITE_THRESHOLD && colorVariance < COLOR_VARIANCE_THRESHOLD;
        const isDarkChecker = avgBrightness >= GRAY_MIN && avgBrightness <= GRAY_MAX && colorVariance < COLOR_VARIANCE_THRESHOLD;

        return isLightChecker || isDarkChecker;
      };

      // Check ALL 4 sides - poora edge strip scan karo
      // TOP edge - poora row scan
      let topCheckerCount = 0;
      let topTotalSquares = 0;
      for (let x = 0; x < width - CHECK_SIZE; x += CHECK_SIZE) {
        if (isCheckerSquare(x, 0)) topCheckerCount++;
        topTotalSquares++;
      }
      const topRatio = topCheckerCount / topTotalSquares;

      // BOTTOM edge - poora row scan
      let bottomCheckerCount = 0;
      let bottomTotalSquares = 0;
      const bottomY = height - CHECK_SIZE;
      for (let x = 0; x < width - CHECK_SIZE; x += CHECK_SIZE) {
        if (isCheckerSquare(x, bottomY)) bottomCheckerCount++;
        bottomTotalSquares++;
      }
      const bottomRatio = bottomCheckerCount / bottomTotalSquares;

      // LEFT edge - poora column scan
      let leftCheckerCount = 0;
      let leftTotalSquares = 0;
      for (let y = 0; y < height - CHECK_SIZE; y += CHECK_SIZE) {
        if (isCheckerSquare(0, y)) leftCheckerCount++;
        leftTotalSquares++;
      }
      const leftRatio = leftCheckerCount / leftTotalSquares;

      // RIGHT edge - poora column scan
      let rightCheckerCount = 0;
      let rightTotalSquares = 0;
      const rightX = width - CHECK_SIZE;
      for (let y = 0; y < height - CHECK_SIZE; y += CHECK_SIZE) {
        if (isCheckerSquare(rightX, y)) rightCheckerCount++;
        rightTotalSquares++;
      }
      const rightRatio = rightCheckerCount / rightTotalSquares;

      // CORNERS bhi check karo - connection ke liye zaroori hai
      const topLeftCorner = isCheckerSquare(0, 0);
      const topRightCorner = isCheckerSquare(width - CHECK_SIZE, 0);
      const bottomLeftCorner = isCheckerSquare(0, height - CHECK_SIZE);
      const bottomRightCorner = isCheckerSquare(width - CHECK_SIZE, height - CHECK_SIZE);

      // MINIMUM 70% checkerboard hona chahiye har side pe
      const CHECKERBOARD_THRESHOLD = 0.7;

      const allSidesConnected = 
        topRatio > CHECKERBOARD_THRESHOLD && 
        bottomRatio > CHECKERBOARD_THRESHOLD && 
        leftRatio > CHECKERBOARD_THRESHOLD && 
        rightRatio > CHECKERBOARD_THRESHOLD;

      const allCornersConnected = 
        topLeftCorner && 
        topRightCorner && 
        bottomLeftCorner && 
        bottomRightCorner;

      const isFullyConnected = allSidesConnected && allCornersConnected;

      console.log('🔍 Full Frame Transparency Detection:', {
        topRatio: (topRatio * 100).toFixed(1) + '%',
        bottomRatio: (bottomRatio * 100).toFixed(1) + '%',
        leftRatio: (leftRatio * 100).toFixed(1) + '%',
        rightRatio: (rightRatio * 100).toFixed(1) + '%',
        topLeft: topLeftCorner ? '✅' : '❌',
        topRight: topRightCorner ? '✅' : '❌',
        bottomLeft: bottomLeftCorner ? '✅' : '❌',
        bottomRight: bottomRightCorner ? '✅' : '❌',
        allSidesConnected,
        allCornersConnected,
        verdict: isFullyConnected ? 
          '✅ ALL SIDES CONNECTED - Canvas Processing ON' : 
          '❌ NOT CONNECTED - Normal Video Playback'
      });

      resolve(isFullyConnected);
    });
  };

  // Animation trigger logic
  useEffect(() => {
    if (giftId) {
      setActiveGift({ id: Date.now() });
      setIsVideoReady(false);
      setUseCanvasProcessing(false);
      
      setShowNameplate(true);
      if (nameplateTimerRef.current) clearTimeout(nameplateTimerRef.current);
      nameplateTimerRef.current = setTimeout(() => {
        setShowNameplate(false);
      }, 3500);

      // Play Sound
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play().catch(e => console.log('Audio error:', e));
      }

      // Haptics
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      // Dynamic Timeout Logic
      if (!videoUrl) {
        const finishTimer = setTimeout(() => {
          handleCleanup();
        }, 4000);
        return () => clearTimeout(finishTimer);
      }
    } else {
      setShowNameplate(false);
      if (nameplateTimerRef.current) clearTimeout(nameplateTimerRef.current);
    }
  }, [giftId, soundUrl, videoUrl]);

  // FULL FRAME Transparency Processor - Poora video scan karega
  const processTransparency = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.paused || video.ended) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const len = data.length;

    const WHITE_THRESHOLD = 200;
    const GRAY_MIN = 100;
    const GRAY_MAX = 170;
    const COLOR_VARIANCE_THRESHOLD = 30;

    // POORA FRAME SCAN - har ek pixel check hoga
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const brightness = (r + g + b) / 3;
      const colorVariance = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      
      const isLightChecker = brightness > WHITE_THRESHOLD && colorVariance < COLOR_VARIANCE_THRESHOLD;
      const isDarkChecker = brightness >= GRAY_MIN && brightness <= GRAY_MAX && colorVariance < COLOR_VARIANCE_THRESHOLD;
      
      // Checkerboard pixels ko transparent karo - poore frame mein kahin bhi ho
      if (isLightChecker || isDarkChecker) {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    animationFrameRef.current = requestAnimationFrame(processTransparency);
  };

  // Start/Stop Transparency Processor
  useEffect(() => {
    if (activeGift && videoUrl && isVideoReady && useCanvasProcessing) {
      const startTimer = setTimeout(() => {
        processTransparency();
      }, 100);
      
      return () => {
        clearTimeout(startTimer);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [activeGift, videoUrl, isVideoReady, useCanvasProcessing]);

  // Cleanup function
  const handleCleanup = () => {
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
    onComplete();
  };

  // Handle Video Metadata
  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration * 1000; 
    
    setTimeout(() => {
      handleCleanup();
    }, duration + 500); 
  };

  // Handle Video Ready - Detect CONNECTED transparency checkerboard
  const handleVideoCanPlay = async () => {
    setIsVideoReady(true);
    
    if (videoRef.current) {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const hasConnectedTransparency = await detectTransparencyPattern(videoRef.current);
      setUseCanvasProcessing(hasConnectedTransparency);
      
      if (hasConnectedTransparency) {
        console.log('✅ Canvas ON - Checkerboard connected on ALL 4 sides');
      } else {
        console.log('❌ Canvas OFF - Sides not connected, normal playback');
      }
    }
  };

  // Handle Video Auto-play
  useEffect(() => {
    if (activeGift && videoUrl && videoRef.current) {
      const playVideo = async () => {
        try {
          videoRef.current!.defaultMuted = false;
          videoRef.current!.muted = false;
          videoRef.current!.playbackRate = 1.15; 
          
          videoRef.current!.load();
          
          const playPromise = videoRef.current!.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err) {
          console.warn('Video Playback with sound failed, trying fallback:', err);
          try {
            if (videoRef.current) {
              videoRef.current.muted = true;
              await videoRef.current.play();
            }
          } catch (e) {
            console.error('Fallback video play also failed', e);
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
      {/* Hidden detection canvas */}
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
            {/* 3D SCROLL BANNER NAME PLATE */}
            {showNameplate && senderName && receiverName && (
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
                  {/* Hidden original video (for audio + timing reference) */}
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
                  
                  {/* Canvas showing transparency-processed video - Only when ALL sides connected */}
                  {useCanvasProcessing && (
                    <canvas 
                      ref={canvasRef}
                      className="w-full h-full object-contain bg-transparent"
                      style={{ 
                        display: isVideoReady ? 'block' : 'none',
                        background: 'transparent'
                      }}
                    />
                  )}
                </motion.div>
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

      {/* Scroll Banner Animations Scoped Styles */}
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
