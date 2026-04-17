'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftAnimationOverlayProps {
  giftId: string | null;
  onComplete: () => void;
  senderName?: string | null;
  targetSeat?: number; // 1 to 9 seat number pass karna yahan
}

export function GiftAnimationOverlay({ 
  giftId, 
  onComplete, 
  senderName, 
  targetSeat = 1 // Default seat agar koi pass na kare
}: GiftAnimationOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);

  useEffect(() => {
    if (giftId && typeof giftId === 'string') {
      setIsVisible(true);
      setTriggerKey(prev => prev + 1);
      
      // Video ke hisaab se fast animation (Total 1.5s time diya hai)
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 1500); 

      return () => clearTimeout(timer);
    }
  }, [giftId, onComplete]);

  if (!giftId || !isVisible || typeof giftId !== 'string') return null;

  // 1. FULL EMOJI MAP
  const getEmoji = () => {
    const map: Record<string, string> = {
      'heart': '❤️', 'cake': '🍰', 'lollipop': '🍭', 'popcorn': '🍿', 'donut': '🍩',
      'choco-pops': '🍭', 'chai': '☕', 'rose': '🌹', 'applaud': '👏', 'love-bomb': '💣', 
      'kiss': '💋', 'chocolate-box': '🍫', 'money-gun': '🔫', 'watch': '⌚', 'birthday-cake': '🎂',
      'lucky-clover': '🍀', 'magic-wand': '🪄', 'jackpot': '🎰', 'treasure': '🪙', 'soaring': '🎆',
      'golden-football': '⚽', 'chupa-chups': '🍬', 'microphone': '🎤', 'headphones': '🎧', 
    };
    return map[giftId] || giftId || '🎁'; 
  };

  // 2. SEAT POSITION LOGIC
  const getSeatTarget = (seat: number) => {
    const positions: Record<number, { x: string; y: string }> = {
     1: { x: '0vw',   y: '-28vh' }, // Top single seat (NO.1)
     2: { x: '-38vw', y: '-12vh' }, // Left upper (NO.2)
     3: { x: '-13vw', y: '-12vh' }, // Left center (NO.3)
     4: { x: '13vw',  y: '-12vh' }, // Right center (NO.4)
     5: { x: '38vw',  y: '-12vh' }, // Right upper (NO.5)
     6: { x: '-38vw', y: '5vh'   }, // Left lower (NO.6)
     7: { x: '-13vw', y: '5vh'   }, // Mid-left lower (NO.7)
     8: { x: '13vw',  y: '5vh'   }, // Mid-right lower (NO.8)
     9: { x: '38vw',  y: '5vh'   }, // Right lower (NO.9)
    };
    return positions[seat] || { x: '0vw', y: '0vh' };
  };

  const targetCoords = getSeatTarget(targetSeat);
  
  // Halki si random position takki jab user fast click kare toh sab ek dusre ke upar na chade (video jaisa organic flow)
  const randomStartX = (Math.random() - 0.5) * 6 + 'vw';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          key={triggerKey} 
          className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* MAIN EMOJI ICON */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ 
              scale: 0.2, 
              opacity: 0,
              x: randomStartX, 
              y: '45vh' // Screen ke niche wale hisse (Gift Button) se shuru hoga
            }}
            animate={{ 
              // 1. Pop out from bottom
              // 2. Fly directly to target avatar without stopping
              scale: [0.2, 1.2, 1, 0.5], 
              opacity: [0, 1, 1, 0],
              x: [randomStartX, targetCoords.x],
              y: ['45vh', targetCoords.y], 
            }}
            transition={{ 
              duration: 1.2, // Video ki tarah fast urta hua jayega
              ease: "easeOut" // Niche se fast niklega aur upar smoothly jayega
            }}
          >
            {/* GLOSSY / NEON REFLECTION LAYER */}
            <div className="absolute inset-0 blur-[25px] opacity-50 bg-white/40 rounded-full scale-[1.2]" />
            
            {/* ACTUAL ICON WITH GLOSSY DROP-SHADOW */}
            <span 
              className="text-[5rem] relative z-10 select-none transform-gpu"
              style={{
                filter: 'drop-shadow(0px 10px 15px rgba(255,255,255,0.5)) drop-shadow(0px 4px 8px rgba(0,0,0,0.3))'
              }}
            >
              {getEmoji()}
            </span>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
