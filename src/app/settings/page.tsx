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
      // Hard redirect to clear any local state frequencies
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
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 opacity-20">
        <SettingsIcon className="h-12 w-12" />
        <p className="font-black uppercase italic">Settings Protocol Reset</p>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
