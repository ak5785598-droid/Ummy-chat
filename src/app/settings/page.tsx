'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ChevronRight,
  ShoppingBag,
  Trophy,
  Globe,
  MessageSquare,
  Settings as SettingsIcon,
  Wallet,
  Shirt,
  Sparkles,
  Layout,
  Mail,
  ShoppingCart
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

/**
 * Me Center / Settings Page
 * High-fidelity redesign matching the user-provided screenshot.
 */
export default function SettingsPage() {
  const auth = useAuth();
  const { user, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
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

  if (!user) {
    return null;
  }

  const displayName = userProfile?.username || user.displayName || 'User';
  const avatarUrl = localAvatarPreview || userProfile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/200`;

  const MenuItem = ({ icon: Icon, label, href, extra, iconColor }: { icon: any, label: string, href?: string, extra?: React.ReactNode, iconColor?: string }) => {
    const content = (
      <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 group cursor-pointer px-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-xl", iconColor || "text-gray-400")}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="font-bold text-gray-800 text-base">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {extra}
          <ChevronRight className="h-5 w-5 opacity-40" />
        </div>
      </div>
    );

    if (href) {
      return <Link href={href}>{content}</Link>;
    }
    return content;
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-4 pb-24 bg-gray-50/30">
        
        {/* Top Profile Header Area */}
        <div className="relative bg-white pb-6 rounded-b-3xl shadow-sm">
          <div className="relative h-44 w-full overflow-hidden">
            <Image 
              src="https://picsum.photos/seed/me-banner/1200/400" 
              alt="Profile banner background" 
              fill 
              className="object-cover"
              priority
              data-ai-hint="landscape building"
            />
          </div>
          
          <div className="px-6 -mt-10 flex flex-row items-end gap-4 relative z-10">
            <div className="relative group">
              <div className="p-1 rounded-full bg-white shadow-xl">
                <Avatar className="h-24 w-24 border-4 border-white bg-orange-600">
                  <AvatarImage src={avatarUrl} alt={`${displayName}'s account avatar`} />
                  <AvatarFallback className="text-3xl text-white">{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isUploading}
              >
                {isUploading ? <Loader className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
            </div>
            
            <div className="pb-2 space-y-1">
               <div className="flex items-center gap-2">
                 <h1 className="text-2xl font-black text-gray-900 tracking-tight">{displayName}</h1>
                 <EditProfileDialog profile={userProfile} />
               </div>
               <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-yellow-100/50 text-yellow-600 border-none px-3 rounded-full text-[10px] font-bold">Lv.Rich {userProfile?.level?.rich || 1}</Badge>
                  <Badge className="bg-pink-100/50 text-pink-600 border-none px-3 rounded-full text-[10px] font-bold">Lv.Charm {userProfile?.level?.charm || 1}</Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {user.uid.substring(0, 8)}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="px-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 px-2">
            <Sparkles className="h-4 w-4 text-yellow-400" /> Performance Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50/50 rounded-2xl p-6 text-center border border-yellow-100/50">
              <span className="text-3xl font-black text-yellow-600">{userProfile?.stats?.followers || 0}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Followers</p>
            </div>
            <div className="bg-pink-50/50 rounded-2xl p-6 text-center border border-pink-100/50">
              <span className="text-3xl font-black text-pink-600">{userProfile?.stats?.fans || 0}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Total Fans</p>
            </div>
          </div>
        </div>

        {/* Wallet & Assets */}
        <div className="px-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 px-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Wallet & Assets
          </h2>
          <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-50 text-yellow-500">
                  <Gem className="h-6 w-6" />
                </div>
                <span className="font-bold text-gray-700 text-sm">Coins</span>
              </div>
              <span className="font-black text-gray-900">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="font-bold text-gray-700 text-sm">Diamonds</span>
              </div>
              <span className="font-black text-gray-900">{(userProfile?.wallet?.diamonds || 0).toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Main Menu List */}
        <div className="px-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <MenuItem icon={Wallet} label="Wallet" href="/settings" iconColor="text-orange-500" />
            <MenuItem icon={ShoppingCart} label="Store" href="/store" iconColor="text-cyan-400" />
            <MenuItem 
              icon={Trophy} 
              label="Level" 
              href="/leaderboard" 
              iconColor="text-orange-400" 
              extra={
                <div className="flex items-center gap-1 bg-amber-800/20 text-amber-900 px-3 py-1 rounded-full text-[10px] font-black">
                   <Star className="h-3 w-3 fill-current" />
                   <span>Lv.3</span>
                </div>
              }
            />
            <MenuItem icon={Shirt} label="My Items" href="/store" iconColor="text-purple-500" />
          </Card>
        </div>

        {/* Settings Group */}
        <div className="px-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <MenuItem 
              icon={Globe} 
              label="Language" 
              iconColor="text-gray-400" 
              extra={<span className="text-sm text-gray-400">English</span>}
            />
            <MenuItem icon={Mail} label="Feedback" iconColor="text-gray-400" />
            <MenuItem icon={SettingsIcon} label="Settings" iconColor="text-gray-400" />
          </Card>
        </div>

        {/* Logout Button */}
        <div className="px-6 pt-4">
           <Button 
            variant="ghost" 
            className="w-full text-red-500 hover:bg-red-50 rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
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
