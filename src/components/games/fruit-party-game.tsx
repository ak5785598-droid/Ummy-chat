'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, HelpCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- REALISTIC 3D YELLOW SPOKES ---
const FerrisWheelSpokes = () => (
  <svg className="absolute w-[400px] h-[400px] pointer-events-none overflow-visible">
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="translate(200, 200)">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <line
          key={angle}
          x1="0" y1="0"
          x2={140 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={140 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="url(#goldGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#glow)"
          className="opacity-90"
        />
      ))}
    </g>
  </svg>
);

// --- SVG WHITE 3D HAND POINTER ---
const White3DHand = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
    <path 
      d="M7 10.5V6.5C7 5.11929 8.11929 4 9.5 4V4C10.8807 4 12 5.11929 12 6.5V10.5M7 10.5C7 11.8807 8.11929 13 9.5 13V13C10.8807 13 12 11.8807 12 10.5M7 10.5H6.5C4.567 10.5 3 12.067 3 14V16C3 18.7614 5.23858 21 8 21H14C17.3137 21 20 18.3137 20 15V11.5C20 10.1193 18.8807 9 17.5 9V9C16.1193 9 15 10.1193 15 11.5V10.5C15 9.11929 13.8807 8 12.5 8V8C11.1193 8 10 9.11929 10 10.5V10.5" 
      stroke="white" 
      strokeWidth="1.5" 
      fill="white"
    />
    <path d="M12 4V2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ITEMS = [
  { id: 'apple', icon: '🍎', multiplier: 5 },
  { id: 'broccoli', icon: '🥦', multiplier: 5 },
  { id: 'lettuce', icon: '🥬', multiplier: 5 },
  { id: 'burrito', icon: '🌯', multiplier: 15 },
  { id: 'grapes', icon: '🍇', multiplier: 5 },
  { id: 'coconut', icon: '🥥', multiplier: 10 },
  { id: 'watermelon', icon: '🍉', multiplier: 10 },
  { id: 'chicken', icon: '🍗', multiplier: 45 },
  { id: 'pizza', icon: '🍕', multiplier: 25 },
  { id: 'burger', icon: '🍔', multiplier: 15 },
  { id: 'mango', icon: '🥭', multiplier: 5 },
  { id: 'strawberry', icon: '🍓', multiplier: 5 },
];

const CHIPS_DATA = [
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
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [pointerTargetIdx, setPointerTargetIdx] = useState(0);

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

    const handInterval = setInterval(() => {
      setPointerTargetIdx(Math.floor(Math.random() * ITEMS.length));
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(handInterval);
    };
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
    const totalSteps = 60 + ITEMS.indexOf(winItem);

    const run = () => {
      setHighlightIdx(currentStep % ITEMS.length);
      if (currentStep < totalSteps) {
        currentStep++;
        setTimeout(run, 40 + (currentStep * 1.5));
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
    <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#020617] rounded-t-[3.5rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center"
        style={{ backgroundImage: 'radial-gradient(circle at top, #1e3a8a, #020617)' }}
      >
        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-blue-950 px-5 py-1.5 rounded-full font-black shadow-[0_4px_10px_rgba(234,179,8,0.4)] flex items-center gap-2">
            <span className="text-xl">🪙</span> {localCoins.toLocaleString()}
          </div>
          <div className="flex gap-4 items-center">
            <HelpCircle className="w-6 h-6 text-white/50" />
            <X className="w-8 h-8 text-white cursor-pointer hover:rotate-90 transition-transform" onClick={onClose} />
          </div>
        </div>

        {/* Board Area */}
        <div className="relative w-full flex-1 flex items-center justify-center scale-90 sm:scale-100">
          <FerrisWheelSpokes />
          
          {/* Center Betting UI */}
          <div className="relative z-50">
            <div className="w-32 h-32 rounded-full border-8 border-yellow-500 bg-red-600 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.6)]">
              <div className="flex gap-1 text-lg mb-1">🥦🍇🥥🍋🥬</div>
              <p className="text-3xl font-black text-white leading-none">
                {gameState === 'betting' ? `${timeLeft}s` : 'Wait'}
              </p>
              <div className="flex gap-1 text-lg mt-1">🍇🍉🍓🥥</div>
            </div>
          </div>

          {/* SVG Hand Pointer */}
          <AnimatePresence>
            {gameState === 'betting' && (
              <motion.div
                key="hand"
                transition={{ type: "spring", stiffness: 80, damping: 12 }}
                animate={{
                  x: Math.cos(((pointerTargetIdx * (360/ITEMS.length)) - 90) * Math.PI / 180) * 150,
                  y: Math.sin(((pointerTargetIdx * (360/ITEMS.length)) - 90) * Math.PI / 180) * 150,
                }}
                className="absolute z-[60] pointer-events-none"
              >
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <White3DHand />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fruit Circles */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * (360 / ITEMS.length)) - 90;
            const radius = 155;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
                    "border-orange-500 bg-gradient-to-b from-yellow-300 via-yellow-400 to-orange-500 shadow-xl",
                    highlightIdx === idx ? "scale-125 border-white ring-4 ring-yellow-300 brightness-110 z-20" : "hover:scale-105"
                  )}
                >
                  <div className="flex-[1.2] w-full flex items-center justify-center pt-1">
                    <span className="text-3xl drop-shadow-md">{item.icon}</span>
                  </div>
                  <div className="flex-1 w-full bg-black/30 flex items-center justify-center">
                    <span className="text-white font-black text-[10px]">×{item.multiplier}</span>
                  </div>
                  {myBets[item.id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-white text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg border-2 border-red-600 animate-bounce">
                      {myBets[item.id] >= 1000 ? `${myBets[item.id]/1000}K` : myBets[item.id]}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Chips Footer */}
        <div className="w-full bg-white/5 backdrop-blur-xl p-6 flex justify-center gap-3 z-20 border-t border-white/10">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-xs font-black transition-all",
                "bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-lg",
                selectedChip === chip.value ? "scale-110 ring-4 ring-yellow-400 opacity-100" : "opacity-40"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Win Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80">
              <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} className="bg-gradient-to-b from-yellow-300 to-orange-600 p-12 rounded-[3rem] border-8 border-white text-center shadow-[0_0_100px_rgba(234,179,8,0.5)]">
                <Trophy className="w-20 h-20 text-white mx-auto mb-4" />
                <span className="text-8xl block mb-4">{winnerData.icon}</span>
                <h2 className="text-white font-black text-5xl italic tracking-tighter">BIG WIN!</h2>
                <div className="mt-4 bg-white/20 py-2 px-8 rounded-full">
                  <p className="text-yellow-100 text-4xl font-black">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
