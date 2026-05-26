'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { GoldCoinIcon, UmmyLogoIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Loader, Info, Gem, ArrowRightLeft, Shield, CheckCircle2, ShieldAlert, Download, ExternalLink } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { createOrderAction, verifyPaymentAction, createCashfreeOrderAction, verifyCashfreeOrderAction } from '@/actions/payments';
import Script from 'next/script';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

declare global {
 interface Window {
  Razorpay: any;
 }
}

const CASHFREE_MODE = process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox";

const COIN_PACKAGES = [
 { id: 'p1', amount: '50,000', price: '10', bonus: null },
 { id: 'p2', amount: '500,000', price: '100', bonus: null },
 { id: 'p3', amount: '2,500,000', price: '500', bonus: '+250000' }, 
 { id: 'p4', amount: '5,000,000', price: '1000', bonus: '+750000' },
 { id: 'p5', amount: '12,500,000', price: '2500', bonus: '+2500000' },
 { id: 'p6', amount: '50,000,000', price: '10000', bonus: '+13500000' },
];

// Diamond exchange packages define kiye
const DIAMOND_EXCHANGE_PACKAGES = [
  { id: 'd1', diamonds: 100, coins: 33 },
  { id: 'd2', diamonds: 1000000, coins: 330000 },
  { id: 'd3', diamonds: 5000000, coins: 1650000 },
  { id: 'd4', diamonds: 50000000, coins: 16500000 },
  { id: 'd5', diamonds: 90000000, coins: 29700000 },
];

export const dynamic = 'force-dynamic';

