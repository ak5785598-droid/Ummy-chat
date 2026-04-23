'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection } from 'firebase/firestore';
import { X, Trophy, Plus, Clock, Volume2, VolumeX, HelpCircle, Loader2, ArrowLeft, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- LOADING PAGE COMPONENT ---
const LoadingPage = () => (
  <motion.div 
    initial={{ y: "100%" }} animate={{ y: 0 }}
    className="h-[75vh] w-full bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden"
  >
    <div className="bg-white p-12 rounded-t-none rounded-b-[2.5rem] flex flex-col items-center justify-center shadow-2xl">
      <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-4" strokeWidth={3} />
      <h1 className="text-4xl font-black text-gray-800 tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
        Ummy
      </h1>
    </div>
  </motion.div>
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
  { value: 100, label: '100', color: 'bg-blue-600' },
  { value: 1000, label: '1K', color: 'bg-orange-500' },
  { value: 50000, label: '50K', color: 'bg-red-600' },
  { value: 100000, label: '100K', color: 'bg-purple-600' },
  { value: 500000, label: '500K', color: 'bg-cyan-500' },
  { value: 1000000, label: '1M', color: 'bg-black' },
  { value: 50000000, label: '50M', color: 'bg-emerald-900' },
  { value: 100000000, label: '100M', color: 'bg-yellow-500' },
];

const floatingVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20, rotate: 0 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,        
    rotate: 0,   
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export default function CarnivalFoodParty({ onClose, isOverlay = false }: { onClose?: () => void, isOverlay?: boolean }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const dragControls = useDragControls();

  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(100); 
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  
  const [highlightIdxs, setHighlightIdxs] = useState<number[]>([]);
  const [shineType, setShineType] = useState<'pizza' | 'salad' | null>(null);

  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false); 
  const [todayWins, setTodayWins] = useState(0); 
  const [history, setHistory] = useState(['🍎', '🍊', '🍇', '🥦', '🥕']);
  const [historyData, setHistoryData] = useState<{ icon: string, bet: number, time: string }[]>([]);
  
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
    if (gameState !== 'betting' || !currentUser) return;
    if (localCoins < selectedChip) {
      alert('You do not have any Coins!'); 
      return;
    }
    playSound(SOUNDS.BET, 0.9);
    setLocalCoins(prev => prev - selectedChip);
    const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(-selectedChip) });
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const startSpin = () => {
    setGameState('spinning');
    playSound(SOUNDS.WHIRRING, 1.0);
    
    const randomChance = Math.random() * 100;
    let winningItemsArray: any[] = [];
    let visualTargetIdx = 0;

    if (randomChance <= 2.5) {
      winningItemsArray = ITEMS.filter(item => item.multiplier > 5);
      setShineType('pizza');
      const target = winningItemsArray[Math.floor(Math.random() * winningItemsArray.length)];
      visualTargetIdx = ITEMS.indexOf(target);
    } 
    else if (randomChance > 2.5 && randomChance <= 5.0) {
      winningItemsArray = ITEMS.filter(item => item.multiplier === 5);
      setShineType('salad');
      const target = winningItemsArray[Math.floor(Math.random() * winningItemsArray.length)];
      visualTargetIdx = ITEMS.indexOf(target);
    } 
    else {
      const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      winningItemsArray = [target];
      setShineType(null);
      visualTargetIdx = ITEMS.indexOf(target);
    }

    let currentStep = 0;
    const totalSteps = 40 + visualTargetIdx; 

    const run = () => {
      setHighlightIdxs([currentStep % ITEMS.length]);
      playSound(SOUNDS.TICK, 0.3);
      if (currentStep < totalSteps) {
        currentStep++;
        setTimeout(run, 50 + (currentStep * 2));
      } else {
        const allWinningIdxs = winningItemsArray.map(item => ITEMS.indexOf(item));
        setHighlightIdxs(allWinningIdxs);
        setTimeout(() => finalizeResult(winningItemsArray), 1000);
      }
    };
    run();
  };

  const finalizeResult = (winningItems: any[]) => {
    let totalWinAmount = 0;
    let totalMyBetOnWinners = 0;

    winningItems.forEach(winItem => {
      const betOnItem = myBets[winItem.id] || 0;
      totalWinAmount += (betOnItem * winItem.multiplier);
      totalMyBetOnWinners += betOnItem;
    });
    
    setHistory(prev => [winningItems[0].icon, ...prev].slice(0, 10));

    Object.entries(myBets).forEach(([itemId, amount]) => {
      const item = ITEMS.find(i => i.id === itemId);
      if (item && amount > 0) {
        setHistoryData(prev => [{
          icon: item.icon,
          bet: amount,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);
      }
    });

    if (totalWinAmount > 0 && currentUser && firestore) {
      playSound(SOUNDS.WIN, 0.6);
      setLocalCoins(prev => prev + totalWinAmount);
      setTodayWins(prev => prev + totalWinAmount);
      
      const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(totalWinAmount) });
      
      addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
        gameId: 'fruit-party', 
        amount: totalWinAmount,
        userId: currentUser.uid,
        timestamp: new Date(),
        isGroupWin: winningItems.length > 1
      });

      const userRef = doc(firestore, 'users', currentUser.uid);
      updateDocumentNonBlocking(userRef, { 'stats.totalWins': increment(totalWinAmount) });
    }
    
    setWinnerData({ ...winningItems[0], win: totalWinAmount, myBet: totalMyBetOnWinners, isGroup: winningItems.length > 1 });
    setGameState('result');

    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinnerData(null);
      setHighlightIdxs([]);
      setShineType(null);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 bg-black/10 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingPage key="loader" />
        ) : (
          <motion.div 
            key="game"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            variants={floatingVariants}
            initial="initial"
            animate="animate"
            whileDrag={{ scale: 1.02, transition: { duration: 0.2 } }}
            className={cn(
              "h-[75vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white select-none rounded-t-none rounded-b-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
              !isOverlay && "min-h-[75vh]"
            )}
            style={{ 
              backgroundImage: 'radial-gradient(circle at top, #1e3a8a, #020617)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            }}
          >
            
            {/* HEADER */}
            <div className="w-full flex flex-col z-20">
              <div className="w-full p-4 flex justify-between items-center relative">
                <div className="flex items-center gap-2">
                  <button 
                    onPointerDown={(e) => dragControls.start(e)}
                    className="w-8 h-8 rounded-full bg-[#1e2350] border-[2px] border-[#4b558c] flex items-center justify-center text-white cursor-grab active:cursor-grabbing touch-none"
                  >
                    <Move className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </button>

                  <div className="relative flex items-center bg-[#181a4a] border border-[#2b2e63] rounded-full h-7 min-w-[105px] ml-2">
                    <div className="absolute -left-1 w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg border-2 border-[#181a4a]">
                      <span className="text-lg drop-shadow-md">🪙</span>
                    </div>
                    <span className="pl-9 pr-5 text-white font-medium text-xs tracking-wider">{localCoins.toLocaleString()}</span>
                    <button className="absolute -right-3 w-7 h-7 rounded-full bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 flex items-center justify-center text-black shadow-md border-2 border-[#181a4a]">
                      <Plus className="w-4 h-4 font-bold" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative">
                   {/* Top Right Cloud Replaced with ☁️ */}
                   <div className="absolute top-12 right-2 z-10 pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] text-xl">
                     ☁️
                  </div>
                  {[ 
                    { icon: Clock, action: () => setShowHistoryPage(true) }, 
                    { icon: isSoundOn ? Volume2 : VolumeX, action: () => setIsSoundOn(!isSoundOn) }, 
                    { icon: HelpCircle, action: () => setShowRules(true) }, 
                    { icon: X, action: onClose } 
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} className="w-8 h-8 rounded-full bg-[#1e2350] border-[2px] border-[#4b558c] flex items-center justify-center text-white">
                      <btn.icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 mt-1 relative">
                <div className="bg-black/60 border border-yellow-500/50 text-yellow-400 px-3 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-2 w-fit text-sm">
                  <span className="text-base">🏆</span> {todayWins.toLocaleString()}
                </div>
                {/* Cloud below Trophy */}
                <div className="absolute -bottom-4 left-6 text-sm opacity-80 pointer-events-none">☁️</div>
              </div>
            </div>

            {/* BOARD AREA */}
            <div className="relative w-full flex-1 flex items-center justify-center scale-90 translate-y-2" style={{ perspective: '1000px' }}>
              <svg className="absolute w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                  <linearGradient id="darkWoodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3d1a05" /> 
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
                    <line key={angle} x1="0" y1="0" x2={110 * Math.cos((angle-90)*Math.PI/180)} y2={110 * Math.sin((angle-90)*Math.PI/180)} stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
                  ))}
                </g>
              </svg>
              
              <div className="relative z-50">
                <div style={{ transformStyle: 'preserve-3d', transform: 'rotateX(20deg)' }} className="relative w-32 h-32 rounded-full p-1.5 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                  <div className="w-full h-full rounded-full bg-[#1e0701] flex flex-col items-center justify-center overflow-hidden border-4 border-black/40">
                    <div className="w-full h-1/2 bg-gradient-to-b from-red-950 to-red-900 flex items-center justify-center border-b-2 border-yellow-500/40">
                        <span className="text-4xl">🧆</span>
                    </div>
                    <div className="w-full h-1/2 bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center">
                      <span className="text-4xl font-black text-white italic">{gameState === 'betting' ? timeLeft : '...'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {ITEMS.map((item, idx) => {
                const angle = (idx * 45) - 90;
                const x = Math.cos((angle * Math.PI) / 180) * 135;
                const y = Math.sin((angle * Math.PI) / 180) * 135;
                const betAmount = myBets[item.id] || 0;
                const isHighlighted = highlightIdxs.includes(idx);

                return (
                  <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                    <button 
                      onClick={() => handlePlaceBet(item.id)}
                      style={{ transform: `rotateY(${isHighlighted ? '0deg' : '15deg'}) rotateX(10deg)` }}
                      className={cn(
                        "w-24 h-24 rounded-full border-[4px] border-yellow-500 flex flex-col overflow-hidden transition-all duration-300 relative items-center justify-center",
                        "bg-[#7f1d1d] shadow-[10px_10px_20px_rgba(0,0,0,0.5)]",
                        isHighlighted ? "scale-110 -translate-y-2 ring-[6px] ring-[#ffd700] shadow-[0_0_40px_#ffd700] z-50" : ""
                      )}
                    >
                      <div className="w-full flex-[1.2] flex items-center justify-center">
                        <span className="text-4xl drop-shadow-lg z-20">{item.icon}</span>
                      </div>
                      <AnimatePresence>
                        {betAmount > 0 && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="w-full bg-orange-500 flex items-center justify-center py-0.5 z-20">
                            <span className="text-[10px] font-black text-white">🪙{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="w-full flex-1 flex items-center justify-center bg-orange-600 z-20">
                        <span className="font-black text-[12px] text-white italic">×{item.multiplier}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM UI */}
            <div className="w-full px-4 mb-2 z-20 relative">
               <div className="flex justify-between px-1 mb-1 items-end relative">
                {/* Cloud above Salad */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] mb-[-4px] pointer-events-none opacity-80">☁️</span>
                  <span className={cn(
                    "text-4xl transition-all duration-500",
                    shineType === 'salad' ? "scale-150 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] brightness-125" : ""
                  )}>
                    🥗
                  </span>
                </div>
                {/* Cloud above Pizza */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] mb-[-4px] pointer-events-none opacity-80">☁️</span>
                  <span className={cn(
                    "text-4xl transition-all duration-500",
                    shineType === 'pizza' ? "scale-150 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] brightness-125" : ""
                  )}>
                    🍕
                  </span>
                </div>
              </div>
              <div className="w-full h-12 bg-[#3e1a05] rounded-xl border-2 border-[#f5d0a9] flex items-center px-4 gap-3 overflow-x-auto no-scrollbar">
                 <span className="text-[10px] font-bold text-[#f5d0a9] uppercase mr-2 border-r border-[#f5d0a9]/30 pr-2">History</span>
                 {history.map((icon, i) => (
                   <div key={i} className="min-w-[32px] h-8 bg-black/30 rounded-lg flex items-center justify-center text-lg">{icon}</div>
                 ))}
              </div>
            </div>

            {/* CHIPS AREA */}
            <div className="w-full bg-gradient-to-b from-[#270c01] to-[#1a0801] pt-6 pb-8 z-20 border-t-4 border-[#f5d0a9] overflow-hidden">
               <div className="flex overflow-x-auto no-scrollbar px-6 gap-4 snap-x snap-mandatory">
                {CHIPS_DATA.map(chip => (
                  <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "w-14 h-14 min-w-[56px] rounded-full flex items-center justify-center text-[10px] font-black transition-all relative shadow-[0_5px_0_rgba(0,0,0,0.6)] snap-center",
                      selectedChip === chip.value ? "scale-110 -translate-y-2 opacity-100 ring-2 ring-white/50" : "opacity-80"
                    )}
                  >
                    <div 
                      className={cn("absolute inset-0 rounded-full", chip.color)} 
                      style={{ 
                        backgroundImage: `repeating-conic-gradient(from 0deg, transparent 0deg 30deg, #ffffff 30deg 60deg)` 
                      }} 
                    />
                    
                    <div className="absolute inset-2.5 rounded-full border-2 border-dashed border-white/30 bg-inherit flex items-center justify-center overflow-hidden">
                       <div className={cn("absolute inset-0 opacity-100", chip.color)} />
                       <span className="relative text-white drop-shadow-md z-10">{chip.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* RESULTS / RULES / HISTORY PAGES */}
            <AnimatePresence>
              {gameState === 'result' && winnerData && (
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 h-[40vh] bg-[#0ea5e9] border-t-[12px] border-[#0284c7] z-[200] flex flex-col items-center justify-center">
                  <div className="absolute -top-10 bg-yellow-400 p-4 rounded-full border-4 border-white shadow-lg"><Trophy className="w-10 h-10 text-white" /></div>
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-[75%] py-6 rounded-b-[2.5rem] rounded-t-none shadow-xl flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                       <span className="text-7xl">{winnerData.icon}</span>
                       {winnerData.isGroup && <span className="text-2xl self-end font-black text-yellow-500 animate-bounce">GROUP WIN!</span>}
                    </div>
                    <span className="text-gray-800 font-black text-xl">Bet: 🪙 {(winnerData.myBet || 0).toLocaleString()}</span>
                    <div className="mt-2 bg-green-100 px-6 py-2 rounded-2xl border-2 border-green-500">
                      <span className="text-green-600 font-black text-3xl">Win: +{winnerData.win.toLocaleString()}</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {showRules && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 h-[40vh] bg-[#0ea5e9] border-t-[10px] border-[#0284c7] z-[300] flex flex-col px-6 py-8">
                <div className="flex items-center justify-center mb-6">
                  <button onClick={() => setShowRules(false)} className="absolute left-6 p-2 bg-white/20 rounded-full text-white"><ArrowLeft className="w-6 h-6" /></button>
                  <h2 className="text-white font-black text-2xl">RULES</h2>
                </div>
                <div className="text-white/95 font-semibold text-sm space-y-4">
                  <p>1. Select Chip amount</p>
                  <p>2. Put bets on Items</p>
                  <p>3. Win Amount = Bet × Multiplier</p>
                  <p className="text-yellow-200 font-bold">4. Special: Groups have a 2.5% chance to win together!</p>
                </div>
              </motion.div>
            )}

            {showHistoryPage && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[#0ea5e9] border-t-[10px] border-[#0284c7] z-[400] flex flex-col">
                <div className="p-6 flex items-center justify-between">
                  <div className="w-10" /><h2 className="text-white font-black text-2xl italic">Game history</h2>
                  <button onClick={() => setShowHistoryPage(false)} className="p-2 bg-white/20 rounded-full text-white"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 px-6 pb-6 overflow-hidden">
                  <div className="bg-white h-full rounded-b-[2.5rem] rounded-t-none p-4 overflow-y-auto no-scrollbar">
                    {historyData.map((rec, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 p-3 mb-2 rounded-2xl">
                        <span className="text-3xl">{rec.icon}</span>
                        <span className="font-black text-gray-800">🪙 {rec.bet.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400">{rec.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

