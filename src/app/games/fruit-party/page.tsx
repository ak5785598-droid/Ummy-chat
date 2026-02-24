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

// Items mapped to the 3x3 perimeter (skipping the center index 4)
// Layout:
// 0 1 2
// 7 X 3
// 6 5 4
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
    const totalSpins = 32 + targetIdx; // At least 4 full laps
    let currentSpin = 0;
    let speed = 50;

    const runChase = () => {
      setHighlightIdx(currentSpin % ITEMS.length);
      currentSpin++;

      if (currentSpin < totalSpins) {
        // Slow down towards the end
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
      <div className="h-screen w-full bg-[#2D005E] flex flex-col items-center relative overflow-hidden font-headline p-4">
        
        {/* Top Header Controls */}
        <header className="w-full flex items-center justify-between mb-4">
           <div className="flex items-center gap-4">
              <span className="text-white font-bold text-sm">ROUND: {roundNumber}</span>
              <div className="flex items-center gap-1 text-green-400 text-xs">
                 <Zap className="h-3 w-3 fill-current" />
                 <span>60ms</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button className="bg-white/10 p-2 rounded-full text-white"><History className="h-4 w-4" /></button>
              <button className="bg-white/10 p-2 rounded-full text-white"><HelpCircle className="h-4 w-4" /></button>
              <button className="bg-white/10 p-2 rounded-full text-white"><Settings className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full text-white"><X className="h-4 w-4" /></button>
           </div>
        </header>

        {/* Balance & Profit Bar */}
        <div className="w-full max-w-md bg-[#FFD700] p-0.5 rounded-xl shadow-lg mb-6">
           <div className="bg-[#4B0082] rounded-lg px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-white/60">BALANCE:</span>
                 <div className="flex items-center gap-1 text-white font-black text-sm">
                    <div className="bg-yellow-500 rounded-full h-3 w-3 flex items-center justify-center text-[8px] text-black">S</div>
                    {(userProfile?.wallet?.coins || 0).toLocaleString()}
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-white/60">PROFIT:</span>
                 <div className="flex items-center gap-1 text-white font-black text-sm">
                    <div className="bg-yellow-500 rounded-full h-3 w-3 flex items-center justify-center text-[8px] text-black">S</div>
                    0
                 </div>
              </div>
              <button className="bg-[#F1C40F] p-1 rounded-md shadow-inner">
                 <Trophy className="h-4 w-4 text-white" />
              </button>
           </div>
        </div>

        {/* Main 3x3 Machine Grid */}
        <div className="relative w-full max-w-[340px] aspect-square bg-[#FFD700] p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-[8px] border-[#B7950B]">
           <div className="w-full h-full bg-[#4B0082] rounded-[1.5rem] grid grid-cols-3 grid-rows-3 gap-2 p-2">
              
              {/* Grid Mapping Logic */}
              {[0, 1, 2, 7, 8, 3, 6, 5, 4].map((gridPos, i) => {
                if (gridPos === 8) {
                  // Center Digital Timer
                  return (
                    <div key="center" className="bg-[#1A0033] rounded-2xl flex items-center justify-center border-4 border-[#B7950B] shadow-inner overflow-hidden relative">
                       {gameState === 'betting' ? (
                         <div className="text-5xl font-black text-[#FFD700] italic tracking-tighter drop-shadow-[0_0_10px_rgba(241,196,15,0.5)]">
                            {timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                         </div>
                       ) : (
                         <div className="text-6xl animate-pulse">
                            {ITEMS.find(item => item.id === (resultId || ITEMS[highlightIdx || 0].id))?.emoji}
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
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
                      "relative rounded-2xl flex flex-col items-center justify-center p-1 transition-all duration-150 overflow-hidden",
                      "bg-gradient-to-b from-[#6A0DAD] to-[#4B0082] border-2 border-white/10",
                      isHighlighted && "ring-4 ring-[#FFD700] z-10 scale-105 shadow-[0_0_20px_rgba(255,215,0,0.6)]",
                      isWinner && "ring-4 ring-white animate-pulse z-20 scale-110",
                      hasBet && "border-[#FFD700] shadow-inner",
                      gameState !== 'betting' && !isHighlighted && "opacity-60"
                    )}
                  >
                    <span className="text-3xl mb-1">{item?.emoji}</span>
                    <span className="text-[8px] font-black text-white/80 uppercase tracking-tighter">{item?.label}</span>
                    {hasBet && (
                      <div className="absolute top-1 right-1 bg-[#FFD700] text-black text-[7px] font-black px-1.5 rounded-full border border-white">
                        {myBets[item!.id] >= 1000 ? `${(myBets[item!.id] / 1000).toFixed(0)}K` : myBets[item!.id]}
                      </div>
                    )}
                  </button>
                );
              })}
           </div>
        </div>

        {/* 3D Chip Platform */}
        <div className="w-full max-w-md mt-auto pb-10">
           <div className="relative bg-[#FFD700] h-24 rounded-t-[3rem] border-b-[6px] border-[#B7950B] flex items-center justify-center gap-4 px-6 pt-4 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#B7950B] h-2 w-32 rounded-full opacity-20" />
              
              {CHIPS.map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setSelectedChip(chip.value)}
                  className={cn(
                    "group relative h-14 w-14 rounded-full transition-all active:translate-y-1",
                    chip.color, chip.shadow, chip.border,
                    "border-b-4 border-t-2 shadow-[0_6px_0_0_rgba(0,0,0,0.2)] flex flex-col items-center justify-center",
                    selectedChip === chip.value ? "scale-110 -translate-y-2 ring-4 ring-white shadow-[0_10px_20px_rgba(0,0,0,0.4)]" : "hover:-translate-y-1"
                  )}
                >
                  <div className="flex items-center gap-0.5 text-white">
                    <div className="bg-yellow-500 rounded-full h-2 w-2 flex items-center justify-center text-[5px] text-black">S</div>
                    <span className="text-[10px] font-black italic">{chip.label}</span>
                  </div>
                  {selectedChip === chip.value && <div className="absolute -bottom-1 w-8 h-1 bg-black/20 blur-md rounded-full" />}
                </button>
              ))}
           </div>

           {/* History Bar Bottom */}
           <div className="bg-[#1A0033] w-full h-14 flex items-center gap-3 px-6 overflow-x-auto no-scrollbar border-t-2 border-[#FFD700]/20">
              <History className="h-4 w-4 text-[#FFD700] shrink-0" />
              <div className="flex gap-2">
                 {history.map((id, i) => (
                   <div key={i} className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-lg relative shrink-0">
                      {ITEMS.find(it => it.id === id)?.emoji}
                      {i === 0 && <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />}
                   </div>
                 ))}
                 {history.length === 0 && <span className="text-[8px] font-black text-white/20 uppercase italic">Waiting for round...</span>}
              </div>
           </div>
        </div>

        {/* Winner Overlay */}
        {gameState === 'result' && lastWinners.length > 0 && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="bg-black/80 backdrop-blur-md absolute inset-0" />
             <div className="relative z-10 text-center space-y-6">
                <Trophy className="h-20 w-20 text-[#FFD700] mx-auto animate-bounce" />
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Big Win!</h2>
                <div className="bg-[#4B0082] p-6 rounded-[2rem] border-4 border-[#FFD700] shadow-2xl min-w-[240px]">
                   <Avatar className="h-20 w-20 mx-auto border-4 border-white mb-4">
                      <AvatarImage src={lastWinners[0].avatar} />
                      <AvatarFallback>U</AvatarFallback>
                   </Avatar>
                   <p className="text-white font-black text-lg uppercase truncate">{lastWinners[0].name}</p>
                   <p className="text-2xl font-black text-[#FFD700] italic">+{lastWinners[0].amount.toLocaleString()}</p>
                </div>
             </div>
          </div>
        )}

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
