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

// --- 3D BANNERS - NAYA GOLD 3D VERSION ---
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
        <stop offset="0%" stopColor="#e8e6da"/><stop offset="35%" stopColor="#b8b6aa"/><stop offset="70%" stopColor="#8a8982"/><stop offset="100%" stopColor="#a5a49b"/>
      </linearGradient>
      <radialGradient id="wolfShine" cx="0.3" cy="0.15" r="0.7">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.45"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
      <filter id="gold3d">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
        <feOffset dy="4" dx="2" in="blur" result="offsetBlur"/>
        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lightingColor="#fff4c2" result="spec">
          <fePointLight x="-5000" y="-10000" z="20000"/>
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec2"/>
        <feComposite in="SourceGraphic" in2="spec2" operator="arithmetic" k2="1" k3="1"/>
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
    <g transform="translate(100,140) scale(1.85)" filter="url(#gold3d)">
      <path d="M 32 0 C 30 -2 28 -3 25 -4 C 23 -7 20 -9 16 -10 C 12 -13 8 -15 3 -16 C -2 -18 -7 -17 -12 -15 C -18 -13 -23 -8 -26 -2 C -28 2 -27 6 -24 9 C -27 11 -29 14 -28 18 C -25 16 -22 15 -19 16 C -17 19 -14 21 -10 20 C -8 23 -5 25 -1 24 C 2 27 6 28 10 26 C 14 29 18 27 20 23 C 23 21 25 17 24 13 C 27 11 29 8 28 4 C 26 1 24 -1 21 -3 C 24 -6 25 -10 22 -13 C 19 -16 15 -15 12 -12 C 8 -15 3 -16 -1 -14 C -5 -16 -9 -15 -12 -12 C -15 -10 -17 -7 -18 -4 C -20 -2 -21 0 -20 2 C -18 0 -15 -1 -13 1 C -10 -1 -7 0 -5 2 C -2 0 1 1 3 -1 C 6 1 9 0 11 -2 C 14 0 17 0 19 -2 C 21 0 23 1 24 3 C 26 1 28 0 29 -2 C 31 -1 32 -0.5 32 0 Z M 14 -6 C 15 -5 16 -4 15 -3 C 14 -2 13 -3 14 -6 Z M 18 -1 L 22 1 L 20 3 L 17 1 Z" fill="url(#wolfGold)" stroke="#5a4100" strokeWidth="0.8"/>
      <path d="M -12 -10 C -18 -8 -24 -4 -27 2 C -29 5 -28 8 -26 10 C -24 8 -21 7 -19 8 C -17 11 -14 12 -11 11 C -9 13 -6 14 -3 13 C 0 15 3 14 5 12 C 8 14 11 13 12 10 C 10 8 8 6 6 7 C 4 5 2 4 0 5 C -2 3 -4 2 -6 3 C -8 1 -10 -1 -12 -3 C -14 -5 -13 -8 -12 -10 Z" fill="#b8860b" opacity="0.4"/>
      <path d="M -20 4 C -24 6 -27 10 -26 14 C -23 12 -20 11 -18 13 C -16 15 -14 16 -12 15 C -14 13 -15 11 -14 9 C -16 8 -18 7 -20 6 C -19 4 -19.5 4 -20 4 Z M 8 18 C 11 20 14 20 16 18 C 14 16 11 16 8 18 Z" fill="#8b5a00" opacity="0.5"/>
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
    <g transform="translate(100,138) scale(1.7)" filter="url(#gold3d)">
      <path d="M -18 -22 C -14 -26 -8 -28 -2 -26 C 2 -28 6 -26 8 -22 C 10 -24 12 -25 14 -23 C 13 -20 12 -18 13 -16 C 15 -14 17 -13 19 -14 C 18 -10 16 -7 13 -5 C 16 -3 18 -1 19 2 C 17 4 15 5 12 4 C 14 7 15 10 14 13 C 12 11 10 10 8 11 C 9 14 8 17 6 19 C 4 17 3 15 4 13 C 2 14 0 15 -2 14 C -1 17 -2 20 -4 22 C -6 20 -6 18 -5 16 C -8 17 -11 16 -13 14 C -12 16 -11 18 -12 20 C -14 18 -15 16 -14 14 C -17 13 -19 11 -18 8 C -15 9 -13 8 -12 6 C -15 4 -17 2 -16 -1 C -14 0 -12 -1 -11 -3 C -14 -5 -16 -8 -15 -11 C -13 -9 -11 -8 -10 -10 C -12 -13 -13 -16 -12 -19 C -14 -20 -16 -21 -18 -22 Z" fill="url(#lionGold)" stroke="#5a3000" strokeWidth="0.7"/>
      <path d="M -8 -18 C -4 -20 0 -19 3 -16 C 5 -14 6 -11 5 -8 C 3 -10 1 -11 -1 -10 C -3 -8 -4 -6 -3 -4 C -5 -5 -7 -6 -9 -5 C -10 -8 -9 -11 -8 -13 C -10 -14 -11 -16 -10 -17 C -9 -17 -8.5 -17.5 -8 -18 Z" fill="#d4af37"/>
      <path d="M 6 -12 C 8 -10 10 -8 9 -5 C 7 -6 5 -7 4 -6 C 3 -8 4 -10 6 -12 Z M -14 0 C -12 2 -10 3 -8 2 C -9 0 -11 -1 -14 0 Z M 10 6 C 12 8 13 10 12 12 C 10 11 9 9 10 6 Z" fill="#8b5a00" opacity="0.6"/>
      <path d="M -16 -6 C -18 -4 -19 -1 -18 1 C -16 0 -15 -2 -14 -4 C -15 -5 -15.5 -5.5 -16 -6 Z M 14 -16 C 16 -15 17 -13 16 -11 C 15 -12 14 -14 14 -16 Z" fill="#5a3000"/>
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
    <g transform="translate(100,140) scale(2.1)" filter="url(#gold3d)">
      <path d="M -28 -2 C -22 -6 -15 -8 -8 -7 C -2 -8 4 -6 10 -3 C 16 -1 22 1 26 4 C 24 7 22 10 19 12 C 21 14 22 16 21 18 C 18 16 15 12 16 C 9 18 6 19 3 18 C 0 20 -3 20 -6 18 C -9 19 -12 18 -14 16 C -18 17 -22 16 -25 13 C -27 10 -28 7 -27 4 C -29 2 -29 0 -28 -2 Z" fill="url(#fishGold)" stroke="#5a4100" strokeWidth="0.6"/>
      <path d="M -24 -1 C -23 0 -22 1 -21 0 C -22 -1 -23 -2 -24 -1 Z M -26 1 L -24 2 L -25 3 Z" fill="#5a4100"/>
      <path d="M -8 -7 C -6 -9 -3 -10 0 -9 C 2 -7 3 -5 2 -3 C 0 -5 -2 -6 -4 -5 C -6 -6 -7 -7 -8 -7 Z M 10 -3 C 13 -2 16 -1 18 1 C 16 2 14 2 12 1 C 11 0 10.5 -1 10 -3 Z M 19 5 C 21 7 22 9 21 11 C 19 10 18 8 19 5 Z M 12 12 C 14 14 15 16 14 18 C 12 17 11 15 12 12 Z M 3 14 C 5 15 6 17 5 19 C 3 18 2 16 3 14 Z M -6 14 C -4 15 -2 15 -1 14 C -2 13 -4 13 -6 14 Z" fill="#d4af37" opacity="0.8"/>
      <path d="M -18 -3 C -12 -5 -6 -5 0 -3 C 6 -1 12 1 17 3 C 12 2 6 1 0 0 C -6 -1 -12 -2 -18 -3 Z" fill="none" stroke="#8b5a00" strokeWidth="0.3" opacity="0.5"/>
      <circle cx="-22" cy="-0.5" r="1.2" fill="#2a1a00" stroke="#ffd700" strokeWidth="0.3"/>
    </g>
  </svg>
);

