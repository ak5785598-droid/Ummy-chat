'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection } from 'firebase/firestore';
import { X, Plus, Clock, Volume2, VolumeX, HelpCircle, ArrowLeft, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- NUMBER FORMATTING (shared) ---
const formatKandM = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

// --- COUNT UP DISPLAY ---
const CountUpDisplay = ({ amount }: { amount: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = 0;
    const end = amount;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [amount]);
  return <>{count.toLocaleString()}</>;
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

// ======================== WINNER POPUP COMPONENT ========================
const winnerFormatKandM = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

const WinnerCountUpDisplay = ({ amount, duration = 900 }: { amount: number, duration?: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const start = 0;
    const t0 = performance.now();
    let rafId: number;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const currentVal = Math.round(start + (amount - start) * eased);
      if (node) node.textContent = winnerFormatKandM(currentVal);
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [amount, duration]);
  return <span ref={nodeRef} style={{ willChange: 'contents' }}>{winnerFormatKandM(0)}</span>;
};

const CoinIcon2 = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32">
    <defs>
      <linearGradient id="coinGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9c4" />
        <stop offset="28%" stopColor="#ffd54f" />
        <stop offset="68%" stopColor="#f9a825" />
        <stop offset="100%" stopColor="#e65100" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="15" fill="url(#coinGold)" stroke="#b26a00" strokeWidth="1" />
    <circle cx="16" cy="16" r="12" fill="none" stroke="#ffecb3" strokeWidth="1" opacity=".55" />
    <text x="16" y="21.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text>
  </svg>
);

const Crown = ({ rank }: { rank: 1 | 2 | 3 }) => {
  if (rank === 1) return (
    <svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'transform' }}>
      <defs>
        <linearGradient id="goldRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d6" /><stop offset="22%" stopColor="#ffe08a" />
          <stop offset="52%" stopColor="#ffc73a" /><stop offset="78%" stopColor="#f19e1a" />
          <stop offset="100%" stopColor="#d87607" />
        </linearGradient>
        <filter id="goldShadow">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#ff9d00" floodOpacity=".5" />
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity=".7" />
        </filter>
      </defs>
      <g transform="translate(70,22) scale(1.1)" filter="url(#goldShadow)">
        <path d="M-24 -2 L-15 -18 L-6 -4 L0 -20 L6 -4 L15 -18 L24 -2 L24 9 L-24 9 Z" fill="url(#goldRingGrad)" stroke="#b26a00" strokeWidth="1.5" />
        <path d="M-24 -2 L-15 -18 L-6 -4 L0 -20 L6 -4 L15 -18 L24 -2" fill="none" stroke="#fff7dc" strokeWidth="1.1" opacity=".85" />
        <circle cx="0" cy="-13" r="3.8" fill="#ffdf76" stroke="#b26a00" strokeWidth="1" />
        <rect x="-24" y="9" width="48" height="6.5" rx="2.2" fill="#c78212" />
      </g>
      <circle cx="70" cy="90" r="50" fill="none" stroke="#3e2805" strokeWidth="15" opacity=".5" />
      <circle cx="70" cy="90" r="50" fill="none" stroke="url(#goldRingGrad)" strokeWidth="13" filter="url(#goldShadow)" />
      <g transform="translate(104,126)">
        <circle r="17" fill="url(#goldRingGrad)" stroke="#9c5e06" strokeWidth="2.4" filter="url(#goldShadow)" />
        <text x="0" y="6" textAnchor="middle" fontSize="16.5" fontWeight="900" fill="white" fontFamily="Arial" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: '.6px' }}>1</text>
      </g>
    </svg>
  );
  if (rank === 2) return (
    <svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'transform' }}>
      <defs>
        <linearGradient id="silverRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" /><stop offset="30%" stopColor="#e6e8ee" />
          <stop offset="60%" stopColor="#b6bcc6" /><stop offset="100%" stopColor="#7a8290" />
        </linearGradient>
        <filter id="silverShadow"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".55" /></filter>
      </defs>
      <g transform="translate(70,28)" filter="url(#silverShadow)">
        <path d="M-22 -2 L-14 -16 L-6 -4 L0 -18 L6 -4 L14 -16 L22 -2 L22 8 L-22 8 Z" fill="url(#silverRingGrad)" stroke="#7c8491" strokeWidth="1.4" />
        <circle cx="0" cy="-12" r="3.3" fill="#e8edf3" stroke="#7c8491" strokeWidth="1" />
        <rect x="-22" y="8" width="44" height="5.5" rx="2" fill="#9aa2ae" />
      </g>
      <circle cx="70" cy="90" r="48" fill="none" stroke="url(#silverRingGrad)" strokeWidth="11.5" filter="url(#silverShadow)" />
      <g transform="translate(104,124)">
        <circle r="15.5" fill="url(#silverRingGrad)" stroke="#5a6270" strokeWidth="2" filter="url(#silverShadow)" />
        <text x="0" y="5.5" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="white" fontFamily="Arial">2</text>
      </g>
    </svg>
  );
  return (
    <svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'transform' }}>
      <defs>
        <linearGradient id="bronzeRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe2d1" /><stop offset="30%" stopColor="#e9a17d" />
          <stop offset="65%" stopColor="#c76d46" /><stop offset="100%" stopColor="#8f4a2e" />
        </linearGradient>
        <filter id="bronzeShadow"><feDropShadow dx="0" dy="4.5" stdDeviation="4" floodOpacity=".55" /></filter>
      </defs>
      <g transform="translate(70,28)" filter="url(#bronzeShadow)">
        <path d="M-22 -2 L-14 -16 L-6 -4 L0 -18 L6 -4 L14 -16 L22 -2 L22 8 L-22 8 Z" fill="url(#bronzeRingGrad)" stroke="#7a3e26" strokeWidth="1.4" />
        <circle cx="0" cy="-12" r="3.2" fill="#f0b599" stroke="#7a3e26" strokeWidth="1" />
        <rect x="-22" y="8" width="44" height="5.5" rx="2" fill="#8a4f35" />
      </g>
      <circle cx="70" cy="90" r="46" fill="none" stroke="url(#bronzeRingGrad)" strokeWidth="11" filter="url(#bronzeShadow)" />
      <g transform="translate(102,122)">
        <circle r="15" fill="url(#bronzeRingGrad)" stroke="#5c2c1a" strokeWidth="2" filter="url(#bronzeShadow)" />
        <text x="0" y="5" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="white" fontFamily="Arial">3</text>
      </g>
    </svg>
  );
};

