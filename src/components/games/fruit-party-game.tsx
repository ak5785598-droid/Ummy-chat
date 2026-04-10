'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- 3D WHITE HAND POINTER ---
const HandPointer = ({ targetIdx }: { targetIdx: number }) => {
  const angle = (targetIdx * 45) - 90;
  const x = Math.cos((angle * Math.PI) / 180) * 145;
  const y = Math.sin((angle * Math.PI) / 180) * 145;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: [1, 1.15, 1], 
        x: x, 
        y: y - 30 
      }}
      transition={{ 
        x: { type: "spring", stiffness: 120, damping: 12 },
        y: { type: "spring", stiffness: 120, damping: 12 },
        scale: { duration: 0.8, repeat: Infinity }
      }}
      className="absolute z-[100] pointer-events-none"
    >
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]">
        <path 
          d="M9 10V5C9 3.89543 9.89543 3 11 3C12.1046 3 13 3.89543 13 5V11M13 11V9C13 7.89543 13.8954 7 15 7C16.1046 7 17 7.89543 17 9V11M17 11V10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10V16C21 18.7614 18.7614 21 16 21H10C7.23858 21 5 18.7614 5 16V13.6742C5 12.5632 5.76016 11.597 6.84534 11.3558L9 10.877" 
          stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="white"
        />
      </svg>
    </motion.div>
  );
};

const ITEMS = [
  { id: 'broccoli', icon: '🥦', multiplier: 15 },
  { id: 'lettuce', icon: '🥬', multiplier: 25 },
  { id: 'carrot', icon: '🥕', multiplier: 45 },
  { id: 'corn', icon: '🌽', multiplier: 5 },
  { id: 'tomato', icon: '🍅', multiplier: 5 },
  { id: 'coconut', icon: '🥥', multiplier: 10 },
  { id: 'grapes', icon: '🍇', multiplier: 5 },
  { id: 'orange', icon: '🍊', multiplier: 5 },
];

const HUB_ICONS = ['🥦', '🥬', '🥕', '🌽', '🍅', '🥥', '🍇', '🍊'];

