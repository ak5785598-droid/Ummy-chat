'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { Home, ChevronRight, Send, Loader, Info, Sparkles, Check } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
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
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";
import type { RoomParticipant } from '@/lib/types';

export interface GiftItem {
 id: string;
 name: string;
 price: number;
 icon: string;
 animationId: string;
 type?: 'standard' | 'lucky';
 isPremium?: boolean;
}

const GIFTS: Record<string, GiftItem[]> = {
 'Hot': [
  { id: 'neon_heart', name: 'Neon Heart', price: 100, icon: '💝', animationId: 'neon-heart' },
  { id: 'cyber_rose', name: 'Cyber Rose', price: 299, icon: '🌹', animationId: 'cyber-rose' },
  { id: 'halo', name: 'Angelic Halo', price: 999, icon: '😇', animationId: 'halo' },
  { id: 'golden_sword', name: 'Ocean Sword', price: 5000, icon: '⚔️', animationId: 'golden-sword' },
  { id: 'magic_lamp', name: 'Magic Lamp', price: 8000, icon: '🪔', animationId: 'magic-lamp' },
  { id: 'diamond', name: 'Diamond', price: 15000, icon: '💎', animationId: 'diamond' },
 ],
 'Lucky': [
  { id: 'lucky_clover', name: 'Lucky Clover', price: 100, icon: '🍀', animationId: 'lucky-clover', type: 'lucky' },
  { id: 'magic_wand', name: 'Magic Wand', price: 500, icon: '🪄', animationId: 'magic-wand', type: 'lucky' },
  { id: 'jackpot', name: 'Jackpot', price: 2000, icon: '🎰', animationId: 'jackpot', type: 'lucky' },
  { id: 'treasure', name: 'Treasure', price: 10000, icon: '🪙', animationId: 'treasure', type: 'lucky' },
 ],
 'Luxury': [
  { id: 'cyber_car', name: 'Cyberpunk 911', price: 74999, icon: '🏎️', animationId: 'cyber-car', isPremium: true },
  { id: 'quantum_jet', name: 'Quantum Jet', price: 150000, icon: '🛩️', animationId: 'quantum-jet', isPremium: true },
  { id: 'galactic_castle', name: 'Star Castle', price: 500000, icon: '🏰', animationId: 'galactic-castle', isPremium: true },
  { id: 'holo_dragon', name: 'Holo Dragon', price: 999999, icon: '🐉', animationId: 'holo-dragon', isPremium: true }, 
 ],
 'SVIP': [
  { id: 'crown_of_kings', name: 'King\'s Crown', price: 50000, icon: '👑', animationId: 'crown-of-kings', isPremium: true },
  { id: 'diamond_throne', name: 'Diamond Throne', price: 250000, icon: '💺', animationId: 'diamond-throne', isPremium: true },
 ]
};

interface GiftPickerProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 roomId: string;
 recipient?: { uid: string; name: string; avatarUrl?: string } | null;
 participants?: RoomParticipant[];
}