function WalletContent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'Coins' | 'Diamonds'>('Coins');
  const [showRecords, setShowRecords] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('p1');
  const [selectedVisualGateway, setSelectedVisualGateway] = useState('phonepe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineDialogOpen, setIsOfflineDialogOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order_id');
  const [isVerifyingOrder, setIsVerifyingOrder] = useState(false);
  // Selected diamond package track karne ke liye
  const [selectedDiamondId, setSelectedDiamondId] = useState('d1');

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

 const rechargeRequestsQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(
   collection(firestore, 'rechargeRequests'),
   where('uid', '==', user.uid),
   orderBy('createdAt', 'desc'),
   limit(10)
  );
 }, [firestore, user]);

 const { data: rechargeHistory, isLoading: isRechargeHistoryLoading } = useCollection(rechargeRequestsQuery);

  const unifiedHistory = useMemo(() => {
    const list = [
      ...(exchangeHistory || []).map((h: any) => ({ ...h, historyType: 'exchange' })),
      ...(rechargeHistory || []).map((h: any) => ({ ...h, historyType: 'recharge' }))
    ];
    return list.sort((a, b) => {
      const timeA = a.timestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
      const timeB = b.timestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
      return timeB.getTime() - timeA.getTime();
    });
  }, [exchangeHistory, rechargeHistory]);

  useEffect(() => {
    const autoVerifyCashfree = async () => {
      if (!orderIdParam || !user || !firestore || isVerifyingOrder) return;
      
      setIsVerifyingOrder(true);
      setIsProcessing(true);
      
      try {
        const verification = await verifyCashfreeOrderAction(orderIdParam);
        if (verification.success && verification.order_amount) {
           const amountPaid = verification.order_amount;
           const pkg = COIN_PACKAGES.find(p => parseInt(p.price) === amountPaid);
           
           let totalGain = amountPaid * 5000;
           if (pkg) {
             const amountValue = parseInt(pkg.amount.replace(/,/g, ''));
             const bonusValue = pkg.bonus ? parseInt(pkg.bonus.replace('+', '')) : 0;
             totalGain = amountValue + bonusValue;
           } else if (amountPaid === 1) {
             totalGain = 10000 + 200;
           }

           const userRef = doc(firestore, 'users', user.uid);
           const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
           
           await updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
           await updateDocumentNonBlocking(profileRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
           
           const historyRef = collection(firestore, 'users', user.uid, 'diamondExchanges');
           await addDoc(historyRef, {
             type: 'purchase',
             coinAmount: totalGain,
             provider: 'cashfree',
             orderId: orderIdParam,
             amountPaid: amountPaid,
             timestamp: serverTimestamp()
           });

           toast({ title: 'Recharge Successful', description: `Synchronized ${totalGain.toLocaleString()} Coins from Cashfree order.` });
           router.replace('/wallet');
        }
      } catch (e) {
        console.error('[Wallet][AutoVerify] Error:', e);
      } finally {
        setIsVerifyingOrder(false);
        setIsProcessing(false);
      }
    };

    if (orderIdParam && user) {
      autoVerifyCashfree();
    }
  }, [orderIdParam, user, firestore, router, isVerifyingOrder, toast]);

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
     name: 'Ummy Chat',
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
      
      toast({ title: 'Recharge Successful', description: `Synchronized ${totalGain.toLocaleString()} Coins to your vault.` });
      setIsProcessing(false);
     },
     prefill: {
      name: user.displayName || '',
      email: user.email || '',
     },
     theme: {
      color: '#651FFF',
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

  const handleCashfreeRecharge = async () => {
    if (!user || !firestore) return;
    const pkg = COIN_PACKAGES.find(p => p.id === selectedPackageId);
    if (!pkg) return;

    const priceINR = parseInt(pkg.price.split(' ')[0]);
    if (isNaN(priceINR)) return;

    setIsProcessing(true);

    try {
      const order = await createCashfreeOrderAction(priceINR, {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email || ''
      });

      if (!order.success) {
        toast({ variant: 'destructive', title: 'Order Failed', description: order.error });
        setIsProcessing(false);
        return;
      }

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({
        mode: CASHFREE_MODE === 'production' ? "production" : "sandbox"
      });

      let checkoutOptions = {
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_modal",
      };

      await cashfree.checkout(checkoutOptions);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('[Cashfree Error]', err);
      toast({ variant: 'destructive', title: 'Payment Interruption', description: 'Could not connect to Cashfree Gateway.' });
      setIsProcessing(false);
    }
  };

  const handleUPIIntentRecharge = () => {
    const pkg = COIN_PACKAGES.find(p => p.id === selectedPackageId);
    if (!pkg) return;

    const priceINR = parseInt(pkg.price.split(' ')[0]);
    const upiId = config?.upiId || "7209741932@ptyes";
    const upiName = config?.upiName || "Ummy Chat";
    
    const formattedAmount = Number(priceINR).toFixed(2);
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Recharge ${pkg.amount} Coins`)}`;
    
    try {
      window.open(upiUri, '_system');
    } catch (e) {
      const link = document.createElement('a');
      link.href = upiUri;
      link.click();
    }
    
    setTimeout(() => {
      setIsOfflineDialogOpen(true);
    }, 1500);
  };

  const handleRechargeNow = async () => {
   if (!user || !firestore) return;
   
   if (config?.paymentMode === 'razorpay') {
     handleRazorpayRecharge();
   } else if (config?.paymentMode === 'cashfree') {
     handleCashfreeRecharge();
   } else if (config?.paymentMode === 'upi_intent') {
     handleUPIIntentRecharge();
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
    setShowSubmissionSuccess(true);
    setUtrNumber('');
   } catch (error) {
    console.error('Manual recharge error', error);
    toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not send request.' });
   } finally {
    setIsSubmittingManual(false);
   }
  };

  const handleDownloadQR = () => {
    if (!config?.paymentQrUrl) return;
    const link = document.createElement('a');
    link.href = config.paymentQrUrl;
    link.download = `ummy_recharge_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Image Download Started", description: "You can now scan this from your gallery." });
  };

  const activePackage = COIN_PACKAGES.find(p => p.id === selectedPackageId);
  const displayPriceINR = activePackage ? parseInt(activePackage.price.split(' ')[0]) : 0;

  // Coin value size auto adjust karne ka function
  const getCoinFontSize = (coins: number) => {
    const length = coins.toLocaleString().length;
    if (length <= 4) return 'text-[40px]';
    if (length <= 6) return 'text-[34px]';
    if (length <= 8) return 'text-[28px]';
    if (length <= 10) return 'text-[24px]';
    return 'text-[20px]';
  };

  // Diamond value size auto adjust karne ka function
  const getDiamondFontSize = (diamonds: number) => {
    const length = Math.floor(diamonds).toLocaleString().length;
    if (length <= 4) return 'text-[40px]';
    if (length <= 6) return 'text-[34px]';
    if (length <= 8) return 'text-[28px]';
    if (length <= 10) return 'text-[24px]';
    return 'text-[20px]';
  };

  if (isUserLoading || isProfileLoading) {
   return (
     <div className="flex h-[80vh] items-center justify-center bg-white">
      <Loader className="animate-spin text-primary h-8 w-8" />
     </div>
   );
  }

  if (!user) return null;

  return (
    <>
     <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
     <div className="min-h-full bg-white font-sans flex flex-col animate-in fade-in duration-700">
      
      {/* HEADER */}
      <header className="px-4 pt-10 pb-4 flex items-center justify-between bg-white sticky top-0 z-50 pt-safe">
        <button onClick={() => router.back()} className="p-2 -ml-2 active:scale-95 transition-all">
         <ChevronLeft className="h-6 w-6 text-black" strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-bold text-black tracking-tight">
          {activeTab === 'Diamonds' ? 'Diamond Exchange' : 'Top-up coins'}
        </h1>
        <button onClick={() => setShowRecords(!showRecords)} className="text-black text-[15px] font-medium px-2 active:scale-95 transition-transform">
         {showRecords ? 'Close' : 'Records'}
        </button>
      </header>

      {showRecords ? (
       <div className="flex-1 p-6 space-y-4 animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar">
         <h2 className="text-sm font-bold uppercase text-gray-400 mb-6">Unified Ledger</h2>
         {isHistoryLoading || isRechargeHistoryLoading ? (
          <div className="flex justify-center pt-20">
           <Loader className="animate-spin text-primary h-8 w-8" />
          </div>
         ) : !unifiedHistory || unifiedHistory.length === 0 ? (
          <div className="py-40 text-center opacity-20 uppercase font-bold text-xs">No Records Found</div>
         ) : (
          unifiedHistory.map((record: any) => (
           <div key={record.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
             <p className="text-[10px] font-bold text-gray-400 uppercase">
               {record.historyType === 'exchange' 
                 ? (record.timestamp ? format(record.timestamp.toDate(), 'MMM d, HH:mm') : 'Syncing...')
                 : (record.createdAt ? format(record.createdAt.toDate(), 'MMM d, HH:mm') : 'Syncing...')
               }
             </p>
             <p className="font-bold text-sm uppercase text-gray-800">
               {record.historyType === 'exchange' 
                 ? (record.type === 'exchange' ? 'Diamond Exchange' : 'Package Purchase')
                 : 'Manual Recharge'
               }
             </p>
             {record.historyType === 'exchange' ? (
               record.diamondAmount && (
                 <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase">
                   <Gem className="h-3 w-3" />
                   <span>-{record.diamondAmount.toLocaleString()} Diamonds</span>
                 </div>
               )
             ) : (
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">UTR: {record.utrNumber}</p>
             )}
            </div>
            <div className="text-right">
             <div className="flex items-center gap-1.5 justify-end">
              <span className="font-bold text-green-600">+{record.coinAmount?.toLocaleString() || (record.coins + (record.bonus || 0)).toLocaleString()}</span>
              <GoldCoinIcon className="h-4 w-4" />
             </div>
             {record.historyType === 'exchange' ? (
               <p className="text-[8px] font-bold text-green-600 uppercase tracking-wider mt-1">Completed</p>
             ) : (
               <div className={cn(
                 "text-[8px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full inline-block",
                 record.status === 'approved' ? "bg-green-100 text-green-600" :
                 record.status === 'rejected' ? "bg-red-100 text-red-600" :
                 "bg-amber-100 text-amber-600 animate-pulse"
               )}>
                 {record.status}
               </div>
             )}
            </div>
           </div>
          ))
         )}
       </div>
      ) : (
       <div className="flex-1 flex flex-col overflow-hidden bg-white">
        
        {/* YELLOW BALANCE CARD - Sirf Coins tab mein dikhega */}
        {activeTab === 'Coins' && (
          <div className="px-4 mt-2">
              <div className="w-full rounded-[1.25rem] bg-[#ffc107] px-6 py-8 relative shadow-sm">
                  <div className="absolute top-4 right-4 bg-white/40 px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer">
                      <span className="text-[13px] font-medium text-black">Coins details</span>
                      <ChevronRight className="h-4 w-4 text-black" />
                  </div>
                  <div className="mt-2">
                      <h2 className={`font-bold text-black tracking-tight leading-none mb-2 transition-all duration-300 ${getCoinFontSize(userProfile?.wallet?.coins || 0)}`}>
                          {(userProfile?.wallet?.coins || 0).toLocaleString()}
                      </h2>
                      <p className="text-gray-800 font-medium text-sm">Remaining coins</p>
                  </div>
              </div>
          </div>
        )}

        {/* BLUE DIAMOND BALANCE CARD - Sirf Diamonds tab mein dikhega */}
        {activeTab === 'Diamonds' && (
          <div className="px-4 mt-2">
              <div className="w-full rounded-[1.25rem] bg-gradient-to-br from-[#00e5ff] via-[#0284c7] to-[#01579b] px-6 py-8 relative shadow-sm">
                  <div className="absolute top-4 right-4 bg-white/40 px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer">
                      <span className="text-[13px] font-medium text-white">Diamond details</span>
                      <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                  <div className="mt-2">
                      <h2 className={`font-bold text-white tracking-tight leading-none mb-2 transition-all duration-300 ${getDiamondFontSize(userProfile?.wallet?.diamonds || 0)}`}>
                          {(userProfile?.wallet?.diamonds || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </h2>
                      <p className="text-white/80 font-medium text-sm">Remaining diamonds</p>
                  </div>
              </div>
          </div>
        )}

        {/* TABS - Dono tabs mein dikhega ab */}
        <div className="flex px-4 gap-6 mt-6 border-b border-gray-100/50">
            <button 
                onClick={() => setActiveTab('Coins')}
                className={cn(
                    "pb-3 text-[17px] relative transition-all",
                    activeTab === 'Coins' ? "font-bold text-black" : "font-medium text-gray-400"
                )}
            >
                Recharge
                {activeTab === 'Coins' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
            </button>
            <button 
                onClick={() => setActiveTab('Diamonds')}
                className={cn(
                    "pb-3 text-[17px] relative transition-all",
                    activeTab === 'Diamonds' ? "font-bold text-black" : "font-medium text-gray-400"
                )}
            >
                Exchange
                {activeTab === 'Diamonds' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
            </button>
            <button className="pb-3 text-[17px] font-medium text-gray-400">
                Agent
            </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-10">
          
          {activeTab === 'Coins' ? (
           <>
            {/* PAYMENT METHODS GRID */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {/* PhonePe */}
                <button 
                    onClick={() => setSelectedVisualGateway('phonepe')}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                        selectedVisualGateway === 'phonepe' 
                        ? "bg-[#fffde7] border-[#ffc107]" 
                        : "bg-[#f8f9fa] border-transparent"
                    )}
                >
                    <div className="bg-white h-7 w-7 rounded-full flex items-center justify-center p-1.5 shadow-sm">
                        <span className="text-[#6739B7] font-bold text-lg leading-none">पे</span>
                    </div>
                    <span className="font-bold text-black text-[15px]">PhonePe</span>
                </button>

                {/* Google Pay */}
                <button 
                    onClick={() => setSelectedVisualGateway('gpay')}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                        selectedVisualGateway === 'gpay' 
                        ? "bg-[#fffde7] border-[#ffc107]" 
                        : "bg-[#f8f9fa] border-transparent"
                    )}
                >
                    <div className="flex items-center">
                       <span className="text-[#4285F4] font-bold text-lg">G</span>
                       <span className="text-[#EA4335] font-bold text-lg">o</span>
                       <span className="text-[#FBBC05] font-bold text-lg">o</span>
                       <span className="text-[#34A853] font-bold text-lg">g</span>
                       <span className="text-[#4285F4] font-bold text-lg">l</span>
                       <span className="text-[#EA4335] font-bold text-lg">e</span>
                    </div>
                    <span className="font-bold text-black text-[15px] ml-1">Pay</span>
                </button>

                {/* Paytm */}
                <button 
                    onClick={() => setSelectedVisualGateway('paytm')}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                        selectedVisualGateway === 'paytm' 
                        ? "bg-[#fffde7] border-[#ffc107]" 
                        : "bg-[#f8f9fa] border-transparent"
                    )}
                >
                    <span className="text-[#002E6E] font-bold text-[17px] tracking-tight">pay<span className="text-[#00BAF2]">tm</span></span>
                    <span className="font-bold text-black text-[15px] ml-1">Paytm</span>
                </button>

                {/* Official Recharge */}
                <button 
                    onClick={() => setSelectedVisualGateway('official')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-3 rounded-2xl border transition-all",
                        selectedVisualGateway === 'official' 
                        ? "bg-[#fffde7] border-[#ffc107]" 
                        : "bg-[#f8f9fa] border-transparent"
                    )}
                >
                    <div className="border-[1.5px] border-black rounded-[4px] px-1 py-[2px] h-5 flex items-center justify-center">
                        <div className="h-0.5 w-3 bg-black"></div>
                    </div>
                    <span className="font-bold text-black text-[14px] leading-tight text-left">Official<br/>Recharge</span>
                </button>
            </div>

            {/* COIN PACKAGES */}
            <div className="grid grid-cols-3 gap-3 mb-8">
             {COIN_PACKAGES.map((pkg) => {
              const priceNum = parseInt(pkg.price.split(' ')[0]);
              return (
              <button 
               key={pkg.id}
               onClick={() => setSelectedPackageId(pkg.id)}
               className={cn(
                "flex flex-col items-center justify-center rounded-2xl border-[1.5px] py-4 transition-all",
                selectedPackageId === pkg.id 
                 ? "bg-[#fffde7] border-[#ffc107]" 
                 : "bg-[#f8f9fa] border-transparent"
               )}
              >
                <p className="font-bold text-[17px] text-black leading-tight">{pkg.amount}</p>
                <p className="font-bold text-[15px] text-gray-800 mt-1">₹{priceNum}</p>
              </button>
             )})}
            </div>

            {/* PAY BUTTON & FOOTER */}
            <div className="px-1 mt-auto">
                <Button 
                    onClick={handleRechargeNow}
                    disabled={isProcessing !== false}
                    className="w-full h-[52px] rounded-2xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium text-[17px] transition-all"
                >
                    {isProcessing !== false ? <Loader className="animate-spin" /> : `Pay ₹${displayPriceINR}`}
                </Button>

                <div className="text-center mt-6">
                    <p className="text-[#7c3aed] text-[15px] font-medium tracking-wide">
                        <span className="opacity-50">»</span> Top up customer service <span className="opacity-50">«</span>
                    </p>
                </div>
            </div>
           </>
          ) : (
           // EXCHANGE TAB - Diamond exchange packages dikhane hain
           <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* DIAMOND EXCHANGE PACKAGES GRID - 3 columns, 2 rows */}
            <div className="grid grid-cols-3 gap-3">
              {DIAMOND_EXCHANGE_PACKAGES.map((pkg) => (
                <button 
                  key={pkg.id}
                  onClick={() => setSelectedDiamondId(pkg.id)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border-[1.5px] py-4 px-2 transition-all",
                    selectedDiamondId === pkg.id 
                      ? "bg-[#e3f2fd] border-[#0284c7]" 
                      : "bg-[#f8f9fa] border-transparent"
                  )}
                >
                  {/* First row - Diamond icon and value */}
                  <div className="flex items-center gap-1 mb-1">
                    <Gem className="h-4 w-4 text-[#0284c7]" />
                    <p className="font-bold text-[15px] text-black leading-tight">
                      {pkg.diamonds.toLocaleString()}
                    </p>
                  </div>
                  {/* Second row - Coins icon and value */}
                  <div className="flex items-center gap-1">
                    <GoldCoinIcon className="h-4 w-4" />
                    <p className="font-bold text-[13px] text-gray-600 leading-tight">
                      {pkg.coins.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}

              {/* Custom Amount Card - 6th card */}
              <button 
                onClick={() => setSelectedDiamondId('custom')}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border-[1.5px] py-4 transition-all",
                  selectedDiamondId === 'custom' 
                    ? "bg-[#e3f2fd] border-[#0284c7]" 
                    : "bg-[#f8f9fa] border-transparent"
                )}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Gem className="h-4 w-4 text-[#0284c7]" />
                  <p className="font-bold text-[15px] text-black leading-tight">Custom</p>
                </div>
                <div className="flex items-center gap-1">
                  <GoldCoinIcon className="h-4 w-4" />
                  <p className="font-bold text-[13px] text-gray-600 leading-tight">Amount</p>
                </div>
              </button>
            </div>

            {/* EXCHANGE BUTTON & FOOTER - Pay ki jagah Exchange likha hai */}
            <div className="px-1 mt-auto">
                <Button 
                    className="w-full h-[52px] rounded-2xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium text-[17px] transition-all"
                >
                    Exchange
                </Button>

                <div className="text-center mt-6">
                    <p className="text-[#7c3aed] text-[15px] font-medium tracking-wide">
                        <span className="opacity-50">»</span> Top up customer service <span className="opacity-50">«</span>
                    </p>
                </div>
            </div>
           </div>
          )}
        </div>
       </div>
      )}
     </div>

    {/* OFFLINE DIALOG - unchanged */}
    <Dialog open={isOfflineDialogOpen} onOpenChange={setIsOfflineDialogOpen}>
     <DialogContent className="sm:max-w-full md:max-w-xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl font-sans overflow-hidden">
      <div className="flex flex-col max-h-[95vh] overflow-y-auto no-scrollbar">
        
        <div className="bg-amber-400 py-4 px-4 flex items-center justify-center gap-2 shrink-0 pt-safe shadow-md">
           <ShieldAlert className="h-4 w-4 text-black" />
           <p className="text-[10px] font-black uppercase text-black tracking-tight leading-none pt-0.5">Online Recharge Unavailable • Use Manual Scanner Below</p>
        </div>

        <div className="p-6 pb-2 text-center shrink-0">
           <div className="inline-flex items-center gap-2 mb-1">
             <UmmyLogoIcon className="h-5 w-5" />
             <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest leading-none">Official Payment Node</span>
           </div>
        </div>

        <div className="relative flex flex-col items-center justify-center px-10 py-6 bg-white shrink-0">
          <div className="absolute inset-x-8 inset-y-0 pointer-events-none">
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-slate-900 rounded-tl-2xl opacity-80" />
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-slate-900 rounded-tr-2xl opacity-80" />
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-slate-900 rounded-bl-2xl opacity-80" />
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-slate-900 rounded-br-2xl opacity-80" />
          </div>

          <div className="relative w-64 h-64 bg-white p-2 flex flex-col group items-center justify-center">
            {config?.paymentQrUrl ? (
              <div className="w-full h-full relative cursor-pointer" onClick={handleDownloadQR}>
                <Image src={config.paymentQrUrl} fill className="object-contain" alt="QR" unoptimized priority />
              </div>
            ) : (
              <Loader className="h-10 w-10 animate-spin text-slate-200" />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 py-4 shrink-0">
           <div className="bg-blue-50 px-4 py-2.5 rounded-2xl border border-blue-100 flex items-center gap-3 w-full justify-between active:scale-95 transition-all">
              <div className="flex items-center gap-2 overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-3 md:h-4 opacity-70 shrink-0" />
                <p className="text-sm font-black text-blue-600 truncate uppercase tracking-tighter">{config?.upiId || '7209741932@ptyes'}</p>
              </div>
              <Button onClick={handleDownloadQR} size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 text-blue-600">
                <Download className="h-4 w-4" />
              </Button>
           </div>
           <Button onClick={handleDownloadQR} variant="link" className="text-[10px] font-black text-slate-400 uppercase tracking-widest h-auto py-0">Click QR to download image</Button>
        </div>

        {config?.paymentMode === 'upi_intent' && (
           <div className="px-6 pb-2">
             <Button 
               onClick={handleUPIIntentRecharge}
               className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase rounded-2xl shadow-lg flex items-center justify-center gap-2 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
             >
               <ExternalLink className="h-5 w-5" /> Open GPay / PhonePe / Paytm
             </Button>
             <p className="text-[8px] text-center font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">Automatic trigger failed? Click button above</p>
           </div>
        )}

        <div className="p-4 bg-slate-50 border-y border-slate-100 shrink-0">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-purple-600 border-b border-purple-100 w-fit">Hindi Steps</p>
                 <p className="text-[9px] font-bold text-slate-500 leading-tight">1. QR स्कैन करें 2. भुगतान करें 3. UTR आईडी भरें</p>
              </div>
              <div className="space-y-1 text-right">
                 <p className="text-[9px] font-black uppercase text-blue-600 border-b border-blue-100 w-fit ml-auto">English Steps</p>
                 <p className="text-[9px] font-bold text-slate-500 leading-tight">1. Scan QR 2. Make Payment 3. Submit UTR</p>
              </div>
           </div>
        </div>

        <div className="px-6 pb-10 pt-6 bg-white">
          {showSubmissionSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold uppercase text-slate-900 leading-tight">Sync Complete</h2>
              <Button onClick={() => { setIsOfflineDialogOpen(false); setShowSubmissionSuccess(false); setShowRecords(true); }}
                className="w-full h-14 bg-black text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl" >View Records</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Total Payable</p>
                   <p className="text-2xl font-black text-slate-900">{COIN_PACKAGES.find(p => p.id === selectedPackageId)?.price}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Gain</p>
                   <p className="text-lg font-black text-yellow-600">{COIN_PACKAGES.find(p => p.id === selectedPackageId)?.amount} + Bonus</p>
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  value={utrNumber || ''}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="ENTER 12-DIGIT UTR ID"
                  className="h-16 bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white rounded-2xl font-black text-center text-xl tracking-[0.2em] transition-all shadow-inner"
                />
              </div>

              <Button onClick={handleSubmitManualRecharge} disabled={isSubmittingManual}
                className="w-full h-18 bg-[#651FFF] hover:bg-[#6200EA] text-white font-black uppercase rounded-2xl shadow-xl shadow-purple-500/20 text-lg border-b-4 border-purple-900" >
                {isSubmittingManual ? <Loader className="animate-spin" /> : 'Confirm Payment'}
              </Button>
            </div>
          )}
        </div>
      </div>
     </DialogContent>
    </Dialog>

    <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
   </>
  );
}

export default function WalletPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex h-[80vh] items-center justify-center bg-white">
          <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
      }>
        <WalletContent />
      </Suspense>
    </AppLayout>
  );
          }
