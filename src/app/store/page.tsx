
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Clock, PlayCircle } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AvatarFrame } from '@/components/avatar-frame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

const STORE_ITEMS = [
  { id: 'honor-2026', name: 'Honor 2026', type: 'Frame', price: 249999, stars: 2, description: 'Sovereign golden wings for the elite.', color: 'text-yellow-400' },
  { id: '2026-vibe', name: '2026', type: 'Frame', price: 249999, stars: 2, description: 'Celebrate the new frequency.', color: 'text-purple-400' },
  { id: 'snowman-gift', name: 'Snowman Gift', type: 'Frame', price: 249999, stars: 1, description: 'Holiday spirit synchronization.', color: 'text-blue-200' },
  { id: 'snowman-classic', name: 'Snowman', type: 'Frame', price: 249999, stars: 1, description: 'Winter wonderland signature.', color: 'text-cyan-100' },
  { id: 'little-devil', name: 'Little Devil', type: 'Frame', price: 499999, stars: 2, description: 'Mischievous neon frequency.', color: 'text-red-500' },
  { id: 'i-love-india', name: 'I love India', type: 'Frame', price: 249999, stars: 2, description: 'National pride identity.', color: 'text-green-500' },
  { id: 'ummy-cs', name: 'Ummy CS Majestic', type: 'Frame', price: 50000, stars: 2, description: 'Official service frame.', color: 'text-emerald-400' },
  { id: 'f7', name: 'Celestial Wings', type: 'Frame', price: 15000, stars: 1, description: 'Tiered lavender wings.', color: 'text-indigo-400' },
];

export default function StorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = (['Frame', 'Theme', 'Vehicle'] as const).reduce((acc, curr) => {
    return acc;
  }, 'Frame' as 'Frame' | 'Theme' | 'Vehicle' | 'Mine');

  const handlePurchase = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    const balance = userProfile.wallet?.coins || 0;
    if (balance < item.price) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Head to the vault to recharge.' });
      return;
    }

    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiryTimestamp = Timestamp.fromDate(expiryDate);

    const updateData: any = { 
      'wallet.coins': increment(-item.price), 
      'inventory.ownedItems': arrayUnion(item.id),
      [`inventory.expiries.${item.id}`]: expiryTimestamp,
      'updatedAt': serverTimestamp() 
    };

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-item.price), 'updatedAt': serverTimestamp() });
    
    toast({ title: 'Item Added to Bag', description: `${item.name} is yours for 7 days.` });
  };

  const handleEquip = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    const field = item.type === 'Frame' ? 'inventory.activeFrame' : item.type === 'Theme' ? 'inventory.activeTheme' : 'inventory.activeVehicle';
    const updateData: any = { [field]: item.id, updatedAt: serverTimestamp() };
    
    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, updateData);
    
    toast({ title: 'Item Equipped' });
  };

  if (isLoading) return <div className="h-screen w-full bg-[#0a1622] flex items-center justify-center"><Loader className="animate-spin text-primary h-10 w-10" /></div>;

  return (
    <AppLayout fullScreen>
      <div className="min-h-screen bg-[#0a1622] text-white font-headline flex flex-col relative pb-safe">
        
        {/* Header - High Fidelity Sync */}
        <header className="flex items-center justify-between p-6 pt-12 shrink-0">
           <button onClick={() => router.back()} className="p-1 hover:scale-110 transition-transform">
              <ChevronLeft className="h-7 w-7 text-white" />
           </button>
           <h1 className="text-xl font-black uppercase italic tracking-tighter absolute left-1/2 -translate-x-1/2">Store</h1>
           <button 
             onClick={() => router.push('/store?view=mine')} 
             className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity"
           >
             Mine
           </button>
        </header>

        <Tabs defaultValue="Frame" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 mb-6">
            <TabsList className="bg-transparent h-10 p-0 gap-8 justify-start border-none">
              {['Frame', 'Theme', 'Vehicle'].map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat} 
                  className="p-0 bg-transparent text-xl font-black uppercase italic tracking-tight text-white/40 data-[state=active]:text-[#facc15] data-[state=active]:bg-transparent relative transition-all"
                >
                  {cat}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#facc15] rounded-full opacity-0 data-[state=active]:opacity-100 transition-opacity" />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-4">
            {['Frame', 'Theme', 'Vehicle'].map((category) => (
              <TabsContent key={category} value={category} className="m-0 focus-visible:ring-0">
                <div className="grid grid-cols-2 gap-3 pb-24">
                  {STORE_ITEMS.filter(i => i.type === category).map((item) => {
                    const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
                    const isActive = userProfile?.inventory?.activeFrame === item.id;

                    return (
                      <div key={item.id} className="bg-[#12232f] rounded-2xl overflow-hidden shadow-2xl flex flex-col group relative">
                        {/* Preview Section */}
                        <div className="relative aspect-square flex items-center justify-center p-6">
                           <div className="absolute top-2 right-2 z-20">
                              <PlayCircle className="h-6 w-6 text-white/40 hover:text-white transition-colors cursor-pointer" />
                           </div>
                           
                           <AvatarFrame frameId={item.id} size="lg" className="w-24 h-24">
                              <Avatar className="w-full h-full border-none shadow-none">
                                 <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} unoptimized />
                                 <AvatarFallback className="bg-transparent">U</AvatarFallback>
                              </Avatar>
                           </AvatarFrame>
                        </div>

                        {/* Metadata Section */}
                        <div className="flex flex-col items-center gap-1 pb-3 px-2">
                           <div className="flex items-center gap-0.5">
                              {[...Array(item.stars)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 text-[#facc15] fill-current" />
                              ))}
                           </div>
                           <h3 className="text-[13px] font-black uppercase text-white/90 truncate w-full text-center tracking-tight">
                              {item.name}
                           </h3>
                        </div>

                        {/* Integrated Price/Period Bar */}
                        <div className="mt-auto">
                           <button 
                             onClick={() => isOwned ? handleEquip(item) : handlePurchase(item)}
                             className={cn(
                               "w-full h-10 flex items-center justify-center gap-1.5 transition-all active:scale-95",
                               isActive ? "bg-green-600" : "bg-[#0a1a2a] hover:bg-[#0d2235]"
                             )}
                           >
                              {isActive ? (
                                <span className="text-[10px] font-black uppercase">Equipped</span>
                              ) : isOwned ? (
                                <span className="text-[10px] font-black uppercase">Wear</span>
                              ) : (
                                <>
                                  <GoldCoinIcon className="h-4 w-4" />
                                  <span className="text-[12px] font-black text-[#facc15] italic">{item.price.toLocaleString()}</span>
                                  <span className="text-[10px] font-bold text-white/40">/7 Days</span>
                                </>
                              )}
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        {/* Global Wallet Sync Info */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a1622]/90 backdrop-blur-md border-t border-white/5 flex items-center justify-between z-50">
           <div className="flex items-center gap-2">
              <GoldCoinIcon className="h-5 w-5" />
              <span className="text-sm font-black text-[#facc15]">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
           </div>
           <button onClick={() => router.push('/wallet')} className="flex items-center gap-1 text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors">
              Recharge <ChevronRight className="h-3 w-3" />
           </button>
        </div>

      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </AppLayout>
  );
}
