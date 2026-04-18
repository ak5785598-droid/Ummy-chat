'use client';

import React , { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Move as ChessMove } from 'chess.js';
import { AppLayout } from '@/components/layout/app-layout';
import { cn } from '@/lib/utils';
import { Move, RotateCcw, Trophy, User, Shield, AlertCircle } from 'lucide-react';
import { useChessEngine } from '@/hooks/use-chess-engine';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export function ChessGameContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { gameState, isLoading, startMatch, makeMove } = useChessEngine(roomId, user?.uid || null);

  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

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
          // Move is valid locally, now sync to Firebase
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
          // Invalid move, try selecting the piece on the target square if it's ours
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

  const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">Loading Arena...</div>;

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-64px)] p-4 md:p-8 gap-8 bg-zinc-950 text-white font-headline">
        
        {/* Left Side: Chess Board */}
        <div className="flex flex-col gap-4 items-center">
          {/* Top Player (Opponent) */}
          <div className="w-full flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={myColor === 'w' ? gameState?.black?.avatarUrl : gameState?.white?.avatarUrl} />
                <AvatarFallback><User className="w-5 h-5 opacity-40" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold text-white/90">
                  {myColor === 'w' ? (gameState?.black?.username || 'Waiting...') : (gameState?.white?.username || 'Waiting...')}
                </p>
                <div className="flex items-center gap-1">
                   <div className={cn("w-2 h-2 rounded-full", gameState?.turn !== myColor ? "bg-green-500 animate-pulse" : "bg-zinc-700")} />
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{gameState?.turn !== myColor ? "Thinking..." : "Idle"}</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800 px-3 py-1 rounded text-[10px] font-black text-zinc-400">
               {myColor === 'w' ? 'BLACK' : 'WHITE'}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-10"></div>
            <div className="relative bg-zinc-900 p-1.5 rounded-sm shadow-2xl">
              <div className="grid grid-cols-8 grid-rows-8 w-[340px] h-[340px] md:w-[600px] md:h-[600px] border-4 border-zinc-800">
                {rows.map((row, i) => cols.map((col, j) => {
                  const square = `${col}${row}`;
                  const piece = game.get(square as any);
                  const isDark = (i + j) % 2 === 1;
                  const isSelected = selectedSquare === square;
                  const isLastMove = false; // Add logic if needed

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
                      {/* Label */}
                      {(j === 0) && <span className={cn("absolute top-0.5 left-0.5 text-[8px] font-bold select-none", isDark ? "text-[#eeeed2]" : "text-[#769656]")}>{row}</span>}
                      {(i === 7) && <span className={cn("absolute bottom-0.5 right-0.5 text-[8px] font-bold select-none", isDark ? "text-[#eeeed2]" : "text-[#769656]")}>{col}</span>}

                      {piece && (
                        <div className="relative w-[90%] h-[90%] transition-transform active:scale-90">
                           <img
                            src={pieceSVG[`${piece.color}${piece.type.toUpperCase()}`]}
                            alt={piece.type}
                            className="w-full h-full drop-shadow-lg pointer-events-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                }))}
              </div>
            </div>
            
            {/* End Game Overlay */}
            {gameState?.status === 'checkmate' && (
               <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-center items-center justify-center rounded-lg animate-in fade-in duration-500">
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-yellow-500/50 shadow-2xl flex flex-col items-center gap-4 text-center">
                    <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
                    <h2 className="text-3xl font-black italic tracking-tighter">CHECKMATE!</h2>
                    <p className="text-zinc-400 text-sm">
                      {gameState.winner === user?.uid ? "Bhai, kamaal kar diya! Jeet gaye!" : "Bura hua, haar gaye. Agli baar pakka!"}
                    </p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-8 py-2 bg-yellow-500 text-black font-black rounded-full active:scale-95 transition-transform">PLAY AGAIN</button>
                  </div>
               </div>
            )}
          </div>

          {/* User Account Panel */}
          <div className="w-full flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={userProfile?.avatarUrl} />
                <AvatarFallback>{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-white uppercase italic">{userProfile?.username || 'You'}</p>
                <div className="flex items-center gap-1.5">
                   <div className={cn("w-2 h-2 rounded-full", isMyTurn ? "bg-green-500" : "bg-zinc-700")} />
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{isMyTurn ? "Your Turn" : "Wait"}</p>
                </div>
              </div>
            </div>
            <div className="bg-white text-black px-4 py-1.5 rounded-lg text-[11px] font-black italic tracking-tight">
               {myColor === 'w' ? 'WHITE' : 'BLACK'}
            </div>
          </div>
        </div>

        {/* Right Side: Stats Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <Shield className="text-cyan-500 w-6 h-6" />
              <h2 className="text-xl font-black italic tracking-tighter uppercase italic">Match Details</h2>
            </div>

            <div className="space-y-4">
              {!gameState ? (
                <button 
                  onClick={() => startMatch(userProfile)}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-2xl font-black italic uppercase shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                  START MATCH
                </button>
              ) : gameState.status === 'lobby' ? (
                <div className="flex flex-col items-center gap-4 py-6 border-2 border-dashed border-zinc-800 rounded-2xl">
                   <div className="animate-pulse flex flex-col items-center gap-2">
                     <AlertCircle className="text-yellow-500 w-8 h-8" />
                     <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-center px-4">Waiting for opponent to join...</p>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Status</span>
                    <span className={cn("font-bold", game.isCheck() ? "text-yellow-500 animate-pulse" : "text-zinc-400")}>
                      {game.isCheck() ? "⚠️ CHECK!" : "STEADY"}
                    </span>
                  </div>

                  <div className="mt-6">
                    <p className="text-[10px] font-black text-zinc-500 mb-3 uppercase tracking-widest border-b border-zinc-800 pb-2">Move History</p>
                    <div className="h-64 overflow-y-auto bg-zinc-950/50 rounded-2xl p-4 grid grid-cols-2 gap-2 text-xs font-mono border border-zinc-800/50 no-scrollbar">
                      {(gameState.history || []).map((m: string, idx: number) => (
                        <div key={idx} className="flex gap-2 bg-zinc-900/80 p-2 rounded-lg border border-white/5">
                          <span className="opacity-20 font-bold">{Math.floor(idx/2)+1}</span>
                          <span className="text-zinc-200 font-bold">{m}</span>
                        </div>
                      ))}
                      {(!gameState.history || gameState.history.length === 0) && (
                        <div className="col-span-2 text-center py-10 opacity-20 italic">No battle records yet...</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <button 
                onClick={() => window.location.reload()}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-3 rounded-xl transition-all active:scale-95 text-xs font-black uppercase tracking-widest"
              >
                <RotateCcw size={14} />
                Reset Sync
              </button>
            </div>
          </div>
          
          {/* Legend Table */}
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
             <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center italic">Ummy Chess Protocol v2.4.1</p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
