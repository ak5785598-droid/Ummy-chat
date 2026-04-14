'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveIndicatorProps {
  isSpeaking: boolean;
  intensity: number;
  accentColor?: string;
  className?: string;
}

/**
 * VoiceWaveIndicator - Dynamic voice wave animation based on actual voice intensity
 * Intensity ranges from 0-100 and determines animation speed and border thickness
 */
export function VoiceWaveIndicator({ 
  isSpeaking, 
  intensity, 
  accentColor = '#FFCC00', 
  className 
}: VoiceWaveIndicatorProps) {
  // Determine wave class based on intensity
  const waveClass = useMemo(() => {
    if (!isSpeaking || intensity === 0) return '';
    
    if (intensity < 25) return 'voice-wave-low';
    if (intensity < 50) return 'voice-wave-medium';
    if (intensity < 75) return 'voice-wave-high';
    return 'voice-wave-intense';
  }, [isSpeaking, intensity]);

  // Calculate dynamic scale based on intensity
  const dynamicScale = useMemo(() => {
    if (!isSpeaking || intensity === 0) return 1;
    return 1 + (intensity / 100) * 0.4; // Scale from 1.0 to 1.4
  }, [isSpeaking, intensity]);

  // Calculate dynamic opacity based on intensity
  const dynamicOpacity = useMemo(() => {
    if (!isSpeaking || intensity === 0) return 0;
    return 0.3 + (intensity / 100) * 0.7; // Opacity from 0.3 to 1.0
  }, [isSpeaking, intensity]);

  if (!isSpeaking || intensity === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "absolute inset-0 rounded-full border-[1.5px] z-0 will-change-[transform,opacity]",
        waveClass,
        className
      )}
      style={{ 
        color: accentColor,
        borderColor: accentColor,
        transform: `scale(${1 + (intensity / 100) * 0.12})`, // Smaller scale (1.12 max)
        opacity: dynamicOpacity,
      }}
    />
  );
}
