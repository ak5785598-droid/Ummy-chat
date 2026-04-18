'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  Trophy, 
  X,
  Plus,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCarromEngine } from '@/hooks/use-carrom-engine';
import { motion, AnimatePresence } from 'framer-motion';

interface CarromGameContentProps {
  roomId?: string;
  isOverlay?: boolean;
  onClose?: () => void;
}

export function CarromGameContent({ roomId: propsRoomId, isOverlay = false, onClose }: CarromGameContentProps) {
  const router = useRouter();
  const roomId = propsRoomId || 'lobby';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);

  const { 
    gameState, 
    initializeGame, 
    selectMode, 
    joinArena, 
    startMatch,
    updateStriker,
    strike 
  } = useCarromEngine(roomId, currentUser?.uid || null);

  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isStriking, setIsStriking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Auto-join arena if in lobby
  useEffect(() => {
    if (gameState?.status === 'lobby' && userProfile && currentUser) {
      const inArena = gameState.players.some(p => p.uid === currentUser.uid);
      if (!inArena && gameState.players.length < 4) {
        joinArena(userProfile);
      }
    }
  }, [gameState?.status, gameState?.players, userProfile, currentUser, joinArena]);

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  if (!gameState || gameState.status === 'loading') {
    return (
      <div className={cn(
        "w-full bg-[#1A0B2E] flex flex-col items-center justify-center p-8 font-sans overflow-hidden",
        isOverlay ? "h-full min-h-[400px]" : "h-screen"
      )}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-64 h-64 mb-12"
        >
          <img 
            src="/images/games/carrom/loading_logo.png" 
            className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            alt="Carrom Master"
          />
        </motion.div>
        
        <div className="w-full max-w-xs space-y-4">
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_15px_#fbbf24]"
            />
          </div>
          <p className="text-center text-white/40 text-[10px] uppercase font-black tracking-[0.3em] animate-pulse">Syncing Arena...</p>
        </div>
      </div>
    );
  }

  // --- MODE SELECTION ---
  if (gameState.status === 'mode_select') {
    return (
      <div className={cn(
        "w-full bg-[#00897B] flex flex-col items-center justify-center p-8 relative overflow-hidden",
        isOverlay ? "h-full min-h-[400px]" : "h-screen"
      )}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#004D40]/20 to-[#009688]/80 pointer-events-none" />
        
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full max-w-sm bg-[#00695C]/60 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl flex flex-col items-center"
        >
          <h2 className="text-white text-2xl font-black uppercase tracking-tighter mb-12 drop-shadow-lg">Select Mode</h2>
          
          <div className="w-full space-y-4">
            <button 
              onClick={() => selectMode('freestyle')}
              className="w-full bg-[#FFB300] hover:bg-[#FFA000] text-black py-4 rounded-3xl font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all border-b-4 border-yellow-700"
            >
              Freestyle
            </button>
            <button 
              disabled
              className="w-full bg-[#424242]/40 text-white/30 py-4 rounded-3xl font-black uppercase text-sm tracking-widest border border-white/5 flex items-center justify-center gap-2"
            >
              Coming Soon <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- LOBBY ARENA ---
  if (gameState.status === 'lobby') {
    const isAdmin = gameState.players[0]?.uid === currentUser?.uid;
    const canStart = gameState.players.length >= 2;

    return (
      <div className={cn(
        "w-full bg-gradient-to-br from-[#006064] to-[#004D40] flex flex-col items-center p-8 font-sans relative overflow-hidden",
        isOverlay ? "h-full min-h-[400px]" : "h-screen"
      )}>
        <div className="w-full flex justify-between items-center mb-12 relative z-20">
          <button onClick={handleBack} className="p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10"><X className="h-5 w-5 text-white" /></button>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">Carrom Arena</h2>
          <div className="w-9" />
        </div>

        <div className="w-full max-w-sm bg-black/20 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-2xl relative z-10 flex flex-col items-center">
           <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Waiting for players</h3>
           
           <div className="grid grid-cols-4 gap-4 mb-12">
             {Array.from({ length: 4 }).map((_, i) => {
               const p = gameState.players[i];
               return (
                 <div key={i} className="flex flex-col items-center gap-2">
                   {p ? (
                     <div className="relative">
                        <Avatar className="h-16 w-16 border-4 border-yellow-500 shadow-[0_0_20px_#eab308]">
                          <AvatarImage src={p.avatarUrl} />
                          <AvatarFallback className="bg-[#4D2C19] text-white">P</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 left-1/2 -cross-x-1/2 bg-[#00E676] px-1.5 py-0.5 rounded-full text-[6px] font-black text-white">READY</div>
                     </div>
                   ) : (
                     <button 
                      onClick={() => joinArena(userProfile)}
                      className="h-16 w-16 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 hover:bg-white/10 hover:border-white/40 transition-all"
                     >
                       <Plus className="h-6 w-6" />
                     </button>
                   )}
                   <span className="text-[8px] font-bold text-white/50 truncate w-16 text-center uppercase">{p?.username || 'Open'}</span>
                 </div>
               );
             })}
           </div>

           {isAdmin ? (
             <button 
               onClick={startMatch}
               disabled={!canStart}
               className={cn(
                 "w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl transition-all border-b-4",
                 canStart ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-yellow-700 active:scale-95" : "bg-white/5 text-white/10 border-transparent grayscale"
               )}
             >
               Start Match
             </button>
           ) : (
             <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider animate-pulse">Host starting soon...</p>
           )}
        </div>
      </div>
    );
  }

  // --- CORE GAMEPLAY ARENA ---
  const isMyTurn = gameState.turn === currentUser?.uid;

  return (
    <div className={cn(
      "h-full w-full bg-[#004D40] flex flex-col relative overflow-hidden font-sans select-none pb-20",
      !isOverlay && "min-h-screen"
    )}>
      
      {/* Arena Header */}
      <header className="relative z-50 flex items-center justify-between p-4 pt-10 shrink-0 bg-gradient-to-b from-black/20 to-transparent text-white">
        <div className="flex gap-2">
          <button className="bg-white/10 p-2 rounded-full border border-white/10 backdrop-blur-md"><Maximize2 className="h-4 w-4" /></button>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full border border-white/10 backdrop-blur-md">
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
        
        <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" /> Carrom Live
        </h2>

        <div className="flex gap-2">
          <button onClick={handleBack} className="bg-white/10 p-2 rounded-full border border-white/10 backdrop-blur-md"><X className="h-4 w-4" /></button>
        </div>
      </header>

      {/* The Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-[400px] aspect-square rounded-[2rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[14px] border-[#3D2616] p-4 bg-[#F5D4B2]">
           <img 
             src="/images/games/carrom/board_texture.png" 
             className="absolute inset-0 w-full h-full object-cover opacity-90"
             alt="Board"
           />

           <div className="relative w-full h-full z-10 pointer-events-none">
              {gameState.pieces.map(piece => {
                if (piece.isPocketed) return null;
                const isStriker = piece.id === 'striker';
                
                return (
                  <motion.div 
                    key={piece.id}
                    animate={{ left: `${piece.position.x}%`, top: `${piece.position.y}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                    className={cn(
                      "absolute rounded-full shadow-2xl flex items-center justify-center -translate-x-1/2 -translate-y-1/2",
                      isStriker ? "w-[11%] h-[11%] bg-gradient-to-br from-white via-gray-100 to-gray-300 border-2 border-gray-400 z-30" : "w-[7%] h-[7%] border z-20",
                      piece.type === 'white' && "bg-gradient-to-br from-white to-gray-200 border-gray-300",
                      piece.type === 'black' && "bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border-black/40",
                      piece.type === 'queen' && "bg-gradient-to-br from-pink-600 via-rose-500 to-red-600 border-red-300"
                    )}
                  >
                    {isStriker && <div className="h-[60%] w-[60%] rounded-full border border-gray-200/50 flex items-center justify-center"><div className="h-1 w-1 bg-gray-400 rounded-full" /></div>}
                    {!isStriker && <div className="h-4/5 w-4/5 rounded-full border border-black/10" />}
                  </motion.div>
                );
              })}

           {isMyTurn && !isStriking && (
             <div 
               className="absolute bottom-[15%] w-0"
               style={{ 
                 left: `${gameState.strikerPos || 50}%`,
                 transform: `rotate(${angle}deg)`,
                 zIndex: 25
               }}
             >
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-64 bg-gradient-to-t from-white via-white/40 to-transparent border-l-2 border-dashed border-white/20" />
             </div>
           )}
        </div>
        
        {isMyTurn && !isStriking && (
          <div 
            className="absolute inset-x-0 top-1/2 bottom-0 z-40 cursor-crosshair"
            onMouseMove={(e) => {
              if (e.buttons !== 1) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.width * ((gameState.strikerPos || 50) / 100);
              const dx = e.clientX - (rect.left + centerX);
              const dy = e.clientY - (rect.bottom - 40);
              const newAngle = Math.atan2(dx, -dy) * 180 / Math.PI;
              setAngle(Math.max(-45, Math.min(45, newAngle)));
            }}
            onTouchMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.width * ((gameState.strikerPos || 50) / 100);
              const dx = e.touches[0].clientX - (rect.left + centerX);
              const dy = e.touches[0].clientY - (rect.bottom - 40);
              const newAngle = Math.atan2(dx, -dy) * 180 / Math.PI;
              setAngle(Math.max(-45, Math.min(45, newAngle)));
            }}
          />
        )}

        {isMyTurn && !isStriking && (
           <div 
             className="absolute bottom-10 left-[15%] right-[15%] h-12 bg-black/10 rounded-full border border-white/5 z-50 flex items-center px-2"
             onTouchMove={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
               updateStriker(Math.max(10, Math.min(90, x)));
             }}
           >
              <div 
                className="h-8 w-8 bg-white rounded-full shadow-lg border-2 border-yellow-400 absolute transition-all"
                style={{ left: `calc(${gameState.strikerPos || 50}% - 16px)` }}
              />
           </div>
        )}
        </div>
      </div>

      <footer className="p-6 pb-20 mt-4 flex flex-col items-center gap-6 relative z-50">
         {isMyTurn ? (
            <div className="w-full max-w-sm space-y-6">
               <div className="px-4 text-white">
                  <p className="text-[9px] font-black uppercase text-white/40 tracking-widest text-center mb-3">Release to Strike: {power}%</p>
                  <div className="relative h-4 w-full bg-white/5 rounded-full border border-white/10 overflow-hidden">
                     <motion.input 
                       type="range"
                       min="0"
                       max="100"
                       value={power}
                       onChange={(e) => setPower(parseInt(e.target.value))}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     />
                     <motion.div 
                       className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                       style={{ width: `${power}%` }}
                     />
                  </div>
               </div>

               <div className="flex items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-3">
                     {gameState.players.slice(0, 2).map((p, i) => (
                       <div key={i} className={cn("flex flex-col items-center", gameState.turn === p.uid ? "scale-110" : "opacity-40")}>
                         <Avatar className={cn("h-10 w-10 border-2 transition-all", gameState.turn === p.uid ? "border-yellow-400 shadow-[0_0_15px_#fbbf24]" : "border-white/10")}>
                            <AvatarImage src={p.avatarUrl} />
                         </Avatar>
                         <span className="text-[7px] font-bold uppercase mt-1 text-white">{p.username}</span>
                         <span className="text-[10px] font-black text-yellow-400">{p.score}</span>
                       </div>
                     ))}
                  </div>

                  <button 
                    onClick={() => {
                      setIsStriking(true);
                      strike(angle, power / 10);
                      setTimeout(() => { setIsStriking(false); setPower(0); }, 2000);
                    }}
                    className="flex-1 bg-gradient-to-br from-[#00E5FF] to-[#0091EA] py-4 rounded-3xl font-black uppercase tracking-wider text-sm shadow-[0_0_30px_#00e6ff] active:scale-95 transition-all text-black"
                  >
                    STRIKE
                  </button>
               </div>
            </div>
         ) : (
            <div className="flex flex-col items-center gap-4 bg-black/40 backdrop-blur-3xl px-12 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Enemy is Aiming</p>
               <div className="flex items-center gap-4">
                  {gameState.players.map((p, i) => (
                    <div key={i} className={cn("relative", gameState.turn === p.uid && "animate-reaction-pulse")}>
                      <Avatar className={cn("h-12 w-12 border-2", gameState.turn === p.uid ? "border-red-500 shadow-[0_0_15px_#ef4444]" : "border-white/10")}>
                        <AvatarImage src={p.avatarUrl} />
                      </Avatar>
                    </div>
                  ))}
               </div>
            </div>
         )}
      </footer>
    </div>
  );
}
