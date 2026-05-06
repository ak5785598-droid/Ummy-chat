'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection } from 'firebase/firestore';
import { X, Trophy, Plus, Clock, Volume2, VolumeX, HelpCircle, Loader2, ArrowLeft, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- 3D COIN COMPONENT (No emoji, 3D style) ---
const Coin3D = ({ className, size = "w-5 h-5", value }: { className?: string, size?: string, value?: number }) => (
  <div className={cn("relative inline-flex items-center justify-center", size, className)}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.3)]" />
    <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-yellow-200 to-amber-500 shadow-inner" />
    <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_30%_30%,_rgba(255,255,200,0.8),transparent_70%)]" />
    <span className="relative font-black text-amber-900 text-[11px] drop-shadow-sm">$</span>
  </div>
);

// --- SIMPLE CONFETTI COMPONENT ---
const Confetti = ({ show }: { show: boolean }) => {
  useEffect(() => {
    if (!show) return;
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#ffd700', '#ffaa00', '#ffec80', '#ffb347', '#ff6b6b'];

    const frame = () => {
      if (Date.now() > end) return;
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1000';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const particles: any[] = [];
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 8 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: (Math.random() - 0.5) * 4,
          speedY: Math.random() * 8 + 5,
        });
      }
      let animationId: number;
      const animate = () => {
        if (!ctx || !canvas.parentNode) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let allDead = true;
        particles.forEach(p => {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.y < canvas.height + 50) allDead = false;
          if (p.y < canvas.height + 50) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
        });
        if (allDead) {
          canvas.remove();
          return;
        }
        animationId = requestAnimationFrame(animate);
      };
      animate();
      setTimeout(() => {
        cancelAnimationFrame(animationId);
        canvas.remove();
      }, duration);
    };
    frame();
  }, [show]);
  return null;
};

