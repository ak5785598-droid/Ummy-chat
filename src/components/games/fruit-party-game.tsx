'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- 3D WHITE HAND POINTER ---
const HandPointer = ({ targetIdx }: { targetIdx: number }) => {
  const angle = (targetIdx * 45) - 90;
  const x = Math.cos((angle * Math.PI) / 180) * 135;
  const y = Math.sin((angle * Math.PI) / 180) * 135;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: [1, 1.1, 1], 
        x: x, 
        y: y - 25 
      }}
      transition={{ 
        x: { type: "spring", stiffness: 100, damping: 10 },
        y: { type: "spring", stiffness: 100, damping: 10 },
        scale: { duration: 0.8, repeat: Infinity }
      }}
      className="absolute z-[100] pointer-events-none"
    >
      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
        <path 
          d="M9 10V5C9 3.89543 9.89543 3 11 3C12.1046 3 13 3.89543 13 5V11M13 11V9C13 7.89543 13.8954 7 15 7C16.1046 7 17 7.89543 17 9V11M17 11V10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10V16C21 18.7614 18.7614 21 16 21H10C7.23858 21 5 18.7614 5 16V13.6742C5 12.5632 5.76016 11.597 6.84534 11.3558L9 10.877" 
          stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="white"
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
        setTimeout(run, 50 + (currentStep * 2));
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#020617] rounded-t-[3.5rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center"
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
        <div className="relative w-full flex-1 flex items-center justify-center scale-95 -translate-y-6" style={{ perspective: '1000px' }}>
          
          {/* --- 3D BOTTOM SUPPORT LINES (MOTTE DANDE) --- */}
          <svg className="absolute w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <linearGradient id="stick3D" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3d1c02" />
                <stop offset="50%" stopColor="#8b4513" />
                <stop offset="100%" stopColor="#270c01" />
              </linearGradient>
              <filter id="stickShadow">
                <feDropShadow dx="10" dy="10" stdDeviation="5" floodOpacity="0.5"/>
              </filter>
            </defs>
            <g transform="translate(175, 175)" filter="url(#stickShadow)">
              <line x1="0" y1="20" x2="-120" y2="450" stroke="url(#stick3D)" strokeWidth="20" strokeLinecap="round" />
              <line x1="0" y1="20" x2="120" y2="450" stroke="url(#stick3D)" strokeWidth="20" strokeLinecap="round" />
            </g>
          </svg>

          {/* --- 3D CONNECTED LINES (WHEEL SPOKES) --- */}
          <svg className="absolute w-[350px] h-[350px] pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="spoke3D" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
            <g transform="translate(175, 175)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line 
                  key={angle} 
                  x1="0" y1="0" 
                  x2={110 * Math.cos((angle-90)*Math.PI/180)} 
                  y2={110 * Math.sin((angle-90)*Math.PI/180)} 
                  stroke="url(#spoke3D)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  className="drop-shadow-[2px_4px_4px_rgba(0,0,0,0.6)]"
                />
              ))}
            </g>
          </svg>
          
          {gameState === 'betting' && <HandPointer targetIdx={pointerIdx} />}

          {/* --- 3D COUNTDOWN CIRCLE (CENTRAL HUB) --- */}
          <div className="relative z-50">
            <div className="w-28 h-28 rounded-full border-[6px] border-yellow-500 bg-red-950 flex flex-col overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_-8px_15px_rgba(0,0,0,0.6),0_0_50px_rgba(234,179,8,0.4)] transform hover:scale-105 transition-transform duration-500">
              {/* Top Glassy Reflection */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10" />
              
              <div className="flex-1 bg-gradient-to-b from-red-900 via-red-950 to-red-900 relative flex items-center justify-center border-b-[3px] border-yellow-500/50">
                {HUB_ICONS.slice(0, 4).map((icon, i) => (
                   <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} className="text-xs absolute" style={{ left: `${20 + (i * 20)}%` }}>
                     {icon}
                   </motion.span>
                ))}
              </div>
              <div className="flex-1 bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center shadow-[inset_0_4px_10px_rgba(0,0,0,0.4)]">
                <span className="text-4xl font-black text-white italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{gameState === 'betting' ? timeLeft : '...'}</span>
              </div>
            </div>
          </div>

          {/* --- 3D UPDATED FRUIT CARDS --- */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 135;
            const y = Math.sin((angle * Math.PI) / 180) * 135;
            const betAmount = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  style={{ transformStyle: 'preserve-3d', transform: `rotateY(${highlightIdx === idx ? '0deg' : '15deg'}) rotateX(10deg)` }}
                  className={cn(
                    "w-24 h-24 rounded-full border-[4px] border-yellow-500 flex flex-col overflow-hidden transition-all duration-300 relative items-center justify-center",
                    "bg-[#7f1d1d] shadow-[10px_10px_20px_rgba(0,0,0,0.5),inset_-2px_-2px_10px_rgba(255,255,255,0.2)]",
                    highlightIdx === idx ? "scale-115 -translate-y-2 ring-4 ring-white z-40 shadow-[0_0_40px_rgba(255,255,255,0.8)]" : "hover:brightness-110"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-10" />
                  <div className="w-full flex-[1.2] flex items-center justify-center">
                    <span className="text-4xl drop-shadow-[2px_4px_6px_rgba(0,0,0,0.6)] z-20">{item.icon}</span>
                  </div>
                  <AnimatePresence mode="wait">
                    {betAmount > 0 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full bg-orange-500 flex items-center justify-center border-y border-yellow-500/50 overflow-hidden py-0.5 z-20"
                      >
                        <span className="text-[10px] font-black text-white whitespace-nowrap px-1 drop-shadow-sm">
                          🪙{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="w-full flex-1 flex items-center justify-center bg-orange-600 z-20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                    <span className="font-black text-[12px] text-white italic drop-shadow-sm">×{item.multiplier}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* --- HISTORY BAR --- */}
        <div className="w-full px-4 mb-2 z-20 relative">
          <div className="flex justify-between px-1 mb-1 items-end">
            <span className="text-2xl drop-shadow-lg">🥗</span>
            <span className="text-2xl drop-shadow-lg">🍕</span>
          </div>
          <div className="w-full h-12 bg-[#3e1a05] rounded-xl border-2 border-[#f5d0a9] flex items-center px-4 gap-3 overflow-x-auto no-scrollbar shadow-inner">
             <span className="text-[10px] font-bold text-[#f5d0a9] uppercase mr-2 border-r border-[#f5d0a9]/30 pr-2">History</span>
             {history.map((icon, i) => (
               <motion.div 
                 initial={{ scale: 0, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 key={i} 
                 className="min-w-[32px] h-8 bg-black/30 rounded-lg flex items-center justify-center text-lg shadow-sm"
               >
                 {icon}
               </motion.div>
             ))}
          </div>
        </div>

        {/* --- CHIPS FOOTER --- */}
        <div className="w-full bg-gradient-to-b from-[#270c01] to-[#1a0801] p-6 flex justify-center gap-3 z-20 border-t-4 border-[#f5d0a9] shadow-2xl">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full border-[3px] border-dashed border-white/40 flex items-center justify-center text-[10px] font-black transition-all relative",
                "bg-gradient-to-br shadow-[0_5px_0_rgba(0,0,0,0.4)]",
                chip.color,
                selectedChip === chip.value ? "scale-110 -translate-y-2 ring-4 ring-yellow-400 border-solid opacity-100" : "opacity-70"
              )}
            >
              <div className="absolute inset-1.5 rounded-full border-2 border-white/20 bg-black/10 flex items-center justify-center">
                <span className="text-white">{chip.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80">
              <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-10 rounded-[3rem] border-8 border-white text-center shadow-2xl">
                <Trophy className="w-16 h-16 text-white mx-auto mb-2 animate-bounce" />
                <span className="text-8xl block mb-2">{winnerData.icon}</span>
                <h2 className="text-white font-black text-4xl italic uppercase">WINNER!</h2>
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
