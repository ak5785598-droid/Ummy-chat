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
  Zap,
  Play
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameResultOverlay } from '@/components/game-result-overlay';
import Image from 'next/image';

const HOLES = Array.from({ length: 12 }, (_, i) => i);
const BET_VALUES = [100, 1000, 10000, 100000, 500000];

/**
 * High-Fidelity Donkey Whack Arena.
 * Mirrors the provided blueprint with a grassy grid and interactive hammer.
 */
export default function DonkeyWhackPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'loading' | 'playing'>('loading');
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [selectedBet, setSelectedBet] = useState(100);
  const [isAuto, setIsAuto] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [hammerPos, setHammerPos] = useState<{ x: number, y: number } | null>(null);

  const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'donkey-whack'), [firestore]);
  const { data: gameData } = useDoc(gameDocRef);

  // Spawning Logic
  useEffect(() => {
    if (gameState !== 'playing') {
      const timer = setTimeout(() => setGameState('playing'), 2000);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setActiveHole(Math.floor(Math.random() * HOLES.length));
    }, 1500);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleWhack = async (holeIdx: number, e: React.MouseEvent) => {
    if (!currentUser || !firestore || !userProfile) return;

    // Trigger Hammer Animation
    setHammerPos({ x: e.clientX, y: e.clientY });
    setTimeout(() => setHammerPos(null), 300);

    // Identity Sync & Balance Check
    const currentBalance = userProfile.wallet?.coins || 0;
    if (currentBalance < selectedBet) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    // ARENA REPORTING: Dispatch bet volume to central pool
    updateDocumentNonBlocking(doc(firestore, 'gameStates', 'donkey-whack'), {
      totalPool: increment(selectedBet),
      [`poolPerHole.${holeIdx}`]: increment(selectedBet)
    });

    // Atomic Balance Deduction
    const deductData = { 'wallet.coins': increment(-selectedBet), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), deductData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), deductData);

    if (holeIdx === activeHole) {
      processWin();
    }
  };

  const processWin = async () => {
    if (!firestore || !currentUser) return;

    // ORACLE SYNC CHECK
    let multiplier = 5;
    try {
      const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'donkey-whack'));
      if (oracleSnap.exists() && oracleSnap.data().isActive) {
        // Multiplier could be adjusted by Oracle for high-fidelity events
        updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'donkey-whack'), { isActive: false });
      }
    } catch (e) {}

    const win = selectedBet * multiplier;
    setWinAmount(win);
    setTimeout(() => setWinAmount(null), 3000);

    // ARENA SYNC: Multi-period win reporting
    const updateData = { 
      'wallet.coins': increment(win), 
      'stats.dailyGameWins': increment(win),
      'stats.weeklyGameWins': increment(win),
      'stats.monthlyGameWins': increment(win),
      updatedAt: serverTimestamp() 
    };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    // Global Ledger Sync for Ranking
    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
      gameId: 'donkey-whack',
      userId: currentUser.uid,
      username: userProfile?.username || 'king',
      avatarUrl: userProfile?.avatarUrl || null,
      amount: win,
      timestamp: serverTimestamp()
    });
  };

  if (gameState === 'loading') {
    const loadingBg = (gameData as any)?.loadingBackgroundUrl;
    return (
      <div className="h-screen w-full bg-[#1a2e05] flex flex-col items-center justify-center space-y-6 font-headline relative overflow-hidden">
        {loadingBg && <Image src={loadingBg} fill className="object-cover opacity-60" alt="Loading" unoptimized />}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center gap-6">
           <div className="text-8xl animate-bounce">🐴</div>
           <h1 className="text-6xl font-black text-yellow-400 uppercase italic tracking-tighter drop-shadow-2xl">Donkey Whack</h1>
           <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Syncing Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#3d2b1f] flex flex-col relative overflow-hidden font-headline text-white select-none">
        <CompactRoomView />

        {/* High-Fidelity Background */}
        <div className="absolute inset-0 z-0">
           {gameData?.backgroundUrl ? (
             <Image src={gameData.backgroundUrl} fill className="object-cover opacity-40 animate-in fade-in duration-1000" alt="Stage" unoptimized />
           ) : (
             <div className="absolute inset-0 bg-gradient-to-b from-[#4a3728] via-[#3d2b1f] to-[#1a0f0a]" />
           )}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20" />
        </div>

        {/* Global Win Sync Overlay */}
        {winAmount && winAmount > 0 && (
          <GameResultOverlay 
            gameId="donkey-whack"
            winningSymbol="🔨" 
            winAmount={winAmount} 
          />
        )}

        {/* Interactive Hammer Component */}
        {hammerPos && (
          <div 
            className="fixed z-[500] pointer-events-none animate-hammer-whack text-7xl"
            style={{ left: hammerPos.x - 40, top: hammerPos.y - 40 }}
          >
            🔨
          </div>
        )}

        <header className="relative z-50 flex items-center justify-between p-4 pt-32 px-6">
           <div className="flex gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className="bg-amber-600/80 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-90 transition-all">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
           </div>
           
           <h1 className="text-3xl font-black italic tracking-tighter text-[#facc15] drop-shadow-[0_4px_8px_#000]">Whack!</h1>

           <div className="flex gap-2">
              <button className="bg-amber-600/80 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg"><HelpCircle className="h-5 w-5" /></button>
              <button onClick={() => router.back()} className="bg-amber-600/80 p-2 rounded-full border border-white/10"><X className="h-5 w-5" /></button>
           </div>
        </header>

        {/* Grassy Grid Arena */}
        <main className="flex-1 relative z-10 p-4 flex items-center justify-center">
           <div className="grid grid-cols-3 gap-4 w-full max-w-[360px]">
              {HOLES.map((hole) => (
                <div key={hole} className="relative aspect-square">
                   {/* High-Fidelity Hole Pattern */}
                   <div className="absolute inset-0 bg-[#1a0f0a] rounded-full border-4 border-[#2d1a12] shadow-inner" />
                   <div className="absolute inset-2 bg-gradient-to-b from-black/60 to-transparent rounded-full opacity-40" />
                   
                   {/* The Donkey Dimension */}
                   {activeHole === hole && (
                     <button 
                       onMouseDown={(e) => handleWhack(hole, e)}
                       className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-donkey-peek cursor-pointer active:scale-90 transition-transform"
                     >
                        <span className="text-6xl drop-shadow-2xl">🐴</span>
                        <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black text-[8px] uppercase border border-white shadow-lg mt-1">Whack Me!</div>
                     </button>
                   )}
                </div>
              ))}
           </div>
        </main>

        {/* Professional Control Panel */}
        <footer className="relative z-50 p-6 bg-gradient-to-t from-[#2d1a12] to-transparent pb-12">
           <div className="max-w-md mx-auto space-y-6">
              <div className="flex items-center justify-between">
                 <div className="bg-black/40 backdrop-blur-xl border-2 border-amber-500/40 rounded-2xl flex items-center gap-2 pl-2 pr-4 py-1.5 shadow-xl">
                    <GoldCoinIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-xl font-black italic text-yellow-500">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 </div>
                 <button 
                   onClick={() => setIsAuto(!isAuto)}
                   className={cn(
                     "h-10 px-6 rounded-full font-black uppercase text-xs italic transition-all",
                     isAuto ? "bg-green-500 shadow-[0_0_20px_#22c55e]" : "bg-white/10 border border-white/10"
                   )}
                 >
                    Auto
                 </button>
              </div>

              {/* Wooden Bet Selector */}
              <div className="bg-[#5d4037] p-2 rounded-[2rem] border-4 border-[#3e2723] shadow-2xl flex justify-between items-center gap-2 overflow-x-auto no-scrollbar">
                 {BET_VALUES.map((val) => (
                   <button 
                     key={val} 
                     onClick={() => setSelectedBet(val)}
                     className={cn(
                       "h-12 min-w-[64px] rounded-2xl font-black italic text-sm transition-all active:scale-95 flex items-center justify-center",
                       selectedBet === val 
                         ? "bg-yellow-400 text-black shadow-xl ring-2 ring-white/40" 
                         : "bg-black/20 text-white/40 hover:bg-black/30"
                     )}
                   >
                      {val >= 1000 ? `${val/1000}K` : val}
                   </button>
                 ))}
              </div>
           </div>
        </footer>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes donkey-peek { 0% { transform: translateY(40px) scale(0.5); opacity: 0; } 20% { transform: translateY(0) scale(1); opacity: 1; } 80% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(40px) scale(0.5); opacity: 0; } }
          .animate-donkey-peek { animation: donkey-peek 1.5s ease-in-out infinite; }
          @keyframes hammer-whack { 0% { transform: rotate(0deg); } 50% { transform: rotate(-45deg); } 100% { transform: rotate(0deg); } }
          .animate-hammer-whack { animation: hammer-whack 0.3s ease-out forwards; }
        `}</style>
      </div>
    </AppLayout>
  );
}
