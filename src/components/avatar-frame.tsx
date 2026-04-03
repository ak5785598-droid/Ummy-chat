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
    case 'aurora-wings':
      return (
        <div className="absolute inset-[-45%] z-[-5] pointer-events-none flex items-center justify-center opacity-80 overflow-visible">
          {/* Left Wing */}
          <motion.div 
            animate={{ rotate: [-2, 2, -2], x: [-5, 0, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 w-1/2 h-full origin-right"
          >
             <div className="w-full h-full bg-[radial-gradient(ellipse_at_right,var(--tw-gradient-stops))] from-blue-400 via-purple-500/40 to-transparent blur-md" style={{ '--tw-gradient-from': color } as any} />
             <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,white_12px)]" />
          </motion.div>
          {/* Right Wing */}
          <motion.div 
            animate={{ rotate: [2, -2, 2], x: [5, 0, 5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-0 w-1/2 h-full origin-leftScale-x-[-1]"
          >
             <div className="w-full h-full bg-[radial-gradient(ellipse_at_left,var(--tw-gradient-stops))] from-blue-400 via-purple-500/40 to-transparent blur-md" style={{ '--tw-gradient-from': color } as any} />
             <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,white_12px)]" />
          </motion.div>
        </div>
      );
    case 'dragon-wrap':
      return (
        <div className="absolute inset-[-15%] z-[60] pointer-events-none overflow-visible">
          <motion.div
            animate={{ rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-full h-full flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] drop-shadow-[0_0_10px_rgba(255,183,0,0.8)]">
              <path 
                d="M85 50 C 85 80, 50 95, 20 80 C 5 70, 0 50, 15 30 C 30 10, 80 15, 85 50" 
                fill="none" 
                stroke={color} 
                strokeWidth="4" 
                strokeLinecap="round"
                className="opacity-90"
              />
              <path 
                d="M85 50 L 92 45 L 88 55 Z" 
                fill={color} 
              />
              <circle cx="82" cy="48" r="1.5" fill="red" className="animate-pulse" />
            </svg>
          </motion.div>
        </div>
      );
    case 'constellation':
      return (
        <div className="absolute inset-[-40%] z-[-2] pointer-events-none opacity-40">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="w-full h-full relative"
          >
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-[1px] bg-sky-400/40"
                style={{
                  height: '40%',
                  top: '30%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  boxShadow: `0 0 10px ${color}`
                }}
              />
            ))}
          </motion.div>
        </div>
      );
    case 'halo':
      return (
        <div className="absolute inset-[-20%] z-0 pointer-events-none">
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
        <div className="absolute inset-[-40%] z-[-1] pointer-events-none flex items-center justify-center">
          <motion.svg viewBox="0 0 200 200" className="w-full h-full opacity-80">
            <path d="M100 100 C 60 40, 20 60, 10 100 C 20 140, 60 160, 100 100 Z" fill={color} />
            <path d="M100 100 C 140 40, 180 60, 190 100 C 180 140, 140 160, 100 100 Z" fill={color} />
          </motion.svg>
        </div>
      );
    default: return null;
  }
};

