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

// --- GIFTS DATA WITH LUCKY ADDITION ---
const GIFTS: Record<string, any[]> = {
 'Hot': [
  { id: 'heart', name: 'Heart', price: 99, emoji: '❤️', animationId: 'heart_anim' },
  { id: 'cake', name: 'Cake', price: 499, emoji: '🍰', animationId: 'cake_anim' },
  { id: 'popcorn', name: 'Popcorn', price: 799, emoji: '🍿', animationId: 'popcorn_anim' },
  { id: 'donut', name: 'Donut', price: 299, emoji: '🍩', animationId: 'donut_anim' },
  { id: 'lollipop', name: 'Lollipop', price: 199, emoji: '🍭', animationId: 'lollipop_anim' },
 ],
 'Lucky': [
    { id: 'apple', name: 'Apple', price: 100, emoji: '🍎', animationId: 'apple_svga_3d', isLucky: true },
    { id: 'watermelon', name: 'Watermelon', price: 499, emoji: '🍉', animationId: 'watermelon_svga_3d', isLucky: true },
    { id: 'mango', name: 'Mango', price: 999, emoji: '🥭', animationId: 'mango_svga_3d', isLucky: true },
    { id: 'strawberry', name: 'Strawberry', price: 2999, emoji: '🍓', animationId: 'strawberry_svga_3d', isLucky: true },
    { id: 'cherry', name: 'Cherry', price: 5000, emoji: '🍒', animationId: 'cherry_svga_3d', isLucky: true },
 ],
 'Luxury': [
    { id: 'dm', name: 'Ball', price: 700000, emoji: '🎸', animationId: 'diamond' },
    { id: 'tp', name: 'Guitar', price: 999999, emoji: '🎳', animationId: 'trophy' },
 ]
};

