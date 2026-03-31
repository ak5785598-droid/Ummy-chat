'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking, useStorage, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch, arrayUnion, arrayRemove, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Shield, Loader, Gift, UserCheck, Star, Zap, Heart, MessageSquare, BadgeCheck, Upload, Type, Image as ImageIcon, Gamepad2, Camera, Trash2, ShieldCheck, Store, Check, Mic2, Send, Megaphone, MessageSquareText, Palette, UserX, Gavel, History, Clock, Dices, Sparkles, Wand2, Database, BarChart3, Eye, Search, RefreshCcw, Users, CheckCircle2, Activity, Wallet, UserSearch, ClipboardList, ListTodo, Plus, Monitor, Trophy, Crown, Home, X, Copy, Pin, PinOff, ShoppingBag, ShieldAlert, Link as LinkIcon } from 'lucide-react';
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
    { id: 'honor-2026', name: 'Honor 2026' },
    { id: 'ummy-cs', name: 'Ummy CS Majestic' },
    { id: 'f1', name: 'Golden Official' },
    { id: 'f5', name: 'Golden wings' },
    { id: 'f7', name: 'Celestial Wings' },
    { id: 'little-devil', name: 'Little Devil' },
    { id: 'i-love-india', name: 'I Love India' },
  ]
};

const DEFAULT_SLIDES = [
  { id: 0, title: "Tribe Events", subtitle: "Global Frequency Sync", link: "", iconName: "Sparkles", color: "from-orange-500/40", imageUrl: "" },
  { id: 1, title: "Elite Rewards", subtitle: "Claim Your Daily Throne", link: "", iconName: "Trophy", color: "from-yellow-500/40", imageUrl: "" },
  { id: 2, title: "Game Zone", subtitle: "Enter the 3D Arena", link: "", iconName: "Gamepad2", color: "from-purple-500/40", imageUrl: "" }
];

const ACTIVE_GAME_FREQUENCIES = [
  { id: 'roulette', title: 'Roulette', slug: 'roulette', imageHint: 'roulette wheel' },
  { id: 'ludo', title: 'Ludo Masters', slug: 'ludo', imageHint: '3d ludo board' },
  { id: 'fruit-party', title: 'Fruit Party', slug: 'fruit-party', imageHint: '3d fruit icons' },
  { id: 'forest-party', title: 'Wild Party', slug: 'forest-party', imageHint: '3d lion head' },
];

const SpecialIdBadge = ({ id }: { id: string }) => {
  const { toast } = useToast();
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => { toast({ title: 'ID Copied' }); });
    }
  };
  return <span onClick={handleCopy} className="text-[10px] font-black uppercase italic tracking-widest text-slate-500 leading-none cursor-pointer hover:text-slate-700 transition-colors px-1">ID: {id}</span>;
};

