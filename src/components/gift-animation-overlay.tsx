'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GiftAnimationOverlayProps {
  giftId: string | null;
  onComplete: () => void;
}

export function GiftAnimationOverlay({ giftId, onComplete }: GiftAnimationOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (giftId) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [giftId, onComplete]);

  if (!giftId || !isVisible) return null;

  const getEmoji = () => {
    switch (giftId) {
      case 'rose': return '🌹';
      case 'heart': return '💖';
      case 'ring': return '💍';
      case 'car': return '🏎️';
      case 'rocket': return '🚀';
      case 'castle': return '🏰';
      case 'galaxy': return '🌌';
      default: return '🎁';
    }
  };

  const getAnimationClass = () => {
    switch (giftId) {
      case 'heart': return 'animate-heart-burst';
      case 'car': return 'animate-car-drift';
      case 'rocket': return 'animate-rocket-launch';
      case 'galaxy': return 'animate-galaxy-zoom';
      default: return 'animate-bounce scale-150';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden">
      <div className={cn("text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]", getAnimationClass())}>
        {getEmoji()}
      </div>
      
      {/* Visual Sparks for high-tier gifts */}
      {(giftId === 'galaxy' || giftId === 'rocket') && (
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] animate-pulse" />
      )}
    </div>
  );
}
