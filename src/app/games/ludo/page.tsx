'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  Star, 
  ArrowRight, 
  ArrowDown, 
  ArrowLeft, 
  ArrowUp, 
  User,
  X,
  Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useLudoEngine } from '@/hooks/use-ludo-engine';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/app-layout';

// --- UI COMPONENTS ---

const GamePiece = ({ color }: { color: string }) => (
  <div className="relative flex flex-col items-center justify-center drop-shadow-md transition-transform hover:scale-110 cursor-pointer z-10 scale-90">
    <div className="w-[18px] h-[18px] md:w-[24px] md:h-[24px] bg-white rounded-full flex items-center justify-center shadow-sm relative z-10 border border-gray-100">
      <div className={cn(
        "w-3 h-3 md:w-4 md:h-4 rounded-full shadow-inner",
        color === 'red' && "bg-[#FF4B4B]",
        color === 'green' && "bg-[#00E676]",
        color === 'blue' && "bg-[#2979FF]",
        color === 'yellow' && "bg-[#FFD500]"
      )} />
    </div>
    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] md:border-l-[9px] md:border-r-[9px] md:border-t-[11px] border-l-transparent border-r-transparent border-t-white absolute -bottom-[6px] md:-bottom-[9px]" />
  </div>
);

const HomeSocket = ({ color, children }: { color: string, children?: React.ReactNode }) => (
  <div className={cn(
    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
    color === 'red' ? "bg-[#FF4B4B] border-[2px] border-[#b71c1c]" :
    color === 'green' ? "bg-[#00E676] border-[2px] border-[#1b5e20]" :
    color === 'blue' ? "bg-[#2979FF] border-[2px] border-[#0d47a1]" :
    "bg-[#FFD500] border-[2px] border-[#f57f17]"
  )}>
    {children}
  </div>
);

const PlayerCard = ({ color, isActive, diceValue, isRolling, onRoll, profileImg }: any) => {
  const colorMap: any = {
    red: "border-[#FF4B4B] bg-[#FF4B4B]/10 text-[#FF4B4B]",
    green: "border-[#00E676] bg-[#00E676]/10 text-[#00E676]",
    blue: "border-[#2979FF] bg-[#2979FF]/10 text-[#2979FF]",
    yellow: "border-[#FFD500] bg-[#FFD500]/10 text-[#FFD500]",
  };

  const btnColorMap: any = {
    red: "bg-[#FF4B4B]",
    green: "bg-[#00E676]",
    blue: "bg-[#2979FF]",
    yellow: "bg-[#FFD500]",
  };

  return (
    <div className={cn(
      "flex items-center gap-2 p-1.5 rounded-xl border-2 transition-all duration-300",
      colorMap[color],
      isActive ? "scale-105 shadow-lg ring-1 ring-white/30" : "opacity-60 grayscale-[0.3]"
    )}>
      <Avatar className={cn("h-10 w-10 rounded-lg border-2", colorMap[color])}>
        <AvatarImage src={profileImg} />
        <AvatarFallback className="bg-white/5"><User size={18} /></AvatarFallback>
      </Avatar>

      <button 
        onClick={onRoll}
        disabled={!isActive || isRolling}
        className={cn(
          "w-10 h-10 rounded-lg shadow-inner flex items-center justify-center transition-transform active:scale-90",
          btnColorMap[color],
          isActive && !isRolling ? "animate-pulse cursor-pointer" : "cursor-default"
        )}
      >
        <span className={cn("text-lg font-black", (color === 'yellow' || color === 'green') ? "text-black" : "text-white")}>
          {isActive ? (isRolling ? "?" : diceValue || "?") : ""}
        </span>
      </button>
    </div>
  );
};

// --- MAIN GAME CONTENT ---

