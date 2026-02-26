
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useUserProfile, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2,
  VolumeX,
  History,
  HelpCircle,
  Trophy,
  Users,
  RefreshCcw
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ANIMALS = [
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'top-left' },
  { id: 'turtle', emoji: '🐢', multiplier: 5, label: 'x5', pos: 'top' },
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top-right' },
  { id: 'sheep', emoji: '🐑', multiplier: 5, label: 'x5', pos: 'right' },
  { id: 'fox', emoji: '🦊', multiplier: 5, label: 'x5', pos: 'bottom-right' },
  { id: 'rhino', emoji: '🦏', multiplier: 10, label: 'x10', pos: 'bottom' },
  { id: 'elephant', emoji: '🐘', multiplier: 15, label: 'x15', pos: 'bottom-left' },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'left' },
];

const CHIPS = [
  { value: 10, label: '10', color: 'bg-blue-500' },
  { value: 100, label: '100', color: 'bg-green-500' },
  { value: 1000, label: '1K', color: 'bg-yellow-500' },
  { value: 10000, label: '10K', color: 'bg-red-500' },
  { value: 100000, label: '100K', color: 'bg-purple-500' },
];

export default function WildPartyPage() {
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
  const [history, setHistory] = useState<string[]>([]);
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
    const targetIdx = Math.floor(Math.random() * ANIMALS.length);
    
    let currentStep = 0;
    const totalSteps = 32 + targetIdx;
    let speed = 50;

    const runChase = () => {
      setHighlightIdx(currentStep % ANIMALS.length);
      currentStep++;
      if (currentStep < totalSteps) {
        if (totalSteps - currentStep < 10) speed += 30;
        setTimeout(runChase, speed);
      } else {
        setTimeout(() => showResult(ANIMALS[targetIdx].id), 800);
      }
    };
    runChase();
  };

  const showResult = (id: string) => {
    setHistory(prev => [id, ...prev].slice(0, 15));
    const winItem = ANIMALS.find(i => i.id === id);
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
    
    initAudioContext();
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
      <div className="h-screen w-full bg-[#1a3a1a] flex flex-col relative overflow-hidden font-headline text-white">
        <CompactRoomView />

        {/* Deep Forest Background */}
        <div className="absolute inset-0 z-0">
           <img 
             src="https://picsum.photos/seed/forest-ruins/1200/2400" 
             className="h-full w-full object-cover opacity-40 scale-110" 
             alt="Wild Forest" 
             data-ai-hint="deep forest"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
           <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] animate-pulse" />
        </div>

        {/* Top Navigation */}
        <div className="relative z-50 flex items-center justify-between p-4 pt-32">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-yellow-500 p-2 rounded-full text-black shadow-lg"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-yellow-500 p-2 rounded-full text-black shadow-lg">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
           </div>
           <h1 className="text-2xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-md">Wild Party</h1>
           <div className="flex gap-2">
              <button className="bg-yellow-500 p-2 rounded-full text-black shadow-lg"><HelpCircle className="h-5 w-5" /></button>
              <button className="bg-yellow-500 p-2 rounded-full text-black shadow-lg"><Trophy className="h-5 w-5" /></button>
              <button className="bg-yellow-500 p-2 rounded-full text-black shadow-lg"><History className="h-5 w-5" /></button>
           </div>
        </div>

        {/* History Line */}
        <div className="relative z-50 px-4 py-2">
           <div className="bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {history.map((id, i) => (
                <div key={i} className="relative shrink-0">
                   <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center text-xl shadow-inner">
                      {ANIMALS.find(a => a.id === id)?.emoji}
                   </div>
                   {i === 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-[6px] font-black px-1 rounded-full animate-pulse">NEW</div>}
                </div>
              ))}
           </div>
        </div>

        {/* Octagonal Betting Area */}
        <main className="flex-1 relative z-10 flex flex-col items-center justify-center py-10 px-4">
           
           <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              
              {/* Central Status */}
              <div className="relative z-20 w-40 h-40 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-white/20 p-4 text-center">
                 <p className="text-[10px] font-black uppercase text-black/60 leading-tight">
                    {gameState === 'betting' ? 'Select Animal now' : 'Spinning...'}
                 </p>
                 <span className="text-5xl font-black text-black italic tracking-tighter animate-in zoom-in">
                    {gameState === 'betting' ? `${timeLeft}s` : '🎲'}
                 </span>
              </div>

              {/* Animal Tiles Grid */}
              {ANIMALS.map((animal, idx) => (
                <button 
                  key={animal.id}
                  onClick={() => handlePlaceBet(animal.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "absolute transition-all duration-300 flex flex-col items-center group active:scale-90",
                    animal.pos === 'top' && "top-0",
                    animal.pos === 'top-right' && "top-[10%] right-[10%]",
                    animal.pos === 'right' && "right-0",
                    animal.pos === 'bottom-right' && "bottom-[10%] right-[10%]",
                    animal.pos === 'bottom' && "bottom-0",
                    animal.pos === 'bottom-left' && "bottom-[10%] left-[10%]",
                    animal.pos === 'left' && "left-0",
                    animal.pos === 'top-left' && "top-[10%] left-[10%]",
                    highlightIdx === idx && "scale-125 z-30 drop-shadow-[0_0_20px_#fbbf24]"
                  )}
                >
                   <div className="relative">
                      <div className={cn(
                        "h-20 w-20 rounded-3xl flex items-center justify-center text-5xl transition-all border-2",
                        highlightIdx === idx ? "bg-yellow-500 border-white shadow-xl" : "bg-black/40 border-white/10 group-hover:bg-black/60"
                      )}>
                         {animal.emoji}
                      </div>
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-lg border border-white/20">
                         {animal.label}
                      </div>
                   </div>
                   <div className="mt-1 bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/60">Total <span className="text-yellow-500">{myBets[animal.id] || 0}</span></p>
                   </div>
                </button>
              ))}
           </div>

        </main>

        {/* Bottom Bar */}
        <footer className="relative z-50 p-4 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent">
           <div className="max-w-md mx-auto space-y-4">
              
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10">
                    <GoldCoinIcon className="h-5 w-5" />
                    <span className="text-lg font-black text-yellow-500 italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 </div>
                 <button className="bg-black/60 p-2 rounded-full border border-white/10 text-yellow-500">
                    <Users className="h-6 w-6" />
                 </button>
              </div>

              <div className="bg-[#3d2b1f] p-3 rounded-[2.5rem] border-4 border-[#5d4037] shadow-2xl flex items-center justify-between gap-2 overflow-hidden">
                 <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar">
                    {CHIPS.map(chip => (
                      <button 
                        key={chip.value} 
                        onClick={() => setSelectedChip(chip.value)}
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center transition-all border-4 shrink-0 shadow-lg relative",
                          selectedChip === chip.value ? "border-white scale-110 z-10" : "border-black/20 opacity-60",
                          chip.color
                        )}
                      >
                         <span className="text-[10px] font-black text-white italic drop-shadow-md">{chip.label}</span>
                         {selectedChip === chip.value && <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />}
                      </button>
                    ))}
                 </div>
                 <button 
                   onClick={handleRepeat}
                   className="bg-gradient-to-b from-orange-400 to-orange-600 px-6 h-12 rounded-full font-black uppercase italic text-xs shadow-xl shadow-orange-500/20 active:scale-90 transition-all border-2 border-white/20"
                 >
                    Repeat
                 </button>
              </div>

           </div>
        </footer>

        {/* Result Overlay */}
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

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </AppLayout>
  );
}
