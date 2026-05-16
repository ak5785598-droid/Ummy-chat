'use client';

import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  type: 'music-note' | 'heart' | 'star';
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  rotation: number;
}

const generateParticles = (count: number): Particle[] => {
  const types: Particle['type'][] = ['music-note', 'heart', 'star'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    type: types[i % 3],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 20 + Math.random() * 40,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 4,
    opacity: 0.3 + Math.random() * 0.5,
    rotation: Math.random() * 360,
  }));
};

const ParticleIcon = ({ type, size }: { type: Particle['type']; size: number }) => {
  const iconSize = size;
  switch (type) {
    case 'music-note':
      return (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-fuchsia-400"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );
    case 'heart':
      return (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-pink-400"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'star':
      return (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-amber-400"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
  }
};

interface LoginBackgroundProps {
  fallbackImage?: string;
  className?: string;
}

export function LoginBackground({ fallbackImage, className }: LoginBackgroundProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!reducedMotion) {
      setParticles(generateParticles(25));
    }
  }, [reducedMotion]);

  const memoizedParticles = useMemo(() => particles, [particles]);

  if (reducedMotion || particles.length === 0) {
    return (
      <div
        className={cn('absolute inset-0 bg-cover bg-center', className)}
        style={{ backgroundImage: `url('${fallbackImage || '/images/login_bg.png'}')` }}
      />
    );
  }

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Base Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#B027FF]/30 to-fuchsia-900" />

      {/* Glossy Radial Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(176,39,255,0.3)_0%,rgba(0,0,0,0.6)_100%)] animate-pulse-glow" />

      {/* Floating Particles */}
      {memoizedParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            opacity: particle.opacity,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        >
          <ParticleIcon type={particle.type} size={particle.size} />
        </div>
      ))}

      {/* Fallback Image Overlay (Optional) */}
      {fallbackImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: `url('${fallbackImage}')` }}
        />
      )}
    </div>
  );
}
