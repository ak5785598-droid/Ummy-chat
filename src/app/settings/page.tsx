'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Gem,
  Star,
  Loader,
  Camera,
  LogOut,
  ChevronRight,
  Trophy,
  Globe,
  Mail,
  Settings as SettingsIcon,
  Wallet,
  Shirt,
  Sparkles,
  ShoppingCart,
  Pencil,
  MessageSquare,
  BadgeInfo,
  Store,
  Zap
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Me Center / Settings Page
 * Redesigned to match the provided specifications.
 */
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
  const [isToppingUp, setIsToppingUp] = useState(false);

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

  const handleTestTopUp = async () => {
    if (!firestore || !user || isToppingUp) return;
    setIsToppingUp(true);
    try {
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      
      const updateData = {
        'wallet.coins': increment(1000),
        updatedAt: serverTimestamp()
      };
      
      await Promise.all([
        updateDoc(profileRef, updateData),
        updateDoc(userRef, updateData)
      ]);

      toast({ 
        title: 'Frequency Boosted!', 
        description: '1,000 Beta Coins have been added to your identity.' 
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Top-up failed' });
    } finally {
      setIsToppingUp(false);
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

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout>
        <div className="flex h-full w-full flex-col items-center justify-center py-20 space-y-4">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Syncing Identity...</p>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const displayName = userProfile?.username || user.displayName || 'User';
  const avatarUrl = localAvatarPreview || userProfile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/200`;

  const MenuItem = ({ icon: Icon, label, href, extra, iconColor }: { icon: any, label: string, href?: string, extra?: React.ReactNode, iconColor?: string }) => {
    const content = (
      <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 group cursor-pointer px-6 hover:bg-gray-50/50 transition-all">
        <div className="flex items-center gap-4">
          <Icon className={cn("h-6 w-6", iconColor || "text-primary")} />
          <span className="font-bold text-gray-800 text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {extra && <span className="text-xs text-muted-foreground">{extra}</span>}
          <ChevronRight className="h-4 w-4 opacity-40 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    );

    if (href) {
      return <Link href={href} className="block">{content}</Link>;
    }
    return content;
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-700 bg-gray-50/50 min-h-screen">
        
        {/* Header Section */}
        <div className="relative bg-white pb-6 rounded-b-[2rem] shadow-sm overflow-hidden">
          <div className="relative h-44 w-full">
            <Image 
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470" 
              alt="Profile banner background" 
              fill 
              className="object-cover"
              priority
            />
          </div>
          
          <div className="px-6 -mt-10 flex flex-row items-end gap-4 relative z-10">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white bg-primary shadow-lg">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-3xl text-white font-black">{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                disabled={isUploading}
              >
                {isUploading ? <Loader className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
            </div>
            <div className="pb-2">
               <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
               <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary text-primary">Lv. {userProfile?.level?.rich || 1}</Badge>
                  <EditProfileDialog profile={userProfile} />
               </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 rounded-2xl p-6 text-center shadow-sm border border-yellow-100">
              <span className="text-2xl font-black text-gray-800">{userProfile?.stats?.followers || 0}</span>
              <p className="text-xs text-gray-500 mt-1">Followers</p>
            </div>
            <div className="bg-pink-50 rounded-2xl p-6 text-center shadow-sm border border-pink-100">
              <span className="text-2xl font-black text-gray-800">{userProfile?.stats?.fans || 0}</span>
              <p className="text-xs text-gray-500 mt-1">Total Fans</p>
            </div>
          </div>
        </div>

        {/* Wallet & Assets Section */}
        <div className="px-4 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 px-2">Wallet & Assets</h2>
          <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <MenuItem icon={Gem} label="Coins" extra={userProfile?.wallet?.coins?.toLocaleString() || '0'} />
            
            <div className="px-6 py-2">
               <Button 
                 variant="outline" 
                 size="sm" 
                 disabled={isToppingUp}
                 className="w-full rounded-xl border-dashed border-primary/40 text-primary font-bold h-9 bg-primary/5 hover:bg-primary/10 transition-all"
                 onClick={handleTestTopUp}
               >
                 {isToppingUp ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 mr-1.5" />}
                 Claim 1,000 Beta Coins
               </Button>
            </div>

            <MenuItem icon={Sparkles} label="Diamonds" extra={userProfile?.wallet?.diamonds?.toLocaleString() || '0'} iconColor="text-blue-500" />
            <MenuItem icon={Wallet} label="Wallet" href="/store" iconColor="text-purple-500" />
            <MenuItem icon={Store} label="Store" href="/store" iconColor="text-orange-500" />
            <MenuItem icon={Trophy} label={`Level (Lv.${userProfile?.level?.rich || 1})`} href="/leaderboard" iconColor="text-yellow-500" />
            <MenuItem icon={Shirt} label="My Items" href="/store" iconColor="text-cyan-500" />
          </Card>
        </div>

        {/* Others Section */}
        <div className="px-4 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 px-2">Others</h2>
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <MenuItem icon={Globe} label="Language" extra="English" iconColor="text-gray-400" />
            <MenuItem icon={MessageSquare} label="Feedback" href="/help-center" iconColor="text-gray-400" />
            <MenuItem icon={SettingsIcon} label="Settings" iconColor="text-gray-400" />
          </Card>
        </div>

        {/* Logout */}
        <div className="px-8 pt-4">
           <Button 
            variant="ghost" 
            className="w-full text-destructive hover:bg-destructive/10 rounded-2xl h-14 font-bold"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

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
