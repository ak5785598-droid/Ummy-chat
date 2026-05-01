'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, Zap, Gem, Heart, Flame, Sparkles, Beer, Star, Gift } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM SVG ICON GENERATOR ---
const CustomGiftIcon = ({ type, active }: { type: string; active: boolean }) => {
  const base = cn("h-12 w-12 transition-all duration-500", active? "scale-110 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" : "opacity-80");

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
    case 'castle':
      // Yahi wala castle UI use ho raha hai - no emoji
      return (
        <div className={cn("h-12 w-12 relative overflow-hidden flex items-center justify-center", active && "scale-110")}>
          <svg viewBox="0 0 700 900" width="48" height="58" xmlns="http://www.w3.org/2000/svg" style={{filter: active? 'drop-shadow(0 0 8px #ffb7d5)' : 'none'}}>
            <defs>
              <linearGradient id="towerBase-mini" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fffafc"/><stop offset="100%" stopColor="#ffc4e1"/></linearGradient>
              <linearGradient id="roofPink-mini" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffc9e6"/><stop offset="100%" stopColor="#ff6db5"/></linearGradient>
              <linearGradient id="goldTrim-mini" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff4d4"/><stop offset="100%" stopColor="#c68a4f"/></linearGradient>
            </defs>
            <rect x="293" y="348" width="114" height="168" rx="15" fill="url(#towerBase-mini)" stroke="url(#goldTrim-mini)" strokeWidth="3.6"/>
            <polygon points="290,348 350,232 410,348" fill="url(#roofPink-mini)" stroke="url(#goldTrim-mini)" strokeWidth="3.8"/>
            <rect x="193" y="480" width="80" height="240" rx="13" fill="url(#towerBase-mini)" stroke="url(#goldTrim-mini)" strokeWidth="3.3"/>
            <polygon points="191,480 233,393 275,480" fill="#e4caff" stroke="url(#goldTrim-mini)" strokeWidth="3.2"/>
            <rect x="427" y="480" width="80" height="240" rx="13" fill="url(#towerBase-mini)" stroke="url(#goldTrim-mini)" strokeWidth="3.3"/>
            <polygon points="425,480 467,393 509,480" fill="#e4caff" stroke="url(#goldTrim-mini)" strokeWidth="3.2"/>
            <path d="M132 720 L132 578 Q132 558 152 558 H548 Q568 558 568 578 L568 720 Z" fill="url(#towerBase-mini)" stroke="url(#goldTrim-mini)" strokeWidth="4.2"/>
          </svg>
        </div>
      );
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
    { id: 'fr', name: 'Ferrari', price: 150000, type: 'luxury', animationId: 'ferrari' },
    { id: 'nc', name: 'Neon Car', price: 120000, type: 'luxury', animationId: 'neon-car' },
    { id: 'ss', name: 'Space Station', price: 300000, type: 'luxury', animationId: 'space-station' },
    { id: 'castle', name: 'Castle', price: 999999, type: 'castle', animationId: 'castle' },
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
  if (!user ||!firestore ||!selectedGift ||!userProfile || selectedUids.length === 0) return;

  const qty = isComboTrigger? 1 : parseInt(quantity);
  const totalCost = selectedGift.price * qty * selectedUids.length;

  if ((userProfile.wallet?.coins || 0) < totalCost) return;
  if (!isComboTrigger) setIsSending(true);

  try {
   const batch = writeBatch(firestore);
   const today = getTodayString();

   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);

   const isSenderNewDay = (userProfile.wallet as any)?.lastDailyResetDate!== today;

   batch.update(senderProfileRef, {
     'wallet.coins': increment(-totalCost),
     'wallet.totalSpent': increment(totalCost),
     'wallet.dailySpent': isSenderNewDay? totalCost : increment(totalCost),
     'wallet.lastDailyResetDate': today,
     updatedAt: serverTimestamp()
   });

   batch.update(senderUserRef, {
     'wallet.coins': increment(-totalCost),
     'wallet.dailySpent': isSenderNewDay? totalCost : increment(totalCost),
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
    text: `sent ${selectedGift.name} x${isComboTrigger? 1 : qty}`,
    timestamp: serverTimestamp()
   });

   await batch.commit();

   setComboCount(prev => prev + 1);
   setShowCombo(true);
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => { setShowCombo(false); setComboCount(0); }, 3000);

   if (!isComboTrigger) onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
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
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-[35px] overflow-hidden text-white shadow-2xl h-[520px] pb-10">

     <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-12 w-12 rounded-full border-2 text-[10px] font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-12 w-12 border-2 transition-all", selectedUids.includes(p.uid)? "border-cyan-400 scale-105" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

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
         {isSending? <Loader className="h-4 w-4 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </SheetContent>
   </Sheet>
  </>
 );
}

