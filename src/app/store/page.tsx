'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette, Heart, Zap, Eye, Circle, X, Activity } from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { AVATAR_FRAMES, type AvatarFrameConfig } from '@/constants/avatar-frames';
import { AvatarFrame } from '@/components/avatar-frame';

// --- CUSTOM WAVE CIRCLE UI ---
const WaveCircleIcon = ({ colorClass, size = "h-14 w-14" }) => {
  const borderColor = colorClass.replace('text-', 'border-');
  return (
    <div className={cn("relative flex items-center justify-center rounded-full", size)}>
      <div className={cn("absolute inset-0 rounded-full border-[6px] opacity-30 blur-[1px]", borderColor)} />
      <div className={cn("absolute inset-[3px] rounded-full border-[8px] shadow-inner", borderColor)} />
      <div className={cn("absolute inset-[10px] rounded-full border-[1px] opacity-50", borderColor)} />
    </div>
  );
};

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

// --- STORE ITEMS ---
const STATIC_STORE_ITEMS = [
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 7, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 7, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 7, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },
  { id: 'supreme-king', name: 'Legendary King', type: 'Frame', price: 1250000, durationDays: 7, description: 'The absolute ruler with 24k Gold Glow.', icon: Crown, color: 'text-yellow-500' },
  { id: 'elite-mythic-gold', name: 'Mythic Gold Elite', type: 'Frame', price: 5000000, durationDays: 7, description: 'Ultimate multi-tiered golden aura.', icon: Crown, color: 'text-yellow-400' },
  { id: 'angel-wings', name: 'Angel Wings', type: 'Frame', price: 325000, durationDays: 7, description: 'Divine golden heavenly wings.', icon: Sparkles, color: 'text-yellow-200' },
  { id: 'ruby-crown', name: 'Ruby Crown', type: 'Frame', price: 150000, durationDays: 7, description: 'Imperial red gem sovereignty.', icon: Crown, color: 'text-red-600' },
  { id: 'w-waveflew', name: 'Waveflew', type: 'Wave', price: 10000, durationDays: 7, description: 'Premium 3D Glossy frequency wave.', icon: Activity, color: 'text-white' },
  { id: 'w-tonepink', name: 'Tone Pink', type: 'Wave', price: 30000, durationDays: 7, description: '3D Glossy Pink rhythmic frequency.', icon: Activity, color: 'text-pink-500' },
  { id: 'w-vox', name: 'Vox', type: 'Wave', price: 30500, durationDays: 7, description: 'Crystal blue 3D glossy voice wave.', icon: Activity, color: 'text-blue-500' },
  { id: 'w-reso', name: 'Reso', type: 'Wave', price: 20000, durationDays: 7, description: 'Neon green resonance 3D glossy wave.', icon: Activity, color: 'text-green-500' },
  { id: 'w-echo', name: 'Echo', type: 'Wave', price: 25999, durationDays: 7, description: 'Vibrant orange echo 3D glossy frequency.', icon: Activity, color: 'text-orange-500' },
];

