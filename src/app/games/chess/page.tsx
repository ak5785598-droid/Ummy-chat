'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 ChevronLeft, Volume2, VolumeX, Shield, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
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

   // White Half-Screen Loading Page
   if (isLaunching || isLoading) {
    return (
     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex flex-col justify-end">
        <div className="h-[75vh] w-full bg-white rounded-t-[40px] flex flex-col items-center justify-center p-10 animate-in slide-in-from-bottom duration-500">
            <div className="relative mb-8">
                <Loader2 className="h-20 w-20 text-indigo-600 animate-spin stroke-[1.5px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-indigo-600" />
                </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Syncing Arena...</h2>
            <p className="text-slate-400 text-xs mt-2 font-medium uppercase tracking-[0.2em]">Powered-By Ummy Team</p>
        </div>
     </div>
    );
   }

   const isMyTurn = (gameState?.turn === 'w' && gameState?.white?.uid === currentUser?.uid) || 
                    (gameState?.turn === 'b' && gameState?.black?.uid === currentUser?.uid);

   const renderSquare = (row: number, col: number) => {
     const isBlack = (row + col) % 2 === 1;
     const coord = `${String.fromCharCode(97 + col)}${8 - row}`;

     let pieceKey = "";
     if (row === 1) pieceKey = "pb";
     if (row === 6) pieceKey = "pw";
     if (row === 0) pieceKey = ["rb", "nb", "bb", "qb", "kb", "bb", "nb", "rb"][col];
     if (row === 7) pieceKey = ["rw", "nw", "bw", "qw", "kw", "bw", "nw", "rw"][col];

     return (
       <div 
         key={coord}
         onClick={() => isMyTurn && setSelectedSquare(coord)}
         className={cn(
           "relative w-full aspect-square flex items-center justify-center",
           isBlack ? "bg-[#1e40af]" : "bg-[#60a5fa]",
           selectedSquare === coord && "ring-2 ring-yellow-400 z-10 scale-105 shadow-xl"
         )}
       >
         {pieceKey && (
           <img src={pieceSVG[pieceKey]} alt="" className="w-[85%] h-[85%] drop-shadow-md" />
         )}
       </div>
     );
   };

   return (
    <AppLayout fullScreen>
     <div className="h-screen w-full bg-[#020617] flex flex-col relative overflow-hidden">
      
      {/* Background/Top Area (Transparent/Dimmed) */}
      <div className="flex-1 w-full bg-gradient-to-b from-indigo-950/50 to-transparent p-6">
          <button onClick={() => router.back()} className="bg-white/10 p-3 rounded-full text-white"><ChevronLeft /></button>
      </div>

      {/* HALF SCREEN GAME CONTAINER (Purple/Dark Theme as per image) */}
      <main className="h-[80vh] w-full bg-[#5b36af] rounded-t-[40px] flex flex-col items-center p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-700">
         
         {/* Drag Handle Decoration */}
         <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6" />

         <header className="w-full flex justify-between items-center mb-6 text-white px-2">
            <div className="flex flex-col">
                <h1 className="text-xl font-black italic leading-none">CHESS ROYALE 3D</h1>
                <span className="text-[10px] opacity-60 uppercase tracking-widest">Grandmaster Edition</span>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 opacity-80">
                {isMuted ? <VolumeX /> : <Volume2 />}
            </button>
         </header>
         
         {/* 3D BOARD */}
         <div 
            className="relative w-full max-w-[340px] aspect-square rounded-xl border-[8px] border-slate-800 shadow-2xl overflow-hidden mb-8"
            style={{ transform: 'rotateX(15deg)', transformStyle: 'preserve-3d' }}
         >
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full bg-slate-900">
                {Array.from({ length: 8 }).map((_, r) => 
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
            </div>
         </div>

         {/* STATS & START */}
         <div className="w-full max-w-[340px] space-y-4">
            <div className="flex justify-between items-center bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-400"><AvatarImage src="" /></Avatar>
                    <p className="text-white font-bold text-sm">YOU</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                    <p className="text-white font-bold text-sm">OPPONENT</p>
                    <Avatar className="h-10 w-10 ring-2 ring-red-400"><AvatarImage src="" /></Avatar>
                </div>
            </div>

            <button 
                onClick={() => startMatch(userProfile)}
                className="w-full bg-white text-[#5b36af] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
                Start New Battle
            </button>
         </div>

         <footer className="mt-auto pb-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Powered-By Ummy Team</p>
         </footer>
      </main>
     </div>
    </AppLayout>
   );
}

export default function ChessGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-white flex items-center justify-center text-slate-900 font-bold">LOADING...</div>}>
      <ChessGameContent />
    </Suspense>
  );
}
