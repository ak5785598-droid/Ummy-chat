'use client';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFriends, getUserById, getTopContributors, getProfileVisitors } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound } from 'next/navigation';
import { User, Cake, MapPin, Briefcase, Smile, Eye, Loader, Edit, Camera } from 'lucide-react';
import { TopContributorsCard } from '@/components/top-contributors-card';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser, isLoading } = useUser();
  const user = getUserById(params.id);
  const friends = getFriends();
  const topContributors = getTopContributors();
  const visitors = getProfileVisitors();
  const profileHeaderImage = PlaceHolderImages.find(
    (img) => img.id === 'profile-header'
  );
  
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user && !isLoading) {
    notFound();
  }

  if (isLoading || !currentUser || !user) {
     return (
       <AppLayout>
          <div className="flex h-full w-full items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
       </AppLayout>
    )
  }
  
  const isOwnProfile = currentUser.uid === user.id;

  const handleEditClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if(file.size > 5 * 1024 * 1024){ // 5MB limit
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Please select an image smaller than 5MB.",
            });
            return;
        }
        uploadProfilePicture(file);
    }
  };


  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="p-6">
            <div className="relative flex -mt-20">
               <div className="relative group">
                  <Avatar className="h-28 w-28 border-4 border-background">
                    <AvatarImage src={isOwnProfile ? currentUser.photoURL! : user.avatarUrl} alt={isOwnProfile ? currentUser.displayName! : user.name} data-ai-hint="person portrait" />
                    <AvatarFallback className="text-4xl">
                      {isOwnProfile ? currentUser.displayName?.charAt(0) : user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                     <div 
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={handleEditClick}
                     >
                        {isUploading ? (
                            <Loader className="h-8 w-8 animate-spin text-white" />
                        ) : (
                            <Camera className="h-8 w-8 text-white" />
                        )}
                     </div>
                  )}
               </div>
              <div className="ml-4 mt-16 flex-1">
                   <h1 className="font-headline text-3xl font-bold">{isOwnProfile ? currentUser.displayName : user.name}</h1>
                   <p className="mt-1 text-sm text-muted-foreground">ID: {isOwnProfile ? currentUser.uid : user.id}</p>
              </div>
              { isOwnProfile ? (
                  <>
                    <Button className="mt-16" onClick={handleEditClick} disabled={isUploading}>
                        {isUploading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                        Edit Profile
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                      disabled={isUploading}
                    />
                  </>
              ): (
                  <Button className="mt-16">Follow</Button>
              )}
            </div>
            
            <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-lg border text-center">
              <div className="p-3">
                <p className="font-bold text-lg">{user.stats?.sent || 0}</p>
                <p className="text-muted-foreground text-sm">Send out</p>
              </div>
              <div className="p-3">
                <p className="font-bold text-lg">{user.stats?.followers || 0}</p>
                <p className="text-muted-foreground text-sm">Follow</p>
              </div>
               <div className="p-3">
                <p className="font-bold text-lg">{user.stats?.fans || 0}</p>
                <p className="text-muted-foreground text-sm">Fans</p>
              </div>
            </div>

          </div>
        </Card>
        
        <TopContributorsCard contributors={topContributors} />

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
                  <Smile className="h-5 w-5 text-muted-foreground" />
                  <span>Emotional state: {user.details?.emotionalState || 'Keep secret'}</span>
              </div>
              <div className="flex items-center gap-4">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <span>Occupation: {user.details?.occupation || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>Hometown: {user.details?.hometown || 'Not specified'}</span>
              </div>
               <div className="flex items-center gap-4">
                  <Cake className="h-5 w-5 text-muted-foreground" />
                  <span>Personality signature: {user.details?.personalitySignature || 'Happy every day'}</span>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              Recent Visitors ({visitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {visitors.map((visitor) => (
                <Link href={`/profile/${visitor.id}`} key={visitor.id} className="flex flex-col items-center gap-2 text-center group">
                  <Avatar className="h-16 w-16 transition-transform group-hover:scale-105">
                    <AvatarImage src={visitor.avatarUrl} alt={visitor.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{visitor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-xs truncate">{visitor.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Friends ({friends.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {friends.map((friend) => (
                <Link href={`/profile/${friend.id}`} key={friend.id} className="flex flex-col items-center gap-2 text-center group">
                  <Avatar className="h-20 w-20 transition-transform group-hover:scale-105">
                    <AvatarImage src={friend.avatarUrl} alt={friend.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm truncate">{friend.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
