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
  Loader
} from 'lucide-react';
import { GoldCoinIcon, GameControllerIcon } from '@/components/icons';
import type { Room, RoomParticipant, Gift } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, doc, increment, serverTimestamp } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
<<<<<<< HEAD
import { collection, query, orderBy, limitToLast } from 'firebase/firestore';
=======
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
  getDoc,
  setDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
>>>>>>> 414937a (When user enter in any room so there Entry card will show like this.....)
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { useWebRTC } from '@/hooks/use-webrtc';
import { RoomUserProfileDialog } from '@/components/room-user-profile-dialog';

const ROOM_THEMES = [
  { id: 'misty', name: 'Misty Forest', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000' },
  { id: 'tower', name: 'Tower', url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=2000' },
  { id: 'royal', name: 'Royal Palace', url: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=2000' },
  { id: 'neon', name: 'Neon Party', url: 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=2000' },
];

const TRIBE_EMOJIS = ['😀', '😂', '😘', '🥰', '😎', '🤗', '😡', '😭', '💋'];

const GAME_LIST = [
  { id: 'ludo', title: 'Ludo Masters', icon: '🎲', color: 'bg-green-500' },
  { id: 'fruit-party', title: 'Fruit Party', icon: '🎡', color: 'bg-purple-500' },
  { id: 'forest-party', title: 'Wild Party', icon: '🦁', color: 'bg-orange-500' },
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

/**
 * High-Fidelity Entry Card Component.
 * Displays a specialized green pill notification for new entrants.
 */
function EntryCard({ entrant, onComplete }: { entrant: any, onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [entrant, onComplete]);

  if (!entrant) return null;

  return (
    <div className="fixed top-40 left-0 z-[150] animate-in slide-in-from-left-full duration-700 pointer-events-none">
      <div className="bg-[#00a859] rounded-r-full py-1.5 pl-2 pr-8 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,168,89,0.3)] border-y border-r border-white/20 backdrop-blur-md">
        <Avatar className="h-8 w-8 border-2 border-white/40 shadow-sm">
          <AvatarImage src={entrant.senderAvatar} />
          <AvatarFallback className="bg-green-700 text-white text-[10px] font-black">{entrant.senderName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-black uppercase italic tracking-tighter text-white drop-shadow-md">
            {entrant.senderName} 🇮🇳
          </span>
          <span className="text-[12px] font-black italic text-white/90">entered the room</span>
        </div>
      </div>
    </div>
  );
}

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isGamesDialogOpen, setIsGamesDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isExitPortalOpen, setIsExitPortalOpen] = useState(false);
  const [isUserProfileCardOpen, setIsUserProfileCardOpen] = useState(false);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
<<<<<<< HEAD
=======
  const [isClaimingTree, setIsClaimingTree] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'announcement' | 'welcome' | null>(null);
  const [fieldValue, setEditingFieldValue] = useState('');
>>>>>>> 414937a (When user enter in any room so there Entry card will show like this.....)
  const [latestEntrance, setLatestEntrance] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { setActiveRoom, setIsMinimized } = useRoomContext();

  const participantsQuery = useMemoFirebase(() => (!firestore || !room.id ? null : query(collection(firestore, 'chatRooms', room.id, 'participants'))), [firestore, room.id]);
  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const currentUserParticipant = participants?.find(p => (p as any).uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  const { remoteStreams } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true);

  const messagesQuery = useMemoFirebase(() => (!firestore || !room.id ? null : query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'), limitToLast(50))), [firestore, room.id]);
  const { data: firestoreMessages } = useCollection(messagesQuery);
  
<<<<<<< HEAD
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; if (firestoreMessages && firestoreMessages.length > 0) { const lastMsg = firestoreMessages[firestoreMessages.length - 1]; if (lastMsg.type === 'entrance' && lastMsg.senderId !== currentUser?.uid) setLatestEntrance(lastMsg); } }, [firestoreMessages, currentUser?.uid]);
=======
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    
    // Entry Card Logic
    if (firestoreMessages && firestoreMessages.length > 0) {
      const lastMsg = firestoreMessages[firestoreMessages.length - 1];
      // Only trigger for OTHERS entering
      if (lastMsg.type === 'entrance' && lastMsg.senderId !== currentUser?.uid) {
        setLatestEntrance(lastMsg);
      }
    }
  }, [firestoreMessages, currentUser?.uid]);
>>>>>>> 414937a (When user enter in any room so there Entry card will show like this.....)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || !userProfile) return;
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), { content: messageText, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || '', chatRoomId: room.id, timestamp: serverTimestamp(), type: 'text' });
    setMessageText('');
  };

