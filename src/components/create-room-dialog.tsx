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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Enhanced Creation Dialog.
 * Enforces "One Room Per User" constraint.
 * Initializes participantCount to 0 for strict discovery logic.
 */
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
      // 1. Production Constraint: One Room Only
      const q = query(collection(firestore, 'chatRooms'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast({ 
          variant: 'destructive', 
          title: 'Limit Reached', 
          description: 'One user can create only one voice chat room.' 
        });
        const existingId = snap.docs[0].id;
        router.push(`/rooms/${existingId}`);
        setOpen(false);
        return;
      }

      const countersRef = doc(firestore, 'appConfig', 'counters');

      const roomNumber = await runTransaction(firestore, async (transaction) => {
        const countersSnap = await transaction.get(countersRef);
        let nextRoomNum = 100000;
        if (countersSnap.exists()) {
          const current = countersSnap.data().roomCounter || 99999;
          nextRoomNum = current + 1;
        }
        transaction.set(countersRef, { roomCounter: nextRoomNum }, { merge: true });
        return String(nextRoomNum);
      });

      const roomData = {
        name,
        description: topic,
        roomNumber,
        ownerId: user.uid,
        moderatorIds: [user.uid],
        createdAt: serverTimestamp(),
        category: category,
        tags: [],
        stats: { totalGifts: 0, dailyGifts: 0 },
        lockedSeats: [],
        participantCount: 0, // Initial state: Hidden from public discovery
        announcement: 'Welcome to the frequency!'
      };

      const docRef = await addDoc(collection(firestore, 'chatRooms'), roomData);
      
      setOpen(false);
      router.push(`/rooms/${docRef.id}`);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: 'chatRooms',
          operation: 'create',
          requestResourceData: { name, topic, category }
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        toast({ variant: 'destructive', title: 'Room Failed', description: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <button className="bg-primary text-black p-1.5 rounded-xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-white">
            <Plus className="h-4 w-4" />
          </button>
        ) : (
          <Button className="gap-2 rounded-full font-black uppercase italic tracking-widest text-[10px] px-6 shadow-md h-10">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] border-none shadow-2xl bg-white text-black p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-8 pb-0 text-center">
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Launch Tribe</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
              Limit: One Frequency per Member
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8 px-8">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Room Name</Label>
              <Input
                id="name"
                placeholder="e.g. Neon Dreamers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 rounded-2xl border-2 focus:border-primary transition-all text-lg"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vibe Topic</Label>
              <Input
                id="topic"
                placeholder="e.g. Late night lofi vibes"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-14 rounded-2xl border-2 focus:border-primary transition-all"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="h-14 rounded-2xl border-2">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-xl rounded-2xl">
                  <SelectItem value="Chat">General Chat</SelectItem>
                  <SelectItem value="Game">Game Zone</SelectItem>
                  <SelectItem value="Singing">Singing/Music</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button type="submit" className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-primary/20" disabled={isSubmitting || !name || !topic}>
              {isSubmitting ? <Loader className="mr-2 h-6 w-6 animate-spin" /> : 'Start Frequency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
