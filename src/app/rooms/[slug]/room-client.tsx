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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
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
 * Features: Animated Mic Stages, Full-Screen Gift Effects, Identity Persistence.
 */
export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<{ gift: Gift; senderName: string } | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(currentUser?.uid);
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

  // Presence & Voice Sync Engine
  useEffect(() => {
    if (!firestore || !room.id || !currentUser || !userProfile) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    
    setDoc(participantRef, {
      uid: currentUser.uid,
      name: userProfile.username || 'Guest',
      avatarUrl: userProfile.avatarUrl || '',
      activeFrame: userProfile.inventory?.activeFrame || (userProfile.tags?.includes('Official') ? 'Official' : 'None'),
      joinedAt: serverTimestamp(),
      isMuted: !isMicOn,
      seatIndex: currentUserParticipant?.seatIndex || 0,
    }, { merge: true }).catch(err => console.warn('Sync delayed', err));

    return () => { 
      deleteDoc(participantRef).catch(() => {}); 
    };
  }, [firestore, room.id, currentUser?.uid, userProfile?.username, userProfile?.avatarUrl, userProfile?.inventory?.activeFrame, isMicOn]);

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

  // Gifting Animation Trigger
  useEffect(() => {
    if (!activeMessages.length) return;
    const lastMsg = activeMessages[activeMessages.length - 1];
    if (lastMsg.type === 'gift' && lastMsg.giftId) {
      const gift = AVAILABLE_GIFTS.find(g => g.id === lastMsg.giftId);
      if (gift) {
        setActiveGiftAnimation({ gift, senderName: lastMsg.user.name });
        const timer = setTimeout(() => setActiveGiftAnimation(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeMessages]);

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
    
    // Sender: Wealth Sync
    setDocumentNonBlocking(userRef, { 
      wallet: { coins: increment(-gift.price), totalSpent: increment(gift.price) },
      username: userProfile.username,
      avatarUrl: userProfile.avatarUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });
    setDocumentNonBlocking(profileRef, { 
      wallet: { coins: increment(-gift.price), totalSpent: increment(gift.price) },
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Room: Popularity Sync
    updateDocumentNonBlocking(roomRef, { 'stats.totalGifts': increment(gift.price), updatedAt: serverTimestamp() });

    let finalRecipient = giftRecipient;
    if (!finalRecipient) {
      const host = participants?.find(p => p.seatIndex === 1);
      if (host) finalRecipient = { uid: host.uid, name: host.name, avatarUrl: host.avatarUrl };
    }

    // Recipient: Charm Sync
    if (finalRecipient) {
      const rRef = doc(firestore, 'users', finalRecipient.uid);
      const rpRef = doc(firestore, 'users', finalRecipient.uid, 'profile', finalRecipient.uid);
      const updates = { 
        stats: { fans: increment(gift.price) }, 
        username: finalRecipient.name, 
        avatarUrl: finalRecipient.avatarUrl || '', 
        updatedAt: serverTimestamp() 
      };
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
    toast({ title: 'Chat Purged' });
  };

  const takeSeat = (index: number) => {
    if (!firestore || !room.id || !currentUser) return;
    if (room.lockedSeats?.includes(index)) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: index });
  };

  const leaveSeat = () => {
    if (!firestore || !room.id || !currentUser) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: 0 });
    setIsActionMenuOpen(false);
  };

  const handleSeatClick = (index: number, occupant: RoomParticipant | undefined) => {
    if (occupant) {
      setSelectedSeatIndex(index);
      setIsActionMenuOpen(true);
    } else if (!room.lockedSeats?.includes(index)) {
      takeSeat(index);
    }
  };

  const handleMicToggle = () => {
    if (!isInSeat) {
      const first = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].find(i => !participants?.some(p => p.seatIndex === i) && !room.lockedSeats?.includes(i));
      if (first) takeSeat(first);
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  const hostParticipant = participants?.find(p => p.seatIndex === 1);

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl border border-white/5 animate-in fade-in duration-700">
      {/* Dynamic Visual Backdrop */}
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-blue-900/40 to-black z-10" />
        <img src="https://images.unsplash.com/photo-1464802686167-b939a67e06a1?q=80&w=2070&auto=format&fit=crop" className="h-full w-full object-cover scale-110" alt="Room Vibe" />
      </div>

      {/* Gift Launch Overlay */}
      {activeGiftAnimation && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="bg-black/60 backdrop-blur-3xl p-12 rounded-[4rem] border-4 border-primary/50 flex flex-col items-center gap-6 shadow-2xl">
             <div className="text-[12rem] animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                {activeGiftAnimation.gift.emoji}
             </div>
             <p className="font-black text-4xl uppercase italic text-primary">{activeGiftAnimation.senderName}</p>
             <p className="text-xl font-bold uppercase tracking-widest">Launched {activeGiftAnimation.gift.name}!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-primary/50 shadow-lg">
            <AvatarImage src={room.coverUrl} />
            <AvatarFallback>UM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-black text-xl tracking-tight uppercase italic">{room.title}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
              <span>ID: {room.id.substring(0, 8)}</span>
              <div className="flex items-center gap-1 text-pink-400">
                <Users className="h-3 w-3" />
                <span>{onlineCount} Tribe</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
              <DropdownMenuLabel>Room Control</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManageRoom && (
                <DropdownMenuItem onClick={handleClearChat} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Clear Chat</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => toast({ title: 'Frequency Shared!' })}><Share2 className="mr-2 h-4 w-4" /> Share Room</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/20 text-red-500" onClick={() => window.location.href='/rooms'}>
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Broadcast Marquee */}
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

      {/* Voice Stage Grid */}
      <ScrollArea className="relative z-10 flex-1 px-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-6 space-y-12 pb-32">
          {/* Room Master Seat */}
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

          {/* Seat Matrix */}
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
                  </div>
                  <span className="text-[9px] font-black uppercase text-white/40 truncate w-14 text-center">
                    {occupant ? occupant.name : `Slot ${idx}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Real-time Feed */}
          <div className="mt-8 max-w-lg mx-auto space-y-3 px-4">
            {activeMessages.map((msg) => (
              <div key={msg.id} className={cn("flex items-start gap-2 animate-in fade-in", msg.type === 'gift' && "bg-primary/10 p-2 rounded-xl border border-primary/20")}>
                <span className={cn("text-[10px] font-black uppercase shrink-0 mt-1", msg.type === 'gift' ? "text-primary" : "text-blue-400")}>{msg.user.name}:</span>
                <p className={cn("text-xs font-body", msg.type === 'gift' ? "text-primary font-black italic" : "text-white/80")}>{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Stage Controls */}
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
              <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none">
                 <DialogHeader className="p-8 pb-0 text-center"><DialogTitle className="text-3xl font-black uppercase italic">Ummy Boutique</DialogTitle></DialogHeader>
                 <div className="p-8 pt-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2">
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

      {/* Interaction Modal */}
      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-none p-0 rounded-t-[2.5rem] overflow-hidden">
          <DialogHeader className="p-6 border-b border-gray-100"><DialogTitle className="text-center text-2xl text-gray-800 uppercase italic">Seat Options</DialogTitle></DialogHeader>
          <div className="flex flex-col text-center divide-y divide-gray-100">
            {selectedSeatIndex !== null && (
              <button onClick={() => { const occ = participants?.find(p => p.seatIndex === selectedSeatIndex); if (occ) { setGiftRecipient({ uid: occ.uid, name: occ.name, avatarUrl: occ.avatarUrl }); setIsGiftPickerOpen(true); } setIsActionMenuOpen(false); }} className="py-5 font-black text-primary uppercase tracking-widest text-xs italic">Send Gift</button>
            )}
            <button onClick={() => { setIsMicOn(!isMicOn); setIsActionMenuOpen(false); }} className="py-5 font-bold text-gray-700 uppercase tracking-widest text-xs">{isMicOn ? 'Turn Off Mic' : 'Turn On Mic'}</button>
            <button onClick={leaveSeat} className="py-6 font-black text-destructive uppercase tracking-widest text-sm italic">Exit Seat</button>
            <button onClick={() => setIsActionMenuOpen(false)} className="py-6 font-bold text-gray-400 bg-gray-50/50 text-[10px]">Cancel</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
