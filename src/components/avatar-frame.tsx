
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
 * High-fidelity Avatar Frame component.
 * Re-engineered to support the "Honor 2026", "2026", and "Devil" set from the blueprint.
 */
export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
 if (!frameId || frameId === 'None' || frameId === 'Default') {
  return <div className={cn('relative', className)}>{children}</div>;
 }

 const isHonor2026 = frameId === 'honor-2026';
 const isVibe2026 = frameId === '2026-vibe';
 const isSnowman = frameId === 'snowman-gift' || frameId === 'snowman-classic';
 const isDevil = frameId === 'little-devil';
 const isIndia = frameId === 'i-love-india';
 
 // Existing legacy frames
 const isGolden = frameId === 'f1' || frameId === 'Official';
 const isWings = frameId === 'f5';
 const isUmmyCS = frameId === 'ummy-cs';

 return (
  <div className={cn('relative flex items-center justify-center p-1', className)}>
   <div className="absolute inset-0 z-20 pointer-events-none scale-110">
    
    {isHonor2026 && (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
      <defs>
       <linearGradient id="honorGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
       </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#honorGold)" strokeWidth="4" />
      <g transform="translate(50, 10)">
        <Crown className="h-6 w-6 text-yellow-400 fill-current -translate-x-3 -translate-y-3" />
      </g>
      <g transform="translate(50, 85)">
        <text y="0" fontSize="10" textAnchor="middle" fill="#FFD700" fontWeight="900" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'}}>2026</text>
      </g>
      <g className="animate-wing-flap origin-center">
        <path d="M15 50 Q -5 30, 5 80" fill="none" stroke="url(#honorGold)" strokeWidth="3" strokeLinecap="round" />
        <path d="M85 50 Q 105 30, 95 80" fill="none" stroke="url(#honorGold)" strokeWidth="3" strokeLinecap="round" />
      </g>
     </svg>
    )}

    {isVibe2026 && (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#a78bfa" strokeWidth="4" className="animate-pulse" />
      <g transform="translate(50, 85)">
        <text y="0" fontSize="10" textAnchor="middle" fill="#f472b6" fontWeight="900" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'}}>2026</text>
      </g>
      <text x="15" y="30" fontSize="8" className="animate-bounce">🎈</text>
      <text x="85" y="30" fontSize="8" className="animate-bounce">🎉</text>
     </svg>
    )}

    {isDevil && (
     <div className="absolute inset-0 border-4 border-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)]">
       <div className="absolute -top-4 left-4 text-red-500 text-xl">😈</div>
       <div className="absolute -top-4 right-4 text-red-500 text-xl rotate-y-180">😈</div>
     </div>
    )}

    {isIndia && (
     <div className="absolute inset-0 border-4 border-green-500 rounded-full">
       <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-orange-500 text-lg">🇮🇳</div>
       <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-blue-800">
        <div className="w-4 h-4 rounded-full border border-blue-800 animate-spin" style={{ animationDuration: '5s' }} />
       </div>
     </div>
    )}

    {isUmmyCS && (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
      <defs>
       <linearGradient id="csGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="30%" stopColor="#FFD700" />
        <stop offset="60%" stopColor="#FFFFFF" />
        <stop offset="80%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
       </linearGradient>
       <linearGradient id="csEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#064e3b" />
       </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#csEmerald)" strokeWidth="5" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="url(#csGold)" strokeWidth="1.5" className="animate-shimmer-gold" />
      <g transform="translate(50, 88)">
        <path d="M -48 -12 Q 0 -22 48 -12 L 48 12 Q 0 2 -48 12 Z" fill="url(#csEmerald)" stroke="url(#csGold)" strokeWidth="1.5" />
        <text y="2" fontSize="9" textAnchor="middle" fill="#FFD700" fontWeight="900" style={{filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'}}>Ummy CS</text>
      </g>
     </svg>
    )}

    {isGolden && (
     <div className="absolute inset-0 border-4 border-yellow-500 rounded-full animate-glow shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
    )}

    {isWings && (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
      <defs>
       <linearGradient id="goldWings" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="50%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#B8860B" />
       </linearGradient>
      </defs>
      <g className="animate-wing-flap origin-center">
       <path d="M15 50 C -15 30, -25 60, 5 85 L15 75 Z" fill="url(#goldWings)" opacity="0.9" />
       <path d="M85 50 C 115 30, 125 60, 95 85 L85 75 Z" fill="url(#goldWings)" opacity="0.9" />
      </g>
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldWings)" strokeWidth="4" className="animate-shimmer-gold" />
     </svg>
    )}
   </div>

   <div className="relative z-10 rounded-full overflow-hidden">
    {children}
   </div>
  </div>
 );
}

function Crown(props: any) {
 return (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
   <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
 );
}
