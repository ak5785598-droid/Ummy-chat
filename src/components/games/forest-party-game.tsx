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
 Cloud
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ANIMALS = [
  { id: 'panda', emoji: '🐔', multiplier: 5, label: 'x5', pos: 'top', index: 0 },
  { id: 'rabbit', emoji: '🐼', multiplier: 5, label: 'x5', pos: 'top-right', index: 1 },
  { id: 'cow', emoji: '🐨', multiplier: 5, label: 'x5', pos: 'right', index: 2 },
  { id: 'dog', emoji: '🐻‍❄️', multiplier: 5, label: 'x5', pos: 'bottom-right', index: 3 },
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

export default function ForestPartyGame() {
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

 const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'forest-party'), [firestore]);
 const { data: gameData } = useDoc(gameDocRef);

 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);
 const tickAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     const saved = localStorage.getItem('forestPartyRecords');
     if (saved) {
       try { setGameRecords(JSON.parse(saved)); } catch (e) {}
     }
   }
 }, []);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     localStorage.setItem('forestPartyRecords', JSON.stringify(gameRecords));
   }
 }, [gameRecords]);

 useEffect(() => {
  if (typeof window !== 'undefined') {
    chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); 
    spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    tickAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
  }
 }, []);

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

 const playSound = (type: 'bet' | 'spin' | 'stop' | 'tick') => {
  if (isMuted) return;
  try {
    if (type === 'bet' && chipAudio.current) {
        chipAudio.current.currentTime = 0;
        chipAudio.current.playbackRate = 1.5;
        chipAudio.current.play().catch(() => {});
       }
       if (type === 'tick' && tickAudio.current) {
        tickAudio.current.currentTime = 0;
        tickAudio.current.playbackRate = 2.5; // Faster ticks
        tickAudio.current.play().catch(() => {});
       }
       if (type === 'spin' && spinAudio.current) {
        spinAudio.current.currentTime = 0;
        spinAudio.current.play().catch(() => {});
       }
       if (type === 'stop' && spinAudio.current) {
        spinAudio.current.pause();
        spinAudio.current.currentTime = 0;
       }
  } catch (error) {}
 };

 const handlePlaceBet = (animal: typeof ANIMALS[0]) => {
  if (gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'Insufficient Coins', variant: 'destructive' });
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
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [animal.id]: (prev[animal.id] || 0) + selectedChip }));
 };

 const startSpin = async () => {
  setGameState('spinning');
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
  const spins = 5; // Rounds
  const totalSteps = (SEQUENCE.length * spins) + targetIdx;
  let speed = 40; // Initial fast speed

  const runChase = () => {
   const activeIdx = currentStep % SEQUENCE.length;
   setHighlightIdx(activeIdx);
   
   if (currentStep % 2 === 0) playSound('tick'); // Fast sound feedback
   if (currentStep === 8) playSound('spin');

   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    
    // Smooth deceleration logic
    if (remaining < 8) speed += 45;
    else if (remaining < 15) speed += 15;
    else if (remaining < 25) speed += 5;
    
    currentStep++;
    setTimeout(runChase, speed);
   } else {
    playSound('stop');
    setTimeout(() => finalizeResult(winningId), 600);
   }
  };
  runChase();
 };

 const finalizeResult = (id: string) => {
  const winItem = ANIMALS.find(i => i.id === id);
  const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);
  const totalBetAmount = Object.values(myBets).reduce((a, b) => a + b, 0);

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
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(winAmount) });
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

 const getValidRecords = () => {
   const IST_OFFSET = 5.5 * 60 * 60 * 1000;
   return gameRecords.filter(record => {
       const now = new Date();
       const currentIst = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + IST_OFFSET);
       const resetTimeIst = new Date(currentIst);
       resetTimeIst.setHours(5, 30, 0, 0); 
       if (currentIst < resetTimeIst) resetTimeIst.setDate(resetTimeIst.getDate() - 1);
       const recordIst = new Date(record.timestamp + (new Date(record.timestamp).getTimezoneOffset() * 60000) + IST_OFFSET);
       return recordIst >= resetTimeIst;
   });
 };

 return (
  <div className="h-[60vh] w-full flex flex-col relative overflow-hidden font-sans text-white bg-[#2D1B4E] rounded-none">
   
   {/* 3D DESERT SUNSET BACKGROUND */}
   <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E] via-[#FF6B6B] to-[#FFD93D]" />
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} 
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-[15%] right-[15%] w-24 h-24 bg-gradient-to-t from-[#FFD93D] to-[#FFFFFF] rounded-full blur-[2px] shadow-[0_0_60px_#FFD93D]"
      />
      <motion.div animate={{ x: [-100, 400] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute top-[10%] left-0 opacity-30"><Cloud size={80} fill="white" color="white" /></motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-[20%] z-10 bg-gradient-to-t from-[#B5674D] to-[#E38B67]">
          <div className="absolute -top-6 left-[10%] w-12 h-8 bg-[#8B4513] rounded-[40%_60%_70%_30%] shadow-2xl rotate-12" />
          <div className="absolute -top-4 right-[20%] w-16 h-10 bg-[#5D2E0C] rounded-[60%_40%_30%_70%] shadow-2xl -rotate-6" />
          <div className="absolute -top-20 left-[5%] text-6xl drop-shadow-2xl select-none">🌵</div>
          <div className="absolute -top-24 right-[8%] text-6xl drop-shadow-2xl select-none">🌵</div>
      </div>
   </div>

   {/* WINNING RESULT OVERLAY */}
   <AnimatePresence>
    {winnerData && (
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[210] h-[30vh] bg-[#fdf8e7] border-t-[6px] border-orange-500 rounded-none p-6 flex flex-col items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-1.5 bg-orange-200 rounded-full mb-2 shrink-0" />
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-4">
             <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400 blur-xl opacity-30 animate-pulse" />
                  <div className="relative text-7xl filter drop-shadow-md">{winnerData.emoji}</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Winning Amount</span>
                  <div className="flex items-center gap-1.5">
                    <GoldCoinIcon className="h-6 w-6" />
                    <span className="text-4xl font-black text-[#4a2511] tabular-nums">+{winnerData.win}</span>
                  </div>
                </div>
             </div>
             <div className="w-full grid grid-cols-2 gap-3 mt-2">
                <div className="bg-orange-100/50 rounded-2xl p-3 border border-orange-200 flex flex-col items-center">
                   <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">Your Total Bet</span>
                   <span className="text-lg font-black text-[#4a2511]">{winnerData.bet}</span>
                </div>
                <div className="bg-orange-500 rounded-2xl p-3 shadow-lg flex flex-col items-center justify-center">
                   <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter">Status</span>
                   <span className="text-lg font-black text-white uppercase italic">{winnerData.win > 0 ? 'Winner' : 'Try Again'}</span>
                </div>
             </div>
          </div>
      </motion.div>
    )}
   </AnimatePresence>

   {/* RECORDS & RULES MODALS REMOVED FOR BREVITY - SAME AS ORIGINAL */}

   {/* TOP HEADER */}
   <header className="relative z-50 flex items-center justify-between px-4 py-1 bg-transparent shrink-0 mt-1">
      <div className="flex items-center bg-black/20 backdrop-blur-md rounded-md border border-white/20 h-[32px] pl-1 pr-1">
          <div className="bg-yellow-400 rounded-md p-0.5"><GoldCoinIcon className="h-5 w-5 text-yellow-600" /></div>
          <span className="text-white px-2 font-semibold text-[14px]">{localCoins}</span>
          <button className="h-[24px] w-[24px] bg-gradient-to-b from-[#7bdcb5] to-[#4caf50] rounded-md flex items-center justify-center text-white border-[1.5px] border-white/40"><Plus className="h-3 w-3 stroke-[3]" /></button>
      </div>
      <div className="flex items-center gap-2">
          <button onClick={() => setShowRecord(true)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white"><Clock size={16} /></button>
          <button onClick={() => setIsMuted(!isMuted)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          <button onClick={() => setShowRules(true)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white"><HelpCircle size={16} /></button>
          <button onClick={() => {}} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-black/30 text-white"><X size={16} /></button>
      </div>
   </header>

   {/* MAIN WHEEL AREA */}
   <main className="flex-1 w-full flex flex-col items-center justify-start pt-10 px-4 relative">
    <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
      
      {/* GOLDEN GLOW BOARDER SVG */}
      <svg className="absolute inset-0 w-full h-full z-10 overflow-visible" viewBox="0 0 100 100">
        <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFFACD" />
              <stop offset="100%" stopColor="#DAA520" />
            </linearGradient>
            <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        
        {/* Main Golden Boarder - Lights up when spinning */}
        <motion.circle 
          cx="50" cy="50" r="44" 
          fill="none" 
          stroke="url(#goldGradient)" 
          strokeWidth={gameState === 'spinning' ? "4" : "2"}
          filter={gameState === 'spinning' ? "url(#goldGlow)" : ""}
          initial={false}
          animate={{ 
            opacity: gameState === 'spinning' ? [0.6, 1, 0.6] : 0.3,
            scale: gameState === 'spinning' ? [1, 1.02, 1] : 1
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />

        {/* Inner static border */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="#eebb99" strokeWidth="1" opacity="0.5" />

        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line key={deg} x1="50" y1="50" x2="50" y2="10" stroke="#eebb99" strokeWidth="1.5" strokeOpacity="0.4" transform={`rotate(${deg} 50 50)`} />
        ))}
      </svg>

      {/* CENTER TIMER DISPLAY */}
      <div className={cn(
        "relative z-20 w-20 h-20 rounded-full flex flex-col items-center justify-center border-[4px] shadow-2xl transition-all duration-300",
        gameState === 'spinning' ? "bg-gradient-to-br from-yellow-400 to-yellow-600 border-white" : "bg-[#4a2511] border-[#eebb99]"
      )}>
        <p className={cn("text-[7px] font-black uppercase", gameState === 'spinning' ? "text-white" : "text-[#eebb99]")}>
            {gameState === 'betting' ? 'Time' : 'Spinning'}
        </p>
        <span className={cn("text-2xl font-black", gameState === 'spinning' ? "text-white animate-bounce" : "text-[#eebb99]")}>
            {gameState === 'betting' ? timeLeft : '🔥'}
        </span>
      </div>

      {/* ANIMAL CARDS */}
      {ANIMALS.map((item, idx) => (
        <motion.div 
          key={item.id} 
          className={cn(
            "absolute z-20", 
            item.pos === 'top' && "top-[2%] left-1/2 -translate-x-1/2", 
            item.pos === 'top-right' && "top-[8%] right-[8%]", 
            item.pos === 'right' && "right-[2%] top-1/2 -translate-y-1/2", 
            item.pos === 'bottom-right' && "bottom-[8%] right-[8%]", 
            item.pos === 'bottom' && "bottom-[2%] left-1/2 -translate-x-1/2", 
            item.pos === 'bottom-left' && "bottom-[8%] left-[8%]", 
            item.pos === 'left' && "left-[2%] top-1/2 -translate-y-1/2", 
            item.pos === 'top-left' && "top-[8%] left-[8%]"
          )}
        >
          <button onClick={() => handlePlaceBet(item)} className="relative group">
            <div className={cn(
                "h-[86px] w-[86px] rounded-full flex flex-col items-center justify-start pt-2 border-[3px] bg-[#4a2511] transition-all duration-75 overflow-hidden relative shadow-[0_6px_0_#241108,0_10px_10px_rgba(0,0,0,0.5)]", 
                highlightIdx === idx 
                    ? "scale-110 border-white bg-gradient-to-b from-yellow-400 to-yellow-700 shadow-[0_0_25px_#FFD700,inset_0_0_15px_rgba(255,255,255,0.5)] z-50 ring-4 ring-yellow-400/30" 
                    : "border-[#eebb99]"
            )}>
                <span className={cn(
                    "text-[38px] z-10 transition-transform",
                    highlightIdx === idx ? "scale-125 rotate-6 drop-shadow-xl" : "drop-shadow-[0_5px_4px_rgba(0,0,0,0.6)]"
                )}>{item.emoji}</span>
                
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 py-0.5 text-center z-20 transition-colors",
                    highlightIdx === idx ? "bg-white/20" : "bg-[#4a2511] border-t border-[#eebb99]"
                )}>
                    <span className={cn("text-[7px] font-bold uppercase tracking-tighter", highlightIdx === idx ? "text-white" : "text-[#eebb99]")}>
                        Win {item.multiplier}x
                    </span>
                </div>
            </div>

            {/* CHIPS ON CARDS */}
            <AnimatePresence>
                {droppedChips.filter(c => c.itemIdx === idx).map(chip => (
                    <motion.div
                        key={chip.id}
                        initial={{ opacity: 0, scale: 3, y: -60 }}
                        animate={{ opacity: 1, scale: 1, y: chip.y, x: chip.x }}
                        className={cn(
                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                            "h-[22px] w-[22px] rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg z-40 pointer-events-none",
                            `bg-gradient-to-br ${chip.color}`
                        )}
                    >
                        <span className="text-[6px] font-black text-white">{chip.label}</span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {myBets[item.id] > 0 && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-[#4a2511] text-[8px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white z-[60] shadow-xl animate-bounce">
                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000)+'K' : myBets[item.id]}
                </div>
            )}
          </button>
        </motion.div>
      ))}
    </div>
   </main>

   {/* BOTTOM SECTION */}
   <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center z-[60]">
      <div className="w-full max-w-[340px] px-4 mb-3">
        <div className="bg-[#3a1c0d] border-[1.5px] border-[#241108] rounded-[20px] p-1.5 flex items-center overflow-x-auto no-scrollbar shadow-lg">
          <span className="text-yellow-400 font-black text-[10px] px-2 shrink-0 uppercase tracking-widest italic">History</span>
          <div className="flex items-center gap-2 px-1">
            {history.map((id, i) => (
                <div key={i} className={cn("shrink-0 h-7 w-7 flex items-center justify-center rounded-lg", i === 0 ? "bg-white/10 ring-1 ring-yellow-400" : "")}>
                   <span className="text-[18px]">{ANIMALS.find(a => a.id === id)?.emoji}</span>
                </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-[10vh] min-h-[70px] bg-[#3a1c0d] rounded-none flex items-center justify-center gap-4 px-4 shadow-[0_-5px_25px_rgba(0,0,0,0.5)] border-t-[4px] border-[#241108]">
        {CHIPS_DATA.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => { playSound('bet'); setSelectedChip(chip.value); }} 
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-all border-2 shrink-0 relative", 
              selectedChip === chip.value ? "border-white scale-115 z-20 shadow-[0_0_20px_white]" : "border-white/10 opacity-60 hover:opacity-100", 
              `bg-gradient-to-br ${chip.color}`
            )}
          >
              <div className="absolute inset-[2px] rounded-full border border-white/20 border-dashed animate-spin-slow" />
              <span className="text-[12px] font-black text-white relative z-10">{chip.label}</span>
          </button>
        ))}
      </div>
   </div>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin-slow { animation: spin-slow 8s linear infinite; }
   `}</style>
  </div>
 );
}
