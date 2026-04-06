'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- ULTRA HD 3D EMOJI RENDERER WITH DYNAMIC ACTIONS ---
const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      <radialGradient id="emojiHDGrad" cx="45%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="60%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57C00" />
      </radialGradient>
      <radialGradient id="angerGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  );

  const FaceBase = ({ fill = "url(#emojiHDGrad)", anger = false }) => (
    <circle cx="50" cy="50" r="47" fill={fill} stroke={anger ? "#B71C1C" : "#E65100"} strokeWidth="0.5" />
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="40" r="6" fill="#3E2723" />
          <circle cx="65" cy="40" r="6" fill="#3E2723" />
          <path d="M 40 52 Q 50 60 60 52" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Banner held by two hands */}
          <motion.g animate={{ y: [40, 0], scale: [0.5, 1] }} transition={{ duration: 0.5, type: "spring" }}>
            <rect x="10" y="62" width="80" height="22" rx="6" fill="#D32F2F" />
            <text x="50" y="77" fontSize="8" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type.toUpperCase()}</text>
            <circle cx="12" cy="73" r="6" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
            <circle cx="88" cy="73" r="6" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
          </motion.g>
        </svg>
      );

    case 'hitL':
    case 'hitR':
      const isRight = type === 'hitR';
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: isRight ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase fill="url(#angerGrad)" anger />
          <path d="M 25 35 L 42 42 M 75 35 L 58 42" stroke="black" strokeWidth="4" strokeLinecap="round" />
          <circle cx="38" cy="50" r="5" fill="black" />
          <circle cx="62" cy="50" r="5" fill="black" />
          {/* Hammer Action: Hits 2 times */}
          <motion.g 
            initial={{ rotate: -40, x: 60, y: 0 }}
            animate={{ rotate: [-40, 20, -40, 20, -40], x: [60, 45, 60, 45, 60] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <rect x="10" y="0" width="22" height="15" rx="3" fill="#424242" />
            <rect x="18" y="15" width="6" height="20" rx="2" fill="#795548" />
          </motion.g>
          <path d="M 40 75 Q 50 68 60 75" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'kissL':
    case 'kissR':
      const isKissRight = type === 'kissR';
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: isKissRight ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase />
          <circle cx="32" cy="42" r="5" fill="#3E2723" />
          <circle cx="68" cy="42" r="5" fill="#3E2723" />
          {/* Pout Animation */}
          <motion.path 
            d="M 45 65 C 55 62, 55 75, 45 75 C 55 75, 55 88, 45 85" 
            stroke="#AD1457" strokeWidth="4" fill="none" strokeLinecap="round"
            animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}
          />
          {/* Floating Heart */}
          <motion.path 
            d="M 70 40 Q 70 30 80 30 Q 90 30 90 40 Q 90 55 70 70 Q 50 55 50 40 Q 50 30 60 30 Q 70 30 70 40" 
            fill="#FF1744"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8], x: [0, 20], y: [0, -30] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </svg>
      );

    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="45" r="12" fill="white" stroke="#90A4AE" strokeWidth="2" />
          <circle cx="65" cy="45" r="12" fill="white" stroke="#90A4AE" strokeWidth="2" />
          {/* Hypnotic Swirling Eyes */}
          <motion.path 
            d="M 35 45 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0" 
            stroke="black" strokeWidth="2" fill="none" 
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ originX: "35px", originY: "45px", strokeDasharray: "4,4" }}
          />
          <motion.path 
            d="M 65 45 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0" 
            stroke="black" strokeWidth="2" fill="none" 
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ originX: "65px", originY: "45px", strokeDasharray: "4,4" }}
          />
          <path d="M 45 75 Q 50 70 55 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <motion.path 
            d="M 25 40 Q 35 30 45 40 M 55 40 Q 65 30 75 40" 
            stroke="#4E342E" strokeWidth="5" fill="none" strokeLinecap="round"
            animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.3 }}
          />
          <motion.path 
            d="M 30 60 Q 50 90 70 60 Z" fill="#3E2723" 
            animate={{ scaleY: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.3 }}
          />
          <rect x="38" y="61" width="24" height="6" fill="white" rx="2" />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="45" r="5" fill="black" />
          <circle cx="65" cy="45" r="5" fill="black" />
          <path d="M 40 75 Q 50 65 60 75" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Falling Tears */}
          <motion.circle cx="35" cy="52" r="3" fill="#29B6F6" animate={{ y: [0, 30], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} />
          <motion.circle cx="65" cy="52" r="3" fill="#29B6F6" animate={{ y: [0, 30], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }} />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Sunglasses moving Up and Down */}
          <motion.g animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <path d="M 15 42 H 48 V 55 Q 32 60 15 55 Z M 52 42 H 85 V 55 Q 68 60 52 55 Z" fill="#212121" />
            <rect x="46" y="45" width="8" height="4" fill="#212121" />
          </motion.g>
          <path d="M 30 75 Q 50 85 70 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fill="url(#angerGrad)" anger />
          <motion.g animate={{ x: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 0.1 }}>
            <path d="M 20 30 L 45 42 M 80 30 L 55 42" stroke="black" strokeWidth="6" strokeLinecap="round" />
            <circle cx="35" cy="50" r="7" fill="white" /><circle cx="35" cy="50" r="3" fill="black" />
            <circle cx="65" cy="50" r="7" fill="white" /><circle cx="65" cy="50" r="3" fill="black" />
          </motion.g>
          <path d="M 30 80 Q 50 65 70 80" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
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
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1.3, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
                    }
