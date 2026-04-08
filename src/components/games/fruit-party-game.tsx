'use client';

import { useState, useEffect, useRef } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { 
 X, Volume2, VolumeX, Pointer, Trophy, Music, Loader2, HelpCircle
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '5×', color: 'from-yellow-400 to-amber-600', index: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: '10×', color: 'from-purple-400 to-indigo-600', index: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '5×', color: 'from-orange-400 to-red-600', index: 2 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: '45×', color: 'from-rose-400 to-red-700', index: 3 },
  { id: 'timer', emoji: '', multiplier: 0, label: '', color: '', index: 4 }, 
  { id: 'apple', emoji: '🍎', multiplier: 25, label: '25×', color: 'from-red-500 to-rose-800', index: 5 },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: '5×', color: 'from-yellow-400 to-orange-500', index: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '15×', color: 'from-pink-500 to-red-600', index: 7 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: '5×', color: 'from-lime-400 to-green-600', index: 8 },
];

const CHIPS_DATA = [
  { value: 1000, label: '1K', color: 'from-cyan-400 to-blue-600' },
  { value: 50000, label: '50K', color: 'from-pink-400 to-rose-600' },
  { value: 500000, label: '500K', color: 'from-yellow-300 to-orange-500' },
  { value: 5000000, label: '5M', color: 'from-fuchsia-500 to-purple-800' },
];

const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];

const BanianDecoration = ({ side }: { side: 'left' | 'right' }) => (
  <div className={cn("absolute top-0 bottom-0 w-16 z-0 overflow-hidden opacity-40", side === 'left' ? "left-0" : "right-0")}>
    <div className={cn("absolute top-0 h-20 w-full bg-emerald-900/40 rounded-b-full blur-xl", side === 'left' ? "-left-10" : "-right-10")} />
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ y: [0, 5, 0], rotate: side === 'left' ? [-1, 1, -1] : [1, -1, 1] }}
        transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 w-[2px] bg-gradient-to-b from-emerald-900 via-emerald-700 to-transparent"
        style={{ left: `${i * 25}%`, height: `${40 + (i * 15)}%`, opacity: 0.6 }}
      />
    ))}
  </div>
);

