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
  Coins,
  Sparkles
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ITEMS = [
  { id: 'banana', emoji: '🍌', multiplier: 5, label: '5 times', color: 'bg-yellow-400' },
  { id: 'strawberry', emoji: '🍓', multiplier: 5, label: '5 times', color: 'bg-red-500' },
  { id: 'orange', emoji: '🍊', multiplier: 5, label: '5 times', color: 'bg-orange-400' },
  { id: 'cherry', emoji: '🍒', multiplier: 5, label: '5 times', color: 'bg-red-600' },
  { id: 'grape', emoji: '🍇', multiplier: 5, label: '5 times', color: 'bg-purple-500' },
  { id: 'apple', emoji: '🍎', multiplier: 5, label: '5 times', color: 'bg-rose-500' },
  { id: 'burger', emoji: '🍔', multiplier: 10, label: '10 times', color: 'bg-orange-600' },
  { id: 'shrimp', emoji: '🍤', multiplier: 12, label: '12 times', color: 'bg-pink-400' },
];

const CHIPS = [100, 500, 1000, 5000, 10000];

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
    const spins = 24 + targetIdx; // At least 3 full rotations
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

    // Deduct bet from Firestore
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
      <div className="h-screen w-full bg-[#00E5FF] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
           <div className="absolute inset-0 bg-white/40 rounded-full blur-3xl animate-pulse" />
           <div className="text-8xl animate-bounce relative z-10">🍓</div>
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">Fruit Party</h1>
           <p className="text-white/80 text-xs font-black uppercase tracking-widest animate-pulse">Syncing Frequency Economy...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#4facfe] to-[#00f2fe] flex flex-col relative overflow-hidden font-headline">
        
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
             <div className="bg-black/40 backdrop-blur-md absolute inset-0" />
             <div className="relative z-10 text-center space-y-4">
                <div className="text-8xl animate-bounce">🏆</div>
                <h2 className="text-6xl font-black text-yellow-400 uppercase italic tracking-tighter drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">Big Win!</h2>
                <div className="bg-yellow-400 text-black px-10 py-4 rounded-full text-4xl font-black italic shadow-2xl flex items-center gap-3">
                   <Zap className="h-8 w-8 fill-current" />
                   +{lastWinAmount.toLocaleString()}
                </div>
                <div className="flex justify-center gap-4">
                   <Sparkles className="h-10 w-10 text-white animate-pulse" />
                   <Sparkles className="h-10 w-10 text-white animate-pulse delay-150" />
                   <Sparkles className="h-10 w-10 text-white animate-pulse delay-300" />
                </div>
             </div>
          </div>
        )}

        {/* Immersive Header */}
        <header className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
           <div className="flex items-center gap-3 pointer-events-auto">
              <button 
                onClick={() => router.back()}
                className="bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/20 text-white hover:bg-black/40 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3 shadow-lg">
                 <div className="flex -space-x-2">
                    {activeSpeakers.slice(0, 3).map(p => (
                      <Avatar key={p.uid} className="h-6 w-6 border-2 border-primary shadow-lg animate-voice-wave">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                 </div>
                 <div className="hidden sm:block">
                    <p className="text-[8px] font-black text-white uppercase tracking-widest leading-none opacity-60">Frequency</p>
                    <p className="text-[10px] font-black text-white uppercase truncate w-24 italic">{activeRoom?.title || 'Ummy Hub'}</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-2 pointer-events-auto">
              <div className="bg-yellow-400 text-black px-4 py-2 rounded-2xl border-2 border-white flex items-center gap-2 shadow-xl">
                 <Zap className="h-4 w-4 fill-current" />
                 <span className="text-sm font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
              <Button 
                onClick={() => setIsMuted(!isMuted)}
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/20 text-white border border-white/20"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
           </div>
        </header>

        {/* Main Game Board */}
        <main className="flex-1 flex flex-col items-center justify-center pt-20 px-4 space-y-8">
           
           {/* The Fruit Wheel */}
           <div className="relative w-80 h-80 flex items-center justify-center">
              <div className="absolute inset-0 bg-white/10 rounded-full border-8 border-white/20 blur-sm" />
              <div className="absolute inset-4 rounded-full border-4 border-white/40 border-dashed animate-spin-slow" />
              
              {/* Items in a circle */}
              {ITEMS.map((item, index) => {
                const angle = (index / ITEMS.length) * 360;
                const isActive = spinningIndex === index;
                const isWinner = gameState === 'result' && resultId === item.id;
                
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "absolute w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-2",
                      isActive ? "scale-125 z-20 border-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]" : "border-white/20 opacity-80",
                      isWinner && "animate-bounce scale-150 z-30 ring-4 ring-yellow-400",
                      item.color
                    )}
                    style={{
                      transform: `rotate(${angle}deg) translate(120px) rotate(-${angle}deg)`
                    }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[6px] font-black text-white uppercase">{item.multiplier}X</span>
                  </div>
                );
              })}

              {/* Center Display */}
              <div className="relative z-10 w-32 h-32 bg-white rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-yellow-400">
                 {gameState === 'betting' ? (
                   <>
                    <Timer className="h-6 w-6 text-yellow-600 mb-1" />
                    <span className="text-4xl font-black text-yellow-600 italic tracking-tighter">{timeLeft}s</span>
                    <span className="text-[8px] font-black text-yellow-600 uppercase">Betting</span>
                   </>
                 ) : (
                   <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400">Winning</span>
                      <span className="text-5xl animate-in zoom-in duration-500">{ITEMS[spinningIndex].emoji}</span>
                   </div>
                 )}
              </div>
           </div>

           {/* History */}
           <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
              <History className="h-4 w-4 text-white/40 ml-2" />
              {history.map((id, i) => (
                <div key={i} className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center text-lg animate-in slide-in-from-right-4">
                  {ITEMS.find(item => item.id === id)?.emoji}
                </div>
              ))}
           </div>

           {/* Betting Controls */}
           <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center px-2">
                 <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Select Wager Chip</p>
                 <Badge variant="outline" className="border-white/20 text-white text-[8px]">Fruit Party Engine v1.3</Badge>
              </div>
              
              <div className="flex justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip}
                    onClick={() => setSelectedChip(chip)}
                    className={cn(
                      "flex-1 h-12 min-w-[60px] rounded-2xl flex flex-col items-center justify-center transition-all border-2 active:scale-95",
                      selectedChip === chip 
                        ? "bg-yellow-400 border-white shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110" 
                        : "bg-white/10 border-white/10 text-white/60"
                    )}
                   >
                      <span className="text-xs font-black italic">{chip >= 1000 ? `${chip/1000}K` : chip}</span>
                   </button>
                 ))}
              </div>

              <div className="grid grid-cols-4 gap-3">
                 {ITEMS.map(item => (
                   <button 
                    key={item.id}
                    onClick={() => handlePlaceBet(item.id)}
                    disabled={gameState !== 'betting'}
                    className={cn(
                      "relative h-16 rounded-2xl flex flex-col items-center justify-center transition-all border-2 group active:scale-95 overflow-visible",
                      myBets[item.id] ? "border-yellow-400 bg-white/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]" : "border-white/10 bg-black/20",
                      gameState !== 'betting' && "opacity-50 grayscale"
                    )}
                   >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                      <span className="text-[8px] font-black text-white/60">{item.multiplier}X</span>
                      
                      {/* Interactive Bet Stack Indicator */}
                      {myBets[item.id] && (
                        <div 
                          key={myBets[item.id]} 
                          className="absolute -top-3 -right-2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[10px] font-black shadow-xl animate-in zoom-in bounce-in ring-2 ring-white z-50 flex items-center gap-0.5"
                        >
                           <Zap className="h-2.5 w-2.5 fill-current" />
                           {myBets[item.id] >= 1000 ? `${myBets[item.id]/1000}K` : myBets[item.id]}
                        </div>
                      )}
                   </button>
                 ))}
              </div>
           </div>
        </main>

        {/* Footer Voice Action */}
        <footer className="p-6 flex justify-center items-center gap-6 pb-10">
           <Button 
             onClick={toggleMic}
             className={cn(
               "rounded-full h-14 w-14 shadow-2xl transition-all scale-110",
               currentUserParticipant?.isMuted ? "bg-red-500/20 text-red-500 border border-red-500/40" : "bg-white text-blue-500 border-4 border-blue-500/20"
             )}
           >
             {currentUserParticipant?.isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
           </Button>
           <div className="flex flex-col items-center">
              <Crown className="h-4 w-4 text-yellow-400 animate-pulse" />
              <span className="text-[8px] font-black text-white uppercase mt-1">Live Tribe Party</span>
           </div>
        </footer>

      </div>
    </AppLayout>
  );
}
