'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking, errorEmitter, FirestorePermissionError, useStorage } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Shield, Loader, Search, ClipboardList, Gift, CheckCircle2, UserCheck, Star, Crown, Zap, Heart, MessageSquare, Tag, BadgeCheck, Upload, Type, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  { id: 'Customer Service', label: 'Customer Service', color: 'bg-blue-500', icon: MessageSquare },
  { id: 'Seller', label: 'Seller', color: 'bg-purple-500', icon: Heart },
];

const DEFAULT_SLIDES = [
  { id: 0, title: "Tribe Events", subtitle: "Global Frequency Sync", iconName: "Sparkles", color: "from-orange-500/40", imageUrl: 'https://picsum.photos/seed/banner1/800/200' },
  { id: 1, title: "Elite Rewards", subtitle: "Claim Your Daily Throne", iconName: "Trophy", color: "from-yellow-500/40", imageUrl: 'https://picsum.photos/seed/banner2/800/200' },
  { id: 2, title: "Game Zone", subtitle: "Enter the 3D Arena", iconName: "Gamepad2", color: "from-purple-500/40", imageUrl: 'https://picsum.photos/seed/banner3/800/200' }
];

export default function AdminPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { toast } = useToast();
  
  const isCreator = user?.uid === CREATOR_ID;

  const [activeTab, setActiveTab] = useState('authority');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSearchId, setTagSearchId] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [targetUserForTags, setTargetUserForTags] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [isUploadingBanner, setIsUploadingBanner] = useState<number | null>(null);

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

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return query(collection(firestore, 'adminLogs'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore, isCreator]);
  const { data: logs } = useCollection(logsQuery);

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
    } catch (e) {
      toast({ variant: 'destructive', title: 'Search Failed' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchByTagId = async () => {
    if (!firestore || !tagSearchId) return;
    setIsSearching(true);
    try {
      const paddedId = tagSearchId.padStart(3, '0');
      const q = query(collection(firestore, 'users'), where('specialId', '==', paddedId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) setTargetUserForTags({ ...snap.docs[0].data(), id: snap.docs[0].id });
      else toast({ variant: 'destructive', title: 'Identity Not Found' });
    } finally {
      setIsSearching(false);
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
    toast({ title: 'Authority Updated' });
  };

  const handleBannerImageUpload = async (index: number, file: File) => {
    if (!storage || !bannerConfigRef) return;
    setIsUploadingBanner(index);
    try {
      const sRef = ref(storage, `banners/slide_${index}_${Date.now()}.jpg`);
      const metadata = { contentType: file.type || 'image/jpeg' };
      const result = await uploadBytes(sRef, file, metadata);
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

  if (!isCreator) return <AppLayout><div className="flex h-[50vh] items-center justify-center text-destructive font-headline"><Shield className="h-12 w-12 mr-2" /> Unauthorized Portal Access Restricted</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto p-4 animate-in fade-in duration-700 font-headline">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20"><Shield className="h-8 w-8 text-white" /></div>
             <div><h1 className="text-4xl font-bold uppercase italic tracking-tighter">Supreme Command</h1><p className="text-muted-foreground">Supreme Authority Protocol Active.</p></div>
          </div>
          <Badge className="bg-red-500 text-white font-black uppercase italic px-4 py-1.5 h-10 rounded-xl shadow-xl shadow-red-500/20">Supreme Creator</Badge>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary/50 p-1.5 h-12 rounded-full border w-fit overflow-x-auto no-scrollbar">
            <TabsTrigger value="authority" className="rounded-full px-6 font-black uppercase text-[10px] data-[state=active]:bg-red-500 data-[state=active]:text-white">Authority Hub</TabsTrigger>
            <TabsTrigger value="banners" className="rounded-full px-6 font-black uppercase text-[10px]">Banners</TabsTrigger>
            <TabsTrigger value="tags" className="rounded-full px-6 font-black uppercase text-[10px]">Assign Tags</TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-full px-6 font-black uppercase text-[10px]">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="authority" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-red-500/10 to-transparent">
                <CardHeader><CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-red-500"><Zap className="h-6 w-6" /> Tribal Authority Protocol</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex gap-4">
                      <Input placeholder="Search member to set role..." className="h-12 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()} />
                      <Button onClick={handleSearchUsers} className="h-12 rounded-xl bg-red-500 text-white hover:bg-red-600" disabled={isSearching}>{isSearching ? <Loader className="animate-spin" /> : 'Search'}</Button>
                   </div>
                   <div className="space-y-4">
                      {foundUsers.map((u) => (
                        <div key={u.id} className="p-4 bg-white/50 rounded-2xl border flex flex-col gap-4">
                           <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-white"><AvatarImage src={u.avatarUrl || undefined} /><AvatarFallback>U</AvatarFallback></Avatar>
                              <div className="flex-1">
                                 <p className="font-black text-sm uppercase italic">{u.username}</p>
                                 <p className="text-[10px] text-muted-foreground">ID: {u.specialId}</p>
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

          <TabsContent value="banners" className="space-y-6">
             {(bannerConfig?.slides || DEFAULT_SLIDES).map((slide: any, idx: number) => (
               <Card key={idx} className="rounded-2xl overflow-hidden">
                  <div className="relative aspect-[8/2] bg-muted">
                     {slide.imageUrl && <Image src={slide.imageUrl || undefined} alt="Banner" fill className="object-cover" />}
                     {isUploadingBanner === idx && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}
                  </div>
                  <CardContent className="p-4 flex justify-between items-center">
                     <p className="font-black uppercase italic text-xs">{slide.title}</p>
                     <input type="file" ref={fileInputRefs[idx]} className="hidden" onChange={(e) => e.target.files?.[0] && handleBannerImageUpload(idx, e.target.files[0])} />
                     <Button onClick={() => fileInputRefs[idx].current?.click()} size="sm" className="rounded-full h-8 text-[10px]">Update Image</Button>
                  </CardContent>
               </Card>
             ))}
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
             <Card className="rounded-2xl p-6">
                <div className="flex gap-4">
                   <Input placeholder="Enter User ID..." value={tagSearchId} onChange={(e) => setTagSearchId(e.target.value)} />
                   <Button onClick={handleSearchByTagId}>Find</Button>
                </div>
                {targetUserForTags && (
                  <div className="mt-6 p-4 border rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <Avatar><AvatarImage src={targetUserForTags.avatarUrl || undefined}/></Avatar>
                        <p className="font-black uppercase italic text-sm">{targetUserForTags.username}</p>
                     </div>
                     <div className="flex gap-2">
                        {ELITE_TAGS.map(tag => (
                          <Button key={tag.id} variant={targetUserForTags.tags?.includes(tag.id) ? 'default' : 'outline'} size="sm" onClick={() => toggleUserRole(targetUserForTags.id, tag.id, targetUserForTags.tags)}>{tag.label}</Button>
                        ))}
                     </div>
                  </div>
                )}
             </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
             <Card className="rounded-2xl p-8 text-center space-y-6">
                <h3 className="text-2xl font-black uppercase italic text-yellow-500">11:59:59 IST Reset Engine</h3>
                <Button onClick={handleDistributeDailyRewards} disabled={isSaving} className="w-full h-16 rounded-2xl bg-yellow-500 text-black font-black uppercase italic text-xl">
                   {isSaving ? <Loader className="animate-spin mr-2" /> : <Gift className="mr-2" />}
                   Distribute & Reset Leaderboards
                </Button>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
