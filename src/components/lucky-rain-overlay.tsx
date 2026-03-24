
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface FallingCoin {
 id: number;
 left: number;
 delay: number;
 duration: number;
}

interface RewardPop {
 id: number;
 x: number;
 y: number;
}

interface LuckyRainOverlayProps {
 active: boolean;
 onComplete: () => void;
}

/**
 * High-Fidelity Lucky Rain Overlay.
 * Generates interactive falling coins that add 10 Gold Coins to the user's vault on tap.
 * Features real-time +10 pop animations at the contact point.
 * Duration: Strictly 30 seconds.
 */
export function LuckyRainOverlay({ active, onComplete }: LuckyRainOverlayProps) {
 const [coins, setCoins] = useState<FallingCoin[]>([]);
 const [rewards, setRewards] = useState<RewardPop[]>([]);
 const { user } = useUser();
 const firestore = useFirestore();

 useEffect(() => {
  if (active) {
   // Generate high-density coins for a rich 30-second tribal experience
   const newCoins = Array.from({ length: 120 }).map((_, i) => ({
    id: Date.now() + i,
    left: Math.random() * 90, // Keep away from extreme edges
    delay: Math.random() * 28, // Staggered entry over 28 seconds to fit 30s window
    duration: 2 + Math.random() * 2, // Randomized fall speed for SVGA feel
   }));
   setCoins(newCoins);

   // Strictly 30 second synchronization
   const timer = setTimeout(() => {
    setCoins([]);
    setRewards([]);
    onComplete();
   }, 30000);

   return () => clearTimeout(timer);
  }
 }, [active, onComplete]);

 const handleCoinTap = useCallback((e: React.MouseEvent | React.TouchEvent, coinId: number) => {
  if (!user || !firestore) return;

  // 1. Capture Interaction Coordinates
  let clientX, clientY;
  if ('clientX' in e) {
   clientX = e.clientX;
   clientY = e.clientY;
  } else {
   clientX = e.touches[0].clientX;
   clientY = e.touches[0].clientY;
  }

  // 2. Remove coin from visual frequency instantly
  setCoins(prev => prev.filter(c => c.id !== coinId));

  // 3. Trigger High-Fidelity Reward Pop
  const rewardId = Date.now() + Math.random();
  setRewards(prev => [...prev, { id: rewardId, x: clientX, y: clientY }]);
  
  // Cleanup pop after animation
  setTimeout(() => {
   setRewards(prev => prev.filter(r => r.id !== rewardId));
  }, 800);

  // 4. High-speed atomic sync: Dispatch 10 coins to vault
  const userRef = doc(firestore, 'users', user.uid);
  const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
  
  const updateData = {
   'wallet.coins': increment(10),
   updatedAt: serverTimestamp()
  };

  updateDocumentNonBlocking(userRef, updateData);
  updateDocumentNonBlocking(profileRef, updateData);
 }, [user, firestore]);

 if (!active || (coins.length === 0 && rewards.length === 0)) return null;

 return (
  <div className="fixed inset-0 z-[400] pointer-events-none overflow-hidden select-none">
   {/* Interactive Falling Coins */}
   {coins.map((coin) => (
    <div
     key={coin.id}
     onMouseDown={(e) => handleCoinTap(e, coin.id)}
     onTouchStart={(e) => handleCoinTap(e, coin.id)}
     className="absolute pointer-events-auto cursor-pointer animate-lucky-fall group"
     style={{
      left: `${coin.left}%`,
      top: '-50px',
      animationDelay: `${coin.delay}s`,
      animationDuration: `${coin.duration}s`,
     }}
    >
     <div className="relative hover:scale-125 transition-transform active:scale-90">
       <div className="absolute inset-0 bg-yellow-400 blur-md opacity-0 group-hover:opacity-40 animate-pulse" />
       <GoldCoinIcon className="h-10 w-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-shimmer-gold" />
     </div>
    </div>
   ))}

   {/* High-Fidelity Reward Labels (+10) */}
   {rewards.map((reward) => (
    <div 
     key={reward.id}
     className="absolute z-[401] flex items-center gap-1 animate-reward-pop pointer-events-none"
     style={{ left: reward.x, top: reward.y }}
    >
      <GoldCoinIcon className="h-5 w-5 drop-shadow-md" />
      <span className="text-2xl font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
       +10
      </span>
    </div>
   ))}

   {/* High-Fidelity "Lucky Rain" Banner */}
   {active && (
    <div className="absolute top-40 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in duration-700 pointer-events-none">
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 px-12 py-3 rounded-full border-2 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.6)]">
       <h2 className="text-3xl font-bold text-white uppercase tracking-tight drop-shadow-md">LUCKY RAIN SYNC</h2>
      </div>
    </div>
   )}

   <style jsx global>{`
    @keyframes lucky-fall {
     0% { transform: translateY(0) rotate(0deg); opacity: 0; }
     10% { opacity: 1; }
     90% { opacity: 1; }
     100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }
    .animate-lucky-fall {
     animation-name: lucky-fall;
     animation-timing-function: linear;
     animation-fill-mode: forwards;
    }
    @keyframes reward-pop {
     0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
     20% { transform: translate(-50%, -20px) scale(1.2); opacity: 1; }
     100% { transform: translate(-50%, -80px) scale(1.5); opacity: 0; }
    }
    .animate-reward-pop {
     animation: reward-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
   `}</style>
  </div>
 );
}
