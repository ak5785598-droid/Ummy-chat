'use client';

import { useState, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  User,
  Shield,
  CreditCard,
  Gem,
  Star,
  LifeBuoy,
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

  const handleLogout = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        router.push('/login');
        toast({
          title: 'Logged Out',
          description: 'You have been successfully logged out.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Logout Failed',
            description: error.message,
        });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Limit is 5MB." });
        return;
      }
      uploadProfilePicture(file);
    }
  };

  if (isUserLoading || isProfileLoading || !user) {
    return (
       <AppLayout>
          <div className="flex h-full w-full items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
       </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center space-x-4">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
              <AvatarFallback className="text-2xl">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isUploading}
            >
              {isUploading ? <Loader className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-headline">
                {user.displayName}
              </h1>
              <EditProfileDialog profile={userProfile || { username: user.displayName, id: user.uid }} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">ID: {user.uid.substring(0, 8)}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 border border-white/5 shadow-sm">
            <Gem className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">
              {(userProfile?.coins || 0).toLocaleString()}
            </span>
          </div>
        </header>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50 rounded-full p-1 h-12">
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
          
          <TabsContent value="account" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Identity Verification</CardTitle>
                <CardDescription>
                  Your profile details. Username and bio can be edited.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Country (Fixed)</Label>
                      <Input value={userProfile?.details?.hometown || 'India'} disabled className="bg-muted" />
                   </div>
                   <div className="space-y-2">
                      <Label>Gender (Fixed)</Label>
                      <Input value={userProfile?.details?.gender || 'Secret'} disabled className="bg-muted" />
                   </div>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pencil className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-bold text-sm">Need to update your details?</p>
                      <p className="text-xs text-muted-foreground">Change your name or bio using the pencil icon above.</p>
                    </div>
                  </div>
                  <EditProfileDialog profile={userProfile || { username: user.displayName, id: user.uid }} />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-destructive text-xl flex items-center gap-2">
                   Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full h-12 justify-between border-destructive/20 hover:bg-destructive/5" 
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-destructive" />
                    <span className="font-bold">Log Out of Ummy</span>
                  </div>
                  <span className="text-xs opacity-40">Safe Exit</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Buy Coins</CardTitle>
                <CardDescription>
                  Purchase coins to send gifts and play premium games.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {coinPackages.map((pkg, index) => (
                  <Card
                    key={pkg.id}
                    className="relative flex flex-col items-center justify-center p-6 text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-secondary/20 border-white/5"
                  >
                    {index === coinPackages.length - 1 && (
                      <div className="absolute -top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-[10px] font-bold text-destructive-foreground uppercase">
                        <Star className="h-3 w-3" /> Best Value
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                      <Gem className="h-6 w-6" />
                      <span>{pkg.amount.toLocaleString()}</span>
                    </div>
                    {pkg.bonus && (
                      <p className="text-[10px] text-green-500 font-bold uppercase mt-1">
                         + {pkg.bonus.toLocaleString()} Bonus
                      </p>
                    )}
                    <Button className="mt-4 w-full rounded-full shadow-md">₹{pkg.price.toFixed(0)}</Button>
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
