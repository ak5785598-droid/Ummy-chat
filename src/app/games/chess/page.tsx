'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 ChevronLeft, Volume2, VolumeX, Loader, Shield, Swords, Trophy, RefreshCcw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useChessEngine } from '@/hooks/use-chess-engine';

// --- 3D Custom Assets ---
const pieceSVG: Record<string, string> = {
  'pw': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wP.svg',
  'rw': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wR.svg',
  'nw': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wN.svg',
  'bw': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wB.svg',
  'qw': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wQ.svg',
  'kw': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wK.svg',
  'pb': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bP.svg',
  'rb': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bR.svg',
  'nb': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bN.svg',
  'bb': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bB.svg',
  'qb': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bQ.svg',
  'kb': 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bK.svg'
};

function ChessGameContent() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const roomId = searchParams.get('roomId') || 'global_room';
   const { user: currentUser } = useUser();
   const { userProfile } = useUserProfile(currentUser?.uid);
   
   const [isLaunching, setIsLaunching] = useState(true);
   const [isMuted, setIsMuted] = useState(false);
   const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
 
   const { gameState, isLoading, startMatch, makeMove } = useChessEngine(roomId, currentUser?.uid || null);

   useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1200);
    return () => clearTimeout(timer);
   }, []);

   // --- Game Logic: Handling Moves ---
   const handleSquareClick = useCallback((coord: string) => {
      const isMyTurn = (gameState?.turn === 'w' && gameState?.white?.uid === currentUser?.uid) || 
                       (gameState?.turn === 'b' && gameState?.black?.uid === currentUser?.uid);
      
      if (!isMyTurn || gameState?.status === 'finished') return;

      if (selectedSquare === null) {
          // First Click: Select the piece
          setSelectedSquare(coord);
      } else if (selectedSquare === coord) {
          // Click same square: Deselect
          setSelectedSquare(null);
      } else {
          // Second Click: Make the move
          makeMove(selectedSquare, coord);
          setSelectedSquare(null);
          // Sound effect logic can be triggered here
          if(!isMuted) { /* new Audio('/move.mp3').play(); */ }
      }
   }, [selectedSquare, gameState, currentUser, makeMove, isMuted]);

   if (isLaunching || isLoading) {
    return (
     <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="h-20 w-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white h-6 w-6" />
      </div>
      <p className="text-blue-400 font-black tracking-[0.3em] text-[10px] animate-pulse">GENERATING 3D ARENA</p>
     </div>
    );
   }

   const isMyTurn = (gameState?.turn === 'w' && gameState?.white?.uid === currentUser?.uid) || 
                    (gameState?.turn === 'b' && gameState?.black?.uid === currentUser?.uid);

   return (
    <AppLayout fullScreen>
     <div className="h-screen w-full bg-[#020617] flex flex-col justify-end relative overflow-hidden text-white">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-blue-900/10 pointer-events-none" />

      {/* HEADER & STATS */}
      <header className="absolute top-0 w-full p-6 z-50 flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <button onClick={() => router.back()} className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg active:scale-90 transition-all"><ChevronLeft className="h-5 w-5"/></button>
            <div className="text-center">
                <h1 className="text-xl font-black italic tracking-tighter text-blue-400">CHESS ROYALE 3D</h1>
                <p className="text-[8px] opacity-40 uppercase tracking-[0.4em]">Grandmaster Table</p>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 p-3 rounded-2xl border border-white/10 active:scale-90 transition-all">
                {isMuted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
            </button>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Opponent Card */}
            <div className={cn("p-3 rounded-2xl border transition-all duration-500", gameState?.turn === 'b' ? "bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-white/5 border-white/10 opacity-60")}>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-white/20"><AvatarImage src={gameState?.black?.avatarUrl} /></Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-bold text-red-400 uppercase tracking-tighter">Opponent</p>
                        <p className="text-[10px] font-black truncate">{gameState?.black?.displayName || 'Searching...'}</p>
                    </div>
                </div>
            </div>

            {/* User Card */}
            <div className={cn("p-3 rounded-2xl border transition-all duration-500", gameState?.turn === 'w' ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-white/5 border-white/10 opacity-60")}>
                <div className="flex items-center gap-2">
                    <div className="flex-1 text-right min-w-0">
                        <p className="text-[7px] font-bold text-blue-400 uppercase tracking-tighter">Master (You)</p>
                        <p className="text-[10px] font-black truncate">{userProfile?.displayName || 'Golu'}</p>
                    </div>
                    <Avatar className="h-8 w-8 border border-white/20"><AvatarImage src={userProfile?.avatarUrl} /></Avatar>
                </div>
            </div>
        </div>
      </header>

      {/* GAME BOARD AREA (Half Screen) */}
      <div className="relative h-[60vh] bg-gradient-to-t from-[#0f172a] to-transparent flex flex-col items-center justify-start rounded-t-[3.5rem] border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.8)] pt-16">
         
         <div className="perspective-[1200px] w-full flex justify-center">
            {/* The 3D Board */}
            <div 
                className="relative w-[88vw] max-w-[380px] aspect-square transition-transform duration-1000"
                style={{ 
                    transform: 'rotateX(50deg) rotateZ(0deg)',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Board Side/Depth Effect */}
                <div className="absolute inset-0 bg-[#1e293b] translate-z-[-20px] rounded-xl border-[8px] border-[#334155] shadow-2xl" />
                
                {/* Main Chess Grid */}
                <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-2 border-slate-700 rounded-sm overflow-hidden shadow-2xl">
                    {Array.from({ length: 64 }).map((_, i) => {
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const isBlack = (row + col) % 2 === 1;
                        const file = String.fromCharCode(97 + col);
                        const rank = 8 - row;
                        const coord = `${file}${rank}`;
                        
                        // Piece logic from gameState
                        const piece = gameState?.board?.[row]?.[col]; // Assume board is 2D array in engine

                        return (
                           <div 
                             key={coord}
                             onClick={() => handleSquareClick(coord)}
                             className={cn(
                                "relative w-full aspect-square flex items-center justify-center transition-all duration-300",
                                isBlack ? "bg-[#1e293b]" : "bg-[#475569]",
                                selectedSquare === coord && "bg-blue-500/80 shadow-[0_0_25px_#3b82f6] z-30 brightness-110 scale-105"
                             )}
                             style={{ transform: 'translateZ(1px)' }}
                           >
                             {piece && (
                               <div className="relative w-full h-full flex items-center justify-center">
                                  <img 
                                    src={pieceSVG[piece]} 
                                    className="w-[85%] h-[85%] z-20 drop-shadow-[0_15px_8px_rgba(0,0,0,0.7)]"
                                    style={{ transform: 'rotateX(-50deg) translateY(-8px)' }}
                                  />
                                  <div className="absolute bottom-1 w-1/2 h-1 bg-black/50 blur-md rounded-full -z-10" />
                               </div>
                             )}
                           </div>
                        )
                    })}
                </div>
            </div>
         </div>

         {/* GAME OVER OVERLAY */}
         {gameState?.status === 'finished' && (
             <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-t-[3.5rem]">
                <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-3xl font-black italic mb-2 tracking-tighter">CHECKMATE!</h2>
                <p className="text-white/60 mb-8 uppercase text-xs tracking-widest">Victory belongs to {gameState.winner === 'w' ? 'White' : 'Black'}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all"
                >
                  <RefreshCcw className="h-4 w-4" /> Rematch
                </button>
             </div>
         )}

         {/* ACTION BUTTON */}
         <div className="mt-20 w-full px-8 flex flex-col items-center gap-4">
            {!gameState && (
                <button 
                  onClick={() => startMatch(userProfile)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Swords className="h-5 w-5" /> Start Battle
                </button>
            )}
            {isMyTurn && gameState?.status !== 'finished' && (
                <div className="flex items-center gap-2 animate-pulse bg-white/5 px-6 py-2 rounded-full border border-white/10">
                    <div className="h-2 w-2 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Your Turn, Master Golu</span>
                </div>
            )}
         </div>
      </div>

      <footer className="h-8 flex items-center justify-center opacity-10">
         <p className="text-[8px] font-bold uppercase tracking-[0.5em]">Tactical Core v3.0</p>
      </footer>
     </div>
    </AppLayout>
   );
}

export default function ChessGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#020617] flex items-center justify-center text-blue-500 font-bold tracking-widest">INITIALIZING...</div>}>
      <ChessGameContent />
    </Suspense>
  );
}
