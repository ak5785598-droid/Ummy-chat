'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Trophy, Plus, Clock, Volume2, VolumeX, HelpCircle, Loader2, ArrowLeft, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- LOADING PAGE COMPONENT ---
const LoadingPage = () => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    className="h-[400px] w-full bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden rounded-[2.8rem]"
  >
    <div className="bg-white p-12 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl">
      <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-4" strokeWidth={3} />
      <h1 className="text-4xl font-black text-gray-800 tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
        Ummy
      </h1>
    </div>
  </motion.div>
);

const Cloud = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
        <feOffset dx="1" dy="2" result="offsetblur" />
        <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path filter="url(#shadow)" d="M15 40C6.71573 40 0 33.2843 0 25C0 17.0784 6.13601 10.597 13.9213 10.0536C15.8236 4.25686 21.2825 0 27.75 0C33.8643 0 39.055 3.84365 41.229 9.30907C42.433 8.46914 43.9142 8 45.5 8C49.6421 8 53 11.3579 53 15.5C53 16.0337 52.9443 16.5544 52.8385 17.0567C58.5539 18.0645 63 22.9734 63 29C63 35.0751 58.0751 40 52 40H15Z" fill="url(#cloudGrad)" />
  </svg>
);

const SOUNDS = {
  BET: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  WHIRRING: 'https://assets.mixkit.co/active_storage/sfx/731/731-preview.mp3',
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
  { value: 1000, label: '1k', color: 'from-blue-500 to-blue-700' },
  { value: 5000, label: '5K', color: 'from-green-500 to-green-700' },
  { value: 50000, label: '50K', color: 'from-purple-500 to-purple-700' },
  { value: 500000, label: '500K', color: 'from-red-500 to-red-700' },
  { value: 1000000, label: '1M', color: 'from-yellow-500 to-yellow-700' },
];

