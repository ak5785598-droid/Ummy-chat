'use client';

import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette, Heart } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AvatarFrame } from '@/components/avatar-frame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const STATIC_STORE_ITEMS = [
 // BUBBLES (20)
 { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 30, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
 { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 30, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
 { id: 'evil-bubble', name: 'Evil Bubble', type: 'Bubble', price: 10495, durationDays: 30, description: 'Dark aura with devil horns.', icon: MessageSquare, color: 'text-purple-600' },
 { id: 'candy-bubble', name: 'Candy Bubble', type: 'Bubble', price: 8995, durationDays: 30, description: 'Sweet pink with lollipop decals.', icon: MessageSquare, color: 'text-pink-300' },
 { id: 'taurus-2025', name: 'Taurus 2025', type: 'Bubble', price: 50000, durationDays: 30, description: 'Earthy golden constellation bubble.', icon: Sparkles, color: 'text-yellow-600' },
 { id: 'cricket-2025', name: 'Cricket 2025', type: 'Bubble', price: 40000, durationDays: 30, description: 'Stadium green sporty bubble.', icon: MessageSquare, color: 'text-green-600' },
 { id: 'gemini-2025', name: 'Gemini 2025', type: 'Bubble', price: 50000, durationDays: 30, description: 'Mystic blue constellation bubble.', icon: Sparkles, color: 'text-blue-500' },
 { id: 'cancer-2025', name: 'Cancer 2025', type: 'Bubble', price: 50000, durationDays: 30, description: 'Pearl pink constellation bubble.', icon: Sparkles, color: 'text-rose-400' },
 { id: 'leo-2025', name: 'Leo 2025', type: 'Bubble', price: 50000, durationDays: 30, description: 'Fiery gold constellation bubble.', icon: Sparkles, color: 'text-orange-500' },
 { id: 'neon-cyber', name: 'Neon Cyber', type: 'Bubble', price: 25000, durationDays: 30, description: 'Glowing cyan tech bubble.', icon: MessageSquare, color: 'text-cyan-400' },
 { id: 'royal-gold', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 30, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },
 { id: 'toxic-slime', name: 'Toxic Slime', type: 'Bubble', price: 12000, durationDays: 30, description: 'Dripping neon green chat bubble.', icon: MessageSquare, color: 'text-green-400' },
 { id: 'ice-crystal', name: 'Ice Crystal', type: 'Bubble', price: 15000, durationDays: 30, description: 'Frozen blue frosty edges.', icon: Sparkles, color: 'text-blue-200' },
 { id: 'fire-demon', name: 'Fire Demon', type: 'Bubble', price: 18000, durationDays: 30, description: 'Burning red chat bubble.', icon: MessageSquare, color: 'text-orange-600' },
 { id: 'angel-halo', name: 'Angel Halo', type: 'Bubble', price: 22000, durationDays: 30, description: 'Pure white with glowing halo top.', icon: Sparkles, color: 'text-slate-100' },
 { id: 'pixel-retro', name: 'Pixel Retro', type: 'Bubble', price: 5000, durationDays: 30, description: '8-bit nostalgic chat style.', icon: MessageSquare, color: 'text-gray-400' },
 { id: 'rainbow-dash', name: 'Rainbow Dash', type: 'Bubble', price: 30000, durationDays: 30, description: 'Animated rgb flowing colors.', icon: Sparkles, color: 'text-purple-400' },
 { id: 'dark-matter', name: 'Dark Matter', type: 'Bubble', price: 100000, durationDays: 30, description: 'Vantablack infinite void bubble.', icon: Star, color: 'text-gray-900' },
 { id: 'b1', name: 'Kawaii Pink', type: 'Bubble', price: 2000, durationDays: 7, description: 'Soft pink chat bubbles.', icon: MessageSquare, color: 'text-pink-400' },
 { id: 'ocean-waves-bubble', name: 'Ocean Waves', type: 'Bubble', price: 6000, durationDays: 7, description: 'Dynamic blue ripple effect.', icon: Mic2, color: 'text-cyan-500' },

 // FRAMES (70)
 { id: 'fuffy', name: 'Fuffy', type: 'Frame', price: 17985, durationDays: 30, description: 'Cute kitty bow with magic dust.', icon: Sparkles, color: 'text-blue-300' },
 { id: 'sea-n-sands', name: 'Sea n Sands', type: 'Frame', price: 7495, durationDays: 30, description: 'Tropical summer vibes with slices of fruit.', icon: Sparkles, color: 'text-cyan-400' },
 { id: 'basra', name: 'Basra', type: 'Frame', price: 6995, durationDays: 30, description: 'Earthy vine with a magic teapot.', icon: Sparkles, color: 'text-green-700' },
 { id: 'butterflies', name: 'Butterflies', type: 'Frame', price: 4995, durationDays: 30, description: 'Swirling purple butterflies.', icon: Sparkles, color: 'text-purple-400' },
 { id: 'top3family', name: 'Top 3 Family', type: 'Frame', price: 500000, durationDays: 30, description: 'Exclusive pink crystal sovereign frame.', icon: Crown, color: 'text-pink-500' },
 { id: 'top2family', name: 'Top 2 Family', type: 'Frame', price: 750000, durationDays: 30, description: 'Exclusive blue frost diamond frame.', icon: Crown, color: 'text-blue-500' },
 { id: 'pink-love', name: 'Pink Love', type: 'Frame', price: 1500000, durationDays: 30, description: 'Massive animated heart trail.', icon: Heart, color: 'text-pink-400' },
 { id: 'rose-gold', name: 'Rose Gold', type: 'Frame', price: 1500000, durationDays: 30, description: 'Elegant golden vines and roses.', icon: Sparkles, color: 'text-yellow-600' },
 { id: 'blue-wings', name: 'Blue Wings', type: 'Frame', price: 1500000, durationDays: 30, description: 'Frost angel wings pulsating.', icon: Sparkles, color: 'text-cyan-200' },
 { id: 'birthday-party', name: 'Birthday Party', type: 'Frame', price: 20000000, durationDays: 30, description: 'Ultimate multi-tiered birthday celebration.', icon: Sparkles, color: 'text-orange-400' },
 { id: 'birthday-cake', name: 'Birthday Cake', type: 'Frame', price: 20000000, durationDays: 30, description: 'Massive cake with gold cars.', icon: Sparkles, color: 'text-yellow-400' },
 { id: 'neon-2025', name: 'Neon 2025', type: 'Frame', price: 1500000, durationDays: 30, description: 'Cyberpunk holographic glowing ring.', icon: Sparkles, color: 'text-purple-500' },
 { id: 'gold-mosque', name: 'Gold Mosque', type: 'Frame', price: 375000, durationDays: 30, description: 'Ramadan inspired golden crescents.', icon: Sparkles, color: 'text-yellow-500' },
 { id: 'blue-roses', name: 'Blue Roses', type: 'Frame', price: 300000, durationDays: 30, description: 'Ethereal glowing frozen petals.', icon: Sparkles, color: 'text-blue-300' },
 { id: 'angel-wings', name: 'Angel Wings', type: 'Frame', price: 325000, durationDays: 30, description: 'Divine golden heavenly wings.', icon: Sparkles, color: 'text-yellow-200' },
 { id: 'cat-headphones', name: 'Cat Headphones', type: 'Frame', price: 125000, durationDays: 30, description: 'Cute rgb gamer aesthetic.', icon: Sparkles, color: 'text-pink-400' },
 { id: 'lanterns', name: 'Lanterns', type: 'Frame', price: 200000, durationDays: 30, description: 'Festive red traditional lanterns.', icon: Sparkles, color: 'text-red-500' },
 { id: 'ruby-crown', name: 'Ruby Crown', type: 'Frame', price: 150000, durationDays: 30, description: 'Imperial red gem sovereignty.', icon: Crown, color: 'text-red-600' },
 { id: 'supreme-king', name: 'Supreme King', type: 'Frame', price: 1250000, durationDays: 30, description: 'The absolute ruler golden frame.', icon: Crown, color: 'text-yellow-500' },
 { id: 'silver-crest', name: 'Silver Crest', type: 'Frame', price: 50000, durationDays: 30, description: 'Polished elite silver knight.', icon: Sparkles, color: 'text-gray-300' },
 { id: 'emerald-leaf', name: 'Emerald Leaf', type: 'Frame', price: 40000, durationDays: 30, description: 'Mystic green forest defender.', icon: Sparkles, color: 'text-green-400' },
 { id: 'blue-knight', name: 'Blue Knight', type: 'Frame', price: 40000, durationDays: 30, description: 'Sapphire sharp crystal edges.', icon: Sparkles, color: 'text-blue-600' },
 { id: 'rose-ring', name: 'Rose Ring', type: 'Frame', price: 1500000, durationDays: 30, description: 'Blooming animated red roses.', icon: Heart, color: 'text-red-400' },
 { id: 'purple-bow', name: 'Purple Bow', type: 'Frame', price: 750000, durationDays: 30, description: 'Cute large lavendar ribbon.', icon: Sparkles, color: 'text-purple-300' },
 { id: 'f7', name: 'Celestial Wings', type: 'Frame', price: 15000, durationDays: 7, description: 'Tiered lavender wings.', icon: Sparkles, color: 'text-indigo-400' },
 { id: 'f6', name: 'Bronze Sky', type: 'Frame', price: 10000, durationDays: 7, description: 'Bronze laurel wreath.', icon: Sparkles, color: 'text-orange-400' },
 { id: 'f5', name: 'Golden wings', type: 'Frame', price: 200000, durationDays: 7, description: '3D luxury angelic frame.', icon: Sparkles, color: 'text-yellow-400' },
 { id: 'f4', name: 'Imperial Bloom', type: 'Frame', price: 20000, durationDays: 7, description: 'Purple roses and a crown.', icon: Crown, color: 'text-purple-600' },
 { id: 'f1', name: 'Golden Official', type: 'Frame', price: 15000, durationDays: 7, description: 'The mark of ultimate authority.', icon: Star, color: 'text-yellow-500' },
 
 // Generating the remaining standard frames functionally for code compactness but user inventory availability.
 ...Array.from({ length: 41 }).map((_, i) => ({
  id: `frame-gen-${i+1}`,
  name: `Aura Elite Vol.${i+1}`,
  type: 'Frame',
  price: 5000 + (Math.floor(Math.random() * 50) * 1000),
  durationDays: 30,
  description: `Dynamic elemental animated aura signature frame #${i+1}.`,
  icon: Sparkles,
  color: ['text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400', 'text-cyan-400'][i % 6]
 })),

 // Waves
 { id: 'w1', name: 'Ocean Waves', type: 'Wave', price: 5000, durationDays: 7, description: 'Dynamic blue voice frequency.', icon: Mic2, color: 'text-cyan-500' },
];

export default function StorePage() {
 const router = useRouter();
 const { user } = useUser();
 const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const themesQuery = useMemoFirebase(() => {
  if (!firestore) return null;
  return query(collection(firestore, 'roomThemes'), orderBy('createdAt', 'desc'));
 }, [firestore]);

 const { data: dbThemes, isLoading: isThemesLoading } = useCollection(themesQuery);

 const dynamicThemes = useMemo(() => {
  return (dbThemes || []).filter(t => (t.price || 0) > 0).map(t => ({
   ...t,
   type: 'Theme',
   description: t.description || `High-fidelity ${t.name} frequency.`
  }));
 }, [dbThemes]);

 const allItems = [...STATIC_STORE_ITEMS, ...dynamicThemes];

 const handlePurchase = (item: any) => {
  if (!userProfile || !user || !firestore) return;
  const balance = userProfile.wallet?.coins || 0;
  if (balance < item.price) {
   toast({ variant: 'destructive', title: 'Insufficient Coins' });
   return;
  }

  const durationDays = item.durationDays || 7;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  const expiryTimestamp = Timestamp.fromDate(expiryDate);

  const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
  const userRef = doc(firestore, 'users', user.uid);
  
  const updateData = { 
   'wallet.coins': increment(-item.price), 
   'inventory.ownedItems': arrayUnion(item.id),
   [`inventory.expiries.${item.id}`]: expiryTimestamp,
   'updatedAt': serverTimestamp() 
  };

  updateDocumentNonBlocking(profileRef, updateData);
  updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-item.price), 'updatedAt': serverTimestamp() });
  toast({ title: 'Purchase Successful', description: `${item.name} added to your bag for ${durationDays} days.` });
 };

 const handleEquip = (item: any) => {
  if (!userProfile || !user || !firestore) return;
  const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
  const userRef = doc(firestore, 'users', user.uid);
  
  let field = '';
  if (item.type === 'Frame') field = 'inventory.activeFrame';
  else if (item.type === 'Theme') field = 'inventory.activeTheme';
  else if (item.type === 'Bubble') field = 'inventory.activeBubble';
  else if (item.type === 'Wave') field = 'inventory.activeWave';

  const updateData = { [field]: item.id, updatedAt: serverTimestamp() };
  updateDocumentNonBlocking(profileRef, updateData);
  updateDocumentNonBlocking(userRef, updateData);
  toast({ title: 'Item Equipped' });
 };

 if (isProfileLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin" /></div></AppLayout>;

 return (
  <AppLayout>
   <div className="space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
     <div className="flex items-center gap-4">
       <button onClick={() => router.back()} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors"><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
       <div>
        <h1 className="text-4xl font-bold font-sans uppercase tracking-tight flex items-center gap-3 text-slate-900">
         <ShoppingBag className="text-primary h-10 w-10" /> Ummy Boutique
        </h1>
        <p className="text-muted-foreground font-body text-lg">Customize your frequency identity.</p>
       </div>
     </div>
     <div onClick={() => router.push('/wallet')} className="bg-gradient-to-br from-primary/20 to-primary/5 px-8 py-4 rounded-2xl border-2 border-primary/20 flex items-center gap-4 shadow-xl cursor-pointer">
      <GoldCoinIcon className="h-10 w-10" />
      <div className="flex flex-col">
       <span className="text-3xl font-bold text-primary ">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
       <span className="text-[10px] uppercase font-bold tracking-wider text-primary/60">Tap to Recharge</span>
      </div>
     </div>
    </header>

    <Tabs defaultValue="All" className="w-full space-y-8">
     <TabsList className="bg-secondary/50 p-1.5 h-14 rounded-full border border-white/50 w-full md:w-fit overflow-x-auto no-scrollbar">
      {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(cat => (
       <TabsTrigger key={cat} value={cat} className="rounded-full px-8 font-bold uppercase tracking-wider text-xs data-[state=active]:bg-primary data-[state=active]:text-white">{cat}</TabsTrigger>
      ))}
     </TabsList>

     {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(category => (
      <TabsContent key={category} value={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allItems.filter(i => category === 'All' || i.type === category).map(item => {
         const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
         const isActive = userProfile?.inventory?.activeFrame === item.id || userProfile?.inventory?.activeTheme === item.id || userProfile?.inventory?.activeBubble === item.id || userProfile?.inventory?.activeWave === item.id;
         
         return (
          <Card key={item.id} className="relative overflow-hidden group border-none shadow-lg rounded-3xl bg-white">
           <div className="aspect-square bg-gradient-to-b from-secondary/30 to-transparent flex flex-col items-center justify-center p-10 relative">
            {item.type === 'Frame' ? (
             <AvatarFrame frameId={item.id} className="w-32 h-24">
               <Avatar className="w-full h-full border-4 border-white shadow-xl"><AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} /><AvatarFallback>U</AvatarFallback></Avatar>
             </AvatarFrame>
            ) : item.type === 'Theme' ? (
             <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl border-4 border-white">
               <Image src={item.url} alt={item.name} fill className="object-cover" unoptimized />
             </div>
            ) : <item.icon className={cn("h-24 w-24 opacity-20", item.color)} />}
            <Badge className="absolute top-6 right-6 bg-white/80 backdrop-blur-md text-foreground border-none font-bold uppercase text-[10px] tracking-wider px-3 shadow-sm">{item.type}</Badge>
           </div>
           <CardHeader className="text-center pb-2">
            <CardTitle className="font-sans uppercase text-xl tracking-tight text-slate-900">{item.name}</CardTitle>
            <CardDescription className="text-xs font-body ">{item.description}</CardDescription>
           </CardHeader>
           <CardFooter className="flex flex-col gap-4 p-8 pt-4">
            <div className="flex items-center gap-1 font-bold text-2xl text-primary ">
              <GoldCoinIcon className="h-6 w-6" />
              {item.price.toLocaleString()}
              {item.durationDays && <span className="text-[10px] font-bold text-slate-400 ml-1">/ {item.durationDays}d</span>}
            </div>
            {isOwned ? (
             <Button onClick={() => handleEquip(item)} className={cn("w-full h-12 rounded-2xl font-bold uppercase shadow-lg", isActive ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {isActive ? <><Check className="mr-2 h-4 w-4" /> Active</> : 'Equip'}
             </Button>
            ) : (
             <Button onClick={() => handlePurchase(item)} className="w-full h-12 rounded-2xl font-bold uppercase shadow-xl bg-primary text-white hover:bg-primary/90 transition-all active:scale-95">
               Purchase Now
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
