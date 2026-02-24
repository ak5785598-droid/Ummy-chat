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
  Gamepad2,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const ITEMS = [
  { id: 'watermelon', emoji: '🍉', multiplier: 2, label: 'x2', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/40' },
  { id: 'peach', emoji: '🍑', multiplier: 2, label: 'x2', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/40' },
  { id: 'seven', emoji: '7️⃣7️⃣', multiplier: 8, label: 'x8', color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/40', isSpecial: true },
];

const WHEEL_DISTRIBUTION = [
  'watermelon', 'peach', 'watermelon', 'peach', 'watermelon', 'watermelon', 'peach', 'seven'
];

const CHIPS = [
  { value: 100, color: 'bg-blue-600', label: '100' },
  { value: 1000, color: 'bg-yellow-500', label: '1K' },
  { value: 10000, color: 'bg-red-600', label: '10K' },
  { value: 100000, color: 'bg-purple-600', label: '100K' },
  { value: 500000, color: 'bg-emerald-600', label: '500K' },
  { value: 1000000, color: 'bg-slate-900', label: '1M' },
];

type RoundWinner = {
  name: string;
  amount: number;
  avatar: string;
  isMe?: boolean;
};

export default function LuckySlot777Page() {
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
  const [resultId, setResultId] = useState<string | null>(null);
  const [spinningIndex, setSpinningIndex] = useState(0);
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
  const activeSpeakers = participants?.filter(p => !p.isMuted && p.seatIndex > 0) || [];

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
          const randomIndex = Math.floor(Math.random() * WHEEL_DISTRIBUTION.length);
          startSpin(randomIndex);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startSpin = (targetIdx: number) => {
    setGameState('spinning');
    
    // Physical Rotation Logic:
    // 8 slices, each 45 degrees.
    // Landing Angle centers the winning slice at the top (0 degrees).
    const sliceAngle = 360 / WHEEL_DISTRIBUTION.length;
    const extraSpins = 40; // Hyper-velocity sustained rotations
    const landingAngle = (360 - (targetIdx * sliceAngle)) % 360;
    const totalRotation = rotation + (360 * extraSpins) + landingAngle;
    
    setRotation(totalRotation);
    setResultId(WHEEL_DISTRIBUTION[targetIdx]);
    setSpinningIndex(targetIdx);

    // Sustained 5s duration for hyper-velocity rotation
    setTimeout(() => {
      showResult(WHEEL_DISTRIBUTION[targetIdx]);
    }, 5000);
  };

  const showResult = (id: string) => {
    setGameState('result');
    setHistory(prev => [id, ...prev].slice(0, 12));
    
    const winningItem = ITEMS.find(i => i.id === id);
    const multiplier = winningItem?.multiplier || 0;
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
    }, 4000);
  };

  const handlePlaceBet = (itemId: string) => {
    if (gameState !== 'betting' || !currentUser || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < selectedChip) {
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

  const formatAmount = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return v.toString();
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6 overflow-hidden">
        <div className="relative">
           <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
           <div className="text-8xl animate-bounce relative z-10">🎰</div>
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Lucky Slot 777</h1>
           <p className="text-purple-400 text-xs font-black uppercase tracking-[0.5em] animate-pulse">Syncing Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e] flex flex-col relative overflow-hidden font-headline">
        
        {/* Theatrical Stage Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
           <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-900 to-transparent" />
           <div className="absolute bottom-0 left-10 w-24 h-[80vh] bg-gradient-to-t from-purple-900/40 to-transparent rounded-t-full border-x border-white/5" />
           <div className="absolute bottom-0 right-10 w-24 h-[80vh] bg-gradient-to-t from-purple-900/40 to-transparent rounded-t-full border-x border-white/5" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <audio 
          ref={audioRef} 
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" 
          autoPlay 
          loop 
          muted={isMuted} 
        />

        {/* Real-Time Winners Podium Overlay */}
        {gameState === 'result' && lastWinners.length > 0 && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="bg-black/90 backdrop-blur-2xl absolute inset-0" />
             <div className="relative z-10 text-center space-y-12 max-w-2xl w-full px-6">
                <div className="relative space-y-2">
                   <div className="absolute inset-0 bg-purple-500/20 blur-[100px] animate-pulse rounded-full" />
                   <div className="flex justify-center mb-4">
                      <div className="bg-yellow-500 p-4 rounded-3xl shadow-2xl shadow-yellow-500/40">
                         <Trophy className="h-12 w-12 text-white animate-bounce" />
                      </div>
                   </div>
                   <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Big Winner</h2>
                   <p className="text-yellow-400 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" /> Frequency Legend <Sparkles className="h-4 w-4" />
                   </p>
                </div>

                <div className="flex items-end justify-center gap-4">
                   {lastWinners[0] && (
                     <div className="flex flex-col items-center w-full max-w-xs space-y-4 animate-in slide-in-from-bottom-20 duration-1000">
                        <div className="relative">
                           <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 h-12 w-12 text-yellow-400 animate-bounce" />
                           <Avatar className="h-32 w-32 border-4 border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                              <AvatarImage src={lastWinners[0].avatar} />
                              <AvatarFallback>U</AvatarFallback>
                           </Avatar>
                        </div>
                        <div className="bg-yellow-400/20 border-2 border-yellow-400/50 p-6 rounded-t-[2.5rem] w-full text-center space-y-1 shadow-2xl backdrop-blur-xl">
                           <p className="text-lg font-black text-white uppercase italic tracking-tighter">{lastWinners[0].name}</p>
                           <p className="text-2xl font-black text-yellow-400 italic flex items-center justify-center gap-1">
                              <Zap className="h-5 w-5 fill-current" />
                              {formatAmount(lastWinners[0].amount)}
                           </p>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        <header className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="bg-white/5 backdrop-blur-xl p-3 rounded-full border border-white/10 text-white hover:scale-110 transition-all shadow-xl">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="bg-purple-900/40 backdrop-blur-xl px-6 py-3 rounded-[1.5rem] border border-purple-500/20 flex items-center gap-4 shadow-2xl">
                 <div className="flex -space-x-3">
                    {activeSpeakers.slice(0, 3).map(p => (
                      <Avatar key={p.uid} className="h-8 w-8 border-2 border-purple-500 shadow-lg animate-voice-wave">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                 </div>
                 <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">Slot Tribe</p>
                    <p className="text-xs font-black text-white uppercase truncate w-28 italic">{activeRoom?.title || 'Grand Hall'}</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="bg-yellow-500 text-black px-6 py-3 rounded-[1.5rem] border-4 border-yellow-600 flex items-center gap-3 shadow-2xl">
                 <Zap className="h-5 w-5 fill-current" />
                 <span className="text-xl font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>
              <button onClick={() => setIsMuted(!isMuted)} className="rounded-full h-12 w-12 bg-white/5 backdrop-blur-md text-white border border-white/10 flex items-center justify-center hover:scale-110 transition-all shadow-xl">
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
           </div>
        </header>

        {/* Grand History Ribbon */}
        <div className="absolute top-24 left-0 right-0 z-40 px-6">
           <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-full py-2 px-6 flex items-center gap-4 max-w-lg mx-auto">
              <History className="h-4 w-4 text-yellow-500 shrink-0" />
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 flex-1">
                {history.map((id, i) => (
                  <div key={i} className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center text-xl border border-purple-500/20 relative">
                    {id === 'seven' ? '7️⃣' : (id === 'peach' ? '🍑' : '🍉')}
                    {i === 0 && <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[6px] h-3 px-1 font-black">NEW</Badge>}
                  </div>
                ))}
                {history.length === 0 && <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Waiting for First Frequency...</span>}
              </div>
           </div>
        </div>

        {/* The Rotating Golden Wheel Stage */}
        <main className="flex-1 flex flex-col items-center justify-center pt-32 px-4 space-y-12">
           
           <div className="relative w-[22rem] h-[22rem] flex items-center justify-center">
              <div className="absolute -inset-10 border-[16px] border-yellow-600/20 rounded-full shadow-[0_0_60px_rgba(234,179,8,0.2)]" />
              <div className="absolute -inset-6 border-[4px] border-yellow-500/40 rounded-full" />
              
              {/* Physical Rotating Wheel Container */}
              <div 
                className={cn(
                  "relative w-full h-full rounded-full border-[8px] border-yellow-500 shadow-2xl overflow-hidden",
                  gameState === 'spinning' 
                    ? "transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1) animate-pulse" 
                    : "transition-none"
                )}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                 <svg viewBox="0 0 100 100" className="w-full h-full">
                    {WHEEL_DISTRIBUTION.map((id, i) => {
                      const angle = i * 45;
                      return (
                        <g key={i} transform={`rotate(${angle} 50 50)`}>
                           <path 
                             d="M 50 50 L 50 0 A 50 50 0 0 1 85.35 14.65 Z" 
                             fill={id === 'seven' ? '#ff006e' : (i % 2 === 0 ? '#0077b6' : '#00b4d8')}
                             stroke="#fbbf24"
                             strokeWidth="0.5"
                             className="opacity-90"
                           />
                           <text 
                             x="65" y="25" 
                             transform="rotate(22.5 65 25)" 
                             fontSize="8" 
                             textAnchor="middle" 
                             className="pointer-events-none drop-shadow-md font-black fill-white"
                           >
                             {id === 'seven' ? '77' : (id === 'peach' ? '🍑' : '🍉')}
                           </text>
                        </g>
                      );
                    })}
                 </svg>
              </div>

              {/* Central Non-Rotating Hub */}
              <div className="absolute z-20 w-32 h-32 bg-black rounded-full shadow-2xl flex flex-col items-center justify-center border-[6px] border-yellow-500 group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
                 {gameState === 'betting' ? (
                   <div className="relative z-10 flex flex-col items-center animate-in fade-in">
                    <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest mb-1 text-center">Place<br/>Bets</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-sm">{timeLeft}s</span>
                   </div>
                 ) : gameState === 'spinning' ? (
                   <div className="relative z-10 flex flex-col items-center animate-pulse">
                      <RefreshCw className="h-10 w-10 text-yellow-500 animate-spin" />
                      <span className="text-[8px] font-black uppercase text-yellow-500/60 tracking-widest mt-2">Spinning...</span>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col items-center animate-in zoom-in">
                      <span className="text-[8px] font-black uppercase text-yellow-500/60 tracking-widest mb-1">Result</span>
                      <span className="text-5xl animate-bounce">
                        {WHEEL_DISTRIBUTION[spinningIndex] === 'seven' ? '77' : (WHEEL_DISTRIBUTION[spinningIndex] === 'peach' ? '🍑' : '🍉')}
                      </span>
                   </div>
                 )}
              </div>

              {/* Result Pointer Arrow */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                 <div className="w-8 h-10 bg-yellow-500 clip-path-triangle shadow-lg border-x border-b border-black/20" />
              </div>
           </div>

           {/* Three-Tier Betting Dashboard */}
           <div className="w-full max-w-xl grid grid-cols-3 gap-4 px-2">
              {ITEMS.map(item => (
                <button 
                  key={item.id}
                  onClick={() => handlePlaceBet(item.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative group h-40 rounded-[2rem] border-4 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-4",
                    item.isSpecial ? "border-pink-500/50 bg-pink-900/20" : "border-blue-500/50 bg-blue-900/20",
                    gameState === 'betting' ? "hover:scale-105 active:scale-95" : "opacity-60 grayscale-[0.2]",
                    myBets[item.id] && "border-yellow-400 ring-4 ring-yellow-400/20"
                  )}
                >
                   <div className="absolute inset-0 bg-gradient-to-br opacity-20 from-white/20 to-transparent" />
                   <span className="text-5xl mb-2 drop-shadow-xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                   <span className="text-2xl font-black text-yellow-400 italic tracking-tighter">{item.label}</span>
                   
                   {myBets[item.id] && (
                     <div className="absolute -top-2 -right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-black shadow-xl animate-in zoom-in bounce-in border-2 border-white">
                        {formatAmount(myBets[item.id])}
                     </div>
                   )}
                </button>
              ))}
           </div>

           {/* High-Stakes Chip Selector */}
           <div className="w-full max-w-lg bg-black/60 backdrop-blur-2xl rounded-full border-2 border-white/10 p-2 flex items-center justify-between shadow-2xl">
              <div className="flex-1 flex justify-center gap-3 px-4">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center transition-all border-2 active:scale-90 relative",
                      selectedChip === chip.value 
                        ? "border-yellow-400 shadow-xl scale-110 z-10 " + chip.color
                        : "bg-white/5 border-white/10 text-white/60"
                    )}
                   >
                      <span className="text-[10px] font-black italic">{chip.label}</span>
                   </button>
                 ))}
              </div>
              <Button 
                variant="ghost"
                className="h-12 rounded-full px-8 bg-white text-black font-black uppercase italic tracking-widest hover:bg-gray-200"
                onClick={() => setMyBets({})}
                disabled={gameState !== 'betting'}
              >
                 Clear
              </Button>
           </div>
        </main>

        <footer className="p-8 flex justify-center items-center gap-10 pb-12 relative z-50">
           <Button 
             onClick={() => {
               if (!firestore || !activeRoom?.id || !currentUser || !currentUserParticipant) return;
               updateDocumentNonBlocking(doc(firestore, 'chatRooms', activeRoom.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant.isMuted });
             }}
             className={cn(
               "rounded-full h-20 w-20 shadow-2xl transition-all scale-110 border-4",
               currentUserParticipant?.isMuted 
                ? "bg-rose-600 border-rose-400 text-white" 
                : "bg-purple-600 border-purple-400 text-white hover:scale-125"
             )}
           >
             {currentUserParticipant?.isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8 animate-voice-wave" />}
           </Button>
        </footer>

      </div>
    </AppLayout>
  );
}
