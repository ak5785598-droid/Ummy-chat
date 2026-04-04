'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Pointer, Trophy, Star, Crown, Coins, Zap, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONSTANTS ---
const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5' },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '×10' },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '×5' },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '×45' },
  { id: 'timer', emoji: '⌛', multiplier: 0, label: '' }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '×25' },
  { id: 'mango', emoji: '🥭', multiplier: 6, label: '×6' },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15' },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5' },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/50' },
  { value: 5000, label: '5k', color: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-500/50' },
  { value: 50000, label: '50k', color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/50' },
  { value: 500000, label: '500k', color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/50' },
];

const TOP_WINNERS = [
  { name: 'Player_882', amount: '2.5M', rank: 2, color: 'text-gray-300' },
  { name: 'Winner_Pro', amount: '5.0M', rank: 1, color: 'text-yellow-400' },
  { name: 'Lucky_Ace', amount: '1.2M', rank: 3, color: 'text-orange-400' },
];

export default function FruitPartyGame() {
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [balance, setBalance] = useState(43202277);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(500);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(['apple', 'grapes', 'mango', 'cherry', 'lemon']);
  const [winner, setWinner] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState<{id: number, x: number, y: number}[]>([]);
  
  // NEW: Dynamic Username Placeholder
  const [displayName, setDisplayName] = useState("PLAYER_1");

  const [handIdx, setHandIdx] = useState(0);
  const handSequence = [0, 1, 2, 5, 8, 7, 6, 3];

  const playSfx = (type: 'chip' | 'win' | 'tick') => {
    if (isMuted) return;
    const sounds = {
      chip: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      tick: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
    };
    new Audio(sounds[type]).play().catch(() => {});
  };

  useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
      setHandIdx((prev) => (prev + 1) % handSequence.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'betting') return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 5 && p > 0) playSfx('tick');
        if (p <= 1) { startSpin(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState]);

  const handlePlaceBet = (e: React.MouseEvent, id: string) => {
    if (gameState !== 'betting' || id === 'timer' || balance < selectedChip) return;
    
    playSfx('chip');
    setBalance(p => p - selectedChip);
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
    
    const newCoin = { id: Date.now(), x: e.clientX, y: e.clientY };
    setFloatingCoins(prev => [...prev, newCoin]);
    setTimeout(() => setFloatingCoins(prev => prev.filter(c => c.id !== newCoin.id)), 800);
  };

  const startSpin = () => {
    setGameState('spinning');
    const spinSequence = [0, 1, 2, 5, 8, 7, 6, 3];
    const winItem = ITEMS[spinSequence[Math.floor(Math.random() * spinSequence.length)]];
    let current = 0;
    const totalSteps = 40 + spinSequence.indexOf(ITEMS.findIndex(i => i.id === winItem.id));
    
    const run = () => {
      setHighlightIdx(spinSequence[current % spinSequence.length]);
      current++;
      if (current < totalSteps) {
        setTimeout(run, 50 + current * 2);
      } else {
        setTimeout(() => {
          const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
          if (winAmount > 0) playSfx('win');
          setWinner({ ...winItem, amount: winAmount });
          setBalance(p => p + winAmount);
          setGameState('result');
          setHistory(prev => [winItem.id, ...prev].slice(0, 10));
          
          setTimeout(() => {
            setGameState('betting');
            setMyBets({});
            setWinner(null);
            setHighlightIdx(null);
            setTimeLeft(15);
          }, 5000);
        }, 800);
      }
    };
    run();
  };

  return (
    <div className="fixed inset-0 bg-[#06030a] flex flex-col text-white overflow-hidden font-sans selection:bg-none">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[120px] rounded-full" />

      {/* --- HEADER --- */}
      <header className="p-6 pt-10 flex justify-between items-center z-50">
        <button onClick={() => setIsMuted(!isMuted)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <div className="text-center">
            <h1 className="text-4xl font-black italic bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-yellow-500 to-orange-600 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">FRUIT PARTY</h1>
            <div className="flex items-center justify-center gap-1 mt-1">
                <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Live Rewards</span>
            </div>
        </div>
        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 text-red-500"><X /></div>
      </header>

      {/* --- HISTORY --- */}
      <div className="flex justify-center px-6 mb-2">
        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-2 px-4 rounded-2xl flex gap-4 overflow-hidden">
            {history.map((h, i) => (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-xl filter drop-shadow-sm grayscale-[0.3]">
                    {ITEMS.find(it => it.id === h)?.emoji}
                </motion.div>
            ))}
        </div>
      </div>

      {/* --- GRID --- */}
      <main className="flex-1 flex items-center justify-center relative p-6">
        <div className="relative p-[10px] rounded-[3.5rem] bg-gradient-to-tr from-blue-600 via-purple-500 to-pink-500 shadow-[0_0_80px_rgba(139,92,246,0.3)]">
          <div className="bg-[#0f071a] p-5 rounded-[3rem] grid grid-cols-3 gap-3 w-[360px] aspect-square relative overflow-hidden border border-white/10">
            {ITEMS.map((item, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handlePlaceBet(e, item.id)}
                className={cn(
                  "relative rounded-[2.5rem] flex flex-col items-center justify-center border border-white/5 transition-all duration-300",
                  highlightIdx === idx ? "bg-yellow-400 scale-110 z-20 shadow-[0_0_50px_#fbbf24]" : "bg-white/[0.03]"
                )}
              >
                {item.id === 'timer' ? (
                    <motion.span animate={{ scale: timeLeft < 5 ? [1, 1.3, 1] : 1 }} className={cn("text-5xl font-black", timeLeft < 5 ? "text-red-500" : "text-yellow-400")}>
                        {gameState === 'betting' ? timeLeft : '!!!'}
                    </motion.span>
                ) : (
                  <>
                    <span className={cn("text-4xl mb-1", highlightIdx === idx ? "scale-125 brightness-125" : "")}>{item.emoji}</span>
                    <span className={cn("text-[10px] font-black uppercase", highlightIdx === idx ? "text-black" : "opacity-30")}>{item.label}</span>
                    <AnimatePresence>
                        {myBets[item.id] > 0 && (
                        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-2 bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-0.5 rounded-full text-[9px] font-black">
                            {(myBets[item.id]/1000).toFixed(1)}k
                        </motion.div>
                        )}
                    </AnimatePresence>
                  </>
                )}
              </motion.button>
            ))}

            {/* HAND POINTER */}
            <AnimatePresence>
              {gameState === 'betting' && (
                <motion.div
                  key="hand-pointer"
                  transition={{ type: "spring", stiffness: 80, damping: 12 }}
                  animate={{ 
                    left: (handSequence[handIdx] % 3) * 33.3 + 12 + "%", 
                    top: Math.floor(handSequence[handIdx] / 3) * 33.3 + 12 + "%" 
                  }}
                  className="absolute pointer-events-none z-[60]"
                >
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Pointer size={56} className="text-white fill-white drop-shadow-[0_0_20px_white] -rotate-45" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {floatingCoins.map(coin => (
            <motion.div key={coin.id} initial={{ x: coin.x, y: coin.y, opacity: 1 }} animate={{ y: coin.y - 100, opacity: 0 }} className="fixed z-[100] text-yellow-400 font-bold">🪙</motion.div>
        ))}
      </main>

      {/* --- FOOTER --- */}
      <footer className="p-8 pb-10 bg-[#0d0617] rounded-t-[4rem] border-t border-white/5 shadow-2xl">
        <div className="flex justify-between gap-3 mb-8 max-w-md mx-auto">
          {CHIPS.map(chip => (
            <button
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "flex-1 h-16 rounded-full flex flex-col items-center justify-center font-black text-xs border-[3px] border-black/20 transition-all",
                `bg-gradient-to-br ${chip.color} ${chip.shadow}`,
                selectedChip === chip.value ? "ring-4 ring-white -translate-y-3 scale-110" : "opacity-30 brightness-75"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* --- DYNAMIC USER INFO --- */}
        <div className="bg-white/[0.05] p-5 px-8 rounded-[2.5rem] border border-white/10 flex items-center justify-between backdrop-blur-2xl max-w-md mx-auto">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-3xl rotate-12 flex items-center justify-center shadow-lg">
                <Coins className="text-black" size={28} />
             </div>
             <div>
               <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Balance</p>
               <motion.p key={balance} className="text-3xl font-black text-yellow-400 italic">
                {balance.toLocaleString()}
               </motion.p>
             </div>
           </div>
           <div className="text-right flex flex-col items-end">
             {/* USER NAME REPLACED GOLU */}
             <div className="flex items-center gap-2 mb-1">
                <User size={12} className="text-white/40" />
                <span className="text-[10px] font-black px-3 py-1 bg-white/5 rounded-full text-white/60 tracking-widest">
                    ID: {displayName}
                </span>
             </div>
             <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-bold text-green-500 uppercase">Online</span>
             </div>
           </div>
        </div>
      </footer>

      {/* --- RESULT OVERLAY --- */}
      <AnimatePresence>
        {gameState === 'result' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative">
               <Trophy size={120} className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_40px_rgba(234,179,8,0.6)]" />
               <h2 className="text-7xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-yellow-100 via-yellow-400 to-orange-600 leading-tight">
                {winner?.amount > 0 ? 'BIG WIN!' : 'NEXT TIME'}
               </h2>
               <div className="text-9xl my-8">{winner?.emoji}</div>
               {winner?.amount > 0 && (
                 <div className="bg-yellow-400 text-black px-10 py-4 rounded-[2.5rem] text-4xl font-black">
                    +🪙 {winner?.amount.toLocaleString()}
                 </div>
               )}
            </motion.div>

            <div className="w-full max-w-sm mt-16 space-y-3">
              <p className="font-black text-[10px] opacity-30 uppercase tracking-[0.3em] mb-4">Round Leaders</p>
              {TOP_WINNERS.map((w, i) => (
                <div key={i} className={cn("flex items-center justify-between p-4 rounded-3xl border border-white/5 bg-white/5", w.rank === 1 && "border-yellow-500/30 bg-white/10")}>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-2xl font-black", w.color)}>#{w.rank}</span>
                    <span className="font-bold opacity-80">{w.name}</span>
                  </div>
                  <span className="font-black text-yellow-400">🪙 {w.amount}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
