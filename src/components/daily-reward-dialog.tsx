'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
 Dialog, 
 DialogContent, 
 DialogTitle, 
 DialogDescription,
 DialogHeader 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Star, Award, Bike, Image as ImageIcon, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * High-Fidelity Daily Reward Portal.
 */
export function DailyRewardDialog() {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (userProfile && user && typeof window !== 'undefined') {
      const today = new Date();
      const dateKey = today.toISOString().split('T')[0];
      const storageKey = `ummy_daily_reward_shown_${user.uid}_${dateKey}`;
      
      // 1. Immediate Local Guard (Prevents flicker on refresh)
      if (localStorage.getItem(storageKey)) {
        setOpen(false);
        return;
      }

      const lastSignIn = userProfile.lastSignInAt?.toDate();
      const isAlreadySignedInToday = lastSignIn && 
        lastSignIn.getDate() === today.getDate() && 
        lastSignIn.getMonth() === today.getMonth() && 
        lastSignIn.getFullYear() === today.getFullYear();

      if (!isAlreadySignedInToday) {
        setOpen(true);
      } else {
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [userProfile, user]);

  const handleSignIn = async () => {
    if (!user || !firestore || !userProfile) return;
    setIsSigningIn(true);

    try {
      const rewardAmount = 5000;
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

      const updateData = {
        'wallet.coins': increment(rewardAmount),
        'lastSignInAt': serverTimestamp(),
        'updatedAt': serverTimestamp()
      };

      await updateDocumentNonBlocking(userRef, updateData);
      await updateDocumentNonBlocking(profileRef, updateData);

      toast({
        title: 'Sign In Successful!',
        description: `You received ${rewardAmount.toLocaleString()} Gold Coins.`,
      });

      // Sync local storage
      if (typeof window !== 'undefined') {
        const dateKey = new Date().toISOString().split('T')[0];
        localStorage.setItem(`ummy_daily_reward_shown_${user.uid}_${dateKey}`, 'true');
      }

      setTimeout(() => {
        setOpen(false);
        setIsSigningIn(false);
      }, 800);
    } catch (e: any) {
      setIsSigningIn(false);
      toast({ variant: 'destructive', title: 'Sign In Failed', description: e.message });
    }
  };

  const RewardCard = ({ day, amount, isBig = false, icon: Icon, label, index }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn(
        "relative rounded-[1.2rem] border p-3 flex flex-col items-center gap-1 transition-all group overflow-hidden",
        isBig ? "col-span-3 bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border-yellow-500/30" : "bg-white/5 border-white/10 hover:bg-white/10",
        day === 1 && "border-cyan-500/30 bg-cyan-500/5 ring-1 ring-cyan-500/20"
      )}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
      
      <div className={cn(
        "absolute top-0 left-0 px-2.5 py-0.5 rounded-br-lg text-[9px] font-black uppercase tracking-wider shadow-lg",
        isBig ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "bg-white/10 text-white/40"
      )}>
        Day {day}
      </div>
      
      <div className="mt-5 flex flex-col items-center gap-1.5 transition-transform group-hover:scale-110 duration-500">
        <div className="h-14 w-14 flex items-center justify-center relative">
          {isBig ? (
            <img src="https://img.icons8.com/color/144/treasure-chest.png" className="h-14 w-14 drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]" />
          ) : Icon ? (
            <div className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10">
              <Icon className="h-6 w-6 text-cyan-400" />
            </div>
          ) : (
            <div className="relative">
              <img src="https://img.icons8.com/color/144/coins.png" className="h-12 w-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
              <div className="absolute -bottom-1 -right-1">
                 <img src="https://img.icons8.com/color/144/coins.png" className="h-6 w-6 border-2 border-[#1a1a1a] rounded-full" />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/5">
          {amount && <img src="https://img.icons8.com/color/48/coin.png" className="h-3 w-3" />}
          <span className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            isBig ? "text-orange-400" : "text-white/70"
          )}>
            {amount ? amount.toLocaleString() : label}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px] p-0 border-none bg-transparent shadow-none overflow-visible">
        <DialogHeader className="sr-only">
          <DialogTitle>Daily Reward</DialogTitle>
          <DialogDescription>Sign in daily to claim your tribe rewards.</DialogDescription>
        </DialogHeader>
        
        <div className="relative bg-[#1a1a1a] rounded-[2.5rem] p-6 pt-10 shadow-2xl overflow-hidden border border-white/10 group">
          {/* Animated Background Glow */}
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_70%)] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]" />

          <div className="text-center mb-8 relative">
            <motion.h2 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] mb-1"
            >
              Daily Reward
            </motion.h2>
            <div className="h-1 w-20 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto rounded-full opacity-50" />
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mt-3">Sign in 7 days for rich prizes</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8 relative">
            <RewardCard day={1} amount={5000} index={0} />
            <RewardCard day={2} amount={5000} index={1} />
            <RewardCard day={3} label="x1 Day" icon={Award} index={2} />
            <RewardCard day={4} amount={10000} index={3} />
            <RewardCard day={5} label="x1 Day" icon={Bike} index={4} />
            <RewardCard day={6} label="x3 Days" icon={ImageIcon} index={5} />
            <RewardCard day={7} isBig label="x3 Days" icon={Rocket} index={6} />
          </div>

          <div className="flex justify-center pb-2 relative">
            <Button 
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white font-black text-lg uppercase shadow-[0_10px_30px_rgba(245,158,11,0.3)] border border-white/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isSigningIn ? 'Processing...' : 'Claim Today'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
