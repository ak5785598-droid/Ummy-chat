'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Volume2, VolumeX, X, Trophy } from 'lucide-react';
import { useLudoEngine } from '@/hooks/use-ludo-engine';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { LudoBoard } from '@/components/games/ludo-board';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LudoGameContentProps {
  isOverlay?: boolean;
  roomId?: string;
  onClose?: () => void;
}

export function LudoGameContent({ isOverlay, roomId: propRoomId, onClose }: LudoGameContentProps) {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const roomId = propRoomId || 'lobby';
  
  const { 
    gameState, 
    isLoading, 
    joinLobby, 
    rollDice, 
    movePiece 
  } = useLudoEngine(roomId, user?.uid || null);

  const [isMuted, setIsMuted] = useState(false);

  // Auto-join lobby on load
  useEffect(() => {
    if (!isLoading && user && userProfile && (!gameState || gameState.status === 'lobby')) {
      const inLobby = gameState?.players.some(p => p.uid === user.uid);
      if (!inLobby) {
        joinLobby(userProfile);
      }
    }
  }, [isLoading, user, userProfile, gameState, joinLobby]);

  if (isLoading || !gameState) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a1a4a] text-white min-h-[400px]">
        <img src="/images/ummy-logon.png" className="h-20 w-20 animate-bounce mb-4" alt="Loading" />
        <p className="font-black italic tracking-widest animate-pulse">SYNCING LUDO ARENA...</p>
      </div>
    );
  }

  const isMyTurn = gameState.turn === user?.uid;
  const currPlayer = gameState.players.find(p => p.uid === gameState.turn);

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col relative overflow-hidden bg-[#0a1a4a] pb-10",
      !isOverlay && "min-h-screen"
    )}>
      
      {/* Premium Header */}
      <header className="relative z-40 p-4 pt-10 flex items-center justify-between bg-black/40 backdrop-blur-md text-white border-b border-white/5">
         <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
           <ChevronLeft className="h-6 w-6" />
         </button>
         <div className="flex flex-col items-center">
           <h1 className="text-xl font-black italic tracking-tighter leading-none">LUDO MASTER</h1>
           <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Room ID: {roomId}</span>
         </div>
         <div className="flex gap-2 text-white/70">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-full">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full">
              <X className="h-5 w-5" />
            </button>
         </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-2 pt-4">
         
         {/* HIGH FIDELITY BOARD - Now with corner avatars */}
         <div className="w-full max-w-[480px] px-2 animate-in fade-in zoom-in duration-500">
           <LudoBoard 
              pieces={gameState.pieces} 
              users={gameState.players} 
              currentPlayerTurn={gameState.turn}
              onPieceClick={(id) => movePiece(id)}
           />
         </div>

         {/* GAME CONTROLS / DICE - Premium Glossy Style */}
         <div className="mt-6 flex flex-col items-center gap-4 w-full px-6">
            <AnimatePresence mode="wait">
              {isMyTurn && !gameState.diceRolled ? (
                <motion.div
                  key="roll-area"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <button
                    onClick={rollDice}
                    className="group relative h-20 w-20 flex items-center justify-center active:scale-90 transition-all"
                  >
                    {/* Shadow/Glow */}
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-xl group-hover:bg-yellow-400/40 transition-colors" />
                    
                    {/* Button Body */}
                    <div className="relative h-full w-full bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-3xl border-b-8 border-orange-700 flex items-center justify-center shadow-2xl overflow-hidden">
                       {/* Gloss reflection */}
                       <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                       <span className="text-4xl filter drop-shadow-lg">🎲</span>
                    </div>
                  </button>
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] animate-pulse">Your Turn to Roll</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="status"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-3xl px-10 py-4 rounded-3xl border border-white/10 shadow-2xl"
                >
                   <div className="flex flex-col items-center min-w-[60px]">
                     <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Dice</span>
                     <div className={cn(
                       "text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                       gameState.dice === 6 && "text-yellow-400"
                     )}>
                       {gameState.dice || '—'}
                     </div>
                   </div>
                   
                   <div className="w-px h-10 bg-white/10" />
                   
                   <div className="flex flex-col items-start min-w-[100px]">
                     <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Current Turn</span>
                     <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border border-white/20">
                          <AvatarImage src={currPlayer?.avatarUrl} />
                          <AvatarFallback className="text-[8px] bg-slate-800 text-white">{currPlayer?.username[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[12px] font-black text-white uppercase italic truncate max-w-[80px]">
                          {isMyTurn ? 'YOU' : currPlayer?.username || 'WAITING'}
                        </span>
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isMyTurn && gameState.diceRolled && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white font-black text-[11px] uppercase tracking-[0.2em] animate-pulse flex items-center gap-2 mt-2"
              >
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" /> Select Piece to Move
              </motion.p>
            )}
         </div>

      </main>

      {/* WIN OVERLAY logic placeholder */}
      {gameState.status === 'ended' && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8">
           <Trophy className="h-32 w-32 text-yellow-400 mb-6 animate-bounce" />
           <h2 className="text-4xl font-black text-white uppercase tracking-widest italic mb-2">Victory!</h2>
           <p className="text-white/60 font-bold uppercase tracking-widest">{gameState.winner === user?.uid ? 'You are the Master!' : 'Better luck next time'}</p>
           <button 
             onClick={handleBack}
             className="mt-12 px-10 py-4 bg-white text-black font-black uppercase rounded-full"
           >
             Exit Arena
           </button>
        </div>
      )}
    </div>
  );
}
