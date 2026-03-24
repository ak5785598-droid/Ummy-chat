'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftAnimationOverlayProps {
 giftId: string | null;
 onComplete: () => void;
 senderName?: string | null;
}

export function GiftAnimationOverlay({ giftId, onComplete, senderName }: GiftAnimationOverlayProps) {
 const [isVisible, setIsVisible] = useState(false);
 const [triggerKey, setTriggerKey] = useState(0);

 useEffect(() => {
  if (giftId && typeof giftId === 'string') {
   setIsVisible(true);
   setTriggerKey(prev => prev + 1);
   
   let duration = 4000;
   const premiumTier = ['cyber-car', 'quantum-jet', 'galactic-castle', 'holo-dragon', 'crown-of-kings', 'diamond-throne'];
   if (premiumTier.includes(giftId)) duration = 6000;

   const timer = setTimeout(() => {
    setIsVisible(false);
    onComplete();
   }, duration);
   return () => clearTimeout(timer);
  }
 }, [giftId, onComplete]);

 if (!giftId || !isVisible || typeof giftId !== 'string') return null;

 const getEmoji = () => {
  switch (giftId) {
   case 'neon-heart': return '💝';
   case 'cyber-rose': return '🌹';
   case 'halo': return '😇';
   case 'golden-sword': return '⚔️';
   case 'magic-lamp': return '🪔';
   case 'diamond': return '💎';
   case 'lucky-clover': return '🍀';
   case 'magic-wand': return '🪄';
   case 'jackpot': return '🎰';
   case 'treasure': return '🪙';
   case 'cyber-car': return '🏎️';
   case 'quantum-jet': return '🛩️';
   case 'galactic-castle': return '🏰';
   case 'holo-dragon': return '🐉';
   case 'crown-of-kings': return '👑';
   case 'diamond-throne': return '💺';
   default: return '🎁';
  }
 };

 const premiumTier = ['cyber-car', 'quantum-jet', 'galactic-castle', 'holo-dragon', 'crown-of-kings', 'diamond-throne'];
 const isPremium = premiumTier.includes(giftId);

 return (
  <AnimatePresence>
   {isVisible && (
    <motion.div 
     key={triggerKey} 
     className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden"
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     transition={{ duration: 0.5 }}
    >
     {/* Screen Flash for Premium */}
     {isPremium && (
      <motion.div 
       className="absolute inset-0 bg-white pointer-events-none z-[301]"
       initial={{ opacity: 0 }}
       animate={{ opacity: [0, 0.8, 0] }}
       transition={{ duration: 0.8, ease: "easeOut" }}
      />
     )}

     {/* Sender Announcement for Premium */}
     {isPremium && (
      <motion.div 
       className="absolute top-[15%] z-[310] flex flex-col items-center gap-2"
       initial={{ y: -50, opacity: 0, scale: 0.8 }}
       animate={{ y: 0, opacity: 1, scale: 1 }}
       transition={{ type: 'spring', damping: 15, delay: 0.2 }}
      >
       <div className="bg-[#0a0c10]/80 backdrop-blur-xl px-8 py-3 rounded-[30px] border border-[#00E676]/40 shadow-[0_0_40px_rgba(0,230,118,0.3)] flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[#00E676]" />
        <span className="text-white font-bold text-lg uppercase tracking-widest drop-shadow-md">
         {senderName || 'Member'} sent {getEmoji()}
        </span>
        <Sparkles className="h-5 w-5 text-[#00E676]" />
       </div>
      </motion.div>
     )}

     {/* Premium Epic Animations */}
     {isPremium ? (
      <motion.div 
       className="relative z-[305] flex items-center justify-center transform-gpu"
       initial={{ scale: 0, rotate: -30, y: 200 }}
       animate={{ 
        scale: [0, 1.8, 1.4, 1.5, 3.5], 
        rotate: [-30, 10, -5, -5, 45], 
        y: [200, -50, 0, 0, -600], 
        opacity: [0, 1, 1, 1, 0] 
       }}
       transition={{ duration: 5.5, times: [0, 0.15, 0.3, 0.8, 1], ease: "easeInOut" }}
      >
       <div className="absolute inset-0 bg-[#00E676] blur-[150px] opacity-40 rounded-full scale-[2] animate-pulse" />
       {giftId === 'holo-dragon' && <div className="absolute inset-0 bg-purple-600 blur-[200px] opacity-50 rounded-full scale-[3] animate-pulse" />}
       <span className="text-[16rem] drop-shadow-[0_0_80px_rgba(255,255,255,0.9)] filter">
        {getEmoji()}
       </span>
      </motion.div>
     ) : (
      /* Standard Gift Animation */
      <motion.div
       className="z-[302] relative transform-gpu"
       initial={{ scale: 0, y: 150, rotate: -20, opacity: 0 }}
       animate={{ 
        scale: [0, 1.8, 1.4, 1.4, 3], 
        y: [150, -40, 0, 0, -300], 
        rotate: [-20, 15, 0, 0, 30], 
        opacity: [0, 1, 1, 1, 0] 
       }}
       transition={{ duration: 3.5, times: [0, 0.2, 0.4, 0.8, 1], ease: "easeOut" }}
      >
       <div className="absolute inset-0 bg-yellow-400 blur-[80px] opacity-40 rounded-full scale-[2]" />
       <span className="text-[10rem] drop-shadow-[0_0_50px_rgba(255,255,255,0.7)] relative z-10">
        {getEmoji()}
       </span>
      </motion.div>
     )}

     {/* Floating Particles for all gifts */}
     <div className="absolute inset-0 z-[302] overflow-hidden pointer-events-none">
       {Array.from({ length: isPremium ? 50 : 20 }).map((_, i) => {
        const isStar = Math.random() > 0.5;
        return (
         <motion.div
          key={i}
          className="absolute text-4xl opacity-0 filter drop-shadow-lg"
          initial={{ 
           left: `${50 + (Math.random() * 20 - 10)}vw`, 
           top: "100vh", 
           scale: Math.random() * 0.6 + 0.4,
           rotate: 0 
          }}
          animate={{ 
           left: `${Math.random() * 100}vw`, 
           top: "-20vh", 
           rotate: 360 + Math.random() * 360,
           opacity: [0, 1, 1, 0] 
          }}
          transition={{ 
           duration: 3 + Math.random() * 3, 
           delay: Math.random() * 1.5,
           ease: "easeOut" 
          }}
         >
          {isStar ? '✨' : getEmoji()}
         </motion.div>
        );
       })}
     </div>
    </motion.div>
   )}
  </AnimatePresence>
 );
}
