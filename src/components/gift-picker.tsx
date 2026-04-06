'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { GoldCoinIcon } from '@/components/icons';
import { Loader, Check, Zap, Sparkles } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- GIFTS CONFIG: Hum real 3D assets use kar rahe hain ---
const GIFTS: Record<string, any[]> = {
 'Hot': [
  { id: 'bouquet', name: 'Bouquet', price: 15000, image: 'https://i.ibb.co/L6wV4C6/realistic-bouquet.png', animationId: 'bouquet', color: 'pink' },
  { id: 'love_text', name: 'Love', price: 25000, image: 'https://i.ibb.co/QvjXhP2/realistic-love.png', animationId: 'love-text', color: 'red' }, 
  { id: 'balloon', name: 'Love Balloon', price: 40000, image: 'https://i.ibb.co/3W64gXz/realistic-balloon.png', animationId: 'balloon', color: 'pink' }, 
  { id: 'chocolate', name: 'Chocolate', price: 250000, image: 'https://i.ibb.co/pLgV8P5/realistic-chocolate.png', animationId: 'chocolate', color: 'amber' },
  { id: 'ring', name: 'Ring', price: 400000, image: 'https://i.ibb.co/9rQ1gV8/realistic-ring.png', animationId: 'ring', color: 'cyan' },
  { id: 'coke_cheers', name: 'Coke Cheers', price: 20000, image: 'https://i.ibb.co/7C96T5L/realistic-coke.png', animationId: 'coke-cheers', color: 'orange' },
  { id: 'fireworks', name: 'Love Fireworks', price: 500000, image: 'https://i.ibb.co/Vd961qM/realistic-fireworks.png', animationId: 'fireworks', color: 'purple' },
  { id: 'forever_friends', name: 'Forever Friends', price: 100000, image: 'https://i.ibb.co/8b72T5M/realistic-friends.png', animationId: 'friends', color: 'blue' },
 ],
 'Lucky': [
  { id: 'treasure', name: 'Treasure', price: 10000, image: 'https://i.ibb.co/L7wV4C6/realistic-treasure.png', animationId: 'treasure', color: 'yellow' },
  { id: 'magic_wand', name: 'Magic Wand', price: 500, image: 'https://i.ibb.co/9rQ1gV8/realistic-wand.png', animationId: 'magic-wand', color: 'purple' },
 ],
 'Luxury': [
  { id: 'yacht', name: 'Yacht', price: 250000, image: 'https://i.ibb.co/QvjXhP2/realistic-yacht.png', animationId: 'yacht', color: 'cyan', isPremium: true },
  { id: 'mansion', name: 'Mansion', price: 350000, image: 'https://i.ibb.co/3W64gXz/realistic-mansion.png', animationId: 'mansion', color: 'cyan', isPremium: true },
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
   
   // --- LOGIC: Coins cut and Diamonds add (40%) ---
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

   // Notification UI
   const newId = Date.now();
   setNotifications(prev => [{ id: newId, name: userProfile.username, avatar: userProfile.avatarUrl, image: selectedGift.image, qty: isComboTrigger ? (comboCount + 1) : qty, color: selectedGift.color }, ...prev].slice(0, 3));
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
   {/* Realistic SVGA-like Notifications */}
   <div className="fixed left-4 top-1/3 z-[600] flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
     {notifications.map((notif) => (
      <motion.div key={notif.id} initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}
       className={cn("flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 pr-6 rounded-full border shadow-2xl overflow-hidden", `border-${notif.color}-500/50 shadow-${notif.color}-500/20`)}>
       {/* Realistic Glow Layer */}
       <div className={cn("absolute inset-0 blur-xl opacity-30 pointer-events-none", `bg-${notif.color}-500`)} />
       
       <Avatar className="h-8 w-8 border border-white/20"><AvatarImage src={notif.avatar} /></Avatar>
       <div className="flex flex-col z-10">
        <span className="text-[10px] font-bold text-white truncate max-w-[80px] uppercase tracking-wider">{notif.name}</span>
        <img src={notif.image} className="h-5 w-5 object-contain drop-shadow-lg" alt="gift" />
       </div>
       <span className={cn("ml-2 text-2xl font-black italic z-10 drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]", `text-${notif.color}-400`)}>x{notif.qty}</span>
      </motion.div>
     ))}
    </AnimatePresence>
   </div>

   {/* Realistic Combo sparkle Button */}
   <AnimatePresence>
    {showCombo && (
     <motion.div initial={{ scale: 0 }} animate={{ scale: 1.1 }} exit={{ scale: 0 }} className="fixed bottom-32 right-8 z-[600]">
      <button onClick={() => handleSend(true)} className="relative h-24 w-24 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-full border-4 border-white shadow-[0_0_40px_rgba(234,179,8,0.7)] flex flex-col items-center justify-center active:scale-90 transition-transform group overflow-hidden">
       {/* Realistic glint line moving through */}
       <div className="absolute top-0 -left-full w-[200%] h-full bg-white/20 -skew-x-45 animate-glint" />
       
       <Zap className="h-9 w-9 text-white fill-white animate-pulse drop-shadow-xl z-10" />
       <span className="text-2xl font-black text-white italic drop-shadow-2xl z-10">{comboCount}</span>
       
       {/* Floating realistic sparkles */}
       {[...Array(5)].map((_,i)=><Sparkles key={i} className={cn("absolute h-2 w-2 text-white/80 animate-ping", `top-${i*20}%`, `left-${(i*20+30)%100}%`)} style={{animationDelay: `${i*0.1}s`}} />)}
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md w-[95%] bg-[#0f1218] border border-white/10 p-0 rounded-[36px] overflow-hidden text-white shadow-2xl ring-1 ring-white/5">
     
     {/* Recipient Bar */}
     <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar bg-black/40 border-b border-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-13 w-13 rounded-full border-2 text-[10px] font-black shrink-0 transition-all flex items-center justify-center shadow-lg", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-13 w-13 border-2 transition-all duration-300", selectedUids.includes(p.uid) ? "border-cyan-400 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.5)] ring-2 ring-cyan-400/20" : "border-transparentgrayscale opacity-40 grayscale")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 bg-cyan-400 rounded-full p-1 shadow-md"><Check className="h-3 w-3 text-black stroke-[4px]" /></div>}
       </button>
      ))}
     </div>

     {/* Category Tabs */}
     <Tabs defaultValue="Hot" className="w-full mt-4">
      <TabsList className="mx-6 bg-white/5 p-1 rounded-2xl flex justify-between border border-white/10">
       {['Hot', 'Lucky', 'Luxury'].map(id => (
        <TabsTrigger key={id} value={id} className="flex-1 text-[11px] font-black py-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-lg transition-all uppercase tracking-widest">{id}</TabsTrigger>
       ))}
      </TabsList>
      
      <div className="h-[360px] overflow-y-auto no-scrollbar p-6">
       {Object.entries(GIFTS).map(([cat, items]) => (
        <TabsContent key={cat} value={cat} className="grid grid-cols-4 gap-4 m-0 outline-none">
         {items.map(gift => (
          <motion.button 
           whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}
           key={gift.id} 
           onClick={() => setSelectedGift(gift)} 
           className={cn(
            "relative flex flex-col items-center p-2 rounded-[28px] border transition-all duration-300 group overflow-hidden shadow-inner", 
            selectedGift?.id === gift.id 
             ? "bg-[#1c2331] border-cyan-400/80 shadow-[0_15px_30px_rgba(0,0,0,0.6)]" 
             : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:shadow-cyan-500/10"
           )}
          >
           {/* Realistic Glint Layer: Moving over selected */}
           {selectedGift?.id === gift.id && <div className="absolute top-0 -left-full w-[200%] h-full bg-white/10 -skew-x-45 animate-glint pointer-events-none" />}
           
           {/* Gift Realistic Image: Using drop-shadow for 3D realism */}
           <div className="h-16 w-16 flex items-center justify-center mb-1 relative z-10">
            <img src={gift.image} alt={gift.name} className={cn("h-full w-full object-contain transition-transform duration-300 drop-shadow-2xl", selectedGift?.id === gift.id ? "scale-105" : "group-hover:scale-102")} />
            
            {/* Soft color aura around gift image */}
            <div className={cn("absolute inset-0 blur-xl opacity-20 pointer-events-none transition-opacity", `bg-${gift.color}-500`, selectedGift?.id === gift.id ? "opacity-30" : "group-hover:opacity-15" )} />
           </div>
           
           <span className="text-[9px] font-black text-white/90 z-10 uppercase tracking-tighter mb-1 truncate w-full text-center">{gift.name}</span>
           
           <div className="flex items-center gap-1 mt-auto z-10 bg-black/50 px-2 py-0.5 rounded-full border border-white/5 shadow-inner">
            <GoldCoinIcon className="h-2.5 w-2.5" />
            <span className="text-[10px] text-yellow-400 font-black">{gift.price >= 1000 ? (gift.price/1000)+'k' : gift.price}</span>
           </div>

           {gift.isPremium && <div className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316] border-2 border-white/20" />}
          </motion.button>
         ))}
       </TabsContent>
       ))}
      </div>
     </Tabs>

     {/* 3D Footer */}
     <div className="p-6 bg-gradient-to-t from-black to-[#0f1218] flex items-center justify-between border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 bg-[#1e2533] border border-white/10 px-4 py-2 rounded-2xl shadow-inner">
       <GoldCoinIcon className="h-5 w-5" />
       <div className="flex flex-col">
        <span className="text-[8px] font-bold text-white/60 uppercase">Balance</span>
        <span className="text-sm font-black text-yellow-400">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
       </div>
      </div>

      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-18 h-10 bg-white/5 border-white/10 rounded-xl text-cyan-400 font-black focus:ring-1 ring-cyan-400/50">
          <SelectValue />
         </SelectTrigger>
         <SelectContent className="bg-[#0f1218] border-white/10 text-white font-bold rounded-xl">
          {['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q} className="focus:bg-cyan-600 transition-colors">{q}</SelectItem>)}
         </SelectContent>
       </Select>

       <button 
         onClick={() => handleSend(false)} 
         disabled={!selectedGift || isSending || selectedUids.length === 0} 
         className="h-10 px-9 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 font-black text-xs shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all uppercase tracking-widest border-t border-white/20"
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
