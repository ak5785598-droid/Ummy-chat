'use client';

import { useState, useEffect, useRef } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { 
 X, Volume2, VolumeX, Pointer, Trophy, Music, Loader2, HelpCircle
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '5×', color: 'from-yellow-400 to-amber-600', index: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '10×', color: 'from-purple-400 to-indigo-600', index: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '5×', color: 'from-orange-400 to-red-600', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '45×', color: 'from-rose-400 to-red-700', index: 3 },
  { id: 'timer', emoji: '', multiplier: 0, label: '', color: '', index: 4 }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '25×', color: 'from-red-500 to-rose-800', index: 5 },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '5×', color: 'from-yellow-400 to-orange-500', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '15×', color: 'from-pink-500 to-red-600', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '5×', color: 'from-lime-400 to-green-600', index: 8 },
];

const CHIPS_DATA = [
  { value: 1000, label: '1K', color: 'from-cyan-400 to-blue-600' },
  { value: 50000, label: '50K', color: 'from-pink-400 to-rose-600' },
  { value: 500000, label: '500K', color: 'from-yellow-300 to-orange-500' },
  { value: 5000000, label: '5M', color: 'from-fuchsia-500 to-purple-800' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

// --- Animation Components ---

const FallingFruit = ({ delay }: { delay: number }) => {
    const fruits = ['🍎', '🍋', '🍒', '🥭', '🍐'];
    const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
    return (
        <motion.span
            initial={{ y: -50, opacity: 0, scale: 0.5 }}
            animate={{ y: [0, 250, 400], opacity: [0, 1, 1, 0], scale: [0.5, 1, 1] }}
            transition={{ duration: 4, delay, repeat: Infinity, repeatDelay: 1 }}
            className="absolute text-2xl pointer-events-none z-50"
        >
            {randomFruit}
        </motion.span>
    );
};

const BanianBranch = ({ side, index }: { side: 'left' | 'right', index: number }) => (
    <motion.div
        animate={{ rotate: side === 'left' ? [-2, 2, -2] : [2, -2, 2] }}
        transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
            "absolute top-0 w-2.5 bg-gradient-to-b from-[#4e342e] via-[#6d4c41] to-transparent rounded-full shadow-lg",
            side === 'left' ? "origin-top-left" : "origin-top-right"
        )}
        style={{ 
            height: `${50 + index * 12}%`, 
            left: side === 'left' ? `${index * 35 + 20}px` : 'auto',
            right: side === 'right' ? `${index * 35 + 20}px` : 'auto',
            opacity: 0.9 
        }}
    >
        {/* Only middle branch of the 3 drops fruits to look natural */}
        {index === 1 && <FallingFruit delay={side === 'left' ? 0 : 2} />}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-4">
            <span className="text-xl opacity-60">🌿</span>
        </div>
    </motion.div>
);

const EmptyBowl = ({ side }: { side: 'left' | 'right' }) => {
    const [hasFruit, setHasFruit] = useState(false);
    
    useEffect(() => {
        const cycle = setInterval(() => {
            setHasFruit(true);
            setTimeout(() => setHasFruit(false), 3000); // 3 seconds later they disappear
        }, 6000); // Total cycle 6 seconds (appear -> disappear -> wait)
        return () => clearInterval(cycle);
    }, []);

    return (
        <div className={cn(
            "absolute bottom-32 w-20 h-12 flex flex-col items-center justify-end z-30",
            side === 'left' ? "left-8" : "right-8"
        )}>
            {/* The Fruits in bowl */}
            <AnimatePresence>
                {hasFruit && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0, opacity: 0 }} 
                        className="flex gap-0.5 mb-1"
                    >
                        <span className="text-lg drop-shadow-md">🍎</span>
                        <span className="text-lg drop-shadow-md -ml-2 mt-1">🥭</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Physical Bowl */}
            <div className="w-full h-8 bg-gradient-to-b from-[#8d6e63] to-[#4e342e] rounded-b-3xl border-t-4 border-[#3e2723] shadow-xl relative">
                <div className="absolute inset-0 bg-black/10 rounded-b-3xl" />
            </div>
        </div>
    );
};

