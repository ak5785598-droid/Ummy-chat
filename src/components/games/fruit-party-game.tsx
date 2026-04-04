'use client';

import { useState, useEffect, useMemo } from 'react';
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
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '×5', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-700' },
  { value: 5000, label: '5,000', color: 'from-rose-400 to-rose-700' },
  { value: 50000, label: '50,000', color: 'from-blue-400 to-blue-700' },
  { value: 500000, label: '500,000', color: 'from-purple-400 to-purple-700' },
];

// --- Growing/Falling Fruit on Branches ---
const BranchFruit = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: -10 }}
    animate={{ 
      scale: [0, 1.2, 1, 1, 0], 
      opacity: [0, 1, 1, 1, 0],
      y: [0, 0, 0, 50, 100],
      rotate: [0, 0, 0, 15, 45]
    }}
    transition={{ 
      duration: 5, 
      repeat: Infinity, 
      delay: delay,
      times: [0, 0.1, 0.7, 0.85, 1] 
    }}
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

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(500);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['apple', 'grapes', 'lemon', 'mango']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 
 // Hand Icon Sequential Movement
 const [hintStep, setHintStep] = useState(0);
 const sequenceIndices = [0, 1, 2, 5, 8, 7, 6, 3]; // Circular order around the timer

 const [winners, setWinners] = useState<any[]>([]);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1200);
  return () => clearTimeout(timer);
 }, []);

 // Hand Icon Movement Logic (Moves every 1 second through 1-8 fruits)
 useEffect(() => {
  if (gameState !== 'betting') return;
  const hintInterval = setInterval(() => {
    setHintStep(prev => (prev + 1) % sequenceIndices.length);
  }, 1000);
  return () => clearInterval(hintInterval);
 }, [gameState]);

 useEffect(() => {
  if (isLaunching) return;
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) {
        setTimeLeft(prev => prev - 1);
    } else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft, isLaunching]);

 const handlePlaceBet = (id: string) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser || !userProfile) return;
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

 if (isLaunching) return <div className="h-full w-full bg-[#0f071a] flex items-center justify-center text-yellow-400 font-bold tracking-widest">LOADING FRUIT PARADISE...</div>;

 return (
  <div className="fixed inset-0 flex flex-col bg-[#120821] overflow-hidden text-white font-sans">
   
   <AnimatePresence>
    {gameState === 'result' && (
      <div className="fixed inset-0 z-[200]">
        <GameResultOverlay gameId="fruit-party" winningSymbol={winningSymbol} winAmount={totalWinAmount} winners={winners} />
      </div>
    )}
   </AnimatePresence>

   {/* --- GREEN TREE BRANCHES HEADER --- */}
   <header className="relative px-4 pt-6 pb-2 flex flex-col items-center w-full z-30">
      {/* Decorative Green Branches */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-visible pointer-events-none flex justify-between">
          {/* Left Green Branch */}
          <div className="relative -ml-4">
            <svg width="160" height="100" viewBox="0 0 160 100" className="drop-shadow-lg">
              <path d="M0 0 Q 40 10, 60 50 T 140 80" stroke="#2d5a27" strokeWidth="8" fill="transparent" strokeLinecap="round" />
              <circle cx="60" cy="50" r="6" fill="#4ade80" />
              <circle cx="100" cy="65" r="5" fill="#22c55e" />
              <circle cx="130" cy="75" r="7" fill="#16a34a" />
            </svg>
            <div className="absolute top-12 left-16 flex flex-col gap-2">
               <BranchFruit emoji="🍋" delay={0} />
               <BranchFruit emoji="🍓" delay={2} />
            </div>
          </div>
          {/* Right Green Branch */}
          <div className="relative -mr-4 scale-x-[-1]">
            <svg width="160" height="100" viewBox="0 0 160 100" className="drop-shadow-lg">
              <path d="M0 0 Q 40 10, 60 50 T 140 80" stroke="#2d5a27" strokeWidth="8" fill="transparent" strokeLinecap="round" />
              <circle cx="70" cy="45" r="6" fill="#4ade80" />
              <circle cx="110" cy="70" r="5" fill="#22c55e" />
            </svg>
            <div className="absolute top-10 left-20 flex flex-col gap-2">
               <BranchFruit emoji="🍎" delay={1} />
               <BranchFruit emoji="🍊" delay={3} />
            </div>
          </div>
      </div>

      <div className="flex items-center justify-between w-full relative z-40">
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
        </button>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400 tracking-[0.1em] drop-shadow-xl">
          FRUIT PARTY
        </h1>
        <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 backdrop-blur-md">
          <X size={20}/>
        </button>
      </div>
   </header>

   {/* --- MAIN GAME AREA --- */}
   <main className="flex-1 flex flex-col items-center justify-center px-4 relative perspective-1000">
    
    <div className="text-center flex flex-col items-center mb-4 z-10">
      <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-black">Round History</p>
      <div className="flex gap-2 bg-black/40 p-2 px-4 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-xl">
            {ITEMS.find(it => it.id === id)?.emoji}
          </motion.span>
        ))}
      </div>
    </div>

    <div className="relative flex justify-center items-center w-full max-w-[360px]">
        {/* Visualizers Side Decor */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex items-end gap-1 h-40">
            {visualizerBars.slice(0, 6).map((height, i) => (
                <motion.div key={i} className="w-1 bg-green-500/40 rounded-full" animate={{ height: `${height * 100}%` }} transition={{ repeat: Infinity, duration: 0.4, delay: i*0.1 }} />
            ))}
        </div>

        {/* Main Grid Case */}
        <div className="relative p-2 rounded-[3rem] z-10 w-full max-w-[320px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 via-blue-500/20 to-yellow-500/20 blur-2xl opacity-50" />
            <div className="relative p-[10px] rounded-[2.8rem] bg-white/10 shadow-2xl border border-white/20">
                <div className="relative bg-[#1a0b2e] p-4 rounded-[2.5rem] overflow-hidden border border-black/40">
                    <div className="grid grid-cols-3 gap-3">
                        {ITEMS.map((item, idx) => {
                        if (item.id === 'timer') {
                            return (
                            <div key="timer" className="w-full aspect-square bg-black/80 rounded-[1.8rem] flex items-center justify-center border-b-4 border-white/5 shadow-inner">
                                <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }} className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                {gameState === 'betting' ? timeLeft : '!!!'}
                                </motion.span>
                            </div>
                            );
                        }
                        
                        // Hand Icon Target logic
                        const isHandTarget = gameState === 'betting' && sequenceIndices[hintStep] === idx;

                        return (
                            <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePlaceBet(item.id)}
                                className={cn(
                                    "relative w-full aspect-square rounded-[1.8rem] flex flex-col items-center justify-center transition-all duration-300",
                                    "bg-gradient-to-b from-white/10 to-transparent border-t border-white/10 shadow-lg",
                                    highlightIdx === idx ? "ring-4 ring-yellow-400 shadow-[0_0_30px_gold] brightness-125 z-10" : "opacity-90"
                                )}
                            >
                                <span className="text-[2.5rem] mb-1 filter drop-shadow-md">{item.emoji}</span>
                                <span className="text-[9px] font-black text-white/30 uppercase">{item.label}</span>
                                
                                {myBets[item.id] > 0 && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-xl shadow-lg border-2 border-[#1e0d36]">
                                        {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'K' : myBets[item.id]}
                                    </motion.div>
                                )}

                                {/* WHITE HAND ICON - Sequential Movement */}
                                <AnimatePresence>
                                    {isHandTarget && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                                        >
                                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                                                <Pointer size={40} className="text-white fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] -rotate-45" />
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
   </main>

   {/* --- FOOTER --- */}
   <footer className="bg-[#1a0b2e] p-5 pb-8 rounded-t-[3rem] border-t border-white/10 shadow-2xl z-20">
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex justify-between gap-2">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "flex-1 h-12 rounded-2xl flex items-center justify-center transition-all transform",
              "bg-gradient-to-br border-b-4 border-black/40 shadow-xl",
              chip.color,
              selectedChip === chip.value ? "-translate-y-2 ring-2 ring-white" : "opacity-40"
            )}
          >
            <span className="text-white font-black text-xs drop-shadow-md">{chip.label}</span>
          </button>
        ))}
      </div>

      <div className="relative bg-white/5 p-4 rounded-[2rem] border border-white/10">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-yellow-400 p-3 rounded-2xl shadow-lg rotate-12">
                    <GoldCoinIcon className="h-5 w-5 text-black" />
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Total Balance</p>
                    <p className="text-2xl font-black text-yellow-400 italic">
                      {(userProfile?.wallet?.coins || 0).toLocaleString()}
                    </p>
                </div>
            </div>
            <div className="text-[10px] text-white/20 font-mono">
              {currentUser?.uid?.slice(0, 8).toUpperCase()}
            </div>
        </div>
      </div>
    </div>
   </footer>

   <style jsx global>{`
     .perspective-1000 { perspective: 1000px; }
     @keyframes float {
       0%, 100% { transform: translateY(0px); }
       50% { transform: translateY(-10px); }
     }
   `}</style>
  </div>
 );
}
