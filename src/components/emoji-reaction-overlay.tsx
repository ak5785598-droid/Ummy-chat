'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- ANIMATED 3D EMOJI RENDERER ---
const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      <radialGradient id="emojiHDGrad" cx="45%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="60%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57C00" />
      </radialGradient>
      <linearGradient id="emojiGloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.6" />
        <stop offset="50%" stopColor="white" stopOpacity="0" />
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

  switch (type) {
    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <motion.path 
            d="M22 42 Q35 25 48 42 M52 42 Q65 25 78 42" 
            stroke="#4E342E" strokeWidth="6" fill="none" strokeLinecap="round"
            animate={{ d: ["M22 42 Q35 25 48 42", "M22 40 Q35 20 48 40"] }}
            transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
          />
          <motion.path 
            d="M25 60 Q50 95 75 60 Z" fill="#4E342E"
            animate={{ scaleY: [1, 1.2] }}
            transition={{ repeat: Infinity, duration: 0.3, repeatType: "reverse" }}
          />
          {/* Animated Tears */}
          <motion.path d="M12 40 Q4 25 18 15" stroke="#40C4FF" strokeWidth="8" fill="none" strokeLinecap="round"
            animate={{ y: [0, -5, 0], x: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6 }} />
          <motion.path d="M88 40 Q96 25 82 15" stroke="#40C4FF" strokeWidth="8" fill="none" strokeLinecap="round"
            animate={{ y: [0, -5, 0], x: [2, -2, 2] }} transition={{ repeat: Infinity, duration: 0.6 }} />
        </svg>
      );

    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M25 48 Q35 38 48 48 M52 48 Q65 38 78 48" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Dropping Tears Effect */}
          <motion.path 
            d="M30 48 V92" stroke="#03A9F4" strokeWidth="12" strokeLinecap="round"
            animate={{ strokeDashoffset: [0, -100], opacity: [0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            style={{ strokeDasharray: "100" }}
          />
          <motion.path 
            d="M70 48 V92" stroke="#03A9F4" strokeWidth="12" strokeLinecap="round"
            animate={{ strokeDashoffset: [0, -100], opacity: [0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.5 }}
            style={{ strokeDasharray: "100" }}
          />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Sunglasses sliding down effect */}
          <motion.g 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <path d="M15 40 H48 V55 Q32 60 15 55 Z M52 40 H85 V55 Q68 60 52 55 Z" fill="#212121" />
            <rect x="46" y="44" width="8" height="4" fill="#212121" />
          </motion.g>
          <motion.path d="M30 75 Q50 85 70 75" stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round"
            animate={{ scaleX: [0.8, 1.1] }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} />
        </svg>
      );

    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="32" cy="45" r="7" fill="white" />
          <motion.circle cx="32" cy="45" r="4" fill="black" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}/>
          <path d="M55 45 Q65 35 75 45" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Pouting Heart Action */}
          <motion.path 
            d="M72 68 Q88 55 72 42 Q56 55 72 68" fill="#FF1744"
            animate={{ scale: [1, 1.3, 1], x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
          <motion.path 
            d="M42 70 Q48 76 54 70" stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round"
            animate={{ scale: [1, 0.8, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
          />
        </svg>
      );

    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Vibrating Headphones */}
          <motion.g animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 0.4 }}>
             <path d="M12 55 Q50 5 88 55" stroke="#F44336" strokeWidth="11" fill="none" strokeLinecap="round" />
             <rect x="3" y="50" width="18" height="32" rx="8" fill="#F44336" />
             <rect x="79" y="50" width="18" height="32" rx="8" fill="#F44336" />
          </motion.g>
          {/* Dancing Eyes */}
          <motion.path d="M32 52 Q40 45 48 52 M52 52 Q60 45 68 52" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round"
            animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fill="url(#angerGrad)" />
          <motion.g animate={{ x: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 0.1 }}>
            <path d="M22 35 L45 45 M78 35 L55 45" stroke="black" strokeWidth="7" strokeLinecap="round" />
            <circle cx="38" cy="52" r="7" fill="white" /><circle cx="38" cy="52" r="4" fill="black" />
            <circle cx="62" cy="52" r="7" fill="white" /><circle cx="62" cy="52" r="4" fill="black" />
          </motion.g>
          <path d="M32 78 Q50 65 68 78" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
};

// --- MAIN OVERLAY ---
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
    sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32'
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={activeEmoji.id}
          className={cn("drop-shadow-2xl flex items-center justify-center", sizeClasses[size] || sizeClasses.md)}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1.3, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
