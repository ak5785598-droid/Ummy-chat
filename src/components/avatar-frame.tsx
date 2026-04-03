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

const EliteFrameRenderer = ({ config }: { config: AvatarFrameConfig }) => {
  const { 
    gradient, borderColor, glowColor, ornament: Ornament, animationType,
    extraType, particleType, textureType, extraColor, particleColor
  } = config;

  const getAnimation = () => {
    switch (animationType) {
      case 'rotate': return { rotate: 360 };
      case 'pulse': return { scale: [1, 1.05, 1] };
      case 'float': return { y: [-3, 3, -3] };
      case 'sparkle': return { opacity: [0.7, 1, 0.7] };
      case 'flow': return { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] };
      default: return {};
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full rounded-full p-[1px] overflow-visible">
      <BackdropLayer type={extraType} color={extraColor || borderColor} />

      <motion.div
        animate={getAnimation()}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-15%] rounded-full blur-xl opacity-30 z-0 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      <motion.div
        animate={animationType === 'rotate' ? { rotate: 360 } : {}}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full z-10 "
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
          padding: '2.5px',
          maskImage: 'radial-gradient(circle, transparent 48%, black 49%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 48%, black 49%)',
          boxShadow: `0 0 10px ${glowColor}`
        }}
      >
        <div className="w-full h-full rounded-full border-[1px]" style={{ borderColor: `${borderColor}66` }} />
      </motion.div>

      <ParticleSystem type={particleType} color={particleColor || borderColor} />

      {Ornament && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-[60] drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {typeof Ornament === 'string' ? (
              <span className="text-3xl">{Ornament}</span>
            ) : (
              <Ornament className="w-10 h-10" style={{ color: borderColor, strokeWidth: 1.5 }} />
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24'
  };

  const config = frameId ? AVATAR_FRAMES[frameId] : null;
  const isElite = !!config;

  return (
    <div className={cn('relative flex items-center justify-center shrink-0', sizeClasses[size], className)}>
      <AnimatePresence>
        {isElite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            <EliteFrameRenderer config={config} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "relative rounded-full w-full h-full bg-transparent overflow-hidden"
      )}>
        {children}
      </div>
    </div>
  );
}
