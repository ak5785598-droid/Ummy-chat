'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star, Loader, ChevronLeft, Crown, Check, Eye, Heart, Mic2, MessageSquare, Sparkles } from 'lucide-react'; 
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { ItemPreview } from '@/components/item-preview';

// --- HOD 2.0 ACCURATE FRAME DESIGN (REPLICATING IMAGE 7) ---
const Hod2Frame = ({ className = "w-28 h-28 md:w-32 md:h-32" }) => {
  return (
    <div className={cn("relative flex items-center justify-center p-2 group", className)}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="goldHOD" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFBD5" />
            <stop offset="50%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="pCrystal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#e91e63" /></linearGradient>
          <linearGradient id="bCrystal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#2196f3" /></linearGradient>
          <linearGradient id="yCrystal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#ffeb3b" /></linearGradient>
        </defs>

        {/* Multi-layered Crystalline Feather Pattern */}
        <g transform="translate(60,60)">
          {[...Array(24)].map((_, i) => {
            const angle = (i * 15) - 165;
            if (i > 10 && i < 14) return null; // Space for the Bow at bottom
            const crystalGrad = i % 3 === 0 ? "url(#pCrystal)" : i % 2 === 0 ? "url(#bCrystal)" : "url(#yCrystal)";
            return (
              <g key={i} transform={`rotate(${angle}) translate(0, -48)`}>
                {/* Gold Leaf Structure */}
                <path d="M0,0 C4,-8 10,-12 2,-22 C-6,-12 -2,-8 0,0" fill="url(#goldHOD)" stroke="#bf360c" strokeWidth="0.5" />
                {/* Crystal Sharp Facet */}
                <path d="M-2,-3 C-8,-14 -12,-20 -2,-30 C4,-20 -6,-14 -2,-3" fill={crystalGrad} stroke="white" strokeWidth="0.4" opacity="0.9" />
                {/* Shine Particle */}
                <circle cx="0" cy="-25" r="0.6" fill="white" className="animate-pulse" />
              </g>
            );
          })}
        </g>

        {/* The BIG Pink Glossy Bow (Exactly like Image 7) */}
        <g transform="translate(60, 94)">
          {/* Main Bow Wings */}
          <path d="M0,0 C-15,-5 -38,-28 -38,-10 C-38,12 -15,18 0,8 Z" fill="#ff4081" stroke="#880e4f" strokeWidth="1.2" />
          <path d="M0,0 C15,-5 38,-28 38,-10 C38,12 15,18 0,8 Z" fill="#ff4081" stroke="#880e4f" strokeWidth="1.2" />
          {/* Glossy Knot */}
          <rect x="-7" y="-5" width="14" height="14" rx="4" fill="#f50057" stroke="#ad1457" strokeWidth="1" />
          {/* Ribbon Tails */}
          <path d="M-4,9 L-20,26 L-10,22 Z" fill="#c2185b" stroke="#880e4f" strokeWidth="0.5" />
          <path d="M4,9 L20,26 L10,22 Z" fill="#c2185b" stroke="#880e4f" strokeWidth="0.5" />
        </g>
      </svg>

      {/* Avatar Display */}
      <div className="absolute inset-[22%] rounded-full overflow-hidden border-2 border-white/80 shadow-lg bg-slate-100">
        <Avatar className="w-full h-full">
          <AvatarImage src="https://picsum.photos/seed/petal/200" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

// --- DATA & MAIN PAGE ---
const STATIC_STORE_ITEMS = [
  { id: 'hod-v2-petal', name: 'Petal Sovereignty V2', type: 'Frame', price: 3000000, isCustom: true, description: '3D Crystal & Silk Ribbon Premium Frame.' },
  { id: 'legendary-king', name: 'Legendary King', type: 'Frame', price: 1250000, description: '24k Gold Glow ruler frame.' },
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 15000, description: 'Animated floating heart bubble.' },
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

  const allItems = useMemo(() => {
    const themes = (dbThemes || []).filter(t => (t.price || 0) > 0).map(t => ({ ...t, type: 'Theme' }));
    return [...STATIC_STORE_ITEMS, ...themes];
  }, [dbThemes]);

  const handleAction = async (item: any, isOwned: boolean) => {
    if (!userProfile || !user || !firestore) return;
    const ref = doc(firestore, 'users', user.uid, 'profile', user.uid);

    if (!isOwned) {
      if ((userProfile.wallet?.coins || 0) < item.price) {
        toast({ variant: 'destructive', title: 'Coins kam hain bhai!' });
        return;
      }
      await updateDocumentNonBlocking(ref, { 
        'wallet.coins': increment(-item.price), 
        'inventory.ownedItems': arrayUnion(item.id),
        'updatedAt': serverTimestamp() 
      });
      toast({ title: 'Mubarak ho!', description: `${item.name} kharid liya.` });
    } else {
      const field = `inventory.active${item.type}`;
      await updateDocumentNonBlocking(ref, { [field]: item.id, updatedAt: serverTimestamp() });
      toast({ title: 'Equipped!', description: `${item.name} set ho gaya.` });
    }
  };

  if (isProfileLoading) return <div className="h-screen flex items-center justify-center bg-pink-50"><Loader className="animate-spin text-pink-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#FDF2F8] pb-24">
      <header className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft />
          </Button>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">Boutique</h1>
        </div>
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-2xl border border-amber-200">
          <GoldCoinIcon className="h-6 w-6" />
          <span className="font-black text-amber-700">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto">
        <Tabs defaultValue="Frame" className="space-y-6">
          <TabsList className="w-full justify-start bg-transparent gap-2 overflow-x-auto no-scrollbar">
            {['Frame', 'Theme', 'Bubble', 'Wave'].map(tab => (
              <TabsTrigger key={tab} value={tab} className="rounded-full px-6 py-2 font-bold data-[state=active]:bg-pink-500 data-[state=active]:text-white shadow-sm transition-all uppercase text-xs">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Frame" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {allItems.filter(i => i.type === 'Frame').map(item => {
              const isOwned = userProfile?.inventory?.ownedItems?.includes(item.id);
              const isActive = [userProfile?.inventory?.activeFrame].includes(item.id);

              return (
                <Card key={item.id} className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group">
                  <div className="aspect-square bg-slate-50 flex items-center justify-center p-4 relative">
                    {item.isCustom ? <Hod2Frame /> : <div className="text-slate-200"><Star size={60} /></div>}
                    <Badge className="absolute top-4 right-4 bg-white/90 text-slate-500 border-none font-bold text-[9px]">{item.type}</Badge>
                    <button onClick={() => setPreviewItem(item)} className="absolute bottom-4 left-4 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye size={16} />
                    </button>
                  </div>
                  
                  <CardHeader className="p-4 text-center">
                    <CardTitle className="text-sm font-black uppercase truncate">{item.name}</CardTitle>
                    <CardDescription className="text-[10px] line-clamp-1">{item.description}</CardDescription>
                  </CardHeader>

                  <CardFooter className="p-4 pt-0 flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 font-black text-amber-500 text-lg">
                      <GoldCoinIcon className="h-5 w-5" /> {item.price.toLocaleString()}
                    </div>
                    <Button 
                      onClick={() => handleAction(item, !!isOwned)}
                      className={cn("w-full h-11 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all", 
                        isActive ? "bg-green-500 text-white" : isOwned ? "bg-slate-100 text-slate-600" : "bg-pink-500 text-white shadow-pink-200 shadow-lg"
                      )}
                    >
                      {isActive ? 'Active' : isOwned ? 'Equip' : 'Purchase'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>

      <ItemPreview isOpen={!!previewItem} onClose={() => setPreviewItem(null)} item={previewItem} />
    </div>
  );
}
