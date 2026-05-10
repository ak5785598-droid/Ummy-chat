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
  imageUrl, // Agar future me use karna ho
  animationUrl,
  videoUrl,
  soundUrl,
  tier = 'normal',
  onComplete, 
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<any>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false); // Black screen rokne ke liye state
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
      setIsVideoReady(false); // Har naye gift pe reset

      // 1. Play Sound
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.play().catch(e => console.log('Audio error:', e));
      }

      // 2. Haptics
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      // 3. Dynamic Timeout Logic (Agar video nahi hai toh)
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

  // Handle Video Metadata (Exact length pata karne ke liye)
  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration * 1000; // Convert to milliseconds
    
    // Video khatam hote hi clean up karne ka backup
    setTimeout(() => {
      handleCleanup();
    }, duration + 500); // 500ms extra for smooth exit
  };

  // Handle Video Auto-play Force & Sound
  useEffect(() => {
    if (activeGift && videoUrl && videoRef.current) {
      const playVideo = async () => {
        try {
          // Sound ON karne ke liye false kar diya
          videoRef.current!.defaultMuted = false;
          videoRef.current!.muted = false;
          videoRef.current!.playbackRate = 1.15; 
          
          // Fast playback ke liye load force kar diya
          videoRef.current!.load();
          
          const playPromise = videoRef.current!.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err) {
          console.warn('Video Playback with sound failed, browser might be blocking auto-play. Trying muted fallback:', err);
          // Agar browser bina interaction ke sound block karta hai, toh black screen na aaye isliye fallback
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
      <AnimatePresence>
        {activeGift && (
          <motion.div
            key={activeGift.id}
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1, x: 0, y: 0 }}
            // Jab gayab hoga tab ekdam smooth fade out hoga
            exit={{ opacity: 0 }} 
            // Duration thodi badha di hai taaki exit ekdam smooth aur transparent hoke ho
            transition={{ duration: 0.4, ease: "easeInOut" }} 
            className="absolute flex flex-col items-center justify-center z-[1001]"
          >
            {/* NEW 3D SCROLL NAME BANNER */}
            {senderName && receiverName && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -220 }} // Gift ke upar space dene ke liye adjust kiya
                exit={{ opacity: 0 }}
                className="absolute text-center w-[600px] pointer-events-none"
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
                          <path d="M 167 109 Q 500 129 833 109 L 833 251 Q 500 231 167 251 Z" fill="none" stroke="url(#goldEdge)" strokeWidth="3.2"/>
                          <path d="M 167 109 Q 500 129 833 109 L 833 251 Q 500 231 167 251 Z" fill="none" stroke="#fff3b0" strokeWidth="1" opacity=".35"/>
                          <path d="M 146 93 Q 500 119 854 93" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2"/>
                          <path d="M 146 267 Q 500 241 854 267" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="2.5"/>
                          <g transform="translate(172,114)"><use href="#corner"/></g>
                          <g transform="translate(828,114) rotate(90)"><use href="#corner"/></g>
                          <g transform="translate(828,246) rotate(180)"><use href="#corner"/></g>
                          <g transform="translate(172,246) rotate(270)"><use href="#corner"/></g>

                          {/* DYNAMIC TEXT INSIDE THE SVG SCROLL */}
                          <text x="500" y="150" textAnchor="middle" fill="#FFD700" fontSize="32" fontWeight="900" fontFamily="Inter, sans-serif">{senderName}</text>
                          <text x="500" y="175" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12" fontWeight="bold" letterSpacing="4" fontFamily="Inter, sans-serif">SENT GIFT TO</text>
                          <text x="500" y="205" textAnchor="middle" fill="#00FFFF" fontSize="32" fontWeight="900" fontFamily="Inter, sans-serif">{receiverName}</text>
                          <text x="500" y="225" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="900" letterSpacing="6" fontFamily="Inter, sans-serif">{giftName || 'SPECIAL GIFT'}</text>
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

                {/* SCROLL BANNER STYLES - Scoped properly */}
                <style>{`
                  .scroll-stage {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    perspective: 1200px;
                    filter: drop-shadow(0 40px 60px rgba(0,0,0,.55));
                  }
                  .svg-wrap { position: relative; transform-style: preserve-3d; }
                  .scroll-stage svg {
                    width: 100%; height: auto; display: block; overflow: visible;
                    transform: rotateX(12deg);
                    transform-origin: 50% 45%;
                  }
                  .leftRod, .rightRod, .bannerGroup, .floatGroup { will-change: transform; transform-box: view-box; }
                  .bannerGroup { transform-origin: 500px 180px; }
                  
                  /* Always playing state since the component unmounts on complete */
                  .playing .leftRod { animation: leftOpen 3.6s cubic-bezier(.68,-.55,.265,1.55) infinite; }
                  .playing .rightRod { animation: rightOpen 3.6s cubic-bezier(.68,-.55,.265,1.55) infinite; }
                  .playing .bannerGroup { animation: bannerOpen 3.6s cubic-bezier(.68,-.55,.265,1.55) infinite; }
                  .playing .floatGroup { animation: floatY 3.6s ease-in-out infinite; }
                  
                  @keyframes leftOpen {
                    0%,7% { transform: translate3d(380px,0,0); }
                    22%,78% { transform: translate3d(0,0,0); }
                    93%,100% { transform: translate3d(380px,0,0); }
                  }
                  @keyframes rightOpen {
                    0%,7% { transform: translate3d(-380px,0,0); }
                    22%,78% { transform: translate3d(0,0,0); }
                    93%,100% { transform: translate3d(-380px,0,0); }
                  }
                  @keyframes bannerOpen {
                    0%,7% { transform: scaleX(.04); opacity: 0; }
                    12% { opacity: 1; }
                    22%,78% { transform: scaleX(1); opacity: 1; }
                    86% { opacity: 1; }
                    93%,100% { transform: scaleX(.04); opacity: 0; }
                  }
                  @keyframes floatY {
                    0%,7% { transform: translateY(10px); }
                    20% { transform: translateY(0); }
                    35% { transform: translateY(-4px); }
                    50% { transform: translateY(2px); }
                    65% { transform: translateY(-3px); }
                    80%,86% { transform: translateY(0); }
                    100% { transform: translateY(10px); }
                  }
                  @media (prefers-reduced-motion: reduce) {
                    .playing .leftRod, .playing .rightRod, .playing .bannerGroup, .playing .floatGroup { animation: none; }
                  }
                `}</style>
              </motion.div>
            )}

            {/* THE GIFT ITSELF (UNTOUCHED) */}
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
                // Yahan div ko motion.div kar diya hai Center pop in/out effect ke liye
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
                    // Tumhara gradient ekdam same rakha hai edges smooth blend karne ke liye
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, transparent 100%)'
                  }}
                >
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    autoPlay 
                    playsInline
                    webkit-playsinline="true"
                    preload="auto"
                    disablePictureInPicture
                    controls={false}
                    onCanPlay={() => setIsVideoReady(true)} 
                    onLoadedMetadata={handleVideoMetadata} 
                    onEnded={handleCleanup} 
                    className="w-full h-full object-contain bg-transparent"
                  />
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
    </div>
  );
}
