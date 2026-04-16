'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Star, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { LudoPiece } from '@/lib/types';
import { motion } from 'framer-motion';

// --- COORDINATE MAPPING ---

const GLOBAL_PATH = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0]
];

const HOME_PATHS = {
  blue:   [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  red:    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]], // Wait, red home is top (col 7)
  green:  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]
};

const BASE_OFFSETS = {
  blue:   [[1, 1], [1, 4], [4, 1], [4, 4]],
  red:    [[1, 10], [1, 13], [4, 10], [4, 13]],
  green:  [[10, 10], [10, 13], [13, 10], [13, 13]],
  yellow: [[10, 1], [10, 4], [13, 1], [13, 4]]
};

// Start offsets in GLOBAL_PATH for each color
const START_INDEX = {
  blue: 1,      // (6, 1)
  red: 14,      // (1, 8)
  green: 27,    // (8, 13)
  yellow: 40    // (13, 6)
};

interface LudoBoardProps {
  pieces: LudoPiece[];
  currentPlayerTurn?: string;
  onPieceClick?: (pieceId: string) => void;
  users: { uid: string; color: string }[];
}

export function LudoBoard({ pieces, onPieceClick, users, currentPlayerTurn }: LudoBoardProps) {
  const size = 15;
  const cells = Array.from({ length: size * size });

  const getCellType = (row: number, col: number) => {
    if (row < 6 && col < 6) return 'base-blue';
    if (row < 6 && col > 8) return 'base-red';
    if (row > 8 && col < 6) return 'base-yellow';
    if (row > 8 && col > 8) return 'base-green';

    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
       if (row === 7 && col === 7) return 'finish-center';
       return 'finish';
    }

    if (col === 7 && row >= 1 && row <= 5) return 'home-red';
    if (row === 7 && col >= 9 && col <= 13) return 'home-green';
    if (col === 7 && row >= 9 && row <= 13) return 'home-yellow';
    if (row === 7 && col >= 1 && col <= 5) return 'home-blue';

    if (row === 6 && col === 1) return 'safe-blue';
    if (row === 1 && col === 8) return 'safe-red';
    if (row === 8 && col === 13) return 'safe-green';
    if (row === 13 && col === 6) return 'safe-yellow';

    if ((row === 8 && col === 2) || (row === 2 && col === 6) || (row === 6 && col === 12) || (row === 12 && col === 8)) return 'safe-star';

    return 'path-white';
  };

  const getPieceCoords = (piece: LudoPiece) => {
    if (piece.position === 0) {
      // Index within base pieces
      const sameColorPieces = pieces.filter(p => p.color === piece.color);
      const index = sameColorPieces.findIndex(p => p.id === piece.id);
      return BASE_OFFSETS[piece.color][index];
    }
    
    if (piece.position >= 1 && piece.position <= 51) {
      const startIdx = START_INDEX[piece.color];
      const globalIdx = (startIdx + (piece.position - 1)) % 52;
      return GLOBAL_PATH[globalIdx];
    }

    if (piece.position >= 52 && piece.position <= 57) {
      const homeIdx = piece.position - 52;
      return HOME_PATHS[piece.color][homeIdx];
    }

    return [7, 7]; // Finished
  };

  return (
    <div className="relative w-full max-w-[450px] aspect-square bg-[#333] p-1 shadow-2xl rounded-sm">
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-white gap-[1px] border border-black overflow-hidden relative">
        {cells.map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const type = getCellType(row, col);

          return (
            <div
              key={i}
              className={cn(
                "relative flex items-center justify-center border-[0.2px] border-black/5 transition-colors",
                type === 'base-blue' && "bg-[#1E88E5]",
                type === 'base-red' && "bg-[#E53935]",
                type === 'base-yellow' && "bg-[#FDD835]",
                type === 'base-green' && "bg-[#43A047]",
                
                type === 'home-blue' && "bg-[#1E88E5]/50",
                type === 'home-red' && "bg-[#E53935]/50",
                type === 'home-yellow' && "bg-[#FDD835]/50",
                type === 'home-green' && "bg-[#43A047]/50",

                type === 'safe-blue' && "bg-[#1E88E5]/80",
                type === 'safe-red' && "bg-[#E53935]/80",
                type === 'safe-yellow' && "bg-[#FDD835]/80",
                type === 'safe-green' && "bg-[#43A047]/80",

                type === 'path-white' && "bg-gray-50",
                type === 'finish-center' && "bg-white z-20"
              )}
            >
              {type.includes('star') && <Star className="w-[60%] h-[60%] text-gray-400 opacity-30" />}
              
              {type === 'safe-blue' && <ArrowRight className="w-[60%] h-[60%] text-white" />}
              {type === 'safe-red' && <ArrowDown className="w-[60%] h-[60%] text-white" />}
              {type === 'safe-green' && <ArrowLeft className="w-[60%] h-[60%] text-white" />}
              {type === 'safe-yellow' && <ArrowUp className="w-[60%] h-[60%] text-black" />}

              {row === 6 && col === 7 && <div className="absolute inset-0 bg-[#E53935] clip-path-triangle-down" />}
              {row === 8 && col === 7 && <div className="absolute inset-0 bg-[#FDD835] clip-path-triangle-up" />}
              {row === 7 && col === 6 && <div className="absolute inset-0 bg-[#1E88E5] clip-path-triangle-right" />}
              {row === 7 && col === 8 && <div className="absolute inset-0 bg-[#43A047] clip-path-triangle-left" />}
            </div>
          );
        })}

        {/* --- GOTI RENDERING --- */}
        {pieces.map((piece) => {
          const [row, col] = getPieceCoords(piece);
          const isFinished = piece.position >= 57;
          
          if (isFinished) return null;

          return (
            <motion.div
              key={piece.id}
              initial={false}
              animate={{ 
                left: `${(col / 15) * 100}%`, 
                top: `${(row / 15) * 100}%`,
              }}
              className="absolute w-[6.66%] h-[6.66%] flex items-center justify-center z-40"
            >
              <button
                onClick={() => onPieceClick?.(piece.id)}
                className={cn(
                  "w-[75%] h-[75%] rounded-full shadow-lg border-2 border-white/40 transform transition-all active:scale-90",
                  piece.color === 'blue' && "bg-blue-600",
                  piece.color === 'red' && "bg-red-600",
                  piece.color === 'yellow' && "bg-yellow-500",
                  piece.color === 'green' && "bg-green-600",
                  currentPlayerTurn === piece.ownerUid && "animate-reaction-pulse cursor-pointer ring-2 ring-white"
                )}
              >
                  <div className="w-[50%] h-[50%] bg-white/30 rounded-full mx-auto" />
              </button>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .clip-path-triangle-down { clip-path: polygon(0 0, 100% 0, 50% 100%); }
        .clip-path-triangle-up { clip-path: polygon(50% 0, 0 100%, 100% 100%); }
        .clip-path-triangle-right { clip-path: polygon(0 0, 0 100%, 100% 50%); }
        .clip-path-triangle-left { clip-path: polygon(100% 0, 0 50%, 100% 100%); }
      `}</style>
    </div>
  );
}
