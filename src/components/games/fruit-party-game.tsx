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
 ChevronLeft, 
 Volume2, 
 VolumeX, 
 HelpCircle, 
 Trophy, 
 Users, 
 X,
 Pointer,
 Loader2,
 Plus,
 Clock
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ANIMALS = [
  { id: 'panda', emoji: '🐼', multiplier: 5, label: 'x5', pos: 'top', color: 'from-green-400 to-emerald-600', border: 'border-emerald-400', index: 0 },
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top-right', color: 'from-blue-200 to-blue-400', border: 'border-blue-300', index: 1 },
  { id: 'cow', emoji: '🐮', multiplier: 5, label: 'x5', pos: 'right', color: 'from-slate-100 to-slate-300', border: 'border-white', index: 2 },
  { id: 'dog', emoji: '🐶', multiplier: 5, label: 'x5', pos: 'bottom-right', color: 'from-orange-300 to-orange-500', border: 'border-orange-300', index: 3 },
  { id: 'fox', emoji: '🦊', multiplier: 10, label: 'x10', pos: 'bottom', color: 'from-slate-400 to-slate-600', border: 'border-slate-400', index: 4 },
  { id: 'bear', emoji: '🐻', multiplier: 15, label: 'x15', pos: 'bottom-left', color: 'from-blue-400 to-indigo-600', border: 'border-blue-400', index: 5 },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'left', color: 'from-orange-400 to-orange-600', border: 'border-orange-400', index: 6 },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'top-left', color: 'from-yellow-400 to-red-600', border: 'border-yellow-400', index: 7 },
];

