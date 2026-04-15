'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 History,
 X,
 Volume2,
 VolumeX,
 HelpCircle,
 Menu,
 ChevronLeft,
 Plus,
 Minus,
 Trophy
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const SYMBOLS = [
 { id: 'lips', emoji: '💋', value: 10 },
 { id: 'watch', emoji: '⌚', value: 15 },
 { id: 'diamond', emoji: '💎', value: 20 },
 { id: 'cash', emoji: '💵', value: 25 },
 { id: 'car', emoji: '🏎️', value: 50 },
 { id: 'drink', emoji: '🥃', value: 12 },
 { id: 'king', emoji: '👑', value: 30 },
 { id: 'seven', emoji: '7️⃣', value: 100 },
];

export default function LuckySlot777Page() {
 const router = useRouter();
 const { user: currentUser } = useUser();
 const { userProfile } = useUserProfile(currentUser?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
 const [betAmount, setBetBetAmount] = useState(100);
 const [reels, setReels] = useState<number[][]>(
  Array(5).fill(null).map(() => [0, 1, 2])
 );
 const [isMuted, setIsMuted] = useState(false);
 const [isLaunching, setIsLaunching] = useState(true);
 const [winAmount, setWinAmount] = useState<number | null>(null);
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

 const playSpinSound = useCallback(() => {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 2);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 2);
 }, [isMuted, initAudioContext]);

 useEffect(() => {
  const timer = setTimeout(() => setIsLaunching(false), 1500);
  return () => clearTimeout(timer);
 }, []);

 const handleSpin = async () => {
  if (gameState === 'spinning' || !currentUser || !userProfile) return;
  if ((userProfile.wallet?.coins || 0) < betAmount) {
   toast({ variant: 'destructive', title: 'Insufficient Coins' });
   return;
  }

  setGameState('spinning');
  setWinAmount(null);
  playSpinSound();

  const updateData = { 'wallet.coins': increment(-betAmount), updatedAt: serverTimestamp() };
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
  updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

  let iterations = 0;
  const interval = setInterval(() => {
   setReels(Array(5).fill(null).map(() => 
    Array(3).fill(null).map(() => Math.floor(Math.random() * SYMBOLS.length))
   ));
   iterations++;
   if (iterations >= 20) {
    clearInterval(interval);
    finalizeSpin();
   }
  }, 100);
 };

 const finalizeSpin = () => {
  const finalReels = Array(5).fill(null).map(() => 
   Array(3).fill(null).map(() => Math.floor(Math.random() * SYMBOLS.length))
  );
  setReels(finalReels);

  const middleRow = finalReels.map(r => r[1]);
  const counts: Record<number, number> = {};
  middleRow.forEach(s => counts[s] = (counts[s] || 0) + 1);
  
  let multiplier = 0;
  Object.entries(counts).forEach(([symbolIdx, count]) => {
   if (count >= 3) {
    multiplier += SYMBOLS[Number(symbolIdx)].value * (count - 2);
   }
  });

  const totalWin = multiplier * (betAmount / 10);
  if (totalWin > 0) {
   setWinAmount(totalWin);
   if (currentUser && firestore) {
    const updateData = { 
     'wallet.coins': increment(totalWin), 
     'stats.dailyGameWins': increment(totalWin),
     updatedAt: serverTimestamp() 
    };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
   }
   setWinners([{ name: userProfile?.username, win: totalWin, avatar: userProfile?.avatarUrl }]);
  }

  setGameState('result');
  setTimeout(() => {
   setGameState('betting');
   setWinners([]);
  }, 3000);
 };

 const adjustBet = (amt: number) => {
  if (gameState === 'spinning') return;
  setBetBetAmount(prev => Math.max(10, prev + amt));
 };

 if (isLaunching) {
  return (
   <div className="h-screen w-full bg-[#0a0514] flex flex-col items-center justify-center space-y-6">
    <div className="text-8xl animate-bounce">🎰</div>
    <h1 className="text-6xl font-bold text-white uppercase tracking-tight drop-shadow-2xl">Lucky Slot</h1>
    <p className="text-white/40 uppercase tracking-wider text-[10px] animate-pulse">Initializing Reels...</p>
   </div>
  );
 }

 const hostAsset = PlaceHolderImages.find(img => img.id === 'slot-host');

 return (
  <AppLayout fullScreen>
   <div className="h-[100dvh] w-full bg-[#05051a] flex flex-col relative overflow-hidden font-sans text-white animate-in fade-in duration-1000">
    <CompactRoomView />

    <div className="relative z-[110] flex items-center justify-between p-4 pt-32">
      <div className="flex gap-2">
       <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full backdrop-blur-md"><ChevronLeft className="h-5 w-5" /></button>
       <button className="bg-white/10 p-2 rounded-full backdrop-blur-md"><HelpCircle className="h-5 w-5" /></button>
       <button className="bg-white/10 p-2 rounded-full backdrop-blur-md"><Menu className="h-5 w-5" /></button>
      </div>
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3 px-4 py-1.5 shadow-xl">
       <GoldCoinIcon className="h-5 w-5" />
       <span className="text-sm font-bold text-yellow-500 ">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
       <button className="bg-yellow-500 text-black rounded-full h-5 w-5 flex items-center justify-center"><Plus className="h-3 w-3" /></button>
      </div>
    </div>

    <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 pb-40">
      <div className="w-full max-w-sm mb-4 relative h-24 flex items-end justify-center">
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-16 bg-gradient-to-b from-blue-600 to-indigo-900 border-4 border-blue-400 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center z-20">
         <h2 className="text-2xl font-bold text-white uppercase tracking-tight animate-pulse">Jackpot</h2>
       </div>
       <div className="absolute -left-4 bottom-0 w-32 h-40 z-10 opacity-90">
         {hostAsset && <img src={hostAsset.imageUrl} className="h-full w-full object-contain" alt="Host" />}
       </div>
       <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-sm relative">
       <div className="absolute -inset-2 border-[10px] border-purple-900/80 rounded-3xl shadow-2xl z-0" />
       <div className="absolute -inset-2 p-1 z-10 pointer-events-none">
         <div className="grid grid-cols-10 gap-2 h-full w-full opacity-60">
          {Array.from({length: 40}).map((_, i) => (
           <div key={i} className="h-1.5 w-1.5 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
         </div>
       </div>

       <div className="relative bg-gradient-to-b from-[#3d1a5a] to-[#1a0a2e] rounded-2xl border-4 border-purple-500/30 overflow-hidden shadow-inner flex p-1 gap-1 h-[280px]">
         {reels.map((reel, rIdx) => (
          <div key={rIdx} className="flex-1 flex flex-col gap-1">
           {reel.map((symbolIdx, sIdx) => (
            <div key={sIdx} className={cn(
             "flex-1 bg-gradient-to-b from-[#f5e1a4] to-[#b88a44] rounded-lg flex items-center justify-center text-4xl shadow-md transition-all",
             gameState === 'spinning' && "animate-pulse"
            )}>
              <span className="drop-shadow-lg">{SYMBOLS[symbolIdx].emoji}</span>
            </div>
           ))}
          </div>
         ))}
         <div className="absolute inset-0 pointer-events-none grid grid-cols-5 divide-x divide-black/10">
          {Array.from({length: 5}).map((_, i) => <div key={i} />)}
         </div>
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/40" />
       </div>
      </div>

      <div className="mt-8 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
       <button onClick={() => adjustBet(-10)} className="h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg active:scale-90 transition-all"><Minus /></button>
       <div className="min-w-[80px] text-center">
         <span className="text-3xl font-bold text-green-400 tracking-tight drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">{betAmount}</span>
       </div>
       <button onClick={() => adjustBet(10)} className="h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg active:scale-90 transition-all"><Plus /></button>
      </div>
    </main>

    <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-[120] flex flex-col items-center gap-6">
      <div className="w-full max-w-sm relative">
       <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-10 bg-indigo-900/80 border-2 border-indigo-400 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl">
         <span className="text-sm font-bold uppercase text-pink-400">
          {winAmount ? `win +${winAmount.toLocaleString()}` : 'win'}
         </span>
       </div>

       <div className="flex gap-4">
         <button className="flex-1 h-16 bg-gradient-to-b from-blue-400 to-blue-700 border-b-4 border-blue-900 rounded-2xl flex flex-col items-center justify-center shadow-xl active:translate-y-1 active:border-b-0 transition-all group">
          <span className="text-[14px] font-bold uppercase tracking-tight text-white drop-shadow-md">Max</span>
          <span className="text-[10px] font-bold uppercase tracking-tight text-white/60">Invest</span>
         </button>
         
         <button 
          onClick={handleSpin}
          disabled={gameState === 'spinning'}
          className={cn(
           "flex-[1.5] h-16 bg-gradient-to-b from-yellow-300 to-yellow-600 border-b-4 border-yellow-800 rounded-2xl flex items-center justify-center shadow-2xl active:translate-y-1 active:border-b-0 transition-all",
           gameState === 'spinning' && "opacity-50 grayscale"
          )}
         >
          <span className="text-3xl font-bold uppercase tracking-tight text-black drop-shadow-sm">Spin</span>
         </button>
       </div>
       <p className="text-center text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] mt-2">Hold for Auto Spin</p>
      </div>
    </footer>

    {gameState === 'result' && winners.length > 0 && (
     <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-500">
       <div className="relative mb-12 flex flex-col items-center gap-4">
        <Trophy className="h-20 w-20 text-yellow-400 animate-bounce" />
        <h2 className="text-5xl font-bold text-white uppercase tracking-tight text-center">Jackpot Sync</h2>
       </div>
       <div className="flex items-center justify-center gap-4 px-6 w-full max-w-lg">
        {winners.map((winner, idx) => (
         <div key={idx} className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-20 duration-1000">
           <Avatar className="h-24 w-24 border-4 border-yellow-400 shadow-2xl">
            <AvatarImage src={winner.avatar || undefined}/><AvatarFallback>W</AvatarFallback>
           </Avatar>
           <div className="bg-yellow-500/20 border-x-2 border-t-2 border-yellow-400 w-32 h-20 rounded-t-3xl flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-white uppercase truncate px-2">{winner.name}</p>
            <p className="text-lg font-bold text-yellow-500">+{winner.win.toLocaleString()}</p>
           </div>
         </div>
        ))}
       </div>
     </div>
    )}

    <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
   </div>
  </AppLayout>
 );
}
