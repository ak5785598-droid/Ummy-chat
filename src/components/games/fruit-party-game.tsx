'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, setDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { X, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Slot machine UI image - this is shown as the entire game background
const SLOT_MACHINE_IMAGE = 'https://imgur.com/placeholder.jpg'; // We'll use inline image URL

const FRUITS = [
  { id: 'lemon', name: 'Lemon', multiplier: 5 },
  { id: 'grapes', name: 'Grapes', multiplier: 10 },
  { id: 'orange', name: 'Orange', multiplier: 5 },
  { id: 'cherry', name: 'Cherry', multiplier: 45 },
  { id: 'apple', name: 'Apple', multiplier: 25 },
  { id: 'strawberry', name: 'Strawberry', multiplier: 15 },
  { id: 'mango', name: 'Mango', multiplier: 5 },
  { id: 'pomegranate', name: 'Pomegranate', multiplier: 5 },
];

const CHIPS = [
  { value: 500, label: '500' },
  { value: 5000, label: '5K' },
  { value: 50000, label: '50K' },
  { value: 500000, label: '500K' },
];

const generateUnique6DigitId = () => {
  let digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let id = '';
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * digits.length);
    id += digits[randomIndex];
    digits.splice(randomIndex, 1);
  }
  return id;
};

const formatKandM = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

const SOUNDS = {
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  SPIN_START: 'https://assets.mixkit.co/active_storage/sfx/2009/2009-preview.mp3',
};

