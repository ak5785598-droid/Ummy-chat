'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 X, Volume2, VolumeX, Pointer, Trophy, Coins, History, Settings
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay } from '@/components/game-result-overlay';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS & CONFIG ---
const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5', index: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '×10', index: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '×5', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '×45', index: 3 },
  { id: 'timer', emoji: '', multiplier: 0, label: '', index: 4 }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '×25', index: 5 },
  { id: 'mango', emoji: '🥭', multiplier: 6, label: '×6', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-700', icon: '🍇' },
  { value: 5000, label: '5,000', color: 'from-rose-400 to-rose-700', icon: null },
  { value: 50000, label: '50,000', color: 'from-blue-400 to-blue-700', icon: null },
  { value: 500000, label: '500,000', color: 'from-purple-400 to-purple-700', icon: '🍎🥭' },
];

const SPIN_SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3]; // Circular path around timer

// --- SUB-COMPONENTS ---
const BranchFruit = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: -10 }}
    animate={{ 
      scale: [0, 1.2, 1, 1, 0], 
      opacity: [0, 1, 1, 1, 0],
      y: [0, 0, 0, 40, 80],
      rotate: [0, 10, -10, 20, 45]
    }}
    transition={{ duration: 6, repeat: Infinity, delay, times: [0, 0.1, 0.7, 0.85, 1] }}
    className="text-2xl filter drop-shadow-md absolute"
  >
    {emoji}
  </motion.div>
);

const VisualizerBar = ({ color, delay }: { color: string, delay: number }) => (
  <motion.div 
    animate={{ 
      height: [10, 40, 20, 50, 10],
      opacity: [0.3, 1, 0.6, 1, 0.3]
    }}
    transition={{ repeat: Infinity, duration: 1.5, delay, ease: "easeInOut" }}
    className={cn("w-1.5 rounded-full", color)}
  />
);

