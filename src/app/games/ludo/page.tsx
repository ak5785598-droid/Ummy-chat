'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  ChevronLeft, X, Volume2, VolumeX, RefreshCw, Star, 
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Loader 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLudoEngine } from '@/hooks/use-ludo-engine';

// --- UI COMPONENTS (2nd Image Style) ---

// Exact Location Pin Token
const GamePiece = ({ color }: { color: string }) => (
  <div className="relative flex flex-col items-center justify-center drop-shadow-md transition-all hover:scale-110">
    {/* Pin Body: 2nd image jaisa drop shape */}
    <div className={cn(
      "h-7 w-7 md:h-9 md:w-9 rounded-full rounded-bl-none -rotate-45 border-2 border-white/80 flex items-center justify-center shadow-lg",
      color === 'red' && "bg-[#FF0000]",
      color === 'green' && "bg-[#00AD5E]",
      color === 'blue' && "bg-[#2196F3]",
      color === 'yellow' && "bg-[#FFD600]"
    )}>
      {/* Inner White Dot */}
      <div className="h-3 w-3 bg-white/90 rounded-full rotate-45" />
    </div>
    {/* Bottom shadow for 3D look */}
    <div className="h-1 w-4 bg-black/20 rounded-full blur-[2px] mt-1" />
  </div>
);

// Home Socket (Jahan token baithta hai)
const HomeSocket = ({ color, children }: { color: string, children?: React.ReactNode }) => (
  <div className={cn(
    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 shadow-inner",
    color === 'red' ? "bg-red-50 border-red-700/30" :
    color === 'green' ? "bg-green-50 border-green-700/30" :
    color === 'blue' ? "bg-blue-50 border-blue-700/30" :
    "bg-yellow-50 border-yellow-600/30"
  )}>
    {children}
  </div>
);

const PlayerAvatar = ({ color, pos, img }: { color: string, pos: string, img?: string }) => (
  <div className={cn("absolute h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center p-1 shadow-xl z-20 border-2 border-white", pos, 
    color === 'red' ? "bg-[#FF0000]" : color === 'green' ? "bg-[#00AD5E]" : color === 'blue' ? "bg-[#2196F3]" : "bg-[#FFD600]"
  )}>
     <Avatar className="h-full w-full rounded-lg bg-white">
       <AvatarImage src={img} />
       <AvatarFallback className="text-[10px] font-bold">P</AvatarFallback>
     </Avatar>
  </div>
);

