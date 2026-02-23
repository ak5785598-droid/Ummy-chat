'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Lock,
  Unlock,
  Loader,
  MoreVertical,
  UserX,
  Gift,
  Users,
  Crown,
  Settings,
  Share2,
  Volume2,
  Trash2,
  LogOut,
  UserPlus,
} from 'lucide-react';
import type { Room, RoomParticipant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile } from '@/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limitToLast, 
  doc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  getDocs,
} from 'firebase/firestore';

/**
 * Chat Room Client View.
 * Optimized for high-performance real-time interaction and specific seat menus.
 */
export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();

  const isOwner = currentUser?.uid === room.ownerId;
  const isAdmin = isOwner || room.moderatorIds?.includes(currentUser?.uid || '');

  // Participants Subcollection
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, currentUser]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;

  // Presence Synchronization
  useEffect(() => {
    if (!firestore || !room.id || !currentUser || !userProfile) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    
    setDoc(participantRef, {
      uid: currentUser.uid,
      name: userProfile.username || 'Guest',
      avatarUrl: userProfile.avatarUrl || '',
      activeFrame: userProfile.frame || 'None',
      joinedAt: serverTimestamp(),
      isMuted: !isMicOn,
      seatIndex: participants?.find(p => p.uid === currentUser.uid)?.seatIndex || 0,
    }, { merge: true }).catch(err => console.warn('Presence sync delayed', err));

    return () => { 
      deleteDoc(participantRef).catch(() => {}); 
    };
  }, [firestore, room.id, currentUser?.uid, userProfile?.username, userProfile?.avatarUrl]);

  // Sync Mic State with Firestore
  useEffect(() => {
    if (!firestore || !room.id || !currentUser) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    updateDoc(participantRef, { isMuted: !isMicOn }).catch(() => {});
  }, [isMicOn, firestore, room.id, currentUser]);

  // Messages Query
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(
      collection(firestore, 'chatRooms', room.id, 'messages'), 
      orderBy('timestamp', 'asc'), 
      limitToLast(50)
    );
  }, [firestore, room.id, currentUser]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  const activeMessages = useMemo(() => {
    return firestoreMessages?.map((m: any) => ({
      id: m.id,
      text: m.content,
      user: { id: m.senderId, name: m.senderName || 'User', avatarUrl: m.senderAvatar || '' }
    })) || [];
  }, [firestoreMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [activeMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || isSending || !userProfile) return;
    setIsSending(true);
    try {
      await addDoc(collection(firestore, 'chatRooms', room.id, 'messages'), {
        content: messageText,
        senderId: currentUser.uid,
        senderName: userProfile.username || 'User',
        senderAvatar: userProfile.avatarUrl || '',
        chatRoomId: room.id, 
        timestamp: serverTimestamp(),
      });
      setMessageText('');
    } catch (e) { 
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' }); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleSendGift = async () => {
    if (!currentUser || !firestore || !userProfile) return;
    const giftCost = 100;
    if ((userProfile.wallet?.coins || 0) < giftCost) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Recharge to send gifts!' });
      return;
    }
    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const updateData = {
        'wallet.coins': increment(-giftCost),
        'wallet.totalSpent': increment(giftCost),
        'updatedAt': serverTimestamp()
      };
      await Promise.all([updateDoc(userRef, updateData), updateDoc(profileRef, updateData)]);
      toast({ title: 'Gift Sent!', description: `You sent a 100 coin gift!` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gift Error', description: 'Failed to send gift.' });
    }
  };

  const handleClearChat = async () => {
    if (!isAdmin || !firestore || !room.id) return;
    try {
      const messagesRef = collection(firestore, 'chatRooms', room.id, 'messages');
      const snapshot = await getDocs(messagesRef);
      if (snapshot.empty) { toast({ title: 'Chat is already clear' }); return; }
      const batch = writeBatch(firestore);
      snapshot.docs.forEach((d) => { batch.delete(d.ref); });
      await batch.commit();
      toast({ title: 'Chat Cleared', description: 'All room messages have been removed.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    }
  };

  const takeSeat = async (index: number) => {
    if (!firestore || !room.id || !currentUser) return;
    if (room.lockedSeats?.includes(index)) {
      toast({ variant: 'destructive', title: 'Seat Locked' });
      return;
    }
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    updateDoc(participantRef, { seatIndex: index });
  };

  const leaveSeat = async () => {
    if (!firestore || !room.id || !currentUser) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    updateDoc(participantRef, { seatIndex: 0 });
    setIsActionMenuOpen(false);
    toast({ title: 'Seat Left' });
  };

  const toggleSeatLock = async (index: number | null) => {
    if (!firestore || !room.id || !isAdmin || index === null) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    const isLocked = room.lockedSeats?.includes(index);
    updateDoc(roomRef, { lockedSeats: isLocked ? arrayRemove(index) : arrayUnion(index) });
    setIsActionMenuOpen(false);
  };

  const toggleAllSeatsLock = async () => {
    if (!firestore || !room.id || !isAdmin) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    const allLocked = room.lockedSeats?.length === 12;
    updateDoc(roomRef, { lockedSeats: allLocked ? [] : Array.from({ length: 12 }, (_, i) => i + 2) });
    setIsActionMenuOpen(false);
  };

  const handleSeatAvatarClick = (index: number, occupant: RoomParticipant | undefined) => {
    if (occupant?.uid === currentUser?.uid || isAdmin) {
      setSelectedSeatIndex(index);
      setIsActionMenuOpen(true);
    } else if (!occupant && !room.lockedSeats?.includes(index)) {
      takeSeat(index);
    }
  };

  if (isUserLoading || !currentUser || isProfileLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader className="animate-spin text-primary h-10 w-10" />
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Syncing Room Data...</p>
      </div>
    );
  }

  const hostParticipant = participants?.find(p => p.seatIndex === 1);

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl border border-white/5 animate-in fade-in duration-700">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-blue-900/40 to-black z-10" />
        <img src="https://images.unsplash.com/photo-1464802686167-b939a67e06a1?q=80&w=2070&auto=format&fit=crop" className="h-full w-full object-cover opacity-60 scale-110" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-primary/50">
            <AvatarImage src={`https://picsum.photos/seed/${room.id}/200`} />
            <AvatarFallback>UM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-black text-xl tracking-tight uppercase italic">{room.title}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
              <span>ID: {room.id.substring(0, 8)}</span>
              <div className="flex items-center gap-1 text-pink-400">
                <Users className="h-3 w-3" />
                <span>{onlineCount}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Settings /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
              <DropdownMenuLabel>Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={handleClearChat} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Chat
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" asChild><a href="/rooms"><PhoneOff /></a></Button>
        </div>
      </header>

      <ScrollArea className="relative z-10 flex-1 px-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-6 space-y-12">
          {/* Host Seat */}
          <div className="flex justify-center">
             <div className="flex flex-col items-center gap-3">
                <div 
                  onClick={() => handleSeatAvatarClick(1, hostParticipant)}
                  className={cn(
                    "h-28 w-28 rounded-full flex items-center justify-center transition-all relative cursor-pointer border-2 bg-black/40 backdrop-blur-md",
                    hostParticipant ? "border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.5)]" : "border-white/10 hover:border-blue-400/50"
                  )}
                >
                  {hostParticipant ? (
                    <Avatar className="h-full w-full rounded-full border-2 border-black">
                       <AvatarImage src={hostParticipant.avatarUrl} />
                       <AvatarFallback>{hostParticipant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : <Crown className="h-10 w-10 text-white/10" />}
                </div>
                <Badge className="bg-blue-500 text-white text-[10px] uppercase font-black">Room Master</Badge>
             </div>
          </div>

          {/* Seat Grid */}
          <div className="grid grid-cols-4 gap-x-4 gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => {
              const seatIndex = i + 2; 
              const occupant = participants?.find(p => p.seatIndex === seatIndex);
              const isLocked = room.lockedSeats?.includes(seatIndex);
              return (
                <div key={seatIndex} className="flex flex-col items-center gap-2">
                  <div 
                    onClick={() => handleSeatAvatarClick(seatIndex, occupant)}
                    className={cn(
                      "h-16 w-16 rounded-full flex items-center justify-center transition-all relative cursor-pointer bg-black/30 backdrop-blur-lg border-2",
                      isLocked ? "border-red-500/30 bg-red-950/20" : "border-purple-500/30",
                      occupant && "border-primary shadow-[0_0_20px_rgba(255,107,107,0.3)] ring-2 ring-white/5"
                    )}
                  >
                    {isLocked ? <Lock className="h-6 w-6 text-red-500/40" /> : occupant ? (
                      <Avatar className="h-full w-full rounded-full p-0.5">
                        <AvatarImage src={occupant.avatarUrl} />
                        <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ) : <Mic className="h-6 w-6 text-white/20" />}
                    {occupant && !occupant.isMuted && <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping" />}
                  </div>
                  <span className="text-[9px] font-black truncate max-w-[60px] uppercase text-white/40">
                    {occupant ? occupant.name : `Slot ${seatIndex}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 mb-24 max-w-lg mx-auto space-y-3 px-4">
            {activeMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] font-black text-blue-400 uppercase shrink-0 mt-1">{msg.user.name}:</span>
                <p className="text-xs text-white/80 font-body">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <footer className="relative z-50 shrink-0 px-6 pb-12 pt-4 bg-transparent">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <form className="flex-1 flex items-center bg-blue-900/40 backdrop-blur-xl rounded-full border border-white/10 h-12 px-5" onSubmit={handleSendMessage}>
            <Input placeholder="Type a vibe..." className="bg-transparent border-none h-full focus-visible:ring-0 text-xs" value={messageText} onChange={(e) => setMessageText(e.target.value)} disabled={isSending} />
            <Button type="submit" variant="ghost" size="icon" disabled={isSending}><Send className="h-5 w-5" /></Button>
          </form>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsMicOn(!isMicOn)} className={cn("rounded-full h-12 w-12", isMicOn ? "bg-primary/20 text-primary border-primary/50" : "bg-white/5 text-white/40")}><Mic className="h-5 w-5"/></Button>
            <Button onClick={handleSendGift} className="rounded-full h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-600 animate-pulse"><Gift className="h-7 w-7 text-white" /></Button>
          </div>
        </div>
      </footer>

      {/* Action Menu Dialog (Screenshot Style) */}
      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-sm bg-white/95 backdrop-blur-xl border-none p-0 rounded-t-[2rem] overflow-hidden">
          <DialogHeader className="p-6 border-b border-gray-100">
            <DialogTitle className="text-center font-headline text-xl text-gray-800">Seat Actions</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col text-center divide-y divide-gray-100">
            <button onClick={() => setIsMicOn(!isMicOn)} className="py-5 font-bold text-gray-700 hover:bg-gray-50 transition-colors">On mic</button>
            <button onClick={() => toast({ title: 'Invited!', description: 'Link shared to your tribe.' })} className="py-5 font-bold text-gray-700 hover:bg-gray-50 transition-colors">Invite</button>
            {isAdmin && (
              <>
                <button onClick={() => toggleSeatLock(selectedSeatIndex)} className="py-5 font-bold text-gray-700 hover:bg-gray-50 transition-colors">Lock</button>
                <button onClick={toggleAllSeatsLock} className="py-5 font-bold text-gray-700 hover:bg-gray-50 transition-colors">Lock All</button>
              </>
            )}
            <button onClick={() => setIsMicOn(false)} className="py-5 font-bold text-gray-700 hover:bg-gray-50 transition-colors">Mute</button>
            <button onClick={leaveSeat} className="py-5 font-black text-destructive hover:bg-red-50 transition-colors">Leave Seat</button>
            <button onClick={() => setIsActionMenuOpen(false)} className="py-6 font-bold text-gray-400 bg-gray-50/50">Cancel</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
