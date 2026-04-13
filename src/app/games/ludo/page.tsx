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
  Trophy,
  Loader
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';
import { useLudoEngine } from '@/hooks/use-ludo-engine';

// Goti (Piece) UI inside the Home boxes
const HomePiece = ({ color }: { color: string }) => (
  <div className="relative group">
    <div className={cn(
      "h-8 w-8 md:h-10 md:w-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center",
      color === 'red' && "bg-red-600",
      color === 'green' && "bg-green-600",
      color === 'blue' && "bg-blue-600",
      color === 'yellow' && "bg-yellow-500"
    )}>
      {/* Inner design to match the pin/location style in 2nd image */}
      <div className="h-3 w-3 bg-white/40 rounded-full" />
    </div>
  </div>
);

export function LudoGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || 'global_room';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const { gameState, isLoading, joinLobby, rollDice, movePiece } = useLudoEngine(roomId, currentUser?.uid || null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLaunching || isLoading) {
    return (
      <div className="h-screen w-full bg-[#0a1a4a] flex flex-col items-center justify-center space-y-6 font-headline">
        <Loader className="h-20 w-20 text-yellow-500 animate-spin" />
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Synchronizing Arena</h1>
      </div>
    );
  }

  const isMyTurn = gameState?.turn === currentUser?.uid;

  return (
    <div className="h-full w-full bg-[#0a1a4a] flex flex-col relative overflow-hidden font-headline pb-20">
      {/* Status Bar / Top Overlay */}
      <CompactRoomView />

      <header className="relative z-40 p-3 pt-12 px-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent shrink-0">
         <div className="flex gap-2">
            <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md">{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
         </div>
         <h1 className="text-xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">Ludo • Multiplayer</h1>
         <div className="flex gap-2">
            <button className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md"><RefreshCw className="h-5 w-5" /></button>
            <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md"><X className="h-5 w-5" /></button>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
         {/* LUDO BOARD ARENA */}
         <div className="relative w-full max-w-[450px] aspect-square bg-white rounded-3xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div 
              className="w-full h-full rounded-2xl overflow-hidden relative border-2 border-gray-300"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(15, 1fr)', 
                gridTemplateRows: 'repeat(15, 1fr)',
              }}
            >
               {/* RED HOME (Top Left) */}
               <div className="col-span-6 row-span-6 bg-[#ED1C24] border-r-2 border-b-2 border-black/10 flex items-center justify-center p-4">
                 <div className="w-full h-full bg-white rounded-xl grid grid-cols-2 grid-rows-2 p-3 gap-3">
                    <HomePiece color="red" /> <HomePiece color="red" />
                    <HomePiece color="red" /> <HomePiece color="red" />
                 </div>
               </div>

               {/* TOP PATH (Green Home Entry) */}
               <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-b-2 border-black/10">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className={cn("border-[0.5px] border-gray-200", i === 7 || i === 10 || i === 13 || i === 16 ? "bg-green-500" : "bg-white")} />
                  ))}
               </div>

               {/* GREEN HOME (Top Right) */}
               <div className="col-span-6 row-span-6 bg-[#00A651] border-l-2 border-b-2 border-black/10 flex items-center justify-center p-4">
                  <div className="w-full h-full bg-white rounded-xl grid grid-cols-2 grid-rows-2 p-3 gap-3">
                    <HomePiece color="green" /> <HomePiece color="green" />
                    <HomePiece color="green" /> <HomePiece color="green" />
                  </div>
               </div>

               {/* LEFT PATH (Red Home Entry) */}
               <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-r-2 border-black/10">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className={cn("border-[0.5px] border-gray-200", [7, 8, 9, 10, 11].includes(i) ? "bg-red-500" : "bg-white")} />
                  ))}
               </div>

               {/* CENTER FINISH */}
               <div className="col-span-3 row-span-3 bg-white relative flex items-center justify-center border-2 border-gray-200">
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'conic-gradient(#00A651 0deg 90deg, #F9ED32 90deg 180deg, #2E3192 180deg 270deg, #ED1C24 270deg 360deg)',
                      clipPath: 'polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0)'
                    }}
                  />
                  <Trophy className="h-8 w-8 text-white absolute z-10 drop-shadow-lg" />
               </div>

               {/* RIGHT PATH (Yellow Home Entry) */}
               <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-l-2 border-black/10">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className={cn("border-[0.5px] border-gray-200", [6, 7, 8, 9, 10].includes(i) ? "bg-yellow-400" : "bg-white")} />
                  ))}
               </div>

               {/* BLUE HOME (Bottom Left) */}
               <div className="col-span-6 row-span-6 bg-[#2E3192] border-r-2 border-t-2 border-black/10 flex items-center justify-center p-4">
                  <div className="w-full h-full bg-white rounded-xl grid grid-cols-2 grid-rows-2 p-3 gap-3">
                    <HomePiece color="blue" /> <HomePiece color="blue" />
                    <HomePiece color="blue" /> <HomePiece color="blue" />
                  </div>
               </div>

               {/* BOTTOM PATH (Blue Home Entry) */}
               <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-t-2 border-black/10">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className={cn("border-[0.5px] border-gray-200", [1, 4, 7, 10, 13].includes(i) ? "bg-blue-600" : "bg-white")} />
                  ))}
               </div>

               {/* YELLOW HOME (Bottom Right) */}
               <div className="col-span-6 row-span-6 bg-[#F9ED32] border-l-2 border-t-2 border-black/10 flex items-center justify-center p-4">
                  <div className="w-full h-full bg-white rounded-xl grid grid-cols-2 grid-rows-2 p-3 gap-3">
                    <HomePiece color="yellow" /> <HomePiece color="yellow" />
                    <HomePiece color="yellow" /> <HomePiece color="yellow" />
                  </div>
               </div>
            </div>

            {/* PLAYER AVATARS - Updated UI Based on 2nd Image */}
            <PlayerAvatar color="red" pos="-top-4 -left-4 md:-top-6 md:-left-6" img={gameState?.players.find(p => p.color === 'red')?.avatarUrl} />
            <PlayerAvatar color="green" pos="-top-4 -right-4 md:-top-6 md:-right-6" img={gameState?.players.find(p => p.color === 'green')?.avatarUrl} />
            <PlayerAvatar color="blue" pos="-bottom-4 -left-4 md:-bottom-6 md:-left-6" img={gameState?.players.find(p => p.color === 'blue')?.avatarUrl} />
            <PlayerAvatar color="yellow" pos="-bottom-4 -right-4 md:-bottom-6 md:-right-6" img={gameState?.players.find(p => p.color === 'yellow')?.avatarUrl} />
         </div>

         {/* GAME CONTROLS */}
         <div className="mt-12 flex flex-col items-center gap-6">
            {!gameState && (
              <button 
                onClick={() => joinLobby(userProfile)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-4 rounded-full font-black uppercase text-lg shadow-[0_10px_0_#b8860b] active:translate-y-1 active:shadow-none transition-all"
              >
                 Enter Lobby
              </button>
            )}

            {gameState && (
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "h-28 w-28 rounded-3xl bg-white shadow-2xl flex items-center justify-center border-8 transition-all duration-300",
                  isMyTurn ? "border-cyan-400 scale-110" : "border-gray-200 opacity-80"
                )}>
                  {isMyTurn && !gameState.diceRolled ? (
                    <button onClick={rollDice} className="h-full w-full flex items-center justify-center">
                       <span className="text-xl font-black text-black animate-bounce">TAP</span>
                    </button>
                  ) : (
                    <span className="text-5xl font-black text-black">{gameState.dice || '?'}</span>
                  )}
                </div>
                {isMyTurn && <Badge className="bg-cyan-400 text-black font-black animate-pulse">YOUR TURN</Badge>}
              </div>
            )}
         </div>
      </main>
    </div>
  );
}

// Updated PlayerAvatar component to match the solid box background and positioning
const PlayerAvatar = ({ color, pos, img }: { color: string, pos: string, img?: string }) => (
  <div className={cn("absolute h-16 w-16 md:h-[72px] md:w-[72px] rounded-xl flex items-center justify-center p-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.6)] z-20", pos, 
    color === 'red' ? "bg-[#ED1C24]" : 
    color === 'green' ? "bg-[#00A651]" : 
    color === 'blue' ? "bg-[#2E3192]" : 
    "bg-[#F9ED32]"
  )}>
     <Avatar className="h-full w-full rounded-lg bg-gray-200 overflow-hidden">
       <AvatarImage src={img} />
       <AvatarFallback className="bg-gray-100 rounded-lg" />
     </Avatar>
  </div>
);

export default function LudoGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#0a1a4a] flex items-center justify-center text-white">SYNCING ARENA...</div>}>
      <LudoGameContent />
    </Suspense>
  );
}
