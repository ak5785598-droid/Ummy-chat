'use client';
import { useRef, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound, useParams } from 'next/navigation';
import { User, Loader, Camera, Gem, Award, ShieldCheck, BadgeCheck, Sparkles, Globe2, HeartHandshake } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';
import { EditProfileDialog } from '@/components/edit-profile-dialog';

/**
 * Real User Profile Page.
 * Fetches identity details from Firestore to ensure app data is isolated from Google.
 */
export default function ProfilePage() {
  const params = useParams();
  const profileId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // Reference the specific Firestore profile path defined in backend.json
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return doc(firestore, 'users', profileId, 'profile', profileId);
  }, [firestore, profileId]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(profileRef);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-full w-full items-center justify-center py-20">
          <Loader className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.uid === profileId;
  const profileHeaderImage = PlaceHolderImages.find(img => img.id === 'profile-header');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Limit is 5MB." });
        return;
      }
      uploadProfilePicture(file);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-b from-background to-secondary/20">
          <div className="relative h-48 w-full bg-muted">
            {profileHeaderImage && (
              <Image
                src={profile.coverUrl || profileHeaderImage.imageUrl}
                alt="Profile header"
                fill
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            
            {isOwnProfile && (
              <div className="absolute top-4 right-4 z-10">
                <EditProfileDialog profile={profile} />
              </div>
            )}
          </div>
          <div className="p-6 relative">
            <div className="relative flex -mt-20 items-end gap-6">
               <div className="relative group">
                  <div className={cn(
                    "relative p-2 rounded-full bg-gradient-to-br transition-all",
                    profile.frame === 'Official' && "from-yellow-400 to-orange-500",
                    profile.frame === 'CG' && "from-blue-400 to-purple-500",
                    (!profile.frame || profile.frame === 'None') && "from-transparent to-transparent"
                  )}>
                    <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback className="text-4xl">{(profile.username || profile.name || 'U').charAt(0)}</AvatarFallback>
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
              <div className="flex-1 pb-2">
                   <div className="flex items-center gap-2">
                     <h1 className="font-headline text-3xl font-bold">{profile.username || profile.name}</h1>
                     {profile.tags?.includes('Admin') && <ShieldCheck className="h-6 w-6 text-primary" />}
                     {profile.tags?.includes('Official') && <BadgeCheck className="h-6 w-6 text-blue-500" />}
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">Lv.Rich {profile.level?.rich || 0}</Badge>
                      <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">Lv.Charm {profile.level?.charm || 0}</Badge>
                      <span className="text-xs text-muted-foreground ml-2">ID: {profile.id.substring(0, 8)}</span>
                   </div>
              </div>
              <div className="flex gap-2">
                {!isOwnProfile && <Button className="rounded-full px-8 shadow-lg">Follow</Button>}
              </div>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Wallet & Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Gem className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Coins</span>
                  </div>
                  <span className="font-bold">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-sm">Diamonds</span>
                  </div>
                  <span className="font-bold">{(profile.wallet?.diamonds || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Identity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground italic mb-4">"{profile.bio || 'This user is quite mysterious...'}"</p>
                <div className="flex items-center gap-4 p-2 bg-muted/20 rounded-lg">
                  <User className="h-5 w-5 text-primary/70" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground">Gender</span>
                    <span className="font-semibold">{profile.details?.gender || 'Secret'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-2 bg-muted/20 rounded-lg">
                  <Globe2 className="h-5 w-5 text-accent/70" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground">Country</span>
                    <span className="font-semibold">{profile.details?.hometown || 'India'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-2 bg-muted/20 rounded-lg">
                  <HeartHandshake className="h-5 w-5 text-green-500/70" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground">Age</span>
                    <span className="font-semibold">{profile.details?.age || '22'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-headline flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl text-center border border-primary/10 shadow-sm">
                        <p className="text-3xl font-bold text-primary">{profile.stats?.followers || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Followers</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl text-center border border-accent/10 shadow-sm">
                        <p className="text-3xl font-bold text-accent">{profile.stats?.fans || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Fans</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-2xl text-center border border-yellow-500/10 shadow-sm">
                        <p className="text-3xl font-bold text-yellow-600">{profile.level?.rich || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">VIP Status</p>
                    </div>
                 </div>
              </CardContent>
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