export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
 // ... (Keep all standard logic from previous version: hooks, states, etc.)
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [isLoading, setIsLoading] = useState(true);
 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(1000);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['grapes', 'pear', 'orange']);
 const [isMuted, setIsMuted] = useState(false);
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, x: number, y: number}[]>([]);
 
 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
   const timer = setTimeout(() => setIsLoading(false), 2000);
   chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3'); 
   spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
   if (spinAudio.current) spinAudio.current.loop = true;
   return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const pointerInterval = setInterval(() => setHintStep(prev => (prev + 1) % SEQUENCE.length), 1500); 
  return () => clearInterval(pointerInterval);
 }, [gameState]);

 useEffect(() => {
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft]);

 const handlePlaceBet = (id: string, idx: number) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'No coins!', variant: 'destructive' });
   return;
  }
  if (!isMuted && chipAudio.current) {
    chipAudio.current.currentTime = 0;
    chipAudio.current.play().catch(() => {});
  }
  const chipInfo = CHIPS_DATA.find(c => c.value === selectedChip);
  const newChip = {
      id: Date.now(),
      itemIdx: idx,
      label: chipInfo?.label || '1K',
      color: chipInfo?.color || 'from-yellow-400 to-orange-500',
      x: (Math.random() * 30) - 15,
      y: (Math.random() * 15) - 7
  };
  setDroppedChips(prev => [...prev, newChip]);
  setLocalCoins(prev => prev - selectedChip);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  if (!isMuted && spinAudio.current) spinAudio.current.play().catch(() => {});
  const itemsOnly = ITEMS.filter(i => i.id !== 'timer');
  const winItem = itemsOnly[Math.floor(Math.random() * itemsOnly.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 6) + SEQUENCE.indexOf(targetIdx); 
  let speed = 40;
  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 10) speed += 50;
    else if (remaining < 20) speed += 20;
    currentStep++;
    setTimeout(run, speed);
   } else {
    if (spinAudio.current) { spinAudio.current.pause(); spinAudio.current.currentTime = 0; }
    setTimeout(() => finalizeResult(winItem), 800);
   }
  };
  run();
 };

 const finalizeResult = (winItem: any) => {
  const bet = myBets[winItem.id] || 0;
  const winAmount = bet * winItem.multiplier;
  setHistory(prev => [winItem.id, ...prev].slice(0, 8));
  if (winAmount > 0) {
    setLocalCoins(prev => prev + winAmount);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(winAmount) });
  }
  setWinnerData({ emoji: winItem.emoji, win: winAmount });
  setGameState('result');
  setTimeout(() => {
   setWinnerData(null);
   setMyBets({});
   setHighlightIdx(null);
   setDroppedChips([]);
   setGameState('betting');
   setTimeLeft(30);
  }, 4000);
 };

 if (isLoading) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
      <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mb-4" />
      <h2 className="text-lg font-black italic text-emerald-800">POWERED-BY UMMY TEAM</h2>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 text-white flex flex-col overflow-hidden select-none bg-gradient-to-b from-emerald-50 to-white">
   
   {/* --- Decor Layer --- */}
   <div className="absolute inset-0 pointer-events-none">
        {/* 3 Left Branches */}
        <BanianBranch side="left" index={0} />
        <BanianBranch side="left" index={1} />
        <BanianBranch side="left" index={2} />
        
        {/* 3 Right Branches */}
        <BanianBranch side="right" index={0} />
        <BanianBranch side="right" index={1} />
        <BanianBranch side="right" index={2} />

        {/* Bowls */}
        <EmptyBowl side="left" />
        <EmptyBowl side="right" />
   </div>

   <header className="relative pt-6 px-6 flex flex-col items-center z-50">
      <div className="flex justify-between items-center w-full mb-2">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/10 rounded-xl">
            {isMuted ? <VolumeX size={18} className="text-red-500"/> : <Volume2 size={18} className="text-blue-600"/>}
        </button>
        <h1 className="text-xl font-black italic text-emerald-800 tracking-tighter">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-2 bg-red-500/10 text-red-500 rounded-xl"><X size={18}/></button>
      </div>
      <div className="bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white flex gap-1.5 shadow-sm">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-lg">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
      <div className="flex flex-col items-center gap-4">
        
        {/* Compact Balance Card */}
        <div className="w-[160px] bg-gradient-to-r from-emerald-800 to-green-700 p-1.5 rounded-2xl border-2 border-white flex items-center justify-center gap-2 shadow-xl">
            <GoldCoinIcon className="w-5 h-5 text-yellow-400" />
            <p className="text-lg font-black text-white tabular-nums">{localCoins.toLocaleString()}</p>
        </div>

        {/* Game Board */}
        <div className={cn("p-2 rounded-[2.5rem] relative bg-white/40 shadow-2xl backdrop-blur-xl border border-white/60", gameState === 'spinning' && "scale-105")}>
          <div className="bg-emerald-950/5 rounded-[2.3rem] p-3 grid grid-cols-3 gap-2.5 w-[270px] aspect-square relative overflow-hidden">
            
            <div className="absolute inset-0 z-50 pointer-events-none">
                <AnimatePresence>
                    {droppedChips.map(chip => (
                        <motion.div key={chip.id} initial={{ y: -400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute" style={{ left: `${(chip.itemIdx % 3) * 33.3 + 16.6}%`, top: `${Math.floor(chip.itemIdx / 3) * 33.3 + 16.6}%`, marginLeft: chip.x, marginTop: chip.y }}>
                            <div className={cn("w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-gradient-to-br", chip.color)}>
                                <span className="text-[7px] font-black text-white">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-gradient-to-br from-emerald-600 to-green-400 rounded-3xl flex items-center justify-center border-2 border-white">
                    <span className="text-3xl font-black text-white">{gameState === 'betting' ? timeLeft : '!!!'}</span>
                  </div>
                );
              }

              const isHighlighted = highlightIdx === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePlaceBet(item.id, idx)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-[1.5rem] transition-all border-b-4",
                    isHighlighted ? "z-30 shadow-[0_0_20px_yellow] border-yellow-400 ring-2 ring-yellow-400 bg-white scale-110" : "border-black/5 bg-gradient-to-br " + item.color,
                  )}
                >
                  <span className={cn("text-2xl", isHighlighted && "scale-110 animate-pulse")}>{item.emoji}</span>
                  {myBets[item.id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-emerald-900 text-[8px] font-black px-1.5 rounded-full border border-white shadow-sm">
                      {(myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id])}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
   </main>

   {/* --- Wood Trunk Chip Bar --- */}
   <footer className="relative mt-auto pb-12 z-[70] flex justify-center">
      <div className="relative">
        <div className="absolute inset-x-[-25px] inset-y-[-8px] bg-[#5d4037] border-y-4 border-[#3e2723] rounded-full shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_15px,black_16px)]" />
        </div>
        
        <div className="relative bg-[#795548] px-6 py-4 rounded-full border-2 border-[#a1887f]/30 flex gap-4 items-center">
          {CHIPS_DATA.map(chip => (
            <motion.button 
              key={chip.value} 
              whileTap={{ scale: 0.9 }}
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center border-2 border-white bg-gradient-to-br shadow-xl transition-all", chip.color,
                selectedChip === chip.value ? "ring-4 ring-yellow-400 -translate-y-2" : "opacity-60 scale-90"
              )}
            >
              <span className="text-white font-black text-xs">{chip.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-emerald-950/70 backdrop-blur-md">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white border-[6px] border-yellow-400 rounded-[3rem] p-10 flex flex-col items-center shadow-2xl">
          <Trophy className="text-yellow-500 w-12 h-12 mb-4 animate-bounce" />
          <div className="text-7xl mb-4">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-emerald-600 font-black text-xl uppercase tracking-tighter">BIG WIN!</p>
              <p className="text-4xl font-black text-gray-800">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-gray-400 font-black text-xl">Next Time!</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
