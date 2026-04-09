'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- HAND POINTER COMPONENT ---
const HandPointer = ({ targetIdx }: { targetIdx: number }) => {
  // 8 positions for the fruits (45 degree intervals)
  const angle = (targetIdx * 45) - 90;
  const x = Math.cos((angle * Math.PI) / 180) * 145;
  const y = Math.sin((angle * Math.PI) / 180) * 145;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: [1, 0.8, 1], 
        x: x, 
        y: y - 20 // Offset to stay above the fruit
      }}
      transition={{ 
        x: { type: "spring", stiffness: 100, damping: 10 },
        y: { type: "spring", stiffness: 100, damping: 10 },
        scale: { duration: 1, repeat: Infinity }
      }}
      className="absolute z-[100] pointer-events-none"
    >
      <svg width="45" height="45" viewBox="0 0 24 24" fill="none" className="drop-shadow-2xl">
        <path 
          d="M9 10V5C9 3.89543 9.89543 3 11 3C12.1046 3 13 3.89543 13 5V11M13 11V9C13 7.89543 13.8954 7 15 7C16.1046 7 17 7.89543 17 9V11M17 11V10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10V16C21 18.7614 18.7614 21 16 21H10C7.23858 21 5 18.7614 5 16V13.6742C5 12.5632 5.76016 11.597 6.84534 11.3558L9 10.877" 
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#3b82f6"
        />
        <circle cx="9" cy="5" r="3" fill="white" opacity="0.6" className="animate-pulse" />
      </svg>
    </motion.div>
  );
};

// --- SPOKES ---
const FerrisWheelSpokes = () => (
  <svg className="absolute w-[350px] h-[350px] pointer-events-none overflow-visible">
    <g transform="translate(175, 175)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="0" y1="0"
          x2={145 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={145 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#eab308" strokeWidth="8" strokeLinecap="round"
        />
      ))}
    </g>
  </svg>
);

const ITEMS = [
  { id: 'broccoli', icon: '🥦', multiplier: 15 },
  { id: 'lettuce', icon: '🥬', multiplier: 25 },
  { id: 'carrot', icon: '🥕', multiplier: 45 },
  { id: 'corn', icon: '🌽', multiplier: 10 },
  { id: 'tomato', icon: '🍅', multiplier: 5 },
  { id: 'coconut', icon: '🥥', multiplier: 5 },
  { id: 'grapes', icon: '🍇', multiplier: 5 },
  { id: 'orange', icon: '🍊', multiplier: 5 },
];

const HUB_ICONS = ['🥦', '🥬', '🥕', '🌽', '🍅', '🥥', '🍇', '🍊'];

