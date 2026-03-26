'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  X,
  Volume2,
  VolumeX,
  HelpCircle,
  BarChart2,
  Trophy,
  Maximize2,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const ITEMS = [
  { id: 'strawberry', emoji: '🍓', multiplier: 5, label: 'Win 5 times', pos: 'top' },
  { id: 'bananas', emoji: '🍌', multiplier: 5, label: 'Win 5 times', pos: 'top-right' },
  { id: 'oranges', emoji: '🍊', multiplier: 5, label: 'Win 5 times', pos: 'right' },
  { id: 'watermelon', emoji: '🍉', multiplier: 5, label: 'Win 5 times', pos: 'bottom-right' },
  { id: 'pizza', emoji: '🍕', multiplier: 10, label: 'Win 10 times', pos: 'bottom' },
  { id: 'burrito', emoji: '🌯', multiplier: 15, label: 'Win 15 times', pos: 'bottom-left' },
  { id: 'skewers', emoji: '🍢', multiplier: 25, label: 'Win 25 times', pos: 'left' },
  { id: 'chicken', emoji: '🍗', multiplier: 45, label: 'Win 45 times', pos: 'top-left' },
];

const CHIPS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 100, label: '100' },
  { value: 1000, label: '1K' },
  { value: 5000, label: '5K' },
];

