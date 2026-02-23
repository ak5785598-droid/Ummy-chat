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
  Gift as GiftIcon,
  Users,
  Crown,
  Settings,
  Share2,
  Volume2,
  Trash2,
  LogOut,
  UserPlus,
  Heart,
  Star,
  Zap,
  Sparkles,
  Megaphone,
  UserCheck,
  Ban,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import type { Room, RoomParticipant, Gift, Message } from '@/lib/types';
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
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { 
  collection, 
  serverTimestamp, 
  query, 
  orderBy, 
  limitToLast, 
  doc, 
  setDoc, 
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';

const AVAILABLE_GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', emoji: '🌹', price: 10, animationType: 'pulse' },
  { id: 'heart', name: 'Heart', emoji: '💖', price: 50, animationType: 'zoom' },
  { id: 'ring', name: 'Ring', emoji: '💍', price: 500, animationType: 'bounce' },
  { id: 'car', name: 'Luxury Car', emoji: '🏎️', price: 2000, animationType: 'bounce' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', price: 5000, animationType: 'zoom' },
  { id: 'castle', name: 'Castle', emoji: '🏰', price: 10000, animationType: 'bounce' },
  { id: 'galaxy', name: 'Galaxy', emoji: '🌌', price: 50000, animationType: 'zoom' },
];

/**
 * Room Client - Elite Voice App Edition.
 * Now featuring Minimization and Tribe Roster.
 */
export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const entranceAnnounced = useRef<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const { setIsMinimized, setActiveRoom } = useRoomContext();
  const firestore = useFirestore();

  const isGlobalAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');
  const isOwner = currentUser?.uid === room.ownerId;
  const isModerator = room.moderatorIds?.includes(currentUser?.uid || '');
  const canManageRoom = isGlobalAdmin || isOwner || isModerator;

  // Real-time Participants
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, currentUser]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;

  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;

  // Local Mute Handling
  useEffect(() => {
    if (currentUserParticipant?.isMuted) {
      setIsMicOn(false);
    }
  }, [currentUserParticipant?.isMuted]);

  // Messages Sync
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
      type: m.type || 'text',
      giftId: m.giftId,
      user: { id: m.senderId, name: m.senderName || 'User', avatarUrl: m.senderAvatar || '' }
    })) || [];
  }, [firestoreMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || isSending || !userProfile) return;
    setIsSending(true);
    
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: messageText,
      senderId: currentUser.uid,
      senderName: userProfile.username || 'User',
      senderAvatar: userProfile.avatarUrl || '',
      chatRoomId: room.id, 
      timestamp: serverTimestamp(),
      type: 'text'
    });
    setMessageText('');
    setIsSending(false);
  };

  const handleSendGift = async (gift: Gift) => {
    if (!currentUser || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < gift.price) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    const userRef = doc(firestore, 'users', currentUser.uid);
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    const roomRef = doc(firestore, 'chatRooms', room.id);
    
    const walletUpdates = {
      wallet: {
        coins: increment(-gift.price),
        totalSpent: increment(gift.price)
      },
      updatedAt: serverTimestamp()
    };

    setDocumentNonBlocking(userRef, walletUpdates, { merge: true });
    setDocumentNonBlocking(profileRef, walletUpdates, { merge: true });

    updateDocumentNonBlocking(roomRef, { stats: { totalGifts: increment(gift.price) }, updatedAt: serverTimestamp() });

    let finalRecipient = giftRecipient;
    if (!finalRecipient) {
      const host = participants?.find(p => p.seatIndex === 1);
      if (host) finalRecipient = { uid: host.uid, name: host.name, avatarUrl: host.avatarUrl };
    }

    if (finalRecipient) {
      const rRef = doc(firestore, 'users', finalRecipient.uid);
      const rpRef = doc(firestore, 'users', finalRecipient.uid, 'profile', finalRecipient.uid);
      const updates = { stats: { fans: increment(gift.price) }, updatedAt: serverTimestamp() };
      setDocumentNonBlocking(rRef, updates, { merge: true });
      setDocumentNonBlocking(rpRef, updates, { merge: true });
    }

    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: `sent a ${gift.name} ${gift.emoji}!`,
      senderId: currentUser.uid,
      senderName: userProfile.username,
      senderAvatar: userProfile.avatarUrl,
      chatRoomId: room.id,
      timestamp: serverTimestamp(),
      type: 'gift',
      giftId: gift.id,
      recipientName: finalRecipient?.name || 'Room'
    });

    setIsGiftPickerOpen(false);
    setGiftRecipient(null);
  };

  const handleClearChat = async () => {
    if (!canManageRoom || !firestore || !room.id) return;
    const snap = await getDocs(collection(firestore, 'chatRooms', room.id, 'messages'));
    const batch = writeBatch(firestore);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    toast({ title: 'Chat Cleared' });
  };

  const toggleSeatLock = (index: number) => {
    if (!canManageRoom || !firestore || !room.id) return;
    const isLocked = room.lockedSeats?.includes(index);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
      lockedSeats: isLocked ? arrayRemove(index) : arrayUnion(index)
    });
    toast({ title: isLocked ? `Seat ${index} Unlocked` : `Seat ${index} Locked` });
  };

  const muteParticipant = (uid: string, currentState: boolean) => {
    if (!canManageRoom || !firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), {
      isMuted: !currentState
    });
    toast({ title: currentState ? 'User Unmuted' : 'User Muted' });
  };

  const kickParticipant = (uid: string) => {
    if (!canManageRoom || !firestore || !room.id) return;
    deleteDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid));
    toast({ title: 'User Kicked' });
    setIsActionMenuOpen(false);
  };

  const leaveRoom = () => {
    if (firestore && currentUser && room.id) {
      deleteDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid));
    }
    setActiveRoom(null);
    router.push('/rooms');
  };

  const minimizeRoom = () => {
    setIsMinimized(true);
    router.push('/rooms');
  };

  const takeSeat = (index: number) => {
    if (!firestore || !room.id || !currentUser) return;
    if (room.lockedSeats?.includes(index)) {
      toast({ variant: 'destructive', title: 'Seat Locked' });
      return;
    }
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { 
      seatIndex: index,
      isMuted: true // Re-mute when changing seats for safety
    });
  };

  const leaveSeat = () => {
    if (!firestore || !room.id || !currentUser) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: 0 });
    setIsMicOn(false);
    setIsActionMenuOpen(false);
  };

  const handleSeatClick = (index: number, occupant: RoomParticipant | undefined) => {
    setSelectedSeatIndex(index);
    if (occupant) {
      setIsActionMenuOpen(true);
    } else {
      if (canManageRoom) {
        setIsActionMenuOpen(true);
      } else {
        takeSeat(index);
      }
    }
  };

  const handleMicToggle = () => {
    if (currentUserParticipant?.isMuted) {
      toast({ variant: 'destructive', title: 'Muted by Admin' });
      return;
    }
    if (!isInSeat) {
      const first = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].find(i => !participants?.some(p => p.seatIndex === i) && !room.lockedSeats?.includes(i));
      if (first) takeSeat(first);
    } else {
      const newState = !isMicOn;
      setIsMicOn(newState);
      if (firestore && currentUser && room.id) {
        updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !newState });
      }
    }
  };

  const hostParticipant = participants?.find(p => p.seatIndex === 1);
  const selectedOccupant = participants?.find(p => p.seatIndex === selectedSeatIndex);

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl border border-white/5 animate-in fade-in duration-700">
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-blue-900/40 to-black z-10" />
        <img src="https://images.unsplash.com/photo-1464802686167-b939a67e06a1?q=80&w=2070&auto=format&fit=crop" className="h-full w-full object-cover scale-110" alt="Room Vibe" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={minimizeRoom} className="bg-white/10 p-2 rounded-full mr-1 hover:bg-white/20">
             <ChevronDown className="h-5 w-5" />
          </button>
          <Avatar className="h-12 w-12 rounded-xl border-2 border-primary/50 shadow-lg">
            <AvatarImage src={room.coverUrl} />
            <AvatarFallback>UM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-black text-xl tracking-tight uppercase italic">{room.title}</h1>
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase cursor-pointer hover:text-white transition-colors">
                  <span>No: {room.roomNumber || '0000'}</span>
                  <div className="flex items-center gap-1 text-pink-400">
                    <Users className="h-3 w-3" />
                    <span>{onlineCount} Tribe</span>
                  </div>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-slate-900 border-none rounded-t-[3rem] text-white p-0 overflow-hidden h-[70vh]">
                 <SheetHeader className="p-8 pb-4">
                    <SheetTitle className="text-2xl font-black uppercase italic text-center">Tribe Frequency Members</SheetTitle>
                 </SheetHeader>
                 <ScrollArea className="h-full px-8 pb-20">
                    <div className="space-y-4">
                       {participants?.map((p) => (
                         <div key={p.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                               <AvatarFrame frameId={p.activeFrame} size="sm">
                                  <Avatar><AvatarImage src={p.avatarUrl} /><AvatarFallback>{p.name.charAt(0)}</AvatarFallback></Avatar>
                               </AvatarFrame>
                               <div>
                                  <p className="font-bold text-sm">{p.name}</p>
                                  <div className="flex items-center gap-2">
                                     {p.seatIndex === 1 && <Badge className="bg-blue-500 text-[8px] h-4">MASTER</Badge>}
                                     {room.moderatorIds?.includes(p.uid) && <Badge className="bg-purple-500 text-[8px] h-4">MOD</Badge>}
                                     {p.seatIndex > 0 && <Badge variant="outline" className="text-[8px] h-4 text-primary border-primary/20">SEAT {p.seatIndex}</Badge>}
                                  </div>
                               </div>
                            </div>
                            {p.isMuted && <MicOff className="h-4 w-4 text-red-500/50" />}
                         </div>
                       ))}
                    </div>
                 </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-white/10 text-white w-56">
              <DropdownMenuLabel>Room Control</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManageRoom && (
                <>
                  <DropdownMenuItem onClick={handleClearChat} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { const link = `${window.location.origin}/rooms/${room.id}`; navigator.clipboard.writeText(link); toast({ title: 'Link Copied!' }); }}>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Tribe
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => toast({ title: 'Room Shared!' })}>
                <Share2 className="mr-2 h-4 w-4" /> Share Room
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={leaveRoom}>
                <LogOut className="mr-2 h-4 w-4" /> Leave Room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/20 text-red-500" onClick={leaveRoom}>
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="relative z-50 px-6 py-1">
         <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full h-8 flex items-center overflow-hidden px-4 gap-3">
            <Megaphone className="h-3 w-3 text-primary shrink-0" />
            <div className="flex-1 overflow-hidden whitespace-nowrap">
               <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 animate-marquee inline-block">
                  {room.announcement || 'Welcome to the frequency! Keep the vibes high and the respect higher.'}
               </p>
            </div>
         </div>
      </div>

      <ScrollArea className="relative z-10 flex-1 px-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-6 space-y-12 pb-32">
          <div className="flex justify-center">
             <div className="flex flex-col items-center gap-3">
                <div className="relative">
                   {hostParticipant && !hostParticipant.isMuted && (
                      <div className="absolute -inset-4 rounded-full border-2 border-blue-400 animate-voice-wave" />
                   )}
                   <AvatarFrame frameId={hostParticipant?.activeFrame} size="xl">
                      <div 
                        onClick={() => handleSeatClick(1, hostParticipant)}
                        className={cn(
                          "h-28 w-28 rounded-full flex items-center justify-center transition-all cursor-pointer bg-black/40 backdrop-blur-md border-2",
                          hostParticipant ? "border-blue-400 shadow-xl" : "border-white/10"
                        )}
                      >
                        {hostParticipant ? (
                          <Avatar className="h-full w-full p-1"><AvatarImage src={hostParticipant.avatarUrl} /><AvatarFallback>H</AvatarFallback></Avatar>
                        ) : <Crown className="h-10 w-10 text-white/10" />}
                      </div>
                   </AvatarFrame>
                </div>
                <Badge className="bg-blue-500 text-white text-[10px] font-black uppercase italic">Room Master</Badge>
             </div>
          </div>

          <div className="grid grid-cols-4 gap-x-4 gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => {
              const idx = i + 2; 
              const occupant = participants?.find(p => p.seatIndex === idx);
              const isLocked = room.lockedSeats?.includes(idx);
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="relative">
                    {occupant && !occupant.isMuted && (
                       <div className="absolute -inset-2 rounded-full border-2 border-primary animate-voice-wave" />
                    )}
                    <AvatarFrame frameId={occupant?.activeFrame} size="md">
                      <div 
                        onClick={() => handleSeatClick(idx, occupant)}
                        className={cn(
                          "h-16 w-16 rounded-full flex items-center justify-center transition-all cursor-pointer bg-black/30 backdrop-blur-lg border-2",
                          isLocked ? "border-red-500/30" : "border-purple-500/30",
                          occupant && "border-primary shadow-lg",
                        )}
                      >
                        {isLocked ? <Lock className="h-6 w-6 text-red-500/40" /> : occupant ? (
                          <Avatar className="h-full w-full p-0.5"><AvatarImage src={occupant.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                        ) : <Mic className="h-6 w-6 text-white/20" />}
                      </div>
                    </AvatarFrame>
                    {occupant?.isMuted && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-black">
                        <MicOff className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase text-white/40 truncate w-14 text-center">
                    {occupant ? occupant.name : `Slot ${idx}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 max-w-lg mx-auto space-y-3 px-4">
            {activeMessages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex items-start gap-2 animate-in fade-in", 
                msg.type === 'gift' && "bg-primary/10 p-2 rounded-xl border border-primary/20",
                msg.type === 'entrance' && "bg-blue-500/10 p-1.5 px-3 rounded-full border border-blue-500/20 justify-center w-fit mx-auto"
              )}>
                {msg.type === 'entrance' ? (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3 w-3 text-blue-400" />
                    <p className="text-[10px] font-black uppercase italic text-blue-400">
                      {msg.user.name} <span className="opacity-60">{msg.text}</span>
                    </p>
                  </div>
                ) : (
                  <>
                    <span className={cn("text-[10px] font-black uppercase shrink-0 mt-1", msg.type === 'gift' ? "text-primary" : "text-blue-400")}>{msg.user.name}:</span>
                    <p className={cn("text-xs font-body", msg.type === 'gift' ? "text-primary font-black italic" : "text-white/80")}>{msg.text}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <footer className="relative z-50 px-6 pb-12 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <form className="flex-1 flex items-center bg-blue-900/40 backdrop-blur-xl rounded-full border border-white/10 h-12 px-5" onSubmit={handleSendMessage}>
            <Input placeholder="Share a vibe..." className="bg-transparent border-none text-xs text-white placeholder:text-white/40 focus-visible:ring-0" value={messageText} onChange={(e) => setMessageText(e.target.value)} disabled={isSending} />
            <button type="submit" disabled={isSending || !messageText.trim()} className="text-white hover:text-primary"><Send className="h-5 w-5" /></button>
          </form>
          <div className="flex items-center gap-3">
            <Button onClick={handleMicToggle} className={cn("rounded-full h-12 w-12 transition-all shadow-lg", isInSeat ? (isMicOn ? "bg-primary text-black" : "bg-white/10 text-white/40") : "bg-white/5")}>
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Dialog open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-600 animate-pulse shadow-xl shadow-pink-500/20">
                   <GiftIcon className="h-7 w-7 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden">
                 <DialogHeader className="p-8 pb-0 text-center"><DialogTitle className="text-3xl font-black uppercase italic">Ummy Boutique</DialogTitle></DialogHeader>
                 <div className="p-8 pt-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
                       {AVAILABLE_GIFTS.map(g => (
                         <button key={g.id} onClick={() => handleSendGift(g)} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-secondary/50 hover:bg-primary/20 transition-all border-2 border-transparent hover:border-primary group">
                            <span className="text-4xl group-hover:scale-125 transition-transform">{g.emoji}</span>
                            <div className="text-center">
                               <p className="text-[10px] font-black uppercase truncate w-20">{g.name}</p>
                               <div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary"><Zap className="h-3 w-3 fill-current" />{g.price}</div>
                            </div>
                         </button>
                       ))}
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-between">
                       <span className="text-xs font-black uppercase">Your Balance</span>
                       <div className="flex items-center gap-2 font-black text-primary italic"><Zap className="h-4 w-4 fill-current" />{userProfile?.wallet?.coins || 0}</div>
                    </div>
                 </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </footer>

      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[2.5rem] overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 border-b border-gray-100">
            <DialogTitle className="text-center text-2xl text-gray-800 uppercase italic">
              {selectedOccupant ? `Tribe: ${selectedOccupant.name}` : `Seat ${selectedSeatIndex}`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-gray-100">
            {selectedOccupant && (
              <button 
                onClick={() => { setGiftRecipient({ uid: selectedOccupant.uid, name: selectedOccupant.name, avatarUrl: selectedOccupant.avatarUrl }); setIsGiftPickerOpen(true); setIsActionMenuOpen(false); }} 
                className="py-5 font-black text-primary uppercase tracking-widest text-xs italic hover:bg-gray-50"
              >
                Send Gift
              </button>
            )}

            {canManageRoom && (
              <>
                {selectedOccupant ? (
                  <>
                    <button 
                      onClick={() => muteParticipant(selectedOccupant.uid, selectedOccupant.isMuted)} 
                      className="py-5 font-bold text-gray-700 uppercase tracking-widest text-xs hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      {selectedOccupant.isMuted ? <Volume2 className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      {selectedOccupant.isMuted ? 'Unmute Tribe' : 'Mute Tribe'}
                    </button>
                    {selectedOccupant.uid !== currentUser?.uid && (
                      <button 
                        onClick={() => kickParticipant(selectedOccupant.uid)} 
                        className="py-5 font-black text-destructive uppercase tracking-widest text-xs italic hover:bg-red-50 flex items-center justify-center gap-2"
                      >
                        <Ban className="h-4 w-4" /> Kick Tribe
                      </button>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={() => toggleSeatLock(selectedSeatIndex!)} 
                    className="py-5 font-bold text-purple-600 uppercase tracking-widest text-xs hover:bg-purple-50 flex items-center justify-center gap-2"
                  >
                    {room.lockedSeats?.includes(selectedSeatIndex!) ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {room.lockedSeats?.includes(selectedSeatIndex!) ? 'Unlock Slot' : 'Lock Slot'}
                  </button>
                )}
              </>
            )}

            {selectedOccupant?.uid === currentUser?.uid ? (
              <button 
                onClick={leaveSeat} 
                className="py-5 font-black text-red-500 uppercase tracking-widest text-xs italic hover:bg-red-50"
              >
                Exit Seat
              </button>
            ) : !selectedOccupant && !room.lockedSeats?.includes(selectedSeatIndex!) && (
              <button 
                onClick={() => takeSeat(selectedSeatIndex!)} 
                className="py-5 font-black text-blue-600 uppercase tracking-widest text-xs italic hover:bg-blue-50"
              >
                Take Seat
              </button>
            )}

            <button onClick={() => setIsActionMenuOpen(false)} className="py-5 font-bold text-gray-400 bg-gray-50/50 text-[10px] uppercase tracking-widest">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
