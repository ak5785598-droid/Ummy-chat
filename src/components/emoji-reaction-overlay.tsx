'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface EmojiReactionOverlayProps {
  emoji?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Animated Emoji Reaction Overlay.
 * Displays an "acting" emoji that FULLY COVERS the user's avatar.
 * Mapped to the specific tribe set: 😀, 😂, 😘, 🥰, 😎, 🤗, 😡, 😭, 💋.
 */
export function EmojiReactionOverlay({ emoji, size = 'md' }: EmojiReactionOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (emoji) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [emoji]);

  if (!emoji || !isVisible) return null;

  const getAnimationClass = (e: string) => {
    switch (e) {
      case '😀': return 'animate-reaction-pulse';
      case '😂': return 'animate-reaction-bounce';
      case '😘': return 'animate-reaction-heartbeat';
      case '🥰': return 'animate-reaction-heartbeat';
      case '😎': return 'animate-reaction-glitter';
      case '🤗': return 'animate-reaction-float';
      case '😡': return 'animate-reaction-shock';
      case '😭': return 'animate-reaction-cry';
      case '💋': return 'animate-reaction-pulse';
      default: return 'animate-bounce';
    }
  };

  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  return (
    <div className={cn(
      "absolute inset-0 z-[60] flex items-center justify-center select-none rounded-full animate-in zoom-in duration-300",
      "bg-black/60 backdrop-blur-[4px]"
    )}>
      <span className={cn(
        "drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]",
        sizeClasses[size],
        getAnimationClass(emoji)
      )}>
        {emoji}
      </span>
    </div>
  );
}
