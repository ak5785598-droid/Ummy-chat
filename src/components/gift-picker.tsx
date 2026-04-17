'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, Zap } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEW EMOJI GIFTS DATA ---
const GIFTS: Record<string, any[]> = {
 'Hot': [
  { id: 'heart', name: 'Heart', price: 99, icon: '❤️', animationId: 'heart_anim' },
  { id: 'cake', name: 'Cake', price: 499, icon: '🍰', animationId: 'cake_anim' },
  { id: 'popcorn', name: 'Popcorn', price: 799, icon: '🍿', animationId: 'popcorn_anim' },
  { id: 'donut', name: 'Donut', price: 299, icon: '🍩', animationId: 'donut_anim' },
  { id: 'lollipop', name: 'Lollipop', price: 199, icon: '🍭', animationId: 'lolly_anim' },
 ]
};

const getTodayString = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
    return istDate.toISOString().split('T')[0];
};

export function GiftPicker({ open, onOpenChange, roomId, recipient: initialRecipient, participants = [] }: any) {
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();

 const [selectedGift, setSelectedGift] = useState<any>(null);
 const [quantity, setQuantity] = useState('1');
 const [isSending, setIsSending] = useState(false);
 const [selectedUids, setSelectedUids] = useState<string[]>([]);
 
 // Combo & Notification States
 const [showCombo, setShowCombo] = useState(false);
 const [comboCount, setComboCount] = useState(0);
 const [notification, setNotification] = useState<any>(null);
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
   const today = getTodayString();
   
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);
   const isSenderNewDay = (userProfile.wallet as any)?.lastDailyResetDate !== today;
   
   batch.update(senderProfileRef, { 
     'wallet.coins': increment(-totalCost),
     'wallet.totalSpent': increment(totalCost),
     'wallet.dailySpent': isSenderNewDay ? totalCost : increment(totalCost),
     'wallet.lastDailyResetDate': today,
     updatedAt: serverTimestamp() 
   });
   
   batch.update(senderUserRef, { 
     'wallet.coins': increment(-totalCost),
     'wallet.dailySpent': isSenderNewDay ? totalCost : increment(totalCost),
     'wallet.lastDailyResetDate': today
   });

   const diamondPerRecipient = Math.floor((selectedGift.price * qty) * 0.4);
   
   selectedUids.forEach(uid => {
     const recProfileRef = doc(firestore, 'users', uid, 'profile', uid);
     const recUserRef = doc(firestore, 'users', uid);
     batch.update(recProfileRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       'stats.dailyGiftsReceived': increment(diamondPerRecipient)
     });
     batch.update(recUserRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       'stats.dailyGiftsReceived': increment(diamondPerRecipient) 
     });
   });

   const roomRef = doc(firestore, 'chatRooms', roomId);
   batch.update(roomRef, {
     'stats.totalGifts': increment(totalCost),
     'stats.dailyGifts': increment(totalCost),
     'rocket.progress': increment(totalCost)
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

   // Show Blue Card Notification
   setNotification({
     userName: userProfile.username,
     giftIcon: selectedGift.icon,
     qty: isComboTrigger ? 1 : qty
   });
   setTimeout(() => setNotification(null), 3000);

   setComboCount(prev => prev + 1);
   setShowCombo(true);
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => { setShowCombo(false); setComboCount(0); }, 3000);

   if (!isComboTrigger) onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   {/* --- SIDE NOTIFICATION (BLUE CARD) --- */}
   <AnimatePresence>
    {notification && (
      <motion.div 
        initial={{ x: -100, opacity: 0 }} 
        animate={{ x: 20, opacity: 1 }} 
        exit={{ x: -100, opacity: 0 }}
        className="fixed top-24 left-0 z-[700] bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-r-full border-y border-r border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-3"
      >
        <div className="text-2xl">{notification.giftIcon}</div>
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Gift Sent!</span>
          <span className="text-sm font-black text-white">{notification.userName} <span className="text-blue-200">x{notification.qty}</span></span>
        </div>
      </motion.div>
    )}
   </AnimatePresence>

   {/* --- COMBO BUTTON --- */}
   <AnimatePresence>
    {showCombo && (
     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-44 right-8 z-[600]">
      <button onClick={() => handleSend(true)} className="h-24 w-24 bg-gradient-to-tr from-orange-600 to-yellow-400 rounded-full border-4 border-white shadow-[0_0_30px_rgba(251,191,36,0.5)] flex flex-col items-center justify-center active:scale-90 transition-all">
       <Zap className="h-8 w-8 text-white fill-white animate-bounce" />
       <span className="text-2xl font-black text-white italic">{comboCount}x</span>
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14]/95 backdrop-blur-md border-t border-white/10 p-0 rounded-t-[35px] overflow-hidden text-white h-[520px] pb-10">
     
     <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-12 w-12 rounded-full border-2 text-[10px] font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-12 w-12 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

     <Tabs defaultValue="Hot" className="w-full mt-3">
      <TabsList className="mx-6 bg-white/5 p-1 rounded-2xl flex justify-between">
       {['Hot', 'Lucky', 'Luxury', 'Event'].map(id => (
        <TabsTrigger key={id} value={id} className="text-[11px] font-black px-6 py-2 rounded-xl data-[state=active]:bg-blue-600">{id}</TabsTrigger>
       ))}
      </TabsList>
      
      <div className="h-[360px] overflow-y-auto no-scrollbar p-4 grid grid-cols-4 gap-4 pb-24">
       {Object.entries(GIFTS).map(([cat, items]) => (
        <TabsContent key={cat} value={cat} className="contents">
         {items.map(gift => (
          <button 
           key={gift.id} 
           onClick={() => setSelectedGift(gift)} 
           className={cn(
            "flex flex-col items-center py-2 transition-all", 
            selectedGift?.id === gift.id ? "scale-110" : "opacity-70"
           )}
          >
           {/* SIMPLE EMOJI DESIGN - NO CARDS */}
           <div className="text-4xl mb-1 filter drop-shadow-md">
             {gift.icon}
           </div>
           <span className="text-[10px] font-bold text-white/90 truncate w-full text-center">{gift.name}</span>
           <div className="flex items-center gap-1">
            <span className="text-[11px] text-yellow-500 font-black">{gift.price}</span>
           </div>
          </button>
         ))}
        </TabsContent>
       ))}
      </div>
     </Tabs>

     <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0b0e14] flex items-center justify-between border-t border-white/10">
      <div className="flex items-center gap-2 px-4 py-2.5">
       <div className="h-3 w-3 rounded-full bg-yellow-500" />
       <span className="text-sm font-black text-yellow-500">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-16 h-11 bg-white/5 border-none text-cyan-400 font-bold focus:ring-0"><SelectValue /></SelectTrigger>
         <SelectContent className="bg-[#151921] border-white/10 text-white font-bold">{['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
       </Select>
       <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending || selectedUids.length === 0} 
         className="h-11 px-8 rounded-full bg-blue-600 font-black text-xs shadow-lg active:scale-95 disabled:opacity-30 uppercase tracking-widest">
         {isSending ? <Loader className="h-4 w-4 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </SheetContent>
   </Sheet>
  </>
 );
}
