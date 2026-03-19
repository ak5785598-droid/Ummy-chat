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
  { id: 'turtle', emoji: '🐢', multiplier: 5, label: 'x5', pos: 'top', color: 'from-green-400 to-emerald-600', border: 'border-emerald-400' },
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top-right', color: 'from-blue-200 to-blue-400', border: 'border-blue-300' },
  { id: 'sheep', emoji: '🐑', multiplier: 5, label: 'x5', pos: 'right', color: 'from-slate-100 to-slate-300', border: 'border-white' },
  { id: 'fox', emoji: '🦊', multiplier: 5, label: 'x5', pos: 'bottom-right', color: 'from-orange-300 to-orange-500', border: 'border-orange-300' },
  { id: 'rhino', emoji: '🦏', multiplier: 10, label: 'x10', pos: 'bottom', color: 'from-slate-400 to-slate-600', border: 'border-slate-400' },
  { id: 'elephant', emoji: '🐘', multiplier: 15, label: 'x15', pos: 'bottom-left', color: 'from-blue-400 to-indigo-600', border: 'border-blue-400' },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'left', color: 'from-orange-400 to-red-600', border: 'border-orange-400' },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'top-left', color: 'from-yellow-400 to-orange-600', border: 'border-yellow-400' },
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
  { value: 100000000, label: '100M', color: 'bg-cyan-500' },
];

