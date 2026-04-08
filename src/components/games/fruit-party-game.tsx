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

const FloatingChipsEffect = ({ active }: { active: boolean }) => {
  const [chips, setChips] = useState<{ id: number; fruitIdx: number }[]>([]);

  useEffect(() => {
    if (!active) {
      setChips([]);
      return;
    }

    const interval = setInterval(() => {
      const newChips = Array.from({ length: Math.floor(Math.random() * 4) + 6 }, (_, i) => ({
        id: Date.now() + i,
        fruitIdx: SEQUENCE[Math.floor(Math.random() * SEQUENCE.length)]
      }));
      setChips(newChips);
      setTimeout(() => setChips([]), 4500);
    }, 5000);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[45] overflow-visible">
      <AnimatePresence>
        {chips.map((chip) => (
          <motion.div
            key={chip.id}
            initial={{ y: -200, x: 0, opacity: 0, scale: 0.5 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 0.8,
              transition: { duration: 0.8, ease: "backOut" } 
            }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-0"
          >
            <div className="relative -left-1/2">
               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-[8px] font-black text-white">1K</span>
               </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

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

const DJVisualizer = ({ colorClass = "bg-pink-500" }: { colorClass?: string }) => (
  <div className="flex items-end gap-0.5 h-8 px-1">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ height: [4, 32, 10, 28, 6] }}
        transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        className={cn("w-1 rounded-t-full shadow-[0_0_10px_rgba(255,255,255,0.3)]", colorClass)}
      />
    ))}
  </div>
);

const VisualizerPillar = ({ height = "h-48", colors = ['#ff3366', '#ffcc00', '#00ffcc'] }: { height?: string, colors?: string[] }) => (
  <div className={cn("flex flex-col gap-1 w-3 bg-black/40 p-1 rounded-full border border-white/10 backdrop-blur-md shadow-2xl z-20", height)}>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.4, 1, 0.4], scaleX: [1, 1.3, 1], backgroundColor: i < 2 ? colors[0] : i < 5 ? colors[1] : colors[2] }}
        transition={{ duration: Math.random() * 0.5 + 0.2, repeat: Infinity, delay: i * 0.08 }}
        className="w-full h-full rounded-full"
      />
    ))}
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
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 const [showRules, setShowRules] = useState(false);

 useEffect(() => {
   const timer = setTimeout(() => setIsLoading(false), 2000);
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
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
        <h2 className="text-xl font-black italic tracking-widest text-pink-600 drop-shadow-sm">
          POWERED-BY UMMY TEAM
        </h2>
      </div>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 text-white flex flex-col overflow-hidden select-none font-sans relative bg-white">
   
   {/* --- Dynamic Background: Pink, Sky Blue, and White Mixing --- */}
   <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
     {/* Sky Blue Blob */}
     <motion.div 
        animate={{ 
            x: [0, 50, -20, 0], 
            y: [0, -30, 40, 0],
            scale: [1, 1.2, 1.1, 1] 
        }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 w-[80%] h-[80%] bg-sky-200/60 blur-[120px] rounded-full" 
     />
     {/* Pink Blob */}
     <motion.div 
        animate={{ 
            x: [0, -40, 60, 0], 
            y: [0, 50, -20, 0],
            scale: [1, 1.3, 0.9, 1] 
        }} 
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-20 -right-20 w-[80%] h-[80%] bg-pink-200/60 blur-[120px] rounded-full" 
     />
     {/* Central White Glow */}
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-white/40 blur-[100px] rounded-full" />
   </div>

   <header className="relative pt-4 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-2">
        <div className="flex gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/5 rounded-xl border border-black/10 backdrop-blur-xl">
            {isMuted ? <VolumeX size={18} className="text-red-500"/> : <Volume2 size={18} className="text-green-600"/>}
          </button>
          <button onClick={() => setShowRules(true)} className="p-2 bg-black/5 rounded-xl border border-black/10 backdrop-blur-xl">
            <HelpCircle size={18} className="text-blue-500"/>
          </button>
        </div>
        <div className="relative">
          <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-pink-500 via-sky-400 to-indigo-600 drop-shadow-sm">FRUIT PARTY</h1>
          <Sparkles className="absolute -top-1 -right-4 text-pink-400 w-4 h-4 animate-pulse" />
        </div>
        <button onClick={onClose} className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
          <X size={18}/>
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/50 flex gap-1.5 shadow-lg">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-lg">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex items-center justify-between px-4 relative z-10">
      <VisualizerPillar height="h-60" colors={['#FF69B4', '#87CEEB', '#FFFFFF']} />
      
      <div className="flex-1 flex flex-col items-center gap-3 z-40 relative">
        <FloatingChipsEffect active={gameState === 'betting'} />

        <div className={cn("p-1 rounded-[2.5rem] transition-all duration-700", 
             gameState === 'spinning' ? "bg-gradient-to-br from-sky-400 via-white to-pink-400 shadow-[0_0_80px_rgba(135,206,235,0.4)] scale-[1.01]" : "bg-white/20 shadow-2xl backdrop-blur-md")}>
          <div className="bg-white/10 rounded-[2.3rem] p-3 grid grid-cols-3 gap-2.5 w-[280px] aspect-square relative border border-white/50">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-gradient-to-br from-pink-500 to-sky-500 rounded-[1.8rem] flex items-center justify-center border-2 border-white/40 overflow-hidden shadow-inner">
                    <AnimatePresence mode="wait">
                        <motion.span 
                            key={gameState === 'betting' ? timeLeft : 'spin'}
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -15, opacity: 0 }}
                            className="text-3xl font-black text-white tabular-nums"
                        >
                            {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-6 h-6" />}
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
                    "relative flex flex-col items-center justify-center rounded-[1.5rem] transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden",
                    isHighlighted ? "scale-105 z-20 shadow-xl border-white ring-4 ring-pink-300 bg-white" : "border-black/10 shadow-md",
                    `bg-gradient-to-br ${item.color} opacity-95`,
                    gameState === 'spinning' && !isHighlighted && "grayscale-[0.5] opacity-50"
                  )}
                >
                  <span className={cn("text-3xl mb-0.5 filter drop-shadow-md z-10", isHighlighted && "scale-110")}>{item.emoji}</span>
                  <span className="text-[8px] font-black text-white/90 bg-black/20 px-1.5 rounded-full z-10">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-1 right-1 bg-white text-pink-600 text-[8px] font-black px-1 py-0.5 rounded-full shadow-lg z-20">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}
                  
                  <AnimatePresence>{isHandPointing && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <Pointer size={30} className="text-white fill-sky-400 drop-shadow-[0_0_10px_white] -rotate-45 animate-bounce" />
                    </motion.div>
                  )}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 z-40">
           <DJVisualizer colorClass="bg-sky-400" />
           <div className="flex gap-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/40 p-3 rounded-[1.5rem] border border-white/60 shadow-lg backdrop-blur-md">
                <motion.span 
                  animate={gameState === 'spinning' ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-2xl block"
                >
                  🥗
                </motion.span>
              </div>
            ))}
           </div>
           <DJVisualizer colorClass="bg-pink-500" />
        </div>

        <div className="w-[240px] bg-white/30 p-2.5 rounded-xl border border-white/60 flex items-center justify-between shadow-xl backdrop-blur-md z-40">
           <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-yellow-300 via-orange-500 to-yellow-600 rounded-lg shadow-sm">
                <GoldCoinIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[7px] text-pink-600 font-bold uppercase tracking-wider mb-0">Balance</p>
                <p className="text-lg font-black text-gray-800 tabular-nums leading-none">
                    {localCoins.toLocaleString()}
                </p>
              </div>
           </div>
           <div className="bg-black/5 px-1.5 py-0.5 rounded border border-black/5 font-mono text-[8px] text-gray-500">
              #{currentUser?.uid?.slice(0,4).toUpperCase()}
           </div>
        </div>
      </div>
      
      <VisualizerPillar height="h-60" colors={['#87CEEB', '#FFFFFF', '#FF69B4']} />
   </main>

   <footer className="relative mt-auto p-4 z-50 flex justify-center">
      <div className="bg-white/30 backdrop-blur-3xl rounded-[2rem] p-3 border border-white/60 shadow-xl w-fit">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide justify-center items-center">
          {CHIPS.map(chip => (
            <button 
              key={chip.value} 
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all border-[2px] border-white/40 active:translate-y-1 bg-gradient-to-br", chip.color,
                selectedChip === chip.value ? "ring-4 ring-pink-400 scale-105 border-white opacity-100" : "opacity-50 scale-90",
                gameState !== 'betting' && "opacity-10 grayscale cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-center">
                <span className="text-white font-black text-[10px] drop-shadow-md">{chip.label}</span>
                <div className="w-5 h-0.5 bg-white/20 rounded-full mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-white/60 backdrop-blur-md">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-white to-pink-50 border-4 border-sky-400 rounded-[2.5rem] p-8 flex flex-col items-center shadow-2xl">
          <Trophy className="text-yellow-500 w-12 h-12 mb-4 animate-bounce" />
          <div className="text-7xl mb-6">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-green-500 font-bold text-lg uppercase mb-1">WIN!</p>
              <p className="text-5xl font-black text-gray-800">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-gray-400 font-bold text-xl italic">TRY AGAIN</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>

   <AnimatePresence>
    {showRules && (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white w-full max-w-sm rounded-[2rem] p-6 relative border-4 border-pink-200 shadow-2xl text-gray-700 font-medium"
        >
          <button 
            onClick={() => setShowRules(false)}
            className="absolute -top-3 -right-3 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center border-2 border-white z-10 shadow-lg"
          >
            <X size={24} className="text-white" />
          </button>

          <h2 className="text-sky-500 text-center text-xl font-bold mb-6">Game Rules</h2>
          
          <div className="space-y-4 text-sm leading-relaxed">
            <div className="flex gap-2">
              <span className="text-pink-500 font-bold">1.</span>
              <p>Choose the quantity of coins and then select a food to place your bet.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-pink-500 font-bold">2.</span>
              <p>Each round has 30 seconds to bet before the lucky draw starts.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-pink-500 font-bold">3.</span>
              <p>Win coins based on the multiplier of the food that lands!</p>
            </div>
          </div>
          <div className="mt-8 text-center opacity-40 text-[10px] font-mono">
            FRUIT PARTY v1.1.0
          </div>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
