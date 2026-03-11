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
  HelpCircle, 
  Trophy, 
  Users, 
  X,
  FileText,
  Minus,
  Plus,
  Zap,
  Star,
  Loader
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

const BET_OPTIONS = [
  { id: 'TIGER', label: 'TIGER', multiplier: 2, color: 'bg-[#00A3FF]', ringColor: 'border-[#00A3FF]/40', icon: '🐯' },
  { id: 'TIE', label: 'TIE', multiplier: 30, color: 'bg-[#9333EA]', ringColor: 'border-[#9333EA]/40', icon: '🤝' },
  { id: 'LION', label: 'LION', multiplier: 2, color: 'bg-[#FF0066]', ringColor: 'border-[#FF0066]/40', icon: '🦁' },
];

/**
 * Lion Fight - High-Fidelity Combat Arena.
 * Re-engineered to match the shining, glossy Midjourney-style blueprint.
 */
export default function LionFightPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'fighting' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
  const [betAmount, setBetAmount] = useState(100);
  const [currency, setCurrency] = useState<'coins' | 'diamonds'>('coins');
  const [myBets, setMyBets] = useState<Record<string, number>>({ TIGER: 0, TIE: 0, LION: 0 });
  const [totalBets, setTotalBets] = useState<Record<string, number>>({ TIGER: 22400, TIE: 60700, LION: 377600 });
  const [roundNumber, setRoundNumber] = useState(524265);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

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

  const playSound = useCallback((freq: number, type: OscillatorType = 'sine') => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
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
        else startFight();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startFight = () => {
    setGameState('fighting');
    playSound(400, 'sawtooth'); // Bell sound
    setTimeout(() => {
      const results = ['TIGER', 'LION', 'TIE'];
      const winId = results[Math.floor(Math.random() * results.length)];
      showResult(winId);
    }, 4000);
  };

  const showResult = (winId: string) => {
    setWinner(winId);
    setGameState('result');
    setRoundNumber(prev => prev + 1);

    const winMultiplier = BET_OPTIONS.find(o => o.id === winId)?.multiplier || 0;
    const winAmount = (myBets[winId] || 0) * winMultiplier;

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      const field = currency === 'coins' ? 'wallet.coins' : 'wallet.diamonds';
      const updateData = { 
        [field]: increment(winAmount), 
        'stats.dailyGameWins': increment(winAmount),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
      toast({ title: 'Big Win Sync!', description: `Synchronized ${winAmount.toLocaleString()} to your vault.` });
    }

    setTimeout(() => {
      setMyBets({ TIGER: 0, TIE: 0, LION: 0 });
      setTotalBets({ TIGER: 22400 + Math.floor(Math.random() * 5000), TIE: 60700 + Math.floor(Math.random() * 2000), LION: 377600 + Math.floor(Math.random() * 10000) });
      setWinner(null);
      setGameState('betting');
      setTimeLeft(15);
    }, 5000);
  };

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || !currentUser || !userProfile) return;
    const currentBalance = currency === 'coins' ? (userProfile.wallet?.coins || 0) : (userProfile.wallet?.diamonds || 0);
    
    if (currentBalance < betAmount) {
      toast({ variant: 'destructive', title: 'Insufficient Funds' });
      return;
    }
    
    playSound(800);
    const field = currency === 'coins' ? 'wallet.coins' : 'wallet.diamonds';
    const updateData = { [field]: increment(-betAmount), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + betAmount }));
    setTotalBets(prev => ({ ...prev, [id]: (prev[id] || 0) + betAmount }));
  };

  const adjustBet = (dir: 'plus' | 'minus') => {
    setBetAmount(prev => dir === 'plus' ? prev + 100 : Math.max(10, prev - 100));
    playSound(600);
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="text-8xl animate-bounce drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">🦁</div>
        <h1 className="text-6xl font-black text-[#FFCC00] uppercase italic tracking-tighter drop-shadow-2xl">Lion Fight</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Initializing Arena...</p>
      </div>
    );
  }

  const stageAsset = PlaceHolderImages.find(img => img.id === 'lion-fight-bg');
  const tigerAsset = PlaceHolderImages.find(img => img.id === 'tiger-fighter');
  const lionAsset = PlaceHolderImages.find(img => img.id === 'lion-fighter');

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#1a0a2e] flex flex-col relative overflow-hidden font-headline text-white select-none">
        <CompactRoomView />

        {/* Global Victory Overlay */}
        {gameState === 'result' && winner && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-500">
             <div className="relative mb-12 flex flex-col items-center gap-4">
                <Trophy className="h-24 w-24 text-yellow-400 animate-bounce drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
                <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter text-center drop-shadow-lg">
                   {winner} VICTORIOUS
                </h2>
             </div>
          </div>
        )}

        {/* Background Visual Sync */}
        <div className="absolute inset-0 z-0">
           {stageAsset && (
             <img src={stageAsset.imageUrl} className="h-full w-full object-cover opacity-40 scale-110" alt="Stage" />
           )}
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#1a0a2e]" />
        </div>

        {/* Header Sync */}
        <header className="relative z-50 flex items-center justify-between p-4 pt-32 px-6">
           <div className="flex gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className="bg-indigo-600/80 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-90 transition-all">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
           </div>
           
           <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <div className="bg-gradient-to-b from-indigo-50 to-indigo-900 border-2 border-indigo-400 rounded-full px-8 py-1.5 shadow-2xl relative z-10">
                 <span className="text-lg font-black text-white italic tracking-tight">Round: {roundNumber}</span>
              </div>
           </div>

           <div className="flex gap-2">
              <button className="bg-indigo-600/80 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg"><FileText className="h-5 w-5" /></button>
              <button className="bg-indigo-600/80 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg"><HelpCircle className="h-5 w-5" /></button>
           </div>
        </header>

        {/* Combat Dimension */}
        <main className="flex-1 relative z-10 flex flex-col pt-4">
           {/* Fighters Row */}
           <div className="flex justify-between items-center px-10 h-48 relative">
              {/* Tiger Side */}
              <div className={cn(
                "relative flex flex-col items-center transition-all duration-500",
                gameState === 'fighting' ? "animate-bounce scale-110" : "scale-100",
                winner === 'TIGER' && "scale-125 z-50 brightness-125"
              )}>
                 <div className="relative h-36 w-36">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse rounded-full" />
                    <Avatar className="h-full w-full border-4 border-blue-400 shadow-[0_0_30px_rgba(0,163,255,0.4)]">
                       <AvatarImage src={tigerAsset?.imageUrl} className="object-cover" />
                       <AvatarFallback className="text-4xl">🐯</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-4 bg-blue-600 p-2 rounded-2xl border-2 border-white shadow-xl animate-reaction-shock">
                       <Zap className="h-6 w-6 text-white fill-current" />
                    </div>
                 </div>
              </div>

              {/* VS Centerpiece */}
              <div className="flex flex-col items-center gap-4">
                 <div className="relative">
                    <span className="text-5xl font-black text-white italic tracking-tighter opacity-20 select-none uppercase">Lion Fight</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1 rounded-lg">
                          <span className="text-xl font-black italic text-white">VS</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Lion Side */}
              <div className={cn(
                "relative flex flex-col items-center transition-all duration-500",
                gameState === 'fighting' ? "animate-bounce scale-110" : "scale-100",
                winner === 'LION' && "scale-125 z-50 brightness-125"
              )}>
                 <div className="relative h-36 w-36">
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl animate-pulse rounded-full" />
                    <Avatar className="h-full w-full border-4 border-pink-400 shadow-[0_0_30px_rgba(255,0,102,0.4)]">
                       <AvatarImage src={lionAsset?.imageUrl} className="object-cover" />
                       <AvatarFallback className="text-4xl">🦁</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -left-4 bg-pink-600 p-2 rounded-2xl border-2 border-white shadow-xl animate-reaction-shock">
                       <Star className="h-6 w-6 text-white fill-current" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Betting Countdown Sync */}
           <div className="w-full text-center py-4 bg-black/20 backdrop-blur-sm border-y border-white/5 mt-4">
              <span className="text-lg font-black uppercase italic text-white/90">
                 {gameState === 'betting' ? `Bet time: ${timeLeft}s` : 'FIGHTING...'}
              </span>
           </div>

           {/* Betting Grid - The 3 Main Capsules */}
           <div className="flex-1 px-4 py-6 grid grid-cols-3 gap-3">
              {BET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handlePlaceBet(opt.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative flex flex-col items-center rounded-[2.5rem] border-[3px] transition-all overflow-hidden active:scale-95 group",
                    opt.ringColor,
                    gameState !== 'betting' && "opacity-60",
                    winner === opt.id && "ring-4 ring-yellow-400 z-20 scale-105"
                  )}
                >
                   {/* Shining Gloss Overlay */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent z-10" />
                   <div className="absolute inset-0 w-1/2 h-full bg-white/5 skew-x-[-30deg] -translate-x-[200%] group-hover:animate-shine pointer-events-none z-20" />

                   {/* Header Tag */}
                   <div className={cn("w-full py-2 flex items-center justify-center gap-1 shadow-inner", opt.color)}>
                      <span className="text-lg">{opt.icon}</span>
                      <span className="text-sm font-black text-white italic">X {opt.multiplier}</span>
                   </div>

                   {/* Main Betting Info */}
                   <div className="flex-1 w-full bg-[#1a1a3a] p-4 flex flex-col items-center justify-center gap-4">
                      <div className="flex flex-col items-center">
                         <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                            <GoldCoinIcon className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase opacity-60">Xcoin</span>
                         </div>
                         <span className="text-2xl font-black italic text-white tracking-tighter">
                            {totalBets[opt.id].toLocaleString()}
                         </span>
                      </div>

                      {/* User Specific Bet Box */}
                      <div className="w-full bg-black/40 rounded-2xl py-2 px-3 flex flex-col items-center border border-white/5 shadow-inner">
                         <div className="flex items-center gap-1.5 text-yellow-500">
                            <GoldCoinIcon className="h-3 w-3" />
                            <span className="text-[8px] font-bold uppercase opacity-60">Me</span>
                         </div>
                         <span className="text-lg font-black italic text-yellow-400">
                            {myBets[opt.id].toLocaleString()}
                         </span>
                      </div>
                   </div>
                </button>
              ))}
           </div>
        </main>

        {/* High-Fidelity Bottom Sync Portal */}
        <footer className="relative z-50 p-6 bg-gradient-to-t from-indigo-950 via-indigo-900/80 to-transparent pb-12">
           <div className="max-w-md mx-auto flex items-center justify-between gap-6">
              {/* Currency Toggle */}
              <div className="bg-black/40 p-1 rounded-full border border-white/10 flex items-center shadow-inner">
                 <button 
                   onClick={() => setCurrency('coins')}
                   className={cn("h-10 px-4 rounded-full flex items-center gap-2 transition-all", currency === 'coins' ? "bg-yellow-500 shadow-lg" : "opacity-40")}
                 >
                    <GoldCoinIcon className="h-5 w-5" />
                 </button>
                 <button 
                   onClick={() => setCurrency('diamonds')}
                   className={cn("h-10 px-4 rounded-full flex items-center gap-2 transition-all", currency === 'diamonds' ? "bg-cyan-500 shadow-lg" : "opacity-40")}
                 >
                    <GemIcon className="h-5 w-5 text-white fill-current" />
                 </button>
              </div>

              {/* Amount Synchronizer */}
              <div className="flex-1 flex items-center justify-between bg-indigo-950/60 rounded-full border-2 border-indigo-500/40 p-1 shadow-2xl">
                 <button 
                   onClick={() => adjustBet('minus')}
                   className="h-12 w-12 rounded-full bg-indigo-600/40 flex items-center justify-center border border-white/10 active:scale-90"
                 >
                    <Minus className="h-6 w-6" />
                 </button>
                 
                 <div className="flex-1 text-center">
                    <span className="text-3xl font-black italic text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                       {betAmount}
                    </span>
                 </div>

                 <button 
                   onClick={() => adjustBet('plus')}
                   className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center border border-white/20 shadow-lg active:scale-90"
                 >
                    <Plus className="h-6 w-6" />
                 </button>
              </div>
           </div>
        </footer>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}

function GemIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l10 12"/><path d="M13 3l3 6-10 12"/><path d="M2 9h20"/>
    </svg>
  );
}