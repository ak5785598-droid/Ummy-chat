
'use client';

import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * Official Ummy Brand Signature.
 * Synchronized with the high-fidelity mascot visual.
 * Upgraded to a Reactive Observer: Swaps the brand signature in real-time when the Admin dispatches a new logo.
 */
export const UmmyLogoIcon = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);

  const fallbackLogo = PlaceHolderImages.find(img => img.id === 'ummy-official-logo');
  const src = config?.customLogoUrl || fallbackLogo?.imageUrl || "https://storage.googleapis.com/fetch-and-generate-images/ummy-logo-v3.png";
  
  return (
    <div className={cn("relative shrink-0 flex items-center justify-center overflow-hidden", className)} {...props}>
      <Image 
        src={src} 
        alt="Ummy Logo" 
        fill 
        className="object-contain drop-shadow-md"
        priority
        unoptimized
        data-ai-hint="brand mascot"
      />
    </div>
  );
};

export const GoldCoinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="goldBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="40%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
      <linearGradient id="bearEar" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF4D4D" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#goldBase)" stroke="#8B4513" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="42" fill="none" stroke="#DAA520" strokeWidth="1.5" strokeDasharray="2 2" />
    <path d="M18 45 C 15 50, 15 60, 20 65" fill="none" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" />
    <path d="M82 45 C 85 50, 85 60, 80 65" fill="none" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" />
    <path d="M50 10 L52 15 L58 15 L53 18 L55 24 L50 21 L45 24 L47 18 L42 15 L48 15 Z" fill="#8B4513" />
    <path d="M50 90 L52 85 L58 85 L53 82 L55 76 L50 79 L45 76 L47 82 L42 85 L48 85 Z" fill="#8B4513" />
    <circle cx="35" cy="42" r="9" fill="url(#bearEar)" stroke="#8B4513" strokeWidth="0.5" />
    <circle cx="65" cy="42" r="9" fill="url(#bearEar)" stroke="#8B4513" strokeWidth="0.5" />
    <circle cx="50" cy="55" r="22" fill="#FFCC00" stroke="#8B4513" strokeWidth="0.5" />
    <ellipse cx="50" cy="62" rx="10" ry="8" fill="#FFF9E3" />
    <circle cx="43" cy="52" r="2.5" fill="#1A1A1A" />
    <circle cx="57" cy="52" r="2.5" fill="#1A1A1A" />
    <path d="M48 58 Q50 55 52 58 L50 61 Z" fill="#1A1A1A" />
    <path d="M46 65 Q50 68 54 65" fill="none" stroke="#1A1A1A" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const GameControllerIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 200 150"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("animate-reaction-float", className)}
    {...props}
  >
    <defs>
      <linearGradient id="remoteGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="30%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#FFFFFF" />
        <stop offset="70%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="emeraldGreen" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
      <radialGradient id="buttonShine" cx="30%" cy="30%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity="0.6" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <filter id="remoteShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="0" dy="4" result="offsetblur" />
        <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#remoteShadow)">
      <path 
        d="M40 40 Q20 40 20 70 L25 110 Q30 130 60 125 L80 115 L120 115 L140 125 Q170 130 175 110 L180 70 Q180 40 160 40 Z" 
        fill="url(#remoteGold)" 
        stroke="#8B4513" 
        strokeWidth="0.5"
      />
      <path 
        d="M40 42 Q25 42 25 65 L30 100 Q35 115 55 112 L75 105 L125 105 L145 112 Q165 115 170 100 L175 65 Q175 42 160 42 Z" 
        fill="white" 
        opacity="0.15"
      />
      <rect x="75" y="45" width="50" height="35" rx="4" fill="#8B4513" opacity="0.2" stroke="white" strokeWidth="0.2" />
      <g opacity="0.3">
        {Array.from({length: 5}).map((_, i) => (
          <line key={i} x1="80" y1={50 + i*6} x2="120" y2={50 + i*6} stroke="white" strokeWidth="0.5" />
        ))}
      </g>
      <g transform="translate(45, 75)">
        <path d="M-12 -4 L-4 -4 L-4 -12 L4 -12 L4 -4 L12 -4 L12 4 L4 4 L4 12 L-4 12 L-4 4 L-12 4 Z" fill="url(#emeraldGreen)" stroke="#064e3b" strokeWidth="1" />
        <circle cx="0" cy="0" r="12" fill="url(#buttonShine)" pointerEvents="none" />
      </g>
      <g transform="translate(155, 75)">
        <circle cx="0" cy="-10" r="6" fill="url(#emeraldGreen)" stroke="#064e3b" strokeWidth="1" />
        <circle cx="10" cy="0" r="6" fill="url(#emeraldGreen)" stroke="#064e3b" strokeWidth="1" />
        <circle cx="0" cy="10" r="6" fill="url(#emeraldGreen)" stroke="#064e3b" strokeWidth="1" />
        <circle cx="-10" cy="0" r="6" fill="url(#emeraldGreen)" stroke="#064e3b" strokeWidth="1" />
        <circle cx="0" cy="-10" r="6" fill="url(#buttonShine)" />
        <circle cx="10" cy="0" r="6" fill="url(#buttonShine)" />
        <circle cx="0" cy="10" r="6" fill="url(#buttonShine)" />
        <circle cx="-10" cy="0" r="6" fill="url(#buttonShine)" />
      </g>
      <g transform="translate(80, 100)">
        <circle cx="0" cy="0" r="10" fill="#4d3a00" opacity="0.4" />
        <circle cx="0" cy="0" r="8" fill="url(#emeraldGreen)" stroke="#064e3b" strokeWidth="1" />
        <circle cx="-2" cy="-2" r="4" fill="url(#buttonShine)" />
      </g>
      <g transform="translate(120, 100)">
        <circle cx="0" cy="0" r="10" fill="#4d3a00" opacity="0.4" />
        <circle cx="0" cy="0" r="8" fill="url(#emeraldGreen)" stroke="#064e3b" strokeWidth="1" />
        <circle cx="-2" cy="-2" r="4" fill="url(#buttonShine)" />
      </g>
      <circle cx="70" cy="55" r="2.5" fill="#064e3b" opacity="0.6" />
      <circle cx="130" cy="55" r="2.5" fill="#064e3b" opacity="0.6" />
    </g>
    <rect x="0" y="0" width="20" height="200" fill="white" opacity="0.2" transform="rotate(30) translate(0, -100)">
      <animateTransform attributeName="transform" type="translate" from="-200, -100" to="400, -100" dur="3s" repeatCount="indefinite" />
    </rect>
  </svg>
);
