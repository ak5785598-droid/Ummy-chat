'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch } from 'firebase/firestore';
import { Shield, Loader, Search, ClipboardList, Gift, CheckCircle2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

/**
 * Ummy Command Center - High-Tier Reward Oversight.
 * Implements atomic distribution and subsequent leaderboard reset protocol based on 11:59:59 IST cycles.
 */
export default function AdminPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const configRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appConfig', 'global');
  }, [firestore]);
  const { data: config } = useDoc(configRef);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'adminLogs'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore, user]);
  const { data: logs } = useCollection(logsQuery);

  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

  const handleDistributeDailyRewards = async () => {
    if (!firestore || !isAdmin) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);
      // Prize Map: Top 1: 100K, Top 2: 80K, Top 3: 50K, Top 4: 35K, Top 5-10: 20K
      const rewardConfig = [100000, 80000, 50000, 35000, 20000, 20000, 20000, 20000, 20000, 20000];
      
      const processRankings = async (colPath: string, field: string, type: 'User' | 'Room') => {
        const q = query(
          collection(firestore, colPath),
          where(field, '>', 0),
          orderBy(field, 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d, i) => {
          const reward = rewardConfig[i] || 0;
          const targetUid = type === 'User' ? d.id : d.data().ownerId;
          if (!targetUid) return;

          const uRef = doc(firestore, 'users', targetUid);
          const pRef = doc(firestore, 'users', targetUid, 'profile', targetUid);
          const notifRef = doc(collection(firestore, 'users', targetUid, 'notifications'));

          // 1. Update Wallets
          batch.update(uRef, { 'wallet.coins': increment(reward) });
          batch.update(pRef, { 'wallet.coins': increment(reward) });
          
          // 2. Official Notification Delivery - Updated with standard wording
          batch.set(notifRef, {
            title: `Official Notice`,
            content: `Notice.. You receive ${reward.toLocaleString()} coins..... Best regard Ummy official`,
            type: 'system',
            timestamp: serverTimestamp(),
            isRead: false
          });
        });
      };

      // Execute Sweep for all major categories
      await processRankings('users', 'wallet.dailySpent', 'User');
      await processRankings('users', 'stats.dailyFans', 'User');
      await processRankings('users', 'stats.dailyGameWins', 'User');
      await processRankings('chatRooms', 'stats.dailyGifts', 'Room');

      // MANDATORY RESET: Clear all daily counters across the social graph after distribution
      const spendersSnap = await getDocs(query(collection(firestore, 'users'), where('wallet.dailySpent', '>', 0)));
      spendersSnap.docs.forEach(d => {
        batch.update(d.ref, { 'wallet.dailySpent': 0 });
        batch.update(doc(firestore, 'users', d.id, 'profile', d.id), { 'wallet.dailySpent': 0 });
      });

      const fansSnap = await getDocs(query(collection(firestore, 'users'), where('stats.dailyFans', '>', 0)));
      fansSnap.docs.forEach(d => {
        batch.update(d.ref, { 'stats.dailyFans': 0 });
        batch.update(doc(firestore, 'users', d.id, 'profile', d.id), { 'stats.dailyFans': 0 });
      });

      const winsSnap = await getDocs(query(collection(firestore, 'users'), where('stats.dailyGameWins', '>', 0)));
      winsSnap.docs.forEach(d => {
        batch.update(d.ref, { 'stats.dailyGameWins': 0 });
        batch.update(doc(firestore, 'users', d.id, 'profile', d.id), { 'stats.dailyGameWins': 0 });
      });

      const roomsSnap = await getDocs(query(collection(firestore, 'chatRooms'), where('stats.dailyGifts', '>', 0)));
      roomsSnap.docs.forEach(d => {
        batch.update(d.ref, { 'stats.dailyGifts': 0 });
      });

      // Update Global Reset Log
      batch.set(configRef!, { lastRewardReset: serverTimestamp() }, { merge: true });

      await batch.commit();
      await logAdminAction('Official 11:59:59 IST Distribution & Reset', 'tribe/economy', { rewards: 'Top 10 Tiered' });
      toast({ title: 'Daily Sweep & Reset Complete', description: 'Rewards dispatched and leaderboard reset for the new IST cycle.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Distribution Failed', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const logAdminAction = async (action: string, targetId: string, details: any) => {
    if (!firestore || !user) return;
    try {
      await addDoc(collection(firestore, 'adminLogs'), {
        adminId: user.uid,
        adminName: userProfile?.username || 'Admin',
        targetId,
        action,
        details,
        createdAt: serverTimestamp()
      });
    } catch (e: any) {}
  };

  const handleSearchUsers = async () => {
    if (!firestore || !searchQuery) return;
    setIsSearching(true);
    try {
      const q = query(
        collection(firestore, 'users'),
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      setFoundUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    } finally {
      setIsSearching(false);
    }
  };

  const adjustBalance = async (targetUserId: string, type: 'coins' | 'diamonds', amount: number) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', targetUserId);
      const profileRef = doc(firestore, 'users', targetUserId, 'profile', targetUserId);
      const updateData = { [`wallet.${type}`]: increment(amount), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      
      // Also send notice for manual adjustments
      const notifRef = doc(collection(firestore, 'users', targetUserId, 'notifications'));
      const adjustBatch = writeBatch(firestore);
      adjustBatch.set(notifRef, {
        title: `Official Notice`,
        content: `Notice.. You receive ${amount.toLocaleString()} ${type}..... Best regard Ummy official`,
        type: 'system',
        timestamp: serverTimestamp(),
        isRead: false
      });
      await adjustBatch.commit();

      await logAdminAction(`Adjust ${type}`, targetUserId, { amount });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) return <AppLayout><div className="flex h-[50vh] items-center justify-center text-destructive"><Shield className="h-12 w-12 mr-2" /> Unauthorized</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto p-4 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20"><Shield className="h-8 w-8 text-white" /></div>
             <div>
                <h1 className="text-4xl font-bold uppercase italic tracking-tighter">Ummy Command Center</h1>
                <p className="text-muted-foreground">Elite Rewards & Official 11:59:59 IST Distribution.</p>
             </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary/50 p-1.5 h-12 rounded-full border w-fit overflow-x-auto no-scrollbar">
            <TabsTrigger value="overview" className="rounded-full px-6 font-black uppercase text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-full px-6 font-black uppercase text-[10px]">Rewards Hub</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-6 font-black uppercase text-[10px]">Users</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-full px-6 font-black uppercase text-[10px]">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="text-xs uppercase opacity-50">Economy Status</CardTitle></CardHeader><CardContent><p className="text-3xl font-black uppercase italic">Active</p></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-xs uppercase opacity-50">Last Distribution (IST)</CardTitle></CardHeader><CardContent><p className="text-3xl font-black uppercase italic">{config?.lastRewardReset ? format(config.lastRewardReset.toDate(), 'MMM d, HH:mm') : 'Pending'}</p></CardContent></Card>
             </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-yellow-500/10 to-transparent">
                <CardHeader>
                   <CardTitle className="font-headline text-2xl uppercase italic flex items-center gap-2">
                      <Gift className="h-6 w-6 text-yellow-500" /> Daily Throne Distribution
                   </CardTitle>
                   <CardDescription>Dispatch high-tier rewards and reset all leaderboard counters atomically after 11:59:59 IST.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="p-6 bg-white/5 rounded-3xl border-2 border-dashed border-yellow-500/20">
                      <h3 className="font-black uppercase italic text-sm mb-4">Official Reward Config:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                         <div className="text-center"><p className="text-[10px] font-bold opacity-40 uppercase">Top 1</p><p className="font-black text-yellow-500">100,000</p></div>
                         <div className="text-center"><p className="text-[10px] font-bold opacity-40 uppercase">Top 2</p><p className="font-black text-slate-300">80,000</p></div>
                         <div className="text-center"><p className="text-[10px] font-bold opacity-40 uppercase">Top 3</p><p className="font-black text-amber-700">50,000</p></div>
                         <div className="text-center"><p className="text-[10px] font-bold opacity-40 uppercase">Top 4</p><p className="font-black">35,000</p></div>
                         <div className="text-center"><p className="text-[10px] font-bold opacity-40 uppercase">Top 5-10</p><p className="font-black">20,000</p></div>
                      </div>
                   </div>
                   <Button 
                      onClick={handleDistributeDailyRewards} 
                      disabled={isSaving} 
                      className="w-full h-16 rounded-[1.5rem] bg-yellow-500 text-black font-black uppercase italic text-lg shadow-xl shadow-yellow-500/20 hover:scale-[1.02] transition-transform"
                   >
                      {isSaving ? <Loader className="animate-spin h-6 w-6 mr-2" /> : <CheckCircle2 className="h-6 w-6 mr-2" />}
                      Distribute, Reset & Send Official Messages
                   </Button>
                   <p className="text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest italic">Clears daily spent, fans, wins, and gifts across the entire social graph.</p>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
             <Card className="rounded-[2rem] border-none shadow-xl">
                <CardContent className="pt-6 space-y-6">
                   <div className="flex gap-4">
                      <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                         <Input placeholder="Search username..." className="pl-10 h-12 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()} />
                      </div>
                      <Button onClick={handleSearchUsers} className="h-12 rounded-xl" disabled={isSearching}>{isSearching ? <Loader className="animate-spin" /> : 'Find'}</Button>
                   </div>
                   <div className="space-y-4">
                      {foundUsers.map((u) => (
                        <div key={u.id} className="p-4 bg-muted/20 rounded-2xl border flex items-center gap-4">
                           <Avatar className="h-12 w-12 border-2 border-white"><AvatarImage src={u.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                           <div className="flex-1">
                              <p className="font-black text-sm uppercase italic">{u.username}</p>
                              <p className="text-[10px] text-muted-foreground">ID: {u.specialId}</p>
                           </div>
                           <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'coins', 1000)} className="rounded-full h-8 text-[10px]">+1k</Button>
                              <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'diamonds', 100)} className="rounded-full h-8 text-[10px]">+100</Button>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="logs">
             <Card className="border-none shadow-xl rounded-[2rem]">
                <CardHeader><CardTitle className="font-headline text-2xl uppercase italic flex items-center gap-2"><ClipboardList className="h-6 w-6" /> Audit Logs (IST)</CardTitle></CardHeader>
                <CardContent><div className="space-y-2">{logs?.map((log: any) => (<div key={log.id} className="p-3 bg-muted/10 rounded-xl border flex items-center justify-between"><div className="flex-1"><p className="text-xs font-black uppercase italic">{log.action}</p><p className="text-[8px] text-muted-foreground">Admin: {log.adminName}</p></div><p className="text-[8px] opacity-50">{log.createdAt ? format(log.createdAt.toDate(), 'HH:mm') : '...'}</p></div>))}</div></CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
