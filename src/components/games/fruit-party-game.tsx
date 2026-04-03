'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 X,
 Volume2,
 VolumeX,
 HelpCircle,
 Maximize2,
 Coins // GoldCoinIcon की जगह Standard Icon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to replace 'cn' utility if it's missing
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const ITEMS = [
  { id: 'apple', emoji: '🍎', multiplier: 5, label: '5X' },
  { id: 'strawberry', emoji: '🍓', multiplier: 5, label: '5X' },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '5X' },
  { id: 'watermelon', emoji: '🍉', multiplier: 5, label: '5X' },
  { id: 'pizza', emoji: '🍕', multiplier: 10, label: '10X' },
  { id: 'skewers', emoji: '🍢', multiplier: 15, label: '15X' },
  { id: 'burrito', emoji: '🌯', multiplier: 25, label: '25X' },
  { id: 'meat', emoji: '🍖', multiplier: 45, label: '45X' },
];

const CHIPS = [
  { value: 1000, label: '1K' },
  { value: 50000, label: '50K' },
  { value: 100000, label: '100K' },
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
];

export function FruitPartyGame({ onClose }: { onClose?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(1000);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [lastBets, setLastBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['watermelon', 'pizza', 'strawberry', 'apple', 'mango']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 const audioCtxRef = useRef<AudioContext | null>(null);

 const initAudioContext = useCallback(() => {
  if (!audioCtxRef.current && typeof window !== 'undefined') {
   audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtxRef.current;
 }, []);

 const playBetSound = useCallback(() => {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
 }, [isMuted, initAudioContext]);

 const playTickSound = useCallback(() => {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
 }, [isMuted, initAudioContext]);

 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1500);
  return () => clearTimeout(timer);
 }, []);

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

 const startSpin = async () => {
  setGameState('spinning');
  let winningId = ITEMS[Math.floor(Math.random() * ITEMS.length)].id;
  const targetIdx = ITEMS.findIndex(i => i.id === winningId);
  let currentStep = 0;
  const totalSteps = 32 + targetIdx;
  let speed = 60;

  const runChase = () => {
   setHighlightIdx(currentStep % ITEMS.length);
   playTickSound();
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 12) speed += 35;
    setTimeout(runChase, speed);
   } else {
    setTimeout(() => showResult(winningId), 800);
   }
  };
  runChase();
 };

 const showResult = (id: string) => {
  setHistory(prev => [id, ...prev].slice(0, 15));
  const winItem = ITEMS.find(i => i.id === id);
  const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);

  setWinningSymbol(winItem?.emoji || '🏆');
  setTotalWinAmount(winAmount);
  setGameState('result');

  if (winAmount > 0 && currentUser && firestore) {
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 
    'wallet.coins': increment(winAmount),
    updatedAt: serverTimestamp() 
   });
  }

  setTimeout(() => {
   setLastBets(myBets);
   setMyBets({});
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(30);
  }, 5000);
 };

 const handlePlaceBet = (id: string) => {
  if (gameState !== 'betting' || !currentUser || !userProfile) return;
  if ((userProfile.wallet?.coins || 0) < selectedChip) {
   return;
  }
  playBetSound();
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 if (isLaunching) return <div className="h-screen w-full bg-[#0F051D] flex items-center justify-center text-yellow-400 font-black italic">FRUIT PARTY LOADING...</div>;

 return (
  <div className="flex flex-col relative min-h-screen w-full bg-[#0F051D] overflow-hidden text-white font-sans">
   
   {/* SIMPLE RESULT OVERLAY (Removed GameResultOverlay dependence) */}
   <AnimatePresence>
     {gameState === 'result' && (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl mb-4">{winningSymbol}</motion.div>
          <h2 className="text-2xl font-black text-yellow-400 uppercase italic">Winning Symbol</h2>
          {totalWinAmount > 0 && (
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="text-4xl font-black text-green-400 mt-2">
              +{totalWinAmount.toLocaleString()}
            </motion.div>
          )}
        </div>
      </motion.div>
     )}
   </AnimatePresence>

   {/* --- HEADER --- */}
   <header className="relative z-50 p-4 pt-8 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button className="bg-white/5 p-2 rounded-full border border-white/10"><Maximize2 className="h-4 w-4" /></button>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 p-2 rounded-full border border-white/10">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
      <h1 className="text-2xl font-black text-yellow-400 italic uppercase tracking-wider">Fruit Party</h1>
      <div className="flex gap-2">
        <button className="bg-white/5 p-2 rounded-full border border-white/10"><HelpCircle className="h-4 w-4" /></button>
        {onClose && <button onClick={onClose} className="bg-pink-600 p-2 rounded-full active:bg-pink-700 transition-colors"><X className="h-4 w-4" /></button>}
      </div>
    </div>

    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 mx-2 overflow-hidden">
      <span className="text-[10px] font-black text-yellow-400/60 uppercase pl-2 border-r border-white/10 pr-2">History</span>
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {history.map((id, i) => (
          <span key={i} className={cn("text-xl shrink-0", i === 0 && "scale-125 brightness-125")}>
            {ITEMS.find(it => it.id === id)?.emoji}
          </span>
        ))}
      </div>
    </div>
   </header>

   {/* --- MAIN GAME AREA --- */}
   <main className="flex-1 relative z-10 flex items-center justify-center py-10">
      <div className="relative w-80 h-80 flex items-center justify-center">
        
        {/* CENTER TIMER (The Hub) */}
        <div className="relative z-30 w-36 h-36 bg-[#2D1B4E] rounded-full shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center border-4 border-yellow-400/40">
          <span className="text-[10px] font-black text-white/50 uppercase mb-1">Time Left</span>
          <motion.div key={timeLeft} className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_gold]">
            {gameState === 'betting' ? `${timeLeft}s` : '??'}
          </motion.div>
        </div>

        {/* FRUIT CIRCLES & JOINING LINES */}
        {ITEMS.map((item, idx) => {
          const angle = (idx * (360 / ITEMS.length) - 90) * (Math.PI / 180);
          const radius = 135; 
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div key={item.id} className="absolute flex items-center justify-center" style={{ transform: `translate(${x}px, ${y}px)` }}>
              
              {/* JOINING LINE: Connecting fruit center to hub center */}
              <div 
                className="absolute bg-gradient-to-t from-yellow-400/30 to-transparent w-[2px] h-[135px] origin-bottom" 
                style={{ 
                  transform: `rotate(${idx * 45}deg) translateY(-67px)`, 
                  zIndex: 5 
                }} 
              />

              <button 
                onClick={() => handlePlaceBet(item.id)}
                disabled={gameState !== 'betting'}
                className="relative z-40 active:scale-90 transition-all"
              >
                <div className={cn(
                  "h-16 w-16 rounded-full flex flex-col items-center justify-center transition-all border-[3px] shadow-2xl",
                  highlightIdx === idx 
                    ? "bg-yellow-400 border-white scale-125 z-50 shadow-[0_0_40px_gold]" 
                    : "bg-[#4E0D25] border-[#D4AF37]" 
                )}>
                  <span className="text-3xl mb-0.5">{item.emoji}</span>
                  <span className={cn("text-[9px] font-black", highlightIdx === idx ? "text-black" : "text-yellow-400/80")}>
                    {item.label}
                  </span>
                </div>

                {/* Bet Tag */}
                <AnimatePresence>
                  {myBets[item.id] > 0 && (
                    <motion.div 
                      initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} 
                      className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-[10px] px-3 py-1 rounded-full font-black border border-white/30 shadow-2xl z-[60]"
                    >
                      {myBets[item.id] >= 1000 ? `${(myBets[item.id]/1000).toFixed(0)}K` : myBets[item.id]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          );
        })}
      </div>
   </main>

   {/* --- FOOTER --- */}
   <footer className="relative z-50 p-6 pb-12 space-y-6 bg-black/90 backdrop-blur-3xl rounded-t-[3.5rem] border-t border-white/10">
    
    <div className="flex items-center justify-between px-4">
      <div className="flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
        <Coins className="h-5 w-5 text-yellow-400" />
        <span className="text-lg font-black text-yellow-400">
          {(userProfile?.wallet?.coins || 0).toLocaleString()}
        </span>
      </div>
      <button 
        onClick={() => setMyBets(lastBets)} 
        disabled={Object.keys(lastBets).length === 0 || gameState !== 'betting'}
        className="bg-yellow-400/10 text-yellow-400 px-6 py-2.5 rounded-full text-[11px] font-black uppercase border border-yellow-400/20 active:bg-yellow-400/30 disabled:opacity-20 transition-all"
      >
        Repeat
      </button>
    </div>

    <div className="flex justify-center items-center gap-3 pb-2">
      {CHIPS.map(chip => (
        <button 
          key={chip.value} 
          onClick={() => setSelectedChip(chip.value)}
          className={cn(
            "w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all border-[3px] shadow-xl",
            selectedChip === chip.value 
              ? "bg-yellow-400 border-white text-black scale-110 z-10" 
              : "bg-[#2D1B4E] border-white/10 text-white/70 active:scale-95"
          )}
        >
          <span className="text-[10px] font-black">{chip.label}</span>
        </button>
      ))}
    </div>
    <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Select Chip • Tap fruit to bet</p>
   </footer>

   <style jsx global>{`
     .no-scrollbar::-webkit-scrollbar { display: none; }
     button { -webkit-tap-highlight-color: transparent; }
   `}</style>
  </div>
 );
}
