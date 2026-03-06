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
  User as UserIcon
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
      <div className="bg-black/40 backdrop-blur-md rounded-r-full py-1.5 pl-2 pr-8 flex items-center gap-3 shadow-lg border-y border-r border-white/10">
        <span className="text-[12px] font-medium text-white/80">welcome</span>
        <span className="text-[12px] font-black text-yellow-400">{entrant.senderName}</span>
        <span className="text-[12px] font-medium text-white/80">entered the room</span>
      </div>
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
  const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [latestEntrance, setLatestEntrance] = useState<any>(null);
  const [isMutedLocal, setIsMutedLocal] = useState(false);

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
      content: messageText, senderId: currentUser.uid, senderName: userProfile.username || 'User', senderAvatar: userProfile.avatarUrl || undefined, chatRoomId: room.id, timestamp: serverTimestamp(), type: 'text'
    });
    setMessageText('');
  };

  const takeSeat = (index: number) => { 
    if (!firestore || !room.id || !currentUser) return; 
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { 
      seatIndex: index, 
      isMuted: true, 
      activeWave: userProfile?.inventory?.activeWave || 'Default',
      updatedAt: serverTimestamp() 
    }); 
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
          {occupant && !occupant.isMuted && (
            <div className="absolute -inset-1 rounded-full border-2 border-green-500 animate-voice-wave" />
          )}
          <AvatarFrame frameId={occupant?.activeFrame} size="md">
            <button 
              onClick={() => { 
                if (occupant) { 
                  setSelectedParticipantUid(occupant.uid); 
                  setIsUserProfileCardOpen(true); 
                } else if (!isMeAlreadyInSeat) {
                  takeSeat(index);
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
                <div className="bg-white/10 rounded-full h-8 w-8 flex items-center justify-center">
                   <Armchair className="text-white/40 h-4 w-4" />
                </div>
              )}
            </button>
          </AvatarFrame>
          {occupant?.isMuted && <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border border-black z-20"><MicOff className="h-2 w-2 text-white" /></div>}
        </div>
        <span className="text-[10px] font-bold text-white/60 uppercase">{label}</span>
      </div>
    );
  };

  const isMeAlreadyInSeat = participants?.some(p => p.uid === currentUser?.uid && p.seatIndex > 0);

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline">
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <EntryCard entrant={latestEntrance} onComplete={() => setLatestEntrance(null)} />
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (<RemoteAudio key={peerId} stream={stream} />))}
      
      {/* Dynamic Background Sync */}
      <div className="absolute inset-0 z-0">
        <Image src={currentTheme.url} alt="Background" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
      </div>

      {/* High-Fidelity Blueprint Header */}
      <header className="relative z-50 flex items-center justify-between p-4 pt-8">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-white/20">
            <AvatarImage src={room.coverUrl || undefined} />
            <AvatarFallback>UM</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="font-black text-[15px] uppercase tracking-tighter text-white">{room.title}</h1>
            <p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p>
            <div className="mt-1 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit border border-white/10">
               <Trophy className="h-2.5 w-2.5 text-yellow-500 fill-current" />
               <span className="text-[9px] font-black text-yellow-500 italic">251.2M</span>
               <ChevronRight className="h-2.5 w-2.5 text-yellow-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsUserListOpen(true)}
            className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 active:scale-95 transition-transform"
          >
            <Users className="h-4 w-4 text-white/60" />
            <span className="text-[12px] font-black">{onlineCount}</span>
          </button>
          
          <RoomSettingsDialog room={room} trigger={
            <button className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Hexagon className="h-5 w-5" /></button>
          } />
          
          <button onClick={() => setIsShareOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Share2 className="h-5 w-5" /></button>
          <button onClick={() => setIsExitPortalOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform"><Power className="h-5 w-5" /></button>
        </div>
      </header>

      {/* Money Tree Visual Asset */}
      <div className="absolute top-32 right-4 z-40 animate-reaction-float">
         <img src="https://images.unsplash.com/photo-1616220797937-f64f159935b7?q=80&w=200" alt="Money Tree" className="h-16 w-16 drop-shadow-2xl" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col pt-4 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
           {/* Top Seat (No.1) */}
           <div className="w-full flex justify-center">
              <Seat index={1} label="No.1" />
           </div>
           
           {/* Middle Row (No.2 - No.5) */}
           <div className="w-full flex justify-center gap-4 px-4">
              <Seat index={2} label="No.2" />
              <Seat index={3} label="No.3" />
              <Seat index={4} label="No.4" />
              <Seat index={5} label="No.5" />
           </div>

           {/* Bottom Row (No.6 - No.9) */}
           <div className="w-full flex justify-center gap-4 px-4">
              <Seat index={6} label="No.6" />
              <Seat index={7} label="No.7" />
              <Seat index={8} label="No.8" />
              <Seat index={9} label="No.9" />
           </div>

           {/* Join Call-to-Action */}
           <div className="mt-8 px-6 w-full max-w-[280px]">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl border border-white/10 shadow-xl mb-4">
                 <p className="text-[11px] font-bold leading-relaxed">Welcome to Ummy! Please show respect to one another and be courteous.</p>
              </div>
              <button 
                onClick={() => !isMeAlreadyInSeat && takeSeat(1)}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 rounded-full flex items-center justify-center gap-2 font-black uppercase text-sm shadow-xl shadow-emerald-900/40 active:scale-95 transition-all"
              >
                 Join Voice Chat <ChevronRight className="h-4 w-4" />
              </button>
           </div>
        </div>

        {/* Dynamic Activity Feed Overlay */}
        <div className="absolute right-4 bottom-24 z-40">
           <div className="relative h-20 w-16 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=200" alt="Activity" className="h-full w-full object-cover" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                 <div className="h-1 w-1 bg-white rounded-full" />
                 <div className="h-1 w-1 bg-white/40 rounded-full" />
                 <div className="h-1 w-1 bg-white/40 rounded-full" />
              </div>
           </div>
        </div>
      </main>

      {/* Blueprint Lower Interaction Bar */}
      <footer className="relative z-50 px-4 pb-10 flex items-center justify-between gap-3 pt-4">
        <div className="flex-1 flex items-center gap-3">
           {/* Say Hi Input Area */}
           <div 
             onClick={() => setShowInput(true)}
             className="bg-white/10 backdrop-blur-xl rounded-full h-12 flex-1 px-6 flex items-center text-white/60 font-bold text-sm cursor-pointer"
           >
              Say Hi
           </div>

           {/* Interaction Icon Set */}
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMutedLocal(!isMutedLocal)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform">
                 {isMutedLocal ? <VolumeX className="h-5 w-5 text-white/60" /> : <Volume2 className="h-5 w-5 text-white" />}
              </button>
              <button onClick={() => router.push('/messages')} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"><Mail className="h-5 w-5 text-white" /></button>
              
              <div className="relative">
                 <button 
                   onClick={() => setIsGiftPickerOpen(true)}
                   className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-900/40 active:scale-90 transition-transform"
                 >
                    <GiftIcon className="h-6 w-6 text-white fill-white" />
                 </button>
                 <div className="absolute -top-1 -right-1 bg-pink-500 h-3 w-3 rounded-full border-2 border-black" />
              </div>

              <button className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"><LayoutGrid className="h-5 w-5 text-white" /></button>
           </div>
        </div>
      </footer>

      {/* Input Overlay Modal for Mobile Stability */}
      {showInput && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 font-headline">
           <div className="bg-slate-900 rounded-[2.5rem] p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center px-4">
                 <h3 className="font-black uppercase tracking-widest text-[10px] text-white/40">Broadcasting to Tribe</h3>
                 <button onClick={() => setShowInput(false)} className="text-white/40"><X className="h-5 w-5" /></button>
              </div>
              <form className="flex gap-2" onSubmit={(e) => { handleSendMessage(e); setShowInput(false); }}>
                 <Input 
                   autoFocus 
                   value={messageText} 
                   onChange={(e) => setMessageText(e.target.value)}
                   className="h-14 bg-white/5 border-white/10 rounded-full px-6 text-white"
                   placeholder="Type a message..."
                 />
                 <button className="bg-primary text-black h-14 w-14 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                    <Mail className="h-6 w-6" />
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Blueprint Portal Dialogs */}
      <Dialog open={isExitPortalOpen} onOpenChange={setIsExitPortalOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden font-headline">
          <DialogHeader className="sr-only">
            <DialogTitle>Exit Frequency</DialogTitle>
            <DialogDescription>Choose to minimize the frequency or exit the session.</DialogDescription>
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

      <RoomUserListDialog open={isUserListOpen} onOpenChange={setIsUserListOpen} roomId={room.id} />
      <RoomShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} room={room} />
      
      <RoomUserProfileDialog 
        userId={selectedParticipantUid} 
        open={isUserProfileCardOpen} 
        onOpenChange={setIsUserProfileCardOpen} 
        canManage={canManageRoom} 
        isOwner={isOwner} 
        roomOwnerId={room.ownerId} 
        roomModeratorIds={room.moderatorIds || []} 
        onSilence={(uid, cur) => {}} 
        onKick={(uid, dur) => {}} 
        onLeaveSeat={(uid) => {}} 
        onToggleMod={(uid) => {}} 
        onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }} 
        isSilenced={false} 
        isMe={selectedParticipantUid === currentUser?.uid} 
      />
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
