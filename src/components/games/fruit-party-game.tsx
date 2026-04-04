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
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', color: 'from-lime-400 to-green-600', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-cyan-400 to-blue-600 shadow-cyan-500/50' },
  { value: 5000, label: '5K', color: 'from-pink-400 to-rose-600 shadow-rose-500/50' },
  { value: 50000, label: '50K', color: 'from-yellow-300 to-orange-500 shadow-yellow-500/50' },
  { value: 500000, label: '500K', color: 'from-fuchsia-500 to-purple-800 shadow-purple-600/50' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

// --- Branch Decoration Component ---
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

const VisualizerPillar = ({ height = "h-60", colors = ['#ff3366', '#ffcc00', '#00ffcc'] }: { height?: string, colors?: string[] }) => (
  <div className={cn("flex flex-col gap-1 w-4 bg-black/60 p-1 rounded-full border border-white/10 backdrop-blur-md shadow-2xl", height)}>
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          opacity: [0.4, 1, 0.4],
          scaleX: [1, 1.3, 1],
          backgroundColor: i < 3 ? colors[0] : i < 7 ? colors[1] : colors[2]
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
  // Super Fast: Total 15+ rounds in ~5 seconds
  const totalSteps = (SEQUENCE.length * 18) + SEQUENCE.indexOf(targetIdx); 
  let speed = 25; 

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 12) speed += 35; 
    setTimeout(run, speed);
   } else {
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
   setGameState('betting');
   setTimeLeft(30);
  }, 4000);
 };

 return (
  <div className="fixed inset-0 bg-[#080212] text-white flex flex-col overflow-hidden select-none font-sans">
   {/* Top Branches */}
   <BranchDecoration className="top-0 -left-6" delay={0} />
   <BranchDecoration className="top-0 -right-6" delay={1} reverse />

   <header className="relative pt-6 px-6 flex flex-col items-center z-20">
      <div className="flex justify-between items-center w-full mb-4">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
          {isMuted ? <VolumeX size={20} className="text-red-400"/> : <Volume2 size={20} className="text-green-400"/>}
        </button>
        <div className="relative">
          <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">FRUIT PARTY</h1>
          <Sparkles className="absolute -top-2 -right-6 text-yellow-400 w-5 h-5 animate-pulse" />
        </div>
        <button onClick={onClose} className="p-2.5 bg-red-500/20 text-red-500 rounded-2xl border border-red-500/30 shadow-lg">
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
      
      <div className="flex-1 flex flex-col items-center gap-4">
        {/* Glossy Fruit Grid */}
        <div className={cn("p-1.5 rounded-[3rem] transition-all duration-500", 
             gameState === 'spinning' ? "bg-gradient-to-br from-yellow-400 via-white to-yellow-400 shadow-[0_0_80px_rgba(255,255,255,0.6)]" : "bg-indigo-500/30 shadow-2xl")}>
          <div className="bg-[#120626] rounded-[2.8rem] p-4 grid grid-cols-3 gap-3 w-[310px] aspect-square relative border border-white/10">
            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-black/80 rounded-[2rem] flex items-center justify-center border-2 border-yellow-500/30">
                    <span className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] tabular-nums">
                      {gameState === 'betting' ? timeLeft : '!!!'}
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
                    "relative flex flex-col items-center justify-center rounded-[1.8rem] transition-all duration-300 border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden group",
                    isHighlighted ? "scale-110 z-20 shadow-[0_0_30px_white] border-white ring-4 ring-white/50" : "border-black/40 shadow-xl",
                    `bg-gradient-to-br ${item.color} opacity-95 hover:opacity-100`
                  )}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-4xl mb-1 filter drop-shadow-md z-10">{item.emoji}</span>
                  <span className="text-[9px] font-black text-white/90 bg-black/20 px-2 rounded-full z-10">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-1 right-1 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-20">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}
                  
                  <AnimatePresence>{isHandPointing && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <Pointer size={40} className="text-white fill-white drop-shadow-[0_0_15px_white] -rotate-45 animate-bounce" />
                    </motion.div>
                  )}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- My Balance Card (Middle Section) --- */}
        <div className="w-[280px] bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 p-3 rounded-2xl border border-white/20 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden group">
           <div className="flex items-center gap-3 z-10">
              <div className="p-2 bg-gradient-to-br from-yellow-300 via-orange-500 to-yellow-600 rounded-xl shadow-[0_4px_10px_rgba(234,179,8,0.3)] border-b-2 border-orange-800">
                <GoldCoinIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-widest mb-0.5">My Balance</p>
                <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-white to-orange-400 tabular-nums leading-none tracking-tight">
                    {localCoins.toLocaleString()}
                </p>
              </div>
           </div>
           <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 font-mono text-[9px] text-white/40 tracking-tighter z-10">
              #{currentUser?.uid?.slice(0,4).toUpperCase()}
           </div>
           <motion.div animate={{ x: ['-100%', '250%'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-y-0 w-12 bg-white/5 skew-x-12 pointer-events-none" />
        </div>

        {/* Salad Section */}
        <div className="flex items-center gap-6">
           <div className="flex gap-1 items-end h-12">
             <VisualizerPillar height="h-10" colors={['#3b82f6', '#60a5fa', '#93c5fd']} />
           </div>

           <div className="flex gap-8">
            {[1, 2].map(i => (
              <div key={i} className="bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-600/40 p-5 rounded-[2.2rem] border-2 border-white/20 shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md relative group">
                <span className="text-4xl filter drop-shadow-md">🥗</span>
                <div className="absolute inset-0 bg-white/5 rounded-[2rem] animate-pulse" />
              </div>
            ))}
           </div>

           <div className="flex gap-1 items-end h-12">
             <VisualizerPillar height="h-10" colors={['#ec4899', '#f472b6', '#fbcfe8']} />
           </div>
        </div>
      </div>
      
      <VisualizerPillar height="h-72" />
   </main>

   {/* Footer with Chips */}
   <footer className="relative mt-auto p-6">
      {/* Bottom Branches */}
      <BranchDecoration className="bottom-24 -left-8 -rotate-45" delay={0.5} />
      <BranchDecoration className="bottom-24 -right-8 rotate-45" delay={1.5} reverse />

      <div className="bg-black/40 backdrop-blur-3xl rounded-[3rem] p-5 border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide justify-center items-center pb-1">
          {CHIPS.map(chip => (
            <button 
              key={chip.value} 
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all border-[3px] border-white/20 shadow-[0_8px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-2 bg-gradient-to-br", chip.color,
                selectedChip === chip.value ? "ring-4 ring-white scale-110 z-10 border-white" : "opacity-60 scale-90"
              )}
            >
              <div className="flex flex-col items-center">
                <span className="text-white font-black text-sm drop-shadow-lg">{chip.label}</span>
                <div className="w-8 h-0.5 bg-white/30 rounded-full mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
   </footer>

   {/* Result Modal */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
        <motion.div initial={{ scale: 0.7, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-gradient-to-b from-[#2d0b5a] to-[#120626] border-4 border-yellow-400 rounded-[3.5rem] p-10 flex flex-col items-center shadow-[0_0_100px_rgba(234,179,8,0.4)]">
          <Trophy className="text-yellow-400 w-16 h-16 mb-6 animate-bounce" />
          <div className="text-9xl mb-8 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-green-400 font-black text-xl uppercase tracking-widest mb-2 animate-pulse">BIG WIN!</p>
              <p className="text-6xl font-black text-white">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-white/20 font-black text-2xl italic">BETTER LUCK NEXT TIME</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
