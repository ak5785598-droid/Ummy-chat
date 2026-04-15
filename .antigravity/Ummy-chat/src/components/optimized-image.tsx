'use client';

import Image from 'next/image';
import { useState } from 'react';
import { usePerformanceOptimizer } from '@/hooks/use-performance-optimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority = false,
  fallbackSrc 
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const { shouldUseLowQuality } = usePerformanceOptimizer();

  // Convert to WebP format if supported and high quality is not needed
  const getOptimizedSrc = (originalSrc: string) => {
    if (shouldUseLowQuality() && originalSrc.includes('.png')) {
      return originalSrc.replace('.png', '.webp');
    }
    if (shouldUseLowQuality() && originalSrc.includes('.jpg')) {
      return originalSrc.replace('.jpg', '.webp');
    }
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src);
  const currentSrc = imageError && fallbackSrc ? fallbackSrc : optimizedSrc;

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setImageError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={shouldUseLowQuality() ? 60 : 80}
    />
  );
}
