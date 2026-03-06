'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Sparkles, Star, Crown } from 'lucide-react';

interface GiftAnimationOverlayProps {
  giftId: string | null;
  onComplete: () => void;
}

/**
 * High-Fidelity Gift Animation Engine.
 * Features SVGA-style cinematic sequences for high-tier tribal gifts.
 * RE-ENGINEERED: Now includes elite particle systems for Lucky Gifts (🍀, 👑, 🍁, ⭐).
 */
export function GiftAnimationOverlay({ giftId, onComplete }: GiftAnimationOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);

  useEffect(() => {
    // SOVEREIGN IDENTITY CHECK: Ensure giftId is a valid string frequency
    if (giftId && typeof giftId === 'string') {
      setIsVisible(true);
      setTriggerKey(prev => prev + 1);
      
      // Animation duration protocol
      let duration = 3000;
      if (['galaxy', 'rolex', 'color-carnival', 'lucky-jackpot'].includes(giftId)) duration = 4500;
      if (['dragon', 'celebration', 'propose-ring', 'lucky-crown', 'lucky-star'].includes(giftId)) duration = 5000;

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [giftId, onComplete]);

  if (!giftId || !isVisible || typeof giftId !== 'string') return null;

  const getEmoji = () => {
    if (giftId === 'lucky-clover') return '🍀';
    if (giftId === 'lucky-crown') return '👑';
    if (giftId === 'lucky-maple') return '🍁';
    if (giftId === 'lucky-star') return '⭐';
    
    switch (giftId) {
      case 'rose': return '🌹';
      case 'heart': return '💖';
      case 'ring': return '💍';
      case 'car': return '🏎️';
      case 'jet': return '🛩️';
      case 'dragon': return '🐉';
      case 'rocket': return '🚀';
      case 'castle': return '🏰';
      case 'galaxy': return '🌌';
      case 'supernova': return '💥';
      case 'rolex': return '⌚';
      case 'celebration': return '🥳';
      default: return '🎁';
    }
  };

  return (
    <div key={triggerKey} className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden">
      
      {/* Screen Flash Protocol - Elite high-tier triggers */}
      {['dragon', 'supernova', 'rolex', 'celebration', 'lucky-jackpot', 'lucky-crown', 'lucky-star'].includes(giftId) && (
        <div className="absolute inset-0 animate-screen-flash bg-white pointer-events-none z-[301]" />
      )}

      {/* Lucky Jackpot Protocol */}
      {giftId === 'lucky-jackpot' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in zoom-in duration-700 z-[305]">
           <div className="relative mb-8">
              <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-40 animate-pulse" />
              <div className="bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 border-[6px] border-white p-8 rounded-full shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-shimmer-gold relative z-10">
                 <Trophy className="h-32 w-32 text-white drop-shadow-2xl" />
              </div>
           </div>
           <h2 className="text-7xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl animate-bounce text-center">JACKPOT SYNC</h2>
           <div className="mt-4 flex items-center gap-4 bg-white/10 backdrop-blur-xl px-12 py-4 rounded-full border-2 border-yellow-400/40">
              <span className="text-4xl font-black text-yellow-400 italic">TRIBE LUCK ACTIVE</span>
           </div>
        </div>
      )}

      {/* High-Fidelity Propose Ring Animation */}
      {giftId === 'propose-ring' && <ProposeRingAnimation />}

      {/* Lucky Gift Particle Engine (SVGA-Style Cinematic) */}
      {giftId.startsWith('lucky-') && giftId !== 'lucky-jackpot' && (
        <div className="absolute inset-0 z-[302] flex items-center justify-center">
           {/* Center Burst Visual */}
           <div className={cn(
             "absolute h-64 w-64 rounded-full blur-3xl opacity-20 animate-pulse",
             giftId === 'lucky-clover' ? "bg-green-500" : 
             giftId === 'lucky-crown' ? "bg-yellow-500" :
             giftId === 'lucky-maple' ? "bg-orange-500" : "bg-blue-500"
           )} />

           {/* Floating Particle Roster */}
           {Array.from({ length: 24 }).map((_, i) => (
             <div 
               key={i} 
               className={cn(
                 "absolute opacity-0",
                 giftId === 'lucky-clover' ? "animate-lucky-float-green" : 
                 giftId === 'lucky-crown' ? "animate-lucky-float-gold" :
                 giftId === 'lucky-maple' ? "animate-lucky-float-orange" : "animate-lucky-float-blue"
               )}
               style={{ 
                 left: `${Math.random() * 100}%`, 
                 top: `${Math.random() * 100}%`,
                 animationDelay: `${Math.random() * 2}s`,
                 animationDuration: `${3 + Math.random() * 3}s`,
                 fontSize: `${20 + Math.random() * 40}px`,
                 filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
               }}
             >
                {getEmoji()}
             </div>
           ))}

           {/* Center Icon Scale-Up */}
           <div className="text-[12rem] filter drop-shadow-[0_0_60px_rgba(255,255,255,0.8)] animate-lucky-center-pop">
              {getEmoji()}
           </div>
        </div>
      )}

      {/* Standard High-Tier Animated Emojis */}
      {!giftId.startsWith('lucky-') && !['propose-ring', 'galaxy', 'color-carnival'].includes(giftId) && (
        <div className={cn(
          "text-9xl filter drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] transition-all",
          giftId === 'rolex' ? "animate-rolex-sync" : 
          giftId === 'celebration' ? "animate-celebration-pop" : "animate-bounce scale-[2.0]"
        )}>
          {getEmoji()}
        </div>
      )}

      <style jsx>{`
        @keyframes screen-flash { 0% { opacity: 0; } 10% { opacity: 0.8; } 100% { opacity: 0; } }
        .animate-screen-flash { animation: screen-flash 0.5s ease-out forwards; }
        
        @keyframes rolex-sync {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; filter: brightness(2) sepia(1) saturate(10) hue-rotate(5deg); }
          20% { transform: scale(1.3) rotate(0deg); opacity: 1; filter: brightness(1.5) sepia(1) saturate(10) hue-rotate(5deg); }
          40% { transform: scale(1) rotate(0deg); filter: brightness(1.2) sepia(1) saturate(10) hue-rotate(5deg) drop-shadow(0 0 50px rgba(255, 215, 0, 1)); }
          100% { transform: scale(2) rotate(0deg); opacity: 0; }
        }
        .animate-rolex-sync { animation: rolex-sync 4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes celebration-pop {
          0% { transform: scale(0); opacity: 0; }
          20% { transform: scale(1.5) rotate(10deg); opacity: 1; }
          80% { transform: scale(1.2) rotate(-5deg); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-celebration-pop { animation: celebration-pop 5s ease-in-out forwards; }

        /* LUCKY PARTICLE ANIMATIONS */
        @keyframes lucky-float-green { 0% { transform: translateY(100vh) rotate(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; } }
        .animate-lucky-float-green { animation: lucky-float-green 4s linear infinite; }

        @keyframes lucky-float-gold { 0% { transform: scale(0) rotate(0); opacity: 0; } 50% { opacity: 1; transform: scale(1.2) rotate(180deg); } 100% { transform: scale(2) rotate(360deg); opacity: 0; } }
        .animate-lucky-float-gold { animation: lucky-float-gold 3s ease-out infinite; }

        @keyframes lucky-float-orange { 0% { transform: translate(0, 0) rotate(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(200px, 400px) rotate(720deg); opacity: 0; } }
        .animate-lucky-float-orange { animation: lucky-float-orange 5s ease-in-out infinite; }

        @keyframes lucky-float-blue { 0% { transform: scale(1) translate(0,0); opacity: 0; } 10% { opacity: 1; } 100% { transform: scale(0) translate(-300px, -300px); opacity: 0; } }
        .animate-lucky-float-blue { animation: lucky-float-blue 4s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

        @keyframes lucky-center-pop { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 30% { transform: scale(1.2) rotate(10deg); opacity: 1; } 70% { transform: scale(1) rotate(0deg); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .animate-lucky-center-pop { animation: lucky-center-pop 4s forwards; }
      `}</style>
    </div>
  );
}

