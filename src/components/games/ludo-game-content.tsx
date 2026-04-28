'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  X, 
  Trophy, 
  Plus, 
  Move, 
  HelpCircle, 
  ChevronDown 
} from 'lucide-react';
import { useLudoEngine } from '@/hooks/use-ludo-engine';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { LudoBoard } from '@/components/games/ludo-board';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

interface LudoGameContentProps {
  isOverlay?: boolean;
  roomId?: string;
  onClose?: () => void;
}

export function LudoGameContent({ isOverlay, roomId: propRoomId, onClose }: LudoGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const roomId = propRoomId || 'lobby';
  
  const { 
    gameState, 
    isLoading, 
    joinLobby, 
    initializeGame,
    startMatch,
    resetGame,
    leaveGame,
    rollDice, 
    movePiece,
    skipTurn
  } = useLudoEngine(roomId, user?.uid || null);
  
  // STABLE REFS: Prevent infinite loops in cleanup
  const leaveGameRef = React.useRef(leaveGame);
  useEffect(() => { leaveGameRef.current = leaveGame; }, [leaveGame]);

  // ROBUST JOIN STATE: Prevent flickering when players join
  const [hasConfirmedJoin, setHasConfirmedJoin] = useState(false);
  const isJoined = gameState?.players.some(p => p.uid === user?.uid) || hasConfirmedJoin;
  const isMyTurn = gameState?.turn === user?.uid;
  const currPlayer = gameState?.players.find(p => p.uid === gameState?.turn);

  const [isSplashing, setIsSplashing] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Game on Mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Sync confirmed join status
  useEffect(() => {
    if (gameState?.players.some(p => p.uid === user?.uid)) {
      setHasConfirmedJoin(true);
    }
  }, [gameState?.players, user?.uid]);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 4500); 
    return () => clearTimeout(timer);
  }, []);

  // --- AUTOMATIC SESSION CLEANUP (DEPRECATED FOR STABILITY) ---
  // Note: We removed the auto-reset useEffect because it was causing race conditions
  // and infinite loops during match starts. Manual reset is now the safe fallback.

  // --- AUTOMATIC SESSION CLEANUP ---
  // We remove the automatic unmount-leave to prevent the "Loading-Unmount-Reset" Loop.
  // Instead, the leave logic is handled by specific back/close actions or room exit.

  // --- AUTO-SKIP TURN IF NO MOVES POSSIBLE ---
  useEffect(() => {
    if (!gameState || !user?.uid || gameState.status !== 'playing' || gameState.turn !== user?.uid || !gameState.diceRolled) return;

    const dice = gameState.dice || 0;
    const myPieces = gameState.pieces.filter(p => p.color === gameState.players.find(pl => pl.uid === user?.uid)?.color);
    
    const canMoveAnyPiece = myPieces.some(p => {
      if (p.position === 0) return dice === 6;
      if (p.position >= 1 && p.position < 57) return p.position + dice <= 57;
      return false;
    });

    if (!canMoveAnyPiece) {
      console.log("Ludo: No moves possible, auto-skipping in 1.5s...");
      const timer = setTimeout(() => {
        skipTurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, user?.uid, skipTurn]);

  // --- 28 SECOND TURN TIMER AUTO-SKIP ---
  const [timeLeft, setTimeLeft] = useState(28);
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || !gameState.turnStartTime) {
      setTimeLeft(28);
      return;
    }

    const interval = setInterval(() => {
      const startTime = gameState.turnStartTime?.toDate?.()?.getTime() || Date.now();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 28 - elapsed);
      setTimeLeft(remaining);

      // Only the person whose turn it is triggers the skip to prevent multiple triggers
      if (remaining === 0 && gameState.turn === user?.uid && gameState.status === 'playing') {
        console.log("Ludo: Time's up! Auto-skipping turn...");
        skipTurn();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.turnStartTime, gameState?.turn, gameState?.status, user?.uid, skipTurn]);

  const handleBack = () => {
    if (user?.uid && isJoined) {
      leaveGame(user.uid);
    }
    setHasConfirmedJoin(false); // Reset on exit
    if (onClose) onClose();
    else router.back();
  };


  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={isOverlay ? { y: 0 } : {}}
      className={cn(
        "h-fit max-h-[90vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-slate-900/60 backdrop-blur-3xl pb-1 rounded-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
        !isOverlay && "min-h-screen"
      )}
    >
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/pinstripe-dark.png")' }} />
      
      {/* Premium Header - WAF Style (Translucent Purple Gradient) */}
      <header className="relative z-50 p-2.5 pt-3.5 flex items-center justify-between text-white border-b border-white/10 bg-gradient-to-b from-purple-600/30 via-purple-700/20 to-transparent backdrop-blur-md">
         <div className="flex items-center gap-0.5">
            <button 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-grab active:cursor-grabbing group"
            >
              <Move className="h-4.5 w-4.5 text-white/80 group-active:text-white" />
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
              {isMuted ? <VolumeX className="h-4.5 w-4.5 text-white/60" /> : <Volume2 className="h-4.5 w-4.5 text-white/80" />}
            </button>
         </div>

         <div className="flex flex-col items-center">
            <h1 className="text-sm font-black uppercase italic tracking-tighter leading-none text-white drop-shadow-md">
              {isSplashing ? 'Ludo Master' : (gameState?.status === 'lobby' ? 'Quick Mode' : 'Ludo Master')}
            </h1>
         </div>

         <div className="flex items-center gap-0.5">
            <button className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
              <HelpCircle className="h-4.5 w-4.5 text-white/40" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
              <ChevronDown className="h-4.5 w-4.5 text-white/40" />
            </button>
            <button onClick={handleBack} className="p-2 hover:bg-red-500/20 rounded-xl transition-all bg-red-500/10 text-red-500 ml-1 border border-red-500/20 active:scale-90">
              <X className="h-4.5 w-4.5" />
            </button>
         </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-start p-1.5 pt-0.5 overflow-y-auto">
        

        {/* --- LOBBY / JOIN VIEW --- */}
        {/* Show this if user hasn't joined YET. This satisfies "Har bar Join dikhe" */}
        {!isSplashing && !isJoined && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[400px] flex flex-col items-center gap-2 py-2"
          >
            <div className="relative w-full aspect-square opacity-20 pointer-events-none scale-75 -my-40">
               <LudoBoard pieces={[]} users={[]} currentPlayerTurn="" onPieceClick={() => {}} />
            </div>

            <div className="relative z-10 w-full bg-gradient-to-b from-purple-600/40 to-purple-800/40 backdrop-blur-xl rounded-[40px] p-8 border-2 border-white/10 shadow-2xl">
              <h2 className="text-2xl font-black text-white italic text-center mb-8 tracking-tight">Quick Mode</h2>
              
              <div className="grid grid-cols-4 gap-2 mb-10">
                {[0, 1, 2, 3].map(i => {
                  const p = gameState?.players[i];
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="relative h-14 w-14 rounded-full bg-black/40 border-2 border-white/20 flex items-center justify-center p-0.5 shadow-inner">
                        {p ? (
                          <Avatar className="h-full w-full">
                            <AvatarImage src={p.avatarUrl} />
                            <AvatarFallback className="bg-slate-700 text-white text-[10px] font-black uppercase">
                              {(p.username || 'P').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <button 
                            onClick={() => gameState?.status === 'lobby' && userProfile && joinLobby(userProfile)}
                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            <Plus className="h-5 w-5 text-white/40" />
                          </button>
                        )}
                      </div>
                      <span className="text-[8px] font-black text-white/50 uppercase truncate max-w-[50px]">
                        {p?.uid === user?.uid ? 'You' : (p?.username === 'IMAGE' ? 'Player' : (p?.username || '...'))}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-6">
                {gameState?.status === 'lobby' ? (
                  <button
                    onClick={() => userProfile && joinLobby(userProfile)}
                    className="w-full h-16 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full border-b-8 border-orange-700 shadow-2xl flex items-center justify-center active:translate-y-1 active:border-b-4 transition-all"
                  >
                    <span className="text-2xl font-black text-black italic tracking-tighter uppercase">JOIN GAME</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="h-16 w-full opacity-50 bg-black/40 rounded-full flex items-center justify-center border-2 border-white/5">
                       <span className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Match in Progress</span>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase text-center">Please wait for the current match to finish</p>
                    
                    {/* EMERGENCY RESET FOR STUCK SESSIONS */}
                    {(gameState?.players.length || 0) < 2 && (
                      <button 
                        onClick={resetGame}
                        className="mt-2 text-[9px] font-black text-blue-400 uppercase tracking-tighter hover:text-blue-300 transition-colors underline underline-offset-2"
                      >
                        Reset Stuck Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- MAIN GAME VIEW --- */}
        {!isSplashing && isJoined && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center"
          >
             {/* If game is in lobby status but user has joined, show Start button area */}
             {gameState?.status === 'lobby' ? (
               <div className="w-full max-w-[400px] bg-white/5 backdrop-blur-xl rounded-[40px] p-8 border border-white/10 flex flex-col items-center gap-6 mb-4">
                 <h3 className="text-lg font-black text-white uppercase italic">Ready to Start?</h3>
                 {gameState.players.length >= 2 ? (
                    <button
                      onClick={startMatch}
                      className="w-full h-16 bg-gradient-to-b from-green-400 to-emerald-600 rounded-full border-b-8 border-emerald-800 shadow-2xl flex items-center justify-center active:translate-y-1 active:border-b-4 transition-all"
                    >
                      <span className="text-2xl font-black text-white italic tracking-tighter uppercase">START MATCH</span>
                    </button>
                  ) : (
                    <div className="h-16 w-full opacity-50 bg-black/40 rounded-full flex items-center justify-center border-2 border-white/5">
                       <span className="text-sm font-black text-white/30 uppercase tracking-[0.4em] animate-pulse">Waiting for Players</span>
                    </div>
                  )}
                  {/* Option to leave if match hasn't started */}
                  <button onClick={() => user?.uid && leaveGame(user.uid)} className="text-[10px] font-bold text-white/30 uppercase hover:text-white transition-colors">Leave Lobby</button>
               </div>
             ) : (
               <>
                 <div className="w-full max-w-[480px] px-2 animate-in fade-in zoom-in duration-500 mb-4">
                   <LudoBoard 
                      pieces={gameState?.pieces || []} 
                      users={gameState?.players || []} 
                      currentPlayerTurn={gameState?.turn || ''}
                      onPieceClick={(id) => movePiece(id)}
                   />
                 </div>

                 <div className="mt-1 flex flex-col items-center gap-2 w-full px-6 pb-2">
                    <AnimatePresence mode="wait">
                      {isMyTurn && !gameState?.diceRolled ? (
                        <motion.div
                          key="roll-area"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          className="flex flex-col items-center gap-1"
                        >
                          <button
                            onClick={rollDice}
                            className="group relative h-14 w-14 flex items-center justify-center active:scale-95 transition-all"
                          >
                            <div className="absolute inset-0 bg-yellow-400/20 rounded-xl blur-lg group-hover:bg-yellow-400/30 transition-colors" />
                            <div className="relative h-full w-full bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl border-b-4 border-orange-700 flex items-center justify-center shadow-2xl overflow-hidden">
                               <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                               <span className="text-2xl filter drop-shadow-lg">🎲</span>
                            </div>
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="status"
                          initial={{ opacity: 0, scale: 1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2 rounded-2xl border border-white/10 shadow-lg"
                        >
                           <div className="flex flex-col items-center min-w-[40px]">
                             <span className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Dice</span>
                             <div className={cn(
                               "text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]",
                               gameState?.dice === 6 && "text-yellow-400"
                             )}>
                               {gameState?.dice || '—'}
                             </div>
                           </div>
                           <div className="w-px h-6 bg-white/10" />
                           <div className="flex flex-col items-start min-w-[70px] relative">
                             <span className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Turn</span>
                             
                             {/* TIMER BADGE */}
                             {gameState?.status === 'playing' && (
                               <div className={cn(
                                 "absolute -top-6 left-0 px-2 py-0.5 rounded-md border font-black text-[9px] transition-all duration-300",
                                 timeLeft <= 5 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-blue-500/20 border-blue-500 text-blue-400"
                               )}>
                                 {timeLeft}s
                               </div>
                             )}

                             <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5 border border-white/20">
                                  <AvatarImage src={currPlayer?.avatarUrl} />
                                  <AvatarFallback className="text-[6px] bg-slate-800 text-white">{(currPlayer?.username || 'P')[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-black text-white uppercase italic truncate max-w-[60px]">
                                  {isMyTurn ? 'YOU' : currPlayer?.username || 'WAITING'}
                                </span>
                             </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isMyTurn && gameState?.diceRolled && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white font-black text-[9px] uppercase tracking-[0.1em] animate-pulse flex items-center gap-1.5 mt-0.5"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" /> Select Piece
                      </motion.p>
                    )}
                 </div>
               </>
             )}
          </motion.div>
        )}
      </main>

      {/* WIN OVERLAY */}
      {gameState?.status === 'ended' && (
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
    </motion.div>
  );
}
