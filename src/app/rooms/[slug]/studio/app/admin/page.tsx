'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking, useStorage, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch, arrayUnion, arrayRemove, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Shield, Loader, Gift, UserCheck, Star, Zap, Heart, MessageSquare, BadgeCheck, Upload, Type, Image as ImageIcon, Gamepad2, Camera, Trash2, ShieldCheck, Store, Check, Mic2, Send, Megaphone, MessageSquareText, Palette, UserX, Gavel, History, Clock, Dices, Sparkles, Wand2, Database, BarChart3, Eye, Search, RefreshCcw, Users, CheckCircle2, Activity, Wallet, UserSearch, ClipboardList, ListTodo, Plus, Monitor, Trophy, Crown, Home, X, Copy, Pin, PinOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGameLogoUpload } from '@/hooks/use-game-logo-upload';
import { useGameBackgroundUpload } from '@/hooks/use-game-background-upload';
import { OfficialTag } from '@/components/official-tag';
import { GoldCoinIcon } from '@/components/icons';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import Image from 'next/image';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

const AUTHORITY_ROLES = [
  { id: 'Super Admin', label: 'Super Admin', icon: Zap, color: 'text-red-500' },
  { id: 'Admin Management', label: 'Admin Management', icon: Shield, color: 'text-blue-500' },
  { id: 'App Manager', label: 'App Manager', icon: Star, color: 'text-purple-500' },
  { id: 'Customer Service', label: 'Customer Service', icon: MessageSquare, color: 'text-cyan-500' },
  { id: 'Coin Seller', label: 'Coin Seller', icon: Heart, color: 'text-pink-500' },
  { id: 'Assistant', label: 'Assistant', icon: UserCheck, color: 'text-green-500' },
];

const ELITE_TAGS = [
  { id: 'Official', label: 'Official', color: 'bg-green-500', icon: BadgeCheck },
  { id: 'CS Leader', label: 'CS Leader', color: 'bg-gradient-to-r from-blue-500 to-magenta-500', icon: Sparkles },
  { id: 'Customer Service', label: 'Customer Service', color: 'bg-blue-500', icon: MessageSquare },
  { id: 'Seller', label: 'Seller', color: 'bg-purple-500', icon: Heart },
  { id: 'Official center', label: 'Official center', color: 'bg-indigo-500', icon: ShieldCheck },
  { id: 'Seller center', label: 'Seller center', color: 'bg-orange-500', icon: Store },
];

const DISPATCH_ASSETS = {
  frames: [
    { id: 'ummy-cs', name: 'Ummy CS Majestic' },
    { id: 'f-official-hq', name: 'Sovereign Official HQ' },
    { id: 'f1', name: 'Golden Official' },
    { id: 'f5', name: 'Golden wings' },
    { id: 'f7', name: 'Celestial Wings' },
    { id: 'f2', name: 'Cyberpunk Red' },
    { id: 'f3', name: 'Royal Purple' },
    { id: 'f4', name: 'Imperial Bloom' },
    { id: 'f6', name: 'Bronze Sky' },
  ],
  bubbles: [
    { id: 'b1', name: 'Kawaii Pink' },
    { id: 'b2', name: 'Midnight Blue' },
  ],
  waves: [
    { id: 'w1', name: 'Ocean Waves' },
    { id: 'w2', name: 'Flame Pulse' },
  ],
  themes: [
    { id: 'neon_universe', name: 'Neon Universe' },
    { id: 'emoji_party', name: 'Emoji Party' },
    { id: 'gaming_arcade', name: 'Gaming Arcade' },
    { id: 'official_ummy', name: 'Official Ummy' },
  ]
};

const DEFAULT_SLIDES = [
  { id: 0, title: "Tribe Events", subtitle: "Global Frequency Sync", iconName: "Sparkles", color: "from-orange-500/40", imageUrl: PlaceHolderImages.find(img => img.id === 'admin-banner-1')?.imageUrl },
  { id: 1, title: "Elite Rewards", subtitle: "Claim Your Daily Throne", iconName: "Trophy", color: "from-yellow-500/40", imageUrl: PlaceHolderImages.find(img => img.id === 'admin-banner-2')?.imageUrl },
  { id: 2, title: "Game Zone", subtitle: "Enter the 3D Arena", iconName: "Gamepad2", color: "from-purple-500/40", imageUrl: PlaceHolderImages.find(img => img.id === 'admin-banner-3')?.imageUrl }
];

const ACTIVE_GAME_FREQUENCIES = [
  { id: 'roulette', title: 'Roulette', slug: 'roulette', imageHint: 'roulette wheel' },
  { id: 'ludo', title: 'Ludo Masters', slug: 'ludo', imageHint: '3d ludo board' },
  { id: 'fruit-party', title: 'Fruit Party', slug: 'fruit-party', imageHint: '3d fruit icons' },
  { id: 'forest-party', title: 'Wild Party', slug: 'forest-party', imageHint: '3d lion head' },
];

const SpecialIdBadge = ({ id, color }: { id: string, color?: string | null }) => {
  const { toast } = useToast();
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        toast({ title: 'ID Copied' });
      });
    }
  };

  if (!color) {
    return (
      <span 
        onClick={handleCopy}
        className="text-[10px] font-black uppercase italic tracking-widest text-slate-500 leading-none cursor-pointer hover:text-slate-700 transition-colors px-1"
      >
        ID: {id}
      </span>
    );
  }

  const theme = color === 'blue' 
    ? "from-blue-300 via-blue-500 to-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)] border-white/30"
    : "from-rose-300 via-rose-500 to-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] border-white/30";

  return (
    <div 
      onClick={handleCopy}
      className={cn(
        "relative overflow-hidden px-3 py-0.5 rounded-full border group animate-in fade-in duration-500 w-fit bg-gradient-to-r cursor-pointer",
        theme
      )}
    >
      <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
      <span className="relative z-10 text-[10px] font-black uppercase italic tracking-widest drop-shadow-sm text-white leading-none">
        ID: {id}
      </span>
    </div>
  );
};