const CHIPS_DATA = [
  { value: 100, label: '100', color: 'from-blue-500 via-blue-600 to-blue-800' },
  { value: 1000, label: '1K', color: 'from-emerald-500 via-emerald-600 to-emerald-800' },
  { value: 5000, label: '5K', color: 'from-purple-500 via-purple-600 to-purple-800' },
  { value: 10000, label: '10K', color: 'from-rose-500 via-rose-600 to-rose-800' },
  { value: 50000, label: '50K', color: 'from-amber-500 via-amber-600 to-amber-800' },
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
  const [pointerIdx, setPointerIdx] = useState(0);
  const [history, setHistory] = useState<string[]>(['🍎', '🍊', '🍇', '🥦', '🥕']);

  useEffect(() => {
    if (userProfile?.wallet?.coins) setLocalCoins(userProfile.wallet.coins);
  }, [userProfile]);

  useEffect(() => {
    if (gameState !== 'betting') return;
    const pointerInterval = setInterval(() => {
      setPointerIdx(prev => (prev + 1) % ITEMS.length);
    }, 1500);
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
        setTimeout(run, 50 + (currentStep * 1.5));
      } else {
        setTimeout(() => finalizeResult(winItem), 1000);
      }
    };
    run();
  };

  const finalizeResult = (winItem: any) => {
    const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
    setHistory(prev => [winItem.icon, ...prev].slice(0, 10));

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
    <div className="fixed inset-0 backdrop-blur-md bg-black/70 flex flex-col justify-end z-[100] perspective-[1200px]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[88vh] w-full bg-[#020617] rounded-t-[4rem] border-t-[10px] border-yellow-500 relative overflow-hidden flex flex-col items-center shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 20%, #1e40af 0%, #0f172a 50%, #020617 100%)' }}
      >
        {/* Header - 3D Coins Display */}
        <div className="w-full p-8 flex justify-between items-center z-20">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 text-blue-950 px-6 py-2 rounded-2xl font-black shadow-[0_6px_0_#92400e,0_12px_20px_rgba(0,0,0,0.4)] flex items-center gap-2 border-2 border-yellow-200"
          >
            <Coins className="w-6 h-6 animate-pulse" /> {localCoins.toLocaleString()}
          </motion.div>
          <button onClick={onClose} className="w-12 h-12 bg-gradient-to-b from-red-500 to-red-800 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl hover:scale-110 transition-transform">
            <X className="w-7 h-7 stroke-[3]" />
          </button>
        </div>

        {/* Game Arena - Main 3D Space */}
        <div className="relative w-full flex-1 flex items-center justify-center scale-[0.88] -translate-y-8">
          
          {/* 3D Support Legs */}
          <svg className="absolute w-full h-full pointer-events-none z-0 overflow-visible opacity-80">
            <defs>
              <linearGradient id="leg3D" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#270c01" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>
            <g transform="translate(175, 175)">
              <rect x="-135" y="0" width="18" height="500" fill="url(#leg3D)" rx="4" transform="rotate(15 0 0)" />
              <rect x="117" y="0" width="18" height="500" fill="url(#leg3D)" rx="4" transform="rotate(-15 0 0)" />
            </g>
          </svg>

          {/* 3D Connect Lines (Neon Glow) */}
          <svg className="absolute w-[400px] h-[400px] pointer-events-none overflow-visible">
            <filter id="neon">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <g transform="translate(200, 200)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line 
                  key={angle} 
                  x1="0" y1="0" 
                  x2={130 * Math.cos((angle-90)*Math.PI/180)} 
                  y2={130 * Math.sin((angle-90)*Math.PI/180)} 
                  stroke="#fbbf24" strokeWidth="4" strokeLinecap="round"
                  filter="url(#neon)"
                  className="opacity-40"
                />
              ))}
              {/* Vertical 3D Connector to History */}
              <rect x="-4" y="55" width="8" height="150" fill="url(#leg3D)" rx="2" />
            </g>
          </svg>
          
          {gameState === 'betting' && <HandPointer targetIdx={pointerIdx} />}

          {/* Center 3D Hub (Countdown) */}
          <div className="relative z-50">
            <motion.div 
              animate={{ rotateZ: gameState === 'spinning' ? 360 : 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border-[8px] border-yellow-500 bg-gradient-to-br from-red-800 to-black flex flex-col overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.4),inset_0_0_20px_rgba(0,0,0,0.8)] relative"
            >
              <div className="flex-1 bg-black/40 relative flex items-center justify-center border-b-[3px] border-yellow-500/30">
                {HUB_ICONS.slice(0, 4).map((icon, i) => (
                   <motion.span key={i} animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }} className="text-sm absolute" style={{ left: `${20 + (i * 20)}%` }}>
                     {icon}
                   </motion.span>
                ))}
              </div>
              <div className="flex-1 bg-gradient-to-t from-red-600 to-red-500 flex items-center justify-center">
                <span className="text-4xl font-black text-white italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                  {gameState === 'betting' ? timeLeft : '...'}
                </span>
              </div>
              {/* Glass Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            </motion.div>
          </div>

          {/* Fruit 3D Cards */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 160;
            const y = Math.sin((angle * Math.PI) / 180) * 160;
            const betAmount = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <motion.button 
                  onClick={() => handlePlaceBet(item.id)}
                  whileTap={{ scale: 0.9, translateZ: -20 }}
                  className={cn(
                    "w-28 h-28 rounded-3xl border-[4px] border-yellow-500 flex flex-col overflow-hidden transition-all duration-300 relative items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)]",
                    "bg-gradient-to-b from-[#991b1b] to-[#450a0a]",
                    highlightIdx === idx ? "scale-115 ring-[6px] ring-white z-40 shadow-[0_0_40px_rgba(255,255,255,0.6)] -translate-y-4" : "hover:-translate-y-2"
                  )}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="w-full flex-[1.4] flex items-center justify-center relative">
                    <span className="text-5xl drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] transform translate-z-10">{item.icon}</span>
                  </div>
                  
                  <AnimatePresence>
                    {betAmount > 0 && (
                      <motion.div 
                        initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }}
                        className="absolute -top-4 -right-2 bg-blue-600 border-2 border-white rounded-lg px-2 py-0.5 shadow-lg z-50"
                      >
                        <span className="text-[12px] font-black text-white whitespace-nowrap">
                          🪙{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-full flex-1 flex items-center justify-center bg-gradient-to-r from-orange-400 to-orange-600 border-t-2 border-yellow-400/30">
                    <span className="font-black text-sm text-white italic drop-shadow-sm">×{item.multiplier}</span>
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* --- 3D HISTORY BAR --- */}
        <div className="w-full px-6 mb-4 z-20">
          <div className="w-full h-16 bg-gradient-to-b from-[#3e1a05] to-[#1a0a02] rounded-2xl border-[3px] border-[#f5d0a9]/40 flex items-center px-5 gap-4 overflow-x-auto no-scrollbar shadow-[0_8px_0_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.1)]">
             <div className="flex flex-col items-center border-r-2 border-[#f5d0a9]/20 pr-4 shrink-0">
                <span className="text-[10px] font-black text-[#f5d0a9] uppercase tracking-tighter">Last</span>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter">Results</span>
             </div>
             <div className="flex gap-3">
               {history.map((icon, i) => (
                 <motion.div 
                   initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} 
                   key={i} 
                   className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10"
                 >
                   {icon}
                 </motion.div>
               ))}
             </div>
          </div>
        </div>

        {/* 3D Chips Footer */}
        <div className="w-full bg-gradient-to-b from-[#451a03] to-[#020617] p-8 pb-10 flex justify-center gap-4 z-20 border-t-[6px] border-yellow-600 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
          {CHIPS_DATA.map(chip => (
            <motion.button 
              key={chip.value}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all relative",
                "bg-gradient-to-br shadow-[0_8px_0_rgba(0,0,0,0.6)]",
                chip.color,
                selectedChip === chip.value ? "scale-110 -translate-y-4 ring-[5px] ring-yellow-400 opacity-100 shadow-[0_12px_20px_rgba(0,0,0,0.6)]" : "opacity-60"
              )}
            >
              <div className="absolute inset-1.5 rounded-full border-[3px] border-dashed border-white/30 bg-black/20 flex items-center justify-center">
                <span className="text-white font-black text-xs tracking-tighter">{chip.label}</span>
              </div>
              {/* Inner Rim for 3D look */}
              <div className="absolute inset-0 rounded-full border-t-2 border-white/40 pointer-events-none" />
            </motion.button>
          ))}
        </div>

        {/* Result Overlay (Victory Modal) */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="absolute inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.5, rotateY: 90 }} 
                animate={{ scale: 1, rotateY: 0 }} 
                className="bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-600 p-12 rounded-[4rem] border-[10px] border-white text-center shadow-[0_0_100px_rgba(234,179,8,0.6)]"
              >
                <div className="relative">
                  <Trophy className="w-20 h-20 text-white mx-auto mb-4 animate-bounce drop-shadow-lg" />
                  <motion.div 
                    animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-white/30 rounded-full scale-150"
                  />
                </div>
                <span className="text-9xl block mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]">{winnerData.icon}</span>
                <h2 className="text-white font-black text-5xl italic uppercase tracking-widest drop-shadow-md">WINNER!</h2>
                <div className="mt-6 bg-black/30 py-3 px-10 rounded-3xl border-2 border-white/20">
                  <p className="text-yellow-200 text-5xl font-black tabular-nums">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
