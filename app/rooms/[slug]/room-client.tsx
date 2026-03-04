'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { 
  Mic, 
  MicOff, 
  Lock, 
  Gift as GiftIcon, 
  Users, 
  Share2, 
  Power, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ShieldCheck, 
  LogOut, 
  Minimize2, 
  Smile, 
  Zap, 
  Crown, 
  Armchair,
  Loader,
  Settings as SettingsIcon,
  Check,
  Clipboard
} from 'lucide-react';
import { GoldCoinIcon, GameControllerIcon } from '@/components/icons';
import type { Room, RoomParticipant, Gift } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, doc, increment, serverTimestamp } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy, limitToLast } from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { useWebRTC } from '@/hooks/use-webrtc';
import { RoomUserProfileDialog } from '@/components/room-user-profile-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ROOM_THEMES = [
  { id: 'misty', name: 'Misty Forest', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000' },
  { id: 'tower', name: 'Tower', url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=2000' },
  { id: 'royal', name: 'Royal Palace', url: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=2000' },
  { id: 'neon', name: 'Neon Party', url: 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=2000' },
];

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (audioRef.current) { audioRef.current.srcObject = stream; audioRef.current.play().catch(() => {}); } }, [stream]);
  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

const TribeMemberItem = ({ participant, ownerId }: { participant: RoomParticipant, ownerId: string }) => {
  const isPOwner = (participant as any).uid === ownerId;
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group active:bg-white/10 transition-all">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-white/10"><AvatarImage src={participant.avatarUrl || undefined} /><AvatarFallback>{participant.name.charAt(0)}</AvatarFallback></Avatar>
        <div>
          <div className="flex items-center gap-2"><p className="font-black text-sm uppercase tracking-tight text-white">{participant.name}</p>{isPOwner && <Crown className="h-3 w-3 text-yellow-500 fill-current" />}</div>
          <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Tribe Member</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white" />
    </div>
  );
};

