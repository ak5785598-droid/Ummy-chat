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

  const [isSplashing, setIsSplashing] = useState(true);
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isStriking, setIsStriking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    initializeGame();
    // Splash Timer
    const timer = setTimeout(() => setIsSplashing(false), 4500);
    return () => clearTimeout(timer);
  }, [initializeGame]);

  const isJoined = gameState?.players.some(p => p.uid === currentUser?.uid);
  const isMyTurn = gameState?.turn === currentUser?.uid;

  // --- PREMIUM SPLASH SCREEN (Restored Original Visuals) ---
  if (isSplashing || !gameState) {
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
            onError={(e) => {
               (e.target as any).src = '/images/ummy-logon.png';
            }}
          />
        </motion.div>
        
        <div className="w-full max-w-xs space-y-4">
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_15px_#fbbf24]"
            />
          </div>
          <p className="text-center text-white/40 text-[10px] uppercase font-black tracking-[0.3em] animate-pulse">Syncing Arena...</p>
        </div>
      </div>
    );
  }

  // --- MODE SELECT VIEW ---
  if (gameState.status === 'mode_select') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a1a4a] p-6">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-[400px] bg-black/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/10 shadow-2xl flex flex-col items-center"
        >
          <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
          <h2 className="text-2xl font-black text-white italic tracking-tight mb-2 uppercase">Arena Setup</h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-8">Select Match Difficulty</p>
          
          <div className="grid grid-cols-1 gap-4 w-full">
            <button 
              onClick={() => selectMode('freestyle', 0)}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left flex items-center justify-between"
            >
              <div>
                <span className="text-lg font-black text-white italic">FREESTYLE</span>
                <p className="text-[10px] text-white/40 font-bold uppercase">Beginner Friendly • Free</p>
              </div>
              <Plus className="text-white/20" />
            </button>
            <button 
              onClick={() => selectMode('professional', 100)}
              className="p-6 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 hover:from-yellow-500/30 transition-all text-left flex items-center justify-between"
            >
              <div>
                <span className="text-lg font-black text-yellow-500 italic">PROFESSIONAL</span>
                <p className="text-[10px] text-yellow-500/60 font-bold uppercase">100 Coins Entry • Ranked</p>
              </div>
              <Plus className="text-yellow-500/40" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- PREMIUM LOBBY VIEW ---
  if (gameState.status === 'lobby') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#01091A] overflow-hidden relative p-4">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full max-w-[400px] bg-gradient-to-b from-blue-600 to-indigo-900 rounded-[40px] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.7)] border-4 border-white/10"
        >
          <div className="flex flex-col items-center mb-8">
             <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Carrom Arena</h2>
             <span className="px-3 py-1 bg-black/30 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest mt-2">{gameState.mode} Mode</span>
          </div>

          {/* Player Slots */}
          <div className="grid grid-cols-4 gap-2 mb-10">
            {[0, 1, 2, 3].map(i => {
              const p = gameState.players[i];
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="relative h-14 w-14 rounded-full bg-black/20 border-2 border-white/20 flex items-center justify-center p-0.5 shadow-inner">
                    {p ? (
                      <Avatar className="h-full w-full">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback className="bg-slate-700 text-white text-[10px]">{p.username[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <button 
                        onClick={() => !isJoined && userProfile && joinArena(userProfile)}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <Plus className="h-5 w-5 text-white/40" />
                      </button>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-white/50 uppercase truncate max-w-full">
                    {p?.uid === currentUser?.uid ? 'You' : p?.username || `...`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-6">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] animate-pulse">Waiting for contenders..</p>
            
            {!isJoined ? (
              <button
                onClick={() => userProfile && joinArena(userProfile)}
                className="w-full h-16 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full border-b-8 border-blue-800 shadow-2xl flex items-center justify-center active:translate-y-1 active:border-b-4 transition-all group"
              >
                <span className="text-2xl font-black text-white italic tracking-tighter uppercase group-hover:scale-110 transition-transform">JOIN ARENA</span>
              </button>
            ) : (
              gameState.players.length >= 2 ? (
                <button
                  onClick={startMatch}
                  className="w-full h-16 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full border-b-8 border-orange-700 shadow-2xl flex items-center justify-center active:translate-y-1 active:border-b-4 transition-all"
                >
                  <span className="text-2xl font-black text-black italic tracking-tighter uppercase">START MATCH</span>
                </button>
              ) : (
                <div className="h-16 w-full opacity-50 bg-black/20 rounded-full flex items-center justify-center border-2 border-white/5">
                   <span className="text-sm font-black text-white/30 uppercase tracking-[0.5em]">Waiting</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    );
  }
  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

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
