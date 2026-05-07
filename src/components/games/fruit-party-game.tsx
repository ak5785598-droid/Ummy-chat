'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Clock, Volume2, VolumeX, HelpCircle, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- NUMBER FORMATTING ---
const formatKandM = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

// --- 3D GLOSSY GOLD COIN ---
const DollarCoin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="glossyGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff3a1" />
        <stop offset="30%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="80%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="innerGloss" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffebb5" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
      </linearGradient>
      <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="16" cy="16" r="15" fill="url(#glossyGold)" stroke="#92400e" strokeWidth="1" filter="url(#coinShadow)" />
    <circle cx="16" cy="16" r="13" fill="url(#innerGloss)" />
    <circle cx="16" cy="16" r="11" fill="none" stroke="#fffbeb" strokeWidth="0.8" opacity="0.6" />
    <text x="16" y="21.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#78350f" fontFamily="Arial" style={{ textShadow: '0px 1px 1px rgba(255,255,255,0.5)' }}>$</text>
  </svg>
);

// --- CENTER CAFE COUNTDOWN SVG ---
const CafeCountdownSVG = ({ countdown }: { countdown: number }) => (
  <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-2xl">
    <defs>
      <linearGradient id="magenta" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff4da6"/><stop offset="52%" stopColor="#e91e8c"/><stop offset="100%" stopColor="#d31678"/></linearGradient>
      <linearGradient id="signTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.4"/><stop offset="35%" stopColor="#fff" stopOpacity="0"/></linearGradient>
      <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff8d6"/><stop offset="100%" stopColor="#f9eab1"/></linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d0863f"/><stop offset="100%" stopColor="#b76e2d"/></linearGradient>
      <linearGradient id="woodDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a65a23"/><stop offset="100%" stopColor="#5a2e15"/></linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffdf7a"/><stop offset="100%" stopColor="#f5b833"/></linearGradient>
      <linearGradient id="window" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e1e1e"/><stop offset="100%" stopColor="#000000"/></linearGradient>
      <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e57a3d"/><stop offset="100%" stopColor="#b5521f"/></linearGradient>
      <radialGradient id="leaf" cx="0.35" cy="0.25" r="0.8"><stop offset="0%" stopColor="#1dd3b0"/><stop offset="55%" stopColor="#00b89c"/><stop offset="100%" stopColor="#00957e"/></radialGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9d7aff"/><stop offset="50%" stopColor="#6b6cf5"/><stop offset="100%" stopColor="#3d5ef2"/></linearGradient>
      <linearGradient id="saucerTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff5dc"/><stop offset="100%" stopColor="#e8d4a8"/></linearGradient>
      <linearGradient id="cupBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fffaf0"/><stop offset="100%" stopColor="#f0e0b8"/></linearGradient>
      <radialGradient id="coffeeGrad" cx="0.5" cy="0.3" r="0.75"><stop offset="0%" stopColor="#6b2f15"/><stop offset="100%" stopColor="#2b0e05"/></radialGradient>
    </defs>
    {/* Shadow */}
    <ellipse cx="256" cy="484" rx="172" ry="20" fill="#000" opacity="0.3"/>
    
    {/* Stand and Base */}
    <rect x="28" y="402" width="456" height="86" rx="24" fill="url(#wood)" stroke="#5a2e15" strokeWidth="4"/>
    <text x="256" y="459" fontSize="30" fontWeight="900" fill="#5a2e15" textAnchor="middle">WAITING...</text>
    
    {/* Main Structure */}
    <rect x="68" y="152" width="376" height="268" rx="18" fill="url(#woodDark)"/>
    <rect x="76" y="160" width="360" height="252" rx="14" fill="url(#wood)"/>
    <rect x="88" y="172" width="336" height="228" rx="10" fill="url(#cream)"/>

    {/* Countdown Window */}
    <rect x="100" y="250" width="312" height="136" rx="16" fill="#5a2e15"/>
    <rect x="108" y="258" width="296" height="120" rx="12" fill="url(#window)"/>
    <text x="256" y="348" fontSize="100" fontWeight="900" fill="white" textAnchor="middle" fontFamily="Arial Black">
      {countdown}
    </text>

    {/* Coffee Cup and Signage (Simplified for performance) */}
    <rect x="76" y="34" width="360" height="112" rx="28" fill="url(#magenta)" stroke="#fff" strokeWidth="3"/>
    <text x="256" y="110" fontSize="60" fontWeight="900" fill="#fff" textAnchor="middle">CAFÉ</text>
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

const floatingVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function CarnivalFoodParty({ onClose }: { onClose?: () => void }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const dragControls = useDragControls();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [spinTimeLeft, setSpinTimeLeft] = useState(0);
  const [selectedChip] = useState(1000); 
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdxs, setHighlightIdxs] = useState<number[]>([]);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false); 
  const [isSoundOn, setIsSoundOn] = useState(true);

  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const movingIndexRef = useRef<number>(0);

  const playSound = (url: string, vol = 0.5) => {
    if (!isSoundOn) return;
    const audio = new Audio(url);
    audio.volume = vol;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (userProfile?.wallet?.coins !== undefined && !isCoinsLoaded) {
      setLocalCoins(userProfile.wallet.coins);
      setIsCoinsLoaded(true);
    }
  }, [userProfile, isCoinsLoaded]);

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
    if (gameState !== 'betting' || !currentUser) return;
    if (localCoins < selectedChip) return;
    playSound(SOUNDS.BET, 0.9);
    setLocalCoins(prev => prev - selectedChip);
    const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(-selectedChip) });
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const startSpin = () => {
    setGameState('spinning');
    setSpinTimeLeft(10);
    playSound(SOUNDS.WHIRRING, 1.0);
    movingIndexRef.current = 0;
    setHighlightIdxs([0]);
    moveIntervalRef.current = setInterval(() => {
      const nextIndex = (movingIndexRef.current + 1) % ITEMS.length;
      movingIndexRef.current = nextIndex;
      setHighlightIdxs([nextIndex]);
      playSound(SOUNDS.TICK, 0.3);
    }, 900);
    countdownIntervalRef.current = setInterval(() => {
      setSpinTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(moveIntervalRef.current!);
          clearInterval(countdownIntervalRef.current!);
          finalizeResult(ITEMS[movingIndexRef.current]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finalizeResult = (winningItem: typeof ITEMS[0]) => {
    const betOnItem = myBets[winningItem.id] || 0;
    const totalWinAmount = betOnItem * winningItem.multiplier;
    if (totalWinAmount > 0 && currentUser) {
      playSound(SOUNDS.WIN, 0.6);
      setLocalCoins(prev => prev + totalWinAmount);
      const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(totalWinAmount) });
    }
    setWinnerData({ emoji: winningItem.icon, win: totalWinAmount, bet: betOnItem });
    setGameState('result');
    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinnerData(null);
      setHighlightIdxs([]);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />
      <motion.div 
        variants={floatingVariants} initial="initial" animate="animate"
        className="h-[60vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white rounded-t-[40px] shadow-[0_-10px_50px_rgba(0,0,0,0.5)]"
        style={{ backgroundImage: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }}
      >
        {/* HEADER */}
        <div className="w-full flex justify-between p-6 z-20">
          <div className="flex items-center gap-3">
            <button onPointerDown={(e) => dragControls.start(e)} className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center"><Move className="w-5 h-5 text-blue-400" /></button>
            <div className="relative flex items-center bg-[#1e293b] border border-white/10 rounded-full h-9 min-w-[120px] pl-10 pr-4 text-sm font-bold shadow-inner">
              <div className="absolute -left-1"><DollarCoin className="w-9 h-9" /></div>
              {localCoins.toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2">
            {[Clock, isSoundOn ? Volume2 : VolumeX, HelpCircle, X].map((Icon, i) => (
              <button key={i} onClick={i===1?()=>setIsSoundOn(!isSoundOn):onClose} className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center"><Icon className="w-5 h-5" /></button>
            ))}
          </div>
        </div>

        {/* BOARD AREA */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          
          {/* CENTER CAFE SVG */}
          <div className="absolute w-[240px] h-[240px] z-0 opacity-90 scale-110">
            <CafeCountdownSVG countdown={gameState === 'spinning' ? spinTimeLeft : timeLeft} />
          </div>

          {/* CIRCULAR FLOATING FRUITS (No cards/containers) */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const radius = 150; // Distance from center
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const isHighlighted = highlightIdxs.includes(idx);
            
            return (
              <motion.div 
                key={item.id} 
                className="absolute z-10 cursor-pointer"
                style={{ left: `calc(50% + ${x}px - 35px)`, top: `calc(50% + ${y}px - 35px)` }}
                onClick={() => handlePlaceBet(item.id)}
                animate={isHighlighted ? { scale: 1.3, filter: 'drop-shadow(0 0 15px #fbbf24)' } : { scale: 1 }}
              >
                <div className="relative flex flex-col items-center">
                  <span className="text-5xl drop-shadow-lg">{item.icon}</span>
                  <div className="mt-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                    <span className="text-[10px] font-black text-yellow-400">×{item.multiplier}</span>
                  </div>
                  {myBets[item.id] > 0 && (
                    <div className="absolute -top-4 -right-4 bg-blue-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/30 flex items-center gap-1">
                      <DollarCoin className="w-3 h-3" />
                      {formatKandM(myBets[item.id])}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* WINNER POPUP OVERLAY */}
        <AnimatePresence>
          {winnerData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-[50] bg-black/60 backdrop-blur-sm"
            >
              <div className="bg-gradient-to-b from-yellow-400 to-orange-600 p-8 rounded-[40px] text-center border-4 border-white shadow-[0_0_50px_rgba(251,191,36,0.5)]">
                <div className="text-7xl mb-2">{winnerData.emoji}</div>
                <div className="text-2xl font-black text-white uppercase tracking-tighter">Winner!</div>
                <div className="flex items-center justify-center gap-2 text-4xl font-black text-white mt-2">
                  <DollarCoin className="w-10 h-10" />
                  {winnerData.win.toLocaleString()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

