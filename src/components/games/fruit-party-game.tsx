'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Clock, Volume2, VolumeX, HelpCircle, Move } from 'lucide-react';
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

// --- GLASS DOME ICON WITH FRUITS INSIDE ---
const GlassDomeWithFruits = ({ 
  size = 280, 
  className = "", 
  items,
  highlightIdxs = [],
  myBets = {},
  onPlaceBet
}: { 
  size?: number; 
  className?: string;
  items: Array<{ id: string; icon: string; multiplier: number }>;
  highlightIdxs: number[];
  myBets: Record<string, number>;
  onPlaceBet: (id: string) => void;
}) => {
  const radius = 78;
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size * 0.85 }}>
      {/* Glass Dome SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 460"
        width={size}
        height={size * 0.85}
        style={{ maxWidth: '100%', height: 'auto', position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="glassBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4fdff" stopOpacity="0.03" />
            <stop offset="52%" stopColor="#d7eff2" stopOpacity="0.09" />
            <stop offset="82%" stopColor="#a9d9e0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7bc5cd" stopOpacity="0.38" />
          </linearGradient>
          <linearGradient id="glassRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="18%" stopColor="#d8f2f5" stopOpacity="0.6" />
            <stop offset="65%" stopColor="#8cbdc3" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#5a9ca2" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="leftHL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="22%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="knob" cx="0.32" cy="0.27" r="0.7">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="15%" stopColor="#eaf8fa" stopOpacity="0.96" />
            <stop offset="45%" stopColor="#c1e5ea" stopOpacity="0.88" />
            <stop offset="82%" stopColor="#8ab6bc" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#5e8f95" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="neck" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6e9fa4" stopOpacity="0.9" />
            <stop offset="28%" stopColor="#e0f4f6" stopOpacity="0.98" />
            <stop offset="72%" stopColor="#e0f4f6" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#6e9fa4" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="baseSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#40a6ad" />
            <stop offset="100%" stopColor="#2A7F84" />
          </linearGradient>
          <radialGradient id="baseTop" cx="0.5" cy="0.3" r="0.78">
            <stop offset="0%" stopColor="#73d3d9" />
            <stop offset="100%" stopColor="#5AC0C5" />
          </radialGradient>
          <filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="b4" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" /></filter>
          <filter id="b8" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="b12" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>

        <ellipse cx="256" cy="410" rx="154" ry="25" fill="#0b2f33" opacity="0.18" filter="url(#b8)" />

        <g>
          <path d="M96 340a160 32 0 0 0 320 0v26a160 32 0 0 1-320 0z" fill="url(#baseSide)" />
          <ellipse cx="256" cy="340" rx="160" ry="32" fill="url(#baseTop)" />
          <ellipse cx="256" cy="340" rx="160" ry="32" fill="none" stroke="#185a5f" strokeOpacity="0.18" strokeWidth="2" />
          <ellipse cx="222" cy="326" rx="108" ry="17" fill="#ffffff" opacity="0.14" filter="url(#b8)" />
        </g>

        <ellipse cx="256" cy="335" rx="127" ry="21" fill="#0e4349" opacity="0.07" filter="url(#b4)" />

        <path d="M118 333c0-61 13-121 44-173 30-50 68-76 94-80 26 4 64 30 94 80 31 52 44 112 44 173 0 4-5 8-19 10.5-31 5.5-86 8.5-119 8.5s-88-3-119-8.5c-14-2.5-19-6.5-19-10.5z" fill="url(#glassBody)" stroke="#e9f8fa" strokeOpacity="0.38" strokeWidth="1.6" />

        <path d="M310 142c27 36 47 86 55 155 1 17 1 31l-35 1.5s0-13-1-28c-5-63-22-110-45-142-8-11-16-20-24-27 16 0 33 3 49 9.5z" fill="#0f5258" opacity="0.055" filter="url(#b4)" />

        <g>
          <path d="M112 332c0 13 32 24 144 24s144-11 144-24v10c0 14-35 26-144 26s-144-12-144-26z" fill="url(#glassRim)" opacity="0.95" />
          <ellipse cx="256" cy="332" rx="142.5" ry="11.8" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2.4" />
          <ellipse cx="256" cy="332" rx="138" ry="6.5" fill="#e6f9fb" opacity="0.55" filter="url(#b2)" />
        </g>

        <path d="M242 96c0-6 2-12.5 4.2-17.5h19.6c2.2 5 4.2 11.5 4.2 17.5v5.5h-28z" fill="url(#neck)" />
        <rect x="242" y="91" width="28" height="3" fill="#4a7f84" opacity="0.15" />

        <g>
          <circle cx="256" cy="57.5" r="22.5" fill="url(#knob)" stroke="#ccecf0" strokeOpacity="0.45" strokeWidth="1" />
          <ellipse cx="247.2" cy="47.5" rx="8.8" ry="6.2" fill="#ffffff" opacity="0.95" filter="url(#b2)" />
          <ellipse cx="264.8" cy="66.2" rx="4.2" ry="2.9" fill="#ffffff" opacity="0.48" filter="url(#b2)" />
          <ellipse cx="256" cy="57.5" rx="22" ry="22" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
        </g>

        <g>
          <path d="M129 310c2-57 14-117 43.5-172.5 20-37 48-61 74-71" fill="none" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" opacity="0.26" filter="url(#b4)" />
          <path d="M131 307c2-55 14-113 42.5-168 19.5-35 46-57.5 70.5-66" fill="none" stroke="url(#leftHL)" strokeWidth="13.5" strokeLinecap="round" opacity="0.92" />
          <path d="M134 305c2-53 13.5-110 41.5-164 19-33 44-54 67-62.5" fill="none" stroke="#ffffff" strokeWidth="4.8" strokeLinecap="round" opacity="0.99" />
        </g>

        <ellipse cx="256" cy="324" rx="129" ry="27" fill="#5AC0C5" opacity="0.07" filter="url(#b12)" />
        <path d="M142 333c18-3.2 58-6.5 114-6.5s96 3.3 114 6.5" fill="none" stroke="#aee1e6" strokeOpacity="0.32" strokeWidth="3" filter="url(#b2)" />
      </svg>

      {/* Fruits positioned inside the glass dome */}
      {items.map((item, idx) => {
        const angle = (idx * 45) - 90;
        const cx = size / 2;
        const cy = size * 0.38;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        const isHighlighted = highlightIdxs.includes(idx);
        
        return (
          <motion.div
            key={item.id}
            className="absolute cursor-pointer z-10"
            style={{ 
              left: cx + x - 28, 
              top: cy + y - 28 
            }}
            onClick={() => onPlaceBet(item.id)}
            animate={isHighlighted ? { scale: 1.35, filter: 'drop-shadow(0 0 18px #fbbf24)' } : { scale: 1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative flex flex-col items-center">
              <span className="text-4xl drop-shadow-lg select-none">{item.icon}</span>
              <div className="mt-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/20">
                <span className="text-[9px] font-black text-yellow-400">×{item.multiplier}</span>
              </div>
              {myBets[item.id] > 0 && (
                <div className="absolute -top-3 -right-3 bg-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-white/30 flex items-center gap-0.5">
                  <DollarCoin className="w-2.5 h-2.5" />
                  {formatKandM(myBets[item.id])}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// --- BET STRIP COMPONENT ---
const BetStrip = ({ totalBet, className = "" }: { totalBet: number; className?: string }) => (
  <div className={`flex items-center justify-center gap-2 ${className}`}>
    {/* Purple strip */}
    <div className="bg-purple-600 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg shadow-purple-900/40 border border-purple-400/30">
      <span className="text-white text-xs font-bold">×</span>
      <div className="flex items-center gap-1">
        <DollarCoin className="w-4 h-4" />
        <span className="text-white text-sm font-black">{formatKandM(totalBet)}</span>
      </div>
    </div>
  </div>
);

// --- SMALLER CAFE ICON ---
const CafeShopIconSmall = ({ size = 120, countdown = 0, className = "" }: { size?: number; countdown?: number; className?: string }) => {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.15))',
      }}
    >
      <style>{`
        @keyframes steamRiseSmall {
          0% { transform: translateY(4px) scale(0.96); opacity: 0; }
          15% { opacity: 0.9; }
          70% { opacity: 0.85; }
          100% { transform: translateY(-12px) scale(1.04); opacity: 0; }
        }
        .steam-path-small {
          animation: steamRiseSmall 2.2s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .s1 { animation-delay: 0s; }
        .s2 { animation-delay: 0.4s; }
        .s3 { animation-delay: 0.8s; }
        .float-cup-small {
          animation: floatCupSmall 3.6s ease-in-out infinite;
          transform-origin: 140px 150px;
        }
        @keyframes floatCupSmall {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="magentaSm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4da6" />
            <stop offset="52%" stopColor="#e91e8c" />
            <stop offset="100%" stopColor="#d31678" />
          </linearGradient>
          <linearGradient id="signTopSm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="35%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="woodSm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d0863f" />
            <stop offset="100%" stopColor="#b76e2d" />
          </linearGradient>
          <linearGradient id="woodDarkSm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a65a23" />
            <stop offset="100%" stopColor="#5a2e15" />
          </linearGradient>
          <linearGradient id="windowSm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1e1e" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          
          <filter id="bigShadowSm" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000" floodOpacity="0.2" />
          </filter>
          <filter id="softSm" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.22" />
          </filter>
        </defs>

        <ellipse cx="256" cy="484" rx="172" ry="20" fill="#000" opacity="0.12" />

        <g filter="url(#bigShadowSm)">
          <rect x="60" y="402" width="392" height="86" rx="24" fill="url(#woodSm)" />
          <rect x="60" y="402" width="392" height="86" rx="24" stroke="#5a2e15" strokeWidth="3" fill="none" opacity="0.8" />
          <rect x="66" y="410" width="380" height="32" rx="16" fill="#fff" opacity="0.08" />
          <rect x="76" y="466" width="360" height="16" rx="8" fill="url(#magentaSm)" />
          <text x="256" y="459" fontFamily="'Nunito Black','Poppins','Arial Black',sans-serif" fontSize="22" fontWeight="900" fill="#5a2e15" textAnchor="middle">Select Food</text>

          <rect x="90" y="148" width="332" height="24" rx="10" fill="url(#woodDarkSm)" />
          <rect x="98" y="168" width="316" height="248" rx="16" fill="url(#woodSm)" />
          <rect x="108" y="180" width="296" height="228" rx="12" fill="#fff8d6" />

          <rect x="216" y="186" width="80" height="44" rx="6" fill="#5a2e15" />
          <path d="M224 226 V204 A28 28 0 0 1 288 204 V226 Z" fill="#442009" />
          <path d="M227 224 V206 A25 25 0 0 1 285 206 V224 Z" fill="#6b6cf5" />
          <rect x="254" y="182" width="4" height="40" fill="#5a2e15" />

          <rect x="116" y="255" width="280" height="110" rx="14" fill="#5a2e15" />
          <rect x="122" y="261" width="268" height="98" rx="10" fill="url(#windowSm)" />
          <text x="256" y="345" fontFamily="'Montserrat Black','Inter','Arial Black',sans-serif" fontSize="80" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-2">{countdown}</text>

          <g filter="url(#softSm)">
            <rect x="96" y="38" width="320" height="100" rx="24" fill="#b21268" />
            <rect x="96" y="42" width="320" height="100" rx="24" fill="url(#magentaSm)" />
            <rect x="96" y="42" width="320" height="42" rx="24" fill="url(#signTopSm)" />
            <text x="256" y="108" fontFamily="'Poppins','Fredoka One','Nunito',sans-serif" fontSize="44" fontWeight="900" fill="#fff" letterSpacing="-1" textAnchor="middle">Café</text>
          </g>
        </g>
      </svg>
    </div>
  );
};

const SOUNDS = {
  BET: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  WHIRRING: 'https://assets.mixkit.co/active_storage/sfx/731/731-preview.mp3',
};

const ITEMS = [
  { id: 'broccoli', icon: '🥐', multiplier: 10 },
  { id: 'lettuce', icon: '🥞', multiplier: 15 },
  { id: 'carrot', icon: '🥩', multiplier: 25 },
  { id: 'corn', icon: '🍔', multiplier: 45 },
  { id: 'tomato', icon: '🍟', multiplier: 5 },
  { id: 'coconut', icon: '🧁', multiplier: 5 },
  { id: 'grapes', icon: '🍦', multiplier: 5 },
  { id: 'orange', icon: '🍪', multiplier: 5 },
];

const floatingVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.3 } }
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

  const totalBet = Object.values(myBets).reduce((sum, bet) => sum + bet, 0);

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
          if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
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

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 100) {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />
      <motion.div 
        variants={floatingVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="h-[65vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white rounded-t-[40px] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }}
      >
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full z-30" />

        {/* Header */}
        <div className="w-full flex justify-between p-6 z-20">
          <div className="flex items-center gap-3">
            <button 
              onPointerDown={(e) => dragControls.start(e)} 
              className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors"
            >
              <Move className="w-5 h-5 text-blue-400" />
            </button>
            <div className="relative flex items-center bg-[#1e293b] border border-white/10 rounded-full h-9 min-w-[120px] pl-10 pr-4 text-sm font-bold shadow-inner">
              <div className="absolute -left-1"><DollarCoin className="w-9 h-9" /></div>
              {localCoins.toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSoundOn(!isSoundOn)} className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors">
              {isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="relative w-full flex-1 flex flex-col items-center justify-center">
          {/* Small Cafe Building at top */}
          <div className="mb-2">
            <CafeShopIconSmall 
              size={110} 
              countdown={gameState === 'spinning' ? spinTimeLeft : timeLeft}
              className="drop-shadow-2xl"
            />
          </div>

          {/* Glass Dome with Fruits */}
          <div className="relative flex items-center justify-center">
            <GlassDomeWithFruits 
              size={280}
              items={ITEMS}
              highlightIdxs={highlightIdxs}
              myBets={myBets}
              onPlaceBet={handlePlaceBet}
              className="drop-shadow-2xl"
            />
          </div>

          {/* Purple Bet Strip */}
          <div className="mt-2">
            <BetStrip totalBet={totalBet} />
          </div>
        </div>

        {/* Winner Overlay */}
        <AnimatePresence>
          {winnerData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.5 }}
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
