'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * High-Fidelity CS Leader Tag Component.
 * Designed to mirror the reference image exactly:
 * - Intense Blue-to-Magenta nebula gradient.
 * - Glowing 3D golden border with high-intensity aura.
 * - Refined 3D Bear icon with pink ears.
 * - Atmospheric star sparkles and dynamic shine.
 */
export function CsLeaderTag({ className, size = 'md' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.2 : 1;
  
  return (
    <div className={cn("relative inline-flex items-center justify-center select-none group", className)} style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}>
      {/* Intense Outer Aura Glow */}
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-xl opacity-80 animate-pulse" />
      
      {/* Main Tag Container */}
      <div className={cn(
        "relative flex items-center gap-2 pl-1 pr-5 py-1.5 bg-gradient-to-r from-[#0284c7] via-[#7c3aed] to-[#d946ef] rounded-full border-[3px] border-[#fde047] shadow-[0_0_20px_rgba(251,191,36,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:to-transparent before:h-1/2 before:z-10"
      )}>
        {/* Dynamic Shine Streak */}
        <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" />
        
        {/* Mascot Sync */}
        <div className="relative shrink-0 w-9 h-9 flex items-center justify-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] z-30 ml-0.5">
           <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="csLeaderBearFace" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff176" />
                  <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
                <radialGradient id="csLeaderBearEar" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff80ab" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </radialGradient>
              </defs>
              {/* Ears */}
              <circle cx="25" cy="30" r="18" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
              <circle cx="75" cy="30" r="18" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
              <circle cx="25" cy="30" r="10" fill="url(#csLeaderBearEar)" />
              <circle cx="75" cy="30" r="10" fill="url(#csLeaderBearEar)" />
              {/* Head */}
              <circle cx="50" cy="55" r="40" fill="url(#csLeaderBearFace)" stroke="#854d0e" strokeWidth="1" />
              <circle cx="38" cy="48" r="5" fill="#1a1a1a" />
              <circle cx="62" cy="48" r="5" fill="#1a1a1a" />
              <ellipse cx="50" cy="68" rx="15" ry="12" fill="#fff9c4" />
              <circle cx="50" cy="62" r="4.5" fill="#1a1a1a" />
              <path d="M 44 74 Q 50 78 56 74" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
           </svg>
        </div>

        {/* Text Signature */}
        <span className="relative z-30 font-headline text-[16px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] tracking-tight italic">
          CS Leader
        </span>
        
        {/* Star Sparkle Engine */}
        <div className="absolute inset-0 pointer-events-none z-40">
           <div className="absolute top-1 right-3 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
           <div className="absolute bottom-1.5 left-12 w-1 h-1 bg-yellow-200 rounded-full animate-pulse" />
           <svg viewBox="0 0 24 24" className="absolute top-0 right-8 w-4 h-4 text-white fill-current animate-reaction-glitter opacity-80">
              <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" />
           </svg>
           <svg viewBox="0 0 24 24" className="absolute bottom-1 right-2 w-3 h-3 text-yellow-300 fill-current animate-reaction-glitter opacity-60" style={{ animationDelay: '1s' }}>
              <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" />
           </svg>
        </div>
      </div>
    </div>
  );
}