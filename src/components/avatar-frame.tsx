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
 * Uses Framer Motion + Conic Gradients for Wafa/Haza style high-fidelity animations.
 */
const EliteFrameRenderer = ({ frameId }: { frameId: string }) => {
  switch (frameId) {
    case 'elite-mythic-gold':
    case 'supreme-king':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full p-[2px] overflow-visible" 
             style={{ transform: 'perspective(1000px) rotateX(15deg)' }}>
          {/* Real 3D Depth Shadow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600/20 to-orange-800/40 blur-xl" 
               style={{ transform: 'translateZ(-20px)' }} />
          
          {/* Outer 3D Ring with Real Depth */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-20%] rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700, #FFB700, #FFD700)',
              boxShadow: '0 0 40px #FFD700, 0 0 80px #FFA500, inset 0 0 20px rgba(255,215,0,0.5)',
              transform: 'translateZ(10px) rotateX(15deg)'
            }}
          />
          
          {/* Inner 3D Metallic Ring */}
          <div className="absolute inset-0 rounded-full border-[6px]" 
               style={{ 
                 background: 'linear-gradient(145deg, #FFD700, #B8860B, #FFD700, #FFA500)',
                 borderColor: '#FFD700',
                 boxShadow: 
                   '0 0 30px rgba(255,215,0,0.8), ' +
                   '0 0 60px rgba(255,165,0,0.6), ' +
                   'inset 0 0 20px rgba(255,215,0,0.3), ' +
                   'inset 0 0 10px rgba(0,0,0,0.2)',
                 transform: 'translateZ(5px)'
               }} />
          
          {/* Animated Glow Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.5, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 3 + i * 0.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.3
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, #FFD700, #FFA500)',
                boxShadow: '0 0 10px #FFD700, 0 0 20px #FFA500',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-60px) translateZ(15px)`
              }}
            />
          ))}
          
          {/* 3D Crown with Depth */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-[50]"
            style={{
              filter: 'drop-shadow(0 0 15px #FFD700) drop-shadow(0 0 30px #FFA500)',
              transform: 'translateZ(20px)'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="url(#goldGradient)" stroke="#fff" strokeWidth="1">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
              </defs>
              <path d="M5 21L3 18L5 15L7 18M19 21L21 18L19 15L17 18M12 21L14 18L12 15L10 18M5 15L12 5L19 15H5Z" />
              <circle cx="12" cy="4" r="2" fill="#ef4444" />
            </svg>
          </motion.div>
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

    case '3d-neon-dragon':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible"
             style={{ transform: 'perspective(1200px) rotateX(10deg) rotateY(5deg)' }}>
          {/* Dragon Scale Pattern */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-15%] rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #FF006E, #8338EC, #3A86FF, #06FFB4, #FFD60A, #FF006E)',
              boxShadow: '0 0 50px #FF006E, 0 0 100px #8338EC, inset 0 0 30px rgba(255,0,110,0.4)',
              transform: 'translateZ(8px)'
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
                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-70px) translateZ(12px)`
              }}
            />
          ))}
        </div>
      );

    case '3d-holographic':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible"
             style={{ transform: 'perspective(1500px) rotateX(20deg)' }}>
          {/* Holographic Layers */}
          <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-10%] rounded-full"
            style={{
              background: 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00, #FF00FF)',
              boxShadow: '0 0 60px rgba(255,0,255,0.8), 0 0 120px rgba(0,255,255,0.6)',
              transform: 'translateZ(6px)',
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
                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-65px) translateZ(10px)`
              }}
            />
          ))}
        </div>
      );

    case '3d-royal-phoenix':
      return (
        <div className="absolute inset-0 w-full h-full rounded-full overflow-visible"
             style={{ transform: 'perspective(1000px) rotateX(12deg)' }}>
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
              boxShadow: '0 0 80px #FF4500, 0 0 160px #FF6347, inset 0 0 40px rgba(255,69,0,0.6)',
              transform: 'translateZ(12px)'
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
                transform: `translate(-50%, -50%) rotate(${i * 22.5}deg) translateY(-75px) translateZ(15px)`
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
