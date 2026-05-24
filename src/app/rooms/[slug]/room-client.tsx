'use client';

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion, useDragControls } from 'framer-motion';
import {
  Mic,
  MicOff,
  Gift,
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
  Film,
  Tv,
  Plus,
  SmilePlus,
  MessageSquare,
  Trophy,
  Megaphone,
  Repeat,
  Home,
  Heart,
  LogOut,
  Zap,
  ImageIcon,
  Loader,
  ShieldCheck,
  ShieldAlert,
  Minus,
  MoreVertical,
  Music,
  Music2,
  Phone,
  Settings,
  Shield,
  Smile,
  Sparkles,
  UserPlus,
  Trophy as TrophyIcon,
  Speaker
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROOM_TASKS } from '@/constants/room-tasks';
import { GoldCoinIcon, GameControllerIcon, UmmyLogoIcon } from '@/components/icons';
import type { Room, RoomParticipant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VipBadge } from '@/components/vip-badge';
import { RoomBanners } from "@/components/room-banners";
import { RoomSupportDialog } from "@/components/room-support-dialog";
import { RoomTopSupportersDialog } from "@/components/room-top-supporters-dialog";
import { RoomLuckySpinDialog } from "@/components/room-lucky-spin-dialog";
import { RoomGoldenChestDialog } from "@/components/room-golden-chest-dialog";
import { MountOverlay, MountEntry } from '@/components/mount-overlay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
  useStorage,
  useDatabase
} from '@/firebase/provider';
import { ref as dbRef, onValue } from 'firebase/database';
import {
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
  Timestamp,
  where,
  writeBatch,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, getBytes } from 'firebase/storage';
import { AvatarFrame } from '@/components/avatar-frame';
import { useRouter } from 'next/navigation';
import { useRoomContext } from '@/components/room-provider';
import { getUmmyAIResponse, moderateMessage, translateMessage, detectEmotion } from '@/actions/ai-actions';
// DISABLED: Rocket system replaced by Loot Box
// import { RocketDialog } from '@/components/rocket-dialog';
// import { RoomRocketBar } from '@/components/room-rocket-bar';
import { AiVoiceAnnouncer } from '@/components/ai-voice-announcer';
import { LootBoxDisplay } from '@/components/loot-box-display';
import { LootGate } from '@/components/loot-gate';
import { LootingRoom } from '@/components/looting-room';
import { VoiceWaveIndicator } from '@/components/voice-wave-indicator';
import { useVoiceActivityContext } from '@/components/voice-activity-provider';
import { DailyRewardDialog } from '@/components/daily-reward-dialog';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
import { LuckyRainOverlay } from '@/components/lucky-rain-overlay';
import { RoomProfileMain } from '@/components/room-profile-main';
import { RoomSettingsDialog } from '@/components/room-settings-dialog';
import { RoomUserListDialog } from '@/components/room-user-list-dialog';
import { RoomInfoDialog } from '@/components/room-info-dialog';
import { RoomShareDialog } from '@/components/room-share-dialog';
import { GiftPicker } from '@/components/gift-picker';
import { RoomPlayDialog } from '@/components/room-play-dialog';
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
import { useMediaPreloader } from '@/hooks/use-media-preloader';
import { useRoomTasks } from '@/hooks/use-room-tasks';
import { useAudioOutput } from '@/hooks/use-audio-output';
import { RoomTasksDialog } from '@/components/room-tasks-dialog';
import { YouTubeDialog } from '@/components/youtube-dialog';
import { EntertainmentHubDialog } from '@/components/entertainment-hub-dialog';
import { MoviePlayer } from '@/components/movie-player';
import { MovieAdProtection } from '@/components/movie-ad-protection';
import { MovieSyncBanner } from '@/components/movie-sync-banner';
import type { TMDBMovie } from '@/lib/tmdb';
import { ScreenMirrorDialog } from '@/components/screen-mirror-dialog';
import { SportsHub } from '@/components/sports-hub';
// import { NetMirrorDialog } from '@/components/netmirror-dialog';
// import { NetMirrorWatchTogether } from '@/components/netmirror-watch-together';
// import { NetMirrorRoomIndicator } from '@/components/netmirror-room-indicator';
// import { NetMirrorPlayer } from '@/components/netmirror-player';
import { ThemeSync } from '@/components/theme-sync';
import { ThemeColorMeta } from '@/components/theme-color-meta';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';



import { memo, useCallback } from 'react';
import { useAgora } from '@/hooks/use-agora';

// --- DAILY DATE UTILITY ---
const getTodayString = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
  return istDate.toISOString().split('T')[0];
};

// --- HASH UTILITY (Must match use-agora.ts) ---
function hashUidToNumber(uid: string): number {
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return (hash >>> 0);
}

