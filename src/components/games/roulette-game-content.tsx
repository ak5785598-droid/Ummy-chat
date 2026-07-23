'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase, addDocumentNonBlocking, useCollection } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, runTransaction, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { GameResultOverlay } from '@/components/game-result-overlay';
import Image from 'next/image';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { GoldCoinIcon } from '@/components/icons';
import { 
  Move, 
  VolumeX, 
  Volume2, 
  X, 
  ChevronDown, 
  HelpCircle, 
  Users 
} from 'lucide-react';
import { CompactRoomView } from '@/components/compact-room-view';
import { cn } from '@/lib/utils';

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
  roomId?: string;
}

export function RouletteGameContent({ isOverlay = false, onClose, roomId }: RouletteGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  // Shared round doc for real-time sync across room members
  const roundDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'games', `roulette_${roomId || 'global'}`);
  }, [firestore, roomId]);
  const { data: roundData } = useDoc(roundDocRef);

  // Derive synced state from roundData, fall back to local
  const gameState = (roundData?.status as 'betting' | 'spinning' | 'result') || 'betting';
  const syncedWinningNumber = roundData?.winningNumber ?? null;
  const syncedRotation = roundData?.rotation ?? 0;
  const syncedHistory: number[] = roundData?.history ?? [16, 2, 34, 17, 0, 25, 11];
  const [localRoundStart] = useState(Date.now());
  const effectiveRoundStart = roundData?.roundStartTime ?? localRoundStart;
  const timeLeft = Math.max(0, 15 - Math.floor((Date.now() - effectiveRoundStart) / 1000));

  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [lastBets, setLastBets] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);
  const [localWinningNumber, setLocalWinningNumber] = useState<number | null>(null);
  const [totalWinAmount, setTotalWinAmount] = useState(0);
  const spinInitiatedRef = useRef(false);
  const myBetsRef = useRef(myBets);
  myBetsRef.current = myBets;
  const [, forceRender] = useState(0);
  useEffect(() => { const iv = setInterval(() => forceRender(n => n + 1), 1000); return () => clearInterval(iv); }, []);

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

  // Sync local state from roundData + calculate win amount
  useEffect(() => {
    if (!roundData) return;
    if (roundData.winningNumber != null) {
      setLocalWinningNumber(roundData.winningNumber);
      // Calculate win amount locally from shared winning number
      const bets = myBetsRef.current;
      const num = roundData.winningNumber;
      const isRed = RED_NUMBERS.includes(num);
      const isBlack = num !== 0 && !isRed;
      const isSingle = num % 2 !== 0;
      const isDouble = num !== 0 && num % 2 === 0;
      let wa = 0;
      if (num === 0) wa += (bets['0'] || 0) * 36;
      if (num >= 1 && num <= 12) wa += (bets['1-12'] || 0) * 3;
      if (num >= 13 && num <= 24) wa += (bets['13-24'] || 0) * 3;
      if (num >= 25 && num <= 36) wa += (bets['25-36'] || 0) * 3;
      if (isRed) wa += (bets['red'] || 0) * 2;
      if (isBlack) wa += (bets['black'] || 0) * 2;
      if (isSingle) wa += (bets['single'] || 0) * 2;
      if (isDouble) wa += (bets['double'] || 0) * 2;
      setTotalWinAmount(wa);

      // Show winners from global feed
      setWinners((liveWins || []).map((w: any) => ({
        name: w.username,
        win: w.amount,
        avatar: w.avatarUrl,
        isMe: w.userId === currentUser?.uid
      })));

      // Credit winnings
      if (wa > 0 && currentUser && firestore && userProfile) {
        const userRef = doc(firestore, 'users', currentUser.uid);
        const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
        runTransaction(firestore as any, async (tx: any) => {
          const updateData = {
            'wallet.coins': increment(wa),
            'stats.dailyGameWins': increment(wa),
            'stats.weeklyGameWins': increment(wa),
            'stats.monthlyGameWins': increment(wa),
            updatedAt: serverTimestamp()
          };
          tx.update(userRef, updateData);
          tx.update(profileRef, updateData);
        }).catch(() => {});
        addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
          gameId: 'roulette',
          userId: currentUser.uid,
          username: userProfile?.username || 'Guest',
          avatarUrl: userProfile?.avatarUrl || null,
          amount: wa,
          timestamp: serverTimestamp()
        });
        const questRef = doc(firestore, 'users', currentUser.uid, 'quests', 'win_game');
        updateDocumentNonBlocking(questRef, { current: increment(1), updatedAt: serverTimestamp() });
      }
    }
    if (roundData.history) {
      setLastBets(myBetsRef.current);
      setMyBets({});
    }
  }, [roundData]);

  // Timer & round init: derive from roundStartTime, write to Firestore when expired
  useEffect(() => {
    if (isLaunching || !roundDocRef || !firestore) return;
    if (gameState !== 'betting') { spinInitiatedRef.current = false; return; }
    if (timeLeft > 0) return;

    // Time's up — one client writes the spin via transaction
    if (spinInitiatedRef.current) return;
    spinInitiatedRef.current = true;

    const spinNumRef = { current: 0 };
    (async () => {
      let targetNum: number;
      try {
        const bytes = new Uint32Array(1);
        crypto.getRandomValues(bytes);
        targetNum = NUMBERS[bytes[0] % NUMBERS.length];
        const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'roulette'));
        if (oracleSnap.exists() && oracleSnap.data().isActive && NUMBERS.includes(oracleSnap.data().forcedResult)) {
          targetNum = oracleSnap.data().forcedResult;
        }
      } catch (_e) {
        targetNum = NUMBERS[0];
      }
      spinNumRef.current = targetNum;

      const targetIdx = NUMBERS.indexOf(targetNum);
      const sliceDeg = 360 / 37;
      const extraBytes = new Uint8Array(1);
      crypto.getRandomValues(extraBytes);
      const extraSpins = 5 + (extraBytes[0] % 5);
      const newRotation = syncedRotation + (extraSpins * 360) + (targetIdx * sliceDeg);

      runTransaction(firestore as any, async (tx: any) => {
        const snap = await tx.get(roundDocRef);
        if (snap.exists() && snap.data().status !== 'betting') return;
        tx.set(roundDocRef, {
          status: 'spinning',
          winningNumber: targetNum,
          rotation: newRotation,
          history: syncedHistory,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }).catch(() => { spinInitiatedRef.current = false; });
    })();

    // After 5s spin animation, set result
    setTimeout(() => {
      const n = spinNumRef.current;
      runTransaction(firestore as any, async (tx: any) => {
        const snap = await tx.get(roundDocRef);
        if (!snap.exists() || snap.data().status !== 'spinning') return;
        tx.set(roundDocRef, {
          status: 'result',
          winningNumber: n,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }).catch(() => {});
    }, 5000);

    // After 5s result display, reset to betting
    setTimeout(() => {
      const n = spinNumRef.current;
      runTransaction(firestore as any, async (tx: any) => {
        const snap = await tx.get(roundDocRef);
        if (!snap.exists() || snap.data().status !== 'result') return;
        tx.set(roundDocRef, {
          status: 'betting',
          winningNumber: null,
          history: [n, ...syncedHistory].slice(0, 15),
          roundStartTime: Date.now(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }).catch(() => {});
      spinInitiatedRef.current = false;
    }, 10000);
  }, [gameState, timeLeft, isLaunching, roundDocRef, firestore, syncedRotation, syncedHistory]);

  // Removed: startSpin and showResult moved to Firestore-driven effect above

  const handlePlaceBet = (id: string) => {
   if (gameState !== 'betting' || !currentUser || !userProfile) return;
   if ((userProfile.wallet?.coins || 0) < selectedChip) {
    toast({ variant: 'destructive', title: 'Insufficient Coins' });
    return;
   }
   
   playBetSound();
   const userRef = doc(firestore, 'users', currentUser.uid);
   const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
   runTransaction(firestore as any, async (tx: any) => {
     const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
     tx.update(userRef, updateData);
     tx.update(profileRef, updateData);
   }).catch(() => {});
   setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };


  const displayWinningNumber = syncedWinningNumber ?? localWinningNumber;
  const winningNumberBadge = displayWinningNumber !== null ? (
   <div className={cn(
    "h-16 w-16 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white shadow-xl",
    RED_NUMBERS.includes(displayWinningNumber) ? "bg-red-600" : displayWinningNumber === 0 ? "bg-emerald-600" : "bg-slate-900"
   )}>
    {displayWinningNumber}
   </div>
  ) : null;

  return (
   <motion.div 
     drag
     dragControls={dragControls}
     dragListener={false}
     dragMomentum={false}
     initial={isOverlay ? { y: '35%' } : {}}
     className={cn(
       "h-fit max-h-[95vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#311b92] text-white select-none rounded-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
       !isOverlay && "min-h-screen"
     )}
   >
    <CompactRoomView />

    <div className="absolute inset-0 z-0 pointer-events-none">
      {gameData?.backgroundUrl ? (
       <Image key={gameData.backgroundUrl} src={gameData.backgroundUrl} alt="Casino Theme" fill className="object-cover opacity-40 animate-in fade-in duration-1000" unoptimized />
      ) : (
       <div className="absolute inset-0 bg-gradient-to-b from-[#4a148c] via-[#311b92] to-[#1a237e]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#311b92] z-10" />
    </div>

    {gameState === 'result' && (syncedWinningNumber ?? localWinningNumber) !== null && (
     <GameResultOverlay 
       gameId="roulette"
       winningSymbol={winningNumberBadge} 
       winAmount={totalWinAmount} 
       winners={winners} 
      />
    )}

    {/* MATCHED NEW HEADER DESIGN */}
    <header className="relative z-50 flex items-center justify-between p-4 pt-8 shrink-0">
      
      <div className="flex items-center gap-2">
        <button 
          onPointerDown={(e) => dragControls.start(e)}
          className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-grab active:cursor-grabbing text-white/80"
        >
          <Move className="h-4.5 w-4.5" />
        </button>
        {/* Left: Balance Pill */}
        <div className="bg-[#24133d] border border-white/10 rounded-full flex items-center p-1 pl-1.5 pr-1.5 shadow-lg h-10">
          <GoldCoinIcon className="h-6 w-6" />
          <span className="text-white font-bold text-[12px] px-2">
            {(userProfile?.wallet?.coins || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex gap-1.5 text-white">
        <button onClick={() => setIsMuted(!isMuted)} className="bg-[#24133d] border border-white/10 h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg active:scale-95 transition-transform">
          {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
        </button>
        <button onClick={handleBack} className="bg-red-500/10 border border-red-500/20 h-10 w-10 rounded-xl flex items-center justify-center text-red-500 shadow-lg active:scale-95 transition-transform">
          <X className="h-4.5 w-4.5 font-bold" />
        </button>
      </div>

    </header>

    <div className="relative flex-1 flex flex-col items-center justify-center p-4 min-h-[300px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative w-64 h-64 z-10 transition-transform duration-[5000ms] ease-out" style={{ transform: `rotate(-${syncedRotation}deg)` }}>
       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
         <circle cx="50" cy="50" r="48" fill="#3d2b1f" stroke="#b88a44" strokeWidth="4" />
         {NUMBERS.map((num, i) => {
          const angle = (i * 360) / 37;
          const isRed = RED_NUMBERS.includes(num);
          const isZero = num === 0;
          return (
           <g key={num} transform={`rotate(${angle}, 50, 50)`}>
            <path 
             d="M 50 2 L 54 2 L 52 15 L 48 15 Z" 
             fill={isZero ? '#10b981' : isRed ? '#ef4444' : '#1a1a1a'} 
             stroke="#3d2b1f" 
             strokeWidth="0.2"
            />
            <text 
             x="50" y="8" 
             fontSize="3" 
             textAnchor="middle" 
             fill="white" 
             fontWeight="black" 
             transform={`rotate(180, 50, 8)`}
            >
             {num}
            </text>
           </g>
          );
         })}
         <circle cx="50" cy="50" r="15" fill="#b88a44" />
         <circle cx="50" cy="50" r="12" fill="#3d2b1f" opacity="0.2" />
         <path d="M 50 35 L 50 65 M 35 50 L 65 50" stroke="#b88a44" strokeWidth="3" strokeLinecap="round" />
         <circle cx="50" cy="35" r="2" fill="#b88a44" />
         <circle cx="50" cy="65" r="2" fill="#b88a44" />
         <circle cx="35" cy="50" r="2" fill="#b88a44" />
         <circle cx="65" cy="50" r="2" fill="#b88a44" />
         <circle cx="50" cy="50" r="4" fill="#fcd34d" />
       </svg>
      </div>

      <div className="absolute top-[calc(50%-132px)] left-1/2 -translate-x-1/2 z-20">
       <div className="w-4 h-6 bg-yellow-400 clip-path-triangle" />
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
       <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col items-center">
         <span className="text-[8px] font-bold text-white/40 uppercase">NEW</span>
          <div className={cn(
           "h-10 w-10 rounded-lg flex items-center justify-center text-xl font-bold shadow-lg",
            RED_NUMBERS.includes(syncedHistory[0]) ? "bg-red-600" : syncedHistory[0] === 0 ? "bg-emerald-600" : "bg-slate-900"
           )}>
            {syncedHistory[0]}
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

    {/* BOTTOM SHEET - Set to mt-auto to stay completely at the bottom */}
    <div className="bg-emerald-600/20 backdrop-blur-3xl rounded-t-[2rem] p-4 pb-6 mt-auto border-t-2 border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] relative z-40 w-full">
      <div className="grid grid-cols-4 gap-2 mb-4">
       {BET_OPTIONS.map((opt) => (
        <button
         key={opt.id}
         onClick={() => handlePlaceBet(opt.id)}
         disabled={gameState !== 'betting'}
         className={cn(
          "relative aspect-[4/3] rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-0.5 group active:scale-95 overflow-hidden text-white",
          "border-white/5",
          opt.color,
          gameState !== 'betting' && "opacity-60"
         )}
        >
          <div className="absolute top-1 right-2 flex items-center gap-0.5">
           <span className="text-[8px] font-bold text-yellow-400">{(myBets[opt.id] || 0).toLocaleString()}</span>
          </div>
          <h4 className="text-base font-bold uppercase tracking-tight">{opt.label}</h4>
          <span className="text-[10px] font-bold text-white/60">x{opt.multiplier}</span>
          
          {myBets[opt.id] > 0 && (
           <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center pointer-events-none">
            <div className="h-8 w-8 rounded-full border-2 border-dashed border-yellow-400/40 animate-spin-slow" />
            <div className="absolute bg-white text-blue-600 rounded-full h-6 w-6 flex items-center justify-center text-[8px] font-bold shadow-lg">
              {selectedChip >= 1000 ? `${(selectedChip/1000)}k` : selectedChip}
            </div>
           </div>
          )}
        </button>
       ))}
      </div>

      {/* FOOTER CHIPS (Cleaned up, no balance card, no repeat button) */}
      <div className="flex items-center justify-center w-full">
       <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-2 w-full max-w-full">
         {CHIPS.map((chip) => (
          <button
           key={chip.value}
           onClick={() => setSelectedChip(chip.value)}
           className={cn(
            "h-12 w-12 rounded-full border-2 transition-all flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group active:scale-90",
            selectedChip === chip.value ? "border-white scale-110 ring-4 ring-white/20 z-10" : "border-white/10 opacity-60 grayscale-[0.2]",
            chip.color
           )}
          >
           <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
           <span className="text-[10px] font-bold text-white drop-shadow-md">{chip.label}</span>
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
   </motion.div>
  );
}

