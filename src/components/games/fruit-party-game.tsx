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

const DJVisualizer = ({ colorClass = "bg-pink-500" }: { colorClass?: string }) => (
  <div className="flex items-end gap-0.5 h-6 px-1">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ height: [4, 24, 8, 20, 6] }}
        transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        className={cn("w-1 rounded-t-full", colorClass)}
      />
    ))}
  </div>
);

const VisualizerPillar = ({ height = "h-48", colors = ['#ff3366', '#ffcc00', '#00ffcc'] }: { height?: string, colors?: string[] }) => (
  <div className={cn("flex flex-col gap-1 w-2.5 bg-white/20 p-1 rounded-full border border-white/40 backdrop-blur-md z-20", height)}>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.4, 1, 0.4], backgroundColor: i < 2 ? colors[0] : i < 5 ? colors[1] : colors[2] }}
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
 const [showRules, setShowRules] = useState(false);
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, x: number, y: number, fromHeader?: boolean}[]>([]);
 
 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
   const timer = setTimeout(() => setIsLoading(false), 2000);
   chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
   spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
   if (spinAudio.current) spinAudio.current.loop = true;
   return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const effectInterval = setInterval(() => {
    const bunch = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      itemIdx: SEQUENCE[Math.floor(Math.random() * SEQUENCE.length)],
      label: 'WIN',
      color: 'from-yellow-400 to-amber-600',
      x: (Math.random() * 40) - 20,
      y: (Math.random() * 20) - 10,
      fromHeader: true
    }));
    setDroppedChips(prev => [...prev, ...bunch]);
  }, 8000);
  return () => clearInterval(effectInterval);
 }, [gameState]);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const interval = setInterval(() => {
    setHintStep(prev => (prev + 1) % SEQUENCE.length);
  }, 2000); 
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

 const playSound = (type: 'chip' | 'spin' | 'stop') => {
    if (isMuted) return;
    if (type === 'chip' && chipAudio.current) {
        chipAudio.current.currentTime = 0;
        chipAudio.current.play().catch(() => {});
    }
    if (type === 'spin' && spinAudio.current) {
        spinAudio.current.play().catch(() => {});
    }
    if (type === 'stop' && spinAudio.current) {
        spinAudio.current.pause();
        spinAudio.current.currentTime = 0;
    }
 };

 const handlePlaceBet = (id: string, idx: number) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'No coins!', variant: 'destructive' });
   return;
  }
  playSound('chip');
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
  playSound('spin');
  const itemsOnly = ITEMS.filter(i => i.id !== 'timer');
  const winItem = itemsOnly[Math.floor(Math.random() * itemsOnly.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 7) + SEQUENCE.indexOf(targetIdx); 
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
    playSound('stop');
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
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
        <h2 className="text-xl font-black italic tracking-widest text-pink-600 drop-shadow-sm">POWERED-BY UMMY TEAM</h2>
      </div>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 text-white flex flex-col overflow-hidden select-none font-sans relative bg-white">
   <div className="absolute inset-0 z-0 pointer-events-none">
     <motion.div animate={{ x: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] bg-pink-500 blur-[120px] rounded-full opacity-60" />
     <motion.div animate={{ x: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity }} className="absolute -bottom-[10%] -right-[10%] w-[80%] h-[80%] bg-sky-400 blur-[130px] rounded-full opacity-60" />
   </div>

   <header className="relative pt-4 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-2">
        <div className="flex gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/10 rounded-xl border border-white/20">
                {isMuted ? <VolumeX size={18} className="text-red-500"/> : <Volume2 size={18} className="text-blue-600"/>}
            </button>
            <button onClick={() => setShowRules(true)} className="p-2 bg-black/10 rounded-xl border border-white/20">
                <HelpCircle size={18} className="text-pink-600"/>
            </button>
        </div>
        <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-pink-600 via-sky-500 to-indigo-700">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
          <X size={18}/>
        </button>
      </div>
      <div className="bg-white/60 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/80 flex gap-1.5 shadow-sm">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-lg">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex items-center justify-between px-4 relative z-10">
      <VisualizerPillar height="h-56" colors={['#FF1493', '#FFFFFF', '#00BFFF']} />
      <div className="flex-1 flex flex-col items-center gap-4 z-40 relative">
        <div className={cn("p-1.5 rounded-[2rem] transition-all duration-500 relative bg-white/40 shadow-xl backdrop-blur-xl border border-white/60", gameState === 'spinning' && "scale-[1.02]")}>
          <div className="bg-white/10 rounded-[1.8rem] p-2.5 grid grid-cols-3 gap-2 w-[260px] aspect-square relative overflow-hidden">
            <div className="absolute inset-0 z-50 pointer-events-none">
                <AnimatePresence>
                    {droppedChips.map(chip => (
                        <motion.div key={chip.id} initial={chip.fromHeader ? { y: -500, opacity: 0, scale: 0 } : { y: -300, opacity: 0, scale: 2 }} animate={{ y: 0, opacity: 1, scale: 0.75 }} exit={{ opacity: 0, scale: 0 }} className="absolute" style={{ left: `${(chip.itemIdx % 3) * 33.3 + 16.6}%`, top: `${Math.floor(chip.itemIdx / 3) * 33.3 + 16.6}%`, marginLeft: chip.x, marginTop: chip.y }}>
                            <div className={cn("w-6 h-6 rounded-full border border-white shadow-md flex items-center justify-center bg-gradient-to-br", chip.color)}>
                                <span className="text-[6px] font-black text-white">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-gradient-to-br from-pink-500 to-sky-500 rounded-[1.5rem] flex items-center justify-center border border-white shadow-inner">
                    <AnimatePresence mode="wait"><motion.span key={gameState === 'betting' ? timeLeft : 'spin'} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-3xl font-black text-white">{gameState === 'betting' ? timeLeft : <Music className="animate-spin w-6 h-6" />}</motion.span></AnimatePresence>
                  </div>
                );
              }
              const isHighlighted = highlightIdx === idx;
              const isHandPointing = gameState === 'betting' && SEQUENCE[hintStep] === idx;
              return (
                <button key={item.id} onClick={() => handlePlaceBet(item.id, idx)} className={cn("relative flex flex-col items-center justify-center rounded-[1.4rem] transition-all duration-200 border-b-[3px] active:border-b-0", isHighlighted ? "z-20 shadow-xl border-white ring-2 ring-white bg-white" : "border-black/5 shadow-md", `bg-gradient-to-br ${item.color}`, gameState === 'spinning' && !isHighlighted && "opacity-50")}>
                  <span className={cn("text-2xl drop-shadow-sm z-10 transition-transform", isHighlighted && "scale-110")}>{item.emoji}</span>
                  <span className="text-[10px] font-black text-white mt-0.5 z-10">{item.label}</span>
                  {myBets[item.id] > 0 && <div className="absolute top-0.5 right-0.5 bg-white text-pink-600 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm z-20">{myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}</div>}
                  <AnimatePresence>{isHandPointing && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"><Pointer size={35} className="text-white fill-white drop-shadow-md -rotate-45 animate-bounce" /></motion.div>}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 z-40">
           <DJVisualizer colorClass="bg-sky-400" />
           <div className="flex gap-3">
             <div className="bg-white/50 p-2 rounded-2xl border border-white shadow-md"><span className="text-2xl">🥗</span></div>
             <div className="bg-white/50 p-2 rounded-2xl border border-white shadow-md"><span className="text-2xl">🥗</span></div>
           </div>
           <DJVisualizer colorClass="bg-pink-500" />
        </div>
        <div className="w-[240px] bg-gradient-to-r from-pink-500 to-sky-500 p-2.5 rounded-2xl border border-white flex items-center justify-between shadow-xl z-40">
           <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-xl shadow-inner border border-white/30"><GoldCoinIcon className="w-5 h-5 text-white" /></div>
              <div>
                <p className="text-[8px] text-white/80 font-black uppercase tracking-widest leading-none mb-1">Total Balance</p>
                <p className="text-lg font-black text-white tabular-nums leading-none">{localCoins.toLocaleString()}</p>
              </div>
           </div>
        </div>
      </div>
      <VisualizerPillar height="h-56" colors={['#00BFFF', '#FFFFFF', '#FF1493']} />
   </main>

   <footer className="relative mt-auto p-4 z-50 flex justify-center">
      <div className="bg-gradient-to-b from-white/60 to-white/30 backdrop-blur-3xl rounded-[2.5rem] p-3 border border-white shadow-2xl w-fit">
        <div className="flex gap-3 justify-center items-center">
          {CHIPS_DATA.map(chip => (
            <button key={chip.value} disabled={gameState !== 'betting'} onClick={() => setSelectedChip(chip.value)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 border-white active:translate-y-1 bg-gradient-to-br shadow-md", chip.color, selectedChip === chip.value ? "ring-[3px] ring-pink-500 scale-105" : "opacity-40 scale-90", gameState !== 'betting' && "grayscale")}>
              <span className="text-white font-black text-[10px] drop-shadow-sm">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white border-[3px] border-sky-400 rounded-[2.5rem] p-6 flex flex-col items-center shadow-2xl w-[240px]">
          <Trophy className="text-yellow-500 w-10 h-10 mb-2" />
          <div className="text-6xl mb-3 drop-shadow-lg">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-green-500 font-black text-lg uppercase">WINNER!</p>
              <p className="text-3xl font-black text-gray-800">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-gray-400 font-black text-lg italic">Next Luck!</p>}
        </motion.div>
      </motion.div>
    )}

    {showRules && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#8b3a4a] border-[3px] border-yellow-500 rounded-[2rem] w-full max-w-sm relative overflow-hidden shadow-2xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-yellow-400 text-2xl font-black italic tracking-wider">Rule</h2>
                <button onClick={() => setShowRules(false)} className="bg-black/20 p-2 rounded-full border border-white/20"><X size={20} className="text-white"/></button>
            </div>
            <div className="space-y-4 text-white/90 font-medium text-sm leading-relaxed">
                <div className="flex gap-3"><span className="text-yellow-400 font-black">1.</span><p>Choose the quantity of coins and then select a type of food to place a bet on.</p></div>
                <div className="flex gap-3"><span className="text-yellow-400 font-black">2.</span><p>Each round, you have 30 seconds to choose a food, and then the winning food will be drawn.</p></div>
                <div className="flex gap-3"><span className="text-yellow-400 font-black">3.</span><p>If you bet coins on the winning food, you will receive the corresponding prize money.</p></div>
                <div className="flex gap-3"><span className="text-yellow-400 font-black">4.</span><p>If the winning food is a fruit, then apple, mango, strawberry, and lemon are all winners. If the winning food is a pizza, then fish, burger, pizza, and chicken are all winners.</p></div>
            </div>
            <div className="mt-8 text-center"><p className="text-white/30 text-[10px] font-bold">v1.0.12</p></div>
          </div>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
