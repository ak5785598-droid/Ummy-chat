'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Gem,
  Loader,
  Camera,
  LogOut,
  ChevronRight,
  Trophy,
  Globe,
  Settings as SettingsIcon,
  Wallet,
  Shirt,
  Sparkles,
  MessageSquare,
  Store,
  Zap
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  useAuth, 
  useUser, 
  useFirestore, 
  useUserProfile, 
  useProfilePictureUpload, 
  setDocumentNonBlocking 
} from '@/firebase';
import { signOut } from 'firebase/auth';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Image from 'next/image';
import { doc, increment, serverTimestamp } from 'firebase/firestore';

export default function SettingsPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();

  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isUploading) setLocalAvatarPreview(null);
  }, [isUploading]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleTestTopUp = () => {
    if (!firestore || !user || !userProfile) return;
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    const identitySync = {
      username: userProfile.username || 'User',
      avatarUrl: userProfile.avatarUrl || '',
    };

    // Use robust nested object structure for recursive setDoc merge
    const updateData = { 
      wallet: {
        coins: increment(1000),
      },
      ...identitySync,
      updatedAt: serverTimestamp() 
    };
    
    setDocumentNonBlocking(profileRef, updateData, { merge: true });
    setDocumentNonBlocking(userRef, updateData, { merge: true });
    toast({ title: 'Top-up Successful!', description: '1,000 Testing Coins added.' });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return;
      setLocalAvatarPreview(URL.createObjectURL(file));
      uploadProfilePicture(file);
    }
  };

  if (isUserLoading || isProfileLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin" /></div></AppLayout>;
  if (!user) return null;

  const MenuItem = ({ icon: Icon, label, href, extra, iconColor }: any) => (
    <div className="flex items-center justify-between py-4 border-b last:border-0 px-6 hover:bg-gray-50/50 cursor-pointer" onClick={() => href && router.push(href)}>
      <div className="flex items-center gap-4">
        <Icon className={cn("h-6 w-6", iconColor || "text-primary")} />
        <span className="font-bold text-gray-800 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra && <span className="text-xs text-muted-foreground">{extra}</span>}
        <ChevronRight className="h-4 w-4 opacity-40" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6 pb-24 bg-gray-50/50 min-h-screen">
        <div className="relative bg-white pb-6 rounded-b-[2rem] shadow-sm">
          <div className="relative h-44 w-full">
            <Image src="https://images.unsplash.com/photo-1501785888041-af3ef285b470" alt="Banner" fill className="object-cover" />
          </div>
          <div className="px-6 -mt-10 flex items-end gap-4 relative z-10">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={localAvatarPreview || userProfile?.avatarUrl} />
              <AvatarFallback>{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                 {isUploading ? <Loader className="animate-spin text-white" /> : <Camera className="text-white h-6 w-6" />}
              </div>
            </Avatar>
            <div className="pb-2">
               <h1 className="text-2xl font-bold">{userProfile?.username}</h1>
               <EditProfileDialog profile={userProfile} />
            </div>
          </div>
        </div>

        <div className="px-4 space-y-3">
          <h2 className="text-lg font-bold px-2">Wallet & Assets</h2>
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <MenuItem icon={Gem} label="Coins" extra={(userProfile?.wallet?.coins || 0).toLocaleString()} />
            <div className="px-6 py-2">
               <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed" onClick={handleTestTopUp}>
                 <Zap className="h-3.5 w-3.5 mr-1.5" /> Claim 1,000 Beta Coins
               </Button>
            </div>
            <MenuItem icon={Sparkles} label="Diamonds" extra={(userProfile?.wallet?.diamonds || 0).toLocaleString()} iconColor="text-blue-500" />
            <MenuItem icon={Store} label="Store" href="/store" iconColor="text-orange-500" />
            <MenuItem icon={Trophy} label="Level" href="/leaderboard" iconColor="text-yellow-500" />
            <MenuItem icon={Shirt} label="My Items" href="/store" iconColor="text-cyan-500" />
          </Card>
        </div>

        <div className="px-4 space-y-3">
          <h2 className="text-lg font-bold px-2">Others</h2>
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <MenuItem icon={Globe} label="Language" extra="English" iconColor="text-gray-400" />
            <MenuItem icon={MessageSquare} label="Feedback" href="/help-center" iconColor="text-gray-400" />
            <MenuItem icon={SettingsIcon} label="Settings" iconColor="text-gray-400" />
          </Card>
        </div>

        <div className="px-8 pt-4">
           <Button variant="ghost" className="w-full text-destructive" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
