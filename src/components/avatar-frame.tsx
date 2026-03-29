'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AvatarFrameProps {
  frameId?: string | null;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Premium Elite Frame Engine
 * Uses Framer Motion + Conic Gradients for Wafa/Haza style high-fidelity animations.
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

    case 'elite-arctic-diamond':
    case 'top2family':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full p-[2px] overflow-visible">
          {/* Arctic Aura (BEHIND) */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-[-20%] rounded-full bg-cyan-400 blur-xl opacity-30"
            style={{
              maskImage: 'radial-gradient(circle, transparent 40%, black 45%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 45%)'
            }}
          />
          {/* Rotating Diamond Light (BEHIND) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-10%] rounded-full"
            style={{
              background: 'conic-gradient(transparent 0%, #BAE6FD 15%, transparent 30%, #7DD3FC 50%, transparent 70%, #BAE6FD 85%, transparent 100%)',
              maskImage: 'radial-gradient(circle, transparent 40%, black 45%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 45%)'
            }}
          />
          {/* Crystal Ring (BEHIND) */}
          <div className="absolute inset-0 rounded-full border-[3px] border-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
               style={{ 
                 background: 'linear-gradient(45deg, #E0F2FE 0%, #7DD3FC 50%, #0EA5E9 100%)',
                 maskImage: 'radial-gradient(circle, transparent 46%, black 47%)',
                 WebkitMaskImage: 'radial-gradient(circle, transparent 46%, black 47%)'
               }} />
          {/* Floating Gems (TOP OVERLAY) */}
          {[0, 90, 180, 270].map((deg) => (
            <motion.div
              key={deg}
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 2, delay: deg/90 * 0.5, repeat: Infinity }}
              className="absolute w-2 h-2 bg-white rotate-45 border border-cyan-400 z-[40] shadow-[0_0_5px_#fff]"
              style={{ 
                top: `${50 + 45 * Math.sin(deg * Math.PI / 180)}%`, 
                left: `${50 + 45 * Math.cos(deg * Math.PI / 180)}%`,
                transform: `translate(-50%, -50%) rotate(45deg)`
              }}
            />
          ))}
        </div>
      );

    case 'elite-phoenix-wild':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible">
          {/* Burning Core */}
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-[5px] border-orange-600 shadow-[0_0_25px_#EA580C]"
          />
          {/* Swirling Flames */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-25%] rounded-full opacity-70"
            style={{
              background: 'conic-gradient(transparent 0%, #F59E0B 20%, transparent 40%, #EF4444 60%, transparent 80%, #FACC15 100%)',
            }}
          />
          {/* Embers */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [-20, -60], 
                x: [0, (i % 2 === 0 ? 20 : -20)],
                opacity: [1, 0],
                scale: [1, 0]
              }}
              transition={{ duration: 2 + Math.random(), delay: i * 0.2, repeat: Infinity }}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full blur-[1px]"
              style={{ bottom: '10%', left: `${20 + i * 5}%` }}
            />
          ))}
        </div>
      );

    case 'elite-cosmic-purple':
    case 'neon-2025':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible">
          {/* Nebula Background (BEHIND) */}
          <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-10%] rounded-full opacity-60 blur-md"
             style={{ 
               background: 'radial-gradient(circle, #A855F7 0%, #6366F1 50%, #1E1B4B 100%)',
               maskImage: 'radial-gradient(circle, transparent 40%, black 45%)',
               WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 45%)'
             }}
          />
          {/* Neon Pulses (BEHIND) */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-[3px] border-purple-400 shadow-[0_0_20px_#A855F7]"
            style={{ 
              maskImage: 'radial-gradient(circle, transparent 46%, black 47%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 46%, black 47%)'
            }}
          />
          {/* Orbiting Stars (BEHIND/SIDE) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-30%] w-[160%] h-[160%] left-[-30%] top-[-30%]"
          >
            {[0, 120, 240].map((deg) => (
              <div
                key={deg}
                className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff]"
                style={{ 
                  top: `${50 + 50 * Math.sin(deg * Math.PI / 180)}%`, 
                  left: `${50 + 50 * Math.cos(deg * Math.PI / 180)}%` 
                }}
              />
            ))}
          </motion.div>
        </div>
      );

    case 'gold-mosque':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full border-[4px] border-yellow-500 overflow-visible">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl drop-shadow-md">🌙</div>
          <div className="absolute inset-0 rounded-full border border-yellow-300 opacity-40 animate-pulse" />
        </div>
      );

    default:
      return (
        <div className="absolute inset-0 w-full h-full rounded-full border-[3px] border-slate-200/50" />
      );
  }
};

export function AvatarFrame({ frameId, children, className, size = 'md' }: AvatarFrameProps) {
  if (!frameId || frameId === 'None' || frameId === 'Default') {
    return <div className={cn('relative', className)}>{children}</div>;
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* 
          ELITE FRAME LAYER (BEHIND CONTENT)
          Z-index 10 ensures it stays BELOW the avatar image center,
          while masks and relative positioning keep the aura visible around.
      */}
      <div className="absolute inset-[-15%] z-10 pointer-events-none flex items-center justify-center overflow-visible">
         <EliteFrameRenderer frameId={frameId} />
      </div>

      {/* CORE AVATAR IMAGE (TOP LAYER) */}
      <div className="relative z-[30] rounded-full overflow-hidden w-full h-full bg-slate-900 ring-2 ring-white/10 shadow-lg">
        {children}
      </div>
    </div>
  );
}
