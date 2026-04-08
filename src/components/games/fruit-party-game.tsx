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

const BanianTree = ({ side }: { side: 'left' | 'right' }) => (
  <div className={cn("absolute top-0 bottom-0 w-24 z-[60] pointer-events-none", side === 'left' ? "left-0" : "right-0")}>
    {/* Thick Main Branches */}
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ rotate: side === 'left' ? [-2, 2, -2] : [2, -2, 2] }}
        transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
            "absolute top-0 w-2 bg-gradient-to-b from-[#3d2b1f] via-[#5d4037] to-transparent rounded-full shadow-lg",
            side === 'left' ? "left-4" : "right-4"
        )}
        style={{ height: `${60 + i * 10}%`, left: `${i * 20}px` }}
      >
        {/* Hanging Leaves and Apples */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-8">
            <span className="text-xl animate-bounce">🌿</span>
            <span className="text-2xl drop-shadow-lg">🍎</span>
            <span className="text-xl opacity-80">🌿</span>
        </div>
      </motion.div>
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
   // Turun Turun sound for chips/betting
   chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3'); 
   spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
   if (spinAudio.current) spinAudio.current.loop = true;
   return () => clearTimeout(timer);
 }, []);

 // Random Chip Shower effect (1K, 5M etc)
 useEffect(() => {
  if (gameState !== 'betting') return;
  const showerInterval = setInterval(() => {
    const randomChip = CHIPS_DATA[Math.floor(Math.random() * CHIPS_DATA.length)];
    const bunch = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      itemIdx: SEQUENCE[Math.floor(Math.random() * SEQUENCE.length)],
      label: randomChip.label,
      color: randomChip.color,
      x: (Math.random() * 40) - 20,
      y: (Math.random() * 20) - 10,
      fromHeader: true
    }));
    setDroppedChips(prev => [...prev, ...bunch]);
  }, 5000);
  return () => clearInterval(showerInterval);
 }, [gameState]);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const pointerInterval = setInterval(() => {
    setHintStep(prev => (prev + 1) % SEQUENCE.length);
  }, 1500); 
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

 const playSound = (type: 'bet' | 'spin' | 'stop') => {
    if (isMuted) return;
    if (type === 'bet' && chipAudio.current) {
        chipAudio.current.currentTime = 0;
        chipAudio.current.playbackRate = 2; // Fast Turun Turun
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
  playSound('bet');
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
        <Loader2 className="w-16 h-16 text-emerald-700 animate-spin" />
        <h2 className="text-xl font-black italic text-emerald-800">POWERED-BY UMMY TEAM</h2>
      </div>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 text-white flex flex-col overflow-hidden select-none font-sans relative bg-gradient-to-b from-emerald-50 to-white">
   
   <BanianTree side="left" />
   <BanianTree side="right" />

   <header className="relative pt-6 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-2">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/10 rounded-xl border border-white/20">
            {isMuted ? <VolumeX size={20} className="text-red-500"/> : <Volume2 size={20} className="text-blue-600"/>}
        </button>
        <h1 className="text-2xl font-black italic text-emerald-800 drop-shadow-sm">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><X size={20}/></button>
      </div>
      <div className="bg-white/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white flex gap-2 shadow-sm">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-xl">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
      <div className="flex flex-col items-center gap-6 z-40 relative">
        <div className={cn("p-2 rounded-[3rem] transition-all duration-500 relative bg-white/40 shadow-2xl backdrop-blur-xl border border-white/60", gameState === 'spinning' && "scale-105")}>
          <div className="bg-emerald-900/5 rounded-[2.8rem] p-4 grid grid-cols-3 gap-3 w-[290px] aspect-square relative overflow-hidden">
            
            {/* --- Chips Layer --- */}
            <div className="absolute inset-0 z-50 pointer-events-none">
                <AnimatePresence>
                    {droppedChips.map(chip => (
                        <motion.div key={chip.id} initial={{ y: -400, opacity: 0, scale: 2 }} animate={{ y: 0, opacity: 1, scale: 0.8 }} exit={{ opacity: 0, scale: 0 }} className="absolute" style={{ left: `${(chip.itemIdx % 3) * 33.3 + 16.6}%`, top: `${Math.floor(chip.itemIdx / 3) * 33.3 + 16.6}%`, marginLeft: chip.x, marginTop: chip.y }}>
                            <div className={cn("w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center bg-gradient-to-br", chip.color)}>
                                <span className="text-[8px] font-black text-white">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-gradient-to-br from-emerald-600 to-green-400 rounded-[2rem] flex items-center justify-center border-2 border-white shadow-lg">
                    <AnimatePresence mode="wait">
                      <motion.span key={gameState === 'betting' ? timeLeft : 'spin'} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-4xl font-black text-white">
                        {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-8 h-8" />}
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
                  onClick={() => handlePlaceBet(item.id, idx)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-[1.8rem] transition-all duration-200 border-b-4 active:border-b-0",
                    isHighlighted 
                        ? "z-30 shadow-[0_0_25px_rgba(255,215,0,0.8)] border-yellow-400 ring-4 ring-yellow-400 bg-white scale-110" 
                        : "border-black/5 shadow-md",
                    `bg-gradient-to-br ${item.color}`,
                    gameState === 'spinning' && !isHighlighted && "opacity-40"
                  )}
                >
                  <span className={cn("text-3xl drop-shadow-sm transition-transform", isHighlighted && "scale-125")}>{item.emoji}</span>
                  <span className="text-[10px] font-black text-white mt-1">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-yellow-400 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md border border-white">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </motion.div>
                  )}

                  {/* Hand Pointer */}
                  <AnimatePresence>
                    {isHandPointing && (
                      <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <Pointer size={40} className="text-white fill-white drop-shadow-xl -rotate-45 animate-bounce" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* Balance Display Wrapped by Branches visually in CSS/Layout */}
        <div className="w-[260px] bg-gradient-to-r from-emerald-700 to-green-600 p-3.5 rounded-3xl border-2 border-white flex items-center justify-between shadow-2xl z-40 relative group">
           <div className="flex items-center gap-4">
              <div className="p-2.5 bg-yellow-400 rounded-2xl shadow-inner border border-white/50 animate-pulse">
                <GoldCoinIcon className="w-6 h-6 text-emerald-900" />
              </div>
              <div>
                <p className="text-[10px] text-white/80 font-black uppercase tracking-widest leading-none mb-1">Balance</p>
                <p className="text-2xl font-black text-white tabular-nums">{localCoins.toLocaleString()}</p>
              </div>
           </div>
           <button onClick={() => setShowRules(true)} className="p-2 bg-white/20 rounded-full border border-white/40"><HelpCircle size={20}/></button>
        </div>
      </div>
   </main>

   <footer className="relative mt-auto pb-10 px-4 z-[70] flex justify-center">
      <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-4 border-2 border-white shadow-2xl">
        <div className="flex gap-4 items-center">
          {CHIPS_DATA.map(chip => (
            <motion.button 
              key={chip.value} 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={selectedChip === chip.value ? { y: [0, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 border-white bg-gradient-to-br shadow-xl", chip.color,
                selectedChip === chip.value ? "ring-4 ring-yellow-400 scale-110" : "opacity-40 grayscale-[0.4]",
                gameState !== 'betting' && "opacity-20"
              )}
            >
              <span className="text-white font-black text-xs drop-shadow-md">{chip.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-emerald-950/60 backdrop-blur-md">
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-white border-[6px] border-yellow-400 rounded-[3.5rem] p-10 flex flex-col items-center shadow-2xl w-[280px]">
          <Trophy className="text-yellow-500 w-16 h-16 mb-4 animate-bounce" />
          <div className="text-8xl mb-4 drop-shadow-2xl">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-emerald-600 font-black text-2xl uppercase tracking-tighter">BIG WIN!</p>
              <p className="text-4xl font-black text-gray-800">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-gray-400 font-black text-xl italic">Good Luck Next!</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
