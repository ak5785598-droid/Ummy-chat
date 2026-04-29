'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import {
  Volume2,
  VolumeX,
  X,
  Move,
  Plus,
  Clock,
  HelpCircle
} from 'lucide-react';
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

// --- 3D BANNERS (KEEPING EXISTING) ---
const WolfBanner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 260" className={cn("drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wolfPole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8f5"/><stop offset="50%" stopColor="#b8b8b0"/><stop offset="100%" stopColor="#e9e9e4"/>
      </linearGradient>
      <linearGradient id="wolfGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9d0"/><stop offset="20%" stopColor="#ffd700"/><stop offset="50%" stopColor="#c99700"/><stop offset="80%" stopColor="#ffdf5f"/><stop offset="100%" stopColor="#7a5a00"/>
      </linearGradient>
      <linearGradient id="wolfSilver" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#eeede6"/><stop offset="35%" stopColor="#c2c1b8"/><stop offset="70%" stopColor="#8a8982"/><stop offset="100%" stopColor="#b0afa6"/>
      </linearGradient>
      <radialGradient id="wolfShine" cx="0.3" cy="0.15" r="0.7">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.45"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
      <filter id="wolfEmboss">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="b"/>
        <feOffset dy="2" in="b" result="o"/>
        <feSpecularLighting in="b" surfaceScale="4" specularConstant="0.9" specularExponent="25" lightingColor="#fff" result="s"><feDistantLight azimuth="45" elevation="55"/></feSpecularLighting>
        <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
        <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k2="1" k3="0.8"/>
      </filter>
    </defs>
    <rect x="10" y="24" width="180" height="20" rx="10" fill="url(#wolfPole)"/>
    <rect x="36" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <rect x="70" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <rect x="110" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <rect x="144" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <path d="M10 34 L0 28 L10 16 L20 28 Z" fill="url(#wolfGold)"/>
    <path d="M190 34 L200 28 L190 16 L180 28 Z" fill="url(#wolfGold)"/>
    <rect x="22" y="44" width="14" height="168" rx="3" fill="#8c8c84" opacity="0.9"/>
    <rect x="164" y="44" width="14" height="168" rx="3" fill="#8c8c84" opacity="0.9"/>
    <ellipse cx="29" cy="216" rx="7" ry="10" fill="url(#wolfGold)"/>
    <ellipse cx="171" cy="216" rx="7" ry="10" fill="url(#wolfGold)"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#wolfSilver)" stroke="url(#wolfGold)" strokeWidth="3.5"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#wolfShine)"/>
    <path d="M36 52 H164 V168 Q164 196 100 230 Q36 196 36 168 Z" fill="none" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1.5"/>
    <g transform="translate(100,138) scale(2.3)" filter="url(#wolfEmboss)">
      <path d="M0-20c-5-6-11-8-17-6-1 3-4 6-8 5 1 3 6 8-3 1-4 3-5 6 1 0 2 0 4 1-1 3 0 5 2 0 3-1 4 1 2 1 3 2 4 0-1 0-2 2-3 1 0 2 2 3 3 1-1 1-2 1-3 1 0 2 1 3 1 0-2 0-3-1-4 1-1 3-2 4-1 0-3-2-5-5-5 2-1 4-3 5-5-2 0-5-1-6-3-4-1-9 1-12 6z" fill="url(#wolfGold)" stroke="#5a4100" strokeWidth="0.7"/>
      <path d="M-14-9c-5 2-9 6-10 11 2-1 4 0 5 2-2 2-3 4-2 6 1-1 2-1 4-1 0 2 1 4 3 5 0-2 1-4 2-5 2 1 3 3 4 5 1-1 2-3 2-5 1 0 3 1 4 2 0-2-1-4-2-6 1-1 3-2 5-2-1-5-5-9-10-11-2 3-5 5-8 5s-6-2-8-5z" fill="url(#wolfGold)"/>
    </g>
  </svg>
);

