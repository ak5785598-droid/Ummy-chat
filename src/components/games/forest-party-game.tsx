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
 Users, 
 X,
 Loader2,
 Plus,
 Clock,
 Trophy,
 Frown
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti'; // Firecracker effect ke liye

const ANIMALS = [
  { id: 'panda', emoji: '🐔', multiplier: 5, label: 'x5', pos: 'top', color: 'from-green-400 to-emerald-600', border: 'border-emerald-400', index: 0 },
  { id: 'rabbit', emoji: '🐼', multiplier: 5, label: 'x5', pos: 'top-right', color: 'from-blue-200 to-blue-400', border: 'border-blue-300', index: 1 },
  { id: 'cow', emoji: '🐨', multiplier: 5, label: 'x5', pos: 'right', color: 'from-slate-100 to-slate-300', border: 'border-white', index: 2 },
  { id: 'dog', emoji: '🐻‍❄️', multiplier: 5, label: 'x5', pos: 'bottom-right', color: 'from-orange-300 to-orange-500', border: 'border-orange-300', index: 3 },
  { id: 'fox', emoji: '🦊', multiplier: 10, label: 'x10', pos: 'bottom', color: 'from-slate-400 to-slate-600', border: 'border-slate-400', index: 4 },
  { id: 'bear', emoji: '🐻', multiplier: 15, label: 'x15', pos: 'bottom-left', color: 'from-blue-400 to-indigo-600', border: 'border-blue-400', index: 5 },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'left', color: 'from-orange-400 to-orange-600', border: 'border-orange-400', index: 6 },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'top-left', color: 'from-yellow-400 to-red-600', border: 'border-yellow-400', index: 7 },
];

const CHIPS_DATA = [
 { value: 100, label: '100', color: 'from-blue-400 to-blue-600' },
 { value: 1000, label: '1k', color: 'from-orange-300 to-orange-500' },
 { value: 10000, label: '10k', color: 'from-red-400 to-red-600' },
 { value: 100000, label: '100K', color: 'from-purple-400 to-purple-600' },
 { value: 5000000, label: '5M', color: 'from-emerald-400 to-emerald-600' },
];

const SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7];

