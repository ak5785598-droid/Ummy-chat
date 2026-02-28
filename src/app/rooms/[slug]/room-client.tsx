'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
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
  Megaphone,
  UserCheck,
  Ban,
  ChevronDown,
  AlertTriangle,
  User as UserIcon,
  RefreshCw,
  Gamepad2,
  ShieldCheck,
  Smile,
  Camera,
  MessageSquareOff,
  MessageSquare,
  Music,
  Play,
  Square,
  PawPrint,
  Dices,
  Sparkles,
  Car,
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
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
  DialogDescription,
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
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
  arrayRemove,
} from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { useWebRTC } from '@/hooks/use-webrtc';
import { EmojiReactionOverlay } from '@/components/emoji-reaction-overlay';
import { useRoomImageUpload } from '@/hooks/use-room-image-upload';
import { DailyRewardDialog } from '@/components/daily-reward-dialog';

const GoldenMicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="micGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="url(#micGoldGrad)" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="url(#micGoldGrad)" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="23" stroke="url(#micGoldGrad)" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="23" x2="16" y2="23" stroke="url(#micGoldGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function calculateRichLevel(spent: number = 0) {
  if (spent < 50000) return 1;
  if (spent < 100000) return 2;
  if (spent < 1000000) return 3;
  if (spent < 5000000) return 4;
  if (spent < 10000000) return Math.floor(5 + ((spent - 5000000) / 5000000) * 5);
  if (spent < 100000000) return Math.floor(10 + ((spent - 10000000) / 90000000) * 10);
  if (spent < 1000000000) return Math.floor(20 + ((spent - 100000000) / 900000000) * 10);
  if (spent < 5000000000) return Math.floor(30 + ((spent - 1000000000) / 4000000000) * 10);
  if (spent < 90000000000) return Math.floor(40 + ((spent - 5000000000) / 85000000000) * 10);
  return 50;
}

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
  { id: 'rolex', name: 'Rolex', emoji: '⌚', price: 500000, animationType: 'zoom' },
  { id: 'celebration', name: 'Celebration', emoji: '🥳', price: 1000000, animationType: 'zoom' },
];

const AVAILABLE_EMOJIS = ['😀', '😂', '😘', '🥰', '😎', '🤗', '😡', '😭', '💋'];

const MUSIC_TRACKS = [
  { id: 'lofi', name: 'Lofi Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'jazz', name: 'Midnight Jazz', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'ambient', name: 'Deep Space', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'chill', name: 'Ocean Breeze', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream;
  }, [stream]);
  return <audio ref={audioRef} autoPlay className="hidden" />;
}

