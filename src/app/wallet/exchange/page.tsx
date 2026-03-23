'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader, Gem } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const EXCHANGE_PACKAGES = [
  { coins: 330, diamonds: 1000 },
  { coins: 3300, diamonds: 10000 },
  { coins: 33000, diamonds: 100000 },
  { coins: 330000, diamonds: 1000000 },
  { coins: 3300000, diamonds: 10000000 },
  { coins: 33000000, diamonds: 100000000 },
];

/**
 * Diamond Exchange Portal.
 * Re-engineered to match the high-fidelity tribal blueprint.
 */
export default function DiamondExchangePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const handleExchange = async (pkg: typeof EXCHANGE_PACKAGES[0], index: number) => {
    if (!user || !firestore || !userProfile) return;

    if ((userProfile.wallet?.diamonds || 0) < pkg.diamonds) {
      toast({ 
        variant: 'destructive', 
        title: 'Insufficient Diamonds', 
        description: 'You need more diamonds to complete this exchange.' 
      });
      return;
    }

    setIsProcessing(index);

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const historyRef = collection(firestore, 'users', user.uid, 'diamondExchanges');

      const updateData = {
        'wallet.diamonds': increment(-pkg.diamonds),
        'wallet.coins': increment(pkg.coins),
        updatedAt: serverTimestamp()
      };

      // 1. Synchronize Balance Frequencies
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);

      // 2. Record Transaction in the Ledger
      addDocumentNonBlocking(historyRef, {
        type: 'exchange',
        diamondAmount: pkg.diamonds,
        coinAmount: pkg.coins,
        timestamp: serverTimestamp(),
        status: 'completed'
      });

      toast({ 
        title: 'Exchange Successful', 
        description: `Successfully converted ${pkg.diamonds.toLocaleString()} Diamonds to ${pkg.coins.toLocaleString()} Coins.` 
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Exchange Failed', description: e.message });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout hideSidebarOnMobile>
        <div className="flex h-screen items-center justify-center bg-white">
          <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout hideSidebarOnMobile>
      <div className="min-h-full bg-white font-headline flex flex-col animate-in fade-in duration-700">
        
        {/* Header Protocol */}
        <header className="px-6 pt-10 pb-4 flex items-center bg-white sticky top-0 z-50 border-b border-gray-50">
           <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
           </button>
           <h1 className="text-xl font-black uppercase tracking-tight flex-1 text-center pr-10">Exchange diamonds to coins</h1>
        </header>

        <div className="p-6 space-y-8">
           {/* Current Balance Box */}
           <div className="bg-[#fffef0] rounded-2xl p-6 flex items-center justify-between border border-orange-50 shadow-sm">
              <span className="text-gray-400 font-bold text-lg uppercase tracking-tight">Current Diamonds</span>
              <div className="flex items-center gap-2">
                 <Gem className="h-6 w-6 text-[#00E5FF] fill-current" />
                 <span className="text-2xl font-black text-[#0ea5e9]">
                    {(userProfile?.wallet?.diamonds || 0).toLocaleString()}
                 </span>
              </div>
           </div>

           {/* Exchange Roster */}
           <div className="space-y-2">
              <h2 className="text-lg font-black text-gray-900 mb-6 px-1">Exchange Diamonds to Coins</h2>
              
              <div className="divide-y divide-gray-50">
                 {EXCHANGE_PACKAGES.map((pkg, idx) => (
                   <div key={idx} className="flex items-center justify-between py-6 group">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10">
                            <GoldCoinIcon className="h-full w-full drop-shadow-sm" />
                         </div>
                         <span className="text-xl font-black text-gray-900">{pkg.coins.toLocaleString()}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleExchange(pkg, idx)}
                        disabled={isProcessing !== null}
                        className={cn(
                          "h-12 px-6 rounded-full border-2 border-blue-100 bg-white flex items-center gap-2 shadow-sm transition-all active:scale-95",
                          "hover:bg-blue-50 hover:border-blue-200"
                        )}
                      >
                         {isProcessing === idx ? (
                           <Loader className="h-4 w-4 animate-spin text-blue-500" />
                         ) : (
                           <Gem className="h-4 w-4 text-[#00E5FF] fill-current" />
                         )}
                         <span className="font-black text-blue-500 text-sm">
                            {pkg.diamonds.toLocaleString()}
                         </span>
                      </button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}
