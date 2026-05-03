'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette, Heart, Zap, Eye, Circle, X, Activity, IdCard } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { AVATAR_FRAMES, type AvatarFrameConfig } from '@/constants/avatar-frames';
import { AvatarFrame } from '@/components/avatar-frame';

// --- CUSTOM DOLLAR COIN ICON (NEW) ---
const DollarCoinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("text-[#FCD535]", className)} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="2"/>
    <text x="12" y="16.5" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#6B4E00" textAnchor="middle">$</text>
    <defs>
      <linearGradient id="goldGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF1AA" />
        <stop offset="0.5" stopColor="#FFD700" />
        <stop offset="1" stopColor="#D4AF37" />
      </linearGradient>
    </defs>
  </svg>
);

// --- CUSTOM WAVE CIRCLE UI ---
const WaveCircleIcon = ({ colorClass, size = "h-20 w-20", isLovelyShine = false }: any) => {
  const borderColor = colorClass.replace('text-', 'border-');
  
  if (isLovelyShine) {
    return (
      <div className={cn("relative flex items-center justify-center rounded-full", size)}>
        <div className="absolute inset-0 rounded-full border-[2px] border-blue-400/50 animate-pulse" />
        <div className="absolute inset-1 rounded-full border-[4px] border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
        <div className="absolute inset-3 rounded-full border border-blue-200/20 border-dashed animate-[spin_10s_linear_infinite]" />
        <Heart className="absolute -top-1 -right-1 h-4 w-4 text-blue-400 fill-blue-400/40 animate-bounce" />
        <Heart className="absolute top-1/2 -left-2 h-3 w-3 text-blue-300 fill-blue-300/40" />
        <Heart className="absolute bottom-0 right-2 h-3 w-3 text-white fill-white/20 animate-pulse" />
        <Sparkles className="absolute top-2 left-2 h-3 w-3 text-white animate-pulse" />
        <div className="absolute inset-[14px] rounded-full border-[1px] border-blue-400/60" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center rounded-full", size)}>
      <div className={cn("absolute inset-0 rounded-full border-[6px] opacity-30", borderColor)} />
      <div className={cn("absolute inset-[3px] rounded-full border-[8px] shadow-inner", borderColor)} />
      <div className={cn("absolute inset-[10px] rounded-full border-[1px] opacity-50", borderColor)} />
    </div>
  );
};

// --- PREMIUM AVATAR FRAME COMPONENT ---
interface PremiumAvatarFrameProps {
  imageUrl: string;
  size?: number;
  className?: string;
}

const PremiumAvatarFrame = ({ imageUrl, size = 120, className = "" }: PremiumAvatarFrameProps) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] z-10">
        <defs>
          <linearGradient id="premiumGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FDF0AD' }} />
            <stop offset="20%" style={{ stopColor: '#D4AF37' }} />
            <stop offset="50%" style={{ stopColor: '#FFFCEB' }} />
            <stop offset="80%" style={{ stopColor: '#BD9731' }} />
            <stop offset="100%" style={{ stopColor: '#8A6E00' }} />
          </linearGradient>
          <filter id="metalRelief" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="35" lightingColor="white" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        </defs>
        <g filter="url(#metalRelief)" stroke="#5c4300" strokeWidth="0.5">
          <path d="M100 240 C50 240 30 180 50 130 L95 155 C80 185 85 210 100 235 Z" fill="url(#premiumGold)" />
          <path d="M300 240 C350 240 370 180 350 130 L305 155 C320 185 315 210 300 235 Z" fill="url(#premiumGold)" />
        </g>
        <circle cx="200" cy="200" r="108" fill="none" stroke="#3d2d00" strokeWidth="12" />
        <circle cx="200" cy="200" r="102" fill="none" stroke="url(#premiumGold)" strokeWidth="8" filter="url(#metalRelief)" />
        <g filter="url(#metalRelief)">
          <path d="M125 105 L105 40 L160 75 L200 15 L240 75 L295 40 L275 105 Z" fill="url(#premiumGold)" stroke="#5c4300" strokeWidth="1" />
        </g>
        <g filter="url(#metalRelief)">
          <path d="M160 280 Q200 350 240 280 L230 265 Q200 280 170 265 Z" fill="url(#premiumGold)" stroke="#4a3700" />
        </g>
        <g className="animate-pulse">
          <circle cx="200" cy="15" r="4" fill="white" />
          <circle cx="105" cy="40" r="2" fill="white" />
          <circle cx="295" cy="40" r="2" fill="white" />
        </g>
      </svg>
      <div className="absolute overflow-hidden rounded-full border-[3px] border-[#1a1300] z-0" style={{ width: '43%', height: '43%' }}>
        <img src={imageUrl} alt="User Avatar" className="w-full h-full object-cover brightness-105" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

// --- NEW PINK DIAMOND ID BADGE ---
const PinkDiamondIDBadgeIcon = ({ number }: { number: string }) => (
  <div className="relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]">
    <div className="h-[36px] pl-[48px] pr-[20px] bg-gradient-to-r from-[#9D174D] to-[#DB2777] rounded-r-full border-[1px] border-t-[#F472B6] border-b-[#831843] border-r-[#F472B6] flex items-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.3)] z-0">
      <span className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none pt-[2px]">{number}</span>
    </div>
    <div className="absolute left-[-20px] z-10 w-[65px] h-[65px]">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="roseSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FCE7F3" />
            <stop offset="50%" stopColor="#F9A8D4" />
            <stop offset="70%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>
          <linearGradient id="pinkGemInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#9D174D" />
          </linearGradient>
        </defs>
        <polygon points="50,2 96,28 86,78 50,96 14,78 4,28" fill="url(#roseSilverGrad)" stroke="#FFF1F2" strokeWidth="2.5" />
        <polygon points="50,14 84,34 76,72 50,84 24,72 16,34" fill="url(#pinkGemInnerGrad)" stroke="#FBCFE8" strokeWidth="1" />
        <path d="M50,14 L84,34 L50,50 Z" fill="rgba(255,255,255,0.3)" />
        <path d="M16,34 L50,14 L50,50 Z" fill="rgba(255,255,255,0.5)" />
        <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="46" fill="url(#roseSilverGrad)" textAnchor="middle" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.8))">ID</text>
        <path d="M15,20 L18,10 L21,20 L31,23 L21,26 L18,36 L15,26 L5,23 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.8" />
        <path d="M80,75 L82,68 L84,75 L91,77 L84,79 L82,86 L80,79 L73,77 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.6" scale="0.7" />
        <circle cx="85" cy="25" r="2.5" fill="#FFFFFF" className="animate-ping" opacity="0.7" />
      </svg>
    </div>
  </div>
);

