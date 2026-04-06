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

// --- PNG BASED 3D GIFTS CONFIG ---
// Note: Make sure these images exist in your public folder or replace with your URLs
const GIFTS: Record<string, any[]> = {
 'Hot': [
  { id: 'bouquet', name: 'Bouquet', price: 15000, image: '/assets/gifts/bouquet.png', animationId: 'bouquet' },
  { id: 'love_text', name: 'Love', price: 25000, image: '/assets/gifts/love.png', animationId: 'love-text' }, 
  { id: 'love_balloon', name: 'Love Balloon', price: 40000, image: '/assets/gifts/balloon.png', animationId: 'love-balloon' }, 
  { id: 'chocolate', name: 'Chocolate', price: 250000, image: '/assets/gifts/chocolate.png', animationId: 'chocolate' },
  { id: 'ring', name: 'Ring', price: 400000, image: '/assets/gifts/ring.png', animationId: 'ring' },
  { id: 'coke_cheers', name: 'Coke Cheers', price: 20000, image: '/assets/gifts/coke.png', animationId: 'coke-cheers' },
  { id: 'love_fireworks', name: 'Love Fireworks', price: 500000, image: '/assets/gifts/fireworks.png', animationId: 'love-fireworks' },
  { id: 'forever_friends', name: 'Forever Friends', price: 100000, image: '/assets/gifts/friends.png', animationId: 'forever-friends' },
 ],
 'Lucky': [
  { id: 'lucky_clover', name: 'Clover', price: 100, image: '/assets/gifts/clover.png', animationId: 'lucky-clover' },
  { id: 'treasure', name: 'Treasure', price: 10000, image: '/assets/gifts/treasure.png', animationId: 'treasure' },
 ],
 'Luxury': [
  { id: 'yacht', name: 'Yacht', price: 250000, image: '/assets/gifts/yacht.png', animationId: 'yacht', isPremium: true },
  { id: 'mansion', name: 'Mansion', price: 350000, image: '/assets/gifts/mansion.png', animationId: 'mansion', isPremium: true },
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
   
   // LOGIC: Coins deduct and Diamonds add (40%)
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);
   
   batch.update(senderProfileRef, { 
     'wallet.coins': increment(-totalCost),
     'wallet.totalSpent': increment(totalCost),
     updatedAt: serverTimestamp() 
   });
   batch.update(senderUserRef, { 'wallet.coins': increment(-totalCost) });

   const diamondPerRecipient = Math.floor((selectedGift.price * qty) * 0.4);
   
   selectedUids.forEach(uid => {
     const recProfileRef = doc(firestore, 'users', uid, 'profile', uid);
     const recUserRef = doc(firestore, 'users', uid);
     batch.update(recProfileRef, { 'wallet.diamonds': increment(diamondPerRecipient) });
     batch.update(recUserRef, { 'wallet.diamonds': increment(diamondPerRecipient) });
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

   const newId = Date.now();
   setNotifications(prev => [{ id: newId, name: userProfile.username, avatar: userProfile.avatarUrl, image: selectedGift.image, qty: isComboTrigger ? (comboCount + 1) : qty }, ...prev].slice(0, 3));
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
   {/* Side Notifications */}
   <div className="fixed left-4 top-1/3 z-[600] flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
     {notifications.map((notif) => (
      <motion.div key={notif.id} initial={{ x: -150, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -150, opacity: 0 }}
       className="flex items-center gap-3 bg-gradient-to-r from-indigo-900/90 to-blue-800/90 backdrop-blur-md p-1 pr-6 rounded-full border border-white/20 shadow-2xl">
       <Avatar className="h-9 w-9 border-2 border-yellow-400 shadow-lg"><AvatarImage src={notif.avatar} /></Avatar>
       <div className="flex flex-col">
        <span className="text-[10px] font-black text-white truncate max-w-[80px] uppercase">{notif.name}</span>
        <img src={notif.image} className="h-5 w-5 object-contain" alt="gift" />
       </div>
       <span className="ml-auto text-xl font-black italic text-yellow-400 drop-shadow-md">x{notif.qty}</span>
      </motion.div>
     ))}
    </AnimatePresence>
   </div>

   {/* 3D Combo Button */}
   <AnimatePresence>
    {showCombo && (
     <motion.div initial={{ scale: 0 }} animate={{ scale: 1.1 }} exit={{ scale: 0 }} className="fixed bottom-36 right-8 z-[600]">
      <button onClick={() => handleSend(true)} className="h-24 w-24 bg-gradient-to-tr from-orange-600 via-pink-600 to-yellow-500 rounded-full border-4 border-white shadow-[0_10px_40px_rgba(234,179,8,0.6)] flex flex-col items-center justify-center active:scale-90 transition-all group overflow-hidden">
       <Zap className="h-8 w-8 text-white fill-white animate-bounce drop-shadow-lg" />
       <span className="text-2xl font-black text-white italic drop-shadow-md">{comboCount}</span>
       <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md w-[95%] bg-[#0d1117] border border-white/10 p-0 rounded-[40px] overflow-hidden text-white shadow-2xl ring-1 ring-white/5">
     
     {/* Recipient Selector */}
     <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar bg-black/40 border-b border-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-14 w-14 rounded-full border-2 text-[10px] font-black shrink-0 transition-all flex items-center justify-center shadow-lg", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-14 w-14 border-2 transition-all duration-300", selectedUids.includes(p.uid) ? "border-cyan-400 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.5)] ring-2 ring-cyan-400/20" : "border-transparent opacity-40 grayscale")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 bg-cyan-400 rounded-full p-1 shadow-md"><Check className="h-3 w-3 text-black stroke-[4px]" /></div>}
       </button>
      ))}
     </div>

     {/* Tabs */}
     <Tabs defaultValue="Hot" className="w-full pt-4">
      <TabsList className="mx-6 bg-white/5 p-1 rounded-2xl flex justify-between border border-white/10">
       {['Hot', 'Lucky', 'Luxury'].map(id => (
        <TabsTrigger key={id} value={id} className="flex-1 text-[11px] font-black py-2.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-500 data-[state=active]:shadow-xl transition-all uppercase tracking-widest">{id}</TabsTrigger>
       ))}
      </TabsList>
      
      <div className="h-[360px] overflow-y-auto no-scrollbar p-6">
       {Object.entries(GIFTS).map(([cat, items]) => (
        <TabsContent key={cat} value={cat} className="grid grid-cols-4 gap-4 m-0 outline-none">
         {items.map(gift => (
          <motion.button 
           whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}
           key={gift.id} 
           onClick={() => setSelectedGift(gift)} 
           className={cn(
            "relative flex flex-col items-center p-2 rounded-[24px] border transition-all duration-500 group", 
            selectedGift?.id === gift.id 
             ? "bg-[#1c2331] border-cyan-400/60 shadow-[0_15px_30px_rgba(0,0,0,0.6)]" 
             : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08]"
           )}
          >
           {/* Gift PNG Image */}
           <div className="h-16 w-16 flex items-center justify-center mb-1 relative">
            <img src={gift.image} alt={gift.name} className={cn("h-full w-full object-contain transition-transform duration-300 drop-shadow-2xl", selectedGift?.id === gift.id ? "scale-110 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "group-hover:scale-105")} />
           </div>
           
           <span className="text-[9px] font-black text-white/90 truncate w-full text-center tracking-tight mb-1">{gift.name}</span>
           
           <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full border border-white/5 shadow-inner">
            <GoldCoinIcon className="h-2.5 w-2.5" />
            <span className="text-[10px] text-yellow-400 font-black">{gift.price >= 1000 ? (gift.price/1000)+'k' : gift.price}</span>
           </div>
          </motion.button>
         ))}
        </TabsContent>
       ))}
      </div>
     </Tabs>

     {/* 3D Footer */}
     <div className="p-6 bg-gradient-to-t from-black to-[#0d1117] flex items-center justify-between border-t border-white/10">
      <div className="flex items-center gap-3 bg-[#1e2533] border border-white/10 px-4 py-2 rounded-2xl shadow-inner">
       <GoldCoinIcon className="h-5 w-5" />
       <div className="flex flex-col">
        <span className="text-[8px] font-bold text-white/50 uppercase">Balance</span>
        <span className="text-sm font-black text-yellow-400">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
       </div>
      </div>

      <div className="flex items-center gap-3">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-20 h-11 bg-white/5 border-white/10 rounded-2xl text-cyan-400 font-black focus:ring-1 ring-cyan-400/50">
          <SelectValue />
         </SelectTrigger>
         <SelectContent className="bg-[#0d1117] border-white/10 text-white font-bold rounded-2xl">
          {['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q} className="focus:bg-cyan-600 transition-colors">{q}</SelectItem>)}
         </SelectContent>
       </Select>

       <button 
         onClick={() => handleSend(false)} 
         disabled={!selectedGift || isSending || selectedUids.length === 0} 
         className="h-11 px-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black text-[13px] shadow-[0_8px_20px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all uppercase tracking-widest border-t border-white/20"
       >
         {isSending ? <Loader className="h-5 w-5 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </>
 );
                                     }
        
