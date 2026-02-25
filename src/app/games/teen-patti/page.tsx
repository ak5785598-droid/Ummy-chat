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
  Loader
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';

const CHIPS = [
  { value: 5, color: 'bg-emerald-500' },
  { value: 10, color: 'bg-blue-500' },
  { value: 100, color: 'bg-yellow-500' },
  { value: 1000, color: 'bg-purple-500' },
  { value: 5000, color: 'bg-rose-500' },
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
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
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
      masterGain.gain.value = 0.3;
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
        noteGain.gain.setValueAtTime(0.1, now);
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
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">Teen Patti</h1>
        <p className="text-yellow-500 uppercase font-black tracking-widest text-[10px] animate-pulse">Loading Dragon Battle...</p>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#1a0a05] flex flex-col relative overflow-hidden font-headline animate-in fade-in duration-1000">
        <CompactRoomView />

        {/* Cinematic Backdrop */}
        <div className="absolute inset-0 z-0">
           <img src="https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000" className="h-full w-full object-cover opacity-20 scale-110" alt="Vault" />
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        </div>

        <div className="flex-1 flex flex-col pt-32 pb-32 px-4 relative z-10 overflow-y-auto no-scrollbar">
           <header className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                 <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md"><ChevronLeft className="h-5 w-5" /></button>
                 <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md">{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
              </div>
              <div className="bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
                 <History className="h-3 w-3 text-pink-500" />
                 <div className="flex gap-1">
                    {history.map((h, i) => (
                      <span key={i} className="text-[10px] font-black uppercase text-pink-400 animate-in zoom-in">{h}</span>
                    ))}
                 </div>
              </div>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md"><X className="h-5 w-5" /></button>
           </header>

           {/* Cards Layout */}
           <div className="grid grid-cols-3 gap-4 mb-10 px-2 animate-in slide-in-from-top-10 duration-700">
              {['A', 'B', 'C'].map((id) => (
                <div key={id} className="space-y-2">
                   <div className="flex gap-1 justify-center">
                      {[1, 2, 3].map(c => (
                        <div key={c} className={cn("w-8 h-12 rounded-sm border border-yellow-500/30 transition-all", winner === id ? "bg-pink-600 shadow-[0_0_15px_#db2777] scale-110" : "bg-black/60 shadow-inner")}>
                           {winner === id && <span className="flex items-center justify-center h-full text-xs">🎴</span>}
                        </div>
                      ))}
                   </div>
                   <p className="text-center text-[8px] font-black text-pink-500 uppercase tracking-widest italic drop-shadow-md">2.92x</p>
                </div>
              ))}
           </div>

           {/* Characters & Center Timer */}
           <div className="relative flex items-center justify-between px-2 mb-12">
              {DRAGONS.map((drag, i) => (
                <div key={drag.id} className={cn("flex flex-col items-center transition-all duration-500", winner === drag.id ? "scale-125 z-20" : "scale-100 z-10 opacity-80")}>
                   <span className="text-4xl font-black text-yellow-500 italic mb-2 drop-shadow-lg">{drag.id}</span>
                   <div className="relative group">
                      {winner === drag.id && <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl animate-pulse" />}
                      <img src={drag.image} className="h-24 w-24 object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" alt={drag.name} />
                   </div>
                </div>
              ))}
              
              {/* Floating Timer */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                 <div className="h-16 w-16 rounded-full bg-pink-600 border-4 border-white/20 shadow-2xl flex items-center justify-center animate-pulse">
                    {gameState === 'betting' ? (
                      <span className="text-2xl font-black text-white italic drop-shadow-md">{timeLeft}</span>
                    ) : (
                      <Loader className="h-8 w-8 text-white animate-spin" />
                    )}
                 </div>
              </div>
           </div>

           {/* Betting Pods */}
           <div className="grid grid-cols-3 gap-3 px-2">
              {['A', 'B', 'C'].map((id) => (
                <button 
                  key={id}
                  onClick={() => handlePlaceBet(id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative h-28 rounded-2xl border-2 transition-all overflow-hidden flex flex-col items-center justify-center p-2 bg-black/60 shadow-xl",
                    gameState === 'betting' ? "hover:scale-105 active:scale-95 border-white/5" : "opacity-60 grayscale-[0.5]",
                    winner === id ? "border-yellow-400 ring-4 ring-yellow-400/20" : "border-white/5",
                    myBets[id] > 0 && "bg-white/5"
                  )}
                >
                   <div className="space-y-1 text-center">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pot: {totalPots[id].toLocaleString()}</p>
                      <p className="text-xs font-black text-yellow-500 uppercase italic">You: {myBets[id].toLocaleString()}</p>
                   </div>
                   {myBets[id] > 0 && (
                     <div className="absolute top-1 right-1">
                        <GoldCoinIcon className="h-3 w-3 animate-bounce" />
                     </div>
                   )}
                </button>
              ))}
           </div>
        </div>

        {/* Production Footer Dashboard */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[110] animate-in slide-in-from-bottom-10">
           <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-2 bg-white/5 px-4 h-10 rounded-full border border-white/5">
                 <GoldCoinIcon className="h-4 w-4" />
                 <span className="text-xs font-black text-white italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex gap-1 overflow-x-auto no-scrollbar px-2">
                 {CHIPS.map(chip => (
                   <button 
                     key={chip.value} 
                     onClick={() => { setSelectedChip(chip.value); playBetSound(); }} 
                     className={cn(
                       "h-9 w-9 rounded-full flex items-center justify-center transition-all border-2 shrink-0",
                       selectedChip === chip.value ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)] " + chip.color : "bg-black/40 border-white/10 text-white/60"
                     )}
                   >
                      <span className="text-[8px] font-black italic">{chip.value}</span>
                   </button>
                 ))}
              </div>

              <button 
                className="h-12 w-12 bg-pink-600 rounded-full flex items-center justify-center shadow-lg border-2 border-pink-400 active:scale-90 transition-all"
                onClick={() => { setMyBets({ A: 0, B: 0, C: 0 }); playBetSound(); }}
              >
                 <span className="text-[8px] font-black text-white uppercase italic leading-none">Rep</span>
              </button>
           </div>
        </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </AppLayout>
  );
}
