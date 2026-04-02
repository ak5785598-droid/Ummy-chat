'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { GoldCoinIcon } from '@/components/icons';
import { Loader, Check, Zap } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- FULL GIFTS DATA ---
const GIFTS: Record<string, any[]> = {
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
  { id: 'popcorn', name: 'Popcorn', price: 120, icon: '🍿', animationId: 'popcorn' },
 ],
 'Lucky': [
  { id: 'lucky_clover', name: 'Clover', price: 100, icon: '🍀', animationId: 'lucky-clover' },
  { id: 'magic_wand', name: 'Magic Wand', price: 500, icon: '🪄', animationId: 'magic-wand' },
  { id: 'jackpot', name: 'Jackpot', price: 2000, icon: '🎰', animationId: 'jackpot' },
  { id: 'treasure', name: 'Treasure', price: 10000, icon: '🪙', animationId: 'treasure' },
  { id: 'soaring', name: 'Soaring', price: 20000, icon: '🎆', animationId: 'soaring' },
  { id: 'red_envelope', name: 'Red Envelope', price: 888, icon: '🧧', animationId: 'red-envelope' },
 ],
 'Luxury': [
  { id: 'library', name: 'Library', price: 50000, icon: '📚', animationId: 'library', isPremium: true },
  { id: 'diamond', name: 'Diamond', price: 70000, icon: '💎', animationId: 'diamond', isPremium: true },
  { id: 'trophy', name: 'Trophy', price: 90000, icon: '🏆', animationId: 'trophy', isPremium: true },
  { id: 'yacht', name: 'Yacht', price: 250000, icon: '🛥️', animationId: 'yacht', isPremium: true },
  { id: 'mansion', name: 'Mansion', price: 350000, icon: '🏡', animationId: 'mansion', isPremium: true },
  { id: 'helicopter', name: 'Helicopter', price: 220000, icon: '🚁', animationId: 'helicopter', isPremium: true },
 ],
 'Flag': [
  { id: 'flag_india', name: 'India', price: 50000, icon: '🇮🇳', animationId: 'flag-india' },
  { id: 'flag_pakistan', name: 'Pakistan', price: 50000, icon: '🇵🇰', animationId: 'flag-pakistan' },
  { id: 'dragon', name: 'Dragon', price: 4500000, icon: '🐉', animationId: 'dragon' },
  { id: 'unicorn', name: 'Unicorn', price: 5500000, icon: '🦄', animationId: 'unicorn' },
 ],
 'Events': [
  { id: 'eid_mubarak', name: 'Eid Mubarak', price: 150000, icon: '🕌', animationId: 'eid-mubarak' },
  { id: 'fireworks', name: 'Fireworks', price: 10000, icon: '🎆', animationId: 'fireworks' },
  { id: 'valentine_heart', name: 'Heart', price: 20000, icon: '💖', animationId: 'valentine-heart' },
 ]
};

