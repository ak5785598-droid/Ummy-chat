
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
  Gift as GiftIcon,
  Users,
  Crown,
  Settings,
  Share2,
  Volume2,
  Trash2,
  LogOut,
  UserPlus,
  Zap,
  Megaphone,
  UserCheck,
  Ban,
  ChevronDown,
  AlertTriangle,
  User as UserIcon,
  RefreshCw,
  Gamepad2,
} from 'lucide-react';
import type { Room, RoomParticipant, Gift } from '@/lib/types';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  increment,
  writeBatch,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { useWebRTC } from '@/hooks/use-webrtc';

/**
 * High-Tier Gift Definitions.
 */
const AVAILABLE_GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', emoji: '🌹', price: 10, animationType: 'pulse' },
  { id: 'heart', name: 'Heart', emoji: '💖', price: 50, animationType: 'zoom' },
  { id: 'ring', name: 'Ring', emoji: '💍', price: 500, animationType: 'bounce' },
  { id: 'car', name: 'Luxury Car', emoji: '🏎️', price: 2000, animationType: 'bounce' },
  { id: 'jet', name: 'Private Jet', emoji: '🛩️', price: 5000, animationType: 'bounce' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', price: 10000, animationType: 'spin' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', price: 25000, animationType: 'zoom' },
  { id: 'castle', name: 'Castle', emoji: '🏰', price: 50000, animationType: 'bounce' },
  { id: 'galaxy', name: 'Galaxy', emoji: '🌌', price: 100000, animationType: 'zoom' },
  { id: 'supernova', name: 'Supernova', emoji: '💥', price: 250000, animationType: 'zoom' },
];

/**
 * AUDIO PLAYER COMPONENT
 * Renders an invisible audio element for a remote peer.
 */
