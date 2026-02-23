'use client';

import { useRef, useState, useEffect } from 'react';
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
  Briefcase,
  Sparkles,
  Layout
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
  const avatarUrl = localAvatarPreview || userProfile?.avatarUrl || user.photoURL || `https://picsum.photos/seed/${user.uid}/200`;

  const MenuItem = ({ icon: Icon, label, href, extra, iconColor }: { icon: any, label: string, href?: string, extra?: React.ReactNode, iconColor?: string }) => {
    const content = (
      <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group cursor-pointer">
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-xl bg-gray-50", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-semibold text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {extra}
          <ChevronRight className="h-4 w-4" />
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
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        
        {/* Top Profile Header Area */}
        <div className="relative">
          <div className="relative h-48 w-full rounded-b-[2rem] overflow-hidden">
            <Image 
              src="https://picsum.photos/seed/profile-banner/1200/400" 
              alt="Profile banner" 
              fill 
              className="object-cover"
              priority
            />
          </div>
          
          <div className="px-6 -mt-12 flex flex-col items-start relative z-10">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-4 ring-primary/5">
                <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isUploading}
                aria-label="Change profile picture"
              >
                {isUploading ? <Loader className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
            </div>
            
            <div className="mt-4 space-y-2">
               <div className="flex items-center gap-2">
                 <h1 className="text-3xl font-black font-headline text-gray-900 tracking-tight">{displayName}</h1>
                 <EditProfileDialog profile={userProfile} />
               </div>
               <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-600 border-none px-3 rounded-full text-[10px] font-bold">Lv.Rich {userProfile?.level?.rich || 1}</Badge>
                  <Badge className="bg-pink-100 text-pink-600 border-none px-3 rounded-full text-[10px] font-bold">Lv.Charm {userProfile?.level?.charm || 1}</Badge>
                  <span className="text-[10px] text-muted-foreground font-mono bg-gray-100 px-2 rounded py-0.5">ID: {user.uid.substring(0, 8)}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="px-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Performance Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-yellow-50/30">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-yellow-600">{userProfile?.stats?.followers || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Followers</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-pink-50/30">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-pink-600">{userProfile?.stats?.fans || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total Fans</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Wallet & Assets */}
        <div className="px-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary fill-primary" /> Wallet & Assets
          </h2>
          <Card className="border-none shadow-sm bg-white overflow-hidden divide-y divide-gray-50">
            <div className="flex items-center justify-between p-4 group cursor-pointer hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-50 text-yellow-500">
                  <Gem className="h-5 w-5" />
                </div>
                <span className="font-semibold text-gray-800">Coins</span>
              </div>
              <span className="font-black text-gray-900">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 group cursor-pointer hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="font-semibold text-gray-800">Diamonds</span>
              </div>
              <span className="font-black text-gray-900">{(userProfile?.wallet?.diamonds || 0).toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Main Menu List */}
        <div className="px-6 space-y-4">
          <Card className="border-none shadow-sm bg-white px-6">
            <MenuItem icon={Wallet} label="Wallet" href="/settings" iconColor="text-orange-500" />
            <MenuItem icon={ShoppingBag} label="Store" href="/store" iconColor="text-cyan-500" />
            <MenuItem 
              icon={Star} 
              label="Level" 
              href="/settings" 
              iconColor="text-yellow-500" 
              extra={<Badge className="bg-orange-700 text-white border-none rounded-full px-2 text-[8px] font-black h-4">Lv.3</Badge>}
            />
            <MenuItem icon={Layout} label="My Items" href="/store" iconColor="text-purple-500" />
          </Card>
        </div>

        {/* Settings Group */}
        <div className="px-6 space-y-4">
          <Card className="border-none shadow-sm bg-white px-6">
            <MenuItem 
              icon={Globe} 
              label="Language" 
              iconColor="text-blue-500" 
              extra={<span className="text-xs text-gray-400">English</span>}
            />
            <MenuItem icon={MessageSquare} label="Feedback" iconColor="text-green-500" />
            <MenuItem icon={SettingsIcon} label="Settings" iconColor="text-slate-500" />
          </Card>
        </div>

        {/* Logout Button */}
        <div className="px-6 pt-4">
           <Button 
            variant="ghost" 
            className="w-full text-destructive hover:bg-destructive/10 rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
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

import { cn } from '@/lib/utils';