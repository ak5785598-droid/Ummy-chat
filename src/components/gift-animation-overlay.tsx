'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftAnimationOverlayProps {
 giftId: string | null;
 onComplete: () => void;
 senderName?: string | null;
}

export function GiftAnimationOverlay({ giftId, onComplete, senderName }: GiftAnimationOverlayProps) {
 const [isVisible, setIsVisible] = useState(false);
 const [triggerKey, setTriggerKey] = useState(0);

 // 1. COMPLETE PREMIUM LIST (High-End Gifts)
 const premiumTier = [
  'library', 'fountain', 'diamond', 'lipstick', 'trophy', 'golden-phone', 
  'gem-knife', 'scepter', 'dressing-table', 'star-rain', 'coronation', 
  'rose-vow', 'glory', 'neon-car', 'ferrari', 'sword-of-ocean', 'yacht', 
  'mansion', 'private-island', 'helicopter', 'submarine', 'limo', 'private-jet', 
  'diamond-necklace', 'gold-watch', 'designer-bag', 'sports-car', 'grand-piano', 
  'space-station', 'moon-base', 'mars-rover', 'dragon', 'phoenix', 'unicorn', 
  'pegasus', 'kraken', 'world-tree', 'excalibur', 'holy-grail'
 ];

 const isPremium = giftId ? premiumTier.includes(giftId) : false;

 useEffect(() => {
  if (giftId && typeof giftId === 'string') {
   setIsVisible(true);
   setTriggerKey(prev => prev + 1);
   
   const duration = isPremium ? 6000 : 4000;

   const timer = setTimeout(() => {
    setIsVisible(false);
    onComplete();
   }, duration);
   return () => clearTimeout(timer);
  }
 }, [giftId, onComplete, isPremium]);

 if (!giftId || !isVisible || typeof giftId !== 'string') return null;

 // 2. FULL EMOJI MAP (Covering All IDs)
 const getEmoji = () => {
  const map: Record<string, string> = {
   // Basic & Fun
   'choco-pops': '🍭', 'chai': '☕', 'rose': '🌹', 'applaud': '👏', 'love-bomb': '💣', 
   'kiss': '💋', 'chocolate-box': '🍫', 'money-gun': '🔫', 'watch': '⌚', 'birthday-cake': '🎂',
   'lucky-clover': '🍀', 'magic-wand': '🪄', 'jackpot': '🎰', 'treasure': '🪙', 'soaring': '🎆',
   'golden-football': '⚽', 'chupa-chups': '🍬', 'microphone': '🎤', 'headphones': '🎧', 
   'perfume': '🧴', 'ticket': '🎟️', 'popcorn': '🍿', 'controller': '🎮', 'vinyl': '📀',

   // Food & Drinks
   'pizza': '🍕', 'burger': '🍔', 'taco': '🌮', 'doughnut': '🍩', 'ice-cream': '🍦',
   'bubble-tea': '🧋', 'cocktail': '🍸', 'beer': '🍺', 'champagne': '🥂', 'coffee': '☕',

   // Luxury & Premium
   'library': '📚', 'fountain': '⛲', 'diamond': '💎', 'lipstick': '💄', 'trophy': '🏆',
   'golden-phone': '📱', 'gem-knife': '🗡️', 'scepter': '🦯', 'dressing-table': '🪞', 
   'star-rain': '🌠', 'coronation': '👑', 'rose-vow': '💑', 'glory': '🕊️', 'neon-car': '🚘',
   'ferrari': '🏎️', 'sword-of-ocean': '⚔️', 'yacht': '🛥️', 'mansion': '🏡', 'private-island': '🏝️',
   'helicopter': '🚁', 'submarine': '🛳️', 'limo': '🚘', 'private-jet': '🛩️', 
   'diamond-necklace': '💎', 'gold-watch': '⌚', 'designer-bag': '👜', 'sports-car': '🏎️', 
   'grand-piano': '🎹', 'space-station': '🛰️', 'moon-base': '🌖', 'mars-rover': '🛸',

   // Fantasy & Mythical
   'dragon': '🐉', 'phoenix': '🐦', 'unicorn': '🦄', 'pegasus': '🐎', 'kraken': '🐙', 
   'world-tree': '🌳', 'excalibur': '🗡️', 'holy-grail': '🏆',

   // Seasonal & Special
   'new-year': '🎊', 'eid-mubarak': '🕌', 'fireworks': '🎆', 'christmas-tree': '🎄', 
   'santa-sleigh': '🎅', 'valentine-heart': '💖',

   // Flags
   'flag-india': '🇮🇳', 'flag-pakistan': '🇵🇰', 'flag-canada': '🇨🇦', 'flag-america': '🇺🇸'
  };
  return map[giftId] || '🎁';
 };

 // 3. SPECIAL PARTICLE EFFECTS (Popcorn, Money, Hearts)
 const renderExtraParticles = () => {
    const particles = [];
    if (giftId === 'popcorn') {
      for (let i = 0; i < 20; i++) {
        particles.push(
          <motion.div key={i} className="absolute text-2xl"
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{ x: (Math.random() - 0.5) * 400, y: [0, -150, 450], scale: [0, 1, 0.7], rotate: Math.random() * 360 }}
            transition={{ duration: 2.5, delay: 0.5 + Math.random() * 1.2, ease: "easeOut" }}
          >🍿</motion.div>
        );
      }
    }
    if (giftId === 'money-gun') {
      for (let i = 0; i < 25; i++) {
        particles.push(
          <motion.div key={i} className="absolute text-3xl text-green-500"
            initial={{ x: 40, y: 0, scale: 0 }}
            animate={{ x: [40, 350], y: [0, -120, 350], scale: [0, 1.2, 1], rotate: [0, 360] }}
            transition={{ duration: 1.8, delay: 0.2 + (i * 0.08) }}
          >💸</motion.div>
        );
      }
    }
    if (['love-bomb', 'valentine-heart', 'kiss'].includes(giftId)) {
      for (let i = 0; i < 15; i++) {
        particles.push(
          <motion.div key={i} className="absolute text-red-500"
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{ x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500, scale: [0, 1.5, 0] }}
            transition={{ duration: 2, delay: 0.8 }}
          >❤️</motion.div>
        );
      }
    }
    return particles;
 };

 // 4. DYNAMIC ANIMATION LOGIC
 const getAnimationParams = () => {
  const isClap = giftId === 'applaud';
  const isFlag = giftId?.startsWith('flag-');
  const isActionItem = ['popcorn', 'money-gun', 'love-bomb'].includes(giftId);

  const times = [0, 0.2, 0.5, 0.8, 1];
  const exitPos = { y: 600, x: -180, scale: 0.15 }; // Seat position logic

  if (isClap) {
   return { scale: [0, 1.5, 1.5, 1.5, exitPos.scale], y: [500, -50, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], rotateZ: [0, -25, 25, -25, 0], opacity: [0, 1, 1, 1, 0], times };
  }
  if (isFlag) {
   return { scale: [0, 1.8, 1.8, 1.8, exitPos.scale], y: [500, -30, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], skewX: [0, 15, -15, 10, 0], opacity: [0, 1, 1, 1, 0], times };
  }
  if (isActionItem) {
   return { scale: [0, 1.5, 1.6, 1.5, exitPos.scale], y: [500, 0, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], rotateZ: [0, -8, 8, -8, 0], opacity: [0, 1, 1, 1, 0], times };
  }

  // DEFAULT (3D Spin for normal & premium)
  return { scale: [0, 1.4, 1.2, 1.2, exitPos.scale], y: [500, -30, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], rotateY: [0, 180, 360, 360, 360], opacity: [0, 1, 1, 1, 0], times };
 };

 const anim = getAnimationParams();

 return (
  <AnimatePresence>
   {isVisible && (
    <motion.div 
     key={triggerKey} 
     className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden [perspective:1200px]"
     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
     {/* Premium Banner */}
     {isPremium && (
      <motion.div className="absolute top-[10%] z-[310]" initial={{ y: -100 }} animate={{ y: 0 }}>
        <div className="bg-black/70 backdrop-blur-3xl px-12 py-5 rounded-full border-2 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.4)] flex items-center gap-6">
          <Sparkles className="h-8 w-8 text-cyan-400 animate-pulse" />
          <span className="text-white font-black text-2xl italic tracking-tighter uppercase">{senderName || 'VIP'} SENT {getEmoji()}</span>
          <Sparkles className="h-8 w-8 text-cyan-400 animate-pulse" />
        </div>
      </motion.div>
     )}

     {/* Main Icon & Particles */}
     <div className="relative flex items-center justify-center">
        {renderExtraParticles()}

        <motion.div
         className="relative z-[305] transform-gpu"
         initial={{ scale: 0, y: 500, opacity: 0 }}
         animate={{ 
           scale: anim.scale, y: anim.y, x: anim.x,
           rotateY: anim.rotateY || 0, rotateZ: anim.rotateZ || 0,
           skewX: anim.skewX || 0, opacity: anim.opacity 
         }}
         transition={{ duration: isPremium ? 5.5 : 3.8, times: anim.times, ease: "easeInOut" }}
        >
         <div className={cn("absolute inset-0 blur-[130px] opacity-40 rounded-full scale-[2.8]", isPremium ? "bg-cyan-500" : "bg-yellow-500")} />
         <span className="text-[12rem] md:text-[18rem] drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)] select-none">
          {getEmoji()}
         </span>
        </motion.div>
     </div>
    </motion.div>
   )}
  </AnimatePresence>
 );
}

export default GiftAnimationOverlay;
