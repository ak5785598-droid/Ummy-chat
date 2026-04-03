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
 X, Volume2, VolumeX, HelpCircle, Clock
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay } from '@/components/game-result-overlay';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG ---
const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5' },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '×10' },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '×5' },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '×45' },
  { id: 'timer', emoji: '', multiplier: 0, label: '' }, // Middle Slot
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '×25' },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '×5' },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15' },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5' },
];

const CHIPS = [
  { value: 500, label: '500', color: 'bg-emerald-500' },
  { value: 5000, label: '5,000', color: 'bg-rose-500' },
  { value: 50000, label: '50,000', color: 'bg-red-600' },
  { value: 500000, label: '500,000', color: 'bg-red-800' },
];

export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 // States
 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(500);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['apple', 'grapes', 'lemon']);
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 
 // Winner Result States
 const [winners, setWinners] = useState<any[]>([]);
 const [winningSymbol, setWinningSymbol] = useState<string>('');
 const [totalWinAmount, setTotalWinAmount] = useState(0);

 // Loading screen
 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1200);
  return () => clearTimeout(timer);
 }, []);

 // Timer Logic
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

 // --- CORE LOGIC: COIN CUTTING ---
 const handlePlaceBet = (id: string) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser || !userProfile) return;

  // Check if user has enough coins
  const currentBalance = userProfile.wallet?.coins || 0;
  if (currentBalance < selectedChip) {
   toast({ title: 'Insufficient Coins!', variant: 'destructive' });
   return;
  }

  // 1. Cut Coins from Database Immediately
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 
    'wallet.coins': increment(-selectedChip) 
  });

  // 2. Update UI
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 // --- CORE LOGIC: SPINNING ---
 const startSpin = () => {
  setGameState('spinning');
  const validItems = ITEMS.filter(i => i.id !== 'timer');
  const winningItem = validItems[Math.floor(Math.random() * validItems.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winningItem.id);
  
  const spinSequence = [0, 1, 2, 5, 8, 7, 6, 3]; // Clockwise outer border
  let currentStep = 0;
  const totalSteps = (spinSequence.length * 4) + spinSequence.indexOf(targetIdx);
  let speed = 60;

  const runAnimation = () => {
   setHighlightIdx(spinSequence[currentStep % spinSequence.length]);
   currentStep++;
   
   if (currentStep < totalSteps) {
    if (totalSteps - currentStep < 10) speed += 40; // Slow down at end
    setTimeout(runAnimation, speed);
   } else {
    setTimeout(() => finalizeResult(winningItem), 800);
   }
  };
  runAnimation();
 };

 // --- CORE LOGIC: WINNER CALCULATION ---
 const finalizeResult = (winItem: any) => {
  const betOnThis = myBets[winItem.id] || 0;
  const winAmount = betOnThis * winItem.multiplier;

  setWinningSymbol(winItem.emoji);
  setTotalWinAmount(winAmount);
  setHistory(prev => [winItem.id, ...prev].slice(0, 10));

  // Winners List for Overlay
  const currentWinners = [];
  if (winAmount > 0 && userProfile) {
    currentWinners.push({
      name: userProfile.username || 'You',
      win: winAmount,
      avatar: userProfile.avatarUrl,
      isMe: true
    });
    
    // Add Winnings to Database
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 
      'wallet.coins': increment(winAmount),
      updatedAt: serverTimestamp()
    });
  }
  
  setWinners(currentWinners);
  setGameState('result'); // Shows Winner Page/Overlay

  // Reset for next round
  setTimeout(() => {
   setMyBets({});
   setHighlightIdx(null);
   setGameState('betting');
   setTimeLeft(30);
  }, 5000);
 };

 if (isLaunching) return <div className="h-full w-full bg-[#1a0b2e] flex items-center justify-center text-yellow-400 font-bold">LOADING FRUIT PARTY...</div>;

 return (
  <div className="flex flex-col h-[100dvh] w-full bg-[#2a1a0a] overflow-hidden text-white">
   
   {/* --- WINNER OVERLAY (Automatic) --- */}
   <AnimatePresence>
    {gameState === 'result' && (
      <div className="fixed inset-0 z-[200]">
        <GameResultOverlay 
          gameId="fruit-party" 
          winningSymbol={winningSymbol} 
          winAmount={totalWinAmount} 
          winners={winners} 
        />
      </div>
    )}
   </AnimatePresence>

   {/* --- HEADER --- */}
   <header className="bg-gradient-to-b from-[#8b5e34] to-[#4e342e] p-3 border-b-2 border-yellow-600 flex items-center justify-between shadow-2xl">
    <button onClick={() => setIsMuted(!isMuted)} className="bg-black/40 p-2 rounded-md border border-yellow-500/50">
      {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
    </button>
    <div className="bg-black/40 px-6 py-1 rounded-full border border-yellow-500/50">
      <span className="text-xs font-bold text-yellow-100 italic uppercase">Fruit Party</span>
    </div>
    <button onClick={onClose} className="bg-red-600/80 p-2 rounded-md border border-white/20"><X size={18}/></button>
   </header>

   {/* --- GRID GAME AREA --- */}
   <main className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#4e342e] to-[#1a0b2e]">
      <div className="bg-[#5d1a4a] p-3 rounded-2xl border-4 border-[#c19a4a] shadow-2xl relative">
        <div className="grid grid-cols-3 gap-2">
          {ITEMS.map((item, idx) => {
            if (item.id === 'timer') {
              return (
                <div key="timer" className="w-24 h-24 bg-black/60 rounded-xl flex items-center justify-center border-2 border-yellow-500/30">
                  <div className="text-center">
                    <div className="text-3xl font-black text-yellow-400">
                      {gameState === 'betting' ? timeLeft : 'SPIN'}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handlePlaceBet(item.id)}
                disabled={gameState !== 'betting'}
                className={cn(
                  "relative w-24 h-24 rounded-xl flex flex-col items-center justify-center transition-all",
                  "bg-gradient-to-br from-[#a344a3] to-[#4a1a4a] border-2 border-white/20 shadow-inner",
                  highlightIdx === idx && "ring-4 ring-yellow-400 scale-105 z-10 brightness-125 shadow-[0_0_25px_gold]"
                )}
              >
                <span className="text-4xl mb-1 drop-shadow-md">{item.emoji}</span>
                <span className="text-[10px] font-black text-yellow-200">{item.label}</span>
                
                {/* Visual Bet Indicator */}
                {myBets[item.id] > 0 && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[8px] font-black px-1 rounded-sm">
                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'K' : myBets[item.id]}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Bar */}
      <div className="mt-6 flex gap-2 bg-black/40 p-2 rounded-full border border-white/10">
        {history.map((id, i) => (
          <span key={i} className="text-xl">{ITEMS.find(it => it.id === id)?.emoji}</span>
        ))}
      </div>
   </main>

   {/* --- FOOTER --- */}
   <footer className="bg-[#3d2a1a] p-6 pb-10 border-t-4 border-[#c19a4a] rounded-t-[2.5rem]">
    <div className="flex justify-between mb-6">
      <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-blue-400/30">
        <GoldCoinIcon className="h-4 w-4" />
        <span className="text-sm font-black text-yellow-400">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <button className="text-[10px] font-black uppercase text-white/50 border border-white/10 px-4 rounded-xl">Rules</button>
    </div>

    <div className="flex justify-between gap-2">
      {CHIPS.map(chip => (
        <button 
          key={chip.value} 
          onClick={() => setSelectedChip(chip.value)}
          className={cn(
            "flex-1 h-14 rounded-full flex items-center justify-center transition-all border-4 shadow-lg",
            chip.color,
            selectedChip === chip.value ? "border-white scale-110" : "border-black/30 opacity-60"
          )}
        >
          <span className="text-white font-black text-xs">{chip.label}</span>
        </button>
      ))}
    </div>
   </footer>
  </div>
 );
}