// --- UTILITIES FOR WINNER CARD FORMATTING ---
const formatKandM = (num: number) => {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

const CountUpDisplay = ({ amount }: { amount: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const stepTime = 15;
    const steps = duration / stepTime;
    const increment = amount / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= amount) {
        setDisplay(amount);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [amount]);
  return <>{display.toLocaleString()}</>;
};

// --- LOADING PAGE (unchanged) ---
const LoadingPage = () => (
  <motion.div 
    initial={{ y: "100%" }} animate={{ y: 0 }}
    className="h-[80vh] w-full bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden"
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

// --- MULTIPLIERS ---
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
  const [selectedChip, setSelectedChip] = useState(1000); 
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

  // Winner leaderboard data for premium card
  const [winnersList, setWinnersList] = useState<{ name: string; avatar: string; win: number }[]>([
    { name: 'Champion', avatar: '/api/placeholder/40/40', win: 0 },
    { name: 'Runner', avatar: '/api/placeholder/40/40', win: 0 },
    { name: 'Third', avatar: '/api/placeholder/40/40', win: 0 }
  ]);
  const [activeRoundId, setActiveRoundId] = useState(Math.floor(Math.random() * 10000));

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
    
    // Build winners list for premium card using current user and some dummy data
    const currentUserName = userProfile?.displayName || currentUser?.email?.split('@')[0] || "You";
    const currentUserAvatar = userProfile?.photoURL || "/api/placeholder/40/40";
    setWinnersList([
      { name: currentUserName, avatar: currentUserAvatar, win: totalWinAmount },
      { name: "Crispy", avatar: "/api/placeholder/40/40", win: Math.floor(totalWinAmount * 0.6) },
      { name: "Frosty", avatar: "/api/placeholder/40/40", win: Math.floor(totalWinAmount * 0.3) }
    ]);
    setActiveRoundId(prev => (prev + 1) % 10000);
    
    setWinnerData({ 
      ...winningItems[0], 
      win: totalWinAmount, 
      myBet: totalMyBetOnWinners, 
      isGroup: winningItems.length > 1,
      emoji: winningItems[0].icon
    });
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
    <div className="fixed inset-0 bg-black/10 flex flex-col items-center justify-center z-[100]">
      <div className="flex-1 w-full" onClick={onClose} />

      <AnimatePresence mode="wait">
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
              "relative w-full max-w-[min(50vh, 100vw)] aspect-square mx-auto flex flex-col overflow-hidden bg-[#020617] text-white select-none rounded-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
              !isOverlay && "aspect-square"
            )}
            style={{ 
              backgroundImage: 'radial-gradient(circle at top, #1e3a8a, #020617)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            }}
          >
            
            {/* HEADER - scaled down slightly */}
            <div className="w-full flex flex-col z-20">
              <div className="w-full p-3 flex justify-between items-center relative">
                <div className="flex items-center gap-2">
                  <button 
                    onPointerDown={(e) => dragControls.start(e)}
                    className="w-7 h-7 rounded-full bg-[#1e2350] border-[2px] border-[#4b558c] flex items-center justify-center text-white cursor-grab active:cursor-grabbing touch-none"
                  >
                    <Move className="w-[14px] h-[14px]" strokeWidth={2.5} />
                  </button>

                  <div className="relative flex items-center bg-[#181a4a] border border-[#2b2e63] rounded-full h-6 min-w-[90px] ml-2">
                    <div className="absolute -left-1 w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg border-2 border-[#181a4a]">
                      <Coin3D size="w-5 h-5" />
                    </div>
                    <span className="pl-8 pr-4 text-white font-medium text-[11px] tracking-wider">{localCoins.toLocaleString()}</span>
                    <button className="absolute -right-2 w-6 h-6 rounded-full bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 flex items-center justify-center text-black shadow-md border-2 border-[#181a4a]">
                      <Plus className="w-3 h-3 font-bold" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative">
                   <div className="absolute top-10 right-2 z-10 pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                     <Cloud className="w-20 h-auto" />
                  </div>
                  {[ 
                    { icon: Clock, action: () => setShowHistoryPage(true) }, 
                    { icon: isSoundOn ? Volume2 : VolumeX, action: () => setIsSoundOn(!isSoundOn) }, 
                    { icon: HelpCircle, action: () => setShowRules(true) }, 
                    { icon: X, action: onClose } 
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} className="w-7 h-7 rounded-full bg-[#1e2350] border-[2px] border-[#4b558c] flex items-center justify-center text-white">
                      <btn.icon className="w-[14px] h-[14px]" strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 mt-0 relative">
                <div className="bg-black/60 border border-yellow-500/50 text-yellow-400 px-2 py-0 rounded-full font-bold shadow-lg flex items-center gap-1 w-fit text-[11px]">
                  <span className="text-sm">🏆</span> {todayWins.toLocaleString()}
                </div>
                <div className="absolute top-8 left-4 z-10 pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                   <Cloud className="w-12 h-auto" />
                </div>
              </div>
            </div>

            {/* BOARD AREA - scaled down distances and sizes for 50vh square */}
            <div className="relative w-full flex-1 flex items-center justify-center scale-90 -translate-y-2" style={{ perspective: '1000px' }}>
              <svg className="absolute w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                  <linearGradient id="darkWoodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3d1a05" /> 
                    <stop offset="100%" stopColor="#1a0801" />
                  </linearGradient>
                </defs>
                <g transform="translate(140, 140)">
                  <line x1="0" y1="15" x2="-90" y2="360" stroke="#f5d0a9" strokeWidth="18" strokeLinecap="round" />
                  <line x1="0" y1="15" x2="-90" y2="360" stroke="url(#darkWoodGradient)" strokeWidth="10" strokeLinecap="round" />
                  <line x1="0" y1="15" x2="90" y2="360" stroke="#f5d0a9" strokeWidth="18" strokeLinecap="round" />
                  <line x1="0" y1="15" x2="90" y2="360" stroke="url(#darkWoodGradient)" strokeWidth="10" strokeLinecap="round" />
                </g>
              </svg>

              <svg className="absolute w-[280px] h-[280px] pointer-events-none overflow-visible">
                <g transform="translate(140, 140)">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line key={angle} x1="0" y1="0" x2={85 * Math.cos((angle-90)*Math.PI/180)} y2={85 * Math.sin((angle-90)*Math.PI/180)} stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  ))}
                </g>
              </svg>
              
              <div className="relative z-50">
                <div style={{ transformStyle: 'preserve-3d', transform: 'rotateX(20deg)' }} className="relative w-24 h-24 rounded-full p-1.5 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                  <div className="w-full h-full rounded-full bg-[#1e0701] flex flex-col items-center justify-center overflow-hidden border-4 border-black/40">
                    <div className="w-full h-1/2 bg-gradient-to-b from-red-950 to-red-900 flex items-center justify-center border-b-2 border-yellow-500/40">
                        <span className="text-3xl">🧆</span>
                    </div>
                    <div className="w-full h-1/2 bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center">
                      <span className="text-2xl font-black text-white italic">{gameState === 'betting' ? timeLeft : '...'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {ITEMS.map((item, idx) => {
                const angle = (idx * 45) - 90;
                const x = Math.cos((angle * Math.PI) / 180) * 100;
                const y = Math.sin((angle * Math.PI) / 180) * 100;
                const betAmount = myBets[item.id] || 0;
                const isHighlighted = highlightIdxs.includes(idx);

                return (
                  <div key={item.id} className="absolute z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
                    <button 
                      onClick={() => handlePlaceBet(item.id)}
                      style={{ transform: `rotateY(${isHighlighted ? '0deg' : '15deg'}) rotateX(10deg)` }}
                      className={cn(
                        "w-16 h-16 rounded-full border-[3px] border-yellow-500 flex flex-col overflow-hidden transition-all duration-300 relative items-center justify-center",
                        "bg-[#7f1d1d] shadow-[10px_10px_20px_rgba(0,0,0,0.5)]",
                        isHighlighted ? "scale-110 -translate-y-1 ring-[4px] ring-[#ffd700] shadow-[0_0_30px_#ffd700] z-50" : ""
                      )}
                    >
                      <div className="w-full flex-[1.2] flex items-center justify-center">
                        <span className="text-2xl drop-shadow-lg z-20">{item.icon}</span>
                      </div>
                      <AnimatePresence>
                        {betAmount > 0 && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="w-full bg-orange-500 flex items-center justify-center py-0.5 z-20">
                            <span className="text-[8px] font-black text-white">
                              <Coin3D size="w-3 h-3" className="inline mr-0.5" />
                              {betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="w-full flex-1 flex items-center justify-center bg-orange-600 z-20">
                        <span className="font-black text-[9px] text-white italic">×{item.multiplier}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM UI - compact */}
            <div className="w-full px-3 mb-1 z-20 relative">
               <div className="flex justify-between px-1 mb-0 items-end relative">
                <div className="absolute -top-12 left-0 z-10 pointer-events-none"> <Cloud className="w-20 h-auto" /> </div>
                <span className={cn(
                  "text-2xl relative z-20 transition-all duration-500",
                  shineType === 'salad' ? "scale-150 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] brightness-125" : ""
                )}>
                  🥗
                </span>
                <div className="absolute -top-12 right-0 z-10 pointer-events-none"> <Cloud className="w-20 h-auto" /> </div>
                <span className={cn(
                  "text-2xl relative z-20 transition-all duration-500",
                  shineType === 'pizza' ? "scale-150 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] brightness-125" : ""
                )}>
                  🍕
                </span>
              </div>
              <div className="w-full h-8 bg-[#3e1a05] rounded-xl border-2 border-[#f5d0a9] flex items-center px-2 gap-2 overflow-x-auto no-scrollbar">
                 <span className="text-[8px] font-bold text-[#f5d0a9] uppercase mr-1 border-r border-[#f5d0a9]/30 pr-1">History</span>
                 {history.map((icon, i) => (
                   <div key={i} className="min-w-[24px] h-6 bg-black/30 rounded-lg flex items-center justify-center text-sm">{icon}</div>
                 ))}
              </div>
            </div>

            {/* CHIPS AREA - compact */}
            <div className="w-full bg-gradient-to-b from-[#270c01] to-[#1a0801] p-3 flex justify-center gap-2 z-20 border-t-4 border-[#f5d0a9]">
              {CHIPS_DATA.map(chip => (
                <button 
                  key={chip.value}
                  onClick={() => setSelectedChip(chip.value)}
                  className={cn(
                    "w-12 h-12 rounded-full border-[2px] border-dashed border-white/40 flex items-center justify-center text-[8px] font-black transition-all relative bg-gradient-to-br shadow-[0_3px_0_rgba(0,0,0,0.4)]",
                    chip.color,
                    selectedChip === chip.value ? "scale-110 -translate-y-1 ring-3 ring-yellow-400 border-solid opacity-100" : "opacity-70"
                  )}
                >
                  <div className="absolute inset-1 rounded-full border-2 border-white/20 bg-black/10 flex items-center justify-center">
                    <span className="text-white text-[10px]">{chip.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* PREMIUM WINNER CARD (merged as requested) */}
            <AnimatePresence>
              {winnerData && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 z-[250] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
                >
                  <Confetti show={winnerData.win > 0} />
                  
                  <div className="winning-card-premium w-full max-w-sm relative overflow-hidden">
                    {/* Header Section */}
                    <div className="text-center mb-4 pt-3 relative z-10">
                      <motion.h2 
                        initial={{ y: -20 }} animate={{ y: 0 }}
                        className="text-yellow-400 font-black italic text-2xl tracking-tighter drop-shadow-[0_2px_10px_rgba(250,204,21,0.5)]"
                      >
                        {winnerData.win > 0 ? "BIG WINNER!" : "BET SETTLED"}
                      </motion.h2>
                      <div className="h-1 w-20 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-1" />
                    </div>

                    {/* Main Result Display */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 mb-4 backdrop-blur-md">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Winning Animal</span>
                        <span className="text-4xl mt-1 filter drop-shadow-2xl">{winnerData.emoji}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Total Prize</span>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Coin3D size="w-6 h-6" />
                          <span className="text-2xl font-black text-emerald-400 tracking-tighter">
                            <CountUpDisplay amount={winnerData.win} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top 3 Leaderboard Podiums - using winnersList built from current result */}
                    <div className="grid grid-cols-3 gap-1 items-end mt-2 h-36 relative z-10">
                      {/* 2nd Place */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-12 mb-1">
                          <div className="absolute inset-0 bg-slate-400/20 rounded-full animate-pulse" />
                          <img src={winnersList[1]?.avatar || "/api/placeholder/40/40"} className="w-full h-full rounded-full border-2 border-slate-300 object-cover p-0.5" />
                          <div className="absolute -top-2 -right-1 bg-slate-300 text-slate-800 text-[8px] font-black px-1 rounded-full">2</div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">{winnersList[1]?.name || "Player"}</span>
                        <span className="text-[10px] font-black text-white">{formatKandM(winnersList[1]?.win || 0)}</span>
                      </div>

                      {/* 1st Place (Center) */}
                      <div className="flex flex-col items-center scale-110 -translate-y-2">
                        <div className="relative w-14 h-14 mb-1">
                          <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping duration-1000" />
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                          <img src={winnersList[0]?.avatar || "/api/placeholder/40/40"} className="w-full h-full rounded-full border-3 border-yellow-500 object-cover p-0.5 shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                        </div>
                        <span className="text-[10px] font-black text-yellow-400 truncate w-full text-center">{winnersList[0]?.name || "Champion"}</span>
                        <span className="text-xs font-black text-white">{formatKandM(winnersList[0]?.win || 0)}</span>
                      </div>

                      {/* 3rd Place */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-12 mb-1">
                          <div className="absolute inset-0 bg-orange-800/20 rounded-full" />
                          <img src={winnersList[2]?.avatar || "/api/placeholder/40/40"} className="w-full h-full rounded-full border-2 border-orange-700 object-cover p-0.5" />
                          <div className="absolute -top-2 -right-1 bg-orange-700 text-white text-[8px] font-black px-1 rounded-full">3</div>
                        </div>
                        <span className="text-[9px] font-bold text-orange-400 truncate w-full text-center">{winnersList[2]?.name || "Player"}</span>
                        <span className="text-[10px] font-black text-white">{formatKandM(winnersList[2]?.win || 0)}</span>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center opacity-60">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Round ID: #{activeRoundId}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Forest Party 2026</span>
                    </div>
                  </div>

                  <style jsx>{`
                    .winning-card-premium {
                      background: linear-gradient(165deg, #1a1c1e 0%, #0a0a0b 100%);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 32px;
                      padding: 20px;
                      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    }
                    .winning-card-premium::before {
                      content: '';
                      position: absolute;
                      top: -50%;
                      left: -50%;
                      width: 200%;
                      height: 200%;
                      background: radial-gradient(circle, rgba(250,204,21,0.05) 0%, transparent 70%);
                      pointer-events: none;
                    }
                  `}</style>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RULES / HISTORY MODALS - unchanged but scaled slightly */}
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
                  <div className="bg-white h-full rounded-[2.5rem] p-4 overflow-y-auto no-scrollbar">
                    {historyData.map((rec, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 p-3 mb-2 rounded-2xl">
                        <span className="text-3xl">{rec.icon}</span>
                        <span className="font-black text-gray-800 flex items-center gap-1">
                          <Coin3D size="w-4 h-4" /> {rec.bet.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400">{rec.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
      </AnimatePresence>
    </div>
  );
          }
