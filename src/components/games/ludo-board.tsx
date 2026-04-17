'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Star, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
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
    // Bases
    if (row < 6 && col < 6) return 'base-blue';
    if (row < 6 && col > 8) return 'base-red';
    if (row > 8 && col < 6) return 'base-yellow';
    if (row > 8 && col > 8) return 'base-green';

    // Center area (Finish)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
       return 'center';
    }

    // Home Stretches
    if (col === 7 && row >= 1 && row <= 5) return 'home-red';
    if (row === 7 && col >= 9 && col <= 13) return 'home-green';
    if (col === 7 && row >= 9 && row <= 13) return 'home-yellow';
    if (row === 7 && col >= 1 && col <= 5) return 'home-blue';

    // Safe Starts
    if (row === 6 && col === 1) return 'start-blue';
    if (row === 1 && col === 8) return 'start-red';
    if (row === 8 && col === 13) return 'start-green';
    if (row === 13 && col === 6) return 'start-yellow';

    // Safe Stars
    const isStar = (row === 8 && col === 2) || (row === 2 && col === 6) || (row === 6 && col === 12) || (row === 12 && col === 8);
    if (isStar) return 'star';

    return 'path';
  };

  const getPieceCoords = (piece: LudoPiece) => {
    if (piece.position === 0) {
      // Index within base pieces to place in the 4 slots
      const colorPieces = pieces.filter(p => p.color === piece.color);
      const index = colorPieces.findIndex(p => p.id === piece.id);
      
      const offsets = BASE_OFFSETS[piece.color];
      // For visual clarity, we use specific offsets within the base for the 4 slots
      const baseCoords = [
        [1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]
      ];
      
      const [r, c] = baseCoords[index % 4];
      const origin = piece.color === 'blue' ? [0, 0] : 
                     piece.color === 'red' ? [0, 9] : 
                     piece.color === 'yellow' ? [9, 0] : [9, 9];
      
      return [origin[0] + r, origin[1] + c];
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

  const renderBase = (color: 'blue' | 'red' | 'yellow' | 'green') => {
    const bgColor = color === 'blue' ? 'bg-[#2196F3]' : color === 'red' ? 'bg-[#F44336]' : color === 'yellow' ? 'bg-[#FFEB3B]' : 'bg-[#4CAF50]';
    return (
      <div className={cn("absolute inset-0 p-[10%] flex items-center justify-center", bgColor)}>
        <div className="w-full h-full bg-white rounded-lg p-[15%] grid grid-cols-2 grid-rows-2 gap-[15%]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={cn("rounded-full border border-black/10 shadow-inner", bgColor)} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[450px] aspect-square bg-[#ddd] p-1.5 shadow-2xl rounded-md border-2 border-black/20">
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-white gap-0 border-[1.5px] border-black overflow-hidden relative shadow-inner">
        {cells.map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const type = getCellType(row, col);

          // Handle Base containers
          if (row === 0 && col === 0) return <div key={i} className="col-span-6 row-span-6 relative border-r-2 border-b-2 border-black">{renderBase('blue')}</div>;
          if (row === 0 && col === 9) return <div key={i} className="col-span-6 row-span-6 relative border-l-2 border-b-2 border-black">{renderBase('red')}</div>;
          if (row === 9 && col === 0) return <div key={i} className="col-span-6 row-span-6 relative border-r-2 border-t-2 border-black">{renderBase('yellow')}</div>;
          if (row === 9 && col === 9) return <div key={i} className="col-span-6 row-span-6 relative border-l-2 border-t-2 border-black">{renderBase('green')}</div>;

          // Skip cells covered by col-span/row-span
          if (row < 6 && col < 6 && (row !== 0 || col !== 0)) return null;
          if (row < 6 && col > 8 && (row !== 0 || col !== 9)) return null;
          if (row > 8 && col < 6 && (row !== 9 || col !== 0)) return null;
          if (row > 8 && col > 8 && (row !== 9 || col !== 9)) return null;

          // Handle Center/Finish
          if (row === 6 && col === 6) {
             return (
               <div key={i} className="col-span-3 row-span-3 relative border-2 border-black z-30 overflow-hidden bg-white">
                 {/* Triangles */}
                 <div className="absolute inset-x-0 top-0 h-1/2 bg-[#F44336]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                 <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#FFEB3B]" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} />
                 <div className="absolute inset-y-0 left-0 w-1/2 bg-[#2196F3]" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
                 <div className="absolute inset-y-0 right-0 w-1/2 bg-[#4CAF50]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }} />
                 {/* Finish text/logo overlay */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white shadow-xl flex items-center justify-center">
                       <Trophy className="w-2.5 h-2.5 text-orange-500" />
                    </div>
                 </div>
               </div>
             );
          }
          if (row >= 6 && row <= 8 && col >= 6 && col <= 8 && (row !== 6 || col !== 6)) return null;

          return (
            <div
              key={i}
              className={cn(
                "relative flex items-center justify-center border-[0.5px] border-black/40",
                type === 'home-blue' && "bg-[#2196F3]",
                type === 'home-red' && "bg-[#F44336]",
                type === 'home-yellow' && "bg-[#FFEB3B]",
                type === 'home-green' && "bg-[#4CAF50]",
                
                type === 'start-blue' && "bg-[#2196F3]",
                type === 'start-red' && "bg-[#F44336]",
                type === 'start-yellow' && "bg-[#FFEB3B]",
                type === 'start-green' && "bg-[#4CAF50]",

                type === 'path' && "bg-white",
                type === 'star' && "bg-gray-100"
              )}
            >
              {type === 'star' && <Star className="w-[70%] h-[70%] text-black/20 fill-black/5" />}
              
              {type === 'start-blue' && <ArrowRight className="w-[60%] h-[60%] text-white drop-shadow-sm" />}
              {type === 'start-red' && <ArrowDown className="w-[60%] h-[60%] text-white drop-shadow-sm" />}
              {type === 'start-green' && <ArrowLeft className="w-[60%] h-[60%] text-white drop-shadow-sm" />}
              {type === 'start-yellow' && <ArrowUp className="w-[60%] h-[60%] text-black/50 drop-shadow-sm" />}
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
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              animate={{ 
                left: `${(col / 15) * 100}%`, 
                top: `${(row / 15) * 100}%`,
              }}
              className="absolute w-[6.66%] h-[6.66%] flex items-center justify-center z-50 pointer-events-none"
            >
              <button
                onClick={(e) => {
                   e.stopPropagation();
                   onPieceClick?.(piece.id);
                }}
                className={cn(
                  "w-[85%] h-[85%] rounded-full shadow-2xl border-2 border-white pointer-events-auto transform transition-all active:scale-95",
                  piece.color === 'blue' && "bg-gradient-to-br from-blue-400 to-blue-800",
                  piece.color === 'red' && "bg-gradient-to-br from-red-400 to-red-800",
                  piece.color === 'yellow' && "bg-gradient-to-br from-yellow-300 to-yellow-600",
                  piece.color === 'green' && "bg-gradient-to-br from-green-400 to-green-800",
                  // Only show ripple if it's the player's piece AND their turn
                  currentPlayerTurn === piece.ownerUid && "animate-pulse ring-4 ring-white/50 cursor-pointer scale-110"
                )}
              >
                  {/* Inner shine */}
                  <div className="w-[40%] h-[40%] bg-white/40 rounded-full mt-[10%] ml-[10%]" />
              </button>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .animate-reaction-pulse {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
}