const WinnerConfetti = ({ show }: { show: boolean }) => {
  const pieces = useMemo(() => {
    return Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      background: `hsl(${38 + Math.random() * 30}, 100%, ${62 + Math.random() * 18}%)`,
      delay: `${Math.random() * 0.2}s`,
      rotate: `${Math.random() * 360}deg`
    }));
  }, []);
  if (!show) return null;
  return (
    <div className="winner-confetti pointer-events-none">
      {pieces.map((p) => (
        <i key={p.id} style={{
          left: p.left, background: p.background, animationDelay: p.delay,
          transform: `rotate(${p.rotate})`, willChange: 'transform, opacity'
        }} />
      ))}
      <style jsx>{`
        .winner-confetti { position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: hidden; border-radius: 28px; }
        .winner-confetti i { position: absolute; width: 6px; height: 10px; border-radius: 2px; opacity: 0; top: 38%; animation: conf 900ms cubic-bezier(.2,.7,.3,1) forwards; }
        @keyframes conf { 0%{opacity:1; transform:translateY(0) rotate(0) scale(1)} 100%{opacity:0; transform:translateY(90px) rotate(520deg) scale(.8)} }
      `}</style>
    </div>
  );
};

interface WinnerPopupData { emoji: string; win: number; bet: number; }
interface WinnerPlayer { name: string; win: number; avatar: string | null; bet: number; isMe: boolean; }
interface WinnerPopupProps { winnerData: WinnerPopupData | null; winnersList: WinnerPlayer[]; }