function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream;
  }, [stream]);
  return <audio ref={audioRef} autoPlay className="hidden" />;
}

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, currentUser]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;

  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  const isMicOn = isInSeat && !currentUserParticipant?.isMuted;

  // WEBRTC INTEGRATION
  const { remoteStreams } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true);

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

  useEffect(() => {
    const lastMsg = firestoreMessages?.[firestoreMessages.length - 1];
    if (lastMsg?.type === 'gift' && lastMsg.giftId) {
      setActiveGiftAnimation(null);
      setTimeout(() => setActiveGiftAnimation(lastMsg.giftId), 50);
    }
  }, [firestoreMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    const roomDocRef = doc(firestore, 'chatRooms', room.id);
    
    let finalRecipient = giftRecipient;
    if (!finalRecipient) {
      const host = participants?.find(p => p.seatIndex === 1);
      if (host) finalRecipient = { uid: host.uid, name: host.name, avatarUrl: host.avatarUrl };
      else finalRecipient = { uid: currentUser.uid, name: userProfile.username, avatarUrl: userProfile.avatarUrl };
    }

    const isSelfGifting = finalRecipient.uid === currentUser.uid;
    const walletUpdates: any = {
      'wallet.coins': increment(-gift.price),
      'wallet.totalSpent': increment(gift.price),
      updatedAt: serverTimestamp()
    };

    const diamondReturn = Math.floor(gift.price * 0.4);

    if (isSelfGifting) {
      walletUpdates['wallet.diamonds'] = increment(diamondReturn);
      walletUpdates['stats.fans'] = increment(gift.price);
    }

    updateDocumentNonBlocking(userRef, walletUpdates);
    updateDocumentNonBlocking(profileRef, walletUpdates);

    updateDocumentNonBlocking(roomDocRef, { 
      'stats.totalGifts': increment(gift.price), 
      updatedAt: serverTimestamp() 
    });

    if (!isSelfGifting) {
      const rRef = doc(firestore, 'users', finalRecipient.uid);
      const rpRef = doc(firestore, 'users', finalRecipient.uid, 'profile', finalRecipient.uid);
      const recipientUpdates = { 
        'stats.fans': increment(gift.price), 
        'wallet.diamonds': increment(diamondReturn),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(rRef, recipientUpdates);
      updateDocumentNonBlocking(rpRef, recipientUpdates);
    }

    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: `sent ${isSelfGifting ? 'themselves' : finalRecipient.name} a ${gift.name} ${gift.emoji}!`,
      senderId: currentUser.uid,
      senderName: userProfile.username,
      senderAvatar: userProfile.avatarUrl,
      chatRoomId: room.id,
      timestamp: serverTimestamp(),
      type: 'gift',
      giftId: gift.id,
      recipientName: finalRecipient.name
    });

    setIsGiftPickerOpen(false);
    setGiftRecipient(null);
  };

  const handleClearChat = async () => {
    if (!canManageRoom || !firestore || !room.id) return;
    try {
      const snap = await getDocs(collection(firestore, 'chatRooms', room.id, 'messages'));
      const batch = writeBatch(firestore);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast({ title: 'Chat Cleared' });
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `chatRooms/${room.id}/messages`,
          operation: 'delete',
        }));
      }
    }
  };

  const handleDeleteRoom = async () => {
    if (!firestore || !room.id || (!isOwner && !isGlobalAdmin)) return;
    setIsDeleting(true);
    try {
      const participantsSnap = await getDocs(collection(firestore, 'chatRooms', room.id, 'participants'));
      const batch = writeBatch(firestore);
      participantsSnap.docs.forEach(d => batch.delete(d.ref));
      batch.delete(doc(firestore, 'chatRooms', room.id));
      await batch.commit();
      setActiveRoom(null);
      router.push('/rooms');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSeatLock = (index: number) => {
    if (!canManageRoom || !firestore || !room.id) return;
    const isLocked = room.lockedSeats?.includes(index);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
      lockedSeats: isLocked ? arrayRemove(index) : arrayUnion(index)
    });
  };

  const silenceParticipant = (uid: string, currentState: boolean) => {
    if (!canManageRoom || !firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), {
      isSilenced: !currentState,
      isMuted: true
    });
  };

  const kickParticipant = (uid: string) => {
    if (!canManageRoom || !firestore || !room.id) return;
    deleteDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid));
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
      isMuted: true 
    });
  };

  const leaveSeat = () => {
    if (!firestore || !room.id || !currentUser) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { 
      seatIndex: 0,
      isMuted: true 
    });
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
    if (!isInSeat) {
      const first = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].find(i => !participants?.some(p => p.seatIndex === i) && !room.lockedSeats?.includes(i));
      if (first) takeSeat(first);
      return;
    }
    if (currentUserParticipant?.isSilenced) {
      toast({ variant: 'destructive', title: 'Silenced by Admin' });
      return;
    }
    const nextMuteState = !currentUserParticipant?.isMuted;
    if (firestore && currentUser && room.id) {
      updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: nextMuteState });
    }
  };

  const hostParticipant = participants?.find(p => p.seatIndex === 1);
  const selectedOccupant = participants?.find(p => p.seatIndex === selectedSeatIndex);

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl border border-white/5 animate-in fade-in duration-700">
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      
      {/* Remote Audio Streams */}
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} />
      ))}

      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-blue-900/40 to-black z-10" />
        <img src="https://images.unsplash.com/photo-1464802686167-b939a67e06a1?q=80&w=2070&auto=format&fit=crop" className="h-full w-full object-cover scale-110" alt="Room Vibe" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={minimizeRoom} className="bg-white/10 p-2 rounded-full mr-1 hover:bg-white/20 transition-all">
             <ChevronDown className="h-5 w-5" />
          </button>
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer group">
                <Avatar className="h-12 w-12 rounded-xl border-2 border-primary/50 shadow-lg group-hover:scale-105 transition-transform">
                  <AvatarImage src={room.coverUrl} />
                  <AvatarFallback>UM</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-black text-xl tracking-tight uppercase italic">{room.title}</h1>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
                    <span>No: {room.roomNumber || '000000'}</span>
                    <div className="flex items-center gap-1 text-pink-400">
                      <Users className="h-3 w-3" />
                      <span>{onlineCount} Tribe</span>
                    </div>
                  </div>
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
                       <div key={p.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2 duration-300">
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
              
              {(isOwner || isGlobalAdmin) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive font-black">
                      <AlertTriangle className="mr-2 h-4 w-4" /> Delete Frequency
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white text-black border-none rounded-[2rem]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black uppercase italic">Terminate Frequency?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground font-body text-base">
                        This will permanently delete the tribe. All messages and participants will be disconnected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-white rounded-full">
                        {isDeleting ? <Loader className="animate-spin h-4 w-4" /> : 'Delete Permanently'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

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
                      <div className="absolute -inset-4 rounded-full border-2 border-primary animate-voice-wave" />
                   )}
                   <AvatarFrame frameId={hostParticipant?.activeFrame} size="xl">
                      <div 
                        onClick={() => handleSeatClick(1, hostParticipant)}
                        className={cn(
                          "h-28 w-28 rounded-full flex items-center justify-center transition-all cursor-pointer bg-black/40 backdrop-blur-md border-2",
                          hostParticipant ? "border-primary shadow-[0_0_20px_rgba(255,204,0,0.4)]" : "border-white/10"
                        )}
                      >
                        {hostParticipant ? (
                          <Avatar className="h-full w-full p-1"><AvatarImage src={hostParticipant.avatarUrl} /><AvatarFallback>H</AvatarFallback></Avatar>
                        ) : <Crown className="h-10 w-10 text-white/10" />}
                      </div>
                   </AvatarFrame>
                </div>
                <Badge className="bg-primary text-black text-[10px] font-black uppercase italic animate-pulse">Room Master</Badge>
             </div>
          </div>

          <div className="grid grid-cols-4 gap-x-4 gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => {
              const idx = i + 2; 
              const occupant = participants?.find(p => p.seatIndex === idx);
              const isLocked = room.lockedSeats?.includes(idx);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 group">
                  <div className="relative">
                    {occupant && !occupant.isMuted && (
                       <div className="absolute -inset-2 rounded-full border-2 border-primary animate-voice-wave" />
                    )}
                    <AvatarFrame frameId={occupant?.activeFrame} size="md">
                      <div 
                        onClick={() => handleSeatClick(idx, occupant)}
                        className={cn(
                          "h-16 w-16 rounded-full flex items-center justify-center transition-all cursor-pointer bg-black/30 backdrop-blur-lg border-2 hover:scale-110",
                          isLocked ? "border-red-500/30" : "border-purple-500/30",
                          occupant && "border-primary shadow-lg shadow-primary/10",
                        )}
                      >
                        {isLocked ? <Lock className="h-6 w-6 text-red-500/40" /> : occupant ? (
                          <Avatar className="h-full w-full p-0.5"><AvatarImage src={occupant.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                        ) : <Mic className="h-6 w-6 text-white/20" />}
                      </div>
                    </AvatarFrame>
                    {occupant?.isMuted && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-black shadow-lg">
                        <MicOff className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase truncate w-14 text-center transition-colors",
                    occupant ? "text-primary" : "text-white/40"
                  )}>
                    {occupant ? occupant.name : `Slot ${idx}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 max-w-lg mx-auto space-y-3 px-4">
            {activeMessages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300", 
                msg.type === 'gift' && "bg-primary/10 p-2 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(255,204,0,0.1)]",
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
          <form className="flex-1 flex items-center bg-blue-900/40 backdrop-blur-xl rounded-full border border-white/10 h-12 px-5 group focus-within:border-primary/50 transition-colors" onSubmit={handleSendMessage}>
            <Input placeholder="Share a vibe..." className="bg-transparent border-none text-xs text-white placeholder:text-white/40 focus-visible:ring-0" value={messageText} onChange={(e) => setMessageText(e.target.value)} disabled={isSending} />
            <button type="submit" disabled={isSending || !messageText.trim()} className="text-white hover:text-primary transition-colors"><Send className="h-5 w-5" /></button>
          </form>
          <div className="flex items-center gap-3">
            <Button onClick={handleMicToggle} className={cn("rounded-full h-12 w-12 transition-all shadow-lg", isInSeat ? (isMicOn ? "bg-primary text-black scale-110" : "bg-white/10 text-white/40") : "bg-white/5")}>
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button 
              onClick={() => router.push('/games')}
              className="rounded-full h-12 w-12 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 shadow-lg shadow-blue-500/10 transition-all hover:scale-110"
            >
              <Gamepad2 className="h-6 w-6" />
            </Button>

            <Dialog open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-600 animate-pulse shadow-xl shadow-pink-500/20 hover:scale-110 transition-transform">
                   <GiftIcon className="h-7 w-7 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                 <DialogHeader className="p-8 pb-0 text-center"><DialogTitle className="text-3xl font-black uppercase italic">Ummy Boutique</DialogTitle></DialogHeader>
                 <div className="p-8 pt-6 space-y-6">
                    <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-2xl border-2 border-dashed border-primary/20">
                       <div className="flex items-center gap-3">
                          <div className="relative">
                             <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarImage src={giftRecipient?.avatarUrl || hostParticipant?.avatarUrl || userProfile?.avatarUrl} />
                                <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                             </Avatar>
                             <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full ring-2 ring-white">
                                <UserCheck className="h-3 w-3" />
                             </div>
                          </div>
                          <div>
                             <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Gifting Recipient</p>
                             <p className="text-sm font-black uppercase italic text-primary">
                                {giftRecipient?.uid === currentUser?.uid ? 'Myself' : (giftRecipient?.name || hostParticipant?.name || 'The Frequency')}
                             </p>
                          </div>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => {
                           if (giftRecipient?.uid === currentUser?.uid) {
                             setGiftRecipient(null);
                           } else {
                             setGiftRecipient({ uid: currentUser!.uid, name: userProfile!.username, avatarUrl: userProfile!.avatarUrl });
                           }
                         }}
                         className="rounded-full text-[10px] font-black uppercase italic tracking-widest text-primary hover:bg-primary/10 transition-all active:scale-95"
                       >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {giftRecipient?.uid === currentUser?.uid ? 'Switch to Host' : 'Gift Myself'}
                       </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
                       {AVAILABLE_GIFTS.map(g => (
                         <button key={g.id} onClick={() => handleSendGift(g)} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-secondary/50 hover:bg-primary/20 transition-all border-2 border-transparent hover:border-primary group active:scale-90">
                            <span className="text-4xl group-hover:scale-125 transition-transform duration-300">{g.emoji}</span>
                            <div className="text-center">
                               <p className="text-[10px] font-black uppercase truncate w-20">{g.name}</p>
                               <div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary"><Zap className="h-3 w-3 fill-current" />{g.price}</div>
                            </div>
                         </button>
                       ))}
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                       <span className="text-xs font-black uppercase opacity-60">Your Balance</span>
                       <div className="flex items-center gap-2 font-black text-primary italic text-xl"><Zap className="h-5 w-5 fill-current" />{userProfile?.wallet?.coins || 0}</div>
                    </div>
                 </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </footer>

      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[2.5rem] overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500">
          <DialogHeader className="p-6 border-b border-gray-100">
            <DialogTitle className="text-center text-2xl text-gray-800 uppercase italic">
              {selectedOccupant ? `Tribe: ${selectedOccupant.name}` : `Seat ${selectedSeatIndex}`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-gray-100">
            {selectedOccupant && (
              <button 
                onClick={() => { setGiftRecipient({ uid: selectedOccupant.uid, name: selectedOccupant.name, avatarUrl: selectedOccupant.avatarUrl }); setIsGiftPickerOpen(true); setIsActionMenuOpen(false); }} 
                className="py-5 font-black text-primary uppercase tracking-widest text-xs italic hover:bg-gray-50 active:scale-95 transition-all"
              >
                Send Gift
              </button>
            )}

            {canManageRoom && (
              <>
                {selectedOccupant ? (
                  <>
                    <button 
                      onClick={() => silenceParticipant(selectedOccupant.uid, selectedOccupant.isSilenced ?? false)} 
                      className="py-5 font-bold text-gray-700 uppercase tracking-widest text-xs hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      {selectedOccupant.isSilenced ? <Volume2 className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      {selectedOccupant.isSilenced ? 'Unsilence Tribe' : 'Silence Tribe'}
                    </button>
                    {selectedOccupant.uid !== currentUser?.uid && (
                      <button 
                        onClick={() => kickParticipant(selectedOccupant.uid)} 
                        className="py-5 font-black text-destructive uppercase tracking-widest text-xs italic hover:bg-red-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Ban className="h-4 w-4" /> Kick Tribe
                      </button>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={() => toggleSeatLock(selectedSeatIndex!)} 
                    className="py-5 font-bold text-purple-600 uppercase tracking-widest text-xs hover:bg-purple-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
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
                className="py-5 font-black text-red-500 uppercase tracking-widest text-xs italic hover:bg-red-50 active:scale-95 transition-all"
              >
                Exit Seat
              </button>
            ) : !selectedOccupant && !room.lockedSeats?.includes(selectedSeatIndex!) && (
              <button 
                onClick={() => takeSeat(selectedSeatIndex!)} 
                className="py-5 font-black text-blue-600 uppercase tracking-widest text-xs italic hover:bg-blue-50 active:scale-95 transition-all"
              >
                Take Seat
              </button>
            )}

            <button onClick={() => setIsActionMenuOpen(false)} className="py-5 font-bold text-gray-400 bg-gray-50/50 text-[10px] uppercase tracking-widest hover:text-gray-600">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
