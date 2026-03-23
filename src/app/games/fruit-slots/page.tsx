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
  Clock, 
  Plus, 
  Crown, 
  PhoneOff,
  History,
  MoreHorizontal,
  Settings2,
  Trophy,
  Loader,
  X
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const FRUITS = [
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: 'x5', pos: 0 },
  { id: 'grapes', emoji: '🍇', multiplier: 10, label: 'x10', pos: 1 },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: 'x5', pos: 2 },
  { id: 'apple', emoji: '🍎', multiplier: 25, label: 'x25', pos: 5 },
  { id: 'pear', emoji: '🍐', multiplier: 5, label: 'x5', pos: 8 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: 'x15', pos: 7 },
  { id: 'mango', emoji: '🥭', multiplier: 5, label: 'x5', pos: 6 },
  { id: 'cherry', emoji: '🍒', multiplier: 45, label: 'x45', pos: 3 },
];

const CHIPS = [
  { value: 500, label: '500', color: 'bg-[#4CAF50] border-[#2E7D32]' },
  { value: 5000, label: '5,000', color: 'bg-[#F44336] border-[#C62828]' },
  { value: 50000, label: '50,000', color: 'bg-[#F44336] border-[#C62828]' },
  { value: 500000, label: '500,000', color: 'bg-[#F44336] border-[#C62828]' },
];

