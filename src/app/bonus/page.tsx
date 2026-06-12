'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { GoldCoinIcon } from '@/components/icons';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function BonusPage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  // Safely extract points owned
  const pointsOwned = userProfile?.activityPoints || 0; // fallback to activityPoints or custom bonusPoints field
  const rewardRate = 0.10; // 10%
  const bonusAmount = Math.floor(pointsOwned * rewardRate);

  const handleClaimBonus = async () => {
    if (!user || !firestore || bonusAmount <= 0) return;
    setIsClaiming(true);

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

      const updateData = {
        'wallet.coins': increment(bonusAmount),
        'activityPoints': 0, // Reset points owned after claiming
        'updatedAt': serverTimestamp()
      };

      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);

      toast({
        title: 'Bonus Claimed Successfully! 🎉',
        description: `Credited ${bonusAmount.toLocaleString()} Gold Coins to your account.`,
      });
    } catch (error) {
      console.error('Error claiming bonus:', error);
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: 'Something went wrong while claiming your bonus.',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 font-sans pb-32">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 bg-white border-b border-slate-100 sticky top-0 z-50 pt-safe">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 mx-auto -translate-x-4">
            Bonus
          </h1>
        </header>

        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* Yellow Gradient Card */}
          <div className="bg-gradient-to-br from-[#FFD54F] via-[#F59E0B] to-[#D97706] rounded-3xl p-6 text-center text-white shadow-lg relative overflow-hidden">
            {/* Background wave decorations */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            
            <p className="text-sm font-medium tracking-wide opacity-90 mb-4">
              Bonus you can get today
            </p>

            {/* Big Coin and Value */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <GoldCoinIcon className="h-12 w-12 drop-shadow-md animate-pulse" />
              <span className="text-5xl font-black tracking-tight drop-shadow-sm">
                {bonusAmount}
              </span>
            </div>

            {/* Get Button */}
            <Button
              onClick={handleClaimBonus}
              disabled={isClaiming || bonusAmount <= 0 || isProfileLoading}
              className="w-full h-12 bg-white text-[#D97706] hover:bg-slate-50 disabled:bg-white/40 disabled:text-white/80 rounded-full text-base font-bold shadow-md hover:scale-[1.01] active:scale-95 transition-all"
            >
              {isClaiming ? (
                <Loader className="animate-spin h-5 w-5 mx-auto" />
              ) : (
                'Get'
              )}
            </Button>
          </div>

          {/* Statistics Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between text-center divide-x divide-slate-100">
            <div className="flex-1">
              <p className="text-[20px] font-black text-slate-800 leading-none mb-1">
                {pointsOwned}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Points owned
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[20px] font-black text-slate-800 leading-none mb-1">
                {(rewardRate * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Reward Rate
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[20px] font-black text-slate-800 leading-none mb-1">
                {bonusAmount}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Bonus
              </p>
            </div>
          </div>

          {/* Bonus Calculation Details */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Bonus Calculation
            </h2>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                <span className="font-bold text-slate-800">1. Bonus</span> = Points owned x Reward Rate
              </p>
              <p>
                <span className="font-bold text-slate-800">2.</span> You will earn points when someone sends gifts in your room. 1 coins = 1 point. The more coins are spent, the more points you earn. When your daily points reach 100, you will receive a bonus.
              </p>
              <p>
                <span className="font-bold text-slate-800">3.</span> Reward rate depends on your room level as follows.
              </p>

              {/* Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden mt-2">
                <div className="grid grid-cols-2 bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider py-2 px-4 border-b border-slate-100 text-center">
                  <div>Room Rate</div>
                  <div>Room Level</div>
                </div>
                <div className="grid grid-cols-2 py-3 px-4 text-slate-700 font-semibold text-center text-xs">
                  <div className="text-amber-500 font-bold">10%</div>
                  <div>Lv0 - 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus Pay Time Details */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Bonus Pay Time
            </h2>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-xs text-slate-500 leading-relaxed">
              <p>
                You can redeem at any time during the day, and will expire at 24:00 (GMT+5.30) the next day. Please claim your bonus before it expires.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
