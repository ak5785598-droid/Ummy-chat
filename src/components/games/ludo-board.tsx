import { LudoPiece, LudoPlayer } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  red:    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  green:  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]
};

const BASE_OFFSETS = {
  blue:   [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  red:    [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green:  [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  yellow: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]]
};

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
  users: LudoPlayer[];
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

  const getPieceCoords = (piece: LudoPiece): [number, number] => {
    if (piece.position === 0) {
      const colorPieces = pieces.filter(p => p.color === piece.color);
      const index = colorPieces.findIndex(p => p.id === piece.id);
      const [r, c] = BASE_OFFSETS[piece.color][index % 4];
      const origin: [number, number] = piece.color === 'blue' ? [0, 0] : 
                                       piece.color === 'red' ? [0, 9] : 
                                       piece.color === 'yellow' ? [9, 0] : [9, 9];
      return [origin[0] + r, origin[1] + c];
    }
    
    if (piece.position >= 1 && piece.position <= 51) {
      const startIdx = START_INDEX[piece.color];
      const globalIdx = (startIdx + (piece.position - 1)) % 52;
      return GLOBAL_PATH[globalIdx] as [number, number];
    }

    if (piece.position >= 52 && piece.position <= 57) {
      const homeIdx = piece.position - 52;
      return HOME_PATHS[piece.color][homeIdx] as [number, number];
    }

    return [7, 7]; // Finished
  };

  const renderBase = (color: 'blue' | 'red' | 'yellow' | 'green') => {
    const player = users.find(u => u.color === color);
    const isActive = player?.uid === currentPlayerTurn;
    
    const colors = {
      blue: 'from-blue-400 to-blue-600',
      red: 'from-red-400 to-red-600',
      yellow: 'from-yellow-300 to-yellow-500',
      green: 'from-green-400 to-green-600'
    };

    return (
      <div className={cn("absolute inset-0 p-[2%] flex items-center justify-center bg-gradient-to-br", colors[color])}>
        {/* Inner White Base */}
        <div className="w-full h-full bg-white/95 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] p-[12%] flex flex-col items-center justify-between relative overflow-hidden">
           
           {/* Glossy Bevel */}
           <div className="absolute top-0 inset-x-0 h-1 bg-white/40 z-10" />

           {/* AVATAR OVERLAY at the corner of the base house */}
           <div className={cn(
             "absolute z-40 p-0.5 rounded-full border-2 transition-all duration-500",
             isActive ? "scale-125 border-white shadow-[0_0_20px_white] animate-pulse" : "border-black/20 opacity-60",
             color === 'blue' && "top-2 left-2",
             color === 'red' && "top-2 right-2",
             color === 'yellow' && "bottom-2 left-2",
             color === 'green' && "bottom-2 right-2"
           )}>
             <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-black/5 ring-2 ring-black/10">
               <AvatarImage src={player?.avatarUrl} />
               <AvatarFallback className="bg-slate-200 text-slate-500 text-[10px] font-black uppercase">P{users.indexOf(player as any) + 1}</AvatarFallback>
             </Avatar>
             {isActive && (
               <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-lg animate-bounce" />
             )}
             {player && (
               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 z-50">
                 <span className="text-[7px] font-black text-white uppercase tracking-tighter">{player.username.split(' ')[0]}</span>
               </div>
             )}
           </div>

           {/* 4 Holes for pieces to return to */}
           <div className="flex-1 w-full grid grid-cols-2 grid-rows-2 gap-[15%] p-4 pt-10">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={cn("rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] bg-gradient-to-br border-2 border-black/5", colors[color])} />
              ))}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[450px] aspect-square bg-[#ddd] p-1.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl border-4 border-[#3d2616] overflow-hidden">
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
      
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-white gap-0 border-[2px] border-black/80 overflow-hidden relative shadow-inner">
        {cells.map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const type = getCellType(row, col);

          // Handle Base containers
          if (row === 0 && col === 0) return <div key={i} className="col-span-6 row-span-6 relative border-r-2 border-b-2 border-black/80">{renderBase('blue')}</div>;
          if (row === 0 && col === 9) return <div key={i} className="col-span-6 row-span-6 relative border-l-2 border-b-2 border-black/80">{renderBase('red')}</div>;
          if (row === 9 && col === 0) return <div key={i} className="col-span-6 row-span-6 relative border-r-2 border-t-2 border-black/80">{renderBase('yellow')}</div>;
          if (row === 9 && col === 9) return <div key={i} className="col-span-6 row-span-6 relative border-l-2 border-t-2 border-black/80">{renderBase('green')}</div>;

          // Skip cells covered by col-span/row-span
          if (row < 6 && col < 6 && (row !== 0 || col !== 0)) return null;
          if (row < 6 && col > 8 && (row !== 0 || col !== 9)) return null;
          if (row > 8 && col < 6 && (row !== 9 || col !== 0)) return null;
          if (row > 8 && col > 8 && (row !== 9 || col !== 9)) return null;

          // Handle Center/Finish
          if (row === 6 && col === 6) {
             return (
               <div key={i} className="col-span-3 row-span-3 relative border-4 border-black/10 z-30 overflow-hidden bg-white shadow-2xl">
                 {/* Triangles with Gradients */}
                 <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-red-400 to-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                 <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-yellow-300 to-yellow-500" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} />
                 <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-blue-400 to-blue-600" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
                 <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-green-400 to-green-600" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }} />
                 {/* Central Trophy Gloss */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center border-2 border-yellow-400 animate-reaction-float">
                       <Trophy className="w-4 h-4 text-orange-500 drop-shadow-md" />
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
                "relative flex items-center justify-center border-[0.5px] border-black/10",
                type === 'home-blue' && "bg-[#2196F3] shadow-inner",
                type === 'home-red' && "bg-[#F44336] shadow-inner",
                type === 'home-yellow' && "bg-[#FFEB3B] shadow-inner",
                type === 'home-green' && "bg-[#4CAF50] shadow-inner",
                
                type === 'start-blue' && "bg-[#2196F3]",
                type === 'start-red' && "bg-[#F44336]",
                type === 'start-yellow' && "bg-[#FFEB3B]",
                type === 'start-green' && "bg-[#4CAF50]",

                type === 'path' && "bg-white",
                type === 'star' && "bg-slate-100"
              )}
            >
              {type === 'star' && <Star className="w-[75%] h-[75%] text-slate-300 fill-slate-200" />}
              
              {type === 'start-blue' && <ArrowRight className="w-[60%] h-[60%] text-white drop-shadow-md" />}
              {type === 'start-red' && <ArrowDown className="w-[60%] h-[60%] text-white drop-shadow-md" />}
              {type === 'start-green' && <ArrowLeft className="w-[60%] h-[60%] text-white drop-shadow-md" />}
              {type === 'start-yellow' && <ArrowUp className="w-[60%] h-[60%] text-black/40 drop-shadow-md" />}
            </div>
          );
        })}

        {/* --- pieces (GOTI) RENDERING --- */}
        {pieces.map((piece) => {
          const [row, col] = getPieceCoords(piece);
          const isFinished = piece.position >= 57;
          
          if (isFinished) return null;

          const isMyTurn = piece.ownerUid === currentPlayerTurn;

          return (
            <motion.div
              key={piece.id}
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              animate={{ 
                left: `${(col / 15) * 100}%`, 
                top: `${(row / 15) * 100}%`,
              }}
              style={{ x: '-50%', y: '-50%' }}
              className="absolute w-[6.66%] h-[6.66%] flex items-center justify-center z-50 pointer-events-none"
            >
              <button
                onClick={(e) => {
                   e.stopPropagation();
                   onPieceClick?.(piece.id);
                }}
                className={cn(
                  "w-[90%] h-[90%] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.4)] border-[2.5px] border-white/90 pointer-events-auto transform transition-all active:scale-90 relative overflow-hidden",
                  piece.color === 'blue' && "bg-gradient-to-br from-blue-400 to-blue-800",
                  piece.color === 'red' && "bg-gradient-to-br from-red-400 to-red-800",
                  piece.color === 'yellow' && "bg-gradient-to-br from-yellow-300 to-yellow-600",
                  piece.color === 'green' && "bg-gradient-to-br from-green-400 to-green-800",
                  isMyTurn && "animate-reaction-pulse ring-4 ring-white/40 cursor-pointer scale-125 z-[60]"
                )}
              >
                  {/* Inner shine for marble effect */}
                  <div className="absolute top-1 left-1 w-1/3 h-1/3 bg-white/30 rounded-full blur-[1px]" />
                  
                  {/* Center Dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 border border-white/5" />
                  </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes reaction-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-reaction-pulse {
          animation: piece-pulse 1s infinite alternate;
        }
        @keyframes piece-pulse {
          0% { transform: scale(1.15); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          100% { transform: scale(1.25); box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
}
  );
}
