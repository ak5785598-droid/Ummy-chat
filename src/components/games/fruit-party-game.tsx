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
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '×6', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-700', deco: '🍇' },
  { value: 5000, label: '5,000', color: 'from-rose-400 to-rose-700' },
  { value: 50000, label: '50,000', color: 'from-blue-400 to-blue-700' },
  { value: 500000, label: '500,000', color: 'from-purple-400 to-purple-700', deco: '🍎🥭' },
];

const VisualizerSide = ({ side }: { side: 'left' | 'right' }) => (
  <div className={cn("flex items-center gap-1 h-8", side === 'right' && "flex-row-reverse")}>
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ height: [4, 20, 8, 24, 4] }}
        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
        className={cn(
          "w-1 rounded-full",
          i % 3 === 0 ? "bg-blue-400" : i % 3 === 1 ? "bg-pink-500" : "bg-yellow-400"
        )}
      />
    ))}
  </div>
);

const BranchFruit = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: -10 }}
    animate={{ 
      scale: [0, 1.2, 1, 1, 0], 
      opacity: [0, 1, 1, 1, 0],
      y: [0, 0, 0, 50, 100],
      rotate: [0, 0, 0, 15, 45]
    }}
    transition={{ duration: 5, repeat: Infinity, delay: delay, times: [0, 0.1, 0.7, 0.85, 1] }}
    className="text-2xl filter drop-shadow-md"
  >
    {emoji}
  </motion.div>
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
 const [history, setHistory] = useState<string[]>(['apple', 'grapes', 'lemon', 'mango']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 const [hintStep, setHintStep] = useState(0);
 
 const sequenceIndices = [0, 1, 2, 5, 8, 7, 6, 3];

 const [winners, setWinners] = useState<any[]>([]);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1200);
  return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const hintInterval = setInterval(() => {
    setHintStep(prev => (prev + 1) % sequenceIndices.length);
  }, 1000);
  return () => clearInterval(hintInterval);
 }, [gameState]);

 useEffect(() => {
  if (isLaunching) return;
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft, isLaunching]);

 const handlePlaceBet = (id: string) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser || !userProfile) return;
  const currentBalance = userProfile.wallet?.coins || 0;
  if (currentBalance < selectedChip) {
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
  const winningItem = validItems[Math.floor(Math.random() * validItems.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winningItem.id);
  const spinSequence = [0, 1, 2, 5, 8, 7, 6, 3]; 
  let currentStep = 0;
  const totalSteps = (spinSequence.length * 4) + spinSequence.indexOf(targetIdx);
  let speed = 60;

  const runAnimation = () => {
   setHighlightIdx(spinSequence[currentStep % spinSequence.length]);
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 10) speed += 40;
    setTimeout(runAnimation, speed);
   } else {
    setTimeout(() => finalizeResult(winningItem), 800);
   }
  };
  runAnimation();
 };

 const finalizeResult = (winItem: any) => {
  const betOnThis = myBets[winItem.id] || 0;
  const winAmount = betOnThis * winItem.multiplier;
  setWinningSymbol(winItem.emoji);
  setTotalWinAmount(winAmount);
  setHistory(prev => [winItem.id, ...prev].slice(0, 10));
  const currentWinners = [];
  if (winAmount > 0 && userProfile) {
    currentWinners.push({ name: userProfile.username || 'You', win: winAmount, avatar: userProfile.avatarUrl, isMe: true });
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 
      'wallet.coins': increment(winAmount),
      updatedAt: serverTimestamp()
    });
  }
  setWinners(currentWinners);
  setGameState('result');
  setTimeout(() => {
   setMyBets({});
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(30);
  }, 5000);
 };

 if (isLaunching) return <div className="h-full w-full bg-[#0f071a] flex items-center justify-center text-yellow-400 font-bold tracking-widest">PREPARING FRUIT PARTY...</div>;

 return (
  <div className="fixed inset-0 flex flex-col bg-[#0a0514] overflow-hidden text-white font-sans">
   <AnimatePresence>
    {gameState === 'result' && (
      <div className="fixed inset-0 z-[200]">
        <GameResultOverlay gameId="fruit-party" winningSymbol={winningSymbol} winAmount={totalWinAmount} winners={winners} />
      </div>
    )}
   </AnimatePresence>

   {/* HEADER */}
   <header className="relative px-4 pt-6 pb-2 flex flex-col items-center w-full z-30">
      <div className="flex items-center justify-between w-full relative z-40">
        <div className="flex items-center gap-3">
          <VisualizerSide side="left" />
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
          </button>
          <VisualizerSide side="right" />
        </div>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-400 tracking-tighter drop-shadow-xl animate-pulse">
          FRUIT PARTY 3D
        </h1>
        <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
          <X size={20}/>
        </button>
      </div>
   </header>

   {/* MAIN GAME AREA */}
   <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
    {/* Round History */}
    <div className="mb-4 z-10 flex flex-col items-center">
      <div className="flex gap-2 bg-black/60 p-2 px-4 rounded-full border border-white/10 shadow-inner">
        {history.map((id, i) => (
          <span key={i} className="text-lg opacity-80">{ITEMS.find(it => it.id === id)?.emoji}</span>
        ))}
      </div>
    </div>

    {/* 3D Grid Case */}
    <div className="relative group perspective-1000 transition-transform duration-500" style={{ transform: 'rotateX(10deg)' }}>
        {/* Animated Multi-Color Border */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-yellow-400 to-pink-500 rounded-[3.2rem] blur-[2px] animate-spin-slow opacity-70" />
        
        <div className="relative p-2 rounded-[3rem] bg-[#1a0b2e] shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10">
            <div className="grid grid-cols-3 gap-3 p-4 bg-black/40 rounded-[2.5rem]">
                {ITEMS.map((item, idx) => {
                if (item.id === 'timer') {
                    return (
                    <div key="timer" className="w-full aspect-square bg-black rounded-[1.8rem] flex items-center justify-center shadow-[inset_0_0_20px_rgba(250,204,21,0.2)]">
                        <span className="text-4xl font-black text-yellow-400 drop-shadow-glow">
                          {gameState === 'betting' ? timeLeft : '!!!'}
                        </span>
                    </div>
                    );
                }
                
                const isHandTarget = gameState === 'betting' && sequenceIndices[hintStep] === idx;

                return (
                    <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePlaceBet(item.id)}
                        className={cn(
                            "relative w-full aspect-square rounded-[1.8rem] flex flex-col items-center justify-center transition-all duration-300",
                            "bg-gradient-to-b from-white/5 to-white/[0.02] border-t border-white/10 shadow-xl",
                            highlightIdx === idx ? "ring-4 ring-yellow-400 shadow-[0_0_30px_gold] brightness-125 z-10" : "opacity-90",
                            isHandTarget ? "bg-green-500/40 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : ""
                        )}
                    >
                        <span className="text-4xl mb-1 drop-shadow-2xl">{item.emoji}</span>
                        <span className="text-[10px] font-bold text-white/40">{item.label}</span>
                        
                        {myBets[item.id] > 0 && (
                            <div className="absolute -top-2 -right-1 bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-lg border-2 border-[#1a0b2e]">
                                {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'K' : myBets[item.id]}
                            </div>
                        )}

                        <AnimatePresence>
                            {isHandTarget && (
                                <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-50">
                                    <Pointer size={36} className="text-white fill-white drop-shadow-glow -rotate-45" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                );
                })}
            </div>
        </div>
    </div>
   </main>

   {/* FOOTER */}
   <footer className="bg-[#12081f] p-6 pb-10 rounded-t-[3.5rem] border-t border-white/10 relative">
    <div className="max-w-md mx-auto">
      {/* Chips Selection */}
      <div className="flex justify-between gap-3 mb-6">
        {CHIPS.map(chip => (
          <div key={chip.value} className="relative flex-1">
            {/* Floating Fruit Decor */}
            {chip.deco && (
               <motion.div 
                 animate={{ y: [0, -10, 0] }} 
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg z-10 pointer-events-none drop-shadow-glow"
               >
                 {chip.deco}
               </motion.div>
            )}
            <button 
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-full h-14 rounded-2xl bg-gradient-to-br border-b-4 border-black/40 shadow-2xl transition-all",
                chip.color,
                selectedChip === chip.value ? "-translate-y-2 ring-2 ring-white" : "opacity-40 grayscale-[0.5]"
              )}
            >
              <span className="text-white font-black text-xs">{chip.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Wallet Display */}
      <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="bg-yellow-400 p-2.5 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                  <GoldCoinIcon className="h-5 w-5 text-black" />
              </div>
              <div>
                  <p className="text-[10px] text-white/40 font-black uppercase">Your Balance</p>
                  <p className="text-xl font-black text-yellow-400 italic">
                    {(userProfile?.wallet?.coins || 0).toLocaleString()}
                  </p>
              </div>
          </div>
          <div className="text-[10px] font-mono opacity-20 uppercase tracking-widest">
            Player: {currentUser?.uid?.slice(0, 5)}
          </div>
      </div>
    </div>
   </footer>

   <style jsx global>{`
     .perspective-1000 { perspective: 1200px; }
     .drop-shadow-glow { filter: drop-shadow(0 0 8px rgba(255,255,255,0.6)); }
     @keyframes spin-slow {
       from { transform: rotate(0deg); }
       to { transform: rotate(360deg); }
     }
     .animate-spin-slow { animation: spin-slow 8s linear infinite; }
   `}</style>
  </div>
 );
}
