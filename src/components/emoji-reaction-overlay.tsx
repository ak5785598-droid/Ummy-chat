'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiReactionOverlayProps {
 emoji?: string | null;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Animated Floating Emoji Reaction Overlay.
 * Replaces the static pulse with a TikTok/Instagram style float.
 */
export function EmojiReactionOverlay({ emoji, size = 'md' }: EmojiReactionOverlayProps) {
 const [activeEmojis, setActiveEmojis] = useState<{ id: number, emoji: string, startX: number }[]>([]);

 useEffect(() => {
  if (emoji) {
   const newEmoji = { 
    id: Date.now() + Math.random(), 
    emoji,
    startX: Math.random() * 40 - 20 // Random spread across the area
   };
   
   setActiveEmojis(prev => [...prev, newEmoji]);

   // Remove after animation completes
   setTimeout(() => {
    setActiveEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
   }, 3000);
  }
 }, [emoji]);

 if (activeEmojis.length === 0) return null;

 const sizeClasses = {
  sm: 'text-4xl',
  md: 'text-6xl',
  lg: 'text-7xl',
  xl: 'text-8xl',
 };

 return (
  <div className="absolute inset-x-0 bottom-0 h-40 z-[100] pointer-events-none overflow-visible flex justify-center">
   <AnimatePresence>
    {activeEmojis.map(reaction => (
     <motion.div
      key={reaction.id}
      className={cn(
       "absolute bottom-0 drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] leading-none transform-gpu",
       sizeClasses[size]
      )}
      initial={{ 
       y: 20, 
       x: reaction.startX,
       scale: 0.5, 
       opacity: 0,
       rotate: -20
      }}
      animate={{ 
       y: -150 - (Math.random() * 50), // Float up
       x: reaction.startX + (Math.random() * 40 - 20), // Drift horizontally
       scale: [0.5, 1.2, 1], 
       opacity: [0, 1, 1, 0],
       rotate: 0 + (Math.random() * 40 - 20)
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ 
       duration: 2.5 + Math.random() * 1, // 2.5s to 3.5s float
       ease: [0.25, 1, 0.5, 1], // easeOutQuart-like fast start, slow end
       opacity: { times: [0, 0.1, 0.8, 1] },
       scale: { times: [0, 0.1, 1] }
      }}
     >
      {reaction.emoji}
     </motion.div>
    ))}
   </AnimatePresence>
  </div>
 );
}
