'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AvatarFrame } from '@/components/avatar-frame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const STORE_ITEMS = [
  // Frames
  { id: 'f7', name: 'Celestial Wings', type: 'Frame', price: 15000, description: 'Tiered lavender wings with sovereign golden peaks.', icon: Sparkles, color: 'text-indigo-400' },
  { id: 'f6', name: 'Bronze Sky', type: 'Frame', price: 10000, description: 'Exquisite bronze laurel wreath with radiant gemstones.', icon: Sparkles, color: 'text-orange-400' },
  { id: 'f5', name: 'Golden wings', type: 'Frame', price: 200000, description: 'Ultra-detailed 3D luxury angelic frame.', icon: Sparkles, color: 'text-yellow-400' },
  { id: 'f4', name: 'Imperial Bloom', type: 'Frame', price: 20000, description: 'Exquisite purple roses and a majestic golden crown.', icon: Crown, color: 'text-purple-600' },
  
  // Themes
  { id: 'tower', name: 'Tower', type: 'Theme', price: 60000, description: 'Eiffel Tower autumn frequency. Romantic visual signature.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=1000', isNew: true },
  { id: 'royal', name: 'Royal Palace', type: 'Theme', price: 100000, description: 'Ornate palace ballroom background with grand staircase.', imageUrl: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=1000' },
  { id: 'cyber', name: 'Cyber Punk', type: 'Theme', price: 85000, description: 'Neon-lit futuristic city frequency.', imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000' },
  { id: 'nebula', name: 'Vibrant Nebula', type: 'Theme', price: 75000, description: 'Deep space cosmic frequency.', imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000' },
  
  // Bubbles & Waves
  { id: 'b1', name: 'Kawaii Pink', type: 'Bubble', price: 2000, description: 'Soft pink chat bubbles.', icon: MessageSquare, color: 'text-pink-400' },
  { id: 'w1', name: 'Ocean Waves', type: 'Wave', price: 5000, description: 'Dynamic blue voice frequency.', icon: Mic2, color: 'text-cyan-500' },
];

export default function StorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handlePurchase = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    
    const balance = userProfile.wallet?.coins || 0;
    if (balance < item.price) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Head to the vault to recharge.' });
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
    
    toast({ title: 'Acquisition Successful!', description: `${item.name} is now in your inventory.` });
  };

  const handleEquip = (item: any) => {
    if (!userProfile || !user || !firestore) return;

    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);

    let field = '';
    if (item.type === 'Frame') field = 'inventory.activeFrame';
    else if (item.type === 'Bubble') field = 'inventory.activeBubble';
    else if (item.type === 'Wave') field = 'inventory.activeWave';
    else if (item.type === 'Theme') field = 'inventory.activeTheme';
    
    if (!field) return;

    const updateData = {
      [field]: item.id,
      updatedAt: serverTimestamp()
    };

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, updateData);
    toast({ title: 'Identity Updated', description: `${item.name} is now active.` });
  };

  if (isLoading) return (
    <AppLayout>
      <div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin text-primary h-8 w-8" /></div>
    </AppLayout>
  );

  const categories = ['All', 'Frame', 'Theme', 'Bubble', 'Wave'];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-700 font-headline">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8 px-4 pt-6">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
                <ChevronLeft className="h-6 w-6 text-gray-800" />
             </button>
             <div>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <ShoppingBag className="text-primary h-10 w-10" /> Ummy Boutique
                </h1>
                <p className="text-muted-foreground font-body text-lg italic">Customize your frequency identity.</p>
             </div>
          </div>
          <div 
            onClick={() => router.push('/wallet')}
            className="bg-gradient-to-br from-primary/20 to-primary/5 px-8 py-4 rounded-[2rem] border-2 border-primary/20 flex items-center gap-4 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
          >
            <GoldCoinIcon className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-primary">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary/60">Tap to Recharge</span>
            </div>
          </div>
        </header>

        <div className="px-4">
          <Tabs defaultValue="All" className="w-full space-y-8">
            <TabsList className="bg-secondary/50 p-1.5 h-14 rounded-full border border-gray-100 w-full md:w-fit overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="rounded-full px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">
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
                                    userProfile?.inventory?.activeWave === item.id ||
                                    userProfile?.inventory?.activeTheme === item.id;

                    return (
                      <Card key={item.id} className="relative overflow-hidden group border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all duration-300">
                        <div className={cn(
                          "aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden",
                          item.type === 'Theme' ? "p-0" : "bg-gradient-to-b from-secondary/30 to-transparent"
                        )}>
                          {item.type === 'Frame' ? (
                            <AvatarFrame frameId={item.id} className="w-32 h-32">
                               <Avatar className="w-full h-full border-2 border-white">
                                  <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} />
                                  <AvatarFallback className="font-black">U</AvatarFallback>
                               </Avatar>
                            </AvatarFrame>
                          ) : item.type === 'Theme' ? (
                            <div className="relative w-full h-full">
                               <Image src={item.imageUrl!} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                               <div className="absolute inset-0 bg-black/20" />
                            </div>
                          ) : (
                            <item.icon! className={cn("h-24 w-24 opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-500", item.color)} />
                          )}
                          
                          <Badge className="absolute top-6 right-6 bg-black/40 backdrop-blur-md text-white border-none font-black uppercase text-[8px] tracking-widest px-3 z-20">
                            {item.type}
                          </Badge>
                          
                          {item.isNew && (
                            <div className="absolute top-6 left-6 z-20">
                               <div className="bg-red-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse shadow-lg">New Frequency</div>
                            </div>
                          )}
                        </div>
                        <CardHeader className="text-center pb-2">
                          <CardTitle className="font-headline uppercase italic text-xl tracking-tighter">{item.name}</CardTitle>
                          <CardDescription className="text-xs font-body italic line-clamp-1">{item.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                          <div className="flex items-center justify-center gap-1 font-black text-2xl text-primary italic">
                            <GoldCoinIcon className="h-6 w-6" />
                            {item.price.toLocaleString()}
                          </div>
                          {isOwned ? (
                            <Button 
                              onClick={() => handleEquip(item)} 
                              className={cn("w-full h-12 rounded-2xl font-black uppercase italic shadow-lg transition-all", isActive ? "bg-green-500 hover:bg-green-600" : "bg-secondary text-foreground hover:bg-secondary/80")}
                            >
                              {isActive ? <><Check className="mr-2 h-4 w-4" /> Active</> : 'Equip'}
                            </Button>
                          ) : (
                            <Button onClick={() => handlePurchase(item)} className="w-full h-12 rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 bg-primary text-white hover:scale-[1.02]">
                              Sync Item
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
      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </AppLayout>
  );
}
