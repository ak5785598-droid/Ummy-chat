'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette, Heart, Zap, Eye, Circle, X } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { ItemPreview } from '@/components/item-preview';
import { AVATAR_FRAMES, type AvatarFrameConfig } from '@/constants/avatar-frames';
import { AvatarFrame } from '@/components/avatar-frame';

// --- PREMIUM AVATAR FRAME COMPONENT ---
interface PremiumAvatarFrameProps {
  imageUrl: string;
  size?: number;
  className?: string;
}

const PremiumAvatarFrame = ({ imageUrl, size = 120, className = "" }: PremiumAvatarFrameProps) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] z-10">
        <defs>
          <linearGradient id="premiumGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FDF0AD' }} />
            <stop offset="20%" style={{ stopColor: '#D4AF37' }} />
            <stop offset="50%" style={{ stopColor: '#FFFCEB' }} />
            <stop offset="80%" style={{ stopColor: '#BD9731' }} />
            <stop offset="100%" style={{ stopColor: '#8A6E00' }} />
          </linearGradient>
          <filter id="metalRelief" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="35" lightingColor="white" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        </defs>
        <g filter="url(#metalRelief)" stroke="#5c4300" strokeWidth="0.5">
          <path d="M100 240 C50 240 30 180 50 130 L95 155 C80 185 85 210 100 235 Z" fill="url(#premiumGold)" />
          <path d="M300 240 C350 240 370 180 350 130 L305 155 C320 185 315 210 300 235 Z" fill="url(#premiumGold)" />
        </g>
        <circle cx="200" cy="200" r="108" fill="none" stroke="#3d2d00" strokeWidth="12" />
        <circle cx="200" cy="200" r="102" fill="none" stroke="url(#premiumGold)" strokeWidth="8" filter="url(#metalRelief)" />
        <g filter="url(#metalRelief)">
          <path d="M125 105 L105 40 L160 75 L200 15 L240 75 L295 40 L275 105 Z" fill="url(#premiumGold)" stroke="#5c4300" strokeWidth="1" />
        </g>
        <g filter="url(#metalRelief)">
          <path d="M160 280 Q200 350 240 280 L230 265 Q200 280 170 265 Z" fill="url(#premiumGold)" stroke="#4a3700" />
        </g>
        <g className="animate-pulse">
          <circle cx="200" cy="15" r="4" fill="white" className="blur-[2px]" />
          <circle cx="105" cy="40" r="2" fill="white" className="blur-[1px]" />
          <circle cx="295" cy="40" r="2" fill="white" className="blur-[1px]" />
        </g>
      </svg>
      <div className="absolute overflow-hidden rounded-full border-[3px] border-[#1a1300] z-0" style={{ width: '43%', height: '43%' }}>
        <img src={imageUrl} alt="User Avatar" className="w-full h-full object-cover brightness-105" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

