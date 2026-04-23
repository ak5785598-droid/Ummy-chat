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
  X,
  ChevronDown,
  Volume2,
  VolumeX,
  HelpCircle,
  LogOut // Exit Door Icon
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
  const [isExitMenuOpen, setIsExitMenuOpen] = useState(false); // Menu control state

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

  // Common Exit Logic
  const handleExitGame = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const BubbleButton = ({ children, onClick, onPointerDown, className }: any) => (
    <button 
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={cn(
        "w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-b from-white/20 to-transparent border border-white/30 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.3)] backdrop-blur-sm active:scale-95 transition-all text-white",
        className
      )}
    >
      {React.cloneElement(children as React.ReactElement, { className: "h-3 w-3" })}
    </button>
  );

  if (isLoading) return <div className="h-40 flex items-center justify-center bg-[#061635] text-white text-xs">Loading Arena...</div>;

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.1}
      initial={isOverlay ? { y: '10%' } : {}}
      className={cn(
        "max-h-[50vh] h-[50vh] w-full max-w-[320px] mx-auto flex flex-col relative overflow-hidden font-headline rounded-[1.2rem] border border-white/10 shadow-2xl transition-all duration-300",
        "bg-gradient-to-b from-[#0a2357] to-[#061635] text-white"
      )}
    >
      {/* Header */}
      <header className="relative z-[60] flex items-center justify-between px-2 py-1 shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-1">
          <BubbleButton onPointerDown={(e: any) => dragControls.start(e)} className="cursor-grab active:cursor-grabbing">
            <Move />
          </BubbleButton>
          <BubbleButton onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX /> : <Volume2 />}
          </BubbleButton>
        </div>
        
        <div className="flex items-center gap-1">
            {/* Down Arrow Button */}
            <BubbleButton onClick={() => setIsExitMenuOpen(!isExitMenuOpen)} className={cn(isExitMenuOpen && "bg-white/20")}>
              <ChevronDown className={cn("transition-transform duration-200", isExitMenuOpen && "rotate-180")} />
            </BubbleButton>
            
            {/* Cross Button - Ab isme Exit logic add kar di hai */}
            <BubbleButton onClick={handleExitGame} className="bg-red-500/20 border-red-500/40">
              <X className="text-red-100" />
            </BubbleButton>
        </div>
      </header>

      {/* Exit Door Strip (Sliding Menu) */}
      <AnimatePresence>
        {isExitMenuOpen && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-[33px] right-2 z-[55] w-10 py-2 bg-white/10 backdrop-blur-xl border-x border-b border-white/20 rounded-b-xl flex justify-center shadow-lg"
          >
            <button 
              onClick={handleExitGame}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group"
              title="Exit Game"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-1.5">
        
        {/* Opponent Panel */}
        <div className="w-full flex items-center justify-between bg-white/5 backdrop-blur-sm p-1.5 rounded-lg border border-white/10">
           <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6 border border-white/10">
                <AvatarImage src={myColor === 'w' ? gameState?.black?.avatarUrl : gameState?.white?.avatarUrl} />
                <AvatarFallback><User className="w-3 h-3 opacity-40" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[9px] font-bold text-white/90 truncate max-w-[70px]">
                  {myColor === 'w' ? (gameState?.black?.username || 'Waiting...') : (gameState?.white?.username || 'Waiting...')}
                </p>
                <p className="text-[6px] font-black uppercase text-blue-300/60 leading-none">{myColor === 'w' ? 'Black' : 'White'}</p>
              </div>
           </div>
           <div className={cn("px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest", gameState?.turn !== myColor ? "bg-green-500/20 text-green-400" : "bg-white/5 text-zinc-400")}>
              {gameState?.turn !== myColor ? "Thinking..." : "Idle"}
           </div>
        </div>

        {/* The Chess Board */}
        <div className="relative mx-auto w-fit h-fit bg-zinc-900/50 p-0.5 rounded-md shadow-xl border-2 border-zinc-900/80">
           <div className="grid grid-cols-8 grid-rows-8 w-[210px] h-[210px]">
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
                      isSelected && "bg-yellow-200/60 ring-1 ring-yellow-400 z-10"
                    )}
                  >
                    {(j === 0) && <span className={cn("absolute top-0 left-0.5 text-[4px] font-bold opacity-30 select-none", isDark ? "text-[#eeeed2]" : "text-[#769656]")}>{row}</span>}
                    {(i === 7) && <span className={cn("absolute bottom-0 right-0.5 text-[4px] font-bold opacity-30 select-none", isDark ? "text-[#eeeed2]" : "text-[#769656]")}>{col}</span>}
                    {piece && (
                      <div className="relative w-[80%] h-[80%] transition-transform active:scale-90">
                         <img src={pieceSVG[`${piece.color}${piece.type.toUpperCase()}`]} alt={piece.type} className="w-full h-full drop-shadow-sm pointer-events-none" />
                      </div>
                    )}
                  </div>
                );
              }))}
           </div>

           {/* Overlays */}
           <AnimatePresence>
             {gameState?.status === 'checkmate' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-md">
                   <div className="bg-zinc-900 p-3 rounded-xl border border-yellow-500/50 flex flex-col items-center gap-1 text-center">
                      <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
                      <h2 className="text-sm font-black italic">CHECKMATE!</h2>
                      <button onClick={() => window.location.reload()} className="mt-1 px-4 py-1 bg-yellow-500 text-black font-black rounded-full text-[8px]">REMATCH</button>
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* My Account Panel */}
        <div className="w-full flex items-center justify-between bg-white/5 backdrop-blur-sm p-1.5 rounded-lg border border-white/10">
           <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6 border border-primary/20">
                <AvatarImage src={userProfile?.avatarUrl} />
                <AvatarFallback>{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[9px] font-bold text-white uppercase italic truncate max-w-[70px]">{userProfile?.username || 'You'}</p>
                <div className="flex items-center gap-1">
                   <div className={cn("w-1 h-1 rounded-full", isMyTurn ? "bg-green-500" : "bg-zinc-700")} />
                   <p className="text-[6px] text-zinc-400 font-bold uppercase">{isMyTurn ? "Your Turn" : "Wait"}</p>
                </div>
              </div>
           </div>
           <div className="bg-white text-black px-2 py-0.5 rounded-md text-[7px] font-black italic uppercase">
              {myColor === 'w' ? 'White' : 'Black'}
           </div>
        </div>

        {/* Controls */}
        <div className="mt-auto">
           {(!gameState || gameState.status === 'lobby') && (
             <div className="bg-white/5 rounded-lg p-1.5 border border-white/10 flex flex-col items-center gap-1">
                {(!gameState) ? (
                   <button onClick={() => startMatch(userProfile)} className="w-full h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black italic uppercase text-[9px] shadow-lg transition-colors">START MATCH</button>
                ) : (
                   <p className="text-blue-200/50 text-[7px] uppercase font-bold tracking-widest text-center animate-pulse">Searching...</p>
                )}
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
