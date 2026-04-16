'use client';

import { useState, useEffect, useRef } from 'react';
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
 Sparkles
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ANIMALS = [
  { id: 'panda', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top', index: 0 },
  { id: 'rabbit', emoji: '🐔', multiplier: 5, label: 'x5', pos: 'top-right', index: 1 },
  { id: 'cow', emoji: '🦝', multiplier: 5, label: 'x5', pos: 'right', index: 2 },
  { id: 'dog', emoji: '🦄', multiplier: 5, label: 'x5', pos: 'bottom-right', index: 3 },
  { id: 'fox', emoji: '🦊', multiplier: 10, label: 'x10', pos: 'bottom', index: 4 },
  { id: 'bear', emoji: '🐻', multiplier: 15, label: 'x15', pos: 'bottom-left', index: 5 },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'left', index: 6 },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'top-left', index: 7 },
];

const CHIPS_DATA = [
 { value: 100, label: '100', color: 'from-blue-400 to-blue-600' },
 { value: 1000, label: '1k', color: 'from-orange-300 to-orange-500' },
 { value: 50000, label: '50k', color: 'from-red-400 to-red-600' },
 { value: 500000, label: '500k', color: 'from-purple-400 to-purple-600' },
 { value: 5000000, label: '5M', color: 'from-emerald-400 to-emerald-600' },
 { value: 10000000, label: '10M', color: 'from-orange-500 to-orange-600' }, 
];

const SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7];

