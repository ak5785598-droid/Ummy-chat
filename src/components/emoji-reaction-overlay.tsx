'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiReactionOverlayProps {
 emoji?: string | null;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Static Emoji Reaction Overlay.
 * Designed to cover the seat/profile picture entirely for a set duration.
 */
export function EmojiReactionOverlay({ emoji, size = 'md' }: EmojiReactionOverlayProps) {
  const [activeEmoji, setActiveEmoji] = useState<{ id: number, emoji: string } | null>(null);

  useEffect(() => {
    if (emoji) {
      const newEmoji = { id: Date.now(), emoji };
      setActiveEmoji(newEmoji);

      // Keep static for the full 5 seconds
      const timer = setTimeout(() => {
        setActiveEmoji(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [emoji]);

  if (!activeEmoji) return null;

  const sizeClasses = {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-6xl',
    xl: 'text-7xl',
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={activeEmoji.id}
          className={cn(
            "drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] leading-none",
            sizeClasses[size]
          )}
          initial={{ scale: 0, opacity: 0, rotate: -15 }}
          animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
        >
          {activeEmoji.emoji}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
