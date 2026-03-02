
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  Mic,
  MicOff,
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
  UserCheck,
  Ban,
  ChevronDown,
  AlertTriangle,
  User as UserIcon,
  RefreshCw,
  Gamepad2,
  ShieldCheck,
  Music,
  Play,
  Square,
  MoreHorizontal,
  Power,
  Mail,
  LayoutGrid,
  ChevronRight,
  Armchair,
  Crown,
  Heart,
  ChevronLeft,
  X,
  Settings as SettingsIcon,
  Copy,
  Info,
  Calculator as CalculatorIcon,
  Camera,
  MessageSquare
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import type { Room, RoomParticipant, Gift } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
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
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
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

const MUSIC_TRACKS = [
  { id: 'lofi', name: 'Lofi Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'jazz', name: 'Midnight Jazz', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'ambient', name: 'Deep Space', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'chill', name: 'Ocean Breeze', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(e => console.log('Audio Autoplay Blocked:', e));
    }
  }, [stream]);
  return <audio ref={audioRef} autoPlay className="hidden" />;
}

const ModeratorItem = ({ userId }: { userId: string }) => {
  const { userProfile } = useUserProfile(userId);
  if (!userProfile) return null;
  return (
    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
      <Avatar className="h-12 w-12 border-2 border-white/10">
        <AvatarImage src={userProfile.avatarUrl} />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-black text-sm uppercase tracking-tight">{userProfile.username}</p>
        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Room Admin</p>
      </div>
      <ShieldCheck className="h-5 w-5 text-blue-400" />
    </div>
  );
};

const TribeMemberItem = ({ participant, ownerId }: { participant: RoomParticipant, ownerId: string }) => {
  const { userProfile } = useUserProfile(participant.uid);
  const isPOwner = participant.uid === ownerId;
  
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group active:bg-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-14 w-14 border-2 border-white/10">
            <AvatarImage src={participant.avatarUrl} />
            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-black",
            userProfile?.isOnline ? "bg-green-500" : "bg-black"
          )} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-sm uppercase tracking-tight">{participant.name}</p>
            {isPOwner && <Crown className="h-3 w-3 text-yellow-500 fill-current" />}
          </div>
          <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">
            {isPOwner ? "Room Owner" : "Tribe Member"}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white" />
    </div>
  );
};

const SettingsListItem = ({ label, value, onClick, icon: Icon, showChevron = true }: any) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group cursor-pointer active:bg-gray-50 transition-colors"
  >
    <span className="font-bold text-gray-800 text-sm tracking-tight">{label}</span>
    <div className="flex items-center gap-2">
      {value && <span className="text-sm text-gray-400 max-w-[120px] truncate">{value}</span>}
      {Icon && <Icon className="h-4 w-4 text-gray-300" />}
      {showChevron && <ChevronRight className="h-4 w-4 text-gray-200 group-hover:translate-x-0.5 transition-transform" />}
    </div>
  </div>
);

