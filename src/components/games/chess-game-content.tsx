'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js'; // Chess logic handle karne ke liye
import { AppLayout } from '@/components/layout/app-layout';
import { cn } from '@/lib/utils';
import { Move, RotateCcw, Trophy } from 'lucide-react';

// 3D Pieces URLs (Clean SVGs with shadow logic)
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

export default function ChessGamePage() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // 1. Game Logic: Move handling
  function makeAMove(move: any) {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen())); // State update to trigger re-render
        setMoveHistory([...moveHistory, result.san]);
        return result;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // 2. Square click logic
  function onSquareClick(square: string) {
    if (selectedSquare === null) {
      // Piece select karna
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    } else {
      // Move attempt karna
      const move = makeAMove({
        from: selectedSquare,
        to: square,
        promotion: 'q', // Default promotion to queen
      });

      if (move === null) {
        // Agar invalid move hai, to naya selection check karo
        const piece = game.get(square as any);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      } else {
        setSelectedSquare(null);
      }
    }
  }

  // Board layout helper
  const board = [];
  const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = `${cols[j]}${rows[i]}`;
      const piece = game.get(square as any);
      const isDark = (i + j) % 2 === 1;
      const isSelected = selectedSquare === square;

      board.push(
        <div
          key={square}
          onClick={() => onSquareClick(square)}
          className={cn(
            "relative flex items-center justify-center w-full h-full cursor-pointer transition-colors",
            isDark ? "bg-[#b58863]" : "bg-[#f0d9b5]",
            isSelected && "ring-4 ring-yellow-400 z-10 shadow-lg"
          )}
        >
          {/* Square Label (a1, b2 etc) - Chota sa corner mein */}
          <span className="absolute bottom-0 left-0.5 text-[8px] opacity-30 select-none">
            {square}
          </span>

          {/* 3D Piece Rendering */}
          {piece && (
            <div className="relative w-[85%] h-[85%] transition-transform active:scale-95">
              {/* Piece Shadow (Yahi 3D look dega) */}
              <div className="absolute inset-0 translate-y-1 translate-x-0.5 blur-[2px] opacity-30 scale-95">
                <img 
                  src={pieceSVG[`${piece.color}${piece.type.toUpperCase()}`]} 
                  className="w-full h-full brightness-0" 
                  alt="" 
                />
              </div>
              {/* Actual Piece */}
              <img
                src={pieceSVG[`${piece.color}${piece.type.toUpperCase()}`]}
                alt={piece.type}
                className={cn(
                  "w-full h-full drop-shadow-xl transform transition-transform",
                  "hover:-translate-y-1 active:-translate-y-2", // Khari (Standing) effect
                  piece.color === 'w' ? "filter drop-shadow(0 4px 2px rgba(0,0,0,0.2))" : ""
                )}
                style={{ 
                  filter: `drop-shadow(0px 5px 3px rgba(0,0,0,0.4))`,
                  transform: 'perspective(100px) translateZ(10px)' // Mild 3D perspective
                }}
              />
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100-64px)] p-4 md:p-8 gap-8 bg-zinc-950 text-white">
        
        {/* Left Side: Chess Board (Sheet Layout) */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-zinc-900 p-2 rounded-sm shadow-2xl overflow-hidden">
            {/* Chess Grid */}
            <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] md:w-[560px] md:h-[560px] border-4 border-zinc-800 shadow-inner">
              {board}
            </div>
          </div>
        </div>

        {/* Right Side: Stats & Moves (Static Sheet) */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <Trophy className="text-yellow-500 w-6 h-6" />
              <h2 className="text-xl font-bold tracking-tight">Game Stats</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Turn</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  game.turn() === 'w' ? "bg-white text-black" : "bg-zinc-700 text-white"
                )}>
                  {game.turn() === 'w' ? "White's Move" : "Black's Move"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Status</span>
                <span className="font-mono">
                  {game.isCheck() ? "⚠️ Check!" : "Steady"}
                </span>
              </div>

              {/* Move History */}
              <div className="mt-6">
                <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase">Move History</p>
                <div className="h-48 overflow-y-auto bg-zinc-950 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm font-mono border border-zinc-800">
                  {moveHistory.map((m, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="opacity-30">{Math.floor(idx/2)+1}.</span>
                      <span>{m}</span>
                    </div>
                  ))}
                  {moveHistory.length === 0 && (
                    <span className="col-span-2 text-zinc-600 italic text-xs">No moves yet...</span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => {
                  setGame(new Chess());
                  setMoveHistory([]);
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg transition-all active:scale-95"
              >
                <RotateCcw size={18} />
                Reset Game
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
