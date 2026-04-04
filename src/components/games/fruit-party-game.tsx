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
 X, Volume2, VolumeX, Pointer, Trophy, Sparkles, Music
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
  { value: 5000, label: '5K', color: 'from-pink-400 to-rose-600 shadow-rose-500/50' },
  { value: 500000, label: '500K', color: 'from-yellow-300 to-orange-500 shadow-yellow-500/50' },
  { value: 1000000, label: '1M', color: 'from-fuchsia-500 to-purple-800 shadow-purple-600/50' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

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
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  }
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

const LongBranchDecoration = ({ className, delay = 0, reverse = false }: { className?: string; delay?: number; reverse?: boolean }) => (
  <motion.div
    initial={{ y: -10 }}
    animate={{ y: 10 }}
    transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay }}
    className={cn("absolute top-0 h-full w-[100px] pointer-events-none z-30", className, reverse ? "scale-x-[-1]" : "")}
  >
    <svg viewBox="0 0 100 1200" className="w-full h-full overflow-visible drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)]" preserveAspectRatio="none">
      <path d="M 50,0 C 30,300 70,600 50,900 C 30,1100 60,1200 50,1200" stroke="#1a0d02" strokeWidth="12" fill="none" vectorEffect="non-scaling-stroke" />
      <path d="M 55,0 C 85,250 15,550 55,850 C 85,1050 15,1200 55,1200" stroke="#143613" strokeWidth="7" fill="none" vectorEffect="non-scaling-stroke" />
      <path d="M 45,0 C 15,200 85,450 45,750 C 15,950 85,1200 45,1200" stroke="#22521d" strokeWidth="5" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="absolute inset-0 flex flex-col justify-between py-10 items-center">
      {[...Array(12)].map((_, i) => (
        <motion.div 
          key={i}
          animate={{ rotate: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0], x: i % 2 === 0 ? [0, 5, 0] : [0, -5, 0] }} 
          transition={{ duration: 3 + i, repeat: Infinity }}
          className="text-2xl"
        >
          {i % 3 === 0 ? "🍎" : "🌿"}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const DJVisualizer = ({ colorClass = "bg-pink-500" }: { colorClass?: string }) => (
  <div className="flex items-end gap-0.5 h-16 px-1">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ height: [8, 64, 16, 52, 10] }}
        transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        className={cn("w-1.5 rounded-t-full shadow-[0_0_10px_rgba(255,255,255,0.3)]", colorClass)}
      />
    ))}
  </div>
);

