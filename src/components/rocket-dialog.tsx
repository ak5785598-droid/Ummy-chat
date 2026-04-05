'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Lock, Trophy, Users, X, Zap, CheckCircle2 } from 'lucide-react';

// --- YE HAI AAPKA NAYA BLUE METALLIC ROCKET (IMAGE SE MATCHING) ---
const CustomRocketIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={cn("drop-shadow-[0_0_20px_rgba(56,189,248,0.8)]", className)}
  >
    {/* Side Thrusters - Left & Right */}
    <path d="M22 75 Q12 85 18 105 L35 105 Q40 85 35 75 Z" fill="url(#rocketBlue)" stroke="#EAB308" strokeWidth="1"/>
    <path d="M78 75 Q88 85 82 105 L65 105 Q60 85 65 75 Z" fill="url(#rocketBlue)" stroke="#EAB308" strokeWidth="1"/>
    
    {/* Main Central Body */}
    <path d="M50 5 C28 40 28 85 35 110 L65 110 C72 85 72 40 50 5 Z" fill="url(#rocketBlue)" stroke="#EAB308" strokeWidth="1.5"/>
    
    {/* Windows & Details */}
    <circle cx="50" cy="45" r="9" fill="#0F172A" stroke="#EAB308" strokeWidth="2"/>
    <rect x="35" y="85" width="30" height="4" fill="#EAB308" />
    
    {/* White Engine Fire/Glow */}
    <path d="M42 110 L50 125 L58 110 Z" fill="white" className="animate-pulse" />
    <path d="M20 105 L25 115 L30 105 Z" fill="white" opacity="0.7" />
    <path d="M70 105 L75 115 L80 105 Z" fill="white" opacity="0.7" />

    <defs>
      <linearGradient id="rocketBlue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
  </svg>
);

const ROCKET_LEVELS = [
  {
    level: 1,
    name: 'Star Fighter',
    unlockAmount: 100000,
    color: 'from-blue-600/20 to-blue-400/10',
    rewards: ['Star Frame', 'Sports Car', '10K EXP']
  },
  {
    level: 2,
    name: 'Galaxy Destroyer',
    unlockAmount: 500000,
    color: 'from-indigo-600/20 to-purple-400/10',
    rewards: ['Galaxy Frame', 'Private Jet', '50K EXP']
  },
  {
    level: 3,
    name: 'Cosmic Emperor',
    unlockAmount: 2000000,
    color: 'from-yellow-600/20 to-orange-400/10',
    rewards: ['Emperor Frame', 'Luxury Yacht', '200K EXP']
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
    const prev = ROCKET_LEVELS.find(l => l.level === nextLevel.level - 1)?.unlockAmount || 0;
    return Math.min(((totalGifts - prev) / (nextLevel.unlockAmount - prev)) * 100, 100);
  }, [totalGifts, nextLevel]);

  const format = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${n / 1000}K`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] w-[92%] bg-[#0B0F1A] border-white/10 p-0 overflow-hidden text-white rounded-[2.5rem] shadow-2xl outline-none">
        <DialogHeader className="sr-only"><DialogTitle>Rocket System</DialogTitle></DialogHeader>

        {/* Main Header with Animated Rocket */}
        <div className="relative p-8 flex flex-col items-center bg-gradient-to-b from-blue-600/20 to-transparent">
          <button onClick={() => onOpenChange(false)} className="absolute top-5 right-5 text-white/30 hover:text-white"><X size={20}/></button>
          
          <div className="mb-4 bg-white/5 border border-white/10 px-4 py-1 rounded-full">
            <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">{roomName}</span>
          </div>

          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
            {/* HAMEIN YAHAN 🚀 EMOJI NAHI, CUSTOM COMPONENT CHAHIYE THA */}
            <CustomRocketIcon className="w-32 h-32 relative z-10 animate-bounce" />
            
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black border-2 border-[#0B0F1A] shadow-xl">
              {currentLevel ? `LVL ${currentLevel.level}` : 'LOCKED'}
            </div>
          </div>

          <h2 className="mt-8 text-xl font-black italic tracking-tighter uppercase leading-none">
            {currentLevel ? currentLevel.name : 'System Offline'}
          </h2>
        </div>

        {/* Progress Section */}
        <div className="px-6 py-5 bg-white/[0.02] border-y border-white/5">
          <div className="flex justify-between text-[10px] font-black mb-2 text-white/50 uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><Zap size={12} className="text-yellow-400 fill-current"/> Fuel Level</div>
            <div>{format(totalGifts)} / {nextLevel ? format(nextLevel.unlockAmount) : 'MAX'}</div>
          </div>
          <div className="h-3.5 bg-black/60 rounded-full p-1 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-blue-700 via-blue-400 to-cyan-300 rounded-full transition-all duration-1000 shadow-[0_0_15px_#3b82f6]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Level List */}
        <div className="p-4 space-y-3 max-h-[250px] overflow-y-auto no-scrollbar">
          {ROCKET_LEVELS.map((rocket) => {
            const isUnlocked = totalGifts >= rocket.unlockAmount;
            return (
              <div key={rocket.level} className={cn(
                "p-4 rounded-3xl border transition-all duration-300",
                isUnlocked ? "bg-white/5 border-white/10 shadow-lg" : "bg-black/20 border-white/5 opacity-30 grayscale"
              )}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5">
                    <CustomRocketIcon className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase">{rocket.name}</span>
                      {currentLevel?.level === rocket.level && <CheckCircle2 size={12} className="text-blue-400 fill-blue-400/20"/>}
                    </div>
                    <div className="text-[10px] font-bold text-blue-400/60 mt-0.5">TARGET: {format(rocket.unlockAmount)}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rocket.rewards.map((r, i) => (
                        <span key={i} className="text-[7px] font-black bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase text-white/40">{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar */}
        <div className="p-4 bg-white/[0.02] flex justify-center gap-10 opacity-30">
           <div className="flex items-center gap-2"><Trophy size={14}/><span className="text-[8px] font-black uppercase tracking-widest">Prizes</span></div>
           <div className="flex items-center gap-2"><Users size={14}/><span className="text-[8px] font-black uppercase tracking-widest">Friends</span></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
