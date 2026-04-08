'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* 3D Face Gradient */}
      <radialGradient id="emojiHDGrad" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="40%" stopColor="#FFD600" />
        <stop offset="85%" stopColor="#F57C00" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>
      {/* Blush Gradient for Cheeks */}
      <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF80AB" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#FF80AB" stopOpacity="0" />
      </radialGradient>
      {/* Tear Gradient */}
      <radialGradient id="tearGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E1F5FE" />
        <stop offset="100%" stopColor="#29B6F6" />
      </radialGradient>
      <filter id="3dShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.4"/>
      </filter>
    </defs>
  );

  // --- REUSABLE FACE COMPONENTS ---
  const FaceBase = ({ fill = "url(#emojiHDGrad)", hasBlush = true }) => (
    <g filter="url(#3dShadow)">
      <circle cx="50" cy="50" r="47" fill={fill} stroke="#E65100" strokeWidth="0.5" />
      <ellipse cx="35" cy="25" rx="15" ry="10" fill="white" fillOpacity="0.3" />
      {hasBlush && (
        <>
          <circle cx="22" cy="62" r="10" fill="url(#blushGrad)" />
          <circle cx="78" cy="62" r="10" fill="url(#blushGrad)" />
        </>
      )}
    </g>
  );

  const Eyes = ({ variant = "normal" }) => (
    <g>
      <circle cx="32" cy="42" r="6" fill="white" />
      <circle cx="68" cy="42" r="6" fill="white" />
      <motion.circle cx="32" cy="43" r="3" fill="#3E2723" animate={variant === 'thinking' ? { x: [-2, 2] } : {}} transition={{ repeat: Infinity, duration: 1 }} />
      <motion.circle cx="68" cy="43" r="3" fill="#3E2723" animate={variant === 'thinking' ? { x: [-2, 2] } : {}} transition={{ repeat: Infinity, duration: 1 }} />
    </g>
  );

  const Nose = () => <path d="M 47 52 Q 50 48 53 52" stroke="#D84315" strokeWidth="1.5" fill="none" strokeLinecap="round" />;

  switch (type) {
    case 'welcome':
    case 'thanks':
    case 'giftme':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <Eyes />
          <Nose />
          <path d="M 38 62 Q 50 72 62 62" stroke="#3E2723" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <motion.g initial={{ y: 30 }} animate={{ y: 0 }} transition={{ type: "spring", bounce: 0.4 }}>
            <rect x="10" y="72" width="80" height="20" rx="5" fill="#D32F2F" filter="url(#3dShadow)" />
            <text x="50" y="85" fontSize="8" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type === 'giftme' ? 'GIFT ME' : type.toUpperCase()}</text>
            <circle cx="10" cy="82" r="8" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="1" />
            <circle cx="90" cy="82" r="8" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="1" />
          </motion.g>
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 25 40 Q 35 30 45 40 M 55 40 Q 65 30 75 40" stroke="#3E2723" strokeWidth="4" fill="none" />
          <Nose />
          <motion.g animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 0.2 }}>
            <path d="M 30 65 Q 50 95 70 65 Z" fill="#3E2723" />
            <rect x="35" y="65" width="30" height="6" fill="white" rx="1" />
          </motion.g>
        </svg>
      );

    case 'party':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <Eyes />
          <Nose />
          <motion.g transform="translate(50, 70)" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
             <path d="M 0 0 L 35 10 L 35 -10 Z" fill="#FF4081" stroke="#C2185B" strokeWidth="1" />
          </motion.g>
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.circle key={i} r="2.5" fill={i % 2 === 0 ? "#FFEB3B" : "#00E676"}
              initial={{ x: 15 * i, y: -10 }} animate={{ y: 110, rotate: 360, opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }} />
          ))}
        </svg>
      );

    case 'shisha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <Eyes />
          <Nose />
          <motion.g animate={{ x: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <path d="M 50 75 L 85 95" stroke="#424242" strokeWidth="5" strokeLinecap="round" />
            <rect x="80" y="88" width="15" height="15" rx="3" fill="#D32F2F" />
          </motion.g>
          <motion.circle cx="50" cy="72" r="6" fill="#3E2723" animate={{ scale: [0.7, 1.3, 0.7] }} transition={{ repeat: Infinity, duration: 3 }} />
          {[1, 2, 3].map((i) => (
            <motion.circle key={i} cx="50" cy="60" r="8" fill="#FFFFFF" fillOpacity="0.9"
              animate={{ y: -70, opacity: [0, 1, 0], scale: [1, 4] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.8 }} />
          ))}
        </svg>
      );

    case 'irritated':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <Eyes />
          <Nose />
          <motion.g animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>
            <rect x="48" y="52" width="4" height="25" rx="2" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
            <circle cx="50" cy="52" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" />
          </motion.g>
          <path d="M 40 85 Q 50 78 60 85" stroke="#3E2723" strokeWidth="2" fill="none" />
        </svg>
      );

    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <Eyes variant="thinking" />
          <Nose />
          <path d="M 40 75 Q 50 82 60 75" stroke="#3E2723" strokeWidth="3" fill="none" />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fill="url(#emojiHDGrad)" />
          <motion.path d="M 20 30 L 42 40 M 80 30 L 58 40" stroke="black" strokeWidth="5" animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 0.3 }} />
          <circle cx="32" cy="50" r="7" fill="white" /><circle cx="32" cy="50" r="4" fill="black" />
          <circle cx="68" cy="50" r="7" fill="white" /><circle cx="68" cy="50" r="4" fill="black" />
          <path d="M 30 85 Q 50 65 70 85" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="32" cy="45" r="8" fill="#E1F5FE" stroke="#0288D1" strokeWidth="0.5" />
          <circle cx="68" cy="45" r="8" fill="#E1F5FE" stroke="#0288D1" strokeWidth="0.5" />
          <motion.circle cx="32" cy="55" r="4" fill="url(#tearGrad)" animate={{ y: 30, opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.circle cx="68" cy="55" r="4" fill="url(#tearGrad)" animate={{ y: 30, opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
          <Nose />
          <path d="M 30 85 Q 50 70 70 85" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <Nose />
          <motion.g animate={{ y: [-30, 10, -30] }} transition={{ duration: 4, repeat: Infinity }}>
            <rect x="12" y="35" width="35" height="18" rx="4" fill="#212121" />
            <rect x="53" y="35" width="35" height="18" rx="4" fill="#212121" />
            <path d="M 47 44 H 53" stroke="#212121" strokeWidth="3" />
          </motion.g>
          <path d="M 35 75 Q 50 88 65 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'kissL':
    case 'kissR':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: type === 'kissR' ? 'scaleX(-1)' : '' }}>
          {defs}
          <FaceBase />
          <path d="M 28 42 Q 32 37 36 42" stroke="#3E2723" strokeWidth="2.5" fill="none" />
          <circle cx="68" cy="42" r="5" fill="#3E2723" />
          <Nose />
          <motion.path d="M 45 75 Q 55 65 55 75 Q 55 85 45 75" fill="#AD1457" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} />
          <motion.path d="M 75 45 Q 75 35 85 35 Q 95 35 95 45 Q 95 60 75 75 Q 55 60 55 45 Q 55 35 65 35 Q 75 35 75 45" 
            fill="#FF1744" animate={{ opacity: [0, 1, 0], y: -50, scale: [0.5, 1.8] }} transition={{ repeat: Infinity, duration: 1.5 }} />
        </svg>
      );

    case 'hitL':
    case 'hitR':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: type === 'hitR' ? 'scaleX(-1)' : '' }}>
          {defs}
          <FaceBase />
          <Eyes />
          <Nose />
          <motion.g animate={{ rotate: [0, -80, 0] }} transition={{ duration: 0.4, repeat: Infinity }} style={{ originX: "100px", originY: "50px" }}>
            <rect x="100" y="10" width="28" height="18" fill="#546E7A" rx="3" filter="url(#3dShadow)" />
            <rect x="112" y="28" width="5" height="35" fill="#5D4037" />
            <circle cx="115" cy="65" r="9" fill="url(#emojiHDGrad)" stroke="#E65100" />
          </motion.g>
          <path d="M 40 78 Q 50 85 60 78" stroke="black" strokeWidth="3" fill="none" />
        </svg>
      );

    default: return null;
  }
};

export function EmojiReactionOverlay({ emoji, size = 'md' }: { emoji?: string | null, size?: string }) {
  const [activeEmoji, setActiveEmoji] = useState<{ id: number, type: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (emoji) {
      if (timerRef.current) clearTimeout(timerRef.current);
      const newEmoji = { id: Date.now(), type: emoji };
      setActiveEmoji(newEmoji);
      timerRef.current = setTimeout(() => setActiveEmoji(null), 3500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [emoji]);

  if (!activeEmoji) return null;
  const sizeClasses: Record<string, string> = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEmoji.id}
          className={cn("drop-shadow-2xl", sizeClasses[size] || sizeClasses.md)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.3, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
