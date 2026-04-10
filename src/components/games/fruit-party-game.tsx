'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- 3D GLOVE HAND POINTER (1 Finger Pointing) ---
const HandPointer = ({ targetIdx }: { targetIdx: number }) => {
  const angle = (targetIdx * 45) - 90;
  const x = Math.cos((angle * Math.PI) / 180) * 145;
  const y = Math.sin((angle * Math.PI) / 180) * 145;

  return (
    <motion.div
      initial={false}
      animate={{ 
        x: x, 
        y: y - 20,
        rotate: angle + 90
      }}
      transition={{ 
        type: "spring", 
        stiffness: 80, 
        damping: 15,
      }}
      className="absolute z-[100] pointer-events-none"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {/* White 3D Glove SVG with Index Finger Pointing */}
        <svg width="65" height="65" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_8px_4px_rgba(0,0,0,0.4)]">
          <path 
            d="M10 11V4.5C10 3.67157 10.6716 3 11.5 3C12.3284 3 13 3.67157 13 4.5V11M13 11C13 10.1716 13.6716 9.5 14.5 9.5C15.3284 9.5 16 10.1716 16 11M16 11C16 10.4477 16.4477 10 17 10C17.5523 10 18 10.4477 18 11M18 11C18 10.7239 18.2239 10.5 18.5 10.5C18.7761 10.5 19 10.7239 19 11V15C19 17.7614 16.7614 20 14 20H11C8.23858 20 6 17.7614 6 15V13.5C6 12.6716 6.67157 12 7.5 12C8.32843 12 9 12.6716 9 13.5V11" 
            stroke="#94a3b8" 
            strokeWidth="1.5" 
            fill="white"
          />
        </svg>
      </motion.div>
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
  const [history, setHistory] = useState<string[]>(['🥦', '🍅', '🥕', '🍊', '🍇']);

  useEffect(() => {
    if (userProfile?.wallet?.coins) setLocalCoins(userProfile.wallet.coins);
  }, [userProfile]);

  // Pointer moves every 2 seconds line by line
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
        setTimeout(run, 50 + (currentStep * 2.5));
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
    setHistory(prev => [winItem.icon, ...prev.slice(0, 7)]);
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
    <div className="fixed inset-0 backdrop-blur-md bg-black/70 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[88vh] w-full bg-[#020617] rounded-t-[4rem] border-t-[10px] border-yellow-500 relative overflow-hidden flex flex-col items-center shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 20%, #1e40af, #020617)' }}
      >
        {/* Header - 3D Coin Bag Look */}
        <div className="w-full p-8 flex justify-between items-center z-20">
          <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 text-blue-950 px-6 py-2 rounded-full font-black shadow-[0_4px_0_#854d0e] flex items-center gap-2 border-2 border-yellow-100">
            <span className="text-2xl drop-shadow-md">🪙</span> 
            <span className="text-xl tracking-tight">{localCoins.toLocaleString()}</span>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl hover:scale-110 transition-transform">
            <X className="w-7 h-7 stroke-[3]" />
          </button>
        </div>

        {/* 3D Wheel Arena */}
        <div className="relative w-full flex-1 flex items-center justify-center scale-[1.05] -translate-y-8">
          {/* 3D Support Legs */}
          <svg className="absolute w-full h-full pointer-events-none z-0 overflow-visible opacity-80">
            <defs>
              <linearGradient id="leg3D" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>
            <g transform="translate(185, 185)">
              <rect x="-135" y="30" width="20" height="420" fill="url(#leg3D)" rx="10" transform="rotate(15 -125 30)" />
              <rect x="115" y="30" width="20" height="420" fill="url(#leg3D)" rx="10" transform="rotate(-15 125 30)" />
            </g>
          </svg>

          {/* Central Hub with Timer */}
          <div className="relative z-50">
            <div className="w-32 h-32 rounded-full border-[8px] border-yellow-500 bg-gradient-to-b from-red-800 to-red-950 flex flex-col overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.6),inset_0_4px_10px_rgba(0,0,0,0.5)]">
              <div className="flex-1 bg-black/20 flex items-center justify-center border-b-4 border-yellow-500/30">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="flex gap-1">
                   {['🥦', '🥕', '🍅'].map((icon, i) => <span key={i} className="text-xs">{icon}</span>)}
                </motion.div>
              </div>
              <div className="flex-1 bg-red-600 flex items-center justify-center">
                <span className="text-5xl font-black text-white italic drop-shadow-[0_4px_2px_rgba(0,0,0,0.5)]">
                  {gameState === 'betting' ? timeLeft : '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Fruit Buttons (3D Sphere Style) */}
          {gameState === 'betting' && <HandPointer targetIdx={pointerIdx} />}
          
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 150;
            const y = Math.sin((angle * Math.PI) / 180) * 150;
            const betAmount = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-24 h-24 rounded-full border-[4px] border-yellow-500 flex flex-col overflow-hidden transition-all duration-300 relative items-center justify-center",
                    "shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_-4px_8px_rgba(0,0,0,0.3)] bg-gradient-to-b from-red-500 to-red-900",
                    highlightIdx === idx ? "scale-125 z-40 ring-[6px] ring-white shadow-[0_0_40px_rgba(255,255,255,0.9)]" : "hover:scale-105"
                  )}
                >
                  <div className="w-full flex-[1.3] flex items-center justify-center">
                    <span className="text-5xl drop-shadow-lg">{item.icon}</span>
                  </div>
                  
                  <AnimatePresence>
                    {betAmount > 0 && (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <span className="bg-yellow-400 text-blue-900 text-[12px] font-black px-2 py-0.5 rounded-md shadow-md">
                          🪙{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-full h-8 flex items-center justify-center bg-orange-500 border-t-2 border-yellow-400">
                    <span className="font-black text-[14px] text-white italic drop-shadow-md">×{item.multiplier}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* History Bar */}
        <div className="w-full px-6 mb-4 z-30">
          <div className="w-full h-12 bg-gradient-to-r from-[#3b1c0a] to-[#5d2707] border-[3px] border-yellow-600/50 rounded-2xl flex items-center px-4 gap-4 shadow-xl">
            <span className="text-[12px] font-black text-yellow-500 uppercase italic border-r border-yellow-500/20 pr-3">Recent</span>
            <div className="flex gap-4 overflow-hidden">
              {history.map((icon, i) => (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-xl drop-shadow-sm">{icon}</motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Chips Selection */}
        <div className="w-full bg-[#1e1b4b]/80 backdrop-blur-md p-8 flex justify-center gap-4 z-20 border-t-4 border-yellow-500/30 rounded-t-[3rem]">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300",
                "bg-gradient-to-br shadow-[0_6px_0_rgba(0,0,0,0.5)] border-4 border-white/20",
                chip.color,
                selectedChip === chip.value ? "scale-125 -translate-y-4 ring-4 ring-yellow-400 opacity-100 shadow-[0_12px_20px_rgba(0,0,0,0.6)]" : "opacity-60"
              )}
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-black/10">
                <span className="text-white drop-shadow-md">{chip.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Win Result 3D Popup */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0, rotate: -20 }} 
                animate={{ scale: 1, rotate: 0 }} 
                className="bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 p-12 rounded-[4rem] border-[10px] border-white text-center shadow-[0_0_100px_rgba(251,191,36,0.5)]"
              >
                <Trophy className="w-20 h-20 text-white mx-auto mb-4 animate-bounce drop-shadow-2xl" />
                <span className="text-9xl block mb-4 filter drop-shadow-2xl">{winnerData.icon}</span>
                <h2 className="text-white font-black text-5xl italic uppercase tracking-tighter drop-shadow-lg">BIG WIN!</h2>
                <div className="mt-6 bg-white/30 py-3 px-10 rounded-3xl border-2 border-white/50">
                  <p className="text-white text-5xl font-black drop-shadow-md">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
