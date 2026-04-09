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
  const x = Math.cos((angle * Math.PI) / 180) * 140;
  const y = Math.sin((angle * Math.PI) / 180) * 140;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: [1, 0.85, 1], x, y: y - 25 }}
      transition={{ x: { type: "spring", stiffness: 120 }, y: { type: "spring", stiffness: 120 }, scale: { duration: 1.5, repeat: Infinity } }}
      className="absolute z-[110] pointer-events-none"
    >
      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_8px_4px_rgba(0,0,0,0.5)]">
        <path 
          d="M9 10V5C9 3.89543 9.89543 3 11 3C12.1046 3 13 3.89543 13 5V11M13 11V9C13 7.89543 13.8954 7 15 7C16.1046 7 17 7.89543 17 9V11M17 11V10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10V16C21 18.7614 18.7614 21 16 21H10C7.23858 21 5 18.7614 5 16V13.6742C5 12.5632 5.76016 11.597 6.84534 11.3558L9 10.877" 
          stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="white"
        />
        <circle cx="9" cy="5" r="2.5" fill="#3b82f6" className="animate-ping" />
      </svg>
    </motion.div>
  );
};

// --- WOODEN PILLARS & STRUCTURE ---
const SupportStructure = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
    {/* Left Pillar: Between Coconut & Tomato area down to footer */}
    <div 
      className="absolute w-10 h-[280px] bg-gradient-to-b from-[#5d2e13] to-[#270c01] border-x-4 border-[#3e1e0a] shadow-2xl z-0"
      style={{ transform: 'translate(-80px, 140px) rotate(-15deg)', borderRadius: '10px 10px 0 0' }}
    >
      <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,#000_11px)]" />
    </div>

    {/* Right Pillar: Between Tomato & Corn area down to footer */}
    <div 
      className="absolute w-10 h-[280px] bg-gradient-to-b from-[#5d2e13] to-[#270c01] border-x-4 border-[#3e1e0a] shadow-2xl z-0"
      style={{ transform: 'translate(80px, 140px) rotate(15deg)', borderRadius: '10px 10px 0 0' }}
    >
      <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,#000_11px)]" />
    </div>

    {/* Ferris Wheel Spokes */}
    <svg className="w-[350px] h-[350px] overflow-visible z-10">
      <g transform="translate(175, 175)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="0" y1="0"
            x2={145 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={145 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="#fb923c" strokeWidth="8" strokeLinecap="round" opacity="0.6"
          />
        ))}
      </g>
    </svg>
  </div>
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