const LionBanner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 260" className={cn("drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lionPole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8f8f5"/><stop offset="50%" stopColor="#b8b8b0"/><stop offset="100%" stopColor="#e9e9e4"/>
      </linearGradient>
      <linearGradient id="lionGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9d0"/><stop offset="20%" stopColor="#ffd700"/><stop offset="50%" stopColor="#c99700"/><stop offset="80%" stopColor="#ffdf5f"/><stop offset="100%" stopColor="#7a5a00"/>
      </linearGradient>
      <linearGradient id="lionSplit" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#e6b422"/><stop offset="49.8%" stopColor="#b8860b"/><stop offset="50%" stopColor="#a10f0f"/><stop offset="100%" stopColor="#6a0000"/>
      </linearGradient>
      <linearGradient id="lionShine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.35"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <rect x="10" y="24" width="180" height="20" rx="10" fill="url(#lionPole)"/>
    <rect x="36" y="24" width="20" height="20" fill="#b71c1c"/>
    <rect x="70" y="24" width="20" height="20" fill="#b71c1c"/>
    <rect x="110" y="24" width="20" height="20" fill="#b71c1c"/>
    <rect x="144" y="24" width="20" height="20" fill="#b71c1c"/>
    <path d="M10 34 L0 28 L10 16 L20 28 Z" fill="url(#lionGold)"/>
    <path d="M190 34 L200 28 L190 16 L180 28 Z" fill="url(#lionGold)"/>
    <rect x="22" y="44" width="14" height="168" rx="3" fill="#5a0a0a" opacity="0.9"/>
    <rect x="164" y="44" width="14" height="168" rx="3" fill="#5a0a0a" opacity="0.9"/>
    <ellipse cx="29" cy="216" rx="7" ry="10" fill="url(#lionGold)"/>
    <ellipse cx="171" cy="216" rx="7" ry="10" fill="url(#lionGold)"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#lionSplit)" stroke="url(#lionGold)" strokeWidth="3.5"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#lionShine)" opacity="0.4"/>
    <path d="M36 52 H164 V168 Q164 196 100 230 Q36 196 36 168 Z" fill="none" stroke="#ffd700" strokeOpacity="0.25" strokeWidth="1.5"/>
    <g transform="translate(100,135) scale(1.9)" fill="url(#lionGold)" stroke="#5a4100" strokeWidth="0.6">
      <path d="M-14-2c6-7 14-10 22-6 3 2 5 5 9-1 0-2 0-3 0 1 1 3 0 4 1 0 2 0 3 0 0 4-2 7-5 9-7 4 5 1 9-2 12-6 4-13 5-20 2 1 2 1 4 0 5-1-1-2-2-3-1 0 1 1 2 2 3-2 1-4 1-5 0 1-1 1-3 0-4-2 1-3 2-4 4-1-2 0-3 1-5-3 0-6-1-8-3z"/>
      <path d="M2-18c2-4 5-6 9-5 0 2 2 3 4 2-1 2-3 3-4-1-1-2-2-2-3 1 0 1 0 2 0 0-1 0-2 1 0 1 0 2 0 0-1 1-1 0 0 1 1 1 0 1-1 1 0-1 1-1 1-2 0 0-1 0-1 1 0 1 0 2 0 2-1 1-2 1-2 1 0 1 1 2 2 2-1 1-2 2-2 3 1 0 2 1 3 2 2 0 4-1 6-3z"/>
      <path d="M-6-22l2 3 2-3 2 3 2-3c0 2-1 4-3 5h-2c-2-1-3-3-3-5z"/>
    </g>
  </svg>
);

