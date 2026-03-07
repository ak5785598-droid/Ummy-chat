
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
  LogOut,
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
  UserX,
  UserCheck,
  Ban,
  Heart,
  Plus
} from 'lucide-react';
import { GoldCoinIcon, GameControllerIcon } from '@/components/icons';
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
  arrayRemove,
  Timestamp
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
import { GiftPicker } from '@/components/gift-picker';
import { RoomPlayDialog } from '@/components/room-play-dialog';
import { LuckyRainOverlay } from '@/components/lucky-rain-overlay';
import { RoomSeatMenuDialog } from '@/components/room-seat-menu-dialog';
import { ROOM_THEMES } from '@/lib/themes';
import { EmojiReactionOverlay } from '@/components/emoji-reaction-overlay';
import { RoomGamesDialog } from '@/components/room-games-dialog';
import { RoomMessagesDialog } from '@/components/room-messages-dialog';

function RemoteAudio({ stream, muted }: { stream: MediaStream, muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.muted = muted;
      audioRef.current.play().catch(() => {});
    }
  }, [stream, muted]);
  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

const Seat = ({ 
  index, 
  label, 
  occupant, 
  isLocked, 
  theme, 
  onClick 
}: { 
  index: number, 
  label: string, 
  occupant?: RoomParticipant, 
  isLocked?: boolean, 
  theme: any,
  onClick: (index: number, occupant?: RoomParticipant) => void 
}) => {
  return (
    <div className="flex flex-col items-center gap-1 w-[22%]">
      <div className="relative">
        <EmojiReactionOverlay emoji={occupant?.activeEmoji} size="sm" />
        {occupant && !occupant.isMuted && (
          <div className="absolute -inset-1 rounded-full border-2 animate-voice-wave" style={{ color: theme.accentColor }} />
        )}
        <AvatarFrame frameId={occupant?.activeFrame} size="md">
          <button 
            onClick={() => onClick(index, occupant)} 
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center border-2 backdrop-blur-sm active:scale-90 transition-transform relative z-10",
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
              <Lock className="h-4 w-4 text-red-500/40" />
            ) : (
              <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center">
                <Armchair className="text-white/40 h-4 w-4" />
              </div>
            )}
          </button>
        </AvatarFrame>
        {occupant?.isMuted && <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 border border-black z-20"><MicOff className="h-2 w-2 text-white" /></div>}
      </div>
      <span className="text-[10px] font-bold text-white/60 uppercase truncate w-14 text-center">
        {occupant ? occupant.name : label}
      </span>
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
  const [isLuckyRainActive, setIsLuckyRainActive] = useState(false);
  const [now, setNow] = useState(Date.now());
  
  const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [isMutedLocal, setIsMutedLocal] = useState(false);

  // Music Synchronization States
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicStream, setMusicStream] = useState<MediaStream | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

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
  const isChatMuted = room.isChatMuted || false;

  // Follow Frequency Logic
  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !room.id) return null;
    return doc(firestore, 'users', currentUser.uid, 'followedRooms', room.id);
  }, [firestore, currentUser, room.id]);
  const { data: followData } = useDoc(followRef);

  const handleFollowRoom = () => {
    if (!firestore || !currentUser || !room.id) return;
    const ref = doc(firestore, 'users', currentUser.uid, 'followedRooms', room.id);
    if (followData) {
      deleteDocumentNonBlocking(ref);
      toast({ title: 'Unfollowed Frequency' });
    } else {
      setDocumentNonBlocking(ref, {
        id: room.id,
        title: room.title,
        coverUrl: room.coverUrl,
        roomNumber: room.roomNumber,
        ownerId: room.ownerId,
        followedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: 'Frequency Followed', description: 'Synchronized to your Me tab.' });
    }
  };

  useEffect(() => {
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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (firestoreMessages && firestoreMessages.length > 0) {
      const lastMsg = firestoreMessages[firestoreMessages.length - 1];
      if (lastMsg.type === 'gift') {
        setActiveGiftAnimation(lastMsg.giftId);
      } else if (lastMsg.type === 'lucky-rain') {
        setIsLuckyRainActive(true);
      }
    }
  }, [firestoreMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || !userProfile) return;
    
    if (isChatMuted && !canManageRoom) {
      toast({ variant: 'destructive', title: 'Chat Restricted', description: 'The room authority has disabled public messages.' });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: messageText, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || null, chatRoomId: room.id, timestamp: serverTimestamp(), type: 'text'
    });
    setMessageText('');
  };

  const handleMicToggle = () => { 
    if (!isInSeat || !firestore || !currentUser || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); 
  };

  const handlePlayMusic = (url: string) => {
    if (!isInSeat) {
      toast({ variant: 'destructive', title: 'Sync Restricted', description: 'You must take a seat to share music frequencies.' });
      return;
    }
    setMusicUrl(url);
    toast({ title: 'Music Syncing...', description: 'Establishing multi-track audio frequency.' });
  };

  const handleStopMusic = () => {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicUrl(null);
    setMusicStream(null);
    toast({ title: 'Music Frequency Terminated' });
  };

  useEffect(() => {
    if (musicUrl && musicAudioRef.current) {
      const audio = musicAudioRef.current;
      audio.src = musicUrl;
      audio.crossOrigin = "anonymous";
      audio.load();
      audio.play().then(() => {
        const stream = (audio as any).captureStream ? (audio as any).captureStream() : ((audio as any).mozCaptureStream ? (audio as any).mozCaptureStream() : null);
        if (stream) setMusicStream(stream);
      }).catch(console.error);
    } else {
      setMusicStream(null);
    }
  }, [musicUrl]);

  const handleMinimize = () => { setIsMinimized(true); router.push('/rooms'); };
  const handleExit = () => { setActiveRoom(null); router.push('/rooms'); };

  const currentTheme = useMemo(() => {
    return ROOM_THEMES.find(t => t.id === room.roomThemeId) || ROOM_THEMES[0];
  }, [room.roomThemeId]);

  const bgUrl = currentTheme.url;

  const handleSeatClick = (index: number, occupant?: RoomParticipant) => {
    setSelectedSeatIdx(index);
    if (occupant) {
      setSelectedParticipantUid(occupant.uid);
      if (canManageRoom || occupant.uid === currentUser?.uid) setIsSeatMenuOpen(true);
      else setIsUserProfileCardOpen(true);
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

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline">
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <LuckyRainOverlay active={isLuckyRainActive} onComplete={() => setIsLuckyRainActive(false)} />
      
      <audio ref={musicAudioRef} className="hidden" crossOrigin="anonymous" />
      
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} muted={isMutedLocal} />
      ))}
      
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

      <header className="relative z-50 flex items-center justify-between p-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-white/20"><AvatarImage src={room.coverUrl || undefined} /><AvatarFallback>UM</AvatarFallback></Avatar>
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <h1 className="font-black text-[15px] uppercase tracking-tighter text-white">{room.title}</h1>
                <button 
                  onClick={handleFollowRoom}
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg shrink-0",
                    followData ? "bg-red-500" : "bg-[#00E676]"
                  )}
                >
                   {followData ? (
                     <Heart className="h-3.5 w-3.5 text-white fill-current" />
                   ) : (
                     <div className="relative flex items-center justify-center">
                        <Heart className="h-4 w-4 text-white" strokeWidth={3} />
                        <Plus className="h-2 w-2 text-white absolute mt-0.5" strokeWidth={4} />
                     </div>
                   )}
                </button>
             </div>
             <p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsUserListOpen(true)} className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2"><Users className="h-4 w-4 text-white/60" /><span className="text-[12px] font-black">{onlineCount}</span></button>
          {isOwner && (
            <RoomSettingsDialog room={room} trigger={<button className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Hexagon className="h-5 w-5" /></button>} />
          )}
          <button onClick={() => setIsShareOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Share2 className="h-5 w-5" /></button>
          <button onClick={() => setIsExitPortalOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Power className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col pt-0 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-start gap-2 pt-4 pb-40 overflow-y-auto no-scrollbar">
           <div className="w-full flex justify-center">
              <Seat index={1} label="No.1" theme={currentTheme} occupant={participants.find(p => p.seatIndex === 1)} isLocked={room.lockedSeats?.includes(1)} onClick={handleSeatClick} />
           </div>
           <div className="w-full flex justify-center gap-4 px-4">
              {[2, 3, 4, 5].map(idx => (
                <Seat key={idx} index={idx} label={`No.${idx}`} theme={currentTheme} occupant={participants.find(p => p.seatIndex === idx)} isLocked={room.lockedSeats?.includes(idx)} onClick={handleSeatClick} />
              ))}
           </div>
           <div className="w-full flex justify-center gap-4 px-4">
              {[6, 7, 8, 9].map(idx => (
                <Seat key={idx} index={idx} label={`No.${idx}`} theme={currentTheme} occupant={participants.find(p => p.seatIndex === idx)} isLocked={room.lockedSeats?.includes(idx)} onClick={handleSeatClick} />
              ))}
           </div>
           <div className="w-full flex justify-center gap-4 px-4">
              {[10, 11, 12, 13].map(idx => (
                <Seat key={idx} index={idx} label={`No.${idx}`} theme={currentTheme} occupant={participants.find(p => p.seatIndex === idx)} isLocked={room.lockedSeats?.includes(idx)} onClick={handleSeatClick} />
              ))}
           </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-40 z-20 pointer-events-none p-4 pb-0">
           <ScrollArea className="h-full pr-4 pointer-events-auto" ref={scrollRef}>
              <div className="flex flex-col gap-1 justify-end min-h-full">
                 {firestoreMessages?.map((msg: any) => (
                   <div key={msg.id} className="flex items-start gap-2 bg-black/40 backdrop-blur-md rounded-xl p-1.5 border border-white/5 w-fit max-w-[85%] animate-in fade-in slide-in-from-left-2 shadow-xl mb-1">
                      <Avatar className="h-6 w-6 shrink-0 border border-white/10"><AvatarImage src={msg.senderAvatar || undefined} /><AvatarFallback>{(msg.senderName || 'U').charAt(0)}</AvatarFallback></Avatar>
                      <div className="flex flex-col">
                        <span className={cn("text-[8px] font-black uppercase tracking-tighter leading-none mb-0.5", msg.senderId === currentUser?.uid ? "text-primary" : "text-white/40")}>{msg.senderName}</span>
                        <p className="text-11px] font-bold text-white leading-tight break-all">{msg.content || msg.text}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </ScrollArea>
        </div>
      </main>

      <footer className="relative z-50 px-4 pb-10 flex items-center justify-between gap-3 pt-4">
        <div className="flex-1 flex items-center gap-3">
           <div 
             onClick={handleInputClick} 
             className={cn(
               "backdrop-blur-xl rounded-full h-12 flex-1 px-6 flex items-center font-bold text-sm cursor-pointer transition-all",
               isChatMuted && !canManageRoom ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-white/10 text-white/60"
             )}
           >
              {isChatMuted && !canManageRoom ? 'Chat Restricted' : 'Say Hi'}
           </div>
           <div className="flex items-center gap-3">
              <button onClick={handleMicToggle} disabled={!isInSeat} className={cn("p-2 rounded-full transition-all active:scale-90", !isInSeat ? "bg-white/5 text-white/20 opacity-50" : (currentUserParticipant?.isMmuted ? "bg-white/10 text-white" : "bg-green-500 text-white shadow-lg border border-white/20"))}>{isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
              <button onClick={() => setIsMessagesOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"><Mail className="h-5 w-5 text-white" /></button>
              <button onClick={() => { setGiftRecipient(null); setIsGiftPickerOpen(true); }} className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl active:scale-90 transition-transform"><GiftIcon className="h-6 w-6 text-white fill-white" /></button>
              <button onClick={() => setIsRoomPlayOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"><LayoutGrid className="h-5 w-5 text-white" /></button>
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
      <RoomPlayDialog 
        open={isRoomPlayOpen} 
        onOpenChange={setIsRoomPlayOpen} 
        participants={participants} 
        roomId={room.id} 
        room={room} 
        isMutedLocal={isMutedLocal}
        setIsMutedLocal={setIsMutedLocal}
        onOpenGames={() => setIsRoomGamesOpen(true)}
        isMusicPlaying={!!musicUrl}
        onPlayMusic={handlePlayMusic}
        onStopMusic={handleStopMusic}
      />
      <RoomGamesDialog open={isRoomGamesOpen} onOpenChange={setIsRoomGamesOpen} />
      <RoomMessagesDialog open={isMessagesOpen} onOpenChange={setIsMessagesOpen} />
      <GiftPicker open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen} roomId={room.id} recipient={giftRecipient} />
      
      <RoomSeatMenuDialog 
        open={isSeatMenuOpen} 
        onOpenChange={setIsSeatMenuOpen}
        seatIndex={selectedSeatIdx}
        roomId={room.id}
        isLocked={room.lockedSeats?.includes(selectedSeatIdx || 0) || false}
        occupantUid={selectedParticipantUid}
        canManage={canManageRoom}
        currentUserId={currentUser?.uid}
        onLeaveSeat={handleLeaveSeat}
        onKick={handleKick}
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
        isSilenced={participants.find(p => p.uid === selectedParticipantUid)?.isSilenced || false}
        isMe={selectedParticipantUid === currentUser?.uid}
      />
    </div>
  );
}
