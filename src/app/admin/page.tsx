'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useUserProfile, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, setDoc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where, writeBatch } from 'firebase/firestore';
import { Shield, Loader, Search, ClipboardList, TrendingUp, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Enterprise Admin Control Panel.
 * Featuring the "Nuclear" option to remove all rooms and reset sequential IDs.
 */
export default function AdminPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Global Config
  const configRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appConfig', 'global');
  }, [firestore]);
  const { data: config } = useDoc(configRef);

  // Logs
  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'adminLogs'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore]);
  const { data: logs } = useCollection(logsQuery);

  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

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
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'adminLogs',
          operation: 'create',
          requestResourceData: { action, targetId }
        }));
      }
    }
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
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'users',
          operation: 'list',
        }));
      }
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
      await logAdminAction(`Adjust ${type}`, targetUserId, { amount });
      toast({ title: 'Balance Adjusted', description: `${amount} ${type} processed.` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllRooms = async () => {
    if (!firestore || !isAdmin) return;
    setIsSaving(true);
    try {
      const snap = await getDocs(collection(firestore, 'chatRooms'));
      const batch = writeBatch(firestore);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await logAdminAction('Wipe All Rooms', 'collection/chatRooms', { count: snap.size });
      toast({ title: 'All Frequencies Terminated' });
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'chatRooms',
          operation: 'delete',
        }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCounters = async () => {
    if (!firestore || !isAdmin) return;
    setIsSaving(true);
    try {
      const countersRef = doc(firestore, 'appConfig', 'counters');
      await setDoc(countersRef, { roomCounter: 0, userCounter: 1000 }, { merge: true });
      await logAdminAction('Reset Counters', 'config/counters', {});
      toast({ title: 'System Counters Reset', description: 'IDs will restart from baseline.' });
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'appConfig/counters',
          operation: 'update',
        }));
      }
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
                <p className="text-muted-foreground">System-wide authority and audit oversight.</p>
             </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary/50 p-1 h-12 rounded-full border w-fit">
            <TabsTrigger value="overview" className="rounded-full px-6 font-black uppercase text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-6 font-black uppercase text-[10px]">Users</TabsTrigger>
            <TabsTrigger value="config" className="rounded-full px-6 font-black uppercase text-[10px]">Config</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-full px-6 font-black uppercase text-[10px]">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="text-xs uppercase opacity-50">Economy Status</CardTitle></CardHeader><CardContent><p className="text-3xl font-black uppercase italic">{config?.economyEnabled ? 'Active' : 'Paused'}</p></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-xs uppercase opacity-50">Health</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-green-500 font-black uppercase italic"><TrendingUp className="h-5 w-5" /> Normal Frequency</div></CardContent></Card>
             </div>
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

          <TabsContent value="config" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[2rem] border-none shadow-xl">
                   <CardHeader><CardTitle className="font-headline uppercase italic">System Toggles</CardTitle></CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                         <div><Label className="font-black uppercase italic">Economy Engine</Label><p className="text-[10px] text-muted-foreground">Toggle coin spending.</p></div>
                         <Switch checked={config?.economyEnabled ?? true} onCheckedChange={(val) => setDoc(configRef!, { economyEnabled: val }, { merge: true }).catch(e => {
                            if (e.code === 'permission-denied') {
                               errorEmitter.emit('permission-error', new FirestorePermissionError({
                                  path: configRef!.path,
                                  operation: 'update',
                                  requestResourceData: { economyEnabled: val }
                               }));
                            }
                         })} />
                      </div>
                   </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-xl">
                   <CardHeader><CardTitle className="font-headline uppercase italic text-destructive">Danger Zone</CardTitle></CardHeader>
                   <CardContent className="space-y-4">
                      <Button variant="destructive" className="w-full rounded-xl font-black uppercase italic" disabled={isSaving} onClick={handleClearAllRooms}><Trash2 className="mr-2 h-4 w-4" /> Wipe All Rooms</Button>
                      <Button variant="outline" className="w-full rounded-xl font-black uppercase italic border-destructive text-destructive" disabled={isSaving} onClick={handleResetCounters}><RefreshCw className="mr-2 h-4 w-4" /> Reset ID Sequence</Button>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="logs">
             <Card className="border-none shadow-xl rounded-[2rem]">
                <CardHeader><CardTitle className="font-headline text-2xl uppercase italic flex items-center gap-2"><ClipboardList className="h-6 w-6" /> Audit Logs</CardTitle></CardHeader>
                <CardContent><div className="space-y-2">{logs?.map((log: any) => (<div key={log.id} className="p-3 bg-muted/10 rounded-xl border flex items-center justify-between"><div className="flex-1"><p className="text-xs font-black uppercase italic">{log.action}</p><p className="text-[8px] text-muted-foreground">Admin: {log.adminName}</p></div><p className="text-[8px] opacity-50">{log.createdAt ? format(log.createdAt.toDate(), 'HH:mm') : '...'}</p></div>))}</div></CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}