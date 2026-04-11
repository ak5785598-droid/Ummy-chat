'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { X, Volume2, VolumeX, HelpCircle, ChevronDown, Trophy } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLudoEngine } from '@/hooks/use-ludo-engine';

// --- UI Components ---

const HomeBox = ({ color, players }: { color: string; players: any[] }) => {
  const bgColors = {
    red: 'bg-[#E31E24]',
    green: 'bg-[#00A651]',
    blue: 'bg-[#2E3192]',
    yellow: 'bg-[#FFF200]'
  };

  return (
    <div className={cn("relative flex items-center justify-center p-4 border-[3px] border-black/20", bgColors[color as keyof typeof bgColors])}>
      <div className="w-full h-full bg-white/90 rounded-2xl grid grid-cols-2 grid-rows-2 p-2 gap-2 shadow-inner">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("rounded-full border-4 border-black/10 shadow-md", bgColors[color as keyof typeof bgColors])} />
        ))}
      </div>
    </div>
  );
};

function LudoGameContent() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const [isMuted, setIsMuted] = useState(false);
  
  // Backend Logic Hook
  const { gameState, rollDice, joinLobby } = useLudoEngine('global_room', user?.uid || null);

  return (
    <div className="h-screen w-full bg-[#001540] flex flex-col items-center relative overflow-hidden">
      
      {/* 1. TOP HEADER (Clear View) */}
      <header className="w-full p-4 flex items-center justify-between z-50">
        <div className="flex gap-3">
          <button className="text-white/80 bg-white/10 p-2 rounded-full"><HelpCircle size={20}/></button>
          <button onClick={() => setIsMuted(!isMuted)} className="text-white/80 bg-white/10 p-2 rounded-full">
            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
          </button>
        </div>
        <h1 className="text-white font-black text-2xl tracking-widest drop-shadow-lg">Ludo • Classic</h1>
        <div className="flex gap-3">
          <button className="text-white/80 bg-white/10 p-2 rounded-full"><ChevronDown size={20}/></button>
          <button onClick={() => router.back()} className="text-white/80 bg-white/10 p-2 rounded-full"><X size={20}/></button>
        </div>
      </header>

      {/* 2. CLASSIC LUDO BOARD (Image 1 Style) */}
      <div className="mt-4 relative w-[92vw] max-w-[400px] aspect-square bg-[#004A26] p-2 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#00331a]">
        <div className="w-full h-full grid grid-cols-15 grid-rows-15 bg-white border-2 border-black overflow-hidden">
          
          {/* Green Home (Top Left in Image 1 logic) */}
          <div className="col-span-6 row-span-6 border-b-2 border-r-2 border-black"><HomeBox color="red" players={[]} /></div>
          
          {/* Top Path */}
          <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-b-2 border-black">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className={cn("border-[0.5px] border-black/20", i === 1 ? "bg-green-500" : [4,7,10,13,16].includes(i) ? "bg-green-400" : "")} />
            ))}
          </div>

          {/* Green Home */}
          <div className="col-span-6 row-span-6 border-b-2 border-l-2 border-black"><HomeBox color="green" players={[]} /></div>

          {/* Left Path */}
          <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-r-2 border-black">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className={cn("border-[0.5px] border-black/20", i === 13 ? "bg-red-500" : [7,8,9,10,11].includes(i) ? "bg-red-400" : "")} />
            ))}
          </div>

          {/* Center */}
          <div className="col-span-3 row-span-3 bg-white flex items-center justify-center border-2 border-black relative">
            <div className="absolute inset-0 bg-yellow-400 rotate-45 scale-75 border-2 border-black shadow-lg flex items-center justify-center">
               <span className="font-black text-black -rotate-45 text-xs">HOME</span>
            </div>
          </div>

          {/* Right Path */}
          <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-l-2 border-black">
             {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className={cn("border-[0.5px] border-black/20", i === 4 ? "bg-yellow-500" : [6,7,8,9,10].includes(i) ? "bg-yellow-300" : "")} />
            ))}
          </div>

          {/* Blue Home */}
          <div className="col-span-6 row-span-6 border-t-2 border-r-2 border-black"><HomeBox color="blue" players={[]} /></div>

          {/* Bottom Path */}
          <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-t-2 border-black">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className={cn("border-[0.5px] border-black/20", i === 16 ? "bg-blue-600" : [1,4,7,10,13].includes(i) ? "bg-blue-400" : "")} />
            ))}
          </div>

          {/* Yellow Home */}
          <div className="col-span-6 row-span-6 border-t-2 border-l-2 border-black"><HomeBox color="yellow" players={[]} /></div>
        </div>
      </div>

      {/* 3. BOTTOM SHEET (50vh) */}
      <div className="absolute bottom-0 left-0 right-0 h-[45vh] bg-[#001a4d] rounded-t-[40px] border-t-4 border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center p-6 z-50">
        
        {/* User Profiles Logic: Room users will show here */}
        <div className="w-full flex justify-between items-center mb-8 px-4">
          <div className="flex flex-col items-center gap-2">
            <div className="ring-4 ring-yellow-400 rounded-full p-1">
              <Avatar className="h-16 w-16 border-2 border-white">
                <AvatarImage src={userProfile?.avatarUrl} />
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-white font-bold text-sm uppercase">{userProfile?.name || 'Golu'}</span>
          </div>

          <div className="flex flex-col items-center gap-2 grayscale opacity-50">
            <div className="ring-2 ring-white/20 rounded-full p-1">
              <Avatar className="h-16 w-16">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-white/40 font-bold text-sm uppercase">Waiting...</span>
          </div>
        </div>

        {/* Dice/Play Button */}
        <div className="relative group">
          <button 
            onClick={gameState ? rollDice : () => joinLobby(userProfile)}
            className="h-32 w-32 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-3xl shadow-[0_12px_0_#8b6508] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center border-4 border-white/20"
          >
            {gameState ? (
               <span className="text-6xl font-black text-black drop-shadow-sm">{gameState.dice || '🎲'}</span>
            ) : (
               <span className="text-2xl font-black text-black italic">PLAY</span>
            )}
          </button>
        </div>

        <div className="mt-8">
           <p className="text-white/60 font-medium text-xs tracking-widest uppercase">Classic Ludo v1.0.34</p>
        </div>
      </div>
    </div>
  );
}

export default function LudoGamePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#001540]" />}>
      <LudoGameContent />
    </Suspense>
  );
}
