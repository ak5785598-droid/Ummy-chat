'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  Volume2, 
  VolumeX, 
  Trophy, 
  X,
  Plus,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCarromEngine } from '@/hooks/use-carrom-engine';
import { motion, useDragControls } from 'framer-motion';

interface CarromGameContentProps {
  roomId?: string;
  isOverlay?: boolean;
  onClose?: () => void;
}

export function CarromGameContent({ roomId: propsRoomId, isOverlay = false, onClose }: CarromGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const roomId = propsRoomId || 'lobby';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);

  const { 
    gameState, 
    initializeGame, 
    selectMode, 
    joinArena, 
    startMatch,
    updateStriker,
    strike 
  } = useCarromEngine(roomId, currentUser?.uid || null);

  const [isSplashing, setIsSplashing] = useState(true);
  const [power, setPower] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashing(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isSplashing) {
    return (
      <div className="h-full w-full bg-[#01091A] flex flex-col items-center justify-center space-y-8 min-h-[400px]">
        <div className="relative h-48 w-48 animate-pulse shadow-[0_0_100px_rgba(59,130,246,0.3)] rounded-full flex items-center justify-center">
            <Trophy className="h-24 w-24 text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
        </div>
        <div className="flex flex-col items-center gap-2">
           <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl">Carrom Arena</h1>
           <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: "100%" }}
               transition={{ duration: 2.5 }}
               className="h-full bg-blue-500"
             />
           </div>
        </div>
      </div>
    );
  }

  const isJoined = gameState.players.some(p => p.uid === currentUser?.uid);

  // --- ARENA MODE SELECTION ---
  if (!gameState.mode) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#01091A] p-6 relative overflow-hidden min-h-[400px]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-[400px] bg-black/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/10 shadow-2xl flex flex-col items-center"
        >
          <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
          <h2 className="text-2xl font-black text-white italic tracking-tight mb-2 uppercase">Arena Setup</h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-8">Select Match Difficulty</p>
          
          <div className="grid grid-cols-1 gap-4 w-full">
            <button 
              onClick={() => selectMode('freestyle', 0)}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left flex items-center justify-between"
            >
              <div>
                <span className="text-lg font-black text-white italic">FREESTYLE</span>
                <p className="text-[10px] text-white/40 font-bold uppercase">Beginner Friendly • Free</p>
              </div>
              <Plus className="text-white/20" />
            </button>
            <button 
              onClick={() => selectMode('professional', 100)}
              className="p-6 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 hover:from-yellow-500/30 transition-all text-left flex items-center justify-between"
            >
              <div>
                <span className="text-lg font-black text-yellow-500 italic">PROFESSIONAL</span>
                <p className="text-[10px] text-yellow-500/60 font-bold uppercase">100 Coins Entry • Ranked</p>
              </div>
              <Plus className="text-yellow-500/40" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // NOTE: Lobby View removed as requested to show Board directly.

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  // Corners Array for the 4 Plus Icons
  const corners = [
    { pos: 'top-2 left-2', index: 0 },
    { pos: 'top-2 right-2', index: 1 },
    { pos: 'bottom-2 left-2', index: 2 },
    { pos: 'bottom-2 right-2', index: 3 },
  ];

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={isOverlay ? { y: '35%' } : {}}
      className={cn(
        "h-fit max-h-[90vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#004D40] text-white select-none pb-4 rounded-[2.8rem] border border-white/20 shadow-2xl",
        !isOverlay && "min-h-screen"
      )}
    >
      
      {/* Arena Header */}
      <header className="relative z-50 flex items-center justify-between p-4 pt-10 shrink-0 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-2">
          <button 
            onPointerDown={(e) => dragControls.start(e)}
            className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-grab active:cursor-grabbing text-white/80"
          >
            <Move className="h-4.5 w-4.5" />
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-90">
            {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
          </button>
        </div>
        
        <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 italic">
          <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" /> Carrom Arena
        </h2>

        <div className="flex gap-2">
            <button onClick={handleBack} className="bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-red-500 transition-all active:scale-95">
              <X className="h-4.5 w-4.5 font-bold" />
            </button>
        </div>
      </header>

      {/* The Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-[400px] aspect-square rounded-[2rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[14px] border-[#3D2616] p-4 bg-[#F5D4B2]">
           <img 
             src="/images/games/carrom/board_texture.png" 
             className="absolute inset-0 w-full h-full object-cover opacity-90"
             alt="Board"
           />

           {/* Corner Join Icons */}
           {corners.map((corner) => {
             const player = gameState.players[corner.index];
             return (
               <div key={corner.pos} className={cn("absolute z-50", corner.pos)}>
                 {player ? (
                   <Avatar className="h-8 w-8 border-2 border-black shadow-md">
                     <AvatarImage src={player.avatarUrl} />
                     <AvatarFallback className="bg-slate-700 text-[8px] text-white">{player.username[0]}</AvatarFallback>
                   </Avatar>
                 ) : (
                   <button 
                     onClick={() => !isJoined && userProfile && joinArena(userProfile)}
                     className="h-7 w-7 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                   >
                     <Plus className="h-4 w-4 text-black stroke-[4px]" />
                   </button>
                 )}
               </div>
             );
           })}

           <div className="relative w-full h-full z-10 pointer-events-none">
              {gameState.pieces.map(piece => {
                if (piece.isPocketed) return null;
                return (
                  <div 
                    key={piece.id}
                    className={cn(
                      "absolute h-6 w-6 rounded-full border border-black/20 shadow-lg flex items-center justify-center",
                      piece.type === 'white' ? 'bg-[#E0C097]' : piece.type === 'black' ? 'bg-[#212121]' : 'bg-[#D32F2F]'
                    )}
                    style={{ 
                      left: `${piece.x}%`, 
                      top: `${piece.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="h-4 w-4 rounded-full border border-black/10 opacity-50" />
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/20 backdrop-blur-md rounded-t-3xl border-t border-white/5 flex flex-col gap-4 mt-auto">
        <div className="flex items-center justify-between">
           <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">
             {gameState.status === 'lobby' ? 'Waiting for players' : "Contender's Turn"}
           </span>
           <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-white/20">
                <AvatarImage src={gameState.players.find(p => p.uid === gameState.turn)?.avatarUrl} />
                <AvatarFallback className="text-[8px] bg-slate-800">U</AvatarFallback>
              </Avatar>
              <span className="text-sm font-black uppercase italic">
                {gameState.players.find(p => p.uid === gameState.turn)?.username || 'No Player'}
              </span>
           </div>
        </div>

        {gameState.status === 'lobby' && isJoined && gameState.players.length >= 2 ? (
          <button
            onClick={startMatch}
            className="w-full h-16 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-2xl border-b-8 border-orange-700 flex items-center justify-center active:scale-95 active:translate-y-1 active:border-b-4 transition-all"
          >
            <span className="text-xl font-black text-black italic uppercase tracking-tighter">START MATCH</span>
          </button>
        ) : (
          <>
            <div className="space-y-2">
               <div className="flex justify-between text-[8px] font-black uppercase text-white/40 italic">
                  <span>Strike Intensity</span>
                  <span>{Math.round(power)}%</span>
               </div>
               <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${power}%` }}
                  />
               </div>
            </div>

            <button 
              disabled={gameState.status === 'lobby'}
              onClick={() => strike(power)}
              className={cn(
                "h-16 w-full bg-gradient-to-b from-blue-500 to-blue-700 rounded-2xl border-b-8 border-blue-900 flex items-center justify-center active:scale-95 active:translate-y-1 active:border-b-4 transition-all",
                gameState.status === 'lobby' && "opacity-50 grayscale cursor-not-allowed"
              )}
            >
              <span className="text-xl font-black text-white italic uppercase tracking-tighter">STRIKE</span>
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}q
