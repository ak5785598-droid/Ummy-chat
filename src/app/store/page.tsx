'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Gem, ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader } from 'lucide-react';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const STORE_ITEMS = [
  { id: 'f1', name: 'Golden Official', type: 'Frame', price: 15000, description: 'Exclusive Official Border', icon: Star },
  { id: 'f2', name: 'Cyberpunk Red', type: 'Frame', price: 8000, description: 'Neon Red Glowing Frame', icon: Star },
  { id: 'b1', name: 'Kawaii Pink', type: 'Bubble', price: 2000, description: 'Cute Pink Chat Bubble', icon: MessageSquare },
  { id: 'w1', name: 'Ocean Waves', type: 'Wave', price: 5000, description: 'Blue Animated Voice Waves', icon: Mic2 },
  { id: 'e1', name: 'Royal Entrance', type: 'Entry', price: 10000, description: 'Flashy Arrival Notification', icon: Sparkles },
];

export default function StorePage() {
  const { user } = useUser();
  const { userProfile, isLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handlePurchase = async (item: any) => {
    if (!userProfile || !user || !firestore) return;
    
    const balance = userProfile.wallet?.coins || 0;
    if (balance < item.price) {
      toast({ 
        variant: 'destructive', 
        title: 'Insufficient Coins', 
        description: `You need ${item.price - balance} more coins.` 
      });
      return;
    }

    try {
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      await updateDoc(profileRef, {
        'wallet.coins': increment(-item.price),
        'inventory.ownedItems': arrayUnion(item.id)
      });
      toast({ title: 'Purchase Successful!', description: `${item.name} added to your inventory.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to process purchase.' });
    }
  };

  if (isLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin text-primary" /></div></AppLayout>;

  const types = ['All', 'Frame', 'Bubble', 'Wave', 'Entry'];

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
              <ShoppingBag className="text-primary" /> Ummy Boutique
            </h1>
            <p className="text-muted-foreground">Official store for frames, bubbles, and voice waves.</p>
          </div>
          <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 flex items-center gap-3">
            <Gem className="h-6 w-6 text-primary" />
            <span className="text-2xl font-bold text-primary">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
          </div>
        </header>

        <Tabs defaultValue="All" className="w-full">
          <TabsList className="bg-muted/50 rounded-full p-1 h-12 mb-8">
            {types.map(t => (
              <TabsTrigger key={t} value={t} className="rounded-full px-8">{t}</TabsTrigger>
            ))}
          </TabsList>

          {types.map(type => (
            <TabsContent key={type} value={type}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {STORE_ITEMS.filter(i => type === 'All' || i.type === type).map(item => (
                  <Card key={item.id} className="relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="aspect-square bg-muted/30 flex items-center justify-center p-8">
                      <item.icon className="h-20 w-20 text-primary opacity-20 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute top-2 right-2 bg-primary">{item.type}</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between">
                      <div className="flex items-center gap-1 font-bold text-primary">
                        <Gem className="h-4 w-4" />
                        {item.price.toLocaleString()}
                      </div>
                      <Button onClick={() => handlePurchase(item)} disabled={userProfile?.inventory?.ownedItems?.includes(item.id)}>
                        {userProfile?.inventory?.ownedItems?.includes(item.id) ? 'Owned' : 'Purchase'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}