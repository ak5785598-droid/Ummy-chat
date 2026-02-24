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
  Zap,
  Volume2,
  VolumeX,
  History,
  Trophy,
  Sparkles,
  HelpCircle,
  BarChart3,
  Maximize2,
  Menu
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CompactRoomView } from '@/components/compact-room-view';

const ANIMALS = [
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: '5x', winText: 'Win 5 times' },
  { id: 'gazelle', emoji: '🦌', multiplier: 5, label: '5x', winText: 'Win 5 times' },
  { id: 'dog', emoji: '🐕', multiplier: 5, label: '5x', winText: 'Win 5 times' },
  { id: 'camel', emoji: '🐪', multiplier: 5, label: '5x', winText: 'Win 5 times' },
  { id: 'eagle', emoji: '🦅', multiplier: 10, label: '10x', winText: 'Win 10 times' },
  { id: 'leopard', emoji: '🐆', multiplier: 15, label: '15x', winText: 'Win 15 times' },
  { id: 'tiger', emoji: '🐅', multiplier: 25, label: '25x', winText: 'Win 25 times' },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: '45x', winText: 'Win 45 times' },
];

const CHIPS = [
  { value: 100000, label: '100K' },
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
  { value: 10000000, label: '10M' },
];

type RoundWinner = {
  name: string;
  amount: number;
  avatar: string;
  isMe?: boolean;
};

