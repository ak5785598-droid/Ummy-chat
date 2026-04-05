'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Lock, Trophy, Users, X, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// --- TYPES & INTERFACES ---
interface RocketLevel {
  level: number;
  name: string;
  target: number;
  rewards: string[];
  color: string;
}

interface RocketProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalGifts?: number;
  roomName?: string;
}

// --- 3D METALLIC ROCKET COMPONENT ---
const Rocket3D: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div 
    animate={{ 
      y: [0, -12, 0],
      rotateZ: [-1, 1, -1]
    }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    className={cn("relative drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]", className)}
  >
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Brushed Metal Texture */}
        <linearGradient id="metalBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="30%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#BFDBFE" />
          <stop offset="70%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        
        {/* Glow for Engine */}
        <filter id="engineGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Side Fins (3D Look) */}
      <path d="M22 80 L10 105 L35 105 Z" fill="#1E40AF" stroke="#60A5FA" strokeWidth="1" />
      <path d="M78 80 L90 105 L65 105 Z" fill="#1E40AF" stroke="#60A5FA" strokeWidth="1" />

      {/* Main Hull (Metallic) */}
      <path d="M50 5 C28 45 28 90 35 112 L65 112 C72 90 72 45 50 5 Z" fill="url(#metalBody)" />
      
      {/* Chrome Window */}
      <circle cx="50" cy="45" r="10" fill="#0F172A" stroke="#FDE047" strokeWidth="2" />
      <circle cx="47" cy="42" r="3" fill="white" fillOpacity="0.4" />

      {/* Animated Plasma Exhaust */}
      <motion.path 
        animate={{ opacity: [0.5, 1, 0.5], scaleY: [1, 1.4, 1] }}
        transition={{ duration: 0.15, repeat: Infinity }}
        d="M40 112 L50 135 L60 112 Z" 
        fill="#60A5FA" 
        filter="url(#engineGlow)"
      />
    </svg>
  </motion.div>
);

const ROCKET_LEVELS: RocketLevel[] = [
  { level: 1, name: 'Star Fighter', target: 100000, rewards: ['Star Frame', 'Sports Car'], color: '#3B82F6' },
  { level: 2, name: 'Galaxy Destroyer', target: 500000, rewards: ['Galaxy Frame', 'Private Jet'], color: '#8B5CF6' },
  { level: 3, name: 'Cosmic Emperor', target: 2000000, rewards: ['Emperor Frame', 'Luxury Yacht'], color: '#F59E0B' },
];

export const RocketDialog: React.FC<RocketProps> = ({ 
  open, 
  onOpenChange, 
  totalGifts = 37900, 
  roomName = "UMMY EVENT HR" 
}) => {
  const currentLevel = useMemo(() => 
    [...ROCKET_LEVELS].reverse().find(l => totalGifts >= l.target)
  , [totalGifts]);

  const nextLevel = useMemo(() => 
    ROCKET_LEVELS.find(l => totalGifts < l.target)
  , [totalGifts]);

  const progressPercent = useMemo(() => {
    if (!nextLevel) return 100;
    const prev = ROCKET_LEVELS.find(l => l.level === nextLevel.level - 1)?.target || 0;
    return Math.min(((totalGifts - prev) / (nextLevel.target - prev)) * 100, 100);
  }, [totalGifts, nextLevel]);

  const formatTarget = (val: number) => val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${val / 1000}K`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] w-[92%] p-0 bg-[#050810] border-white/5 overflow-hidden rounded-[2.5rem] shadow-[0_0_60px_rgba(0,0,0,0.8)] outline-none">
        <DialogHeader className="sr-only"><DialogTitle>Rocket System</DialogTitle></DialogHeader>

        {/* HERO SECTION WITH STARFIELD */}
        <div className="relative pt-12 pb-6 flex flex-col items-center bg-gradient-to-b from-blue-900/30 to-transparent">
          {/* Animated Stars Background */}
          <div className="absolute inset-0 opacity-20 overflow-hidden">
             {[...Array(15)].map((_, i) => (
               <motion.div 
                 key={i}
                 animate={{ y: [0, 400], opacity: [0, 1, 0] }}
                 transition={{ duration: Math.random() * 2 + 2, repeat: Infinity, delay: Math.random() * 5 }}
                 className="absolute w-[1px] h-10 bg-white"
                 style={{ left: `${Math.random() * 100}%`, top: '-10%' }}
               />
             ))}
          </div>

          <button onClick={() => onOpenChange(false)} className="absolute top-6 right-6 text-white/30 hover:text-white z-20">
            <X size={20}/>
          </button>
          
          <div className="mb-4 bg-white/5 border border-white/10 px-4 py-1 rounded-full backdrop-blur-md">
            <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase">{roomName}</span>
          </div>

          <Rocket3D className="w-36 h-36 z-10" />

          <h2 className="mt-6 text-2xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-lg">
            {currentLevel ? currentLevel.name : 'System Offline'}
          </h2>
        </div>

        {/* PROGRESS CARD */}
        <div className="px-6 py-6 bg-white/[0.03] border-y border-white/5">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 tracking-widest uppercase">
              <Zap size={14} className="fill-blue-400"/> Fuel Level
            </div>
            <div className="text-xs font-black text-white/80">
              {formatTarget(totalGifts)} <span className="text-white/20">/ {nextLevel ? formatTarget(nextLevel.target) : 'MAX'}</span>
            </div>
          </div>
          
          <div className="h-4 bg-black/60 rounded-full p-1 border border-white/10 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-blue-800 via-blue-400 to-cyan-300 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
            />
          </div>
        </div>

        {/* LEVEL LIST */}
        <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto no-scrollbar relative z-10">
          {ROCKET_LEVELS.map((rocket) => {
            const isUnlocked = totalGifts >= rocket.target;
            const isCurrent = currentLevel?.level === rocket.level;

            return (
              <motion.div 
                key={rocket.level}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "p-4 rounded-[1.8rem] border transition-all duration-500 relative overflow-hidden",
                  isUnlocked 
                    ? "bg-gradient-to-br from-white/10 to-transparent border-white/10 shadow-xl" 
                    : "bg-black/40 border-white/5 opacity-30 grayscale"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/60 rounded-2xl flex items-center justify-center border border-white/10">
                    <Rocket3D className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase text-white/90">{rocket.name}</span>
                      {isCurrent && <CheckCircle2 size={12} className="text-cyan-400" />}
                    </div>
                    <div className="text-[9px] font-bold text-blue-400/70 mt-0.5 tracking-wider">TARGET: {formatTarget(rocket.target)}</div>
                    <div className="flex gap-1.5 mt-2">
                      {rocket.rewards.map((r, i) => (
                        <span key={i} className="text-[7px] font-black bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-blue-300 uppercase">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM NAV */}
        <div className="p-5 flex justify-center gap-12 bg-black/40 backdrop-blur-xl border-t border-white/5 opacity-40">
           <div className="flex flex-col items-center gap-1 cursor-not-allowed">
              <Trophy size={16}/><span className="text-[8px] font-black uppercase">Prizes</span>
           </div>
           <div className="flex flex-col items-center gap-1 cursor-not-allowed">
              <Users size={16}/><span className="text-[8px] font-black uppercase">Friends</span>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
