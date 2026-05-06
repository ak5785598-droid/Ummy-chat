'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection } from 'firebase/firestore';
import { X, Trophy, Plus, Clock, Volume2, VolumeX, HelpCircle, Loader2, ArrowLeft, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- DOLLAR COIN ICON (3D Glossy, No Emoji) - Same as before ---
const DollarCoin = ({ className = "w-4 h-4", showValue = false, amount = 0 }) => {
  if (showValue) {
    return (
      <div className="flex items-center gap-0.5">
        <div className={cn("relative inline-flex items-center justify-center", className)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
              <radialGradient id="coinGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="60%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#A16207" />
              </radialGradient>
              <linearGradient id="coinShine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" fill="url(#coinGrad)" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="10" fill="url(#coinShine)" />
            <text x="12" y="17" textAnchor="middle" fill="#422006" fontSize="14" fontWeight="900" fontFamily="sans-serif" stroke="#713F12" strokeWidth="0.3">$</text>
          </svg>
        </div>
        <span className="font-bold text-xs">{amount.toLocaleString()}</span>
      </div>
    );
  }
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        <defs>
          <radialGradient id="coinGradSm" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="60%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </radialGradient>
          <linearGradient id="coinShineSm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#coinGradSm)" stroke="#B45309" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="10" fill="url(#coinShineSm)" />
        <text x="12" y="17" textAnchor="middle" fill="#422006" fontSize="14" fontWeight="900" fontFamily="sans-serif" stroke="#713F12" strokeWidth="0.3">$</text>
      </svg>
    </div>
  );
};

// --- AMOUNT WITH DOLLAR COIN (Scaled text) ---
const CoinAmount = ({ amount, className = "" }) => {
  const formatted = amount >= 1000 ? `${(amount / 1000).toFixed(1)}K` : amount.toString();
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <DollarCoin className="w-2.5 h-2.5" />
      <span className="text-[8px] font-black text-white">{formatted}</span>
    </div>
  );
};

// --- HELPERS ---
const formatKandM = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const MockConfetti = ({ show }) => {
  if (!show) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="w-1 h-1 bg-yellow-500 absolute top-10 left-10 animate-ping rounded-full" />
      <div className="w-1 h-1 bg-blue-500 absolute top-20 right-20 animate-ping rounded-full delay-100" />
      <div className="w-1 h-1 bg-green-500 absolute bottom-10 left-20 animate-ping rounded-full delay-200" />
    </div>
  );
};

// --- LOADING PAGE with 50vh height (unchanged except height) ---
const LoadingPage = () => (
  <motion.div 
    initial={{ y: "100%" }} animate={{ y: 0 }}
    className="h-[50vh] w-full bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden"
  >
    <div className="bg-white p-8 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl">
      <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-3" strokeWidth={3} />
      <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Ummy</h1>
    </div>
  </motion.div>
);

