'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Trophy, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MountEntry {
  id: string;
  userName: string;
  vipLevel: number;
  mountType: 'LIMO' | 'SPORT_CAR' | 'PRIVATE_JET' | 'DRAGON' | 'PHOENIX';
}

interface MountOverlayProps {
  entries: MountEntry[];
}

/**
 * Royal Entry Mount Overlay for Ummy Elite Edition.
 * Renders high-end CSS/Framer-Motion animations for VIP arrivals.
 * Features: Screen-shaking transitions, luxury particle effects, and prominent tier badges.
 */
export function MountOverlay({ entries }: MountOverlayProps) {
  const [currentEntry, setCurrentEntry] = useState<MountEntry | null>(null);

  useEffect(() => {
    if (entries.length > 0 && !currentEntry) {
      setCurrentEntry(entries[0]);
    }
  }, [entries, currentEntry]);

  const handleAnimationComplete = () => {
    setCurrentEntry(null);
  };

  const getMountConfig = (type: string) => {
    const configs: Record<string, { icon: string, bg: string, text: string, shadow: string, label: string }> = {
      'LIMO': { icon: '🚘', bg: 'bg-slate-900', text: 'text-white', shadow: 'shadow-blue-500/50', label: 'EXECUTIVE LIMO' },
      'SPORT_CAR': { icon: '🏎️', bg: 'bg-red-600', text: 'text-white', shadow: 'shadow-red-500/50', label: 'PULSE RACER' },
      'PRIVATE_JET': { icon: '🛩️', bg: 'bg-blue-600', text: 'text-white', shadow: 'shadow-indigo-500/50', label: 'SKY SOVEREIGN' },
      'DRAGON': { icon: '🐉', bg: 'bg-emerald-700', text: 'text-white', shadow: 'shadow-green-500/50', label: 'ANCIENT DRAGON' },
      'PHOENIX': { icon: '🐦', bg: 'bg-orange-600', text: 'text-white', shadow: 'shadow-orange-500/50', label: 'ETERNAL PHOENIX' }
    };
    return configs[type] || configs['LIMO'];
  };

  if (!currentEntry) return null;
  const config = getMountConfig(currentEntry.mountType);

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={currentEntry.id}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        onAnimationComplete={() => setTimeout(handleAnimationComplete, 4000)}
        className="fixed top-1/3 left-0 w-full z-[1000] pointer-events-none px-4"
      >
        <div className={cn(
          "max-w-md mx-auto relative rounded-[2rem] overflow-hidden border-2 border-white/20 p-4 shadow-[0_0_50px_rgba(0,0,0,0.4)] flex items-center gap-4",
          config.bg,
          config.shadow
        )}>
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shine" />
          
          {/* Mount Icon */}
          <div className="text-6xl drop-shadow-2xl animate-float relative z-10 shrink-0">
            {config.icon}
          </div>

          <div className="flex flex-col gap-1 relative z-10 min-w-0">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">{config.label}</span>
                <Crown className="h-3 w-3 text-yellow-400 fill-current animate-pulse" />
             </div>
             <h2 className={cn("text-xl font-black uppercase tracking-tight truncate", config.text)}>
                {currentEntry.userName}
             </h2>
             <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-[11px] font-bold text-white/90">VIP {currentEntry.vipLevel} Arrived!</span>
             </div>
          </div>

          {/* Particle Effects */}
          <div className="absolute -top-10 -right-10 opacity-20"><Zap className="h-40 w-40 text-white" /></div>
        </div>

        <style jsx global>{`
          @keyframes shine {
            0% { transform: translateX(-200%) skewX(-20deg); }
            100% { transform: translateX(200%) skewX(-20deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1.1); }
            50% { transform: translateY(-10px) scale(1.15); }
          }
          .animate-shine { animation: shine 3s infinite linear; }
          .animate-float { animation: float 1s infinite ease-in-out; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