const CHIPS_DATA = [
  { value: 100, label: '100', color: 'from-blue-500 to-blue-700' },
  { value: 1000, label: '1K', color: 'from-green-500 to-green-700' },
  { value: 5000, label: '5K', color: 'from-purple-500 to-purple-700' },
  { value: 10000, label: '10K', color: 'from-red-500 to-red-700' },
  { value: 50000, label: '50K', color: 'from-yellow-500 to-yellow-700' },
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
  
  // Hand Pointer Index
  const [pointerIdx, setPointerIdx] = useState(0);

  useEffect(() => {
    if (userProfile?.wallet?.coins) setLocalCoins(userProfile.wallet.coins);
  }, [userProfile]);

  // Logic for Hand Pointer movement (Every 2 seconds during betting)
  useEffect(() => {
    if (gameState !== 'betting') return;
    const pointerInterval = setInterval(() => {
      setPointerIdx(prev => (prev + 1) % ITEMS.length);
    }, 2000);
    return () => clearInterval(pointerInterval);
  }, [gameState]);

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
    const totalSteps = 40 + ITEMS.indexOf(winItem);

    const run = () => {
      setHighlightIdx(currentStep % ITEMS.length);
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
      setPointerIdx(0);
    }, 4500);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#020617] rounded-t-[3.5rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center shadow-2xl"
        style={{ backgroundImage: 'radial-gradient(circle at top, #1e3a8a, #020617)' }}
      >
        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-blue-950 px-5 py-1.5 rounded-full font-black shadow-lg flex items-center gap-2">
            <span className="text-xl">🪙</span> {localCoins.toLocaleString()}
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Game Arena */}
        <div className="relative w-full flex-1 flex items-center justify-center scale-95 -translate-y-4">
          <FerrisWheelSpokes />
          
          {/* Hand Pointer - Only visible during betting */}
          <AnimatePresence>
            {gameState === 'betting' && <HandPointer targetIdx={pointerIdx} />}
          </AnimatePresence>

          {/* Center Hub */}
          <div className="relative z-50">
            <div className="w-40 h-40 rounded-full border-[8px] border-yellow-500 bg-red-950 flex flex-col overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.5)]">
              <div className="flex-1 bg-red-900/60 relative flex items-center justify-center overflow-hidden border-b-4 border-yellow-500/50">
                <div className="relative w-full h-full">
                  {HUB_ICONS.map((icon, i) => (
                    <motion.span 
                      key={i} 
                      animate={{ x: [0, (i % 2 === 0 ? 5 : -5), 0], y: [0, (i < 4 ? -3 : 3), 0] }} 
                      transition={{ duration: 2 + (i * 0.2), repeat: Infinity }}
                      className="absolute text-xl"
                      style={{ left: `${15 + (i * 10)}%`, top: `${i < 4 ? 15 : 45}%`, zIndex: 10 + i }}
                    >
                      {icon}
                    </motion.span>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-red-600 flex items-center justify-center">
                <span className="text-6xl font-black text-white italic drop-shadow-xl">{gameState === 'betting' ? timeLeft : '...'}</span>
              </div>
            </div>
          </div>

          {/* Fruits */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 145;
            const y = Math.sin((angle * Math.PI) / 180) * 145;
            const betAmount = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-24 h-24 rounded-full border-[5px] flex flex-col overflow-hidden transition-all duration-200 shadow-2xl relative",
                    "border-yellow-500 bg-[#1e1b4b]",
                    highlightIdx === idx ? "scale-115 border-white ring-4 ring-yellow-400 z-30" : ""
                  )}
                >
                  <div className={cn("w-full bg-red-800 flex items-center justify-center transition-all", betAmount > 0 ? "h-8" : "flex-1")}>
                    <span className={cn("transition-all", betAmount > 0 ? "text-2xl" : "text-4xl")}>{item.icon}</span>
                  </div>
                  <AnimatePresence>
                    {betAmount > 0 && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="w-full bg-white flex items-center justify-center py-0.5 border-y border-blue-200">
                        <span className="text-[12px] font-black text-blue-900 whitespace-nowrap">🪙 {betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className={cn("w-full flex items-center justify-center bg-gradient-to-b from-orange-400 to-orange-600 border-t border-orange-300/30", betAmount > 0 ? "h-7" : "flex-[0.8]")}>
                    <span className="font-black text-[13px] text-white italic">×{item.multiplier}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Chips Footer */}
        <div className="w-full bg-gradient-to-b from-[#451a03] to-[#270c01] p-6 flex justify-center gap-3 z-20 border-t-4 border-yellow-600/50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full border-[3px] border-dashed border-white/40 flex items-center justify-center text-[10px] font-black transition-all relative overflow-hidden",
                "bg-gradient-to-br shadow-[0_6px_0_rgb(0,0,0,0.3),0_10px_20px_rgba(0,0,0,0.4)]",
                chip.color,
                selectedChip === chip.value ? "scale-110 -translate-y-2 ring-4 ring-yellow-400 border-solid opacity-100" : "opacity-70"
              )}
            >
              <div className="absolute inset-1.5 rounded-full border-2 border-white/20 bg-black/10 flex items-center justify-center">
                <span className="text-white drop-shadow-md">{chip.label}</span>
              </div>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
            </button>
          ))}
        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-10 rounded-[3rem] border-8 border-white text-center shadow-2xl">
                <Trophy className="w-16 h-16 text-white mx-auto mb-2" />
                <span className="text-8xl block mb-2">{winnerData.icon}</span>
                <h2 className="text-white font-black text-4xl italic tracking-tighter uppercase">WINNER!</h2>
                <div className="mt-4 bg-white/20 py-2 px-8 rounded-full">
                  <p className="text-white text-4xl font-black">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
