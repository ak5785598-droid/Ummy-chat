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
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const CHIPS = [
 { value: 10000, label: '10k', color: 'bg-[#00E5FF] border-[#00E5FF]/50 shadow-[#00E5FF]/40' },
 { value: 100000, label: '100k', color: 'bg-[#2196F3] border-[#2196F3]/50 shadow-[#2196F3]/40' },
 { value: 300000, label: '300k', color: 'bg-[#9C27B0] border-[#9C27B0]/50 shadow-[#9C27B0]/40' },
 { value: 1000000, label: '1000k', color: 'bg-[#F44336] border-[#F44336]/50 shadow-[#F44336]/40' },
 { value: 2000000, label: '2000k', color: 'bg-[#795548] border-[#795548]/50 shadow-[#795548]/40' },
 { value: 5000000, label: '5000k', color: 'bg-[#FFD700] border-[#FFD700]/50 shadow-[#FFD700]/40' },
];

// --- 3D BANNERS ---

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
      <linearGradient id="dg-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4b4b4f"/><stop offset="25%" stopColor="#2a2a2e"/><stop offset="100%" stopColor="#0c0c0e"/>
      </linearGradient>
      <linearGradient id="dg-wing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a5a60"/><stop offset="100%" stopColor="#1f1f22"/>
      </linearGradient>
      <radialGradient id="dg-eye" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0%" stopColor="#e8ffbd"/><stop offset="30%" stopColor="#b6ff5a"/><stop offset="70%" stopColor="#7ed321"/><stop offset="100%" stopColor="#3d7a00"/>
      </radialGradient>
      <filter id="dg-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.6"/>
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
    <g transform="translate(35, 60) scale(0.65)">
      <g filter="url(#dg-shadow)">
        <path d="M45 138 C12 125, 2 155, 28 172 L50 155 Z" fill="url(#dg-wing)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M155 138 C188 125, 198 155, 172 172 L150 155 Z" fill="url(#dg-wing)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      </g>
      <ellipse cx="100" cy="178" rx="54" ry="52" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="70" cy="210" rx="22" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="130" cy="210" rx="22" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="68" cy="185" rx="17" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="132" cy="185" rx="17" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="100" cy="88" rx="74" ry="64" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <path d="M42 48 C28 12, 58 2, 78 38 C70 52, 52 58, 42 48 Z" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <path d="M158 48 C172 12, 142 2, 122 38 C130 52, 148 58, 158 48 Z" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="65" cy="100" rx="29" ry="32" fill="url(#dg-eye)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="135" cy="100" rx="29" ry="32" fill="url(#dg-eye)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="72" cy="110" rx="16" ry="20" fill="#000"/>
      <ellipse cx="128" cy="110" rx="16" ry="20" fill="#000"/>
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
      <linearGradient id="gd-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4de7b7"/><stop offset="40%" stopColor="#1db88f"/><stop offset="100%" stopColor="#0a6b50"/>
      </linearGradient>
      <linearGradient id="gd-belly" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffeb7a"/><stop offset="100%" stopColor="#ff9f1c"/>
      </linearGradient>
      <linearGradient id="gd-wing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffcb6b"/><stop offset="100%" stopColor="#ff8a00"/>
      </linearGradient>
      <linearGradient id="gd-horn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff6e0"/><stop offset="100%" stopColor="#c2b59a"/>
      </linearGradient>
      <radialGradient id="gd-eye" cx="0.5" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="#c7e2ff"/><stop offset="45%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1e3a8a"/>
      </radialGradient>
      <linearGradient id="gd-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.85"/><stop offset="30%" stopColor="#fff" stopOpacity="0.3"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
      <filter id="gd-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.5"/>
      </filter>
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
    <g transform="translate(35, 60) scale(0.65)">
      <g filter="url(#gd-shadow)">
        <path d="M32 158 C18 168, 14 185, 28 198 C40 208, 52 200, 58 188" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3" strokeLinecap="round"/>
        <path d="M30 172 C22 180, 26 190, 40 194" fill="#ff8a00" stroke="#0b3d2e" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M58 138 C22 128, 4 152, 20 176 L62 156 Z" fill="url(#gd-wing)" stroke="#0b3d2e" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M142 138 C178 128, 196 152, 180 176 L138 156 Z" fill="url(#gd-wing)" stroke="#0b3d2e" strokeWidth="3" strokeLinejoin="round"/>
      </g>
      <ellipse cx="68" cy="202" rx="23" ry="20" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3"/>
      <ellipse cx="132" cy="202" rx="23" ry="20" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3"/>
      <ellipse cx="100" cy="168" rx="44" ry="52" fill="url(#gd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <path d="M72 138 C70 168, 72 198, 100 212 C128 198, 130 168, 128 138 C115 132, 85 132, 72 138 Z" fill="url(#gd-belly)" stroke="#0b3d2e" strokeWidth="2.5"/>
      <ellipse cx="100" cy="86" rx="68" ry="58" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3.5"/>
      <ellipse cx="68" cy="86" rx="23" ry="27" fill="white" stroke="#0b3d2e" strokeWidth="2.5"/>
      <ellipse cx="132" cy="86" rx="23" ry="27" fill="white" stroke="#0b3d2e" strokeWidth="2.5"/>
      <ellipse cx="68" cy="92" rx="16" ry="19" fill="url(#gd-eye)"/>
      <ellipse cx="132" cy="92" rx="16" ry="19" fill="url(#gd-eye)"/>
      <ellipse cx="68" cy="96" rx="8" ry="11" fill="black"/>
      <ellipse cx="132" cy="96" rx="8" ry="11" fill="black"/>
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
      <linearGradient id="bpd-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a8fc8"/><stop offset="45%" stopColor="#2c4f7c"/><stop offset="100%" stopColor="#162e4d"/>
      </linearGradient>
      <linearGradient id="bpd-belly" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe4ec"/><stop offset="100%" stopColor="#ff9fba"/>
      </linearGradient>
      <filter id="bpd-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.45"/>
      </filter>
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
    <g transform="translate(35, 60) scale(0.65)">
      <ellipse cx="100" cy="176" rx="46" ry="48" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <ellipse cx="100" cy="172" rx="30" ry="38" fill="url(#bpd-belly)" stroke="#0d1f35" strokeWidth="2.5"/>
      <ellipse cx="100" cy="92" rx="66" ry="56" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <ellipse cx="72" cy="90" rx="22" ry="26" fill="white" stroke="#0d1f35" strokeWidth="2.5"/>
      <ellipse cx="128" cy="90" rx="22" ry="26" fill="white" stroke="#0d1f35" strokeWidth="2.5"/>
      <ellipse cx="72" cy="98" rx="12" ry="15" fill="#0d1f35"/>
      <ellipse cx="128" cy="98" rx="12" ry="15" fill="#0d1f35"/>
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
  const [history, setHistory] = useState<string[]>(['WOLF', 'LION', 'FISH', 'WOLF', 'LION']);
  const [isMuted, setIsMuted] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(true);
  const [cardReveal, setCardReveal] = useState<Record<string, string[]>>({});

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
   setWinnerId(winId); setHistory(prev => [winId,...prev.slice(0, 10)]); setGameState('result');
   const winAmount = (myBets[winId] || 0) * 1.95;

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
    {/* HEADER */}
    <header className="relative z-50 flex items-center justify-between p-3 pt-6 px-4">
      <div className="flex items-center gap-1.5">
        <button onPointerDown={(e) => dragControls.start(e)} className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-white/80 active:scale-90">
          <Move className="h-5 w-5" />
        </button>
        <div className="h-8 pl-1 pr-1 py-1 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-1.5 shadow-inner group">
          <div className="w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg">
            <GoldCoinIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-tight px-1">
            {(userProfile?.wallet?.coins || 0).toLocaleString()}
          </span>
          <button className="w-6 h-6 rounded-full bg-[#34d399] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <Plus className="h-3 w-3 stroke-[3px]" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90">
          <Clock className="h-5 w-5 text-white/90" />
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

    {/* 3D GLOSSY COUNTDOWN - IMAGE JAISA */}
    <div className="relative z-40 px-3 -mt-1 mb-1">
      <div className="relative mx-auto w-[92%] max-w-[340px]">
        <div className="absolute -inset-1 bg-[#d946ef]/40 blur-xl rounded-[22px]" />
        <div className="relative h-[48px] flex items-center justify-center rounded-[20px] overflow-hidden bg-gradient-to-b from-[#c026d3] via-[#a21caf] to-[#701a75] border-[3px] border-[#f5d0fe] shadow-[inset_0_3px_6px_rgba(255,255,255,0.35),inset_0_-4px_8px_rgba(0,0,0,0.5),0_8px_16px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-[5px] rounded-[16px] border border-[#f0abfc]/40" />
          <div className="absolute inset-[8px] rounded-[14px] border border-[#f0abfc]/20" />
          <div className="absolute top-0 inset-x-0 h-[60%] bg-gradient-to-b from-white/30 to-transparent" />
          <div className="absolute top-[5px] left-0 right-0 flex justify-between px-4">
            {Array.from({length: 8}).map((_,i)=><div key={i} className="w-[5px] h-[5px] rounded-full bg-white shadow-[0_0_6px_1px_rgba(255,255,255,0.9)]" />)}
          </div>
          <div className="absolute bottom-[5px] left-0 right-0 flex justify-between px-4">
            {Array.from({length: 8}).map((_,i)=><div key={i} className="w-[5px] h-[5px] rounded-full bg-white shadow-[0_0_6px_1px_rgba(255,255,255,0.9)]" />)}
          </div>
          <span className="relative text-white text-[24px] font-medium tracking-wide" style={{textShadow:'0 2px 4px rgba(0,0,0,0.8)'}}>
            Countdown {timeLeft}s
          </span>
        </div>
      </div>
    </div>

    <main className="flex-1 flex flex-col pt-2 overflow-hidden relative z-10">
      {/* CARD GRID - NOW SQUARE CORNERS */}
      <div className="grid grid-cols-3 gap-2 px-4 h-40">
       {FACTIONS.map((f) => (
        <div key={f.id} className="flex flex-col items-center gap-1.5">
          <div className={cn(
            "w-full h-24 border-2 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden bg-black/20 backdrop-blur-sm shadow-inner",
            "rounded-none",
            winnerId === f.id? "border-[#ffd700] bg-[#ffd700]/10 shadow-2xl" : "border-white/5"
          )}>
           <div className="flex gap-0.5 scale-100">
             {[0, 1, 2].map((i) => (
              <div key={i} className={cn("w-7 h-10 rounded border transition-all duration-1000 transform-gpu preserve-3d flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-black", gameState!== 'betting'? "rotate-y-180" : "")}>
               <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded"><span className="text-[9px] font-bold text-black">{cardReveal[f.id]?.[i] || '?'}</span></div>
               <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#3730a3] to-[#1e1b4b] rounded border border-[#ffd700]/30 flex items-center justify-center"><UmmyLogoIcon className="h-3.5 w-3.5 opacity-40 grayscale brightness-200" /></div>
              </div>
             ))}
           </div>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold text-white/50 uppercase leading-none">Pot:{(totalPots[f.id] || 0).toLocaleString()}</p>
            <p className="text-[8px] font-bold text-[#ffd700] uppercase leading-tight mt-0.5">Me:{(myBets[f.id] || 0).toLocaleString()}</p>
          </div>
        </div>
       ))}
      </div>

      {/* BANNER SECTION - MOVED A LITTLE BIT DOWN */}
      <div className="flex justify-around items-end px-2 flex-1 pb-16 mt-4">
       {FACTIONS.map((f) => {
        const Icon = f.Banner;
        return (
         <button key={f.id} onClick={() => handlePlaceBet(f.id)} disabled={gameState!== 'betting'} className={cn("relative group active:scale-95 transition-all duration-300", gameState!== 'betting' && "opacity-60")}>
           <Icon className="w-28 h-36 drop-shadow-2xl" />
         </button>
        )
       })}
      </div>
    </main>

    {/* HISTORY BAR - NOW ABOVE CHIPS AS A LONG PATTI */}
    <div className="w-full bg-black/30 backdrop-blur-md border-y border-white/10 py-1.5 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-50">
      <span className="text-[9px] font-bold text-white/50 uppercase whitespace-nowrap">History:</span>
      <div className="flex items-center gap-1.5">
        {history.map((winId, idx) => {
          const faction = FACTIONS.find(f => f.id === winId);
          const Icon = faction?.Banner;
          return (
            <div key={idx} className={cn(
              "w-7 h-7 rounded bg-black/40 border flex items-center justify-center shrink-0",
              idx === 0? "border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.5)]" : "border-white/10 opacity-60"
            )}>
              {Icon && <Icon className="w-5 h-5" />}
            </div>
          );
        })}
      </div>
    </div>

    {/* FOOTER CHIPS */}
    <footer className="p-3 py-4 bg-gradient-to-t from-black/60 to-transparent shrink-0 relative z-50">
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