function CalculatorPortal() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleKey = (key: string) => {
    if (key === 'C') { setDisplay('0'); setEquation(''); return; }
    if (key === '=') {
      try {
        const result = eval(equation);
        setDisplay(String(result));
        setEquation(String(result));
      } catch { setDisplay('Error'); setEquation(''); }
      return;
    }
    const newEquation = equation + key;
    setEquation(newEquation);
    setDisplay(key);
  };

  const keys = ['7','8','9','/', '4','5','6','*', '1','2','3','-', '0','.','=','+', 'C'];

  return (
    <div className="p-4 bg-slate-900 rounded-[2rem] border-2 border-white/10 shadow-2xl space-y-4">
      <div className="bg-black/40 p-4 rounded-xl text-right">
        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Exchange Calc</p>
        <p className="text-3xl font-black text-primary truncate">{display}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map(k => (
          <button 
            key={k} 
            onClick={() => handleKey(k)}
            className={cn(
              "h-12 rounded-xl font-black transition-all active:scale-90",
              k === '=' ? "bg-primary text-white" : "bg-white/5 text-white hover:bg-white/10",
              k === 'C' && "col-span-4 bg-red-500/20 text-red-500"
            )}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RoomClient({ room }: { room: Room }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isGamesDialogOpen, setIsGamesDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);
  const [showGiftEffects, setShowGiftEffects] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isClaimingTree, setIsClaimingTree] = useState(false);
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<'profile' | 'members'>('profile');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(true);

  const [editingField, setEditingField] = useState<'name' | 'announcement' | 'welcome' | 'music' | 'admins' | null>(null);
  const [fieldValue, setEditingFieldValue] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const roomDpInputRef = useRef<HTMLInputElement>(null);
  const roomAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const { userProfile: ownerProfile } = useUserProfile(room.ownerId);
  const firestore = useFirestore();
  const { isUploading: isRoomImageUploading, uploadRoomImage } = useRoomImageUpload(room.id);
  const { setActiveRoom } = useRoomContext();

  const isGlobalAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');
  const isOwner = currentUser?.uid === room.ownerId;
  const isModerator = room.moderatorIds?.includes(currentUser?.uid || '');
  const canManageRoom = isGlobalAdmin || isOwner || isModerator;

  useEffect(() => {
    if (!firestore || !currentUser || !room.id) return;
    const followRef = doc(firestore, 'users', currentUser.uid, 'followingRooms', room.id);
    const checkFollowing = async () => {
      const snap = await getDoc(followRef);
      setIsFollowing(snap.exists());
      setIsFollowingLoading(false);
    };
    checkFollowing();
  }, [firestore, currentUser, room.id]);

  const handleToggleFollow = async () => {
    if (!firestore || !currentUser || !room.id) return;
    const followRef = doc(firestore, 'users', currentUser.uid, 'followingRooms', room.id);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        toast({ title: 'Unfollowed' });
      } else {
        await setDoc(followRef, {
          roomId: room.id,
          roomName: room.title,
          coverUrl: room.coverUrl || '',
          followedAt: serverTimestamp()
        });
        setIsFollowing(true);
        toast({ title: 'Following Room' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, currentUser]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;

  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);
  const hostParticipant = participants?.find(p => p.seatIndex === 1);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  
  // REAL-TIME VOICE: Initialize WebRTC frequency for everyone
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
    if (participants && currentUser && !participants.some(p => p.uid === currentUser.uid)) {
      setActiveRoom(null);
      router.replace('/rooms');
    }
  }, [participants, currentUser, router, setActiveRoom]);

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

  const handleSendGift = async (gift: Gift) => {
    if (!currentUser || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < gift.price) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
    const userRef = doc(firestore, 'users', currentUser.uid);
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    const roomDocRef = doc(firestore, 'chatRooms', room.id);
    let finalRecipient = giftRecipient || (hostParticipant ? { uid: hostParticipant.uid, name: hostParticipant.name, avatarUrl: hostParticipant.avatarUrl } : { uid: currentUser.uid, name: userProfile.username, avatarUrl: userProfile.avatarUrl });
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
      toast({ title: 'Frequency Cleaned' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    }
  };

  const handleMoneyTreeClick = async () => {
    if (!currentUser || !firestore || !userProfile || isClaimingTree) return;
    const lastClaim = userProfile.lastMoneyTreeClaimAt?.toDate();
    const today = new Date();
    const isAlreadyClaimedToday = lastClaim && 
      lastClaim.getDate() === today.getDate() && 
      lastClaim.getMonth() === today.getMonth() && 
      lastClaim.getFullYear() === today.getFullYear();
    if (isAlreadyClaimedToday) { toast({ title: 'Already Claimed' }); return; }
    setIsClaimingTree(true);
    try {
      const reward = 1000;
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const updateData = { 'wallet.coins': increment(reward), 'lastMoneyTreeClaimAt': serverTimestamp(), 'updatedAt': serverTimestamp() };
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      toast({ title: 'Sync Successful', description: `Received 1,000 Gold Coins.` });
    } catch (e: any) { toast({ variant: 'destructive', title: 'Sync Failed', description: e.message }); } finally { setIsClaimingTree(false); }
  };

  const toggleRoomMessages = () => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { isChatMuted: !room.isChatMuted }); };
  const handleToggleMusic = (url: string) => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { currentMusicUrl: room.currentMusicUrl === url ? null : url }); };
  const handleDeleteRoom = async () => { if (!firestore || !room.id || (!isOwner && !isGlobalAdmin)) return; try { const participantsSnap = await getDocs(collection(firestore, 'chatRooms', room.id, 'participants')); const batch = writeBatch(firestore); participantsSnap.docs.forEach(d => batch.delete(d.ref)); batch.delete(doc(firestore, 'chatRooms', room.id)); await batch.commit(); setActiveRoom(null); router.push('/rooms'); } catch(e:any){} };
  const toggleSeatLock = (index: number) => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { lockedSeats: room.lockedSeats?.includes(index) ? arrayRemove(index) : arrayUnion(index) }); };
  const silenceParticipant = (uid: string, currentState: boolean) => { if (!canManageRoom || !firestore || !room.id) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { isSilenced: !currentState, isMuted: true }); };
  
  const kickParticipant = async (uid: string) => {
    if (!canManageRoom || !firestore || !room.id) return;
    const pRef = doc(firestore, 'chatRooms', room.id, 'participants', uid);
    deleteDocumentNonBlocking(pRef);
    setIsActionMenuOpen(false);
    toast({ title: 'Member Kicked' });
  };

  const leaveRoom = () => { setActiveRoom(null); router.push('/rooms'); };
  const takeSeat = (index: number) => { if (!firestore || !room.id || !currentUser || !userProfile) return; if (room.lockedSeats?.includes(index)) { toast({ variant: 'destructive', title: 'Seat Locked' }); return; } updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: index, isMuted: true, activeWave: userProfile.inventory?.activeWave || 'Default' }); };
  const leaveSeat = () => { if (!firestore || !room.id || !currentUser) return; updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { seatIndex: 0, isMuted: true }); setIsActionMenuOpen(false); };
  
  const handleMicToggle = () => { 
    if (!isInSeat) { 
      const first = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(i => !participants?.some(p => p.seatIndex === i) && !room.lockedSeats?.includes(i)); 
      if (first) takeSeat(first); 
      return; 
    } 
    if (currentUserParticipant?.isSilenced) { 
      toast({ variant: 'destructive', title: 'Silenced' }); 
      return; 
    } 
    if (firestore && currentUser && room.id) { 
      updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid), { isMuted: !currentUserParticipant?.isMuted }); 
    } 
  };

  const toggleModerator = (targetUid: string) => {
    if (!isOwner || !firestore || !room.id) return;
    const isPMod = room.moderatorIds?.includes(targetUid);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { moderatorIds: isPMod ? arrayRemove(targetUid) : arrayUnion(targetUid) });
    toast({ title: isPMod ? 'Admin Revoked' : 'Admin Granted' });
  };

  const handleUpdateRoomField = async () => {
    if (!firestore || !room.id || !canManageRoom) return;
    const fieldMap: Record<string, string> = { name: 'name', announcement: 'announcement', welcome: 'welcomeMessage' };
    const dbField = fieldMap[editingField!];
    if (!dbField) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { [dbField]: fieldValue, updatedAt: serverTimestamp() });
    setEditingField(null);
    toast({ title: 'Room Updated' });
  };

  const toggleRoomLock = () => {
    if (!canManageRoom || !firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), { isLocked: !(room as any).isLocked });
  };

  const handleTutorialComplete = () => {
    if (currentUser && firestore) { updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), { isNewUser: false }); }
    setShowTutorial(false);
  };

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/rooms/${room.id}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Invite Copied' });
  };

  const selectedOccupant = participants?.find(p => p.seatIndex === selectedSeatIndex);
  const getWaveColor = (waveId?: string) => waveId === 'w1' ? 'text-cyan-500' : waveId === 'w2' ? 'text-orange-600' : 'text-primary';

  const Seat = ({ index }: { index: number }) => {
    const occupant = participants?.find(p => p.seatIndex === index);
    const isLocked = room.lockedSeats?.includes(index);
    const isPOwner = occupant?.uid === room.ownerId;
    const isPMod = room.moderatorIds?.includes(occupant?.uid || '') && !isPOwner;

    return (
      <div className="flex flex-col items-center gap-0.5 w-full">
        <div className="relative">
          <EmojiReactionOverlay emoji={occupant?.activeEmoji} size={index === 1 ? "xl" : "lg"} />
          <div className="relative">
            {occupant && !occupant.isMuted && (<div className={cn("absolute -inset-1 rounded-full border-2 animate-voice-wave", getWaveColor(occupant.activeWave))} />)}
            <AvatarFrame frameId={occupant?.activeFrame} size={index === 1 ? "lg" : "md"}>
              <button 
                onClick={() => { setSelectedSeatIndex(index); setIsActionMenuOpen(true); }}
                className={cn(
                  "rounded-full flex items-center justify-center transition-all bg-black/40 border-2 border-white/10 backdrop-blur-sm shadow-xl relative overflow-hidden",
                  index === 1 ? "h-14 w-14" : "h-12 w-12",
                  isLocked && "border-red-500/50 bg-red-500/10"
                )}
              >
                {occupant ? (
                  <Avatar className="h-full w-full"><AvatarImage src={occupant.avatarUrl} /><AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback></Avatar>
                ) : isLocked ? (<Lock className="h-4 w-4 text-red-500/60" />) : (<Armchair className={cn("text-white/20", index === 1 ? "h-6 w-6" : "h-5 w-5")} />)}
              </button>
            </AvatarFrame>
            {occupant?.isMuted && (<div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-0.5 border border-black shadow-lg"><MicOff className="h-2 w-2 text-white" /></div>)}
            {!occupant?.isMuted && occupant && (<div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border border-black shadow-lg"><Mic className="h-2 w-2 text-white" /></div>)}
            {isPOwner && (<div className="absolute -top-0.5 -left-0.5 bg-yellow-500 rounded-full p-0.5 border border-black shadow-lg z-[45]"><Crown className="h-2 w-2 text-black fill-current" /></div>)}
            {isPMod && (<div className="absolute -top-0.5 -left-0.5 bg-blue-500 rounded-full p-0.5 border border-black shadow-lg z-[45]"><ShieldCheck className="h-2 w-2 text-white fill-current" /></div>)}
            {canManageRoom && (<button onClick={(e) => { e.stopPropagation(); setSelectedSeatIndex(index); setIsActionMenuOpen(true); }} className="absolute -top-1 -right-1 bg-black/60 rounded-full p-0.5 border border-white/10 z-40"><MoreHorizontal className="h-2 w-2 text-white" /></button>)}
          </div>
        </div>
        <span className={cn("text-[8px] font-black uppercase drop-shadow-md truncate w-12 text-center", occupant ? "text-yellow-400" : "text-white/60")}>{occupant ? occupant.name : `No.${index}`}</span>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl animate-in fade-in duration-700">
      {showTutorial && <VoiceTutorial onComplete={handleTutorialComplete} />}
      <DailyRewardDialog />
      <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />
      <audio ref={roomAudioRef} loop crossOrigin="anonymous" />
      {/* Remote Audio Handshakes */}
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => <RemoteAudio key={peerId} stream={stream} />)}
      
      <div className="absolute inset-0 z-0">
        <Image src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000" alt="Background" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-10" />
      </div>

      <header className="relative z-50 flex items-center justify-between p-4 pt-4">
        <div className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-transform" onClick={() => setIsRoomInfoOpen(true)}>
          <Avatar className="h-10 w-10 rounded-xl border border-white/20 group-hover:border-primary transition-colors"><AvatarImage src={room.coverUrl} /><AvatarFallback>UM</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2"><h1 className="font-black text-sm uppercase tracking-tight">{room.title}</h1><ChevronRight className="h-3 w-3 text-white/40 group-hover:text-primary" /></div>
            <p className="text-[10px] font-bold text-white/60 uppercase">ID:{room.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && (<button onClick={handleToggleFollow} className={cn("h-8 px-4 rounded-full font-black uppercase text-[10px] transition-all flex items-center gap-1.5 shadow-lg", isFollowing ? "bg-white/20 text-white border border-white/10" : "bg-primary text-white shadow-primary/20")}><Heart className={cn("h-3 w-3", isFollowing && "fill-current")} />{isFollowing ? 'Following' : 'Follow'}</button>)}
          <button onClick={() => setIsParticipantListOpen(true)} className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors"><Users className="h-3 w-3 text-white/60" /><span className="text-[10px] font-black">{onlineCount}</span></button>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all" onClick={() => setIsSettingsOpen(true)}><SettingsIcon className="h-4 w-4" /></button>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all" onClick={handleCopyInvite}><Share2 className="h-4 w-4" /></button>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all" onClick={leaveRoom}><Power className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="relative z-50 px-4 mt-0"><div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 rounded-full py-1 px-3 w-fit flex items-center gap-2"><Trophy className="h-3 w-3 text-yellow-500" /><span className="text-[10px] font-black text-yellow-500 uppercase">{(room.stats?.totalGifts || 0).toLocaleString()}</span><ChevronRight className="h-2 w-2 text-yellow-500/60" /></div></div>

      <button onClick={handleMoneyTreeClick} disabled={isClaimingTree} className="absolute top-20 right-4 z-40 animate-bounce hover:scale-110 active:scale-95 transition-transform" style={{ animationDuration: '4s' }}><div className="relative h-10 w-10">{isClaimingTree ? (<Loader className="h-full w-full animate-spin text-yellow-500" />) : (<Image src="https://img.icons8.com/color/96/money-tree.png" alt="Money Tree" fill className="object-contain" />)}</div></button>

      <main className="relative z-10 flex-1 flex flex-col pt-1 overflow-hidden">
        <div className="px-4 space-y-1 flex flex-col items-center"><div className="w-16"><Seat index={1} /></div><div className="grid grid-cols-4 gap-1 w-full max-w-sm">{[2, 3, 4, 5].map(i => <Seat key={i} index={i} />)}</div><div className="grid grid-cols-4 gap-1 w-full max-w-sm">{[6, 7, 8, 9].map(i => <Seat key={i} index={i} />)}</div></div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-40"><div className="bg-gradient-to-b from-amber-200 to-amber-600 p-0.5 rounded-xl shadow-2xl"><div className="bg-black/80 rounded-lg p-1 flex flex-col items-center gap-0.5 border border-white/5"><Trophy className="h-5 w-5 text-yellow-500" /><p className="text-[6px] font-black uppercase text-center text-white/60 leading-none">Room Support</p><div className="flex gap-0.5 mt-0.5">{[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("h-1 w-1 rounded-full", i === 1 ? "bg-white" : "bg-white/20")} />)}</div></div></div></div>
        <div className="flex-1 flex flex-col mt-2 px-4 pb-2 justify-end"><div className="space-y-1"><div className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-xl animate-in fade-in duration-1000"><p className="text-emerald-400 text-[9px] font-black uppercase leading-relaxed text-center">Welcome to Ummy! Please show respect to one another and be courteous.</p></div>{!isInSeat && (<Button onClick={handleMicToggle} className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-xl h-9 px-8 font-black uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-[10px]">Join Voice Chat <ChevronRight className="ml-2 h-3 w-3" /></Button>)}<ScrollArea className="h-20" ref={scrollRef}><div className="space-y-1">{activeMessages.map((msg) => (<div key={msg.id} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">{msg.type === 'entrance' ? (<p className="text-[8px] font-black uppercase text-white/60">welcome <span className="text-yellow-400">{msg.user.name}</span> entered the room</p>) : (<div className="bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/5 flex gap-2 max-w-[90%]"><span className="text-[8px] font-black text-blue-400 shrink-0 uppercase">{msg.user.name}:</span><p className="text-[8px] font-medium text-white/80">{msg.text}</p></div>)}</div>))}</div></ScrollArea></div></div>
      </main>

      <footer className="relative z-50 px-4 pb-4 flex items-center justify-between gap-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-1">
        <button 
          onClick={handleMicToggle}
          className={cn(
            "p-2 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-90",
            isInSeat && !currentUserParticipant?.isMuted ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-white/10 text-white"
          )}
        >
          {isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
        <form className="flex-1 bg-white/10 backdrop-blur-xl rounded-full h-9 px-4 flex items-center border border-white/5" onSubmit={handleSendMessage}>
          <Input placeholder="Say Hi" className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest placeholder:text-white/40 focus-visible:ring-0 h-full" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
        </form>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsParticipantListOpen(true)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><Users className="h-4 w-4" /></button>
          <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><Mail className="h-4 w-4" /></button>
          <button className="bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all" onClick={() => setIsGiftPickerOpen(true)}><GiftIcon className="h-4 w-4 text-white" /></button>
          <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all" onClick={() => setIsGamesDialogOpen(true)}><LayoutGrid className="h-4 w-4" /></button>
        </div>
      </footer>

      <Dialog open={isParticipantListOpen} onOpenChange={setIsParticipantListOpen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-black/95 backdrop-blur-xl text-white p-0 flex flex-col animate-in slide-in-from-bottom duration-500 font-headline overflow-hidden">
          <header className="flex items-center p-4 border-b border-white/10 mt-10">
            <button onClick={() => setIsParticipantListOpen(false)} className="p-2 -ml-2 text-white/60"><ChevronLeft className="h-6 w-6" /></button>
            <DialogTitle className="flex-1 text-center font-black uppercase text-lg -ml-4">Tribe List ({onlineCount})</DialogTitle>
          </header>
          <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-4">
              {participants?.map((p) => (
                <TribeMemberItem key={p.uid} participant={p} ownerId={room.ownerId} />
              ))}
            </div>
          </ScrollArea>
          <div className="p-8 text-center bg-white/5">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Ummy Social Sync Protocol</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col animate-in slide-in-from-right duration-300 font-headline overflow-hidden">
          <header className="flex items-center p-4 border-b">
            <button onClick={() => setIsSettingsOpen(false)} className="p-2 -ml-2 text-gray-600"><ChevronLeft className="h-6 w-6" /></button>
            <DialogTitle className="flex-1 text-center font-bold text-lg -ml-4">Room Settings</DialogTitle>
          </header>
          
          <ScrollArea className="flex-1 bg-gray-50/30">
            <div className="pb-20">
              <section className="bg-white py-10 flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => roomDpInputRef.current?.click()}>
                  <div className="h-32 w-32 rounded-[2rem] overflow-hidden border-4 border-gray-100 shadow-xl bg-gray-100 flex items-center justify-center relative">
                    {room.coverUrl ? (<Image src={room.coverUrl} alt="Room Cover" fill className="object-cover" />) : (<Camera className="h-10 w-10 text-gray-300" />)}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-gray-100"><Camera className="h-4 w-4 text-gray-800" /></div>
                </div>
                <div className="text-center">
                  <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Room Cover</h3>
                  <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mt-1">Click to edit</p>
                </div>
              </section>

              <section className="mt-2 bg-white px-6">
                <SettingsListItem label="Room Name" value={room.title} onClick={() => { setEditingField('name'); setEditingFieldValue(room.title); }} />
                <SettingsListItem label="Room Announcement" value={room.announcement} onClick={() => { setEditingField('announcement'); setEditingFieldValue(room.announcement || ''); }} />
                <SettingsListItem label="Theme" value="Misty Forest" />
                <SettingsListItem label="Music" value={room.currentMusicUrl ? "Active" : "None"} onClick={() => setIsMusicMenuOpen(true)} />
                <SettingsListItem label="Admin" value={`${room.moderatorIds?.length || 0} Managed`} onClick={() => setEditingField('admins')} />
                <SettingsListItem label="Room Lock" onClick={toggleRoomLock} showChevron={false} icon={(room as any).isLocked ? Lock : Unlock} />
              </section>

              <section className="mt-2 bg-white px-6">
                <SettingsListItem label="Welcome Message" value={(room as any).welcomeMessage} onClick={() => { setEditingField('welcome'); setEditingFieldValue((room as any).welcomeMessage || ''); }} />
                <SettingsListItem label="Mic Mode" value="9 mics" />
              </section>

              <section className="mt-2 bg-white px-6 py-2">
                <button onClick={() => setIsClearChatConfirmOpen(true)} className="w-full py-4 text-left font-bold text-red-500 text-sm tracking-tight flex items-center gap-3"><Trash2 className="h-4 w-4" /> Clean frequency messages</button>
                {(isOwner || isGlobalAdmin) && (<button onClick={handleDeleteRoom} className="w-full py-4 text-left font-bold text-red-600 text-sm tracking-tight flex items-center gap-3"><AlertTriangle className="h-4 w-4" /> Disband frequency permanently</button>)}
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[2.5rem] overflow-hidden">
          <DialogHeader className="p-8 pb-4 text-center border-b">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Edit Room {editingField}</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            {editingField === 'admins' ? (
              <div className="space-y-4">
                {room.moderatorIds?.map(id => (<ModeratorItem key={id} userId={id} />))}
                {(!room.moderatorIds || room.moderatorIds.length === 0) && (<p className="text-center py-10 text-gray-300 uppercase font-black text-xs">No admins assigned</p>)}
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-gray-400">New Value</Label>
                {editingField === 'announcement' || editingField === 'welcome' ? (
                  <Textarea value={fieldValue} onChange={(e) => setEditingFieldValue(e.target.value)} className="h-32 rounded-2xl border-2" />
                ) : (
                  <Input value={fieldValue} onChange={(e) => setEditingFieldValue(e.target.value)} className="h-14 rounded-2xl border-2" />
                )}
              </div>
            )}
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button onClick={handleUpdateRoomField} className="w-full h-16 rounded-[1.5rem] text-xl font-black uppercase">Sync Frequency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMusicMenuOpen} onOpenChange={setIsMusicMenuOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[2.5rem] overflow-hidden">
          <DialogHeader className="p-8 pb-4 text-center border-b"><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Room Radio</DialogTitle></DialogHeader>
          <div className="p-8 grid grid-cols-2 gap-3">
            {MUSIC_TRACKS.map(track => (<button key={track.id} onClick={() => handleToggleMusic(track.url)} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all", room.currentMusicUrl === track.url ? "bg-primary border-primary text-white shadow-lg" : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100")}>{room.currentMusicUrl === track.url ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}<span className="text-[10px] font-black uppercase truncate w-full">{track.name}</span></button>))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoomInfoOpen} onOpenChange={setIsRoomInfoOpen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-black/95 backdrop-blur-xl text-white p-0 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-headline">
          <DialogHeader className="sr-only"><DialogTitle>Room Info</DialogTitle><DialogDescription>Detailed identity portal.</DialogDescription></DialogHeader>
          <div className="relative flex-1 flex flex-col items-center pt-20 px-6">
            <div className="absolute top-8 left-6"><button onClick={handleCopyInvite} className="p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-all"><Share2 className="h-6 w-6" /></button></div>
            <div className="absolute top-8 right-6"><button onClick={() => { setIsRoomInfoOpen(false); setIsSettingsOpen(true); }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-all"><SettingsIcon className="h-6 w-6" /></button></div>
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative"><Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl"><AvatarImage src={ownerProfile?.avatarUrl} /><AvatarFallback className="bg-slate-800 text-4xl">{(ownerProfile?.username || 'U').charAt(0)}</AvatarFallback></Avatar><div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 rounded-full p-1.5 shadow-lg"><Crown className="h-6 w-6 text-black fill-current" /></div></div>
              <div className="text-center space-y-1"><h2 className="text-3xl font-black uppercase tracking-tighter">{ownerProfile?.username || room.title}</h2><div className="flex items-center justify-center gap-2 text-white/60"><span className="text-xs font-bold uppercase tracking-widest">ID:{room.roomNumber}</span><button onClick={() => { navigator.clipboard.writeText(room.roomNumber); toast({ title: 'ID Copied' }); }} className="p-1 hover:text-white transition-colors"><Copy className="h-3 w-3" /></button></div></div>
            </div>
            <div className="flex gap-12 border-b border-white/10 w-full justify-center mb-8"><button onClick={() => setInfoTab('profile')} className={cn("pb-4 text-lg font-black uppercase tracking-widest border-b-4 transition-all", infoTab === 'profile' ? "border-primary text-white" : "border-transparent text-white/40")}>Profile</button><button onClick={() => setInfoTab('members')} className={cn("pb-4 text-lg font-black uppercase tracking-widest border-b-4 transition-all", infoTab === 'members' ? "border-primary text-white" : "border-transparent text-white/40")}>Member</button></div>
            <ScrollArea className="w-full max-w-sm flex-1 no-scrollbar"><div className="space-y-8 pb-20">{infoTab === 'profile' ? (<><div className="w-full bg-white/5 rounded-[2rem] p-4 flex items-center gap-4 border border-white/5 shadow-inner"><Avatar className="h-14 w-14 rounded-2xl border-2 border-white/10"><AvatarImage src={ownerProfile?.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar><div className="flex-1"><p className="font-black text-lg uppercase tracking-tight">{ownerProfile?.username || 'Host'}</p><p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Room Owner</p></div><div className="flex items-center gap-1 bg-primary/20 px-3 py-1 rounded-full border border-primary/30"><Crown className="h-3 w-3 text-primary" /><span className="text-[10px] font-black text-primary uppercase">Elite</span></div></div><div className="w-full space-y-4"><div className="flex items-center gap-2 px-2"><Info className="h-4 w-4 text-white/40" /><h3 className="text-xs font-black uppercase tracking-widest text-white/40">Announcement</h3></div><div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 min-h-[120px]"><p className="text-lg font-medium text-white/80 leading-relaxed">{room.announcement || "Welcome to the frequency!"}</p></div></div></>) : (<div className="w-full space-y-3"><div className="flex items-center gap-2 px-2 mb-2"><ShieldCheck className="h-4 w-4 text-blue-400" /><h3 className="text-xs font-black uppercase tracking-widest text-white/40">Room Administrators</h3></div><div className="space-y-3">{room.moderatorIds?.map(id => (<ModeratorItem key={id} userId={id} />))}{(!room.moderatorIds || room.moderatorIds.length === 0) && (<p className="text-center py-10 text-white/20 uppercase font-black text-xs italic">No admins assigned</p>)}</div></div>)}</div></ScrollArea>
            <button onClick={() => setIsRoomInfoOpen(false)} className="mt-auto mb-8 text-[10px] font-black uppercase tracking-[0.5em] text-white/20 hover:text-white transition-colors">Tap anywhere to close</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <DialogHeader className="p-8 pb-0 text-center"><DialogTitle className="text-3xl font-black uppercase tracking-tighter">Ummy Boutique</DialogTitle><DialogDescription className="sr-only">Select gifts</DialogDescription></DialogHeader>
          <div className="p-8 pt-6 space-y-6">
            <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-2xl border-2 border-dashed border-primary/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={giftRecipient?.avatarUrl || hostParticipant?.avatarUrl || userProfile?.avatarUrl} />
                    <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full ring-2 ring-white"><UserCheck className="h-3 w-3" /></div>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Gifting Recipient</p>
                  <p className="text-sm font-black uppercase text-primary tracking-tighter">{giftRecipient?.uid === currentUser?.uid ? 'Myself' : (giftRecipient?.name || hostParticipant?.name || 'The Frequency')}</p>
                </div>
              </div>
              <button onClick={() => { if (giftRecipient?.uid === currentUser?.uid) { setGiftRecipient(null); } else { setGiftRecipient({ uid: currentUser!.uid, name: userProfile!.username, avatarUrl: userProfile!.avatarUrl }); } }} className="rounded-full text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 flex items-center gap-1.5"><RefreshCw className="h-3 w-3" />{giftRecipient?.uid === currentUser?.uid ? 'Switch to Host' : 'Gift Myself'}</button>
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">{AVAILABLE_GIFTS.map(g => (<button key={g.id} onClick={() => handleSendGift(g)} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-secondary/50 hover:bg-primary/20 transition-all border-2 border-transparent hover:border-primary group active:scale-90"><span className="text-4xl group-hover:scale-125 transition-transform duration-300">{g.emoji}</span><div className="text-center"><p className="text-[10px] font-black uppercase truncate w-20 tracking-tighter">{g.name}</p><div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary"><GoldCoinIcon className="h-3 w-3" />{g.price}</div></div></button>))}</div>
            <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-between shadow-inner"><span className="text-xs font-black uppercase opacity-60 tracking-widest">Your Balance</span><div className="flex items-center gap-2 font-black text-primary text-xl"><GoldCoinIcon className="h-5 w-5" />{userProfile?.wallet?.coins || 0}</div></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGamesDialogOpen} onOpenChange={setIsGamesDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-full duration-500">
          <DialogHeader className="p-8 pb-4 text-center border-b">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Room Tools</DialogTitle>
          </DialogHeader>
          <div className="p-8 grid grid-cols-3 gap-6">
            <ToolTile icon={CalculatorIcon} label="Calculator" color="text-blue-400" onClick={() => { setIsCalculatorOpen(true); setIsGamesDialogOpen(false); }} />
            {canManageRoom && (
              <>
                <ToolTile 
                  icon={room.isChatMuted ? MessageSquare : Trash2} 
                  label={room.isChatMuted ? "Open Msg" : "Close Msg"} 
                  color="text-orange-400"
                  onClick={toggleRoomMessages} 
                  active={room.isChatMuted}
                />
                <ToolTile 
                  icon={Trash2} 
                  label="Clear Chat" 
                  color="text-red-400"
                  onClick={() => { setIsClearChatConfirmOpen(true); setIsGamesDialogOpen(false); }} 
                />
              </>
            )}
            <ToolTile icon={Music} label="Music" color="text-purple-400" onClick={() => { setIsMusicMenuOpen(true); setIsGamesDialogOpen(false); }} />
            <ToolTile icon={Gamepad2} label="Games" color="text-green-400" onClick={() => { router.push('/games'); setIsGamesDialogOpen(false); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="sm:max-w-xs bg-transparent border-none p-0">
          <CalculatorPortal />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isClearChatConfirmOpen} onOpenChange={setIsClearChatConfirmOpen}>
        <AlertDialogContent className="bg-white text-black border-none rounded-[2rem]"><AlertDialogHeader><AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Purge Frequency Chat?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground font-body text-base">This will permanently delete all messages from this frequency for all tribe members.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-full font-black uppercase tracking-widest text-xs">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleClearChat} className="bg-destructive text-white rounded-full font-black uppercase tracking-widest text-xs">Purge Now</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-full duration-500">
          <DialogHeader className="p-8 pb-4 text-center border-b">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 border-4 border-secondary shadow-xl">
                <AvatarImage src={selectedOccupant?.avatarUrl} />
                <AvatarFallback className="text-2xl">{(selectedOccupant?.name || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{selectedOccupant ? selectedOccupant.name : `Slot ${selectedSeatIndex}`}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-8 grid grid-cols-3 gap-6">
            {!selectedOccupant ? (
              <ToolTile icon={Armchair} label="Take Seat" color="text-blue-400" onClick={() => { if (selectedSeatIndex) takeSeat(selectedSeatIndex); setIsActionMenuOpen(false); }} />
            ) : selectedOccupant.uid === currentUser?.uid ? (
              <ToolTile icon={LogOut} label="Leave Seat" color="text-red-400" onClick={leaveSeat} />
            ) : null}
            
            {canManageRoom && (
              <ToolTile icon={room.lockedSeats?.includes(selectedSeatIndex || 0) ? Unlock : Lock} label={room.lockedSeats?.includes(selectedSeatIndex || 0) ? "Unlock" : "Lock Seat"} color="text-orange-400" onClick={() => { if (selectedSeatIndex) toggleSeatLock(selectedSeatIndex); setIsActionMenuOpen(false); }} />
            )}

            {selectedOccupant && canManageRoom && selectedOccupant.uid !== currentUser?.uid && (
              <>
                <ToolTile icon={selectedOccupant.isSilenced ? Volume2 : MicOff} label={selectedOccupant.isSilenced ? "Unsilence" : "Silence"} color="text-orange-400" onClick={() => silenceParticipant(selectedOccupant.uid, !!selectedOccupant.isSilenced)} />
                <ToolTile icon={Ban} label="Kick Tribe" color="text-red-400" onClick={() => kickParticipant(selectedOccupant.uid)} />
                {isOwner && (
                  <ToolTile 
                    icon={room.moderatorIds?.includes(selectedOccupant.uid) ? ShieldCheck : UserPlus} 
                    label={room.moderatorIds?.includes(selectedOccupant.uid) ? "Revoke Admin" : "Make Admin"} 
                    color="text-blue-400"
                    onClick={() => { toggleModerator(selectedOccupant.uid); setIsActionMenuOpen(false); }} 
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <input type="file" ref={roomDpInputRef} onChange={(e) => { if (e.target.files?.[0]) { uploadRoomImage(e.target.files[0]); e.target.value = ''; } }} className="hidden" accept="image/*" />
    </div>
  );
}

const ToolTile = ({ icon: Icon, label, active, onClick, disabled, color }: any) => (
  <button onClick={onClick} disabled={disabled} className={cn("flex flex-col items-center gap-2 transition-all active:scale-95", disabled && "opacity-30 grayscale cursor-not-allowed")}>
    <div className={cn(
      "h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-colors shadow-sm", 
      active ? "bg-primary/20 border-primary text-primary" : "bg-slate-800/50 border-white/5 text-white/60 hover:bg-slate-800"
    )}>
      <Icon className={cn("h-7 w-7", !active && color ? color : "")} />
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">{label}</span>
  </button>
);
