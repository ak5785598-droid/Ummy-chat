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
  Shirt, 
  Sparkles, 
  Store, 
  Zap,
  ChevronLeft,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useUserProfile, useProfilePictureUpload, useAuth, updateDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, increment, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { AvatarFrame } from '@/components/avatar-frame';

const MenuItem = ({ icon: Icon, label, href, extra, iconColor, onClick, router }: any) => (
  <div 
    className="flex items-center justify-between py-4 border-b last:border-0 px-6 hover:bg-gray-50/50 cursor-pointer transition-colors" 
    onClick={() => {
      if (onClick) onClick();
      else if (href) router.push(href);
    }}
  >
    <div className="flex items-center gap-4">
      <div className={cn("p-2 rounded-xl", iconColor?.replace('text-', 'bg-') + '/10' || "bg-primary/10")}>
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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);
  const { userProfile: myProfile } = useUserProfile(currentUser?.uid);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) router.replace('/login');
  }, [currentUser, isAuthLoading, router]);

  const isOwnProfile = currentUser?.uid === profileId;
  const isFollowing = myProfile?.tags?.includes(`following:${profileId}`);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleFollow = () => {
    if (!firestore || !currentUser || !myProfile || isOwnProfile) return;
    
    const myProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    const targetProfileRef = doc(firestore, 'users', profileId, 'profile', profileId);
    
    if (isFollowing) {
      updateDocumentNonBlocking(myProfileRef, { tags: arrayRemove(`following:${profileId}`) });
      updateDocumentNonBlocking(targetProfileRef, { 'stats.followers': increment(-1) });
      toast({ title: 'Unfollowed' });
    } else {
      updateDocumentNonBlocking(myProfileRef, { tags: arrayUnion(`following:${profileId}`) });
      updateDocumentNonBlocking(targetProfileRef, { 'stats.followers': increment(1) });
      toast({ title: 'Following Tribe Member!' });
    }
  };

  // Wait for both auth and profile to resolve
  const isWaiting = isAuthLoading || isProfileLoading;

  if (isWaiting) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="animate-spin text-primary h-10 w-10" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Identity...</p>
        </div>
      </AppLayout>
    );
  }

  // Handle newly logged in users who are still initializing
  if (!profile && isOwnProfile) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="animate-spin text-primary h-10 w-10" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Initializing Tribe Identity...</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    notFound();
    return null;
  }

  if (!currentUser) return null;

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6 pb-24 bg-gray-50/50 min-h-screen animate-in fade-in duration-700">
        <div className="flex items-center px-4 pt-4">
           <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all">
              <ChevronLeft className="h-5 w-5" />
           </button>
        </div>

        <div className="relative bg-white pb-6 rounded-b-[3rem] shadow-sm overflow-hidden">
          <div className="relative h-44 w-full">
            <Image src={profile.coverUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470"} alt="Banner" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
          </div>
          <div className="px-6 -mt-12 flex items-end gap-4 relative z-10">
            <div className="relative group shrink-0">
              <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={localAvatarPreview || profile.avatarUrl} />
                  <AvatarFallback className="text-4xl font-black">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
              {isOwnProfile && (
                <div 
                  className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer backdrop-blur-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                   {isUploading ? <Loader className="animate-spin text-white" /> : <Camera className="text-white h-6 w-6" />}
                </div>
              )}
            </div>
            <div className="pb-2 flex-1">
               <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">{profile.username}</h1>
                        {profile.tags?.includes('Official') && <Sparkles className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2 py-0.5 rounded">ID: {profile.specialId || '100000'}</span>
                  </div>
                  {!isOwnProfile && (
                    <Button 
                      onClick={handleFollow} 
                      variant={isFollowing ? "outline" : "default"}
                      className="rounded-full h-10 font-black uppercase italic text-xs px-6"
                    >
                      {isFollowing ? <><UserCheck className="h-4 w-4 mr-2" /> Following</> : <><UserPlus className="h-4 w-4 mr-2" /> Follow</>}
                    </Button>
                  )}
               </div>
               <div className="mt-2">
                  {isOwnProfile ? <EditProfileDialog profile={profile} /> : <p className="text-xs text-muted-foreground italic line-clamp-1">{profile.bio}</p>}
               </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest px-2 font-headline text-gray-400">Vault & Identity</h2>
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <MenuItem icon={Gem} label="Gold Coins" extra={(profile.wallet?.coins || 0).toLocaleString()} iconColor="text-yellow-500" router={router} />
            <MenuItem icon={Sparkles} label="Blue Diamonds" extra={(profile.wallet?.diamonds || 0).toLocaleString()} iconColor="text-blue-500" router={router} />
            <MenuItem icon={Store} label="Ummy Boutique" href="/store" iconColor="text-orange-500" router={router} />
            <MenuItem icon={Trophy} label="Tribe Level" href="/leaderboard" extra={`Level ${profile.level?.rich || 1}`} iconColor="text-yellow-600" router={router} />
            <MenuItem icon={Shirt} label={isOwnProfile ? "My Assets" : "Collection"} href="/store" iconColor="text-cyan-500" router={router} />
          </Card>
        </div>

        <div className="px-4 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest px-2 font-headline text-gray-400">Community Stats</h2>
          <div className="grid grid-cols-2 gap-4 px-2">
             <div className="bg-white p-4 rounded-3xl shadow-sm text-center">
                <p className="text-xl font-black text-gray-900">{profile.stats?.followers || 0}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Followers</p>
             </div>
             <div className="bg-white p-4 rounded-3xl shadow-sm text-center">
                <p className="text-xl font-black text-gray-900">{profile.stats?.fans || 0}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Fans</p>
             </div>
          </div>
        </div>

        <div className="px-4 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest px-2 font-headline text-gray-400">Region & Feedback</h2>
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <MenuItem icon={Globe} label="Region" extra="India / Official" iconColor="text-gray-400" router={router} />
            <MenuItem icon={MessageSquare} label="Feedback" href="/help-center" iconColor="text-gray-400" router={router} />
            <MenuItem icon={SettingsIcon} label="Preference" href={isOwnProfile ? "/settings" : undefined} iconColor="text-gray-400" router={router} />
          </Card>
        </div>

        {isOwnProfile && (
          <div className="px-8 pt-4 pb-10 flex justify-center">
             <Button variant="ghost" className="text-red-500 hover:bg-red-50 font-black uppercase italic tracking-widest text-xs" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Exit Frequency
             </Button>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setLocalAvatarPreview(URL.createObjectURL(file));
          uploadProfilePicture(file);
        }
      }} className="hidden" accept="image/*" />
    </AppLayout>
  );
}