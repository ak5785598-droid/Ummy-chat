'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Lock, Trophy, Users, X, Zap, CheckCircle2 } from 'lucide-react';

// --- Custom Rocket Component (Matching Image 2) ---
const CustomRocketIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={cn("drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]", className)}
  >
    {/* Side Thrusters */}
    <path d="M25 70 Q15 80 20 100 L35 100 Q40 80 35 70 Z" fill="url(#metallicBlue)" stroke="#FFD700" strokeWidth="1"/>
    <path d="M75 70 Q85 80 80 100 L65 100 Q60 80 65 70 Z" fill="url(#metallicBlue)" stroke="#FFD700" strokeWidth="1"/>
    
    {/* Main Body */}
    <path d="M50 10 C30 40 30 80 35 105 L65 105 C70 80 70 40 50 10 Z" fill="url(#metallicBlue)" stroke="#FFD700" strokeWidth="1.5"/>
    
    {/* Gold Rings & Details */}
    <circle cx="50" cy="50" r="8" fill="#1A1A1A" stroke="#FFD700" strokeWidth="2"/>
    <rect x="35" y="75" width="30" height="3" fill="#FFD700" />
    <rect x="38" y="25" width="24" height="2" fill="#FFD700" opacity="0.6" />
    
    {/* Fire/Thruster Effects */}
    <path d="M45 105 L50 120 L55 105 Z" fill="white">
      <animate attributeName="opacity" values="1;0.4;1" dur="0.2s" repeatCount="indefinite" />
    </path>
    <path d="M22 100 L27 110 L32 100 Z" fill="white" opacity="0.8" />
    <path d="M68 100 L73 110 L78 100 Z" fill="white" opacity="0.8" />

    <defs>
      <linearGradient id="metallicBlue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2B5876" />
        <stop offset="50%" stopColor="#4E4376" />
        <stop offset="100%" stopColor="#2B5876" />
      </linearGradient>
    </defs>
  </svg>
);

const ROCKET_LEVELS = [
  {
    level: 1,
    name: 'Star Fighter',
    unlockAmount: 100000,
    color: 'from-blue-900/40 to-blue-600/20',
    rewards: [{ name: 'Star Frame' }, { name: 'Sports Car' }, { name: '10K EXP' }]
  },
  {
    level: 2,
    name: 'Galaxy Destroyer',
    unlockAmount: 500000,
    color: 'from-indigo-900/40 to-purple-600/20',
    rewards: [{ name: 'Galaxy Frame' }, { name: 'Private Jet' }, { name: '50K EXP' }]
  },
  {
    level: 3,
    name: 'Cosmic Emperor',
    unlockAmount: 2000000,
    color: 'from-blue-600 via-indigo-500 to-purple-600',
    rewards: [{ name: 'Emperor Frame' }, { name: 'Luxury Yacht' }, { name: '200K EXP' }]
  }
];

export function RocketDialog({ open, onOpenChange, totalGifts, roomName }: any) {
  const currentLevel = useMemo(() => {
    return [...ROCKET_LEVELS].reverse().find(l => totalGifts >= l.unlockAmount) || null;
  }, [totalGifts]);

  const nextLevel = useMemo(() => {
    return ROCKET_LEVELS.find(l => totalGifts < l.unlockAmount) || null;
  }, [totalGifts]);

  const progressPercent = useMemo(() => {
    if (!nextLevel) return 100;
    const prevAmount = ROCKET_LEVELS.find(l => l.level === nextLevel.level - 1)?.unlockAmount || 0;
    return Math.min(((totalGifts - prevAmount) / (nextLevel.unlockAmount - prevAmount)) * 100, 100);
  }, [totalGifts, nextLevel]);

  const format = (n: number) => n >= 100000 ? `${n / 100000}L` : `${n / 1000}K`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] w-[94%] bg-[#0B0F1A] border-white/10 p-0 overflow-hidden text-white rounded-[2rem] outline-none shadow-2xl">
        <DialogHeader className="sr-only"><DialogTitle>Rocket System</DialogTitle></DialogHeader>

        {/* Top Header */}
        <div className="relative p-8 flex flex-col items-center bg-gradient-to-b from-blue-600/10 to-transparent">
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20}/></button>
          
          <div className="mb-2 bg-blue-500/10 px-3 py-0.5 rounded-full border border-blue-500/20">
            <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">{roomName}</span>
          </div>

          {/* Big Rocket Display */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/10 blur-[50px] rounded-full animate-pulse" />
            {currentLevel ? (
              <CustomRocketIcon className="w-32 h-32 z-10 animate-bounce-slow" />
            ) : (
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                <Lock className="text-white/20" size={40} />
              </div>
            )}
            <div className="absolute -bottom-2 bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black border-2 border-[#0B0F1A]">
              {currentLevel ? `LEVEL ${currentLevel.level}` : 'LOCKED'}
            </div>
          </div>

          <h2 className="mt-6 text-xl font-black italic tracking-tighter uppercase">
            {currentLevel ? currentLevel.name : 'Ready for Launch'}
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-white/5 border-y border-white/5">
          <div className="flex justify-between text-[10px] font-bold mb-2 text-white/60">
            <div className="flex items-center gap-1"><Zap size={12} className="text-yellow-500 fill-current"/> POWER</div>
            <div>{format(totalGifts)} / {nextLevel ? format(nextLevel.unlockAmount) : 'MAX'}</div>
          </div>
          <div className="h-3 bg-black/50 rounded-full p-0.5 border border-white/5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_#2563eb]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Levels List */}
        <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
          {ROCKET_LEVELS.map((rocket) => {
            const isUnlocked = totalGifts >= rocket.unlockAmount;
            return (
              <div key={rocket.level} className={cn(
                "p-4 rounded-2xl border transition-all",
                isUnlocked ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 opacity-40"
              )}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center">
                    {isUnlocked ? <CustomRocketIcon className="w-8 h-8" /> : <Lock size={18}/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase">{rocket.name}</span>
                      {currentLevel?.level === rocket.level && <CheckCircle2 size={12} className="text-blue-400"/>}
                    </div>
                    <div className="text-[10px] text-white/40 font-bold mt-0.5">TARGET: {format(rocket.unlockAmount)}</div>
                    <div className="flex gap-2 mt-2">
                      {rocket.rewards.map((r, i) => (
                        <div key={i} className="text-[8px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/20">{r.name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-center gap-8 border-t border-white/5 opacity-40">
           <div className="flex items-center gap-2"><Trophy size={14}/> <span className="text-[9px] font-black uppercase">Rewards</span></div>
           <div className="flex items-center gap-2"><Users size={14}/> <span className="text-[9px] font-black uppercase">Ranking</span></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
