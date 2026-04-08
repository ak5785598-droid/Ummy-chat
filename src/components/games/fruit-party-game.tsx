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
  { id: 'apple', emoji: '🍎', multiplier: 5, label: 'x5', color: 'from-red-400 to-red-600', index: 0 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: 'x5', color: 'from-orange-400 to-amber-500', index: 1 },
  { id: 'grapes', emoji: '🍇', multiplier: 5, label: 'x5', color: 'from-purple-400 to-indigo-500', index: 2 },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: 'x5', color: 'from-yellow-400 to-orange-500', index: 3 },
  { id: 'watermelon', emoji: '🍉', multiplier: 10, label: 'x10', color: 'from-green-400 to-emerald-500', index: 4 },
  { id: 'pineapple', emoji: '🍍', multiplier: 15, label: 'x15', color: 'from-yellow-500 to-amber-600', index: 5 },
  { id: 'strawberry', emoji: '🍓', multiplier: 25, label: 'x25', color: 'from-pink-400 to-rose-500', index: 6 },
  { id: 'bell', emoji: '🔔', multiplier: 45, label: 'x45', color: 'from-yellow-300 to-yellow-500', index: 7 },
];

const CHIPS_DATA = [
  { value: 100, label: '100', color: 'from-blue-400 to-cyan-500' },
  { value: 1000, label: '1K', color: 'from-green-400 to-emerald-500' },
  { value: 5000, label: '5K', color: 'from-blue-500 to-indigo-600' },
  { value: 10000, label: '10K', color: 'from-orange-400 to-red-500' },
  { value: 50000, label: '50K', color: 'from-red-500 to-rose-600' },
  { value: 10, label: '10', color: 'from-purple-400 to-fuchsia-500' }, // Extra 10 just in case
];

const SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7];


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
 const tickAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
   const timer = setTimeout(() => setIsLoading(false), 2000);
   chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3'); 
   spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
   tickAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/707/707-preview.mp3'); 
   return () => clearTimeout(timer);
 }, []);

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

 const playSound = (type: 'bet' | 'spin' | 'stop' | 'tick') => {
    if (isMuted) return;
    if (type === 'bet' && chipAudio.current) {
        chipAudio.current.currentTime = 0;
        chipAudio.current.playbackRate = 2;
        chipAudio.current.play().catch(() => {});
    }
    if (type === 'tick' && tickAudio.current) {
        tickAudio.current.currentTime = 0;
        tickAudio.current.playbackRate = 3;
        tickAudio.current.play().catch(() => {});
    }
    if (type === 'spin' && spinAudio.current) {
        spinAudio.current.currentTime = 0;
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
  const itemsOnly = ITEMS.filter(i => i.id !== 'timer');
  const winItem = itemsOnly[Math.floor(Math.random() * itemsOnly.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 6) + SEQUENCE.indexOf(targetIdx); 
  let speed = 40;
  
  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   
   // Logic for Tick+Tick+Tick+Whirrrr sound
   if (currentStep < 8) {
     playSound('tick'); // Slow ticks at start
   } else if (currentStep === 8) {
     playSound('spin'); // The "Whirrrr" kicks in
   }

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
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
     {/* LIVE STATUS BAR */}
   <div className="absolute top-[22%] left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
      <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Today's Win <span className="text-yellow-400 ml-1">0</span></span>
   </div>

   <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
      <div className="relative w-[340px] h-[340px] flex items-center justify-center">
        {/* WHEEL SPOKES/LINES */}
        <div className="absolute inset-0 border-8 border-yellow-600/20 rounded-full" />
        {[...Array(4)].map((_, i) => (
           <div key={i} className="absolute w-full h-[2px] bg-yellow-600/10" style={{ transform: `rotate(${i * 45}deg)` }} />
        ))}
        
        {/* CENTER MASCOT AREA */}
        <div className="z-50 w-[140px] h-[140px] rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 border-4 border-white shadow-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden group">
           <div className="absolute inset-0 bg-white/20 animate-shine -skew-x-[30deg]" />
           <motion.div 
             animate={{ y: [0, -5, 0] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="text-6xl drop-shadow-lg mb-1"
           >
             🍉
           </motion.div>
           <div className="bg-red-500 px-4 py-1 rounded-full border-2 border-white/40 shadow-xl">
             <p className="text-[9px] font-black uppercase text-white tracking-widest text-center leading-none">Bet Time</p>
             <p className="text-xl font-black text-white text-center leading-tight">
               {gameState === 'betting' ? `${timeLeft}s` : <span className="animate-pulse">SPIN</span>}
             </p>
           </div>
        </div>

        {/* BETTING ITEMS IN CIRCULAR FORMATION */}
        {ITEMS.map((item, idx) => {
          const angle = (idx * 45) - 90; // Start at top
          const radius = 125;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          const isHighlighted = highlightIdx === idx;
          const isHandPointing = gameState === 'betting' && SEQUENCE[hintStep] === idx;

          return (
            <motion.div 
              key={item.id}
              className="absolute z-40"
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)' }}
            >
              <button
                onClick={() => handlePlaceBet(item.id, idx)}
                className={cn(
                  "relative h-20 w-20 flex flex-col items-center justify-center rounded-full transition-all duration-300 border-4 shadow-xl active:scale-90",
                  isHighlighted 
                      ? "shadow-[0_0_30px_rgba(255,215,0,0.8)] border-yellow-400 ring-4 ring-yellow-400 bg-white scale-125 z-[60]" 
                      : "border-white/50 bg-gradient-to-br",
                  item.color,
                  gameState === 'spinning' && !isHighlighted && "opacity-40 grayscale-[0.3] scale-90"
                )}
              >
                  {/* MULTIPLIER BADGE (Pinned to bottom of icon) */}
                  <div className="absolute -bottom-1 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-black/5 shadow-sm">
                    <span className="text-[9px] font-black text-slate-800">{item.label}</span>
                  </div>

                  <span className={cn("text-4xl drop-shadow-md transition-transform", isHighlighted && "scale-110")}>{item.emoji}</span>
                  
                  {myBets[item.id] > 0 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-3 bg-yellow-400 text-slate-900 h-8 w-8 rounded-full shadow-lg border-4 border-white flex items-center justify-center">
                       <span className="text-[9px] font-black">{myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}</span>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {isHandPointing && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-8 left-1/2 -translate-x-1/2 z-40">
                        <Pointer size={30} className="text-white fill-white drop-shadow-2xl animate-bounce" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CHIP DROPS OVERLAY */}
                  <div className="absolute inset-0 pointer-events-none">
                     <AnimatePresence>
                        {droppedChips.filter(c => c.itemIdx === idx).map(chip => (
                           <motion.div key={chip.id} initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' }} className="absolute top-1/2 left-1/2">
                              <div className={cn("w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center bg-gradient-to-br", chip.color)} style={{ marginLeft: chip.x, marginTop: chip.y }}>
                                 <span className="text-[6px] font-black text-white">{chip.label}</span>
                              </div>
                           </motion.div>
                        ))}
                     </AnimatePresence>
                  </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* RESULT HISTORY TAPE */}
      <div className="w-full max-w-[320px] bg-black/30 backdrop-blur-md rounded-2xl p-2 border border-white/10 mt-6 flex flex-col gap-2">
         <div className="flex items-center justify-between px-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Result History</span>
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
               <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            </div>
         </div>
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
           {history.map((id, i) => (
             <motion.div 
               initial={{ x: 20, opacity: 0 }} 
               animate={{ x: 0, opacity: 1 }} 
               key={i} 
               className={cn(
                 "h-10 w-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/5",
                 i === 0 && "bg-yellow-400/20 border-yellow-400/40 relative"
               )}
             >
               {i === 0 && <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-yellow-400 text-black px-1 rounded font-black italic">NEW</span>}
               <span className="text-xl">{ITEMS.find(it => it.id === id)?.emoji}</span>
             </motion.div>
           ))}
         </div>
      </div>
   </main>

   {/* PREMIUM CHIP BAR */}
   <footer className="relative mt-auto pb-12 px-6 z-[70] flex flex-col items-center gap-6">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 mb-[-10px]">Choose the amount wager -{'>'} Choose fruit</p>
      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-4 border-2 border-white shadow-2xl w-full max-w-[400px]">
        <div className="flex gap-3 items-center justify-between overflow-x-auto no-scrollbar px-2">
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
                "w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all border-4 border-white bg-gradient-to-br shadow-xl", chip.color,
                selectedChip === chip.value ? "ring-4 ring-yellow-400 scale-110" : "opacity-40 grayscale-[0.4]",
                gameState !== 'betting' && "opacity-20"
              )}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full blur-[2px]" />
              <span className="text-white font-black text-[12px] drop-shadow-md relative z-10">{chip.label}</span>
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
