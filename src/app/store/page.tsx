'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Clock } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AvatarFrame } from '@/components/avatar-frame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

const STORE_ITEMS = [
  { id: 'ummy-cs', name: 'Ummy CS Majestic', type: 'Frame', price: 50000, description: 'The flagship emerald and gold Customer Service frame.', icon: Sparkles, color: 'text-green-500' },
  { id: 'f7', name: 'Celestial Wings', type: 'Frame', price: 15000, description: 'Tiered lavender wings with sovereign golden peaks.', icon: Sparkles, color: 'text-indigo-400' },
  { id: 'f6', name: 'Bronze Sky', type: 'Frame', price: 10000, description: 'Exquisite bronze laurel wreath with radiant gemstones.', icon: Sparkles, color: 'text-orange-400' },
  { id: 'f5', name: 'Golden wings', type: 'Frame', price: 200000, description: 'Ultra-detailed 3D luxury angelic frame.', icon: Sparkles, color: 'text-yellow-400' },
  { id: 'f4', name: 'Imperial Bloom', type: 'Frame', price: 20000, description: 'Exquisite purple roses and a majestic golden crown.', icon: Crown, color: 'text-purple-600' },
  { id: 'f1', name: 'Golden Official', type: 'Frame', price: 15000, description: 'The mark of ultimate authority.', icon: Star, color: 'text-yellow-500' },
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
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    // 7-DAY EXPIRATION PROTOCOL: Purchase automatically equips and sets expiry
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiryTimestamp = Timestamp.fromDate(expiryDate);

    const updateData: any = { 
      'wallet.coins': increment(-item.price), 
      'inventory.ownedItems': arrayUnion(item.id), 
      'updatedAt': serverTimestamp() 
    };

    if (item.type === 'Frame') {
      updateData['inventory.activeFrame'] = item.id;
      updateData['inventory.activeFrameExpiresAt'] = expiryTimestamp;
    }

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-item.price), 'updatedAt': serverTimestamp() });
    
    toast({ title: 'Purchase Successful', description: `${item.name} synchronized for 7 days.` });
  };

  const handleEquip = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    // Refresh 7-day window upon manual equip
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiryTimestamp = Timestamp.fromDate(expiryDate);

    const field = item.type === 'Frame' ? 'inventory.activeFrame' : item.type === 'Bubble' ? 'inventory.activeBubble' : 'inventory.activeWave';
    const updateData: any = { [field]: item.id, updatedAt: serverTimestamp() };
    
    if (item.type === 'Frame') {
      updateData['inventory.activeFrameExpiresAt'] = expiryTimestamp;
    }

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, updateData);
    
    if (item.type === 'Frame') {
      toast({ title: 'Frame Equipped', description: 'Expiration synchronized to 7 days from now.' });
    }
  };

  if (isLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors"><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
             <div>
                <h1 className="text-4xl font-bold font-headline uppercase italic tracking-tighter flex items-center gap-3">
                  <ShoppingBag className="text-primary h-10 w-10" /> Ummy Boutique
                </h1>
                <p className="text-muted-foreground font-body text-lg">Customize your frequency identity. All items valid for 7 days.</p>
             </div>
          </div>
          <div onClick={() => router.push('/wallet')} className="bg-gradient-to-br from-primary/20 to-primary/5 px-8 py-4 rounded-[2rem] border-2 border-primary/20 flex items-center gap-4 shadow-xl cursor-pointer">
            <GoldCoinIcon className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-primary">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary/60">Tap to Recharge</span>
            </div>
          </div>
        </header>

        <Tabs defaultValue="All" className="w-full space-y-8">
          <TabsList className="bg-secondary/50 p-1.5 h-14 rounded-full border border-white/50 w-full md:w-fit overflow-x-auto no-scrollbar">
            {['All', 'Frame', 'Bubble', 'Wave'].map(cat => (
              <TabsTrigger key={cat} value={cat} className="rounded-full px-8 font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-white">{cat}</TabsTrigger>
            ))}
          </TabsList>

          {['All', 'Frame', 'Bubble', 'Wave'].map(category => (
            <TabsContent key={category} value={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {STORE_ITEMS.filter(i => category === 'All' || i.type === category).map(item => {
                  const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
                  const isActive = userProfile?.inventory?.activeFrame === item.id || userProfile?.inventory?.activeBubble === item.id || userProfile?.inventory?.activeWave === item.id;
                  const expiry = userProfile?.inventory?.activeFrameExpiresAt?.toDate?.();

                  return (
                    <Card key={item.id} className="relative overflow-hidden group border-none shadow-lg rounded-[2.5rem] bg-white">
                      <div className="aspect-square bg-gradient-to-b from-secondary/30 to-transparent flex flex-col items-center justify-center p-10 relative">
                        {item.type === 'Frame' ? (
                          <AvatarFrame frameId={item.id} className="w-32 h-32">
                             <Avatar className="w-full h-full"><AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} /><AvatarFallback>U</AvatarFallback></Avatar>
                          </AvatarFrame>
                        ) : <item.icon className={cn("h-24 w-24 opacity-20", item.color)} />}
                        <Badge className="absolute top-6 right-6 bg-secondary/80 text-foreground border-none font-black uppercase text-[10px] tracking-widest px-3">{item.type}</Badge>
                        
                        {isActive && item.type === 'Frame' && expiry && (
                          <div className="absolute bottom-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[8px] font-black uppercase border border-white/10 shadow-lg">
                             <Clock className="h-2.5 w-2.5 text-yellow-400" />
                             {formatDistanceToNow(expiry)} left
                          </div>
                        )}
                      </div>
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="font-headline uppercase italic text-xl tracking-tighter">{item.name}</CardTitle>
                        <CardDescription className="text-xs font-body italic">{item.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                        <div className="flex items-center gap-1 font-black text-2xl text-primary italic"><GoldCoinIcon className="h-6 w-6" />{item.price.toLocaleString()}</div>
                        {isOwned ? (
                          <Button onClick={() => handleEquip(item)} className={cn("w-full h-12 rounded-2xl font-black uppercase italic shadow-lg", isActive ? "bg-green-500" : "bg-secondary text-foreground")}>
                            {isActive ? <><Check className="mr-2 h-4 w-4" /> Active</> : 'Equip'}
                          </Button>
                        ) : <Button onClick={() => handlePurchase(item)} className="w-full h-12 rounded-2xl font-black uppercase italic shadow-lg bg-primary text-white">Purchase (7d)</Button>}
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
