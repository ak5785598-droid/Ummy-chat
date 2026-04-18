'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Volume2, VolumeX, X, Trophy, Plus } from 'lucide-react';
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
    initializeGame,
    joinLobby, 
    initializeGame,
    startMatch,
    rollDice, 
    movePiece 
  } = useLudoEngine(roomId, user?.uid || null);

  const [isSplashing, setIsSplashing] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Game on Mount (Codex Fix)
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Splash Screen Timer
  useEffect(() => {
    initializeGame();
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 4500); // 4.5s for a nice premium feel
    return () => clearTimeout(timer);
  }, [initializeGame]);

  const isMyTurn = gameState?.turn === user?.uid;
  const isJoined = gameState?.players.some(p => p.uid === user?.uid);
  const currPlayer = gameState?.players.find(p => p.uid === gameState?.turn);

  if (isSplashing || isLoading || !gameState) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#1A0B2E] text-white overflow-hidden relative">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/20 blur-[100px] rounded-full" />
        
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Ludo Icon */}
          <div className="relative w-48 h-48 mb-6 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <img 
              src="/images/premium_3d_ludo_game_icon_1775544459753.png" 
              className="w-full h-full object-contain"
              alt="Ludo Master"
            />
          </div>

          {/* LUDO Logo Text */}
          <div className="flex gap-1 mb-8">
            {[
              { char: 'L', color: 'text-red-500' },
              { char: 'U', color: 'text-yellow-400' },
              { char: 'D', color: 'text-blue-500' },
              { char: 'O', color: 'text-green-500' }
            ].map((item, i) => (
              <motion.span
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className={cn("text-5xl font-black italic tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]", item.color)}
              >
                {item.char}
              </motion.span>
            ))}
          </div>

          {/* Progress Bar Container */}
          <div className="w-64 h-2 bg-white/5 rounded-full border border-white/10 overflow-hidden relative">
             <motion.div 
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 4, ease: "easeInOut" }}
               className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
             />
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 animate-pulse">Entering Arena</p>
        </motion.div>
      </div>
    );
  }

  // --- LOBBY VIEW ---
  if (gameState.status === 'lobby') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#1A0B2E] overflow-hidden relative p-4">
        {/* Background Board Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none p-4">
           <LudoBoard pieces={[]} users={[]} currentPlayerTurn="" onPieceClick={() => {}} />
        </div>

        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full max-w-[400px] bg-gradient-to-b from-purple-600 to-purple-800 rounded-[40px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-4 border-white/10"
        >
          <h2 className="text-2xl font-black text-white italic text-center mb-8 tracking-tight">Quick Mode</h2>

          {/* Player Slots */}
          <div className="grid grid-cols-4 gap-2 mb-10">
            {[0, 1, 2, 3].map(i => {
              const p = gameState.players[i];
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="relative h-14 w-14 rounded-full bg-black/20 border-2 border-white/20 flex items-center justify-center p-0.5 shadow-inner">
                    {p ? (
                      <Avatar className="h-full w-full">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback className="bg-slate-700 text-white text-[10px]">{p.username[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <button 
                        onClick={() => !isJoined && userProfile && joinLobby(userProfile)}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <Plus className="h-5 w-5 text-white/40" />
                      </button>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-white/50 uppercase truncate max-w-full">
                    {p?.uid === user?.uid ? 'You' : p?.username || `...`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-6">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] animate-pulse">Waiting for friends to join..</p>
            
            {!isJoined ? (
              <button
                onClick={() => userProfile && joinLobby(userProfile)}
                className="w-full h-16 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full border-b-8 border-orange-700 shadow-2xl flex items-center justify-center active:translate-y-1 active:border-b-4 transition-all"
              >
                <span className="text-2xl font-black text-black italic tracking-tighter uppercase">JOIN</span>
              </button>
            ) : (
              gameState.players.length >= 2 ? (
                <button
                  onClick={startMatch}
                  className="w-full h-16 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full border-b-8 border-orange-700 shadow-2xl flex items-center justify-center active:translate-y-1 active:border-b-4 transition-all"
                >
                  <span className="text-2xl font-black text-black italic tracking-tighter uppercase">START</span>
                </button>
              ) : (
                <div className="h-16 w-full opacity-50 bg-black/20 rounded-full flex items-center justify-center border-2 border-white/5">
                   <span className="text-sm font-black text-white/30 uppercase tracking-[0.5em]">Waiting</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    );
  }

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