const FACTIONS = [
 { id: 'WOLF', label: 'Wolf', Banner: WolfBanner },
 { id: 'LION', label: 'Lion', Banner: LionBanner },
 { id: 'FISH', label: 'Fish', Banner: FishBanner },
];

const CARDS = ['A', 'B', 'C'];

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
  const [history, setHistory] = useState<string[]>(['WOLF', 'LION', 'FISH', 'WOLF', 'LION', 'FISH', 'WOLF']);
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
   setTimeout(() => { setMyBets({ WOLF: 0, LION: 0, FISH: 0 }); setTotalPots({ WOLF: 0, LION: 0, FISH: 0 }); setWinnerId(null); setGameState('betting'); setTimeLeft(20); setCardReveal({}); }, 5000);
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
    {/* NAYA WINNER PAGE - BLACK GLOSSY 20VH */}
    {gameState === 'result' && winnerId && WinnerBanner && (
     <div className="absolute inset-0 z-[80] flex flex-col pointer-events-none">
       {/* Top Black Glossy Sheet */}
       <div className="h-[20vh] w-full pointer-events-auto" style={{background: 'linear-gradient(180deg, #0d0d0d 0%, #000000 100%)', boxShadow: '0 8px 30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)', borderBottom: '2px solid rgba(255,215,0,0.3)'}}>
         <div className="h-full flex items-center px-5 gap-4">
           <div className="shrink-0">
             <WinnerBanner className="h-[14vh] w-[14vh] -my-2" />
           </div>
           <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-baseline gap-2">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">BET</span>
               <span className="text-xl font-black text-white">{(myBets[winnerId] || 0).toLocaleString()}</span>
             </div>
             <div className="w-full h-[1px] bg-white/10 my-1.5"></div>
             <div className="flex items-baseline gap-2">
               <span className="text-[10px] font-bold text-[#ffd700]/70 uppercase tracking-widest">PRIZE</span>
               <span className="text-2xl font-black text-[#ffd700] leading-none" style={{textShadow: '0 0 20px rgba(255,215,0,0.5)'}}>{Math.floor(totalWinAmount).toLocaleString()}</span>
             </div>
           </div>
         </div>
       </div>

       {/* Top 3 Users - Neeche */}
       <div className="px-4 pt-2 pointer-events-auto">
         <div className="bg-black/80 backdrop-blur-0 rounded-2xl p-2.5 border border-white/15 shadow-2xl">
           {winners.slice(0,3).map((w, i) => (
             <div key={i} className="flex items-center justify-between py-1">
               <div className="flex items-center gap-2">
                 <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold", i===0? "bg-[#ffd700] text-black" : i===1? "bg-[#c0c0c0] text-black" : "bg-[#cd7f32] text-white")}>{i+1}</div>
                 <span className="text-[11px] font-semibold text-white/90 truncate max-w-[110px]">{w.name}</span>
                 {w.isMe && <span className="text-[8px] px-1 py-0.5 bg-[#a22bb8] rounded text-white font-bold">YOU</span>}
               </div>
               <div className="flex items-center gap-1">
                 <GoldCoinIcon className="h-3 w-3" />
                 <span className="text-[11px] font-bold text-[#ffd700]">{Math.floor(w.win).toLocaleString()}</span>
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>
    )}

    {/* HEADER */}
    <header className="relative z-50 flex items-center justify-between p-3 pt-6 px-4">
      <div className="flex items-center gap-1.5">
        <button onPointerDown={(e) => dragControls.start(e)} className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-white/80 active:scale-90">
          <Move className="h-5 w-5" />
        </button>
        <div className="h-7 pl-1 pr-1 py-0.5 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-1 shadow-inner group">
          <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 flex items-center justify-center shadow-md">
            <GoldCoinIcon className="h-3 w-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white tracking-tight px-1">
            {(userProfile?.wallet?.coins || 0).toLocaleString()}
          </span>
          <button className="w-5 h-5 rounded-full bg-[#34d399] flex items-center justify-center text-white shadow-md active:scale-90 transition-transform">
            <Plus className="h-3 w-3 stroke-[3px]" />
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

    {/* HISTORY BAR - HEADER KE NICHE TRANSPARENT */}
    <div className="relative z-40 px-4 -mt-2 mb-1">
      <div className="flex items-center gap-1.5 h-8 px-2.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-bold text-white/40 uppercase mr-1 shrink-0">History</span>
        {history.map((h, idx) => {
          const faction = FACTIONS.find(f => f.id === h);
          const Banner = faction?.Banner;
          return Banner? (
            <div key={idx} className="w-6 h-6 rounded-full bg-black/30 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden">
              <Banner className="w-5 h-5 scale-110" />
            </div>
          ) : null;
        })}
      </div>
    </div>

    <main className="flex-1 flex flex-col pt-2 overflow-hidden relative z-10">
      <div className="grid grid-cols-3 gap-2 px-4 h-40">
       {FACTIONS.map((f, fIndex) => (
        <div key={f.id} className="flex flex-col items-center gap-1.5">
          <div className={cn("w-full h-24 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden bg-black/20 backdrop-blur-sm shadow-inner", winnerId === f.id? "border-[#ffd700] bg-[#ffd700]/10 shadow-2xl" : "border-white/5")}>
           <div className="flex gap-0.5 scale-100">
             {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-7 h-10 rounded border transition-transform duration-[600ms] transform-gpu preserve-3d flex items-center justify-center bg-white",
                  gameState!== 'betting'? "rotate-y-180" : ""
                )}
                style={{
                  transitionDelay: gameState!== 'betting'? `${(fIndex * 3 + i) * 150}ms` : '0ms'
                }}
              >
               <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded">
                 <span className="text-[12px] font-extrabold text-black">{cardReveal[f.id]?.[i] || '?'}</span>
               </div>
               <div
                 className="absolute inset-0 backface-hidden rounded border border-white/50 flex items-center justify-center bg-[#dc2626]"
                 style={{
                   backgroundImage: 'radial-gradient(white 1.5px, transparent 1.5px)',
                   backgroundSize: '8px 8px'
                 }}
               ></div>
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
