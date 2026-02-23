
'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound, useParams, useRouter } from 'next/navigation';
import { User, Loader, Camera, Gem, Award, ShieldCheck, BadgeCheck, Sparkles, Globe2, HeartHandshake, Layout, ShoppingBag, Store } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserProfile } from '@/firebase';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import Link from 'next/link';

/**
 * Social Profile Page.
 * Optimized for high-speed loading and direct Store access.
 */
export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, isAuthLoading, router]);

  useEffect(() => {
    if (!isUploading) {
      setLocalAvatarPreview(null);
    }
  }, [isUploading]);

  if (isAuthLoading || (isProfileLoading && !profile)) {
    return (
      <AppLayout>
        <div className="flex h-full w-full flex-col items-center justify-center py-20 space-y-4">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Syncing Identity...</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile && !isProfileLoading && !isAuthLoading) {
    notFound();
    return null;
  }

  if (!profile || !currentUser) return null;

  const isOwnProfile = currentUser.uid === profileId;

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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-700">
        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-b from-background to-secondary/10 rounded-[2rem]">
          <div className="relative h-56 w-full bg-muted">
            <Image
              src={profile.coverUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470"}
              alt="Profile header background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {isOwnProfile && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button asChild size="sm" className="rounded-full bg-primary text-black font-black uppercase tracking-widest text-[10px] h-9 px-4 shadow-lg hover:scale-105 transition-transform border-none">
                  <Link href="/store">
                    <Store className="mr-1.5 h-3.5 w-3.5" />
                    Boutique
                  </Link>
                </Button>
                <EditProfileDialog profile={profile} />
              </div>
            )}
          </div>
          <div className="p-8 relative">
            <div className="relative flex -mt-24 items-end gap-6">
               <div className="relative group">
                  <div className={cn(
                    "relative p-1.5 rounded-full bg-white shadow-2xl transition-all",
                    profile.frame === 'Official' && "bg-gradient-to-br from-yellow-400 to-orange-500 p-2",
                    profile.frame === 'CG' && "bg-gradient-to-br from-blue-400 to-purple-500 p-2"
                  )}>
                    <Avatar className="h-32 w-32 border-4 border-white shadow-inner">
                      <AvatarImage 
                        src={localAvatarPreview || profile.avatarUrl} 
                      />
                      <AvatarFallback className="text-4xl">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  {isOwnProfile && (
                     <div 
                        className="absolute inset-2 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploading ? <Loader className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
                     </div>
                  )}
               </div>
              <div className="flex-1 pb-4">
                   <div className="flex items-center gap-2">
                     <h1 className="font-headline text-4xl font-black italic uppercase tracking-tighter text-gray-900 drop-shadow-sm">{profile.username}</h1>
                     {profile.tags?.includes('Admin') && <ShieldCheck className="h-7 w-7 text-primary" />}
                     {profile.tags?.includes('Official') && <BadgeCheck className="h-7 w-7 text-blue-500" />}
                   </div>
                   <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-bold">Lv. {profile.level?.rich || 1}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono bg-gray-100 px-2 py-0.5 rounded">ID: {profile.id.substring(0, 8)}</span>
                   </div>
              </div>
              <div className="flex gap-2">
                {!isOwnProfile && <Button className="rounded-full px-10 h-12 text-lg font-black uppercase italic shadow-xl shadow-primary/20">Follow</Button>}
              </div>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-secondary/10 flex flex-row items-center justify-between">
                <CardTitle className="font-headline flex items-center gap-2 text-lg m-0">
                  <Award className="h-5 w-5 text-primary" /> Wallet & Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-black/5">
                  <div className="flex items-center gap-2">
                    <Gem className="h-5 w-5 text-primary" />
                    <span className="font-bold text-sm uppercase">Coins</span>
                  </div>
                  <span className="font-black text-xl">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-black/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <span className="font-bold text-sm uppercase">Diamonds</span>
                  </div>
                  <span className="font-black text-xl">{(profile.wallet?.diamonds || 0).toLocaleString()}</span>
                </div>
                <Button asChild className="w-full rounded-xl h-12 font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none">
                  <Link href="/store">Visit Store</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 rounded-3xl p-8 text-center shadow-sm border border-yellow-100 relative overflow-hidden group">
                <span className="text-4xl font-black text-gray-800 relative z-10">{profile.stats?.followers || 0}</span>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 relative z-10">Followers</p>
                <div className="absolute -bottom-4 -right-4 text-yellow-500/10 rotate-12 group-hover:scale-110 transition-transform"><User className="h-20 w-20" /></div>
              </div>
              <div className="bg-pink-50 rounded-3xl p-8 text-center shadow-sm border border-pink-100 relative overflow-hidden group">
                <span className="text-4xl font-black text-gray-800 relative z-10">{profile.stats?.fans || 0}</span>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 relative z-10">Total Fans</p>
                <div className="absolute -bottom-4 -right-4 text-pink-500/10 rotate-12 group-hover:scale-110 transition-transform"><Sparkles className="h-20 w-20" /></div>
              </div>
            </div>

            <Card className="rounded-[2rem] border-none shadow-sm h-64 flex items-center justify-center bg-muted/5">
                <div className="text-center space-y-2 opacity-30">
                  <Layout className="h-12 w-12 mx-auto" />
                  <p className="font-black uppercase tracking-widest text-xs">Activity Pulse Syncing...</p>
                </div>
            </Card>
          </div>
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
