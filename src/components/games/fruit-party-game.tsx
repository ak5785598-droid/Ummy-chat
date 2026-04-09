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
  <svg className="absolute w-[350px] h-[350px] pointer-events-none overflow-visible">
    <g transform="translate(175, 175)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle}>
          <line
            x1="0" y1="0"
            x2={130 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={130 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="#78350f"
            strokeWidth="12"
            strokeLinecap="round"
            className="opacity-40"
          />
          <line
            x1="0" y1="0"
            x2={125 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={125 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="url(#spokeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
      ))}
      <defs>
        <linearGradient id="spokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
      </defs>
    </g>
  </svg>
);

// --- ANIMATED CLOUDS ---
const SkyBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
    {[1, 2, 3].map((_, i) => (
      <motion.div
        key={i}
        initial={{ x: -200 }}
        animate={{ x: '100vw' }}
        transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear", delay: i * 2 }}
        className="absolute w-40 h-12 bg-white rounded-full blur-2xl"
        style={{ top: `${10 + i * 15}%` }}
      />
    ))}
  </div>
);

// --- CENTER UI ---
const BettingCenterUI = ({ timeLeft, gameState }: { timeLeft: number; gameState: string }) => (
  <div className="relative flex items-center justify-center z-50">
    <div className="w-28 h-28 rounded-full border-4 border-yellow-400 bg-red-600 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(254,240,137,0.5)]">
      <div className="flex-1 w-full bg-red-700 flex items-center justify-center relative border-b-2 border-yellow-500/40">
        <span className="text-xl absolute -translate-x-3 -translate-y-1 z-10">🥬</span>
        <span className="text-xl absolute translate-x-3 -translate-y-1 z-20">🍓</span>
        <span className="text-xl absolute -translate-x-1 translate-y-2 z-30">🍖</span>
        <span className="text-xl absolute translate-x-1 translate-y-2 z-40">🍋</span>
      </div>
      <div className="flex-[0.8] w-full flex flex-col items-center justify-center bg-red-600">
        <p className="text-[24px] font-black text-white leading-none drop-shadow-md">
          {gameState === 'betting' ? `${timeLeft}s` : '...'}
        </p>
        <p className="text-[8px] uppercase font-bold text-yellow-200">Wait</p>
      </div>
    </div>
  </div>
);

const ITEMS = [
  { id: 'apple', icon: '🍎', multiplier: 5, index: 0 },
  { id: 'lemon', icon: '🍋', multiplier: 5, index: 1 },
  { id: 'strawberry', icon: '🍓', multiplier: 5, index: 2 },
  { id: 'mango', icon: '🥭', multiplier: 5, index: 3 },
  { id: 'fish', icon: '🍢', multiplier: 10, index: 4 },
  { id: 'burger', icon: '🍔', multiplier: 15, index: 5 },
  { id: 'pizza', icon: '🍕', multiplier: 25, index: 6 },
  { id: 'chicken', icon: '🍗', multiplier: 45, index: 7 },
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

  // Timer & Hand Pointer Movement Logic
  useEffect(() => {
    if (gameState !== 'betting') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { startSpin(); return 0; }
        return prev - 1;
      });
    }, 1000);

    // Hand moves every 2 seconds
    const handInterval = setInterval(() => {
      setPointerTargetIdx(Math.floor(Math.random() * 8));
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[82vh] w-full bg-[#0f172a] rounded-t-[3rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        style={{ backgroundImage: 'linear-gradient(to bottom, #1e3a8a, #0f172a)' }}
      >
        <SkyBackground />

        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-yellow-500 text-blue-950 px-4 py-1 rounded-full font-black shadow-[0_4px_0_#854d0e] flex items-center gap-2">
            <span className="text-xl">🪙</span> {localCoins.toLocaleString()}
          </div>
          <div className="flex gap-4 items-center text-white/70">
            <HelpCircle className="w-6 h-6" />
            <X className="w-8 h-8 cursor-pointer" onClick={onClose} />
          </div>
        </div>

        {/* Board Area */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          <FerrisWheelSpokes />
          <BettingCenterUI timeLeft={timeLeft} gameState={gameState} />

          {/* 3D Hand Pointer */}
          <AnimatePresence>
            {gameState === 'betting' && (
              <motion.div
                key="hand-pointer"
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                animate={{
                  x: Math.cos(((pointerTargetIdx * 45) - 90) * Math.PI / 180) * 140,
                  y: Math.sin(((pointerTargetIdx * 45) - 90) * Math.PI / 180) * 140,
                }}
                className="absolute z-[60] pointer-events-none"
              >
                <motion.div 
                   animate={{ scale: [1, 0.9, 1] }} 
                   transition={{ repeat: Infinity, duration: 0.5 }}
                   className="text-5xl drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
                >
                  👆
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const radius = 135;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-22 h-22 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
                    "border-yellow-600 shadow-[0_5px_15px_rgba(0,0,0,0.4)]",
                    "bg-[radial-gradient(circle_at_30%_30%,#fde047,#eab308,#854d0e)]",
                    highlightIdx === idx ? "scale-115 border-white brightness-125 shadow-[0_0_30px_#fde047] z-20" : "hover:scale-105"
                  )}
                >
                  <div className="flex-1 w-full flex items-center justify-center bg-white/10">
                    <span className="text-3xl drop-shadow-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 w-full bg-black/20 flex items-center justify-center">
                    <span className="text-white font-black text-xs">×{item.multiplier}</span>
                  </div>
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                      {myBets[item.id] >= 1000 ? `${myBets[item.id]/1000}k` : myBets[item.id]}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Chips */}
        <div className="w-full bg-black/40 p-5 flex flex-col items-center gap-4 z-20 border-t border-yellow-500/20 backdrop-blur-md">
          <div className="flex gap-3 justify-center">
            {CHIPS_DATA.map(chip => (
              <button 
                key={chip.value}
                onClick={() => setSelectedChip(chip.value)}
                className={cn(
                  "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-[11px] font-black transition-all",
                  "bg-gradient-to-tr from-blue-700 to-indigo-500 shadow-[0_4px_0_#1e3a8a]",
                  selectedChip === chip.value ? "scale-110 ring-4 ring-yellow-400 opacity-100" : "opacity-60 shadow-none"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result UI */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-300 to-orange-600 p-10 rounded-3xl border-8 border-white flex flex-col items-center shadow-2xl">
                <Trophy className="w-16 h-16 text-white mb-4" />
                <span className="text-7xl mb-4">{winnerData.icon}</span>
                <h2 className="text-white font-black text-4xl italic">WINNER!</h2>
                <p className="text-white text-3xl font-black mt-2">+{winnerData.win.toLocaleString()}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