const CHIPS_DATA = [
 { value: 100, label: '100', color: 'from-blue-400 to-cyan-500' },
 { value: 1000, label: '1K', color: 'from-green-400 to-emerald-500' },
 { value: 5000, label: '5K', color: 'from-yellow-400 to-amber-500' },
 { value: 50000, label: '50K', color: 'from-orange-400 to-red-500' },
 { value: 100000, label: '100K', color: 'from-red-500 to-rose-600' },
 { value: 300000, label: '300K', color: 'from-pink-400 to-fuchsia-500' },
 { value: 1000000, label: '1M', color: 'from-purple-500 to-indigo-600' },
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
 const [selectedChip, setSelectedChip] = useState(1000);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [lastBets, setLastBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['panda', 'lion', 'fox']);
 const [isMuted, setIsMuted] = useState(false);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, x: number, y: number}[]>([]);
 const [hintStep, setHintStep] = useState(0);
 const [showRules, setShowRules] = useState(false);

 const handleInvite = () => {
   if (typeof window !== 'undefined') {
     const shareUrl = window.location.origin + '/games/forest-party';
     const text = encodeURIComponent(`Join the ultimate Forest Party adventure! 🐼🦁 Let's win together: ${shareUrl}`);
     window.open(`https://wa.me/?text=${text}`, '_blank');
     toast({ title: 'Sharing Frequency Activated!', description: 'Invite your tribe to the jungle.' });
   }
 };

 const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'forest-party'), [firestore]);
 const { data: gameData } = useDoc(gameDocRef);

 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);
 const tickAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 2000);
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
  if (gameState !== 'betting') return;
  const pointerInterval = setInterval(() => {
   setHintStep(prev => (prev + 1) % SEQUENCE.length);
  }, 1500); 
  return () => clearInterval(pointerInterval);
 }, [gameState]);

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
   label: chipInfo?.label || '100',
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

  setHistory(prev => [id, ...prev].slice(0, 15));
  setWinnerData({ emoji: winItem?.emoji || '🏆', win: winAmount });
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

 if (isLaunching) {
  return (
   <div className="h-screen w-full bg-[#0a0f35] flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000')] bg-cover bg-center opacity-60 mix-blend-screen" />
    <motion.div 
     initial={{ scale: 0.8, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     className="relative z-10 flex flex-col items-center gap-4"
    >
      <div className="text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">🐼</div>
      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-100 to-white uppercase tracking-tighter italic drop-shadow-lg">Forest Party</h1>
      <div className="flex items-center gap-3 bg-[#181c4c]/80 px-6 py-2 rounded-full border border-white/20 backdrop-blur-md">
        <Loader2 className="w-4 h-4 text-white animate-spin" />
        <span className="text-[10px] font-black uppercase text-white/90 tracking-widest">Entering the Night...</span>
      </div>
    </motion.div>
   </div>
  );
 }

 return (
  <div className="h-screen w-full flex flex-col relative overflow-hidden font-sans text-gray-900 bg-white">
   {/* Main Body Glossy White Background */}
   <div className="absolute inset-0 top-[62px] z-0 bg-gradient-to-b from-white via-[#f8fafc] to-[#e2e8f0]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white opacity-60 blur-3xl rounded-full" />
   </div>

   <AnimatePresence>
    {showRules && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-white/80 backdrop-blur-xl p-6">
        <div className="bg-white border border-gray-200 rounded-[3rem] p-8 max-w-sm w-full relative shadow-2xl">
          <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"><X className="h-6 w-6" /></button>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 bg-yellow-50 rounded-3xl flex items-center justify-center mb-2 border border-yellow-100"><HelpCircle className="h-8 w-8 text-yellow-500" /></div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">Jungle Wisdom</h2>
            <div className="space-y-4 text-[13px] font-medium text-gray-600 leading-relaxed">
              <p>1. Select a frequency (chip amount) and choose your animal spirit.</p>
              <p>2. The forest wheel spins every 25 seconds. If the light stops on your animal, you WIN!</p>
              <p>3. Different animals have different multipliers (up to x45 for the Lion!).</p>
            </div>
            <button onClick={() => setShowRules(false)} className="mt-4 w-full bg-gradient-to-b from-yellow-400 to-yellow-500 text-white shadow-md h-12 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all border border-yellow-400">Got it</button>
          </div>
        </div>
      </motion.div>
    )}
   </AnimatePresence>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-white border-[8px] border-yellow-400 rounded-[4rem] p-12 flex flex-col items-center shadow-2xl w-[320px]">
       <Trophy className="text-yellow-500 w-20 h-20 mb-6 drop-shadow-lg" />
       <div className="text-9xl mb-6 drop-shadow-2xl">{winnerData.emoji}</div>
       {winnerData.win > 0 ? (
        <div className="text-center">
         <p className="text-yellow-600 font-black text-3xl uppercase tracking-tighter">PREMIUM WIN!</p>
         <p className="text-5xl font-black text-slate-900 tracking-tighter mt-1">+{winnerData.win.toLocaleString()}</p>
        </div>
       ) : <p className="text-slate-400 font-black text-2xl uppercase tracking-widest italic">Try Again!</p>}
      </motion.div>
     </motion.div>
    )}
   </AnimatePresence>

   {/* TOP HEADER - Dark Night Blue */}
   <header className="relative z-50 flex items-center justify-between px-4 py-3 bg-[#0a0f35] overflow-hidden shadow-md shrink-0">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000')] bg-cover bg-center opacity-70 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f35]/80 via-transparent to-[#0a0f35]/80" />

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
              <button className="h-9 w-9 flex items-center justify-center rounded-full border-[1.5px] border-white/30 bg-[#181c4c]/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all">
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

   <div className="relative z-40 px-6 py-3 shrink-0">
    <div className="bg-white/80 backdrop-blur-2xl rounded-full border border-gray-200/60 p-2 flex items-center gap-3 overflow-x-auto no-scrollbar shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
     {history.map((id, i) => (
      <div key={i} className="relative shrink-0">
        <div className={cn(
          "h-10 w-10 bg-white rounded-full flex items-center justify-center text-2xl border border-gray-100 shadow-sm",
          i === 0 && "ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-white"
        )}>
         {ANIMALS.find(a => a.id === id)?.emoji}
        </div>
        {i === 0 && <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white text-white">NEW</div>}
      </div>
     ))}
    </div>
   </div>

   {/* WHEEL AREA */}
   <main className="flex-1 flex flex-col items-center justify-center py-6 px-4 relative">
    <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full z-10 drop-shadow-sm" viewBox="0 0 100 100">
        <line x1="50" y1="50" x2="50" y2="8" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <line x1="50" y1="50" x2="82" y2="18" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <line x1="50" y1="50" x2="92" y2="50" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <line x1="50" y1="50" x2="82" y2="82" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <line x1="50" y1="50" x2="50" y2="92" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <line x1="50" y1="50" x2="18" y2="82" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <line x1="50" y1="50" x2="8" y2="50" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
        <line x1="50" y1="50" x2="18" y2="18" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
      </svg>

      <div className="relative z-20 w-24 h-24 bg-gradient-to-br from-white to-gray-100 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.1),inset_0_4px_10px_rgba(255,255,255,1)] flex flex-col items-center justify-center border-[4px] border-yellow-400 p-2 text-center overflow-hidden">
        <p className="text-[7px] font-black uppercase text-yellow-600 leading-tight tracking-[0.2em] mb-1">
         {gameState === 'betting' ? 'Bet Now' : 'Spinning'}
        </p>
        <span className={cn(
         "text-3xl font-black tracking-tight",
         gameState === 'betting' ? "text-gray-800" : "text-yellow-500 scale-125 rotate-12"
        )}>
         {gameState === 'betting' ? timeLeft : '🎲'}
        </span>
        {gameState === 'betting' && (
          <div className="mt-1 w-[80%] mx-auto bg-gray-200 rounded-full h-1 relative overflow-hidden">
            <motion.div initial={{ width: '100%' }} animate={{ width: `${(timeLeft/25)*100}%` }} className="absolute left-0 top-0 h-full bg-yellow-400"/>
          </div>
        )}
      </div>

      {ANIMALS.map((item, idx) => {
       const isActive = highlightIdx === idx;
       const betOnThis = myBets[item.id] || 0;
       const isHandPointing = gameState === 'betting' && SEQUENCE[hintStep] === idx;

       return (
        <motion.div  
          key={item.id} 
          className={cn(
           "absolute transition-all duration-300 z-20",
           item.pos === 'top' && "top-[1%] left-1/2 -translate-x-1/2",
           item.pos === 'top-right' && "top-[8%] right-[8%]",
           item.pos === 'right' && "right-[1%] top-1/2 -translate-y-1/2",
           item.pos === 'bottom-right' && "bottom-[8%] right-[8%]",
           item.pos === 'bottom' && "bottom-[1%] left-1/2 -translate-x-1/2",
           item.pos === 'bottom-left' && "bottom-[8%] left-[8%]",
           item.pos === 'left' && "left-[1%] top-1/2 -translate-y-1/2",
           item.pos === 'top-left' && "top-[8%] left-[8%]",
           isActive && "z-50"
          )}
        >
          <button onClick={() => handlePlaceBet(item)} disabled={gameState !== 'betting'} className={cn("relative group active:scale-95 outline-none")}>
            <div className={cn(
             "h-[82px] w-[82px] rounded-full flex flex-col items-center justify-center transition-all border-[4px] relative overflow-hidden shadow-lg bg-gradient-to-br from-white to-gray-50",
             isActive ? "border-yellow-400 scale-110" : "border-gray-200"
            )}>
              <span className={cn("text-[38px] drop-shadow-sm", isActive && "scale-110")}>{item.emoji}</span>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-[2px] rounded-full border-2 bg-white border-yellow-400 whitespace-nowrap">
                <span className="text-[8px] font-black text-gray-800 uppercase">WIN {item.multiplier} TIMES</span>
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {droppedChips.filter(c => c.itemIdx === item.index).map(chip => (
                  <motion.div key={chip.id} initial={{ y: -150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-1/2 left-1/2">
                    <div className={cn("w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-gradient-to-br", chip.color)} style={{ marginLeft: chip.x, marginTop: chip.y }}>
                      <span className="text-[6px] font-black text-white">{chip.label}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {betOnThis > 0 && (
             <div className="absolute -top-3 -right-2 z-40 bg-yellow-400 h-8 w-8 rounded-full border-2 border-white shadow-md flex items-center justify-center">
               <span className="text-[8px] font-black text-white">{betOnThis >= 1000 ? (betOnThis/1000).toFixed(0)+'K' : betOnThis}</span>
             </div>
            )}
            {isHandPointing && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40">
                <Pointer size={28} className="text-gray-800 fill-white animate-bounce" />
              </div>
            )}
          </button>
        </motion.div>
       );
      })}
    </div>
   </main>

   {/* NEW PURPLE CHIP FOOTER BAR - Directly below Game Area */}
   <div className="relative z-50 bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#2e1065] py-4 border-y-2 border-purple-400/40 shadow-[0_0_30px_rgba(76,29,149,0.3)]">
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 items-center justify-center max-w-lg mx-auto">
         {CHIPS_DATA.map(chip => (
          <button 
           key={chip.value} 
           onClick={() => { playSound('bet'); setSelectedChip(chip.value); }} 
           className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center transition-all border-[3px] shrink-0 shadow-lg relative active:scale-90",
            selectedChip === chip.value ? "border-yellow-400 scale-115 z-10 ring-4 ring-yellow-400/20" : "border-white/20 opacity-70",
            `bg-gradient-to-br ${chip.color}`
           )}
          >
            <span className="text-[12px] font-black text-white drop-shadow-md">{chip.label}</span>
            {selectedChip === chip.value && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-purple-900 shadow-sm">
                <div className="h-1.5 w-1.5 bg-purple-900 rounded-full" />
              </div>
            )}
          </button>
         ))}
      </div>
   </div>

   {/* BOTTOM ACTION BAR */}
   <footer className="relative z-50 p-6 pb-SAFE_BOTTOM bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0">
     <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {/* Balance & Invite Area */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50 px-5 py-3 rounded-[2rem] border border-gray-100 shadow-inner">
           <GoldCoinIcon className="h-6 w-6 text-yellow-500 mr-2" />
           <span className="text-2xl font-black text-gray-800">{(localCoins || 0).toLocaleString()}</span>
          </div>
          <button onClick={handleInvite} className="bg-white p-3.5 rounded-2xl border border-gray-200 text-yellow-500 shadow-sm active:scale-90">
           <Users className="h-7 w-7" />
          </button>
        </div>

        {/* Repeat Button */}
        <button 
         onClick={handleRepeat} 
         disabled={gameState !== 'betting'}
         className="flex-1 bg-gradient-to-b from-yellow-400 to-yellow-600 h-16 rounded-[1.8rem] font-black uppercase text-[14px] shadow-lg active:scale-95 transition-all border-2 border-white text-white tracking-widest"
        >
         Repeat
        </button>
     </div>
   </footer>

   <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .pb-SAFE_BOTTOM { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }
    .scale-115 { transform: scale(1.15); }
   `}</style>
  </div>
 );
}
