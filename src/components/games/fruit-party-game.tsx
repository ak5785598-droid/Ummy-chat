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
 X, Volume2, History, HelpCircle, Trophy, Star
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'orange', emoji: '🍊', multiplier: 5, index: 0 },
  { id: 'lemon', emoji: '🍋', multiplier: 5, index: 1 },
  { id: 'grapes', emoji: '🍇', multiplier: 5, index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 5, index: 3 },
  { id: 'lucky', label: 'Lucky', isSpecial: true, index: 4 },
  { id: 'timer', isTimer: true, index: 5 }, 
  { id: 'super', label: 'Super Lucky', isSpecial: true, index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 45, index: 7 },
  { id: 'mango', emoji: '🥭', multiplier: 25, index: 8 },
  { id: 'watermelon', emoji: '🍉', multiplier: 15, index: 9 },
  { id: 'apple', emoji: '🍎', multiplier: 10, index: 10 },
];

const CHIPS = [
  { value: 100, label: '100', color: 'from-cyan-400 to-blue-600' },
  { value: 1000, label: '1K', color: 'from-emerald-400 to-green-700' },
  { value: 5000, label: '5K', color: 'from-indigo-400 to-indigo-800' },
  { value: 10000, label: '10K', color: 'from-yellow-400 to-orange-700' },
  { value: 50000, label: '50K', color: 'from-red-400 to-red-800' },
];

const SEQUENCE = [0, 1, 2, 3, 10, 9, 8, 7];

// --- White Hand Icon ---
const WhiteHand = () => (
    <motion.div 
        animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="absolute z-50 pointer-events-none -bottom-1 -right-1"
    >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5m-4-3V7a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10l-2.5-2.5a2 2 0 0 0-2.8 2.8l4.3 4.3c1.5 1.5 3.5 2.4 5.5 2.4h2.5a6 6 0 0 0 6-6v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2" />
        </svg>
    </motion.div>
);