export default function WildPartyPage() {
  const router = useRouter();
  const { activeRoom } = useRoomContext();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(100000);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [rotation, setRotation] = useState(0);
  const [spinningIndex, setSpinningIndex] = useState(0);
  const [resultId, setResultId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [lastWinners, setLastWinners] = useState<RoundWinner[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [showWinOverlay, setShowWinOverlay] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !activeRoom?.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', activeRoom.id, 'participants'));
  }, [firestore, activeRoom?.id, currentUser]);

  const { data: participants } = useCollection(participantsQuery);
  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLaunching) return;

    const interval = setInterval(() => {
      if (gameState === 'betting') {
        if (timeLeft > 0) {
          setTimeLeft(prev => prev - 1);
        } else {
          const randomIndex = Math.floor(Math.random() * ANIMALS.length);
          startSpin(randomIndex);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startSpin = (targetIdx: number) => {
    setGameState('spinning');
    
    const extraSpins = 40; 
    const sliceAngle = 360 / ANIMALS.length;
    const landingAngle = (360 - (targetIdx * sliceAngle)) % 360;
    
    const baseRotation = Math.floor(rotation / 360) * 360;
    const totalRotation = baseRotation + (360 * extraSpins) + landingAngle;
    
    setTimeout(() => {
      setRotation(totalRotation);
      setResultId(ANIMALS[targetIdx].id);
    }, 50);

    let cycleCount = 0;
    const cycleInterval = setInterval(() => {
      setSpinningIndex(prev => (prev + 1) % ANIMALS.length);
      cycleCount++;
      if (cycleCount > 80) clearInterval(cycleInterval);
    }, 60);

    setTimeout(() => {
      clearInterval(cycleInterval);
      setSpinningIndex(targetIdx);
      showResult(ANIMALS[targetIdx].id);
    }, 5050);
  };

  const showResult = (id: string) => {
    setGameState('result');
    setHistory(prev => [id, ...prev].slice(0, 12));
    
    const winningAnimal = ANIMALS.find(i => i.id === id);
    const multiplier = winningAnimal?.multiplier || 0;
    const winAmount = (myBets[id] || 0) * multiplier;
    
    const realWinners: RoundWinner[] = [];

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      setShowWinOverlay(true);
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const updateData = { 'wallet.coins': increment(winAmount), updatedAt: serverTimestamp() };
      
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      
      realWinners.push({ 
        name: userProfile.username, 
        amount: winAmount, 
        avatar: userProfile.avatarUrl,
        isMe: true 
      });

      setTimeout(() => setShowWinOverlay(false), 3000);
    }

    setLastWinners(realWinners);

    setTimeout(() => {
      setMyBets({});
      setGameState('betting');
      setTimeLeft(20);
      setResultId(null);
      setLastWinners([]);
    }, 6000); 
  };

  const handlePlaceBet = (itemId: string) => {
    if (gameState !== 'betting' || !currentUser || !firestore || !userProfile) return;
    
    const currentBalance = userProfile.wallet?.coins || 0;
    if (currentBalance < selectedChip) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    const userRef = doc(firestore, 'users', currentUser.uid);
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
    
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);

    setMyBets(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + selectedChip
    }));
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#7B6DA8] flex flex-col items-center justify-center space-y-6 overflow-hidden font-headline">
        <div className="relative">
           <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse" />
           <div className="text-8xl animate-bounce relative z-10">🦁</div>
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Wild Party</h1>
           <p className="text-white/60 text-xs font-black uppercase tracking-[0.5em] animate-pulse">Syncing Savannah...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#7B6DA8] flex flex-col relative overflow-hidden font-headline">
        
        <CompactRoomView />

        <audio ref={audioRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" autoPlay loop muted={isMuted} />

        {gameState === 'result' && lastWinners.length > 0 && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="bg-black/90 backdrop-blur-2xl absolute inset-0" />
             <div className="relative z-10 text-center space-y-12 max-w-2xl w-full px-6">
                <div className="relative space-y-2">
                   <div className="absolute inset-0 bg-orange-500/20 blur-[100px] animate-pulse rounded-full" />
                   <div className="flex justify-center mb-4">
                      <div className="bg-orange-500 p-4 rounded-3xl shadow-2xl shadow-orange-500/40">
                         <Trophy className="h-12 w-12 text-white animate-bounce" />
                      </div>
                   </div>
                   <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Big Winner</h2>
                   <p className="text-orange-400 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" /> Wild Strike <Sparkles className="h-4 w-4" />
                   </p>
                </div>

                <div className="flex flex-col items-center w-full max-w-xs mx-auto space-y-4">
                   <Avatar className="h-32 w-32 border-4 border-yellow-400 shadow-2xl">
                      <AvatarImage src={lastWinners[0].avatar} />
                      <AvatarFallback>U</AvatarFallback>
                   </Avatar>
                   <div className="bg-yellow-400/20 border-2 border-yellow-400/50 p-6 rounded-t-[2.5rem] w-full text-center space-y-1 backdrop-blur-xl">
                      <p className="text-lg font-black text-white uppercase italic tracking-tighter">{lastWinners[0].name}</p>
                      <p className="text-2xl font-black text-yellow-400 italic">
                         +{formatAmount(lastWinners[0].amount)}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="absolute top-[40vh] left-0 right-0 p-4 flex items-center justify-between z-[40]">
           <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
           </div>

           <div className="bg-black/40 backdrop-blur-xl px-4 py-1 rounded-full border border-white/10 flex items-center gap-3">
              <History className="h-3 w-3 text-orange-400" />
              <div className="flex gap-1.5">
                {history.slice(0, 6).map((id, i) => (
                  <div key={i} className="h-5 w-5 bg-white/10 rounded-full flex items-center justify-center text-xs">
                    {ANIMALS.find(item => item.id === id)?.emoji}
                  </div>
                ))}
              </div>
           </div>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center pt-4 px-4 space-y-4 overflow-y-auto pb-32">
           
           <div className="relative w-64 h-64 flex items-center justify-center scale-90 sm:scale-100">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50">
                 <div className="w-6 h-8 bg-yellow-500 clip-path-triangle shadow-2xl" />
              </div>

              <div 
                className={cn(
                  "relative w-full h-full rounded-full border-[12px] border-[#3d1a05] shadow-2xl bg-[#5d2a0a]",
                  gameState === 'spinning' ? "transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)" : "transition-none"
                )}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                 {ANIMALS.map((animal, index) => {
                    const angle = index * 45;
                    const isWinner = gameState === 'result' && resultId === animal.id;
                    return (
                      <div 
                        key={animal.id}
                        className="absolute w-14 h-14 flex items-center justify-center"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translate(95px)`
                        }}
                      >
                        <div 
                          className={cn(
                            "w-full h-full rounded-full flex flex-col items-center justify-center transition-all border-2 backdrop-blur-md",
                            isWinner ? "scale-125 z-50 bg-yellow-400 border-white" : "bg-black/20 border-white/10",
                          )}
                          style={{ transform: `rotate(-${angle}deg)` }}
                        >
                           <span className="text-2xl">{animal.emoji}</span>
                        </div>
                      </div>
                    );
                 })}
              </div>

              <div className="absolute z-20 w-24 h-24 bg-[#1a0a05] rounded-full shadow-2xl flex flex-col items-center justify-center border-[6px] border-[#3d1a05]">
                 {gameState === 'betting' ? (
                   <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-[6px] font-black text-orange-500 uppercase leading-none mb-1">Select Animal</span>
                    <span className="text-3xl font-black text-white italic tracking-tighter">{timeLeft}s</span>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col items-center animate-in zoom-in">
                      <span className="text-5xl drop-shadow-xl">{ANIMALS[spinningIndex].emoji}</span>
                   </div>
                 )}
              </div>
           </div>

           <div className="w-full max-w-sm grid grid-cols-4 gap-1.5 px-2">
              {ANIMALS.map(animal => (
                <button 
                  key={animal.id}
                  onClick={() => handlePlaceBet(animal.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative group h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center p-1",
                    "bg-[#5d4a66] border-white/10",
                    gameState !== 'betting' && "opacity-60",
                    myBets[animal.id] && "border-yellow-400 bg-[#6d5a76]"
                  )}
                >
                   <span className="text-2xl mb-0.5">{animal.emoji}</span>
                   <span className="text-[8px] font-black text-yellow-500 uppercase tracking-tighter">{animal.label}</span>
                   
                   {myBets[animal.id] && (
                     <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black px-1.5 py-0.5 rounded-full text-[7px] font-black shadow-lg">
                        {formatAmount(myBets[animal.id])}
                     </div>
                   )}
                </button>
              ))}
           </div>

           <div className="w-full max-w-sm bg-[#1a0a05] rounded-[2rem] border-2 border-[#3d1a05] p-3 flex items-center justify-between shadow-2xl fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
              <div className="flex items-center gap-2 bg-black/40 px-4 h-10 rounded-full border border-white/5">
                 <Zap className="h-3 w-3 text-yellow-500 fill-current" />
                 <span className="text-sm font-black text-white italic tracking-tighter">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2 overflow-x-auto no-scrollbar">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center transition-all border-2 shrink-0",
                      selectedChip === chip.value ? "bg-slate-900 border-white scale-110" : "bg-black/40 border-white/10 text-white/60"
                    )}
                   >
                      <span className="text-[7px] font-black italic">{chip.label}</span>
                   </button>
                 ))}
              </div>

              <button 
                className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-400 active:scale-90 transition-all"
                onClick={() => setMyBets({})}
              >
                 <span className="text-[8px] font-black text-white uppercase leading-none">Rep</span>
              </button>
           </div>
        </main>

        <style jsx global>{`
          .clip-path-triangle {
            clip-path: polygon(50% 100%, 0 0, 100% 0);
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </AppLayout>
  );
}

function formatAmount(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return v.toString();
}
