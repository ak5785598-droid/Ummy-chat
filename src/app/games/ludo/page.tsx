'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  ChevronLeft, 
  Gamepad2, 
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  Trophy,
  Loader
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';
import { useLudoEngine } from '@/hooks/use-ludo-engine';

const LudoPieceSVG = ({ color, position, onClick, isSelectable }: { 
  color: string, 
  position: number, 
  onClick?: () => void,
  isSelectable?: boolean 
}) => {
  // SVG coordinates mapping for 15x15 grid (0-14)
  // Simplified for prototype: 0=base, 1-52=path
  if (position === 0) return null; // Logic handled by lobby visuals

  return (
    <div 
      onClick={onClick}
      className={cn(
        "absolute h-6 w-6 rounded-full border-2 border-white shadow-xl transition-all duration-300",
        isSelectable && "animate-reaction-pulse cursor-pointer ring-4 ring-white"
      )}
      style={{
        backgroundColor: color,
        transform: 'translate(-50%, -50%)',
        left: 'calc(var(--ludo-x) * 1%)',
        top: 'calc(var(--ludo-y) * 1%)'
      }}
    />
  );
};

function LudoGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || 'global_room';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // LUDO ENGINE SYNC
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
    <AppLayout>
      <div className="h-screen w-full bg-[#0a1a4a] flex flex-col relative overflow-hidden font-headline">
        <CompactRoomView />

        <header className="relative z-40 p-3 pt-32 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent shrink-0">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-1.5 rounded-full text-white">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
           </div>
           <h1 className="text-lg font-black text-white uppercase italic tracking-tighter drop-shadow-lg">Ludo • Multiplayer</h1>
           <div className="flex gap-2">
              <button className="bg-white/10 p-1.5 rounded-full text-white"><RefreshCw className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white"><X className="h-4 w-4" /></button>
           </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 pb-20">
           {/* LUDO BOARD ARENA */}
           <div className="relative w-full max-w-[400px] aspect-square bg-white rounded-[2rem] p-1.5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-b-[8px] border-black/20">
              <div 
                className="w-full h-full rounded-[1.8rem] overflow-hidden relative"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', 
                  gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
                  gap: '1px'
                }}
              >
                 {/* RED HOME (Top Left) */}
                 <div className="col-span-6 row-span-6 bg-red-500 flex items-center justify-center p-4">
                   <div className="w-full h-full bg-white rounded-3xl" />
                 </div>
                 {/* PATH 1 (Top Center) */}
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5 bg-gray-100">
                    {Array.from({ length: 18 }).map((_, i) => <div key={i} className="bg-white shadow-[inset_0_0_2px_rgba(0,0,0,0.1)] rounded-sm" />)}
                 </div>
                 {/* GREEN HOME (Top Right) */}
                 <div className="col-span-6 row-span-6 bg-green-500 flex items-center justify-center p-4">
                    <div className="w-full h-full bg-white rounded-3xl" />
                 </div>

                 {/* PATH 2 (Middle Left) */}
                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5 bg-gray-100">
                    {Array.from({ length: 18 }).map((_, i) => <div key={i} className="bg-white shadow-[inset_0_0_2px_rgba(0,0,0,0.1)] rounded-sm" />)}
                 </div>
                 {/* CENTER HOME (Finish) */}
                 <div className="col-span-3 row-span-3 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 border-[24px] border-transparent border-t-red-500 border-l-blue-500 border-r-green-500 border-b-yellow-500 scale-150 rotate-45" />
                    <Trophy className="h-6 w-6 text-white absolute z-10 animate-bounce" />
                 </div>
                 {/* PATH 3 (Middle Right) */}
                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5 bg-gray-100">
                    {Array.from({ length: 18 }).map((_, i) => <div key={i} className="bg-white shadow-[inset_0_0_2px_rgba(0,0,0,0.1)] rounded-sm" />)}
                 </div>

                 {/* BLUE HOME (Bottom Left) */}
                 <div className="col-span-6 row-span-6 bg-blue-500 flex items-center justify-center p-4">
                    <div className="w-full h-full bg-white rounded-3xl" />
                 </div>
                 {/* PATH 4 (Bottom Center) */}
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5 bg-gray-100">
                    {Array.from({ length: 18 }).map((_, i) => <div key={i} className="bg-white shadow-[inset_0_0_2px_rgba(0,0,0,0.1)] rounded-sm" />)}
                 </div>
                 {/* YELLOW HOME (Bottom Right) */}
                 <div className="col-span-6 row-span-6 bg-yellow-400 flex items-center justify-center p-4">
                    <div className="w-full h-full bg-white rounded-3xl" />
                 </div>

                 {/* RENDER ACTIVE PIECES (Placeholder Logic) */}
                 {gameState?.pieces.map((piece) => (
                   <LudoPieceSVG 
                    key={piece.id} 
                    color={piece.color} 
                    position={piece.position} 
                    isSelectable={isMyTurn && gameState.diceRolled && piece.ownerUid === currentUser?.uid}
                    onClick={() => movePiece(piece.id)}
                   />
                 ))}
              </div>

              {/* LOBBY AVATARS AT CORNERS */}
              <div className="absolute top-4 left-4 h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center overflow-hidden border-2 border-red-500">
                 <Avatar className="h-full w-full rounded-none"><AvatarImage src={gameState?.players.find(p => p.color === 'red')?.avatarUrl} /></Avatar>
              </div>
              <div className="absolute top-4 right-4 h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center overflow-hidden border-2 border-green-500">
                 <Avatar className="h-full w-full rounded-none"><AvatarImage src={gameState?.players.find(p => p.color === 'green')?.avatarUrl} /></Avatar>
              </div>
              <div className="absolute bottom-4 left-4 h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center overflow-hidden border-2 border-blue-500">
                 <Avatar className="h-full w-full rounded-none"><AvatarImage src={gameState?.players.find(p => p.color === 'blue')?.avatarUrl} /></Avatar>
              </div>
              <div className="absolute bottom-4 right-4 h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center overflow-hidden border-2 border-yellow-500">
                 <Avatar className="h-full w-full rounded-none"><AvatarImage src={gameState?.players.find(p => p.color === 'yellow')?.avatarUrl} /></Avatar>
              </div>
           </div>

           {/* CONTROLS (Floating HUD) */}
           <div className="mt-8 flex items-center gap-6">
              {!gameState && (
                <button 
                  onClick={() => joinLobby(userProfile)}
                  className="bg-primary hover:bg-primary/90 text-black px-10 py-4 rounded-full font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all"
                >
                   Enter Lobby
                </button>
              )}
              
              {gameState?.status === 'lobby' && gameState.players.length < 4 && !gameState.players.find(p => p.uid === currentUser?.uid) && (
                <button onClick={() => joinLobby(userProfile)} className="bg-primary text-black px-10 py-4 rounded-full font-black tracking-widest uppercase">Join Battle</button>
              )}

              {gameState && (
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    "h-24 w-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center border-4 relative transition-all duration-300",
                    isMyTurn ? "border-[#00E5FF] scale-110 shadow-[#00E5FF]/40" : "border-gray-200 opacity-60"
                  )}>
                    {isMyTurn && !gameState.diceRolled ? (
                      <button 
                        onClick={rollDice}
                        className="h-full w-full flex items-center justify-center animate-pulse"
                      >
                         <span className="text-sm font-black text-black">Roll</span>
                      </button>
                    ) : (
                      <span className="text-4xl font-black text-black">{gameState.dice || '?'}</span>
                    )}
                    
                    {isMyTurn && (
                      <div className="absolute -top-4 bg-[#00E5FF] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Your Turn</div>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Current Players: {gameState.players.length}/4</p>
                </div>
              )}
           </div>
        </main>
      </div>
    </AppLayout>
  );
}

export default function LudoGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#0a1a4a] flex items-center justify-center font-headline text-white">SYNCING LUDO...</div>}>
      <LudoGameContent />
    </Suspense>
  );
}