<<<<<<< HEAD
  const takeSeat = (index: number) => { if (!firestore || !room.id || !currentUser) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: index, isMuted: true, updatedAt: serverTimestamp() }); };
  const handleMicToggle = () => { if (!isInSeat || !firestore || !currentUser || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); };
=======
  const handleSendGift = async (gift: Gift) => {
    if (!currentUser || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < gift.price) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
    let finalRecipient = giftRecipient || { uid: currentUser.uid, name: userProfile.username, avatarUrl: userProfile.avatarUrl };
    const userRef = doc(firestore, 'users', currentUser.uid);
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-gift.price), updatedAt: serverTimestamp() });
    updateDocumentNonBlocking(profileRef, { 'wallet.coins': increment(-gift.price), updatedAt: serverTimestamp() });
    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), { content: `sent ${finalRecipient.name} a ${gift.name} ${gift.emoji}!`, senderId: currentUser.uid, senderName: userProfile.username, senderAvatar: userProfile.avatarUrl, chatRoomId: room.id, timestamp: serverTimestamp(), type: 'gift', giftId: gift.id });
    setIsGiftPickerOpen(false);
  };

  const takeSeat = (index: number) => { 
    if (!firestore || !room.id || !currentUser) return; 
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    updateDocumentNonBlocking(participantRef, { seatIndex: index, isMuted: true, updatedAt: serverTimestamp() }); 
  };

  const handleMicToggle = () => { 
    if (!isInSeat || !firestore || !currentUser || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); 
  };

>>>>>>> 414937a (When user enter in any room so there Entry card will show like this.....)
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
          <button onClick={() => { if (occupant) { setSelectedParticipantUid((occupant as any).uid); setIsUserProfileCardOpen(true); } else takeSeat(index); }} className={cn("h-14 w-14 rounded-full flex items-center justify-center bg-black/40 border-2 border-white/10 backdrop-blur-sm relative overflow-hidden", isLocked && "border-red-500/50")}>
            {occupant ? <Avatar className="h-full w-full p-0.5"><AvatarImage src={occupant.avatarUrl} /><AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback></Avatar> : isLocked ? <Lock className="h-4 w-4 text-red-500/40" /> : <Armchair className="text-white/20 h-6 w-6" />}
          </button>
        </AvatarFrame>
        <span className={cn("text-[8px] font-black uppercase truncate w-14 text-center mt-1", occupant ? "text-[#fbbf24]" : "text-white/40")}>{occupant ? occupant.name : `Slot ${index}`}</span>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl">
