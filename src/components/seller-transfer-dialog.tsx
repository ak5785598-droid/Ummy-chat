'use client';

import { useState, useEffect } from 'react';
import { useUser, useDoc, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, getDocs, doc, increment, serverTimestamp, writeBatch, limit, getDoc } from 'firebase/firestore';
import { 
 Dialog, 
 DialogContent, 
 DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, CheckCircle2, Send, User, Ban } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
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
      {/* Top knot */}
      <path d="M35 30 C 25 15, 75 15, 65 30 Q 50 35, 35 30 Z" fill="url(#bagGrad)" />
      {/* Main Bag */}
      <path d="M 25 85 C 10 85, 15 60, 25 45 Q 50 25, 75 45 C 85 60, 90 85, 75 85 Q 50 90, 25 85 Z" fill="url(#bagGrad)" />
      {/* Dollar Sign */}
      <path d="M50 38 L50 42 C45 42 42 45 42 48 C42 51 45 53 48 54 L52 55 C55 56 58 58 58 62 C58 66 55 69 50 69 L50 73 L46 73 L46 69 C41 68 39 65 39 62 L43 62 C43 64 45 66 48 66 L52 66 C54 66 55 64 55 62 C55 60 53 58 50 57 L46 56 C42 55 39 52 39 48 C39 44 42 41 46 41 L46 38 L50 38 Z" fill="url(#dollarGrad)" />
    </g>
  </svg>
);

/**
 * Official Seller Transfer Portal.
 * Handles the high-fidelity dispatch of Gold Coins to tribe members by ID.
 * Hardened with a Fresh Database Verification Handshake to prevent unauthorized transfers after revocation.
 */
