'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking, 
 useDoc, 
 useMemoFirebase, 
 addDocumentNonBlocking,
 useCollection 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  doc, 
  increment, 
  serverTimestamp, 
  getDoc, 
  collection,
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
 Volume2, 
 VolumeX, 
 HelpCircle, 
 X,
 Plus,
 Clock,
 Move 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const useCountUp = (to: number, duration = 900) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = value;
    const t0 = performance.now();
    
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + (to - start) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [to, duration]);

  return value;
};

const formatKandM = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

const CountUpDisplay = ({ amount, duration = 900 }: { amount: number, duration?: number }) => {
  const val = useCountUp(amount, duration);
  return <span>{formatKandM(val)}</span>;
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
    <circle cx="16" cy="16" r="12" fill="none" stroke="#ffecb3" strokeWidth="1" opacity=".8" />
    <text x="16" y="21.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text>
  </svg>
);

const Crown = ({ rank }: { rank: 1 | 2 | 3 }) => {
  if (rank === 1) return (
    <svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d6" /><stop offset="22%" stopColor="#ffe08a" />
          <stop offset="52%" stopColor="#ffc73a" /><stop offset="78%" stopColor="#f19e1a" />
          <stop offset="100%" stopColor="#d87607" />
        </linearGradient>
        <filter id="goldShadow">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#ff9d00" floodOpacity=".7" />
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity=".9" />
        </filter>
      </defs>
      <g transform="translate(70,22) scale(1.1)" filter="url(#goldShadow)">
        <path d="M-24 -2 L-15 -18 L-6 -4 L0 -20 L6 -4 L15 -18 L24 -2 L24 9 L-24 9 Z" fill="url(#goldRingGrad)" stroke="#b26a00" strokeWidth="1.5" />
        <path d="M-24 -2 L-15 -18 L-6 -4 L0 -20 L6 -4 L15 -18 L24 -2" fill="none" stroke="#fff7dc" strokeWidth="1.1" opacity=".95" />
        <circle cx="0" cy="-13" r="3.8" fill="#ffdf76" stroke="#b26a00" strokeWidth="1" />
        <rect x="-24" y="9" width="48" height="6.5" rx="2.2" fill="#c78212" />
      </g>
      <circle cx="70" cy="90" r="50" fill="none" stroke="#3e2805" strokeWidth="15" opacity=".6" />
      <circle cx="70" cy="90" r="50" fill="none" stroke="url(#goldRingGrad)" strokeWidth="13" filter="url(#goldShadow)" />
      <g transform="translate(104,126)">
        <circle r="17" fill="url(#goldRingGrad)" stroke="#9c5e06" strokeWidth="2.4" filter="url(#goldShadow)" />
        <text x="0" y="6" textAnchor="middle" fontSize="16.5" fontWeight="900" fill="white" fontFamily="Arial" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: '.6px' }}>1</text>
      </g>
    </svg>
  );
  if (rank === 2) return (
    <svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="silverRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" /><stop offset="30%" stopColor="#e6e8ee" />
          <stop offset="60%" stopColor="#b6bcc6" /><stop offset="100%" stopColor="#7a8290" />
        </linearGradient>
        <linearGradient id="silverInnerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5e6570" /><stop offset="100%" stopColor="#dfe3e8" />
        </linearGradient>
        <filter id="silverShadow"><feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity=".75" /></filter>
      </defs>
      <g transform="translate(70,28)" filter="url(#silverShadow)">
        <path d="M-22 -2 L-14 -16 L-6 -4 L0 -18 L6 -4 L14 -16 L22 -2 L22 8 L-22 8 Z" fill="url(#silverRingGrad)" stroke="#7c8491" strokeWidth="1.4" />
        <circle cx="0" cy="-12" r="3.3" fill="#e8edf3" stroke="#7c8491" strokeWidth="1" />
        <circle cx="-14" cy="-10" r="2.7" fill="#e8edf3" stroke="#7c8491" strokeWidth="1" />
        <circle cx="14" cy="-10" r="2.7" fill="#e8edf3" stroke="#7c8491" strokeWidth="1" />
        <rect x="-22" y="8" width="44" height="5.5" rx="2" fill="#9aa2ae" />
      </g>
      <circle cx="70" cy="90" r="48" fill="none" stroke="#2f333a" strokeWidth="14" opacity=".55" />
      <circle cx="70" cy="90" r="48" fill="none" stroke="url(#silverRingGrad)" strokeWidth="11.5" filter="url(#silverShadow)" />
      <circle cx="70" cy="90" r="42" fill="none" stroke="url(#silverInnerGrad)" strokeWidth="1.4" opacity=".95" />
      <g transform="translate(104,124)">
        <circle r="15.5" fill="url(#silverRingGrad)" stroke="#5a6270" strokeWidth="2" filter="url(#silverShadow)" />
        <text x="0" y="5.5" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="white" fontFamily="Arial">2</text>
      </g>
    </svg>
  );
  return (
    <svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bronzeRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe2d1" /><stop offset="30%" stopColor="#e9a17d" />
          <stop offset="65%" stopColor="#c76d46" /><stop offset="100%" stopColor="#8f4a2e" />
        </linearGradient>
        <filter id="bronzeShadow"><feDropShadow dx="0" dy="4.5" stdDeviation="5" floodOpacity=".75" /></filter>
      </defs>
      <g transform="translate(70,28)" filter="url(#bronzeShadow)">
        <path d="M-22 -2 L-14 -16 L-6 -4 L0 -18 L6 -4 L14 -16 L22 -2 L22 8 L-22 8 Z" fill="url(#bronzeRingGrad)" stroke="#7a3e26" strokeWidth="1.4" />
        <circle cx="0" cy="-12" r="3.2" fill="#f0b599" stroke="#7a3e26" strokeWidth="1" />
        <rect x="-22" y="8" width="44" height="5.5" rx="2" fill="#8a4f35" />
      </g>
      <circle cx="70" cy="90" r="46" fill="none" stroke="#2a1510" strokeWidth="13.5" opacity=".55" />
      <circle cx="70" cy="90" r="46" fill="none" stroke="url(#bronzeRingGrad)" strokeWidth="11" filter="url(#bronzeShadow)" />
      <g transform="translate(102,122)">
        <circle r="15" fill="url(#bronzeRingGrad)" stroke="#5c2c1a" strokeWidth="2" filter="url(#bronzeShadow)" />
        <text x="0" y="5" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="white" fontFamily="Arial">3</text>
      </g>
    </svg>
  );
};

const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;
  return (
    <div className="confetti pointer-events-none">
      {Array.from({ length: 26 }).map((_, i) => (
        <i key={i} style={{
          left: `${5 + Math.random() * 90}%`,
          background: `hsl(${38 + Math.random() * 30}, 100%, ${62 + Math.random() * 18}%)`,
          animationDelay: `${Math.random() * 0.2}s`,
          transform: `rotate(${Math.random() * 360}deg)`
        }} />
      ))}
    </div>
  );
};

