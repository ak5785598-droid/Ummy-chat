'use client';

import { useState, useEffect, useRef } from 'react';
import { 
 useUser, 
 useFirestore, 
 updateDocumentNonBlocking 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { 
 X, Volume2, Trophy, Loader2, HelpCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM SVG COMPONENTS ---

const ElephantMascot = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-lg">
    <circle cx="50" cy="55" r="35" fill="#A5D6F1" />
    <circle cx="30" cy="40" r="15" fill="#A5D6F1" />
    <circle cx="70" cy="40" r="15" fill="#A5D6F1" />
    <circle cx="30" cy="40" r="8" fill="#F48FB1" />
    <circle cx="70" cy="40" r="8" fill="#F48FB1" />
    <circle cx="40" cy="50" r="4" fill="#000" />
    <circle cx="60" cy="50" r="4" fill="#000" />
    <path d="M45 65 Q50 85 55 65" fill="none" stroke="#A5D6F1" strokeWidth="6" strokeLinecap="round" />
    <path d="M42 60 L38 58 M58 60 L62 58" stroke="#000" strokeWidth="1" />
  </svg>
);

const FoodIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'apple':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <defs>
            <radialGradient id="grad-apple" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff4d4d" />
              <stop offset="100%" stopColor="#990000" />
            </radialGradient>
          </defs>
          <path d="M50 30 C30 30 20 50 20 70 C20 90 40 95 50 85 C60 95 80 90 80 70 C80 50 70 30 50 30" fill="url(#grad-apple)" />
          <path d="M50 30 L55 15" stroke="#4d2600" strokeWidth="4" strokeLinecap="round" />
          <path d="M55 20 C65 15 70 25 55 20" fill="#2eb82e" />
        </svg>
      );
    case 'lemon':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <ellipse cx="50" cy="55" rx="35" ry="25" fill="#ffe11a" stroke="#cc9900" strokeWidth="2" />
          <path d="M15 55 Q10 55 15 50 M85 55 Q90 55 85 50" stroke="#cc9900" strokeWidth="3" />
        </svg>
      );
    case 'strawberry':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <path d="M50 90 C25 80 20 40 50 30 C80 40 75 80 50 90" fill="#ff3333" />
          <path d="M40 35 L50 20 L60 35 L50 30 Z" fill="#009933" />
          {[35, 45, 55, 65].map(x => [50, 60, 70].map(y => <circle key={`${x}-${y}`} cx={x + (y%20)} cy={y} r="1.5" fill="#ffff99" />))}
        </svg>
      );
    case 'mango':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <path d="M50 30 Q80 30 80 60 Q80 90 50 90 Q20 90 30 60 Q30 30 50 30" fill="#ffcc00" />
          <path d="M45 35 Q35 35 45 60" fill="#ff9900" opacity="0.5" />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="#ff9933" />
          <path d="M80 50 L95 35 L95 65 Z" fill="#ff9933" />
          <circle cx="35" cy="45" r="3" fill="white" />
        </svg>
      );
    case 'burger':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <path d="M20 45 Q50 20 80 45" fill="#cc9966" />
          <rect x="18" y="45" width="64" height="8" fill="#00cc44" rx="4" />
          <rect x="20" y="53" width="60" height="10" fill="#804000" rx="2" />
          <path d="M20 63 Q50 80 80 63" fill="#cc9966" />
        </svg>
      );
    case 'pizza':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <path d="M50 85 L15 30 Q50 20 85 30 Z" fill="#ffcc66" />
          <path d="M50 80 L20 35 Q50 28 80 35 Z" fill="#ffdb4d" />
          <circle cx="40" cy="45" r="4" fill="#cc0000" />
          <circle cx="60" cy="55" r="4" fill="#cc0000" />
          <circle cx="45" cy="65" r="4" fill="#cc0000" />
        </svg>
      );
    case 'chicken':
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <path d="M30 40 Q60 20 80 50 Q60 80 30 60 Z" fill="#994d00" />
          <rect x="10" y="55" width="25" height="8" fill="#f2f2f2" rx="4" transform="rotate(-20 10 55)" />
        </svg>
      );
    default:
      return null;
  }
};

// --- GAME LOGIC ---

const ITEMS = [
  { id: 'apple', multiplier: 5, label: 'x5', color: 'from-red-500 to-red-700', index: 0 },
  { id: 'lemon', multiplier: 5, label: 'x5', color: 'from-yellow-300 to-yellow-500', index: 1 },
  { id: 'strawberry', multiplier: 5, label: 'x5', color: 'from-rose-400 to-red-600', index: 2 },
  { id: 'mango', multiplier: 5, label: 'x5', color: 'from-orange-400 to-yellow-500', index: 3 },
  { id: 'fish', multiplier: 10, label: 'x10', color: 'from-orange-300 to-orange-500', index: 4 },
  { id: 'burger', multiplier: 15, label: 'x15', color: 'from-amber-600 to-yellow-700', index: 5 },
  { id: 'pizza', multiplier: 25, label: 'x25', color: 'from-orange-500 to-red-500', index: 6 },
  { id: 'chicken', multiplier: 45, label: 'x45', color: 'from-orange-700 to-amber-800', index: 7 },
];

const CHIPS_DATA = [
  { value: 100, label: '100', color: 'from-cyan-400 to-blue-500' },
  { value: 1000, label: '1K', color: 'from-green-400 to-emerald-500' },
  { value: 5000, label: '5K', color: 'from-blue-500 to-indigo-600' },
  { value: 10000, label: '10K', color: 'from-orange-400 to-red-500' },
  { value: 50000, label: '50K', color: 'from-red-500 to-rose-600' },
  { value: 10, label: '10', color: 'from-purple-400 to-fuchsia-500' },
];

