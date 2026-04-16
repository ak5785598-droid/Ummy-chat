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
  RefreshCw,
  Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useLudoEngine } from '@/hooks/use-ludo-engine';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/app-layout';

// --- UI COMPONENTS ---

const GamePiece = ({ color }: { color: string }) => (
  <div className="relative flex flex-col items-center justify-center drop-shadow-md transition-transform hover:scale-110 cursor-pointer z-10 scale-[0.65] md:scale-90">
    <div className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] bg-white rounded-full flex items-center justify-center shadow-sm relative z-10 border border-gray-100">
      <div className={cn(
        "w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full shadow-inner",
        color === 'red' && "bg-[#FF4B4B]",
        color === 'green' && "bg-[#00E676]",
        color === 'blue' && "bg-[#2979FF]",
        color === 'yellow' && "bg-[#FFD500]"
      )} />
    </div>
    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] md:border-l-[7px] md:border-r-[7px] md:border-t-[9px] border-l-transparent border-r-transparent border-t-white absolute -bottom-[5px] md:-bottom-[7px]" />
  </div>
);

const HomeSocket = ({ color, children }: { color: string, children?: React.ReactNode }) => (
  <div className={cn(
    "w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
    color === 'red' ? "bg-[#FF4B4B] border-[2px] border-[#b71c1c]" :
    color === 'green' ? "bg-[#00E676] border-[2px] border-[#1b5e20]" :
    color === 'blue' ? "bg-[#2979FF] border-[2px] border-[#0d47a1]" :
    "bg-[#FFD500] border-[2px] border-[#f57f17]"
  )}>
    {children}
  </div>
);

