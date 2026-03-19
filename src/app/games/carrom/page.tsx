'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Trophy, 
  X,
  Maximize2,
  ChevronDown,
  Settings2,
  Users,
  Move
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import Image from 'next/image';

/**
 * High-Fidelity Carrom Arena.
 * Mirrors the provided blueprint with absolute visual precision.
 */
export default function CarromGamePage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();

  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [strikerPos, setStrikerPos] = useState([50]);
  const [activePlayer, setActivePlayer] = useState(1);

  const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'carrom'), [firestore]);
  const { data: gameData } = useDoc(gameDocRef);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLaunching) {
    const loadingBg = (gameData as any)?.loadingBackgroundUrl;
    return (
      <div 
        className="h-screen w-full bg-[#004d40] flex flex-col items-center justify-center space-y-6 font-headline relative overflow-hidden"
        style={loadingBg ? { backgroundImage: `url(${loadingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {loadingBg && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
           <div className="text-8xl animate-bounce">🎱</div>
           <h1 className="text-6xl font-black text-[#fbc02d] uppercase italic tracking-tighter drop-shadow-2xl">Carrom Master</h1>
           <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Synchronizing Board...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#00838f] to-[#004d40] flex flex-col relative overflow-hidden font-headline text-white">
        <CompactRoomView />

        {/* Header Protocol */}
        <header className="relative z-50 flex items-center justify-between p-4 pt-32">
           <div className="flex gap-1.5">
              <button className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg"><Move className="h-4 w-4" /></button>
              <button className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg"><HelpCircle className="h-4 w-4" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
           </div>
           
           <h1 className="text-2xl font-black text-white uppercase italic tracking-tight drop-shadow-md">Carrom</h1>

           <div className="flex gap-1.5">
              <button className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 shadow-lg"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5 active:scale-90 transition-all shadow-lg"><X className="h-4 w-4" /></button>
           </div>
        </header>

        {/* Main Board Arena */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">
           {/* Wooden Board Structure */}
           <div className="relative w-full max-w-[380px] aspect-square bg-[#f5ba78] rounded-[2rem] border-[12px] border-[#004d40] shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center justify-center p-4">
              {/* Wooden Grain Overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none" />
              
              {/* Corner Pockets */}
              <div className="absolute top-0 left-0 w-12 h-12 bg-black rounded-full -translate-x-4 -translate-y-4 shadow-inner" />
              <div className="absolute top-0 right-0 w-12 h-12 bg-black rounded-full translate-x-4 -translate-y-4 shadow-inner" />
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-black rounded-full -translate-x-4 translate-y-4 shadow-inner" />
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-black rounded-full translate-x-4 translate-y-4 shadow-inner" />

              {/* Corner Bumpers (Yellow) */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[6px] border-l-[6px] border-[#ffd600] rounded-tl-3xl -translate-x-2 -translate-y-2" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[6px] border-r-[6px] border-[#ffd600] rounded-tr-3xl translate-x-2 -translate-y-2" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[6px] border-l-[6px] border-[#ffd600] rounded-bl-3xl -translate-x-2 translate-y-2" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[6px] border-r-[6px] border-[#ffd600] rounded-br-3xl translate-x-2 translate-y-2" />

              {/* Internal Board Lines (Foul lines & Circles) */}
              <div className="absolute inset-8 border-2 border-[#8d6e63]/40 rounded-sm pointer-events-none" />
              
              {/* Baselines & Circles */}
              <div className="absolute bottom-10 left-12 right-12 h-[2px] bg-[#8d6e63]/40">
                 <div className="absolute left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-[#8d6e63]/40 flex items-center justify-center bg-[#f5ba78]">
                    <div className="w-4 h-4 rounded-full bg-orange-600/40" />
                 </div>
                 <div className="absolute right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-[#8d6e63]/40 flex items-center justify-center bg-[#f5ba78]">
                    <div className="w-4 h-4 rounded-full bg-orange-600/40" />
                 </div>
              </div>
              <div className="absolute top-10 left-12 right-12 h-[2px] bg-[#8d6e63]/40">
                 <div className="absolute left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-[#8d6e63]/40 flex items-center justify-center bg-[#f5ba78]">
                    <div className="w-4 h-4 rounded-full bg-orange-600/40" />
                 </div>
                 <div className="absolute right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-[#8d6e63]/40 flex items-center justify-center bg-[#f5ba78]">
                    <div className="w-4 h-4 rounded-full bg-orange-600/40" />
                 </div>
              </div>

              {/* Central Circle Patterns */}
              <div className="relative w-32 h-32 rounded-full border-2 border-[#8d6e63]/40 flex items-center justify-center">
                 <div className="w-28 h-28 rounded-full border border-[#8d6e63]/20" />
                 
                 {/* The Queen (Center) */}
                 <div className="absolute w-6 h-6 bg-red-600 rounded-full border-2 border-red-400 shadow-lg flex items-center justify-center animate-reaction-pulse">
                    <div className="w-2 h-2 rounded-full border border-white/40" />
                 </div>

                 {/* Coin Packing Logic */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Ring 1 */}
                    {[...Array(6)].map((_, i) => {
                      const angle = (i * 60) * (Math.PI / 180);
                      const x = Math.cos(angle) * 22;
                      const y = Math.sin(angle) * 22;
                      const isWhite = i % 2 === 0;
                      return (
                        <div key={`r1-${i}`} className={cn(
                          "absolute w-6 h-6 rounded-full border-2 shadow-md",
                          isWhite ? "bg-white border-gray-300" : "bg-[#1a1a1a] border-gray-800"
                        )} style={{ transform: `translate(${x}px, ${y}px)` }} />
                      );
                    })}
                    {/* Ring 2 */}
                    {[...Array(12)].map((_, i) => {
                      const angle = (i * 30) * (Math.PI / 180);
                      const x = Math.cos(angle) * 44;
                      const y = Math.sin(angle) * 44;
                      const isWhite = i % 3 === 0;
                      return (
                        <div key={`r2-${i}`} className={cn(
                          "absolute w-6 h-6 rounded-full border-2 shadow-md",
                          isWhite ? "bg-white border-gray-300" : "bg-[#1a1a1a] border-gray-800"
                        )} style={{ transform: `translate(${x}px, ${y}px)` }} />
                      );
                    })}
                 </div>
              </div>
           </div>

           {/* Striker Slider Dimension */}
           <div className="mt-10 w-full max-w-[280px] relative px-4">
              <div className="h-10 bg-[#a67c52] rounded-full border-4 border-[#8d6e63] shadow-inner relative flex items-center overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                 <Slider 
                   value={strikerPos} 
                   onValueChange={setStrikerPos} 
                   max={100} 
                   step={1}
                   className="relative z-10"
                 />
              </div>
              {/* Striker Visualization */}
              <div 
                className="absolute -top-12 h-10 w-10 bg-gradient-to-br from-white to-gray-200 rounded-full border-2 border-gray-400 shadow-2xl flex items-center justify-center transition-all duration-75"
                style={{ left: `${strikerPos[0]}%`, transform: 'translateX(-50%)' }}
              >
                 <div className="w-6 h-6 rounded-full border-2 border-gray-300/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400/20" />
                 </div>
              </div>
           </div>
        </main>

        {/* Footer Ledger & Players */}
        <footer className="relative z-50 p-6 pb-12 flex items-end justify-between">
           {/* Player Avatars */}
           <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                 <div className={cn(
                   "relative p-1 rounded-full border-2 transition-all",
                   activePlayer === 1 ? "border-yellow-400 scale-110 shadow-[0_0_15px_#facc15]" : "border-white/10"
                 )}>
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                       <AvatarImage src="https://picsum.photos/seed/p1/100" />
                       <AvatarFallback>P1</AvatarFallback>
                    </Avatar>
                    {activePlayer === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">▼</div>}
                 </div>
                 <div className="bg-black/40 rounded-full px-3 py-0.5 border border-white/10">
                    <span className="text-[10px] font-black italic">0</span>
                 </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                 <div className={cn(
                   "relative p-1 rounded-full border-2 transition-all",
                   activePlayer === 2 ? "border-yellow-400 scale-110 shadow-[0_0_15px_#facc15]" : "border-white/10"
                 )}>
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                       <AvatarImage src={userProfile?.avatarUrl || undefined} />
                       <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    {activePlayer === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">▼</div>}
                 </div>
                 <div className="bg-black/40 rounded-full px-3 py-0.5 border border-white/10">
                    <span className="text-[10px] font-black italic">0</span>
                 </div>
              </div>
           </div>

           {/* Points Legend */}
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-xl">
                 <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-[#1a1a1a] rounded-full border border-gray-600" />
                    <span className="text-xs font-black italic">10</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-white rounded-full border border-gray-300" />
                    <span className="text-xs font-black italic">20</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-red-600 rounded-full border border-red-400" />
                    <span className="text-xs font-black italic">50</span>
                 </div>
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] text-right pr-2">v1.0.3.20</p>
           </div>
        </footer>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
