'use client';

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AVATAR_FRAMES, type AvatarFrameConfig } from '@/constants/avatar-frames';
import { CompactVideoAvatarFrame } from '@/components/compact-video-avatar-frame';

interface AvatarFrameProps {
  frameId?: string | null;
  frameMediaUrl?: string | null;
  dynamicConfig?: AvatarFrameConfig | null;
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
           <div 
            className="w-full h-full border-[2px] border-dashed rounded-full"
            style={{ 
              borderColor: `${color}88`,
              animation: 'custom-spin 10s linear infinite'
            }}
           />
        </div>
      );
    case 'wings':
      return (
        <div className="absolute inset-[-30%] z-[-1] pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-70">
            <path d="M100 100 C 60 40, 20 60, 10 100 C 20 140, 60 160, 100 100 Z" fill={color} />
            <path d="M100 100 C 140 40, 180 60, 190 100 C 180 140, 140 160, 100 100 Z" fill={color} />
          </svg>
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
           <div 
             className="w-full h-full"
             style={{
               background: `repeating-conic-gradient(from 0deg, ${color}22 0deg 10deg, transparent 10deg 20deg)`,
               animation: 'custom-spin 20s linear infinite'
             }}
           />
        </div>
      );
    default: return null;
  }
};

const ParticleSystem = ({ type, color }: { type?: string, color: string }) => {
  if (!type || type === 'none') return null;
  // PERFORMANCE: Reduce particle count from 10/6 to 3 per avatar
  const count = 3; 
  
  return (
    <div className="absolute inset-[-15%] pointer-events-none z-40 overflow-visible">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{ 
            width: type === 'matrix' ? '2px' : '3px', 
            height: type === 'matrix' ? '6px' : '3px',
            backgroundColor: color,
            left: `${10 + (i * 30)}%`,
            top: `${20 + (i * 20)}%`,
            boxShadow: `0 0 5px ${color}`,
            animation: `custom-particle-float ${2 + i}s infinite ease-in-out`,
            animationDelay: `${i * 0.5}s`,
            opacity: 0
          }}
        />
      ))}
    </div>
  );
};