export default function FruitPartyGame({ onClose, roomId }: { onClose?: () => void; roomId?: string }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedChip, setSelectedChip] = useState(5000);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [localCoins, setLocalCoins] = useState(0);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [winResult, setWinResult] = useState<any>(null);
  const [spinningSlots, setSpinningSlots] = useState<number[]>([0, 1, 2]); // Center 3 slots
  const [currentRoundId, setCurrentRoundId] = useState(() => generateUnique6DigitId());
  const [history, setHistory] = useState<string[]>([]);

  const playSound = (url: string, vol = 0.5) => {
    if (!isSoundOn) return;
    const audio = new Audio(url);
    audio.volume = vol;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (userProfile?.wallet?.coins !== undefined && !isCoinsLoaded) {
      setLocalCoins(userProfile.wallet.coins);
      setIsCoinsLoaded(true);
    }
  }, [userProfile, isCoinsLoaded]);

  // Betting timer
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

  const handlePlaceBet = async (fruitId: string) => {
    if (gameState !== 'betting' || !currentUser) return;
    if (localCoins < selectedChip) return;

    setLocalCoins(prev => prev - selectedChip);

    const userRef = doc(firestore, 'users', currentUser.uid);
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    try {
      await runTransaction(firestore as any, async (tx: any) => {
        tx.update(userRef, { 'wallet.coins': increment(-selectedChip) });
        tx.update(profileRef, { 'wallet.coins': increment(-selectedChip) });
      });
    } catch (e) {
      console.log('Bet deduction failed', e);
    }

    const newBetAmount = (myBets[fruitId] || 0) + selectedChip;
    setMyBets(prev => ({ ...prev, [fruitId]: newBetAmount }));

    playSound(SOUNDS.TICK, 0.3);
  };

  const startSpin = async () => {
    setGameState('spinning');
    playSound(SOUNDS.SPIN_START, 0.8);

    // Determine winner
    let winningFruitId: string;
    if (firestore) {
      try {
        const roundDocRef = doc(firestore, 'games', `fruit-party-round_${roomId || 'global'}`);
        winningFruitId = await runTransaction(firestore as any, async (tx: any) => {
          const snap = await tx.get(roundDocRef);
          if (snap.exists() && snap.data().winningFruitId) {
            return snap.data().winningFruitId as string;
          }
          const bytes = new Uint8Array(1);
          crypto.getRandomValues(bytes);
          const id = FRUITS[bytes[0] % FRUITS.length].id;
          tx.set(roundDocRef, {
            status: 'spinning',
            winningFruitId: id,
          }, { merge: true });
          return id;
        });
      } catch {
        winningFruitId = FRUITS[Math.floor(Math.random() * FRUITS.length)].id;
      }
    } else {
      winningFruitId = FRUITS[Math.floor(Math.random() * FRUITS.length)].id;
    }

    // Spin animation
    const winningIdx = FRUITS.findIndex(f => f.id === winningFruitId);
    const totalSpins = 5;
    let spinCount = 0;

    const spinInterval = setInterval(() => {
      setSpinningSlots([
        Math.floor(Math.random() * FRUITS.length),
        Math.floor(Math.random() * FRUITS.length),
        Math.floor(Math.random() * FRUITS.length),
      ]);
      spinCount++;

      if (spinCount >= totalSpins * FRUITS.length) {
        clearInterval(spinInterval);
        setSpinningSlots([winningIdx - 1 >= 0 ? winningIdx - 1 : FRUITS.length - 1, winningIdx, winningIdx + 1 < FRUITS.length ? winningIdx + 1 : 0]);
        finalizeResult(winningFruitId);
      }
    }, 100);
  };

  const finalizeResult = (winningFruitId: string) => {
    const winningFruit = FRUITS.find(f => f.id === winningFruitId);
    const betOnFruit = myBets[winningFruitId] || 0;
    const winAmount = betOnFruit * (winningFruit?.multiplier || 0);

    if (winAmount > 0) {
      playSound(SOUNDS.WIN, 0.6);
      setLocalCoins(prev => prev + winAmount);
    }

    setWinResult({
      fruit: winningFruit,
      betAmount: betOnFruit,
      winAmount: winAmount,
    });

    setHistory(prev => [winningFruitId, ...prev].slice(0, 10));
    setGameState('result');

    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinResult(null);
      setCurrentRoundId(generateUnique6DigitId());
    }, 5000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-md h-screen max-h-[90vh] relative overflow-hidden rounded-lg shadow-2xl"
      >
        {/* SLOT MACHINE BACKGROUND IMAGE */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://i.imgur.com/2x3Y7Kp.png)', // Slot machine image
          }}
        >
          {/* Overlay for controls */}
          <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-4 z-10">
            
            {/* TOP BAR - Coins & Buttons */}
            <div className="flex justify-between items-center">
              <div className="bg-blue-900/90 rounded-full px-4 py-2 flex items-center gap-2 text-yellow-300 font-bold">
                💰 {localCoins.toLocaleString()}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsSoundOn(!isSoundOn)} className="bg-slate-700/80 p-2 rounded-full hover:bg-slate-600">
                  {isSoundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button onClick={onClose} className="bg-slate-700/80 p-2 rounded-full hover:bg-slate-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CENTER - Timer */}
            <div className="text-center">
              <div className="bg-black/70 px-8 py-4 rounded-lg inline-block border-2 border-yellow-500">
                <div className="text-yellow-400 text-sm font-bold">Round {currentRoundId}</div>
                <div className={`text-5xl font-black ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {gameState === 'betting' ? timeLeft : '🎲'}
                </div>
              </div>
            </div>

            {/* BOTTOM - Chips & Spin Info */}
            <div className="space-y-4">
              
              {/* Chips Selection */}
              <div className="flex gap-2 justify-center flex-wrap">
                {CHIPS.map(chip => (
                  <motion.button
                    key={chip.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedChip(chip.value)}
                    className={`px-6 py-3 rounded-full font-bold text-white transition-all ${
                      selectedChip === chip.value
                        ? 'bg-red-600 shadow-lg shadow-red-500 scale-110'
                        : 'bg-gradient-to-b from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600'
                    }`}
                  >
                    {chip.label}
                  </motion.button>
                ))}
              </div>

              {/* Fruit Selection Grid */}
              <div className="grid grid-cols-4 gap-2 bg-black/50 p-3 rounded-lg">
                {FRUITS.map((fruit) => (
                  <motion.button
                    key={fruit.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePlaceBet(fruit.id)}
                    disabled={gameState !== 'betting'}
                    className={`py-2 rounded font-bold text-sm transition-all ${
                      myBets[fruit.id]
                        ? 'bg-yellow-500 text-black shadow-lg'
                        : 'bg-purple-600/80 text-white hover:bg-purple-500'
                    } ${gameState !== 'betting' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div>{fruit.name}</div>
                    <div className="text-xs">×{fruit.multiplier}</div>
                    {myBets[fruit.id] && <div className="text-xs font-black">{formatKandM(myBets[fruit.id])}</div>}
                  </motion.button>
                ))}
              </div>

              {/* Result History */}
              <div className="bg-black/70 rounded-lg p-2 flex gap-1 overflow-x-auto">
                <span className="text-yellow-400 text-xs font-bold whitespace-nowrap pt-1">Result:</span>
                {history.length > 0 ? (
                  history.slice(0, 8).map((id, i) => (
                    <div key={i} className="w-6 h-6 bg-yellow-600 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {FRUITS.find(f => f.id === id)?.name?.[0]}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* WIN POPUP */}
        <AnimatePresence>
          {winResult && gameState === 'result' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
            >
              <div className="bg-gradient-to-b from-yellow-400 to-orange-500 rounded-2xl p-8 text-center text-black">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-4xl font-black mb-4">{winResult.winAmount > 0 ? '✨ WIN ✨' : 'Try Again'}</div>
                {winResult.winAmount > 0 && (
                  <div className="space-y-2">
                    <div className="text-3xl font-black">+{formatKandM(winResult.winAmount)}</div>
                    <div className="text-sm opacity-80">Bet: {formatKandM(winResult.betAmount)}</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
