'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* Realistic 3D Gold Gradient for Face */}
      <radialGradient id="emojiHDGrad" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="40%" stopColor="#FFD600" />
        <stop offset="85%" stopColor="#F57C00" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>
      {/* Anger Red Gradient */}
      <radialGradient id="angerGrad" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>
      {/* Blush/Pink Gradient */}
      <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF80AB" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#FF80AB" stopOpacity="0" />
      </radialGradient>
      <filter id="3dShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.4"/>
      </filter>
    </defs>
  );

  const FaceBase = ({ fill = "url(#emojiHDGrad)", anger = false, hasBlush = true }) => (
    <g filter="url(#3dShadow)">
      <circle cx="50" cy="50" r="47" fill={fill} stroke={anger ? "#B71C1C" : "#E65100"} strokeWidth="0.5" />
      {/* Highlight for 3D effect */}
      <ellipse cx="35" cy="25" rx="15" ry="10" fill="white" fillOpacity="0.3" />
      {/* Blush on Cheeks */}
      {hasBlush && (
        <>
          <circle cx="25" cy="60" r="8" fill="url(#blushGrad)" />
          <circle cx="75" cy="60" r="8" fill="url(#blushGrad)" />
        </>
      )}
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
          <path d="M 35 55 Q 50 65 65 55" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Hands holding the banner */}
          <motion.g initial={{ y: 50 }} animate={{ y: 0 }} transition={{ type: "spring", bounce: 0.5 }}>
            <rect x="10" y="65" width="80" height="22" rx="4" fill="#D32F2F" stroke="#B71C1C" strokeWidth="1" />
            <text x="50" y="80" fontSize="8" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type === 'giftme' ? 'GIFT ME' : type.toUpperCase()}</text>
            <circle cx="15" cy="76" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.6" />
            <circle cx="85" cy="76" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.6" />
          </motion.g>
        </svg>
      );

    case 'shisha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="40" r="5" fill="#3E2723" /><circle cx="65" cy="40" r="5" fill="#3E2723" />
          {/* Shisha Pipe Animation: Moving to mouth and away */}
          <motion.g 
            animate={{ x: [0, -15, 0], y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <path d="M 50 75 L 80 90" stroke="#424242" strokeWidth="4" strokeLinecap="round" />
            <circle cx="82" cy="92" r="6" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.8" />
          </motion.g>
          {/* Dark White Smoke */}
          {[1, 2, 3].map((i) => (
            <motion.circle key={i} cx="50" cy="65" r="5" fill="#F5F5F5" fillOpacity="0.9"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [1, 4], y: -50 }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.7 }}
            />
          ))}
        </svg>
      );

    case 'party':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="45" r="5" fill="#3E2723" /><circle cx="65" cy="45" r="5" fill="#3E2723" />
          {/* Party Horn (Baja) */}
          <motion.path d="M 50 70 L 85 75 L 85 65 Z" fill="#FF4081" stroke="#C2185B"
            animate={{ scaleX: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
          />
          {/* Sprinkles (Confetti) */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.rect key={i} width="4" height="4" fill={i % 2 === 0 ? "#00E676" : "#FFD600"}
              initial={{ y: -10, x: 15 * i }} animate={{ y: 100, opacity: [0, 1, 0], rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            />
          ))}
        </svg>
      );

    case 'irritated':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 25 35 Q 35 30 45 35 M 55 35 Q 65 30 75 35" stroke="#3E2723" strokeWidth="3" fill="none" />
          <circle cx="35" cy="48" r="4" fill="#3E2723" /><circle cx="65" cy="48" r="4" fill="#3E2723" />
          {/* Finger in Nose Action */}
          <motion.g animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
             <rect x="48" y="55" width="4" height="15" rx="2" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
             <circle cx="50" cy="55" r="5" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="0.5" />
          </motion.g>
          <path d="M 45 75 Q 50 70 55 75" stroke="#3E2723" strokeWidth="2" fill="none" />
        </svg>
      );

    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase hasBlush={true} />
          <circle cx="35" cy="45" r="10" fill="white" stroke="#90A4AE" />
          <motion.circle cx="35" cy="45" r="4" fill="black" animate={{ x: [-2, 2] }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} />
          <circle cx="65" cy="45" r="10" fill="white" stroke="#90A4AE" />
          <motion.circle cx="65" cy="45" r="4" fill="black" animate={{ x: [-2, 2] }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }} />
          <path d="M 40 80 Q 50 75 60 80" stroke="#3E2723" strokeWidth="3" fill="none" />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase hasBlush={true} />
          {/* Sad Brows */}
          <path d="M 25 35 Q 35 30 40 40 M 75 35 Q 65 30 60 40" stroke="#3E2723" strokeWidth="2" fill="none" />
          {/* Eyes full of tears */}
          <circle cx="35" cy="50" r="7" fill="#B3E5FC" stroke="#0288D1" />
          <circle cx="65" cy="50" r="7" fill="#B3E5FC" stroke="#0288D1" />
          <motion.circle cx="35" cy="55" r="4" fill="#0288D1" animate={{ y: [0, 30], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
          {/* Drooping Mouth */}
          <path d="M 35 80 Q 50 70 65 80" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fill="url(#angerGrad)" anger hasBlush={false} />
          <motion.path d="M 20 30 L 45 42 M 80 30 L 55 42" stroke="black" strokeWidth="6" strokeLinecap="round" animate={{ y: [-2, 2] }} transition={{ repeat: Infinity, duration: 0.3 }} />
          <circle cx="35" cy="55" r="6" fill="black" /><circle cx="65" cy="55" r="6" fill="black" />
          <path d="M 30 85 Q 50 65 70 85" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Animated Sunglasses */}
          <motion.g animate={{ y: [-15, 0, -15] }} transition={{ duration: 3, repeat: Infinity }}>
            <rect x="15" y="40" width="33" height="15" rx="2" fill="#212121" />
            <rect x="52" y="40" width="33" height="15" rx="2" fill="#212121" />
            <path d="M 48 47 H 52" stroke="#212121" strokeWidth="2" />
          </motion.g>
          <path d="M 35 75 Q 50 85 65 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'hitL':
    case 'hitR':
      const isRight = type === 'hitR';
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: isRight ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase />
          {/* Hammer hitting next to him */}
          <motion.g animate={{ rotate: [0, -60, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ originX: "100px", originY: "50px" }}>
            <rect x="100" y="20" width="20" height="30" fill="#424242" rx="2" />
            <rect x="108" y="50" width="5" height="25" fill="#795548" />
            <circle cx="110" cy="75" r="7" fill="url(#emojiHDGrad)" stroke="#E65100" strokeWidth="1" />
          </motion.g>
          <circle cx="35" cy="45" r="5" fill="black" /><circle cx="65" cy="45" r="5" fill="black" />
          <path d="M 40 75 Q 50 65 60 75" stroke="black" strokeWidth="3" fill="none" />
        </svg>
      );

    case 'kissL':
    case 'kissR':
      const isKissRight = type === 'kissR';
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: isKissRight ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase />
          {/* Kiss Mouth */}
          <motion.path d="M 45 70 Q 55 60 55 70 Q 55 80 45 70" fill="#AD1457" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.4 }} />
          {/* Flying Heart */}
          <motion.path d="M 70 40 Q 70 30 80 30 Q 90 30 90 40 Q 90 55 70 70 Q 50 55 50 40 Q 50 30 60 30 Q 70 30 70 40" 
            fill="#FF1744" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5], x: 20, y: -40 }} transition={{ repeat: Infinity, duration: 1.5 }} 
          />
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 25 40 Q 35 30 45 40 M 55 40 Q 65 30 75 40" stroke="#4E342E" strokeWidth="4" fill="none" />
          <motion.path d="M 30 65 Q 50 95 70 65 Z" fill="#3E2723" animate={{ scaleY: [1, 1.2] }} transition={{ repeat: Infinity, duration: 0.2 }} />
          <rect x="35" y="65" width="30" height="5" fill="white" rx="1" />
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
    } else {
      setActiveEmoji(null);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [emoji]);

  if (!activeEmoji) return null;
  const sizeClasses: Record<string, string> = { sm: 'w-24 h-24', md: 'w-40 h-40', lg: 'w-56 h-56' };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEmoji.id}
          className={cn("drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]", sizeClasses[size] || sizeClasses.md)}
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1.5, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
