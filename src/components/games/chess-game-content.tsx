'use client';

import React , { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Move as ChessMove } from 'chess.js';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Move, 
  RotateCcw, 
  Trophy, 
  User, 
  Shield, 
  AlertCircle,
  X,
  ChevronDown,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useChessEngine } from '@/hooks/use-chess-engine';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const pieceSVG: Record<string, string> = {
  'wP': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  'wR': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  'wN': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  'wB': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  'wQ': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  'wK': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  'bP': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  'bR': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  'bN': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  'bB': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  'bQ': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  'bK': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
};

interface ChessGameContentProps {
  isOverlay?: boolean;
  roomId?: string;
  onClose?: () => void;
}

export function ChessGameContent({ isOverlay, roomId: propsRoomId, onClose }: ChessGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const roomId = propsRoomId || 'lobby';
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { gameState, isLoading, startMatch, makeMove } = useChessEngine(roomId, user?.uid || null);

  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Sync internal game state with Firebase
  useEffect(() => {
    if (gameState?.fen && gameState.fen !== game.fen()) {
      try {
        const newGame = new Chess(gameState.fen);
        setGame(newGame);
      } catch (e) {
        console.error("Invalid FEN sync:", e);
      }
    }
  }, [gameState?.fen]);

  const isMyTurn = useMemo(() => {
    if (!gameState || !user) return false;
    const playerColor = gameState.white?.uid === user.uid ? 'w' : (gameState.black?.uid === user.uid ? 'b' : null);
    return playerColor === gameState.turn && gameState.status === 'playing';
  }, [gameState, user]);

  const myColor = useMemo(() => {
    if (!gameState || !user) return null;
    if (gameState.white?.uid === user.uid) return 'w';
    if (gameState.black?.uid === user.uid) return 'b';
    return null;
  }, [gameState, user]);

  const onSquareClick = (square: string) => {
    if (!isMyTurn || gameState?.status !== 'playing') return;

    if (selectedSquare === null) {
      const piece = game.get(square as any);
      if (piece && piece.color === myColor) {
        setSelectedSquare(square);
      }
    } else {
      try {
        const moveAttempt = {
          from: selectedSquare,
          to: square,
          promotion: 'q',
        };

        const result = game.move(moveAttempt);
        if (result) {
          const newFen = game.fen();
          let status: 'playing' | 'checkmate' | 'draw' = 'playing';
          let winner = null;

          if (game.isCheckmate()) {
            status = 'checkmate';
            winner = user?.uid;
          } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
            status = 'draw';
          }

          makeMove(newFen, result.san, status, winner);
          setSelectedSquare(null);
        } else {
          const piece = game.get(square as any);
          if (piece && piece.color === myColor) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      } catch (e) {
        setSelectedSquare(null);
      }
    }
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  if (isLoading) return <div className="h-40 flex items-center justify-center bg-zinc-950 text-white">Loading Arena...</div>;

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={isOverlay ? { y: '35%' } : {}}
      className={cn(
        "h-fit max-h-[95vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-zinc-950 text-white font-headline pb-4 rounded-[2.8rem] border border-white/10 shadow-2xl transition-all duration-300",
        !isOverlay && "min-h-screen"
      )}
    >
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between p-3 pt-6 shrink-0 bg-zinc-900/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button 
            onPointerDown={(e) => dragControls.start(e)}
            className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-grab active:cursor-grabbing text-white/80"
          >
            <Move className="h-4.5 w-4.5" />
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
            {isMuted ? <VolumeX className="h-4.5 w-4.5 text-white/60" /> : <Volume2 className="h-4.5 w-4.5 text-white/80" />}
          </button>
        </div>
        
        <h2 className="text-sm font-black uppercase tracking-tighter italic flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> Chess Arena
        </h2>

        <div className="flex items-center gap-1">
           <button className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
              <ChevronDown className="h-4.5 w-4.5 text-white/40" />
            </button>
            <button onClick={handleBack} className="p-2 hover:bg-red-500/20 rounded-xl transition-all bg-red-500/10 text-red-500 ml-1 border border-red-500/20 active:scale-90">
              <X className="h-4.5 w-4.5" />
            </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-6">
        
        {/* Opponent Panel */}
        <div className="w-full flex items-center justify-between bg-zinc-900/50 p-3 rounded-2xl border border-white/5">
           <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={myColor === 'w' ? gameState?.black?.avatarUrl : gameState?.white?.avatarUrl} />
                <AvatarFallback><User className="w-5 h-5 opacity-40" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold text-white/9w truncate max-w-[100px]">
                  {myColor === 'w' ? (gameState?.black?.username || 'Waiting...') : (gameState?.white?.username || 'Waiting...')}
                </p>
                <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{myColor === 'w' ? 'Black' : 'White'}</p>
              </div>
           </div>
           <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", gameState?.turn !== myColor ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-500")}>
              {gameState?.turn !== myColor ? "Thinking..." : "Idle"}
           </div>
        </div>

        {/* The Chess Board */}
        <div className="relative w-full aspect-square bg-zinc-900 p-1 rounded-xl shadow-2xl border-4 border-zinc-900">
           <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {rows.map((row, i) => cols.map((col, j) => {
                const square = `${col}${row}`;
                const piece = game.get(square as any);
                const isDark = (i + j) % 2 === 1;
                const isSelected = selectedSquare === square;

                return (
                  <div
                    key={square}
                    onClick={() => onSquareClick(square)}
                    className={cn(
                      "relative flex items-center justify-center w-full h-full cursor-pointer transition-all",
                      isDark ? "bg-[#769656]" : "bg-[#eeeed2]",
                      isSelected && "bg-yellow-200/60 ring-2 ring-yellow-400 z-10"
                    )}
                  >
                    {(j === 0) && <span className={cn("absolute top-0.5 left-0.5 text-[6px] font-bold opacity-30 select-none", isDark ? "text-[#eeeed2]" : "text-[#769656]")}>{row}</span>}
                    {(i === 7) && <span className={cn("absolute bottom-0.5 right-0.5 text-[6px] font-bold opacity-30 select-none", isDark ? "text-[#eeeed2]" : "text-[#769656]")}>{col}</span>}
                    {piece && (
                      <div className="relative w-[90%] h-[90%] transition-transform active:scale-90">
                         <img src={pieceSVG[`${piece.color}${piece.type.toUpperCase()}`]} alt={piece.type} className="w-full h-full drop-shadow-md pointer-events-none" />
                      </div>
                    )}
                  </div>
                );
              }))}
           </div>

           {/* Overlays */}
           <AnimatePresence>
             {gameState?.status === 'checkmate' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                   <div className="bg-zinc-900 p-8 rounded-3xl border border-yellow-500/50 shadow-2xl flex flex-col items-center gap-4 text-center">
                      <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
                      <h2 className="text-2xl font-black italic">CHECKMATE!</h2>
                      <p className="text-zinc-400 text-xs">{gameState.winner === user?.uid ? "You Are Victorious!" : "Defeat. Try Again!"}</p>
                      <button onClick={() => window.location.reload()} className="mt-4 px-8 py-2 bg-yellow-500 text-black font-black rounded-full text-xs">REMATCH</button>
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* My Account Panel */}
        <div className="w-full flex items-center justify-between bg-zinc-900 p-3 rounded-2xl border border-white/10 shadow-lg">
           <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={userProfile?.avatarUrl} />
                <AvatarFallback>{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold text-white uppercase italic truncate max-w-[100px]">{userProfile?.username || 'You'}</p>
                <div className="flex items-center gap-1.5">
                   <div className={cn("w-1.5 h-1.5 rounded-full", isMyTurn ? "bg-green-500" : "bg-zinc-700")} />
                   <p className="text-[8px] text-zinc-500 font-bold uppercase">{isMyTurn ? "Your Turn" : "Wait"}</p>
                </div>
              </div>
           </div>
           <div className="bg-white text-black px-4 py-1.5 rounded-xl text-[9px] font-black italic uppercase">
              {myColor === 'w' ? 'White' : 'Black'}
           </div>
        </div>

        {/* Controls / Match Info */}
        <div className="space-y-4">
           {!gameState || gameState.status === 'lobby' ? (
             <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 flex flex-col items-center gap-4">
                <Shield className="text-blue-500 w-8 h-8 opacity-40" />
                {(!gameState) ? (
                   <button onClick={() => startMatch(userProfile)} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black italic uppercase text-sm shadow-lg">START MATCH</button>
                ) : (
                   <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-center animate-pulse">Waiting for opponent...</p>
                )}
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                   <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status</span>
                   <span className={cn("text-xs font-black", game.isCheck() ? "text-yellow-500 animate-pulse" : "text-white/60")}>
                      {game.isCheck() ? "⚠️ CHECK!" : "STEADY"}
                   </span>
                </div>
                <button onClick={() => window.location.reload()} className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex flex-col items-center hover:bg-zinc-800 transition-colors">
                   <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Action</span>
                   <div className="flex items-center gap-2 text-white/60 text-xs font-black uppercase">
                      <RotateCcw size={12} /> Sync
                   </div>
                </button>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
