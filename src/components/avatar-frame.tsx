'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarFrameProps {
 frameId?: string | null;
 children: React.ReactNode;
 className?: string;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * High-Fidelity Dynamic Frame Generator
 * Uses complex layered SVG paths instead of CSS borders to achieve the 
 * "perfect" premium look found in Wafa/Haza.
 */
function DynamicFrameGenerator({ frameId }: { frameId: string }) {
 if (frameId.startsWith('frame-gen-')) {
  const idNum = parseInt(frameId.split('-')[2]);
  const colors = [
   { g1: '#fca5a5', g2: '#ef4444', g3: '#991b1b' }, // fire
   { g1: '#93c5fd', g2: '#3b82f6', g3: '#1e3a8a' }, // water
   { g1: '#86efac', g2: '#22c55e', g3: '#14532d' }, // earth
   { g1: '#fde047', g2: '#eab308', g3: '#713f12' }, // lightning
   { g1: '#d8b4fe', g2: '#a855f7', g3: '#581c87' }, // void
   { g1: '#67e8f9', g2: '#06b6d4', g3: '#164e63' }, // ice
  ][idNum % 6];
  
  return (
   <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] overflow-visible">
    <defs>
     <linearGradient id={`aura-${idNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={colors.g1} />
      <stop offset="50%" stopColor={colors.g2} />
      <stop offset="100%" stopColor={colors.g3} />
     </linearGradient>
    </defs>
    {/* Base Ring */}
    <circle cx="50" cy="50" r="48" fill="none" stroke={`url(#aura-${idNum})`} strokeWidth="4" className="animate-spin-slow opacity-90" />
    <circle cx="50" cy="50" r="44" fill="none" stroke={colors.g1} strokeWidth="1" strokeDasharray="5 5" className="animate-spin-reverse opacity-70" style={{ animationDuration: '6s' }} />
    {/* Premium outer flares */}
    <path d="M50 0 L55 5 L50 10 L45 5 Z" fill={colors.g1} className="animate-pulse" />
    <path d="M50 90 L55 95 L50 100 L45 95 Z" fill={colors.g1} className="animate-pulse" />
    <path d="M0 50 L5 45 L10 50 L5 55 Z" fill={colors.g1} className="animate-pulse" />
    <path d="M90 50 L95 45 L100 50 L95 55 Z" fill={colors.g1} className="animate-pulse" />
   </svg>
  );
 }

 switch (frameId) {
  case 'fuffy':
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
     <defs>
      <linearGradient id="fuffyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stopColor="#c4b5fd" />
       <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>
      <filter id="glowFuffy"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
     </defs>
     {/* Core Ring */}
     <circle cx="50" cy="50" r="48" fill="none" stroke="url(#fuffyGrad)" strokeWidth="6" filter="url(#glowFuffy)" />
     <circle cx="50" cy="50" r="44" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.6" strokeDasharray="10 4" className="animate-spin-slow" />
     {/* Fuffy Bow */}
     <g transform="translate(50, 95) scale(1.5)">
      <path d="M-15,-5 Q-20,-15 -10,-15 Q-5,-10 0,-5 Q5,-10 10,-15 Q20,-15 15,-5 Q10,0 5,2 Q0,5 -5,2 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1" className="drop-shadow-lg" />
      <circle cx="0" cy="-2" r="4" fill="#ef4444" />
     </g>
     {/* Magic Dust */}
     <circle cx="20" cy="15" r="2" fill="#fff" className="animate-ping" />
     <circle cx="85" cy="40" r="1.5" fill="#fff" className="animate-pulse" />
    </svg>
   );

  case 'sea-n-sands':
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
     <circle cx="50" cy="50" r="48" fill="none" stroke="#22d3ee" strokeWidth="8" strokeDasharray="15 10" className="animate-spin" style={{ animationDuration: '10s' }} />
     <circle cx="50" cy="50" r="42" fill="none" stroke="#0891b2" strokeWidth="2" opacity="0.8" />
     {/* Vector Watermelon Wedge */}
     <g transform="translate(8, 20) rotate(-30) scale(0.6)" className="drop-shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
      <path d="M0,0 Q20,-20 40,0 L20,30 Z" fill="#ef4444" stroke="#4ade80" strokeWidth="4" />
      <circle cx="15" cy="5" r="1.5" fill="#000" />
      <circle cx="25" cy="5" r="1.5" fill="#000" />
      <circle cx="20" cy="12" r="1.5" fill="#000" />
     </g>
     {/* Cocktails Vector */}
     <g transform="translate(85, 80) rotate(15) scale(0.6)" className="drop-shadow-lg">
      <path d="M-15,-20 L15,-20 L5,5 L5,25 L-5,25 L-5,5 Z" fill="rgba(255,165,0,0.7)" stroke="#fff" strokeWidth="2" />
      <path d="M0,-25 L10,-35" stroke="#ec4899" strokeWidth="3" />
      <circle cx="-10" cy="-20" r="6" fill="#fde047" />
     </g>
    </svg>
   );

  case 'top3family':
  case 'top2family': {
   const isTop2 = frameId === 'top2family';
   const colorA = isTop2 ? '#60a5fa' : '#f472b6';
   const colorB = isTop2 ? '#2563eb' : '#db2777';
   const label = isTop2 ? 'TOP 2' : 'TOP 3';
   
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
     <defs>
      <linearGradient id="topFamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stopColor={colorA} />
       <stop offset="100%" stopColor={colorB} />
      </linearGradient>
      <filter id="glowFam"><feGaussianBlur stdDeviation="3" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
     </defs>
     
     {/* Heavy Metallic Base Rings */}
     <circle cx="50" cy="50" r="48" fill="none" stroke="url(#topFamGrad)" strokeWidth="8" filter="url(#glowFam)" />
     <circle cx="50" cy="50" r="43" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9" />
     <circle cx="50" cy="50" r="53" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
     
     {/* Majestic Crown Top */}
     <g transform="translate(50, -5) scale(0.6)" className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] animate-pulse">
      <path d="M-30,20 L-40,-15 L-15,5 L0,-25 L15,5 L40,-15 L30,20 Z" fill={colorA} stroke="#fff" strokeWidth="3" />
      <circle cx="-40" cy="-15" r="5" fill="#fbbf24" />
      <circle cx="0" cy="-25" r="6" fill="#fbbf24" />
      <circle cx="40" cy="-15" r="5" fill="#fbbf24" />
     </g>

     {/* Text Banner Bottom */}
     <g transform="translate(50, 98) scale(1.2)">
      <path d="M-30,-10 L30,-10 L35,5 L-35,5 Z" fill={colorB} stroke="#fff" strokeWidth="1" className="drop-shadow-lg" />
      <text y="0" fontSize="8" fill="#fff" textAnchor="middle" fontWeight="900" letterSpacing="1">{label}</text>
     </g>
    </svg>
   );
  }

  case 'pink-love':
  case 'rose-gold': {
   const isRose = frameId === 'rose-gold';
   const gradId = isRose ? 'roseGrad' : 'pinkGrad';
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_20px_rgba(244,114,182,0.6)] overflow-visible">
     <defs>
      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
       <stop offset="0%" stopColor={isRose ? "#fcd34d" : "#fbcfe8"} />
       <stop offset="50%" stopColor={isRose ? "#b45309" : "#be185d"} />
       <stop offset="100%" stopColor={isRose ? "#fcd34d" : "#fbcfe8"} />
      </linearGradient>
     </defs>
     <circle cx="50" cy="50" r="48" fill="none" stroke={`url(#${gradId})`} strokeWidth="7" />
     {/* Moving Hearts Path */}
     <g className="animate-spin" style={{ animationDuration: '4s' }}>
      <path d="M45,-2 Q40,-10 50,-5 Q60,-10 55,-2 Q50,5 50,5 Z" fill="#ef4444" stroke="#fff" strokeWidth="1" className="drop-shadow-lg" />
     </g>
     <g className="animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
      <path d="M95,48 Q90,40 100,45 Q110,40 105,48 Q100,55 100,55 Z" fill={isRose ? "#fcd34d" : "#f472b6"} />
     </g>
     <g className="animate-spin" style={{ animationDuration: '8s' }}>
      <path d="M45,98 Q40,90 50,95 Q60,90 55,98 Q50,105 50,105 Z" fill="#ef4444" />
     </g>
    </svg>
   );
  }

  case 'neon-2025':
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
     <defs>
      <filter id="cyberGlow"><feGaussianBlur stdDeviation="4" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
     </defs>
     <circle cx="50" cy="50" r="46" fill="none" stroke="#a855f7" strokeWidth="5" strokeDasharray="30 15" className="animate-spin-slow" filter="url(#cyberGlow)" />
     <circle cx="50" cy="50" r="50" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="10 20" className="animate-spin-reverse" filter="url(#cyberGlow)" style={{ animationDuration: '3s' }} />
     
     <g transform="translate(50, 100)">
      <rect x="-25" y="-12" width="50" height="20" fill="#000" stroke="#06b6d4" strokeWidth="2" rx="4" />
      <text y="2" fontSize="12" textAnchor="middle" fill="#fff" fontWeight="900" style={{ filter: 'drop-shadow(0 0 5px #06b6d4)' }}>2025</text>
     </g>
    </svg>
   );

  case 'basra':
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
     <circle cx="50" cy="50" r="48" fill="none" stroke="#4a3f35" strokeWidth="8" />
     <circle cx="50" cy="50" r="46" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="10 10" className="animate-spin-slow opacity-60" />
     <g transform="translate(85, 85) rotate(-15) scale(0.7)" className="drop-shadow-2xl">
      {/* Magic Teapot Vector */}
      <path d="M-15,-10 Q0,-30 15,-10 L25,10 L-25,10 Z" fill="#ca8a04" stroke="#fef08a" strokeWidth="2" />
      <path d="M-25,0 Q-35,-10 -20,-15" fill="none" stroke="#ca8a04" strokeWidth="4" />
      <path d="M25,-5 Q35,-10 30,-5" fill="none" stroke="#ca8a04" strokeWidth="3" />
      <circle cx="0" cy="0" r="4" fill="#ef4444" />
     </g>
     <g transform="translate(10, 10) scale(0.6)">
      <path d="M0,0 Q10,-10 20,0 Q10,10 0,0" fill="#22c55e" />
     </g>
     <g transform="translate(90, 20) scale(0.6) rotate(60)">
      <path d="M0,0 Q10,-10 20,0 Q10,10 0,0" fill="#22c55e" />
     </g>
    </svg>
   );

  case 'supreme-king':
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-[0_10px_30px_rgba(234,179,8,0.7)]">
     <defs>
      <linearGradient id="kingGold" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stopColor="#FFF281" />
       <stop offset="50%" stopColor="#FFD700" />
       <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
     </defs>
     <circle cx="50" cy="50" r="48" fill="none" stroke="url(#kingGold)" strokeWidth="10" />
     <path d="M 50 2 L 60 10 L 80 0 L 70 20 L 95 30 L 75 40 L 85 60 L 65 55 L 70 80 L 50 65 L 30 80 L 35 55 L 15 60 L 25 40 L 5 30 L 30 20 L 20 0 L 40 10 Z" fill="none" stroke="#fff" strokeWidth="1.5" className="animate-spin-slow opacity-60" />
     <g transform="translate(50, -5) scale(0.8)">
       <path d="M-40,20 L-50,-20 L-20,0 L0,-30 L20,0 L50,-20 L40,20 Z" fill="url(#kingGold)" stroke="#fff" strokeWidth="2" className="drop-shadow-lg" />
       <circle cx="-50" cy="-20" r="6" fill="#ef4444" />
       <circle cx="0" cy="-30" r="8" fill="#ef4444" />
       <circle cx="50" cy="-20" r="6" fill="#ef4444" />
     </g>
    </svg>
   );

  default:
   // Elegant default frame rendering for items like 'ruby-crown', 'emerald-leaf', etc.
   // Instead of just basic borders, providing a lush SVG frame.
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-lg">
     <circle cx="50" cy="50" r="48" fill="none" stroke="#e2e8f0" strokeWidth="6" />
     <circle cx="50" cy="50" r="48" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8 8" className="animate-spin-slow" />
     <circle cx="50" cy="50" r="54" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.4" />
    </svg>
   );
 }
}

