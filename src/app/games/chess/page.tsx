'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 Move, Volume2, VolumeX, HelpCircle, X
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

   // --- Floating Drag Logic ---
   const [pos, setPos] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const startPos = useRef({ x: 0, y: 0 });

   const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
       setIsDragging(true);
       startPos.current = {
           x: e.clientX - pos.x,
           y: e.clientY - pos.y
       };
       e.currentTarget.setPointerCapture(e.pointerId);
   };

   const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
       if (!isDragging) return;
       setPos({
           x: e.clientX - startPos.current.x,
           y: e.clientY - startPos.current.y
       });
   };

   const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
       setIsDragging(false);
       e.currentTarget.releasePointerCapture(e.pointerId);
   };
   // ---------------------------

   useEffect(() => {
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';

    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
   }, []);

   // LOADING SCREEN
   if (isLaunching || isLoading) {
    if (isOverlay) {
      return (
        <div className="h-full w-full bg-[#0a0a0a] flex flex-col items-center justify-center space-y-6">
            <div className="h-14 w-14 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            <h1 className="text-xl font-bold text-white tracking-tight">Preparing Arena</h1>
        </div>
      );
    }
    return (
     <div className="h-screen w-full bg-transparent flex flex-col justify-end overflow-hidden font-sans pointer-events-none">
        <div className="flex-1 w-full bg-transparent"></div>
        <div className="h-[50vh] w-full bg-[#0a0a0a] rounded-t-[40px] flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-bottom duration-700 pointer-events-auto shadow-2xl border-t border-white/10">
            <div className="h-14 w-14 border-4 border-white/10 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Preparing Arena</h1>
                <p className="text-sm text-slate-400 font-medium animate-pulse">Syncing 3D assets...</p>
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
           isBlack ? "bg-[#2563eb] shadow-inner" : "bg-[#93c5fd] shadow-inner",
           selectedSquare === coord && "ring-2 ring-yellow-400 z-20 brightness-125"
         )}
       >
         {pieceKey && (
           <img 
             src={pieceSVG[pieceKey]} 
             alt={pieceKey}
             // Pieces ko counter-rotate kiya hai taaki wo board par sidhe khade dikhe (True 3D effect)
             className="w-[90%] h-[90%] drop-shadow-2xl transition-transform hover:scale-110"
             style={{ transform: 'rotateX(-35deg) translateY(-10%) scale(1.1)' }}
           />
         )}
       </div>
     );
   };

   const Content = (
    <div className="h-screen w-full flex items-center justify-center bg-transparent pointer-events-none p-4">
      
      {/* Floating Draggable Sheet */}
      <main 
        className={cn(
          "relative w-full max-w-[400px] bg-[#0a0a0a]/95 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col items-center duration-0 pointer-events-auto pb-6",
        )}
        style={{
           transform: `translate(${pos.x}px, ${pos.y}px)`,
           // Smooth drag transition only when not dragging
           transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
         
         {/* Top Header As Per Image */}
         <div className="flex items-center justify-between w-full px-5 pt-4 pb-3 bg-[#111] rounded-t-[32px] border-b border-white/5">
            <div className="flex gap-3">
               {/* Drag Handle Icon */}
               <button
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full cursor-grab active:cursor-grabbing text-white/70 touch-none"
               >
                   <Move size={18} />
               </button>
               {/* Mute/Unmute Icon */}
               <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70">
                   {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
               </button>
            </div>

            {/* Center Sheet Dash */}
            <div className="w-8 h-1.5 bg-white/20 rounded-full"></div>

            <div className="flex gap-3">
               {/* Help Icon */}
               <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70">
                   <HelpCircle size={18} />
               </button>
               {/* Close Icon */}
               <button onClick={() => router.back()} className="p-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full text-white/70 transition-colors">
                   <X size={18} />
               </button>
            </div>
         </div>
         
         {/* 3D Board Area */}
         <div className="w-full flex justify-center py-6 perspective-1000">
            <div 
               className="relative w-[85%] max-w-[320px] aspect-square bg-[#0a0a0a] rounded-sm shrink-0"
               style={{ 
                   transform: 'rotateX(35deg) scale(0.95)',
                   transformStyle: 'preserve-3d',
                   // Added thick bottom shadow to make board look like a physical block
                   boxShadow: '0 15px 0 #1e3a8a, 0 30px 25px rgba(0,0,0,0.9)',
               }}
            >
               <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-4 border-[#1e3a8a] rounded-sm overflow-hidden">
                   {Array.from({ length: 8 }).map((_, r) => 
                     Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                   )}
               </div>
            </div>
         </div>

         {/* Players and Controls Section */}
         <div className="w-full px-6 space-y-4 shrink-0 mt-4 text-white">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-3xl border border-white/5 shadow-inner">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-blue-500 bg-[#1a1a1a]"><AvatarImage src="" /></Avatar>
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
                    <Avatar className="h-9 w-9 ring-2 ring-red-500 bg-[#1a1a1a]"><AvatarImage src="" /></Avatar>
                </div>
            </div>

            <button 
                onClick={() => startMatch(userProfile)}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all text-sm"
            >
                Start New Battle
            </button>
            
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
