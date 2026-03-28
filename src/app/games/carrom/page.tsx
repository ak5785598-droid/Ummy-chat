'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 ChevronLeft, 
 Volume2, 
 VolumeX, 
 HelpCircle, 
 Trophy, 
 X,
 ChevronDown,
 Users,
 Move,
 Loader,
 Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { useCarromEngine } from '@/hooks/use-carrom-engine';

/**
 * High-Fidelity Carrom Arena - Multiplayer Integration.
 * Synchronizes striker position, turns, and lobby state.
 */
export default function CarromGamePage() {
 const router = useRouter();
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);

 const [isLaunching, setIsLaunching] = useState(true);
 const [isMuted, setIsMuted] = useState(false);

 // CARROM ENGINE SYNC
 const { gameState, isLoading, joinArena, updateStriker, strike } = useCarromEngine('global_room', currentUser?.uid || null);

 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1500);
  return () => clearTimeout(timer);
 }, []);

 if (isLaunching || isLoading) {
  return (
   <div className="h-screen w-full bg-[#004d40] flex flex-col items-center justify-center space-y-6 font-sans relative overflow-hidden">
    <Loader className="h-20 w-20 text-[#fbc02d] animate-spin" />
    <h1 className="text-4xl font-bold text-white uppercase italic tracking-tighter">Calibrating Board</h1>
   </div>
  );
 }

 const isMyTurn = gameState?.turn === currentUser?.uid;
 const myPlayerNum = gameState?.player1?.uid === currentUser?.uid ? 1 : gameState?.player2?.uid === currentUser?.uid ? 2 : null;

 return (
  <AppLayout fullScreen>
   <div className="h-screen w-full bg-gradient-to-b from-[#00838f] to-[#004d40] flex flex-col relative overflow-hidden font-sans text-white">
    <CompactRoomView />

    <header className="relative z-50 flex items-center justify-between p-4 pt-32 shrink-0">
      <div className="flex gap-1.5">
       <button className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg"><Move className="h-4 w-4" /></button>
       <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg">
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
       </button>
      </div>
      
      <h1 className="text-xl font-black text-white uppercase tracking-tighter drop-shadow-md">Carrom • Multiplayer</h1>

      <div className="flex gap-1.5">
       <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg"><X className="h-4 w-4" /></button>
      </div>
    </header>

    <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 transition-all duration-1000">
      {/* Wooden Board Structure */}
      <div className="relative w-full max-w-[380px] aspect-square bg-[#f5ba78] rounded-2xl border-[12px] border-[#004d40] shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none" />
       
       <div className="absolute top-0 left-0 w-10 h-10 bg-black rounded-full -translate-x-3 -translate-y-3" />
       <div className="absolute top-0 right-0 w-10 h-10 bg-black rounded-full translate-x-3 -translate-y-3" />
       <div className="absolute bottom-0 left-0 w-10 h-10 bg-black rounded-full -translate-x-3 translate-y-3" />
       <div className="absolute bottom-0 right-0 w-10 h-10 bg-black rounded-full translate-x-3 translate-y-3" />

       {/* Baselines */}
       <div className="absolute bottom-10 left-12 right-12 h-[2px] bg-[#8d6e63]/40" />
       <div className="absolute top-10 left-12 right-12 h-[2px] bg-[#8d6e63]/40" />
       <div className="absolute left-10 top-12 bottom-12 w-[2px] bg-[#8d6e63]/40" />
       <div className="absolute right-10 top-12 bottom-12 w-[2px] bg-[#8d6e63]/40" />

       {/* DYNAMIC PIECES */}
       <div className="relative w-full h-full">
         {gameState?.pieces?.filter(p => !p.isPocketed).map(piece => (
           <div 
             key={piece.id}
             className={cn(
               "absolute w-6 h-6 rounded-full border-2 shadow-2xl transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2",
               piece.type === 'white' ? "bg-white border-gray-300" : piece.type === 'black' ? "bg-[#1a1a1a] border-gray-800" : "bg-red-600 border-red-400"
             )}
             style={{ left: `${piece.position.x}%`, top: `${piece.position.y}%` }}
           />
         ))}

         {/* STRIKER (Multiplayer Synced) */}
         <div 
           className={cn(
             "absolute h-10 w-10 bg-gradient-to-br from-white to-gray-300 rounded-full border-2 border-gray-400 shadow-2xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75",
             isMyTurn && "ring-4 ring-[#00E5FF] animate-reaction-pulse"
           )}
           style={{ 
             left: `${gameState?.strikerPos || 50}%`, 
             top: myPlayerNum === 1 ? '85%' : '15%' // P1 at bottom, P2 at top
           }}
         />
       </div>
      </div>

      {/* MATCHMAKING / CONTROLS */}
      <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-[300px]">
        {!gameState && (
          <button 
           onClick={() => joinArena(userProfile)}
           className="bg-[#fbc02d] text-black px-12 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm"
          >
           Enter Arena
          </button>
        )}

        {gameState?.status === 'lobby' && !myPlayerNum && (
          <button onClick={() => joinArena(userProfile)} className="bg-[#fbc02d] text-black px-12 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm">Join Match</button>
        )}

        {gameState && isMyTurn && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
             <div className="bg-[#a67c52] rounded-full p-1 border-4 border-[#8d6e63] shadow-inner">
               <Slider 
                 value={[gameState.strikerPos || 50]} 
                 onValueChange={(v) => updateStriker(v[0])} 
                 max={88}
                 min={12}
                 step={1}
               />
             </div>
             <button 
               onClick={strike}
               className="w-full bg-white text-[#004d40] py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all border-b-4 border-gray-200"
             >
               <Play className="h-4 w-4 fill-current" /> Strike
             </button>
          </div>
        )}

        {gameState && !isMyTurn && (
          <div className="flex flex-col items-center gap-4 py-8 bg-black/20 rounded-[2rem] px-8 w-full border border-white/5">
             <Loader className="h-6 w-6 text-yellow-400 animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Waiting for Opponent</p>
          </div>
        )}
      </div>
    </main>

    <footer className="p-6 pb-12 flex items-center justify-between shrink-0">
      <div className="flex gap-4">
        <div className={cn("text-center", gameState?.turn === gameState?.player1?.uid && "scale-110")}>
          <div className={cn("p-1 rounded-full border-2 transition-all", gameState?.turn === gameState?.player1?.uid ? "border-yellow-400 shadow-[0_0_15px_#fbbf24]" : "border-white/10")}>
            <Avatar className="h-12 w-12 border-2 border-white/20"><AvatarImage src={gameState?.player1?.avatarUrl || ''} /></Avatar>
          </div>
          <span className="text-[9px] font-black uppercase mt-1 block">{gameState?.player1?.username || 'Waiting...'}</span>
        </div>
        <div className={cn("text-center", gameState?.turn === gameState?.player2?.uid && "scale-110")}>
          <div className={cn("p-1 rounded-full border-2 transition-all", gameState?.turn === gameState?.player2?.uid ? "border-yellow-400 shadow-[0_0_15px_#fbbf24]" : "border-white/10")}>
            <Avatar className="h-12 w-12 border-2 border-white/20"><AvatarImage src={gameState?.player2?.avatarUrl || ''} /></Avatar>
          </div>
          <span className="text-[9px] font-black uppercase mt-1 block">{gameState?.player2?.username || 'Waiting...'}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Ummy Physics Engine</p>
        <div className="h-1 w-24 bg-white/5 rounded-full mt-2"><div className="h-full bg-yellow-400 w-1/3" /></div>
      </div>
    </footer>
   </div>
  </AppLayout>
 );
}
