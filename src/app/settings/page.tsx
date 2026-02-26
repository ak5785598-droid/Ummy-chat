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
  Shirt,
  Sparkles,
  MessageSquare,
  Store,
  ChevronLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  useAuth, 
  useUser, 
} from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { signOut } from 'firebase/auth';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Image from 'next/image';
import { GoldCoinIcon } from '@/components/icons';

const MenuItem = ({ icon: Icon, label, href, extra, iconColor, onClick }: any) => {
  const router = useRouter();
  return (
    <div 
      className="flex items-center justify-between py-4 border-b last:border-0 px-6 hover:bg-gray-50/50 cursor-pointer transition-colors" 
      onClick={() => {
        if (onClick) onClick();
        else if (href) router.push(href);
      }}
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-xl bg-opacity-10", iconColor?.replace('text-', 'bg-') || "bg-primary")}>
          <Icon className={cn("h-5 w-5", iconColor || "text-primary")} />
        </div>
        <span className="font-bold text-gray-800 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra && <span className="text-xs font-black text-muted-foreground italic">{extra}</span>}
        <ChevronRight className="h-4 w-4 opacity-40" />
      </div>
    </div>
  );
};

/**
 * Settings Page - Standard Production Edition.
 * Features robust navigation and elite identity management.
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
    if (!isUploading) setLocalAvatarPreview(null);
  }, [isUploading]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // Hard redirect to clear any auth state frequencies
      window.location.href = '/login';
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: e.message });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Limit is 5MB.' });
        return;
      }
      setLocalAvatarPreview(URL.createObjectURL(file));
      uploadProfilePicture(file);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6 pb-24 bg-gray-50/50 min-h-screen animate-in fade-in duration-700">
        <div className="flex items-center px-4 pt-4">
           <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all">
              <ChevronLeft className="h-5 w-5" />
           </button>
        </div>

        <div className="relative bg-white pb-6 rounded-b-[3rem] shadow-sm overflow-hidden">
          <div className="relative h-44 w-full bg-gradient-to-br from-primary/20 to-white">
            <Image src="https://images.unsplash.com/photo-1501785888041-af3ef285b470" alt="Banner" fill className="object-cover opacity-40" />
          </div>
          <div className="px-6 -mt-12 flex items-end gap-4 relative z-10">
            <div className="relative group shrink-0">
              <Avatar className="h-28 w-28 border-4 border-white shadow-xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={localAvatarPreview || userProfile?.avatarUrl} />
                <AvatarFallback className="text-4xl font-black bg-slate-100">{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity backdrop-blur-sm">
                   {isUploading ? <Loader className="animate-spin text-white" /> : <Camera className="text-white h-6 w-6" />}
                </div>
              </Avatar>
            </div>
            <div className="pb-2 flex-1">
               <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">{userProfile?.username}</h1>
               <div className="mt-1">
                  <EditProfileDialog profile={userProfile} />
               </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 px-2">Vault & Assets</h2>
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <MenuItem icon={GoldCoinIcon} label="Gold Coins" extra={(userProfile?.wallet?.coins || 0).toLocaleString()} iconColor="text-yellow-500" href="/store" />
            <MenuItem icon={Sparkles} label="Blue Diamonds" extra={(userProfile?.wallet?.diamonds || 0).toLocaleString()} iconColor="text-blue-500" href="/store" />
            <MenuItem icon={Store} label="Ummy Boutique" href="/store" iconColor="text-orange-500" />
            <MenuItem icon={Trophy} label="Global Ranking" href="/leaderboard" iconColor="text-yellow-600" />
            <MenuItem icon={Shirt} label="My Assets" href="/store" iconColor="text-cyan-500" />
          </Card>
        </div>

        <div className="px-4 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 px-2">Identity & Privacy</h2>
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <MenuItem icon={Globe} label="Region Frequency" extra="India / Official" iconColor="text-gray-400" />
            <MenuItem icon={MessageSquare} label="Tribe Feedback" href="/help-center" iconColor="text-gray-400" />
            <MenuItem icon={SettingsIcon} label="Security Protocol" iconColor="text-gray-400" />
          </Card>
        </div>

        <div className="px-8 pt-4 pb-10 flex justify-center">
           <Button variant="ghost" className="text-red-500 hover:bg-red-50 font-black uppercase italic tracking-widest text-xs" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Exit Frequency
           </Button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
