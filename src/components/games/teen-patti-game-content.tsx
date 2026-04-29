'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  X,
  Move
} from 'lucide-react';
import { CompactRoomView } from '@/components/compact-room-view';
import { GoldCoinIcon, UmmyLogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay, GameWinner } from '@/components/game-result-overlay';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const CHIPS = [
 { value: 10000, label: '10k', color: 'bg-[#00E5FF] border-[#00E5FF]/50 shadow-[#00E5FF]/40' },
 { value: 100000, label: '100k', color: 'bg-[#2196F3] border-[#2196F3]/50 shadow-[#2196F3]/40' },
 { value: 300000, label: '300k', color: 'bg-[#9C27B0] border-[#9C27B0]/50 shadow-[#9C27B0]/40' },
 { value: 1000000, label: '1000k', color: 'bg-[#F44336] border-[#F44336]/50 shadow-[#F44336]/40' },
 { value: 2000000, label: '2000k', color: 'bg-[#795548] border-[#795548]/50 shadow-[#795548]/40' },
 { value: 5000000, label: '5000k', color: 'bg-[#FFD700] border-[#FFD700]/50 shadow-[#FFD700]/40' },
];

// --- 3D GLOSSY SVG BANNERS (URL ki jagah) ---
const BannerBase = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <svg viewBox="0 0 200 260" className={cn("drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff8d5"/><stop offset="20%" stopColor="#ffd700"/>
        <stop offset="50%" stopColor="#b8860b"/><stop offset="80%" stopColor="#ffd700"/>
        <stop offset="100%" stopColor="#fff3a0"/>
      </linearGradient>
      <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f0f0f0"/><stop offset="30%" stopColor="#c7c7c7"/>
        <stop offset="70%" stopColor="#9e9e9e"/><stop offset="100%" stopColor="#d8d8d8"/>
      </linearGradient>
      <linearGradient id="gold3d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff6c1"/><stop offset="25%" stopColor="#ffd700"/>
        <stop offset="55%" stopColor="#d4a017"/><stop offset="85%" stopColor="#ffdf5d"/>
        <stop offset="100%" stopColor="#8c6b00"/>
      </linearGradient>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.45"/>
      </filter>
      <filter id="emboss">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
        <feOffset dy="2" result="off"/><feComposite in="SourceGraphic" in2="off" operator="over"/>
      </filter>
    </defs>
    {/* Top Pole */}
    <rect x="8" y="18" width="184" height="20" rx="10" fill="url(#pole)" filter="url(#softShadow)"/>
    <path d="M8 28 L0 28 L12 14 L20 28 Z" fill="url(#pole)"/>
    <path d="M192 28 L200 28 L188 14 L180 28 Z" fill="url(#pole)"/>
    {/* Side straps */}
    <rect x="24" y="38" width="12" height="170" rx="6" fill="#b5b5b5" opacity="0.8"/>
    <rect x="164" y="38" width="12" height="170" rx="6" fill="#b5b5b5" opacity="0.8"/>
    {/* Main Banner */}
    <path d="M32 38 H168 V175 Q168 205 100 242 Q32 205 32 175 Z" fill="url(#silver)" stroke="url(#pole)" strokeWidth="4" filter="url(#softShadow)"/>
    <path d="M42 48 H158 V170 Q158 195 100 228 Q42 195 42 170 Z" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="3"/>
    {/* Bottom gold tips */}
    <ellipse cx="30" cy="210" rx="7" ry="10" fill="url(#pole)"/>
    <ellipse cx="170" cy="210" rx="7" ry="10" fill="url(#pole)"/>
    {children}
  </svg>
);

const WolfBanner = ({ className }: { className?: string }) => (
  <BannerBase className={className}>
    <g filter="url(#emboss)" transform="translate(100,135)">
      {/* 3D Gold Wolf - same as your image */}
      <path d="M0-48c-5-7-13-11-20-9-2 4-6 7-10 6 1 4 7 8 9-4 1-7 4-7 8 2-1 5 0 7 2-2 5-1 7 2-1 4-1 6 0 0 2 1 4 3 5 0-2 1-4 3-5 2 1 4 3 5 5 1-2 2-4 2-6 2 0 4 1 5 2 1-3 0-5-1-7 2-2 5-3 7-2 0-4-3-7-7-8 4-2 7-5 8-9-4 1-8-2-10-6-7-2-15 2-20 9z M-22-28c-8 2-14 8-16 15 3 0 6 2 8 4-3 3-5 7-4 11 2-2 5-3 8-2 0 4 2 8 5 10-1-4 0-8 2-11 3 2 6 5 7 9 2-3 3-6 3-9 3 0 5 1 7 3 1-4-1-8-4-11 2-2 5-4 8-4-2-7-8-13-16-15-4 6-10 10-17 10-7 0-13-4-17-10z" fill="url(#gold3d)" stroke="#7a5c00" strokeWidth="1.5" transform="scale(1.8)"/>
      <path d="M-36 -18c12-5 24-5 36 0 10 4 18 12 20 22-4-2-9-2-13 0 2 4 2 9 0 13-3-7-4-11-3-1 5-3 10-7 13-2-5-5-9-12-4 3-7 7-9 12-4-3-6-8-7-13-4-1-8 0-11 3-2-4-2-9 0-13-4-2-9-2-13 0 2-10 10-18 20-22z" fill="none" stroke="#fff8c0" strokeOpacity="0.35" strokeWidth="1.2" transform="scale(1.8)"/>
    </g>
  </BannerBase>
);

const LionBanner = ({ className }: { className?: string }) => (
  <BannerBase className={className}>
    <g filter="url(#emboss)" transform="translate(100,135) scale(1.7)">
      <path d="M0-30c-8 0-15 4-18 11-5-1-9 1-11 5 2 1 4 3 5-3 2-5 5-5 9 2 0 4-1 6-1-1 3 0 6 2 8-1 2-1 5 0 7 2-1 4-2 6-2 1 3 3 5 6 6 0-2 1-4 2-5 2 4 4 5 6 1-2 3-4 5-6 1 1 2 3 2 5 3-1 5-3 6-6 2 0 4 1 6 2 1-5 0-7 2-2 3-5 2-8 2 0 4 1 6 1 0-4-2-7-5-9 1-2 3-4 5-5-2-4-6-11-5-3-7-10-11-18-11z" fill="url(#gold3d)" stroke="#7a5c00" strokeWidth="1.2"/>
    </g>
  </BannerBase>
);

const FishBanner = ({ className }: { className?: string }) => (
  <BannerBase className={className}>
    <g filter="url(#emboss)" transform="translate(100,135) scale(1.8)">
      <path d="M-20-5c8-10 20-14 32-8 5 3 8 9 14-2-1-5-1-7 0 1 2 1 5 0 7 2 1 5 1 7 0-1 6-4 11-9 14-12 6-24 2-32-8-4 2-8 2-11 0 1-3 3-5 6-6-3-2-5-4-6-7 3-2 7-2 11 0z" fill="url(#gold3d)" stroke="#7a5c00" strokeWidth="1.2"/>
    </g>
  </BannerBase>
);

const FACTIONS = [
 { id: 'WOLF', label: 'Wolf', Banner: WolfBanner },
 { id: 'LION', label: 'Lion', Banner: LionBanner },
 { id: 'FISH', label: 'Fish', Banner: FishBanner },
];

const CARDS = ['A', 'JOKER', 'B', 'K', 'Q', '10', '9'];

interface TeenPattiGameContentProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function TeenPattiGameContent({ isOverlay = false, onClose }: TeenPattiGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'reveal' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(10000);
  const [myBets, setMyBets] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [totalPots, setTotalPots] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [history, setHistory] = useState<string[]>(['WOLF', 'LION', 'FISH', 'WOLF']);
  const [isMuted, setIsMuted] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(true);
  const [cardReveal, setCardReveal] = useState<Record<string, string[]>>({});
  const [winners, setWinners] = useState<GameWinner[]>([]);
  const [totalWinAmount, setTotalWinAmount] = useState(0);

  const winnersQuery = useMemoFirebase(() => {
     if (!firestore) return null;
     return query(
       collection(firestore, 'globalGameWins'),
       where('gameId', '==', 'teen-patti'),
       orderBy('timestamp', 'desc'),
       limit(5)
     );
   }, [firestore]);

   const { data: liveWins } = useCollection(winnersQuery);

  useEffect(() => { setTimeout(() => setIsLaunching(false), 1500); }, []);

  useEffect(() => {
   if (isLaunching) return;
   const interval = setInterval(() => {
    if (gameState === 'betting') {
     if (timeLeft > 0) setTimeLeft(prev => prev - 1);
     else startReveal();
    }
   }, 1000);
   return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startReveal = async () => {
   setGameState('reveal');
   const newCards: Record<string, string[]> = {};
   FACTIONS.forEach(f => { newCards[f.id] = [CARDS[Math.floor(Math.random() * CARDS.length)], CARDS[Math.floor(Math.random() * CARDS.length)], CARDS[Math.floor(Math.random() * CARDS.length)]]; });
   setCardReveal(newCards);

   let winId = FACTIONS[Math.floor(Math.random() * FACTIONS.length)].id;
   if (firestore) {
    try {
     const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'teen-patti'));
     if (oracleSnap.exists() && oracleSnap.data().isActive) {
      winId = oracleSnap.data().forcedResult;
      updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'teen-patti'), { isActive: false });
     }
    } catch (e) {}
   }

   setTimeout(() => { finalizeRound(winId); }, 3000);
  };

  const finalizeRound = (winId: string) => {
   setWinnerId(winId); setHistory(prev => [winId,...prev.slice(0, 7)]); setGameState('result');
   const winAmount = (myBets[winId] || 0) * 1.95;
   setTotalWinAmount(winAmount);

   setWinners(liveWins?.map(w => ({
     name: w.username,
     win: w.amount,
     avatar: w.avatarUrl,
     isMe: w.userId === currentUser?.uid
   })) || []);

   if (winAmount > 0 && currentUser && firestore && userProfile) {
    const updateData = {
      'wallet.coins': increment(Math.floor(winAmount)),
      'stats.dailyGameWins': increment(Math.floor(winAmount)),
      updatedAt: serverTimestamp()
    };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
     gameId: 'teen-patti',
     userId: currentUser.uid,
     username: userProfile?.username || 'Guest',
     avatarUrl: userProfile?.avatarUrl || null,
     amount: Math.floor(winAmount),
     timestamp: serverTimestamp()
    });

    const questRef = doc(firestore, 'users', currentUser.uid, 'quests', 'win_game');
    updateDocumentNonBlocking(questRef, { current: increment(1), updatedAt: serverTimestamp() });
   }

   setTimeout(() => { setMyBets({ WOLF: 0, LION: 0, FISH: 0 }); setTotalPots({ WOLF: 0, LION: 650000, FISH: 800000 }); setWinnerId(null); setGameState('betting'); setTimeLeft(20); setCardReveal({}); }, 5000);
  };

  const handlePlaceBet = (id: string) => {
   if (gameState!== 'betting' ||!currentUser ||!userProfile) return;
   if ((userProfile.wallet?.coins || 0) < selectedChip) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
   const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
   setMyBets(prev => ({...prev, [id]: (prev[id] || 0) + selectedChip }));
   setTotalPots(prev => ({...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  const winnerFaction = winnerId? FACTIONS.find(f => f.id === winnerId) : null;
  const WinnerBanner = winnerFaction?.Banner;

  return (
   <motion.div
     drag
     dragControls={dragControls}
     dragListener={false}
     dragMomentum={false}
     initial={isOverlay? { y: '35%' } : {}}
     className={cn(
       "h-fit max-h-[95vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#581c87] text-white select-none rounded-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
      !isOverlay && "min-h-screen"
     )}
   >
    <CompactRoomView />

    {gameState === 'result' && winnerId && WinnerBanner && (
     <GameResultOverlay
      gameId="teen-patti"
      winningSymbol={<WinnerBanner className="h-16 w-16" />}
      winAmount={totalWinAmount}
      winners={winners}
     />
    )}

    <header className="relative z-50 flex items-center justify-between p-4 pt-8 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onPointerDown={(e) => dragControls.start(e)}
          className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 cursor-grab active:cursor-grabbing text-white/80"
        >
          <Move className="h-4.5 w-4.5" />
        </button>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-full backdrop-blur-md transition-all active:scale-90">
          {isMuted? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
        </button>
      </div>

      <div className="flex flex-col items-center">
       <h1 className="text-xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-[#ffd700] to-[#b8860b] filter drop-shadow-lg italic">TEEN PATTI</h1>
       <div className="bg-black/20 border border-white/10 px-3 py-0.5 rounded-full"><span className="text-[8px] font-bold uppercase tracking-wider text-white">Left {timeLeft}s</span></div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={handleBack} className="bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-red-500 transition-all active:scale-90">
          <X className="h-4.5 w-4.5 font-bold" />
        </button>
      </div>
    </header>

    <main className="flex-1 flex flex-col pt-4 overflow-hidden relative z-10">
      <div className="grid grid-cols-3 gap-2 px-4 h-44">
       {FACTIONS.map((f) => (
        <div key={f.id} className="flex flex-col items-center gap-2">
          <div className={cn("w-full h-28 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden bg-black/30 backdrop-blur-sm shadow-inner", winnerId === f.id? "border-[#ffd700] bg-[#ffd700]/10 shadow-2xl" : "border-white/5")}>
           <div className="flex gap-0.5 mb-1 scale-110">
             {[0, 1, 2].map((i) => (
              <div key={i} className={cn("w-8 h-12 rounded border transition-all duration-1000 transform-gpu preserve-3d flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-black", gameState!== 'betting'? "rotate-y-180" : "")}>
               <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded"><span className="text-[10px] font-bold text-black leading-none">{cardReveal[f.id]?.[i] || '?'}</span></div>
               <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#3730a3] to-[#1e1b4b] rounded border border-[#ffd700]/30 flex items-center justify-center"><UmmyLogoIcon className="h-4 w-4 opacity-40 grayscale brightness-200" /></div>
              </div>
             ))}
           </div>
          </div>
          <div className="text-center"><p className="text-[9px] font-bold text-white/60 uppercase">Pot:{(totalPots[f.id] || 0).toLocaleString()}</p><p className="text-[9px] font-bold text-[#ffd700] uppercase ">Me:{(myBets[f.id] || 0).toLocaleString()}</p></div>
        </div>
       ))}
      </div>

      <div className="flex justify-around items-end px-4 flex-1 pb-28">
       {FACTIONS.map((f) => {
        const Icon = f.Banner;
        return (
         <button key={f.id} onClick={() => handlePlaceBet(f.id)} disabled={gameState!== 'betting'} className={cn("relative group active:scale-95 transition-all duration-300", gameState!== 'betting' && "opacity-60")}>
           <Icon className="w-24 h-28" />
         </button>
        )
       })}
      </div>
    </main>

    <footer className="p-4 py-6 bg-gradient-to-t from-black to-transparent mt-auto shrink-0 relative z-50">
      <div className="w-full flex items-center justify-between gap-3">
       <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 pl-2 pr-3 py-1 shadow-2xl text-white">
        <GoldCoinIcon className="h-6 w-6 text-[#ffd700]" /><span className="text-xs font-bold text-[#ffd700] ">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
       </div>
       <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
         {CHIPS.map(chip => (
          <button key={chip.value} onClick={() => setSelectedChip(chip.value)} className={cn("h-10 w-10 rounded-full flex flex-col items-center justify-center transition-all border-2 border-white/10 shrink-0 shadow-xl relative group overflow-hidden", chip.color, selectedChip === chip.value? "scale-110 border-white ring-4 ring-white/20 z-10" : "opacity-70 grayscale-[0.2]")}>
           <span className="text-[8px] font-bold text-white ">{chip.label}</span>
          </button>
         ))}
       </div>
      </div>
    </footer>
    <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }.rotate-y-180 { transform: rotateY(180deg); }.preserve-3d { transform-style: preserve-3d; }.backface-hidden { backface-visibility: hidden; }`}</style>
   </motion.div>
  );
    }
