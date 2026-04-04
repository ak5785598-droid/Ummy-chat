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
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-700', icon: '🍇' },
  { value: 5000, label: '5,000', color: 'from-rose-400 to-rose-700' },
  { value: 50000, label: '50,000', color: 'from-blue-400 to-blue-700' },
  { value: 500000, label: '500,000', color: 'from-purple-400 to-purple-700', icon: '🍎🥭' },
];

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
 const [deductions, setDeductions] = useState<{id: number, amount: number}[]>([]);
 
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
  
  // Real-time Deduction Effect
  const dedId = Date.now();
  setDeductions(prev => [...prev, { id: dedId, amount: selectedChip }]);
  setTimeout(() => setDeductions(prev => prev.filter(d => d.id !== dedId)), 1000);

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

 const visualizerBars = useMemo(() => Array.from({ length: 20 }).map(() => Math.random()), []);

 if (isLaunching) return <div className="h-full w-full bg-[#0f071a] flex items-center justify-center text-yellow-400 font-bold tracking-widest">LOADING FRUIT PARADISE...</div>;

 return (
  <div className="fixed inset-0 flex flex-col bg-[#0a0414] overflow-hidden text-white font-sans">
   
   <AnimatePresence>
    {gameState === 'result' && (
      <div className="fixed inset-0 z-[200]">
        <GameResultOverlay gameId="fruit-party" winningSymbol={winningSymbol} winAmount={totalWinAmount} winners={winners} />
      </div>
    )}
   </AnimatePresence>

   {/* --- HEADER --- */}
   <header className="relative px-4 pt-6 pb-2 flex flex-col items-center w-full z-30">
      <div className="flex items-center justify-between w-full relative z-40">
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
        </button>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-400 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          FRUIT PARTY
        </h1>
        <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 backdrop-blur-md">
          <X size={20}/>
        </button>
      </div>
   </header>

   <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
    
    {/* --- SYNCED VOLUME VISUALIZERS (Pink/Blue) --- */}
    <div className="absolute inset-x-0 top-1/4 flex justify-between px-2 pointer-events-none">
        <div className="flex items-end gap-1 h-32">
            {visualizerBars.slice(0, 10).map((h, i) => (
                <motion.div key={i} animate={{ height: [`${h*40}%`, `${h*100}%`, `${h*40}%`] }} transition={{ repeat: Infinity, duration: 0.5, delay: i*0.05 }} className="w-1.5 bg-gradient-to-t from-blue-600 to-pink-400 rounded-full opacity-60" />
            ))}
        </div>
        <div className="flex items-end gap-1 h-32 rotate-y-180">
            {visualizerBars.slice(10, 20).map((h, i) => (
                <motion.div key={i} animate={{ height: [`${h*40}%`, `${h*100}%`, `${h*40}%`] }} transition={{ repeat: Infinity, duration: 0.5, delay: i*0.05 }} className="w-1.5 bg-gradient-to-t from-pink-600 to-blue-400 rounded-full opacity-60" />
            ))}
        </div>
    </div>

    <div className="relative flex flex-col items-center w-full max-w-[360px] transform-gpu transition-transform duration-700" style={{ transform: 'rotateX(10deg)' }}>
        
        {/* Round History */}
        <div className="flex gap-2 bg-black/60 p-2 px-4 rounded-full border border-white/10 mb-6 backdrop-blur-xl">
            {history.map((id, i) => (
                <span key={i} className="text-lg grayscale-[0.5] hover:grayscale-0">{ITEMS.find(it => it.id === id)?.emoji}</span>
            ))}
        </div>

        {/* 3D Main Grid Case */}
        <div className="relative w-full aspect-square max-w-[320px] group">
            {/* Multi-Color Border Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-yellow-400 to-pink-600 rounded-[3.5rem] blur-xl opacity-40 animate-pulse" />
            
            <div className="relative h-full w-full p-1 rounded-[3.2rem] bg-gradient-to-br from-blue-400 via-yellow-300 to-pink-400 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="h-full w-full bg-[#120626] rounded-[3rem] p-4 grid grid-cols-3 gap-3 shadow-inner">
                    {ITEMS.map((item, idx) => {
                        const isHandTarget = gameState === 'betting' && sequenceIndices[hintStep] === idx;
                        if (item.id === 'timer') return (
                            <div key="timer" className="bg-black/40 rounded-[2rem] flex items-center justify-center border-2 border-white/5 shadow-2xl">
                                <span className="text-4xl font-black text-yellow-400 drop-shadow-lg">{gameState === 'betting' ? timeLeft : '!!!'}</span>
                            </div>
                        );

                        return (
                            <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.92, rotateZ: -2 }}
                                onClick={() => handlePlaceBet(item.id)}
                                className={cn(
                                    "relative rounded-[2rem] flex flex-col items-center justify-center transition-all duration-500 overflow-hidden",
                                    "bg-white/5 border border-white/10 shadow-lg",
                                    highlightIdx === idx ? "scale-110 ring-4 ring-yellow-400 shadow-[0_0_40px_rgba(255,215,0,0.6)] z-20" : "",
                                    isHandTarget ? "bg-green-500/20 border-green-400/50" : ""
                                )}
                            >
                                <span className="text-4xl mb-1 drop-shadow-md">{item.emoji}</span>
                                <span className="text-[10px] font-black text-white/40">{item.label}</span>
                                
                                {myBets[item.id] > 0 && (
                                    <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                                        {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(1)+'K' : myBets[item.id]}
                                    </div>
                                )}

                                <AnimatePresence>
                                    {isHandTarget && (
                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-green-500/10 pointer-events-none">
                                            <Pointer size={32} className="text-white fill-white -rotate-12 drop-shadow-lg animate-bounce" />
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

   {/* --- FOOTER --- */}
   <footer className="bg-[#0f051c] p-6 rounded-t-[3.5rem] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] z-50">
    <div className="max-w-md mx-auto space-y-6">
      
      {/* Chips with embedded fruit icons */}
      <div className="flex justify-between gap-3">
        {CHIPS.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)}
            className={cn(
              "relative flex-1 h-14 rounded-2xl flex flex-col items-center justify-center transition-all",
              "bg-gradient-to-br border-b-[6px] border-black/40 shadow-2xl",
              chip.color,
              selectedChip === chip.value ? "scale-110 -translate-y-3 ring-2 ring-white z-10" : "opacity-50 grayscale-[0.3]"
            )}
          >
            {chip.icon && <span className="text-[10px] absolute top-1 opacity-80">{chip.icon}</span>}
            <span className="text-white font-black text-[11px] mt-2">{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Balance Bar with Deduction Animation */}
      <div className="relative bg-white/5 p-4 rounded-[2.2rem] border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
                <div className="bg-yellow-400 p-3 rounded-2xl shadow-xl">
                    <GoldCoinIcon className="h-6 w-6 text-black" />
                </div>
                <div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Total Balance</p>
                    <p className="text-2xl font-black text-yellow-400 italic flex items-center gap-2">
                      {(userProfile?.wallet?.coins || 0).toLocaleString()}
                      
                      {/* Floating Deduction Text */}
                      <AnimatePresence>
                        {deductions.map(d => (
                            <motion.span 
                                key={d.id}
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -40 }}
                                className="absolute text-red-500 text-lg font-bold right-0"
                            >
                                -{d.amount.toLocaleString()}
                            </motion.span>
                        ))}
                      </AnimatePresence>
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
   </footer>

   <style jsx global>{`
     .rotate-y-180 { transform: rotateY(180deg); }
     @keyframes shimmer { 
       0% { background-position: -200% 0; } 
       100% { background-position: 200% 0; } 
     }
   `}</style>
  </div>
 );
}
