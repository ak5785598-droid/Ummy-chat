'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { Plus, Loader, Zap } from 'lucide-react';
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
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';

interface CreateRoomDialogProps {
 iconOnly?: boolean;
 trigger?: React.ReactNode;
}

/**
 * Production Room Creation Portal.
 * Re-engineered to handle custom triggers and async availability checks.
 */
export function CreateRoomDialog({ iconOnly = false, trigger }: CreateRoomDialogProps) {
 const [open, setOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const router = useRouter();
 const { toast } = useToast();

 const [name, setName] = useState('');
 const [topic, setTopic] = useState('');
 const [category, setCategory] = useState('Chat');

 const handleDirectEntryCheck = async (e: React.MouseEvent) => {
  if (!user || !firestore) return;

  // Intercept frequency sync to check for existing room
  e.preventDefault();
  e.stopPropagation();
  setIsSubmitting(true);
  
  try {
   const roomRef = doc(firestore, 'chatRooms', user.uid);
   const roomSnap = await getDoc(roomRef);
   
   if (roomSnap.exists()) {
    console.log('[Identity Sync] Room detected. Redirecting to active frequency.');
    router.push(`/rooms/${user.uid}`);
    return;
   }
   
   setOpen(true);
  } catch (error: any) {
   setOpen(true);
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !firestore || !userProfile) return;

  setIsSubmitting(true);

  try {
   const roomRef = doc(firestore, 'chatRooms', user.uid);
   
   // IDENTITY SYNC PROTOCOL: 
   // Generate a random 6-digit room number
   let roomNumber = Math.floor(100000 + Math.random() * 900000).toString();
   
   // Collision Avoidance logic could go here, but for now we generate and set.
   // In a high-traffic app, we would query if this number exists.
   
   await setDoc(roomRef, {
    id: user.uid,
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
    announcement: 'Welcome to the frequency!',
    roomThemeId: 'misty',
    isPinned: false
   });
   
   setOpen(false);
   router.push(`/rooms/${user.uid}`);
  } catch (error: any) {
   toast({ variant: 'destructive', title: 'Room Failed', description: error.message });
  } finally {
   setIsSubmitting(false);
  }
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   {trigger ? (
    <div onClick={handleDirectEntryCheck} className="cursor-pointer">
     {trigger}
    </div>
   ) : (
    <DialogTrigger asChild>
     {iconOnly ? (
      <button 
       disabled={isSubmitting}
       className="bg-primary text-black p-1.5 rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-sm leading-none transition-transform active:scale-90"
      >
       {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : '🏠'}
      </button>
     ) : (
      <Button className="rounded-full font-bold uppercase tracking-wider text-[10px] px-6 h-10">
       <Plus className="h-4 w-4 mr-2" />Create
      </Button>
     )}
    </DialogTrigger>
   )}
   <DialogContent className="sm:max-w-[425px] rounded-t-[2.5rem] bg-white text-black p-0 overflow-hidden border-none shadow-2xl font-sans">
    <form onSubmit={handleSubmit}>
     <DialogHeader className="p-8 pb-0 text-center">
      <DialogTitle className="font-sans text-3xl uppercase tracking-tight">Launch Tribe</DialogTitle>
      <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">
       Identity Sync: Room ID will match your Tribal Signature.
      </DialogDescription>
     </DialogHeader>
     <div className="grid gap-6 py-8 px-8">
      <div className="grid gap-2">
       <Label htmlFor="name" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Room Name</Label>
       <Input id="name" placeholder="Vibe Name" value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl border-2 focus:border-primary transition-all" required />
      </div>
      <div className="grid gap-2">
       <Label htmlFor="topic" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Vibe Topic</Label>
       <Input id="topic" placeholder="Vibe Topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="h-14 rounded-2xl border-2 focus:border-primary transition-all" required />
      </div>
     </div>
     <DialogFooter className="p-8 pt-0">
      <Button type="submit" className="w-full h-16 text-xl font-bold uppercase rounded-3xl shadow-xl shadow-primary/20" disabled={isSubmitting || !userProfile}>
       {isSubmitting ? <Loader className="animate-spin mr-2 h-6 w-6" /> : 'Start Frequency'}
      </Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
