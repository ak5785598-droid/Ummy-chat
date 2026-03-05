'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, runTransaction, doc, query, where, getDocs } from 'firebase/firestore';
import { Plus, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreateRoomDialogProps {
  iconOnly?: boolean;
  trigger?: React.ReactNode;
}

/**
 * Production Room Creation Portal.
 * Enforces the "One user, one room" tribal protocol.
 * DIRECT ENTRY: If iconOnly is true, clicking skips to existing room if found.
 */
export function CreateRoomDialog({ iconOnly = false, trigger }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Chat');

  const handleDirectEntryCheck = async (e: React.MouseEvent) => {
    if (!user || !firestore) return;

    // Direct entry protocol for icon or specific triggers
    if (iconOnly || !open) {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        const q = query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const existingId = snap.docs[0].id;
          router.push(`/rooms/${existingId}`);
          return;
        }
        
        // No room found, proceed to show dialog
        setOpen(true);
      } catch (error: any) {
        setOpen(true); // Fallback to dialog
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSubmitting(true);

    try {
      // 1. Identity Verification (One Room Protocol)
      const q = query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast({ 
          variant: 'destructive', 
          title: 'Limit Reached', 
          description: 'One user can create only one room.' 
        });
        const existingId = snap.docs[0].id;
        router.push(`/rooms/${existingId}`);
        setOpen(false);
        return;
      }

      // 2. Sequential Room Number Dispatch
      const countersRef = doc(firestore, 'appConfig', 'counters');
      const roomNumber = await runTransaction(firestore, async (transaction) => {
        const countersSnap = await transaction.get(countersRef);
        let nextRoomNum = 100001;
        if (countersSnap.exists()) {
          const current = countersSnap.data().roomCounter || 100000;
          nextRoomNum = current + 1;
        }
        transaction.set(countersRef, { roomCounter: nextRoomNum }, { merge: true });
        return String(nextRoomNum);
      });

      // 3. Frequency Initialization
      const docRef = await addDoc(collection(firestore, 'chatRooms'), {
        name, 
        description: topic, 
        roomNumber, 
        ownerId: user.uid, 
        moderatorIds: [user.uid], 
        createdAt: serverTimestamp(), 
        category, 
        stats: { totalGifts: 0, dailyGifts: 0 }, 
        lockedSeats: [], 
        participantCount: 0, 
        announcement: 'Welcome to the frequency!'
      });
      
      setOpen(false);
      router.push(`/rooms/${docRef.id}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Room Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          <div onClick={handleDirectEntryCheck}>{trigger}</div>
        ) : (
          iconOnly ? (
            <button 
              onClick={handleDirectEntryCheck}
              disabled={isSubmitting}
              className="bg-primary text-black p-1.5 rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-sm leading-none transition-transform active:scale-90"
            >
              {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : '🏠'}
            </button>
          ) : (
            <Button className="rounded-full font-black uppercase italic tracking-widest text-[10px] px-6 h-10" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Create
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] bg-white text-black p-0 overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-8 pb-0 text-center">
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Launch Tribe</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              By clicking on this icon we can directly enter to our room
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8 px-8">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase text-gray-400 ml-1">Room Name</Label>
              <Input id="name" placeholder="Vibe Name" value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl border-2 focus:border-primary transition-all" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic" className="text-[10px] font-black uppercase text-gray-400 ml-1">Vibe Topic</Label>
              <Input id="topic" placeholder="Vibe Topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="h-14 rounded-2xl border-2 focus:border-primary transition-all" required />
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button type="submit" className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? <Loader className="animate-spin" /> : 'Start Frequency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}