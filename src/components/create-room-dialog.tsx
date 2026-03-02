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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function CreateRoomDialog({ iconOnly = false }: { iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Chat');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSubmitting(true);

    try {
      const q = query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: 'One user can create only one voice chat room.' });
        const existingId = snap.docs[0].id;
        router.push(`/rooms/${existingId}`);
        setOpen(false);
        return;
      }

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

      const docRef = await addDoc(collection(firestore, 'chatRooms'), {
        name, description: topic, roomNumber, ownerId: user.uid, moderatorIds: [user.uid], createdAt: serverTimestamp(), category, stats: { totalGifts: 0, dailyGifts: 0 }, lockedSeats: [], participantCount: 0, announcement: 'Welcome to the frequency!'
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
        {iconOnly ? (
          <button className="bg-primary text-black p-1.5 rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-sm leading-none">🏠</button>
        ) : (
          <Button className="rounded-full font-black uppercase italic tracking-widest text-[10px] px-6 h-10"><Plus className="h-4 w-4 mr-2" />Create</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] bg-white text-black p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-8 pb-0 text-center"><DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Launch Tribe</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-8 px-8">
            <div className="grid gap-2"><Label htmlFor="name" className="text-[10px] font-black uppercase text-gray-400">Room Name</Label><Input id="name" placeholder="Vibe Name" value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl border-2" required /></div>
            <div className="grid gap-2"><Label htmlFor="topic" className="text-[10px] font-black uppercase text-gray-400">Vibe Topic</Label><Input id="topic" placeholder="Vibe Topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="h-14 rounded-2xl border-2" required /></div>
          </div>
          <DialogFooter className="p-8 pt-0"><Button type="submit" className="w-full h-16 text-xl font-black uppercase italic rounded-3xl" disabled={isSubmitting}>{isSubmitting ? <Loader className="animate-spin" /> : 'Start Frequency'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
