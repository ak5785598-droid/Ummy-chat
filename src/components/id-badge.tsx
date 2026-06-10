'use client';

import { cn } from '@/lib/utils';

export const PinkDiamondIDBadgeIcon = ({ number, className }: { number: string; className?: string }) => (
  <div className={cn("relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]", className)}>
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
        <path d="M80,75 L82,68 L84,75 L91,77 L84,79 L82,86 L80,79 L73,77 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.6" />
        <circle cx="85" cy="25" r="2.5" fill="#FFFFFF" className="animate-ping" opacity="0.7" />
      </svg>
    </div>
  </div>
);

export const IDBadgeIcon = ({ number, className }: { number: string; className?: string }) => (
  <div className={cn("relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]", className)}>
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

export const SilverBlueIDBadgeIcon = ({ number, className }: { number: string; className?: string }) => (
  <div className={cn("relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]", className)}>
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
        <path d="M80,75 L82,68 L84,75 L91,77 L84,79 L82,86 L80,79 L73,77 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.6" />
        <circle cx="85" cy="25" r="2.5" fill="#FFFFFF" className="animate-ping" opacity="0.7" />
      </svg>
    </div>
  </div>
);

export const ActiveIDBadge = ({ badgeData, fallbackNumber, className }: { badgeData: any, fallbackNumber: string, className?: string }) => {
  if (!badgeData) return null;
  const num = badgeData.displayId || fallbackNumber;
  if (badgeData.isPinkDiamond) return <PinkDiamondIDBadgeIcon number={num} className={className} />;
  if (badgeData.isSilver) return <SilverBlueIDBadgeIcon number={num} className={className} />;
  return <IDBadgeIcon number={num} className={className} />;
};
