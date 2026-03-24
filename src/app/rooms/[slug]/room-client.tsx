'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
 Loader,
 ShieldCheck
} from 'lucide-react';
import { GoldCoinIcon, GameControllerIcon, UmmyLogoIcon } from '@/components/icons';
import type { Room, RoomParticipant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
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
 Timestamp,
 where
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
import { useVoiceActivity } from '@/hooks/use-voice-activity';
import { RoomFollowersDialog } from '@/components/room-followers-dialog';

function RemoteAudio({ stream, muted, audioContext, peerId, onSpeakingChange }: { 
 stream: MediaStream, 
 muted: boolean, 
 audioContext: AudioContext | null,
 peerId: string,
 onSpeakingChange: (peerId: string, isSpeaking: boolean) => void
}) {
 const audioRef = useRef<HTMLAudioElement>(null);
 const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
 const gainRef = useRef<GainNode | null>(null);
 const isSpeaking = useVoiceActivity(stream, audioContext);

 useEffect(() => {
  onSpeakingChange(peerId, isSpeaking);
 }, [isSpeaking, peerId, onSpeakingChange]);

 useEffect(() => {
  if (!stream || !audioContext) return;
  
  const ctx = audioContext;
  if (sourceRef.current) sourceRef.current.disconnect();
  
  sourceRef.current = ctx.createMediaStreamSource(stream);
  gainRef.current = ctx.createGain();
  sourceRef.current.connect(gainRef.current);
  gainRef.current.connect(ctx.destination);
  
  // Gain at 1.5 for extra clarity without clipping
  gainRef.current.gain.setValueAtTime(muted ? 0 : 1.5, ctx.currentTime);

  if (audioRef.current) {
   audioRef.current.srcObject = stream;
   audioRef.current.muted = true;
   audioRef.current.play().catch(() => {});
  }

  return () => {
   if (sourceRef.current) sourceRef.current.disconnect();
   if (gainRef.current) gainRef.current.disconnect();
  };
 }, [stream, muted, audioContext]);

 return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

// Local Voice Activity Monitor
function VADMonitor({ stream, audioContext, onSpeakingChange }: { 
 stream: MediaStream | null, 
 audioContext: AudioContext | null,
 onSpeakingChange: (isSpeaking: boolean) => void
}) {
 const isSpeaking = useVoiceActivity(stream, audioContext);
 useEffect(() => {
  onSpeakingChange(isSpeaking);
 }, [isSpeaking, onSpeakingChange]);
 return null;
}

const Seat = ({ 
 index, 
 label, 
 occupant, 
 isLocked, 
 theme, 
 onClick,
 roomOwnerId,
 roomModeratorIds,
 isSpeaking,
 connectionState
}: { 
 index: number, 
 label: string, 
 occupant?: RoomParticipant, 
 isLocked?: boolean, 
 theme: any,
 onClick: (index: number, occupant?: RoomParticipant) => void,
 roomOwnerId: string,
 roomModeratorIds: string[],
 isSpeaking?: boolean,
 connectionState?: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'
}) => {
 const isOccupantOwner = occupant?.uid === roomOwnerId;
 const isOccupantAdmin = roomModeratorIds.includes(occupant?.uid || '');

 return (
  <div className="flex flex-col items-center gap-1 w-full max-w-[65px]">
   <div className="relative">
    <EmojiReactionOverlay emoji={occupant?.activeEmoji} size="sm" />
    {occupant && !occupant.isMuted && isSpeaking && (
     <div className="absolute -inset-1 rounded-full border-2 animate-voice-wave" style={{ color: theme.accentColor }} />
    )}
    <AvatarFrame frameId={occupant?.activeFrame} size="md">
     <div className={cn(
      "relative p-1 rounded-full",
      "after:absolute after:inset-0 after:rounded-full after:border-b-4 after:border-black/30 after:pointer-events-none"
     )}>
      <button 
       onClick={() => onClick(index, occupant)} 
       className={cn(
        "h-12 w-12 rounded-full flex items-center justify-center border-2 backdrop-blur-sm active:scale-90 transition-all relative z-10",
        "shadow-[0_4px_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.2)]",
        isLocked ? "border-red-500/40" : "border-white/10"
       )}
       style={{ backgroundColor: theme.seatColor || 'rgba(255, 255, 255, 0.1)' }}
      >
       {occupant ? (
        <Avatar className="h-full w-full p-0.5">
         <AvatarImage src={occupant.avatarUrl || undefined} />
         <AvatarFallback>{(occupant.name || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
       ) : isLocked ? (
        <Lock className="h-3.5 w-3.5 text-red-500/40" />
       ) : (
        <div className="bg-white/10 rounded-full h-7 w-7 flex items-center justify-center shadow-inner">
         <Armchair className="text-white/40 h-3.5 w-3.5" />
        </div>
       )}
      </button>
     </div>
    </AvatarFrame>
    {occupant?.isMuted && <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 border border-black z-20"><MicOff className="h-2 w-2 text-white" /></div>}
    {occupant && connectionState && (
     <div className="absolute top-0 right-0 z-30 flex items-center justify-center p-0.5 bg-black/60 rounded-full border border-white/20 backdrop-blur-sm shadow-md">
      <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_5px_currentColor]", 
       connectionState === 'connected' ? "bg-green-500 text-green-500" :
       connectionState === 'connecting' || connectionState === 'new' ? "bg-yellow-500 text-yellow-500 animate-pulse" :
       "bg-red-500 text-red-500 animate-pulse"
      )} />
     </div>
    )}
   </div>
   
   <div className="flex items-center justify-center gap-0.5 w-full mt-0.5">
    {occupant && isOccupantOwner && (
     <div className="bg-yellow-500 rounded-full h-2 w-2 flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
       <Home className="h-1 w-1 text-white fill-current" />
     </div>
    )}
    {occupant && !isOccupantOwner && isOccupantAdmin && (
     <div className="bg-green-500 rounded-full h-2 w-2 flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
       <ShieldCheck className="h-1 w-1 text-white fill-current" />
     </div>
    )}
    <span className="text-[7px] font-bold uppercase text-white truncate max-w-[55px] drop-shadow-sm leading-none">
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
 const [isFollowersOpen, setIsFollowersOpen] = useState(false);
 const [isLuckyRainActive, setIsLuckyRainActive] = useState(false);
 const [now, setNow] = useState<number | null>(null);
 const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
 const audioContextRef = useRef<AudioContext | null>(null);

 useEffect(() => {
  const handleInteraction = () => {
   if (!audioContextRef.current) {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
   }
   if (audioContextRef.current.state === 'suspended') {
    audioContextRef.current.resume().catch(() => {});
   }
  };
  window.addEventListener('click', handleInteraction);
  window.addEventListener('touchstart', handleInteraction);
  return () => {
   window.removeEventListener('click', handleInteraction);
   window.removeEventListener('touchstart', handleInteraction);
  };
 }, []);
 
 const [sessionJoinTime] = useState(() => new Date());
 const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
 const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
 const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
 const [initialChatRecipient, setInitialChatRecipient] = useState<any>(null);
 const [activeGiftSync, setActiveGiftSync] = useState<{ id: string, senderName: string } | null>(null);
 const [isMutedLocal, setIsMutedLocal] = useState(false);
 const [previewImage, setPreviewImage] = useState<string | null>(null);
 const [isUploadingImage, setIsUploadingImage] = useState(false);
 const imageInputRef = useRef<HTMLInputElement>(null);
 const [musicStream, setMusicStream] = useState<MediaStream | null>(null);
 const musicAudioRef = useRef<HTMLAudioElement>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const lastProcessedId = useRef<string | null>(null);

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
  const userFollowRef = doc(firestore, 'users', currentUser.uid, 'followedRooms', room.id);
  const roomFollowRef = doc(firestore, 'chatRooms', room.id, 'followers', currentUser.uid);

  if (followData) {
   deleteDocumentNonBlocking(userFollowRef);
   deleteDocumentNonBlocking(roomFollowRef);
   toast({ title: 'Unfollowed Frequency' });
  } else {
   const followObj = {
    id: room.id,
    title: room.title || (room as any).name || 'Frequency',
    coverUrl: room.coverUrl || '',
    roomNumber: room.roomNumber || '0000',
    ownerId: room.ownerId || '',
    followedAt: serverTimestamp()
   };
   setDocumentNonBlocking(userFollowRef, followObj, { merge: true });
   setDocumentNonBlocking(roomFollowRef, {
    uid: currentUser.uid,
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
 
 const { localStream, remoteStreams, connectionStates } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true, musicStream);

 const messagesQuery = useMemoFirebase(() => {
  if (!firestore || !room.id) return null;
  return query(
   collection(firestore, 'chatRooms', room.id, 'messages'), 
   where('timestamp', '>', Timestamp.fromDate(sessionJoinTime)),
   orderBy('timestamp', 'asc'), 
   limitToLast(50)
  );
 }, [firestore, room.id, sessionJoinTime]);

 const { data: firestoreMessages } = useCollection(messagesQuery);

 useEffect(() => {
  if (messagesEndRef.current) {
   const timer = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
   }, 50);
   return () => clearTimeout(timer);
  }
 }, [firestoreMessages]);

 useEffect(() => {
  if (!firestoreMessages || firestoreMessages.length === 0) return;
  const startIndex = lastProcessedId.current 
   ? firestoreMessages.findIndex(m => m.id === lastProcessedId.current) + 1
   : 0;
  const newBatch = firestoreMessages.slice(startIndex);
  newBatch.forEach(msg => {
   if (msg.type === 'gift' && msg.giftId) {
    setActiveGiftSync({ id: msg.giftId, senderName: msg.senderName });
   } else if (msg.type === 'lucky-rain') {
    setIsLuckyRainActive(true);
   }
  });
  if (newBatch.length > 0) {
   lastProcessedId.current = firestoreMessages[firestoreMessages.length - 1].id;
  }
 }, [firestoreMessages]);

 const themesQuery = useMemoFirebase(() => {
  if (!firestore) return null;
  return query(collection(firestore, 'roomThemes'));
 }, [firestore]);
 const { data: dbThemes } = useCollection<any>(themesQuery);

 const currentTheme = useMemo(() => {
  if (room.backgroundUrl) {
   return { 
    id: 'custom', 
    url: room.backgroundUrl, 
    accentColor: '#FFCC00', 
    seatColor: 'rgba(255, 255, 255, 0.1)', 
    name: 'Custom' 
   };
  }
  const staticTheme = ROOM_THEMES.find(t => t.id === room.roomThemeId);
  if (staticTheme) return staticTheme;
  const dbTheme = dbThemes?.find(t => t.id === room.roomThemeId);
  if (dbTheme) return dbTheme;
  return ROOM_THEMES[0];
 }, [room.roomThemeId, room.backgroundUrl, dbThemes]);

 const bgUrl = currentTheme.url;

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
   senderBubble: userProfile.inventory?.activeBubble || null,
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

 const handlePlayLocalMusic = (file: File) => {
  if (musicAudioRef.current) {
   const url = URL.createObjectURL(file);
   musicAudioRef.current.src = url;
   musicAudioRef.current.play().catch(e => {
    console.warn('[Music Sync] Play failed:', e);
    toast({ variant: 'destructive', title: 'Playback Failed', description: 'Please interact with the page to allow audio.' });
   });
   // @ts-ignore
   const stream = musicAudioRef.current.captureStream?.() || musicAudioRef.current.mozCaptureStream?.();
   if (stream) setMusicStream(stream);
  }
 };

 const handleInputClick = () => {
  if (isChatMuted && !canManageRoom) {
   toast({ variant: 'destructive', title: 'Chat Restricted', description: 'Room authority has closed public messaging.' });
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

 const extraSeats = useMemo(() => {
  const count = (room.maxActiveMics || 9) - 1;
  return Array.from({ length: count }, (_, i) => i + 2);
 }, [room.maxActiveMics]);

 const chatConfig = useMemo(() => {
  const mics = room.maxActiveMics || 9;
  if (mics === 5) return { height: 'h-80', padding: 'pb-80' };
  if (mics === 13) return { height: 'h-40', padding: 'pb-48' };
  return { height: 'h-64', padding: 'pb-64' }; // Default 9 seats
 }, [room.maxActiveMics]);

 const handleSpeakingChange = useCallback((peerId: string, isSpeaking: boolean) => {
  setActiveSpeakers(prev => {
   if (prev.has(peerId) === isSpeaking) return prev;
   const next = new Set(prev);
   if (isSpeaking) next.add(peerId);
   else next.delete(peerId);
   return next;
  });
 }, []);

 const handleLocalSpeakingChange = useCallback((isSpeaking: boolean) => {
  if (currentUser?.uid) handleSpeakingChange(currentUser.uid, isSpeaking);
 }, [currentUser?.uid, handleSpeakingChange]);

 return (
  <div className="relative flex flex-col h-[100dvh] w-full bg-black overflow-hidden text-white font-sans">
   <DailyRewardDialog />
   <GiftAnimationOverlay 
    giftId={activeGiftSync?.id || null} 
    senderName={activeGiftSync?.senderName}
    onComplete={() => setActiveGiftSync(null)} 
   />
   <LuckyRainOverlay active={isLuckyRainActive} onComplete={() => setIsLuckyRainActive(false)} />
   
   {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
    <RemoteAudio 
     key={peerId} 
     stream={stream} 
     muted={isMutedLocal} 
     audioContext={audioContextRef.current}
     peerId={peerId}
     onSpeakingChange={handleSpeakingChange}
    />
   ))}

   <VADMonitor 
    stream={localStream} 
    audioContext={audioContextRef.current} 
    onSpeakingChange={handleLocalSpeakingChange} 
   />
   
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

    {(room.roomThemeId === 'ummy_help_dark' || room.roomThemeId === 'ummy_help_light') && (
     <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none opacity-30 mix-blend-overlay pb-32">
       <div className="bg-white/5 backdrop-blur-[2px] p-8 rounded-[3rem] border border-white/10 flex flex-col items-center shadow-2xl">
         <UmmyLogoIcon className="h-32 w-32 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] opacity-90" />
         <h1 className="text-3xl font-black text-white tracking-widest uppercase drop-shadow-md">Ummy Help</h1>
       </div>
     </div>
    )}

    {(room.roomThemeId === 'ummy_official_dark' || room.roomThemeId === 'ummy_official_light') && (
     <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none opacity-30 mix-blend-overlay pb-32">
       <div className="bg-white/5 backdrop-blur-[2px] p-8 rounded-[3rem] border border-white/10 flex flex-col items-center shadow-2xl">
         <UmmyLogoIcon className="h-32 w-32 mb-4 drop-shadow-[0_0_15px_rgba(255,204,0,0.8)] opacity-90" />
         <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 tracking-widest uppercase drop-shadow-md">Ummy Official</h1>
       </div>
     </div>
    )}
   </div>

   <header className="relative z-50 flex items-center justify-between p-3 pt-safe px-4 shrink-0 w-full">
    <div className="pt-5 flex items-center justify-between w-full">
     <div className="flex items-center gap-2 max-w-[70%] min-w-0">
      <div 
       onClick={() => setIsFollowersOpen(true)}
       className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
      >
       <Avatar className="h-10 w-10 rounded-xl border-2 border-white/20 shadow-xl">
        <AvatarImage src={room.coverUrl || undefined} />
        <AvatarFallback>UM</AvatarFallback>
       </Avatar>
       <div className="absolute -bottom-1.5 -left-1 flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-1 py-0.5 rounded-full border border-white/10 z-20 shadow-lg">
         <Trophy className="h-2 w-2 text-yellow-400 fill-current" />
         <span className="text-[7px] font-bold text-yellow-400 leading-none">
          {room.stats?.totalGifts?.toLocaleString() || 0}
         </span>
       </div>
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1 min-w-0">
         <h1 className="font-bold text-[13px] uppercase tracking-tight text-white leading-none drop-shadow-lg truncate max-w-[90px]">{room.title}</h1>
         <button onClick={handleFollowRoom} className={cn("h-5 w-5 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl shrink-0", followData ? "bg-red-50" : "bg-[#00E676]")}>
           {followData ? <Heart className="h-3 w-3 text-white fill-current" /> : <div className="relative flex items-center justify-center"><Heart className="h-3.5 w-3.5 text-white" strokeWidth={3} /><Plus className="h-2 w-2 text-white absolute mt-0.5" strokeWidth={4} /></div>}
         </button>
        </div>
        <p className="text-[9px] font-bold text-white/60 uppercase mt-0.5 tracking-wider leading-none">ID:{room.roomNumber}</p>
      </div>
     </div>
     <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => setIsUserListOpen(true)} className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 shadow-xl"><Users className="h-3.5 w-3.5 text-white/60" /><span className="text-[10px] font-bold">{onlineCount}</span></button>
      {isOwner && <RoomSettingsDialog room={room} trigger={<button className="p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Hexagon className="h-4 w-4" /></button>} />}
      <button onClick={() => setIsShareOpen(true)} className="p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Share2 className="h-4 w-4" /></button>
      <button onClick={() => setIsExitPortalOpen(true)} className="p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Power className="h-4 w-4" /></button>
     </div>
    </div>
   </header>

   <main className="relative z-10 flex-1 flex flex-col pt-0 overflow-hidden w-full">
    <div className={cn("flex-1 flex flex-col items-center justify-start gap-3 pt-2 overflow-y-auto no-scrollbar w-full", chatConfig.padding)}>
      <div className="w-full flex justify-center px-6 mb-1">
       <div className="w-1/4 max-w-[90px]">
        <Seat 
         index={1} 
         label="No.1" 
         theme={currentTheme} 
         occupant={participants.find(p => p.seatIndex === 1)} 
         isLocked={room.lockedSeats?.includes(1)} 
         onClick={handleSeatClick} 
         roomOwnerId={room.ownerId} 
         roomModeratorIds={room.moderatorIds || []} 
         isSpeaking={activeSpeakers.has(participants.find(p => p.seatIndex === 1)?.uid || '')}
         connectionState={connectionStates.get(participants.find(p => p.seatIndex === 1)?.uid || '')}
        />
       </div>
      </div>
      
      <div className="w-full grid grid-cols-4 gap-1.5 px-4 mb-4">
       {extraSeats.map(idx => {
        const occupant = participants.find(p => p.seatIndex === idx);
        return (
         <Seat 
          key={idx} 
          index={idx} 
          label={`No.${idx}`} 
          theme={currentTheme} 
          occupant={occupant} 
          isLocked={room.lockedSeats?.includes(idx)} 
          onClick={handleSeatClick} 
          roomOwnerId={room.ownerId} 
          roomModeratorIds={room.moderatorIds || []} 
          isSpeaking={activeSpeakers.has(occupant?.uid || '')}
          connectionState={occupant ? connectionStates.get(occupant.uid) : undefined}
         />
        );
       })}
      </div>

      <div className="mt-4 flex flex-col items-start gap-1 px-6 w-full">
       {globalConfig?.globalAnnouncement && (
        <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm border border-red-500/20 px-2 py-0.5 rounded-md animate-in slide-in-from-left-2 duration-700">
          <Zap className="h-2 w-2 text-red-400 fill-current" />
          <p className="text-[10px] font-bold text-red-200 uppercase tracking-tight leading-relaxed">
           Official: {globalConfig.globalAnnouncement}
          </p>
        </div>
       )}
       <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-tight drop-shadow-md text-left leading-relaxed">
         Announcement: {room.announcement || "Welcome to Umm Chat"}
       </p>
      </div>
    </div>

    <div className={cn("absolute bottom-0 left-0 w-full z-20 pointer-events-none p-3 pb-0 transition-all duration-500", chatConfig.height)}>
      <ScrollArea className="h-full pr-3 pointer-events-auto">
       <div className="flex flex-col gap-1 justify-end min-h-full">
         {firestoreMessages?.map((msg: any) => (
          <div 
          key={msg.id || Math.random().toString()} 
          onClick={() => {
           if (msg.senderId) {
            setSelectedParticipantUid(msg.senderId);
            setIsUserProfileCardOpen(true);
           }
          }}
          className={cn(
           "flex items-start gap-1.5 rounded-lg p-1 w-fit max-w-[85%] animate-in fade-in slide-in-from-left-2 shadow-sm mb-0.5 cursor-pointer active:scale-[0.98] transition-transform pointer-events-auto",
           msg.senderBubble ? "bg-transparent p-0" : "bg-black/40 backdrop-blur-md border border-white/5"
          )}
          >
           {!msg.senderBubble && (
            <Avatar className="h-5 w-5 shrink-0 border border-white/10 mt-0.5"><AvatarImage src={msg.senderAvatar || undefined} /><AvatarFallback className="text-[10px]">{(msg.senderName || 'U').charAt(0)}</AvatarFallback></Avatar>
           )}
           <div className="flex flex-col flex-1 min-w-0">
            {msg.senderBubble ? (
             <ChatMessageBubble bubbleId={msg.senderBubble} isMe={msg.senderId === currentUser?.uid} className="px-2 py-1.5 shadow-md border-none text-[10px]">
              <div className="flex items-center gap-1.5 mb-1">
               <Avatar className="h-4 w-4 shrink-0 shadow-sm"><AvatarImage src={msg.senderAvatar || undefined} /><AvatarFallback className="text-[8px]">{(msg.senderName || 'U').charAt(0)}</AvatarFallback></Avatar>
               <span className="text-[8px] font-bold text-white/90 uppercase tracking-tight">{msg.senderName || 'Tribe Member'}</span>
              </div>
              {msg.imageUrl && (
               <div 
                onClick={(e) => {
                 e.stopPropagation();
                 setPreviewImage(msg.imageUrl);
                }}
                className="mb-1 relative aspect-square w-32 rounded-lg overflow-hidden border border-white/10 shadow-sm"
               >
                <Image src={msg.imageUrl} fill className="object-cover" alt="Sent vibe" unoptimized />
               </div>
              )}
              {msg.content && <p className="font-bold leading-snug drop-shadow-sm">{msg.content}</p>}
             </ChatMessageBubble>
            ) : (
             <>
              <span className={cn("text-[7px] font-bold uppercase tracking-tight leading-none mb-0.5", msg.senderId === currentUser?.uid ? "text-primary" : "text-white/40")}>{msg.senderName || 'Tribe Member'}</span>
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
             </>
            )}
           </div>
          </div>
         ))}
         <div ref={messagesEndRef} className="h-0 w-0" />
       </div>
      </ScrollArea>
    </div>
   </main>

   <footer className="relative z-50 px-6 pb-safe flex items-center justify-between pt-6 shrink-0">
    <div className="pb-4 pt-4 flex items-center justify-between w-full relative">
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

     <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1">
       <button 
        onClick={() => { setGiftRecipient(null); setIsGiftPickerOpen(true); }} 
        className="h-14 w-14 rounded-full bg-gradient-to-br from-[#00B0FF] via-[#0091EA] to-[#007BB5] flex items-center justify-center shadow-[0_0_25px_rgba(0,176,255,0.6)] active:scale-95 transition-all border-2 border-white/40 overflow-hidden group relative"
       >
        <div className="absolute inset-0 bg-white/40 -skew-x-[30deg] -translate-x-[200%] group-hover:animate-shine pointer-events-none z-20" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
        
        <img 
         src="https://img.icons8.com/color/96/gift--v1.png" 
         className="h-11 w-11 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] filter brightness-110 saturate-125 hue-rotate-[280deg] animate-reaction-float relative z-10" 
         alt="Gift"
        />
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
    </div>
   </footer>

   {showInput && (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end p-4 font-sans pointer-events-none">
      <div className="absolute inset-0 bg-black/10 pointer-events-auto" onClick={() => setShowInput(false)} />
      <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-20 pointer-events-auto shadow-2xl border border-white/10 ring-1 ring-white/5 mx-auto w-full max-w-lg mb-4">
       <div className="flex justify-between items-center px-4">
         <h3 className="font-bold uppercase tracking-wider text-[9px] text-white/40">Broadcasting to Tribe</h3>
         <button onClick={() => setShowInput(false)} className="text-white/40 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
       </div>
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
          className="bg-white/10 text-white h-12 w-12 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 hover:bg-white/20"
         >
          {isUploadingImage ? <Loader className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
         </button>
         <form className="flex-1 flex gap-2" onSubmit={(e) => { handleSendMessage(e); setShowInput(false); }}>
          <Input 
           autoFocus 
           value={messageText} 
           onChange={(e) => setMessageText(e.target.value)} 
           className="h-12 bg-white/5 border-white/10 rounded-full px-5 text-white text-sm focus-visible:ring-primary/30" 
           placeholder="Type a message..." 
          />
          <button type="submit" className="bg-primary text-black h-12 w-12 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/20 hover:brightness-110">
            <Mail className="h-5 w-5" />
          </button>
         </form>
       </div>
      </div>
    </div>
   )}

   <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
    <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-black/95 p-0 flex flex-col items-center justify-center z-[300]">
     <DialogHeader className="sr-only">
      <DialogTitle>Image Preview</DialogTitle>
      <DialogDescription>Full screen view</DialogDescription>
     </DialogHeader>
     <button 
      onClick={() => setPreviewImage(null)}
      className="absolute top-safe right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-[410] active:scale-90 transition-transform"
     >
      <div className="pt-4">
       <X className="h-6 w-6" />
      </div>
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

   <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}>
    <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden font-sans">
     <DialogHeader className="sr-only">
      <DialogTitle>Exit Frequency</DialogTitle>
      <DialogDescription>Choose to minimize or exit the current tribal frequency.</DialogDescription>
     </DialogHeader>
     <div className="p-12 flex items-center justify-around gap-8">
      <button onClick={handleMinimize} className="flex flex-col items-center gap-4 active:scale-90 transition-transform">
       <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl"><Minimize2 className="h-8 w-8 text-black" /></div>
       <span className="text-white font-bold uppercase text-xs tracking-wider">Minimize</span>
      </button>
      <button onClick={handleExit} className="flex flex-col items-center gap-4 active:scale-90 transition-transform">
       <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl"><LogOut className="h-8 w-8 text-pink-500" /></div>
       <span className="text-white font-bold uppercase text-xs tracking-wider">Exit Room</span>
      </button>
     </div>
    </DialogContent>
   </Dialog>

   <RoomUserListDialog open={isUserListOpen} onOpenChange={setIsUserListOpen} roomId={room.id} />
   <RoomFollowersDialog open={isFollowersOpen} onOpenChange={setIsFollowersOpen} room={room} />
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