export default function AdminPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { toast } = useToast();
  const { isUploading: isUploadingGameDP, uploadGameLogo } = useGameLogoUpload();
  const { isUploading: isUploadingGameBG, uploadGameBackground } = useGameBackgroundUpload();
  
  const isCreator = user?.uid === CREATOR_ID;

  const [activeTab, setActiveTab] = useState('app-data');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  
  // Search Modes
  const [recordSearchMode, setRecordSearchMode] = useState<'id' | 'name'>('id');
  const [centerSearchMode, setCenterSearchMode] = useState<'id' | 'name'>('id');
  const [banSearchMode, setBanSearchMode] = useState<'id' | 'name'>('id');
  const [dmSearchMode, setDmSearchMode] = useState<'id' | 'name'>('id');
  const [tagSearchMode, setTagSearchMode] = useState<'id' | 'name'>('id');
  const [specialIdSearchMode, setSpecialIdSearchMode] = useState<'id' | 'name'>('id');
  const [rewardSearchMode, setRewardSearchMode] = useState<'id' | 'name'>('id');

  const [centerSearchId, setCenterSearchId] = useState('');
  const [targetUserForCenter, setTargetUserForCenter] = useState<any>(null);
  const [isSearchingCenter, setIsSearchingCenter] = useState(false);

  const [tagSearchId, setTagSearchId] = useState('');
  const [targetUserForTags, setTargetUserForTags] = useState<any>(null);
  
  const [idSearchInput, setIdSearchInput] = useState('');
  const [newIdInput, setNewIdInput] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>('red');
  const [targetUserForId, setTargetUserForId] = useState<any>(null);
  
  const [rewardSearchId, setRewardSearchId] = useState('');
  const [targetUserForRewards, setTargetUserForRewards] = useState<any>(null);
  const [coinDispatchAmount, setCoinDispatchAmount] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const [recordSearchId, setRecordSearchId] = useState('');
  const [targetUserForRecord, setTargetUserForRecord] = useState<any>(null);
  const [isSearchingRecord, setIsSearchingRecord] = useState(false);
  const [isResettingWallet, setIsResettingWallet] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState('Official Notice');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [globalAnnouncementInput, setGlobalAnnouncementInput] = useState('');
  const [isUpdatingGlobalNotice, setIsUpdatingGlobalNotice] = useState(false);

  const [dmSearchId, setDmSearchId] = useState('');
  const [targetUserForDm, setTargetUserForDm] = useState<any>(null);
  const [dmTitle, setDmTitle] = useState('Official System Notice');
  const [dmContent, setDmContent] = useState('');
  const [isSendingDm, setIsSendingDm] = useState(false);

  const [banSearchId, setBanSearchId] = useState('');
  const [targetUserForBan, setTargetUserForBan] = useState<any>(null);
  const [isSearchingBan, setIsSearchingBan] = useState(false);
  
  const [banDays, setBanDays] = useState('1');
  const [banHours, setBanHours] = useState('0');
  const [banMinutes, setBanMinutes] = useState('0');
  const [banSeconds, setBanSeconds] = useState('0');
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [isBanning, setIsBanning] = useState(false);

  const [newThemeName, setNewThemeName] = useState('');
  const [newThemePrice, setNewThemePrice] = useState('0');
  const [newThemeDuration, setNewThemeDuration] = useState('7');
  const [newThemeCategory, setNewThemeCategory] = useState<'general' | 'entertainment' | 'help'>('general');
  const [isUploadingTheme, setIsUploadingTheme] = useState(false);
  const themeFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLoginBG, setIsUploadingLoginBG] = useState(false);
  const loginBGFileInputRef = useRef<HTMLInputElement>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingTag, setIsSearchingTag] = useState(false);
  const [isSearchingRewards, setIsSearchingRewards] = useState(false);
  const [isSearchingDm, setIsSearchingDm] = useState(false);
  const [isSavingId, setIsSavingId] = useState(false);
  
  const [isUploadingBanner, setIsUploadingBanner] = useState<number | null>(null);
  const bannerFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rankingBGFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingRankingKey, setUploadingRankingKey] = useState<string | null>(null);

  const gameFileInputRef = useRef<HTMLInputElement>(null);
  const gameBGFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameForSync, setSelectedGameForSync] = useState<any>(null);

  const [appStats, setAppStats] = useState({ totalCoins: 0, totalDiamonds: 0, totalSpent: 0, totalUsers: 0 });
  const [isSyncingAppData, setIsSyncingAppData] = useState(false);

  const [tribalMembers, setTribalMembers] = useState<any[]>([]);
  const [isSyncingDirectory, setIsSyncingDirectory] = useState(false);

  // Room Pin State
  const [roomPinSearchId, setRoomPinSearchId] = useState('');
  const [targetRoomForPin, setTargetRoomForPin] = useState<any>(null);
  const [isSearchingRoomPin, setIsSearchingRoomPin] = useState(false);
  const [isPinningRoom, setIsPinningRoom] = useState(false);

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return query(collection(firestore, 'games'));
  }, [firestore, isCreator]);
  const { data: firestoreGames } = useCollection(gamesQuery);

  const themesQuery = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return query(collection(firestore, 'roomThemes'), orderBy('createdAt', 'desc'));
  }, [firestore, isCreator]);
  const { data: customThemes } = useCollection(themesQuery);

  const gamesList = useMemo(() => {
    return ACTIVE_GAME_FREQUENCIES.map(base => {
      const match = firestoreGames?.find(g => g.slug === base.slug);
      return match ? { ...base, ...match } : base;
    });
  }, [firestoreGames]);

  const configRef = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return doc(firestore, 'appConfig', 'global');
  }, [firestore, isCreator]);
  const { data: config } = useDoc(configRef);

  const bannerConfigRef = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return doc(firestore, 'appConfig', 'banners');
  }, [firestore, isCreator]);
  const { data: bannerConfig } = useDoc(bannerConfigRef);

  const rankingConfigRef = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return doc(firestore, 'appConfig', 'rankings');
  }, [firestore, isCreator]);
  const { data: rankingConfig } = useDoc(rankingConfigRef);

  const handleUpdateGlobalNotice = async () => {
    if (!firestore || !isCreator || !configRef) return;
    setIsUpdatingGlobalNotice(true);
    try {
      await updateDoc(configRef, { globalAnnouncement: globalAnnouncementInput, updatedAt: serverTimestamp() });
      toast({ title: 'Global Sync Complete', description: 'Room Notice Row 1 updated across the tribe.' });
    } finally {
      setIsUpdatingGlobalNotice(false);
    }
  };

  const handleSyncAppData = async () => {
    if (!firestore || !isCreator) return;
    setIsSyncingAppData(true);
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      let tc = 0, td = 0, ts = 0;
      usersSnap.docs.forEach(d => {
        const w = d.data().wallet || {};
        tc += (w.coins || 0);
        td += (w.diamonds || 0);
        ts += (w.totalSpent || 0);
      });
      setAppStats({ totalCoins: tc, totalDiamonds: td, totalSpent: ts, totalUsers: usersSnap.docs.length });
      toast({ title: 'Economic Ledger Synchronized' });
    } finally {
      setIsSyncingAppData(false);
    }
  };

  const handleSyncDirectory = async () => {
    if (!firestore || !isCreator) return;
    setIsSyncingDirectory(true);
    try {
      const snap = await getDocs(query(collection(firestore, 'users'), limit(50)));
      setTribalMembers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      toast({ title: 'Member Directory Synchronized' });
    } finally {
      setIsSyncingDirectory(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!firestore || !searchQuery) return;
    setIsSearching(true);
    try {
      const q = query(collection(firestore, 'users'), where('username', '>=', searchQuery), where('username', '<=', searchQuery + '\uf8ff'), limit(10));
      const snap = await getDocs(q);
      setFoundUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenericSearch = async (mode: 'id' | 'name', value: string, setter: (u: any) => void, loadingSetter: (l: boolean) => void) => {
    if (!firestore || !value) return;
    loadingSetter(true);
    try {
      const inputVal = value.trim();
      let foundUser = null;

      if (mode === 'id') {
        const qAcc = query(collection(firestore, 'users'), where('accountNumber', '==', inputVal), limit(1));
        const snapAcc = await getDocs(qAcc);
        if (!snapAcc.empty) {
          foundUser = { ...snapAcc.docs[0].data(), id: snapAcc.docs[0].id };
        }

        if (!foundUser) {
          const paddedId = inputVal.padStart(3, '0');
          const qSpec = query(collection(firestore, 'users'), where('specialId', '==', paddedId), limit(1));
          const snapSpec = await getDocs(qSpec);
          if (!snapSpec.empty) {
            foundUser = { ...snapSpec.docs[0].data(), id: snapSpec.docs[0].id };
          }
        }
      } else {
        const qName = query(
          collection(firestore, 'users'), 
          where('username', '>=', inputVal), 
          where('username', '<=', inputVal + '\uf8ff'), 
          limit(1)
        );
        const snapName = await getDocs(qName);
        if (!snapName.empty) {
          foundUser = { ...snapName.docs[0].data(), id: snapName.docs[0].id };
        }
      }
      
      if (foundUser) {
        setter(foundUser);
      } else {
        toast({ variant: 'destructive', title: 'Identity Not Found' });
      }
    } finally {
      loadingSetter(false);
    }
  };

  const handleRoomPinSearch = async () => {
    if (!firestore || !roomPinSearchId) return;
    setIsSearchingRoomPin(true);
    try {
      const q = query(collection(firestore, 'chatRooms'), where('roomNumber', '==', roomPinSearchId.trim()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTargetRoomForPin({ ...snap.docs[0].data(), id: snap.docs[0].id });
      } else {
        toast({ variant: 'destructive', title: 'Frequency Not Found' });
      }
    } finally {
      setIsSearchingRoomPin(false);
    }
  };

  const handleToggleRoomPin = async () => {
    if (!firestore || !targetRoomForPin || !isCreator) return;
    setIsPinningRoom(true);
    try {
      const roomRef = doc(firestore, 'chatRooms', targetRoomForPin.id);
      const newPinStatus = !targetRoomForPin.isPinned;
      await updateDoc(roomRef, { isPinned: newPinStatus, pinnedAt: newPinStatus ? serverTimestamp() : null });
      setTargetRoomForPin((prev: any) => ({ ...prev, isPinned: newPinStatus }));
      toast({ title: newPinStatus ? 'Frequency Pinned' : 'Frequency Unpinned' });
    } finally {
      setIsPinningRoom(false);
    }
  };

  const handleResetWallet = async () => {
    if (!firestore || !targetUserForRecord || !isCreator) return;
    if (!confirm("Are you sure you want to PERMANENTLY RESET this user's wallet?")) return;
    
    setIsResettingWallet(true);
    try {
      const uRef = doc(firestore, 'users', targetUserForRecord.id);
      const pRef = doc(firestore, 'users', targetUserForRecord.id, 'profile', targetUserForRecord.id);
      const resetData = { 'wallet.coins': 0, 'wallet.diamonds': 0, 'wallet.totalSpent': 0, 'wallet.dailySpent': 0, updatedAt: serverTimestamp() };
      await updateDocumentNonBlocking(uRef, resetData);
      await updateDocumentNonBlocking(pRef, resetData);
      setTargetUserForRecord((prev: any) => ({ ...prev, wallet: { coins: 0, diamonds: 0, totalSpent: 0, dailySpent: 0 } }));
      toast({ title: 'Wallet Purged' });
    } finally {
      setIsResettingWallet(false);
    }
  };

  const handleSystemBroadcast = async () => {
    if (!firestore || !broadcastContent.trim() || !isCreator) return;
    setIsBroadcasting(true);
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const batches = [];
      let currentBatch = writeBatch(firestore);
      let count = 0;
      for (const userDoc of usersSnap.docs) {
        const notifRef = doc(collection(firestore, 'users', userDoc.id, 'notifications'));
        currentBatch.set(notifRef, { title: broadcastTitle, content: broadcastContent, type: 'system', timestamp: serverTimestamp(), isRead: false });
        count++;
        if (count === 499) { batches.push(currentBatch.commit()); currentBatch = writeBatch(firestore); count = 0; }
      }
      if (count > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);
      toast({ title: 'Broadcast Synchronized' });
      setBroadcastContent('');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!firestore || !targetUserForDm || !dmContent.trim() || !isCreator) return;
    setIsSendingDm(true);
    try {
      const notifRef = collection(firestore, 'users', targetUserForDm.id, 'notifications');
      await addDoc(notifRef, { title: dmTitle, content: dmContent, type: 'direct_system', timestamp: serverTimestamp(), isRead: false });
      toast({ title: 'Message Dispatched' });
      setDmContent('');
    } finally {
      setIsSendingDm(false);
    }
  };

  const handleDispatchCoins = async () => {
    if (!firestore || !targetUserForRewards || !coinDispatchAmount) return;
    setIsDispatching(true);
    try {
      const uRef = doc(firestore, 'users', targetUserForRewards.id);
      const pRef = doc(firestore, 'users', targetUserForRewards.id, 'profile', targetUserForRewards.id);
      const amt = parseInt(coinDispatchAmount);
      updateDocumentNonBlocking(uRef, { 'wallet.coins': increment(amt) });
      updateDocumentNonBlocking(pRef, { 'wallet.coins': increment(amt) });
      toast({ title: 'Coins Dispatched' });
      setCoinDispatchAmount('');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDispatchItem = async (itemId: string, type: 'ownedItems' | 'purchasedThemes') => {
    if (!firestore || !targetUserForRewards) return;
    setIsDispatching(true);
    try {
      const pRef = doc(firestore, 'users', targetUserForRewards.id, 'profile', targetUserForRewards.id);
      updateDocumentNonBlocking(pRef, { [`inventory.${type}`]: arrayUnion(itemId) });
      toast({ title: 'Asset Dispatched' });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleUpdateId = async () => {
    if (!firestore || !targetUserForId || !newIdInput) return;
    setIsSavingId(true);
    try {
      const paddedNewId = newIdInput.padStart(3, '0');
      const q = query(collection(firestore, 'users'), where('specialId', '==', paddedNewId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].id !== targetUserForId.id) {
        toast({ variant: 'destructive', title: 'Conflict', description: 'ID already assigned.' });
        return;
      }

      const uRef = doc(firestore, 'users', targetUserForId.id);
      const pRef = doc(firestore, 'users', targetUserForId.id, 'profile', targetUserForId.id);
      const updateData = { specialId: paddedNewId, specialIdColor: selectedColor, updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(uRef, updateData);
      updateDocumentNonBlocking(pRef, updateData);
      setTargetUserForId((prev: any) => ({ ...prev, specialId: paddedNewId, specialIdColor: selectedColor }));
      toast({ title: 'ID Synchronized' });
      setNewIdInput('');
    } finally {
      setIsSavingId(false);
    }
  };

  const handleRemoveId = async () => {
    if (!firestore || !targetUserForId) return;
    setIsSavingId(true);
    try {
      const uRef = doc(firestore, 'users', targetUserForId.id);
      const pRef = doc(firestore, 'users', targetUserForId.id, 'profile', targetUserForId.id);
      const updateData = { specialId: null, specialIdColor: null, updatedAt: serverTimestamp() };
      await updateDocumentNonBlocking(uRef, updateData);
      await updateDocumentNonBlocking(pRef, updateData);
      setTargetUserForId((prev: any) => ({ ...prev, specialId: null, specialIdColor: null }));
      toast({ title: 'ID Signature Purged' });
    } finally {
      setIsSavingId(false);
    }
  };

  const handleBanUser = async () => {
    if (!firestore || !targetUserForBan || !isCreator) return;
    setIsBanning(true);
    try {
      const days = parseInt(banDays) || 0;
      const hours = parseInt(banHours) || 0;
      const mins = parseInt(banMinutes) || 0;
      const secs = parseInt(banSeconds) || 0;
      const totalMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (mins * 60 * 1000) + (secs * 1000);
      const bannedUntil = isPermanentBan ? null : Timestamp.fromDate(new Date(Date.now() + totalMs));
      const uRef = doc(firestore, 'users', targetUserForBan.id);
      const pRef = doc(firestore, 'users', targetUserForBan.id, 'profile', targetUserForBan.id);
      const banData = { banStatus: { isBanned: true, bannedAt: serverTimestamp(), bannedUntil: bannedUntil, reason: 'Administrative Exclusion' } };
      await setDoc(uRef, banData, { merge: true });
      await setDoc(pRef, banData, { merge: true });
      setTargetUserForBan((prev: any) => ({ ...prev, banStatus: banData.banStatus }));
      toast({ title: 'ID Banned' });
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!firestore || !targetUserForBan || !isCreator) return;
    setIsBanning(true);
    try {
      const uRef = doc(firestore, 'users', targetUserForBan.id);
      const pRef = doc(firestore, 'users', targetUserForBan.id, 'profile', targetUserForBan.id);
      const unbanData = { banStatus: { isBanned: false, bannedAt: null, bannedUntil: null, reason: null } };
      await setDoc(uRef, unbanData, { merge: true });
      await setDoc(pRef, unbanData, { merge: true });
      setTargetUserForBan((prev: any) => ({ ...prev, banStatus: unbanData.banStatus }));
      toast({ title: 'ID Unbanned' });
    } finally {
      setIsBanning(false);
    }
  };

  const adjustBalance = (targetUserId: string, type: 'coins' | 'diamonds', amount: number) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', targetUserId);
    const profileRef = doc(firestore, 'users', targetUserId, 'profile', targetUserId);
    const updateData = { [`wallet.${type}`]: increment(amount), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    toast({ title: 'Balance Adjusted' });
  };

  const toggleUserRole = async (targetUid: string, roleId: string, currentTags: string[] = []) => {
    if (!firestore) return;
    const hasRole = (currentTags || []).includes(roleId);
    const userRef = doc(firestore, 'users', targetUid);
    const profileRef = doc(firestore, 'users', targetUid, 'profile', targetUid);
    const updateData = { tags: hasRole ? arrayRemove(roleId) : arrayUnion(roleId), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    const updatedTags = hasRole ? (currentTags || []).filter((t: string) => t !== roleId) : [...(currentTags || []), roleId];
    if (targetUserForTags && targetUserForTags.id === targetUid) setTargetUserForTags((prev: any) => ({ ...prev, tags: updatedTags }));
    if (targetUserForCenter && targetUserForCenter.id === targetUid) setTargetUserForCenter((prev: any) => ({ ...prev, tags: updatedTags }));
    setFoundUsers(prev => prev.map(u => u.id === targetUid ? { ...u, tags: updatedTags } : u));
    toast({ title: 'Authority Updated' });
  };

  const handleToggleSellerCenter = async () => {
    if (!firestore || !targetUserForCenter) return;
    const tags = targetUserForCenter.tags || [];
    const sellerTags = ['Seller', 'Seller center', 'Coin Seller'];
    const isCurrentlyActive = tags.some(t => sellerTags.includes(t));
    const userRef = doc(firestore, 'users', targetUserForCenter.id);
    const profileRef = doc(firestore, 'users', targetUserForCenter.id, 'profile', targetUserForCenter.id);
    let newTags;
    if (isCurrentlyActive) { newTags = tags.filter(t => !sellerTags.includes(t)); }
    else { newTags = [...tags, 'Seller']; }
    const updateData = { tags: newTags, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    setTargetUserForCenter((prev: any) => ({ ...prev, tags: newTags }));
    if (targetUserForTags?.id === targetUserForCenter.id) setTargetUserForTags((prev: any) => ({ ...prev, tags: newTags }));
    setFoundUsers(prev => prev.map(u => u.id === targetUserForCenter.id ? { ...u, tags: newTags } : u));
    toast({ title: isCurrentlyActive ? 'Center Revoked' : 'Center Activated' });
  };

  const handleRemoveAllTags = async (targetUid: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', targetUid);
    const profileRef = doc(firestore, 'users', targetUid, 'profile', targetUid);
    const updateData = { tags: [], updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    if (targetUserForTags && targetUserForTags.id === targetUid) setTargetUserForTags((prev: any) => ({ ...prev, tags: [] }));
    if (targetUserForCenter && targetUserForCenter.id === targetUid) setTargetUserForCenter((prev: any) => ({ ...prev, tags: [] }));
    setFoundUsers(prev => prev.map(u => u.id === targetUid ? { ...u, tags: [] } : u));
    toast({ title: 'Authority Purged' });
  };

  const handleBannerImageUpload = async (index: number, file: File) => {
    if (!storage || !bannerConfigRef) return;
    setIsUploadingBanner(index);
    try {
      const sRef = ref(storage, `banners/slide_${index}_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, file);
      const url = await getDownloadURL(result.ref);
      const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
      const newSlides = [...currentSlides];
      newSlides[index] = { ...newSlides[index], imageUrl: url };
      await setDoc(bannerConfigRef, { slides: newSlides }, { merge: true });
      toast({ title: 'Banner Updated' });
    } finally {
      setIsUploadingBanner(null);
    }
  };

  const handleRankingBGUpload = async (key: string, file: File) => {
    if (!storage || !rankingConfigRef) return;
    setUploadingRankingKey(key);
    try {
      const sRef = ref(storage, `rankings/bg_${key}_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, file);
      const url = await getDownloadURL(result.ref);
      await setDoc(rankingConfigRef, { [key]: url }, { merge: true });
      toast({ title: `${key.toUpperCase()} Background Updated` });
    } finally {
      setUploadingRankingKey(null);
    }
  };

  const handleAddBanner = async () => {
    if (!firestore || !isCreator) return;
    const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
    const newSlide = {
      title: "New Tribe Event",
      subtitle: "Join the Frequency",
      iconName: "Sparkles",
      color: "from-blue-500/40",
      imageUrl: ""
    };
    const newSlides = [...currentSlides, newSlide];
    await setDoc(bannerConfigRef!, { slides: newSlides }, { merge: true });
    toast({ title: 'New Banner Slot Added' });
  };

  const handleRemoveBanner = async (index: number) => {
    if (!firestore || !isCreator) return;
    const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
    const newSlides = currentSlides.filter((_, i) => i !== index);
    await setDoc(bannerConfigRef!, { slides: newSlides }, { merge: true });
    toast({ title: 'Banner Removed' });
  };

  const handleUpdateBannerMeta = async (index: number, field: string, value: string) => {
    if (!firestore || !isCreator) return;
    const currentSlides = [...(bannerConfig?.slides || DEFAULT_SLIDES)];
    currentSlides[index] = { ...currentSlides[index], [field]: value };
    await setDoc(bannerConfigRef!, { slides: currentSlides }, { merge: true });
  };

  const handleThemeUpload = async (file: File) => {
    if (!storage || !firestore) return;
    
    if (!newThemeName.trim()) {
      toast({ 
        variant: 'destructive', 
        title: 'Missing Identifier', 
        description: 'Please enter a Theme Name before uploading visual assets.' 
      });
      return;
    }

    setIsUploadingTheme(true);
    try {
      const timestamp = Date.now();
      const sRef = ref(storage, `roomThemes/theme_${timestamp}.jpg`);
      const result = await uploadBytes(sRef, file);
      const url = await getDownloadURL(result.ref);
      
      const themeRef = doc(collection(firestore, 'roomThemes'));
      await setDoc(themeRef, { 
        id: themeRef.id, 
        name: newThemeName.trim(), 
        url: url, 
        category: newThemeCategory, 
        price: parseInt(newThemePrice) || 0,
        durationDays: parseInt(newThemeDuration) || 7,
        createdAt: serverTimestamp(), 
        accentColor: '#FFCC00', 
        seatColor: 'rgba(255, 255, 255, 0.1)' 
      });
      
      toast({ title: 'Theme Synchronized', description: `${newThemeName} is now live in the Boutique.` });
      setNewThemeName('');
      setNewThemePrice('0');
      setNewThemeDuration('7');
    } catch (error: any) {
      console.error('[Theme Hub] Upload Error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Upload Failed', 
        description: error.message || 'Check connection and authority protocol.' 
      });
    } finally {
      setIsUploadingTheme(false);
    }
  };

  const handleLoginBGUpload = async (file: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingLoginBG(true);
    try {
      const sRef = ref(storage, `branding/login_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, file);
      const url = await getDownloadURL(result.ref);
      await setDoc(configRef, { loginBackgroundUrl: url }, { merge: true });
      toast({ title: 'Login Background Synchronized' });
    } finally {
      setIsUploadingLoginBG(false);
    }
  };

  const handleGameDPUploadClick = (game: any) => {
    setSelectedGameForSync(game);
    gameFileInputRef.current?.click();
  };

  const handleGameBGUploadClick = (game: any) => {
    setSelectedGameForSync(game);
    gameBGFileInputRef.current?.click();
  };

  const handleGameDPFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGameForSync) {
      await uploadGameLogo(selectedGameForSync, file);
      setSelectedGameForSync(null);
    }
  };

  const handleGameBGFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGameForSync) {
      await uploadGameBackground(selectedGameForSync, file);
      setSelectedGameForSync(null);
    }
  };

  const SearchToggle = ({ mode, setMode }: { mode: 'id' | 'name', setMode: (m: 'id' | 'name') => void }) => (
    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
       <button onClick={() => setMode('id')} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all", mode === 'id' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>By ID</button>
       <button onClick={() => setMode('name')} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all", mode === 'name' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>By Name</button>
    </div>
  );

  if (!isCreator) return <AppLayout><div className="flex h-[50vh] items-center justify-center text-destructive font-headline"><Shield className="h-12 w-12 mr-2" /> Portal Access Restricted</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto p-4 animate-in fade-in duration-700 font-headline bg-white min-h-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20"><Shield className="h-8 w-8 text-white" /></div>
             <div><h1 className="text-4xl font-bold uppercase italic tracking-tighter text-slate-900">Supreme Command</h1><p className="text-muted-foreground">Supreme Authority Protocol Active.</p></div>
          </div>
          <Badge className="bg-primary text-black font-black uppercase italic px-4 py-1.5 h-10 rounded-xl">Supreme Creator</Badge>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-10 items-start">
          <div className="w-full md:w-72 shrink-0 md:sticky md:top-24 h-fit">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <TabsList className="flex flex-col h-fit w-full bg-slate-50 shadow-2xl rounded-[2.5rem] border border-slate-100 p-3 gap-2 overflow-visible">
                <TabsTrigger value="app-data" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Database className="h-4 w-4" /> App Ledger
                </TabsTrigger>
                <TabsTrigger value="themes" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Palette className="h-4 w-4" /> Theme Hub
                </TabsTrigger>
                <TabsTrigger value="tags" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <BadgeCheck className="h-4 w-4" /> Assign Tags
                </TabsTrigger>
                <TabsTrigger value="assign-center" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ShieldCheck className="h-4 w-4" /> Assign Center
                </TabsTrigger>
                <TabsTrigger value="authority" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Zap className="h-4 w-4" /> Authority Hub
                </TabsTrigger>
                <TabsTrigger value="app-branding" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Palette className="h-4 w-4" /> App Branding
                </TabsTrigger>
                <TabsTrigger value="pin-control" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Pin className="h-4 w-4" /> Pin Control
                </TabsTrigger>
                <TabsTrigger value="member-directory" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Users className="h-4 w-4" /> Member Directory
                </TabsTrigger>
                <TabsTrigger value="ranking-themes" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Trophy className="h-4 w-4" /> Ranking Themes
                </TabsTrigger>
                <TabsTrigger value="user-records" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <UserSearch className="h-4 w-4 text-rose-500" /> User Ledger
                </TabsTrigger>
                <TabsTrigger value="id-ban" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Gavel className="h-4 w-4" /> ID Ban Control
                </TabsTrigger>
                <TabsTrigger value="banners" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ImageIcon className="h-4 w-4" /> Banners
                </TabsTrigger>
                <TabsTrigger value="games" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Gamepad2 className="h-4 w-4" /> Game Sync
                </TabsTrigger>
                <TabsTrigger value="broadcaster" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Megaphone className="h-4 w-4" /> Broadcaster
                </TabsTrigger>
                <TabsTrigger value="direct-messenger" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <MessageSquareText className="h-4 w-4" /> Direct Messenger
                </TabsTrigger>
                <TabsTrigger value="special-id" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Type className="h-4 w-4" /> Special ID
                </TabsTrigger>
                <TabsTrigger value="rewards" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Gift className="h-4 w-4" /> Rewards
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 w-full min-w-0">
            <TabsContent value="app-data" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0 flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-blue-600"><BarChart3 className="h-6 w-6" /> App Economic Ledger</CardTitle>
                        <CardDescription>Global coin circulation and economic sync metrics.</CardDescription>
                     </div>
                     <Button onClick={handleSyncAppData} disabled={isSyncingAppData} className="bg-blue-600 h-12 rounded-xl">
                        {isSyncingAppData ? <Loader className="animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Sync Ledger
                     </Button>
                  </CardHeader>
                  <CardContent className="px-0 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex flex-col gap-1">
                           <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Total Coins in Tribe</p>
                           <div className="flex items-center gap-2 text-2xl font-black text-blue-900 italic">
                              <GoldCoinIcon className="h-6 w-6" />
                              {appStats.totalCoins.toLocaleString()}
                           </div>
                        </div>
                        <div className="p-6 bg-cyan-50 rounded-3xl border-2 border-cyan-100 flex flex-col gap-1">
                           <p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Total Diamonds Accumulated</p>
                           <div className="flex items-center gap-2 text-2xl font-black text-cyan-900 italic">
                              <Sparkles className="h-6 w-6" />
                              {appStats.totalDiamonds.toLocaleString()}
                           </div>
                        </div>
                        <div className="p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 flex flex-col gap-1">
                           <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Total Economic Output (Spent)</p>
                           <div className="flex items-center gap-2 text-2xl font-black text-purple-900 italic">
                              <BarChart3 className="h-6 w-6" />
                              {appStats.totalSpent.toLocaleString()}
                           </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex flex-col gap-1">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Synchronized Users</p>
                           <div className="flex items-center gap-2 text-2xl font-black text-slate-900 italic">
                              <Users className="h-6 w-6" />
                              {appStats.totalUsers.toLocaleString()}
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="pin-control" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600">
                        <Pin className="h-6 w-6" /> Sovereign Frequency Pin
                     </CardTitle>
                     <CardDescription>Target a chat room to pin it to the absolute top of the global grid permanently.</CardDescription>
                  </CardHeader>
                  
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Input 
                          placeholder="Enter Room Number (e.g. 1000021)" 
                          value={roomPinSearchId} 
                          onChange={(e) => setRoomPinSearchId(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleRoomPinSearch()} 
                          className="h-14 rounded-2xl border-2" 
                        />
                        <Button onClick={handleRoomPinSearch} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingRoomPin}>Find Frequency</Button>
                     </div>
                  </div>

                  {targetRoomForPin && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center justify-between border-b pb-6">
                          <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16 border-2 border-white shadow-xl rounded-xl">
                                <AvatarImage src={targetRoomForPin.coverUrl || undefined} />
                                <AvatarFallback>RM</AvatarFallback>
                             </Avatar>
                             <div>
                                <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetRoomForPin.name || targetRoomForPin.title}</p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room ID: {targetRoomForPin.roomNumber}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Pin Frequency</p>
                             {targetRoomForPin.isPinned ? (
                               <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] py-1 px-3">PINNED ACTIVE</Badge>
                             ) : (
                               <Badge className="bg-slate-200 text-slate-400 font-black uppercase text-[10px] py-1 px-3 shadow-none">NOT PINNED</Badge>
                             )}
                          </div>
                       </div>

                       <Button 
                         onClick={handleToggleRoomPin} 
                         disabled={isPinningRoom} 
                         className={cn(
                           "w-full h-16 rounded-[1.5rem] font-black uppercase italic text-xl shadow-xl transition-all",
                           targetRoomForPin.isPinned 
                             ? "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100" 
                             : "bg-emerald-600 text-white hover:bg-emerald-700"
                         )}
                       >
                          {isPinningRoom ? <Loader className="animate-spin mr-2 h-6 w-6" /> : targetRoomForPin.isPinned ? <><PinOff className="mr-2 h-6 w-6" /> Unpin Frequency</> : <><Pin className="mr-2 h-6 w-6" /> Pin to Top</>}
                       </Button>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="app-branding" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-pink-600"><Palette className="h-6 w-6" /> App Visual Branding</CardTitle>
                     <CardDescription>Dispatch global assets and room notices across the Ummy network.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Megaphone className="h-5 w-5 text-orange-600" />
                              <span className="font-black uppercase italic text-sm text-slate-900">Global Room Notice (Row 1)</span>
                           </div>
                           <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[8px] uppercase">All Rooms Sync</Badge>
                        </div>
                        <div className="flex gap-2">
                           <Input 
                             placeholder="Write global room announcement..." 
                             value={globalAnnouncementInput}
                             onChange={(e) => setGlobalAnnouncementInput(e.target.value)}
                             className="h-14 rounded-2xl border-2 bg-white font-black italic shadow-sm"
                           />
                           <Button 
                             onClick={handleUpdateGlobalNotice} 
                             disabled={isUpdatingGlobalNotice || !globalAnnouncementInput.trim()}
                             className="h-14 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-900/20"
                           >
                              {isUpdatingGlobalNotice ? <Loader className="animate-spin" /> : <Send className="h-5 w-5" />}
                           </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold italic px-1">
                           This text will appear as the first announcement row in every chat room.
                        </p>
                     </div>

                     <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <ImageIcon className="h-5 w-5 text-pink-600" />
                              <span className="font-black uppercase italic text-sm text-slate-900">Login Page Background</span>
                           </div>
                           {config?.loginBackgroundUrl && (
                             <Button variant="ghost" size="sm" className="text-[8px] font-black uppercase text-red-500" onClick={() => updateDoc(configRef!, { loginBackgroundUrl: null })}>Reset to Default</Button>
                           )}
                        </div>
                        
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border-2 border-white shadow-inner flex items-center justify-center">
                           {config?.loginBackgroundUrl ? (
                             <Image src={config.loginBackgroundUrl} fill className="object-cover" alt="Login BG" unoptimized />
                           ) : (
                             <div className="flex flex-col items-center justify-center gap-2 text-white/20">
                                <ImageIcon className="h-10 w-10" />
                                <span className="uppercase font-black text-[10px] tracking-widest">Stars Default Active</span>
                             </div>
                           )}
                           {isUploadingLoginBG && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin" /></div>}
                           <button 
                             onClick={() => loginBGFileInputRef.current?.click()}
                             className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-xl text-pink-600 active:scale-90 transition-transform"
                           >
                              <Camera className="h-6 w-6" />
                           </button>
                        </div>
                        <input type="file" ref={loginBGFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLoginBGUpload(e.target.files[0])} />
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="ranking-themes" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-yellow-600"><Trophy className="h-6 w-6" /> Ranking Environmental Themes</CardTitle>
                     <CardDescription>Dispatch high-fidelity backgrounds for global ranking dimensions.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-8">
                     {[
                       { key: 'honor', label: 'Honor (Rich)', icon: Crown },
                       { key: 'charm', label: 'Charm', icon: Sparkles },
                       { key: 'room', label: 'Room Rankings', icon: Home },
                       { key: 'cp', label: 'Couple Challenge', icon: Heart }
                     ].map((item) => (
                       <div key={item.key} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <item.icon className="h-5 w-5 text-yellow-600" />
                                <span className="font-black uppercase italic text-sm">{item.label}</span>
                             </div>
                             {rankingConfig?.[item.key] && (
                               <Button variant="ghost" size="sm" className="text-[8px] font-black uppercase text-red-500" onClick={() => updateDoc(rankingConfigRef!, { [item.key]: null })}>Reset</Button>
                             )}
                          </div>
                          
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-inner flex items-center justify-center">
                             {rankingConfig?.[item.key] ? (
                               <Image src={rankingConfig[item.key]} fill className="object-cover" alt="BG" unoptimized />
                             ) : (
                               <div className="text-center opacity-20"><ImageIcon className="h-8 w-8 mx-auto mb-1" /><span className="text-[8px] font-black uppercase">Nebula Default Active</span></div>
                             )}
                             {uploadingRankingKey === item.key && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin" /></div>}
                             <button 
                               onClick={() => { setUploadingRankingKey(item.key); rankingBGFileInputRef.current?.click(); }}
                               className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-lg text-yellow-600 active:scale-90 transition-transform"
                             >
                                <Camera className="h-4 w-4" />
                             </button>
                          </div>
                       </div>
                     ))}
                  </CardContent>
               </Card>
               <input type="file" ref={rankingBGFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadingRankingKey && handleRankingBGUpload(uploadingRankingKey, e.target.files[0])} />
            </TabsContent>

            <TabsContent value="authority" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-primary"><Zap className="h-6 w-6" /> Zap Authority Protocol</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                     <div className="flex gap-4">
                        <Input placeholder="Search member by name..." className="h-12 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()} />
                        <Button onClick={handleSearchUsers} className="h-12 rounded-xl bg-primary text-white" disabled={isSearching}>{isSearching ? <Loader className="animate-spin" /> : 'Search'}</Button>
                     </div>
                     <div className="space-y-4">
                        {foundUsers.map((u) => (
                          <div key={u.id} className="p-4 bg-white rounded-2xl border flex flex-col gap-4 shadow-sm">
                             <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-slate-50"><AvatarImage src={u.avatarUrl || undefined} /><AvatarFallback>U</AvatarFallback></Avatar>
                                <div className="flex-1">
                                   <p className="font-black text-sm uppercase italic text-slate-900">{u.username}</p>
                                   {u.specialId ? <SpecialIdBadge id={u.specialId} color={u.specialIdColor} /> : <p className="text-[10px] text-muted-foreground">ID: {u.accountNumber || u.id.slice(0, 6)}</p>}
                                </div>
                                <div className="flex gap-2">
                                   <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'coins', 1000)} className="rounded-full h-8 text-[10px]">+1k</Button>
                                   <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'diamonds', 100)} className="rounded-full h-8 text-[10px]">+100</Button>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {AUTHORITY_ROLES.map(role => (
                                  <Button key={role.id} variant={u.tags?.includes(role.id) ? 'default' : 'outline'} size="sm" onClick={() => toggleUserRole(u.id, role.id, u.tags)} className="h-10 text-[8px] font-black uppercase rounded-xl">{role.label}</Button>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="member-directory" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0 flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Users className="h-6 w-6" /> Tribal Member Archive</CardTitle>
                        <CardDescription>Comprehensive list of all synchronized tribe members and their signatures.</CardDescription>
                     </div>
                     <Button onClick={handleSyncDirectory} disabled={isSyncingDirectory} className="bg-black h-12 rounded-xl">
                        {isSyncingDirectory ? <Loader className="animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Sync Directory
                     </Button>
                  </CardHeader>
                  <CardContent className="px-0">
                     <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-200">
                        {tribalMembers.length === 0 ? (
                          <div className="py-40 text-center opacity-20 italic">Awaiting Synchronized Directory...</div>
                        ) : tribalMembers.map(member => (
                          <div key={member.id} className="p-6 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                             <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm"><AvatarImage src={member.avatarUrl || undefined} /></Avatar>
                                <div>
                                   <p className="font-black text-sm uppercase text-slate-900">{member.username}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      {member.specialId ? <SpecialIdBadge id={member.specialId} color={member.specialIdColor} /> : <span className="text-[10px] font-bold text-slate-400">ID: {member.accountNumber}</span>}
                                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Spent: {member.wallet?.totalSpent.toLocaleString() || 0}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="flex items-center gap-1.5 justify-end text-blue-600 font-black italic">
                                   <GoldCoinIcon className="h-4 w-4" />
                                   {member.wallet?.coins.toLocaleString() || 0}
                                </div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {member.isOnline ? 'ONLINE' : 'STARDUST'}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="user-records" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-rose-600"><UserSearch className="h-6 w-6" /> Tribe Member Records</CardTitle>
                     <CardDescription>Audit the economic and social signatures of any tribe member. Full wallet history visibility.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="flex flex-col gap-4">
                        <SearchToggle mode={recordSearchMode} setMode={setRecordSearchMode} />
                        <div className="flex gap-4">
                           <Input placeholder={recordSearchMode === 'id' ? "Enter ID (Special or Account)..." : "Enter Username..."} value={recordSearchId} onChange={(e) => setRecordSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(recordSearchMode, recordSearchId, setTargetUserForRecord, setIsSearchingRecord)} className="h-14 rounded-2xl border-2" />
                           <Button onClick={() => handleGenericSearch(recordSearchMode, recordSearchId, setTargetUserForRecord, setIsSearchingRecord)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingRecord}>Audit Identity</Button>
                        </div>
                     </div>

                     {targetUserForRecord && (
                       <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
                          <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20 border-4 border-white shadow-xl"><AvatarImage src={targetUserForRecord.avatarUrl || undefined} /></Avatar>
                                <div>
                                   <h3 className="text-2xl font-black uppercase italic text-slate-900">{targetUserForRecord.username}</h3>
                                   <div className="flex flex-col gap-1 mt-1">
                                      {targetUserForRecord.specialId && <SpecialIdBadge id={targetUserForRecord.specialId} color={targetUserForRecord.specialIdColor} />}
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account: {targetUserForRecord.accountNumber}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Established</p>
                                <p className="font-black text-slate-900 uppercase italic">{targetUserForRecord.createdAt?.toDate() ? format(targetUserForRecord.createdAt.toDate(), 'PPP') : 'Stardust'}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-2"><div className="flex items-center gap-2 text-blue-600 mb-2"><Wallet className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Wallet Balance</span></div><div className="flex items-center gap-2 text-2xl font-black text-blue-900 italic"><GoldCoinIcon className="h-6 w-6" />{targetUserForRecord.wallet?.coins.toLocaleString() || 0}</div></div>
                             <div className="p-6 bg-cyan-50 rounded-3xl border-2 border-cyan-100 space-y-2"><div className="flex items-center gap-2 text-cyan-600 mb-2"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Diamonds Received</span></div><div className="flex items-center gap-2 text-2xl font-black text-cyan-900 italic"><Activity className="h-6 w-6" />{targetUserForRecord.wallet?.diamonds.toLocaleString() || 0}</div></div>
                             <div className="p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 space-y-2"><div className="flex items-center gap-2 text-purple-600 mb-2"><History className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Total Spend Record</span></div><div className="flex items-center gap-2 text-2xl font-black text-purple-900 italic"><BarChart3 className="h-6 w-6" />{targetUserForRecord.wallet?.totalSpent.toLocaleString() || 0}</div></div>
                          </div>

                          <div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-red-100 flex flex-col items-center gap-6">
                             <div className="text-center space-y-2">
                                <h4 className="text-xl font-black uppercase italic text-red-600">Supreme Wallet Purge</h4>
                                <p className="textxs font-body italic text-red-800/60 max-w-sm">DANGER: This protocol will PERMANENTLY reset this member's Coins, Diamonds, and Spend history to zero. Use only for catastrophic protocol violations.</p>
                             </div>
                             <Button onClick={handleResetWallet} disabled={isResettingWallet} variant="destructive" className="h-16 px-12 rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                                {isResettingWallet ? <Loader className="animate-spin mr-2" /> : <Trash2 className="h-6 w-6 mr-2" />} Execute Global Reset
                             </Button>
                          </div>
                       </div>
                     )}
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="assign-center" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900">
                        <ShieldCheck className="h-6 w-6 text-indigo-500" /> Assign Center Portal
                     </CardTitle>
                     <CardDescription>Authorize or revoke Seller Center access for tribe members. Updates are instantaneous.</CardDescription>
                  </CardHeader>
                  <div className="flex flex-col gap-4">
                     <SearchToggle mode={centerSearchMode} setMode={setCenterSearchMode} />
                     <div className="flex gap-4">
                        <Input placeholder={centerSearchMode === 'id' ? "Enter User ID (Special or Account)..." : "Enter Username..."} value={centerSearchId} onChange={(e) => setCenterSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(centerSearchMode, centerSearchId, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch(centerSearchMode, centerSearchId, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingCenter}>Find Identity</Button>
                     </div>
                  </div>
                  {targetUserForCenter && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center justify-between border-b pb-6">
                          <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForCenter.avatarUrl || undefined}/></Avatar>
                             <div>
                                <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForCenter.username}</p>
                                {targetUserForCenter.specialId ? <SpecialIdBadge id={targetUserForCenter.specialId} color={targetUserForCenter.specialIdColor} /> : <span className="text-[10px] font-bold text-slate-400 uppercase">Account: {targetUserForCenter.accountNumber}</span>}
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Current Status</p>
                             {targetUserForCenter.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) ? (
                               <Badge className="bg-green-500 text-white font-black uppercase text-[10px] py-1 px-3">Center Active</Badge>
                             ) : (
                               <Badge className="bg-slate-200 text-slate-400 font-black uppercase text-[10px] py-1 px-3 shadow-none">Center Inactive</Badge>
                             )}
                          </div>
                       </div>
                       <Button onClick={handleToggleSellerCenter} className={cn("w-full h-16 rounded-[1.5rem] font-black uppercase italic text-xl shadow-xl transition-all", targetUserForCenter.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) ? "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100" : "bg-indigo-600 text-white hover:bg-indigo-700")}>
                          {targetUserForCenter.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) ? <><UserX className="mr-2 h-6 w-6" /> Revoke Seller Center</> : <><ShieldCheck className="mr-2 h-6 w-6" /> Activate Seller Center</>}
                       </Button>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="id-ban" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-red-600">
                        <Gavel className="h-6 w-6" /> Supreme ID Ban Protocol
                     </CardTitle>
                     <CardDescription>Exclude members from the entire Ummy frequency network. Enter high-precision temporal offsets.</CardDescription>
                  </CardHeader>
                  
                  <div className="flex flex-col gap-4">
                     <SearchToggle mode={banSearchMode} setMode={setCenterSearchMode} />
                     <div className="flex gap-4">
                        <Input placeholder={banSearchMode === 'id' ? "Enter Target ID (Special or Account)..." : "Enter Target Username..."} value={banSearchId} onChange={(e) => setBanSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(banSearchMode, banSearchId, setTargetUserForBan, setIsSearchingBan)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch(banSearchMode, banSearchId, setTargetUserForBan, setIsSearchingBan)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingBan}>Locate Identity</Button>
                     </div>
                  </div>

                  {targetUserForBan && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center justify-between border-b pb-6">
                          <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForBan.avatarUrl || undefined}/></Avatar>
                             <div>
                                <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForBan.username}</p>
                                {targetUserForBan.specialId ? <SpecialIdBadge id={targetUserForBan.specialId} color={targetUserForBan.specialIdColor} /> : <span className="text-[10px] font-bold text-slate-400 uppercase">Account: {targetUserForBan.accountNumber}</span>}
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Authorization State</p>
                             {targetUserForBan.banStatus?.isBanned ? (
                               <Badge className="bg-red-600 text-white font-black uppercase text-[10px] py-1 px-3">BANNED</Badge>
                             ) : (
                               <Badge className="bg-green-500 text-white font-black uppercase text-[10px] py-1 px-3 shadow-none">AUTHORIZED</Badge>
                             )}
                          </div>
                       </div>

                       {!targetUserForBan.banStatus?.isBanned ? (
                         <div className="space-y-6">
                            <div className="grid gap-6">
                               <div className="flex items-center justify-between px-1">
                                  <p className="text-[10px] font-black uppercase text-gray-400">Temporal Exclusion Offset</p>
                                  <button onClick={() => setIsPermanentBan(!isPermanentBan)} className={cn("text-[8px] font-black uppercase italic px-2 py-0.5 rounded-md transition-all", isPermanentBan ? "bg-red-600 text-white" : "bg-slate-100 text-slate-400")}>
                                     {isPermanentBan ? 'Permanent Active' : 'Make Permanent'}
                                  </button>
                               </div>
                               
                               {!isPermanentBan ? (
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-black uppercase text-gray-400 text-center">Days</p>
                                       <Input type="text" inputMode="numeric" value={banDays} onChange={(e) => setBanDays(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-xl font-black italic text-center" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-black uppercase text-gray-400 text-center">Hours</p>
                                       <Input type="text" inputMode="numeric" value={banHours} onChange={(e) => setBanHours(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-xl font-black italic text-center" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-black uppercase text-gray-400 text-center">Minutes</p>
                                       <Input type="text" inputMode="numeric" value={banMinutes} onChange={(e) => setBanMinutes(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-xl font-black italic text-center" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-black uppercase text-gray-400 text-center">Seconds</p>
                                       <Input type="text" inputMode="numeric" value={banSeconds} onChange={(e) => setBanSeconds(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-xl font-black italic text-center" />
                                    </div>
                                 </div>
                               ) : (
                                 <div className="h-14 rounded-2xl border-2 border-red-100 bg-red-50 flex items-center justify-center gap-2">
                                    <Gavel className="h-5 w-5 text-red-600" />
                                    <span className="font-black uppercase italic text-red-600">Infinite Exclusion Protocol</span>
                                 </div>
                               )}
                            </div>
                            <Button onClick={handleBanUser} disabled={isBanning} className="w-full h-16 rounded-[1.5rem] bg-red-600 text-white font-black uppercase italic text-xl shadow-xl hover:bg-red-700 active:scale-95 transition-all">
                               {isBanning ? <Loader className="animate-spin mr-2" /> : <Gavel className="mr-2" />} Execute Supreme Ban
                            </Button>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 space-y-2">
                               <p className="text-[10px] font-black uppercase text-red-600">Ban Active Until</p>
                               <p className="text-xl font-black italic text-red-900">
                                  {targetUserForBan.banStatus.bannedUntil 
                                    ? format(targetUserForBan.banStatus.bannedUntil.toDate(), 'PPP HH:mm:ss') 
                                    : 'PERMANENT EXCLUSION'}
                               </p>
                            </div>
                            <Button onClick={handleUnbanUser} disabled={isBanning} className="w-full h-16 rounded-[1.5rem] bg-green-600 text-white font-black uppercase italic text-xl shadow-xl hover:bg-green-700 active:scale-95 transition-all">
                               {isBanning ? <Loader className="animate-spin mr-2" /> : <Zap className="mr-2" />} Synchronize Restoration (Unban)
                            </Button>
                         </div>
                       )}
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="themes" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-rose-500"><Palette className="h-6 w-6" /> Theme Hub</CardTitle></CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-4">
                           <Input placeholder="Theme Name..." value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} className="h-14 rounded-2xl border-2 bg-white text-lg font-black italic shadow-sm" />
                           <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Price (Coins)</Label>
                                <Input type="number" value={newThemePrice} onChange={(e) => setNewThemePrice(e.target.value)} className="h-12 rounded-xl border-2" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Duration (Days)</Label>
                                <Input type="number" value={newThemeDuration} onChange={(e) => setNewThemeDuration(e.target.value)} className="h-12 rounded-xl border-2" />
                              </div>
                           </div>
                           <Select value={newThemeCategory} onValueChange={(val: any) => setNewThemeCategory(val)}>
                              <SelectTrigger className="h-14 rounded-2xl border-2 bg-white font-black italic"><SelectValue placeholder="Category" /></SelectTrigger>
                              <SelectContent className="bg-white rounded-2xl font-black italic">
                                 <SelectItem value="general">General</SelectItem><SelectItem value="entertainment">Entertainment</SelectItem><SelectItem value="help">Help</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white p-6 group">
                           <button onClick={() => themeFileInputRef.current?.click()} disabled={isUploadingTheme} className="flex flex-col items-center gap-3 active:scale-95 transition-transform">
                              <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">{isUploadingTheme ? <Loader className="animate-spin h-8 w-8" /> : <Upload className="h-8 w-8" />}</div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload visual sync</span>
                           </button>
                           <input type="file" ref={themeFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleThemeUpload(e.target.files[0])} />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {customThemes?.map((theme) => (
                          <Card key={theme.id} className="rounded-2xl overflow-hidden border-2 shadow-sm group relative">
                             <div className="relative aspect-square">
                                <Image src={theme.url} alt={theme.name} fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button variant="destructive" size="icon" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'roomThemes', theme.id))}><Trash2 className="h-4 w-4" /></Button></div>
                             </div>
                             <div className="p-3 text-center border-t">
                               <p className="text-[10px] font-black uppercase truncate">{theme.name}</p>
                               <div className="flex items-center justify-center gap-1 mt-1">
                                  <GoldCoinIcon className="h-2 w-2" />
                                  <span className="text-[8px] font-bold">{theme.price || 0}</span>
                                  <span className="text-[8px] text-slate-400">/ {theme.durationDays || 7}d</span>
                               </div>
                             </div>
                          </Card>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="banners" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0 flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-blue-600"><ImageIcon className="h-6 w-6" /> Global Banners</CardTitle>
                        <CardDescription>Manage unlimited event banners. Set titles, subtitles, and icons.</CardDescription>
                     </div>
                     <Button onClick={handleAddBanner} className="bg-primary text-black font-black uppercase italic rounded-xl h-12 shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4 mr-2" /> Add Banner Slot
                     </Button>
                  </CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="grid grid-cols-1 gap-8">
                       {(bannerConfig?.slides || DEFAULT_SLIDES).map((slide: any, idx: number) => (
                         <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex flex-col md:flex-row gap-8 group relative transition-all hover:border-blue-100">
                            <div className="w-full md:w-72 shrink-0 h-40 relative rounded-2xl overflow-hidden shadow-xl bg-slate-200">
                               {slide.imageUrl ? (
                                 <Image src={slide.imageUrl} alt="Banner" fill className="object-cover" unoptimized />
                               ) : (
                                 <div className="flex items-center justify-center h-full"><ImageIcon className="h-10 w-10 text-slate-400" /></div>
                               )}
                               {isUploadingBanner === idx && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}
                               <button 
                                 onClick={() => bannerFileInputRefs.current[idx]?.click()}
                                 className="absolute bottom-3 right-3 bg-primary text-black p-3 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all border-2 border-white"
                               >
                                  <Camera className="h-5 w-5" />
                               </button>
                               <input type="file" ref={el => { bannerFileInputRefs.current[idx] = el; }} className="hidden" onChange={(e) => e.target.files?.[0] && handleBannerImageUpload(idx, e.target.files[0])} />
                            </div>

                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Banner Title</Label>
                                  <Input 
                                    value={slide.title} 
                                    onChange={(e) => handleUpdateBannerMeta(idx, 'title', e.target.value)}
                                    placeholder="e.g. Tribe Events"
                                    className="h-14 rounded-2xl border-2 font-black italic"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Subtitle Frequency</Label>
                                  <Input 
                                    value={slide.subtitle} 
                                    onChange={(e) => handleUpdateBannerMeta(idx, 'subtitle', e.target.value)}
                                    placeholder="e.g. Global Frequency Sync"
                                    className="h-14 rounded-2xl border-2 font-body italic"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Icon Signature</Label>
                                  <Select value={slide.iconName} onValueChange={(val) => handleUpdateBannerMeta(idx, 'iconName', val)}>
                                     <SelectTrigger className="h-14 rounded-2xl border-2 font-black italic">
                                        <SelectValue placeholder="Select Icon" />
                                     </SelectTrigger>
                                     <SelectContent className="rounded-2xl font-black italic">
                                        {['Sparkles', 'Trophy', 'Gamepad2', 'Zap', 'Star', 'Users', 'Heart'].map(icon => (
                                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>
                               <div className="flex items-end">
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleRemoveBanner(idx)}
                                    className="w-full h-14 rounded-2xl uppercase font-black italic text-sm shadow-lg shadow-red-500/10"
                                  >
                                     <Trash2 className="h-5 w-5 mr-2" /> Purge Banner
                                  </Button>
                               </div>
                            </div>
                         </div>
                       ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="broadcaster" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Megaphone className="h-6 w-6 text-primary" /> Global Broadcaster</CardTitle></CardHeader>
                  <CardContent className="px-0 space-y-6">
                     <div className="space-y-4">
                        <Input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} className="h-14 rounded-2xl border-2 text-lg font-black italic" />
                        <Textarea placeholder="Type official message..." value={broadcastContent} onChange={(e) => setBroadcastContent(e.target.value)} className="h-40 rounded-3xl border-2 p-6 text-base font-body italic resize-none" />
                     </div>
                     <Button onClick={handleSystemBroadcast} disabled={isBroadcasting || !broadcastContent.trim()} className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase italic text-xl shadow-xl">
                        {isBroadcasting ? <Loader className="animate-spin mr-2" /> : <Send className="mr-2" />} Synchronize Global Broadcast
                     </Button>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="direct-messenger" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-indigo-500"><MessageSquareText className="h-6 w-6" /> Direct Messenger</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4">
                     <SearchToggle mode={dmSearchMode} setMode={setDmSearchMode} />
                     <div className="flex gap-4">
                        <Input placeholder={dmSearchMode === 'id' ? "Enter Recipient ID (Special or Account)..." : "Enter Recipient Username..."} value={dmSearchId} onChange={(e) => setDmSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(dmSearchMode, dmSearchId, setTargetUserForDm, setIsSearchingDm)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch(dmSearchMode, dmSearchId, setTargetUserForDm, setIsSearchingDm)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingDm}>Find Identity</Button>
                     </div>
                  </div>
                  {targetUserForDm && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center gap-4 border-b pb-6">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForDm.avatarUrl || undefined}/></Avatar>
                          <div>
                             <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForDm.username}</p>
                             {targetUserForDm.specialId ? <SpecialIdBadge id={targetUserForDm.specialId} color={targetUserForDm.specialIdColor} /> : <span className="text-[10px] font-bold text-slate-400 uppercase">Account: {targetUserForDm.accountNumber}</span>}
                          </div>
                       </div>
                       <div className="space-y-4">
                          <Input value={dmTitle} onChange={(e) => setDmTitle(e.target.value)} className="h-14 rounded-2xl border-2 text-lg font-black italic" />
                          <Textarea placeholder="Type private system message..." value={dmContent} onChange={(e) => setDmContent(e.target.value)} className="h-40 rounded-3xl border-2 p-6 text-base font-body italic resize-none" />
                       </div>
                       <Button onClick={() => handleDirectMessage()} disabled={isSendingDm || !dmContent.trim()} className="w-full h-16 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase italic text-xl shadow-xl">
                          {isSendingDm ? <Loader className="animate-spin mr-2" /> : <Send className="mr-2" />} Synchronize Direct Sync
                       </Button>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="games" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-primary"><Gamepad2 className="h-6 w-6" /> Game Identity Sync</CardTitle><CardDescription>Synchronize visuals for the 3D Tribe Arena.</CardDescription></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {gamesList.map((game) => (
                       <Card key={game.slug} className="rounded-3xl overflow-hidden border-2 shadow-sm bg-white flex flex-col">
                          <div className="relative aspect-square flex items-center justify-center bg-slate-50">
                             {game.coverUrl ? <Image src={game.coverUrl} alt={game.title} fill unoptimized className="object-cover" /> : <Gamepad2 className="h-12 w-12 text-slate-200" />}
                             {isUploadingGameDP && selectedGameForSync?.slug === game.slug && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="h-8 w-8 animate-spin text-white" /></div>}
                          </div>
                          <div className="p-4 flex-1 flex flex-col gap-3">
                             <CardTitle className="text-sm font-black uppercase italic text-slate-900 text-center">{game.title}</CardTitle>
                             <div className="flex flex-col gap-2">
                                <Button onClick={() => handleGameDPUploadClick(game)} className="w-full h-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] italic shadow-lg" disabled={isUploadingGameDP}>
                                   <Camera className="h-3 w-3 mr-2" /> Sync Cover (DP)
                                </Button>
                                <Button onClick={() => handleGameBGUploadClick(game)} className="w-full h-10 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] italic shadow-lg" disabled={isUploadingGameBG}>
                                   <Monitor className="h-3 w-3 mr-2" /> Sync Theme (BG)
                                </Button>
                             </div>
                             {game.backgroundUrl && (
                               <div className="mt-2 text-center">
                                  <p className="text-[8px] font-black text-green-600 uppercase tracking-widest flex items-center justify-center gap-1">
                                     <CheckCircle2 className="h-2 w-2" /> Custom Theme Active
                                  </p>
                               </div>
                             )}
                          </div>
                       </Card>
                     ))}
                  </CardContent>
               </Card>
               <input type="file" ref={gameFileInputRef} className="hidden" accept="image/*" onChange={handleGameDPFileChange} />
               <input type="file" ref={gameBGFileInputRef} className="hidden" accept="image/*" onChange={handleGameBGFileChange} />
            </TabsContent>

            <TabsContent value="tags" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><BadgeCheck className="h-6 w-6 text-primary" /> Assign Official Tags</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4">
                     <SearchToggle mode={tagSearchMode} setMode={setTagSearchMode} />
                     <div className="flex gap-4">
                        <Input placeholder={tagSearchMode === 'id' ? "Enter User ID (Special or Account)..." : "Enter Username..."} value={tagSearchId} onChange={(e) => setTagSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(tagSearchMode, tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch(tagSearchMode, tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingTag}>Find Identity</Button>
                     </div>
                  </div>
                  {targetUserForTags && (
                    <div className="mt-10 p-6 border-2 rounded-[2rem] flex flex-col gap-8 animate-in slide-in-from-bottom-4 bg-slate-50/30">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForTags.avatarUrl || undefined}/></Avatar>
                             <div>
                                <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForTags.username}</p>
                                {targetUserForTags.specialId ? <SpecialIdBadge id={targetUserForTags.specialId} color={targetUserForTags.specialIdColor} /> : <span className="text-[10px] font-bold text-slate-400 uppercase">Account: {targetUserForTags.accountNumber}</span>}
                             </div>
                          </div>
                          {targetUserForTags.tags?.includes('Official') && <OfficialTag />}
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {ELITE_TAGS.map(tag => (
                            <Button key={tag.id} variant={targetUserForTags.tags?.includes(tag.id) ? 'default' : 'outline'} className="h-16 rounded-2xl font-black uppercase italic text-xs transition-all border-2" onClick={() => toggleUserRole(targetUserForTags.id, tag.id, targetUserForTags.tags)}>{tag.label}</Button>
                          ))}
                       </div>
                       <Button variant="ghost" onClick={() => handleRemoveAllTags(targetUserForTags.id)} className="text-red-500 text-[10px] font-black uppercase">Purge All Authority</Button>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="special-id" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Type className="h-6 w-6 text-primary" /> Manage Special ID</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4">
                     <SearchToggle mode={specialIdSearchMode} setMode={setSpecialIdSearchMode} />
                     <div className="flex gap-4">
                        <Input placeholder={specialIdSearchMode === 'id' ? "Enter Current ID (Special or Account)..." : "Enter Username..."} value={idSearchInput} onChange={(e) => setIdSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(specialIdSearchMode, idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch(specialIdSearchMode, idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic">Find Identity</Button>
                     </div>
                  </div>
                  {targetUserForId && (
                    <div className="mt-10 p-6 border-2 rounded-[2rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/30">
                       <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForId.avatarUrl || undefined}/></Avatar>
                          <div>
                             <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForId.username}</p>
                             <div className="mt-1">
                                {targetUserForId.specialId ? (
                                  <div className="flex items-center gap-2"><span className="text-[10px] uppercase text-gray-400">Current:</span><SpecialIdBadge id={targetUserForId.specialId} color={targetUserForId.specialIdColor} /></div>
                                ) : (
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account: {targetUserForId.accountNumber}</p>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="flex gap-4 ml-2">
                             <button onClick={() => setSelectedColor('red')} className={cn("h-10 w-10 rounded-full bg-rose-500 border-4 transition-all flex items-center justify-center", selectedColor === 'red' ? "border-slate-900 scale-110" : "border-transparent opacity-60")}>{selectedColor === 'red' && <Check className="h-4 w-4 text-white" />}</button>
                             <button onClick={() => setSelectedColor('blue')} className={cn("h-10 w-10 rounded-full bg-blue-500 border-4 transition-all flex items-center justify-center", selectedColor === 'blue' ? "border-slate-900 scale-110" : "border-transparent opacity-60")}>{selectedColor === 'blue' && <Check className="h-4 w-4 text-white" />}</button>
                             <button onClick={() => setSelectedColor(null)} className={cn("h-10 w-10 rounded-full bg-slate-200 border-4 transition-all flex items-center justify-center", selectedColor === null ? "border-slate-900 scale-110" : "border-transparent opacity-60")}>{selectedColor === null && <X className="h-4 w-4 text-slate-600" />}</button>
                          </div>
                          <div className="flex gap-2"><Input placeholder="Enter New Numeric ID" value={newIdInput} onChange={(e) => setNewIdInput(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-xl font-black text-center flex-1" /><Button onClick={handleUpdateId} disabled={!newIdInput || isSavingId} className="h-14 px-10 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl">{isSavingId ? <Loader className="animate-spin" /> : 'Synchronize'}</Button><Button onClick={() => handleRemoveId()} disabled={isSavingId || !targetUserForId.specialId} variant="outline" className="h-14 px-6 border-2 border-red-100 text-red-500 font-black uppercase rounded-2xl"><Trash2 className="h-5 w-5" /></Button></div>
                       </div>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="rewards" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Gift className="h-6 w-6 text-primary" /> Sovereign Dispatch Center</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4">
                     <SearchToggle mode={rewardSearchMode} setMode={setRewardSearchMode} />
                     <div className="flex gap-4">
                        <Input placeholder={rewardSearchMode === 'id' ? "Recipient ID (Special or Account)..." : "Recipient Username..."} value={rewardSearchId} onChange={(e) => setRewardSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(rewardSearchMode, rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch(rewardSearchMode, rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingRewards}>Find Identity</Button>
                     </div>
                  </div>
                  {targetUserForRewards && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-10 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center gap-4 border-b pb-6">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForRewards.avatarUrl || undefined}/></Avatar>
                          <div>
                             <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForRewards.username}</p>
                             {targetUserForRewards.specialId ? <SpecialIdBadge id={targetUserForRewards.specialId} color={targetUserForRewards.specialIdColor} /> : <span className="text-[10px] font-bold text-slate-400 uppercase">Account: {targetUserForRewards.accountNumber}</span>}
                          </div>
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-4"><div className="flex items-center gap-2 text-primary"><GoldCoinIcon className="h-5 w-5" /><h4 className="font-black uppercase italic text-sm">Coin Frequency</h4></div><div className="flex gap-2"><Input placeholder="Volume..." value={coinDispatchAmount} onChange={(e) => setCoinDispatchAmount(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-lg font-black italic" /><Button onClick={handleDispatchCoins} disabled={isDispatching} className="h-14 px-8 bg-primary text-white rounded-2xl"><Send className="h-5 w-5" /></Button></div></div>
                          <div className="space-y-4"><div className="flex items-center gap-2 text-purple-500"><Star className="h-5 w-5" /><h4 className="font-black uppercase italic text-sm">Sync Elite Frames</h4></div><div className="flex flex-wrap gap-2">{DISPATCH_ASSETS.frames.map(frame => (<Button key={frame.id} variant="outline" size="sm" onClick={() => handleDispatchItem(frame.id as any, 'ownedItems')} className="h-10 text-[8px] font-black uppercase rounded-xl">{frame.name}</Button>))}</div></div>
                       </div>
                    </div>
                  )}
               </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
