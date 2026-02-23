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
 * Renders themed borders and overlays based on frameId.
 */
export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
  if (!frameId || frameId === 'None') {
    return <div className={cn('relative', className)}>{children}</div>;
  }

  const isImperial = frameId === 'f4'; // Imperial Bloom
  const isGolden = frameId === 'f1' || frameId === 'Official'; // Golden Official

  return (
    <div className={cn('relative flex items-center justify-center p-1', className)}>
      {/* Frame Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none scale-110">
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
            
            {/* Main Ring */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#imperialGold)" strokeWidth="3" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#7e22ce" strokeWidth="1.5" opacity="0.6" className="animate-pulse" />

            {/* Top Crown */}
            <g transform="translate(30, -5) scale(0.4)" filter="url(#royalGlow)">
               <path d="M50 10 L65 40 L85 40 L70 60 L80 90 L50 75 L20 90 L30 60 L15 40 L35 40 Z" fill="url(#imperialGold)" stroke="#000" strokeWidth="2" />
               <circle cx="50" cy="30" r="5" fill="#ef4444" className="animate-pulse" />
            </g>

            {/* Side Roses */}
            <g className="animate-bounce" style={{ animationDuration: '3s' }}>
               <circle cx="15" cy="30" r="8" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
               <circle cx="85" cy="30" r="8" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
               <circle cx="12" cy="25" r="5" fill="#a855f7" />
               <circle cx="88" cy="25" r="5" fill="#a855f7" />
            </g>

            {/* Bottom Wings */}
            <g transform="translate(0, 70)">
               <path d="M10 10 Q -5 0, 30 15 L 40 20" fill="white" stroke="url(#imperialGold)" strokeWidth="1" opacity="0.9" />
               <path d="M90 10 Q 105 0, 70 15 L 60 20" fill="white" stroke="url(#imperialGold)" strokeWidth="1" opacity="0.9" />
               <path d="M50 5 L65 15 L65 35 L50 45 L35 35 L35 15 Z" fill="#7e22ce" stroke="url(#imperialGold)" strokeWidth="2" />
               <path d="M50 15 L58 22 L58 28 L50 35 L42 28 L42 22 Z" fill="#a855f7" className="animate-pulse" />
            </g>
          </svg>
        )}

        {isGolden && !isImperial && (
          <div className="absolute inset-0 border-4 border-yellow-500 rounded-full animate-glow shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
        )}
      </div>

      {/* Avatar Content */}
      <div className="relative z-10 rounded-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
