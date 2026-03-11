'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking, useStorage, deleteDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch, arrayUnion, arrayRemove, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Shield, Loader, Gift, UserCheck, Star, Zap, Heart, MessageSquare, BadgeCheck, Upload, Type, Image as ImageIcon, Gamepad2, Camera, Trash2, ShieldCheck, Store, Check, Mic2, Send, Megaphone, MessageSquareText, Palette, UserX, Gavel, History, Clock, Dices, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useGameLogoUpload } from '@/hooks/use-game-logo-upload';
import { OfficialTag } from '@/components/official-tag';
import { GoldCoinIcon } from '@/components/icons';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';

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
  { id: 'Customer Service', label: 'Customer Service', color: 'bg-blue-500', icon: MessageSquare },
  { id: 'Seller', label: 'Seller', color: 'bg-purple-500', icon: Heart },
  { id: 'Official center', label: 'Official center', color: 'bg-indigo-500', icon: ShieldCheck },
  { id: 'Seller center', label: 'Seller center', color: 'bg-orange-500', icon: Store },
];

const DISPATCH_ASSETS = {
  frames: [
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

const SpecialIdBadge = ({ id, color = 'red' }: { id: string, color?: string | null }) => {
  const theme = color === 'blue' 
    ? "from-blue-300 via-blue-500 to-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
    : "from-rose-300 via-rose-500 to-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]";

  return (
    <div className={cn(
      "relative overflow-hidden px-3 py-0.5 rounded-full border border-white/30 group animate-in fade-in duration-500 w-fit bg-gradient-to-r",
      theme
    )}>
      <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
      <span className="relative z-10 text-[10px] font-black text-white uppercase italic tracking-widest drop-shadow-sm">ID: {id}</span>
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
  
  const isCreator = user?.uid === CREATOR_ID;

  const [activeTab, setActiveTab] = useState('authority');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  
  const [centerSearchId, setCenterSearchId] = useState('');
  const [centerSearchName, setCenterSearchName] = useState('');
  const [targetUserForCenter, setTargetUserForCenter] = useState<any>(null);
  const [isSearchingCenter, setIsSearchingCenter] = useState(false);

  const [tagSearchId, setTagSearchId] = useState('');
  const [tagSearchName, setTagSearchName] = useState('');
  const [targetUserForTags, setTargetUserForTags] = useState<any>(null);
  
  const [idSearchInput, setIdSearchInput] = useState('');
  const [nameSearchInput, setNameSearchInput] = useState('');
  const [newIdInput, setNewIdInput] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>('red');
  const [targetUserForId, setTargetUserForId] = useState<any>(null);
  
  const [rewardSearchId, setRewardSearchId] = useState('');
  const [rewardSearchName, setRewardSearchName] = useState('');
  const [targetUserForRewards, setTargetUserForRewards] = useState<any>(null);
  const [coinDispatchAmount, setCoinDispatchAmount] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState('Official Notice');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [dmSearchId, setDmSearchId] = useState('');
  const [dmSearchName, setDmSearchName] = useState('');
  const [targetUserForDm, setTargetUserForDm] = useState<any>(null);
  const [dmTitle, setDmTitle] = useState('Official System Notice');
  const [dmContent, setDmContent] = useState('');
  const [isSendingDm, setIsSendingDm] = useState(false);

  const [banSearchId, setBanSearchId] = useState('');
  const [banSearchName, setBanSearchName] = useState('');
  const [targetUserForBan, setTargetUserForBan] = useState<any>(null);
  const [isSearchingBan, setIsSearchingBan] = useState(false);
  
  const [banDays, setBanDays] = useState('1');
  const [banHours, setBanHours] = useState('0');
  const [banMinutes, setBanMinutes] = useState('0');
  const [banSeconds, setBanSeconds] = useState('0');
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [isBanning, setIsBanning] = useState(false);

  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeCategory, setNewThemeCategory] = useState<'general' | 'entertainment' | 'help'>('general');
  const [isUploadingTheme, setIsUploadingTheme] = useState(false);
  const themeFileInputRef = useRef<HTMLInputElement>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingTag, setIsSearchingTag] = useState(false);
  const [isSearchingRewards, setIsSearchingRewards] = useState(false);
  const [isSearchingDm, setIsSearchingDm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingId, setIsSavingId] = useState(false);
  
  const [isUploadingBanner, setIsUploadingBanner] = useState<number | null>(null);
  const bannerFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const gameFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameForDP, setSelectedGameForDP] = useState<any>(null);

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

  const handleSystemBroadcast = async () => {
    if (!firestore || !broadcastContent.trim() || !isCreator) return;
    setIsBroadcasting(true);
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const totalUsers = usersSnap.docs.length;
      
      if (totalUsers === 0) {
        toast({ title: 'No users detected.' });
        return;
      }

      const batches = [];
      let currentBatch = writeBatch(firestore);
      let count = 0;

      for (const userDoc of usersSnap.docs) {
        const notifRef = doc(collection(firestore, 'users', userDoc.id, 'notifications'));
        currentBatch.set(notifRef, {
          title: broadcastTitle,
          content: broadcastContent,
          type: 'system',
          timestamp: serverTimestamp(),
          isRead: false
        });
        
        count++;
        if (count === 499) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(firestore);
          count = 0;
        }
      }
      
      if (count > 0) batches.push(currentBatch.commit());

      await Promise.all(batches);
      toast({ title: 'Broadcast Synchronized' });
      setBroadcastContent('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Broadcast Failed' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDirectMessage = async (overrideTarget?: any) => {
    const target = overrideTarget || targetUserForDm;
    if (!firestore || !target || !dmContent.trim() || !isCreator) return;
    setIsSendingDm(true);
    try {
      const notifRef = collection(firestore, 'users', target.id, 'notifications');
      await addDoc(notifRef, {
        title: dmTitle,
        content: dmContent,
        type: 'direct_system',
        timestamp: serverTimestamp(),
        isRead: false
      });
      toast({ title: 'Message Dispatched' });
      setDmContent('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Dispatch Failed' });
    } finally {
      setIsSendingDm(false);
    }
  };

  const handleDistributeDailyRewards = async () => {
    if (!firestore || !isCreator) return;
    setIsSaving(true);
    
    try {
      const batch = writeBatch(firestore);
      const rewardConfig = [100000, 80000, 50000, 35000, 20000, 20000, 20000, 20000, 20000, 20000];
      
      const processRankings = async (colPath: string, field: string, type: 'User' | 'Room') => {
        const q = query(collection(firestore, colPath), where(field, '>', 0), orderBy(field, 'desc'), limit(10));
        const snap = await getDocs(q);

        snap.docs.forEach((d, i) => {
          const reward = rewardConfig[i] || 0;
          const targetUid = type === 'User' ? d.id : d.data().ownerId;
          if (!targetUid) return;

          const uRef = doc(firestore, 'users', targetUid);
          const pRef = doc(firestore, 'users', targetUid, 'profile', targetUid);
          const notifRef = doc(collection(firestore, 'users', targetUid, 'notifications'));

          batch.update(uRef, { 'wallet.coins': increment(reward) });
          batch.update(pRef, { 'wallet.coins': increment(reward) });
          batch.set(notifRef, {
            title: `Official Notice`,
            content: `Notice.. You receive ${reward.toLocaleString()} coins..... Best regard Ummy official`,
            type: 'system',
            timestamp: serverTimestamp(),
            isRead: false
          });
        });
      };

      await processRankings('users', 'wallet.dailySpent', 'User');
      await processRankings('users', 'stats.dailyFans', 'User');
      await processRankings('users', 'stats.dailyGameWins', 'User');
      await processRankings('chatRooms', 'stats.dailyGifts', 'Room');

      batch.set(configRef!, { lastRewardReset: serverTimestamp() }, { merge: true });
      await batch.commit();
      toast({ title: 'Daily Distribution Complete' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset Failed' });
    } finally {
      setIsSaving(false);
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
      let q;
      if (mode === 'id') {
        const paddedId = value.padStart(3, '0');
        q = query(collection(firestore, 'users'), where('specialId', '==', paddedId), limit(1));
      } else {
        q = query(collection(firestore, 'users'), where('username', '==', value), limit(1));
      }
      
      const snap = await getDocs(q);
      if (!snap.empty) setter({ ...snap.docs[0].data(), id: snap.docs[0].id });
      else toast({ variant: 'destructive', title: 'Identity Not Found' });
    } finally {
      loadingSetter(false);
    }
  };

  const handleDispatchCoins = async () => {
    if (!firestore || !targetUserForRewards || !coinDispatchAmount) return;
    const amt = parseInt(coinDispatchAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsDispatching(true);
    try {
      const uRef = doc(firestore, 'users', targetUserForRewards.id);
      const pRef = doc(firestore, 'users', targetUserForRewards.id, 'profile', targetUserForRewards.id);
      
      const updateData = { 'wallet.coins': increment(amt), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(uRef, updateData);
      updateDocumentNonBlocking(pRef, updateData);
      
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
      const updateData = { [`inventory.${type}`]: arrayUnion(itemId), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(pRef, updateData);
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
      const updateData = { specialIdColor: null, updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(uRef, updateData);
      updateDocumentNonBlocking(pRef, updateData);
      setTargetUserForId((prev: any) => ({ ...prev, specialIdColor: null }));
      toast({ title: 'ID Color Removed' });
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
      
      const banData = {
        banStatus: {
          isBanned: true,
          bannedAt: serverTimestamp(),
          bannedUntil: bannedUntil,
          reason: 'Administrative Exclusion'
        }
      };

      await setDoc(uRef, banData, { merge: true });
      await setDoc(pRef, banData, { merge: true });
      
      setTargetUserForBan((prev: any) => ({ ...prev, banStatus: banData.banStatus }));
      toast({ title: 'ID Banned', description: 'Member restricted from tribal frequencies.' });
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
      
      const unbanData = {
        banStatus: {
          isBanned: false,
          bannedAt: null,
          bannedUntil: null,
          reason: null
        }
      };

      await setDoc(uRef, unbanData, { merge: true });
      await setDoc(pRef, unbanData, { merge: true });
      
      setTargetUserForBan((prev: any) => ({ ...prev, banStatus: unbanData.banStatus }));
      toast({ title: 'ID Unbanned', description: 'Member frequency restored.' });
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
    if (isCurrentlyActive) {
      newTags = tags.filter(t => !sellerTags.includes(t));
    } else {
      newTags = [...tags, 'Seller'];
    }

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

  const handleThemeUpload = async (file: File) => {
    if (!storage || !firestore || !newThemeName.trim()) return;
    setIsUploadingTheme(true);
    try {
      const timestamp = Date.now();
      const sRef = ref(storage, `roomThemes/theme_${timestamp}.jpg`);
      const result = await uploadBytes(sRef, file);
      const url = await getDownloadURL(result.ref);

      const themeRef = doc(collection(firestore, 'roomThemes'));
      await setDoc(themeRef, {
        id: themeRef.id,
        name: newThemeName,
        url: url,
        category: newThemeCategory,
        createdAt: serverTimestamp(),
        accentColor: '#FFCC00',
        seatColor: 'rgba(255, 255, 255, 0.1)'
      });

      toast({ title: 'Theme Synchronized' });
      setNewThemeName('');
    } finally {
      setIsUploadingTheme(false);
    }
  };

  const handleGameDPUploadClick = (game: any) => {
    setSelectedGameForDP(game);
    gameFileInputRef.current?.click();
  };

  const handleGameDPFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGameForDP) {
      await uploadGameLogo(selectedGameForDP, file);
      setSelectedGameForDP(null);
    }
  };

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
          <div className="w-full md:w-72 shrink-0 sticky top-24">
            <TabsList className="flex flex-col h-fit w-full bg-slate-50 shadow-2xl rounded-[2.5rem] border border-slate-100 p-3 gap-2 overflow-visible">
              <TabsTrigger value="authority" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Zap className="h-4 w-4 text-orange-500" /> Authority Hub
              </TabsTrigger>
              <TabsTrigger value="assign-center" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <ShieldCheck className="h-4 w-4 text-indigo-500" /> Assign Center
              </TabsTrigger>
              <TabsTrigger value="id-ban" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Gavel className="h-4 w-4 text-red-600" /> ID Ban Control
              </TabsTrigger>
              <TabsTrigger value="game-results" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Dices className="h-4 w-4 text-pink-500" /> Game Results
              </TabsTrigger>
              <TabsTrigger value="themes" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Palette className="h-4 w-4 text-rose-500" /> Theme Hub
              </TabsTrigger>
              <TabsTrigger value="banners" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <ImageIcon className="h-4 w-4 text-blue-500" /> Banners
              </TabsTrigger>
              <TabsTrigger value="games" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Gamepad2 className="h-4 w-4 text-purple-500" /> Game Sync
              </TabsTrigger>
              <TabsTrigger value="broadcaster" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Megaphone className="h-4 w-4 text-cyan-500" /> Broadcaster
              </TabsTrigger>
              <TabsTrigger value="direct-messenger" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <MessageSquareText className="h-4 w-4 text-indigo-500" /> Direct Messenger
              </TabsTrigger>
              <TabsTrigger value="tags" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <BadgeCheck className="h-4 w-4 text-green-500" /> Assign Tags
              </TabsTrigger>
              <TabsTrigger value="special-id" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Type className="h-4 w-4 text-red-500" /> Special I'd
              </TabsTrigger>
              <TabsTrigger value="rewards" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Gift className="h-4 w-4 text-pink-500" /> Rewards
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 w-full min-w-0">
            <TabsContent value="authority" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-primary"><Zap className="h-6 w-6" /> Tribal Authority Protocol</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                     <div className="flex gap-4">
                        <Input placeholder="Search member..." className="h-12 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()} />
                        <Button onClick={handleSearchUsers} className="h-12 rounded-xl bg-primary text-white" disabled={isSearching}>{isSearching ? <Loader className="animate-spin" /> : 'Search'}</Button>
                     </div>
                     <div className="space-y-4">
                        {foundUsers.map((u) => (
                          <div key={u.id} className="p-4 bg-white rounded-2xl border flex flex-col gap-4 shadow-sm">
                             <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-slate-50"><AvatarImage src={u.avatarUrl || undefined} /><AvatarFallback>U</AvatarFallback></Avatar>
                                <div className="flex-1">
                                   <p className="font-black text-sm uppercase italic text-slate-900">{u.username}</p>
                                   {u.specialId ? <SpecialIdBadge id={u.specialId} color={u.specialIdColor} /> : <p className="text-[10px] text-muted-foreground">ID: {u.id.slice(0, 6)}</p>}
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

            <TabsContent value="assign-center" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900">
                        <ShieldCheck className="h-6 w-6 text-indigo-500" /> Assign Center Portal
                     </CardTitle>
                     <CardDescription>Authorize or revoke Seller Center access for tribe members. Updates are instantaneous.</CardDescription>
                  </CardHeader>
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Input placeholder="Enter User ID..." value={centerSearchId} onChange={(e) => setCenterSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', centerSearchId, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch('id', centerSearchId, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingCenter}>Find ID</Button>
                     </div>
                     <div className="flex gap-4">
                        <Input placeholder="Enter Username..." value={centerSearchName} onChange={(e) => setCenterSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('name', centerSearchName, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch('name', centerSearchName, setTargetUserForCenter, setIsSearchingCenter)} className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-900 border-2 font-black uppercase italic" disabled={isSearchingCenter}>Find Name</Button>
                     </div>
                  </div>
                  {targetUserForCenter && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center justify-between border-b pb-6">
                          <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForCenter.avatarUrl || undefined}/></Avatar>
                             <div>
                                <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForCenter.username}</p>
                                {targetUserForCenter.specialId && <SpecialIdBadge id={targetUserForCenter.specialId} color={targetUserForCenter.specialIdColor} />}
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
                     <div className="flex gap-4">
                        <Input placeholder="Enter Target ID..." value={banSearchId} onChange={(e) => setBanSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', banSearchId, setTargetUserForBan, setIsSearchingBan)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch('id', banSearchId, setTargetUserForBan, setIsSearchingBan)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingBan}>Locate ID</Button>
                     </div>
                     <div className="flex gap-4">
                        <Input placeholder="Enter Username..." value={banSearchName} onChange={(e) => setBanSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('name', banSearchName, setTargetUserForBan, setIsSearchingBan)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch('name', banSearchName, setTargetUserForBan, setIsSearchingBan)} className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-900 border-2 font-black uppercase italic" disabled={isSearchingBan}>Locate Name</Button>
                     </div>
                  </div>

                  {targetUserForBan && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center justify-between border-b pb-6">
                          <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForBan.avatarUrl || undefined}/></Avatar>
                             <div>
                                <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForBan.username}</p>
                                {targetUserForBan.specialId && <SpecialIdBadge id={targetUserForBan.specialId} color={targetUserForBan.specialIdColor} />}
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

            <TabsContent value="game-results" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-pink-500">
                        <Dices className="h-6 w-6" /> Oracle Sync (Game Results)
                     </CardTitle>
                     <CardDescription>Monitor upcoming tribal game frequencies and predicted outcomes.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                           <h4 className="font-black uppercase italic text-sm text-slate-900">Roulette Sync</h4>
                           <Badge className="bg-green-500 text-white font-black text-[8px] uppercase px-2 py-0.5">Live Sync</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center text-2xl font-black italic text-white shadow-xl animate-shimmer-gold">32</div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Next Frequency</p>
                              <p className="text-lg font-black text-slate-900 uppercase italic">Red / Even Outcome</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                           <h4 className="font-black uppercase italic text-sm text-slate-900">Lion Fight Sync</h4>
                           <Badge className="bg-green-500 text-white font-black text-[8px] uppercase px-2 py-0.5">Live Sync</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center text-3xl shadow-xl animate-reaction-bounce">🐯</div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Next Frequency</p>
                              <p className="text-lg font-black text-slate-900 uppercase italic">Tiger Victory</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                           <h4 className="font-black uppercase italic text-sm text-slate-900">Teen Patti Sync</h4>
                           <Badge className="bg-green-500 text-white font-black text-[8px] uppercase px-2 py-0.5">Live Sync</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl animate-reaction-pulse">🐺</div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Next Frequency</p>
                              <p className="text-lg font-black text-slate-900 uppercase italic">Wolf / Sequence</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                           <h4 className="font-black uppercase italic text-sm text-slate-900">Wild Party Sync</h4>
                           <Badge className="bg-green-500 text-white font-black text-[8px] uppercase px-2 py-0.5">Live Sync</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="h-16 w-16 bg-yellow-500 rounded-2xl flex items-center justify-center text-3xl shadow-xl animate-reaction-float">🦁</div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Next Frequency</p>
                              <p className="text-lg font-black text-slate-900 uppercase italic">Lion x45 Multiplier</p>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="themes" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-rose-500"><Palette className="h-6 w-6" /> Theme Hub</CardTitle></CardHeader>
                  <CardContent className="px-0 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-4">
                           <Input placeholder="Theme Name..." value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} className="h-14 rounded-2xl border-2 bg-white text-lg font-black italic shadow-sm" />
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
                             <div className="p-3 text-center border-t"><p className="text-[10px] font-black uppercase truncate">{theme.name}</p><Badge className="mt-1 text-[6px] h-3 px-1 font-black uppercase bg-slate-100 text-slate-500 border-none">{theme.category}</Badge></div>
                          </Card>
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
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><MessageSquareText className="h-6 w-6 text-indigo-500" /> Direct Messenger</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Input placeholder="Enter Recipient I'd..." value={dmSearchId} onChange={(e) => setDmSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', dmSearchId, setTargetUserForDm, setIsSearchingDm)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch('id', dmSearchId, setTargetUserForDm, setIsSearchingDm)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingDm}>Find ID</Button>
                     </div>
                  </div>
                  {targetUserForDm && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center gap-4 border-b pb-6">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForDm.avatarUrl || undefined}/></Avatar>
                          <div><p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForDm.username}</p>{targetUserForDm.specialId && <SpecialIdBadge id={targetUserForDm.specialId} color={targetUserForDm.specialIdColor} />}</div>
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

            <TabsContent value="banners" className="m-0 space-y-6">
               <div className="grid grid-cols-1 gap-6">
                 {(bannerConfig?.slides || DEFAULT_SLIDES).map((slide: any, idx: number) => (
                   <Card key={idx} className="rounded-2xl overflow-hidden border-none shadow-lg bg-white">
                      <div className="relative aspect-[8/2] bg-muted">{slide.imageUrl && <Image src={slide.imageUrl} alt="Banner" fill className="object-cover" unoptimized />}{isUploadingBanner === idx && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}</div>
                      <CardContent className="p-4 flex justify-between items-center"><p className="font-black uppercase italic text-xs text-slate-900">{slide.title}</p><input type="file" ref={el => { bannerFileInputRefs.current[idx] = el; }} className="hidden" onChange={(e) => e.target.files?.[0] && handleBannerImageUpload(idx, e.target.files[0])} /><Button onClick={() => bannerFileInputRefs.current[idx]?.click()} size="sm" className="rounded-full h-8 text-[10px]">Update Visual</Button></CardContent>
                   </Card>
                 ))}
               </div>
            </TabsContent>

            <TabsContent value="games" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-primary"><Gamepad2 className="h-6 w-6" /> Game Identity Sync</CardTitle><CardDescription>Synchronize visuals for the 3D Tribe Arena.</CardDescription></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {gamesList.map((game) => (
                       <Card key={game.slug} className="rounded-3xl overflow-hidden border-2 shadow-sm bg-white">
                          <div className="relative aspect-square flex items-center justify-center bg-slate-50">{game.coverUrl ? <Image src={game.coverUrl} alt={game.title} fill unoptimized className="object-cover" /> : <Gamepad2 className="h-12 w-12 text-slate-200" />}{isUploadingGameDP && selectedGameForDP?.slug === game.slug && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="h-8 w-8 animate-spin text-white" /></div>}</div>
                          <CardHeader className="p-4 text-center"><CardTitle className="text-sm font-black uppercase italic text-slate-900">{game.title}</CardTitle><Button onClick={() => handleGameDPUploadClick(game)} className="w-full mt-2 h-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] italic shadow-lg" disabled={isUploadingGameDP}><Camera className="h-3 w-3 mr-2" /> Sync DP</Button></CardHeader>
                       </Card>
                     ))}
                  </CardContent>
               </Card>
               <input type="file" ref={gameFileInputRef} className="hidden" accept="image/*" onChange={handleGameDPFileChange} />
            </TabsContent>

            <TabsContent value="tags" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><BadgeCheck className="h-6 w-6 text-primary" /> Assign Official Tags</CardTitle></CardHeader>
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Input placeholder="Enter User ID..." value={tagSearchId} onChange={(e) => setTagSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 rounded-2xl border-2" />
                        <Button onClick={() => handleGenericSearch('id', tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingTag}>Find ID</Button>
                     </div>
                  </div>
                  {targetUserForTags && (
                    <div className="mt-10 p-6 border-2 rounded-[2rem] flex flex-col gap-8 animate-in slide-in-from-bottom-4 bg-slate-50/30">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4"><Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForTags.avatarUrl || undefined}/></Avatar><div><p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForTags.username}</p>{targetUserForTags.specialId ? <SpecialIdBadge id={targetUserForTags.specialId} color={targetUserForTags.specialIdColor} /> : <p className="text-[10px] font-bold text-muted-foreground uppercase">ID:{targetUserForTags.id.slice(0, 6)}</p>}</div></div>
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
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Type className="h-6 w-6 text-primary" /> Manage Special I'd</CardTitle></CardHeader>
                  <div className="flex gap-4">
                     <Input placeholder="Enter Current I'd..." value={idSearchInput} onChange={(e) => setIdSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 rounded-2xl border-2" />
                     <Button onClick={() => handleGenericSearch('id', idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic">Find ID</Button>
                  </div>
                  {targetUserForId && (
                    <div className="mt-10 p-6 border-2 rounded-[2rem] space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/30">
                       <div className="flex items-center gap-4"><Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForId.avatarUrl || undefined}/></Avatar><div><p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForId.username}</p><div className="mt-1">{targetUserForId.specialId ? <div className="flex items-center gap-2"><span className="text-[10px] uppercase text-gray-400">Current:</span><SpecialIdBadge id={targetUserForId.specialId} color={targetUserForId.specialIdColor} /></div> : <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Signature: None</p>}</div></div></div>
                       <div className="space-y-6">
                          <div className="flex gap-4 ml-2"><button onClick={() => setSelectedColor('red')} className={cn("h-10 w-10 rounded-full bg-rose-500 border-4 transition-all flex items-center justify-center", selectedColor === 'red' ? "border-slate-900 scale-110" : "border-transparent opacity-60")}>{selectedColor === 'red' && <Check className="h-4 w-4 text-white" />}</button><button onClick={() => setSelectedColor('blue')} className={cn("h-10 w-10 rounded-full bg-blue-500 border-4 transition-all flex items-center justify-center", selectedColor === 'blue' ? "border-slate-900 scale-110" : "border-transparent opacity-60")}>{selectedColor === 'blue' && <Check className="h-4 w-4 text-white" />}</button></div>
                          <div className="flex gap-2"><Input placeholder="Enter New Numeric I'd" value={newIdInput} onChange={(e) => setNewIdInput(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-xl font-black text-center flex-1" /><Button onClick={handleUpdateId} disabled={!newIdInput || isSavingId} className="h-14 px-10 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl">{isSavingId ? <Loader className="animate-spin" /> : 'Synchronize'}</Button><Button onClick={handleRemoveId} disabled={isSavingId || !targetUserForId.specialId} variant="outline" className="h-14 px-6 border-2 border-red-100 text-red-500 font-black uppercase rounded-2xl"><Trash2 className="h-5 w-5" /></Button></div>
                       </div>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="rewards" className="m-0 space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0"><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900"><Gift className="h-6 w-6 text-primary" /> Sovereign Dispatch Center</CardTitle></CardHeader>
                  <div className="flex gap-4">
                     <Input placeholder="Recipient I'd..." value={rewardSearchId} onChange={(e) => setRewardSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 rounded-2xl border-2" />
                     <Button onClick={handleGenericSearch.bind(null, 'id', rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic">Find ID</Button>
                  </div>
                  {targetUserForRewards && (
                    <div className="mt-10 p-8 border-2 rounded-[2.5rem] space-y-10 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                       <div className="flex items-center gap-4 border-b pb-6"><Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForRewards.avatarUrl || undefined}/></Avatar><div><p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForRewards.username}</p>{targetUserForRewards.specialId && <SpecialIdBadge id={targetUserForRewards.specialId} color={targetUserForRewards.specialIdColor} />}</div></div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-4"><div className="flex items-center gap-2 text-primary"><GoldCoinIcon className="h-5 w-5" /><h4 className="font-black uppercase italic text-sm">Coin Frequency</h4></div><div className="flex gap-2"><Input placeholder="Volume..." value={coinDispatchAmount} onChange={(e) => setCoinDispatchAmount(e.target.value.replace(/\D/g, ''))} className="h-14 rounded-2xl border-2 text-lg font-black italic" /><Button onClick={handleDispatchCoins} disabled={isDispatching} className="h-14 px-8 bg-primary text-white rounded-2xl"><Send className="h-5 w-5" /></Button></div></div>
                          <div className="space-y-4"><div className="flex items-center gap-2 text-purple-500"><Star className="h-5 w-5" /><h4 className="font-black uppercase italic text-sm">Sync Elite Frames</h4></div><div className="flex flex-wrap gap-2">{DISPATCH_ASSETS.frames.map(frame => (<Button key={frame.id} variant="outline" size="sm" onClick={() => handleDispatchItem(frame.id, 'ownedItems')} className="h-10 text-[8px] font-black uppercase rounded-xl">{frame.name}</Button>))}</div></div>
                       </div>
                    </div>
                  )}
                  <div className="mt-20 pt-10 border-t flex flex-col items-center gap-6"><Button onClick={handleDistributeDailyRewards} disabled={isSaving} className="w-full max-w-md h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase italic text-lg shadow-xl">{isSaving ? <Loader className="animate-spin mr-2" /> : <Gift className="mr-2" />} Distribute & Reset All</Button></div>
               </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