const WinnerPopup = ({ winnerData, winnersList }: WinnerPopupProps) => {
  const [activeWinnerIdx, setActiveWinnerIdx] = useState<number | null>(1);
  return (
    <AnimatePresence>
      {winnerData && (
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[210] flex justify-center pb-4 px-2"
        >
          <div className="winning-card">
            <WinnerConfetti show={true} />
            <div className="tw-top">
              <div className="tw-emoji-box flex items-center justify-center" onClick={() => navigator.vibrate?.(10)}>
                {winnerData.bet === 0 ? <span className="text-[60px]">😴</span> : <span className="text-[70px]">{winnerData.emoji}</span>}
              </div>
              <div className="tw-stats">
                <div className="tw-stat-row"><span className="tw-stat-label">Your Prize:</span><CoinIcon2 className="tw-coin-icon" /><span className="tw-stat-value"><WinnerCountUpDisplay amount={winnerData.win} /></span></div>
                <div className="tw-stat-row"><span className="tw-stat-label">Your Bet:</span><CoinIcon2 className="tw-coin-icon" /><span className="tw-stat-value"><WinnerCountUpDisplay amount={winnerData.bet} /></span></div>
              </div>
            </div>
            <div className="tw-divider"><div className="tw-divider-line tw-left"></div><div className="tw-divider-text">Top Winner</div><div className="tw-divider-line tw-right"></div></div>
            <div className="tw-winners">
              {[{ rank: 2, data: winnersList[1], idx: 1 }, { rank: 1, data: winnersList[0], idx: 0 }, { rank: 3, data: winnersList[2], idx: 2 }].map((p) => (
                <div key={`rank-${p.rank}`} className={`tw-player tw-rank-${p.rank} ${activeWinnerIdx === p.idx ? 'tw-active' : ''}`} onClick={() => setActiveWinnerIdx(p.idx)}>
                  <div className="tw-ring-container relative flex items-center justify-center">
                    <div className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full overflow-hidden bg-slate-800 border border-white/10 flex items-center justify-center">
                      {p.data?.avatar ? <img src={p.data.avatar} className="w-full h-full object-cover" /> : <span className="text-[20px] text-white/50">😴</span>}
                    </div>
                    <div className="relative z-10 w-full h-full"><Crown rank={p.rank as 1|2|3} /></div>
                  </div>
                  <div className="tw-player-name">{p.data ? p.data.name : 'Waiting...'}</div>
                  <div className="tw-player-prize"><CoinIcon2 className="tw-coin-icon" /><span><WinnerCountUpDisplay amount={p.data ? p.data.win : 0} /></span></div>
                  <div className="tw-player-bet">Bet: {p.data ? winnerFormatKandM(p.data.bet || 0) : 0}</div>
                </div>
              ))}
            </div>
          </div>
          <style jsx global>{`
            .winning-card { height: 40vh; min-height: 320px; width: 100%; background: linear-gradient(180deg, rgba(28,22,34,.95) 0%, #050507 100%); border: 1px solid rgba(232,200,120,.18); border-radius: 28px 28px 12px 12px; padding: 15px 18px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; isolation: isolate; }
            .tw-top { display: flex; align-items: center; gap: 3vw; height: 35%; }
            .tw-emoji-box { width: 25%; min-width: 75px; aspect-ratio: 1; transition: transform .3s; }
            .tw-stats { flex: 1; display: flex; flex-direction: column; gap: 1vh; justify-content: center; }
            .tw-stat-row { display: flex; align-items: center; gap: .6rem; background: rgba(255,255,255,.05); padding: .4rem .6rem; border-radius: 12px; font-size: 13px; font-weight: 650; }
            .tw-stat-label { color: #f0eadd; min-width: 88px; opacity: .9; }
            .tw-coin-icon { width: 2vh; height: 2vh; }
            .tw-divider { height: 15%; display: flex; align-items: center; justify-content: center; position: relative; }
            .tw-divider-line { position: absolute; width: 29%; height: 2px; background: #e8c878; }
            .tw-divider-line.tw-left { left: 0; } .tw-divider-line.tw-right { right: 0; }
            .tw-divider-text { color: #e8c878; font-size: 16px; font-weight: 800; text-transform: uppercase; }
            .tw-winners { display: flex; justify-content: space-between; align-items: flex-end; height: 48%; gap: 2vw; }
            .tw-player { flex: 1; display: flex; flex-direction: column; align-items: center; }
            .tw-player.tw-rank-1 { transform: translateY(-1vh); }
            .tw-ring-container { width: 85%; aspect-ratio: 1; position: relative; }
            .tw-player-name { font-size: 12px; font-weight: 650; margin-top: .5vh; color: #f5f3ef; }
            .tw-player-prize { display: flex; align-items: center; gap: .3rem; color: #ffd166; font-weight: 700; }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ======================== CAFÉ COUNTDOWN COMPONENT ========================
const CafeCountdownDisplay = ({ timeLeft, phase }: { timeLeft: number; phase: 'betting' | 'spinning' | 'result' }) => {
  const displayTime = Math.max(0, timeLeft);
  return (
    <div className="cafe-countdown-core absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
      <div className="relative w-auto flex flex-col items-center justify-center">
        <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] relative">
          {/* Wooden outer ring */}
          <div className="absolute inset-0 rounded-full bg-[#5a2e15] shadow-inner shadow-black/50"></div>
          <div className="absolute inset-[6px] rounded-full bg-[#7e3e1a]"></div>
          {/* Dark window background */}
          <div className="absolute inset-[12px] rounded-full bg-gradient-to-b from-[#0a0a20] to-[#000000] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border border-[#ffdf7a]/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[52px] md:text-[68px] font-black text-white tracking-tighter leading-none drop-shadow-lg">
                {displayTime}
              </div>
              <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-300/90 mt-1">
                {phase === 'betting' ? 'PLACE BETS' : phase === 'spinning' ? 'SPINNING' : 'TIME\'S UP'}
              </div>
            </div>
          </div>
          {/* Decorative gold dots */}
          <div className="absolute inset-0 rounded-full border-[3px] border-[#ffdf7a]/40 pointer-events-none"></div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-[#ffdf7a] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// ======================== MAIN GAME COMPONENT ========================

export default function CarnivalFoodParty({ onClose, isOverlay = false }: { onClose?: () => void, isOverlay?: boolean }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const dragControls = useDragControls();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [spinTimeLeft, setSpinTimeLeft] = useState(0);
  const [selectedChip, setSelectedChip] = useState(1000); 
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdxs, setHighlightIdxs] = useState<number[]>([]);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false); 
  const [todayWins, setTodayWins] = useState(0); 
  const [historyData, setHistoryData] = useState<{ icon: string, bet: number, time: string }[]>([]);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showHistoryPage, setShowHistoryPage] = useState(false);

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
    if (localCoins < selectedChip) return alert('No Coins!');
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
    Object.entries(myBets).forEach(([itemId, amount]) => {
      const item = ITEMS.find(i => i.id === itemId);
      if (item && amount > 0) {
        setHistoryData(prev => [{ icon: item.icon, bet: amount, time: new Date().toLocaleTimeString() }, ...prev]);
      }
    });
    if (totalWinAmount > 0 && currentUser) {
      playSound(SOUNDS.WIN, 0.6);
      setLocalCoins(prev => prev + totalWinAmount);
      setTodayWins(prev => prev + totalWinAmount);
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

  const winnersListForPopup = useMemo(() => {
    if (!winnerData) return [];
    return [
      { name: currentUser?.displayName || "You", win: winnerData.win, avatar: currentUser?.photoURL || null, bet: winnerData.bet, isMe: true },
      { name: "Farmer Joe", win: 12000, avatar: null, bet: 5000, isMe: false },
      { name: "ForestQueen", win: 8000, avatar: null, bet: 2000, isMe: false }
    ];
  }, [winnerData, currentUser]);

  const currentDisplayTime = gameState === 'betting' ? timeLeft : (gameState === 'spinning' ? spinTimeLeft : 0);

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col justify-end z-[100] backdrop-blur-sm">
      <div className="flex-1" onClick={onClose} />
      <AnimatePresence mode="wait">
        <motion.div 
          drag dragControls={dragControls} dragListener={false} variants={floatingVariants} initial="initial" animate="animate"
          className={cn(
            "h-[55vh] min-h-[55vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#030014] text-white border border-white/10 shadow-2xl rounded-t-3xl"
          )}
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #1a0f2e, #020007)' }}
        >
          {/* HEADER */}
          <div className="w-full flex justify-between p-4 z-20">
            <div className="flex items-center gap-2">
              <button onPointerDown={(e) => dragControls.start(e)} className="w-8 h-8 rounded-full bg-[#1e1a3a] border border-[#4b4470] flex items-center justify-center"><Move className="w-4 h-4" /></button>
              <div className="relative flex items-center bg-[#1e1a2e] border border-[#3a3355] rounded-full h-7 min-w-[100px] pl-8 pr-4 text-xs font-bold">
                <div className="absolute -left-1"><DollarCoin className="w-7 h-7" /></div>
                {localCoins.toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              {[Clock, isSoundOn ? Volume2 : VolumeX, HelpCircle, X].map((Icon, i) => (
                <button key={i} onClick={i===0?()=>setShowHistoryPage(true):i===1?()=>setIsSoundOn(!isSoundOn):i===2?()=>setShowRules(true):onClose} className="w-8 h-8 rounded-full bg-[#1e1a3a] border border-[#4b4470] flex items-center justify-center"><Icon className="w-4 h-4" /></button>
              ))}
            </div>
          </div>

          {/* BOARD with integrated Café style and dynamic countdown */}
          <div className="relative w-full flex-1 flex items-center justify-center scale-[0.85] md:scale-90 -translate-y-2">
            {/* Background Café Decorative Elements (Wood texture, subtle plants) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-[#2d1a0c] rounded-b-2xl shadow-lg"></div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[95%] h-12 bg-[#4a2c16] rounded-full blur-sm opacity-40"></div>
              {/* Decorative leaves (simplified) */}
              <div className="absolute bottom-4 left-6 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-800/30 to-emerald-600/10 blur-md rotate-45"></div>
              <div className="absolute bottom-4 right-6 w-12 h-12 rounded-full bg-gradient-to-bl from-emerald-800/30 to-emerald-600/10 blur-md -rotate-12"></div>
            </div>
            
            {/* ITEMS (Fruits) placed around center */}
            {ITEMS.map((item, idx) => {
              const angle = (idx * 45) - 90;
              const radius = 140;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              const isHighlighted = highlightIdxs.includes(idx);
              return (
                <div key={item.id} className="absolute z-20" style={{ transform: `translate(${x}px, ${y}px)` }}>
                  <button 
                    onClick={() => handlePlaceBet(item.id)} 
                    disabled={gameState !== 'betting'}
                    className={cn(
                      "w-20 h-20 rounded-full border-4 border-amber-500 bg-gradient-to-br from-red-800 to-red-950 flex flex-col items-center justify-center transition-all shadow-xl active:scale-95",
                      isHighlighted && "scale-110 ring-4 ring-yellow-300 shadow-[0_0_30px_#ffd700]",
                      gameState !== 'betting' && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <span className="text-3xl drop-shadow-md">{item.icon}</span>
                    {myBets[item.id] > 0 && <div className="bg-orange-500 text-[10px] px-1 rounded-full flex items-center gap-1 mt-0.5"><DollarCoin className="w-2 h-2" />{formatKandM(myBets[item.id])}</div>}
                    <div className="text-[10px] font-bold bg-black/40 px-1 rounded-full mt-0.5">×{item.multiplier}</div>
                  </button>
                </div>
              );
            })}
            
            {/* CENTER CAFÉ COUNTDOWN */}
            <CafeCountdownDisplay timeLeft={currentDisplayTime} phase={gameState} />
          </div>

          {/* CHIP SELECTOR & BETTING CONTROLS */}
          <div className="w-full pb-4 px-4 z-20 mt-2">
            <div className="bg-black/40 rounded-2xl p-2 backdrop-blur-md border border-white/10">
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {CHIPS_DATA.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full font-bold text-xs transition-all shadow-md",
                      `bg-gradient-to-r ${chip.color}`,
                      selectedChip === chip.value ? "ring-2 ring-white scale-105" : "opacity-80"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="text-center text-[10px] text-amber-300/80 font-mono">
                BET PHASE: {timeLeft}s remaining • click any food to place bet
              </div>
            </div>
          </div>

          <WinnerPopup winnerData={winnerData} winnersList={winnersListForPopup} />

          {/* RULES PANEL */}
          {showRules && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute inset-0 bg-gradient-to-b from-purple-900 to-black z-[300] p-6">
              <button onClick={() => setShowRules(false)} className="flex items-center gap-2 text-white mb-4"><ArrowLeft className="w-5 h-5" /> Back</button>
              <h2 className="text-2xl font-black mb-4">🍒 GAME RULES</h2>
              <ul className="space-y-3 text-sm">
                <li>• Place bets on your favorite food items using chips.</li>
                <li>• Each item has a multiplier (x5 to x45).</li>
                <li>• After 30s betting, the wheel spins for 10 seconds.</li>
                <li>• If the spinner stops on your item, you win: Bet × Multiplier!</li>
                <li>• Win big and climb the leaderboard.</li>
              </ul>
              <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-white/40">Good luck!</div>
            </motion.div>
          )}

          {/* HISTORY PANEL (simple) */}
          {showHistoryPage && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute inset-0 bg-black/95 backdrop-blur-md z-[300] p-4">
              <button onClick={() => setShowHistoryPage(false)} className="flex items-center gap-2 text-white mb-4"><ArrowLeft className="w-5 h-5" /> Back</button>
              <h2 className="text-xl font-black mb-4">📜 BET HISTORY</h2>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {historyData.length === 0 && <div className="text-center text-white/40 py-8">No bets placed yet.</div>}
                {historyData.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                    <div className="flex items-center gap-2"><span className="text-2xl">{entry.icon}</span><span className="text-xs text-white/70">{entry.time}</span></div>
                    <div className="flex items-center gap-1"><DollarCoin className="w-3 h-3" /><span className="font-bold">{entry.bet.toLocaleString()}</span></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
    }
