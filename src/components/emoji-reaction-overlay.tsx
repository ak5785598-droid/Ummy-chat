'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- SHARP & BOLD 3D EMOJI RENDERER (MATCHING PICKER STYLE) ---

const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* Premium Gold Sphere Gradient */}
      <radialGradient id="seatGradSphere" cx="45%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFF176" />
        <stop offset="70%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57F17" />
      </radialGradient>
      
      {/* Surface Gloss */}
      <linearGradient id="seatShine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
        <stop offset="40%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Deep Red for Anger */}
      <radialGradient id="seatGradRed" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#D50000" />
      </radialGradient>
    </defs>
  );

  const Face = ({ fill }: { fill: string }) => (
    <>
      <circle cx="50" cy="50" r="46" fill={fill} stroke="#C62828" strokeWidth="0.5" />
      <circle cx="50" cy="46" r="42" fill="url(#seatShine)" />
    </>
  );

  // Bold Eye Component
  const BoldEye = ({ cx, cy }: { cx: number, cy: number }) => (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="white" />
      <circle cx={cx} cy={cy} r="4" fill="black" />
      <circle cx={cx - 1.5} cy={cy - 1.5} r="1.5" fill="white" />
    </g>
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <BoldEye cx={35} cy={40} />
          <BoldEye cx={65} cy={40} />
          <path d="M40 52 Q50 58 60 52" stroke="black" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="10" y="62" width="80" height="22" rx="6" fill="#F44336" stroke="#B71C1C" strokeWidth="1" />
          <text x="50" y="78" fontSize="9" fontWeight="1000" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black, sans-serif'}}>{type.toUpperCase()}</text>
        </svg>
      );
    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M25 40 Q35 25 45 40 M55 40 Q65 25 75 40" stroke="black" strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <path d="M25 55 Q50 85 75 55 Z" fill="#4E342E" stroke="black" strokeWidth="1" />
          <path d="M15 35 Q5 25 20 15 M85 35 Q95 25 80 15" stroke="#40C4FF" strokeWidth="8" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M25 45 Q50 40 75 45" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M35 55 Q50 85 65 55 Z" fill="#4E342E" />
          <path d="M30 45 V88 M70 45 V88" stroke="#03A9F4" strokeWidth="11" strokeLinecap="round" opacity="0.9" />
        </svg>
      );
    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <rect x="18" y="35" width="64" height="16" rx="2" fill="#212121" />
          <path d="M30 68 Q50 78 70 68" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <BoldEye cx={35} cy={40} />
          <path d="M60 40 Q65 35 70 40 T80 40" stroke="black" strokeWidth="3.5" fill="none" />
          <path d="M70 65 Q85 55 72 45 Q59 55 70 65" fill="#FF1744" stroke="#880E4F" strokeWidth="0.5" />
          <path d="M45 65 Q50 69 55 65" stroke="black" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradRed)" />
          <path d="M22 35 L45 45 M78 35 L55 45" stroke="black" strokeWidth="7" strokeLinecap="round" />
          <BoldEye cx={38} cy={52} />
          <BoldEye cx={62} cy={52} />
          <path d="M32 78 Q50 65 68 78" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M12 55 Q50 10 88 55" stroke="#F44336" strokeWidth="11" fill="none" strokeLinecap="round" />
          <rect x="4" y="50" width="18" height="32" rx="6" fill="#F44336" />
          <rect x="78" y="50" width="18" height="32" rx="6" fill="#F44336" />
          <path d="M40 68 Q50 76 60 68" stroke="black" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <BoldEye cx={35} cy={45} />
          <BoldEye cx={65} cy={45} />
          <path d="M32 78 Q50 62 68 78" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );
    default:
      return <span className="text-current text-2xl">{type}</span>;
  }
};

interface EmojiReactionOverlayProps {
 emoji?: string | null;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function EmojiReactionOverlay({ emoji, size = 'md' }: EmojiReactionOverlayProps) {
  const [activeEmoji, setActiveEmoji] = useState<{ id: number, type: string } | null>(null);

  useEffect(() => {
    if (emoji) {
      const newEmoji = { id: Date.now(), type: emoji };
      setActiveEmoji(newEmoji);

      const timer = setTimeout(() => {
        setActiveEmoji(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [emoji]);

  if (!activeEmoji) return null;

  // SIZES INCREASED: Seat ko cover karne ke liye sizes thode aur badha diye hain
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEmoji.id}
          className={cn(
            "drop-shadow-[0_0_25px_rgba(0,0,0,0.6)] flex items-center justify-center",
            sizeClasses[size]
          )}
          initial={{ scale: 0.4, opacity: 0, y: 20 }}
          animate={{ scale: 1.2, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 12 
          }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
