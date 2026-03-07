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
  X,
  History,
  Move,
  ChevronDown,
  Users
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const CHIPS = [
  { value: 100, label: '100', color: 'bg-blue-500' },
  { value: 5000, label: '5K', color: 'bg-green-500' },
  { value: 50000, label: '50K', color: 'bg-yellow-500' },
  { value: 100000, label: '100K', color: 'bg-orange-500' },
  { value: 500000, label: '500K', color: 'bg-red-500' },
  { value: 1000000, label: '1M', color: 'bg-pink-500' },
  { value: 100000000, label: '100M', color: 'bg-purple-500' },
  { value: 500000000, label: '500M', color: 'bg-cyan-500' },
];

const BET_OPTIONS = [
  { id: '0', label: '0', multiplier: 36, color: 'bg-emerald-600' },
  { id: '1-12', label: '1-12', multiplier: 3, color: 'bg-emerald-800' },
  { id: '13-24', label: '13-24', multiplier: 3, color: 'bg-emerald-800' },
  { id: '25-36', label: '25-36', multiplier: 3, color: 'bg-emerald-800' },
  { id: 'red', label: 'Red', multiplier: 2, color: 'bg-red-600' },
  { id: 'black', label: 'Black', multiplier: 2, color: 'bg-slate-900' },
  { id: 'single', label: 'Single', multiplier: 2, color: 'bg-emerald-700' },
  { id: 'double', label: 'Double', multiplier: 2, color: 'bg-emerald-700' },
];

/**
 * High-Fidelity Roulette Dimension.
 * Re-engineered for absolute visual stability and elite chip synchronization.
 */