const IDBadgeIcon = ({ number }: { number: string }) => (
  <div className="relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]">
    <div className="h-[32px] pl-[42px] pr-[20px] bg-gradient-to-r from-[#D91B10] to-[#F13A24] rounded-r-full border-[1.5px] border-t-[#FF6B55] border-b-[#9D1109] border-r-[#FF6B55] flex items-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] z-0">
      <span className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none pt-[2px]">{number}</span>
    </div>
    <div className="absolute left-[-15px] z-10 w-[54px] h-[54px]">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1AA" />
            <stop offset="25%" stopColor="#FFD335" />
            <stop offset="50%" stopColor="#C98B13" />
            <stop offset="75%" stopColor="#FFD335" />
            <stop offset="100%" stopColor="#9E6100" />
          </linearGradient>
        </defs>
        <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="url(#goldGrad)" stroke="#FFE373" strokeWidth="3" />
        <polygon points="50,12 82,30 82,70 50,88 18,70 18,30" fill="#750600" />
        <text x="50" y="58" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="42" fill="url(#goldGrad)" textAnchor="middle" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.8))">ID</text>
        <text x="50" y="80" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="url(#goldGrad)" textAnchor="middle" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.8))">SSS</text>
      </svg>
    </div>
  </div>
);

const SilverBlueIDBadgeIcon = ({ number }: { number: string }) => (
  <div className="relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]">
    <div className="h-[36px] pl-[48px] pr-[20px] bg-gradient-to-r from-[#0C3E8A] to-[#1D5DC2] rounded-r-full border-[1px] border-t-[#4A85E6] border-b-[#072456] border-r-[#4A85E6] flex items-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.3)] z-0">
      <span className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none pt-[2px]">{number}</span>
    </div>
    <div className="absolute left-[-20px] z-10 w-[65px] h-[65px]">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="70%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="gemInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
        <polygon points="50,2 96,28 86,78 50,96 14,78 4,28" fill="url(#silverGrad)" stroke="#F8FAFC" strokeWidth="2.5" />
        <polygon points="50,14 84,34 76,72 50,84 24,72 16,34" fill="url(#gemInnerGrad)" stroke="#93C5FD" strokeWidth="1" />
        <path d="M50,14 L84,34 L50,50 Z" fill="rgba(255,255,255,0.3)" />
        <path d="M16,34 L50,14 L50,50 Z" fill="rgba(255,255,255,0.5)" />
        <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="46" fill="url(#silverGrad)" textAnchor="middle" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.8))">ID</text>
        <path d="M15,20 L18,10 L21,20 L31,23 L21,26 L18,36 L15,26 L5,23 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.8" />
        <path d="M80,75 L82,68 L84,75 L91,77 L84,79 L82,86 L80,79 L73,77 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.6" scale="0.7" />
        <circle cx="85" cy="25" r="2.5" fill="#FFFFFF" className="animate-ping" opacity="0.7" />
      </svg>
    </div>
  </div>
);

