'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking, 
 useDoc, 
 useMemoFirebase, 
 addDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { 
 Volume2, 
 VolumeX, 
 HelpCircle, 
 X,
 Plus,
 Clock,
 Cloud,
 Move
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const ANIMALS = [
  { id: 'panda', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top', index: 0 },
  { id: 'rabbit', emoji: '🐔', multiplier: 5, label: 'x5', pos: 'top-right', index: 1 },
  { id: 'cow', emoji: '🦝', multiplier: 5, label: 'x5', pos: 'right', index: 2 },
  { id: 'dog', emoji: '🦓', multiplier: 5, label: 'x5', pos: 'bottom-right', index: 3 },
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

export default function ForestPartyGame({ onBack, isOverlay = false }: { onBack?: () => void, isOverlay?: boolean } = {}) {
 const { user: currentUser } = useUser();
 const dragControls = useDragControls();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

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

 const myBetsRef = useRef(myBets);
 const isMountedRef = useRef(true);
 const chaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 const winnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);
 const tickAudio = useRef<HTMLAudioElement | null>(null);
 const winAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => { myBetsRef.current = myBets; }, [myBets]);

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
    bannerTimeoutRef.current = setTimeout(() => { if (isMountedRef.current) setBannerMsg(null); }, 1500);
 }, []);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     const saved = localStorage.getItem('forestPartyRecords');
     if (saved) { try { setGameRecords(JSON.parse(saved)); } catch (e) {} }
     const savedDaily = localStorage.getItem('forestPartyDailyWin');
     if (savedDaily) {
       try {
         const parsed = JSON.parse(savedDaily);
         if (parsed.gameDay === getGameDay()) setDailyWinnings(parsed.amount);
         else { setDailyWinnings(0); localStorage.setItem('forestPartyDailyWin', JSON.stringify({ gameDay: getGameDay(), amount: 0 })); }
       } catch (e) {}
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
                newFakeChips.push({ id: Date.now() + Math.random() + i, itemIdx: randomAnimalIdx, label: randomChip.label, bgColor: randomChip.bgColor, color: randomChip.color, x: (Math.random() * 40) - 20, y: (Math.random() * 30) - 15, delay: Math.random() * 0.8 });
            }
            setFakeDroppedChips(prev => [...prev.slice(-60), ...newFakeChips]);
        }
    }, 2000); 
    return () => clearInterval(interval);
 }, [gameState]);

 useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('forestPartyRecords', JSON.stringify(gameRecords.slice(0, 20))); }, [gameRecords]);
 useEffect(() => { if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins); }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  let interval: NodeJS.Timeout;
  if (gameState === 'betting') {
      interval = setInterval(() => { setTimeLeft((prev) => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; }); }, 1000);
  }
  return () => clearInterval(interval);
 }, [gameState]);

 const playSound = useCallback((type: 'bet' | 'spin' | 'stop' | 'tick' | 'win') => {
  if (isMuted) return;
  try {
    const audios = { bet: chipAudio.current, tick: tickAudio.current, spin: spinAudio.current, win: winAudio.current };
    const audio = audios[type as keyof typeof audios];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
    if (type === 'stop') spinAudio.current?.pause();
  } catch (error) {}
 }, [isMuted]);

 const finalizeResult = useCallback((id: string, groupType: 'none' | 'left' | 'right') => {
  if (!isMountedRef.current) return;
  setDroppedChips([]); setFakeDroppedChips([]);
  let winningIds = [id];
  if (groupType === 'left') winningIds = ['lion', 'tiger', 'fox', 'bear'];
  else if (groupType === 'right') winningIds = ['panda', 'rabbit', 'cow', 'dog'];
  let winAmount = 0;
  const currentBets = myBetsRef.current;
  winningIds.forEach(wId => { const winItem = ANIMALS.find(i => i.id === wId); winAmount += (currentBets[wId] || 0) * (winItem?.multiplier || 0); });
  const totalBetAmount = Object.values(currentBets).reduce((a, b) => a + b, 0);
  if (winAmount > 0) {
     playSound('win'); 
     setDailyWinnings(prev => { const newAmount = prev + winAmount; localStorage.setItem('forestPartyDailyWin', JSON.stringify({ gameDay: getGameDay(), amount: newAmount })); return newAmount; });
  }
  setShiningGroup(groupType); 
  const newRoundRecords = Object.entries(currentBets).map(([betId, betAmount]) => {
     const animal = ANIMALS.find(a => a.id === betId);
     return { id: Date.now() + Math.random(), emoji: animal?.emoji || '❓', bet: betAmount as number, win: winningIds.includes(betId) ? (betAmount as number) * (animal?.multiplier || 0) : 0, timestamp: Date.now() };
  });
  if (newRoundRecords.length > 0) setGameRecords(prev => [...newRoundRecords, ...prev]);
  const historyItem = { id: id, type: groupType === 'none' ? 'single' as const : groupType as 'left' | 'right' };
  setHistory(prev => [historyItem, ...prev].slice(0, 15));
  let displayEmoji = ANIMALS.find(i => i.id === id)?.emoji || '🏆';
  if (groupType === 'left') displayEmoji = '🦁🐯🦊🐻';
  if (groupType === 'right') displayEmoji = '🐰🦓🦝🐔'; 
  setWinnerData({ emoji: displayEmoji, win: winAmount, bet: totalBetAmount });
  setGameState('result');
  if (winAmount > 0 && currentUser && firestore) {
   const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
   updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(winAmount) });
   addDocumentNonBlocking(collection(firestore, 'globalGameWins'), { gameId: 'forest-party', userId: currentUser.uid, username: userProfile?.username || 'Guest', avatarUrl: userProfile?.avatarUrl || null, amount: winAmount, timestamp: serverTimestamp() });
  }
  winnerTimeoutRef.current = setTimeout(() => {
   if (!isMountedRef.current) return;
   setWinnerData(null); setMyBets({}); setHighlightIdx(null); setShiningGroup('none'); setGameState('betting'); setTimeLeft(25);
   setBannerMsg('Start Betting');
   bannerTimeoutRef.current = setTimeout(() => { if (isMountedRef.current) setBannerMsg(null); }, 1500);
  }, 5000);
 }, [currentUser, firestore, playSound, userProfile]);

 const startSpin = useCallback(async () => {
  if (!isMountedRef.current) return;
  setBannerMsg('Betting Over');
  bannerTimeoutRef.current = setTimeout(() => { if (isMountedRef.current) setBannerMsg(null); }, 1500);
  setGameState('spinning');
  playSound('spin'); 
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
  const totalSteps = (SEQUENCE.length * 7) + targetIdx;
  let speed = 40; 
  const runChase = () => {
    if (!isMountedRef.current) return;
    const activeIdx = currentStep % SEQUENCE.length;
    setHighlightIdx(activeIdx);
    if (currentStep % 2 === 0) playSound('tick'); 
    if (currentStep < totalSteps) {
      if ((totalSteps - currentStep) < 25) speed += 20; 
      else if ((totalSteps - currentStep) < 45) speed += 4;  
      currentStep++;
      chaseTimeoutRef.current = setTimeout(runChase, speed);
    } else {
      playSound('stop');
      chaseTimeoutRef.current = setTimeout(() => finalizeResult(winningId, groupType), 500);
    }
  };
  runChase();
 }, [firestore, playSound, finalizeResult]);

 useEffect(() => { if (gameState === 'betting' && timeLeft === 0) startSpin(); }, [timeLeft, gameState, startSpin]);

 const handlePlaceBet = (animal: typeof ANIMALS[0]) => {
  if (gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) { toast({ title: 'You do not have any Coins!', variant: 'destructive' }); return; }
  playSound('bet');
  const chipInfo = CHIPS_DATA.find(c => c.value === selectedChip);
  const newChip = { id: Date.now(), itemIdx: animal.index, label: chipInfo?.label || '10', bgColor: chipInfo?.bgColor || 'from-blue-400 to-cyan-500', color: chipInfo?.color || '#3b82f6', x: (Math.random() * 30) - 15, y: (Math.random() * 20) - 10 };
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
    }
    return highlightIdx === idx;
 };

 return (
  <motion.div 
    drag
    dragControls={dragControls}
    dragListener={false}
    dragMomentum={false}
    initial={isOverlay ? { opacity: 0, scale: 0.9, y: 20 } : {}}
    animate={isOverlay ? { opacity: 1, scale: 1, y: 0 } : {}}
    className={cn(
      "h-fit max-h-[95vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#0F2A1A] text-white select-none rounded-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
      !isOverlay && "min-h-screen"
    )}
  >
   
   <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F2A1A] via-[#1E4D2C] to-[#2E7D32]" />
      <div className="absolute bottom-[5%] left-[10%] text-6xl drop-shadow-xl opacity-60 select-none">🌲</div>
      <div className="absolute bottom-[2%] right-[15%] text-7xl drop-shadow-xl opacity-50 select-none">🌳</div>
   </div>

   <AnimatePresence mode="wait">
    {bannerMsg && (
        <motion.div key={bannerMsg} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="absolute top-[45%] left-0 right-0 z-[250] flex justify-center pointer-events-none">
            <div className="bg-[#fdf8e7] border-y-4 border-[#e6c17e] py-3 px-10 shadow-2xl">
                <span className="text-white font-black text-2xl uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" style={{ WebkitTextStroke: '1px #b48530' }}>{bannerMsg}</span>
            </div>
        </motion.div>
    )}
   </AnimatePresence>

   <AnimatePresence>
    {winnerData && (
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="absolute bottom-0 left-0 right-0 z-[210] h-[35vh] bg-[#fdf8e7] border-t-[6px] border-orange-500 p-6 flex flex-col items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-4">
             <div className="flex items-center gap-6">
                <div className="relative text-7xl filter drop-shadow-md">{winnerData.emoji}</div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Winning Amount</span>
                  <div className="flex items-center gap-1.5">
                    <GoldCoinIcon className="h-6 w-6 brightness-110" />
                    <span className="text-4xl font-black text-[#4a2511] tabular-nums">+{formatKandM(winnerData.win)}</span>
                  </div>
                </div>
             </div>
             <div className="w-full grid grid-cols-2 gap-3 mt-2">
                <div className="bg-orange-100 rounded-2xl p-4 border border-orange-200 flex flex-col items-center">
                   <span className="text-[9px] font-black text-orange-500 uppercase">Your Total Bet</span>
                   <span className="text-lg font-black text-[#4a2511]">{formatKandM(winnerData.bet)}</span>
                </div>
                <div className="bg-orange-500 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center">
                   <span className="text-lg font-black text-white uppercase italic">{winnerData.win > 0 ? 'Winner' : 'Try Again'}</span>
                </div>
             </div>
          </div>
      </motion.div>
    )}
   </AnimatePresence>

   <header className="relative z-50 flex items-center justify-between px-4 py-3 bg-black/20 shrink-0 pt-8">
      <div className="flex items-center gap-2">
          <button 
            onPointerDown={(e) => dragControls.start(e)}
            className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-grab active:cursor-grabbing text-white/80"
          >
            <Move className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 h-9 pl-1 pr-3">
              <GoldCoinIcon className="h-6 w-6 text-yellow-400" />
              <span className="text-white px-2 font-bold text-xs">{formatKandM(localCoins)}</span>
          </div>
      </div>

      <div className="flex items-center gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/20 bg-black/30 text-white active:scale-90">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 active:scale-90">
            <X size={16} />
          </button>
      </div>
   </header>

   <div className="px-4 py-2 relative z-[50]">
      <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-1.5 flex items-center overflow-x-auto no-scrollbar shadow-inner">
        <span className="text-yellow-400 font-black text-[9px] px-2 shrink-0 uppercase tracking-widest italic filter brightness-110">History</span>
        <div className="flex items-center gap-2 px-1">
          {history.map((item, i) => (
              <div key={i} className={cn("shrink-0 h-6 w-6 flex items-center justify-center rounded-lg shadow-inner", i === 0 ? "bg-white/10 ring-1 ring-yellow-400" : "bg-black/20")}>
                 {item.type === 'single' ? (
                     <span className="text-[16px] filter drop-shadow-md">{ANIMALS.find(a => a.id === item.id)?.emoji}</span>
                 ) : (
                     <div className="flex flex-wrap w-[16px] items-center justify-center leading-none filter drop-shadow-md">
                         {item.type === 'left' ? '🦁' : '🐰'}
                     </div>
                 )}
              </div>
          ))}
        </div>
      </div>
   </div>

   <main className="flex-1 w-full flex flex-col items-center justify-start p-4 relative pt-12 overflow-y-auto no-scrollbar pb-32">
    
    <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
      <div className={cn("relative z-20 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 bg-gradient-to-br from-[#6b361a] to-[#3a1c0d] border-[6px] border-[#eebb99] shadow-2xl")}>
        <p className="text-[8px] font-black uppercase text-[#eebb99] mb-1">{gameState === 'betting' ? 'Betting' : 'Spinning'}</p>
        <span className="text-3xl font-black text-[#eebb99] tracking-tighter">{gameState === 'betting' ? timeLeft : '🎲'}</span>
      </div>

      {ANIMALS.map((item, idx) => {
        const active = isWinningAnimal(idx, item.id);
        const isSpinning = gameState === 'spinning';
        const isHighlighted = highlightIdx === idx;
        const applyColorless = isSpinning && !isHighlighted;
        
        return (
          <div key={item.id} className={cn("absolute z-20 transition-all duration-300", item.pos === 'top' && "top-[0%] left-1/2 -translate-x-1/2", item.pos === 'top-right' && "top-[8%] right-[8%]", item.pos === 'right' && "right-[0%] top-1/2 -translate-y-1/2", item.pos === 'bottom-right' && "bottom-[8%] right-[8%]", item.pos === 'bottom' && "bottom-[0%] left-1/2 -translate-x-1/2", item.pos === 'bottom-left' && "bottom-[8%] left-[8%]", item.pos === 'left' && "left-[0%] top-1/2 -translate-y-1/2", item.pos === 'top-left' && "top-[8%] left-[8%]")}>
            <button onClick={() => handlePlaceBet(item)} className="relative group">
              <div className={cn(
                  "h-20 w-20 rounded-full flex flex-col items-center justify-center border-[3px] bg-[#4a2511] transition-all relative shadow-[0_4px_12px_rgba(0,0,0,0.5)]", 
                  active ? "scale-110 border-[#FFD700] ring-4 ring-[#FFD700]/50 z-50 shadow-[0_0_20px_#FFD700]" : "border-[#eebb99]",
                  applyColorless ? "grayscale-[0.8] opacity-80" : "grayscale-0 opacity-100"
              )}>
                  <span className="text-4xl">{item.emoji}</span>
                  <div className="absolute bottom-0 w-full bg-[#331b0c] py-0.5 text-[8px] font-black text-white rounded-b-full border-t border-[#eebb99]/20">{item.multiplier}x</div>
              </div>
              {myBets[item.id] > 0 && <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white z-50 shadow-lg">{formatKandM(myBets[item.id])}</div>}
            </button>
          </div>
        )
      })}
    </div>
   </main>

   <div className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 mt-auto shrink-0 relative z-[60]">
      <div className="w-full flex items-center gap-3 overflow-x-auto no-scrollbar pb-4">
        {CHIPS_DATA.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => { playSound('bet'); setSelectedChip(chip.value); }} 
            className={cn(
                "h-12 w-12 rounded-full border-2 transition-all shrink-0 active:scale-95 flex items-center justify-center", 
                selectedChip === chip.value ? "scale-115 border-white ring-4 ring-white/20 z-10" : "border-transparent opacity-60 grayscale-[0.3]"
            )}
            style={{ background: `repeating-conic-gradient(from 0deg, #fff 0deg 20deg, ${chip.color} 20deg 40deg)`, padding: '3px' }}
          >
              <div className={cn("w-full h-full rounded-full flex items-center justify-center border border-black/10 shadow-inner bg-gradient-to-br", chip.bgColor)}>
                <span className="text-[10px] font-black text-white filter drop-shadow-md uppercase tracking-tight">{chip.label}</span>
              </div>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <button onClick={() => setShowRecord(true)} className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-black border border-white/10 uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/20 transition-all"><Clock size={12} /> History</button>
            <button onClick={() => setShowRules(true)} className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-black border border-white/10 uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/20 transition-all"><HelpCircle size={12} /> Rules</button>
         </div>
         <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="text-[8px] font-black text-emerald-500 uppercase">Win Today</span>
            <span className="text-xs font-black text-emerald-400">{formatKandM(dailyWinnings)}</span>
         </div>
      </div>
   </div>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
   `}</style>
  </motion.div>
 );
}
