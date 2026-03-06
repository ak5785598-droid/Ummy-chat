'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Swords, Flame, Briefcase, Sparkles, HelpCircle, Plus, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * High-Fidelity Room Play Portal.
 * RE-ENGINEERED: Now includes the Battle Setup Dimension.
 */
export function RoomPlayDialog({ open, onOpenChange }: RoomPlayDialogProps) {
  const [view, setView] = useState<'grid' | 'battle'>('grid');
  const [battleMode, setBattleMode] = useState<'Votes' | 'Coins'>('Votes');
  const [battleTime, setBattleTime] = useState('30 s');

  const options = [
    { 
      id: 'battle', 
      label: 'Battle', 
      onClick: () => setView('battle'),
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-red-500 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden group">
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              <Swords className="h-8 w-8 text-white drop-shadow-md animate-pulse" />
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    },
    { 
      id: 'calculator', 
      label: 'Calculator', 
      onClick: () => {},
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
      onClick: () => {},
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

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => setView('grid'), 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        
        {view === 'grid' ? (
          <>
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white/90">Room Play</DialogTitle>
              <DialogDescription className="sr-only">Choose a room game or tool frequency.</DialogDescription>
            </DialogHeader>

            <div className="p-8 pt-2 pb-16">
               <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                  {options.map((opt) => (
                    <button 
                      key={opt.id}
                      onClick={opt.onClick}
                      className="flex flex-col items-center gap-3 shrink-0 active:scale-90 transition-transform"
                    >
                       <div className="relative p-4 bg-white/5 rounded-3xl border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                          {opt.icon}
                       </div>
                       <span className="text-sm font-black uppercase italic text-white/80 tracking-tight">{opt.label}</span>
                    </button>
                  ))}
                  <div className="w-24 shrink-0" />
               </div>
            </div>
          </>
        ) : (
          /* BATTLE SETUP VIEW - Blue/Red Ornate Cards */
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="p-6 pb-2 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-red-500 p-0.5 border border-white/20">
                     <div className="w-full h-full bg-black/40 rounded-full flex items-center justify-center">
                        <Swords className="h-5 w-5 text-white" />
                     </div>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Battle</h2>
               </div>
               <button className="p-1 hover:scale-110 transition-transform"><HelpCircle className="h-6 w-6 text-yellow-500" /></button>
            </header>

            <div className="p-6 space-y-8">
               {/* Select People Dimension */}
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Select People</h3>
                  <div className="grid grid-cols-2 gap-4">
                     {/* Blue Card */}
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#004d40] via-[#006064] to-[#00acc1] border-2 border-cyan-400/20 shadow-2xl overflow-hidden group">
                        <OrnateCorners color="#fbbf24" />
                        <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
                        <button className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform">
                           <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border-2 border-white/20">
                              <Plus className="h-6 w-6 text-white" />
                           </div>
                        </button>
                     </div>
                     
                     {/* Red Card */}
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#4a0e0e] via-[#880e4f] to-[#b71c1c] border-2 border-red-400/20 shadow-2xl overflow-hidden group">
                        <OrnateCorners color="#fbbf24" />
                        <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" style={{ animationDelay: '1s' }} />
                        <button className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform">
                           <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border-2 border-white/20">
                              <Plus className="h-6 w-6 text-white" />
                           </div>
                        </button>
                     </div>
                  </div>
               </div>

               {/* Mode Selection Dimension */}
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Mode</h3>
                  <div className="flex gap-3">
                     {['Votes', 'Coins'].map((m) => (
                       <button 
                         key={m} 
                         onClick={() => setBattleMode(m as any)}
                         className={cn(
                           "flex-1 h-12 rounded-2xl font-black uppercase italic text-sm transition-all border-2",
                           battleMode === m ? "bg-emerald-600/80 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)]" : "bg-white/5 border-white/5 text-white/40"
                         )}
                       >
                          {m}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Time Selection Dimension */}
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Time</h3>
                  <div className="grid grid-cols-3 gap-3">
                     {['30 s', '1 min', '5 min', '10 min', '15 min'].map((t) => (
                       <button 
                         key={t}
                         onClick={() => setBattleTime(t)}
                         className={cn(
                           "h-12 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all border-2",
                           battleTime === t ? "bg-emerald-600/80 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)]" : "bg-white/5 border-white/5 text-white/40"
                         )}
                       >
                          {t}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Final Start Portal */}
               <div className="pt-4 pb-10">
                  <Button className="w-full h-16 rounded-[1.5rem] bg-emerald-800/80 hover:bg-emerald-700 text-emerald-400 border-2 border-yellow-500/40 font-black uppercase italic text-xl shadow-xl shadow-emerald-950/20 active:scale-95 transition-all">
                     Start
                  </Button>
               </div>
            </div>
          </div>
        )}

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </DialogContent>
    </Dialog>
  );
}

/**
 * High-Fidelity Ornate Corner SVG Graphics.
 */
function OrnateCorners({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-60">
       {/* Top Left */}
       <svg viewBox="0 0 40 40" className="absolute top-2 left-2 w-8 h-8" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
       {/* Top Right */}
       <svg viewBox="0 0 40 40" className="absolute top-2 right-2 w-8 h-8 rotate-90" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
       {/* Bottom Left */}
       <svg viewBox="0 0 40 40" className="absolute bottom-2 left-2 w-8 h-8 -rotate-90" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
       {/* Bottom Right */}
       <svg viewBox="0 0 40 40" className="absolute bottom-2 right-2 w-8 h-8 rotate-180" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
    </div>
  );
}
