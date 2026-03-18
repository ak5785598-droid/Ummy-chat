'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Trophy, 
  Users, 
  X,
  Target,
  Snowflake,
  Play,
  Loader,
  Plus,
  Minus,
  Settings2,
  Zap
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameResultOverlay } from '@/components/game-result-overlay';
import Image from 'next/image';

const BET_PACKAGES = [1000, 5000, 10000, 50000];

interface Fish {
  id: number;
  type: 'little' | 'medium' | 'big';
  hp: number;
  maxHp: number;
  multiplier: number;
  x: number;
  y: number;
  speed: number;
  angle: number;
  size: number;
  emoji: string;
  name: string;
}

const FISH_TYPES = [
  { type: 'little' as const, maxHp: 1, multiplier: 1.2, size: 40, emoji: '🐠', name: 'Clownfish', speed: 2 },
  { type: 'little' as const, maxHp: 1, multiplier: 1.2, size: 40, emoji: '🐟', name: 'Guppy', speed: 2.5 },
  { type: 'medium' as const, maxHp: 5, multiplier: 10, size: 70, emoji: '🐢', name: 'Golden Turtle', speed: 1.2 },
  { type: 'medium' as const, maxHp: 8, multiplier: 15, size: 85, emoji: '🐡', name: 'Puffer', speed: 1.5 },
  { type: 'big' as const, maxHp: 25, multiplier: 50, size: 140, emoji: '🐋', name: 'Ancient Whale', speed: 0.8 },
  { id: 'magma-ray', type: 'big' as const, maxHp: 22, multiplier: 45, size: 120, emoji: '🦈', name: 'MagmaRay', speed: 1 },
];

