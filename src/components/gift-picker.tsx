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
import { GoldCoinIcon } from '@/components/icons';
import { ChevronRight, Loader, Sparkles, Check } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
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
  { id: 'choco_pops', name: 'Choco Pops', price: 200, icon: '🍭', animationId: 'choco-pops' },
  { id: 'pizza', name: 'Pizza', price: 499, icon: '🍕', animationId: 'pizza' }, 
  { id: 'doughnut', name: 'Doughnut', price: 999, icon: '🍩', animationId: 'doughnut' }, 
  { id: 'chai', name: 'Chai', price: 700, icon: '☕', animationId: 'chai' },
  { id: 'rose', name: 'Rose', price: 300, icon: '🌹', animationId: 'rose' },
  { id: 'applaud', name: 'Applaud', price: 500, icon: '👏', animationId: 'applaud' },
  { id: 'love_bomb', name: 'Love Bomb', price: 150999, icon: '💣', animationId: 'love-bomb' },
  { id: 'kiss', name: 'Kiss', price: 2499, icon: '💋', animationId: 'kiss' },
  { id: 'chocolate_box', name: 'Choco Box', price: 30000, icon: '🍫', animationId: 'chocolate-box' },
  { id: 'money_gun', name: 'Money Gun', price: 70000, icon: '🔫', animationId: 'money-gun' },
  { id: 'watch', name: 'Watch', price: 999999, icon: '⌚', animationId: 'watch' },
  { id: 'birthday_cake', name: 'Birthday Cake', price: 109000, icon: '🎂', animationId: 'birthday-cake' },
  { id: 'microphone', name: 'Microphone', price: 100, icon: '🎤', animationId: 'microphone' },
  { id: 'headphones', name: 'Headphones', price: 250, icon: '🎧', animationId: 'headphones' },
  { id: 'perfume', name: 'Perfume', price: 800, icon: '🧴', animationId: 'perfume' },
  { id: 'soccer_ball', name: 'Soccer Ball', price: 500, icon: '⚽', animationId: 'soccer-ball' },
  { id: 'ticket', name: 'Ticket', price: 300, icon: '🎟️', animationId: 'ticket' },
  { id: 'popcorn', name: 'Popcorn', price: 120, icon: '🍿', animationId: 'popcorn' },
  { id: 'controller', name: 'Controller', price: 1500, icon: '🎮', animationId: 'controller' },
  { id: 'vinyl', name: 'Vinyl', price: 600, icon: '📀', animationId: 'vinyl' },
  { id: 'bubble_tea', name: 'Bubble Tea', price: 180, icon: '🧋', animationId: 'bubble-tea' },
  { id: 'candy', name: 'Candy', price: 300, icon: '🍬', animationId: 'candy' },
  { id: 'ice_cream', name: 'Ice Cream', price: 150, icon: '🍦', animationId: 'ice-cream' },
  { id: 'burger', name: 'Burger', price: 350, icon: '🍔', animationId: 'burger' },
  { id: 'taco', name: 'Taco', price: 200, icon: '🌮', animationId: 'taco' },
  { id: 'cocktail', name: 'Cocktail', price: 900, icon: '🍸', animationId: 'cocktail' },
  { id: 'beer', name: 'Beer', price: 110, icon: '🍺', animationId: 'beer' },
  { id: 'champagne', name: 'Champagne', price: 2000, icon: '🥂', animationId: 'champagne' },
  { id: 'coffee', name: 'Coffee', price: 6990, icon: '☕', animationId: 'coffee' },
  { id: 'tea', name: 'Tea', price: 1550, icon: '🍵', animationId: 'tea' },
  { id: 'milk', name: 'Milk', price: 40499, icon: '🥛', animationId: 'milk' },
  { id: 'cookie', name: 'Cookie', price: 4000, icon: '🍪', animationId: 'cookie' },
 ],
 'Lucky': [
  { id: 'lucky_clover', name: 'Clover', price: 100, icon: '🍀', animationId: 'lucky-clover', type: 'lucky'},
  { id: 'magic_wand', name: 'Magic Wand', price: 500, icon: '🪄', animationId: 'magic-wand', type: 'lucky' },
  { id: 'jackpot', name: 'Jackpot', price: 2000, icon: '🎰', animationId: 'jackpot', type: 'lucky' },
  { id: 'treasure', name: 'Treasure', price: 10000, icon: '🪙', animationId: 'treasure', type: 'lucky' },
  { id: 'soaring', name: 'Soaring', price: 20000, icon: '🎆', animationId: 'soaring', type: 'lucky' },
  { id: 'golden_football', name: 'Gold Football', price: 77777, icon: '⚽', animationId: 'golden-football', type: 'lucky' },
  { id: 'dice', name: 'Dice', price: 150, icon: '🎲', animationId: 'dice', type: 'lucky' },
  { id: 'horseshoe', name: 'Horseshoe', price: 400, icon: '🧲', animationId: 'horseshoe', type: 'lucky' },
  { id: 'crystal_ball', name: 'Crystal Ball', price: 3000, icon: '🔮', animationId: 'crystal-ball', type: 'lucky' },
  { id: 'tarot', name: 'Tarot', price: 800, icon: '🃏', animationId: 'tarot', type: 'lucky' },
  { id: 'shooting_star', name: 'Shooting Star', price: 15000, icon: '🌠', animationId: 'shooting-star', type: 'lucky' },
  { id: 'rainbow', name: 'Rainbow', price: 5000, icon: '🌈', animationId: 'rainbow', type: 'lucky' },
  { id: 'pot_of_gold', name: 'Pot of Gold', price: 40000, icon: '🍯', animationId: 'pot-of-gold', type: 'lucky' },
  { id: 'eight_ball', name: '8-Ball', price: 250, icon: '🎱', animationId: 'eight-ball', type: 'lucky' },
  { id: 'fortune_cookie', name: 'Fortune Cookie', price: 75, icon: '🥠', animationId: 'fortune-cookie', type: 'lucky' },
  { id: 'red_envelope', name: 'Red Envelope', price: 888, icon: '🧧', animationId: 'red-envelope', type: 'lucky' },
  { id: 'wishbone', name: 'Wishbone', price: 350, icon: '🦴', animationId: 'wishbone', type: 'lucky' },
  { id: 'piggy_bank', name: 'Piggy Bank', price: 1200, icon: '🐷', animationId: 'piggy-bank', type: 'lucky' },
  { id: 'amulet', name: 'Amulet', price: 2500, icon: '🧿', animationId: 'amulet', type: 'lucky' },
  { id: 'leprechaun_hat', name: 'Hat', price: 6000, icon: '🎩', animationId: 'leprechaun-hat', type: 'lucky' },
  { id: 'magic_potion', name: 'Magic Potion', price: 4500, icon: '🧪', animationId: 'magic-potion', type: 'lucky' },
  { id: 'dreamcatcher', name: 'Dreamcatcher', price: 3200, icon: '🕸️', animationId: 'dreamcatcher', type: 'lucky' },
  { id: 'wishing_well', name: 'Wishing Well', price: 18000, icon: '⛲', animationId: 'wishing-well', type: 'lucky' },
  { id: 'gold_ingot', name: 'Gold Ingot', price: 25000, icon: '🧈', animationId: 'gold-ingot', type: 'lucky' },
 ],
 'Luxury': [
  { id: 'chupa_chups', name: 'Chupa Chups', price: 14999, icon: '🍭', animationId: 'chupa-chups' },
  { id: 'library', name: 'Library', price: 50000, icon: '📚', animationId: 'library', isPremium: true },
  { id: 'fountain', name: 'Fountain', price: 50000, icon: '⛲', animationId: 'fountain', isPremium: true },
  { id: 'diamond', name: 'Diamond', price: 70000, icon: '💎', animationId: 'diamond', isPremium: true },
  { id: 'lipstick', name: 'Lipstick', price: 70000, icon: '💄', animationId: 'lipstick', isPremium: true },
  { id: 'trophy', name: 'Trophy', price: 90000, icon: '🏆', animationId: 'trophy', isPremium: true },
  { id: 'golden_phone', name: 'Golden Phone', price: 99999, icon: '📱', animationId: 'golden-phone', isPremium: true },
  { id: 'gem_knife', name: 'Gem Knife', price: 160000, icon: '🗡️', animationId: 'gem-knife', isPremium: true },
  { id: 'scepter', name: 'Scepter', price: 200000, icon: '🦯', animationId: 'scepter', isPremium: true },
  { id: 'dressing_table', name: 'Dressing Table', price: 300000, icon: '🪞', animationId: 'dressing-table', isPremium: true },
  { id: 'yacht', name: 'Yacht', price: 250000, icon: '🛥️', animationId: 'yacht', isPremium: true },
  { id: 'mansion', name: 'Mansion', price: 350000, icon: '🏡', animationId: 'mansion', isPremium: true },
  { id: 'private_island', name: 'Island', price: 400000, icon: '🏝️', animationId: 'private-island', isPremium: true },
  { id: 'helicopter', name: 'Helicopter', price: 220000, icon: '🚁', animationId: 'helicopter', isPremium: true },
  { id: 'submarine', name: 'Submarine', price: 280000, icon: '🛳️', animationId: 'submarine', isPremium: true },
  { id: 'limo', name: 'Limo', price: 120000, icon: '🚘', animationId: 'limo', isPremium: true },
  { id: 'private_jet', name: 'Private Jet', price: 380000, icon: '🛩️', animationId: 'private-jet', isPremium: true },
  { id: 'diamond_necklace', name: 'Necklace', price: 150000, icon: '💎', animationId: 'diamond-necklace', isPremium: true },
  { id: 'gold_watch', name: 'Gold Watch', price: 80000, icon: '⌚', animationId: 'gold-watch', isPremium: true },
  { id: 'designer_bag', name: 'Designer Bag', price: 60000, icon: '👜', animationId: 'designer-bag', isPremium: true },
  { id: 'stiletto', name: 'Stiletto', price: 50000, icon: '👠', animationId: 'stiletto', isPremium: true },
  { id: 'ring', name: 'Ring', price: 110000, icon: '💍', animationId: 'ring', isPremium: true },
  { id: 'crystal_chandelier', name: 'Chandelier', price: 90000, icon: '✨', animationId: 'crystal-chandelier', isPremium: true },
  { id: 'sports_car', name: 'Sports Car', price: 200000, icon: '🏎️', animationId: 'sports-car', isPremium: true },
  { id: 'grand_piano', name: 'Grand Piano', price: 130000, icon: '🎹', animationId: 'grand-piano', isPremium: true },
  { id: 'stradivarius', name: 'Stradivarius', price: 170000, icon: '🎻', animationId: 'stradivarius', isPremium: true },
  { id: 'arabian_horse', name: 'Arabian Horse', price: 140000, icon: '🐎', animationId: 'arabian-horse', isPremium: true },
  { id: 'purebred_dog', name: 'Purebred Dog', price: 60000, icon: '🐩', animationId: 'purebred-dog', isPremium: true },
  { id: 'exotic_bird', name: 'Exotic Bird', price: 75000, icon: '🦚', animationId: 'exotic-bird', isPremium: true },
  { id: 'silver_platter', name: 'Silver Platter', price: 50000, icon: '🍽️', animationId: 'silver-platter', isPremium: true },
 ],
 'Flag': [
  { id: 'flag_india', name: 'India', price: 50000, icon: '🇮🇳', animationId: 'flag-india', isPremium: true },
  { id: 'flag_pakistan', name: 'Pakistan', price: 50000, icon: '🇵🇰', animationId: 'flag-pakistan', isPremium: true },
  { id: 'flag_canada', name: 'Canada', price: 50000, icon: '🇨🇦', animationId: 'flag-canada', isPremium: true },
  { id: 'flag_america', name: 'America', price: 50000, icon: '🇺🇸', animationId: 'flag-america', isPremium: true },
  { id: 'flag_phillip', name: 'Phillip', price: 50000, icon: '🇵🇭', animationId: 'flag-phillip', isPremium: true },
 ],
 'Events': [
  { id: 'eid_lantern', name: 'Eid Lantern', price: 5000, icon: '🏮', animationId: 'eid-lantern' },
  { id: 'eid_cannon', name: 'Eid Cannon', price: 15000, icon: '💣', animationId: 'eid-cannon' },
  { id: 'eid_feast', name: 'Eid Feast', price: 50000, icon: '🍲', animationId: 'eid-feast' },
  { id: 'eid_mubarak', name: 'Eid Mubarak', price: 150000, icon: '🕌', animationId: 'eid-mubarak', isPremium: true },
  { id: 'fireworks', name: 'Fireworks', price: 10000, icon: '🎆', animationId: 'fireworks' },
  { id: 'confetti', name: 'Confetti', price: 2000, icon: '🎊', animationId: 'confetti' },
  { id: 'birthday_hat', name: 'Birthday Hat', price: 500, icon: '🥳', animationId: 'birthday-hat' },
  { id: 'christmas_tree', name: 'Christmas Tree', price: 25000, icon: '🎄', animationId: 'christmas-tree', isPremium: true },
  { id: 'santa_sleigh', name: 'Santa Sleigh', price: 50000, icon: '🎅', animationId: 'santa-sleigh', isPremium: true },
  { id: 'snowman', name: 'Snowman', price: 15000, icon: '⛄', animationId: 'snowman' },
  { id: 'jack_o_lantern', name: 'Jack-o-Lantern', price: 15000, icon: '🎃', animationId: 'jack-o-lantern' },
  { id: 'easter_egg', name: 'Easter Egg', price: 5000, icon: '🥚', animationId: 'easter-egg' },
  { id: 'valentine_heart', name: 'Valentine Heart', price: 20000, icon: '💖', animationId: 'valentine-heart' },
  { id: 'thanksgiving_turkey', name: 'Turkey', price: 12000, icon: '🦃', animationId: 'thanksgiving-turkey' },
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
   if (initialRecipient) setSelectedUids([initialRecipient.uid]);
   else if (seatedParticipants.length > 0) setSelectedUids([seatedParticipants[0].uid]);
  }
 }, [open, initialRecipient?.uid, seatedParticipants.length]);

 const toggleRecipient = (uid: string) => {
  setSelectedUids(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
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

   batch.update(senderRef, { 'wallet.coins': increment(-totalCost), 'wallet.totalSpent': increment(totalCost), updatedAt: serverTimestamp() });
   batch.update(senderProfileRef, { 'wallet.coins': increment(-totalCost), 'wallet.totalSpent': increment(totalCost), updatedAt: serverTimestamp() });

   let luckyWin = null;
   if (selectedGift.type === 'lucky') {
     const rand = Math.random() * 1000;
     let multiplier = 0;
     if (rand <= 0.2) multiplier = 100;
     else if (rand <= 0.8) multiplier = 50;
     else if (rand <= 4) multiplier = 10;
     else if (rand <= 50) multiplier = 2;
     
     if (multiplier > 0) {
       const winAmount = costPerRecipient * multiplier;
       luckyWin = { multiplier, winAmount };
       batch.update(senderRef, { 'wallet.coins': increment(winAmount) });
       batch.update(senderProfileRef, { 'wallet.coins': increment(winAmount) });
     }
   }

   selectedUids.forEach(uid => {
     const diamondYield = Math.floor(costPerRecipient * 0.4);
     const recRef = doc(firestore, 'users', uid);
     const recProfRef = doc(firestore, 'users', uid, 'profile', uid);
     batch.update(recRef, { 'wallet.diamonds': increment(diamondYield), updatedAt: serverTimestamp() });
     batch.update(recProfRef, { 'wallet.diamonds': increment(diamondYield), updatedAt: serverTimestamp() });
   });

   const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
   batch.set(msgRef, {
    type: 'gift',
    senderId: user.uid,
    senderName: userProfile.username,
    giftId: selectedGift.animationId,
    text: `sent ${selectedGift.name} x${quantity}${luckyWin ? ` (WON ${luckyWin.multiplier}x!)` : ''}`,
    luckyWin,
    timestamp: serverTimestamp()
   });

   await batch.commit();
   toast({ title: luckyWin ? `🎰 Jackpot! Won ${luckyWin.winAmount}!` : 'Sent!' });
   onOpenChange(false);
  } catch (e) {
   toast({ variant: 'destructive', title: 'Failed' });
  } finally {
   setIsSending(false);
  }
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[400px] bg-[#12161f]/95 backdrop-blur-3xl border border-white/5 p-0 rounded-t-[40px] sm:rounded-[40px] overflow-hidden text-white shadow-2xl">
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
       <button onClick={selectAll} className={cn("h-9 px-4 rounded-full text-[10px] font-bold border", selectedUids.length === seatedParticipants.length ? "bg-white text-black" : "bg-white/5")}>ALL</button>
       {seatedParticipants.map(p => (
        <button key={p.uid} onClick={() => toggleRecipient(p.uid)} className="relative">
          <Avatar className={cn("h-10 w-10 border-2", selectedUids.includes(p.uid) ? "border-[#00E676] scale-110" : "border-transparent")}>
           <AvatarImage src={p.avatarUrl} />
          </Avatar>
          {selectedUids.includes(p.uid) && <Check className="absolute -top-1 -right-1 h-3 w-3 bg-[#00E676] text-black rounded-full p-0.5" />}
        </button>
       ))}
      </div>
      <Tabs defaultValue="Hot">
         <TabsList className="bg-transparent gap-4 mb-4">
          {['Hot', 'Lucky', 'Luxury', 'Flag', 'Events'].map(t => <TabsTrigger key={t} value={t} className="text-xs data-[state=active]:text-[#00E676]">{t}</TabsTrigger>)}
         </TabsList>
         <div className="h-[280px] overflow-y-auto no-scrollbar">
          {Object.entries(GIFTS).map(([cat, items]) => (
           <TabsContent key={cat} value={cat} className="grid grid-cols-4 gap-3">
              {items.map(gift => (
               <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center p-2 rounded-xl border transition-all", selectedGift?.id === gift.id ? "bg-white/10 border-[#00E676]" : "border-transparent")}>
                <div className="text-3xl mb-1">{gift.icon}</div>
                <span className="text-[9px] truncate w-full text-center">{gift.name}</span>
                <span className="text-[10px] text-yellow-400 font-bold">{gift.price}</span>
               </button>
              ))}
           </TabsContent>
          ))}
         </div>
      </Tabs>
    </div>
    <div className="p-4 bg-black/40 flex items-center justify-between">
      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><GoldCoinIcon className="h-4 w-4" /><span className="text-xs font-bold">{userProfile?.wallet?.coins || 0}</span></div>
      <div className="flex gap-2">
       <Select value={quantity} onValueChange={setQuantity}><SelectTrigger className="w-16 h-9 bg-white/5 border-none"><SelectValue /></SelectTrigger>
         <SelectContent>{['1', '9', '99', '499'].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
       </Select>
       <button onClick={handleSend} disabled={!selectedGift || isSending || selectedUids.length === 0} className={cn("h-9 px-6 rounded-full font-bold text-xs", !selectedGift ? "bg-white/10" : "bg-[#00E676] text-black")}>SEND</button>
      </div>
    </div>
   </DialogContent>
  </Dialog>
 );
}
