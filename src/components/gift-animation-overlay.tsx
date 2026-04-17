'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Har ek single floating icon ke liye interface
interface FloatingGift {
  id: number;
  emoji: string;
  xOffset: number; // Random horizontal movement ke liye
}

interface GiftAnimationOverlayProps {
  giftId: string | null;
  onComplete: () => void;
  targetSeat?: number; // 1 to 9 seat number
}

export function GiftAnimationOverlay({ 
  giftId, 
  onComplete, 
  targetSeat = 1 
}: GiftAnimationOverlayProps) {
  // Ab yahan ek time par bas ek hi gift aayega list mein
  const [activeGifts, setActiveGifts] = useState<FloatingGift[]>([]);

  // 1. EMOJI MAP (Isme saare names mapped hain)
  const getEmoji = useCallback((id: string) => {
    const map: Record<string, string> = {
      'heart': '❤️', 'cake': '🍰', 'lollipop': '🍭', 'popcorn': '🍿', 
      'donut': '🍩', 'rose': '🌹', 'chai': '☕', 'applaud': '👏',
      'chocolate-box': '🍫', 'ice-cream': '🍦', 'teddy-bear': '🧸',
      'diamond': '🎳', 'trophy': '🎸'
    };
    
    // Normalize id: remove '_anim' suffix if present
    const normalizedId = id.toLowerCase().replace('_anim', '');
    
    return map[normalizedId] || id || '🎁';
  }, []);

  // 2. SEAT POSITION LOGIC
  const getSeatTarget = (seat: number) => {
    const positions: Record<number, { x: string; y: string }> = {
      1: { x: '0vw',   y: '-28vh' }, 
      2: { x: '-35vw', y: '-15vh' },
      3: { x: '-15vw', y: '-15vh' },
      4: { x: '15vw',  y: '-15vh' },
      5: { x: '35vw',  y: '-15vh' },
      6: { x: '-35vw', y: '5vh'   },
      7: { x: '-15vw', y: '5vh'   },
      8: { x: '15vw',  y: '5vh'   },
      9: { x: '35vw',  y: '5vh'   },
    };
    return positions[seat] || { x: '0vw', y: '0vh' };
  };

  const targetCoords = getSeatTarget(targetSeat);

  // 3. JAB BHI NAYA GIFT AAYE (Trigger)
  useEffect(() => {
    if (giftId) {
      const newGift: FloatingGift = {
        id: Date.now() + Math.random(), // Unique ID for Framer Motion
        emoji: getEmoji(giftId),
        xOffset: (Math.random() - 0.5) * 40, // Random drift left/right (-20 to 20)
      };

      // YAHAN CHANGE KIYA HAI: Purane gifts hatayenge, sirf ek latest gift set karenge
      setActiveGifts([newGift]);

      // 2 seconds baad screen clear kar do
      const timer = setTimeout(() => {
        setActiveGifts([]); // Array ko empty kar diya taaki gift hat jaye
        onComplete(); 
      }, 2000);

      // Cleanup logic taaki agar jaldi-jaldi send dabayein toh purana timer cancel ho jaye
      return () => clearTimeout(timer);
    }
  }, [giftId, getEmoji, onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* mode="popLayout" se animation smooth hota hai jab purana item replace hota hai */}
      <AnimatePresence mode="popLayout">
        {activeGifts.map((gift) => (
          <motion.div
            key={gift.id}
            initial={{ 
              opacity: 0, 
              scale: 0.5, 
              x: '0vw', 
              y: '20vh' // Niche se start hoga
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], // Pehle dikhega, fir fade out
              scale: [0.5, 1.2, 1],
              x: [
                '0vw', 
                `${gift.xOffset}px`, 
                targetCoords.x
              ],
              y: [
                '20vh', 
                '10vh', 
                targetCoords.y
              ],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut" 
            }}
            className="absolute"
          >
            {/* GLOW EFFECT BORDER */}
            <div className="relative">
                <span 
                className="text-6xl filter drop-shadow-lg select-none"
                style={{
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))'
                }}
                >
                {gift.emoji}
                </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
