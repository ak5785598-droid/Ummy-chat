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
import { motion, AnimatePresence } from 'framer-motion';
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
   <DialogContent className="sm:max-w-[420px] bg-[#1a1a1a] backdrop-blur-3xl border-none p-0 rounded-t-[3.5rem] sm:rounded-[3rem] overflow-hidden text-white font-sans shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-full duration-700">
    <DialogHeader className="sr-only">
     <DialogTitle>Gift Vault</DialogTitle>
     <DialogDescription>Dispatch tribal assets to seated members.</DialogDescription>
    </DialogHeader>

    <div className="p-6 pb-4 space-y-6">
      {/* Recipient Selection Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Select Recipients</span>
          <button 
            onClick={selectAll}
            className={cn(
              "text-[9px] font-black uppercase tracking-tighter px-3 py-1 rounded-full transition-all border",
              selectedUids.length === seatedParticipants.length ? "bg-white text-black border-white" : "text-white/40 border-white/10 hover:border-white/30"
            )}
          >
            {selectedUids.length === seatedParticipants.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
         {seatedParticipants.map((p, idx) => (
          <button 
           key={p.uid || `participant-${idx}`}
           onClick={() => toggleRecipient(p.uid)}
           className="relative shrink-0 active:scale-90 transition-transform group"
          >
            <motion.div 
              animate={selectedUids.includes(p.uid) ? { scale: 1.1 } : { scale: 1 }}
              className="relative"
            >
              {selectedUids.includes(p.uid) && (
                <div className="absolute inset-[-4px] bg-[#00E676]/30 blur-md rounded-full animate-pulse" />
              )}
              <Avatar className={cn(
               "h-12 w-12 border-2 transition-all duration-300",
               selectedUids.includes(p.uid) ? "border-[#00E676] shadow-[0_0_20px_rgba(0,230,118,0.4)]" : "border-white/5 grayscale-[0.5] group-hover:grayscale-0"
              )}>
               <AvatarImage src={p.avatarUrl} />
               <AvatarFallback className="bg-[#2a2a2a] text-white/40 text-xs">{(p.name || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              {selectedUids.includes(p.uid) && (
               <div className="absolute -top-1 -right-1 bg-[#00E676] rounded-full p-0.5 border-2 border-[#1a1a1a] shadow-lg">
                <Check className="h-2 w-2 text-black" strokeWidth={4} />
               </div>
              )}
            </motion.div>
          </button>
         ))}
        </div>
      </div>

      <div className="flex flex-col">
       <Tabs defaultValue="Hot" className="w-full">
         <div className="relative px-1 mb-4">
           <TabsList className="bg-transparent p-0 gap-6 h-8 border-none justify-start overflow-x-auto no-scrollbar w-full">
            {['Hot', 'Lucky', 'Luxury', 'SVIP', 'Events'].map(tab => (
             <TabsTrigger 
              key={`tab-trigger-${tab}`} 
              value={tab} 
              className="p-0 text-[14px] font-black text-white/20 data-[state=active]:text-white data-[state=active]:bg-transparent relative group transition-all shrink-0 uppercase tracking-tighter"
             >
              {tab}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-data-[state=active]:opacity-100 transition-all shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
             </TabsTrigger>
            ))}
           </TabsList>
         </div>

         <div className="h-[300px] overflow-y-auto no-scrollbar pb-6 pt-1 px-1">
          {Object.entries(GIFTS).map(([category, items]) => {
            const categoryStyle = {
              'Hot': "group-hover:bg-orange-500/10 group-hover:border-orange-500/20",
              'Lucky': "group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20",
              'Luxury': "group-hover:bg-amber-500/10 group-hover:border-amber-500/20",
              'SVIP': "group-hover:bg-purple-500/10 group-hover:border-purple-500/20",
              'Events': "group-hover:bg-rose-500/10 group-hover:border-rose-500/20"
            }[category] || "group-hover:bg-white/5 transition-all";

            return (
              <TabsContent key={`tab-content-${category}`} value={category} className="mt-0 outline-none">
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="grid grid-cols-4 gap-y-5 gap-x-3"
               >
                 {items.map(gift => (
                  <button 
                   key={`gift-item-${gift.id}`} 
                   onClick={() => setSelectedGift(gift)}
                   className={cn(
                    "flex flex-col items-center gap-1.5 group relative py-4 rounded-3xl transition-all border border-transparent active:scale-[0.85] transform-gpu",
                    selectedGift?.id === gift.id ? "bg-white/5 border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.5)]" : "hover:bg-white/5",
                    gift.isPremium && "bg-gradient-to-b from-white/[0.03] to-transparent"
                   )}
                  >
                   {gift.isPremium && (
                    <div className="absolute top-2 right-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-0.5 shadow-lg z-10 scale-75">
                     <Sparkles className="h-3 w-3 text-white fill-white" />
                    </div>
                   )}
                   <motion.div 
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className="text-[42px] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] mb-1 transform-gpu"
                   >
                    {gift.icon}
                   </motion.div>
                   <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-black text-white/80 text-center leading-none truncate w-full px-2 uppercase tracking-tighter">{gift.name}</span>
                    <div className="flex items-center gap-1 mt-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                      <GoldCoinIcon className="h-2.5 w-2.5" />
                      <span className="text-[10px] font-black text-amber-400 italic">{(gift.price).toLocaleString()}</span>
                    </div>
                   </div>
                   
                   {selectedGift?.id === gift.id && (
                     <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-3xl animate-pulse" />
                   )}
                  </button>
                 ))}
               </motion.div>
              </TabsContent>
            );
          })}
         </div>
       </Tabs>
      </div>
    </div>

    <div className="p-6 bg-black/40 backdrop-blur-2xl border-t border-white/5 flex items-center justify-between gap-4 relative z-10">
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">My Balance</span>
        <div className="flex items-center gap-2 bg-white/[0.03] px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md active:scale-95 transition-transform cursor-pointer hover:bg-white/10">
         <GoldCoinIcon className="h-5 w-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
         <span className="text-sm font-black text-white italic tracking-tighter">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
         <ChevronRight className="h-3 w-3 text-white/20 ml-1" />
        </div>
      </div>

      <div className="flex items-center gap-3">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-20 h-10 rounded-2xl bg-white/[0.03] border-white/10 text-white font-black text-[12px] px-4 shadow-xl focus:ring-0">
          <SelectValue />
         </SelectTrigger>
         <SelectContent className="bg-[#1f2430] border-white/10 text-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          {['1', '9', '49', '99', '499'].map(q => (
           <SelectItem key={`qty-${q}`} value={q} className="font-black text-[12px] italic transition-colors hover:bg-white/10 focus:bg-white/10">{q}</SelectItem>
          ))}
         </SelectContent>
       </Select>

       <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSend}
        disabled={!selectedGift || isSending || selectedUids.length === 0}
        className={cn(
         "h-12 px-9 rounded-2xl font-black uppercase text-[14px] tracking-tighter transition-all flex items-center justify-center min-w-[120px] shadow-2xl",
         !selectedGift || selectedUids.length === 0 
          ? "bg-white/10 text-white/20 opacity-50 pointer-events-none" 
          : "bg-gradient-to-r from-emerald-400 to-green-600 text-[#1a1a1a] shadow-[0_8px_30px_rgba(16,185,129,0.4)]"
        )}
       >
         {isSending ? <Loader className="h-5 w-5 animate-spin" /> : 'Dispatch'}
       </motion.button>
      </div>
    </div>
   </DialogContent>
  </Dialog>
 );
}
