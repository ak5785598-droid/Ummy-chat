'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase, addDocumentNonBlocking, useCollection } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  X,
  ChevronDown,
  Users,
  Clock 
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { GameResultOverlay } from '@/components/game-result-overlay';
import Image from 'next/image';

const NUMBERS = [
 0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const CHIPS = [
 { value: 100, label: '100', color: 'bg-blue-500' },
 { value: 5000, label: '5K', color: 'bg-green-500' },
 { value: 50000, label: '50K', color: 'bg-yellow-500' },
 { value: 100000, label: '100K', color: 'bg-orange-500' },
 { value: 500000, label: '500K', color: 'bg-red-500' },
 { value: 1000000, label: '1M', color: 'bg-pink-500' },
 { value: 100000000, label: '100M', color: 'bg-purple-500' },
 { value: 500000000, label: '500M', color: 'bg-cyan-500' },
];

const BET_OPTIONS = [
 { id: '0', label: '0', multiplier: 36, color: 'bg-emerald-600' },
 { id: '1-12', label: '1-12', multiplier: 3, color: 'bg-emerald-800' },
 { id: '13-24', label: '13-24', multiplier: 3, color: 'bg-emerald-800' },
 { id: '25-36', label: '25-36', multiplier: 3, color: 'bg-emerald-800' },
 { id: 'red', label: 'Red', multiplier: 2, color: 'bg-red-600' },
 { id: 'black', label: 'Black', multiplier: 2, color: 'bg-slate-900' },
 { id: 'single', label: 'Single', multiplier: 2, color: 'bg-emerald-700' },
 { id: 'double', label: 'Double', multiplier: 2, color: 'bg-emerald-700' },
];

interface RouletteGameContentProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function RouletteGameContent({ isOverlay = false, onClose }: RouletteGameContentProps) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [lastBets, setLastBets] = useState<Record<string, number>>({});
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<number[]>([16, 2, 34, 17, 0, 25, 11]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [totalWinAmount, setTotalWinAmount] = useState(0);

  const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'roulette'), [firestore]);
  const { data: gameData } = useDoc(gameDocRef);

  const winnersQuery = useMemo(() => {
     if (!firestore) return null;
     return query(
       collection(firestore, 'globalGameWins'),
       where('gameId', '==', 'roulette'),
       orderBy('timestamp', 'desc'),
       limit(5)
     );
   }, [firestore]);

   const { data: liveWins } = useCollection(winnersQuery);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
   if (!audioCtxRef.current && typeof window !== 'undefined') {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
   }
   if (audioCtxRef.current?.state === 'suspended') {
    audioCtxRef.current.resume();
   }
   return audioCtxRef.current;
  }, []);

  const playBetSound = useCallback(() => {
   if (isMuted) return;
   const ctx = initAudioContext();
   if (!ctx) return;
   const osc = ctx.createOscillator();
   const gain = ctx.createGain();
   osc.type = 'sine';
   osc.frequency.setValueAtTime(1200, ctx.currentTime);
   gain.gain.setValueAtTime(0.1, ctx.currentTime);
   osc.connect(gain);
   gain.connect(ctx.destination);
   osc.start();
   osc.stop(ctx.currentTime + 0.1);
  }, [isMuted, initAudioContext]);

  useEffect(() => {
   const timer = setTimeout(() => setIsLaunching(false), 2000);
   return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
   if (isLaunching) return;
   const interval = setInterval(() => {
    if (gameState === 'betting') {
     if (timeLeft > 0) setTimeLeft(prev => prev - 1);
     else startSpin();
    }
   }, 1000);
   return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startSpin = async () => {
   setGameState('spinning');
   
   let targetNum = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
   if (firestore) {
    try {
     const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'roulette'));
     if (oracleSnap.exists() && oracleSnap.data().isActive) {
      const forced = oracleSnap.data().forcedResult;
      if (NUMBERS.includes(forced)) {
       targetNum = forced;
       updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'roulette'), { isActive: false });
      }
     }
    } catch (e) {}
   }

   const targetIdx = NUMBERS.indexOf(targetNum);
   const sliceDeg = 360 / 37;
   const extraSpins = 5 + Math.floor(Math.random() * 5);
   const targetRotation = rotation + (extraSpins * 360) + (targetIdx * sliceDeg);
   
   setRotation(targetRotation);

   setTimeout(() => {
    showResult(targetNum);
   }, 5000);
  };

  const showResult = (num: number) => {
   setWinningNumber(num);
   setHistory(prev => [num, ...prev].slice(0, 15));
   
   let winAmount = 0;
   const isRed = RED_NUMBERS.includes(num);
   const isBlack = num !== 0 && !isRed;
   const isSingle = num % 2 !== 0; 
   const isDouble = num !== 0 && num % 2 === 0; 

   if (num === 0) winAmount += (myBets['0'] || 0) * 36;
   if (num >= 1 && num <= 12) winAmount += (myBets['1-12'] || 0) * 3;
   if (num >= 13 && num <= 24) winAmount += (myBets['13-24'] || 0) * 3;
   if (num >= 25 && num <= 36) winAmount += (myBets['25-36'] || 0) * 3;
   if (isRed) winAmount += (myBets['red'] || 0) * 2;
   if (isBlack) winAmount += (myBets['black'] || 0) * 2;
   if (isSingle) winAmount += (myBets['single'] || 0) * 2;
   if (isDouble) winAmount += (myBets['double'] || 0) * 2;

   setTotalWinAmount(winAmount);

   setWinners(liveWins?.map(w => ({
     name: w.username,
     win: w.amount,
     avatar: w.avatarUrl,
     isMe: w.userId === currentUser?.uid
   })) || []);

   setGameState('result');

   if (winAmount > 0 && currentUser && firestore && userProfile) {
    const updateData = { 
     'wallet.coins': increment(winAmount), 
     'stats.dailyGameWins': increment(winAmount),
     'stats.weeklyGameWins': increment(winAmount),
     'stats.monthlyGameWins': increment(winAmount),
     updatedAt: serverTimestamp() 
    };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
     gameId: 'roulette',
     userId: currentUser.uid,
     username: userProfile?.username || 'Guest',
     avatarUrl: userProfile?.avatarUrl || null,
     amount: winAmount,
     timestamp: serverTimestamp()
    });

    const questRef = doc(firestore, 'users', currentUser.uid, 'quests', 'win_game');
    updateDocumentNonBlocking(questRef, { current: increment(1), updatedAt: serverTimestamp() });
   }

   setTimeout(() => {
    setLastBets(myBets);
    setMyBets({});
    setWinners([]);
    setWinningNumber(null);
    setGameState('betting');
    setTimeLeft(15);
   }, 5000);
  };

  const handlePlaceBet = (id: string) => {
   if (gameState !== 'betting' || !currentUser || !userProfile) return;
   if ((userProfile.wallet?.coins || 0) < selectedChip) {
    toast({ variant: 'destructive', title: 'Insufficient Coins' });
    return;
   }
   
   playBetSound();
   const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
   setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  if (isLaunching) {
   const loadingBg = (gameData as any)?.loadingBackgroundUrl;
   return (
    <div 
     className="h-full w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6 font-sans text-white relative overflow-hidden min-h-[400px]"
     style={loadingBg ? { backgroundImage: `url(${loadingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
     {loadingBg && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />}
     <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
       <div className="text-8xl animate-bounce">🎡</div>
       <h1 className="text-6xl font-bold text-yellow-500 uppercase tracking-tight drop-shadow-2xl">Roulette</h1>
       <p className="text-white/40 uppercase tracking-wider text-[10px] animate-pulse">Synchronizing Wheel...</p>
     </div>
    </div>
   );
  }

  const winningNumberBadge = winningNumber !== null ? (
   <div className={cn(
    "h-16 w-16 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white shadow-xl",
    RED_NUMBERS.includes(winningNumber) ? "bg-red-600" : winningNumber === 0 ? "bg-emerald-600" : "bg-slate-900"
   )}>
    {winningNumber}
   </div>
  ) : null;

  return (
   <div className={cn(
     "h-full w-full bg-[#311b92] flex flex-col relative overflow-hidden font-sans text-white select-none",
     !isOverlay && "min-h-screen"
   )}>
    <CompactRoomView />

    <div className="absolute inset-0 z-0">
      {gameData?.backgroundUrl ? (
       <Image key={gameData.backgroundUrl} src={gameData.backgroundUrl} alt="Casino Theme" fill className="object-cover opacity-40 animate-in fade-in duration-1000" unoptimized />
      ) : (
       <div className="absolute inset-0 bg-gradient-to-b from-[#4a148c] via-[#311b92] to-[#1a237e]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#311b92] z-10" />
    </div>

    {gameState === 'result' && winningNumber !== null && (
     <GameResultOverlay 
      gameId="roulette"
      winningSymbol={winningNumberBadge} 
      winAmount={totalWinAmount} 
      winners={winners} 
     />
    )}

    {/* HEADER */}
    <header className="relative z-50 flex items-center justify-between p-4 pt-10">
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#231545]/80 backdrop-blur-md rounded-[30px] p-1 border border-white/5 shadow-lg">
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full h-8 w-8 flex items-center justify-center shadow-inner">
            <GoldCoinIcon className="h-5 w-5" />
          </div>
          <span className="text-white font-bold px-3 text-sm tracking-wide">
            {userProfile?.wallet?.coins >= 1000000 
              ? `${(userProfile.wallet.coins / 1000000).toFixed(1)}M`
              : (userProfile?.wallet?.coins || 0).toLocaleString()}
          </span>
          <button className="bg-emerald-400 hover:bg-emerald-500 rounded-full h-8 w-8 flex items-center justify-center text-white text-xl font-bold shadow-md transition-all active:scale-95">
            +
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="bg-[#231545]/80 p-2 rounded-full border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
          <Clock className="h-5 w-5 text-white" />
        </button>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-[#231545]/80 p-2 rounded-full border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </button>
        <button className="bg-[#231545]/80 p-2 rounded-full border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
          <HelpCircle className="h-5 w-5 text-white" />
        </button>
        <button onClick={handleBack} className="bg-[#231545]/80 p-2 rounded-full border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
    </header>

    <div className="relative flex-1 flex flex-col items-center justify-center p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* ROULETTE WHEEL WITH BALL */}
      <div className="relative w-64 h-64 z-10 transition-transform duration-[5000ms] ease-out" style={{ transform: `rotate(-${rotation}deg)` }}>
       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]">
         <circle cx="50" cy="50" r="49" fill="#1e130c" stroke="#d4af37" strokeWidth="1.5" />
         <circle cx="50" cy="50" r="47" fill="#2a1b12" />
         
         {NUMBERS.map((num, i) => {
          const angle = (i * 360) / 37;
          const isRed = RED_NUMBERS.includes(num);
          const isZero = num === 0;
          return (
           <g key={num} transform={`rotate(${angle}, 50, 50)`}>
            <path 
             d="M 50 3 L 53.5 3 L 52 16 L 48 16 Z" 
             fill={isZero ? '#10b981' : isRed ? '#ef4444' : '#1a1a1a'} 
             stroke="#3d2b1f" 
             strokeWidth="0.3"
            />
            <text 
             x="50" y="9" 
             fontSize="3" 
             textAnchor="middle" 
             fill="white" 
             fontWeight="black" 
             transform={`rotate(180, 50, 9)`}
            >
             {num}
            </text>
           </g>
          );
         })}
         
         {/* THE WHITE BALL (Rotates with the wheel) */}
         <circle cx="50" cy="13.5" r="1.8" fill="white" className="drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />

         <circle cx="50" cy="50" r="16" fill="#d4af37" />
         <circle cx="50" cy="50" r="14" fill="#1e130c" />
         <path d="M 50 34 L 50 66 M 34 50 L 66 50" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" />
         <circle cx="50" cy="34" r="2" fill="#d4af37" />
         <circle cx="50" cy="66" r="2" fill="#d4af37" />
         <circle cx="34" cy="50" r="2" fill="#d4af37" />
         <circle cx="66" cy="50" r="2" fill="#d4af37" />
         <circle cx="50" cy="50" r="5" fill="#fcd34d" shadow="0 0 5px rgba(0,0,0,0.5)" />
       </svg>
      </div>

      <div className="absolute top-[calc(50%-136px)] left-1/2 -translate-x-1/2 z-20">
       <div className="w-4 h-6 bg-gradient-to-b from-yellow-300 to-yellow-600 clip-path-triangle shadow-lg border-b-2 border-yellow-800" />
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
       <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col items-center">
         <span className="text-[8px] font-bold text-white/40 uppercase">NEW</span>
         <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center text-xl font-bold shadow-lg",
          RED_NUMBERS.includes(history[0]) ? "bg-red-600" : history[0] === 0 ? "bg-emerald-600" : "bg-slate-900"
         )}>
          {history[0]}
         </div>
         <ChevronDown className="h-3 w-3 text-white/40 mt-1" />
       </div>
       <div className="relative">
         <div className="h-12 w-12 rounded-full border-2 border-white/20 bg-black/40 flex items-center justify-center shadow-xl">
          <span className="text-xl font-bold text-yellow-400">{gameState === 'betting' ? timeLeft : '🎲'}</span>
         </div>
         <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
          <HelpCircle className="h-2 w-2 text-black" />
         </div>
       </div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
       <button className="bg-emerald-500/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-xl active:scale-95 transition-transform text-white">
         <Users className="h-4 w-4" />
         <span className="text-xs font-bold uppercase ">Player</span>
       </button>
      </div>
    </div>

    {/* GAME SHEET MOVED TO BOTTOM */}
    <div className="bg-black/40 backdrop-blur-3xl rounded-t-[2.5rem] p-4 pb-6 border-t border-white/10 shadow-[0_-15px_40px_rgba(0,0,0,0.4)] relative z-40">
      <div className="grid grid-cols-4 gap-2 mb-4">
       {BET_OPTIONS.map((opt) => (
        <button
         key={opt.id}
         onClick={() => handlePlaceBet(opt.id)}
         disabled={gameState !== 'betting'}
         className={cn(
          "relative aspect-[4/3] rounded-xl border transition-all duration-300 flex flex-col items-center justify-center group active:scale-95 overflow-hidden text-white",
          "border-white/10",
          opt.color,
          gameState !== 'betting' && "opacity-60"
         )}
        >
          <div className="absolute top-1 right-2">
           <span className="text-[8px] font-bold text-yellow-400">{(myBets[opt.id] || 0).toLocaleString()}</span>
          </div>
          <h4 className="text-sm font-bold uppercase">{opt.label}</h4>
          <span className="text-[9px] font-medium text-white/50">x{opt.multiplier}</span>
          
          {myBets[opt.id] > 0 && (
           <div className="absolute inset-0 bg-white/10 flex items-center justify-center pointer-events-none">
            <div className="h-6 w-6 rounded-full border border-dashed border-white/30 animate-spin-slow" />
            <div className="absolute bg-yellow-500 text-black rounded-full h-5 w-5 flex items-center justify-center text-[7px] font-black shadow-md">
              {selectedChip >= 1000 ? `${(selectedChip/1000)}k` : selectedChip}
            </div>
           </div>
          )}
        </button>
       ))}
      </div>

      {/* CHIPS AREA */}
      <div className="flex items-center justify-center w-full">
       <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 w-full justify-center px-4">
         {CHIPS.map((chip) => (
          <button
           key={chip.value}
           onClick={() => setSelectedChip(chip.value)}
           className={cn(
            "h-12 w-12 rounded-full border-2 transition-all flex items-center justify-center shrink-0 shadow-lg relative active:scale-90",
            selectedChip === chip.value ? "border-white scale-110 ring-2 ring-white/20 z-10" : "border-white/5 opacity-60",
            chip.color
           )}
          >
           <span className="text-[10px] font-black text-white drop-shadow-sm z-10">{chip.label}</span>
           <div className="absolute inset-1 border border-white/20 rounded-full border-dashed" />
          </button>
         ))}
       </div>
      </div>
    </div>

    <style jsx global>{`
     .no-scrollbar::-webkit-scrollbar { display: none; }
     .clip-path-triangle { clip-path: polygon(50% 100%, 0 0, 100% 0); }
     .animate-spin-slow { animation: spin 10s linear infinite; }
     @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `}</style>
   </div>
  );
}
