'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 X, Volume2, VolumeX, Pointer
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay } from '@/components/game-result-overlay';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5', index: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '×10', index: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '×5', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '×45', index: 3 },
  { id: 'timer', emoji: '', multiplier: 0, label: '', index: 4 }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '×25', index: 5 },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '×5', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'bg-emerald-500 shadow-emerald-900/50' },
  { value: 5000, label: '5,000', color: 'bg-rose-500 shadow-rose-900/50' },
  { value: 50000, label: '50,000', color: 'bg-blue-600 shadow-blue-900/50' },
  { value: 500000, label: '500,000', color: 'bg-purple-600 shadow-purple-900/50' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3]; // Clockwise around center

const BranchFruit = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1, 1, 0], 
      opacity: [0, 1, 1, 0],
      y: [0, 0, 80],
    }}
    transition={{ duration: 4, repeat: Infinity, delay }}
    className="text-2xl"
  >
    {emoji}
  </motion.div>
);

// DJ Visualizer Bar Component
const VisualizerPillar = () => {
  return (
    <div className="flex flex-col gap-[2px] h-64 w-8 bg-black/20 p-1 rounded-sm border border-white/5">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0.2, 1, 0.2],
            backgroundColor: i < 5 ? '#f87171' : i < 12 ? '#fbbf24' : '#4ade80'
          }}
          transition={{
            duration: Math.random() * 0.5 + 0.2,
            repeat: Infinity,
            delay: i * 0.05
          }}
          className="w-full h-2 rounded-sm shadow-[0_0_5px_rgba(0,0,0,0.5)]"
        />
      ))}
    </div>
  );
};

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
 const [history, setHistory] = useState<string[]>(['grapes', 'pear', 'grapes', 'orange', 'cherry', 'apple', 'grapes', 'lemon', 'mango']);
 const [isMuted, setIsMuted] = useState(false);
 const [hintStep, setHintStep] = useState(0);

 // Hand movement logic
 useEffect(() => {
  if (gameState !== 'betting') return;
  const interval = setInterval(() => {
    setHintStep(prev => (prev + 1) % SEQUENCE.length);
  }, 800);
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
  if (id === 'timer' || gameState !== 'betting' || !currentUser || !userProfile) return;
  if ((userProfile.wallet?.coins || 0) < selectedChip) {
   toast({ title: 'Insufficient Coins!', variant: 'destructive' });
   return;
  }
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 
    'wallet.coins': increment(-selectedChip) 
  });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  const validItems = ITEMS.filter(i => i.id !== 'timer');
  const winItem = validItems[Math.floor(Math.random() * validItems.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 4) + SEQUENCE.indexOf(targetIdx);
  let speed = 60;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 10) speed += 50;
    setTimeout(run, speed);
   } else {
    setTimeout(() => finalizeResult(winItem), 800);
   }
  };
  run();
 };

 const finalizeResult = (winItem: any) => {
  const bet = myBets[winItem.id] || 0;
  const win = bet * winItem.multiplier;
  setHistory(prev => [winItem.id, ...prev].slice(0, 9));
  
  if (win > 0) {
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 
      'wallet.coins': increment(win),
      updatedAt: serverTimestamp()
    });
  }

  setGameState('result');
  setTimeout(() => {
   setMyBets({});
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(30);
  }, 4000);
 };

 return (
  <div className="fixed inset-0 bg-[#0a0514] text-white flex flex-col overflow-hidden font-sans">
   
   {/* --- DECORATIVE HEADER --- */}
   <header className="relative pt-8 px-6 flex flex-col items-center">
      <div className="absolute top-0 left-0 w-full flex justify-between px-2 pointer-events-none">
        <div className="relative">
          <svg width="140" height="80" viewBox="0 0 140 80" className="opacity-80">
            <path d="M0 0 Q 50 10, 80 60" stroke="#1b3a1a" strokeWidth="6" fill="none" />
          </svg>
          <div className="absolute top-10 left-10"><BranchFruit emoji="🍓" delay={0}/></div>
        </div>
        <div className="relative scale-x-[-1]">
          <svg width="140" height="80" viewBox="0 0 140 80" className="opacity-80">
            <path d="M0 0 Q 50 10, 80 60" stroke="#1b3a1a" strokeWidth="6" fill="none" />
          </svg>
          <div className="absolute top-10 left-10"><BranchFruit emoji="🍊" delay={1}/></div>
        </div>
      </div>

      <div className="flex justify-between items-center w-full z-10 mb-2">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/5 rounded-xl border border-white/10">
          {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
        </button>
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-md">
          FRUIT PARTY
        </h1>
        <button onClick={onClose} className="p-2 bg-red-500/20 text-red-500 rounded-xl border border-red-500/20">
          <X size={18}/>
        </button>
      </div>

      <div className="z-10 text-center">
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Round History</p>
        <div className="flex gap-1.5 bg-black/40 p-2 rounded-2xl border border-white/5">
          {history.map((id, i) => (
            <span key={i} className="text-lg">{ITEMS.find(it => it.id === id)?.emoji}</span>
          ))}
        </div>
      </div>
   </header>

   {/* --- MAIN GAME SECTION --- */}
   <main className="flex-1 flex items-center justify-between px-2 relative">
      {/* Left DJ Bar */}
      <VisualizerPillar />

      {/* Center Grid */}
      <div className="relative flex-1 flex justify-center">
        <div className="w-full max-w-[320px] aspect-square p-3 rounded-[2.5rem] bg-gradient-to-br from-pink-500 via-blue-500 to-yellow-500 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="w-full h-full bg-[#180a29] rounded-[2.2rem] p-4 grid grid-cols-3 gap-3 relative overflow-hidden">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-black/60 rounded-3xl flex items-center justify-center border-b-4 border-white/5">
                    <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_10px_gold]">
                      {gameState === 'betting' ? timeLeft : '!!'}
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
                    "relative group rounded-3xl flex flex-col items-center justify-center transition-all duration-200",
                    "bg-gradient-to-b from-white/10 to-transparent border-t border-white/10",
                    isHighlighted ? "ring-4 ring-yellow-400 bg-white/20 shadow-[0_0_20px_gold]" : ""
                  )}
                >
                  <span className="text-4xl mb-1 drop-shadow-md">{item.emoji}</span>
                  <span className="text-[10px] font-bold text-white/40">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-lg">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}

                  {/* HAND POINTER ICON */}
                  <AnimatePresence>
                    {isHandPointing && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                      >
                         <Pointer size={48} className="text-white fill-white drop-shadow-2xl -rotate-45" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right DJ Bar */}
      <VisualizerPillar />
   </main>

   {/* --- FOOTER BETTING --- */}
   <footer className="p-6 bg-[#12071f] rounded-t-[3rem] border-t border-white/5">
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "min-w-[80px] h-12 rounded-2xl flex items-center justify-center transition-all border-b-4",
              chip.color,
              selectedChip === chip.value ? "scale-110 -translate-y-1 brightness-125 ring-2 ring-white" : "opacity-40 grayscale-[0.5]"
            )}
          >
            <span className="text-white font-black text-sm">{chip.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-xl shadow-lg">
            <GoldCoinIcon className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-[10px] text-white/30 font-bold uppercase">Coins</p>
            <p className="text-xl font-black text-yellow-400">
              {(userProfile?.wallet?.coins || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-white/20"># {currentUser?.uid?.slice(0,6)}</div>
      </div>
   </footer>
  </div>
 );
}
