'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, getDocs, doc, increment, serverTimestamp, writeBatch, limit } from 'firebase/firestore';
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
import { ShieldCheck, Loader, ArrowRightLeft, BadgeCheck, ChevronRight, User, CheckCircle2 } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Official Seller Transfer Portal.
 * Handles the high-fidelity dispatch of Gold Coins to tribe members by ID.
 * Features a Balance Verification Protocol and Real-time Identity Sync.
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

  // REAL-TIME IDENTITY SYNC
  useEffect(() => {
    const lookupRecipient = async () => {
      if (!firestore || recipientId.length < 1) {
        setFoundRecipient(null);
        return;
      }

      setIsSearching(true);
      try {
        const paddedId = recipientId.padStart(3, '0');
        const q = query(
          collection(firestore, 'users'), 
          where('specialId', '==', paddedId), 
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

    const timer = setTimeout(lookupRecipient, 500); // Debounce lookup
    return () => clearTimeout(timer);
  }, [recipientId, firestore]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !foundRecipient || !amount || !userProfile) return;

    const coinsToTransfer = parseInt(amount);
    if (isNaN(coinsToTransfer) || coinsToTransfer <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount' });
      return;
    }

    const currentBalance = userProfile.wallet?.coins || 0;
    if (coinsToTransfer > currentBalance) {
      toast({ 
        variant: 'destructive', 
        title: 'Insufficient Coins', 
        description: 'Your frequency balance is too low for this dispatch.' 
      });
      return;
    }

    if (foundRecipient.id === user.uid) {
      toast({ 
        variant: 'destructive', 
        title: 'Invalid Sync', 
        description: 'You cannot dispatch coins to your own frequency.' 
      });
      return;
    }

    setIsProcessing(true);

    try {
      const batch = writeBatch(firestore);
      const senderRef = doc(firestore, 'users', user.uid);
      const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const receiverRef = doc(firestore, 'users', foundRecipient.id);
      const receiverProfileRef = doc(firestore, 'users', foundRecipient.id, 'profile', foundRecipient.id);
      const receiverNotifRef = doc(collection(firestore, 'users', foundRecipient.id, 'notifications'));

      // Atomic Balance Sync
      batch.update(senderRef, { 'wallet.coins': increment(-coinsToTransfer), updatedAt: serverTimestamp() });
      batch.update(senderProfileRef, { 'wallet.coins': increment(-coinsToTransfer), updatedAt: serverTimestamp() });
      batch.update(receiverRef, { 'wallet.coins': increment(coinsToTransfer), updatedAt: serverTimestamp() });
      batch.update(receiverProfileRef, { 'wallet.coins': increment(coinsToTransfer), updatedAt: serverTimestamp() });

      // Official Notification Sync
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
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter text-slate-900">Coin Dispatch</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Transfer Coins to any user by entering their User ID and amount.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
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
                />
              </div>

              {/* Recipient Profile Sync Display */}
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
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground ml-1 uppercase flex items-center justify-between">
                  <span>Balance: {(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                  {amount && <span className="text-purple-600 font-black">Syncing: {parseInt(amount).toLocaleString()}</span>}
                </p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100/50">
               <p className="text-[9px] text-purple-700 leading-relaxed uppercase font-bold text-center">
                 Ensure the profile matches your target recipient. Dispatch frequency cannot be reversed once synchronized.
               </p>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button 
              type="submit" 
              disabled={isProcessing || !foundRecipient || !amount}
              className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-[1.5rem] font-black uppercase italic text-xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
            >
              {isProcessing ? <Loader className="animate-spin h-6 w-6" /> : 'Synchronize Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