// --- PRINCESS CASTLE COMPONENT (Full Animation - as is) ---
export function PrincessCastle() {
  useEffect(() => {
    const particles = document.getElementById('particles');
    if (particles) {
      particles.innerHTML = '';
      for (let i = 0; i < 72; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 12 + 's';
        p.style.animationDuration = 9 + Math.random() * 7 + 's';
        const s = 2 + Math.random() * 4.5;
        p.style.width = p.style.height = s + 'px';
        p.style.setProperty('--x', Math.random() * 180 - 90 + 'px');
        particles.appendChild(p);
      }
    }
    const sparkles = document.getElementById('sparkles');
    const chars = ['✦','✧','✶','❋','✷'];
    if (sparkles) {
      sparkles.innerHTML = '';
      for (let i = 0; i < 32; i++) {
        const s = document.createElement('div');
        s.className = 'sparkle';
        s.textContent = chars[Math.floor(Math.random() * chars.length)];
        s.style.left = Math.random() * 100 + '%';
        s.style.top = 15 + Math.random() * 70 + '%';
        s.style.animationDelay = Math.random() * 5 + 's';
        s.style.animationDuration = 2.5 + Math.random() * 2.5 + 's';
        s.style.fontSize = 12 + Math.random() * 10 + 'px';
        sparkles.appendChild(s);
      }
    }
    const hearts = document.getElementById('hearts');
    if (hearts) {
      hearts.innerHTML = '';
      for (let i = 0; i < 16; i++) {
        const h = document.createElement('div');
        h.className = 'heart';
        h.textContent = '♥';
        h.style.left = Math.random() * 100 + '%';
        h.style.animationDelay = Math.random() * 10 + 's';
        h.style.animationDuration = 10 + Math.random() * 6 + 's';
        h.style.fontSize = 14 + Math.random() * 16 + 'px';
        h.style.setProperty('--hx', Math.random() * 120 - 60 + 'px');
        h.style.opacity = String(0.85 + Math.random() * 0.15);
        hearts.appendChild(h);
      }
    }
  }, []);

  const castleSvg = `<svg viewBox="0 0 700 900" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="towerBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fffafc"/><stop offset="35%" stop-color="#fff0f6"/><stop offset="100%" stop-color="#ffc4e1"/></linearGradient><linearGradient id="towerSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffe8f3"/><stop offset="50%" stop-color="#fff8f2"/><stop offset="100%" stop-color="#ffd9ec"/></linearGradient><linearGradient id="goldTrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff4d4"/><stop offset="30%" stop-color="#ffd9a0"/><stop offset="70%" stop-color="#e6a76a"/><stop offset="100%" stop-color="#c68a4f"/></linearGradient><linearGradient id="roofPink" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffc9e6"/><stop offset="50%" stop-color="#ff9dd1"/><stop offset="100%" stop-color="#ff6db5"/></linearGradient><linearGradient id="roofPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e4caff"/><stop offset="100%" stop-color="#b883ff"/></linearGradient><radialGradient id="gemGlow" cx="0.5" cy="0.4" r="0.7"><stop offset="0%" stop-color="#ffffff"/><stop offset="25%" stop-color="#ffe0f5"/><stop offset="60%" stop-color="#ffb7d5"/><stop offset="100%" stop-color="#ff5fa2" stop-opacity="0"/></radialGradient><radialGradient id="windowLight" cx="0.5" cy="0.5" r="0.6"><stop offset="0%" stop-color="#fff7d6"/><stop offset="40%" stop-color="#ffd6a0"/><stop offset="100%" stop-color="#ff8fb8" stop-opacity="0.6"/></radialGradient><filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter><filter id="sharpGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter></defs><ellipse cx="350" cy="735" rx="285" ry="58" fill="#000" opacity="0.5" filter="url(#softGlow)"/><ellipse cx="350" cy="720" rx="235" ry="26" fill="url(#goldTrim)" opacity="0.4"/><ellipse cx="350" cy="716" rx="215" ry="20" fill="url(#goldTrim)" opacity="0.7"/><g><rect x="88" y="558" width="70" height="162" rx="11" fill="url(#towerSide)" stroke="url(#goldTrim)" stroke-width="3.2"/><rect x="93" y="563" width="13" height="152" fill="#fff" opacity="0.18"/><polygon points="86,558 123,483 160,558" fill="url(#roofPink)" stroke="url(#goldTrim)" stroke-width="3"/><polygon points="86,558 123,498 160,558" fill="#fff" opacity="0.24"/><rect x="118" y="438" width="10" height="48" fill="url(#goldTrim)"/><polygon points="113,443 123,413 133,443" fill="url(#goldTrim)"/><circle cx="123" cy="409" r="5.5" fill="#fffdf0" filter="url(#sharpGlow)"/><circle cx="123" cy="409" r="11" fill="url(#gemGlow)" opacity="0.7"/><rect x="108" y="598" width="22" height="32" rx="11" fill="#1b052c" opacity="0.75"/><rect x="111" y="601" width="16" height="26" rx="8" fill="url(#windowLight)"/></g><g><rect x="542" y="558" width="70" height="162" rx="11" fill="url(#towerSide)" stroke="url(#goldTrim)" stroke-width="3.2"/><rect x="584" y="563" width="13" height="152" fill="#fff" opacity="0.18"/><polygon points="540,558 577,483 614,558" fill="url(#roofPink)" stroke="url(#goldTrim)" stroke-width="3"/><polygon points="540,558 577,498 614,558" fill="#fff" opacity="0.24"/><rect x="572" y="438" width="10" height="48" fill="url(#goldTrim)"/><polygon points="567,443 577,413 587,443" fill="url(#goldTrim)"/><circle cx="577" cy="409" r="5.5" fill="#fffdf0" filter="url(#sharpGlow)"/><circle cx="577" cy="409" r="11" fill="url(#gemGlow)" opacity="0.7"/><rect x="570" y="598" width="22" height="32" rx="11" fill="#1b052c" opacity="0.75"/><rect x="573" y="601" width="16" height="26" rx="8" fill="url(#windowLight)"/></g><g><rect x="193" y="480" width="80" height="240" rx="13" fill="url(#towerBase)" stroke="url(#goldTrim)" stroke-width="3.3"/><rect x="198" y="485" width="15" height="230" fill="#fff" opacity="0.14"/><polygon points="191,480 233,393 275,480" fill="url(#roofPurple)" stroke="url(#goldTrim)" stroke-width="3.2"/><polygon points="191,480 233,408 275,480" fill="#fff" opacity="0.2"/><rect x="228" y="348" width="10" height="48" fill="url(#goldTrim)"/><polygon points="223,353 233,323 243,353" fill="url(#goldTrim)"/><circle cx="233" cy="319" r="5.5" fill="#fff" filter="url(#sharpGlow)"/><circle cx="233" cy="319" r="12" fill="url(#gemGlow)" opacity="0.65"/><rect x="213" y="528" width="24" height="34" rx="12" fill="#14032b" opacity="0.8"/><rect x="216" y="531" width="18" height="28" rx="9" fill="url(#windowLight)"/><rect x="213" y="600" width="24" height="34" rx="12" fill="#14032b" opacity="0.8"/><rect x="216" y="603" width="18" height="28" rx="9" fill="url(#windowLight)"/></g><g><rect x="427" y="480" width="80" height="240" rx="13" fill="url(#towerBase)" stroke="url(#goldTrim)" stroke-width="3.3"/><rect x="467" y="485" width="15" height="230" fill="#fff" opacity="0.14"/><polygon points="425,480 467,393 509,480" fill="url(#roofPurple)" stroke="url(#goldTrim)" stroke-width="3.2"/><polygon points="425,480 467,408 509,480" fill="#fff" opacity="0.2"/><rect x="462" y="348" width="10" height="48" fill="url(#goldTrim)"/><polygon points="457,353 467,323 477,353" fill="url(#goldTrim)"/><circle cx="467" cy="319" r="5.5" fill="#fff" filter="url(#sharpGlow)"/><circle cx="467" cy="319" r="12" fill="url(#gemGlow)" opacity="0.65"/><rect x="447" y="528" width="24" height="34" rx="12" fill="#14032b" opacity="0.8"/><rect x="450" y="531" width="18" height="28" rx="9" fill="url(#windowLight)"/><rect x="447" y="600" width="24" height="34" rx="12" fill="#14032b" opacity="0.8"/><rect x="450" y="603" width="18" height="28" rx="9" fill="url(#windowLight)"/></g><g><path d="M132 720 L132 578 Q132 558 152 558 H264 V514 H436 V558 H548 Q568 558 568 578 L568 720 Z" fill="url(#towerBase)" stroke="url(#goldTrim)" stroke-width="4.2"/><path d="M132 720 L132 578 Q132 558 152 558 H264 V514 H436 V558 H548 Q568 558 568 578 L568 720 Z" fill="none" stroke="#fff" opacity="0.12" stroke-width="1.5"/><g fill="url(#towerSide)" stroke="url(#goldTrim)" stroke-width="2.2"><rect x="154" y="538" width="21" height="20" rx="2"/><rect x="185" y="538" width="21" height="20" rx="2"/><rect x="216" y="538" width="21" height="20" rx="2"/><rect x="463" y="538" width="21" height="20" rx="2"/><rect x="494" y="538" width="21" height="20" rx="2"/><rect x="525" y="538" width="21" height="20" rx="2"/><rect x="330" y="494" width="18" height="18" rx="2"/><rect x="352" y="494" width="18" height="18" rx="2"/></g><path d="M292 720 V608 Q292 568 350 568 Q408 568 408 608 V720" fill="#100325" opacity="0.92"/><path d="M298 720 V612 Q298 578 350 578 Q402 578 402 612 V720" fill="url(#goldTrim)" opacity="0.25"/><path d="M308 720 V618 Q308 592 350 592 Q392 592 392 618 V720" fill="#1e0738" opacity="0.95"/><circle cx="350" cy="638" r="38" fill="url(#gemGlow)" opacity="0.35" filter="url(#softGlow)"/><path d="M192 720 V638 Q192 613 218 613 Q244 613 244 638 V720" fill="#12042a" opacity="0.8"/><path d="M198 720 V641 Q198 621 218 621 Q238 621 238 641 V720" fill="url(#windowLight)" opacity="0.28"/><path d="M456 720 V638 Q456 613 482 613 Q508 613 508 638 V720" fill="#12042a" opacity="0.8"/><path d="M462 720 V641 Q462 621 482 621 Q502 621 502 641 V720" fill="url(#windowLight)" opacity="0.28"/></g><g><rect x="293" y="348" width="114" height="168" rx="15" fill="url(#towerSide)" stroke="url(#goldTrim)" stroke-width="3.6"/><rect x="298" y="353" width="17" height="158" fill="#fff" opacity="0.16"/><rect x="320" y="378" width="22" height="30" rx="11" fill="#0f0224"/><rect x="323" y="381" width="16" height="24" rx="8" fill="url(#windowLight)"/><rect x="357" y="378" width="22" height="30" rx="11" fill="#0f0224"/><rect x="360" y="381" width="16" height="24" rx="8" fill="url(#windowLight)"/><rect x="338" y="428" width="22" height="30" rx="11" fill="#0f0224"/><rect x="341" y="431" width="16" height="24" rx="8" fill="url(#windowLight)"/><polygon points="290,348 350,232 410,348" fill="url(#roofPink)" stroke="url(#goldTrim)" stroke-width="3.8"/><polygon points="290,348 350,248 410,348" fill="#fff" opacity="0.25"/><rect x="343" y="172" width="14" height="66" fill="url(#goldTrim)"/><polygon points="336,182 350,152 364,182" fill="url(#goldTrim)"/><circle cx="350" cy="147" r="8" fill="#fffef5" filter="url(#sharpGlow)"/><circle cx="350" cy="147" r="18" fill="url(#gemGlow)" opacity="0.75"/><circle cx="350" cy="147" r="28" fill="url(#gemGlow)" opacity="0.35" filter="url(#softGlow)"><animate attributeName="r" values="26;32;26" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.35;0.6;0.35" dur="3s" repeatCount="indefinite"/></circle></g><g stroke="url(#goldTrim)" stroke-width="2.5" fill="none" opacity="0.65"><path d="M273 502 Q283 492 293 500"/><path d="M407 500 Q417 492 427 502"/></g><g><circle cx="123" cy="555" r="6.5" fill="url(#goldTrim)"/><circle cx="123" cy="555" r="3" fill="#fff" opacity="0.8"/><circle cx="577" cy="555" r="6.5" fill="url(#goldTrim)"/><circle cx="577" cy="555" r="3" fill="#fff" opacity="0.8"/><circle cx="233" cy="476" r="6.5" fill="url(#goldTrim)"/><circle cx="233" cy="476" r="3" fill="#fff" opacity="0.8"/><circle cx="467" cy="476" r="6.5" fill="url(#goldTrim)"/><circle cx="467" cy="476" r="3" fill="#fff" opacity="0.8"/><circle cx="350" cy="338" r="7.5" fill="url(#goldTrim)"/><circle cx="350" cy="338" r="3.5" fill="#fff" opacity="0.9"/></g><g filter="url(#sharpGlow)" opacity="0.95"><polygon points="318,712 328,688 338,712 328,734" fill="#ffc6e5"><animateTransform attributeName="transform" type="rotate" from="0 328 711" to="360 328 711" dur="20s" repeatCount="indefinite"/></polygon><polygon points="353,718 363,694 373,718 363,740" fill="#ffe0b0"><animateTransform attributeName="transform" type="rotate" from="360 363 717" to="0 363 717" dur="18s" repeatCount="indefinite"/></polygon><polygon points="335,704 345,680 355,704 345,726" fill="#fff0f8"><animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/></polygon></g></svg>`;

  return (
    <>
      <style>{`* { margin:0; padding:0; box-sizing:border-box; } html, body { height:100%; overflow:hidden; background:#050210; } body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: radial-gradient(ellipse at center top, #2a0845 0%, #0a0318 60%, #03000a 100%); display:flex; align-items:center; justify-content:center; touch-action:none; user-select:none; }.stage { position:relative; width:100vw; height:100vh; max-width:440px; background: linear-gradient(180deg, #0a0318 0%, #14042a 30%, #2a0845 100%); overflow:hidden; box-shadow: 0 0 120px rgba(0,0,0,0.9), inset 0 0 180px rgba(0,0,0,0.6); margin:0 auto; }.stage::after { content:''; position:absolute; inset:0; background: radial-gradient(ellipse at 50% 0%, rgba(255,183,213,0.12) 0%, transparent 60%); pointer-events:none; }.rays { position:absolute; width:200vmin; height:200vmin; top:42%; left:50%; transform:translate(-50%, -50%); background: repeating-conic-gradient(from 0deg, transparent 0deg 5deg, rgba(255,214,160,0.22) 5deg 9deg, transparent 9deg 14deg, rgba(255,183,213,0.18) 14deg 17deg, transparent 17deg 24deg, rgba(255,240,200,0.15) 24deg 27deg, transparent 27deg 36deg); border-radius:50%; filter:blur(14px); mix-blend-mode:screen; animation: spin 48s linear infinite, rayPulse 15s ease-in-out infinite; opacity:0.75; } @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } } @keyframes rayPulse { 0%,100% { opacity:0.3; transform:translate(-50%,-50%) scale(0.88) rotate(0deg); } 12% { opacity:0.9; } 28% { opacity:1; transform:translate(-50%,-50%) scale(1.12) rotate(90deg); } 55% { opacity:0.85; transform:translate(-50%,-50%) scale(1.05) rotate(180deg); } 78% { opacity:0.95; transform:translate(-50%,-50%) scale(1.15) rotate(270deg); } }.aura { position:absolute; width:94%; height:68%; top:36%; left:50%; transform:translateX(-50%); background: radial-gradient(ellipse at center, rgba(255,210,235,0.45) 0%, rgba(255,183,213,0.32) 22%, rgba(255,214,160,0.25) 38%, rgba(185,122,255,0.18) 55%, transparent 72%); filter:blur(38px); mix-blend-mode:screen; animation: auraPulse 15s ease-in-out infinite; } @keyframes auraPulse { 0% { opacity:0; transform:translateX(-50%) scale(0.75); } 8% { opacity:1; } 25% { opacity:1; transform:translateX(-50%) scale(1.18); } 50% { opacity:0.9; transform:translateX(-50%) scale(1.06); } 72% { opacity:1; transform:translateX(-50%) scale(1.2); } 92% { opacity:0.7; } 100% { opacity:0; transform:translateX(-50%) scale(0.78); } }.castle-scene { position:absolute; top:4%; left:50%; width:92%; height:80%; transform:translateX(-50%); perspective:1500px; z-index:10; }.castle-wrap { width:100%; height:100%; transform-style:preserve-3d; animation: castleFloat 15s cubic-bezier(0.45,0,0.55,1) infinite; will-change:transform, opacity, filter; } @keyframes castleFloat { 0% { opacity:0; transform:scale(0.76) rotateY(-22deg) rotateX(10deg) translateY(70px); filter:brightness(0.55) blur(8px) saturate(0.8); } 7% { opacity:1; filter:brightness(1) blur(0) saturate(1.1); } 18% { transform:scale(1.03) rotateY(9deg) rotateX(-3deg) translateY(-12px); } 32% { transform:scale(1.055) rotateY(14deg) rotateX(2deg) translateY(-18px); filter:brightness(1.15); } 51% { transform:scale(0.985) rotateY(-7deg) rotateX(-2deg) translateY(4px); } 68% { transform:scale(1.048) rotateY(11deg) rotateX(3deg) translateY(-14px); filter:brightness(1.12); } 84% { transform:scale(0.97) rotateY(-5deg) rotateX(1deg) translateY(6px); opacity:1; } 94% { opacity:0.85; filter:brightness(0.9); } 100% { opacity:0; transform:scale(0.76) rotateY(-22deg) rotateX(10deg) translateY(70px); filter:brightness(0.55) blur(8px); } }.castle-wrap svg { width:100%; height:100%; overflow:visible; filter: drop-shadow(0 40px 80px rgba(0,0,0,0.75)) drop-shadow(0 0 50px rgba(255,183,213,0.35)) drop-shadow(0 0 80px rgba(255,214,160,0.2)); }.castle-glow { position:absolute; bottom:8%; left:50%; width:76%; height:28%; transform:translateX(-50%); background: radial-gradient(ellipse, rgba(255,214,160,0.6) 0%, rgba(255,183,213,0.4) 40%, transparent 70%); filter:blur(26px); mix-blend-mode:screen; animation: glowPulse 15s ease-in-out infinite; z-index:-1; } @keyframes glowPulse { 0%,100% { opacity:0.4; transform:translateX(-50%) scale(0.85); } 30% { opacity:1; transform:translateX(-50%) scale(1.1); } 65% { opacity:0.9; transform:translateX(-50%) scale(1.05); } }.mist { position:absolute; bottom:-8%; left:50%; width:120%; height:36%; transform:translateX(-50%); background: radial-gradient(ellipse at 30% 50%, rgba(255,183,213,0.65) 0%, transparent 55%), radial-gradient(ellipse at 70% 40%, rgba(255,214,160,0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 60%, rgba(255,138,193,0.4) 0%, transparent 60%); filter:blur(32px); opacity:0.95; animation: mistFlow 15s ease-in-out infinite; z-index:12; mix-blend-mode:screen; pointer-events:none; } @keyframes mistFlow { 0%,100% { transform:translateX(-50%) translateY(25px) scale(0.92); opacity:0.6; } 22% { transform:translateX(-48%) translateY(-5px) scale(1.08); opacity:1; } 48% { transform:translateX(-52%) translateY(-10px) scale(1.12); opacity:0.95; } 75% { transform:translateX(-50%) translateY(0px) scale(1.05); opacity:0.9; } }.particles,.sparkles,.hearts { position:absolute; inset:0; pointer-events:none; z-index:20; overflow:hidden; }.particles { animation: particlePulse 15s ease-in-out infinite; }.sparkles { animation: sparklePulse 15s ease-in-out infinite; } @keyframes particlePulse { 0%,9%,94%,100% { opacity:0.35; } 20%,78% { opacity:1; } } @keyframes sparklePulse { 0%,10%,92%,100% { opacity:0.3; } 30%,70% { opacity:1; } }.particle { position:absolute; bottom:-15px; background: radial-gradient(circle, #fff9e2 0%, #ffe4b0 30%, #ffb7d5 60%, transparent 75%); border-radius:50%; box-shadow: 0 0 6px #ffd6a0, 0 0 14px #ffb7d5, 0 0 22px rgba(255,183,213,0.7); animation: floatUp linear infinite; will-change:transform, opacity; } @keyframes floatUp { 0% { transform:translateY(0) translateX(0) scale(0); opacity:0; } 4% { opacity:1; transform:scale(1); } 100% { transform:translateY(-118vh) translateX(var(--x)) scale(0.3) rotate(180deg); opacity:0; } }.sparkle { position:absolute; color:#ffedc8; font-size:16px; text-shadow: 0 0 8px #ffd6a0, 0 0 16px #ff8fc1, 0 0 28px rgba(255,183,213,0.9); animation: twinkle ease-in-out infinite; will-change:transform, opacity; } @keyframes twinkle { 0%,100% { opacity:0.15; transform:scale(0.5) rotate(0deg); filter:brightness(0.8); } 20% { opacity:1; transform:scale(1.4) rotate(90deg); filter:brightness(1.4); } 45% { opacity:0.7; transform:scale(0.9) rotate(180deg); } 70% { opacity:1; transform:scale(1.2) rotate(270deg); filter:brightness(1.3); } }.heart { position:absolute; bottom:-30px; color:#ffb7d5; font-weight:bold; text-shadow: 0 0 10px #ff5fa2, 0 0 20px #ffd6a0, 0 0 30px rgba(255,143,193,0.8); animation: heartFloat linear infinite; will-change:transform, opacity; } @keyframes heartFloat { 0% { transform:translateY(0) translateX(0) scale(0) rotate(-15deg); opacity:0; } 8% { opacity:0.95; transform:scale(1.1) rotate(5deg); } 100% { transform:translateY(-115vh) translateX(var(--hx)) scale(0.4) rotate(25deg); opacity:0; } }.title { position:absolute; bottom:6.5vh; left:50%; transform:translateX(-50%); width:92%; text-align:center; z-index:40; animation:titleReveal 15s ease-in-out infinite; pointer-events:none; } @keyframes titleReveal { 0%,5% { opacity:0; transform:translateX(-50%) translateY(30px); filter:blur(10px); } 11%,80% { opacity:1; transform:translateX(-50%) translateY(0); filter:blur(0); } 90%,100% { opacity:0; transform:translateX(-50%) translateY(-20px); filter:blur(8px); } }.title span { font-family: Georgia, "Times New Roman", "Cormorant Garamond", serif; font-size: clamp(26px, 6.8vw, 38px); font-weight:700; letter-spacing:0.22em; background: linear-gradient(180deg, #fffffb 0%, #fff5e0 12%, #ffe3b3 28%, #ffd6a0 45%, #e9b26e 62%, #d99a5a 78%, #ffb7d5 92%, #ffc9e3 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; position:relative; display:inline-block; padding:0 6px; filter: drop-shadow(0 1px 0 #7d4e26) drop-shadow(0 3px 6px rgba(0,0,0,0.85)) drop-shadow(0 0 18px rgba(255,214,160,0.75)) drop-shadow(0 0 36px rgba(255,183,213,0.5)); }.title span::after { content:''; position:absolute; bottom:-8px; left:10%; right:10%; height:2px; background: linear-gradient(90deg, transparent, #ffd6a0, #ffb7d5, transparent); filter:blur(1px); opacity:0.8; }.vignette { position:absolute; inset:0; background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 90%, rgba(0,0,0,0.9) 100%); pointer-events:none; z-index:50; }`}</style>
      <div className="stage">
        <div className="rays"></div>
        <div className="aura"></div>
        <div className="castle-scene">
          <div className="castle-wrap">
            <div dangerouslySetInnerHTML={{ __html: castleSvg }} />
            <div className="castle-glow"></div>
          </div>
        </div>
        <div className="mist"></div>
        <div className="particles" id="particles"></div>
        <div className="sparkles" id="sparkles"></div>
        <div className="hearts" id="hearts"></div>
        <div className="title"><span>PRINCESS CASTLE</span></div>
        <div className="vignette"></div>
      </div>
    </>
  );
}
