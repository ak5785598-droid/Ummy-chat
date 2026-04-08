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
 X, Volume2, VolumeX, Pointer, Trophy, Music, Loader2
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

const DJVisualizer = ({ colorClass = "bg-pink-500" }: { colorClass?: string }) => (
  <div className="flex items-end gap-0.5 h-8 px-1">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ height: [4, 32, 10, 28, 6] }}
        transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        className={cn("w-1 rounded-t-full shadow-[0_0_10px_rgba(255,255,255,0.3)]", colorClass)}
      />
    ))}
  </div>
);

const VisualizerPillar = ({ height = "h-48", colors = ['#ff3366', '#ffcc00', '#00ffcc'] }: { height?: string, colors?: string[] }) => (
  <div className={cn("flex flex-col gap-1 w-3 bg-white/20 p-1 rounded-full border border-white/40 backdrop-blur-md shadow-2xl z-20", height)}>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.4, 1, 0.4], scaleX: [1, 1.3, 1], backgroundColor: i < 2 ? colors[0] : i < 5 ? colors[1] : colors[2] }}
        transition={{ duration: Math.random() * 0.5 + 0.2, repeat: Infinity, delay: i * 0.08 }}
        className="w-full h-full rounded-full"
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
 const [hintStep, setHintStep] = useState(0);
 const [winnerData, setWinnerData] = useState<{ emoji: string; win: number } | null>(null);
 const [localCoins, setLocalCoins] = useState(0);
 
 const [droppedChips, setDroppedChips] = useState<{id: number, itemIdx: number, label: string, color: string, x: number, y: number}[]>([]);
 
 // Audio Refs
 const chipAudio = useRef<HTMLAudioElement | null>(null);
 const spinAudio = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
   const timer = setTimeout(() => setIsLoading(false), 2000);
   // Initialize Audio (Using standard browser sounds or placeholder URLs)
   chipAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
   spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
   if (spinAudio.current) spinAudio.current.loop = true;

   return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  if (userProfile?.wallet?.coins !== undefined) setLocalCoins(userProfile.wallet.coins);
 }, [userProfile?.wallet?.coins]);

 useEffect(() => {
  if (gameState !== 'betting') return;
  const interval = setInterval(() => {
    setHintStep(prev => (prev + 1) % SEQUENCE.length);
  }, 2000); 
  return () => clearInterval(interval);
 }, [gameState]);

 useEffect(() => {
  const interval = setInterval(() => {
   if (gameState === 'betting') {
    if (timeLeft > 0) setTimeLeft(prev => prev - 1);
    else startSpin();
   }
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
      x: (Math.random() * 40) - 20,
      y: (Math.random() * 20) - 10
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
  // Increase total steps for a longer, smoother deceleration feel
  const totalSteps = (SEQUENCE.length * 8) + SEQUENCE.indexOf(targetIdx); 
  let speed = 40;

  const run = () => {
   setHighlightIdx(SEQUENCE[currentStep % SEQUENCE.length]);
   if (currentStep < totalSteps) {
    const remaining = totalSteps - currentStep;
    // Smoother speed curve logic
    if (remaining < 8) speed += 60;
    else if (remaining < 15) speed += 30;
    else if (remaining < 25) speed += 10;
    
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
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
        <h2 className="text-xl font-black italic tracking-widest text-pink-600 drop-shadow-sm">
          POWERED-BY UMMY TEAM
        </h2>
      </div>
    </div>
  );
 }

 return (
  <div className="fixed inset-0 text-white flex flex-col overflow-hidden select-none font-sans relative bg-white">
   
   {/* --- Background Effects --- */}
   <div className="absolute inset-0 z-0 pointer-events-none">
     <motion.div 
        animate={{ x: [0, 30, 0], y: [0, -40, 0] }} 
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] bg-pink-500 blur-[120px] rounded-full opacity-70" 
     />
     <motion.div 
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }} 
        transition={{ duration: 18, repeat: Infinity }}
        className="absolute -bottom-[10%] -right-[10%] w-[80%] h-[80%] bg-sky-400 blur-[130px] rounded-full opacity-70" 
     />
   </div>

   <header className="relative pt-4 px-6 flex flex-col items-center z-40">
      <div className="flex justify-between items-center w-full mb-2">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/10 rounded-xl border border-white/20 backdrop-blur-md">
            {isMuted ? <VolumeX size={18} className="text-red-500"/> : <Volume2 size={18} className="text-green-600"/>}
        </button>
        <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-pink-600 via-sky-500 to-indigo-700 drop-shadow-md">FRUIT PARTY</h1>
        <button onClick={onClose} className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
          <X size={18}/>
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/80 flex gap-1.5 shadow-lg">
        {history.map((id, i) => (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="text-lg">{ITEMS.find(it => it.id === id)?.emoji}</motion.span>
        ))}
      </div>
   </header>

   <main className="flex-1 flex items-center justify-between px-4 relative z-10">
      <VisualizerPillar height="h-64" colors={['#FF1493', '#FFFFFF', '#00BFFF']} />
      
      <div className="flex-1 flex flex-col items-center gap-4 z-40 relative">
        <div className={cn("p-2 rounded-[2.5rem] transition-all duration-700 relative", 
             gameState === 'spinning' ? "bg-gradient-to-br from-sky-400 via-white to-pink-500 shadow-[0_0_60px_rgba(255,255,255,0.8)] scale-[1.03]" : "bg-white/40 shadow-2xl backdrop-blur-xl border border-white/60")}>
          
          <div className="bg-white/20 rounded-[2.3rem] p-3 grid grid-cols-3 gap-3 w-[300px] aspect-square relative overflow-hidden">
            
            {/* Chips Container */}
            <div className="absolute inset-0 z-50 pointer-events-none">
                <AnimatePresence>
                    {droppedChips.map(chip => (
                        <motion.div
                            key={chip.id}
                            initial={{ y: -400, opacity: 0, scale: 2 }}
                            animate={{ y: 0, opacity: 1, scale: 0.8 }}
                            className="absolute"
                            style={{ 
                                left: `${(chip.itemIdx % 3) * 33.3 + 16.6}%`,
                                top: `${Math.floor(chip.itemIdx / 3) * 33.3 + 16.6}%`,
                                marginLeft: chip.x,
                                marginTop: chip.y
                            }}
                        >
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
                  <div key="timer" className="bg-gradient-to-br from-pink-500 to-sky-500 rounded-[2rem] flex items-center justify-center border-2 border-white/80 shadow-inner">
                    <AnimatePresence mode="wait">
                        <motion.span 
                            key={gameState === 'betting' ? timeLeft : 'spin'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl font-black text-white drop-shadow-md"
                        >
                            {gameState === 'betting' ? timeLeft : <Music className="animate-spin w-8 h-8" />}
                        </motion.span>
                    </AnimatePresence>
                  </div>
                );
              }

              const isHighlighted = highlightIdx === idx;
              const isHandPointing = gameState === 'betting' && SEQUENCE[hintStep] === idx;

              return (
                <button
                  key={item.id}
                  onClick={() => handlePlaceBet(item.id, idx)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-[1.8rem] transition-all duration-300 border-b-4 active:border-b-0 active:translate-y-1 overflow-hidden",
                    isHighlighted ? "scale-105 z-20 shadow-2xl border-white ring-4 ring-white bg-white" : "border-black/10 shadow-lg",
                    `bg-gradient-to-br ${item.color}`,
                    gameState === 'spinning' && !isHighlighted && "grayscale-[0.3] opacity-60"
                  )}
                >
                  {/* SPINNING SHINE EFFECT */}
                  {gameState === 'spinning' && (
                      <motion.div 
                        initial={{ x: '-150%' }}
                        animate={{ x: '150%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-0"
                      />
                  )}

                  <span className={cn("text-3xl drop-shadow-md z-10 transition-transform", isHighlighted && "scale-110")}>{item.emoji}</span>
                  <span className="text-[11px] font-black text-white mt-1 z-10 drop-shadow-sm">{item.label}</span>
                  
                  {myBets[item.id] > 0 && (
                    <div className="absolute top-1 right-1 bg-white text-pink-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-20">
                      {myBets[item.id] >= 1000 ? (myBets[item.id]/1000).toFixed(0)+'k' : myBets[item.id]}
                    </div>
                  )}
                  
                  <AnimatePresence>{isHandPointing && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                    >
                      <Pointer size={45} className="text-white fill-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)] brightness-125 -rotate-45 animate-bounce" />
                    </motion.div>
                  )}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 z-40">
           <DJVisualizer colorClass="bg-sky-500" />
           <div className="bg-white/50 p-3 rounded-[2rem] border border-white/80 shadow-xl backdrop-blur-md">
                <span className="text-3xl block">🥗</span>
           </div>
           <DJVisualizer colorClass="bg-pink-600" />
        </div>

        <div className="w-[260px] bg-white/50 p-3 rounded-2xl border border-white flex items-center justify-between shadow-2xl backdrop-blur-xl z-40">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-xl shadow-inner">
                <GoldCoinIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-pink-700 font-black uppercase tracking-widest mb-0">Total Coins</p>
                <p className="text-xl font-black text-gray-800 tabular-nums leading-none">
                    {localCoins.toLocaleString()}
                </p>
              </div>
           </div>
        </div>
      </div>
      
      <VisualizerPillar height="h-64" colors={['#00BFFF', '#FFFFFF', '#FF1493']} />
   </main>

   <footer className="relative mt-auto p-5 z-50 flex justify-center">
      <div className="bg-white/50 backdrop-blur-3xl rounded-[3rem] p-4 border border-white shadow-2xl w-fit">
        <div className="flex gap-4 justify-center items-center">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value} 
              disabled={gameState !== 'betting'}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 border-white active:translate-y-1 bg-gradient-to-br shadow-lg", chip.color,
                selectedChip === chip.value ? "ring-4 ring-pink-500 scale-110 opacity-100" : "opacity-40 scale-90",
                gameState !== 'betting' && "grayscale cursor-not-allowed"
              )}
            >
              <span className="text-white font-black text-[12px] drop-shadow-md">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
   </footer>

   {/* --- Smaller Winning Page --- */}
   <AnimatePresence>
    {gameState === 'result' && winnerData && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
        <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white border-[4px] border-sky-400 rounded-[3rem] p-8 flex flex-col items-center shadow-2xl w-[280px]">
          <Trophy className="text-yellow-500 w-12 h-12 mb-2 animate-bounce" />
          <div className="text-7xl mb-4 drop-shadow-xl">{winnerData.emoji}</div>
          {winnerData.win > 0 ? (
            <div className="text-center">
              <p className="text-green-500 font-black text-xl uppercase tracking-tighter">WINNER!</p>
              <p className="text-4xl font-black text-gray-800">+{winnerData.win.toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-gray-400 font-black text-xl italic uppercase">Next Luck!</p>
          )}
        </motion.div>
      </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
