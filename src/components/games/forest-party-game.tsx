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
 Loader2
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

// Updated Chips Data as per visual
const CHIPS_DATA = [
 { value: 10, label: '10', color: 'from-blue-500 to-blue-700', ring: 'border-blue-300' },
 { value: 100, label: '100', color: 'from-orange-400 to-yellow-600', ring: 'border-yellow-300' },
 { value: 500, label: '500', color: 'from-red-400 to-red-700', ring: 'border-red-300' },
 { value: 1000, label: '1K', color: 'from-purple-400 to-purple-700', ring: 'border-purple-300' },
 { value: 10000, label: '10K', color: 'from-green-400 to-green-700', ring: 'border-green-300' },
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
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, x: number, y: number}[]>([]);
 const [hintStep, setHintStep] = useState(0);
 const [showRules, setShowRules] = useState(false);

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
   label: chipInfo?.label || '10',
   color: chipInfo?.color || 'from-blue-500 to-blue-700',
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
   <div className="h-screen w-full bg-emerald-950 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2000')] bg-cover bg-center opacity-20 blur-sm" />
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 flex flex-col items-center gap-4">
      <div className="text-9xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">🐼</div>
      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-emerald-600 uppercase tracking-tighter italic">Forest Party</h1>
      <div className="flex items-center gap-3 bg-black/40 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
        <span className="text-[10px] font-black uppercase text-emerald-400/80 tracking-widest">Entering the Wild...</span>
      </div>
    </motion.div>
   </div>
  );
 }

 return (
  <div className="h-screen w-full bg-[#051a05] flex flex-col relative overflow-hidden font-sans text-white">
   <div className="absolute inset-0 z-0">
    <div className="absolute inset-0 bg-gradient-to-b from-[#0a2e0a] via-[#051a05] to-black" />
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000')] bg-cover bg-center opacity-10" />
   </div>

   <AnimatePresence>
    {showRules && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
        <div className="bg-emerald-900 border-2 border-white/20 rounded-[3rem] p-8 max-w-sm w-full relative shadow-2xl">
          <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center mb-2"><HelpCircle className="h-8 w-8 text-yellow-500" /></div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Jungle Wisdom</h2>
            <div className="space-y-4 text-[13px] font-medium text-emerald-100/80 leading-relaxed">
              <p>1. Select a chip and choose your animal.</p>
              <p>2. The wheel spins every 25s.</p>
              <p>3. Win up to x45 with the Lion!</p>
            </div>
            <button onClick={() => setShowRules(false)} className="mt-4 w-full bg-yellow-500 text-black h-12 rounded-2xl font-black uppercase tracking-widest">Got it</button>
          </div>
        </div>
      </motion.div>
    )}
   </AnimatePresence>

   {/* HEADER */}
   <header className="relative z-50 flex items-center justify-between p-6 pt-10">
    <div className="flex gap-3">
     <button onClick={onBack} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10"><ChevronLeft className="h-6 w-6" /></button>
    </div>
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-black italic bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 to-orange-600 uppercase tracking-tighter">Forest Party</h1>
    </div>
    <div className="flex gap-3">
     <button onClick={() => setShowRules(true)} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10"><HelpCircle className="h-6 w-6" /></button>
     <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
      {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
     </button>
    </div>
   </header>

   <div className="relative z-50 px-6 py-2">
    <div className="bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 p-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
     {history.map((id, i) => (
      <div key={i} className={cn("h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-2xl shrink-0", i === 0 && "bg-white/20 border border-white/30")}>
         {ANIMALS.find(a => a.id === id)?.emoji}
      </div>
     ))}
    </div>
   </div>

   {/* MAIN GAME AREA - SHIFTED UP */}
   <main className="flex-1 flex flex-col items-center justify-start pt-4 px-4 relative">
    <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center mt-[-20px]">
      <svg className="absolute inset-0 w-full h-full z-10 opacity-40" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="41.5" fill="none" stroke="#eab676" strokeWidth="2" strokeDasharray="2 2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line key={angle} x1="50" y1="50" x2={50 + 40 * Math.cos(angle * Math.PI / 180)} y2={50 + 40 * Math.sin(angle * Math.PI / 180)} stroke="#eab676" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative z-30 w-24 h-24 bg-gradient-to-br from-[#4a2e15] to-[#2d1a0d] rounded-full shadow-2xl flex flex-col items-center justify-center border-[4px] border-[#eab676]">
        <p className="text-[8px] font-black uppercase text-yellow-500 tracking-widest">{gameState === 'betting' ? 'BET' : 'SPIN'}</p>
        <span className="text-3xl font-black">{gameState === 'betting' ? timeLeft : '🎰'}</span>
      </div>

      {ANIMALS.map((item, idx) => {
       const isActive = highlightIdx === idx;
       const betOnThis = myBets[item.id] || 0;
       return (
        <motion.div key={item.id} className={cn("absolute transition-all duration-300 z-20", 
           item.pos === 'top' && "top-[0%] left-1/2 -translate-x-1/2",
           item.pos === 'top-right' && "top-[10%] right-[10%]",
           item.pos === 'right' && "right-[0%] top-1/2 -translate-y-1/2",
           item.pos === 'bottom-right' && "bottom-[10%] right-[10%]",
           item.pos === 'bottom' && "bottom-[0%] left-1/2 -translate-x-1/2",
           item.pos === 'bottom-left' && "bottom-[10%] left-[10%]",
           item.pos === 'left' && "left-[0%] top-1/2 -translate-y-1/2",
           item.pos === 'top-left' && "top-[10%] left-[10%]"
          )}>
          <button onClick={() => handlePlaceBet(item)} disabled={gameState !== 'betting'} className="relative group active:scale-90 transition-all">
            <div className={cn("h-20 w-20 rounded-full flex flex-col items-center justify-center border-[3px] relative bg-gradient-to-br from-[#2a1a0a] to-[#1a0f05]",
             isActive ? "border-yellow-400 shadow-[0_0_20px_#fbbf24] scale-110" : "border-[#eab676]/40")}>
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-[8px] font-bold text-yellow-500">{item.label}</span>
            </div>
            {betOnThis > 0 && (
             <div className="absolute -top-1 -right-1 bg-red-600 h-6 w-6 rounded-full border border-white flex items-center justify-center shadow-lg">
               <span className="text-[8px] font-bold">{betOnThis >= 1000 ? (betOnThis/1000)+'K' : betOnThis}</span>
             </div>
            )}
          </button>
        </motion.div>
       );
      })}
    </div>
   </main>

   {/* UPGRADED 3D CHIPS FOOTER (AS PER IMAGE) */}
   <footer className="relative z-50 w-full bg-gradient-to-b from-[#4d2a1a] to-[#2d1a0d] border-t-4 border-[#8e5a3d] pb-SAFE_BOTTOM px-4 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
     <div className="max-w-md mx-auto space-y-4">
      
      {/* Wallet Row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-black/60 rounded-xl py-2 px-4 border-2 border-[#8e5a3d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-500 rounded-full p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"><GoldCoinIcon className="h-4 w-4 text-white" /></div>
            <span className="text-xl font-black text-yellow-400 drop-shadow-md">{(localCoins || 0).toLocaleString()}</span>
          </div>
          <div className="text-yellow-500/50 text-[10px] font-bold uppercase tracking-widest">Balance</div>
        </div>
      </div>

      {/* Chips Selection Area - PURPLE THEME */}
      <div className="relative bg-[#2d0a3d] p-3 rounded-2xl border-4 border-[#7a3ea3] flex items-center gap-2 shadow-inner">
        
        {/* REPEAT BUTTON (Grayish like image) */}
        <button 
          onClick={handleRepeat} 
          disabled={gameState !== 'betting'}
          className="h-14 px-4 rounded-xl bg-gradient-to-b from-gray-400 to-gray-600 border-2 border-gray-300 shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
        >
          <span className="text-xs font-black text-gray-200 uppercase tracking-tighter drop-shadow-md">Repeat</span>
        </button>

        {/* 3D CHIPS LIST */}
        <div className="flex-1 flex justify-around items-center">
          {CHIPS_DATA.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "relative h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200 active:translate-y-1",
                selectedChip === chip.value ? "scale-110 -translate-y-2 z-10" : "opacity-80 scale-90"
              )}
            >
              {/* 3D Outer Ring */}
              <div className={cn("absolute inset-0 rounded-full border-[3px] shadow-[0_4px_10px_rgba(0,0,0,0.4)]", chip.ring, `bg-gradient-to-b ${chip.color}`)} />
              {/* Inner White Dashed Ring (Casino Style) */}
              <div className="absolute inset-1.5 rounded-full border-[1.5px] border-dashed border-white/40" />
              {/* Value Text */}
              <span className="relative z-10 text-[14px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] italic">
                {chip.label}
              </span>
              {/* Selected Glow */}
              {selectedChip === chip.value && (
                <div className="absolute -inset-1 rounded-full border-2 border-white animate-pulse" />
              )}
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
