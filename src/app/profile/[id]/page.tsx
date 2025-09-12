import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCurrentUser, getFriends } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ProfilePage() {
  const user = getCurrentUser();
  const friends = getFriends();
  const profileHeaderImage = PlaceHolderImages.find(
    (img) => img.id === 'profile-header'
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full bg-muted">
          {profileHeaderImage && (
            <Image
              src={profileHeaderImage.imageUrl}
              alt="Profile header"
              fill
              className="object-cover"
              data-ai-hint={profileHeaderImage.imageHint}
            />
          )}
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            <Avatar className="h-28 w-28 border-4 border-background">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
              <AvatarFallback className="text-4xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="pt-20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-headline text-3xl font-bold">{user.name}</h1>
              <p className="mt-1 text-muted-foreground">{user.bio}</p>
            </div>
            <Button className="mt-4 sm:mt-0">Edit Profile</Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {friends.map((friend) => (
              <div key={friend.id} className="flex flex-col items-center gap-2 text-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={friend.avatarUrl} alt={friend.name} data-ai-hint="person portrait" />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{friend.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
