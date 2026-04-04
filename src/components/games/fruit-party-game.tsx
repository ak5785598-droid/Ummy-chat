'use client';

import { useState, useEffect } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 X, Volume2, VolumeX, Pointer, Trophy
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×8', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'bg-emerald-500 shadow-emerald-900/50' },
  { value: 5000, label: '5K', color: 'bg-rose-500 shadow-rose-900/50' },
  { value: 50000, label: '50K', color: 'bg-blue-600 shadow-blue-900/50' },
  { value: 500000, label: '500K', color: 'bg-purple-600 shadow-purple-900/50' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

const BranchFruit = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.2, 1, 0], opacity: [0, 1, 1, 0], y: [0, -10, 40] }}
    transition={{ duration: 4, repeat: Infinity, delay }}
    className="text-3xl drop-shadow-lg"
  >
    {emoji}
  </motion.div>
);

const VisualizerPillar = () => (
  <div className="flex flex-col gap-[2px] h-64 w-6 bg-black/40 p-1 rounded-full border border-green-500/20">
    {Array.from({ length: 18 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.3, 1, 0.3], scaleX: [1, 1.2, 1] }}
        transition={{ duration: Math.random() * 0.4 + 0.2, repeat: Infinity, delay: i * 0.03 }}
        className={cn("w-full h-2 rounded-full", i < 4 ? "bg-red-500" : i < 10 ? "bg-yellow-400" : "bg-green-400")}
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
 const [history, setHistory] = useState<string[]>(['grapes', 'pear', 'grapes', 'orange', 'cherry']);
 const [isMuted, setIsMuted] = useState(false);
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);

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
  if (id === 'timer' || gameState !== 'betting' || !currentUser || !userProfile) return;
  if ((userProfile.wallet?.coins || 0) < selectedChip) {
   toast({ title: 'Insufficient Coins!', variant: 'destructive' });
   return;
  }
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  const winItem = ITEMS.filter(i => i.id !== 'timer')[Math.floor(Math.random() * 8)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 4) + SEQUENCE.indexOf(targetIdx);
  let speed = 60;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 10) speed += 60;
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
  <div className="fixed inset-0 bg-[#0d061a] text-white flex flex-col overflow-hidden select-none">
   
   {/* --- JUNGLE HEADER --- */}
   <header className="relative pt-6 px-6 flex flex-col items-center z-10">
      <div className="absolute top-0 left-0 w-full flex justify-between px-4 pointer-events-none opacity-60">
        {[0, 1].map(i => (
          <div key={i} className={cn("relative", i === 1 && "scale-x-[-1]")}>
            <svg width="160" height="100" viewBox="0 0 140 80">
              <path d="M0 0 Q 30 10, 50 50 M0 0 Q 60 5, 90 40" stroke="#2d5a27" strokeWidth="4" fill="none" />
              <path d="M0 0 Q 10 30, 30 70" stroke="#1b3a1a" strokeWidth="6" fill="none" />
            </svg>
            <div className="absolute top-12 left-10"><BranchFruit emoji="🌿" delay={i}/></div>
            <div className="absolute top-4 left-16"><BranchFruit emoji="☘️" delay={i + 0.5}/></div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center w-full mb-4">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
          {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            FRUIT PARTY
          </h1>
        </div>
        <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 rounded-full backdrop-blur-md border border-red-500/30">
          <X size={20}/>
        </button>
      </div>

      <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex gap-2">
        {history.map((id, i) => (
          <span key={i} className="text-xl filter drop-shadow-sm">{ITEMS.find(it => it.id === id)?.emoji}</span>
        ))}
      </div>
   </header>

   {/* --- GAME CORE --- */}
   <main className="flex-1 flex items-center justify-around px-4 relative">
      <VisualizerPillar />

      <div className="relative group">
        {/* RGB Outer Frame */}
        <div className="p-1.5 rounded-[3rem] bg-gradient-to-tr from-purple-600 via-pink-500 to-yellow-400 animate-gradient-xy shadow-[0_0_50px_rgba(139,92,246,0.3)]">
          <div className="bg-[#120822] rounded-[2.8rem] p-4 grid grid-cols-3 gap-3 w-[320px] aspect-square relative">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-black/60 rounded-[2rem] flex flex-col items-center justify-center border border-white/5">
                    <span className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
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
                    "relative flex flex-col items-center justify-center rounded-[2rem] transition-all duration-300 border border-white/10 overflow-hidden",
                    isHandPointing 
                      ? "bg-green-500/30 border-green-400/50 shadow-[inset_0_0_20px_rgba(74,222,128,0.3)] scale-105" 
                      : "bg-purple-500/10 backdrop-blur-md",
                    isHighlighted && "ring-4 ring-yellow-400 bg-yellow-400/20 z-10 scale-110 shadow-[0_0_30px_gold]"
                  )}
                >
                  {/* Glossy Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                  
                  <span className="text-4xl mb-1 drop-shadow-lg z-10">{item.emoji}</span>
                  <span className="text-[10px] font-bold text-white/50 z-10">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-black px-1.5 rounded-full shadow-lg">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {isHandPointing && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                         <Pointer size={44} className="text-white fill-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] -rotate-45" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- SALAD BOWLS (New Update) --- */}
        <div className="absolute -bottom-16 left-0 w-full flex justify-around px-8 pointer-events-none">
           {[1, 2].map(i => (
             <div key={i} className="bg-purple-500/20 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-xl flex items-center justify-center">
                <span className="text-3xl filter drop-shadow-md">🥗</span>
                {/* Glossy effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl" />
             </div>
           ))}
        </div>
      </div>

      <VisualizerPillar />
   </main>

   {/* --- BETTING CONTROLS --- */}
   <footer className="p-6 bg-black/40 backdrop-blur-2xl rounded-t-[3.5rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide justify-center">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "px-6 h-12 rounded-2xl flex items-center justify-center transition-all border-b-4 active:translate-y-1",
              chip.color,
              selectedChip === chip.value ? "scale-110 ring-2 ring-white brightness-110" : "opacity-50 grayscale-[0.3]"
            )}
          >
            <span className="text-white font-black">{chip.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-[2rem] border border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-2xl shadow-inner">
            <GoldCoinIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-tighter">Your Balance</p>
            <p className="text-2xl font-black text-yellow-400 tabular-nums">
              {(userProfile?.wallet?.coins || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="px-4 py-1 bg-white/5 rounded-full text-[10px] font-mono text-white/30 border border-white/5">
          ID: {currentUser?.uid?.slice(0,8).toUpperCase()}
        </div>
      </div>
   </footer>

   {/* --- WINNER POPUP --- */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      >
        <div className="bg-[#1e0a3d] border-2 border-yellow-400 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(250,204,21,0.4)] max-w-xs w-full">
          <div className="mb-4 bg-yellow-400/20 p-4 rounded-full">
            <Trophy className="text-yellow-400 w-12 h-12" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">ROUND OVER!</h2>
          <div className="text-6xl my-4 drop-shadow-lg">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="space-y-1">
              <p className="text-green-400 font-bold uppercase text-xs">You Won</p>
              <p className="text-4xl font-black text-white flex items-center justify-center gap-2">
                <GoldCoinIcon className="w-6 h-6 text-yellow-400" />
                {winnerData.win.toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-white/50 font-medium">Better luck next time!</p>
          )}
        </div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