const FruitMixIcon = ({ className }: { className?: string }) => (
  <div className={cn("grid grid-cols-2 gap-0.5 items-center justify-center p-0.5", className)}>
    <span className="text-[10px] leading-none">🍊</span>
    <span className="text-[10px] leading-none">🍉</span>
    <span className="text-[10px] leading-none">🍌</span>
    <span className="text-[10px] leading-none">🍓</span>
  </div>
);

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGamesDialogOpen, setIsGamesDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [showGiftEffects, setShowGiftEffects] = useState(true);
  const [showEntryEffects, setShowEntryEffects] = useState(true);
  const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const roomDpInputRef = useRef<HTMLInputElement>(null);
  const roomAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { isUploading: isRoomImageUploading, uploadRoomImage } = useRoomImageUpload(room.id);
  const { setActiveRoom, setIsMinimized } = useRoomContext();

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
  const { remoteStreams } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'), limitToLast(50));
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
    if (!showGiftEffects) return;
    const lastMsg = firestoreMessages?.[firestoreMessages.length - 1];
    if (lastMsg?.type === 'gift' && lastMsg.giftId) {
      setActiveGiftAnimation(null);
      setTimeout(() => setActiveGiftAnimation(lastMsg.giftId), 50);
    }
  }, [firestoreMessages, showGiftEffects]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [activeMessages]);

  useEffect(() => {
    if (roomAudioRef.current) {
      if (room.currentMusicUrl) { roomAudioRef.current.src = room.currentMusicUrl; roomAudioRef.current.play().catch(() => {}); }
      else { roomAudioRef.current.pause(); roomAudioRef.current.src = ''; }
    }
  }, [room.currentMusicUrl]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || isSending || !userProfile) return;
    if (room.isChatMuted && !canManageRoom) { toast({ variant: 'destructive', title: 'Chat Disabled' }); return; }
    setIsSending(true);
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: messageText, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || '', chatRoomId: room.id, timestamp: serverTimestamp(), type: 'text'
    });
    setMessageText('');
    setIsSending(false);
  };

  const handleSendEmoji = async (emoji: string) => {
    if (!currentUser || !firestore || !userProfile) return;
    if (currentUserParticipant) {
      const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
      updateDocumentNonBlocking(participantRef, { activeEmoji: emoji });
      setTimeout(() => { updateDocumentNonBlocking(participantRef, { activeEmoji: null }); }, 4000);
    }
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: emoji, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || '', chatRoomId: room.id, timestamp: serverTimestamp(), type: 'emoji'
    });
    setIsEmojiPickerOpen(false);
  };

  const handleSendGift = async (gift: Gift) => {
    if (!currentUser || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < gift.price) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
    const userRef = doc(firestore, 'users', currentUser.uid);
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    const roomDocRef = doc(firestore, 'chatRooms', room.id);
    let finalRecipient = giftRecipient || (participants?.find(p => p.seatIndex === 1) ? { uid: participants.find(p => p.seatIndex === 1)!.uid, name: participants.find(p => p.seatIndex === 1)!.name, avatarUrl: participants.find(p => p.seatIndex === 1)!.avatarUrl } : { uid: currentUser.uid, name: userProfile.username, avatarUrl: userProfile.avatarUrl });
    const isSelfGifting = finalRecipient.uid === currentUser.uid;
    const newTotalSpent = (userProfile.wallet?.totalSpent || 0) + gift.price;
    const walletUpdates: any = { 'wallet.coins': increment(-gift.price), 'wallet.totalSpent': increment(gift.price), 'wallet.dailySpent': increment(gift.price), 'level.rich': calculateRichLevel(newTotalSpent), updatedAt: serverTimestamp() };
    const diamondReturn = Math.floor(gift.price * 0.4);
    if (isSelfGifting) { walletUpdates['wallet.diamonds'] = increment(diamondReturn); walletUpdates['stats.fans'] = increment(gift.price); walletUpdates['stats.dailyFans'] = increment(gift.price); }
    updateDocumentNonBlocking(userRef, walletUpdates);
    updateDocumentNonBlocking(profileRef, walletUpdates);
    updateDocumentNonBlocking(roomDocRef, { 'stats.totalGifts': increment(gift.price), 'stats.dailyGifts': increment(gift.price), updatedAt: serverTimestamp() });
    if (!isSelfGifting) {
      const rRef = doc(firestore, 'users', finalRecipient.uid);
      const rpRef = doc(firestore, 'users', finalRecipient.uid, 'profile', finalRecipient.uid);
      const recipientUpdates = { 'stats.fans': increment(gift.price), 'stats.dailyFans': increment(gift.price), 'wallet.diamonds': increment(diamondReturn), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(rRef, recipientUpdates);
      updateDocumentNonBlocking(rpRef, recipientUpdates);
    }
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), { content: `sent ${isSelfGifting ? 'themselves' : finalRecipient.name} a ${gift.name} ${gift.emoji}!`, senderId: currentUser.uid, senderName: userProfile.username, senderAvatar: userProfile.avatarUrl, chatRoomId: room.id, timestamp: serverTimestamp(), type: 'gift', giftId: gift.id, recipientName: finalRecipient.name });
    setIsGiftPickerOpen(false); setGiftRecipient(null);
  };

  const handleClearChat = async () => {
    if (!canManageRoom || !firestore || !room.id) return;
    try {
      const snap = await getDocs(collection(firestore, 'chatRooms', room.id, 'messages'));
      const batch = writeBatch(firestore);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setIsClearChatConfirmOpen(false);
      toast({ title: 'Frequency Cleaned', description: 'All messages have been synchronized to void.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    }
  };

  const toggleRoomMessages = () => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { isChatMuted: !room.isChatMuted }); };
  const handleToggleMusic = (url: string) => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { currentMusicUrl: room.currentMusicUrl === url ? null : url }); };
  const handleDeleteRoom = async () => { if (!firestore || !room.id || (!isOwner && !isGlobalAdmin)) return; setIsDeleting(true); try { const participantsSnap = await getDocs(collection(firestore, 'chatRooms', room.id, 'participants')); const batch = writeBatch(firestore); participantsSnap.docs.forEach(d => batch.delete(d.ref)); batch.delete(doc(firestore, 'chatRooms', room.id)); await batch.commit(); setActiveRoom(null); router.push('/rooms'); } finally { setIsDeleting(false); } };
  const toggleSeatLock = (index: number) => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { lockedSeats: room.lockedSeats?.includes(index) ? arrayRemove(index) : arrayUnion(index) }); };
  const silenceParticipant = (uid: string, currentState: boolean) => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { isSilenced: !currentState, isMuted: true }); };
  const kickParticipant = (uid: string) => { if (!canManageRoom || !firestore || !room.id) return; deleteDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid)); setIsActionMenuOpen(false); };
  const leaveRoom = () => { setActiveRoom(null); router.push('/rooms'); };
  const minimizeRoom = () => { setIsMinimized(true); router.push('/rooms'); };
  const takeSeat = (index: number) => { if (!firestore || !room.id || !currentUser || !userProfile) return; if (room.lockedSeats?.includes(index)) { toast({ variant: 'destructive', title: 'Slot Locked' }); return; } updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: index, isMuted: true, activeWave: userProfile.inventory?.activeWave || 'Default' }); };
  const leaveSeat = () => { if (!firestore || !room.id || !currentUser) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: 0, isMuted: true }); setIsActionMenuOpen(false); };
  const handleMicToggle = () => { if (!isInSeat) { const first = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].find(i => !participants?.some(p => p.seatIndex === i) && !room.lockedSeats?.includes(i)); if (first) takeSeat(first); return; } if (currentUserParticipant?.isSilenced) { toast({ variant: 'destructive', title: 'Silenced' }); return; } if (firestore && currentUser && room.id) { updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); } };

  const handleSeatClick = (index: number, occupant?: RoomParticipant) => {
    setSelectedSeatIndex(index);
    setIsActionMenuOpen(true);
  };

  const hostParticipant = participants?.find(p => p.seatIndex === 1);
  const selectedOccupant = participants?.find(p => p.seatIndex === selectedSeatIndex);
  const getWaveColor = (waveId?: string) => waveId === 'w1' ? 'text-cyan-500' : waveId === 'w2' ? 'text-orange-600' : 'text-primary';

  const ToolTile = ({ icon: Icon, label, active, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} className={cn("flex flex-col items-center gap-2 transition-all active:scale-95", disabled && "opacity-30 grayscale cursor-not-allowed")}>
      <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-colors", active ? "bg-primary/20 border-primary text-primary" : "bg-slate-800/50 border-white/5 text-white/60 hover:bg-slate-800")}><Icon className="h-7 w-7" /></div>
      <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">{label}</span>
    </button>
  );

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl border border-white/5 animate-in fade-in duration-700">
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <audio ref={roomAudioRef} loop crossOrigin="anonymous" />
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => <RemoteAudio key={peerId} stream={stream} />)}
      
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b] via-[#022c22] to-black z-10 opacity-95" />
        <Image src="https://picsum.photos/seed/geometric-emerald/1200/2400" alt="Emerald Theme" fill className="object-cover scale-110 opacity-30 mix-blend-overlay" data-ai-hint="green geometric" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10b981]/10 rounded-full blur-[120px] z-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#059669]/10 rounded-full blur-[120px] z-20 animate-pulse delay-700" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={minimizeRoom} className="bg-white/10 p-2 rounded-full mr-1 hover:bg-white/20 transition-all"><ChevronDown className="h-5 w-5" /></button>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative group/avatar">
              <Avatar className="h-12 w-12 rounded-xl border-2 border-primary/50 shadow-lg group-hover/avatar:scale-105 transition-transform"><AvatarImage key={room.coverUrl} src={room.coverUrl} /><AvatarFallback>UM</AvatarFallback></Avatar>
              {canManageRoom && <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer z-20" onClick={(e) => { e.stopPropagation(); roomDpInputRef.current?.click(); }}>{isRoomImageUploading ? <Loader className="h-4 w-4 animate-spin text-white" /> : <Camera className="h-4 w-4 text-white" />}</div>}
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <div>
                  <h1 className="font-black text-xl tracking-tight uppercase italic">{room.title}</h1>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
                    <span>No: {room.roomNumber || '000000'}</span>
                    <div className="flex items-center gap-1 text-pink-400"><Users className="h-3 w-3" /><span>{onlineCount} Tribe</span></div>
                  </div>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-slate-900 border-none rounded-t-[3rem] text-white p-0 overflow-hidden h-[70vh]">
                <SheetHeader className="p-8 pb-4">
                  <SheetTitle className="text-2xl font-black uppercase italic text-center">Frequency Members</SheetTitle>
                  <SheetDescription className="sr-only">A list of all tribe members currently in this frequency.</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-full px-8 pb-20">
                  <div className="space-y-4">
                    {participants?.map((p) => { 
                      const isPMod = room.moderatorIds?.includes(p.uid); 
                      const isPOwner = p.uid === room.ownerId; 
                      return (
                        <div key={p.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <AvatarFrame frameId={p.activeFrame} size="sm">
                              <Avatar><AvatarImage src={p.avatarUrl} /><AvatarFallback>{p.name.charAt(0)}</AvatarFallback></Avatar>
                            </AvatarFrame>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm">{p.name}</p>
                                {isPOwner ? <Crown className="h-3 w-3 text-yellow-500 fill-current" /> : isPMod ? <ShieldCheck className="h-3 w-3 text-blue-400 fill-current" /> : null}
                              </div>
                              <div className="flex items-center gap-2">
                                {isPOwner && <Badge className="bg-yellow-500 text-black text-[8px] h-4">OWNER</Badge>}
                                {isPMod && <Badge className="bg-blue-500 text-[8px] h-4">MOD</Badge>}
                                {p.seatIndex > 0 && <Badge variant="outline" className="text-[8px] h-4 text-primary border-primary/20">SEAT {p.seatIndex}</Badge>}
                              </div>
                            </div>
                          </div>
                          {p.isMuted && <MicOff className="h-4 w-4 text-red-500/50" />}
                        </div>
                      ); 
                    })}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors"><Share2 className="h-5 w-5" /></button></DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-white/10 text-white w-56">
              <DropdownMenuLabel>Tribe Sync</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { const link = `${window.location.origin}/rooms/${room.id}`; navigator.clipboard.writeText(link); toast({ title: 'Link Copied' }); }}><UserPlus className="mr-2 h-4 w-4" /> Invite Tribe</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}> <Share2 className="mr-2 h-4 w-4" /> Share Room</DropdownMenuItem>
              <DropdownMenuSeparator />
              {(isOwner || isGlobalAdmin) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive font-black"><AlertTriangle className="mr-2 h-4 w-4" /> Terminate Frequency</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white text-black border-none rounded-[2rem]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black uppercase italic">Terminate Frequency?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground font-body text-base">This will permanently delete the tribe frequency.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-white rounded-full">{isDeleting ? <Loader className="animate-spin h-4 w-4" /> : 'Terminate Now'}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <DropdownMenuItem onClick={leaveRoom}><LogOut className="mr-2 h-4 w-4" /> Leave Room</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/20 text-red-500" onClick={leaveRoom}><PhoneOff className="h-5 w-5" /></Button>
        </div>
      </header>

      <div className="relative z-50 px-6 py-1">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full h-8 flex items-center overflow-hidden px-4 gap-3">
          <Megaphone className="h-3 w-3 text-primary shrink-0" />
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 animate-marquee inline-block">{room.announcement || 'Welcome to the frequency! Keep the vibes high.'}</p>
          </div>
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 py-8 px-4 overflow-y-auto no-scrollbar max-h-[60%]">
          <div className="flex justify-center mb-8">
             <div className="relative flex flex-col items-center gap-2">
                <EmojiReactionOverlay emoji={hostParticipant?.activeEmoji} size="xl" />
                <div className="relative">
                  {hostParticipant && !hostParticipant.isMuted && (<div className={cn("absolute -inset-2 rounded-full border-2 animate-voice-wave", getWaveColor(hostParticipant.activeWave))} />)}
                  <AvatarFrame frameId={hostParticipant?.activeFrame} size="xl">
                    <div onClick={() => handleSeatClick(1, hostParticipant)} className={cn(
                      "h-32 w-32 rounded-full flex items-center justify-center transition-all cursor-pointer bg-gradient-to-br from-[#0a1a0a] to-[#020502] border-[4px] border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4),inset_0_0_15px_rgba(0,0,0,0.8),0_0_0_2px_rgba(251,191,36,0.2)]",
                      "relative overflow-hidden"
                    )}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent rounded-full h-3/4 pointer-events-none z-10" />
                      {hostParticipant ? (
                        <Avatar className="h-full w-full p-1"><AvatarImage src={hostParticipant.avatarUrl} /><AvatarFallback>H</AvatarFallback></Avatar>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full relative">
                           <GoldenMicIcon className="h-16 w-16 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                        </div>
                      )}
                    </div>
                  </AvatarFrame>
                </div>
                <span className="text-lg font-black text-white italic tracking-tighter drop-shadow-md">1</span>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-x-4 gap-y-12 max-w-md mx-auto">
            {Array.from({ length: 12 }).map((_, i) => {
              const idx = i + 2; 
              const occupant = participants?.find(p => p.seatIndex === idx); 
              const isLocked = room.lockedSeats?.includes(idx); 
              const isMod = room.moderatorIds?.includes(occupant?.uid || '');
              
              return (
                <div key={idx} className="relative flex flex-col items-center gap-2 group w-full animate-in zoom-in duration-300">
                  <EmojiReactionOverlay emoji={occupant?.activeEmoji} size="lg" />
                  <div className="relative">
                    {occupant && !occupant.isMuted && (<div className={cn("absolute -inset-1.5 rounded-full border-2 animate-voice-wave", getWaveColor(occupant.activeWave))} />)}
                    <AvatarFrame frameId={occupant?.activeFrame} size="lg">
                      <div onClick={() => handleSeatClick(idx, occupant)} className={cn(
                        "h-24 w-24 rounded-full flex items-center justify-center transition-all cursor-pointer bg-gradient-to-br from-[#0a1a0a] to-[#020502] border-[4px] border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4),inset_0_0_15px_rgba(0,0,0,0.8),0_0_0_2px_rgba(251,191,36,0.2)]",
                        "relative overflow-hidden",
                        isLocked && "border-red-500 shadow-[0_0_0_1px_#ef4444]"
                      )}>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent rounded-full h-3/4 pointer-events-none z-10" />
                        {occupant ? (
                          <Avatar className="h-full w-full p-0.5"><AvatarImage src={occupant.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                        ) : isLocked ? (
                          <Lock className="h-8 w-8 text-red-500/60" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                             <GoldenMicIcon className="h-12 w-12 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                          </div>
                        )}
                      </div>
                    </AvatarFrame>
                    {occupant?.isMuted && (<div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-1 border border-black shadow-lg"><MicOff className="h-4 w-4 text-white" /></div>)}
                    {isMod && (<div className="absolute -top-0.5 -left-0.5 bg-blue-500 rounded-full p-1 border border-black shadow-lg"><ShieldCheck className="h-4 w-4 text-white fill-current" /></div>)}
                  </div>
                  <span className={cn("text-base font-black italic text-center drop-shadow-md", occupant ? "text-[#fbbf24] truncate w-24" : "text-white")}>
                    {occupant ? occupant.name : idx}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 mt-2" ref={scrollRef}>
          <div className="max-w-lg mx-auto space-y-3 pb-4">
            {activeMessages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300", 
                msg.type === 'gift' && "bg-primary/10 p-2 rounded-xl border border-primary/20", 
                (msg.type === 'entrance' || msg.type === 'leave') && "bg-blue-500/10 p-1.5 px-3 rounded-full border border-blue-500/20 justify-center w-fit mx-auto", 
                msg.type === 'emoji' && "justify-center w-full py-2"
              )}>
                {msg.type === 'entrance' || msg.type === 'leave' ? (
                  <div className="flex items-center gap-2">
                    {msg.type === 'entrance' ? <UserCheck className="h-3 w-3 text-blue-400" /> : <LogOut className="h-3 w-3 text-red-400" />}
                    <p className={cn("text-[10px] font-black uppercase italic", msg.type === 'entrance' ? "text-blue-400" : "text-red-400")}>
                      {msg.user.name} <span className="opacity-60">{msg.text}</span>
                    </p>
                  </div>
                ) : msg.type === 'emoji' ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black uppercase text-white/40">{msg.user.name}</span>
                    <span className="text-5xl animate-bounce">{msg.text}</span>
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
        </ScrollArea>
      </main>

      <footer className="relative z-50 px-6 pb-12 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <form className="flex-1 flex items-center bg-blue-900/40 backdrop-blur-xl rounded-full border border-white/10 h-12 px-5 group focus-within:border-primary/50 transition-colors" onSubmit={handleSendMessage}>
            <Input placeholder={room.isChatMuted ? "Messages Disabled" : "Share a vibe..."} className="bg-transparent border-none text-xs text-white placeholder:text-white/40 focus-visible:ring-0" value={messageText} onChange={(e) => setMessageText(e.target.value)} disabled={isSending || (room.isChatMuted && !canManageRoom)} />
            <button type="submit" disabled={isSending || !messageText.trim() || (room.isChatMuted && !canManageRoom)} className="text-white hover:text-primary transition-colors"><Send className="h-5 w-5" /></button>
          </form>
          <div className="flex items-center gap-2">
            <Button onClick={handleMicToggle} className={cn("rounded-full h-12 w-12 transition-all shadow-lg", isInSeat ? (!currentUserParticipant?.isMuted ? "bg-primary text-black scale-110" : "bg-white/10 text-white/40") : "bg-white/5")}>
              {!currentUserParticipant?.isMuted && isInSeat ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Dialog open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <DialogTrigger asChild><Button className="rounded-full h-12 w-12 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 shadow-lg"><Smile className="h-6 w-6" /></Button></DialogTrigger>
              <DialogContent className="sm:max-w-xs bg-slate-900 text-white border-white/10 rounded-[2.5rem] p-6">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-center font-black uppercase italic text-sm tracking-widest">Tribe Reactions</DialogTitle>
                  <DialogDescription className="sr-only">Express your vibe with animated emojis visible to everyone in the frequency.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4">
                  {AVAILABLE_EMOJIS.map(emoji => (<button key={emoji} onClick={() => handleSendEmoji(emoji)} className="text-4xl hover:scale-125 transition-transform active:scale-90 p-3 bg-white/5 rounded-2xl hover:bg-white/10 flex items-center justify-center">{emoji}</button>))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isGamesDialogOpen} onOpenChange={setIsGamesDialogOpen}>
              <DialogTrigger asChild><Button className="rounded-full h-12 w-12 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-yellow-500/30 shadow-lg"><Gamepad2 className="h-6 w-6" /></Button></DialogTrigger>
              <DialogContent className="sm:max-w-md bg-[#0a0a0a] text-white p-0 rounded-t-[3rem] border-none overflow-hidden h-[60vh]">
                <DialogHeader className="p-8 pb-4 text-center">
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Room Play</DialogTitle>
                  <DialogDescription className="sr-only">Launch interactive 3D games to play with your tribe members in real-time.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-full px-8 pb-20">
                  <div className="grid grid-cols-4 gap-4">
                    <ToolTile icon={Gamepad2} label="Ludo" onClick={() => router.push('/games/ludo')} />
                    <ToolTile icon={FruitMixIcon} label="Fruit" onClick={() => router.push('/games/fruit-party')} />
                    <ToolTile icon={PawPrint} label="Wild" onClick={() => router.push('/games/forest-party')} />
                    <ToolTile icon={Dices} label="Slot" onClick={() => router.push('/games/lucky-slot-777')} />
                    <ToolTile icon={Sparkles} label="Pyramid" onClick={() => router.push('/games/pyramid-battle')} />
                    <ToolTile icon={Crown} label="Teen" onClick={() => router.push('/games/teen-patti')} />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen}>
              <DialogTrigger asChild><Button className="rounded-full h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-600 animate-pulse shadow-xl"><GiftIcon className="h-7 w-7 text-white" /></Button></DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                <DialogHeader className="p-8 pb-0 text-center">
                  <DialogTitle className="text-3xl font-black uppercase italic">Ummy Boutique</DialogTitle>
                  <DialogDescription className="sr-only">Select premium assets and high-tier gifts to synchronize with your chosen recipient.</DialogDescription>
                </DialogHeader>
                <div className="p-8 pt-6 space-y-6">
                  <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-2xl border-2 border-dashed border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm"><AvatarImage src={giftRecipient?.avatarUrl || hostParticipant?.avatarUrl || userProfile?.avatarUrl} /><AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback></Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full ring-2 ring-white"><UserCheck className="h-3 w-3" /></div>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Gifting Recipient</p>
                        <p className="text-sm font-black uppercase italic text-primary">{giftRecipient?.uid === currentUser?.uid ? 'Myself' : (giftRecipient?.name || hostParticipant?.name || 'The Frequency')}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { if (giftRecipient?.uid === currentUser?.uid) { setGiftRecipient(null); } else { setGiftRecipient({ uid: currentUser!.uid, name: userProfile!.username, avatarUrl: userProfile!.avatarUrl }); } }} className="rounded-full text-[10px] font-black uppercase italic tracking-widest text-primary hover:bg-primary/10"><RefreshCw className="h-3 w-3 mr-1" />{giftRecipient?.uid === currentUser?.uid ? 'Switch to Host' : 'Gift Myself'}</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
                    {AVAILABLE_GIFTS.map(g => (<button key={g.id} onClick={() => handleSendGift(g)} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-secondary/50 hover:bg-primary/20 transition-all border-2 border-transparent hover:border-primary group active:scale-90"><span className="text-4xl group-hover:scale-125 transition-transform duration-300">{g.emoji}</span><div className="text-center"><p className="text-[10px] font-black uppercase truncate w-20">{g.name}</p><div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary"><GoldCoinIcon className="h-3 w-3" />{g.price}</div></div></button>))}
                  </div>
                  <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-between shadow-inner"><span className="text-xs font-black uppercase opacity-60">Your Balance</span><div className="flex items-center gap-2 font-black text-primary italic text-xl"><GoldCoinIcon className="h-5 w-5" />{userProfile?.wallet?.coins || 0}</div></div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild><Button className="rounded-full h-12 w-12 bg-white/10 text-white hover:bg-white/20 border border-white/10"><Settings className="h-6 w-6" /></Button></DialogTrigger>
              <DialogContent className="sm:max-w-md bg-[#0a0a0a] text-white p-0 rounded-t-[3rem] border-none overflow-hidden h-[85vh]">
                <DialogHeader className="p-8 pb-4 text-center">
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Frequency Portal</DialogTitle>
                  <DialogDescription className="sr-only">Interactive dashboard for room entertainment and management tools.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-full px-8 pb-32">
                  <div className="space-y-10">
                    <section className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 ml-2">Room Play</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <ToolTile icon={Gamepad2} label="Ludo" onClick={() => router.push('/games/ludo')} />
                        <ToolTile icon={FruitMixIcon} label="Fruit" onClick={() => router.push('/games/fruit-party')} />
                        <ToolTile icon={PawPrint} label="Wild" onClick={() => router.push('/games/forest-party')} />
                        <ToolTile icon={Dices} label="Slot" onClick={() => router.push('/games/lucky-slot-777')} />
                        <ToolTile icon={Sparkles} label="Pyramid" onClick={() => router.push('/games/pyramid-battle')} />
                        <ToolTile icon={Crown} label="Teen" onClick={() => router.push('/games/teen-patti')} />
                      </div>
                    </section>
                    <section className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 ml-2">Tools</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <ToolTile icon={!currentUserParticipant?.isMuted && isInSeat ? Mic : MicOff} label="Voice" active={!currentUserParticipant?.isMuted && isInSeat} onClick={handleMicToggle} disabled={!isInSeat} />
                        <ToolTile icon={GiftIcon} label="Gift Effect" active={showGiftEffects} onClick={() => setShowGiftEffects(!showGiftEffects)} />
                        <ToolTile icon={Sparkles} label="Lucky Gift" onClick={() => setIsGiftPickerOpen(true)} />
                        <ToolTile icon={Car} label="Entry Effect" active={showEntryEffects} onClick={() => setShowEntryEffects(!showEntryEffects)} />
                        <ToolTile icon={Trash2} label="Clean" onClick={() => setIsClearChatConfirmOpen(true)} disabled={!canManageRoom} />
                        <ToolTile icon={room.isChatMuted ? MessageSquareOff : MessageSquare} label="Public Msg" active={!room.isChatMuted} onClick={toggleRoomMessages} disabled={!canManageRoom} />
                        <ToolTile icon={Music} label="Music" active={!!room.currentMusicUrl} onClick={() => setIsMusicMenuOpen(!isMusicMenuOpen)} />
                      </div>
                    </section>
                    {isMusicMenuOpen && (
                      <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 mb-4"><Music className="h-4 w-4 text-primary" /><h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">Room Radio</h4></div>
                        <div className="grid grid-cols-2 gap-3">{MUSIC_TRACKS.map(track => (<button key={track.id} onClick={() => handleToggleMusic(track.url)} disabled={!canManageRoom} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95", room.currentMusicUrl === track.url ? "bg-primary border-primary text-black shadow-lg shadow-primary/20" : "bg-slate-800/50 border-transparent text-white/60 hover:border-primary/20")}>{room.currentMusicUrl === track.url ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}<span className="text-[10px] font-black uppercase truncate w-full text-center">{track.name}</span></button>))}</div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </footer>

      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[2.5rem] overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500">
          <DialogHeader className="p-6 border-b border-gray-100">
            <DialogTitle className="text-center text-2xl text-gray-800 uppercase italic">{selectedOccupant ? `Tribe Member: ${selectedOccupant.name}` : `Seat ${selectedSeatIndex}`}</DialogTitle>
            <DialogDescription className="sr-only">Available actions for the selected tribe member or seat.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-gray-100">
            {selectedOccupant && (<button onClick={() => { setGiftRecipient({ uid: selectedOccupant.uid, name: selectedOccupant.name, avatarUrl: selectedOccupant.avatarUrl }); setIsGiftPickerOpen(true); setIsActionMenuOpen(false); }} className="py-5 font-black text-primary uppercase tracking-widest text-xs italic hover:bg-gray-50 active:scale-95 transition-all">Send Gift</button>)}
            {canManageRoom && (<>
              {selectedOccupant ? (<>
                <button onClick={() => silenceParticipant(selectedOccupant.uid, selectedOccupant.isSilenced ?? false)} className="py-5 font-bold text-gray-700 uppercase tracking-widest text-xs hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95 transition-all">{selectedOccupant.isSilenced ? <Volume2 className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}{selectedOccupant.isSilenced ? 'Unsilence Tribe' : 'Silence Tribe'}</button>
                {selectedOccupant.uid !== currentUser?.uid && (<button onClick={() => kickParticipant(selectedOccupant.uid)} className="py-5 font-black text-destructive uppercase tracking-widest text-xs italic hover:bg-red-50 flex items-center justify-center gap-2 active:scale-95 transition-all"><span className="flex items-center gap-2"><Ban className="h-4 w-4" /> Kick Tribe</span></button>)}
              </>) : (
                <button onClick={() => toggleSeatLock(selectedSeatIndex!)} className="py-5 font-bold text-purple-600 uppercase tracking-widest text-xs hover:bg-purple-50 flex items-center justify-center gap-2 active:scale-95 transition-all">{room.lockedSeats?.includes(selectedSeatIndex!) ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{room.lockedSeats?.includes(selectedSeatIndex!) ? 'Unlock Slot' : 'Lock Slot'}</button>
              )}
            </>)}
            {selectedOccupant?.uid === currentUser?.uid ? (<button onClick={leaveSeat} className="py-5 font-black text-red-500 uppercase tracking-widest text-xs italic hover:bg-red-50 active:scale-95 transition-all">Exit Seat</button>) : !selectedOccupant && !room.lockedSeats?.includes(selectedSeatIndex!) && (<button onClick={() => takeSeat(selectedSeatIndex!)} className="py-5 font-black text-blue-600 uppercase tracking-widest text-xs italic hover:bg-blue-50 active:scale-95 transition-all">Take Seat</button>)}
            <button onClick={() => setIsActionMenuOpen(false)} className="py-5 font-bold text-gray-400 bg-gray-50/50 text-[10px] uppercase tracking-widest hover:text-gray-600">Cancel</button>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isClearChatConfirmOpen} onOpenChange={setIsClearChatConfirmOpen}>
        <AlertDialogContent className="bg-white text-black border-none rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase italic">Purge Frequency Chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-body text-base">This will permanently delete all messages from this frequency for all tribe members.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat} className="bg-destructive text-white rounded-full">Purge Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <input type="file" ref={roomDpInputRef} onChange={(e) => { if (e.target.files?.[0]) { uploadRoomImage(e.target.files[0]); e.target.value = ''; } }} className="hidden" accept="image/*" />
    </div>
  );
}
