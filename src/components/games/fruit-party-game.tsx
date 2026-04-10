'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- SOUND UTILITIES ---
const SOUNDS = {
  BET: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Trun trun
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Trick trick
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'  // Whirring Win
};

// --- UPDATED 3D WHITE GLOVE HAND POINTER ---
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
        y: y - 30 
      }}
      transition={{ 
        x: { type: "spring", stiffness: 100, damping: 12 },
        y: { type: "spring", stiffness: 100, damping: 12 },
        scale: { duration: 1, repeat: Infinity }
      }}
      className="absolute z-[100] pointer-events-none"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_8px_4px_rgba(0,0,0,0.4)]"
        >
          <path 
            d="M35 45V25C35 20.5 38.5 17 43 17C47.5 17 51 20.5 51 25V45M51 45V35C51 30.5 54.5 27 59 27C63.5 27 67 30.5 67 35V45M67 45V40C67 35.5 70.5 32 75 32C79.5 32 83 35.5 83 40V65C83 78.8 71.8 90 58 90H42C28.2 90 17 78.8 17 65V54C17 49.5 20.5 46 25 46L35 45Z" 
            fill="white"
            stroke="black"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M51 45V65" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          <path d="M67 45V65" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 22C40 20 42 19 44 19" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </motion.div>
  );
};

