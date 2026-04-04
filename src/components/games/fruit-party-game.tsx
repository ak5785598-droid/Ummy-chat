'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Pointer, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- GAME CONSTANTS ---
const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '×5', index: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '×10', index: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '×5', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '×45', index: 3 },
  { id: 'timer', emoji: '⌛', multiplier: 0, label: '', index: 4 }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '×25', index: 5 },
  { id: 'mango', emoji: '🥭', multiplier: 6, label: '×6', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '×15', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '×5', index: 8 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'from-emerald-400 to-emerald-700' },
  { value: 5000, label: '5,000', color: 'from-rose-400 to-rose-700' },
  { value: 50000, label: '50,000', color: 'from-blue-400 to-blue-700' },
  { value: 500000, label: '500,000', color: 'from-purple-400 to-purple-700' },
];

// --- SFX HELPER ---
const playSound = (type: 'bet' | 'spin' | 'win' | 'click', muted: boolean) => {
  if (muted) return;
  const sounds: Record<string, string> = {
    bet: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    spin: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.volume = 0.4;
  audio.play().catch(() => {});
};

// --- COMPONENTS ---
const GrowingAndFallingItem = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: 0 }}
    animate={{ 
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1, 0],
      y: [0, 0, 500], 
      rotate: [0, 20, -20, 90]
    }}
    transition={{ duration: 6, repeat: Infinity, delay: delay, times: [0, 0.1, 0.8, 1] }}
    className="text-4xl filter drop-shadow-2xl absolute"
  >
    {emoji}
  </motion.div>
);

const HangingBranch = ({ side }: { side: 'left' | 'right' }) => (
  <div className={cn("absolute top-0 h-64 w-64 pointer-events-none z-50", side === 'left' ? "left-0" : "right-0 scale-x-[-1]")}>
    <svg width="250" height="200" viewBox="0 0 250 200" className="drop-shadow-2xl opacity-90">
      <path d="M0,0 Q70,20 130,90 T220,160" fill="transparent" stroke="#1b4317" strokeWidth="12" strokeLinecap="round" />
      <path d="M0,0 Q70,20 130,90 T220,160" fill="transparent" stroke="#2d5a27" strokeWidth="8" strokeLinecap="round" />
      <path d="M50,15 Q90,55 80,110" fill="transparent" stroke="#3a7a33" strokeWidth="5" />
    </svg>
    <div className="absolute top-16 left-20"><GrowingAndFallingItem emoji="🍎" delay={0} /></div>
    <div className="absolute top-28 left-36"><GrowingAndFallingItem emoji="🍃" delay={2} /></div>
    <div className="absolute top-40 left-12"><GrowingAndFallingItem emoji="🥭" delay={4} /></div>
  </div>
);

