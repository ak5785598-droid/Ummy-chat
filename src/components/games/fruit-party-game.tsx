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
 X, Volume2, VolumeX, History, HelpCircle, Trophy, Star, MousePointer2
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Improved 3D Items with Specific Vibrant Gradients ---
const ITEMS = [
  { id: 'orange', emoji: '🍊', multiplier: 5, color: 'from-orange-400 via-orange-500 to-orange-700', shadow: 'shadow-orange-500/50', index: 0 },
  { id: 'lemon', emoji: '🍋', multiplier: 5, color: 'from-yellow-300 via-yellow-400 to-yellow-600', shadow: 'shadow-yellow-400/50', index: 1 },
  { id: 'grapes', emoji: '🍇', multiplier: 5, color: 'from-purple-400 via-purple-500 to-indigo-700', shadow: 'shadow-purple-500/50', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 5, color: 'from-rose-400 via-red-500 to-red-800', shadow: 'shadow-red-500/50', index: 3 },
  { id: 'lucky', label: 'Lucky', isSpecial: true, color: 'from-cyan-400 via-blue-500 to-blue-700', shadow: 'shadow-blue-500/50', index: 4 },
  { id: 'timer', isTimer: true, index: 5 }, 
  { id: 'super', label: 'Super Lucky', isSpecial: true, color: 'from-amber-400 via-orange-500 to-red-600', shadow: 'shadow-orange-600/50', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 45, color: 'from-pink-400 via-rose-500 to-red-700', shadow: 'shadow-pink-500/50', index: 7 },
  { id: 'mango', emoji: '🥭', multiplier: 25, color: 'from-yellow-400 via-orange-400 to-amber-700', shadow: 'shadow-orange-400/50', index: 8 },
  { id: 'watermelon', emoji: '🍉', multiplier: 15, color: 'from-green-400 via-emerald-500 to-green-800', shadow: 'shadow-green-500/50', index: 9 },
  { id: 'apple', emoji: '🍎', multiplier: 10, color: 'from-red-400 via-red-600 to-rose-900', shadow: 'shadow-red-600/50', index: 10 },
];

const CHIPS = [
  { value: 100, label: '100', color: 'from-cyan-400 to-blue-600', border: 'border-blue-400' },
  { value: 1000, label: '1K', color: 'from-emerald-400 to-green-700', border: 'border-green-400' },
  { value: 5000, label: '5K', color: 'from-blue-500 to-indigo-800', border: 'border-indigo-400' },
  { value: 10000, label: '10K', color: 'from-orange-400 to-yellow-700', border: 'border-yellow-400' },
  { value: 50000, label: '50K', color: 'from-rose-500 to-red-800', border: 'border-red-400' },
];

const SEQUENCE = [0, 1, 2, 3, 10, 9, 8, 7];

