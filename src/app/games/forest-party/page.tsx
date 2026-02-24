
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
  Crown,
  Sparkles,
  HelpCircle,
  BarChart3,
  Menu,
  Maximize2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const ANIMALS = [
  { id: 'lion', emoji: '🦁', multiplier: 45, label: '45x', color: 'bg-yellow-500/20' },
  { id: 'tiger', emoji: '🐅', multiplier: 25, label: '25x', color: 'bg-orange-500/20' },
  { id: 'leopard', emoji: '🐆', multiplier: 15, label: '15x', color: 'bg-amber-500/20' },
  { id: 'eagle', emoji: '🦅', multiplier: 10, label: '10x', color: 'bg-blue-500/20' },
  { id: 'camel', emoji: '🐪', multiplier: 5, label: '5x', color: 'bg-emerald-500/20' },
  { id: 'dog', emoji: '🐕', multiplier: 5, label: '5x', color: 'bg-sky-500/20' },
  { id: 'gazelle', emoji: '🦌', multiplier: 5, label: '5x', color: 'bg-lime-500/20' },
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: '5x', color: 'bg-rose-500/20' },
];

const CHIPS = [
  { value: 100, color: 'bg-blue-600', label: '100' },
  { value: 1000, color: 'bg-yellow-500', label: '1K' },
  { value: 100000, color: 'bg-purple-600', label: '100K' },
  { value: 500000, color: 'bg-emerald-600', label: '500K' },
  { value: 1000000, color: 'bg-slate-900', label: '1M' },
  { value: 10000000, color: 'bg-rose-600', label: '10M' },
  { value: 100000000, color: 'bg-amber-600', label: '100M' },
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
  const [selectedChip, setSelectedChip] = useState(100);
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
    
    const extraSpins = 45; 
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

  const toggleMic = () => {
    if (!firestore || !activeRoom?.id || !currentUser || !currentUserParticipant) return;
    updateDocumentNonBlocking(
      doc(firestore, 'chatRooms', activeRoom.id, 'participants', currentUser.uid),
      { isMuted: !currentUserParticipant.isMuted }
    );
  };

  const formatAmount = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return v.toString();
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0a05] flex flex-col items-center justify-center space-y-6 overflow-hidden font-headline">
        <div className="relative">
           <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
           <div className="text-8xl animate-bounce relative z-10">🦁</div>
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Wild Party</h1>
           <p className="text-orange-400 text-xs font-black uppercase tracking-[0.5em] animate-pulse">Entering the Savannah...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#4B5E91] via-[#7B6DA8] to-[#E89F71] flex flex-col relative overflow-hidden font-headline">
        
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#2d1405] to-transparent opacity-80" />
           <div className="absolute bottom-20 left-0 right-0 flex items-end justify-center gap-0 opacity-40">
              <div className="w-1/2 h-40 bg-[#1a0a05] rounded-[100%_100%_0_0] blur-xl translate-x-20" />
              <div className="w-1/2 h-60 bg-[#1a0a05] rounded-[100%_100%_0_0] blur-2xl -translate-x-20" />
           </div>
           <div className="absolute top-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
        </div>

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
                      <Sparkles className="h-4 w-4" /> Wild Frequency Strike <Sparkles className="h-4 w-4" />
                   </p>
                </div>

                <div className="flex flex-col items-center w-full max-w-xs mx-auto space-y-4 animate-in slide-in-from-bottom-20 duration-1000">
                   <Avatar className="h-32 w-32 border-4 border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                      <AvatarImage src={lastWinners[0].avatar} />
                      <AvatarFallback>U</AvatarFallback>
                   </Avatar>
                   <div className="bg-yellow-400/20 border-2 border-yellow-400/50 p-6 rounded-t-[2.5rem] w-full text-center space-y-1 backdrop-blur-xl">
                      <p className="text-lg font-black text-white uppercase italic tracking-tighter">{lastWinners[0].name}</p>
                      <p className="text-2xl font-black text-yellow-400 italic flex items-center justify-center gap-1">
                         <Zap className="h-5 w-5 fill-current" />
                         {formatAmount(lastWinners[0].amount)}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        <header className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full border border-white/10 text-white hover:scale-110 transition-all shadow-xl">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button className="bg-white/10 p-2 rounded-full border border-white/10 text-white"><Maximize2 className="h-5 w-5" /></button>
              <button className="bg-white/10 p-2 rounded-full border border-white/10 text-white"><HelpCircle className="h-5 w-5" /></button>
              <button className="bg-white/10 p-2 rounded-full border border-white/10 text-white"><BarChart3 className="h-5 w-5" /></button>
           </div>

           <div className="bg-black/40 backdrop-blur-xl px-6 py-1.5 rounded-full border border-white/10 flex items-center gap-4">
              <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                 <History className="h-4 w-4 text-orange-400" />
                 <span className="text-[10px] font-black text-white uppercase">History</span>
              </div>
              <div className="flex gap-2">
                {history.map((id, i) => (
                  <div key={i} className="h-6 w-6 bg-white/10 rounded-full flex items-center justify-center text-sm relative">
                    {ANIMALS.find(item => item.id === id)?.emoji}
                    {i === 0 && <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-[6px] h-3 px-1 font-black animate-bounce">NEW</Badge>}
                  </div>
                ))}
              </div>
           </div>

           <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full border border-white/10 text-white"><Menu className="h-5 w-5" /></button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center pt-16 px-4 space-y-6">
           
           <div className="relative w-[24rem] h-[24rem] flex items-center justify-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50">
                 <div className="w-8 h-10 bg-yellow-500 clip-path-triangle shadow-2xl border-x-2 border-yellow-600" />
              </div>

              <div 
                className={cn(
                  "relative w-full h-full rounded-full border-[16px] border-[#3d1a05] shadow-2xl overflow-visible bg-[#5d2a0a]",
                  gameState === 'spinning' ? "transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1) animate-vibrate" : "transition-none"
                )}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                 {Array.from({ length: 8 }).map((_, i) => (
                   <div key={i} className="absolute top-1/2 left-1/2 w-[50%] h-1 bg-white/10 origin-left" style={{ transform: `rotate(${i * 45}deg)` }} />
                 ))}
                 
                 {Array.from({ length: 8 }).map((_, i) => (
                   <div key={i} className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,1)] z-50 border border-white/50" style={{ top: '50%', left: '50%', transform: `rotate(${i * 45}deg) translate(165px) translateY(-50%)` }} />
                 ))}

                 {ANIMALS.map((animal, index) => {
                    const angle = index * 45;
                    const isWinner = gameState === 'result' && resultId === animal.id;
                    const hasBet = !!myBets[animal.id];
                    return (
                      <div 
                        key={animal.id}
                        className="absolute w-20 h-20 flex items-center justify-center"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translate(145px)`
                        }}
                      >
                        <div 
                          className={cn(
                            "w-full h-full rounded-full flex flex-col items-center justify-center transition-all border-2 backdrop-blur-md",
                            gameState === 'spinning' ? "duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)" : "duration-300",
                            isWinner ? "scale-150 z-50 bg-yellow-400 border-white shadow-[0_0_40px_rgba(251,191,36,0.8)] animate-bounce" : "bg-black/20 border-white/10",
                            hasBet && "border-yellow-400 ring-2 ring-yellow-400/20"
                          )}
                          style={{ 
                            transform: `rotate(-${rotation + angle}deg)` 
                          }}
                        >
                           <span className="text-4xl drop-shadow-md">{animal.emoji}</span>
                           <div className="absolute -bottom-2 bg-[#3d1a05] text-white text-[6px] font-black px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap">
                              Win {animal.multiplier}x
                           </div>
                        </div>
                      </div>
                    );
                 })}
              </div>

              <div className="absolute z-20 w-36 h-36 bg-[#1a0a05] rounded-full shadow-2xl flex flex-col items-center justify-center border-[8px] border-[#3d1a05] overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
                 {gameState === 'betting' ? (
                   <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">Select Animal<br/>Now</span>
                    <span className="text-5xl font-black text-white italic tracking-tighter drop-shadow-sm">{timeLeft}</span>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col items-center animate-in zoom-in">
                      <span className="text-[8px] font-black uppercase text-orange-500/60 tracking-widest mb-1">Wild Result</span>
                      <span className="text-7xl animate-pulse drop-shadow-xl">{ANIMALS[spinningIndex].emoji}</span>
                   </div>
                 )}
              </div>
           </div>

           <div className="w-full max-w-xl grid grid-cols-4 gap-3 px-2">
              {ANIMALS.map(animal => (
                <button 
                  key={animal.id}
                  onClick={() => handlePlaceBet(animal.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative group h-24 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center",
                    "bg-[#3d1a05]/60 border-white/10 backdrop-blur-md hover:bg-[#3d1a05]/80",
                    gameState !== 'betting' && "opacity-60 grayscale-[0.2]",
                    myBets[animal.id] && "border-yellow-400 ring-4 ring-yellow-400/20"
                  )}
                >
                   <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{animal.emoji}</span>
                   <span className="text-[10px] font-black text-yellow-500 italic">{animal.label}</span>
                   
                   {myBets[animal.id] && (
                     <div className="absolute -top-2 -right-2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[8px] font-black shadow-lg animate-in zoom-in border border-white">
                        {formatAmount(myBets[animal.id])}
                     </div>
                   )}
                </button>
              ))}
           </div>

           <div className="w-full max-w-2xl bg-[#3d1a05] rounded-[3rem] border-4 border-[#5d2a0a] p-4 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3 bg-black/40 px-6 h-14 rounded-full border border-white/10">
                 <div className="bg-yellow-500 p-1.5 rounded-lg shadow-lg">
                    <Zap className="h-5 w-5 text-black fill-current" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xl font-black text-white italic tracking-tighter">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                    <span className="text-[8px] uppercase font-black text-white/40 tracking-widest leading-none">Coins Pool</span>
                 </div>
              </div>

              <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar px-4">
                 <button onClick={() => setMyBets({})} className="h-12 px-6 rounded-full bg-white/10 border border-white/10 text-white font-black uppercase italic text-[10px] hover:bg-white/20">Repeat</button>
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "h-14 w-14 rounded-full flex items-center justify-center transition-all border-4 active:scale-90 relative shrink-0",
                      selectedChip === chip.value 
                        ? "scale-110 z-10 shadow-[0_0_20px_rgba(255,255,255,0.4)] " + chip.color + " border-white"
                        : "bg-black/40 border-white/10 text-white/60"
                    )}
                   >
                      <span className="text-[10px] font-black italic">{chip.label}</span>
                      {selectedChip === chip.value && <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />}
                   </button>
                 ))}
              </div>

              <Button 
                onClick={toggleMic}
                className={cn(
                  "rounded-full h-16 w-16 shadow-2xl transition-all scale-110 border-4",
                  currentUserParticipant?.isMuted 
                    ? "bg-rose-600 border-rose-400 text-white" 
                    : "bg-orange-600 border-orange-400 text-white hover:scale-125 shadow-orange-500/20"
                )}
              >
                {currentUserParticipant?.isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6 animate-voice-wave" />}
              </Button>
           </div>
        </main>

        <style jsx global>{`
          @keyframes vibrate {
            0% { transform: scale(1); }
            25% { transform: scale(1.01) rotate(0.1deg); }
            50% { transform: scale(1); }
            75% { transform: scale(1.01) rotate(-0.1deg); }
            100% { transform: scale(1); }
          }
          .animate-vibrate {
            animation: vibrate 0.05s linear infinite;
          }
          .clip-path-triangle {
            clip-path: polygon(50% 100%, 0 0, 100% 0);
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