export default function FruitSlotsPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(500);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(['pear', 'pear', 'mango', 'cherry', 'mango', 'apple', 'pear', 'pear', 'pear', 'pear', 'orange', 'grapes']);
  const [isMuted, setIsMuted] = useState(false);
  const [todayProfits, setTodayProfits] = useState(3525500000);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);

  const chaseSequence = [0, 1, 2, 5, 8, 7, 6, 3];

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
    const targetIdx = Math.floor(Math.random() * chaseSequence.length);
    
    let currentStep = 0;
    const totalSteps = 24 + targetIdx;
    let speed = 60;

    const runChase = () => {
      setHighlightIdx(chaseSequence[currentStep % chaseSequence.length]);
      currentStep++;
      if (currentStep < totalSteps) {
        if (totalSteps - currentStep < 8) speed += 40;
        setTimeout(runChase, speed);
      } else {
        const winningId = FRUITS.find(f => f.pos === chaseSequence[targetIdx])!.id;
        setTimeout(() => showResult(winningId), 800);
      }
    };
    runChase();
  };

  const showResult = (id: string) => {
    const winItem = FRUITS.find(i => i.id === id);
    const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);

    setHistory(prev => [id, ...prev].slice(0, 15));
    setGameState('result');

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      const updateData = { 
        'wallet.coins': increment(winAmount),
        'stats.dailyGameWins': increment(winAmount),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
      setTodayProfits(prev => prev + winAmount);
      setWinners([{ name: userProfile.username, win: winAmount, avatar: userProfile.avatarUrl }]);
    }

    setTimeout(() => {
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
    
    const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="text-8xl animate-bounce">🍋</div>
        <h1 className="text-6xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-2xl">Fruit Slots</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Syncing Tribal Grid...</p>
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
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">Big Win Sync</h2>
             </div>
             
             <div className="flex items-end justify-center gap-4 w-full max-w-lg">
                {winners.map((winner, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-20 duration-700">
                     <Avatar className="h-24 w-24 border-4 border-yellow-400 shadow-xl">
                        <AvatarImage src={winner.avatar || undefined}/><AvatarFallback>W</AvatarFallback>
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
           <div className="absolute inset-0 bg-gradient-to-b from-[#4a148c] via-[#311b92] to-[#1a237e]" />
           <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-blue-500/20 to-transparent flex flex-col justify-around py-40">
              {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="w-4 h-8 bg-blue-400 rounded-sm blur-[2px] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
           </div>
           <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-pink-500/20 to-transparent flex flex-col justify-around py-40">
              {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="w-4 h-8 bg-pink-400 rounded-sm blur-[2px] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
           </div>
        </div>

        <header className="relative z-[110] flex items-center justify-between px-4 pt-32 pb-2">
           <div className="flex gap-1">
              <button className="bg-black/40 p-1.5 rounded-md border border-white/10"><Crown className="h-4 w-4 text-yellow-500" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-black/40 p-1.5 rounded-md border border-white/10">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button className="bg-black/40 p-1.5 rounded-md border border-white/10"><Settings2 className="h-4 w-4" /></button>
           </div>
           
           <div className="flex-1 mx-2">
              <div className="bg-[#3d2b1f] border-2 border-[#b88a44] rounded-full py-1 text-center shadow-lg px-4">
                 <span className="text-[10px] font-black uppercase italic text-[#f5e1a4]">Round 518 of Today</span>
              </div>
           </div>

           <div className="flex gap-1">
              <button className="bg-black/40 p-1.5 rounded-md border border-white/10"><Clock className="h-4 w-4" /></button>
              <button className="bg-black/40 p-1.5 rounded-md border border-white/10"><HelpCircle className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-black/40 p-1.5 rounded-md border border-white/10 text-white"><X className="h-4 w-4" /></button>
           </div>
        </header>

        <main className="flex-1 flex flex-col items-center px-4 relative z-10 pb-4">
           <div className="w-full max-w-sm relative p-4 bg-gradient-to-b from-[#ffd700] via-[#b8860b] to-[#8b4513] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-yellow-200/30">
              <div className="absolute inset-2 border-2 border-dashed border-white/20 rounded-[2rem] pointer-events-none" />
              
              <div className="grid grid-cols-3 gap-2 p-2 bg-[#1a0a2e] rounded-[2rem] relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                 
                 {Array.from({ length: 9 }).map((_, idx) => {
                   const fruit = FRUITS.find(f => f.pos === idx);
                   const isCenter = idx === 4;
                   const isWinning = fruit && fruit.id === FRUITS.find(f => f.pos === highlightIdx)?.id && gameState === 'result';

                   if (isCenter) {
                     return (
                       <div key={idx} className="aspect-square flex flex-col items-center justify-center bg-black/40 rounded-2xl border-2 border-yellow-500/20 shadow-inner">
                          <span className="text-5xl font-black text-yellow-400 italic tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                             {gameState === 'spinning' ? '🎲' : timeLeft}
                          </span>
                       </div>
                     );
                   }

                   if (!fruit) return <div key={idx} className="aspect-square" />;

                   return (
                     <button
                       key={idx}
                       onClick={() => handlePlaceBet(fruit.id)}
                       disabled={gameState !== 'betting'}
                       className={cn(
                         "relative aspect-square rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center group active:scale-95 overflow-hidden",
                         highlightIdx === idx ? "bg-green-500 border-white shadow-[0_0_20px_#4caf50]" : "bg-gradient-to-br from-purple-900/60 to-purple-950/80 border-white/10",
                         isWinning && "animate-pulse"
                       )}
                     >
                        <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform">{fruit.emoji}</span>
                        <span className="text-[10px] font-black text-yellow-500 mt-1 uppercase italic">{fruit.label}</span>
                        
                        {myBets[fruit.id] > 0 && (
                          <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center pointer-events-none">
                             <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                                <span className="text-[8px] font-black text-yellow-400">{myBets[fruit.id].toLocaleString()}</span>
                             </div>
                          </div>
                        )}
                     </button>
                   );
                 })}
              </div>

              <div className="mt-4 flex justify-between px-4">
                 <div className="w-12 h-12 rounded-full bg-black/40 border-2 border-yellow-500/20 shadow-inner flex items-center justify-center">
                    <div className="w-1 h-6 bg-yellow-500/40 rounded-full" />
                 </div>
                 <div className="flex gap-2">
                    <div className="w-20 h-14 bg-black/40 rounded-xl border-2 border-pink-500/30 flex items-center justify-center">
                       <span className="text-2xl">🧺</span>
                    </div>
                    <div className="w-20 h-14 bg-black/40 rounded-xl border-2 border-pink-500/30 flex items-center justify-center">
                       <span className="text-2xl">🍎</span>
                    </div>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-black/40 border-2 border-yellow-500/20 shadow-inner flex items-center justify-center">
                    <div className="w-1 h-6 bg-yellow-500/40 rounded-full" />
                 </div>
              </div>
           </div>

           <div className="mt-6 w-full max-w-sm grid grid-cols-4 gap-3 px-2">
              {CHIPS.map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setSelectedChip(chip.value)}
                  className={cn(
                    "h-14 rounded-2xl border-b-4 flex flex-col items-center justify-center transition-all active:translate-y-1 active:border-b-0",
                    chip.color,
                    selectedChip === chip.value ? "scale-110 ring-2 ring-white/50 z-10" : "opacity-80 grayscale-[0.2]"
                  )}
                >
                   <span className="text-sm font-black italic text-white drop-shadow-md">{chip.label}</span>
                </button>
              ))}
           </div>

           <div className="mt-6 w-full max-w-sm flex gap-3">
              <div className="flex-1 bg-gradient-to-b from-[#1e3a8a] to-[#1e1b4b] rounded-2xl p-3 border-2 border-blue-400/20 shadow-xl relative group active:scale-95 transition-all cursor-pointer">
                 <p className="text-[10px] font-black uppercase text-blue-200/60 mb-1">Gold Coins left</p>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                       <GoldCoinIcon className="h-4 w-4" />
                       <span className="text-sm font-black text-white italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-blue-400 rounded-full h-4 w-4 flex items-center justify-center border border-white shadow-lg">
                       <Plus className="h-2.5 w-2.5 text-black" />
                    </div>
                 </div>
              </div>

              <div className="flex-1 bg-gradient-to-b from-[#1e3a8a] to-[#1e1b4b] rounded-2xl p-3 border-2 border-blue-400/20 shadow-xl">
                 <p className="text-[10px] font-black uppercase text-blue-200/60 mb-1">Today's profits</p>
                 <div className="flex items-center gap-1.5">
                    <GoldCoinIcon className="h-4 w-4" />
                    <span className="text-sm font-black text-yellow-400 italic">{todayProfits.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </main>

        <footer className="relative z-50 p-4 pb-10 bg-black/40 backdrop-blur-md border-t border-white/5">
           <div className="max-w-sm mx-auto flex items-center gap-3">
              <div className="bg-red-900/40 px-3 py-1 rounded-full border border-red-500/20">
                 <span className="text-[10px] font-black uppercase italic">Result</span>
              </div>
              <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
                 {history.map((id, i) => (
                   <div key={i} className="relative shrink-0 flex flex-col items-center">
                      <div className="h-8 w-8 bg-black/40 rounded-full border border-white/10 flex items-center justify-center text-xl shadow-inner">
                         {FRUITS.find(f => f.pos === id)?.emoji}
                      </div>
                      {i === 0 && <span className="absolute -top-1 -right-1 bg-green-500 text-[6px] px-1 rounded-full font-black animate-pulse">New</span>}
                   </div>
                 ))}
              </div>
           </div>
        </footer>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
