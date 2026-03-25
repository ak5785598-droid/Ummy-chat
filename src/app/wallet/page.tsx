import Image from 'next/image';
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Loader, Info, Gem, ArrowRightLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { createOrderAction, verifyPaymentAction } from '@/actions/payments';
import Script from 'next/script';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

declare global {
 interface Window {
  Razorpay: any;
 }
}

const COIN_PACKAGES = [
 { id: 'p1', amount: '50,000', price: '10 INR', bonus: null },
 { id: 'p2', amount: '500,000', price: '100 INR', bonus: null },
 { id: 'p3', amount: '2,500,000', price: '500 INR', bonus: '+250000' },
 { id: 'p4', amount: '5,000,000', price: '1000 INR', bonus: '+750000' },
 { id: 'p5', amount: '12,500,000', price: '2500 INR', bonus: '+2500000' },
 { id: 'p6', amount: '50,000,000', price: '10000 INR', bonus: '+13500000' },
];

/**
 * Tribal Vault - High-Fidelity Economic Dimension.
 * Re-engineered for absolute routing stability and ultra-glossy visuals.
 */
export default function WalletPage() {
 const router = useRouter();
 const { user, isUserLoading } = useUser();
 const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [activeTab, setActiveTab] = useState<'Coins' | 'Diamonds'>('Coins');
 const [showRecords, setShowRecords] = useState(false);
 const [selectedPackageId, setSelectedPackageId] = useState('p1');
 const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineDialogOpen, setIsOfflineDialogOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const configRef = useMemoFirebase(() => {
   if (!firestore) return null;
   return doc(firestore, 'appConfig', 'global');
  }, [firestore]);
  const { data: config } = useDoc(configRef);

 useEffect(() => {
  if (!isUserLoading && !user) {
   router.replace('/login');
  }
 }, [user, isUserLoading, router]);

 const historyQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(
   collection(firestore, 'users', user.uid, 'diamondExchanges'),
   orderBy('timestamp', 'desc'),
   limit(20)
  );
 }, [firestore, user]);

 const { data: exchangeHistory, isLoading: isHistoryLoading } = useCollection(historyQuery);

 const handleRazorpayRecharge = async () => {
   if (!user || !firestore) return;
   const pkg = COIN_PACKAGES.find(p => p.id === selectedPackageId);
   if (!pkg) return;

   const priceINR = parseInt(pkg.price.split(' ')[0]);
   if (isNaN(priceINR)) return;

   setIsProcessing(true);

   try {
    const order = await createOrderAction(priceINR);
    
    if (!order.success) {
     toast({ variant: 'destructive', title: 'Order Failed', description: order.error });
     setIsProcessing(false);
     return;
    }

    const options = {
     key: order.keyId,
     amount: order.amount,
     currency: 'INR',
     name: 'Tribal Pulse',
     description: `Recharge ${pkg.amount} Coins`,
     order_id: order.orderId,
     handler: async (response: any) => {
      const verification = await verifyPaymentAction(
       response.razorpay_order_id,
       response.razorpay_payment_id,
       response.razorpay_signature
      );

      if (!verification.success) {
       toast({ variant: 'destructive', title: 'Verification Failed', description: verification.error || 'Payment verification failed.' });
       setIsProcessing(false);
       return;
      }

      const amountValue = parseInt(pkg.amount.replace(/,/g, ''));
      const bonusValue = pkg.bonus ? parseInt(pkg.bonus.replace('+', '')) : 0;
      const totalGain = amountValue + bonusValue;

      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      await updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
      await updateDocumentNonBlocking(profileRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
      
      try {
       const historyRef = collection(firestore, 'users', user.uid, 'diamondExchanges');
       await addDoc(historyRef, {
        type: 'purchase',
        coinAmount: totalGain,
        packageId: pkg.id,
        amountPaid: pkg.price,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        timestamp: serverTimestamp()
       });
      } catch (e) {
       console.error('Failed to log history', e);
      }
      
      toast({ title: 'Recharge Successful', description: `Synchronized ${totalGain.toLocaleString()} Coins to your vault.` });
      setIsProcessing(false);
     },
     prefill: {
      name: user.displayName || '',
      email: user.email || '',
     },
     theme: {
      color: '#ffcc00',
     },
     modal: {
      ondismiss: () => setIsProcessing(false)
     }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

   } catch (err: any) {
    console.error('[Payment Error]', err);
    toast({ variant: 'destructive', title: 'Payment Interruption', description: 'Could not connect to Razorpay Gateway.' });
    setIsProcessing(false);
   }
  };

  const handleRechargeNow = async () => {
   if (!user || !firestore) return;
   
   if (config?.paymentMode === 'razorpay') {
     handleRazorpayRecharge();
   } else {
     setIsOfflineDialogOpen(true);
   }
  };

  const handleSubmitManualRecharge = async () => {
   if (!user || !firestore || !utrNumber.trim()) {
    toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter the Transaction ID / UTR Number.' });
    return;
   }

   const pkg = COIN_PACKAGES.find(p => p.id === selectedPackageId);
   if (!pkg) return;

   setIsSubmittingManual(true);
   try {
    const requestRef = collection(firestore, 'rechargeRequests');
    await addDoc(requestRef, {
     uid: user.uid,
     username: userProfile?.username || 'Unknown',
     accountNumber: userProfile?.accountNumber || '0000',
     amount: pkg.price,
     coins: parseInt(pkg.amount.replace(/,/g, '')),
     bonus: pkg.bonus ? parseInt(pkg.bonus.replace('+', '')) : 0,
     utrNumber: utrNumber.trim(),
     status: 'pending',
     createdAt: serverTimestamp()
    });

    toast({ title: 'Request Submitted', description: 'Your payment is being verified by the admin.' });
    setIsOfflineDialogOpen(false);
    setUtrNumber('');
   } catch (error) {
    console.error('Manual recharge error', error);
    toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not send request. Please try again.' });
   } finally {
    setIsSubmittingManual(false);
   }
  };

  if (isUserLoading || isProfileLoading) {
  return (
   <AppLayout>
    <div className="flex h-[80vh] items-center justify-center bg-white">
     <Loader className="animate-spin text-primary h-8 w-8" />
    </div>
   </AppLayout>
  );
 }

 if (!user) return null;

 return (
  <AppLayout>
   <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
   <div className="min-h-full bg-white font-sans flex flex-col animate-in fade-in duration-700">
    
    {/* Header Protocol */}
    <header className="px-6 pt-10 pb-4 flex items-center justify-between bg-white sticky top-0 z-50 border-b border-gray-50 pt-safe">
      <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
       <ChevronLeft className="h-6 w-6 text-gray-800" />
      </button>
      <div>
        <h1 className="text-xl font-bold uppercase tracking-tight">Wallet</h1>
        {config?.paymentMode !== 'razorpay' && (
          <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest mt-0.5 flex items-center gap-1 animate-pulse">
            <Shield className="h-2 w-2" /> Secure Offline Mode
          </p>
        )}
      </div>
      <button onClick={() => setShowRecords(!showRecords)} className="text-gray-400 font-bold uppercase text-sm tracking-tight px-2 active:scale-95 transition-transform">
       {showRecords ? 'Close' : 'Record'}
      </button>
    </header>

    {showRecords ? (
     <div className="flex-1 p-6 space-y-4 animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar">
       <h2 className="text-sm font-bold uppercase text-gray-400 mb-6">Exchange History</h2>
       {isHistoryLoading ? (
        <div className="flex justify-center pt-20">
         <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
       ) : !exchangeHistory || exchangeHistory.length === 0 ? (
        <div className="py-40 text-center opacity-20 uppercase font-bold text-xs">No Records Found</div>
       ) : (
        exchangeHistory.map((record: any) => (
         <div key={record.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
           <p className="text-[10px] font-bold text-gray-400 uppercase">{record.timestamp ? format(record.timestamp.toDate(), 'MMM d, HH:mm') : 'Syncing...'}</p>
           <p className="font-bold text-sm uppercase text-gray-800">{record.type === 'exchange' ? 'Diamond Exchange' : 'Package Purchase'}</p>
           {record.diamondAmount && (
            <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase">
              <Gem className="h-3 w-3" />
              <span>-{record.diamondAmount.toLocaleString()} Diamonds</span>
            </div>
           )}
          </div>
          <div className="text-right">
           <div className="flex items-center gap-1.5 justify-end">
            <span className="font-bold text-green-600">+{record.coinAmount?.toLocaleString()}</span>
            <GoldCoinIcon className="h-4 w-4" />
           </div>
           <p className="text-[8px] font-bold text-green-600 uppercase tracking-wider mt-1">Completed</p>
          </div>
         </div>
        ))
       )}
     </div>
    ) : (
     <div className="flex-1 flex flex-col overflow-hidden">
      {/* Category Frequencies */}
      <div className="flex justify-around border-b border-gray-50 bg-white shrink-0">
        <button 
         onClick={() => setActiveTab('Coins')}
         className={cn(
          "py-4 px-8 text-lg font-bold uppercase tracking-tight relative transition-all",
          activeTab === 'Coins' ? "text-gray-900" : "text-gray-300"
         )}
        >
         Coins
         {activeTab === 'Coins' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-yellow-400 rounded-full" />}
        </button>
        <button 
         onClick={() => setActiveTab('Diamonds')}
         className={cn(
          "py-4 px-8 text-lg font-bold uppercase tracking-tight relative transition-all",
          activeTab === 'Diamonds' ? "text-gray-900" : "text-gray-300"
         )}
        >
         Diamonds
         {activeTab === 'Diamonds' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-yellow-400 rounded-full" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
        
        {activeTab === 'Coins' ? (
         <>
          {/* Main Balance Vibe Card - ULTRA GLOSSY */}
          <div className="relative h-40 w-full rounded-3xl bg-gradient-to-br from-[#ffd700] via-[#ff9800] to-[#f57c00] p-8 text-white shadow-[0_20px_40px_rgba(255,152,0,0.3)] overflow-hidden mb-4 group active:scale-[0.98] transition-all border-2 border-white/20">
           {/* Visual Shine Engine */}
           <div className="absolute inset-0 bg-white/30 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" style={{ animationDuration: '2s' }} />
           <div className="absolute inset-0 bg-white/10 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" style={{ animationDuration: '3s', animationDelay: '1s' }} />
           
           <div className="relative z-30 flex flex-col h-full justify-between">
             <div className="flex justify-between items-start">
              <p className="text-sm font-bold uppercase tracking-tight opacity-90">My Coins</p>
              <button onClick={() => setShowRecords(true)} className="bg-white/20 backdrop-blur-md pl-3 pr-1 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border border-white/10">
                History <ChevronRight className="h-3 w-3" />
              </button>
             </div>
             <h2 className="text-5xl font-bold tracking-tight drop-shadow-lg">
              {(userProfile?.wallet?.coins || 0).toLocaleString()}
             </h2>
           </div>
           {/* Sovereign Large Coin Visual */}
           <div className="absolute -bottom-6 -right-6 w-56 h-56 opacity-20 rotate-12 pointer-events-none group-hover:rotate-45 group-hover:scale-125 transition-all duration-1000">
             <GoldCoinIcon className="w-full h-full" />
           </div>
          </div>

          {/* Promotional Broadcast */}
          <div className="relative h-20 w-full rounded-2xl overflow-hidden mb-6 shadow-md border-2 border-red-100">
           <img 
            src="https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=1000" 
            className="w-full h-full object-cover brightness-75" 
            alt="Promo"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-red-600/80 to-transparent flex items-center px-6">
             <div className="flex flex-col">
              <span className="text-white font-bold uppercase text-xl tracking-tight">$1 = 800,000 coins</span>
              <span className="text-[8px] text-white/80 font-bold uppercase tracking-wider">01/03 - 12/03 23:59</span>
             </div>
           </div>
          </div>

          {/* Recharge Package Grid */}
          <div className="grid grid-cols-3 gap-3 mb-10">
           {COIN_PACKAGES.map((pkg) => (
            <button 
             key={pkg.id}
             onClick={() => setSelectedPackageId(pkg.id)}
             className={cn(
              "relative flex flex-col items-center justify-between rounded-2xl border-2 transition-all p-3 h-44 group",
              selectedPackageId === pkg.id 
               ? "bg-[#fffde7] border-yellow-400 shadow-lg scale-[1.02]" 
               : "bg-white border-gray-100 hover:border-gray-200"
             )}
            >
              <div className="w-14 h-14 mb-2 drop-shadow-sm group-hover:scale-110 transition-transform">
               <GoldCoinIcon className="w-full h-full" />
              </div>
              
              <div className="text-center flex-1 flex flex-col justify-center">
               <p className="font-bold text-[13px] tracking-tight leading-none text-gray-900">{pkg.amount}</p>
               {pkg.bonus && (
                <p className="text-[10px] font-bold text-[#ff9800] mt-1">{pkg.bonus}</p>
               )}
              </div>

              <div className={cn(
               "w-full py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
               selectedPackageId === pkg.id ? "bg-yellow-400 text-black" : "bg-gray-100 text-gray-400"
              )}>
               {pkg.price}
              </div>
            </button>
           ))}
          </div>
         </>
        ) : (
         <div className="space-y-6 animate-in fade-in duration-500">
          {/* Diamonds Balance Card - ULTRA GLOSSY */}
          <div className="relative h-40 w-full rounded-3xl bg-gradient-to-br from-[#00e5ff] via-[#0284c7] to-[#01579b] p-8 text-white shadow-[0_20px_40px_rgba(2,132,199,0.3)] overflow-hidden group active:scale-[0.98] transition-all border-2 border-white/20">
           {/* Visual Shine Engine */}
           <div className="absolute inset-0 bg-white/30 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" style={{ animationDuration: '2.5s' }} />
           <div className="absolute inset-0 bg-white/10 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />

           <div className="relative z-30 flex flex-col h-full justify-between">
             <div className="flex justify-between items-start">
              <p className="text-sm font-bold uppercase tracking-tight opacity-90">My Diamonds</p>
              <button onClick={() => setShowRecords(true)} className="bg-white/20 backdrop-blur-md pl-3 pr-1 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border border-white/10">
                History <ChevronRight className="h-3 w-3" />
              </button>
             </div>
             <h2 className="text-5xl font-bold tracking-tight drop-shadow-md">
              {(userProfile?.wallet?.diamonds || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
             </h2>
           </div>
           {/* Sovereign Large Diamond Visual */}
           <div className="absolute -bottom-6 -right-6 w-56 h-56 opacity-20 -rotate-12 group-hover:rotate-[-45deg] group-hover:scale-125 transition-all duration-1000">
             <Gem className="w-full h-full text-white fill-current" />
           </div>
          </div>

          {/* Exchange Interaction Portal */}
          <div className="p-1">
           <button 
            className="w-full bg-[#fffef0] border border-orange-100 rounded-3xl p-6 flex items-center justify-between shadow-sm group active:scale-[0.98] transition-all"
            onClick={() => router.push('/wallet/exchange')}
           >
             <div className="flex items-center gap-4">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
                <GoldCoinIcon className="h-full w-full relative z-10 drop-shadow-md" />
              </div>
              <span className="font-bold text-sm uppercase text-orange-900 tracking-tight">Exchange diamonds to coins</span>
             </div>
             <ChevronRight className="h-5 w-5 text-orange-200 group-hover:translate-x-1 transition-transform" />
           </button>
          </div>

          <div className="px-2 space-y-4 opacity-40">
           <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
            Conversion Rate: 1 Diamond = 100 Gold Coins
           </p>
          </div>
         </div>
        )}

        {/* Help Link Dimension */}
        <div className="space-y-4 px-2 pb-10 mt-6">
         <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
          If your recharge can not be completed, please click here for help
         </p>
         <button onClick={() => router.push('/help-center')} className="text-yellow-500 font-bold text-sm uppercase flex items-center gap-1">
           Help Center <ChevronRight className="h-4 w-4" />
         </button>
        </div>
      </div>

      {/* Bottom Sovereign Portal */}
      {!showRecords && (
       <footer className="p-6 pb-safe bg-white border-t border-gray-50 fixed bottom-0 left-0 right-0 z-50 md:relative">
         <Button 
          onClick={handleRechargeNow}
          disabled={isProcessing !== false}
          className="w-full h-16 rounded-full bg-[#ffcc00] hover:bg-[#ffb300] text-black font-bold uppercase text-xl shadow-xl shadow-yellow-500/20 active:scale-[0.98] transition-all"
         >
          {isProcessing !== false ? <Loader className="animate-spin mr-2" /> : activeTab === 'Coins' ? 'Recharge Now' : 'Withdrawal'}
         </Button>
       </footer>
      )}
     </div>
    )}
   </div>
   <Dialog open={isOfflineDialogOpen} onOpenChange={setIsOfflineDialogOpen}>
    <DialogContent className="sm:max-w-md bg-white border-none rounded-[2rem] p-6 shadow-2xl font-sans">
     <DialogHeader>
      <DialogTitle className="text-xl font-bold uppercase tracking-tight text-center">Offline Recharge</DialogTitle>
      <DialogDescription className="text-center text-[10px] font-bold uppercase text-gray-400">Scan & Pay via UPI</DialogDescription>
     </DialogHeader>
     <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative w-48 h-48 bg-gray-50 rounded-2xl border-2 border-gray-100 p-2 overflow-hidden flex items-center justify-center">
       {/* Use Global App Config QR if available, else placeholder */}
       {config?.paymentQrUrl ? (
        <Image src={config.paymentQrUrl} fill className="object-contain" alt="Payment QR" unoptimized />
       ) : (
        <div className="text-center p-4">
         <Shield className="h-8 w-8 mx-auto text-gray-200 mb-2" />
         <p className="text-[8px] font-bold text-gray-300 uppercase leading-tight">Admin QR Syncing...</p>
        </div>
       )}
      </div>
      
      <div className="w-full space-y-4">
       <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
        <p className="text-[10px] font-bold text-yellow-700 uppercase mb-1">Package Selected</p>
        <p className="text-sm font-bold text-gray-900">{COIN_PACKAGES.find(p => p.id === selectedPackageId)?.amount} Coins for {COIN_PACKAGES.find(p => p.id === selectedPackageId)?.price}</p>
       </div>

       <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Transaction ID / UTR Number</label>
        <Input 
         value={utrNumber}
         onChange={(e) => setUtrNumber(e.target.value)}
         placeholder="Enter 12-digit UTR No."
         className="h-12 bg-gray-50 border-gray-100 rounded-xl font-bold text-center"
        />
       </div>

       <Button 
        onClick={handleSubmitManualRecharge}
        disabled={isSubmittingManual}
        className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-black font-bold uppercase rounded-xl shadow-lg shadow-yellow-500/20"
       >
        {isSubmittingManual ? <Loader className="animate-spin" /> : 'Confirm Payment'}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
  </AppLayout>
 );
}