const getGameDay = () => {
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setHours(5, 30, 0, 0); 

  if (now < resetTime) {
    now.setDate(now.getDate() - 1);
  }
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const formatKandM = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

export default function ForestPartyGame({ onBack }: { onBack?: () => void } = {}) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(25);
 const [selectedChip, setSelectedChip] = useState(100);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['panda', 'lion', 'fox']);
 const [isMuted, setIsMuted] = useState(false);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number; bet: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, x: number, y: number}[]>([]);
 
 const [showRules, setShowRules] = useState(false);
 const [showRecord, setShowRecord] = useState(false);
 const [gameRecords, setGameRecords] = useState<{ id: number; emoji: string; bet: number; win: number; timestamp: number }[]>([]);
 
 const [dailyWinnings, setDailyWinnings] = useState(0);

 const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'forest-party'), [firestore]);
 const { data: gameData } = useDoc(gameDocRef);

 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);
 const tickAudio = useRef<HTMLAudioElement | null>(null);
 const winAudio = useRef<HTMLAudioElement | null>(null);

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

     chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); 
     spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
     tickAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/588/588-preview.mp3');
     winAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); 
   }
 }, []);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     localStorage.setItem('forestPartyRecords', JSON.stringify(gameRecords.slice(0, 20))); 
   }
 }, [gameRecords]);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft]);

 const playSound = (type: 'bet' | 'spin' | 'stop' | 'tick' | 'win') => {
  if (isMuted) return;
  try {
    const audios = {
        bet: chipAudio.current,
        tick: tickAudio.current,
        spin: spinAudio.current,
        win: winAudio.current,
    };
    const audio = audios[type as keyof typeof audios];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }
    if (type === 'stop') {
        spinAudio.current?.pause();
    }
  } catch (error) {}
 };

 const handlePlaceBet = (animal: typeof ANIMALS[0]) => {
  if (gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'Coins Kam Hain!', variant: 'destructive' });
   return;
  }

  playSound('bet');
  const chipInfo = CHIPS_DATA.find(c => c.value === selectedChip);
  const newChip = {
   id: Date.now(),
   itemIdx: animal.index,
   label: chipInfo?.label || '10',
   color: chipInfo?.color || 'from-blue-400 to-cyan-500',
   x: (Math.random() * 30) - 15,
   y: (Math.random() * 20) - 10
  };
  setDroppedChips(prev => [...prev, newChip]);
  setLocalCoins(prev => prev - selectedChip);
  
  const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
  updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(-selectedChip) });
  
  setMyBets(prev => ({ ...prev, [animal.id]: (prev[animal.id] || 0) + selectedChip }));
 };

 const startSpin = async () => {
  setGameState('spinning');
  playSound('spin'); 
  let winningId = ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id;

  if (firestore) {
   try {
    const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'forest-party'));
    if (oracleSnap.exists() && oracleSnap.data().isActive) {
     const forced = oracleSnap.data().forcedResult;
     if (ANIMALS.some(a => a.id === forced)) winningId = forced;
     updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'forest-party'), { isActive: false });
    }
   } catch (e) {}
  }

  const targetIdx = ANIMALS.findIndex(a => a.id === winningId);
  let currentStep = 0;
  const spins = 5; 
  const totalSteps = (SEQUENCE.length * spins) + targetIdx;
  let speed = 20; 

  const runChase = () => {
   const activeIdx = currentStep % SEQUENCE.length;
   setHighlightIdx(activeIdx);
   
   if (currentStep % 2 === 0) playSound('tick'); 

   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 5) speed += 100;
    else if (remaining < 12) speed += 40;
    else if (remaining < 20) speed += 15;
    
    currentStep++;
    setTimeout(runChase, speed);
   } else {
    playSound('stop');
    setTimeout(() => finalizeResult(winningId), 500);
   }
  };
  runChase();
 };

 const finalizeResult = (id: string) => {
  const winItem = ANIMALS.find(i => i.id === id);
  const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);
  const totalBetAmount = Object.values(myBets).reduce((a, b) => a + b, 0);

  if (winAmount > 0) {
     playSound('win'); 
     setDailyWinnings(prev => {
        const newAmount = prev + winAmount;
        localStorage.setItem('forestPartyDailyWin', JSON.stringify({ gameDay: getGameDay(), amount: newAmount }));
        return newAmount;
     });
  }

  const newRoundRecords = Object.entries(myBets).map(([betId, betAmount]) => {
     const animal = ANIMALS.find(a => a.id === betId);
     return {
       id: Date.now() + Math.random(),
       emoji: animal?.emoji || '❓',
       bet: betAmount,
       win: betId === id ? betAmount * (animal?.multiplier || 0) : 0,
       timestamp: Date.now()
     };
  });
  
  if (newRoundRecords.length > 0) setGameRecords(prev => [...newRoundRecords, ...prev]);

  setHistory(prev => [id, ...prev].slice(0, 15));
  setWinnerData({ emoji: winItem?.emoji || '🏆', win: winAmount, bet: totalBetAmount });
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
  }

  setTimeout(() => {
   setWinnerData(null);
   setMyBets({});
   setHighlightIdx(null);
   setDroppedChips([]);
   setGameState('betting');
   setTimeLeft(25);
  }, 5000);
 };

 return (
  <div className="h-[60vh] w-full flex flex-col relative overflow-hidden font-sans text-white bg-[#2D1B4E] rounded-none">
   
   {/* ENHANCED BACKGROUND LAYER */}
   <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E] via-[#FF6B6B] to-[#FFD93D]" />
      
      {/* Dynamic Light Beams / Glowing Auras */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5], rotate: [0, 90, 180, 270, 360] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-[-10%] w-[300px] h-[300px] bg-gradient-to-tr from-[#FFD93D]/30 to-transparent rounded-full blur-[40px] mix-blend-screen"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] left-[-10%] w-[250px] h-[250px] bg-gradient-to-tr from-[#FF6B6B]/40 to-transparent rounded-full blur-[50px] mix-blend-screen"
      />

      <motion.div animate={{ x: [-100, 400], y: [0, -10, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute top-[10%] left-0 opacity-40 drop-shadow-lg"><Cloud size={80} fill="white" color="white" /></motion.div>
      <motion.div animate={{ x: [400, -100], y: [0, 10, 0] }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }} className="absolute top-[20%] right-0 opacity-20 drop-shadow-lg"><Cloud size={100} fill="white" color="white" /></motion.div>
      
      <div className="absolute bottom-0 left-0 right-0 h-[20%] z-10 bg-gradient-to-t from-[#B5674D] to-[#E38B67] border-t-2 border-[#ffb394]/30 shadow-[0_-10px_30px_rgba(181,103,77,0.5)]">
          <div className="absolute -top-6 left-[10%] w-12 h-8 bg-[#8B4513] rounded-[40%_60%_70%_30%] shadow-[inset_0_-3px_5px_rgba(0,0,0,0.4),0_10px_15px_rgba(0,0,0,0.3)] rotate-12" />
          <div className="absolute -top-4 right-[20%] w-16 h-10 bg-[#5D2E0C] rounded-[60%_40%_30%_70%] shadow-[inset_0_-3px_5px_rgba(0,0,0,0.4),0_10px_15px_rgba(0,0,0,0.3)] -rotate-6" />
      </div>
   </div>

   {/* ENHANCED WINNER OVERLAY */}
   <AnimatePresence>
    {winnerData && (
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0.3 }} className="fixed bottom-0 left-0 right-0 z-[210] h-[30vh] bg-gradient-to-b from-[#fffbee] to-[#fdf8e7] border-t-[6px] border-orange-500 rounded-t-[30px] p-6 flex flex-col items-center justify-between shadow-[0_-20px_60px_rgba(0,0,0,0.6)]">
          {/* Rotating Sunburst behind winner */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none" />
          
          <div className="w-16 h-1.5 bg-orange-300 rounded-full mb-2 shrink-0 shadow-inner" />
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-4 relative z-10">
             <div className="flex items-center gap-6">
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: [1.2, 1] }} transition={{ type: "spring" }} className="relative">
                  <div className="absolute inset-0 bg-orange-400 blur-2xl opacity-50 animate-pulse" />
                  <div className="relative text-8xl filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]">{winnerData.emoji}</div>
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest drop-shadow-sm">Winning Amount</span>
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-1.5 bg-white/50 px-3 py-1 rounded-xl shadow-sm border border-orange-200">
                    <GoldCoinIcon className="h-7 w-7 drop-shadow-md" />
                    <span className="text-4xl font-black text-[#4a2511] tabular-nums tracking-tight">+{formatKandM(winnerData.win)}</span>
                  </motion.div>
                </div>
             </div>
             <div className="w-full grid grid-cols-2 gap-3 mt-2">
                <div className="bg-gradient-to-b from-orange-50 to-orange-100 rounded-2xl p-3 border border-orange-300 flex flex-col items-center shadow-inner">
                   <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">Your Total Bet</span>
                   <span className="text-xl font-black text-[#4a2511] drop-shadow-sm">{formatKandM(winnerData.bet)}</span>
                </div>
                <div className={cn("rounded-2xl p-3 shadow-[0_5px_15px_rgba(249,115,22,0.4)] flex flex-col items-center justify-center relative overflow-hidden", winnerData.win > 0 ? "bg-gradient-to-br from-green-400 to-emerald-600 border border-emerald-400" : "bg-gradient-to-br from-orange-400 to-red-500 border border-orange-400")}>
                   <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 translate-x-[-150%] animate-[shimmer_2s_infinite]" />
                   <span className="text-[9px] font-black text-white/90 uppercase tracking-tighter">Status</span>
                   <span className="text-xl font-black text-white uppercase italic drop-shadow-md">{winnerData.win > 0 ? 'Winner 🎉' : 'Try Again'}</span>
                </div>
             </div>
          </div>
      </motion.div>
    )}
   </AnimatePresence>

   {/* ENHANCED RECORD PANEL */}
   <AnimatePresence>
    {showRecord && (
        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0.2 }} className="fixed bottom-0 left-0 right-0 z-[300] h-[45vh] bg-gradient-to-b from-[#fffbee] to-[#fdf8e7] border-t-[6px] border-orange-500 rounded-t-[30px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
            <div className="relative p-5 flex items-center justify-center border-b border-orange-200 bg-white/40 backdrop-blur-md">
                <h3 className="text-[#4a2511] font-black uppercase text-base flex items-center gap-2">
                  <Clock size={18} className="text-orange-500"/> Game Record
                </h3>
                <button onClick={() => setShowRecord(false)} className="absolute right-4 top-4 text-orange-600 bg-orange-200 hover:bg-orange-300 transition-colors rounded-full p-1.5 shadow-sm"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {gameRecords.length === 0 ? <p className="text-[#4a2511]/40 text-center text-sm font-bold italic mt-8">No records found yet...</p> : gameRecords.map((rec) => (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={rec.id} className="bg-white/80 backdrop-blur-sm border-2 border-orange-100 rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-3xl shadow-inner border border-orange-300">
                                {rec.emoji}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider">Bet Amount</span>
                                <span className="text-sm font-black text-[#4a2511]">{rec.bet}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-wider">Winning</span>
                            <span className={cn("text-lg font-black drop-shadow-sm", rec.win > 0 ? "text-emerald-500" : "text-red-400")}>{rec.win > 0 ? `+${formatKandM(rec.win)}` : '0'}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )}
   </AnimatePresence>

   {/* ENHANCED HEADER */}
   <header className="relative z-50 flex items-center justify-between px-4 py-2 bg-transparent shrink-0 mt-1">
      <div className="flex items-center bg-black/40 backdrop-blur-xl rounded-full border border-white/30 h-[36px] pl-1.5 pr-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full p-1 shadow-inner"><GoldCoinIcon className="h-5 w-5 text-yellow-900" /></div>
          <span className="text-white px-3 font-bold text-[15px] drop-shadow-md">{formatKandM(localCoins)}</span>
          <button className="h-[28px] w-[28px] bg-gradient-to-b from-[#7bdcb5] to-[#4caf50] hover:from-[#8beabf] hover:to-[#5cce61] rounded-full flex items-center justify-center text-white border-[2px] border-white/50 shadow-[0_2px_5px_rgba(0,0,0,0.3)] transition-transform active:scale-95"><Plus className="h-4 w-4 stroke-[3]" /></button>
      </div>
      <div className="flex items-center gap-2.5">
          <button onClick={() => setShowRecord(true)} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/40 bg-black/40 backdrop-blur-md text-white shadow-lg transition-transform active:scale-90 hover:bg-black/60"><Clock size={18} /></button>
          <button onClick={() => setIsMuted(!isMuted)} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/40 bg-black/40 backdrop-blur-md text-white shadow-lg transition-transform active:scale-90 hover:bg-black/60">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          <button onClick={() => setShowRules(true)} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/40 bg-black/40 backdrop-blur-md text-white shadow-lg transition-transform active:scale-90 hover:bg-black/60"><HelpCircle size={18} /></button>
          <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full border border-white/40 bg-black/40 backdrop-blur-md text-white shadow-lg transition-transform active:scale-90 hover:bg-red-500/80 hover:border-red-400"><X size={18} /></button>
      </div>
   </header>

   {/* DAILY WINNING TROPHY */}
   <div className="absolute top-[60px] left-5 z-50 flex flex-col items-center justify-center">
     <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative flex flex-col items-center group">
       <span className="text-[38px] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] select-none">🏆</span>
       <div className="absolute -bottom-4 bg-gradient-to-r from-black/80 via-black/90 to-black/80 backdrop-blur-md border border-yellow-400/80 rounded-full px-3 py-1 whitespace-nowrap shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
          <span className="text-[11px] font-black bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent tracking-widest drop-shadow-sm">+{formatKandM(dailyWinnings)}</span>
       </div>
     </motion.div>
   </div>

   {/* ENHANCED MAIN BOARD */}
   <main className="flex-1 w-full flex flex-col items-center justify-start pt-24 px-4 relative">
    
    <div className="absolute top-[8%] left-[5%] text-[60px] z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] opacity-95 select-none pointer-events-none hover:scale-105 transition-transform">☁️</div>
    <div className="absolute top-[3%] right-[5%] text-[80px] z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] opacity-95 select-none pointer-events-none hover:scale-105 transition-transform">☁️</div>
    
    <div className="absolute bottom-[2%] left-[2%] text-[50px] z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)] select-none pointer-events-none">🌵</div>
    <div className="absolute bottom-[2%] right-[2%] text-[50px] z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)] select-none pointer-events-none">🌵</div>

    <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
      {/* Glow Behind Wheel */}
      <div className={cn("absolute inset-0 rounded-full bg-yellow-500/20 blur-3xl transition-opacity duration-500 z-0", gameState === 'spinning' ? 'opacity-100 animate-pulse' : 'opacity-40')} />

      <svg className="absolute inset-0 w-full h-full z-10 overflow-visible" viewBox="0 0 100 100">
        <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="30%" stopColor="#FFD700" />
              <stop offset="70%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="3" floodOpacity="0.8" floodColor="#1a0b04"/>
            </filter>
        </defs>
        
        {/* Support Legs */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <g key={deg} transform={`rotate(${deg} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="10" stroke="#2c1408" strokeWidth="8" strokeLinecap="round" filter="url(#shadow3D)" />
            <line x1="50" y1="50" x2="50" y2="10" stroke="#8a4f31" strokeWidth="6" strokeLinecap="round" />
            <line x1="48.5" y1="50" x2="48.5" y2="10" stroke="#fef0e6" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </g>
        ))}

        <motion.circle cx="50" cy="50" r="44" fill="none" stroke="url(#goldGradient)" strokeWidth={gameState === 'spinning' ? "5" : "3"} filter={gameState === 'spinning' ? "url(#goldGlow)" : "drop-shadow(0px 0px 4px rgba(255,215,0,0.5))"} animate={{ opacity: gameState === 'spinning' ? [0.8, 1, 0.8] : 0.6 }} transition={{ duration: 1, repeat: Infinity }} />
        <circle cx="50" cy="50" r="41" fill="none" stroke="url(#goldGradient)" strokeWidth="6" filter="url(#shadow3D)" opacity="0.9" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#5c2e16" strokeWidth="2" opacity="0.8" />
      </svg>

      {/* Center Timer 3D */}
      <div className={cn("relative z-20 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-[inset_0_4px_10px_rgba(255,255,255,0.4),0_10px_25px_rgba(0,0,0,0.6)] border-[4px]", gameState === 'spinning' ? "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 border-[#ffebb3] animate-[pulse_1s_ease-in-out_infinite]" : "bg-gradient-to-br from-[#8a4422] via-[#5c2a12] to-[#3a1c0d] border-[#ffcda8]")}>
        <div className="absolute inset-2 rounded-full border border-white/20 border-dashed animate-spin-slow opacity-50" />
        <p className={cn("text-[8px] font-black uppercase tracking-widest drop-shadow-md", gameState === 'spinning' ? "text-yellow-900" : "text-[#ffcda8]")}>{gameState === 'betting' ? 'Place Bet' : 'Good Luck'}</p>
        <span className={cn("text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]", gameState === 'spinning' ? "text-yellow-900" : "text-[#ffcda8]")}>{gameState === 'betting' ? timeLeft : '🤞'}</span>
      </div>

      {ANIMALS.map((item, idx) => (
        <motion.div key={item.id} className={cn("absolute z-20", item.pos === 'top' && "top-[2%] left-1/2 -translate-x-1/2", item.pos === 'top-right' && "top-[8%] right-[8%]", item.pos === 'right' && "right-[2%] top-1/2 -translate-y-1/2", item.pos === 'bottom-right' && "bottom-[8%] right-[8%]", item.pos === 'bottom' && "bottom-[2%] left-1/2 -translate-x-1/2", item.pos === 'bottom-left' && "bottom-[8%] left-[8%]", item.pos === 'left' && "left-[2%] top-1/2 -translate-y-1/2", item.pos === 'top-left' && "top-[8%] left-[8%]")}>
          <button onClick={() => handlePlaceBet(item)} className="relative group perspective-1000">
            
            {/* 3D Glossy Button Body */}
            <div className={cn("h-[86px] w-[86px] rounded-full flex flex-col items-center justify-start pt-2 border-[3px] transition-all duration-300 overflow-hidden relative shadow-[0_8px_0_#241108,0_15px_20px_rgba(0,0,0,0.5)] transform-style-3d group-active:translate-y-[6px] group-active:shadow-[0_2px_0_#241108,0_5px_10px_rgba(0,0,0,0.5)]", 
              // Glossy Highlight overlay
              "before:absolute before:top-0 before:left-[10%] before:right-[10%] before:h-[35%] before:bg-gradient-to-b before:from-white/40 before:to-transparent before:rounded-full before:pointer-events-none",
              highlightIdx === idx ? "scale-110 border-white bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 z-50 ring-4 ring-yellow-400/50 shadow-[0_0_40px_rgba(250,204,21,0.6)]" : "border-[#ffcda8] bg-gradient-to-br from-[#6b361a] to-[#3a1c0d]")}>
                
                <motion.span animate={highlightIdx === idx ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}} transition={{ duration: 0.5 }} className={cn("text-[38px] z-10 drop-shadow-[0_5px_5px_rgba(0,0,0,0.6)]")}>{item.emoji}</motion.span>
                
                <div className={cn("absolute bottom-0 left-0 right-0 py-1 text-center z-20 backdrop-blur-sm", highlightIdx === idx ? "bg-white/30 border-t border-white/50" : "bg-black/40 border-t border-[#ffcda8]/30")}>
                    <span className={cn("text-[8px] font-black uppercase tracking-wider drop-shadow-md", highlightIdx === idx ? "text-yellow-900" : "text-white")}>Win {item.multiplier}x</span>
                </div>
            </div>
            
            {/* 3D Dropped Chips Animation */}
            <AnimatePresence>
                {droppedChips.filter(c => c.itemIdx === idx).map(chip => (
                    <motion.div key={chip.id} initial={{ opacity: 0, scale: 2, y: -80, rotateX: 180 }} animate={{ opacity: 1, scale: 1, y: chip.y, x: chip.x, rotateX: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[24px] w-[24px] rounded-full flex items-center justify-center border-[2px] border-white shadow-[0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.5)] z-40 pointer-events-none", `bg-gradient-to-br ${chip.color}`)}>
                        <div className="absolute inset-[2px] rounded-full border border-white/40 border-dashed" />
                        <span className="text-[7px] font-black text-white drop-shadow-md z-10">{chip.label}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {myBets[item.id] > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-300 to-yellow-600 text-[#4a2511] text-[9px] font-black h-7 w-7 rounded-full flex items-center justify-center border-2 border-white z-[60] shadow-[0_5px_10px_rgba(0,0,0,0.5)] animate-bounce ring-2 ring-yellow-400/30">
                {myBets[item.id] >= 1000 ? (myBets[item.id]/1000)+'K' : myBets[item.id]}
              </motion.div>
            )}
          </button>
        </motion.div>
      ))}
    </div>
   </main>

   {/* ENHANCED FOOTER */}
   <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center z-[60]">
      {/* 3D History Bar */}
      <div className="w-full max-w-[340px] px-4 mb-4">
        <div className="bg-gradient-to-b from-[#4a2411] to-[#2c1408] border-[2px] border-[#ffcda8]/20 rounded-[24px] p-2 flex items-center overflow-x-auto no-scrollbar shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.1)] relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#4a2411] to-transparent z-10 rounded-l-[24px] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-yellow-400 absolute left-3 opacity-50" />
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 font-black text-[11px] px-3 shrink-0 uppercase tracking-widest italic z-20 drop-shadow-sm">History</span>
          <div className="flex items-center gap-2.5 px-2 relative z-0">
            {history.map((id, i) => (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={i} className={cn("shrink-0 h-8 w-8 flex items-center justify-center rounded-xl shadow-inner", i === 0 ? "bg-gradient-to-br from-white/20 to-white/5 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]" : "bg-black/30")}>
                   <span className="text-[20px] drop-shadow-md">{ANIMALS.find(a => a.id === id)?.emoji}</span>
                </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Betting Chips Panel */}
      <div className="w-full h-[12vh] min-h-[85px] bg-gradient-to-b from-[#4a2411] to-[#2c1408] rounded-t-[30px] flex items-center justify-center gap-4 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] border-t-[3px] border-[#ffcda8]/30 relative">
        {/* Glossy top edge */}
        <div className="absolute top-0 left-[20%] right-[20%] h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
        
        {CHIPS_DATA.map(chip => (
          <button key={chip.value} onClick={() => { playSound('bet'); setSelectedChip(chip.value); }} className={cn("h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 border-[3px] shrink-0 relative hover:-translate-y-2", selectedChip === chip.value ? "border-white scale-110 z-20 shadow-[0_0_25px_rgba(255,255,255,0.6),inset_0_4px_8px_rgba(255,255,255,0.4)] -translate-y-3" : "border-white/20 opacity-70 hover:opacity-100 shadow-[0_5px_10px_rgba(0,0,0,0.5)]", `bg-gradient-to-br ${chip.color}`)}>
              {/* 3D Chip Details */}
              <div className="absolute inset-[3px] rounded-full border-[1.5px] border-white/40 border-dashed animate-spin-slow opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none" />
              <span className="text-[13px] font-black text-white relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] tracking-tight">{chip.label}</span>
              
              {/* Highlight indicator for selected chip */}
              {selectedChip === chip.value && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
              )}
          </button>
        ))}
      </div>
   </div>

   {/* ENHANCED RULES MODAL */}
   <AnimatePresence>
    {showRules && (
        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0.2 }} className="fixed bottom-0 left-0 right-0 z-[300] h-[35vh] bg-gradient-to-b from-[#fffbee] to-[#fdf8e7] border-t-[6px] border-orange-500 rounded-t-[30px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col">
            <div className="relative p-5 flex items-center justify-center border-b border-orange-200 bg-white/40 backdrop-blur-md">
                <h3 className="text-[#4a2511] font-black uppercase text-base flex items-center gap-2">
                  <HelpCircle size={18} className="text-orange-500"/> Rules
                </h3>
                <button onClick={() => setShowRules(false)} className="absolute right-4 top-4 text-orange-600 bg-orange-200 hover:bg-orange-300 transition-colors rounded-full p-1.5 shadow-sm"><X size={18} /></button>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-4 justify-center">
                {["Select a Chip and Choose your animal.", "If you win you will get Coins amount (Bet × multiplier).", "45× gives you the highest Coins Amount.", "If you lose you will not receive any coins amount."].map((rule, i) => (
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="flex gap-4 items-center bg-white/60 p-3 rounded-xl border border-orange-100 shadow-sm">
                        <span className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[12px] font-black h-6 w-6 rounded-full flex items-center justify-center shrink-0 shadow-inner">{i+1}</span>
                        <p className="text-[#4a2511] text-xs font-bold leading-tight">{rule}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )}
   </AnimatePresence>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin-slow { animation: spin-slow 8s linear infinite; }
    @keyframes shimmer { 100% { transform: translateX(100%) skewX(-12deg); } }
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
   `}</style>
  </div>
 );
}
