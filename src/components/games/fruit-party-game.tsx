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
import { doc, increment, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { 
 X,
 Volume2,
 VolumeX,
 HelpCircle,
 Maximize2,
 MoreHorizontal
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay } from '@/components/game-result-overlay';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'apple', emoji: '🍎', multiplier: 5, label: 'Win 5 times' },
  { id: 'strawberry', emoji: '🍓', multiplier: 5, label: 'Win 5 times' },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: 'Win 5 times' },
  { id: 'watermelon', emoji: '🍉', multiplier: 5, label: 'Win 5 times' },
  { id: 'pizza', emoji: '🍕', multiplier: 10, label: 'Win 10 times' },
  { id: 'skewers', emoji: '🍢', multiplier: 15, label: 'Win 15 times' },
  { id: 'burrito', emoji: '🌯', multiplier: 25, label: 'Win 25 times' },
  { id: 'meat', emoji: '🍖', multiplier: 45, label: 'Win 45 times' },
];

const CHIPS = [
  { value: 1000, label: '1K' },
  { value: 50000, label: '50K' },
  { value: 100000, label: '100K' },
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
];

interface FruitPartyGameProps {
 onClose?: () => void;
 isOverlay?: boolean;
}

export function FruitPartyGame({ onClose, isOverlay = false }: FruitPartyGameProps) {
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
 const [history, setHistory] = useState<string[]>(['watermelon', 'pizza', 'strawberry', 'apple', 'mango', 'meat', 'burrito']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 const [winners, setWinners] = useState<any[]>([]);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'fruit-party'), [firestore]);
 const { data: gameData } = useDoc(gameDocRef);
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
  let speed = 50;

  const runChase = () => {
   setHighlightIdx(currentStep % ITEMS.length);
   playTickSound();
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 10) speed += 30;
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
   const updateData = { 'wallet.coins': increment(winAmount), updatedAt: serverTimestamp() };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
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
  const updateData = { 'wallet.coins': increment(-selectedChip) };
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 if (isLaunching) {
  return (
   <div className="h-full w-full bg-[#1A0B2E] flex flex-col items-center justify-center">
    <div className="text-6xl animate-bounce">🍎</div>
    <h1 className="mt-4 text-2xl font-black text-yellow-400 uppercase italic">Loading Party...</h1>
   </div>
  );
 }

 return (
  <div className={cn(
   "flex flex-col relative overflow-hidden font-sans text-white",
   isOverlay ? "h-full w-full" : "h-[100dvh] w-full bg-[#0F051D]"
  )}>
   
   {gameState === 'result' && winners.length > 0 && (
    <div className="absolute inset-0 z-[100]">
     <GameResultOverlay gameId="fruit-party" winningSymbol={winningSymbol} winAmount={totalWinAmount} winners={winners} />
    </div>
   )}

   {/* --- TOP HEADER & HISTORY --- */}
   <div className="relative z-50 p-4 pt-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button className="bg-white/5 p-2 rounded-full border border-white/10"><Maximize2 className="h-4 w-4" /></button>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 p-2 rounded-full border border-white/10">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
      <div className="text-center">
        <h1 className="text-xl font-black text-yellow-400 italic uppercase tracking-tighter drop-shadow-lg">Fruit Party</h1>
      </div>
      <div className="flex gap-2">
        <button className="bg-white/5 p-2 rounded-full border border-white/10"><HelpCircle className="h-4 w-4" /></button>
        {onClose && <button onClick={onClose} className="bg-pink-600 p-2 rounded-full border border-white/20"><X className="h-4 w-4" /></button>}
      </div>
    </div>

    {/* Horizontal Winning History Line */}
    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/5 mx-2 overflow-hidden shadow-inner">
      <span className="text-[8px] font-black text-yellow-400/60 uppercase whitespace-nowrap pl-2 border-r border-white/10 pr-2">History</span>
      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
        {history.map((id, i) => (
          <span key={i} className={cn("text-lg shrink-0", i === 0 ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "opacity-40")}>
            {ITEMS.find(it => it.id === id)?.emoji}
          </span>
        ))}
      </div>
    </div>
   </div>

    {/* --- MAIN CIRCULAR BOARD --- */}
    <main className="flex-1 relative z-10 flex items-center justify-center p-4">
      <div className="relative w-80 h-80 flex items-center justify-center">
        
        {/* Glow & Rings */}
        <div className="absolute inset-0 rounded-full bg-indigo-600/5 blur-[60px]" />
        <div className="absolute inset-[-10px] rounded-full border-2 border-dashed border-white/5 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]" />
        
        {/* CENTER TIMER (30s) */}
        <div className="relative z-20 w-32 h-32 bg-gradient-to-br from-[#2D1B4E] to-[#1A0B2E] rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-yellow-400/40">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Time Left</span>
          <motion.div 
            key={timeLeft}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]"
          >
            {gameState === 'betting' ? `${timeLeft}s` : (gameState === 'spinning' ? '??' : '00s')}
          </motion.div>
          <div className="mt-1 h-1 w-12 bg-white/10 rounded-full overflow-hidden">
             <motion.div 
              className="h-full bg-yellow-400" 
              initial={{ width: "100%" }} 
              animate={{ width: `${(timeLeft/30)*100}%` }}
             />
          </div>
        </div>

        {/* Circular Placed Food Items */}
        {ITEMS.map((item, idx) => {
          const angle = (idx * (360 / ITEMS.length) - 90) * (Math.PI / 180);
          const radius = 125; // Adjusted radius
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button 
              key={item.id}
              onClick={() => handlePlaceBet(item.id)}
              disabled={gameState !== 'betting'}
              className="absolute transition-all duration-300 group"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <div className={cn(
                "h-16 w-16 rounded-full flex flex-col items-center justify-center transition-all border-2 relative",
                highlightIdx === idx 
                  ? "bg-yellow-400 border-white scale-125 z-50 shadow-[0_0_30px_rgba(255,255,255,0.6)]" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}>
                <span className="text-2xl drop-shadow-md">{item.emoji}</span>
                <span className={cn(
                  "text-[7px] font-black uppercase", 
                  highlightIdx === idx ? "text-black" : "text-white/60"
                )}>
                  {item.multiplier}X
                </span>
              </div>

              {/* Bet Indicator Bubble */}
              <AnimatePresence>
                {myBets[item.id] > 0 && (
                  <motion.div 
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-[8px] px-2 py-0.5 rounded-full font-black border border-white/20 shadow-lg whitespace-nowrap"
                  >
                    {myBets[item.id] >= 1000 ? `${(myBets[item.id]/1000).toFixed(1)}K` : myBets[item.id]}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </main>

   {/* --- BOTTOM UI & CIRCULAR CHIPS --- */}
   <footer className="relative z-50 p-6 pb-12 space-y-6 bg-black/60 backdrop-blur-xl rounded-t-[3.5rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
    
    <div className="flex items-center justify-between px-4">
      <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/10 shadow-inner">
        <GoldCoinIcon className="h-4 w-4" />
        <span className="text-sm font-black tracking-tight">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <button 
        onClick={() => setMyBets(lastBets)} 
        className="bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 px-6 py-2.5 rounded-full text-[10px] font-black uppercase border border-yellow-400/20 transition-all active:scale-95"
      >
        Repeat
      </button>
    </div>

    {/* Circular Chips Selection */}
    <div className="flex justify-center items-center gap-3">
      {CHIPS.map(chip => (
        <button 
          key={chip.value} 
          onClick={() => setSelectedChip(chip.value)}
          className={cn(
            "w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all border-4 shadow-xl",
            selectedChip === chip.value 
              ? "bg-yellow-400 border-white text-black scale-110 rotate-3 shadow-yellow-400/20" 
              : "bg-[#2D1B4E] border-white/10 text-white/60 hover:border-white/30"
          )}
        >
          <GoldCoinIcon className={cn("h-3 w-3 mb-0.5", selectedChip === chip.value ? "text-black" : "text-yellow-400")} />
          <span className="text-[10px] font-black">{chip.label}</span>
        </button>
      ))}
    </div>

    <p className="text-center text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Select amount • Tap food to place bet</p>
   </footer>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   `}</style>
  </div>
 );
}
