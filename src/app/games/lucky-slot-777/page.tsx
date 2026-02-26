'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useUserProfile, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  History,
  X,
  Volume2,
  VolumeX,
  Crown,
  Trophy
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const WHEEL_DISTRIBUTION = ['watermelon', 'peach', 'watermelon', 'peach', 'watermelon', 'watermelon', 'peach', 'seven'];
const CHIPS = [
  { value: 100, color: 'bg-blue-600', label: '100' },
  { value: 1000, color: 'bg-yellow-500', label: '1K' },
  { value: 100000, color: 'bg-purple-600', label: '100K' },
  { value: 500000, color: 'bg-emerald-600', label: '500K' },
];

export default function LuckySlot777Page() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
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

  const playSpinSound = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    let startTime = ctx.currentTime;
    for (let i = 0; i < 40; i++) {
      const time = startTime + (i * 0.12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000 + (Math.random() * 200), time);
      gain.gain.setValueAtTime(0.02, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.08);
    }
  }, [isMuted, initAudioContext]);

  useEffect(() => {
    if (isMuted || isLaunching) return;
    
    let audioCtx: AudioContext | null = null;
    let timer: any = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.35; 
      masterGain.connect(audioCtx.destination);

      let step = 0;
      const scheduleNextNote = () => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        
        const bass = [110.00, 110.00, 130.81, 146.83]; // A2, A2, C3, D3
        const freq = bass[step % 4];
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        noteGain.gain.setValueAtTime(0.2, now);
        noteGain.gain.linearRampToValueAtTime(0, now + 0.8);
        
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
    const timer = setTimeout(() => setIsLaunching(false), 1500);
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
    playSpinSound();
    const targetIdx = Math.floor(Math.random() * WHEEL_DISTRIBUTION.length);
    const sliceAngle = 360 / WHEEL_DISTRIBUTION.length;
    const extraSpins = 50; 
    const landingAngle = (360 - (targetIdx * sliceAngle)) % 360;
    const baseRotation = Math.floor(rotation / 360) * 360;
    const totalRotation = baseRotation + (360 * extraSpins) + landingAngle;
    
    setTimeout(() => setRotation(totalRotation), 50);
    setTimeout(() => showResult(WHEEL_DISTRIBUTION[targetIdx]), 5050);
  };

  const showResult = (id: string) => {
    setHistory(prev => [id, ...prev].slice(0, 12));
    const winItem = id === 'seven' ? { multiplier: 8 } : { multiplier: 2 };
    const winAmount = (myBets[id] || 0) * winItem.multiplier;

    const sessionWinners = [];
    if (winAmount > 0 && userProfile) {
      sessionWinners.push({ name: userProfile.username, win: winAmount, avatar: userProfile.avatarUrl, isMe: true });
    }

    setWinners(sessionWinners);
    setGameState('result');

    if (winAmount > 0 && currentUser && firestore) {
      const updateData = { 
        'wallet.coins': increment(winAmount), 
        'stats.dailyGameWins': increment(winAmount),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setTimeout(() => {
      setMyBets({});
      setWinners([]);
      setGameState('betting');
      setTimeLeft(20);
    }, 4000);
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

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6">
        <div className="text-8xl animate-bounce">🎰</div>
        <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter">Lucky Slot</h1>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col relative overflow-hidden font-headline animate-in fade-in duration-700">
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

        <div className="flex-1 flex flex-col items-center pt-32 pb-32 px-4 z-10 overflow-y-auto">
           <header className="w-full flex items-center justify-between mb-6">
              <div className="bg-black/40 backdrop-blur-xl px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                 <History className="h-3 w-3 text-yellow-500" />
                 <div className="flex gap-1">
                    {history.slice(0, 6).map((id, i) => (
                      <span key={i} className="text-xs animate-in zoom-in">{id === 'seven' ? '7️⃣' : (id === 'peach' ? '🍑' : '🍉')}</span>
                    ))}
                 </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-1.5 rounded-full text-white hover:bg-white/20 transition-all">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white hover:bg-white/20 transition-all"><X className="h-4 w-4" /></button>
              </div>
           </header>

           <div className="relative w-64 h-64 flex items-center justify-center scale-110 mt-10">
              <div className={cn("relative w-full h-full rounded-full border-[8px] border-yellow-500 shadow-2xl", gameState === 'spinning' ? "transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)" : "transition-none")} style={{ transform: `rotate(${rotation}deg)` }}>
                 <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
                    {WHEEL_DISTRIBUTION.map((id, i) => {
                      const angle = i * 45;
                      return (
                        <g key={i} transform={`rotate(${angle} 50 50)`}>
                           <path d="M 50 50 L 50 0 A 50 50 0 0 1 85.35 14.65 Z" fill={id === 'seven' ? '#ff00cc' : '#0099ff'} stroke="#fbbf24" strokeWidth="0.5" />
                           <text x="68" y="28" transform="rotate(22.5 68 28)" fontSize="8" textAnchor="middle" className="font-black fill-white">{id === 'seven' ? '777' : (id === 'peach' ? '🍑' : '🍉')}</text>
                        </g>
                      );
                    })}
                 </svg>
              </div>
              <div className="absolute z-20 w-20 h-24 bg-black rounded-full shadow-2xl flex flex-col items-center justify-center border-[4px] border-yellow-500 overflow-hidden">
                 <span className="text-3xl font-black text-white italic animate-in zoom-in">{gameState === 'betting' ? timeLeft : '🎰'}</span>
              </div>
           </div>

           <div className="w-full max-w-sm grid grid-cols-3 gap-3 px-2 mt-12">
              {['peach', 'seven', 'watermelon'].map(id => (
                <button key={id} onClick={() => handlePlaceBet(id)} disabled={gameState !== 'betting'} className={cn("relative h-32 rounded-2xl border-2 transition-all flex flex-col items-center justify-center bg-gradient-to-b from-[#4a1d96] to-[#2d0b5a] hover:scale-105 active:scale-95", myBets[id] && "border-yellow-400 ring-2 ring-yellow-400/20 shadow-[0_0_20px_rgba(251,191,36,0.3)]")}>
                   <span className="text-4xl mb-1">{id === 'seven' ? '777' : (id === 'peach' ? '🍑' : '🍉')}</span>
                   <span className="text-xl font-black text-yellow-400 italic">{id === 'seven' ? 'x8' : 'x2'}</span>
                   {myBets[id] > 0 && (
                     <div className="absolute top-2 right-2 bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-black text-[8px] flex items-center gap-1 animate-in zoom-in shadow-lg">
                        <GoldCoinIcon className="h-2 w-2" />
                        {myBets[id].toLocaleString()}
                     </div>
                   )}
                </button>
              ))}
           </div>

           <div className="w-full max-w-sm fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-black/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="flex items-center gap-2 bg-white/5 px-3 h-10 rounded-full">
                 <GoldCoinIcon className="h-4 w-4" />
                 <span className="text-xs font-black text-white italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
              <div className="flex gap-1.5 px-2">
                 {CHIPS.map(chip => (
                   <button key={chip.value} onClick={() => setSelectedChip(chip.value)} className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-all border-2", selectedChip === chip.value ? chip.color + " border-white scale-110 shadow-[0_0_10px_white]" : "bg-black/40 border-white/10")}>
                      <span className="text-[7px] font-black text-white italic">{chip.label}</span>
                   </button>
                 ))}
              </div>
              <button className="h-12 w-12 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center active:scale-90 shadow-xl transition-all"><GoldCoinIcon className="h-6 w-6" /></button>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}
