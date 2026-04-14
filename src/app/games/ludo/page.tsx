'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Volume2, VolumeX, Star, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- UI COMPONENTS ---

const GamePiece = ({ color }: { color: string }) => (
  <div className="relative flex flex-col items-center justify-center drop-shadow-md transition-transform hover:scale-110 cursor-pointer z-10">
    <div className="w-[16px] h-[16px] md:w-[22px] md:h-[22px] bg-white rounded-full flex items-center justify-center shadow-sm relative z-10 border border-gray-100">
      <div className={cn(
        "w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full shadow-inner",
        color === 'red' && "bg-[#FF4B4B]",
        color === 'green' && "bg-[#00E676]",
        color === 'blue' && "bg-[#2979FF]",
        color === 'yellow' && "bg-[#FFD500]"
      )} />
    </div>
    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] md:border-l-[8px] md:border-r-[8px] md:border-t-[10px] border-l-transparent border-r-transparent border-t-white absolute -bottom-[5px] md:-bottom-[8px]" />
  </div>
);

const HomeSocket = ({ color, children }: { color: string, children?: React.ReactNode }) => (
  <div className={cn(
    "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
    color === 'red' ? "bg-[#FF4B4B] border-[2px] border-[#b71c1c]" :
    color === 'green' ? "bg-[#00E676] border-[2px] border-[#1b5e20]" :
    color === 'blue' ? "bg-[#2979FF] border-[2px] border-[#0d47a1]" :
    "bg-[#FFD500] border-[2px] border-[#f57f17]"
  )}>
    {children}
  </div>
);

// --- NEW PLAYER CARD COMPONENT ---
const PlayerCard = ({ color, isActive, diceValue, isRolling, onRoll }: any) => {
  const colorMap: any = {
    red: "border-[#FF4B4B] bg-[#FF4B4B]/10 text-[#FF4B4B]",
    green: "border-[#00E676] bg-[#00E676]/10 text-[#00E676]",
    blue: "border-[#2979FF] bg-[#2979FF]/10 text-[#2979FF]",
    yellow: "border-[#FFD500] bg-[#FFD500]/10 text-[#FFD500]",
  };

  const btnColorMap: any = {
    red: "bg-[#FF4B4B]",
    green: "bg-[#00E676]",
    blue: "bg-[#2979FF]",
    yellow: "bg-[#FFD500]",
  };

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-xl border-2 transition-all duration-300",
      colorMap[color],
      isActive ? "scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)] ring-2 ring-white/20" : "opacity-60 grayscale-[0.5]"
    )}>
      {/* Profile Square */}
      <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 flex items-center justify-center bg-white/5", colorMap[color])}>
         <User size={30} strokeWidth={2.5} />
      </div>

      {/* Dice Area */}
      <button 
        onClick={onRoll}
        disabled={!isActive || isRolling}
        className={cn(
          "w-12 h-12 md:w-16 md:h-16 rounded-lg shadow-inner flex items-center justify-center transition-transform active:scale-90",
          btnColorMap[color],
          isActive && !isRolling ? "animate-pulse cursor-pointer" : "cursor-default"
        )}
      >
        <span className={cn(
          "text-xl md:text-2xl font-black",
          (color === 'yellow' || color === 'green') ? "text-black" : "text-white"
        )}>
          {isActive ? (isRolling ? "?" : diceValue) : ""}
        </span>
      </button>
    </div>
  );
};

// --- MAIN GAME COMPONENT ---