export default function LuckyFruit3DPremium({ onClose }: { onClose?: () => void }) {
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
 const [history, setHistory] = useState<string[]>(['apple', 'watermelon', 'cherry']);
 const [localCoins, setLocalCoins] = useState(0);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
    if (gameState !== 'betting') return;
    const handInterval = setInterval(() => setHandIdx((prev) => (prev + 1) % SEQUENCE.length), 2000);
    return () => clearInterval(handInterval);
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
  let speed = 60;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    currentStep++;
    if (totalSteps - currentStep < 12) speed += 35;
    setTimeout(run, speed);
   } else {
    setTimeout(() => finalizeResult(winItem), 1200);
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
  }, 4000);
 };

 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);

 return (
  <div className="fixed inset-0 bg-[#001a14] flex flex-col items-center overflow-hidden font-sans select-none">
   
   {/* --- Header --- */}
   <header className="w-full bg-gradient-to-b from-[#ffd700] via-[#b8860b] to-[#8b4513] p-3 flex justify-between items-center shadow-[0_5px_15px_rgba(0,0,0,0.6)] z-50">
      <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border-2 border-yellow-400 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
        <GoldCoinIcon className="w-5 h-5 drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
        <span className="font-black text-yellow-300 text-lg tabular-nums">{localCoins.toLocaleString()}</span>
        <div className="ml-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-md font-bold">+</div>
      </div>
      <div className="flex gap-4 items-center">
        <History size={22} className="text-white drop-shadow-lg cursor-pointer" />
        <Volume2 size={22} className="text-white drop-shadow-lg cursor-pointer" />
        <HelpCircle size={22} className="text-white drop-shadow-lg cursor-pointer" />
        <button onClick={onClose} className="bg-red-600 p-1 rounded-md shadow-lg border-2 border-red-400 hover:bg-red-700">
            <X size={20} className="text-white" />
        </button>
      </div>
   </header>

   <main className="flex-1 w-full max-w-md flex flex-col items-center px-4 pt-4">
      <motion.h1 
        animate={{ scale: [1, 1.05, 1] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="text-5xl font-black italic text-white drop-shadow-[0_6px_0px_#8b4513] mb-6 tracking-tighter uppercase"
      >
        Lucky Fruit
      </motion.h1>

      {/* --- Main 3D Machine Frame --- */}
      <div className="relative bg-[#00382e] rounded-[2.5rem] p-5 border-[12px] border-[#fbbf24] shadow-[0_30px_60px_rgba(0,0,0,1),inset_0_0_40px_black] w-full">
        
        {/* Animated Light Border Dots */}
        <div className="absolute inset-0 pointer-events-none border-[4px] border-dotted border-yellow-200/40 rounded-[1.8rem] m-1 animate-pulse" />

        <div className="grid grid-cols-4 gap-3 relative">
          {ITEMS.map((item, idx) => {
            const isHighlighted = highlightIdx === idx;
            const isHandTarget = gameState === 'betting' && SEQUENCE[handIdx] === idx;
            
            if (item.isTimer) {
               return (
                 <div key="timer" className="col-span-2 bg-gradient-to-b from-[#111] to-black rounded-2xl border-4 border-[#222] flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,0,0.4)]">
                   <span className="text-5xl font-mono font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(254,240,138,0.8)]">
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
                  "relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200",
                  "border-t-2 border-white/40 border-b-[8px] border-black/50 shadow-2xl",
                  isHighlighted ? "bg-white scale-110 z-30 shadow-[0_0_40px_white] border-b-white" : `bg-gradient-to-br ${item.color} ${item.shadow}`,
                  gameState === 'spinning' && !isHighlighted && "opacity-30 grayscale-[0.5] scale-90"
                )}
              >
                {/* Glossy Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-2xl pointer-events-none" />

                {item.isSpecial ? (
                    <div className="flex flex-col items-center text-center px-1">
                        <Star size={20} className="text-white mb-1 fill-yellow-300 drop-shadow-md" />
                        <span className="text-[9px] leading-none font-black text-white uppercase drop-shadow-md">{item.label}</span>
                    </div>
                ) : (
                    <>
                        <span className={cn("text-4xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)] transition-transform", isHighlighted && "scale-110 animate-bounce")}>
                          {item.emoji}
                        </span>
                        <span className="text-[12px] font-black text-yellow-100 mt-1 drop-shadow-[0_1px_2px_black]">×{item.multiplier}</span>
                    </>
                )}

                {/* --- 3D Hand Pointer --- */}
                <AnimatePresence>
                    {isHandTarget && (
                        <motion.div 
                            initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
                            className="absolute -bottom-3 -right-3 z-40 pointer-events-none shadow-2xl"
                        >
                            <div className="bg-white p-1.5 rounded-full border-2 border-yellow-500">
                                <MousePointer2 size={28} className="text-black fill-black -rotate-12 animate-pulse" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bet Stack UI */}
                {myBets[item.id] > 0 && (
                  <div className="absolute -top-2 -right-1 z-20">
                    <div className="bg-white border-2 border-yellow-500 text-[10px] font-black text-black px-2 py-0.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'K' : myBets[item.id]}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Middle Stats Section --- */}
      <div className="w-full mt-8 flex flex-col gap-4 px-2">
        <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border-2 border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
            <span className="text-yellow-500/80 font-black text-[10px] uppercase tracking-[0.2em]">Today's Total Win</span>
            <span className="text-3xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">0</span>
        </div>
        <div className="flex items-center justify-center gap-2">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-green-500/50" />
            <p className="text-[12px] font-black text-green-400 uppercase tracking-widest">Select Chip & Play</p>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-green-500/50" />
        </div>
      </div>
   </main>

   {/* --- Footer: Premium 3D Chips --- */}
   <footer className="w-full bg-gradient-to-t from-[#002b21] to-[#004d40] p-6 pb-10 border-t-[6px] border-[#fbbf24] shadow-[0_-15px_50px_black] z-50">
      <div className="flex justify-between items-end gap-1 max-w-md mx-auto">
        {CHIPS.map(chip => (
          <button
            key={chip.value}
            disabled={gameState !== 'betting'}
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "relative w-[4.5rem] h-[4.5rem] rounded-full flex flex-col items-center justify-center transition-all duration-300",
              "border-t-4 border-white/40 border-b-[10px] border-black/50 shadow-2xl active:border-b-0 active:translate-y-2",
              `bg-gradient-to-br ${chip.color}`,
              selectedChip === chip.value ? "ring-4 ring-yellow-300 -translate-y-6 scale-110 shadow-[0_20px_40px_rgba(0,0,0,0.6)]" : "opacity-70 grayscale-[0.3]",
              gameState !== 'betting' && "opacity-20 grayscale"
            )}
          >
            {/* Chip Inner Pattern */}
            <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-white/20 m-1.5" />
            <span className="text-white font-black text-sm drop-shadow-[0_2px_4px_black]">{chip.label}</span>
          </button>
        ))}
      </div>

      {/* History Result Log */}
      <div className="mt-8 bg-black/80 p-3 rounded-2xl flex items-center border border-white/10 shadow-inner">
        <span className="text-[11px] font-black text-yellow-500/50 mr-4 tracking-tighter">PREVIOUS:</span>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {history.map((id, i) => (
            <motion.span initial={{ scale: 0, x: -10 }} animate={{ scale: 1, x: 0 }} key={i} className="text-2xl filter drop-shadow-md">
              {ITEMS.find(it => it.id === id)?.emoji}
            </motion.span>
          ))}
        </div>
      </div>
   </footer>

   {/* --- Win Splash Screen --- */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
        <motion.div 
            initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            className="bg-gradient-to-b from-[#ffd700] via-[#fbbf24] to-[#b45309] border-[10px] border-white rounded-[4rem] p-16 flex flex-col items-center shadow-[0_0_150px_rgba(251,191,36,0.4)]"
        >
          <div className="relative">
             <Trophy size={80} className="text-white mb-8 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] animate-bounce" />
             <Star size={30} className="absolute -top-4 -right-4 text-white fill-white animate-pulse" />
          </div>
          <div className="text-[10rem] mb-8 filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-black font-black text-3xl uppercase tracking-tighter mb-2">Jackpot!</p>
              <p className="text-7xl font-black text-white drop-shadow-[0_6px_0_#b45309]">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-black/60 font-black text-2xl italic uppercase tracking-widest">Better Luck!</p>
          )}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
  }
                    
