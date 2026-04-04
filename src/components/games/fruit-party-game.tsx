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

// --- CONFIG ---
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
 const [hintTargetIdx, setHintTargetIdx] = useState<number>(0);

 // Winners states
 const [winners, setWinners] = useState<any[]>([]);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 // Loading
 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1200);
  return () => clearTimeout(timer);
 }, []);

 // Timer Logic & Random Hinting
 useEffect(() => {
  if (isLaunching) return;
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) {
        setTimeLeft(prev => prev - 1);
        const fruitIndices = ITEMS.filter(item => item.id !== 'timer').map(item => item.index);
        setHintTargetIdx(fruitIndices[Math.floor(Math.random() * fruitIndices.length)]);
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
  
  // Cut coins on placing bet
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
    
    // Credit coins on win
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

 if (isLaunching) return <div className="h-full w-full bg-[#0f071a] flex items-center justify-center text-yellow-400 font-bold">PREPARING 3D FRUIT WORLD...</div>;

 return (
  <div className="flex flex-col h-[100dvh] w-full bg-[#120821] overflow-hidden text-white font-sans selection:bg-pink-500/30">
   
   <AnimatePresence>
    {gameState === 'result' && (
      <div className="fixed inset-0 z-[200]">
        <GameResultOverlay gameId="fruit-party" winningSymbol={winningSymbol} winAmount={totalWinAmount} winners={winners} />
      </div>
    )}
   </AnimatePresence>

   {/* --- 3D HEADER --- */}
   <header className="p-4 pt-6 flex flex-col w-full z-10">
    <div className="flex items-center justify-between w-full mb-6">
      <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10">
        {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
      </button>
      
      {/* Title Added Here */}
      <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 tracking-[0.1em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter">
        FRUIT PARTY
      </h1>

      <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shadow-lg shadow-red-500/5">
        <X size={20}/>
      </button>
    </div>

    {/* Game History moved slightly down */}
    <div className="text-center flex flex-col items-center">
      <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-black">Round History</p>
      <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 shadow-2xl">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {ITEMS.find(it => it.id === id)?.emoji}
          </motion.span>
        ))}
      </div>
    </div>
   </header>

   {/* --- 3D MAIN AREA --- */}
   <main className="flex-1 flex items-center justify-center px-4 relative perspective-1000">
    
    {/* Visualizers with Neon Glow */}
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-end gap-1 h-48">
        {visualizerBars.slice(0, 8).map((height, i) => (
            <motion.div key={i} className="w-1.5 bg-gradient-to-t from-pink-600 to-pink-300 rounded-full shadow-[0_0_15px_pink]" animate={{ height: `${height * 100}%` }} transition={{ repeat: Infinity, duration: 0.3, delay: i*0.05 }} />
        ))}
    </div>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-end gap-1 h-48">
        {visualizerBars.slice(8, 16).map((height, i) => (
            <motion.div key={i} className="w-1.5 bg-gradient-to-t from-blue-600 to-blue-300 rounded-full shadow-[0_0_15px_#3b82f6]" animate={{ height: `${height * 100}%` }} transition={{ repeat: Infinity, duration: 0.3, delay: i*0.05 }} />
        ))}
    </div>

      {/* Main 3D Grid Case */}
      <div className="relative p-2 rounded-[3rem] transform-gpu rotate-x-2">
        {/* Animated Gradient Outer Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-blue-500 to-yellow-400 animate-spin-slow rounded-[3rem] blur-xl opacity-30" />
        
        {/* The 3D Border Case */}
        <div className="relative p-[8px] rounded-[2.8rem] bg-gradient-to-b from-white/20 to-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-blue-500 to-yellow-400 animate-spin-slow rounded-[2.8rem]" />
            
            <div className="relative bg-[#1e0d36] p-5 rounded-[2.5rem] overflow-hidden">
                <div className="grid grid-cols-3 gap-4">
                    {ITEMS.map((item, idx) => {
                    if (item.id === 'timer') {
                        return (
                        <div key="timer" className="w-24 h-24 bg-black/60 rounded-[2rem] flex items-center justify-center border-b-4 border-black shadow-inner">
                            <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }} className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_gold]">
                            {gameState === 'betting' ? timeLeft : '!!!'}
                            </motion.span>
                        </div>
                        );
                    }
                    return (
                        <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.05, translateZ: 20 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePlaceBet(item.id)}
                            className={cn(
                                "relative w-24 h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all",
                                "bg-gradient-to-b from-white/10 to-transparent border-t border-white/20 shadow-xl",
                                "before:absolute before:inset-0 before:rounded-[2rem] before:bg-black/20 before:-z-10",
                                highlightIdx === idx ? "ring-4 ring-yellow-400 shadow-[0_0_40px_gold] brightness-125 z-10" : "opacity-90"
                            )}
                        >
                            <span className="text-5xl mb-1 filter drop-shadow-lg">{item.emoji}</span>
                            <span className="text-[10px] font-black text-white/40 uppercase">{item.label}</span>
                            
                            {myBets[item.id] > 0 && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-xl shadow-lg border-2 border-[#1e0d36]">
                                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'K' : myBets[item.id]}
                                </motion.div>
                            )}
                        </motion.button>
                    );
                    })}
                </div>

                {/* 3D Hint Pointer */}
                <AnimatePresence>
                    {gameState === 'betting' && (
                        <motion.div
                            className="absolute z-50 pointer-events-none"
                            animate={{ 
                                x: (hintTargetIdx % 3) * 112 + 60,
                                y: Math.floor(hintTargetIdx / 3) * 112 + 60
                            }}
                        >
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity }}>
                                <Pointer size={50} className="text-yellow-400 drop-shadow-[0_0_20px_gold] -rotate-45" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>
   </main>

   {/* --- 3D FOOTER --- */}
   <footer className="bg-[#1a0b2e]/90 backdrop-blur-2xl p-6 pb-8 rounded-t-[4rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20">
    <div className="max-w-md mx-auto space-y-5">
      
      {/* 3D Chips Selection (Height reduced to h-11 and moved up slightly via layout) */}
      <div className="flex justify-between gap-3 perspective-500">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "flex-1 h-11 rounded-xl flex items-center justify-center transition-all transform-gpu shadow-2xl",
              "bg-gradient-to-br border-b-[3px] border-black/40",
              chip.color,
              selectedChip === chip.value ? "-translate-y-2 ring-[3px] ring-white" : "opacity-40 grayscale-[0.5]"
            )}
          >
            <span className="text-white font-black text-xs drop-shadow-md">{chip.label}</span>
          </button>
        ))}
      </div>

      {/* User ID & Coin Balance 3D Card */}
      <div className="relative group overflow-hidden bg-gradient-to-r from-black/60 to-black/30 p-5 rounded-[2rem] border border-white/10 shadow-inner">
        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
                <div className="bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] p-3 rounded-2xl rotate-12 flex-shrink-0">
                    <GoldCoinIcon className="h-6 w-6 text-black" />
                </div>
                <div className="flex flex-col">
                    {/* ID Shown Here */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-white/10 px-2 py-0.5 rounded text-[9px] text-white/60 font-black uppercase tracking-wider">
                        ID: {currentUser?.uid ? currentUser.uid.slice(0, 8).toUpperCase() : 'GUEST'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none mb-1">Available Coins</p>
                    <p className="text-2xl font-black text-yellow-400 drop-shadow-md italic leading-none mt-1">
                      {(userProfile?.wallet?.coins || 0).toLocaleString()}
                    </p>
                </div>
            </div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                <Pointer size={24} className="text-white/10" />
            </motion.div>
        </div>
      </div>

    </div>
   </footer>

   <style jsx global>{`
     .perspective-1000 { perspective: 1000px; }
     .perspective-500 { perspective: 500px; }
     .rotate-x-2 { transform: rotateX(10deg); }
     @keyframes spin-slow {
       from { transform: rotate(0deg); }
       to { transform: rotate(360deg); }
     }
     .animate-spin-slow {
       animation: spin-slow 10s linear infinite;
     }
   `}</style>
  </div>
 );
}
