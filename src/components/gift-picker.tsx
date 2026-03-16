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
}

const GIFTS: Record<string, GiftItem[]> = {
  'Hot': [
    { id: 'rose', name: 'Rose', price: 10, icon: '🌹', animationId: 'rose' },
    { id: 'heart', name: 'Heart', price: 50, icon: '💖', animationId: 'heart' },
    { id: 'ring', name: 'Propose Ring', price: 100000, icon: '💍', animationId: 'propose-ring' },
    { id: 'car', name: 'Elite Car', price: 50000, icon: '🏎️', animationId: 'car' },
  ],
  'Lucky': [
    { id: 'lucky_clover', name: 'Lucky Clover', price: 100, icon: '🍀', animationId: 'lucky-clover', type: 'lucky' },
    { id: 'lucky_crown', name: 'Lucky Crown', price: 500, icon: '👑', animationId: 'lucky-crown', type: 'lucky' },
    { id: 'lucky_maple', name: 'Lucky Maple', price: 1000, icon: '🍁', animationId: 'lucky-maple', type: 'lucky' },
    { id: 'lucky_star', name: 'Lucky Star', price: 5000, icon: '⭐', animationId: 'lucky-star', type: 'lucky' },
  ],
  'Luxury': [
    { id: 'cake', name: 'Cake', price: 500000, icon: '🎂', animationId: 'cake' },
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

      // SENDER SYNC (Daily, Weekly, Monthly Rich Score)
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

      // ROOM SYNC (Daily, Weekly, Monthly Stats)
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
        
        // RECIPIENT SYNC (Daily, Weekly, Monthly Charm Score)
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
      <DialogContent className="sm:max-w-[380px] bg-[#1a1a1a]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Gift Vault</DialogTitle>
          <DialogDescription>Dispatch tribal assets toseated members.</DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button 
                onClick={selectAll}
                className={cn(
                  "h-10 px-4 rounded-full font-black uppercase text-[10px] italic transition-all shrink-0 border-2",
                  selectedUids.length === seatedParticipants.length ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10"
                )}
              >
                All
              </button>
              {seatedParticipants.map((p) => (
                <button 
                  key={p.uid}
                  onClick={() => toggleRecipient(p.uid)}
                  className="relative shrink-0 active:scale-90 transition-transform"
                >
                   <Avatar className={cn(
                     "h-10 w-10 border-2 transition-all",
                     selectedUids.includes(p.uid) ? "border-primary scale-110 shadow-lg" : "border-white/10"
                   )}>
                      <AvatarImage src={p.avatarUrl} />
                      <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                   {selectedUids.includes(p.uid) && (
                     <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-2 w-2 text-black" strokeWidth={4} />
                     </div>
                   )}
                </button>
              ))}
           </div>

           <div className="flex items-center justify-between">
              <Tabs defaultValue="Hot" className="w-full">
                 <TabsList className="bg-transparent p-0 gap-4 h-8 border-none justify-start">
                    {['Hot', 'Lucky', 'Luxury', 'SVIP'].map(tab => (
                      <TabsTrigger key={tab} value={tab} className="p-0 text-xs font-black uppercase italic text-white/40 data-[state=active]:text-white data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white after:opacity-0 data-[state=active]:after:opacity-100 transition-all">
                        {tab}
                      </TabsTrigger>
                    ))}
                 </TabsList>

                 {Object.entries(GIFTS).map(([category, items]) => (
                   <TabsContent key={category} value={category} className="mt-4 animate-in fade-in duration-500">
                      <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                         {items.map(gift => (
                           <button 
                             key={gift.id} 
                             onClick={() => setSelectedGift(gift)}
                             className={cn(
                               "flex flex-col items-center gap-1 group relative py-2 rounded-xl transition-all",
                               selectedGift?.id === gift.id ? "bg-white/10 ring-1 ring-white/20 shadow-xl" : "hover:bg-white/5"
                             )}
                           >
                              <div className="text-3xl drop-shadow-lg mb-1 group-hover:scale-110 transition-transform">{gift.icon}</div>
                              <span className="text-[8px] font-black text-white uppercase tracking-tighter text-center leading-none truncate w-full px-1">{gift.name}</span>
                              <div className="flex items-center gap-0.5 text-yellow-500">
                                 <GoldCoinIcon className="h-2 w-2" />
                                 <span className="text-[9px] font-black italic">{gift.price}</span>
                              </div>
                           </button>
                         ))}
                      </div>
                   </TabsContent>
                 ))}
              </Tabs>
           </div>
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between gap-3">
           <div className="flex items-center gap-1.5">
              <GoldCoinIcon className="h-4 w-4" />
              <span className="text-xs font-black italic text-white">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
           </div>

           <div className="flex items-center gap-2">
              <Select value={quantity} onValueChange={setQuantity}>
                 <SelectTrigger className="w-16 h-8 rounded-full bg-white/5 border-white/10 text-white font-black italic text-[10px] px-2">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {['1', '10', '99', '520', '999'].map(q => (
                      <SelectItem key={q} value={q} className="font-black italic text-xs">{q}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>

              <Button 
                onClick={handleSend}
                disabled={!selectedGift || isSending || selectedUids.length === 0}
                className="bg-gradient-to-r from-yellow-400 to-orange-600 text-white h-8 px-6 rounded-full font-black uppercase italic text-[10px] shadow-lg active:scale-95 transition-all"
              >
                 {isSending ? <Loader className="h-3 w-3 animate-spin" /> : 'Send'}
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}