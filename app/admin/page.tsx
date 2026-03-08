
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking, errorEmitter, FirestorePermissionError, useStorage } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Shield, Loader, Search, ClipboardList, Gift, CheckCircle2, UserCheck, Star, Crown, Zap, Heart, MessageSquare, Tag, BadgeCheck, Upload, Type, Image as ImageIcon, Gamepad2, Camera, Trash2, ShieldCheck, Store, Check, X, Mic2, Send, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useGameLogoUpload } from '@/hooks/use-game-logo-upload';
import { OfficialTag } from '@/components/official-tag';
import { GoldCoinIcon } from '@/components/icons';
import { Textarea } from '@/components/ui/textarea';

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
    { id: 'f1', name: 'Golden Official' },
    { id: 'f2', name: 'Cyberpunk Red' },
    { id: 'f3', name: 'Royal Purple' },
    { id: 'f4', name: 'Imperial Bloom' },
    { id: 'f5', name: 'Golden wings' },
    { id: 'f6', name: 'Bronze Sky' },
    { id: 'f7', name: 'Celestial Wings' },
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
  { id: 0, title: "Tribe Events", subtitle: "Global Frequency Sync", iconName: "Sparkles", color: "from-orange-500/40", imageUrl: 'https://picsum.photos/seed/banner1/800/200' },
  { id: 1, title: "Elite Rewards", subtitle: "Claim Your Daily Throne", iconName: "Trophy", color: "from-yellow-500/40", imageUrl: 'https://picsum.photos/seed/banner2/800/200' },
  { id: 2, title: "Game Zone", subtitle: "Enter the 3D Arena", iconName: "Gamepad2", color: "from-purple-500/40", imageUrl: 'https://picsum.photos/seed/banner3/800/200' }
];

const ACTIVE_GAME_FREQUENCIES = [
  { id: 'roulette', title: 'Roulette', slug: 'roulette', imageHint: 'roulette wheel' },
  { id: 'ludo', title: 'Ludo Masters', slug: 'ludo', imageHint: '3d ludo board' },
  { id: 'fruit-party', title: 'Fruit Party', slug: 'fruit-party', imageHint: '3d fruit icons' },
  { id: 'forest-party', title: 'Wild Party', slug: 'forest-party', imageHint: '3d lion head' },
];

/**
 * High-Fidelity Glossy Special ID Signature.
 */
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

