'use client';

import { useState, useEffect } from 'react';
import { useUser, useDoc, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, getDocs, doc, increment, serverTimestamp, writeBatch, limit, getDoc } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Loader, BadgeCheck, ChevronRight, User, CheckCircle2, Send, AlertCircle, Ban } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

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

  // AUTO-TERMINATION PROTOCOL: Close portal if certification is revoked in real-time
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
      // 1. FRESH AUTHORITY VERIFICATION (Anti-Ghost Protocol)
      // Perform a fresh fetch from DB to ensure authority hasn't been revoked in another session
      const freshUserSnap = await getDoc(doc(firestore, 'users', user.uid));
      const freshTags = freshUserSnap.data()?.tags || [];
      const sellerTags = ['Seller', 'Seller center', 'Coin Seller'];
      const isStillAuthorized = freshTags.some((t: string) => sellerTags.includes(t)) || user.uid === CREATOR_ID;

      if (!isStillAuthorized) {
        toast({ 
          variant: 'destructive', 
          title: 'Authority Revoked', 
          description: 'Your seller certification is no longer active. Transfer blocked.' 
        });
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
        toast({ 
          variant: 'destructive', 
          title: 'Insufficient Coins', 
          description: 'Your frequency balance is too low for this dispatch.' 
        });
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

      batch.update(senderRef, { 'wallet.coins': increment(-coinsToTransfer), updatedAt: serverTimestamp() });
      batch.update(senderProfileRef, { 'wallet.coins': increment(-coinsToTransfer), updatedAt: serverTimestamp() });
      batch.update(receiverRef, { 'wallet.coins': increment(coinsToTransfer), updatedAt: serverTimestamp() });
      batch.update(receiverProfileRef, { 'wallet.coins': increment(coinsToTransfer), updatedAt: serverTimestamp() });

      batch.set(receiverNotifRef, {
        title: 'Dispatch Received',
        content: `You received ${coinsToTransfer.toLocaleString()} Gold Coins from an Official Seller.`,
        type: 'system',
        timestamp: serverTimestamp(),
        isRead: false
      });

      await batch.commit();
      
      toast({ 
        title: 'Sync Successful', 
        description: `Successfully dispatched ${coinsToTransfer.toLocaleString()} Gold Coins to ${foundRecipient.username}.` 
      });
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
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-purple-100 text-purple-600">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <span className="font-black text-[13px] uppercase text-gray-800 tracking-tight">Seller center</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-green-500 uppercase italic">Transfer Portal</span>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500 font-headline">
        <form onSubmit={handleTransfer}>
          <DialogHeader className="p-8 pb-4 text-center border-b border-gray-50">
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter text-slate-900">coins transfer</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Transfer Coins to any user by entering their User ID and amount. Requires active certification.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            {!isAuthorized && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 animate-in fade-in duration-300">
                 <Ban className="h-5 w-5 text-red-500 shrink-0" />
                 <p className="text-[10px] font-bold text-red-800 leading-relaxed uppercase">
                    Your seller certification has been revoked. Access to the coin frequency is restricted.
                 </p>
              </div>
            )}

            <div className={cn("space-y-4", !isAuthorized && "opacity-40 grayscale pointer-events-none")}>
              <div className="grid gap-2">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="recipientId" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient Tribal ID</Label>
                  {isSearching && <Loader className="h-3 w-3 animate-spin text-primary" />}
                </div>
                <Input
                  id="recipientId"
                  placeholder="ID (e.g. 001)"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value.replace(/\D/g, ''))}
                  className="h-14 rounded-2xl border-2 focus:border-purple-500 transition-all text-xl font-black text-center text-slate-900 bg-slate-50 placeholder:text-slate-300"
                  required
                  disabled={!isAuthorized}
                />
              </div>

              <div className="relative h-24 flex items-center justify-center">
                {foundRecipient ? (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-green-100 w-full animate-in zoom-in duration-300">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src={foundRecipient.avatarUrl} />
                      <AvatarFallback className="bg-slate-200">U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm uppercase text-slate-900 truncate">{foundRecipient.username}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Identity Verified</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 opacity-20 italic">
                    <User className="h-8 w-8" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Valid ID</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Dispatch Volume</Label>
                <div className="relative">
                  <GoldCoinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6" />
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    className="h-14 pl-12 rounded-2xl border-2 focus:border-purple-500 transition-all text-2xl font-black italic text-slate-900 bg-slate-50 placeholder:text-slate-300"
                    required
                    disabled={!isAuthorized}
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground ml-1 uppercase flex items-center justify-between">
                  <span>Balance: {(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                  {amount && <span className="text-purple-600 font-black">Syncing: {parseInt(amount).toLocaleString()}</span>}
                </p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100/50 flex gap-2">
               <AlertCircle className="h-4 w-4 text-purple-600 shrink-0" />
               <p className="text-[9px] text-purple-700 leading-relaxed uppercase font-bold">
                 {isAuthorized 
                   ? "Ensure identity match. Authorization is verified in real-time before coins are dispatched."
                   : "Sovereign Access Denied. Your Seller Center certification is currently inactive."}
               </p>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button 
              type="submit" 
              disabled={isProcessing || !foundRecipient || !amount || !isAuthorized}
              className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-[1.5rem] font-black uppercase italic text-xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
            >
              {isProcessing ? <Loader className="animate-spin h-6 w-6" /> : <><Send className="mr-2 h-6 w-6" /> Synchronize Transfer</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