// --- MERGED GLOSSY WINGS SVG COMPONENT ---
const GlossyWingsSVG = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center pointer-events-none", className)}>
    <style>{`
      .wing { filter:url(#wingGlow); will-change:transform; }
      .left-wing { transform-origin:322px 395px; animation:flapL 3s ease-in-out infinite; }
      .right-wing { transform-origin:478px 395px; animation:flapR 3s ease-in-out infinite; }
      @keyframes flapL { 0%,100%{transform:rotate(14deg) translateX(10px) scale(0.92)} 50%{transform:rotate(-18deg) translateX(-14px) scale(1.08)} }
      @keyframes flapR { 0%,100%{transform:rotate(-14deg) translateX(-10px) scale(0.92)} 50%{transform:rotate(18deg) translateX(14px) scale(1.08)} }
      .charm { animation:float 1.5s ease-in-out infinite; transform-origin:400px 605px; }
      @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      .ring-pulse { animation:pulse 3s ease-in-out infinite; }
      @keyframes pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
      .sparkle { animation:twinkle 2.2s ease-in-out infinite; }
      @keyframes twinkle { 0%,100%{opacity:.2; transform:scale(.7)} 50%{opacity:1; transform:scale(1.3)} }
    `}</style>
    <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-[0_10px_20px_rgba(30,144,255,0.4)]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wingGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#4169e1" />
          <stop offset="45%" stopColor="#1e90ff" />
          <stop offset="100%" stopColor="#00bfff" />
        </linearGradient>
        <linearGradient id="wingGradRev" x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#4169e1" />
          <stop offset="45%" stopColor="#1e90ff" />
          <stop offset="100%" stopColor="#00bfff" />
        </linearGradient>
        <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b3e5fc" />
          <stop offset="30%" stopColor="#00bfff" />
          <stop offset="70%" stopColor="#1e90ff" />
          <stop offset="100%" stopColor="#4169e1" />
        </linearGradient>
        <radialGradient id="aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00bfff" stopOpacity="0.5"/>
          <stop offset="70%" stopColor="#1e90ff" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#4169e1" stopOpacity="0"/>
        </radialGradient>

        <filter id="wingGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur1"/>
          <feFlood floodColor="#00bfff" floodOpacity="0.6" result="color1"/>
          <feComposite in="color1" in2="blur1" operator="in" result="glow1"/>
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur2"/>
          <feFlood floodColor="#1e90ff" floodOpacity="0.9" result="color2"/>
          <feComposite in="color2" in2="blur2" operator="in" result="glow2"/>
          <feMerge>
            <feMergeNode in="glow1"/>
            <feMergeNode in="glow2"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" result="b"/>
          <feFlood floodColor="#1e90ff" floodOpacity="0.25"/>
          <feComposite in2="b" operator="in"/>
        </filter>

        <mask id="centerHole">
          <rect width="800" height="800" fill="white"/>
          <circle cx="400" cy="400" r="185" fill="black"/>
        </mask>
      </defs>

      <circle cx="400" cy="400" r="280" fill="url(#aura)" opacity="0.3" filter="url(#outerGlow)"/>
      
      <g mask="url(#centerHole)">
        <g className="wing left-wing">
          <path d="M 323 336 C 260 298 192 268 155 259 C 138 275 152 298 175 312 C 225 335 285 355 319 361 Z" fill="url(#wingGrad)" opacity="0.96"/>
          <path d="M 319 364 C 235 348 158 335 124 333 C 110 352 120 376 145 389 C 200 395 270 390 317 383 Z" fill="url(#wingGrad)" opacity="0.94"/>
          <path d="M 317 386 C 228 406 156 425 130 436 C 136 458 152 468 183 456 C 242 434 292 415 319 402 Z" fill="url(#wingGrad)" opacity="0.92"/>
          <path d="M 317 405 C 250 442 208 478 196 512 C 215 525 238 518 262 496 C 286 472 306 444 319 419 Z" fill="url(#wingGradRev)" opacity="0.88"/>
          <path d="M 315 428 C 278 462 254 494 248 518 C 264 522 278 512 290 494 C 302 476 310 450 317 434 Z" fill="url(#wingGradRev)" opacity="0.8"/>
          <path d="M 318 346 C 270 328 224 312 198 306 C 194 314 202 322 214 326 C 248 336 286 348 316 356 Z" fill="#87cefa" opacity="0.65"/>
          <path d="M 315 372 C 256 362 202 356 172 356 C 170 364 178 370 192 372 C 234 376 282 378 314 380 Z" fill="#b3e5fc" opacity="0.55"/>
          <path d="M 314 395 C 248 410 196 422 174 430 C 178 436 186 438 198 434 C 238 422 280 410 313 402 Z" fill="#87cefa" opacity="0.5"/>
        </g>
        
        <g className="wing right-wing">
          <path d="M 477 336 C 540 298 608 268 645 259 C 662 275 648 298 625 312 C 575 335 515 355 481 361 Z" fill="url(#wingGradRev)" opacity="0.96"/>
          <path d="M 481 364 C 565 348 642 335 676 333 C 690 352 680 376 655 389 C 600 395 530 390 483 383 Z" fill="url(#wingGradRev)" opacity="0.94"/>
          <path d="M 483 386 C 572 406 644 425 670 436 C 664 458 648 468 617 456 C 558 434 508 415 481 402 Z" fill="url(#wingGradRev)" opacity="0.92"/>
          <path d="M 483 405 C 550 442 592 478 604 512 C 585 525 562 518 538 496 C 514 472 494 444 481 419 Z" fill="url(#wingGrad)" opacity="0.88"/>
          <path d="M 485 428 C 522 462 546 494 552 518 C 536 522 522 512 510 494 C 498 476 490 450 483 434 Z" fill="url(#wingGrad)" opacity="0.8"/>
          <path d="M 482 346 C 530 328 576 312 602 306 C 606 314 598 322 586 326 C 552 336 514 348 484 356 Z" fill="#87cefa" opacity="0.65"/>
          <path d="M 485 372 C 544 362 598 356 628 356 C 630 364 622 370 608 372 C 566 376 518 378 486 380 Z" fill="#b3e5fc" opacity="0.55"/>
          <path d="M 486 395 C 552 410 604 422 626 430 C 622 436 614 438 602 434 C 562 422 520 410 487 402 Z" fill="#87cefa" opacity="0.5"/>
        </g>
      </g>

      <circle cx="400" cy="400" r="188" fill="none" stroke="url(#wingGrad)" strokeWidth="3" opacity="0.9" filter="url(#softGlow)" className="ring-pulse"/>
      <circle cx="400" cy="400" r="183" fill="none" stroke="#00bfff" strokeWidth="1" opacity="0.6"/>
      <circle cx="400" cy="400" r="195" fill="none" stroke="#1e90ff" strokeWidth="0.8" opacity="0.35" strokeDasharray="3 7" transform="rotate(-15 400 400)"/>
      <circle cx="400" cy="400" r="186" fill="none" stroke="#87cefa" strokeWidth="0.5" opacity="0.8"/>

      <g className="charm" filter="url(#softGlow)">
        <line x1="400" y1="586" x2="400" y2="575" stroke="#00bfff" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="400" cy="574" r="4" fill="none" stroke="#00bfff" strokeWidth="1" opacity="0.6"/>
        <circle cx="400" cy="574" r="2" fill="#b3e5fc" opacity="0.9"/>
        <path d="M 400 584 L 389 600 L 386 614 L 392 626 L 400 634 L 408 626 L 414 614 L 411 600 Z" fill="url(#crystalGrad)" stroke="#87cefa" strokeWidth="1.2" opacity="0.95"/>
        <path d="M 400 588 L 393 601 L 392 614 L 400 628 L 408 614 L 407 601 Z" fill="#e0f7ff" opacity="0.4"/>
        <path d="M 400 590 L 396 603 L 400 622 L 404 603 Z" fill="white" opacity="0.6"/>
        <path d="M 388 602 Q 376 598 372 606 Q 378 611 388 607 Z" fill="#1e90ff" opacity="0.85"/>
        <path d="M 412 602 Q 424 598 428 606 Q 422 611 412 607 Z" fill="#1e90ff" opacity="0.85"/>
      </g>

      <circle cx="268" cy="312" r="2.2" fill="#87cefa" className="sparkle" style={{animationDelay:'0s'}}/>
      <circle cx="532" cy="308" r="2" fill="#b3e5fc" className="sparkle" style={{animationDelay:'0.5s'}}/>
      <circle cx="238" cy="438" r="1.6" fill="#00bfff" className="sparkle" style={{animationDelay:'1.1s'}}/>
      <circle cx="562" cy="442" r="1.8" fill="#00bfff" className="sparkle" style={{animationDelay:'0.8s'}}/>
      <circle cx="312" cy="528" r="1.4" fill="#87cefa" className="sparkle" style={{animationDelay:'1.4s'}}/>
      <circle cx="488" cy="532" r="1.4" fill="#87cefa" className="sparkle" style={{animationDelay:'0.3s'}}/>
      <circle cx="400" cy="658" r="1.7" fill="#e0f7ff" className="sparkle" style={{animationDelay:'0.7s'}}/>
    </svg>
  </div>
);