export function GiftPicker({ open, onOpenChange, roomId, recipient: initialRecipient, participants = [] }: any) {
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();

 const [selectedGift, setSelectedGift] = useState<any>(null);
 const [quantity, setQuantity] = useState('1');
 const [isSending, setIsSending] = useState(false);
 const [selectedUids, setSelectedUids] = useState<string[]>([]);
 const [showGiftCard, setShowGiftCard] = useState(false);
 const [lastSentData, setLastSentData] = useState<any>(null);

 // --- COMBO STATES ---
 const [showCombo, setShowCombo] = useState(false);
 const [comboCount, setComboCount] = useState(0);
 const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

 const seatedParticipants = useMemo(() => {
  return participants.filter((p: any) => p.seatIndex > 0).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
 }, [participants]);

 useEffect(() => {
  if (open) {
   if (initialRecipient) setSelectedUids([initialRecipient.uid]);
   else if (seatedParticipants.length > 0) setSelectedUids([seatedParticipants[0].uid]);
  }
 }, [open, initialRecipient, seatedParticipants]);

 const handleSend = async (isComboTrigger = false) => {
  if (!user || !firestore || !selectedGift || !userProfile || selectedUids.length === 0) return;

  const qty = isComboTrigger ? 1 : parseInt(quantity);
  const totalCost = selectedGift.price * qty * selectedUids.length;
  
  if ((userProfile.wallet?.coins || 0) < totalCost) return;

  if (!isComboTrigger) setIsSending(true);

  try {
   const batch = writeBatch(firestore);
   const senderRef = doc(firestore, 'users', user.uid);
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

   batch.update(senderRef, { 'wallet.coins': increment(-totalCost), 'wallet.totalSpent': increment(totalCost), updatedAt: serverTimestamp() });
   batch.update(senderProfileRef, { 'wallet.coins': increment(-totalCost), 'wallet.totalSpent': increment(totalCost), updatedAt: serverTimestamp() });

   selectedUids.forEach(uid => {
     const diamondYield = Math.floor(selectedGift.price * qty * 0.4);
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
    text: `sent ${selectedGift.name} x${qty}`,
    timestamp: serverTimestamp()
   });

   await batch.commit();

   // --- SHOW NOTIFICATION CARD ---
   setLastSentData({ name: userProfile.username, avatar: userProfile.avatarUrl, icon: selectedGift.icon, qty: isComboTrigger ? (comboCount + 1) : qty });
   setShowGiftCard(true);
   setTimeout(() => setShowGiftCard(false), 3000);

   // --- HANDLE COMBO LOGIC ---
   setComboCount(prev => prev + 1);
   setShowCombo(true);
   
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => {
     setShowCombo(false);
     setComboCount(0);
   }, 3000); // Combo expires in 3s

   if (!isComboTrigger) onOpenChange(false);
  } catch (e) {
   console.error(e);
  } finally {
   setIsSending(false);
  }
 };

 return (
  <>
   {/* --- SIDE GIFT SHINING CARD --- */}
   <AnimatePresence>
    {showGiftCard && lastSentData && (
     <motion.div initial={{ x: -200, opacity: 0 }} animate={{ x: 20, opacity: 1 }} exit={{ x: -200, opacity: 0 }}
      className="fixed left-4 top-1/4 z-[100] flex items-center gap-3 bg-gradient-to-r from-blue-600/90 to-cyan-400/80 backdrop-blur-xl p-2 pr-8 rounded-full border border-blue-300/40 shadow-[0_0_30px_rgba(59,130,246,0.6)]">
      <Avatar className="h-11 w-11 border-2 border-white/80 shadow-md"><AvatarImage src={lastSentData.avatar} /></Avatar>
      <div className="flex flex-col">
       <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Gift Sent</span>
       <span className="text-sm font-black text-white truncate max-w-[90px] drop-shadow-sm">{lastSentData.name}</span>
      </div>
      <div className="ml-2 text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
       x{lastSentData.qty}
      </div>
     </motion.div>
    )}
   </AnimatePresence>

   {/* --- COMBO BUTTON (Right Side Bottom) --- */}
   <AnimatePresence>
    {showCombo && selectedGift && (
     <motion.div 
      initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
      className="fixed bottom-[120px] right-6 z-[500]"
     >
      <button 
       onClick={() => handleSend(true)}
       className="relative group flex items-center justify-center h-20 w-20 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full border-4 border-white/30 shadow-[0_0_40px_rgba(34,211,238,0.6)] active:scale-90 transition-all"
      >
       <div className="absolute -inset-2 bg-cyan-400/20 rounded-full animate-ping" />
       <div className="flex flex-col items-center">
        <Zap className="h-6 w-6 text-white fill-white animate-bounce" />
        <span className="text-xl font-black text-white italic drop-shadow-md">{comboCount}x</span>
       </div>
       <span className="absolute -bottom-6 text-[10px] font-black text-cyan-400 tracking-widest uppercase">Combo</span>
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[420px] bg-[#0b0e14]/98 backdrop-blur-3xl border-t border-white/10 p-0 rounded-t-[40px] overflow-hidden text-white shadow-2xl">
     
     <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar pt-6">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any) => p.uid))} className={cn("h-12 w-12 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20" : "border-white/10")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-12 w-12 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400 scale-110 shadow-lg shadow-cyan-500/30" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <Check className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 text-black rounded-full p-0.5" />}
       </button>
      ))}
     </div>

     <Tabs defaultValue="Hot" className="w-full">
      <TabsList className="mx-4 bg-white/5 p-1 rounded-full border border-white/5 flex justify-between">
       {['Hot', 'Lucky', 'Luxury', 'Flag', 'Events'].map(id => (
        <TabsTrigger key={id} value={id} className="text-[10px] font-black px-4 py-1.5 rounded-full text-white/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white transition-all">{id}</TabsTrigger>
       ))}
      </TabsList>

      <div className="h-[320px] overflow-y-auto no-scrollbar p-4 mt-2">
       {Object.entries(GIFTS).map(([cat, items]) => (
        <TabsContent key={cat} value={cat} className="grid grid-cols-4 gap-4 m-0">
         {items.map(gift => (
          <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center p-2 rounded-2xl border transition-all", selectedGift?.id === gift.id ? "bg-white/10 border-cyan-400/50 shadow-inner" : "border-transparent")}>
           <div className="text-4xl mb-1 drop-shadow-md">{gift.icon}</div>
           <span className="text-[9px] font-bold text-white/80 truncate w-full text-center">{gift.name}</span>
           <div className="flex items-center gap-1 mt-1">
            <GoldCoinIcon className="h-2.5 w-2.5 text-yellow-400" />
            <span className="text-[10px] text-yellow-400 font-black">{gift.price.toLocaleString()}</span>
           </div>
          </button>
         ))}
        </TabsContent>
       ))}
      </div>
     </Tabs>

     <div className="p-4 bg-black/40 flex items-center justify-between border-t border-white/5">
      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
       <GoldCoinIcon className="h-4 w-4" /><span className="text-sm font-black text-yellow-400">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
        <SelectTrigger className="w-16 h-10 bg-white/5 border-none rounded-xl font-bold text-cyan-400"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#151921] border-white/10 text-white font-bold">{['1', '10', '99', '520', '1314'].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
       </Select>
       <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending || selectedUids.length === 0} 
        className={cn("h-10 px-8 rounded-full font-black text-xs transition-all uppercase tracking-tighter", !selectedGift ? "bg-white/5 text-white/20" : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/30 active:scale-95")}>
        {isSending ? <Loader className="h-5 w-5 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </>
 );
}
   }
