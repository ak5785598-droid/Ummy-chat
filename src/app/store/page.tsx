'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette, Heart, Zap, Eye, Circle, X, Activity, IdCard } from 'lucide-react';
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
const WaveCircleIcon = ({ colorClass, size = "h-20 w-20", isLovelyShine = false }: any) => {
  const borderColor = colorClass.replace('text-', 'border-');
  
  if (isLovelyShine) {
    return (
      <div className={cn("relative flex items-center justify-center rounded-full", size)}>
        <div className="absolute inset-0 rounded-full border-[2px] border-blue-400/50 animate-pulse" />
        <div className="absolute inset-1 rounded-full border-[4px] border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
        <div className="absolute inset-3 rounded-full border border-blue-200/20 border-dashed animate-[spin_10s_linear_infinite]" />
        <Heart className="absolute -top-1 -right-1 h-4 w-4 text-blue-400 fill-blue-400/40 animate-bounce" />
        <Heart className="absolute top-1/2 -left-2 h-3 w-3 text-blue-300 fill-blue-300/40" />
        <Heart className="absolute bottom-0 right-2 h-3 w-3 text-white fill-white/20 animate-pulse" />
        <Sparkles className="absolute top-2 left-2 h-3 w-3 text-white animate-pulse" />
        <div className="absolute inset-[14px] rounded-full border-[1px] border-blue-400/60" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center rounded-full", size)}>
      <div className={cn("absolute inset-0 rounded-full border-[6px] opacity-30", borderColor)} />
      <div className={cn("absolute inset-[3px] rounded-full border-[8px] shadow-inner", borderColor)} />
      <div className={cn("absolute inset-[10px] rounded-full border-[1px] opacity-50", borderColor)} />
    </div>
  );
};

// --- NAYA BUDGET ID BADGE (IMAGE BASED) ---
const BudgetIDBadge = ({ number }: { number: string }) => (
  <div className="relative flex items-center justify-center scale-90 md:scale-100">
    <div className="h-[38px] min-w-[150px] flex items-center bg-gradient-to-r from-[#FF4D8D] to-[#FF8CB0] rounded-full pl-1.5 pr-4 shadow-[0_4px_10px_rgba(255,77,141,0.3)] border border-white/20">
      <div className="h-8 w-8 rounded-full bg-gradient-to-b from-[#FF1F6D] to-[#D6145B] flex flex-col items-center justify-center border border-white/30 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10" />
        <span className="text-[11px] font-black leading-none text-white italic drop-shadow-sm z-10">ID</span>
        <span className="text-[8px] font-bold leading-none text-white/90 z-10">SS</span>
      </div>
      <span className="flex-1 text-center text-white font-bold text-[22px] tracking-tight ml-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
        {number}
      </span>
      <div className="absolute -top-1 -right-1">
        <Sparkles className="h-3 w-3 text-white/60 animate-pulse" />
      </div>
    </div>
  </div>
);

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
          <circle cx="200" cy="15" r="4" fill="white" />
          <circle cx="105" cy="40" r="2" fill="white" />
          <circle cx="295" cy="40" r="2" fill="white" />
        </g>
      </svg>
      <div className="absolute overflow-hidden rounded-full border-[3px] border-[#1a1300] z-0" style={{ width: '43%', height: '43%' }}>
        <img src={imageUrl} alt="User Avatar" className="w-full h-full object-cover brightness-105" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

// --- CUSTOM ID BADGE COMPONENT ---
const IDBadgeIcon = ({ number }: { number: string }) => (
  <div className="relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-10px] translate-x-[-5px]">
    <div className="h-[32px] pl-[35px] pr-[20px] bg-gradient-to-r from-[#D91B10] to-[#F13A24] rounded-r-full border-[1.5px] border-t-[#FF6B55] border-b-[#9D1109] border-r-[#FF6B55] flex items-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] z-0">
      <span className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none pt-[2px]">{number}</span>
    </div>
    <div className="absolute left-[-15px] z-10 w-[54px] h-[54px]">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1AA" />
            <stop offset="25%" stopColor="#FFD335" />
            <stop offset="50%" stopColor="#C98B13" />
            <stop offset="75%" stopColor="#FFD335" />
            <stop offset="100%" stopColor="#9E6100" />
          </linearGradient>
        </defs>
        <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="url(#goldGrad)" stroke="#FFE373" strokeWidth="3" />
        <polygon points="50,12 82,30 82,70 50,88 18,70 18,30" fill="#750600" />
        <text x="50" y="58" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="42" fill="url(#goldGrad)" textAnchor="middle" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.8))">ID</text>
        <text x="50" y="80" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="url(#goldGrad)" textAnchor="middle" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.8))">SSS</text>
      </svg>
    </div>
  </div>
);

