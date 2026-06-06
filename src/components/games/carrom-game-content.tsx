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
  Move,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCarromEngine } from '@/hooks/use-carrom-engine';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

interface CarromGameContentProps {
  roomId?: string;
  isOverlay?: boolean;
  onClose?: () => void;
}

export function CarromGameContent({ roomId: propsRoomId, isOverlay = false, onClose }: CarromGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
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
  const [power, setPower] = useState(50);
  const [angle, setAngle] = useState(90);
  const [isStriking, setIsStriking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashing(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!gameState) return null;
  const isJoined = gameState.players.some(p => p.uid === currentUser?.uid);

  if (!gameState.mode || gameState.mode === 'none' || gameState.status === 'loading' || gameState.status === 'mode_select') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#01091A] p-6 relative overflow-hidden min-h-[400px]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        
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

  if (gameState.status === 'lobby') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#01091A] overflow-hidden relative p-4 min-h-[400px]">
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
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={isOverlay ? { y: '35%' } : {}}
      className={cn(
        "h-fit max-h-[90vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#004D40] text-white select-none pb-4 rounded-[2.8rem] border border-white/20 shadow-2xl",
        !isOverlay && "min-h-screen"
      )}
    >
      
      {/* Arena Header - Updated to match your image style */}
      <header className="relative z-50 flex items-center justify-between p-3 pt-8 shrink-0 bg-gradient-to-b from-black/40 to-transparent">
        {/* Left Side Icons */}
        <div className="flex items-center gap-1.5">
          <button 
            onPointerDown={(e) => dragControls.start(e)}
            className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-90 cursor-grab"
          >
            <Move className="h-4 w-4 text-white" />
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-90"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
          </button>
          <button 
            onClick={() => initializeGame(true)} 
            className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-90"
          >
            <RotateCcw className="h-4 w-4 text-white" />
          </button>
        </div>
        
        {/* Center Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h2 className="text-base font-black uppercase tracking-tight italic text-white flex items-center gap-2">
              Carrom <span className="opacity-60 text-xs">•</span> Quick
            </h2>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-1.5">
            <button className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-90">
              <HelpCircle className="h-4 w-4 text-white" />
            </button>
            <button className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-90">
              <ChevronDown className="h-4 w-4 text-white" />
            </button>
            <button 
              onClick={handleBack} 
              className="p-2 bg-red-500/20 backdrop-blur-md rounded-full border border-red-500/20 text-white hover:bg-red-500/30 transition-all active:scale-90"
            >
              <X className="h-4 w-4 font-bold" />
            </button>
        </div>
      </header>

      {/* The Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-[400px] aspect-square rounded-[2rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[14px] border-[#3D2616] p-4 bg-[#F5D4B2] carrom-3d-board">
           <img 
             src="/images/games/carrom/board_texture.png" 
             className="absolute inset-0 w-full h-full object-cover opacity-90"
             alt="Board"
           />

           <div className="relative w-full h-full z-10 pointer-events-none">
              {/* Aim Line SVG Overlay */}
              {gameState.turn === currentUser?.uid && gameState.status === 'playing' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                  <defs>
                    <linearGradient id="aimGlow" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const strikerX = gameState.strikerPos ?? 50;
                    const strikerY = 85;
                    const rad = (angle - 90) * Math.PI / 180;
                    const lineLength = power * 0.4;
                    const endX = strikerX + Math.cos(rad) * lineLength;
                    const endY = strikerY + Math.sin(rad) * lineLength;
                    return (
                      <line 
                        x1={`${strikerX}%`} 
                        y1={`${strikerY}%`} 
                        x2={`${endX}%`} 
                        y2={`${endY}%`} 
                        stroke="url(#aimGlow)" 
                        strokeWidth="3.2" 
                        strokeDasharray="5,5" 
                        className="animate-pulse"
                      />
                    );
                  })()}
                </svg>
              )}

              {gameState.pieces.map(piece => {
                if (piece.isPocketed) return null;
                const isStriker = piece.id === 'striker';
                const xPos = isStriker ? (gameState.strikerPos ?? piece.position.x) : piece.position.x;
                const yPos = piece.position.y;
                
                return (
                  <div 
                    key={piece.id}
                    className={cn(
                      "absolute rounded-full border border-black/30 shadow-[0_6px_12px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 relative overflow-hidden group",
                      isStriker ? "h-8 w-8 bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-700 border-2 border-white ring-2 ring-yellow-400/30 z-30" :
                      piece.type === 'queen' ? "h-6 w-6 bg-gradient-to-br from-rose-500 via-red-600 to-red-800 border-2 border-yellow-400 ring-1 ring-red-400/20 z-20" :
                      piece.type === 'white' ? "h-6 w-6 bg-gradient-to-br from-slate-100 via-stone-200 to-stone-300" :
                      "h-6 w-6 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950"
                    )}
                    style={{ 
                      left: `${xPos}%`, 
                      top: `${yPos}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {/* Inner 3D Rim Ring */}
                    <div className="absolute inset-[15%] rounded-full border border-black/10 opacity-60" />
                    
                    {/* Golden Center Pin for Striker and Queen */}
                    {(isStriker || piece.type === 'queen') && (
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-md border border-amber-600 animate-pulse" />
                    )}
                    
                    {/* Wooden coin lines for black & white pieces */}
                    {!isStriker && piece.type !== 'queen' && (
                      <div className="h-1.5 w-1.5 rounded-full bg-transparent border-2 border-black/10" />
                    )}

                    {/* Gloss Layer */}
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none" />
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/20 backdrop-blur-md rounded-t-3xl border-t border-white/5 flex flex-col gap-4 mt-auto">
        <div className="flex items-center justify-between">
           <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Contender's Turn</span>
           <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-white/20">
                <AvatarImage src={gameState.players.find(p => p.uid === gameState.turn)?.avatarUrl} />
                <AvatarFallback className="text-[8px] bg-slate-800">U</AvatarFallback>
              </Avatar>
              <span className="text-sm font-black uppercase italic">{gameState.players.find(p => p.uid === gameState.turn)?.username}</span>
           </div>
        </div>

        <div className="space-y-3">
           {/* Striker Position Slider (Only for Active Player on their Turn) */}
           {gameState.turn === currentUser?.uid && gameState.status === 'playing' && (
             <div className="animate-in slide-in-from-bottom-2 duration-300">
               <div className="flex justify-between text-[8px] font-black uppercase text-white/40 italic mb-1">
                 <span className="text-emerald-400">Position Striker</span>
                 <span className="text-emerald-400">{Math.round(gameState.strikerPos ?? 50)}%</span>
               </div>
               <input
                 type="range"
                 min="22"
                 max="78"
                 value={gameState.strikerPos ?? 50}
                 onChange={(e) => updateStriker(Number(e.target.value))}
                 className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-lg"
               />
             </div>
           )}

           {/* Angle Control */}
           <div>
             <div className="flex justify-between text-[8px] font-black uppercase text-white/40 italic mb-1">
               <span>Aim Angle</span>
               <span>{angle}°</span>
             </div>
             <input
               type="range"
               min="0"
               max="180"
               value={angle}
               onChange={(e) => setAngle(Number(e.target.value))}
               className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:shadow-lg"
             />
           </div>
           {/* Power Control */}
           <div>
             <div className="flex justify-between text-[8px] font-black uppercase text-white/40 italic mb-1">
               <span>Strike Intensity</span>
               <span>{Math.round(power)}%</span>
             </div>
             <input
               type="range"
               min="10"
               max="100"
               value={power}
               onChange={(e) => setPower(Number(e.target.value))}
               className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:shadow-lg"
             />
           </div>
        </div>

        <button 
          onClick={() => strike(angle, power)}
          className="h-16 w-full bg-gradient-to-b from-blue-500 to-blue-700 rounded-2xl border-b-8 border-blue-900 flex items-center justify-center active:scale-95 active:translate-y-1 active:border-b-4 transition-all"
        >
          <span className="text-xl font-black text-white italic uppercase tracking-tighter">STRIKE</span>
        </button>
      </div>

      <style jsx global>{`
        .carrom-3d-board {
          transform: rotateX(8deg);
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .carrom-3d-board:hover {
          transform: rotateX(11deg) rotateY(1deg);
        }
      `}</style>
    </motion.div>
  );
}
