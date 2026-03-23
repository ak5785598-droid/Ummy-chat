'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Trophy, 
  Users, 
  X
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameResultOverlay } from '@/components/game-result-overlay';
import Image from 'next/image';

const ANIMALS = [
  { id: 'panda', emoji: '🐼', multiplier: 5, label: 'x5', pos: 'top', color: 'from-green-400 to-emerald-600', border: 'border-emerald-400' },
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top-right', color: 'from-blue-200 to-blue-400', border: 'border-blue-300' },
  { id: 'cow', emoji: '🐮', multiplier: 5, label: 'x5', pos: 'right', color: 'from-slate-100 to-slate-300', border: 'border-white' },
  { id: 'dog', emoji: '🐶', multiplier: 5, label: 'x5', pos: 'bottom-right', color: 'from-orange-300 to-orange-500', border: 'border-orange-300' },
  { id: 'fox', emoji: '🦊', multiplier: 10, label: 'x10', pos: 'bottom', color: 'from-slate-400 to-slate-600', border: 'border-slate-400' },
  { id: 'beer', emoji: '🐻', multiplier: 15, label: 'x15', pos: 'bottom-left', color: 'from-blue-400 to-indigo-600', border: 'border-blue-400' },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'top-left', color: 'from-orange-400 to-orange-600', border: 'border-orange-400' },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'left', color: 'from-yellow-400 to-red-600', border: 'border-yellow-400' },
];

const CHIPS = [
  { value: 100, label: '100', color: 'bg-blue-500' },
  { value: 1000, label: '1K', color: 'bg-green-500' },
  { value: 5000, label: '5K', color: 'bg-yellow-500' },
  { value: 50000, label: '50K', color: 'bg-orange-500' },
  { value: 100000, label: '100K', color: 'bg-red-500' },
  { value: 300000, label: '300K', color: 'bg-pink-500' },
  { value: 1000000, label: '1M', color: 'bg-purple-500' },
  { value: 10000000, label: '10M', color: 'bg-indigo-500' },
  { value: 100000000, label: '100M', color: 'bg-violate-500' },
];