const EliteFrameRenderer = ({ config, pixelSize }: { config: AvatarFrameConfig, pixelSize: number }) => {
  const { id, imageUrl, borderColor, glowColor, gradient, animationType, extraType, extraColor, particleType, particleColor, ornament: Ornament } = config;
  const isSakura = id === 'sakura-blossom';
  const imgSize = pixelSize * 2.2;
  const isMediaFrame = imageUrl || config.videoUrl;

  return (
    <div className="absolute inset-0 w-full h-full rounded-full overflow-visible pointer-events-none z-[100]">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes custom-spin { 
          from { transform: translate(-50%, -50%) rotate(0deg); } 
          to { transform: translate(-50%, -50%) rotate(360deg); } 
        }
        @keyframes custom-float-frame {
          0%, 100% { transform: translate(calc(-50% + ${config.offsetX || 0}px), calc(-50% + ${config.offsetY || 0}px)) translateY(0); }
          50% { transform: translate(calc(-50% + ${config.offsetX || 0}px), calc(-50% + ${config.offsetY || 0}px)) translateY(-6px); }
        }
        @keyframes custom-particle-float { 
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-10px); opacity: 0.8; }
        }
        @keyframes custom-bounce-alt {
          0%, 100% { transform: translate(-50%, -3px); }
          50% { transform: translate(-50%, 3px); }
        }
        @keyframes custom-orbit-1 {
          0% { transform: rotate(0deg) translateX(${pixelSize * 0.7}px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(${pixelSize * 0.7}px) rotate(-360deg); }
        }
        @keyframes custom-orbit-2 {
          0% { transform: rotate(180deg) translateX(${pixelSize * 0.7}px) rotate(-180deg); }
          100% { transform: rotate(540deg) translateX(${pixelSize * 0.7}px) rotate(-540deg); }
        }
        @keyframes custom-butterfly-float-1 {
          0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 0; }
          50% { transform: translate(-12px, -25px) scale(0.8) rotate(15deg); opacity: 0.7; }
          100% { transform: translate(6px, -50px) scale(0.4) rotate(-10deg); opacity: 0; }
        }
        @keyframes custom-butterfly-float-2 {
          0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 0; }
          50% { transform: translate(12px, -30px) scale(0.8) rotate(-15deg); opacity: 0.7; }
          100% { transform: translate(-6px, -55px) scale(0.4) rotate(10deg); opacity: 0; }
        }
        @keyframes custom-bubble-float {
          0% { transform: translateY(15px) scale(0.4); opacity: 0; }
          50% { transform: translateY(-15px) scale(0.9); opacity: 0.6; }
          100% { transform: translateY(-40px) scale(0.4); opacity: 0; }
        }
        @keyframes custom-gold-sparkle {
          0%, 100% { transform: scale(0.5) rotate(0deg); opacity: 0.2; }
          50% { transform: scale(1) rotate(180deg); opacity: 0.9; }
        }
      `}} />

      {/* Background Extras */}
      <BackdropLayer type={extraType} color={extraColor || borderColor} />

      {/* SVG Filter for transparency (converts brightness to alpha) */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="remove-black-background">
          <feColorMatrix type="matrix" values="
            1.2 0 0 0 0  
            0 1.2 0 0 0  
            0 0 1.2 0 0  
            1.5 1.5 1.5 0 -0.6" 
          />
        </filter>
      </svg>

      {/* 3D Media Frame (Video or Image) */}
      {isMediaFrame ? (
        <div 
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${imgSize}px`,
            height: `${imgSize}px`,
            transform: `translate(calc(-50% + ${config.offsetX || 0}px), calc(-50% + ${config.offsetY || 0}px))`,
            maskImage: 'none',
            WebkitMaskImage: 'none',
            animation: 
              config.animationType === 'rotate' ? 'custom-spin 12s linear infinite' : 
              config.animationType === 'pulse' || config.animationType === 'float' || config.animationType === 'flow' || config.id === 'imperial-blue' ? 'custom-float-frame 4s ease-in-out infinite' : 
              'none',
          }}
        >
          {config.videoUrl ? (
            <video 
              src={config.videoUrl} 
              autoPlay 
              muted 
              loop 
              playsInline 
              preload="metadata"
              className="w-full h-full object-contain"
              style={{
                filter: `url(#remove-black-background) drop-shadow(0 0 8px ${glowColor})`
              }}
            />
          ) : (
            <img 
              src={imageUrl} 
              alt={config.name} 
              className={cn(
                "w-full h-full object-contain",
                (id === 'electro-red' || id === 'imperial-blue' || id.includes('fuffy') || id.includes('butterflies') || id.includes('basra') || id.includes('sea_sands') || id.includes('family')) && "brightness-125 contrast-110"
              )}
              style={{
                 filter: (id === 'electro-red' || id === 'imperial-blue') 
                   ? `url(#remove-black-background) drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 5px ${glowColor})` 
                   : (glowColor !== 'transparent' ? `drop-shadow(0 0 8px ${glowColor})` : 'none')
              }}
            />
          )}
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-10 shadow-2xl"
          style={{
            width: `${pixelSize + 22}px`,
            height: `${pixelSize + 22}px`,
            padding: '8.5px',
            background: gradient,
            backgroundSize: '200% 200%',
            animation: animationType === 'rotate' ? 'custom-spin 10s linear infinite' : 'none',
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
        </div>
      )}

      {/* Custom High-Fidelity Interactive Overlay Effects per Frame ID */}
      {id.includes('fuffy') && (
        <div className="absolute inset-0 z-[110] pointer-events-none flex items-center justify-center">
          <div className="absolute w-2.5 h-2.5 bg-pink-300 rounded-full blur-[0.5px]" style={{ animation: 'custom-orbit-1 5s linear infinite' }} />
          <div className="absolute w-2 h-2 bg-purple-300 rounded-full blur-[0.5px]" style={{ animation: 'custom-orbit-2 6s linear infinite' }} />
        </div>
      )}

      {id.includes('butterflies') && (
        <div className="absolute inset-0 z-[110] pointer-events-none">
          <div className="absolute bottom-[20%] left-[10%] text-sm" style={{ animation: 'custom-butterfly-float-1 4s ease-in-out infinite' }}>🦋</div>
          <div className="absolute bottom-[15%] right-[10%] text-xs" style={{ animation: 'custom-butterfly-float-2 4.5s ease-in-out infinite', animationDelay: '1.5s' }}>🦋</div>
        </div>
      )}

      {id.includes('sea_sands') && (
        <div className="absolute inset-x-0 bottom-0 top-[20%] z-[110] pointer-events-none overflow-hidden">
          <div className="absolute bottom-1 left-[25%] w-1.5 h-1.5 rounded-full border border-sky-300 bg-sky-200/20" style={{ animation: 'custom-bubble-float 3.5s ease-in-out infinite' }} />
          <div className="absolute bottom-2 right-[25%] w-2 h-2 rounded-full border border-sky-300 bg-sky-200/20" style={{ animation: 'custom-bubble-float 4.2s ease-in-out infinite', animationDelay: '1.2s' }} />
        </div>
      )}

      {id.includes('basra') && (
        <div className="absolute inset-0 z-[110] pointer-events-none">
          <div className="absolute top-[10%] left-[20%] text-[8px]" style={{ animation: 'custom-gold-sparkle 2.5s infinite ease-in-out' }}>✨</div>
          <div className="absolute bottom-[15%] right-[20%] text-[9px]" style={{ animation: 'custom-gold-sparkle 3s infinite ease-in-out', animationDelay: '0.8s' }}>✨</div>
        </div>
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
        <div className="absolute -top-10 left-1/2 z-[110] drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" style={{ animation: 'custom-bounce-alt 2s infinite ease-in-out' }}>
          {typeof Ornament === 'string' ? (
            <span className="text-4xl">{Ornament}</span>
          ) : (
            <Ornament className="w-12 h-12" style={{ color: borderColor, strokeWidth: 1.5 }} />
          )}
        </div>
      )}
    </div>
  );
};

