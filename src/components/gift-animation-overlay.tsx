'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GiftAnimationOverlayProps {
  giftId: string | null;
  onComplete: () => void;
}

/**
 * High-Fidelity Gift Animation Overlay.
 * Features full-screen cinematic visual effects, screen flashes, and unique high-tier animations.
 * Added "Celebration" gift with party horn sound and confetti explosion.
 */
export function GiftAnimationOverlay({ giftId, onComplete }: GiftAnimationOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);

  const playCelebrationSound = () => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Elite Party Horn Sequence (A-C#-E Chord)
      const now = ctx.currentTime;
      playNote(440, now, 0.3);
      playNote(554.37, now + 0.3, 0.3);
      playNote(659.25, now + 0.6, 0.8);
    } catch (e) {
      console.error("Audio Sync Error:", e);
    }
  };

  useEffect(() => {
    if (giftId) {
      setIsVisible(true);
      setTriggerKey(prev => prev + 1);
      
      if (giftId === 'celebration') {
        playCelebrationSound();
      }
      
      let duration = 3000;
      if (giftId === 'supernova' || giftId === 'galaxy' || giftId === 'rolex') duration = 4000;
      if (giftId === 'dragon' || giftId === 'celebration') duration = 5000;

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [giftId, onComplete]);

  if (!giftId || !isVisible) return null;

  const getEmoji = () => {
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

  const getAnimationClass = () => {
    switch (giftId) {
      case 'heart': return 'animate-heart-burst';
      case 'car': return 'animate-car-drift';
      case 'jet': return 'animate-jet-fly';
      case 'dragon': return 'animate-dragon-soar';
      case 'rocket': return 'animate-rocket-launch';
      case 'galaxy': return 'animate-galaxy-zoom';
      case 'supernova': return 'animate-supernova-burst';
      case 'rolex': return 'animate-rolex-sync';
      case 'celebration': return 'animate-celebration-pop';
      default: return 'animate-bounce scale-[2.0]';
    }
  };

  const isHighTier = ['dragon', 'rocket', 'castle', 'galaxy', 'supernova', 'rolex', 'celebration'].includes(giftId);
  const isUltimate = giftId === 'supernova' || giftId === 'galaxy' || giftId === 'rolex' || giftId === 'celebration';

  return (
    <div key={triggerKey} className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Screen Flash for High Tier Impact */}
      {isHighTier && (
        <div className="absolute inset-0 animate-screen-flash pointer-events-none" />
      )}

      {/* Atmospheric Screen Overlay for Ultimate Tier */}
      {isUltimate && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[3px] animate-in fade-in duration-1000 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent opacity-50 animate-pulse" />
        </div>
      )}

      {/* CONFETTI LAYER for Celebration */}
      {giftId === 'celebration' && (
        <div className="absolute inset-0 z-[310] pointer-events-none">
           {Array.from({ length: 40 }).map((_, i) => {
             const colors = ['bg-pink-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500'];
             const randomColor = colors[Math.floor(Math.random() * colors.length)];
             const left = `${Math.random() * 100}%`;
             const delay = `${Math.random() * 2}s`;
             const size = Math.random() > 0.5 ? 'h-3 w-3' : 'h-2 w-4';
             return (
               <div 
                 key={i} 
                 className={cn("absolute top-[-20px] animate-party-confetti", randomColor, size)}
                 style={{ left, animationDelay: delay }}
               />
             );
           })}
        </div>
      )}

      {/* SPECIAL: Rolex/Celebration Golden Background Light Sync */}
      {(giftId === 'rolex' || giftId === 'celebration') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className={cn(
             "absolute inset-0 animate-in fade-in duration-1000",
             giftId === 'rolex' ? "bg-gradient-to-br from-yellow-500/30 via-yellow-200/20 to-transparent" : "bg-gradient-to-tr from-pink-500/20 via-blue-500/20 to-yellow-500/20"
           )} />
           <div className={cn(
             "w-[500px] h-[500px] rounded-full blur-[150px] animate-pulse scale-[2]",
             giftId === 'rolex' ? "bg-yellow-400/20" : "bg-white/30"
           )} />
           <div className="absolute inset-0 border-[40px] border-white/5 rounded-full scale-[3] animate-ping opacity-20" />
        </div>
      )}

      <div className={cn(
        "text-9xl filter transition-all duration-500",
        giftId === 'rolex' ? "sepia(1) saturate(10) hue-rotate(5deg) brightness(1.2) drop-shadow-[0_0_60px_rgba(255,215,0,1)]" : 
        giftId === 'celebration' ? "drop-shadow-[0_0_80px_rgba(255,255,255,1)] brightness-110" :
        isUltimate ? "drop-shadow-[0_0_60px_rgba(255,255,255,0.9)] scale-125" : "drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]",
        getAnimationClass()
      )}>
        {getEmoji()}
      </div>
      
      {/* Explosive Visual "Particles" for Supernova */}
      {giftId === 'supernova' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-24 h-24 bg-white rounded-full blur-3xl animate-ping scale-[10]" />
           <div className="w-12 h-12 bg-yellow-400 rounded-full blur-2xl animate-ping scale-[15] delay-150" />
        </div>
      )}
    </div>
  );
}