export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(500);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(['apple', 'grapes', 'orange', 'cherry']);
  const [isMuted, setIsMuted] = useState(false);
  const [hintTargetIdx, setHintTargetIdx] = useState<number>(0);
  const [balance, setBalance] = useState(43202277);

  // Hand logic
  useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
      const valid = [0, 1, 2, 3, 5, 6, 7, 8];
      setHintTargetIdx(valid[Math.floor(Math.random() * valid.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'betting') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          startSpin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || id === 'timer') return;
    if (balance < selectedChip) return;
    
    playSound('bet', isMuted);
    setBalance(prev => prev - selectedChip);
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const startSpin = useCallback(() => {
    setGameState('spinning');
    playSound('spin', isMuted);
    
    const spinSequence = [0, 1, 2, 5, 8, 7, 6, 3];
    const winningItem = ITEMS[spinSequence[Math.floor(Math.random() * spinSequence.length)]];
    const targetIdx = ITEMS.findIndex(i => i.id === winningItem.id);
    
    let currentStep = 0;
    const totalSteps = (spinSequence.length * 5) + spinSequence.indexOf(targetIdx);
    
    const run = () => {
      setHighlightIdx(spinSequence[currentStep % spinSequence.length]);
      currentStep++;
      if (currentStep < totalSteps) {
        setTimeout(run, 60 + (currentStep * 1.5));
      } else {
        finishGame(winningItem);
      }
    };
    run();
  }, [isMuted]);

  const finishGame = (winItem: any) => {
    const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
    if (winAmount > 0) {
      playSound('win', isMuted);
      setBalance(prev => prev + winAmount);
    }
    
    setGameState('result');
    setHistory(prev => [winItem.id, ...prev].slice(0, 10));
    
    setTimeout(() => {
      setMyBets({});
      setHighlightIdx(null);
      setGameState('betting');
      setTimeLeft(30);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0b0514] overflow-hidden text-white font-sans">
      
      <HangingBranch side="left" />
      <HangingBranch side="right" />

      {/* --- HEADER --- */}
      <header className="relative px-6 pt-12 flex items-center justify-between w-full z-[70]">
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl hover:bg-white/10">
          {isMuted ? <VolumeX size={24}/> : <Volume2 size={24}/>}
        </button>
        <div className="relative group">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-orange-600 tracking-tighter drop-shadow-2xl">
              FRUIT PARTY
            </h1>
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -inset-1 bg-yellow-500/20 blur-xl -z-10" />
        </div>
        <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 backdrop-blur-xl">
          <X size={24}/>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        
        {/* HISTORY */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex gap-2 bg-white/5 p-2 px-4 rounded-full border border-white/10 backdrop-blur-md">
            {history.map((id, i) => (
              <span key={i} className="text-xl filter grayscale-[0.3]">{ITEMS.find(it => it.id === id)?.emoji}</span>
            ))}
          </div>
        </div>

        {/* GRID */}
        <div className="relative w-full max-w-[380px] aspect-square">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-yellow-500/20 rounded-[4rem] blur-3xl" />
          
          <div className="relative h-full w-full bg-[#1e0d36]/90 p-5 rounded-[3.5rem] border-[6px] border-white/5 shadow-2xl overflow-hidden backdrop-blur-2xl">
            {/* Winning Overlay */}
            <AnimatePresence>
              {gameState === 'result' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-center items-center justify-center">
                  <div className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-8xl mb-4">
                      {ITEMS[highlightIdx || 0].emoji}
                    </motion.div>
                    <h2 className="text-5xl font-black text-yellow-400 italic">WINNER!</h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full w-full">
              {ITEMS.map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={gameState === 'betting' ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                  onClick={() => handlePlaceBet(item.id)}
                  className={cn(
                    "relative rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 border border-white/5",
                    "bg-gradient-to-b from-white/10 to-transparent",
                    highlightIdx === idx ? "bg-yellow-400 ring-[8px] ring-yellow-400/30 shadow-[0_0_60px_#eab308] z-20 scale-110 border-none" : ""
                  )}
                >
                  {item.id === 'timer' ? (
                    <div className="flex flex-col items-center">
                      <span className={cn("text-5xl font-black", timeLeft < 5 ? "text-red-500 animate-pulse" : "text-yellow-400")}>
                        {gameState === 'betting' ? timeLeft : '...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-[3.2rem] leading-none drop-shadow-xl">{item.emoji}</span>
                      <span className="text-[10px] font-black text-white/30 tracking-widest mt-1">{item.label}</span>
                      {myBets[item.id] > 0 && (
                        <div className="absolute -top-2 -right-1 bg-yellow-500 text-black text-[10px] px-2 py-1 rounded-lg font-black shadow-lg">
                          {(myBets[item.id] / 1000).toFixed(0)}K
                        </div>
                      )}
                    </>
                  )}
                </motion.button>
              ))}
            </div>

            {/* HAND POINTER */}
            <AnimatePresence>
              {gameState === 'betting' && (
                <motion.div
                  className="absolute z-[60] pointer-events-none"
                  transition={{ type: 'spring', damping: 20 }}
                  animate={{ 
                    left: (hintTargetIdx % 3) * 33.33 + 12 + "%", 
                    top: Math.floor(hintTargetIdx / 3) * 33.33 + 12 + "%"
                  }}
                >
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Pointer size={50} className="text-white fill-white drop-shadow-[0_0_15px_white] -rotate-45" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-gradient-to-t from-black to-[#1a0b2e] p-8 pb-12 rounded-t-[4rem] border-t border-white/10 z-20">
        <div className="max-w-md mx-auto space-y-8">
          <div className="flex justify-between gap-3">
            {CHIPS.map(chip => (
              <button 
                key={chip.value} 
                onClick={() => { setSelectedChip(chip.value); playSound('click', isMuted); }}
                className={cn(
                  "flex-1 py-4 rounded-2xl transition-all transform active:scale-95 border-b-[5px] border-black/40",
                  chip.color,
                  selectedChip === chip.value ? "ring-[4px] ring-white -translate-y-2" : "opacity-30 saturate-0"
                )}
              >
                <span className="text-white font-black text-sm">{chip.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-yellow-400 p-4 rounded-3xl rotate-12 shadow-[0_0_30px_rgba(250,204,21,0.5)]">
                    <Sparkles className="text-black" />
                </div>
                <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Your Coins</p>
                    <p className="text-3xl font-black text-yellow-400 italic tracking-tighter">
                      {balance.toLocaleString()}
                    </p>
                </div>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-white/5 flex items-center justify-center">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" />
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        body { background: #0b0514; user-select: none; }
        .flex-center { display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}
