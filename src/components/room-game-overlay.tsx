'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import FruitPartyGame from './games/fruit-party-game';
import ForestPartyGame from './games/forest-party-game';
import { LudoGameContent } from './games/ludo-game-content';
import { CarromGameContent } from './games/carrom-game-content';
import { ChessGameContent } from './games/chess-game-content';
import { RouletteGameContent } from './games/roulette-game-content';
import { TeenPattiGameContent } from './games/teen-patti-game-content';
import { X } from 'lucide-react';

interface RoomGameOverlayProps {
 activeGame: string | null;
 roomId?: string;
 onClose: () => void;
}

export function RoomGameOverlay({ activeGame, roomId, onClose }: RoomGameOverlayProps) {
 if (!activeGame) return null;

 return (
  <div className="fixed inset-0 z-[150] flex flex-col pointer-events-none">
   <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />
   
   <div className="relative mt-auto w-full max-w-lg mx-auto bg-transparent pointer-events-auto animate-in slide-in-from-bottom duration-500 flex flex-col h-[65vh] mb-[80px]">
    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 shrink-0" />
    
    <div className="flex-1 overflow-hidden rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 bg-[#0c0c14] relative">
     {activeGame === 'fruit-party' && <FruitPartyGame onClose={onClose} />}
     {activeGame === 'forest-party' && <ForestPartyGame onBack={onClose} />}
     {activeGame === 'ludo' && <LudoGameContent isOverlay={true} roomId={roomId} onClose={onClose} />}
     {activeGame === 'carrom' && <CarromGameContent isOverlay={true} roomId={roomId} onClose={onClose} />}
     {activeGame === 'chess' && <ChessGameContent isOverlay={true} roomId={roomId} onClose={onClose} />}
     {activeGame === 'roulette' && <RouletteGameContent isOverlay={true} onClose={onClose} />}
     {activeGame === 'teen-patti' && <TeenPattiGameContent isOverlay={true} onClose={onClose} />}
     
     {!['fruit-party', 'forest-party', 'ludo', 'carrom', 'chess', 'roulette', 'teen-patti'].includes(activeGame) && (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
       <div className="h-20 w-20 bg-white/10 rounded-full flex items-center justify-center">
        <X className="h-10 w-10 text-white/20" />
       </div>
       <h3 className="text-xl font-bold uppercase tracking-widest text-white/40">Game Frequency Unavailable</h3>
       <button onClick={onClose} className="mt-8 px-8 py-3 bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/5">Return to Room</button>
      </div>
     )}

     {!['fruit-party', 'forest-party'].includes(activeGame || '') && (
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-white transition-colors z-50 border border-white/10"
      >
        <X className="h-5 w-5" />
      </button>
     )}
    </div>
   </div>
  </div>
 );
}
