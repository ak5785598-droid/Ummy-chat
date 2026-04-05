'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Trophy, Users, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// --- PREMIUM CONFIGURATION ---
const ROCKET_LEVELS = [
  { 
    level: 1, name: 'STAR FIGHTER', target: 500000, 
    rewards: 'Top 20: 1 Lakh Coins', 
    colors: { primary: '#2563eb', border: '#60a5fa', detail: '#93c5fd', flame: '#3b82f6' } 
  },
  { 
    level: 2, name: 'GALAXY DESTROYER', target: 1500000, 
    rewards: 'Top 20: 5 Lakh Coins', 
    colors: { primary: '#059669', border: '#ffd700', detail: '#fbbf24', flame: '#10b981' } 
  },
  { 
    level: 3, name: 'COSMIC EMPEROR', target: 3000000, 
    rewards: 'Top 10: 7 Lakh Coins', 
    colors: { primary: '#7c3aed', border: '#ffd700', detail: '#f59e0b', flame: '#a855f7' } 
  },
  { 
    level: 4, name: 'VOID REAPER', target: 100000000, 
    rewards: 'Top 10: 10 Lakh Coins', 
    colors: { primary: '#dc2626', border: '#ffd700', detail: '#fcd34d', flame: '#ef4444' } 
  },
  { 
    level: 5, name: 'ULTIMATE NOVA', target: 200000000, 
    rewards: 'Top 10: 50 Lakh Coins', 
    colors: { primary: '#b45309', border: '#ffd700', detail: '#fef3c7', flame: '#fbbf24' } 
  },
];

// --- ADVANCED 3D ROCKET SVG (Image Style) ---
const PremiumRocketSVG = ({ colors, isActive }: { colors: any, isActive: boolean }) => (
  <motion.div
    animate={isActive ? { y: [0, -10, 0] } : {}}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    className="relative w-44 h-44 drop-shadow-[0_0_35px_rgba(255,215,0,0.3)]"
  >
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Metallic Body Gradient */}
        <linearGradient id={`body-${colors.primary}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="45%" stopColor={colors.primary} />
          <stop offset="55%" stopColor={colors.detail} />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        {/* Gold Border / Engraving */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
      </defs>

      {/* Side Pods (Image 4/5 Style) */}
      <g filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
        <path d="M20 75 Q 10 85 15 110 L30 110 Q 25 85 25 75 Z" fill={`url(#body-${colors.primary})`} stroke="url(#goldGrad)" strokeWidth="1.5"/>
        <path d="M80 75 Q 90 85 85 110 L70 110 Q 75 85 75 75 Z" fill={`url(#body-${colors.primary})`} stroke="url(#goldGrad)" strokeWidth="1.5"/>
        {/* Pod Shine */}
        <circle cx="18" cy="100" r="2" fill="white" fillOpacity="0.5" />
        <circle cx="82" cy="100" r="2" fill="white" fillOpacity="0.5" />
      </g>

      {/* Main Hull */}
      <path d="M50 5 C25 45 28 95 35 115 L65 115 C72 95 75 45 50 5 Z" fill={`url(#body-${colors.primary})`} stroke="url(#goldGrad)" strokeWidth="2"/>
      
      {/* Decorative Engravings (The "Carving" look in images) */}
      <path d="M38 80 H62 M40 90 H60 M42 100 H58" stroke="url(#goldGrad)" strokeWidth="0.5" opacity="0.6"/>
      
      {/* 3D Porthole */}
      <circle cx="50" cy="42" r="14" fill="#020617" stroke="url(#goldGrad)" strokeWidth="2.5" />
      <circle cx="50" cy="42" r="10" fill="#1e293b" />
      <path d="M44 38 A 6 6 0 0 1 50 34" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

      {/* Engine Glow */}
      {isActive && (
        <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.2, repeat: Infinity }}>
          <path d="M42 115 L50 145 L58 115 Z" fill={colors.flame} filter="blur(4px)" />
          <path d="M15 110 L20 125 L25 110 Z" fill={colors.flame} filter="blur(2px)" />
          <path d="M75 110 L80 125 L85 110 Z" fill={colors.flame} filter="blur(2px)" />
        </motion.g>
      )}
    </svg>
  </motion.div>
);