export function LudoGameContent({ roomId: propsRoomId, isOverlay = false }: { roomId?: string, isOverlay?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = propsRoomId || searchParams.get('roomId') || 'global_room';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const { gameState, rollDice, joinLobby, isLoading } = useLudoEngine(roomId, currentUser?.uid || null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLaunching || isLoading) {
    return (
      <div className="h-screen w-full bg-[#0a1a4a] flex flex-col items-center justify-center space-y-4">
        <Loader className="h-12 w-12 text-yellow-500 animate-spin" />
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">Loading Arena...</h1>
      </div>
    );
  }

  const isMyTurn = gameState?.turn === currentUser?.uid;

  const renderPath = (type: string, i: number) => {
    let bg = "bg-white"; 
    let content = null;

    if (type === 'left') {
      if (i === 1) { bg = "bg-[#FF4B4B]"; content = <ArrowRight className="h-3 w-3 text-white" />; } 
      if ([7, 8, 9, 10, 11].includes(i)) bg = "bg-[#FF4B4B]"; 
      if (i === 14) content = <Star className="h-3 w-3 text-gray-300" />; 
    } else if (type === 'top') {
      if (i === 5) { bg = "bg-[#00E676]"; content = <ArrowDown className="h-3 w-3 text-white" />; } 
      if ([4, 7, 10, 13, 16].includes(i)) bg = "bg-[#00E676]"; 
      if (i === 6) content = <Star className="h-3 w-3 text-gray-300" />; 
    } else if (type === 'right') {
      if (i === 16) { bg = "bg-[#FFD500]"; content = <ArrowLeft className="h-3 w-3 text-white" />; } 
      if ([6, 7, 8, 9, 10].includes(i)) bg = "bg-[#FFD500]"; 
      if (i === 3) content = <Star className="h-3 w-3 text-gray-300" />; 
    } else if (type === 'bottom') {
      if (i === 12) { bg = "bg-[#2979FF]"; content = <ArrowUp className="h-3 w-3 text-white" />; } 
      if ([1, 4, 7, 10, 13].includes(i)) bg = "bg-[#2979FF]"; 
      if (i === 11) content = <Star className="h-3 w-3 text-gray-300" />; 
    }

    return (
      <div key={`${type}-${i}`} className={cn("border-[0.5px] border-gray-300 flex items-center justify-center relative", bg)}>
        {content}
      </div>
    );
  };

  const getPlayerByColor = (color: string) => gameState?.players.find((p: any) => p.color === color);

  return (
    <div className="h-full w-full bg-[#0a1a4a] flex flex-col relative overflow-hidden">
      {/* Header */}
      {!isOverlay && (
        <header className="p-4 flex items-center justify-between z-50">
           <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white"><ChevronLeft /></button>
           <h1 className="text-xl font-black text-white italic">LUDO PRO</h1>
           <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full text-white">
             {isMuted ? <VolumeX /> : <Volume2 />}
           </button>
        </header>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-2 relative">
         
         {/* PLAYER CARDS - Equal alignment */}
         <div className="absolute top-4 left-4"><PlayerCard color="red" isActive={gameState?.turn === getPlayerByColor('red')?.uid} diceValue={gameState?.dice} onRoll={rollDice} profileImg={getPlayerByColor('red')?.avatarUrl} /></div>
         <div className="absolute top-4 right-4"><PlayerCard color="green" isActive={gameState?.turn === getPlayerByColor('green')?.uid} diceValue={gameState?.dice} onRoll={rollDice} profileImg={getPlayerByColor('green')?.avatarUrl} /></div>
         <div className="absolute bottom-4 left-4"><PlayerCard color="blue" isActive={gameState?.turn === getPlayerByColor('blue')?.uid} diceValue={gameState?.dice} onRoll={rollDice} profileImg={getPlayerByColor('blue')?.avatarUrl} /></div>
         <div className="absolute bottom-4 right-4"><PlayerCard color="yellow" isActive={gameState?.turn === getPlayerByColor('yellow')?.uid} diceValue={gameState?.dice} onRoll={rollDice} profileImg={getPlayerByColor('yellow')?.avatarUrl} /></div>

         {/* BOARD ARENA - Slightly Smaller (max-w-[380px]) */}
         <div className="relative w-full max-w-[380px] aspect-square bg-white rounded-lg shadow-2xl border-[6px] border-white/10 overflow-hidden">
            <div className="w-full h-full grid grid-cols-15 grid-rows-15 border-[1px] border-gray-400">
               
               {/* RED HOME (6x6) */}
               <div className="col-span-6 row-span-6 bg-[#FF4B4B] p-4 border-r border-b border-gray-400">
                  <div className="w-full h-full bg-white rounded flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-3">
                       {[1,2,3,4].map(i => <HomeSocket key={i} color="red"><GamePiece color="red" /></HomeSocket>)}
                    </div>
                  </div>
               </div>

               {/* TOP PATH (3x6) */}
               <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('top', i))}
               </div>

               {/* GREEN HOME (6x6) */}
               <div className="col-span-6 row-span-6 bg-[#00E676] p-4 border-l border-b border-gray-400">
                  <div className="w-full h-full bg-white rounded flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-3">
                       {[1,2,3,4].map(i => <HomeSocket key={i} color="green"><GamePiece color="green" /></HomeSocket>)}
                    </div>
                  </div>
               </div>

               {/* LEFT PATH (6x3) */}
               <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('left', i))}
               </div>

               {/* CENTER FINISH (3x3) */}
               <div className="col-span-3 row-span-3 relative bg-white border border-gray-400">
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)', backgroundColor: '#00E676' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)', backgroundColor: '#FFD500' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)', backgroundColor: '#2979FF' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)', backgroundColor: '#FF4B4B' }} />
               </div>

               {/* RIGHT PATH (6x3) */}
               <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('right', i))}
               </div>

               {/* BLUE HOME (6x6) */}
               <div className="col-span-6 row-span-6 bg-[#2979FF] p-4 border-r border-t border-gray-400">
                  <div className="w-full h-full bg-white rounded flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-3">
                       {[1,2,3,4].map(i => <HomeSocket key={i} color="blue"><GamePiece color="blue" /></HomeSocket>)}
                    </div>
                  </div>
               </div>

               {/* BOTTOM PATH (3x6) */}
               <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('bottom', i))}
               </div>

               {/* YELLOW HOME (6x6) */}
               <div className="col-span-6 row-span-6 bg-[#FFD500] p-4 border-l border-t border-gray-400">
                  <div className="w-full h-full bg-white rounded flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-3">
                       {[1,2,3,4].map(i => <HomeSocket key={i} color="yellow"><GamePiece color="yellow" /></HomeSocket>)}
                    </div>
                  </div>
               </div>
            </div>
         </div>

         {!gameState && (
           <button 
             onClick={() => joinLobby(userProfile)}
             className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black px-10 py-3 rounded-full font-bold shadow-[0_6px_0_#b8860b] active:translate-y-1 active:shadow-none transition-all"
           >
              PLAY NOW
           </button>
         )}
      </main>

      {isMyTurn && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
           <Badge className="bg-green-500 text-white px-6 py-2 rounded-full animate-bounce shadow-xl">YOUR TURN</Badge>
        </div>
      )}
    </div>
  );
}

export default function LudoGamePage() {
  return (
    <AppLayout fullScreen>
      <Suspense fallback={<div className="h-screen w-full bg-[#0a1a4a] flex items-center justify-center text-white">READYING BOARD...</div>}>
        <LudoGameContent />
      </Suspense>
    </AppLayout>
  );
}
