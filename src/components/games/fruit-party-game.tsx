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
  { id: 'strawberry', emoji: '🍓', multiplier: 5, label: 'Win 5 times' },
  { id: 'bananas', emoji: '🍌', multiplier: 5, label: 'Win 5 times' },
  { id: 'oranges', emoji: '🍊', multiplier: 5, label: 'Win 5 times' },
  { id: 'watermelon', emoji: '🍉', multiplier: 5, label: 'Win 5 times' },
  { id: 'pizza', emoji: '🍕', multiplier: 10, label: 'Win 10 times' },
  { id: 'burrito', emoji: '🌯', multiplier: 15, label: 'Win 15 times' },
  { id: 'skewers', emoji: '🍢', multiplier: 25, label: 'Win 25 times' },
  { id: 'chicken', emoji: '🍗', multiplier: 45, label: 'Win 45 times' },
];

const CHIPS = [
  { value: 1000, label: '1K' },
  { value: 50000, label: '50K' },
  { value: 100000, label: '100K' },
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
];

export function FruitPartyGame({ onClose, isOverlay = false }: { onClose?: () => void; isOverlay?: boolean }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(1000); // 1K selected by default
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [lastBets, setLastBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['watermelon', 'skewers', 'pizza', 'pizza', 'strawberry', 'oranges', 'oranges']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 const [winners, setWinners] = useState<any[]>([]);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 // Ref for audio context to prevent multiple instances
 const audioCtxRef = useRef<AudioContext | null>(null);

 // Initialize and resume AudioContext on user interaction
 const initAudioContext = useCallback(() => {
  if (!audioCtxRef.current && typeof window !== 'undefined') {
   audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtxRef.current?.state === 'suspended') {
   audioCtxRef.current.resume().catch(() => {});
  }
  return audioCtxRef.current;
 }, []);

 // Play Bet Sound
 const playBetSound = useCallback(() => {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
 }, [isMuted, initAudioContext]);

 // Play Tick Sound
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

 // Handle Initial Launch
 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1500);
  return () => clearTimeout(timer);
 }, []);

 // Betting Timer Logic
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

 // Start Spin and Chase Animation
 const startSpin = async () => {
  setGameState('spinning');
  
  // Choose Winner (Default random)
  let winningId = ITEMS[Math.floor(Math.random() * ITEMS.length)].id;
  if (firestore) {
   try {
    // Optional GameOracle integration
    const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'fruit-party'));
    if (oracleSnap.exists() && oracleSnap.data().isActive) {
     winningId = oracleSnap.data().forcedResult;
     updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'fruit-party'), { isActive: false });
    }
   } catch (e) {}
  }

  // Animation sequence
  const targetIdx = ITEMS.findIndex(i => i.id === winningId);
  let currentStep = 0;
  const totalSteps = 32 + targetIdx;
  let speed = 50;

  const runChase = () => {
   setHighlightIdx(currentStep % ITEMS.length);
   playTickSound();
   currentStep++;
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 10) speed += 30; // Slow down at the end
    setTimeout(runChase, speed);
   } else {
    setTimeout(() => showResult(winningId), 800);
   }
  };
  runChase();
 };

 // Show Result and Handle Payouts
 const showResult = (id: string) => {
  setHistory(prev => [id, ...prev].slice(0, 15));
  const winItem = ITEMS.find(i => i.id === id);
  const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);

  setWinningSymbol(winItem?.emoji || '🏆');
  setTotalWinAmount(winAmount);

  // Set winners for overlay
  const sessionWinners = [];
  if (winAmount > 0 && userProfile) {
   sessionWinners.push({ name: userProfile.username, win: winAmount, avatar: userProfile.avatarUrl, isMe: true });
  }
  // Optional simulated other winners
  if (Math.random() > 0.4) sessionWinners.push({ name: 'VIP Player', win: 15000, avatar: 'https://picsum.photos/seed/a1/100', isMe: false });
  if (Math.random() > 0.2) sessionWinners.push({ name: 'Gold Member', win: 3000, avatar: 'https://picsum.photos/seed/a2/100', isMe: false });

  setWinners(sessionWinners);
  setGameState('result');

  // Handle Payout with Firebase (Missing in previous snippet, now fixed)
  if (winAmount > 0 && currentUser && firestore && userProfile) {
   const updateData = { 
    'wallet.coins': increment(winAmount), 
    'stats.dailyGameWins': increment(winAmount),
    updatedAt: serverTimestamp() 
   };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

   // Add to global wins
   addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
    gameId: 'fruit-party',
    userId: currentUser.uid,
    username: userProfile?.username || 'Guest',
    avatarUrl: userProfile?.avatarUrl || null,
    amount: winAmount,
    timestamp: serverTimestamp()
   });
  }

  // Reset game state for next round
  setTimeout(() => {
   setLastBets(myBets);
   setMyBets({});
   setWinners([]);
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(30);
  }, 5000);
 };

 // Handle Placing a Bet
 const handlePlaceBet = (id: string) => {
  if (gameState !== 'betting' || !currentUser || !userProfile) return;
  if ((userProfile.wallet?.coins || 0) < selectedChip) {
   toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Aapke paas coins kam hai.' });
   return;
  }
  
  playBetSound();
  const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 // Handle Repeat Bets
 const handleRepeat = () => {
  if (gameState !== 'betting' || !currentUser || !userProfile) return;
  const totalCost = Object.values(lastBets).reduce((a, b) => a + b, 0);
  if (totalCost === 0) return;
  if ((userProfile.wallet?.coins || 0) < totalCost) {
   toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Repeat karne ke liye coins kam hai.' });
   return;
  }

  playBetSound();
  const updateData = { 'wallet.coins': increment(-totalCost), updatedAt: serverTimestamp() };
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
  setMyBets(lastBets);
 };

 // Main Render
 return (
  <div className={cn(
   "h-screen w-full bg-[#1A0B2E] flex flex-col relative overflow-hidden text-white font-sans",
   isOverlay ? "h-full w-full" : "h-[100dvh]"
  )}>
   
   {/* Result Overlay */}
   {gameState === 'result' && winners.length > 0 && (
    <div className="absolute inset-0 z-[100] pointer-events-auto">
     <GameResultOverlay 
      gameId="fruit-party"
      winningSymbol={winningSymbol} 
      winAmount={totalWinAmount} 
      winners={winners} 
     />
    </div>
   )}

   {/* Header Actions */}
   <div className="relative z-50 flex items-center justify-between p-4 pt-6">
    <div className="flex gap-2">
     <button className="bg-white/10 p-2 rounded-xl border border-white/5 active:scale-95 transition-all"><Maximize2 className="h-4 w-4" /></button>
     <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-xl border border-white/5 active:scale-95 transition-all">
      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
     </button>
     <button className="bg-white/10 p-2 rounded-xl border border-white/5 active:scale-95 transition-all"><HelpCircle className="h-4 w-4" /></button>
    </div>
    
    <div className="text-center">
     <h1 className="text-xl font-black italic uppercase tracking-tighter drop-shadow-md">Fruit Party</h1>
    </div>

    <div className="flex gap-2">
     <button className="bg-white/10 p-2 rounded-xl border border-white/5 active:scale-95 transition-all"><MoreHorizontal className="h-4 w-4" /></button>
     {onClose && (
      <button onClick={onClose} className="bg-pink-600 p-2 rounded-xl border border-white/20 active:scale-95 transition-all hover:bg-pink-600">
       <X className="h-4 w-4" />
      </button>
     )}
    </div>
   </div>

    {/* Game Arena (Ferris Wheel UI - Refined from snippet) */}
    <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4">
      <div className="relative w-[320px] h-[400px] flex items-center justify-center">
        
        {/* Ferris Wheel Structure (Static Visuals) */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-[260px] h-[260px] border-4 border-indigo-500/30 rounded-full relative">
            {/* Spokes */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute top-1/2 left-1/2 w-[2px] h-[130px] bg-indigo-500/20 origin-top" 
                   style={{ transform: `rotate(${i * 45}deg) translateX(-50%)` }} />
            ))}
            {/* Decorative Lights */}
            {[...Array(16)].map((_, i) => (
              <div key={i} className="absolute w-2 h-2 bg-yellow-200 rounded-full shadow-[0_0_8px_white]"
                   style={{ 
                     top: `${50 + 45 * Math.sin(i * 0.4)}%`, 
                     left: `${50 + 45 * Math.cos(i * 0.4)}%` 
                   }} />
            ))}
          </div>
          {/* Wheel Stand */}
          <div className="absolute bottom-4 w-32 h-40 border-l-4 border-r-4 border-indigo-500/40 rounded-t-full -z-10" />
        </div>

        {/* Center Timer Display */}
        <div className="relative z-20 w-28 h-28 bg-[#0D041A] rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)] flex flex-col items-center justify-center border-4 border-indigo-500 text-center">
          <motion.span 
            key={timeLeft}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-headline font-black text-yellow-400"
          >
            {gameState === 'betting' ? timeLeft : (gameState === 'spinning' ? '??' : winningSymbol)}
          </motion.span>
          <p className="text-[10px] font-bold uppercase text-indigo-300 tracking-widest mt-1">
            BET NOW
          </p>
        </div>

        {/* Circular Wheel Items (Wafa Engineered) */}
        {ITEMS.map((item, idx) => {
          const angle = (idx * 45 - 90) * (Math.PI / 180);
          const radius = 135; // px
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button 
              key={item.id}
              onClick={() => handlePlaceBet(item.id)}
              disabled={gameState !== 'betting'}
              className={cn(
                "absolute transition-all duration-300 flex flex-col items-center justify-center active:scale-95 h-20 w-16rounded-xl border-2",
                highlightIdx === idx ? "bg-yellow-400 border-white scale-110 z-30" : "bg-[#1E0D3B] border-indigo-500/50"
              )}
              style={{ 
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <span className="text-3xl relative z-10 mb-1">
                {item.emoji}
              </span>
              <span className={cn(
                "text-[7px] font-black uppercase leading-tight relative z-10 text-center px-1",
                highlightIdx === idx ? "text-[#3D1E6D]" : "text-white/60"
              )}>
                {item.label}
              </span>

              {/* Bet Tag (Missing in your code, now added back) */}
              <AnimatePresence>
                {myBets[item.id] > 0 && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute -top-3 bg-indigo-600 px-2 py-0.5 rounded-lg text-white font-black text-[7px] flex items-center gap-1 border border-white/20 z-40"
                  >
                    <GoldCoinIcon className="h-2 w-2" />
                    {myBets[item.id] >= 1000 ? `${(myBets[item.id]/1000).toFixed(1)}k` : myBets[item.id]}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </main>

   {/* Footer UI (Fixed Bottom Look - Refined from snippet) */}
   <footer className="relative z-50 p-4 pb-12 bg-[#0D041A]/90 backdrop-blur-xl border-t border-indigo-500/30">
    <div className="max-w-md mx-auto space-y-4">
     <div className="flex items-center justify-between gap-3">
      <div className="flex-1 bg-white/5 h-12 rounded-xl flex items-center px-4 gap-2 border border-white/10 flex-1">
       <GoldCoinIcon className="h-5 w-5" />
       <span className="text-lg font-headline font-black text-white">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      
      <button 
       onClick={handleRepeat} 
       disabled={gameState !== 'betting'}
       className="bg-white/10 h-12 px-6 rounded-xl font-headline font-black uppercase text-sm border border-white/10 tracking-wider disabled:opacity-50"
      >
       Repeat
      </button>
     </div>

     <div className="text-center">
      <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Choose the amount of wager then choose food</p>
     </div>

     {/* Chips Selection */}
     <div className="grid grid-cols-5 gap-2 px-1">
      {CHIPS.map(chip => (
       <button 
        key={chip.value} 
        onClick={() => setSelectedChip(chip.value)} 
        className={cn(
         "h-14 rounded-xl flex flex-col items-center justify-center transition-all border-2 relative overflow-hidden", 
         selectedChip === chip.value 
          ? "bg-yellow-400 border-white text-black scale-105 shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
          : "bg-white text-black border-transparent"
        )}
       >
        <GoldCoinIcon className={cn("h-3 w-3 mb-1")} />
        <span className="text-[12px] font-headline font-black">{chip.label}</span>
       </button>
      ))}
     </div>
    </div>

    {/* Winning History */}
    <div className="max-w-md mx-auto flex items-center gap-3 mt-4 bg-black/20 p-2 rounded-xl">
     <span className="text-[10px] font-headline font-black text-white/60 whitespace-nowrap">Winning History</span>
     <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
      {history.map((id, i) => (
       <div key={i} className="relative shrink-0 flex flex-col items-center">
        <span className="text-xl">{ITEMS.find(it => it.id === id)?.emoji}</span>
        {i === 0 && (
         <div className="absolute -bottom-1 whitespace-nowrap bg-purple-600 text-[6px] px-1.5 py-0.5 rounded-md font-black shadow-md border border-white/20">
          New
         </div>
        )}
       </div>
      ))}
     </div>
    </div>
   </footer>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
   `}</style>
  </div>
 );
}