// --- KITTI FRAME SVG COMPONENT (CLEANED) ---
const CatFrameSVG = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center pointer-events-none", className)}>
    <style>{`
      .cat-wrap svg { width: 100%; height: 100%; overflow: visible; }
      #cat-tail { transform-origin: 612px 382px; animation: tailWag 2s ease-in-out infinite; }
      @keyframes tailWag { 0%,100%{transform:rotate(-12deg)} 50%{transform:rotate(12deg)} }
      #ear-left, #ear-right { transform-box: fill-box; transform-origin: 50% 85%; }
      #ear-left { animation: earTwitch 4s ease-in-out infinite; }
      #ear-right { animation: earTwitch 4s ease-in-out infinite; animation-delay: 0.3s; }
      @keyframes earTwitch { 0%,82%,100%{transform:rotate(0)} 86%{transform:rotate(-6deg)} 90%{transform:rotate(4deg)} 94%{transform:rotate(-2deg)} }
      #bell-left, #bell-right { transform-box: fill-box; transform-origin: 50% 0%; }
      #bell-left { animation: bellSwing 2.6s ease-in-out infinite; }
      #bell-right { animation: bellSwing 2.6s ease-in-out infinite 0.4s; }
      @keyframes bellSwing { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
    `}</style>
    <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-xl cat-wrap" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="cat-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation={8} floodColor="#B8772F" floodOpacity={0.18} />
        </filter>
        <linearGradient id="cat-ringGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#EDB15E" />
          <stop offset="100%" stopColor="#E6A64D" />
        </linearGradient>
      </defs>

      <g id="whiskers" stroke="#B8772F" strokeWidth={7} strokeLinecap="round" opacity={0.95} filter="url(#cat-shadow)">
        <path d="M 176 360 Q 110 342 58 358" />
        <path d="M 172 395 Q 98 390 52 400" />
        <path d="M 176 430 Q 110 448 62 438" />
      </g>

      <g id="cat-tail" filter="url(#cat-shadow)">
        <path d="M 612 382 C 668 348 730 388 742 452 C 754 516 722 575 670 610 C 618 645 558 648 510 627 C 486 618 484 596 506 589 C 554 602 602 590 638 560 C 672 530 688 488 676 438 C 668 404 642 385 612 382 Z"
          fill="url(#cat-ringGrad)" stroke="#D1923C" strokeWidth={5} strokeLinejoin="round" />
        <g fill="none" stroke="#B8772F" strokeLinecap="round" strokeWidth={16} opacity={1}>
          <path d="M 662 388 Q 690 410 700 438" />
          <path d="M 690 462 Q 706 482 700 508" />
          <path d="M 682 536 Q 690 556 676 576" />
          <path d="M 648 578 Q 654 594 636 608" />
          <path d="M 602 594 Q 608 606 592 616" />
          <path d="M 556 604 Q 560 614 546 620" />
        </g>
        <path d="M 612 382 C 668 348 730 388 742 452 C 754 516 722 575 670 610 C 618 645 558 648 510 627 C 486 618 484 596 506 589 C 554 602 602 590 638 560 C 672 530 688 488 676 438 C 668 404 642 385 612 382 Z"
          fill="none" stroke="#B8772F" strokeWidth={2.5} opacity={0.15} />
      </g>

      <g filter="url(#cat-shadow)">
        <circle cx="400" cy="400" r="230" fill="none" stroke="url(#cat-ringGrad)" strokeWidth={68} strokeLinecap="round" />
        <circle cx="400" cy="400" r="230" fill="none" stroke="#B8772F" strokeWidth={68} strokeLinecap="round" opacity={0.08} />
      </g>

      <g id="ear-left" filter="url(#cat-shadow)">
        <path d="M 208 242 C 170 176 142 118 212 134 C 252 143 288 176 312 222 C 288 210 252 194 208 242 Z"
          fill="#E6A64D" stroke="#D1923C" strokeWidth={4} strokeLinejoin="round" />
        <path d="M 236 218 C 212 180 196 152 230 160 C 252 165 272 183 284 206 C 268 197 250 188 236 218 Z" fill="#B8772F" />
      </g>

      <g id="ear-right" filter="url(#cat-shadow)">
        <path d="M 592 242 C 630 176 658 118 588 134 C 548 143 512 176 488 222 C 512 210 548 194 592 242 Z"
          fill="#E6A64D" stroke="#D1923C" strokeWidth={4} strokeLinejoin="round" />
        <path d="M 564 218 C 588 180 604 152 570 160 C 548 165 528 183 516 206 C 532 197 550 188 564 218 Z" fill="#B8772F" />
      </g>

      <g id="paws" filter="url(#cat-shadow)">
        <g transform="translate(340 615)">
          <ellipse cx="0" cy="8" rx="42" ry="30" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <circle cx="-22" cy="-12" r="14" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <circle cx="0" cy="-20" r="16" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <circle cx="22" cy="-12" r="14" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <ellipse cx="0" cy="10" rx="18" ry="10" fill="#F5E6C8" opacity={0.2} />
        </g>
        <g transform="translate(460 615)">
          <ellipse cx="0" cy="8" rx="42" ry="30" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <circle cx="-22" cy="-12" r="14" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <circle cx="0" cy="-20" r="16" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <circle cx="22" cy="-12" r="14" fill="#E6A64D" stroke="#D1923C" strokeWidth={4} />
          <ellipse cx="0" cy="10" rx="18" ry="10" fill="#F5E6C8" opacity={0.2} />
        </g>
      </g>

      <g id="bell-left" transform="translate(368 608)" filter="url(#cat-shadow)">
        <rect x="-11" y="-10" width="22" height="10" rx="4" fill="#B8772F" />
        <rect x="-11" y="-10" width="22" height="10" rx="4" fill="none" stroke="#8F5E24" strokeWidth={1.5} />
        <path d="M -15 -2 C -16 -14 16 -14 15 -2 L 12 10 Q 0 20 -12 10 Z" fill="#F5E6C8" stroke="#B8772F" strokeWidth={3} strokeLinejoin="round" />
        <ellipse cx="-5" cy="-5" rx="4" ry="2.5" fill="white" opacity={0.7} />
        <circle cx="0" cy="11" r="3.2" fill="#B8772F" stroke="#8F5E24" strokeWidth={1} />
      </g>

      <g id="bell-right" transform="translate(432 608)" filter="url(#cat-shadow)">
        <rect x="-11" y="-10" width="22" height="10" rx="4" fill="#B8772F" />
        <rect x="-11" y="-10" width="22" height="10" rx="4" fill="none" stroke="#8F5E24" strokeWidth={1.5} />
        <path d="M -15 -2 C -16 -14 15 -2 L 12 10 Q 0 20 -12 10 Z" fill="#F5E6C8" stroke="#B8772F" strokeWidth={3} strokeLinejoin="round" />
        <ellipse cx="-5" cy="-5" rx="4" ry="2.5" fill="white" opacity={0.7} />
        <circle cx="0" cy="11" r="3.2" fill="#B8772F" stroke="#8F5E24" strokeWidth={1} />
      </g>

      <circle cx="400" cy="400" r="196" fill="none" stroke="#F5E6C8" strokeWidth={2} opacity={0.15} />
    </svg>
  </div>
);