const ANIMALS = [
  { id: 'panda', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top', index: 0 },
  { id: 'rabbit', emoji: '🐔', multiplier: 5, label: 'x5', pos: 'top-right', index: 1 },
  { id: 'cow', emoji: '🐼', multiplier: 5, label: 'x5', pos: 'right', index: 2 },
  { id: 'dog', emoji: '🐻‍❄️', multiplier: 5, label: 'x5', pos: 'bottom-right', index: 3 },
  { id: 'fox', emoji: '🦊', multiplier: 10, label: 'x10', pos: 'bottom', index: 4 },
  { id: 'bear', emoji: '🐻', multiplier: 15, label: 'x15', pos: 'bottom-left', index: 5 },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'left', index: 6 },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'top-left', index: 7 },
];

const CHIPS_DATA = [
 { value: 100, label: '100', color: '#3b82f6', bgColor: 'from-blue-400 to-blue-600' }, 
 { value: 1000, label: '1k', color: '#a855f7', bgColor: 'from-purple-400 to-purple-600' }, 
 { value: 50000, label: '50k', color: '#f97316', bgColor: 'from-orange-400 to-orange-600' }, 
 { value: 100000, label: '100k', color: '#ef4444', bgColor: 'from-red-400 to-red-600' }, 
 { value: 500000, label: '500k', color: '#22c55e', bgColor: 'from-green-400 to-green-600' }, 
 { value: 1000000, label: '1M', color: '#06b6d4', bgColor: 'from-cyan-400 to-cyan-600' }, 
 { value: 5000000, label: '5M', color: '#fef3c7', bgColor: 'from-amber-100 to-amber-200' }, 
 { value: 10000000, label: '10M', color: '#581c87', bgColor: 'from-purple-800 to-purple-950' }, 
 { value: 100000000, label: '100M', color: '#eab308', bgColor: 'from-yellow-400 to-yellow-600' }, 
];