const Cloud = ({ className }) => (
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

const floatingVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20, rotate: 0 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,        
    rotate: 0,   
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export default function CarnivalFoodParty({ onClose, isOverlay = false }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const dragControls = useDragControls();

  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(1000); 
  const [myBets, setMyBets] = useState({});
  
  const [highlightIdxs, setHighlightIdxs] = useState([]);
  const [shineType, setShineType] = useState(null);

  const [winnerData, setWinnerData] = useState(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false); 
  const [todayWins, setTodayWins] = useState(0); 
  const [history, setHistory] = useState(['🍎', '🍊', '🍇', '🥦', '🥕']);
  const [historyData, setHistoryData] = useState([]);
  
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const soundRef = useRef(isSoundOn);

  const [activeRoundId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  useEffect(() => {
    soundRef.current = isSoundOn;
  }, [isSoundOn]);

  const playSound = (url, vol = 0.5) => {
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

  const handlePlaceBet = (id) => {
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
    let winningItemsArray = [];
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

  const finalizeResult = (winningItems) => {
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

  const winnersList = [
    { name: "You", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You", win: winnerData?.win || 0 },
    { name: "Bot1", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bot1", win: (winnerData?.win || 0) > 0 ? (winnerData.win * 0.8) : 5000 },
    { name: "Bot2", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bot2", win: (winnerData?.win || 0) > 0 ? (winnerData.win * 0.5) : 2000 },
  ];

  // Glossy 3D button - scaled down
  const glossyIconClass = "w-7 h-7 rounded-full bg-gradient-to-br from-[#2a2f5e] to-[#13163a] border-[1.5px] border-[#6b73b0] shadow-[0_2px_5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center text-white transition-all active:scale-95";

  return (
    <div className="fixed inset-0 bg-black/10 flex flex-col justify-center items-center z-[100] p-2">
      <div className="absolute inset-0" onClick={onClose} />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingPage />
        ) : (
          <motion.div 
            key="game"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
            whileDrag={{ scale: 1.01, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.8)", transition: { duration: 0.1 } }}
            variants={floatingVariants}
            initial="initial"
            animate="animate"
            className={cn(
              "h-[50vh] w-auto aspect-square max-w-[500px] flex flex-col relative overflow-hidden bg-[#020617] text-white select-none rounded-[2rem] border border-white/20 shadow-2xl transition-all duration-300 will-change-transform"
            )}
            style={{ 
              backgroundImage: 'radial-gradient(circle at top, #1e3a8a, #020617)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)' 
            }}
          >
            
            {/* HEADER - padding reduced */}
            <div className="w-full flex flex-col z-20">
              <div className="w-full p-2 flex justify-between items-center relative">
                <div className="flex items-center gap-1.5">
                  <button 
                    onPointerDown={(e) => dragControls.start(e)}
                    className={glossyIconClass + " cursor-grab active:cursor-grabbing touch-none"}
                  >
                    <Move className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>

                  <div className="relative flex items-center bg-[#181a4a] border border-[#2b2e63] rounded-full h-6 min-w-[85px] ml-1 shadow-inner">
                    <div className="absolute -left-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg border-2 border-[#181a4a]">
                      <DollarCoin className="w-3.5 h-3.5" />
                    </div>
                    <span className="pl-7 pr-3 text-white font-medium text-[10px] tracking-wider">{localCoins.toLocaleString()}</span>
                    <button className="absolute -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 flex items-center justify-center text-black shadow-md border-2 border-[#181a4a]">
                      <Plus className="w-3 h-3 font-bold" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 relative">
                   <div className="absolute top-8 right-1 z-10 pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                     <Cloud className="w-20 h-auto" />
                  </div>
                  {[ 
                    { icon: Clock, action: () => setShowHistoryPage(true) }, 
                    { icon: isSoundOn ? Volume2 : VolumeX, action: () => setIsSoundOn(!isSoundOn) }, 
                    { icon: HelpCircle, action: () => setShowRules(true) }, 
                    { icon: X, action: onClose } 
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} className={glossyIconClass}>
                      <btn.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 mt-0 relative">
                <div className="bg-black/60 border border-yellow-500/50 text-yellow-400 px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1 w-fit text-[10px]">
                  <span className="text-xs">🏆</span> {todayWins.toLocaleString()}
                </div>
                <div className="absolute top-6 left-4 z-10 pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                   <Cloud className="w-10 h-auto" />
                </div>
              </div>
            </div>

            {/* BOARD AREA - scaled down positions */}
            <div className="relative w-full flex-1 flex items-center justify-center scale-[0.85] -mt-2" style={{ perspective: '800px' }}>
              <svg className="absolute w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                  <linearGradient id="darkWoodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3d1a05" /> 
                    <stop offset="100%" stopColor="#1a0801" />
                  </linearGradient>
                </defs>
                <g transform="translate(140, 140)">
                  <line x1="0" y1="15" x2="-95" y2="360" stroke="#f5d0a9" strokeWidth="18" strokeLinecap="round" />
                  <line x1="0" y1="15" x2="-95" y2="360" stroke="url(#darkWoodGradient)" strokeWidth="10" strokeLinecap="round" />
                  <line x1="0" y1="15" x2="95" y2="360" stroke="#f5d0a9" strokeWidth="18" strokeLinecap="round" />
                  <line x1="0" y1="15" x2="95" y2="360" stroke="url(#darkWoodGradient)" strokeWidth="10" strokeLinecap="round" />
                </g>
              </svg>

              <svg className="absolute w-[280px] h-[280px] pointer-events-none overflow-visible">
                <g transform="translate(140, 140)">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line key={angle} x1="0" y1="0" x2={88 * Math.cos((angle-90)*Math.PI/180)} y2={88 * Math.sin((angle-90)*Math.PI/180)} stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  ))}
                </g>
              </svg>
              
              <div className="relative z-50">
                <div style={{ transformStyle: 'preserve-3d', transform: 'rotateX(20deg)' }} className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                  <div className="w-full h-full rounded-full bg-[#1e0701] flex flex-col items-center justify-center overflow-hidden border-2 border-black/40">
                    <div className="w-full h-1/2 bg-gradient-to-b from-red-950 to-red-900 flex items-center justify-center border-b border-yellow-500/40">
                        <span className="text-xl">🧆</span>
                    </div>
                    <div className="w-full h-1/2 bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center">
                      <span className="text-xl font-black text-white italic">{gameState === 'betting' ? timeLeft : '...'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {ITEMS.map((item, idx) => {
                const angle = (idx * 45) - 90;
                const x = Math.cos((angle * Math.PI) / 180) * 92;
                const y = Math.sin((angle * Math.PI) / 180) * 92;
                const betAmount = myBets[item.id] || 0;
                const isHighlighted = highlightIdxs.includes(idx);

                return (
                  <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                    <button 
                      onClick={() => handlePlaceBet(item.id)}
                      style={{ transform: `rotateY(${isHighlighted ? '0deg' : '15deg'}) rotateX(10deg)` }}
                      className={cn(
                        "w-14 h-14 rounded-full border-[2px] border-yellow-500 flex flex-col overflow-hidden transition-all duration-300 relative items-center justify-center",
                        "bg-[#7f1d1d] shadow-[6px_6px_12px_rgba(0,0,0,0.5)]",
                        isHighlighted ? "scale-110 -translate-y-1 ring-[4px] ring-[#ffd700] shadow-[0_0_20px_#ffd700] z-50" : ""
                      )}
                    >
                      <div className="w-full flex-[1.2] flex items-center justify-center">
                        <span className="text-xl drop-shadow-lg z-20">{item.icon}</span>
                      </div>
                      <AnimatePresence>
                        {betAmount > 0 && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="w-full bg-orange-500 flex items-center justify-center py-0.5 z-20">
                            <CoinAmount amount={betAmount} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="w-full flex-1 flex items-center justify-center bg-orange-600 z-20">
                        <span className="font-black text-[8px] text-white italic">×{item.multiplier}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM UI */}
            <div className="w-full px-2 pb-1 z-20 relative">
               <div className="flex justify-between px-1 mb-0 items-end relative">
                <div className="absolute -top-10 left-0 z-10 pointer-events-none"> <Cloud className="w-16 h-auto" /> </div>
                <span className={cn(
                  "text-xl relative z-20 transition-all duration-500",
                  shineType === 'salad' ? "scale-125 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] brightness-125" : ""
                )}>
                  🥗
                </span>
                <div className="absolute -top-10 right-0 z-10 pointer-events-none"> <Cloud className="w-16 h-auto" /> </div>
                <span className={cn(
                  "text-xl relative z-20 transition-all duration-500",
                  shineType === 'pizza' ? "scale-125 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] brightness-125" : ""
                )}>
                  🍕
                </span>
              </div>
              <div className="w-full h-7 bg-[#3e1a05] rounded-lg border border-[#f5d0a9] flex items-center px-2 gap-2 overflow-x-auto no-scrollbar">
                 <span className="text-[8px] font-bold text-[#f5d0a9] uppercase mr-1 border-r border-[#f5d0a9]/30 pr-1">History</span>
                 {history.map((icon, i) => (
                   <div key={i} className="min-w-[22px] h-5 bg-black/30 rounded-md flex items-center justify-center text-xs">{icon}</div>
                 ))}
              </div>
            </div>

            {/* CHIPS AREA */}
            <div className="w-full bg-gradient-to-b from-[#270c01] to-[#1a0801] px-3 py-2 flex justify-center gap-2 z-20 border-t-2 border-[#f5d0a9]">
              {CHIPS_DATA.map(chip => (
                <button 
                  key={chip.value}
                  onClick={() => setSelectedChip(chip.value)}
                  className={cn(
                    "w-8 h-8 rounded-full border border-dashed border-white/40 flex items-center justify-center text-[6px] font-black transition-all relative bg-gradient-to-br shadow-[0_2px_0_rgba(0,0,0,0.4)]",
                    chip.color,
                    selectedChip === chip.value ? "scale-110 -translate-y-1 ring-2 ring-yellow-400 border-solid opacity-100" : "opacity-70"
                  )}
                >
                  <div className="absolute inset-0.5 rounded-full border border-white/20 bg-black/10 flex items-center justify-center">
                    <span className="text-white text-[8px]">{chip.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* WINNER MODAL - same but scaled if needed (already responsive) */}
            <AnimatePresence>
              {gameState === 'result' && winnerData && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 z-[250] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
                >
                  <div className="winning-card-premium w-full max-w-sm relative overflow-hidden" style={{
                    background: 'linear-gradient(165deg, #1a1c1e 0%, #0a0a0b 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '28px',
                    padding: '18px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                  }}>
                    <MockConfetti show={winnerData.win > 0} />
                    <div className="text-center mb-4 pt-2 relative z-10">
                      <motion.h2 initial={{ y: -20 }} animate={{ y: 0 }} className="text-yellow-400 font-black italic text-2xl tracking-tighter">
                        {winnerData.win > 0 ? "BIG WINNER!" : "BET SETTLED"}
                      </motion.h2>
                      <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-1" />
                    </div>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mb-4 backdrop-blur-md">
                      <div>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase">Winning Animal</span>
                        <span className="text-4xl mt-1 block">{winnerData.icon}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase">Total Prize</span>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <DollarCoin className="w-5 h-5" />
                          <span className="text-2xl font-black text-emerald-400">{winnerData.win.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-end mt-2 h-36 relative z-10">
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-12 mb-1">
                          <img src={winnersList[1]?.avatar} className="w-full h-full rounded-full border border-slate-300 object-cover p-0.5" alt=""/>
                          <div className="absolute -top-1 -right-1 bg-slate-300 text-slate-800 text-[8px] font-black px-1 rounded-full">2</div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 truncate">{winnersList[1]?.name}</span>
                        <span className="text-[9px] font-black text-white">{formatKandM(winnersList[1]?.win)}</span>
                      </div>
                      <div className="flex flex-col items-center scale-105 -translate-y-2">
                        <div className="relative w-14 h-14 mb-1">
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xl">👑</div>
                          <img src={winnersList[0]?.avatar} className="w-full h-full rounded-full border-2 border-yellow-500 object-cover p-0.5" alt=""/>
                        </div>
                        <span className="text-[10px] font-black text-yellow-400 truncate">You</span>
                        <span className="text-[11px] font-black text-white">{formatKandM(winnersList[0]?.win)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-12 mb-1">
                          <img src={winnersList[2]?.avatar} className="w-full h-full rounded-full border border-orange-700 object-cover p-0.5" alt=""/>
                          <div className="absolute -top-1 -right-1 bg-orange-700 text-white text-[8px] font-black px-1 rounded-full">3</div>
                        </div>
                        <span className="text-[9px] font-bold text-orange-400 truncate">{winnersList[2]?.name}</span>
                        <span className="text-[9px] font-black text-white">{formatKandM(winnersList[2]?.win)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[8px] opacity-60">
                      <span>Round ID: #{activeRoundId}</span>
                      <span>Forest Party 2026</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* RULES PAGE - scaled */}
            {showRules && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 h-[40vh] bg-[#0ea5e9] border-t-[6px] border-[#0284c7] z-[300] flex flex-col px-4 py-4">
                <div className="flex items-center justify-center mb-3">
                  <button onClick={() => setShowRules(false)} className="absolute left-4 p-1.5 bg-white/20 rounded-full text-white"><ArrowLeft className="w-5 h-5" /></button>
                  <h2 className="text-white font-black text-xl">RULES</h2>
                </div>
                <div className="text-white/95 font-semibold text-xs space-y-2">
                  <p>1. Select Chip amount</p>
                  <p>2. Put bets on Items</p>
                  <p>3. Win Amount = Bet × Multiplier</p>
                  <p className="text-yellow-200 font-bold">4. Special: Groups have a 2.5% chance to win together!</p>
                </div>
              </motion.div>
            )}

            {/* HISTORY PAGE - scaled */}
            {showHistoryPage && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 h-[55vh] bg-[#0ea5e9] border-t-[6px] border-[#0284c7] z-[400] flex flex-col">
                <div className="p-4 flex items-center justify-between">
                  <div className="w-6" /><h2 className="text-white font-black text-xl italic">Game history</h2>
                  <button onClick={() => setShowHistoryPage(false)} className="p-1.5 bg-white/20 rounded-full text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 px-4 pb-4 overflow-hidden">
                  <div className="bg-white h-full rounded-2xl p-3 overflow-y-auto no-scrollbar">
                    {historyData.map((rec, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 p-2 mb-2 rounded-xl">
                        <span className="text-2xl">{rec.icon}</span>
                        <div className="flex items-center gap-0.5 font-black text-gray-800 text-xs">
                          <DollarCoin className="w-3 h-3" />
                          <span>{rec.bet.toLocaleString()}</span>
                        </div>
                        <span className="text-[9px] text-gray-400">{rec.time}</span>
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
