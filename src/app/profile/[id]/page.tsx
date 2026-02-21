'use client';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFriends, getUserById, getTopContributors, getProfileVisitors } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound, useParams } from 'next/navigation';
import { User, Cake, MapPin, Briefcase, Smile, Eye, Loader, Edit, Camera, Gem, Award, ShieldCheck, BadgeCheck, Sparkles } from 'lucide-react';
import { TopContributorsCard } from '@/components/top-contributors-card';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { user: currentUser, isLoading } = useUser();
  const user = getUserById(id || '');
  const friends = getFriends();
  const topContributors = getTopContributors();
  const visitors = getProfileVisitors();
  const profileHeaderImage = PlaceHolderImages.find(img => img.id === 'profile-header');
  
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user && !isLoading) notFound();
  if (isLoading || !currentUser || !user) {
     return <AppLayout><div className="flex h-full w-full items-center justify-center"><Loader className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }
  
  const isOwnProfile = currentUser.uid === user.id;

  const handleEditClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if(file.size > 5 * 1024 * 1024){
            toast({ variant: "destructive", title: "File too large", description: "Please select an image smaller than 5MB." });
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
                src={user.coverUrl || profileHeaderImage.imageUrl}
                alt="Profile header"
                fill
                className="object-cover"
                data-ai-hint="abstract gradient"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div className="p-6 relative">
            <div className="relative flex -mt-20 items-end gap-6">
               <div className="relative group">
                  <div className={cn(
                    "relative p-2 rounded-full bg-gradient-to-br transition-all",
                    user.frame === 'Official' && "from-yellow-400 to-orange-500",
                    user.frame === 'CG' && "from-blue-400 to-purple-500",
                    user.frame === 'Leader' && "from-red-400 to-rose-600",
                    (!user.frame || user.frame === 'None') && "from-transparent to-transparent"
                  )}>
                    <Avatar className="h-28 w-28 border-4 border-background">
                      <AvatarImage src={isOwnProfile ? currentUser.photoURL! : user.avatarUrl} data-ai-hint="person portrait" />
                      <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
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
                     <h1 className="font-headline text-3xl font-bold">{isOwnProfile ? currentUser.displayName : user.name}</h1>
                     {user.tags?.includes('Admin') && <ShieldCheck className="h-6 w-6 text-primary" />}
                     {user.tags?.includes('Official') && <BadgeCheck className="h-6 w-6 text-blue-500" />}
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">Lv.Rich {user.level?.rich || 0}</Badge>
                      <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">Lv.Charm {user.level?.charm || 0}</Badge>
                      <span className="text-xs text-muted-foreground ml-2">ID: {user.specialId || user.id.substring(0, 8)}</span>
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
                  <span className="font-bold">{user.wallet?.coins?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-sm">Diamonds</span>
                  </div>
                  <span className="font-bold">{user.wallet?.diamonds?.toLocaleString() || 0}</span>
                </div>
                <Button variant="outline" className="w-full text-xs" asChild>
                  <Link href="/settings">Go to Store</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Age: {user.details?.age || 'Secret'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <span>Occupation: {user.details?.occupation || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>Hometown: {user.details?.hometown || 'Not specified'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <TopContributorsCard contributors={topContributors} />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" /> Recent Visitors
                </CardTitle>
                <Badge variant="outline">{visitors.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {visitors.map((visitor) => (
                    <Link href={`/profile/${visitor.id}`} key={visitor.id} className="flex flex-col items-center gap-2 text-center group min-w-[70px]">
                      <Avatar className="h-14 w-14 transition-transform group-hover:scale-110">
                        <AvatarImage src={visitor.avatarUrl} data-ai-hint="person portrait" />
                        <AvatarFallback>{visitor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-[10px] truncate w-full">{visitor.name}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline">Friends</CardTitle>
                <Badge variant="outline">{friends.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                  {friends.map((friend) => (
                    <Link href={`/profile/${friend.id}`} key={friend.id} className="flex flex-col items-center gap-2 text-center group">
                      <Avatar className="h-14 w-14 transition-transform group-hover:scale-110">
                        <AvatarImage src={friend.avatarUrl} data-ai-hint="person portrait" />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-[10px] truncate w-full">{friend.name}</span>
                    </Link>
                  ))}
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
