
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
  Trophy,
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
  MoreHorizontal,
  UserCog,
  Hexagon,
  Power,
  Mail,
  LayoutGrid,
  ChevronRight,
  Armchair,
  Crown
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
  DialogFooter,
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
import { OfficialTag } from '@/components/official-tag';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { useWebRTC } from '@/hooks/use-webrtc';
import { EmojiReactionOverlay } from '@/components/emoji-reaction-overlay';
import { useRoomImageUpload } from '@/hooks/use-room-image-upload';
import { DailyRewardDialog } from '@/components/daily-reward-dialog';
import { VoiceTutorial } from '@/components/voice-tutorial';

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

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGamesDialogOpen, setIsGamesDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false);
  const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [showGiftEffects, setShowGiftEffects] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const roomDpInputRef = useRef<HTMLInputElement>(null);
  const roomAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { isUploading: isRoomImageUploading, uploadRoomImage } = useRoomImageUpload(room.id);
  const { setActiveRoom } = useRoomContext();

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
    if (userProfile?.isNewUser && !showTutorial) {
      setShowTutorial(true);
    }
  }, [userProfile]);

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
  const takeSeat = (index: number) => { if (!firestore || !room.id || !currentUser || !userProfile) return; if (room.lockedSeats?.includes(index)) { toast({ variant: 'destructive', title: 'Slot Locked' }); return; } updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: index, isMuted: true, activeWave: userProfile.inventory?.activeWave || 'Default' }); };
  const leaveSeat = () => { if (!firestore || !room.id || !currentUser) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: 0, isMuted: true }); setIsActionMenuOpen(false); };
  const handleMicToggle = () => { if (!isInSeat) { const first = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(i => !participants?.some(p => p.seatIndex === i) && !room.lockedSeats?.includes(i)); if (first) takeSeat(first); return; } if (currentUserParticipant?.isSilenced) { toast({ variant: 'destructive', title: 'Silenced' }); return; } if (firestore && currentUser && room.id) { updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); } };

  const toggleModerator = (targetUid: string) => {
    if (!isOwner || !firestore || !room.id) return;
    const isPMod = room.moderatorIds?.includes(targetUid);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
      moderatorIds: isPMod ? arrayRemove(targetUid) : arrayUnion(targetUid)
    });
    toast({ title: isPMod ? 'Admin Revoked' : 'Admin Granted', description: 'Tribe role has been synchronized.' });
  };

  const handleTutorialComplete = () => {
    if (currentUser && firestore) {
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), { isNewUser: false });
    }
    setShowTutorial(false);
  };

  const handleSeatClick = (index: number, occupant?: RoomParticipant) => {
    setSelectedSeatIndex(index);
    setIsActionMenuOpen(true);
  };

  const hostParticipant = participants?.find(p => p.seatIndex === 1);
  const selectedOccupant = participants?.find(p => p.seatIndex === selectedSeatIndex);
  const getWaveColor = (waveId?: string) => waveId === 'w1' ? 'text-cyan-500' : waveId === 'w2' ? 'text-orange-600' : 'text-primary';

  const Seat = ({ index }: { index: number }) => {
    const occupant = participants?.find(p => p.seatIndex === index);
    const isLocked = room.lockedSeats?.includes(index);
    const isPOwner = occupant?.uid === room.ownerId;
    const isPMod = room.moderatorIds?.includes(occupant?.uid || '') && !isPOwner;

    return (
      <div className="flex flex-col items-center gap-1.5 w-full">
        <div className="relative">
          <EmojiReactionOverlay emoji={occupant?.activeEmoji} size={index === 1 ? "xl" : "lg"} />
          <div className="relative">
            {occupant && !occupant.isMuted && (<div className={cn("absolute -inset-1.5 rounded-full border-2 animate-voice-wave", getWaveColor(occupant.activeWave))} />)}
            <AvatarFrame frameId={occupant?.activeFrame} size={index === 1 ? "lg" : "md"}>
              <button 
                onClick={() => handleSeatClick(index, occupant)}
                className={cn(
                  "rounded-full flex items-center justify-center transition-all bg-black/40 border-2 border-white/10 backdrop-blur-sm shadow-xl relative overflow-hidden",
                  index === 1 ? "h-20 w-20" : "h-16 w-16",
                  isLocked && "border-red-500/50 bg-red-500/10"
                )}
              >
                {occupant ? (
                  <Avatar className="h-full w-full"><AvatarImage src={occupant.avatarUrl} /><AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback></Avatar>
                ) : isLocked ? (
                  <Lock className="h-6 w-6 text-red-500/60" />
                ) : (
                  <Armchair className={cn("text-white/20", index === 1 ? "h-10 w-10" : "h-8 w-8")} />
                )}
              </button>
            </AvatarFrame>
            {occupant?.isMuted && (<div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-0.5 border border-black shadow-lg"><MicOff className="h-3 w-3 text-white" /></div>)}
            {!occupant?.isMuted && occupant && (<div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border border-black shadow-lg"><Mic className="h-3 w-3 text-white" /></div>)}
            
            {/* Status Badge */}
            {(isPOwner || isPMod) && (
              <div className="absolute -top-0.5 -left-0.5 bg-yellow-500 rounded-full p-0.5 border border-black shadow-lg z-[45]">
                {isPOwner ? <Crown className="h-2 w-2 text-black fill-current" /> : <ShieldCheck className="h-2 w-2 text-white fill-current" />}
              </div>
            )}

            {canManageRoom && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleSeatClick(index, occupant); }}
                className="absolute -top-1 -right-1 bg-black/60 rounded-full p-0.5 border border-white/10 z-40"
              >
                <MoreHorizontal className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
        </div>
        <span className={cn("text-[10px] font-black uppercase drop-shadow-md truncate w-16 text-center", occupant ? "text-yellow-400" : "text-white/60")}>
          {occupant ? occupant.name : `No.${index}`}
        </span>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl animate-in fade-in duration-700">
      {showTutorial && <VoiceTutorial onComplete={handleTutorialComplete} />}
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <audio ref={roomAudioRef} loop crossOrigin="anonymous" />
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => <RemoteAudio key={peerId} stream={stream} />)}
      
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000" 
          alt="Mountain Lake Background" 
          fill 
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
      </div>

      {/* Header UI */}
      <header className="relative z-50 flex items-center justify-between p-6 pt-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-xl border border-white/20"><AvatarImage src={room.coverUrl} /><AvatarFallback>UM</AvatarFallback></Avatar>
          <div>
            <h1 className="font-black text-sm uppercase tracking-tight">{room.title}</h1>
            <p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <Users className="h-3 w-3 text-white/60" />
            <span className="text-[10px] font-black">{onlineCount}</span>
          </div>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all" onClick={() => setIsSettingsOpen(true)}><Hexagon className="h-4 w-4" /></button>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><Share2 className="h-4 w-4" /></button>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all" onClick={leaveRoom}><Power className="h-4 w-4" /></button>
        </div>
      </header>

      {/* Trophy / Wealth Pill */}
      <div className="relative z-50 px-6 mt-2">
        <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 rounded-full py-1 px-3 w-fit flex items-center gap-2">
          <Trophy className="h-3 w-3 text-yellow-500" />
          <span className="text-[10px] font-black text-yellow-500 uppercase">{(room.stats?.totalGifts || 0).toLocaleString()}</span>
          <ChevronRight className="h-2 w-2 text-yellow-500/60" />
        </div>
      </div>

      {/* Floating Money Tree */}
      <div className="absolute top-32 right-6 z-40 animate-bounce" style={{ animationDuration: '4s' }}>
        <div className="relative h-16 w-16">
          <Image src="https://img.icons8.com/color/96/money-tree.png" alt="Money Tree" fill className="object-contain" />
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col pt-4 overflow-hidden">
        {/* Seat Layout: 1-4-4 arrangement */}
        <div className="px-6 space-y-8 flex flex-col items-center">
          {/* King Seat (Slot 1) */}
          <div className="w-24">
            <Seat index={1} />
          </div>

          {/* Row 1: Slots 2-5 */}
          <div className="grid grid-cols-4 gap-4 w-full max-w-sm">
            {[2, 3, 4, 5].map(i => <Seat key={i} index={i} />)}
          </div>

          {/* Row 2: Slots 6-9 */}
          <div className="grid grid-cols-4 gap-4 w-full max-w-sm">
            {[6, 7, 8, 9].map(i => <Seat key={i} index={i} />)}
          </div>
        </div>

        {/* Floating Side Support Card */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-b from-amber-200 to-amber-600 p-1 rounded-xl shadow-2xl">
            <div className="bg-black/80 rounded-lg p-2 flex flex-col items-center gap-1 border border-white/5">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <p className="text-[8px] font-black uppercase text-center text-white/60">Room<br/>Support</p>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("h-1 w-1 rounded-full", i === 1 ? "bg-white" : "bg-white/20")} />)}
              </div>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col mt-10 px-6 pb-20 justify-end">
          <div className="space-y-4">
            {/* Static Announcement */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl animate-in fade-in duration-1000">
              <p className="text-emerald-400 text-xs font-black uppercase leading-relaxed">
                Welcome to Ummy! Please show respect to one another and be courteous.
              </p>
            </div>

            {/* Join Voice Button */}
            {!isInSeat && (
              <Button 
                onClick={handleMicToggle}
                className="w-fit bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-2xl h-12 px-8 font-black uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Join Voice Chat <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Live Chat / Entry Messages */}
            <ScrollArea className="h-32" ref={scrollRef}>
              <div className="space-y-2">
                {activeMessages.map((msg) => (
                  <div key={msg.id} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                    {msg.type === 'entrance' ? (
                      <p className="text-[10px] font-black uppercase text-white/60">
                        welcome <span className="text-yellow-400">{msg.user.name}</span> entered the room
                      </p>
                    ) : (
                      <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/5 flex gap-2 max-w-[80%]">
                        <span className="text-[10px] font-black text-blue-400 shrink-0 uppercase">{msg.user.name}:</span>
                        <p className="text-[10px] font-medium text-white/80">{msg.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>

      {/* Floating User Profile Widget */}
      <div className="absolute bottom-32 right-6 z-40">
        <div className="relative h-14 w-14 group">
          <Avatar className="h-full w-full border-2 border-white/40 shadow-xl group-hover:scale-110 transition-transform">
            <AvatarImage src="https://picsum.photos/seed/tribe-user/200/200" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("h-1 w-1 rounded-full", i === 1 ? "bg-white" : "bg-white/20")} />)}
          </div>
        </div>
      </div>

      {/* Footer Interface */}
      <footer className="relative z-50 px-6 pb-10 flex items-center justify-between gap-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-4">
        <form 
          className="flex-1 bg-white/10 backdrop-blur-xl rounded-full h-12 px-5 flex items-center border border-white/5"
          onSubmit={handleSendMessage}
        >
          <Input 
            placeholder="Say Hi" 
            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest placeholder:text-white/40 focus-visible:ring-0 h-full"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-3">
          <button className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-all"><Volume2 className="h-5 w-5" /></button>
          <button className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-all"><Mail className="h-5 w-5" /></button>
          <button 
            className="bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
            onClick={() => setIsGiftPickerOpen(true)}
          >
            <GiftIcon className="h-5 w-5 text-white" />
          </button>
          <button 
            className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-all"
            onClick={() => setIsGamesDialogOpen(true)}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>
      </footer>

      {/* Seat Action Menu Dialog */}
      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom-full duration-500">
          <DialogHeader className="p-6 border-b border-gray-100">
            <DialogTitle className="text-center text-2xl text-gray-800 uppercase">{selectedOccupant ? `Tribe Member: ${selectedOccupant.name}` : `Seat ${selectedSeatIndex}`}</DialogTitle>
            <DialogDescription className="sr-only">Available actions for the selected tribe member or seat.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-gray-100">
            {selectedOccupant && (<button onClick={() => { setGiftRecipient({ uid: selectedOccupant.uid, name: selectedOccupant.name, avatarUrl: selectedOccupant.avatarUrl }); setIsGiftPickerOpen(true); setIsActionMenuOpen(false); }} className="py-5 font-black text-primary uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all">Send Gift</button>)}
            {isOwner && selectedOccupant && selectedOccupant.uid !== currentUser?.uid && (
              <button 
                onClick={() => { toggleModerator(selectedOccupant.uid); setIsActionMenuOpen(false); }} 
                className="py-5 font-bold text-blue-600 uppercase tracking-widest text-xs hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <UserCog className="h-4 w-4" />
                {room.moderatorIds?.includes(selectedOccupant.uid) ? 'Revoke Admin Status' : 'Make Admin'}
              </button>
            )}
            {canManageRoom && (<>
              {selectedOccupant ? (<>
                <button onClick={() => silenceParticipant(selectedOccupant.uid, selectedOccupant.isSilenced ?? false)} className="py-5 font-bold text-gray-700 uppercase tracking-widest text-xs hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95 transition-all">{selectedOccupant.isSilenced ? <Volume2 className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}{selectedOccupant.isSilenced ? 'Unsilence Tribe' : 'Silence Tribe'}</button>
                {selectedOccupant.uid !== currentUser?.uid && (<button onClick={() => kickParticipant(selectedOccupant.uid)} className="py-5 font-black text-destructive uppercase tracking-widest text-xs hover:bg-red-50 flex items-center justify-center gap-2 active:scale-95 transition-all"><span className="flex items-center gap-2"><Ban className="h-4 w-4" /> Kick Tribe</span></button>)}
              </>) : (
                <button onClick={() => toggleSeatLock(selectedSeatIndex!)} className="py-5 font-bold text-purple-600 uppercase tracking-widest text-xs hover:bg-purple-50 flex items-center justify-center gap-2 active:scale-95 transition-all">{room.lockedSeats?.includes(selectedSeatIndex!) ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{room.lockedSeats?.includes(selectedSeatIndex!) ? 'Unlock Slot' : 'Lock Slot'}</button>
              )}
            </>)}
            <button onClick={() => { const link = `${window.location.origin}/rooms/${room.id}`; navigator.clipboard.writeText(link); toast({ title: 'Invite Copied' }); setIsActionMenuOpen(false); }} className="py-5 font-bold text-blue-500 uppercase tracking-widest text-xs hover:bg-blue-50 flex items-center justify-center gap-2 active:scale-95 transition-all">
              <UserPlus className="h-4 w-4" /> Invite Tribe
            </button>
            {selectedOccupant?.uid === currentUser?.uid ? (<button onClick={leaveSeat} className="py-5 font-black text-red-500 uppercase tracking-widest text-xs hover:bg-red-50 active:scale-95 transition-all">Exit Seat</button>) : !selectedOccupant && !room.lockedSeats?.includes(selectedSeatIndex!) && (<button onClick={() => takeSeat(selectedSeatIndex!)} className="py-5 font-black text-blue-600 uppercase tracking-widest text-xs hover:bg-blue-50 active:scale-95 transition-all">Take Seat</button>)}
            <button onClick={() => setIsActionMenuOpen(false)} className="py-5 font-bold text-gray-400 bg-gray-50/50 text-[10px] uppercase tracking-widest hover:text-gray-600">Cancel</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift Picker Dialog */}
      <Dialog open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <DialogHeader className="p-8 pb-0 text-center">
            <DialogTitle className="text-3xl font-black uppercase">Ummy Boutique</DialogTitle>
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
                  <p className="text-sm font-black uppercase text-primary">{giftRecipient?.uid === currentUser?.uid ? 'Myself' : (giftRecipient?.name || hostParticipant?.name || 'The Frequency')}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { if (giftRecipient?.uid === currentUser?.uid) { setGiftRecipient(null); } else { setGiftRecipient({ uid: currentUser!.uid, name: userProfile!.username, avatarUrl: userProfile!.avatarUrl }); } }} className="rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"><RefreshCw className="h-3 w-3 mr-1" />{giftRecipient?.uid === currentUser?.uid ? 'Switch to Host' : 'Gift Myself'}</Button>
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
              {AVAILABLE_GIFTS.map(g => (<button key={g.id} onClick={() => handleSendGift(g)} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-secondary/50 hover:bg-primary/20 transition-all border-2 border-transparent hover:border-primary group active:scale-90"><span className="text-4xl group-hover:scale-125 transition-transform duration-300">{g.emoji}</span><div className="text-center"><p className="text-[10px] font-black uppercase truncate w-20">{g.name}</p><div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary"><GoldCoinIcon className="h-3 w-3" />{g.price}</div></div></button>))}
            </div>
            <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-between shadow-inner"><span className="text-xs font-black uppercase opacity-60">Your Balance</span><div className="flex items-center gap-2 font-black text-primary text-xl"><GoldCoinIcon className="h-5 w-5" />{userProfile?.wallet?.coins || 0}</div></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Frequency Portal / Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] text-white p-0 rounded-t-[3rem] border-none overflow-hidden h-[85vh]">
          <DialogHeader className="p-8 pb-4 text-center">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Frequency Portal</DialogTitle>
            <DialogDescription className="sr-only">Interactive dashboard for room entertainment and management tools.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full px-8 pb-32">
            <div className="space-y-10">
              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 ml-2">Room Play</h3>
                <div className="grid grid-cols-4 gap-4">
                  <ToolTile icon={Gamepad2} label="Ludo" onClick={() => router.push('/games/ludo')} />
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

      <AlertDialog open={isClearChatConfirmOpen} onOpenChange={setIsClearChatConfirmOpen}>
        <AlertDialogContent className="bg-white text-black border-none rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase">Purge Frequency Chat?</AlertDialogTitle>
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

const ToolTile = ({ icon: Icon, label, active, onClick, disabled }: any) => (
  <button onClick={onClick} disabled={disabled} className={cn("flex flex-col items-center gap-2 transition-all active:scale-95", disabled && "opacity-30 grayscale cursor-not-allowed")}>
    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-colors", active ? "bg-primary/20 border-primary text-primary" : "bg-slate-800/50 border-white/5 text-white/60 hover:bg-slate-800")}><Icon className="h-7 w-7" /></div>
    <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">{label}</span>
  </button>
);
