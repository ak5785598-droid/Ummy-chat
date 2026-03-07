'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Trophy, 
  ChevronLeft,
  X,
  Clock,
  History,
  LayoutGrid
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const CHIPS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 100, label: '100' },
  { value: 1000, label: '1K' },
  { value: 5000, label: '5K' },
];

/**
 * WIN GO SPIN Dimension.
 * Re-engineered for high-fidelity tribal betting frequency.
 */
export default function WinGoSpinPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(5);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<number[]>([3, 7, 2, 0, 9, 1, 5, 4]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);
  const [winningNum, setWinningNumber] = useState<number | null>(null);

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
    setTimeout(() => {
      const target = Math.floor(Math.random() * 10);
      showResult(target);
    }, 3000);
  };

  const showResult = (num: number) => {
    setWinningNumber(num);
    setHistory(prev => [num, ...prev].slice(0, 15));
    
    let totalWin = 0;
    // Number Multiplier: 9.7x
    if (myBets[num.toString()]) totalWin += myBets[num.toString()] * 9.7;
    
    // Green (1,3,7,9): 2x
    if ([1,3,7,9].includes(num) && myBets['GREEN']) totalWin += myBets['GREEN'] * 2;
    // Red (2,4,6,8): 2x
    if ([2,4,6,8].includes(num) && myBets['RED']) totalWin += myBets['RED'] * 2;
    // Purple (0,5): 4.85x
    if ([0,5].includes(num) && myBets['PURPLE']) totalWin += myBets['PURPLE'] * 4.85;

    const sessionWinners = [];
    if (totalWin > 0 && userProfile) {
      sessionWinners.push({ name: userProfile.username, win: Math.floor(totalWin), avatar: userProfile.avatarUrl });
    }

    setWinners(sessionWinners);
    setGameState('result');

    if (totalWin > 0 && currentUser && firestore) {
      const updateData = { 
        'wallet.coins': increment(Math.floor(totalWin)), 
        'stats.dailyGameWins': increment(Math.floor(totalWin)),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setTimeout(() => {
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
    
    const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center space-y-6 font-headline text-white">
        <div className="text-8xl animate-bounce">🎰</div>
        <h1 className="text-6xl font-black text-[#00E676] uppercase italic tracking-tighter drop-shadow-2xl">WIN GO SPIN</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Initializing Sync Grid...</p>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#0a0a0a] flex flex-col relative overflow-hidden font-headline text-white select-none">
        <CompactRoomView />

        {gameState === 'result' && winners.length > 0 && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-500 p-6">
             <div className="relative mb-12 flex flex-col items-center gap-4">
                <Trophy className="h-20 w-20 text-yellow-400 animate-bounce" />
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter text-center">Winner Sync</h2>
             </div>
             <div className="flex items-end justify-center gap-4 w-full max-w-lg">
                {winners.map((winner, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-20 duration-700">
                     <Avatar className="border-4 shadow-xl h-24 w-24 border-yellow-400">
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

        <header className="relative z-[110] flex items-center justify-between p-4 pt-32">
           <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full backdrop-blur-md"><ChevronLeft className="h-6 w-6" /></button>
           <div className="bg-[#1a1a1a] border-2 border-[#00E676] px-8 py-1 rounded-full shadow-[0_0_20px_rgba(0,230,118,0.3)]">
              <span className="text-2xl font-black italic text-[#00E676] uppercase tracking-widest">WIN GO SPIN</span>
           </div>
           <button className="p-2 bg-white/10 rounded-full backdrop-blur-md"><HelpCircle className="h-6 w-6" /></button>
        </header>

        <main className="flex-1 flex flex-col px-4 pt-4 overflow-hidden relative z-10">
           {/* Top Scrolling Reel */}
           <div className="bg-[#1a1a1a] rounded-3xl p-4 border border-white/5 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none" />
              <div className={cn(
                "flex justify-around gap-2 py-4",
                gameState === 'spinning' && "animate-marquee"
              )}>
                 {NUMBERS.concat(NUMBERS).map((n, i) => (
                   <div key={i} className={cn(
                     "h-16 w-16 rounded-full shrink-0 flex items-center justify-center text-3xl font-black border-4 transition-all duration-500",
                     winningNum === n && gameState === 'result' ? "bg-white text-black scale-125 shadow-2xl" : "bg-black/40 border-white/10 text-white/40"
                   )}>
                      {n}
                   </div>
                 ))}
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-yellow-400/40 z-20" />
           </div>

           {/* Betting Grid */}
           <div className="grid grid-cols-3 gap-3 mb-6">
              <button onClick={() => handlePlaceBet('GREEN')} className="bg-[#4CAF50] h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all">
                 <span className="text-sm font-black uppercase italic">Green</span>
                 <span className="text-[10px] font-bold opacity-60">2x</span>
                 {myBets['GREEN'] > 0 && <Badge className="mt-1 bg-white/20 text-white">{myBets['GREEN']}</Badge>}
              </button>
              <button onClick={() => handlePlaceBet('PURPLE')} className="bg-[#9C27B0] h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all">
                 <span className="text-sm font-black uppercase italic">Purple</span>
                 <span className="text-[10px] font-bold opacity-60">4.85x</span>
                 {myBets['PURPLE'] > 0 && <Badge className="mt-1 bg-white/20 text-white">{myBets['PURPLE']}</Badge>}
              </button>
              <button onClick={() => handlePlaceBet('RED')} className="bg-[#F44336] h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all">
                 <span className="text-sm font-black uppercase italic">Red</span>
                 <span className="text-[10px] font-bold opacity-60">2x</span>
                 {myBets['RED'] > 0 && <Badge className="mt-1 bg-white/20 text-white">{myBets['RED']}</Badge>}
              </button>
           </div>

           {/* Number Pad */}
           <div className="grid grid-cols-5 gap-2 mb-6">
              {NUMBERS.map(n => (
                <button 
                  key={n} 
                  onClick={() => handlePlaceBet(n.toString())}
                  className="aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center active:scale-90 transition-all"
                >
                   <span className="text-2xl font-black">{n}</span>
                   {myBets[n.toString()] > 0 && <span className="text-[8px] font-black text-yellow-400">{myBets[n.toString()]}</span>}
                </button>
              ))}
           </div>

           {/* History Bar */}
           <div className="bg-black/40 rounded-full p-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
              <span className="text-[8px] font-black text-white/40 uppercase pl-4">History</span>
              {history.map((h, i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black shrink-0 border border-white/10">{h}</div>
              ))}
           </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-[120]">
           <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-full flex items-center gap-2 pl-3 pr-6 py-2 border border-white/10">
                 <GoldCoinIcon className="h-6 w-6" />
                 <span className="text-xl font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
              <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-2">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value} 
                    onClick={() => setSelectedChip(chip.value)} 
                    className={cn(
                      "h-12 w-12 rounded-full border-2 transition-all flex items-center justify-center shrink-0 shadow-lg relative", 
                      selectedChip === chip.value ? "bg-white text-black border-white scale-110 z-10" : "bg-white/5 border-white/10 text-white/40"
                    )}
                   >
                      <span className="text-[10px] font-black italic">{chip.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </footer>

        <style jsx global>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 0.5s linear infinite; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </AppLayout>
  );
}
