'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useDoc, useUser, useUserProfile, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, setDoc, updateDoc, increment, collection, query, orderBy, limit, serverTimestamp, addDoc, getDocs, where } from 'firebase/firestore';
import { Settings, Shield, Zap, Gem, Globe, Layout, Loader, Search, User, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

/**
 * Enterprise Admin Control Panel.
 * Secured via tag-based permissions.
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
  const { data: config, isLoading: isConfigLoading } = useDoc(configRef);

  // Logs
  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'adminLogs'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore]);
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery);

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
    } catch (e) {
      console.warn("Audit logging failed:", e);
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
      const users = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setFoundUsers(users);
      if (users.length === 0) toast({ title: 'No users found' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Search failed' });
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
      const updateData = {
        [`wallet.${type}`]: increment(amount),
        updatedAt: serverTimestamp()
      };
      
      // Use setDoc with merge for robustness during admin overrides
      setDocumentNonBlocking(userRef, updateData, { merge: true });
      setDocumentNonBlocking(profileRef, updateData, { merge: true });

      await logAdminAction(`Adjust ${type}`, targetUserId, { amount });
      
      toast({ title: 'Balance Adjusted', description: `${amount} ${type} processed.` });
      setTimeout(() => handleSearchUsers(), 500); // Small delay to allow write to propagate for UI
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGlobalConfig = async (field: string, value: boolean) => {
    if (!firestore || !configRef) return;
    setIsSaving(true);
    try {
      await setDoc(configRef, { [field]: value }, { merge: true });
      await logAdminAction('Toggle Config', 'global', { field, value });
      toast({ title: 'System Updated', description: `${field} is now ${value ? 'enabled' : 'disabled'}.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update failed' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin" /></div></AppLayout>;

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Unauthorized Access</h1>
          <p className="text-muted-foreground">Only the App Owner/Official can access this enterprise panel.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                <Shield className="h-8 w-8 text-white" />
             </div>
             <div>
                <h1 className="text-4xl font-bold font-headline uppercase tracking-tighter italic">Dilsey Command Center</h1>
                <p className="text-muted-foreground font-body text-lg">System-wide authority and audit oversight.</p>
             </div>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="px-4 py-1 border-primary text-primary font-black uppercase tracking-widest">Enterprise Mode</Badge>
             <Badge className="bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest">Live Sync</Badge>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary/50 p-1.5 h-14 rounded-full border border-white/50 w-fit">
            <TabsTrigger value="overview" className="rounded-full px-8 font-black uppercase tracking-widest text-xs">Overview</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-8 font-black uppercase tracking-widest text-xs">Users</TabsTrigger>
            <TabsTrigger value="config" className="rounded-full px-8 font-black uppercase tracking-widest text-xs">Global Config</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-full px-8 font-black uppercase tracking-widest text-xs">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Economy Status</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <p className="text-3xl font-black uppercase italic">{config?.economyEnabled ? 'Active' : 'Paused'}</p>
                   </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Maintenance</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <p className="text-3xl font-black uppercase italic text-blue-500">{config?.maintenanceMode ? 'ON' : 'OFF'}</p>
                   </CardContent>
                </Card>
             </div>
             
             <Card>
                <CardHeader>
                   <CardTitle className="font-headline uppercase italic">System Health</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center bg-muted/20 rounded-xl">
                   <div className="text-center opacity-30">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-black uppercase tracking-widest text-xs">Real-time Analytics Syncing...</p>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
             <Card className="border-none shadow-xl rounded-[2.5rem]">
                <CardHeader>
                   <CardTitle className="font-headline text-2xl uppercase italic">User Authority Panel</CardTitle>
                   <CardDescription>Search for any user to adjust coins, diamonds, or roles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex gap-4">
                      <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                         <Input 
                            placeholder="Search by username..." 
                            className="pl-10 h-12 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                         />
                      </div>
                      <Button onClick={handleSearchUsers} className="h-12 rounded-xl px-8" disabled={isSearching}>
                         {isSearching ? <Loader className="animate-spin" /> : 'Find User'}
                      </Button>
                   </div>

                   <div className="space-y-4">
                      {foundUsers.map((u) => (
                        <div key={u.id} className="p-6 bg-secondary/20 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6">
                           <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                              <AvatarImage src={u.avatarUrl} />
                              <AvatarFallback>{u.username?.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div className="flex-1 text-center md:text-left">
                              <p className="text-xl font-black uppercase italic">{u.username}</p>
                              <p className="text-xs text-muted-foreground font-mono">ID: {u.id}</p>
                              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                 <Badge className="bg-primary/20 text-primary border-none">Coins: {u.wallet?.coins || 0}</Badge>
                                 <Badge className="bg-blue-500/20 text-blue-500 border-none">Diamonds: {u.wallet?.diamonds || 0}</Badge>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'coins', 1000)} className="rounded-full">+1k Coins</Button>
                              <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'coins', -1000)} className="rounded-full text-destructive">-1k Coins</Button>
                              <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'diamonds', 100)} className="rounded-full">+100 Dia</Button>
                              <Button variant="outline" size="sm" onClick={() => adjustBalance(u.id, 'diamonds', -100)} className="rounded-full text-destructive">-100 Dia</Button>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[2.5rem] border-none shadow-xl">
                   <CardHeader>
                      <CardTitle className="font-headline uppercase italic">System Toggles</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                         <div>
                            <Label className="text-lg font-black uppercase italic">Economy Engine</Label>
                            <p className="text-xs text-muted-foreground">Disable all coin spending/earning.</p>
                         </div>
                         <Switch 
                            checked={config?.economyEnabled ?? true} 
                            onCheckedChange={(val) => toggleGlobalConfig('economyEnabled', val)}
                         />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                         <div>
                            <Label className="text-lg font-black uppercase italic">Maintenance Mode</Label>
                            <p className="text-xs text-muted-foreground">Only Admins/Officials can login.</p>
                         </div>
                         <Switch 
                            checked={config?.maintenanceMode ?? false} 
                            onCheckedChange={(val) => toggleGlobalConfig('maintenanceMode', val)}
                         />
                      </div>
                   </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl">
                   <CardHeader>
                      <CardTitle className="font-headline uppercase italic text-destructive flex items-center gap-2">
                         <AlertTriangle className="h-5 w-5" /> Danger Zone
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <Button variant="destructive" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest italic">Clear Global Cache</Button>
                      <Button variant="destructive" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest italic">Re-index Leaderboard</Button>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="logs">
             <Card className="border-none shadow-xl rounded-[2.5rem]">
                <CardHeader>
                   <CardTitle className="font-headline text-2xl uppercase italic flex items-center gap-2">
                      <ClipboardList className="h-6 w-6" /> System Audit Logs
                   </CardTitle>
                   <CardDescription>Comprehensive trail of all administrative actions.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-2">
                      {logs?.map((log: any) => (
                        <div key={log.id} className="p-4 bg-muted/10 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-muted/20 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black italic">
                                 {log.adminName?.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-sm font-black uppercase italic">{log.action}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                    Admin: {log.adminName} • Target ID: {log.targetId?.substring(0, 8)}...
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-mono text-muted-foreground">
                                 {log.createdAt ? format(log.createdAt.toDate(), 'HH:mm:ss • MMM dd') : 'Syncing...'}
                              </p>
                              <Badge variant="outline" className="text-[8px] font-bold uppercase border-gray-200">Success</Badge>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}