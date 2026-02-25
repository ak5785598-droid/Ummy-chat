'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, useUserProfile, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AvatarFrame } from '@/components/avatar-frame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const STORE_ITEMS = [
  { id: 'f4', name: 'Imperial Bloom', type: 'Frame', price: 20000, description: 'Exquisite purple roses and a majestic golden crown.', icon: Crown, color: 'text-purple-600' },
  { id: 'f1', name: 'Golden Official', type: 'Frame', price: 15000, description: 'The mark of ultimate authority.', icon: Star, color: 'text-yellow-500' },
  { id: 'f2', name: 'Cyberpunk Red', type: 'Frame', price: 8000, description: 'Neon glow for the tech-savvy.', icon: Star, color: 'text-red-500' },
  { id: 'f3', name: 'Royal Purple', type: 'Frame', price: 12000, description: 'Regal elegance for leaders.', icon: Star, color: 'text-purple-500' },
  { id: 'b1', name: 'Kawaii Pink', type: 'Bubble', price: 2000, description: 'Soft pink chat bubbles.', icon: MessageSquare, color: 'text-pink-400' },
  { id: 'b2', name: 'Midnight Blue', type: 'Bubble', price: 2500, description: 'Deep space chat aesthetics.', icon: MessageSquare, color: 'text-blue-600' },
  { id: 'w1', name: 'Ocean Waves', type: 'Wave', price: 5000, description: 'Dynamic blue voice frequency.', icon: Mic2, color: 'text-cyan-500' },
  { id: 'w2', name: 'Flame Pulse', type: 'Wave', price: 7500, description: 'Ignite the room when you speak.', icon: Mic2, color: 'text-orange-600' },
];

export default function StorePage() {
  const { user } = useUser();
  const { userProfile, isLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handlePurchase = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    
    const balance = userProfile.wallet?.coins || 0;
    if (balance < item.price) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Head to the arena to earn more.' });
      return;
    }

    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);

    const updateData = {
      'wallet.coins': increment(-item.price),
      'inventory.ownedItems': arrayUnion(item.id),
      'updatedAt': serverTimestamp()
    };

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, { 
      'wallet.coins': increment(-item.price),
      'updatedAt': serverTimestamp()
    });
  };

  const handleEquip = (item: any) => {
    if (!userProfile || !user || !firestore) return;

    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);

    const field = item.type === 'Frame' ? 'inventory.activeFrame' : item.type === 'Bubble' ? 'inventory.activeBubble' : 'inventory.activeWave';
    
    const updateData = {
      [field]: item.id,
      updatedAt: serverTimestamp()
    };

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, updateData);
  };

  if (isLoading) return (
    <AppLayout>
      <div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin" /></div>
    </AppLayout>
  );

  const categories = ['All', 'Frame', 'Bubble', 'Wave'];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
          <div className="flex items-center gap-4">
             <Link href="/settings" className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
                <ChevronLeft className="h-6 w-6" />
             </Link>
             <div>
                <h1 className="text-4xl font-bold font-headline uppercase italic tracking-tighter flex items-center gap-3">
                  <ShoppingBag className="text-primary h-10 w-10" /> Ummy Boutique
                </h1>
                <p className="text-muted-foreground font-body text-lg">Customize your frequency identity.</p>
             </div>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-8 py-4 rounded-[2rem] border-2 border-primary/20 flex items-center gap-4 shadow-xl">
            <GoldCoinIcon className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-primary">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary/60">Current Balance</span>
            </div>
          </div>
        </header>

        <Tabs defaultValue="All" className="w-full space-y-8">
          <TabsList className="bg-secondary/50 p-1.5 h-14 rounded-full border border-white/50 w-full md:w-fit overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="rounded-full px-8 font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {STORE_ITEMS.filter(i => category === 'All' || i.type === category).map(item => {
                  const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
                  const isActive = userProfile?.inventory?.activeFrame === item.id || 
                                  userProfile?.inventory?.activeBubble === item.id || 
                                  userProfile?.inventory?.activeWave === item.id;

                  return (
                    <Card key={item.id} className="relative overflow-hidden group border-none shadow-lg rounded-[2.5rem] bg-white hover:scale-105 transition-all duration-300">
                      <div className="aspect-square bg-gradient-to-b from-secondary/30 to-transparent flex flex-col items-center justify-center p-10 relative">
                        {item.type === 'Frame' ? (
                          <AvatarFrame frameId={item.id} className="w-32 h-32">
                             <Avatar className="w-full h-full">
                                <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} />
                                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                             </Avatar>
                          </AvatarFrame>
                        ) : (
                          <item.icon className={cn("h-24 w-24 opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-500", item.color)} />
                        )}
                        <Badge className="absolute top-6 right-6 bg-secondary/80 text-foreground border-none font-black uppercase text-[10px] tracking-widest px-3">
                          {item.type}
                        </Badge>
                      </div>
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="font-headline uppercase italic text-xl tracking-tighter">{item.name}</CardTitle>
                        <CardDescription className="text-xs font-body italic">{item.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                        <div className="flex items-center gap-1 font-black text-2xl text-primary italic">
                          <GoldCoinIcon className="h-6 w-6" />
                          {item.price.toLocaleString()}
                        </div>
                        {isOwned ? (
                          <Button 
                            onClick={() => handleEquip(item)} 
                            className={cn("w-full h-12 rounded-2xl font-black uppercase italic shadow-lg", isActive ? "bg-green-500" : "bg-secondary text-foreground")}
                          >
                            {isActive ? <><Check className="mr-2 h-4 w-4" /> Active</> : 'Equip'}
                          </Button>
                        ) : (
                          <Button onClick={() => handlePurchase(item)} className="w-full h-12 rounded-2xl font-black uppercase italic shadow-lg bg-primary text-white">
                            Purchase
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
