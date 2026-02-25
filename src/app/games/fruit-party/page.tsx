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
  FileText,
  Volume2,
  VolumeX
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';

const ITEMS = [
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '5 TIMES', gridPos: 0 },
  { id: 'tomato', emoji: '🍅', multiplier: 5, label: '5 TIMES', gridPos: 1 },
  { id: 'banana', emoji: '🍌', multiplier: 5, label: '5 TIMES', gridPos: 2 },
  { id: 'cherries', emoji: '🍒', multiplier: 45, label: '45 TIMES', gridPos: 3 },
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '5 TIMES', gridPos: 5 },
  { id: 'grapes', emoji: '🍇', multiplier: 25, label: '25 TIMES', gridPos: 6 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '15 TIMES', gridPos: 7 },
  { id: 'watermelon', emoji: '🍉', multiplier: 10, label: '10 TIMES', gridPos: 8 },
];

const CHIPS = [
  { value: 100, label: '100', color: 'from-[#FF4D4D] to-[#B22222]', top: 'bg-[#FF4D4D]' },
  { value: 1000, label: '1K', color: 'from-[#2ECC71] to-[#1E8449]', top: 'bg-[#2ECC71]' },
  { value: 10000, label: '10K', color: 'from-[#F1C40F] to-[#B7950B]', top: 'bg-[#F1C40F]' },
  { value: 100000, label: '100K', color: 'from-[#1ABC9C] to-[#148F77]', top: 'bg-[#1ABC9C]' },
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
  const [lastWin, setLastWin] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBetSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = initAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, [isMuted, initAudioContext]);

  useEffect(() => {
    if (isMuted || isLaunching) return;
    
    let timer: any = null;

    try {
      const ctx = initAudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.35; 
      masterGain.connect(ctx.destination);

      let step = 0;
      const scheduleNextNote = () => {
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        const arpeggio = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const freq = arpeggio[step % 4];
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        
        noteGain.gain.setValueAtTime(0.1, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
        step++;
      };

      timer = setInterval(scheduleNextNote, 150);
    } catch (e) {}

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isMuted, isLaunching, initAudioContext]);

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
    const targetIdx = Math.floor(Math.random() * ITEMS.length);
    const perimeterOrder = [0, 1, 2, 5, 8, 7, 6, 3];
    const targetGridPos = ITEMS[targetIdx].gridPos;
    const targetOrderIdx = perimeterOrder.indexOf(targetGridPos);
    
    const totalSteps = 32 + targetOrderIdx; 
    let currentStep = 0;
    let speed = 50;

    const runChase = () => {
      setHighlightIdx(perimeterOrder[currentStep % 8]);
      playBetSound(); 
      currentStep++;
      if (currentStep < totalSteps) {
        if (totalSteps - currentStep < 10) speed += 30;
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
    setHistory(prev => [id, ...prev].slice(0, 15));
    const winItem = ITEMS.find(i => i.id === id);
    const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);
    setLastWin(winAmount);

    if (winAmount > 0 && currentUser && firestore && userProfile) {
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
      setLastWin(0);
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

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#4B0082] flex flex-col items-center justify-center space-y-6">
        <div className="text-9xl animate-bounce">🍓</div>
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Fruit Party</h1>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#9C27B0] flex flex-col items-center relative overflow-hidden font-headline animate-in fade-in duration-700" onClick={initAudioContext}>
        <CompactRoomView />

        <div className="flex-1 flex flex-col items-center w-full p-4 pt-32 pb-32 z-10 overflow-y-auto">
          <header className="w-full flex items-center justify-between mb-4 px-2">
             <div className="flex items-center gap-4">
                <span className="text-white font-black text-lg uppercase tracking-tight">ROUND: 311</span>
                <div className="flex items-center gap-1 text-[#00E676] text-xs font-black">
                   <span>60ms</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="bg-white/20 p-1.5 rounded-full text-white hover:bg-white/40 transition-all">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button className="bg-white/20 p-1.5 rounded-full text-white hover:bg-white/40 transition-all"><FileText className="h-4 w-4" /></button>
                <button className="bg-white/20 p-1.5 rounded-full text-white hover:bg-white/40 transition-all"><Settings className="h-4 w-4" /></button>
                <button onClick={() => router.back()} className="bg-white/20 p-1.5 rounded-full text-white hover:bg-white/40 transition-all"><X className="h-4 w-4" /></button>
             </div>
          </header>

          <div className="w-full max-w-md bg-[#FFD600] p-1 rounded-xl shadow-lg mb-6 animate-in slide-in-from-top-4">
             <div className="bg-[#4A148C] rounded-lg px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <span className="text-xs font-black text-white uppercase opacity-60">BALANCE:</span>
                   <div className="flex items-center gap-1 text-white font-black text-lg">
                      <GoldCoinIcon className="h-5 w-5" />
                      {(userProfile?.wallet?.coins || 0).toLocaleString()}
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-black text-white uppercase opacity-60">PROFIT:</span>
                   <span className={cn("font-black text-lg transition-colors", lastWin > 0 ? "text-green-400" : "text-white")}>{lastWin.toLocaleString()}</span>
                   <div className="bg-[#FFD600] p-1.5 rounded-md ml-2 shadow-inner"><Trophy className="h-4 w-4 text-[#4A148C]" /></div>
                </div>
             </div>
          </div>

          <div className="relative w-full max-w-[340px] aspect-square bg-[#FFD600] p-3 rounded-[2rem] shadow-2xl border-b-[8px] border-[#B7950B] animate-in zoom-in">
             <div className="w-full h-full bg-[#311B92] rounded-[1.5rem] grid grid-cols-3 grid-rows-3 gap-2 p-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((gridIndex) => {
                  if (gridIndex === 4) {
                    return (
                      <div key="center" className="bg-[#1A0033] rounded-2xl flex items-center justify-center border-4 border-[#B7950B] shadow-inner relative overflow-hidden">
                         {gameState === 'betting' ? (
                           <div className="text-5xl font-black text-[#FFD600] italic font-mono drop-shadow-[0_0_10px_rgba(255,214,0,0.5)] animate-in zoom-in">{timeLeft}</div>
                         ) : (
                           <div className="text-5xl animate-in zoom-in duration-300 drop-shadow-[0_0_15px_white]">
                             {ITEMS.find(it => it.gridPos === (highlightIdx ?? -1))?.emoji || (resultId && ITEMS.find(it => it.id === resultId)?.emoji)}
                           </div>
                         )}
                      </div>
                    );
                  }
                  
                  const item = ITEMS.find(it => it.gridPos === gridIndex);
                  const isHighlighted = highlightIdx === gridIndex;
                  const isWinner = resultId === item?.id;
                  const hasBet = item ? !!myBets[item.id] : false;

                  return (
                    <button 
                      key={gridIndex} 
                      onClick={() => item && handlePlaceBet(item.id)} 
                      disabled={gameState !== 'betting'} 
                      className={cn(
                        "relative rounded-2xl flex flex-col items-center justify-center p-1 transition-all bg-gradient-to-b from-[#AB47BC] to-[#7B1FA2] border-2 border-white/10 shadow-lg active:scale-95 hover:scale-105",
                        isHighlighted && "ring-4 ring-[#FFD600] z-10 scale-105 shadow-[0_0_20px_#FFD600]",
                        isWinner && "ring-4 ring-white animate-pulse z-20",
                        gameState !== 'betting' && !isHighlighted && "opacity-60"
                      )}
                    >
                      <span className="text-4xl mb-1">{item?.emoji}</span>
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{item?.label}</span>
                      {hasBet && (
                        <div className="absolute -top-2 -right-2 bg-[#FFD600] text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-xl animate-in zoom-in">
                          {(myBets[item!.id] >= 1000 ? `${(myBets[item!.id] / 1000).toFixed(0)}K` : myBets[item!.id])}
                        </div>
                      )}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="w-full max-w-md mt-10 relative animate-in slide-in-from-bottom-10">
             <div className="bg-[#4A148C] rounded-t-[3rem] p-6 pb-12 border-t-4 border-[#FFD600]">
                <div className="flex items-center justify-center gap-4 px-2">
                   {CHIPS.map(chip => (
                     <button 
                       key={chip.value} 
                       onClick={() => { setSelectedChip(chip.value); playBetSound(); }} 
                       className={cn(
                         "group relative transition-all duration-200",
                         selectedChip === chip.value ? "scale-110 -translate-y-2" : "hover:-translate-y-1"
                       )}
                     >
                        <div className={cn("w-16 h-16 rounded-full bg-gradient-to-b shadow-2xl flex items-center justify-center", chip.color)}>
                           <div className={cn("w-12 h-12 rounded-full border-2 border-white/30 flex flex-col items-center justify-center", chip.top)}>
                              <GoldCoinIcon className="h-4 w-4 mb-0.5" />
                              <span className="text-xs font-black text-white leading-none">{chip.label}</span>
                           </div>
                        </div>
                        {selectedChip === chip.value && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full animate-pulse" />
                        )}
                     </button>
                   ))}
                </div>
             </div>
             <div className="bg-[#1A0033] w-full h-12 flex items-center gap-3 px-6 border-t-2 border-[#FFD600]/20 overflow-hidden">
                <History className="h-4 w-4 text-[#FFD600] shrink-0" />
                <div className="flex gap-2 animate-marquee whitespace-nowrap">
                   {history.length > 0 ? history.map((id, i) => (
                     <div key={i} className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-xl shrink-0">
                       {ITEMS.find(it => it.id === id)?.emoji}
                     </div>
                   )) : (
                     <p className="text-[10px] text-white/40 font-black uppercase">Wait for result...</p>
                   )}
                </div>
             </div>
          </div>
        </div>

        <style jsx global>{`
          .animate-marquee {
            display: inline-flex;
            animation: marquee 20s linear infinite;
          }
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </AppLayout>
  );
}
