'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 X, Volume2, VolumeX, Pointer
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay } from '@/components/game-result-overlay';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5', index: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '×10', index: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '×5', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '×45', index: 3 },
  { id: 'timer', emoji: '', multiplier: 0, label: '', index: 4 }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '×25', index: 5 },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '×6', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-700' },
  { value: 5000, label: '5,000', color: 'from-rose-400 to-rose-700' },
  { value: 50000, label: '50,000', color: 'from-blue-400 to-blue-700' },
  { value: 500000, label: '500,000', color: 'from-purple-400 to-purple-700' },
];

const FallingFruit = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1, 1, 0], 
      opacity: [0, 1, 1, 0],
      y: [0, 0, 0, 120],
      rotate: [0, 15, -15, 45]
    }}
    transition={{ duration: 4, repeat: Infinity, delay: delay, times: [0, 0.2, 0.8, 1] }}
    className="text-2xl filter drop-shadow-md"
  >
    {emoji}
  </motion.div>
);

export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();
 
 // Audio Ref for Betting Sound
 const betSound = useRef<HTMLAudioElement | null>(null);

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(500);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['apple', 'grapes', 'lemon', 'mango']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 const [hintTargetIdx, setHintTargetIdx] = useState<number>(0);

 const [winners, setWinners] = useState<any[]>([]);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 useEffect(() => {
  betSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); // Subtle click sound
  const timer = setTimeout(() => setIsLaunching(false), 1200);
  return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const hintInterval = setInterval(() => {
    const fruitIndices = ITEMS.filter(item => item.id !== 'timer').map(item => item.index);
    setHintTargetIdx(fruitIndices[Math.floor(Math.random() * fruitIndices.length)]);
  }, 3000);
  return () => clearInterval(hintInterval);
 }, [gameState]);

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

 const handlePlaceBet = (id: string) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser || !userProfile) return;
  
  if (!isMuted && betSound.current) {
    betSound.current.currentTime = 0;
    betSound.current.play().catch(() => {});
  }

  const currentBalance = userProfile.wallet?.coins || 0;
  if (currentBalance < selectedChip) {
   toast({ title: 'Insufficient Coins!', variant: 'destructive' });
   return;
  }
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 
    'wallet.coins': increment(-selectedChip) 
  });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  const validItems = ITEMS.filter(i => i.id !== 'timer');
  const winningItem = validItems[Math.floor(Math.random() * validItems.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winningItem.id);
  const spinSequence = [0, 1, 2, 5, 8, 7, 6, 3]; 
  let currentStep = 0;
  const totalSteps = (spinSequence.length * 4) + spinSequence.indexOf(targetIdx);
  let speed = 60;

  const runAnimation = () => {
   setHighlightIdx(spinSequence[currentStep % spinSequence.length]);
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 10) speed += 40;
    setTimeout(runAnimation, speed);
   } else {
    setTimeout(() => finalizeResult(winningItem), 800);
   }
  };
  runAnimation();
 };

 const finalizeResult = (winItem: any) => {
  const betOnThis = myBets[winItem.id] || 0;
  const winAmount = betOnThis * winItem.multiplier;
  setWinningSymbol(winItem.emoji);
  setTotalWinAmount(winAmount);
  setHistory(prev => [winItem.id, ...prev].slice(0, 10));
  const currentWinners = [];
  if (winAmount > 0 && userProfile) {
    currentWinners.push({ name: userProfile.username || 'You', win: winAmount, avatar: userProfile.avatarUrl, isMe: true });
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 
      'wallet.coins': increment(winAmount),
      updatedAt: serverTimestamp()
    });
  }
  setWinners(currentWinners);
  setGameState('result');
  setTimeout(() => {
   setMyBets({});
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(30);
  }, 5000);
 };

 const visualizerBars = useMemo(() => Array.from({ length: 16 }).map(() => Math.random()), []);

 if (isLaunching) return <div className="h-full w-full bg-[#0f071a] flex items-center justify-center text-yellow-400 font-bold">BOOTING MACHINE...</div>;

 return (
  <div className="fixed inset-0 flex flex-col bg-[#0d041a] overflow-hidden text-white font-sans">
   
   <AnimatePresence>
    {gameState === 'result' && (
      <div className="fixed inset-0 z-[200]">
        <GameResultOverlay gameId="fruit-party" winningSymbol={winningSymbol} winAmount={totalWinAmount} winners={winners} />
      </div>
    )}
   </AnimatePresence>

   {/* --- ATM MACHINE HEADER WITH THICK GREEN BRANCHES --- */}
   <header className="relative px-4 pt-6 pb-2 flex flex-col items-center w-full z-10">
      <div className="absolute top-12 left-0 right-0 h-24 overflow-visible pointer-events-none flex justify-between px-6">
          {/* Left Branch with Leaves */}
          <div className="relative">
            <svg width="150" height="80" viewBox="0 0 150 80" className="drop-shadow-lg">
              <path d="M0 20 Q 50 10, 100 50 T 150 20" stroke="#3d2616" strokeWidth="8" fill="transparent" strokeLinecap="round" />
              <path d="M30 15 Q 35 5, 45 15" fill="#22c55e" /> {/* Leaf 1 */}
              <path d="M70 25 Q 75 15, 85 25" fill="#16a34a" /> {/* Leaf 2 */}
              <path d="M110 35 Q 115 25, 125 35" fill="#22c55e" /> {/* Leaf 3 */}
            </svg>
            <div className="absolute top-4 left-12 flex gap-6">
               <FallingFruit emoji="🍎" delay={0} />
               <FallingFruit emoji="🍇" delay={2} />
            </div>
          </div>
          {/* Right Branch with Leaves */}
          <div className="relative scale-x-[-1]">
            <svg width="150" height="80" viewBox="0 0 150 80" className="drop-shadow-lg">
              <path d="M0 20 Q 50 10, 100 50 T 150 20" stroke="#3d2616" strokeWidth="8" fill="transparent" strokeLinecap="round" />
              <path d="M40 10 Q 45 0, 55 10" fill="#22c55e" />
              <path d="M90 30 Q 95 20, 105 30" fill="#16a34a" />
            </svg>
            <div className="absolute top-4 left-12 flex gap-6">
               <FallingFruit emoji="🥭" delay={1} />
               <FallingFruit emoji="🍎" delay={3} />
            </div>
          </div>
      </div>

      <div className="flex items-center justify-between w-full bg-black/20 p-2 rounded-2xl backdrop-blur-md border border-white/5">
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-xl">
          {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
        </button>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600 tracking-tighter italic drop-shadow-xl">
          FRUIT PARTY
        </h1>
        <button onClick={onClose} className="p-3 bg-red-500/20 text-red-500 rounded-xl">
          <X size={20}/>
        </button>
      </div>
   </header>

   {/* --- ATM MACHINE BODY --- */}
   <main className="flex-1 flex flex-col items-center justify-center px-4 relative perspective-1000">
    
    <div className="relative flex justify-center items-center w-full max-w-[380px]">
        {/* Machine Side Pillars (ATM Design) */}
        <div className="absolute -left-4 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-800 to-gray-600 rounded-full border-r-2 border-white/10 shadow-2xl z-0" />
        <div className="absolute -right-4 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-800 to-gray-600 rounded-full border-l-2 border-white/10 shadow-2xl z-0" />

        {/* Golden Machine Slot Container */}
        <div className="relative p-2 rounded-[2.5rem] bg-gradient-to-b from-yellow-600 via-yellow-400 to-yellow-800 shadow-[0_0_50px_rgba(234,179,8,0.3)] border-4 border-yellow-200/30">
            
            {/* Inner Glass Display */}
            <div className="relative bg-[#1e0d36] p-4 rounded-[2rem] overflow-hidden shadow-inner border-2 border-black/40">
                
                {/* Visualizer Neon Lights */}
                <div className="absolute left-1 top-10 bottom-10 flex flex-col gap-1 opacity-30">
                  {visualizerBars.slice(0, 8).map((h, i) => <div key={i} className="w-1 bg-blue-400 rounded-full" style={{height: h*20}} />)}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {ITEMS.map((item, idx) => {
                    if (item.id === 'timer') {
                        return (
                        <div key="timer" className="w-full aspect-square bg-black/80 rounded-3xl flex items-center justify-center border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }} className="text-5xl font-black text-yellow-400 font-mono">
                            {gameState === 'betting' ? timeLeft : 'SPIN'}
                            </motion.span>
                        </div>
                        );
                    }
                    return (
                        <motion.button
                            key={item.id}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePlaceBet(item.id)}
                            className={cn(
                                "relative w-full aspect-square rounded-3xl flex flex-col items-center justify-center transition-all",
                                "bg-purple-900/40 backdrop-blur-xl border border-white/10 shadow-lg", // Glass Effect
                                highlightIdx === idx ? "bg-yellow-400 scale-105 shadow-[0_0_30px_gold] z-10 border-white" : "hover:bg-purple-800/60"
                            )}
                        >
                            <span className="text-[2.8rem] filter drop-shadow-md">{item.emoji}</span>
                            <span className="text-[10px] font-bold text-yellow-400/80">{item.label}</span>
                            {myBets[item.id] > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg border border-white/20">
                                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'K' : myBets[item.id]}
                                </div>
                            )}
                        </motion.button>
                    );
                    })}
                </div>

                {/* ANIMATED HAND POINTER (Refined) */}
                <AnimatePresence>
                    {gameState === 'betting' && (
                        <motion.div
                            className="absolute z-50 pointer-events-none"
                            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                            animate={{ 
                                x: (hintTargetIdx % 3) * 105 + 50,
                                y: Math.floor(hintTargetIdx / 3) * 105 + 50
                            }}
                        >
                            <motion.div animate={{ scale: [1, 0.8, 1], y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                <Pointer size={45} className="text-white fill-white drop-shadow-[0_0_10px_black] -rotate-12" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
   </main>

   {/* --- ATM CONTROL FOOTER --- */}
   <footer className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-t-[3rem] border-t-4 border-yellow-600/30 shadow-2xl z-20">
    <div className="max-w-md mx-auto space-y-6">
      
      <div className="flex justify-between gap-2">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "flex-1 h-12 rounded-2xl flex items-center justify-center transition-all border-b-4 border-black/50 shadow-xl",
              chip.color,
              selectedChip === chip.value ? "-translate-y-1 ring-2 ring-white scale-105" : "opacity-50 grayscale"
            )}
          >
            <span className="text-white font-black text-sm">{chip.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-black/40 p-4 rounded-3xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500 rounded-2xl shadow-lg">
                    <GoldCoinIcon className="h-6 w-6 text-black" />
                </div>
                <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Balance</p>
                    <p className="text-2xl font-black text-yellow-400 italic">
                      {(userProfile?.wallet?.coins || 0).toLocaleString()}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/60">ID: {currentUser?.uid?.slice(0,6)}</span>
            </div>
      </div>
    </div>
   </footer>

   <style jsx global>{`
     .perspective-1000 { perspective: 1000px; }
     @keyframes spin-slow {
       from { transform: rotate(0deg); }
       to { transform: rotate(360deg); }
     }
     .animate-spin-slow {
       animation: spin-slow 15s linear infinite;
     }
   `}</style>
  </div>
 );
}
