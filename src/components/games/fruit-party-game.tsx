'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, HelpCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- REALISTIC 3D YELLOW GOLD SPOKES ---
const FerrisWheelSpokes = () => (
  <svg className="absolute w-[450px] h-[450px] pointer-events-none overflow-visible">
    <defs>
      <linearGradient id="gold3D" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
      <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="2" dy="2" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="translate(225, 225)" filter="url(#shadow3D)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="0" y1="0"
          x2={165 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={165 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="url(#gold3D)"
          strokeWidth="10"
          strokeLinecap="round"
        />
      ))}
    </g>
  </svg>
);

// --- 3D WHITE HAND POINTER ---
const RealisticHandPointer = () => (
  <svg width="75" height="75" viewBox="0 0 100 100" fill="none" className="drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
    <path 
      d="M35 45 C 35 35, 45 35, 45 45 L 45 75 C 45 85, 80 85, 80 70 L 80 55 C 80 45, 70 40, 65 40 L 65 45 M 35 45 L 35 25 C 35 15, 45 15, 45 25 L 45 45 M 35 45 L 35 15 C 35 5, 45 5, 45 15 L 45 45" 
      fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5"
    />
    <path d="M35 45 Q 60 45 80 55 Q 80 85 55 85 Q 35 85 35 65 Z" fill="#f8fafc" />
  </svg>
);

const ITEMS = [
  { id: 'tomato', icon: '🍅', multiplier: 5 },
  { id: 'corn', icon: '🌽', multiplier: 5 },
  { id: 'grapes', icon: '🍇', multiplier: 5 },
  { id: 'orange', icon: '🍊', multiplier: 5 },
  { id: 'coconut', icon: '🥥', multiplier: 10 },
  { id: 'broccoli', icon: '🥦', multiplier: 15 },
  { id: 'lettuce', icon: '🥬', multiplier: 25 },
  { id: 'carrot', icon: '🥕', multiplier: 45 },
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
    }, 1800);

    return () => { clearInterval(interval); clearInterval(handInterval); };
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
    }, 4500);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[88vh] w-full bg-[#020617] rounded-t-[4rem] border-t-[10px] border-yellow-500 relative overflow-hidden flex flex-col items-center"
        style={{ backgroundImage: 'radial-gradient(circle at top, #1e40af, #020617)' }}
      >
        {/* Header Section */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 text-blue-950 px-6 py-2 rounded-full font-black shadow-[0_4px_0_#854d0e] flex items-center gap-2 border-2 border-white/30">
            <span className="text-2xl drop-shadow-sm">🪙</span> {localCoins.toLocaleString()}
          </div>
          <motion.button whileTap={{ scale: 0.8 }} onClick={onClose} className="p-2 bg-red-600 rounded-full border-4 border-white shadow-lg">
            <X className="w-6 h-6 text-white font-bold" />
          </motion.button>
        </div>

        {/* Game Arena */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          <FerrisWheelSpokes />
          
          {/* Main Wheel Hub */}
          <div className="relative z-50">
            <div className="w-40 h-40 rounded-full border-[10px] border-yellow-500 bg-red-700 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(234,179,8,0.4),inset_0_0_20px_rgba(0,0,0,0.5)]">
              <div className="flex-[1.2] bg-red-800 relative flex items-center justify-center border-b-4 border-yellow-500/50">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {['🥬','🥦','🍅','🍇','🍊','🥕','🌽'].map((icon, i) => (
                    <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.1 }}
                      className="text-2xl absolute" style={{ transform: `rotate(${(i - 3) * 22}deg) translateY(-28px)` }}>
                      {icon}
                    </motion.span>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-red-600 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                  {gameState === 'betting' ? timeLeft : '...'}
                </span>
                <span className="text-[11px] font-black text-yellow-300 uppercase tracking-widest animate-pulse">
                   {gameState === 'betting' ? 'Bet Now' : 'Spinning'}
                </span>
              </div>
            </div>
          </div>

          {/* Hand Animation */}
          <AnimatePresence>
            {gameState === 'betting' && (
              <motion.div
                key="hand-pointer"
                transition={{ type: "spring", stiffness: 80, damping: 12 }}
                animate={{
                  x: Math.cos(((pointerTargetIdx * 45) - 90) * Math.PI / 180) * 175,
                  y: Math.sin(((pointerTargetIdx * 45) - 90) * Math.PI / 180) * 175,
                  rotate: (pointerTargetIdx * 45) 
                }}
                className="absolute z-[60] pointer-events-none"
              >
                <RealisticHandPointer />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Betting Circles (Fruits) */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 175;
            const y = Math.sin((angle * Math.PI) / 180) * 175;
            const hasBet = myBets[item.id] > 0;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-24 h-24 rounded-full border-[6px] flex flex-col overflow-hidden transition-all duration-300 shadow-2xl",
                    "border-t-yellow-300 border-x-yellow-500 border-b-orange-600 bg-red-700",
                    highlightIdx === idx ? "scale-110 ring-[6px] ring-white brightness-125 z-30" : ""
                  )}
                >
                  {/* Top: Icon Layer */}
                  <div className="flex-[1.2] bg-red-800 w-full flex items-center justify-center border-b-[3px] border-orange-500/40">
                    <span className="text-5xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">{item.icon}</span>
                  </div>

                  {/* Bottom: Orange Multiplier/Bet Layer */}
                  <div className={cn(
                    "flex-1 w-full flex items-center justify-center",
                    "bg-gradient-to-b from-orange-400 to-orange-600"
                  )}>
                    <span className="font-black text-white text-base drop-shadow-md">
                      {hasBet 
                        ? (myBets[item.id] >= 1000 ? `${myBets[item.id]/1000}K` : myBets[item.id])
                        : `×${item.multiplier}`
                      }
                    </span>
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Chips Footer */}
        <div className="w-full bg-black/60 backdrop-blur-xl p-8 flex justify-center gap-4 z-20 border-t-2 border-yellow-500/30">
          {CHIPS_DATA.map(chip => (
            <motion.button 
              key={chip.value}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full border-4 flex items-center justify-center text-sm font-black transition-all shadow-xl",
                "bg-gradient-to-tr from-indigo-700 via-blue-600 to-indigo-500 border-white",
                selectedChip === chip.value ? "scale-115 ring-4 ring-yellow-400 opacity-100 shadow-yellow-500/50" : "opacity-50 grayscale-[0.5]"
              )}
            >
              {chip.label}
            </motion.button>
          ))}
        </div>

        {/* Win Animation */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/85">
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} 
                className="bg-gradient-to-b from-yellow-400 to-orange-600 p-12 rounded-[4rem] border-[10px] border-white text-center shadow-[0_0_100px_rgba(234,179,8,0.6)]"
              >
                <Trophy className="w-24 h-24 text-white mx-auto mb-4 drop-shadow-lg" />
                <span className="text-9xl block mb-6 animate-bounce">{winnerData.icon}</span>
                <h2 className="text-white font-black text-6xl italic uppercase tracking-tighter">Big Win!</h2>
                <div className="mt-6 bg-white py-3 px-10 rounded-full shadow-inner">
                  <p className="text-orange-600 text-5xl font-black">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
