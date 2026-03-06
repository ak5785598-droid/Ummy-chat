'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Mic,
  MicOff,
  Loader,
  Gift as GiftIcon,
  Users,
  Volume2,
  VolumeX,
  LogOut,
  Power,
  Armchair,
  ChevronDown,
  Minimize2,
  Lock,
  Unlock,
  Hexagon,
  Share2,
  Trophy,
  Mail,
  LayoutGrid,
  ChevronRight,
  User as UserIcon,
  X,
  UserX,
  UserCheck,
  Ban,
  UserPlus,
  Headphones
} from 'lucide-react';
import { GoldCoinIcon, GameControllerIcon } from '@/components/icons';
import type { Room, RoomParticipant, Gift } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  setDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  collection, 
  serverTimestamp, 
  query, 
  orderBy, 
  limitToLast, 
  doc, 
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { useWebRTC } from '@/hooks/use-webrtc';
import { DailyRewardDialog } from '@/components/daily-reward-dialog';
import { RoomUserProfileDialog } from '@/components/room-user-profile-dialog';
import { RoomSettingsDialog } from '@/components/room-settings-dialog';
import { RoomUserListDialog } from '@/components/room-user-list-dialog';
import { RoomShareDialog } from '@/components/room-share-dialog';
import { GiftPicker, type GiftItem } from '@/components/gift-picker';

const ROOM_THEMES = [
  { id: 'misty', name: 'Misty Forest', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000' },
  { id: 'neon', name: 'Neon Party', url: 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=2000' },
  { id: 'royal', name: 'Royal Palace', url: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=2000' },
];

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      contextRef.current = ctx;
      
      const source = ctx.createMediaStreamSource(stream);
      const gainNode = ctx.createGain();
      gainNode.gain.value = 2.5; 
      
      gainNode.connect(ctx.destination);
      
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.muted = true;
        audioRef.current.play().catch(() => {});
      }
    } catch (e) {
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.muted = false;
        audioRef.current.play().catch(() => {});
      }
    }

    return () => {
      if (contextRef.current) {
        contextRef.current.close().catch(() => {});
      }
    };
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

function EntryCard({ entrant, onComplete }: { entrant: any, onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [entrant, onComplete]);

  if (!entrant) return null;

  return (
    <div className="fixed top-40 left-0 z-[150] animate-in slide-in-from-left-full duration-700 pointer-events-none">
      <div className="bg-black/40 backdrop-blur-md rounded-r-full py-1.5 pl-2 pr-8 flex items-center gap-3 shadow-lg border-y border-r border-white/10">
        <span className="text-[12px] font-medium text-white/80">welcome</span>
        <span className="text-[12px] font-black text-yellow-400">{entrant.senderName}</span>
        <span className="text-[12px] font-medium text-white/80">entered the room</span>
      </div>
    </div>
  );
}