export default function CarnivalFoodParty({ onClose, isOverlay = false }: { onClose?: () => void, isOverlay?: boolean }) {
  const { user: currentUser } = useUser();
  const dragControls = useDragControls();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false); 
  const [todayWins, setTodayWins] = useState(0); 
  const [history, setHistory] = useState(['🍎', '🍊', '🍇', '🥦', '🥕']);
  const [historyData, setHistoryData] = useState<{ icon: string, bet: number, time: string }[]>([]);
  const [floatingChips, setFloatingChips] = useState<{ id: string, itemId: string, color: string }[]>([]);
  
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const soundRef = useRef(isSoundOn);

  useEffect(() => {
    soundRef.current = isSoundOn;
  }, [isSoundOn]);

  const playSound = (url: string, vol = 0.5) => {
    if (!soundRef.current) return;
    const audio = new Audio(url);
    audio.volume = vol;
    audio.play().catch(e => console.log("Sound play error:", e));
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userProfile?.wallet?.coins !== undefined && !isCoinsLoaded) {
      setLocalCoins(userProfile.wallet.coins);
      setIsCoinsLoaded(true);
    }
  }, [userProfile, isCoinsLoaded]);

  useEffect(() => {
    if (gameState !== 'betting' || isLoading) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { startSpin(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, isLoading]);

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || localCoins < selectedChip || !currentUser || !firestore) return;
    playSound(SOUNDS.BET, 0.9);
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
    setLocalCoins(prev => prev - selectedChip);
    const fullRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    updateDocumentNonBlocking(fullRef, { 'wallet.coins': increment(-selectedChip) });
  };

  const startSpin = () => {
    setGameState('spinning');
    playSound(SOUNDS.WHIRRING, 1.0);
    const winItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    let currentStep = 0;
    const totalSteps = 40 + ITEMS.indexOf(winItem);
    const run = () => {
      setHighlightIdx(currentStep % ITEMS.length);
      playSound(SOUNDS.TICK, 0.3);
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
    const betOnWinner = myBets[winItem.id] || 0;
    const winAmount = betOnWinner * winItem.multiplier;
    setHistory(prev => [winItem.icon, ...prev].slice(0, 10));
    if (winAmount > 0 && currentUser && firestore) {
      playSound(SOUNDS.WIN, 0.6);
      setLocalCoins(prev => prev + winAmount);
      setTodayWins(prev => prev + winAmount);
      const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(winAmount) });
    }
    setWinnerData({ ...winItem, win: winAmount, myBet: betOnWinner });
    setGameState('result');
    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinnerData(null);
      setHighlightIdx(null);
    }, 5000);
  };

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={isOverlay ? { opacity: 0, scale: 0.9, y: 20 } : {}}
      animate={isOverlay ? { opacity: 1, scale: 1, y: 0 } : {}}
      className={cn(
        "h-fit max-h-[95vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white select-none rounded-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
        !isOverlay && "min-h-screen"
      )}
      style={{ backgroundImage: 'radial-gradient(circle at top, #1e3a8a, #020617)' }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingPage key="loader" />
        ) : (
          <div key="game" className="flex flex-col items-center w-full">
            
            {/* HEADER */}
            <div className="w-full flex items-center justify-between p-4 pt-10 shrink-0 relative z-50">
              <div className="flex items-center gap-2">
                <button 
                  onPointerDown={(e) => dragControls.start(e)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-grab active:cursor-grabbing text-white/50"
                >
                  <Move className="h-4.5 w-4.5" />
                </button>
                <div className="relative flex items-center bg-[#181a4a] border border-[#2b2e63] rounded-full h-8 min-w-[120px]">
                  <div className="absolute -left-1 w-9 h-9 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg border-2 border-[#181a4a]">
                    <span className="text-lg drop-shadow-md">🪙</span>
                  </div>
                  <span className="pl-10 pr-4 text-white font-black text-[12px] tracking-tight">{localCoins.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setIsSoundOn(!isSoundOn)} className="w-9 h-9 rounded-full bg-[#1e2350] border-[2px] border-[#4b558c] flex items-center justify-center text-white active:scale-90 transition-all">
                  {isSoundOn ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-red-500/10 border-[2px] border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-all">
                  <X className="w-4.5 h-4.5 font-black" />
                </button>
              </div>
            </div>

            <div className="w-full px-6 flex justify-between items-center mb-4">
               <div className="bg-black/60 border border-yellow-500/50 text-yellow-400 px-3 py-1 rounded-full font-black shadow-lg flex items-center gap-2 text-[10px] uppercase tracking-widest italic">
                  <span>🏆 Today Win</span> <span>{todayWins.toLocaleString()}</span>
               </div>
               <button onClick={() => setShowHistoryPage(true)} className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors flex items-center gap-1">
                 <Clock className="w-3 h-3" /> History
               </button>
            </div>

            {/* BOARD AREA */}
            <div className="relative w-full aspect-square flex items-center justify-center scale-90" style={{ perspective: '1000px' }}>
              {ITEMS.map((item, idx) => {
                const angle = (idx * 45) - 90;
                const x = Math.cos((angle * Math.PI) / 180) * 140;
                const y = Math.sin((angle * Math.PI) / 180) * 140;
                const betAmount = myBets[item.id] || 0;

                return (
                  <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                    <button 
                      onClick={() => handlePlaceBet(item.id)}
                      className={cn(
                        "w-22 h-22 rounded-full border-[3px] border-yellow-500 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 relative bg-[#7f1d1d] shadow-2xl",
                        highlightIdx === idx ? "scale-110 -translate-y-2 ring-[6px] ring-[#ffd700] shadow-[0_0_40px_#ffd700] z-50" : ""
                      )}
                    >
                      <span className="text-3xl mb-1">{item.icon}</span>
                      <div className="w-full bg-orange-600 text-center py-0.5">
                        <span className="font-black text-[10px] text-white italic">×{item.multiplier}</span>
                      </div>
                      {betAmount > 0 && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                           <span className="text-white font-black text-[10px]">🪙{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}</span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
              
              <div className="w-32 h-32 rounded-full p-1.5 bg-gradient-to-b from-yellow-300 to-yellow-800 shadow-2xl z-20 flex items-center justify-center">
                 <div className="w-full h-full rounded-full bg-[#1e0701] border-4 border-black/40 flex flex-col items-center justify-center overflow-hidden">
                    <span className="text-xs font-black text-white/40 uppercase mb-1">{gameState === 'betting' ? 'Bet Now' : 'Spinning'}</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter">{gameState === 'betting' ? timeLeft : '🎲'}</span>
                 </div>
              </div>
            </div>

            {/* BOTTOM UI */}
            <div className="w-full p-4 mt-auto">
              <div className="w-full h-10 bg-black/40 rounded-2xl border border-white/5 flex items-center px-4 gap-3 overflow-x-auto no-scrollbar mb-6">
                 {history.map((icon, i) => (
                   <span key={i} className="text-lg opacity-80">{icon}</span>
                 ))}
              </div>

              <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar pb-6">
                {CHIPS_DATA.map(chip => (
                  <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "w-12 h-12 rounded-full border-2 transition-all relative shrink-0 shadow-lg bg-gradient-to-br",
                      chip.color,
                      selectedChip === chip.value ? "scale-110 border-white ring-4 ring-white/20 z-10 -translate-y-1" : "opacity-60 border-transparent grayscale-[0.3]"
                    )}
                  >
                    <span className="text-[9px] font-black text-white">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* WINNING OVERLAY */}
            <AnimatePresence>
              {gameState === 'result' && winnerData && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                >
                   <Trophy className="w-16 h-16 text-yellow-500 mb-4 animate-bounce" />
                   <h2 className="text-3xl font-black italic text-white mb-2 uppercase">Big Win!</h2>
                   <div className="bg-white/10 rounded-3xl p-8 border border-white/20 flex flex-col items-center gap-2">
                      <span className="text-7xl mb-2">{winnerData.icon}</span>
                      <span className="text-green-400 font-black text-4xl">+{winnerData.win.toLocaleString()}</span>
                      <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Added to Wallet</span>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </motion.div>
  );
}
