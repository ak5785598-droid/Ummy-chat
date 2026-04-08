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
 X, Volume2, VolumeX, Pointer, Trophy, Sparkles, Music, HelpCircle, Loader2
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5', color: 'from-yellow-400 to-amber-600', index: 0 },
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
  { value: 1000, label: '1K', color: 'from-cyan-400 to-blue-600 shadow-cyan-500/40' },
  { value: 50000, label: '50K', color: 'from-pink-400 to-rose-600 shadow-rose-500/40' },
  { value: 500000, label: '500K', color: 'from-yellow-300 to-orange-500 shadow-yellow-500/40' },
  { value: 5000000, label: '5M', color: 'from-fuchsia-500 to-purple-800 shadow-purple-600/40' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

const LongBranchDecoration = ({ className, delay = 0, reverse = false }: { className?: string; delay?: number; reverse?: boolean }) => (
  <motion.div
    initial={{ y: -10 }}
    animate={{ y: 10 }}
    transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay }}
    className={cn("absolute top-0 h-screen w-[80px] pointer-events-none z-30 opacity-60", className, reverse ? "scale-x-[-1]" : "")}
  >
    <svg viewBox="0 0 100 1200" className="w-full h-full overflow-visible drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]" preserveAspectRatio="none">
      <path d="M 50,0 C 30,300 70,600 50,900 C 30,1100 60,1200 50,1200" stroke="#1a0d02" strokeWidth="12" fill="none" vectorEffect="non-scaling-stroke" />
      <path d="M 55,0 C 85,250 15,550 55,850 C 85,1050 15,1200 55,1200" stroke="#143613" strokeWidth="7" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="absolute inset-0 flex flex-col justify-between py-10 items-center">
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} animate={{ rotate: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0] }} transition={{ duration: 3 + i, repeat: Infinity }} className="text-xl">
          {i % 2 === 0 ? "🍎" : "🌿"}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [isLoading, setIsLoading] = useState(true);
 const [showRules, setShowRules] = useState(false);
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
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft]);

 const handlePlaceBet = (id: string) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'No coins!', variant: 'destructive' });
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
  const totalSteps = (SEQUENCE.length * 6) + SEQUENCE.indexOf(targetIdx); 
  let speed = 30;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 5) speed += 100;
    else if (remaining < 10) speed += 40;
    else if (remaining < 20) speed += 10;
    currentStep++;
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
    <div className="fixed inset-0 bg-[#0a0514] flex flex-col justify-end z-[100]">
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        className="bg-white w-full h-1/2 rounded-t-[3.5rem] flex flex-col items-center justify-center shadow-[0_-20px_50px_rgba(255,0,128,0.2)]"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-pink-200 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-14 h-14 text-pink-500 animate-spin relative z-10" />
        </div>
        <p className="text-pink-600 font-black text-2xl tracking-[0.2em] italic mb-1">LOADING...</p>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Powered-By Ummy Team</p>
      </motion.div>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white flex flex-col overflow-hidden select-none font-sans relative">
   
   <LongBranchDecoration className="left-[-25px]" delay={0} />
   <LongBranchDecoration className="right-[-25px]" delay={2} reverse />

   <header className="relative pt-6 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-4">
        <div className="flex gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xl">
            {isMuted ? <VolumeX size={20} className="text-red-400"/> : <Volume2 size={20} className="text-white"/>}
          </button>
          <button onClick={() => setShowRules(true)} className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xl">
            <HelpCircle size={20} className="text-white"/>
          </button>
        </div>
        <div className="relative">
          <h1 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-2xl">FRUIT PARTY</h1>
          <Sparkles className="absolute -top-1 -right-4 text-yellow-300 w-4 h-4 animate-pulse" />
        </div>
        <button onClick={onClose} className="p-2.5 bg-red-500/80 text-white rounded-2xl border border-red-400/50 shadow-lg">
          <X size={20}/>
        </button>
      </div>

      <div className="bg-black/30 backdrop-blur-3xl px-4 py-2 rounded-2xl border border-white/10 flex gap-2 shadow-2xl">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-xl filter drop-shadow-sm">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 gap-6">
      <div className="p-2 rounded-[3.2rem] bg-gradient-to-b from-white/20 to-transparent shadow-2xl backdrop-blur-md">
        <div className="bg-[#120626]/95 rounded-[3rem] p-5 grid grid-cols-3 gap-4 w-[320px] aspect-square relative border border-white/10">
          {ITEMS.map((item, idx) => {
            if (item.id === 'timer') {
              return (
                <div key="timer" className="bg-black/50 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-inner">
                  <AnimatePresence mode="wait">
                      <motion.span 
                          key={gameState === 'betting' ? timeLeft : 'spin'}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-4xl font-black text-cyan-400 tabular-nums drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                      >
                          {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-8 h-8 text-pink-500" />}
                      </motion.span>
                  </AnimatePresence>
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
                  "relative flex flex-col items-center justify-center rounded-[2rem] transition-all duration-300 border-b-4 active:border-b-0 active:translate-y-1",
                  isHighlighted ? "scale-110 z-20 shadow-[0_0_40px_rgba(255,255,255,0.4)] border-white ring-2 ring-white/30 bg-white" : "border-black/50 shadow-2xl bg-gradient-to-br",
                  item.color,
                  gameState === 'spinning' && !isHighlighted && "opacity-30 grayscale-[0.2]"
                )}
              >
                <span className={cn("text-3xl mb-1 drop-shadow-lg", isHighlighted && "scale-125")}>{item.emoji}</span>
                <span className="text-[10px] font-black text-white bg-black/40 px-2.5 py-0.5 rounded-full">{item.label}</span>
                
                {myBets[item.id] > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-white text-pink-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xl border border-pink-100">
                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                  </motion.div>
                )}
                
                <AnimatePresence>{isHandPointing && (
                  <motion.div initial={{ scale: 0, x: 10 }} animate={{ scale: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <Pointer size={36} className="text-white fill-white drop-shadow-[0_0_15px_white] -rotate-45 animate-bounce" />
                  </motion.div>
                )}</AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-[320px] justify-center">
         {/* Salad Icons Section */}
         <div className="flex gap-3 bg-white/10 backdrop-blur-2xl p-3 rounded-3xl border border-white/20 shadow-xl">
            <div className="bg-indigo-500/40 p-2.5 rounded-2xl shadow-inner border border-white/10">
               <span className="text-2xl">🥗</span>
            </div>
            <div className="bg-rose-500/40 p-2.5 rounded-2xl shadow-inner border border-white/10">
               <span className="text-2xl">🥗</span>
            </div>
         </div>

         {/* Balance Card Section */}
         <div className="flex-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-2xl p-3 rounded-3xl border border-white/20 shadow-xl flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-xl shadow-[0_4px_0_#b45309]">
              <GoldCoinIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <p className="text-[9px] text-cyan-200 font-black uppercase tracking-widest">Balance</p>
              <p className="text-xl font-black text-white tabular-nums leading-none">
                  {localCoins.toLocaleString()}
              </p>
            </div>
         </div>
      </div>
   </main>

   <footer className="relative mt-auto p-8 z-50 flex justify-center">
      <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-5 border border-white/20 shadow-2xl">
        <div className="flex gap-4 justify-center items-center">
          {CHIPS.map(chip => (
            <button 
              key={chip.value} 
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all border-4 active:scale-95 bg-gradient-to-br shadow-2xl", chip.color,
                selectedChip === chip.value ? "border-white scale-110 -rotate-6" : "border-transparent opacity-50 scale-90",
                gameState !== 'betting' && "opacity-10 cursor-not-allowed"
              )}
            >
              <span className="text-white font-black text-sm drop-shadow-md">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {showRules && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6 backdrop-blur-lg">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#4a1529] rounded-[2.5rem] p-10 max-w-sm relative border-2 border-white/10 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
          <button onClick={() => setShowRules(false)} className="absolute -top-3 -right-3 bg-rose-500 p-2.5 rounded-full shadow-2xl border-2 border-white">
            <X size={24} />
          </button>
          <h3 className="text-center text-3xl font-black text-yellow-400 mb-8 italic tracking-widest uppercase">Rules</h3>
          <ul className="space-y-6 text-sm font-bold text-rose-100">
            <li className="flex gap-4 items-start">
              <span className="bg-yellow-500 text-black px-2 rounded-lg">1</span>
              <p>Choose the quantity of coins and then select a type of food to place a bet on.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="bg-yellow-500 text-black px-2 rounded-lg">2</span>
              <p>Each round, you have 30 seconds to choose a food, and then the winning food will be drawn.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="bg-yellow-500 text-black px-2 rounded-lg">3</span>
              <p>If you bet coins on the winning food, you will receive the corresponding prize money.</p>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
