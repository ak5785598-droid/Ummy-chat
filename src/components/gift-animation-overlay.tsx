'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingGift {
  id: number;
  emoji: string;
}

interface GiftAnimationOverlayProps {
  giftId: string | null;
  onComplete: () => void;
  targetSeat?: number;
  recipientElement?: HTMLElement | null; // Profile/avatar element to target
}

export function GiftAnimationOverlay({ 
  giftId, 
  onComplete, 
  targetSeat = 1,
  recipientElement = null
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<FloatingGift | null>(null);
  const [targetCoords, setTargetCoords] = useState({ x: '0vw', y: '0vh' });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate target position from recipient element or use seat-based position
  const calculateTargetCoords = useCallback(() => {
    if (recipientElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elementRect = recipientElement.getBoundingClientRect();
      
      // Calculate center of the element relative to container
      const centerX = elementRect.left + elementRect.width / 2;
      const centerY = elementRect.top + elementRect.height / 2;
      
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;
      
      // Convert to viewport-relative coordinates
      const relativeX = ((centerX - containerCenterX) / containerRect.width) * 100;
      const relativeY = ((centerY - containerCenterY) / containerRect.height) * 100;
      
      return {
        x: `${relativeX}vw`,
        y: `${relativeY}vh`
      };
    }
    
    // Fallback to seat-based positioning
    return getSeatTarget(targetSeat);
  }, [recipientElement, targetSeat]);

  useEffect(() => {
    // Recalculate target coords when recipientElement changes or on mount
    const newTargetCoords = calculateTargetCoords();
    setTargetCoords(newTargetCoords);

    // Listen for window resize to update target position
    const handleResize = () => {
      const updated = calculateTargetCoords();
      setTargetCoords(updated);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recipientElement, calculateTargetCoords]);

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

      // Smooth animation duration: 1.6s for flight
      const finishTimer = setTimeout(() => {
        setActiveGift(null);
        onComplete();
      }, 1650);

      return () => {
        clearTimeout(triggerTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [giftId, getEmoji, onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {activeGift && (
          <motion.div
            key={activeGift.id}
            initial={{ 
              opacity: 0, 
              scale: 0.3, 
              x: 0, 
              y: 0
            }}
            animate={{ 
              opacity: [0, 1, 1, 0.9, 0],
              scale: [0.3, 1.5, 1.8, 1.2, 0.1],
              x: [0, targetCoords.x, targetCoords.x, targetCoords.x],
              y: [0, targetCoords.y, targetCoords.y, targetCoords.y],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 1.6,
              times: [0, 0.1, 0.7, 0.9, 1],
              ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            }}
            className="absolute will-change-transform"
          >
            <div className="relative">
              {/* Glow effect behind emoji */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-300 to-red-400 blur-3xl rounded-full scale-150"
                animate={{
                  opacity: [0.6, 0.8, 0.4],
                  scale: [1.5, 1.8, 1.2]
                }}
                transition={{
                  duration: 1.6,
                  times: [0, 0.5, 1],
                  ease: "easeInOut"
                }}
              />
              
              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute text-lg"
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1
                  }}
                  animate={{
                    x: Math.cos((i / 6) * Math.PI * 2) * 80,
                    y: Math.sin((i / 6) * Math.PI * 2) * 80,
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{
                    duration: 1.6,
                    ease: "easeOut"
                  }}
                >
                  ✨
                </motion.div>
              ))}

              <span 
                className="text-7xl select-none leading-none block font-bold drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]"
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
