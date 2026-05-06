'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, onSnapshot, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { X, Plus, Clock, Volume2, VolumeX, HelpCircle, Loader2, ArrowLeft, Move } from 'lucide-react';
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

// --- NEW GOLD COINS BETTING SOUND ---
const SOUNDS = {
  BET: 'https://assets.mixkit.co/active_storage/sfx/2002/2002-preview.mp3', // Gold coins sound
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
 { value: 1000, label: '1k', color: '#a855f7', bgColor: 'from-purple-400 to-purple-600' }, 
 { value: 50000, label: '50k', color: '#f97316', bgColor: 'from-orange-400 to-orange-600' }, 
 { value: 100000, label: '100k', color: '#ef4444', bgColor: 'from-red-400 to-red-600' }, 
 { value: 500000, label: '500k', color: '#22c55e', bgColor: 'from-green-400 to-green-600' }, 
 { value: 1000000, label: '1M', color: '#06b6d4', bgColor: 'from-cyan-400 to-cyan-600' }, 
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

// ======================== WINNER POPUP COMPONENT (MERGED) ========================
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
        <linearGradient id="silverInnerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5e6570" /><stop offset="100%" stopColor="#dfe3e8" />
        </linearGradient>
        <filter id="silverShadow"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".55" /></filter>
      </defs>
      <g transform="translate(70,28)" filter="url(#silverShadow)">
        <path d="M-22 -2 L-14 -16 L-6 -4 L0 -18 L6 -4 L14 -16 L22 -2 L22 8 L-22 8 Z" fill="url(#silverRingGrad)" stroke="#7c8491" strokeWidth="1.4" />
        <circle cx="0" cy="-12" r="3.3" fill="#e8edf3" stroke="#7c8491" strokeWidth="1" />
        <circle cx="-14" cy="-10" r="2.7" fill="#e8edf3" stroke="#7c8491" strokeWidth="1" />
        <circle cx="14" cy="-10" r="2.7" fill="#e8edf3" stroke="#7c8491" strokeWidth="1" />
        <rect x="-22" y="8" width="44" height="5.5" rx="2" fill="#9aa2ae" />
      </g>
      <circle cx="70" cy="90" r="48" fill="none" stroke="#2f333a" strokeWidth="14" opacity=".45" />
      <circle cx="70" cy="90" r="48" fill="none" stroke="url(#silverRingGrad)" strokeWidth="11.5" filter="url(#silverShadow)" />
      <circle cx="70" cy="90" r="42" fill="none" stroke="url(#silverInnerGrad)" strokeWidth="1.4" opacity=".85" />
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
      <circle cx="70" cy="90" r="46" fill="none" stroke="#2a1510" strokeWidth="13.5" opacity=".45" />
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
    <div className="winner-confetti pointer-events-none" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
      {pieces.map((p) => (
        <i key={p.id} style={{
          left: p.left,
          background: p.background,
          animationDelay: p.delay,
          transform: `rotate(${p.rotate})`,
          willChange: 'transform, opacity'
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

interface WinnerPopupData {
  emoji: string;
  win: number;
  bet: number;
}

interface WinnerPlayer {
  name: string;
  win: number;
  avatar: string | null;
  bet: number;
  isMe: boolean;
}

interface WinnerPopupProps {
  winnerData: WinnerPopupData | null;
  winnersList: WinnerPlayer[];
}

const WinnerPopup = ({ winnerData, winnersList }: WinnerPopupProps) => {
  const [activeWinnerIdx, setActiveWinnerIdx] = useState<number | null>(1);

  return (
    <>
      <AnimatePresence>
        {winnerData && (
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[210] flex justify-center pb-4 px-2"
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          >
            <div className="winning-card" style={{ transform: 'translateZ(0)' }}>
              <WinnerConfetti show={true} />
              
              <div className="tw-top">
                <div className="tw-emoji-box flex items-center justify-center" onClick={() => navigator.vibrate?.(10)}>
                  {winnerData.bet === 0 ? (
                    <span className="text-[60px] filter drop-shadow-md">😴</span>
                  ) : (
                    <span className="text-[70px] filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                      {winnerData.emoji}
                    </span>
                  )}
                </div>
                
                <div className="tw-stats">
                  <div className="tw-stat-row">
                    <span className="tw-stat-label">Your Prize:</span>
                    <CoinIcon2 className="tw-coin-icon" />
                    <span className="tw-stat-value"><WinnerCountUpDisplay amount={winnerData.win} /></span>
                  </div>
                  <div className="tw-stat-row">
                    <span className="tw-stat-label">Your Bet:</span>
                    <CoinIcon2 className="tw-coin-icon" />
                    <span className="tw-stat-value"><WinnerCountUpDisplay amount={winnerData.bet} /></span>
                  </div>
                </div>
              </div>

              <div className="tw-divider">
                <div className="tw-divider-line tw-left"></div>
                <div className="tw-divider-text">Top Winner</div>
                <div className="tw-divider-line tw-right"></div>
              </div>

              <div className="tw-winners">
                {[
                  { rank: 2, data: winnersList[1], idx: 1 },
                  { rank: 1, data: winnersList[0], idx: 0 },
                  { rank: 3, data: winnersList[2], idx: 2 }
                ].map((p) => (
                  <div
                    key={`rank-${p.rank}`}
                    className={`tw-player tw-rank-${p.rank} ${activeWinnerIdx === p.idx ? 'tw-active' : ''}`}
                    onClick={() => {
                      setActiveWinnerIdx(p.idx);
                      if(p.rank === 1) navigator.vibrate?.(30);
                    }}
                    style={{ opacity: 1, transform: 'translateZ(0)', willChange: 'transform' }}
                  >
                    <div className="tw-ring-container relative flex items-center justify-center">
                      {p.rank === 1 && <>
                        <div className="tw-sparkle tw-s1"></div>
                        <div className="tw-sparkle tw-s2"></div>
                        <div className="tw-sparkle tw-s3"></div>
                      </>}
                      
                      <div className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full overflow-hidden bg-slate-800 z-0 border border-white/10 shadow-inner flex items-center justify-center">
                        {p.data?.avatar ? (
                          <img src={p.data.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[20px] text-white/50">😴</span>
                        )}
                      </div>

                      <div className="relative z-10 w-full h-full" style={{ transform: 'translateZ(0)' }}>
                        <Crown rank={p.rank as 1|2|3} />
                      </div>
                    </div>
                    <div className="tw-player-name">{p.data ? p.data.name : 'Waiting...'}</div>
                    <div className="tw-player-prize">
                      <CoinIcon2 className="tw-coin-icon" />
                      <span><WinnerCountUpDisplay amount={p.data ? p.data.win : 0} duration={1100 + p.idx * 150} /></span>
                    </div>
                    <div className="tw-player-bet">Bet: {p.data ? winnerFormatKandM(p.data.bet || 0) : 0}</div>
                  </div>
                ))}
              </div>
            </div>
            <style jsx global>{`
              .winning-card {
                height: 40vh;
                min-height: 320px;
                max-height: 420px;
                width: 100%;
                max-width: 100%;
                background: linear-gradient(180deg, rgba(28,22,34,.95) 0%, rgba(12,10,14,.98) 58%, #050507 100%);
                border: 1px solid rgba(232,200,120,.18);
                border-radius: 28px 28px 12px 12px;
                padding: clamp(12px,2vh,18px) clamp(14px,3vw,22px);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 0 1px rgba(255,255,255,.05) inset, 0 -15px 40px rgba(0,0,0,0.8), 0 -5px 15px rgba(0,0,0,0.6);
                isolation: isolate;
              }
              .winning-card::before {
                content: ""; position: absolute; inset: 0;
                background: radial-gradient(400px 120px at 50% 0%, rgba(232,200,120,.14), transparent 70%),
                            radial-gradient(300px 200px at 80% 120%, rgba(255,180,60,.08), transparent 60%);
                pointer-events: none; z-index: 0;
              }
              .winning-card::after {
                content: ""; position: absolute; inset: -1px; border-radius: 28px 28px 12px 12px;
                background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,0) 30%);
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor; mask-composite: exclude;
                padding: 1px; pointer-events: none;
              }
              
              .tw-top { display: flex; align-items: center; gap: 3.2vw; height: 35%; position: relative; z-index: 2; transform: translateZ(0); }
              .tw-emoji-box {
                width: 25%; min-width: 75px; aspect-ratio: 1; position: relative; flex-shrink: 0; cursor: pointer;
                transition: transform .3s;
              }
              .tw-emoji-box:active { transform: scale(.96); }
              .tw-stats { flex: 1; display: flex; flex-direction: column; gap: 1.1vh; justify-content: center; }
              .tw-stat-row {
                display: flex; align-items: center; gap: .6rem;
                background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
                border: 1px solid rgba(255,255,255,.09); padding: .4rem .6rem; border-radius: 12px;
                font-size: clamp(12px, 2vh, 14px); font-weight: 650;
                box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 8px 18px rgba(0,0,0,.4);
                transition: transform .2s, border-color .2s;
                will-change: transform;
              }
              .tw-stat-row:hover { transform: translateY(-1px); border-color: rgba(232,200,120,.3); }
              .tw-stat-label { color: #f0eadd; min-width: 88px; opacity: .92; letter-spacing: .2px; }
              .tw-coin-icon { width: 2.2vh; height: 2.2vh; min-width: 16px; min-height: 16px; flex-shrink: 0; }
              .tw-stat-row .tw-coin-icon { animation: coinSpin 5.5s linear infinite; }
              @keyframes coinSpin { to { transform: rotateY(360deg) } }
              .tw-stat-value { color: #fff; font-variant-numeric: tabular-nums; }
              
              .tw-divider { height: 17%; display: flex; align-items: center; justify-content: center; position: relative; margin: 0 0 .4vh 0; z-index: 2; transform: translateY(-12px) translateZ(0); }
              .tw-divider-line {
                position: absolute; width: 29%; height: 2px; top: 50%;
                background: linear-gradient(90deg, transparent, #e8c878, transparent);
                filter: drop-shadow(0 0 8px rgba(232,200,120,.45)); overflow: visible;
              }
              .tw-divider-line.tw-left { left: 0; transform: scaleX(-1); }
              .tw-divider-line.tw-right { right: 0; }
              .tw-divider-line::after {
                content: ""; position: absolute; width: 0; height: 0;
                border-left: 7px solid #e8c878; border-top: 3.5px solid transparent; border-bottom: 3.5px solid transparent;
                top: -2.5px; right: -6px; filter: drop-shadow(0 0 4px rgba(232,200,120,.7));
                animation: arrowPulse 2s ease-in-out infinite;
              }
              @keyframes arrowPulse { 0%,100%{opacity:.9; transform:translateX(0)} 50%{opacity:1; transform:translateX(2px)} }
              .tw-divider-text {
                color: #e8c878; font-size: clamp(14px,2.4vh,18px); font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
                text-shadow: 0 1px 2px #000, 0 0 20px rgba(232,200,120,.4), 0 0 40px rgba(232,200,120,.15);
                padding: .15rem .7rem; background: radial-gradient(50% 120% at 50% 50%, rgba(232,200,120,.15), transparent 70%);
                border-radius: 8px;
              }
              
              .tw-winners { display: flex; justify-content: space-between; align-items: flex-end; height: 48%; gap: 2vw; position: relative; z-index: 2; transform: translateZ(0); }
              .tw-player {
                flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer;
                transition: transform .35s cubic-bezier(.2,.8,.2,1), opacity 0.3s;
                -webkit-tap-highlight-color: transparent;
              }
              .tw-player:hover { transform: translateY(-3px); }
              .tw-player:active { transform: translateY(-1px) scale(.97); }
              .tw-player.tw-rank-1 { transform: translateY(-1.1vh); }
              .tw-player.tw-rank-1:hover { transform: translateY(-1.1vh) translateY(-3px); }
              .tw-player.tw-rank-3 { transform: translateY(.45vh); }
              .tw-player.tw-rank-3:hover { transform: translateY(.45vh) translateY(-3px); }
              
              .tw-ring-container { width: 86%; max-width: 110px; aspect-ratio: 1; position: relative; transition: filter .3s; }
              .tw-ring-container > svg { width: 100%; height: 100%; overflow: visible; animation: float 4.5s ease-in-out infinite; }
              .tw-player.tw-rank-1 .tw-ring-container > svg { animation-duration: 4s; }
              .tw-player.tw-rank-2 .tw-ring-container > svg { animation-delay: .3s; }
              .tw-player.tw-rank-3 .tw-ring-container > svg { animation-delay: .6s; }
              @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
              .tw-player:hover .tw-ring-container { filter: brightness(1.12) drop-shadow(0 6px 16px rgba(255,200,80,.15)); }
              
              .tw-player-name {
                font-size: clamp(11px,1.8vh,14px); font-weight: 650; margin-top: .7vh; color: #f5f3ef;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; max-width: 118px; transition: color .2s;
              }
              .tw-player:hover .tw-player-name { color: #fff; }
              .tw-player-prize { display: flex; align-items: center; justify-content: center; gap: .35rem; margin-top: .4vh; font-size: clamp(12px,1.85vh,15px); font-weight: 700; color: #ffd166; text-shadow: 0 1px 3px rgba(0,0,0,.7); }
              .tw-player-prize .tw-coin-icon { width: 1.95vh; height: 1.95vh; min-width: 14px; min-height: 14px; }
              .tw-player-bet { font-size: clamp(9px,1.3vh,11px); color: #b9b9c2; margin-top: .2vh; font-weight: 500; }
              
              .tw-player.tw-active .tw-ring-container > svg { animation: pulseUi .6s; }
              @keyframes pulseUi { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
              
              .tw-sparkle { position: absolute; width: 4px; height: 4px; background: #fff3c4; border-radius: 50%; box-shadow: 0 0 10px #ffd76a, 0 0 18px #ffb300; opacity: 0; animation: spark 2.8s ease-in-out infinite; }
              @keyframes spark { 0%{opacity:0; transform:translateY(8px) scale(.5)} 20%{opacity:1} 80%{opacity:.7} 100%{opacity:0; transform:translateY(-18px) scale(1.1)} }
              .tw-rank-1 .tw-s1 { left: 18%; top: 28%; animation-delay: .2s }
              .tw-rank-1 .tw-s2 { right: 14%; top: 20%; animation-delay: 1s }
              .tw-rank-1 .tw-s3 { left: 25%; bottom: 20%; animation-delay: 1.7s }
              
              @media (max-width:380px){
                .winning-card { border-radius: 22px; padding: 11px 13px; }
                .tw-stat-label { min-width: 76px; }
                .tw-divider-line { width: 26%; }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ======================== MAIN GAME COMPONENT ========================

export default function CarnivalFoodParty({ onClose, isOverlay = false }: { onClose?: () => void, isOverlay?: boolean }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const dragControls = useDragControls();

  const [isLoading, setIsLoading] = useState(true);
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
  const [history, setHistory] = useState(['🍎', '🍊', '🍇', '🥦', '🥕']);
  const [historyData, setHistoryData] = useState<{ icon: string, bet: number, time: string }[]>([]);
  
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const soundRef = useRef(isSoundOn);

  // Global Top Winners State
  const [globalTopWinners, setGlobalTopWinners] = useState<WinnerPlayer[]>([]);

  // Refs for spin intervals
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bettingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const movingIndexRef = useRef<number>(0);
  // Fix closure bug: track spinning state with ref
  const isSpinningRef = useRef(false);

  useEffect(() => {
    soundRef.current = isSoundOn;
  }, [isSoundOn]);

  const playSound = (url: string, vol = 0.5) => {
    if (!soundRef.current) return;
    const audio = new Audio(url);
    audio.volume = vol;
    audio.play().catch(e => console.log("Sound play error:", e));
  };

  // Fetch & compute global top winners from globalGameWins collection
  useEffect(() => {
    if (!firestore) return;

    const unsubscribe = onSnapshot(collection(firestore, 'globalGameWins'), async (snapshot) => {
      const winsMap = new Map<string, number>(); // userId -> totalWinAmount
      snapshot.forEach(doc => {
        const data = doc.data();
        const uid = data.userId;
        const amount = data.amount || 0;
        if (uid && typeof amount === 'number') {
          winsMap.set(uid, (winsMap.get(uid) || 0) + amount);
        }
      });

      // Convert to array and sort descending by total win
      const sorted = Array.from(winsMap.entries())
        .map(([userId, totalWin]) => ({ userId, totalWin }))
        .sort((a, b) => b.totalWin - a.totalWin)
        .slice(0, 3);

      // Fetch user details for each winner
      const winnersData: WinnerPlayer[] = [];
      for (const entry of sorted) {
        try {
          const userDocRef = doc(firestore, 'users', entry.userId);
          const userSnap = await getDoc(userDocRef);
          let displayName = 'Unknown';
          let photoURL: string | null = null;
          if (userSnap.exists()) {
            const userData = userSnap.data();
            displayName = userData.displayName || 'Anonymous';
            photoURL = userData.photoURL || null;
          }
          winnersData.push({
            name: displayName,
            win: entry.totalWin,
            avatar: photoURL,
            bet: 0, // global leaderboard has no bet info
            isMe: currentUser?.uid === entry.userId
          });
        } catch (err) {
          console.error("Failed to fetch user for winner", err);
          winnersData.push({
            name: 'Unknown',
            win: entry.totalWin,
            avatar: null,
            bet: 0,
            isMe: false
          });
        }
      }

      // Pad with placeholders if less than 3
      const finalWinners: WinnerPlayer[] = [...winnersData];
      while (finalWinners.length < 3) {
        finalWinners.push({
          name: 'Waiting...',
          win: 0,
          avatar: null,
          bet: 0,
          isMe: false
        });
      }
      setGlobalTopWinners(finalWinners);
    });

    return () => unsubscribe();
  }, [firestore, currentUser]);

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

  // Clean betting interval when gameState changes or unmount
  useEffect(() => {
    if (gameState !== 'betting' || isLoading) {
      if (bettingIntervalRef.current) {
        clearInterval(bettingIntervalRef.current);
        bettingIntervalRef.current = null;
      }
      return;
    }
    
    bettingIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          startSpin(); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (bettingIntervalRef.current) {
        clearInterval(bettingIntervalRef.current);
        bettingIntervalRef.current = null;
      }
    };
  }, [gameState, isLoading]);

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || !currentUser) {
      if (!currentUser) alert('Please login to play!');
      return;
    }
    if (localCoins < selectedChip) {
      alert('You do not have enough Coins!'); 
      return;
    }
    playSound(SOUNDS.BET, 0.5); // Gold coins betting sound
    setLocalCoins(prev => prev - selectedChip);
    const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(-selectedChip) });
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const startSpin = () => {
    // Prevent multiple spin triggers
    if (gameState !== 'betting') return;
    
    // Clear any existing spin intervals
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (bettingIntervalRef.current) {
      clearInterval(bettingIntervalRef.current);
      bettingIntervalRef.current = null;
    }

    setGameState('spinning');
    setSpinTimeLeft(10);
    playSound(SOUNDS.WHIRRING, 0.7);
    isSpinningRef.current = true;

    let currentIndex = 0;
    movingIndexRef.current = currentIndex;
    setHighlightIdxs([currentIndex]);

    moveIntervalRef.current = setInterval(() => {
      if (!isSpinningRef.current) return;
      const nextIndex = (movingIndexRef.current + 1) % ITEMS.length;
      movingIndexRef.current = nextIndex;
      setHighlightIdxs([nextIndex]);
      playSound(SOUNDS.TICK, 0.25);
    }, 900);

    countdownIntervalRef.current = setInterval(() => {
      setSpinTimeLeft(prev => {
        if (prev <= 1) {
          if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          const finalItem = ITEMS[movingIndexRef.current];
          finalizeResult(finalItem);
          isSpinningRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finalizeResult = (winningItem: typeof ITEMS[0]) => {
    if (gameState !== 'spinning') return; // extra safety
    
    const betOnItem = myBets[winningItem.id] || 0;
    const totalWinAmount = betOnItem * winningItem.multiplier;
    const totalMyBetOnWinners = betOnItem;
    
    setHistory(prev => [winningItem.icon, ...prev].slice(0, 10));

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
      playSound(SOUNDS.WIN, 0.5);
      setLocalCoins(prev => prev + totalWinAmount);
      setTodayWins(prev => prev + totalWinAmount);
      
      const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(totalWinAmount) });
      
      addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
        gameId: 'fruit-party', 
        amount: totalWinAmount,
        userId: currentUser.uid,
        timestamp: new Date(),
        isGroupWin: false
      });

      const userRef = doc(firestore, 'users', currentUser.uid);
      updateDocumentNonBlocking(userRef, { 'stats.totalWins': increment(totalWinAmount) });
    }
    
    setWinnerData({ 
      emoji: winningItem.icon, 
      win: totalWinAmount, 
      bet: totalMyBetOnWinners,
      isGroup: false,
    });
    setGameState('result');

    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinnerData(null);
      setHighlightIdxs([]);
      setSpinTimeLeft(0);
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      moveIntervalRef.current = null;
      countdownIntervalRef.current = null;
    }, 5000);
  };

  // Build winners list for popup: combine globalTopWinners and if currentUser is not present we still show top3 including waiting.
  const winnersListForPopup = useMemo(() => {
    if (!globalTopWinners.length) {
      // fallback placeholders while loading
      return [
        { name: 'Waiting...', win: 0, avatar: null, bet: 0, isMe: false },
        { name: 'Waiting...', win: 0, avatar: null, bet: 0, isMe: false },
        { name: 'Waiting...', win: 0, avatar: null, bet: 0, isMe: false }
      ];
    }
    return globalTopWinners;
  }, [globalTopWinners]);

  const winnerPopupData = winnerData ? {
    emoji: winnerData.emoji,
    win: winnerData.win,
    bet: winnerData.bet,
  } : null;

  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (bettingIntervalRef.current) clearInterval(bettingIntervalRef.current);
    };
  }, []);

  if (isLoading) return <LoadingPage />;

  // If user is not logged in, show a friendly message overlay but keep game visible
  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-black/10 flex flex-col justify-end z-[100]">
        <div className="flex-1" onClick={onClose} />
        <div className="h-[80vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white rounded-none shadow-2xl items-center justify-center">
          <div className="bg-black/60 p-6 rounded-2xl text-center">
            <p className="text-xl font-bold mb-2">🔐 Login Required</p>
            <p className="text-sm opacity-80">Please login to play Carnival Food Party!</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-amber-500 rounded-full font-bold">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/10 flex flex-col justify-end z-[100]">
      <div className="flex-1" onClick={onClose} />

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
              "h-[80vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white select-none border border-white/20 shadow-2xl transition-all duration-300",
              !isOverlay && "min-h-[80vh]",
              "rounded-none"
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
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300/90 to-amber-600/90 border-2 border-amber-400/80 flex items-center justify-center text-white cursor-grab active:cursor-grabbing touch-none shadow-[0_4px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform"
                  >
                    <Move className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </button>

                  <div className="relative flex items-center bg-gradient-to-br from-[#1e2350]/90 to-[#0d1030] border border-amber-400/60 rounded-full h-7 min-w-[105px] ml-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.2)]">
                    <div className="absolute -left-1 w-8 h-8 flex items-center justify-center z-10 drop-shadow-md">
                      <DollarCoin className="w-8 h-8" />
                    </div>
                    <span className="pl-9 pr-5 text-white font-medium text-xs tracking-wider drop-shadow">{localCoins.toLocaleString()}</span>
                    <button className="absolute -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-black shadow-md border-2 border-amber-400/80 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4 font-bold drop-shadow" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative">
                   <div className="absolute top-12 right-2 z-10 pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                     <Cloud className="w-28 h-auto" />
                  </div>
                  {[ 
                    { icon: Clock, action: () => setShowHistoryPage(true) }, 
                    { icon: isSoundOn ? Volume2 : VolumeX, action: () => setIsSoundOn(!isSoundOn) }, 
                    { icon: HelpCircle, action: () => setShowRules(true) }, 
                    { icon: X, action: onClose } 
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300/90 to-amber-600/90 border-2 border-amber-400/80 flex items-center justify-center text-white shadow-[0_4px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform">
                      <btn.icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 mt-1 relative">
                <div className="bg-black/60 border border-yellow-500/50 text-yellow-400 px-3 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-2 w-fit text-sm">
                  <span className="text-base leading-none drop-shadow-md">🏆</span> {todayWins.toLocaleString()}
                </div>
                <div className="absolute top-10 left-6 z-10 pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                   <Cloud className="w-14 h-auto" />
                </div>
              </div>
            </div>

            {/* BOARD AREA */}
            <div className="relative w-full flex-1 flex items-center justify-center scale-95 -translate-y-6" style={{ perspective: '1000px' }}>
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
                      <span className="text-4xl font-black text-white italic">
                        {gameState === 'spinning' ? spinTimeLeft : (gameState === 'betting' ? timeLeft : '🎉')}
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
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="w-full bg-orange-500 flex items-center justify-center py-0.5 z-20 gap-1">
                            <DollarCoin className="w-3 h-3" />
                            <span className="text-[10px] font-black text-white">{betAmount >= 1000 ? `${betAmount/1000}K` : betAmount}</span>
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
                <div className="absolute -top-16 left-0 z-10 pointer-events-none"> <Cloud className="w-24 h-auto" /> </div>
                <span className="text-4xl relative z-20">
                  🥗
                </span>
                <div className="absolute -top-16 right-0 z-10 pointer-events-none"> <Cloud className="w-24 h-auto" /> </div>
                <span className="text-4xl relative z-20">
                  🍕
                </span>
              </div>
              <div className="w-full h-12 bg-[#3e1a05] rounded-xl border-2 border-[#f5d0a9] flex items-center px-4 gap-3 overflow-x-auto no-scrollbar">
                 <span className="text-[10px] font-bold text-[#f5d0a9] uppercase mr-2 border-r border-[#f5d0a9]/30 pr-2">History</span>
                 {history.map((icon, i) => (
                   <div key={i} className="min-w-[32px] h-8 bg-black/30 rounded-lg flex items-center justify-center text-lg">{icon}</div>
                 ))}
              </div>
            </div>

            {/* CHIPS AREA */}
            <div className="w-full bg-gradient-to-b from-[#270c01] to-[#1a0801] p-6 flex justify-center gap-3 z-20 border-t-4 border-[#f5d0a9]">
              {CHIPS_DATA.map(chip => (
                <button 
                  key={chip.value}
                  onClick={() => setSelectedChip(chip.value)}
                  className={cn(
                    "w-16 h-16 rounded-full border-[3px] border-dashed border-white/40 flex items-center justify-center text-[10px] font-black transition-all relative bg-gradient-to-br shadow-[0_5px_0_rgba(0,0,0,0.4)]",
                    chip.color,
                    selectedChip === chip.value ? "scale-110 -translate-y-2 ring-4 ring-yellow-400 border-solid opacity-100" : "opacity-70"
                  )}
                >
                  <div className="absolute inset-1.5 rounded-full border-2 border-white/20 bg-black/10 flex items-center justify-center">
                    <span className="text-white font-black text-sm">{chip.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* WINNER POPUP */}
            <WinnerPopup winnerData={winnerPopupData} winnersList={winnersListForPopup} />

            {/* RULES & HISTORY PANELS */}
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
                  <p className="text-yellow-200 font-bold">4. Spin lasts 10 seconds – wherever the light stops, that item wins!</p>
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
                        <div className="flex items-center gap-1 font-black text-gray-800">
                          <DollarCoin className="w-4 h-4" />
                          <span>{rec.bet.toLocaleString()}</span>
                        </div>
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