export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
 if (!frameId || frameId === 'None' || frameId === 'Default') {
  return <div className={cn('relative', className)}>{children}</div>;
 }

 // Support legacy hardcoded frames gracefully, wrapping them in new logic.
 const isLegacyGold = frameId === 'f1' || frameId === 'Official' || frameId === 'honor-2026';

 return (
  <div className={cn('relative flex items-center justify-center', className)}>
   
   {/* 
       FRAME CONTAINER 
       inset-[-20%] ensures the massive frame borders stay completely completely 
       outside of the core Avatar image radius. This prevents DP overlapping.
   */}
   <div className="absolute inset-[-20%] z-20 pointer-events-none flex items-center justify-center">
    
    {isLegacyGold ? (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-in fade-in duration-1000 overflow-visible">
      <defs>
       <linearGradient id="honorGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
       </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#honorGold)" strokeWidth="6" className="animate-pulse" />
      <circle cx="50" cy="50" r="53" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.6" />
     </svg>
    ) : (
     <DynamicFrameGenerator frameId={frameId} />
    )}

   </div>

   {/* AVATAR CONTAINER */}
   <div className="relative z-10 rounded-full overflow-hidden w-full h-full bg-slate-900 border border-white/10">
    {children}
   </div>
   
  </div>
 );
}
