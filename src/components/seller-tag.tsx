'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * High-Fidelity Seller Tag Component.
 * Designed to mirror the reference image style:
 * - Glossy purple/magenta capsule background.
 * - Glowing pink/magenta 3D border.
 * - Refined 3D Bear icon with pink ears.
 * - Animated sparkles and shine effects.
 */
export function SellerTag({ className, size = 'md' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) {
 const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.2 : 1;
 
 return (
  <div className={cn("relative inline-flex items-center justify-center select-none group", className)} style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}>
   {/* Outer Ambient Glow */}
   <div className="absolute inset-0 bg-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
   
   {/* Main Tag Container */}
   <div className={cn(
    "relative flex items-center gap-2 pl-1 pr-4 py-1.5 bg-gradient-to-b from-[#d946ef] via-[#9333ea] to-[#581c87] rounded-full border-[3px] border-[#f472b6] shadow-[0_0_15px_rgba(244,114,182,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)] overflow-hidden",
    "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:h-1/2 before:z-10"
   )}>
    {/* Dynamic Shine Animation Streak */}
    <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" />
    
    {/* Refined 3D Bear Icon */}
    <div className="relative shrink-0 w-8 h-8 flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-30">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
       <defs>
        <linearGradient id="bearBodyGradSeller" x1="0%" y1="0%" x2="0%" y2="100%">
         <stop offset="0%" stopColor="#fff176" />
         <stop offset="100%" stopColor="#fbc02d" />
        </linearGradient>
        <radialGradient id="pinkEarGradSeller" cx="50%" cy="50%" r="50%">
         <stop offset="0%" stopColor="#ff80ab" />
         <stop offset="100%" stopColor="#f06292" />
        </radialGradient>
       </defs>
       {/* Outer Ears */}
       <circle cx="28" cy="32" r="16" fill="#f9a825" stroke="#e65100" strokeWidth="1" />
       <circle cx="72" cy="32" r="16" fill="#f9a825" stroke="#e65100" strokeWidth="1" />
       {/* Inner Pink Ears */}
       <circle cx="28" cy="32" r="9" fill="url(#pinkEarGradSeller)" />
       <circle cx="72" cy="32" r="9" fill="url(#pinkEarGradSeller)" />
       {/* Face */}
       <circle cx="50" cy="55" r="38" fill="url(#bearBodyGradSeller)" stroke="#e65100" strokeWidth="1" />
       {/* Eyes */}
       <circle cx="38" cy="48" r="4.5" fill="#333" />
       <circle cx="62" cy="48" r="4.5" fill="#333" />
       {/* Muzzle Area */}
       <ellipse cx="50" cy="66" rx="14" ry="11" fill="#fff9c4" opacity="0.9" />
       {/* Nose */}
       <circle cx="50" cy="62" r="4" fill="#333" />
       {/* Simple Smile */}
       <path d="M 44 72 Q 50 76 56 72" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>

    {/* Seller Text */}
    <span className="relative z-30 font-sans text-[15px] font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] tracking-tight">
     Seller
    </span>
    
    {/* Animated Sparkles Around the Tag */}
    <div className="absolute inset-0 pointer-events-none z-40">
      <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping" />
      <div className="absolute bottom-1 left-10 w-0.5 h-0.5 bg-pink-200 rounded-full animate-pulse" />
      <svg viewBox="0 0 24 24" className="absolute top-0 right-6 w-3 h-3 text-white fill-current animate-pulse opacity-60">
       <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" />
      </svg>
    </div>
   </div>
  </div>
 );
}