export default function LudoGame() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [turn, setTurn] = useState<'red' | 'green' | 'yellow' | 'blue'>('yellow');
  const [diceValue, setDiceValue] = useState<number>(3);
  const [isRolling, setIsRolling] = useState(false);
  
  const players = ['red', 'green', 'yellow', 'blue'];

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        if (finalValue !== 6) {
          setTimeout(() => {
             const currentIndex = players.indexOf(turn);
             setTurn(players[(currentIndex + 1) % 4] as any);
          }, 1000);
        }
      }
    }, 50);
  };

  // --- BOARD PATH RENDERING ---
  const renderLeftPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 1) { bg = "bg-[#FF4B4B]"; content = <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-white" />; } 
    if ([7, 8, 9, 10, 11].includes(i)) bg = "bg-[#FF4B4B]"; 
    if (i === 14) content = <Star className="h-3 w-3 md:h-4 md:w-4 text-gray-300" />; 
    return <div key={`left-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  const renderTopPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 5) { bg = "bg-[#00E676]"; content = <ArrowDown className="h-3 w-3 md:h-4 md:w-4 text-white" />; } 
    if ([4, 7, 10, 13, 16].includes(i)) bg = "bg-[#00E676]"; 
    if (i === 6) content = <Star className="h-3 w-3 md:h-4 md:w-4 text-gray-300" />; 
    return <div key={`top-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  const renderRightPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 16) { bg = "bg-[#FFD500]"; content = <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 text-white" />; } 
    if ([6, 7, 8, 9, 10].includes(i)) bg = "bg-[#FFD500]"; 
    if (i === 3) content = <Star className="h-3 w-3 md:h-4 md:w-4 text-gray-300" />; 
    if (i === 13) content = <GamePiece color="yellow" />;
    return <div key={`right-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  const renderBottomPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 12) { bg = "bg-[#2979FF]"; content = <ArrowUp className="h-3 w-3 md:h-4 md:w-4 text-white" />; } 
    if ([1, 4, 7, 10, 13].includes(i)) bg = "bg-[#2979FF]"; 
    if (i === 11) content = <Star className="h-3 w-3 md:h-4 md:w-4 text-gray-300" />; 
    return <div key={`bottom-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  return (
    <div className="fixed inset-0 w-full h-screen bg-[#0a192f] flex flex-col overflow-hidden">
      
      {/* HEADER SECTION */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/10 z-20">
         <button onClick={() => router.back()} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
           <ChevronLeft size={24}/>
         </button>
         
         <div className="flex flex-col items-center">
           <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter">LUDO PRO</h1>
         </div>

         <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
           {isMuted ? <VolumeX size={24}/> : <Volume2 size={24}/>}
         </button>
      </header>

      {/* MAIN GAME SECTION */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
         
         {/* PLAYER CARDS - POSITIONS */}
         <div className="absolute top-4 left-4">
           <PlayerCard color="red" isActive={turn === 'red'} diceValue={diceValue} isRolling={isRolling} onRoll={rollDice} />
         </div>
         <div className="absolute top-4 right-4">
           <PlayerCard color="green" isActive={turn === 'green'} diceValue={diceValue} isRolling={isRolling} onRoll={rollDice} />
         </div>
         <div className="absolute bottom-4 left-4">
           <PlayerCard color="blue" isActive={turn === 'blue'} diceValue={diceValue} isRolling={isRolling} onRoll={rollDice} />
         </div>
         <div className="absolute bottom-4 right-4">
           <PlayerCard color="yellow" isActive={turn === 'yellow'} diceValue={diceValue} isRolling={isRolling} onRoll={rollDice} />
         </div>

         {/* BOARD */}
         <div className="relative w-full max-w-[450px] aspect-square bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[4px] border-white/20 overflow-hidden">
            <div className="w-full h-full grid grid-cols-15 grid-rows-15 border-[0.5px] border-gray-400">
               
               {/* RED HOME */}
               <div className="col-start-1 col-end-7 row-start-1 row-end-7 bg-[#FF4B4B] p-[16.6%] border-r-[0.5px] border-b-[0.5px] border-gray-400">
                 <div className="w-full h-full bg-white flex items-center justify-center rounded-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 md:gap-4">
                       {[1,2,3,4].map(i => <HomeSocket key={`red-${i}`} color="red"><GamePiece color="red" /></HomeSocket>)}
                    </div>
                 </div>
               </div>

               {/* TOP PATH */}
               <div className="col-start-7 col-end-10 row-start-1 row-end-7 grid grid-cols-3 grid-rows-6">
                  {Array.from({ length: 18 }).map((_, i) => renderTopPath(i))}
               </div>

               {/* GREEN HOME */}
               <div className="col-start-10 col-end-16 row-start-1 row-end-7 bg-[#00E676] p-[16.6%] border-l-[0.5px] border-b-[0.5px] border-gray-400">
                  <div className="w-full h-full bg-white flex items-center justify-center rounded-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 md:gap-4">
                       {[1,2,3,4].map(i => <HomeSocket key={`green-${i}`} color="green"><GamePiece color="green" /></HomeSocket>)}
                    </div>
                  </div>
               </div>

               {/* LEFT PATH */}
               <div className="col-start-1 col-end-7 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3">
                  {Array.from({ length: 18 }).map((_, i) => renderLeftPath(i))}
               </div>

               {/* CENTER FINISH */}
               <div className="col-start-7 col-end-10 row-start-7 row-end-10 relative bg-white border-[0.5px] border-gray-400">
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)', backgroundColor: '#00E676' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)', backgroundColor: '#FFD500' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)', backgroundColor: '#2979FF' }} />
                  <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)', backgroundColor: '#FF4B4B' }} />
               </div>

               {/* RIGHT PATH */}
               <div className="col-start-10 col-end-16 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3">
                  {Array.from({ length: 18 }).map((_, i) => renderRightPath(i))}
               </div>

               {/* BLUE HOME */}
               <div className="col-start-1 col-end-7 row-start-10 row-end-16 bg-[#2979FF] p-[16.6%] border-r-[0.5px] border-t-[0.5px] border-gray-400">
                  <div className="w-full h-full bg-white flex items-center justify-center rounded-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 md:gap-4">
                       {[1,2,3,4].map(i => (
                         <HomeSocket key={`blue-${i}`} color="blue">
                           {i !== 2 && <GamePiece color="blue" />}
                         </HomeSocket>
                       ))}
                    </div>
                  </div>
               </div>

               {/* BOTTOM PATH */}
               <div className="col-start-7 col-end-10 row-start-10 row-end-16 grid grid-cols-3 grid-rows-6">
                  {Array.from({ length: 18 }).map((_, i) => renderBottomPath(i))}
               </div>

               {/* YELLOW HOME */}
               <div className="col-start-10 col-end-16 row-start-10 row-end-16 bg-[#FFD500] p-[16.6%] border-l-[0.5px] border-t-[0.5px] border-gray-400">
                  <div className="w-full h-full bg-white flex items-center justify-center rounded-sm">
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 md:gap-4">
                       {[1,2,3,4].map(i => (
                         <HomeSocket key={`yellow-${i}`} color="yellow">
                           {i !== 4 && <GamePiece color="yellow" />}
                         </HomeSocket>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
         </div>

      </main>
    </div>
  );
}
