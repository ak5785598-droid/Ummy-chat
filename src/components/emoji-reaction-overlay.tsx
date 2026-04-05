'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- SAME PREMIUM 3D SVG LOGIC FOR CONSISTENCY ---

const Emoji3DRenderer = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      <radialGradient id="seatGradSphere" cx="40%" cy="30%" r="70%" fx="30%" fy="25%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="50%" stopColor="#FFD600" />
        <stop offset="85%" stopColor="#F57C00" />
        <stop offset="100%" stopColor="#AF4400" />
      </radialGradient>
      <linearGradient id="seatShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="30%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <filter id="faceDepth" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="blur"/>
        <feOffset dx="0" dy="0.8" result="offsetBlur"/>
        <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/>
      </filter>
      <radialGradient id="seatGradRed" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FF8A80" />
        <stop offset="70%" stopColor="#E53935" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>
    </defs>
  );

  const Face = ({ fill }: { fill: string }) => (
    <>
      <circle cx="50" cy="50" r="46" fill={fill} />
      <circle cx="50" cy="50" r="46" fill="url(#seatShine)" />
    </>
  );

  // Switch logic to match the picker IDs
  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M30 42 Q35 38 40 42 M60 42 Q65 38 70 42" stroke="#311F11" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="7" y="58" width="86" height="24" rx="12" fill={type === 'welcome' ? "#E91E63" : "#EC407A"} filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))" />
          <text x="50" y="74" fontSize="10" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'system-ui' }}>{type.toUpperCase()}</text>
        </svg>
      );
    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M20 40 L35 48 M80 40 L65 48" stroke="#311F11" strokeWidth="6" strokeLinecap="round" />
          <path d="M28 58 Q50 85 72 58 Z" fill="#311F11" filter="url(#faceDepth)" />
          <path d="M15 35 Q5 20 20 12 M85 35 Q95 20 80 12" stroke="#00E5FF" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>
      );
    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M30 42 L42 42 M58 42 L70 42" stroke="#311F11" strokeWidth="6" strokeLinecap="round" />
          <rect x="33" y="48" width="10" height="38" rx="5" fill="#00B0FF" />
          <rect x="57" y="48" width="10" height="38" rx="5" fill="#00B0FF" />
        </svg>
      );
    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M18 38 H82 V55 Q75 60 50 60 T18 55 Z" fill="#263238" filter="url(#faceDepth)" />
          <path d="M35 70 Q50 80 65 70" stroke="#311F11" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M28 42 Q36 36 43 42 M57 42 Q64 36 72 42" stroke="#311F11" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M72 65 Q85 55 72 45 Q59 55 72 65" fill="#E91E63" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.2))" />
          <path d="M45 65 Q50 69 55 65" stroke="#311F11" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradRed)" />
          <path d="M25 35 L48 48 M75 35 L52 48" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <path d="M32 75 Q50 60 68 75" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <path d="M15 50 Q50 10 85 50" stroke="#EC407A" strokeWidth="9" fill="none" strokeLinecap="round" />
          <rect x="8" y="45" width="16" height="32" rx="8" fill="#EC407A" />
          <rect x="76" y="45" width="16" height="32" rx="8" fill="#EC407A" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <Face fill="url(#seatGradSphere)" />
          <circle cx="35" cy="45" r="5" fill="#311F11" />
          <circle cx="65" cy="45" r="5" fill="#311F11" />
          <path d="M35 75 Q50 60 65 75" fill="none" stroke="#311F11" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    default:
      // Fallback for standard text emojis if any
      return <span className="text-current">{type}</span>;
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
      // emoji string picker se "welcome", "laugh" etc. aayegi
      const newEmoji = { id: Date.now(), type: emoji };
      setActiveEmoji(newEmoji);

      const timer = setTimeout(() => {
        setActiveEmoji(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [emoji]);

  if (!activeEmoji) return null;

  // Size mapping: Seat ko cover karne ke liye balanced sizes
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEmoji.id}
          className={cn(
            "drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center",
            sizeClasses[size]
          )}
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1.1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 15 
          }}
        >
          <Emoji3DRenderer type={activeEmoji.type} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
