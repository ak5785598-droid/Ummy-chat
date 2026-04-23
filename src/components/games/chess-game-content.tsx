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
  LogOut 
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
  const [isExitMenuOpen, setIsExitMenuOpen] = useState(false);

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
      style={{ touchAction: 'none' }}
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded-full bg-transparent border border-white/10 hover:bg-white/5 active:scale-90 transition-all text-white",
        className
      )}
    >
      {React.cloneElement(children as React.ReactElement, { className: "h-3.5 w-3.5" })}
    </button>
  );

  if (isLoading) return <div className="h-40 flex items-center justify-center bg-[#061635] text-white text-xs">Loading Arena...</div>;

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false} 
      dragMomentum={false}
      initial={isOverlay ? { y: '5%' } : {}}
      className={cn(
        "h-[55vh] w-full max-w-[500px] mx-auto flex flex-col relative overflow-hidden font-headline rounded-[1.5rem] border border-white/10 shadow-2xl",
        "bg-[#061635] text-white touch-none"
      )}
    >
      {/* Header */}
      <header className="relative z-[60] flex items-center justify-between px-4 py-2 shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BubbleButton onPointerDown={(e: any) => dragControls.start(e)} className="cursor-grab active:cursor-grabbing">
            <Move />
          </BubbleButton>
          <BubbleButton onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX /> : <Volume2 />}
          </BubbleButton>
        </div>
        
        <div className="flex items-center gap-3">
            <BubbleButton onClick={() => console.log('Help Clicked')}>
              <HelpCircle />
            </BubbleButton>
            <BubbleButton onClick={() => setIsExitMenuOpen(!isExitMenuOpen)} className={cn(isExitMenuOpen && "bg-white/10")}>
              <ChevronDown className={cn("transition-transform duration-200", isExitMenuOpen && "rotate-180")} />
            </BubbleButton>
            <BubbleButton onClick={handleExitGame} className="border-red-500/20 hover:bg-red-500/10">
              <X className="text-red-400" />
            </BubbleButton>
        </div>
      </header>

      {/* Sliding Exit Menu */}
      <AnimatePresence>
        {isExitMenuOpen && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-[48px] right-4 z-[55] w-10 py-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-b-xl flex justify-center shadow-lg"
          >
            <button onClick={handleExitGame} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group">
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Players Info Bar (Below Header) */}
      <div className="flex justify-between items-start px-4 pt-4 pb-2 z-10">
         {/* LEFT: Opponent Info */}
         <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
               <Avatar className="h-8 w-8 ring-2 ring-white/5">
                 <AvatarImage src={myColor === 'w' ? gameState?.black?.avatarUrl : gameState?.white?.avatarUrl} />
                 <AvatarFallback><User className="w-4 h-4 opacity-40" /></AvatarFallback>
               </Avatar>
               <div>
                  <p className="text-[10px] font-bold text-white/90 truncate max-w-[80px]">
                    {myColor === 'w' ? (gameState?.black?.username || 'Opponent') : (gameState?.white?.username || 'Opponent')}
                  </p>
                  <p className="text-[8px] font-black uppercase text-blue-400 leading-none">
                    {myColor === 'w' ? 'Black' : 'White'}
                  </p>
               </div>
            </div>
            {gameState?.turn !== myColor && gameState?.status === 'playing' && (
               <span className="text-[7px] font-bold text-green-400 uppercase animate-pulse ml-10">Thinking...</span>
            )}
         </div>

         {/* RIGHT: User Info */}
         <div className="flex flex-col items-end gap-1 text-right">
            <div className="flex items-center flex-row-reverse gap-2">
               <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                 <AvatarImage src={userProfile?.avatarUrl} />
                 <AvatarFallback>{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
               </Avatar>
               <div>
                  <p className="text-[10px] font-bold text-white uppercase italic truncate max-w-[80px]">
                    {userProfile?.username || 'You'}
                  </p>
                  <p className="text-[8px] font-black uppercase text-yellow-500 leading-none">
                    {myColor === 'w' ? 'White' : 'Black'}
                  </p>
               </div>
            </div>
            {isMyTurn && (
               <span className="text-[7px] font-bold text-green-500 uppercase animate-pulse mr-10">Your Turn</span>
            )}
         </div>
      </div>

      {/* Main Game Container */}
      <div className="flex-1 flex flex-col justify-center items-center px-2">
        {/* CENTER: The Chess Board */}
        <div className="relative flex justify-center items-center w-full">
           <div className="relative bg-zinc-900/50 p-1.5 rounded-xl shadow-2xl border-4 border-zinc-950">
              <div className="grid grid-cols-8 grid-rows-8 w-[290px] h-[290px] sm:w-[330px] sm:h-[330px]">
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
                          "relative flex items-center justify-center w-full h-full cursor-pointer",
                          isDark ? "bg-[#769656]" : "bg-[#eeeed2]",
                          isSelected && "bg-yellow-200/60 ring-2 ring-yellow-400 z-10"
                        )}
                      >
                        {(j === 0) && <span className={cn("absolute top-0 left-0.5 text-[5px] font-bold opacity-30", isDark ? "text-white" : "text-black")}>{row}</span>}
                        {(i === 7) && <span className={cn("absolute bottom-0 right-0.5 text-[5px] font-bold opacity-30", isDark ? "text-white" : "text-black")}>{col}</span>}
                        {piece && (
                          <div className="relative w-[85%] h-[85%] transition-transform active:scale-90">
                             <img src={pieceSVG[`${piece.color}${piece.type.toUpperCase()}`]} alt={piece.type} className="w-full h-full drop-shadow-md pointer-events-none" />
                          </div>
                        )}
                      </div>
                    );
                  }))}
              </div>

              <AnimatePresence>
                {gameState?.status === 'checkmate' && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center gap-3 text-center">
                          <Trophy className="w-10 h-10 text-yellow-500 animate-bounce" />
                          <h2 className="text-xl font-black italic tracking-tighter">CHECKMATE!</h2>
                          <button onClick={() => window.location.reload()} className="px-8 py-2 bg-yellow-500 text-black font-black rounded-full text-[10px] uppercase shadow-[0_0_20px_rgba(234,179,8,0.4)]">PLAY AGAIN</button>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* START MATCH Footer */}
      <footer className="p-4 pt-0">
         {(!gameState || gameState.status === 'lobby') && (
            <div className="w-full flex flex-col items-center">
               {(!gameState) ? (
                  <button onClick={() => startMatch(userProfile)} className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black italic uppercase text-[12px] shadow-lg transition-all active:scale-95 border-b-4 border-blue-800">
                    FIND OPPONENT
                  </button>
               ) : (
                  <div className="w-full h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                     <p className="text-blue-300/60 text-[9px] uppercase font-bold tracking-widest animate-pulse">Searching for match...</p>
                  </div>
               )}
            </div>
         )}
      </footer>
    </motion.div>
  );
}
