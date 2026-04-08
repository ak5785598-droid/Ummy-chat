'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AVATAR_FRAMES, type AvatarFrameConfig } from '@/constants/avatar-frames';

interface AvatarFrameProps {
  frameId?: string | null;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BackdropLayer = ({ type, color }: { type?: string, color: string }) => {
  if (!type || type === 'none') return null;

  switch (type) {
    case 'halo':
      return (
        <div className="absolute inset-[-15%] z-0 pointer-events-none">
           <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-full h-full border-[2px] border-dashed rounded-full"
            style={{ borderColor: `${color}88` }}
           />
        </div>
      );
    case 'wings':
      return (
        <div className="absolute inset-[-30%] z-[-1] pointer-events-none flex items-center justify-center">
          <motion.svg viewBox="0 0 200 200" className="w-full h-full opacity-70">
            <path d="M100 100 C 60 40, 20 60, 10 100 C 20 140, 60 160, 100 100 Z" fill={color} />
            <path d="M100 100 C 140 40, 180 60, 190 100 C 180 140, 140 160, 100 100 Z" fill={color} />
          </motion.svg>
        </div>
      );
    case 'dragon-body':
      return (
        <div className="absolute inset-[-15%] z-10 pointer-events-none border-[4px] border-transparent rounded-full"
             style={{ 
               borderTopColor: color, 
               borderRightColor: color, 
               filter: `drop-shadow(0 0 8px ${color})`,
               rotate: '-45deg' 
             }}>
           <div className="absolute top-0 right-0 text-xl rotate-45">🐲</div>
        </div>
      );
    case 'sun-rays':
      return (
        <div className="absolute inset-[-40%] z-[-1] pointer-events-none flex items-center justify-center">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="w-full h-full"
             style={{
               background: `repeating-conic-gradient(from 0deg, ${color}22 0deg 10deg, transparent 10deg 20deg)`
             }}
           />
        </div>
      );
    default: return null;
  }
};

const ParticleSystem = ({ type, color }: { type?: string, color: string }) => {
  if (!type || type === 'none') return null;
  const count = type === 'matrix' ? 10 : 6;
  
  return (
    <div className="absolute inset-[-15%] pointer-events-none z-40 overflow-visible">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ 
            width: type === 'matrix' ? '2px' : '3px', 
            height: type === 'matrix' ? '6px' : '3px',
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: `0 0 5px ${color}`
          }}
          animate={{ 
            y: [-15, 15],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2, 
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
};

const EliteFrameRenderer = ({ config, pixelSize }: { config: AvatarFrameConfig, pixelSize: number }) => {
  const { 
    gradient, borderColor, glowColor, ornament: Ornament, animationType,
    extraType, particleType, extraColor, particleColor, id, imageUrl
  } = config;

  const isSakura = id === 'sakura-blossom';

  // Calculate pixel-perfect dimensions with dynamic hole sizing
  const multiplier = config.scaleMultiplier || 1.54;
  const imgSize = pixelSize * multiplier;
  const imgRadius = imgSize / 2;
  
  // Precise hole radius in pixels
  const holeRadius = config.holeRatio 
    ? (imgRadius * config.holeRatio) 
    : (pixelSize / 2);

  return (
    <div className="absolute inset-0 w-full h-full rounded-full overflow-visible pointer-events-none z-[100]">
      {/* Background Extras */}
      <BackdropLayer type={extraType} color={extraColor || borderColor} />

      {/* 3D Tubelike Frame Body or Image Frame */}
      {imageUrl ? (
        <div 
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${imgSize}px`,
            height: `${imgSize}px`,
            transform: `translate(calc(-50% + ${config.offsetX || 0}px), calc(-50% + ${config.offsetY || 0}px))`,
            // Accurate pixel-based mask
            maskImage: `radial-gradient(circle at center, transparent ${holeRadius - 0.5}px, black ${holeRadius}px, black ${imgRadius - 1}px, transparent ${imgRadius}px)`,
            WebkitMaskImage: `radial-gradient(circle at center, transparent ${holeRadius - 0.5}px, black ${holeRadius}px, black ${imgRadius - 1}px, transparent ${imgRadius}px)`,
          }}
        >
          <img 
            src={imageUrl} 
            alt={config.name} 
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <motion.div
          animate={animationType === 'rotate' ? { rotate: 360 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-10 shadow-2xl"
          style={{
            width: `${pixelSize + 22}px`,
            height: `${pixelSize + 22}px`,
            padding: '8.5px',
            background: gradient,
            backgroundSize: '200% 200%',
            boxShadow: `
              0 0 20px ${glowColor},
              inset 0 0 12px rgba(0,0,0,0.6),
              inset 0 0 6px rgba(255,255,255,0.4)
            `,
            maskImage: `radial-gradient(circle at center, transparent ${(pixelSize/2) + 1.5}px, black ${(pixelSize/2) + 2}px)`,
            WebkitMaskImage: `radial-gradient(circle at center, transparent ${(pixelSize/2) + 1.5}px, black ${(pixelSize/2) + 2}px)`,
          }}
        >
          {/* Shine Highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none opacity-60 shadow-inner" />
        </motion.div>
      )}

      {/* Particles */}
      <ParticleSystem type={particleType} color={particleColor || borderColor} />

      {/* Ornaments Layer */}
      {isSakura ? (
        <>
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-[110] w-14 h-14 pointer-events-none drop-shadow-2xl overflow-visible">
             <img src="/images/frames/sakura_branch.png" alt="" className="w-full h-full object-contain mix-blend-screen scale-x-[-1] brightness-125 rotate-[-20deg]" />
          </div>
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-[110] w-14 h-14 pointer-events-none drop-shadow-2xl overflow-visible">
             <img src="/images/frames/sakura_branch.png" alt="" className="w-full h-full object-contain mix-blend-screen brightness-125 rotate-[20deg]" />
          </div>
        </>
      ) : Ornament && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-[110] drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]">
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {typeof Ornament === 'string' ? (
              <span className="text-4xl">{Ornament}</span>
            ) : (
              <Ornament className="w-12 h-12" style={{ color: borderColor, strokeWidth: 1.5 }} />
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 100
  };

  const sizeClasses = {
    sm: 'h-[60px] w-[60px]',    // 60px total, ~40px hole
    md: 'h-[80px] w-[80px]',    // 80px total, ~60px hole
    lg: 'h-[100px] w-[100px]',  // 100px total, ~80px hole
    xl: 'h-[120px] w-[120px]'    // 120px total, ~100px hole
  };

  const pixelSize = sizeMap[size];
  const config = frameId ? AVATAR_FRAMES[frameId] : null;
  const isElite = !!config && frameId !== 'None';

  return (
    <div className={cn('relative flex items-center justify-center shrink-0 z-40 overflow-visible', sizeClasses[size], className)}>
      <AnimatePresence>
        {isElite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none overflow-visible"
          >
            <EliteFrameRenderer config={config} pixelSize={pixelSize} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "relative rounded-full bg-transparent overflow-visible flex items-center justify-center",
        // The display size of the avatar itself
        size === 'sm' ? 'w-10 h-10' : 
        size === 'md' ? 'w-[60px] h-[60px]' : 
        size === 'lg' ? 'w-20 h-20' : 
        'w-24 h-24'
      )}>
        {children}
      </div>
    </div>
  );
}
