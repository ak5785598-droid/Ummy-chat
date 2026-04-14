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

export function ChessGameContent({ roomId: propsRoomId, isOverlay = false }: { roomId?: string, isOverlay?: boolean }) {
   const router = useRouter();
   const searchParams = useSearchParams();
   const roomId = propsRoomId || searchParams.get('roomId') || 'global_room';
   const { user: currentUser } = useUser();
   const { userProfile } = useUserProfile(currentUser?.uid);
   const [isLaunching, setIsLaunching] = useState(true);
   const [isMuted, setIsMuted] = useState(false);
   const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
 
   const { gameState, isLoading, startMatch } = useChessEngine(roomId, currentUser?.uid || null);

   useEffect(() => {
    // Yeh code aapki poori body aur HTML ko transparent kar dega taaki piche ka view dikhe
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';

    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => {
        clearTimeout(timer);
        // Clean up: Agar aap chahte ho ki is page se jaane ke baad body wapis default ho jaye toh yahan set kar sakte ho
        // document.body.style.backgroundColor = ''; 
    };
   }, []);

   // BOTTOM SHEET LOADING PAGE
   if (isLaunching || isLoading) {
    if (isOverlay) {
      return (
        <div className="h-full w-full bg-[#1e293b] flex flex-col items-center justify-center space-y-6">
            <div className="h-14 w-14 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            <h1 className="text-xl font-bold text-white tracking-tight">Preparing Arena</h1>
        </div>
      );
    }
    return (
     <div className="h-screen w-full bg-transparent flex flex-col justify-end overflow-hidden font-sans pointer-events-none">
        {/* Top Half Blurred/Transparent Background */}
        <div className="flex-1 w-full bg-transparent flex items-center justify-center">
            {/* Top area bilkul khali aur transparent rakha hai */}
        </div>

        {/* Bottom Sheet - Exactly 50vh */}
        <div className="h-[50vh] w-full bg-white rounded-t-[40px] flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-bottom duration-700 pointer-events-auto shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-2" />
            <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Preparing Arena</h1>
                <p className="text-sm text-slate-400 font-medium animate-pulse">Syncing 3D assets...</p>
            </div>
            <div className="flex flex-col items-center gap-1 pt-4">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Powered By</span>
                <span className="text-sm font-black text-slate-900 tracking-widest italic">UMMY TEAM</span>
            </div>
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
       >
         {pieceKey && (
           <img 
             src={pieceSVG[pieceKey]} 
             alt={pieceKey}
             className="w-[85%] h-[85%] drop-shadow-lg transform hover:scale-110"
           />
         )}
       </div>
     );
   };

   const Content = (
    <div className={cn(
      "h-full w-full flex flex-col relative overflow-hidden text-white font-sans",
      isOverlay ? "bg-[#1e293b] pointer-events-auto" : "bg-transparent justify-end pointer-events-none pb-12"
    )}>
    
    {/* Header - Now floats over the transparent top half */}
    {!isOverlay && (
      <header className="absolute top-0 w-full z-50 flex items-center justify-between p-6 pointer-events-auto">
        <button onClick={() => router.back()} className="bg-black/20 p-3 rounded-xl border border-white/20 backdrop-blur-md shadow-sm"><ChevronLeft /></button>
        <div className="text-center">
            <h1 className="text-xl font-black italic tracking-tighter text-blue-400 drop-shadow-md">CHESS ROYALE 3D</h1>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-black/20 p-3 rounded-xl border border-white/20 backdrop-blur-md shadow-sm">
            {isMuted ? <VolumeX /> : <Volume2 />}
        </button>
      </header>
    )}

    {/* Transparent area for the background to show through */}
    {!isOverlay && <div className="flex-1 w-full bg-transparent" />}

    {/* Main Bottom Sheet Game Area */}
    <main className={cn(
      "w-full bg-[#1e293b]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center p-4 duration-500 overflow-y-auto pointer-events-auto pb-6 scrollbar-hide",
      isOverlay ? "h-full" : "h-[50vh] rounded-t-[48px] animate-in slide-in-from-bottom"
    )}>
         
         <div className="w-12 h-1.5 bg-white/10 rounded-full mb-4 shrink-0" />
         
         {/* 3D Board Adjusted for 50vh Sheet View */}
         <div 
            className="relative w-[min(85vw,35vh)] max-w-[300px] aspect-square rounded-lg border-[6px] border-[#334155] shadow-2xl overflow-hidden shrink-0 mb-4"
            style={{ 
                transform: 'rotateX(15deg)',
                transformStyle: 'preserve-3d',
            }}
         >
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full bg-[#0f172a]">
                {Array.from({ length: 8 }).map((_, r) => 
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
            </div>
         </div>

         <div className="w-full max-w-[380px] px-2 space-y-4 shrink-0">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-3xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-blue-500"><AvatarImage src="" /></Avatar>
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-60 text-blue-400">Khai</p>
                        <p className="font-black text-xs uppercase">{userProfile?.username || 'YOU'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-60 text-red-400">Opponent</p>
                        <p className="font-black text-xs">SEARCHING...</p>
                    </div>
                    <Avatar className="h-8 w-8 ring-2 ring-red-500"><AvatarImage src="" /></Avatar>
                </div>
            </div>

            <button 
                onClick={() => startMatch(userProfile)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm"
            >
                Start New Battle
            </button>
            
            <p className="text-[10px] text-center font-bold text-white/20 uppercase tracking-[0.4em] pb-2">Powered by UMMY TEAM</p>
         </div>
      </main>
    </div>
   );

   if (isOverlay) return Content;

   return (
    <AppLayout fullScreen>
      {Content}
    </AppLayout>
   );
}

export default function ChessGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-transparent" />}>
      <ChessGameContent />
    </Suspense>
  );
}
