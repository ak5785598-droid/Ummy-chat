'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingGift {
  id: number;
  emoji: string;
}

interface GiftAnimationOverlayProps {
  giftId: string | null;
  imageUrl?: string | null;
  onComplete: () => void;
  targetSeat?: number;
  recipientElement?: HTMLElement | null;
}

export function GiftAnimationOverlay({ 
  giftId, 
  imageUrl,
  onComplete, 
  targetSeat = 1,
  recipientElement = null
}: GiftAnimationOverlayProps) {
  const [activeGift, setActiveGift] = useState<(FloatingGift & { imageUrl?: string | null }) | null>(null);
  const [targetCoords, setTargetCoords] = useState({ x: 0, y: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
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

  // 3x3 Grid Layout - Each seat position with pixel coordinates
  const getSeatTarget = (seat: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: 0, y: 0 };

    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    const positions: Record<number, { x: number; y: number }> = {
      1: { x: centerX - 280, y: centerY - 280 },   // Top-left
      2: { x: centerX,       y: centerY - 280 },   // Top-center
      3: { x: centerX + 280, y: centerY - 280 },   // Top-right
      4: { x: centerX - 280, y: centerY },         // Middle-left
      5: { x: centerX,       y: centerY },         // Center
      6: { x: centerX + 280, y: centerY },         // Middle-right
      7: { x: centerX - 280, y: centerY + 280 },   // Bottom-left
      8: { x: centerX,       y: centerY + 280 },   // Bottom-center
      9: { x: centerX + 280, y: centerY + 280 },   // Bottom-right
    };

    return positions[seat] || { x: centerX, y: centerY };
  };

  // Calculate target from recipientElement or seat
  const calculateTargetCoords = useCallback(() => {
    if (recipientElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elementRect = recipientElement.getBoundingClientRect();
      
      const elementCenterX = elementRect.left + elementRect.width / 2;
      const elementCenterY = elementRect.top + elementRect.height / 2;
      
      const containerLeft = containerRect.left;
      const containerTop = containerRect.top;
      
      return {
        x: elementCenterX - containerLeft,
        y: elementCenterY - containerTop
      };
    }
    
    return getSeatTarget(targetSeat);
  }, [recipientElement, targetSeat]);

  // Recalculate coords on resize
  useEffect(() => {
    const newTargetCoords = calculateTargetCoords();
    setTargetCoords(newTargetCoords);

    const handleResize = () => {
      const updated = calculateTargetCoords();
      setTargetCoords(updated);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recipientElement, calculateTargetCoords]);

  // Animation trigger - ONE TIME ONLY per giftId
  useEffect(() => {
    if (giftId && !hasAnimated) {
      setActiveGift({
        id: Date.now(),
        emoji: getEmoji(giftId),
        imageUrl: imageUrl
      });
      setHasAnimated(true);

      // Clear animation after 1.8 seconds (increased for premium feel)
      const finishTimer = setTimeout(() => {
        setActiveGift(null);
        onComplete();
      }, 1800);

      return () => clearTimeout(finishTimer);
    }
  }, [giftId, imageUrl, getEmoji, onComplete, hasAnimated]);

  // Reset animation flag when giftId changes
  useEffect(() => {
    setHasAnimated(false);
    setActiveGift(null);
  }, [giftId]);

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
              y: 0,
              rotate: -20
            }}
            animate={{ 
              opacity: [0, 1, 1, 0.9, 0],
              scale: [0.3, 1.6, 1.8, 1.3, 0.1],
              x: [0, targetCoords.x, targetCoords.x, targetCoords.x],
              y: [0, targetCoords.y, targetCoords.y, targetCoords.y],
              rotate: [ -20, 10, 0, 0, 15 ]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 1.8,
              times: [0, 0.15, 0.7, 0.9, 1],
              ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            }}
            className="absolute will-change-transform"
          >
            <div className="relative flex items-center justify-center">
              {/* Premium Glow effect behind gift */}
              <motion.div 
                className={cn(
                  "absolute inset-0 blur-[40px] rounded-full scale-150",
                  activeGift.imageUrl ? "bg-cyan-400/40" : "bg-gradient-to-r from-yellow-400 via-orange-300 to-red-400"
                )}
                animate={{
                  opacity: [0, 0.8, 0.9, 0.5, 0],
                  scale: [1, 2, 2.2, 1.8, 1],
                  rotate: 360
                }}
                transition={{
                  duration: 1.8,
                  ease: "linear"
                }}
              />
              
              {/* Sparkle particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute text-2xl"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * 120,
                    y: Math.sin((i / 8) * Math.PI * 2) * 120,
                    opacity: 0,
                    scale: 0,
                    rotate: 180
                  }}
                  transition={{
                    duration: 1.8,
                    ease: "easeOut"
                  }}
                >
                  ✨
                </motion.div>
              ))}

              {activeGift.imageUrl ? (
                <div className="relative h-40 w-40 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]">
                  <img src={activeGift.imageUrl} alt="gift" className="h-full w-full object-contain" />
                </div>
              ) : (
                <span 
                  className="text-8xl select-none leading-none block font-bold drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]"
                >
                  {activeGift.emoji}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
