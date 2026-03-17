'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  Mic,
  MicOff,
  Gift as GiftIcon,
  Users,
  Volume2,
  VolumeX,
  Power,
  Armchair,
  ChevronDown,
  Minimize2,
  Lock,
  Hexagon,
  Share2,
  Mail,
  LayoutGrid,
  X,
  Plus,
  SmilePlus,
  MessageSquare,
  Trophy,
  Megaphone,
  Home,
  Heart,
  LogOut,
  Zap,
  ImageIcon,
  Loader
} from 'lucide-react';
import { GoldCoinIcon, GameControllerIcon, UmmyLogoIcon } from '@/components/icons';
import type { Room, RoomParticipant } from '@/lib/types';
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
  useDoc,
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useStorage
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
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { GiftPicker } from '@/components/gift-picker';
import { RoomPlayDialog } from '@/components/room-play-dialog';
import { LuckyRainOverlay } from '@/components/lucky-rain-overlay';
import { RoomSeatMenuDialog } from '@/components/room-seat-menu-dialog';
import { ROOM_THEMES } from '@/lib/themes';
import { EmojiReactionOverlay } from '@/components/emoji-reaction-overlay';
import { RoomGamesDialog } from '@/components/room-games-dialog';
import { RoomMessagesDialog } from '@/components/room-messages-dialog';
import { RoomEmojiPickerDialog } from '@/components/room-emoji-picker-dialog';

function RemoteAudio({ stream, muted }: { stream: MediaStream, muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!stream) return;
    if (!contextRef.current) {
      contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = contextRef.current;
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    sourceRef.current = ctx.createMediaStreamSource(stream);
    gainRef.current = ctx.createGain();
    sourceRef.current.connect(gainRef.current);
    gainRef.current.connect(ctx.destination);
    gainRef.current.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
    if (ctx.state === 'suspended') {
      const resume = () => ctx.resume().catch(() => {});
      window.addEventListener('click', resume, { once: true });
      window.addEventListener('touchstart', resume, { once: true });
    }
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.muted = true;
      audioRef.current.play().catch(() => {});
    }
    return () => {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (gainRef.current) gainRef.current.disconnect();
    };
  }, [stream, muted]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

