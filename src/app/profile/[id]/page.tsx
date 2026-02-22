'use client';
import { useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound, useParams } from 'next/navigation';
import { User, MapPin, Briefcase, Loader, Edit, Camera, Gem, Award, ShieldCheck, BadgeCheck, Sparkles, Eye } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';

export default function ProfilePage() {
  const params = useParams();
  const profileId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // Fetch real profile data from Firestore
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
    return <AppLayout><div className="flex h-full w-full items-center justify-center py-20"><Loader className="h-10 w-10 animate-spin text-primary" /></div></AppLayout>;
  }

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.uid === profileId;
  const profileHeaderImage = PlaceHolderImages.find(img => img.id === 'profile-header');

  const handleEditClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if(file.size > 5 * 1024 * 1024){
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
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
                    <Avatar className="h-28 w-28 border-4 border-background">
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback className="text-4xl">{(profile.username || profile.name || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  {isOwnProfile && (
                     <div className="absolute inset-2 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleEditClick}>
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
                {isOwnProfile ? (
                    <Button onClick={handleEditClick} disabled={isUploading}>
                        {isUploading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                        Edit
                    </Button>
                ): <Button className="rounded-full px-8">Follow</Button>}
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
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gem className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Coins</span>
                  </div>
                  <span className="font-bold">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
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
                <CardTitle className="font-headline">Bio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground italic">"{profile.bio || 'This user is quite mysterious...'}"</p>
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Age: {profile.details?.age || 'Secret'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>Hometown: {profile.details?.hometown || 'Earth'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> About {profile.username || profile.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-secondary/20 rounded-xl text-center">
                        <p className="text-2xl font-bold">{profile.stats?.followers || 0}</p>
                        <p className="text-xs text-muted-foreground uppercase">Followers</p>
                    </div>
                    <div className="p-4 bg-secondary/20 rounded-xl text-center">
                        <p className="text-2xl font-bold">{profile.stats?.fans || 0}</p>
                        <p className="text-xs text-muted-foreground uppercase">Fans</p>
                    </div>
                    <div className="p-4 bg-secondary/20 rounded-xl text-center">
                        <p className="text-2xl font-bold">{profile.level?.rich || 0}</p>
                        <p className="text-xs text-muted-foreground uppercase">Rich Level</p>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
