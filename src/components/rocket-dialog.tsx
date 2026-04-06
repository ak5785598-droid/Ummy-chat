'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Rocket, 
  ChevronRight, 
  Star, 
  Zap, 
  Shield, 
  Trophy,
  Info 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROCKET_LEVELS = [
  { level: 1, name: 'Scout-1', target: 5000, colors: { primary: '#3b82f6', secondary: '#1d4ed8', flame: '#60a5fa' } },
  { level: 2, name: 'Vanguard-2', target: 15000, colors: { primary: '#8b5cf6', secondary: '#6d28d9', flame: '#a78bfa' } },
  { level: 3, name: 'Titan-3', target: 50000, colors: { primary: '#ec4899', secondary: '#be185d', flame: '#f472b6' } },
  { level: 4, name: 'Nova-4', target: 150000, colors: { primary: '#f59e0b', secondary: '#b45309', flame: '#fbbf24' } },
  { level: 5, name: 'Zenith-5', target: 500000, colors: { primary: '#10b981', secondary: '#047857', flame: '#34d399' } },
];

const PremiumRocketSVG = ({ colors, isActive }: { colors: any, isActive: boolean }) => (
  <motion.div 
    animate={isActive ? {
      y: [0, -10, 0],
      rotate: [0, 1, -1, 0]
    } : {}}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    className="relative w-48 h-48 flex items-center justify-center"
  >
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
      <defs>
        <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
      </defs>
      
      {/* ROCKET BODY */}
      <path d="M50 10 C35 30 30 70 30 90 L70 90 C70 70 65 30 50 10Z" fill="url(#rocketBody)" />
      <path d="M50 15 C40 35 35 70 35 85 L65 85 C65 70 60 35 50 15Z" fill="white" fillOpacity="0.1" />
      
      {/* WINDOW */}
      <circle cx="50" cy="50" r="8" fill="#0f172a" />
      <circle cx="50" cy="50" r="5" fill="#38bdf8" fillOpacity="0.5" />
      
      {/* FINS */}
      <path d="M30 70 L15 95 L30 90 Z" fill={colors.secondary} />
      <path d="M70 70 L85 95 L70 90 Z" fill={colors.secondary} />
      
      {/* ENGINE / FLAME AREA */}
      <path d="M40 90 L60 90 L55 95 L45 95 Z" fill="#334155" />
      {isActive && (
        <motion.g animate={{ opacity: [0.6, 1, 0.6], scaleY: [1, 1.2, 1] }} transition={{ duration: 0.2, repeat: Infinity }}>
          <path d="M42 95 L58 95 L50 120 Z" fill={colors.flame} />
          <path d="M45 95 L55 95 L50 110 Z" fill="white" fillOpacity="0.8" />
        </motion.g>
      )}
    </svg>
  </motion.div>
);

export function RocketDialog({ 
  open, 
  onOpenChange, 
  currentExp = 0 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  currentExp?: number;
}) {
  const nextLevel = useMemo(() => 
    ROCKET_LEVELS.find(l => currentExp < l.target) || ROCKET_LEVELS[4]
  , [currentExp]);

  const activeLevel = useMemo(() => 
    [...ROCKET_LEVELS].reverse().find(l => currentExp >= l.target) || null
  , [currentExp]);

  const progress = Math.min((currentExp / nextLevel.target) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <button onClick={() => onOpenChange(false)} className="absolute top-8 right-8 text-white/20 hover:text-white z-50">
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
            {activeLevel ? activeLevel.name : 'SYSTEM OFFLINE'}
          </motion.h1>
        </div>

        {/* PROGRESS SECTION */}
        <div className="p-8 pt-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Next Evolution</span>
              <span className="text-white text-lg font-bold">{nextLevel.name}</span>
            </div>
            <div className="text-right">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Current XP</span>
              <div className="text-white font-mono font-bold">{currentExp.toLocaleString()}</div>
            </div>
          </div>

          {/* CUSTOM PROGRESS BAR */}
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-tighter">
            <span>Level {activeLevel?.level || 0}</span>
            <span>{nextLevel.target.toLocaleString()} XP Target</span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button className="py-4 rounded-3xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all">
              Mission Logs
            </button>
            <button className="py-4 rounded-3xl bg-blue-600 text-white font-bold text-xs shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all">
              Boost Sync
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