export const AvatarFrame = memo(({ frameId, frameMediaUrl, dynamicConfig, children, className, size = 'md' }: AvatarFrameProps) => {
  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 88 // Set XL display to match the standard 88px profile image hole
  };

  const sizeClasses = {
    sm: 'h-[60px] w-[60px]',    // 60px total, ~40px hole
    md: 'h-[80px] w-[80px]',    // 80px total, ~60px hole
    lg: 'h-[100px] w-[100px]',  // 100px total, ~80px hole
    xl: 'h-[120px] w-[120px]'    // 120px total, ~100px hole
  };

  const pixelSize = sizeMap[size];
  
  const config = useMemo(() => {
    if (dynamicConfig) return dynamicConfig;
    if (frameMediaUrl && frameMediaUrl !== 'None' && frameMediaUrl !== '') {
      const isVideo = frameMediaUrl.includes('.mp4') || frameMediaUrl.includes('.webm') || frameMediaUrl.includes('.mov') || frameMediaUrl.includes('video') || frameMediaUrl.includes('m3u8');
      return {
        id: frameId || 'custom-dynamic',
        name: 'Custom Frame',
        tier: 'legendary' as const,
        price: 0,
        gradient: 'transparent',
        borderColor: '#FFD700',
        glowColor: 'rgba(255, 215, 0, 0.6)',
        animationType: 'none' as const,
        imageUrl: isVideo ? undefined : frameMediaUrl,
        videoUrl: isVideo ? frameMediaUrl : undefined,
        scaleMultiplier: 1.15,
        offsetX: 0,
        offsetY: 0
      };
    }
    return frameId && frameId !== 'None' && frameId !== 'none' ? AVATAR_FRAMES[frameId] : null;
  }, [frameId, frameMediaUrl, dynamicConfig]);

  // Completely ignore default/transparent frames unless they are active store items
  const isElite = !!config;

  const innerAvatarContent = (
    <div className={cn(
      "relative rounded-full bg-transparent overflow-visible flex items-center justify-center",
      size === 'sm' ? 'w-10 h-10' : 
      size === 'md' ? 'w-[60px] h-[60px]' : 
      size === 'lg' ? 'w-20 h-20' : 
      'w-[88px] h-[88px]'
    )}>
      {children}
    </div>
  );

  // If a valid store frame is equipped, we wrap the children inside CompactVideoAvatarFrame directly
  if (frameMediaUrl && frameMediaUrl !== 'None' && frameMediaUrl !== '') {
    return (
      <div className={cn('relative flex items-center justify-center shrink-0 z-40 overflow-visible', sizeClasses[size], className)}>
        <CompactVideoAvatarFrame frameMediaUrl={frameMediaUrl} avatarSize={pixelSize}>
          {innerAvatarContent}
        </CompactVideoAvatarFrame>
      </div>
    );
  }

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
      {innerAvatarContent}
    </div>
  );
});

AvatarFrame.displayName = 'AvatarFrame';