const ProposeRingAnimation = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-[4px] animate-in fade-in duration-700">
    <div className="relative z-10 w-[400px] h-[400px] flex items-center justify-center perspective-1000">
      <div className="relative transform-gpu animate-box-entrance">
         <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-black/40 blur-xl rounded-full scale-x-150" />
         <div className="relative w-80 h-80">
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full drop-shadow-2xl">
               <defs>
                  <linearGradient id="boxRedGift" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" stopColor="#ff1a1a" />
                     <stop offset="100%" stopColor="#990000" />
                  </linearGradient>
               </defs>
               <path d="M100 180 C40 160 10 110 10 80 C10 50 40 35 100 70 C160 35 190 50 190 80 C190 110 160 160 100 180" fill="url(#boxRedGift)" stroke="#4d0000" strokeWidth="1" />
            </svg>
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 animate-ring-rise text-8xl">💍</div>
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full z-30 origin-[50%_40%] animate-lid-open">
               <path d="M100 180 C40 160 10 110 10 80 C10 50 40 35 100 70 C160 35 190 50 190 80 C190 110 160 160 100 180" fill="#800000" opacity="0.9" />
            </svg>
         </div>
      </div>
    </div>
    <style jsx>{`
      @keyframes box-entrance { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes lid-open { 0%, 20% { transform: rotateX(0); } 60%, 100% { transform: rotateX(-110deg) translateY(-100px); opacity: 0; } }
      @keyframes ring-rise { 0%, 40% { opacity: 0; transform: translate(-50%, 20px); } 70% { opacity: 1; transform: translate(-50%, -40px) scale(1.5); } 100% { opacity: 0; transform: translate(-50%, -80px) scale(2); } }
      .animate-box-entrance { animation: box-entrance 1.5s forwards; }
      .animate-lid-open { animation: lid-open 5s forwards; }
      .animate-ring-rise { animation: ring-rise 5s forwards; }
    `}</style>
  </div>
);