export default function RoulettePage() {
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
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<number[]>([16, 2, 34, 17, 0, 25, 11]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);

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
    const targetNum = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
    const targetIdx = NUMBERS.indexOf(targetNum);
    
    const sliceDeg = 360 / 37;
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const targetRotation = rotation + (extraSpins * 360) + (targetIdx * sliceDeg);
    
    setRotation(targetRotation);

    setTimeout(() => {
      showResult(targetNum);
    }, 5000);
  };

  const showResult = (num: number) => {
    setWinningNumber(num);
    setHistory(prev => [num, ...prev].slice(0, 15));
    
    let winAmount = 0;
    const isRed = RED_NUMBERS.includes(num);
    const isBlack = num !== 0 && !isRed;
    const isSingle = num % 2 !== 0; 
    const isDouble = num !== 0 && num % 2 === 0; 

    if (num === 0) winAmount += (myBets['0'] || 0) * 36;
    if (num >= 1 && num <= 12) winAmount += (myBets['1-12'] || 0) * 3;
    if (num >= 13 && num <= 24) winAmount += (myBets['13-24'] || 0) * 3;
    if (num >= 25 && num <= 36) winAmount += (myBets['25-36'] || 0) * 3;
    if (isRed) winAmount += (myBets['red'] || 0) * 2;
    if (isBlack) winAmount += (myBets['black'] || 0) * 2;
    if (isSingle) winAmount += (myBets['single'] || 0) * 2;
    if (isDouble) winAmount += (myBets['double'] || 0) * 2;

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
      setLastBets(myBets);
      setMyBets({});
      setWinners([]);
      setWinningNumber(null);
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
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6 font-headline text-white">
        <div className="text-8xl animate-bounce">🎡</div>
        <h1 className="text-6xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-2xl">Roulette</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Synchronizing Wheel...</p>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#311b92] flex flex-col relative overflow-hidden font-headline text-white select-none">
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

        <header className="relative z-50 flex items-center justify-between p-4 pt-32">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full backdrop-blur-md"><Move className="h-5 w-5" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full backdrop-blur-md">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">ROULETTE LIVE SYNC</span>
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-md px-2 py-0.5 flex items-center gap-1">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] font-black text-emerald-400">Synchronized</span>
              </div>
           </div>
           <div className="flex gap-2">
              <button className="bg-white/10 p-2 rounded-full backdrop-blur-md"><HelpCircle className="h-5 w-5" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full backdrop-blur-md"><X className="h-5 w-5" /></button>
           </div>
        </header>

        <div className="relative flex-1 flex flex-col items-center justify-center p-4">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="relative w-64 h-64 z-10 transition-transform duration-[5000ms] ease-out" style={{ transform: `rotate(-${rotation}deg)` }}>
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                 <circle cx="50" cy="50" r="48" fill="#3d2b1f" stroke="#b88a44" strokeWidth="4" />
                 {NUMBERS.map((num, i) => {
                   const angle = (i * 360) / 37;
                   const isRed = RED_NUMBERS.includes(num);
                   const isZero = num === 0;
                   return (
                     <g key={num} transform={`rotate(${angle}, 50, 50)`}>
                        <path 
                          d="M 50 2 L 54 2 L 52 15 L 48 15 Z" 
                          fill={isZero ? '#10b981' : isRed ? '#ef4444' : '#1a1a1a'} 
                          stroke="#3d2b1f" 
                          strokeWidth="0.2"
                        />
                        <text 
                          x="50" y="8" 
                          fontSize="3" 
                          textAnchor="middle" 
                          fill="white" 
                          fontWeight="black" 
                          transform={`rotate(180, 50, 8)`}
                        >
                          {num}
                        </text>
                     </g>
                   );
                 })}
                 <circle cx="50" cy="50" r="15" fill="#b88a44" />
                 <circle cx="50" cy="50" r="12" fill="#3d2b1f" opacity="0.2" />
                 <path d="M 50 35 L 50 65 M 35 50 L 65 50" stroke="#b88a44" strokeWidth="3" strokeLinecap="round" />
                 <circle cx="50" cy="35" r="2" fill="#b88a44" />
                 <circle cx="50" cy="65" r="2" fill="#b88a44" />
                 <circle cx="35" cy="50" r="2" fill="#b88a44" />
                 <circle cx="65" cy="50" r="2" fill="#b88a44" />
                 <circle cx="50" cy="50" r="4" fill="#fcd34d" />
              </svg>
           </div>

           <div className="absolute top-[calc(50%-132px)] left-1/2 -translate-x-1/2 z-20">
              <div className="w-4 h-6 bg-yellow-400 clip-path-triangle" />
           </div>

           <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
              <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col items-center">
                 <span className="text-[8px] font-black text-white/40 uppercase">NEW</span>
                 <div className={cn(
                   "h-10 w-10 rounded-lg flex items-center justify-center text-xl font-black italic shadow-lg",
                   RED_NUMBERS.includes(history[0]) ? "bg-red-600" : history[0] === 0 ? "bg-emerald-600" : "bg-slate-900"
                 )}>
                    {history[0]}
                 </div>
                 <ChevronDown className="h-3 w-3 text-white/40 mt-1" />
              </div>
              <div className="relative">
                 <div className="h-12 w-12 rounded-full border-2 border-white/20 bg-black/40 flex items-center justify-center shadow-xl">
                    <span className="text-xl font-black italic text-yellow-400">{gameState === 'betting' ? timeLeft : '🎲'}</span>
                 </div>
                 <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                    <HelpCircle className="h-2 w-2 text-black" />
                 </div>
              </div>
           </div>

           <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
              <button className="bg-emerald-500/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-xl active:scale-95 transition-transform">
                 <Users className="h-4 w-4 text-white" />
                 <span className="text-xs font-black uppercase italic">Player</span>
              </button>
           </div>
        </div>

        <div className="bg-emerald-600/20 backdrop-blur-3xl rounded-t-[3rem] p-4 pb-10 border-t-2 border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
           <div className="grid grid-cols-4 gap-2 mb-6">
              {BET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handlePlaceBet(opt.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative aspect-[4/3] rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-0.5 group active:scale-95 overflow-hidden",
                    "border-white/5",
                    opt.color,
                    gameState !== 'betting' && "opacity-60"
                  )}
                >
                   <div className="absolute top-1 right-2 flex items-center gap-0.5">
                      <span className="text-[8px] font-black text-yellow-400">{(myBets[opt.id] || 0).toLocaleString()}</span>
                   </div>
                   <h4 className="text-base font-black uppercase italic tracking-tighter">{opt.label}</h4>
                   <span className="text-[10px] font-bold text-white/60">x{opt.multiplier}</span>
                   
                   {myBets[opt.id] > 0 && (
                     <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center pointer-events-none">
                        <div className="h-8 w-8 rounded-full border-2 border-dashed border-yellow-400/40 animate-spin-slow" />
                        <div className="absolute bg-white text-blue-600 rounded-full h-6 w-6 flex items-center justify-center text-[8px] font-black shadow-lg">
                           {selectedChip >= 1000 ? `${(selectedChip/1000)}k` : selectedChip}
                        </div>
                     </div>
                   )}
                </button>
              ))}
           </div>

           <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black uppercase text-white/40 truncate w-24">{(userProfile?.username || 'GUEST').slice(0, 8)}...</span>
                 <div className="bg-black/40 rounded-full px-3 py-1 flex items-center gap-2 border border-white/5 shadow-inner">
                    <GoldCoinIcon className="h-4 w-4" />
                    <span className="text-xs font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 </div>
              </div>

              <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar py-2">
                 {CHIPS.map((chip) => (
                   <button
                     key={chip.value}
                     onClick={() => setSelectedChip(chip.value)}
                     className={cn(
                       "h-12 w-12 rounded-full border-2 transition-all flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group active:scale-90",
                       selectedChip === chip.value ? "border-white scale-110 ring-4 ring-white/20 z-10" : "border-white/10 opacity-60 grayscale-[0.2]",
                       chip.color
                     )}
                   >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
                      <span className="text-[10px] font-black text-white italic drop-shadow-md">{chip.label}</span>
                   </button>
                 ))}
              </div>

              <button 
                onClick={handleRepeat}
                disabled={gameState !== 'betting'}
                className="bg-gray-200 text-gray-800 px-6 h-12 rounded-2xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition-transform"
              >
                 Repeat
              </button>
           </div>
        </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .clip-path-triangle { clip-path: polygon(50% 100%, 0 0, 100% 0); }
          .animate-spin-slow { animation: spin 10s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </AppLayout>
  );
}