const ParticleSystem = ({ type, color }: { type?: string, color: string }) => {
  if (!type || type === 'none') return null;
  
  let count = 8;
  if (type === 'matrix') count = 12;
  if (type === 'sparkle' || type === 'star') count = 15;

  return (
    <div className="absolute inset-[-30%] pointer-events-none z-50 overflow-visible">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute", (type === 'star' || type === 'gold-sparkle') ? "rotate-45" : "rounded-full")}
          style={{ 
            width: (type === 'star') ? '6px' : (type === 'matrix' ? '2px' : '4px'), 
            height: (type === 'star') ? '6px' : (type === 'matrix' ? '8px' : '4px'),
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: `0 0 10px ${color}`,
            clipPath: type === 'star' ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : undefined
          }}
          animate={{ 
            y: [-30, 30],
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
            rotate: type === 'star' ? [0, 360] : 0
          }}
          transition={{ 
            duration: 2 + Math.random() * 3, 
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
      case 'pulse': return { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] };
      case 'float': return { y: [-4, 4, -4] };
      case 'sparkle': return { opacity: [0.5, 1, 0.5], scale: [0.98, 1.02, 0.98] };
      case 'flow': return { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] };
      case 'matrix': return { opacity: [0.4, 0.9, 0.4] };
      default: return {};
    }
  };

  const transition: any = {
    duration: animationType === 'rotate' ? 6 : (animationType === 'matrix' ? 0.2 : 3),
    repeat: Infinity,
    ease: "linear"
  };

  return (
    <div className="absolute inset-0 w-full h-full rounded-full p-[1px] overflow-visible">
      <BackdropLayer type={extraType} color={extraColor || borderColor} />

      <motion.div
        animate={getAnimation()}
        transition={transition}
        className="absolute inset-[-25%] rounded-full blur-2xl opacity-40 z-0 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      <motion.div
        animate={animationType === 'rotate' ? { rotate: 360 } : {}}
        transition={transition}
        className="absolute inset-[12%] rounded-full z-10 shadow-[inset_0_4px_8px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.5)]"
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
          padding: '3px',
          maskImage: 'radial-gradient(circle, transparent 47%, black 48%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 47%, black 48%)',
          boxShadow: `0 0 12px ${glowColor}, inset 0 0 8px rgba(0,0,0,0.6)`
        }}
      >
        {textureType !== 'none' && (
          <div className="absolute inset-0 opacity-40 mix-blend-overlay overflow-hidden rounded-full">
             <div className={cn(
               "w-full h-full",
               textureType === 'lava' ? "bg-[radial-gradient(circle,#ff4d00_10%,transparent_80%)] bg-[length:10px_10px]" :
               textureType === 'ice' ? "bg-[linear-gradient(45deg,#fff_10%,transparent_20%)] bg-[length:5px_5px]" :
               "bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.2)_80%)]"
             )} />
          </div>
        )}

        <div className="w-full h-full rounded-full border-[1.2px]" style={{ borderColor: `${borderColor}88` }} />
      </motion.div>

      <ParticleSystem type={particleType} color={particleColor || borderColor} />

      {Ornament && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-[100] drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
          <motion.div
            animate={{ 
              y: [-2, 4, -2],
              scale: [1, 1.1, 1],
              filter: ["brightness(1) contrast(1) drop-shadow(0 0 5px rgba(255,255,255,0.4))", "brightness(1.3) contrast(1.1) drop-shadow(0 0 15px rgba(255,255,255,0.8))", "brightness(1) contrast(1) drop-shadow(0 0 5px rgba(255,255,255,0.4))"]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {Ornament === 'gem-crown' ? (
              <div className="flex flex-col items-center">
                 <div className="w-8 h-10 bg-gradient-to-t from-purple-600 via-pink-400 to-white clip-path-gem shadow-[0_0_20px_purple]" style={{ clipPath: "polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%, 0% 30%)" }} />
                 <div className="w-12 h-2 bg-yellow-500 rounded-full mt-[-2px] border border-white/20" />
              </div>
            ) : Ornament === 'celestial-star' ? (
              <div className="relative">
                <div className="w-10 h-10 bg-white/90 shadow-[0_0_30px_white] rotate-45" style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }} />
                <div className="absolute inset-0 animate-ping bg-white/40 rounded-full blur-xl scale-150" />
              </div>
            ) : typeof Ornament === 'string' ? (
              <span className="text-4xl filter drop-shadow-lg">{Ornament}</span>
            ) : (
              <Ornament className="w-12 h-12" style={{ color: borderColor, strokeWidth: 1.5 }} />
            )}
          </motion.div>
        </div>
      )}

      {/* Glossy Overlay */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full z-50 pointer-events-none opacity-20 overflow-hidden"
        style={{
          maskImage: 'radial-gradient(circle, transparent 40%, black 41%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 41%)',
        }}
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(transparent,rgba(255,255,255,0.4),transparent_40%)]" />
      </motion.div>
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            <EliteFrameRenderer config={config} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "relative rounded-full w-full h-full bg-slate-900 shadow-xl overflow-hidden",
        !isElite && "ring-2 ring-white/10"
      )}>
        {children}
      </div>
    </div>
  );
}