export default function FoodPartyGame({ onClose }: { onClose?: () => void }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(1000);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState(['strawberry', 'lemon', 'apple', 'lemon', 'fish']);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [droppedChips, setDroppedChips] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    if (userProfile?.wallet?.coins) setLocalCoins(userProfile.wallet.coins);
    return () => clearTimeout(timer);
  }, [userProfile]);

  useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          startSpin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handlePlaceBet = (id: string, idx: number) => {
    if (gameState !== 'betting' || localCoins < selectedChip) {
      toast({ title: 'Not enough coins!', variant: 'destructive' });
      return;
    }
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
    setLocalCoins(prev => prev - selectedChip);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(-selectedChip) });
    setDroppedChips(prev => [...prev, { id: Date.now(), itemIdx: idx, val: selectedChip }]);
  };

  const startSpin = () => {
    setGameState('spinning');
    const winItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    let currentStep = 0;
    const totalSteps = 40 + winItem.index;

    const run = () => {
      setHighlightIdx(currentStep % 8);
      if (currentStep < totalSteps) {
        currentStep++;
        setTimeout(run, 50 + (currentStep * 2));
      } else {
        setTimeout(() => finalizeResult(winItem), 1000);
      }
    };
    run();
  };

  const finalizeResult = (winItem: any) => {
    const winAmount = (myBets[winItem.id] || 0) * winItem.multiplier;
    if (winAmount > 0) {
      setLocalCoins(prev => prev + winAmount);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser!.uid), { 'wallet.coins': increment(winAmount) });
    }
    setWinnerData({ ...winItem, win: winAmount });
    setHistory(prev => [winItem.id, ...prev].slice(0, 8));
    setGameState('result');
    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinnerData(null);
      setHighlightIdx(null);
      setDroppedChips([]);
    }, 4000);
  };

  if (isLoading) return <div className="fixed inset-0 bg-[#1a0b45] flex items-center justify-center z-[100]"><Loader2 className="animate-spin text-yellow-400 w-12 h-12" /></div>;

  return (
    <div className="fixed inset-0 bg-[#1a144d] text-white flex flex-col items-center justify-center overflow-hidden">
      {/* HEADER */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="bg-black/50 px-4 py-2 rounded-full border border-yellow-500/50 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-yellow-400 text-blue-900 font-bold flex items-center justify-center text-[10px]">C</div>
          <span className="font-bold">{localCoins.toLocaleString()}</span>
        </div>
        <div className="flex gap-4">
          <Clock className="w-6 h-6 opacity-70" />
          <HelpCircle className="w-6 h-6 opacity-70" />
          <X className="w-6 h-6 cursor-pointer" onClick={onClose} />
        </div>
      </div>

      {/* WHEEL */}
      <div className="relative w-[380px] h-[380px] flex items-center justify-center">
        <div className="absolute inset-0 border-[10px] border-yellow-600/20 rounded-full" />
        
        {/* CENTER MASCOT */}
        <div className="z-50 w-32 h-32 rounded-full bg-gradient-to-b from-red-500 to-red-700 border-4 border-yellow-500 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <ElephantMascot />
          <div className="bg-red-800/90 w-full py-1 text-center absolute bottom-0">
            <p className="text-[8px] font-bold uppercase text-white/60">Bet Time</p>
            <p className="text-xl font-black">{gameState === 'betting' ? `${timeLeft}s` : '...'}</p>
          </div>
        </div>

        {/* CIRCLE ITEMS */}
        {ITEMS.map((item, idx) => {
          const angle = (idx * 45) - 90;
          const x = Math.cos((angle * Math.PI) / 180) * 135;
          const y = Math.sin((angle * Math.PI) / 180) * 135;

          return (
            <div key={item.id} className="absolute" style={{ transform: `translate(${x}px, ${y}px)` }}>
              <button 
                onClick={() => handlePlaceBet(item.id, idx)}
                className={cn(
                  "w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center relative transition-all duration-300",
                  highlightIdx === idx ? "scale-125 border-yellow-300 z-[60] brightness-125 shadow-[0_0_30px_#fbbf24]" : "border-yellow-600/40 bg-gradient-to-br",
                  item.color
                )}
              >
                <FoodIcon type={item.id} />
                <div className="absolute -bottom-1 bg-yellow-400 text-blue-900 px-2 rounded-full text-[9px] font-black border border-white">
                  {item.label}
                </div>
                {myBets[item.id] > 0 && (
                  <div className="absolute -top-2 -right-2 bg-white text-blue-900 text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-yellow-500">
                    {myBets[item.id] >= 1000 ? `${(myBets[item.id]/1000)}k` : myBets[item.id]}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="w-full mt-auto bg-black/40 backdrop-blur-xl p-6 border-t border-white/10">
        <div className="flex justify-center gap-3 mb-6">
          {CHIPS_DATA.map(chip => (
            <button 
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              className={cn(
                "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black transition-all",
                chip.color,
                selectedChip === chip.value ? "scale-110 ring-4 ring-yellow-400" : "opacity-50"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 justify-center">
          {history.map((id, i) => (
            <div key={i} className={cn("w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center", i === 0 && "border-yellow-400")}>
              <div className="scale-50"><FoodIcon type={id} /></div>
            </div>
          ))}
        </div>
      </footer>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {gameState === 'result' && winnerData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-gradient-to-b from-blue-600 to-blue-950 p-10 rounded-[3rem] border-4 border-yellow-400 flex flex-col items-center">
              <Trophy className="w-12 h-12 text-yellow-400 mb-4" />
              <div className="scale-150 mb-6"><FoodIcon type={winnerData.id} /></div>
              <h2 className="text-yellow-400 font-black italic text-3xl mb-2">BIG WIN!</h2>
              <p className="text-5xl font-black">+{winnerData.win}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
