'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader, Gem, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DiamondExchangePage() {
 const router = useRouter();
 const { user, isUserLoading } = useUser();
 const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [isProcessing, setIsProcessing] = useState<boolean>(false);
 const [diamondInput, setDiamondInput] = useState<string>('');

 // Logic: 100 diamonds = 33 coins (0.33 conversion rate)
 const calculatedCoins = Math.floor((Number(diamondInput) || 0) * 0.33);

 useEffect(() => {
  if (!isUserLoading && !user) {
   router.replace('/login');
  }
 }, [user, isUserLoading, router]);

 const handleExchange = async () => {
  if (!user || !firestore || !userProfile) return;

  const diamondsToExchange = Number(diamondInput);
  
  if (!diamondsToExchange || diamondsToExchange <= 0) {
    toast({
      variant: 'destructive',
      title: 'Invalid Amount',
      description: 'Please enter a valid amount of diamonds.'
    });
    return;
  }

  if ((userProfile.wallet?.diamonds || 0) < diamondsToExchange) {
   toast({ 
    variant: 'destructive', 
    title: 'Insufficient Diamonds', 
    description: 'You need more diamonds to complete this exchange.' 
   });
   return;
  }

  if (calculatedCoins <= 0) {
    toast({
      variant: 'destructive',
      title: 'Minimum Amount Not Met',
      description: 'You need to exchange more diamonds to get at least 1 coin.'
    });
    return;
  }

  setIsProcessing(true);

  try {
   const userRef = doc(firestore, 'users', user.uid);
   const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const historyRef = collection(firestore, 'users', user.uid, 'diamondExchanges');

   const updateData = {
    'wallet.diamonds': increment(-diamondsToExchange),
    'wallet.coins': increment(calculatedCoins),
    updatedAt: serverTimestamp()
   };

   // 1. Synchronize Balance Frequencies
   updateDocumentNonBlocking(userRef, updateData);
   updateDocumentNonBlocking(profileRef, updateData);

   // 2. Record Transaction in the Ledger
   addDocumentNonBlocking(historyRef, {
    type: 'exchange',
    diamondAmount: diamondsToExchange,
    coinAmount: calculatedCoins,
    timestamp: serverTimestamp(),
    status: 'completed'
   });

   toast({ 
    title: 'Exchange Successful', 
    description: `Successfully converted ${diamondsToExchange.toLocaleString()} Diamonds to ${calculatedCoins.toLocaleString()} Coins.` 
   });
   
   // Success ke baad input field khali karne ke liye
   setDiamondInput('');
  } catch (e: any) {
   toast({ variant: 'destructive', title: 'Exchange Failed', description: e.message });
  } finally {
   setIsProcessing(false);
  }
 };

 if (isUserLoading || isProfileLoading) {
  return (
   <AppLayout>
    <div className="flex h-screen items-center justify-center bg-white">
     <Loader className="animate-spin text-primary h-8 w-8" />
    </div>
   </AppLayout>
  );
 }

 if (!user) return null;

 return (
  <AppLayout>
   <div className="min-h-full bg-white font-sans flex flex-col animate-in fade-in duration-700">
    
    {/* Header Protocol */}
    <header className="px-6 pt-10 pb-4 flex items-center bg-white sticky top-0 z-50 border-b border-gray-50">
      <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
       <ChevronLeft className="h-6 w-6 text-gray-800" />
      </button>
      <h1 className="text-xl font-bold uppercase tracking-tight flex-1 text-center pr-10">Exchange diamonds</h1>
    </header>

    <div className="p-6 space-y-8">
      {/* Current Balance Box - Text Size Chota kar diya hai */}
      <div className="bg-[#fffef0] rounded-2xl p-5 flex items-center justify-between border border-orange-50 shadow-sm">
       <span className="text-gray-400 font-semibold text-sm uppercase tracking-tight">Current Diamonds</span>
       <div className="flex items-center gap-2">
         <Gem className="h-4 w-4 text-[#00E5FF] fill-current" />
         <span className="text-xl font-bold text-[#0ea5e9]">
          {(userProfile?.wallet?.diamonds || 0).toLocaleString()}
         </span>
       </div>
      </div>

      {/* Custom Exchange Section */}
      <div className="space-y-6">
       <h2 className="text-lg font-bold text-gray-900 px-1">Exchange Custom Amount</h2>
       
       <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
         
         {/* Diamond Input Area */}
         <div className="space-y-3">
           <label className="text-sm font-semibold text-gray-500 ml-1">Enter Diamonds to Exchange</label>
           <div className="flex items-center gap-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl px-4 py-3 focus-within:border-blue-300 focus-within:bg-blue-50 transition-all">
             <Gem className="h-6 w-6 text-[#00E5FF] fill-current" />
             <input 
               type="number" 
               value={diamondInput}
               onChange={(e) => setDiamondInput(e.target.value)}
               placeholder="0"
               min="1"
               className="w-full text-2xl font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
             />
           </div>
         </div>

         {/* Arrow Down Divider */}
         <div className="flex justify-center -my-2 relative z-10">
           <div className="bg-white border-2 border-gray-100 rounded-full p-2 shadow-sm">
             <ArrowDown className="h-5 w-5 text-gray-400" />
           </div>
         </div>

         {/* Output Coins Area */}
         <div className="space-y-3">
           <label className="text-sm font-semibold text-gray-500 ml-1">You will receive</label>
           <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3">
             <div className="h-7 w-7">
              <GoldCoinIcon className="h-full w-full drop-shadow-sm" />
             </div>
             <span className="w-full text-2xl font-bold text-gray-900">
               {calculatedCoins.toLocaleString()}
             </span>
           </div>
         </div>

         {/* Exchange Button */}
         <button 
            onClick={handleExchange}
            disabled={isProcessing || !diamondInput || Number(diamondInput) <= 0 || calculatedCoins <= 0}
            className={cn(
             "w-full h-14 rounded-full border-2 border-blue-100 bg-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95",
             "hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50 disabled:pointer-events-none mt-4"
            )}
           >
             {isProcessing ? (
              <Loader className="h-5 w-5 animate-spin text-blue-500" />
             ) : (
              <span className="font-bold text-blue-500 text-lg">Exchange Now</span>
             )}
         </button>

       </div>
      </div>
    </div>
   </div>
  </AppLayout>
 );
}

