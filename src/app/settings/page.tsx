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
  Pencil
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
 * High-fidelity redesign matching the community aesthetic.
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
      <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-0 group cursor-pointer px-6 hover:bg-gray-50/50 transition-all">
        <div className="flex items-center gap-4">
          <div className={cn("p-2.5 rounded-2xl bg-muted/20", iconColor || "text-gray-400")}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="font-black text-gray-800 text-sm uppercase italic tracking-tight">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {extra}
          <ChevronRight className="h-5 w-5 opacity-40 group-hover:translate-x-1 transition-transform" />
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
      <div className="max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-700">
        
        {/* Top Profile Header Area */}
        <div className="relative bg-white pb-8 rounded-b-[3rem] shadow-xl overflow-hidden">
          <div className="relative h-48 w-full">
            <Image 
              src="https://picsum.photos/seed/me-banner/1200/400" 
              alt="Profile banner background" 
              fill 
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
          
          <div className="px-8 -mt-12 flex flex-row items-end gap-6 relative z-10">
            <div className="relative group">
              <div className="p-1.5 rounded-full bg-white shadow-2xl">
                <Avatar className="h-28 w-28 border-4 border-white bg-orange-600 shadow-inner">
                  <AvatarImage src={avatarUrl} alt={`${displayName}'s account avatar`} />
                  <AvatarFallback className="text-4xl text-white font-black italic">{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-1.5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                disabled={isUploading}
                aria-label="Change profile picture"
              >
                {isUploading ? <Loader className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
              </button>
            </div>
            
            <div className="pb-4 space-y-2">
               <div className="flex items-center gap-2">
                 <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">{displayName}</h1>
                 <EditProfileDialog profile={userProfile} />
               </div>
               <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-none px-4 rounded-full text-[10px] font-black uppercase tracking-widest italic">Lv.Rich {userProfile?.level?.rich || 1}</Badge>
                  <Badge className="bg-accent/20 text-accent border-none px-4 rounded-full text-[10px] font-black uppercase tracking-widest italic">Lv.Charm {userProfile?.level?.charm || 1}</Badge>
                  <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">ID: {user.uid.substring(0, 8)}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="px-4 space-y-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 px-2">
            <Sparkles className="h-4 w-4 text-primary" /> Performance Pulse
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-8 text-center border-none shadow-sm relative overflow-hidden group">
              <span className="text-4xl font-black text-primary relative z-10">{userProfile?.stats?.followers || 0}</span>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 relative z-10">Followers</p>
              <div className="absolute -bottom-4 -right-4 text-primary/5 rotate-12 group-hover:scale-110 transition-transform"><User className="h-20 w-20" /></div>
            </div>
            <div className="bg-white rounded-3xl p-8 text-center border-none shadow-sm relative overflow-hidden group">
              <span className="text-4xl font-black text-accent relative z-10">{userProfile?.stats?.fans || 0}</span>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 relative z-10">Total Fans</p>
              <div className="absolute -bottom-4 -right-4 text-accent/5 rotate-12 group-hover:scale-110 transition-transform"><Sparkles className="h-20 w-20" /></div>
            </div>
          </div>
        </div>

        {/* Wallet & Assets */}
        <div className="px-4 space-y-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 px-2">
            <Wallet className="h-4 w-4 text-primary" /> Global Assets
          </h2>
          <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
            <div className="flex items-center justify-between p-6 border-b border-gray-50 group hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Gem className="h-8 w-8" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-gray-800 text-sm uppercase italic">Coins</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Main Currency</span>
                </div>
              </div>
              <span className="font-black text-3xl italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-6 group hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-100/50 text-blue-500">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-gray-800 text-sm uppercase italic">Diamonds</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Premium Essence</span>
                </div>
              </div>
              <span className="font-black text-3xl italic">{(userProfile?.wallet?.diamonds || 0).toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Main Menu List */}
        <div className="px-4">
          <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
            <MenuItem icon={ShoppingCart} label="Ummy Boutique" href="/store" iconColor="text-cyan-500" />
            <MenuItem 
              icon={Trophy} 
              label="Leaderboard" 
              href="/leaderboard" 
              iconColor="text-orange-500" 
              extra={
                <div className="flex items-center gap-1 bg-amber-800/10 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black italic border border-amber-700/10">
                   <Star className="h-3 w-3 fill-current" />
                   <span>Top 100</span>
                </div>
              }
            />
            <MenuItem icon={Shirt} label="My Inventory" href="/store" iconColor="text-purple-500" />
          </Card>
        </div>

        {/* Settings Group */}
        <div className="px-4">
          <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
            <MenuItem 
              icon={Globe} 
              label="Language" 
              iconColor="text-gray-400" 
              extra={<span className="text-xs font-black uppercase text-muted-foreground/60 italic">English</span>}
            />
            <MenuItem icon={Mail} label="Help & Feedback" href="/help-center" iconColor="text-gray-400" />
            <MenuItem icon={SettingsIcon} label="Account Settings" iconColor="text-gray-400" />
          </Card>
        </div>

        {/* Logout Button */}
        <div className="px-8 pt-4">
           <Button 
            variant="ghost" 
            className="w-full text-destructive hover:bg-destructive/10 rounded-2xl h-14 font-black uppercase tracking-widest text-xs italic"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out from Frequency
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
