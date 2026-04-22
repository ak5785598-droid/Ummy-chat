'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  History, 
  Trophy, 
  Coins, 
  Sparkles,
  Zap,
  Gift
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion, useAnimation } from 'framer-motion';
import { useUser, useFirestore } from '@/firebase/provider';
import { updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';

interface LuckySpinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REWARDS = [
  { id: 1, label: '500 Coins', color: '#ff00ff', value: 500, type: 'coins' },
  { id: 2, label: 'Frame (7d)', color: '#00ffff', value: 'frame', type: 'item' },
  { id: 3, label: '100 Coins', color: '#ff0000', value: 100, type: 'coins' },
  { id: 4, label: 'VIP (1d)', color: '#ffff00', value: 'vip', type: 'item' },
  { id: 5, label: '1000 Coins', color: '#00ff00', value: 1000, type: 'coins' },
  { id: 6, label: '10 Coins', color: '#ffffff', value: 10, type: 'coins' },
  { id: 7, label: 'LUCKY KEY', color: '#ff8800', value: 'key', type: 'item' },
  { id: 8, label: 'Try Again', color: '#444444', value: 0, type: 'none' },
];

const SPIN_COST = 100;

export function RoomLuckySpinDialog({ open, onOpenChange }: LuckySpinDialogProps) {
  const { user: currentUser } = useUser();
  const { userProfile: profile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  const controls = useAnimation();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<any>(null);
  const currentRotation = useRef(0);

  const handleSpin = async () => {
    if (isSpinning || !currentUser) return;

    const userCoins = (profile as any)?.wallet?.coins || 0;
    if (userCoins < SPIN_COST) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: `You need ${SPIN_COST} coins to spin! Your balance: ${userCoins}` });
      return;
    }

    setIsSpinning(true);
    setLastWin(null);
    console.log('[Spin] Starting spin logic. User coins:', userCoins);

    // 1. Deduct Coins (Real-Time Sync on BOTH main and profile docs)
    try {
      const mainRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      
      await updateDocumentNonBlocking('users', currentUser.uid, {
        'wallet.coins': increment(-SPIN_COST)
      });
      // Also update sub-profile for legacy/alternate components
      await updateDocumentNonBlocking(`users/${currentUser.uid}/profile`, currentUser.uid, {
        'wallet.coins': increment(-SPIN_COST)
      });
    } catch (e) {
      console.error('Spin deduction failed:', e);
      setIsSpinning(false);
      return;
    }

    // 2. Determine Result (Random for now)
    const resultIndex = Math.floor(Math.random() * REWARDS.length);
    const win = REWARDS[resultIndex];

    // 3. Animate
    const rounds = 5 + Math.floor(Math.random() * 5);
    const segmentAngle = 360 / REWARDS.length;
    // We calculate the new target relative to the current rotation to ensure it always spins forward
    const newTargetAngle = currentRotation.current + (rounds * 360) + (resultIndex * segmentAngle);
    currentRotation.current = newTargetAngle;
    
    await controls.start({
      rotate: newTargetAngle,
      transition: { duration: 4, ease: [0.13, 0, 0, 1] }
    });

    setIsSpinning(false);
    setLastWin(win);

    // 4. Record Win
    if (win.type === 'coins' && win.value > 0) {
      await updateDocumentNonBlocking('users', currentUser.uid, {
        'wallet.coins': increment(win.value as number)
      });
      await updateDocumentNonBlocking(`users/${currentUser.uid}/profile`, currentUser.uid, {
        'wallet.coins': increment(win.value as number)
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose={true}
        className="max-w-md w-[90vw] aspect-square bg-transparent border-none p-0 overflow-visible shadow-none z-[3200]"
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          
          {/* CLOSE BUTTON */}
          <button 
            onClick={() => !isSpinning && onOpenChange(false)}
            className="absolute -top-12 right-0 h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* NEON TITLE */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">
              LUCKY SPIN
            </h2>
          </div>

          {/* THE WHEEL CONTAINER */}
          <div className="relative w-full aspect-square rounded-full border-[8px] border-[#1a1a1a] shadow-[0_0_50px_rgba(236,72,153,0.3),inset_0_0_20px_rgba(0,0,0,1)] bg-[#0f0f0f] overflow-hidden">
            
            {/* WHEEL SHINE/GLASS */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent rounded-full" />
            
            {/* ROTATING WHEEL */}
            <motion.div 
              initial={{ rotate: 0 }}
              animate={controls}
              className="absolute inset-0 z-10"
              style={{
                background: `conic-gradient(from 0deg, ${REWARDS.map((r, i) => `${r.color} ${i * (360/REWARDS.length)}deg ${(i+1) * (360/REWARDS.length)}deg`).join(', ')})`
              }}
            >
              {REWARDS.map((r, i) => (
                <div 
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 origin-bottom h-[50%] flex flex-col items-center justify-start pt-6"
                  style={{ transform: `translateX(-50%) translateY(-100%) rotate(${i * (360/REWARDS.length) + (360/REWARDS.length/2)}deg)` }}
                >
                  <span className="text-[10px] font-black uppercase text-black/80 drop-shadow-sm whitespace-nowrap rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    {r.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* WHEEL CENTER HUB */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-700 border-4 border-white/20 shadow-2xl flex items-center justify-center">
              <Zap className="h-8 w-8 text-white fill-white animate-pulse" />
            </div>

            {/* THE NEEDLE / POINTER */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40">
              <div className="w-6 h-8 bg-white rounded-b-full shadow-lg flex items-center justify-center">
                <div className="w-2 h-4 bg-red-500 rounded-b-full" />
              </div>
            </div>
          </div>

          {/* SPIN ACTION BUTTON */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={cn(
                "relative h-16 px-12 rounded-full font-black text-xl tracking-widest uppercase transition-all duration-300",
                isSpinning 
                  ? "bg-white/10 text-white/20 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-[0_10px_30px_rgba(236,72,153,0.5)] hover:scale-105 active:scale-95 animate-bounce-subtle"
              )}
            >
              {isSpinning ? 'SPINNING...' : 'SPIN'}
              {!isSpinning && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-400" />
                  <span className="text-[10px] text-white/80">{SPIN_COST}</span>
                </div>
              )}
            </button>

            {/* WINNINGS DISPLAY */}
            <div className="h-8">
              {lastWin && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-bold text-white">CONGRATS! YOU WON {lastWin.label}!</span>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