// --- STORE ITEMS ---
const STATIC_STORE_ITEMS = [
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 7, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 7, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 7, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },
  { id: 'supreme-king', name: 'Legendary King', type: 'Frame', price: 1250000, durationDays: 7, description: 'The absolute ruler with 24k Gold Glow.', icon: Crown, color: 'text-yellow-500' },
  { id: 'elite-mythic-gold', name: 'Mythic Gold Elite', type: 'Frame', price: 5000000, durationDays: 7, description: 'Ultimate multi-tiered golden aura.', icon: Crown, color: 'text-yellow-400' },
  { id: 'angel-wings', name: 'Angel Wings', type: 'Frame', price: 325000, durationDays: 7, description: 'Divine golden heavenly wings.', icon: Sparkles, color: 'text-yellow-200' },
  { id: 'ruby-crown', name: 'Ruby Crown', type: 'Frame', price: 150000, durationDays: 7, description: 'Imperial red gem sovereignty.', icon: Crown, color: 'text-red-600' },
  { id: 'w-lovelyshine', name: 'Lovely Shine', type: 'Wave', price: 59999, durationDays: 7, description: 'Magical blue glow with floating hearts.', icon: Activity, color: 'text-blue-400' },
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
  
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(7);

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
    const baseThemes = (dbThemes || []).filter(t => (t.price || 0) > 0).map(t => ({
      ...t,
      type: 'Theme',
      description: t.description || `High-fidelity ${t.name} background.`
    }));
    return [
      { id: 'None-Theme', name: 'Default Theme', type: 'Theme', price: 0, description: 'Restore default background.', icon: X, color: 'text-slate-400' },
      ...baseThemes
    ];
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

  const bubbleItems = useMemo(() => [
    { id: 'None-Bubble', name: 'Default Bubble', type: 'Bubble', price: 0, description: 'Standard chat bubble.', icon: X, color: 'text-slate-400' },
    ...STATIC_STORE_ITEMS.filter(i => i.type === 'Bubble')
  ], []);

  const waveItems = useMemo(() => [
    { id: 'None-Wave', name: 'No Wave', type: 'Wave', price: 0, description: 'Remove voice wave effect.', icon: X, color: 'text-slate-400' },
    ...STATIC_STORE_ITEMS.filter(i => i.type === 'Wave')
  ], []);

  const idItems = useMemo(() => [
    { id: 'None-ID', name: 'Unequip ID', type: 'ID', price: 0, description: 'Remove current ID badge.', icon: X, color: 'text-slate-400' },
    { id: 'id-222444', name: 'Budget Pink SS', type: 'ID', price: 99999, durationDays: 7, description: 'Exclusive Budget Pink ID 222444 Badge.', displayId: '222444', isBudget: true },
    { id: 'id-888888', name: 'VIP SSS ID', type: 'ID', price: 5000000, durationDays: 7, description: 'Exclusive VIP ID Number 888888 Badge.', displayId: '888888' },
    { id: 'id-666666', name: 'VIP Elite ID', type: 'ID', price: 5000000, durationDays: 7, description: 'Exclusive VIP ID Number 666666 Badge.', displayId: '666666' },
    { id: 'id-676767', name: 'VIP Royal ID', type: 'ID', price: 5999999, durationDays: 7, description: 'Exclusive VIP ID Number 676767 Badge.', displayId: '676767' },
  ], []);

  const allItems = [...frameItems, ...bubbleItems, ...dynamicThemes, ...waveItems, ...idItems];

  const getCalculatedPrice = (basePrice: number, duration: number) => {
    if (duration === 7) return basePrice;
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
    const isRemoving = item.id.startsWith('None');
    const updateData = { [field]: isRemoving ? 'None' : item.id, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(profileRef, updateData);
    updateDocumentNonBlocking(userRef, updateData);
    toast({ title: isRemoving ? `${item.type} Removed` : 'Item Equipped' });
    setPreviewItem(null);
  };

  if (isProfileLoading) return <div className="flex min-h-screen items-center justify-center bg-black"><Loader className="animate-spin text-white" /></div>;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#121A1F] via-[#0A0E12] to-[#050709] text-white pb-safe overflow-x-hidden">
      
      <div className="absolute top-0 left-0 right-0 h-[15vh] pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/25 via-purple-900/5 to-transparent" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-full bg-purple-500/10 rounded-[100%]" />
      </div>

      <div className="relative z-10 space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-16 pb-24">
        
        <header className="relative flex items-center justify-center border-b border-white/10 pb-6 min-h-[48px]">
          <button onClick={() => router.back()} className="absolute left-0 p-2 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-full">
            <ChevronLeft />
          </button>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]">Store</h1>
        </header>

        <Tabs defaultValue="Frame" className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar mb-6">
            <TabsList className="bg-transparent inline-flex min-w-full md:min-w-0 gap-2 border-b border-white/5 pb-1 rounded-none">
              {['All', 'Frame', 'Theme', 'Bubble', 'Wave', 'ID'].map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat} 
                  className="rounded-none px-6 py-2 text-gray-400 font-medium whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-[#FCD535] relative data-[state=active]:after:absolute data-[state=active]:after:-bottom-[5px] data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-[3px] data-[state=active]:after:w-6 data-[state=active]:after:bg-[#FCD535] data-[state=active]:after:rounded-full transition-all"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {['All', 'Frame', 'Theme', 'Bubble', 'Wave', 'ID'].map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allItems.filter(i => category === 'All' || i.type === category).map(item => (
                  <Card key={item.id} onClick={() => setPreviewItem(item)} className="overflow-hidden rounded-[1rem] bg-gradient-to-b from-[#18232D] to-[#0D141A] border border-[#23303D] shadow-xl cursor-pointer hover:scale-[1.02] hover:border-[#384A5D] active:scale-95 transition-all text-white">
                    <div className="aspect-square flex items-center justify-center p-4 relative border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                      {item.id.startsWith('None') ? (
                         <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center"><X className="h-10 w-10 text-slate-500" /></div>
                      ) : item.type === 'Frame' ? (
                        <div className="scale-110">
                            <AvatarFrame frameId={item.id} size="md">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} />
                                <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                              </Avatar>
                            </AvatarFrame>
                        </div>
                      ) : item.type === 'Bubble' ? (
                        <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px]">Hello Ummy</ChatMessageBubble>
                      ) : item.type === 'Theme' ? (
                        <Palette className={cn("h-12 w-12 opacity-50", item.color || "text-purple-400")} />
                      ) : item.type === 'Wave' ? (
                         <WaveCircleIcon colorClass={item.color} size="h-20 w-20" isLovelyShine={item.id === 'w-lovelyshine'} />
                      ) : item.type === 'ID' ? (
                         item.isBudget ? <BudgetIDBadge number={item.displayId || ''} /> : <IDBadgeIcon number={item.displayId || ''} />
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
            <div className="fixed inset-0 bg-black/70 z-40 transition-opacity" onClick={() => setPreviewItem(null)} />
            
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] rounded-t-[24px] h-[40vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-300 ease-out">
              
              <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>

              <div className="flex-1 overflow-y-auto flex flex-col items-center pt-8 pb-4 px-4">
                <div className="mb-4 scale-[1.1] flex items-center justify-center h-28 w-28">
                  {previewItem.id.startsWith('None') ? (
                    <X className="h-16 w-16 text-slate-500" />
                  ) : previewItem.type === 'Frame' ? (
                      <AvatarFrame frameId={previewItem.id} size="xl">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={`https://picsum.photos/seed/${previewItem.id}/200`} />
                          <AvatarFallback className="bg-[#2A3644] text-gray-300">U</AvatarFallback>
                        </Avatar>
                      </AvatarFrame>
                  ) : previewItem.type === 'Bubble' ? (
                    <ChatMessageBubble bubbleId={previewItem.id} isMe={true} className="text-sm">Hello Ummy</ChatMessageBubble>
                  ) : previewItem.type === 'Theme' ? (
                    <Palette className={cn("h-16 w-16 opacity-80", previewItem.color || "text-purple-400")} />
                  ) : previewItem.type === 'Wave' ? (
                    <WaveCircleIcon colorClass={previewItem.color} size="h-28 w-28" isLovelyShine={previewItem.id === 'w-lovelyshine'} />
                  ) : previewItem.type === 'ID' ? (
                      <div className="scale-125 pt-2">
                        {previewItem.isBudget ? <BudgetIDBadge number={previewItem.displayId || ''} /> : <IDBadgeIcon number={previewItem.displayId || ''} />}
                      </div>
                  ) : previewItem.icon ? (
                    <previewItem.icon className={cn("h-16 w-16 opacity-80", previewItem.color)} />
                  ) : null}
                </div>

                <h2 className="text-xl font-medium text-white tracking-wide">{previewItem.name}</h2>

                <div className="flex gap-4 mt-4 w-full justify-center">
                  {[3, 7].map(days => (
                    <button 
                      key={days}
                      onClick={() => setSelectedDuration(days)}
                      className={cn(
                        "relative border rounded-[10px] w-28 py-2 flex items-center justify-center transition-all",
                        selectedDuration === days ? "border-[#FCD535] bg-[#313131]" : "border-white/5 bg-[#222222]"
                      )}
                    >
                      <span className={cn("text-sm", selectedDuration === days ? "text-white" : "text-gray-400")}>{days} Days</span>
                      {selectedDuration === days && (
                        <div className="absolute -bottom-1 -right-1 bg-[#FCD535] rounded-tl-md rounded-br-[10px] p-0.5">
                          <Check size={12} strokeWidth={3} className="text-black" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#222222] rounded-t-[20px] p-4 pb-6 flex items-center justify-between">
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <GoldCoinIcon className="w-5 h-5" />
                    <span className="text-[#FCD535] font-bold text-xl tracking-wide">
                      {getCalculatedPrice(previewItem.price, selectedDuration).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    const isOwned = previewItem.id.startsWith('None') || userProfile?.inventory?.ownedItems?.includes(previewItem.id);
                    isOwned ? handleEquip(previewItem) : handlePurchase(previewItem, selectedDuration);
                  }}
                  className={cn(
                    "rounded-full px-12 py-5 text-md font-medium tracking-wide shadow-lg",
                    (previewItem.id.startsWith('None') || userProfile?.inventory?.ownedItems?.includes(previewItem.id))
                      ? userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === (previewItem.id.startsWith('None') ? 'None' : previewItem.id)
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-white/20 text-white hover:bg-white/30"
                      : "bg-[#FCD535] text-black hover:bg-[#e5c02b]"
                  )}
                >
                  {(previewItem.id.startsWith('None') || userProfile?.inventory?.ownedItems?.includes(previewItem.id)) 
                    ? (userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === (previewItem.id.startsWith('None') ? 'None' : previewItem.id) ? 'Equipped' : 'Equip') 
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
