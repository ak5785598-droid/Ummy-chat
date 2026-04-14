'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  ChevronLeft, 
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Star,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Loader
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLudoEngine } from '@/hooks/use-ludo-engine';

// --- Sub-components ---

// Marker-style piece based on Image 2
const GamePiece = ({ color }: { color: string }) => (
  <div className="relative flex items-center justify-center animate-in zoom-in-50 duration-300">
    <div className={cn(
      "h-7 w-7 md:h-8 md:w-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative",
      color === 'red' && "bg-red-500",
      color === 'green' && "bg-emerald-500",
      color === 'blue' && "bg-blue-500",
      color === 'yellow' && "bg-yellow-400"
    )}>
      {/* The "pin" look */}
      <div className={cn(
        "absolute -top-1 h-3 w-3 rotate-45 border-t-2 border-l-2 border-white",
        color === 'red' && "bg-red-500",
        color === 'green' && "bg-emerald-500",
        color === 'blue' && "bg-blue-500",
        color === 'yellow' && "bg-yellow-400"
      )} />
      <div className="h-2 w-2 bg-white/40 rounded-full z-10" />
    </div>
  </div>
);

const PlayerAvatar = ({ color, pos, img }: { color: string, pos: string, img?: string }) => (
  <div className={cn("absolute h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center p-1 shadow-lg z-20 border-2 border-white/20", pos, 
    color === 'red' ? "bg-red-600" : 
    color === 'green' ? "bg-emerald-600" : 
    color === 'blue' ? "bg-blue-600" : 
    "bg-yellow-500"
  )}>
     <Avatar className="h-full w-full rounded-lg overflow-hidden border border-black/10">
       <AvatarImage src={img} />
       <AvatarFallback className="bg-white/20 text-white text-[10px] font-bold">P</AvatarFallback>
     </Avatar>
  </div>
);

// --- Main Content ---

