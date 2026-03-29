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
      
      // 1. Immediate Local Guard
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

  const RewardCard = ({ day, amount, isBig = false, icon: Icon, label }: any) => (
    <div className={cn(
      "relative rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all bg-white",
      isBig ? "col-span-3 border-orange-200 bg-orange-50/30" : "border-gray-100",
      day === 1 && "border-yellow-400 ring-2 ring-yellow-400/20"
    )}>
      <div className={cn(
        "absolute top-0 left-0 px-2 py-0.5 rounded-tl-lg rounded-br-lg text-[10px] font-bold",
        isBig ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : "bg-yellow-400 text-black"
      )}>
        {day} {isBig && 'Big Reward'}
      </div>
      <div className="mt-4 flex flex-col items-center gap-1">
        {Icon ? (
          <div className="h-12 w-12 flex items-center justify-center">
            <Icon className={cn("h-10 w-10", isBig ? "text-orange-500" : "text-blue-400")} />
          </div>
        ) : (
          <div className="relative">
            <GoldCoinIcon className="h-10 w-10 drop-shadow-md" />
            <div className="absolute -bottom-1 -right-1">
              <GoldCoinIcon className="h-6 w-6 border-2 border-white rounded-full" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 mt-1">
          {amount && <GoldCoinIcon className="h-3 w-3 text-yellow-500" />}
          <span className="text-[10px] font-bold uppercase text-gray-700">
            {amount ? amount : label}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px] p-0 border-none bg-transparent shadow-none overflow-visible">
        <DialogHeader className="sr-only">
          <DialogTitle>Daily Reward</DialogTitle>
          <DialogDescription>Sign in daily to claim your tribe rewards.</DialogDescription>
        </DialogHeader>
        
        <div className="relative bg-[#fffdf0] rounded-[3rem] p-6 pt-12 shadow-2xl animate-in zoom-in duration-500 border-4 border-white">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-[320px] z-50">
            <div className="relative h-16 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl border-b-4 border-yellow-600">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-600 rotate-45 rounded-sm" />
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-600 rotate-45 rounded-sm" />
              <h2 className="text-3xl font-bold text-green-900 uppercase tracking-tight drop-shadow-sm">Daily Reward</h2>
            </div>
          </div>

          <div className="text-center mb-6 mt-4">
            <div className="bg-yellow-100/50 py-2 rounded-full inline-block px-10 border border-yellow-200">
              <p className="text-sm font-bold text-orange-800">Sign in for 7 days for rich rewards</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <RewardCard day={1} amount="5000" />
            <RewardCard day={2} amount="5000" />
            <RewardCard day={3} label="x1 Day" icon={Award} />
            <RewardCard day={4} amount="10000" />
            <RewardCard day={5} label="x1 Day" icon={Bike} />
            <RewardCard day={6} label="x3 Days" icon={ImageIcon} />
            <RewardCard day={7} isBig label="x3 Days" icon={Rocket} />
          </div>

          <div className="flex justify-center pb-4">
            <Button 
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-3/4 h-12 rounded-2xl bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 text-green-900 font-bold text-lg uppercase shadow-[0_8px_20px_rgba(234,179,8,0.3)] border-b-4 border-yellow-600 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isSigningIn ? 'Processing...' : 'Sign In'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
