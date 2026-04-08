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

// 3D Custom Character Icons
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
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
   }, []);

   // UPDATED: WHITE LOADING PAGE DESIGN
   if (isLaunching || isLoading) {
    return (
     <div className="h-screen w-full bg-white flex flex-col items-center justify-center space-y-8 font-sans">
        <div className="relative flex items-center justify-center">
          {/* Circular Loader */}
          <div className="h-20 w-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute">
              <Shield className="h-6 w-6 text-blue-600/30 animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Preparing Arena</h1>
          <p className="text-sm text-slate-400 font-medium animate-pulse">Syncing 3D assets...</p>
        </div>

        {/* Branding */}
        <div className="absolute bottom-12 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Powered By</span>
          <span className="text-sm font-black text-slate-900 tracking-widest italic">UMMY TEAM</span>
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
           isBlack ? "bg-[#1e40af] shadow-inner" : "bg-[#60a5fa] shadow-inner",
           selectedSquare === coord && "ring-4 ring-yellow-400 z-20 brightness-125"
         )}
         style={{ transform: 'translateZ(2px)' }}
       >
         {pieceKey && (
           <img 
             src={pieceSVG[pieceKey]} 
             alt={pieceKey}
             className="w-[85%] h-[85%] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform active:translate-y-[-10px]"
           />
         )}
       </div>
     );
   };

   return (
    <AppLayout fullScreen>
     <div className="h-screen w-full bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex flex-col relative overflow-hidden text-white font-sans">
      
      <header className="z-50 flex items-center justify-between p-6">
        <button onClick={() => router.back()} className="bg-white/10 p-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all"><ChevronLeft /></button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">CHESS ROYALE 3D</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-[0.3em]">Grandmaster Edition</p>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-3 rounded-xl border border-white/20">
            {isMuted ? <VolumeX /> : <Volume2 />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center perspective-[1000px] py-4">
         
         <div 
            className="relative w-[95vw] max-w-[450px] aspect-square rounded-lg border-[12px] border-[#334155] shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden"
            style={{ 
                transform: 'rotateX(25deg) rotateZ(0deg)',
                transformStyle: 'preserve-3d',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,0,0,0.2)'
            }}
         >
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full bg-[#0f172a]">
                {Array.from({ length: 8 }).map((_, r) => 
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
            </div>
         </div>

         <div className="mt-16 w-full max-w-[380px] px-6 space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-blue-500"><AvatarImage src="" /></Avatar>
                    <div>
                        <p className="text-xs font-bold uppercase opacity-60 italic text-blue-400">White</p>
                        <p className="font-black text-lg uppercase">{userProfile?.displayName || 'YOU'}</p>
                    </div>
                </div>
                <div className="h-8 w-[2px] bg-white/10" />
                <div className="flex items-center gap-3 text-right">
                    <div>
                        <p className="text-xs font-bold uppercase opacity-60 italic text-red-400">Black</p>
                        <p className="font-black text-lg">OPPONENT</p>
                    </div>
                    <Avatar className="h-12 w-12 ring-2 ring-red-500"><AvatarImage src="" /></Avatar>
                </div>
            </div>

            <button 
                onClick={() => startMatch(userProfile)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
            >
                Start New Battle
            </button>
         </div>
      </main>

      <footer className="p-6 text-center">
         <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Powered by Unreal-Style CSS 3D Engine</p>
      </footer>
     </div>
    </AppLayout>
   );
}

export default function ChessGamePage() {
  return (
    <Suspense fallback={
        <div className="h-screen w-full bg-white flex items-center justify-center font-black text-slate-200 tracking-widest">
            INITIALIZING...
        </div>
    }>
      <ChessGameContent />
    </Suspense>
  );
}
