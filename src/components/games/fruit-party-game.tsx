'use client';

import { useState, useEffect } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { 
 X, Volume2, VolumeX, Info, History, HelpCircle, Trophy, Star
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Game Items (As per 2nd Image) ---
const ITEMS = [
  { id: 'orange', emoji: '🍊', multiplier: 5, color: 'bg-[#ff9800]', index: 0 },
  { id: 'lemon', emoji: '🍋', multiplier: 5, color: 'bg-[#ffeb3b]', index: 1 },
  { id: 'grapes', emoji: '🍇', multiplier: 5, color: 'bg-[#9c27b0]', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 5, color: 'bg-[#e91e63]', index: 3 },
  { id: 'lucky', emoji: 'Lucky', multiplier: 0, isSpecial: true, index: 4 },
  { id: 'timer', emoji: '', multiplier: 0, index: 5 }, // Center Timer
  { id: 'super', emoji: 'Super Lucky', multiplier: 0, isSpecial: true, index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 45, color: 'bg-[#ff1744]', index: 7 },
  { id: 'mango', emoji: '🥭', multiplier: 25, color: 'bg-[#ffc107]', index: 8 },
  { id: 'watermelon', emoji: '🍉', multiplier: 15, color: 'bg-[#4caf50]', index: 9 },
  { id: 'apple', emoji: '🍎', multiplier: 10, color: 'bg-[#f44336]', index: 10 },
];

const CHIPS = [
  { value: 100, label: '100', color: 'from-cyan-400 to-blue-600' },
  { value: 1000, label: '1K', color: 'from-green-400 to-emerald-600' },
  { value: 5000, label: '5K', color: 'from-blue-500 to-indigo-700' },
  { value: 10000, label: '10K', color: 'from-orange-400 to-yellow-600' },
  { value: 50000, label: '50K', color: 'from-red-500 to-rose-700' },
];

// Spin Sequence (Outer Border)
const SEQUENCE = [0, 1, 2, 3, 10, 9, 8, 7];

export default function LuckyFruitGame({ onClose }: { onClose?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(15);
 const [selectedChip, setSelectedChip] = useState(5000);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['cherry', 'orange', 'apple']);
 const [isMuted, setIsMuted] = useState(false);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft]);

 const handlePlaceBet = (id: string) => {
  if (gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'Insufficient Coins!', variant: 'destructive' });
   return;
  }
  setLocalCoins(prev => prev - selectedChip);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  const winnable = ITEMS.filter(i => !i.isSpecial && i.id !== 'timer');
  const winItem = winnable[Math.floor(Math.random() * winnable.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 6) + SEQUENCE.indexOf(targetIdx); 
  let speed = 50;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    currentStep++;
    if (totalSteps - currentStep < 10) speed += 30;
    setTimeout(run, speed);
   } else {
    setTimeout(() => finalizeResult(winItem), 1000);
   }
  };
  run();
 };

 const finalizeResult = (winItem: any) => {
  const bet = myBets[winItem.id] || 0;
  const winAmount = bet * winItem.multiplier;
  setHistory(prev => [winItem.id, ...prev].slice(0, 10));
  
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
   setGameState('betting');
   setTimeLeft(15);
  }, 4000);
 };

 return (
  <div className="fixed inset-0 bg-[#002d24] flex flex-col items-center justify-between overflow-hidden font-sans select-none">
   
   {/* --- Header: Golden Arcade Style --- */}
   <header className="w-full bg-gradient-to-b from-[#fcd34d] to-[#b45309] p-2 flex justify-between items-center shadow-xl border-b-2 border-black/20">
      <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/20">
        <GoldCoinIcon className="w-5 h-5" />
        <span className="font-bold text-yellow-400">{localCoins.toLocaleString()}</span>
        <button className="bg-green-500 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">+</button>
      </div>
      <div className="flex gap-3">
        <History size={20} className="text-white drop-shadow-md" />
        <Volume2 size={20} className="text-white drop-shadow-md" />
        <HelpCircle size={20} className="text-white drop-shadow-md" />
        <button onClick={onClose}><X size={20} className="text-white" /></button>
      </div>
   </header>

   {/* --- Main Machine Area --- */}
   <main className="relative flex-1 w-full max-w-md p-4 flex flex-col gap-4">
      {/* Game Title Logo */}
      <div className="text-center py-2">
        <h1 className="text-5xl font-black italic text-white drop-shadow-[0_4px_0px_#b45309] tracking-tight">
            Lucky Fruit
        </h1>
      </div>

      {/* --- Slot Grid: Green Felt Look --- */}
      <div className="bg-[#004d40] rounded-xl p-3 border-[6px] border-[#fbbf24] shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.8)] grid grid-cols-4 gap-2 relative">
        {ITEMS.map((item, idx) => {
          const isHighlighted = highlightIdx === idx;
          
          if (item.id === 'timer') {
             return (
               <div key="timer" className="col-span-2 bg-black/80 rounded-lg border-2 border-yellow-500/50 flex items-center justify-center overflow-hidden">
                 <span className="text-4xl font-mono text-yellow-400 animate-pulse">{timeLeft.toString().padStart(2, '0')}</span>
               </div>
             );
          }

          if (item.isSpecial) {
             return (
               <div key={item.id} className={cn(
                 "aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold text-center p-1 border-2 border-white/10",
                 item.id === 'lucky' ? "bg-gradient-to-br from-blue-400 to-indigo-600" : "bg-gradient-to-br from-yellow-400 to-red-500"
               )}>
                 <Star size={16} className="mb-1" />
                 {item.emoji}
               </div>
             );
          }

          return (
            <button
              key={item.id}
              onClick={() => handlePlaceBet(item.id)}
              className={cn(
                "relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-100 border-2 overflow-hidden",
                isHighlighted ? "bg-white border-yellow-400 scale-105 z-10 shadow-[0_0_20px_white]" : "bg-[#00695c] border-white/20 opacity-90",
                gameState === 'spinning' && !isHighlighted && "opacity-50 grayscale-[0.3]"
              )}
            >
               <span className="text-3xl drop-shadow-md">{item.emoji}</span>
               <span className="text-[10px] font-black text-yellow-400 mt-1">×{item.multiplier}</span>
               
               {/* Small Chips Stack Icon on Item */}
               {myBets[item.id] > 0 && (
                 <div className="absolute top-0 right-0 p-0.5">
                   <div className="bg-white text-[8px] text-black font-bold px-1 rounded-full shadow-md">
                     {myBets[item.id] >= 1000 ? (myBets[item.id]/1000)+'K' : myBets[item.id]}
                   </div>
                 </div>
               )}
            </button>
          );
        })}
      </div>

      {/* --- Stats & Today's Win --- */}
      <div className="bg-[#00251a] rounded-lg p-2 flex justify-between items-center border border-white/10">
        <span className="text-xs font-bold text-yellow-500/80 uppercase">Today's Win</span>
        <span className="text-xl font-black text-yellow-400">0</span>
      </div>

      <div className="text-center text-[10px] text-green-400/60 font-bold uppercase tracking-widest">
         Select Amount - Choose Fruit
      </div>

   </main>

   {/* --- Footer: Chips & Result Bar --- */}
   <footer className="w-full bg-[#004d40] p-4 flex flex-col gap-4 border-t-4 border-yellow-600 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {/* Betting Chips */}
      <div className="flex justify-around items-end h-20">
        {CHIPS.map(chip => (
          <button
            key={chip.value}
            disabled={gameState !== 'betting'}
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all border-[3px] shadow-[0_5px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 bg-gradient-to-br",
              chip.color,
              selectedChip === chip.value ? "ring-4 ring-white scale-110 -translate-y-2 border-white" : "opacity-70 scale-90",
              gameState !== 'betting' && "grayscale opacity-20"
            )}
          >
            <span className="text-white font-black text-xs drop-shadow-md">{chip.label}</span>
            <div className="w-6 h-0.5 bg-white/30 rounded-full mt-1" />
          </button>
        ))}
      </div>

      {/* Recent History Icons */}
      <div className="bg-black/40 p-2 rounded-lg flex items-center gap-2 overflow-hidden border border-white/5">
        <span className="text-[10px] font-bold text-white/40 mr-2">RESULT:</span>
        <div className="flex gap-2">
          {history.map((id, i) => (
            <span key={i} className="text-lg opacity-80">
              {ITEMS.find(it => it.id === id)?.emoji}
            </span>
          ))}
        </div>
      </div>
   </footer>

   {/* --- Win Modal --- */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-[#004d40] border-4 border-yellow-400 rounded-3xl p-8 flex flex-col items-center shadow-2xl">
          <Trophy className="text-yellow-400 w-12 h-12 mb-4" />
          <div className="text-8xl mb-4">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-yellow-400 font-black text-lg animate-bounce">CONGRATULATIONS!</p>
              <p className="text-5xl font-black text-white">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-white/40 font-bold">No Win This Round</p>
          )}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
 }
         
