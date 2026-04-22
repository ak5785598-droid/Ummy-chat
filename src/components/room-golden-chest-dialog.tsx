'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { 
  X, 
  Sparkles, 
  Gift, 
  Diamond, 
  Zap,
  Star,
  Coins
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/provider';
import { updateDocumentNonBlocking } from '@/firebase';
import { increment } from 'firebase/firestore';

interface GoldenChestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOOT_POOL = [
  { id: '1', label: '5,000 Coins', icon: Coins, color: 'text-yellow-400', value: 5000, type: 'coins' },
  { id: '2', label: 'Rare Badge', icon: Star, color: 'text-purple-400', value: 'badge_rare', type: 'item' },
  { id: '3', label: '10,000 Coins', icon: Coins, color: 'text-amber-500', value: 10000, type: 'coins' },
  { id: '4', label: 'VIP Card', icon: Zap, color: 'text-blue-400', value: 'vip_card', type: 'item' },
  { id: '5', label: 'Mystery Gift', icon: Gift, color: 'text-pink-400', value: 'gift_mystery', type: 'item' },
];

export function RoomGoldenChestDialog({ open, onOpenChange }: GoldenChestDialogProps) {
  const { currentUser } = useUser();
  const [chestState, setChestState] = useState<'closed' | 'shaking' | 'open'>('closed');
  const [reward, setReward] = useState<any>(null);

  const handleOpenChest = useCallback(async () => {
    if (chestState !== 'closed') return;

    setChestState('shaking');

    // 1. Logic for opening cost (if any) could go here
    
    // 2. Wait for shake animation
    setTimeout(async () => {
      const selectedReward = LOOT_POOL[Math.floor(Math.random() * LOOT_POOL.length)];
      setReward(selectedReward);
      setChestState('open');

      // 3. Real-time sync of rewards
      if (currentUser && selectedReward.type === 'coins') {
        await updateDocumentNonBlocking('users', currentUser.uid, {
          'wallet.coins': increment(selectedReward.value as number)
        });
      }
    }, 1200);
  }, [chestState, currentUser]);

  const handleReset = () => {
    setChestState('closed');
    setReward(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent 
        hideClose={true}
        className="max-w-md w-full aspect-square bg-transparent border-none p-0 overflow-visible shadow-none z-[3300]"
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          
          {/* CLOSE BUTTON */}
          <button 
            onClick={handleReset}
            className="absolute -top-16 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-95 transition-transform z-50"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* AMBIENT LIGHTING */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full animate-pulse" />
          </div>

          {/* THE CHEST */}
          <motion.div
            animate={chestState === 'shaking' ? {
              rotate: [0, -5, 5, -5, 5, 0],
              scale: [1, 1.1, 1, 1.1, 1],
              transition: { duration: 0.2, repeat: 6 }
            } : { rotate: 0, scale: 1 }}
            className="relative z-10 cursor-pointer group"
            onClick={handleOpenChest}
          >
            <div className="relative w-64 h-64">
              <Image 
                src="/images/haza_style_golden_chest_3d_render_1776810834081.png" 
                alt="Golden Chest" 
                fill 
                className={cn(
                  "object-contain transition-all duration-700",
                  chestState === 'open' ? "opacity-40 blur-sm scale-90" : "opacity-100 group-hover:drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                )}
                unoptimized
              />
              
              {chestState === 'closed' && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <p className="text-yellow-400 font-black uppercase tracking-[0.2em] text-sm animate-pulse flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Tap to Open <Sparkles className="h-4 w-4" />
                  </p>
                </div>
              )}
            </div>

            {/* REWARD REVEAL ANIMATION */}
            <AnimatePresence>
              {chestState === 'open' && reward && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, y: -80 }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
                >
                  <div className="relative p-8 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600 shadow-[0_0_80px_rgba(234,179,8,0.6)]">
                    <reward.icon className="h-20 w-20 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
                    
                    {/* CONFETTI/SPARKLE BURST */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{ opacity: 1, x: Math.cos(i * 45) * 100, y: Math.sin(i * 45) * 100 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-yellow-300"
                      />
                    ))}
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center"
                  >
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                      {reward.label}
                    </h3>
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-1">Loot Added to Inventory!</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
