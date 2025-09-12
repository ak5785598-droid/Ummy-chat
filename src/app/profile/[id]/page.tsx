import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCurrentUser, getFriends, getUserById, getTopContributors, getProfileVisitors } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound } from 'next/navigation';
import { User, Cake, MapPin, Briefcase, Smile, Eye } from 'lucide-react';
import { TopContributorsCard } from '@/components/top-contributors-card';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const user = getUserById(params.id);
  const friends = getFriends();
  const topContributors = getTopContributors();
  const visitors = getProfileVisitors();
  const profileHeaderImage = PlaceHolderImages.find(
    (img) => img.id === 'profile-header'
  );

  if (!user) {
    notFound();
  }
  const currentUser = getCurrentUser();

  return (
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
             <Avatar className="h-28 w-28 border-4 border-background">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
              <AvatarFallback className="text-4xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 mt-16 flex-1">
                 <h1 className="font-headline text-3xl font-bold">{user.name}</h1>
                 <p className="mt-1 text-sm text-muted-foreground">ID: {user.id}</p>
            </div>
            { user.id === currentUser.id ? (
                <Button className="mt-16">Edit Profile</Button>
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
  );
}
