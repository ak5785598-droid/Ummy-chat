'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Volume2, VolumeX, X, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useLudoEngine } from '@/hooks/use-ludo-engine';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { LudoBoard } from '@/components/games/ludo-board';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function LudoGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || 'lobby';
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  
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
      // Check if already in lobby
      const inLobby = gameState?.players.some(p => p.uid === user.uid);
      if (!inLobby) {
        joinLobby(userProfile);
      }
    }
  }, [isLoading, user, userProfile, gameState, joinLobby]);

  if (isLoading || !gameState) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a1a4a] text-white">
        <img src="/images/ummy-logon.png" className="h-20 w-20 animate-bounce mb-4" alt="Loading" />
        <p className="font-black italic tracking-widest animate-pulse">SYNCING LUDO ARENA...</p>
      </div>
    );
  }

  const isMyTurn = gameState.turn === user?.uid;
  const currPlayer = gameState.players.find(p => p.uid === gameState.turn);

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-[#0a1a4a] pb-10 min-h-screen">
      
      {/* Premium Header */}
      <header className="relative z-40 p-4 pt-10 flex items-center justify-between bg-black/40 backdrop-blur-md text-white border-b border-white/5">
         <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
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
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
              <X className="h-5 w-5" />
            </button>
         </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
         
         {/* PLAYER CARDS Grid */}
         <div className="w-full max-w-[450px] grid grid-cols-2 gap-4 mb-6">
           {gameState.players.map((p, i) => (
             <div 
              key={p.uid} 
              className={cn(
                "flex items-center gap-3 p-2 rounded-2xl border transition-all",
                gameState.turn === p.uid ? "bg-white/10 border-white/20 shadow-lg scale-105" : "bg-black/20 border-white/5 opacity-50"
              )}
             >
               <div className="relative">
                 <Avatar className={cn("h-10 w-10 border-2", 
                   p.color === 'blue' && "border-blue-500",
                   p.color === 'red' && "border-red-500",
                   p.color === 'yellow' && "border-yellow-400",
                   p.color === 'green' && "border-green-500"
                 )}>
                   <AvatarImage src={p.avatarUrl} />
                   <AvatarFallback>{p.username[0]}</AvatarFallback>
                 </Avatar>
                 {gameState.turn === p.uid && <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-[#0a1a4a] animate-pulse" />}
               </div>
               <div className="flex flex-col min-w-0">
                 <span className="text-[10px] font-black text-white truncate">{p.username}</span>
                 <span className={cn("text-[8px] font-bold uppercase",
                   p.color === 'blue' && "text-blue-400",
                   p.color === 'red' && "text-red-400",
                   p.color === 'yellow' && "text-yellow-400",
                   p.color === 'green' && "text-green-400"
                 )}>{p.color}</span>
               </div>
             </div>
           ))}
         </div>

         {/* HIGH FIDELITY BOARD */}
         <LudoBoard 
            pieces={gameState.pieces} 
            users={gameState.players} 
            currentPlayerTurn={gameState.turn}
            onPieceClick={(id) => movePiece(id)}
         />

         {/* GAME CONTROLS / DICE */}
         <div className="mt-8 flex flex-col items-center gap-4 w-full">
            <AnimatePresence mode="wait">
              {isMyTurn && !gameState.diceRolled ? (
                <motion.button
                  key="roll"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={rollDice}
                  className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black uppercase tracking-widest rounded-full shadow-[0_5px_0_#ca8a04] hover:shadow-none hover:translate-y-1 transition-all active:scale-95 text-sm"
                >
                  Roll Dice 🎲
                </motion.button>
              ) : (
                <motion.div 
                  key="status"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4 bg-black/30 px-8 py-3 rounded-2xl border border-white/5"
                >
                   <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Dice Status</span>
                     <span className="text-xl font-black text-white">{gameState.dice || '—'}</span>
                   </div>
                   <div className="w-px h-8 bg-white/10" />
                   <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Turn Of</span>
                     <span className="text-[10px] font-bold text-white uppercase italic">{currPlayer?.username || 'WAITING'}</span>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isMyTurn && gameState.diceRolled && (
              <p className="text-white font-black text-[10px] uppercase tracking-widest animate-pulse mt-2">👇 Select Piece to Move</p>
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
             onClick={() => router.back()}
             className="mt-12 px-10 py-4 bg-white text-black font-black uppercase rounded-full"
           >
             Exit Arena
           </button>
        </div>
      )}
    </div>
  );
}

export default function LudoGamePage() {
  return (
    <AppLayout fullScreen>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0a1a4a] font-black text-white uppercase tracking-[0.5em] animate-pulse">Initializing Board...</div>}>
        <LudoGameContent />
      </Suspense>
    </AppLayout>
  );
}
