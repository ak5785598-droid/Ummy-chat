'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 ChevronLeft, 
 Volume2, 
 VolumeX, 
 HelpCircle, 
 Trophy, 
 X,
 ChevronDown,
 Users,
 Move,
 Loader,
 Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChessEngine } from '@/hooks/use-chess-engine';

/**
 * Grand Chess Board - Multiplayer Integration.
 * Zero-Asset Unicode rendering for maximum speed and compatibility.
 */
const pieceMap: Record<string, string> = {
  'pw': '♙', 'rw': '♖', 'nw': '♘', 'bw': '♗', 'qw': '♕', 'kw': '♔',
  'pb': '♟', 'rb': '♜', 'nb': '♞', 'bb': '♝', 'qb': '♛', 'kb': '♚'
};

export default function ChessGamePage() {
 const router = useRouter();
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);

 const [isLaunching, setIsLaunching] = useState(true);
 const [isMuted, setIsMuted] = useState(false);
 const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

 // CHESS ENGINE SYNC
 const { gameState, isLoading, startMatch, makeMove } = useChessEngine('global_room', currentUser?.uid || null);

 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1500);
  return () => clearTimeout(timer);
 }, []);

 if (isLaunching || isLoading) {
  return (
   <div className="h-screen w-full bg-[#1a1a1a] flex flex-col items-center justify-center space-y-6 font-sans relative overflow-hidden">
    <Loader className="h-20 w-20 text-white animate-spin" />
    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Initializing Grandmaster</h1>
   </div>
  );
 }

 const isMyTurn = (gameState?.turn === 'w' && gameState?.white?.uid === currentUser?.uid) || 
                  (gameState?.turn === 'b' && gameState?.black?.uid === currentUser?.uid);

 // UI board rendering helper
 const renderSquare = (row: number, col: number) => {
   const isBlack = (row + col) % 2 === 1;
   const fileLabel = String.fromCharCode(97 + col);
   const rankLabel = 8 - row;
   const coord = `${fileLabel}${rankLabel}`;

   return (
     <div 
       key={coord}
       onClick={() => isMyTurn && setSelectedSquare(coord)}
       className={cn(
         "w-full aspect-square flex items-center justify-center text-4xl cursor-pointer transition-all duration-200",
         isBlack ? "bg-[#333333]" : "bg-[#666666]",
         selectedSquare === coord && "bg-yellow-400/50 scale-105 z-10 shadow-2xl ring-2 ring-yellow-400"
       )}
     >
       {/* Pieces would go here based on FEN parsing - for now placeholder symbols */}
       <span className={cn(
         "drop-shadow-lg",
         isBlack ? "text-white" : "text-black"
       )}>
         {row === 1 ? '♟' : row === 6 ? '♙' : ''}
       </span>
     </div>
   );
 };

 return (
  <AppLayout fullScreen>
   <div className="h-screen w-full bg-[#121212] flex flex-col relative overflow-hidden font-sans text-white">
    <CompactRoomView />

    <header className="relative z-50 flex items-center justify-between p-4 pt-32 shrink-0">
      <div className="flex gap-1.5">
       <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 shadow-lg active:scale-90 transition-all"><ChevronLeft className="h-4 w-4" /></button>
       <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg">
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
       </button>
      </div>
      
      <h1 className="text-xl font-black text-white uppercase tracking-tighter drop-shadow-md italic">Grand Chess</h1>

      <div className="flex gap-1.5">
       <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg"><X className="h-4 w-4" /></button>
      </div>
    </header>

    <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
       {/* 8x8 Board Grid */}
       <div className="relative w-full max-w-[400px] aspect-square bg-[#2a2a2a] rounded-xl border-[8px] border-[#0a0a0a] shadow-[0_40px_80px_rgba(0,0,0,0.8)] grid grid-cols-8 grid-rows-8 overflow-hidden">
          {Array.from({ length: 8 }).map((_, r) => 
            Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
          )}
       </div>

       {/* PLAYER HUD */}
       <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-[320px]">
          {!gameState && (
            <button 
              onClick={() => startMatch(userProfile)}
              className="bg-white text-black px-12 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm"
            >
              Start Battle
            </button>
          )}

          {gameState?.status === 'lobby' && !gameState.black && gameState.white?.uid !== currentUser?.uid && (
            <button onClick={() => startMatch(userProfile)} className="bg-white text-black px-12 py-4 rounded-full font-black uppercase tracking-widest">Join Match</button>
          )}

          {gameState && (
            <div className="flex items-center justify-between w-full bg-white/5 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl">
               <div className={cn("text-center transition-all", gameState.turn === 'w' ? "scale-110" : "opacity-40")}>
                  <div className={cn("p-1 rounded-full border-2", gameState.turn === 'w' ? "border-white shadow-[0_0_15px_#ffffff]" : "border-transparent")}>
                    <Avatar className="h-10 w-10 border border-white/10"><AvatarImage src={gameState.white?.avatarUrl || ''} /></Avatar>
                  </div>
                  <span className="text-[10px] font-black uppercase mt-1 block">White</span>
               </div>

               <div className="text-center font-black italic uppercase tracking-[0.2em] text-white/20">VS</div>

               <div className={cn("text-center transition-all", gameState.turn === 'b' ? "scale-110" : "opacity-40")}>
                  <div className={cn("p-1 rounded-full border-2", gameState.turn === 'b' ? "border-white shadow-[0_0_15px_#ffffff]" : "border-transparent")}>
                    <Avatar className="h-10 w-10 border border-white/10"><AvatarImage src={gameState.black?.avatarUrl || ''} /></Avatar>
                  </div>
                  <span className="text-[10px] font-black uppercase mt-1 block">Black</span>
               </div>
            </div>
          )}

          {isMyTurn && (
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">It's Your Turn, Master</p>
          )}
       </div>
    </main>

    <footer className="p-10 shrink-0 flex flex-col items-center">
       <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Tactical Strategy System v2.0</p>
    </footer>
   </div>
  </AppLayout>
 );
}
