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
  { id: 'apple', emoji: '🍎', multiplier: 5, label: '5x', color: 'bg-rose-500', shadow: 'shadow-rose-500/50' },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '5x', color: 'bg-orange-400', shadow: 'shadow-orange-400/50' },
  { id: 'lemon', emoji: '🍋', multiplier: 5, label: '5x', color: 'bg-yellow-300', shadow: 'shadow-yellow-300/50' },
  { id: 'cherry', emoji: '🍒', multiplier: 5, label: '5x', color: 'bg-red-600', shadow: 'shadow-red-600/50' },
  { id: 'strawberry', emoji: '🍓', multiplier: 10, label: '10x', color: 'bg-red-500', shadow: 'shadow-red-500/50' },
  { id: 'mango', emoji: '🥭', multiplier: 15, label: '15x', color: 'bg-orange-500', shadow: 'shadow-orange-500/50' },
  { id: 'grape', emoji: '🍇', multiplier: 45, label: '45x', color: 'bg-purple-500', shadow: 'shadow-purple-500/50' },
];

const CHIPS = [100, 500, 1000, 5000, 10000];

/**
 * Enhanced Fruit Party Page.
 * Featuring cartoon animations, floating background elements, and immersive graphic design.
 */
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync participants for voice indicators
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

  // Game Logic Loop
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
    
    const winAmount = (myBets[id] || 0) * (ITEMS.find(i => i.id === id)?.multiplier || 0);
    
    if (winAmount > 0 && currentUser && firestore) {
      setLastWinAmount(winAmount);
      setShowWinOverlay(true);
      
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const updateData = { 'wallet.coins': increment(winAmount), updatedAt: serverTimestamp() };
      
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      
      setTimeout(() => setShowWinOverlay(false), 3000);
    }

    setTimeout(() => {
      setMyBets({});
      setGameState('betting');
      setTimeLeft(10);
      setResultId(null);
    }, 4000);
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
      <div className="h-screen w-full bg-[#00E5FF] flex flex-col items-center justify-center space-y-6 overflow-hidden">
        <div className="relative">
           <div className="absolute inset-0 bg-white/40 rounded-full blur-3xl animate-pulse" />
           <div className="text-9xl animate-bounce relative z-10">🍓</div>
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Fruit Party</h1>
           <p className="text-white/80 text-xs font-black uppercase tracking-[0.5em] animate-pulse">Synchronizing Visuals...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#ff9a9e] via-[#fad0c4] to-[#fad0c4] flex flex-col relative overflow-hidden font-headline">
        
        {/* Animated Background Graphics */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
           <div className="absolute top-20 left-10 text-6xl animate-float" style={{ animationDelay: '0s' }}>🍎</div>
           <div className="absolute top-40 right-20 text-5xl animate-float" style={{ animationDelay: '1s' }}>🍊</div>
           <div className="absolute bottom-40 left-20 text-7xl animate-float" style={{ animationDelay: '2s' }}>🍋</div>
           <div className="absolute bottom-20 right-10 text-6xl animate-float" style={{ animationDelay: '0.5s' }}>🍇</div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl text-white/10 rotate-12">🍓</div>
        </div>

        {/* Background Music Loop */}
        <audio 
          ref={audioRef} 
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
          autoPlay 
          loop 
          muted={isMuted} 
        />

        {/* Win Reward Overlay */}
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
                <div className="flex justify-center gap-6">
                   <Star className="h-12 w-12 text-white animate-spin-slow fill-current" />
                   <Sparkles className="h-16 w-16 text-yellow-300 animate-pulse" />
                   <Star className="h-12 w-12 text-white animate-spin-slow fill-current delay-150" />
                </div>
             </div>
          </div>
        )}

        {/* Immersive Header */}
        <header className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
           <div className="flex items-center gap-4 pointer-events-auto">
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
                 <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none opacity-80">Party Frequency</p>
                    <p className="text-xs font-black text-white uppercase truncate w-28 italic drop-shadow-sm">{activeRoom?.title || 'Ummy Hub'}</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3 pointer-events-auto">
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

        {/* Main Game Stage */}
        <main className="flex-1 flex flex-col items-center justify-center pt-24 px-4 space-y-10">
           
           {/* The Interactive Cartoon Fruit Wheel */}
           <div className="relative w-[24rem] h-[24rem] flex items-center justify-center">
              {/* Outer Decorative Rings */}
              <div className="absolute inset-0 bg-white/20 rounded-full border-[12px] border-white/30 blur-[2px] shadow-2xl" />
              <div className="absolute inset-2 rounded-full border-4 border-white/20 border-dashed animate-spin-slow" />
              <div className="absolute inset-6 rounded-full border-2 border-white/10 border-dashed animate-spin-slow direction-reverse" />
              
              {/* Circular Betting Items */}
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
                      isActive ? "scale-125 z-30 border-white shadow-[0_0_40px_rgba(255,255,255,0.8)]" : "border-white/40",
                      isWinner && "animate-bounce scale-150 z-[40] ring-8 ring-yellow-400 border-white",
                      hasBet ? "border-yellow-400 shadow-xl" : "opacity-95",
                      gameState !== 'betting' && !isActive && !isWinner && "grayscale-[0.3] opacity-60",
                      item.color,
                      item.shadow
                    )}
                    style={{
                      transform: `rotate(${angle}deg) translate(150px) rotate(-${angle}deg)`
                    }}
                  >
                    <span className="text-4xl group-hover:scale-125 transition-transform drop-shadow-lg">{item.emoji}</span>
                    <div className="absolute -bottom-2 bg-white px-2 py-0.5 rounded-full border-2 border-black/10 shadow-sm">
                       <span className="text-[10px] font-black text-gray-800 uppercase italic leading-none">{item.label}</span>
                    </div>
                    
                    {/* Interactive Bet Stack Badge */}
                    {hasBet && (
                      <div className="absolute -top-6 -right-2 bg-yellow-400 text-black px-3 py-1 rounded-[1rem] text-xs font-black shadow-[0_10px_20px_rgba(0,0,0,0.2)] animate-in zoom-in bounce-in ring-4 ring-white z-50 flex items-center gap-1 border-b-4 border-yellow-600">
                         <Zap className="h-3 w-3 fill-current" />
                         {myBets[item.id] >= 1000 ? `${myBets[item.id]/1000}K` : myBets[item.id]}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Center Game Console Display */}
              <div className="relative z-20 w-44 h-40 bg-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center border-[6px] border-yellow-400 group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent" />
                 {gameState === 'betting' ? (
                   <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-500">
                    <div className="bg-yellow-100 p-2 rounded-xl mb-2">
                       <Timer className="h-8 w-8 text-yellow-600 animate-pulse" />
                    </div>
                    <span className="text-5xl font-black text-yellow-600 italic tracking-tighter drop-shadow-sm">{timeLeft}s</span>
                    <p className="text-[10px] font-black text-yellow-600/60 uppercase tracking-[0.2em] mt-1">Tap Fruit</p>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Result</span>
                      <span className="text-7xl animate-bounce drop-shadow-xl">{ITEMS[spinningIndex].emoji}</span>
                   </div>
                 )}
              </div>
           </div>

           {/* Results History Ribbon */}
           <div className="flex items-center gap-3 bg-white/20 backdrop-blur-xl p-3 rounded-[2rem] border-2 border-white/30 shadow-2xl overflow-hidden max-w-[90vw]">
              <div className="bg-white/40 p-2 rounded-xl">
                 <History className="h-5 w-5 text-white" />
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {history.map((id, i) => (
                  <div key={i} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white animate-in slide-in-from-right-10 duration-500" style={{ animationDelay: `${i * 0.1}s` }}>
                    {ITEMS.find(item => item.id === id)?.emoji}
                  </div>
                ))}
                {history.length === 0 && <span className="text-[10px] font-black text-white/60 uppercase italic tracking-widest px-4">Frequency History Empty</span>}
              </div>
           </div>

           {/* Cartoon Chip Selector */}
           <div className="w-full max-w-lg bg-white/20 backdrop-blur-2xl rounded-[3.5rem] border-4 border-white/40 p-8 space-y-6 shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative">
              <div className="flex justify-between items-center px-4">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Wager Intensity</p>
                 </div>
                 <Badge variant="outline" className="border-white/40 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full">Pro Party</Badge>
              </div>
              
              <div className="flex justify-between gap-3 overflow-x-auto pb-2 no-scrollbar px-2 h-20 items-center">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip}
                    onClick={() => setSelectedChip(chip)}
                    className={cn(
                      "flex-1 h-16 min-w-[76px] rounded-2xl flex flex-col items-center justify-center transition-all border-4 active:scale-90 relative group",
                      selectedChip === chip 
                        ? "bg-yellow-400 border-white shadow-[0_15px_30px_rgba(251,191,36,0.4)] -translate-y-2 scale-110 z-10" 
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    )}
                   >
                      {selectedChip === chip && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">✨</div>}
                      <span className="text-sm font-black italic drop-shadow-sm">{chip >= 1000 ? `${chip/1000}K` : chip}</span>
                   </button>
                 ))}
              </div>
           </div>
        </main>

        {/* Footer Voice Interactive Controls */}
        <footer className="p-8 flex justify-center items-center gap-10 pb-12 relative z-50">
           <div className="flex flex-col items-center group cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <Star className="h-6 w-6 text-white" />
              <span className="text-[8px] font-black text-white uppercase mt-1 tracking-widest">Rewards</span>
           </div>
           <Button 
             onClick={toggleMic}
             className={cn(
               "rounded-full h-20 w-20 shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all scale-110 border-4",
               currentUserParticipant?.isMuted 
                ? "bg-rose-500 border-rose-400 text-white hover:bg-rose-600" 
                : "bg-white border-blue-200 text-blue-500 hover:scale-125"
             )}
           >
             {currentUserParticipant?.isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8 animate-voice-wave" />}
           </Button>
           <div className="flex flex-col items-center group cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <Crown className="h-6 w-6 text-yellow-400 animate-float" />
              <span className="text-[8px] font-black text-white uppercase mt-1 tracking-widest">Tribe Host</span>
           </div>
        </footer>

      </div>
    </AppLayout>
  );
}
