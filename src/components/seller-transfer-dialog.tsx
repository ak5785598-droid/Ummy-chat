'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useDoc, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, getDocs, doc, increment, serverTimestamp, writeBatch, limit, getDoc, runTransaction } from 'firebase/firestore';
import { 
 Dialog, 
 DialogContent, 
 DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, CheckCircle2, Send, User, Ban, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/** * Glossy 3D Money Bag SVG Icon based on uploaded image 
 */
const MoneyBag3DIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <radialGradient id="bagGrad" cx="50%" cy="30%" r="60%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#ff9999" />
        <stop offset="40%" stopColor="#ff4d4d" />
        <stop offset="80%" stopColor="#cc0000" />
        <stop offset="100%" stopColor="#990000" />
      </radialGradient>
      <linearGradient id="dollarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ffcccc" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#ff0000" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <path d="M35 30 C 25 15, 75 15, 65 30 Q 50 35, 35 30 Z" fill="url(#bagGrad)" />
      <path d="M 25 85 C 10 85, 15 60, 25 45 Q 50 25, 75 45 C 85 60, 90 85, 75 85 Q 50 90, 25 85 Z" fill="url(#bagGrad)" />
      <path d="M50 38 L50 42 C45 42 42 45 42 48 C42 51 45 53 48 54 L52 55 C55 56 58 58 58 62 C58 66 55 69 50 69 L50 73 L46 73 L46 69 C41 68 39 65 39 62 L43 62 C43 64 45 66 48 66 L52 66 C54 66 55 64 55 62 C55 60 53 58 50 57 L46 56 C42 55 39 52 39 48 C39 44 42 41 46 41 L46 38 L50 38 Z" fill="url(#dollarGrad)" />
    </g>
  </svg>
);

const DollarCoin3DIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <radialGradient id="goldCoinGrad" cx="40%" cy="30%" r="60%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#FFF7B0" />
        <stop offset="30%" stopColor="#FFD700" />
        <stop offset="70%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </radialGradient>
      <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#DAA520" floodOpacity="0.4" />
      </filter>
    </defs>
    <g filter="url(#coinShadow)">
      <circle cx="50" cy="50" r="45" fill="url(#goldCoinGrad)" />
      <circle cx="50" cy="50" r="38" stroke="#B8860B" strokeWidth="2" opacity="0.5" />
      <path d="M50 25 L50 75 M50 25 C40 25 35 32 35 40 C35 55 65 45 65 60 C65 68 60 75 50 75 C40 75 35 68 35 60" stroke="#8B6508" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M50 25 L50 75 M50 25 C40 25 35 32 35 40 C35 55 65 45 65 60 C65 68 60 75 50 75 C40 75 35 68 35 60" stroke="#FFF7B0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(-1, -1)" />
    </g>
  </svg>
);

