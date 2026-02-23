'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams, useRouter } from 'next/navigation';
import { 
  Loader, 
  Camera, 
  Gem, 
  Trophy, 
  ChevronRight, 
  LogOut, 
  Globe, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Wallet, 
  Shirt, 
  Sparkles, 
  Store, 
  Zap,
  ChevronLeft
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useUserProfile, useProfilePictureUpload, useAuth, setDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/**
 * Redesigned Premium Profile Page.
 * Matches the layout of the Me Center/Settings page exactly as requested.
 */
export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) router.replace('/login');
  }, [currentUser, isAuthLoading, router]);

  useEffect(() => {
    if (!isUploading) setLocalAvatarPreview(null);
  }, [isUploading]);

  const isOwnProfile = currentUser?.uid === profileId;

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleTestTopUp = () => {
    if (!firestore || !currentUser || !profile) return;
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    const userRef = doc(firestore, 'users', currentUser.uid);
    
    const updateData = { 
      wallet: {
        coins: increment(1000),
      },
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

  if (isAuthLoading || (isProfileLoading && !profile)) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="animate-spin text-primary h-10 w-10" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Frequency...</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile && !isProfileLoading) {
    notFound();
    return null;
  }

  if (!profile || !currentUser) return null;

  const MenuItem = ({ icon: Icon, label, href, extra, iconColor, onClick }: any) => (
    <div 
      className="flex items-center justify-between py-4 border-b last:border-0 px-6 hover:bg-gray-50/50 cursor-pointer transition-colors" 
      onClick={() => {
        if (onClick) onClick();
        else if (href) router.push(href);
      }}
    >
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
      <div className="max-w-xl mx-auto space-y-6 pb-24 bg-gray-50/50 min-h-screen animate-in fade-in duration-700">
        {/* Header Navigation */}
        <div className="flex items-center px-4 pt-4">
           <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all">
              <ChevronLeft className="h-5 w-5" />
           </button>
        </div>

        {/* Top Profile Card */}
        <div className="relative bg-white pb-6 rounded-b-[2rem] shadow-sm overflow-hidden">
          <div className="relative h-44 w-full">
            <Image 
              src={profile.coverUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470"} 
              alt="Banner" 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="px-6 -mt-10 flex items-end gap-4 relative z-10">
            <div className="relative group shrink-0">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg cursor-pointer">
                <AvatarImage src={localAvatarPreview || profile.avatarUrl} />
                <AvatarFallback className="text-3xl font-black">{(profile.username || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                   {isUploading ? <Loader className="animate-spin text-white" /> : <Camera className="text-white h-6 w-6" />}
                </div>
              )}
            </div>
            <div className="pb-2 flex-1">
               <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                  {profile.tags?.includes('Admin') && <Sparkles className="h-4 w-4 text-primary" />}
               </div>
               <div className="flex items-center gap-2 mt-1">
                  {isOwnProfile ? (
                    <EditProfileDialog profile={profile} />
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-1">{profile.bio || 'Vibing on Ummy!'}</p>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Wallet & Assets Section */}
        <div className="px-4 space-y-3">
          <h2 className="text-lg font-bold px-2 font-headline">Wallet & Assets</h2>
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <MenuItem 
              icon={Gem} 
              label="Coins" 
              extra={(profile.wallet?.coins || 0).toLocaleString()} 
              href={isOwnProfile ? "/settings" : undefined}
            />
            
            {isOwnProfile && (
              <div className="px-6 py-2 bg-gray-50/30">
                 <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed border-2 hover:bg-primary/5" onClick={handleTestTopUp}>
                   <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" /> Claim 1,000 Beta Coins
                 </Button>
              </div>
            )}

            <MenuItem 
              icon={Sparkles} 
              label="Diamonds" 
              extra={(profile.wallet?.diamonds || 0).toLocaleString()} 
              iconColor="text-blue-500" 
            />
            <MenuItem 
              icon={Store} 
              label="Store" 
              href="/store" 
              iconColor="text-orange-500" 
            />
            <MenuItem 
              icon={Trophy} 
              label="Level" 
              href="/leaderboard" 
              extra={`Lv.${profile.level?.rich || 1}`}
              iconColor="text-yellow-500" 
            />
            <MenuItem 
              icon={Shirt} 
              label={isOwnProfile ? "My Items" : "Persona Boutique"} 
              href="/store" 
              iconColor="text-cyan-500" 
            />
          </Card>
        </div>

        {/* Others Section */}
        <div className="px-4 space-y-3">
          <h2 className="text-lg font-bold px-2 font-headline">Others</h2>
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <MenuItem icon={Globe} label="Language" extra="English" iconColor="text-gray-400" />
            <MenuItem icon={MessageSquare} label="Feedback" href="/help-center" iconColor="text-gray-400" />
            <MenuItem icon={SettingsIcon} label="Settings" href={isOwnProfile ? "/settings" : undefined} iconColor="text-gray-400" />
          </Card>
        </div>

        {/* Logout Control */}
        {isOwnProfile && (
          <div className="px-8 pt-4 pb-10 flex justify-center">
             <Button variant="ghost" className="text-red-500 hover:bg-red-50 font-bold" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
             </Button>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
