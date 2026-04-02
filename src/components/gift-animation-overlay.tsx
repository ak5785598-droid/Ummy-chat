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

 // 1. Full Premium List (Same as your original)
 const premiumTier = [
  'library', 'fountain', 'diamond', 'lipstick', 'trophy', 'golden-phone', 
  'gem-knife', 'scepter', 'dressing-table', 'star-rain', 'coronation', 
  'rose-vow', 'glory', 'neon-car', 'ferrari', 'sword-of-ocean', 'new-year', 
  'eid-mubarak', 'yacht', 'mansion', 'private-island', 'helicopter', 
  'submarine', 'limo', 'private-jet', 'diamond-necklace', 'gold-watch', 
  'designer-bag', 'stiletto', 'ring', 'crystal-chandelier', 'sports-car', 
  'grand-piano', 'stradivarius', 'arabian-horse', 'purebred-dog', 'exotic-bird', 
  'silver-platter', 'space-station', 'moon-base', 'mars-rover', 'cyber-city', 
  'floating-island', 'dragon', 'phoenix', 'unicorn', 'pegasus', 'kraken', 
  'leviathan', 'world-tree', 'excalibur', 'holy-grail', 'christmas-tree', 
  'santa-sleigh'
 ];

 const isPremium = giftId ? premiumTier.includes(giftId) : false;

 useEffect(() => {
  if (giftId && typeof giftId === 'string') {
   setIsVisible(true);
   setTriggerKey(prev => prev + 1);
   
   // Premium gifts stay longer for better impact
   const duration = isPremium ? 6500 : 4000;

   const timer = setTimeout(() => {
    setIsVisible(false);
    onComplete();
   }, duration);
   return () => clearTimeout(timer);
  }
 }, [giftId, onComplete, isPremium]);

 if (!giftId || !isVisible || typeof giftId !== 'string') return null;

 // 2. Full Emoji Map (All your emojis restored)
 const getEmoji = () => {
  const map: Record<string, string> = {
   'choco-pops': '🍭', 'chai': '☕', 'rose': '🌹', 'applaud': '👏',
   'love-bomb': '💣', 'kiss': '💋', 'chocolate-box': '🍫',
   'money-gun': '🔫', 'watch': '⌚', 'birthday-cake': '🎂',
   'lucky-clover': '🍀', 'magic-wand': '🪄', 'jackpot': '🎰',
   'treasure': '🪙', 'soaring': '🎆', 'golden-football': '⚽',
   'chupa-chups': '🍬', 'library': '📚', 'fountain': '⛲',
   'diamond': '💎', 'lipstick': '💄', 'trophy': '🏆',
   'golden-phone': '📱', 'gem-knife': '🗡️', 'scepter': '🦯',
   'dressing-table': '🪞', 'star-rain': '🌠', 'coronation': '👑',
   'rose-vow': '💑', 'glory': '🕊️', 'neon-car': '🚘',
   'ferrari': '🏎️', 'sword-of-ocean': '⚔️', 'new-year': '🎊',
   'eid-lantern': '🏮', 'eid-cannon': '💣', 'eid-feast': '🥘',
   'eid-mubarak': '🕌', 'microphone': '🎤', 'headphones': '🎧', 
   'perfume': '🧴', 'soccer-ball': '⚽', 'ticket': '🎟️', 'popcorn': '🍿',
   'controller': '🎮', 'vinyl': '📀', 'bubble-tea': '🧋',
   'doughnut': '🍩', 'candy': '🍬', 'ice-cream': '🍦',
   'pizza': '🍕', 'burger': '🍔', 'taco': '🌮',
   'cocktail': '🍸', 'beer': '🍺', 'champagne': '🥂',
   'coffee': '☕', 'tea': '🍵', 'milk': '🥛',
   'cookie': '🍪', 'apple': '🍎', 'banana': '🍌',
   'cherry': '🍒', 'peach': '🍑', 'strawberry': '🍓',
   'watermelon': '🍉', 'lemon': '🍋', 'pineapple': '🍍',
   'dice': '🎲', 'horseshoe': '🧲', 'crystal-ball': '🔮',
   'tarot': '🃏', 'shooting-star': '🌠', 'rainbow': '🌈',
   'pot-of-gold': '🍯', 'eight-ball': '🎱', 'fortune-cookie': '🥠',
   'red-envelope': '🧧', 'wishbone': '🦴', 'piggy-bank': '🐷',
   'amulet': '🧿', 'leprechaun-hat': '🎩', 'magic-potion': '🧪',
   'dreamcatcher': '🕸️', 'wishing-well': '⛲', 'gold-ingot': '🧈',
   'yacht': '🛥️', 'mansion': '🏡', 'private-island': '🏝️',
   'helicopter': '🚁', 'submarine': '🛳️', 'limo': '🚘',
   'private-jet': '🛩️', 'diamond-necklace': '💎', 'gold-watch': '⌚',
   'designer-bag': '👜', 'stiletto': '👠', 'ring': '💍',
   'crystal-chandelier': '✨', 'sports-car': '🏎️', 'grand-piano': '🎹',
   'stradivarius': '🎻', 'arabian-horse': '🐎', 'purebred-dog': '🐩',
   'exotic-bird': '🦚', 'silver-platter': '🍽️', 'space-station': '🛰️',
   'moon-base': '🌖', 'mars-rover': '🛸', 'cyber-city': '🏙️',
   'floating-island': '☁️', 'dragon': '🐉', 'phoenix': '🐦',
   'unicorn': '🦄', 'pegasus': '🐎', 'kraken': '🐙',
   'leviathan': '🐳', 'world-tree': '🌳', 'excalibur': '🗡️',
   'holy-grail': '🏆', 'fireworks': '🎆', 'confetti': '🎊',
   'birthday-hat': '🥳', 'christmas-tree': '🎄', 'santa-sleigh': '🎅',
   'snowman': '⛄', 'jack-o-lantern': '🎃', 'easter-egg': '🥚',
   'valentine-heart': '💖', 'thanksgiving-turkey': '🦃'
  };
  return map[giftId] || '🎁';
 };

 return (
  <AnimatePresence mode='wait'>
   {isVisible && (
    <motion.div 
     key={triggerKey} 
     className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden"
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
    >
     {/* 3. Realistic Glassmorphic Announcement (Premium Only) */}
     {isPremium && (
      <>
        <motion.div 
          className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-[301]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5 }}
        />
        <motion.div 
          className="absolute top-[10%] z-[310]"
          initial={{ y: -100, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="bg-black/40 backdrop-blur-xl px-12 py-5 rounded-full border-2 border-[#00E676] shadow-[0_0_50px_rgba(0,230,118,0.5)] flex items-center gap-5">
            <Sparkles className="h-7 w-7 text-[#00E676] animate-pulse" />
            <span className="text-white font-black text-2xl italic tracking-tighter uppercase drop-shadow-lg">
              {senderName || 'VIP'} SENT {getEmoji()}
            </span>
            <Sparkles className="h-7 w-7 text-[#00E676] animate-pulse" />
          </div>
        </motion.div>
      </>
     )}

     {/* 4. Realistic 3D Gift Animation */}
     <motion.div
       className="relative z-[305] flex items-center justify-center transform-gpu"
       initial={{ scale: 0, y: 500, rotateX: 60, rotateZ: -30, opacity: 0, filter: 'blur(20px)' }}
       animate={{ 
        scale: [0, 1.4, 1.1, 1.1, 5], 
        y: [500, -30, 0, 0, -1000], 
        rotateX: [60, 0, 0, 0, -60],
        rotateZ: [-30, 15, 0, 0, 30],
        opacity: [0, 1, 1, 1, 0],
        filter: ['blur(15px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(30px)']
       }}
       transition={{ 
        duration: isPremium ? 6 : 3.8, 
        times: [0, 0.15, 0.3, 0.8, 1], 
        ease: [0.34, 1.56, 0.64, 1] // Custom Realistic Spring Ease
       }}
      >
       {/* High-End Dynamic Glow */}
       <div className={cn(
         "absolute inset-0 blur-[120px] opacity-40 rounded-full scale-[2.5] animate-pulse",
         isPremium ? "bg-[#00E676]" : "bg-yellow-400"
       )} />
       
       <span className="text-[14rem] md:text-[22rem] drop-shadow-[0_40px_70px_rgba(0,0,0,0.6)] z-10 select-none">
        {getEmoji()}
       </span>
      </motion.div>

     {/* 5. Realistic Particle Explosion */}
     <div className="absolute inset-0 z-[302] pointer-events-none">
       {Array.from({ length: isPremium ? 60 : 20 }).map((_, i) => (
         <motion.div
          key={i}
          className="absolute text-4xl"
          initial={{ 
           left: `${50}%`, 
           top: "60%", 
           opacity: 0,
           scale: 0
          }}
          animate={{ 
           top: `${Math.random() * 100}%`,
           left: `${Math.random() * 100}%`,
           rotate: Math.random() * 1000,
           opacity: [0, 1, 1, 0],
           scale: [0, 1, 0.5, 0]
          }}
          transition={{ 
           duration: 2 + Math.random() * 2, 
           delay: isPremium ? 0.5 + Math.random() * 2 : Math.random() * 1,
           ease: "easeOut" 
          }}
         >
          {Math.random() > 0.5 ? '✨' : '⭐'}
         </motion.div>
       ))}
     </div>
    </motion.div>
   )}
  </AnimatePresence>
 );
}
