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
import { Loader } from 'lucide-react';

const DAILY_REWARDS = [
  { day: 1, amount: 5000 },
  { day: 2, amount: 10000 },
  { day: 3, amount: 10000 },
  { day: 4, amount: 10000 },
  { day: 5, amount: 10000 },
  { day: 6, amount: 10000 },
  { day: 7, amount: 10000 }
];

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isYesterday = (lastDate: Date, todayDate: Date) => {
  const yesterday = new Date(todayDate);
  yesterday.setDate(todayDate.getDate() - 1);
  return isSameDay(lastDate, yesterday);
};

export function DailyRewardDialog() {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [activeDay, setActiveDay] = useState(1);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  useEffect(() => {
    if (userProfile && user && typeof window !== 'undefined') {
      const today = new Date();
      const dateKey = today.toISOString().split('T')[0];
      const storageKey = `ummy_daily_reward_shown_${user.uid}_${dateKey}`;
      
      // Local storage check to prevent dialog pop-up spam
      if (localStorage.getItem(storageKey)) {
        setOpen(false);
      }

      const lastSignIn = userProfile.lastSignInAt?.toDate();
      const currentStreak = userProfile.signInStreak || 0;

      if (!lastSignIn) {
        setActiveDay(1);
        setHasClaimedToday(false);
        if (!localStorage.getItem(storageKey)) setOpen(true);
      } else {
        const isToday = isSameDay(lastSignIn, today);
        const isYest = isYesterday(lastSignIn, today);

        if (isToday) {
          setActiveDay(currentStreak || 1);
          setHasClaimedToday(true);
        } else if (isYest) {
          const nextDay = currentStreak + 1;
          setActiveDay(nextDay > 7 ? 1 : nextDay);
          setHasClaimedToday(false);
          if (!localStorage.getItem(storageKey)) setOpen(true);
        } else {
          // Missed login day -> Reset streak back to Day 1
          setActiveDay(1);
          setHasClaimedToday(false);
          if (!localStorage.getItem(storageKey)) setOpen(true);
        }
      }
    }
  }, [userProfile, user]);

  const handleSignIn = async () => {
    if (!user || !firestore || !userProfile || hasClaimedToday) return;
    setIsSigningIn(true);

    try {
      const rewardAmount = DAILY_REWARDS[activeDay - 1].amount;
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

      const updateData = {
        'wallet.coins': increment(rewardAmount),
        'signInStreak': activeDay,
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

      setHasClaimedToday(true);

      setTimeout(() => {
        setOpen(false);
        setIsSigningIn(false);
      }, 1000);
    } catch (e: any) {
      setIsSigningIn(false);
      toast({ variant: 'destructive', title: 'Sign In Failed', description: e.message });
    }
  };

  const RewardCard = ({ day, amount, isBig = false, isClaimed = false, isActive = false }: any) => (
    <div className={cn(
      "relative rounded-2xl border-2 p-3 flex flex-col items-center justify-center transition-all bg-white overflow-hidden shadow-sm",
      isBig ? "w-full border-purple-200 bg-purple-50/25" : "border-slate-100",
      isActive && "border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/25 scale-[1.02] shadow-md",
      isClaimed && "border-green-200 bg-green-50/20 opacity-80"
    )}>
      <div className={cn(
        "absolute top-0 left-0 px-2.5 py-0.5 rounded-tl-xl rounded-br-xl text-[10px] font-black tracking-wide",
        isBig 
          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white" 
          : isActive 
            ? "bg-purple-500 text-white"
            : isClaimed
              ? "bg-green-500 text-white"
              : "bg-slate-200 text-slate-500"
      )}>
        {isBig ? `${day} BIG REWARDS` : day}
      </div>
      
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div className="relative">
          <GoldCoinIcon className={cn("h-10 w-10 drop-shadow-md transition-transform", isActive && "animate-bounce")} />
          {isClaimed && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-[10px] font-black">
              ✓
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 mt-1">
          <GoldCoinIcon className="h-3 w-3" />
          <span className="text-[10px] font-black text-slate-700 tracking-tight">{amount}</span>
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
          {/* Top Banner Header */}
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

          {/* High-Fidelity 4-2-1 Grid matching screenshot exactly */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2.5">
              {DAILY_REWARDS.slice(0, 4).map((r) => (
                <RewardCard 
                  key={r.day} 
                  day={r.day} 
                  amount={r.amount}
                  isClaimed={r.day < activeDay || (r.day === activeDay && hasClaimedToday)}
                  isActive={r.day === activeDay && !hasClaimedToday}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {DAILY_REWARDS.slice(4, 6).map((r) => (
                <RewardCard 
                  key={r.day} 
                  day={r.day} 
                  amount={r.amount}
                  isClaimed={r.day < activeDay || (r.day === activeDay && hasClaimedToday)}
                  isActive={r.day === activeDay && !hasClaimedToday}
                />
              ))}
            </div>

            <div>
              <RewardCard 
                day={7} 
                amount={DAILY_REWARDS[6].amount}
                isBig
                isClaimed={7 < activeDay || (7 === activeDay && hasClaimedToday)}
                isActive={7 === activeDay && !hasClaimedToday}
              />
            </div>
          </div>

          <div className="flex justify-center pb-2 mt-8">
            <Button 
              onClick={handleSignIn}
              disabled={isSigningIn || hasClaimedToday}
              className={cn(
                "w-[260px] h-12 rounded-2xl text-white font-black text-lg uppercase shadow-lg transition-all active:scale-95 duration-200",
                hasClaimedToday
                  ? "bg-slate-300 text-slate-500 border-b-4 border-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700 hover:scale-[1.02] border-b-4 border-purple-800"
              )}
            >
              {isSigningIn ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : hasClaimedToday ? (
                'Claimed Today'
              ) : (
                'Sign In Today'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
