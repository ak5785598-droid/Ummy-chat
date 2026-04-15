'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, Star, Plus, User, Trophy, Settings, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useLudoEngine } from '@/hooks/use-ludo-engine'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- COLORS CONFIGURATION ---
const THEME = {
  red: { main: "#B91C1C", light: "#FEE2E2", border: "#7F1D1D", text: "#F87171" },
  green: { main: "#15803D", light: "#DCFCE7", border: "#064E3B", text: "#4ADE80" },
  blue: { main: "#1D4ED8", light: "#DBEAFE", border: "#1E3A8A", text: "#60A5FA" },
  yellow: { main: "#A16207", light: "#FEF9C3", border: "#713F12", text: "#FACC15" },
  board: "#FDFCF0", // Premium Cream/Off-white
};

// --- UI COMPONENTS: GAME PIECE (Goti) ---
const GamePiece = ({ color, onClick, canMove }: { color: keyof typeof THEME, onClick?: () => void, canMove?: boolean }) => (
  <div 
    onClick={onClick}
    className={cn(
      "relative flex items-center justify-center transition-all cursor-pointer z-20",
      canMove && "animate-bounce hover:scale-110"
    )}
  >
    {/* Piece Shadow */}
    <div className="absolute w-6 h-2 bg-black/20 rounded-full blur-sm bottom-0" />
    
    {/* Piece Body */}
    <div className={cn(
      "w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80",
      "bg-gradient-to-b",
      color === 'red' && "from-red-500 to-[#7F1D1D]",
      color === 'green' && "from-green-500 to-[#064E3B]",
      color === 'blue' && "from-blue-500 to-[#1E3A8A]",
      color === 'yellow' && "from-yellow-400 to-[#713F12]"
    )}>
       <div className="w-3 h-3 rounded-full bg-white/30" />
    </div>
  </div>
);

// --- PLAYER CARD COMPONENT ---
const PlayerCard = ({ color, player, isActive, diceValue, isRolling, onRoll, onJoin }: any) => {
  const styles = THEME[color as keyof typeof THEME];

  if (!player) {
    return (
      <button 
        onClick={onJoin}
        className="flex flex-col items-center justify-center w-24 h-24 rounded-3xl border-4 border-dashed border-white/20 bg-black/10 text-white/40 hover:bg-black/30 transition-all hover:border-white/40"
      >
        <Plus size={24} />
        <span className="text-[10px] font-black mt-1">JOIN</span>
      </button>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center p-2 rounded-3xl transition-all duration-300 relative",
      isActive ? "scale-105 z-40" : "opacity-70 grayscale-[0.2]"
    )}>
      {/* Dice Container */}
      <div 
        onClick={isActive && !diceValue ? onRoll : undefined}
        className={cn(
          "mb-2 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-2xl transition-transform",
          isActive ? "cursor-pointer active:scale-90" : "cursor-not-allowed",
          "bg-white border-b-4 border-gray-300 text-slate-800"
        )}
      >
        {isRolling ? "🎲" : (diceValue || "•")}
      </div>

      {/* Profile Info */}
      <div className={cn(
        "flex flex-col items-center w-24 bg-white rounded-2xl p-2 shadow-xl border-t-4",
        color === 'red' && "border-red-600",
        color === 'green' && "border-green-600",
        color === 'blue' && "border-blue-600",
        color === 'yellow' && "border-yellow-600",
      )}>
        <Avatar className="h-10 w-10 border-2 border-gray-100 mb-1">
          <AvatarImage src={player.avatarUrl} />
          <AvatarFallback><User size={16} /></AvatarFallback>
        </Avatar>
        <span className="text-[10px] font-bold text-gray-800 truncate w-full text-center">
          {player.name?.split(' ')[0]}
        </span>
      </div>
      
      {isActive && (
        <div className="absolute -top-1 -right-1">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
           </span>
        </div>
      )}
    </div>
  );
};

// --- MAIN GAME ---
export default function LudoGame() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0F172A] flex items-center justify-center">Loading...</div>}>
      <LudoGameContent />
    </Suspense>
  );
}

function LudoGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || 'LOBBY_1';
  
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  
  const { gameState, rollDice, moveToken, joinLobby, isLoading } = useLudoEngine(roomId, currentUser?.uid);

  const getPlayer = (color: string) => gameState?.players?.find((p: any) => p.color === color);

  if (isLoading) return <div className="h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white"><div className="animate-spin mb-4 text-blue-500"><Settings /></div>LOADING ARENA...</div>;

  return (
    <div className="h-screen w-full bg-[#111827] flex flex-col items-center overflow-hidden font-sans selection:bg-none">
      
      {/* TOP NAV */}
      <header className="w-full p-4 flex justify-between items-center z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <ChevronLeft className="text-white" />
        </button>
        <div className="flex flex-col items-center">
           <h2 className="text-white font-black italic tracking-tighter text-2xl">LUDO ROYALE</h2>
           <div className="bg-blue-600/20 px-3 py-0.5 rounded-full border border-blue-500/30">
              <p className="text-blue-400 text-[10px] font-bold tracking-widest uppercase">Room: {roomId}</p>
           </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-xl">
          <Info className="text-white/50" />
        </button>
      </header>

      {/* GAME ARENA */}
      <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-4">
        
        {/* PLAYERS - LEFT SIDE */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-20">
           <PlayerCard color="red" player={getPlayer('red')} isActive={gameState?.turn === getPlayer('red')?.uid} onRoll={rollDice} onJoin={() => joinLobby('red', userProfile)} />
           <PlayerCard color="blue" player={getPlayer('blue')} isActive={gameState?.turn === getPlayer('blue')?.uid} onRoll={rollDice} onJoin={() => joinLobby('blue', userProfile)} />
        </div>

        {/* PLAYERS - RIGHT SIDE */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-20">
           <PlayerCard color="green" player={getPlayer('green')} isActive={gameState?.turn === getPlayer('green')?.uid} onRoll={rollDice} onJoin={() => joinLobby('green', userProfile)} />
           <PlayerCard color="yellow" player={getPlayer('yellow')} isActive={gameState?.turn === getPlayer('yellow')?.uid} onRoll={rollDice} onJoin={() => joinLobby('yellow', userProfile)} />
        </div>

        {/* THE BOARD */}
        <div className="relative w-full max-w-[450px] aspect-square shadow-[0_0_100px_rgba(0,0,0,0.6)]">
          
          <div className="w-full h-full bg-white grid grid-cols-15 grid-rows-15 p-1 rounded-sm border-[6px] border-slate-900 shadow-inner">
            
            {/* RED HOME (Dark Red) */}
            <div className="col-span-6 row-span-6 bg-red-700 p-6 border-2 border-black/5">
               <div className="w-full h-full bg-white rounded-2xl grid grid-cols-2 p-2 gap-4 shadow-inner">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                       {getPlayer('red')?.tokens[i]?.position === -1 && <GamePiece color="red" />}
                    </div>
                  ))}
               </div>
            </div>

            {/* TOP PATH (Green Pathway) */}
            <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 bg-white">
              {/* Simplify: Just coloring the middle home path */}
              {[...Array(18)].map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-slate-200", i%3===1 && i>0 && "bg-green-100")}></div>
              ))}
            </div>

            {/* GREEN HOME (Dark Green) */}
            <div className="col-span-6 row-span-6 bg-green-800 p-6 border-2 border-black/5">
              <div className="w-full h-full bg-white rounded-2xl grid grid-cols-2 p-2 gap-4 shadow-inner">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                       {getPlayer('green')?.tokens[i]?.position === -1 && <GamePiece color="green" />}
                    </div>
                  ))}
               </div>
            </div>

            {/* LEFT PATH (Red/Blue Pathway) */}
            <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 bg-white">
               {[...Array(18)].map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-slate-200", i >= 7 && i <= 11 && "bg-red-100")}></div>
              ))}
            </div>

            {/* CENTER FINISH SQUARE */}
            <div className="col-span-3 row-span-3 relative bg-white border-2 border-slate-900">
               <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)', backgroundColor: '#15803D' }} />
               <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)', backgroundColor: '#A16207' }} />
               <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)', backgroundColor: '#1D4ED8' }} />
               <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)', backgroundColor: '#B91C1C' }} />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full p-1.5 shadow-2xl border border-gray-200">
                     <Trophy size={16} className="text-yellow-600 fill-yellow-400" />
                  </div>
               </div>
            </div>

            {/* RIGHT PATH (Yellow Pathway) */}
            <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 bg-white">
               {[...Array(18)].map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-slate-200", i >= 6 && i <= 10 && "bg-yellow-100")}></div>
              ))}
            </div>

            {/* BLUE HOME (Dark Blue) */}
            <div className="col-span-6 row-span-6 bg-blue-800 p-6 border-2 border-black/5">
              <div className="w-full h-full bg-white rounded-2xl grid grid-cols-2 p-2 gap-4 shadow-inner">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                       {getPlayer('blue')?.tokens[i]?.position === -1 && <GamePiece color="blue" />}
                    </div>
                  ))}
               </div>
            </div>

            {/* BOTTOM PATH (Blue Pathway) */}
            <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 bg-white">
               {[...Array(18)].map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-slate-200", i%3===1 && i<17 && "bg-blue-100")}></div>
              ))}
            </div>

            {/* YELLOW HOME (Dark Yellow) */}
            <div className="col-span-6 row-span-6 bg-yellow-700 p-6 border-2 border-black/5">
              <div className="w-full h-full bg-white rounded-2xl grid grid-cols-2 p-2 gap-4 shadow-inner">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                       {getPlayer('yellow')?.tokens[i]?.position === -1 && <GamePiece color="yellow" />}
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* ACTION OVERLAY: TURN NOTIFICATION */}
      {gameState?.turn === currentUser?.uid && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
           <div className="bg-white text-slate-900 px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-4 border-green-500 flex items-center gap-4 animate-bounce">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                 <span className="text-green-600 font-black">!</span>
              </div>
              <span className="font-black tracking-tight text-lg">YOUR TURN! ROLL THE DICE</span>
           </div>
        </div>
      )}

      {/* DESIGN DECORATIONS */}
      <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -top-20 -right-20 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
