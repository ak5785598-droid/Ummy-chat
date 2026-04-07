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
  { value: 5000, label: '5K', color: 'from-cyan-400 to-blue-600 shadow-blue-500/50' },
  { value: 50000, label: '50K', color: 'from-pink-400 to-rose-600 shadow-rose-500/50' },
  { value: 500000, label: '500K', color: 'from-yellow-300 to-orange-500 shadow-orange-500/50' },
  { value: 5000000, label: '5M', color: 'from-fuchsia-500 to-purple-800 shadow-purple-600/50' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

// Improved Volume Visualizer Pillar (Blue & Pink Mix)
const VolumePillar = () => (
  <div className="flex flex-col-reverse gap-0.5 w-3 bg-black/80 p-0.5 rounded-full border border-white/5 h-48 shadow-2xl">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          opacity: [0.2, 1, 0.2],
          backgroundColor: i > 6 ? '#ec4899' : '#3b82f6', // Pink top, Blue bottom
          boxShadow: i > 6 ? '0 0 8px #ec4899' : '0 0 8px #3b82f6'
        }}
        transition={{ 
          duration: 0.4 + Math.random(), 
          repeat: Infinity, 
          delay: i * 0.05 
        }}
        className="w-full h-3 rounded-sm"
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
 const [selectedChip, setSelectedChip] = useState(5000);
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
  let speed = 50;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
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
  setHistory(prev => [winItem.id, ...prev].slice(0, 6));
  
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
  }, 3500);
 };

 return (
  <div className="fixed top-0 left-0 right-0 h-[65vh] bg-[#0d041a] text-white flex flex-col overflow-hidden select-none font-sans border-b-2 border-purple-500/30 rounded-b-[2rem] shadow-2xl">
   
   <header className="pt-4 px-4 flex flex-col items-center z-20">
      <div className="flex justify-between items-center w-full mb-2">
        <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 bg-white/5 rounded-xl border border-white/10">
          {isMuted ? <VolumeX size={16} className="text-red-400"/> : <Volume2 size={16} className="text-blue-400"/>}
        </button>
        <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-400 to-blue-400">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-1.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
          <X size={16}/>
        </button>
      </div>

      <div className="bg-black/40 px-3 py-1 rounded-full border border-white/5 flex gap-1.5">
        {history.map((id, i) => (
          <span key={i} className="text-sm">{ITEMS.find(it => it.id === id)?.emoji}</span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex items-center justify-around px-2 relative">
      <VolumePillar />
      
      <div className="flex flex-col items-center gap-3 scale-90">
        <div className={cn("p-1 rounded-[2.5rem] transition-all", 
             gameState === 'spinning' ? "bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)]" : "bg-purple-900/40")}>
          <div className="bg-[#120626] rounded-[2.3rem] p-3 grid grid-cols-3 gap-2 w-[240px] aspect-square relative border border-white/5">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-black/60 rounded-3xl flex items-center justify-center border border-blue-500/30">
                    <span className="text-2xl font-black text-blue-400 tabular-nums">
                        {gameState === 'betting' ? timeLeft : 'GO!'}
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
                    "relative flex flex-col items-center justify-center rounded-2xl transition-all border-b-2 active:translate-y-0.5",
                    isHighlighted ? "scale-105 z-10 shadow-[0_0_20px_white] border-white bg-white" : "border-black/20",
                    `bg-gradient-to-br ${item.color}`,
                    gameState === 'spinning' && !isHighlighted && "opacity-40"
                  )}
                >
                  <span className="text-2xl mb-0.5">{item.emoji}</span>
                  <span className="text-[7px] font-bold text-white/80">{item.label}</span>
                  {myBets[item.id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-white text-black text-[8px] font-black px-1 rounded-full shadow-md z-20">
                      {(myBets[item.id]/1000).toFixed(0)}k
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Small Balance Card */}
        <div className="w-[180px] bg-white/5 p-2 rounded-xl border border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <GoldCoinIcon className="w-3 h-3 text-yellow-400" />
              <p className="text-sm font-bold text-white tabular-nums">{localCoins.toLocaleString()}</p>
           </div>
           <div className="text-[7px] text-white/30 font-mono">#{currentUser?.uid?.slice(0,4)}</div>
        </div>
      </div>
      
      <VolumePillar />
   </main>

   {/* Compact Chips Bar */}
   <footer className="p-3 mt-auto bg-black/40 backdrop-blur-md">
      <div className="flex gap-3 justify-center items-center">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            disabled={gameState !== 'betting'}
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 text-[10px] font-black text-white bg-gradient-to-br",
              chip.color,
              selectedChip === chip.value ? "ring-2 ring-white scale-110" : "opacity-40 scale-90"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#120626] border-2 border-blue-400 rounded-[2rem] p-6 flex flex-col items-center">
          <div className="text-6xl mb-4">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">WINNER</p>
              <p className="text-3xl font-black text-white">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-white/40 font-bold">NEXT TIME!</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
  }
       
