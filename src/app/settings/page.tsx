'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  User,
  Shield,
  CreditCard,
  Gem,
  Star,
  Loader,
  Camera,
  LogOut,
  Pencil,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCoinPackages } from '@/lib/mock-data';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { EditProfileDialog } from '@/components/edit-profile-dialog';

export default function SettingsPage() {
  const auth = useAuth();
  const { user, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const coinPackages = getCoinPackages();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();

  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isUploading) {
      setLocalAvatarPreview(null);
    }
  }, [isUploading, userProfile?.avatarUrl]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Limit is 5MB." });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setLocalAvatarPreview(previewUrl);
      uploadProfilePicture(file);
    }
  };

  if (isUserLoading || isProfileLoading || !user) {
    return (
       <AppLayout>
          <div className="flex h-full w-full items-center justify-center py-20">
            <Loader className="h-10 w-10 animate-spin text-primary" />
          </div>
       </AppLayout>
    )
  }

  const displayName = userProfile?.username || user.displayName || 'User';
  const avatarUrl = localAvatarPreview || userProfile?.avatarUrl || user.photoURL || '';

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center space-x-6 bg-secondary/20 p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-2xl">
              <AvatarImage src={avatarUrl} alt={displayName + "'s Settings Avatar"} />
              <AvatarFallback className="text-3xl">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isUploading}
            >
              {isUploading ? <Loader className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold font-headline tracking-tight">
                {displayName}
              </h1>
              <EditProfileDialog profile={userProfile || { username: displayName, id: user.uid, avatarUrl }} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-2 tracking-widest opacity-60">ID: {user.uid.substring(0, 12).toUpperCase()}</p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
             <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 border border-primary/20 shadow-sm">
                <Gem className="h-5 w-5 text-primary" />
                <span className="font-bold text-xl text-primary">
                  {(userProfile?.wallet?.coins || 0).toLocaleString()}
                </span>
             </div>
             <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Your Current Balance</p>
          </div>
        </header>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50 rounded-full p-1 h-12 mb-8">
            <TabsTrigger value="account" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="mr-2 h-4 w-4" /> Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="mr-2 h-4 w-4" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="mr-2 h-4 w-4" /> Privacy
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="mr-2 h-4 w-4" /> Billing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <div className="grid gap-6">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Identity Verification</CardTitle>
                  <CardDescription>
                    Your permanent profile details. Only name and bio are editable.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 opacity-60">
                        <Label className="text-xs uppercase font-bold tracking-widest">Country (Fixed)</Label>
                        <Input value={userProfile?.details?.hometown || 'India'} disabled className="bg-muted h-12 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2 opacity-60">
                        <Label className="text-xs uppercase font-bold tracking-widest">Gender (Fixed)</Label>
                        <Input value={userProfile?.details?.gender || 'Secret'} disabled className="bg-muted h-12 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                         <Pencil className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">Update Profile Details</p>
                        <p className="text-xs text-muted-foreground">Change your display name and personal biography.</p>
                      </div>
                    </div>
                    <EditProfileDialog profile={userProfile || { username: displayName, id: user.uid, avatarUrl }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-destructive/5 border border-destructive/10">
                <CardHeader>
                  <CardTitle className="font-headline text-destructive text-2xl flex items-center gap-2">
                     <LogOut className="h-6 w-6" /> Account Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full h-14 justify-between border-destructive/20 hover:bg-destructive text-destructive hover:text-white transition-all font-bold text-lg rounded-2xl" 
                    onClick={handleLogout}
                  >
                    <span>Sign Out of Ummy</span>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Recharge Center</CardTitle>
                <CardDescription>
                  Instant coin delivery. Get coins to send gifts and play games.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {coinPackages.map((pkg, index) => (
                  <Card
                    key={pkg.id}
                    className="relative flex flex-col items-center justify-center p-6 text-center transition-all hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-secondary/20 border-white/5 rounded-3xl"
                  >
                    {index === coinPackages.length - 1 && (
                      <div className="absolute -top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white uppercase shadow-lg">
                        <Star className="h-3 w-3 fill-white" /> Popular
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                      <Gem className="h-8 w-8" />
                      <span>{pkg.amount.toLocaleString()}</span>
                    </div>
                    {pkg.bonus && (
                      <p className="text-[10px] text-green-500 font-black uppercase mt-2 bg-green-500/10 px-2 py-0.5 rounded">
                         + {pkg.bonus.toLocaleString()} Extra
                      </p>
                    )}
                    <Button className="mt-6 w-full rounded-full h-11 font-bold shadow-lg">₹{pkg.price.toFixed(0)}</Button>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
      />
    </AppLayout>
  );
}