export default function StorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // States for Preview and selection
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(7);

  // Reset selected duration when item changes
  useEffect(() => {
    if (previewItem) {
      setSelectedDuration(7);
    }
  }, [previewItem]);

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
    const frames = [{
      id: 'None',
      name: 'Identity Cleanse',
      type: 'Frame',
      price: 0,
      description: 'Remove current frame and show default avatar aura.',
      icon: X,
      color: 'text-slate-400'
    }];
    (Object.values(AVATAR_FRAMES) as AvatarFrameConfig[]).forEach(f => {
      frames.push({ ...f, type: 'Frame', price: 0, description: `Premium ${f.tier} identity frame.` } as any);
    });
    return frames;
  }, []);

  const allItems = [...STATIC_STORE_ITEMS, ...dynamicThemes, ...frameItems];

  // Calculate price based on duration (3 days or 7 days)
  const getCalculatedPrice = (basePrice: number, duration: number) => {
    if (duration === 7) return basePrice;
    // For 3 days, we approximate price (e.g., 45% of 7-day price)
    return Math.floor((basePrice / 7) * 3);
  };

  const handlePurchase = (item: any, duration: number) => {
    if (!userProfile || !user || !firestore) return;
    const finalPrice = getCalculatedPrice(item.price, duration);

    if ((userProfile.wallet?.coins || 0) < finalPrice) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);
    
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    
    const updateData = { 
      'wallet.coins': increment(-finalPrice), 
      'inventory.ownedItems': arrayUnion(item.id),
      [`inventory.expiries.${item.id}`]: Timestamp.fromDate(expiryDate),
      'updatedAt': serverTimestamp() 
    };

    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-finalPrice), 'updatedAt': serverTimestamp() });
    toast({ title: 'Purchase Successful' });
    setPreviewItem(null);
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
    setPreviewItem(null);
  };

  if (isProfileLoading) return <div className="flex min-h-screen items-center justify-center bg-black"><Loader className="animate-spin text-white" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121A1F] via-[#0A0E12] to-[#050709] text-white pb-safe">
      <div className="space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-16 pb-24">
        
        <header className="relative flex items-center justify-center border-b border-white/10 pb-6 min-h-[48px]">
          <button onClick={() => router.back()} className="absolute left-0 p-2 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-full">
            <ChevronLeft />
          </button>
          <h1 className="text-3xl font-black tracking-tight text-white">Store</h1>
        </header>

        <Tabs defaultValue="Frame" className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar mb-6">
            <TabsList className="bg-transparent inline-flex min-w-full md:min-w-0 gap-2 border-b border-white/5 pb-1 rounded-none">
              {['All', 'Frame', 'Theme', 'Bubble', 'Vehicle', 'Wave'].map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat} 
                  className="rounded-none px-6 py-2 text-gray-400 font-medium whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-[#FCD535] data-[state=active]:shadow-none relative data-[state=active]:after:absolute data-[state=active]:after:-bottom-[5px] data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-[3px] data-[state=active]:after:w-6 data-[state=active]:after:bg-[#FCD535] data-[state=active]:after:rounded-full transition-all"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {['All', 'Frame', 'Theme', 'Bubble', 'Vehicle', 'Wave'].map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allItems.filter(i => category === 'All' || i.type === category).map(item => (
                  <Card key={item.id} onClick={() => setPreviewItem(item)} className="overflow-hidden rounded-[1rem] bg-gradient-to-b from-[#18232D] to-[#0D141A] border border-[#23303D] shadow-xl cursor-pointer hover:scale-[1.02] hover:border-[#384A5D] active:scale-95 transition-all text-white">
                    <div className="aspect-square flex items-center justify-center p-4 relative border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                      {item.type === 'Frame' ? (
                        <div className="scale-110">
                          {item.id === 'None' ? (
                            <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center"><X className="h-10 w-10 text-slate-500" /></div>
                          ) : (
                            <AvatarFrame frameId={item.id} size="md">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} />
                                <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                              </Avatar>
                            </AvatarFrame>
                          )}
                        </div>
                      ) : item.type === 'Bubble' ? (
                        <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px]">Hello Ummy</ChatMessageBubble>
                      ) : item.type === 'Theme' ? (
                        <Palette className={cn("h-12 w-12 opacity-50", item.color || "text-purple-400")} />
                      ) : item.type === 'Wave' ? (
                         <WaveCircleIcon colorClass={item.color} size="h-14 w-14" />
                      ) : item.icon ? (
                        <item.icon className={cn("h-12 w-12 opacity-50", item.color)} />
                      ) : null}
                    </div>
                    <CardHeader className="text-center p-3 pb-1">
                      <CardTitle className="text-sm font-normal text-gray-300 truncate">{item.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3 p-3 pt-1">
                      <div className="flex items-center justify-center gap-1.5 text-sm w-full">
                        <GoldCoinIcon className="h-4 w-4" />
                        <span className="text-[#FCD535] font-bold">{item.price.toLocaleString()}</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* --- BOTTOM SHEET PREVIEW --- */}
        {previewItem && (
          <>
            <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity" onClick={() => setPreviewItem(null)} />
            
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] rounded-t-[24px] h-[55vh] max-h-[600px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-300 ease-out">
              
              <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>

              <div className="flex-1 overflow-y-auto flex flex-col items-center pt-10 pb-6 px-4">
                <div className="mb-6 scale-[1.3] flex items-center justify-center h-32 w-32">
                  {previewItem.type === 'Frame' ? (
                    previewItem.id === 'None' ? <X className="h-16 w-16 text-slate-500" /> : (
                      <AvatarFrame frameId={previewItem.id} size="xl">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={`https://picsum.photos/seed/${previewItem.id}/200`} />
                          <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                        </Avatar>
                      </AvatarFrame>
                    )
                  ) : previewItem.type === 'Bubble' ? (
                    <ChatMessageBubble bubbleId={previewItem.id} isMe={true} className="text-sm">Hello Ummy</ChatMessageBubble>
                  ) : previewItem.type === 'Theme' ? (
                    <Palette className={cn("h-20 w-20 opacity-80", previewItem.color || "text-purple-400")} />
                  ) : previewItem.type === 'Wave' ? (
                    <WaveCircleIcon colorClass={previewItem.color} size="h-24 w-24" />
                  ) : previewItem.icon ? (
                    <previewItem.icon className={cn("h-20 w-20 opacity-80", previewItem.color)} />
                  ) : null}
                </div>

                <h2 className="text-2xl font-medium text-white tracking-wide">{previewItem.name}</h2>

                {/* --- DAYS SELECTION (3 & 7 DAYS) --- */}
                <div className="flex gap-4 mt-8 w-full justify-center">
                  <button 
                    onClick={() => setSelectedDuration(3)}
                    className={cn(
                      "relative border rounded-[10px] w-36 py-4 flex items-center justify-center transition-all",
                      selectedDuration === 3 ? "border-[#FCD535] bg-[#313131]" : "border-white/5 bg-[#222222]"
                    )}
                  >
                    <span className={cn("text-[15px]", selectedDuration === 3 ? "text-white" : "text-gray-400")}>3 Days</span>
                    {selectedDuration === 3 && (
                      <div className="absolute -bottom-1.5 -right-1.5 bg-[#FCD535] rounded-tl-lg rounded-br-[10px] p-0.5">
                        <Check size={14} strokeWidth={3} className="text-black" />
                      </div>
                    )}
                  </button>

                  <button 
                    onClick={() => setSelectedDuration(7)}
                    className={cn(
                      "relative border rounded-[10px] w-36 py-4 flex items-center justify-center transition-all",
                      selectedDuration === 7 ? "border-[#FCD535] bg-[#313131]" : "border-white/5 bg-[#222222]"
                    )}
                  >
                    <span className={cn("text-[15px]", selectedDuration === 7 ? "text-white" : "text-gray-400")}>7 Days</span>
                    {selectedDuration === 7 && (
                      <div className="absolute -bottom-1.5 -right-1.5 bg-[#FCD535] rounded-tl-lg rounded-br-[10px] p-0.5">
                        <Check size={14} strokeWidth={3} className="text-black" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-[#222222] rounded-t-[20px] p-5 pb-8 flex items-center justify-between">
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <GoldCoinIcon className="w-6 h-6" />
                    <span className="text-[#FCD535] font-bold text-2xl tracking-wide">
                      {getCalculatedPrice(previewItem.price, selectedDuration).toLocaleString()}
                    </span>
                  </div>
                  {previewItem.price > 0 && (
                    <span className="text-[#a58231] text-[15px] line-through pl-8 font-medium opacity-80">
                      {Math.floor(getCalculatedPrice(previewItem.price, selectedDuration) * 1.6).toLocaleString()}
                    </span>
                  )}
                </div>

                <Button 
                  onClick={() => {
                    const isOwned = userProfile?.inventory?.ownedItems?.includes(previewItem.id);
                    isOwned ? handleEquip(previewItem) : handlePurchase(previewItem, selectedDuration);
                  }}
                  className={cn(
                    "rounded-full px-16 py-7 text-lg font-medium tracking-wide shadow-lg",
                    userProfile?.inventory?.ownedItems?.includes(previewItem.id)
                      ? userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-white/20 text-white hover:bg-white/30"
                      : "bg-[#FCD535] text-black hover:bg-[#e5c02b]"
                  )}
                >
                  {userProfile?.inventory?.ownedItems?.includes(previewItem.id) 
                    ? (userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id ? 'Equipped' : 'Equip') 
                    : 'Buy'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