const ITEMS = [
  { id: 'broccoli', icon: '🥦', multiplier: 10 },
  { id: 'lettuce', icon: '🥬', multiplier: 15 },
  { id: 'carrot', icon: '🥕', multiplier: 25 },
  { id: 'corn', icon: '🌽', multiplier: 45 },
  { id: 'tomato', icon: '🍅', multiplier: 5 },
  { id: 'coconut', icon: '🥥', multiplier: 5 },
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
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false);
  
  const [todayWins, setTodayWins] = useState(0); 
  const [pointerIdx, setPointerIdx] = useState(0);
  const [history, setHistory] = useState<string[]>(['🍎', '🍊', '🍇', '🥦', '🥕']);

  // Ref for playing sounds to ensure they work reliably
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (url: string) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Sound play blocked or error:", e));
    } catch (err) {
      console.log("Audio Error:", err);
    }
  };

  useEffect(() => {
    if (userProfile?.wallet?.coins !== undefined && !isCoinsLoaded) {
      setLocalCoins(userProfile.wallet.coins);
      setIsCoinsLoaded(true);
    }
  }, [userProfile, isCoinsLoaded]);

  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      if (istTime.getUTCHours() === 0 && istTime.getUTCMinutes() === 0) {
        setTodayWins(0);
      }
    };
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, []);

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
        if (prev <= 1) { 
          startSpin(); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || localCoins < selectedChip) return;
    
    // Play "Trun trun" sound
    playSound(SOUNDS.BET);

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
      
      // Play "Tick tick" sound every step
      playSound(SOUNDS.TICK);

      if (currentStep < totalSteps) {
        currentStep++;
        // Gradually slow down the spin
        const delay = 50 + (currentStep * 2);
        setTimeout(run, delay);
      } else {
        setTimeout(() => finalizeResult(winItem), 1000);
      }
    };
    run();
  };

  const finalizeResult = (winItem: any) => {
    // FIX: Bet × Multiplier Logic
    const betOnWinner = myBets[winItem.id] || 0;
    const winAmount = betOnWinner * winItem.multiplier;
    
    setHistory(prev => [winItem.icon, ...prev].slice(0, 10));

    if (winAmount > 0) {
      // Play "Whirring/Win" sound
      playSound(SOUNDS.WIN);
      
      setLocalCoins(prev => prev + winAmount);
      setTodayWins(prev => prev + winAmount);
      
      // Real-time Firebase Sync
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 
        'wallet.coins': increment(winAmount) 
      });
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
        <div className="w-full p-6 flex justify-between items-start z-20">
          <div className="flex flex-col gap-2">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-blue-950 px-5 py-1.5 rounded-full font-black shadow-lg flex items-center gap-2">
              <span className="text-xl">🪙</span> {localCoins.toLocaleString()}
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-yellow-500/50 text-yellow-400 px-4 py-1 rounded-full font-bold shadow-lg flex items-center gap-2 w-fit">
              <span className="text-lg">🏆</span> {todayWins.toLocaleString()}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <button onClick={onClose} className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
              <X className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-b from-purple-400 to-purple-800 rounded-full flex items-center justify-center text-2xl shadow-xl border-2 border-purple-300 animate-pulse">
              🪩
            </div>
          </div>
        </div>

        <div className="relative w-full flex-1 flex items-center justify-center scale-95 -translate-y-6" style={{ perspective: '1000px' }}>
          
          <svg className="absolute w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <linearGradient id="darkWoodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3d1a05" /> 
                <stop offset="50%" stopColor="#2a1002" />
                <stop offset="100%" stopColor="#1a0801" />
              </linearGradient>
            </defs>
            <g transform="translate(175, 175)">
              <line x1="0" y1="20" x2="-120" y2="450" stroke="#f5d0a9" strokeWidth="24" strokeLinecap="round" />
              <line x1="0" y1="20" x2="-120" y2="450" stroke="url(#darkWoodGradient)" strokeWidth="14" strokeLinecap="round" />
              <line x1="0" y1="20" x2="120" y2="450" stroke="#f5d0a9" strokeWidth="24" strokeLinecap="round" />
              <line x1="0" y1="20" x2="120" y2="450" stroke="url(#darkWoodGradient)" strokeWidth="14" strokeLinecap="round" />
            </g>
          </svg>

          <svg className="absolute w-[350px] h-[350px] pointer-events-none overflow-visible">
            <g transform="translate(175, 175)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line 
                  key={angle} 
                  x1="0" y1="0" 
                  x2={110 * Math.cos((angle-90)*Math.PI/180)} 
                  y2={110 * Math.sin((angle-90)*Math.PI/180)} 
                  stroke="#fbbf24" strokeWidth="6" strokeLinecap="round"
                />
              ))}
            </g>
          </svg>
          
          {gameState === 'betting' && <HandPointer targetIdx={pointerIdx} />}

          <div className="relative z-50">
            <div className="absolute inset-[-15px] rounded-full bg-yellow-500/20 blur-xl animate-pulse" />
            <div 
              style={{ transformStyle: 'preserve-3d', transform: 'rotateX(20deg)' }}
              className="relative w-32 h-32 rounded-full p-1.5 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.5)]"
            >
              <div className="w-full h-full rounded-full bg-[#1e0701] flex flex-col items-center justify-center overflow-hidden border-4 border-black/40 relative">
                <div className="w-full h-1/2 bg-gradient-to-b from-red-950 to-red-900 flex items-center justify-center border-b-2 border-yellow-500/40 relative z-20">
                    <motion.span 
                      animate={{ y: [0, -4, 0], scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} 
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} 
                      className="text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                    >
                      🧆
                    </motion.span>
                </div>
                <div className="w-full h-1/2 bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center relative z-20">
                  <span className="text-5xl font-black text-white italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tighter">
                    {gameState === 'betting' ? timeLeft : '...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

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

        <div className="w-full px-4 mb-2 z-20 relative">
          <div className="flex justify-between px-1 mb-1 items-end">
            <span className="text-4xl drop-shadow-lg">🥗</span>
            <span className="text-4xl drop-shadow-lg">🍕</span>
          </div>
          <div className="w-full h-12 bg-[#3e1a05] rounded-xl border-2 border-[#f5d0a9] flex items-center px-4 gap-3 overflow-x-auto no-scrollbar shadow-inner">
             <span className="text-[10px] font-bold text-[#f5d0a9] uppercase mr-2 border-r border-[#f5d0a9]/30 pr-2">History</span>
             {history.map((icon, i) => (
               <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={i} className="min-w-[32px] h-8 bg-black/30 rounded-lg flex items-center justify-center text-lg shadow-sm">
                 {icon}
               </motion.div>
             ))}
          </div>
        </div>

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

        <AnimatePresence>
          {gameState === 'result' && winnerData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80">
              <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="bg-gradient-to-b from-yellow-400 to-orange-600 p-10 rounded-[3rem] border-8 border-white text-center shadow-2xl">
                <Trophy className="w-16 h-16 text-white mx-auto mb-2 animate-bounce" />
                <span className="text-8xl block mb-2">{winnerData.icon}</span>
                <h2 className="text-white font-black text-4xl italic uppercase">WINNER!</h2>
                <div className="mt-4 bg-white/20 py-2 px-8 rounded-full">
                  {/* DISPLAYING REAL-TIME WINNING AMOUNT (Bet x Multiplier) */}
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
