'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Volume2, VolumeX, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';

type Player = 'red' | 'blue' | 'green' | 'yellow';

const colors: Player[] = ['red', 'blue', 'green', 'yellow'];

function LudoGameContent() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);

  // 2nd program ka state
  const [currentPlayer, setCurrentPlayer] = useState<Player>('red');
  const [dice, setDice] = useState<number>(1);
  const [positions, setPositions] = useState<Record<Player, number[]>>({
    red: [0, 0, 0, 0],
    blue: [0, 0, 0, 0],
    green: [0, 0, 0, 0],
    yellow: [0, 0, 0, 0],
  });

  const rollDice = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setDice(value);
  };

  const moveToken = (player: Player, index: number) => {
    if (player !== currentPlayer) return;

    const newPositions = { ...positions };
    newPositions[player][index] += dice;

    setPositions(newPositions);

    // Turn change logic
    const nextIndex = (colors.indexOf(currentPlayer) + 1) % 4;
    setCurrentPlayer(colors[nextIndex]);
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gray-50 pb-10 min-h-screen">
      
      {/* 1st Program Header */}
      <header className="relative z-40 p-4 pt-10 flex items-center justify-between bg-[#0a1a4a] text-white shadow-md">
         <button onClick={() => router.back()}><ChevronLeft className="h-6 w-6" /></button>
         <h1 className="text-xl font-black italic tracking-tighter">LUDO ARENA</h1>
         <div className="flex gap-2">
            <button onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={() => router.back()}><X className="h-5 w-5" /></button>
         </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
         
         {/* TURN INDICATOR */}
         <div className="mb-6 px-6 py-2 bg-white rounded-full shadow-md text-lg font-bold border border-gray-200">
           Turn: <span className="capitalize" style={{ color: currentPlayer === 'yellow' ? '#ca8a04' : currentPlayer }}>{currentPlayer}</span>
         </div>

         {/* 2nd Program Board UI */}
         <div className="grid grid-cols-3 grid-rows-3 w-[320px] h-[320px] border-4 border-black bg-white shadow-2xl rounded-lg overflow-hidden">
           
           {/* TOP LEFT - BLUE */}
           <div className="bg-blue-500 flex flex-wrap p-2 border-r-2 border-b-2 border-black">
             {positions.blue.map((pos, i) => (
               <div
                 key={i}
                 onClick={() => moveToken('blue', i)}
                 className="w-8 h-8 bg-white m-1 rounded-full flex items-center justify-center cursor-pointer shadow-sm font-bold text-blue-600 hover:scale-110 transition-transform"
               >
                 {pos}
               </div>
             ))}
           </div>

           {/* TOP CENTER */}
           <div className="bg-white border-b-2 border-black"></div>

           {/* TOP RIGHT - RED */}
           <div className="bg-red-500 flex flex-wrap p-2 border-l-2 border-b-2 border-black">
             {positions.red.map((pos, i) => (
               <div
                 key={i}
                 onClick={() => moveToken('red', i)}
                 className="w-8 h-8 bg-white m-1 rounded-full flex items-center justify-center cursor-pointer shadow-sm font-bold text-red-600 hover:scale-110 transition-transform"
               >
                 {pos}
               </div>
             ))}
           </div>

           {/* MIDDLE LEFT */}
           <div className="bg-white border-r-2 border-black"></div>

           {/* CENTER - HOME */}
           <div className="bg-gray-200 flex items-center justify-center font-black text-gray-500 tracking-widest border border-gray-300">
             HOME
           </div>

           {/* MIDDLE RIGHT */}
           <div className="bg-white border-l-2 border-black"></div>

           {/* BOTTOM LEFT - YELLOW */}
           <div className="bg-yellow-400 flex flex-wrap p-2 border-r-2 border-t-2 border-black">
             {positions.yellow.map((pos, i) => (
               <div
                 key={i}
                 onClick={() => moveToken('yellow', i)}
                 className="w-8 h-8 bg-white m-1 rounded-full flex items-center justify-center cursor-pointer shadow-sm font-bold text-yellow-600 hover:scale-110 transition-transform"
               >
                 {pos}
               </div>
             ))}
           </div>

           {/* BOTTOM CENTER */}
           <div className="bg-white border-t-2 border-black"></div>

           {/* BOTTOM RIGHT - GREEN */}
           <div className="bg-green-500 flex flex-wrap p-2 border-l-2 border-t-2 border-black">
             {positions.green.map((pos, i) => (
               <div
                 key={i}
                 onClick={() => moveToken('green', i)}
                 className="w-8 h-8 bg-white m-1 rounded-full flex items-center justify-center cursor-pointer shadow-sm font-bold text-green-600 hover:scale-110 transition-transform"
               >
                 {pos}
               </div>
             ))}
           </div>
         </div>

         {/* CONTROLS (DICE) */}
         <div className="mt-8 flex flex-col items-center gap-4">
           <button
             onClick={rollDice}
             className="px-10 py-3 bg-black hover:bg-gray-800 text-white rounded-full font-black uppercase shadow-[0_5px_0_#333] active:translate-y-1 active:shadow-none transition-all"
           >
             Roll Dice 🎲
           </button>

           <div className="text-2xl font-black bg-white px-6 py-2 rounded-xl shadow-inner border border-gray-200">
             Dice: <span className="text-blue-600">{dice}</span>
           </div>
         </div>

      </main>
    </div>
  );
}

// 1st Program Main Export Setup
export default function LudoGamePage() {
  return (
    <AppLayout fullScreen>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center font-bold text-gray-500 tracking-widest">SYNCING...</div>}>
        <LudoGameContent />
      </Suspense>
    </AppLayout>
  );
}