export default function FruitPartyPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(10);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [lastBets, setLastBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(['watermelon', 'skewers', 'pizza', 'pizza', 'strawberry', 'oranges', 'oranges']);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);

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
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05);
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
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
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

  const startSpin = () => {
    setGameState('spinning');
    const targetIdx = Math.floor(Math.random() * ITEMS.length);
    
    let currentStep = 0;
    const totalSteps = 32 + targetIdx;
    let speed = 50;

    const runChase = () => {
      setHighlightIdx(currentStep % ITEMS.length);
      playTickSound();
      currentStep++;
      if (currentStep < totalSteps) {
        if (totalSteps - currentStep < 10) speed += 30;
        setTimeout(runChase, speed);
      } else {
        setTimeout(() => showResult(ITEMS[targetIdx].id), 800);
      }
    };
    runChase();
  };

  const showResult = (id: string) => {
    setHistory(prev => [id, ...prev].slice(0, 15));
    const winItem = ITEMS.find(i => i.id === id);
    const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);

    const sessionWinners = [];
    if (winAmount > 0 && userProfile) {
      sessionWinners.push({ name: userProfile.username, win: winAmount, avatar: userProfile.avatarUrl, isMe: true });
    }

    setWinners(sessionWinners);
    setGameState('result');

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      const updateData = { 
        'wallet.coins': increment(winAmount), 
        'stats.dailyGameWins': increment(winAmount),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setTimeout(() => {
      setLastBets(myBets);
      setMyBets({});
      setWinners([]);
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
      <div className="h-screen w-full bg-[#311b92] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="text-8xl animate-bounce">🎡</div>
        <h1 className="text-6xl font-black text-yellow-400 uppercase italic tracking-tighter drop-shadow-2xl">Fruit Party</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Syncing Wheel...</p>
      </div>
    );
  }

  const specialChicken = PlaceHolderImages.find(img => img.id === 'fruit-party-special-chicken');

  return (
    <AppLayout>
      <div className="h-[100dvh] w-full bg-[#58319d] flex flex-col relative overflow-hidden font-headline text-white">
        <CompactRoomView />

        {gameState === 'result' && winners.length > 0 && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-500 p-6">
             <div className="relative mb-12 flex flex-col items-center gap-4">
                <Trophy className="h-20 w-20 text-yellow-400 animate-bounce" />
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter text-center">Tribe Winners</h2>
             </div>
             
             <div className="flex items-end justify-center gap-4 w-full max-w-lg">
                {winners.map((winner, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-20 duration-700">
                     <Avatar className={cn("border-4 shadow-xl h-24 w-24 border-yellow-400")}>
                        <AvatarImage src={winner.avatar}/><AvatarFallback>W</AvatarFallback>
                     </Avatar>
                     <div className="bg-yellow-500/20 border-x-2 border-t-2 border-yellow-400 w-32 h-32 rounded-t-3xl flex flex-col items-center justify-center">
                        <span className="text-3xl">🥇</span>
                        <p className="text-[10px] font-black text-white uppercase truncate px-2">{winner.name}</p>
                        <p className="text-lg font-black text-yellow-500">+{winner.win.toLocaleString()}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-b from-[#58319d] to-[#311b92]" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/mandala.png')] opacity-10" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/5 to-transparent" />
        </div>

        <div className="relative z-50 flex items-center justify-between p-4 pt-32">
           <div className="flex gap-1">
              <button className="bg-white/10 p-1.5 rounded-full"><Maximize2 className="h-4 w-4" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-1.5 rounded-full">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button className="bg-white/10 p-1.5 rounded-full"><HelpCircle className="h-4 w-4" /></button>
              <button className="bg-white/10 p-1.5 rounded-full"><BarChart2 className="h-4 w-4" /></button>
           </div>
           <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Fruit Party</h1>
           <div className="flex gap-1">
              <button className="bg-white/10 p-1.5 rounded-full"><MoreHorizontal className="h-4 w-4" /></button>
              <button className="bg-white/10 p-1.5 rounded-full"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full"><X className="h-4 w-4" /></button>
           </div>
        </div>

        <div className="absolute top-44 left-4 z-40 opacity-80 animate-in slide-in-from-left-4 duration-1000">
           <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 p-2">
              {specialChicken && (
                <img 
                  src={specialChicken.imageUrl} 
                  alt={specialChicken.description} 
                  className="object-contain" 
                  data-ai-hint={specialChicken.imageHint} 
                />
              )}
           </div>
        </div>
        <div className="absolute top-44 right-4 z-40 opacity-80 animate-in slide-in-from-right-4 duration-1000">
           <div className="relative h-20 w-20 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center gap-0.5 shadow-xl backdrop-blur-sm">
              <span className="text-xl">🍊</span>
              <span className="text-xl">🍉</span>
              <span className="text-xl">🍌</span>
              <span className="text-xl">🍓</span>
           </div>
        </div>

        <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4">
           <div className="relative w-full max-sm aspect-square flex items-center justify-center">
              <div className="absolute inset-0 border-[6px] border-white/10 rounded-full m-12" />
              
              <div className="relative z-20 w-36 h-36 bg-[#4c1d95] rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center border-[6px] border-[#7c3aed] p-4 text-center">
                 <span className="text-7xl font-black text-yellow-400 italic leading-none drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                    {gameState === 'betting' ? timeLeft : '🎲'}
                 </span>
                 <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest mt-1">
                    {gameState === 'betting' ? 'waiting...' : 'Spinning'}
                 </p>
              </div>

              {ITEMS.map((item, idx) => (
                <button 
                  key={item.id}
                  onClick={() => handlePlaceBet(item.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "absolute transition-all duration-300 flex flex-col items-center group active:scale-95",
                    item.pos === 'top' && "top-0",
                    item.pos === 'top-right' && "top-[12%] right-[12%]",
                    item.pos === 'right' && "right-0",
                    item.pos === 'bottom-right' && "bottom-[12%] right-[12%]",
                    item.pos === 'bottom' && "bottom-0",
                    item.pos === 'bottom-left' && "bottom-[12%] left-[12%]",
                    item.pos === 'left' && "left-0",
                    item.pos === 'top-left' && "top-[12%] left-[12%]",
                    highlightIdx === idx && "scale-110 z-30 drop-shadow-[0_0_20px_#facc15]"
                  )}
                >
                   <div className={cn(
                     "h-24 w-24 rounded-2xl flex flex-col items-center justify-center p-1 transition-all border-2",
                     highlightIdx === idx ? "bg-[#7c3aed] border-yellow-400" : "bg-black/30 border-white/5 group-hover:bg-black/40"
                   )}>
                      <span className="text-5xl drop-shadow-md">{item.emoji}</span>
                      <span className="text-[8px] font-black text-white/60 uppercase mt-1 leading-tight">{item.label}</span>
                   </div>
                   {myBets[item.id] > 0 && (
                     <div className="mt-1 bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black text-[8px] shadow-lg animate-in zoom-in flex items-center gap-1">
                        <GoldCoinIcon className="h-2 w-2" />
                        {myBets[item.id]}
                     </div>
                   )}
                </button>
              ))}
           </div>
        </main>

        <footer className="relative z-50 p-4 pb-10 space-y-4">
           <div className="max-w-md mx-auto bg-[#7c3aed]/40 backdrop-blur-xl rounded-[2rem] p-4 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4 px-2">
                 <div className="bg-gradient-to-r from-[#ffd54f] to-[#ffca28] px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                    <GoldCoinIcon className="h-4 w-4" />
                    <span className="text-sm font-black text-black">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 </div>
                 <p className="text-[10px] font-black uppercase text-white/60 italic">Choose wager then food</p>
                 <button onClick={handleRepeat} className="bg-white/10 px-6 py-1.5 rounded-xl font-black uppercase text-xs hover:bg-white/20 active:scale-95 transition-all">Repeat</button>
              </div>
              <div className="flex justify-between gap-2">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value} 
                    onClick={() => setSelectedChip(chip.value)} 
                    className={cn(
                      "flex-1 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border-2 relative", 
                      selectedChip === chip.value ? "bg-white border-white text-[#7c3aed] scale-105 z-10 shadow-xl" : "bg-white/5 border-white/5 text-white/40"
                    )}
                   >
                      <GoldCoinIcon className={cn("h-5 w-5 mb-1", selectedChip === chip.value ? "text-[#7c3aed]" : "text-yellow-500")} />
                      <span className="text-sm font-black italic">{chip.label}</span>
                   </button>
                 ))}
              </div>
           </div>

           <div className="max-w-md mx-auto bg-black/40 backdrop-blur-md rounded-full border border-white/5 p-2 px-6 flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-tighter text-white/40 shrink-0">Winning History</span>
              <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar">
                 {history.map((id, i) => (
                   <div key={i} className="relative shrink-0 flex flex-col items-center">
                      <span className="text-2xl">{ITEMS.find(it => it.id === id)?.emoji}</span>
                      {i === 0 && <span className="absolute -bottom-1 bg-pink-500 text-[6px] px-1 rounded-full font-black animate-pulse">New</span>}
                   </div>
                 ))}
              </div>
           </div>
        </footer>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
