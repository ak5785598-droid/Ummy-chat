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
      // Clear existing and trigger new animation cycle
      setActiveGift(null); 
      
      const triggerTimer = setTimeout(() => {
        setActiveGift({
          id: Date.now(),
          emoji: getEmoji(giftId),
        });
      }, 50);

      // Duration is 1.2s for flight, we wait 1.5s total before clearing
      const finishTimer = setTimeout(() => {
        setActiveGift(null);
        onComplete();
      }, 1600);

      return () => {
        clearTimeout(triggerTimer);
        clearTimeout(finishTimer);
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
              scale: 0.2, 
              x: '0vw', 
              y: '45vh' // Start from the gift button area
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.8, 2.2, 0], // Scale up during flight, pop at target, then shrink
              x: [ '0vw', targetCoords.x, targetCoords.x ],
              y: [ '45vh', targetCoords.y, targetCoords.y ],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 1.4, 
              times: [0, 0.2, 0.8, 1], // Timing for the stages (appear, flight, pop, fade)
              ease: "circOut"
            }}
            className="absolute"
          >
            <div className="relative">
              {/* Glow effect behind emoji */}
              <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full scale-150 animate-pulse" />
              <span 
                className="text-7xl select-none leading-none block"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,1))'
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