export function GiftPicker({ open, onOpenChange, roomId, recipient: initialRecipient, participants = [] }: GiftPickerProps) {
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();
 const { toast } = useToast();

 const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
 const [quantity, setQuantity] = useState('1');
 const [isSending, setIsSending] = useState(false);
 const [selectedUids, setSelectedUids] = useState<string[]>([]);

 const seatedParticipants = useMemo(() => {
  return participants.filter(p => p.seatIndex > 0).sort((a, b) => a.seatIndex - b.seatIndex);
 }, [participants]);

 useEffect(() => {
  if (open) {
   if (initialRecipient) {
    setSelectedUids([initialRecipient.uid]);
   } else if (seatedParticipants.length > 0) {
    setSelectedUids([seatedParticipants[0].uid]);
   }
  }
 }, [open, initialRecipient?.uid, seatedParticipants.length]);

 const toggleRecipient = (uid: string) => {
  setSelectedUids(prev => {
   if (prev.includes(uid)) return prev.filter(id => id !== uid);
   return [...prev, uid];
  });
 };

 const selectAll = () => {
  const allUids = seatedParticipants.map(p => p.uid);
  if (selectedUids.length === allUids.length) setSelectedUids([]);
  else setSelectedUids(allUids);
 };

 const handleSend = async () => {
  if (!user || !firestore || !selectedGift || !userProfile || selectedUids.length === 0) return;

  const qtyNum = parseInt(quantity);
  const costPerRecipient = selectedGift.price * qtyNum;
  const totalCost = costPerRecipient * selectedUids.length;
  
  if ((userProfile.wallet?.coins || 0) < totalCost) {
   toast({ variant: 'destructive', title: 'Insufficient Coins' });
   return;
  }

  setIsSending(true);
  try {
   const batch = writeBatch(firestore);
   const senderRef = doc(firestore, 'users', user.uid);
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const roomRef = doc(firestore, 'chatRooms', roomId);

   const senderUpdate = {
    'wallet.coins': increment(-totalCost),
    'wallet.totalSpent': increment(totalCost),
    'wallet.dailySpent': increment(totalCost),
    'wallet.weeklySpent': increment(totalCost),
    'wallet.monthlySpent': increment(totalCost),
    updatedAt: serverTimestamp()
   };
   batch.update(senderRef, senderUpdate);
   batch.update(senderProfileRef, senderUpdate);

   batch.update(roomRef, {
    'stats.totalGifts': increment(totalCost),
    'stats.dailyGifts': increment(totalCost),
    'stats.weeklyGifts': increment(totalCost),
    'stats.monthlyGifts': increment(totalCost),
    updatedAt: serverTimestamp()
   });

   selectedUids.forEach(recipientUid => {
    const diamondYield = Math.floor(costPerRecipient * 0.4);
    const recipientRef = doc(firestore, 'users', recipientUid);
    const recipientProfileRef = doc(firestore, 'users', recipientUid, 'profile', recipientUid);
    const pRef = doc(firestore, 'chatRooms', roomId, 'participants', recipientUid);
    
    const recUpdate = {
     'wallet.diamonds': increment(diamondYield),
     'stats.dailyGiftsReceived': increment(costPerRecipient),
     'stats.weeklyGiftsReceived': increment(costPerRecipient),
     'stats.monthlyGiftsReceived': increment(costPerRecipient),
     updatedAt: serverTimestamp()
    };
    batch.update(recipientRef, recUpdate);
    batch.update(recipientProfileRef, recUpdate);
    batch.update(pRef, { sessionGifts: increment(costPerRecipient) });

    const contribRef = doc(firestore, 'users', recipientUid, 'topContributors', user.uid);
    batch.set(contribRef, {
     uid: user.uid,
     username: userProfile.username,
     avatarUrl: userProfile.avatarUrl || '',
     amount: increment(costPerRecipient),
     updatedAt: serverTimestamp()
    }, { merge: true });
   });

   const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
   const recNames = selectedUids.length === seatedParticipants.length 
    ? 'everyone' 
    : selectedUids.length === 1 
     ? participants.find(p => p.uid === selectedUids[0])?.name || 'someone'
     : `${selectedUids.length} members`;

   batch.set(msgRef, {
    type: 'gift',
    senderId: user.uid,
    senderName: userProfile.username,
    senderAvatar: userProfile.avatarUrl || null,
    recipientName: recNames,
    giftId: selectedGift.animationId,
    text: `sent ${selectedGift.name} x${quantity}`,
    timestamp: serverTimestamp()
   });

   await batch.commit();
   
   toast({ title: 'Gifts Dispatched!' });
   onOpenChange(false);
   setSelectedGift(null);
  } catch (e: any) {
   toast({ variant: 'destructive', title: 'Dispatch Failed' });
  } finally {
   setIsSending(false);
  }
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[400px] bg-[#12161f]/95 backdrop-blur-3xl border border-white/5 p-0 rounded-t-[40px] sm:rounded-[40px] overflow-hidden text-white font-sans shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-500">
    <DialogHeader className="sr-only">
     <DialogTitle>Gift Vault</DialogTitle>
     <DialogDescription>Dispatch tribal assets to seated members.</DialogDescription>
    </DialogHeader>

    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
       <button 
        key="all-selection-btn"
        onClick={selectAll}
        className={cn(
         "h-10 px-4 rounded-full font-bold uppercase text-[10px] transition-all shrink-0 border-2",
         selectedUids.length === seatedParticipants.length ? "bg-white text-black border-white" : "bg-[#1f2430] text-white/40 border-transparent hover:bg-white/10"
        )}
       >
        All
       </button>
       {seatedParticipants.map((p, idx) => (
        <button 
         key={p.uid || `participant-${idx}`}
         onClick={() => toggleRecipient(p.uid)}
         className="relative shrink-0 active:scale-90 transition-transform"
        >
          <Avatar className={cn(
           "h-10 w-10 border-2 transition-all",
           selectedUids.includes(p.uid) ? "border-[#00E676] scale-110 shadow-[0_0_15px_rgba(0,230,118,0.5)]" : "border-white/10"
          )}>
           <AvatarImage src={p.avatarUrl} />
           <AvatarFallback>{(p.name || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          {selectedUids.includes(p.uid) && (
           <div className="absolute -top-1 -right-1 bg-[#00E676] rounded-full p-0.5">
            <Check className="h-2 w-2 text-black" strokeWidth={4} />
           </div>
          )}
        </button>
       ))}
      </div>

      <div className="flex items-center justify-between">
       <Tabs defaultValue="Hot" className="w-full">
         <TabsList className="bg-transparent p-0 gap-5 h-8 border-none justify-start mb-2 overflow-x-auto no-scrollbar w-full">
          {['Hot', 'Lucky', 'Luxury', 'SVIP'].map(tab => (
           <TabsTrigger key={`tab-trigger-${tab}`} value={tab} className="p-0 text-[13px] font-bold text-white/40 data-[state=active]:text-[#00E676] data-[state=active]:bg-transparent relative after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-[#00E676] after:opacity-0 data-[state=active]:after:opacity-100 transition-all shrink-0">
            {tab}
           </TabsTrigger>
          ))}
         </TabsList>

         <div className="h-[260px] overflow-y-auto no-scrollbar pb-4 pt-1">
          {Object.entries(GIFTS).map(([category, items]) => (
           <TabsContent key={`tab-content-${category}`} value={category} className="mt-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {items.map(gift => (
               <button 
                key={`gift-item-${gift.id}`} 
                onClick={() => setSelectedGift(gift)}
                className={cn(
                 "flex flex-col items-center gap-1 group relative py-3 rounded-2xl transition-all border",
                 selectedGift?.id === gift.id ? "bg-[#1f2430] border-[#00E676] shadow-[0_4px_20px_rgba(0,230,118,0.15)] scale-[1.02]" : "bg-transparent border-transparent hover:bg-white/5",
                 gift.isPremium && "bg-gradient-to-b from-white/5 to-transparent border-white/5"
                )}
               >
                {gift.isPremium && (
                 <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-0.5 shadow-[0_0_10px_rgba(236,72,153,0.8)] z-10">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                 </div>
                )}
                <div className="text-[40px] drop-shadow-2xl mb-1 group-hover:scale-110 transition-transform duration-300 transform-gpu">{gift.icon}</div>
                <span className="text-[10px] font-medium text-white/90 text-center leading-tight truncate w-full px-1">{gift.name}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <GoldCoinIcon className="h-3 w-3" />
                  <span className="text-[10px] font-bold text-yellow-400">{gift.price}</span>
                </div>
               </button>
              ))}
            </div>
           </TabsContent>
          ))}
         </div>
       </Tabs>
      </div>
    </div>

    <div className="p-4 bg-[#0a0c10] border-t border-white/5 flex items-center justify-between gap-3 rounded-b-[40px] sm:rounded-b-[40px]">
      <div className="flex items-center gap-1.5 bg-[#1f2430] px-3 py-1.5 rounded-full border border-white/5 active:scale-95 transition-transform cursor-pointer">
       <GoldCoinIcon className="h-4 w-4" />
       <span className="text-xs font-bold text-white tracking-wide">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
       <ChevronRight className="h-3 w-3 text-white/40 ml-1" />
      </div>

      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-16 h-9 rounded-full bg-[#1f2430] border-white/5 text-white font-bold text-[11px] px-3 shadow-inner">
          <SelectValue />
         </SelectTrigger>
         <SelectContent className="bg-[#1f2430] border-white/10 text-white rounded-xl shadow-2xl">
          {['1', '9', '49', '99', '499'].map(q => (
           <SelectItem key={`qty-${q}`} value={q} className="font-bold text-xs hover:bg-white/5 focus:bg-white/5">{q}</SelectItem>
          ))}
         </SelectContent>
       </Select>

       <button 
        onClick={handleSend}
        disabled={!selectedGift || isSending || selectedUids.length === 0}
        className={cn(
         "h-9 px-7 rounded-full font-bold uppercase text-[12px] shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-all flex items-center justify-center min-w-[80px]",
         !selectedGift || selectedUids.length === 0 ? "bg-[#1f2430] text-white/30 shadow-none pointer-events-none" : "bg-[#00E676] text-black hover:bg-[#00c853] active:scale-95"
        )}
       >
         {isSending ? <Loader className="h-4 w-4 animate-spin" /> : 'Send'}
       </button>
      </div>
    </div>
   </DialogContent>
  </Dialog>
 );
}
