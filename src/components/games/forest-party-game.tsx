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
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

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

const SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7];

const getGameDay = () => {
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setHours(5, 30, 0, 0); 
  if (now < resetTime) now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const formatKandM = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

export default function ForestPartyGame({ onBack }: { onBack?: () => void } = {}) {
 // --- LOADING STATE ---
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
 const [history, setHistory] = useState<{id: string, type: 'single' | 'left' | 'right'}[]>([
    {id: 'panda', type: 'single'}, {id: 'lion', type: 'single'}, {id: 'fox', type: 'single'}
 ]);
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
 const [bannerMsg, setBannerMsg] = useState<'Start Betting' | 'Betting Over' | null>('Start Betting');

 const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'forest-party'), [firestore]);
 const { data: gameData } = useDoc(gameDocRef);

 // Real-time Winner Data logic
 const winnersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'globalGameWins'), 
      where('gameId', '==', 'forest-party'), 
      orderBy('timestamp', 'desc'),           
      limit(5)                                
    );
 }, [firestore]);
  
 const { data: liveWins } = useCollection(winnersQuery);
  
 const winnersList = useMemo(() => {
    return liveWins?.map(w => ({
      name: w.username,
      win: w.amount,
      avatar: w.avatarUrl,
      isMe: w.userId === currentUser?.uid
    })) || [];
 }, [liveWins, currentUser]);

 const myBetsRef = useRef(myBets);
 const isMountedRef = useRef(true);
 const chaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 const winnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);
 const tickAudio = useRef<HTMLAudioElement | null>(null);
 const winAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
    myBetsRef.current = myBets;
 }, [myBets]);

 // Loader timer
 useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 2000); 
    return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
    isMountedRef.current = true;
    return () => {
        isMountedRef.current = false;
        if (chaseTimeoutRef.current) clearTimeout(chaseTimeoutRef.current);
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        if (winnerTimeoutRef.current) clearTimeout(winnerTimeoutRef.current);
    };
 }, []);

 useEffect(() => {
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setBannerMsg(null);
    }, 1500);
    return () => {
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
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

     chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3'); 
     spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1899/1899-preview.mp3');
     tickAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2040/2040-preview.mp3');
     winAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); 
   }
 }, []);

 useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
        if (Math.random() > 0.2) { 
            const dropCount = Math.floor(Math.random() * 6) + 10; 
            const newFakeChips = [];
            for (let i = 0; i < dropCount; i++) {
                const randomAnimalIdx = Math.floor(Math.random() * ANIMALS.length);
                const chipOptions = [0, 0, 0, 1, 1, 2, 3, 4, 5];
                const randomChip = CHIPS_DATA[chipOptions[Math.floor(Math.random() * chipOptions.length)]] || CHIPS_DATA[0];
                newFakeChips.push({
                    id: Date.now() + Math.random() + i,
                    itemIdx: randomAnimalIdx,
                    label: randomChip.label,
                    bgColor: randomChip.bgColor,
                    color: randomChip.color,
                    x: (Math.random() * 40) - 20,
                    y: (Math.random() * 30) - 15,
                    delay: Math.random() * 0.8 
                });
            }
            setFakeDroppedChips(prev => [...prev.slice(-60), ...newFakeChips]);
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
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  let interval: NodeJS.Timeout;
  if (gameState === 'betting') {
      interval = setInterval(() => {
          setTimeLeft((prev) => {
              if (prev <= 1) {
                  clearInterval(interval);
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  }
  return () => clearInterval(interval);
 }, [gameState]);

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
       id: Date.now() + Math.random(),
       emoji: animal?.emoji || '❓',
       bet: betAmount as number,
       win: winningIds.includes(betId) ? (betAmount as number) * (animal?.multiplier || 0) : 0,
       timestamp: Date.now()
     };
  });
  if (newRoundRecords.length > 0) setGameRecords(prev => [...newRoundRecords, ...prev]);
  const historyItem = { id: id, type: groupType === 'none' ? 'single' as const : groupType as 'left' | 'right' };
  setHistory(prev => [historyItem, ...prev].slice(0, 15));
  let displayEmoji = ANIMALS.find(i => i.id === id)?.emoji || '🏆';
  if (groupType === 'left') displayEmoji = '🦁🐯🦊🐻';
  if (groupType === 'right') displayEmoji = '🐰🐻‍❄️🦝🐔'; 
  
  // Modal pop-up set karna har baar
  setWinnerData({ emoji: displayEmoji, win: winAmount, bet: totalBetAmount });
  setGameState('result');

  if (winAmount > 0 && currentUser && firestore) {
   const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
   updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(winAmount) });
   
   addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
    gameId: 'forest-party', 
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

  winnerTimeoutRef.current = setTimeout(() => {
   if (!isMountedRef.current) return;
   setWinnerData(null);
   setMyBets({});
   setHighlightIdx(null);
   setShiningGroup('none'); 
   setGameState('betting');
   setTimeLeft(25);
   if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
   setBannerMsg('Start Betting');
   bannerTimeoutRef.current = setTimeout(() => {
       if (isMountedRef.current) setBannerMsg(null);
   }, 1500);
  }, 5000);
 }, [currentUser, firestore, playSound, userProfile]);

 const startSpin = useCallback(async () => {
  if (!isMountedRef.current) return;
  if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
  setBannerMsg('Betting Over');
  setGameState('spinning');
  playSound('spin'); 
  bannerTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) setBannerMsg(null);
  }, 1000);
  let groupType: 'none' | 'left' | 'right' = 'none';
  const chance = Math.random();
  if (chance < 0.025) groupType = 'left'; 
  else if (chance < 0.05) groupType = 'right'; 
  let winningId = ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id;
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
  const targetIdx = ANIMALS.findIndex(a => a.id === winningId);
  let currentStep = 0;
  const spins = 7; 
  const totalSteps = (SEQUENCE.length * spins) + targetIdx;
  let speed = 40; 
  const runChase = () => {
   if (!isMountedRef.current) return;
   const activeIdx = currentStep % SEQUENCE.length;
   setHighlightIdx(activeIdx);
   if (currentStep % 2 === 0) playSound('tick'); 
   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 25) speed += 20; 
    else if (remaining < 45) speed += 4;  
    currentStep++;
    chaseTimeoutRef.current = setTimeout(runChase, speed);
   } else {
    playSound('stop');
    chaseTimeoutRef.current = setTimeout(() => finalizeResult(winningId, groupType), 500);
   }
  };
  runChase();
 }, [firestore, playSound, finalizeResult]);

 useEffect(() => {
    if (gameState === 'betting' && timeLeft === 0) startSpin();
 }, [timeLeft, gameState, startSpin]);

 const handlePlaceBet = (animal: typeof ANIMALS[0]) => {
  if (gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'You do not have any Coins!', variant: 'destructive' });
   return;
  }
  playSound('bet');
  const chipInfo = CHIPS_DATA.find(c => c.value === selectedChip);
  const newChip = {
   id: Date.now(),
   itemIdx: animal.index,
   label: chipInfo?.label || '10',
   bgColor: chipInfo?.bgColor || 'from-blue-400 to-cyan-500',
   color: chipInfo?.color || '#3b82f6',
   x: (Math.random() * 30) - 15,
   y: (Math.random() * 20) - 10
  };
  setDroppedChips(prev => [...prev, newChip]);
  setLocalCoins(prev => prev - selectedChip);
  const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
  updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(-selectedChip) });
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

 if (isLoading) {
    return (
        <div className="h-[66vh] my-auto w-full flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-4 shadow-sm" />
            <h2 className="text-2xl font-black text-gray-800 tracking-widest uppercase">Ummy</h2>
        </div>
    );
 }

 return (
  <motion.div 
    drag
    dragControls={dragControls}
    dragListener={false}
    dragMomentum={false}
    whileDrag={{ scale: 1.02, transition: { duration: 0.2 }, zIndex: 50 }}
    className="h-[66vh] my-auto w-full relative" 
  >
   <motion.div
    className="w-full h-full flex flex-col relative overflow-hidden font-sans text-white bg-[#0F2A1A] rounded-3xl border border-white/20 shadow-2xl"
   >
       <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F2A1A] via-[#1E4D2C] to-[#2E7D32]" />
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#0B2112] to-transparent opacity-80" />
          <div className="absolute bottom-[5%] left-[10%] text-6xl drop-shadow-xl opacity-60 select-none">🌲</div>
          <div className="absolute bottom-[2%] right-[15%] text-7xl drop-shadow-xl opacity-50 select-none">🌳</div>
          <div className="absolute bottom-[10%] right-[5%] text-5xl drop-shadow-xl opacity-40 select-none">🌲</div>
       </div>

       <AnimatePresence mode="wait">
        {bannerMsg && (
            <motion.div
                key={bannerMsg}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute top-[45%] left-0 right-0 z-[250] flex justify-center pointer-events-none"
            >
                <div className="bg-[#fdf8e7] border-y-4 border-[#e6c17e] py-3 px-10 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                    <span className="text-white font-black text-2xl uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" style={{ WebkitTextStroke: '1px #b48530' }}>
                        {bannerMsg}
                    </span>
                </div>
            </motion.div>
        )}
       </AnimatePresence>

       {/* WINNING PAGE (WINNER MODAL) */}
       <AnimatePresence>
        {winnerData && (
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            className="fixed bottom-0 left-0 right-0 z-[210] bg-[#fdf8e7] border-t-[6px] border-orange-500 rounded-t-[32px] p-5 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-6"
          >
              <div className="w-16 h-1.5 bg-orange-200 rounded-full mb-4 shrink-0" />
              
              <div className="w-full flex items-center justify-between bg-orange-100/50 p-4 rounded-2xl border border-orange-200 mb-5 shadow-sm">
                 <div className="flex flex-col items-center justify-center pl-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-400 blur-xl opacity-30 animate-pulse" />
                      <div className="relative text-6xl filter drop-shadow-md">{winnerData.emoji}</div>
                    </div>
                    <span className="text-[10px] font-black text-orange-500 uppercase mt-1 tracking-wider">Winner</span>
                 </div>
                 
                 <div className="flex flex-col items-end gap-2 pr-2">
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">My Win</span>
                       <div className="flex items-center gap-1.5">
                         <GoldCoinIcon className="h-5 w-5 filter drop-shadow-md" />
                         <span className="text-2xl font-black text-emerald-600 tabular-nums">+{formatKandM(winnerData.win)}</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">My Bet Amount</span>
                       <span className="text-sm font-black text-[#4a2511] tabular-nums">{formatKandM(winnerData.bet)}</span>
                    </div>
                 </div>
              </div>

              <div className="w-full flex flex-col items-center">
                 <span className="text-[10px] font-black text-[#4a2511]/60 uppercase tracking-widest mb-3">Top Winners</span>
                 
                 <div className="flex items-end justify-center gap-6 w-full h-[90px]">
                    {/* #2 Winner Slot */}
                    {winnersList[1] ? (
                       <div className="flex flex-col items-center relative pb-2 opacity-90">
                          <div className="absolute -top-2.5 z-10 bg-gradient-to-r from-gray-300 to-gray-400 text-white text-[9px] font-bold px-1.5 rounded-sm shadow-md">#2</div>
                          <div className="w-12 h-12 rounded-full border-[3px] border-gray-300 shadow-[0_0_10px_rgba(192,192,192,0.6)] overflow-hidden bg-white/50">
                             <img src={winnersList[1].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winnersList[1].name}`} alt="user" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[9px] font-bold mt-1 text-[#4a2511] truncate w-14 text-center">{winnersList[1].name}</span>
                          <span className="text-[8px] text-orange-600 font-bold">{formatKandM(winnersList[1].win)}</span>
                       </div>
                    ) : <div className="w-12" />}

                    {/* #1 Winner Slot */}
                    {winnersList[0] ? (
                       <div className="flex flex-col items-center relative z-20">
                          <div className="absolute -top-3 z-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#4a2511] text-[10px] font-black px-2 py-0.5 rounded-sm shadow-md border border-white/50">#1</div>
                          <div className="w-16 h-16 rounded-full border-[4px] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] overflow-hidden bg-white/50 animate-pulse">
                             <img src={winnersList[0].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winnersList[0].name}`} alt="user" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-black mt-1 text-[#4a2511] truncate w-16 text-center">{winnersList[0].name}</span>
                          <span className="text-[9px] text-orange-600 font-bold">{formatKandM(winnersList[0].win)}</span>
                       </div>
                    ) : <div className="w-16" />}

                    {/* #3 Winner Slot */}
                    {winnersList[2] ? (
                       <div className="flex flex-col items-center relative pb-3 opacity-80">
                          <div className="absolute -top-2 z-10 bg-gradient-to-r from-[#CD7F32] to-[#A0522D] text-white text-[9px] font-bold px-1.5 rounded-sm shadow-md">#3</div>
                          <div className="w-10 h-10 rounded-full border-[3px] border-[#CD7F32] shadow-[0_0_10px_rgba(205,127,50,0.6)] overflow-hidden bg-white/50">
                             <img src={winnersList[2].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winnersList[2].name}`} alt="user" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[8px] font-bold mt-1 text-[#4a2511] truncate w-12 text-center">{winnersList[2].name}</span>
                          <span className="text-[7px] text-orange-600 font-bold">{formatKandM(winnersList[2].win)}</span>
                       </div>
                    ) : <div className="w-10" />}
                 </div>
              </div>
          </motion.div>
        )}
       </AnimatePresence>

       <AnimatePresence>
        {showRecord && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[300] h-[40vh] bg-[#fdf8e7] border-t-[6px] border-orange-500 rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col">
                <div className="relative p-4 flex items-center justify-center border-b border-orange-100">
                    <h3 className="text-[#4a2511] font-black uppercase text-sm">Game Record</h3>
                    <button onClick={() => setShowRecord(false)} className="absolute right-4 top-4 text-orange-500 bg-orange-100 rounded-full p-1"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    {gameRecords.length === 0 ? <p className="text-[#4a2511]/40 text-center text-xs italic mt-4">No records found yet...</p> : gameRecords.map((rec) => (
                        <div key={rec.id} className="bg-white/60 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{rec.emoji}</span>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-orange-500 font-bold uppercase">Bet Amount</span>
                                    <span className="text-xs font-black text-[#4a2511]">{rec.bet}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-emerald-500 font-bold uppercase">Winning</span>
                                <span className={cn("text-sm font-black", rec.win > 0 ? "text-emerald-600" : "text-red-400")}>{rec.win > 0 ? `+${formatKandM(rec.win)}` : '0'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
       </AnimatePresence>

       <header className="relative z-50 flex items-center justify-between px-4 py-2 bg-transparent shrink-0 mt-1">
          <div className="flex items-center gap-1.5">
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                style={{ touchAction: 'none' }}
                className="cursor-grab active:cursor-grabbing p-1 touch-none"
              >
                <Move size={18} className="text-white/70 mr-1 pointer-events-none" />
              </div>
              
              <div className="flex items-center bg-black/20 backdrop-blur-md rounded-md border border-white/20 h-[32px] pl-1 pr-1">
                  <div className="bg-yellow-400 rounded-md p-0.5"><GoldCoinIcon className="h-5 w-5 text-yellow-600 filter brightness-110 drop-shadow-md" /></div>
                  <span className="text-white px-2 font-semibold text-[12px]">{localCoins}</span>
                  <button className="h-[24px] w-[24px] bg-gradient-to-b from-[#7bdcb5] to-[#4caf50] rounded-md flex items-center justify-center text-white border-[1.5px] border-white/40 shadow-sm"><Plus className="h-3 w-3 stroke-[3]" /></button>
              </div>
          </div>

          <div className="flex items-center gap-2">
              <button onClick={() => setShowRecord(true)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white transition-active active:scale-90 shadow-inner"><Clock size={16} className="filter drop-shadow-md brightness-110" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white shadow-inner">{isMuted ? <VolumeX size={16} className="filter drop-shadow-md" /> : <Volume2 size={16} className="filter drop-shadow-md" />}</button>
              <button onClick={() => setShowRules(true)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white transition-active active:scale-90 shadow-inner"><HelpCircle size={16} className="filter drop-shadow-md brightness-110" /></button>
              <button onClick={onBack} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white transition-active active:scale-90 shadow-inner"><X size={16} className="filter drop-shadow-md" /></button>
          </div>
       </header>

       <div className="px-4 py-1 shrink-0 z-40 relative">
         <div className="w-full bg-white/10 backdrop-blur-md py-2 px-4 flex items-center gap-3 overflow-x-auto no-scrollbar border border-white/20 rounded-2xl shadow-lg ring-1 ring-white/5">
            <div className="flex flex-col items-center justify-center border-r border-white/20 pr-3 mr-1 shrink-0">
              <span className="text-[7px] text-white/50 uppercase font-black tracking-widest leading-none mb-0.5">Winning</span>
              <span className="text-[9px] text-white/80 font-black tracking-tighter leading-none">History</span>
            </div>
            <div className="flex items-center gap-3">
              {history.map((h, i) => {
                  const animal = ANIMALS.find(a => a.id === h.id);
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5 shrink-0">
                      {h.type === 'single' ? (
                        <span className="text-base filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">{animal?.emoji}</span>
                      ) : (
                        <div className="relative w-[22px] h-[22px] rounded-full flex flex-col items-center justify-center bg-gradient-to-b from-[#6b361a] to-[#3a1c0d] border border-[#eebb99] overflow-hidden shadow-sm">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-gradient-to-b from-white/50 to-white/5 rounded-full pointer-events-none z-0" />
                            <div className="grid grid-cols-2 gap-x-[1px] gap-y-[1px] justify-center items-center z-10">
                                {h.type === 'left' ? (
                                    <>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🦁</span>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🐯</span>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🦊</span>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🐻</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🐰</span>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🐻‍❄️</span>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🦝</span>
                                        <span className="text-[5px] filter drop-shadow-sm leading-none text-center">🐔</span>
                                    </>
                                )}
                            </div>
                        </div>
                      )}
                      {h.type !== 'single' && (
                        <span className="text-[5px] font-black uppercase text-yellow-400 bg-yellow-900/40 px-[3px] py-[1px] rounded-full border border-yellow-400/20 leading-none tracking-tight">Mix</span>
                      )}
                    </div>
                  )
              })}
            </div>
         </div>
       </div>

       <main className="flex-1 w-full flex flex-col items-center justify-start pt-8 px-4 relative">
        {/* Left Mix shining */}
        <div className={cn(
            "absolute top-[3.5%] left-[6%] z-30 w-[46px] h-[46px] rounded-full flex flex-col items-center justify-center border-[2px] transition-all duration-500 overflow-hidden",
            shiningGroup === 'left' 
                ? "border-[#FFD700] shadow-[0_0_20px_#FFD700,inset_0_2px_8px_rgba(255,255,255,0.6)] scale-110 animate-pulse bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-800" 
                : "bg-gradient-to-b from-[#6b361a] to-[#3a1c0d] border-[#eebb99] shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)]"
        )}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-gradient-to-b from-white/50 to-white/5 rounded-full pointer-events-none z-0" />
            <div className="grid grid-cols-2 gap-x-0.5 gap-y-0.5 justify-center items-center z-10 mb-0.5 mt-0.5">
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🦁</span>
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🐯</span>
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🦊</span>
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🐻</span>
            </div>
            <span className={cn("text-[6px] font-black uppercase mt-0 z-10 filter drop-shadow-sm", shiningGroup === 'left' ? "text-yellow-200" : "text-white/90")}>Mix</span>
        </div>

        {/* Right Mix shining */}
        <div className={cn(
            "absolute top-[3.5%] right-[6%] z-30 w-[46px] h-[46px] rounded-full flex flex-col items-center justify-center border-[2px] transition-all duration-500 overflow-hidden",
            shiningGroup === 'right' 
                ? "border-[#FFD700] shadow-[0_0_20px_#FFD700,inset_0_2px_8px_rgba(255,255,255,0.6)] scale-110 animate-pulse bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-800" 
                : "bg-gradient-to-b from-[#6b361a] to-[#3a1c0d] border-[#eebb99] shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)]"
        )}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-gradient-to-b from-white/50 to-white/5 rounded-full pointer-events-none z-0" />
            <div className="grid grid-cols-2 gap-x-0.5 gap-y-0.5 justify-center items-center z-10 mb-0.5 mt-0.5">
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🐰</span>
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🐻‍❄️</span>
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🦝</span>
                <span className="text-[8px] filter drop-shadow-md leading-none text-center">🐔</span>
            </div>
            <span className={cn("text-[6px] font-black uppercase mt-0 z-10 filter drop-shadow-sm", shiningGroup === 'right' ? "text-yellow-200" : "text-white/90")}>Mix</span>
        </div>

        <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full z-10 overflow-visible" viewBox="0 0 100 100">
            <defs>
                <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.7"/>
                </filter>
            </defs>
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <line x1="50" y1="50" x2="50" y2="13" stroke="#b37c54" strokeWidth="8" strokeLinecap="round" filter="url(#shadow3D)" />
                <line x1="50" y1="50" x2="50" y2="13" stroke="#eebb99" strokeWidth="4" strokeLinecap="round" />
              </g>
            ))}
          </svg>

          <div className={cn("relative z-20 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300", gameState === 'spinning' ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl border-[4px] border-[#ffe885]" : "bg-gradient-to-br from-[#6b361a] to-[#3a1c0d] border-[4px] border-[#eebb99]")}>
            <p className="text-[7px] font-black uppercase text-[#eebb99]">{gameState === 'betting' ? 'Time' : '🔥'}</p>
            <span className="text-2xl font-black text-[#eebb99]">{gameState === 'betting' ? timeLeft : '!!!'}</span>
          </div>

          {ANIMALS.map((item, idx) => {
            const active = isWinningAnimal(idx, item.id);
            const isSpinning = gameState === 'spinning';
            const isHighlighted = highlightIdx === idx;
            const applyColorless = isSpinning && !isHighlighted;
            return (
            <motion.div key={item.id} className={cn("absolute z-20", item.pos === 'top' && "top-[2%] left-1/2 -translate-x-1/2", item.pos === 'top-right' && "top-[8%] right-[8%]", item.pos === 'right' && "right-[2%] top-1/2 -translate-y-1/2", item.pos === 'bottom-right' && "bottom-[8%] right-[8%]", item.pos === 'bottom' && "bottom-[2%] left-1/2 -translate-x-1/2", item.pos === 'bottom-left' && "bottom-[8%] left-[8%]", item.pos === 'left' && "left-[2%] top-1/2 -translate-y-1/2", item.pos === 'top-left' && "top-[8%] left-[8%]")}>
              <button onClick={() => handlePlaceBet(item)} className="relative group">
                <div className={cn(
                    "h-[86px] w-[86px] rounded-full flex flex-col items-center justify-start pt-2 border-[3px] bg-[#4a2511] transition-all overflow-hidden relative shadow-[0_6px_0_#d4a373]", 
                    active ? "scale-110 border-[#FFD700] shadow-[0_0_25px_#FFD700,inset_0_0_10px_#FFD700] z-50 ring-4 ring-[#FFD700]/70" : "border-[#eebb99]",
                    applyColorless ? "grayscale-[0.9] brightness-90 opacity-100 duration-300" : "grayscale-0 opacity-100 brightness-100 duration-150"
                )}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-gradient-to-b from-white/40 to-white/5 rounded-full pointer-events-none z-0" />
                    <span className={cn("text-[38px] z-10 filter drop-shadow-lg", active ? "scale-125 rotate-6" : "")}>{item.emoji}</span>
                    <div className={cn("absolute bottom-0 left-0 right-0 py-0.5 text-center z-20 transition-colors duration-150", (active && gameState !== 'spinning') ? "bg-white/20 backdrop-blur-md" : "bg-[#4a2511] border-t border-[#eebb99]")}>
                        <span className="text-[7px] font-bold uppercase tracking-tighter text-white">Win {item.multiplier}x</span>
                    </div>
                </div>
                <AnimatePresence>
                    {droppedChips.filter(c => c.itemIdx === idx).map(chip => (
                        <motion.div key={chip.id} initial={{ opacity: 0, scale: 3, y: -60 }} animate={{ opacity: 1, scale: 1, y: chip.y, x: chip.x }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.6)] z-40 pointer-events-none" style={{ background: `repeating-conic-gradient(from 0deg, #fff 0deg 20deg, ${chip.color} 20deg 40deg)`, padding: '2.5px', width: '24px', height: '24px' }}>
                            <div className={cn("w-full h-full rounded-full flex items-center justify-center border border-black/20 shadow-inner", `bg-gradient-to-br ${chip.bgColor}`)}>
                                <span className="text-[6px] font-black text-white filter drop-shadow-sm">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                    {fakeDroppedChips.filter(c => c.itemIdx === idx).map(chip => (
                        <motion.div key={chip.id} initial={{ opacity: 0, scale: 2, y: -80 }} animate={{ opacity: 1, scale: 1, y: chip.y, x: chip.x }} exit={{ opacity: 0 }} transition={{ delay: chip.delay, duration: 0.3 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.5)] z-30 pointer-events-none" style={{ background: `repeating-conic-gradient(from 0deg, #fff 0deg 20deg, ${chip.color} 20deg 40deg)`, padding: '2px', width: '20px', height: '20px' }}>
                            <div className={cn("w-full h-full rounded-full flex items-center justify-center border border-black/20 shadow-inner", `bg-gradient-to-br ${chip.bgColor}`)}>
                                <span className="text-[5px] font-bold text-white/90">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {myBets[item.id] > 0 && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-[#4a2511] text-[8px] font-black px-2.5 py-[2px] rounded-sm border border-white z-[60] shadow-md whitespace-nowrap tracking-tight">
                        {myBets[item.id] >= 1000 ? (myBets[item.id]/1000)+'K' : myBets[item.id]}
                    </div>
                )}
              </button>
            </motion.div>
            )
          })}
        </div>
       </main>

       <div className="w-full bg-[#1b0d07] border-t-[3px] border-[#4a2511] py-4 px-4 flex items-center justify-start gap-4 overflow-x-auto no-scrollbar shrink-0 z-40 relative shadow-[0_-8px_20px_rgba(0,0,0,0.6)] rounded-t-[32px]">
          {CHIPS_DATA.map((chip) => (
              <button
                  key={chip.value}
                  onClick={() => setSelectedChip(chip.value)}
                  className={cn(
                      "relative shrink-0 flex flex-col items-center justify-center rounded-full transition-all duration-200",
                      selectedChip === chip.value ? "scale-110 -translate-y-2 shadow-[0_5px_15px_rgba(0,0,0,0.5)]" : "scale-95 opacity-70 hover:opacity-100"
                  )}
                  style={{ background: `repeating-conic-gradient(from 0deg, #fff 0deg 20deg, ${chip.color} 20deg 40deg)`, padding: '5px', width: '52px', height: '52px' }}
              >
                  <div className={cn("w-full h-full rounded-full flex items-center justify-center border-[2px] border-black/50 shadow-inner", `bg-gradient-to-br ${chip.bgColor}`)}>
                      <span className="text-[11px] font-black text-white filter drop-shadow-sm">{chip.label}</span>
                  </div>
                  {selectedChip === chip.value && (
                      <div className="absolute -bottom-3 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_#facc15]" />
                  )}
              </button>
          ))}
       </div>

       <AnimatePresence>
        {showRules && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[300] h-[30vh] bg-[#fdf8e7] border-t-[6px] border-orange-500 rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col">
                <div className="relative p-4 flex items-center justify-center border-b border-orange-100">
                    <h3 className="text-[#4a2511] font-black uppercase text-sm">Rules</h3>
                    <button onClick={() => setShowRules(false)} className="absolute right-4 top-4 text-orange-500 bg-orange-100 rounded-full p-1"><X size={18} /></button>
                </div>
                <div className="flex-1 p-5 flex flex-col gap-3 justify-center">
                    {["Select a Chip and Choose your animal", "If you win you will get Coins amount (Bet × multiplier)", "45× gives you the highest Coins Amount", "If you lose you will not receive any coins amount"].map((rule, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <span className="bg-orange-500 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center shrink-0 shadow-md">{i+1}</span>
                            <p className="text-[#4a2511] text-xs font-bold leading-tight">{rule}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
       </AnimatePresence>

       <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
       `}</style>
   </motion.div>
  </motion.div>
 );
}
