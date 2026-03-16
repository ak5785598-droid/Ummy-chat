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
import { Mic, Home, ChevronRight, Send, Loader, User, Info, Sparkles } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  onGiftSent?: (gift: GiftItem, qty: number, recipient: any) => void;
}

/**
 * High-Fidelity Gift Vault.
 * Re-engineered to sync with the 🔥 Gift Calculator.
 */
export function GiftPicker({ open, onOpenChange, roomId, recipient, onGiftSent }: GiftPickerProps) {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isSending, setIsSending] = useState(false);

  const calculateLuckyWin = (price: number, qty: number) => {
    const roll = Math.random() * 100;
    let multiplier = 0;

    if (roll < 0.05) multiplier = 1000;
    else if (roll < 0.2) multiplier = 100;
    else if (roll < 1.0) multiplier = 50;
    else if (roll < 5.0) multiplier = 5;
    else if (roll < 15.0) multiplier = 2;
    else if (roll < 60.0) multiplier = 1;
    else multiplier = 0;

    return { multiplier, winAmount: price * qty * multiplier };
  };

  const handleSend = async () => {
    if (!user || !firestore || !selectedGift || !userProfile) return;

    const qtyNum = parseInt(quantity);
    const totalCost = selectedGift.price * qtyNum;
    
    if ((userProfile.wallet?.coins || 0) < totalCost) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Head to the vault to recharge.' });
      return;
    }

    setIsSending(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const roomRef = doc(firestore, 'chatRooms', roomId);

      let winAmount = 0;
      let luckyResult = null;

      if (selectedGift.type === 'lucky') {
        const { multiplier, winAmount: won } = calculateLuckyWin(selectedGift.price, qtyNum);
        winAmount = won;
        if (multiplier > 0) {
          luckyResult = { multiplier, winAmount };
        }
      }

      const senderUpdateData = {
        'wallet.coins': increment(-(totalCost - winAmount)),
        'wallet.totalSpent': increment(totalCost),
        'wallet.dailySpent': increment(totalCost),
        updatedAt: serverTimestamp()
      };

      updateDocumentNonBlocking(userRef, senderUpdateData);
      updateDocumentNonBlocking(profileRef, senderUpdateData);
      updateDocumentNonBlocking(roomRef, { 
        'stats.totalGifts': increment(totalCost),
        'stats.dailyGifts': increment(totalCost),
        updatedAt: serverTimestamp()
      });

      if (recipient && recipient.uid && recipient.uid !== user.uid) {
        const diamondYield = Math.floor(totalCost * 0.4);
        const recipientRef = doc(firestore, 'users', recipient.uid);
        const recipientProfileRef = doc(firestore, 'users', recipient.uid, 'profile', recipient.uid);
        const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', recipient.uid);
        
        const recUpdateData = {
          'wallet.diamonds': increment(diamondYield),
          updatedAt: serverTimestamp()
        };

        updateDocumentNonBlocking(recipientRef, recUpdateData);
        updateDocumentNonBlocking(recipientProfileRef, recUpdateData);
        
        // CALCULATOR SYNC: Update participant session gifts
        updateDocumentNonBlocking(participantRef, {
          sessionGifts: increment(totalCost),
          updatedAt: serverTimestamp()
        });

        const contribRef = doc(firestore, 'users', recipient.uid, 'topContributors', user.uid);
        setDocumentNonBlocking(contribRef, {
          uid: user.uid,
          username: userProfile.username,
          avatarUrl: userProfile.avatarUrl || '',
          amount: increment(totalCost),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
        type: 'gift',
        senderId: user.uid,
        senderName: userProfile.username,
        senderAvatar: userProfile.avatarUrl || null,
        recipientName: recipient?.name || 'the Room',
        giftId: (luckyResult && luckyResult.multiplier >= 50) ? 'lucky-jackpot' : selectedGift.animationId,
        text: `sent ${selectedGift.name} x${quantity}`,
        luckyWin: luckyResult,
        timestamp: serverTimestamp()
      });

      if (onGiftSent) onGiftSent(selectedGift, qtyNum, recipient);
      
      if (winAmount > 0) {
        toast({ 
          title: 'Luck Synchronized!', 
          description: `You won ${winAmount.toLocaleString()} coins back! (${luckyResult?.multiplier}x)` 
        });
      }
      
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
      <DialogContent className="sm:max-w-[350px] bg-[#1a1a1a]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Gift Picker</DialogTitle>
          <DialogDescription>Select a gift to dispatch to the frequency.</DialogDescription>
        </DialogHeader>

        <div className="p-4 pb-2 space-y-3">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="relative">
                    <div className="h-10 w-10 rounded-full border-2 border-green-500 overflow-hidden">
                       <Avatar className="h-full w-full">
                          <AvatarImage src={userProfile?.avatarUrl || undefined} />
                          <AvatarFallback>U</AvatarFallback>
                       </Avatar>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white h-3.5 w-3.5 rounded-full flex items-center justify-center text-[7px] font-black border border-black">1</div>
                 </div>
                 <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                       <Badge variant="outline" className="h-3 border-amber-600 text-amber-500 text-[7px] font-black uppercase bg-amber-950/20 px-1">4</Badge>
                       <span className="text-[8px] font-black text-yellow-500 italic">+5000Exp</span>
                    </div>
                    <Progress value={45} className="h-0.5 w-20 bg-white/5 [&>div]:bg-yellow-500" />
                 </div>
              </div>
              <div className="flex gap-1.5">
                 <Popover>
                    <PopoverTrigger asChild>
                       <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                          <Info className="h-3 w-3 text-yellow-500" />
                       </button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-slate-900 border-white/10 text-white p-4 rounded-2xl w-60 shadow-2xl">
                       <h4 className="font-black uppercase italic text-xs mb-2 text-yellow-500">Yield Protocol</h4>
                       <p className="text-[10px] text-white/60 leading-relaxed font-body italic">Recipient yields 40% Diamond frequency from all coins received. Lucky gifts can trigger a jackpot win for the sender.</p>
                    </PopoverContent>
                 </Popover>
                 <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Home className="h-3 w-3 text-white/60" /></button>
              </div>
           </div>

           <div className="flex items-center justify-between">
              <Tabs defaultValue="Hot" className="w-full">
                 <TabsList className="bg-transparent p-0 gap-4 h-8 border-none justify-start overflow-x-auto no-scrollbar">
                    {['Hot', 'Lucky', 'Luxury', 'SVIP'].map(tab => (
                      <TabsTrigger key={tab} value={tab} className="p-0 text-xs font-black uppercase italic tracking-tighter text-white/40 data-[state=active]:text-white data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white after:opacity-0 data-[state=active]:after:opacity-100">
                        {tab}
                      </TabsTrigger>
                    ))}
                 </TabsList>

                 {Object.entries(GIFTS).map(([category, items]) => (
                   <TabsContent key={category} value={category} className="mt-2 animate-in fade-in duration-500">
                      <div className="grid grid-cols-4 gap-y-3 gap-x-1">
                         {items.map(gift => (
                           <button 
                             key={gift.id} 
                             onClick={() => setSelectedGift(gift)}
                             className={cn(
                               "flex flex-col items-center gap-0.5 group relative py-1.5 rounded-xl transition-all",
                               selectedGift?.id === gift.id ? "bg-white/10 ring-1 ring-white/20 shadow-xl scale-105" : "hover:bg-white/5"
                             )}
                           >
                              <div className="relative">
                                 <div className={cn(
                                   "text-2xl drop-shadow-lg mb-0.5 transition-transform group-hover:scale-110",
                                   gift.type === 'lucky' && "animate-reaction-pulse"
                                 )}>
                                    {gift.icon}
                                 </div>
                                 {gift.type === 'lucky' && (
                                   <div className="absolute -top-1 -right-1">
                                      <Sparkles className="h-2.5 w-2.5 text-yellow-400 animate-pulse" />
                                   </div>
                                 )}
                              </div>
                              <span className="text-[7px] font-black text-white uppercase tracking-tighter text-center px-1 leading-tight truncate w-full">{gift.name}</span>
                              <div className="flex items-center gap-0.5 text-yellow-500">
                                 <GoldCoinIcon className="h-2 w-2" />
                                 <span className="text-[8px] font-black italic">{gift.price}</span>
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
           <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onOpenChange(false)}>
              <GoldCoinIcon className="h-4 w-4" />
              <span className="text-xs font-black italic text-white">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
              <ChevronRight className="h-3 w-3 text-white/40" />
           </div>

           <div className="flex items-center gap-2">
              <Select value={quantity} onValueChange={setQuantity}>
                 <SelectTrigger className="w-14 h-7 rounded-full bg-white/5 border-white/10 text-white font-black italic text-[9px] px-2">
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
                disabled={!selectedGift || isSending}
                className="bg-gradient-to-r from-[#fcd34d] via-[#f59e0b] to-[#b45309] text-white h-7 px-5 rounded-full font-black uppercase italic text-[9px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                 {isSending ? <Loader className="h-3 w-3 animate-spin" /> : 'Send'}
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