export function SellerTransferDialog() {
 const [open, setOpen] = useState(false);
 const [recipientId, setRecipientId] = useState('');
 const [amount, setAmount] = useState('');
 const [isProcessing, setIsProcessing] = useState(false);
 const [isSearching, setIsSearching] = useState(false);
 const [foundRecipient, setFoundRecipient] = useState<any>(null);
 const [debugError, setDebugError] = useState<string | null>(null);
 
 const { user } = useUser();
 const { userProfile, mutate: refreshUserProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();
 
 // ✅ FIX 1: Seller tags ko lowercase compare karo (case-insensitive)
 const isAuthorized = userProfile?.tags?.some((t: string) => 
   ['Seller', 'seller', 'Seller center', 'seller center', 'Coin Seller', 'coin seller'].includes(t.toLowerCase())
 ) || user?.uid === CREATOR_ID;

 // ✅ FIX 2: Auto-termination with proper cleanup
 useEffect(() => {
  if (open && !isAuthorized && user?.uid !== CREATOR_ID) {
   setOpen(false);
   toast({ 
    variant: 'destructive', 
    title: 'Certification Suspended', 
    description: 'Your Seller Center access has been revoked by tribal authority.' 
   });
  }
 }, [isAuthorized, open, user?.uid, toast]);

 // ✅ FIX 3: Recipient lookup - more robust, with error state
 useEffect(() => {
  let isMounted = true;
  const lookupRecipient = async () => {
   if (!firestore || recipientId.length < 1) {
    if (isMounted) setFoundRecipient(null);
    return;
   }

   setIsSearching(true);
   setDebugError(null);
   try {
    // Try by accountNumber first
    let q = query(
     collection(firestore, 'users'), 
     where('accountNumber', '==', recipientId.trim()), 
     limit(1)
    );
    let snap = await getDocs(q);
    
    // If not found, try by uid (for debugging)
    if (snap.empty) {
     q = query(collection(firestore, 'users'), where('uid', '==', recipientId.trim()), limit(1));
     snap = await getDocs(q);
    }
    
    if (!snap.empty && isMounted) {
     const docData = snap.docs[0].data();
     setFoundRecipient({ 
       ...docData, 
       id: snap.docs[0].id,
       username: docData.username || docData.displayName || 'Unknown User'
     });
    } else if (isMounted) {
     setFoundRecipient(null);
    }
   } catch (err: any) {
    console.error("[Identity Sync] Lookup failed:", err);
    if (isMounted) setDebugError(err.message);
   } finally {
    if (isMounted) setIsSearching(false);
   }
  };

  const timer = setTimeout(lookupRecipient, 500);
  return () => {
   clearTimeout(timer);
   isMounted = false;
  };
 }, [recipientId, firestore]);

 // ✅ FIX 4: Use Transaction instead of Batch for reliable increment
 const handleTransfer = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Clear previous errors
  setDebugError(null);
  
  // Validation checks
  if (!user || !firestore || !foundRecipient || !amount || !userProfile) {
    toast({ variant: 'destructive', title: 'Missing Info', description: 'Please fill all fields and ensure recipient is found.' });
    return;
  }

  setIsProcessing(true);

  try {
   // 🔥 FIRE 1: Fresh authority verification (case insensitive)
   const freshUserSnap = await getDoc(doc(firestore, 'users', user.uid));
   const freshTags = freshUserSnap.data()?.tags || [];
   const sellerTags = ['Seller', 'seller', 'Seller center', 'seller center', 'Coin Seller', 'coin seller'];
   const isStillAuthorized = freshTags.some((t: string) => sellerTags.includes(t.toLowerCase())) || user.uid === CREATOR_ID;

   if (!isStillAuthorized) {
    toast({ variant: 'destructive', title: 'Authority Revoked', description: 'Your seller certification is no longer active. Transfer blocked.' });
    setOpen(false);
    setIsProcessing(false);
    return;
   }

   const coinsToTransfer = parseInt(amount, 10);
   if (isNaN(coinsToTransfer) || coinsToTransfer <= 0) {
    toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid number of coins.' });
    setIsProcessing(false);
    return;
   }

   // ✅ FIX 5: Get fresh balance from Firestore directly (not from stale userProfile)
   const freshSenderSnap = await getDoc(doc(firestore, 'users', user.uid));
   const currentBalance = freshSenderSnap.data()?.wallet?.coins || 0;
   
   if (coinsToTransfer > currentBalance) {
    toast({ variant: 'destructive', title: 'Insufficient Coins', description: `Your balance is ${currentBalance.toLocaleString()} coins.` });
    setIsProcessing(false);
    return;
   }

   if (foundRecipient.id === user.uid) {
    toast({ variant: 'destructive', title: 'Invalid Sync', description: 'Cannot dispatch to your own frequency.' });
    setIsProcessing(false);
    return;
   }

   // ✅ FIX 6: Use RUNTRANSACTION instead of batch (more reliable for increments)
   const senderRef = doc(firestore, 'users', user.uid);
   const receiverRef = doc(firestore, 'users', foundRecipient.id);
   
   await runTransaction(firestore, async (transaction) => {
     const senderDoc = await transaction.get(senderRef);
     const receiverDoc = await transaction.get(receiverRef);
     
     if (!senderDoc.exists()) throw new Error('Sender not found');
     if (!receiverDoc.exists()) throw new Error('Receiver not found');
     
     const senderBalance = senderDoc.data()?.wallet?.coins || 0;
     if (senderBalance < coinsToTransfer) {
       throw new Error('Insufficient balance in transaction');
     }
     
     transaction.update(senderRef, {
       'wallet.coins': increment(-coinsToTransfer),
       updatedAt: serverTimestamp()
     });
     
     transaction.update(receiverRef, {
       'wallet.coins': increment(coinsToTransfer),
       updatedAt: serverTimestamp()
     });
   });
   
   // ✅ FIX 7: Update profile subcollection as well (for consistency)
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const receiverProfileRef = doc(firestore, 'users', foundRecipient.id, 'profile', foundRecipient.id);
   
   const batch = writeBatch(firestore);
   batch.set(senderProfileRef, { wallet: { coins: increment(-coinsToTransfer) }, updatedAt: serverTimestamp() }, { merge: true });
   batch.set(receiverProfileRef, { wallet: { coins: increment(coinsToTransfer) }, updatedAt: serverTimestamp() }, { merge: true });
   
   // Add notification to receiver
   const receiverNotifRef = doc(collection(firestore, 'users', foundRecipient.id, 'notifications'));
   batch.set(receiverNotifRef, {
    title: 'Dispatch Received',
    content: `You received ${coinsToTransfer.toLocaleString()} Gold Coins from an Official Seller.`,
    type: 'system',
    timestamp: serverTimestamp(),
    isRead: false
   });
   
   await batch.commit();
   
   // ✅ FIX 8: Force refresh user profile after transfer
   await refreshUserProfile();
   
   toast({ 
     title: 'Sync Successful', 
     description: `Successfully dispatched ${coinsToTransfer.toLocaleString()} Gold Coins to ${foundRecipient.username}.`,
     variant: 'default'
   });
   
   // Reset form
   setOpen(false);
   setRecipientId('');
   setAmount('');
   setFoundRecipient(null);

  } catch (e: any) {
   console.error('[Seller Portal] Transfer Error:', e);
   setDebugError(e.message);
   toast({ 
     variant: 'destructive', 
     title: 'Dispatch Failed', 
     description: e.message || 'Something went wrong. Please try again.' 
   });
  } finally {
   setIsProcessing(false);
  }
 };

 // Reset form when dialog closes
 const handleOpenChange = (newOpen: boolean) => {
   if (!newOpen) {
     setRecipientId('');
     setAmount('');
     setFoundRecipient(null);
     setDebugError(null);
   }
   setOpen(newOpen);
 };

 return (
  <Dialog open={open} onOpenChange={handleOpenChange}>
   <DialogTrigger asChild>
    <button 
     type="button"
     className="w-full flex items-center justify-between py-4 pl-4 pr-3 hover:bg-slate-50/50 active:bg-slate-100/50 transition-all text-left group"
    >
     <div className="flex items-center gap-4">
      <div className="h-10 w-10 p-1.5 rounded-xl flex items-center justify-center transition-colors bg-red-50 text-red-500 shadow-sm border border-red-100">
       <MoneyBag3DIcon className="h-full w-full" />
      </div>
      <span className="font-medium text-[16px] text-[#1F2937]">Seller Center</span>
     </div>
    </button>
   </DialogTrigger>
   
   <DialogContent className="sm:max-w-[425px] w-[95vw] md:w-full rounded-2xl max-h-[85dvh] bg-white text-black p-0 border-none shadow-2xl flex flex-col overflow-hidden z-[100] gap-0">
    <form onSubmit={handleTransfer} className="flex flex-col h-full w-full">
     
     {/* Header */}
     <div className="h-[8vh] min-h-[55px] bg-gradient-to-b from-purple-600 via-purple-500 to-purple-100 flex items-center justify-center text-white shrink-0 shadow-sm relative z-10">
      <h2 className="font-sans text-lg font-bold uppercase tracking-widest drop-shadow-md">Offline Recharge</h2>
     </div>

     {/* Scrollable Container */}
     <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center space-y-4">
      
      {!isAuthorized && (
       <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 flex gap-2">
         <Ban className="h-5 w-5 text-red-500 shrink-0" />
         <p className="text-[10px] font-bold text-red-800 uppercase">
          Certification Revoked. Access Restricted.
         </p>
       </div>
      )}
      
      {/* Debug Error Display */}
      {debugError && (
        <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700">{debugError}</p>
        </div>
      )}

      <div className={cn("space-y-4 my-auto", !isAuthorized && "opacity-40 grayscale pointer-events-none")}>
       
       {/* ID Input */}
       <div className="grid gap-1">
        <div className="flex items-center justify-between px-1">
         <Label htmlFor="recipientId" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ID Sync (Tribal ID)</Label>
         {isSearching && <Loader className="h-3 w-3 animate-spin text-purple-600" />}
        </div>
        <Input
         id="recipientId"
         placeholder="Enter ID"
         value={recipientId}
         onChange={(e) => setRecipientId(e.target.value.replace(/\D/g, ''))}
         className="h-12 rounded-xl border-2 focus:border-purple-500 transition-all text-base font-bold text-center text-slate-900 bg-slate-50"
         required
         disabled={!isAuthorized}
        />
       </div>

       {/* Recipient Confirmation Card */}
       <div className="relative h-[3.5rem] flex items-center justify-center">
        {foundRecipient ? (
         <div className="flex items-center gap-2 p-2 px-3 bg-slate-50 rounded-xl border-2 border-green-100 w-full animate-in zoom-in duration-300">
          <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
           <AvatarImage src={foundRecipient.avatarUrl} />
           <AvatarFallback className="bg-slate-200 text-xs">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
           <p className="font-bold text-xs uppercase text-slate-900 truncate">{foundRecipient.username}</p>
           <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500 fill-current" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-green-600">ID Confirmed</span>
           </div>
          </div>
         </div>
        ) : recipientId.length > 0 && !isSearching ? (
          <div className="flex items-center justify-center gap-2 w-full p-2 bg-red-50 rounded-xl border border-red-200">
            <User className="h-4 w-4 text-red-500" />
            <span className="text-[10px] font-bold uppercase text-red-600">User Not Found</span>
          </div>
        ) : (
         <div className="flex items-center justify-center gap-2 opacity-30">
          <User className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Awaiting ID</span>
         </div>
        )}
       </div>

       {/* Amount Input */}
       <div className="grid gap-1">
        <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Enter Coins</Label>
        <div className="relative">
         <DollarCoin3DIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6" />
         <Input
          id="amount"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          className="h-12 pl-12 rounded-xl border-2 focus:border-purple-500 transition-all text-lg font-bold text-slate-900 bg-slate-50"
          required
          disabled={!isAuthorized}
         />
        </div>
        
        <div className="text-[10px] font-bold text-muted-foreground ml-1 mt-1 uppercase flex justify-between items-start">
         <span className="mt-1">Balance: {(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
         
         <div className={cn("flex flex-col items-end", amount ? "opacity-100" : "opacity-0")}>
           <span className="text-purple-600 font-extrabold text-[11px]">
             Sending: {amount ? parseInt(amount).toLocaleString() : '0'}
           </span>
           <span className="text-green-600 font-bold mt-0.5 tracking-wider">
             ≈ ₹{amount ? parseFloat((parseInt(amount) / 5500).toFixed(2)).toLocaleString('en-IN') : '0'}
           </span>
         </div>
        </div>
       </div>
      </div>
     </div>

     {/* Submit Button */}
     <div className="p-4 shrink-0 bg-white border-t border-slate-50">
      <Button 
       type="submit" 
       disabled={isProcessing || !foundRecipient || !amount || !isAuthorized}
       className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold uppercase text-base shadow-lg active:scale-95 transition-all flex items-center justify-center"
      >
       {isProcessing ? <Loader className="animate-spin h-5 w-5" /> : <><Send className="mr-2 h-4 w-4" /> Recharge Now</>}
      </Button>
     </div>
    </form>
   </DialogContent>
  </Dialog>
 );
     }
