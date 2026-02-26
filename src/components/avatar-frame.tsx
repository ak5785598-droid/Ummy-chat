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
 * Expanded to support f1, f2, f3, f4 and the elite f5 'The Wings' frame.
 */
export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
  if (!frameId || frameId === 'None' || frameId === 'Default') {
    return <div className={cn('relative', className)}>{children}</div>;
  }

  const isImperial = frameId === 'f4'; // Imperial Bloom
  const isGolden = frameId === 'f1' || frameId === 'Official'; // Golden Official
  const isCyber = frameId === 'f2'; // Cyberpunk Red
  const isRoyal = frameId === 'f3'; // Royal Purple
  const isWings = frameId === 'f5'; // The Wings

  return (
    <div className={cn('relative flex items-center justify-center p-1', className)}>
      {/* Frame Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none scale-110">
        {isWings && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000">
            <defs>
              <linearGradient id="goldWings" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF281" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
              <linearGradient id="wingGemPink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff00cc" />
                <stop offset="100%" stopColor="#ff66ff" />
              </linearGradient>
              <linearGradient id="wingGemBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0099ff" />
                <stop offset="100%" stopColor="#66ccff" />
              </linearGradient>
            </defs>
            
            {/* Base Golden Ring with ornaments */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#goldWings)" strokeWidth="4" className="animate-shimmer-gold" />
            
            {/* The Wings (Left & Right) */}
            <g className="animate-wing-flap origin-center">
              {/* Left Wing */}
              <path d="M20 60 C 5 50, 0 30, 10 15 L 25 40 Z" fill="url(#goldWings)" opacity="0.9" />
              <path d="M15 55 C 5 45, 5 35, 12 25 L 22 45 Z" fill="url(#goldWings)" opacity="0.7" />
              {/* Right Wing */}
              <path d="M80 60 C 95 50, 100 30, 90 15 L 75 40 Z" fill="url(#goldWings)" opacity="0.9" />
              <path d="M85 55 C 95 45, 95 35, 88 25 L 78 45 Z" fill="url(#goldWings)" opacity="0.7" />
            </g>

            {/* Gems */}
            <circle cx="50" cy="6" r="4" fill="url(#wingGemPink)" className="animate-pulse" />
            <circle cx="15" cy="25" r="3" fill="url(#wingGemBlue)" className="animate-pulse" />
            <circle cx="85" cy="25" r="3" fill="url(#wingGemBlue)" className="animate-pulse" />
            <circle cx="10" cy="50" r="2.5" fill="url(#wingGemPink)" className="animate-pulse" />
            <circle cx="90" cy="50" r="2.5" fill="url(#wingGemPink)" className="animate-pulse" />

            {/* Bottom Shield/Ornament */}
            <path d="M40 85 L50 98 L60 85 L50 80 Z" fill="url(#goldWings)" stroke="#000" strokeWidth="0.5" />
            <text x="50" y="93" fontSize="5" textAnchor="middle" fill="black" fontWeight="black">V</text>
          </svg>
        )}

        {isImperial && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl animate-in fade-in duration-1000">
            <defs>
              <linearGradient id="imperialGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <filter id="royalGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#imperialGold)" strokeWidth="3" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#7e22ce" strokeWidth="1.5" opacity="0.6" className="animate-pulse" />
            <g transform="translate(30, -5) scale(0.4)" filter="url(#royalGlow)">
               <path d="M50 10 L65 40 L85 40 L70 60 L80 90 L50 75 L20 90 L30 60 L15 40 L35 40 Z" fill="url(#imperialGold)" stroke="#000" strokeWidth="2" />
               <circle cx="50" cy="30" r="5" fill="#ef4444" className="animate-pulse" />
            </g>
            <g className="animate-bounce" style={{ animationDuration: '3s' }}>
               <circle cx="15" cy="30" r="8" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
               <circle cx="85" cy="30" r="8" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
            </g>
          </svg>
        )}

        {isGolden && (
          <div className="absolute inset-0 border-4 border-yellow-500 rounded-full animate-glow shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
        )}

        {isCyber && (
          <div className="absolute inset-0 border-4 border-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-red-500" />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-red-500" />
          </div>
        )}

        {isRoyal && (
          <div className="absolute inset-0 border-[3px] border-purple-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.5)]">
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-purple-600">👑</div>
          </div>
        )}
      </div>

      {/* Avatar Content */}
      <div className="relative z-10 rounded-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}