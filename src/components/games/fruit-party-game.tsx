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
 X, Volume2, VolumeX, Pointer, Trophy, Sparkles
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
  { id: 'pear', emoji: '🍐', multiplier: 8, label: '×8', color: 'from-lime-400 to-green-600', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-700 shadow-emerald-500/50' },
  { value: 5000, label: '5K', color: 'from-rose-400 to-rose-700 shadow-rose-500/50' },
  { value: 50000, label: '50K', color: 'from-blue-400 to-blue-700 shadow-blue-500/50' },
  { value: 500000, label: '500K', color: 'from-purple-500 to-fuchsia-800 shadow-purple-500/50' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

const BranchDecoration = ({ className, delay, reverse = false }: { className?: string; delay: number; reverse?: boolean }) => (
  <motion.div
    initial={{ rotate: reverse ? 5 : -5 }}
    animate={{ rotate: reverse ? -5 : 5 }}
    transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", delay }}
    className={cn("absolute pointer-events-none opacity-90 z-30", className, reverse ? "scale-x-[-1]" : "")}
  >
    <svg width="140" height="120" viewBox="0 0 100 100">
      <path d="M0 50 Q 30 40, 70 80" stroke="#1b4a1a" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M0 50 Q 50 45, 90 20" stroke="#2d6a27" strokeWidth="5" fill="none" strokeLinecap="round" />
      <motion.text animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} x="40" y="70" className="text-[24px]">🌿</motion.text>
      <motion.text animate={{ y: [0, 5, 0] }} transition={{ duration: 2.5, repeat: Infinity }} x="70" y="30" className="text-[18px]">🍎</motion.text>
    </svg>
  </motion.div>
);

const VisualizerPillar = ({ height = "h-60" }: { height?: string }) => (
  <div className={cn("flex flex-col gap-1 w-4 bg-black/60 p-1 rounded-full border border-white/10 backdrop-blur-md shadow-2xl", height)}>
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          opacity: [0.4, 1, 0.4],
          scaleX: [1, 1.3, 1],
          backgroundColor: i < 3 ? '#ff3366' : i < 7 ? '#ffcc00' : '#00ffcc'
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
  const itemsOnly = ITEMS.filter(i => i.id !== 'timer');
  const winItem = itemsOnly[Math.floor(Math.random() * itemsOnly.length)];
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
  <div className="fixed inset-0 bg-[#080212] text-white flex flex-col overflow-hidden select-none font-sans">
   {/* Top Decorations */}
   <BranchDecoration className="top-0 -left-6" delay={0} />
   <BranchDecoration className="top-0 -right-6" delay={1} reverse />

   <header className="relative pt-6 px-6 flex flex-col items-center z-20">
      <div className="flex justify-between items-center w-full mb-4">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg active:scale-95 transition-transform">
          {isMuted ? <VolumeX size={20} className="text-red-400"/> : <Volume2 size={20} className="text-green-400"/>}
        </button>
        <div className="relative">
          <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">FRUIT PARTY</h1>
          <Sparkles className="absolute -top-2 -right-6 text-yellow-400 w-5 h-5 animate-pulse" />
        </div>
        <button onClick={onClose} className="p-2.5 bg-red-500/20 text-red-500 rounded-2xl border border-red-500/30 shadow-lg active:scale-95">
          <X size={20}/>
        </button>
      </div>

      <div className="bg-black/60 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/10 flex gap-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-xl filter drop-shadow-md">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex items-center justify-between px-4 relative z-10">
      <VisualizerPillar height="h-72" />
      
      <div className="flex-1 flex flex-col items-center gap-8">
        <div className="p-1.5 rounded-[3rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_60px_rgba(99,102,241,0.4)]">
          <div className="bg-[#120626] rounded-[2.8rem] p-4 grid grid-cols-3 gap-3 w-[320px] aspect-square relative border border-white/10">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-black/80 rounded-[2rem] flex items-center justify-center border-2 border-yellow-500/30 shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]">
                    <span className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] tabular-nums">
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
                    "relative flex flex-col items-center justify-center rounded-[2rem] transition-all duration-300 border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden group",
                    isHighlighted ? "scale-110 z-20 shadow-[0_0_40px_gold] border-yellow-400 ring-4 ring-yellow-400/50" : "border-black/40 shadow-xl",
                    `bg-gradient-to-br ${item.color} opacity-90 hover:opacity-100`
                  )}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-4xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10">{item.emoji}</span>
                  <span className="text-[10px] font-black text-white/90 bg-black/20 px-2 rounded-full z-10">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-1 right-1 bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-20 scale-110">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}
                  
                  <AnimatePresence>{isHandPointing && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <Pointer size={44} className="text-white fill-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] -rotate-45 animate-bounce" />
                    </motion.div>
                  )}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-12">
          {[1, 2].map(i => (
            <div key={i} className="bg-gradient-to-t from-purple-900/40 to-transparent p-4 rounded-3xl border border-white/5 shadow-2xl relative">
              <span className="text-4xl filter drop-shadow-lg">🥗</span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-purple-500/50 blur-sm rounded-full" />
            </div>
          ))}
        </div>
      </div>
      
      <VisualizerPillar height="h-72" />
   </main>

   <footer className="relative mt-auto">
      {/* Bottom Wrapped Branches */}
      <BranchDecoration className="bottom-24 -left-8 -rotate-45" delay={0.5} />
      <BranchDecoration className="bottom-24 -right-8 rotate-45" delay={1.5} reverse />

      <div className="p-6 bg-gradient-to-t from-[#1a0b2e] to-black/80 backdrop-blur-3xl rounded-t-[3.5rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative z-20">
        
        {/* DJ Visualizers above Chips */}
        <div className="flex justify-center gap-20 mb-4 h-8">
           <VisualizerPillar height="h-8" />
           <VisualizerPillar height="h-8" />
           <VisualizerPillar height="h-8" />
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide justify-center items-center">
          {CHIPS.map(chip => (
            <button 
              key={chip.value} 
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all border-4 shadow-[0_6px_0_rgb(0,0,0,0.3)] active:shadow-none active:translate-y-1 bg-gradient-to-br", chip.color,
                selectedChip === chip.value ? "ring-4 ring-white scale-125 z-10" : "opacity-60 grayscale-[0.3]"
              )}
            >
              <span className="text-white font-black text-xs drop-shadow-md">{chip.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-purple-900/40 p-5 rounded-[2.5rem] border-2 border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.3)] group overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="p-3 bg-gradient-to-br from-yellow-300 via-orange-500 to-yellow-600 rounded-2xl shadow-[0_4px_15px_rgba(234,179,8,0.4)] border-b-4 border-orange-800">
              <GoldCoinIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.2em] mb-1">My Balance</p>
              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400 tabular-nums">
                {localCoins.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 font-mono text-xs text-white/40 tracking-tighter">
            #{currentUser?.uid?.slice(0,6).toUpperCase()}
          </div>
          
          {/* Subtle light sweep animation */}
          <motion.div 
            animate={{ x: ['-100%', '200%'] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-20 bg-white/5 skew-x-12 pointer-events-none" 
          />
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
        <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-gradient-to-b from-[#2d0b5a] to-[#120626] border-4 border-yellow-400 rounded-[3rem] p-10 flex flex-col items-center text-center shadow-[0_0_80px_rgba(234,179,8,0.4)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
          <div className="mb-6 bg-yellow-400/20 p-6 rounded-full animate-bounce shadow-2xl shadow-yellow-400/20"><Trophy className="text-yellow-400 w-16 h-16" /></div>
          <h2 className="text-2xl font-black text-yellow-100 tracking-widest mb-2">WINNER REVEALED</h2>
          <div className="text-9xl my-8 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="space-y-2">
              <p className="text-green-400 font-black text-sm uppercase tracking-[0.3em] animate-pulse">Big Win!</p>
              <div className="flex items-center justify-center gap-3 bg-black/40 px-8 py-4 rounded-3xl border border-white/10">
                <GoldCoinIcon className="w-8 h-8 text-yellow-400" />
                <p className="text-5xl font-black text-white">{winnerData.win.toLocaleString()}</p>
              </div>
            </div>
          ) : <p className="text-white/20 font-black text-xl italic mt-4">BETTER LUCK NEXT TIME</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