const Seat = ({ 
  index, 
  label, 
  occupant, 
  isLocked, 
  theme, 
  onClick,
  isOwner
}: { 
  index: number, 
  label: string, 
  occupant?: RoomParticipant, 
  isLocked?: boolean, 
  theme: any,
  onClick: (index: number, occupant?: RoomParticipant) => void,
  isOwner: boolean
}) => {
  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-[65px]">
      <div className="relative">
        <EmojiReactionOverlay emoji={occupant?.activeEmoji} size="sm" />
        {occupant && !occupant.isMuted && (
          <div className="absolute -inset-1 rounded-full border-2 animate-voice-wave" style={{ color: theme.accentColor }} />
        )}
        <AvatarFrame frameId={occupant?.activeFrame} size="md">
          <button 
            onClick={() => onClick(index, occupant)} 
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center border-2 backdrop-blur-sm active:scale-90 transition-transform relative z-10",
              isLocked ? "border-red-500/40" : "border-white/10"
            )}
            style={{ backgroundColor: theme.seatColor || 'rgba(255,255,255,0.1)' }}
          >
            {occupant ? (
              <Avatar className="h-full w-full p-0.5">
                <AvatarImage src={occupant.avatarUrl || undefined} />
                <AvatarFallback>{(occupant.name || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
            ) : isLocked ? (
              <Lock className="h-3.5 w-3.5 text-red-500/40" />
            ) : (
              <div className="bg-white/10 rounded-full h-7 w-7 flex items-center justify-center">
                <Armchair className="text-white/40 h-3.5 w-3.5" />
              </div>
            )}
          </button>
        </AvatarFrame>
        {occupant?.isMuted && <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 border border-black z-20"><MicOff className="h-2 w-2 text-white" /></div>}
      </div>
      
      <div className="flex items-center justify-center gap-0.5 w-full mt-0.5">
        {isOwner && index === 1 && (
          <div className="bg-yellow-500 rounded-full h-2 w-2 flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
             <Home className="h-1 w-1 text-white fill-current" />
          </div>
        )}
        <span className="text-[7px] font-black uppercase text-white truncate max-w-[55px] drop-shadow-sm leading-none">
          {occupant ? occupant.name : label}
        </span>
      </div>
    </div>
  );
};

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isExitPortalOpen, setIsExitPortalOpen] = useState(false);
  const [isUserProfileCardOpen, setIsUserProfileCardOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSeatMenuOpen, setIsSeatMenuOpen] = useState(false);
  const [isRoomPlayOpen, setIsRoomPlayOpen] = useState(false);
  const [isRoomGamesOpen, setIsRoomGamesOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isLuckyRainActive, setIsLuckyRainActive] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  
  const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [initialChatRecipient, setInitialChatRecipient] = useState<any>(null);
  const [activeGiftSync, setActiveGiftSync] = useState<{ id: string, senderName: string } | null>(null);
  const [isMutedLocal, setIsMutedLocal] = useState(false);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Music Streaming State
  const [musicStream, setMusicStream] = useState<MediaStream | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  const { setActiveRoom, setIsMinimized } = useRoomContext();

  const isOwner = currentUser?.uid === room.ownerId;
  const isModerator = room.moderatorIds?.includes(currentUser?.uid || '') || false;
  const canManageRoom = isOwner || isModerator;
  const isChatMuted = room.isChatMuted || false;

  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !room.id) return null;
    return doc(firestore, 'users', currentUser.uid, 'followedRooms', room.id);
  }, [firestore, currentUser, room.id]);
  const { data: followData } = useDoc(followRef);

  const configRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appConfig', 'global');
  }, [firestore]);
  const { data: globalConfig } = useDoc(configRef);

  const handleFollowRoom = () => {
    if (!firestore || !currentUser || !room.id) return;
    const ref = doc(firestore, 'users', currentUser.uid, 'followedRooms', room.id);
    if (followData) {
      deleteDocumentNonBlocking(ref);
      toast({ title: 'Unfollowed Frequency' });
    } else {
      setDocumentNonBlocking(ref, {
        id: room.id,
        title: room.title || room.name || 'Frequency',
        coverUrl: room.coverUrl || '',
        roomNumber: room.roomNumber || '0000',
        ownerId: room.ownerId || '',
        followedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: 'Frequency Followed' });
    }
  };

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id]);

  const { data: participantsData } = useCollection<RoomParticipant>(participantsQuery);
  
  const participants = useMemo(() => {
    if (!participantsData) return [];
    if (now === null) return participantsData;

    return participantsData.filter(p => {
      if (p.uid === currentUser?.uid) return true;
      const lastSeen = (p as any).lastSeen?.toDate?.()?.getTime?.() || 0;
      if (!lastSeen) return true;
      return (now - lastSeen) < 65000;
    });
  }, [participantsData, now, currentUser?.uid]);

  const onlineCount = participants.length;
  const currentUserParticipant = participants.find(p => p.uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  
  const { remoteStreams } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true, musicStream);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'), limitToLast(50));
  }, [firestore, room.id]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  // High-Fidelity Scroll Sync Protocol (Optimized for strictly 3 rows)
  useEffect(() => {
    if (messagesEndRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
      return () => clearTimeout(timer);
    }
    if (firestoreMessages && firestoreMessages.length > 0) {
      const lastMsg = firestoreMessages[firestoreMessages.length - 1];
      if (lastMsg.type === 'gift') {
        setActiveGiftSync({ id: lastMsg.giftId, senderName: lastMsg.senderName });
      } else if (lastMsg.type === 'lucky-rain') {
        setIsLuckyRainActive(true);
      }
    }
  }, [firestoreMessages]);

  const handleSendMessage = async (e?: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!messageText.trim() && !imageUrl) || !currentUser || !firestore || !userProfile) return;
    
    if (isChatMuted && !canManageRoom) {
      toast({ variant: 'destructive', title: 'Chat Restricted', description: 'The room authority has disabled public messages.' });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: messageText, 
      imageUrl: imageUrl || null,
      senderId: currentUser.uid, 
      senderName: userProfile.username || 'User', 
      senderAvatar: userProfile.avatarUrl || null, 
      chatRoomId: room.id, 
      timestamp: serverTimestamp(), 
      type: 'text'
    });
    setMessageText('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !currentUser || !room.id) return;

    setIsUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storagePath = `rooms/${room.id}/chat/${timestamp}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const result = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(result.ref);
      await handleSendMessage(undefined, url);
      setShowInput(false);
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload Failed' });
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleMicToggle = () => { 
    if (!isInSeat || !firestore || !currentUser || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); 
  };

  const handleMinimize = () => { setIsMinimized(true); router.push('/rooms'); };
  
  const handleExit = () => { 
    if (firestore && currentUser) {
      const roomDocRef = doc(firestore, 'chatRooms', room.id);
      updateDocumentNonBlocking(roomDocRef, { 
        participantCount: increment(-1),
        updatedAt: serverTimestamp() 
      });

      const pRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
      deleteDocumentNonBlocking(pRef);
      
      const uRef = doc(firestore, 'users', currentUser.uid);
      const profRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      updateDocumentNonBlocking(uRef, { currentRoomId: null, isOnline: false, updatedAt: serverTimestamp() });
      updateDocumentNonBlocking(profRef, { currentRoomId: null, isOnline: false, updatedAt: serverTimestamp() });
    }
    setActiveRoom(null); 
    router.push('/rooms'); 
  };

  const currentTheme = useMemo(() => {
    return ROOM_THEMES.find(t => t.id === room.roomThemeId) || ROOM_THEMES[0];
  }, [room.roomThemeId]);

  const bgUrl = currentTheme.url;

  const handleSeatClick = (index: number, occupant?: RoomParticipant) => {
    setSelectedSeatIdx(index);
    if (occupant) {
      setSelectedParticipantUid(occupant.uid);
      setIsUserProfileCardOpen(true);
    } else {
      setSelectedParticipantUid(null);
      setIsSeatMenuOpen(true);
    }
  };

  const handleSilence = (uid: string, current: boolean) => {
    if (!firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { isSilenced: !current, isMuted: !current });
  };

  const handleKick = (uid: string, duration: number) => {
    if (!firestore || !room.id) return;
    const expires = new Date(Date.now() + duration * 60000);
    setDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'bans', uid), { expiresAt: Timestamp.fromDate(expires) }, { merge: true });
    deleteDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid));
    toast({ title: 'Member Excluded', description: `Restricted for ${duration} minutes.` });
    setIsUserProfileCardOpen(false);
    setIsSeatMenuOpen(false);
  };

  const handleLeaveSeat = (uid: string) => {
    if (!firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { seatIndex: 0, isMuted: true });
    setIsSeatMenuOpen(false);
    setIsUserProfileCardOpen(false);
  };

  const handleToggleMod = (uid: string) => {
    if (!firestore || !room.id) return;
    const isCurrentlyMod = room.moderatorIds?.includes(uid);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
      moderatorIds: isCurrentlyMod ? arrayRemove(uid) : arrayUnion(uid)
    });
  };

  const handleInputClick = () => {
    if (isChatMuted && !canManageRoom) {
      toast({ 
        variant: 'destructive', 
        title: 'Chat Restricted', 
        description: 'Room authority has closed public messaging.' 
      });
      return;
    }
    setShowInput(true);
  };

  const handleOpenGiftPickerFromMenu = (recipient: any) => {
    setGiftRecipient(recipient);
    setIsGiftPickerOpen(true);
    setIsSeatMenuOpen(false);
  };

  const handleOpenChatFromProfile = (recipient: any) => {
    setInitialChatRecipient(recipient);
    setIsUserProfileCardOpen(false);
    setIsMessagesOpen(true);
  };

  const handleMention = (username: string) => {
    setIsUserProfileCardOpen(false);
    setMessageText(`@${username} `);
    setShowInput(true);
  };

  const handlePlayLocalMusic = (file: File) => {
    if (musicAudioRef.current) {
      const url = URL.createObjectURL(file);
      musicAudioRef.current.src = url;
      musicAudioRef.current.play().catch(e => {
        console.warn('[Music Sync] Play failed:', e);
        toast({ variant: 'destructive', title: 'Playback Failed', description: 'Please interact with the page to allow audio.' });
      });
      
      // Capture stream from audio element for WebRTC broadcasting
      // @ts-ignore
      const stream = musicAudioRef.current.captureStream?.() || musicAudioRef.current.mozCaptureStream?.();
      if (stream) {
        setMusicStream(stream);
      }
    }
  };

  const extraSeats = useMemo(() => {
    const count = (room.maxActiveMics || 9) - 1;
    return Array.from({ length: count }, (_, i) => i + 2);
  }, [room.maxActiveMics]);

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline">
      <DailyRewardDialog />
      <GiftAnimationOverlay 
        giftId={activeGiftSync?.id || null} 
        senderName={activeGiftSync?.senderName}
        onComplete={() => setActiveGiftSync(null)} 
      />
      <LuckyRainOverlay active={isLuckyRainActive} onComplete={() => setIsLuckyRainActive(false)} />
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} muted={isMutedLocal} />
      ))}
      
      {/* Hidden high-fidelity audio engine for local music sync */}
      <audio ref={musicAudioRef} className="hidden" crossOrigin="anonymous" />

      <div className="absolute inset-0 z-0">
        <Image 
          key={`${room.roomThemeId}`} 
          src={bgUrl} 
          alt="Background" 
          fill 
          unoptimized
          className="object-cover opacity-60 animate-in fade-in duration-1000" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-3 pt-10 px-4 shrink-0 w-full">
        <div className="flex items-center gap-2 max-w-[70%] min-w-0">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 rounded-xl border-2 border-white/20 shadow-xl">
              <AvatarImage src={room.coverUrl || undefined} />
              <AvatarFallback>UM</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1.5 -left-1 flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-1 py-0.5 rounded-full border border-white/10 z-20 shadow-lg">
               <Trophy className="h-2 w-2 text-yellow-400 fill-current" />
               <span className="text-[7px] font-black text-yellow-400 leading-none">
                 {room.stats?.totalGifts?.toLocaleString() || 0}
               </span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
             <div className="flex items-center gap-1 min-w-0">
                <h1 className="font-black text-[13px] uppercase tracking-tighter text-white leading-none drop-shadow-lg truncate max-w-[90px]">{room.title}</h1>
                <button onClick={handleFollowRoom} className={cn("h-5 w-5 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl shrink-0", followData ? "bg-red-50" : "bg-[#00E676]")}>
                   {followData ? <Heart className="h-3 w-3 text-white fill-current" /> : <div className="relative flex items-center justify-center"><Heart className="h-3.5 w-3.5 text-white" strokeWidth={3} /><Plus className="h-2 w-2 text-white absolute mt-0.5" strokeWidth={4} /></div>}
                </button>
             </div>
             <p className="text-[9px] font-bold text-white/60 uppercase mt-0.5 tracking-widest leading-none">ID:{room.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsUserListOpen(true)} className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 shadow-xl"><Users className="h-3.5 w-3.5 text-white/60" /><span className="text-[10px] font-black">{onlineCount}</span></button>
          {isOwner && <RoomSettingsDialog room={room} trigger={<button className="p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Hexagon className="h-4 w-4" /></button>} />}
          <button onClick={() => setIsShareOpen(true)} className="p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Share2 className="h-4 w-4" /></button>
          <button onClick={() => setIsExitPortalOpen(true)} className="p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Power className="h-4 w-4" /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col pt-0 overflow-hidden w-full">
        <div className="flex-1 flex flex-col items-center justify-start gap-3 pt-2 pb-48 overflow-y-auto no-scrollbar w-full">
           <div className="w-full flex justify-center px-6 mb-1">
              <div className="w-1/4 max-w-[90px]">
                <Seat index={1} label="No.1" theme={currentTheme} occupant={participants.find(p => p.seatIndex === 1)} isLocked={room.lockedSeats?.includes(1)} onClick={handleSeatClick} isOwner={isOwner} />
              </div>
           </div>
           <div className="w-full grid grid-cols-4 gap-1.5 px-4">
              {extraSeats.map(idx => (
                <Seat key={idx} index={idx} label={`No.${idx}`} theme={currentTheme} occupant={participants.find(p => p.seatIndex === idx)} isLocked={room.lockedSeats?.includes(idx)} onClick={handleSeatClick} isOwner={false} />
              ))}
           </div>
           <div className="mt-4 flex flex-col items-start gap-1 px-6 w-full">
              {globalConfig?.globalAnnouncement && (
                <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm border border-red-500/20 px-2 py-0.5 rounded-md animate-in slide-in-from-left-2 duration-700">
                   <Zap className="h-2 w-2 text-red-400 fill-current" />
                   <p className="text-[10px] font-black text-red-200 uppercase italic tracking-tight leading-relaxed">
                      Official: {globalConfig.globalAnnouncement}
                   </p>
                </div>
              )}
              <p className="text-[10px] font-black text-yellow-400 uppercase italic tracking-tight drop-shadow-md text-left leading-relaxed">
                 Announcement: {room.announcement || "Welcome to Umm Chat"}
              </p>
           </div>
        </div>

        {/* Expanded Compact Chat Dimension with Strictly Calibrated h-48 and Auto-Scroll Sync */}
        <div className="absolute bottom-0 left-0 w-full h-48 z-20 pointer-events-none p-3 pb-0">
           <ScrollArea className="h-full pr-3 pointer-events-auto">
              <div className="flex flex-col gap-1 justify-end min-h-full">
                 {firestoreMessages?.map((msg: any) => (
                   <div 
                    key={msg.id} 
                    onClick={() => {
                      setSelectedParticipantUid(msg.senderId);
                      setIsUserProfileCardOpen(true);
                    }}
                    className="flex items-start gap-1.5 bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/5 w-fit max-w-[85%] animate-in fade-in slide-in-from-left-2 shadow-xl mb-0.5 cursor-pointer active:scale-[0.98] transition-transform pointer-events-auto"
                   >
                      <Avatar className="h-5 w-5 shrink-0 border border-white/10"><AvatarImage src={msg.senderAvatar || undefined} /><AvatarFallback className="text-[10px]">{(msg.senderName || 'U').charAt(0)}</AvatarFallback></Avatar>
                      <div className="flex flex-col">
                        <span className={cn("text-[7px] font-black uppercase tracking-tighter leading-none mb-0.5", msg.senderId === currentUser?.uid ? "text-primary" : "text-white/40")}>{msg.senderName}</span>
                        {msg.imageUrl && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(msg.imageUrl);
                            }}
                            className="mt-1 relative aspect-square w-32 rounded-lg overflow-hidden border border-white/10"
                          >
                            <Image src={msg.imageUrl} fill className="object-cover" alt="Sent vibe" unoptimized />
                          </div>
                        )}
                        {msg.content && <p className="text-[9px] font-bold text-white leading-tight break-all">{msg.content}</p>}
                      </div>
                   </div>
                 ))}
                 <div ref={messagesEndRef} className="h-0 w-0" />
              </div>
           </ScrollArea>
        </div>
      </main>

      <footer className="relative z-50 px-6 pb-8 flex items-center justify-between pt-4">
        <div className="flex items-center">
           <button 
             onClick={handleInputClick} 
             className={cn(
               "backdrop-blur-xl rounded-full h-10 w-10 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-lg",
               isChatMuted && !canManageRoom ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-white/10 text-white"
             )}
           >
              <MessageSquare className="h-5 w-5" />
           </button>
        </div>

        <div className="absolute left-[48%] -translate-x-1/2 -translate-y-1">
           <button 
             onClick={() => { setGiftRecipient(null); setIsGiftPickerOpen(true); }} 
             className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-90 transition-transform border-2 border-white/20"
           >
              <GiftIcon className="h-6 w-6 text-white fill-white" />
           </button>
        </div>

        <div className="flex items-center gap-1.5">
           <button onClick={handleMicToggle} disabled={!isInSeat} className={cn("p-1.5 rounded-full transition-all active:scale-90 shadow-md", !isInSeat ? "bg-white/5 text-white/20 opacity-50" : (currentUserParticipant?.isMuted ? "bg-white/10 text-white" : "bg-green-500 text-white shadow-lg border border-white/20"))}>
              {isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
           </button>
           
           <button onClick={() => setIsEmojiPickerOpen(true)} className="p-1.5 bg-white/10 rounded-full active:scale-90 transition-transform shadow-md border border-white/5">
             <SmilePlus className="h-4 w-4 text-white" />
           </button>

           <button onClick={() => setIsMessagesOpen(true)} className="p-1.5 bg-white/10 rounded-full active:scale-90 transition-transform shadow-md border border-white/5">
              <Mail className="h-4 w-4 text-white" />
           </button>

           <button onClick={() => setIsRoomPlayOpen(true)} className="p-1.5 bg-white/10 rounded-full active:scale-90 transition-transform shadow-md border border-white/5">
              <LayoutGrid className="h-4 w-4 text-white" />
           </button>
        </div>
      </footer>

      {showInput && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 font-headline">
           <div className="bg-slate-900 rounded-[2rem] p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center px-4"><h3 className="font-black uppercase tracking-widest text-[9px] text-white/40">Broadcasting to Tribe</h3><button onClick={() => setShowInput(false)} className="text-white/40"><X className="h-4 w-4" /></button></div>
              <div className="flex gap-2">
                 <input 
                   type="file" 
                   ref={imageInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   onChange={handleImageUpload} 
                 />
                 <button 
                   type="button"
                   disabled={isUploadingImage}
                   onClick={() => imageInputRef.current?.click()}
                   className="bg-white/10 text-white h-12 w-12 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
                 >
                    {isUploadingImage ? <Loader className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                 </button>
                 <form className="flex-1 flex gap-2" onSubmit={(e) => { handleSendMessage(e); setShowInput(false); }}>
                    <Input autoFocus value={messageText} onChange={(e) => setMessageText(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-full px-5 text-white text-sm" placeholder="Type a message..." />
                    <button type="submit" className="bg-primary text-black h-12 w-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Mail className="h-5 w-5" /></button>
                 </form>
              </div>
           </div>
        </div>
      )}

      <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden font-headline">
          <DialogHeader className="sr-only">
            <DialogTitle>Exit Frequency</DialogTitle>
            <DialogDescription>Choose to minimize or exit the current tribal frequency.</DialogDescription>
          </DialogHeader>
          <div className="p-12 flex items-center justify-around gap-8">
            <button onClick={handleMinimize} className="flex flex-col items-center gap-4 active:scale-90 transition-transform">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl"><Minimize2 className="h-8 w-8 text-black" /></div>
              <span className="text-white font-black uppercase text-xs tracking-widest">Minimize</span>
            </button>
            <button onClick={handleExit} className="flex flex-col items-center gap-4 active:scale-90 transition-transform">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl"><LogOut className="h-8 w-8 text-pink-500" /></div>
              <span className="text-white font-black uppercase text-xs tracking-widest">Exit Room</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-black/95 p-0 flex flex-col items-center justify-center z-[300]">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Full screen view</DialogDescription>
          </DialogHeader>
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-12 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-[410] active:scale-90 transition-transform"
          >
            <X className="h-6 w-6" />
          </button>
          {previewImage && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image 
                src={previewImage} 
                alt="Full screen preview" 
                fill 
                className="object-contain" 
                unoptimized 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RoomUserListDialog open={isUserListOpen} onOpenChange={setIsUserListOpen} roomId={room.id} />
      <RoomShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} room={room} />
      <RoomPlayDialog 
        open={isRoomPlayOpen} 
        onOpenChange={setIsRoomPlayOpen} 
        participants={participants} 
        roomId={room.id} 
        room={room} 
        isMutedLocal={isMutedLocal}
        setIsMutedLocal={setIsMutedLocal}
        onOpenGames={() => setIsRoomGamesOpen(true)}
        onPlayLocalMusic={handlePlayLocalMusic}
      />
      <RoomGamesDialog open={isRoomGamesOpen} onOpenChange={setIsRoomGamesOpen} />
      <RoomMessagesDialog 
        open={isMessagesOpen} 
        onOpenChange={(val) => {
          setIsMessagesOpen(val);
          if (!val) setInitialChatRecipient(null);
        }} 
        initialRecipient={initialChatRecipient}
      />
      <RoomEmojiPickerDialog open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen} roomId={room.id} />
      <GiftPicker open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen} roomId={room.id} recipient={giftRecipient} participants={participants} />
      
      <RoomSeatMenuDialog 
        open={isSeatMenuOpen} 
        onOpenChange={setIsSeatMenuOpen}
        seatIndex={selectedSeatIdx}
        roomId={room.id}
        isLocked={room.lockedSeats?.includes(selectedSeatIdx || 0) || false}
        occupantUid={selectedParticipantUid}
        occupantName={participants.find(p => p.uid === selectedParticipantUid)?.name}
        occupantAvatarUrl={participants.find(p => p.uid === selectedParticipantUid)?.avatarUrl}
        canManage={canManageRoom}
        currentUserId={currentUser?.uid}
        onLeaveSeat={handleLeaveSeat}
        onKick={handleKick}
        onSendGift={handleOpenGiftPickerFromMenu}
      />

      <RoomUserProfileDialog 
        userId={selectedParticipantUid}
        open={isUserProfileCardOpen}
        onOpenChange={setIsUserProfileCardOpen}
        canManage={canManageRoom}
        isOwner={isOwner}
        roomOwnerId={room.ownerId}
        roomModeratorIds={room.moderatorIds || []}
        onSilence={handleSilence}
        onKick={handleKick}
        onLeaveSeat={handleLeaveSeat}
        onToggleMod={handleToggleMod}
        onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }}
        onOpenChat={handleOpenChatFromProfile}
        onMention={handleMention}
        isSilenced={participants.find(p => p.uid === selectedParticipantUid)?.isSilenced || false}
        isMe={selectedParticipantUid === currentUser?.uid}
      />
    </div>
  );
}