export default function LuckyFruitMachine({ onClose }: { onClose?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(15);
 const [selectedChip, setSelectedChip] = useState(5000);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [handIdx, setHandIdx] = useState(0);
 const [history, setHistory] = useState<string[]>(['strawberry', 'cherry']);
 const [localCoins, setLocalCoins] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
    if (gameState !== 'betting') return;
    const hInterval = setInterval(() => setHandIdx(prev => (prev + 1) % SEQUENCE.length), 1800);
    return () => clearInterval(hInterval);
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

 const handlePlaceBet = (id: string) => {
  if (gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'No Coins!', variant: 'destructive' });
   return;
  }
  setLocalCoins(prev => prev - selectedChip);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  const winnable = ITEMS.filter(i => !i.isSpecial && !i.isTimer);
  const winItem = winnable[Math.floor(Math.random() * winnable.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 6) + SEQUENCE.indexOf(targetIdx); 
  let speed = 40;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    currentStep++;
    if (totalSteps - currentStep < 15) speed += 30;
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

  setWinnerData({ emoji: winItem.emoji!, win: winAmount });
  setGameState('result');
  setTimeout(() => {
   setWinnerData(null);
   setMyBets({});
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(15);
  }, 3500);
 };

 return (
  <div className="fixed inset-0 bg-[#011410] flex flex-col items-center overflow-hidden font-sans select-none">
   
   {/* --- Header --- */}
   <header className="w-full bg-gradient-to-b from-[#ffd700] to-[#b45309] p-3 flex justify-between items-center shadow-xl z-50">
      <div className="flex items-center gap-2 bg-black/50 px-4 py-1 rounded-full border border-yellow-400">
        <GoldCoinIcon className="w-4 h-4" />
        <span className="font-bold text-yellow-300">{localCoins.toLocaleString()}</span>
      </div>
      <button onClick={onClose} className="bg-red-600 p-1 rounded shadow-md"><X size={18} className="text-white"/></button>
   </header>

   <main className="flex-1 w-full flex relative">
      {/* --- 3D GOLDEN PILLARS --- */}
      <div className="absolute top-0 bottom-0 left-0 w-10 bg-gradient-to-r from-[#8b4513] via-[#ffd700] to-transparent z-10 shadow-inner" />
      <div className="absolute top-0 bottom-0 right-0 w-10 bg-gradient-to-l from-[#8b4513] via-[#ffd700] to-transparent z-10 shadow-inner" />

      {/* --- MACHINE SCREEN AREA --- */}
      <div className="flex-1 max-w-md mx-auto flex flex-col items-center pt-8 z-20 px-4">
          <h1 className="text-4xl font-black italic text-white drop-shadow-[0_4px_0_#8b4513] mb-6 uppercase">Lucky Fruit</h1>

          {/* Machine Square Screen */}
          <div className="bg-[#002b23] rounded-[2.5rem] p-5 border-[8px] border-[#fbbf24] shadow-[0_25px_50px_black,inset_0_0_30px_black] w-full">
            <div className="grid grid-cols-4 gap-2 relative">
              {ITEMS.map((item, idx) => {
                const isHighlighted = highlightIdx === idx;
                const isHandTarget = gameState === 'betting' && SEQUENCE[handIdx] === idx;
                
                if (item.isTimer) {
                   return (
                     <div key="timer" className="col-span-2 bg-black rounded-xl flex items-center justify-center border-2 border-yellow-900/50">
                       <span className="text-4xl font-mono font-bold text-yellow-400 drop-shadow-[0_0_8px_yellow]">
                         {timeLeft.toString().padStart(2, '0')}
                       </span>
                     </div>
                   );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => !item.isSpecial && handlePlaceBet(item.id)}
                    className={cn(
                      "relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all",
                      "border-t-2 border-white/10 border-b-4 border-black/50 shadow-lg",
                      isHighlighted ? "bg-white scale-110 z-30 shadow-[0_0_30px_white]" : "bg-black/40",
                      gameState === 'spinning' && !isHighlighted && "opacity-30 grayscale"
                    )}
                  >
                    {item.isSpecial ? <Star size={18} className="text-yellow-500 fill-yellow-500" /> : (
                        <>
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-[10px] font-black text-yellow-300 mt-0.5">×{item.multiplier}</span>
                        </>
                    )}
                    {isHandTarget && <WhiteHand />}
                    {myBets[item.id] > 0 && (
                      <div className="absolute -top-1 -right-1 bg-white text-[9px] font-black text-black px-1 rounded-full border border-yellow-500">
                        {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'K' : myBets[item.id]}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
      </div>
   </main>

   {/* --- Footer: Chips --- */}
   <footer className="w-full bg-[#002b23] p-6 border-t-4 border-yellow-500 shadow-2xl z-50">
      <div className="flex justify-between max-w-md mx-auto mb-4">
        {CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center border-t-2 border-white/20 border-b-4 border-black/40 shadow-xl transition-all",
              `bg-gradient-to-br ${chip.color}`,
              selectedChip === chip.value ? "ring-4 ring-yellow-300 -translate-y-3 scale-110" : "opacity-50"
            )}
          >
            <span className="text-white font-black text-xs">{chip.label}</span>
          </button>
        ))}
      </div>
   </footer>

   {/* --- WIN MODAL (CHOTA WALA) --- */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div 
            initial={{ scale: 0.5 }} animate={{ scale: 1 }}
            className="bg-gradient-to-b from-yellow-300 to-orange-600 border-4 border-white rounded-[2rem] p-6 flex flex-col items-center shadow-2xl w-[240px]"
        >
          <Trophy size={30} className="text-white mb-2 animate-bounce" />
          <div className="text-7xl mb-2">{winnerData.emoji}</div>
          <div className="text-center">
            {winnerData.win > 0 ? (
               <p className="text-3xl font-black text-white drop-shadow-md">+{winnerData.win.toLocaleString()}</p>
            ) : (
               <p className="text-white/80 font-bold uppercase">Next Round!</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
                     }
       
