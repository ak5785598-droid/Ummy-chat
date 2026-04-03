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

  const transition = {
    duration: animationType === 'rotate' ? 6 : (animationType === 'matrix' ? 0.2 : 3),
    repeat: Infinity,
    ease: "linear"
  };

  return (
    <div className="absolute inset-0 w-full h-full rounded-full p-[2px] overflow-visible">
      {/* Background Glow / Aura */}
      <motion.div
        animate={getAnimation()}
        transition={transition}
        className="absolute inset-[-15%] rounded-full blur-xl opacity-40 z-0"
        style={{ backgroundColor: glowColor }}
      />

      {/* Main Animated Ring */}
      <motion.div
        animate={animationType === 'rotate' ? { rotate: 360 } : {}}
        transition={transition}
        className="absolute inset-0 rounded-full z-10"
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
          padding: '4px',
          maskImage: 'radial-gradient(circle, transparent 44%, black 45%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 44%, black 45%)',
        }}
      >
        <div 
          className="w-full h-full rounded-full border-2" 
          style={{ borderColor: `${borderColor}44` }} 
        />
      </motion.div>

      {/* Ornament (Crowns, Stars, etc.) */}
      {Ornament && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-[40] drop-shadow-lg">
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {typeof Ornament === 'string' ? (
              <span className="text-2xl">{Ornament}</span>
            ) : (
              <Ornament className="w-6 h-6" style={{ color: borderColor, fill: 'currentColor' }} />
            )}
          </motion.div>
        </div>
      )}

      {/* Extra Effects for Matrix/Legendary Tiers */}
      {animationType === 'matrix' && (
         <div className="absolute inset-0 rounded-full overflow-hidden opacity-30 pointer-events-none">
            <div className="w-full h-full bg-[linear-gradient(transparent_0%,#22c55e_50%,transparent_100%)] bg-[length:100%_4px] animate-[matrix_1s_linear_infinite]" />
         </div>
      )}

      <style jsx>{`
        @keyframes matrix {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
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