export default function ForestPartyGame({ onBack }: { onBack?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [isLaunching, setIsLaunching] = useState(true);
 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(25);
 const [selectedChip, setSelectedChip] = useState(10);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [lastBets, setLastBets] = useState<Record<string, number>>({});
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
 const winAudio = useRef<HTMLAudioElement | null>(null); // Apploss Sound

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
  const timer = setTimeout(() => setIsLaunching(false), 3000);
  if (typeof window !== 'undefined') {
    chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3'); 
    spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
    tickAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/707/707-preview.mp3');
    winAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3'); // Applause/Win sound
  }
  return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  if (isLaunching) return;
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft, isLaunching]);

 const playSound = (type: 'bet' | 'spin' | 'stop' | 'tick' | 'win') => {
  if (isMuted) return;
  if (type === 'bet' && chipAudio.current) {
   chipAudio.current.currentTime = 0;
   chipAudio.current.playbackRate = 2;
   chipAudio.current.play().catch(() => {});
  }
  if (type === 'tick' && tickAudio.current) {
   tickAudio.current.currentTime = 0;
   tickAudio.current.playbackRate = 3;
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
  if (type === 'win' && winAudio.current) {
    winAudio.current.currentTime = 0;
    winAudio.current.play().catch(() => {});
  }
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
   y: (Math.random() * 15) - 7
  };
  setDroppedChips(prev => [...prev, newChip]);
  setLocalCoins(prev => prev - selectedChip);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [animal.id]: (prev[animal.id] || 0) + selectedChip }));
 };

 const handleRepeat = () => {
  if (gameState !== 'betting' || !currentUser) return;
  const totalCost = Object.values(lastBets).reduce((a, b) => a + b, 0);
  if (totalCost === 0) return;
  if (localCoins < totalCost) {
   toast({ title: 'Insufficient Coins', variant: 'destructive' });
   return;
  }

  playSound('bet');
  const newChips: any[] = [];
  Object.entries(lastBets).forEach(([id, amount]) => {
    if (amount === 0) return;
    const item = ANIMALS.find(a => a.id === id);
    if (!item) return;
    newChips.push({
      id: Math.random(),
      itemIdx: item.index,
      label: '...',
      color: 'from-yellow-400 to-orange-500',
      x: 0,
      y: 0
    });
  });
  setDroppedChips(prev => [...prev, ...newChips]);
  setLocalCoins(prev => prev - totalCost);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-totalCost) });
  setMyBets(lastBets);
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
  const targetSequenceIdx = SEQUENCE.indexOf(targetIdx);
  let currentStep = 0;
  const totalSteps = (SEQUENCE.length * 6) + targetSequenceIdx;
  let speed = 40;

  const runChase = () => {
   const activeIdx = SEQUENCE[currentStep % SEQUENCE.length];
   setHighlightIdx(activeIdx);
   
   if (currentStep < 8) {
    playSound('tick');
   } else if (currentStep === 8) {
    playSound('spin');
   }

   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 12) speed += 40;
    else if (remaining < 24) speed += 15;
    currentStep++;
    setTimeout(runChase, speed);
   } else {
    playSound('stop');
    setTimeout(() => finalizeResult(winningId), 800);
   }
  };
  runChase();
 };

 const finalizeResult = (id: string) => {
  const winItem = ANIMALS.find(i => i.id === id);
  const userBetOnWinner = myBets[id] || 0;
  const winAmount = userBetOnWinner * (winItem?.multiplier || 0);

  // Result records logic
  const newRoundRecords = Object.entries(myBets).map(([betId, betAmount]) => {
     const animal = ANIMALS.find(a => a.id === betId);
     const isWinner = betId === id;
     const currentWin = isWinner ? betAmount * (animal?.multiplier || 0) : 0;
     return {
       id: Date.now() + Math.random(),
       emoji: animal?.emoji || '❓',
       bet: betAmount,
       win: currentWin,
       timestamp: Date.now()
     };
  });
  
  if (newRoundRecords.length > 0) {
    setGameRecords(prev => [...newRoundRecords, ...prev]);
  }

  setHistory(prev => [id, ...prev].slice(0, 15));
  
  // Winning Data for Bottom Sheet
  setWinnerData({ 
    emoji: winItem?.emoji || '🏆', 
    win: winAmount, 
    bet: userBetOnWinner 
  });
  setGameState('result');

  // Win Effects
  if (winAmount > 0) {
    playSound('win');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#facc15', '#f97316', '#ffffff']
    });
  }

  if (winAmount > 0 && currentUser && firestore && userProfile) {
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
   setLastBets(myBets);
   setMyBets({});
   setHighlightIdx(null);
   setDroppedChips([]);
   setGameState('betting');
   setTimeLeft(25);
  }, 6000); // 6 seconds wait
 };

 const getValidRecords = () => {
   const IST_OFFSET = 5.5 * 60 * 60 * 1000;
   return gameRecords.filter(record => {
       const now = new Date();
       const currentUtc = now.getTime() + (now.getTimezoneOffset() * 60000);
       const currentIst = new Date(currentUtc + IST_OFFSET);
       const resetTimeIst = new Date(currentIst);
       resetTimeIst.setHours(5, 30, 0, 0);
       if (currentIst < resetTimeIst) resetTimeIst.setDate(resetTimeIst.getDate() - 1);
       const recordUtc = new Date(record.timestamp).getTime() + (new Date(record.timestamp).getTimezoneOffset() * 60000);
       const recordIst = new Date(recordUtc + IST_OFFSET);
       return recordIst >= resetTimeIst;
   });
 };

 // --- LOADING PAGE (CREAM & ORANGE) ---
 if (isLaunching) {
  return (
   <div className="h-screen w-full bg-[#fdf8e7] flex flex-col items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 border-[8px] border-orange-500 m-4 rounded-[2.5rem] pointer-events-none" />
    <motion.div 
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     className="flex flex-col items-center gap-6"
    >
      <div className="relative">
        <Loader2 className="w-20 h-20 text-orange-500 animate-spin stroke-[3]" />
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
        </div>
      </div>
      <h1 className="text-5xl font-black text-orange-600 uppercase tracking-tighter italic">Ummy</h1>
      <div className="px-6 py-2 bg-orange-100 rounded-full border-2 border-orange-500/30">
        <span className="text-[12px] font-black uppercase text-orange-700 tracking-widest">Loading Game...</span>
      </div>
    </motion.div>
   </div>
  );
 }

 return (
  <div className="h-screen w-full flex flex-col relative overflow-hidden font-sans text-white bg-[#0a0f35]">
   
   <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000')] bg-cover bg-center opacity-70 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f35]/50 to-[#0a0f35]" />
   </div>

   {/* --- WINNING RESULT BOTTOM SHEET --- */}
   <AnimatePresence>
    {winnerData && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          className="fixed bottom-0 left-0 right-0 z-[210] h-[35vh] bg-[#fdf8e7] border-t-[6px] border-orange-500 rounded-t-[3rem] shadow-[0_-20px-50px_rgba(0,0,0,0.5)] p-6 flex flex-col items-center"
        >
          <div className="w-16 h-1.5 bg-orange-200 rounded-full mb-6" />
          
          <div className="flex flex-col items-center text-center w-full">
            {winnerData.win > 0 ? (
              <div className="space-y-1">
                <h3 className="text-orange-600 font-black text-2xl uppercase italic flex items-center gap-2">
                  <Trophy className="text-yellow-500" /> Congratulations!
                </h3>
                <p className="text-[#4a2511] font-bold text-sm">Winner Animal: <span className="text-2xl ml-1">{winnerData.emoji}</span></p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-gray-500 font-black text-2xl uppercase italic flex items-center gap-2">
                  <Frown /> Better Luck Next Time
                </h3>
                <p className="text-[#4a2511] font-bold text-sm">Winning was: <span className="text-2xl ml-1">{winnerData.emoji}</span></p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="bg-white/80 p-3 rounded-2xl border-2 border-orange-100 flex flex-col items-center">
                <span className="text-[10px] uppercase font-black text-gray-400">Your Bet</span>
                <span className="text-xl font-black text-[#4a2511]">{winnerData.bet}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border-2 border-orange-100 flex flex-col items-center">
                <span className="text-[10px] uppercase font-black text-gray-400">Winning</span>
                <span className={cn("text-xl font-black", winnerData.win > 0 ? "text-green-600" : "text-red-500")}>
                  {winnerData.win}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    )}
   </AnimatePresence>

   {/* RULES & RECORDS (Wohi purana code) */}
   <AnimatePresence>
    {showRules && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRules(false)} className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[150] h-[30vh] bg-[#fdf8e7] border-t-[4px] border-orange-500 rounded-t-[2rem] p-5 flex flex-col">
          <div className="relative flex justify-center items-center mb-4">
            <h2 className="text-[18px] font-black text-[#4a2511] uppercase tracking-widest">Rules</h2>
            <button onClick={() => setShowRules(false)} className="absolute right-0 text-orange-600 bg-orange-200/50 rounded-full p-1.5"><X size={18} /></button>
          </div>
          <div className="overflow-y-auto no-scrollbar flex-1 space-y-2 text-[#4a2511] font-bold text-[13px]">
            <p>1) Select a Chip and choose your animal.</p>
            <p>2) Choose your Animal to put your bet.</p>
            <p>3) The wheel Spin in every 25Sec.</p>
            <p>4) Win = multiplier × your bet.</p>
          </div>
        </motion.div>
      </>
    )}
   </AnimatePresence>

   {/* TOP HEADER */}
   <header className="relative z-50 flex items-center justify-between px-4 py-3 bg-transparent shrink-0">
      <div className="flex items-center bg-[#181c4c]/80 backdrop-blur-md rounded-full border border-white/20 h-[38px] pl-1 pr-1">
          <div className="bg-yellow-400 rounded-full p-0.5"><GoldCoinIcon className="h-6 w-6 text-yellow-600" /></div>
          <span className="text-white px-3 font-semibold text-[15px]">{localCoins}</span>
          <button className="h-[30px] w-[30px] bg-gradient-to-b from-[#7bdcb5] to-[#4caf50] rounded-full flex items-center justify-center text-white border-[1.5px] border-white/40"><Plus className="h-4 w-4 stroke-[3]" /></button>
      </div>
      <div className="flex items-center gap-2">
          <button onClick={() => setShowRecord(true)} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 text-white"><Clock size={18} /></button>
          <button onClick={() => setIsMuted(!isMuted)} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 text-white">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          <button onClick={() => setShowRules(true)} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 text-white"><HelpCircle size={18} /></button>
          <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 text-white"><X size={18} /></button>
      </div>
   </header>

   {/* History Bar */}
   <div className="relative z-40 px-4 py-3 shrink-0">
    <div className="bg-[#41318f]/80 backdrop-blur-md border-[1.5px] border-[#6b58ce] rounded-[24px] p-2 flex items-center overflow-x-auto no-scrollbar">
     <span className="text-[#e2e0f9] font-medium text-[15px] px-2 shrink-0">Result</span>
     <div className="flex items-center gap-3 px-1">
      {history.map((id, i) => (
       <div key={i} className="relative shrink-0 h-10 w-10 flex items-center justify-center">
         <span className={cn("text-[28px]", i === 0 ? "scale-110 opacity-100" : "opacity-85 scale-95")}>
          {ANIMALS.find(a => a.id === id)?.emoji}
         </span>
       </div>
      ))}
     </div>
    </div>
   </div>

   {/* WHEEL AREA */}
   <main className="flex-1 w-full flex flex-col items-center justify-start pt-8 px-4 relative">
    <div className="relative w-full max-w-[370px] aspect-square flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line key={deg} x1="50" y1="50" x2="50" y2="10" stroke="#eebb99" strokeWidth="2.5" transform={`rotate(${deg} 50 50)`} />
        ))}
      </svg>
      <div className="relative z-20 w-24 h-24 bg-[#4a2511] rounded-full border-[4px] border-[#eebb99] flex flex-col items-center justify-center">
        <p className="text-[8px] font-black uppercase text-[#eebb99]">{gameState === 'betting' ? 'Time' : 'Spin'}</p>
        <span className="text-3xl font-black text-[#eebb99]">{gameState === 'betting' ? timeLeft : '🎲'}</span>
      </div>
      {ANIMALS.map((item, idx) => (
        <motion.div key={item.id} className={cn("absolute transition-all z-20", item.pos === 'top' && "top-[0%] left-1/2 -translate-x-1/2", item.pos === 'top-right' && "top-[10%] right-[10%]", item.pos === 'right' && "right-[0%] top-1/2 -translate-y-1/2", item.pos === 'bottom-right' && "bottom-[10%] right-[10%]", item.pos === 'bottom' && "bottom-[0%] left-1/2 -translate-x-1/2", item.pos === 'bottom-left' && "bottom-[10%] left-[10%]", item.pos === 'left' && "left-[0%] top-1/2 -translate-y-1/2", item.pos === 'top-left' && "top-[10%] left-[10%]")}>
          <button onClick={() => handlePlaceBet(item)} className="relative active:scale-95">
            <div className={cn("h-24 w-24 rounded-full flex items-center justify-center border-[4px] bg-[#4a2511]", highlightIdx === idx ? "border-[#eebb99] scale-110 shadow-lg" : "border-[#eebb99]")}>
              <span className="text-5xl">{item.emoji}</span>
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#4a2511] border-[1px] border-[#eebb99] px-2 py-0.5 rounded-sm min-w-[65%] text-center"><span className="text-[9px] font-bold text-[#eebb99]">Win {item.multiplier}x</span></div>
            {myBets[item.id] > 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-[#0a0f35] text-[9px] font-black h-7 w-7 rounded-full flex items-center justify-center border-2 border-[#181c4c]">{myBets[item.id]}</div>}
          </button>
        </motion.div>
       ))}
    </div>
   </main>

   {/* FOOTER */}
   <footer className="relative z-50 p-4 pb-SAFE_BOTTOM bg-transparent">
     <div className="max-w-md mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={handleRepeat} disabled={gameState !== 'betting'} className="bg-[#1e234a]/80 px-6 h-[50px] rounded-xl font-bold uppercase text-[12px] text-white/60">Repeat</button>
        <div className="flex-1 flex items-center justify-between px-2">
         {CHIPS_DATA.map(chip => (
          <button key={chip.value} onClick={() => { playSound('bet'); setSelectedChip(chip.value); }} className={cn("h-[50px] w-[50px] rounded-full border-[3px] relative bg-gradient-to-br", selectedChip === chip.value ? "border-yellow-400 scale-110 z-20 shadow-lg" : "border-white/20 opacity-90", chip.color)}><span className="text-[12px] font-black text-white relative z-10">{chip.label}</span></button>
         ))}
        </div>
      </div>
     </div>
   </footer>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .pb-SAFE_BOTTOM { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }
   `}</style>
  </div>
 );
}
