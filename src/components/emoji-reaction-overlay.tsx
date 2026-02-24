'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface EmojiReactionOverlayProps {
  emoji?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Animated Emoji Reaction Overlay.
 * Displays an "acting" emoji over the user's avatar with unique animations.
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
      case '🔥': return 'animate-reaction-pulse';
      case '❤️': return 'animate-reaction-heartbeat';
      case '😂': return 'animate-reaction-bounce';
      case '😭': return 'animate-reaction-cry';
      case '😮': return 'animate-reaction-shock';
      case '🙌': return 'animate-reaction-float';
      case '✨': return 'animate-reaction-glitter';
      case '🎉': return 'animate-reaction-party';
      default: return 'animate-bounce';
    }
  };

  const sizeClasses = {
    sm: 'text-2xl -top-2',
    md: 'text-4xl -top-4',
    lg: 'text-5xl -top-6',
    xl: 'text-6xl -top-8',
  };

  return (
    <div className={cn(
      "absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none drop-shadow-xl",
      sizeClasses[size],
      getAnimationClass(emoji)
    )}>
      {emoji}
    </div>
  );
}