export function LudoGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || 'global_room';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const [isMuted, setIsMuted] = useState(false);

  const { gameState, isLoading, joinLobby, rollDice } = useLudoEngine(roomId, currentUser?.uid || null);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black/50"><Loader className="animate-spin text-white" /></div>;

  const renderCell = (index: number, type: 'top' | 'left' | 'right' | 'bottom') => {
    let bgColor = "bg-white";
    let icon = null;

    // Path Logic to match Image 2 colors
    if (type === 'left') {
      if (index === 1) icon = <Star className="h-4 w-4 text-gray-300" />;
      if ([7, 8, 9, 10, 11].includes(index)) bgColor = "bg-[#FF0000]";
      if (index === 6) icon = <ArrowRight className="h-4 w-4 text-[#FF0000]" />;
    }
    if (type === 'top') {
      if (index === 13) icon = <Star className="h-4 w-4 text-gray-300" />;
      if ([1, 4, 7, 10, 13].includes(index) && index !== 1) bgColor = "bg-[#00AD5E]";
      if (index === 1) icon = <ArrowDown className="h-4 w-4 text-[#00AD5E]" />;
    }
    if (type === 'right') {
      if (index === 16) icon = <Star className="h-4 w-4 text-gray-300" />;
      if ([6, 7, 8, 9, 10].includes(index)) bgColor = "bg-[#FFD600]";
      if (index === 11) icon = <ArrowLeft className="h-4 w-4 text-[#FFD600]" />;
    }
    if (type === 'bottom') {
      if (index === 4) icon = <Star className="h-4 w-4 text-gray-300" />;
      if ([1, 4, 7, 10, 13, 16].includes(index)) bgColor = "bg-[#2196F3]";
      if (index === 16) icon = <ArrowUp className="h-4 w-4 text-[#2196F3]" />;
    }

    return <div key={index} className={cn("border-[0.5px] border-gray-300 flex items-center justify-center", bgColor)}>{icon}</div>;
  };

  return (
    <div className="fixed inset-0 w-full h-screen flex flex-col justify-end bg-transparent overflow-hidden">
      
      {/* NO BLUR TOP HALF - Ekdum transparent */}
      <div className="flex-1 w-full bg-transparent" onClick={() => router.back()} />

      {/* GAME PANEL */}
      <div className="h-[80vh] w-full bg-[#0a1a4a] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 flex flex-col relative">
        
        <header className="px-6 py-6 flex items-center justify-between shrink-0">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-2.5 rounded-2xl text-white"><ChevronLeft /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2.5 rounded-2xl text-white">{isMuted ? <VolumeX /> : <Volume2 />}</button>
           </div>
           <div className="text-center">
             <h1 className="text-xl font-black text-white italic tracking-tighter">LUDO PRO</h1>
             <p className="text-[10px] text-cyan-400 font-bold uppercase">Multiplayer</p>
           </div>
           <div className="flex gap-2">
              <button className="bg-white/10 p-2.5 rounded-2xl text-white"><RefreshCw /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-2.5 rounded-2xl text-red-400"><X /></button>
           </div>
        </header>

        <main className="flex-1 flex flex-col items-center px-4">
           {/* LUDO BOARD - Updated Styling */}
           <div className="relative w-full max-w-[360px] aspect-square bg-gray-200 rounded-xl p-1.5 shadow-2xl border-4 border-gray-400/50">
              <div 
                className="w-full h-full rounded-md overflow-hidden relative"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}
              >
                 {/* RED HOME */}
                 <div className="col-span-6 row-span-6 bg-[#FF0000] p-4">
                   <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 gap-2 place-items-center shadow-inner border-2 border-red-900/20">
                      {[1,2,3,4].map(i => <HomeSocket key={i} color="red"><GamePiece color="red" /></HomeSocket>)}
                   </div>
                 </div>

                 {/* TOP PATH */}
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'top'))}
                 </div>

                 {/* GREEN HOME */}
                 <div className="col-span-6 row-span-6 bg-[#00AD5E] p-4">
                    <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 gap-2 place-items-center shadow-inner border-2 border-green-900/20">
                      {[1,2,3,4].map(i => <HomeSocket key={i} color="green"><GamePiece color="green" /></HomeSocket>)}
                    </div>
                 </div>

                 {/* LEFT PATH */}
                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'left'))}
                 </div>

                 {/* CENTER TRIANGLES */}
                 <div className="col-span-3 row-span-3 bg-white relative">
                    <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)', backgroundColor: '#00AD5E' }} />
                    <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)', backgroundColor: '#FFD600' }} />
                    <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)', backgroundColor: '#2196F3' }} />
                    <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)', backgroundColor: '#FF0000' }} />
                 </div>

                 {/* RIGHT PATH */}
                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'right'))}
                 </div>

                 {/* BLUE HOME */}
                 <div className="col-span-6 row-span-6 bg-[#2196F3] p-4">
                    <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 gap-2 place-items-center shadow-inner border-2 border-blue-900/20">
                      {[1,2,3,4].map(i => <HomeSocket key={i} color="blue"><GamePiece color="blue" /></HomeSocket>)}
                    </div>
                 </div>

                 {/* BOTTOM PATH */}
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 bg-white">
                    {Array.from({ length: 18 }).map((_, i) => renderCell(i, 'bottom'))}
                 </div>

                 {/* YELLOW HOME */}
                 <div className="col-span-6 row-span-6 bg-[#FFD600] p-4">
                    <div className="w-full h-full bg-white rounded-lg grid grid-cols-2 grid-rows-2 gap-2 place-items-center shadow-inner border-2 border-yellow-800/20">
                      {[1,2,3,4].map(i => <HomeSocket key={i} color="yellow"><GamePiece color="yellow" /></HomeSocket>)}
                    </div>
                 </div>
              </div>

              {/* AVATARS */}
              <PlayerAvatar color="red" pos="-top-4 -left-4" />
              <PlayerAvatar color="green" pos="-top-4 -right-4" />
              <PlayerAvatar color="blue" pos="-bottom-4 -left-4" />
              <PlayerAvatar color="yellow" pos="-bottom-4 -right-4" />
           </div>

           {/* DICE AREA */}
           <div className="mt-12 flex flex-col items-center gap-4">
              <div className={cn(
                "h-24 w-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center border-4 border-cyan-400 transition-all active:scale-95",
                gameState?.turn === currentUser?.uid ? "animate-pulse ring-4 ring-cyan-400/30" : "opacity-80"
              )}>
                 <span className="text-5xl font-black text-[#0a1a4a]">{gameState?.dice || '3'}</span>
              </div>
              <Badge className="bg-cyan-500 text-white px-6 py-1.5 uppercase font-bold tracking-widest">Your Turn</Badge>
           </div>
        </main>
      </div>
    </div>
  );
}

export default function LudoGamePage() {
  return (
    <Suspense fallback={null}>
      <LudoGameContent />
    </Suspense>
  );
}