// --- NEW ARISE BUBBLE SVG COMPONENT ---
const AriseBubbleSVG = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center pointer-events-none", className)}>
    <svg viewBox="0 0 800 300" className="w-full h-auto drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF3B3B"/>
          <stop offset="48%" stopColor="#D31212"/>
          <stop offset="100%" stopColor="#8B0000"/>
        </linearGradient>
        <linearGradient id="goldBorder" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B8860B"/>
          <stop offset="22%" stopColor="#FFD700"/>
          <stop offset="48%" stopColor="#FFF4B3"/>
          <stop offset="74%" stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
        <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6"/>
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </linearGradient>
        <filter id="outerShadow">
          <feDropShadow dx="0" dy="16" stdDeviation="14" floodOpacity="0.34"/>
        </filter>
        <filter id="innerDepth">
          <feOffset dy="5"/><feGaussianBlur stdDeviation="7"/>
          <feComposite in2="SourceAlpha" operator="out"/>
          <feFlood floodOpacity="0.38"/><feComposite operator="in"/>
          <feComposite in="SourceGraphic" operator="over"/>
        </filter>
        <filter id="textGlow">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.5"/>
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FFD700" floodOpacity="0.65"/>
        </filter>
        <path id="bubbleShape" d="M180 30 H710 A50 50 0 0 1 760 80 V170 A50 50 0 0 1 710 220 H265 C235 220 200 240 185 260 C165 285 140 300 115 285 C140 275 170 245 165 225 H180 A50 50 0 0 1 130 170 V80 A50 50 0 0 1 180 30 Z"/>
      </defs>

      <g filter="url(#outerShadow)">
        <use href="#bubbleShape" fill="url(#redFill)" stroke="url(#goldBorder)" strokeWidth="16"/>
        <use href="#bubbleShape" fill="url(#redFill)" filter="url(#innerDepth)"/>
      </g>

      <ellipse cx="444" cy="68" rx="285" ry="72" fill="url(#gloss)"/>

      <g fill="none" stroke="#5E3A05" strokeOpacity="0.58" strokeWidth="1.3">
        <path d="M155 55 c-11 0 -18 7 -16 16 2 8 11 11 17 6"/>
        <path d="M735 55 c11 0 18 7 16 16 -2 8 -11 11 -17 6"/>
        <path d="M735 195 c11 0 18 -7 16 -16 -2 -8 -11 -11 -17 -6"/>
        <path d="M235 195 c-11 0 -18 -7 -16 -16 2 -8 11 -11 17 -6"/>
      </g>

      <text x="444" y="147" textAnchor="middle" fontFamily="Georgia, serif" 
            fontSize="70" fontStyle="italic" fontWeight="600" 
            fill="#FFFFFF" filter="url(#textGlow)">Hey ummy</text>
    </svg>
  </div>
);

// --- NEW BLUE CB BUBBLE SVG COMPONENT ---
const BlueCbBubbleSVG = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center pointer-events-none", className)}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" className="w-full h-auto drop-shadow-xl">
      <defs>
        <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00BFFF"/>
          <stop offset="45%" stopColor="#1E90FF"/>
          <stop offset="100%" stopColor="#003A8C"/>
        </linearGradient>
        <linearGradient id="goldBorderBlue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B8860B"/>
          <stop offset="25%" stopColor="#FFD700"/>
          <stop offset="50%" stopColor="#FFF4B3"/>
          <stop offset="75%" stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#D4AF37"/>
        </linearGradient>
        <linearGradient id="glossBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9"/>
          <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </linearGradient>
        <filter id="outerBlue">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#00183a" floodOpacity="0.5"/>
        </filter>
        <filter id="innerDepthBlue">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
          <feOffset dy="4"/>
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="0 0 0  0 0 0  0 0 0  0 0 0 0.45 0"/>
          <feBlend in2="SourceGraphic" mode="multiply"/>
        </filter>
        <filter id="textGlowBlue">
          <feGaussianBlur stdDeviation="3"/>
          <feFlood floodColor="#FFD700" floodOpacity="0.75"/>
          <feComposite operator="in" in2="SourceGraphic"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <path id="filigreeBlue" d="M0 0 C-14 1 -22 9 -20 18 C-18 25 -10 29 -2 27 C-8 28 -14 24 -15 17 C-16 11 -12 5 -6 4 M-8 7 C-13 9 -16 14 -14 19 M-4 11 C-7 12 -9 16 -7 19"/>
      </defs>

      <g filter="url(#outerBlue)">
        <path d="M140 20 H660 A60 60 0 0 1 720 80 V150 A60 60 0 0 1 660 210 H220 C205 215 180 240 120 270 C140 250 155 225 160 210 H140 A60 60 0 0 1 80 150 V80 A60 60 0 0 1 140 20 Z" 
              fill="url(#blueFill)" stroke="url(#goldBorderBlue)" strokeWidth="16" strokeLinejoin="round"/>
      </g>
      <path d="M140 20 H660 A60 60 0 0 1 720 80 V150 A60 60 0 0 1 660 210 H220 C205 215 180 240 120 270 C140 250 155 225 160 210 H140 A60 60 0 0 1 80 150 V80 A60 60 0 0 1 140 20 Z" 
            fill="url(#blueFill)" filter="url(#innerDepthBlue)" opacity="0.9"/>

      <ellipse cx="400" cy="65" rx="280" ry="70" fill="url(#glossBlue)"/>

      <g fill="none" stroke="#7A5208" strokeOpacity="0.7" strokeWidth="1.4">
        <use href="#filigreeBlue" transform="translate(155 55)"/>
        <use href="#filigreeBlue" transform="translate(645 55) scale(-1 1)"/>
        <use href="#filigreeBlue" transform="translate(645 175) scale(-1 -1)"/>
        <use href="#filigreeBlue" transform="translate(155 175) scale(1 -1)"/>
      </g>

      <circle cx="385" cy="19" r="2.6" fill="#FFD700" fillOpacity="0.9"/>

      <text x="400" y="128" textAnchor="middle" fontFamily="Georgia, serif" 
            fontStyle="italic" fontSize="64" fill="#FFFFFF" filter="url(#textGlowBlue)">
        Hey ummy
      </text>
    </svg>
  </div>
);

// --- STORE ITEMS ---
const STATIC_STORE_ITEMS = [
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 7, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 7, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 7, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },
  { id: 'w-lovelyshine', name: 'Lovely Shine', type: 'Wave', price: 59999, durationDays: 7, description: 'Magical blue glow with floating hearts.', icon: Activity, color: 'text-blue-400' },
  { id: 'w-waveflew', name: 'Waveflew', type: 'Wave', price: 10000, durationDays: 7, description: 'Premium 3D Glossy frequency wave.', icon: Activity, color: 'text-white' },
  { id: 'w-tonepink', name: 'Tone Pink', type: 'Wave', price: 30000, durationDays: 7, description: '3D Glossy Pink rhythmic frequency.', icon: Activity, color: 'text-pink-500' },
  { id: 'w-vox', name: 'Vox', type: 'Wave', price: 30500, durationDays: 7, description: 'Crystal blue 3D glossy voice wave.', icon: Activity, color: 'text-blue-500' },
  { id: 'w-reso', name: 'Reso', type: 'Wave', price: 20000, durationDays: 7, description: 'Neon green resonance 3D glossy wave.', icon: Activity, color: 'text-green-500' },
  { id: 'w-echo', name: 'Echo', type: 'Wave', price: 25999, durationDays: 7, description: 'Vibrant orange echo 3D glossy frequency.', icon: Activity, color: 'text-orange-500' },
];

