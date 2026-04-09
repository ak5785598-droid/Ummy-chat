'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Clock, HelpCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEW: SPOKES COMPONENT ---
// Draws the thick lines from center to each item like in the image
const FerrisWheelSpokes = () => (
  <svg className="absolute w-[400px] h-[400px] pointer-events-none opacity-40">
    <g transform="translate(200, 200)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="0" y1="0"
          x2={160 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={160 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#9333ea" // Deep purple spoke
          strokeWidth="12"
          strokeLinecap="round"
        />
      ))}
      {/* Thinner inner highlight for 3D line effect */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={`inner-${angle}`}
          x1="0" y1="0"
          x2={155 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={155 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#a855f7" // Lighter purple core
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
    </g>
  </svg>
);

// --- EXACT ELEPHANT MASCOT COMPONENT ---
const ElephantMascotUI = ({ timeLeft, gameState }: { timeLeft: number; gameState: string }) => (
  <div className="relative flex items-center justify-center z-50">
    <svg viewBox="0 0 100 100" className="w-44 h-44 drop-shadow-2xl">
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c3e4f7" />
          <stop offset="100%" stopColor="#5da9e1" />
        </radialGradient>
        <radialGradient id="earGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f472b6" />
        </radialGradient>
        <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF1A1A" />
          <stop offset="100%" stopColor="#990000" />
        </linearGradient>
      </defs>
      
      {/* Outer Glow Border */}
      <circle cx="50" cy="50" r="48" fill="#FFD700" />
      <g>
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map(angle => (
          <circle key={angle} cx={50 + 44 * Math.cos(angle * Math.PI / 180)} cy={50 + 44 * Math.sin(angle * Math.PI / 180)} r="2.5" fill="white" />
        ))}
      </g>
      
      <circle cx="50" cy="50" r="43.5" fill="url(#redGrad)"/>

      <clipPath id="elephantClip"><circle cx="50" cy="50" r="44" /></clipPath>
      
      <g clipPath="url(#elephantClip)" transform="translate(10, 5) scale(0.8)">
        <ellipse cx="25" cy="45" rx="18" ry="22" fill="url(#bodyGrad)" />
        <ellipse cx="75" cy="45" rx="18" ry="22" fill="url(#bodyGrad)" />
        <ellipse cx="25" cy="45" rx="10" ry="14" fill="url(#earGrad)" />
        <ellipse cx="75" cy="45" rx="10" ry="14" fill="url(#earGrad)" />
        <circle cx="50" cy="55" r="32" fill="url(#bodyGrad)" />
        <path d="M38 38 Q42 35 46 38" stroke="#333" strokeWidth="2" fill="none" />
        <path d="M54 38 Q58 35 62 38" stroke="#333" strokeWidth="2" fill="none" />
        <circle cx="42" cy="45" r="4" fill="white" /><circle cx="42" cy="45" r="2" fill="black" />
        <circle cx="58" cy="45" r="4" fill="white" /><circle cx="58" cy="45" r="2" fill="black" />
        <path d="M50 55 Q50 85 40 85" fill="none" stroke="url(#bodyGrad)" strokeWidth="10" strokeLinecap="round" />
        <circle cx="30" cy="65" r="6" fill="url(#bodyGrad)" />
        <circle cx="70" cy="65" r="6" fill="url(#bodyGrad)" />
        {/* Utensils */}
        <path d="M26 55 L26 70" stroke="#f2f2f2" strokeWidth="4" strokeLinecap="round" />
        <path d="M74 55 L74 70" stroke="#f2f2f2" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
    
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none">
      <p className="text-[10px] uppercase font-bold text-white/90 tracking-tighter shadow-black">Bet Time</p>
      <p className="text-[28px] font-black text-white leading-none drop-shadow-lg">
        {gameState === 'betting' ? `${timeLeft}s` : '...'}
      </p>
    </div>
  </div>
);

const ITEMS = [
  { id: 'apple', icon: '🍎', multiplier: 5, index: 0 },
  { id: 'lemon', icon: '🍉', multiplier: 5, index: 1 },
  { id: 'strawberry', icon: '🍓', multiplier: 5, index: 2 },
  { id: 'mango', icon: '🍇', multiplier: 5, index: 3 },
  { id: 'fish', icon: '🥥', multiplier: 10, index: 4 },
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
    <div className="fixed inset-0 bg-black/80 flex flex-col justify-end z-[100]">
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#1a0633] rounded-t-[3rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center"
      >
        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-yellow-500 text-blue-900 px-4 py-1 rounded-full font-black shadow-lg">
            🪙 {localCoins.toLocaleString()}
          </div>
          <div className="flex gap-4 items-center text-white/50">
            <HelpCircle className="w-6 h-6" />
            <X className="w-8 h-8 cursor-pointer" onClick={onClose} />
          </div>
        </div>

        {/* Center Game Board */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          {/* THE SPOKES (Moti lines connecting everything) */}
          <FerrisWheelSpokes />

          {/* Elephant Center */}
          <ElephantMascotUI timeLeft={timeLeft} gameState={gameState} />

          {/* Food Items */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const radius = 160;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 shadow-xl",
                    "border-yellow-600 bg-yellow-400",
                    highlightIdx === idx ? "scale-125 border-white brightness-125 shadow-[0_0_30px_white] z-20" : "hover:scale-105"
                  )}
                >
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-white font-black text-xs drop-shadow-md">X{item.multiplier}</span>
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

        {/* Chips Footer */}
        <div className="w-full bg-black/40 p-6 flex flex-col items-center gap-4">
          <div className="flex gap-3 justify-center">
            {CHIPS_DATA.map(chip => (
              <button 
                key={chip.value}
                onClick={() => setSelectedChip(chip.value)}
                className={cn(
                  "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black transition-all",
                  "bg-gradient-to-tr from-blue-600 to-indigo-400",
                  selectedChip === chip.value ? "scale-110 ring-4 ring-yellow-400" : "opacity-60"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-12 rounded-full border-8 border-white flex flex-col items-center shadow-2xl">
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