const VisualizerPillar = ({ height = "h-[80%]", colors = ['#ff3366', '#ffcc00', '#00ffcc'] }: { height?: string, colors?: string[] }) => (
  <div className={cn("flex flex-col gap-1.5 w-5 bg-black/60 p-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-2xl z-20", height)}>
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          opacity: [0.4, 1, 0.4],
          scaleX: [1, 1.4, 1],
          backgroundColor: i < 5 ? colors[0] : i < 10 ? colors[1] : colors[2]
        }}
        transition={{ duration: Math.random() * 0.5 + 0.2, repeat: Infinity, delay: i * 0.08 }}
        className="w-full h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
      />
    ))}
  </div>
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
 const [history, setHistory] = useState<string[]>(['grapes', 'pear', 'orange']);
 const [isMuted, setIsMuted] = useState(false);
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);

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
  const totalSteps = (SEQUENCE.length * 8) + SEQUENCE.indexOf(targetIdx); 
  let speed = 40;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   playSound('spin', isMuted);
   
   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 4) speed += 120;
    else if (remaining < 8) speed += 60;
    else if (remaining < 15) speed += 30;
    else if (remaining < 25) speed += 15;
    else if (remaining < 40) speed += 5;
    currentStep++;
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

 return (
  <div className="fixed inset-0 bg-[#080212] text-white flex flex-col h-screen w-screen overflow-hidden select-none font-sans relative">
   
   {/* --- Background Decorations --- */}
   <LongBranchDecoration className="left-[-15px]" delay={0} />
   <LongBranchDecoration className="right-[-15px]" delay={2} reverse />

   {/* --- Header Section --- */}
   <header className="relative pt-8 px-6 flex flex-col items-center z-40 shrink-0">
      <div className="flex justify-between items-center w-full mb-6">
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
          {isMuted ? <VolumeX size={24} className="text-red-400"/> : <Volume2 size={24} className="text-green-400"/>}
        </button>
        <div className="relative">
          <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">FRUIT PARTY</h1>
          <Sparkles className="absolute -top-3 -right-8 text-yellow-400 w-6 h-6 animate-pulse" />
        </div>
        <button onClick={onClose} className="p-3 bg-red-500/20 text-red-500 rounded-2xl border border-red-500/30 shadow-lg">
          <X size={24}/>
        </button>
      </div>

      <div className="bg-black/60 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 flex gap-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-2xl filter drop-shadow-md">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   {/* --- Main Game Center --- */}
   <main className="flex-1 flex flex-col items-center justify-evenly relative z-10 py-4">
      <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
          <VisualizerPillar height="h-[75%]" />
          <VisualizerPillar height="h-[75%]" />
      </div>

      <div className="flex flex-col items-center gap-8 z-40">
        {/* Spinner Grid */}
        <div className={cn("p-2 rounded-[3.5rem] transition-all duration-700", 
             gameState === 'spinning' ? "bg-gradient-to-br from-yellow-400 via-white to-yellow-400 shadow-[0_0_100px_rgba(255,255,255,0.4)] scale-[1.05]" : "bg-indigo-500/30 shadow-2xl")}>
          <div className="bg-[#120626] rounded-[3.2rem] p-5 grid grid-cols-3 gap-4 w-[340px] aspect-square relative border border-white/10">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-black/80 rounded-[2.5rem] flex items-center justify-center border-4 border-yellow-500/30 overflow-hidden shadow-inner">
                    <AnimatePresence mode="wait">
                        <motion.span 
                            key={gameState === 'betting' ? timeLeft : 'spin'}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] tabular-nums"
                        >
                            {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-12 h-12" />}
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
                    "relative flex flex-col items-center justify-center rounded-[2rem] transition-all duration-200 border-b-[6px] active:border-b-0 active:translate-y-1 overflow-hidden group",
                    isHighlighted ? "scale-110 z-20 shadow-[0_0_50px_rgba(255,255,255,0.8)] border-white ring-4 ring-white/50 bg-white" : "border-black/40 shadow-xl",
                    `bg-gradient-to-br ${item.color} opacity-95 hover:opacity-100`,
                    gameState === 'spinning' && !isHighlighted && "grayscale-[0.5] opacity-50"
                  )}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className={cn("text-5xl mb-1 filter drop-shadow-md z-10 transition-transform", isHighlighted && "scale-125")}>{item.emoji}</span>
                  <span className="text-[10px] font-black text-white/90 bg-black/20 px-3 py-0.5 rounded-full z-10 uppercase">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-2 right-2 bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-20 border border-black/10">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}
                  
                  <AnimatePresence>{isHandPointing && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <Pointer size={48} className="text-white fill-white drop-shadow-[0_0_15px_white] -rotate-45 animate-bounce" />
                    </motion.div>
                  )}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Salad Section --- */}
        <div className="flex items-center gap-6 z-40">
           <DJVisualizer colorClass="bg-cyan-400" />
           <div className="flex gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-600/40 p-6 rounded-[2.5rem] border-2 border-white/20 shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-md relative overflow-hidden">
                <motion.span 
                  animate={gameState === 'spinning' ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-5xl block filter drop-shadow-md"
                >
                  🥗
                </motion.span>
              </div>
            ))}
           </div>
           <DJVisualizer colorClass="bg-rose-500" />
        </div>

        {/* --- Balance Display --- */}
        <div className="w-[320px] bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 p-4 rounded-[2rem] border-2 border-white/20 flex items-center justify-between shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden group z-40">
           <div className="flex items-center gap-4 z-10">
              <div className="p-3 bg-gradient-to-br from-yellow-300 via-orange-500 to-yellow-600 rounded-2xl shadow-[0_4px_10px_rgba(234,179,8,0.4)] border-b-4 border-orange-800">
                <GoldCoinIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] mb-0.5">My Balance</p>
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-white to-orange-400 tabular-nums leading-none tracking-tight">
                    {localCoins.toLocaleString()}
                </p>
              </div>
           </div>
           <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[10px] text-white/50 tracking-tighter z-10">
              ID: {currentUser?.uid?.slice(0,6).toUpperCase()}
           </div>
        </div>
      </div>
   </main>

   {/* --- Footer / Chip Selection --- */}
   <footer className="relative mt-auto p-8 z-50 shrink-0">
      <div className="bg-black/40 backdrop-blur-3xl rounded-[3.5rem] p-6 border border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.6)]">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide justify-center items-center">
          {CHIPS.map(chip => (
            <button 
              key={chip.value} 
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all border-[4px] border-white/20 shadow-[0_10px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-2 bg-gradient-to-br", chip.color,
                selectedChip === chip.value ? "ring-4 ring-white scale-110 z-10 border-white" : "opacity-60 scale-90",
                gameState !== 'betting' && "opacity-20 grayscale cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-center">
                <span className="text-white font-black text-lg drop-shadow-lg">{chip.label}</span>
                <div className="w-10 h-1 bg-white/30 rounded-full mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
   </footer>

   {/* --- Win Modal --- */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl">
        <motion.div initial={{ scale: 0.7, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-gradient-to-b from-[#2d0b5a] to-[#120626] border-8 border-yellow-400 rounded-[4rem] p-12 flex flex-col items-center shadow-[0_0_120px_rgba(234,179,8,0.5)]">
          <Trophy className="text-yellow-400 w-24 h-24 mb-8 animate-bounce" />
          <div className="text-[10rem] mb-10 filter drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] leading-none">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-green-400 font-black text-3xl uppercase tracking-[0.3em] mb-4 animate-pulse">BIG WIN!</p>
              <p className="text-8xl font-black text-white tabular-nums tracking-tighter">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-white/20 font-black text-3xl italic tracking-widest">BETTER LUCK NEXT TIME</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