export default function WildPartyPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
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
    const timer = setTimeout(() => setIsLaunching(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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

  const startSpin = async () => {
    setGameState('spinning');
    
    let winningId = ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id;
    
    if (firestore) {
      try {
        const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'wild-party'));
        if (oracleSnap.exists() && oracleSnap.data().isActive) {
          const forced = oracleSnap.data().forcedResult;
          if (ANIMALS.some(a => a.id === forced)) winningId = forced;
          updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'wild-party'), { isActive: false });
        }
      } catch (e) {}
    }

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
        gameId: 'wild-party',
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
      setTimeLeft(15);
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
    return (
      <div className="h-screen w-full bg-[#0a2e0a] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="text-8xl animate-bounce">🦁</div>
        <h1 className="text-6xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-2xl">Wild Party</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Entering the Jungle...</p>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#051a05] flex flex-col relative overflow-hidden font-headline text-white">
        <CompactRoomView />

        <div className="absolute inset-0 z-0">
           {gameData?.backgroundUrl ? (
             <Image key={gameData.backgroundUrl} src={gameData.backgroundUrl} alt="Jungle Theme" fill className="object-cover opacity-60 animate-in fade-in duration-1000" unoptimized />
           ) : (
             <>
               <div className="absolute inset-0 bg-gradient-to-b from-[#0a2e0a] via-[#051a05] to-[#000000]" />
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
             </>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#051a05] via-transparent to-transparent opacity-80" />
        </div>

        {gameState === 'result' && (
          <GameResultOverlay 
            gameId="wild-party"
            winningSymbol={winningSymbol} 
            winAmount={totalWinAmount} 
          />
        )}

        <div className="relative z-50 flex items-center justify-between p-4 pt-32">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-yellow-50 p-2 rounded-full text-black shadow-lg active:scale-90 transition-transform"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-yellow-500 p-2 rounded-full text-black shadow-lg">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
           </div>
           <h1 className="text-2xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-md">Wild Party</h1>
           <div className="flex gap-2">
              <button className="bg-yellow-500 p-2 rounded-full text-black shadow-lg"><HelpCircle className="h-5 w-5" /></button>
              <button onClick={() => router.back()} className="bg-yellow-500 p-2 rounded-full text-black shadow-lg"><X className="h-5 w-5" /></button>
           </div>
        </div>

        <div className="relative z-50 px-4 py-2">
           <div className="bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {history.map((id, i) => (
                <div key={i} className="relative shrink-0">
                   <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center text-xl shadow-inner">
                      {id === 'lion' ? '🦁' : ANIMALS.find(a => a.id === id)?.emoji}
                   </div>
                   {i === 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-[6px] font-black px-1 rounded-full animate-pulse">NEW</div>}
                </div>
              ))}
           </div>
        </div>

        <main className="flex-1 relative z-10 flex flex-col items-center justify-center py-6 px-4">
           <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
              
              <div className="relative z-20 w-32 h-32 bg-gradient-to-b from-[#2d1a12] to-[#1a0a2e] rounded-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center border-4 border-[#b88a44] p-2 text-center overflow-hidden">
                 <p className="text-[8px] font-black uppercase text-yellow-500/60 leading-tight tracking-[0.2em] mb-1">
                    {gameState === 'betting' ? 'BETTING' : 'SPINNING'}
                 </p>
                 <span className={cn(
                   "text-5xl font-black italic tracking-tighter transition-all duration-500",
                   gameState === 'betting' ? "text-white" : "text-yellow-400 animate-reaction-heartbeat"
                 )}>
                    {gameState === 'betting' ? timeLeft : '🎲'}
                 </span>
              </div>

              {ANIMALS.map((animal, idx) => {
                const isActive = highlightIdx === idx;
                const betOnThis = myBets[animal.id] || 0;

                return (
                  <button 
                    key={animal.id}
                    onClick={() => handlePlaceBet(animal.id)}
                    disabled={gameState !== 'betting'}
                    className={cn(
                      "absolute transition-all duration-300 flex flex-col items-center group pointer-events-auto",
                      animal.pos === 'top' && "top-0",
                      animal.pos === 'top-right' && "top-[12%] right-[12%]",
                      animal.pos === 'right' && "right-0",
                      animal.pos === 'bottom-right' && "bottom-[12%] right-[12%]",
                      animal.pos === 'bottom' && "bottom-0",
                      animal.pos === 'bottom-left' && "bottom-[12%] left-[12%]",
                      animal.pos === 'left' && "left-0",
                      animal.pos === 'top-left' && "top-[12%] left-[12%]",
                      isActive && "z-30 brightness-125 scale-110"
                    )}
                  >
                     <div className="relative">
                        <div className={cn(
                          "h-24 w-24 rounded-[1.5rem] flex flex-col items-center justify-center transition-all border-[3px] relative overflow-hidden shadow-xl",
                          isActive ? "border-white bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_30px_#facc15]" : `bg-gradient-to-br ${animal.color} ${animal.border}`
                        )}>
                           <span className="text-5xl drop-shadow-lg relative z-10">
                              {animal.id === 'lion' ? '🦁' : animal.emoji}
                           </span>
                           <span className="text-[10px] font-black text-white/80 uppercase mt-1 leading-none tracking-widest relative z-10">
                              {animal.label}
                           </span>
                           <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" />
                        </div>
                        
                        {betOnThis > 0 && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-40 animate-in zoom-in duration-300">
                             <div className="bg-gradient-to-r from-[#d946ef] to-[#9333ea] px-4 py-1 rounded-full border border-white/40 shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-[9px] font-black text-white uppercase italic leading-none">Bet</span>
                                <div className="flex items-center gap-0.5">
                                   <GoldCoinIcon className="h-3 w-3 text-yellow-400" />
                                   <span className="text-[10px] font-black text-white italic leading-none">{betOnThis.toLocaleString()}</span>
                                </div>
                             </div>
                          </div>
                        )}

                        {isActive && gameState === 'result' && (
                          <div className="absolute inset-0 border-4 border-yellow-400 rounded-[1.5rem] animate-ping" />
                        )}
                     </div>
                  </button>
                );
              })}
           </div>
        </main>

        <footer className="relative z-50 p-4 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent -mt-12">
           <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10 shadow-lg">
                    <GoldCoinIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-lg font-black text-yellow-500 italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 </div>
                 <button className="bg-black/60 p-2.5 rounded-full border border-white/10 text-yellow-500 shadow-xl">
                    <Users className="h-6 w-6" />
                 </button>
              </div>

              <div className="bg-[#2d1a12] p-3 rounded-[2.5rem] border-4 border-[#5d4037] shadow-2xl flex items-center justify-between gap-3 overflow-hidden relative">
                 <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar relative z-10">
                    {CHIPS.map(chip => (
                      <button 
                        key={chip.value} 
                        onClick={() => setSelectedChip(chip.value)} 
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center transition-all border-4 shrink-0 shadow-xl relative",
                          selectedChip === chip.value ? "border-white scale-110 z-10 ring-4 ring-white/20" : "border-black/20 opacity-60 grayscale-[0.2]",
                          chip.color
                        )}
                      >
                         <span className="text-[10px] font-black text-white italic drop-shadow-md">{chip.label}</span>
                      </button>
                    ))}
                 </div>
                 <button 
                   onClick={handleRepeat} 
                   className="relative z-10 bg-gradient-to-b from-orange-400 to-red-600 px-8 h-12 rounded-full font-black uppercase italic text-xs shadow-xl active:scale-90 transition-all border-2 border-white/30"
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
    </AppLayout>
  );
}