/**
 * Ummy Command Center - Supreme Authority Oversight.
 */
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
  
  // Tag States
  const [tagSearchId, setTagSearchId] = useState('');
  const [tagSearchName, setTagSearchName] = useState('');
  const [targetUserForTags, setTargetUserForTags] = useState<any>(null);
  
  // ID States
  const [idSearchInput, setIdSearchInput] = useState('');
  const [nameSearchInput, setNameSearchInput] = useState('');
  const [newIdInput, setNewIdInput] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>('red');
  const [targetUserForId, setTargetUserForId] = useState<any>(null);
  
  // Dispatch States
  const [rewardSearchId, setRewardSearchId] = useState('');
  const [rewardSearchName, setRewardSearchName] = useState('');
  const [targetUserForRewards, setTargetUserForRewards] = useState<any>(null);
  const [coinDispatchAmount, setCoinDispatchAmount] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Broadcast States
  const [broadcastTitle, setBroadcastTitle] = useState('Official Notice');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingTag, setIsSearchingTag] = useState(false);
  const [isSearchingRewards, setIsSearchingRewards] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingId, setIsSavingId] = useState(false);
  
  const [isUploadingBanner, setIsUploadingBanner] = useState<number | null>(null);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const gameFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameForDP, setSelectedGameForDP] = useState<any>(null);

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return query(collection(firestore, 'games'));
  }, [firestore, isCreator]);
  const { data: firestoreGames } = useCollection(gamesQuery);

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
        toast({ title: 'No users detected in social graph.' });
        return;
      }

      // Batching Protocol: 500 operations per writeBatch
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
      
      if (count > 0) {
        batches.push(currentBatch.commit());
      }

      await Promise.all(batches);
      toast({ title: 'Broadcast Synchronized', description: `Message successfully dispatched to ${totalUsers} members.` });
      setBroadcastContent('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Broadcast Failed', description: e.message });
    } finally {
      setIsBroadcasting(false);
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

  const [foundUsers, setFoundUsers] = useState<any[]>([]);

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
      
      toast({ title: 'Coins Dispatched', description: `${amt.toLocaleString()} coins synced to ${targetUserForRewards.username}.` });
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
      toast({ title: 'Asset Dispatched', description: `Item ${itemId} synced to inventory.` });
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
        toast({ variant: 'destructive', title: 'Conflict', description: 'ID already assigned to another member.' });
        return;
      }

      const uRef = doc(firestore, 'users', targetUserForId.id);
      const pRef = doc(firestore, 'users', targetUserForId.id, 'profile', targetUserForId.id);
      
      const updateData = { specialId: paddedNewId, specialIdColor: selectedColor, updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(uRef, updateData);
      updateDocumentNonBlocking(pRef, updateData);
      
      setTargetUserForId((prev: any) => ({ ...prev, specialId: paddedNewId, specialIdColor: selectedColor }));
      toast({ title: 'ID Synchronized', description: `Member is now identified as ${paddedNewId} with ${selectedColor} theme.` });
      setNewIdInput('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sync Failed' });
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
    const hasRole = currentTags.includes(roleId);
    const userRef = doc(firestore, 'users', targetUid);
    const profileRef = doc(firestore, 'users', targetUid, 'profile', targetUid);
    const updateData = { tags: hasRole ? arrayRemove(roleId) : arrayUnion(roleId), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    
    if (targetUserForTags && targetUserForTags.id === targetUid) {
      setTargetUserForTags((prev: any) => ({
        ...prev,
        tags: hasRole ? (prev.tags || []).filter((t: string) => t !== roleId) : [...(prev.tags || []), roleId]
      }));
    }
    
    toast({ title: 'Authority Updated' });
  };

  const handleRemoveAllTags = async (targetUid: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', targetUid);
    const profileRef = doc(firestore, 'users', targetUid, 'profile', targetUid);
    const updateData = { tags: [], updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    
    if (targetUserForTags && targetUserForTags.id === targetUid) {
      setTargetUserForTags((prev: any) => ({ ...prev, tags: [] }));
    }
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

  if (!isCreator) return <AppLayout><div className="flex h-[50vh] items-center justify-center text-destructive font-headline"><Shield className="h-12 w-12 mr-2" /> Unauthorized Portal Access Restricted</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto p-4 animate-in fade-in duration-700 font-headline bg-white min-h-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20"><Shield className="h-8 w-8 text-white" /></div>
             <div><h1 className="text-4xl font-bold uppercase italic tracking-tighter text-slate-900">Supreme Command</h1><p className="text-muted-foreground">Supreme Authority Protocol Active.</p></div>
          </div>
          <Badge className="bg-primary text-black font-black uppercase italic px-4 py-1.5 h-10 rounded-xl shadow-xl shadow-primary/20">Supreme Creator</Badge>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-10 items-start">
          <div className="w-full md:w-72 shrink-0 sticky top-24">
            <TabsList className="flex flex-col h-fit w-full bg-slate-50 shadow-2xl rounded-[2.5rem] border border-slate-100 p-3 gap-2 overflow-visible">
              <TabsTrigger value="authority" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                <Zap className="h-4 w-4 text-orange-500" /> Authority Hub
              </TabsTrigger>
              <TabsTrigger value="banners" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                <ImageIcon className="h-4 w-4 text-blue-500" /> Banners
              </TabsTrigger>
              <TabsTrigger value="games" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                <Gamepad2 className="h-4 w-4 text-purple-500" /> Game Sync
              </TabsTrigger>
              <TabsTrigger value="broadcaster" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                <Megaphone className="h-4 w-4 text-cyan-500" /> Broadcaster
              </TabsTrigger>
              <TabsTrigger value="tags" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                <BadgeCheck className="h-4 w-4 text-green-500" /> Assign Tags
              </TabsTrigger>
              <TabsTrigger value="special-id" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                <Type className="h-4 w-4 text-red-500" /> Special I'd
              </TabsTrigger>
              <TabsTrigger value="rewards" className="w-full justify-start h-14 rounded-2xl px-6 font-black uppercase italic text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">
                <Gift className="h-4 w-4 text-pink-500" /> Rewards
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 w-full min-w-0">
            <TabsContent value="authority" className="m-0 space-y-6 focus-visible:ring-0">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-primary"><Zap className="h-6 w-6" /> Tribal Authority Protocol</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                     <div className="flex gap-4">
                        <Input placeholder="Search member..." className="h-12 rounded-xl border-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()} />
                        <Button onClick={handleSearchUsers} className="h-12 rounded-xl bg-primary text-white" disabled={isSearching}>{isSearching ? <Loader className="animate-spin" /> : 'Search'}</Button>
                     </div>
                     <div className="space-y-4">
                        {foundUsers.map((u) => (
                          <div key={u.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col gap-4 shadow-sm">
                             <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-slate-50"><AvatarImage src={u.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                                <div className="flex-1">
                                   <p className="font-black text-sm uppercase italic text-slate-900">{u.username}</p>
                                   {u.specialId ? <SpecialIdBadge id={u.specialId} color={u.specialIdColor} /> : <p className="text-[10px] text-muted-foreground">ID: {u.id.slice(0, 6)}</p>}
                                </div>
                                <div className="flex gap-2">
                                   <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'coins', 1000)} className="rounded-full h-8 text-[10px] border-slate-200">+1k</Button>
                                   <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'diamonds', 100)} className="rounded-full h-8 text-[10px] border-slate-200">+100</Button>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {AUTHORITY_ROLES.map(role => (
                                  <Button key={role.id} variant={u.tags?.includes(role.id) ? 'default' : 'outline'} size="sm" onClick={() => toggleUserRole(u.id, role.id, u.tags)} className="h-10 text-[8px] font-black uppercase rounded-xl border-slate-200">{role.label}</Button>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="broadcaster" className="m-0 space-y-6 focus-visible:ring-0">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900">
                        <Megaphone className="h-6 w-6 text-primary" /> Global Broadcaster
                     </CardTitle>
                     <CardDescription>Dispatch official system announcements to every member's Ummy Team frequency.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-6">
                     <div className="space-y-4">
                        <div className="grid gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Broadcast Title</p>
                           <Input 
                             value={broadcastTitle} 
                             onChange={(e) => setBroadcastTitle(e.target.value)}
                             className="h-14 rounded-2xl border-2 border-slate-100 text-lg font-black italic"
                           />
                        </div>
                        <div className="grid gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message Content</p>
                           <Textarea 
                             placeholder="Type the official message frequency..."
                             value={broadcastContent}
                             onChange={(e) => setBroadcastContent(e.target.value)}
                             className="h-40 rounded-3xl border-2 border-slate-100 p-6 text-base font-body italic resize-none"
                           />
                        </div>
                     </div>
                     <div className="pt-4">
                        <Button 
                          onClick={handleSystemBroadcast}
                          disabled={isBroadcasting || !broadcastContent.trim()}
                          className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase italic text-xl shadow-xl hover:scale-[1.02] transition-transform"
                        >
                           {isBroadcasting ? <Loader className="animate-spin mr-2" /> : <Send className="mr-2" />}
                           Synchronize Global Broadcast
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="banners" className="m-0 space-y-6 focus-visible:ring-0">
               <div className="grid grid-cols-1 gap-6">
                 {(bannerConfig?.slides || DEFAULT_SLIDES).map((slide: any, idx: number) => (
                   <Card key={idx} className="rounded-2xl overflow-hidden border-none shadow-lg bg-white">
                      <div className="relative aspect-[8/2] bg-muted">
                         {slide.imageUrl && <Image src={slide.imageUrl} alt="Banner" fill className="object-cover" unoptimized />}
                         {isUploadingBanner === idx && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}
                      </div>
                      <CardContent className="p-4 flex justify-between items-center">
                         <p className="font-black uppercase italic text-xs text-slate-900">{slide.title}</p>
                         <input type="file" ref={fileInputRef => fileInputRefs[idx].current = fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleBannerImageUpload(idx, e.target.files[0])} />
                         <Button onClick={() => fileInputRefs[idx].current?.click()} size="sm" className="rounded-full h-8 text-[10px]">Update Visual</Button>
                      </CardContent>
                   </Card>
                 ))}
               </div>
            </TabsContent>

            <TabsContent value="games" className="m-0 space-y-6 focus-visible:ring-0">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary/10 to-transparent">
                  <CardHeader>
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-primary">
                        <Gamepad2 className="h-6 w-6" /> Game Identity Sync
                     </CardTitle>
                     <CardDescription>Synchronize high-fidelity cover visuals for the 3D Tribe Arena.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {gamesList.map((game) => (
                       <Card key={game.slug} className="rounded-3xl overflow-hidden border-2 border-slate-100 shadow-sm group bg-white">
                          <div className="relative aspect-square bg-slate-50 flex items-center justify-center">
                             {game.coverUrl ? (
                               <Image 
                                 key={game.coverUrl} 
                                 src={game.coverUrl} 
                                 alt={game.title} 
                                 fill 
                                 unoptimized 
                                 className="object-cover transition-transform group-hover:scale-105" 
                               />
                             ) : (
                               <Gamepad2 className="h-12 w-12 text-slate-200" />
                             )}
                             {isUploadingGameDP && selectedGameForDP?.slug === game.slug && (
                               <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                                  <Loader className="h-8 w-8 animate-spin text-white" />
                               </div>
                             )}
                          </div>
                          <CardHeader className="p-4 text-center">
                             <CardTitle className="text-sm font-black uppercase italic text-slate-900">{game.title}</CardTitle>
                             <Button 
                               onClick={() => handleGameDPUploadClick(game)} 
                               className="w-full mt-2 h-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] italic shadow-lg shadow-primary/20"
                               disabled={isUploadingGameDP}
                             >
                                <Camera className="h-3 w-3 mr-2" /> Sync New DP
                             </Button>
                          </CardHeader>
                       </Card>
                     ))}
                  </CardContent>
               </Card>
               <input type="file" ref={gameFileInputRef} className="hidden" accept="image/*" onChange={handleGameDPFileChange} />
            </TabsContent>

            <TabsContent value="tags" className="m-0 space-y-6 focus-visible:ring-0">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900">
                        <BadgeCheck className="h-6 w-6 text-primary" /> Assign Official Tags
                     </CardTitle>
                     <CardDescription>Grant high-fidelity elite signatures to tribe members. Restricted to Supreme Authority.</CardDescription>
                  </CardHeader>
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Input placeholder="Enter User Tribal ID..." value={tagSearchId} onChange={(e) => setTagSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 rounded-2xl border-2 border-slate-200" />
                        <Button onClick={() => handleGenericSearch('id', tagSearchId, setTargetUserForTags, setIsSearchingTag)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingTag}>Find by ID</Button>
                     </div>
                     <div className="flex gap-4">
                        <Input placeholder="Or Enter Username..." value={tagSearchName} onChange={(e) => setTagSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('name', tagSearchName, setTargetUserForTags, setIsSearchingTag)} className="h-14 rounded-2xl border-2 border-slate-200" />
                        <Button onClick={() => handleGenericSearch('name', tagSearchName, setTargetUserForTags, setIsSearchingTag)} className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-900 border-2 border-slate-200 font-black uppercase italic" disabled={isSearchingTag}>Find by Name</Button>
                     </div>
                  </div>
                  {targetUserForTags && (
                    <div className="mt-10 p-6 border-2 border-slate-50 rounded-[2rem] flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500 bg-slate-50/30">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForTags.avatarUrl}/></Avatar>
                             <div>
                                <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForTags.username}</p>
                                {targetUserForTags.specialId ? <SpecialIdBadge id={targetUserForTags.specialId} color={targetUserForTags.specialIdColor} /> : <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {targetUserForTags.id.slice(0, 6)}</p>}
                             </div>
                          </div>
                          {targetUserForTags.tags?.includes('Official') && <OfficialTag />}
                       </div>
                       
                       <div className="space-y-4">
                          <div className="flex items-center justify-between ml-2">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Assign Elite Frequency</p>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="text-red-500 text-[8px] font-black uppercase h-6 hover:bg-red-50" 
                               onClick={() => handleRemoveAllTags(targetUserForTags.id)}
                             >
                                Remove All Tags
                             </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             {ELITE_TAGS.map(tag => (
                               <Button 
                                 key={tag.id} 
                                 variant={targetUserForTags.tags?.includes(tag.id) ? 'default' : 'outline'} 
                                 className={cn(
                                   "h-16 rounded-2xl font-black uppercase italic text-xs transition-all border-2",
                                   targetUserForTags.tags?.includes(tag.id) ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : "hover:bg-white border-slate-200 text-slate-600"
                                 )}
                                 onClick={() => toggleUserRole(targetUserForTags.id, tag.id, targetUserForTags.tags)}
                               >
                                  {tag.id === 'Official' ? <BadgeCheck className="mr-2 h-4 w-4" /> : tag.id === 'Seller' ? <Heart className="mr-2 h-4 w-4" /> : tag.id === 'Official center' ? <ShieldCheck className="mr-2 h-4 w-4" /> : tag.id === 'Seller center' ? <Store className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                  {tag.label}
                               </Button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="special-id" className="m-0 space-y-6 focus-visible:ring-0">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900">
                        <Type className="h-6 w-6 text-primary" /> Manage Special I'd
                     </CardTitle>
                     <CardDescription>Re-synchronize a member's numeric identity frequency.</CardDescription>
                  </CardHeader>
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Input placeholder="Enter Current I'd..." value={idSearchInput} onChange={(e) => setIdSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 rounded-2xl border-2 border-slate-200" />
                        <Button onClick={() => handleGenericSearch('id', idSearchInput, setTargetUserForId, setIsSearching)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearching}>Find by ID</Button>
                     </div>
                     <div className="flex gap-4">
                        <Input placeholder="Enter Username..." value={nameSearchInput} onChange={(e) => setNameSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('name', nameSearchInput, setTargetUserForId, setIsSearching)} className="h-14 rounded-2xl border-2 border-slate-200" />
                        <Button onClick={() => handleGenericSearch('name', nameSearchInput, setTargetUserForId, setIsSearching)} className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-900 border-2 border-slate-200 font-black uppercase italic" disabled={isSearching}>Find by Name</Button>
                     </div>
                  </div>
                  {targetUserForId && (
                    <div className="mt-10 p-6 border-2 border-slate-50 rounded-[2rem] space-y-8 animate-in slide-in-from-bottom-4 duration-500 bg-slate-50/30">
                       <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForId.avatarUrl}/></Avatar>
                          <div>
                             <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForId.username}</p>
                             <div className="mt-1">
                                {targetUserForId.specialId ? (
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-black uppercase text-gray-400">Current:</span>
                                     <SpecialIdBadge id={targetUserForId.specialId} color={targetUserForId.specialIdColor} />
                                  </div>
                                ) : (
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Signature: None</p>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Theme Frequency</p>
                             <div className="flex gap-4 ml-2">
                                <button 
                                  onClick={() => setSelectedColor('red')}
                                  className={cn(
                                    "h-10 w-10 rounded-full bg-rose-500 border-4 transition-all flex items-center justify-center",
                                    selectedColor === 'red' ? "border-slate-900 scale-110" : "border-transparent opacity-60"
                                  )}
                                >
                                   {selectedColor === 'red' && <Check className="h-4 w-4 text-white" />}
                                </button>
                                <button 
                                  onClick={() => setSelectedColor('blue')}
                                  className={cn(
                                    "h-10 w-10 rounded-full bg-blue-500 border-4 transition-all flex items-center justify-center",
                                    selectedColor === 'blue' ? "border-slate-900 scale-110" : "border-transparent opacity-60"
                                  )}
                                >
                                   {selectedColor === 'blue' && <Check className="h-4 w-4 text-white" />}
                                </button>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">New Special I'd Assignment</p>
                             <div className="flex gap-2">
                                <Input 
                                  placeholder="Enter New Numeric I'd (e.g. 777)" 
                                  value={newIdInput} 
                                  onChange={(e) => setNewIdInput(e.target.value.replace(/\D/g, ''))}
                                  className="h-14 rounded-2xl border-2 border-slate-200 text-xl font-black tracking-widest text-center flex-1"
                                />
                                <div className="flex gap-2 shrink-0">
                                   <Button 
                                     onClick={handleUpdateId} 
                                     disabled={!newIdInput || isSavingId}
                                     className="h-14 px-10 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20"
                                   >
                                      {isSavingId ? <Loader className="animate-spin" /> : 'Synchronize'}
                                   </Button>
                                   <Button 
                                     onClick={handleRemoveId} 
                                     disabled={isSavingId || !targetUserForId.specialId}
                                     variant="outline"
                                     className="h-14 px-6 border-2 border-red-100 text-red-500 font-black uppercase italic rounded-2xl hover:bg-red-50 shadow-none"
                                   >
                                      {isSavingId ? <Loader className="animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                   </Button>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
               </Card>
            </TabsContent>

            <TabsContent value="rewards" className="m-0 space-y-6 focus-visible:ring-0">
               <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                  <CardHeader className="px-0">
                     <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-slate-900">
                        <Gift className="h-6 w-6 text-primary" /> Sovereign Dispatch Center
                     </CardTitle>
                     <CardDescription>Dispatch economic and visual assets to tribe members via global sync.</CardDescription>
                  </CardHeader>

                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Input placeholder="Recipient I'd..." value={rewardSearchId} onChange={(e) => setRewardSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('id', rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 rounded-2xl border-2 border-slate-200" />
                        <Button onClick={() => handleGenericSearch('id', rewardSearchId, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 px-8 rounded-2xl bg-black text-white font-black uppercase italic" disabled={isSearchingRewards}>Find ID</Button>
                     </div>
                     <div className="flex gap-4">
                        <Input placeholder="Recipient Username..." value={rewardSearchName} onChange={(e) => setRewardSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenericSearch('name', rewardSearchName, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 rounded-2xl border-2 border-slate-200" />
                        <Button onClick={() => handleGenericSearch('name', rewardSearchName, setTargetUserForRewards, setIsSearchingRewards)} className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-900 border-2 border-slate-200 font-black uppercase italic" disabled={isSearchingRewards}>Find Name</Button>
                     </div>
                  </div>

                  {targetUserForRewards && (
                    <div className="mt-10 p-8 border-2 border-slate-50 rounded-[2.5rem] space-y-10 animate-in slide-in-from-bottom-4 duration-500 bg-slate-50/20">
                       <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-xl"><AvatarImage src={targetUserForRewards.avatarUrl}/></Avatar>
                          <div>
                             <p className="font-black uppercase italic text-xl tracking-tighter text-slate-900">{targetUserForRewards.username}</p>
                             {targetUserForRewards.specialId && <SpecialIdBadge id={targetUserForRewards.specialId} color={targetUserForRewards.specialIdColor} />}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          {/* Coin Dispatch */}
                          <div className="space-y-4">
                             <div className="flex items-center gap-2 text-primary">
                                <GoldCoinIcon className="h-5 w-5" />
                                <h4 className="font-black uppercase italic text-sm">Coin Frequency</h4>
                             </div>
                             <div className="flex gap-2">
                                <Input 
                                  placeholder="Enter Coin Volume..." 
                                  value={coinDispatchAmount}
                                  onChange={(e) => setCoinDispatchAmount(e.target.value.replace(/\D/g, ''))}
                                  className="h-14 rounded-2xl border-2 border-slate-200 text-lg font-black italic"
                                />
                                <Button onClick={handleDispatchCoins} disabled={isDispatching} className="h-14 px-8 bg-primary text-white rounded-2xl font-black uppercase italic">
                                   {isDispatching ? <Loader className="animate-spin" /> : <Send className="h-5 w-5" />}
                                </Button>
                             </div>
                          </div>

                          {/* Frames Dispatch */}
                          <div className="space-y-4">
                             <div className="flex items-center gap-2 text-purple-500">
                                <Star className="h-5 w-5" />
                                <h4 className="font-black uppercase italic text-sm">Sync Elite Frames</h4>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {DISPATCH_ASSETS.frames.map(frame => (
                                  <Button key={frame.id} variant="outline" size="sm" onClick={() => handleDispatchItem(frame.id, 'ownedItems')} className="h-10 text-[8px] font-black uppercase rounded-xl border-slate-200 hover:bg-purple-50">
                                     {frame.name}
                                  </Button>
                                ))}
                             </div>
                          </div>

                          {/* Themes Dispatch */}
                          <div className="space-y-4">
                             <div className="flex items-center gap-2 text-blue-500">
                                <ImageIcon className="h-5 w-5" />
                                <h4 className="font-black uppercase italic text-sm">Sync Room Themes</h4>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {DISPATCH_ASSETS.themes.map(theme => (
                                  <Button key={theme.id} variant="outline" size="sm" onClick={() => handleDispatchItem(theme.id, 'purchasedThemes')} className="h-10 text-[8px] font-black uppercase rounded-xl border-slate-200 hover:bg-blue-50">
                                     {theme.name}
                                  </Button>
                                ))}
                             </div>
                          </div>

                          {/* Chat Bubbles & Waves */}
                          <div className="space-y-4">
                             <div className="flex items-center gap-2 text-pink-500">
                                <MessageSquare className="h-5 w-5" />
                                <h4 className="font-black uppercase italic text-sm">Sync Chat/Wave</h4>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {DISPATCH_ASSETS.bubbles.map(b => (
                                  <Button key={b.id} variant="outline" size="sm" onClick={() => handleDispatchItem(b.id, 'ownedItems')} className="h-10 text-[8px] font-black uppercase rounded-xl border-slate-200 hover:bg-pink-50">
                                     {b.name}
                                  </Button>
                                ))}
                                {DISPATCH_ASSETS.waves.map(w => (
                                  <Button key={w.id} variant="outline" size="sm" onClick={() => handleDispatchItem(w.id, 'ownedItems')} className="h-10 text-[8px] font-black uppercase rounded-xl border-slate-200 hover:bg-pink-50">
                                     {w.name}
                                  </Button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-center gap-6">
                     <div className="text-center space-y-2">
                        <h3 className="text-xl font-black uppercase italic text-primary">Global Reset Protocol</h3>
                        <p className="text-muted-foreground font-body text-sm italic max-w-md mx-auto">Trigger the daily global rewards distribution based on tribal rankings.</p>
                     </div>
                     <Button onClick={handleDistributeDailyRewards} disabled={isSaving} className="w-full max-w-md h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase italic text-lg shadow-xl hover:scale-[1.02] transition-transform">
                        {isSaving ? <Loader className="animate-spin mr-2" /> : <Gift className="mr-2" />}
                        Distribute & Reset All
                     </Button>
                  </div>
               </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
