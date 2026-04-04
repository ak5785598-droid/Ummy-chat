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
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-600' },
  { value: 5000, label: '5K', color: 'from-rose-400 to-rose-600' },
  { value: 50000, label: '50K', color: 'from-blue-400 to-blue-600' },
  { value: 500000, label: '500K', color: 'from-purple-400 to-purple-600' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

const BranchDecoration = ({ delay, reverse = false }: { delay: number; reverse?: boolean }) => (
  <motion.div
    initial={{ rotate: reverse ? 5 : -5 }}
    animate={{ rotate: reverse ? -5 : 5 }}
    transition={{ duration: 3, repeat: Infinity, repeatType: "mirror", delay }}
    className={cn("absolute top-0 pointer-events-none opacity-80 z-20", reverse ? "-right-4 scale-x-[-1]" : "-left-4")}
  >
    <svg width="120" height="100" viewBox="0 0 100 100">
      <path d="M0 0 Q 30 10, 50 60" stroke="#1b3a1a" strokeWidth="6" fill="none" />
      <path d="M0 0 Q 50 5, 80 40" stroke="#2d5a27" strokeWidth="4" fill="none" />
      <text x="35" y="55" className="text-[20px]">🌿</text>
      <text x="65" y="35" className="text-[16px]">🍃</text>
    </svg>
  </motion.div>
);

const GlassShimmer = () => (
  <motion.div
    initial={{ x: '-150%' }}
    animate={{ x: '150%' }}
    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] pointer-events-none"
  />
);

const VisualizerPillar = () => (
  <div className="flex flex-col gap-1 h-60 w-3.5 bg-black/40 p-1 rounded-full border border-white/5 backdrop-blur-sm">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          opacity: [0.3, 1, 0.3],
          scaleX: [1, 1.2, 1],
          backgroundColor: i < 3 ? '#ef4444' : i < 8 ? '#facc15' : '#22c55e'
        }}
        transition={{ duration: Math.random() * 0.4 + 0.3, repeat: Infinity, delay: i * 0.05 }}
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

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(500);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['grapes', 'pear', 'grapes', 'orange', 'cherry']);
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
  setLocalCoins(prev => prev - selectedChip);
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
  <div className="fixed inset-0 bg-[#0a0514] text-white flex flex-col overflow-hidden select-none font-sans">
   <BranchDecoration delay={0} />
   <BranchDecoration delay={1} reverse />

   <header className="relative pt-8 px-6 flex flex-col items-center z-10">
      <div className="flex justify-between items-center w-full mb-4">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
          {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
        </button>
        <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-md">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
          <X size={18}/>
        </button>
      </div>

      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5 flex gap-1.5 shadow-inner">
        {history.map((id, i) => (
          <span key={i} className="text-lg drop-shadow-sm">{ITEMS.find(it => it.id === id)?.emoji}</span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex items-center justify-between px-4 relative">
      <VisualizerPillar />
      
      <div className="flex-1 flex flex-col items-center gap-10">
        <div className="p-1 rounded-[2.8rem] bg-gradient-to-tr from-purple-600 via-blue-500 to-yellow-400 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
          <div className="bg-[#150a26] rounded-[2.6rem] p-4 grid grid-cols-3 gap-3 w-[300px] aspect-square relative overflow-hidden">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-black/60 rounded-[1.8rem] flex items-center justify-center border border-white/5 relative overflow-hidden">
                    <GlassShimmer />
                    <span className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_gold]">{gameState === 'betting' ? timeLeft : '!!'}</span>
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
                    "relative flex flex-col items-center justify-center rounded-[1.8rem] transition-all duration-300 border border-white/10 overflow-hidden",
                    isHandPointing ? "bg-green-500/40 border-green-300/50 scale-105" : "bg-purple-500/10 backdrop-blur-sm",
                    isHighlighted && "ring-4 ring-yellow-400 bg-yellow-400/20 z-10 scale-110 shadow-[0_0_30px_gold]"
                  )}
                >
                  <GlassShimmer />
                  <span className="text-4xl mb-1 drop-shadow-lg z-10">{item.emoji}</span>
                  <span className="text-[9px] font-bold text-white/30 z-10">{item.label}</span>
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-[9px] font-black px-1.5 rounded-full z-20">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}
                  <AnimatePresence>{isHandPointing && (
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <Pointer size={40} className="text-white fill-white drop-shadow-2xl -rotate-45" />
                    </motion.div>
                  )}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-16">
          {[1, 2].map(i => (
            <div key={i} className="bg-purple-500/10 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
              <GlassShimmer />
              <span className="text-3xl">🥗</span>
            </div>
          ))}
        </div>
      </div>
      
      <VisualizerPillar />
   </main>

   <footer className="p-6 bg-black/60 backdrop-blur-3xl rounded-t-[3rem] border-t border-white/10 shadow-2xl">
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide justify-center">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 active:scale-90 shadow-lg bg-gradient-to-br", chip.color,
              selectedChip === chip.value ? "ring-4 ring-white scale-110" : "opacity-40 border-white/10"
            )}
          >
            <span className="text-white font-black text-[10px]">{chip.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-[1.8rem] border border-white/10 relative overflow-hidden">
        <GlassShimmer />
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-xl shadow-lg">
            <GoldCoinIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Balance</p>
            <p className="text-xl font-black text-yellow-400">{localCoins.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-white/10 z-10">#{currentUser?.uid?.slice(0,6).toUpperCase()}</div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
        <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1e0a3d] border-2 border-yellow-400 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-[0_0_60px_rgba(250,204,21,0.3)] relative overflow-hidden">
          <GlassShimmer />
          <div className="mb-4 bg-yellow-400/20 p-4 rounded-full z-10"><Trophy className="text-yellow-400 w-12 h-12" /></div>
          <h2 className="text-xl font-black text-white z-10 tracking-tight">RESULT</h2>
          <div className="text-7xl my-6 z-10">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="z-10">
              <p className="text-green-400 font-bold text-xs uppercase tracking-widest">You Won</p>
              <p className="text-4xl font-black text-white flex items-center gap-2 mt-1"><GoldCoinIcon className="w-6 h-6 text-yellow-400" />{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-white/30 font-bold z-10">NO WIN</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
