'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      <radialGradient id="emojiHDGrad" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="40%" stopColor="#FFD600" />
        <stop offset="85%" stopColor="#F57C00" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>
      <radialGradient id="angerGrad" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>
      <radialGradient id="tearGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E1F5FE" />
        <stop offset="100%" stopColor="#29B6F6" />
      </radialGradient>
      <filter id="3dShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.4"/>
      </filter>
    </defs>
  );

  const FaceBase = ({ fill = "url(#emojiHDGrad)", anger = false }) => (
    <g filter="url(#3dShadow)">
      <circle cx="50" cy="50" r="47" fill={fill} stroke={anger ? "#B71C1C" : "#E65100"} strokeWidth="0.5" />
      <ellipse cx="35" cy="25" rx="15" ry="10" fill="white" fillOpacity="0.3" />
    </g>
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
    case 'giftme':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="32" cy="40" r="5" fill="#3E2723" />
          <circle cx="68" cy="40" r="5" fill="#3E2723" />
          <motion.g initial={{ y: 50 }} animate={{ y: 0 }} transition={{ type: "spring", bounce: 0.5 }}>
            <rect x="10" y="65" width="80" height="22" rx="4" fill="#D32F2F" stroke="#B71C1C" strokeWidth="1" />
            <text x="50" y="80" fontSize="8" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type === 'giftme' ? 'GIFT ME' : type.toUpperCase()}</text>
            <circle cx="15" cy="76" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.6" filter="url(#3dShadow)" />
            <circle cx="85" cy="76" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.6" filter="url(#3dShadow)" />
          </motion.g>
        </svg>
      );

    case 'shisha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 30 42 Q 40 35 50 42 M 60 42 Q 70 35 80 42" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 50 72 L 80 85" stroke="#424242" strokeWidth="3" strokeLinecap="round" fill="none" />
          <g transform="translate(75, 45) scale(0.6)">
            <rect x="0" y="30" width="15" height="45" rx="2" fill="#D32F2F" stroke="#B71C1C" />
            <circle cx="7.5" cy="30" r="10" fill="#CFD8DC" />
          </g>
          <motion.g animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
            <circle cx="78" cy="83" r="6" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.6" />
          </motion.g>
          {[1, 2, 3].map((i) => (
            <motion.circle key={i} cx="50" cy="65" r="3" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.6"
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.5, 3], y: -45 }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
            />
          ))}
        </svg>
      );

    case 'party':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <motion.path d="M 50 70 L 90 70 L 90 60 Z" fill="#FF4081" stroke="#C2185B"
            animate={{ scaleX: [1, 1.6, 1], x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}
          />
          <circle cx="55" cy="72" r="6" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.6" />
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.rect key={i} width="4" height="4" fill={i % 2 === 0 ? "#00E676" : "#FFD600"}
              initial={{ y: -10, x: 20 * i }} animate={{ y: 100, opacity: [0, 1, 0], rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            />
          ))}
          <circle cx="35" cy="45" r="5" fill="#3E2723" /><circle cx="65" cy="45" r="5" fill="#3E2723" />
        </svg>
      );

    case 'irritated':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 25 35 Q 35 32 45 38 M 55 38 Q 65 32 75 35" stroke="#3E2723" strokeWidth="3" fill="none" />
          <motion.g animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>
            <path d="M 52 55 Q 58 50 62 65" stroke="#E65100" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <circle cx="52" cy="52" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.6" />
          </motion.g>
          <circle cx="35" cy="48" r="4" fill="#3E2723" /><circle cx="65" cy="48" r="4" fill="#3E2723" />
          <circle cx="50" cy="75" r="5" fill="#3E2723" />
        </svg>
      );

    case 'hitL':
    case 'hitR':
      const isRight = type === 'hitR';
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: isRight ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase fill="url(#angerGrad)" anger />
          <motion.g animate={{ rotate: [0, 60, -20, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ originX: "50px", originY: "50px" }}>
            <rect x="80" y="20" width="22" height="14" rx="2" fill="#424242" />
            <rect x="89" y="34" width="5" height="18" rx="1" fill="#795548" />
          </motion.g>
          <circle cx="35" cy="55" r="6" fill="black" /><circle cx="65" cy="55" r="6" fill="black" />
          <path d="M 40 80 Q 50 72 60 80" stroke="black" strokeWidth="4" fill="none" />
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <motion.path d="M 25 40 Q 35 30 45 40 M 55 40 Q 65 30 75 40" stroke="#4E342E" strokeWidth="5" fill="none" animate={{ y: [-2, 2] }} transition={{ repeat: Infinity, duration: 0.2 }} />
          <motion.path d="M 30 65 Q 50 95 70 65 Z" fill="#3E2723" animate={{ scaleY: [1, 1.3] }} transition={{ repeat: Infinity, duration: 0.2 }} />
          <rect x="38" y="66" width="24" height="4" fill="white" rx="2" />
        </svg>
      );

    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="45" r="12" fill="white" stroke="#90A4AE" />
          <motion.circle cx="35" cy="45" r="4" fill="black" animate={{ x: [-3, 3] }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} />
          <circle cx="65" cy="45" r="12" fill="white" stroke="#90A4AE" />
          <motion.circle cx="65" cy="45" r="4" fill="black" animate={{ x: [-3, 3] }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} />
          <motion.path d="M 40 90 Q 50 82 60 90" stroke="#E65100" strokeWidth="6" strokeLinecap="round" animate={{ y: [-2, 2] }} transition={{ repeat: Infinity, duration: 1.5 }} />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <motion.circle cx="35" cy="55" r="4" fill="url(#tearGrad)" animate={{ y: [0, 25], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <motion.circle cx="65" cy="55" r="4" fill="url(#tearGrad)" animate={{ y: [0, 25], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.7 }} />
          <circle cx="35" cy="48" r="5" fill="black" /><circle cx="65" cy="48" r="5" fill="black" />
          <path d="M 35 78 Q 50 68 65 78" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fill="url(#angerGrad)" anger />
          <path d="M 20 30 L 45 42 M 80 30 L 55 42" stroke="black" strokeWidth="6" strokeLinecap="round" />
          <circle cx="35" cy="50" r="7" fill="white" /><circle cx="35" cy="50" r="3" fill="black" />
          <circle cx="65" cy="50" r="7" fill="white" /><circle cx="65" cy="50" r="3" fill="black" />
          <path d="M 30 80 Q 50 65 70 80" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 15 42 H 48 V 55 Q 32 60 15 55 Z M 52 42 H 85 V 55 Q 68 60 52 55 Z" fill="#212121" />
          <path d="M 30 75 Q 50 85 70 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'kissL':
    case 'kissR':
      const isKissRight = type === 'kissR';
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: isKissRight ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase />
          <motion.path d="M 45 65 C 55 62, 55 75, 45 75 C 55 75, 55 88, 45 85" stroke="#AD1457" strokeWidth="4" fill="none" animate={{ x: [0, 3] }} transition={{ repeat: Infinity, duration: 0.4 }} />
          <motion.path d="M 70 40 Q 70 30 80 30 Q 90 30 90 40 Q 90 55 70 70 Q 50 55 50 40 Q 50 30 60 30 Q 70 30 70 40" fill="#FF1744" animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2], y: [0, -30] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <circle cx="32" cy="42" r="5" fill="#3E2723" /><circle cx="68" cy="42" r="5" fill="#3E2723" />
        </svg>
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
      const timer = setTimeout(() => setActiveEmoji(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [emoji]);

  if (!activeEmoji) return null;

  const sizeClasses: Record<string, string> = { sm: 'w-24 h-24', md: 'w-36 h-36', lg: 'w-48 h-48' };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none rounded-full">
      <AnimatePresence>
        <motion.div
          key={activeEmoji.id}
          className={cn("drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-center", sizeClasses[size] || sizeClasses.md)}
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1.4, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
