'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette, Heart, Zap, Eye } from 'lucide-react';
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

// --- NEW GOLDEN DESIGN COMPONENT ---
const GoldenAvatarFrame = ({ imageUrl, size = 120, className = "" }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Main SVG Frame */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] z-10">
        <defs>
          <linearGradient id="goldBeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FDF0AD' }} />
            <stop offset="25%" style={{ stopColor: '#D4AF37' }} />
            <stop offset="50%" style={{ stopColor: '#FFFACD' }} />
            <stop offset="75%" style={{ stopColor: '#BD9731' }} />
            <stop offset="100%" style={{ stopColor: '#8A6E00' }} />
          </linearGradient>

          <filter id="bevel3d" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lightingColor="white" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        </defs>

        {/* Side Wings */}
        <g filter="url(#bevel3d)" stroke="#5c4300" strokeWidth="0.5">
          <path d="M100 240 Q40 220 50 140 L90 160 Q70 190 100 230 Z" fill="url(#goldBeam)" />
          <path d="M300 240 Q360 220 350 140 L310 160 Q330 190 300 230 Z" fill="url(#goldBeam)" />
        </g>

        {/* Layered Circular Frame */}
        <circle cx="200" cy="200" r="105" fill="none" stroke="#4a3700" strokeWidth="12" />
        <circle cx="200" cy="200" r="100" fill="none" stroke="url(#goldBeam)" strokeWidth="8" filter="url(#bevel3d)" />

        {/* The Grand Crown */}
        <g filter="url(#bevel3d)">
          <path d="M130 110 L110 50 L160 85 L200 30 L240 85 L290 50 L270 110 Z" fill="url(#goldBeam)" stroke="#5c4300" strokeWidth="1" />
        </g>

        {/* Bottom Shell Ornament */}
        <g filter="url(#bevel3d)">
          <path d="M165 285 Q200 340 235 285 L225 270 Q200 285 175 270 Z" fill="url(#goldBeam)" stroke="#4a3700" />
        </g>

        {/* Sparkles */}
        <circle cx="200" cy="30" r="3" fill="white" className="animate-pulse" />
        <circle cx="345" cy="140" r="2" fill="white" className="animate-ping" />
      </svg>

      {/* User Avatar Image Container */}
      <div 
        className="absolute overflow-hidden rounded-full border-2 border-[#1a1a1a] z-0"
        style={{ width: '42%', height: '42%' }}
      >
        <img 
          src={imageUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover brightness-110 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

// --- MAIN STORE PAGE ---
const STATIC_STORE_ITEMS = [
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 30, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 30, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
  { id: 'evil-bubble', name: 'Evil Bubble', type: 'Bubble', price: 10495, durationDays: 30, description: 'Dark aura with devil horns.', icon: MessageSquare, color: 'text-purple-600' },
  { id: 'candy-bubble', name: 'Candy Bubble', type: 'Bubble', price: 8995, durationDays: 30, description: 'Sweet pink with lollipop decals.', icon: MessageSquare, color: 'text-pink-300' },
  { id: 'taurus-2025', name: 'Taurus 2025', type: 'Bubble', price: 50000, durationDays: 30, description: 'Earthy golden constellation bubble.', icon: Sparkles, color: 'text-yellow-600' },
  { id: 'cricket-2025', name: 'Cricket 2025', type: 'Bubble', price: 40000, durationDays: 30, description: 'Stadium green sporty bubble.', icon: MessageSquare, color: 'text-green-600' },
  { id: 'gemini-2025', name: 'Gemini 2025', type: 'Bubble', price: 50000, durationDays: 30, description: 'Mystic blue constellation bubble.', icon: Sparkles, color: 'text-blue-500' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 30, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },
  { id: 'supreme-king', name: 'Legendary King', type: 'Frame', price: 1250000, durationDays: 30, description: 'The absolute ruler with 24k Gold Glow.', icon: Crown, color: 'text-yellow-500' },
  { id: 'rose-gold', name: 'Royal Rose', type: 'Frame', price: 750000, durationDays: 30, description: 'Elegant golden vines with animated red roses.', icon: Heart, color: 'text-red-500' },
  { id: 'top3family', name: 'Sovereign Crystal Pink', type: 'Frame', price: 500000, durationDays: 30, description: 'Exclusive pink crystal sovereign frame.', icon: Crown, color: 'text-pink-500' },
  { id: 'top2family', name: 'Sovereign Crystal Blue', type: 'Frame', price: 750000, durationDays: 30, description: 'Exclusive blue frost diamond frame.', icon: Crown, color: 'text-blue-500' },
  { id: 'neon-2025', name: 'Cybernetic Aura', type: 'Frame', price: 300000, durationDays: 30, description: 'Cyberpunk holographic glowing ring.', icon: Sparkles, color: 'text-purple-500' },
  { id: 'elite-mythic-gold', name: 'Mythic Gold Elite', type: 'Frame', price: 5000000, durationDays: 30, description: 'Ultimate multi-tiered golden aura.', icon: Crown, color: 'text-yellow-400' },
  { id: 'elite-arctic-diamond', name: 'Arctic Diamond Elite', type: 'Frame', price: 5000000, durationDays: 30, description: 'Frigid white-cyan aura with glowing diamond particles.', icon: Sparkles, color: 'text-cyan-300' },
  { id: 'elite-phoenix-wild', name: 'Phoenix Wildfire Elite', type: 'Frame', price: 5000000, durationDays: 30, description: 'Massive animated fire trails.', icon: Zap, color: 'text-orange-500' },
  { id: 'elite-cosmic-purple', name: 'Cosmic Purple Elite', type: 'Frame', price: 5000000, durationDays: 30, description: 'Moving space nebula.', icon: Star, color: 'text-purple-500' },
  { id: 'gold-mosque', name: 'Gold Mosque', type: 'Frame', price: 375000, durationDays: 30, description: 'Ramadan inspired golden crescents.', icon: Sparkles, color: 'text-yellow-500' },
  { id: 'blue-roses', name: 'Blue Roses', type: 'Frame', price: 300000, durationDays: 30, description: 'Ethereal glowing frozen petals.', icon: Sparkles, color: 'text-blue-300' },
  { id: 'angel-wings', name: 'Angel Wings', type: 'Frame', price: 325000, durationDays: 30, description: 'Divine golden heavenly wings.', icon: Sparkles, color: 'text-yellow-200' },
  { id: 'ruby-crown', name: 'Ruby Crown', type: 'Frame', price: 150000, durationDays: 30, description: 'Imperial red gem sovereignty.', icon: Crown, color: 'text-red-600' },
  { id: 'f5', name: 'Celestial Angel', type: 'Frame', price: 200000, durationDays: 7, description: '3D luxury angelic white frame.', icon: Sparkles, color: 'text-white' },
  { id: 'w1', name: 'Ocean Waves', type: 'Wave', price: 5000, durationDays: 7, description: 'Dynamic blue voice frequency.', icon: Mic2, color: 'text-cyan-500' },
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
    toast({ title: 'Purchase Successful', description: `${item.name} added to your bag.` });
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

  if (isProfileLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f3e5f5]"><Loader className="animate-spin text-primary h-8 w-8" /></div>;

  return (
    <div className="min-h-screen bg-[#f3e5f5] pb-safe">
      <div className="space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-6 pb-24 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/10 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white/50 rounded-full shadow-sm hover:bg-white transition-colors"><ChevronLeft className="h-6 w-6 text-slate-800" /></button>
            <div>
              <h1 className="text-3xl font-black font-sans uppercase tracking-tight flex items-center gap-2 text-slate-900">
                <ShoppingBag className="text-primary h-8 w-8" /> Ummy Boutique
              </h1>
              <p className="text-muted-foreground font-body text-sm mt-1 font-medium">Customize your frequency identity.</p>
            </div>
          </div>
          <div onClick={() => router.push('/wallet')} className="bg-gradient-to-br from-primary/20 to-primary/5 px-6 py-3 rounded-2xl border-2 border-primary/20 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <GoldCoinIcon className="h-8 w-8" />
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-black text-primary leading-none">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-primary/70 mt-1">Tap to Recharge</span>
            </div>
          </div>
        </header>

        <Tabs defaultValue="All" className="w-full space-y-6">
          <TabsList className="bg-white/60 backdrop-blur-md p-1.5 h-12 rounded-full border border-primary/10 w-full md:w-fit overflow-x-auto no-scrollbar shadow-sm">
            {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(cat => (
              <TabsTrigger key={cat} value={cat} className="rounded-full px-6 font-bold uppercase tracking-wider text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all">{cat}</TabsTrigger>
            ))}
          </TabsList>

          {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(category => (
            <TabsContent key={category} value={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {allItems.filter(i => category === 'All' || i.type === category).map(item => {
                  const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
                  const isActive = userProfile?.inventory?.activeFrame === item.id || userProfile?.inventory?.activeTheme === item.id || userProfile?.inventory?.activeBubble === item.id || userProfile?.inventory?.activeWave === item.id;
                  
                  return (
                    <Card key={item.id} className="relative overflow-hidden group border-none shadow-sm hover:shadow-md rounded-[1.5rem] bg-white ring-1 ring-black/5">
                      <div className="aspect-square bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 relative">
                        
                        {/* THE NEW DESIGN INTEGRATION */}
                        {item.type === 'Frame' ? (
                          <GoldenAvatarFrame 
                            imageUrl={`https://picsum.photos/seed/${item.id}/200`} 
                            size={120} 
                            className="md:scale-110"
                          />
                        ) : item.type === 'Theme' ? (
                          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-md border-[3px] border-white">
                            <Image src={(item as any).url} alt={item.name} fill className="object-cover" unoptimized />
                          </div>
                        ) : item.type === 'Bubble' ? (
                          <div className="w-full flex justify-center py-4">
                            <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px] min-w-[100px] text-center shadow-md">
                              Hello Ummy 
                            </ChatMessageBubble>
                          </div>
                        ) : <item.icon className={cn("h-12 w-12 md:h-16 md:w-16 opacity-30", item.color)} />}
                        
                        <Badge className="absolute top-2 right-2 bg-white/95 backdrop-blur-md text-slate-800 border-none font-bold uppercase text-[8px] px-1.5 py-0.5 rounded-md">{item.type}</Badge>
                        
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                            className="bg-white/90 backdrop-blur-md text-primary font-black uppercase text-[9px] px-4 py-2 rounded-full shadow-xl pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5" /> Try On
                          </button>
                        </div>
                      </div>
                      
                      <CardHeader className="text-center pb-1 pt-3 px-2">
                        <CardTitle className="font-sans uppercase text-sm md:text-base font-black tracking-tight text-slate-900 truncate">{item.name}</CardTitle>
                        <CardDescription className="text-[9px] md:text-[10px] font-medium text-slate-500 truncate mt-0.5">{item.description}</CardDescription>
                      </CardHeader>
                      
                      <CardFooter className="flex flex-col gap-2.5 p-3 pt-1">
                        <div className="flex items-center justify-center gap-1 font-black text-lg text-primary ">
                          <GoldCoinIcon className="h-4 w-4 md:h-5 md:w-5" />
                          {item.price.toLocaleString()}
                          {item.durationDays && <span className="text-[8px] font-bold text-slate-400 ml-1">/ {item.durationDays}d</span>}
                        </div>
                        {isOwned ? (
                          <Button onClick={() => handleEquip(item)} className={cn("w-full h-9 md:h-10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all", isActive ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600")}>
                            {isActive ? <><Check className="mr-1 h-3 w-3" /> Active</> : 'Equip'}
                          </Button>
                        ) : (
                          <Button onClick={() => handlePurchase(item)} className="w-full h-9 md:h-10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-md bg-primary text-white hover:bg-primary/90">
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
        
        <ItemPreview 
          isOpen={!!previewItem} 
          onClose={() => setPreviewItem(null)} 
          item={previewItem} 
        />
      </div>
    </div>
  );
   }
              
