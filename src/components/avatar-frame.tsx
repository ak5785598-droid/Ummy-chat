'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AvatarFrameProps {
  frameId?: string | null;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badgeType?: 'owner' | 'admin' | 'volunteer' | 'vip' | null;
}

/**
 * Premium Elite Frame Engine
 * Uses Framer Motion + Conic Gradients for high-fidelity animations.
 */
const EliteFrameRenderer = ({ frameId }: { frameId: string }) => {
  switch (frameId) {
    case 'elite-mythic-gold':
    case 'supreme-king':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full p-[2px] overflow-visible">
          {/* Rotating Shine Beam (BEHIND) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-15%] rounded-full opacity-80"
            style={{
              background: 'conic-gradient(transparent 0%, #FFD700 10%, transparent 20%, #FDB931 40%, transparent 50%, #FFD700 60%, transparent 80%, #FDB931 90%, transparent 100%)',
              maskImage: 'radial-gradient(circle, transparent 40%, black 45%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 45%)'
            }}
          />
          {/* Main Metallic Ring (BEHIND) */}
          <div className="absolute inset-0 rounded-full border-[4px] border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]" 
               style={{ 
                 background: 'linear-gradient(135deg, #FFF281 0%, #FFB700 50%, #B8860B 100%)',
                 maskImage: 'radial-gradient(circle, transparent 46%, black 47%)',
                 WebkitMaskImage: 'radial-gradient(circle, transparent 46%, black 47%)'
               }} />
          {/* Glowing Crown Icon (TOP OVERLAY) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-[40] drop-shadow-[0_0_10px_#FFD700]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFD700" stroke="#fff" strokeWidth="1">
              <path d="M5 21L3 18L5 15L7 18M19 21L21 18L19 15L17 18M12 21L14 18L12 15L10 18M5 15L12 5L19 15H5Z" />
              <circle cx="12" cy="4" r="2" fill="#ef4444" />
            </svg>
          </div>
        </div>
      );

    case '3d-neon-dragon':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible">
          {/* Dragon Scale Pattern */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-15%] rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #FF006E, #8338EC, #3A86FF, #06FFB4, #FFD60A, #FF006E)',
              boxShadow: '0 0 50px #FF006E, 0 0 100px #8338EC, inset 0 0 30px rgba(255,0,110,0.4)'
            }}
          />
          {/* Dragon Eye Effects */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.4
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: 'radial-gradient(circle, #FF006E, #8338EC)',
                boxShadow: '0 0 20px #FF006E, 0 0 40px #8338EC',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-70px)`
              }}
            />
          ))}
        </div>
      );

    case '3d-holographic':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible">
          {/* Holographic Layers */}
          <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-10%] rounded-full"
            style={{
              background: 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00, #FF00FF)',
              boxShadow: '0 0 60px rgba(255,0,255,0.8), 0 0 120px rgba(0,255,255,0.6)',
              mixBlendMode: 'screen'
            }}
          />
          {/* Floating Holographic Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [-30, 30, -30],
                x: [0, 20, 0, -20, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 4 + i * 0.3, 
                repeat: Infinity
              }}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: `hsl(${i * 30}, 100%, 50%)`,
                boxShadow: `0 0 15px hsl(${i * 30}, 100%, 50%)`,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-65px)`
              }}
            />
          ))}
        </div>
      );

    case '3d-royal-phoenix':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible">
          {/* Phoenix Fire Ring */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-[-18%] rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #FF4500, #FF6347, #FFD700, #FF8C00, #FF4500)',
              boxShadow: '0 0 80px #FF4500, 0 0 160px #FF6347, inset 0 0 40px rgba(255,69,0,0.6)'
            }}
          />
          {/* Phoenix Feather Particles */}
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [-40, 40, -40],
                rotate: [0, 180, 360],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 3 + i * 0.2, 
                repeat: Infinity,
                delay: i * 0.1
              }}
              className="absolute w-2 h-3 rounded-full"
              style={{
                background: 'linear-gradient(45deg, #FF4500, #FFD700)',
                boxShadow: '0 0 25px #FF4500, 0 0 50px #FFD700',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 22.5}deg) translateY(-75px)`
              }}
            />
          ))}
        </div>
      );

    default:
      return (
        <div className="absolute inset-0 w-full h-full rounded-full border-[3px] border-slate-200/50" />
      );
  }
};

export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24'
  };

  const isNoFrame = !frameId || frameId === 'None' || frameId === 'Default';

  return (
    <div className={cn('relative flex items-center justify-center shrink-0', sizeClasses[size], className)}>
      {!isNoFrame && (
        /* ELITE FRAME LAYER (BEHIND CONTENT) */
        <div className="absolute inset-[-15%] z-10 pointer-events-none flex items-center justify-center overflow-visible">
           <EliteFrameRenderer frameId={frameId as string} />
        </div>
      )}

      {/* CORE AVATAR IMAGE (TOP LAYER) */}
      <div className={cn(
        "relative rounded-full w-full h-full bg-slate-900 shadow-xl overflow-visible",
        isNoFrame ? "ring-2 ring-white/10" : "z-[30]"
      )}>
        <div className="w-full h-full rounded-full overflow-hidden relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
