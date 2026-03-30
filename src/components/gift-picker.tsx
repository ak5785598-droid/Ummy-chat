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
  { id: 'choco_pops', name: 'Choco Pops', price: 200, icon: '🍭', animationId: 'choco-pops' },
  { id: 'pizza', name: 'pizza', price: 499, icon: '🍕', animationId: 'pizza' }, 
  { id: 'doughnut', name: 'doughnut', price: 999, icon: '🍩', animationId: 'doughnut' }, 
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
  { id: 'doughnut', name: 'Doughnut', price: 500, icon: '🍩', animationId: 'doughnut' },
  { id: 'candy', name: 'Candy', price: 300, icon: '🍬', animationId: 'candy' },
  { id: 'ice_cream', name: 'Ice Cream', price: 150, icon: '🍦', animationId: 'ice-cream' },
  { id: 'pizza', name: 'Pizza', price: 400, icon: '🍕', animationId: 'pizza' },
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
  { id: 'leprechaun_hat', name: 'Leprechaun Hat', price: 6000, icon: '🎩', animationId: 'leprechaun-hat', type: 'lucky' },
  { id: 'magic_potion', name: 'Magic Potion', price: 4500, icon: '🧪', animationId: 'magic-potion', type: 'lucky' },
  { id: 'dreamcatcher', name: 'Dreamcatcher', price: 3200, icon: '🕸️', animationId: 'dreamcatcher', type: 'lucky' },
  { id: 'wishing_well', name: 'Wishing Well', price: 18000, icon: '⛲', animationId: 'wishing-well', type: 'lucky' },
  { id: 'gold_ingot', name: 'Gold Ingot', price: 25000, icon: '🧈', animationId: 'gold-ingot', type: 'lucky' },
 ],
 'Luxury': [
  { id: 'chupa_chups', name: 'Chupa Chups', price: 14999, icon: '🍬', animationId: 'chupa-chups' },
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
 'SVIP': [
  { id: 'star_rain', name: 'Star Rain', price: 300000, icon: '🌠', animationId: 'star-rain', isPremium: true },
  { id: 'coronation', name: 'Coronation', price: 400000, icon: '👑', animationId: 'coronation', isPremium: true },
  { id: 'rose_vow', name: 'Rose Vow', price: 500000, icon: '💑', animationId: 'rose-vow', isPremium: true },
  { id: 'glory', name: 'Glory Wings', price: 1000000, icon: '🕊️', animationId: 'glory', isPremium: true },
  { id: 'neon_car', name: 'Neon Car', price: 1200000, icon: '🚘', animationId: 'neon-car', isPremium: true },
  { id: 'ferrari', name: 'Ferrari', price: 1500000, icon: '🏎️', animationId: 'ferrari', isPremium: true },
  { id: 'sword_of_ocean', name: 'Ocean Sword', price: 1500000, icon: '⚔️', animationId: 'sword-of-ocean', isPremium: true },
  { id: 'new_year', name: 'New Year', price: 5000000, icon: '🎊', animationId: 'new-year', isPremium: true },
  { id: 'space_station', name: 'Space Station', price: 2000000, icon: '🛰️', animationId: 'space-station', isPremium: true },
  { id: 'moon_base', name: 'Moon Base', price: 2500000, icon: '🌖', animationId: 'moon-base', isPremium: true },
  { id: 'mars_rover', name: 'Mars Rover', price: 3000000, icon: '🛸', animationId: 'mars-rover', isPremium: true },
  { id: 'cyber_city', name: 'Cyber City', price: 3500000, icon: '🏙️', animationId: 'cyber-city', isPremium: true },
  { id: 'floating_island', name: 'Floating Island', price: 4000000, icon: '☁️', animationId: 'floating-island', isPremium: true },
  { id: 'dragon', name: 'Dragon', price: 4500000, icon: '🐉', animationId: 'dragon', isPremium: true },
  { id: 'phoenix', name: 'Phoenix', price: 5000000, icon: '🐦', animationId: 'phoenix', isPremium: true },
  { id: 'unicorn', name: 'Unicorn', price: 5500000, icon: '🦄', animationId: 'unicorn', isPremium: true },
  { id: 'pegasus', name: 'Pegasus', price: 6000000, icon: '🐎', animationId: 'pegasus', isPremium: true },
  { id: 'kraken', name: 'Kraken', price: 6500000, icon: '🐙', animationId: 'kraken', isPremium: true },
  { id: 'leviathan', name: 'Leviathan', price: 7000000, icon: '🐳', animationId: 'leviathan', isPremium: true },
  { id: 'world_tree', name: 'World Tree', price: 8000000, icon: '🌳', animationId: 'world-tree', isPremium: true },
  { id: 'excalibur', name: 'Excalibur', price: 9000000, icon: '🗡️', animationId: 'excalibur', isPremium: true },
  { id: 'holy_grail', name: 'Holy Grail', price: 10000000, icon: '🏆', animationId: 'holy-grail', isPremium: true },
 ],
 'Events': [
  { id: 'eid_lantern', name: 'Eid Lantern', price: 5000, icon: '🏮', animationId: 'eid-lantern' },
  { id: 'eid_cannon', name: 'Eid Cannon', price: 15000, icon: '💣', animationId: 'eid-cannon' },
  { id: 'eid_feast', name: 'Eid Feast', price: 50000, icon: '🥘', animationId: 'eid-feast' },
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

   let luckyWin = null;
   let winAmount = 0;

   if (selectedGift.type === 'lucky') {
     const rand = Math.random();
     if (rand < 0.001) { // 0.1% for 100x
       luckyWin = { multiplier: 100, winAmount: selectedGift.price * 100 };
       winAmount = luckyWin.winAmount;
     } else if (rand < 0.01) { // 1% for 10x
       luckyWin = { multiplier: 10, winAmount: selectedGift.price * 10 };
       winAmount = luckyWin.winAmount;
     } else if (rand < 0.05) { // 5% for 3x
       luckyWin = { multiplier: 3, winAmount: selectedGift.price * 3 };
       winAmount = luckyWin.winAmount;
     }
   }

   if (winAmount > 0) {
     batch.update(senderRef, { 'wallet.coins': increment(winAmount) });
     batch.update(senderProfileRef, { 'wallet.coins': increment(winAmount) });
   }

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
    text: `sent ${selectedGift.name} x${quantity}${luckyWin ? ` (WON ${luckyWin.multiplier}x JACKPOT! 🎰)` : ''}`,
    luckyWin,
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
          {['Hot', 'Lucky', 'Luxury', 'SVIP', 'Events'].map(tab => (
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