// --- STORE ITEMS (UPDATED WITH NEW WAVES) ---
const STATIC_STORE_ITEMS = [
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 30, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 30, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 30, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },
  { id: 'supreme-king', name: 'Legendary King', type: 'Frame', price: 1250000, durationDays: 30, description: 'The absolute ruler with 24k Gold Glow.', icon: Crown, color: 'text-yellow-500' },
  { id: 'elite-mythic-gold', name: 'Mythic Gold Elite', type: 'Frame', price: 5000000, durationDays: 30, description: 'Ultimate multi-tiered golden aura.', icon: Crown, color: 'text-yellow-400' },
  { id: 'angel-wings', name: 'Angel Wings', type: 'Frame', price: 325000, durationDays: 30, description: 'Divine golden heavenly wings.', icon: Sparkles, color: 'text-yellow-200' },
  { id: 'ruby-crown', name: 'Ruby Crown', type: 'Frame', price: 150000, durationDays: 30, description: 'Imperial red gem sovereignty.', icon: Crown, color: 'text-red-600' },
  { id: 'w1', name: 'Ocean Waves', type: 'Wave', price: 5000, durationDays: 7, description: 'Dynamic blue voice frequency.', icon: Mic2, color: 'text-cyan-500' },
  
  // --- NEW WAVES ADDED HERE ---
  { id: 'w-sky', name: 'Sky Voice Wave', type: 'Wave', price: 9999, durationDays: 7, description: 'Premium blue circular voice frequency.', icon: Circle, color: 'text-blue-500' },
  { id: 'w-butterfly', name: 'Butterfly Waves', type: 'Wave', price: 7999, durationDays: 7, description: 'Elegant purple rhythmic wave.', icon: Circle, color: 'text-purple-500' },
  { id: 'w-wing', name: 'Wing', type: 'Wave', price: 49999, durationDays: 7, description: 'Elite pink wing pattern frequency.', icon: Circle, color: 'text-pink-500' },
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
      description: t.description || `High-fidelity ${t.name} background.`
    }));
  }, [dbThemes]);

  const frameItems = useMemo(() => {
    // 1. None Option
    const frames = [{
      id: 'None',
      name: 'Identity Cleanse',
      type: 'Frame',
      price: 0,
      description: 'Remove current frame and show default avatar aura.',
      icon: X,
      color: 'text-slate-400'
    }];

    // 2. Map all items from registry
    (Object.values(AVATAR_FRAMES) as AvatarFrameConfig[]).forEach(f => {
      frames.push({
        ...f,
        type: 'Frame',
        price: 0, // In this version, all frames are listed as owned/available if they are in registry
        description: `Premium ${f.tier} identity frame.`
      } as any);
    });

    return frames;
  }, []);

  const allItems = [...STATIC_STORE_ITEMS, ...dynamicThemes, ...frameItems];

  const handlePurchase = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    if ((userProfile.wallet?.coins || 0) < item.price) {
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
    toast({ title: 'Purchase Successful' });
  };

  const handleEquip = (item: any) => {
    if (!userProfile || !user || !firestore) return;
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    let field = `inventory.active${item.type}`;
    const updateData = { [field]: item.id === 'None' ? 'None' : item.id, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, updateData);
    toast({ title: item.id === 'None' ? 'Frame Removed' : 'Item Equipped' });
  };

  if (isProfileLoading) return <div className="flex min-h-screen items-center justify-center"><Loader className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f3e5f5] pb-safe">
      <div className="space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-6 pb-24">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white rounded-full"><ChevronLeft /></button>
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag className="text-primary" /> Ummy Boutique
            </h1>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
            <GoldCoinIcon className="h-8 w-8" />
            <span className="text-2xl font-black text-primary">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
          </div>
        </header>

        {/* TABS LIST: Scrollable functionality added here */}
        <Tabs defaultValue="All" className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar mb-6">
            <TabsList className="bg-white/60 p-1 rounded-full inline-flex min-w-full md:min-w-0">
              {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(cat => (
                <TabsTrigger key={cat} value={cat} className="rounded-full px-8 font-bold whitespace-nowrap">{cat}</TabsTrigger>
              ))}
            </TabsList>
          </div>

          {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allItems.filter(i => category === 'All' || i.type === category).map(item => {
                  const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
                  const isActive = userProfile?.inventory?.[`active${item.type}` as keyof typeof userProfile.inventory] === item.id;
                  
                  return (
                    <Card key={item.id} className="overflow-hidden rounded-[1.5rem] bg-white border-none shadow-sm">
                      <div className="aspect-square bg-slate-50 flex items-center justify-center p-4 relative">
                        {item.type === 'Frame' ? (
                          <div className="scale-110">
                            {item.id === 'None' ? (
                              <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                                <X className="h-10 w-10 text-slate-300" />
                              </div>
                            ) : (
                              <AvatarFrame frameId={item.id} size="md">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} />
                                  <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                              </AvatarFrame>
                            )}
                          </div>
                        ) : item.type === 'Bubble' ? (
                          <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px]">Hello Ummy</ChatMessageBubble>
                        ) : item.type === 'Theme' ? (
                          <Palette className={cn("h-12 w-12 opacity-30", item.color || "text-purple-500")} />
                        ) : item.icon ? (
                          <item.icon className={cn("h-12 w-12 opacity-30", item.color)} />
                        ) : null}
                        
                        <Badge className="absolute top-2 right-2">{item.type}</Badge>
                      </div>
                      
                      <CardHeader className="text-center p-3">
                        <CardTitle className="text-sm font-black uppercase truncate">{item.name}</CardTitle>
                      </CardHeader>
                      
                      <CardFooter className="flex flex-col gap-2 p-3 pt-0">
                        <div className="flex items-center gap-1 font-black text-primary">
                          <GoldCoinIcon className="h-4 w-4" /> {item.price.toLocaleString()}
                        </div>
                        <Button 
                          onClick={() => isOwned ? handleEquip(item) : handlePurchase(item)} 
                          className={cn("w-full rounded-xl font-black uppercase text-[10px]", isOwned && isActive ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90")}
                        >
                          {isOwned ? (isActive ? 'Active' : 'Equip') : 'Purchase'}
                        </Button>
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
