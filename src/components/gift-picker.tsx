'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, Zap, Gem, Heart, Flame, Sparkles, Beer, Star, Gift } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM SVG ICON GENERATOR (Design based on Image 2) ---
const CustomGiftIcon = ({ type, active }: { type: string; active: boolean }) => {
  const base = cn("h-12 w-12 transition-all duration-500", active ? "scale-110 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" : "opacity-80");
  
  switch (type) {
    case 'bouquet': 
      return <div className="relative"><Flame className={cn(base, "text-pink-400 fill-pink-500/20")} /><Heart className="absolute -top-1 -right-1 h-5 w-5 text-red-500 fill-red-500 animate-pulse" /></div>;
    case 'love': 
      return <div className={cn("font-black italic text-2xl tracking-tighter bg-gradient-to-br from-red-500 to-pink-500 bg-clip-text text-transparent", active && "scale-110")}>LOVE</div>;
    case 'ring': 
      return <div className="relative flex items-center justify-center"><div className="h-9 w-9 border-[3px] border-yellow-400 rounded-full rotate-[20deg]" /><Gem className="absolute -top-3 h-7 w-7 text-cyan-300 fill-cyan-400/20 animate-bounce" /></div>;
    case 'chocolate': 
      return <div className="p-1 bg-amber-900 rounded-lg border-2 border-amber-700 shadow-xl grid grid-cols-2 gap-0.5"><div className="h-3 w-3 bg-amber-800 rounded-sm"/><div className="h-3 w-3 bg-amber-700 rounded-sm"/><div className="h-3 w-3 bg-amber-600 rounded-sm"/><div className="h-3 w-3 bg-amber-800 rounded-sm"/></div>;
    case 'cheers': 
      return <div className="flex -space-x-3"><Beer className="h-9 w-9 text-orange-400 -rotate-12" /><Beer className="h-9 w-9 text-orange-400 rotate-12" /></div>;
    case 'fireworks': 
      return <Sparkles className={cn(base, "text-purple-400 animate-pulse")} />;
    case 'friends': 
      return <div className="relative"><Heart className={cn(base, "text-blue-400 fill-blue-500/20")} /><Star className="absolute top-0 right-0 h-4 w-4 text-yellow-400 fill-yellow-400" /></div>;
    default: 
      return <Gift className={cn(base, "text-indigo-400")} />;
  }
};

const GIFTS: Record<string, any[]> = {
 'Hot': [
  { id: 'bq', name: 'Bouquet', price: 15000, type: 'bouquet', animationId: 'bouquet' },
  { id: 'lv', name: 'Love', price: 25000, type: 'love', animationId: 'love' },
  { id: 'cr', name: 'Crown', price: 499, type: 'crown', animationId: 'crown_gift_premium' },
  { id: 'lb', name: 'Love Balloon', price: 40000, type: 'fireworks', animationId: 'balloon' },
  { id: 'ch', name: 'Chocolate', price: 250000, type: 'chocolate', animationId: 'choco' },
  { id: 'rg', name: 'Ring', price: 400000, type: 'ring', animationId: 'ring' },
  { id: 'cc', name: 'Coke Cheers', price: 20000, type: 'cheers', animationId: 'coke' },
  { id: 'fw', name: 'Love Fireworks', price: 500000, type: 'fireworks', animationId: 'fireworks' },
  { id: 'ff', name: 'Forever Friends', price: 100000, type: 'friends', animationId: 'friends' },
 ],
 'Luxury': [
    { id: 'dm', name: 'Diamond', price: 70000, type: 'ring', animationId: 'diamond' },
    { id: 'tp', name: 'Trophy', price: 90000, type: 'default', animationId: 'trophy' },
 ]
};

// --- Daily Date Utility ---
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
   
   // --- SENDER PROFILE UPDATES (Including Daily Reset) ---
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
   
   // --- RECIPIENT UPDATES ---
   selectedUids.forEach(uid => {
     const recProfileRef = doc(firestore, 'users', uid, 'profile', uid);
     const recUserRef = doc(firestore, 'users', uid);
     // Recipient dailyGiftsReceived reset happens when THEY send/receive or refresh
     batch.update(recProfileRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       'stats.dailyGiftsReceived': increment(diamondPerRecipient)
     });
     batch.update(recUserRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       'stats.dailyGiftsReceived': increment(diamondPerRecipient) 
     });
   });

   // --- ROOM STATS & ROCKET PROGRESS ---
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

   // Combo Logic
   setComboCount(prev => prev + 1);
   setShowCombo(true);
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => { setShowCombo(false); setComboCount(0); }, 3000);

   if (!isComboTrigger) onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   {/* Combo Button */}
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

   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md w-[95%] bg-[#0b0e14] border border-white/10 p-0 rounded-[35px] overflow-hidden text-white shadow-2xl">
     
     {/* Recipient Selection */}
     <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-12 w-12 rounded-full border-2 text-[10px] font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-12 w-12 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400 scale-105" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

     {/* Tabs */}
     <Tabs defaultValue="Hot" className="w-full mt-3">
      <TabsList className="mx-6 bg-white/5 p-1 rounded-2xl flex justify-between border border-white/5">
       {['Hot', 'Lucky', 'Luxury', 'Event'].map(id => (
        <TabsTrigger key={id} value={id} className="text-[11px] font-black px-6 py-2 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500">{id}</TabsTrigger>
       ))}
      </TabsList>
      
      <div className="h-[360px] overflow-y-auto no-scrollbar p-4 grid grid-cols-4 gap-3 pb-24">
       {Object.entries(GIFTS).map(([cat, items]) => (
        <TabsContent key={cat} value={cat} className="contents">
         {items.map(gift => (
          <button 
           key={gift.id} 
           onClick={() => setSelectedGift(gift)} 
           className={cn(
            "flex flex-col items-center p-2 rounded-[22px] border transition-all duration-300 relative", 
            selectedGift?.id === gift.id 
             ? "bg-gradient-to-b from-blue-500/20 to-transparent border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.15)] scale-105" 
             : "bg-[#141922] border-white/5 hover:border-white/20"
           )}
          >
           <div className="h-16 w-16 flex items-center justify-center">
             <CustomGiftIcon type={gift.type} active={selectedGift?.id === gift.id} />
           </div>
           <span className="text-[10px] font-bold text-white/90 truncate w-full text-center mt-1">{gift.name}</span>
           <div className="flex items-center gap-1 mt-0.5">
            <div className="h-3 w-3 rounded-full bg-yellow-500 flex items-center justify-center text-[8px] font-black text-black">C</div>
            <span className="text-[11px] text-yellow-500 font-black">{gift.price.toLocaleString()}</span>
           </div>
          </button>
         ))}
        </TabsContent>
       ))}
      </div>
     </Tabs>

     {/* Footer */}
     <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0b0e14]/95 backdrop-blur-xl flex items-center justify-between border-t border-white/10 shadow-2xl">
      <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
       <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-black text-black">C</div>
       <span className="text-sm font-black text-yellow-500">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-16 h-11 bg-white/5 border-white/10 rounded-2xl text-cyan-400 font-bold focus:ring-0"><SelectValue /></SelectTrigger>
         <SelectContent className="bg-[#151921] border-white/10 text-white font-bold">{['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
       </Select>
       <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending || selectedUids.length === 0} 
         className="h-11 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-xs shadow-lg active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest border-b-4 border-black/20">
         {isSending ? <Loader className="h-4 w-4 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </>
 );
}
