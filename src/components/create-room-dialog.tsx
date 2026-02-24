'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
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
 * Dialog component for creating a new voice chat room.
 * Assigns a unique sequential 6-digit room number (starting from 100,000).
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

    const countersRef = doc(firestore, 'appConfig', 'counters');

    try {
      // Transaction to get next 6-digit room number
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
        stats: { totalGifts: 0 },
        lockedSeats: [],
        announcement: 'Welcome to the frequency!'
      };

      const docRef = await addDoc(collection(firestore, 'chatRooms'), roomData);
      
      toast({
        title: 'Room Created!',
        description: `Room No. ${roomNumber} is now live!`,
      });
      
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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <button className="bg-primary text-black p-1 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-white ring-2 ring-primary/20">
            <Plus className="h-3 w-3" />
          </button>
        ) : (
          <Button className="gap-2 rounded-full font-black uppercase italic tracking-widest text-xs px-6 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Create Room
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-4 text-center">
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Start a Tribe</DialogTitle>
            <DialogDescription className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Define your frequency and gather your tribe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8 px-4">
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
          <DialogFooter className="p-4 pt-0">
            <Button type="submit" className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-primary/20" disabled={isSubmitting || !name || !topic}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-6 w-6 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Launch Frequency'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
