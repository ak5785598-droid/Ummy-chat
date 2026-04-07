'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Eye, Heart, Zap } from 'lucide-react'; 
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
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { ItemPreview } from '@/components/item-preview';

// --- CUSTOM 3D DESIGN COMPONENT ---
const LaurelRibbonFrame = ({ className = "w-20 h-20 md:w-24 md:h-24" }) => {
  return (
    <div className={cn("relative flex items-center justify-center p-2 group", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}>
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff8b5" />
            <stop offset="50%" stopColor="#fcc132" />
            <stop offset="100%" stopColor="#db8723" />
          </linearGradient>
          <linearGradient id="pinkRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffb2d1" />
            <stop offset="100%" stopColor="#e91e63" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGrad)" strokeWidth="5" strokeDasharray="4,2" />
        <path d="M15 82 Q50 72 85 82 L88 92 Q50 82 12 92 Z" fill="url(#pinkRibbon)" stroke="#ad1457" strokeWidth="1" />
        <circle cx="50" cy="5" r="4" fill="#ffd700" />
        <circle cx="95" cy="50" r="3" fill="#fff" opacity="0.8" />
        <circle cx="5" cy="50" r="3" fill="#fff" opacity="0.8" />
      </svg>
      <div className="absolute inset-[20%] rounded-full overflow-hidden border-2 border-white/40 shadow-inner">
        <Avatar className="w-full h-full">
          <AvatarImage src={`https://picsum.photos/seed/luxury/200`} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

const STATIC_STORE_ITEMS = [
  // --- FRAMES ---
  { 
    id: 'laurel-ribbon-3d', 
    name: 'Petal Sovereignty V2', 
    type: 'Frame', 
    price: 3000000, 
    durationDays: 30, 
    description: 'Exclusive 3D CSS laurel wreath with ribbon. Pure code design.', 
    icon: Crown, 
    color: 'text-yellow-500',
    isCustomRender: true 
  },
  { id: 'supreme-king', name: 'Legendary King', type: 'Frame', price: 1250000, durationDays: 30, description: '24k Gold Glow ruler frame.', icon: Crown, color: 'text-yellow-500' },
  { id: 'rose-gold', name: 'Royal Rose', type: 'Frame', price: 750000, durationDays: 30, description: 'Elegant golden vines with roses.', icon: Heart, color: 'text-red-500' },
  { id: 'top3family', name: 'Sovereign Crystal Pink', type: 'Frame', price: 500000, durationDays: 30, description: 'Pink crystal elite family frame.', icon: Crown, color: 'text-pink-500' },
  { id: 'top2family', name: 'Sovereign Crystal Blue', type: 'Frame', price: 750000, durationDays: 30, description: 'Blue frost diamond frame.', icon: Crown, color: 'text-blue-500' },
  { id: 'neon-2025', name: 'Cybernetic Aura', type: 'Frame', price: 300000, durationDays: 30, description: 'Cyberpunk holographic ring.', icon: Sparkles, color: 'text-purple-500' },
  
  // --- BUBBLES ---
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 30, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 30, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
  { id: 'evil-bubble', name: 'Evil Bubble', type: 'Bubble', price: 10495, durationDays: 30, description: 'Dark aura with devil horns.', icon: MessageSquare, color: 'text-purple-600' },
  { id: 'taurus-2025', name: 'Taurus 2025', type: 'Bubble', price: 50000, durationDays: 30, description: 'Earthy golden constellation bubble.', icon: Sparkles, color: 'text-yellow-600' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 30, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },

  // --- WAVES ---
  { id: 'w1', name: 'Ocean Waves', type: 'Wave', price: 5000, durationDays: 7, description: 'Dynamic blue voice frequency.', icon: Mic2, color: 'text-cyan-500' },
  { id: 'w2', name: 'Fire Pulse', type: 'Wave', price: 8000, durationDays: 7, description: 'Animated red heat frequency.', icon: Zap, color: 'text-orange-500' },
];

export default function StorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [previewItem, setPreviewItem] = useState<any>(null);

  const themesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'roomThemes'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: dbThemes } = useCollection(themesQuery);

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
    if ((userProfile?.wallet?.coins || 0) < item.price) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (item.durationDays || 7));
    
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    const updateData = { 
      'wallet.coins': increment(-item.price), 
      'inventory.ownedItems': arrayUnion(item.id),
      [`inventory.expiries.${item.id}`]: Timestamp.fromDate(expiryDate),
      'updatedAt': serverTimestamp() 
    };

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-item.price), 'updatedAt': serverTimestamp() });
    toast({ title: 'Purchase Successful', description: `${item.name} unlocked!` });
  };

  const handleEquip = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    let field = '';
    if (item.type === 'Frame') field = 'inventory.activeFrame';
    else if (item.type === 'Theme') field = 'inventory.activeTheme';
    else if (item.type === 'Bubble') field = 'inventory.activeBubble';
    else if (item.type === 'Wave') field = 'inventory.activeWave';

    updateDocumentNonBlocking(profileRef, { [field]: item.id, updatedAt: serverTimestamp() });
    toast({ title: 'Item Equipped' });
  };

  if (isProfileLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f3e5f5]"><Loader className="animate-spin text-primary h-8 w-8" /></div>;

  return (
    <div className="min-h-screen bg-[#f3e5f5] pb-safe">
      <div className="space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-6 pb-24">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/10 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors"><ChevronLeft className="h-6 w-6 text-slate-800" /></button>
            <h1 className="text-3xl font-black uppercase flex items-center gap-2 text-slate-900">
              <ShoppingBag className="text-primary h-8 w-8" /> Boutique
            </h1>
          </div>
          <div onClick={() => router.push('/wallet')} className="bg-white/80 px-6 py-3 rounded-2xl border-2 border-primary/20 flex items-center gap-4 cursor-pointer shadow-sm">
            <GoldCoinIcon className="h-8 w-8" />
            <span className="text-2xl font-black text-primary">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
          </div>
        </header>

        <Tabs defaultValue="All" className="w-full space-y-6">
          <TabsList className="bg-white/60 p-1.5 h-12 rounded-full border border-primary/10 shadow-sm overflow-x-auto no-scrollbar">
            {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(cat => (
              <TabsTrigger key={cat} value={cat} className="rounded-full px-6 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white uppercase tracking-wider">{cat}</TabsTrigger>
            ))}
          </TabsList>

          {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(category => (
            <TabsContent key={category} value={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {allItems.filter(i => category === 'All' || i.type === category).map(item => {
                  const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
                  const isActive = [userProfile?.inventory?.activeFrame, userProfile?.inventory?.activeTheme, userProfile?.inventory?.activeBubble, userProfile?.inventory?.activeWave].includes(item.id);
                  
                  return (
                    <Card key={item.id} className="relative overflow-hidden group border-none shadow-sm rounded-[1.5rem] bg-white ring-1 ring-black/5">
                      <div className="aspect-square bg-slate-50 flex flex-col items-center justify-center p-4 relative">
                        {item.type === 'Frame' ? (
                          (item as any).isCustomRender ? (
                            <LaurelRibbonFrame />
                          ) : (
                            <AvatarFrame frameId={item.id} className="w-20 h-20 md:w-24 md:h-24">
                              <Avatar className="w-full h-full border-2 border-slate-200 shadow-xl overflow-hidden"><AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} /></Avatar>
                            </AvatarFrame>
                          )
                        ) : item.type === 'Theme' ? (
                          <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-white shadow-sm">
                            <Image src={(item as any).url || `https://picsum.photos/seed/${item.id}/400/200`} alt={item.name} fill className="object-cover" unoptimized />
                          </div>
                        ) : item.type === 'Bubble' ? (
                          <div className="w-full flex justify-center py-4">
                            <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px] min-w-[100px] text-center shadow-sm">
                              Sample Text
                            </ChatMessageBubble>
                          </div>
                        ) : (
                          <div className={cn("opacity-40", (item as any).color)}><item.icon size={56} /></div>
                        )}
                        <Badge className="absolute top-2 right-2 bg-white/90 text-slate-800 border-none font-bold text-[8px] px-1.5 py-0.5 rounded-md shadow-sm uppercase">{item.type}</Badge>
                        <button onClick={() => setPreviewItem(item)} className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/5 flex items-center justify-center transition-all cursor-zoom-in">
                          <span className="bg-white px-4 py-2 rounded-full text-[10px] font-black text-primary shadow-lg flex items-center gap-1 uppercase tracking-tighter"><Eye size={12}/> Try On</span>
                        </button>
                      </div>
                      
                      <CardHeader className="text-center p-3">
                        <CardTitle className="text-sm font-black truncate uppercase tracking-tight">{item.name}</CardTitle>
                        <CardDescription className="text-[9px] truncate font-medium text-slate-500">{item.description}</CardDescription>
                      </CardHeader>
                      
                      <CardFooter className="flex flex-col gap-2.5 p-3 pt-0">
                        <div className="flex items-center justify-center gap-1 font-black text-lg text-primary ">
                          <GoldCoinIcon className="h-4 w-4" />
                          {item.price.toLocaleString()}
                        </div>
                        {isOwned ? (
                          <Button onClick={() => handleEquip(item)} className={cn("w-full h-9 rounded-xl text-[10px] font-black uppercase tracking-widest", isActive ? "bg-green-500 text-white shadow-inner" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                            {isActive ? <><Check className="mr-1 h-3 w-3" /> Active</> : 'Equip'}
                          </Button>
                        ) : (
                          <Button onClick={() => handlePurchase(item)} className="w-full h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary/90 shadow-md active:scale-95 transition-all">
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
        
        <ItemPreview isOpen={!!previewItem} onClose={() => setPreviewItem(null)} item={previewItem} />
      </div>
    </div>
  );
  }
             
