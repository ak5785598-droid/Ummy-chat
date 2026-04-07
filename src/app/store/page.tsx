'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
// import { AvatarFrame } from '@/components/avatar-frame'; // We'll render directly to match reference exactly
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { ItemPreview } from '@/components/item-preview';

// --- CUSTOM ACCURATE HOD 2.0 FRAME DESIGN COMPONENT ---
// This component replicates the specific, multi-tiered crystal crown design of image 7
const Hod2Frame = ({ className = "w-28 h-28 md:w-32 md:h-32" }) => {
  return (
    <div className={cn("relative flex items-center justify-center p-3 group", className)}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
        <defs>
          <linearGradient id="goldGrad_HOD2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff8b5" />
            <stop offset="50%" stopColor="#fcc132" />
            <stop offset="100%" stopColor="#db8723" />
          </linearGradient>
          <linearGradient id="crystalPinkGrad_HOD2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="#ff9fbf" />
            <stop offset="100%" stopColor="#e91e63" />
          </linearGradient>
          <linearGradient id="crystalBlueGrad_HOD2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="#7ad0f1" />
            <stop offset="100%" stopColor="#2196f3" />
          </linearGradient>
          <linearGradient id="crystalYellowGrad_HOD2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="#fff6bd" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>
          <linearGradient id="glossyPinkBowGrad_HOD2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff8b5" />
            <stop offset="15%" stopColor="#ffb2d1" />
            <stop offset="100%" stopColor="#e91e63" />
          </linearGradient>
        </defs>
        
        {/* Tiered structural gold base with crystal facets - repeating patterns */}
        <g transform="translate(60,60)">
          {/* Main Gold Wreath Structural Elements */}
          {[...Array(24)].map((_, i) => {
            const angle = (i * 15) - 150; // Starting point to form the crown
            if (i >= 12 && i <= 15) return null; // Space for the bow at bottom
            
            // Choose crystal color based on pattern
            let crystalColorG = i % 3 === 0 ? "url(#crystalPinkGrad_HOD2)" : i % 5 === 0 ? "url(#crystalYellowGrad_HOD2)" : "url(#crystalBlueGrad_HOD2)";
            if (i > 10) crystalColorG = "url(#crystalPinkGrad_HOD2)"; // End in pink for consistency near bow
            
            return (
              <g key={i} transform={`rotate(${angle}) translate(0, -48)`}>
                {/* Structural Gold leaf stem */}
                <path d="M0,0 C2,-6 8,-10 2,-18 C-4,-10 -2,-6 0,0" fill="url(#goldGrad_HOD2)" stroke="#ad1457" strokeWidth="0.5" />
                {/* Faceted Crystal Shard (Stylized) */}
                <path d="M-2,-2 C-8,-14 -12,-18 -2,-28 C2,-18 -4,-14 -2,-2 L-6,-8 C-12,-16 -16,-20 -6,-30 C0,-20 -8,-16 -6,-8" fill={crystalColorG} stroke="white" strokeWidth="0.5" />
                {/* Small Sparkle point */}
                <circle cx="0" cy="-28" r="0.8" fill="white" className="animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              </g>
            );
          })}
        </g>
        
        {/* Central Ring base */}
        <circle cx="60" cy="60" r="36" fill="none" stroke="url(#goldGrad_HOD2)" strokeWidth="3" />
        <circle cx="60" cy="60" r="39" fill="none" stroke="#FBC02D" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* LARGE ACCURATE PINK GLOSSY BOW AT BOTTOM - Simplified but accurate shape */}
        <g transform="translate(60, 95)">
          {/* Main bow loops */}
          <path d="M0,0 C-15,-5 -35,-25 -35,-10 C-35,10 -15,15 0,5 Z" fill="url(#glossyPinkBowGrad_HOD2)" stroke="#880E4F" strokeWidth="1" />
          <path d="M0,0 C15,-5 35,-25 35,-10 C35,10 15,15 0,5 Z" fill="url(#glossyPinkBowGrad_HOD2)" stroke="#880E4F" strokeWidth="1" />
          {/* Center Knot with clear highlight */}
          <rect x="-6" y="-5" width="12" height="13" rx="4" fill="#ffb2d1" stroke="#ad1457" strokeWidth="1" />
          {/* Hanging tails - simplified simplified shape matching image 7 tails */}
          <path d="M-4,8 C-12,18 -18,25 -22,22 L-15,18 L-8,22 Z" fill="#E91E63" stroke="#880E4F" strokeWidth="1" />
          <path d="M4,8 C12,18 18,25 22,22 L15,18 L8,22 Z" fill="#E91E63" stroke="#880E4F" strokeWidth="1" />
          {/* Small Stylized petals around the bow for texture */}
          <path d="M-30,5 l1,-2 l3,0 Z" fill="#FF8A80" />
          <path d="M30,5 l-1,-2 l-3,0 Z" fill="#FF8A80" />
        </g>
        
        {/* Shine overlays */}
        <defs>
          <filter id="shineHOD2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
            <feOffset dx="0" dy="1.5" result="offsetBlur"/>
            <feComposite in="offsetBlur" in2="SourceGraphic" operator="over"/>
          </filter>
        </defs>
        <g filter="url(#shineHOD2)" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <path d="M30,20 l2,4 l4,2 l-4,2 l-2,4 l-2,-4 l-4,-2 l4,-2 Z" fill="white" className="animate-pulse delay-100" />
          <path d="M90,40 l1,2 l2,1 l-2,1 l-1,2 l-1,-2 l-2,-1 l2,-1 Z" fill="white" className="animate-pulse" />
        </g>
      </svg>
      
      {/* Avatar Container */}
      <div className="absolute inset-[15%] rounded-full overflow-hidden border-2 border-white/40 shadow-xl bg-slate-200">
        <Avatar className="w-full h-full">
          <AvatarImage src={`https://picsum.photos/seed/hod2/200`} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

// --- END CUSTOM FRAME COMPONENT ---

const STATIC_STORE_ITEMS = [
  // --- FRAMES ---
  { 
    id: 'hod2-laurel-crystal', 
    name: 'Petal Sovereignty V2', // Standard name, updated for version
    type: 'Frame', 
    price: 3000000, // Premium status matching premium design
    durationDays: 30, 
    description: 'The definitive multi-tiered crystal crown from the HOD collection. Pure code-based HD rendering.', 
    icon: Crown, 
    color: 'text-multi',
    isCustomRender: true // Flag to render as pure code component
  },
  { id: 'supreme-king', name: 'Legendary King', type: 'Frame', price: 1250000, durationDays: 30, description: '24k Gold Glow ruler frame.', icon: Crown, color: 'text-yellow-500' },
  { id: 'rose-gold', name: 'Royal Rose', type: 'Frame', price: 750000, durationDays: 30, description: 'Elegant golden vines with animated red roses.', icon: Heart, color: 'text-red-500' },
  { id: 'top3family', name: 'Sovereign Crystal Pink', type: 'Frame', price: 500000, durationDays: 30, description: 'Exclusive pink crystal sovereign frame for elite families.', icon: Crown, color: 'text-pink-500' },
  { id: 'neon-2025', name: 'Cybernetic Aura', type: 'Frame', price: 300000, durationDays: 30, description: 'Cyberpunk holographic ring with neon light trails.', icon: Sparkles, color: 'text-purple-500' },
  
  // --- BUBBLES ---
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 30, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'evil-bubble', name: 'Evil Bubble', type: 'Bubble', price: 10495, durationDays: 30, description: 'Dark aura with devil horns.', icon: MessageSquare, color: 'text-purple-600' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 30, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },

  // --- WAVES ---
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

  if (isProfileLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f3e5f5]"><Loader className="animate-spin text-primary h-8 w-8" /></div>;

  return (
    <div className="min-h-screen bg-[#f3e5f5] pb-safe">
      <div className="space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-6 pb-24 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/10 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white/50 rounded-full shadow-sm hover:bg-white transition-colors"><ChevronLeft className="h-6 w-6 text-slate-800" /></button>
            <div>
              <h1 className="text-3xl font-black font-sans uppercase tracking-tight flex items-center gap-2 text-slate-900">
                <ShoppingBag className="text-primary h-8 w-8" /> Boutique
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
              <TabsTrigger key={cat} value={cat} className="rounded-full px-6 font-bold uppercase tracking-wider text-xs data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">{cat}</TabsTrigger>
            ))}
          </TabsList>

          {['All', 'Frame', 'Theme', 'Bubble', 'Wave'].map(category => (
            <TabsContent key={category} value={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {allItems.filter(i => category === 'All' || i.type === category).map(item => {
                  const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
                  const isActive = userProfile?.inventory?.activeFrame === item.id || userProfile?.inventory?.activeTheme === item.id || userProfile?.inventory?.activeBubble === item.id || userProfile?.inventory?.activeWave === item.id;
                  
                  return (
                    <Card key={item.id} className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem] bg-white ring-1 ring-black/5">
                      <div className="aspect-square bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 relative">
                        {item.type === 'Frame' ? (
                          // Accurate frame rendering. Check for custom logic.
                          (item as any).isCustomRender ? (
                            <Hod2Frame />
                          ) : (
                            // Falls back to standard image-based rendering for other frames
                            <div className="absolute inset-0">
                               <AvatarFrame frameId={item.id} className="w-full h-full">
                                  <Avatar className="w-full h-full border-2 border-slate-200 shadow-xl overflow-hidden"><AvatarImage src={`https://picsum.photos/seed/${item.id}/200`} /><AvatarFallback>U</AvatarFallback></Avatar>
                               </AvatarFrame>
                            </div>
                          )
                        ) : item.type === 'Theme' ? (
                          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-md border-[3px] border-white">
                            <Image src={(item as any).url} alt={item.name} fill className="object-cover" unoptimized />
                          </div>
                        ) : item.type === 'Bubble' ? (
                          <div className="w-full flex justify-center py-4">
                            <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px] min-w-[100px] text-center shadow-md border-none">
                              Hello Boutique
                            </ChatMessageBubble>
                          </div>
                        ) : <item.icon className={cn("h-12 w-12 md:h-16 md:w-16 opacity-30", item.color)} />}
                        <Badge className="absolute top-2 right-2 bg-white/95 backdrop-blur-md text-slate-800 border-none font-bold uppercase text-[8px] tracking-wider px-1.5 py-0.5 shadow-sm rounded-md">{item.type}</Badge>
                        
                        {/* Try-On Button Layer */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                            className="bg-white/90 backdrop-blur-md text-primary font-black uppercase text-[9px] tracking-widest px-4 py-2 rounded-full shadow-xl pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2"
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
                          <Button onClick={() => handleEquip(item)} className={cn("w-full h-9 md:h-10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-sm transition-all", isActive ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800")}>
                            {isActive ? <><Check className="mr-1 h-3 w-3" /> Active</> : 'Equip'}
                          </Button>
                        ) : (
                          <Button onClick={() => handlePurchase(item)} className="w-full h-9 md:h-10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-md bg-primary text-white hover:bg-primary/90 transition-all active:scale-95
