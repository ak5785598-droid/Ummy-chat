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
<<<<<<< HEAD
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
=======
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
>>>>>>> 25ae871d6cc1abb83059ea77d78bead509a9f839
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 25ae871d6cc1abb83059ea77d78bead509a9f839
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
