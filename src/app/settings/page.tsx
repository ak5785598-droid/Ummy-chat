'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  User,
  Shield,
  CreditCard,
  Gem,
  Star,
  LifeBuoy,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCurrentUser, getCoinPackages } from '@/lib/mock-data';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const currentUser = getCurrentUser();
  const coinPackages = getCoinPackages();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'Auth service not available.',
      });
      return;
    }
    try {
      await signOut(auth);
      router.push('/login');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: (error as Error).message,
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-headline">
              {currentUser.name}
            </h1>
            <p className="text-sm text-muted-foreground">ID: {currentUser.id}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Gem className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">
              {currentUser.wallet?.coins.toLocaleString() || 0}
            </span>
          </div>
        </header>
        <Separator />
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="account">
              <User className="mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your public profile and account details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={currentUser.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="alina@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" defaultValue={currentUser.bio} />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="font-headline">Support</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href="/help-center"
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Help Center</h3>
                      <p className="text-sm text-muted-foreground">
                        Find answers to common questions.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Visit</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="font-headline text-destructive">
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                  <div>
                    <h3 className="font-semibold">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <Button variant="destructive">Delete</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-semibold">Log Out</h3>
                    <p className="text-sm text-muted-foreground">
                      You will be returned to the login screen.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>Log Out</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Notifications</CardTitle>
                <CardDescription>
                  Choose what you want to be notified about.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="new-messages">New Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new messages in chat rooms.
                    </p>
                  </div>
                  <Switch id="new-messages" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="friend-requests">Friend Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone sends you a friend request.
                    </p>
                  </div>
                  <Switch id="friend-requests" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="room-invites">Room Invites</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you are invited to a private room.
                    </p>
                  </div>
                  <Switch id="room-invites" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="live-alerts">Go-Live Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a friend starts a live broadcast.
                    </p>
                  </div>
                  <Switch id="live-alerts" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Privacy Settings</CardTitle>
                <CardDescription>
                  Manage who can see your information and contact you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="show-online">Show Online Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see when you are active on the app.
                    </p>
                  </div>
                  <Switch id="show-online" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="private-profile">Private Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      If enabled, only your friends can see your full profile.
                    </p>
                  </div>
                  <Switch id="private-profile" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Buy Coins</CardTitle>
                <CardDescription>
                  Purchase coins to send gifts and play premium games.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {coinPackages.map((pkg, index) => (
                  <Card
                    key={pkg.id}
                    className="relative flex flex-col items-center justify-center p-4 text-center transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  >
                    {index === coinPackages.length - 1 && (
                      <div className="absolute -top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
                        <Star className="h-3 w-3" /> Best Value
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                      <Gem />
                      <span>{pkg.amount.toLocaleString()}</span>
                    </div>
                    {pkg.bonus && (
                      <p className="text-xs text-green-500 font-semibold">
                        {' '}
                        + {pkg.bonus.toLocaleString()} Bonus!
                      </p>
                    )}
                    <Button className="mt-4 w-full">₹{pkg.price.toFixed(0)}</Button>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
