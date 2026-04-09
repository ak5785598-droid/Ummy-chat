'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy, Clock, Volume2, HelpCircle, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const ITEMS = [
  { id: 'orange', icon: '🍊', multiplier: 5 },
  { id: 'coconut', icon: '🥥', multiplier: 10 },
  { id: 'broccoli', icon: '🥦', multiplier: 15 },
  { id: 'lettuce', icon: '🥬', multiplier: 25 },
  { id: 'carrot', icon: '🥕', multiplier: 45 },
  { id: 'tomato', icon: '🍅', multiplier: 5 },
  { id: 'grapes', icon: '🍇', multiplier: 5 },
  { id: 'corn', icon: '🌽', multiplier: 5 },
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
  const [gameHistory, setGameHistory] = useState(['🍓', '🥬', '🍎', '🍋', '🥥', '🍋', '🍎', '🥭']);

  // Calculate total bet for display
  const totalBetAmount = useMemo(() => 
    Object.values(myBets).reduce((acc, curr) => acc + curr, 0), 
  [myBets]);

  // --- Audio Engine ---
  const playSound = useCallback((type: 'bet' | 'tick' | 'win' | 'loss') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'bet') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'tick') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'loss') {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  }, []);

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
    playSound('bet');
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
    setLocalCoins(prev => prev - selectedChip);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(-selectedChip) });
  };

  const startSpin = () => {
    if (gameState !== 'betting') return;
    setGameState('spinning');
    const winItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    let currentStep = 0;
    const totalSteps = 40 + ITEMS.indexOf(winItem);
    
    const run = () => {
      setHighlightIdx(currentStep % ITEMS.length);
      playSound('tick');
      if (currentStep < totalSteps) { 
        currentStep++; 
        setTimeout(run, 50 + (currentStep * 2)); 
      } else { 
        setTimeout(() => finalizeResult(winItem), 800); 
      }
    };
    run();
  };

  const finalizeResult = (winItem: any) => {
    const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
    if (winAmount > 0) {
      playSound('win');
      setLocalCoins(prev => prev + winAmount);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(winAmount) });
    } else if (totalBetAmount > 0) {
      playSound('loss');
    }
    
    setGameHistory(prev => [winItem.icon, ...prev.slice(0, 7)]);
    setWinnerData({ ...winItem, win: winAmount });
    setGameState('result');
    setTimeout(() => {
      setGameState('betting'); setTimeLeft(20); setMyBets({}); setWinnerData(null); setHighlightIdx(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col justify-end z-[100] font-sans select-none overflow-hidden">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[88vh] w-full bg-[#1a237e] rounded-t-[3rem] border-t-8 border-yellow-500 relative overflow-hidden flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="w-full p-6 flex justify-between items-start z-30">
          <div className="flex flex-col gap-1">
            <div className="bg-[#ffca28] text-[#3e2723] px-5 py-2 rounded-full font-black text-xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),0_4px_0_#b71c1c] flex items-center gap-2">
              <Coins size={20} className="text-orange-700" />
              {localCoins.toLocaleString()}
            </div>
            {totalBetAmount > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full w-fit">
                Bet: {totalBetAmount.toLocaleString()}
              </motion.div>
            )}
          </div>
          <div className="flex gap-2">
            {[Volume2, HelpCircle, X].map((Icon, i) => (
              <button key={i} onClick={i === 2 ? onClose : undefined} className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border-b-4 shadow-lg transition-transform active:scale-95",
                i === 2 ? "bg-red-600 border-red-800 text-white" : "bg-[#283593] border-[#1a237e] text-indigo-100"
              )}>
                <Icon size={24} strokeWidth={3} />
              </button>
            ))}
          </div>
        </div>

        {/* Decoration Badges */}
        <div className="absolute left-6 top-28 z-30 flex flex-col items-center gap-1">
          <div className="w-14 h-14 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
            <Trophy className="text-white drop-shadow-md" size={28} />
          </div>
          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white -mt-3 z-10">99+</span>
        </div>

        <div className="absolute right-6 top-28 z-30 flex flex-col items-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full border-4 border-yellow-400 flex items-center justify-center overflow-hidden shadow-xl">
             <span className="text-3xl filter drop-shadow-lg">🔮</span>
          </div>
          <span className="bg-orange-500 text-white text-[9px] font-black px-2 rounded-md -mt-2 shadow-sm border border-white uppercase z-10">Magic</span>
        </div>

        {/* GAME ARENA */}
        <div className="relative w-full flex-1 flex items-center justify-center -mt-10">
          <svg className="absolute w-[340px] h-[340px] pointer-events-none overflow-visible scale-90 sm:scale-100">
            {ITEMS.map((_, i) => {
              const angle = (i * 45) - 90;
              const x2 = 170 + Math.cos((angle * Math.PI) / 180) * 135;
              const y2 = 170 + Math.sin((angle * Math.PI) / 180) * 135;
              return (
                <g key={i}>
                  <line x1="170" y1="170" x2={x2} y2={y2} stroke="#ffeb3b" strokeWidth="16" strokeLinecap="round" opacity="0.8" />
                  <line x1="170" y1="170" x2={x2} y2={y2} stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray="1, 15" className="opacity-90" />
                </g>
              );
            })}
          </svg>

          {/* Center Timer */}
          <div className="relative z-50">
            <div className={cn(
              "w-26 h-26 rounded-full border-[10px] border-yellow-400 border-dotted flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,235,59,0.5),inset_0_4px_10px_rgba(0,0,0,0.3)] relative transition-colors duration-300",
              gameState === 'spinning' ? "bg-orange-600" : "bg-[#d32f2f]"
            )}>
              <div className="absolute inset-[-10px] rounded-full border-[10px] border-white/40 border-dotted pointer-events-none" />
              <span className="text-3xl font-black text-white leading-none">
                {gameState === 'spinning' ? '???' : `${timeLeft}s`}
              </span>
              <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest mt-1">
                {gameState === 'spinning' ? 'Spinning' : 'Betting'}
              </span>
            </div>
          </div>

          {/* FRUIT ITEMS */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 145;
            const y = Math.sin((angle * Math.PI) / 180) * 145;
            const betAmount = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-40" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-[6.4rem] h-[6.4rem] rounded-full border-[8px] border-yellow-400 border-dotted flex flex-col overflow-hidden transition-all shadow-2xl relative",
                    highlightIdx === idx ? "scale-115 ring-[6px] ring-white z-50 brightness-110" : "scale-90 sm:scale-100"
                  )}
                >
                  <div className="absolute inset-[-8px] rounded-full border-[8px] border-white/30 border-dotted pointer-events-none" />
                  <div className="h-[35%] w-full bg-[#8d0a0a] flex items-center justify-center">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className={cn(
                    "h-[35%] w-full flex items-center justify-center border-y border-white/10 transition-colors",
                    betAmount > 0 ? "bg-[#f97316]" : "bg-[#8d0a0a]"
                  )}>
                     <span className="text-white text-[11px] font-black">
                       {betAmount > 0 ? `🪙${betAmount >= 1000 ? (betAmount/1000)+'K' : betAmount}` : '---'}
                     </span>
                  </div>
                  <div className="h-[30%] w-full bg-[#ea580c] flex items-center justify-center">
                    <span className="text-sm font-black text-white italic">×{item.multiplier}</span>
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* History Bar */}
        <div className="w-full px-4 mb-4">
           <div className="bg-[#4e342e]/60 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 border-2 border-white/10">
              <div className="bg-[#ffeb3b] text-[#3e2723] text-[10px] font-black px-2 py-1 rounded-lg">LAST 8</div>
              <div className="flex gap-2.5 overflow-x-hidden">
                {gameHistory.map((emoji, i) => (
                  <motion.div layout key={`${emoji}-${i}`} className="w-9 h-9 bg-[#795548] rounded-xl flex items-center justify-center text-lg shadow-md border border-white/5">{emoji}</motion.div>
                ))}
              </div>
           </div>
        </div>

        {/* Footer Chips */}
        <div className="w-full bg-[#3e2723] p-6 pb-10 flex justify-center items-center gap-3 border-t-4 border-[#5d4037]">
          {CHIPS_DATA.map(chip => (
            <button key={chip.value} onClick={() => setSelectedChip(chip.value)} className={cn(
              "w-[4.2rem] h-[4.2rem] rounded-full border-4 border-dashed flex items-center justify-center transition-all",
              chip.color,
              selectedChip === chip.value ? "scale-110 -translate-y-4 ring-[6px] ring-green-400 border-solid" : "opacity-70"
            )}>
              <span className="text-white font-black text-sm">{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={cn(
                "p-10 rounded-[3rem] border-8 border-white text-center shadow-[0_0_100px_rgba(255,255,255,0.2)]",
                winnerData.win > 0 ? "bg-gradient-to-b from-yellow-400 to-red-600" : "bg-gradient-to-b from-gray-600 to-gray-900"
              )}>
                <div className="text-8xl mb-4 drop-shadow-2xl">{winnerData.icon}</div>
                <h2 className="text-white font-black text-5xl italic drop-shadow-lg">
                  {winnerData.win > 0 ? 'BIG WIN!' : 'NEXT TIME!'}
                </h2>
                <div className="mt-4 bg-white/20 rounded-2xl py-3 px-6">
                  <p className="text-white text-4xl font-black">
                    {winnerData.win > 0 ? `+${winnerData.win.toLocaleString()}` : '0'}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
