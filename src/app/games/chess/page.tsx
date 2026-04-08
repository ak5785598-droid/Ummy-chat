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

   // White Loading Page (Bottom Sheet)
   if (isLaunching || isLoading) {
    return (
     <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="h-[75vh] w-full bg-white rounded-t-[40px] flex flex-col items-center justify-center p-10 shadow-[0_-20px_80px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom duration-500">
            <div className="relative mb-6 flex flex-col items-center">
                <div className="h-20 w-20 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin" />
                <Shield className="absolute top-7 h-6 w-6 text-purple-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight italic">PREPARING MATCH</h2>
            <p className="text-slate-400 text-[10px] mt-4 font-black uppercase tracking-[0.4em]">Powered-By Ummy Team</p>
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
       <div key={coord} onClick={() => setSelectedSquare(coord)} className={cn(
           "relative w-full aspect-square flex items-center justify-center transition-all",
           isBlack ? "bg-[#1e40af]" : "bg-[#60a5fa]",
           selectedSquare === coord && "ring-4 ring-yellow-400 z-10 scale-105 shadow-2xl"
       )}>
         {pieceKey && <img src={pieceSVG[pieceKey]} alt="" className="w-[85%] h-[85%] drop-shadow-xl" />}
       </div>
     );
   };

   return (
    <AppLayout fullScreen>
     <div className="h-screen w-full relative overflow-hidden bg-transparent">
      
      {/* Top Navigation Overlay */}
      <div className="absolute top-6 left-6 z-20">
          <button onClick={() => router.back()} className="bg-black/40 backdrop-blur-xl p-4 rounded-full text-white border border-white/10 active:scale-90 transition-all">
            <ChevronLeft size={28} />
          </button>
      </div>

      {/* CHESS GAME SHEET (Fixed at Bottom) */}
      <div className="absolute bottom-0 w-full h-[78vh] bg-[#5b36af] rounded-t-[45px] flex flex-col items-center p-6 shadow-[0_-30px_100px_rgba(0,0,0,0.8)] border-t border-white/20 animate-in slide-in-from-bottom duration-700">
         
         {/* Drag Handle */}
         <div className="w-12 h-1.5 bg-white/30 rounded-full mb-8" />

         <header className="w-full flex justify-between items-center mb-6 px-4 text-white">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black italic tracking-tighter leading-none">CHESS ROYALE 3D</h1>
                <span className="text-[10px] opacity-60 uppercase tracking-[0.3em] mt-1 font-bold">Grandmaster Edition</span>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/10 rounded-2xl border border-white/10">
                {isMuted ? <VolumeX size={24}/> : <Volume2 size={24}/>}
            </button>
         </header>
         
         {/* BOARD CONTAINER */}
         <div className="relative w-full max-w-[350px] aspect-square rounded-2xl border-[10px] border-slate-900 shadow-2xl overflow-hidden mb-8">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full bg-slate-900">
                {Array.from({ length: 8 }).map((_, r) => 
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
            </div>
         </div>

         {/* PLAYERS & START BUTTON */}
         <div className="w-full max-w-[350px] space-y-5">
            <div className="flex justify-between items-center bg-black/30 backdrop-blur-lg p-5 rounded-3xl border border-white/10 text-white">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-2 border-blue-400 bg-blue-500/20" />
                    <span className="font-black text-sm uppercase italic">You</span>
                </div>
                <div className="text-[10px] opacity-40 font-black">VS</div>
                <div className="flex items-center gap-3">
                    <span className="font-black text-sm uppercase italic">Opponent</span>
                    <div className="h-10 w-10 rounded-full border-2 border-red-400 bg-red-500/20" />
                </div>
            </div>

            <button onClick={() => startMatch(userProfile)} className="w-full bg-white text-[#5b36af] py-5 rounded-[22px] font-black text-lg uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-inner transition-all">
                START NEW BATTLE
            </button>
         </div>

         <footer className="mt-auto pb-4">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Powered-By Ummy Team</p>
         </footer>
      </div>
     </div>
    </AppLayout>
   );
}

export default function ChessGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-white" />}>
      <ChessGameContent />
    </Suspense>
  );
}
