'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useUserProfile, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2,
  VolumeX,
  History,
  X,
  Trophy,
  Loader,
  HelpCircle,
  BarChart2,
  Maximize2,
  Settings,
  RefreshCcw
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';

const CHIPS = [
  { value: 5, color: 'bg-[#00E676]' }, // Green
  { value: 10, color: 'bg-[#2979FF]' }, // Blue
  { value: 100, color: 'bg-[#FFD600]' }, // Yellow
  { value: 1000, color: 'bg-[#FF9100]' }, // Orange
  { value: 5000, color: 'bg-[#FF1744]' }, // Red
];

const DRAGONS = [
  { id: 'A', name: 'Jade Dragon', emoji: '🐲', color: '#4ade80', image: 'https://picsum.photos/seed/drag-jade/400/400' },
  { id: 'B', name: 'Ruby Dragon', emoji: '🐉', color: '#f87171', image: 'https://picsum.photos/seed/drag-ruby/400/400' },
  { id: 'C', name: 'Azure Dragon', emoji: '🦕', color: '#60a5fa', image: 'https://picsum.photos/seed/drag-azure/400/400' },
];

export default function TeenPattiPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'calculating' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(18);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
  const [totalPots, setTotalPots] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const playBetSound = useCallback(() => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  }, [isMuted]);

  useEffect(() => {
    if (isMuted || isLaunching) return;
    let audioCtx: AudioContext | null = null;
    let timer: any = null;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 1.0; // FULL VOLUME AS REQUESTED
      masterGain.connect(audioCtx.destination);
      let step = 0;
      const scheduleNextNote = () => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        const frequencies = [146.83, 164.81, 174.61, 196.00]; // D3, E3, F3, G3
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequencies[step % 4], now);
        noteGain.gain.setValueAtTime(0.15, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.8);
        step++;
      };
      timer = setInterval(scheduleNextNote, 800);
    } catch (e) {}
    return () => {
      if (timer) clearInterval(timer);
      if (audioCtx) audioCtx.close();
    };
  }, [isMuted, isLaunching]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLaunching) return;
    const interval = setInterval(() => {
      if (gameState === 'betting') {
        if (timeLeft > 0) setTimeLeft(prev => prev - 1);
        else transitionToCalculation();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const transitionToCalculation = () => {
    setGameState('calculating');
    setTimeout(() => {
      const winId = DRAGONS[Math.floor(Math.random() * 3)].id;
      showResult(winId);
    }, 3000);
  };

  const showResult = (winId: string) => {
    setWinner(winId);
    setGameState('result');
    setHistory(prev => [winId, ...prev].slice(0, 10));
    
    const winAmount = (myBets[winId] || 0) * 2.92;
    if (winAmount > 0 && currentUser && firestore) {
      const updateData = { 'wallet.coins': increment(Math.floor(winAmount)), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setTimeout(() => {
      setMyBets({ A: 0, B: 0, C: 0 });
      setTotalPots({ A: 0, B: 0, C: 0 });
      setWinner(null);
      setGameState('betting');
      setTimeLeft(18);
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
    setTotalPots(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip + Math.floor(Math.random() * 500) }));
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0a05] flex flex-col items-center justify-center space-y-6">
        <div className="text-8xl animate-bounce">🐲</div>
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">Dragon Battle</h1>
        <p className="text-[#FFD600] uppercase font-black tracking-widest text-[10px] animate-pulse">Loading Elite Arena...</p>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#1a0a05] flex flex-col relative overflow-hidden font-headline animate-in fade-in duration-1000">
        <CompactRoomView />

        {/* Golden Vault Backdrop */}
        <div className="absolute inset-0 z-0">
           <img src="https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000" className="h-full w-full object-cover opacity-30 scale-110" alt="Vault" />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
           <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#FFD600]/10 to-transparent" />
        </div>

        <div className="flex-1 flex flex-col pt-32 pb-32 px-4 relative z-10 overflow-y-auto no-scrollbar">
           <header className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><Maximize2 className="h-4 w-4" /></button>
                 <button onClick={() => setIsMuted(!isMuted)} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><HelpCircle className="h-4 w-4" /></button>
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><BarChart2 className="h-4 w-4" /></button>
              </div>
              <h1 className="text-2xl font-black text-white italic drop-shadow-lg">Dragon Battle</h1>
              <div className="flex gap-1">
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><Settings className="h-4 w-4" /></button>
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><ChevronLeft className="h-4 w-4" /></button>
                 <button onClick={() => router.back()} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><X className="h-4 w-4" /></button>
              </div>
           </header>

           {/* Cards Layout & Multipliers */}
           <div className="grid grid-cols-3 gap-4 mb-6 px-2 animate-in slide-in-from-top-10 duration-700">
              {['A', 'B', 'C'].map((id) => (
                <div key={id} className="space-y-1 relative">
                   <div className="flex gap-0.5 justify-center">
                      {[1, 2, 3].map(c => (
                        <div key={c} className={cn("w-10 h-16 rounded-sm border-[1px] border-[#FFD600]/30 transition-all", winner === id ? "bg-[#FF1744] shadow-[0_0_15px_#FF1744] scale-110" : "bg-black/60 shadow-inner")}>
                           <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=400')] bg-cover bg-center opacity-40" />
                        </div>
                      ))}
                   </div>
                   <p className="text-center text-[10px] font-black text-[#FF1744] uppercase tracking-widest italic drop-shadow-md">2.92</p>
                   {id === 'B' && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                         <div className="h-12 w-12 rounded-full bg-[#FF1744] border-2 border-white/20 shadow-2xl flex items-center justify-center animate-pulse">
                            {gameState === 'betting' ? (
                              <span className="text-xl font-black text-white italic">{timeLeft}</span>
                            ) : (
                              <Loader className="h-6 w-6 text-white animate-spin" />
                            )}
                         </div>
                      </div>
                   )}
                </div>
              ))}
           </div>

           {/* Characters Section */}
           <div className="relative flex items-center justify-between px-2 mb-8">
              {DRAGONS.map((drag, i) => (
                <div key={drag.id} className={cn("flex flex-col items-center transition-all duration-500", winner === drag.id ? "scale-125 z-20" : "scale-100 z-10 opacity-90")}>
                   <span className="text-5xl font-serif text-[#FFD600] italic mb-2 drop-shadow-lg font-bold">{drag.id}</span>
                   <div className="relative group">
                      {winner === drag.id && <div className="absolute -inset-4 bg-[#FFD600]/20 rounded-full blur-2xl animate-pulse" />}
                      <img src={drag.image} className="h-32 w-32 object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" alt={drag.name} />
                   </div>
                </div>
              ))}
           </div>

           {/* Betting Pods - Dark Rectangles */}
           <div className="grid grid-cols-3 gap-3 px-2">
              {['A', 'B', 'C'].map((id) => (
                <button 
                  key={id}
                  onClick={() => handlePlaceBet(id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative h-32 rounded-3xl border-none transition-all overflow-hidden flex flex-col items-center justify-center p-2 bg-[#2D0B0B]/90 shadow-xl",
                    gameState === 'betting' ? "hover:scale-105 active:scale-95" : "opacity-60 grayscale-[0.5]",
                    winner === id ? "ring-4 ring-[#FFD600]/50" : "",
                  )}
                >
                   <div className="space-y-1 text-center">
                      <p className="text-sm font-black text-white uppercase">Pot: <span className={totalPots[id] > 0 ? "text-white" : "text-white"}>{totalPots[id].toLocaleString()}</span></p>
                      <p className="text-sm font-black text-[#FFD600] uppercase italic">You: {myBets[id].toLocaleString()}</p>
                   </div>
                   {myBets[id] > 0 && (
                     <div className="absolute top-2 right-2">
                        <GoldCoinIcon className="h-4 w-4 animate-bounce" />
                     </div>
                   )}
                </button>
              ))}
           </div>
        </div>

        {/* Production Footer Dashboard */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[110] animate-in slide-in-from-bottom-10">
           <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-3 flex items-center justify-between shadow-2xl">
              <div className="flex flex-col items-start px-2">
                 <div className="flex items-center gap-1.5">
                    <div className="bg-[#FFD600] p-0.5 rounded-full"><GoldCoinIcon className="h-3 w-3" /></div>
                    <span className="text-xs font-black text-[#FFD600] italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                    <button className="text-[#FFD600]"><RefreshCcw className="h-3 w-3" /></button>
                 </div>
              </div>
              
              <button className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-xs font-black text-white italic uppercase tracking-tighter">Repeat</button>

              <div className="flex gap-1 px-2">
                 {CHIPS.map(chip => (
                   <button 
                     key={chip.value} 
                     onClick={() => { setSelectedChip(chip.value); playBetSound(); }} 
                     className={cn(
                       "h-10 w-10 rounded-full flex items-center justify-center transition-all border-2 border-white/20 shrink-0",
                       selectedChip === chip.value ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)] " + chip.color : "bg-black/40" + " " + chip.color + " opacity-60"
                     )}
                   >
                      <span className="text-[10px] font-black text-white italic drop-shadow-md">{chip.value}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </AppLayout>
  );
}
