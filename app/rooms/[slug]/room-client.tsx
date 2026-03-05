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
  LogOut,
  Power,
  Armchair,
  ChevronDown,
  Minimize2,
  Lock,
  Unlock,
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
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

const ROOM_THEMES = [
  { id: 'misty', name: 'Misty Forest', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000' },
  { id: 'neon', name: 'Neon Party', url: 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=2000' },
  { id: 'royal', name: 'Royal Palace', url: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=2000' },
];

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }
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
      <div className="bg-[#00a859] rounded-r-full py-1.5 pl-2 pr-8 flex items-center gap-3 shadow-lg border-y border-r border-white/20 backdrop-blur-md">
        <Avatar className="h-8 w-8 border-2 border-white/40">
          <AvatarImage src={entrant.senderAvatar || undefined} />
          <AvatarFallback className="bg-green-700 text-white text-[10px] font-black">{entrant.senderName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="text-[13px] font-black uppercase italic text-white drop-shadow-md">
          {entrant.senderName} entered the room
        </span>
      </div>
    </div>
  );
}

function SeatActionDialog({ 
  open, 
  onOpenChange, 
  onAction, 
  canManage,
  isLocked 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onAction: (action: string) => void;
  canManage: boolean;
  isLocked: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-500 font-headline">
        <DialogHeader className="sr-only">
          <DialogTitle>Seat Actions</DialogTitle>
          <DialogDescription>Choose an action for this mic slot.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-4">
          <button 
            onClick={() => onAction('on-mic')} 
            className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
          >
            On mic
          </button>
          <button 
            onClick={() => onAction('invite')} 
            className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
          >
            Invite
          </button>
          {canManage && (
            <>
              <button 
                onClick={() => onAction('lock')} 
                className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
              >
                {isLocked ? 'Unlock' : 'Lock'}
              </button>
              <button 
                onClick={() => onAction('lock-all')} 
                className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
              >
                Lock All
              </button>
              <button 
                onClick={() => onAction('mute')} 
                className="w-full py-5 text-center font-black text-lg uppercase tracking-tight hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
              >
                Mute
              </button>
            </>
          )}
          <div className="w-full h-2 bg-gray-50" />
          <button 
            onClick={() => onOpenChange(false)} 
            className="w-full py-6 text-center font-black text-lg uppercase tracking-tight text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isExitPortalOpen, setIsExitPortalOpen] = useState(false);
  const [isUserProfileCardOpen, setIsUserProfileCardOpen] = useState(false);
  const [isSeatMenuOpen, setIsSeatMenuOpen] = useState(false);
  const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [latestEntrance, setLatestEntrance] = useState<any>(null);

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
  
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (firestoreMessages && firestoreMessages.length > 0) {
      const lastMsg = firestoreMessages[firestoreMessages.length - 1];
      if (lastMsg.type === 'entrance' && lastMsg.senderId !== currentUser?.uid) {
        setLatestEntrance(lastMsg);
      }
    }
  }, [firestoreMessages, currentUser?.uid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || !userProfile) return;
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: messageText, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || '', chatRoomId: room.id, timestamp: serverTimestamp(), type: 'text'
    });
    setMessageText('');
  };

  const handleSendGift = async (gift: Gift) => {
    if (!currentUser || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < gift.price) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
    let finalRecipient = giftRecipient || { uid: currentUser.uid, name: userProfile.username, avatarUrl: userProfile.avatarUrl };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), { 'wallet.coins': increment(-gift.price), updatedAt: serverTimestamp() });
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), { 'wallet.coins': increment(-gift.price), updatedAt: serverTimestamp() });
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), { content: `sent ${finalRecipient.name} a ${gift.emoji}!`, senderId: currentUser.uid, senderName: userProfile.username, senderAvatar: userProfile.avatarUrl, chatRoomId: room.id, timestamp: serverTimestamp(), type: 'gift', giftId: gift.id });
    setIsGiftPickerOpen(false);
  };

  const takeSeat = (index: number) => { 
    if (!firestore || !room.id || !currentUser) return; 
    
    if (room.lockedSeats?.includes(index) && !canManageRoom) {
      toast({ variant: 'destructive', title: 'Frequency Locked', description: 'This seat is restricted by the Room Admin.' });
      return;
    }

    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { 
      seatIndex: index, 
      isMuted: true, 
      activeWave: userProfile?.inventory?.activeWave || 'Default',
      updatedAt: serverTimestamp() 
    }); 
  };

  const handleSeatAction = (action: string) => {
    if (!selectedSeatIdx || !firestore || !room.id) return;

    const roomRef = doc(firestore, 'chatRooms', room.id);

    switch(action) {
      case 'on-mic':
        takeSeat(selectedSeatIdx);
        break;
      case 'lock':
        const isCurrentlyLocked = room.lockedSeats?.includes(selectedSeatIdx);
        updateDocumentNonBlocking(roomRef, {
          lockedSeats: isCurrentlyLocked ? arrayRemove(selectedSeatIdx) : arrayUnion(selectedSeatIdx),
          updatedAt: serverTimestamp()
        });
        toast({ title: isCurrentlyLocked ? 'Seat Unlocked' : 'Seat Locked' });
        break;
      case 'lock-all':
        const allIndices = Array.from({ length: room.maxActiveMics || 9 }).map((_, i) => i + 1);
        updateDocumentNonBlocking(roomRef, {
          lockedSeats: room.lockedSeats?.length === allIndices.length ? [] : allIndices,
          updatedAt: serverTimestamp()
        });
        toast({ title: 'Global Lock Toggled' });
        break;
      case 'mute':
        updateDocumentNonBlocking(roomRef, {
          isChatMuted: !room.isChatMuted,
          updatedAt: serverTimestamp()
        });
        toast({ title: !room.isChatMuted ? 'Frequency Silenced' : 'Silence Revoked' });
        break;
      case 'invite':
        toast({ title: 'Dispatching Invites', description: 'Scanning tribal frequency for friends...' });
        break;
    }
    setIsSeatMenuOpen(false);
  };

  const handleLeaveSeat = (uid: string) => {
    if (!firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { 
      seatIndex: 0, 
      isMuted: true, 
      updatedAt: serverTimestamp() 
    });
    toast({ title: 'Seat Vacated' });
  };

  const handleKick = (uid: string, durationMinutes: number) => {
    if (!firestore || !room.id) return;
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);
    // Record exclusion
    setDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'bans', uid), {
      uid,
      expiresAt,
      bannedAt: serverTimestamp(),
      bannedBy: currentUser?.uid
    }, { merge: true });
    // Remove participant
    deleteDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid));
    toast({ title: 'Exclusion Synchronized', description: `Tribe member restricted for ${durationMinutes} minutes.` });
  };

  const handleToggleSilence = (uid: string, current: boolean) => {
    if (!firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), {
      isSilenced: !current,
      isMuted: true, // Force mute when silencing
      updatedAt: serverTimestamp()
    });
    toast({ title: !current ? 'Frequency Silenced' : 'Silence Revoked' });
  };

  const handleToggleMod = (uid: string) => {
    if (!firestore || !room.id) return;
    const isCurrentlyMod = room.moderatorIds?.includes(uid);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
      moderatorIds: isCurrentlyMod ? arrayRemove(uid) : arrayUnion(uid),
      updatedAt: serverTimestamp()
    });
    toast({ title: isCurrentlyMod ? 'Admin Revoked' : 'Admin Granted' });
  };

  const handleMicToggle = () => { 
    const participant = participants?.find(p => p.uid === currentUser?.uid);
    if (!isInSeat || !firestore || !currentUser || !room.id || participant?.isSilenced || room.isChatMuted) {
      if (participant?.isSilenced) toast({ variant: 'destructive', title: 'Action Prohibited', description: 'Your frequency is currently silenced by an Admin.' });
      else if (room.isChatMuted) toast({ variant: 'destructive', title: 'Action Prohibited', description: 'The room frequency is globally muted.' });
      return;
    }
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); 
  };

  const handleMinimize = () => { setIsMinimized(true); router.push('/rooms'); };
  const handleExit = () => { setActiveRoom(null); router.push('/rooms'); };

  const currentTheme = ROOM_THEMES.find(t => t.id === (room as any).roomThemeId) || ROOM_THEMES[0];
  const maxMics = room.maxActiveMics || 9;

  const roomDpAvatar = (
    <Avatar className={cn(
      "h-12 w-12 rounded-xl border-2 border-white/20 transition-transform active:scale-95",
      canManageRoom && "cursor-pointer"
    )}>
      <AvatarImage key={room.coverUrl} src={room.coverUrl || undefined} />
      <AvatarFallback>UM</AvatarFallback>
    </Avatar>
  );

  const getWaveColor = (waveId?: string) => {
    switch(waveId) {
      case 'w1': return 'text-cyan-500';
      case 'w2': return 'text-orange-600';
      default: return 'text-primary';
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem]">
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <EntryCard entrant={latestEntrance} onComplete={() => setLatestEntrance(null)} />
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (<RemoteAudio key={peerId} stream={stream} />))}
      
      <div className="absolute inset-0 z-0">
        <Image src={currentTheme.url} alt="Background" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-4 pt-6">
        <div className="flex items-center gap-3">
          {canManageRoom ? (
            <RoomSettingsDialog room={room} trigger={roomDpAvatar} />
          ) : roomDpAvatar}
          <div>
            <h1 className="font-black text-[15px] uppercase tracking-tighter text-white">{room.title}</h1>
            <p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 active:scale-95 transition-transform"><Users className="h-3 w-3 text-white/60" /><span className="text-[10px] font-black">{onlineCount}</span></button>
          <button onClick={() => setIsExitPortalOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Power className="h-4 w-4" /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col pt-4 overflow-hidden">
        <ScrollArea className="flex-1 px-4">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 max-w-sm mx-auto">
            {Array.from({ length: maxMics }).map((_, i) => {
              const idx = i + 1;
              const occupant = participants?.find(p => p.seatIndex === idx);
              const isLocked = room.lockedSeats?.includes(idx);

              return (
                <div key={idx} className="w-[22%] flex flex-col items-center gap-1">
                  <div className="relative">
                    {occupant && !occupant.isMuted && (
                      <div className={cn("absolute -inset-1 rounded-full border-2 animate-voice-wave", getWaveColor(occupant.activeWave))} />
                    )}
                    <AvatarFrame frameId={occupant?.activeFrame} size="md">
                      <button 
                        onClick={() => { 
                          if (occupant) { 
                            setSelectedParticipantUid(occupant.uid); 
                            setIsUserProfileCardOpen(true); 
                          } else { 
                            setSelectedSeatIdx(idx);
                            setIsSeatMenuOpen(true);
                          } 
                        }}
                        className={cn(
                          "h-14 w-14 rounded-full flex items-center justify-center bg-black/40 border-2 backdrop-blur-sm active:scale-90 transition-transform relative z-10",
                          isLocked ? "border-red-500/40" : "border-white/10"
                        )}
                      >
                        {occupant ? (
                          <Avatar className="h-full w-full p-0.5">
                            <AvatarImage src={occupant.avatarUrl || undefined} />
                            <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : isLocked ? (
                          <Lock className="text-red-500/40 h-6 w-6" />
                        ) : (
                          <Armchair className="text-white/20 h-6 w-6" />
                        )}
                      </button>
                    </AvatarFrame>
                    {occupant?.isMuted && <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-0.5 border border-black shadow-lg z-20"><MicOff className="h-2 w-2 text-white" /></div>}
                  </div>
                  <span className="text-[8px] font-black uppercase text-white/60 truncate w-14 text-center">
                    {occupant ? occupant.name : `No.${idx}`}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="px-4 pb-2">
          <ScrollArea className="h-32" ref={scrollRef}>
            <div className="space-y-1">
              {firestoreMessages?.map((msg: any) => (
                <div key={msg.id} className="bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/5 inline-flex gap-2 max-w-[90%]">
                  <span className="text-[9px] font-black text-blue-400 uppercase">{msg.senderName}:</span>
                  <p className="text-[9px] font-medium text-white/80">{msg.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </main>

      <footer className="relative z-50 px-4 pb-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-4">
        <button onClick={handleMicToggle} className={cn("p-3 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-95", isInSeat && !currentUserParticipant?.isMuted ? "bg-green-500" : "bg-white/10")}>{isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
        
        <div className="flex-1">
          {showInput ? (
            <form className="bg-white/10 backdrop-blur-xl rounded-full h-12 px-4 flex items-center border border-white/5 gap-2 animate-in slide-in-from-left-2 duration-300" onSubmit={(e) => { handleSendMessage(e); setShowInput(false); }}>
              <span className="text-sm shrink-0">💬</span>
              <Input 
                placeholder="Say Hi" 
                className="bg-transparent border-none text-xs font-black tracking-widest placeholder:text-white/40 focus-visible:ring-0 h-full p-0 flex-1" 
                value={messageText} 
                onChange={(e) => setMessageText(e.target.value)} 
                autoFocus
                onBlur={() => { if (!messageText) setShowInput(false); }}
              />
            </form>
          ) : (
            <button 
              onClick={() => setShowInput(true)}
              className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/5 flex items-center justify-center active:scale-95 transition-all shadow-lg"
            >
              <span className="text-xl">💬</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-gradient-to-br from-pink-400 to-indigo-600 p-3 rounded-full shadow-lg active:scale-95 transition-transform" onClick={() => setIsGiftPickerOpen(true)}><GiftIcon className="h-5 w-5 text-white" /></button>
        </div>
      </footer>

      <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Exit Frequency</DialogTitle>
            <DialogDescription>Choose to minimize the frequency or exit the session.</DialogDescription>
          </DialogHeader>
          <div className="p-12 flex items-center justify-around gap-8">
            <button onClick={handleMinimize} className="flex flex-col items-center gap-4 active:scale-90 transition-transform"><div className="h-20 w-20 rounded-full bg-white flex items-center justify-center"><Minimize2 className="h-8 w-8 text-black" /></div><span className="text-white font-black uppercase text-xs">Minimize</span></button>
            <button onClick={handleExit} className="flex flex-col items-center gap-4 active:scale-90 transition-transform"><div className="h-20 w-20 rounded-full bg-white flex items-center justify-center"><LogOut className="h-8 w-8 text-pink-500" /></div><span className="text-white font-black uppercase text-xs">Exit</span></button>
          </div>
        </DialogContent>
      </Dialog>

      <RoomUserProfileDialog 
        userId={selectedParticipantUid} 
        open={isUserProfileCardOpen} 
        onOpenChange={setIsUserProfileCardOpen} 
        canManage={canManageRoom} 
        isOwner={isOwner} 
        roomOwnerId={room.ownerId} 
        roomModeratorIds={room.moderatorIds || []} 
        onSilence={handleToggleSilence} 
        onKick={handleKick} 
        onLeaveSeat={handleLeaveSeat} 
        onToggleMod={handleToggleMod} 
        onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }} 
        isSilenced={participants?.find(p => p.uid === selectedParticipantUid)?.isSilenced || false} 
        isMe={selectedParticipantUid === currentUser?.uid} 
      />
      
      <SeatActionDialog 
        open={isSeatMenuOpen} 
        onOpenChange={setIsSeatMenuOpen} 
        onAction={handleSeatAction}
        canManage={canManageRoom}
        isLocked={!!selectedSeatIdx && (room.lockedSeats?.includes(selectedSeatIdx) || false)}
      />
    </div>
  );
}