export default function FruitPartyGame({ onClose }: { onClose?: () => void }) {
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [isLoading, setIsLoading] = useState(true);
 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [timeLeft, setTimeLeft] = useState(30);
 const [selectedChip, setSelectedChip] = useState(1000);
 const [myBets, setMyBets] = useState<Record<string, number>>({});
 const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
 const [history, setHistory] = useState<string[]>(['grapes', 'pear', 'orange']);
 const [isMuted, setIsMuted] = useState(false);
 const [showRules, setShowRules] = useState(false);
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, x: number, y: number, fromHeader?: boolean}[]>([]);
 
 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
   const timer = setTimeout(() => setIsLoading(false), 2000);
   // Gold Coin sound link
   chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'); 
   // High speed spinning sound link
   spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3');
   if (spinAudio.current) spinAudio.current.loop = true;
   return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const interval = setInterval(() => {
   if (timeLeft > 0) setTimeLeft(prev => prev - 1);
   else startSpin();
  }, 1000);
  return () => clearInterval(interval);
 }, [gameState, timeLeft]);

 const playSound = (type: 'chip' | 'spin' | 'stop') => {
    if (isMuted) return;
    if (type === 'chip' && chipAudio.current) {
        chipAudio.current.currentTime = 0;
        chipAudio.current.play().catch(() => {});
    }
    if (type === 'spin' && spinAudio.current) {
        spinAudio.current.playbackRate = 1.5; // Turun turun effect
        spinAudio.current.play().catch(() => {});
    }
    if (type === 'stop' && spinAudio.current) {
        spinAudio.current.pause();
        spinAudio.current.currentTime = 0;
    }
 };

 const handlePlaceBet = (id: string, idx: number) => {
  if (id === 'timer' || gameState !== 'betting' || !currentUser) return;
  if (localCoins < selectedChip) {
   toast({ title: 'No coins!', variant: 'destructive' });
   return;
  }
  playSound('chip');
  const chipInfo = CHIPS_DATA.find(c => c.value === selectedChip);
  const newChip = {
      id: Date.now(),
      itemIdx: idx,
      label: chipInfo?.label || '1K',
      color: chipInfo?.color || 'from-yellow-400 to-orange-500',
      x: (Math.random() * 30) - 15,
      y: (Math.random() * 15) - 7
  };
  setDroppedChips(prev => [...prev, newChip]);
  setLocalCoins(prev => prev - selectedChip);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-selectedChip) });
  setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 const startSpin = () => {
  setGameState('spinning');
  playSound('spin');
  const itemsOnly = ITEMS.filter(i => i.id !== 'timer');
  const winItem = itemsOnly[Math.floor(Math.random() * itemsOnly.length)];
  const targetIdx = ITEMS.findIndex(i => i.id === winItem.id);
  
  let currentStep = 0;
  // Sequence calculation for faster rotation
  const totalSteps = (SEQUENCE.length * 5) + SEQUENCE.indexOf(targetIdx); 
  let speed = 30; // Faster initial speed

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    if (remaining < 8) speed += 60;
    else if (remaining < 15) speed += 30;
    
    currentStep++;
    setTimeout(run, speed);
   } else {
    playSound('stop');
    setTimeout(() => finalizeResult(winItem), 800);
   }
  };
  run();
 };

 const finalizeResult = (winItem: any) => {
  const bet = myBets[winItem.id] || 0;
  const winAmount = bet * winItem.multiplier;
  setHistory(prev => [winItem.id, ...prev].slice(0, 8));
  if (winAmount > 0) {
    setLocalCoins(prev => prev + winAmount);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(winAmount) });
  }
  setWinnerData({ emoji: winItem.emoji, win: winAmount });
  setGameState('result');
  setTimeout(() => {
   setWinnerData(null);
   setMyBets({});
   setHighlightIdx(null);
   setDroppedChips([]);
   setGameState('betting');
   setTimeLeft(30);
  }, 4000);
 };

 if (isLoading) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
        <h2 className="text-xl font-black italic tracking-widest text-emerald-600 drop-shadow-sm">POWERED-BY UMMY TEAM</h2>
      </div>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 text-white flex flex-col overflow-hidden select-none font-sans relative bg-gradient-to-b from-emerald-50 to-white">
   
   <BanianDecoration side="left" />
   <BanianDecoration side="right" />

   <div className="absolute inset-0 z-0 pointer-events-none">
     <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] bg-emerald-400 blur-[120px] rounded-full" />
     <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 6, repeat: Infinity }} className="absolute -bottom-[10%] -right-[10%] w-[80%] h-[80%] bg-amber-200 blur-[130px] rounded-full" />
   </div>

   <header className="relative pt-4 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-2">
        <div className="flex gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/10 rounded-xl border border-white/20">
                {isMuted ? <VolumeX size={18} className="text-red-500"/> : <Volume2 size={18} className="text-blue-600"/>}
            </button>
            <button onClick={() => setShowRules(true)} className="p-2 bg-black/10 rounded-xl border border-white/20">
                <HelpCircle size={18} className="text-emerald-700"/>
            </button>
        </div>
        <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-emerald-700 via-green-600 to-amber-700">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><X size={18}/></button>
      </div>
      <div className="bg-white/60 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/80 flex gap-1.5 shadow-sm">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-lg">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex items-center justify-center px-4 relative z-10">
      <div className="flex flex-col items-center gap-4 z-40 relative">
        <div className={cn("p-1.5 rounded-[2.5rem] transition-all duration-300 relative bg-white/40 shadow-2xl backdrop-blur-xl border border-white/60", gameState === 'spinning' && "scale-105")}>
          <div className="bg-emerald-950/10 rounded-[2.3rem] p-3 grid grid-cols-3 gap-3 w-[280px] aspect-square relative overflow-hidden">
            
            {/* --- Chips Layer --- */}
            <div className="absolute inset-0 z-50 pointer-events-none">
                <AnimatePresence>
                    {droppedChips.map(chip => (
                        <motion.div key={chip.id} initial={{ y: -300, opacity: 0, scale: 2 }} animate={{ y: 0, opacity: 1, scale: 0.8 }} exit={{ opacity: 0, scale: 0 }} className="absolute" style={{ left: `${(chip.itemIdx % 3) * 33.3 + 16.6}%`, top: `${Math.floor(chip.itemIdx / 3) * 33.3 + 16.6}%`, marginLeft: chip.x, marginTop: chip.y }}>
                            <div className={cn("w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-gradient-to-br", chip.color)}>
                                <span className="text-[7px] font-black text-white">{chip.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {ITEMS.map((item, idx) => {
              if (item.id === 'timer') {
                return (
                  <div key="timer" className="bg-gradient-to-br from-emerald-600 to-green-400 rounded-[1.8rem] flex items-center justify-center border-2 border-white shadow-xl">
                    <AnimatePresence mode="wait">
                      <motion.span key={gameState === 'betting' ? timeLeft : 'spin'} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-4xl font-black text-white">
                        {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-8 h-8" />}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                );
              }

              const isHighlighted = highlightIdx === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePlaceBet(item.id, idx)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-[1.6rem] transition-all duration-150 border-b-4 active:border-b-0",
                    isHighlighted 
                        ? "z-30 shadow-[0_0_20px_rgba(255,215,0,0.8)] border-yellow-400 ring-4 ring-yellow-400 bg-white scale-110" 
                        : "border-black/10 shadow-lg",
                    `bg-gradient-to-br ${item.color}`,
                    gameState === 'spinning' && !isHighlighted && "opacity-40 grayscale-[0.5]"
                  )}
                >
                  <span className={cn("text-3xl drop-shadow-md z-10 transition-transform", isHighlighted && "scale-125 animate-pulse")}>{item.emoji}</span>
                  <span className="text-[10px] font-black text-white mt-0.5 z-10">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-1 right-1 bg-yellow-400 text-emerald-900 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md z-20 border border-white">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6 z-40 bg-white/30 px-4 py-2 rounded-full border border-white backdrop-blur-md">
           <div className="flex gap-3">
             <div className="bg-white/80 p-2 rounded-2xl border border-emerald-100 shadow-sm"><span className="text-2xl">🥗</span></div>
             <div className="bg-white/80 p-2 rounded-2xl border border-emerald-100 shadow-sm"><span className="text-2xl">🥗</span></div>
           </div>
        </div>

        <div className="w-[260px] bg-gradient-to-r from-emerald-600 to-green-500 p-3 rounded-2xl border-2 border-white flex items-center justify-between shadow-2xl z-40">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-400 rounded-xl shadow-inner border border-white/50">
                <GoldCoinIcon className="w-6 h-6 text-emerald-800" />
              </div>
              <div>
                <p className="text-[9px] text-white/90 font-black uppercase tracking-widest leading-none mb-1">Balance</p>
                <p className="text-xl font-black text-white tabular-nums leading-none">{localCoins.toLocaleString()}</p>
              </div>
           </div>
        </div>
      </div>
   </main>

   <footer className="relative mt-auto p-4 z-50 flex justify-center">
      <div className="bg-white/40 backdrop-blur-3xl rounded-[2.8rem] p-3 border-2 border-white shadow-2xl w-fit">
        <div className="flex gap-4 justify-center items-center">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value} 
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 border-white active:translate-y-1 bg-gradient-to-br shadow-xl", chip.color,
                selectedChip === chip.value ? "ring-[4px] ring-yellow-400 scale-110 z-10" : "opacity-50 scale-90",
                gameState !== 'betting' && "grayscale"
              )}
            >
              <span className="text-white font-black text-xs drop-shadow-md">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
   </footer>

   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900/40 backdrop-blur-md">
        <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="bg-white border-[5px] border-yellow-400 rounded-[3rem] p-8 flex flex-col items-center shadow-[0_0_50px_rgba(255,215,0,0.5)] w-[260px]">
          <Trophy className="text-yellow-500 w-12 h-12 mb-3 animate-bounce" />
          <div className="text-7xl mb-4 drop-shadow-2xl">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-emerald-600 font-black text-xl uppercase tracking-tighter">YOU WON!</p>
              <p className="text-4xl font-black text-gray-800 tracking-tight">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : <p className="text-emerald-800/40 font-black text-xl italic">Better Luck!</p>}
        </motion.div>
      </motion.div>
    )}

    {showRules && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#1a3a2a] border-[3px] border-yellow-500 rounded-[2.5rem] w-full max-w-sm relative overflow-hidden shadow-2xl">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-yellow-400 text-3xl font-black italic">Game Rules</h2>
                <button onClick={() => setShowRules(false)} className="bg-white/10 p-2 rounded-full border border-white/20 text-white"><X size={24}/></button>
            </div>
            <div className="space-y-4 text-emerald-50/90 font-medium text-sm leading-relaxed">
                <div className="flex gap-3"><span className="text-yellow-400 font-black">1.</span><p>Select your chip value and click on any fruit to place your bet.</p></div>
                <div className="flex gap-3"><span className="text-yellow-400 font-black">2.</span><p>Timer counts down 30 seconds for betting before the high-speed spin starts.</p></div>
                <div className="flex gap-3"><span className="text-yellow-400 font-black">3.</span><p>Winning fruit gives you your bet amount multiplied by the multiplier shown.</p></div>
                <div className="flex gap-3"><span className="text-yellow-400 font-black">4.</span><p>Golden highlighted border during spin indicates the current high-speed position.</p></div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
