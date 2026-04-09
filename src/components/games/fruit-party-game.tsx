'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Clock, HelpCircle, Loader2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- 3D ELEPHANT MASCOT ---
const Elephant3D = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
    <defs>
      <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#c3e4f7" />
        <stop offset="100%" stopColor="#5da9e1" />
      </radialGradient>
      <radialGradient id="earGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbcfe8" />
        <stop offset="100%" stopColor="#f472b6" />
      </radialGradient>
    </defs>
    {/* Ears */}
    <ellipse cx="25" cy="45" rx="18" ry="22" fill="url(#bodyGrad)" />
    <ellipse cx="75" cy="45" rx="18" ry="22" fill="url(#bodyGrad)" />
    <ellipse cx="25" cy="45" rx="10" ry="14" fill="url(#earGrad)" />
    <ellipse cx="75" cy="45" rx="10" ry="14" fill="url(#earGrad)" />
    {/* Body/Head */}
    <circle cx="50" cy="55" r="32" fill="url(#bodyGrad)" />
    {/* Eyes & Brows */}
    <path d="M38 38 Q42 35 46 38" stroke="#333" strokeWidth="2" fill="none" />
    <path d="M54 38 Q58 35 62 38" stroke="#333" strokeWidth="2" fill="none" />
    <circle cx="42" cy="45" r="4" fill="white" />
    <circle cx="42" cy="45" r="2" fill="black" />
    <circle cx="58" cy="45" r="4" fill="white" />
    <circle cx="58" cy="45" r="2" fill="black" />
    {/* Nose (Trunk) */}
    <path d="M50 55 Q50 85 40 85" fill="none" stroke="url(#bodyGrad)" strokeWidth="10" strokeLinecap="round" />
    {/* Hands */}
    <circle cx="30" cy="65" r="6" fill="url(#bodyGrad)" />
    <circle cx="70" cy="65" r="6" fill="url(#bodyGrad)" />
  </svg>
);

const ITEMS = [
  { id: 'apple', icon: '🍎', multiplier: 5, color: 'bg-yellow-400', index: 0 },
  { id: 'mango', icon: '🥭', multiplier: 5, color: 'bg-yellow-400', index: 1 },
  { id: 'lemon', icon: '🍋', multiplier: 5, color: 'bg-yellow-400', index: 2 },
  { id: 'strawberry', icon: '🍓', multiplier: 5, color: 'bg-yellow-400', index: 3 },
  { id: 'fish', icon: '🍢', multiplier: 10, color: 'bg-yellow-400', index: 4 },
  { id: 'burger', icon: '🍕', multiplier: 15, color: 'bg-yellow-400', index: 5 },
  { id: 'pizza', icon: '🌯', multiplier: 25, color: 'bg-yellow-400', index: 6 },
  { id: 'chicken', icon: '🍖', multiplier: 45, color: 'bg-yellow-400', index: 7 },
];

const CHIPS_DATA = [
  { value: 10, label: '10' },
  { value: 100, label: '100' },
  { value: 1000, label: '1K' },
  { value: 5000, label: '5K' },
  { value: 10000, label: '10K' },
  { value: 50000, label: '50K' },
];

export default function CarnivalFoodParty({ onClose }: { onClose?: () => void }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(1000);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);

  useEffect(() => {
    if (userProfile?.wallet?.coins) setLocalCoins(userProfile.wallet.coins);
  }, [userProfile]);

  useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { startSpin(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || localCoins < selectedChip) return;
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
    setLocalCoins(prev => prev - selectedChip);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(-selectedChip) });
  };

  const startSpin = () => {
    setGameState('spinning');
    const winItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    let currentStep = 0;
    const totalSteps = 40 + winItem.index;

    const run = () => {
      setHighlightIdx(currentStep % 8);
      if (currentStep < totalSteps) {
        currentStep++;
        setTimeout(run, 50 + (currentStep * 2));
      } else {
        setTimeout(() => finalizeResult(winItem), 1000);
      }
    };
    run();
  };

  const finalizeResult = (winItem: any) => {
    const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
    if (winAmount > 0) {
      setLocalCoins(prev => prev + winAmount);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(winAmount) });
    }
    setWinnerData({ ...winItem, win: winAmount });
    setGameState('result');
    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinnerData(null);
      setHighlightIdx(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col justify-end z-[100]">
      {/* GAME CONTAINER (Half Screen Bottom Sheet) */}
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[80vh] w-full bg-[#30106b] rounded-t-[3rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center"
        style={{ backgroundImage: 'radial-gradient(circle at top, #4a148c 0%, #1a0633 100%)' }}
      >
        {/* Carnival Decorative Background Elements */}
        <div className="absolute top-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 border-4 border-yellow-500 rounded-full animate-pulse" />
          <div className="absolute top-40 right-10 w-12 h-12 border-4 border-pink-500 rounded-full animate-bounce" />
        </div>

        {/* Top Header */}
        <div className="w-full p-6 flex justify-between items-center z-10">
          <div className="bg-yellow-500 text-blue-900 px-4 py-1 rounded-full font-black shadow-lg">
            🪙 {localCoins.toLocaleString()}
          </div>
          <div className="flex gap-4 items-center">
            <HelpCircle className="w-6 h-6" />
            <X className="w-8 h-8 cursor-pointer" onClick={onClose} />
          </div>
        </div>

        {/* Main Wheel Area */}
        <div className="relative w-full flex-1 flex items-center justify-center scale-90 sm:scale-100">
          {/* Elephant Center */}
          <div className="z-50 relative flex flex-col items-center">
            <div className="w-36 h-36 rounded-full bg-gradient-to-b from-red-600 to-red-800 border-4 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.5)] flex flex-col items-center justify-center overflow-hidden">
               <Elephant3D />
               <div className="absolute bottom-0 w-full bg-black/40 py-1 text-center">
                  <p className="text-[10px] text-yellow-300 font-bold">BET TIME</p>
                  <p className="text-xl font-black text-white leading-none">{gameState === 'betting' ? timeLeft : '...'}</p>
               </div>
            </div>
          </div>

          {/* Golden Circle Items */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const radius = 140;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div key={item.id} className="absolute" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 shadow-xl",
                    "border-yellow-600 bg-yellow-400",
                    highlightIdx === idx ? "scale-125 border-white brightness-125 shadow-[0_0_40px_white] z-50" : "hover:scale-105"
                  )}
                >
                  <span className="text-3xl drop-shadow-md">{item.icon}</span>
                  <span className="text-white font-black text-xs drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    X{item.multiplier}
                  </span>
                  {myBets[item.id] > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center border-2 border-white">
                      {myBets[item.id] >= 1000 ? `${myBets[item.id]/1000}k` : myBets[item.id]}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer: Chips */}
        <div className="w-full bg-black/20 p-6 flex flex-col items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full justify-center">
            {CHIPS_DATA.map(chip => (
              <button 
                key={chip.value}
                onClick={() => setSelectedChip(chip.value)}
                className={cn(
                  "min-w-[55px] h-14 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black transition-all",
                  "bg-gradient-to-tr from-blue-600 to-indigo-400",
                  selectedChip === chip.value ? "scale-110 ring-4 ring-yellow-400 shadow-lg" : "opacity-70"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-10 rounded-full border-8 border-white flex flex-col items-center shadow-[0_0_50px_#fbbf24]">
                <Trophy className="w-16 h-16 text-white mb-2" />
                <span className="text-6xl mb-2">{winnerData.icon}</span>
                <h2 className="text-white font-black text-4xl italic">WIN!</h2>
                <p className="text-white text-3xl font-black">+{winnerData.win}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
