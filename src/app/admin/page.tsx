'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Shield, Loader, Search, ClipboardList, Gift, CheckCircle2, UserCheck, Star, Crown, Zap, Heart, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

const AUTHORITY_ROLES = [
  { id: 'Super Admin', label: 'Super Admin', icon: Zap, color: 'text-red-500' },
  { id: 'Admin Management', label: 'Admin Management', icon: Shield, color: 'text-blue-500' },
  { id: 'App Manager', label: 'App Manager', icon: Star, color: 'text-purple-500' },
  { id: 'Customer Service', label: 'Customer Service', icon: MessageSquare, color: 'text-cyan-500' },
  { id: 'Coin Seller', label: 'Coin Seller', icon: Heart, color: 'text-pink-500' },
  { id: 'Assistant', label: 'Assistant', icon: UserCheck, color: 'text-green-500' },
];

/**
 * Ummy Command Center - Supreme Authority Oversight.
 * Creator-exclusive portal for tribal role management.
 */
export default function AdminPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { toast } = useToast();
  
  const isCreator = user?.uid === CREATOR_ID;
  const isAdmin = userProfile?.tags?.some((t: string) => ['Admin', 'Official', 'Super Admin', 'Admin Management', 'App Manager'].includes(t)) || isCreator;

  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Automatically switch to Authority Hub for the Creator
  useEffect(() => {
    if (isCreator) {
      setActiveTab('authority');
    }
  }, [isCreator]);

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

  const handleDistributeDailyRewards = async () => {
    if (!firestore || !isAdmin) return;
    setIsSaving(true);
    
    try {
      const batch = writeBatch(firestore);
      const rewardConfig = [100000, 80000, 50000, 35000, 20000, 20000, 20000, 20000, 20000, 20000];
      
      const processRankings = async (colPath: string, field: string, type: 'User' | 'Room') => {
        const q = query(
          collection(firestore, colPath),
          where(field, '>', 0),
          orderBy(field, 'desc'),
          limit(10)
        );
        
        let snap;
        try {
          snap = await getDocs(q);
        } catch (serverError: any) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: collection(firestore, colPath).path,
            operation: 'list',
          }));
          throw serverError;
        }

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

      batch.set(configRef!, { lastRewardReset: serverTimestamp() }, { merge: true });

      batch.commit().then(async () => {
        await logAdminAction('Official 11:59:59 IST Distribution & Reset', 'tribe/economy', { rewards: 'Top 10 Tiered' });
        toast({ title: 'Daily Sweep & Reset Complete', description: 'Rewards dispatched and leaderboard reset for the new IST cycle.' });
      }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'batch/commit',
          operation: 'write',
        }));
      });

    } catch (e: any) {
      // Logic errors handled here, permission errors handled by emitter
    } finally {
      setIsSaving(false);
    }
  };

  const logAdminAction = async (action: string, targetId: string, details: any) => {
    if (!firestore || !user) return;
    addDoc(collection(firestore, 'adminLogs'), {
      adminId: user.uid,
      adminName: userProfile?.username || 'Admin',
      targetId,
      action,
      details,
      createdAt: serverTimestamp()
    }).catch(() => {});
  };

  const handleSearchUsers = async () => {
    if (!firestore || !searchQuery) return;
    setIsSearching(true);
    try {
      const q = query(
        collection(firestore, 'users'),
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const snap = await getDocs(q);
      setFoundUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    } catch (serverError: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list',
      }));
    } finally {
      setIsSearching(false);
    }
  };

  const adjustBalance = (targetUserId: string, type: 'coins' | 'diamonds', amount: number) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    const userRef = doc(firestore, 'users', targetUserId);
    const profileRef = doc(firestore, 'users', targetUserId, 'profile', targetUserId);
    const updateData = { [`wallet.${type}`]: increment(amount), updatedAt: serverTimestamp() };
    
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    
    const notifRef = doc(collection(firestore, 'users', targetUserId, 'notifications'));
    const adjustBatch = writeBatch(firestore);
    adjustBatch.set(notifRef, {
      title: `Official Notice`,
      content: `Notice.. You receive ${amount.toLocaleString()} ${type}..... Best regard Ummy official`,
      type: 'system',
      timestamp: serverTimestamp(),
      isRead: false
    });
    
    adjustBatch.commit()
      .then(() => logAdminAction(`Adjust ${type}`, targetUserId, { amount }))
      .catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'batch/commit',
          operation: 'write',
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const toggleUserRole = async (targetUid: string, roleId: string, currentTags: string[] = []) => {
    if (!firestore || !isCreator) return;
    const hasRole = currentTags.includes(roleId);
    
    const userRef = doc(firestore, 'users', targetUid);
    const profileRef = doc(firestore, 'users', targetUid, 'profile', targetUid);
    
    const updateData = {
      tags: hasRole ? arrayRemove(roleId) : arrayUnion(roleId),
      updatedAt: serverTimestamp()
    };

    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    
    toast({ title: 'Authority Updated', description: `${roleId} ${hasRole ? 'revoked' : 'granted'} successfully.` });
    
    setFoundUsers(prev => prev.map(u => {
      if (u.id === targetUid) {
        const nextTags = hasRole ? u.tags.filter((t: string) => t !== roleId) : [...(u.tags || []), roleId];
        return { ...u, tags: nextTags };
      }
      return u;
    }));

    await logAdminAction(`Toggle Role: ${roleId}`, targetUid, { action: hasRole ? 'revoke' : 'grant' });
  };

  if (!isAdmin) return <AppLayout><div className="flex h-[50vh] items-center justify-center text-destructive font-headline"><Shield className="h-12 w-12 mr-2" /> Unauthorized</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto p-4 animate-in fade-in duration-700 font-headline">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20"><Shield className="h-8 w-8 text-white" /></div>
             <div>
                <h1 className="text-4xl font-bold uppercase italic tracking-tighter">{isCreator ? 'Supreme Command' : 'Ummy Command Center'}</h1>
                <p className="text-muted-foreground">{isCreator ? 'Supreme Authority Active' : 'Elite Rewards & Official 11:59:59 IST Distribution.'}</p>
             </div>
          </div>
          {isCreator && <Badge className="bg-red-500 text-white font-black uppercase italic px-4 py-1.5 h-10 rounded-xl shadow-xl shadow-red-500/20">Supreme Creator</Badge>}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary/50 p-1.5 h-12 rounded-full border w-fit overflow-x-auto no-scrollbar">
            {isCreator && <TabsTrigger value="authority" className="rounded-full px-6 font-black uppercase text-[10px] bg-red-500/10 text-red-500 data-[state=active]:bg-red-500 data-[state=active]:text-white">Authority Hub</TabsTrigger>}
            <TabsTrigger value="overview" className="rounded-full px-6 font-black uppercase text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-full px-6 font-black uppercase text-[10px]">Rewards Hub</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-6 font-black uppercase text-[10px]">Users</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-full px-6 font-black uppercase text-[10px]">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="text-xs uppercase opacity-50">Economy Status</CardTitle></CardHeader><CardContent><p className="text-3xl font-black uppercase italic text-green-500">Active</p></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-xs uppercase opacity-50">Last Distribution (IST)</CardTitle></CardHeader><CardContent><p className="text-3xl font-black uppercase italic">{config?.lastRewardReset ? format(config.lastRewardReset.toDate(), 'MMM d, HH:mm') : 'Pending'}</p></CardContent></Card>
             </div>
          </TabsContent>

          <TabsContent value="authority" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-red-500/10 to-transparent">
                <CardHeader>
                   <CardTitle className="text-2xl uppercase italic flex items-center gap-2 text-red-500">
                      <Zap className="h-6 w-6" /> Tribal Authority Protocol
                   </CardTitle>
                   <CardDescription>Exclusive Creator Portal: Define and dispatch elite tribal signatures.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex gap-4">
                      <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                         <Input placeholder="Search member to set role..." className="pl-10 h-12 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()} />
                      </div>
                      <Button onClick={handleSearchUsers} className="h-12 rounded-xl bg-red-500 text-white hover:bg-red-600" disabled={isSearching}>{isSearching ? <Loader className="animate-spin" /> : 'Search Social Graph'}</Button>
                   </div>

                   <div className="space-y-4">
                      {foundUsers.map((u) => (
                        <div key={u.id} className="p-6 bg-white rounded-3xl border shadow-sm space-y-6">
                           <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16 border-4 border-secondary shadow-lg"><AvatarImage src={u.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                              <div className="flex-1">
                                 <p className="font-black text-lg uppercase italic tracking-tighter">{u.username}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Tribe ID: {u.specialId}</p>
                                 <div className="flex gap-1 mt-2">
                                    {u.tags?.map((t: string) => (
                                      <Badge key={t} variant="secondary" className="text-[8px] px-2 py-0 h-4 uppercase font-black">{t}</Badge>
                                    ))}
                                 </div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {AUTHORITY_ROLES.map(role => {
                                const active = u.tags?.includes(role.id);
                                return (
                                  <Button 
                                    key={role.id} 
                                    variant={active ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => toggleUserRole(u.id, role.id, u.tags)}
                                    className={cn(
                                      "rounded-2xl h-12 flex items-center justify-start gap-3 px-4 font-black uppercase text-[9px] transition-all",
                                      active ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "hover:bg-red-50 text-muted-foreground"
                                    )}
                                  >
                                    <role.icon className={cn("h-4 w-4", !active && role.color)} />
                                    {role.label}
                                  </Button>
                                );
                              })}
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
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
