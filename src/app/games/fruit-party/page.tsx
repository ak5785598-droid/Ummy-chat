'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useRoomContext } from '@/components/room-provider';
import { useUser, useFirestore, useUserProfile, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, increment, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Mic, 
  MicOff, 
  Trophy, 
  Zap,
  Volume2,
  VolumeX,
  History,
  Settings,
  HelpCircle,
  X,
  Crown,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';

const ITEMS = [
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '5 TIMES', pos: 0 },
  { id: 'tomato', emoji: '🍅', multiplier: 5, label: '5 TIMES', pos: 1 },
  { id: 'banana', emoji: '🍌', multiplier: 5, label: '5 TIMES', pos: 2 },
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '5 TIMES', pos: 3 },
  { id: 'watermelon', emoji: '🍉', multiplier: 10, label: '10 TIMES', pos: 4 },
  { id: 'strawberry', emoji: '🍓', multiplier: 15, label: '15 TIMES', pos: 5 },
  { id: 'grapes', emoji: '🍇', multiplier: 25, label: '25 TIMES', pos: 6 },
  { id: 'cherries', emoji: '🍒', multiplier: 45, label: '45 TIMES', pos: 7 },
];

const CHIPS = [
  { value: 100, label: '100', color: 'bg-[#FF4D4D]', shadow: 'shadow-[#CC0000]', border: 'border-[#FF8080]' },
  { value: 1000, label: '1K', color: 'bg-[#2ECC71]', shadow: 'shadow-[#1E8449]', border: 'border-[#58D68D]' },
  { value: 10000, label: '10K', color: 'bg-[#F1C40F]', shadow: 'shadow-[#B7950B]', border: 'border-[#F4D03F]' },
  { value: 100000, label: '100K', color: 'bg-[#1ABC9C]', shadow: 'shadow-[#117A65]', border: 'border-[#48C9B0]' },
];

type RoundWinner = {
  name: string;
  amount: number;
  avatar: string;
  isMe?: boolean;
};

