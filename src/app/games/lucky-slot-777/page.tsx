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
  Settings,
  HelpCircle,
  BarChart3,
  Menu,
  ChevronDown,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const ITEMS = [
  { id: 'peach', emoji: '🍑', multiplier: 2, label: 'x2', color: 'from-purple-600 to-purple-800', shadow: 'shadow-purple-500/40', order: 1 },
  { id: 'seven', emoji: '777', multiplier: 8, label: 'x8', color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/40', isSpecial: true, order: 2 },
  { id: 'watermelon', emoji: '🍉', multiplier: 2, label: 'x2', color: 'from-purple-600 to-purple-800', shadow: 'shadow-purple-500/40', order: 3 },
];

const WHEEL_DISTRIBUTION = [
  'watermelon', 'peach', 'watermelon', 'peach', 'watermelon', 'watermelon', 'peach', 'seven'
];

const CHIPS = [
  { value: 100, color: 'bg-blue-600', label: '100', border: 'border-blue-400' },
  { value: 1000, color: 'bg-yellow-500', label: '1K', border: 'border-yellow-300' },
  { value: 10000, color: 'bg-red-600', label: '10K', border: 'border-red-400' },
  { value: 100000, color: 'bg-purple-600', label: '100K', border: 'border-purple-400' },
  { value: 500000, color: 'bg-emerald-600', label: '500K', border: 'border-emerald-400' },
  { value: 1000000, color: 'bg-slate-900', label: '1M', border: 'border-slate-700' },
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'spinning') {
      interval = setInterval(() => {
        setSpinningIndex(prev => (prev + 1) % WHEEL_DISTRIBUTION.length);
      }, 60);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startSpin = (targetIdx: number) => {
    setGameState('spinning');
    
    const sliceAngle = 360 / WHEEL_DISTRIBUTION.length;
    const extraSpins = 50; 
    const landingAngle = (360 - (targetIdx * sliceAngle)) % 360;
    const totalRotation = rotation + (360 * extraSpins) + landingAngle;
    
    setRotation(totalRotation);
    setResultId(WHEEL_DISTRIBUTION[targetIdx]);

    setTimeout(() => {
      setSpinningIndex(targetIdx);
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
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col items-center justify-center space-y-6 overflow-hidden font-headline">
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
      <div className="h-screen w-full bg-[#1a0a2e] flex flex-col relative overflow-hidden font-headline">
        
        {/* Theatrical Stage - Cinematic Curtains and Pillars */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-b from-[#2d1b4e] via-[#1a0a2e] to-[#0a0514]" />
           {/* Pillars */}
           <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-black/40 to-transparent border-r border-white/5" />
           <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-black/40 to-transparent border-l border-white/5" />
           <div className="absolute top-0 left-4 w-12 h-full bg-[#2d1b4e]/30 backdrop-blur-sm rounded-full blur-md opacity-20" />
           <div className="absolute top-0 right-4 w-12 h-full bg-[#2d1b4e]/30 backdrop-blur-sm rounded-full blur-md opacity-20" />
           
           {/* Center Stage Spotlight */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <audio 
          ref={audioRef} 
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" 
          autoPlay 
          loop 
          muted={isMuted} 
        />

        <header className="absolute top-0 left-0 right-0 z-[60] p-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full border border-white/10 text-white hover:scale-110 transition-all shadow-xl">
                <Menu className="h-5 w-5" />
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                <HelpCircle className="h-5 w-5" />
              </button>
              <button className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                <BarChart3 className="h-5 w-5" />
              </button>
           </div>

           <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10">
              <span className="text-sm font-black text-white uppercase italic tracking-tighter">Lucky 777</span>
           </div>

           <div className="flex items-center gap-2">
              <button className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                <Menu className="h-5 w-5" />
              </button>
              <button className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                <ChevronDown className="h-5 w-5" />
              </button>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full border border-white/10 text-white">
                <X className="h-5 w-5" />
              </button>
           </div>
        </header>

        {/* Real-Time Winner Podium */}
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
                   <p className="text-yellow-400 text-sm font-black uppercase tracking-widest">Tribe MVP Found</p>
                </div>
                {lastWinners[0] && (
                  <div className="flex flex-col items-center w-full max-w-xs space-y-4 animate-in slide-in-from-bottom-20 duration-1000">
                    <Avatar className="h-32 w-32 border-4 border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                      <AvatarImage src={lastWinners[0].avatar} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
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
        )}

        <main className="flex-1 flex flex-col items-center justify-center pt-20 px-4 space-y-6">
           
           {/* Ornate Rotating Wheel */}
           <div className="relative w-[22rem] h-[22rem] flex items-center justify-center">
              {/* Golden Decorative Wings (The "Fins" on side of machine) */}
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-20 h-40 flex flex-col gap-1 pointer-events-none opacity-80">
                 <div className="h-8 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg" />
                 <div className="h-10 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg ml-2" />
                 <div className="h-12 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg ml-4" />
                 <div className="h-10 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg ml-2" />
                 <div className="h-8 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg" />
              </div>
              <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-20 h-40 flex flex-col gap-1 pointer-events-none opacity-80 rotate-180">
                 <div className="h-8 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg" />
                 <div className="h-10 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg ml-2" />
                 <div className="h-12 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg ml-4" />
                 <div className="h-10 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg ml-2" />
                 <div className="h-8 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l-2xl border-y border-l border-yellow-700/50 shadow-lg" />
              </div>

              {/* Top Gem Pointer */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
                 <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-900 rotate-45 border-4 border-yellow-500 shadow-2xl relative">
                    <div className="absolute inset-1 bg-white/20 rounded-full blur-sm animate-pulse" />
                 </div>
                 <div className="w-6 h-8 bg-yellow-500 clip-path-triangle -mt-2 shadow-lg" />
              </div>

              {/* Physical Rotating Wheel Container */}
              <div 
                className={cn(
                  "relative w-full h-full rounded-full border-[12px] border-yellow-500 shadow-2xl overflow-hidden ring-8 ring-black/40",
                  gameState === 'spinning' 
                    ? "transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1) animate-pulse" 
                    : "transition-none"
                )}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                 <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                       <linearGradient id="sliceBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0099ff" />
                          <stop offset="100%" stopColor="#0066cc" />
                       </linearGradient>
                       <linearGradient id="slicePink" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ff00cc" />
                          <stop offset="100%" stopColor="#cc0099" />
                       </linearGradient>
                    </defs>
                    {WHEEL_DISTRIBUTION.map((id, i) => {
                      const angle = i * 45;
                      return (
                        <g key={i} transform={`rotate(${angle} 50 50)`}>
                           <path 
                             d="M 50 50 L 50 0 A 50 50 0 0 1 85.35 14.65 Z" 
                             fill={id === 'seven' ? 'url(#slicePink)' : 'url(#sliceBlue)'}
                             stroke="#fbbf24"
                             strokeWidth="0.8"
                             className="opacity-100"
                           />
                           <text 
                             x="68" y="28" 
                             transform="rotate(22.5 68 28)" 
                             fontSize="10" 
                             textAnchor="middle" 
                             className="pointer-events-none drop-shadow-xl font-black fill-white select-none"
                           >
                             {id === 'seven' ? '777' : (id === 'peach' ? '🍑' : '🍉')}
                           </text>
                        </g>
                      );
                    })}
                 </svg>
              </div>

              {/* Central Status Hub */}
              <div className="absolute z-20 w-32 h-32 bg-black rounded-full shadow-2xl flex flex-col items-center justify-center border-[8px] border-yellow-500 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent" />
                 {gameState === 'betting' ? (
                   <div className="relative z-10 flex flex-col items-center">
                    <span className="text-5xl font-black text-white italic tracking-tighter drop-shadow-sm">{timeLeft}</span>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col items-center animate-pulse">
                      <span className="text-4xl font-black text-yellow-500 drop-shadow-xl">
                        {WHEEL_DISTRIBUTION[spinningIndex] === 'seven' ? '777' : (WHEEL_DISTRIBUTION[spinningIndex] === 'peach' ? '🍑' : '🍉')}
                      </span>
                   </div>
                 )}
              </div>
           </div>

           {/* Results Ribbon Strip */}
           <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-white/5 rounded-full py-2 px-6 flex items-center gap-4 mx-auto">
              <History className="h-4 w-4 text-yellow-500 shrink-0" />
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 flex-1">
                {history.map((id, i) => (
                  <div key={i} className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center text-xl border border-purple-500/20 relative shrink-0">
                    {id === 'seven' ? '7️⃣' : (id === 'peach' ? '🍑' : '🍉')}
                    {i === 0 && <Badge className="absolute -top-3 -right-3 bg-red-500 text-white text-[6px] h-4 px-1 font-black shadow-lg animate-bounce border border-white">NEW</Badge>}
                  </div>
                ))}
                {history.length === 0 && <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Waiting for Results...</span>}
              </div>
           </div>

           {/* High-Fidelity Triple Betting Dashboard */}
           <div className="w-full max-w-xl grid grid-cols-3 gap-3 px-2">
              {ITEMS.map(item => (
                <button 
                  key={item.id}
                  onClick={() => handlePlaceBet(item.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative group h-44 rounded-3xl border-4 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-4",
                    "bg-gradient-to-b from-[#4a1d96] to-[#2d0b5a]",
                    gameState === 'betting' ? "hover:scale-105 active:scale-95 border-yellow-500/30" : "opacity-60 grayscale-[0.2] border-white/5",
                    myBets[item.id] && "border-yellow-400 ring-4 ring-yellow-400/20"
                  )}
                >
                   {/* Background Diamond Pattern Overlay */}
                   <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                   
                   <div className="absolute top-2 right-2 text-[10px] font-black text-white/40 bg-black/20 px-2 py-0.5 rounded-full">
                      {formatAmount(myBets[item.id] || 0)} / {item.id === 'seven' ? '6520' : (item.id === 'peach' ? '15670' : '20560')}
                   </div>

                   <span className="text-5xl mb-2 drop-shadow-2xl group-hover:scale-110 transition-transform">
                      {item.id === 'seven' ? '🎰' : item.emoji}
                   </span>
                   
                   <div className="flex items-center gap-1 mt-1">
                      <span className="text-3xl font-black text-yellow-400 italic tracking-tighter drop-shadow-md">{item.label}</span>
                   </div>
                   
                   {myBets[item.id] && (
                     <div className="absolute inset-0 bg-yellow-400/5 animate-pulse" />
                   )}
                </button>
              ))}
           </div>

           {/* High-Stakes Chip Selector */}
           <div className="w-full max-w-lg flex items-center justify-between gap-4 px-4 pb-10">
              <div className="flex items-center gap-2">
                 <Avatar className="h-10 w-10 border-2 border-yellow-500 shadow-lg">
                    <AvatarImage src={userProfile?.avatarUrl} />
                    <AvatarFallback>U</AvatarFallback>
                 </Avatar>
                 <div className="bg-black/40 backdrop-blur-md px-4 h-10 flex items-center gap-2 rounded-full border border-white/10">
                    <Zap className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                 <button 
                   onClick={() => setMyBets({})}
                   disabled={gameState !== 'betting'}
                   className="h-12 px-6 rounded-full bg-white/10 border border-white/20 text-white font-black uppercase italic tracking-widest text-[10px] hover:bg-white/20 transition-all active:scale-95"
                 >
                    Repeat
                 </button>
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "h-14 w-14 rounded-full flex items-center justify-center transition-all border-4 active:scale-90 relative shrink-0",
                      selectedChip === chip.value 
                        ? "scale-110 z-10 shadow-[0_0_20px_rgba(255,255,255,0.4)] " + chip.color + " " + chip.border
                        : "bg-black/40 border-white/10 text-white/60"
                    )}
                   >
                      <span className="text-[10px] font-black italic">{chip.label}</span>
                      {selectedChip === chip.value && <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />}
                   </button>
                 ))}
              </div>
           </div>
        </main>

        {/* Voice Footer */}
        <footer className="absolute bottom-6 left-0 right-0 z-50 flex justify-center pb-4">
           <Button 
             onClick={() => {
               if (!firestore || !activeRoom?.id || !currentUser || !currentUserParticipant) return;
               updateDocumentNonBlocking(doc(firestore, 'chatRooms', activeRoom.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant.isMuted });
             }}
             className={cn(
               "rounded-full h-16 w-16 shadow-2xl transition-all scale-110 border-4",
               currentUserParticipant?.isMuted 
                ? "bg-rose-600 border-rose-400 text-white" 
                : "bg-purple-600 border-purple-400 text-white hover:scale-125"
             )}
           >
             {currentUserParticipant?.isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6 animate-voice-wave" />}
           </Button>
        </footer>

      </div>
    </AppLayout>
  );
}