export function LudoGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || 'global_room';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const { gameState, isLoading, joinLobby, rollDice } = useLudoEngine(roomId, currentUser?.uid || null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLaunching || isLoading) {
    return (
      <div className="h-screen w-full bg-transparent flex flex-col items-center justify-center space-y-6">
        <Loader className="h-12 w-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  const isMyTurn = gameState?.turn === currentUser?.uid;

  // Helper function to render path cells with safe spots (Stars)
  const renderCell = (index: number, type: 'top' | 'left' | 'right' | 'bottom') => {
    let bgColor = "bg-white";
    let icon = null;

    // Red Safe / Path
    if (type === 'left') {
      if (index === 1) icon = <Star className="h-3 w-3 text-gray-400" />;
      if ([7, 8, 9, 10, 11].includes(index)) bgColor = "bg-red-500";
      if (index === 6) icon = <ArrowRight className="h-3 w-3 text-red-500" />;
    }
    // Green Safe / Path
    if (type === 'top') {
      if (index === 13) icon = <Star className="h-3 w-3 text-gray-400" />;
      if ([7, 10, 13, 16, 1].includes(index) && index !== 1) { /* Fix for path logic */}
      if (index === 7 || index === 10 || index === 13 || index === 16) bgColor = "bg-emerald-500";
      if (index === 1) icon = <ArrowDown className="h-3 w-3 text-emerald-500" />;
    }
    // Yellow Safe / Path
    if (type === 'right') {
      if (index === 16) icon = <Star className="h-3 w-3 text-gray-400" />;
      if ([6, 7, 8, 9, 10].includes(index)) bgColor = "bg-yellow-400";
      if (index === 11) icon = <ArrowLeft className="h-3 w-3 text-yellow-400" />;
    }
    // Blue Safe / Path
    if (type === 'bottom') {
      if (index === 4) icon = <Star className="h-3 w-3 text-gray-400" />;
      if ([1, 4, 7, 10, 13].includes(index)) bgColor = "bg-blue-600";
      if (index === 16) icon = <ArrowUp className="h-3 w-3 text-blue-600" />;
    }

    return (
      <div key={index} className={cn("border-[0.5px] border-gray-300 flex items-center justify-center", bgColor)}>
        {icon}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 w-full h-screen flex flex-col justify-end bg-transparent">
      
      {/* 1. TOP AREA: Fully Transparent, no blur */}
      <div 
        className="flex-1 w-full bg-transparent cursor-pointer" 
        onClick={() => router.back()} 
      />

      {/* 2. BOTTOM GAME SHEET */}
      <div className="h-[68vh] w-full bg-[#0a1a4a] rounded-t-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.9)] border-t border-white/5 flex flex-col relative animate-in slide-in-from-bottom duration-700">
        
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

        <header className="px-6 pt-8 pb-4 flex items-center justify-between shrink-0">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-white/5 p-2.5 rounded-2xl text-white"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 p-2.5 rounded-2xl text-white">{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
           </div>
           
           <div className="text-center">
             <h1 className="text-base font-black text-white uppercase italic tracking-widest leading-none">Ludo Pro</h1>
             <span className="text-[10px] text-cyan-400 font-bold uppercase">Multiplayer</span>
           </div>

           <div className="flex gap-2">
              <button className="bg-white/5 p-2.5 rounded-2xl text-white"><RefreshCw className="h-5 w-5" /></button>
              <button onClick={() => router.back()} className="bg-white/5 p-2.5 rounded-2xl text-red-400"><X className="h-5 w-5" /></button>
           </div>
        </header>

        <main className="flex-1 flex flex-col items-center p-4">
           
           <div className="relative w-full max-w-[350px] aspect-square bg-slate-200 rounded-xl p-1 shadow-2xl">
              <div 
                className="w-full h-full rounded-lg overflow-hidden relative"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(15, 1fr)', 
                  gridTemplateRows: 'repeat(15, 1fr)',
                }}
              >
                 {/* RED HOME */}
                 <div className="col-span-6 row-span-6 bg-red-500 p-2">
                   <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3">
                      <GamePiece color="red" /> <GamePiece color="red" />
                      <GamePiece color="red" /> <GamePiece color="red" />
                   </div>
                 </div>

                 {/* TOP PATH (Green Side) */}
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'top'))}
                 </div>

                 {/* GREEN HOME */}
                 <div className="col-span-6 row-span-6 bg-emerald-500 p-2">
                    <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3">
                      <GamePiece color="green" /> <GamePiece color="green" />
                      <GamePiece color="green" /> <GamePiece color="green" />
                    </div>
                 </div>

                 {/* LEFT PATH (Red Side) */}
                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'left'))}
                 </div>

                 {/* CENTER FINISH AREA (Triangles) */}
                 <div className="col-span-3 row-span-3 bg-white relative">
                    <div className="absolute inset-0" style={{
                        clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)',
                        backgroundColor: '#10b981' // Green
                      }} />
                    <div className="absolute inset-0" style={{
                        clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)',
                        backgroundColor: '#facc15' // Yellow
                      }} />
                    <div className="absolute inset-0" style={{
                        clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)',
                        backgroundColor: '#2563eb' // Blue
                      }} />
                    <div className="absolute inset-0" style={{
                        clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)',
                        backgroundColor: '#ef4444' // Red
                      }} />
                 </div>

                 {/* RIGHT PATH (Yellow Side) */}
                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'right'))}
                 </div>

                 {/* BLUE HOME */}
                 <div className="col-span-6 row-span-6 bg-blue-600 p-2">
                    <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3">
                      <GamePiece color="blue" /> <GamePiece color="blue" />
                      <GamePiece color="blue" /> <GamePiece color="blue" />
                    </div>
                 </div>

                 {/* BOTTOM PATH (Blue Side) */}
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'bottom'))}
                 </div>

                 {/* YELLOW HOME */}
                 <div className="col-span-6 row-span-6 bg-yellow-400 p-2">
                    <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3">
                      <GamePiece color="yellow" /> <GamePiece color="yellow" />
                      <GamePiece color="yellow" /> <GamePiece color="yellow" />
                    </div>
                 </div>
              </div>

              {/* Player Avatars */}
              <PlayerAvatar color="red" pos="-top-3 -left-3" img={gameState?.players.find(p => p.color === 'red')?.avatarUrl} />
              <PlayerAvatar color="green" pos="-top-3 -right-3" img={gameState?.players.find(p => p.color === 'green')?.avatarUrl} />
              <PlayerAvatar color="blue" pos="-bottom-3 -left-3" img={gameState?.players.find(p => p.color === 'blue')?.avatarUrl} />
              <PlayerAvatar color="yellow" pos="-bottom-3 -right-3" img={gameState?.players.find(p => p.color === 'yellow')?.avatarUrl} />
           </div>

           {/* DICE AREA */}
           <div className="mt-8 w-full flex flex-col items-center">
              {gameState ? (
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    "h-24 w-24 rounded-[30px] bg-white shadow-2xl flex items-center justify-center border-4 transition-transform duration-300",
                    isMyTurn ? "border-cyan-400 scale-110 shadow-cyan-500/50" : "border-slate-800 opacity-50"
                  )}>
                    {isMyTurn && !gameState.diceRolled ? (
                      <button onClick={rollDice} className="w-full h-full flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-slate-400 animate-pulse">ROLL</span>
                      </button>
                    ) : (
                      <span className="text-5xl font-black text-[#0a1a4a]">{gameState.dice || '0'}</span>
                    )}
                  </div>
                  {isMyTurn && <Badge className="bg-cyan-500 text-white font-bold py-1 px-4 animate-bounce">YOUR TURN</Badge>}
                </div>
              ) : (
                <button 
                  onClick={() => joinLobby(userProfile)}
                  className="bg-gradient-to-b from-yellow-300 to-orange-500 text-white px-14 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_#9a3412] active:translate-y-1 active:shadow-none transition-all"
                >
                   START MATCH
                </button>
              )}
           </div>
        </main>
      </div>
    </div>
  );
}

export default function LudoGamePage() {
  return (
    <Suspense fallback={null}>
      <LudoGameContent />
    </Suspense>
  );
}