const MULTIPLIERS = [1, 2, 5, 10, 50, 100, 499, 999];

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
 
 const [showCombo, setShowCombo] = useState(false);
 const [comboCount, setComboCount] = useState(0);
 const [toasts, setToasts] = useState<any[]>([]); 
 
 // Lucky Win State
 const [winData, setWinData] = useState<{ show: boolean, multiplier: number } | null>(null);

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
  if (isSending) return;
  setIsSending(true);

  try {
   const batch = writeBatch(firestore);
   const today = getTodayString();
   
   // Logic for Lucky Multiplier
   let winAmount = 0;
   let selectedMult = 1;

   if (selectedGift.isLucky) {
      // Simple random weighted logic for demo (mostly 1x, rarely 999x)
      const rand = Math.random();
      if (rand < 0.7) selectedMult = 1;
      else if (rand < 0.85) selectedMult = 2;
      else if (rand < 0.93) selectedMult = 5;
      else if (rand < 0.97) selectedMult = 10;
      else selectedMult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
      
      if (selectedMult > 1) {
         winAmount = (selectedGift.price * qty) * selectedMult;
      }
   }

   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);
   const isSenderNewDay = (userProfile.wallet as any)?.lastDailyResetDate !== today;
   
   // Wallet deduction + Win addition if lucky
   const coinAdjustment = -totalCost + winAmount;

   batch.update(senderProfileRef, { 
     'wallet.coins': increment(coinAdjustment),
     'wallet.totalSpent': increment(totalCost),
     'wallet.dailySpent': isSenderNewDay ? totalCost : increment(totalCost),
     'wallet.lastDailyResetDate': today,
     updatedAt: serverTimestamp() 
   });
   
   batch.update(senderUserRef, { 
     'wallet.coins': increment(coinAdjustment),
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

   const firstRecipientUid = selectedUids[0];
   const recipientObj = participants.find((p: any) => p.uid === firstRecipientUid);
   const recipientSeat = recipientObj?.seatIndex || 1;
   const recipientName = recipientObj?.name || 'Someone';

   const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
   batch.set(msgRef, {
    type: 'gift',
    senderId: user.uid,
    senderName: userProfile.username,
    giftId: selectedGift.animationId,
    recipientId: firstRecipientUid,
    recipientSeat: recipientSeat,
    text: `sent ${selectedGift.name} x${isComboTrigger ? 1 : qty} to ${recipientName}`,
    timestamp: serverTimestamp()
   });

   await batch.commit();

   // Show Win Card if multiplier > 1
   if (winAmount > 0) {
      setWinData({ show: true, multiplier: selectedMult });
      setTimeout(() => setWinData(null), 4000);
   }

   // Toast and Combo Logic
   const newToastId = Date.now();
   setToasts(prev => [...prev, { id: newToastId, emoji: selectedGift.emoji, qty: isComboTrigger ? comboCount + 1 : qty, username: userProfile.username, avatarUrl: userProfile.avatarUrl }].slice(-3));
   setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== newToastId)); }, 3000);

   setComboCount(prev => prev + 1);
   setShowCombo(true);
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => { setShowCombo(false); setComboCount(0); }, 3000);

   if (!isComboTrigger && !selectedGift.isLucky) onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   {/* --- 3D LUCKY WIN CARD --- */}
   <AnimatePresence>
     {winData?.show && (
       <motion.div 
         initial={{ scale: 0.5, opacity: 0, y: 50 }}
         animate={{ scale: 1, opacity: 1, y: 0 }}
         exit={{ scale: 1.5, opacity: 0 }}
         className="fixed inset-0 flex items-center justify-center z-[1000] pointer-events-none"
       >
         <div className="relative w-72 h-44 bg-gradient-to-br from-blue-500 to-blue-800 rounded-[30px] border-[6px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.3)] flex flex-col items-center justify-center overflow-hidden">
            {/* Glossy Overlay */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-[-10deg] -translate-y-10" />
            
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
              style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}
            >
              WIN x{winData.multiplier}
            </motion.span>
            
            <div className="mt-2 px-4 py-1 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
               <span className="text-white font-bold text-xs uppercase tracking-widest">Lucky Reward</span>
            </div>
         </div>
       </motion.div>
     )}
   </AnimatePresence>

   {/* SIDE NOTIFICATIONS */}
   <div className="fixed top-[70vh] left-0 z-[700] flex flex-col gap-2 pointer-events-none">
     <AnimatePresence>
      {toasts.map((toast) => (
       <motion.div key={toast.id} initial={{ x: -100, opacity: 0 }} animate={{ x: 16, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-blue-600/95 backdrop-blur-md p-2 pr-6 rounded-r-full flex items-center gap-3 border-2 border-white shadow-[0_0_15px_rgba(37,99,235,0.6)]">
        <Avatar className="h-10 w-10 border-2 border-white"><AvatarImage src={toast.avatarUrl} /></Avatar>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white uppercase tracking-tight leading-none">{toast.username}</span>
          <div className="flex items-center gap-1"><span className="text-lg">{toast.emoji}</span><span className="text-sm font-black text-white italic">x{toast.qty}</span></div>
        </div>
       </motion.div>
      ))}
     </AnimatePresence>
   </div>

   {/* COMBO BUTTON */}
   <AnimatePresence>
    {showCombo && (
     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-44 right-8 z-[600]">
      <button onClick={() => handleSend(true)} className="h-24 w-24 bg-blue-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(37,99,235,0.7)] flex flex-col items-center justify-center active:scale-90 transition-all">
       <Zap className="h-8 w-8 text-white fill-white animate-bounce" />
       <span className="text-2xl font-black text-white italic">{comboCount}x</span>
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-[35px] overflow-hidden text-white shadow-2xl h-[400px] pb-10">
     <div className="p-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-10 w-10 rounded-full border-2 text-[10px] font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-10 w-10 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

     <Tabs defaultValue="Hot" className="w-full mt-2">
      <TabsList className="mx-4 bg-white/5 p-1 rounded-2xl flex justify-between border border-white/5">
       {['Hot', 'Lucky', 'Luxury', 'Event'].map(id => (
        <TabsTrigger key={id} value={id} className="text-[11px] font-black px-4 py-1.5 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500">{id}</TabsTrigger>
       ))}
      </TabsList>
      
      <div className="h-[160px] overflow-y-auto no-scrollbar px-4 pt-3 pb-20 grid grid-cols-4 gap-x-2 gap-y-4">
       {Object.entries(GIFTS).map(([cat, items]) => (
        <TabsContent key={cat} value={cat} className="contents">
         {items.map(gift => (
          <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center transition-all duration-300 relative py-1 rounded-lg", selectedGift?.id === gift.id ? "brightness-125 bg-white/10" : "opacity-70 hover:opacity-100")}>
           <div className="text-3xl mb-0 filter drop-shadow-md">{gift.emoji}</div>
           <span className="text-[10px] font-bold text-white/90 truncate w-full text-center mt-1">{gift.name}</span>
           <div className="flex items-center gap-1 mt-0"><span className="text-[10px] text-yellow-500 font-black">{gift.price}</span></div>
           {selectedGift?.id === gift.id && <div className="absolute -bottom-1 h-1 w-4 bg-cyan-400 rounded-full" />}
          </button>
         ))}
        </TabsContent>
       ))}
      </div>
     </Tabs>

     <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#0b0e14] flex items-center justify-between border-t border-white/10 shadow-2xl">
      <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-2xl border border-white/5">
       <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-black text-black">C</div>
       <span className="text-sm font-black text-yellow-500">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-16 h-10 bg-white/5 border-white/10 rounded-2xl text-cyan-400 font-bold focus:ring-0"><SelectValue /></SelectTrigger>
         <SelectContent className="bg-[#151921] border-white/10 text-white font-bold">{['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
       </Select>
       <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending || selectedUids.length === 0} className="h-10 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-xs shadow-lg active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest border-b-4 border-black/20">
         {isSending ? <Loader className="h-4 w-4 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </SheetContent>
   </Sheet>
  </>
 );
}
