'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  ChevronLeft, 
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Trophy,
  Loader,
  Plus,
  Settings,
  Share2,
  Power
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';
import { useLudoEngine } from '@/hooks/use-ludo-engine';

// 2nd Image jaisi "Location-Pin" Goti (Piece)
const LudoPiece = ({ color }: { color: 'red' | 'green' | 'blue' | 'yellow' }) => {
  const colors = {
    red: 'bg-[#C62828]',
    green: 'bg-[#2E7D32]',
    blue: 'bg-[#1565C0]',
    yellow: 'bg-[#F9A825]'
  };
  return (
    <div className={cn("h-7 w-7 md:h-9 md:w-9 rounded-full border-[3px] border-black/20 shadow-inner flex items-center justify-center", colors[color])}>
      <div className="h-2 w-2 bg-black/30 rounded-full" />
    </div>
  );
};

// Safe Spot Star Component
const SafeStar = () => (
  <div className="flex items-center justify-center w-full h-full opacity-30">
    <span className="text-black text-lg">★</span>
  </div>
);

function LudoGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || 'global_room';
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const { gameState, isLoading, joinLobby, rollDice } = useLudoEngine(roomId, currentUser?.uid || null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLaunching || isLoading) {
    return (
      <div className="h-screen w-full bg-[#0a1a4a] flex flex-col items-center justify-center space-y-6">
        <Loader className="h-12 w-12 text-yellow-500 animate-spin" />
        <h1 className="text-xl font-bold text-white tracking-widest uppercase">Loading Arena...</h1>
      </div>
    );
  }

  // Room ke real players ko corners par map karne ka logic
  const getPlayerByColor = (color: string) => gameState?.players.find(p => p.color === color);

  return (
    <div className="h-screen w-full bg-[#0a1a4a] flex flex-col relative overflow-hidden">
      {/* Top Bar - 2nd Image "khai" UI style */}
      <div className="p-4 pt-10 flex items-center justify-between text-white bg-black/20">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-gray-700 rounded-lg flex items-center justify-center font-bold">RM</div>
           <div>
             <h2 className="font-bold text-lg leading-none">{userProfile?.displayName || 'khai'}</h2>
             <span className="text-[10px] opacity-60">ID:{currentUser?.uid?.slice(0,5) || '112'}</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <Volume2 className="h-5 w-5 opacity-70" />
           <Settings className="h-5 w-5 opacity-70" />
           <Share2 className="h-5 w-5 opacity-70" />
           <Power className="h-5 w-5 text-red-400" />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-2">
        {/* LUDO BOARD - Exact 2nd Image Layout */}
        <div className="relative w-full max-w-[400px] aspect-square bg-[#7CB342] p-1.5 rounded-sm shadow-2xl">
          <div className="w-full h-full grid grid-cols-15 grid-rows-15 bg-[#9CCC65]">
            
            {/* RED HOME */}
            <div className="col-span-6 row-span-6 bg-[#C62828] p-3 border-[1.5px] border-black/20">
              <div className="w-full h-full bg-[#B71C1C] rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3 border-4 border-black/10">
                <LudoPiece color="red" /> <LudoPiece color="red" />
                <LudoPiece color="red" /> <LudoPiece color="red" />
              </div>
            </div>

            {/* TOP PATH (Green Home Entry) */}
            <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-black/10", i === 7 ? "bg-[#2E7D32]" : (i > 7 && i % 3 === 1) ? "bg-[#4CAF50]" : "bg-[#AED581]")}>
                  {i === 1 && <SafeStar />}
                </div>
              ))}
            </div>

            {/* GREEN HOME */}
            <div className="col-span-6 row-span-6 bg-[#2E7D32] p-3 border-[1.5px] border-black/20">
              <div className="w-full h-full bg-[#1B5E20] rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3 border-4 border-black/10">
                <LudoPiece color="green" /> <LudoPiece color="green" />
                <LudoPiece color="green" /> <LudoPiece color="green" />
              </div>
            </div>

            {/* LEFT PATH */}
            <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-black/10", i === 1 ? "bg-[#C62828]" : (i >= 7 && i <= 11) ? "bg-[#EF5350]" : "bg-[#AED581]")}>
                  {i === 14 && <SafeStar />}
                </div>
              ))}
            </div>

            {/* CENTER (Play Button Style) */}
            <div className="col-span-3 row-span-3 bg-white flex items-center justify-center p-1 border-2 border-black/20">
               <button 
                 onClick={rollDice}
                 className="w-full h-full bg-orange-500 rounded-lg shadow-inner flex items-center justify-center text-white font-black text-xs uppercase"
               >
                 Play
               </button>
            </div>

            {/* RIGHT PATH */}
            <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-black/10", i === 16 ? "bg-[#F9A825]" : (i >= 6 && i <= 10) ? "bg-[#FFEB3B]" : "bg-[#AED581]")}>
                   {i === 3 && <SafeStar />}
                </div>
              ))}
            </div>

            {/* BLUE HOME */}
            <div className="col-span-6 row-span-6 bg-[#1565C0] p-3 border-[1.5px] border-black/20">
              <div className="w-full h-full bg-[#0D47A1] rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3 border-4 border-black/10">
                <LudoPiece color="blue" /> <LudoPiece color="blue" />
                <LudoPiece color="blue" /> <LudoPiece color="blue" />
              </div>
            </div>

            {/* BOTTOM PATH */}
            <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className={cn("border-[0.5px] border-black/10", i === 10 ? "bg-[#1565C0]" : (i < 10 && i % 3 === 1) ? "bg-[#42A5F5]" : "bg-[#AED581]")}>
                  {i === 16 && <SafeStar />}
                </div>
              ))}
            </div>

            {/* YELLOW HOME */}
            <div className="col-span-6 row-span-6 bg-[#F9A825] p-3 border-[1.5px] border-black/20">
              <div className="w-full h-full bg-[#F57F17] rounded-lg grid grid-cols-2 grid-rows-2 p-3 gap-3 border-4 border-black/10">
                <LudoPiece color="yellow" /> <LudoPiece color="yellow" />
                <LudoPiece color="yellow" /> <LudoPiece color="yellow" />
              </div>
            </div>

          </div>

          {/* REAL PROFILES logic - Board ke corners par dynamic avatars */}
          <CornerAvatar pos="-top-4 -left-4" player={getPlayerByColor('red')} color="red" />
          <CornerAvatar pos="-top-4 -right-4" player={getPlayerByColor('green')} color="green" />
          <CornerAvatar pos="-bottom-4 -left-4" player={getPlayerByColor('blue')} color="blue" />
          <CornerAvatar pos="-bottom-4 -right-4" player={getPlayerByColor('yellow')} color="yellow" />
        </div>

        {/* Enter Lobby Button if game not started */}
        {!gameState && (
           <button 
             onClick={() => joinLobby(userProfile)}
             className="mt-10 bg-yellow-500 text-black font-black px-10 py-3 rounded-full shadow-xl active:scale-95 transition-transform"
           >
             ENTER LOBBY
           </button>
        )}
      </main>

      {/* Bottom Sheet - Compact Room View */}
      <div className="fixed bottom-0 w-full bg-black/40 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-4">
         <CompactRoomView />
      </div>
    </div>
  );
}

// Corner Avatar with real profile image support
const CornerAvatar = ({ pos, player, color }: { pos: string, player?: any, color: string }) => (
  <div className={cn("absolute h-12 w-12 rounded-full border-2 border-white shadow-lg overflow-hidden flex items-center justify-center", pos, !player && "bg-gray-800")}>
    {player ? (
      <Avatar className="h-full w-full">
        <AvatarImage src={player.avatarUrl} />
        <AvatarFallback>{player.name?.[0]}</AvatarFallback>
      </Avatar>
    ) : (
      <Plus className="text-white/30 h-6 w-6" />
    )}
  </div>
);

export default function LudoGamePage() {
  return (
    <Suspense fallback={null}>
      <LudoGameContent />
    </Suspense>
  );
}
