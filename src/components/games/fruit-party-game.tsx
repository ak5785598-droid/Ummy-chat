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

const playSound = (type: 'bet' | 'spin' | 'win', muted: boolean) => {
  if (muted) return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  if (type === 'bet') {
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  } else if (type === 'spin') {
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  }
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

// --- Banyan Tree Branch Component ---
const BanyanBranch = ({ position = "left" }: { position: "left" | "right" }) => (
  <motion.div 
    initial={{ rotate: position === "left" ? -2 : 2 }}
    animate={{ rotate: position === "left" ? 2 : -2 }}
    transition={{ duration: 3, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    className={cn(
      "absolute top-[-40px] z-50 pointer-events-none",
      position === "left" ? "-left-12 origin-top-right" : "-right-12 scale-x-[-1] origin-top-right"
    )}
  >
    <svg width="150" height="120" viewBox="0 0 150 120" fill="none">
      <path d="M10 10C30 20 60 10 100 40C120 55 140 90 145 110" stroke="#2D5A27" strokeWidth="8" strokeLinecap="round"/>
      <path d="M40 25C60 35 80 60 90 90" stroke="#1B3F17" strokeWidth="5" strokeLinecap="round"/>
      {/* Leaves */}
      <circle cx="105" cy="45" r="12" fill="#3E8E35" opacity="0.9"/>
      <circle cx="130" cy="75" r="10" fill="#2D5A27" opacity="0.8"/>
      <circle cx="145" cy="105" r="8" fill="#4CAF50" opacity="0.9"/>
      <text x="80" y="55" className="text-[20px]">🌿</text>
      <text x="120" y="90" className="text-[16px]">🍎</text>
    </svg>
  </motion.div>
);

const VisualizerPillar = ({ colors = ['#ff3366', '#ffcc00', '#00ffcc'] }: { colors?: string[] }) => (
  <div className="flex flex-col gap-1 w-3 h-48 bg-black/40 p-1 rounded-full border border-white/5 backdrop-blur-sm">
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.3, 1, 0.3], scaleX: [1, 1.2, 1] }}
        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
        style={{ backgroundColor: i < 2 ? colors[0] : i < 5 ? colors[1] : colors[2] }}
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
  <div className="fixed inset-0 bg-[#0a041a] bg-opacity-95 text-white flex flex-col items-center justify-center overflow-hidden font-sans">
   
   {/* --- Header Section --- */}
   <div className="absolute top-10 left-0 right-0 px-6 flex justify-between items-center z-20">
      <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/5 rounded-xl border border-white/10">
        {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
      </button>
      <div className="flex flex-col items-center">
         <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-orange-500 drop-shadow-lg">FRUIT PARTY</h1>
         <div className="flex gap-1 mt-1">
            {history.map((id, i) => (
              <span key={i} className="text-sm">{ITEMS.find(it => it.id === id)?.emoji}</span>
            ))}
         </div>
      </div>
      <button onClick={onClose} className="p-2 bg-red-500/20 text-red-500 rounded-xl border border-red-500/10">
        <X size={20}/>
      </button>
   </div>

   {/* --- Main Game Container (2nd Image Look) --- */}
   <div className="relative mt-12 mb-12">
      {/* Banyan Branches on Corners */}
      <BanyanBranch position="left" />
      <BanyanBranch position="right" />

      {/* Visualizers on sides */}
      <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 flex flex-col gap-8">
          <VisualizerPillar colors={['#3b82f6', '#60a5fa', '#93c5fd']} />
      </div>
      <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 flex flex-col gap-8">
          <VisualizerPillar colors={['#ec4899', '#f472b6', '#fbcfe8']} />
      </div>

      {/* Main Board */}
      <div className={cn(
        "relative z-10 p-2 rounded-[2.5rem] transition-all duration-500",
        gameState === 'spinning' ? "bg-white/20 scale-[1.02]" : "bg-indigo-500/20"
      )}>
        <div className="bg-[#1a0b2e] rounded-[2.3rem] p-4 grid grid-cols-3 gap-3 w-[320px] aspect-square shadow-2xl border border-white/10">
          {ITEMS.map((item, idx) => {
            if (item.id === 'timer') {
              return (
                <div key="timer" className="bg-black/60 rounded-3xl flex items-center justify-center border-2 border-yellow-500/20 overflow-hidden">
                  <span className="text-3xl font-black text-yellow-400 tabular-nums">
                    {gameState === 'betting' ? timeLeft : <Music className="animate-spin text-white/20" />}
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
                  "relative flex flex-col items-center justify-center rounded-3xl transition-all duration-150 border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden",
                  isHighlighted ? "scale-105 z-20 shadow-[0_0_20px_white] border-white ring-2 ring-white/30" : "border-black/40",
                  `bg-gradient-to-br ${item.color}`,
                  gameState === 'spinning' && !isHighlighted && "opacity-40 grayscale-[0.4]"
                )}
              >
                <span className={cn("text-4xl filter drop-shadow-md", isHighlighted && "scale-110")}>{item.emoji}</span>
                <span className="text-[10px] font-bold text-white/80">{item.label}</span>
                {myBets[item.id] > 0 && (
                  <div className="absolute top-1 right-1 bg-white text-black text-[8px] font-black px-1.5 rounded-full">
                    {(myBets[item.id]/1000).toFixed(0)}k
                  </div>
                )}
                {isHandPointing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-white/10 pointer-events-none">
                    <Pointer size={30} className="text-white fill-white -rotate-45 animate-bounce" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fruit Salad Bowls under the board */}
      <div className="flex justify-center gap-12 mt-6">
         {[1, 2].map(i => (
           <div key={i} className="bg-indigo-900/40 p-4 rounded-full border border-white/10 backdrop-blur-md">
             <motion.span 
               animate={gameState === 'spinning' ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
               transition={{ repeat: Infinity, duration: 0.6 }}
               className="text-4xl block"
             >🥗</motion.span>
           </div>
         ))}
      </div>
   </div>

   {/* --- Bottom Stats & Chips --- */}
   <div className="w-full max-w-[340px] space-y-4 px-4 z-20">
      <div className="bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <GoldCoinIcon className="w-6 h-6 text-yellow-400" />
            <div>
               <p className="text-[10px] text-white/40 uppercase font-bold">Balance</p>
               <p className="text-xl font-black">{localCoins.toLocaleString()}</p>
            </div>
         </div>
         <span className="text-[10px] opacity-20 font-mono">#{currentUser?.uid?.slice(0,6).toUpperCase()}</span>
      </div>

      {/* Chips Bar */}
      <div className="flex justify-between items-center bg-white/5 p-2 rounded-full border border-white/5">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            disabled={gameState !== 'betting'}
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all border-2",
              chip.color,
              selectedChip === chip.value ? "ring-2 ring-white scale-110 shadow-lg" : "opacity-40 scale-90",
              gameState !== 'betting' && "opacity-10"
            )}
          >
              <span className="text-white font-black text-[10px]">{chip.label}</span>
          </button>
        ))}
      </div>
   </div>

   {/* Win Modal */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#1a0b2e] border-2 border-yellow-500 rounded-[3rem] p-12 flex flex-col items-center text-center">
          <Trophy className="text-yellow-400 w-12 h-12 mb-4" />
          <div className="text-8xl mb-6">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div>
              <p className="text-green-400 font-bold tracking-widest mb-1">YOU WON</p>
              <p className="text-5xl font-black">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-white/20 font-bold uppercase">Try Again!</p>}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
  }
   
