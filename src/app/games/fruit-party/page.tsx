'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  Timer,
  Crown,
  History,
  Sparkles,
  Star
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ITEMS = [
  { id: 'apple', emoji: '🍎', multiplier: 5, label: '5x', color: 'bg-white', shadow: 'shadow-rose-500/20' },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '5x', color: 'bg-white', shadow: 'shadow-orange-400/20' },
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '5x', color: 'bg-white', shadow: 'shadow-yellow-300/20' },
  { id: 'cherry', emoji: '🍒', multiplier: 5, label: '5x', color: 'bg-white', shadow: 'shadow-red-600/20' },
  { id: 'strawberry', emoji: '🍓', multiplier: 10, label: '10x', color: 'bg-white', shadow: 'shadow-red-500/20' },
  { id: 'mango', emoji: '🥭', multiplier: 15, label: '15x', color: 'bg-white', shadow: 'shadow-orange-500/20' },
  { id: 'grape', emoji: '🍇', multiplier: 45, label: '45x', color: 'bg-white', shadow: 'shadow-purple-500/20' },
];

const CHIPS = [
  { value: 100, color: 'bg-green-500', border: 'border-green-600', label: '100' },
  { value: 1000, color: 'bg-blue-500', border: 'border-blue-600', label: '1K' },
  { value: 50000, color: 'bg-yellow-500', border: 'border-yellow-600', label: '50K' },
  { value: 100000, color: 'bg-purple-500', border: 'border-purple-600', label: '100K' },
  { value: 500000, color: 'bg-emerald-600', border: 'border-emerald-700', label: '500K' },
  { value: 1000000, color: 'bg-slate-900', border: 'border-slate-950', label: '1M' },
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
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [spinningIndex, setSpinningIndex] = useState(0);
  const [resultId, setResultId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [lastWinners, setLastWinners] = useState<RoundWinner[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatAmount = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return v.toString();
  };

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !activeRoom?.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', activeRoom.id, 'participants'));
  }, [firestore, activeRoom?.id, currentUser]);

  const { data: participants } = useCollection(participantsQuery);
  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);
  const activeSpeakers = participants?.filter(p => !p.isMuted && p.seatIndex > 0) || [];

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
          setGameState('spinning');
          const randomResult = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          setResultId(randomResult.id);
          startSpin(randomResult.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startSpin = (targetId: string) => {
    let current = 0;
    const targetIdx = ITEMS.findIndex(i => i.id === targetId);
    const spins = 21 + targetIdx; 
    let speed = 50;

    const runSpin = () => {
      setSpinningIndex(current % ITEMS.length);
      if (current < spins) {
        current++;
        speed += current * 1.5;
        setTimeout(runSpin, speed > 300 ? 300 : speed);
      } else {
        setTimeout(() => showResult(targetId), 1000);
      }
    };
    runSpin();
  };

  const showResult = (id: string) => {
    setGameState('result');
    setHistory(prev => [id, ...prev].slice(0, 8));
    
    const winningItem = ITEMS.find(i => i.id === id);
    const multiplier = winningItem?.multiplier || 0;
    const winAmount = (myBets[id] || 0) * multiplier;
    
    // Generate Mock Winners for Game Show atmosphere
    const mockWinners: RoundWinner[] = [
      { name: 'JuiceMaster', amount: 25000 * multiplier, avatar: 'https://picsum.photos/seed/fruit1/100' },
      { name: 'BerryTribe', amount: 12000 * multiplier, avatar: 'https://picsum.photos/seed/fruit2/100' },
      { name: 'CitrusKing', amount: 5000 * multiplier, avatar: 'https://picsum.photos/seed/fruit3/100' },
    ];

    if (winAmount > 0 && currentUser && firestore && userProfile) {
      setLastWinAmount(winAmount);
      setShowWinOverlay(true);
      
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const updateData = { 'wallet.coins': increment(winAmount), updatedAt: serverTimestamp() };
      
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      
      mockWinners.unshift({ 
        name: userProfile.username, 
        amount: winAmount, 
        avatar: userProfile.avatarUrl,
        isMe: true 
      });

      setTimeout(() => setShowWinOverlay(false), 3000);
    }

    setLastWinners(mockWinners.sort((a, b) => b.amount - a.amount).slice(0, 3));

    setTimeout(() => {
      setMyBets({});
      setGameState('betting');
      setTimeLeft(10);
      setResultId(null);
      setLastWinners([]);
    }, 7000); // 7s for podium visibility
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

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#87CEEB] flex flex-col items-center justify-center space-y-6 overflow-hidden">
        <div className="relative">
           <div className="absolute inset-0 bg-white/40 rounded-full blur-3xl animate-pulse" />
           <div className="text-9xl animate-bounce relative z-10">🍓</div>
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Fruit Party</h1>
           <p className="text-white/80 text-xs font-black uppercase tracking-[0.5em] animate-pulse">Synchronizing Frequencies...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#87CEEB] via-[#B0E0E6] to-[#fad0c4] flex flex-col relative overflow-hidden font-headline">
        
        {/* Animated Sky Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
           <div className="absolute top-20 left-10 text-6xl animate-float" style={{ animationDelay: '0s' }}>🍎</div>
           <div className="absolute top-40 right-20 text-5xl animate-float" style={{ animationDelay: '1s' }}>🍊</div>
           <div className="absolute bottom-40 left-20 text-7xl animate-float" style={{ animationDelay: '2s' }}>🍋</div>
           <div className="absolute bottom-20 right-10 text-6xl animate-float" style={{ animationDelay: '0.5s' }}>🍇</div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl text-white/10 rotate-12">🍓</div>
        </div>

        <audio 
          ref={audioRef} 
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
          autoPlay 
          loop 
          muted={isMuted} 
        />

        {/* Champions Podium Overlay */}
        {gameState === 'result' && lastWinners.length > 0 && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="bg-black/90 backdrop-blur-2xl absolute inset-0" />
             <div className="relative z-10 text-center space-y-12 max-w-2xl w-full px-6">
                
                <div className="relative space-y-2">
                   <div className="absolute inset-0 bg-yellow-400/20 blur-[100px] animate-pulse rounded-full" />
                   <div className="flex justify-center mb-4">
                      <div className="bg-orange-500 p-4 rounded-3xl shadow-2xl shadow-orange-500/40">
                         <Trophy className="h-12 w-12 text-white animate-bounce" />
                      </div>
                   </div>
                   <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Champions Circle</h2>
                   <p className="text-orange-400 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" /> Party Legends <Sparkles className="h-4 w-4" />
                   </p>
                </div>

                {/* The Podium */}
                <div className="flex items-end justify-center gap-4 h-[300px]">
                   {/* Rank 2 */}
                   {lastWinners[1] && (
                     <div className="flex flex-col items-center w-1/3 space-y-4 animate-in slide-in-from-bottom-10 duration-700 delay-200">
                        <div className="relative">
                           <Avatar className="h-20 w-20 border-4 border-slate-300 shadow-2xl">
                              <AvatarImage src={lastWinners[1].avatar} />
                              <AvatarFallback>U</AvatarFallback>
                           </Avatar>
                           <div className="absolute -top-2 -left-2 bg-slate-300 text-black text-xs font-black h-8 w-8 rounded-full flex items-center justify-center border-4 border-black">2</div>
                        </div>
                        <div className="bg-slate-300/10 border-2 border-slate-300/30 p-4 rounded-t-3xl w-full text-center space-y-1 backdrop-blur-md">
                           <p className="text-sm font-black text-white truncate uppercase italic">{lastWinners[1].name}</p>
                           <p className="text-lg font-black text-slate-300 italic">+{formatAmount(lastWinners[1].amount)}</p>
                        </div>
                     </div>
                   )}

                   {/* Rank 1 (The Winner) */}
                   {lastWinners[0] && (
                     <div className="flex flex-col items-center w-1/3 space-y-4 animate-in slide-in-from-bottom-20 duration-1000">
                        <div className="relative">
                           <div className="absolute -inset-4 bg-yellow-400/20 blur-2xl animate-pulse rounded-full" />
                           <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 h-12 w-12 text-yellow-400 drop-shadow-xl animate-bounce" />
                           <Avatar className="h-28 w-28 border-4 border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                              <AvatarImage src={lastWinners[0].avatar} />
                              <AvatarFallback>U</AvatarFallback>
                           </Avatar>
                           <div className="absolute -top-2 -left-2 bg-yellow-400 text-black text-sm font-black h-10 w-10 rounded-full flex items-center justify-center border-4 border-black ring-2 ring-yellow-400/50">1</div>
                        </div>
                        <div className="bg-yellow-400/20 border-2 border-yellow-400/50 p-6 rounded-t-[2.5rem] w-full text-center space-y-1 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shine-gloss" />
                           <p className="text-lg font-black text-white uppercase italic tracking-tighter">{lastWinners[0].name}</p>
                           <p className="text-2xl font-black text-yellow-400 italic flex items-center justify-center gap-1">
                              <Zap className="h-5 w-5 fill-current" />
                              {formatAmount(lastWinners[0].amount)}
                           </p>
                           {lastWinners[0].isMe && <Badge className="bg-yellow-400 text-black text-[10px] font-black uppercase mt-2">You Won!</Badge>}
                        </div>
                     </div>
                   )}

                   {/* Rank 3 */}
                   {lastWinners[2] && (
                     <div className="flex flex-col items-center w-1/3 space-y-4 animate-in slide-in-from-bottom-10 duration-700 delay-400">
                        <div className="relative">
                           <Avatar className="h-20 w-20 border-4 border-amber-700 shadow-2xl">
                              <AvatarImage src={lastWinners[2].avatar} />
                              <AvatarFallback>U</AvatarFallback>
                           </Avatar>
                           <div className="absolute -top-2 -left-2 bg-amber-700 text-white text-xs font-black h-8 w-8 rounded-full flex items-center justify-center border-4 border-black">3</div>
                        </div>
                        <div className="bg-amber-700/10 border-2 border-amber-700/30 p-4 rounded-t-3xl w-full text-center space-y-1 backdrop-blur-md">
                           <p className="text-sm font-black text-white truncate uppercase italic">{lastWinners[2].name}</p>
                           <p className="text-lg font-black text-amber-700 italic">+{formatAmount(lastWinners[2].amount)}</p>
                        </div>
                     </div>
                   )}
                </div>

                <div className="pt-8">
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Next Frequency...</p>
                </div>
             </div>
          </div>
        )}

        {showWinOverlay && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
             <div className="bg-black/60 backdrop-blur-md absolute inset-0" />
             <div className="relative z-10 text-center space-y-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-50 animate-pulse" />
                   <div className="text-[10rem] animate-bounce relative z-10 drop-shadow-2xl">🏆</div>
                </div>
                <h2 className="text-7xl font-black text-yellow-400 uppercase italic tracking-tighter drop-shadow-[0_0_30px_rgba(251,191,36,1)]">Tribe Jackpot!</h2>
                <div className="bg-yellow-400 text-black px-12 py-6 rounded-[2rem] text-5xl font-black italic shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border-b-8 border-yellow-600">
                   <Zap className="h-10 w-10 fill-current" />
                   +{lastWinAmount.toLocaleString()}
                </div>
             </div>
          </div>
        )}

        {/* High-Fidelity Theme Header */}
        <header className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="bg-black/20 backdrop-blur-xl p-3 rounded-full border-2 border-white/30 text-white hover:scale-110 transition-all shadow-xl"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="bg-white/30 backdrop-blur-xl px-6 py-3 rounded-[1.5rem] border-2 border-white/40 flex items-center gap-4 shadow-2xl">
                 <div className="flex -space-x-3">
                    {activeSpeakers.slice(0, 3).map(p => (
                      <Avatar key={p.uid} className="h-8 w-8 border-2 border-white shadow-lg animate-voice-wave">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                 </div>
                 <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none opacity-80">Party Frequency</p>
                    <p className="text-xs font-black text-white uppercase truncate w-28 italic drop-shadow-sm">{activeRoom?.title || 'Ummy Hub'}</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="bg-yellow-400 text-black px-6 py-3 rounded-[1.5rem] border-4 border-white flex items-center gap-3 shadow-2xl">
                 <Zap className="h-5 w-5 fill-current" />
                 <span className="text-xl font-black italic drop-shadow-sm">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full h-12 w-12 bg-white/20 backdrop-blur-md text-white border-2 border-white/30 flex items-center justify-center hover:scale-110 transition-all shadow-xl"
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
           </div>
        </header>

        {/* Main Stage: Ferris Wheel Layout */}
        <main className="flex-1 flex flex-col items-center justify-center pt-20 px-4 space-y-8">
           
           {/* Support Structure (Visual Decoration) */}
           <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-[30rem] bg-[#EEDD82]/40 rounded-full blur-3xl pointer-events-none" />
           <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-[35rem] h-px bg-white/20 rotate-[15deg] pointer-events-none" />
           <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-[35rem] h-px bg-white/20 -rotate-[15deg] pointer-events-none" />

           <div className="relative w-[22rem] h-[22rem] flex items-center justify-center mt-10">
              {/* Outer Ferris Wheel Ring */}
              <div className="absolute inset-0 border-[12px] border-white/20 rounded-full" />
              <div className="absolute inset-4 border-[2px] border-white/10 border-dashed animate-spin-slow" />
              
              {/* Fruit Pods (Circular Buttons) */}
              {ITEMS.map((item, index) => {
                const angle = (index / ITEMS.length) * 360;
                const isActive = spinningIndex === index;
                const isWinner = gameState === 'result' && resultId === item.id;
                const hasBet = !!myBets[item.id];
                
                return (
                  <button 
                    key={item.id}
                    onClick={() => handlePlaceBet(item.id)}
                    disabled={gameState !== 'betting'}
                    className={cn(
                      "absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-4 active:scale-90 group z-10",
                      isActive ? "scale-125 z-30 border-white shadow-[0_0_40px_rgba(255,255,255,0.8)]" : "border-white/40 shadow-xl",
                      isWinner && "animate-bounce scale-150 z-[40] ring-8 ring-yellow-400 border-white",
                      hasBet ? "border-yellow-400 ring-4 ring-yellow-400/20" : "opacity-100",
                      gameState !== 'betting' && !isActive && !isWinner && "grayscale-[0.3] opacity-60",
                      item.color
                    )}
                    style={{
                      transform: `rotate(${angle}deg) translate(140px) rotate(-${angle}deg)`
                    }}
                  >
                    <span className="text-4xl group-hover:scale-125 transition-transform drop-shadow-md">{item.emoji}</span>
                    <p className="text-[10px] font-black text-gray-500 uppercase italic mt-1">{item.label}</p>
                    
                    {/* Bet Badge */}
                    {hasBet && (
                      <div className="absolute -top-4 -right-2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg animate-in zoom-in bounce-in ring-2 ring-white z-50 flex items-center gap-1 border-b-2 border-yellow-600">
                         <Zap className="h-2 w-2 fill-current" />
                         {formatAmount(myBets[item.id])}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Center Game Console Hub */}
              <div className="relative z-20 w-40 h-40 bg-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center border-[8px] border-[#FFB347] group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#FFB347]/10 to-transparent" />
                 {gameState === 'betting' ? (
                   <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-500">
                    <span className="text-[10px] font-black text-[#FFB347] uppercase tracking-widest mb-1">Select Time</span>
                    <span className="text-5xl font-black text-[#FFB347] italic tracking-tighter drop-shadow-sm">{timeLeft}s</span>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Result</span>
                      <span className="text-7xl animate-bounce drop-shadow-xl">{ITEMS[spinningIndex].emoji}</span>
                   </div>
                 )}
              </div>
           </div>

           {/* Chip Selector Deck */}
           <div className="w-full max-w-lg bg-[#FFB347]/20 backdrop-blur-xl rounded-[3rem] border-4 border-white/40 p-6 space-y-4 shadow-2xl relative overflow-hidden mt-8">
              <div className="flex justify-between items-center px-4">
                 <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Choose Wager Intensity</p>
                 <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
              </div>
              
              <div className="flex justify-between gap-3 px-2 h-20 items-center overflow-x-auto no-scrollbar">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "flex-1 h-16 min-w-[64px] rounded-full flex flex-col items-center justify-center transition-all border-4 active:scale-90 relative",
                      selectedChip === chip.value 
                        ? "border-white shadow-[0_15px_30px_rgba(0,0,0,0.3)] -translate-y-2 scale-110 z-10 " + chip.color
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    )}
                   >
                      <span className={cn(
                        "text-xs font-black italic drop-shadow-sm",
                        selectedChip === chip.value ? "text-white" : "text-white/60"
                      )}>{chip.label}</span>
                      {selectedChip === chip.value && <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse pointer-events-none" />}
                   </button>
                 ))}
              </div>
           </div>

           {/* Result History Strip */}
           <div className="flex items-center gap-3 bg-white/30 backdrop-blur-xl px-6 py-3 rounded-full border-2 border-white/40 shadow-xl overflow-hidden max-w-[90vw]">
              <div className="flex items-center gap-2 border-r border-white/20 pr-4 mr-2">
                 <History className="h-4 w-4 text-white" />
                 <span className="text-[8px] font-black text-white uppercase">History</span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {history.map((id, i) => (
                  <div key={i} className="h-8 w-8 bg-white/80 rounded-full flex items-center justify-center text-xl shadow-md border-2 border-white animate-in slide-in-from-right-10 duration-500">
                    {ITEMS.find(item => item.id === id)?.emoji}
                  </div>
                ))}
                {history.length === 0 && <span className="text-[8px] font-black text-white/60 uppercase italic tracking-widest px-4 py-2">Frequency history empty</span>}
              </div>
           </div>
        </main>

        {/* Interactive Voice Footer */}
        <footer className="p-8 flex justify-center items-center gap-10 pb-12 relative z-50">
           <Button 
             onClick={toggleMic}
             className={cn(
               "rounded-full h-20 w-20 shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all scale-110 border-4",
               currentUserParticipant?.isMuted 
                ? "bg-rose-500 border-rose-400 text-white" 
                : "bg-white border-blue-200 text-blue-500 hover:scale-125"
             )}
           >
             {currentUserParticipant?.isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8 animate-voice-wave" />}
           </Button>
        </footer>

      </div>
    </AppLayout>
  );
}