function SeatActionDialog({ 
  open, 
  onOpenChange, 
  onAction, 
  canManage,
  isOccupied,
  isMe,
  isLocked,
  occupantName,
  isOccupantMuted
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onAction: (action: string) => void;
  canManage: boolean;
  isOccupied: boolean;
  isMe: boolean;
  isLocked: boolean;
  occupantName?: string;
  isOccupantMuted?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-500 font-headline">
        <DialogHeader className="p-6 border-b border-gray-50 shrink-0">
          <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-center">
            {isOccupied ? (isMe ? 'My Seat' : occupantName) : (isLocked ? 'Locked Slot' : 'Available Slot')}
          </DialogTitle>
          <DialogDescription className="sr-only">Choose a frequency management action.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-4">
          
          {canManage && isOccupied && !isMe && (
            <>
              <button onClick={() => onAction('toggle-mute')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 transition-all border-b">{isOccupantMuted ? 'Unmute' : 'Mute'} Member</button>
              <button onClick={() => onAction('remove-from-seat')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight text-red-500 hover:bg-gray-50 active:bg-gray-100 transition-all border-b">Remove from seat</button>
              <button onClick={() => onAction('kick-out')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight text-red-600 hover:bg-gray-50 active:bg-gray-100 transition-all border-b">Kick Out</button>
            </>
          )}

          {canManage && !isOccupied && (
            <>
              <button onClick={() => onAction('take-seat')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 transition-all border-b">Take Mic</button>
              <button onClick={() => onAction('toggle-lock')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 transition-all border-b">{isLocked ? 'Unlock Seat' : 'Lock Seat'}</button>
              <button onClick={() => onAction('invite')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight text-primary hover:bg-gray-50 active:bg-gray-100 transition-all border-b">Invite Tribe</button>
            </>
          )}

          {!canManage && !isOccupied && !isLocked && (
            <button onClick={() => onAction('take-seat')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 transition-all border-b">Take Mic</button>
          )}

          {isMe && <button onClick={() => onAction('leave-seat')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight text-pink-500 hover:bg-gray-50 active:bg-gray-100 transition-all border-b">Leave Mic</button>}

          {isOccupied && !isMe && <button onClick={() => onAction('view-profile')} className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 transition-all border-b">View Profile</button>}

          <button onClick={() => onOpenChange(false)} className="w-full py-6 text-center font-black text-lg uppercase tracking-tight text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all">Cancel</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GiftComboButton({ count, onClick, onTimeout }: { count: number, onClick: () => void, onTimeout: () => void }) {
  const [timeLeft, setTimeLeft] = useState(5000);
  const duration = 5000;

  useEffect(() => {
    setTimeLeft(duration);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [count, onTimeout]);

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="fixed bottom-32 right-6 z-[250] flex flex-col items-center gap-2 animate-in zoom-in duration-300">
       <button 
         onClick={onClick}
         className="relative h-24 w-24 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-[#ff7043] to-[#f4511e] shadow-[0_0_30px_rgba(244,81,30,0.6)] active:scale-90 transition-all overflow-hidden border-2 border-white/20 group"
       >
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="48" cy="48" r="44" stroke="white" strokeWidth="4" fill="transparent" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * progress) / 100} className="transition-all duration-100" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
             <span className="text-3xl font-black text-white italic drop-shadow-lg">x{count}</span>
             <span className="text-xs font-black text-white uppercase italic tracking-tighter drop-shadow-lg -mt-1">Combo</span>
          </div>
          <div className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
       </button>
       <p className="text-[10px] font-black text-white/60 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">Rapid Dispatch</p>
    </div>
  );
}

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isExitPortalOpen, setIsExitPortalOpen] = useState(false);
  const [isUserProfileCardOpen, setIsUserProfileCardOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSeatMenuOpen, setIsSeatMenuOpen] = useState(false);
  
  const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [isMutedLocal, setIsMutedLocal] = useState(false);
  const [hasHeadphones, setHasHeadphones] = useState(false);

  const [activeCombo, setActiveCombo] = useState<{ gift: GiftItem, recipient: any, count: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { setActiveRoom, setIsMinimized } = useRoomContext();

  const isOwner = currentUser?.uid === room.ownerId;
  const isModerator = room.moderatorIds?.includes(currentUser?.uid || '') || false;
  const canManageRoom = isOwner || isModerator;

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;
  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  
  const { remoteStreams } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'), limitToLast(50));
  }, [firestore, room.id]);

  const { data: firestoreMessages } = useCollection(messagesQuery);
  const [latestEntrance, setLatestEntrance] = useState<any>(null);

  const occupant = participants?.find(p => p.seatIndex === selectedSeatIdx);

  useEffect(() => {
    const handleDeviceChange = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const connected = devices.some(d => d.kind === 'audiooutput' && (d.label.toLowerCase().includes('headphone') || d.label.toLowerCase().includes('headset') || d.label.toLowerCase().includes('bluetooth')));
      
      setHasHeadphones(connected);
      if (connected) {
        toast({ title: 'Headset Synchronized', description: 'High-fidelity audio mesh is now tuned for your headphones.' });
      }
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    handleDeviceChange();
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
  }, [toast]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (firestoreMessages && firestoreMessages.length > 0) {
      const lastMsg = firestoreMessages[firestoreMessages.length - 1];
      if (lastMsg.type === 'entrance' && lastMsg.senderId !== currentUser?.uid) {
        setLatestEntrance(lastMsg);
      } else if (lastMsg.type === 'gift') {
        setActiveGiftAnimation(lastMsg.giftId);
      }
    }
  }, [firestoreMessages, currentUser?.uid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || !userProfile) return;
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: messageText, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || null, chatRoomId: room.id, timestamp: serverTimestamp(), type: 'text'
    });
    setMessageText('');
  };

  const calculateLuckyWin = (price: number, qty: number) => {
    const roll = Math.random() * 100;
    let multiplier = 0;
    if (roll < 0.05) multiplier = 1000;
    else if (roll < 0.2) multiplier = 100;
    else if (roll < 1.0) multiplier = 50;
    else if (roll < 5.0) multiplier = 5;
    else if (roll < 15.0) multiplier = 2;
    else if (roll < 60.0) multiplier = 1;
    return { multiplier, winAmount: price * qty * multiplier };
  };

  const handleComboDispatch = async () => {
    if (!activeCombo || !userProfile || !currentUser || !firestore) return;
    const { gift, recipient, count } = activeCombo;
    
    if ((userProfile.wallet?.coins || 0) < gift.price) {
      toast({ variant: 'destructive', title: 'Vault Empty', description: 'Recharge coins to continue the combo.' });
      setActiveCombo(null);
      return;
    }

    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const roomRef = doc(firestore, 'chatRooms', room.id);

      let winAmount = 0;
      let luckyResult = null;

      if (gift.type === 'lucky') {
        const { multiplier, winAmount: won } = calculateLuckyWin(gift.price, 1);
        winAmount = won;
        if (multiplier > 0) luckyResult = { multiplier, winAmount };
      }

      const netCost = gift.price - winAmount;

      // SENDER ATOMIC SYNC
      const senderUpdateData = { 
        'wallet.coins': increment(-netCost), 
        'wallet.totalSpent': increment(gift.price),
        'wallet.dailySpent': increment(gift.price),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(userRef, senderUpdateData);
      updateDocumentNonBlocking(profileRef, senderUpdateData);
      updateDocumentNonBlocking(roomRef, { 'stats.totalGifts': increment(gift.price), 'stats.dailyGifts': increment(gift.price) });

      // RECIPIENT DIAMOND YIELD (40% CONVERSION)
      if (recipient && recipient.uid && recipient.uid !== currentUser.uid) {
        const diamondYield = Math.floor(gift.price * 0.4);
        const recipientRef = doc(firestore, 'users', recipient.uid);
        const recipientProfileRef = doc(firestore, 'users', recipient.uid, 'profile', recipient.uid);
        const recUpdateData = { 'wallet.diamonds': increment(diamondYield), updatedAt: serverTimestamp() };
        updateDocumentNonBlocking(recipientRef, recUpdateData);
        updateDocumentNonBlocking(recipientProfileRef, recUpdateData);
      }

      addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
        type: 'gift',
        senderId: currentUser.uid,
        senderName: userProfile.username,
        senderAvatar: userProfile.avatarUrl || null,
        recipientName: recipient?.name || 'the Room',
        giftId: (luckyResult && luckyResult.multiplier >= 50) ? 'lucky-jackpot' : gift.animationId,
        text: `sent ${gift.name} x1 (Combo x${count + 1})`,
        luckyWin: luckyResult,
        timestamp: serverTimestamp()
      });

      setActiveCombo({ ...activeCombo, count: count + 1 });
      if (winAmount > 0) {
        toast({ title: 'Luck Sync!', description: `Won ${winAmount.toLocaleString()} back!` });
      }
    } catch (e) {}
  };

  const takeSeat = (index: number) => { 
    if (!firestore || !room.id || !currentUser) return; 
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { 
      seatIndex: index, isMuted: true, activeWave: userProfile?.inventory?.activeWave || 'Default', updatedAt: serverTimestamp() 
    }); 
  };

  const handleSeatClick = (index: number, occupant?: RoomParticipant) => {
    setSelectedSeatIdx(index);
    if (occupant) {
      setSelectedParticipantUid(occupant.uid);
      if (canManageRoom || occupant.uid === currentUser?.uid) setIsSeatMenuOpen(true);
      else setIsUserProfileCardOpen(true);
    } else setIsSeatMenuOpen(true);
  };

  const handleSeatAction = (action: string) => {
    if (!selectedSeatIdx || !firestore || !room.id || !currentUser) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    const occupant = participants?.find(p => p.seatIndex === selectedSeatIdx);

    switch(action) {
      case 'take-seat':
        if (room.lockedSeats?.includes(selectedSeatIdx) && !canManageRoom) toast({ variant: 'destructive', title: 'Restricted', description: 'Locked slot.' });
        else takeSeat(selectedSeatIdx);
        break;
      case 'leave-seat':
        updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: 0, isMuted: true });
        break;
      case 'toggle-lock':
        if (canManageRoom) {
          const isCurrentlyLocked = room.lockedSeats?.includes(selectedSeatIdx);
          updateDocumentNonBlocking(roomRef, { lockedSeats: isCurrentlyLocked ? arrayRemove(selectedSeatIdx) : arrayUnion(selectedSeatIdx) });
        }
        break;
      case 'toggle-mute':
        if (canManageRoom && occupant) updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', occupant.uid), { isMuted: !occupant.isMuted });
        break;
      case 'remove-from-seat':
        if (canManageRoom && occupant) updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', occupant.uid), { seatIndex: 0, isMuted: true });
        break;
      case 'kick-out':
        if (canManageRoom && occupant) {
          const expiresAt = new Date(); expiresAt.setMinutes(expiresAt.getMinutes() + 60);
          setDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'bans', occupant.uid), { uid: occupant.uid, expiresAt: expiresAt, createdAt: serverTimestamp() }, { merge: true });
          updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', occupant.uid), { seatIndex: 0, isMuted: true });
          toast({ title: 'Tribe Exclusion Active', description: `${occupant.name} restricted for 1 hour.` });
        }
        break;
      case 'invite': setIsShareOpen(true); break;
      case 'view-profile': setIsUserProfileCardOpen(true); break;
    }
    setIsSeatMenuOpen(false);
  };

  const handleMicToggle = () => { 
    if (!isInSeat || !firestore || !currentUser || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); 
  };

  const handleMinimize = () => { setIsMinimized(true); router.push('/rooms'); };
  const handleExit = () => { setActiveRoom(null); router.push('/rooms'); };

  const currentTheme = ROOM_THEMES.find(t => t.id === (room as any).roomThemeId) || ROOM_THEMES[0];

  const Seat = ({ index, label }: { index: number, label: string }) => {
    const occupant = participants?.find(p => p.seatIndex === index);
    const isLocked = room.lockedSeats?.includes(index);
    return (
      <div className="flex flex-col items-center gap-1 w-[22%]">
        <div className="relative">
          {occupant && !occupant.isMuted && <div className="absolute -inset-1 rounded-full border-2 border-green-500 animate-voice-wave" />}
          <AvatarFrame frameId={occupant?.activeFrame} size="md">
            <button onClick={() => handleSeatClick(index, occupant)} className={cn("h-14 w-14 rounded-full flex items-center justify-center bg-black/40 border-2 backdrop-blur-sm active:scale-90 transition-transform relative z-10", isLocked ? "border-red-500/40" : "border-white/10")}>
              {occupant ? <Avatar className="h-full w-full p-0.5"><AvatarImage src={occupant.avatarUrl || undefined} /><AvatarFallback>{(occupant.name || 'U').charAt(0)}</AvatarFallback></Avatar> : isLocked ? <Lock className="h-4 w-4 text-red-500/40" /> : <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center"><Armchair className="text-white/40 h-4 w-4" /></div>}
            </button>
          </AvatarFrame>
          {occupant?.isMuted && <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border border-black z-20"><MicOff className="h-2 w-2 text-white" /></div>}
        </div>
        <span className="text-[10px] font-bold text-white/60 uppercase truncate w-14 text-center">{occupant ? occupant.name : label}</span>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline">
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <EntryCard entrant={latestEntrance} onComplete={() => setLatestEntrance(null)} />
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (<RemoteAudio key={peerId} stream={stream} />))}
      
      {activeCombo && (
        <GiftComboButton count={activeCombo.count} onClick={handleComboDispatch} onTimeout={() => setActiveCombo(null)} />
      )}

      <div className="absolute inset-0 z-0">
        <Image src={currentTheme.url} alt="Background" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-4 pt-8">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-white/20"><AvatarImage src={room.coverUrl || undefined} /><AvatarFallback>UM</AvatarFallback></Avatar>
          <div className="flex flex-col"><h1 className="font-black text-[15px] uppercase tracking-tighter text-white">{room.title}</h1><p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p><div className="mt-1 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit border border-white/10"><Trophy className="h-2.5 w-2.5 text-yellow-500 fill-current" /><span className="text-[9px] font-black text-yellow-500 italic">251.2M</span><ChevronRight className="h-2.5 w-2.5 text-yellow-500" /></div></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsUserListOpen(true)} className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 active:scale-95 transition-transform"><Users className="h-4 w-4 text-white/60" /><span className="text-[12px] font-black">{onlineCount}</span></button>
          <RoomSettingsDialog room={room} trigger={<button className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Hexagon className="h-5 w-5" /></button>} />
          <button onClick={() => setIsShareOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Share2 className="h-5 w-5" /></button>
          <button onClick={() => setIsExitPortalOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Power className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col pt-4 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
           <div className="w-full flex justify-center"><Seat index={1} label="No.1" /></div>
           <div className="w-full flex justify-center gap-4 px-4"><Seat index={2} label="No.2" /><Seat index={3} label="No.3" /><Seat index={4} label="No.4" /><Seat index={5} label="No.5" /></div>
           <div className="w-full flex justify-center gap-4 px-4"><Seat index={6} label="No.6" /><Seat index={7} label="No.7" /><Seat index={8} label="No.8" /><Seat index={9} label="No.9" /></div>
           <div className="mt-8 px-6 w-full max-w-[280px]">{!participants?.some(p => p.uid === currentUser?.uid && p.seatIndex > 0) && <button onClick={() => takeSeat(1)} className="w-full h-14 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 rounded-full flex items-center justify-center gap-2 font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Join Voice Chat <ChevronRight className="h-4 w-4" /></button>}</div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-48 z-20 pointer-events-none p-4 pb-0">
           <ScrollArea className="h-full pr-4 pointer-events-auto" ref={scrollRef}>
              <div className="flex flex-col gap-2 justify-end min-h-full">
                 {firestoreMessages?.map((msg: any) => (
                   msg.type === 'entrance' ? <div key={msg.id} className="text-[10px] font-black text-yellow-400 uppercase italic bg-black/40 px-3 py-1 rounded-full w-fit shadow-lg border border-white/5 animate-in slide-in-from-left-2">{msg.senderName} entered the room</div> :
                   <div key={msg.id} className="flex items-start gap-2 bg-black/40 backdrop-blur-md rounded-2xl p-2 border border-white/5 w-fit max-w-[80%] animate-in fade-in slide-in-from-left-2 shadow-xl">
                      <Avatar className="h-7 w-7 shrink-0 border border-white/10"><AvatarImage src={msg.senderAvatar || undefined} /><AvatarFallback>{(msg.senderName || 'U').charAt(0)}</AvatarFallback></Avatar>
                      <div className="flex flex-col"><span className={cn("text-[9px] font-black uppercase tracking-tighter leading-none mb-1", msg.senderId === currentUser?.uid ? "text-primary" : "text-white/40")}>{msg.senderName}</span><p className="text-[12px] font-bold text-white leading-tight break-all">{msg.content}</p></div>
                   </div>
                 ))}
              </div>
           </ScrollArea>
        </div>
      </main>

      <footer className="relative z-50 px-4 pb-10 flex items-center justify-between gap-3 pt-4">
        <div className="flex-1 flex items-center gap-3">
           <div onClick={() => setShowInput(true)} className="bg-white/10 backdrop-blur-xl rounded-full h-12 flex-1 px-6 flex items-center text-white/60 font-bold text-sm cursor-pointer">Say Hi</div>
           <div className="flex items-center gap-3">
              <button onClick={handleMicToggle} disabled={!isInSeat} className={cn("p-2 rounded-full transition-all active:scale-90", !isInSeat ? "bg-white/5 text-white/20 opacity-50" : (currentUserParticipant?.isMuted ? "bg-white/10 text-white" : "bg-green-500 text-white shadow-lg border border-white/20"))}>{isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
              <button className={cn("p-2 rounded-full transition-all active:scale-90 bg-white/10", hasHeadphones ? "text-green-400" : "text-white")}><Headphones className="h-5 w-5" /></button>
              <button onClick={() => setIsMutedLocal(!isMutedLocal)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform">{isMutedLocal ? <VolumeX className="h-5 w-5 text-white/60" /> : <Volume2 className="h-5 w-5 text-white" />}</button>
              <button onClick={() => router.push('/messages')} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"><Mail className="h-5 w-5 text-white" /></button>
              <button onClick={() => { setGiftRecipient(null); setIsGiftPickerOpen(true); }} className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl active:scale-90 transition-transform"><GiftIcon className="h-6 w-6 text-white fill-white" /></button>
              <button onClick={() => router.push('/games')} className="bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 p-2 rounded-full shadow-lg active:scale-95 transition-transform border border-yellow-200/50"><GameControllerIcon className="h-5 w-5 text-white drop-shadow-md" /></button>
              <button className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"><LayoutGrid className="h-5 w-5 text-white" /></button>
           </div>
        </div>
      </footer>

      {showInput && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 font-headline">
           <div className="bg-slate-900 rounded-[2.5rem] p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center px-4"><h3 className="font-black uppercase tracking-widest text-[10px] text-white/40">Broadcasting to Tribe</h3><button onClick={() => setShowInput(false)} className="text-white/40"><X className="h-5 w-5" /></button></div>
              <form className="flex gap-2" onSubmit={(e) => { handleSendMessage(e); setShowInput(false); }}><Input autoFocus value={messageText} onChange={(e) => setMessageText(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-full px-6 text-white" placeholder="Type a message..." /><button className="bg-primary text-black h-14 w-14 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Mail className="h-6 w-6" /></button></form>
           </div>
        </div>
      )}

      <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden font-headline"><DialogHeader className="sr-only"><DialogTitle>Exit Frequency</DialogTitle><DialogDescription>Choose to minimize or exit.</DialogDescription></DialogHeader><div className="p-12 flex items-center justify-around gap-8"><button onClick={handleMinimize} className="flex flex-col items-center gap-4 active:scale-90 transition-transform"><div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl"><Minimize2 className="h-8 w-8 text-black" /></div><span className="text-white font-black uppercase text-xs tracking-widest">Minimize</span></button><button onClick={handleExit} className="flex flex-col items-center gap-4 active:scale-90 transition-transform"><div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl"><LogOut className="h-8 w-8 text-pink-500" /></div><span className="text-white font-black uppercase text-xs tracking-widest">Exit Room</span></button></div></DialogContent>
      </Dialog>

      <RoomUserListDialog open={isUserListOpen} onOpenChange={setIsUserListOpen} roomId={room.id} />
      <RoomShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} room={room} />
      <SeatActionDialog open={isSeatMenuOpen} onOpenChange={setIsSeatMenuOpen} onAction={handleSeatAction} canManage={canManageRoom} isOccupied={!!occupant} isMe={occupant?.uid === currentUser?.uid} isLocked={!!selectedSeatIdx && (room.lockedSeats?.includes(selectedSeatIdx) || false)} occupantName={occupant?.name} isOccupantMuted={occupant?.isMuted} />
      <RoomUserProfileDialog userId={selectedParticipantUid} open={isUserProfileCardOpen} onOpenChange={setIsUserProfileCardOpen} canManage={canManageRoom} isOwner={isOwner} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} onSilence={() => handleSeatAction('toggle-mute')} onKick={() => {}} onLeaveSeat={() => handleSeatAction('remove-from-seat')} onToggleMod={() => {}} onOpenGiftPicker={(rec) => { setGiftRecipient(rec); setIsGiftPickerOpen(true); }} isSilenced={occupant?.isMuted || false} isMe={selectedParticipantUid === currentUser?.uid} />
      <GiftPicker 
        open={isGiftPickerOpen} 
        onOpenChange={setIsGiftPickerOpen} 
        roomId={room.id} 
        recipient={giftRecipient} 
        onGiftSent={(gift, qty, rec) => {
          if (gift.type === 'lucky') {
            setActiveCombo({ gift, recipient: rec, count: qty });
          }
        }} 
      />
    </div>
  );
}