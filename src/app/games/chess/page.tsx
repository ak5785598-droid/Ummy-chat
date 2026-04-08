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

   // WHITE LOADING SCREEN (Half-Height Bottom Sheet)
   if (isLaunching || isLoading) {
    return (
     <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/20">
        <div className="h-[70vh] w-full bg-white rounded-t-[40px] flex flex-col items-center justify-center p-10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-500">
            <div className="relative mb-6">
                <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-indigo-600" />
                </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Syncing Arena...</h2>
            <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-[0.3em]">Powered-By Ummy Team</p>
        </div>
     </div>
    );
   }

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
         onClick={() => setSelectedSquare(coord)}
         className={cn(
           "relative w-full aspect-square flex items-center justify-center",
           isBlack ? "bg-[#1e40af]" : "bg-[#60a5fa]",
           selectedSquare === coord && "ring-2 ring-yellow-400 z-10 scale-105"
         )}
       >
         {pieceKey && <img src={pieceSVG[pieceKey]} alt="" className="w-[85%] h-[85%]" />}
       </div>
     );
   };

   return (
    <AppLayout fullScreen>
     {/* The background is transparent so the 'Room' (Castle/Moon) shows through */}
     <div className="h-screen w-full bg-transparent flex flex-col relative overflow-hidden">
      
      {/* TOP HALF: Transparent to show Room Background */}
      <div className="flex-1 w-full bg-transparent flex items-start p-4">
          <button onClick={() => router.back()} className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white shadow-lg">
            <ChevronLeft />
          </button>
      </div>

      {/* BOTTOM HALF: The Chess Game Sheet */}
      <main className="h-[75vh] w-full bg-[#5b36af] rounded-t-[40px] flex flex-col items-center p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-700">
         
         {/* Top Handle */}
         <div className="w-10 h-1 bg-white/20 rounded-full mb-6" />

         <header className="w-full flex justify-between items-center mb-6 px-2">
            <div className="text-white">
                <h1 className="text-xl font-black italic tracking-tighter">CHESS ROYALE 3D</h1>
                <p className="text-[9px] opacity-60 uppercase tracking-widest">Grandmaster Edition</p>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="text-white p-2 bg-white/10 rounded-xl">
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
            </button>
         </header>
         
         {/* 3D BOARD */}
         <div className="relative w-full max-w-[340px] aspect-square rounded-xl border-[8px] border-slate-900 shadow-2xl overflow-hidden mb-8">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full bg-slate-900">
                {Array.from({ length: 8 }).map((_, r) => 
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
            </div>
         </div>

         {/* PLAYERS & BUTTON */}
         <div className="w-full max-w-[340px] space-y-4">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/10 text-white">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 ring-2 ring-blue-400"><AvatarImage src="" /></Avatar>
                    <span className="font-bold text-xs uppercase">You</span>
                </div>
                <div className="text-[10px] opacity-30 font-black">VS</div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase">Opponent</span>
                    <Avatar className="h-8 w-8 ring-2 ring-red-400"><AvatarImage src="" /></Avatar>
                </div>
            </div>

            <button 
                onClick={() => startMatch(userProfile)}
                className="w-full bg-white text-[#5b36af] py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
                Start New Battle
            </button>
         </div>

         <footer className="mt-auto pb-2">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.5em]">Powered-By Ummy Team</p>
         </footer>
      </main>
     </div>
    </AppLayout>
   );
}

export default function ChessGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-white flex items-center justify-center text-indigo-600 font-bold">LOADING...</div>}>
      <ChessGameContent />
    </Suspense>
  );
}
