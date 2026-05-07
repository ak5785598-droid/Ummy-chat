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

// --- CAFE ICON WITH 3D COFFEE CUP AND COUNTDOWN ---
const CafeShopIcon = ({ size = 200, countdown = 0, className = "" }: { size?: number; countdown?: number; className?: string }) => {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 24px 32px rgba(0,0,0,0.15))',
      }}
    >
      <style>{`
        @keyframes steamRise {
          0% { transform: translateY(4px) scale(0.96); opacity: 0; }
          15% { opacity: 0.9; }
          70% { opacity: 0.85; }
          100% { transform: translateY(-18px) scale(1.04); opacity: 0; }
        }
        .steam-path {
          animation: steamRise 2.2s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .s1 { animation-delay: 0s; }
        .s2 { animation-delay: 0.4s; }
        .s3 { animation-delay: 0.8s; }
        .float-cup {
          animation: floatCup 3.6s ease-in-out infinite;
          transform-origin: 140px 150px;
        }
        @keyframes floatCup {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          {/* Main gradients used in the cafe building */}
          <linearGradient id="magenta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4da6" />
            <stop offset="52%" stopColor="#e91e8c" />
            <stop offset="100%" stopColor="#d31678" />
          </linearGradient>
          <linearGradient id="signTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="35%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff8d6" />
            <stop offset="100%" stopColor="#f9eab1" />
          </linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d0863f" />
            <stop offset="100%" stopColor="#b76e2d" />
          </linearGradient>
          <linearGradient id="woodDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a65a23" />
            <stop offset="100%" stopColor="#5a2e15" />
          </linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffdf7a" />
            <stop offset="100%" stopColor="#f5b833" />
          </linearGradient>
          <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1e1e" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e57a3d" />
            <stop offset="100%" stopColor="#b5521f" />
          </linearGradient>
          <radialGradient id="leaf" cx="0.35" cy="0.25" r="0.8">
            <stop offset="0%" stopColor="#1dd3b0" />
            <stop offset="55%" stopColor="#00b89c" />
            <stop offset="100%" stopColor="#00957e" />
          </radialGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9d7aff" />
            <stop offset="50%" stopColor="#6b6cf5" />
            <stop offset="100%" stopColor="#3d5ef2" />
          </linearGradient>
          
          {/* Gradients for the 3D coffee cup */}
          <linearGradient id="saucerTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5dc"/>
            <stop offset="20%" stopColor="#fff5dc"/>
            <stop offset="100%" stopColor="#e8d4a8"/>
          </linearGradient>
          <linearGradient id="saucerSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8d0a1"/>
            <stop offset="100%" stopColor="#a67c48"/>
          </linearGradient>
          <linearGradient id="saucerInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5e4bd"/>
            <stop offset="100%" stopColor="#ddc08c"/>
          </linearGradient>
          <linearGradient id="cupBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fffaf0"/>
            <stop offset="18%" stopColor="#fffaf0"/>
            <stop offset="55%" stopColor="#fbf0d9"/>
            <stop offset="100%" stopColor="#f0e0b8"/>
          </linearGradient>
          <linearGradient id="cupShade" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#c9a87a"/>
            <stop offset="100%" stopColor="#f0e0b8" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f0e0b8"/>
            <stop offset="40%" stopColor="#fffaf0"/>
            <stop offset="100%" stopColor="#d8c096"/>
          </linearGradient>
          <radialGradient id="coffeeGrad" cx="0.5" cy="0.3" r="0.75">
            <stop offset="0%" stopColor="#6b2f15"/>
            <stop offset="55%" stopColor="#4a1f0f"/>
            <stop offset="100%" stopColor="#2b0e05"/>
          </radialGradient>
          <linearGradient id="coffeeRimLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a05e33" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#6b2f15" stopOpacity="0"/>
          </linearGradient>
          
          <filter id="bigShadow" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity="0.2" />
          </filter>
          <filter id="soft" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.22" />
          </filter>
          <filter id="cupShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <!-- Shadow under the whole building -->
        <ellipse cx="256" cy="484" rx="172" ry="20" fill="#000" opacity="0.12" />

        <g filter="url(#bigShadow)">
          <!-- Bottom wood panel -->
          <rect x="28" y="402" width="456" height="86" rx="24" fill="url(#wood)" />
          <rect x="28" y="402" width="456" height="86" rx="24" stroke="#5a2e15" strokeWidth="4" fill="none" opacity="0.8" />
          <rect x="36" y="410" width="440" height="32" rx="16" fill="#fff" opacity="0.08" />
          <rect x="36" y="466" width="440" height="18" rx="9" fill="url(#gold)" />
          <rect x="36" y="466" width="440" height="9" fill="#fff" opacity="0.25" />
          <text x="256" y="459" fontFamily="'Nunito Black','Poppins','Arial Black',sans-serif" fontSize="30" fontWeight="900" fill="#5a2e15" textAnchor="middle" letterSpacing="0.3">Select Food</text>

          <!-- Upper wood frame -->
          <rect x="60" y="128" width="392" height="28" rx="12" fill="url(#woodDark)" />
          <rect x="60" y="128" width="392" height="14" rx="12" fill="url(#gold)" />
          <rect x="68" y="152" width="376" height="268" rx="18" fill="url(#woodDark)" />
          <rect x="76" y="160" width="360" height="252" rx="14" fill="url(#wood)" />
          <rect x="88" y="172" width="336" height="228" rx="10" fill="url(#cream)" />
          <rect x="88" y="172" width="336" height="48" fill="#fff" opacity="0.15" />

          <!-- Window frame -->
          <rect x="216" y="180" width="80" height="54" rx="6" fill="#5a2e15" />
          <path d="M224 226 V200 A32 32 0 0 1 288 200 V226 Z" fill="#442009" />
          <path d="M227 224 V202 A29 29 0 0 1 285 202 V224 Z" fill="url(#glass)" />
          <path d="M226 215 Q256 198 286 215" fill="none" stroke="#5a2e15" strokeOpacity="0.5" strokeWidth="3" />
          <rect x="254" y="175" width="4" height="49" fill="#5a2e15" />
          <ellipse cx="256" cy="202" rx="26" ry="8" fill="#fff" opacity="0.18" />

          <!-- Display panel with countdown -->
          <rect x="100" y="250" width="312" height="136" rx="16" fill="#5a2e15" />
          <rect x="108" y="258" width="296" height="120" rx="12" fill="url(#window)" />
          <rect x="108" y="258" width="296" height="22" rx="12" fill="#fff" opacity="0.07" />
          <text x="256" y="345" fontFamily="'Montserrat Black','Inter','Arial Black',sans-serif" fontSize="100" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-3">{countdown}</text>

          <!-- Decorative pink scallops -->
          <g filter="url(#soft)">
            <path d="M86 200 H426 V240 Q402 272 378 240 Q354 272 330 240 Q306 272 282 240 Q258 272 234 240 Q210 272 186 240 Q162 272 138 240 Q114 272 90 240 Z" fill="#e91e8c" />
            <path d="M86 200 H134 V240 Q114 272 90 240 V200" fill="#ff4da6" />
            <path d="M182 200 H230 V240 Q210 272 186 240 V200" fill="#ff4da6" />
            <path d="M278 200 H326 V240 Q306 272 282 240 V200" fill="#ff4da6" />
            <path d="M374 200 H422 V240 Q402 272 378 240 V200" fill="#ff4da6" />
            <rect x="84" y="192" width="344" height="16" rx="8" fill="#c1106a" />
            <rect x="86" y="194" width="340" height="8" rx="4" fill="#fff" opacity="0.18" />
            <path d="M90 240 Q114 262 138 240 M186 240 Q210 262 234 240 M282 240 Q306 262 330 240 M378 240 Q402 262 426 240" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" />
          </g>

          <!-- Left potted plant -->
          <g transform="translate(94,322)">
            <ellipse cx="38" cy="78" rx="26" ry="7" fill="#000" opacity="0.14" />
            <path d="M14 56 H62 L56 84 H20 Z" fill="url(#pot)" stroke="#7e3314" strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="12" y="50" width="52" height="10" rx="4" fill="#d4682e" />
            <rect x="14" y="52" width="48" height="4" fill="#fff" opacity="0.2" />
            <rect x="32" y="32" width="12" height="20" rx="3" fill="#8b4a1d" />
            <g fill="url(#leaf)">
              <circle cx="22" cy="24" r="20" />
              <circle cx="46" cy="20" r="19" />
              <circle cx="34" cy="6" r="22" />
              <circle cx="14" cy="12" r="13" opacity="0.9" />
            </g>
            <ellipse cx="28" cy="2" rx="9" ry="5" fill="#fff" opacity="0.28" />
          </g>

          <!-- Right potted plant -->
          <g transform="translate(338,322)">
            <ellipse cx="38" cy="78" rx="26" ry="7" fill="#000" opacity="0.14" />
            <path d="M14 56 H62 L56 84 H20 Z" fill="url(#pot)" stroke="#7e3314" strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="12" y="50" width="52" height="10" rx="4" fill="#d4682e" />
            <rect x="14" y="52" width="48" height="4" fill="#fff" opacity="0.2" />
            <rect x="32" y="32" width="12" height="20" rx="3" fill="#8b4a1d" />
            <g fill="url(#leaf)">
              <circle cx="22" cy="24" r="20" />
              <circle cx="46" cy="20" r="19" />
              <circle cx="34" cy="6" r="22" />
              <circle cx="14" cy="12" r="13" opacity="0.9" />
            </g>
            <ellipse cx="28" cy="2" rx="9" ry="5" fill="#fff" opacity="0.28" />
          </g>

          <!-- Signboard area with café text and 3D cup -->
          <g filter="url(#soft)">
            <rect x="76" y="28" width="360" height="112" rx="28" fill="#b21268" />
            <rect x="76" y="34" width="360" height="112" rx="28" fill="url(#magenta)" />
            <rect x="76" y="34" width="360" height="112" rx="28" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" fill="none" />
            <rect x="76" y="34" width="360" height="46" rx="28" fill="url(#signTop)" />

            <!-- 3D Coffee Cup (replaces the simple white cup) -->
            <g transform="translate(105, 38) scale(0.42)" className="float-cup">
              <ellipse cx="140" cy="192" rx="121" ry="30" fill="#7a542f" opacity="0.7" filter="url(#cupShadow)"/>
              <ellipse cx="140" cy="188" rx="123" ry="32" fill="url(#saucerSide)" />
              <ellipse cx="140" cy="174" rx="125" ry="36" fill="url(#saucerTop)" stroke="#fff7e0" strokeWidth="1.5"/>
              <ellipse cx="140" cy="176" rx="106" ry="27.5" fill="url(#saucerInner)"/>
              <ellipse cx="140" cy="172" rx="95" ry="22" fill="#fff9e8" opacity="0.3"/>
              <ellipse cx="140" cy="162" rx="110" ry="24" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2"/>

              <path d="M203 132.5 C231 126 253 144 248.5 170.5 C244 193 224.5 203.5 198 188 L207 178.5 C221 186.5 231.5 180 233.5 166.5 C235.5 152 222 140 207.5 144.5 L203 132.5 Z" 
                fill="url(#handleGrad)" stroke="#d0b481" strokeWidth="1.3"/>
              <path d="M207 138 C220 136 229 143 228 156" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round"/>

              <path d="M66 124 C59 138 61 168 75 186.5 C79.5 192.5 107 196 135 196.5 C163 196 190.5 192.5 195 186.5 C209 168 211 138 204 124 C202 133 181 139 135 141 C89 139 68 133 66 124 Z"
                fill="url(#cupBody)" stroke="#f3e0b6" strokeWidth="1.2"/>
              <path d="M178 128 C197 135 206 152 203 174 C199 186 188 193 171 195.5 C184 190 195 177 196 159 C197 144 189 132 178 128 Z" fill="url(#cupShade)" opacity="0.85"/>

              <ellipse cx="86" cy="155" rx="13" ry="31" fill="#ffffff" opacity="0.22" filter="url(#cupShadow)"/>
              <path d="M70 132 C68 145 69 165 78 180" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" filter="url(#cupShadow)"/>

              <ellipse cx="135" cy="123.5" rx="69" ry="20.5" fill="#fffbf0" stroke="#e9d4a6" strokeWidth="1.2"/>
              <ellipse cx="135" cy="123.5" rx="69" ry="20.5" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1"/>
              <ellipse cx="135" cy="128" rx="60" ry="17" fill="#000" opacity="0.07"/>
              <path d="M69 123.5 A66 19 0 0 0 201 123.5 A58 15.5 0 0 1 77 123.5 A58 15.5 0 0 1 201 123.5" fill="#c9a87a" opacity="0.25"/>
              <ellipse cx="135" cy="126.5" rx="58.5" ry="15.8" fill="url(#coffeeGrad)"/>
              <ellipse cx="129" cy="121" rx="32" ry="6.5" fill="#894c28" opacity="0.4" filter="url(#cupShadow)"/>
              <ellipse cx="135" cy="120" rx="46" ry="10" fill="none" stroke="url(#coffeeRimLight)" strokeWidth="3" opacity="0.8"/>
              <ellipse cx="135" cy="126.5" rx="58.5" ry="15.8" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5"/>

              <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
                <path className="steam-path s1" d="M110 90 C106 80 118 72 113 62 C108 52 120 44 115 34" strokeWidth="13" strokeOpacity="0.92"/>
                <path className="steam-path s2" d="M140 84 C134 70 150 60 143 46 C136 32 152 22 145 8" strokeWidth="14" strokeOpacity="0.96"/>
                <path className="steam-path s3" d="M170 90 C166 80 178 72 173 62 C168 52 180 44 175 34" strokeWidth="13" strokeOpacity="0.92"/>
              </g>
              <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                <path className="steam-path s1" d="M110 90 C106 80 118 72 113 62 C108 52 120 44 115 34" strokeWidth="5"/>
                <path className="steam-path s2" d="M140 84 C134 70 150 60 143 46 C136 32 152 22 145 8" strokeWidth="5.5"/>
                <path className="steam-path s3" d="M170 90 C166 80 178 72 173 62 C168 52 180 44 175 34" strokeWidth="5"/>
              </g>
            </g>

            <text x="222" y="112" fontFamily="'Poppins','Fredoka One','Nunito','Arial Rounded MT Bold',sans-serif" fontSize="68" fontWeight="900" fill="#fff" letterSpacing="-1.5">Café</text>
            <path d="M218 118 Q236 132 260 124 Q242 130 222 122 Q216 120 218 118 Z" fill="#fff" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// --- SOUNDS ---
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
        className="h-[60vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white rounded-t-[40px] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }}
      >
        {/* Visual drag handle */}
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

        {/* Game Board */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          {/* Center Cafe Icon (smaller size 200px) */}
          <div className="absolute w-[200px] h-[200px] z-0 opacity-90 scale-110">
            <CafeShopIcon 
              size={200} 
              countdown={gameState === 'spinning' ? spinTimeLeft : timeLeft}
              className="w-full h-full drop-shadow-2xl"
            />
          </div>

          {/* Circular items */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const radius = 150;
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
                whileTap={{ scale: 0.95 }}
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

        {/* Winner Popup */}
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