export function SellerTransferDialog() {
 const [open, setOpen] = useState(false);
 const [recipientId, setRecipientId] = useState('');
 const [amount, setAmount] = useState('');
 const [isProcessing, setIsProcessing] = useState(false);
 const [isSearching, setIsSearching] = useState(false);
 const [foundRecipient, setFoundRecipient] = useState<any>(null);
 
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 // AUTH STATUS SYNC: Reactive check for seller tags
 const isAuthorized = userProfile?.tags?.some(t => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || user?.uid === CREATOR_ID;

 // AUTO-TERMINATION PROTOCOL
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

 // REAL-TIME IDENTITY SYNC
 useEffect(() => {
  const lookupRecipient = async () => {
   if (!firestore || recipientId.length < 1) {
    setFoundRecipient(null);
    return;
   }

   setIsSearching(true);
   try {
    const q = query(
     collection(firestore, 'users'), 
     where('accountNumber', '==', recipientId.trim()), 
     limit(1)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
     setFoundRecipient({ ...snap.docs[0].data(), id: snap.docs[0].id });
    } else {
     setFoundRecipient(null);
    }
   } catch (err) {
    console.error("[Identity Sync] Lookup failed:", err);
   } finally {
    setIsSearching(false);
   }
  };

  const timer = setTimeout(lookupRecipient, 500);
  return () => clearTimeout(timer);
 }, [recipientId, firestore]);

 const handleTransfer = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !firestore || !foundRecipient || !amount || !userProfile) return;

  setIsProcessing(true);

  try {
   // 1. FRESH AUTHORITY VERIFICATION
   const freshUserSnap = await getDoc(doc(firestore, 'users', user.uid));
   const freshTags = freshUserSnap.data()?.tags || [];
   const sellerTags = ['Seller', 'Seller center', 'Coin Seller'];
   const isStillAuthorized = freshTags.some((t: string) => sellerTags.includes(t)) || user.uid === CREATOR_ID;

   if (!isStillAuthorized) {
    toast({ variant: 'destructive', title: 'Authority Revoked', description: 'Your seller certification is no longer active. Transfer blocked.' });
    setOpen(false);
    setIsProcessing(false);
    return;
   }

   const coinsToTransfer = parseInt(amount);
   if (isNaN(coinsToTransfer) || coinsToTransfer <= 0) {
    toast({ variant: 'destructive', title: 'Invalid Amount' });
    setIsProcessing(false);
    return;
   }

   const currentBalance = userProfile.wallet?.coins || 0;
   if (coinsToTransfer > currentBalance) {
    toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Your frequency balance is too low for this dispatch.' });
    setIsProcessing(false);
    return;
   }

   if (foundRecipient.id === user.uid) {
    toast({ variant: 'destructive', title: 'Invalid Sync', description: 'Cannot dispatch to your own frequency.' });
    setIsProcessing(false);
    return;
   }

   // 2. ATOMIC DISPATCH HANDSHAKE
   const batch = writeBatch(firestore);
   const senderRef = doc(firestore, 'users', user.uid);
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const receiverRef = doc(firestore, 'users', foundRecipient.id);
   const receiverProfileRef = doc(firestore, 'users', foundRecipient.id, 'profile', foundRecipient.id);
   const receiverNotifRef = doc(collection(firestore, 'users', foundRecipient.id, 'notifications'));

   batch.set(senderRef, { wallet: { coins: increment(-coinsToTransfer) }, updatedAt: serverTimestamp() }, { merge: true });
   batch.set(senderProfileRef, { wallet: { coins: increment(-coinsToTransfer) }, updatedAt: serverTimestamp() }, { merge: true });
   batch.set(receiverRef, { wallet: { coins: increment(coinsToTransfer) }, updatedAt: serverTimestamp() }, { merge: true });
   batch.set(receiverProfileRef, { wallet: { coins: increment(coinsToTransfer) }, updatedAt: serverTimestamp() }, { merge: true });

   batch.set(receiverNotifRef, {
    title: 'Dispatch Received',
    content: `You received ${coinsToTransfer.toLocaleString()} Gold Coins from an Official Seller.`,
    type: 'system',
    timestamp: serverTimestamp(),
    isRead: false
   });

   await batch.commit();
   
   toast({ title: 'Sync Successful', description: `Successfully dispatched ${coinsToTransfer.toLocaleString()} Gold Coins to ${foundRecipient.username}.` });
   setOpen(false);
   setRecipientId('');
   setAmount('');
   setFoundRecipient(null);

  } catch (e: any) {
   console.error('[Seller Portal] Transfer Error:', e);
   toast({ variant: 'destructive', title: 'Dispatch Failed' });
  } finally {
   setIsProcessing(false);
  }
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
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
   
   {/* 50vh Square Bottom Sheet Styling */}
   <DialogContent className="sm:max-w-[425px] !rounded-none !mb-0 !bottom-0 !absolute !translate-y-0 !top-auto h-[50vh] bg-white text-black p-0 border-none shadow-2xl flex flex-col overflow-hidden data-[state=open]:animate-in slide-in-from-bottom-full duration-300">
    <form onSubmit={handleTransfer} className="flex flex-col h-full w-full">
     
     {/* 1st Row: Top Header (Reduced Height) */}
     <div className="h-[8vh] min-h-[45px] bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm relative z-10">
      <h2 className="font-sans text-lg font-bold uppercase tracking-widest">Offline Recharge</h2>
     </div>

     {/* Scrollable Container with Tighter Gaps */}
     <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center space-y-4">
      
      {!isAuthorized && (
       <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 flex gap-2">
         <Ban className="h-5 w-5 text-red-500 shrink-0" />
         <p className="text-[10px] font-bold text-red-800 uppercase">
          Certification Revoked. Access Restricted.
         </p>
       </div>
      )}

      <div className={cn("space-y-4", !isAuthorized && "opacity-40 grayscale pointer-events-none")}>
       
       {/* 2nd Row: ID Sync (Smaller Input) */}
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
         className="h-10 rounded-xl border-2 focus:border-purple-500 transition-all text-base font-bold text-center text-slate-900 bg-slate-50"
         required
         disabled={!isAuthorized}
        />
       </div>

       {/* 3rd Row: User ID Show Confirm (Compact Card) */}
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
        ) : (
         <div className="flex items-center justify-center gap-2 opacity-30">
          <User className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Awaiting ID</span>
         </div>
        )}
       </div>

       {/* 4th Row: Enter Coins (Smaller Input) */}
       <div className="grid gap-1">
        <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Enter Coins</Label>
        <div className="relative">
         <GoldCoinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
         <Input
          id="amount"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          className="h-10 pl-9 rounded-xl border-2 focus:border-purple-500 transition-all text-lg font-bold text-slate-900 bg-slate-50"
          required
          disabled={!isAuthorized}
         />
        </div>
        <div className="text-[10px] font-bold text-muted-foreground ml-1 uppercase flex justify-between">
         <span>Balance: {(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
        </div>
       </div>

      </div>
     </div>

     {/* 5th Row: Recharge Now Button (Compact Padding & Height) */}
     <div className="p-4 pt-0 shrink-0 bg-white">
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

