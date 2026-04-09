'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy, Clock, Volume2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const ITEMS = [
  { id: 'orange', icon: '🍊', multiplier: 5, color: '#f97316' },
  { id: 'coconut', icon: '🥥', multiplier: 10, color: '#713f12' },
  { id: 'broccoli', icon: '🥦', multiplier: 15, color: '#16a34a' },
  { id: 'lettuce', icon: '🥬', multiplier: 25, color: '#22c55e' },
  { id: 'carrot', icon: '🥕', multiplier: 45, color: '#ea580c' },
  { id: 'tomato', icon: '🍅', multiplier: 5, color: '#dc2626' },
  { id: 'grapes', icon: '🍇', multiplier: 5, color: '#9333ea' },
  { id: 'corn', icon: '🌽', multiplier: 5, color: '#eab308' },
];

const CHIPS_DATA = [
  { value: 100, label: '100', color: 'bg-blue-600 border-blue-400' },
  { value: 1000, label: '1K', color: 'bg-emerald-500 border-emerald-300' },
  { value: 5000, label: '5K', color: 'bg-purple-600 border-purple-400' },
  { value: 10000, label: '10K', color: 'bg-red-600 border-red-400' },
  { value: 50000, label: '50K', color: 'bg-amber-500 border-amber-300' },
];

