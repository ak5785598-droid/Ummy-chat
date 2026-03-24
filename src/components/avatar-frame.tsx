'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

interface AvatarFrameProps {
 frameId?: string | null;
 children: React.ReactNode;
 className?: string;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Dynamic Frame Generator for the 70+ Store Frames.
 * Renders procedural, high-fidelity CSS and SVG frames to save bundle size.
 */
function DynamicFrameGenerator({ frameId }: { frameId: string }) {
 if (frameId.startsWith('frame-gen-')) {
  // Procedural elemental auras
  const idNum = parseInt(frameId.split('-')[2]);
  const colors = [
   ['#f87171', '#ef4444'], // red
   ['#60a5fa', '#3b82f6'], // blue
   ['#4ade80', '#22c55e'], // green
   ['#facc15', '#eab308'], // yellow
   ['#c084fc', '#a855f7'], // purple
   ['#22d3ee', '#06b6d4'], // cyan
  ][idNum % 6];
  
  return (
   <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible animate-spin-slow">
    <circle cx="50" cy="50" r="48" fill="none" stroke={`url(#grad-${idNum})`} strokeWidth="3" strokeDasharray="30 10" className="animate-pulse" />
    <defs>
     <linearGradient id={`grad-${idNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={colors[0]} />
      <stop offset="100%" stopColor={colors[1]} />
     </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="4" fill={colors[0]} className="animate-bounce" />
    <circle cx="80" cy="80" r="3" fill={colors[1]} className="animate-ping" />
   </svg>
  );
 }

 switch (frameId) {
  case 'fuffy':
   return (
    <div className="absolute inset-0 rounded-full border-[5px] border-blue-300 shadow-[0_0_15px_rgba(147,197,253,0.8)]">
     <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-200 text-xs px-2 py-0.5 rounded-full border-2 border-yellow-400 font-bold drop-shadow-md">🎀 Kitty</div>
     <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-white shadow-lg animate-pulse" />
    </div>
   );
  case 'sea-n-sands':
   return (
    <div className="absolute inset-0 rounded-full border-[5px] border-cyan-400 border-dashed shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-spin-slow">
     <div className="absolute -right-2 top-10 text-xl rotate-12">🍹</div>
     <div className="absolute -left-2 top-2 text-xl -rotate-12">🍉</div>
    </div>
   );
  case 'basra':
   return (
    <div className="absolute inset-0 rounded-full border-[6px] border-[#5c4033] shadow-inner flex items-center justify-center">
     <div className="absolute inset-0 border-2 border-green-500 rounded-full animate-ping opacity-20" />
     <div className="absolute -bottom-2 right-0 text-2xl drop-shadow-xl z-30">🫖</div>
    </div>
   );
  case 'butterflies':
   return (
    <div className="absolute inset-0 rounded-full border-[4px] border-purple-300 shadow-[0_0_10px_rgba(216,180,254,0.8)]">
     <div className="absolute inset-0 animate-spin-slow opacity-80">
      <div className="absolute -top-3 left-4 text-xl rotate-45">🦋</div>
      <div className="absolute bottom-4 -right-2 text-xl -rotate-45">🦋</div>
      <div className="absolute top-1/2 -left-4 text-xl">🦋</div>
     </div>
    </div>
   );
  case 'top3family':
   return (
    <div className="absolute inset-0 rounded-full border-[6px] border-pink-400 outline outline-2 outline-pink-200 outline-offset-2 flex flex-col items-center shadow-[0_0_30px_rgba(244,114,182,0.8)]">
     <Crown className="absolute -top-6 text-pink-500 h-8 w-8 drop-shadow-lg fill-current animate-bounce" />
     <div className="absolute -bottom-2 w-full text-center text-[8px] font-black uppercase text-white bg-pink-500 rounded px-1 tracking-widest shadow-lg">Top 3</div>
    </div>
   );
  case 'top2family':
   return (
    <div className="absolute inset-0 rounded-full border-[6px] border-blue-400 outline outline-2 outline-blue-200 outline-offset-2 flex flex-col items-center shadow-[0_0_30px_rgba(96,165,250,0.8)]">
     <Crown className="absolute -top-6 text-blue-500 h-8 w-8 drop-shadow-lg fill-current animate-bounce" />
     <div className="absolute -bottom-2 w-full text-center text-[8px] font-black uppercase text-white bg-blue-500 rounded px-1 tracking-widest shadow-lg">Top 2</div>
    </div>
   );
  case 'pink-love':
   return (
    <div className="absolute inset-0 rounded-full border-[6px] border-pink-400 shadow-[0_0_40px_rgba(244,114,182,0.6)]">
     <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
      <div className="absolute -top-2 left-1/2 text-2xl shadow-xl drop-shadow-[0_0_10px_rgba(255,105,180,1)]">💖</div>
     </div>
    </div>
   );
  case 'neon-2025':
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
     <circle cx="50" cy="50" r="46" fill="none" stroke="#a855f7" strokeWidth="6" strokeDasharray="50 20" className="animate-spin" style={{ animationDuration: '3s' }} />
     <circle cx="50" cy="50" r="50" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="10 30" className="animate-spin-reverse" style={{ animationDuration: '5s' }} />
     <g transform="translate(50, 95)">
       <text y="0" fontSize="12" textAnchor="middle" fill="#fff" fontWeight="900" style={{filter: 'drop-shadow(0 0 10px #06b6d4)'}}>2025</text>
     </g>
    </svg>
   );
  case 'birthday-cake':
  case 'birthday-party':
   return (
    <div className="absolute inset-0 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,1)]">
     <div className="absolute -top-4 w-full flex justify-center gap-2 text-xl animate-bounce">
       🎈 🎈
     </div>
     <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-3xl drop-shadow-xl z-30">🎂</div>
    </div>
   );
  case 'supreme-king':
   return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
     <defs>
      <linearGradient id="kingGold" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stopColor="#FFF281" />
       <stop offset="50%" stopColor="#FFD700" />
       <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
     </defs>
     <circle cx="50" cy="50" r="46" fill="none" stroke="url(#kingGold)" strokeWidth="8" className="animate-pulse" />
     <path d="M 50 -10 L 60 10 L 80 0 L 70 20 L 95 30 L 75 40 L 85 60 L 65 55 L 70 80 L 50 65 L 30 80 L 35 55 L 15 60 L 25 40 L 5 30 L 30 20 L 20 0 L 40 10 Z" fill="none" stroke="url(#kingGold)" strokeWidth="2" className="animate-spin-slow opacity-50" />
     <g transform="translate(50, -5)">
       <Crown className="h-10 w-10 text-yellow-400 fill-current -translate-x-5 -translate-y-5 drop-shadow-[0_0_15px_rgba(234,179,8,1)]" />
     </g>
    </svg>
   );
  case 'gold-mosque':
   return (
    <div className="absolute inset-0 rounded-full border-[5px] border-yellow-500 border-dotted shadow-[0_0_20px_rgba(234,179,8,0.5)]">
     <div className="absolute -bottom-1 right-2 text-2xl drop-shadow-lg z-30">🕌</div>
     <div className="absolute -top-2 left-2 text-xl drop-shadow-lg animate-pulse">🌙</div>
    </div>
   );
  case 'rose-ring':
   return (
    <div className="absolute inset-0 rounded-full border-[4px] border-red-500 flex items-center justify-center">
     <div className="absolute inset-0 animate-spin-slow">
      <div className="absolute top-0 right-4 text-xl">🌹</div>
      <div className="absolute bottom-0 left-4 text-xl">🌹</div>
     </div>
    </div>
   );
  case 'ruby-crown':
  case 'emerald-leaf':
  case 'blue-knight':
  case 'silver-crest':
  case 'angel-wings':
  case 'blue-roses':
  case 'cat-headphones':
  case 'lanterns':
  case 'purple-bow':
   // Generic premium generator for these specialized names
   const config: Record<string, { color: string, emoji: string, border: string }> = {
    'ruby-crown': { color: 'border-red-500', emoji: '👑', border: 'solid' },
    'emerald-leaf': { color: 'border-green-500', emoji: '🌿', border: 'dashed' },
    'blue-knight': { color: 'border-blue-600', emoji: '⚔️', border: 'solid' },
    'silver-crest': { color: 'border-gray-300', emoji: '🛡️', border: 'double' },
    'angel-wings': { color: 'border-yellow-200', emoji: '🕊️', border: 'dotted' },
    'blue-roses': { color: 'border-blue-300', emoji: '❄️', border: 'solid' },
    'cat-headphones': { color: 'border-pink-400', emoji: '🎧', border: 'solid' },
    'lanterns': { color: 'border-red-500', emoji: '🏮', border: 'dashed' },
    'purple-bow': { color: 'border-purple-400', emoji: '🎀', border: 'solid' },
   };
   const { color, emoji, border } = config[frameId] || config['ruby-crown'];
   return (
    <div className={cn(`absolute inset-0 rounded-full border-[5px] ${color} shadow-lg animate-pulse`)} style={{ borderStyle: border as any }}>
     <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-2xl drop-shadow-xl z-30 bg-black/40 rounded-full p-1 border border-white/20 backdrop-blur-md">
      {emoji}
     </div>
    </div>
   );
  default:
   return null;
 }
}

export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
 if (!frameId || frameId === 'None' || frameId === 'Default') {
  return <div className={cn('relative', className)}>{children}</div>;
 }

 // Support legacy frames
 const isHonor2026 = frameId === 'honor-2026';
 const isVibe2026 = frameId === '2026-vibe';
 const isDevil = frameId === 'little-devil';
 const isIndia = frameId === 'i-love-india';
 const isGolden = frameId === 'f1' || frameId === 'Official';
 const isWings = frameId === 'f5';
 const isUmmyCS = frameId === 'ummy-cs';

 return (
  <div className={cn('relative flex items-center justify-center p-1', className)}>
   <div className="absolute inset-0 z-20 pointer-events-none scale-110">
    
    <DynamicFrameGenerator frameId={frameId} />

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
     </svg>
    )}

    {isVibe2026 && (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#a78bfa" strokeWidth="4" className="animate-pulse" />
      <g transform="translate(50, 85)">
        <text y="0" fontSize="10" textAnchor="middle" fill="#f472b6" fontWeight="900" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'}}>2026</text>
      </g>
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
     </div>
    )}

    {isUmmyCS && (
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl animate-in fade-in duration-1000 overflow-visible">
      <defs>
       <linearGradient id="csGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="30%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
       </linearGradient>
       <linearGradient id="csEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#064e3b" />
       </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#csEmerald)" strokeWidth="5" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="url(#csGold)" strokeWidth="1.5" className="animate-pulse" />
      <g transform="translate(50, 88)">
        <path d="M -48 -12 Q 0 -22 48 -12 L 48 12 Q 0 2 -48 12 Z" fill="url(#csEmerald)" stroke="url(#csGold)" strokeWidth="1.5" />
        <text y="2" fontSize="9" textAnchor="middle" fill="#FFD700" fontWeight="900">Ummy CS</text>
      </g>
     </svg>
    )}

    {isGolden && (
     <div className="absolute inset-0 border-4 border-yellow-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
    )}

    {isWings && (
     <div className="absolute inset-0 border-[6px] border-yellow-400 rounded-full opacity-90 shadow-2xl">
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl">🕊️</div>
      <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-2xl rotate-y-180">🕊️</div>
     </div>
    )}
   </div>

   <div className="relative z-10 rounded-full overflow-hidden">
    {children}
   </div>
  </div>
 );
}