// --- MAIN COMPONENT ---
export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  // State Management
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(500);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(['apple', 'cherry', 'lemon', 'grapes', 'mango']);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [deductions, setDeductions] = useState<{ id: number; amount: number }[]>([]);
  const [hintStep, setHintStep] = useState(0);

  const [winners, setWinners] = useState<any[]>([]);
  const [winningSymbol, setWinningSymbol] = useState<string>('');
  const [totalWinAmount, setTotalWinAmount] = useState(0);

  // Initial Load
  useEffect(() => {
    const launchTimer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(launchTimer);
  }, []);

  // Hand Movement Logic
  useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
      setHintStep((prev) => (prev + 1) % SPIN_SEQUENCE.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Main Game Loop (Countdown)
  useEffect(() => {
    if (isLaunching || gameState !== 'betting') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          startSpin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, isLaunching]);

  const handlePlaceBet = (id: string) => {
    if (id === 'timer' || gameState !== 'betting' || !currentUser || !userProfile) return;
    
    const currentBalance = userProfile.wallet?.coins || 0;
    if (currentBalance < selectedChip) {
      toast({ title: 'Insufficient Balance', variant: 'destructive' });
      return;
    }

    // Animation: Coin Deduction
    const dId = Date.now();
    setDeductions(prev => [...prev, { id: dId, amount: selectedChip }]);
    setTimeout(() => setDeductions(prev => prev.filter(d => d.id !== dId)), 1200);

    // Update Firestore & Local State
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), {
      'wallet.coins': increment(-selectedChip)
    });
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const startSpin = () => {
    setGameState('spinning');
    const validFruits = ITEMS.filter(i => i.id !== 'timer');
    const winItem = validFruits[Math.floor(Math.random() * validFruits.length)];
    const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
    
    let currentStep = 0;
    const totalRounds = 4;
    const totalSteps = (SPIN_SEQUENCE.length * totalRounds) + SPIN_SEQUENCE.indexOf(targetIdx);
    let speed = 50;

    const run = () => {
      setHighlightIdx(SPIN_SEQUENCE[currentStep % SPIN_SEQUENCE.length]);
      currentStep++;

      if (currentStep < totalSteps) {
        if (totalSteps - currentStep < 12) speed += 35;
        setTimeout(run, speed);
      } else {
        setTimeout(() => finalizeGame(winItem), 1000);
      }
    };
    run();
  };

  const finalizeGame = (winItem: any) => {
    const betAmount = myBets[winItem.id] || 0;
    const winAmount = betAmount * winItem.multiplier;

    setWinningSymbol(winItem.emoji);
    setTotalWinAmount(winAmount);
    setHistory(prev => [winItem.id, ...prev].slice(0, 8));

    const currentWinners = [];
    if (winAmount > 0) {
      currentWinners.push({ 
        name: userProfile?.username || 'You', 
        win: winAmount, 
        avatar: userProfile?.avatarUrl, 
        isMe: true 
      });
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), {
        'wallet.coins': increment(winAmount),
        'stats.fruitPartyWins': increment(1)
      });
    }

    setWinners(currentWinners);
    setGameState('result');

    // Reset for next round
    setTimeout(() => {
      setMyBets({});
      setHighlightIdx(null);
      setTimeLeft(30);
      setGameState('betting');
    }, 6000);
  };

  if (isLaunching) {
    return (
      <div className="fixed inset-0 bg-[#0f071a] flex flex-col items-center justify-center space-y-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
           <Settings className="text-yellow-400 w-12 h-12 opacity-20" />
        </motion.div>
        <h2 className="text-yellow-400 font-black tracking-[0.3em] text-xl animate-pulse">FRUIT PARADISE</h2>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.5 }} className="h-full bg-gradient-to-r from-yellow-400 to-pink-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0414] text-white font-sans overflow-hidden select-none">
      
      {/* Result Overlay */}
      <AnimatePresence>
        {gameState === 'result' && (
          <div className="fixed inset-0 z-[1000]">
            <GameResultOverlay gameId="fruit-party" winningSymbol={winningSymbol} winAmount={totalWinAmount} winners={winners} />
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="relative px-6 py-6 flex justify-between items-center z-50">
        <div className="absolute top-0 left-0 w-full h-32 pointer-events-none opacity-40">
           <BranchFruit emoji="🍎" delay={0} />
           <BranchFruit emoji="🍋" delay={2} />
        </div>

        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md active:scale-90 transition-transform">
          {isMuted ? <VolumeX size={22} className="text-white/60"/> : <Volume2 size={22} className="text-blue-400"/>}
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-pink-500 to-yellow-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            FRUIT PARTY
          </h1>
          <div className="flex items-center justify-center gap-1 mt-1">
             <div className="w-1 h-1 rounded-full bg-green-500 animate-ping" />
             <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Live Table</span>
          </div>
        </div>

        <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 active:scale-90 transition-transform">
          <X size={22}/>
        </button>
      </header>

      {/* --- MAIN GAME SECTION --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        
        {/* Neon Side Visualizers */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 h-64 justify-center">
           {Array.from({length: 12}).map((_, i) => <VisualizerBar key={i} color="bg-blue-500" delay={i*0.1} />)}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 h-64 justify-center">
           {Array.from({length: 12}).map((_, i) => <VisualizerBar key={i} color="bg-pink-500" delay={i*0.1} />)}
        </div>

        {/* Round History Badge */}
        <div className="mb-6 z-20">
           <div className="bg-black/60 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/10 flex gap-3 shadow-2xl items-center">
              <History size={14} className="text-white/20" />
              {history.map((h, i) => (
                <span key={i} className={cn("text-xl filter drop-shadow-md", i === 0 ? "scale-125 opacity-100" : "opacity-40")}>
                  {ITEMS.find(it => it.id === h)?.emoji}
                </span>
              ))}
           </div>
        </div>

        {/* 3D Game Board Case */}
        <div className="relative w-full max-w-[340px] transform-gpu transition-all duration-700" style={{ transform: 'perspective(1200px) rotateX(12deg)' }}>
          
          {/* Border Glow Layers */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-yellow-400 to-pink-600 rounded-[3.8rem] blur-2xl opacity-30 animate-pulse" />
          
          <div className="relative p-1.5 rounded-[3.6rem] bg-gradient-to-br from-blue-400/50 via-white/40 to-pink-400/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
            <div className="bg-[#150826] rounded-[3.4rem] p-5 shadow-inner">
              
              <div className="grid grid-cols-3 gap-3.5">
                {ITEMS.map((item, idx) => {
                  const isHandTarget = gameState === 'betting' && SPIN_SEQUENCE[hintStep] === idx;
                  const isHighlighted = highlightIdx === idx;

                  if (item.id === 'timer') {
                    return (
                      <div key="timer" className="aspect-square rounded-[2rem] bg-black/40 flex flex-col items-center justify-center border-2 border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent" />
                        <motion.span 
                          animate={{ scale: [1, 1.1, 1], color: timeLeft < 5 ? '#ef4444' : '#facc15' }}
                          className="text-4xl font-black z-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                        >
                          {gameState === 'betting' ? timeLeft : '!!!'}
                        </motion.span>
                        <span className="text-[8px] font-black opacity-30 tracking-widest mt-1 uppercase">Seconds</span>
                      </div>
                    );
                  }

                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.93, rotate: -2 }}
                      onClick={() => handlePlaceBet(item.id)}
                      className={cn(
                        "relative aspect-square rounded-[2rem] flex flex-col items-center justify-center transition-all duration-500",
                        "border-t border-white/10 shadow-lg",
                        isHighlighted ? "bg-yellow-400 ring-4 ring-yellow-200 scale-110 z-30 shadow-[0_0_40px_rgba(250,204,21,0.6)]" : "bg-white/5",
                        isHandTarget ? "bg-green-500/20 border-green-400/50 ring-2 ring-green-500/20" : ""
                      )}
                    >
                      <span className={cn("text-4xl mb-1 filter drop-shadow-lg transition-transform", isHighlighted ? "scale-110" : "")}>
                        {item.emoji}
                      </span>
                      <span className={cn("text-[9px] font-black uppercase transition-opacity", isHighlighted ? "text-black opacity-100" : "text-white/30")}>
                        {item.label}
                      </span>

                      {/* Floating Bet Badge */}
                      {myBets[item.id] > 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-[#150826] z-40">
                          {myBets[item.id] >= 1000 ? `${(myBets[item.id]/1000).toFixed(0)}K` : myBets[item.id]}
                        </motion.div>
                      )}

                      {/* Pointer Hand */}
                      <AnimatePresence>
                        {isHandTarget && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                              <Pointer size={36} className="text-white fill-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] -rotate-45" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- FOOTER CONTROLS --- */}
      <footer className="bg-[#120626] p-6 pb-10 rounded-t-[4rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Chip Selection with Fruit Icons */}
          <div className="flex justify-between gap-3">
            {CHIPS.map(chip => (
              <button 
                key={chip.value} 
                onClick={() => setSelectedChip(chip.value)}
                className={cn(
                  "relative flex-1 h-16 rounded-2xl flex flex-col items-center justify-center transition-all border-b-[6px] border-black/40 shadow-xl",
                  chip.color,
                  selectedChip === chip.value ? "scale-110 -translate-y-3 ring-2 ring-white z-10" : "opacity-40 grayscale-[0.5] hover:opacity-70"
                )}
              >
                {chip.icon && (
                  <span className="absolute top-1 text-[10px] bg-white/20 px-1.5 rounded-full backdrop-blur-sm">
                    {chip.icon}
                  </span>
                )}
                <span className="text-white font-black text-[11px] tracking-tight mt-3">
                  {chip.label}
                </span>
              </button>
            ))}
          </div>

          {/* User Balance & Real-time Deduction */}
          <div className="relative bg-white/5 p-5 rounded-[2.5rem] border border-white/10 group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-pink-500/5" />
             
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-400 p-3 rounded-2xl shadow-[0_10px_20px_rgba(250,204,21,0.3)] rotate-6 group-hover:rotate-12 transition-transform">
                    <GoldCoinIcon className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Available Balance</p>
                    <div className="flex items-center gap-3">
                       <p className="text-3xl font-black text-yellow-400 italic tracking-tighter">
                          {(userProfile?.wallet?.coins || 0).toLocaleString()}
                       </p>
                       
                       {/* Floating Deduction Animation */}
                       <AnimatePresence>
                         {deductions.map(d => (
                           <motion.div 
                            key={d.id}
                            initial={{ y: 0, opacity: 1, scale: 1 }}
                            animate={{ y: -50, opacity: 0, scale: 1.5 }}
                            className="absolute right-0 text-red-500 font-black text-xl pointer-events-none"
                           >
                            -{d.amount.toLocaleString()}
                           </motion.div>
                         ))}
                       </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                   <p className="text-[8px] font-mono text-white/20 uppercase">User Ref</p>
                   <p className="text-[10px] font-mono text-white/40 tracking-tighter">
                    {currentUser?.uid?.slice(0, 10).toUpperCase()}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        body { background-color: #0a0414; }
        .perspective-text { transform: perspective(500px) rotateX(10deg); }
      `}</style>
    </div>
  );
}