export default function FishingMasterPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'loading' | 'playing'>('loading');
  const [bet, setBet] = useState(1000);
  const [isMuted, setIsMuted] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [isFreeze, setIsFreeze] = useState(false);
  const [fishes, setFish] = useState<Fish[]>([]);
  const [bullets, setBullets] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [killNotice, setKillNotice] = useState<{ name: string; fishName: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cannonRef = useRef<HTMLDivElement>(null);
  const lastFireTime = useRef<number>(0);

  const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'fishing-master'), [firestore]);
  const { data: gameData } = useDoc(gameDocRef);

  useEffect(() => {
    const timer = setTimeout(() => setGameState('playing'), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Spawning Logic
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      if (fishes.length < 15) {
        const type = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const newFish: Fish = {
          id: Date.now() + Math.random(),
          type: type.type,
          hp: type.maxHp,
          maxHp: type.maxHp,
          multiplier: type.multiplier,
          x: side === 'left' ? -100 : 110,
          y: 20 + Math.random() * 60,
          speed: type.speed * (side === 'left' ? 1 : -1),
          angle: 0,
          size: type.size,
          emoji: type.emoji,
          name: type.name
        };
        setFish(prev => [...prev, newFish]);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [gameState, fishes.length]);

  // Movement Logic
  useEffect(() => {
    if (gameState !== 'playing' || isFreeze) return;
    const frame = requestAnimationFrame(function move() {
      setFish(prev => prev.map(f => ({ ...f, x: f.x + f.speed * 0.1 })).filter(f => f.x > -150 && f.x < 150));
      requestAnimationFrame(move);
    });
    return () => cancelAnimationFrame(frame);
  }, [gameState, isFreeze]);

  const handleShoot = async (clientX: number, clientY: number) => {
    if (gameState !== 'playing' || !currentUser || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < bet) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    const now = Date.now();
    if (now - lastFireTime.current < 200) return; // Fire rate limit
    lastFireTime.current = now;

    // Deduct cost per shot
    const updateData = { 'wallet.coins': increment(-bet), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore!, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore!, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    // Visual feedback for shoot (bullet logic simplified for performance)
    // In a full implementation, we'd calculate hit detection here.
    // For this prototype, we'll detect if we clicked near a fish.
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = ((clientX - rect.left) / rect.width) * 100;
    const clickY = ((clientY - rect.top) / rect.height) * 100;

    let hitFishId: number | null = null;
    fishes.forEach(f => {
      const dx = Math.abs(f.x - clickX);
      const dy = Math.abs(f.y - clickY);
      if (dx < 10 && dy < 10) hitFishId = f.id;
    });

    if (hitFishId !== null) {
      processHit(hitFishId);
    }
  };

  const processHit = async (fishId: number) => {
    setFish(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(f => f.id === fishId);
      if (idx === -1) return prev;

      const fish = updated[idx];
      const newHp = fish.hp - 1;

      if (newHp <= 0) {
        // KILL SYNC
        const win = Math.floor(bet * fish.multiplier);
        awardKill(win, fish.name);
        updated.splice(idx, 1);
      } else {
        updated[idx] = { ...fish, hp: newHp };
      }
      return updated;
    });
  };

  const awardKill = (amount: number, fishName: string) => {
    if (!currentUser || !firestore) return;
    
    setWinAmount(amount);
    setKillNotice({ name: userProfile?.username || 'king', fishName });
    setTimeout(() => {
      setWinAmount(null);
      setKillNotice(null);
    }, 3000);

    const updateData = { 
      'wallet.coins': increment(amount), 
      'stats.dailyGameWins': increment(amount),
      'stats.weeklyGameWins': increment(amount),
      'stats.monthlyGameWins': increment(amount),
      updatedAt: serverTimestamp() 
    };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    // Ranking Ledger Dispatch
    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
      gameId: 'fishing-master',
      userId: currentUser.uid,
      username: userProfile?.username || 'Guest',
      avatarUrl: userProfile?.avatarUrl || null,
      amount: amount,
      timestamp: serverTimestamp()
    });
  };

  const adjustBet = (dir: 'plus' | 'minus') => {
    const idx = BET_PACKAGES.indexOf(bet);
    if (dir === 'plus' && idx < BET_PACKAGES.length - 1) setBet(BET_PACKAGES[idx + 1]);
    if (dir === 'minus' && idx > 0) setBet(BET_PACKAGES[idx - 1]);
  };

  if (gameState === 'loading') {
    return (
      <div className="h-screen w-full bg-[#001a2e] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="text-8xl animate-bounce">🌊</div>
        <h1 className="text-6xl font-black text-blue-400 uppercase italic tracking-tighter drop-shadow-2xl">Fishing Master</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Syncing Underwater Arena...</p>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div 
        ref={containerRef}
        onClick={(e) => handleShoot(e.clientX, e.clientY)}
        className="h-[100dvh] w-full bg-[#001a2e] flex flex-col relative overflow-hidden font-headline text-white select-none animate-in fade-in duration-1000"
      >
        <CompactRoomView />

        {/* Cinematic Sea Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-b from-[#004d7a] via-[#001a2e] to-[#000a1a]" />
           {/* Animated Caulstic Water Effects */}
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/water.png')] animate-pulse" />
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 via-transparent to-transparent" />
           
           {/* Coins on the floor logic */}
           <div className="absolute bottom-4 left-4 flex flex-wrap gap-1 max-w-[150px] opacity-40">
              {Array.from({length: 20}).map((_, i) => (
                <GoldCoinIcon key={i} className="h-4 w-4" />
              ))}
           </div>
        </div>

        {/* Global Kill Notice Sync */}
        {killNotice && (
          <div className="absolute top-44 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm animate-in slide-in-from-top-4 duration-500">
             <div className="bg-black/40 backdrop-blur-md rounded-full border-2 border-yellow-400/40 p-2 flex items-center gap-3 px-6 shadow-2xl">
                <span className="text-white font-black uppercase text-[10px] truncate">{killNotice.name}</span>
                <span className="text-white/60 font-bold uppercase text-[8px]">for killing</span>
                <span className="text-yellow-400 font-black uppercase text-[10px] italic">{killNotice.fishName}!</span>
             </div>
          </div>
        )}

        <header className="relative z-[110] flex items-center justify-between px-4 pt-32 pb-4">
           <div className="flex gap-2">
              <button className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg flex flex-col items-center">
                 <Trophy className="h-4 w-4 text-yellow-400" />
                 <span className="text-[6px] font-black uppercase mt-0.5">Ranking</span>
              </button>
              <button className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg flex flex-col items-center">
                 <Zap className="h-4 w-4 text-orange-400" />
                 <span className="text-[6px] font-black uppercase mt-0.5">Store</span>
              </button>
           </div>
           
           <div className="bg-blue-900/40 border border-blue-400/20 rounded-full px-4 py-1 backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase italic tracking-widest text-blue-200">Empty</span>
           </div>

           <div className="flex items-center gap-2">
              <div className="text-[8px] font-bold text-green-400 flex items-center gap-1">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 0ms
              </div>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full border border-white/5"><X className="h-4 w-4" /></button>
           </div>
        </header>

        {/* The Game Field */}
        <main className="flex-1 relative z-10 w-full overflow-hidden pointer-events-none">
           {fishes.map((fish) => (
             <div 
               key={fish.id}
               className="absolute transition-transform duration-100 ease-linear flex flex-col items-center"
               style={{ 
                 left: `${fish.x}%`, 
                 top: `${fish.y}%`,
                 width: `${fish.size}px`,
                 height: `${fish.size}px`,
                 transform: `scaleX(${fish.speed > 0 ? 1 : -1})`
               }}
             >
                <div className="text-6xl drop-shadow-2xl animate-reaction-float" style={{ fontSize: `${fish.size}px` }}>
                   {fish.emoji}
                </div>
                {/* Health Bar Sync */}
                {fish.hp < fish.maxHp && (
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-1 border border-white/10">
                     <div 
                       className="h-full bg-red-500 transition-all duration-300" 
                       style={{ width: `${(fish.hp / fish.maxHp) * 100}%` }} 
                     />
                  </div>
                )}
             </div>
           ))}
        </main>

        {/* Player Profile Sync Box */}
        <div className="absolute bottom-24 left-4 z-[110] pointer-events-auto">
           <div className="bg-blue-900/60 backdrop-blur-xl rounded-2xl p-2 pl-3 pr-4 border border-blue-400/30 flex items-center gap-3 shadow-2xl">
              <Avatar className="h-10 w-10 border-2 border-blue-400 shadow-lg">
                 <AvatarImage src={userProfile?.avatarUrl} />
                 <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                 <p className="text-[10px] font-black uppercase text-blue-200 truncate w-20">{userProfile?.username || 'king'}</p>
                 <div className="flex items-center gap-1 bg-black/20 rounded-full px-2 py-0.5 mt-0.5">
                    <GoldCoinIcon className="h-3 w-3" />
                    <span className="text-xs font-black italic text-yellow-400">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                    <button className="ml-1 text-blue-400"><Plus className="h-2 w-2" /></button>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Cannon Protocol */}
        <footer className="relative z-[120] p-4 pb-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-4 pointer-events-auto">
           <div className="flex items-center gap-6">
              {/* Aim & Freeze Controls */}
              <div className="flex gap-3">
                 <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                    <div className="h-12 w-12 rounded-xl bg-green-500/40 border-2 border-green-400/60 flex items-center justify-center backdrop-blur-sm shadow-xl">
                       <Target className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Aim</span>
                 </button>
                 <button 
                   onClick={() => { setIsFreeze(!isFreeze); toast({ title: isFreeze ? 'Sync Restored' : 'Time Frozen' }); }}
                   className={cn(
                     "flex flex-col items-center gap-1 active:scale-90 transition-transform",
                     isFreeze && "animate-pulse"
                   )}
                 >
                    <div className={cn(
                      "h-12 w-12 rounded-xl border-2 flex items-center justify-center backdrop-blur-sm shadow-xl",
                      isFreeze ? "bg-cyan-500 border-white" : "bg-cyan-500/40 border-cyan-400/60"
                    )}>
                       <Snowflake className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Freeze</span>
                 </button>
              </div>

              {/* Main Cannon Hub */}
              <div className="relative flex items-center gap-2">
                 <button onClick={() => adjustBet('minus')} className="bg-green-500 h-8 w-8 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white active:scale-90"><Minus className="h-4 w-4" /></button>
                 
                 <div className="relative group cursor-pointer">
                    <div className="bg-gradient-to-b from-blue-600 to-indigo-900 border-2 border-blue-400 rounded-xl px-8 py-2 shadow-2xl flex flex-col items-center">
                       <span className="text-[14px] font-black italic text-white tracking-widest">{bet}</span>
                    </div>
                    {/* Cannon Animation */}
                    <div ref={cannonRef} className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 pointer-events-none transition-transform duration-75">
                       <div className="w-full h-full bg-red-600 rounded-t-full border-2 border-yellow-400 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-yellow-400/20" />
                       </div>
                    </div>
                 </div>

                 <button onClick={() => adjustBet('plus')} className="bg-green-500 h-8 w-8 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white active:scale-90"><Plus className="h-4 w-4" /></button>
                 
                 <button 
                   onClick={() => setIsAuto(!isAuto)}
                   className={cn(
                     "h-8 px-4 rounded-lg font-black uppercase text-[10px] italic transition-all",
                     isAuto ? "bg-green-500 text-white shadow-[0_0_15px_#22c55e]" : "bg-green-500/20 text-green-400 border border-green-500/40"
                   )}
                 >
                    Auto
                 </button>
              </div>
           </div>
        </footer>

        {gameState === 'playing' && winAmount && winAmount > 0 && (
          <GameResultOverlay 
            gameId="fishing-master"
            winningSymbol="🔱" 
            winAmount={winAmount} 
          />
        )}

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
