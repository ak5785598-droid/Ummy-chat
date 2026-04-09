'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy, Clock, Volume2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---
const HandPointer = ({ targetIdx }: { targetIdx: number }) => {
  const angle = (targetIdx * 45) - 90;
  const x = Math.cos((angle * Math.PI) / 180) * 125;
  const y = Math.sin((angle * Math.PI) / 180) * 125;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: [1, 1.1, 1], x: x, y: y - 25 }}
      transition={{ x: { type: "spring", stiffness: 100 }, y: { type: "spring", stiffness: 100 }, scale: { duration: 0.8, repeat: Infinity } }}
      className="absolute z-[100] pointer-events-none"
    >
      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
        <path d="M9 10V5C9 3.89543 9.89543 3 11 3C12.1046 3 13 3.89543 13 5V11M13 11V9C13 7.89543 13.8954 7 15 7C16.1046 7 17 7.89543 17 9V11M17 11V10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10V16C21 18.7614 18.7614 21 16 21H10C7.23858 21 5 18.7614 5 16V13.6742C5 12.5632 5.76016 11.597 6.84534 11.3558L9 10.877" stroke="#cbd5e1" strokeWidth="2" fill="white" />
      </svg>
    </motion.div>
  );
};

// --- Data ---
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
  { value: 100, label: '100', color: 'from-blue-600 to-blue-800' },
  { value: 1000, label: '1K', color: 'from-emerald-500 to-emerald-700' },
  { value: 5000, label: '5K', color: 'from-purple-600 to-purple-800' },
  { value: 10000, label: '10K', color: 'from-red-600 to-red-800' },
  { value: 50000, label: '50K', color: 'from-amber-500 to-amber-700' },
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
  const [pointerIdx, setPointerIdx] = useState(0);
  
  // Real Game History State
  const [gameHistory, setGameHistory] = useState<string[]>(['🍎', '🍋', '🍇', '🌽', '🍅', '🥥', '🥦', '🥬']);

  useEffect(() => { if (userProfile?.wallet?.coins) setLocalCoins(userProfile.wallet.coins); }, [userProfile]);

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

  useEffect(() => {
    if (gameState !== 'betting') return;
    const pointerInterval = setInterval(() => {
      setPointerIdx(prev => (prev + 1) % ITEMS.length);
    }, 1500);
    return () => clearInterval(pointerInterval);
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
      }
      else { 
        setTimeout(() => finalizeResult(winItem), 1000); 
      }
    };
    run();
  };

  const finalizeResult = (winItem: any) => {
    const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
    
    // Update local coins if won
    if (winAmount > 0) {
      setLocalCoins(prev => prev + winAmount);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(winAmount) });
    }

    // Update History with Real Winning Item
    setGameHistory(prev => [winItem.icon, ...prev.slice(0, 7)]);

    setWinnerData({ ...winItem, win: winAmount });
    setGameState('result');
    
    setTimeout(() => {
      setGameState('betting'); 
      setTimeLeft(20); 
      setMyBets({}); 
      setWinnerData(null); 
      setHighlightIdx(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex flex-col justify-end z-[100] font-sans">
      <div className="flex-1" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="h-[90vh] w-full bg-[#0a0a2e] rounded-t-[2.5rem] border-t-4 border-yellow-500 relative overflow-hidden flex flex-col"
        style={{ backgroundImage: 'radial-gradient(circle at center, #1e1b4b, #020617)' }}
      >
        {/* Header Section */}
        <div className="w-full p-4 flex justify-between items-start z-20">
          <div className="bg-amber-400 text-blue-950 px-4 py-1.5 rounded-full font-bold shadow-[0_4px_0_#b45309] flex items-center gap-2">
            <span className="text-lg">🪙</span> {localCoins.toLocaleString()}
          </div>
          
          <div className="flex flex-col items-end gap-3">
             <div className="flex gap-2">
                <button className="w-9 h-9 bg-indigo-900/80 rounded-full flex items-center justify-center text-white border border-indigo-400"><Clock size={18}/></button>
                <button className="w-9 h-9 bg-indigo-900/80 rounded-full flex items-center justify-center text-white border border-indigo-400"><Volume2 size={18}/></button>
                <button className="w-9 h-9 bg-indigo-900/80 rounded-full flex items-center justify-center text-white border border-indigo-400"><HelpCircle size={18}/></button>
                <button onClick={onClose} className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg"><X size={20}/></button>
             </div>
             <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-b from-yellow-300 to-amber-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                  <span className="text-xl">💎</span>
                </div>
                <span className="text-[10px] text-white font-bold bg-red-600 px-2 rounded-full -mt-2">Drop</span>
             </div>
          </div>
        </div>

        {/* Sidebar Trophy */}
        <div className="absolute left-4 top-24 z-20 flex flex-col items-center">
           <div className="w-12 h-12 bg-gradient-to-b from-yellow-300 to-amber-600 rounded-lg border-2 border-white flex items-center justify-center shadow-lg">
              <Trophy className="text-amber-900" size={24} />
           </div>
           <span className="bg-red-600 text-[10px] text-white px-1.5 rounded-full font-bold border border-white -mt-2">99+</span>
        </div>

        {/* Main Game Arena */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          {/* Support Sticks */}
          <div className="absolute bottom-0 w-full h-full flex justify-center pointer-events-none">
             <div className="w-1 bg-amber-900/40 h-64 rotate-[15deg] origin-top translate-x-8" />
             <div className="w-1 bg-amber-900/40 h-64 -rotate-[15deg] origin-top -translate-x-8" />
          </div>

          {/* Hand Pointer */}
          {gameState === 'betting' && <HandPointer targetIdx={pointerIdx} />}

          {/* Center Timer Hub */}
          <div className="relative z-50">
            <div className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-red-600 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              <div className="flex gap-0.5 mb-1">
                {['🥦','🥬','🥕'].map((f,i)=><span key={i} className="text-[10px]">{f}</span>)}
              </div>
              <div className="w-full h-[2px] bg-yellow-400/50" />
              <span className="text-2xl font-black text-white">{timeLeft}s</span>
              <span className="text-[8px] text-white/80 uppercase font-bold tracking-widest">Wait</span>
            </div>
          </div>

          {/* Fruit Items Circle */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 120;
            const y = Math.sin((angle * Math.PI) / 180) * 120;
            const betAmount = myBets[item.id] || 0;

            return (
              <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <button 
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "w-[4.5rem] h-[4.5rem] rounded-full border-[3px] flex flex-col overflow-hidden transition-all shadow-xl",
                    "border-yellow-500 bg-amber-500",
                    highlightIdx === idx ? "scale-110 ring-4 ring-white z-30 shadow-white/50" : ""
                  )}
                >
                  <div className="flex-[1.5] bg-[#7c0000] flex items-center justify-center border-b border-yellow-500/30">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="flex-1 bg-orange-500 flex items-center justify-center">
                    <span className="text-[12px] font-black text-amber-950 italic">×{item.multiplier}</span>
                  </div>
                  <AnimatePresence>
                    {betAmount > 0 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                         <span className="bg-yellow-400 text-blue-950 text-[10px] font-black px-1 rounded">🪙{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            );
          })}

          {/* Floating Props */}
          <div className="absolute bottom-10 left-10 text-3xl opacity-80 filter drop-shadow-lg">🥗</div>
          <div className="absolute bottom-10 right-10 text-3xl opacity-80 filter drop-shadow-lg">🍕</div>
        </div>

        {/* Real History Line */}
        <div className="w-full px-4 mb-2">
           <div className="bg-orange-200/20 backdrop-blur-md rounded-xl p-1.5 flex gap-2 overflow-x-hidden border border-white/10 items-center">
              <span className="text-[10px] font-bold text-yellow-400 uppercase px-1 border-r border-white/20 mr-1">New</span>
              <div className="flex gap-2">
                {gameHistory.map((emoji, i) => (
                  <motion.div 
                    layout
                    key={`${emoji}-${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="min-w-[32px] h-8 bg-white/10 rounded-lg flex items-center justify-center text-lg shadow-inner"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
           </div>
        </div>

        {/* Chips Footer */}
        <div className="w-full bg-[#1e1b4b]/80 backdrop-blur-xl p-5 flex justify-center gap-3 border-t-2 border-yellow-600/30">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-[10px] font-black transition-all",
                "bg-gradient-to-br", chip.color,
                selectedChip === chip.value ? "scale-110 -translate-y-2 ring-4 ring-emerald-400 border-solid opacity-100" : "opacity-60"
              )}
            >
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/10">
                <span className="text-white drop-shadow-md">{chip.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Winning Overlay */}
        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-8 rounded-[2.5rem] border-4 border-white text-center shadow-2xl">
                <Trophy className="w-12 h-12 text-white mx-auto mb-2 animate-bounce" />
                <span className="text-7xl block">{winnerData.icon}</span>
                <h2 className="text-white font-black text-3xl uppercase italic">Winner!</h2>
                <div className="mt-2 bg-black/20 rounded-full py-1">
                  <p className="text-white text-3xl font-black">+{winnerData.win.toLocaleString()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