<<<<<<< HEAD
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} /><EntryCard entrant={latestEntrance} onComplete={() => setLatestEntrance(null)} />
=======
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <EntryCard entrant={latestEntrance} onComplete={() => setLatestEntrance(null)} />
>>>>>>> 414937a (When user enter in any room so there Entry card will show like this.....)
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (<RemoteAudio key={peerId} stream={stream} />))}
      <div className="absolute inset-0 z-0"><Image src={currentTheme.url} alt="Background" fill className="object-cover opacity-60" priority /><div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" /></div>
      <header className="relative z-50 flex items-center justify-between p-4 pt-6">
        <div className="flex items-center gap-3"><Avatar className="h-12 w-12 rounded-xl border-2 border-white/20"><AvatarImage src={room.coverUrl || undefined} /><AvatarFallback>UM</AvatarFallback></Avatar><div><h1 className="font-black text-[15px] uppercase tracking-tighter text-white">{room.title}</h1><p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p></div></div>
        <div className="flex items-center gap-2"><button onClick={() => setIsParticipantListOpen(true)} className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2"><Users className="h-3 w-3 text-white/60" /><span className="text-[10px] font-black">{participants?.length || 0}</span></button><button onClick={() => setIsExitPortalOpen(true)} className="p-2 bg-white/10 rounded-full"><Power className="h-4 w-4" /></button></div>
      </header>
      <div className="relative z-50 px-4 py-1 flex items-center gap-3 bg-black/20 backdrop-blur-sm border-y border-white/5"><div className="bg-primary/20 p-1 rounded-md"><Zap className="h-3 w-3 text-primary animate-pulse" /></div><div className="flex-1 overflow-hidden"><p className="text-[10px] font-black uppercase italic whitespace-nowrap animate-marquee tracking-widest text-primary/80">{room.announcement || "Welcome to the tribe frequency! Stay active and earn rewards."}</p></div></div>
      <main className="relative z-10 flex-1 flex flex-col pt-4 overflow-hidden">
        <ScrollArea className="flex-1"><div className="px-4 py-2 flex flex-wrap justify-center gap-x-4 gap-y-6 max-w-sm mx-auto">{Array.from({ length: maxMics }).map((_, i) => (<div key={`seat-${i+1}`} className="w-[22%]"><Seat index={i + 1} /></div>))}</div></ScrollArea>
        <div className="px-4 pb-2"><ScrollArea className="h-32" ref={scrollRef}><div className="space-y-1">{firestoreMessages?.map((msg: any) => (<div key={msg.id} className="flex items-start gap-2"><div className="bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/5 flex gap-2 max-w-[90%]"><span className={cn("text-[9px] font-black shrink-0 uppercase", msg.type === 'gift' ? "text-pink-400" : "text-blue-400")}>{msg.senderName}:</span><p className="text-[9px] font-medium text-white/80">{msg.content}</p></div></div>))}</div></ScrollArea></div>
      </main>
      <footer className="relative z-50 px-4 pb-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-4">
<<<<<<< HEAD
        <button onClick={handleMicToggle} className={cn("p-3 rounded-full border border-white/10 backdrop-blur-md", isInSeat && !currentUserParticipant?.isMuted ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-white/10")}>{isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white/60" />}</button>
        <form className="flex-1 bg-white/10 backdrop-blur-xl rounded-full h-12 px-4 flex items-center border border-white/5" onSubmit={handleSendMessage}><Input placeholder="Say Hi to Tribe" className="bg-transparent border-none text-xs font-black uppercase tracking-widest focus-visible:ring-0 h-full" value={messageText} onChange={(e) => setMessageText(e.target.value)} /></form>
        <div className="flex items-center gap-2"><button onClick={() => setIsEmojiPickerOpen(true)} className="bg-white/10 p-3 rounded-full"><Smile className="h-5 w-5 text-white/80" /></button><button className="bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 p-2.5 rounded-full" onClick={() => setIsGamesDialogOpen(true)}><GameControllerIcon className="h-6 w-6" /></button><button className="bg-gradient-to-br from-pink-400 to-indigo-600 p-3 rounded-full" onClick={() => setIsGiftPickerOpen(true)}><GiftIcon className="h-5 w-5 text-white" /></button></div>
      </footer>
      <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}><DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden"><DialogHeader className="p-8 pb-4 text-center border-b border-white/10"><DialogTitle className="text-white font-black uppercase text-2xl">Exit Frequency</DialogTitle></DialogHeader><div className="p-12 flex items-center justify-around gap-8"><button onClick={handleMinimize} className="flex flex-col items-center gap-4"><div className="h-20 w-20 rounded-full bg-white flex items-center justify-center"><Minimize2 className="h-8 w-8 text-black" /></div><span className="text-white font-black uppercase text-xs italic">Minimize</span></button><button onClick={handleExit} className="flex flex-col items-center gap-4"><div className="h-20 w-20 rounded-full bg-white flex items-center justify-center"><LogOut className="h-8 w-8 text-pink-500" /></div><span className="text-white font-black uppercase text-xs italic">Exit Room</span></button></div></DialogContent></Dialog>
      <Dialog open={isParticipantListOpen} onOpenChange={setIsParticipantListOpen}><DialogContent className="w-screen h-screen max-w-none m-0 border-none bg-black/95 text-white p-0 flex flex-col"><DialogHeader className="p-4 border-b border-white/10 mt-10"><DialogTitle className="text-center font-black uppercase text-lg">Tribe List</DialogTitle></DialogHeader><ScrollArea className="flex-1 px-6"><div className="py-6 space-y-4">{participants?.map((p) => (<TribeMemberItem key={(p as any).uid || p.id} participant={p} ownerId={room.ownerId} />))}</div></ScrollArea></DialogContent></Dialog>
      <RoomUserProfileDialog userId={selectedParticipantUid} open={isUserProfileCardOpen} onOpenChange={setIsUserProfileCardOpen} canManage={false} isOwner={false} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} onSilence={() => {}} onKick={() => {}} onLeaveSeat={() => {}} onToggleMod={() => {}} onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }} isSilenced={false} isMe={selectedParticipantUid === currentUser?.uid} />
      <style jsx global>{` @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .animate-marquee { display: inline-block; animation: marquee 15s linear infinite; } `}</style>
