'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- PREMIUM 3D EMOJI RENDERER ---
const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* Deep 3D Golden Sphere Gradient - 2nd Image Style */}
      <radialGradient id="emojiHDGrad" cx="45%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="60%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57C00" />
      </radialGradient>
      
      {/* High-End Surface Shine */}
      <linearGradient id="emojiGloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.6" />
        <stop offset="50%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Anger Red Gradient */}
      <radialGradient id="angerGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>
    </defs>
  );

  const FaceBase = ({ fill = "url(#emojiHDGrad)" }) => (
    <>
      <circle cx="50" cy="50" r="47" fill={fill} stroke="#E65100" strokeWidth="0.3" />
      <circle cx="50" cy="46" r="42" fill="url(#emojiGloss)" />
    </>
  );

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
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase />
          <BoldEye cx={35} cy={42} />
          <BoldEye cx={65} cy={42} />
          <path d="M42 56 Q50 62 58 56" stroke="black" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="12" y="65" width="76" height="18" rx="9" fill="#F44336" />
          <text x="50" y="78" fontSize="8" fontWeight="1000" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type.toUpperCase()}</text>
        </svg>
      );

    case 'laugh': // MATCHING 2ND IMAGE: Proper Joy Eyes & Tears
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M22 42 Q35 25 48 42 M52 42 Q65 25 78 42" stroke="#4E342E" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M25 60 Q50 95 75 60 Z" fill="#4E342E" />
          <path d="M35 82 Q50 88 65 82" fill="#FF8A80" opacity="0.7" />
          <path d="M12 40 Q4 25 18 15 M88 40 Q96 25 82 15" stroke="#40C4FF" strokeWidth="8" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'cry': // MATCHING 2ND IMAGE: Straight Heavy Tears
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M25 48 Q35 38 48 48 M52 48 Q65 38 78 48" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 65 Q50 85 60 65 Z" fill="#4E342E" />
          <path d="M30 48 V92 M70 48 V92" stroke="#03A9F4" strokeWidth="12" strokeLinecap="round" />
        </svg>
      );

    case 'proud': // MATCHING 2ND IMAGE: Sunglasses with Shine
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <g filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))">
            <path d="M15 40 H48 V55 Q32 60 15 55 Z M52 40 H85 V55 Q68 60 52 55 Z" fill="#212121" />
            <rect x="46" y="44" width="8" height="4" fill="#212121" />
            <path d="M20 44 L40 44" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
          </g>
          <path d="M30 75 Q50 85 70 75" stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'music': // MATCHING 2ND IMAGE: Headphones & Smiling Pout
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M12 55 Q50 5 88 55" stroke="#F44336" strokeWidth="11" fill="none" strokeLinecap="round" />
          <rect x="3" y="50" width="18" height="32" rx="8" fill="#F44336" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))" />
          <rect x="79" y="50" width="18" height="32" rx="8" fill="#F44336" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))" />
          <path d="M32 52 Q40 45 48 52 M52 52 Q60 45 68 52" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M35 72 Q50 85 65 72" stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'kiss': // MATCHING 2ND IMAGE: Winking, Pout & 3D Heart
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <BoldEye cx={32} cy={45} />
          <path d="M55 45 Q65 35 75 45" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M72 68 Q88 55 72 42 Q56 55 72 68" fill="#FF1744" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
          <path d="M42 70 Q48 76 54 70" stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fill="url(#angerGrad)" />
          <path d="M22 35 L45 45 M78 35 L55 45" stroke="black" strokeWidth="7" strokeLinecap="round" />
          <BoldEye cx={38} cy={52} />
          <BoldEye cx={62} cy={52} />
          <path d="M32 78 Q50 65 68 78" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <BoldEye cx={35} cy={48} />
          <BoldEye cx={65} cy={48} />
          <path d="M32 80 Q50 65 68 80" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

// --- MAIN OVERLAY COMPONENT ---
export function EmojiReactionOverlay({ emoji, size = 'md' }: { emoji?: string | null, size?: string }) {
  const [activeEmoji, setActiveEmoji] = useState<{ id: number, type: string } | null>(null);

  useEffect(() => {
    if (emoji) {
      const newEmoji = { id: Date.now(), type: emoji };
      setActiveEmoji(newEmoji);
      const timer = setTimeout(() => setActiveEmoji(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [emoji]);

  if (!activeEmoji) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none rounded-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEmoji.id}
          className={cn("drop-shadow-2xl flex items-center justify-center", sizeClasses[size] || sizeClasses.md)}
          initial={{ scale: 0.5, opacity: 0, y: 30 }}
          animate={{ scale: 1.2, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