export default function CarnivalFoodParty({ onClose }: { onClose?: () => void }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(1000);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [gameHistory, setGameHistory] = useState<string[]>(['🍓', '🥬', '🍎', '🍋', '🥥', '🍋', '🍎', '🥭']);

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
        setTimeout(run, 50 + (currentStep * 1.5)); 
      } else { 
        setTimeout(() => finalizeResult(winItem), 800); 
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
    setGameHistory(prev => [winItem.icon, ...prev.slice(0, 7)]);
    setWinnerData({ ...winItem, win: winAmount });
    setGameState('result');
    setTimeout(() => {
      setGameState('betting'); setTimeLeft(20); setMyBets({}); setWinnerData(null); setHighlightIdx(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col justify-end z-[100] font-sans select-none">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[85vh] w-full bg-[#1a237e] rounded-t-[3rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header: Coins and Buttons */}
        <div className="w-full p-6 flex justify-between items-start z-30">
          <div className="bg-[#ffca28] text-[#3e2723] px-5 py-2 rounded-full font-black text-xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),0_4px_0_#b71c1c] flex items-center gap-2">
            <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center border border-black/10">🏛️</div>
            {localCoins.toLocaleString()}
          </div>
          
          <div className="flex gap-2">
            {[Clock, Volume2, HelpCircle, X].map((Icon, i) => (
              <button key={i} onClick={i === 3 ? onClose : undefined} className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border-b-4 shadow-lg transition-transform active:scale-95",
                i === 3 ? "bg-red-600 border-red-800 text-white" : "bg-[#283593] border-[#1a237e] text-indigo-100"
              )}>
                <Icon size={24} strokeWidth={3} />
              </button>
            ))}
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute left-6 top-32 z-30 flex flex-col items-center gap-1">
          <div className="w-16 h-16 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
            <Trophy className="text-white drop-shadow-md" size={32} />
          </div>
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white -mt-3 z-10 shadow-md">99+</span>
        </div>

        <div className="absolute right-6 top-32 z-30 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border-4 border-yellow-400 flex items-center justify-center overflow-hidden shadow-xl">
             <span className="text-4xl">🔮</span>
          </div>
          <span className="bg-orange-500 text-white text-[10px] font-black px-2 rounded-md -mt-2 shadow-sm border border-white uppercase">Drop</span>
        </div>

        {/* GAME ARENA */}
        <div className="relative w-full flex-1 flex items-center justify-center -mt-10">
          
          {/* Wooden Support Pillars */}
          <div className="absolute bottom-0 w-40 h-[280px] bg-gradient-to-b from-[#5d4037] to-[#3e2723] clip-path-pillar shadow-2xl" 
               style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)' }} />

          {/* Yellow Spokes (Connecting Center to Items) */}
          <svg className="absolute w-[300px] h-[300px] pointer-events-none opacity-60">
            {ITEMS.map((_, i) => {
              const angle = (i * 45) - 90;
              const x2 = 150 + Math.cos((angle * Math.PI) / 180) * 120;
              const y2 = 150 + Math.sin((angle * Math.PI) / 180) * 120;
              return <line key={i} x1="150" y1="150" x2={x2} y2={y2} stroke="#fdd835" strokeWidth="6" strokeLinecap="round" />;
            })}
          </svg>

          {/* CENTER TIMER HUB */}
          <div className="relative z-50">
            <div className="w-24 h-24 rounded-full border-[6px] border-[#ffeb3b] bg-[#d32f2f] flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,235,59,0.5),inset_0_4px_10px_rgba(0,0,0,0.3)]">
              <div className="flex gap-0.5 mb-1 scale-125">
                {['🥬','🍅','🍓'].map((f,i)=><span key={i} className="text-[10px]">{f}</span>)}
              </div>
              <div className="w-full h-[3px] bg-yellow-400/50 my-0.5" />
              <span className="text-3xl font-black text-white leading-none">{timeLeft}s</span>
              <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">Wait</span>
            </div>
          </div>

          {/* CIRCLE OF ITEMS */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 135;
            const y = Math.sin((angle * Math.PI) / 180) * 135;
            const betAmount = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-40" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-[5.2rem] h-[5.2rem] rounded-full border-[4px] flex flex-col overflow-hidden transition-all shadow-[0_10px_20px_rgba(0,0,0,0.4)] relative",
                    "border-[#fdd835] bg-[#fb8c00]",
                    highlightIdx === idx ? "scale-115 ring-[6px] ring-white z-50 brightness-110" : ""
                  )}
                >
                  <div className="flex-[1.8] bg-[#8d0a0a] flex items-center justify-center border-b-2 border-yellow-500/40">
                    <span className="text-3xl drop-shadow-md">{item.icon}</span>
                  </div>
                  <div className="flex-1 bg-[#ff9800] flex items-center justify-center">
                    <span className="text-sm font-black text-[#4e342e] italic">×{item.multiplier}</span>
                  </div>
                  
                  {/* Bet Overlay */}
                  <AnimatePresence>
                    {betAmount > 0 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-full">
                         <span className="bg-yellow-400 text-red-900 text-[11px] font-black px-1.5 rounded-full border border-white shadow-lg">
                           🪙{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}
                         </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            );
          })}

          {/* Decorations */}
          <div className="absolute bottom-4 left-10 text-5xl filter drop-shadow-2xl">🥗</div>
          <div className="absolute bottom-4 right-10 text-5xl filter drop-shadow-2xl">🍕</div>
        </div>

        {/* GAME HISTORY BAR */}
        <div className="w-full px-4 mb-4">
           <div className="bg-[#4e342e]/60 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 border-2 border-white/10 shadow-inner">
              <div className="bg-[#ffeb3b] text-[#3e2723] text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">NEW</div>
              <div className="flex gap-2.5 overflow-x-hidden">
                {gameHistory.map((emoji, i) => (
                  <motion.div 
                    layout key={`${emoji}-${i}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className="w-10 h-10 bg-[#795548] rounded-xl flex items-center justify-center text-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-white/5"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
           </div>
        </div>

        {/* CHIPS SELECTION FOOTER */}
        <div className="w-full bg-[#3e2723] p-6 pb-10 flex justify-center gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t-4 border-[#5d4037]">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-[4.2rem] h-[4.2rem] rounded-full border-4 border-dashed flex items-center justify-center text-xs font-black transition-all",
                chip.color,
                selectedChip === chip.value ? "scale-110 -translate-y-4 ring-[6px] ring-green-400 border-solid brightness-110" : "opacity-70 scale-95"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center border border-white/20">
                <span className="text-white drop-shadow-lg text-sm">{chip.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* WINNER SCREEN */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                className="bg-gradient-to-b from-yellow-400 to-red-600 p-10 rounded-[3rem] border-8 border-white text-center shadow-[0_0_100px_rgba(255,193,7,0.5)]"
              >
                <div className="text-8xl mb-4 filter drop-shadow-2xl">{winnerData.icon}</div>
                <h2 className="text-white font-black text-5xl uppercase italic tracking-tighter drop-shadow-lg">BIG WIN!</h2>
                <div className="mt-4 bg-white/20 backdrop-blur-md rounded-2xl py-3 px-6 border border-white/30">
                  <p className="text-white text-4xl font-black tabular-nums">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