const SearchToggle = ({ mode, setMode }: { mode: 'id' | 'name', setMode: (m: 'id' | 'name') => void }) => (
  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
     <button onClick={() => setMode('id')} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all", mode === 'id' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>By ID</button>
     <button onClick={() => setMode('name')} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all", mode === 'name' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>By Name</button>
  </div>
);

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
  const [globalAnnouncement2Input, setGlobalAnnouncement2Input] = useState('');
  const [isUpdatingGlobalNotice, setIsUpdatingGlobalNotice] = useState(false);
  const [isUpdatingGlobalNotice2, setIsUpdatingGlobalNotice2] = useState(false);

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

  // Universal Store Engine State
  const [storeName, setStoreName] = useState('');
  const [storePrice, setStorePrice] = useState('0');
  const [storeDuration, setStoreDuration] = useState('7');
  const [storeCategory, setStoreCategory] = useState<'Frame' | 'Bubble' | 'Theme' | 'Wave'>('Frame');
  const [isUploadingStore, setIsUploadingStore] = useState(false);
  const storeFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLoginBG, setIsUploadingLoginBG] = useState(false);
  const loginBGFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLoadingBG, setIsUploadingLoadingBG] = useState(false);
  const loadingBGFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingSplashBG, setIsUploadingSplashBG] = useState(false);
  const splashBGFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

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
  const gameLoadingBGFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameForSync, setSelectedGameForSync] = useState<any>(null);
  const [isUploadingGameLoadingBG, setIsUploadingGameLoadingBG] = useState(false);

  const [appStats, setAppStats] = useState({ totalCoins: 0, totalDiamonds: 0, totalSpent: 0, totalUsers: 0 });
  const [isSyncingAppData, setIsSyncingAppData] = useState(false);

  const [tribalMembers, setTribalMembers] = useState<any[]>([]);
  const [isSyncingDirectory, setIsSyncingDirectory] = useState(false);

  // Room Pin State
  const [roomPinSearchId, setRoomPinSearchId] = useState('');
  const [targetRoomForPin, setTargetRoomForPin] = useState<any>(null);
  const [isSearchingRoomPin, setIsSearchingRoomPin] = useState(false);
  const [isPinningRoom, setIsPinningRoom] = useState(false);

  // Game Oracle State
  const [oracleGame, setOracleGame] = useState('fruit-party');
  const [oracleResult, setOracleResult] = useState('');
  const [isUpdatingOracle, setIsUpdatingOracle] = useState(false);

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

  const recentWinsQuery = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return query(collection(firestore, 'globalGameWins'), orderBy('timestamp', 'desc'), limit(15));
  }, [firestore, isCreator]);
  const { data: recentWins } = useCollection(recentWinsQuery);

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

  const handleUpdateGlobalNotice = () => {
    if (!firestore || !isCreator || !configRef) return;
    setIsUpdatingGlobalNotice(true);
    updateDoc(configRef, { globalAnnouncement: globalAnnouncementInput, updatedAt: serverTimestamp() })
      .then(() => { toast({ title: 'Global Sync Complete', description: 'Room Notice Row 1 updated across the tribe.' }); })
      .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configRef.path, operation: 'update', requestResourceData: { globalAnnouncement: globalAnnouncementInput } })); })
      .finally(() => setIsUpdatingGlobalNotice(false));
  };

  const handleUpdateGlobalNotice2 = () => {
    if (!firestore || !isCreator || !configRef) return;
    setIsUpdatingGlobalNotice2(true);
    updateDoc(configRef, { globalAnnouncement2: globalAnnouncement2Input, updatedAt: serverTimestamp() })
      .then(() => { toast({ title: 'Global Sync Row 2 Complete', description: 'Room Notice Row 2 updated across the tribe.' }); })
      .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configRef.path, operation: 'update', requestResourceData: { globalAnnouncement2: globalAnnouncement2Input } })); })
      .finally(() => setIsUpdatingGlobalNotice2(false));
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
    } catch (e) { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' })); } 
    finally { setIsSyncingAppData(false); }
  };

  const handleSyncDirectory = async () => {
    if (!firestore || !isCreator) return;
    setIsSyncingDirectory(true);
    try {
      const snap = await getDocs(query(collection(firestore, 'users'), limit(50)));
      setTribalMembers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      toast({ title: 'Member Directory Synchronized' });
    } catch (e) { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' })); } 
    finally { setIsSyncingDirectory(false); }
  };

  const handleSearchUsers = async () => {
    if (!firestore || !searchQuery) return;
    setIsSearching(true);
    try {
      const q = query(collection(firestore, 'users'), where('username', '>=', searchQuery), where('username', '<=', searchQuery + '\uf8ff'), limit(10));
      const snap = await getDocs(q);
      setFoundUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    } finally { setIsSearching(false); }
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
        if (!snapAcc.empty) { foundUser = { ...snapAcc.docs[0].data(), id: snapAcc.docs[0].id }; }
        if (!foundUser) {
          const paddedId = inputVal.padStart(3, '0');
          const qSpec = query(collection(firestore, 'users'), where('specialId', '==', paddedId), limit(1));
          const snapSpec = await getDocs(qSpec);
          if (!snapSpec.empty) { foundUser = { ...snapSpec.docs[0].data(), id: snapSpec.docs[0].id }; }
        }
      } else {
        const qName = query(collection(firestore, 'users'), where('username', '>=', inputVal), where('username', '<=', inputVal + '\uf8ff'), limit(1));
        const snapName = await getDocs(qName);
        if (!snapName.empty) { foundUser = { ...snapName.docs[0].data(), id: snapName.docs[0].id }; }
      }
      if (foundUser) { setter(foundUser); } else { toast({ variant: 'destructive', title: 'Identity Not Found' }); }
    } finally { loadingSetter(false); }
  };

  const handleRoomPinSearch = async () => {
    if (!firestore || !roomPinSearchId) return;
    setIsSearchingRoomPin(true);
    try {
      const q = query(collection(firestore, 'chatRooms'), where('roomNumber', '==', roomPinSearchId.trim()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) { setTargetRoomForPin({ ...snap.docs[0].data(), id: snap.docs[0].id }); } else { toast({ variant: 'destructive', title: 'Frequency Not Found' }); }
    } finally { setIsSearchingRoomPin(false); }
  };

  const handleToggleRoomPin = () => {
    if (!firestore || !targetRoomForPin || !isCreator) return;
    setIsPinningRoom(true);
    const roomRef = doc(firestore, 'chatRooms', targetRoomForPin.id);
    const newPinStatus = !targetRoomForPin.isPinned;
    updateDoc(roomRef, { isPinned: newPinStatus, pinnedAt: newPinStatus ? serverTimestamp() : null })
      .then(() => { setTargetRoomForPin((prev: any) => ({ ...prev, isPinned: newPinStatus })); toast({ title: newPinStatus ? 'Frequency Pinned' : 'Frequency Unpinned' }); })
      .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: roomRef.path, operation: 'update' })); })
      .finally(() => setIsPinningRoom(false));
  };

  const handleResetWallet = async () => {
    if (!firestore || !targetUserForRecord || !isCreator) return;
    if (!confirm("Are you sure you want to PERMANENTLY RESET this user's wallet?")) return;
    setIsResettingWallet(true);
    const uRef = doc(firestore, 'users', targetUserForRecord.id);
    const pRef = doc(firestore, 'users', targetUserForRecord.id, 'profile', targetUserForRecord.id);
    const resetData = { 'wallet.coins': 0, 'wallet.diamonds': 0, 'wallet.totalSpent': 0, 'wallet.dailySpent': 0, updatedAt: serverTimestamp() };
    try {
      updateDocumentNonBlocking(uRef, resetData);
      updateDocumentNonBlocking(pRef, resetData);
      setTargetUserForRecord((prev: any) => ({ ...prev, wallet: { coins: 0, diamonds: 0, totalSpent: 0, dailySpent: 0 } }));
      toast({ title: 'Wallet Purged' });
    } finally { setIsResettingWallet(false); }
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
    } catch (e) { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users/notifications', operation: 'write' })); } 
    finally { setIsBroadcasting(false); }
  };

  const handleDirectMessage = () => {
    if (!firestore || !targetUserForDm || !dmContent.trim() || !isCreator) return;
    setIsSendingDm(true);
    const notifRef = collection(firestore, 'users', targetUserForDm.id, 'notifications');
    const msgData = { title: dmTitle, content: dmContent, type: 'direct_system', timestamp: serverTimestamp(), isRead: false };
    addDoc(notifRef, msgData)
      .then(() => { toast({ title: 'Message Dispatched' }); setDmContent(''); })
      .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: notifRef.path, operation: 'create', requestResourceData: msgData })); })
      .finally(() => setIsSendingDm(false));
  };

  const handleDispatchCoins = () => {
    if (!firestore || !targetUserForRewards || !coinDispatchAmount) return;
    setIsDispatching(true);
    const uRef = doc(firestore, 'users', targetUserForRewards.id);
    const pRef = doc(firestore, 'users', targetUserForRewards.id, 'profile', targetUserForRewards.id);
    const amt = parseInt(coinDispatchAmount);
    updateDocumentNonBlocking(uRef, { 'wallet.coins': increment(amt) });
    updateDocumentNonBlocking(pRef, { 'wallet.coins': increment(amt) });
    toast({ title: 'Coins Dispatched' });
    setCoinDispatchAmount('');
    setIsDispatching(false);
  };

  const handleDispatchItem = (itemId: string, type: 'ownedItems' | 'purchasedThemes') => {
    if (!firestore || !targetUserForRewards) return;
    const pRef = doc(firestore, 'users', targetUserForRewards.id, 'profile', targetUserForRewards.id);
    updateDocumentNonBlocking(pRef, { [`inventory.${type}`]: arrayUnion(itemId) });
    toast({ title: 'Asset Dispatched' });
  };

  const handleUpdateId = async () => {
    if (!firestore || !targetUserForId || !newIdInput) return;
    setIsSavingId(true);
    try {
      const paddedNewId = newIdInput.padStart(3, '0');
      const q = query(collection(firestore, 'users'), where('specialId', '==', paddedNewId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].id !== targetUserForId.id) { toast({ variant: 'destructive', title: 'Conflict', description: 'ID already assigned.' }); return; }
      const uRef = doc(firestore, 'users', targetUserForId.id);
      const pRef = doc(firestore, 'users', targetUserForId.id, 'profile', targetUserForId.id);
      const updateData = { specialId: paddedNewId, specialIdColor: null, updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(uRef, updateData);
      updateDocumentNonBlocking(pRef, updateData);
      setTargetUserForId((prev: any) => ({ ...prev, specialId: paddedNewId, specialIdColor: null }));
      toast({ title: 'ID Synchronized' });
      setNewIdInput('');
    } catch (e) { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' })); } 
    finally { setIsSavingId(false); }
  };

  const handleRemoveId = () => {
    if (!firestore || !targetUserForId) return;
    setIsSavingId(true);
    const uRef = doc(firestore, 'users', targetUserForId.id);
    const pRef = doc(firestore, 'users', targetUserForId.id, 'profile', targetUserForId.id);
    const updateData = { specialId: null, specialIdColor: null, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(uRef, updateData);
    updateDocumentNonBlocking(pRef, updateData);
    setTargetUserForId((prev: any) => ({ ...prev, specialId: null, specialIdColor: null }));
    toast({ title: 'ID Signature Purged' });
    setIsSavingId(false);
  };

  const handleBanUser = () => {
    if (!firestore || !targetUserForBan || !isCreator) return;
    setIsBanning(true);
    const days = parseInt(banDays) || 0;
    const hours = parseInt(banHours) || 0;
    const mins = parseInt(banMinutes) || 0;
    const secs = parseInt(banSeconds) || 0;
    const totalMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (mins * 60 * 1000) + (secs * 1000);
    const bannedUntil = isPermanentBan ? null : Timestamp.fromDate(new Date(Date.now() + totalMs));
    const uRef = doc(firestore, 'users', targetUserForBan.id);
    const pRef = doc(firestore, 'users', targetUserForBan.id, 'profile', targetUserForBan.id);
    const banData = { banStatus: { isBanned: true, bannedAt: serverTimestamp(), bannedUntil: bannedUntil, reason: 'Administrative Exclusion' } };
    setDoc(uRef, banData, { merge: true })
      .then(() => setDoc(pRef, banData, { merge: true }))
      .then(() => { setTargetUserForBan((prev: any) => ({ ...prev, banStatus: banData.banStatus })); toast({ title: 'ID Banned' }); })
      .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: uRef.path, operation: 'write', requestResourceData: banData })); })
      .finally(() => setIsBanning(false));
  };

  const handleUnbanUser = () => {
    if (!firestore || !targetUserForBan || !isCreator) return;
    setIsBanning(true);
    const uRef = doc(firestore, 'users', targetUserForBan.id);
    const pRef = doc(firestore, 'users', targetUserForBan.id, 'profile', targetUserForBan.id);
    const unbanData = { banStatus: { isBanned: false, bannedAt: null, bannedUntil: null, reason: null } };
    setDoc(uRef, unbanData, { merge: true })
      .then(() => setDoc(pRef, unbanData, { merge: true }))
      .then(() => { setTargetUserForBan((prev: any) => ({ ...prev, banStatus: unbanData.banStatus })); toast({ title: 'ID Unbanned' }); })
      .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: uRef.path, operation: 'write', requestResourceData: unbanData })); })
      .finally(() => setIsBanning(false));
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

  const toggleUserRole = (targetUid: string, roleId: string, currentTags: string[] = []) => {
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

  const handleToggleSellerCenter = () => {
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

  const handleToggleAdminPortal = () => {
    if (!firestore || !targetUserForCenter) return;
    const tags = targetUserForCenter.tags || [];
    const isAdmin = tags.includes('Official');
    const userRef = doc(firestore, 'users', targetUserForCenter.id);
    const profileRef = doc(firestore, 'users', targetUserForCenter.id, 'profile', targetUserForCenter.id);
    const newTags = isAdmin ? tags.filter(t => t !== 'Official') : [...tags, 'Official'];
    const updateData = { tags: newTags, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    setTargetUserForCenter((prev: any) => ({ ...prev, tags: newTags }));
    if (targetUserForTags?.id === targetUserForCenter.id) setTargetUserForTags((prev: any) => ({ ...prev, tags: newTags }));
    setFoundUsers(prev => prev.map(u => u.id === targetUserForCenter.id ? { ...u, tags: newTags } : u));
    toast({ title: isAdmin ? 'Admin Portal Access Revoked' : 'Admin Portal Access Granted' });
  };

  const handleRemoveAllTags = (targetUid: string) => {
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

  const handleBannerImageUpload = async (index: number, f: File) => {
    if (!storage || !bannerConfigRef) return;
    setIsUploadingBanner(index);
    try {
      const sRef = ref(storage, `banners/slide_${index}_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
      const newSlides = [...currentSlides];
      newSlides[index] = { ...newSlides[index], imageUrl: url };
      setDoc(bannerConfigRef, { slides: newSlides }, { merge: true }).then(() => toast({ title: 'Banner Updated' }))
        .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: bannerConfigRef.path, operation: 'write' })); });
    } finally { setIsUploadingBanner(null); }
  };

  const handleRankingBGUpload = async (key: string, f: File) => {
    if (!storage || !rankingConfigRef) return;
    setUploadingRankingKey(key);
    try {
      const sRef = ref(storage, `rankings/bg_${key}_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      setDoc(rankingConfigRef, { [key]: url }, { merge: true }).then(() => toast({ title: `${key.toUpperCase()} Background Updated` }))
        .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: rankingConfigRef.path, operation: 'write' })); });
    } finally { setUploadingRankingKey(null); }
  };

  const handleAddBanner = () => {
    if (!firestore || !isCreator) return;
    const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
    const newSlide = { title: "New Tribe Event", subtitle: "Join the Frequency", link: "", iconName: "Sparkles", color: "from-blue-500/40", imageUrl: "" };
    const newSlides = [...currentSlides, newSlide];
    setDoc(bannerConfigRef!, { slides: newSlides }, { merge: true }).catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: bannerConfigRef!.path, operation: 'write' })); });
  };

  const handleRemoveBanner = (index: number) => {
    if (!firestore || !isCreator) return;
    const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
    const newSlides = currentSlides.filter((_, i) => i !== index);
    setDoc(bannerConfigRef!, { slides: newSlides }, { merge: true }).catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: bannerConfigRef!.path, operation: 'write' })); });
  };

  const handleUpdateBannerMeta = (index: number, f: string, value: string) => {
    if (!firestore || !isCreator) return;
    const currentSlides = [...(bannerConfig?.slides || DEFAULT_SLIDES)];
    currentSlides[index] = { ...currentSlides[index], [f]: value };
    setDoc(bannerConfigRef!, { slides: currentSlides }, { merge: true }).catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: bannerConfigRef!.path, operation: 'write' })); });
  };

  const handleStoreItemUpload = async (f: File) => {
    if (!storage || !firestore) return;
    if (!storeName.trim()) { toast({ variant: 'destructive', title: 'Missing Name' }); return; }
    setIsUploadingStore(true);
    try {
      const sRef = ref(storage, `store/item_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      const itemRef = doc(collection(firestore, 'storeItems'));
      const itemData = { id: itemRef.id, name: storeName.trim(), url, category: storeCategory, price: parseInt(storePrice) || 0, durationDays: parseInt(storeDuration) || 7, createdAt: serverTimestamp() };
      setDoc(itemRef, itemData).then(() => { toast({ title: 'Item Synchronized' }); setStoreName(''); })
        .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'create' })); });
    } finally { setIsUploadingStore(false); }
  };

  const handleLoginBGUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingLoginBG(true);
    try {
      const sRef = ref(storage, `branding/login_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { loginBackgroundUrl: url }, { merge: true }).then(() => toast({ title: 'Login Background Synchronized' }))
        .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configRef.path, operation: 'write' })); });
    } finally { setIsUploadingLoginBG(false); }
  };

  const handleLoadingBGUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingLoadingBG(true);
    try {
      const sRef = ref(storage, `branding/loading_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { appLoadingBackgroundUrl: url }, { merge: true }).then(() => toast({ title: 'App Loading Sync Complete' }))
        .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configRef.path, operation: 'write' })); });
    } finally { setIsUploadingLoadingBG(false); }
  };

  const handleGameLoadingBGUpload = async (f: File) => {
    if (!storage || !firestore || !selectedGameForSync) return;
    setIsUploadingGameLoadingBG(true);
    try {
      const sRef = ref(storage, `games/${selectedGameForSync.slug}/loading_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      const gameRef = doc(firestore, 'games', selectedGameForSync.slug);
      updateDoc(gameRef, { loadingBackgroundUrl: url, updatedAt: serverTimestamp() })
        .then(() => toast({ title: `${selectedGameForSync.title} Loading Sync Complete` }));
    } finally {
      setIsUploadingGameLoadingBG(false);
      setSelectedGameForSync(null);
    }
  };

  const handleSplashBGUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingSplashBG(true);
    try {
      const sRef = ref(storage, `branding/splash_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { splashScreenUrl: url }, { merge: true }).then(() => toast({ title: 'Splash Background Synchronized' }))
        .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configRef.path, operation: 'write' })); });
    } finally { setIsUploadingSplashBG(false); }
  };

  const handleLogoUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingLogo(true);
    try {
      const sRef = ref(storage, `branding/logo_${Date.now()}.png`);
      const result = await uploadBytes(sRef, f);
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { customLogoUrl: url }, { merge: true }).then(() => toast({ title: 'Logo Synchronized', description: 'The new visual signature is live across the tribe.' }))
        .catch(err => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configRef.path, operation: 'write' })); });
    } finally { setIsUploadingLogo(false); }
  };

  const handleGameDPUploadClick = (g: any) => { setSelectedGameForSync(g); gameFileInputRef.current?.click(); };
  const handleGameBGUploadClick = (g: any) => { setSelectedGameForSync(g); gameBGFileInputRef.current?.click(); };
  const handleGameDPFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file && selectedGameForSync) { await uploadGameLogo(selectedGameForSync, file); setSelectedGameForSync(null); } };
  const handleGameBGFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file && selectedGameForSync) { await uploadGameBackground(selectedGameForSync, file); setSelectedGameForSync(null); } };

  const getOracleOptions = (game: string) => {
    switch (game) {
      case 'fruit-party':
        return [
          { id: 'strawberry', label: '🍓 Strawberry' }, { id: 'bananas', label: '🍌 Bananas' },
          { id: 'oranges', label: '🍊 Oranges' }, { id: 'watermelon', label: '🍉 Watermelon' },
          { id: 'pizza', label: '🍕 Pizza' }, { id: 'burrito', label: '🌯 Burrito' },
          { id: 'skewers', label: '🍢 Skewers' }, { id: 'chicken', label: '🍗 Chicken' },
        ];
      case 'wild-party':
        return [
          { id: 'turtle', label: '🐢 Turtle' }, { id: 'rabbit', label: '🐰 Rabbit' },
          { id: 'sheep', label: '🐑 Sheep' }, { id: 'fox', label: '🦊 Fox' },
          { id: 'rhino', label: '🦏 Rhino' }, { id: 'elephant', label: '🐘 Elephant' },
          { id: 'lion', label: '🦁 Lion' }, { id: 'tiger', label: '🐯 Tiger' },
        ];
      case 'roulette':
        return Array.from({ length: 37 }, (_, i) => ({ id: i.toString(), label: String(i) }));
      case 'teen-patti':
        return [{ id: 'WOLF', label: 'Wolf' }, { id: 'LION', label: 'Lion' }, { id: 'FISH', label: 'Fish' }];
      default: return [];
    }
  };

  const handleUpdateOracle = async () => {
    if (!firestore || !oracleGame || !oracleResult || !isCreator) return;
    setIsUpdatingOracle(true);
    const oracleRef = doc(firestore, 'gameOracle', oracleGame);
    const resultValue = oracleGame === 'roulette' ? parseInt(oracleResult) : oracleResult;
    try {
      await setDoc(oracleRef, { forcedResult: resultValue, isActive: true, updatedAt: serverTimestamp(), setBy: user?.uid });
      toast({ title: 'Fate Synchronized', description: `The next ${oracleGame} round will result in: ${oracleResult}` });
      setOracleResult('');
    } finally { setIsUpdatingOracle(false); }
  };

  if (!isCreator) return <AppLayout><div className="flex h-[50vh] items-center justify-center text-destructive font-headline"><Shield className="h-12 w-12 mr-2" /> Portal Access Restricted</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto p-4 animate-in fade-in duration-700 font-headline bg-white min-h-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20"><Shield className="h-8 w-8 text-white" /></div>
             <div><h1 className="text-4xl font-bold uppercase italic tracking-tighter text-slate-900">Supreme Command</h1><p className="text-muted-foreground">Emerald Authority Protocol Active.</p></div>
          </div>
          <Badge className="bg-emerald-600 text-white font-black uppercase italic px-4 py-1.5 h-10 rounded-xl shadow-lg border-2 border-white/20">Supreme Creator</Badge>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-10 items-start">
          <div className="w-full md:w-72 shrink-0 md:sticky md:top-24 h-fit">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <TabsList className="flex flex-col h-fit w-full bg-slate-50 shadow-2xl rounded-[2.5rem] border border-slate-100 p-3 gap-2 overflow-visible">
                <TabsTrigger value="app-data" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Database className="h-4 w-4" /> App Ledger</TabsTrigger>
                <TabsTrigger value="game-oracle" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Wand2 className="h-4 w-4" /> Game Oracle</TabsTrigger>
                <TabsTrigger value="app-branding" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Palette className="h-4 w-4" /> App Branding</TabsTrigger>
                <TabsTrigger value="pin-control" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Pin className="h-4 w-4" /> Pin Control</TabsTrigger>
                <TabsTrigger value="authority" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Zap className="h-4 w-4" /> Authority Hub</TabsTrigger>
                <TabsTrigger value="member-directory" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Users className="h-4 w-4" /> Member Directory</TabsTrigger>
                <TabsTrigger value="ranking-themes" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Trophy className="h-4 w-4" /> Ranking Themes</TabsTrigger>
                <TabsTrigger value="user-records" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><UserSearch className="h-4 w-4" /> User Ledger</TabsTrigger>
                <TabsTrigger value="assign-center" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><ShieldCheck className="h-4 w-4" /> Assign Center</TabsTrigger>
                <TabsTrigger value="id-ban" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Gavel className="h-4 w-4" /> ID Ban Control</TabsTrigger>
                <TabsTrigger value="banners" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><ImageIcon className="h-4 w-4" /> Banners</TabsTrigger>
                <TabsTrigger value="games" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Gamepad2 className="h-4 w-4" /> Game Sync</TabsTrigger>
                <TabsTrigger value="broadcaster" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Megaphone className="h-4 w-4" /> Broadcaster</TabsTrigger>
                <TabsTrigger value="direct-messenger" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><MessageSquareText className="h-4 w-4" /> Direct Messenger</TabsTrigger>
                <TabsTrigger value="tags" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><BadgeCheck className="h-4 w-4" /> Assign Tags</TabsTrigger>
                <TabsTrigger value="special-id" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Type className="h-4 w-4" /> Special ID</TabsTrigger>
                <TabsTrigger value="rewards" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Gift className="h-4 w-4" /> Rewards</TabsTrigger>
                <TabsTrigger value="splash-screen" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Monitor className="h-4 w-4" /> Splash Screen</TabsTrigger>
                <TabsTrigger value="boutique-hub" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><ShoppingBag className="h-4 w-4" /> Boutique Hub</TabsTrigger>
                <TabsTrigger value="loading-screen" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Loader className="h-4 w-4" /> Loading Screen Sync</TabsTrigger>
                <TabsTrigger value="game-loading" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Gamepad2 className="h-4 w-4" /> Game Loading Sync</TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 w-full min-w-0">
            <TabsContent value="game-oracle" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Wand2 className="h-6 w-6" /> Sovereign Game Oracle</CardTitle>
                     <CardDescription>Determine the future frequencies of the Tribe Arena. Force the next winning result for specific games.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Select Arena Dimension</Label>
                              <Select value={oracleGame} onValueChange={setOracleGame}>
                                 <SelectTrigger className="h-14 rounded-2xl border-2"><SelectValue /></SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="fruit-party">Fruit Party</SelectItem>
                                    <SelectItem value="wild-party">Wild Party (Forest)</SelectItem>
                                    <SelectItem value="roulette">Roulette</SelectItem>
                                    <SelectItem value="teen-patti">Teen Patti</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Force Next Outcome</Label>
                              <Select value={oracleResult} onValueChange={setOracleResult}>
                                 <SelectTrigger className="h-14 rounded-2xl border-2"><SelectValue placeholder="Select Outcome" /></SelectTrigger>
                                 <SelectContent>
                                    {getOracleOptions(oracleGame).map(opt => (
                                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <Button onClick={handleUpdateOracle} disabled={isUpdatingOracle || !oracleResult} className="w-full h-16 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase italic text-xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                              {isUpdatingOracle ? <Loader className="animate-spin mr-2" /> : <Zap className="mr-2 h-6 w-6" />} Synchronize Fate
                           </Button>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 mb-4">
                              <History className="h-5 w-5 text-emerald-600" />
                              <h4 className="font-black uppercase italic text-sm">Recent Arena Victories (Real Time)</h4>
                           </div>
                           <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-200">
                              {recentWins?.map((win: any) => (
                                <div key={win.id} className="p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors">
                                   <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 border border-white shadow-sm"><AvatarImage src={win.avatarUrl || undefined} /></Avatar>
                                      <div>
                                         <p className="text-[10px] font-black uppercase text-slate-900 truncate w-24">{win.username}</p>
                                         <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">{win.gameId}</p>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <div className="flex items-center gap-1 justify-end text-emerald-600 font-black italic text-sm">
                                         <GoldCoinIcon className="h-3 w-3" />+{win.amount.toLocaleString()}
                                      </div>
                                      <p className="text-[6px] font-bold text-slate-400 uppercase">{win.timestamp ? format(win.timestamp.toDate(), 'HH:mm:ss') : '...'}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="app-data" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0 flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><BarChart3 className="h-6 w-6" /> App Economic Ledger</CardTitle>
                        <CardDescription>Global coin circulation and economic sync metrics.</CardDescription>
                     </div>
                     <Button onClick={handleSyncAppData} disabled={isSyncingAppData} className="bg-emerald-600 h-12 rounded-xl text-white">
                        {isSyncingAppData ? <Loader className="animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Sync Ledger
                     </Button>
                  </CardHeader>
                  <CardContent className="px-0 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 flex flex-col gap-1"><p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total Coins in Tribe</p><div className="flex items-center gap-2 text-2xl font-black text-emerald-900 italic"><GoldCoinIcon className="h-6 w-6" />{appStats.totalCoins.toLocaleString()}</div></div>
                        <div className="p-6 bg-cyan-50 rounded-3xl border-2 border-cyan-100 flex flex-col gap-1"><p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Total Diamonds Accumulated</p><div className="flex items-center gap-2 text-2xl font-black text-cyan-900 italic"><Sparkles className="h-6 w-6" />{appStats.totalDiamonds.toLocaleString()}</div></div>
                        <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 flex flex-col gap-1"><p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total Economic Output (Spent)</p><div className="flex items-center gap-2 text-2xl font-black text-emerald-900 italic"><BarChart3 className="h-6 w-6" />{appStats.totalSpent.toLocaleString()}</div></div>
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex flex-col gap-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Synchronized Users</p><div className="flex items-center gap-2 text-2xl font-black text-slate-900 italic"><Users className="h-6 w-6" />{appStats.totalUsers.toLocaleString()}</div></div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="game-loading" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Gamepad2 className="h-6 w-6" /> Game Loading Sync</CardTitle>
                     <CardDescription>Upload custom backgrounds for specific game loading screens.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gamesList.map((game) => (
                          <Card key={game.slug} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col gap-4">
                             <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border-2 border-white shadow-md flex items-center justify-center">
                                {(game as any).loadingBackgroundUrl ? (
                                  <Image src={(game as any).loadingBackgroundUrl} fill className="object-cover" alt="Loading BG" unoptimized />
                                ) : (
                                  <div className="text-center opacity-20"><ImageIcon className="h-8 w-8 mx-auto mb-1" /><span className="text-[8px] font-black uppercase">Standard Sync</span></div>
                                )}
                                {isUploadingGameLoadingBG && selectedGameForSync?.slug === game.slug && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}
                                <button 
                                  onClick={() => { setSelectedGameForSync(game); gameLoadingBGFileInputRef.current?.click(); }}
                                  className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-lg text-emerald-600 active:scale-90 transition-transform"
                                >
                                   <Camera className="h-4 w-4" />
                                </button>
                             </div>
                             <p className="font-black text-center uppercase text-sm">{(game as any).title}</p>
                          </Card>
                        ))}
                     </div>
                  </CardContent>
               </Card>
               <input type="file" ref={gameLoadingBGFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleGameLoadingBGUpload(e.target.files[0])} />
            </TabsContent>

            <TabsContent value="loading-screen" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Loader className="h-6 w-6" /> App Loading Sync</CardTitle>
                     <CardDescription>Manage the background image shown during app initialization and dimension transitions.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-10">
                     <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <ImageIcon className="h-5 w-5 text-emerald-600" />
                              <span className="font-black uppercase italic text-sm text-slate-900">Global Loading Background</span>
                           </div>
                           {config?.appLoadingBackgroundUrl && (
                             <Button variant="ghost" size="sm" className="text-[8px] font-black uppercase text-red-500" onClick={() => updateDoc(configRef!, { appLoadingBackgroundUrl: null })}>Reset to Default</Button>
                           )}
                        </div>
                        
                        <div className="relative aspect-[9/16] max-w-[300px] mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center">
                           {config?.appLoadingBackgroundUrl ? (
                             <Image src={config.appLoadingBackgroundUrl} fill className="object-cover" alt="Loading BG" unoptimized />
                           ) : (
                             <div className="flex flex-col items-center justify-center gap-2 text-white/20">
                                <Loader className="h-10 w-10 animate-spin" />
                                <span className="uppercase font-black text-[10px] tracking-widest">Default Syncing</span>
                             </div>
                           )}
                           {isUploadingLoadingBG && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}
                           <button 
                             onClick={() => loadingBGFileInputRef.current?.click()}
                             className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-xl text-emerald-600 active:scale-90 transition-transform"
                           >
                              <Camera className="h-6 w-6" />
                           </button>
                        </div>
                        <input type="file" ref={loadingBGFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLoadingBGUpload(e.target.files[0])} />
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="boutique-hub" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><ShoppingBag className="h-6 w-6" /> Boutique Sync</CardTitle></CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-4">
                           <Input placeholder="Asset Name..." value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-14 rounded-2xl border-2" />
                           <div className="grid grid-cols-2 gap-2">
                              <Input type="number" placeholder="Price" value={storePrice} onChange={(e) => setStorePrice(e.target.value)} className="h-12 rounded-xl" />
                              <Input type="number" placeholder="Days" value={storeDuration} onChange={(e) => setStoreDuration(e.target.value)} className="h-12 rounded-xl" />
                           </div>
                           <Select value={storeCategory} onValueChange={(v: any) => setStoreCategory(v)}>
                              <SelectTrigger className="h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="Frame">Avatar Frame</SelectItem><SelectItem value="Bubble">Chat Bubble</SelectItem><SelectItem value="Theme">Room Theme</SelectItem><SelectItem value="Wave">Voice Wave</SelectItem></SelectContent>
                           </Select>
                        </div>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white p-6 group">
                           <button onClick={() => storeFileInputRef.current?.click()} className="flex flex-col items-center gap-3">
                              {isUploadingStore ? <Loader className="animate-spin text-emerald-600" /> : <Upload className="h-8 w-8 text-slate-400" />}
                              <span className="text-[10px] font-black uppercase">Upload Visual</span>
                           </button>
                           <input type="file" ref={storeFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleStoreItemUpload(e.target.files[0])} />
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="pin-control" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Pin className="h-6 w-6" /> Sovereign Frequency Pin</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4"><Input placeholder="Enter Room Number (e.g. 1000021)" value={roomPinSearchId} onChange={(e) => setRoomPinSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRoomPinSearch()} className="h-14 rounded-2xl border-2" /><Button onClick={handleRoomPinSearch} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase italic" disabled={isSearchingRoomPin}>Find Frequency</Button></div>
                  </div>
                  {targetRoomForPin && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center justify-between border-b pb-6"><div className="flex items-center gap-4"><Avatar className="h-16 w-16 border-2 border-white shadow-xl rounded-xl"><AvatarImage src={targetRoomForPin.coverUrl || undefined} /></Avatar><div><p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetRoomForPin.name || targetRoomForPin.title}</p><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room ID: {targetRoomForPin.roomNumber}</span></div></div><div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Pin Frequency</p>{targetRoomForPin.isPinned ? (<Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] py-1 px-3">PINNED ACTIVE</Badge>) : (<Badge className="bg-slate-200 text-slate-400 font-black uppercase text-[10px] py-1 px-3 shadow-none">NOT PINNED</Badge>)}</div></div>
                       <Button onClick={handleToggleRoomPin} disabled={isPinningRoom} className={cn("w-full h-16 rounded-[1.5rem] font-black uppercase italic text-xl shadow-xl transition-all", targetRoomForPin.isPinned ? "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100" : "bg-emerald-600 text-white hover:bg-emerald-700")}>{isPinningRoom ? <Loader className="animate-spin mr-2 h-6 w-6" /> : targetRoomForPin.isPinned ? <><PinOff className="mr-2 h-6 w-6" /> Unpin Frequency</> : <><Pin className="mr-2 h-6 w-6" /> Pin to Top</>}</Button>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="authority" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Zap className="h-6 w-6" /> Authority Hub</CardTitle></CardHeader>
                  <CardContent className="px-0 space-y-6">
                     <div className="flex flex-col gap-4">
                        <SearchToggle mode={tagSearchMode} setMode={setTagSearchMode} />
                        <div className="flex gap-4"><Input placeholder="Enter member signature..." className="h-14 rounded-2xl border-2" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()} /><Button onClick={handleSearchUsers} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white" disabled={isSearching}>{isSearching ? <Loader className="animate-spin" /> : 'Find'}</Button></div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {foundUsers.map((u) => (
                          <div key={u.id} className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex flex-col gap-4 shadow-sm">
                             <div className="flex items-center gap-4"><Avatar className="h-14 w-14 border-2 border-white shadow-sm"><AvatarImage src={u.avatarUrl || undefined} /></Avatar><div className="flex-1 min-w-0"><p className="font-black text-sm uppercase text-slate-900 truncate">{u.username}</p>{u.specialId ? <SpecialIdBadge id={u.specialId} /> : <p className="text-[10px] text-muted-foreground uppercase font-bold">ID: {u.accountNumber}</p>}</div></div>
                             <div className="grid grid-cols-2 gap-2">
                                {AUTHORITY_ROLES.map(role => (<Button key={role.id} variant={u.tags?.includes(role.id) ? 'default' : 'outline'} size="sm" onClick={() => toggleUserRole(u.id, role.id, u.tags)} className={cn("h-10 text-[8px] font-black uppercase rounded-xl", u.tags?.includes(role.id) ? "bg-emerald-600" : "")}>{role.label}</Button>))}
                             </div>
                          </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="member-directory" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0 flex flex-row items-center justify-between"><div><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Users className="h-6 w-6 text-emerald-600" /> Tribal Member Archive</CardTitle></div><Button onClick={handleSyncDirectory} disabled={isSyncingDirectory} className="bg-emerald-600 text-white h-12 rounded-xl">{isSyncingDirectory ? <Loader className="animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Sync Directory</Button></CardHeader>
                  <CardContent className="px-0"><div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-200">{tribalMembers.length === 0 ? (<div className="py-40 text-center opacity-20 italic">Awaiting Synchronized Directory...</div>) : tribalMembers.map(member => (
                    <div key={member.id} className="p-6 flex items-center justify-between hover:bg-emerald-50 transition-colors"><div className="flex items-center gap-4"><Avatar className="h-12 w-12 border-2 border-white shadow-sm"><AvatarImage src={member.avatarUrl || undefined} /></Avatar><div><p className="font-black text-sm uppercase text-slate-900">{member.username}</p><div className="flex items-center gap-2 mt-0.5">{member.specialId ? <SpecialIdBadge id={member.specialId} /> : <span className="text-[10px] font-bold text-slate-400">ID: {member.accountNumber}</span>}</div></div></div><div className="text-right"><div className="flex items-center gap-1.5 justify-end text-emerald-600 font-black italic"><GoldCoinIcon className="h-4 w-4" />{member.wallet?.coins.toLocaleString() || 0}</div></div></div>
                  ))}</div></CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="ranking-themes" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Trophy className="h-6 w-6" /> Ranking Themes</CardTitle></CardHeader>
                  <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-8">{[{ key: 'honor', label: 'Honor (Rich)', icon: Crown }, { key: 'charm', label: 'Charm', icon: Sparkles }, { key: 'room', label: 'Room Rankings', icon: Home }, { key: 'cp', label: 'Couple Challenge', icon: Heart }].map((item) => (<div key={item.key} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><item.icon className="h-5 w-5 text-emerald-600" /><span className="font-black uppercase italic text-sm">{item.label}</span></div>{rankingConfig?.[item.key] && (<Button variant="ghost" size="sm" className="text-[8px] font-black uppercase text-red-500" onClick={() => updateDoc(rankingConfigRef!, { [item.key]: null })}>Reset</Button>)}</div><div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-inner flex items-center justify-center">{rankingConfig?.[item.key] ? (<Image src={rankingConfig[item.key]} fill className="object-cover" alt="BG" unoptimized />) : (<div className="text-center opacity-20"><ImageIcon className="h-8 w-8 mx-auto mb-1" /><span className="text-[8px] font-black uppercase">Default Active</span></div>)}{uploadingRankingKey === item.key && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin" /></div>}<button onClick={() => { setUploadingRankingKey(item.key); rankingBGFileInputRef.current?.click(); }} className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-lg text-emerald-600 active:scale-90 transition-transform"><Camera className="h-4 w-4" /></button></div></div>))}</CardContent>
               </Card>
               <input type="file" ref={rankingBGFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadingRankingKey && handleRankingBGUpload(uploadingRankingKey, e.target.files[0])} />
            </TabsContent>

            <TabsContent value="user-records" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-rose-600"><UserSearch className="h-6 w-6" /> User Ledger</CardTitle></CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="flex flex-col gap-4"><SearchToggle mode={recordSearchMode} setMode={setRecordSearchMode} /><div className="flex gap-4"><Input placeholder={recordSearchMode === 'id' ? "Enter ID..." : "Enter Username..."} value={recordSearchId} onChange={(e) => setRecordSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(recordSearchMode, recordSearchId, setTargetUserForRecord, setIsSearchingRecord)} className="h-14 rounded-2xl border-2" /><Button onClick={() => handleGenericSearch(recordSearchMode, recordSearchId, setTargetUserForRecord, setIsSearchingRecord)} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase italic" disabled={isSearchingRecord}>Audit</Button></div></div>
                     {targetUserForRecord && (<div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8"><div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-between"><div className="flex items-center gap-4"><Avatar className="h-20 w-20 border-4 border-white shadow-xl"><AvatarImage src={targetUserForRecord.avatarUrl || undefined} /></Avatar><div><h3 className="text-2xl font-black uppercase italic text-slate-900">{targetUserForRecord.username}</h3><div className="flex flex-col gap-1 mt-1">{targetUserForRecord.specialId && <SpecialIdBadge id={targetUserForRecord.specialId} />}<span className="text-[10px] font-bold text-slate-400 uppercase">Account: {targetUserForRecord.accountNumber}</span></div></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 space-y-2"><div className="flex items-center gap-2 text-emerald-600 mb-2"><Wallet className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Wallet</span></div><div className="flex items-center gap-2 text-2xl font-black text-emerald-900 italic"><GoldCoinIcon className="h-6 w-6" />{targetUserForRecord.wallet?.coins.toLocaleString() || 0}</div></div><div className="p-6 bg-cyan-50 rounded-3xl border-2 border-cyan-100 space-y-2"><div className="flex items-center gap-2 text-cyan-600 mb-2"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Diamonds</span></div><div className="flex items-center gap-2 text-2xl font-black text-cyan-900 italic"><Activity className="h-6 w-6" />{targetUserForRecord.wallet?.diamonds.toLocaleString() || 0}</div></div></div><div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-red-100 flex flex-col items-center gap-6"><h4 className="text-xl font-black uppercase italic text-red-600">Wallet Purge</h4><Button onClick={handleResetWallet} disabled={isResettingWallet} variant="destructive" className="h-16 px-12 rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-red-500/20 active:scale-95 transition-all">{isResettingWallet ? <Loader className="animate-spin mr-2" /> : <Trash2 className="h-6 w-6 mr-2" />} Global Reset</Button></div></div>)}
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="assign-center" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><ShieldCheck className="h-6 w-6 text-emerald-600" /> Assign Center & Portal</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4"><SearchToggle mode={centerSearchMode} setMode={setCenterSearchMode} /><div className="flex gap-4"><Input placeholder={centerSearchMode === 'id' ? "Enter ID..." : "Enter Username..."} value={centerSearchId} onChange={(e) => setCenterSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(centerSearchMode, centerSearchId, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 rounded-2xl border-2" /><Button onClick={() => handleGenericSearch(centerSearchMode, centerSearchId, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase italic" disabled={isSearchingCenter}>Find</Button></div></div>
                  {targetUserForCenter && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center justify-between border-b pb-6"><div className="flex items-center gap-4"><Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForCenter.avatarUrl || undefined}/></Avatar><div><p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForCenter.username}</p>{targetUserForCenter.specialId ? <SpecialIdBadge id={targetUserForCenter.specialId} /> : <span className="text-[10px] font-bold text-slate-400 uppercase">Account: {targetUserForCenter.accountNumber}</span>}</div></div><div>{targetUserForCenter.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) ? (<Badge className="bg-green-500 text-white font-black uppercase text-[10px] py-1 px-3">Active</Badge>) : (<Badge className="bg-slate-200 text-slate-400 font-black uppercase text-[10px] py-1 px-3 shadow-none">Inactive</Badge>)}</div></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button onClick={handleToggleSellerCenter} className={cn("h-16 rounded-[1.5rem] font-black uppercase italic text-sm shadow-xl transition-all", targetUserForCenter.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) ? "bg-red-50 text-red-600 border-2 border-red-100" : "bg-emerald-600 text-white")}>{targetUserForCenter.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) ? <><UserX className="mr-2 h-5 w-5" /> Revoke Seller Center</> : <><ShieldCheck className="mr-2 h-5 w-5" /> Activate Seller Center</>}</Button>
                          <Button onClick={handleToggleAdminPortal} className={cn("h-16 rounded-[1.5rem] font-black uppercase italic text-sm shadow-xl transition-all", targetUserForCenter.tags?.includes('Official') ? "bg-red-50 text-red-600 border-2 border-red-100" : "bg-slate-900 text-white")}>{targetUserForCenter.tags?.includes('Official') ? <><ShieldAlert className="mr-2 h-5 w-5" /> Revoke Admin Portal</> : <><ShieldCheck className="mr-2 h-5 w-5" /> Activate Admin Portal</>}</Button>
                       </div>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="id-ban" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-red-600"><Gavel className="h-6 w-6" /> ID Ban Protocol</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4"><SearchToggle mode={banSearchMode} setMode={setBanSearchMode} /><div className="flex gap-4"><Input placeholder="Enter Target..." value={banSearchId} onChange={(e) => setBanSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(banSearchMode, banSearchId, setTargetUserForBan, setIsSearchingBan)} className="h-14 rounded-2xl border-2" /><Button onClick={() => handleGenericSearch(banSearchMode, banSearchId, setTargetUserForBan, setIsSearchingBan)} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase italic" disabled={isSearchingBan}>Locate</Button></div></div>
                  {targetUserForBan && (<div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20"><div className="flex items-center justify-between border-b pb-6"><div className="flex items-center gap-4"><Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForBan.avatarUrl || undefined}/></Avatar><div><p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForBan.username}</p></div></div><div>{targetUserForBan.banStatus?.isBanned ? (<Badge className="bg-red-600 text-white">BANNED</Badge>) : (<Badge className="bg-green-500 text-white">OK</Badge>)}</div></div>{!targetUserForBan.banStatus?.isBanned ? (
                    <div className="space-y-6">
                       <div className="grid grid-cols-4 gap-4">{[{ l: 'Days', v: banDays, s: setBanDays }, { l: 'Hrs', v: banHours, s: setBanHours }, { l: 'Min', v: banMinutes, s: setBanMinutes }, { l: 'Sec', v: banSeconds, s: setBanSeconds }].map(i => (<div key={i.l} className="space-y-1"><p className="text-[8px] font-black uppercase text-gray-400 text-center">{i.l}</p><Input value={i.v} onChange={(e) => i.s(e.target.value.replace(/\D/g, ''))} className="h-12 rounded-xl text-center" /></div>))}</div>
                       <Button onClick={handleBanUser} disabled={isBanning} className="w-full h-16 rounded-[1.5rem] bg-red-600 text-white font-black uppercase italic text-xl shadow-xl">Execute Ban</Button>
                    </div>
                  ) : (
                    <Button onClick={handleUnbanUser} disabled={isBanning} className="w-full h-16 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase italic text-xl shadow-xl">Unban & Restore</Button>
                  )}</div>)}
               </Card>
            </TabsContent>

            <TabsContent value="banners" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0 flex flex-row items-center justify-between"><div><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><ImageIcon className="h-6 w-6" /> Banners</CardTitle></div><Button onClick={handleAddBanner} className="bg-emerald-600 text-white h-12 rounded-xl">+ Add Slot</Button></CardHeader>
                  <CardContent className="px-0 space-y-8"><div className="grid grid-cols-1 gap-8">{(bannerConfig?.slides || DEFAULT_SLIDES).map((slide: any, idx: number) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex flex-col md:flex-row gap-8"><div className="w-72 h-40 relative rounded-2xl overflow-hidden bg-slate-200">{slide.imageUrl && (<Image src={slide.imageUrl} alt="Banner" fill className="object-cover" unoptimized />)}<button onClick={() => bannerFileInputRefs.current[idx]?.click()} className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-lg text-emerald-600"><Camera className="h-4 w-4" /></button><input type="file" ref={el => { bannerFileInputRefs.current[idx] = el; }} className="hidden" onChange={(e) => e.target.files?.[0] && handleBannerImageUpload(idx, e.target.files[0])} /></div><div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title</Label>
                        <Input value={slide.title} onChange={(e) => handleUpdateBannerMeta(idx, 'title', e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Subtitle</Label>
                        <Input value={slide.subtitle} onChange={(e) => handleUpdateBannerMeta(idx, 'subtitle', e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Link (URL)</Label>
                        <Input placeholder="https://..." value={slide.link || ''} onChange={(e) => handleUpdateBannerMeta(idx, 'link', e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <Button variant="destructive" onClick={() => handleRemoveBanner(idx)} className="w-full">Purge Slot</Button>
                    </div></div>
                  ))}</div></CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="games" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Gamepad2 className="h-6 w-6" /> Game Sync</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">{gamesList.map((game) => (
                    <Card key={game.slug} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col gap-4"><div className="relative aspect-square rounded-2xl overflow-hidden">{game.coverUrl && (<Image src={game.coverUrl} alt={game.title} fill className="object-cover" unoptimized />)}<button onClick={() => handleGameDPUploadClick(game)} className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera className="h-8 w-8 text-white" /></button></div><p className="font-black text-center uppercase text-sm">{game.title}</p><Button onClick={() => handleGameBGUploadClick(game)} size="sm" className="rounded-xl bg-emerald-600 text-white">Sync BG</Button></Card>
                  ))}</CardContent>
               </Card>
               <input type="file" ref={gameFileInputRef} className="hidden" accept="image/*" onChange={handleGameDPFileChange} />
               <input type="file" ref={gameBGFileInputRef} className="hidden" accept="image/*" onChange={handleGameBGFileChange} />
            </TabsContent>

            <TabsContent value="broadcaster" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Megaphone className="h-6 w-6 text-emerald-600" /> Broadcaster</CardTitle></CardHeader>
                  <CardContent className="px-0 space-y-6"><div className="space-y-4"><Input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} className="h-14 rounded-2xl" /><Textarea placeholder="Type broadcast..." value={broadcastContent} onChange={(e) => setBroadcastContent(e.target.value)} className="h-40 rounded-3xl" /></div><Button onClick={handleSystemBroadcast} disabled={isBroadcasting || !broadcastContent.trim()} className="w-full h-16 rounded-[1.5rem] bg-emerald-600 text-white">Synchronize Broadcast</Button></CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="direct-messenger" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><MessageSquareText className="h-6 w-6" /> Direct Messenger</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4"><SearchToggle mode={dmSearchMode} setMode={setDmSearchMode} /><div className="flex gap-4"><Input placeholder="Recipient..." value={dmSearchId} onChange={(e) => setDmSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(dmSearchMode, dmSearchId, setTargetUserForDm, setIsSearchingDm)} className="h-14 rounded-2xl" /><Button onClick={() => handleGenericSearch(dmSearchMode, dmSearchId, setTargetUserForDm, setIsSearchingDm)} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white" disabled={isSearchingDm}>Find</Button></div></div>
                  {targetUserForDm && (<div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8"><div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={targetUserForDm.avatarUrl || undefined}/></Avatar><p className="font-black uppercase text-xl">{targetUserForDm.username}</p></div><div className="space-y-4"><Input value={dmTitle} onChange={(e) => setDmTitle(e.target.value)} className="h-14 rounded-2xl" /><Textarea placeholder="Private msg..." value={dmContent} onChange={(e) => setDmContent(e.target.value)} className="h-40 rounded-3xl" /></div><Button onClick={handleDirectMessage} disabled={isSendingDm || !dmContent.trim()} className="w-full h-16 rounded-[1.5rem] bg-emerald-600 text-white">Send Sync</Button></div>)}
               </Card>
            </TabsContent>

            <TabsContent value="tags" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><BadgeCheck className="h-6 w-6" /> Assign Tags</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4"><SearchToggle mode={tagSearchMode} setMode={setTagSearchMode} /><div className="flex gap-4"><Input placeholder="Target..." value={tagSearchId} onChange={(e) => setTagSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(tagSearchMode, tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 rounded-2xl" /><Button onClick={() => handleGenericSearch(tagSearchMode, tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white" disabled={isSearchingTag}>Locate</Button></div></div>
                  {targetUserForTags && (<div className="mt-10 p-6 border-2 rounded-[2rem] flex flex-col gap-8"><div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={targetUserForTags.avatarUrl || undefined}/></Avatar><p className="font-black text-xl">{targetUserForTags.username}</p></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{ELITE_TAGS.map(tag => (<Button key={tag.id} variant={targetUserForTags.tags?.includes(tag.id) ? 'default' : 'outline'} className={cn("h-12 rounded-xl", targetUserForTags.tags?.includes(tag.id) ? "bg-emerald-600" : "")} onClick={() => toggleUserRole(targetUserForTags.id, tag.id, targetUserForTags.tags)}>{tag.label}</Button>))}</div><Button variant="ghost" onClick={() => handleRemoveAllTags(targetUserForTags.id)} className="text-red-500 text-[10px]">Purge All Tags</Button></div>)}
               </Card>
            </TabsContent>

            <TabsContent value="special-id" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Type className="h-6 w-6" /> Special ID</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4"><SearchToggle mode={specialIdSearchMode} setMode={setSpecialIdSearchMode} /><div className="flex gap-4"><Input placeholder="Enter Identity..." value={idSearchInput} onChange={(e) => setIdSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(specialIdSearchMode, idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 rounded-2xl" /><Button onClick={() => handleGenericSearch(specialIdSearchMode, idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white">Find</Button></div></div>
                  {targetUserForId && (<div className="mt-10 p-6 border-2 rounded-[2rem] space-y-8"><div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={targetUserForId.avatarUrl || undefined}/></Avatar><p className="font-black text-xl">{targetUserForId.username}</p></div><div className="space-y-6"><div className="flex gap-2"><Input placeholder="New ID..." value={newIdInput} onChange={(e) => setNewIdInput(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl" /><Button onClick={handleUpdateId} disabled={!newIdInput || isSavingId} className="h-14 px-10 bg-emerald-600 text-white">Sync</Button><Button onClick={() => handleRemoveId()} variant="outline" className="h-14 border-red-500 text-red-500"><Trash2 /></Button></div></div></div>)}
               </Card>
            </TabsContent>

            <TabsContent value="rewards" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Gift className="h-6 w-6" /> Rewards</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4"><SearchToggle mode={rewardSearchMode} setMode={setRewardSearchMode} /><div className="flex gap-4"><Input placeholder="Recipient..." value={rewardSearchId} onChange={(e) => setRewardSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch(rewardSearchMode, rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 rounded-2xl" /><Button onClick={() => handleGenericSearch(rewardSearchMode, rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white">Find</Button></div></div>
                  {targetUserForRewards && (<div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-10"><div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={targetUserForRewards.avatarUrl || undefined}/></Avatar><p className="font-black text-xl">{targetUserForRewards.username}</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-10"><div className="space-y-4"><h4>Coin Dispatch</h4><div className="flex gap-2"><Input value={coinDispatchAmount} onChange={(e) => setCoinDispatchAmount(e.target.value.replace(/\D/g, ''))} className="h-14" /><Button onClick={handleDispatchCoins} className="h-14 bg-emerald-600 text-white"><Send /></Button></div></div><div className="space-y-4"><h4>Elite Assets</h4><div className="flex flex-wrap gap-2">{DISPATCH_ASSETS.frames.map(frame => (<Button key={frame.id} variant="outline" size="sm" onClick={() => handleDispatchItem(frame.id, 'ownedItems')} className="text-[8px] font-black uppercase rounded-xl border-emerald-600 text-emerald-600">{frame.name}</Button>))}</div></div></div></div>)}
               </Card>
            </TabsContent>

            <TabsContent value="splash-screen" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-emerald-600"><Monitor className="h-6 w-6" /> Splash Screen & Global Logo</CardTitle>
                     <CardDescription>Manage the app's first visual frequency and global brand signature.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-10">
                     <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Star className="h-5 w-5 text-emerald-600" />
                              <span className="font-black uppercase italic text-sm text-slate-900">Global Brand Signature (Logo)</span>
                           </div>
                           {config?.customLogoUrl && (
                             <Button variant="ghost" size="sm" className="text-[8px] font-black uppercase text-red-500" onClick={() => updateDoc(configRef!, { customLogoUrl: null })}>Reset to Default</Button>
                           )}
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-8">
                           <div className="relative h-32 w-32 rounded-3xl bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                              <Image 
                                 src={config?.customLogoUrl || "https://storage.googleapis.com/fetch-and-generate-images/ummy-logo-v3.png"} 
                                 alt="Current Logo" 
                                 fill 
                                 className="object-contain p-2" 
                                 unoptimized 
                              />
                              {isUploadingLogo && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}
                           </div>
                           
                           <div className="flex-1 space-y-4 text-center md:text-left">
                              <p className="text-xs font-body italic text-slate-500">
                                 Upload a high-fidelity PNG or JPG to synchronize the brand identity across all application dimensions in real-time.
                              </p>
                              <Button 
                                 onClick={() => logoFileInputRef.current?.click()} 
                                 disabled={isUploadingLogo}
                                 className="h-12 rounded-xl bg-emerald-600 text-white font-black uppercase italic shadow-lg shadow-emerald-500/20"
                              >
                                 {isUploadingLogo ? <Loader className="animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                 Upload Global Logo
                              </Button>
                              <input type="file" ref={logoFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                           </div>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                        <div className="flex items-center gap-2">
                           <ImageIcon className="h-5 w-5 text-emerald-600" />
                           <span className="font-black uppercase italic text-sm text-slate-900">Splash Background Sync</span>
                        </div>
                        <div className="relative aspect-[9/16] max-w-[300px] mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center">
                           {config?.splashScreenUrl ? (<Image src={config.splashScreenUrl} fill className="object-cover" alt="Splash" unoptimized />) : (<div className="text-white/20">Stars Active</div>)}{isUploadingSplashBG && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin" /></div>}<button onClick={() => splashBGFileInputRef.current?.click()} className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-xl text-emerald-600"><Camera className="h-6 w-6" /></button></div>
                        <input type="file" ref={splashBGFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSplashBGUpload(e.target.files[0])} />
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
