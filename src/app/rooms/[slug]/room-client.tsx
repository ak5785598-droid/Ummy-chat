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
import { VipBadge } from '@/components/vip-badge';
import { MountOverlay, MountEntry } from '@/components/mount-overlay';
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
import { ref, uploadBytes, getDownloadURL, getBytes } from 'firebase/storage';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { getUmmyAIResponse } from '@/actions/ai-actions';
import { RocketDialog } from '@/components/rocket-dialog';
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
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { RoomSeatMenuDialog } from '@/components/room-seat-menu-dialog';
import { RoomAudienceInviteDialog } from '@/components/room-audience-invite-dialog';
import { RoomMicInviteDialog } from '@/components/room-mic-invite-dialog';
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
import { memo, useCallback } from 'react';

// RemoteAudio shifted to ActiveRoomManager

const Seat = memo(({
  index,
  occupant,
  onClick,
  label,
  isLocked,
  isSeatMuted,
  roomOwnerId,
  roomModeratorIds = [],
  theme
}: {
  index: number;
  occupant?: RoomParticipant;
  onClick: (index: number, occupant?: RoomParticipant) => void;
  label: string;
  isLocked?: boolean;
  isSeatMuted?: boolean;
  roomOwnerId: string;
  roomModeratorIds: string[];
  theme: any;
}) => {
  const { user } = useUser();
  const { isSpeaking, intensity } = useVoiceActivityContext();
  const currentUser = user;
  const isOccupantOwner = occupant?.uid === roomOwnerId;
  const isOccupantAdmin = roomModeratorIds.includes(occupant?.uid || '');
  const vipLevel = (occupant as any)?.vipLevel || 0;

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-[65px]">
      <div className="relative">
        <EmojiReactionOverlay emoji={occupant?.activeEmoji} size="sm" />

        {occupant && occupant.uid === currentUser?.uid && !occupant.isMuted && (
          <VoiceWaveIndicator
            isSpeaking={isSpeaking}
            intensity={intensity}
            accentColor={theme.accentColor}
          />
        )}

        <AvatarFrame
          frameId={occupant?.activeFrame}
          size="md"
          badgeType={null}
        >
          <div className="relative p-1 rounded-full overflow-visible">
            <button
              onClick={() => onClick(index, occupant)}
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center border active:scale-90 transition-all relative z-10",
                isLocked ? "border-red-500/60" : "border-white/20"
              )}
              style={{ backgroundColor: theme.seatColor || 'rgba(255, 255, 255, 0.1)' }}
            >
              {occupant ? (
                <div className={cn("h-full w-full transition-opacity duration-300", occupant.activeEmoji ? "opacity-0" : "opacity-100")}>
                  <Avatar className="h-full w-full p-0.5">
                    <AvatarImage
                      src={occupant.avatarUrl || undefined}
                      className="image-render-crisp brightness-110 contrast-110 saturate-110"
                      style={{ imageRendering: 'auto' }}
                    />
                    <AvatarFallback>{(occupant.name || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              ) : isLocked ? (
                <Lock className="h-3.5 w-3.5 text-red-500/60" />
              ) : (
                <div className="rounded-full h-7 w-7 flex items-center justify-center">
                  <Armchair className="text-white/30 h-3.5 w-3.5" />
                </div>
              )}
            </button>
          </div>
        </AvatarFrame>
        {/* Seat Mute / User Mute Badge - Small Red Button Style */}
        {(occupant?.isMuted || isSeatMuted) && (
          <div className={cn(
            "absolute -bottom-1 -right-1 z-30 h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-xl",
            isSeatMuted ? "bg-red-600 animate-pulse" : "bg-red-500"
          )}>
            <MicOff className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Wafa-style Float Name & Seat Badge (Minimal Zero-Box) */}
      <div className="mt-1.5 w-full flex flex-col items-center overflow-visible">
        <div className="flex items-center gap-1 max-w-full justify-center">
          {occupant && (
            <div
              className={cn(
                "h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 border border-white/20",
                index % 2 === 0 ? "bg-pink-500" : "bg-blue-500"
              )}
            >
              <span className="text-[7px] font-semibold text-white leading-none">{index}</span>
            </div>
          )}
          <span className="text-[10px] font-semibold text-white uppercase truncate max-w-[85px] leading-tight text-center tracking-tight">
            {occupant ? occupant.name : label}
          </span>
        </div>
      </div>
    </div>
  );
});

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
  const [isAudienceInviteOpen, setIsAudienceInviteOpen] = useState(false);
  const [isRocketOpen, setIsRocketOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showMicInviteDialog, setShowMicInviteDialog] = useState(false);
  const [micInviteData, setMicInviteData] = useState<{ inviterName: string; inviterAvatar?: string; targetSeatIndex: number } | null>(null);
  const [activeGameSlug, setActiveGameSlug] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const [sessionJoinTime] = useState(() => new Date());
  const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
  const [mountEntries, setMountEntries] = useState<MountEntry[]>([]);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [initialChatRecipient, setInitialChatRecipient] = useState<any>(null);
  const [activeGiftSync, setActiveGiftSync] = useState<{ id: string, senderName: string } | null>(null);
  const [isMutedLocal, setIsMutedLocal] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [isLuckyRainActive, setIsLuckyRainActive] = useState(false);

  // Silent audio ref for unlocking browser autoplay policy
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // AUTO-UNLOCK: Play silent audio on mount to unlock browser audio context
  // This allows subsequent music to auto-play without user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create a silent audio element
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
    silentAudioRef.current = silentAudio;
    
    // Try to play immediately (will likely fail due to autoplay policy)
    const attemptSilentPlay = async () => {
      try {
        await silentAudio.play();
        console.log('[AutoUnlock] Silent audio played - audio context unlocked');
        setUserInteracted(true);
      } catch (e) {
        console.log('[AutoUnlock] Silent play blocked, will retry on interaction');
      }
    };
    
    attemptSilentPlay();
    
    // Also set up interaction listeners as fallback
    const unlockOnInteraction = async () => {
      if (!silentAudioRef.current) return;
      try {
        await silentAudioRef.current.play();
        console.log('[AutoUnlock] Audio unlocked via user interaction');
        setUserInteracted(true);
      } catch (e) {
        // Ignore errors
      }
    };
    
    document.addEventListener('click', unlockOnInteraction, { once: true });
    document.addEventListener('touchstart', unlockOnInteraction, { once: true });
    document.addEventListener('keydown', unlockOnInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', unlockOnInteraction);
      document.removeEventListener('touchstart', unlockOnInteraction);
      document.removeEventListener('keydown', unlockOnInteraction);
    };
  }, []);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAIVoiceEnabled, setIsAIVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ummy_ai_voice_enabled') === 'true';
    }
    return false;
  });
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // SYNC: Initialize standard user hook
  const { user: currentUser } = useUser();

  // DYNAMIC LEVELING SYNC
  useActivityTracker(room?.id, currentUser?.uid || null);

  // --- DEFENSIVE GUARD: If room is not yet fully available, show loader ---
  if (!room || !room.id) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <Loader className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const {
    setActiveRoom,
    setIsMinimized,
    setMinimizedRoom,
    musicStream,
    setMusicStream,
    isMusicEnabled
  } = useRoomContext();
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedId = useRef<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const storage = useStorage();

  // SYNC: Ref to track welcomed users to prevent duplication (10-second window)
  const welcomedUsersRef = useRef<Set<string>>(new Set());
  const cleanupWelcomesRef = useRef<NodeJS.Timeout | null>(null);

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

  // Prevent crash on missing maxActiveMics
  const maxMics = room?.maxActiveMics || 9;

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

  // HEARTBEAT: Update lastSeen every 30 seconds to stay online in room count
  useEffect(() => {
    if (!firestore || !room.id || !currentUser?.uid) return;
    
    const updateHeartbeat = () => {
      const pRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
      updateDocumentNonBlocking(pRef, { 
        lastSeen: serverTimestamp(),
        name: userProfile?.username || currentUser.displayName || 'User',
        avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || '',
      });
    };
    
    // Update immediately on mount
    updateHeartbeat();
    
    // Then every 30 seconds
    const heartbeat = setInterval(updateHeartbeat, 30000);
    return () => clearInterval(heartbeat);
  }, [firestore, room.id, currentUser?.uid, currentUser?.displayName, currentUser?.photoURL, userProfile?.username, userProfile?.avatarUrl]);

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id]);

  const { data: participantsData } = useCollection<RoomParticipant>(participantsQuery);

  const participants = useMemo(() => {
    if (!participantsData) return [];
    
    // Show ALL participants from Firestore - no filtering
    // This ensures everyone in the room is visible
    return participantsData;
  }, [participantsData]);

  // DEBUG: Log participants data changes with full details
  useEffect(() => {
    console.log('[OnlineCount] Raw participantsData:', participantsData?.length || 0);
    console.log('[OnlineCount] Filtered participants:', participants.length);
    if (participantsData) {
      console.log('[OnlineCount] All users:', participantsData.map(p => ({ 
        uid: p.uid, 
        name: p.name, 
        seat: p.seatIndex,
        lastSeen: (p as any).lastSeen ? 'yes' : 'no'
      })));
    }
  }, [participantsData, participants]);

  const onlineCount = useMemo(() => {
    // Use filtered participants count (not raw participantsData)
    // This ensures only active users are counted
    return participants.length || 0;
  }, [participants]);
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

  // AI MODERATION ACTIONS (GRAND MANAGER)
  const handleAIClearChat = async () => {
    if (!firestore || !room.id || !canManageRoom) return;
    try {
      // PERSISTENT CLEAN: Update room document to hide historical messages
      await updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
        chatClearedAt: serverTimestamp()
      });
      toast({ title: 'AI: Chat Cleared ✨🧹' });
    } catch (e) { console.error(e); }
  };

  const handleAILockSeat = async (index: number) => {
    if (!firestore || !room.id || !canManageRoom) return;
    const isCurrentlyLocked = room.lockedSeats?.includes(index);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
      lockedSeats: isCurrentlyLocked ? arrayRemove(index) : arrayUnion(index)
    });
  };

  const handleAIOpenGame = (slug: string) => {
    const validSlugs = ['carrom', 'chess', 'ludo'];
    const lowerSlug = slug.toLowerCase();
    const target = validSlugs.find(s => lowerSlug.includes(s));
    if (target) {
      setActiveGameSlug(target);
      setIsRoomGamesOpen(false);
    }
  };

  const handleAIOpenMusic = () => {
    setIsRoomPlayOpen(true);
    toast({ title: 'AI: Opening Music Player 🎵✨' });
  };

  // AI VOICE ENGINE (TTS)
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoicesLoaded(true);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const speakAIText = (text: string) => {
    if (!isAIVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // VOICE WARM-UP: Ensure we clear old tasks before speaking
    window.speechSynthesis.cancel();
    setIsAISpeaking(true);

    const cleanText = text.replace(/\[CMD:.*?\]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF])/g, '');

    // DYNAMIC LANGUAGE DETECTION: Robust regex for Devanagari (Hindi/Sanskrit)
    const hasHindi = /[\u0900-\u097F]/.test(cleanText);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pre-set language to guide the voice selection engine
    utterance.lang = hasHindi ? 'hi-IN' : 'en-US';

    const voices = window.speechSynthesis.getVoices();

    // NATIVE-SYNC VOICE SELECTION: Prioritize high-quality local voices
    let preferredVoice;
    if (hasHindi) {
      // Priority: Hindi (India) -> English (India) fallback
      preferredVoice = voices.find(v => v.lang === 'hi-IN') ||
        voices.find(v => v.lang.includes('hi')) ||
        voices.find(v => v.lang.includes('en-IN')) ||
        voices[0];
    } else {
      // Priority: English (US) -> English (UK) -> Any English
      preferredVoice = voices.find(v => v.lang === 'en-US' && v.localService) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.includes('en-GB')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.pitch = 1.05;
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = (e) => {
      console.warn('[AI-Voice] Utterance Error:', e);
      setIsAISpeaking(false);
    };

    // BROWSER HANDSHAKE: Small delay ensures the engine is ready after cancel()
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // AI VOICE INTERACTION (STT)
  const [isAIListening, setIsAIListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleAIListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Voice Recognition not supported on this device' });
      return;
    }

    if (isAIListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = true; // QUICK RESPONSE: Provide live feedback
    recognition.continuous = false; // ONE-SHOT: respond as soon as speaking stops
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsAIListening(true);
      // HAPTIC SYNC: Subtle vibration for tactile feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      toast({ title: 'AI Sun rahi hai...', description: 'Aap bol sakte hain! 🎙️' });
    };

    recognition.onresult = async (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        toast({ title: `You said: ${finalTranscript}`, description: 'Sending to AI...' });
        await handleSendMessage(undefined, undefined, finalTranscript);
        recognition.stop(); // FORCE RESET: prevent hanging states
      }
    };

    recognition.onerror = (err: any) => {
      console.error('[AI-STT] Recognition Error:', err);
      setIsAIListening(false);
    };

    recognition.onend = () => {
      setIsAIListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleAIVoice = () => {
    const nextValue = !isAIVoiceEnabled;
    setIsAIVoiceEnabled(nextValue);
    localStorage.setItem('ummy_ai_voice_enabled', String(nextValue));

    // BROWSER HANDSHAKE: Prime the engine on first interaction
    if (nextValue) {
      const warmUp = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(warmUp);
      speakAIText("Ummy AI Voice enabled! Main ab bol kar bhi aapki madad karungi! 💖");
    } else {
      window.speechSynthesis.cancel();
      toast({ title: 'AI Voice Disabled' });
    }
  };

  // Throttle ref for message processing
  const messageProcessTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // GIFT & EVENT SYNC ENGINE - OPTIMIZED with throttling
  useEffect(() => {
    if (!firestoreMessages || firestoreMessages.length === 0) return;

    // Clear existing timeout to throttle processing
    if (messageProcessTimeoutRef.current) {
      clearTimeout(messageProcessTimeoutRef.current);
    }

    messageProcessTimeoutRef.current = setTimeout(() => {
      // GLOBAL AI LEADERSHIP ELECTION V5 (ROBUST):
      const onlineMods = participantsData?.filter(p => room.moderatorIds?.includes(p.uid)).sort((a, b) => a.uid.localeCompare(b.uid)) || [];
      const sortedParticipants = [...(participantsData || [])].sort((a, b) => a.uid.localeCompare(b.uid));
      const ownerOnline = participantsData?.some(p => p.uid === room.ownerId);

      let electedLeaderUid = sortedParticipants[0]?.uid;
      if (ownerOnline) electedLeaderUid = room.ownerId;
      else if (onlineMods.length > 0) electedLeaderUid = onlineMods[0].uid;

      const isAIProcessor = currentUser?.uid === electedLeaderUid;

      // Identify the starting point for the new delta
      const startIndex = lastProcessedId.current
        ? firestoreMessages.findIndex(m => m.id === lastProcessedId.current) + 1
        : 0;

      const newBatch = firestoreMessages.slice(startIndex);

      // Process in smaller chunks to prevent blocking
      const processChunk = (batch: any[], chunkSize = 5) => {
        for (let i = 0; i < batch.length; i += chunkSize) {
          const chunk = batch.slice(i, i + chunkSize);
          requestAnimationFrame(() => {
            chunk.forEach(msg => {
              if (msg.type === 'gift' && msg.giftId) {
                setActiveGiftSync({ id: msg.giftId, senderName: msg.senderName });
              } else if (msg.type === 'lucky-rain') {
                setIsLuckyRainActive(true);
              } else if (msg.type === 'entrance' && isAIProcessor) {
                // Defer welcome to not block UI
                requestIdleCallback?.(() => handleAIWelcome(msg.senderName)) || setTimeout(() => handleAIWelcome(msg.senderName), 0);
              } else if (msg.type === 'emoji' && (msg as any).isSfx) {
                playLocalSfx((msg as any).sfxId);
              } else if (msg.type === 'text' && msg.senderId !== 'SYSTEM_BOT' && isAIProcessor) {
                // Defer AI processing to not block UI
                requestIdleCallback?.(() => handleAIEngine(msg)) || setTimeout(() => handleAIEngine(msg), 0);
              } else if (msg.type === 'mic_invite' && msg.targetUid === currentUser?.uid) {
                // Show invitation dialog to the invited user
                setMicInviteData({
                  inviterName: msg.inviterName,
                  inviterAvatar: msg.inviterAvatar,
                  targetSeatIndex: msg.targetSeatIndex
                });
                setShowMicInviteDialog(true);
                // Haptic feedback
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate([50, 100, 50]);
                }
              }

              // VOICE SYNC: Trigger local TTS if it's an AI message
              if (msg.senderId === 'SYSTEM_BOT') {
                speakAIText(msg.content);
              }
            });
          });
        }
      };

      processChunk(newBatch);

      if (newBatch.length > 0) {
        lastProcessedId.current = firestoreMessages[firestoreMessages.length - 1].id;
      }
    }, 100); // 100ms throttle

    return () => {
      if (messageProcessTimeoutRef.current) {
        clearTimeout(messageProcessTimeoutRef.current);
      }
    };
  }, [firestoreMessages, currentUser?.uid, canManageRoom, room.ownerId, participantsData]);

  // --- ROOM ROCKET SYSTEM ENGINE (Wafa/Haza Style) ---
  useEffect(() => {
    if (!firestore || !room.id) return;
    
    // 1. LEADERSHIP SYNC: Only the elected AI Processor handles rocket state shifts
    const sortedParticipants = [...(participantsData || [])].sort((a, b) => a.uid.localeCompare(b.uid));
    const ownerOnline = participantsData?.some(p => p.uid === room.ownerId);
    let electedLeaderUid = sortedParticipants[0]?.uid;
    if (ownerOnline) electedLeaderUid = room.ownerId;
    const isAIProcessor = currentUser?.uid === electedLeaderUid;

    if (!isAIProcessor) return;

    const rocket = room.rocket || { progress: 0, target: 10000, countdownUntil: null };
    const now = Date.now();

    // TRIGGER 1: Start Countdown when goal reached
    if (rocket.progress >= rocket.target && !rocket.countdownUntil) {
      console.log('[Rocket] Goal reached! Starting 60s countdown...');
      const launchTime = new Date(now + 60000);
      updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
        'rocket.countdownUntil': Timestamp.fromDate(launchTime)
      });
    }

    // TRIGGER 2: Launch Rocket when countdown finishes
    if (rocket.countdownUntil) {
      const launchTime = rocket.countdownUntil.toDate().getTime();
      if (now >= launchTime) {
        console.log('[Rocket] Launching! Firing Lucky Rain...');
        
        // Dispatch Lucky Rain Message
        const msgRef = doc(collection(firestore, 'chatRooms', room.id, 'messages'));
        setDocumentNonBlocking(msgRef, {
          type: 'lucky-rain',
          content: '🚀 ROOM ROCKET LAUNCHED! COLLECT YOUR REWARDS! 💰✨',
          senderId: 'SYSTEM_BOT',
          senderName: 'Ummy AI',
          senderAvatar: 'https://img.icons8.com/isometric/512/rocket.png',
          timestamp: serverTimestamp()
        }, { merge: true });

        // Reset Rocket State
        updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
          'rocket.progress': 0,
          'rocket.countdownUntil': null
        });
      }
    }
  }, [room.rocket, participantsData, currentUser?.uid, room.ownerId, firestore, room.id]);

  // CHAT AUTO-SCROLL LOGIC - REMOVED DUPLICATE IN FAVOR OF LINE 365

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

    // 2. CONVERSATIONAL AI (LLM Trigger: 'AI' or 'Ummy' - Master Brain Override)
    // Use word boundaries to prevent false positives (e.g., "hai" contains "ai" but shouldn't trigger)
    const triggerWords = ['ai', 'ummy', 'ummi', 'आई', 'अई', 'एआई', 'ummy ai', 'help', 'madad', 'हेल्प', 'मदद', 'उम्मी', 'umm'];
    const isTriggered = triggerWords.some(t => {
      // Check for word boundaries - word should be standalone or at start/end of message
      const wordBoundaryPattern = new RegExp(`(^|\\s)${t}($|\\s|[.,!?])`, 'i');
      return wordBoundaryPattern.test(content) || content.startsWith(t + ' ') || content.endsWith(' ' + t) || content === t;
    });

    if (isTriggered) {
      // PROCESSING LOCK: Add flag to firestore message to signal processing has started
      try {
        const msgRef = doc(firestore, 'chatRooms', room.id, 'messages', msg.id);
        await updateDocumentNonBlocking(msgRef, { _processing_ai: true });

        const aiResponse = await getUmmyAIResponse(msg.content, msg.senderName);
        const upperResponse = aiResponse.toUpperCase();

        // COMMAND PARSER: Execute moderation actions detected in AI response
        const isAdminAction = room.ownerId === msg.senderId || room.moderatorIds?.includes(msg.senderId);

        if (upperResponse.includes('[CMD:CLEAN]')) {
          if (isAdminAction) {
            handleAIClearChat();
            toast({ title: 'Sovereign Master', description: 'Purifying chat stream...' });
          }
        } else if (upperResponse.includes('[CMD:MUTE:')) {
          const username = aiResponse.match(/\[CMD:MUTE:(.*?)\]/i)?.[1];
          if (username && isAdminAction) {
            const target = participants.find(p => p.name?.toLowerCase() === username.toLowerCase());
            if (target) {
              handleSilence(target.uid, false);
              toast({ title: 'Sovereign Master', description: `Silence enforced on ${username}.` });
            }
          }
        } else if (upperResponse.includes('[CMD:UNMUTE:')) {
          const username = aiResponse.match(/\[CMD:UNMUTE:(.*?)\]/i)?.[1];
          if (username && isAdminAction) {
            const target = participants.find(p => p.name?.toLowerCase() === username.toLowerCase());
            if (target) {
              handleSilence(target.uid, true);
              toast({ title: 'Sovereign Master', description: `Voice restored to ${username}.` });
            }
          }
        } else if (upperResponse.includes('[CMD:KICK:')) {
          const username = aiResponse.match(/\[CMD:KICK:(.*?)\]/i)?.[1];
          if (username && isAdminAction) {
            const target = participants.find(p => p.name?.toLowerCase() === username.toLowerCase());
            if (target) {
              handleKick(target.uid, 60);
              toast({ title: 'Sovereign Master', description: `${username} has been banished.` });
            }
          }
        } else if (upperResponse.includes('[CMD:LOCK:')) {
          const seatNum = aiResponse.match(/\[CMD:LOCK:(\d+)\]/i)?.[1];
          if (seatNum && isAdminAction) {
            const index = parseInt(seatNum);
            if (!room.lockedSeats?.includes(index)) {
              handleAILockSeat(index);
              toast({ title: 'Sovereign Master', description: `Seat ${index + 1} secured.` });
            }
          }
        } else if (upperResponse.includes('[CMD:UNLOCK:')) {
          const seatNum = aiResponse.match(/\[CMD:UNLOCK:(\d+)\]/i)?.[1];
          if (seatNum && isAdminAction) {
            const index = parseInt(seatNum);
            if (room.lockedSeats?.includes(index)) {
              handleAILockSeat(index);
              toast({ title: 'Sovereign Master', description: `Seat ${index + 1} released.` });
            }
          }
        } else if (upperResponse.includes('[CMD:GAME:')) {
          const slug = aiResponse.match(/\[CMD:GAME:(.*?)\]/i)?.[1];
          if (slug) {
            handleAIOpenGame(slug);
            toast({ title: 'Sovereign Master', description: `Initializing ${slug} frequency...` });
          }
        } else if (upperResponse.includes('[CMD:MUSIC:OPEN]')) {
          if (isAdminAction) {
            handleAIOpenMusic();
            toast({ title: 'Sovereign Master', description: 'Synchronizing music hub...' });
          }
        }

        // Post the AI response to Firestore
        const responseMsgRef = doc(collection(firestore, 'chatRooms', room.id, 'messages'));
        await setDocumentNonBlocking(responseMsgRef, {
          content: aiResponse,
          senderId: 'SYSTEM_BOT',
          senderName: 'Ummy AI',
          senderAvatar: 'https://img.icons8.com/isometric/512/bot.png',
          type: 'text',
          timestamp: serverTimestamp(),
          processed: true
        }, { merge: true });
        return; // EXIT: We handled it with the Master Brain
      } catch (error) {
        console.error("AI Processing Error:", error);
        const msgRef = doc(firestore, 'chatRooms', room.id, 'messages', msg.id);
        await updateDocumentNonBlocking(msgRef, { _processing_ai: false });
      }
    }

    // SMART GUIDE removed - AI now only responds to trigger words
  };

  // REMOVED LEGACY LOCAL AUTO-WELCOME (Duplicates Fixed)

  const handleAIWelcome = async (newUserName: string) => {
    if (!firestore || !room.id || !newUserName) return;

    // GUARD: Anti-Duplication Shield (10s local cooldown per name)
    if (welcomedUsersRef.current.has(newUserName)) {
      console.log(`[AI-Guard] Suppressing duplicate welcome for: ${newUserName}`);
      return;
    }

    welcomedUsersRef.current.add(newUserName);

    // Auto-clear from memory after 10s to allow welcoming again if they re-join later
    setTimeout(() => {
      welcomedUsersRef.current.delete(newUserName);
    }, 10000);

    // AI Greeting Logic: High-Fidelity Welcome System
    const messagesRef = collection(firestore, 'chatRooms', room.id, 'messages');
    await addDocumentNonBlocking(messagesRef, {
      content: `नमस्ते ${newUserName} जी! 🙏 उम्मी चैट पर आपका तहे-दिल से स्वागत है। आपके आने से रूम की रौनक बढ़ गई है। मैं उम्मी एआई हूँ, मैं आपकी क्या सहायता कर सकती हूँ? ✨😊`,
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

  const handleSendMessage = async (e?: React.FormEvent, imageUrl?: string, transcription?: string) => {
    if (e) e.preventDefault();
    const content = transcription || messageText;
    if ((!content.trim() && !imageUrl) || !currentUser || !firestore || !userProfile) return;

    if (isChatMuted && !canManageRoom) {
      toast({ variant: 'destructive', title: 'Chat Restricted', description: 'The room authority has disabled public messages.' });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
      content: content,
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
    } catch (error: any) {
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

  const handleSeatClick = useCallback((index: number, occupant?: RoomParticipant) => {
    setSelectedSeatIdx(index);
    if (occupant) {
      setSelectedParticipantUid(occupant.uid);
      setIsUserProfileCardOpen(true);
    } else {
      setSelectedParticipantUid(null);
      setIsSeatMenuOpen(true);
    }
  }, []);

  const handleSilence = (uid: string, current: boolean) => {
    if (!firestore || !room.id) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { isSilenced: !current, isMuted: !current });
    
    // If muting this user, also stop their music
    if (!current && uid === currentUser?.uid && musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
      setIsMusicPlaying(false);
      toast({ title: 'Music Stopped', description: 'Admin has muted you' });
    }
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

  const handleTakeSeat = (seatIndex: number) => {
    if (!firestore || !room.id || !currentUser?.uid) return;
    
    const isSeatMuted = room.mutedSeats?.includes(seatIndex) || false;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    setDocumentNonBlocking(participantRef, {
      seatIndex: seatIndex,
      isMuted: isSeatMuted, // Auto-mute if seat is muted
      name: userProfile?.username || currentUser.displayName || 'Tribe Member',
      avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || null,
      uid: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    toast({ 
      title: 'Seat Taken', 
      description: isSeatMuted ? `Seat #${seatIndex} is muted. Unmute to speak.` : `You are now on mic at seat #${seatIndex}` 
    });
  };

  const handleToggleSeatMute = (seatIdx: number, currentMuted: boolean) => {
    if (!firestore || !room.id) return;
    
    const roomRef = doc(firestore, 'chatRooms', room.id);
    setDocumentNonBlocking(roomRef, {
      mutedSeats: currentMuted ? arrayRemove(seatIdx) : arrayUnion(seatIdx),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    toast({ title: currentMuted ? 'Seat Unmuted' : 'Seat Muted', description: `Seat #${seatIdx} is now ${currentMuted ? 'unmuted' : 'muted'}` });
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

  // --- AUDIO BROADCAST SYNC ---
  // When this user is the one who played the music, capture the audio stream
  // and send it to the Agora music context so everyone in the room hears it.
  useEffect(() => {
    if (!musicAudioRef.current || !room?.currentMusicUrl || !room.isMusicPlaying) {
      setMusicStream(null);
      return;
    }

    // Only the user who "owns" the music session should broadcast the stream
    // to avoid multiple users broadcasting the same audio (echo)
    const isMusicOwner = room.musicUpdatedBy === currentUser?.uid;
    
    if (isMusicOwner) {
      const captureAndSendStream = () => {
        if (!musicAudioRef.current) return;
        
        try {
          // @ts-ignore
          const stream = musicAudioRef.current.captureStream?.() || musicAudioRef.current.mozCaptureStream?.();
          
          if (stream && stream.getAudioTracks().length > 0) {
            console.log('[MusicBroadcast] Captured audio stream, sending to Agora...');
            setMusicStream(stream);
          } else {
            console.warn('[MusicBroadcast] Stream captured but no audio tracks found');
          }
        } catch (err) {
          console.error('[MusicBroadcast] Failed to capture stream:', err);
        }
      };

      // Slight delay to ensure the audio source is loaded and playing
      const timer = setTimeout(captureAndSendStream, 1000);
      return () => clearTimeout(timer);
    } else {
      // If not the owner, ensure we aren't trying to broadcast
      setMusicStream(null);
    }
  }, [room?.currentMusicUrl, room?.isMusicPlaying, room?.musicUpdatedBy, currentUser?.uid]);

  // Listen for shared music changes from Firestore
  // AUTO-PLAY: When music is playing in room, all users should hear it
  useEffect(() => {
    if (!room?.currentMusicUrl || !musicAudioRef.current) {
      return;
    }
    
    const currentSrc = musicAudioRef.current.src;
    const newUrl = room.currentMusicUrl;
    
    // Always set the source when URL changes or on first load
    if (currentSrc !== newUrl) {
      console.log('[Music] Setting music source:', room.currentMusicTitle || 'Unknown');
      
      musicAudioRef.current.pause();
      musicAudioRef.current.src = newUrl;
      musicAudioRef.current.currentTime = room.musicCurrentTime || 0;
      musicAudioRef.current.load();
      
      // If room says music is playing, try to auto-play
      if (room.isMusicPlaying) {
        console.log('[Music] Auto-playing on source set...');
        musicAudioRef.current.play().then(() => {
          setIsMusicPlaying(true);
          console.log('[Music] Auto-play successful');
        }).catch(e => {
          console.warn('[Music] Auto-play blocked:', e.name);
          setIsMusicPlaying(false);
        });
      } else {
        setIsMusicPlaying(false);
      }
    }
  }, [room?.currentMusicUrl, room?.currentMusicTitle, room?.isMusicPlaying, room?.musicCurrentTime]);

  // Listen for room's isMusicPlaying state - SYNC ACROSS ALL USERS
  useEffect(() => {
    if (!musicAudioRef.current || !room?.currentMusicUrl) return;
    
    const roomIsPlaying = room.isMusicPlaying || false;
    const roomCurrentTime = room.musicCurrentTime || 0;
    
    // Only sync if room state is different from local state
    if (roomIsPlaying !== isMusicPlaying) {
      if (roomIsPlaying) {
        // Room says play - sync position and play
        console.log('[Music] Room says PLAY at position:', roomCurrentTime);
        
        // Sync position first
        if (Math.abs(musicAudioRef.current.currentTime - roomCurrentTime) > 2) {
          musicAudioRef.current.currentTime = roomCurrentTime;
        }
        
        // Try to play (might fail if no user interaction yet)
        musicAudioRef.current.play().then(() => {
          setIsMusicPlaying(true);
        }).catch(e => {
          console.warn('[Music] Auto-play blocked - needs user interaction:', e.name);
          // Show toast to prompt user to interact
          if (e.name === 'NotAllowedError') {
            toast({ 
              title: '🎵 Tap to Join Music', 
              description: 'Click anywhere to enable audio and hear the music!',
              duration: 5000
            });
          }
        });
      } else {
        // Room says pause
        console.log('[Music] Room says PAUSE');
        musicAudioRef.current.pause();
        setIsMusicPlaying(false);
      }
    } else if (roomIsPlaying) {
      // Both playing - sync position if drifted more than 5 seconds
      const drift = Math.abs(musicAudioRef.current.currentTime - roomCurrentTime);
      if (drift > 5) {
        console.log('[Music] Syncing position - drift:', drift);
        musicAudioRef.current.currentTime = roomCurrentTime;
      }
    }
  }, [room?.isMusicPlaying, room?.musicCurrentTime, room?.currentMusicUrl]);

  // AUDIO UNLOCK: Global click handler to enable audio context
  useEffect(() => {
    const unlockAudio = async () => {
      console.log('[AudioUnlock] Attempting to unlock audio...');
      
      if (musicAudioRef.current) {
        // Create a silent buffer to unlock AudioContext
        const audioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (audioCtx) {
          try {
            const ctx = new audioCtx();
            if (ctx.state === 'suspended') {
              await ctx.resume();
              console.log('[AudioUnlock] AudioContext resumed');
            }
            
            // Create and play silent buffer to fully unlock
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
            console.log('[AudioUnlock] Silent buffer played');
          } catch (e) {
            console.warn('[AudioUnlock] AudioContext error:', e);
          }
        }
        
        // Mark audio as ready
        if (!userInteracted) {
          setUserInteracted(true);
          console.log('[AudioUnlock] User interaction recorded');
        }
        
        // If music is playing in room, try to play locally with retry
        if (room?.isMusicPlaying && room?.currentMusicUrl) {
          console.log('[AudioUnlock] Room music is playing, attempting sync...');
          
          // Ensure source is set
          if (musicAudioRef.current.src !== room.currentMusicUrl) {
            musicAudioRef.current.src = room.currentMusicUrl;
            musicAudioRef.current.currentTime = room.musicCurrentTime || 0;
            musicAudioRef.current.load();
          }
          
          // Try to play with multiple attempts
          let attempts = 0;
          const maxAttempts = 3;
          
          const tryPlay = async () => {
            if (!musicAudioRef.current || attempts >= maxAttempts) return;
            attempts++;
            
            try {
              await musicAudioRef.current.play();
              console.log('[AudioUnlock] Music playback started successfully');
              setIsMusicPlaying(true);
            } catch (err: any) {
              console.warn(`[AudioUnlock] Play attempt ${attempts} failed:`, err.name);
              if (attempts < maxAttempts) {
                setTimeout(tryPlay, 300);
              }
            }
          };
          
          setTimeout(tryPlay, 100);
        }
      }
    };

    // Add multiple interaction listeners
    const addListeners = () => {
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('touchstart', unlockAudio, { once: true });
      document.addEventListener('keydown', unlockAudio, { once: true });
    };
    
    addListeners();
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, [room?.isMusicPlaying, room?.currentMusicUrl, room?.musicCurrentTime, userInteracted]);

  // Handle user interaction for music
  const handleUserInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true);
      console.log('[Music] User interacted, enabling audio playback');
    }
  };

  // Music control functions
  const handleToggleMusic = async () => {
    handleUserInteraction();
    if (!musicAudioRef.current || !firestore || !room.id) return;
    
    if (isMusicPlaying) {
      // Pause music
      musicAudioRef.current.pause();
      setIsMusicPlaying(false);
      
      // Sync to room - music is paused
      const roomRef = doc(firestore, 'chatRooms', room.id);
      await updateDocumentNonBlocking(roomRef, { 
        isMusicPlaying: false,
        musicCurrentTime: musicAudioRef.current.currentTime,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: 'Music Paused' });
    } else {
      // Sync to room's current time before playing
      const roomCurrentTime = room.musicCurrentTime || 0;
      if (musicAudioRef.current.currentTime < roomCurrentTime) {
        musicAudioRef.current.currentTime = roomCurrentTime;
      }
      
      // Play music
      await musicAudioRef.current.play();
      setIsMusicPlaying(true);
      
      // Sync to room - music is playing
      const roomRef = doc(firestore, 'chatRooms', room.id);
      await updateDocumentNonBlocking(roomRef, { 
        isMusicPlaying: true,
        musicCurrentTime: musicAudioRef.current.currentTime,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: 'Music Playing' });
    }
  };

  const handleStopMusic = () => {
    if (!musicAudioRef.current) return;
    musicAudioRef.current.pause();
    musicAudioRef.current.currentTime = 0;
    setIsMusicPlaying(false);
    toast({ title: 'Music Stopped' });
  };

  // Periodic sync of music position to Firestore (for owner/moderator)
  useEffect(() => {
    if (!firestore || !room.id || !canManageRoom) return;
    if (!room.currentMusicUrl || !musicAudioRef.current) return;
    
    const interval = setInterval(() => {
      if (musicAudioRef.current && isMusicPlaying) {
        const currentTime = musicAudioRef.current.currentTime;
        const roomRef = doc(firestore, 'chatRooms', room.id);
        updateDocumentNonBlocking(roomRef, { musicCurrentTime: currentTime });
      }
    }, 5000); // Sync every 5 seconds
    
    return () => clearInterval(interval);
  }, [firestore, room.id, canManageRoom, room.currentMusicUrl, isMusicPlaying]);

  // Track music progress
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setMusicCurrentTime(audio.currentTime);
      setMusicDuration(audio.duration || 0);
      setMusicProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('play', () => setIsMusicPlaying(true));
    audio.addEventListener('pause', () => setIsMusicPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('play', () => setIsMusicPlaying(true));
      audio.removeEventListener('pause', () => setIsMusicPlaying(false));
    };
  }, [room?.currentMusicUrl]);

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
      <RocketDialog
        open={isRocketOpen}
        onOpenChange={setIsRocketOpen}
        totalGifts={room.stats?.totalGifts || 0}
        roomName={room.title}
      />

      {/* AUDIO UNLOCK: Background listener - no overlay, auto-sync on interaction */}
      {room.currentMusicUrl && room.isMusicPlaying && !userInteracted && (
        <div 
          className="fixed inset-0 z-[1]"
          style={{ pointerEvents: 'none' }}
          aria-hidden="true"
        />
      )}

      <audio
        ref={musicAudioRef}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
        crossOrigin="anonymous"
        preload="auto"
        playsInline
      />

      {/* LIVE BACKGROUND OVERLAY */}
      <LiveBackground themeId={activeLiveTheme} />

      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* BASE BACKGROUND - CLEAR & VIBRANT */}
        <div className="absolute inset-0 bg-[#0A0A0A] z-[-1]" />
        <Image
          key={`${room?.roomThemeId || 'default'}`}
          src={bgUrl}
          alt="Background"
          fill
          unoptimized
          className="object-cover object-top opacity-95 animate-in fade-in duration-1000 contrast-[1.05] saturate-[1.1] brightness-[0.9]"
          priority
        />

        {/* PREMIUM UI CLARITY OVERLAYS (Vignettes) */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
      </div>

      {/* SOUNDBOARD OVERLAY */}
      {showSoundboard && (
        <div className="fixed inset-x-0 bottom-24 px-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <RoomSoundboard onTrigger={handleSfxTrigger} />
        </div>
      )}

      <header className="relative z-50 flex items-center justify-between p-3 pt-2 px-4 shrink-0 w-full">
        <div className="flex items-center gap-2 max-w-[70%] min-w-0">
          <div
            onClick={() => setIsRoomInfoOpen(true)}
            className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            <Avatar className="h-9 w-9 rounded-lg border-2 border-white/20">
              <AvatarImage src={room.coverUrl || undefined} />
              <AvatarFallback className="text-[10px]">UM</AvatarFallback>
            </Avatar>
            <Trophy className="h-4 w-4 text-yellow-500 absolute top-6 -left-5 z-20 animate-reaction-float" />

            <div className="absolute -bottom-1 -left-3.5 flex items-center gap-0.5 bg-black/80 px-1 py-0.5 rounded-full border border-white/10 z-20 scale-75">
              <Trophy className="h-2 w-2 text-yellow-400 fill-current" />
              <span className="text-[7px] font-semibold text-yellow-400 leading-none">
                {room.stats?.totalGifts?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <h1 className="font-semibold text-[16px] uppercase tracking-tighter text-white leading-none truncate max-w-[260px]">{room.title}</h1>
              <button onClick={handleFollowRoom} className={cn("h-5 w-5 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0", followData ? "bg-red-50" : "bg-[#00E676]")}>
                {followData ? <Heart className="h-3 w-3 text-white fill-current" /> : <div className="relative flex items-center justify-center"><Heart className="h-3.5 w-3.5 text-white" strokeWidth={3} /><Plus className="h-2 w-2 text-white absolute mt-0.5" strokeWidth={4} /></div>}
              </button>
            </div>
            <p className="text-[9px] font-medium text-white/60 uppercase mt-0.5 tracking-widest leading-none">ID:{room.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* AI Voice Button */}
          <div className="relative">
            <button
              onClick={toggleAIVoice}
              className={cn(
                "p-1 rounded-full active:scale-95 transition-all border border-white/5 relative z-10",
                isAIVoiceEnabled ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-white/30",
                isAISpeaking && "animate-pulse shadow-[0_0_15px_rgba(255,51,102,0.6)] border-primary"
              )}
            >
              {isAIVoiceEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-white/40" />}
            </button>
            <span className={cn(
              "absolute -top-1 -right-0.5 text-[6px] font-semibold px-0.5 rounded-sm z-20 pointer-events-none transition-colors",
              isAIVoiceEnabled ? "bg-primary text-white" : "bg-white/20 text-white/60"
            )}>AI</span>
            {isAISpeaking && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/30 z-0" />
            )}
          </div>
          <button onClick={() => setIsUserListOpen(true)} className="bg-black/60 px-1.5 py-1 rounded-full border border-white/10 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-white/60" /><span className="text-[9px] font-semibold">{onlineCount}</span></button>
          {isOwner && <RoomSettingsDialog room={room} trigger={<button className="p-1 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Hexagon className="h-4 w-4 text-white/60" /></button>} />}
          <button onClick={() => setIsShareOpen(true)} className="p-1 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Share2 className="h-4 w-4 text-white/60" /></button>
          <button onClick={() => setShowExitDialog(true)} className="p-1 bg-white/10 rounded-full active:scale-95 transition-transform border border-white/5"><Power className="h-4 w-4 text-white/60" /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col pt-0 overflow-hidden w-full">
        {/* SEATS SECTION (Point 4) - Fixed height for consistency */}
        <div className="shrink-0 flex flex-col items-center justify-start gap-3 pt-2 w-full">
          <div className="w-full flex justify-center px-6 mb-1">
            <div className="w-1/4 max-w-[90px]">
              <Seat index={1} label="No.1" theme={currentTheme} occupant={participants.find(p => p.seatIndex === 1)} isLocked={room.lockedSeats?.includes(1)} isSeatMuted={room.mutedSeats?.includes(1)} onClick={handleSeatClick} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} />
            </div>
          </div>

          <div className="w-full grid grid-cols-4 gap-1.5 px-4">
            {extraSeats.map(idx => (
              <Seat key={idx} index={idx} label={`No.${idx}`} theme={currentTheme} occupant={participants.find(p => p.seatIndex === idx)} isLocked={room.lockedSeats?.includes(idx)} isSeatMuted={room.mutedSeats?.includes(idx)} onClick={handleSeatClick} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} />
            ))}
          </div>
        </div>

        {/* CHAT & ANNOUNCEMENT SECTION (Wafa-Style) - Starts immediately below seats */}
        <div className="flex-1 w-full overflow-hidden mt-4 relative flex flex-col">
          <ScrollArea className="flex-1 w-full max-w-[75%] px-3">
            <div className="flex flex-col gap-1.5 py-2 justify-start min-h-full pb-32">
              {/* PREMIUM SYSTEM ANNOUNCEMENT BANNER - TRANSPARENT & NORMAL FONT (Wafa-style) */}
              {(globalConfig?.globalAnnouncement || room.announcement) &&
                (!(room as any).chatClearedAt || ((room as any).chatClearedAt?.toDate?.() || 0) < sessionJoinTime) && (
                  <div className="flex flex-col gap-1 mb-4 px-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-700">
                    <div className="relative overflow-hidden bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                      <div className="space-y-4">
                        {globalConfig?.globalAnnouncement && (
                          <div className="flex items-start gap-2.5">
                            <div className="mt-1 bg-red-500 text-white text-[7px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 flex items-center gap-0.5">
                              <Zap className="h-2 w-2 fill-current" />
                              OFFICIAL
                            </div>
                            <p className="text-[12px] font-normal text-white/90 leading-snug tracking-tight">
                              {globalConfig.globalAnnouncement}
                            </p>
                          </div>
                        )}

                        <div className={cn("flex items-start gap-2.5 pt-2", globalConfig?.globalAnnouncement && "border-t border-white/5")}>
                          <div className="mt-1 bg-yellow-500 text-black text-[7px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                            INFO
                          </div>
                          <p className="text-[12px] font-normal text-white/90 leading-snug tracking-tight">
                            {room.announcement || "Welcome to the tribe!"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* SYSTEM MESSAGES AT THE TOP (Wafa-style, e.g., "Cleared chat") */}
              {firestoreMessages?.filter(m => m.type === 'system').map((msg: any) => (
                <div key={msg.id} className="flex justify-center w-full px-4 mb-2 animate-in fade-in slide-in-from-top-1 duration-500">
                  <div className="bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
                    <p className="text-[10px] font-normal text-white/50 text-center tracking-tight leading-none">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* NORMAL CHAT MESSAGES - REAL-TIME SYNC WITH Clean Chat */}
              {firestoreMessages?.filter(m => {
                if (m.type === 'system') return false;
                const clearedAt = (room as any).chatClearedAt?.toDate?.() || new Date(0);
                const msgTime = (m as any).timestamp?.toDate?.() || new Date();
                return msgTime > clearedAt;
              }).map((msg: any) => {
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
                      <span className={cn("text-[9px] font-semibold uppercase tracking-tighter leading-none mb-1 px-1", isMe ? "text-primary" : "text-white/60")}>
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

      {/* MINI MUSIC PLAYER - Wafa Style */}
      {room.currentMusicUrl && showMiniPlayer && (
        <div className="fixed bottom-[140px] left-0 right-0 z-40 px-4">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl">
            {/* Song Title */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <Music className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white truncate">
                  {room.currentMusicTitle || 'Unknown Song'}
                </p>
                <p className="text-[9px] text-white/50">
                  {formatTime(musicCurrentTime)} / {formatTime(musicDuration)}
                </p>
              </div>
              {/* Close Button - Only hides player, music continues */}
              <button
                onClick={() => setShowMiniPlayer(false)}
                className="p-1.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 active:scale-95 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${musicProgress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mt-3">
              {/* Playlist - Opens full dialog */}
              <button
                onClick={() => setIsRoomPlayOpen(true)}
                className="p-2 rounded-full text-white/60 hover:text-white active:scale-95 transition-all"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>

              {/* Previous */}
              <button
                className="p-2 rounded-full text-white/60 hover:text-white active:scale-95 transition-all"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              {/* Play/Pause - Only Owner/Admin can control */}
              {canManageRoom ? (
                <button
                  onClick={handleToggleMusic}
                  className="p-3 rounded-full bg-white text-black active:scale-95 transition-all shadow-lg"
                >
                  {room.isMusicPlaying ? (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-white/60 px-3 py-2">
                  {room.isMusicPlaying ? (
                    <>
                      <div className="flex gap-1 items-end h-5">
                        <div className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                        <div className="w-1.5 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.7s' }} />
                        <div className="w-1.5 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.5s' }} />
                        <div className="w-1.5 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '0.6s' }} />
                      </div>
                      <span className="text-xs font-medium ml-1">Playing</span>
                    </>
                  ) : (
                    <span className="text-xs font-medium">Paused</span>
                  )}
                </div>
              )}

              {/* Next */}
              <button
                className="p-2 rounded-full text-white/60 hover:text-white active:scale-95 transition-all"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>

              {/* Volume - Opens popup */}
              <button
                onClick={() => setShowVolumePopup(true)}
                className="p-2 rounded-full text-white/60 hover:text-white active:scale-95 transition-all"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOLUME POPUP */}
      {showVolumePopup && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pb-24 pointer-events-none">
          <div 
            className="absolute inset-0 bg-black/20 pointer-events-auto"
            onClick={() => setShowVolumePopup(false)}
          />
          <div className="relative z-10 bg-black/90 backdrop-blur-xl rounded-2xl p-4 mx-4 w-full max-w-sm border border-white/10 shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (musicAudioRef.current) {
                    musicAudioRef.current.muted = !musicAudioRef.current.muted;
                  }
                }}
                className="p-2 rounded-full bg-white/10 text-white"
              >
                {musicAudioRef.current?.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicAudioRef.current?.volume || 1}
                onChange={(e) => {
                  if (musicAudioRef.current) {
                    musicAudioRef.current.volume = parseFloat(e.target.value);
                    musicAudioRef.current.muted = false;
                  }
                }}
                className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <span className="text-[11px] text-white/60 w-8 text-right">
                {Math.round((musicAudioRef.current?.volume || 1) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT SIDE FLOATING MUSIC BUTTON - Only shows when music is playing and mini player is hidden */}
      {room.isMusicPlaying && !showMiniPlayer && (
        <button
          onClick={() => setShowMiniPlayer(true)}
          className={cn(
            "fixed right-4 bottom-64 z-40 p-2.5 rounded-2xl transition-all active:scale-90 shadow-2xl border-2 animate-bounce-slow",
            "bg-cyan-500/20 border-cyan-400/50 text-cyan-400 shadow-cyan-500/20 hover:bg-cyan-500/30"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-400/20">
            <Music className="h-6 w-6" />
          </div>
        </button>
      )}

      {/* ROCKET BUTTON - Floating at bottom right */}
      <button
        onClick={() => setIsRocketOpen(true)}
        className={cn(
          "fixed right-4 bottom-48 z-40 p-2 rounded-xl transition-all active:scale-95 shadow-lg border-2 animate-pulse",
          "bg-green-500/20 border-green-500/50 text-green-400 shadow-green-500/20 hover:bg-green-500/30"
        )}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-2xl">
          🚀
        </div>
      </button>

      <footer className="relative z-50 px-6 pb-4 flex items-center justify-between pt-2">
        <div className="flex items-center">
          <button
            onClick={handleInputClick}
            className={cn(
              "rounded-full h-12 w-12 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-lg",
              isChatMuted && !canManageRoom ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-white/10 text-white"
            )}
          >
            <MessageSquare className="h-[18px] w-[18px]" />
          </button>

          {/* REPOSITIONED AI MIC - PERSISTENT ACCESS */}
          <button
            onClick={toggleAIListening}
            className={cn(
              "ml-2 h-12 w-12 rounded-full flex items-center justify-center active:scale-95 transition-all shrink-0 shadow-lg border border-white/20",
              isAIListening ? "bg-red-500 animate-pulse text-white" : "bg-primary text-black"
            )}
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="absolute left-[42%] -translate-x-1/2 -translate-y-1">
          <button
            onClick={() => { setGiftRecipient(null); setIsGiftPickerOpen(true); }}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00B0FF] via-[#0091EA] to-[#007BB5] flex items-center justify-center shadow-[0_0_15px_rgba(0,176,255,0.4)] active:scale-95 transition-all border-2 border-white/40 overflow-hidden group relative"
          >
            <div className="absolute inset-0 bg-white/40 -skew-x-[30deg] -translate-x-[200%] group-hover:animate-shine pointer-events-none z-20" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />

            <img
              src="https://img.icons8.com/color/96/gift--v1.png"
              className="h-7 w-7 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] filter brightness-110 saturate-125 hue-rotate-[280deg] animate-reaction-float relative z-10"
              alt="Gift"
            />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleMicToggle} disabled={!isInSeat} className={cn("p-2 rounded-full transition-all active:scale-90 shadow-md", !isInSeat ? "bg-white/5 text-white/20 opacity-50" : (currentUserParticipant?.isMuted ? "bg-white/10 text-white" : "bg-green-500 text-white shadow-lg border border-white/20"))}>
            {isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-[18px] w-[18px]" /> : <MicOff className="h-[18px] w-[18px]" />}
          </button>

          <button onClick={() => setIsEmojiPickerOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform shadow-md border border-white/5">
            <SmilePlus className="h-[18px] w-[18px] text-white" />
          </button>

          <button onClick={() => setIsMessagesOpen(true)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform shadow-md border border-white/5">
            <Mail className="h-[18px] w-[18px] text-white" />
          </button>

          <button
            onClick={() => setIsRoomPlayOpen(true)}
            className="group relative p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full active:scale-90 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] border border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-400"
          >
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <LayoutGrid className="h-[18px] w-[18px] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </button>
        </div>
      </footer>

      {showInput && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end p-4 pb-12 font-headline pointer-events-none">
          <div
            className="absolute inset-0 bg-black/5 pointer-events-auto"
            onClick={() => setShowInput(false)}
          />
          <div className="relative z-10 bg-slate-900/60 rounded-full p-2.5 px-3 flex items-center gap-3 animate-in slide-in-from-bottom-5 border border-white/10 pointer-events-auto shadow-2xl mx-2">
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
            <X className="h-[18px] w-[18px]" />
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


      <RoomUserListDialog open={isUserListOpen} onOpenChange={setIsUserListOpen} roomId={room.id} participants={participants} />
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
        onSelectGame={(slug) => {
          if (['ludo', 'carrom', 'chess'].includes(slug)) {
            setMinimizedRoom(room);
            setActiveRoom(null);
            router.push(`/games/${slug}?roomId=${room.id}`);
          } else {
            setActiveGameSlug(slug);
          }
        }}
        onPlayLocalMusic={handlePlayLocalMusic}
        onSyncSharedMusic={(track) => {
          // When music is synced from dialog, play it locally
          if (musicAudioRef.current && track?.url) {
            musicAudioRef.current.src = track.url;
            musicAudioRef.current.play().catch(e => {
              console.warn('[Music] Auto-play failed:', e);
            });
          }
        }}
        onToggleMiniPlayer={() => setShowMiniPlayer(true)}
      />
      <RoomGamesDialog
        open={isRoomGamesOpen}
        onOpenChange={setIsRoomGamesOpen}
        onToggleMiniPlayer={() => setShowMiniPlayer(!showMiniPlayer)}
        roomHasMusic={!!room.currentMusicUrl}
        showMiniPlayer={showMiniPlayer}
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
        isSeatMuted={room.mutedSeats?.includes(selectedSeatIdx || 0) || false}
        occupantUid={selectedParticipantUid}
        occupantName={participants.find(p => p.uid === selectedParticipantUid)?.name}
        occupantAvatarUrl={participants.find(p => p.uid === selectedParticipantUid)?.avatarUrl}
        isMuted={participants.find(p => p.uid === selectedParticipantUid)?.isMuted || false}
        canManage={canManageRoom}
        currentUserId={currentUser?.uid}
        currentUserName={userProfile?.username}
        currentUserAvatarUrl={userProfile?.avatarUrl}
        onLeaveSeat={handleLeaveSeat}
        onKick={handleKick}
        onToggleMute={handleSilence}
        onToggleSeatMute={handleToggleSeatMute}
        onSendGift={handleOpenGiftPickerFromMenu}
        onOpenAudienceInvite={() => setIsAudienceInviteOpen(true)}
      />

      <RoomAudienceInviteDialog
        open={isAudienceInviteOpen}
        onOpenChange={setIsAudienceInviteOpen}
        seatIndex={selectedSeatIdx}
        roomId={room.id}
        participants={participants}
        inviterName={userProfile?.username || currentUser?.displayName || 'User'}
        inviterAvatar={userProfile?.avatarUrl}
        inviterId={currentUser?.uid || ''}
      />

      <RoomMicInviteDialog
        open={showMicInviteDialog}
        onOpenChange={setShowMicInviteDialog}
        inviterName={micInviteData?.inviterName || 'User'}
        inviterAvatar={micInviteData?.inviterAvatar}
        targetSeatIndex={micInviteData?.targetSeatIndex || 0}
        roomId={room.id}
        onAccept={(seatIndex) => {
          // Accept invitation and take the seat
          handleTakeSeat(seatIndex);
        }}
        onReject={() => {
          // Just close the dialog - user declined
          console.log('User rejected mic invitation');
        }}
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
        isSilenced={participants.find(p => p.uid === selectedParticipantUid)?.isMuted || false}
        onKick={handleKick}
        onLeaveSeat={handleLeaveSeat}
        onToggleMod={handleToggleMod}
        onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }}
        onOpenChat={handleOpenChatFromProfile}
        onMention={handleMention}
        isMe={selectedParticipantUid === currentUser?.uid}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shine {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shine 2s infinite linear;
        }
        /* Touch responsiveness optimization */
        .touch-responsive {
          will-change: transform;
          touch-action: manipulation;
        }
        .touch-responsive:active {
          transform: scale(0.95);
        }
      `}</style>
      <MountOverlay entries={mountEntries} />
      <LuckyRainOverlay 
        active={isLuckyRainActive} 
        onComplete={() => setIsLuckyRainActive(false)} 
      />
    </div>
  );
}

// Helper function to format time
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
