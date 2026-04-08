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
  { value: 1000, label: '1K', color: 'from-cyan-400 to-blue-600 shadow-cyan-500/50' },
  { value: 50000, label: '50K', color: 'from-pink-400 to-rose-600 shadow-rose-500/50' },
  { value: 500000, label: '500K', color: 'from-yellow-300 to-orange-500 shadow-yellow-500/50' },
  { value: 5000000, label: '5M', color: 'from-fuchsia-500 to-purple-800 shadow-purple-600/50' },
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
      <path d="M 45,0 C 15,200 85,450 45,750 C 15,950 85,1200 45,1200" stroke="#22521d" strokeWidth="5" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="absolute inset-0 flex flex-col justify-between py-10 items-center">
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} animate={{ rotate: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0] }} transition={{ duration: 3 + i, repeat: Infinity }} className="text-xl">
          {i % 2 === 0 ? "🌿" : "🍎"}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const playSound = (type: 'bet' | 'spin' | 'win', muted: boolean) => {
  if (muted) return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  if (type === 'bet') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  } else if (type === 'spin') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
  }
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

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
  playSound('bet', isMuted);
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
   playSound('spin', isMuted);
   
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
    <div className="fixed inset-0 bg-[#080212] flex items-center justify-center z-[100]">
      <div className="bg-white w-full h-1/2 rounded-t-[3rem] flex flex-col items-center justify-center shadow-2xl animate-in slide-in-from-bottom duration-700">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <p className="text-pink-600 font-black text-xl tracking-widest italic">LOADING...</p>
        <p className="text-slate-400 text-xs font-bold mt-2 uppercase">Powered-By Ummy Team</p>
      </div>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 bg-gradient-to-br from-pink-500 via-sky-400 to-pink-400 text-white flex flex-col overflow-hidden select-none font-sans relative">
   
   <LongBranchDecoration className="left-[-20px]" delay={0} />
   <LongBranchDecoration className="right-[-20px]" delay={2} reverse />

   <header className="relative pt-4 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-2">
        <div className="flex gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/20 rounded-xl border border-white/30 backdrop-blur-xl shadow-lg">
            {isMuted ? <VolumeX size={18} className="text-red-400"/> : <Volume2 size={18} className="text-white"/>}
          </button>
          <button onClick={() => setShowRules(true)} className="p-2 bg-white/20 rounded-xl border border-white/30 backdrop-blur-xl shadow-[0_4px_0_rgba(255,255,255,0.2)] active:translate-y-0.5 active:shadow-none transition-all">
            <HelpCircle size={18} className="text-white"/>
          </button>
        </div>
        <div className="relative">
          <h1 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">FRUIT PARTY</h1>
          <Sparkles className="absolute -top-1 -right-4 text-yellow-300 w-4 h-4 animate-pulse" />
        </div>
        <button onClick={onClose} className="p-2 bg-red-500 text-white rounded-xl shadow-lg border border-red-400">
          <X size={18}/>
        </button>
      </div>

      <div className="bg-white/20 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/30 flex gap-1.5 shadow-xl">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-lg">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 gap-4">
      <div className={cn("p-1.5 rounded-[2.8rem] transition-all duration-700 bg-white/30 shadow-2xl backdrop-blur-md relative")}>
        <div className="bg-[#120626]/90 rounded-[2.5rem] p-4 grid grid-cols-3 gap-3 w-[300px] aspect-square relative border border-white/20">
          {ITEMS.map((item, idx) => {
            if (item.id === 'timer') {
              return (
                <div key="timer" className="bg-black/40 rounded-[2rem] flex items-center justify-center border-2 border-white/10 overflow-hidden">
                  <AnimatePresence mode="wait">
                      <motion.span 
                          key={gameState === 'betting' ? timeLeft : 'spin'}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-3xl font-black text-sky-400 tabular-nums"
                      >
                          {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-6 h-6 text-pink-400" />}
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
                  "relative flex flex-col items-center justify-center rounded-[1.8rem] transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden",
                  isHighlighted ? "scale-105 z-20 shadow-[0_0_30px_white] border-white ring-2 ring-white/50 bg-white" : "border-black/40 shadow-xl",
                  `bg-gradient-to-br ${item.color}`,
                  gameState === 'spinning' && !isHighlighted && "grayscale-[0.5] opacity-40"
                )}
              >
                <span className={cn("text-3xl mb-0.5 filter drop-shadow-md z-10", isHighlighted && "scale-110")}>{item.emoji}</span>
                <span className="text-[9px] font-black text-white/90 bg-black/30 px-2 rounded-full z-10">{item.label}</span>
                
                {myBets[item.id] > 0 && (
                  <div className="absolute top-1 right-1 bg-white text-pink-600 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-20">
                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                  </div>
                )}
                
                <AnimatePresence>{isHandPointing && (
                  <motion.div initial={{ scale: 0.5, opacity: 0, x: 20, y: 20 }} animate={{ scale: 1, opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <Pointer size={34} className="text-white fill-white drop-shadow-[0_0_15px_white] -rotate-45 animate-bounce" />
                  </motion.div>
                )}</AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-[260px] bg-white/20 backdrop-blur-xl p-3 rounded-2xl border border-white/30 flex items-center justify-between shadow-2xl">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 rounded-xl shadow-[0_3px_0_#b45309]">
              <GoldCoinIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[8px] text-white/80 font-bold uppercase tracking-wider">Balance</p>
              <p className="text-xl font-black text-white tabular-nums leading-none">
                  {localCoins.toLocaleString()}
              </p>
            </div>
         </div>
      </div>
   </main>

   <footer className="relative mt-auto p-6 z-50 flex justify-center">
      <div className="bg-white/30 backdrop-blur-3xl rounded-[2.5rem] p-4 border border-white/40 shadow-2xl w-fit">
        <div className="flex gap-3 justify-center items-center">
          {CHIPS.map(chip => (
            <button 
              key={chip.value} 
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all border-4 active:translate-y-1 bg-gradient-to-br shadow-xl", chip.color,
                selectedChip === chip.value ? "border-white scale-110 rotate-3" : "border-transparent opacity-60 scale-90",
                gameState !== 'betting' && "opacity-20 cursor-not-allowed"
              )}
            >
              <span className="text-white font-black text-xs drop-shadow-md">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
        <motion.div initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className="bg-[#5a1a32] w-full max-w-xs rounded-[2rem] overflow-hidden border-4 border-yellow-500 shadow-2xl">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 py-3 text-center">
            <h2 className="text-2xl font-black text-white italic drop-shadow-md">YOU WIN</h2>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
             <div className="flex items-center gap-6 bg-black/20 p-4 rounded-2xl w-full justify-between">
                <span className="text-5xl">{winnerData.emoji}</span>
                <div className="flex items-center gap-2">
                  <GoldCoinIcon className="w-8 h-8" />
                  <span className="text-3xl font-black text-yellow-400">+{winnerData.win.toLocaleString()}</span>
                </div>
             </div>
             <div className="w-full space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs font-bold text-white/50 px-2 uppercase">
                   <span>Player</span>
                   <span>Won</span>
                </div>
                {[1, 2, 3].map(rank => (
                  <div key={rank} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                       <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px]", rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-slate-300" : "bg-orange-600")}>{rank}</span>
                       <span className="text-xs text-white">Player_{rank}</span>
                    </div>
                    <span className="text-xs text-yellow-400 font-bold">{rank === 1 ? '300M' : rank === 2 ? '52M' : '30M'}</span>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>

   <AnimatePresence>
    {showRules && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#6b2a42] rounded-[2rem] p-8 max-w-sm relative border-2 border-white/20 shadow-2xl shadow-pink-500/20">
          <button onClick={() => setShowRules(false)} className="absolute -top-3 -right-3 bg-red-500 p-2 rounded-full shadow-lg border-2 border-white">
            <X size={20} />
          </button>
          <h3 className="text-center text-2xl font-black text-yellow-400 mb-6 italic underline decoration-pink-500">Rules</h3>
          <ul className="space-y-4 text-sm font-medium text-pink-100">
            <li className="flex gap-3 leading-relaxed">
              <span className="text-yellow-400 font-black">1.</span>
              Choose the quantity of coins and then select a type of food to place a bet on.
            </li>
            <li className="flex gap-3 leading-relaxed">
              <span className="text-yellow-400 font-black">2.</span>
              Each round, you have 30 seconds to choose a food, and then the winning food will be drawn.
            </li>
            <li className="flex gap-3 leading-relaxed">
              <span className="text-yellow-400 font-black">3.</span>
              If you bet coins on the winning food, you will receive the corresponding prize money.
            </li>
            <li className="flex gap-3 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
              <span className="text-yellow-400 font-black">4.</span>
              All Fruits (Apple, Mango, etc.) are winners if result is "Fruit". 3D Items provide big multipliers!
            </li>
          </ul>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
