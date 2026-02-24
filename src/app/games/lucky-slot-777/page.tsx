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
import { CompactRoomView } from '@/components/compact-room-view';

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
  { value: 100000, color: 'bg-purple-600', label: '100K', border: 'border-purple-400' },
  { value: 500000, color: 'bg-emerald-600', label: '500K', border: 'border-emerald-400' },
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
    
    const baseRotation = Math.floor(rotation / 360) * 360;
    const totalRotation = baseRotation + (360 * extraSpins) + landingAngle;
    
    setTimeout(() => {
      setRotation(totalRotation);
      setResultId(WHEEL_DISTRIBUTION[targetIdx]);
    }, 50);

    setTimeout(() => {
      setSpinningIndex(targetIdx);
      showResult(WHEEL_DISTRIBUTION[targetIdx]);
    }, 5050);
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
        
        <CompactRoomView />

        <div className="flex-1 flex flex-col items-center pt-4 overflow-y-auto pb-32 px-4 relative z-10">
           
           <header className="w-full flex items-center justify-between mb-4">
              <div className="bg-black/40 backdrop-blur-xl px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                 <History className="h-3 w-3 text-yellow-500" />
                 <div className="flex gap-1">
                    {history.slice(0, 6).map((id, i) => (
                      <span key={i} className="text-xs">{id === 'seven' ? '7️⃣' : (id === 'peach' ? '🍑' : '🍉')}</span>
                    ))}
                 </div>
              </div>
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white"><X className="h-4 w-4" /></button>
           </header>

           <div className="relative w-56 h-56 flex items-center justify-center scale-90 sm:scale-100">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
                 <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-900 rotate-45 border-2 border-yellow-500" />
                 <div className="w-4 h-6 bg-yellow-500 clip-path-triangle -mt-1 shadow-lg" />
              </div>

              <div 
                className={cn(
                  "relative w-full h-full rounded-full border-[8px] border-yellow-500 shadow-2xl",
                  gameState === 'spinning' ? "transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)" : "transition-none"
                )}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                 <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
                    {WHEEL_DISTRIBUTION.map((id, i) => {
                      const angle = i * 45;
                      return (
                        <g key={i} transform={`rotate(${angle} 50 50)`}>
                           <path d="M 50 50 L 50 0 A 50 50 0 0 1 85.35 14.65 Z" fill={id === 'seven' ? '#ff00cc' : '#0099ff'} stroke="#fbbf24" strokeWidth="0.5" />
                           <text x="68" y="28" transform="rotate(22.5 68 28)" fontSize="8" textAnchor="middle" className="font-black fill-white">{id === 'seven' ? '777' : (id === 'peach' ? '🍑' : '🍉')}</text>
                        </g>
                      );
                    })}
                 </svg>
              </div>

              <div className="absolute z-20 w-20 h-24 bg-black rounded-full shadow-2xl flex flex-col items-center justify-center border-[4px] border-yellow-500 overflow-hidden">
                 {gameState === 'betting' ? (
                   <span className="text-3xl font-black text-white italic">{timeLeft}</span>
                 ) : (
                   <span className="text-3xl animate-pulse">
                      {WHEEL_DISTRIBUTION[spinningIndex] === 'seven' ? '777' : (WHEEL_DISTRIBUTION[spinningIndex] === 'peach' ? '🍑' : '🍉')}
                   </span>
                 )}
              </div>
           </div>

           <div className="w-full max-w-sm grid grid-cols-3 gap-2 px-2 mt-6">
              {ITEMS.map(item => (
                <button 
                  key={item.id}
                  onClick={() => handlePlaceBet(item.id)}
                  disabled={gameState !== 'betting'}
                  className={cn(
                    "relative h-32 rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2",
                    "bg-gradient-to-b from-[#4a1d96] to-[#2d0b5a]",
                    myBets[item.id] && "border-yellow-400 ring-2 ring-yellow-400/20"
                  )}
                >
                   <span className="text-3xl mb-1">{item.emoji}</span>
                   <span className="text-xl font-black text-yellow-400 italic">{item.label}</span>
                   {myBets[item.id] && (
                     <div className="absolute top-1 right-1 text-[8px] font-black text-white bg-black/40 px-1.5 rounded-full">
                        {(myBets[item.id] / 1000).toFixed(0)}K
                     </div>
                   )}
                </button>
              ))}
           </div>

           <div className="w-full max-w-sm fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-black/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-3 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-2 bg-white/5 px-3 h-10 rounded-full">
                 <Zap className="h-3 w-3 text-yellow-400 fill-current" />
                 <span className="text-xs font-black italic text-white">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              </div>

              <div className="flex-1 flex justify-center gap-1.5 px-2">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center transition-all border-2 shrink-0",
                      selectedChip === chip.value ? chip.color + " border-white scale-110" : "bg-black/40 border-white/10"
                    )}
                   >
                      <span className="text-[7px] font-black italic text-white">{chip.label}</span>
                   </button>
                 ))}
              </div>

              <button 
                onClick={() => {
                  if (!firestore || !activeRoom?.id || !currentUser || !currentUserParticipant) return;
                  updateDocumentNonBlocking(doc(firestore, 'chatRooms', activeRoom.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant.isMuted });
                }}
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all border-2",
                  currentUserParticipant?.isMuted ? "bg-rose-600 border-rose-400" : "bg-purple-600 border-purple-400"
                )}
              >
                {currentUserParticipant?.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 animate-voice-wave" />}
              </button>
           </div>
        </div>

        <style jsx global>{`
          .clip-path-triangle {
            clip-path: polygon(50% 100%, 0 0, 100% 0);
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
