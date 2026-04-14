'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Volume2, VolumeX, Star, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- UI COMPONENTS ---

// Modern Pin-Style Token (Matched to the image's white marker style)
const GamePiece = ({ color }: { color: string }) => (
  <div className="relative flex flex-col items-center justify-center drop-shadow-md transition-transform hover:scale-110 cursor-pointer z-10">
    {/* White outer circle */}
    <div className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] bg-white rounded-full flex items-center justify-center shadow-sm relative z-10 border border-gray-100">
      {/* Colored inner dot */}
      <div className={cn(
        "w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full shadow-inner",
        color === 'red' && "bg-[#FF4B4B]",
        color === 'green' && "bg-[#00E676]",
        color === 'blue' && "bg-[#2979FF]",
        color === 'yellow' && "bg-[#FFD500]"
      )} />
    </div>
    {/* Pointer triangle */}
    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] md:border-l-[8px] md:border-r-[8px] md:border-t-[10px] border-l-transparent border-r-transparent border-t-white absolute -bottom-[6px] md:-bottom-[8px]" />
  </div>
);

// Home Base Socket (Solid colored circles matching the image)
const HomeSocket = ({ color, children }: { color: string, children?: React.ReactNode }) => (
  <div className={cn(
    "w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
    color === 'red' ? "bg-[#FF4B4B] border-[2px] border-[#b71c1c]" :
    color === 'green' ? "bg-[#00E676] border-[2px] border-[#1b5e20]" :
    color === 'blue' ? "bg-[#2979FF] border-[2px] border-[#0d47a1]" :
    "bg-[#FFD500] border-[2px] border-[#f57f17]"
  )}>
    {children}
  </div>
);

// --- MAIN GAME COMPONENT ---

