'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { GoldCoinIcon } from '@/components/icons';
import { Loader, Check, Zap } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

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
  { id: 'birthday_cake', name: 'Cake', price: 109000, icon: '🎂', animationId: 'birthday-cake' },
  { id: 'microphone', name: 'Mic', price: 100, icon: '🎤', animationId: 'microphone' },
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
  { id: 'helicopter', name: 'Heli', price: 220000, icon: '🚁', animationId: 'helicopter', isPremium: true },
 ],
 'Flag': [
  { id: 'flag_india', name: 'India', price: 50000, icon: '🇮🇳', animationId: 'flag-india' },
  { id: 'flag_pakistan', name: 'Pakistan', price: 50000, icon: '🇵🇰', animationId: 'flag-pakistan' },
  { id: 'flag_bangladesh', name: 'Bangladesh', price: 50000, icon: '🇧🇩', animationId: 'flag-bangladesh' },
  { id: 'flag_america', name: 'USA', price: 50000, icon: '🇺🇸', animationId: 'flag-america' },
  { id: 'flag_canada', name: 'Canada', price: 50000, icon: '🇨🇦', animationId: 'flag-canada' },
  { id: 'flag_china', name: 'China', price: 50000, icon: '🇨🇳', animationId: 'flag-china' },
  { id: 'flag_philippines', name: 'Philippines', price: 50000, icon: '🇵🇭', animationId: 'flag-philippines' },
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
 const [notifications, setNotifications] = useState<any[]>([]);

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
   
   // 🪙 SENDER: Deduct coins from both documents
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);
   
   batch.update(senderProfileRef, { 
     'wallet.coins': increment(-totalCost),
     'wallet.totalSpent': increment(totalCost),
     'wallet.dailySpent': increment(totalCost),
     updatedAt: serverTimestamp() 
   });
   
   batch.update(senderUserRef, { 
     'wallet.coins': increment(-totalCost),
     updatedAt: serverTimestamp() 
   });

   // 💎 RECIPIENTS: Add 40% diamonds to both documents
   const costPerRecipient = selectedGift.price * qty;
   const diamondPerRecipient = Math.floor(costPerRecipient * 0.4);
   
   selectedUids.forEach(uid => {
     const recProfileRef = doc(firestore, 'users', uid, 'profile', uid);
     const recUserRef = doc(firestore, 'users', uid);
     
     batch.update(recProfileRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       updatedAt: serverTimestamp() 
     });
     
     batch.update(recUserRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       updatedAt: serverTimestamp() 
     });
   });

   // 🚀 ROOM: Update Rocket Progress
   const roomRef = doc(firestore, 'chatRooms', roomId);
   batch.update(roomRef, {
     'rocket.progress': increment(totalCost),
     updatedAt: serverTimestamp()
   });

   const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
   batch.set(msgRef, {
    type: 'gift',
    senderId: user.uid,
    senderName: userProfile.username,
    giftId: selectedGift.animationId,
    text: `sent ${selectedGift.name} x${isComboTrigger ? 1 : qty}`,
    timestamp: serverTimestamp()
   });

   await batch.commit();

   // ⚡ QUEST TRACKING: Gift Master
   try {
     const questRef = doc(firestore, 'users', user.uid, 'quests', 'send_gift');
     updateDocumentNonBlocking(questRef, { current: increment(qty) });
   } catch (e) {
     console.warn('[Missions] Failed to update gift quest:', e);
   }

   const newId = Date.now();
   const newNotif = {
     id: newId,
     name: userProfile.username,
     avatar: userProfile.avatarUrl,
     icon: selectedGift.icon,
     qty: isComboTrigger ? (comboCount + 1) : qty
   };
   setNotifications(prev => [newNotif, ...prev].slice(0, 4));
   setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newId)), 3000);

   setComboCount(prev => prev + 1);
   setShowCombo(true);
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => { setShowCombo(false); setComboCount(0); }, 3000);

   if (!isComboTrigger) onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   {/* Side Notification Stack */}
   <div className="fixed left-4 top-1/4 z-[500] flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
     {notifications.map((notif) => (
      <motion.div key={notif.id} initial={{ x: -200, opacity: 0 }} animate={{ x: 20, opacity: 1 }} exit={{ x: -200, opacity: 0 }}
       className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-500 p-2 pr-8 rounded-full border border-white/20 shadow-xl">
       <Avatar className="h-10 w-10 border-2 border-white"><AvatarImage src={notif.avatar} /></Avatar>
       <div className="flex flex-col text-white">
        <span className="text-[10px] font-bold opacity-70 uppercase">Gift Sent</span>
        <span className="text-sm font-black truncate max-w-[90px]">{notif.name}</span>
       </div>
       <div className="ml-2 text-2xl font-black italic text-yellow-400">x{notif.qty}</div>
      </motion.div>
     ))}
    </AnimatePresence>
   </div>

   {/* Combo Button */}
   <AnimatePresence>
    {showCombo && (
     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-40 right-6 z-[500]">
      <button onClick={() => handleSend(true)} className="h-20 w-20 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full border-4 border-white shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all">
       <Zap className="h-6 w-6 text-white fill-white animate-bounce" />
       <span className="text-xl font-black text-white italic">{comboCount}x</span>
       <span className="text-[8px] font-black text-white/80 uppercase">Combo</span>
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md w-[95%] bg-[#12161f] border border-white/10 p-0 rounded-[28px] overflow-hidden text-white shadow-2xl">
     
     {/* Recipient Selection */}
     <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-black/20">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-12 w-12 rounded-full border-2 text-[10px] font-bold shrink-0", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20" : "border-white/10 bg-white/5")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-12 w-12 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400 scale-105 shadow-md shadow-cyan-500/30" : "border-transparent opacity-60")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <Check className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 text-black rounded-full p-0.5" />}
       </button>
      ))}
     </div>

     {/* Tabs & Grid */}
     <Tabs defaultValue="Hot" className="w-full mt-2">
      <TabsList className="mx-4 bg-white/5 p-1 rounded-full flex justify-between border border-white/5">
       {['Hot', 'Lucky', 'Luxury', 'Flag', 'Events'].map(id => (
        <TabsTrigger key={id} value={id} className="text-[10px] font-black px-4 py-1.5 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 transition-all">{id}</TabsTrigger>
       ))}
      </TabsList>
      
      <div className="h-[320px] overflow-y-auto no-scrollbar p-4">
       {Object.entries(GIFTS).map(([cat, items]) => (
        <TabsContent key={cat} value={cat} className="grid grid-cols-4 gap-4 m-0 focus-visible:outline-none">
         {items.map(gift => (
          <button 
           key={gift.id} 
           onClick={() => setSelectedGift(gift)} 
           // --- COLOR FIX: Yahan solid background add kiya hai ---
           className={cn(
            "flex flex-col items-center p-2 rounded-2xl border transition-all duration-200", 
            selectedGift?.id === gift.id 
             ? "bg-[#1e2533] border-cyan-400/80 shadow-lg scale-105 ring-1 ring-cyan-400/20" 
             : "bg-[#181d29] border-white/5 hover:bg-[#1e2533]"
           )}
          >
           <div className="text-4xl mb-1 filter drop-shadow-md">{gift.icon}</div>
           <span className="text-[9px] font-bold text-white/90 truncate w-full text-center">{gift.name}</span>
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

     {/* Footer */}
     <div className="p-4 bg-black/40 flex items-center justify-between border-t border-white/5 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
       <GoldCoinIcon className="h-4 w-4" /><span className="text-sm font-black text-yellow-400">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-16 h-10 bg-white/10 border-white/10 rounded-xl text-cyan-400 font-bold focus:ring-0"><SelectValue /></SelectTrigger>
         <SelectContent className="bg-[#151921] border-white/10 text-white font-bold">{['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
       </Select>
       <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending || selectedUids.length === 0} 
         className="h-10 px-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 font-black text-xs shadow-lg active:scale-95 disabled:opacity-30 disabled:grayscale transition-all uppercase tracking-wider border-b-2 border-black/20">
         {isSending ? <Loader className="h-4 w-4 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </>
 );
}
