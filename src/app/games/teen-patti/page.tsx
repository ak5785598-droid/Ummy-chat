'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
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
  RefreshCcw,
  Crown,
  Zap
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const CHIPS = [
  { value: 5, color: 'bg-[#00E676]' }, 
  { value: 10, color: 'bg-[#2979FF]' }, 
  { value: 100, color: 'bg-[#FFD600]' }, 
  { value: 1000, color: 'bg-[#FF9100]' }, 
  { value: 5000, color: 'bg-[#FF1744]' }, 
];

const DRAGONS = [
  { id: 'A', name: 'Jade Dragon', emoji: '🐲', color: '#4ade80', imageId: 'dragon-jade' },
  { id: 'B', name: 'Ruby Dragon', emoji: '🐉', color: '#f87171', imageId: 'dragon-ruby' },
  { id: 'C', name: 'Azure Dragon', emoji: '🦕', color: '#60a5fa', imageId: 'dragon-azure' },
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

  const playCalculatingSound = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    let startTime = ctx.currentTime;
    for (let i = 0; i < 15; i++) {
      const time = startTime + (i * 0.2);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + (i * 50), time);
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.1);
    }
  }, [isMuted, initAudioContext]);

  useEffect(() => {
    if (isMuted || isLaunching) return;
    let audioCtx: AudioContext | null = null;
    let timer: any = null;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 1.0; 
      masterGain.connect(audioCtx.destination);
      let step = 0;
      const scheduleNextNote = () => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        const frequencies = [146.83, 164.81, 174.61, 196.00, 220.00, 246.94];
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequencies[step % frequencies.length], now);
        osc.frequency.exponentialRampToValueAtTime(frequencies[step % frequencies.length] * 0.5, now + 0.8);
        noteGain.gain.setValueAtTime(0.2, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.8);
        step++;
      };
      timer = setInterval(scheduleNextNote, 600);
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
    playCalculatingSound();
    setTimeout(() => {
      const winId = DRAGONS[Math.floor(Math.random() * 3)].id;
      showResult(winId);
    }, 3000);
  };

  const showResult = (winId: string) => {
    setWinner(winId);
    setHistory(prev => [winId, ...prev].slice(0, 10));
    
    const winAmount = (myBets[winId] || 0) * 2.92;
    const sessionWinners = [];

    if (winAmount > 0 && userProfile) {
      sessionWinners.push({ name: userProfile.username, win: Math.floor(winAmount), avatar: userProfile.avatarUrl, isMe: true });
    }

    setWinners(sessionWinners);
    setGameState('result');
    
    if (winAmount > 0 && currentUser && firestore) {
      const updateData = { 
        'wallet.coins': increment(Math.floor(winAmount)), 
        'stats.dailyGameWins': increment(Math.floor(winAmount)),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setTimeout(() => {
      setMyBets({ A: 0, B: 0, C: 0 });
      setTotalPots({ A: 0, B: 0, C: 0 });
      setWinner(null);
      setWinners([]);
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
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6">
        <div className="text-8xl animate-bounce">🐲</div>
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">Dragon Battle</h1>
      </div>
    );
  }

  const backgroundAsset = PlaceHolderImages.find(img => img.id === 'teen-patti-bg');

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#1a0a05] flex flex-col relative overflow-hidden font-headline animate-in fade-in duration-1000 perspective-1000">
        <CompactRoomView />

        {gameState === 'result' && winners.length > 0 && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-500">
             <div className="relative mb-12 flex flex-col items-center gap-4">
                <Trophy className="h-20 w-20 text-yellow-400 animate-bounce" />
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter text-center">Tribe Winners</h2>
             </div>
             <div className="flex items-end justify-center gap-4 px-6 w-full max-w-lg h-64">
                {winners.map((winner, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-20 duration-1000">
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

        <div className="absolute inset-0 z-0">
           {backgroundAsset && (
             <img 
               src={backgroundAsset.imageUrl} 
               className="h-full w-full object-cover opacity-30 scale-110" 
               alt={backgroundAsset.description} 
               data-ai-hint={backgroundAsset.imageHint}
             />
           )}
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        </div>

        <div className="flex-1 flex flex-col pt-32 pb-32 px-4 relative z-10 overflow-y-auto no-scrollbar">
           <header className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><Maximize2 className="h-4 w-4" /></button>
                 <button onClick={() => setIsMuted(!isMuted)} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><HelpCircle className="h-4 w-4" /></button>
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><BarChart2 className="h-4 w-4" /></button>
              </div>
              <h1 className="text-2xl font-black text-white italic drop-shadow-lg uppercase tracking-tight flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500 fill-current" />
                Dragon Battle
              </h1>
              <div className="flex gap-1">
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><Settings className="h-4 w-4" /></button>
                 <button onClick={() => router.back()} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/10"><X className="h-4 w-4" /></button>
              </div>
           </header>

           {/* 3D Visual Arena */}
           <div className="grid grid-cols-3 gap-4 mb-6 px-2 animate-in slide-in-from-top-10 duration-700 pt-4">
              {['A', 'B', 'C'].map((id) => (
                <div key={id} className="space-y-1 relative group preserve-3d transition-transform hover:rotate-x-12">
                   <div className="flex gap-0.5 justify-center">
                      {[1, 2, 3].map(c => (
                        <div key={c} className={cn("w-10 h-16 rounded-sm border-[1px] border-[#FFD600]/30 transition-all shadow-2xl", winner === id ? "bg-[#FF1744] shadow-[0_0_25px_#FF1744] scale-110 -translate-y-2" : "bg-black/60 shadow-inner")}>
                           <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=400')] bg-cover bg-center opacity-40" />
                        </div>
                      ))}
                   </div>
                   <p className="text-center text-[10px] font-black text-[#FF1744] uppercase tracking-widest italic drop-shadow-md">2.92x Multiplier</p>
                   {id === 'B' && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                         <div className="h-14 w-14 rounded-full bg-gradient-to-b from-[#FF1744] to-[#880e4f] border-4 border-white/20 shadow-[0_0_30px_rgba(255,23,68,0.6)] flex items-center justify-center animate-pulse">
                            {gameState === 'betting' ? <span className="text-2xl font-black text-white italic drop-shadow-lg">{timeLeft}</span> : <Loader className="h-8 w-8 text-white animate-spin" />}
                         </div>
                      </div>
                   )}
                </div>
              ))}
           </div>

           <div className="relative flex items-center justify-between px-2 mb-12 h-40">
              {DRAGONS.map((drag) => {
                const asset = PlaceHolderImages.find(img => img.id === drag.imageId);
                return (
                  <div key={drag.id} className={cn("flex flex-col items-center transition-all duration-700 preserve-3d", winner === drag.id ? "scale-150 z-30 -translate-y-4" : "scale-100 z-10 opacity-80")}>
                    <span className="text-6xl font-serif text-[#FFD600] italic mb-2 drop-shadow-[0_0_20px_rgba(255,214,0,0.8)] font-bold">{drag.id}</span>
                    <div className="relative group">
                        {winner === drag.id && (
                          <div className="absolute -inset-10 bg-gradient-radial from-yellow-500/40 to-transparent rounded-full blur-2xl animate-ping" />
                        )}
                        {asset && (
                          <div className="relative preserve-3d group-hover:rotate-y-12 transition-transform duration-500">
                            <img 
                              src={asset.imageUrl} 
                              className="h-36 w-36 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] filter brightness-110" 
                              alt={drag.name} 
                              data-ai-hint={asset.imageHint}
                            />
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
           </div>

           <div className="grid grid-cols-3 gap-4 px-2">
              {['A', 'B', 'C'].map((id) => (
                <button key={id} onClick={() => handlePlaceBet(id)} disabled={gameState !== 'betting'} className={cn("relative h-36 rounded-3xl border-none transition-all overflow-hidden flex flex-col items-center justify-center p-2 bg-gradient-to-br from-[#2D0B0B] to-[#1a0505] shadow-[0_15px_35px_rgba(0,0,0,0.6)] preserve-3d", gameState === 'betting' ? "hover:scale-105 active:scale-95 active:rotate-x-12" : "opacity-60 grayscale-[0.5]", winner === id ? "ring-4 ring-[#FFD600] shadow-[0_0_40px_rgba(255,214,0,0.3)]" : "")}>
                   <div className="space-y-2 text-center translate-z-[20px]">
                      <div className="bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        <p className="text-[10px] font-black text-white/60 uppercase">Pot Balance</p>
                        <p className="text-sm font-black text-white uppercase tracking-tighter italic">{totalPots[id].toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-1 animate-in zoom-in">
                         <p className="text-[10px] font-black text-[#FFD600]/60 uppercase tracking-widest">My Sync</p>
                         <div className="flex items-center gap-1.5">
                            {myBets[id] > 0 && <GoldCoinIcon className="h-4 w-4" />}
                            <p className="text-base font-black text-[#FFD600] uppercase italic tracking-tighter">{myBets[id].toLocaleString()}</p>
                         </div>
                      </div>
                   </div>
                   {/* 3D Shimmer Effect */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-30" />
                </button>
              ))}
           </div>
        </div>

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[110] animate-in slide-in-from-bottom-10">
           <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <div className="flex flex-col items-start px-2">
                 <div className="flex items-center gap-2">
                    <div className="bg-[#FFD600] p-1 rounded-full shadow-[0_0_10px_rgba(255,214,0,0.5)]"><GoldCoinIcon className="h-4 w-4" /></div>
                    <span className="text-sm font-black text-[#FFD600] italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                    <button className="text-[#FFD600] hover:rotate-180 transition-transform duration-500"><RefreshCcw className="h-4 w-4" /></button>
                 </div>
              </div>
              <div className="flex gap-1.5 px-2">
                 {CHIPS.map(chip => (
                   <button key={chip.value} onClick={() => { setSelectedChip(chip.value); }} className={cn("h-11 w-11 rounded-full flex items-center justify-center transition-all border-2 border-white/20 shrink-0 shadow-lg preserve-3d", selectedChip === chip.value ? "border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] translate-z-[10px] " + chip.color : "bg-black/40 " + chip.color + " opacity-60")}>
                      <span className="text-[11px] font-black text-white italic drop-shadow-md">{chip.value}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .translate-z-[10px] { transform: translateZ(10px); }
        .translate-z-[20px] { transform: translateZ(20px); }
        .rotate-x-12 { transform: rotateX(12deg); }
        .rotate-y-12 { transform: rotateY(12deg); }
      `}</style>
    </AppLayout>
  );
}
