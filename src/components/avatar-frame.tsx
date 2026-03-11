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
 * Features the new Sovereign Official HQ frame and the elite SVIP Ringneck Eagle frame.
 */
export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
  if (!frameId || frameId === 'None' || frameId === 'Default') {
    return <div className={cn('relative', className)}>{children}</div>;
  }

  const isImperial = frameId === 'f4'; // Imperial Bloom
  const isGolden = frameId === 'f1' || frameId === 'Official'; // Golden Official
  const isCyber = frameId === 'f2'; // Cyberpunk Red
  const isRoyal = frameId === 'f3'; // Royal Purple
  const isWings = frameId === 'f5'; // Golden wings
  const isBronzeSky = frameId === 'f6'; // Bronze Sky
  const isCelestial = frameId === 'f7'; // Celestial Wings
  const isOfficialHQ = frameId === 'f-official-hq'; // High-Fidelity Official HQ
  const isRingneckEagle = frameId === 'svip-eagle-1'; // SVIP Eagle Set

  return (
    <div className={cn('relative flex items-center justify-center p-1', className)}>
      <div className="absolute inset-0 z-20 pointer-events-none scale-110">
        
        {isRingneckEagle && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
            <defs>
              <linearGradient id="eagleFeather" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="33%" stopColor="#2dd4bf" />
                <stop offset="66%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <linearGradient id="neonEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            {/* Eagle Wings Backdrop */}
            <g className="animate-wing-flap origin-center">
               <path d="M20 50 C 0 40, -15 60, 5 85 L20 75 Z" fill="url(#eagleFeather)" opacity="0.8" stroke="#ffffff" strokeWidth="0.5" />
               <path d="M80 50 C 100 40, 115 60, 95 85 L80 75 Z" fill="url(#eagleFeather)" opacity="0.8" stroke="#ffffff" strokeWidth="0.5" />
            </g>
            {/* Crystal Ring */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#eagleFeather)" strokeWidth="4" className="animate-shimmer-gold" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#neonEdge)" strokeWidth="1" opacity="0.6" />
            {/* Eagle Head Top */}
            <g transform="translate(50, 8)">
               <path d="M -8 -4 Q 0 -12 8 -4 L 0 8 Z" fill="#ffffff" stroke="#facc15" strokeWidth="0.5" />
               <circle cx="0" cy="0" r="1.5" fill="#facc15" />
            </g>
            {/* SVIP Label Bottom */}
            <g transform="translate(50, 90)">
               <rect x="-15" y="-6" width="30" height="12" rx="6" fill="url(#eagleFeather)" stroke="#ffffff" strokeWidth="1" />
               <text y="2.5" fontSize="6" textAnchor="middle" fill="white" fontWeight="900">SVIP 1</text>
            </g>
            {/* Shine */}
            <rect x="0" y="0" width="10" height="150" fill="white" opacity="0.3" transform="rotate(45) translate(0, -100)">
               <animateTransform attributeName="transform" type="translate" from="-150, -100" to="250, 100" dur="2s" repeatCount="indefinite" />
            </rect>
          </svg>
        )}

        {isOfficialHQ && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
            <defs>
              <linearGradient id="hqGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF281" />
                <stop offset="20%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="80%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
              <radialGradient id="hqGem" cx="30%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
              <filter id="hqGlow">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <g fill="url(#hqGold)" stroke="#854d0e" strokeWidth="0.1" className="animate-shimmer-gold">
               {[160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((deg, i) => (
                 <g key={`l-${i}`} transform={`rotate(${deg}, 50, 50) translate(0, -42)`}>
                    <path d="M0 0 C -5 -5, -8 -15, 0 -20 C 8 -15, 5 -5, 0 0 Z" transform="scale(0.4) rotate(-30)" />
                 </g>
               ))}
               {[20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((deg, i) => (
                 <g key={`r-${i}`} transform={`rotate(${deg}, 50, 50) translate(0, -42)`}>
                    <path d="M0 0 C 5 -5, 8 -15, 0 -20 C -8 -15, -5 -5, 0 0 Z" transform="scale(0.4) rotate(30)" />
                 </g>
               ))}
            </g>

            <g transform="translate(50, 8)" filter="url(#hqGlow)">
               <path d="M 0 -6 L 5 0 L 0 6 L -5 0 Z" fill="url(#hqGem)" stroke="#854d0e" strokeWidth="0.5" />
               <path d="M -2 0 L 0 -3 L 2 0 L 0 3 Z" fill="white" opacity="0.4" />
            </g>

            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#hqGold)" strokeWidth="3" className="animate-shimmer-gold" />
            
            <g transform="translate(50, 85)">
               <path d="M -45 -5 L -35 -12 L -15 -12 L -15 8 L -35 8 L -45 1 Z" fill="#b45309" stroke="#451a03" strokeWidth="0.5" />
               <path d="M 45 -5 L 35 -12 L 15 -12 L 15 8 L 35 8 L 45 1 Z" fill="#b45309" stroke="#451a03" strokeWidth="0.5" />
               <path d="M -30 -10 Q 0 -15 30 -10 L 30 10 Q 0 15 -30 10 Z" fill="url(#hqGold)" stroke="#854d0e" strokeWidth="0.5" />
               <text y="3" fontSize="7" textAnchor="middle" fill="#1a1a1a" fontWeight="900" style={{fontFamily: 'sans-serif', letterSpacing: '0.05em'}}>OFFICIAL</text>
            </g>

            <rect x="0" y="0" width="15" height="150" fill="white" opacity="0.25" transform="rotate(45) translate(0, -100)">
               <animateTransform attributeName="transform" type="translate" from="-150, -100" to="250, 100" dur="2.5s" repeatCount="indefinite" />
            </rect>
          </svg>
        )}

        {isCelestial && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
            <defs>
              <linearGradient id="celestialBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c7d2fe" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="celestialGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <g fill="url(#celestialGold)" stroke="#854d0e" strokeWidth="0.2">
               <path d="M25 15 L35 10 L30 25 Z" />
               <path d="M40 5 L60 5 L50 15 Z" />
               <path d="M75 15 L65 10 L70 25 Z" />
            </g>
            <g fill="url(#celestialBlue)" stroke="#3730a3" strokeWidth="0.2" className="animate-wing-flap origin-center">
               <path d="M15 50 C 0 45, -10 60, 5 70 L15 65 Z" />
               <path d="M12 60 C -5 55, -15 75, 5 85 L12 75 Z" opacity="0.8" />
               <path d="M18 40 C 5 35, -5 50, 10 55 L18 50 Z" opacity="0.9" />
               <path d="M85 50 C 100 45, 110 60, 95 70 L85 65 Z" />
               <path d="M88 60 C 105 55, 115 75, 95 85 L88 75 Z" opacity="0.8" />
               <path d="M82 40 C 95 35, 105 50, 90 55 L82 50 Z" opacity="0.9" />
            </g>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#celestialBlue)" strokeWidth="5" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#celestialGold)" strokeWidth="2" className="animate-shimmer-gold" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="url(#celestialBlue)" strokeWidth="1.5" />
            <g fill="url(#celestialBlue)" stroke="#3730a3" strokeWidth="0.2">
               <path d="M35 92 L30 98 L40 95 Z" />
               <path d="M65 92 L70 98 L60 95 Z" />
            </g>
            <rect x="0" y="0" width="10" height="150" fill="white" opacity="0.2" transform="rotate(45) translate(0, -100)">
               <animateTransform attributeName="transform" type="translate" from="-100, -100" to="200, 100" dur="4s" repeatCount="indefinite" />
            </rect>
          </svg>
        )}

        {isBronzeSky && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
            <defs>
              <linearGradient id="bronzeLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <radialGradient id="pinkGemGrad" cx="35%" cy="35%" r="50%">
                <stop offset="0%" stopColor="#ff80ab" />
                <stop offset="100%" stopColor="#c2185b" />
              </radialGradient>
              <radialGradient id="cyanGemGrad" cx="35%" cy="35%" r="50%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0891b2" />
              </radialGradient>
            </defs>
            <g fill="url(#bronzeLeaf)" stroke="#451a03" strokeWidth="0.2">
               <path d="M50 90 C30 90 10 75 5 50 C5 25 25 10 45 5 L48 8 C30 12 15 25 15 50 C15 70 30 85 50 85 Z" />
               <path d="M50 90 C70 90 90 75 95 50 C95 25 75 10 55 5 L52 8 C70 12 85 25 85 50 C85 70 70 85 50 85 Z" />
               {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                 <g key={deg} transform={`rotate(${deg}, 50, 50)`}>
                    <path d="M50 4 L54 12 L50 10 L46 12 Z" opacity={0.8} />
                 </g>
               ))}
            </g>
            <rect x="0" y="0" width="10" height="150" fill="white" opacity="0.2" transform="rotate(45) translate(0, -100)">
               <animateTransform attributeName="transform" type="translate" from="-100, -100" to="200, 100" dur="3s" repeatCount="indefinite" />
            </rect>
            <circle cx="15" cy="35" r="3" fill="url(#cyanGemGrad)" className="animate-pulse" />
            <circle cx="85" cy="35" r="3" fill="url(#cyanGemGrad)" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <g transform="translate(50, 90)" className="animate-reaction-heartbeat">
               <circle cx="0" cy="0" r="10" fill="#f472b6" opacity="0.2" className="animate-pulse" />
               <path d="M 0 8 L -7 0 L 0 -8 L 7 0 Z" fill="url(#pinkGemGrad)" stroke="#880e4f" strokeWidth="0.5" />
            </g>
          </svg>
        )}

        {isWings && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
            <defs>
              <linearGradient id="goldWings" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF281" />
                <stop offset="20%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="80%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
              <radialGradient id="rubyGem" cx="30%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="100%" stopColor="#800000" />
              </radialGradient>
            </defs>
            <g className="animate-wing-flap origin-center">
              <g transform="translate(15, 50) rotate(-15)">
                <path d="M0 0 C -25 -10, -45 -45, -35 -65 C -30 -75, -15 -65, 0 -45 Z" fill="url(#goldWings)" opacity="0.9" />
              </g>
              <g transform="translate(85, 50) rotate(15)">
                <path d="M0 0 C 25 -10, 45 -45, 35 -65 C 30 -75, 15 -65, 0 -45 Z" fill="url(#goldWings)" opacity="0.9" />
              </g>
            </g>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldWings)" strokeWidth="4.5" className="animate-shimmer-gold" />
            <circle cx="50" cy="4" r="3.2" fill="url(#rubyGem)" className="animate-pulse" />
            <g transform="translate(50, 92)">
              <path d="M-8 -8 L0 4 L8 -8 L0 -12 Z" fill="url(#goldWings)" stroke="#000" strokeWidth="0.3" />
              <text y="-2" fontSize="5.5" textAnchor="middle" fill="black" fontWeight="black">VIP</text>
            </g>
          </svg>
        )}

        {isGolden && (
          <div className="absolute inset-0 border-4 border-yellow-500 rounded-full animate-glow shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
        )}

        {isRoyal && (
          <div className="absolute inset-0 border-[3px] border-purple-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.5)]">
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-purple-600">👑</div>
          </div>
        )}
      </div>

      <div className="relative z-10 rounded-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
