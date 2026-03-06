'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Swords, Flame, Briefcase, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * High-Fidelity Room Play Portal.
 * Designed to mirror the provided blueprint:
 * - Dark high-blur background.
 * - Header: Room Play.
 * - Options: Battle, Calculator, Lucky Bag.
 */
export function RoomPlayDialog({ open, onOpenChange }: RoomPlayDialogProps) {
  const options = [
    { 
      id: 'battle', 
      label: 'Battle', 
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-red-500 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden group">
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              <Swords className="h-8 w-8 text-white drop-shadow-md animate-pulse" />
           </div>
           {/* SVGA Shine Streak */}
           <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    },
    { 
      id: 'calculator', 
      label: 'Calculator', 
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#3d2b1f] to-black p-0.5 border-2 border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4)] overflow-hidden group">
           <div className="w-full h-full flex items-center justify-center rounded-full bg-black/40">
              <Flame className="h-8 w-8 text-orange-500 fill-current animate-reaction-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    },
    { 
      id: 'lucky-bag', 
      label: 'Lucky Bag', 
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#b88a44] to-[#5d4037] p-0.5 border-2 border-yellow-200/40 shadow-xl overflow-hidden group">
           <div className="w-full h-full flex items-center justify-center rounded-full bg-black/20">
              <div className="relative">
                 <Briefcase className="h-8 w-8 text-yellow-500 fill-amber-900/40" />
                 <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-black shadow-lg">
                    <span className="text-[8px] font-black text-black leading-none">$</span>
                 </div>
              </div>
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a]/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white/90">Room Play</DialogTitle>
          <DialogDescription className="sr-only">Choose a room game or tool frequency.</DialogDescription>
        </DialogHeader>

        <div className="p-8 pt-2 pb-16">
           <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
              {options.map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => onOpenChange(false)}
                  className="flex flex-col items-center gap-3 shrink-0 active:scale-90 transition-transform"
                >
                   <div className="relative p-4 bg-white/5 rounded-3xl border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                      {opt.icon}
                   </div>
                   <span className="text-sm font-black uppercase italic text-white/80 tracking-tight">{opt.label}</span>
                </button>
              ))}
              {/* Empty Column Placeholder to maintain "Four Column" potential */}
              <div className="w-24 shrink-0" />
           </div>
        </div>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </DialogContent>
    </Dialog>
  );
}
