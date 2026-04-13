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
 Trophy
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
 { value: 10, label: '10', color: 'from-blue-400 to-blue-600' },
 { value: 100, label: '100', color: 'from-orange-300 to-orange-500' },
 { value: 500, label: '500', color: 'from-red-400 to-red-600' },
 { value: 1000, label: '1K', color: 'from-purple-400 to-purple-600' },
 { value: 10000, label: '10K', color: 'from-emerald-400 to-emerald-600' },
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

 // Load records from local storage
 useEffect(() => {
   if (typeof window !== 'undefined') {
     const saved = localStorage.getItem('forestPartyRecords');
     if (saved) {
       try { setGameRecords(JSON.parse(saved)); } catch (e) {}
     }
   }
 }, []);

 // Save records to local storage
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

 const playSound = (type: 'bet' | 'spin' | 'stop' | 'tick') => {
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
  const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);
  const totalBetAmount = Object.values(myBets).reduce((a, b) => a + b, 0);

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
  setWinnerData({ emoji: winItem?.emoji || '🏆', win: winAmount, bet: totalBetAmount });
  setGameState('result');

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
  }, 5000);
 };

 const getValidRecords = () => {
   const IST_OFFSET = 5.5 * 60 * 60 * 1000;
   return gameRecords.filter(record => {
       const now = new Date();
       const currentUtc = now.getTime() + (now.getTimezoneOffset() * 60000);
       const currentIst = new Date(currentUtc + IST_OFFSET);
       
       const resetTimeIst = new Date(currentIst);
       resetTimeIst.setHours(5, 30, 0, 0); 
       
       if (currentIst < resetTimeIst) {
           resetTimeIst.setDate(resetTimeIst.getDate() - 1);
       }
       
       const recordUtc = new Date(record.timestamp).getTime() + (new Date(record.timestamp).getTimezoneOffset() * 60000);
       const recordIst = new Date(recordUtc + IST_OFFSET);
       
       return recordIst >= resetTimeIst;
   });
 };

 if (isLaunching) {
  return (
   <div className="h-screen w-full bg-[#fdf8e7] flex flex-col items-center justify-center p-6 relative overflow-hidden border-[8px] border-orange-500">
    <motion.div 
     initial={{ scale: 0.8, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     className="relative z-10 flex flex-col items-center gap-6"
    >
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-24 h-24 text-orange-500 animate-spin stroke-[3]" />
        <div className="absolute text-4xl">🐼</div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-black text-orange-600 uppercase tracking-tighter italic drop-shadow-sm">Ummy</h1>
        <div className="bg-orange-500 px-4 py-1 rounded-full shadow-lg">
          <span className="text-[12px] font-black uppercase text-white tracking-[0.2em]">Forest Party</span>
        </div>
      </div>
    </motion.div>
    
    <div className="absolute bottom-10 flex flex-col items-center gap-2">
      <div className="w-48 h-1.5 bg-orange-200 rounded-full overflow-hidden border border-orange-300">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="h-full bg-orange-500"
        />
      </div>
      <span className="text-[10px] font-bold text-orange-600/60 uppercase tracking-widest">Loading Resources...</span>
    </div>
   </div>
  );
 }

 return (
  <div className="h-screen w-full flex flex-col relative overflow-hidden font-sans text-white bg-[#0a0f35]">
   
   <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000')] bg-cover bg-center opacity-70 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f35]/50 to-[#0a0f35]" />
   </div>

   {/* WINNING RESULT BOTTOM SHEET */}
   <AnimatePresence>
    {winnerData && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          className="fixed bottom-0 left-0 right-0 z-[210] h-[30vh] bg-[#fdf8e7] border-t-[6px] border-orange-500 rounded-t-[2.5rem] shadow-[0_-15px_50px_rgba(0,0,0,0.5)] p-6 flex flex-col items-center justify-between"
        >
          <div className="w-16 h-1.5 bg-orange-200 rounded-full mb-2 shrink-0" />
          
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-4">
             <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400 blur-xl opacity-30 animate-pulse" />
                  <div className="relative text-7xl filter drop-shadow-md">{winnerData.emoji}</div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Winning Amount</span>
                  </div>
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
      </>
    )}
   </AnimatePresence>

   {/* RULES BOTTOM SHEET */}
   <AnimatePresence>
    {showRules && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowRules(false)}
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[150] h-[30vh] bg-[#fdf8e7] border-t-[4px] border-orange-500 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(249,115,22,0.3)] p-5 flex flex-col"
        >
          <div className="relative flex justify-center items-center mb-4">
            <h2 className="text-[18px] font-black text-[#4a2511] uppercase tracking-widest drop-shadow-sm">Rules</h2>
            <button onClick={() => setShowRules(false)} className="absolute right-0 text-orange-600 bg-orange-200/50 hover:bg-orange-200 rounded-full p-1.5 transition-colors">
              <X size={18} strokeWidth={3} />
            </button>
          </div>
          <div className="overflow-y-auto no-scrollbar flex-1 space-y-2.5 text-[#4a2511] font-bold text-[13px] px-1 leading-snug">
            <p>1) Select a Chip and choose your animal.</p>
            <p>2) Choose your Animal to put your bet.</p>
            <p>3) The wheel Spin in every 25Sec.</p>
            <p>4) If a spin stop on any Animal so you win and you will get (multipler × your bet).</p>
            <p>5) If you Loss you will not receive any Coins amount.</p>
          </div>
        </motion.div>
      </>
    )}
   </AnimatePresence>

   {/* GAME RECORD BOTTOM SHEET */}
   <AnimatePresence>
    {showRecord && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowRecord(false)}
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[150] h-[40vh] bg-[#fdf8e7] border-t-[4px] border-orange-500 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(249,115,22,0.3)] p-5 flex flex-col"
        >
          <div className="relative flex justify-center items-center mb-4 shrink-0">
            <h2 className="text-[18px] font-black text-[#4a2511] uppercase tracking-widest drop-shadow-sm">Game Record</h2>
            <button onClick={() => setShowRecord(false)} className="absolute right-0 text-orange-600 bg-orange-200/50 hover:bg-orange-200 rounded-full p-1.5 transition-colors">
              <X size={18} strokeWidth={3} />
            </button>
          </div>
          <div className="overflow-y-auto no-scrollbar flex-1 px-1">
             {getValidRecords().length > 0 ? (
                <div className="space-y-3">
                  {getValidRecords().map(rec => (
                     <div key={rec.id} className="flex items-center justify-between bg-white border border-orange-200 rounded-[1rem] p-3 shadow-sm">
                       <div className="flex items-center justify-center bg-orange-100 h-12 w-12 rounded-xl text-3xl">
                         {rec.emoji}
                       </div>
                       <div className="flex flex-col items-center">
                         <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Bet</span>
                         <span className="text-[#4a2511] font-black text-[15px]">{rec.bet}</span>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Win</span>
                         <span className={cn("font-black text-[15px]", rec.win > 0 ? "text-green-600" : "text-red-500")}>
                           {rec.win > 0 ? `+${rec.win}` : '0'}
                         </span>
                       </div>
                     </div>
                  ))}
                </div>
             ) : (
               <div className="h-full flex items-center justify-center flex-col gap-2 text-orange-500/70">
                  <Clock size={32} />
                  <span className="font-bold text-sm">No records found for today</span>
               </div>
             )}
          </div>
        </motion.div>
      </>
    )}
   </AnimatePresence>

   {/* TOP HEADER */}
   <header className="relative z-50 flex items-center justify-between px-4 py-3 bg-transparent overflow-hidden shrink-0">
      <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex items-center bg-[#181c4c]/80 backdrop-blur-md rounded-full border border-white/20 h-[38px] pl-1 pr-1 shadow-inner">
              <div className="bg-yellow-400 rounded-full p-0.5 shadow-sm">
                   <GoldCoinIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-white px-3 font-semibold text-[15px] tracking-wide">{localCoins}</span>
              <button className="h-[30px] w-[30px] bg-gradient-to-b from-[#7bdcb5] to-[#4caf50] rounded-full flex items-center justify-center text-white border-[1.5px] border-white/40 shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all">
                  <Plus className="h-4 w-4 stroke-[3]" />
              </button>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setShowRecord(true)} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all">
                  <Clock size={18} />
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button onClick={() => setShowRules(true)} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all">
                  <HelpCircle size={18} />
              </button>
              <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all">
                  <X size={18} />
              </button>
          </div>
      </div>
   </header>

   {/* History Bar */}
   <div className="relative z-40 px-4 py-3 shrink-0">
    <div className="bg-[#41318f]/80 backdrop-blur-md border-[1.5px] border-[#6b58ce] rounded-[24px] p-2 flex items-center overflow-x-auto no-scrollbar shadow-[0_0_15px_rgba(107,88,206,0.2)]">
     <span className="text-[#e2e0f9] font-medium text-[15px] px-2 shrink-0">Result</span>
     <div className="w-[1px] h-6 bg-white/20 shrink-0 mx-2"></div>
     <div className="flex items-center gap-3 px-1">
      {history.map((id, i) => (
       <div key={i} className="relative shrink-0 flex items-center justify-center h-10 w-10">
         {i === 0 && (
          <div className="absolute -top-1 -right-3 z-10 -rotate-12 bg-gradient-to-b from-[#ffcf54] to-[#ff8c00] text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-[#ffe09e] shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
           New
          </div>
         )}
         <span className={cn(
           "text-[28px] drop-shadow-md transition-all duration-300",
           i === 0 ? "scale-110 opacity-100" : "opacity-85 scale-95"
         )}>
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
      
      <svg className="absolute inset-0 w-full h-full z-10 opacity-100" viewBox="0 0 100 100">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line key={deg} x1="50" y1="50" x2="50" y2="10" stroke="#eebb99" strokeWidth="2.5" transform={`rotate(${deg} 50 50)`} />
        ))}
      </svg>

      <div className="relative z-20 w-24 h-24 bg-[#4a2511] backdrop-blur-md rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center border-[4px] border-[#eebb99]">
        <p className="text-[8px] font-black uppercase text-[#eebb99] mb-1">{gameState === 'betting' ? 'Time' : 'Spin'}</p>
        <span className="text-3xl font-black text-[#eebb99]">{gameState === 'betting' ? timeLeft : '🎲'}</span>
      </div>

      {ANIMALS.map((item, idx) => (
        <motion.div  
          key={item.id} 
          className={cn(
           "absolute transition-all duration-300 z-20",
           item.pos === 'top' && "top-[0%] left-1/2 -translate-x-1/2",
           item.pos === 'top-right' && "top-[10%] right-[10%]",
           item.pos === 'right' && "right-[0%] top-1/2 -translate-y-1/2",
           item.pos === 'bottom-right' && "bottom-[10%] right-[10%]",
           item.pos === 'bottom' && "bottom-[0%] left-1/2 -translate-x-1/2",
           item.pos === 'bottom-left' && "bottom-[10%] left-[10%]",
           item.pos === 'left' && "left-[0%] top-1/2 -translate-y-1/2",
           item.pos === 'top-left' && "top-[10%] left-[10%]"
          )}
        >
          <button onClick={() => handlePlaceBet(item)} className="relative active:scale-95 transition-all">
            <div className={cn(
             "h-24 w-24 rounded-full flex items-center justify-center border-[4px] shadow-lg backdrop-blur-md",
             highlightIdx === idx 
               ? "border-[#eebb99] bg-[#4a2511] scale-110 shadow-[0_0_20px_rgba(238,187,153,0.4)]" 
               : "border-[#eebb99] bg-[#4a2511] hover:bg-[#5c3018]"
            )}>
              <span className="text-5xl">{item.emoji}</span>
            </div>
            
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#4a2511] border-[1px] border-[#eebb99] px-2 py-0.5 shadow-md rounded-sm min-w-[65%] text-center">
                <span className="text-[9px] font-bold text-[#eebb99] whitespace-nowrap">Win {item.multiplier} Time</span>
            </div>
            
            {myBets[item.id] > 0 && (
             <div className="absolute -top-2 -right-2 bg-yellow-400 text-[#0a0f35] text-[9px] font-black h-7 w-7 rounded-full flex items-center justify-center border-2 border-[#181c4c] shadow-md z-30">
               {myBets[item.id] >= 1000 ? (myBets[item.id]/1000)+'K' : myBets[item.id]}
             </div>
            )}
          </button>
        </motion.div>
       ))}
    </div>
   </main>

   {/* FOOTER */}
   <footer className="relative z-50 p-4 pb-SAFE_BOTTOM bg-transparent">
     <div className="max-w-md mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button 
         onClick={handleRepeat} 
         disabled={gameState !== 'betting'}
         className="bg-[#1e234a]/80 backdrop-blur-md px-6 h-[50px] rounded-xl font-bold uppercase text-[12px] text-white/60 active:scale-95 transition-all border border-white/10 shrink-0"
        >
         Repeat
        </button>
        <div className="flex-1 flex items-center justify-between px-2">
         {CHIPS_DATA.map(chip => (
          <button 
           key={chip.value} 
           onClick={() => { playSound('bet'); setSelectedChip(chip.value); }} 
           className={cn(
            "h-[50px] w-[50px] rounded-full flex items-center justify-center transition-all border-[3px] shrink-0 relative",
            selectedChip === chip.value 
             ? "border-yellow-400 scale-110 z-20 shadow-[0_0_15px_rgba(234,179,8,0.5)]" 
             : "border-white/20 opacity-90",
            `bg-gradient-to-br ${chip.color}`
           )}
          >
            <div className="absolute inset-[3px] rounded-full border-[1.5px] border-white/30 border-dashed" />
            <span className="text-[12px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] relative z-10">{chip.label}</span>
          </button>
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
