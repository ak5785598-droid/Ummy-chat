'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  X
} from 'lucide-react';
import { GoldCoinIcon, UmmyLogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { GameResultOverlay, GameWinner } from '@/components/game-result-overlay';

const CHIPS = [
 { value: 10000, label: '10k', color: 'bg-[#00E5FF] border-[#00E5FF]/50 shadow-[#00E5FF]/40' },
 { value: 100000, label: '100k', color: 'bg-[#2196F3] border-[#2196F3]/50 shadow-[#2196F3]/40' },
 { value: 300000, label: '300k', color: 'bg-[#9C27B0] border-[#9C27B0]/50 shadow-[#9C27B0]/40' },
 { value: 1000000, label: '1000k', color: 'bg-[#F44336] border-[#F44336]/50 shadow-[#F44336]/40' },
 { value: 2000000, label: '2000k', color: 'bg-[#795548] border-[#795548]/50 shadow-[#795548]/40' },
 { value: 5000000, label: '5000k', color: 'bg-[#FFD700] border-[#FFD700]/50 shadow-[#FFD700]/40' },
];

const FACTIONS = [
 { id: 'WOLF', label: 'Wolf', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-stark.png' },
 { id: 'LION', label: 'Lion', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-lannister.png' },
 { id: 'FISH', label: 'Fish', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-tully.png' },
];

const CARDS = ['A', 'JOKER', 'B', 'K', 'Q', '10', '9'];

interface TeenPattiGameContentProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function TeenPattiGameContent({ isOverlay = false, onClose }: TeenPattiGameContentProps) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'reveal' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(10000);
  const [myBets, setMyBets] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [totalPots, setTotalPots] = useState<Record<string, number>>({ WOLF: 0, LION: 650000, FISH: 800000 });
  const [history, setHistory] = useState<string[]>(['WOLF', 'LION', 'FISH', 'WOLF']);
  const [isMuted, setIsMuted] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(true);
  const [cardReveal, setCardReveal] = useState<Record<string, string[]>>({});
  const [winners, setWinners] = useState<GameWinner[]>([]);
  const [totalWinAmount, setTotalWinAmount] = useState(0);

  const winnersQuery = useMemoFirebase(() => {
     if (!firestore) return null;
     return query(
       collection(firestore, 'globalGameWins'),
       where('gameId', '==', 'teen-patti'),
       orderBy('timestamp', 'desc'),
       limit(5)
     );
   }, [firestore]);

   const { data: liveWins } = useCollection(winnersQuery);

  useEffect(() => { setTimeout(() => setIsLaunching(false), 1500); }, []);

  useEffect(() => {
   if (isLaunching) return;
   const interval = setInterval(() => {
    if (gameState === 'betting') {
     if (timeLeft > 0) setTimeLeft(prev => prev - 1);
     else startReveal();
    }
   }, 1000);
   return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startReveal = async () => {
   setGameState('reveal');
   const newCards: Record<string, string[]> = {};
   FACTIONS.forEach(f => { newCards[f.id] = [CARDS[Math.floor(Math.random() * CARDS.length)], CARDS[Math.floor(Math.random() * CARDS.length)], CARDS[Math.floor(Math.random() * CARDS.length)]]; });
   setCardReveal(newCards);

   let winId = FACTIONS[Math.floor(Math.random() * FACTIONS.length)].id;
   if (firestore) {
    try {
     const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'teen-patti'));
     if (oracleSnap.exists() && oracleSnap.data().isActive) {
      winId = oracleSnap.data().forcedResult;
      updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'teen-patti'), { isActive: false });
     }
    } catch (e) {}
   }

   setTimeout(() => { finalizeRound(winId); }, 3000);
  };

  const finalizeRound = (winId: string) => {
   setWinnerId(winId); setHistory(prev => [winId, ...prev.slice(0, 7)]); setGameState('result');
   const winAmount = (myBets[winId] || 0) * 1.95;
   setTotalWinAmount(winAmount);

   setWinners(liveWins?.map(w => ({
     name: w.username,
     win: w.amount,
     avatar: w.avatarUrl,
     isMe: w.userId === currentUser?.uid
   })) || []);

   if (winAmount > 0 && currentUser && firestore && userProfile) {
    const updateData = { 
      'wallet.coins': increment(Math.floor(winAmount)), 
      'stats.dailyGameWins': increment(Math.floor(winAmount)), 
      updatedAt: serverTimestamp() 
    };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
     gameId: 'teen-patti',
     userId: currentUser.uid,
     username: userProfile?.username || 'Guest',
     avatarUrl: userProfile?.avatarUrl || null,
     amount: Math.floor(winAmount),
     timestamp: serverTimestamp()
    });

    const questRef = doc(firestore, 'users', currentUser.uid, 'quests', 'win_game');
    updateDocumentNonBlocking(questRef, { current: increment(1), updatedAt: serverTimestamp() });
   }

   setTimeout(() => { setMyBets({ WOLF: 0, LION: 0, FISH: 0 }); setTotalPots({ WOLF: 0, LION: 650000, FISH: 800000 }); setWinnerId(null); setGameState('betting'); setTimeLeft(20); setCardReveal({}); }, 5000);
  };

  const handlePlaceBet = (id: string) => {
   if (gameState !== 'betting' || !currentUser || !userProfile) return;
   if ((userProfile.wallet?.coins || 0) < selectedChip) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
   const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
   setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
   setTotalPots(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  if (isLaunching) {
    return (
      <div className="h-full w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6 min-h-[400px]">
        <UmmyLogoIcon className="h-20 w-20 animate-bounce" />
        <h1 className="text-5xl font-bold text-yellow-500 uppercase tracking-tight">Teen Patti</h1>
      </div>
    );
  }

  const winnerBanner = winnerId ? FACTIONS.find(f => f.id === winnerId)?.bannerUrl : null;

  return (
   <div className={cn(
     "h-full w-full bg-[#581c87] flex flex-col relative overflow-hidden font-sans text-white",
     !isOverlay && "min-h-screen"
   )}>
    <CompactRoomView />
    
    {gameState === 'result' && winnerId && (
     <GameResultOverlay 
      gameId="teen-patti"
      winningSymbol={<img src={winnerBanner || ''} className="h-16 w-16 object-contain" alt="Winner" />} 
      winAmount={totalWinAmount} 
      winners={winners} 
     />
    )}

    <header className="relative z-[110] flex items-center justify-between p-4 pt-10">
      <div className="flex gap-2 text-white">
        <button onClick={handleBack} className="bg-white/10 p-2 rounded-full backdrop-blur-md"><ChevronLeft className="h-5 w-5" /></button>
      </div>
      <div className="flex flex-col items-center">
       <h1 className="text-4xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-[#ffd700] to-[#b8860b] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">TEEN PATTI</h1>
       <div className="mt-2 bg-gradient-to-r from-[#4c1d95] via-[#7c3aed] to-[#4c1d95] border-2 border-white/20 px-6 py-1 rounded-xl shadow-2xl"><span className="text-[11px] font-bold uppercase tracking-wider text-white">Countdown {timeLeft}s</span></div>
      </div>
      <div className="flex gap-2 text-white">
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full backdrop-blur-md">{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
        <button onClick={handleBack} className="bg-white/10 p-2 rounded-full backdrop-blur-md text-white"><X className="h-5 w-5" /></button>
      </div>
    </header>

    <main className="flex-1 flex flex-col pt-4 overflow-hidden relative z-10">
      <div className="grid grid-cols-3 gap-2 px-4 h-44">
       {FACTIONS.map((f) => (
        <div key={f.id} className="flex flex-col items-center gap-2">
          <div className={cn("w-full h-28 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden bg-black/30 backdrop-blur-sm shadow-inner", winnerId === f.id ? "border-[#ffd700] bg-[#ffd700]/10 shadow-2xl" : "border-white/5")}>
           <div className="flex gap-0.5 mb-1 scale-110">
             {[0, 1, 2].map((i) => (
              <div key={i} className={cn("w-8 h-12 rounded border transition-all duration-1000 transform-gpu preserve-3d flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-black", gameState !== 'betting' ? "rotate-y-180" : "")}>
               <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded"><span className="text-[10px] font-bold text-black leading-none">{cardReveal[f.id]?.[i] || '?'}</span></div>
               <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#3730a3] to-[#1e1b4b] rounded border border-[#ffd700]/30 flex items-center justify-center"><UmmyLogoIcon className="h-4 w-4 opacity-40 grayscale brightness-200" /></div>
              </div>
             ))}
           </div>
          </div>
          <div className="text-center"><p className="text-[9px] font-bold text-white/60 uppercase">Pot:{(totalPots[f.id] || 0).toLocaleString()}</p><p className="text-[9px] font-bold text-[#ffd700] uppercase ">Me:{(myBets[f.id] || 0).toLocaleString()}</p></div>
        </div>
       ))}
      </div>

      <div className="flex justify-around items-end px-4 flex-1 pb-28">
       {FACTIONS.map((f) => (
        <button key={f.id} onClick={() => handlePlaceBet(f.id)} disabled={gameState !== 'betting'} className={cn("relative group active:scale-95 transition-all duration-300", gameState !== 'betting' && "opacity-60")}>
          <img src={f.bannerUrl || undefined} className="w-24 h-28 object-contain filter drop-shadow-lg" alt="Banner" />
        </button>
       ))}
      </div>
    </main>

    <footer className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent z-[120]">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
       <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 pl-3 pr-4 py-2 shadow-2xl text-white">
        <GoldCoinIcon className="h-5 w-5 text-[#ffd700]" /><span className="text-[15px] font-bold text-[#ffd700] ">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
       </div>
       <div className="flex-1 flex items-center gap-2.5 overflow-x-auto no-scrollbar px-2 py-1">
         {CHIPS.map(chip => (
          <button key={chip.value} onClick={() => setSelectedChip(chip.value)} className={cn("h-14 w-14 rounded-full flex flex-col items-center justify-center transition-all border-[3px] border-white/10 shrink-0 shadow-2xl relative group overflow-hidden", chip.color, selectedChip === chip.value ? "scale-115 border-white ring-[6px] ring-white/20 z-10 -translate-y-2" : "opacity-70 grayscale-[0.2]")}>
           <span className="text-[10px] font-bold text-white ">{chip.label}</span>
          </button>
         ))}
       </div>
      </div>
    </footer>
    <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }.rotate-y-180 { transform: rotateY(180deg); }.preserve-3d { transform-style: preserve-3d; }.backface-hidden { backface-visibility: hidden; }`}</style>
   </div>
  );
}