export default function StorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(7);

  useEffect(() => {
    if (previewItem) {
      setSelectedDuration(7);
    }
  }, [previewItem]);

  const themesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'roomThemes'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: dbThemes } = useCollection(themesQuery);

  const dynamicThemes = useMemo(() => {
    const baseThemes = (dbThemes || []).filter(t => (t.price || 0) > 0).map(t => ({
      ...t,
      type: 'Theme',
      description: t.description || `High-fidelity ${t.name} background.`
    }));
    return baseThemes;
  }, [dbThemes]);

  const frameItems = useMemo(() => {
    const frames: any[] = [];
    (Object.values(AVATAR_FRAMES) as AvatarFrameConfig[]).forEach(f => {
      frames.push({ ...f, type: 'Frame', price: 0, description: `Premium ${f.tier} identity frame.` } as any);
    });
    
    frames.push({
      id: 'f-glossy-wings',
      name: 'Glossy wings',
      type: 'Frame',
      price: 500000,
      durationDays: 7,
      description: 'Exclusive animated Glossy wings frame.',
      isCustomSVG: true
    });

    frames.push({
      id: 'f-kitti',
      name: 'Kitti',
      type: 'Frame',
      price: 600000,
      durationDays: 7,
      description: 'Exclusive animated Kitti frame.',
      isCustomSVG: true
    });

    return frames;
  }, []);

  const bubbleItems = useMemo(() => [
    ...STATIC_STORE_ITEMS.filter(i => i.type === 'Bubble'),
    { 
      id: 'b-arise', 
      name: 'Arise', 
      type: 'Bubble', 
      price: 50999, 
      durationDays: 7, 
      description: 'Premium red glossy bubble with golden borders.', 
      isCustomSVG: true 
    },
    {
      id: 'b-blue-cb',
      name: 'Blue Cb',
      type: 'Bubble',
      price: 49599,
      durationDays: 7,
      description: 'Premium blue glossy bubble with golden borders.',
      isCustomSVG: true
    }
  ], []);

  const waveItems = useMemo(() => [
    ...STATIC_STORE_ITEMS.filter(i => i.type === 'Wave')
  ], []);

  const idItems = useMemo(() => [
    { id: 'id-667276', name: 'Pink ID', type: 'ID', price: 3999999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 667276 Badge.', displayId: '667276', isPinkDiamond: true },
    { id: 'id-779261', name: 'Pink ID', type: 'ID', price: 1099999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 779261 Badge.', displayId: '779261', isPinkDiamond: true },
    { id: 'id-667788', name: 'Pink ID', type: 'ID', price: 2009999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 667788 Badge.', displayId: '667788', isPinkDiamond: true },
    { id: 'id-688992', name: 'Pink ID', type: 'ID', price: 7399999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 688992 Badge.', displayId: '688992', isPinkDiamond: true },
    { id: 'id-779999', name: 'Pink ID', type: 'ID', price: 7099999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 779999 Badge.', displayId: '779999', isPinkDiamond: true },
    { id: 'id-445500', name: 'Pink ID', type: 'ID', price: 6959999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 445500 Badge.', displayId: '445500', isPinkDiamond: true },
    { id: 'id-113377', name: 'Pink ID', type: 'ID', price: 9020555, durationDays: 7, description: 'Exclusive Premium Pink ID Number 113377 Badge.', displayId: '113377', isPinkDiamond: true },
    { id: 'id-117676', name: 'Pink ID', type: 'ID', price: 6089999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 117676 Badge.', displayId: '117676', isPinkDiamond: true },
    { id: 'id-223434', name: 'Pink ID', type: 'ID', price: 7999877, durationDays: 7, description: 'Exclusive Premium Pink ID Number 223434 Badge.', displayId: '223434', isPinkDiamond: true },
    { id: 'id-102020', name: 'Pink ID', type: 'ID', price: 2899999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 102020 Badge.', displayId: '102020', isPinkDiamond: true },
    { id: 'id-800232', name: 'Pink ID', type: 'ID', price: 9750000, durationDays: 7, description: 'Exclusive Premium Pink ID Number 800232 Badge.', displayId: '800232', isPinkDiamond: true },
    { id: 'id-675747', name: 'Pink ID', type: 'ID', price: 1000599, durationDays: 7, description: 'Exclusive Premium Pink ID Number 675747 Badge.', displayId: '675747', isPinkDiamond: true },
    { id: 'id-189904', name: 'Silver ID', type: 'ID', price: 1500999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 189904 Badge.', displayId: '189904', isSilver: true },
    { id: 'id-122234', name: 'Silver ID', type: 'ID', price: 1990999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 122234 Badge.', displayId: '122234', isSilver: true },
    { id: 'id-189990', name: 'Silver ID', type: 'ID', price: 9030999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 189990 Badge.', displayId: '189990', isSilver: true },
    { id: 'id-162972', name: 'Silver ID', type: 'ID', price: 7130999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 162972 Badge.', displayId: '162972', isSilver: true },
    { id: 'id-000222', name: 'Silver ID', type: 'ID', price: 5130999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 000222 Badge.', displayId: '000222', isSilver: true },
    { id: 'id-234555', name: 'Silver ID', type: 'ID', price: 9230999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 234555 Badge.', displayId: '234555', isSilver: true },
    { id: 'id-897633', name: 'Silver ID', type: 'ID', price: 9930999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 897633 Badge.', displayId: '897633', isSilver: true },
    { id: 'id-144672', name: 'Silver ID', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 144672 Badge.', displayId: '144672', isSilver: true },
    { id: 'id-666892', name: 'Silver ID', type: 'ID', price: 9899999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 666892 Badge.', displayId: '666892', isSilver: true },
    { id: 'id-111263', name: 'Silver ID', type: 'ID', price: 2099900, durationDays: 7, description: 'Exclusive Premium Silver ID Number 111263 Badge.', displayId: '111263', isSilver: true },
    { id: 'id-182910', name: 'Silver ID', type: 'ID', price: 3999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 182910 Badge.', displayId: '182910', isSilver: true },
    { id: 'id-188889', name: 'Silver ID', type: 'ID', price: 4555990, durationDays: 7, description: 'Exclusive Premium Silver ID Number 188889 Badge.', displayId: '188889', isSilver: true },
    { id: 'id-105577', name: 'Silver ID', type: 'ID', price: 3057999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 105577 Badge.', displayId: '105577', isSilver: true },
    { id: 'id-977777', name: 'Silver ID', type: 'ID', price: 1059999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 977777 Badge.', displayId: '977777', isSilver: true },
    { id: 'id-233455', name: 'Silver ID', type: 'ID', price: 7089999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 233455 Badge.', displayId: '233455', isSilver: true },
    { id: 'id-778855', name: 'Silver ID', type: 'ID', price: 8999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 778855 Badge.', displayId: '778855', isSilver: true },
    { id: 'id-982201', name: 'Silver ID', type: 'ID', price: 6999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 982201 Badge.', displayId: '982201', isSilver: true },
    { id: 'id-721111', name: 'Silver ID', type: 'ID', price: 1399999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 721111 Badge.', displayId: '721111', isSilver: true },
    { id: 'id-188899', name: 'Silver ID', type: 'ID', price: 1359998, durationDays: 7, description: 'Exclusive Premium Silver ID Number 188899 Badge.', displayId: '188899', isSilver: true },
    { id: 'id-888882', name: 'Silver ID', type: 'ID', price: 8888000, durationDays: 7, description: 'Exclusive Premium Silver ID Number 888882 Badge.', displayId: '888882', isSilver: true },
    { id: 'id-888888', name: 'sss', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive VIP ID Number 888888 Badge.', displayId: '888888', variant: 'red' },
    { id: 'id-666666', name: 'sss', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive VIP ID Number 666666 Badge.', displayId: '666666', variant: 'red' },
    { id: 'id-676767', name: 'sss', type: 'ID', price: 6999999, durationDays: 7, description: 'Exclusive VIP ID Number 676767 Badge.', displayId: '676767', variant: 'red' },
    { id: 'id-111111', name: 'sss', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive VIP ID Number 111111 Badge.', displayId: '111111', variant: 'red' },
    { id: 'id-999999', name: 'sss', type: 'ID', price: 7000000, durationDays: 7, description: 'Exclusive VIP ID Number 999999 Badge.', displayId: '999999', variant: 'red' },
    { id: 'id-777777', name: 'sss', type: 'ID', price: 5500000, durationDays: 7, description: 'Exclusive VIP ID Number 777777 Badge.', displayId: '777777', variant: 'red' },
    { id: 'id-122334', name: 'sss', type: 'ID', price: 4000000, durationDays: 7, description: 'Exclusive VIP ID Number 122334 Badge.', displayId: '122334', variant: 'red' },
    { id: 'id-989898', name: 'sss', type: 'ID', price: 7900000, durationDays: 7, description: 'Exclusive VIP ID Number 989898 Badge.', displayId: '989898', variant: 'red' },
    { id: 'id-232323', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 232323 Badge.', displayId: '232323', variant: 'red' },
    { id: 'id-111222', name: 'sss', type: 'ID', price: 9900000, durationDays: 7, description: 'Exclusive VIP ID Number 111222 Badge.', displayId: '111222', variant: 'red' },
    { id: 'id-124456', name: 'sss', type: 'ID', price: 4000000, durationDays: 7, description: 'Exclusive VIP ID Number 124456 Badge.', displayId: '124456', variant: 'red' },
    { id: 'id-987449', name: 'sss', type: 'ID', price: 7900000, durationDays: 7, description: 'Exclusive VIP ID Number 987449 Badge.', displayId: '987449', variant: 'red' },
    { id: 'id-234787', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 234787 Badge.', displayId: '234787', variant: 'red' },
    { id: 'id-111333', name: 'sss', type: 'ID', price: 9900000, durationDays: 7, description: 'Exclusive VIP ID Number 111333 Badge.', displayId: '111333', variant: 'red' },
    { id: 'id-242424', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 242424 Badge.', displayId: '242424', variant: 'red' },
    { id: 'id-124455', name: 'sss', type: 'ID', price: 4000000, durationDays: 7, description: 'Exclusive VIP ID Number 124455 Badge.', displayId: '124455', variant: 'red' },
    { id: 'id-977789', name: 'sss', type: 'ID', price: 7900000, durationDays: 7, description: 'Exclusive VIP ID Number 977789 Badge.', displayId: '977789', variant: 'red' },
    { id: 'id-234578', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 234578 Badge.', displayId: '234578', variant: 'red' },
    { id: 'id-112223', name: 'sss', type: 'ID', price: 9900000, durationDays: 7, description: 'Exclusive VIP ID Number 112223 Badge.', displayId: '112223', variant: 'red' },
  ], []);

  const allItems = [...frameItems, ...bubbleItems, ...dynamicThemes, ...waveItems, ...idItems];

  const getCalculatedPrice = (basePrice: number, duration: number) => {
    if (duration === 7) return basePrice;
    return Math.floor((basePrice / 7) * 3);
  };

  const handlePurchase = (item: any, duration: number) => {
    if (!userProfile || !user || !firestore) return;
    const finalPrice = getCalculatedPrice(item.price, duration);

    if ((userProfile.wallet?.coins || 0) < finalPrice) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);
    
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    const updateData = { 
      'wallet.coins': increment(-finalPrice), 
      'inventory.ownedItems': arrayUnion(item.id),
      [`inventory.expiries.${item.id}`]: Timestamp.fromDate(expiryDate),
      'updatedAt': serverTimestamp() 
    };

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-finalPrice), 'updatedAt': serverTimestamp() });
    toast({ title: 'Purchase Successful' });
    setPreviewItem(null);
  };

  const handleEquipToggle = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    let field = `inventory.active${item.type}`;
    const isActive = userProfile.inventory?.[`active${item.type}` as keyof typeof userProfile.inventory] === item.id;
    const updateData = { [field]: isActive ? 'None' : item.id, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, updateData);
    toast({ title: isActive ? `${item.type} Unequipped` : 'Item Equipped' });
    setPreviewItem(null);
  };

  if (isProfileLoading) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#121A1F] via-[#0A0E12] to-[#050709] text-white pb-safe overflow-x-hidden">
      
      <div className="absolute top-0 left-0 right-0 h-[15vh] pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/25 via-purple-900/5 to-transparent" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-full bg-purple-500/10 rounded-[100%]" />
      </div>

      <div className="relative z-10 space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-16 pb-24">
        
        <header className="relative flex items-center justify-center border-b border-white/10 pb-6 min-h-[48px]">
          <button onClick={() => router.back()} className="absolute left-0 p-2 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-full">
            <ChevronLeft />
          </button>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]">Store</h1>
        </header>

        <Tabs defaultValue="Frame" className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar mb-6">
            <TabsList className="bg-transparent inline-flex min-w-full md:min-w-0 gap-2 border-b border-white/5 pb-1 rounded-none">
              {['All', 'Frame', 'Theme', 'Bubble', 'Wave', 'ID'].map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat} 
                  className="rounded-none px-6 py-2 text-gray-400 font-medium whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-[#FCD535] relative data-[state=active]:after:absolute data-[state=active]:after:-bottom-[5px] data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-[3px] data-[state=active]:after:w-6 data-[state=active]:after:bg-[#FCD535] data-[state=active]:after:rounded-full transition-all"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {['All', 'Frame', 'Theme', 'Bubble', 'Wave', 'ID'].map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allItems.filter(i => category === 'All' || i.type === category).map(item => (
                  <Card key={item.id} onClick={() => setPreviewItem(item)} className="overflow-hidden rounded-[1rem] bg-gradient-to-b from-[#18232D] to-[#0D141A] border border-[#23303D] shadow-xl cursor-pointer hover:scale-[1.02] hover:border-[#384A5D] active:scale-95 transition-all text-white">
                    <div className="aspect-square flex items-center justify-center p-4 relative border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                      {item.type === 'Frame' ? (
                        <div className="scale-110">
                          {item.isCustomSVG ? (
                            <div className="relative flex items-center justify-center h-20 w-20">
                              <Avatar className="absolute h-[38px] w-[38px]">
                                <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} />
                                <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                              </Avatar>
                              {item.id === 'f-kitti' ? (
                                <CatFrameSVG className="absolute inset-0 z-10 w-full h-full scale-[1.6]" />
                              ) : (
                                <GlossyWingsSVG className="absolute inset-0 z-10 w-full h-full scale-[1.6]" />
                              )}
                            </div>
                          ) : (
                            <AvatarFrame frameId={item.id} size="md">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} />
                                <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                              </Avatar>
                            </AvatarFrame>
                          )}
                        </div>
                      ) : item.type === 'Bubble' ? (
                        item.isCustomSVG && item.id === 'b-arise' ? (
                          <div className="w-[120px]">
                            <AriseBubbleSVG />
                          </div>
                        ) : item.isCustomSVG && item.id === 'b-blue-cb' ? (
                          <div className="w-[120px]">
                            <BlueCbBubbleSVG />
                          </div>
                        ) : (
                          <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px]">Hello Ummy</ChatMessageBubble>
                        )
                      ) : item.type === 'Theme' ? (
                        <Palette className={cn("h-12 w-12 opacity-50", item.color || "text-purple-400")} />
                      ) : item.type === 'Wave' ? (
                         <WaveCircleIcon colorClass={item.color} size="h-20 w-20" isLovelyShine={item.id === 'w-lovelyshine'} />
                      ) : item.type === 'ID' ? (
                           item.isPinkDiamond ? <PinkDiamondIDBadgeIcon number={item.displayId || ''} /> :
                           item.isSilver ? <SilverBlueIDBadgeIcon number={item.displayId || ''} /> : 
                           <IDBadgeIcon number={item.displayId || ''} />
                      ) : item.icon ? (
                        <item.icon className={cn("h-12 w-12 opacity-50", item.color)} />
                      ) : null}
                    </div>
                    <CardHeader className="text-center p-3 pb-1">
                      <CardTitle className="text-sm font-normal text-gray-300 truncate">{item.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3 p-3 pt-1">
                      <div className="flex items-center justify-center gap-1.5 text-sm w-full">
                        <DollarCoinIcon className="h-4 w-4" />
                        <span className="text-[#FCD535] font-bold">{item.price.toLocaleString()}</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {previewItem && (
          <>
            <div className="fixed inset-0 bg-black/70 z-40 transition-opacity" onClick={() => setPreviewItem(null)} />
            
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] rounded-t-[24px] h-[40vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-300 ease-out">
              
              <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>

              <div className="flex-1 overflow-y-auto flex flex-col items-center pt-8 pb-4 px-4">
                <div className="mb-4 scale-[1.1] flex items-center justify-center h-28 w-28">
                  {previewItem.type === 'Frame' ? (
                    previewItem.isCustomSVG ? (
                      <div className="relative flex items-center justify-center h-32 w-32 mt-4">
                        <Avatar className="absolute h-[60px] w-[60px]">
                          <AvatarImage src={`https://picsum.photos/seed/${previewItem.id}/200`} />
                          <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                        </Avatar>
                        {previewItem.id === 'f-kitti' ? (
                          <CatFrameSVG className="absolute inset-0 z-10 w-full h-full scale-[1.6]" />
                        ) : (
                          <GlossyWingsSVG className="absolute inset-0 z-10 w-full h-full scale-[1.6]" />
                        )}
                      </div>
                    ) : (
                      <AvatarFrame frameId={previewItem.id} size="xl">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={`https://picsum.photos/seed/${previewItem.id}/200`} />
                          <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                        </Avatar>
                      </AvatarFrame>
                    )
                  ) : previewItem.type === 'Bubble' ? (
                    previewItem.isCustomSVG && previewItem.id === 'b-arise' ? (
                      <div className="w-[200px]">
                        <AriseBubbleSVG />
                      </div>
                    ) : previewItem.isCustomSVG && previewItem.id === 'b-blue-cb' ? (
                      <div className="w-[200px]">
                        <BlueCbBubbleSVG />
                      </div>
                    ) : (
                      <ChatMessageBubble bubbleId={previewItem.id} isMe={true} className="text-sm">Hello Ummy</ChatMessageBubble>
                    )
                  ) : previewItem.type === 'Theme' ? (
                    <Palette className={cn("h-16 w-16 opacity-80", previewItem.color || "text-purple-400")} />
                  ) : previewItem.type === 'Wave' ? (
                    <WaveCircleIcon colorClass={previewItem.color} size="h-28 w-28" isLovelyShine={previewItem.id === 'w-lovelyshine'} />
                  ) : previewItem.type === 'ID' ? (
                      <div className="scale-110 pt-2">
                        {previewItem.isPinkDiamond ? <PinkDiamondIDBadgeIcon number={previewItem.displayId || ''} /> :
                         previewItem.isSilver ? <SilverBlueIDBadgeIcon number={previewItem.displayId || ''} /> : 
                         <IDBadgeIcon number={previewItem.displayId || ''} />}
                      </div>
                  ) : previewItem.icon ? (
                    <previewItem.icon className={cn("h-16 w-16 opacity-80", previewItem.color)} />
                  ) : null}
                </div>

                <h2 className="text-xl font-medium text-white tracking-wide">{previewItem.name}</h2>

                <div className="flex gap-4 mt-4 w-full justify-center">
                  {[3, 7].map(days => (
                    <button 
                      key={days}
                      onClick={() => setSelectedDuration(days)}
                      className={cn(
                        "relative border rounded-[10px] w-28 py-2 flex items-center justify-center transition-all",
                        selectedDuration === days ? "border-[#FCD535] bg-[#313131]" : "border-white/5 bg-[#222]"
                      )}
                    >
                      <span className={cn("text-sm", selectedDuration === days ? "text-white" : "text-gray-400")}>{days} Days</span>
                      {selectedDuration === days && (
                        <div className="absolute -bottom-1 -right-1 bg-[#FCD535] rounded-tl-md rounded-br-[10px] p-0.5">
                          <Check size={12} strokeWidth={3} className="text-black" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#222222] rounded-t-[20px] p-4 pb-6 flex items-center justify-between">
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <DollarCoinIcon className="w-5 h-5" />
                    <span className="text-[#FCD535] font-bold text-xl tracking-wide">
                      {getCalculatedPrice(previewItem.price, selectedDuration).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    const isOwned = userProfile?.inventory?.ownedItems?.includes(previewItem.id);
                    isOwned ? handleEquipToggle(previewItem) : handlePurchase(previewItem, selectedDuration);
                  }}
                  className={cn(
                    "rounded-full px-12 py-5 text-md font-medium tracking-wide shadow-lg transition-colors",
                    userProfile?.inventory?.ownedItems?.includes(previewItem.id)
                      ? userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                        : "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                      : "bg-[#FCD535] text-black hover:bg-[#e5c02b]" 
                  )}
                >
                  {userProfile?.inventory?.ownedItems?.includes(previewItem.id) 
                    ? (userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id ? 'Unequip' : 'Equip') 
                    : 'Buy'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

