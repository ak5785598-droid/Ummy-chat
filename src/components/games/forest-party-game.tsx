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
 Loader2
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
 { value: 100, label: '100', color: 'from-blue-400 to-blue-600' },
 { value: 1000, label: '1k', color: 'from-orange-300 to-orange-500' },
 { value: 50000, label: '50k', color: 'from-red-400 to-red-600' },
 { value: 500000, label: '500k', color: 'from-purple-400 to-purple-600' },
 { value: 5000000, label: '5M', color: 'from-emerald-400 to-emerald-600' },
 { value: 10000000, label: '10M', color: 'from-orange-500 to-orange-600' }, 
];

const SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7];

export default function ForestPartyGame({ onBack }: { onBack?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 // LOADING STATE
 const [isLoading, setIsLoading] = useState(true);

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

 // SIMULATE LOADING
 useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 2500); // 2.5 seconds loading
    return () => clearTimeout(timer);
 }, []);

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
        tickAudio.current.playbackRate = 2;
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
  const spins = 6;
  const totalSteps = (SEQUENCE.length * spins) + targetIdx;
  let speed = 50;

  const runChase = () => {
   const activeIdx = currentStep % SEQUENCE.length;
   setHighlightIdx(activeIdx);
   
   if (currentStep < 8) playSound('tick');
   else if (currentStep === 8) playSound('spin');

   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 10) speed += 35;
    else if (remaining < 20) speed += 10;
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

 // RENDER LOADING PAGE (Fix applied here - squared corners)
 if (isLoading) {
    return (
        <div className="h-full min-h-[70vh] w-full flex flex-col items-center justify-center bg-[#fdf8e7] relative overflow-hidden rounded-none">
            <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="relative flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
                    <div className="absolute inset-0 bg-orange-200/20 blur-xl rounded-full" />
                </div>
                <h1 className="text-2xl font-black text-[#4a2511] tracking-widest uppercase animate-pulse">
                    Ummy
                </h1>
            </div>
            {/* Background elements to match the vibe */}
            <div className="absolute top-10 left-10 text-4xl opacity-20 z-0">🦁</div>
            <div className="absolute bottom-10 right-10 text-4xl opacity-20 z-0">🐼</div>
            
            {/* This invisible div ensures the cream color stretches to the very bottom to prevent any transparency */}
            <div className="absolute -bottom-10 left-0 right-0 h-20 bg-[#fdf8e7] z-0" />
        </div>
    );
 }

 return (
  <div className="h-[60vh] w-full flex flex-col relative overflow-hidden font-sans text-white bg-[#0a0f35] rounded-none">
   
   <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000')] bg-cover bg-center opacity-70 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f35]/50 to-[#0a0f35]" />
   </div>

   {/* WINNING RESULT OVERLAY */}
   <AnimatePresence>
    {winnerData && (
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[210] h-[30vh] bg-[#fdf8e7] border-t-[6px] border-orange-500 rounded-t-[2.5rem] p-6 flex flex-col items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
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

   {/* RULES MODAL */}
   <AnimatePresence>
    {showRules && (
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[150] h-[30vh] bg-[#fdf8e7] border-t-[4px] border-orange-500 rounded-t-[2rem] p-5 flex flex-col shadow-2xl">
          <div className="relative flex justify-center items-center mb-4">
            <h2 className="text-[18px] font-black text-[#4a2511] uppercase tracking-widest">Rules</h2>
            <button onClick={() => setShowRules(false)} className="absolute right-0 text-orange-600 bg-orange-200/50 rounded-full p-1.5"><X size={18} /></button>
          </div>
          <div className="overflow-y-auto no-scrollbar flex-1 space-y-2.5 text-[#4a2511] font-bold text-[13px] leading-snug">
            <p>1) Select a Chip and choose your animal.</p>
            <p>2) Choose your Animal to put your bet.</p>
            <p>3) The wheel Spin in every 25Sec.</p>
            <p>4) If a spin stop on any Animal so you win and you will get (multipler × your bet).</p>
            <p>5) If you Loss you will not receive any Coins amount.</p>
          </div>
      </motion.div>
    )}
   </AnimatePresence>

   {/* RECORDS MODAL */}
   <AnimatePresence>
    {showRecord && (
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[150] h-[40vh] bg-[#fdf8e7] border-t-[4px] border-orange-500 rounded-t-[2rem] p-5 flex flex-col shadow-2xl">
          <div className="relative flex justify-center items-center mb-4">
            <h2 className="text-[18px] font-black text-[#4a2511] uppercase tracking-widest">Game Record</h2>
            <button onClick={() => setShowRecord(false)} className="absolute right-0 text-orange-600 bg-orange-200/50 rounded-full p-1.5"><X size={18} /></button>
          </div>
          <div className="overflow-y-auto no-scrollbar flex-1 px-1">
             {getValidRecords().length > 0 ? (
                <div className="space-y-3">
                  {getValidRecords().map(rec => (
                     <div key={rec.id} className="flex items-center justify-between bg-white border border-orange-200 rounded-[1rem] p-3">
                       <div className="flex items-center justify-center bg-orange-100 h-12 w-12 rounded-xl text-3xl">{rec.emoji}</div>
                       <div className="flex flex-col items-center">
                         <span className="text-[10px] text-gray-500 uppercase font-black">Bet</span>
                         <span className="text-[#4a2511] font-black">{rec.bet}</span>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className="text-[10px] text-gray-500 uppercase font-black">Win</span>
                         <span className={cn("font-black", rec.win > 0 ? "text-green-600" : "text-red-500")}>{rec.win > 0 ? `+${rec.win}` : '0'}</span>
                       </div>
                     </div>
                  ))}
                </div>
             ) : (
               <div className="h-full flex items-center justify-center flex-col gap-2 text-orange-500/70">
                  <Clock size={32} /><span className="font-bold text-sm">No records found</span>
               </div>
             )}
          </div>
      </motion.div>
    )}
   </AnimatePresence>

   {/* TOP HEADER */}
   <header className="relative z-50 flex items-center justify-between px-4 py-1 bg-transparent shrink-0 mt-1">
      <div className="flex items-center bg-[#181c4c]/80 backdrop-blur-md rounded-md border border-white/20 h-[32px] pl-1 pr-1">
          <div className="bg-yellow-400 rounded-md p-0.5"><GoldCoinIcon className="h-5 w-5 text-yellow-600" /></div>
          <span className="text-white px-2 font-semibold text-[14px]">{localCoins}</span>
          <button className="h-[24px] w-[24px] bg-gradient-to-b from-[#7bdcb5] to-[#4caf50] rounded-md flex items-center justify-center text-white border-[1.5px] border-white/40"><Plus className="h-3 w-3 stroke-[3]" /></button>
      </div>
      <div className="flex items-center gap-2">
          <button onClick={() => setShowRecord(true)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-[#181c4c]/60 text-white"><Clock size={16} /></button>
          <button onClick={() => setIsMuted(!isMuted)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-[#181c4c]/60 text-white">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          <button onClick={() => setShowRules(true)} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-[#181c4c]/60 text-white"><HelpCircle size={16} /></button>
          <button onClick={onBack} className="h-8 w-8 flex items-center justify-center rounded-md border border-white/30 bg-[#181c4c]/60 text-white"><X size={16} /></button>
      </div>
   </header>

   {/* MAIN WHEEL AREA */}
   <main className="flex-1 w-full flex flex-col items-center justify-start pt-10 px-4 relative">
    <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line key={deg} x1="50" y1="50" x2="50" y2="10" stroke="#eebb99" strokeWidth="2.5" transform={`rotate(${deg} 50 50)`} />
        ))}
      </svg>

      <div className="relative z-20 w-20 h-20 bg-[#4a2511] rounded-full flex flex-col items-center justify-center border-[4px] border-[#eebb99] shadow-xl">
        <p className="text-[7px] font-black uppercase text-[#eebb99]">{gameState === 'betting' ? 'Time' : 'Spin'}</p>
        <span className="text-2xl font-black text-[#eebb99]">{gameState === 'betting' ? timeLeft : '🎲'}</span>
      </div>

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
          <button onClick={() => handlePlaceBet(item)} className="relative active:scale-95 transition-all">
            <div className={cn(
                "h-[86px] w-[86px] rounded-full flex flex-col items-center justify-start pt-2 border-[4px] bg-[#4a2511] border-[#eebb99] transition-all overflow-hidden relative shadow-[0_6px_0_#b57f5e,0_10px_10px_rgba(0,0,0,0.5),inset_0_-5px_10px_rgba(0,0,0,0.5)]", 
                highlightIdx === idx && "scale-110 bg-[#6b331a] shadow-[0_0_30px_rgba(238,187,153,0.6)] border-white"
            )}>
                <span className="text-[38px] z-10 drop-shadow-[0_5px_4px_rgba(0,0,0,0.6)]">{item.emoji}</span>
                <div className="absolute bottom-0 left-0 right-0 bg-[#4a2511] border-t border-[#eebb99] py-0.5 text-center z-20">
                    <span className="text-[7px] font-bold text-[#eebb99] uppercase tracking-tighter">
                        Win {item.multiplier} Time
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {droppedChips.filter(c => c.itemIdx === idx).map(chip => (
                    <motion.div
                        key={chip.id}
                        initial={{ opacity: 0, scale: 3, y: -60, x: 0 }}
                        animate={{ opacity: 1, scale: 1, y: chip.y, x: chip.x }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={cn(
                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                            "h-[22px] w-[22px] rounded-full flex items-center justify-center border-2 border-white/30 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-40 pointer-events-none",
                            `bg-gradient-to-br ${chip.color}`
                        )}
                    >
                        <div className="absolute inset-[1px] rounded-full border border-white/20 border-dashed" />
                        <span className="text-[6px] font-black text-white relative z-10">{chip.label}</span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {myBets[item.id] > 0 && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-[#0a0f35] text-[8px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-[#181c4c] z-50 shadow-lg">
                    {myBets[item.id] >= 1000 ? (myBets[item.id]/1000)+'K' : myBets[item.id]}
                </div>
            )}
          </button>
        </motion.div>
      ))}
    </div>
   </main>

   {/* BOTTOM SECTION */}
   <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center z-40">
      <div className="w-full max-w-[340px] px-4 mb-3">
        <div className="bg-[#41318f]/80 backdrop-blur-md border-[1.5px] border-[#6b58ce] rounded-[20px] p-1.5 flex items-center overflow-x-auto no-scrollbar shadow-lg">
          <span className="text-[#e2e0f9] font-bold text-[12px] px-2 shrink-0 italic">Result</span>
          <div className="w-[1px] h-4 bg-white/20 shrink-0 mx-1" />
          <div className="flex items-center gap-2 px-1">
            {history.map((id, i) => (
            <div key={i} className="relative shrink-0 h-7 w-7 flex items-center justify-center">
              {i === 0 && <div className="absolute -top-1 -right-2 z-10 bg-gradient-to-b from-[#ffcf54] to-[#ff8c00] text-white text-[7px] font-black px-1 rounded shadow-sm">New</div>}
              <span className="text-[20px]">{ANIMALS.find(a => a.id === id)?.emoji}</span>
            </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-[10vh] min-h-[70px] bg-purple-600 rounded-t-3xl flex items-center justify-center gap-4 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] border-t-[4px] border-[#3b0764]">
        {CHIPS_DATA.map(chip => (
          <button 
            key={chip.value} 
            onClick={() => { playSound('bet'); setSelectedChip(chip.value); }} 
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-all border-2 shrink-0 relative", 
              selectedChip === chip.value ? "border-yellow-400 scale-110 z-20 shadow-[0_0_15px_rgba(234,179,8,0.6)]" : "border-white/20 opacity-80", 
              `bg-gradient-to-br ${chip.color}`
            )}
          >
              <div className="absolute inset-[2px] rounded-full border border-white/20 border-dashed" />
              <span className="text-[12px] font-black text-white relative z-10">{chip.label}</span>
          </button>
        ))}
      </div>
   </div>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
   `}</style>
  </div>
 );
}
