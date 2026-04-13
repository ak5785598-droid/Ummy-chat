'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import FruitPartyGame from './games/fruit-party-game';
import ForestPartyGame from './games/forest-party-game';
import { X } from 'lucide-react';

interface RoomGameOverlayProps {
 activeGame: string | null;
 onClose: () => void;
}

export function RoomGameOverlay({ activeGame, onClose }: RoomGameOverlayProps) {
 if (!activeGame) return null;

 return (
  <div className="fixed inset-0 z-[150] flex flex-col pointer-events-none">
   {/* Click outside to close - Higher room visibility */}
   <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-auto" onClick={onClose} />
   
   <div className="relative mt-auto w-full max-w-lg mx-auto bg-transparent pointer-events-auto animate-in slide-in-from-bottom duration-500 flex flex-col h-[60vh] mb-[80px]">
    <div className="flex-1 overflow-hidden rounded-t-[3rem] shadow-2xl border-t border-white/20 bg-[#58319d]">
     {activeGame === 'fruit-party' && (
      <FruitPartyGame onClose={onClose} />
     )}

     {activeGame === 'forest-party' && (
      <ForestPartyGame onBack={onClose} />
     )}
     
     {activeGame !== 'fruit-party' && activeGame !== 'forest-party' && (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
       <div className="h-20 w-20 bg-white/10 rounded-full flex items-center justify-center">
        <X className="h-10 w-10 text-white/20" />
       </div>
       <h3 className="text-xl font-bold uppercase tracking-widest text-white/40">Game Frequency Unavailable</h3>
       <p className="text-xs text-white/20 uppercase tracking-widest leading-loose">The requested dimension is currently syncing. Please try again later.</p>
       <button onClick={onClose} className="mt-8 px-8 py-3 bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all border border-white/5">Return to Room</button>
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