// --- HAZA STYLE COMPONENTS ---
const RoomTrophyBadge = ({ coins, supporters = [], onOpenSupport }: { coins: number; supporters?: any[]; onOpenSupport?: () => void }) => {
  const target = 2500000; // Level 1 Goal: 2.5M
  const progress = Math.min((coins / target) * 100, 100);
  
  return (
    <div 
      onClick={onOpenSupport}
      className="group relative flex items-center mt-1 cursor-pointer active:scale-95 transition-all"
    >
      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-lg border border-yellow-500/20 rounded-full pl-0.5 pr-2 py-0.5 shadow-[0_2px_10px_rgba(234,179,8,0.05)] hover:border-yellow-500/50 hover:bg-black/60 transition-all">
        {/* Trophy icon */}
        <div className="relative h-4.5 w-4.5 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center shadow-md">
          <Trophy className="h-2.5 w-2.5 text-black fill-current" />
          <div className="absolute inset-0 rounded-full bg-white/10" />
        </div>
        
        {/* Coins and progress bar */}
        <div className="flex flex-col justify-center ml-0.5">
          <span className="text-[9px] font-black text-yellow-400 leading-none tracking-tight">
            {coins >= 1000000 ? `${(coins / 1000000).toFixed(2)}M` : coins.toLocaleString()}
          </span>
          <div className="h-0.5 w-10 bg-white/10 rounded-full mt-0.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Overlapping Top 3 Supporter Avatars (Only show if they exist) */}
        {supporters.length > 0 && (
          <div className="flex -space-x-1 ml-1.5 mr-0.5">
            {supporters.slice(0, 3).map((sup: any, idx: number) => (
              <div 
                key={sup.uid || idx} 
                className={cn(
                  "h-3.5 w-3.5 rounded-full border flex items-center justify-center overflow-hidden shadow-sm shrink-0",
                  idx === 0 ? "border-yellow-400 z-30" : idx === 1 ? "border-slate-300 z-20" : "border-amber-600 z-10"
                )}
              >
                {sup.avatarUrl ? (
                  <img src={sup.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-slate-800 text-[4px] font-black flex items-center justify-center text-white">
                    {(sup.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ChevronDown className="h-2.5 w-2.5 text-yellow-500/30 group-hover:text-yellow-500/80 transition-colors ml-0.5" />
      </div>
    </div>
  );
};

const Seat = memo(({
  index,
  occupant,
  onClick,
  label,
  isLocked,
  isSeatMuted,
  roomOwnerId,
  roomModeratorIds = [],
  theme,
  customEmojiMap
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
  customEmojiMap?: Map<string, any>;
}) => {
  const { user } = useUser();
  const { speakingVolumes } = useVoiceActivityContext();
  const currentUser = user;

  const isMe = occupant?.uid === currentUser?.uid;
  // Agora uses numeric hash for remote users and '0' for local user in volume detection
  const numericUid = occupant ? hashUidToNumber(occupant.uid).toString() : null;
  const intensity = (numericUid && speakingVolumes[numericUid]) || (isMe && speakingVolumes["0"]) || 0;
  const seatIsSpeaking = intensity > 20; // Increased threshold for softer detection

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div className="relative overflow-visible">
        <EmojiReactionOverlay 
          emoji={occupant?.activeEmoji} 
          customEmojiData={occupant?.activeEmoji ? customEmojiMap?.get(occupant.activeEmoji) : undefined}
          size="sm" 
        />

        {occupant && (
          <VoiceWaveIndicator
            isSpeaking={seatIsSpeaking}
            intensity={intensity}
            accentColor={theme.accentColor}
          />
        )}

        <AvatarFrame
          frameId={occupant?.activeFrame || 'None'}
          size="md"
        >
          <div className="relative p-0.5 rounded-full">
            <button
              onClick={() => onClick(index, occupant)}
              className={cn(
                "h-[60px] w-[60px] rounded-full flex items-center justify-center transition-all relative z-10",
                "bg-sky-500/20 backdrop-blur-xl border border-white/30",
                isLocked ? "border-red-500/60" : "",
                occupant ? "p-0" : "p-0"
              )}
            >
              {occupant ? (
                <div className={cn("h-full w-full transition-opacity duration-300", occupant.activeEmoji ? "opacity-0" : "opacity-100")}>
                  <Avatar className="h-full w-full p-0">
                    <AvatarImage
                      src={occupant.avatarUrl || undefined}
                      className="image-render-crisp brightness-[1.05] contrast-[1.02] saturate-[1.05]"
                    />
                    <AvatarFallback>{(occupant.name || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              ) : isLocked ? (
                <Lock className="h-4 w-4 text-red-500/60" />
              ) : (
                <Armchair className="text-white/90 h-6 w-6" />
              )}
            </button>

            {/* Mic Status Badge - Tied to Avatar Button Parent */}
            {occupant && (occupant.isMuted || isSeatMuted) && (
              <div className="absolute bottom-0 right-0 z-30 h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-950 bg-red-500 shadow-lg">
                <MicOff className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
        </AvatarFrame>

      </div>

      <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.1em] leading-none text-center">
        {occupant ? occupant.name : label}
      </span>
    </div>
  );
});
Seat.displayName = 'Seat';

interface RoomClientProps {
  room: Room;
  onExit?: () => void;
}

export function RoomClient({ room, onExit }: RoomClientProps) {
  const [messageText, setMessageText] = useState('');
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [activeLiveTheme, setActiveLiveTheme] = useState<'galaxy' | 'stars' | 'love' | 'rain' | 'none'>('none');
  const [showInput, setShowInput] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isUserProfileCardOpen, setIsUserProfileCardOpen] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSeatMenuOpen, setIsSeatMenuOpen] = useState(false);
  const [activeGift, setActiveGift] = useState<{
    giftId: string, 
    giftName?: string,
    senderName?: string, 
    receiverName?: string,
    imageUrl?: string, 
    animationUrl?: string,
    videoUrl?: string,
    soundUrl?: string,
    tier?: 'normal' | 'epic' | 'legendary',
    targetSeat?: number
  } | null>(null);
  const [isRoomPlayOpen, setIsRoomPlayOpen] = useState(false);
  const [portalDefaultView, setPortalDefaultView] = useState<'grid' | 'music'>('grid');
  const [isRoomGamesOpen, setIsRoomGamesOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isAudienceInviteOpen, setIsAudienceInviteOpen] = useState(false);
  const [isRoomSupportOpen, setIsRoomSupportOpen] = useState(false);
  const [isRoomSupportersOpen, setIsRoomSupportersOpen] = useState(false);
  const [isSpinOpen, setIsSpinOpen] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  // DISABLED: Rocket state
  // const [isRocketOpen, setIsRocketOpen] = useState(false);

  // LOOT SYSTEM DEFAULTS
  const DEFAULT_LOOT_LEVELS = [
    { id: "home", name: "Home", threshold: 1000, image: "", animation: "", voice: "Ghar khulne wala hai!" },
    { id: "bank", name: "Bank", threshold: 5000, image: "", animation: "", voice: "Bank taiyaar hai!" },
    { id: "car", name: "Car", threshold: 15000, image: "", animation: "", voice: "Car aa gayi!" },
    { id: "hotel", name: "Hotel", threshold: 30000, image: "", animation: "", voice: "Hotel khul gaya!" },
    { id: "bus", name: "Bus", threshold: 50000, image: "", animation: "", voice: "Bus aa rahi hai!" },
    { id: "train", name: "Train", threshold: 100000, image: "", animation: "", voice: "Train ready hai!" },
    { id: "ship", name: "Ship", threshold: 250000, image: "", animation: "", voice: "Jahaaz taiyaar hai!" },
    { id: "aeroplane", name: "Aeroplane", threshold: 500000, image: "", animation: "", voice: "Hawai jahaaz udne wala hai!" },
  ];

  const DEFAULT_LOOT_REWARDS = [
    { id: "coins-common", name: "Coins", type: "coins", rarity: "common", value: 100, icon: "" },
    { id: "frame-common", name: "Frame", type: "frame", rarity: "common", value: 1, icon: "" },
    { id: "badge-rare", name: "Badge", type: "badge", rarity: "rare", value: 1, icon: "" },
    { id: "special-legendary", name: "Special Item", type: "special", rarity: "legendary", value: 1, icon: "" },
    { id: "theme-epic", name: "Room Theme", type: "theme", rarity: "epic", value: 1, icon: "" },
  ];

  const DEFAULT_LOOT_CONFIG = { entryLimit: 20, duration: 60, gatePriority: "top_sender" };

  // LOOT SYSTEM STATE (with defaults)
  const [lootLevels, setLootLevels] = useState<any[]>(DEFAULT_LOOT_LEVELS);
  const [lootRewards, setLootRewards] = useState<any[]>(DEFAULT_LOOT_REWARDS);
  const [lootConfig, setLootConfigState] = useState(DEFAULT_LOOT_CONFIG);
  const [isLootGateOpen, setIsLootGateOpen] = useState(false);
  const [isLootingActive, setIsLootingActive] = useState(false);
  const [lootGateEntries, setLootGateEntries] = useState<string[]>([]);
  const [hasEnteredLoot, setHasEnteredLoot] = useState(false);
  const [collectedLootItems, setCollectedLootItems] = useState<any[]>([]);
  const [lootTimeRemaining, setLootTimeRemaining] = useState(60);
  const [currentLootLevelIndex, setCurrentLootLevelIndex] = useState(0);
  const [isRoomTasksOpen, setIsRoomTasksOpen] = useState(false);
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
  const [isYouTubeHidden, setIsYouTubeHidden] = useState(false);
  const [isMoviesOpen, setIsMoviesOpen] = useState(false);
  const [isMoviePlayerOpen, setIsMoviePlayerOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{ tmdbId: number; title: string; posterPath: string | null; mediaType?: 'movie' | 'tv'; season?: number; episode?: number; episodeName?: string } | null>(null);
  const [roomMovie, setRoomMovie] = useState<{ tmdbId: number; title: string; posterPath: string | null; startedBy: string } | null>(null);
  const [isMovieBannerDismissed, setIsMovieBannerDismissed] = useState(false);
  const movieDragControls = useDragControls();
  const movieIframeRef = useRef<HTMLIFrameElement>(null);
  const movieOriginalUrlRef = useRef<string>('');
  const moviePopupBlockedRef = useRef(false);
  const [movieAdBlocked, setMovieAdBlocked] = useState(0);
  const [isScreenMirrorOpen, setIsScreenMirrorOpen] = useState(false);
  const [isSportsOpen, setIsSportsOpen] = useState(false);
  // const [isNetMirrorOpen, setIsNetMirrorOpen] = useState(false);
  // const [isNetMirrorWatchOpen, setIsNetMirrorWatchOpen] = useState(false);
  // const [netMirrorSession, setNetMirrorSession] = useState<{ movieTitle: string; movieUrl?: string; startedBy: string; isActive: boolean } | null>(null);
  // const [isNetMirrorPlayerOpen, setIsNetMirrorPlayerOpen] = useState(false);
  const [screenShareTarget, setScreenShareTarget] = useState<{ type: 'all' | 'specific', uid?: string, name?: string } | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showMicInviteDialog, setShowMicInviteDialog] = useState(false);
  const [micInviteData, setMicInviteData] = useState<{ inviterName: string; inviterAvatar?: string; targetSeatIndex: number } | null>(null);
  const [activeGameSlug, setActiveGameSlug] = useState<string | null>(null);

  const [sessionJoinTime, setSessionJoinTime] = useState<Date | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setSessionJoinTime(new Date());
    setIsHydrated(true);
  }, []);
  const [selectedSeatIdx, setSelectedSeatIdx] = useState<number | null>(null);
  const [mountEntries, setMountEntries] = useState<MountEntry[]>([]);
  const [selectedParticipantUid, setSelectedParticipantUid] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ uid: string; name: string; avatarUrl?: string } | null>(null);
  const [initialChatRecipient, setInitialChatRecipient] = useState<any>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicState, setMusicState] = useState({ duration: 0, currentTime: 0, progress: 0 });
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [isLuckyRainActive, setIsLuckyRainActive] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Audio output routing (Speaker vs Earbuds)
  const { 
    isSpeaker, 
    toggleOutput, 
    forceEarbuds,
    hasBluetooth,
    hasWired,
    registerAudioElement 
  } = useAudioOutput();

  // Silent audio ref for unlocking browser autoplay policy
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const localPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const musicIntensityRef = useRef<number>(0);
  const aiSilentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<any>(null);

  // SYNC: Ref to track welcomed users to prevent duplication (10-second window)
  const welcomedUsersRef = useRef<Set<string>>(new Set());
  const cleanupWelcomesRef = useRef<NodeJS.Timeout | null>(null);

  // Messages ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedId = useRef<string | null>(null);

  // Music refs
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const pendingSeekTime = useRef<number | null>(null);

  // Throttle ref for message processing
  const messageProcessTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI Voice refs
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Image upload ref
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Rocket reset ref
  const hasResetRocketRef = useRef(false);

  // Warning counts ref for AI moderation
  const warningCounts = useRef<Record<string, number>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [roomCaptions, setRoomCaptions] = useState<Record<string, { text: string, name: string, timestamp: number }>>({});





  // SYNC: Initialize standard user hook
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();

  // --- BOUTIQUE SYNC: Fetch all store items for frame/bubble configs (one-time fetch, static data) ---
  const [storeLibrary, setStoreLibrary] = useState<Record<string, any>>({});
  const storeLibraryFetchedRef = useRef(false);
  useEffect(() => {
    if (!firestore || storeLibraryFetchedRef.current) return;
    storeLibraryFetchedRef.current = true;
    const q = query(collection(firestore, 'storeItems'));
    getDocs(q).then((snapshot) => {
      const items: Record<string, any> = {};
      snapshot.docs.forEach(d => {
        items[d.id] = d.data();
      });
      setStoreLibrary(items);
    }).catch(() => {});
  }, [firestore]);

  // MEDIA PRELOADER: Preload gift videos and frame videos in background
  const { preloadBatch } = useMediaPreloader({ enabled: true, maxConcurrent: 4 });
  const mediaPreloadedRef = useRef(false);
  
  useEffect(() => {
    if (!firestore || mediaPreloadedRef.current) return;
    
    // Fetch gifts and store items, then preload their media
    const preloadMedia = async () => {
      mediaPreloadedRef.current = true;
      
      try {
        // Fetch gifts
        const giftsQuery = query(collection(firestore, 'giftList'));
        const giftsSnap = await getDocs(giftsQuery);
        const giftVideos: string[] = [];
        const giftImages: string[] = [];
        const giftAnimations: string[] = [];
        
        giftsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.videoUrl) giftVideos.push(data.videoUrl);
          if (data.imageUrl) giftImages.push(data.imageUrl);
          if (data.animationUrl) giftAnimations.push(data.animationUrl);
          if (data.soundUrl) giftImages.push(data.soundUrl); // Preload sounds as images (browser caches them)
        });

        // Fetch store items for frame videos
        const storeQuery = query(collection(firestore, 'storeItems'));
        const storeSnap = await getDocs(storeQuery);
        const frameVideos: string[] = [];
        const frameImages: string[] = [];
        
        storeSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.videoUrl) frameVideos.push(data.videoUrl);
          if (data.imageUrl) frameImages.push(data.imageUrl);
        });

        // Combine all URLs
        const allVideos = [...giftVideos, ...frameVideos];
        const allImages = [...giftImages, ...frameImages];

        
        // Preload in batches (non-blocking)
        if (allVideos.length > 0 || allImages.length > 0) {
          preloadBatch({ video: allVideos, image: allImages });
        }
      } catch (e) {
        console.warn('[Media Preloader] Failed to preload media:', e);
      }
    };

    // Delay preload to not block initial room render
    const timer = setTimeout(preloadMedia, 2000);
    return () => clearTimeout(timer);
  }, [firestore, preloadBatch]);

  // MUSIC LIBRARY FETCH: Needed for Next/Previous and Auto-play logic
  const { data: roomMusicLibrary = [] } = useCollection(
    room?.id ? query(collection(firestore, 'chatRooms', room.id, 'music'), orderBy('createdAt', 'desc')) : null
  );

  // SERVER TIME OFFSET SYNC
  const database = useDatabase();
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  
  useEffect(() => {
    if (!database) return;
    const offsetRef = dbRef(database, '.info/serverTimeOffset');
    const unsubscribe = onValue(offsetRef, (snap) => {
      const offset = snap.val() || 0;
      setServerTimeOffset(offset);
      // console.log('[Sync] Server Time Offset Updated:', offset, 'ms');
    });
    return () => unsubscribe();
  }, [database]);

  // AUTO-UNLOCK: Play silent audio on mount to unlock browser audio context
  // This allows subsequent music to auto-play without user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create a silent audio element
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
    silentAudioRef.current = silentAudio;
    aiSilentAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');

    // Try to play immediately (will likely fail due to autoplay policy)
    const attemptSilentPlay = async () => {
      try {
        await silentAudio.play();
        setUserInteracted(true);
      } catch (e) {
      }
    };

    attemptSilentPlay();

    // Also set up interaction listeners as fallback (Critical for Mobile)
    const unlockOnInteraction = async () => {
      // 1. Unblock Audio Context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // 2. Unblock Media Element
      if (silentAudioRef.current) {
        silentAudioRef.current.play().catch(() => {});
      }

      // 3. Unblock Speech Synthesis (System-wide)
      if (window.speechSynthesis) {
        const warmUp = new SpeechSynthesisUtterance(" ");
        warmUp.volume = 0;
        window.speechSynthesis.speak(warmUp);
        // FORCE RESUME: Crucial for Android WebView
        window.speechSynthesis.resume();
      }

      // 4. Start Persistent Keep-Alive loop for Native
      if (aiSilentAudioRef.current) {
        aiSilentAudioRef.current.volume = 0.01;
        aiSilentAudioRef.current.play().catch(() => {});
      }

      setUserInteracted(true);
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

  // AUDIO OUTPUT: Auto-route to earbuds when music starts
  useEffect(() => {
    if (musicAudioRef.current) {
      registerAudioElement(musicAudioRef.current);
    }
  }, [registerAudioElement]);

  useEffect(() => {
    if (isMusicPlaying && (hasBluetooth || hasWired) && isSpeaker) {
      // PROACTIVE ROUTING: No delay to minimize speaker leak
      forceEarbuds(musicAudioRef.current);
    }
  }, [isMusicPlaying, hasBluetooth, hasWired, isSpeaker, forceEarbuds]);

  // ============================================================
  // AUTHORITY & STATE DERIVATION (Top-level for hook consumption)
  // ============================================================
  const isAppCreator = currentUser?.uid === '901piBzTQ0VzCtAvlyyobwvAaTs1';
  const isOwner = currentUser?.uid === room?.ownerId;
  const isModerator = room?.moderatorIds?.includes(currentUser?.uid || '') || false;
  const canManageRoom = isOwner || isModerator;
  const isChatMuted = room?.isChatMuted || false;
  const maxMics = room?.maxActiveMics || 9;

  // AI VOICE & INTERACTION STATES
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [isAIListening, setIsAIListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIVoiceEnabled, setIsAIVoiceEnabled] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (localStorage.getItem('ummy_ai_voice_enabled') === 'true') {
      setIsAIVoiceEnabled(true);
    }
  }, []);

  // ROOM THEMES & SYNC (one-time fetch, static data)
  const [dbThemes, setDbThemes] = useState<any[]>([]);
  useEffect(() => {
    if (!firestore) return;
    getDocs(query(collection(firestore, 'roomThemes'))).then((snapshot) => {
      setDbThemes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(() => {});
  }, [firestore]);

  // --- DERIVE PARTICIPANTS & SEAT STATUS ---
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room?.id) return null;
    try {
      return query(collection(firestore, 'chatRooms', room.id, 'participants'));
    } catch (e) {
      console.error('[Room] Failed to create participants query:', e);
      return null;
    }
  }, [firestore, room?.id]);

  // --- DERIVE TOP 3 SUPPORTERS ---
  const supportersQuery = useMemoFirebase(() => {
    if (!firestore || !room?.id) return null;
    try {
      return query(
        collection(firestore, 'chatRooms', room.id, 'topSupporters'),
        orderBy('dailyAmount', 'desc'),
        limit(3)
      );
    } catch (e) {
      console.error('[Room] Failed to create supporters query:', e);
      return null;
    }
  }, [firestore, room?.id]);

  const { data: supportersData } = useCollection(supportersQuery);
  const supporters = supportersData || [];

  const { data: participantsData } = useCollection<RoomParticipant>(participantsQuery);

  const participants = participantsData || [];

  const onlineParticipants = useMemo(() => {
    if (!participantsData || onlineUserIds.size === 0) return participantsData || [];
    return participantsData.filter(p => onlineUserIds.has(p.uid));
  }, [participantsData, onlineUserIds]);

  // REALTIME DATABASE PRESENCE LISTENER: Track online users in room
  useEffect(() => {
    if (!room?.id || !database) return;
    
    const presenceRef = dbRef(database, `roomPresence/${room.id}`);
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const userIds = new Set(Object.keys(presenceData));
      setOnlineUserIds(userIds);
    });
    
    return () => unsubscribe();
  }, [room?.id, database]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !sessionJoinTime) return null;
    try {
      return query(
        collection(firestore, 'chatRooms', room.id, 'messages'),
        where('timestamp', '>', Timestamp.fromDate(sessionJoinTime)),
        orderBy('timestamp', 'asc'),
        limitToLast(50)
      );
    } catch (e) {
      console.error('[Room] Failed to create messages query:', e);
      return null;
    }
  }, [firestore, room.id, sessionJoinTime]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  const currentTheme = useMemo(() => {
    if (!room) return ROOM_THEMES[0];
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
  }, [room?.roomThemeId, room?.backgroundUrl, dbThemes]);

  const bgUrl = currentTheme.url;

  useEffect(() => {
    if (currentTheme?.animationId) {
      setActiveLiveTheme(currentTheme.animationId as any);
    } else {
      setActiveLiveTheme('none');
    }
  }, [currentTheme?.animationId, setActiveLiveTheme]);

  // AI VOICE ENGINE INIT
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const loadVoices = () => {
        if (!window.speechSynthesis) return;
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) setVoicesLoaded(true);
      };
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      loadVoices();
    } catch (e) {
      console.warn('SpeechSynthesis initialization failed:', e);
    }
  }, []);

  // NAVIGATION INTERCEPTION
  useEffect(() => {
    if (!room?.id) return;
    window.history.pushState(null, '', window.location.href);
  }, [room?.id]);

  useEffect(() => {
    let backListener: any = null;
    const initListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backListener = await App.addListener('backButton', ({ canGoBack }) => {
          setShowExitDialog(true);
        });
      } catch (e) {}
    };
    initListener();
    return () => { if (backListener) backListener.remove(); };
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      setShowExitDialog(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, []);

  // GIFT & EVENT SYNC ENGINE - OPTIMIZED with throttling
  useEffect(() => {
    if (!firestoreMessages || firestoreMessages.length === 0) return;

    // Clear existing timeout to throttle processing
    if (messageProcessTimeoutRef.current) {
      clearTimeout(messageProcessTimeoutRef.current);
    }

    messageProcessTimeoutRef.current = setTimeout(() => {
      // GLOBAL AI LEADERSHIP ELECTION V5 (ROBUST):
      const onlineMods = (onlineParticipants || [])
        .filter(p => p && p.uid && room.moderatorIds?.includes(p.uid))
        .sort((a, b) => (a.uid || '').localeCompare(b.uid || ''));

      const sortedParticipants = [...(onlineParticipants || [])]
        .filter(p => p && p.uid)
        .sort((a, b) => (a.uid || '').localeCompare(b.uid || ''));
      const ownerOnline = onlineParticipants?.some(p => p.uid === room.ownerId);

      let electedLeaderUid = sortedParticipants[0]?.uid;
      if (ownerOnline) electedLeaderUid = room.ownerId;
      else if (onlineMods.length > 0) electedLeaderUid = onlineMods[0].uid;

      const isAIProcessor = currentUser?.uid === electedLeaderUid || (!electedLeaderUid && isOwner);

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
                // TRIGGER LOCAL ANIMATION:
                setActiveGift({
                  giftId: msg.giftId,
                  giftName: msg.giftName,
                  senderName: msg.senderName,
                  receiverName: msg.receiverName,
                  imageUrl: msg.imageUrl,
                  animationUrl: msg.animationUrl,
                  videoUrl: msg.videoUrl,
                  soundUrl: msg.soundUrl,
                  tier: msg.tier,
                  targetSeat: msg.recipientSeat || 1
                });
                
                // Haptic feedback for sender/recipient
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  const isRecipient = msg.recipientId === currentUser?.uid;
                  const isSender = msg.senderId === currentUser?.uid;
                  if (isRecipient || isSender) {
                    navigator.vibrate(100);
                  }
                }
              } else if (msg.type === 'lucky-rain') {
                setIsLuckyRainActive(true);
              } else if (msg.type === 'entrance' && isAIProcessor) {
                // High-Priority: Use direct call to avoid idle callback latency
                handleAIWelcome(msg.senderName);
              } else if (msg.type === 'emoji' && (msg as any).isSfx) {
                playLocalSfx((msg as any).sfxId);
              } else if (msg.type === 'text' && msg.senderId !== 'SYSTEM_BOT' && isAIProcessor) {
                // High-Priority: Use direct call to avoid idle callback latency
                handleAIEngine(msg);
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
  }, [firestoreMessages, currentUser?.uid, canManageRoom, room.ownerId, room.moderatorIds]);

  // --- ROOM ROCKET SYSTEM ENGINE (Wafa/Haza Style) ---
  // DISABLED: Rocket Logic
  /*
  useEffect(() => {
    if (!firestore || !room.id) return;

    // 1. LEADERSHIP SYNC: Only the elected AI Processor handles rocket state shifts
    if (currentUser?.uid !== room.ownerId && !room.moderatorIds?.includes(currentUser?.uid)) return;

    const rocket = room.rocket || { progress: 0, target: 10000, countdownUntil: null };
    const hasResetRocketRef = useRef(false);

    // 24h Reset Logic
    const lastReset = (rocket as any).lastReset?.toDate?.() || new Date(0);
    const hoursSinceReset = (Date.now() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24 && !hasResetRocketRef.current) {
      hasResetRocketRef.current = true;
      updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
        'rocket.progress': 0,
        'rocket.countdownUntil': null,
        'rocket.lastReset': Timestamp.fromDate(new Date()),
      });
    }

    const currentTarget = rocketConfig?.target || rocket.target || 10000;
    if (rocket.progress >= currentTarget && !rocket.countdownUntil) {
      const launchTime = new Date(Date.now() + 60000);
      updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
        'rocket.countdownUntil': Timestamp.fromDate(launchTime)
      });
    }

    // TRIGGER 2: Launch Rocket when countdown finishes
    if (rocket.countdownUntil) {
      const launchTime = rocket.countdownUntil.toDate().getTime();
      if (Date.now() >= launchTime) {
        // ... trigger lucky rain ...
        
        // Reset Rocket State
        updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
          'rocket.progress': 0,
          'rocket.countdownUntil': null
        });
      }
    }
  }, [room.rocket, participantsData, currentUser?.uid, room.ownerId, firestore, room.id]);
  */

  // ============================================================
  // MUSIC SYNC ENGINE - High-Fidelity Multi-user Sync
  // Uses Virtual Clock (musicStartedAt) to handle seek/sync
  // ============================================================
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio || !room?.id) return;

    const url = room?.currentMusicUrl;
    const isPlaying = room?.isMusicPlaying || false;
    const isOwner = currentUser?.uid === room?.ownerId;

    if (!url) {
      if (!audio.paused) {
        audio.pause();
        audio.src = '';
        setIsMusicPlaying(false);
      }
      return;
    }

    const calcTargetTime = () => {
      const startedAt = room?.musicStartedAt;
      const offset = room?.musicStartOffset || 0;
      if (!startedAt) return offset;
      const startMs = startedAt?.toMillis?.() ?? (startedAt?.seconds ? startedAt.seconds * 1000 : null);
      if (!startMs) return offset;
      
      // Use Synchronized Clock: Local time + server-drift compensation
      const syncedNow = Date.now() + serverTimeOffset;
      const elapsed = (syncedNow - startMs) / 1000;
      
      return offset + elapsed;
    };

    // Track changed logic
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
      const targetTime = calcTargetTime();
      pendingSeekTime.current = targetTime;
      return;
    }

    // Play/Pause/Drift logic
    if (isPlaying) {
      const target = calcTargetTime();
      const drift = Math.abs(audio.currentTime - target);
      if (drift > 2) {
        audio.currentTime = target;
      }
      if (audio.paused) {
        audio.play().catch(e => console.warn('[Music] Autoplay blocked:', e.name));
        setIsMusicPlaying(true);
      }
    } else {
      if (!audio.paused) {
        audio.pause();
        setIsMusicPlaying(false);
      }
    }
  }, [room?.currentMusicUrl, room?.isMusicPlaying, room?.musicStartedAt, room?.musicStartOffset, room?.id]);

  // Handle Track Completion (Auto-play Next)
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isRepeatEnabled) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('[Music] Loop failed:', e));
        return;
      }

      // LEADERSHIP SYNC: Only the owner or designated leader triggers auto-play
      const sortedParts = [...(onlineParticipants || [])]
        .filter(p => p && p.uid)
        .sort((a, b) => (a.uid || '').localeCompare(b.uid || ''));
      const ownerOnline = onlineParticipants?.some(p => p.uid === room.ownerId);
      let electedLeaderUid = sortedParts[0]?.uid;
      if (ownerOnline) electedLeaderUid = room.ownerId;
      
      const isLeader = currentUser?.uid === electedLeaderUid;

      if (isLeader && roomMusicLibrary.length > 0) {
        handleNextMusic();
      } else if (!isLeader && roomMusicLibrary.length > 0) {
      } else {
        setIsMusicPlaying(false);
      }
    };

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setMusicState({
          duration: audio.duration,
          currentTime: audio.currentTime,
          progress: (audio.currentTime / audio.duration) * 100,
        });
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration) setMusicState(prev => ({ ...prev, duration: audio.duration }));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [roomMusicLibrary, room?.id, room?.currentMusicId, isRepeatEnabled]);

  // LOOT TIMER
  useEffect(() => {
    if (!isLootingActive || lootTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLootTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLootingActive(false);
          setHasEnteredLoot(false);
          setLootGateEntries([]);
          setCollectedLootItems([]);
          // Announce end in Hindi
          if ((window as any).__announceLoot) {
            (window as any).__announceLoot("Loot samapt! Agli baar phir aana!");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLootingActive, lootTimeRemaining]);

  // LOOT LEVEL PROGRESSION
  useEffect(() => {
    if (lootLevels.length === 0) return;

    const totalGifts = room.stats?.dailyGifts || 0;
    const lastLevelThreshold = lootLevels[lootLevels.length - 1]?.threshold || 500000;
    
    // Calculate effective progress with looping
    const effectiveProgress = totalGifts % lastLevelThreshold;
    
    let newIndex = 0;
    for (let i = lootLevels.length - 1; i >= 0; i--) {
      if (effectiveProgress >= lootLevels[i].threshold) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== currentLootLevelIndex) {
      setCurrentLootLevelIndex(newIndex);
      // Announce level up in Hindi
      if (lootLevels[newIndex]?.voice) {
        const announce = (window as any).__announceLoot;
        if (announce) {
          setTimeout(() => announce(lootLevels[newIndex].voice), 300);
        }
      }
    }
  }, [room.stats?.dailyGifts, lootLevels, currentLootLevelIndex]);

  const { userProfile } = useUserProfile(currentUser?.uid);


  const currentUserParticipant = onlineParticipants.find(p => p.uid === currentUser?.uid);
  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;

  const {
    setActiveRoom,
    setIsMinimized,
    setMinimizedRoom,
    musicStream,
    setMusicStream,
    isMusicEnabled,
    isSpeakerMuted,
    setIsSpeakerMuted
  } = useRoomContext();

  // Voice activity handled per-seat via context
  const { speakingVolumes, setVolumes } = useVoiceActivityContext();

  // DYNAMIC LEVELING SYNC
  useActivityTracker(room?.id, currentUser?.uid || null);

  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.muted = isSpeakerMuted;
    }
  }, [isSpeakerMuted]);

  const { 
    localAudioTrack, 
    remoteUsers,
    toggleAudioOutput,
    forceEarbudsOutput,
    isSpeaker: isVoiceSpeaker,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    remoteScreenTrack,
  } = useAgora(
    room?.id,
    isInSeat,
    currentUserParticipant?.isMuted || false,
    currentUser?.uid,
    isSpeakerMuted,
    (volumes) => {
      // PERF FIX: Batch and threshold volume updates to prevent main thread choking
      const musicId = room?.musicUpdatedBy ? hashUidToNumber(room.musicUpdatedBy).toString() : null;
      let hasSignificantChange = false;
      const updatedVolumes: Record<string, number> = {};
      
      volumes.forEach(v => {
        const level = Math.floor(v.level);
        updatedVolumes[v.uid] = level;
        if (Math.abs((speakingVolumes[v.uid] || 0) - level) > 3) {
          hasSignificantChange = true;
        }
      });

      // If music is playing, inject music intensity into the player's UID
      if (room?.isMusicPlaying && musicId) {
        const mLevel = musicIntensityRef.current;
        const existingLevel = updatedVolumes[musicId] || 0;
        // Boost music waves so they are clearly visible
        updatedVolumes[musicId] = Math.max(existingLevel, mLevel);
        
        if (Math.abs((speakingVolumes[musicId] || 0) - mLevel) > 3) {
          hasSignificantChange = true;
        }
      }

      // Only re-render if volume change is meaningful
      if (hasSignificantChange || Object.keys(updatedVolumes).length !== Object.keys(speakingVolumes).length) {
        setVolumes(updatedVolumes);
      }
    }
  );



  // --- MUSIC INTENSITY ANALYZER ---
  useEffect(() => {
    let isMounted = true;
    if (!room.isMusicPlaying || !musicAudioRef.current || !room.id) {
      musicIntensityRef.current = 0;
      return;
    }

    let analyser: any = null;
    let source: any = null;

    const startAnalysis = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }

        analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        
        // Use the existing musicAudioRef - Ensure we only create the source once
        if (!mediaSourceRef.current) {
          mediaSourceRef.current = audioContextRef.current!.createMediaElementSource(musicAudioRef.current!);
        }
        
        source = mediaSourceRef.current;
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const analyze = () => {
          if (!analyser || !isMounted) return;
          
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume (RMS-like)
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // PERF FIX: Scale and update only at 30FPS (33ms) to save CPU
          // Boosted factor (2.5 instead of 1.5) for more vibrant waves
          musicIntensityRef.current = Math.min(100, Math.floor(average * 2.5));
          
          analysisTimeoutRef.current = setTimeout(analyze, 33);
        };

        analyze();
      } catch (e) {
        console.warn('[Music-Analyzer] Init Error:', e);
      }
    };

    // Small delay to ensure audio element is ready
    const timer = setTimeout(startAnalysis, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
      try {
        if (analyser) analyser.disconnect();
        if (source) source.disconnect();
        musicIntensityRef.current = 0;
      } catch (e) {
        console.warn('[Music-Analyzer] Cleanup Error:', e);
      }
    };
  }, [room.isMusicPlaying, room.id]);

  // Auto-route voice to earbuds when connected
  useEffect(() => {
    if ((hasBluetooth || hasWired) && isVoiceSpeaker && remoteUsers.length > 0) {
      forceEarbudsOutput();
    }
  }, [hasBluetooth, hasWired, isVoiceSpeaker, remoteUsers.length, forceEarbudsOutput]);

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

  // DISABLED: Rocket config
  // const rocketConfigRef = useMemoFirebase(() => {
  //   return doc(firestore, 'appConfig', 'rocket');
  // }, [firestore]);
  // const { data: rocketConfig } = useDoc(rocketConfigRef);
  const rocketConfig = null;

  // LOOT SYSTEM CONFIG
  const lootConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appConfig', 'lootSettings');
  }, [firestore]);
  const { data: lootSettingsData } = useDoc(lootConfigRef);

  // CUSTOM EMOJIS
  const customEmojisQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "customEmojis"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: customEmojis } = useCollection(customEmojisQuery);

  // Create emoji ID to data map
  const customEmojiMap = useMemo(() => {
    const map = new Map();
    if (customEmojis) {
      customEmojis.forEach((emoji: any) => {
        map.set(emoji.id || emoji.name?.toLowerCase().replace(/\s+/g, '-'), {
          ...emoji,
          isCustom: true
        });
      });
    }
    return map;
  }, [customEmojis]);

  useEffect(() => {
    if (lootSettingsData) {
      setLootLevels(lootSettingsData.levels || DEFAULT_LOOT_LEVELS);
      setLootRewards(lootSettingsData.rewards || DEFAULT_LOOT_REWARDS);
      setLootConfigState({
        entryLimit: lootSettingsData.entryLimit || 20,
        duration: lootSettingsData.duration || 60,
        gatePriority: lootSettingsData.gatePriority || "top_sender",
      });
    }
  }, [lootSettingsData]);

  // SCREEN SHARE TARGET COORDINATION
  const [screenShareTargetDoc, setScreenShareTargetDoc] = useState<any>(null);
  useEffect(() => {
    if (!firestore || !room.id) return;
    const screenShareRef = doc(firestore, 'chatRooms', room.id, 'features', 'screenShare');
    const unsubscribe = onSnapshot(screenShareRef, (snapshot) => {
      if (snapshot.exists()) {
        setScreenShareTargetDoc(snapshot.data());
      } else {
        setScreenShareTargetDoc(null);
      }
    });
    return () => unsubscribe();
  }, [firestore, room.id]);

  // Wrapper for startScreenShare that sets Firestore target
  const handleStartScreenShare = async (quality: '480p' | '720p' | '1080p', target: { type: 'all' | 'specific', uid?: string, name?: string }) => {
    if (firestore && room.id && currentUser?.uid) {
      const screenShareRef = doc(firestore, 'chatRooms', room.id, 'features', 'screenShare');
      await updateDocumentNonBlocking(screenShareRef, {
        target,
        startedBy: currentUser.uid,
        startedAt: serverTimestamp(),
        quality,
      });
    }
    await startScreenShare(quality, target);
  };

  const handleStopScreenShare = async () => {
    if (firestore && room.id) {
      const screenShareRef = doc(firestore, 'chatRooms', room.id, 'features', 'screenShare');
      await deleteDocumentNonBlocking(screenShareRef);
    }
    await stopScreenShare();
  };

  // Check if current user should see the screen share
  const shouldShowScreenShare = useMemo(() => {
    if (!screenShareTargetDoc) return false;
    const target = screenShareTargetDoc.target;
    if (!target || target.type === 'all') return true;
    return target.uid === currentUser?.uid;
  }, [screenShareTargetDoc, currentUser?.uid]);

  // MOVIE SYNC: Listen for host's movie selection
  useEffect(() => {
    if (!firestore || !room.id) return;
    const unsubscribe = onSnapshot(doc(firestore, 'chatRooms', room.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.currentMovie) {
          setRoomMovie({
            tmdbId: data.currentMovie.tmdbId,
            title: data.currentMovie.title,
            posterPath: data.currentMovie.posterPath || null,
            startedBy: data.currentMovie.startedBy || 'Host',
          });
          setIsMovieBannerDismissed(false);
        } else {
          setRoomMovie(null);
        }
      }
    });
    return () => unsubscribe();
  }, [firestore, room.id]);

  // // NETMIRROR SESSION: Listen for active watch together session
  // useEffect(() => {
  //   if (!firestore || !room.id) return;
  //   const netMirrorRef = doc(firestore, 'chatRooms', room.id, 'netmirror', 'state');
  //   const unsubNetMirror = onSnapshot(netMirrorRef, (snap) => {
  //     if (snap.exists()) {
  //       const data = snap.data();
  //       if (data.isActive) {
  //         setNetMirrorSession({ movieTitle: data.movieTitle, movieUrl: data.movieUrl, startedBy: data.startedBy, isActive: true });
  //       } else {
  //         setNetMirrorSession(null);
  //       }
  //     } else {
  //       setNetMirrorSession(null);
  //     }
  //   });
  //   return () => unsubNetMirror();
  // }, [firestore, room.id]);

  // YOUTUBE SYNC: Listen for active YouTube state in the room
  useEffect(() => {
    if (!firestore || !room.id) return;
    const youtubeStateRef = doc(firestore, 'chatRooms', room.id, 'youtube', 'state');
    const unsubscribe = onSnapshot(youtubeStateRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.videoId) {
          setIsYouTubeOpen(true);
          setIsYouTubeHidden(false);
        } else {
          setIsYouTubeOpen(false);
        }
      } else {
        setIsYouTubeOpen(false);
      }
    });
    return () => unsubscribe();
  }, [firestore, room.id]);

  // HEARTBEAT: Update lastSeen every 30 seconds to stay online in room count
  useEffect(() => {
    if (!firestore || !room.id || !currentUser?.uid) return;

    const updateHeartbeat = () => {
      const pRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
      updateDocumentNonBlocking(pRef, {
        lastSeen: serverTimestamp(),
        name: userProfile?.username || currentUser.displayName || 'Member',
        avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || '',
        accountNumber: userProfile?.accountNumber || '',
        gender: userProfile?.gender || 'male',
      });
    };

    // Update immediately on mount
    updateHeartbeat();

    // Then every 30 seconds
    const heartbeat = setInterval(updateHeartbeat, 30000);
    return () => clearInterval(heartbeat);
  }, [firestore, room.id, currentUser?.uid, currentUser?.displayName, currentUser?.photoURL, userProfile?.username, userProfile?.avatarUrl]);

  // Initialize Room Tasks Hook
  const { taskProgress, achievedTasks, claimedTasks, claimTask, triggerTask } = useRoomTasks(
    room?.id || 'pending',
    onlineParticipants || [],
    room?.ownerId || '',
    canManageRoom || false
  );

  const onlineCount = useMemo(() => {
    return onlineParticipants.length || 0;
  }, [onlineParticipants]);

  // RECENT VISIT TRACKING (For "Me" Section)
  useEffect(() => {
    if (!firestore || !currentUser?.uid || !room.id) return;

    const recordVisit = async () => {
      const recentRef = doc(firestore, 'users', currentUser.uid, 'recentVisits', room.id);
      await setDocumentNonBlocking(recentRef, {
        id: room.id,
        title: room.title || 'Room',
        coverUrl: room.coverUrl || '',
        roomNumber: room.roomNumber || '0000',
        ownerId: room.ownerId || '',
        participantCount: onlineCount || 1,
        visitedAt: serverTimestamp()
      }, { merge: true });
    };

    recordVisit();
  }, [firestore, currentUser?.uid, room.id, room.title, room.coverUrl, room.roomNumber, room.ownerId, onlineCount]);


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
      const pRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
      updateDocumentNonBlocking(pRef, { activeEmoji: null });
    }, 3000);

    return () => clearTimeout(clearTimer);
  }, [currentUserParticipant?.activeEmoji, firestore, room.id, currentUser?.uid]);

  // --- REAL-TIME VOICE CAPTIONS ENGINE (FIXED v2) ---
  // Use a ref to avoid stale closure in onend/onerror callbacks
  const isCaptionsEnabledRef = useRef(false);
  useEffect(() => { isCaptionsEnabledRef.current = isCaptionsEnabled; }, [isCaptionsEnabled]);

  useEffect(() => {
    isCaptionsEnabledRef.current = isCaptionsEnabled;
    if (!isCaptionsEnabled || !isHydrated) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Captions] Speech Recognition not supported.');
      toast({ variant: 'destructive', title: 'Live Subtitles Unavailable', description: 'Captions require Chrome or Edge browser.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.name === targetLanguage);
    recognition.lang = selectedLang?.locale || 'hi-IN';

    recognition.onresult = (event: any) => {
      if (!firestore || !room.id || !currentUser?.uid) return;

      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }

      const textToShow = finalTranscript || interimTranscript;
      if (!textToShow.trim()) return;

      const now = Date.now();

      // Show immediately locally
      setRoomCaptions(prev => ({
        ...prev,
        [currentUser.uid]: {
          text: textToShow,
          name: userProfile?.username || 'Me',
          timestamp: now,
          emoji: '🗣️'
        }
      }));

      // Broadcast to all room members via Firestore
      const captionRef = doc(firestore, 'chatRooms', room.id, 'captions', currentUser.uid);
      setDocumentNonBlocking(captionRef, {
        text: textToShow,
        name: userProfile?.username || 'User',
        timestamp: now
      }, { merge: true });
    };

    recognition.onerror = (event: any) => {
      console.error('[Captions] Error:', event.error);
      if (event.error === 'not-allowed') {
        toast({ variant: 'destructive', title: 'Mic Access Denied', description: 'Live captions ke liye microphone permission chahiye.' });
      } else if (event.error === 'no-speech') {
        // Silent — no speech detected is normal
      } else {
        toast({ variant: 'destructive', title: 'Captions Error', description: `Speech recognition error: ${event.error}` });
      }
    };

    // KEY FIX: Use ref instead of state variable to avoid stale closure
    recognition.onend = () => {
      if (isCaptionsEnabledRef.current) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) { console.warn('[Captions] Start failed:', e); }

    return () => {
      isCaptionsEnabledRef.current = false;
      try { recognition.stop(); } catch(e) {}
      recognitionRef.current = null;
    };
  }, [isCaptionsEnabled, isHydrated, firestore, room.id, currentUser?.uid, userProfile?.username, targetLanguage]);

  // SYNC: Listen for all captions in the room (FIXED — no blocking AI calls)
  useEffect(() => {
    if (!firestore || !room.id || !isCaptionsEnabled) return;

    const captionsRef = collection(firestore, 'chatRooms', room.id, 'captions');
    const unsubscribe = onSnapshot(captionsRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const uid = change.doc.id;
        // Now processing all users for synchronization

        if (change.type === 'added' || change.type === 'modified') {
          // Show caption IMMEDIATELY — don't block on async AI calls
          setRoomCaptions(prev => ({
            ...prev,
            [uid]: {
              text: data.text,
              name: data.name,
              timestamp: data.timestamp,
              emoji: '🗣️'
            }
          }));

          // Clear caption after 5 seconds
          setTimeout(() => {
            setRoomCaptions(prev => {
              const next = { ...prev };
              if (next[uid]?.timestamp === data.timestamp) delete next[uid];
              return next;
            });
          }, 5000);

          // Run AI emotion/translation in background (doesn't block display)
          try {
            const moodData = await detectEmotion(data.text);
            const translatedText = await translateMessage(data.text, targetLanguage);
            
            setRoomCaptions(prev => {
              if (!prev[uid] || prev[uid].timestamp !== data.timestamp) return prev;
              return { 
                ...prev, 
                [uid]: { 
                  ...prev[uid], 
                  text: translatedText || data.text,
                  emotion: moodData.emotion, 
                  emoji: moodData.emoji 
                } 
              };
            });
          } catch (e) {}
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, room.id, isCaptionsEnabled, currentUser?.uid, targetLanguage]);


  // ============================================================
  // ROOM LOGIC ENGINE (OWNER ONLY) - Daily stats reset (OPTIMIZED)
  // Rocket progression is handled by the Wafa/Haza engine below (line ~1441)
  // Check once on mount + hourly instead of every 3s
  // ============================================================
  useEffect(() => {
    if (!isOwner || !firestore || !room.id) return;

    const checkAndReset = () => {
      const today = getTodayString();
      if (room.stats?.lastWealthResetDate !== today) {
        updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
          'stats.dailyGifts': 0,
          'stats.lastWealthResetDate': today
        });
      }
    };

    checkAndReset();
    const engineInterval = setInterval(checkAndReset, 3600000);

    return () => clearInterval(engineInterval);
  }, [isOwner, room.id, room.stats?.lastWealthResetDate, firestore]);

  // --- THEME SYNC: Full-Bleed Status Bar & Shell Alignment ---
  const activeRoomTheme = useMemo(() => {
    return ROOM_THEMES.find(t => t.id === room.roomThemeId) || ROOM_THEMES[0];
  }, [room.roomThemeId]);
  
  const themeSyncColor = useMemo(() => {
    // Priority: Room specific accent color -> Black (for most room themes)
    return activeRoomTheme?.accentColor || '#030014';
  }, [activeRoomTheme]);

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

  // ALL HOOKS ABOVE THIS LINE - NO CONDITIONAL RETURNS BEFORE THIS
  // --- DEFENSIVE GUARD: If room is not yet fully available, show loader ---
  if (!room || !room.id) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <Loader className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // ============================================================
  // MUSIC CONTROL HANDLERS (Master/Mod Only)
  // ============================================================
  const handleToggleMusic = async () => {
    if (!canManageRoom || !firestore || !room.id) return;
    
    // If no music is currently set, open the library
    if (!room.currentMusicUrl) {
      setIsRoomPlayOpen(true);
      return;
    }

    const roomRef = doc(firestore, 'chatRooms', room.id);
    const newPlayingState = !room.isMusicPlaying;
    
    try {
      await updateDocumentNonBlocking(roomRef, {
        isMusicPlaying: newPlayingState,
        musicUpdatedBy: currentUser?.uid || '',
        // When resuming, reset the start timestamp to 'Now' but keep the offset
        musicStartedAt: newPlayingState ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });
    } catch (e) {}
  };

  const handleStopMusic = async () => {
    if (!canManageRoom || !firestore || !room.id) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    try {
      await updateDocumentNonBlocking(roomRef, {
        currentMusicUrl: '',
        currentMusicTitle: '',
        currentMusicId: '',
        isMusicPlaying: false,
        musicStartedAt: null,
        musicStartOffset: 0,
        musicUpdatedBy: '',
        updatedAt: serverTimestamp()
      });
      toast({ title: '⏹️ Music Stopped' });
    } catch (e) {}
  };

  const handleNextMusic = async () => {
    if (!firestore || !room.id) return;
    if (roomMusicLibrary.length === 0) {
      toast({ title: 'Library Empty', description: 'Upload songs to the Room Library first.', variant: 'destructive' });
      return;
    }
    const currentId = room?.currentMusicId;
    const curIdx = roomMusicLibrary.findIndex(t => t.id === currentId);
    let nextIdx = 0;
    if (curIdx !== -1) {
      nextIdx = (curIdx + 1) % roomMusicLibrary.length;
    }
    const nextTrack = roomMusicLibrary[nextIdx];
    if (nextTrack) {
      const roomRef = doc(firestore, 'chatRooms', room.id);
      await updateDocumentNonBlocking(roomRef, {
        currentMusicUrl: nextTrack.url,
        currentMusicTitle: nextTrack.name,
        currentMusicId: nextTrack.id,
        isMusicPlaying: true,
        musicStartedAt: serverTimestamp(),
        musicStartOffset: 0,
        musicUpdatedBy: currentUser?.uid || '',
        updatedAt: serverTimestamp()
      });
    }
  };

  const handlePreviousMusic = async () => {
    if (!firestore || !room.id) return;
    if (roomMusicLibrary.length === 0) {
      toast({ title: 'Library Empty', description: 'Upload songs to the Room Library first.', variant: 'destructive' });
      return;
    }
    const curIdx = roomMusicLibrary.findIndex(t => t.id === room?.currentMusicId);
    let prevIdx = curIdx === -1 ? roomMusicLibrary.length - 1 : curIdx - 1;
    if (prevIdx < 0) prevIdx = roomMusicLibrary.length - 1;
    const prevTrack = roomMusicLibrary[prevIdx];
    if (prevTrack) {
      const roomRef = doc(firestore, 'chatRooms', room.id);
      await updateDocumentNonBlocking(roomRef, {
        currentMusicUrl: prevTrack.url,
        currentMusicTitle: prevTrack.name,
        currentMusicId: prevTrack.id,
        isMusicPlaying: true,
        musicStartedAt: serverTimestamp(),
        musicStartOffset: 0,
        musicUpdatedBy: currentUser?.uid || '',
        updatedAt: serverTimestamp()
      });
    }
  };

  const handleSeekMusic = async (seconds: number) => {
    if (!canManageRoom && !isAppCreator || !firestore || !room.id || !musicAudioRef.current) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    try {
      await updateDocumentNonBlocking(roomRef, {
        musicStartOffset: seconds,
        musicStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {}
  };

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
      triggerTask('follow_1');
      triggerTask('follow_10');
    }
  };

  // AI MODERATION ACTIONS (GRAND MANAGER)
  const handleAIClearChat = async () => {
    if (!firestore || !room.id || !canManageRoom) return;
    try {
      // PERSISTENT CLEAN: Update room document to hide historical messages
      await updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
        chatClearedAt: serverTimestamp()
      });
      // toast({ title: 'AI: Chat Cleared ✨🧹' });
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
      setIsRoomGamesOpen(false); // Close menu if we are jumping into a game
    } else if (lowerSlug.includes('open') || lowerSlug.includes('menu')) {
      setIsRoomGamesOpen(true);
      // toast({ title: 'AI: Opening Games Hub! 🎮✨' });
    }
  };

  const handleAIOpenMusic = () => {
    setIsRoomPlayOpen(true);
    // toast({ title: 'AI: Opening Music Player 🎵✨' });
  };

  // AI VOICE ENGINE (TTS) logic

  const speakAIText = async (text: string) => {
    if (!isAIVoiceEnabled || isSpeakerMuted || typeof window === 'undefined') return;

    const cleanText = text
      .replace(/\[CMD:.*?\]/g, '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF])/g, '')
      .normalize("NFKD") // Standardize Unicode characters
      .toLowerCase() // Prevent ALL CAPS spelling
      .replace(/\s+/g, ' ')
      .trim();

    const hasHindi = /[\u0900-\u097F]/.test(cleanText);
    // Use hi-IN for Devanagari, and en-IN for Hinglish/English (better Indian accent)
    const lang = hasHindi ? 'hi-IN' : 'en-IN';

    // NATIVE CAPACITOR TTS
    if (Capacitor.isNativePlatform()) {
      try {
        setIsAISpeaking(true);
        await TextToSpeech.speak({
          text: cleanText,
          lang: lang,
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
        });
        setIsAISpeaking(false);
      } catch (e) {
        console.error("Native TTS Failed:", e);
        setIsAISpeaking(false);
      }
      return;
    }

    // BROWSER TTS FALLBACK
    if (!window.speechSynthesis) return;

    // Store text for the post-handshake process
    (window as any)._pendingSpeechText = cleanText;
    (window as any)._pendingSpeechLang = lang;

    // AUDIO CONTEXT CHECK: Ensure it's active
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // SLAVE AUDIO TRIGGER: Gently poke the media engine to prevent Bluetooth disconnect
    if (aiSilentAudioRef.current) {
      aiSilentAudioRef.current.play().catch(() => {});
    }

    // VOICE WARM-UP: Force intensive handshaking for native wrappers
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Tiny delay after cancel often helps mobile engines recover
    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        processSpeech();
      } catch (e) {
        console.error("Speech Resume Failed:", e);
      }
    }, 50);
  };

  const processSpeech = () => {
    const cleanText = (window as any)._pendingSpeechText || "";
    const lang = (window as any)._pendingSpeechLang || 'en-IN';
    if (!cleanText) return;

    setIsAISpeaking(true);
    const hasHindi = lang === 'hi-IN';

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtteranceRef.current = utterance; // KEEP REFERENCE TO PREVENT GC

    // Pre-set language to guide the voice selection engine
    utterance.lang = lang;

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

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsAISpeaking(false);
      currentUtteranceRef.current = null;
      // Retry once if it was a 'not-allowed' or 'interrupted' error
      if (e.error === 'not-allowed') {
        window.speechSynthesis.resume();
      }
    };

    utterance.onend = () => {
      setIsAISpeaking(false);
      currentUtteranceRef.current = null;
    };

    // FINAL RESILIENCE: Cancel any stuck speech before starting new one
    window.speechSynthesis.cancel();
    
    // Tiny delay after cancel helps engines prepare
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
      // FORCE RESUME: Essential for Android Chrome
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 10);
  };

  // AI VOICE INTERACTION (STT)
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
    // DYNAMIC LANG: Check user profile country, default to Hindi (India)
    const userCountry = userProfile?.country || 'IN';
    recognition.lang = userCountry === 'AE' ? 'ar-AE' : userCountry === 'US' ? 'en-US' : 'hi-IN';
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

  const handleAIToggleVoice = () => {
    const newVal = !isAIVoiceEnabled;
    setIsAIVoiceEnabled(newVal);
    toast({ title: `AI Voice ${newVal ? 'Enabled' : 'Muted'} 🎤` });
    
    // Instantly kill any ongoing speech
    if (!newVal) {
      if (Capacitor.isNativePlatform()) {
        TextToSpeech.stop().catch(() => {});
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsAISpeaking(false);
    }
  };

  const toggleAIVoice = () => {
    const nextValue = !isAIVoiceEnabled;
    setIsAIVoiceEnabled(nextValue);
    localStorage.setItem('ummy_ai_voice_enabled', String(nextValue));

    // BROWSER HANDSHAKE: Prime the engine on first interaction
    if (nextValue) {
      if (!Capacitor.isNativePlatform()) {
        // Robust Warmup: Trigger silent speech first
        const warmUp = new SpeechSynthesisUtterance("");
        warmUp.volume = 0;
        window.speechSynthesis.speak(warmUp);
      }
      
      // Delay slightly to ensure browser registers the gesture before real speech
      setTimeout(() => {
        speakAIText("Ummy AI Voice enabled! Main ab bol kar bhi aapki madad karungi! 💖");
      }, 150);
    } else {
      if (Capacitor.isNativePlatform()) {
        TextToSpeech.stop().catch(() => {});
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsAISpeaking(false);
      toast({ title: 'AI Voice Disabled' });
    }
  };


  // CHAT AUTO-SCROLL LOGIC - REMOVED DUPLICATE IN FAVOR OF LINE 365

  const handleAIEngine = async (msg: any) => {
    if (!firestore || !room.id || !msg.content) return;
    const content = msg.content.toLowerCase();

    // 1. AI PROFANITY SHIELD (Moderation - Background Monitoring)
    const moderation = await moderateMessage(content);
    const isBad = moderation && !moderation.isSafe;

    if (isBad) {
      const currentStrikes = (warningCounts.current[msg.senderId] || 0) + 1;
      warningCounts.current[msg.senderId] = currentStrikes;

      if (currentStrikes < 3) {
        // Send Warning
        await addDocumentNonBlocking(collection(firestore, 'chatRooms', room.id, 'messages'), {
          content: `@${msg.senderName}, aapke shabd niyam ke khilaf hain! please sudhar jao. (Reason: ${moderation.reason || 'Abusive Content'}) (Warning ${currentStrikes}/3) 🛡️`,
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
            // toast({ title: 'Sovereign Master', description: 'Purifying chat stream...' });
          }
        } else if (upperResponse.includes('[CMD:MUTE:')) {
          const username = aiResponse.match(/\[CMD:MUTE:(.*?)\]/i)?.[1];
          if (username && isAdminAction) {
            const target = onlineParticipants.find(p => p.name?.toLowerCase() === username.toLowerCase());
            if (target) {
              handleSilence(target.uid, false);
              // toast({ title: 'Sovereign Master', description: `Silence enforced on ${username}.` });
            }
          }
        } else if (upperResponse.includes('[CMD:UNMUTE:')) {
          const username = aiResponse.match(/\[CMD:UNMUTE:(.*?)\]/i)?.[1];
          if (username && isAdminAction) {
            const target = onlineParticipants.find(p => p.name?.toLowerCase() === username.toLowerCase());
            if (target) {
              handleSilence(target.uid, true);
              // toast({ title: 'Sovereign Master', description: `Voice restored to ${username}.` });
            }
          }
        } else if (upperResponse.includes('[CMD:KICK:')) {
          const username = aiResponse.match(/\[CMD:KICK:(.*?)\]/i)?.[1];
          if (username && isAdminAction) {
            const target = onlineParticipants.find(p => p.name?.toLowerCase() === username.toLowerCase());
            if (target) {
              // Check if AI command can kick this user (follow same hierarchy)
              const isAppCreator = currentUser?.uid === '901piBzTQ0VzCtAvlyyobwvAaTs1';
              const targetIsRoomOwner = target.uid === room.ownerId;
              const targetIsAppCreator = target.uid === '901piBzTQ0VzCtAvlyyobwvAaTs1';

              if (targetIsAppCreator) {
                toast({ variant: 'destructive', title: 'Permission Denied', description: 'App Creator cannot be kicked!' });
              } else if (targetIsRoomOwner && !isAppCreator) {
                toast({ variant: 'destructive', title: 'Permission Denied', description: 'Room Owner cannot be kicked by Admins!' });
              } else {
                handleKick(target.uid, 60);
                // toast({ title: 'Sovereign Master', description: `${username} has been banished.` });
              }
            }
          }
        } else if (upperResponse.includes('[CMD:LOCK:')) {
          const seatNum = aiResponse.match(/\[CMD:LOCK:(\d+)\]/i)?.[1];
          if (seatNum && isAdminAction) {
            const index = parseInt(seatNum);
            if (!room.lockedSeats?.includes(index)) {
              handleAILockSeat(index);
              // toast({ title: 'Sovereign Master', description: `Seat ${index + 1} secured.` });
            }
          }
        } else if (upperResponse.includes('[CMD:UNLOCK:')) {
          const seatNum = aiResponse.match(/\[CMD:UNLOCK:(\d+)\]/i)?.[1];
          if (seatNum && isAdminAction) {
            const index = parseInt(seatNum);
            if (room.lockedSeats?.includes(index)) {
              handleAILockSeat(index);
              // toast({ title: 'Sovereign Master', description: `Seat ${index + 1} released.` });
            }
          }
        } else if (upperResponse.includes('[CMD:JAR:OPEN]') || upperResponse.includes('[CMD:TASKS:OPEN]') || upperResponse.includes('JAR KHOL') || upperResponse.includes('OPEN JAR')) {
          if (isAdminAction) {
            setIsRoomTasksOpen(true);
            // toast({ title: 'Sovereign Master', description: 'Opening the Golden Task Jar... ✨' });
          } else {
            speakAIText("Maafi chahti hoon, par ye adhikar sirf Room Owner ke paas hai.");
          }
        } else if (upperResponse.includes('[CMD:GAMES:OPEN]')) {
          if (isAdminAction) {
            setIsRoomGamesOpen(true);
            // toast({ title: 'Sovereign Master', description: 'Opening the Games Library... 🎮' });
          }
        } else if (upperResponse.includes('[CMD:GAME:')) {
          const slug = aiResponse.match(/\[CMD:GAME:(.*?)\]/i)?.[1];
          if (slug) {
            handleAIOpenGame(slug);
            // toast({ title: 'Sovereign Master', description: `Initializing ${slug} frequency...` });
          }
        } else if (upperResponse.includes('[CMD:MUSIC:OPEN]')) {
          if (isAdminAction) {
            handleAIOpenMusic();
            // toast({ title: 'Sovereign Master', description: 'Synchronizing music hub...' });
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


  const handleSendMessage = async (e?: React.FormEvent, imageUrl?: string, transcription?: string) => {
    if (e) e.preventDefault();
    const content = transcription || messageText;
    if ((!content.trim() && !imageUrl) || !currentUser || !firestore || !userProfile) return;

    if (isChatMuted && !canManageRoom) {
      toast({ variant: 'destructive', title: 'Chat Restricted', description: 'The room authority has disabled public messages.' });
      return;
    }

    // AI MODERATION CHECK (Proactive)
    if (content.trim()) {
      const moderation = await moderateMessage(content);
      if (moderation && !moderation.isSafe) {
        toast({ 
          variant: 'destructive', 
          title: 'Message Blocked 🛡️', 
          description: moderation.reason || 'Aapka message niyam ke khilaf hai.' 
        });
        return;
      }
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

  const handleTranslate = async (messageId: string, text: string) => {
    if (translatingId) return;
    setTranslatingId(messageId);
    try {
      const result = await translateMessage(text, targetLanguage);
      if (result) {
        setTranslations(prev => ({ ...prev, [messageId]: result }));
      } else {
        toast({ title: 'Translation Failed', description: 'Kuch galat hua. Phir se koshish karein.' });
      }
    } finally {
      setTranslatingId(null);
    }
  };



  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !currentUser || !room.id) return;

    setIsUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storagePath = `rooms/${room.id}/chat/${timestamp}_${file.name}`;
      const sRef = storageRef(storage, storagePath);
      const result = await uploadBytes(sRef, file);
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
    router.push('/rooms'); // Minimize should go to Home (/rooms)
  };

  const handleExit = () => {
    if (onExit) onExit();

    // Set active and minimized room to null - RoomPresenceManager will handle the database cleanup safely and uniquely
    setActiveRoom(null);
    setMinimizedRoom(null);
    router.push('/rooms');

    // NATIVE ROUTE RESET: Restore normal audio focus on exit
    const AudioRoute = (window as any).Capacitor?.Plugins?.AudioRoute;
    if (AudioRoute) {
      AudioRoute.resetAudio().catch(() => {});
    }

  };

  // YOUTUBE HIDE/CLOSE HANDLERS
  const handleCloseYouTubeForAll = async () => {
    if (!isOwner && !isModerator) return;
    
    if (firestore && room.id) {
      try {
        const youtubeRef = doc(firestore, 'chatRooms', room.id, 'youtube', 'state');
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(youtubeRef);
      } catch (e) {
        console.error('[YouTube] Failed to close for all:', e);
      }
    }
    
    setIsYouTubeOpen(false);
    setIsYouTubeHidden(false);
  };

  const handleYouTubeOpenChange = (open: boolean) => {
    if (!open && !isOwner && !isModerator) {
      // User closing = hide for them only
      setIsYouTubeHidden(true);
    } else {
      setIsYouTubeOpen(open);
      if (open) {
        setIsYouTubeHidden(false);
      }
    }
  };

  // MOVIE HANDLERS
  const handlePlayMovieForRoom = async (movie: TMDBMovie) => {
    if (!firestore || !room.id || !currentUser?.uid) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    await updateDocumentNonBlocking(roomRef, {
      currentMovie: {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        startedAt: serverTimestamp(),
        startedBy: currentUser.uid,
      },
      updatedAt: serverTimestamp(),
    });
    setSelectedMovie({ tmdbId: movie.id, title: movie.title, posterPath: movie.poster_path || null });
    setIsMoviePlayerOpen(true);
    setIsMoviesOpen(false);
    toast({ title: 'Movie Mirror Synced', description: `${movie.title} is now playing for the room.` });
  };

  const handleWatchPersonal = (movie: TMDBMovie) => {
    setSelectedMovie({ tmdbId: movie.id, title: movie.title, posterPath: movie.poster_path || null, mediaType: 'movie' });
    setIsMoviePlayerOpen(true);
    setIsMoviesOpen(false);
  };

  // TV SHOW HANDLERS
  const handleWatchTVPersonal = (show: any, season: number, episode: number, episodeName?: string) => {
    setSelectedMovie({ tmdbId: show.id, title: show.name, posterPath: show.poster_path || null, mediaType: 'tv', season, episode, episodeName });
    setIsMoviePlayerOpen(true);
    setIsMoviesOpen(false);
  };

  const handlePlayTVForRoom = async (show: any, season: number, episode: number, episodeName?: string) => {
    if (!firestore || !room.id || !currentUser?.uid) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    await updateDocumentNonBlocking(roomRef, {
      currentMovie: {
        tmdbId: show.id,
        title: `${show.name} S${season}E${episode}`,
        posterPath: show.poster_path || null,
        startedAt: serverTimestamp(),
        startedBy: currentUser.uid,
        mediaType: 'tv',
        season,
        episode,
      },
      updatedAt: serverTimestamp(),
    });
    setSelectedMovie({ tmdbId: show.id, title: show.name, posterPath: show.poster_path || null, mediaType: 'tv', season, episode, episodeName });
    setIsMoviePlayerOpen(true);
    setIsMoviesOpen(false);
    toast({ title: '📺 Series Synced', description: `${show.name} S${season}E${episode} is now playing for the room.` });
  };

  const handleJoinRoomMovie = () => {
    if (roomMovie) {
      setSelectedMovie({ tmdbId: roomMovie.tmdbId, title: roomMovie.title, posterPath: roomMovie.posterPath });
      setIsMoviePlayerOpen(true);
      setIsMoviesOpen(false);
    }
  };

  const handleStopRoomMovie = async () => {
    if (!firestore || !room.id || !canManageRoom) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    await updateDocumentNonBlocking(roomRef, {
      currentMovie: null,
      updatedAt: serverTimestamp(),
    });
    toast({ title: 'Movie Mirror Stopped', description: 'Movie playback ended for the room.' });
  };

  // // NETMIRROR WATCH TOGETHER HANDLERS
  // const handleOpenNetMirrorWatch = useCallback((movieUrl?: string, movieTitle?: string) => {
  //   setIsNetMirrorOpen(false);
  //   setIsNetMirrorPlayerOpen(true);
  //   if (movieUrl || movieTitle) {
  //     setNetMirrorSession({
  //       movieTitle: movieTitle || 'NetMirror',
  //       movieUrl: movieUrl,
  //       startedBy: currentUser?.name || currentUser?.uid || 'Host',
  //       isActive: true,
  //     });
  //   }
  // }, [currentUser]);

  // const handleCloseNetMirrorWatch = useCallback(() => {
  //   setIsNetMirrorWatchOpen(false);
  // }, []);

  // const handleJoinNetMirror = useCallback(() => {
  //   setIsNetMirrorPlayerOpen(true);
  //   toast({
  //     title: 'NetMirror',
  //     description: 'Opening in-room player...',
  //   });
  // }, [toast]);

  // const handleDismissNetMirrorIndicator = useCallback(() => {
  //   setNetMirrorSession(null);
  // }, []);

  // AUTO-DISABLE MOVIES WHEN YOUTUBE STARTS
  useEffect(() => {
    if (isYouTubeOpen && isMoviePlayerOpen) {
      setIsMoviePlayerOpen(false);
      toast({
        title: 'Movie Mirror Paused',
        description: 'YouTube is now active. Movie has been paused.',
      });
    }
  }, [isYouTubeOpen, isMoviePlayerOpen]);


  const handleSilence = (uid: string, current: boolean) => {
    if (!firestore || !room.id) return;
    if (!canManageRoom && !isAppCreator) return;
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { isSilenced: !current, isMuted: !current });

    // If muting this user, also stop their music
    if (!current && uid === currentUser?.uid && musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
      setIsMusicPlaying(false);
      // toast({ title: 'Music Stopped', description: 'Admin has muted you' });
    }
  };

  const handleKick = (uid: string, duration: number) => {
    if (!firestore || !room.id || !currentUser?.uid) return;

    // PERMISSION HIERARCHY CHECK
    const targetUser = onlineParticipants.find(p => p.uid === uid);
    const isAppCreator = currentUser?.uid === '901piBzTQ0VzCtAvlyyobwvAaTs1';
    const isRoomOwner = currentUser?.uid === room.ownerId;
    const targetIsRoomOwner = uid === room.ownerId;
    const targetIsAppCreator = uid === '901piBzTQ0VzCtAvlyyobwvAaTs1';

    // RULES:
    // 1. App Creator cannot be kicked by anyone
    // 2. Room Owner cannot be kicked by Admins (only App Creator can kick Room Owner)
    // 3. Admins can kick normal users
    // 4. Room Owner can kick normal users and Admins (but not other Room Owners)

    if (targetIsAppCreator) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'App Creator cannot be kicked!' });
      return;
    }

    if (targetIsRoomOwner && !isAppCreator) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Room Owner cannot be kicked by Admins!' });
      return;
    }

    if (!isRoomOwner && !isAppCreator && !room.moderatorIds?.includes(currentUser.uid)) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only Admins and Room Owner can kick users!' });
      return;
    }

    const expires = new Date(Date.now() + duration * 60000);
    setDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'bans', uid), { expiresAt: Timestamp.fromDate(expires) }, { merge: true });
    deleteDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid));
    toast({ title: 'Member Excluded', description: `${targetUser?.name || 'User'} restricted for ${duration} minutes.` });
    setIsUserProfileCardOpen(false);
    setIsSeatMenuOpen(false);
  };

  const handleLeaveSeat = (uid: string) => {
    if (!firestore || !room.id || !currentUser?.uid) return;

    // --- PERMISSION HIERARCHY CHECK ---
    const isSelf = uid === currentUser.uid;
    const isAppCreator = currentUser?.uid === '901piBzTQ0VzCtAvlyyobwvAaTs1';
    const isRoomOwner = currentUser?.uid === room.ownerId;
    const targetIsRoomOwner = uid === room.ownerId;
    const targetIsAppCreator = uid === '901piBzTQ0VzCtAvlyyobwvAaTs1';
    const amModerator = room.moderatorIds?.includes(currentUser.uid) || false;
    const targetIsModerator = room.moderatorIds?.includes(uid) || false;

    // Allowed if: It's yourself, OR you are App Creator, OR you are Owner (can kick anyone except creator), OR you are Admin (can kick normal users)
    let canPerform = isSelf || isAppCreator;

    if (!canPerform) {
      if (targetIsAppCreator) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'App Creator cannot be removed from seat!' });
        return;
      }
      if (isRoomOwner && !targetIsAppCreator) {
        canPerform = true;
      } else if (amModerator && !targetIsRoomOwner && !targetIsModerator) {
        canPerform = true;
      }
    }

    if (!canPerform) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have authority to unseat this member.' });
      return;
    }

    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id, 'participants', uid), { seatIndex: 0, isMuted: true });
    setIsSeatMenuOpen(false);
    setIsUserProfileCardOpen(false);
    if (!isSelf) {
      const targetUser = onlineParticipants.find(p => p.uid === uid);
      toast({ title: 'User Unseated', description: `${targetUser?.name || 'Member'} has been removed from the seat.` });
    }
  };

  const handleTakeSeat = (seatIndex: number) => {
    if (!firestore || !room.id || !currentUser?.uid) return;

    const isSeatMuted = room.mutedSeats?.includes(seatIndex) || false;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    setDocumentNonBlocking(participantRef, {
      seatIndex: seatIndex,
      isMuted: isSeatMuted, // Auto-mute if seat is muted
      name: userProfile?.username || currentUser.displayName || 'Member',
      avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || null,
      accountNumber: userProfile?.accountNumber || '',
      gender: userProfile?.gender || 'male',
      uid: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // toast({
    //   title: 'Seat Taken',
    //   description: isSeatMuted ? `Seat #${seatIndex} is muted. Unmute to speak.` : `You are now on mic at seat #${seatIndex}`
    // });
    setIsSeatMenuOpen(false);
  };

  const handleToggleSeatMute = (seatIdx: number, currentMuted: boolean) => {
    if (!firestore || !room.id) return;
    if (!canManageRoom && !isAppCreator) return;

    const roomRef = doc(firestore, 'chatRooms', room.id);
    setDocumentNonBlocking(roomRef, {
      mutedSeats: currentMuted ? arrayRemove(seatIdx) : arrayUnion(seatIdx),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // toast({ title: currentMuted ? 'Seat Unmuted' : 'Seat Muted', description: `Seat #${seatIdx} is now ${currentMuted ? 'unmuted' : 'muted'}` });
    setIsSeatMenuOpen(false);
  };

  const handleToggleLock = (seatIdx: number, isLocked: boolean) => {
    if (!firestore || !room.id || !canManageRoom) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    setDocumentNonBlocking(roomRef, {
      lockedSeats: isLocked ? arrayRemove(seatIdx) : arrayUnion(seatIdx),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // toast({ title: isLocked ? 'Mic Unlocked' : 'Mic Locked', description: `Seat #${seatIdx} is now ${isLocked ? 'open' : 'restricted'}` });
    setIsSeatMenuOpen(false);
  };

  const handleToggleMod = (uid: string) => {
    if (!firestore || !room.id || !canManageRoom) return;
    const isCurrentlyMod = room.moderatorIds?.includes(uid);
    updateDocumentNonBlocking(doc(firestore, 'chatRooms', room.id), {
      moderatorIds: isCurrentlyMod ? arrayRemove(uid) : arrayUnion(uid)
    });
  };

  const handleInputClick = () => {
    // Bless music audio context on any main footer interaction
    if (musicAudioRef.current?.paused && room.isMusicPlaying) {
      musicAudioRef.current.play().catch(() => {});
    }

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
          // Stream capture for broadcasting is disabled
        }).catch(e => {
          console.warn('[Music] Play failed:', e);
          toast({ variant: 'destructive', title: 'Playback Failed', description: 'Please interact with the page to allow audio.' });
        });
      }
    }
  };

  // Music system control logic removed

  // Music management functions and progress tracking removed


  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const isAnyDialogShowing = isEmojiPickerOpen || isGiftPickerOpen || /* isRocketOpen || */ 
    isRoomTasksOpen || isUserProfileCardOpen || isRoomSettingsOpen || 
    isRoomInfoOpen || isUserListOpen || isShareOpen || isSeatMenuOpen || 
    isRoomPlayOpen || isRoomGamesOpen || isMessagesOpen || isFollowersOpen || 
    isAudienceInviteOpen || showExitDialog || showMicInviteDialog || showSoundboard ||
    isRoomSupportOpen || isRoomSupportersOpen || isSpinOpen || isChestOpen;

  return (
    <div className="relative flex flex-col h-[100dvh] w-full max-w-[500px] mx-auto bg-transparent overflow-hidden text-white font-headline shadow-[0_0_100px_rgba(0,0,0,0.8)] border-x border-white/5 overscroll-none">
      <ThemeColorMeta color={currentTheme.accentColor || "#1a0b2e"} />
      <ThemeSync color={themeSyncColor} />
      <DailyRewardDialog />
      <ExitRoomDialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onMinimize={handleMinimize}
        onConfirmExit={handleExit}
      />
        {/* DISABLED: Rocket Dialog
        <RocketDialog
          open={isRocketOpen}
          onOpenChange={setIsRocketOpen}
          currentExp={room.rocket?.progress || 0}
          roomName={room.title}
        />
        */}
      <RoomTasksDialog
        open={isRoomTasksOpen}
        onOpenChange={setIsRoomTasksOpen}
        taskProgress={taskProgress}
        achievedTasks={achievedTasks}
        claimedTasks={claimedTasks}
        onClaim={claimTask}
        totalRoomGifts={room.stats?.totalGifts || 0}
      />
      <RoomSupportDialog
        open={isRoomSupportOpen}
        onOpenChange={setIsRoomSupportOpen}
        roomStats={room.stats}
        visitorCount={onlineCount}
        levelPoints={room.levelPoints || 0}
      />
      <RoomTopSupportersDialog
        open={isRoomSupportersOpen}
        onOpenChange={setIsRoomSupportersOpen}
        roomId={room.id}
      />
      <RoomLuckySpinDialog
        open={isSpinOpen}
        onOpenChange={setIsSpinOpen}
      />
      <RoomGoldenChestDialog
        open={isChestOpen}
        onOpenChange={setIsChestOpen}
      />

      <audio 
        ref={aiSilentAudioRef} 
        loop
        src="data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==" 
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
        crossOrigin="anonymous"
        onLoadedMetadata={() => {
          const audio = musicAudioRef.current;
          if (!audio) return;
          // Apply pending seek position from Virtual Clock
          if (pendingSeekTime.current !== null) {
            audio.currentTime = pendingSeekTime.current;
            pendingSeekTime.current = null;
          }
          // Auto-play if room says music is playing
          if (room?.isMusicPlaying) {
            audio.play()
              .then(() => { setIsMusicPlaying(true); setShowMiniPlayer(true); })
              .catch(e => console.warn('[Music] Autoplay blocked after load:', e.name));
          }
        }}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
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
          className={cn(
            "object-cover object-top animate-in fade-in duration-1000",
            (room?.isBrightMode !== false) 
              ? "contrast-[1.1] saturate-[1.5] brightness-[1.1] opacity-100" 
              : "contrast-[1.05] saturate-[1.1] brightness-[0.9] opacity-95"
          )}
          priority
        />

        {/* PREMIUM UI CLARITY OVERLAYS (Vignettes) */}
        {/* Top Vignette (Only in Normal Mode) */}
        {(room?.isBrightMode === false) && (
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10 pointer-events-none transition-all duration-1000" />
        )}

        {/* Bottom Vignette - Conditional Density */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 z-10 pointer-events-none transition-all duration-1000",
            (room?.isBrightMode !== false)
              ? "h-48 bg-gradient-to-t from-black/20 to-transparent" // Bright Mode (Light)
              : "h-96 bg-gradient-to-t from-black/90 via-black/40 to-transparent" // Normal Mode (Deep)
          )} 
        />
      </div>

      {/* SOUNDBOARD OVERLAY */}
      {showSoundboard && (
        <div className="fixed inset-x-0 bottom-24 px-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <RoomSoundboard onTrigger={handleSfxTrigger} />
        </div>
      )}

      {/* FLOAT-RIGHT EVENT BANNERS: HAZA STYLE */}
      {!isAnyDialogShowing && (
        <div className="absolute right-3 bottom-[270px] z-40 animate-in fade-in slide-in-from-right-4 duration-700">
          <RoomBanners 
            onOpenSupport={() => setIsRoomSupportOpen(true)}
            onOpenSpin={() => setIsSpinOpen(true)}
            onOpenChest={() => setIsChestOpen(true)}
          />
        </div>
      )}

      <header className="relative z-[100] flex flex-col w-full px-4 pt-safe pb-1">
        <div className="flex items-center justify-between w-full h-11">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar
              className="h-12 w-12 rounded-xl border border-white/10 shadow-lg cursor-pointer active:scale-95 transition-transform"
              onClick={() => setIsRoomInfoOpen(true)}
            >
              <AvatarImage src={room.coverUrl || undefined} />
              <AvatarFallback>RM</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1 overflow-hidden">
                <h1 className="text-[14px] font-bold text-white tracking-tight leading-none truncate flex-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                  {room.title}
                </h1>
                {(isHydrated && !isOwner) && (
                  <button
                    onClick={handleFollowRoom}
                    className={cn(
                      "h-5 px-1.5 rounded-full flex items-center justify-center gap-1 transition-all active:scale-90 border shrink-0",
                      followData
                        ? "bg-pink-500/20 border-pink-500/40 text-pink-500"
                        : "bg-white/5 border-white/10 text-white/40"
                    )}
                  >
                    <Heart className={cn("h-2.5 w-2.5 transition-transform", followData && "fill-current")} />
                    <span className="text-[7.5px] font-black uppercase tracking-tighter">
                      {followData ? 'Sub' : 'Follow'}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-[9px] font-medium text-white/40 leading-none">
                ID:{room.roomNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">

            <button onClick={() => setIsUserListOpen(true)} className="h-10 w-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center gap-0.5 shadow-lg shadow-black/20">
              <Users className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              <span className="text-[9px] font-bold text-white">{onlineCount}</span>
            </button>
            {(isHydrated && canManageRoom) && (
              <button onClick={() => setIsRoomSettingsOpen(true)} className="h-10 w-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-lg shadow-black/20">
                <Settings className="h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              </button>
            )}
            <button onClick={() => setIsShareOpen(true)} className="h-10 w-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-lg shadow-black/20">
              <Share2 className="h-4 w-4 text-white drop-shadow-[0_0_8_px_rgba(255,255,255,0.4)]" />
            </button>
            <button onClick={() => setShowExitDialog(true)} className="h-10 w-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-lg shadow-black/20">
              <Power className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </button>
          </div>
        </div>

        <RoomTrophyBadge coins={room.stats?.dailyGifts || 0} supporters={supporters} onOpenSupport={() => setIsRoomSupportersOpen(true)} />

        {/* Floating Top-Right Badge (Golden Task Jar) - OWNER ONLY */}
        {(isHydrated && isOwner) && (
          <div className="absolute top-24 right-1 animate-reaction-float z-50">
            <div className="relative group cursor-pointer" onClick={() => setIsRoomTasksOpen(true)}>
              <Image src="/images/golden_task_jar.png" width={64} height={64} alt="Golden Task Jar" className="bg-transparent" />
              {achievedTasks.some(id => !claimedTasks.includes(id)) && (
                <div className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border border-black shadow-lg animate-bounce" />
              )}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col pt-1 overflow-visible min-h-0 w-full -mt-2">
        <div className="shrink-0 flex flex-col items-center gap-0.5 w-full overflow-visible mb-0 mt-0">
          {/* Host Seat (Top Centered) */}
          <div className="w-24">
            <Seat index={1} label="NO.1" theme={currentTheme} occupant={onlineParticipants.find(p => p.seatIndex === 1)} isLocked={room.lockedSeats?.includes(1)} isSeatMuted={room.mutedSeats?.includes(1)} onClick={handleSeatClick} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} customEmojiMap={customEmojiMap} />
          </div>

          {/* 2x4 Grid Seats */}
          <div className="w-full grid grid-cols-4 gap-y-3 px-2">
            {[2, 3, 4, 5, 6, 7, 8, 9].map(idx => (
              <Seat key={idx} index={idx} label={`NO.${idx}`} theme={currentTheme} occupant={onlineParticipants.find(p => p.seatIndex === idx)} isLocked={room.lockedSeats?.includes(idx)} isSeatMuted={room.mutedSeats?.includes(idx)} onClick={handleSeatClick} roomOwnerId={room.ownerId} roomModeratorIds={room.moderatorIds || []} customEmojiMap={customEmojiMap} />
            ))}
          </div>
        </div>





        {/* CHAT & ANNOUNCEMENT SECTION (Wafa-Style) - Starts immediately below seats */}
        <div className="flex-1 w-full overflow-hidden mt-0.5 relative flex flex-col">
          <ScrollArea className="flex-1 w-full max-w-[75%] px-3">
            <div className="flex flex-col gap-1.5 py-2 justify-start min-h-full pb-32">
              {/* SLIM SYSTEM ANNOUNCEMENT: COMPACT & LOW-PROFILE */}
              {(globalConfig?.globalAnnouncement || room.announcement) &&
                (!(room as any).chatClearedAt || ((room as any).chatClearedAt?.toDate?.() || 0) < (sessionJoinTime || new Date())) && (
                  <div className="flex flex-col gap-1 mb-3 px-3 py-1.5 mx-3 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-700 shadow-xl">
                    {globalConfig?.globalAnnouncement && (
                      <p className="text-[11px] font-bold text-white leading-tight tracking-tight">
                        {globalConfig.globalAnnouncement}
                      </p>
                    )}
                    {room.announcement && (
                      <p className="text-[11px] font-medium text-white/80 leading-tight tracking-tight">
                        {room.announcement}
                      </p>
                    )}
                  </div>
                )}
              {/* REAL-TIME SUBTITLES OVERLAY */}
              {isCaptionsEnabled && Object.values(roomCaptions).length > 0 && (
                <div className="fixed bottom-36 left-0 right-0 z-50 px-6 pointer-events-none flex flex-col gap-2 items-center">
                  {Object.values(roomCaptions).map((cap: any, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "backdrop-blur-md px-4 py-2 rounded-2xl border animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-full shadow-2xl transition-colors",
                        cap.emotion === 'happy' ? "bg-yellow-500/20 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]" :
                        cap.emotion === 'angry' ? "bg-red-500/20 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]" :
                        cap.emotion === 'sad' ? "bg-blue-500/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]" :
                        cap.emotion === 'surprised' ? "bg-purple-500/20 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]" :
                        "bg-black/60 border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl drop-shadow-md">{cap.emoji}</span>
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{cap.name}</p>
                          <p className="text-[13px] font-medium text-white leading-tight mt-1">{cap.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
              }).map((msg: any, index: number) => {
                const isMe = msg.senderId === currentUser?.uid;
                return (
                  <div
                    key={msg.id || `msg-${index}`}
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
                    <Avatar 
                      className="h-6 w-6 shrink-0 border border-white/10 shadow-lg mt-1 cursor-pointer active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (msg.senderId) {
                          router.push(`/profile/${msg.senderId}`);
                        }
                      }}
                    >
                      <AvatarImage src={msg.senderAvatar || undefined} />
                      <AvatarFallback className="text-[10px]">{(msg.senderName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-start min-w-0">
                      <span className={cn("text-[9px] font-semibold uppercase tracking-tighter leading-none mb-1 px-1 drop-shadow-[0_1px_1.5px_rgba(0,0,0,1)]", isMe ? "text-primary" : "text-white/85")}>
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
                        {msg.content && (
                          <div className="flex flex-col gap-0.5">
                            <p className="break-words py-0.5">{translations[msg.id] || msg.content}</p>
                            {!translations[msg.id] && msg.content.length > 2 && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTranslate(msg.id, msg.content);
                                }}
                                className="text-[8px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 w-fit flex items-center gap-1 mt-0.5 self-end"
                              >
                                {translatingId === msg.id ? <Loader className="h-2 w-2 animate-spin" /> : <Sparkles className="h-2 w-2" />}
                                {translatingId === msg.id ? 'Translating...' : 'Translate'}
                              </button>
                            )}
                          </div>
                        )}
                        {msg.type === 'gift' && msg.text && (
                          <div className="py-1">
                            <p className="text-yellow-400 font-bold drop-shadow-sm flex items-center gap-1">
                              <Gift className="h-3 w-3" />
                              {msg.text}
                            </p>
                          </div>
                        )}
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

      {/* MINI MUSIC PLAYER - Wafa Style - Show when music is available and mini player is open */}
      {room.currentMusicUrl && showMiniPlayer && (
        <div className="fixed bottom-[140px] left-0 right-0 z-40 px-4">
          <div className="bg-black/95 rounded-2xl p-3 border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.4)] backdrop-blur-xl">
            {/* Song Title */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.6)] border border-blue-400/50">
                <Music className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white truncate">
                  {room.currentMusicTitle || roomMusicLibrary.find(t => t.url === room.currentMusicUrl)?.name || 'Syncing frequency...'}
                </p>
                <p className="text-[9px] text-white/50">
                  {formatTime(musicState.currentTime)} / {formatTime(musicState.duration)}
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

            {/* SeekBar (Owner Seek Control) */}
            <div className="w-full h-8 flex items-center group relative mb-1">
              <input
                type="range"
                min="0"
                max={musicState.duration || 100}
                value={musicState.currentTime}
                onChange={(e) => {
                  if (canManageRoom) {
                    const seekVal = parseFloat(e.target.value);
                    setMusicState(prev => ({ ...prev, currentTime: seekVal }));
                    handleSeekMusic(seekVal);
                  }
                }}
                disabled={!canManageRoom}
                className={cn(
                  "flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer",
                  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full",
                  !canManageRoom && "cursor-not-allowed opacity-50"
                )}
              />
              {/* Tooltip for seeking */}
              <div className="absolute -top-4 right-0 text-[8px] font-bold text-white/40 uppercase tracking-widest">
                {Math.floor(musicState.currentTime / 60)}:{Math.floor(musicState.currentTime % 60).toString().padStart(2, '0')} / {Math.floor(musicState.duration / 60)}:{Math.floor(musicState.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-2 px-2">
              <div className="flex items-center gap-1">
                 {/* Library Button (Four Squares) */}
                <button
                  onClick={() => {
                    setPortalDefaultView('music');
                    setIsRoomPlayOpen(true);
                  }}
                  className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white active:scale-90 transition-all border border-white/5"
                  title="Open Music Library"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                
                {/* Repeat Button */}
                <button
                  onClick={() => setIsRepeatEnabled(!isRepeatEnabled)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isRepeatEnabled ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white"
                  )}
                  title="Toggle Repeat"
                >
                  <Repeat className="h-4 w-4" />
                </button>
              </div>

              {/* Central Audio Control Cluster */}
              <div className="flex items-center gap-3">
                {/* Previous Track */}
                <button
                  onClick={handlePreviousMusic}
                  disabled={!canManageRoom}
                  className="p-2 text-white/40 hover:text-white disabled:opacity-30 active:scale-90 transition-all"
                >
                  <img src="https://img.icons8.com/ios-filled/50/ffffff/previous.png" className="h-5 w-5" />
                </button>

                {/* Central Play/Pause */}
                <button
                  onClick={handleToggleMusic}
                  disabled={!canManageRoom}
                  className="h-12 w-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 active:scale-95 transition-all text-white border border-white/20 disabled:grayscale"
                >
                  {room.isMusicPlaying ? (
                    <img src="https://img.icons8.com/ios-filled/50/ffffff/pause--v1.png" className="h-6 w-6" />
                  ) : (
                    <img src="https://img.icons8.com/ios-filled/50/ffffff/play--v1.png" className="h-6 w-6 ml-1" />
                  )}
                </button>

                {/* Next Track */}
                <button
                  onClick={handleNextMusic}
                  disabled={!canManageRoom}
                  className="p-2 text-white/40 hover:text-white disabled:opacity-30 active:scale-90 transition-all"
                >
                  <img src="https://img.icons8.com/ios-filled/50/ffffff/next.png" className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Volume - Opens popup */}
                <button
                  onClick={() => setShowVolumePopup(true)}
                  className="p-2 rounded-full text-white/60 hover:text-white active:scale-95 transition-all"
                >
                  <Volume2 className="h-5 w-5" />
                </button>

                {/* Stop Music */}
                {canManageRoom && (
                  <button
                    onClick={handleStopMusic}
                    className="p-2 text-red-400/60 hover:text-red-400 active:scale-90 transition-all"
                    title="Stop & Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
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
          <div className="relative z-10 bg-black/95 rounded-2xl p-4 mx-4 w-full max-w-sm border border-white/10 shadow-2xl pointer-events-auto">
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

      {room.currentMusicUrl && !showMiniPlayer && (
        <button
          onClick={() => setShowMiniPlayer(true)}
          className={cn(
            "fixed right-4 bottom-[165px] z-40 p-1 rounded-[1.25rem] transition-all active:scale-95 animate-bounce-slow",
            "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/50"
          )}
        >
          <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center bg-black/20 backdrop-blur-md overflow-hidden border border-white/20">
             {/* Dynamic Aurora Glow */}
             <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-500/30 animate-pulse" />
            
            {room.isMusicPlaying ? (
              <Music className="relative z-10 h-6 w-6 text-white animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            ) : (
              <Music className="relative z-10 h-6 w-6 text-white/40" />
            )}
          </div>
        </button>
      )}


      {/* DISABLED: Rocket Progress Bar
      {!isAnyDialogShowing && (
        <RoomRocketBar
          progress={room.rocket?.progress || 0}
          target={(room.rocket as any)?.target || 10000}
          countdownUntil={(room.rocket as any)?.countdownUntil || null}
          onOpenRocket={() => setIsRocketOpen(true)}
        />
      )}
      */}


      <footer className="relative z-50 px-4 flex items-center justify-between pt-2 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom,8px)]">
        <div className="flex items-center flex-1 mr-2 gap-2">
          {/* Left: Say Hi Input-like Button */}
          <button
            onClick={handleInputClick}
            className={cn(
              "flex-1 h-11 rounded-full px-5 flex items-center bg-black/40 border border-white/10 active:scale-95 transition-all text-white/80 text-[13px] font-bold shadow-lg shadow-black/20",
              isChatMuted && !canManageRoom && "opacity-50 grayscale"
            )}
          >
            Say Hi
          </button>

          {/* ROOM MUTE BUTTON - Voice and Music Toggle */}
          <button
            onClick={() => {
              setIsSpeakerMuted(!isSpeakerMuted);
              // toast({
              //   title: !isSpeakerMuted ? 'Room Muted' : 'Room Unmuted',
              //   description: !isSpeakerMuted ? 'Voice and music are now silent for you.' : 'Room audio restored.',
              //   variant: !isSpeakerMuted ? 'destructive' : 'default'
              // });
            }}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center active:scale-95 transition-all shrink-0 shadow-xl border border-white/10 bg-black/40",
              isSpeakerMuted ? "bg-red-500/40 border-red-500/60 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "text-white"
            )}
            title={isSpeakerMuted ? "Unmute Room" : "Mute Room"}
          >
            {isSpeakerMuted ? <VolumeX className="h-5 w-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" /> : <Volume2 className="h-5 w-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />}
          </button>
        </div>

        {/* Right: Icon Actions Grouped */}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEmojiPickerOpen(true)} className="p-1 px-1 active:scale-90 transition-transform bg-black/40 rounded-full h-11 w-11 flex items-center justify-center border border-white/10 shadow-lg">
            <SmilePlus className="h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          </button>

          <button onClick={handleMicToggle} disabled={!isInSeat} className={cn("h-11 w-11 rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/10 bg-black/40 shadow-lg", !isInSeat && "opacity-30")}>
            {isInSeat && !currentUserParticipant?.isMuted ? <Mic className="h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" /> : <MicOff className="h-6 w-6 text-white/60" />}
          </button>

          {/* Speaker/Earbuds Toggle */}
          {(hasBluetooth || hasWired) && (
            <button 
              onClick={async () => {
                await toggleOutput(musicAudioRef.current);
                toast({ 
                  title: isSpeaker ? 'Switched to Earbuds 🎧' : 'Switched to Speaker 🔊',
                  description: isSpeaker ? 'Audio routed to your connected headphones' : 'Audio playing through phone speaker'
                });
              }} 
              className={cn(
                "p-1 px-1 active:scale-90 transition-transform relative",
                isSpeaker ? "text-white/60" : "text-cyan-400"
              )}
              title={isSpeaker ? "Switch to Earbuds" : "Switch to Speaker"}
            >
              <Speaker className="h-6 w-6" />
              {!isSpeaker && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-cyan-400 rounded-full animate-pulse" />
              )}
            </button>
          )}

          <button onClick={() => setIsMessagesOpen(true)} className="h-11 w-11 rounded-full flex items-center justify-center active:scale-90 transition-transform bg-black/40 border border-white/10 shadow-lg">
            <Mail className="h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          </button>

          <button
            onClick={() => { setGiftRecipient(null); setIsGiftPickerOpen(true); }}
            className="relative h-10 w-10 active:scale-90 transition-all ml-1"
          >
            <div className="absolute inset-0 bg-[#FF00FF]/20 rounded-full blur-lg animate-pulse" />
            <div className="relative h-full w-full bg-gradient-to-tr from-[#A020F0] to-[#FF69B4] rounded-xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden p-1">
              <Image src="https://img.icons8.com/color/96/gift--v1.png" width={24} height={24} alt="Gift" className="drop-shadow-lg" />
            </div>
          </button>

            <button
              onClick={() => {
                setPortalDefaultView('grid');
                setIsRoomPlayOpen(true);
              }}
              className="h-11 w-11 rounded-full flex items-center justify-center active:scale-90 transition-transform bg-black/40 border border-white/10 shadow-lg"
            >
              <LayoutGrid className="h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </button>

          </div>
      </footer>


      {showInput && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end p-4 pb-safe pb-8 font-headline pointer-events-none">
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
              <button
                type="button"
                onClick={() => setIsLangPickerOpen(true)}
                className="bg-white/10 text-white/70 h-11 px-3 rounded-full flex items-center justify-center active:scale-90 transition-all border border-white/5 text-[10px] font-black tracking-widest uppercase"
              >
                {SUPPORTED_LANGUAGES.find(l => l.name === targetLanguage)?.code || 'HI'}
              </button>
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
            className="absolute top-12 right-6 p-3 bg-black/80 rounded-full text-white z-[410] active:scale-90 transition-transform"
          >
            <X className="h-[18px] w-[18px]" />
          </button>

          {/* Toolbar inside preview */}
          <div className="absolute bottom-12 flex items-center gap-4 z-[410]">
            <button
              onClick={() => setIsGiftPickerOpen(true)}
              className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white/80 active:scale-90 transition-transform"
            >
              <GiftIcon className="h-5 w-5" />
            </button>

            {/* SOUNDBOARD TRIGGER */}
            {currentUserParticipant?.seatIndex !== undefined && (
              <button
                onClick={() => setShowSoundboard(!showSoundboard)}
                className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-primary active:scale-90 transition-transform"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            )}

            {/* LIVE THEME SELECTOR (PREMIUM) */}
            {(isHydrated && userProfile?.isAdmin) && (
              <button
                onClick={() => {
                  const themes: any[] = ['galaxy', 'stars', 'love', 'rain', 'none'];
                  const next = themes[(themes.indexOf(activeLiveTheme) + 1) % themes.length];
                  setActiveLiveTheme(next);
                }}
                className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white/80 active:scale-90 transition-transform"
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


      <RoomUserListDialog 
        open={isUserListOpen} 
        onOpenChange={setIsUserListOpen} 
        roomId={room.id} 
        participants={onlineParticipants} 
        onUserClick={(uid) => {
          setSelectedParticipantUid(uid);
          setIsUserProfileCardOpen(true);
          setIsUserListOpen(false);
        }}
      />
      <RoomInfoDialog
        open={isRoomInfoOpen}
        onOpenChange={setIsRoomInfoOpen}
        room={room}
        isOwner={isOwner}
        isAdmin={canManageRoom}
      />
      <RoomFollowersDialog open={isFollowersOpen} onOpenChange={setIsFollowersOpen} room={room} />
      <RoomShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        room={room}
        onShare={() => triggerTask('share_whatsapp')}
      />

      <Dialog open={isLangPickerOpen} onOpenChange={setIsLangPickerOpen}>
        <DialogContent className="bg-black/90 backdrop-blur-2xl border-white/10 text-white max-w-[92vw] w-full rounded-[2.5rem] p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[500] focus:ring-0">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/5 flex flex-col items-center">
            <div className="w-12 h-1 bg-white/20 rounded-full mb-4 opacity-50" />
            <DialogTitle className="text-sm font-black uppercase tracking-[0.25em] text-center text-white/90">Universal Translator</DialogTitle>
            <DialogDescription className="text-[10px] uppercase tracking-wider text-white/30 mt-1 text-center">Select your target frequency</DialogDescription>
          </DialogHeader>
          
          <div className="h-[65vh] overflow-y-auto px-5 py-6 no-scrollbar overscroll-contain">
            <div className="grid grid-cols-2 gap-3 pb-4">
              {SUPPORTED_LANGUAGES.map((lang, idx) => (
                <button
                  key={`${lang.code}-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetLanguage(lang.name);
                    setIsLangPickerOpen(false);
                    toast({ 
                      title: `Frequency Synced: ${lang.name} 🌐`,
                      description: 'Now all incoming signals will be translated.'
                    });
                  }}
                  className={cn(
                    "relative group flex items-center justify-between px-4 py-5 rounded-[1.5rem] transition-all border active:scale-95 touch-manipulation overflow-hidden",
                    targetLanguage === lang.name 
                      ? "bg-primary border-primary text-black shadow-[0_0_25px_rgba(255,255,255,0.15)]" 
                      : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  {/* Glossy overlay for active state */}
                  {targetLanguage === lang.name && (
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  )}

                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[13px] font-black tracking-tight uppercase">{lang.name}</span>
                    <span className={cn(
                      "text-[9px] font-bold tracking-widest uppercase opacity-40",
                      targetLanguage === lang.name ? "text-black" : "text-white"
                    )}>{lang.code}</span>
                  </div>
                  
                  {targetLanguage === lang.name && (
                    <div className="h-1.5 w-1.5 bg-black rounded-full shadow-[0_0_8px_rgba(0,0,0,1)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-white/5 border-t border-white/5 flex justify-center backdrop-blur-md">
            <button 
              onClick={() => setIsLangPickerOpen(false)}
              className="px-8 py-3 rounded-full bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/5 active:scale-95"
            >
              Close Portal
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <RoomPlayDialog
        open={isRoomPlayOpen}
        onOpenChange={setIsRoomPlayOpen}
        participants={onlineParticipants}
        roomId={room.id}
        room={room}
        onOpenGames={() => setIsRoomGamesOpen(true)}
        onSelectGame={(slug) => {
          setActiveGameSlug(slug);
          setIsRoomPlayOpen(false);
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
        onOpenYouTube={() => { setIsYouTubeOpen(true); setIsYouTubeHidden(false); setIsRoomPlayOpen(false); }}
        onOpenMovies={() => { setIsMoviesOpen(true); setIsRoomPlayOpen(false); }}
        onOpenScreenMirror={() => { setIsScreenMirrorOpen(true); setIsRoomPlayOpen(false); }}
        onOpenSports={() => { setIsRoomPlayOpen(false); setTimeout(() => setIsSportsOpen(true), 300); }}
        defaultView={portalDefaultView}
      />
      <RoomGamesDialog
        open={isRoomGamesOpen}
        onOpenChange={setIsRoomGamesOpen}
        onToggleMiniPlayer={() => setShowMiniPlayer(!showMiniPlayer)}
        roomHasMusic={!!room.currentMusicUrl}
        showMiniPlayer={showMiniPlayer}
        onSelectGame={(slug) => {
          setActiveGameSlug(slug);
          setIsRoomGamesOpen(false);
        }}
      />
      <RoomGameOverlay
        activeGame={activeGameSlug}
        roomId={room.id}
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
      <GiftPicker
        open={isGiftPickerOpen}
        onOpenChange={setIsGiftPickerOpen}
        roomId={room.id}
        recipient={giftRecipient}
        participants={onlineParticipants}
        onSuccess={() => triggerTask('gift_once')}
      />

      <RoomSeatMenuDialog
        open={isSeatMenuOpen}
        onOpenChange={setIsSeatMenuOpen}
        seatIndex={selectedSeatIdx}
        roomId={room.id}
        isLocked={room.lockedSeats?.includes(selectedSeatIdx || 0) || false}
        isSeatMuted={room.mutedSeats?.includes(selectedSeatIdx || 0) || false}
        occupantUid={selectedParticipantUid}
        occupantName={onlineParticipants.find(p => p.uid === selectedParticipantUid)?.name}
        occupantAvatarUrl={onlineParticipants.find(p => p.uid === selectedParticipantUid)?.avatarUrl}
        isMuted={onlineParticipants.find(p => p.uid === selectedParticipantUid)?.isMuted || false}
        canManage={canManageRoom}
        currentUserId={currentUser?.uid}
        currentUserName={userProfile?.username}
        currentUserAvatarUrl={userProfile?.avatarUrl}
        onLeaveSeat={handleLeaveSeat}
        onTakeSeat={handleTakeSeat}
        onKick={handleKick}
        onToggleMute={handleSilence}
        onToggleSeatMute={handleToggleSeatMute}
        onToggleLock={handleToggleLock}
        onSendGift={handleOpenGiftPickerFromMenu}
        onOpenAudienceInvite={() => setIsAudienceInviteOpen(true)}
      />

      <RoomAudienceInviteDialog
        open={isAudienceInviteOpen}
        onOpenChange={setIsAudienceInviteOpen}
        seatIndex={selectedSeatIdx}
        roomId={room.id}
        participants={onlineParticipants}
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
        }}
      />

      <RoomProfileMain
        userId={selectedParticipantUid}
        open={isUserProfileCardOpen}
        onOpenChange={setIsUserProfileCardOpen}
        canManage={canManageRoom}
        isOwner={currentUser?.uid === room.ownerId}
        roomOwnerId={room.ownerId}
        roomModeratorIds={room.moderatorIds || []}
        onSilence={handleSilence}
        isSilenced={onlineParticipants.find(p => p.uid === selectedParticipantUid)?.isMuted || false}
        onKick={handleKick}
        onLeaveSeat={handleLeaveSeat}
        onToggleMod={handleToggleMod}
        onOpenGiftPicker={(recipient) => { setGiftRecipient(recipient); setIsGiftPickerOpen(true); }}
        onOpenChat={handleOpenChatFromProfile}
        onMention={handleMention}
        isMe={selectedParticipantUid === currentUser?.uid}
        isInSeat={onlineParticipants.find(p => p.uid === selectedParticipantUid)?.seatIndex !== undefined && (onlineParticipants.find(p => p.uid === selectedParticipantUid)?.seatIndex ?? 0) > 0}
      />

      <RoomInfoDialog
        open={isRoomInfoOpen}
        onOpenChange={setIsRoomInfoOpen}
        room={room}
        isOwner={isOwner}
        isAdmin={canManageRoom}
      />

      <RoomSettingsDialog
        open={isRoomSettingsOpen}
        onOpenChange={setIsRoomSettingsOpen}
        room={room}
        isAIVoiceEnabled={isAIVoiceEnabled}
        onToggleAIVoice={toggleAIVoice}
        isAIListening={isAIListening}
        onToggleAIListening={toggleAIListening}
        isCaptionsEnabled={isCaptionsEnabled}
        onToggleCaptions={() => setIsCaptionsEnabled(!isCaptionsEnabled)}
      />

      <ExitRoomDialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onMinimize={() => {
          setShowExitDialog(false);
          handleMinimize();
        }}
        onConfirmExit={() => {
          setShowExitDialog(false);
          handleExit();
        }}
      />

      <YouTubeDialog
        open={isYouTubeOpen && !isYouTubeHidden}
        onOpenChange={handleYouTubeOpenChange}
        roomId={room.id}
        userId={currentUser?.uid || ''}
        isHost={isOwner || canManageRoom}
        onCloseForAll={isOwner || isModerator ? handleCloseYouTubeForAll : undefined}
      />

      {/* IN-ROOM MOVIE PLAYER (Integrated) — overlays room, floats above all elements with absolute highest stacking context */}
      {isMoviePlayerOpen && selectedMovie && (
        <>
        <MovieAdProtection
          isOpen={isMoviePlayerOpen}
          videoUrl={
            selectedMovie.mediaType === 'tv' && selectedMovie.season && selectedMovie.episode
              ? `https://vidlink.pro/tv/${selectedMovie.tmdbId}/${selectedMovie.season}/${selectedMovie.episode}?primaryColor=0066ff&secondaryColor=001133&iconColor=0066ff&title=true&poster=true&autoplay=true`
              : `https://vidlink.pro/movie/${selectedMovie.tmdbId}?primaryColor=B20710&secondaryColor=170000&iconColor=B20710&title=true&poster=true&autoplay=true`
          }
          iframeRef={movieIframeRef}
          onAdBlocked={() => setMovieAdBlocked(prev => prev + 1)}
        />
        <motion.div
          drag
          dragListener={false}
          dragControls={movieDragControls}
          dragMomentum={false}
          className="fixed z-[99999] transform translate-z-0 w-[95vw] max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
          style={{
            top: '25%',
            left: '2.5%',
          }}
        >
          {/* Title / Drag bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-purple-500/30 select-none">
            <div className="flex items-center gap-2 min-w-0">
              {/* Drag button */}
              <button
                onPointerDown={(e) => movieDragControls.start(e)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-grab active:cursor-grabbing touch-none select-none"
                title="Drag Player"
              >
                <img src="https://img.icons8.com/ios-glyphs/30/ffffff/drag-reorder.png" className="h-4 w-4 opacity-70" alt="Drag" />
              </button>
              {selectedMovie.mediaType === 'tv' ? <Tv className="h-4 w-4 text-blue-400 shrink-0" /> : <Film className="h-4 w-4 text-purple-400 shrink-0" />}
              <span className="text-xs font-bold text-white truncate max-w-[180px]">{selectedMovie.title}{selectedMovie.mediaType === 'tv' && selectedMovie.season ? ` S${selectedMovie.season}E${selectedMovie.episode}` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              {canManageRoom && roomMovie?.tmdbId === selectedMovie.tmdbId && (
                <button
                  onClick={handleStopRoomMovie}
                  className="px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold active:scale-95 transition-all"
                >
                  Stop For All
                </button>
              )}
              <button
                onClick={() => setIsMoviePlayerOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90 border border-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="w-full bg-black" style={{ aspectRatio: '16/9' }}>
            {movieAdBlocked > 0 && (
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-xs text-amber-400 px-2.5 py-1 rounded-full">
                <ShieldAlert className="h-3 w-3" />
                <span>{movieAdBlocked} ad{movieAdBlocked > 1 ? 's' : ''} blocked</span>
              </div>
            )}
            <iframe
              ref={movieIframeRef}
              key={`vidlink-inroom-${selectedMovie.mediaType}-${selectedMovie.tmdbId}-${selectedMovie.season}-${selectedMovie.episode}`}
              src={
                selectedMovie.mediaType === 'tv' && selectedMovie.season && selectedMovie.episode
                  ? `https://vidlink.pro/tv/${selectedMovie.tmdbId}/${selectedMovie.season}/${selectedMovie.episode}?primaryColor=0066ff&secondaryColor=001133&iconColor=0066ff&title=true&poster=true&autoplay=true`
                  : `https://vidlink.pro/movie/${selectedMovie.tmdbId}?primaryColor=B20710&secondaryColor=170000&iconColor=B20710&title=true&poster=true&autoplay=true`
              }
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
        </>
      )}

      <EntertainmentHubDialog
        open={isMoviesOpen}
        onOpenChange={setIsMoviesOpen}
        isHost={isOwner || canManageRoom}
        onPlayMovieForRoom={handlePlayMovieForRoom}
        onWatchMoviePersonal={handleWatchPersonal}
        onWatchTVPersonal={handleWatchTVPersonal}
        onPlayTVForRoom={handlePlayTVForRoom}
      />

      {/* Fullscreen MoviePlayer is commented out in favor of the in-room integrated player
      <MoviePlayer
        open={isMoviePlayerOpen}
        onOpenChange={setIsMoviePlayerOpen}
        tmdbId={selectedMovie?.tmdbId || 0}
        title={selectedMovie?.title || ''}
        posterPath={selectedMovie?.posterPath}
      />
      */}

      <MovieSyncBanner
        visible={!!roomMovie && !isMoviePlayerOpen && !isMovieBannerDismissed && roomMovie.startedBy !== currentUser?.uid}
        movieTitle={roomMovie?.title || ''}
        posterPath={roomMovie?.posterPath}
        startedBy={roomMovie?.startedBy === currentUser?.uid ? 'You' : (roomMovie?.startedBy ? 'Host' : 'Host')}
        onJoin={handleJoinRoomMovie}
        onDismiss={() => setIsMovieBannerDismissed(true)}
      />

      <ScreenMirrorDialog
        open={isScreenMirrorOpen}
        onOpenChange={setIsScreenMirrorOpen}
        roomId={room.id}
        userId={currentUser?.uid || ''}
        isHost={isOwner || canManageRoom}
        startScreenShare={handleStartScreenShare}
        stopScreenShare={handleStopScreenShare}
        isScreenSharing={isScreenSharing}
        remoteScreenTrack={shouldShowScreenShare ? remoteScreenTrack : null}
        participants={onlineParticipants.map(p => ({
          uid: p.uid,
          name: p.name || 'Unknown',
          avatarUrl: p.avatarUrl,
          isHost: p.uid === room.ownerId,
        }))}
      />

      <SportsHub
        open={isSportsOpen}
        onOpenChange={setIsSportsOpen}
      />

      {/* NETMIRROR DISABLED */}
      {/* <NetMirrorDialog
        open={isNetMirrorOpen}
        onOpenChange={setIsNetMirrorOpen}
        roomId={room.id}
        userId={currentUser?.uid || ''}
        isHost={isOwner || canManageRoom}
        onCloseForAll={() => {
          setIsNetMirrorOpen(false);
        }}
        onWatchInRoom={handleOpenNetMirrorWatch}
      />

      <NetMirrorPlayer
        open={isNetMirrorPlayerOpen}
        onOpenChange={setIsNetMirrorPlayerOpen}
        movieUrl={netMirrorSession?.movieUrl || ''}
        movieTitle={netMirrorSession?.movieTitle || 'NetMirror'}
        startedBy={netMirrorSession?.startedBy || 'Host'}
        currentUserId={currentUser?.uid || ''}
      />

      <NetMirrorWatchTogether
        open={isNetMirrorWatchOpen}
        onOpenChange={setIsNetMirrorWatchOpen}
        roomId={room.id}
        userId={currentUser?.uid || ''}
        isHost={isOwner || canManageRoom}
        onCloseForAll={handleCloseNetMirrorWatch}
      />

      <NetMirrorRoomIndicator
        isActive={netMirrorSession?.isActive || false}
        movieTitle={netMirrorSession?.movieTitle || ''}
        startedBy={netMirrorSession?.startedBy || ''}
        currentUserId={currentUser?.uid || ''}
        onJoin={handleJoinNetMirror}
        onDismiss={handleDismissNetMirrorIndicator}
      /> */}

      <style dangerouslySetInnerHTML={{ __html: `
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
          touch-action: manipulation;
        }
        .touch-responsive:active {
          transform: scale(0.95);
        }
      `}}></style>
      <MountOverlay entries={mountEntries} />
      <GiftAnimationOverlay 
        giftId={activeGift?.giftId || null} 
        giftName={activeGift?.giftName}
        senderName={activeGift?.senderName}
        receiverName={activeGift?.receiverName}
        imageUrl={activeGift?.imageUrl} 
        animationUrl={activeGift?.animationUrl}
        videoUrl={activeGift?.videoUrl}
        soundUrl={activeGift?.soundUrl}
        tier={activeGift?.tier}
        targetSeat={activeGift?.targetSeat} 
        onComplete={() => setActiveGift(null)} 
      />
      <LuckyRainOverlay
        active={false} // DISABLED: Causing app hangs when rocket is full
        onComplete={() => setIsLuckyRainActive(false)}
      />

      {/* LOOT SYSTEM */}
      <AiVoiceAnnouncer enabled={true} language="hi-IN" />
      
      {!isAnyDialogShowing && (
        <div className="absolute right-3 bottom-[80px] z-40">
          <LootBoxDisplay
            levels={lootLevels}
            currentProgress={room.stats?.dailyGifts || 0}
            isGateOpen={isLootGateOpen}
            canOpenGate={(room.stats?.dailyGifts || 0) >= (lootLevels[currentLootLevelIndex]?.threshold || 0)}
            onOpenGate={() => setIsLootGateOpen(true)}
            currentLevelIndex={currentLootLevelIndex}
          />
        </div>
      )}

      <LootGate
        isOpen={isLootGateOpen}
        levelName={lootLevels[currentLootLevelIndex]?.name || "Home"}
        levelImage={lootLevels[currentLootLevelIndex]?.image}
        levelVideo={lootLevels[currentLootLevelIndex]?.videoUrl}
        entryLimit={lootConfig.entryLimit}
        currentEntries={lootGateEntries.length}
        timeRemaining={lootTimeRemaining}
        onEnter={() => {
          if (currentUser?.uid && !hasEnteredLoot) {
            setLootGateEntries(prev => [...prev, currentUser.uid]);
            setHasEnteredLoot(true);
            setTimeout(() => {
              setIsLootGateOpen(false);
              setIsLootingActive(true);
              setLootTimeRemaining(lootConfig.duration);
            }, 500);
          }
        }}
        hasEntered={hasEnteredLoot}
        onClose={() => setIsLootGateOpen(false)}
      />

      <LootingRoom
        active={isLootingActive}
        rewards={lootRewards}
        timeRemaining={lootTimeRemaining}
        onCollect={(item) => {
          setCollectedLootItems(prev => [...prev, item]);
          // Announce in Hindi
          if ((window as any).__announceLoot) {
            (window as any).__announceLoot(`${item.reward.name} mila!`);
          }
        }}
        onClose={() => {
          setIsLootingActive(false);
          setHasEnteredLoot(false);
          setLootGateEntries([]);
          setCollectedLootItems([]);
        }}
        collectedItems={collectedLootItems}
      />
    </div>
  );
}
