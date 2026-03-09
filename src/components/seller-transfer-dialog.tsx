'use client';

import { useState } from 'react';
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
import { ShieldCheck, Loader, ArrowRightLeft, BadgeCheck, ChevronRight } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * Official Seller Transfer Portal.
 * Handles the high-fidelity dispatch of Gold Coins to tribe members by ID.
 * Features a Balance Verification Protocol to ensure economic stability.
 */
export function SellerTransferDialog() {
  const [open, setOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !recipientId || !amount || !userProfile) return;

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

    setIsProcessing(true);

    try {
      const usersRef = collection(firestore, 'users');
      const paddedId = recipientId.padStart(3, '0');
      const q = query(usersRef, where('specialId', '==', paddedId), limit(1));
      
      let snap;
      try {
        snap = await getDocs(q);
      } catch (serverError: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: usersRef.path,
          operation: 'list',
        }));
        throw serverError;
      }

      if (snap.empty) {
        toast({ 
          variant: 'destructive', 
          title: 'Identity Not Found', 
          description: `No tribe member exists with ID ${recipientId}.` 
        });
        setIsProcessing(false);
        return;
      }

      const recipientDoc = snap.docs[0];
      const recipientUid = recipientDoc.id;

      if (recipientUid === user.uid) {
        toast({ 
          variant: 'destructive', 
          title: 'Invalid Sync', 
          description: 'You cannot dispatch coins to your own frequency.' 
        });
        setIsProcessing(false);
        return;
      }

      const batch = writeBatch(firestore);
      const senderRef = doc(firestore, 'users', user.uid);
      const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const receiverRef = doc(firestore, 'users', recipientUid);
      const receiverProfileRef = doc(firestore, 'users', recipientUid, 'profile', recipientUid);
      const receiverNotifRef = doc(collection(firestore, 'users', recipientUid, 'notifications'));

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
        description: `Successfully dispatched ${coinsToTransfer.toLocaleString()} Gold Coins to ID ${recipientId}.` 
      });
      setOpen(false);
      setRecipientId('');
      setAmount('');

    } catch (e: any) {
      console.error('[Seller Portal] Transfer Error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          type="button"
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0"
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
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] md:rounded-[2.5rem] overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500 font-headline">
        <form onSubmit={handleTransfer}>
          <DialogHeader className="p-8 pb-4 text-center border-b border-gray-50">
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Coin Dispatch</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Certified Seller Economic Gateway</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="recipientId" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Recipient Tribal ID</Label>
                <Input
                  id="recipientId"
                  placeholder="ID (e.g. 001)"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value.replace(/\D/g, ''))}
                  className="h-14 rounded-2xl border-2 focus:border-purple-500 transition-all text-xl font-black text-center"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Dispatch Volume</Label>
                <div className="relative">
                  <GoldCoinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-2 focus:border-purple-500 transition-all text-2xl font-black italic"
                    required
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">
                  Balance: {(userProfile?.wallet?.coins || 0).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100/50">
               <p className="text-[9px] text-purple-700 leading-relaxed uppercase font-bold text-center">
                 Ensure the ID matches the recipient exactly. Dispatch frequency cannot be reversed once synchronized.
               </p>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button 
              type="submit" 
              disabled={isProcessing || !recipientId || !amount}
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
