'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingGift {
  id: number;
  emoji: string;
}

interface GiftAnimationOverlayProps {
  giftId: string | null;
  onComplete: () => void;
  targetSeat?: number; 
}

export function GiftAnimationOverlay({ 
  giftId, 
  onComplete, 
  targetSeat = 1 
}: GiftAnimationOverlayProps) {
  // Array ki jagah single object rakha hai taaki ek baar mein ek hi dikhe
  const [activeGift, setActiveGift] = useState<FloatingGift | null>(null);

  const getEmoji = useCallback((id: string) => {
    const map: Record<string, string> = {
      'heart': '❤️', 'cake': '🍰', 'lollipop': '🍭', 'popcorn': '🍿', 
      'donut': '🍩', 'rose': '🌹', 'chai': '☕', 'applaud': '👏',
      'chocolate-box': '🍫', 'ice-cream': '🍦', 'teddy-bear': '🧸',
      'diamond': '💎', 'trophy': '🏆'
    };
    const normalizedId = id.toLowerCase().replace('_anim', '');
    return map[normalizedId] || '🎁';
  }, []);

  const getSeatTarget = (seat: number) => {
    const positions: Record<number, { x: string; y: string }> = {
      1: { x: '0vw',   y: '-30vh' }, 
      2: { x: '-35vw', y: '-15vh' },
      3: { x: '-15vw', y: '-15vh' },
      4: { x: '15vw',  y: '-15vh' },
      5: { x: '35vw',  y: '-15vh' },
      6: { x: '-35vw', y: '10vh'  },
      7: { x: '-15vw', y: '10vh'  },
      8: { x: '15vw',  y: '10vh'  },
      9: { x: '35vw',  y: '10vh'  },
    };
    return positions[seat] || { x: '0vw', y: '0vh' };
  };

  const targetCoords = getSeatTarget(targetSeat);

  useEffect(() => {
    if (giftId) {
      // Naya gift set karne se pehle state reset (Single Icon Logic)
      setActiveGift(null); 
      
      const timerId = setTimeout(() => {
        setActiveGift({
          id: Date.now(),
          emoji: getEmoji(giftId),
        });
      }, 10);

      // 1.8 seconds mein icon gayab aur parent ko notification
      const completeTimer = setTimeout(() => {
        setActiveGift(null);
        onComplete();
      }, 1800);

      return () => {
        clearTimeout(timerId);
        clearTimeout(completeTimer);
      };
    }
  }, [giftId, getEmoji, onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {activeGift && (
          <motion.div
            key={activeGift.id}
            initial={{ 
              opacity: 0, 
              scale: 0.5, 
              x: '0vw', 
              y: '40vh' // Screen ke kaafi niche se start
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], // Smoothly aayega aur upar jaake fade out
              scale: [0.8, 1.5, 1.2], // Thoda pop effect
              x: targetCoords.x,
              y: targetCoords.y,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              duration: 1.5, 
              ease: [0.23, 1, 0.32, 1] // Custom cubic-bezier for smooth "fly" feel
            }}
            className="absolute"
          >
            <div className="relative">
              <span 
                className="text-7xl select-none"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.9))'
                }}
              >
                {activeGift.emoji}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
