'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, HelpCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- YELLOW SPOKES ---
const FerrisWheelSpokes = () => (
  <svg className="absolute w-[450px] h-[450px] pointer-events-none opacity-60">
    <g transform="translate(225, 225)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="0" y1="0"
          x2={180 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={180 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#eab308"
          strokeWidth="10"
          strokeLinecap="round"
        />
      ))}
    </g>
  </svg>
);

// --- ANIMATED CLOUDS ---
const SkyBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
    {[
      { top: '10%', left: '-10%', delay: 0, duration: 25 },
      { top: '25%', left: '-20%', delay: 5, duration: 30 },
      { top: '15%', left: '100%', delay: 2, duration: 28 },
    ].map((cloud, i) => (
      <motion.div
        key={i}
        initial={{ x: cloud.left }}
        animate={{ x: i === 2 ? '-120%' : '120vw' }}
        transition={{ duration: cloud.duration, repeat: Infinity, delay: cloud.delay, ease: "linear" }}
        className="absolute w-32 h-12 bg-white rounded-full blur-xl"
        style={{ top: cloud.top }}
      />
    ))}
  </div>
);

// --- CENTER UI ---
const BettingCenterUI = ({ timeLeft, gameState }: { timeLeft: number; gameState: string }) => (
  <div className="relative flex items-center justify-center z-50">
    <div className="w-32 h-32 rounded-full border-4 border-yellow-500 bg-red-600 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
      <div className="flex-1 w-full bg-red-700 flex items-center justify-center gap-1 border-b-2 border-yellow-500/50">
        <span className="text-2xl">🥦</span>
        <span className="text-2xl">🥬</span>
      </div>
      <div className="flex-1 w-full flex flex-col items-center justify-center bg-red-600">
        <p className="text-[10px] uppercase font-bold text-white/80 tracking-tighter">Bet Time</p>
        <p className="text-2xl font-black text-white leading-none">
          {gameState === 'betting' ? `${timeLeft}s` : '...'}
        </p>
      </div>
    </div>
    <div className="absolute inset-[-8px] border-2 border-dashed border-yellow-400/30 rounded-full animate-[spin_20s_linear_infinite]" />
  </div>
);

const ITEMS = [
  { id: 'apple', icon: '🍎', multiplier: 5, index: 0 },
  { id: 'lemon', icon: '🍇', multiplier: 5, index: 1 },
  { id: 'strawberry', icon: '🍓', multiplier: 5, index: 2 },
  { id: 'mango', icon: '🥭', multiplier: 5, index: 3 },
  { id: 'fish', icon: '🍉', multiplier: 10, index: 4 },
  { id: 'burger', icon: '🌯', multiplier: 15, index: 5 },
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex flex-col justify-end z-[100]">
      {/* Tap outside to close area */}
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#1e3a8a] rounded-t-[3rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center"
        style={{ backgroundImage: 'linear-gradient(to bottom, #1e3a8a, #1e40af)' }}
      >
        <SkyBackground />

        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-yellow-500 text-blue-900 px-4 py-1 rounded-full font-black shadow-lg">
            🪙 {localCoins.toLocaleString()}
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

          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const radius = 180;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl",
                    "border-yellow-600 bg-yellow-400",
                    highlightIdx === idx ? "scale-110 border-white brightness-125 shadow-[0_0_40px_white] z-20" : "hover:scale-105"
                  )}
                >
                  <span className="text-4xl drop-shadow-sm">{item.icon}</span>
                  <span className="text-white font-black text-sm drop-shadow-md">X{item.multiplier}</span>
                  {myBets[item.id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                      {myBets[item.id] >= 1000 ? `${myBets[item.id]/1000}k` : myBets[item.id]}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Chips */}
        <div className="w-full bg-black/30 p-6 flex flex-col items-center gap-4 z-20 border-t border-white/10">
          <div className="flex gap-3 justify-center">
            {CHIPS_DATA.map(chip => (
              <button 
                key={chip.value}
                onClick={() => setSelectedChip(chip.value)}
                className={cn(
                  "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black transition-all",
                  "bg-gradient-to-tr from-blue-600 to-indigo-400 shadow-lg",
                  selectedChip === chip.value ? "scale-110 ring-4 ring-yellow-400 opacity-100" : "opacity-60"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Win Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-12 rounded-full border-8 border-white flex flex-col items-center shadow-2xl">
                <Trophy className="w-16 h-16 text-white mb-2" />
                <span className="text-7xl mb-2">{winnerData.icon}</span>
                <h2 className="text-white font-black text-4xl italic uppercase">Win!</h2>
                <p className="text-white text-3xl font-black">+{winnerData.win}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
