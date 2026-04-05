'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- STABLE 3D EMOJI RENDERER ---
const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      <radialGradient id="emojiHDGrad" cx="45%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="60%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57C00" />
      </radialGradient>
      <linearGradient id="emojiGloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
        <stop offset="40%" stopColor="white" stopOpacity="0" />
      </linearGradient>
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

  // Re-usable BoldEye to ensure no missing eyes
  const BoldEye = ({ cx, cy, isWink = false }: { cx: number, cy: number, isWink?: boolean }) => {
    if (isWink) {
      return <path d={`M${cx-7} ${cy} Q${cx} ${cy-8} ${cx+7} ${cy}`} stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />;
    }
    return (
      <g>
        <circle cx={cx} cy={cy} r="7" fill="white" />
        <circle cx={cx} cy={cy} r="4" fill="black" />
        <circle cx={cx - 1.5} cy={cy - 1.5} r="1.5" fill="white" />
      </g>
    );
  };

  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <BoldEye cx={35} cy={42} />
          <BoldEye cx={65} cy={42} />
          <motion.g animate={{ rotate: [-3, 3, -3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <rect x="10" y="65" width="80" height="20" rx="10" fill="#F44336" />
            <text x="50" y="79" fontSize="8" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type.toUpperCase()}</text>
          </motion.g>
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M22 42 Q35 25 48 42 M52 42 Q65 25 78 42" stroke="#4E342E" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M25 60 Q50 95 75 60 Z" fill="#4E342E" />
          {/* One-by-one falling drops */}
          <motion.circle cx="15" cy="45" r="3.5" fill="#40C4FF" animate={{ y: [0, 40], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeIn" }} />
          <motion.circle cx="85" cy="45" r="3.5" fill="#40C4FF" animate={{ y: [0, 40], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeIn", delay: 0.6 }} />
        </svg>
      );

    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M25 48 Q35 38 48 48 M52 48 Q65 38 78 48" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
          <motion.path d="M30 48 V90" stroke="#03A9F4" strokeWidth="12" strokeLinecap="round" animate={{ strokeDashoffset: [0, -100] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ strokeDasharray: "100" }} />
          <motion.path d="M70 48 V90" stroke="#03A9F4" strokeWidth="12" strokeLinecap="round" animate={{ strokeDashoffset: [0, -100] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.5 }} style={{ strokeDasharray: "100" }} />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <motion.g initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", duration: 1 }}>
            <path d="M15 40 H48 V55 Q32 60 15 55 Z M52 40 H85 V55 Q68 60 52 55 Z" fill="#212121" />
            <rect x="46" y="44" width="8" height="4" fill="#212121" />
          </motion.g>
          <path d="M30 75 Q50 85 70 75" stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <BoldEye cx={32} cy={45} />
          <BoldEye cx={68} cy={45} isWink={true} />
          <motion.path d="M72 68 Q88 55 72 42 Q56 55 72 68" fill="#FF1744" animate={{ scale: [1, 1.3, 1], x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} />
          <motion.path d="M35 72 Q43 78 51 72" stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round" animate={{ scale: [1, 0.8, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} />
        </svg>
      );

    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <motion.g animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 0.45 }}>
             <path d="M12 55 Q50 5 88 55" stroke="#F44336" strokeWidth="11" fill="none" strokeLinecap="round" />
             <rect x="3" y="50" width="18" height="32" rx="8" fill="#F44336" />
             <rect x="79" y="50" width="18" height="32" rx="8" fill="#F44336" />
          </motion.g>
          <path d="M30 52 Q40 45 50 52 M50 52 Q60 45 70 52" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fill="url(#angerGrad)" />
          <motion.g animate={{ x: [-1.5, 1.5, -1.5] }} transition={{ repeat: Infinity, duration: 0.1 }}>
            <path d="M22 35 L45 45 M78 35 L55 45" stroke="black" strokeWidth="7" strokeLinecap="round" />
            <BoldEye cx={38} cy={52} />
            <BoldEye cx={62} cy={52} />
          </motion.g>
          <path d="M32 78 Q50 65 68 78" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'sad':
      return (
        <motion.svg viewBox="0 0 100 100" className="w-full h-full"
          animate={{ y: [0, 6, 0, 6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
        >
          {defs}
          <FaceBase />
          <BoldEye cx={35} cy={48} />
          <BoldEye cx={65} cy={48} />
          <path d="M32 80 Q50 65 68 80" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </motion.svg>
      );

    default: return null;
  }
};

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

  const sizeClasses: Record<string, string> = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none rounded-full">
      <AnimatePresence>
        <motion.div
          key={activeEmoji.id}
          className={cn("drop-shadow-2xl flex items-center justify-center", sizeClasses[size] || sizeClasses.md)}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1.25, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