const FishBanner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 260" className={cn("drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fishPole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8f8f5"/><stop offset="50%" stopColor="#b8b8b0"/><stop offset="100%" stopColor="#e9e9e4"/>
      </linearGradient>
      <linearGradient id="fishGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9d0"/><stop offset="20%" stopColor="#ffd700"/><stop offset="50%" stopColor="#c99700"/><stop offset="80%" stopColor="#ffdf5f"/><stop offset="100%" stopColor="#7a5a00"/>
      </linearGradient>
      <linearGradient id="fishGreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0e9a4a"/><stop offset="40%" stopColor="#067a38"/><stop offset="100%" stopColor="#004d24"/>
      </linearGradient>
      <radialGradient id="fishShine" cx="0.25" cy="0.2" r="0.8">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.3"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <rect x="10" y="24" width="180" height="20" rx="10" fill="url(#fishPole)"/>
    <rect x="36" y="24" width="20" height="20" fill="#0a7a3a"/>
    <rect x="70" y="24" width="20" height="20" fill="#0a7a3a"/>
    <rect x="110" y="24" width="20" height="20" fill="#0a7a3a"/>
    <rect x="144" y="24" width="20" height="20" fill="#0a7a3a"/>
    <path d="M10 34 L0 28 L10 16 L20 28 Z" fill="url(#fishGold)"/>
    <path d="M190 34 L200 28 L190 16 L180 28 Z" fill="url(#fishGold)"/>
    <rect x="22" y="44" width="14" height="168" rx="3" fill="#00391b" opacity="0.9"/>
    <rect x="164" y="44" width="14" height="168" rx="3" fill="#00391b" opacity="0.9"/>
    <ellipse cx="29" cy="216" rx="7" ry="10" fill="url(#fishGold)"/>
    <ellipse cx="171" cy="216" rx="7" ry="10" fill="url(#fishGold)"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#fishGreen)" stroke="url(#fishGold)" strokeWidth="3.5"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#fishShine)"/>
    <path d="M36 52 H164 V168 Q164 196 100 230 Q36 196 36 168 Z" fill="none" stroke="#ffd700" strokeOpacity="0.25" strokeWidth="1.5"/>
    <g transform="translate(100,138) scale(2.4)" fill="url(#fishGold)" stroke="#5a4100" strokeWidth="0.6">
      <path d="M-14-2c6-7 14-10 22-6 3 2 5 5 9-1 0-2 0-3 0 1 1 3 0 4 1 0 2 0 3 0 0 4-2 7-5 9-7 4 5 1 9-2 12-6 4-13 5-20 2 1 2 1 4 0 5-1-1-2-2-3-1 0 1 1 2 2 3-2 1-4 1-5 0 1-1 1-3 0-4-2 1-3 2-4 4-1-2 0-3 1-5-3 0-6-1-8-3z"/>
      <circle cx="-9" cy="-1" r="1.2" fill="#5a4100"/>
    </g>
  </svg>
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
   setWinners(liveWins?.map(w => ({ name: w.username, win: w.amount, avatar: w.avatarUrl, isMe: w.userId === currentUser?.uid })) || []);

   if (winAmount > 0 && currentUser && firestore && userProfile) {
    const updateData = { 'wallet.coins': increment(Math.floor(winAmount)), 'stats.dailyGameWins': increment(Math.floor(winAmount)), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), { gameId: 'teen-patti', userId: currentUser.uid, username: userProfile?.username || 'Guest', avatarUrl: userProfile?.avatarUrl || null, amount: Math.floor(winAmount), timestamp: serverTimestamp() });
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

  const winnerFaction = winnerId? FACTIONS.find(f => f.id === winnerId) : null;
  const WinnerBanner = winnerFaction?.Banner;

  return (
   <motion.div
     drag
     dragControls={dragControls}
     dragListener={false}
     dragMomentum={false}
     initial={isOverlay? { y: '10%' } : {}}
     className={cn(
       "h-fit max-h-[88vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#a22bb8] text-white select-none rounded-[2.8rem] border border-white/20 shadow-2xl transition-all duration-300",
     !isOverlay && "min-h-[85vh]"
     )}
   >
    {/* GAME RESULT OVERLAY */}
    {gameState === 'result' && winnerId && WinnerBanner && (
     <GameResultOverlay gameId="teen-patti" winningSymbol={<WinnerBanner className="h-16 w-16" />} winAmount={totalWinAmount} winners={winners} />
    )}

    {/* NEW GLOSSY 3D HEADER (As per Image 1) */}
    <header className="relative z-50 flex items-center justify-between p-3 pt-6 px-4">
      <div className="flex items-center gap-1.5">
        <button onPointerDown={(e) => dragControls.start(e)} className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-white/80 active:scale-90">
          <Move className="h-5 w-5" />
        </button>
        
        {/* COIN PILL DISPLAY */}
        <div className="h-10 pl-1 pr-1 py-1 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-2 shadow-inner group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg">
            <GoldCoinIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-[13px] font-bold text-white tracking-tight px-1">
            {(userProfile?.wallet?.coins || 0).toLocaleString()}
          </span>
          <button className="w-7 h-7 rounded-full bg-[#34d399] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <Plus className="h-4 w-4 stroke-[3px]" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90 relative">
          <Clock className="h-5 w-5 text-white/90" />
          <div className="absolute -bottom-1 bg-black/60 px-1 rounded text-[7px] font-bold border border-white/10">{timeLeft}s</div>
        </button>
        <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90">
          {isMuted? <VolumeX className="h-5 w-5 text-white/90" /> : <Volume2 className="h-5 w-5 text-white/90" />}
        </button>
        <button className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90">
          <HelpCircle className="h-5 w-5 text-white/90" />
        </button>
        <button onClick={() => (onClose? onClose() : router.back())} className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90 text-white/90">
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>

    <main className="flex-1 flex flex-col pt-2 overflow-hidden relative z-10">
      <div className="grid grid-cols-3 gap-2 px-4 h-40">
       {FACTIONS.map((f) => (
        <div key={f.id} className="flex flex-col items-center gap-1.5">
          <div className={cn("w-full h-24 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden bg-black/20 backdrop-blur-sm shadow-inner", winnerId === f.id? "border-[#ffd700] bg-[#ffd700]/10 shadow-2xl" : "border-white/5")}>
           <div className="flex gap-0.5 scale-100">
             {[0, 1, 2].map((i) => (
              <div key={i} className={cn("w-7 h-10 rounded border transition-all duration-1000 transform-gpu preserve-3d flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-black", gameState!== 'betting'? "rotate-y-180" : "")}>
               <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded"><span className="text-[9px] font-bold text-black">{cardReveal[f.id]?.[i] || '?'}</span></div>
               <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#3730a3] to-[#1e1b4b] rounded border border-[#ffd700]/30 flex items-center justify-center"><UmmyLogoIcon className="h-3.5 w-3.5 opacity-40 grayscale brightness-200" /></div>
              </div>
             ))}
           </div>
          </div>
          <div className="text-center"><p className="text-[8px] font-bold text-white/50 uppercase leading-none">Pot:{(totalPots[f.id] || 0).toLocaleString()}</p><p className="text-[8px] font-bold text-[#ffd700] uppercase leading-tight mt-0.5">Me:{(myBets[f.id] || 0).toLocaleString()}</p></div>
        </div>
       ))}
      </div>

      <div className="flex justify-around items-end px-4 flex-1 pb-16">
       {FACTIONS.map((f) => {
        const Icon = f.Banner;
        return (
         <button key={f.id} onClick={() => handlePlaceBet(f.id)} disabled={gameState!== 'betting'} className={cn("relative group active:scale-95 transition-all duration-300", gameState!== 'betting' && "opacity-60")}>
           <Icon className="w-20 h-24" />
         </button>
        )
       })}
      </div>
    </main>

    {/* DECREASED FOOTER SPACING */}
    <footer className="p-3 py-4 bg-gradient-to-t from-black/40 to-transparent mt-auto shrink-0 relative z-50">
      <div className="w-full flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
         {CHIPS.map(chip => (
          <button key={chip.value} onClick={() => setSelectedChip(chip.value)} className={cn("h-9 w-9 rounded-full flex flex-col items-center justify-center transition-all border-2 border-white/10 shrink-0 shadow-xl relative group overflow-hidden", chip.color, selectedChip === chip.value? "scale-110 border-white ring-4 ring-white/20 z-10" : "opacity-70 grayscale-[0.2]")}>
           <span className="text-[7px] font-bold text-white uppercase">{chip.label}</span>
          </button>
         ))}
      </div>
    </footer>
    
    <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }.rotate-y-180 { transform: rotateY(180deg); }.preserve-3d { transform-style: preserve-3d; }.backface-hidden { backface-visibility: hidden; }`}</style>
   </motion.div>
  );
}
