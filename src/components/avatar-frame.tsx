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
const EliteFrameRenderer = ({ config }: { config: AvatarFrameConfig }) => {
  const { gradient, borderColor, glowColor, ornament: Ornament, animationType } = config;

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
      {/* 1. LAYER: Deep Background Glow (Atmospheric) */}
      <motion.div
        animate={getAnimation()}
        transition={transition}
        className="absolute inset-[-25%] rounded-full blur-2xl opacity-30 z-0 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      {/* 2. LAYER: 3D Bevel Base (The thick part) */}
      <motion.div
        animate={animationType === 'rotate' ? { rotate: 360 } : {}}
        transition={transition}
        className="absolute inset-0 rounded-full z-10 shadow-[box-shadow:inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.4)]"
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
          padding: '5px', // Thicker frame
          maskImage: 'radial-gradient(circle, transparent 42%, black 43%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 42%, black 43%)',
          boxShadow: `0 0 15px ${glowColor}, inset 0 0 10px rgba(0,0,0,0.5)`
        }}
      >
        {/* Inner Bevel Ring */}
        <div 
          className="w-full h-full rounded-full border-[1px]" 
          style={{ borderColor: `${borderColor}66`, boxShadow: `inset 0 0 5px ${borderColor}44` }} 
        />
      </motion.div>

      {/* 3. LAYER: Glossy Shine Overlay */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full z-20 pointer-events-none opacity-40 overflow-hidden"
        style={{
          maskImage: 'radial-gradient(circle, transparent 42%, black 43%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 42%, black 43%)',
        }}
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(transparent,rgba(255,255,255,0.4),transparent_60%)]" />
      </motion.div>

      {/* 4. LAYER: Ornament (3D Positioning & Glow) */}
      {Ornament && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[50] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          <motion.div
            animate={{ 
              y: [-3, 3, -3],
              filter: [`drop-shadow(0 0 2px ${borderColor})`, `drop-shadow(0 0 8px ${borderColor})`, `drop-shadow(0 0 2px ${borderColor})`]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {typeof Ornament === 'string' ? (
              <span className="text-3xl filter drop-shadow-md">{Ornament}</span>
            ) : (
              <Ornament 
                className="w-8 h-8" 
                style={{ 
                  color: borderColor, 
                  fill: animationType === 'pulse' ? borderColor : 'currentColor',
                  strokeWidth: 2.5
                }} 
              />
            )}
          </motion.div>
        </div>
      )}

      {/* 5. LAYER: Special Tier Effects (Matrix) */}
      {animationType === 'matrix' && (
         <div className="absolute inset-0 rounded-full overflow-hidden opacity-40 pointer-events-none z-30">
            <div 
               className="w-full h-full bg-[linear-gradient(transparent_0%,#22c55e_50%,transparent_100%)] bg-[length:100%_8px] animate-[matrix_0.8s_linear_infinite]" 
               style={{ maskImage: 'radial-gradient(circle, transparent 42%, black 43%)', WebkitMaskImage: 'radial-gradient(circle, transparent 42% , black 43%)' }}
            />
         </div>
      )}

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
            className="absolute inset-[-15%] z-10 pointer-events-none flex items-center justify-center overflow-visible"
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
