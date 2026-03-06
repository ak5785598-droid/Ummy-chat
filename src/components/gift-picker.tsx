'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { GoldCoinIcon } from '@/components/icons';
import { Mic, Home, ChevronRight, Send, Loader, User } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface GiftItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  animationId: string;
}

const GIFTS: Record<string, GiftItem[]> = {
  'Hot': [
    { id: 'g1', name: 'Color Powder', price: 5000, icon: '🌈', animationId: 'color-carnival' },
    { id: 'g2', name: 'Color Palette', price: 15000, icon: '🎨', animationId: 'color-carnival' },
    { id: 'g3', name: 'Color Temple', price: 50000, icon: '🕌', animationId: 'galaxy' },
    { id: 'g4', name: 'Color Carnival', price: 150000, icon: '🎭', animationId: 'celebration' },
    { id: 'g5', name: 'Pisces', price: 50, icon: '♓', animationId: 'heart' },
    { id: 'g6', name: 'Psc Patronus', price: 10000, icon: '🐟', animationId: 'galaxy' },
    { id: 'g7', name: 'Psc Palace', price: 100000, icon: '🏛️', animationId: 'castle' },
    { id: 'g8', name: 'Psc Fantasy', price: 500000, icon: '✨', animationId: 'supernova' },
  ],
  'Luxury': [
    { id: 'l1', name: 'Rolex Sync', price: 200000, icon: '⌚', animationId: 'rolex' },
    { id: 'l2', name: 'Elite Jet', price: 500000, icon: '🛩️', animationId: 'jet' },
  ],
  'SVIP': [
    { id: 's1', name: 'Dragon Vibe', price: 1000000, icon: '🐉', animationId: 'dragon' },
  ]
};

interface GiftPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  recipient?: { uid: string; name: string; avatarUrl?: string } | null;
  onGiftSent?: (giftId: string) => void;
}

/**
 * High-Fidelity Gift Picker Dimension.
 * Re-engineered to match the provided screenshot blueprint.
 */
export function GiftPicker({ open, onOpenChange, roomId, recipient, onGiftSent }: GiftPickerProps) {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!user || !firestore || !selectedGift || !userProfile) return;

    const totalCost = selectedGift.price * parseInt(quantity);
    if ((userProfile.wallet?.coins || 0) < totalCost) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Head to the vault to recharge.' });
      return;
    }

    setIsSending(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const roomRef = doc(firestore, 'chatRooms', roomId);

      const updateData = {
        'wallet.coins': increment(-totalCost),
        'wallet.totalSpent': increment(totalCost),
        'wallet.dailySpent': increment(totalCost),
        updatedAt: serverTimestamp()
      };

      // 1. Economic Handshake
      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      updateDocumentNonBlocking(roomRef, { 
        'stats.totalGifts': increment(totalCost),
        'stats.dailyGifts': increment(totalCost)
      });

      // 2. Broadcast Gift Event
      addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
        type: 'gift',
        senderId: user.uid,
        senderName: userProfile.username,
        senderAvatar: userProfile.avatarUrl || null,
        recipientName: recipient?.name || 'the Room',
        giftId: selectedGift.animationId,
        text: `sent ${selectedGift.name} x${quantity}`,
        timestamp: serverTimestamp()
      });

      if (onGiftSent) onGiftSent(selectedGift.animationId);
      
      toast({ title: 'Vibe Sent!', description: `Dispatched ${selectedGift.name} x${quantity}` });
      setSelectedGift(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Dispatch Failed' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Tribe Gift Vault</DialogTitle>
          <DialogDescription>Dispatch visual frequencies to the room.</DialogDescription>
        </DialogHeader>

        {/* User Stats Header Protocol */}
        <div className="p-6 pb-2 space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-green-500 overflow-hidden">
                       <Avatar className="h-full w-full">
                          <AvatarImage src={userProfile?.avatarUrl || undefined} />
                          <AvatarFallback>U</AvatarFallback>
                       </Avatar>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black border border-black">1</div>
                 </div>
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className="h-4 border-amber-600 text-amber-500 text-[8px] font-black uppercase bg-amber-950/20">4</Badge>
                       <span className="text-[10px] font-black text-yellow-500 italic">+5000Exp (To Lv.5 : 9.9k)</span>
                    </div>
                    <Progress value={45} className="h-1 w-40 bg-white/5 [&>div]:bg-yellow-500" />
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Mic className="h-4 w-4 text-white/60" /></button>
                 <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Home className="h-4 w-4 text-white/60" /></button>
              </div>
           </div>

           <div className="flex items-center justify-between">
              <Tabs defaultValue="Hot" className="w-full">
                 <TabsList className="bg-transparent p-0 gap-6 h-10 border-none justify-start overflow-x-auto no-scrollbar">
                    {Object.keys(GIFTS).map(tab => (
                      <TabsTrigger key={tab} value={tab} className="p-0 text-sm font-black uppercase italic tracking-tighter text-white/40 data-[state=active]:text-white data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white after:opacity-0 data-[state=active]:after:opacity-100">
                        {tab}
                      </TabsTrigger>
                    ))}
                    {['Lucky', 'SVIP', 'Country', 'Bag'].filter(t => !GIFTS[t]).map(tab => (
                      <span key={tab} className="text-sm font-black uppercase italic tracking-tighter text-white/20 cursor-default">{tab}</span>
                    ))}
                 </TabsList>

                 {Object.entries(GIFTS).map(([category, items]) => (
                   <TabsContent key={category} value={category} className="mt-4 animate-in fade-in duration-500">
                      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                         {items.map(gift => (
                           <button 
                             key={gift.id} 
                             onClick={() => setSelectedGift(gift)}
                             className={cn(
                               "flex flex-col items-center gap-1 group relative py-2 rounded-2xl transition-all",
                               selectedGift?.id === gift.id ? "bg-white/10 ring-1 ring-white/20 shadow-xl scale-105" : "hover:bg-white/5"
                             )}
                           >
                              <div className="text-3xl drop-shadow-lg mb-1">{gift.icon}</div>
                              <span className="text-[9px] font-black text-white uppercase tracking-tighter text-center px-1 leading-tight">{gift.name}</span>
                              <div className="flex items-center gap-1 text-yellow-500">
                                 <GoldCoinIcon className="h-2.5 w-2.5" />
                                 <span className="text-[10px] font-black italic">{gift.price}</span>
                              </div>
                           </button>
                         ))}
                      </div>
                   </TabsContent>
                 ))}
              </Tabs>
           </div>
        </div>

        {/* Footer Interaction Bar */}
        <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between gap-4">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
              <GoldCoinIcon className="h-5 w-5" />
              <span className="text-lg font-black italic text-white">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              <ChevronRight className="h-4 w-4 text-white/40" />
           </div>

           <div className="flex items-center gap-3">
              <Select value={quantity} onValueChange={setQuantity}>
                 <SelectTrigger className="w-20 h-10 rounded-full bg-white/5 border-white/10 text-white font-black italic">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {['1', '10', '99', '520', '999'].map(q => (
                      <SelectItem key={q} value={q} className="font-black italic">{q}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>

              <Button 
                onClick={handleSend}
                disabled={!selectedGift || isSending}
                className="bg-gradient-to-r from-[#fcd34d] via-[#f59e0b] to-[#b45309] text-white h-10 px-8 rounded-full font-black uppercase italic shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                 {isSending ? <Loader className="h-4 w-4 animate-spin" /> : 'Send'}
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}