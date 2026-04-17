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
      
      // Total 3 seconds ki animation (0.5s appear + 2.0s stay + 0.5s fly to seat)
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [giftId, onComplete]);

  if (!giftId || !isVisible || typeof giftId !== 'string') return null;

  // 1. FULL EMOJI MAP (Baki sab waise hi rakhe hain, naye add kiye hain)
  const getEmoji = () => {
    const map: Record<string, string> = {
      'heart': '❤️', 'cake': '🍰', 'lollipop': '🍭', 'popcorn': '🍿', 'donut': '🍩',
      // Purane waale backup ke liye
      'choco-pops': '🍭', 'chai': '☕', 'rose': '🌹', 'applaud': '👏', 'love-bomb': '💣', 
      'kiss': '💋', 'chocolate-box': '🍫', 'money-gun': '🔫', 'watch': '⌚', 'birthday-cake': '🎂',
      'lucky-clover': '🍀', 'magic-wand': '🪄', 'jackpot': '🎰', 'treasure': '🪙', 'soaring': '🎆',
      'golden-football': '⚽', 'chupa-chups': '🍬', 'microphone': '🎤', 'headphones': '🎧', 
    };
    return map[giftId] || giftId || '🎁'; // Agar direct emoji pass kiya to wo dikhega
  };

  // 2. SEAT POSITION LOGIC (Coordinates of seats 1 to 9)
  // Yeh x aur y vh/vw me hain, center of screen se relative.
  // Tum inhe apne UI layout ke hisaab se tweak kar sakte ho.
  const getSeatPosition = (seat: number) => {
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          key={triggerKey} 
          className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          {/* MAIN EMOJI ICON */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ 
              scale: 0, 
              opacity: 0,
              x: '0vw',
              y: '0vh' 
            }}
            animate={{ 
              // 1. Appears (scale 1.5)
              // 2. Stays in middle for 2 seconds
              // 3. Flies to target avatar and shrinks to 0
              scale: [0, 1.5, 1.5, 0], 
              opacity: [0, 1, 1, 0],
              x: ['0vw', '0vw', '0vw', targetCoords.x],
              y: ['10vh', '0vh', '0vh', targetCoords.y], // 70vh se 30vh ke beech ka feel
            }}
            transition={{ 
              duration: 3, 
              // Times array defines kab kya hoga:
              // 0.0 -> 0.16 (0.5 sec): Pop in
              // 0.16 -> 0.83 (2.0 sec hold time): Middle stay
              // 0.83 -> 1.0 (0.5 sec): Fly to target avatar
              times: [0, 0.16, 0.83, 1], 
              ease: "easeInOut" 
            }}
          >
            {/* GLOSSY / NEON REFLECTION LAYER */}
            <div className="absolute inset-0 blur-[40px] opacity-60 bg-white/40 rounded-full scale-[1.5]" />
            
            {/* ACTUAL ICON WITH GLOSSY DROP-SHADOW */}
            <span 
              className="text-[12rem] relative z-10 select-none transform-gpu"
              style={{
                filter: 'drop-shadow(0px 15px 25px rgba(255,255,255,0.6)) drop-shadow(0px 5px 10px rgba(0,0,0,0.3))'
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

