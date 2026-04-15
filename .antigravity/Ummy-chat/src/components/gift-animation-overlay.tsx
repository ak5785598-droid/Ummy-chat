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
  'pegasus', 'kraken', 'world-tree', 'excalibur', 'holy-grail', 'crown_gift_premium'
 ];

 const isPremium = giftId ? premiumTier.includes(giftId) : false;

 useEffect(() => {
  if (giftId && typeof giftId === 'string') {
   setIsVisible(true);
   setTriggerKey(prev => prev + 1);
   
   const duration = isPremium ? 7000 : 4500;

   const timer = setTimeout(() => {
    setIsVisible(false);
    onComplete();
   }, duration);
   return () => clearTimeout(timer);
  }
 }, [giftId, onComplete, isPremium]);

 if (!giftId || !isVisible || typeof giftId !== 'string') return null;

 // 2. FULL EMOJI MAP
 const getEmoji = () => {
  const map: Record<string, string> = {
   'choco-pops': '🍭', 'chai': '☕', 'rose': '🌹', 'applaud': '👏', 'love-bomb': '💣', 
   'kiss': '💋', 'chocolate-box': '🍫', 'money-gun': '🔫', 'watch': '⌚', 'birthday-cake': '🎂',
   'lucky-clover': '🍀', 'magic-wand': '🪄', 'jackpot': '🎰', 'treasure': '🪙', 'soaring': '🎆',
   'golden-football': '⚽', 'chupa-chups': '🍬', 'microphone': '🎤', 'headphones': '🎧', 
   'perfume': '🧴', 'ticket': '🎟️', 'popcorn': '🍿', 'controller': '🎮', 'vinyl': '📀',
   'crown_gift_premium': '👑', 'ferrari': '🏎️', 'neon-car': '🚘', 'space-station': '🛰️',
   'pizza': '🍕', 'burger': '🍔', 'taco': '🌮', 'doughnut': '🍩', 'ice-cream': '🍦',
   'bubble-tea': '🧋', 'cocktail': '🍸', 'beer': '🍺', 'champagne': '🥂', 'coffee': '☕',
   'library': '📚', 'fountain': '⛲', 'diamond': '💎', 'lipstick': '💄', 'trophy': '🏆',
   'golden-phone': '📱', 'gem-knife': '🗡️', 'scepter': '🦯', 'dressing-table': '🪞', 
   'star-rain': '🌠', 'coronation': '👑', 'rose-vow': '💑', 'glory': '🕊️',
   'sword-of-ocean': '⚔️', 'yacht': '🛥️', 'mansion': '🏡', 'private-island': '🏝️',
   'helicopter': '🚁', 'submarine': '🛳️', 'limo': '🚘', 'private-jet': '🛩️', 
   'diamond-necklace': '💎', 'gold-watch': '⌚', 'designer-bag': '👜', 'sports-car': '🏎️', 
   'grand-piano': '🎹', 'moon-base': '🌖', 'mars-rover': '🛸',
   'dragon': '🐉', 'phoenix': '🐦', 'unicorn': '🦄', 'pegasus': '🐎', 'kraken': '🐙', 
   'world-tree': '🌳', 'excalibur': '🗡️', 'holy-grail': '🏆',
   'new-year': '🎊', 'eid-mubarak': '🕌', 'fireworks': '🎆', 'christmas-tree': '🎄', 
   'santa-sleigh': '🎅', 'valentine-heart': '💖',
   'flag-india': '🇮🇳', 'flag-pakistan': '🇵🇰', 'flag-canada': '🇨🇦', 'flag-america': '🇺🇸'
  };
  return map[giftId] || '🎁';
 };

 // 3. SPECIAL PARTICLE EFFECTS
 const renderExtraParticles = () => {
    const particles = [];
    // Enhanced popcorn (more particles, wider spread)
    if (giftId === 'popcorn') {
      for (let i = 0; i < 40; i++) {
        particles.push(
          <motion.div key={i} className="absolute text-2xl"
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{ x: (Math.random() - 0.5) * 800, y: [0, -300, 600], scale: [0, 1.2, 0.8], rotate: Math.random() * 720 }}
            transition={{ duration: 3, delay: Math.random() * 1.5, ease: "easeOut" }}
          >🍿</motion.div>
        );
      }
    }
    // Money gun rain across whole room
    if (giftId === 'money-gun') {
      for (let i = 0; i < 50; i++) {
        particles.push(
          <motion.div key={i} className="absolute text-3xl"
            initial={{ x: (Math.random() - 0.5) * 600, y: -400, opacity: 0 }}
            animate={{ y: 800, x: (Math.random() - 0.5) * 800, opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration: 2.5, delay: i * 0.05 }}
          >💸</motion.div>
        );
      }
    }
    // Hearts flourish
    if (['love-bomb', 'valentine-heart', 'kiss', 'rose-vow'].includes(giftId)) {
      for (let i = 0; i < 30; i++) {
        particles.push(
          <motion.div key={i} className="absolute text-red-500"
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{ 
              x: (Math.random() - 0.5) * 700, 
              y: (Math.random() - 0.5) * 900, 
              scale: [0, 1.8, 0], 
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 2.5, delay: 0.5 + Math.random() * 1.5 }}
          >❤️</motion.div>
        );
      }
    }
    // Premium sparkles for high-tier
    if (isPremium) {
       for (let i = 0; i < 40; i++) {
         particles.push(
           <motion.div key={`sparkle-${i}`} className="absolute"
             initial={{ x: 0, y: 0, scale: 0 }}
             animate={{ 
               x: (Math.random() - 0.5) * 1000, 
               y: (Math.random() - 0.5) * 1200, 
               scale: [0, 1, 0],
               rotate: 360
             }}
             transition={{ duration: 4, delay: Math.random() * 2 }}
           >
             <Sparkles className="h-4 w-4 text-cyan-400 fill-cyan-400/20" />
           </motion.div>
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

  const times = [0, 0.15, 0.5, 0.85, 1];
  const exitPos = { y: 600, x: -180, scale: 0.1 }; 

  if (isClap) {
   return { scale: [0, 2, 2, 2, exitPos.scale], y: [500, -50, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], rotateZ: [0, -35, 35, -35, 0], opacity: [0, 1, 1, 1, 0], times };
  }
  if (isFlag) {
   return { scale: [0, 2.2, 2.2, 2.2, exitPos.scale], y: [500, -30, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], skewX: [0, 20, -20, 15, 0], opacity: [0, 1, 1, 1, 0], times };
  }
  if (isActionItem) {
   return { scale: [0, 1.8, 2, 1.8, exitPos.scale], y: [500, 0, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], rotateZ: [0, -15, 15, -15, 0], opacity: [0, 1, 1, 1, 0], times };
  }

  // DEFAULT (High Impact 3D Float)
  return { scale: [0, 2, 1.6, 1.6, exitPos.scale], y: [500, -100, 0, 0, exitPos.y], x: [0, 0, 0, 0, exitPos.x], rotateY: [0, 360, 720, 720, 720], opacity: [0, 1, 1, 1, 0], times };
 };

 const anim = getAnimationParams();

 return (
  <AnimatePresence>
   {isVisible && (
    <motion.div 
     key={triggerKey} 
     className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden [perspective:1500px]"
     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
     {/* 1. SCREEN PULSE EFFECT (Full Room) */}
     <motion.div 
       className={cn("absolute inset-0 z-[1001]", isPremium ? "bg-cyan-500/10" : "bg-white/5")}
       initial={{ opacity: 0, scale: 0.8 }}
       animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5] }}
       transition={{ duration: 1.5, ease: "easeOut" }}
     />

     {/* 2. CINEMATIC GOD RAYS (Premium Only) */}
     {isPremium && (
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-[1002]">
         {[...Array(8)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute w-[200%] h-32 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
             style={{ rotate: i * 45 }}
             animate={{ opacity: [0.2, 0.5, 0.2], scaleY: [1, 1.5, 1] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
           />
         ))}
       </div>
     )}

     {/* 3. PREMIUM ANNOUNCEMENT BANNER */}
     {isPremium && (
      <motion.div className="absolute top-[8%] z-[1100]" initial={{ y: -150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", damping: 15 }}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 blur-xl opacity-50 animate-pulse rounded-full" />
          <div className="relative bg-black/80 backdrop-blur-3xl px-14 py-4 rounded-full border border-white/20 shadow-2xl flex items-center gap-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] animate-[shine_3s_infinite]" />
            <Sparkles className="h-6 w-6 text-cyan-400" />
            <span className="text-white font-black text-xl italic tracking-tighter uppercase drop-shadow-lg">
              {senderName || 'VIP'} <span className="text-cyan-400">SENT</span> {getEmoji()}
            </span>
            <Sparkles className="h-6 w-6 text-cyan-400" />
          </div>
        </div>
      </motion.div>
     )}

     {/* 4. MAIN ICON & PARTICLES */}
     <div className="relative flex items-center justify-center">
        {renderExtraParticles()}

        <motion.div
         className="relative z-[1050] transform-gpu"
         initial={{ scale: 0, y: 500, opacity: 0 }}
         animate={{ 
           scale: anim.scale, y: anim.y, x: anim.x,
           rotateY: anim.rotateY || 0, rotateZ: anim.rotateZ || 0,
           skewX: anim.skewX || 0, opacity: anim.opacity 
         }}
         transition={{ duration: isPremium ? 6 : 4, times: anim.times, ease: "easeInOut" }}
        >
         {/* Glow Layer */}
         <div className={cn("absolute inset-0 blur-[150px] opacity-50 rounded-full scale-[3]", isPremium ? "bg-cyan-500/60" : "bg-yellow-500/40")} />
         
         <span className="text-[14rem] md:text-[22rem] drop-shadow-[0_50px_80px_rgba(0,0,0,0.7)] select-none">
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