function EntryCard({ entrant, onComplete }: { entrant: any, onComplete: () => void }) {
  useEffect(() => { const timer = setTimeout(onComplete, 5000); return () => clearTimeout(timer); }, [entrant, onComplete]);
  if (!entrant) return null;
  return (
    <div className="fixed top-40 left-0 z-[150] animate-in slide-in-from-left-full duration-700 pointer-events-none">
      <div className="bg-[#00a859] rounded-r-full py-1.5 pl-2 pr-8 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,168,89,0.3)] border-y border-r border-white/20 backdrop-blur-md">
        <Avatar className="h-8 w-8 border-2 border-white/40 shadow-sm"><AvatarImage src={entrant.senderAvatar} /><AvatarFallback className="bg-green-700 text-white text-[10px] font-black">{entrant.senderName?.charAt(0)}</AvatarFallback></Avatar>
        <div className="flex items-center gap-1.5"><span className="text-[13px] font-black uppercase italic tracking-tighter text-white drop-shadow-md">{entrant.senderName} 🇮🇳</span><span className="text-[12px] font-black italic text-white/90">entered the room</span></div>
      </div>
    </div>
  );
}

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isGamesDialogOpen, setIsGamesDialogOpen] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isExitPortalOpen, setIsExitPortalOpen] = useState(false);
  const [isUserProfileCardOpen, setIsUserProfileCardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [latestEntrance, setLatestEntrance] = useState<any>(null);

  // Settings State
  const [roomName, setRoomName] = useState(room.title);
  const [announcement, setAnnouncement] = useState(room.announcement || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { setActiveRoom, setIsMinimized } = useRoomContext();

  const isOwner = currentUser?.uid === room.ownerId;
  const isMod = room.moderatorIds?.includes(currentUser?.uid || '');

  const participantsQuery = useMemoFirebase(() => (!firestore || !room.id ? null : query(collection(firestore, 'chatRooms', room.id, 'participants'))), [firestore, room.id]);
  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const currentUserParticipant = participants?.find(p => (p as any).uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  const { remoteStreams } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true);

  const messagesQuery = useMemoFirebase(() => (!firestore || !room.id ? null : query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'), limitToLast(50))), [firestore, room.id]);
  const { data: firestoreMessages } = useCollection(messagesQuery);
  
  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
    if (firestoreMessages && firestoreMessages.length > 0) { 
      const lastMsg = firestoreMessages[firestoreMessages.length - 1]; 
      if (lastMsg.type === 'entrance' && lastMsg.senderId !== currentUser?.uid) setLatestEntrance(lastMsg); 
    } 
  }, [firestoreMessages, currentUser?.uid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || !userProfile) return;
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), { content: messageText, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || '', chatRoomId: room.id, timestamp: serverTimestamp(), type: 'text' });
    setMessageText('');
  };

  const handleShare = async () => {
    const shareData = {
      title: `Join my tribe: ${room.title}`,
      text: `Sync with our frequency on Ummy! Room ID: ${room.roomNumber}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`Join my tribe: ${room.title}\nRoom ID: ${room.roomNumber}\nLink: ${window.location.href}`);
        toast({ title: 'Link Copied', description: 'Invite frequency synced to clipboard.' });
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const handleUpdateSettings = async () => {
    if (!firestore || !room.id || !isOwner) return;
    setIsSavingSettings(true);
    try {
      updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
        name: roomName,
        announcement: announcement,
        updatedAt: serverTimestamp()
      });
      toast({ title: 'Settings Updated', description: 'Frequency metadata synchronized.' });
      setIsSettingsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const takeSeat = (index: number) => { if (!firestore || !room.id || !currentUser) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: index, isMuted: true, updatedAt: serverTimestamp() }); };
  const handleMicToggle = () => { if (!isInSeat || !firestore || !currentUser || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); };
  const handleMinimize = () => { setIsMinimized(true); router.push('/rooms'); };
  const handleExit = () => { setActiveRoom(null); router.push('/rooms'); };

  const currentTheme = ROOM_THEMES.find(t => t.id === (room as any).roomThemeId) || ROOM_THEMES[0];
  const maxMics = room.maxActiveMics || 9;

  const Seat = ({ index }: { index: number }) => {
    const occupant = participants?.find(p => p.seatIndex === index);
    const isLocked = room.lockedSeats?.includes(index);
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <AvatarFrame frameId={occupant?.activeFrame} size="md">
          <button onClick={() => { if (occupant) { setSelectedParticipantUid((occupant as any).uid || occupant.id); setIsUserProfileCardOpen(true); } else takeSeat(index); }} className={cn("h-14 w-14 rounded-full flex items-center justify-center bg-black/40 border-2 border-white/10 backdrop-blur-sm relative overflow-hidden", isLocked && "border-red-500/50")}>
            {occupant ? (
              <div className="relative h-full w-full">
                <Avatar className="h-full w-full p-0.5">
                  <AvatarImage src={occupant.avatarUrl} />
                  <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {/* Active Presence Dot */}
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-black z-20 shadow-lg shadow-green-500/20" />
              </div>
            ) : isLocked ? <Lock className="h-4 w-4 text-red-500/40" /> : <Armchair className="text-white/20 h-6 w-6" />}
          </button>
        </AvatarFrame>
        <span className={cn("text-[8px] font-black uppercase truncate w-14 text-center mt-1", occupant ? "text-[#fbbf24]" : "text-white/40")}>{occupant ? occupant.name : `Slot ${index}`}</span>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl">
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <EntryCard entrant={latestEntrance} onComplete={() => setLatestEntrance(null)} />
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (<RemoteAudio key={peerId} stream={stream} />))}
      
      <div className="absolute inset-0 z-0">
        <Image src={currentTheme.url} alt="Background" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-4 pt-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-white/20">
            <AvatarImage src={room.coverUrl || undefined} />
            <AvatarFallback>UM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-black text-[15px] uppercase tracking-tighter text-white">{room.title}</h1>
            <p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <Share2 className="h-4 w-4" />
          </button>
          {(isOwner || isMod) && (
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <SettingsIcon className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setIsParticipantListOpen(true)} className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <Users className="h-3 w-3 text-white/60" />
            <span className="text-[10px] font-black">{participants?.length || 0}</span>
          </button>
          <button onClick={() => setIsExitPortalOpen(true)} className="p-2 bg-white/10 rounded-full">
            <Power className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative z-50 px-4 py-1 flex items-center gap-3 bg-black/20 backdrop-blur-sm border-y border-white/5">
        <div className="bg-primary/20 p-1 rounded-md"><Zap className="h-3 w-3 text-primary animate-pulse" /></div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] font-black uppercase italic whitespace-nowrap animate-marquee tracking-widest text-primary/80">
            {room.announcement || "Welcome to the tribe frequency! Stay active and earn rewards."}
          </p>
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col pt-4 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="px-4 py-2 flex flex-wrap justify-center gap-x-4 gap-y-6 max-w-sm mx-auto">
            {Array.from({ length: maxMics }).map((_, i) => (
              <div key={`seat-${i+1}`} className="w-[22%]"><Seat index={i + 1} /></div>
            ))}
          </div>
        </ScrollArea>
        <div className="px-4 pb-2">
          <ScrollArea className="h-32" ref={scrollRef}>
            <div className="space-y-1">
              {firestoreMessages?.map((msg: any) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <div className="bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/5 flex gap-2 max-w-[90%]">
                    <span className={cn("text-[9px] font-black shrink-0 uppercase", msg.type === 'gift' ? "text-pink-400" : "text-blue-400")}>{msg.senderName}:</span>
                    <p className="text-[9px] font-medium text-white/80">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </main>

      <footer className="relative z-50 px-4 pb-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-4">
        <button onClick={handleMicToggle} className={cn("p-3 rounded-full border border-white/10 backdrop-blur-md", isInSeat && !currentUserParticipant?.isMuted ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-white/10")}>
          {isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white/60" />}
        </button>
        <form className="flex-1 bg-white/10 backdrop-blur-xl rounded-full h-12 px-4 flex items-center border border-white/5" onSubmit={handleSendMessage}>
          <Input placeholder="Say Hi to Tribe" className="bg-transparent border-none text-xs font-black uppercase tracking-widest focus-visible:ring-0 h-full" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
        </form>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEmojiPickerOpen(true)} className="bg-white/10 p-3 rounded-full">
            <Smile className="h-5 w-5 text-white/80" />
          </button>
          <button className="bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 p-2.5 rounded-full" onClick={() => setIsGamesDialogOpen(true)}>
            <GameControllerIcon className="h-6 w-6" />
          </button>
          <button className="bg-gradient-to-br from-pink-400 to-indigo-600 p-3 rounded-full" onClick={() => setIsGiftPickerOpen(true)}>
            <GiftIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </footer>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none shadow-2xl overflow-hidden font-headline">
          <DialogHeader className="p-8 pb-4 border-b border-gray-50">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center text-primary">Frequency Control</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Room Management Protocol</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="roomName" className="text-[10px] font-black uppercase text-gray-400 ml-1">Room Name</Label>
                <Input id="roomName" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="h-14 rounded-2xl border-2 border-gray-100 focus:border-primary transition-all text-lg font-bold" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="announcement" className="text-[10px] font-black uppercase text-gray-400 ml-1">Scrolling Announcement</Label>
                <Textarea id="announcement" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="h-24 rounded-2xl border-2 border-gray-100 focus:border-primary transition-all resize-none text-sm font-medium italic" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button onClick={handleUpdateSettings} disabled={isSavingSettings} className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase italic text-xl shadow-xl shadow-primary/20">
              {isSavingSettings ? <Loader className="animate-spin h-6 w-6 mr-2" /> : <Check className="h-6 w-6 mr-2" />}
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden">
          <DialogHeader className="p-8 pb-4 text-center border-b border-white/10">
            <DialogTitle className="text-white font-black uppercase text-2xl">Exit Frequency</DialogTitle>
          </DialogHeader>
          <div className="p-12 flex items-center justify-around gap-8">
            <button onClick={handleMinimize} className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center"><Minimize2 className="h-8 w-8 text-black" /></div>
              <span className="text-white font-black uppercase text-xs italic">Minimize</span>
            </button>
            <button onClick={handleExit} className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center"><LogOut className="h-8 w-8 text-pink-500" /></div>
              <span className="text-white font-black uppercase text-xs italic">Exit Room</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isParticipantListOpen} onOpenChange={setIsParticipantListOpen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 border-none bg-black/95 text-white p-0 flex flex-col">
          <DialogHeader className="p-4 border-b border-white/10 mt-10">
            <DialogTitle className="text-center font-black uppercase text-lg">Tribe List</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-4">
              {participants?.map((p) => (
                <TribeMemberItem key={(p as any).uid || p.id} participant={p} ownerId={room.ownerId} />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <RoomUserProfileDialog userId={selectedParticipantUid} open={isUserProfileCardOpen} onOpenChange={setIsUserProfileCardOpen} canManage={false} isOwner={false} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} onSilence={() => {}} onKick={() => {}} onLeaveSeat={() => {}} onToggleMod={() => {}} onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }} isSilenced={false} isMe={selectedParticipantUid === currentUser?.uid} />
      
      <style jsx global>{` 
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } 
        .animate-marquee { display: inline-block; animation: marquee 15s linear infinite; } 
      `}</style>
    </div>
  );
}