export default function RocketEvent({ currentExp = 37900 }) {
  const [isOpen, setIsOpen] = useState(true);

  const activeLevel = useMemo(() => 
    [...ROCKET_LEVELS].reverse().find(l => currentExp >= l.target) || null
  , [currentExp]);

  const nextLevel = useMemo(() => 
    ROCKET_LEVELS.find(l => currentExp < l.target) || ROCKET_LEVELS[4]
  , [currentExp]);

  const progress = Math.min((currentExp / nextLevel.target) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[385px] p-0 bg-[#050810] border-none rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        {/* HEADER AREA - BLUE SPACE THEME */}
        <div className="relative h-[340px] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#0f172a_0%,_#020617_100%)]">
          {/* Animated Falling Stars */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [-20, 400], opacity: [0, 1, 0] }}
                transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, delay: Math.random() * 3 }}
                className="absolute w-[1px] h-12 bg-blue-400"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>

          <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-white z-50">
            <X size={24} />
          </button>

          {/* MAIN ROCKET DISPLAY */}
          <PremiumRocketSVG 
            colors={activeLevel?.colors || ROCKET_LEVELS[0].colors} 
            isActive={!!activeLevel} 
          />

          <motion.h1 
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="mt-6 text-3xl font-black italic tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            {activeLevel ? activeLevel.name : "SYSTEM OFFLINE"}
          </motion.h1>
        </div>

        {/* PROGRESS SECTION */}
        <div className="px-8 py-6 bg-gradient-to-b from-white/[0.03] to-transparent border-t border-white/5">
          <div className="flex justify-between items-center mb-3">
            <span className="flex items-center gap-2 text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase">
              <Zap size={14} className="fill-blue-400" /> Engine Fuel
            </span>
            <span className="text-xs font-black text-white italic">
              {(currentExp / 100000).toFixed(1)}L / {(nextLevel.target / 100000).toFixed(0)}L
            </span>
          </div>
          <div className="h-4 bg-black rounded-full p-1 border border-white/10 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-700 via-blue-400 to-cyan-300 rounded-full"
            />
          </div>
        </div>

        {/* SCROLLABLE LEVELS LIST */}
        <div className="px-5 pb-5 space-y-3 max-h-[280px] overflow-y-auto no-scrollbar">
          {ROCKET_LEVELS.map((rocket) => {
            const isUnlocked = currentExp >= rocket.target;
            return (
              <div 
                key={rocket.level}
                className={`group relative p-4 rounded-[2.5rem] border transition-all duration-700 ${
                  isUnlocked 
                  ? "bg-gradient-to-r from-white/10 to-transparent border-white/10" 
                  : "bg-black/60 border-white/5 opacity-40 grayscale"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-black/40 rounded-[1.5rem] flex items-center justify-center border border-white/10">
                    <PremiumRocketSVG colors={rocket.colors} isActive={false} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-white tracking-wider uppercase">{rocket.name}</span>
                      {isUnlocked && <CheckCircle2 size={14} className="text-yellow-400" />}
                    </div>
                    <div className="text-[9px] font-bold text-blue-400/80 mb-2 italic">GOAL: {(rocket.target / 100000).toFixed(0)}L COINS</div>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[8px] font-black text-yellow-500 uppercase tracking-tighter">
                          {rocket.rewards}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM NAVIGATION */}
        <div className="p-6 flex justify-around bg-black/80 backdrop-blur-2xl border-t border-white/5">
           <div className="flex flex-col items-center gap-1 opacity-50"><Trophy size={18}/><span className="text-[9px] font-black uppercase">Prizes</span></div>
           <div className="flex flex-col items-center gap-1 opacity-50"><Users size={18}/><span className="text-[9px] font-black uppercase">Friends</span></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