export default function LudoGame() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [turn, setTurn] = useState<'red' | 'green' | 'yellow' | 'blue'>('red');
  const [diceValue, setDiceValue] = useState<number>(6);
  const [isRolling, setIsRolling] = useState(false);
  
  const players = ['red', 'green', 'yellow', 'blue'];

  // Dice Logic
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 8) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        if (finalValue !== 6) {
          setTimeout(() => {
             const currentIndex = players.indexOf(turn);
             setTurn(players[(currentIndex + 1) % 4] as any);
          }, 800);
        }
      }
    }, 60);
  };

  // --- MODERN BOARD RENDER LOGIC ---
  const renderLeftPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 1) { bg = "bg-[#FF4B4B]"; content = <ArrowRight className="h-4 w-4 text-white" />; } 
    if ([7, 8, 9, 10, 11].includes(i)) bg = "bg-[#FF4B4B]"; 
    if (i === 14) content = <Star className="h-4 w-4 text-gray-300" />; 
    return <div key={`left-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  const renderTopPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 5) { bg = "bg-[#00E676]"; content = <ArrowDown className="h-4 w-4 text-white" />; } 
    if ([4, 7, 10, 13, 16].includes(i)) bg = "bg-[#00E676]"; 
    if (i === 6) content = <Star className="h-4 w-4 text-gray-300" />; 
    return <div key={`top-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  const renderRightPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 16) { bg = "bg-[#FFD500]"; content = <ArrowLeft className="h-4 w-4 text-white" />; } 
    if ([6, 7, 8, 9, 10].includes(i)) bg = "bg-[#FFD500]"; 
    if (i === 3) content = <Star className="h-4 w-4 text-gray-300" />; 
    
    // Exact mimic of the image: Place one yellow token on the right path
    if (i === 13) {
       content = <GamePiece color="yellow" />;
    }

    return <div key={`right-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  const renderBottomPath = (i: number) => {
    let bg = "bg-white"; let content = null;
    if (i === 12) { bg = "bg-[#2979FF]"; content = <ArrowUp className="h-4 w-4 text-white" />; } 
    if ([1, 4, 7, 10, 13].includes(i)) bg = "bg-[#2979FF]"; 
    if (i === 11) content = <Star className="h-4 w-4 text-gray-300" />; 
    return <div key={`bottom-${i}`} className={cn("border-[0.5px] border-gray-400 flex items-center justify-center relative", bg)}>{content}</div>;
  };

  return (
    // Main Wrapper
    <div className="fixed inset-0 w-full h-screen flex flex-col justify-end bg-black/10 backdrop-blur-[2px]">
      
      {/* Transparent Clickable Top Area */}
      <div className="flex-1 w-full cursor-pointer" onClick={() => router.back()} />

      {/* BOTTOM SHEET CONTAINER */}
      <div className="h-[60vh] max-h-[600px] w-full bg-[#f8f9fa] rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.2)] border-t border-white flex flex-col relative overflow-hidden">
        
        {/* Header Area */}
        <header className="px-6 py-4 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
           <button onClick={() => router.back()} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition"><ChevronLeft size={20}/></button>
           <div className="text-center flex flex-col items-center">
             <h1 className="text-xl font-black text-gray-800 tracking-wide">LUDO PRO</h1>
             <div className={cn("px-4 py-1 rounded-full text-[10px] font-extrabold uppercase mt-1 tracking-wider shadow-sm", 
               turn === 'red' ? "bg-[#FF4B4B] text-white" :
               turn === 'green' ? "bg-[#00E676] text-black" :
               turn === 'blue' ? "bg-[#2979FF] text-white" : "bg-[#FFD500] text-black"
             )}>
               {turn}'s Turn
             </div>
           </div>
           <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition">
             {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
           </button>
        </header>

        {/* Game Area */}
        <main className="flex-1 flex flex-row items-center justify-center gap-6 px-4 pb-6 overflow-hidden">
           
           {/* THE LUDO BOARD */}
           <div className="relative h-full max-h-[40vh] max-w-[40vh] aspect-square bg-white rounded-xl md:rounded-2xl shadow-xl border-[2px] border-gray-300 overflow-hidden">
              <div className="w-full h-full bg-white grid grid-cols-15 grid-rows-15 border-[0.5px] border-gray-400">
                 
                 {/* RED HOME (Top Left) */}
                 {/* The p-[16.66%] matches exactly 1 block of thickness for the colored outer border */}
                 <div className="col-start-1 col-end-7 row-start-1 row-end-7 bg-[#FF4B4B] p-[16.66%] border-r-[0.5px] border-b-[0.5px] border-gray-400">
                   <div className="w-full h-full bg-white flex items-center justify-center">
                      <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-4">
                         {[1,2,3,4].map(i => <HomeSocket key={`red-${i}`} color="red"><GamePiece color="red" /></HomeSocket>)}
                      </div>
                   </div>
                 </div>

                 {/* TOP PATH (Green Side) */}
                 <div className="col-start-7 col-end-10 row-start-1 row-end-7 grid grid-cols-3 grid-rows-6">
                    {Array.from({ length: 18 }).map((_, i) => renderTopPath(i))}
                 </div>

                 {/* GREEN HOME (Top Right) */}
                 <div className="col-start-10 col-end-16 row-start-1 row-end-7 bg-[#00E676] p-[16.66%] border-l-[0.5px] border-b-[0.5px] border-gray-400">
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-4">
                         {[1,2,3,4].map(i => <HomeSocket key={`green-${i}`} color="green"><GamePiece color="green" /></HomeSocket>)}
                      </div>
                    </div>
                 </div>

                 {/* LEFT PATH (Red Side) */}
                 <div className="col-start-1 col-end-7 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3">
                    {Array.from({ length: 18 }).map((_, i) => renderLeftPath(i))}
                 </div>

                 {/* CENTER FINISH (Triangles) */}
                 <div className="col-start-7 col-end-10 row-start-7 row-end-10 relative bg-white border-[0.5px] border-gray-400">
                    <div className="absolute inset-0 border-[0.5px] border-black/10" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)', backgroundColor: '#00E676' }} />
                    <div className="absolute inset-0 border-[0.5px] border-black/10" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)', backgroundColor: '#FFD500' }} />
                    <div className="absolute inset-0 border-[0.5px] border-black/10" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)', backgroundColor: '#2979FF' }} />
                    <div className="absolute inset-0 border-[0.5px] border-black/10" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)', backgroundColor: '#FF4B4B' }} />
                 </div>

                 {/* RIGHT PATH (Yellow Side) */}
                 <div className="col-start-10 col-end-16 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3">
                    {Array.from({ length: 18 }).map((_, i) => renderRightPath(i))}
                 </div>

                 {/* BLUE HOME (Bottom Left) */}
                 <div className="col-start-1 col-end-7 row-start-10 row-end-16 bg-[#2979FF] p-[16.66%] border-r-[0.5px] border-t-[0.5px] border-gray-400">
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-4">
                         {/* Leaving top-right empty to match image */}
                         {[1,2,3,4].map(i => (
                           <HomeSocket key={`blue-${i}`} color="blue">
                             {i !== 2 && <GamePiece color="blue" />}
                           </HomeSocket>
                         ))}
                      </div>
                    </div>
                 </div>

                 {/* BOTTOM PATH (Blue Side) */}
                 <div className="col-start-7 col-end-10 row-start-10 row-end-16 grid grid-cols-3 grid-rows-6">
                    {Array.from({ length: 18 }).map((_, i) => renderBottomPath(i))}
                 </div>

                 {/* YELLOW HOME (Bottom Right) */}
                 <div className="col-start-10 col-end-16 row-start-10 row-end-16 bg-[#FFD500] p-[16.66%] border-l-[0.5px] border-t-[0.5px] border-gray-400">
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-4">
                         {/* Leaving bottom-right empty to match image */}
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

           {/* DICE ROLLER SECTION */}
           <div className="flex flex-col items-center gap-3 w-20">
              <button 
                onClick={rollDice}
                disabled={isRolling}
                className={cn(
                  "h-16 w-16 md:h-20 md:w-20 rounded-2xl shadow-lg flex items-center justify-center border-[3px] transition-all duration-200",
                  turn === 'red' ? "bg-[#FF4B4B] border-red-200" :
                  turn === 'green' ? "bg-[#00E676] border-green-200" :
                  turn === 'blue' ? "bg-[#2979FF] border-blue-200" :
                  "bg-[#FFD500] border-yellow-200",
                  isRolling ? "scale-90 animate-spin" : "hover:scale-105 active:scale-90"
                )}
              >
                 <span className={cn(
                   "text-3xl md:text-4xl font-black drop-shadow-sm",
                   turn === 'yellow' || turn === 'green' ? "text-gray-900" : "text-white"
                 )}>
                   {diceValue}
                 </span>
              </button>
              
              <div className="text-center w-full">
                 <button 
                   onClick={rollDice} 
                   className="w-full bg-gray-800 hover:bg-gray-700 text-white text-[11px] py-2 px-3 rounded-xl font-bold transition-colors shadow-md active:scale-95"
                 >
                   ROLL
                 </button>
              </div>
           </div>

        </main>
      </div>
    </div>
  );
}
