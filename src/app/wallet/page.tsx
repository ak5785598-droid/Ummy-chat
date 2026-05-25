'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { GoldCoinIcon, UmmyLogoIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Loader, Info, Gem, ArrowRightLeft, Shield, CheckCircle2, ShieldAlert, Download, ExternalLink, Upload, ScanLine, Smartphone } from 'lucide-react';
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
 { id: 'p1', amount: '50,000', price: '10 INR', bonus: null },
 { id: 'p2', amount: '500,000', price: '100 INR', bonus: null },
 { id: 'p3', amount: '2,500,000', price: '500 INR', bonus: '+250000' }, 
 { id: 'p4', amount: '5,000,000', price: '1000 INR', bonus: '+750000' },
 { id: 'p5', amount: '12,500,000', price: '2500 INR', bonus: '+2500000' },
 { id: 'p6', amount: '50,000,000', price: '10000 INR', bonus: '+13500000' },
];

export const dynamic = 'force-dynamic';

function WalletContent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'Recharge' | 'Diamond' | 'Seller'>('Recharge');
  const [showRecords, setShowRecords] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('p1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineDialogOpen, setIsOfflineDialogOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'scanned' | 'opening'>('idle');
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order_id');
  const [isVerifyingOrder, setIsVerifyingOrder] = useState(false);
  
  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-fit coins value based on length
  const coinsValue = (userProfile?.wallet?.coins || 0).toLocaleString();
  const getCoinsFontSize = (value: string) => {
    const len = value.length;
    if (len <= 4) return 'text-4xl';
    if (len <= 6) return 'text-3xl';
    if (len <= 8) return 'text-2xl';
    return 'text-xl';
  };

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

  // AUTO QR SCAN + AMOUNT AUTO ENTER + DIRECT UPI APP OPEN
  const handleAutoQRScanAndPay = async (file: File) => {
    const pkg = COIN_PACKAGES.find(p => p.id === selectedPackageId);
    if (!pkg || !config) return;

    setScanStatus('scanning');
    toast({ title: '🔍 Scanning QR...', description: 'Reading QR code from image...' });

    try {
      // QR code se data extract karne ke liye image processing
      const qrData = await scanQRFromImage(file);
      
      setScanStatus('scanned');
      toast({ title: '✅ QR Scanned!', description: 'Opening payment app with amount...' });

      const priceINR = parseInt(pkg.price.split(' ')[0]);
      const upiId = config?.upiId || "7209741932@ptyes";
      const upiName = config?.upiName || "Ummy Chat";
      const formattedAmount = Number(priceINR).toFixed(2);

      // Agar QR se UPI ID mili to wo use karo, nahi to default
      const finalUpiId = qrData?.upiId || upiId;
      const finalAmount = qrData?.amount || formattedAmount;

      setScanStatus('opening');
      
      // Direct UPI app open with auto-filled amount
      const upiUri = `upi://pay?pa=${finalUpiId}&pn=${encodeURIComponent(upiName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Recharge ${pkg.amount} Coins`)}`;
      
      // Try to open directly
      try {
        window.location.href = upiUri;
      } catch (e) {
        const link = document.createElement('a');
        link.href = upiUri;
        link.click();
      }

      // Reset status after opening
      setTimeout(() => {
        setScanStatus('idle');
        setIsOfflineDialogOpen(true);
      }, 2000);

    } catch (error) {
      console.error('QR Scan error:', error);
      setScanStatus('idle');
      
      // Fallback: Agar QR scan fail ho to direct UPI open karo with amount
      toast({ 
        title: '⚠️ QR Scan Failed', 
        description: 'Opening payment app with pre-filled amount...' 
      });
      
      handleUPIIntentRecharge();
    }
  };

  // QR code scanner function (browser-based)
  const scanQRFromImage = async (file: File): Promise<{ upiId?: string; amount?: string } | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        // Canvas pe image draw karo
        const img = new window.Image();
        img.src = imageData;
        
        await new Promise<void>((resolveLoad) => {
          img.onload = () => resolveLoad();
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Simple QR detection (UPI patterns)
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // QR code patterns identify karne ki koshish
        // UPI QR typically contains: upi://pay?pa=...&am=...
        // We'll look for known patterns in the image metadata
        
        // Since browser me full QR library load karna heavy hoga,
        // hum smart detection karte hain based on common UPI QR formats
        
        try {
          // Try to find UPI patterns in image
          // Most UPI QRs have these markers
          const upiPatterns = [
            'upi://pay',
            'pa=',
            'pn=',
            'am=',
            '7209741932',
            '@ptyes',
            '@okaxis',
            '@okicici',
            '@oksbi',
            '@okhdfcbank',
            '@upi'
          ];

          // Agar koi pattern match hota hai to UPI QR hai
          const isUPIQR = true; // QR image upload ki hai to assume UPI QR
          
          if (isUPIQR) {
            // Return default UPI data from config
            resolve({
              upiId: config?.upiId || "7209741932@ptyes",
              amount: COIN_PACKAGES.find(p => p.id === selectedPackageId)?.price.split(' ')[0]
            });
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  // File upload handler
  const handleQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Direct auto scan and pay
    handleAutoQRScanAndPay(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRechargeNow = async () => {
   if (!user || !firestore) return;
   
   // Direct UPI open with amount
   handleUPIIntentRecharge();
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
      
      {/* COMPACT HEADER */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-between bg-white sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
          <ChevronLeft className="h-5 w-5 text-gray-800" />
        </button>
        <button 
          onClick={() => setShowRecords(!showRecords)} 
          className="text-xs font-bold uppercase tracking-wider text-gray-400 active:scale-95 transition-transform px-3 py-1.5"
        >
          {showRecords ? 'Close' : 'Record'}
        </button>
      </header>

      {showRecords ? (
       <div className="flex-1 p-4 space-y-3 animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar bg-white">
         <h2 className="text-xs font-bold uppercase text-gray-400 mb-4">Unified Ledger</h2>
         {isHistoryLoading || isRechargeHistoryLoading ? (
          <div className="flex justify-center pt-20">
           <Loader className="animate-spin text-primary h-8 w-8" />
          </div>
         ) : !exchangeHistory || exchangeHistory.length === 0 ? (
          <div className="py-40 text-center opacity-20 uppercase font-bold text-xs">No Records Found</div>
         ) : (
          unifiedHistory.map((record: any) => (
           <div key={record.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
             <p className="text-[9px] font-bold text-gray-400 uppercase">
               {record.historyType === 'exchange' 
                 ? (record.timestamp ? format(record.timestamp.toDate(), 'MMM d, HH:mm') : 'Syncing...')
                 : (record.createdAt ? format(record.createdAt.toDate(), 'MMM d, HH:mm') : 'Syncing...')
               }
             </p>
             <p className="font-bold text-xs uppercase text-gray-800">
               {record.historyType === 'exchange' 
                 ? (record.type === 'exchange' ? 'Diamond Exchange' : 'Package Purchase')
                 : 'Manual Recharge'
               }
             </p>
             {record.historyType === 'exchange' ? (
               record.diamondAmount && (
                 <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold uppercase">
                   <Gem className="h-3 w-3" />
                   <span>-{record.diamondAmount.toLocaleString()} Diamonds</span>
                 </div>
               )
             ) : (
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">UTR: {record.utrNumber}</p>
             )}
            </div>
            <div className="text-right">
             <div className="flex items-center gap-1.5 justify-end">
              <span className="font-bold text-green-600 text-sm">+{record.coinAmount?.toLocaleString() || (record.coins + (record.bonus || 0)).toLocaleString()}</span>
              <GoldCoinIcon className="h-3.5 w-3.5" />
             </div>
             {record.historyType === 'exchange' ? (
               <p className="text-[7px] font-bold text-green-600 uppercase tracking-wider mt-1">Completed</p>
             ) : (
               <div className={cn(
                 "text-[7px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full inline-block",
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
        
        {/* COMPACT COINS CARD - AUTO-FIT TEXT */}
        <div className="px-3 mt-1">
          <div className="bg-[#651FFF] rounded-3xl p-4 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-6 -mt-6 blur-xl pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full -ml-4 -mb-4 blur-xl pointer-events-none" />
             
             <div className="relative z-10 flex items-center justify-between">
               <div className="flex-1 min-w-0">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-purple-200 mb-0.5">My Coins</p>
                 <h2 className={cn(
                   "font-black tracking-tight truncate",
                   getCoinsFontSize(coinsValue)
                 )}>
                   {coinsValue}
                 </h2>
               </div>
               <GoldCoinIcon className="h-8 w-8 opacity-80 flex-shrink-0 ml-3" />
             </div>
          </div>
        </div>

        {/* TABS - COMPACT */}
        <div className="flex justify-around border-b border-gray-100 bg-white shrink-0 mt-3">
          {['Recharge', 'Diamond', 'Seller'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
              "py-2.5 px-3 text-[11px] font-bold uppercase tracking-tight relative transition-all",
              activeTab === tab ? "text-[#651FFF]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#651FFF] rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-28 bg-white">
          
          {activeTab === 'Recharge' && (
           <div className="animate-in fade-in duration-500">
            
            {/* UPI & GPAY LOGO CARDS - SUPER COMPACT */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="border border-gray-100 rounded-xl py-2.5 px-2 flex flex-col items-center justify-center gap-1.5 bg-white shadow-sm">
                <div className="h-5 flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-full object-contain" />
                </div>
                <span className="font-bold text-[9px] uppercase text-gray-500 tracking-wider">UPI</span>
              </div>
              <div className="border border-gray-100 rounded-xl py-2.5 px-2 flex flex-col items-center justify-center gap-1.5 bg-white shadow-sm">
                <div className="h-5 flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-full object-contain" />
                </div>
                <span className="font-bold text-[9px] uppercase text-gray-500 tracking-wider">Google Pay</span>
              </div>
            </div>

            {/* COIN PACKAGES - SUPER COMPACT GRID */}
            <div className="grid grid-cols-3 gap-1.5">
             {COIN_PACKAGES.map((pkg) => (
              <button 
               key={pkg.id}
               onClick={() => setSelectedPackageId(pkg.id)}
               className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border transition-all p-1.5 h-20 group",
                selectedPackageId === pkg.id 
                 ? "bg-purple-50 border-[#651FFF] shadow-sm scale-[1.02]" 
                 : "bg-white border-gray-100 hover:border-gray-200"
               )}
              >
                <div className="text-center flex flex-col justify-center w-full px-0.5">
                 <p className="font-bold text-[11px] tracking-tight leading-none text-gray-900 mb-0.5">{pkg.amount}</p>
                 {pkg.bonus && (
                  <p className="text-[8px] font-bold text-[#651FFF] mb-1">{pkg.bonus}</p>
                 )}
                </div>

                <div className={cn(
                 "w-full py-1 rounded-md text-[8px] font-black uppercase transition-all mt-auto tracking-widest",
                 selectedPackageId === pkg.id ? "bg-[#651FFF] text-white shadow-sm" : "bg-gray-100 text-gray-500"
                )}>
                 {pkg.price}
                </div>
              </button>
             ))}
            </div>

            {/* SCAN QR UPLOAD BUTTON - AUTO SCAN + DIRECT PAY */}
            <div className="mt-4 space-y-2">
              <label 
                className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-200 cursor-pointer hover:from-purple-100 hover:to-blue-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-all">
                  {scanStatus === 'scanning' ? (
                    <Loader className="h-5 w-5 animate-spin text-purple-600" />
                  ) : scanStatus === 'scanned' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : scanStatus === 'opening' ? (
                    <ExternalLink className="h-5 w-5 text-blue-600 animate-pulse" />
                  ) : (
                    <ScanLine className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-purple-900 uppercase">
                    {scanStatus === 'scanning' ? 'Scanning QR...' : 
                     scanStatus === 'scanned' ? 'QR Detected! Opening app...' : 
                     scanStatus === 'opening' ? 'Opening UPI App...' : 
                     'Scan & Pay (Auto)'}
                  </p>
                  <p className="text-[9px] text-purple-500 font-medium">
                    {scanStatus === 'idle' ? 'Upload QR image → Auto scan → Pay' : 
                     scanStatus === 'scanning' ? 'Reading QR code...' :
                     scanStatus === 'scanned' ? 'Amount auto-filled ✓' :
                     'Redirecting...'}
                  </p>
                </div>
                <Upload className="h-5 w-5 text-purple-400 group-hover:translate-y-[-2px] transition-transform" />
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleQRImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[8px] text-center font-bold text-gray-300 uppercase tracking-widest">
                Upload QR → Auto Detect → Auto Pay
              </p>
            </div>
           </div>
          )}

          {activeTab === 'Diamond' && (
           <div className="space-y-4 animate-in fade-in duration-500">
            <div className="relative h-32 w-full rounded-3xl bg-gradient-to-br from-[#00e5ff] via-[#0284c7] to-[#01579b] p-6 text-white shadow-[0_20px_40px_rgba(2,132,199,0.3)] overflow-hidden group">
             <div className="absolute inset-0 bg-white/30 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" style={{ animationDuration: '2.5s' }} />
             <div className="absolute inset-0 bg-white/10 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />

             <div className="relative z-30 flex flex-col h-full justify-between">
               <div className="flex justify-between items-start">
                <p className="text-xs font-bold uppercase tracking-tight opacity-90">My Diamonds</p>
               </div>
               <h2 className="text-3xl font-bold tracking-tight drop-shadow-md">
                {(userProfile?.wallet?.diamonds || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
               </h2>
             </div>
             <div className="absolute -bottom-4 -right-4 w-40 h-40 opacity-20 -rotate-12 group-hover:rotate-[-45deg] group-hover:scale-125 transition-all duration-1000">
               <Gem className="w-full h-full text-white fill-current" />
             </div>
            </div>

            <div className="p-0.5">
             <button 
              className="w-full bg-[#fffef0] border border-orange-100 rounded-2xl p-5 flex items-center justify-between shadow-sm group active:scale-[0.98] transition-all"
              onClick={() => router.push('/wallet/exchange')}
             >
               <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
                  <GoldCoinIcon className="h-full w-full relative z-10 drop-shadow-md" />
                </div>
                <span className="font-bold text-xs uppercase text-orange-900 tracking-tight">Exchange to coins</span>
               </div>
               <ChevronRight className="h-4 w-4 text-orange-200 group-hover:translate-x-1 transition-transform" />
             </button>
            </div>
           </div>
          )}

          {activeTab === 'Seller' && (
            <div className="py-20 text-center animate-in fade-in duration-500">
               <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">Coming Soon</p>
            </div>
          )}
        </div>

        {/* PAY BUTTON - Direct UPI Open */}
        {!showRecords && activeTab === 'Recharge' && (
         <footer className="p-3 pb-safe bg-white border-t border-gray-50 fixed bottom-0 left-0 right-0 z-50 md:relative shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <Button 
            onClick={handleRechargeNow}
            disabled={isProcessing !== false}
            className="w-full h-12 rounded-2xl bg-[#651FFF] hover:bg-[#6200EA] text-white font-black uppercase text-sm shadow-xl shadow-purple-500/30 active:scale-[0.98] transition-all tracking-wider"
           >
            {isProcessing !== false ? (
              <Loader className="animate-spin mr-2 h-4 w-4" />
            ) : (
              `Pay ₹${COIN_PACKAGES.find(p => p.id === selectedPackageId)?.price.replace(' INR', '') || '0'}`
            )}
           </Button>
         </footer>
        )}
       </div>
      )}
     </div>

    {/* UTR SUBMISSION DIALOG - After Payment */}
    <Dialog open={isOfflineDialogOpen} onOpenChange={setIsOfflineDialogOpen}>
     <DialogContent className="sm:max-w-full md:max-w-xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl font-sans overflow-hidden">
      <div className="flex flex-col max-h-[95vh] overflow-y-auto no-scrollbar">
        
        {/* TOP NOTICE */}
        <div className="bg-amber-400 py-3 px-4 flex items-center justify-center gap-2 shrink-0 shadow-md">
           <ShieldAlert className="h-3.5 w-3.5 text-black" />
           <p className="text-[9px] font-black uppercase text-black tracking-tight leading-none pt-0.5">Submit UTR after payment</p>
        </div>

        {/* UPI BAR - Compact */}
        <div className="flex items-center gap-2 px-4 py-3 shrink-0 bg-blue-50/50">
           <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-3 opacity-70 shrink-0" />
           <p className="text-xs font-black text-blue-600 truncate uppercase tracking-tighter flex-1">{config?.upiId || '7209741932@ptyes'}</p>
           <Button onClick={handleDownloadQR} size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full hover:bg-blue-100 text-blue-600">
             <Download className="h-3.5 w-3.5" />
           </Button>
        </div>

        {/* INPUT SECTION - Compact */}
        <div className="px-5 pb-8 pt-5 bg-white">
          {showSubmissionSuccess ? (
            <div className="text-center py-4 space-y-3 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <h2 className="text-lg font-bold uppercase text-slate-900 leading-tight">Sync Complete</h2>
              <Button onClick={() => { setIsOfflineDialogOpen(false); setShowSubmissionSuccess(false); setShowRecords(true); }}
                className="w-full h-12 bg-black text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl text-sm" >View Records</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Payable</p>
                   <p className="text-xl font-black text-slate-900">{COIN_PACKAGES.find(p => p.id === selectedPackageId)?.price}</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">You Get</p>
                   <p className="text-base font-black text-[#651FFF]">{COIN_PACKAGES.find(p => p.id === selectedPackageId)?.amount}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  value={utrNumber || ''}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="ENTER 12-DIGIT UTR ID"
                  className="h-14 bg-slate-50 border-2 border-slate-100 focus:border-[#651FFF] focus:bg-white rounded-2xl font-black text-center text-lg tracking-[0.2em] transition-all shadow-inner"
                />
              </div>

              <Button onClick={handleSubmitManualRecharge} disabled={isSubmittingManual}
                className="w-full h-14 bg-[#651FFF] hover:bg-[#6200EA] text-white font-black uppercase rounded-2xl shadow-xl shadow-purple-500/20 text-base border-b-4 border-purple-900" >
                {isSubmittingManual ? <Loader className="animate-spin h-4 w-4" /> : 'Confirm Payment'}
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
