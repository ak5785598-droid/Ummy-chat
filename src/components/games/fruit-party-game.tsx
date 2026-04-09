'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- THICKER CONNECTED SPOKES ---
const FerrisWheelSpokes = () => (
  <svg className="absolute w-[320px] h-[320px] pointer-events-none overflow-visible">
    <defs>
      <linearGradient id="goldSpoke" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
    </defs>
    <g transform="translate(160, 160)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="0" y1="0"
          x2={130 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={130 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="url(#goldSpoke)"
          strokeWidth="10" // Increased thickness
          strokeLinecap="round"
          className="opacity-90"
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#020617] rounded-t-[3.5rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col items-center shadow-2xl"
        style={{ backgroundImage: 'radial-gradient(circle at top, #1e3a8a, #020617)' }}
      >
        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-blue-950 px-5 py-1.5 rounded-full font-black shadow-lg flex items-center gap-2 border-2 border-white/20">
            <span className="text-xl">🪙</span> {localCoins.toLocaleString()}
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Game Arena */}
        <div className="relative w-full flex-1 flex items-center justify-center scale-95 -translate-y-4">
          <FerrisWheelSpokes />
          
          {/* UPDATED COUNTDOWN HUB */}
          <div className="relative z-50">
            <div className="w-36 h-36 rounded-full border-[6px] border-yellow-500 bg-[#450a0a] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.4)]">
              {/* TOP HALF: FLOATING ICONS */}
              <div className="flex-1 bg-red-900/40 relative flex items-center justify-center overflow-hidden border-b-2 border-yellow-500/30">
                <div className="flex gap-1 animate-pulse">
                  {HUB_ICONS.slice(0, 4).map((icon, i) => (
                    <motion.span 
                      key={i} 
                      animate={{ y: [0, -5, 0] }} 
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      className="text-lg"
                    >
                      {icon}
                    </motion.span>
                  ))}
                </div>
                <div className="absolute bottom-1 flex gap-1">
                  {HUB_ICONS.slice(4).map((icon, i) => (
                    <motion.span 
                      key={i} 
                      animate={{ y: [0, 5, 0] }} 
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className="text-lg"
                    >
                      {icon}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* BOTTOM HALF: COUNTDOWN */}
              <div className="flex-1 bg-red-700 flex items-center justify-center">
                <span className="text-5xl font-black text-white italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                  {gameState === 'betting' ? timeLeft : '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Fruit Betting Circles - Triple Layer */}
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
                    "w-24 h-24 rounded-full border-[4px] flex flex-col overflow-hidden transition-all duration-200 shadow-2xl relative",
                    "border-yellow-500 bg-[#1e1b4b]",
                    highlightIdx === idx ? "scale-110 border-white ring-4 ring-yellow-400 z-30" : ""
                  )}
                >
                  {/* TOP: ICON */}
                  <div className="flex-1 bg-red-800 flex items-center justify-center border-b border-white/10">
                    <span className="text-3xl">{item.icon}</span>
                  </div>

                  {/* MIDDLE: BET VALUE (Shows only if bet > 0) */}
                  <div className="h-6 w-full bg-white flex items-center justify-center">
                    {betAmount > 0 ? (
                      <span className="text-[12px] font-black text-blue-800 animate-bounce">
                        🪙 {betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}
                      </span>
                    ) : (
                      <div className="w-full h-full bg-black/20" /> /* Placeholder when empty */
                    )}
                  </div>

                  {/* BOTTOM: MULTIPLIER */}
                  <div className="flex-[0.8] w-full flex items-center justify-center bg-gradient-to-b from-orange-400 to-orange-600">
                    <span className="font-black text-[12px] text-white italic">
                      ×{item.multiplier}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Chips Selector */}
        <div className="w-full bg-black/40 backdrop-blur-md p-6 flex justify-center gap-3 z-20 border-t border-white/5">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-xs font-black transition-all shadow-xl",
                "bg-gradient-to-tr from-indigo-600 to-blue-500",
                selectedChip === chip.value ? "scale-115 ring-4 ring-yellow-400 opacity-100" : "opacity-40"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Winner Result Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-10 rounded-[3rem] border-8 border-white text-center shadow-2xl">
                <Trophy className="w-16 h-16 text-white mx-auto mb-2" />
                <span className="text-8xl block mb-2">{winnerData.icon}</span>
                <h2 className="text-white font-black text-4xl italic uppercase tracking-tighter">WINNER!</h2>
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
