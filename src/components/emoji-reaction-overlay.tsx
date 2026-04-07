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
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  const FaceBase = ({ fill = "url(#emojiHDGrad)", anger = false }) => (
    <g>
      <circle cx="50" cy="50" r="47" fill={fill} stroke={anger ? "#B71C1C" : "#E65100"} strokeWidth="0.5" />
      {/* 3D Highlight Shine */}
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
          {/* Banner with hands holding it */}
          <motion.g 
            animate={{ y: [45, 0], scale: [0.8, 1] }} 
            transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
          >
            <rect x="10" y="65" width="80" height="22" rx="4" fill="#D32F2F" stroke="#B71C1C" strokeWidth="1" />
            <text x="50" y="80" fontSize="8" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>
              {type === 'giftme' ? 'GIFT ME' : type.toUpperCase()}
            </text>
            {/* Hands on Banner */}
            <circle cx="15" cy="76" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
            <circle cx="85" cy="76" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
          </motion.g>
        </svg>
      );

    case 'shisha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 30 45 Q 40 38 50 45 M 60 45 Q 70 38 80 45" stroke="#3E2723" strokeWidth="3" fill="none" />
          {/* Smoke Rings Animation */}
          {[1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              cx="50" cy="65" r="4"
              fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.6"
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 2.5], y: -40, x: i % 2 === 0 ? 5 : -5 }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
            />
          ))}
          {/* Shisha Pipe in Mouth */}
          <path d="M 50 70 L 80 85" stroke="#424242" strokeWidth="3" strokeLinecap="round" />
          <rect x="75" y="80" width="12" height="6" rx="1" fill="#D32F2F" />
          <circle cx="50" cy="70" r="5" fill="#3E2723" />
        </svg>
      );

    case 'party':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Party Horn Fold/Unfold */}
          <motion.path 
            d="M 50 65 L 85 65 L 85 55 Z" 
            fill="#FF4081" stroke="#C2185B" 
            animate={{ scaleX: [1, 1.5, 1], x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
          {/* Falling Confetti / Sprinkles */}
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.rect
              key={i} width="4" height="4"
              fill={i % 2 === 0 ? "#00E676" : "#FFD600"}
              initial={{ y: -10, x: 20 * i, opacity: 0 }}
              animate={{ y: 100, opacity: [0, 1, 0], rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            />
          ))}
          <circle cx="35" cy="45" r="5" fill="#3E2723" />
          <circle cx="65" cy="45" r="5" fill="#3E2723" />
        </svg>
      );

    case 'irritated':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 25 35 Q 35 32 45 38 M 55 38 Q 65 32 75 35" stroke="#3E2723" strokeWidth="3" fill="none" />
          <circle cx="35" cy="48" r="4" fill="#3E2723" />
          <circle cx="65" cy="48" r="4" fill="#3E2723" />
          {/* Finger in Nose Animation */}
          <motion.g 
            animate={{ y: [0, -3, 0], x: [0, 2, 0] }} 
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <path d="M 52 55 Q 58 50 64 65" stroke="#E65100" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="52" cy="52" r="6" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
          </motion.g>
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
          <path d="M 25 35 L 42 42 M 75 35 L 58 42" stroke="black" strokeWidth="4" />
          {/* Swinging Hammer hitting neighbors side */}
          <motion.g 
            animate={{ rotate: [0, 45, -20, 0], x: [0, 15, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ originX: "50px", originY: "50px" }}
          >
            <rect x="80" y="20" width="20" height="12" rx="2" fill="#424242" />
            <rect x="88" y="32" width="5" height="15" rx="1" fill="#795548" />
          </motion.g>
          <circle cx="35" cy="55" r="6" fill="black" />
          <circle cx="65" cy="55" r="6" fill="black" />
          <path d="M 40 80 Q 50 72 60 80" stroke="black" strokeWidth="4" fill="none" />
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
          <path d="M 45 80 Q 50 75 55 80" stroke="#3E2723" strokeWidth="3" fill="none" />
          <motion.path d="M 40 90 Q 50 82 60 90" stroke="#E65100" strokeWidth="6" strokeLinecap="round" animate={{ y: [-2, 2] }} transition={{ repeat: Infinity, duration: 1.5 }} />
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

  const sizeClasses: Record<string, string> = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={activeEmoji.id}
          className={cn("drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]", sizeClasses[size] || sizeClasses.md)}
          initial={{ scale: 0, y: 50, rotate: -20 }}
          animate={{ scale: 1.4, y: 0, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
