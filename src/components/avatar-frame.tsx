'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AVATAR_FRAMES, AvatarFrameConfig } from '@/constants/avatar-frames';

interface AvatarFrameProps {
  frameId?: string | null;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Universal High-Fidelity 3D Frame Engine
 * Renders 19+ premium frames using a data-driven registry.
 */
// Helper components for High-Fidelity layers
const BackdropLayer = ({ type, color }: { type?: string, color: string }) => {
  if (!type || type === 'none') return null;

  switch (type) {
    case 'wings':
      return (
        <div className="absolute inset-[-60%] z-[-1] flex items-center justify-center opacity-80 pointer-events-none">
          <motion.svg 
            viewBox="0 0 200 200" className="w-full h-full"
            animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* High-detail SVG Wings */}
            <path d="M100 100 C 60 40, 20 60, 10 120 C 30 140, 70 130, 90 110" fill={color} filter="blur(2px)" />
            <path d="M100 100 C 140 40, 180 60, 190 120 C 170 140, 130 130, 110 110" fill={color} filter="blur(2px)" />
            <path d="M100 100 C 50 20, 20 40, 5 100 C 25 120, 80 110, 95 105" fill={color} opacity="0.6" filter="blur(4px)" />
            <path d="M100 100 C 150 20, 180 40, 195 100 C 175 120, 120 110, 105 105" fill={color} opacity="0.6" filter="blur(4px)" />
          </motion.svg>
        </div>
      );
    case 'clouds':
      return (
        <div className="absolute inset-[-40%] bottom-[-50%] z-[-1] flex items-center justify-center pointer-events-none">
          {[1,2,3,4,5].map(i => (
            <motion.div
              key={i}
              className="absolute bg-white/60 blur-xl rounded-full"
              style={{ 
                width: 40 + i * 10, 
                height: 30 + i * 5, 
                left: `${15 + i * 12}%`,
                bottom: '10%'
              }}
              animate={{ x: [-5, 5, -5], y: [-2, 2, -2], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4 + i, repeat: Infinity }}
            />
          ))}
        </div>
      );
    case 'crystals':
      return (
        <div className="absolute inset-[-30%] z-[-1] pointer-events-none">
           {[0, 60, 120, 180, 240, 300].map(deg => (
             <motion.div
               key={deg}
               className="absolute top-1/2 left-1/2 w-4 h-12"
               style={{ 
                 background: `linear-gradient(to top, transparent, ${color})`,
                 clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                 transformOrigin: '0 0',
                 rotate: `${deg}deg`,
                 translate: '-50% -120%'
               }}
               animate={{ scaleY: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
               transition={{ duration: 3, repeat: Infinity, delay: deg/100 }}
             />
           ))}
        </div>
      );
    case 'sun-rays':
      return (
        <div className="absolute inset-[-50%] z-[-1] pointer-events-none flex items-center justify-center">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="w-full h-full"
             style={{
               background: `repeating-conic-gradient(from 0deg, ${color}33 0deg 10deg, transparent 10deg 20deg)`
             }}
           />
        </div>
      );
    case 'dragon-body':
      return (
        <div className="absolute inset-[-20%] z-10 pointer-events-none border-[6px] border-transparent rounded-full"
             style={{ 
               borderTopColor: color, 
               borderRightColor: color, 
               filter: `drop-shadow(0 0 8px ${color})`,
               rotate: '-45deg' 
             }}>
           <div className="absolute top-0 right-0 text-2xl rotate-45">🐲</div>
        </div>
      );
    default: return null;
  }
};

const ParticleSystem = ({ type, color }: { type?: string, color: string }) => {
  if (!type || type === 'none') return null;
  const count = type === 'matrix' ? 12 : 8;
  
  return (
    <div className="absolute inset-[-20%] pointer-events-none z-40 overflow-visible">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ 
            width: type === 'matrix' ? '2px' : '4px', 
            height: type === 'matrix' ? '8px' : '4px',
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: `0 0 8px ${color}`
          }}
          animate={{ 
            y: [-20, 20],
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5]
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
    <div className="absolute inset-0 w-full h-full rounded-full p-[1px] overflow-visible preserve-3d">
      {/* 1. LAYER: Extra Backdrop Assets (Wings, Clouds, etc) */}
      <BackdropLayer type={extraType} color={extraColor || borderColor} />

      {/* 2. LAYER: Deep Background Glow */}
      <motion.div
        animate={getAnimation()}
        transition={transition}
        className="absolute inset-[-25%] rounded-full blur-2xl opacity-40 z-0 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      {/* 3. LAYER: Main 3D Frame Body (Super Tight Fit) */}
      <motion.div
        animate={animationType === 'rotate' ? { rotate: 360 } : {}}
        transition={transition}
        className="absolute inset-[12%] rounded-full z-10 shadow-[box-shadow:inset_0_4px_8px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.5)]"
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
          padding: '3px', // Even thinner for elite feel
          maskImage: 'radial-gradient(circle, transparent 47%, black 48%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 47%, black 48%)',
          boxShadow: `0 0 12px ${glowColor}, inset 0 0 8px rgba(0,0,0,0.6)`
        }}
      >
        {/* Texture Layer (Lava/Ice/Gold patterns) */}
        {textureType !== 'none' && (
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
             <div className={cn(
               "w-full h-full",
               textureType === 'lava' ? "bg-[radial-gradient(circle,#ff4d00_10%,transparent_80%)] bg-[length:10px_10px]" :
               textureType === 'ice' ? "bg-[linear-gradient(45deg,#fff_10%,transparent_20%)] bg-[length:5px_5px]" :
               "bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.2)_80%)]"
             )} />
          </div>
        )}

        <div 
          className="w-full h-full rounded-full border-[1.2px]" 
          style={{ borderColor: `${borderColor}88`, boxShadow: `inset 0 0 6px ${borderColor}66` }} 
        />
      </motion.div>

      {/* 4. LAYER: Particle System */}
      <ParticleSystem type={particleType} color={particleColor || borderColor} />

      {/* 5. LAYER: Floating Ornament & Top Glow */}
      {Ornament && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-[60] drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
          <motion.div
            animate={{ 
              y: [-4, 4, -4],
              rotate: [0, 5, -5, 0],
              filter: [`drop-shadow(0 0 4px ${borderColor})`, `drop-shadow(0 0 12px ${borderColor})`, `drop-shadow(0 0 4px ${borderColor})`]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {typeof Ornament === 'string' ? (
              <span className="text-4xl filter drop-shadow-lg">{Ornament}</span>
            ) : (
              <Ornament 
                className="w-12 h-12" 
                style={{ 
                  color: borderColor, 
                  fill: 'currentColor',
                  strokeWidth: 2
                }} 
              />
            )}
          </motion.div>
        </div>
      )}

      {/* 6. LAYER: Glossy Shine Overlay */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full z-50 pointer-events-none opacity-30 overflow-hidden"
        style={{
          maskImage: 'radial-gradient(circle, transparent 40%, black 41%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 41%)',
        }}
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(transparent,rgba(255,255,255,0.6),transparent_40%)]" />
      </motion.div>

      <style jsx>{`
        @keyframes matrix {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
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
            className="absolute inset-[-40%] z-10 pointer-events-none flex items-center justify-center overflow-visible"
          >
             <EliteFrameRenderer config={config} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE AVATAR IMAGE (TOP LAYER) */}
      <div className={cn(
        "relative rounded-full w-full h-full bg-slate-900 shadow-xl overflow-visible",
        !isElite ? "ring-2 ring-white/10" : "z-[30]"
      )}>
        <div className="w-full h-full rounded-full overflow-hidden relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
