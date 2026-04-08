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
 X, Volume2, VolumeX, Trophy, Sparkles, Music, HelpCircle, Loader2, Pointer
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5', color: 'from-yellow-300 to-yellow-500', index: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '×10', color: 'from-purple-400 to-indigo-600', index: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '×5', color: 'from-orange-400 to-red-600', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '×45', color: 'from-rose-400 to-red-700', index: 3 },
  { id: 'timer', emoji: '', multiplier: 0, label: '', color: '', index: 4 }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '×25', color: 'from-red-500 to-rose-800', index: 5 },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '×5', color: 'from-yellow-400 to-orange-500', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15', color: 'from-pink-500 to-red-600', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', color: 'from-lime-400 to-green-600', index: 8 },
];

const CHIPS = [
  { value: 1000, label: '1K', color: 'from-cyan-400 to-blue-600' },
  { value: 50000, label: '50K', color: 'from-pink-400 to-rose-600' },
  { value: 500000, label: '500K', color: 'from-yellow-300 to-orange-500' },
  { value: 5000000, label: '5M', color: 'from-fuchsia-500 to-purple-800' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

// --- Decorations ---
const BranchDecoration = ({ className, reverse = false }: { className?: string; reverse?: boolean }) => (
  <div className={cn("absolute top-0 h-full w-12 pointer-events-none z-20 opacity-50", className, reverse && "scale-x-[-1]")}>
    <div className="flex flex-col h-full justify-around items-center py-10">
      {[...Array(6)].map((_, i) => (
        <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.5}s` }}>🌿</span>
      ))}
    </div>
  </div>
);

export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
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
 const [showRules, setShowRules] = useState(false);
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);

 useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 2500);
  return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const interval = setInterval(() => setHintStep(prev => (prev + 1) % SEQUENCE.length), 800);
  return () => clearInterval(interval);
 }, [gameState]);

 useEffect(() => {
  if (isLoading) return;
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft, isLoading]);

 const handlePlaceBet = (id: string) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'Coins kam hain!', variant: 'destructive' });
   return;
  }
  setLocalCoins(prev => prev - selectedChip);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  const itemsOnly = ITEMS.filter(i => i.id !== 'timer');
  const winItem = itemsOnly[Math.floor(Math.random() * itemsOnly.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  
  let currentStep = 0;
  const totalSteps = 50 + SEQUENCE.indexOf(targetIdx); 
  
  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    currentStep++;
    const speed = currentStep < (totalSteps - 10) ? 70 : 70 + (currentStep - (totalSteps - 10)) * 40;
    setTimeout(run, speed);
   } else {
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
   setGameState('betting');
   setTimeLeft(30);
  }, 4000);
 };

 if (isLoading) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200] h-screen w-full">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mb-8">
        <Loader2 size={60} className="text-[#FFD700]" />
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 font-bold tracking-widest text-sm uppercase absolute bottom-10">
        Powered-by Ummy team
      </motion.p>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 bg-gradient-to-br from-sky-400 via-white to-pink-300 text-black flex flex-col overflow-hidden select-none relative h-screen">
   
   <BranchDecoration className="left-0" />
   <BranchDecoration className="right-0" reverse />

   <header className="relative pt-6 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-4">
        <div className="flex gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/50 backdrop-blur-md rounded-xl border border-white">
            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
          </button>
          <button onClick={() => setShowRules(true)} className="p-2 bg-white/50 backdrop-blur-md rounded-xl border border-white">
            <HelpCircle size={20}/>
          </button>
        </div>
        <h1 className="text-3xl font-black italic tracking-tighter text-red-600 drop-shadow-md">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-xl shadow-lg">
          <X size={20}/>
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 flex gap-2 shadow-sm">
        {history.map((id, i) => (
          <span key={i} className="text-xl">{ITEMS.find(it => it.id === id)?.emoji}</span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex flex-col items-center justify-center gap-4 z-10 px-4">
      {/* Square Board - Size Reduced */}
      <div className="bg-[#8B4513] rounded-[2.5rem] p-3 shadow-2xl border-4 border-[#5D2E0C]">
        <div className="bg-[#120626] rounded-[2rem] p-2.5 grid grid-cols-3 gap-2 w-[270px] aspect-square relative">
          {ITEMS.map((item, idx) => {
            if (item.id === 'timer') {
              return (
                <div key="timer" className="bg-black/80 rounded-[1.5rem] flex items-center justify-center border-2 border-yellow-500 overflow-hidden">
                  <span className="text-2xl font-black text-yellow-400 tabular-nums">
                      {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-5 h-5" />}
                  </span>
                </div>
              );
            }

            const isHighlighted = highlightIdx === idx;
            const isHandPointing = gameState === 'betting' && SEQUENCE[hintStep] === idx;

            return (
              <button
                key={item.id}
                onClick={() => handlePlaceBet(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-[1.2rem] transition-all duration-150 border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden",
                  isHighlighted ? "scale-105 z-20 shadow-[0_0_15px_white] border-white bg-white" : "border-black/30 bg-gradient-to-br " + item.color,
                  gameState === 'spinning' && !isHighlighted && "opacity-50"
                )}
              >
                <span className="text-3xl mb-0.5">{item.emoji}</span>
                <span className="text-[9px] font-black text-white bg-black/30 px-1.5 rounded-full">{item.label}</span>
                
                {myBets[item.id] > 0 && (
                  <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[8px] font-black px-1 py-0.5 rounded-full z-20">
                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                  </div>
                )}

                {isHandPointing && (
                  <motion.div initial={{ y: 5 }} animate={{ y: -5 }} transition={{ repeat: Infinity, repeatType: "mirror" }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <Pointer size={24} className="text-white fill-white drop-shadow-lg -rotate-45" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Salad Icons */}
      <div className="flex gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="text-3xl">🥗</motion.div>
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="text-3xl">🥗</motion.div>
      </div>

      <div className="w-[260px] bg-white/80 backdrop-blur-md rounded-2xl p-2.5 border-2 border-white flex items-center justify-between shadow-xl">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-xl">
              <GoldCoinIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Balance</p>
              <p className="text-lg font-black text-black leading-none">{localCoins.toLocaleString()}</p>
            </div>
         </div>
      </div>
   </main>

   <footer className="p-6 pb-12 z-50 flex justify-center">
      <div className="bg-[#5D2E0C] rounded-[2.5rem] p-3 flex gap-3 shadow-2xl">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all border-4 bg-gradient-to-br", chip.color,
              selectedChip === chip.value ? "ring-4 ring-white border-white scale-110" : "border-black/20 opacity-60 scale-90"
            )}
          >
            <span className="text-white font-black text-[10px]">{chip.label}</span>
          </button>
        ))}
      </div>
   </footer>

   {/* Rules Modal */}
   <AnimatePresence>
    {showRules && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60">
        <motion.div className="bg-[#A63C5D] w-full max-w-sm rounded-[2rem] p-8 border-4 border-[#8B314E] relative text-white">
          <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 bg-black/20 p-1 rounded-full"><X size={20}/></button>
          <h2 className="text-center text-yellow-300 text-2xl font-bold mb-4">Rules</h2>
          <div className="space-y-3 text-xs leading-relaxed font-medium">
            <p>1. Choose chip and select a food to bet.</p>
            <p>2. Each round is 30 seconds.</p>
            <p>3. If you bet on the winning food, you win coins based on the multiplier!</p>
            <p>4. Example: Apple (x25) means 1000 coins becomes 25,000!</p>
          </div>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>

   {/* Result Modal */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className="w-[280px] bg-[#A63C5D] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20">
          <div className="bg-gradient-to-b from-yellow-400 to-orange-500 py-2 text-center">
            <h3 className="text-white font-black text-xl italic">WINNER</h3>
          </div>
          <div className="p-5 flex flex-col items-center gap-4">
             <div className="flex items-center gap-4 w-full justify-center bg-black/20 py-3 rounded-2xl">
                <span className="text-5xl">{winnerData.emoji}</span>
                <div className="h-10 w-[2px] bg-white/20" />
                <div className="flex items-center gap-2">
                   <GoldCoinIcon className="w-7 h-7" />
                   <span className="text-2xl font-black text-yellow-300">
                     {winnerData.win > 0 ? "+" + winnerData.win.toLocaleString() : "0"}
                   </span>
                </div>
             </div>
             {winnerData.win === 0 && <p className="text-white/50 text-xs font-bold uppercase">Better Luck Next Time!</p>}
          </div>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
