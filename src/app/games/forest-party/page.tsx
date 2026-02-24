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
  Trees,
  CloudSun,
  Trophy,
  Star,
  Crown,
  TrendingUp
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ANIMALS = [
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: '5x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
  { id: 'deer', emoji: '🦌', multiplier: 5, label: '5x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
  { id: 'dog', emoji: '🐕', multiplier: 5, label: '5x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
  { id: 'camel', emoji: '🐪', multiplier: 5, label: '5x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
  { id: 'eagle', emoji: '🦅', multiplier: 10, label: '10x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
  { id: 'leopard', emoji: '🐆', multiplier: 15, label: '15x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
  { id: 'tiger', emoji: '🐅', multiplier: 25, label: '25x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
  { id: 'lion', emoji: '🦁', multiplier: 45, label: '45x', color: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
];

const CHIPS = [
  { value: 100, color: 'bg-blue-600' },
  { value: 1000, color: 'bg-yellow-500' },
  { value: 10000, color: 'bg-red-600' },
  { value: 100000, color: 'bg-purple-600' },
  { value: 500000, color: 'bg-emerald-600' },
  { value: 1000000, color: 'bg-slate-900' },
];

type RoundWinner = {
  name: string;
  amount: number;
  avatar: string;
  isMe?: boolean;
};

export default function ForestPartyPage() {
  const router = useRouter();
  const { activeRoom } = useRoomContext();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [spinningIndex, setSpinningIndex] = useState(0);
  const [resultId, setResultId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [lastWinners, setLastWinners] = useState<RoundWinner[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [showWinOverlay, setShowWinOverlay] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !activeRoom?.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', activeRoom.id, 'participants'));
  }, [firestore, activeRoom?.id, currentUser]);

  const { data: participants } = useCollection(participantsQuery);
  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);
  const activeSpeakers = participants?.filter(p => !p.isMuted && p.seatIndex > 0) || [];

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLaunching) return;

    const interval = setInterval(() => {
      if (gameState === 'betting') {
        if (timeLeft > 0) {
          setTimeLeft(prev => prev - 1);
        } else {
          setGameState('spinning');
          const randomResult = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
          setResultId(randomResult.id);
          startSpin(randomResult.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startSpin = (targetId: string) => {
    let current = 0;
    const targetIdx = ANIMALS.findIndex(i => i.id === targetId);
    const spins = 24 + targetIdx; 
    let speed = 50;

    const runSpin = () => {
      setSpinningIndex(current % ANIMALS.length);
      if (current < spins) {
        current++;
        speed += current * 1.2;
        setTimeout(runSpin, speed > 250 ? 250 : speed);
      } else {
        setTimeout(() => showResult(targetId), 1000);
      }
    };
    runSpin();
  };

  const showResult = (id: string) => {
    setGameState('result');
    setHistory(prev => [id, ...prev].slice(0, 10));
    
    const winningAnimal = ANIMALS.find(i => i.id === id);
    const multiplier = winningAnimal?.multiplier || 0;
    const winAmount = (myBets[id] || 0) * multiplier;
    
    // Generate Round Winners for "Game Show" effect
    const mockWinners: RoundWinner[] = [
      { name: 'VibeKing', amount: 50000 * multiplier, avatar: 'https://picsum.photos/seed/vibe/100' },
      { name: 'TribeLeader', amount: 15000 * multiplier, avatar: 'https://picsum.photos/seed/leader/100' },
      { name: 'ForestGhost', amount: 2500 * multiplier, avatar: 'https://picsum.photos/seed/ghost/100' },
    ];

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      setLastWinAmount(winAmount);
      setShowWinOverlay(true);
      
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const updateData = { 'wallet.coins': increment(winAmount), updatedAt: serverTimestamp() };
      
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      
      // Add current user to winners list
      mockWinners.unshift({ 
        name: userProfile.username, 
        amount: winAmount, 
        avatar: userProfile.avatarUrl,
        isMe: true 
      });

      setTimeout(() => setShowWinOverlay(false), 3500);
    }

    setLastWinners(mockWinners.sort((a, b) => b.amount - a.amount).slice(0, 3));

    setTimeout(() => {
      setMyBets({});
      setGameState('betting');
      setTimeLeft(10);
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
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toString();
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a2a1a] flex flex-col items-center justify-center space-y-6 overflow-hidden">
        <div className="relative">
           <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
           <Trees className="h-32 w-32 text-green-500 animate-bounce relative z-10" />
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Forest Party</h1>
           <p className="text-green-400 text-xs font-black uppercase tracking-[0.5em] animate-pulse">Entering the Wild...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#2c3e50] via-[#fd746c] to-[#2c3e50] flex flex-col relative overflow-hidden font-headline">
        
        {/* Animated Forest Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
           <div className="absolute top-20 left-10 text-6xl animate-float">🍂</div>
           <div className="absolute top-40 right-20 text-5xl animate-float" style={{ animationDelay: '1s' }}>🍃</div>
           <div className="absolute bottom-40 left-20 text-7xl animate-float" style={{ animationDelay: '2s' }}>🍁</div>
           <div className="absolute bottom-20 right-10 text-6xl animate-float" style={{ animationDelay: '0.5s' }}>🌿</div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl text-white/5 rotate-12">🌳</div>
        </div>

        <audio 
          ref={audioRef} 
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" 
          autoPlay 
          loop 
          muted={isMuted} 
        />

        {/* Cinematic Winners Circle Overlay */}
        {gameState === 'result' && lastWinners.length > 0 && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
             <div className="bg-black/80 backdrop-blur-md absolute inset-0" />
             <div className="relative z-10 text-center space-y-8 max-w-lg w-full px-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-yellow-400/20 blur-3xl animate-pulse" />
                   <Crown className="h-20 w-20 text-yellow-400 mx-auto animate-bounce mb-4" />
                   <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Who Won?</h2>
                   <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Tribe Champions of this Round</p>
                </div>

                <div className="space-y-4">
                   {lastWinners.map((winner, idx) => (
                     <div 
                       key={idx} 
                       className={cn(
                         "flex items-center gap-4 p-4 rounded-3xl border-2 transition-all transform animate-in slide-in-from-bottom-4",
                         winner.isMe ? "bg-yellow-400/20 border-yellow-400 scale-105" : "bg-white/5 border-white/10"
                       )}
                       style={{ animationDelay: `${idx * 200}ms` }}
                     >
                        <div className="relative">
                           <Avatar className="h-14 w-14 border-2 border-white shadow-xl">
                              <AvatarImage src={winner.avatar} />
                              <AvatarFallback>U</AvatarFallback>
                           </Avatar>
                           <div className="absolute -top-2 -left-2 bg-yellow-500 text-black text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white">
                              {idx + 1}
                           </div>
                        </div>
                        <div className="flex-1 text-left">
                           <p className="text-lg font-black text-white uppercase italic">{winner.name}</p>
                           {winner.isMe && <Badge className="bg-yellow-400 text-black text-[8px] font-black uppercase">Your Win</Badge>}
                        </div>
                        <div className="text-right">
                           <div className="flex items-center gap-1 text-yellow-400 font-black text-xl italic">
                              <Zap className="h-4 w-4 fill-current" />
                              +{formatAmount(winner.amount)}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {showWinOverlay && (
          <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
             <div className="relative z-10 text-center space-y-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-50 animate-pulse" />
                   <div className="text-[10rem] animate-bounce relative z-10 drop-shadow-2xl">🦁</div>
                </div>
                <h2 className="text-7xl font-black text-yellow-400 uppercase italic tracking-tighter">Wild Jackpot!</h2>
                <div className="bg-amber-500 text-black px-12 py-6 rounded-[2rem] text-5xl font-black italic shadow-2xl flex items-center gap-4 border-b-8 border-amber-700">
                   <Zap className="h-10 w-10 fill-current" />
                   +{lastWinAmount.toLocaleString()}
                </div>
             </div>
          </div>
        )}

        <header className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="bg-black/40 backdrop-blur-xl p-3 rounded-full border border-white/20 text-white hover:scale-110 transition-all shadow-xl"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="bg-black/30 backdrop-blur-xl px-6 py-3 rounded-[1.5rem] border border-white/20 flex items-center gap-4 shadow-2xl">
                 <div className="flex -space-x-3">
                    {activeSpeakers.slice(0, 3).map(p => (
                      <Avatar key={p.uid} className="h-8 w-8 border-2 border-green-500 shadow-lg animate-voice-wave">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                 </div>
                 <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none">Wild Tribe</p>
                    <p className="text-xs font-black text-white uppercase truncate w-28 italic">{activeRoom?.title || 'Forest Hub'}</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-black px-6 py-3 rounded-[1.5rem] border-4 border-amber-700 flex items-center gap-3 shadow-2xl">
                 <Zap className="h-5 w-5 fill-current" />
                 <span className="text-xl font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full h-12 w-12 bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:scale-110 transition-all shadow-xl"
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
           </div>
        </header>

        {/* Wild Wheel Section */}
        <main className="flex-1 flex flex-col items-center justify-center pt-20 px-4 space-y-8">
           
           <div className="relative w-[24rem] h-[24rem] flex items-center justify-center mt-4">
              {/* Outer Spoke Structure */}
              <div className="absolute inset-0 border-[16px] border-[#8B4513]/40 rounded-full" />
              <div className="absolute inset-6 border-[2px] border-white/10 border-dashed animate-spin-slow" />
              
              {/* Animal Pods */}
              {ANIMALS.map((animal, index) => {
                const angle = (index / ANIMALS.length) * 360;
                const isActive = spinningIndex === index;
                const isWinner = gameState === 'result' && resultId === animal.id;
                const hasBet = !!myBets[animal.id];
                
                return (
                  <button 
                    key={animal.id}
                    onClick={() => handlePlaceBet(animal.id)}
                    disabled={gameState !== 'betting'}
                    className={cn(
                      "absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-4 active:scale-90 group z-10",
                      isActive ? "scale-125 z-30 border-white shadow-[0_0_40px_rgba(255,215,0,0.6)]" : "border-[#8B4513]/60 shadow-xl",
                      isWinner && "animate-bounce scale-150 z-[40] ring-8 ring-amber-500 border-white",
                      hasBet ? "border-amber-500 ring-4 ring-amber-500/20" : "opacity-100",
                      gameState !== 'betting' && !isActive && !isWinner && "grayscale-[0.5] opacity-50",
                      animal.color
                    )}
                    style={{
                      transform: `rotate(${angle}deg) translate(150px) rotate(-${angle}deg)`
                    }}
                  >
                    <span className="text-4xl group-hover:scale-125 transition-transform">{animal.emoji}</span>
                    <p className="text-[10px] font-black text-amber-900 uppercase italic mt-1">Win {animal.label}</p>
                    
                    {hasBet && (
                      <div className="absolute -top-4 -right-2 bg-amber-500 text-black px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg animate-in zoom-in bounce-in ring-2 ring-white z-50 flex items-center gap-1">
                         <Zap className="h-2 w-2 fill-current" />
                         {formatAmount(myBets[animal.id])}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Central Console */}
              <div className="relative z-20 w-44 h-44 bg-[#fdf5e6] rounded-full shadow-2xl flex flex-col items-center justify-center border-[10px] border-[#8B4513] group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#8B4513]/5 to-transparent" />
                 {gameState === 'betting' ? (
                   <div className="relative z-10 flex flex-col items-center animate-in fade-in">
                    <span className="text-[10px] font-black text-[#8B4513] uppercase tracking-widest mb-1 text-center">Select<br/>Animal now</span>
                    <span className="text-5xl font-black text-[#8B4513] italic tracking-tighter drop-shadow-sm">{timeLeft}s</span>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col items-center animate-in zoom-in">
                      <span className="text-[10px] font-black uppercase text-[#8B4513]/60 tracking-widest mb-1">Wild Result</span>
                      <span className="text-7xl animate-bounce">{ANIMALS[spinningIndex].emoji}</span>
                   </div>
                 )}
              </div>
           </div>

           {/* Dashboard Chips */}
           <div className="w-full max-w-lg bg-black/20 backdrop-blur-xl rounded-[3rem] border-2 border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden mt-8">
              <div className="flex justify-between items-center px-4">
                 <p className="text-[10px] font-black text-amber-200 uppercase tracking-[0.3em]">Tribe Wager Bar</p>
                 <CloudSun className="h-4 w-4 text-amber-400" />
              </div>
              
              <div className="flex justify-between gap-3 px-2 h-20 items-center overflow-x-auto no-scrollbar">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "flex-1 h-16 min-w-[64px] rounded-full flex flex-col items-center justify-center transition-all border-4 active:scale-90 relative",
                      selectedChip === chip.value 
                        ? "border-white shadow-2xl -translate-y-2 scale-110 z-10 " + chip.color
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    )}
                   >
                      <span className="text-xs font-black italic">{formatAmount(chip.value)}</span>
                      {selectedChip === chip.value && <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />}
                   </button>
                 ))}
              </div>
           </div>

           {/* Animal History */}
           <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-xl overflow-hidden max-w-[90vw]">
              <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
                 <History className="h-4 w-4 text-amber-400" />
                 <span className="text-[8px] font-black text-white uppercase">Wild Log</span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {history.map((id, i) => (
                  <div key={i} className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center text-xl border border-white/10 animate-in slide-in-from-right-10 duration-500">
                    {ANIMALS.find(item => item.id === id)?.emoji}
                  </div>
                ))}
                {history.length === 0 && <span className="text-[8px] font-black text-white/40 uppercase italic tracking-widest px-4 py-2">Frequency history empty</span>}
              </div>
           </div>
        </main>

        <footer className="p-8 flex justify-center items-center gap-10 pb-12 relative z-50">
           <div className="absolute bottom-32 flex flex-col items-center gap-2 pointer-events-none opacity-60">
              <TrendingUp className="h-4 w-4 text-yellow-400 animate-pulse" />
              <p className="text-[8px] font-black text-white uppercase tracking-widest">Champions Rising</p>
           </div>
           <Button 
             onClick={toggleMic}
             className={cn(
               "rounded-full h-20 w-20 shadow-2xl transition-all scale-110 border-4",
               currentUserParticipant?.isMuted 
                ? "bg-rose-600 border-rose-400 text-white" 
                : "bg-green-600 border-green-400 text-white hover:scale-125"
             )}
           >
             {currentUserParticipant?.isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8 animate-voice-wave" />}
           </Button>
        </footer>

      </div>
    </AppLayout>
  );
}
