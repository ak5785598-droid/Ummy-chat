'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useUserProfile, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  History,
  Trophy,
  X,
  Settings,
  Volume2,
  VolumeX,
  HelpCircle,
  BarChart2,
  Clock
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';

const ITEMS = [
  { id: 'grapes_blue', emoji: '🍇', multiplier: 5, label: '5 times', color: 'blue' },
  { id: 'watermelon', emoji: '🍉', multiplier: 5, label: '5 times', color: 'green' },
  { id: 'grapes_purple', emoji: '🍇', multiplier: 5, label: '5 times', color: 'purple' },
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '5 times', color: 'yellow' },
  { id: 'orange', emoji: '🍊', multiplier: 10, label: '10 times', color: 'orange' },
  { id: 'pear', emoji: '🍐', multiplier: 15, label: '15 times', color: 'lime' },
  { id: 'cherry', emoji: '🍒', multiplier: 25, label: '25 times', color: 'red' },
  { id: 'plum', emoji: '🫐', multiplier: 45, label: '45 times', color: 'violet' },
];

const CHIPS = [
  { value: 100, label: '100' },
  { value: 1000, label: '1K' },
  { value: 10000, label: '10K' },
  { value: 50000, label: '50K' },
];

export default function FruitPartyPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isLaunching, setIsLaunching] = useState(true);
  const [todayWinnings, setTodayWinnings] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    if (isMuted || isLaunching) return;
    
    let timer: any = null;

    try {
      const ctx = initAudioContext();
      if (!ctx) return;
      
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.25; 
      masterGain.connect(ctx.destination);

      let step = 0;
      const scheduleNextNote = () => {
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        // Upbeat Fruit Party vibe: C-Major Pentatonic
        const melody = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; 
        const freq = melody[step % melody.length];
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        noteGain.gain.setValueAtTime(0.1, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.2);
        step++;
      };

      timer = setInterval(scheduleNextNote, 200);
    } catch (e) {}

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isMuted, isLaunching, initAudioContext]);

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
    const totalSteps = 24 + targetIdx;
    let speed = 60;

    const runChase = () => {
      setHighlightIdx(currentStep % ITEMS.length);
      currentStep++;
      if (currentStep < totalSteps) {
        if (totalSteps - currentStep < 8) speed += 40;
        setTimeout(runChase, speed);
      } else {
        setTimeout(() => showResult(ITEMS[targetIdx].id), 500);
      }
    };
    runChase();
  };

  const showResult = (id: string) => {
    setGameState('result');
    setResultId(id);
    setHistory(prev => [id, ...prev].slice(0, 10));
    const winItem = ITEMS.find(i => i.id === id);
    const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);
    
    if (winAmount > 0 && currentUser && firestore) {
      setTodayWinnings(prev => prev + winAmount);
      const updateData = { 'wallet.coins': increment(winAmount), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setTimeout(() => {
      setMyBets({});
      setGameState('betting');
      setTimeLeft(20);
      setResultId(null);
      setHighlightIdx(null);
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

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#2D0B0B] flex flex-col items-center justify-center space-y-6">
        <div className="text-9xl animate-bounce">🍓</div>
        <h1 className="text-5xl font-black text-[#FFD600] uppercase italic tracking-tighter drop-shadow-2xl">Lucky Fruit</h1>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
           <div className="h-full bg-[#FFD600] animate-shimmer" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#1a0505] flex flex-col items-center relative overflow-hidden font-headline animate-in fade-in duration-1000" onClick={initAudioContext}>
        <CompactRoomView />

        {/* Cinematic Sparkle Overlay */}
        <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none z-0">
           <div className="absolute inset-0 bg-gradient-to-b from-[#FFD600]/20 to-transparent" />
           <div className="flex justify-center pt-20">
              <div className="relative w-full max-w-lg">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2000')] bg-cover opacity-30 mix-blend-screen animate-pulse" />
              </div>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center w-full max-w-md p-4 pt-32 pb-32 z-10 overflow-y-auto no-scrollbar">
          <header className="w-full flex items-center justify-between mb-4">
             <div className="flex gap-2">
                <button onClick={() => router.back()} className="bg-black/40 p-2 rounded-full text-[#FFD600] border border-[#FFD600]/20"><X className="h-4 w-4" /></button>
                <button onClick={() => setIsMuted(!isMuted)} className="bg-black/40 p-2 rounded-full text-[#FFD600] border border-[#FFD600]/20">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                <button className="bg-black/40 p-2 rounded-full text-[#FFD600] border border-[#FFD600]/20"><BarChart2 className="h-4 w-4" /></button>
             </div>
             <div className="flex gap-2">
                <button className="bg-black/40 p-2 rounded-full text-[#FFD600] border border-[#FFD600]/20"><Clock className="h-4 w-4" /></button>
                <button className="bg-black/40 p-2 rounded-full text-[#FFD600] border border-[#FFD600]/20"><HelpCircle className="h-4 w-4" /></button>
             </div>
          </header>

          <div className="relative w-full flex flex-col items-center mb-6">
             <div className="relative z-20 -mb-4">
                <div className="bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] px-12 py-2 rounded-t-3xl border-x-4 border-t-4 border-[#FFD600] shadow-2xl relative overflow-hidden">
                   <h2 className="text-3xl font-black text-white italic uppercase tracking-tight drop-shadow-md">Lucky Fruit</h2>
                   <div className="absolute top-0 right-0 p-1"><div className="w-4 h-4 bg-white/20 rotate-45" /></div>
                </div>
             </div>
             
             <div className="w-full bg-[#4D0000] p-1.5 rounded-[2.5rem] border-4 border-[#B45309] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="bg-[#2D0B0B] rounded-[2rem] p-4 space-y-4">
                   <div className="flex justify-center">
                      <div className="bg-black/40 px-6 py-1 rounded-full border border-white/5">
                         <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Round <span className="text-[#FFD600]">19016</span> of Today</p>
                      </div>
                   </div>

                   {/* Betting Grid - Top Row */}
                   <div className="grid grid-cols-4 gap-2">
                      {ITEMS.slice(0, 4).map((item, idx) => (
                        <button 
                          key={item.id} 
                          onClick={() => handlePlaceBet(item.id)}
                          disabled={gameState !== 'betting'}
                          className={cn(
                            "relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 border-2 transition-all",
                            highlightIdx === idx || resultId === item.id ? "border-[#FFD600] bg-[#FFD600]/20 scale-105 shadow-[0_0_15px_#FFD600]" : "border-white/5 bg-black/20",
                            gameState !== 'betting' && resultId !== item.id && "opacity-60"
                          )}
                        >
                           <span className="text-3xl drop-shadow-lg">{item.emoji}</span>
                           <span className="text-[8px] font-black uppercase text-[#FFD600]">{item.label}</span>
                           {myBets[item.id] > 0 && <div className="absolute -top-1 -right-1 bg-[#FFD600] text-black text-[7px] font-black px-1 rounded-full border border-white">{(myBets[item.id]/1000).toFixed(0)}k</div>}
                        </button>
                      ))}
                   </div>

                   {/* Middle Row - Lucky & Timer */}
                   <div className="grid grid-cols-4 gap-2 h-20">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center border-2 border-white/10 opacity-80">
                         <span className="text-white font-black italic uppercase text-[10px] drop-shadow-md">Lucky</span>
                      </div>
                      <div className="col-span-2 bg-[#1a0505] rounded-2xl border-4 border-[#B45309] shadow-inner flex items-center justify-center overflow-hidden">
                         {gameState === 'betting' ? (
                           <div className="text-5xl font-mono font-black text-red-600 italic tracking-tighter drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                              {timeLeft}
                           </div>
                         ) : (
                           <div className="text-4xl animate-in zoom-in duration-300">
                              {ITEMS[highlightIdx ?? 0]?.emoji || '🍓'}
                           </div>
                         )}
                      </div>
                      <div className="bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl flex items-center justify-center border-2 border-white/10 opacity-80">
                         <span className="text-white font-black italic uppercase text-[10px] drop-shadow-md">Lucky</span>
                      </div>
                   </div>

                   {/* Betting Grid - Bottom Row */}
                   <div className="grid grid-cols-4 gap-2">
                      {ITEMS.slice(4).map((item, idx) => (
                        <button 
                          key={item.id} 
                          onClick={() => handlePlaceBet(item.id)}
                          disabled={gameState !== 'betting'}
                          className={cn(
                            "relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 border-2 transition-all",
                            highlightIdx === (idx + 4) || resultId === item.id ? "border-[#FFD600] bg-[#FFD600]/20 scale-105 shadow-[0_0_15px_#FFD600]" : "border-white/5 bg-black/20",
                            gameState !== 'betting' && resultId !== item.id && "opacity-60"
                          )}
                        >
                           <span className="text-3xl drop-shadow-lg">{item.emoji}</span>
                           <span className="text-[8px] font-black uppercase text-[#FFD600]">{item.label}</span>
                           {myBets[item.id] > 0 && <div className="absolute -top-1 -right-1 bg-[#FFD600] text-black text-[7px] font-black px-1 rounded-full border border-white">{(myBets[item.id]/1000).toFixed(0)}k</div>}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Chips & Repeat */}
          <div className="w-full space-y-4">
             <div className="flex justify-between items-center px-4">
                {CHIPS.map(chip => (
                  <button 
                    key={chip.value} 
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "group flex flex-col items-center gap-1 transition-all active:scale-90",
                      selectedChip === chip.value ? "scale-110" : "opacity-60 hover:opacity-100"
                    )}
                  >
                     <div className={cn(
                       "h-10 w-10 rounded-full border-2 flex items-center justify-center shadow-lg",
                       selectedChip === chip.value ? "bg-[#FFD600] border-white shadow-[0_0_15px_#FFD600]" : "bg-black/40 border-white/20"
                     )}>
                        <span className={cn("text-[10px] font-black italic", selectedChip === chip.value ? "text-black" : "text-white")}>{chip.label}</span>
                     </div>
                     <div className={cn("h-4 w-4 rounded-full border-2", selectedChip === chip.value ? "bg-[#FFD600] border-white" : "bg-white/10 border-white/5")} />
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Global Footer Stats */}
        <div className="fixed bottom-0 left-0 right-0 z-[110] bg-gradient-to-t from-black to-black/80 border-t border-white/10 px-6 pt-4 pb-10">
           <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
              <div className="bg-[#4D0000] p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Balance</span>
                 <div className="flex items-center gap-2">
                    <GoldCoinIcon className="h-4 w-4" />
                    <span className="text-lg font-black text-[#FFD600] italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 </div>
              </div>
              <div className="bg-[#4D0000] p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Today's Winnings</span>
                 <div className="flex items-center gap-2">
                    <GoldCoinIcon className="h-4 w-4" />
                    <span className="text-lg font-black text-[#FFD600] italic">{todayWinnings.toLocaleString()}</span>
                 </div>
              </div>
           </div>
           
           <div className="max-w-md mx-auto mt-4 flex items-center gap-3 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-black text-white/20 uppercase italic tracking-tighter shrink-0">Results:</span>
              <div className="flex gap-2">
                 {history.map((hid, i) => (
                   <div key={i} className="relative">
                      <span className="text-xl opacity-80">{ITEMS.find(it => it.id === hid)?.emoji}</span>
                      {i === 0 && <div className="absolute -top-1 -right-1 bg-yellow-500 text-[6px] font-black text-black px-1 rounded-full animate-pulse">NEW</div>}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