const FLOATING_ICONS = ['🥬','🍊','🌽','🍅','🥕','🥥','🍇','🥦','🍍','🍉'];

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

  useEffect(() => { if (userProfile?.wallet?.coins) setLocalCoins(userProfile.wallet.coins); }, [userProfile]);

  useEffect(() => {
    if (gameState !== 'betting') return;
    const pTimer = setInterval(() => setPointerIdx(p => (p + 1) % 8), 2000);
    const gTimer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { startSpin(); return 0; } return t - 1; });
    }, 1000);
    return () => { clearInterval(pTimer); clearInterval(gTimer); };
  }, [gameState]);

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || localCoins < selectedChip) return;
    setMyBets(p => ({ ...p, [id]: (p[id] || 0) + selectedChip }));
    setLocalCoins(p => p - selectedChip);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(-selectedChip) });
  };

  const startSpin = () => {
    setGameState('spinning');
    const winItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    let currentStep = 0;
    const totalSteps = 40 + ITEMS.indexOf(winItem);
    const run = () => {
      setHighlightIdx(currentStep % 8);
      if (currentStep < totalSteps) { currentStep++; setTimeout(run, 50 + (currentStep * 2)); }
      else { setTimeout(() => finalizeResult(winItem), 1000); }
    };
    run();
  };

  const finalizeResult = (winItem: any) => {
    const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
    if (winAmount > 0) {
      setLocalCoins(p => p + winAmount);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(winAmount) });
    }
    setWinnerData({ ...winItem, win: winAmount });
    setGameState('result');
    setTimeout(() => {
      setGameState('betting'); setTimeLeft(30); setMyBets({}); setWinnerData(null); setHighlightIdx(null); setPointerIdx(0);
    }, 4500);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/70 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#020617] rounded-t-[4rem] border-t-[10px] border-orange-500 relative overflow-hidden flex flex-col items-center shadow-2xl"
        style={{ backgroundImage: 'radial-gradient(circle at top, #1e40af, #020617)' }}
      >
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-950 px-6 py-2 rounded-full font-black shadow-lg flex items-center gap-2 border-2 border-white/20">
            <span className="text-xl">🪙</span> {localCoins.toLocaleString()}
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl">
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Game Arena */}
        <div className="relative w-full flex-1 flex items-center justify-center scale-90 -translate-y-6">
          <SupportStructure />
          <AnimatePresence>{gameState === 'betting' && <HandPointer targetIdx={pointerIdx} />}</AnimatePresence>

          <div className="relative z-50">
            <div className="w-32 h-32 rounded-full border-[3px] border-orange-400/80 bg-[#450a0a] flex flex-col items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(251,146,60,0.5)]">
              <div className="flex-1 w-full bg-red-950/50 relative overflow-hidden border-b border-orange-400/30">
                <div className="flex animate-marquee whitespace-nowrap items-center h-full gap-2 px-2">
                  {Array(3).fill(FLOATING_ICONS).flat().map((icon, i) => (
                    <span key={i} className="text-lg">{icon}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full flex items-center justify-center bg-red-900/40">
                <span className="text-4xl font-black text-white italic drop-shadow-lg">
                  {gameState === 'betting' ? timeLeft : '...'}
                </span>
              </div>
            </div>
          </div>

          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 145;
            const y = Math.sin((angle * Math.PI) / 180) * 145;
            const bet = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-20" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-24 h-24 rounded-full border-[6px] flex flex-col overflow-hidden transition-all shadow-xl relative",
                    "border-orange-500 bg-orange-600",
                    highlightIdx === idx ? "scale-110 border-white ring-4 ring-yellow-400 z-30 shadow-[0_0_30px_white]" : ""
                  )}
                >
                  <div className={cn("w-full bg-yellow-400 flex items-center justify-center transition-all duration-300", bet > 0 ? "h-8" : "flex-1")}>
                    <span className={cn(bet > 0 ? "text-xl" : "text-4xl")}>{item.icon}</span>
                  </div>
                  <AnimatePresence>
                    {bet > 0 && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="w-full bg-orange-500 flex items-center justify-center py-1 border-y border-white/20">
                        <span className="text-[11px] font-black text-white">🪙 {bet >= 1000 ? `${bet/1000}K` : bet}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className={cn("w-full flex items-center justify-center bg-orange-600", bet > 0 ? "h-7" : "flex-[0.6]")}>
                    <span className="font-black text-[13px] text-white">×{item.multiplier}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Chips Footer with Pillar Integration */}
        <div className="w-full bg-gradient-to-b from-[#3e1e0a] to-[#270c01] p-7 flex justify-center gap-4 z-30 border-t-8 border-[#5d2e13]">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-16 h-16 rounded-full border-4 border-dashed border-white/30 flex items-center justify-center text-[11px] font-black transition-all relative",
                "bg-gradient-to-br shadow-[0_8px_0_rgba(0,0,0,0.4)]",
                chip.color,
                selectedChip === chip.value ? "scale-110 -translate-y-3 ring-4 ring-yellow-400 border-solid" : "opacity-80"
              )}
            >
              <div className="absolute inset-1.5 rounded-full border-2 border-white/20 bg-black/10 flex items-center justify-center">
                <span className="text-white drop-shadow-md uppercase">{chip.label}</span>
              </div>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 p-12 rounded-[4rem] border-[10px] border-white text-center shadow-2xl">
                <Trophy className="w-20 h-20 text-white mx-auto mb-4" />
                <span className="text-9xl block mb-4 filter drop-shadow-2xl">{winnerData.icon}</span>
                <h2 className="text-white font-black text-5xl italic tracking-tighter uppercase drop-shadow-lg">BIG WIN!</h2>
                <div className="mt-6 bg-white/30 py-3 px-10 rounded-full border-2 border-white/50">
                  <p className="text-white text-5xl font-black">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 10s linear infinite; }
      `}</style>
    </div>
  );
}