export default function WildPartyPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [lastBets, setLastBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winningSymbol, setWinningSymbol] = useState<string>('');
  const [totalWinAmount, setTotalWinAmount] = useState(0);

  const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'forest-party'), [firestore]);
  const { data: gameData } = useDoc(gameDocRef);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBetSound = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, [isMuted, initAudioContext]);

  const playTickSound = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, [isMuted, initAudioContext]);

  useEffect(() => {
  if (isLaunching) return;

  const interval = setInterval(() => {
    setTimeLeft((prev) => {
      if (gameState !== 'betting') return prev;

      if (prev <= 1) {
        clearInterval(interval);
        startSpin();
        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [gameState, isLaunching]);

  const startSpin = async () => {
  setGameState('spinning');

  let winningId = ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id;

  const targetIdx = ANIMALS.findIndex(a => a.id === winningId);

  let currentStep = 0;
  const totalSteps = (ANIMALS.length * 4) + targetIdx;
  let speed = 50;

  const runChase = () => {
    setHighlightIdx(currentStep % ANIMALS.length);
    playTickSound();

    currentStep++;

    if (currentStep <= totalSteps) {
      const remaining = totalSteps - currentStep;

      if (remaining < 12) speed += 20;
      if (remaining < 6) speed += 40;

      setTimeout(runChase, speed);
    } else {
      setTimeout(() => showResult(winningId), 800);
    }
  };

  runChase();
};

  const showResult = (id: string) => {
    setHistory(prev => [id, ...prev].slice(0, 15));
    const winItem = ANIMALS.find(i => i.id === id);
    const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);

    setWinningSymbol(winItem?.emoji || '🏆');
    setTotalWinAmount(winAmount);
    setGameState('result');

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      const updateData = { 
        'wallet.coins': increment(winAmount), 
        'stats.dailyGameWins': increment(winAmount),
        'stats.weeklyGameWins': increment(winAmount),
        'stats.monthlyGameWins': increment(winAmount),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

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
      setLastBets(myBets);
      setMyBets({});
      setHighlightIdx(null);
      setGameState('betting');
      setTimeLeft(20);
    }, 5000);
  };

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || !currentUser || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < selectedChip) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }
    
    playBetSound();
    const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const handleRepeat = () => {
    if (gameState !== 'betting' || !currentUser || !userProfile) return;
    const totalCost = Object.values(lastBets).reduce((a, b) => a + b, 0);
    if (totalCost === 0) return;
    if ((userProfile.wallet?.coins || 0) < totalCost) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    playBetSound();
    const updateData = { 'wallet.coins': increment(-totalCost), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    setMyBets(lastBets);
  };

  if (isLaunching) {
    const loadingBg = (gameData as any)?.loadingBackgroundUrl;
    return (
      <div 
        className="h-screen w-full bg-[#0a2e0a] flex flex-col items-center justify-center space-y-6 font-headline relative overflow-hidden"
        style={loadingBg ? { backgroundImage: `url(${loadingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {loadingBg && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
           <div className="text-8xl animate-bounce">🦁</div>
           <h1 className="text-6xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-2xl">Wild Party</h1>
           <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Entering the Jungle...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#051a05] flex flex-col relative overflow-hidden font-headline text-white">
        <CompactRoomView />

        <div className="absolute inset-0 z-0">
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Coins, Trophy } from 'lucide-react';

// --- Utilities ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Constants ---
const ANIMALS = [
  { id: 'lion', label: 'Lion', emoji: '🦁', pos: 'top', color: 'from-orange-400 to-red-600', border: 'border-orange-200' },
  { id: 'tiger', label: 'Tiger', emoji: '🐯', pos: 'top-right', color: 'from-yellow-400 to-orange-500', border: 'border-yellow-200' },
  { id: 'panda', label: 'Panda', emoji: '🐼', pos: 'right', color: 'from-gray-100 to-gray-400', border: 'border-gray-200' },
  { id: 'dragon', label: 'Dragon', emoji: '🐲', pos: 'bottom-right', color: 'from-green-400 to-emerald-700', border: 'border-green-200' },
  { id: 'rabbit', label: 'Rabbit', emoji: '🐰', pos: 'bottom', color: 'from-pink-300 to-rose-500', border: 'border-pink-100' },
  { id: 'monkey', label: 'Monkey', emoji: '🐵', pos: 'bottom-left', color: 'from-amber-600 to-yellow-800', border: 'border-amber-200' },
  { id: 'snake', label: 'Snake', emoji: '🐍', pos: 'left', color: 'from-green-500 to-green-900', border: 'border-green-300' },
  { id: 'eagle', label: 'Eagle', emoji: '🦅', pos: 'top-left', color: 'from-blue-400 to-indigo-700', border: 'border-blue-200' },
];

const CHIPS = [
  { value: 10, label: '10', color: 'bg-blue-500' },
  { value: 50, label: '50', color: 'bg-purple-500' },
  { value: 100, label: '100', color: 'bg-red-500' },
  { value: 500, label: '500', color: 'bg-yellow-600' },
];

// --- Mock Icons ---
const GoldCoinIcon = ({ className }) => <Coins className={className} />;

export default function AnimalBettingGame() {
  // Game States: 'betting', 'spinning', 'result'
  const [gameState, setGameState] = useState('betting');
  const [timer, setTimer] = useState(10);
  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState({}); // { lion: 100, panda: 50 }
  const [winningAnimal, setWinningAnimal] = useState(null);
  const [wallet, setWallet] = useState(10000);
  const [lastBets, setLastBets] = useState({});

  // 1. Timer Logic
  useEffect(() => {
    let interval;
    if (gameState === 'betting' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && gameState === 'betting') {
      startSpin();
    }
    return () => clearInterval(interval);
  }, [timer, gameState]);

  // 2. Start Spin Logic
  const startSpin = () => {
    setGameState('spinning');
    // Simulate a 3-second spin
    setTimeout(() => {
      const winner = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      setWinningAnimal(winner.id);
      setGameState('result');
      
      // Calculate Winnings (Simple 8x multiplier for demo)
      const userBet = bets[winner.id] || 0;
      if (userBet > 0) {
        setWallet(prev => prev + (userBet * 8));
      }

      // Reset game after showing result
      setTimeout(() => {
        setLastBets(bets);
        setBets({});
        setWinningAnimal(null);
        setTimer(10);
        setGameState('betting');
      }, 4000);
    }, 3000);
  };

  const handleBet = (animalId) => {
    if (gameState !== 'betting') return;
    if (wallet < selectedChip) return alert("Not enough coins!");

    setWallet(prev => prev - selectedChip);
    setBets(prev => ({
      ...prev,
      [animalId]: (prev[animalId] || 0) + selectedChip
    }));
  };

  const handleRepeat = () => {
    if (gameState !== 'betting' || Object.keys(lastBets).length === 0) return;
    const totalNeeded = Object.values(lastBets).reduce((a, b) => a + b, 0);
    if (wallet < totalNeeded) return alert("Not enough coins to repeat!");
    
    setWallet(prev => prev - totalNeeded);
    setBets(lastBets);
  };

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center z-50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-tighter">Status</span>
          <span className="text-xl font-black italic uppercase text-white drop-shadow-md">
            {gameState === 'betting' ? `Place Bets: ${timer}s` : gameState === 'spinning' ? 'Spinning...' : 'Winner!'}
          </span>
        </div>
        <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Trophy className="text-yellow-400 h-5 w-5" />
          <span className="font-black text-white italic tracking-widest">RANK 12</span>
        </div>
      </header>

      {/* Main Game Board */}
      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="relative w-full max-w-[340px] aspect-square">
          
          {/* Central Spin Area */}
          <div className="absolute inset-0 m-auto w-32 h-32 z-20 flex items-center justify-center">
            <div className={cn(
              "absolute inset-0 rounded-full border-8 border-dashed border-yellow-500/30",
              gameState === 'spinning' && "animate-spin"
            )} />
            <div className="bg-gradient-to-b from-[#4e342e] to-[#2d1a12] w-24 h-24 rounded-full border-4 border-[#8d6e63] shadow-2xl flex items-center justify-center">
               {gameState === 'spinning' ? (
                 <div className="text-4xl animate-bounce">🎰</div>
               ) : winningAnimal ? (
                 <span className="text-5xl animate-in zoom-in">{ANIMALS.find(a => a.id === winningAnimal)?.emoji}</span>
               ) : (
                 <span className="text-2xl font-black text-yellow-500 italic">GO!</span>
               )}
            </div>
          </div>

          {/* Animal Buttons */}
          <div className="absolute inset-0">
            {ANIMALS.map((animal) => {
              const isActive = winningAnimal === animal.id;
              const betOnThis = bets[animal.id] || 0;

              return (
                <button
                  key={animal.id}
                  onClick={() => handleBet(animal.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "absolute transition-all duration-300 transform",
                    animal.pos === 'top' && "top-0 left-1/2 -translate-x-1/2",
                    animal.pos === 'top-right' && "top-[8%] right-[8%]",
                    animal.pos === 'right' && "right-0 top-1/2 -translate-y-1/2",
                    animal.pos === 'bottom-right' && "bottom-[8%] right-[8%]",
                    animal.pos === 'bottom' && "bottom-0 left-1/2 -translate-x-1/2",
                    animal.pos === 'bottom-left' && "bottom-[8%] left-[8%]",
                    animal.pos === 'left' && "left-0 top-1/2 -translate-y-1/2",
                    animal.pos === 'top-left' && "top-[8%] left-[8%]",
                    isActive && "z-30 brightness-125 scale-125"
                  )}
                >
                  <div className="relative">
                    <div className={cn(
                      "h-16 w-16 md:h-20 md:w-20 rounded-[1.25rem] flex flex-col items-center justify-center transition-all border-[3px] relative overflow-hidden shadow-xl",
                      isActive ? "border-white bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_30px_#facc15]" : `bg-gradient-to-br ${animal.color} ${animal.border}`
                    )}>
                      <span className="text-3xl md:text-4xl drop-shadow-lg relative z-10">{animal.emoji}</span>
                      <span className="text-[8px] font-black text-white/80 uppercase mt-1 leading-none z-10">{animal.label}</span>
                      <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" />
                    </div>
                    
                    {betOnThis > 0 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 animate-in zoom-in">
                        <div className="bg-gradient-to-r from-[#d946ef] to-[#9333ea] px-3 py-0.5 rounded-full border border-white/40 shadow-xl flex items-center gap-1">
                          <GoldCoinIcon className="h-2 w-2 text-yellow-400" />
                          <span className="text-[9px] font-black text-white">{betOnThis}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="p-4 bg-gradient-to-t from-black to-transparent">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10">
              <GoldCoinIcon className="h-5 w-5 text-yellow-400" />
              <span className="text-lg font-black text-yellow-500 italic">{wallet.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-[#2d1a12] p-3 rounded-[2.5rem] border-4 border-[#5d4037] flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {CHIPS.map(chip => (
                <button 
                  key={chip.value} 
                  onClick={() => setSelectedChip(chip.value)} 
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-all border-4 shrink-0 shadow-xl",
                    selectedChip === chip.value ? "border-white scale-110 ring-2 ring-white/20" : "border-black/20 opacity-60",
                    chip.color
                  )}
                >
                  <span className="text-[10px] font-black text-white italic">{chip.label}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={handleRepeat}
              className="bg-gradient-to-b from-orange-400 to-red-600 px-6 h-12 rounded-full font-black uppercase text-xs shadow-xl active:scale-95 transition-all"
            >
              Repeat
            </button>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes shine { 
          0% { transform: translateX(-200%) skewX(-30deg); } 
          100% { transform: translateX(200%) skewX(-30deg); } 
        }
        .animate-shine { animation: shine 3s infinite linear; }
      `}</style>
    </div>
  );
}
