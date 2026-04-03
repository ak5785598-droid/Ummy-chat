'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking, 
 useDoc, 
 useMemoFirebase, 
 addDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 X,
 Volume2,
 VolumeX,
 HelpCircle,
 Maximize2
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay } from '@/components/game-result-overlay';
import { motion, AnimatePresence } from 'framer-motion';

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
 const { toast } = useToast();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(1000);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [lastBets, setLastBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['watermelon', 'pizza', 'strawberry', 'apple', 'mango']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 const [winners, setWinners] = useState<any[]>([]);
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

  const sessionWinners = [];
  if (winAmount > 0 && userProfile) {
   sessionWinners.push({ name: userProfile.username, win: winAmount, avatar: userProfile.avatarUrl, isMe: true });
  }

  setWinners(sessionWinners);
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
   setWinners([]);
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(30);
  }, 5000);
 };

 const handlePlaceBet = (id: string) => {
  if (gameState !== 'betting' || !currentUser || !userProfile) return;
  if ((userProfile.wallet?.coins || 0) < selectedChip) {
   toast({ variant: 'destructive', title: 'Insufficient Coins' });
   return;
  }
  playBetSound();
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 if (isLaunching) return <div className="h-full w-full bg-[#0F051D] flex items-center justify-center text-yellow-400 font-black italic">FRUIT PARTY LOADING...</div>;

 return (
  <div className={cn("flex flex-col relative h-[100dvh] w-full bg-[#0F051D] overflow-hidden text-white")}>
   
   {gameState === 'result' && (
    <div className="absolute inset-0 z-[100]">
      <GameResultOverlay 
        gameId="fruit-party" 
        winningSymbol={winningSymbol} 
        winAmount={totalWinAmount} 
        winners={winners} 
      />
    </div>
   )}

   {/* --- HEADER --- */}
   <header className="relative z-50 p-4 pt-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button className="bg-white/5 p-2 rounded-full border border-white/10 active:bg-white/20"><Maximize2 className="h-4 w-4" /></button>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 p-2 rounded-full border border-white/10 active:bg-white/20">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
      <h1 className="text-xl font-black text-yellow-400 italic uppercase drop-shadow-md">Fruit Party</h1>
      <div className="flex gap-2">
        <button className="bg-white/5 p-2 rounded-full border border-white/10"><HelpCircle className="h-4 w-4" /></button>
        {onClose && <button onClick={onClose} className="bg-pink-600 p-2 rounded-full shadow-lg active:bg-pink-700 transition-colors"><X className="h-4 w-4" /></button>}
      </div>
    </div>

    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 mx-2 overflow-hidden shadow-inner">
      <span className="text-[8px] font-black text-yellow-400/60 uppercase pl-2 border-r border-white/10 pr-2">History</span>
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {history.map((id, i) => (
          <span key={i} className={cn("text-xl shrink-0", i === 0 ? "scale-110 drop-shadow-[0_0_8px_gold]" : "opacity-40")}>
            {ITEMS.find(it => it.id === id)?.emoji}
          </span>
        ))}
      </div>
    </div>
   </header>

   {/* --- MAIN GAME AREA --- */}
   <main className="flex-1 relative z-10 flex items-center justify-center -mt-10">
      <div className="relative w-80 h-80 flex items-center justify-center">
        
        {/* CENTER TIMER */}
        <div className="relative z-30 w-32 h-32 bg-[#2D1B4E] rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center border-4 border-yellow-400/30">
          <span className="text-[9px] font-black text-white/40 uppercase mb-1">Time Left</span>
          <motion.div key={timeLeft} className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_gold]">
            {gameState === 'betting' ? `${timeLeft}s` : '??'}
          </motion.div>
        </div>

        {/* CHARACTER CIRCLES & CONNECTING LINES */}
        {ITEMS.map((item, idx) => {
          const angle = (idx * (360 / ITEMS.length) - 90) * (Math.PI / 180);
          const radius = 125; 
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div key={item.id} className="absolute flex items-center justify-center" style={{ transform: `translate(${x}px, ${y}px)` }}>
              
              {/* Connection Line from Center to Fruit */}
              <div 
                className="absolute bg-[#5D4037]/60 w-1 h-32 origin-bottom" 
                style={{ 
                  transform: `rotate(${idx * 45}deg) translateY(-60px)`, 
                  zIndex: 10 
                }} 
              />

              <button 
                onClick={() => handlePlaceBet(item.id)}
                disabled={gameState !== 'betting'}
                className="relative z-40 group active:scale-95 transition-transform"
              >
                <div className={cn(
                  "h-16 w-16 rounded-full flex flex-col items-center justify-center transition-all border-[3px] shadow-2xl",
                  highlightIdx === idx 
                    ? "bg-yellow-400 border-white scale-125 z-50 shadow-[0_0_30px_rgba(255,215,0,0.6)]" 
                    : "bg-[#4E0D25] border-[#D4AF37]" 
                )}>
                  <span className="text-3xl mb-0.5 drop-shadow-md">{item.emoji}</span>
                  <span className={cn("text-[8px] font-black", highlightIdx === idx ? "text-black" : "text-yellow-400/80")}>
                    {item.label}
                  </span>
                </div>

                {/* Bet Tag */}
                <AnimatePresence>
                  {myBets[item.id] > 0 && (
                    <motion.div 
                      initial={{ scale: 0, y: 5 }} 
                      animate={{ scale: 1, y: 0 }} 
                      className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-[9px] px-2 py-0.5 rounded-full font-black border border-white/20 shadow-xl whitespace-nowrap z-[60]"
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

   {/* --- FOOTER & CHIPS --- */}
   <footer className="relative z-50 p-6 pb-10 space-y-6 bg-black/80 backdrop-blur-2xl rounded-t-[3rem] border-t border-white/10">
    
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
        <GoldCoinIcon className="h-4 w-4" />
        <span className="text-sm font-black tracking-tight">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <button 
        onClick={() => setMyBets(lastBets)} 
        disabled={Object.keys(lastBets).length === 0 || gameState !== 'betting'}
        className="bg-yellow-400/20 text-yellow-400 px-5 py-2 rounded-full text-[10px] font-black uppercase border border-yellow-400/30 active:bg-yellow-400/40 disabled:opacity-30 transition-all"
      >
        Repeat
      </button>
    </div>

    {/* CHIPS SECTION - Fixed Visibility */}
    <div className="flex justify-center items-center gap-2 pb-4">
      {CHIPS.map(chip => (
        <button 
          key={chip.value} 
          onClick={() => setSelectedChip(chip.value)}
          className={cn(
            "w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all border-[3px] shadow-lg",
            selectedChip === chip.value 
              ? "bg-yellow-400 border-white text-black scale-110 z-10" 
              : "bg-[#2D1B4E] border-white/10 text-white/70 active:scale-95"
          )}
        >
          <span className="text-[10px] font-black">{chip.label}</span>
        </button>
      ))}
    </div>
    <p className="text-center text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Select amount • Tap fruit to bet</p>
   </footer>

   <style jsx global>{`
     .no-scrollbar::-webkit-scrollbar { display: none; }
     button { -webkit-tap-highlight-color: transparent; }
   `}</style>
  </div>
 );
}