const getGameDay = () => {
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setHours(5, 30, 0, 0); 
  if (now < resetTime) now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

export default function ForestPartyGame({ onBack }: { onBack?: () => void } = {}) {
 const [isLoading, setIsLoading] = useState(true);
 
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();
 const dragControls = useDragControls();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(25);
 const [selectedChip, setSelectedChip] = useState(100);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<{id: string, type: 'single' | 'left' | 'right'}[]>([]);
 const [isMuted, setIsMuted] = useState(false);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number; bet: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, bgColor: string, x: number, y: number}[]>([]);
 const [fakeDroppedChips, setFakeDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, bgColor: string, x: number, y: number, delay: number}[]>([]);
 
 const [showRules, setShowRules] = useState(false);
 const [showRecord, setShowRecord] = useState(false);
 const [gameRecords, setGameRecords] = useState<{ id: number; emoji: string; bet: number; win: number; timestamp: number }[]>([]);
 
 const [shiningGroup, setShiningGroup] = useState<'none' | 'left' | 'right'>('none');
 const [dailyWinnings, setDailyWinnings] = useState(0);

 const [activeWinnerIdx, setActiveWinnerIdx] = useState<number | null>(null);

 const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'forest-party'), [firestore]);
 const { data: gameData } = useDoc(gameDocRef);

 const winnersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'globalGameWins'), 
      where('gameId', '==', 'forest-party'), 
      orderBy('timestamp', 'desc'),           
      limit(20)                               
    );
 }, [firestore]);
  
 const { data: liveWins } = useCollection(winnersQuery);
  
 const winnersList = useMemo(() => {
    const currentRoundId = Math.floor(Date.now() / 40000);
    const allWins = [...(liveWins || [])];

    if (winnerData && winnerData.win > 0 && currentUser) {
        const localWinExists = allWins.some(w => w.userId === currentUser.uid && w.roundId === currentRoundId);
        if (!localWinExists) {
            allWins.push({
                userId: currentUser.uid,
                username: userProfile?.username || 'Guest',
                avatarUrl: userProfile?.avatarUrl || null,
                amount: winnerData.win,
                roundId: currentRoundId,
                timestamp: { seconds: Date.now() / 1000 }
            });
        }
    }

    const currentRoundWins = allWins.filter(win => win.roundId === currentRoundId);
    const sortedByAmount = [...currentRoundWins].sort((a, b) => b.amount - a.amount);
    const uniqueTopWinners: any[] = [];
    const seenUsers = new Set();

    for (const win of sortedByAmount) {
      if (!seenUsers.has(win.userId)) {
         seenUsers.add(win.userId);
         uniqueTopWinners.push({
           name: win.username,
           win: win.amount,
           avatar: win.avatarUrl,
           bet: Math.floor(win.amount / 5), 
           isMe: win.userId === currentUser?.uid
         });
         if (uniqueTopWinners.length === 3) break;
      }
    }
    return uniqueTopWinners;
 }, [liveWins, currentUser, winnerData, userProfile]);

 const myBetsRef = useRef(myBets);
 const gameStateRef = useRef(gameState);
 const isMountedRef = useRef(true);

 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);
 const tickAudio = useRef<HTMLAudioElement | null>(null);
 const winAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
    myBetsRef.current = myBets;
    gameStateRef.current = gameState;
 }, [myBets, gameState]);

 useEffect(() => {
    const timer = setTimeout(() => {
        if (isMountedRef.current) setIsLoading(false);
    }, 2000); 
    return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
 }, []);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     const saved = localStorage.getItem('forestPartyRecords');
     if (saved) {
       try { setGameRecords(JSON.parse(saved)); } catch (e) {}
     }

     const savedDaily = localStorage.getItem('forestPartyDailyWin');
     if (savedDaily) {
       try {
         const parsed = JSON.parse(savedDaily);
         if (parsed.gameDay === getGameDay()) {
           setDailyWinnings(parsed.amount);
         } else {
           setDailyWinnings(0);
           localStorage.setItem('forestPartyDailyWin', JSON.stringify({ gameDay: getGameDay(), amount: 0 }));
         }
       } catch (e) {}
     } else {
       localStorage.setItem('forestPartyDailyWin', JSON.stringify({ gameDay: getGameDay(), amount: 0 }));
     }

     const ROUND_DUR = 40000;
     const currentRoundId = Math.floor(Date.now() / ROUND_DUR);
     
     const now = new Date();
     const resetTime = new Date(now);
     resetTime.setHours(5, 30, 0, 0); 
     if (now < resetTime) resetTime.setDate(resetTime.getDate() - 1);
     
     const firstRound = Math.floor(resetTime.getTime() / ROUND_DUR);
     const seededRandom = (seed: number) => {
         const x = Math.sin(seed) * 10000;
         return x - Math.floor(x);
     };

     const initialHistory = [];
     for (let r = currentRoundId - 1; r >= firstRound; r--) {
         let groupType: 'none' | 'left' | 'right' = 'none';
         const chance = seededRandom(r + 1);
         if (chance < 0.025) groupType = 'left'; 
         else if (chance < 0.05) groupType = 'right'; 
         
         const winningId = ANIMALS[Math.floor(seededRandom(r + 2) * ANIMALS.length)].id;
         initialHistory.push({ id: winningId, type: groupType });
     }
     setHistory(initialHistory);

     chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3'); 
     spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1899/1899-preview.mp3');
     tickAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2040/2040-preview.mp3');
     winAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); 
     
     [chipAudio, spinAudio, tickAudio, winAudio].forEach(ref => {
        if (ref.current) ref.current.load();
     });
   }
 }, []);

 useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
        if (!isMountedRef.current) return;
        if (Math.random() > 0.2) { 
            const dropCount = Math.floor(Math.random() * 6) + 10; 
            const newFakeChips = [];
            for (let i = 0; i < dropCount; i++) {
                const randomAnimalIdx = Math.floor(Math.random() * ANIMALS.length);
                const chipOptions = [0, 0, 0, 1, 1, 2, 3, 4, 5];
                const randomChip = CHIPS_DATA[chipOptions[Math.floor(Math.random() * chipOptions.length)]] || CHIPS_DATA[0];
                newFakeChips.push({
                    id: Math.floor(100000 + Math.random() * 900000),
                    itemIdx: randomAnimalIdx,
                    label: randomChip.label,
                    bgColor: randomChip.bgColor,
                    color: randomChip.color,
                    x: (Math.random() * 40) - 20,
                    y: (Math.random() * 30) - 15,
                    delay: Math.random() * 0.8 
                });
            }
            setFakeDroppedChips(prev => [...prev.slice(-30), ...newFakeChips]);
        }
    }, 2000); 
    return () => clearInterval(interval);
 }, [gameState]);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     localStorage.setItem('forestPartyRecords', JSON.stringify(gameRecords.slice(0, 20))); 
   }
 }, [gameRecords]);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined && isMountedRef.current) {
      setLocalCoins(userProfile.wallet.coins);
  }
 }, [userProfile?.wallet?.coins]);

 const playSound = useCallback((type: 'bet' | 'spin' | 'stop' | 'tick' | 'win') => {
  if (isMuted) return;
  try {
    const audios = { bet: chipAudio.current, tick: tickAudio.current, spin: spinAudio.current, win: winAudio.current };
    const audio = audios[type as keyof typeof audios];
    if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) playPromise.catch(() => {});
    }
    if (type === 'stop') spinAudio.current?.pause();
  } catch (error) {}
 }, [isMuted]);

 const finalizeResult = useCallback((id: string, groupType: 'none' | 'left' | 'right') => {
  if (!isMountedRef.current) return;
  setDroppedChips([]);
  setFakeDroppedChips([]);
  let winningIds = [id];
  if (groupType === 'left') winningIds = ['lion', 'tiger', 'fox', 'bear'];
  else if (groupType === 'right') winningIds = ['panda', 'rabbit', 'cow', 'dog'];
  
  let winAmount = 0;
  const currentBets = myBetsRef.current;
  
  winningIds.forEach(wId => {
      const winItem = ANIMALS.find(i => i.id === wId);
      winAmount += (currentBets[wId] || 0) * (winItem?.multiplier || 0);
  });
  
  if (isNaN(winAmount) || winAmount < 0) winAmount = 0;
  
  const totalBetAmount = Object.values(currentBets).reduce((a, b) => a + b, 0);
  
  if (winAmount > 0) {
     playSound('win'); 
     setDailyWinnings(prev => {
        const newAmount = prev + winAmount;
        localStorage.setItem('forestPartyDailyWin', JSON.stringify({ gameDay: getGameDay(), amount: newAmount }));
        return newAmount;
     });
  }
  
  setShiningGroup(groupType); 
  const newRoundRecords = Object.entries(currentBets).map(([betId, betAmount]) => {
     const animal = ANIMALS.find(a => a.id === betId);
     return {
       id: Math.floor(100000 + Math.random() * 900000),
       emoji: animal?.emoji || '❓',
       bet: betAmount as number,
       win: winningIds.includes(betId) ? (betAmount as number) * (animal?.multiplier || 0) : 0,
       timestamp: Date.now()
     };
  });
  
  if (newRoundRecords.length > 0) setGameRecords(prev => [...newRoundRecords, ...prev]);
  
  const historyItem = { id: id, type: groupType === 'none' ? 'single' as const : groupType as 'left' | 'right' };
  setHistory(prev => [historyItem, ...prev]);

  let displayEmoji = ANIMALS.find(i => i.id === id)?.emoji || '🏆';
  if (groupType === 'left') displayEmoji = '🦁🐯🦊🐻';
  if (groupType === 'right') displayEmoji = '🐰🐻‍❄️🐼🐔'; 
  
  setWinnerData({ emoji: displayEmoji, win: winAmount, bet: totalBetAmount });
  setActiveWinnerIdx(1); 

  if (winAmount > 0 && currentUser && firestore && !isNaN(winAmount)) {
   const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
   updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(winAmount) });
   
   addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
    gameId: 'forest-party', 
    roundId: Math.floor(Date.now() / 40000), 
    userId: currentUser.uid,
    username: userProfile?.username || 'Guest',
    avatarUrl: userProfile?.avatarUrl || null,
    amount: winAmount,
    timestamp: serverTimestamp()
   });

   const userRef = doc(firestore, 'users', currentUser.uid);
   updateDocumentNonBlocking(userRef, {
     'stats.totalWins': increment(winAmount),
     updatedAt: serverTimestamp()
   });
  }
 }, [currentUser, firestore, playSound, userProfile]);

 useEffect(() => {
  const ROUND_DUR = 40000; 
  const BET_DUR = 25000;   
  const SPIN_DUR = 10000;  
  
  const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      const now = Date.now();
      const currentRoundId = Math.floor(now / ROUND_DUR);
      const elapsed = now % ROUND_DUR;
      
      if (elapsed < BET_DUR) {
          if (gameStateRef.current !== 'betting') {
              setGameState('betting');
              setWinnerData(null);
              setMyBets({});
              setHighlightIdx(null);
              setShiningGroup('none');
          }
          setTimeLeft(Math.ceil((BET_DUR - elapsed) / 1000));
      } 
      else if (elapsed < BET_DUR + SPIN_DUR) {
          if (gameStateRef.current !== 'spinning') {
              setGameState('spinning');
              playSound('spin');
          }
          
          setTimeLeft(Math.ceil((BET_DUR + SPIN_DUR - elapsed) / 1000));
          
          // --- RANDOM SPIN JUMP LOGIC A/C TO TIME ---
          const spinElapsed = elapsed - BET_DUR;
          const ticks = Math.floor(spinElapsed / 120); // Changes highlight every 120ms
          
          const spinSeed = currentRoundId * 10000 + ticks;
          const r = Math.sin(spinSeed) * 10000;
          const randomFraction = r - Math.floor(r);
          
          setHighlightIdx(Math.floor(randomFraction * 8));
      } 
      else {
          if (gameStateRef.current !== 'result') {
              setGameState('result');
              playSound('stop');
              
              const triggerResult = async () => {
                  // --- WINNER BASED ON EXACTLY WHERE IT STOPPED ---
                  const totalTicks = Math.floor(SPIN_DUR / 120);
                  const endSeed = currentRoundId * 10000 + totalTicks;
                  const rEnd = Math.sin(endSeed) * 10000;
                  const endFraction = rEnd - Math.floor(rEnd);
                  
                  let winningId = ANIMALS[Math.floor(endFraction * 8)].id;

                  let groupType: 'none' | 'left' | 'right' = 'none';
                  const chanceSeed = Math.sin(currentRoundId) * 10000;
                  const chanceFraction = chanceSeed - Math.floor(chanceSeed);
                  if (chanceFraction < 0.025) groupType = 'left'; 
                  else if (chanceFraction < 0.05) groupType = 'right'; 

                  if (firestore) {
                      try {
                          const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'forest-party'));
                          if (oracleSnap.exists() && oracleSnap.data().isActive) {
                              const forced = oracleSnap.data().forcedResult;
                              if (ANIMALS.some(a => a.id === forced)) { winningId = forced; groupType = 'none'; }
                              updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'forest-party'), { isActive: false });
                          }
                      } catch (e) {}
                  }

                  if (!isMountedRef.current) return;
                  const winIdx = ANIMALS.findIndex(a => a.id === winningId);
                  setHighlightIdx(winIdx);
                  finalizeResult(winningId, groupType);
              };
              triggerResult();
          }
          setTimeLeft(0);
      }
  }, 100);
  
  return () => clearInterval(interval);
 }, [firestore, playSound, finalizeResult]);

 const handlePlaceBet = (animal: typeof ANIMALS[0]) => {
  if (gameStateRef.current !== 'betting' || !currentUser) return;
  
  if (selectedChip <= 0 || isNaN(selectedChip)) return;
  
  if (localCoins < selectedChip) {
   toast({ title: 'You do not have enough Coins!', variant: 'destructive' });
   return;
  }
  
  playSound('bet');
  const chipInfo = CHIPS_DATA.find(c => c.value === selectedChip);
  const newChip = {
   id: Math.floor(100000 + Math.random() * 900000),
   itemIdx: animal.index,
   label: chipInfo?.label || '10',
   bgColor: chipInfo?.bgColor || 'from-blue-400 to-cyan-500',
   color: chipInfo?.color || '#3b82f6',
   x: (Math.random() * 30) - 15,
   y: (Math.random() * 20) - 10
  };
  
  setDroppedChips(prev => [...prev, newChip]);
  setLocalCoins(prev => prev - selectedChip);
  
  if (firestore) {
    const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(-selectedChip) });
  }
  setMyBets(prev => ({ ...prev, [animal.id]: (prev[animal.id] || 0) + selectedChip }));
 };

 const isWinningAnimal = (idx: number, itemId: string) => {
    if (gameState === 'result') {
        if (shiningGroup === 'left' && ['lion','tiger','fox','bear'].includes(itemId)) return true;
        if (shiningGroup === 'right' && ['panda','rabbit','cow','dog'].includes(itemId)) return true;
        return highlightIdx === idx;
    }
    return highlightIdx === idx;
 };

 return (
  <motion.div 
    drag
    dragControls={dragControls}
    dragListener={false}
    dragMomentum={false}
    whileDrag={{ scale: 1.02, transition: { duration: 0.2 }, zIndex: 50 }}
    className="h-[66dvh] my-auto w-full relative select-none overscroll-none" 
    style={{ touchAction: 'none' }}
  >
   <motion.div
    className="w-full h-full flex flex-col relative overflow-hidden font-sans text-white bg-[#0F2A1A] rounded-3xl border border-white/30 shadow-[0_0_30px_rgba(0,255,100,0.15)] ring-1 ring-white/10"
    style={{ willChange: 'transform, opacity', transform: 'translate3d(0,0,0)', WebkitFontSmoothing: 'antialiased' }}
   >
       {/* Ambient Backglow */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.15)_0%,transparent_65%)] pointer-events-none z-0 mix-blend-screen" />

       {/* Background */}
       <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F2A1A] via-[#1E4D2C] to-[#2E7D32] opacity-95" />
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#0B2112] to-transparent opacity-90" />
       </div>

       {/* --- WINNING PAGE FROM BOTTOM --- */}
       <AnimatePresence>
        {winnerData && (
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[210] flex justify-center pb-4 px-2"
          >
              <div className="winning-card">
                  <Confetti show={true} />
                  
                  <div className="tw-top">
                    <div className="tw-emoji-box flex items-center justify-center" onClick={() => navigator.vibrate?.(10)}>
                        {winnerData.bet === 0 ? (
                            <span className="text-[60px] filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">😴</span>
                        ) : (
                            <span className="text-[70px] filter drop-shadow-[0_10px_25px_rgba(255,215,0,0.6)]">
                               {winnerData.emoji}
                            </span>
                        )}
                    </div>
                    
                    <div className="tw-stats">
                      <div className="tw-stat-row">
                        <span className="tw-stat-label">Your Prize:</span>
                        <CoinIcon2 className="tw-coin-icon filter brightness-125 drop-shadow-[0_0_5px_#FFD700]" />
                        <span className="tw-stat-value"><CountUpDisplay amount={winnerData.win} /></span>
                      </div>
                      <div className="tw-stat-row">
                        <span className="tw-stat-label">Your Bet:</span>
                        <CoinIcon2 className="tw-coin-icon filter brightness-125 drop-shadow-[0_0_5px_#FFD700]" />
                        <span className="tw-stat-value"><CountUpDisplay amount={winnerData.bet} /></span>
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
                        style={{ opacity: p.data ? 1 : 0.4 }}
                      >
                        <div className="tw-ring-container relative flex items-center justify-center">
                          {p.rank === 1 && <>
                            <div className="tw-sparkle tw-s1"></div>
                            <div className="tw-sparkle tw-s2"></div>
                            <div className="tw-sparkle tw-s3"></div>
                          </>}
                          
                          <div className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full overflow-hidden bg-slate-800 z-0 border border-white/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center">
                            {p.data?.avatar ? (
                                <img src={p.data.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[20px] text-white/50">😴</span>
                            )}
                          </div>

                          <div className="relative z-10 w-full h-full filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                            <Crown rank={p.rank as 1|2|3} />
                          </div>
                        </div>
                        <div className="tw-player-name">{p.data ? p.data.name : 'Waiting...'}</div>
                        <div className="tw-player-prize">
                          <CoinIcon2 className="tw-coin-icon filter brightness-125" />
                          <span><CountUpDisplay amount={p.data ? p.data.win : 0} duration={1100 + p.idx * 150} /></span>
                        </div>
                        <div className="tw-player-bet">Bet: {p.data ? formatKandM(p.data.bet || 0) : 0}</div>
                      </div>
                    ))}
                  </div>
              </div>
          </motion.div>
        )}
       </AnimatePresence>

       {/* RECORD PAGE */}
       <AnimatePresence>
        {showRecord && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[300] h-[40dvh] bg-black/95 backdrop-blur-3xl border-t-[2px] border-zinc-700/50 rounded-none shadow-[0_-10px_50px_rgba(0,0,0,0.8)] flex flex-col">
                <div className="relative p-4 flex items-center justify-center border-b border-white/10">
                    <h3 className="text-white font-black uppercase text-sm tracking-widest filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Game Record</h3>
                    <button onClick={() => setShowRecord(false)} className="absolute right-4 top-4 text-zinc-400 bg-white/10 hover:bg-white/20 transition-colors rounded-full p-1.5 border border-white/20 shadow-md"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 no-scrollbar">
                    {gameRecords.length === 0 ? <p className="text-white/20 text-center text-xs italic mt-8">No records found yet...</p> : gameRecords.map((rec) => (
                        <div key={rec.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{rec.emoji}</span>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Bet Amount</span>
                                    <span className="text-xs font-black text-white">{rec.bet}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Winning</span>
                                <span className={cn("text-sm font-black", rec.win > 0 ? "text-emerald-400 filter drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "text-zinc-500")}>{rec.win > 0 ? `+${formatKandM(rec.win)}` : '0'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
       </AnimatePresence>

       {/* HEADER */}
       <header className="relative z-50 flex items-center justify-between px-4 py-2 bg-transparent shrink-0 mt-1 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                style={{ touchAction: 'none' }}
                className="cursor-grab active:cursor-grabbing h-9 w-9 flex items-center justify-center rounded-full border border-white/50 bg-gradient-to-b from-white/30 to-black/60 text-white shadow-[0_0_15px_rgba(255,255,255,0.2),inset_0_2px_6px_rgba(255,255,255,0.5)] backdrop-blur-md touch-none"
              >
                <Move size={16} className="filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] pointer-events-none" />
              </div>
              
              <div className="flex items-center bg-black/40 backdrop-blur-xl rounded-md border border-white/30 h-[32px] pl-1 pr-1 ml-1 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                  <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-md p-0.5 shadow-sm">
                      <CoinIcon2 className="h-5 w-5 filter brightness-125 drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                  </div>
                  <span className="text-white px-2 font-bold text-[12px] filter drop-shadow-md">{localCoins}</span>
                  <button className="h-[24px] w-[24px] bg-gradient-to-b from-[#7bdcb5] to-[#4caf50] hover:brightness-110 transition-all rounded-md flex items-center justify-center text-white border-[1.5px] border-white/50 shadow-[0_0_8px_rgba(76,175,80,0.6)]"><Plus className="h-3 w-3 stroke-[3]" /></button>
              </div>
          </div>

          <div className="flex items-center gap-2">
              <button onClick={() => setShowRecord(true)} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/50 bg-gradient-to-b from-white/30 to-black/60 text-white transition-active active:scale-90 shadow-[0_0_15px_rgba(255,255,255,0.2),inset_0_2px_6px_rgba(255,255,255,0.5)] backdrop-blur-md"><Clock size={16} className="filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] brightness-110" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/50 bg-gradient-to-b from-white/30 to-black/60 text-white transition-active active:scale-90 shadow-[0_0_15px_rgba(255,255,255,0.2),inset_0_2px_6px_rgba(255,255,255,0.5)] backdrop-blur-md">{isMuted ? <VolumeX size={16} className="filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" /> : <Volume2 size={16} className="filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />}</button>
              <button onClick={() => setShowRules(true)} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/50 bg-gradient-to-b from-white/30 to-black/60 text-white transition-active active:scale-90 shadow-[0_0_15px_rgba(255,255,255,0.2),inset_0_2px_6px_rgba(255,255,255,0.5)] backdrop-blur-md"><HelpCircle size={16} className="filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] brightness-110" /></button>
              <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/50 bg-gradient-to-b from-white/30 to-black/60 text-white transition-active active:scale-90 shadow-[0_0_15px_rgba(255,255,255,0.2),inset_0_2px_6px_rgba(255,255,255,0.5)] backdrop-blur-md"><X size={16} className="filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" /></button>
          </div>
       </header>

       {/* WINNING HISTORY */}
       <div className="px-4 py-1 shrink-0 z-40 relative">
         <div className="w-full bg-gradient-to-b from-white/30 to-white/10 backdrop-blur-2xl py-2.5 px-4 flex items-center gap-3 overflow-x-auto no-scrollbar border border-white/40 rounded-2xl shadow-[inset_0_2px_8px_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.6)] ring-1 ring-white/20">
            <div className="flex flex-col items-center justify-center border-r border-white/30 pr-3 mr-1 shrink-0">
              <span className="text-[7px] text-white/80 uppercase font-black tracking-widest leading-none mb-0.5 filter drop-shadow-md">Winning</span>
              <span className="text-[9px] text-white font-black tracking-tighter leading-none filter drop-shadow-md">History</span>
            </div>
            <div className="flex items-center gap-4">
              {history.map((h, i) => {
                  const animal = ANIMALS.find(a => a.id === h.id);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                      {h.type === 'single' ? (
                        <div className="relative h-7 w-7 rounded-full flex items-center justify-center bg-gradient-to-b from-white/30 to-black/40 border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.5)]">
                           <div className="absolute inset-x-1 top-0.5 h-1/2 bg-gradient-to-b from-white/60 to-transparent rounded-full opacity-80" />
                           <span className="text-base z-10 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{animal?.emoji}</span>
                        </div>
                      ) : (
                        <div className="relative w-7 h-7 rounded-full flex flex-col items-center justify-center bg-gradient-to-b from-[#a0522d] to-[#4a2511] border border-[#ffdab9] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.6)]">
                            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-gradient-to-b from-white/70 to-transparent rounded-full pointer-events-none z-20" />
                            <div className="grid grid-cols-2 gap-x-[1.5px] gap-y-[1.5px] justify-center items-center z-10">
                                {h.type === 'left' ? (
                                    <>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🦁</span>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🐯</span>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🦊</span>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🐻</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🐰</span>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🐻‍❄️</span>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🐼</span>
                                        <span className="text-[6px] filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] leading-none text-center">🐔</span>
                                    </>
                                )}
                            </div>
                        </div>
                      )}
                    </div>
                  )
              })}
            </div>
         </div>
       </div>

       <main className="flex-1 w-full flex flex-col items-center justify-start pt-8 px-4 relative">
        {/* MIX LEFT */}
        <div className={cn(
            "absolute top-[3.5%] left-[6%] z-30 w-[48px] h-[48px] rounded-full flex flex-col items-center justify-center border-[2.5px] transition-all duration-500 overflow-hidden",
            shiningGroup === 'left' 
                ? "border-[#FFD700] shadow-[0_0_35px_#FFD700,inset_0_0_15px_rgba(255,215,0,0.8)] scale-110 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700" 
                : "bg-gradient-to-b from-[#8b4513] to-[#4a2511] border-[#ffdab9] shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_6px_rgba(255,255,255,0.4)] hover:brightness-110"
        )}>
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[75%] h-[35%] bg-gradient-to-b from-white/70 to-transparent rounded-full pointer-events-none z-20" />
            <div className="grid grid-cols-2 gap-x-1 gap-y-1 justify-center items-center z-10 mb-0.5 mt-0.5">
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🦁</span>
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🐯</span>
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🦊</span>
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🐻</span>
            </div>
            <span className={cn("text-[6px] font-black uppercase mt-0 z-10 filter drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]", shiningGroup === 'left' ? "text-yellow-100" : "text-white")}>Mix</span>
        </div>

        {/* MIX RIGHT */}
        <div className={cn(
            "absolute top-[3.5%] right-[6%] z-30 w-[48px] h-[48px] rounded-full flex flex-col items-center justify-center border-[2.5px] transition-all duration-500 overflow-hidden",
            shiningGroup === 'right' 
                ? "border-[#FFD700] shadow-[0_0_35px_#FFD700,inset_0_0_15px_rgba(255,215,0,0.8)] scale-110 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700" 
                : "bg-gradient-to-b from-[#8b4513] to-[#4a2511] border-[#ffdab9] shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_6px_rgba(255,255,255,0.4)] hover:brightness-110"
        )}>
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[75%] h-[35%] bg-gradient-to-b from-white/70 to-transparent rounded-full pointer-events-none z-20" />
            <div className="grid grid-cols-2 gap-x-1 gap-y-1 justify-center items-center z-10 mb-0.5 mt-0.5">
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🐰</span>
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🐻‍❄️</span>
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🐼</span>
                <span className="text-[9px] filter drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] leading-none text-center">🐔</span>
            </div>
            <span className={cn("text-[6px] font-black uppercase mt-0 z-10 filter drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]", shiningGroup === 'right' ? "text-yellow-100" : "text-white")}>Mix</span>
        </div>

        <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full z-10 overflow-visible pointer-events-none filter drop-shadow-[0_0_15px_rgba(255,215,0,0.2)]" viewBox="0 0 100 100">
            <defs>
                <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity="0.9"/>
                </filter>
                <linearGradient id="glossyGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a0522d" />
                  <stop offset="25%" stopColor="#ffd700" />
                  <stop offset="50%" stopColor="#fff8dc" />
                  <stop offset="75%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#a0522d" />
                </linearGradient>
            </defs>
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <line x1="50" y1="50" x2="50" y2="13" stroke="rgba(0,0,0,0.7)" strokeWidth="11" strokeLinecap="round" filter="url(#shadow3D)" />
                <line x1="50" y1="50" x2="50" y2="13" stroke="#703816" strokeWidth="9" strokeLinecap="round" />
                <line x1="50" y1="50" x2="50" y2="13" stroke="url(#glossyGold)" strokeWidth="6" strokeLinecap="round" />
                <line x1="50.5" y1="50" x2="50.5" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              </g>
            ))}
          </svg>

          {/* TIMER CENTER */}
          <div className={cn(
            "relative z-20 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 overflow-hidden", 
            gameState === 'spinning' 
              ? "bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#9a3412] shadow-[0_15px_30px_rgba(0,0,0,0.8),0_0_30px_rgba(252,211,77,0.6),inset_0_6px_15px_rgba(255,255,255,0.9)] border-[3px] border-[#fef08a]" 
              : "bg-gradient-to-b from-[#a0522d] via-[#6b361a] to-[#3a1c0d] shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_6px_15px_rgba(255,255,255,0.6)] border-[3px] border-[#ffdab9]"
          )}>
            <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-gradient-to-b from-white/90 to-transparent rounded-full pointer-events-none z-0" />
            <p className="relative z-10 text-[8px] font-black uppercase text-[#fff8dc] filter drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
                {gameState === 'betting' ? 'Time' : 'SPIN'}
            </p>
            <span className="relative z-10 text-2xl font-black text-white filter drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
                {gameState === 'result' ? '0' : timeLeft}
            </span>
          </div>

          {ANIMALS.map((item, idx) => {
            const active = isWinningAnimal(idx, item.id);
            const isSpinning = gameState === 'spinning';
            const isHighlighted = highlightIdx === idx;
            const applyColorless = isSpinning && !isHighlighted;
            return (
            <motion.div key={item.id} className={cn("absolute z-20", item.pos === 'top' && "top-[2%] left-1/2 -translate-x-1/2", item.pos === 'top-right' && "top-[8%] right-[8%]", item.pos === 'right' && "right-[2%] top-1/2 -translate-y-1/2", item.pos === 'bottom-right' && "bottom-[8%] right-[8%]", item.pos === 'bottom' && "bottom-[2%] left-1/2 -translate-x-1/2", item.pos === 'bottom-left' && "bottom-[8%] left-[8%]", item.pos === 'left' && "left-[2%] top-1/2 -translate-y-1/2", item.pos === 'top-left' && "top-[8%] left-[8%]")}>
              <button onClick={() => handlePlaceBet(item)} className="relative group outline-none">
                <div className={cn(
                    "h-[86px] w-[86px] rounded-full flex flex-col items-center justify-start pt-2 border-[3px] bg-gradient-to-b from-[#5c2e16] to-[#381a0b] transition-all overflow-hidden relative shadow-[0_8px_0_#b07d50,0_15px_20px_rgba(0,0,0,0.6)] hover:brightness-110", 
                    active ? "scale-110 border-[#FFD700] shadow-[0_0_40px_#FFD700,inset_0_0_20px_#FFD700] z-50 ring-4 ring-[#FFD700]/80" : "border-[#ffdab9]",
                    applyColorless ? "grayscale-[0.9] brightness-75 opacity-90 duration-300" : "grayscale-0 opacity-100 brightness-110 duration-150"
                )} style={{ transform: 'translate3d(0,0,0)', willChange: 'transform, filter' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none z-0" />
                    <span className={cn("text-[38px] z-10 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]", active ? "scale-125 rotate-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" : "")}>{item.emoji}</span>
                    <div className={cn("absolute bottom-0 left-0 right-0 py-0.5 text-center z-20 transition-colors duration-150", (active && gameState !== 'spinning') ? "bg-white/30 backdrop-blur-xl border-t border-white/50" : "bg-[#4a2511] border-t border-[#ffdab9]")}>
                        <span className="text-[7px] font-bold uppercase tracking-tighter text-white filter drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]">Win {item.multiplier}x</span>
                    </div>
                </div>
                
                <AnimatePresence>
                    {droppedChips.filter(c => c.itemIdx === idx).map(chip => (
                        <motion.div key={chip.id} initial={{ opacity: 0, scale: 3, y: -60 }} animate={{ opacity: 1, scale: 1, y: chip.y, x: chip.x }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.8),0_0_10px_rgba(255,255,255,0.3)] z-40 pointer-events-none overflow-hidden border border-black/50" style={{ background: `repeating-conic-gradient(from 0deg, #fff 0deg 20deg, ${chip.color} 20deg 40deg)`, padding: '3px', width: '26px', height: '26px', transform: 'translate3d(0,0,0)' }}>
                            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-gradient-to-b from-white/80 to-transparent rounded-full z-50" />
                            <div className={cn("w-full h-full rounded-full flex items-center justify-center border-[1.5px] border-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] relative overflow-hidden", `bg-gradient-to-br ${chip.bgColor}`)}>
                                <span className="text-[6.5px] font-black text-white filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] z-40">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                    {fakeDroppedChips.filter(c => c.itemIdx === idx).map(chip => (
                        <motion.div key={chip.id} initial={{ opacity: 0, scale: 2, y: -80 }} animate={{ opacity: 1, scale: 1, y: chip.y, x: chip.x }} exit={{ opacity: 0 }} transition={{ delay: chip.delay, duration: 0.3 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full shadow-[0_6px_12px_rgba(0,0,0,0.7)] z-30 pointer-events-none overflow-hidden border border-black/40" style={{ background: `repeating-conic-gradient(from 0deg, #fff 0deg 20deg, ${chip.color} 20deg 40deg)`, padding: '2.5px', width: '22px', height: '22px' }}>
                            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-gradient-to-b from-white/80 to-transparent rounded-full z-50" />
                            <div className={cn("w-full h-full rounded-full flex items-center justify-center border border-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] relative", `bg-gradient-to-br ${chip.bgColor}`)}>
                                <span className="text-[5.5px] font-bold text-white/95 z-40 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {myBets[item.id] > 0 && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-300 to-yellow-500 text-[#4a2511] text-[8px] font-black px-2.5 py-[2px] rounded-sm border border-white z-[60] shadow-[0_4px_10px_rgba(0,0,0,0.6),0_0_8px_#facc15] whitespace-nowrap tracking-tight">
                        {myBets[item.id] >= 1000 ? (myBets[item.id]/1000)+'K' : myBets[item.id]}
                    </div>
                )}
              </button>
            </motion.div>
            )
          })}
        </div>
       </main>

       {/* CHIPS SELECTOR */}
       <div className="w-full bg-gradient-to-t from-[#0a0502] to-[#1b0d07] border-t-[3px] border-[#6b361a] py-4 px-4 flex items-center justify-start gap-4 overflow-x-auto no-scrollbar shrink-0 z-40 relative shadow-[0_-10px_30px_rgba(0,0,0,0.8)] rounded-none">
          {CHIPS_DATA.map((chip) => (
              <button
                  key={chip.value}
                  onClick={() => setSelectedChip(chip.value)}
                  className={cn(
                      "relative shrink-0 flex flex-col items-center justify-center rounded-full transition-all duration-200 overflow-hidden outline-none",
                      selectedChip === chip.value ? "scale-110 -translate-y-2 shadow-[0_15px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(255,255,255,0.2)] border-2 border-white/50" : "scale-95 opacity-80 hover:opacity-100 shadow-[0_8px_15px_rgba(0,0,0,0.6)] border border-black/50 hover:brightness-110"
                  )}
                  style={{ background: `repeating-conic-gradient(from 0deg, #fff 0deg 20deg, ${chip.color} 20deg 40deg)`, padding: '6px', width: '56px', height: '56px' }}
              >
                  <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[85%] h-[45%] bg-gradient-to-b from-white/80 to-transparent rounded-full z-50 pointer-events-none" />
                  <div className={cn("w-full h-full rounded-full flex items-center justify-center border-[2.5px] border-black/50 shadow-[inset_0_3px_6px_rgba(0,0,0,0.6)] relative", `bg-gradient-to-br ${chip.bgColor}`)}>
                      <span className="text-[12px] font-black text-white filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] z-40">{chip.label}</span>
                  </div>
                  {selectedChip === chip.value && (
                      <div className="absolute -bottom-3 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_20px_#facc15,0_0_10px_#fff]" />
                  )}
              </button>
          ))}
       </div>

       {/* RULES SHEET */}
       <AnimatePresence>
        {showRules && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[300] h-[30dvh] bg-black/95 backdrop-blur-3xl border-t-[3px] border-zinc-700/50 rounded-none shadow-[0_-15px_60px_rgba(0,0,0,0.95)] flex flex-col">
                <div className="relative p-4 flex items-center justify-center border-b border-white/10">
                    <h3 className="text-white font-black uppercase text-sm tracking-widest filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Rules</h3>
                    <button onClick={() => setShowRules(false)} className="absolute right-4 top-4 text-zinc-400 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-full p-1.5 shadow-md"><X size={18} /></button>
                </div>
                <div className="flex-1 p-5 flex flex-col gap-3 justify-center">
                    {[
                      "Select a Chip and Choose your animal", 
                      "If you win you will get Coins amount (Bet × multiplier)", 
                      "45× gives you the highest Coins Amount", 
                      "If you lose you will not receive any coins amount"
                    ].map((rule, i) => (
                        <div key={i} className="flex gap-3 items-start group">
                            <span className="bg-gradient-to-b from-zinc-700 to-zinc-900 border border-white/20 text-yellow-500 text-[10px] font-black h-5 w-5 rounded-md flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]">{i+1}</span>
                            <p className="text-zinc-300 text-xs font-bold leading-tight group-hover:text-white group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] transition-all">{rule}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
       </AnimatePresence>

       {/* CSS STYLES */}
       <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        
        button { -webkit-tap-highlight-color: transparent; }

        .winning-card {
          height: 40vh;
          min-height: 320px;
          max-height: 420px;
          width: 100%;
          max-width: 100%;
          background: linear-gradient(180deg, rgba(28,22,34,.98) 0%, rgba(12,10,14,1) 58%, #050507 100%);
          border: 1px solid rgba(255,215,0,.3);
          border-radius: 28px 28px 12px 12px;
          padding: clamp(12px,2vh,18px) clamp(14px,3vw,22px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,.1) inset, 0 -20px 50px rgba(0,0,0,0.9), 0 -10px 25px rgba(255,215,0,0.15);
          isolation: isolate;
        }
        .winning-card::before {
          content: ""; position: absolute; inset: 0;
          background: radial-gradient(400px 120px at 50% 0%, rgba(255,215,0,.2), transparent 70%),
                      radial-gradient(300px 200px at 80% 120%, rgba(255,180,60,.15), transparent 60%);
          pointer-events: none; z-index: 0;
        }
        .winning-card::after {
          content: ""; position: absolute; inset: -1px; border-radius: 28px 28px 12px 12px;
          background: linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,0) 30%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 1px; pointer-events: none;
        }
        
        .tw-top { display: flex; align-items: center; gap: 3.2vw; height: 35%; position: relative; z-index: 2; }
        .tw-emoji-box {
          width: 25%; min-width: 75px; aspect-ratio: 1; position: relative; flex-shrink: 0; cursor: pointer;
          transition: transform .3s;
        }
        .tw-emoji-box:active { transform: scale(.96); }
        .tw-stats { flex: 1; display: flex; flex-direction: column; gap: 1.1vh; justify-content: center; }
        .tw-stat-row {
          display: flex; align-items: center; gap: .6rem;
          background: linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.15); padding: .4rem .6rem; border-radius: 12px;
          font-size: clamp(12px, 2vh, 14px); font-weight: 650;
          box-shadow: 0 1px 0 rgba(255,255,255,.1) inset, 0 10px 20px rgba(0,0,0,.5);
          transition: transform .2s, border-color .2s;
        }
        .tw-stat-row:hover { transform: translateY(-1px); border-color: rgba(255,215,0,.4); }
        .tw-stat-label { color: #f0eadd; min-width: 88px; opacity: .92; letter-spacing: .2px; text-shadow: 0 1px 2px #000; }
        .tw-coin-icon { width: 2.2vh; height: 2.2vh; min-width: 16px; min-height: 16px; flex-shrink: 0; }
        .tw-stat-row .tw-coin-icon { animation: coinSpin 5.5s linear infinite; }
        @keyframes coinSpin { to { transform: rotateY(360deg) } }
        .tw-stat-value { color: #fff; font-variant-numeric: tabular-nums; text-shadow: 0 0 10px rgba(255,255,255,0.4); }
        
        .tw-divider { height: 17%; display: flex; align-items: center; justify-content: center; position: relative; margin: 0 0 .4vh 0; z-index: 2; transform: translateY(-4px); }
        .tw-divider-line {
          position: absolute; width: 29%; height: 2px; top: 50%;
          background: linear-gradient(90deg, transparent, #FFD700, transparent);
          filter: drop-shadow(0 0 10px rgba(255,215,0,.6)); overflow: visible;
        }
        .tw-divider-line.tw-left { left: 0; transform: scaleX(-1); }
        .tw-divider-line.tw-right { right: 0; }
        .tw-divider-line::after {
          content: ""; position: absolute; width: 0; height: 0;
          border-left: 7px solid #FFD700; border-top: 3.5px solid transparent; border-bottom: 3.5px solid transparent;
          top: -2.5px; right: -6px; filter: drop-shadow(0 0 6px rgba(255,215,0,.8));
          animation: arrowPulse 2s ease-in-out infinite;
        }
        @keyframes arrowPulse { 0%,100%{opacity:.9; transform:translateX(0)} 50%{opacity:1; transform:translateX(2px)} }
        .tw-divider-text {
          color: #FFD700; font-size: clamp(14px,2.4vh,18px); font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
          text-shadow: 0 2px 4px #000, 0 0 25px rgba(255,215,0,.6), 0 0 50px rgba(255,215,0,.3);
          padding: .15rem .7rem; background: radial-gradient(50% 120% at 50% 50%, rgba(255,215,0,.2), transparent 70%);
          border-radius: 8px;
        }
        
        .tw-winners { display: flex; justify-content: space-between; align-items: flex-end; height: 48%; gap: 2vw; position: relative; z-index: 2; }
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
        .tw-player:hover .tw-ring-container { filter: brightness(1.2) drop-shadow(0 8px 20px rgba(255,215,0,.25)); }
        
        .tw-player-name {
          font-size: clamp(11px,1.8vh,14px); font-weight: 650; margin-top: .7vh; color: #f5f3ef;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; max-width: 118px; transition: color .2s;
          text-shadow: 0 1px 2px #000;
        }
        .tw-player:hover .tw-player-name { color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.5); }
        .tw-player-prize { display: flex; align-items: center; justify-content: center; gap: .35rem; margin-top: .4vh; font-size: clamp(12px,1.85vh,15px); font-weight: 700; color: #ffd166; text-shadow: 0 2px 4px rgba(0,0,0,.9), 0 0 10px rgba(255,215,0,0.5); }
        .tw-player-prize .tw-coin-icon { width: 1.95vh; height: 1.95vh; min-width: 14px; min-height: 14px; }
        .tw-player-bet { font-size: clamp(9px,1.3vh,11px); color: #b9b9c2; margin-top: .2vh; font-weight: 500; text-shadow: 0 1px 2px #000; }
        
        .tw-player.tw-active .tw-ring-container > svg { animation: pulseUi .6s; }
        @keyframes pulseUi { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
        
        .tw-sparkle { position: absolute; width: 4px; height: 4px; background: #fff3c4; border-radius: 50%; box-shadow: 0 0 12px #fff, 0 0 22px #ffb300; opacity: 0; animation: spark 2.8s ease-in-out infinite; }
        @keyframes spark { 0%{opacity:0; transform:translateY(8px) scale(.5)} 20%{opacity:1} 80%{opacity:.8} 100%{opacity:0; transform:translateY(-18px) scale(1.2)} }
        .tw-rank-1 .tw-s1 { left: 18%; top: 28%; animation-delay: .2s }
        .tw-rank-1 .tw-s2 { right: 14%; top: 20%; animation-delay: 1s }
        .tw-rank-1 .tw-s3 { left: 25%; bottom: 20%; animation-delay: 1.7s }
        
        .confetti { position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: hidden; border-radius: 28px; }
        .confetti i { position: absolute; width: 6px; height: 10px; border-radius: 2px; opacity: 0; top: 38%; animation: conf 900ms cubic-bezier(.2,.7,.3,1) forwards; box-shadow: 0 0 5px rgba(255,255,255,0.5); }
        @keyframes conf { 0%{opacity:1; transform:translateY(0) rotate(0) scale(1)} 100%{opacity:0; transform:translateY(90px) rotate(520deg) scale(.8)} }
        
        @media (max-width:380px){
          .winning-card { border-radius: 22px; padding: 11px 13px; }
          .tw-stat-label { min-width: 76px; }
          .tw-divider-line { width: 26%; }
        }
       `}</style>
   </motion.div>
  </motion.div>
 );
}
