'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 ChevronLeft, Volume2, VolumeX, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChessEngine } from '@/hooks/use-chess-engine';

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
 
   const { gameState, isLoading, startMatch } = useChessEngine(roomId, currentUser?.uid || null);

   useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 2000);
    return () => clearTimeout(timer);
   }, []);

   // Updated Loading Screen with White Circle and Ummy Team Branding
   if (isLaunching || isLoading) {
    return (
     <div className="h-[50vh] w-full bg-[#0f172a] flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-b-3xl">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <Shield className="absolute h-6 w-6 text-white animate-pulse" />
      </div>
      <div className="text-center">
        <h1 className="text-sm font-bold text-white tracking-[0.2em] uppercase">Loading Arena</h1>
        <p className="text-[10px] text-white/40 mt-2 tracking-widest uppercase">Powered By Ummy Team</p>
      </div>
     </div>
    );
   }

   const isMyTurn = (gameState?.turn === 'w' && gameState?.white?.uid === currentUser?.uid) || 
                    (gameState?.turn === 'b' && gameState?.black?.uid === currentUser?.uid);

   const renderSquare = (row: number, col: number) => {
     const isBlack = (row + col) % 2 === 1;
     const fileLabel = String.fromCharCode(97 + col);
     const rankLabel = 8 - row;
     const coord = `${fileLabel}${rankLabel}`;

     let pieceKey = "";
     if (row === 1) pieceKey = "pb";
     if (row === 6) pieceKey = "pw";
     if (row === 0) {
        const rank0 = ["rb", "nb", "bb", "qb", "kb", "bb", "nb", "rb"];
        pieceKey = rank0[col];
     }
     if (row === 7) {
        const rank7 = ["rw", "nw", "bw", "qw", "kw", "bw", "nw", "rw"];
        pieceKey = rank7[col];
     }

     return (
       <div 
         key={coord}
         onClick={() => isMyTurn && setSelectedSquare(coord)}
         className={cn(
           "relative w-full aspect-square flex items-center justify-center transition-all duration-300",
           isBlack ? "bg-[#1e40af]" : "bg-[#60a5fa]",
           selectedSquare === coord && "ring-2 ring-yellow-400 z-20 scale-105"
         )}
       >
         {pieceKey && (
           <img 
             src={pieceSVG[pieceKey]} 
             alt={pieceKey}
             className="w-[85%] h-[85%] drop-shadow-lg transform active:scale-90 transition-transform"
           />
         )}
       </div>
     );
   };

   return (
    <AppLayout fullScreen>
     <div className="h-screen w-full bg-[#020617] flex flex-col relative overflow-hidden text-white font-sans">
      
      {/* Header Area */}
      <header className="z-50 flex items-center justify-between p-4 bg-[#0f172a]">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-white/5 border border-white/10"><ChevronLeft size={20}/></button>
        <div className="text-center">
            <h1 className="text-lg font-black italic tracking-tighter text-blue-400">CHESS ROYALE 3D</h1>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-lg bg-white/5 border border-white/10">
            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
        </button>
      </header>

      {/* HALF SCREEN GAME AREA (50vh) */}
      <main className="h-[50vh] w-full flex items-center justify-center perspective-[1000px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] border-b border-white/10">
         <div 
            className="relative w-[85vw] max-w-[320px] aspect-square rounded-lg border-[8px] border-[#334155] shadow-2xl overflow-hidden"
            style={{ 
                transform: 'rotateX(20deg)',
                transformStyle: 'preserve-3d',
            }}
         >
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                {Array.from({ length: 8 }).map((_, r) => 
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
            </div>
         </div>
      </main>

      {/* CONTROLS AREA (BOTTOM HALF) */}
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-6 space-y-6">
            <div className="w-full flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-500"><AvatarImage src="" /></Avatar>
                    <p className="font-bold text-sm text-blue-400 uppercase">You</p>
                </div>
                <div className="text-white/20 font-black text-xs">VS</div>
                <div className="flex items-center gap-3">
                    <p className="font-bold text-sm text-red-400 uppercase">Opponent</p>
                    <Avatar className="h-10 w-10 ring-2 ring-red-500"><AvatarImage src="" /></Avatar>
                </div>
            </div>

            <button 
                onClick={() => startMatch(userProfile)}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
                Start New Battle
            </button>

            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] pt-4">
               Powered By Ummy Team
            </p>
      </div>

     </div>
    </AppLayout>
   );
}

export default function ChessGamePage() {
  return (
    <Suspense fallback={
        <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center text-white">
            <div className="h-12 w-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <span className="text-[10px] tracking-widest opacity-50">SYNCING ARENA...</span>
        </div>
    }>
      <ChessGameContent />
    </Suspense>
  );
}
