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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';

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
    className="relative w-44 h-44 flex items-center justify-center"
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
  currentExp = 0,
  roomName
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  currentExp?: number;
  roomName?: string;
}) {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'appConfig', 'rocket') : null, [firestore]);
  const { data: rocketConfig } = useDoc(configRef);

  const nextLevel = useMemo(() => 
    ROCKET_LEVELS.find(l => currentExp < l.target) || ROCKET_LEVELS[4]
  , [currentExp]);

  const activeLevel = useMemo(() => 
    [...ROCKET_LEVELS].reverse().find(l => currentExp >= l.target) || null
  , [currentExp]);

  const progress = Math.min((currentExp / (rocketConfig?.target || nextLevel.target)) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[385px] p-0 bg-[#050810] border-none rounded-none overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Rocket Status</DialogTitle>
          <DialogDescription>View the current rocket evolution level and progress in {roomName}.</DialogDescription>
        </DialogHeader>
        
        {/* FULL COVER ROCKET SECTION */}
        <div className="relative w-full h-[450px] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#0f172a_0%,_#020617_100%)]">
          {/* Animated Falling Stars */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [-20, 500], opacity: [0, 1, 0] }}
                transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, delay: Math.random() * 3 }}
                className="absolute w-[1px] h-12 bg-blue-400"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>

          <button onClick={() => onOpenChange(false)} className="absolute top-6 right-6 text-white/20 hover:text-white z-50">
            <X size={20} />
          </button>

          {/* FULL COVER ROCKET IMAGE */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            {rocketConfig?.imageUrl ? (
              <motion.img 
                src={rocketConfig.imageUrl} 
                alt="Rocket" 
                animate={!!activeLevel ? {
                  y: [0, -8, 0],
                  scale: [1, 1.02, 1]
                } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full h-full object-cover drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]" 
              />
            ) : (
              <PremiumRocketSVG 
                colors={activeLevel?.colors || ROCKET_LEVELS[0].colors} 
                isActive={!!activeLevel} 
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
