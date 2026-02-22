'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, useUser, useUserProfile } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Settings, Shield, Zap, Gem, Globe, Layout, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const { toast } = useToast();
  
  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

  const configRef = doc(firestore!, 'appConfig', 'global');
  const { data: config, isLoading: isConfigLoading } = useDoc(configRef);

  const [economyEnabled, setEconomyEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setEconomyEnabled(config.economyEnabled ?? true);
      setMaintenanceMode(config.maintenanceMode ?? false);
      setBannerUrl(config.activeBanners?.[0]?.imageUrl ?? '');
      setBannerLink(config.activeBanners?.[0]?.link ?? '');
    }
  }, [config]);

  if (isProfileLoading || isConfigLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin" /></div></AppLayout>;

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Unauthorized Access</h1>
          <p className="text-muted-foreground">Only the App Owner/Official can access this panel.</p>
        </div>
      </AppLayout>
    );
  }

  const handleSaveConfig = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(configRef, { 
        economyEnabled, 
        maintenanceMode,
        activeBanners: [
          { imageUrl: bannerUrl, link: bannerLink, title: 'Official Event' }
        ]
      }, { merge: true });
      toast({ title: 'Config Updated', description: 'Application settings have been updated.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update config.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold font-headline">App Official Control Panel</h1>
            <p className="text-muted-foreground">Manage economy, store, and global application states.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /> Global States</CardTitle>
              <CardDescription>Toggle application-wide features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Economy Control</Label>
                  <p className="text-xs text-muted-foreground">Enable/Disable virtual coin ecosystem.</p>
                </div>
                <Switch checked={economyEnabled} onCheckedChange={setEconomyEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Restrict app access to Officials only.</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <Button onClick={handleSaveConfig} className="w-full" disabled={isSaving}>
                {isSaving ? <Loader className="animate-spin" /> : 'Save Global Config'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5 text-blue-500" /> Banner Management</CardTitle>
              <CardDescription>Control the 1536x681 explore banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Banner Image URL</Label>
                <Input placeholder="https://..." value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link Target</Label>
                <Input placeholder="/rooms" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSaveConfig} disabled={isSaving}>Update Official Banner</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gem className="h-5 w-5 text-primary" /> Store Management</CardTitle>
              <CardDescription>Add frames, bubbles, and entries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">Add New Item to Store</Button>
              <Button variant="outline" className="w-full">Update Coin Rates</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}