const PlayerCard = ({ color, isActive, diceValue, isRolling, onRoll, profileImg, username }: any) => {
  const colorMap: any = {
    red: "border-[#FF4B4B] bg-white text-[#FF4B4B]",
    green: "border-[#00E676] bg-white text-[#00E676]",
    blue: "border-[#2979FF] bg-white text-[#2979FF]",
    yellow: "border-[#FFD500] bg-white text-[#FFD500]",
  };

  const btnColorMap: any = {
    red: "bg-[#FF4B4B]",
    green: "bg-[#00E676]",
    blue: "bg-[#2979FF]",
    yellow: "bg-[#FFD500]",
  };

  return (
    <div className={cn(
      "flex items-center gap-2 p-1 md:p-1.5 rounded-xl border transition-all duration-300 shadow-sm",
      colorMap[color],
      isActive ? "scale-105 shadow-[0_5px_15px_rgba(0,0,0,0.1)] ring-2 ring-gray-200" : "opacity-70 grayscale-[0.3]"
    )}>
      <Avatar className={cn("h-8 w-8 md:h-10 md:w-10 rounded-lg border", colorMap[color])}>
        <AvatarImage src={profileImg} />
        <AvatarFallback className="bg-gray-100"><User size={16} className="text-gray-500" /></AvatarFallback>
      </Avatar>

      <button 
        onClick={onRoll}
        disabled={!isActive || isRolling}
        className={cn(
          "w-8 h-8 md:w-10 md:h-10 rounded-lg shadow-inner flex items-center justify-center transition-transform active:scale-90",
          btnColorMap[color],
          isActive && !isRolling ? "animate-pulse cursor-pointer shadow-md" : "cursor-default"
        )}
      >
        <span className={cn(
          "text-base md:text-lg font-black",
          (color === 'yellow' || color === 'green') ? "text-black" : "text-white"
        )}>
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
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLaunching || isLoading) {
    return (
      <div className={cn(
        "w-full flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-white via-gray-50 to-white",
        isOverlay ? "h-full min-h-[400px]" : "h-screen"
      )}>
        <Loader className="h-20 w-20 text-yellow-500 animate-spin drop-shadow-md" />
        <h1 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter drop-shadow-sm">Synchronizing Arena</h1>
      </div>
    );
  }

  const isMyTurn = gameState?.turn === currentUser?.uid;

  const renderPath = (type: 'top' | 'left' | 'right' | 'bottom', i: number) => {
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
      <div key={`${type}-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>
        {content}
      </div>
    );
  };

  const getPlayerByColor = (color: string) => gameState?.players.find((p: any) => p.color === color);

  return (
    <div className={cn(
      "h-full w-full flex flex-col relative overflow-hidden font-sans bg-white",
      !isOverlay && "pb-20"
    )}>
      {!isOverlay && (
        <header className="relative z-40 p-4 pt-12 flex items-center justify-between bg-[#0a1a4a] shrink-0 shadow-lg">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md transition hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>
           </div>
           <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">LUDO PRO</h1>
           <div className="flex gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md transition hover:bg-white/20">
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md transition hover:bg-white/20"><X className="h-6 w-6" /></button>
           </div>
        </header>
      )}

      <main className={cn(
        "flex-1 relative flex flex-col items-center justify-center p-4 z-10 bg-gradient-to-b from-white via-gray-50 to-gray-100",
        isOverlay ? "py-2" : "py-4"
      )}>
         
         <div className="absolute top-2 left-2 md:top-4 md:left-4">
           <PlayerCard 
              color="red" 
              isActive={gameState?.turn === getPlayerByColor('red')?.uid} 
              diceValue={gameState?.dice} 
              isRolling={isMyTurn && gameState?.turn === getPlayerByColor('red')?.uid && !gameState?.diceRolled}
              onRoll={rollDice}
              profileImg={getPlayerByColor('red')?.avatarUrl}
              username={getPlayerByColor('red')?.username}
           />
         </div>
         <div className="absolute top-2 right-2 md:top-4 md:right-4">
           <PlayerCard 
              color="green" 
              isActive={gameState?.turn === getPlayerByColor('green')?.uid} 
              diceValue={gameState?.dice} 
              onRoll={rollDice}
              profileImg={getPlayerByColor('green')?.avatarUrl}
              username={getPlayerByColor('green')?.username}
           />
         </div>
         <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4">
           <PlayerCard 
              color="blue" 
              isActive={gameState?.turn === getPlayerByColor('blue')?.uid} 
              diceValue={gameState?.dice} 
              onRoll={rollDice}
              profileImg={getPlayerByColor('blue')?.avatarUrl}
              username={getPlayerByColor('blue')?.username}
           />
         </div>
         <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4">
           <PlayerCard 
              color="yellow" 
              isActive={gameState?.turn === getPlayerByColor('yellow')?.uid} 
              diceValue={gameState?.dice} 
              onRoll={rollDice}
              profileImg={getPlayerByColor('yellow')?.avatarUrl}
              username={getPlayerByColor('yellow')?.username}
           />
         </div>

         {/* GAME AREA - Reduced size to max 320px/360px */}
         <div className={cn(
            "relative w-full max-w-[320px] md:max-w-[360px] aspect-square bg-white rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border-[4px] border-white overflow-hidden",
            isOverlay && "scale-90"
         )}>
            {/* FIXED GRID: Using inline styles instead of tailwind grid-cols-15 for perfect squares */}
            <div 
              className="w-full h-full border-[0.5px] border-gray-400"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}
            >
               
               {/* RED HOME */}
               <div className="col-start-1 col-end-7 row-start-1 row-end-7 bg-[#FF4B4B] p-1.5 md:p-2 border-r-[0.5px] border-b-[0.5px] border-gray-400">
                  <div className="w-full h-full bg-white flex items-center justify-center rounded-lg shadow-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 md:gap-2 p-1.5">
                       {[1,2,3,4].map(i => <HomeSocket key={`red-${i}`} color="red"><GamePiece color="red" /></HomeSocket>)}
                    </div>
                  </div>
               </div>

               {/* TOP PATH */}
               <div className="col-start-7 col-end-10 row-start-1 row-end-7 grid grid-cols-3 grid-rows-6">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('top', i))}
               </div>

               {/* GREEN HOME */}
               <div className="col-start-10 col-end-16 row-start-1 row-end-7 bg-[#00E676] p-1.5 md:p-2 border-l-[0.5px] border-b-[0.5px] border-gray-400">
                  <div className="w-full h-full bg-white flex items-center justify-center rounded-lg shadow-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 md:gap-2 p-1.5">
                       {[1,2,3,4].map(i => <HomeSocket key={`green-${i}`} color="green"><GamePiece color="green" /></HomeSocket>)}
                    </div>
                  </div>
               </div>

               {/* LEFT PATH */}
               <div className="col-start-1 col-end-7 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('left', i))}
               </div>

               {/* CENTER FINISH */}
               <div className="col-start-7 col-end-10 row-start-7 row-end-10 relative bg-white border-[0.5px] border-gray-400 shadow-inner">
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)', backgroundColor: '#00E676' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)', backgroundColor: '#FFD500' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)', backgroundColor: '#2979FF' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)', backgroundColor: '#FF4B4B' }} />
               </div>

               {/* RIGHT PATH */}
               <div className="col-start-10 col-end-16 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('right', i))}
               </div>

               {/* BLUE HOME */}
               <div className="col-start-1 col-end-7 row-start-10 row-end-16 bg-[#2979FF] p-1.5 md:p-2 border-r-[0.5px] border-t-[0.5px] border-gray-400">
                  <div className="w-full h-full bg-white flex items-center justify-center rounded-lg shadow-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 md:gap-2 p-1.5">
                       {[1,2,3,4].map(i => <HomeSocket key={`blue-${i}`} color="blue"><GamePiece color="blue" /></HomeSocket>)}
                    </div>
                  </div>
               </div>

               {/* BOTTOM PATH */}
               <div className="col-start-7 col-end-10 row-start-10 row-end-16 grid grid-cols-3 grid-rows-6">
                  {Array.from({ length: 18 }).map((_, i) => renderPath('bottom', i))}
               </div>

               {/* YELLOW HOME */}
               <div className="col-start-10 col-end-16 row-start-10 row-end-16 bg-[#FFD500] p-1.5 md:p-2 border-l-[0.5px] border-t-[0.5px] border-gray-400">
                  <div className="w-full h-full bg-white flex items-center justify-center rounded-lg shadow-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 md:gap-2 p-1.5">
                       {[1,2,3,4].map(i => <HomeSocket key={`yellow-${i}`} color="yellow"><GamePiece color="yellow" /></HomeSocket>)}
                    </div>
                  </div>
               </div>
            </div>
         </div>

         {!gameState && (
           <button 
             onClick={() => joinLobby(userProfile)}
             className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-3 rounded-full font-black uppercase text-base shadow-[0_8px_0_#b8860b] active:translate-y-1 active:shadow-none transition-all"
           >
              Enter Lobby
           </button>
         )}
      </main>

      {!isOverlay && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
           {isMyTurn && <Badge className="bg-cyan-400 text-black font-black px-6 py-2 rounded-full animate-pulse shadow-lg text-lg">YOUR TURN</Badge>}
        </div>
      )}
    </div>
  );
}

export default function LudoGamePage() {
  return (
    <AppLayout fullScreen>
      <Suspense fallback={<div className="h-screen w-full bg-white flex items-center justify-center text-gray-800">SYNCING ARENA...</div>}>
        <LudoGameContent />
      </Suspense>
    </AppLayout>
  );
}
