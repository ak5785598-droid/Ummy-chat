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
 const [history, setHistory] = useState<string[]>(['watermelon', 'skewers', 'pizza', 'pizza', 'strawberry', 'oranges', 'oranges']);
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
  if (audioCtxRef.current?.state === 'suspended') {
   audioCtxRef.current.resume().catch(() => {});
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
  osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05);
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
  if (firestore) {
   try {
    const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'fruit-party'));
    if (oracleSnap.exists() && oracleSnap.data().isActive) {
     winningId = oracleSnap.data().forcedResult;
     updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'fruit-party'), { isActive: false });
    }
   } catch (e) {}
  }

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
  if (Math.random() > 0.4) sessionWinners.push({ name: 'VIP Player', win: 15000, avatar: 'https://picsum.photos/seed/a1/100', isMe: false });
  if (Math.random() > 0.2) sessionWinners.push({ name: 'Gold Member', win: 3000, avatar: 'https://picsum.photos/seed/a2/100', isMe: false });

  setWinners(sessionWinners);
  setGameState('result');

  if (winAmount > 0 && currentUser && firestore && userProfile) {
   const updateData = { 
    'wallet.coins': increment(winAmount), 
    'stats.dailyGameWins': increment(winAmount),
    updatedAt: serverTimestamp() 
   };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

   addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
    gameId: 'fruit-party',
    userId: currentUser.uid,
    username: userProfile?.username || 'Guest',
    avatarUrl: userProfile?.avatarUrl || null,
    amount: winAmount,
    timestamp: serverTimestamp()
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
  const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const handleRepeat = () => {
  if (gameState !== 'betting' || !currentUser || !userProfile) return;
  const totalCost = Object.values(lastBets).reduce((a, b) => a + b, 0);
  if (totalCost === 0) return;
  if ((userProfile.wallet?.coins || 0) < totalCost) {
   toast({ variant: 'destructive', title: 'Insufficient Coins' });
   return;
  }

  playBetSound();
  const updateData = { 'wallet.coins': increment(-totalCost), updatedAt: serverTimestamp() };
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
  setMyBets(lastBets);
 };

 if (isLaunching) {
  return (
   <div className="h-full w-full bg-[#3D1E6D] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
    <div className="text-8xl animate-bounce text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]">🎡</div>
    <h1 className="text-4xl font-headline font-black text-yellow-400 uppercase tracking-tight italic">Fruit Party</h1>
    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
     <div className="h-full bg-yellow-400 w-1/2 animate-[loading_1.5s_infinite_linear]" />
    </div>
    <style jsx>{`
     @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
     }
    `}</style>
   </div>
  );
 }

 return (
  <div className={cn(
   "flex flex-col relative overflow-hidden font-sans text-white",
   isOverlay ? "h-full w-full" : "h-[100dvh] w-full bg-[#3D1E6D]"
  )}>
   
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

   {/* Background Layer */}
   <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[#3D1E6D]" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
   </div>

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
     <h1 className="text-xl font-headline font-black text-white uppercase tracking-wider drop-shadow-md">Fruit Party</h1>
    </div>

    <div className="flex gap-2">
     <button className="bg-white/10 p-2 rounded-xl border border-white/5 active:scale-95 transition-all"><MoreHorizontal className="h-4 w-4" /></button>
     {onClose && (
      <button onClick={onClose} className="bg-pink-500/80 p-2 rounded-xl border border-white/20 active:scale-95 transition-all hover:bg-pink-600">
       <X className="h-4 w-4" />
      </button>
     )}
    </div>
   </div>

    {/* Game Arena */}
    <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center p-8 bg-[#2A144E]/40 rounded-[2.5rem] border border-white/10">
        
        {/* Outer Circular Frame */}
        <div className="absolute inset-10 border-2 border-indigo-400/20 rounded-full shadow-[0_0_40px_rgba(139,92,246,0.2)]" />
        <div className="absolute inset-12 border border-white/5 rounded-full" />
        
        {/* Dynamic Spinning Glow (BEHIND items) */}
        {gameState === 'spinning' && (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-4 rounded-full border-t-8 border-yellow-400/40 blur-md pointer-events-none"
          />
        )}

        {/* Center Display (30 BET NOW) */}
        <div className="relative z-20 w-32 h-32 bg-[#1A0B2E] rounded-full shadow-[0_0_30px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center border-4 border-[#8B5CF6]/30 p-2 text-center">
          <motion.span 
            key={timeLeft}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-headline font-black text-[#FFD700] leading-none"
          >
            {gameState === 'betting' ? timeLeft : (gameState === 'spinning' ? '??' : '!!')}
          </motion.span>
          <p className="text-[10px] font-black uppercase text-[#8B5CF6] tracking-widest mt-1 italic">
            BET NOW
          </p>
        </div>

        {/* Circular Wheel Items (Wafa Engineered) */}
        {ITEMS.map((item, idx) => {
          const angle = (idx * (360 / ITEMS.length) - 90) * (Math.PI / 180);
          const radius = 135; // px
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button 
              key={item.id}
              onClick={() => handlePlaceBet(item.id)}
              disabled={gameState !== 'betting'}
              className={cn(
                "absolute transition-all duration-300 flex flex-col items-center group active:scale-95",
                highlightIdx === idx ? "z-30" : "z-10"
              )}
              style={{ 
                transform: `translate(${x}px, ${y}px)`,
                top: 'calc(50% - 32px)',
                left: 'calc(50% - 32px)'
              }}
            >
              <div className={cn(
                "h-20 w-16 rounded-[1.25rem] flex flex-col items-center justify-center p-1 transition-all border-2 relative overflow-hidden",
                highlightIdx === idx 
                  ? "bg-[#FFD700] border-white scale-110 shadow-[0_0_20px_rgba(255,215,0,0.4)]" 
                  : "bg-[#2D1B4E] border-white/10"
              )}>
                <span className="text-3xl relative z-10 mb-1">
                  {item.emoji}
                </span>
                <span className={cn(
                  "text-[7px] font-black uppercase leading-tight relative z-10 text-center px-1",
                  highlightIdx === idx ? "text-[#3D1E6D]" : "text-white/60"
                )}>
                  {item.label}
                </span>
              </div>

              {/* Bet Tag (Wafa Style) */}
              <AnimatePresence>
                {myBets[item.id] > 0 && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute -top-3 bg-indigo-600 text-white px-2 py-0.5 rounded-lg font-black text-[7px] shadow-lg flex items-center gap-1 border border-white/20 z-40 whitespace-nowrap"
                  >
                    <GoldCoinIcon className="h-2 w-2" />
                    {myBets[item.id] > 1000 ? `${(myBets[item.id]/1000).toFixed(1)}k` : myBets[item.id]}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </main>

   {/* Footer Controls */}
   <footer className="relative z-50 p-4 pb-12 space-y-4 bg-black/40 backdrop-blur-xl border-t border-white/10">
    <div className="max-w-md mx-auto space-y-4">
     <div className="flex items-center justify-between gap-3">
      <div className="bg-[#2D1B4E]/80 px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10 flex-1">
       <GoldCoinIcon className="h-4 w-4" />
       <span className="text-sm font-headline font-black text-white">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      
      <button 
       onClick={handleRepeat} 
       className="bg-white/10 px-6 py-2 rounded-2xl font-headline font-black uppercase text-[12px] hover:bg-white/20 active:scale-95 transition-all border border-white/10 tracking-wider"
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
         "h-16 rounded-2xl flex flex-col items-center justify-center transition-all border-2 relative overflow-hidden", 
         selectedChip === chip.value 
          ? "bg-[#FFD700] border-white text-[#3D1E6D] scale-105 shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
          : "bg-white text-black border-transparent hover:bg-white/90"
        )}
       >
        <GoldCoinIcon className={cn("h-4 w-4 mb-1", selectedChip === chip.value ? "text-[#3D1E6D]" : "text-amber-500")} />
        <span className="text-[12px] font-headline font-black">{chip.label}</span>
       </button>
      ))}
     </div>
    </div>

    {/* Winning History */}
    <div className="max-w-md mx-auto flex items-center gap-3">
     <span className="text-[10px] font-headline font-black text-white p-2">Winning History</span>
     <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
      {history.map((id, i) => (
       <div key={i} className="relative shrink-0 flex flex-col items-center">
        <span className="text-xl">{ITEMS.find(it => it.id === id)?.emoji}</span>
        {i === 0 && (
         <div className="absolute -bottom-1 whitespace-nowrap bg-[#8B5CF6] text-[6px] px-1.5 py-0.5 rounded-md font-black shadow-md border border-white/20">
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
    .bg-gradient-radial {
     background-image: radial-gradient(var(--tw-gradient-stops));
    }
   `}</style>
  </div>
 );
}