export default function FruitPartyPage() {
  const router = useRouter();
  const { activeRoom } = useRoomContext();
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
  const [roundNumber, setRoundNumber] = useState(311);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [lastWinners, setLastWinners] = useState<RoundWinner[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLaunching) return;

    const interval = setInterval(() => {
      if (gameState === 'betting') {
        if (timeLeft > 0) {
          setTimeLeft(prev => prev - 1);
        } else {
          startSpin();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startSpin = () => {
    setGameState('spinning');
    const targetIdx = Math.floor(Math.random() * ITEMS.length);
    const totalSpins = 32 + targetIdx; 
    let currentSpin = 0;
    let speed = 50;

    const runChase = () => {
      setHighlightIdx(currentSpin % ITEMS.length);
      currentSpin++;

      if (currentSpin < totalSpins) {
        if (totalSpins - currentSpin < 10) speed += 40;
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
    setHistory(prev => [id, ...prev].slice(0, 12));
    setRoundNumber(prev => prev + 1);
    
    const winItem = ITEMS.find(i => i.id === id);
    const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      const updateData = { 'wallet.coins': increment(winAmount), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
      
      setLastWinners([{ 
        name: userProfile.username, 
        amount: winAmount, 
        avatar: userProfile.avatarUrl,
        isMe: true 
      }]);
    }

    setTimeout(() => {
      setMyBets({});
      setGameState('betting');
      setTimeLeft(20);
      setResultId(null);
      setHighlightIdx(null);
      setLastWinners([]);
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
      <div className="h-screen w-full bg-[#4B0082] flex flex-col items-center justify-center space-y-6">
        <div className="text-9xl animate-bounce">🍓</div>
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Fruit Party</h1>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#2D005E] flex flex-col items-center relative overflow-hidden font-headline">
        
        <CompactRoomView />

        <div className="flex-1 flex flex-col items-center w-full p-4 overflow-y-auto pb-32">
          
          <header className="w-full flex items-center justify-between mb-4 mt-2">
             <div className="flex items-center gap-3">
                <span className="text-white font-bold text-xs uppercase opacity-60">ROUND: {roundNumber}</span>
                <div className="flex items-center gap-1 text-green-400 text-[10px] font-black">
                   <Zap className="h-3 w-3 fill-current" />
                   <span>60ms</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button className="bg-white/10 p-1.5 rounded-full text-white"><History className="h-3 w-3" /></button>
                <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white"><X className="h-3 w-3" /></button>
             </div>
          </header>

          <div className="w-full max-w-sm bg-[#FFD700] p-0.5 rounded-xl shadow-lg mb-4">
             <div className="bg-[#4B0082] rounded-lg px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black text-white/60">BALANCE:</span>
                   <div className="flex items-center gap-1 text-white font-black text-xs">
                      <div className="bg-yellow-500 rounded-full h-2.5 w-2.5 flex items-center justify-center text-[6px] text-black">S</div>
                      {(userProfile?.wallet?.coins || 0).toLocaleString()}
                   </div>
                </div>
                <button className="bg-[#F1C40F] p-1 rounded-md">
                   <Trophy className="h-3 w-3 text-white" />
                </button>
             </div>
          </div>

          <div className="relative w-full max-w-[280px] aspect-square bg-[#FFD700] p-1.5 rounded-[1.5rem] shadow-2xl border-b-[6px] border-[#B7950B] scale-90 sm:scale-100">
             <div className="w-full h-full bg-[#4B0082] rounded-[1.2rem] grid grid-cols-3 grid-rows-3 gap-1.5 p-1.5">
                {[0, 1, 2, 7, 8, 3, 6, 5, 4].map((gridPos, i) => {
                  if (gridPos === 8) {
                    return (
                      <div key="center" className="bg-[#1A0033] rounded-xl flex items-center justify-center border-2 border-[#B7950B] shadow-inner relative overflow-hidden">
                         {gameState === 'betting' ? (
                           <div className="text-3xl font-black text-[#FFD700] italic tracking-tighter">
                              {timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                           </div>
                         ) : (
                           <div className="text-4xl animate-pulse">
                              {ITEMS.find(item => item.id === (resultId || ITEMS[highlightIdx || 0].id))?.emoji}
                           </div>
                         )}
                      </div>
                    );
                  }

                  const item = ITEMS.find(it => it.pos === (gridPos < 8 ? gridPos : i));
                  const isHighlighted = highlightIdx === gridPos;
                  const isWinner = resultId === item?.id;
                  const hasBet = item ? !!myBets[item.id] : false;

                  return (
                    <button
                      key={gridPos}
                      onClick={() => item && handlePlaceBet(item.id)}
                      disabled={gameState !== 'betting'}
                      className={cn(
                        "relative rounded-xl flex flex-col items-center justify-center p-1 transition-all",
                        "bg-gradient-to-b from-[#6A0DAD] to-[#4B0082] border border-white/5",
                        isHighlighted && "ring-2 ring-[#FFD700] z-10 scale-105 shadow-xl",
                        isWinner && "ring-2 ring-white animate-pulse z-20",
                        hasBet && "border-[#FFD700]",
                        gameState !== 'betting' && !isHighlighted && "opacity-60"
                      )}
                    >
                      <span className="text-2xl mb-0.5">{item?.emoji}</span>
                      <span className="text-[6px] font-black text-white/80 uppercase tracking-tighter leading-none">{item?.label}</span>
                      {hasBet && (
                        <div className="absolute top-0.5 right-0.5 bg-[#FFD700] text-black text-[6px] font-black px-1 rounded-full border border-white">
                          {myBets[item!.id] >= 1000 ? `${(myBets[item!.id] / 1000).toFixed(0)}K` : myBets[item!.id]}
                        </div>
                      )}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="w-full max-w-sm mt-auto fixed bottom-0 left-0 right-0 z-[60]">
             <div className="relative bg-[#FFD700] h-20 rounded-t-[2.5rem] border-b-[4px] border-[#B7950B] flex items-center justify-center gap-3 px-4 pt-2 shadow-2xl">
                {CHIPS.map(chip => (
                  <button
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "group relative h-11 w-11 rounded-full transition-all active:translate-y-1",
                      chip.color, chip.shadow, chip.border,
                      "border-b-2 border-t flex flex-col items-center justify-center",
                      selectedChip === chip.value ? "scale-110 -translate-y-1 ring-2 ring-white shadow-xl" : "opacity-80"
                    )}
                  >
                    <div className="flex items-center gap-0.5 text-white">
                      <span className="text-[8px] font-black italic">{chip.label}</span>
                    </div>
                  </button>
                ))}
             </div>

             <div className="bg-[#1A0033] w-full h-10 flex items-center gap-2 px-4 overflow-x-auto no-scrollbar border-t border-[#FFD700]/20">
                <History className="h-3 w-3 text-[#FFD700] shrink-0" />
                <div className="flex gap-1.5">
                   {history.slice(0, 8).map((id, i) => (
                     <div key={i} className="h-6 w-6 bg-white/5 rounded-md flex items-center justify-center text-sm relative shrink-0">
                        {ITEMS.find(it => it.id === id)?.emoji}
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {gameState === 'result' && lastWinners.length > 0 && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="bg-black/80 backdrop-blur-md absolute inset-0" />
             <div className="relative z-10 text-center space-y-4">
                <Trophy className="h-16 w-16 text-[#FFD700] mx-auto animate-bounce" />
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Big Win!</h2>
                <div className="bg-[#4B0082] p-4 rounded-[1.5rem] border-2 border-[#FFD700] shadow-2xl min-w-[200px]">
                   <Avatar className="h-16 w-16 mx-auto border-2 border-white mb-2">
                      <AvatarImage src={lastWinners[0].avatar} />
                      <AvatarFallback>U</AvatarFallback>
                   </Avatar>
                   <p className="text-white font-black text-sm uppercase truncate">{lastWinners[0].name}</p>
                   <p className="text-xl font-black text-[#FFD700] italic">+{lastWinners[0].amount.toLocaleString()}</p>
                </div>
             </div>
          </div>
        )}

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