=======
        <button onClick={handleMicToggle} className={cn("p-3 rounded-full border border-white/10 backdrop-blur-md transition-all", isInSeat && !currentUserParticipant?.isMuted ? "bg-green-500" : "bg-white/10")}>{isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
        <form className="flex-1 bg-white/10 backdrop-blur-xl rounded-full h-12 px-4 flex items-center border border-white/5" onSubmit={handleSendMessage}><Input placeholder="Say Hi" className="bg-transparent border-none text-xs font-black uppercase tracking-widest placeholder:text-white/40 focus-visible:ring-0 h-full" value={messageText} onChange={(e) => setMessageText(e.target.value)} /></form>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEmojiPickerOpen(true)} className="bg-white/10 p-3 rounded-full"><Smile className="h-5 w-5" /></button>
          
          <div className="relative group">
            <div className="absolute -top-1 w-full h-full bg-yellow-500/20 blur-lg animate-pulse rounded-full" />
            <button 
              className="bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 p-2 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-110 active:scale-95 transition-all relative z-10 border-2 border-white/20"
              onClick={() => setIsGamesDialogOpen(true)}
            >
              <GameControllerIcon className="h-7 w-7" />
            </button>
          </div>

          <button className="bg-gradient-to-br from-pink-400 to-indigo-600 p-3 rounded-full shadow-lg" onClick={() => setIsGiftPickerOpen(true)}><GiftIcon className="h-5 w-5 text-white" /></button>
        </div>
      </footer>

      <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden">
          <DialogHeader className="p-8 pb-4 border-b border-white/10 text-center">
            <DialogTitle className="text-white font-black uppercase text-2xl italic">Exit Frequency</DialogTitle>
            <DialogDescription className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Minimize to keep listening or exit completely.</DialogDescription>
          </DialogHeader>
          <div className="p-12 flex items-center justify-around gap-8">
            <button onClick={handleMinimize} className="flex flex-col items-center gap-4 group active:scale-95 transition-all">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]"><Minimize2 className="h-8 w-8 text-black" /></div>
              <span className="text-white font-black uppercase text-xs">Minimize</span>
            </button>
            <button onClick={handleExit} className="flex flex-col items-center gap-4 group active:scale-95 transition-all">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]"><LogOut className="h-8 w-8 text-pink-500" /></div>
              <span className="text-white font-black uppercase text-xs">Exit</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isParticipantListOpen} onOpenChange={setIsParticipantListOpen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 border-none bg-black/95 text-white p-0 flex flex-col font-headline">
          <DialogHeader className="p-4 border-b border-white/10 mt-10">
            <DialogTitle className="text-center font-black uppercase text-lg">Tribe List ({onlineCount})</DialogTitle>
            <DialogDescription className="sr-only">Members currently active in this frequency.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-4">
              {participants?.map((p) => (<TribeMemberItem key={p.uid} participant={p} ownerId={room.ownerId} />))}
            </div>
          </ScrollArea>
          <div className="p-8 text-center bg-white/5"><button onClick={() => setIsParticipantListOpen(false)} className="text-xs font-black uppercase tracking-widest text-white/40">Close List</button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGamesDialogOpen} onOpenChange={setIsGamesDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-full duration-500 font-headline">
          <DialogHeader className="p-8 pb-4 text-center border-b border-gray-50">
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-yellow-600">Game Zone</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Select a frequency dimension to play</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {GAME_LIST.map(game => (
                <button 
                  key={game.id}
                  onClick={() => { router.push(`/games/${game.id}`); setIsGamesDialogOpen(false); }}
                  className={cn("h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-transparent transition-all active:scale-95 group", game.color, "bg-opacity-10 hover:bg-opacity-20 hover:border-current")}
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">{game.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{game.title}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
               <button onClick={() => { setIsCalculatorOpen(true); setIsGamesDialogOpen(false); }} className="flex flex-col items-center gap-1.5"><div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><CalculatorIcon className="h-6 w-6" /></div><span className="text-[8px] font-black uppercase">Calc</span></button>
               <button onClick={() => { setIsMusicMenuOpen(true); setIsGamesDialogOpen(false); }} className="flex flex-col items-center gap-1.5"><div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500"><Music className="h-6 w-6" /></div><span className="text-[8px] font-black uppercase">Music</span></button>
               <button onClick={() => { setIsSettingsOpen(true); setIsGamesDialogOpen(false); }} className="flex flex-col items-center gap-1.5"><div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500"><SettingsIcon className="h-6 w-6" /></div><span className="text-[8px] font-black uppercase">Settings</span></button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden font-headline">
          <DialogHeader className="p-8 pb-4 text-center border-b">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic text-pink-600">Ummy Boutique</DialogTitle>
            <DialogDescription className="sr-only">Send high-fidelity vibes to tribe members.</DialogDescription>
          </DialogHeader>
          <div className="p-8 pt-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
              {AVAILABLE_GIFTS.map(g => (
                <button key={g.id} onClick={() => handleSendGift(g)} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-secondary/50 hover:bg-primary/20 transition-all group active:scale-90">
                  <span className="text-4xl group-hover:scale-125 transition-transform">{g.emoji}</span>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase truncate w-20 tracking-tighter">{g.name}</p>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary"><GoldCoinIcon className="h-3 w-3" />{g.price}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-between shadow-inner"><span className="text-xs font-black uppercase opacity-60 tracking-widest text-pink-600">Balance</span><div className="flex items-center gap-2 font-black text-primary text-xl"><GoldCoinIcon className="h-5 w-5" />{userProfile?.wallet?.coins || 0}</div></div>
          </div>
        </DialogContent>
      </Dialog>

      <RoomUserProfileDialog userId={selectedParticipantUid} open={isUserProfileCardOpen} onOpenChange={setIsUserProfileCardOpen} canManage={canManageRoom} isOwner={isOwner} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} onSilence={() => {}} onKick={() => {}} onLeaveSeat={() => {}} onToggleMod={() => {}} onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }} isSilenced={false} isMe={selectedParticipantUid === currentUser?.uid} />
      <Dialog open={isMicOptionPickerOpen} onOpenChange={setIsMicOptionPickerOpen}><DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] overflow-hidden"><DialogHeader className="p-8 pb-4 text-center border-b"><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Mic Mode</DialogTitle><DialogDescription className="sr-only">Max mic count.</DialogDescription></DialogHeader><div className="p-8 grid grid-cols-2 gap-4">{MIC_OPTIONS.map(opt => (<button key={opt} onClick={() => { updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { maxActiveMics: opt }); setIsMicOptionPickerOpen(false); }} className={cn("h-16 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-2", maxMics === opt ? "bg-primary text-white" : "bg-gray-100")}>{opt} <Mic className="h-5 w-5" /></button>))}</div></DialogContent></Dialog>
      <Dialog open={isThemePickerOpen} onOpenChange={setIsThemePickerOpen}><DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] overflow-hidden"><DialogHeader className="p-8 pb-4 text-center border-b"><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Room Themes</DialogTitle><DialogDescription className="sr-only">Visual background selector.</DialogDescription></DialogHeader><div className="p-8 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">{ROOM_THEMES.map(t => (<button key={t.id} onClick={() => { updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { roomThemeId: t.id }); setIsThemePickerOpen(false); }} className={cn("relative aspect-square rounded-2xl overflow-hidden border-4 transition-all", (room as any).roomThemeId === t.id ? "border-primary" : "border-transparent")}><Image src={t.url} alt={t.name} fill className="object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-black text-[10px] uppercase text-center px-2 italic">{t.name}</span></div></button>))}</div></DialogContent></Dialog>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}><DialogContent className="w-screen h-screen max-w-none m-0 border-none bg-white text-black p-0 flex flex-col font-headline"><DialogHeader className="p-4 border-b"><button onClick={() => setIsSettingsOpen(false)} className="p-2 -ml-2 text-gray-600"><ChevronLeft className="h-6 w-6" /></button><DialogTitle className="flex-1 text-center font-bold text-lg -ml-4">Room Settings</DialogTitle><DialogDescription className="sr-only">Modify room metadata.</DialogDescription></DialogHeader><ScrollArea className="flex-1 bg-gray-50/30"><div className="space-y-4 p-6"><SettingsListItem label="Theme" value={currentTheme.name} onClick={() => setIsThemePickerOpen(true)} /><SettingsListItem label="Mic Mode" value={`${maxMics} mics`} onClick={() => setIsMicOptionPickerOpen(true)} /></div></ScrollArea></DialogContent></Dialog>
      <Dialog open={isMusicMenuOpen} onOpenChange={setIsMusicMenuOpen}><DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[2.5rem] overflow-hidden"><DialogHeader className="p-8 pb-4 text-center border-b"><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Music</DialogTitle><DialogDescription className="sr-only">Radio tracks.</DialogDescription></DialogHeader><div className="p-8 grid grid-cols-2 gap-3">{MUSIC_TRACKS.map(track => (<button key={track.id} onClick={() => updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { currentMusicUrl: room.currentMusicUrl === track.url ? null : track.url })} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center gap-2", room.currentMusicUrl === track.url ? "bg-primary border-primary text-white" : "bg-gray-50 border-transparent text-gray-400")}>{room.currentMusicUrl === track.url ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}<span className="text-[10px] font-black uppercase truncate w-full">{track.name}</span></button>))}</div></DialogContent></Dialog>
      <Dialog open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}><DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden"><DialogHeader className="p-8 pb-4 text-center border-b"><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Reactions</DialogTitle><DialogDescription className="sr-only">Select emoji.</DialogDescription></DialogHeader><div className="p-8 grid grid-cols-3 gap-6">{TRIBE_EMOJIS.map(emoji => (<button key={emoji} onClick={() => { if (currentUser) updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { activeEmoji: emoji }); setIsEmojiPickerOpen(false); setTimeout(() => { if (currentUser) updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { activeEmoji: null }); }, 4000); }} className="text-5xl hover:scale-125 transition-transform">{emoji}</button>))}</div></DialogContent></Dialog>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
>>>>>>> 414937a (When user enter in any room so there Entry card will show like this.....)
    </div>
  );
}
