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
  Loader,
  ShieldCheck,
  Minus,
  MoreVertical,
  Music,
  Music2,
  Phone,
  Settings,
  Shield,
  Smile,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { GoldCoinIcon, GameControllerIcon, UmmyLogoIcon } from '@/components/icons';
import type { Room, RoomParticipant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
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
  Timestamp,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { VoiceWaveIndicator } from '@/components/voice-wave-indicator';
import { useVoiceActivityContext } from '@/components/voice-activity-provider';
import { DailyRewardDialog } from '@/components/daily-reward-dialog';
import { RoomUserProfileDialog } from '@/components/room-user-profile-dialog';
import { RoomSettingsDialog } from '@/components/room-settings-dialog';
import { RoomUserListDialog } from '@/components/room-user-list-dialog';
import { RoomInfoDialog } from '@/components/room-info-dialog';
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
import { RoomFollowersDialog } from '@/components/room-followers-dialog';
import { RoomGameOverlay } from '@/components/room-game-overlay';
import { ExitRoomDialog } from '@/components/exit-room-dialog';
import { RoomSoundboard } from '@/components/room-soundboard';
import { LiveBackground } from '@/components/live-background';
import { useActivityTracker } from '@/hooks/use-activity-tracker';

// RemoteAudio shifted to ActiveRoomManager

const Seat = ({ 
  index, 
  label, 
  occupant, 
  isLocked, 
  theme, 
  onClick,
  roomOwnerId,
  roomModeratorIds
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
  intensity?: number
}) => {
  const { user } = useUser();
  const { isSpeaking, intensity } = useVoiceActivityContext();
  const currentUser = user;
  const isOccupantOwner = occupant?.uid === roomOwnerId;
  const isOccupantAdmin = roomModeratorIds.includes(occupant?.uid || '');

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-[65px]">
      <div className="relative">
        <EmojiReactionOverlay emoji={occupant?.activeEmoji} size="sm" />
        
        {/* Dynamic Voice Wave Indicator - Only show for current user */}
        {occupant && occupant.uid === currentUser?.uid && !occupant.isMuted && (
          <VoiceWaveIndicator 
            isSpeaking={isSpeaking} 
            intensity={intensity}
            accentColor={theme.accentColor}
          />
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
                <div className={cn("h-full w-full transition-opacity duration-300", occupant.activeEmoji ? "opacity-0" : "opacity-100")}>
                  <Avatar className="h-full w-full p-0.5">
                    <AvatarImage src={occupant.avatarUrl || undefined} />
                    <AvatarFallback>{(occupant.name || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
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
      </div>
      
      <div className="flex items-center justify-center gap-0.5 w-full mt-0.5">
        {occupant && isOccupantOwner && (
          <div className="bg-yellow-500 rounded-full h-2 w-2 flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
             <Home className="h-1 w-1 text-white fill-current" />
          </div>
        )}
        {occupant && !isOccupantOwner && isOccupantAdmin && (
          <div className="bg-green-500 rounded-full h-2 w-2 flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
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
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [activeLiveTheme, setActiveLiveTheme] = useState<'galaxy' | 'stars' | 'love' | 'rain' | 'none'>('none');
  const [showInput, setShowInput] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isUserProfileCardOpen, setIsUserProfileCardOpen] = useState(false);
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSeatMenuOpen, setIsSeatMenuOpen] = useState(false);
  const [isRoomPlayOpen, setIsRoomPlayOpen] = useState(false);
  const [isRoomGamesOpen, setIsRoomGamesOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isLuckyRainActive, setIsLuckyRainActive] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [activeGameSlug, setActiveGameSlug] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  
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

  // SYNC: Initialize standard user hook
  const { user: currentUser } = useUser();

  // DYNAMIC LEVELING SYNC
  useActivityTracker(room.id, currentUser?.uid || null);

  const { 
    setActiveRoom, 
    setIsMinimized, 
    setMinimizedRoom, 
    musicStream, 
    setMusicStream 
  } = useRoomContext();
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedId = useRef<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  
  // Get voice activity from context
  const { isSpeaking, intensity } = useVoiceActivityContext();

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
        title: room.title || 'Frequency',
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
      
      // SYNC: Seated users stay visible for 5m (300s) to match background grace periods.
      // Standing users stay visible for 65s (standard idle).
      const threshold = (p.seatIndex > 0) ? 300000 : 65000;
      return (now - lastSeen) < threshold;
    });
  }, [participantsData, now, currentUser?.uid]);

  const onlineCount = participants.length;
  const currentUserParticipant = participants.find(p => p.uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  
  // Audio connection handled by ActiveRoomManager

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

  // AUTO-SCROLL SYNC
  useEffect(() => {
    if (messagesEndRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [firestoreMessages]);

  // PERSISTENT EMOJI AUTO-CLEAR (3-SECOND RULE)
  useEffect(() => {
    if (!firestore || !room.id || !currentUser?.uid || !currentUserParticipant?.activeEmoji) return;

    const clearTimer = setTimeout(() => {
      console.log('[Emoji] Auto-clearing active emoji after 3s...');
      const pRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
      updateDocumentNonBlocking(pRef, { activeEmoji: null });
    }, 3000);

    return () => clearTimeout(clearTimer);
  }, [currentUserParticipant?.activeEmoji, firestore, room.id, currentUser?.uid]);

  // GIFT & EVENT SYNC ENGINE
  useEffect(() => {
    if (!firestoreMessages || firestoreMessages.length === 0) return;

    // Identify the starting point for the new delta
    const startIndex = lastProcessedId.current 
      ? firestoreMessages.findIndex(m => m.id === lastProcessedId.current) + 1
      : 0;

    const newBatch = firestoreMessages.slice(startIndex);
    
    newBatch.forEach(msg => {
      if (msg.type === 'gift' && msg.giftId) {
        console.log(`[Animation Sync] Triggering gift: ${msg.giftId}`);
        setActiveGiftSync({ id: msg.giftId, senderName: msg.senderName });
      } else if (msg.type === 'lucky-rain') {
        setIsLuckyRainActive(true);
      } else if (msg.type === 'entrance') {
        // AI WELCOME BOT LOGIC: Welcome everyone (including current user)
        handleAIWelcome(msg.senderName);
      } else if (msg.type === 'emoji' && (msg as any).isSfx) {
        // SOUNDBOARD SFX SYNC
        playLocalSfx((msg as any).sfxId);
      } else if (msg.type === 'text' && msg.senderId !== 'SYSTEM_BOT') {
        // UMmy AI GUARD & GUIDE ENGINE
        handleAIEngine(msg);
      }
    });

    if (newBatch.length > 0) {
      lastProcessedId.current = firestoreMessages[firestoreMessages.length - 1].id;
    }
  }, [firestoreMessages, currentUser?.uid, canManageRoom]); // Added canManageRoom dependency for moderation authority

  // AI GUARD STATE
  const warningCounts = useRef<Record<string, number>>({});

  const handleAIEngine = async (msg: any) => {
    if (!firestore || !room.id || !msg.content) return;
    const content = msg.content.toLowerCase();
    
    // 1. PROFANITY SHIELD (Moderation)
    const slurs = ['abuse1', 'slur2', 'badword3']; // Placeholder for a real slur list
    const isBad = slurs.some(s => content.includes(s));
    
    if (isBad) {
      const currentStrikes = (warningCounts.current[msg.senderId] || 0) + 1;
      warningCounts.current[msg.senderId] = currentStrikes;

      if (currentStrikes < 3) {
        // Send Warning
        await addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
          content: `@${msg.senderName}, aapke shabd niyam ke khilaf hain! please sudhar jao. (Warning ${currentStrikes}/3) 🛡️`,
          senderId: 'SYSTEM_BOT',
          senderName: 'Ummy AI Shield',
          senderAvatar: 'https://img.icons8.com/isometric/512/shield.png',
          type: 'text',
          timestamp: serverTimestamp()
        });
      } else {
        // STRIKE 3 - EXECUTE KICK (Only if I am Owner/Mod)
        if (canManageRoom) {
          await addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
           content: `${msg.senderName} ko 3 warnings mil chuki hain. Room se bahar nikala jaa raha hai! 🚫`,
           senderId: 'SYSTEM_BOT',
           senderName: 'Ummy AI Shield',
           senderAvatar: 'https://img.icons8.com/isometric/512/shield.png',
           type: 'text',
           timestamp: serverTimestamp()
          });
          handleKick(msg.senderId, 60); // Kick for 60 mins
        }
      }
      return;
    }

    // 2. SMART GUIDE (Q&A)
    const keywords = {
      seat: "Khali bubble par click karke seat join karein!",
      gift: "Niche box icon se gifts bhej sakte hain doston ko!",
      game: "Ludo aur Carrom games niche 'Games' tab me milenge!",
      level: "Gifts aur Daily login se aapka level badhega!",
      coin: "Coins store se purchase karein ya events join karein!"
    };

    const match = Object.entries(keywords).find(([k]) => content.includes(k));
    if (match) {
      await addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
        content: `@${msg.senderName}, ${match[1]} 💖✨`,
        senderId: 'SYSTEM_BOT',
        senderName: 'Ummy AI Guide',
        senderAvatar: 'https://img.icons8.com/isometric/512/bot.png',
        type: 'text',
        timestamp: serverTimestamp()
      });
    }
  };

  // LOCAL AUTO-WELCOME TRIGGER: Ensure user is greeted reliably upon entry
  const hasAutoWelcomed = useRef(false);
  useEffect(() => {
    if (!userProfile?.username || hasAutoWelcomed.current) return;
    
    // Slight delay for premium onboarding feel
    const timer = setTimeout(() => {
      handleAIWelcome(userProfile.username || 'Tribe Member');
      hasAutoWelcomed.current = true;
    }, 2000);

    return () => clearTimeout(timer);
  }, [userProfile?.username]);

  const handleAIWelcome = async (newUserName: string) => {
    if (!firestore || !room.id) return;
    
    // AI Greeting Logic: High-Fidelity Welcome System
    const messagesRef = collection(firestore, 'chatRooms', room.id, 'messages');
    await addDocumentNonBlocking(messagesRef, {
      content: `Welcome to Ummy, ${newUserName}! Ummy mein aapka swagat hai, main Ummy AI hoon, aapki kya sahayta karoon? 💖✨`,
      senderId: 'SYSTEM_BOT',
      senderName: 'Ummy AI',
      senderAvatar: 'https://img.icons8.com/isometric/512/bot.png',
      type: 'text',
      timestamp: serverTimestamp()
    });
  };

  const handleSfxTrigger = async (sfxId: string) => {
    if (!firestore || !room.id || !currentUser || !userProfile) return;
    
    // Broadcast SFX to all participants
    const messagesRef = collection(firestore, 'chatRooms', room.id, 'messages');
    await addDocumentNonBlocking(messagesRef, {
      text: `triggered ${sfxId}`,
      senderId: currentUser.uid,
      senderName: userProfile.username,
      senderAvatar: userProfile.avatarUrl,
      type: 'emoji',
      isSfx: true,
      sfxId: sfxId,
      timestamp: serverTimestamp()
    });

    setShowSoundboard(false);
  };

  const playLocalSfx = (sfxId: string) => {
    // In a real app, we'd play a sound file here. 
    // For now, we vibrate and show a quick toast to indicate the effect.
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
  };

  /**
   * NAVIGATION & BACK BUTTON INTERCEPTION
   */
  useEffect(() => {
    // Sync context on mount
    setActiveRoom(room);
    setMinimizedRoom(null);

    // Add a dummy entry to history to intercept back
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Re-push to keep user on same URL while dialog is open
      window.history.pushState(null, '', window.location.href);
      setShowExitDialog(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [room, setActiveRoom, setMinimizedRoom]);

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

  // Sync activeLiveTheme with the current theme's animationId
  useEffect(() => {
    if (currentTheme.animationId) {
      setActiveLiveTheme(currentTheme.animationId as any);
    } else {
      setActiveLiveTheme('none');
    }
  }, [currentTheme.animationId]);

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

  const handleMinimize = () => { 
    setMinimizedRoom(room);
    setActiveRoom(null);
    router.push('/rooms'); 
  };
  
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
    setMinimizedRoom(null);
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
      
      // Important: captureStream works best on an active, non-suspended element
      const playPromise = musicAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('[Music] Play started, capturing stream...');
          // Slight delay to ensure the browser has initialized the audio tracks
          setTimeout(() => {
            if (musicAudioRef.current) {
              // @ts-ignore
              const stream = musicAudioRef.current.captureStream?.() || musicAudioRef.current.mozCaptureStream?.();
              if (stream && stream.getAudioTracks().length > 0) {
                setMusicStream(stream);
                console.log('[Music] Stream captured successfully');
              } else {
                console.warn('[Music] Capture returned empty stream, retrying...');
              }
            }
          }, 200);
        }).catch(e => {
          console.warn('[Music] Play failed:', e);
          toast({ variant: 'destructive', title: 'Playback Failed', description: 'Please interact with the page to allow audio.' });
        });
      }
    }
  };

  const extraSeats = useMemo(() => {
    const count = (room.maxActiveMics || 9) - 1;
    return Array.from({ length: count }, (_, i) => i + 2);
  }, [room.maxActiveMics]);

  const chatConfig = useMemo(() => {
    const mics = room.maxActiveMics || 9;
    if (mics === 5) return { height: 'h-80', padding: 'pb-80' };
    if (mics === 13) return { height: 'h-48', padding: 'pb-48' };
    return { height: 'h-64', padding: 'pb-64' }; // Default 9 seats
  }, [room.maxActiveMics]);

  return (
    <div className="relative flex flex-col h-[100dvh] w-full max-w-[500px] mx-auto bg-black overflow-hidden text-white font-headline shadow-[0_0_100px_rgba(0,0,0,0.8)] border-x border-white/5">
      <DailyRewardDialog />
      <ExitRoomDialog 
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onMinimize={handleMinimize}
        onConfirmExit={handleExit}
      />
      <GiftAnimationOverlay 
        giftId={activeGiftSync?.id || null} 
        senderName={activeGiftSync?.senderName}
        onComplete={() => setActiveGiftSync(null)} 
      />
      <LuckyRainOverlay active={isLuckyRainActive} onComplete={() => setIsLuckyRainActive(false)} />
      
       <audio 
        ref={musicAudioRef} 
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }} 
        crossOrigin="anonymous" 
       />

      {/* LIVE BACKGROUND OVERLAY */}
      <LiveBackground themeId={activeLiveTheme} />

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

      {/* SOUNDBOARD OVERLAY */}
      {showSoundboard && (
        <div className="fixed inset-x-0 bottom-24 px-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
           <RoomSoundboard onTrigger={handleSfxTrigger} />
        </div>
      )}

      <header className="relative z-50 flex items-center justify-between p-3 pt-10 px-4 shrink-0 w-full">
        <div className="flex items-center gap-2 max-w-[70%] min-w-0">
          <div 
            onClick={() => setIsRoomInfoOpen(true)}
            className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
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
          <button onClick={() => setShowExitDialog(true)} className="p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Power className="h-4 w-4" /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col pt-0 overflow-hidden w-full">
        {/* SEATS SECTION (Point 4) - Fixed height for consistency */}
        <div className="shrink-0 flex flex-col items-center justify-start gap-3 pt-2 w-full">
           <div className="w-full flex justify-center px-6 mb-1">
              <div className="w-1/4 max-w-[90px]">
                 <Seat index={1} label="No.1" theme={currentTheme} occupant={participants.find(p => p.seatIndex === 1)} isLocked={room.lockedSeats?.includes(1)} onClick={handleSeatClick} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} isSpeaking={isSpeaking} intensity={intensity} />
              </div>
           </div>
           
           <div className="w-full grid grid-cols-4 gap-1.5 px-4">
              {extraSeats.map(idx => (
                <Seat key={idx} index={idx} label={`No.${idx}`} theme={currentTheme} occupant={participants.find(p => p.seatIndex === idx)} isLocked={room.lockedSeats?.includes(idx)} onClick={handleSeatClick} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} isSpeaking={isSpeaking} intensity={intensity} />
              ))}
           </div>
        </div>

        {/* CHAT & ANNOUNCEMENT SECTION (Wafa-Style) - Starts immediately below seats */}
        <div className="flex-1 w-full overflow-hidden mt-4 relative">
           <ScrollArea className="flex-1 w-full max-w-[75%] px-3">
              <div className="flex flex-col gap-1.5 py-2 justify-start min-h-full pb-32">
                 {/* PREMIUM SYSTEM ANNOUNCEMENT BANNER - TRANSPARENT & NORMAL FONT (Wafa-style) */}
                 {(globalConfig?.globalAnnouncement || room.announcement) && 
                  (!(room as any).chatClearedAt || ((room as any).chatClearedAt?.toDate?.() || 0) < sessionJoinTime) && (
                   <div className="flex flex-col gap-1 mb-4 px-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-700">
                     <div className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
                       <div className="space-y-4">
                         {globalConfig?.globalAnnouncement && (
                           <div className="flex items-start gap-2.5">
                             <div className="mt-1 bg-red-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter shrink-0 flex items-center gap-0.5">
                               <Zap className="h-2 w-2 fill-current" />
                               OFFICIAL
                             </div>
                             <p className="text-[12px] font-normal text-white/90 leading-snug tracking-tight">
                               {globalConfig.globalAnnouncement}
                             </p>
                           </div>
                         )}
                         
                         <div className={cn("flex items-start gap-2.5 pt-2", globalConfig?.globalAnnouncement && "border-t border-white/5")}>
                            <div className="mt-1 bg-yellow-500 text-black text-[7px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter shrink-0">
                              INFO
                            </div>
                            <p className="text-[12px] font-normal text-white/90 leading-snug tracking-tight">
                               {room.announcement || "Welcome to the tribe!"}
                            </p>
                         </div>

                         {/* PERSISTENT AI GUIDE BANNER */}
                         <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                            <div className="mt-1 bg-primary text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter shrink-0 flex items-center gap-0.5">
                              <Sparkles className="h-2 w-2 fill-current" />
                              UMMY AI
                            </div>
                            <p className="text-[11px] font-medium text-primary leading-snug tracking-tight italic">
                               Hey! Main Ummy AI hoon, koi bhi sawal ho toh zaroor pucho! 💖✨
                            </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* SYSTEM MESSAGES AT THE TOP (Wafa-style, e.g., "Cleared chat") */}
                 {firestoreMessages?.filter(m => m.type === 'system').map((msg: any) => (
                   <div key={msg.id} className="flex justify-center w-full px-4 mb-2 animate-in fade-in slide-in-from-top-1 duration-500">
                     <div className="bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5">
                        <p className="text-[10px] font-normal text-white/50 text-center tracking-tight leading-none">
                          {msg.content}
                        </p>
                     </div>
                   </div>
                 ))}

                 {/* NORMAL CHAT MESSAGES */}
                 {firestoreMessages?.filter(m => m.type !== 'system').map((msg: any) => {
                    const isMe = msg.senderId === currentUser?.uid;
                    return (
                      <div 
                        key={msg.id || Math.random().toString()} 
                        onClick={() => {
                          if (msg.senderId) {
                            setSelectedParticipantUid(msg.senderId);
                            setIsUserProfileCardOpen(true);
                          }
                        }}
                        className={cn(
                          "flex items-start gap-1.5 animate-in fade-in slide-in-from-left-2 mb-1.5 cursor-pointer active:scale-95 transition-all pointer-events-auto self-start flex-row w-full"
                        )}
                      >
                        <Avatar className="h-6 w-6 shrink-0 border border-white/10 shadow-lg mt-1">
                          <AvatarImage src={msg.senderAvatar || undefined} />
                          <AvatarFallback className="text-[10px]">{(msg.senderName || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex flex-col items-start min-w-0">
                           <span className={cn("text-[9px] font-black uppercase tracking-tighter leading-none mb-1 px-1", isMe ? "text-primary" : "text-white/40")}>
                             {msg.senderName || 'Tribe Member'}
                           </span>
                           
                           <ChatMessageBubble bubbleId={msg.senderBubble} isMe={isMe} className="text-[11px] leading-snug py-1">
                             {msg.imageUrl && (
                               <div 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setPreviewImage(msg.imageUrl);
                                 }}
                                 className="mt-1 mb-1 relative aspect-square w-40 rounded-lg overflow-hidden border border-white/10 group-hover:scale-[1.02] transition-transform"
                               >
                                 <Image src={msg.imageUrl} fill className="object-cover" alt="Sent vibe" unoptimized />
                               </div>
                             )}
                             {msg.content && <p className="break-words py-0.5">{msg.content}</p>}
                           </ChatMessageBubble>
                        </div>
                      </div>
                    );
                 })}
                 <div ref={messagesEndRef} className="h-0 w-0" />
              </div>
           </ScrollArea>
        </div>
      </main>

      <footer className="relative z-50 px-6 pb-12 flex items-center justify-between pt-6">
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
      </footer>

      {showInput && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end p-4 pb-12 font-headline pointer-events-none">
           <div 
             className="absolute inset-0 bg-black/5 pointer-events-auto" 
             onClick={() => setShowInput(false)} 
           />
           <div className="relative z-10 bg-slate-900/40 backdrop-blur-2xl rounded-full p-2.5 px-3 flex items-center gap-3 animate-in slide-in-from-bottom-5 border border-white/10 pointer-events-auto shadow-2xl mx-2">
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
                className="bg-white/10 text-white h-11 w-11 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 border border-white/5"
              >
                 {isUploadingImage ? <Loader className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5 opacity-70" />}
              </button>
              <form className="flex-1 flex items-center gap-2" onSubmit={(e: React.FormEvent) => { handleSendMessage(e); setShowInput(false); }}>
                 <input 
                   autoFocus 
                   value={messageText} 
                   onChange={(e) => setMessageText(e.target.value)} 
                   className="flex-1 bg-transparent border-none focus:ring-0 px-1 text-white text-[13px] placeholder:text-white/30" 
                   placeholder="Type a message..." 
                 />
                 <button type="submit" className="bg-primary hover:bg-primary/90 text-black h-11 w-11 rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0 shadow-lg">
                    <Mail className="h-5 w-5" />
                 </button>
              </form>
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
            className="absolute top-12 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-[410] active:scale-90 transition-transform"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Toolbar inside preview */}
          <div className="absolute bottom-12 flex items-center gap-4 z-[410]">
            <button 
              onClick={() => setIsGiftPickerOpen(true)}
              className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 active:scale-90 transition-transform"
            >
              <GiftIcon className="h-5 w-5" />
            </button>

            {/* SOUNDBOARD TRIGGER */}
            {currentUserParticipant?.seatIndex !== undefined && (
              <button 
                onClick={() => setShowSoundboard(!showSoundboard)}
                className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-primary active:scale-90 transition-transform"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            )}

            {/* LIVE THEME SELECTOR (PREMIUM) */}
            {userProfile?.isAdmin && (
              <button 
                onClick={() => {
                  const themes: any[] = ['galaxy', 'stars', 'love', 'rain', 'none'];
                  const next = themes[(themes.indexOf(activeLiveTheme) + 1) % themes.length];
                  setActiveLiveTheme(next);
                }}
                className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 active:scale-90 transition-transform"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
            )}
          </div>

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
      <RoomInfoDialog 
        open={isRoomInfoOpen} 
        onOpenChange={setIsRoomInfoOpen} 
        room={room} 
        isOwner={isOwner} 
        isAdmin={canManageRoom} 
      />
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
      <RoomGamesDialog 
        open={isRoomGamesOpen} 
        onOpenChange={setIsRoomGamesOpen} 
        onSelectGame={(slug) => {
          if (['ludo', 'carrom', 'chess'].includes(slug)) {
            // Standalone Games: Navigate to full page with roomId and minimize room
            setMinimizedRoom(room);
            setActiveRoom(null);
            router.push(`/games/${slug}?roomId=${room.id}`);
          } else {
            // Overlay Games: Show in-room overlay
            setActiveGameSlug(slug);
          }
          setIsRoomGamesOpen(false);
        }}
      />
      <RoomGameOverlay 
        activeGame={activeGameSlug} 
        onClose={() => setActiveGameSlug(null)} 
      />
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
        currentUserName={userProfile?.username}
        currentUserAvatarUrl={userProfile?.avatarUrl}
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
