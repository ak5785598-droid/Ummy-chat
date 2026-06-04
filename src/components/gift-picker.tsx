'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, X, Plus, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch, query, orderBy, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { useCachedMedia } from '@/hooks/use-cached-media';
import { useToast } from '@/hooks/use-toast';

// --- GOLDEN DOLLAR ICON COMPONENT ---
const GoldenDollar = () => (
  <div className="relative flex items-center justify-center">
    <div className="h-4 w-4 rounded-full bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 shadow-[0_0_8px_rgba(234,179,8,0.6)] border border-yellow-300/50 flex items-center justify-center">
      <span className="text-[9px] font-black text-black drop-shadow-sm">$</span>
    </div>
  </div>
);

// GIFT IMAGE COMPONENT - SIZE BADA AUR ROUNDED CORNERS
const GiftImage = ({ gift }: { gift: any }) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const cachedUrl = useCachedMedia(gift.imageUrl);

  useEffect(() => {
    if (!cachedUrl) {
      setProcessedUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cachedUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx || canvas.width <= 0 || canvas.height <= 0 || isNaN(canvas.width) || isNaN(canvas.height)) {
        setProcessedUrl(null);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const BLACK_THRESHOLD = 45;
      const BLACK_PIXEL_RATIO = 0.95;

      // Check top edge
      let topBlackCount = 0;
      for (let x = 0; x < width; x++) {
        const index = x * 4;
        const r = data[index];
        const gVal = data[index + 1];
        const b = data[index + 2];
        if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) {
          topBlackCount++;
        }
      }
      const isTopBlack = topBlackCount / width >= BLACK_PIXEL_RATIO;

      // Check bottom edge
      let bottomBlackCount = 0;
      for (let x = 0; x < width; x++) {
        const index = ((height - 1) * width + x) * 4;
        const r = data[index];
        const gVal = data[index + 1];
        const b = data[index + 2];
        if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) {
          bottomBlackCount++;
        }
      }
      const isBottomBlack = bottomBlackCount / width >= BLACK_PIXEL_RATIO;

      // Check left edge
      let leftBlackCount = 0;
      for (let y = 0; y < height; y++) {
        const index = (y * width) * 4;
        const r = data[index];
        const gVal = data[index + 1];
        const b = data[index + 2];
        if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) {
          leftBlackCount++;
        }
      }
      const isLeftBlack = leftBlackCount / height >= BLACK_PIXEL_RATIO;

      // Check right edge
      let rightBlackCount = 0;
      for (let y = 0; y < height; y++) {
        const index = (y * width + (width - 1)) * 4;
        const r = data[index];
        const gVal = data[index + 1];
        const b = data[index + 2];
        if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) {
          rightBlackCount++;
        }
      }
      const isRightBlack = rightBlackCount / height >= BLACK_PIXEL_RATIO;

      const hasBlackBorders = isTopBlack || isBottomBlack || isLeftBlack || isRightBlack;

      if (hasBlackBorders) {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const gVal = data[i + 1];
          const b = data[i + 2];
          if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) {
            data[i + 3] = 0; // set alpha to 0
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setProcessedUrl(canvas.toDataURL('image/png'));
      } else {
        setProcessedUrl(null);
      }
    };

    img.onerror = () => {
      setProcessedUrl(null);
    };
  }, [cachedUrl]);

  // If no imageUrl, try icon name
  if (!gift.imageUrl) {
    return <span className="text-4xl">🎁</span>;
  }

  return (
    <img 
      src={processedUrl || cachedUrl} 
      alt={gift.name} 
      className="h-20 w-20 rounded-xl object-contain" 
    />
  );
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
 const { toast } = useToast();

 const [selectedGift, setSelectedGift] = useState<any>(null);
 const [quantity, setQuantity] = useState('1');
 const [isSending, setIsSending] = useState(false);
 const [selectedUids, setSelectedUids] = useState<string[]>([]);
 const [winData, setWinData] = useState<{ show: boolean, multiplier: number } | null>(null);
 const [showCustomLink, setShowCustomLink] = useState(false);
 const [isProcessingCustom, setIsProcessingCustom] = useState(false);
 const [showRulesSheet, setShowRulesSheet] = useState(false);
 
 // Track karne ke liye ki initial selection ho chuka hai ya nahi
 const hasInitialized = useRef(false);
 // Track karne ke liye ki recipient manually change hua hai
 const lastRecipientUid = useRef<string | null>(null);

 const giftsQuery = useMemoFirebase(() => {
   if (!firestore) return null;
   return query(collection(firestore, "giftList"), orderBy("createdAt", "desc"));
 }, [firestore]);

 const { data: dbGifts, isLoading: isGiftsLoading } = useCollection(giftsQuery);

 // ALL GIFTS COME FROM DB ONLY — NO FALLBACK
 const GIFTS = useMemo(() => {
   const groups: Record<string, any[]> = {
     'Hot': [],
     'Lucky': [],
     'Luxury': [],
     'Event': [],
     'Customized': []
   };

   if (dbGifts && dbGifts.length > 0) {
     dbGifts.forEach((g: any) => {
       const cat = g.category || 'Hot';
       if (groups[cat]) {
         groups[cat].push({
           ...g,
           id: g.id || g.giftId
         });
       } else {
         if (!groups['Event']) groups['Event'] = [];
         groups['Event'].push({ ...g, id: g.id || g.giftId });
       }
     });
   }

   // Sort: non-image gifts pehle (toh image wale baad me dikhe)
   Object.keys(groups).forEach(key => {
     groups[key].sort((a, b) => {
       const aHasImage = !!a.imageUrl;
       const bHasImage = !!b.imageUrl;
       if (!aHasImage && bHasImage) return -1;
       if (aHasImage && !bHasImage) return 1;
       return 0;
     });
   });

   return groups;
 }, [dbGifts]);

  const seatedParticipants = useMemo(() => {
    // 1. Get all seated participants and sort by seatIndex
    const seated = participants.filter((p: any) => p.seatIndex > 0).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
    
    // 2. Get all audience participants (seatIndex is 0 or undefined)
    const audience = participants.filter((p: any) => !p.seatIndex || p.seatIndex === 0);
    
    // 3. Combine them: Seated speakers first, then audience members!
    const list = [...seated, ...audience];
    
    // 4. Safety check: If there is an initialRecipient who is somehow not in the list, append them
    if (initialRecipient && !list.some((p: any) => p.uid === initialRecipient.uid)) {
      const fullRecipient = participants.find((p: any) => p.uid === initialRecipient.uid) || initialRecipient;
      list.push(fullRecipient);
    }
    return list;
  }, [participants, initialRecipient]);

 // FIXED: Sirf tabhi auto-select karega jab initialRecipient change ho ya pehli baar open ho
 useEffect(() => {
  if (!open) {
    // Sheet band hone par reset
    hasInitialized.current = false;
    lastRecipientUid.current = null;
    setShowCustomLink(false);
    return;
  }

  // Agar initialRecipient hai aur woh change hua hai
  if (initialRecipient) {
    const currentUid = initialRecipient.uid;
    if (lastRecipientUid.current !== currentUid) {
      setSelectedUids([currentUid]);
      lastRecipientUid.current = currentUid;
      hasInitialized.current = true;
    }
  } 
  // Agar initialRecipient nahi hai aur pehli baar open ho raha hai
  else if (!hasInitialized.current && seatedParticipants.length > 0) {
    setSelectedUids([seatedParticipants[0].uid]);
    hasInitialized.current = true;
  }
 }, [open, initialRecipient?.uid, seatedParticipants]);

 // Mobile back button dabane pe custom link band ho jayega
 useEffect(() => {
   const handlePopState = () => {
     if (showCustomLink) {
       setShowCustomLink(false);
     }
   };
   
   window.addEventListener('popstate', handlePopState);
   return () => window.removeEventListener('popstate', handlePopState);
 }, [showCustomLink]);

 // Yeh function ab + icon pe click karne se rules sheet open karega
 const handleCustomGiftClick = () => {
   setShowRulesSheet(true);
 };

 // Yeh function confirm & pay button se call hoga
 const handleConfirmAndPay = async () => {
    if (!user || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < 50000) return;
    if (isProcessingCustom) return;
    
    setIsProcessingCustom(true);
    setShowRulesSheet(false); // Rules sheet band karo
    
    try {
      const batch = writeBatch(firestore);
      const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const senderUserRef = doc(firestore, 'users', user.uid);
      
      batch.update(senderProfileRef, {
        'wallet.coins': increment(-50000),
        updatedAt: serverTimestamp()
      });
      batch.update(senderUserRef, {
        'wallet.coins': increment(-50000)
      });
      
      // Create request document inside /customizedGiftRequests collection
      const requestRef = doc(collection(firestore, 'customizedGiftRequests'));
      batch.set(requestRef, {
        id: requestRef.id,
        uid: user.uid,
        username: userProfile.username || 'Tribe Member',
        accountNumber: userProfile.accountNumber || '',
        avatarUrl: userProfile.avatarUrl || '',
        coinsPaid: 50000,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      
      // Open the link in a new window/tab
      window.open(
        'https://ajpep8qoykzh.jp.larksuite.com/share/base/form/shrjp2Z1VRCOBZBHRrYsBj2voGh',
        '_blank'
      );
      
      // Show the custom link overlay
      setShowCustomLink(true);

      toast({
        title: 'Customized Gift Requested',
        description: '50,000 coins deducted. Please fill out the form to upload your files!'
      });
      
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: 'Could not process custom gift request. Please try again!'
      });
    } finally {
      setIsProcessingCustom(false);
    }
  };

 const handleSend = async () => {
  if (!user || !firestore || !selectedGift || !userProfile || selectedUids.length === 0) return;

  const qty = parseInt(quantity);
  const totalCost = selectedGift.price * qty * selectedUids.length;
  
  if ((userProfile.wallet?.coins || 0) < totalCost) return;
  if (isSending) return;
  setIsSending(true);

  try {
   const batch = writeBatch(firestore);
   const today = getTodayString();
   let winAmount = 0;
   let selectedMult = 1;

    if (selectedGift.isLucky) {
       const rand = crypto.getRandomValues(new Uint8Array(1))[0] / 256;
       if (rand < 0.7) selectedMult = 1;
       else if (rand < 0.85) selectedMult = 2;
       else if (rand < 0.93) selectedMult = 5;
       else if (rand < 0.97) selectedMult = 10;
       else selectedMult = MULTIPLIERS[crypto.getRandomValues(new Uint32Array(1))[0] % MULTIPLIERS.length];
      
      if (selectedMult > 1) {
         winAmount = (selectedGift.price * qty) * selectedMult;
      }
   }

   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);
   const isSenderNewDay = (userProfile.wallet as any)?.lastDailyResetDate !== today;
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
      batch.update(recProfileRef, { 
        'wallet.diamonds': increment(diamondPerRecipient),
        'stats.dailyGiftsReceived': increment(diamondPerRecipient)
      });
    });

    // Record contribution in topSupporters subcollection with lazy reset logic
    const supporterRef = doc(firestore, 'chatRooms', roomId, 'topSupporters', user.uid);
    let dailyAmountVal: any = increment(totalCost);
    let weeklyAmountVal: any = increment(totalCost);

    try {
      const supporterSnap = await getDoc(supporterRef);
      if (supporterSnap.exists()) {
        const supData = supporterSnap.data();
        const lastUpdate = supData.updatedAt?.toDate() || new Date(0);
        const now = new Date();
        const isSameDay = lastUpdate.toDateString() === now.toDateString();

        // Weekly check: same year and same ISO week number
        const getWeekNumber = (d: Date) => {
          const date = new Date(d.getTime());
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
          const week1 = new Date(date.getFullYear(), 0, 4);
          return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        };
        const isSameWeek = lastUpdate.getFullYear() === now.getFullYear() && getWeekNumber(lastUpdate) === getWeekNumber(now);

        dailyAmountVal = isSameDay ? increment(totalCost) : totalCost;
        weeklyAmountVal = isSameWeek ? increment(totalCost) : totalCost;
      }
    } catch (e) {
      console.warn("Supporter lazy reset check failed:", e);
    }

    batch.set(supporterRef, {
      uid: user.uid,
      username: userProfile.username || 'Tribe Member',
      avatarUrl: userProfile.avatarUrl || null,
      amount: increment(totalCost),
      dailyAmount: dailyAmountVal,
      weeklyAmount: weeklyAmountVal,
      updatedAt: serverTimestamp()
    }, { merge: true });

   const roomRef = doc(firestore, 'chatRooms', roomId);
   batch.update(roomRef, {
     'stats.totalGifts': increment(totalCost),
     'stats.dailyGifts': increment(totalCost),
     'rocket.progress': increment(totalCost)
   });

   // Real-Time Gift Battle Scoring integration (100% Free)
    try {
      const battleRef = doc(firestore, 'chatRooms', roomId, 'features', 'giftBattle');
      const battleSnap = await getDoc(battleRef);
      if (battleSnap.exists()) {
        const battleData = battleSnap.data();
        if (battleData.isActive) {
          let scoreLeftInc = 0;
          let scoreRightInc = 0;
          
          if (battleData.leftUser?.uid && selectedUids.includes(battleData.leftUser.uid)) {
            scoreLeftInc += totalCost;
          }
          if (battleData.rightUser?.uid && selectedUids.includes(battleData.rightUser.uid)) {
            scoreRightInc += totalCost;
          }

          if (scoreLeftInc > 0 || scoreRightInc > 0) {
            const updates: Record<string, any> = {};
            if (scoreLeftInc > 0) updates.scoreLeft = increment(scoreLeftInc);
            if (scoreRightInc > 0) updates.scoreRight = increment(scoreRightInc);

            // Trigger temporary takeover effect for 5 seconds on huge gifts (>= 500 coins)
            if (totalCost >= 500) {
              updates.takeoverEffect = scoreLeftInc >= scoreRightInc ? 'gold' : 'cosmic';
            }

            batch.update(battleRef, updates);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to update Gift Battle scores:", err);
    }

   const firstRecipientUid = selectedUids[0];
   const recipientObj = participants.find((p: any) => p.uid === firstRecipientUid);
   const recipientSeat = recipientObj?.seatIndex || 1;
   const recipientName = recipientObj?.name || 'Someone';

    const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
     batch.set(msgRef, {
       type: 'gift',
       senderId: user.uid,
       senderName: userProfile.username,
       giftId: selectedGift.id,
       giftName: selectedGift.name,
       giftValue: totalCost,
       animationId: selectedGift.animationId,
       imageUrl: selectedGift.imageUrl || null,
       animationUrl: selectedGift.animationUrl || null,
       videoUrl: selectedGift.videoUrl || null,
       soundUrl: selectedGift.soundUrl || null,
       tier: selectedGift.tier || 'normal',
       recipientId: firstRecipientUid,
       receiverName: recipientName,
       recipientSeat: recipientSeat,
       text: `sent ${selectedGift.name} x${qty} to ${recipientName}`,
       timestamp: serverTimestamp()
     });

   await batch.commit();

   if (winAmount > 0) {
      setWinData({ show: true, multiplier: selectedMult });
      setTimeout(() => setWinData(null), 4000);
   }

   if (!selectedGift.isLucky) onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   <AnimatePresence>
     {winData?.show && (
       <motion.div 
         initial={{ x: -300, opacity: 0, rotateY: -30 }}
         animate={{ x: 20, opacity: 1, rotateY: 0 }}
         exit={{ x: -500, opacity: 0 }}
         className="fixed top-1/3 left-0 z-[1000] pointer-events-none"
       >
         <div className="relative w-60 h-36 bg-gradient-to-br from-blue-500 to-blue-800 rounded-r- border- border-white shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.3)] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-[-10deg] -translate-y-10" />
            <motion.span 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
              style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}
            >
              WIN x{winData.multiplier}
            </motion.span>
            <div className="mt-1 px-3 py-0.5 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
               <span className="text-white font-bold text- uppercase tracking-widest">Lucky Reward</span>
            </div>
         </div>
       </motion.div>
     )}
   </AnimatePresence>

   <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t- overflow-hidden text-white shadow-2xl pb-10 [&>button]:hidden">
     <div className="p-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-10 w-10 rounded-full border-2 text- font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-10 w-10 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

     <Tabs defaultValue="Hot" className="w-full mt-2">
      <TabsList className="mx-4 bg-transparent p-1 flex justify-between gap-1">
       {['Hot', 'Lucky', 'Luxury', 'Event', 'Customized'].map(id => (
        <TabsTrigger 
          key={id} 
          value={id} 
          className="text-white/60 text-sm font-bold px-3 py-1.5 rounded-none transition-all data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 bg-transparent border-b-2 border-transparent hover:text-white/80"
        >
          {id}
        </TabsTrigger>
       ))}
      </TabsList>
      
       <div className="h-[340px] overflow-y-auto no-scrollbar px-4 pt-4 pb-20 grid grid-cols-4 gap-x-3 gap-y-5 content-start">
        {isGiftsLoading ? (
          <div className="col-span-4 flex flex-col items-center justify-center py-10 gap-2">
            <Loader className="animate-spin text-cyan-400 h-6 w-6" />
            <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">Loading Gifts...</span>
          </div>
        ) : (
          Object.entries(GIFTS).map(([cat, items]) => (
            <TabsContent key={cat} value={cat} className="contents">
            {items.length === 0 ? (
               <div className="col-span-4 py-10 text-center opacity-30 text- font-bold uppercase tracking-widest">No Gifts in {cat}</div>
            ) : (
              items.map(gift => (
                <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center transition-all duration-300 relative py-2 rounded-xl", selectedGift?.id === gift.id ? "brightness-125 bg-white/10 scale-105" : "opacity-70 hover:opacity-100")}>
                <div className="h-20 w-20 flex items-center justify-center mb-2 filter drop-shadow-lg">
                  <GiftImage gift={gift} />
                </div>
                <span className="text-[12px] font-bold text-white/90 truncate w-full text-center">{gift.name}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <GoldenDollar /> 
                  <span className="text-[11px] text-yellow-500 font-black leading-none">{gift.price}</span>
                </div>
                {selectedGift?.id === gift.id && <div className="absolute -bottom-1 h-1.5 w-6 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
                </button>
              ))
            )}
            </TabsContent>
          ))
        )}
        
        {/* Customized Tab Content */}
        <TabsContent value="Customized" className="contents">
          {/* Render all approved customized gifts from the database */}
          {GIFTS['Customized']?.map(gift => (
            <button 
              key={gift.id} 
              onClick={() => setSelectedGift(gift)} 
              className={cn(
                "flex flex-col items-center transition-all duration-300 relative py-2 rounded-xl", 
                selectedGift?.id === gift.id ? "brightness-125 bg-white/10 scale-105" : "opacity-70 hover:opacity-100"
              )}
            >
              <div className="h-20 w-20 flex items-center justify-center mb-2 filter drop-shadow-lg">
                <GiftImage gift={gift} />
              </div>
              <span className="text-[12px] font-bold text-white/90 truncate w-full text-center">{gift.name}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <GoldenDollar /> 
                <span className="text-[11px] text-yellow-500 font-black leading-none">{gift.price}</span>
              </div>
              {selectedGift?.id === gift.id && <div className="absolute -bottom-1 h-1.5 w-6 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
            </button>
          ))}

          {/* Submission button card - 1st Row, 1st Column (col-span-1) */}
          <div className="col-span-1 flex justify-start">
            <button 
              onClick={handleCustomGiftClick}
              disabled={isProcessingCustom || (userProfile?.wallet?.coins || 0) < 50000}
              className="flex flex-col items-center justify-center gap-2 p-3 w-full h-[110px] rounded-2xl border border-dashed border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed select-none text-left"
            >
              <Plus className="h-6 w-6 text-blue-400 shrink-0" />
              <div className="text-center space-y-0.5">
                <span className="text-[11px] font-black text-blue-400 block uppercase tracking-wider">
                  Request Custom Gift
                </span>
                <span className="text-[9px] text-blue-300/80 block font-semibold">
                  50,000 Coins / 7 Days
                </span>
              </div>
            </button>
          </div>
        </TabsContent>
       </div>
     </Tabs>

     <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-[#0b0e14] flex items-center justify-between border-t border-white/10 shadow-2xl gap-3">
      <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-2.5 min-w-0 flex-1">
       <div className="shrink-0"><GoldenDollar /></div>
       <span className="text-sm font-black text-yellow-500 truncate" title={(userProfile?.wallet?.coins || 0).toLocaleString()}>
         {(userProfile?.wallet?.coins || 0).toLocaleString()}
       </span>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-[70px] h-11 bg-white/10 border border-white/20 rounded-2xl text-white font-bold focus:ring-0 shrink-0 [&>span]:text-white">
           <SelectValue placeholder="1" />
         </SelectTrigger>
         <SelectContent className="bg-[#151921] border-white/10 text-white font-bold min-w-[70px]">
           {['1','10','99','520','1314'].map(q => (
             <SelectItem key={q} value={q} className="text-white font-bold focus:bg-cyan-500/20 focus:text-cyan-400 cursor-pointer">
               {q}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
       <button onClick={() => handleSend()} disabled={!selectedGift || isSending || selectedUids.length === 0} className="h-11 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-sm shadow-lg active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest border-b-4 border-black/20 shrink-0">
         {isSending ? <Loader className="h-5 w-5 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </SheetContent>
   </Sheet>

   {/* ============ RULES BOTTOM SHEET ============ */}
   <Sheet open={showRulesSheet} onOpenChange={setShowRulesSheet}>
     <SheetContent 
       side="bottom" 
       className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-2xl overflow-hidden text-white shadow-2xl max-h-[70vh] [&>button]:hidden"
     >
       {/* Header with Back Arrow and Title */}
       <div className="flex items-center gap-3 p-4 border-b border-white/10 sticky top-0 bg-[#0b0e14] z-10">
         <button 
           onClick={() => setShowRulesSheet(false)}
           className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all shrink-0"
         >
           <ArrowLeft className="h-5 w-5 text-white" />
         </button>
         <span className="text-lg font-bold text-white">Rules</span>
       </div>

       {/* Scrollable Rules Content */}
       <div className="overflow-y-auto p-5 space-y-6 text-white/90" style={{ maxHeight: 'calc(70vh - 70px - 80px)' }}>
         <div className="space-y-4">
           <div className="flex gap-3">
             <span className="text-cyan-400 font-black text-lg shrink-0">1.</span>
             <p className="text-sm font-medium leading-relaxed">Upload Your Imagination into Real World</p>
           </div>
           
           <div className="flex gap-3">
             <span className="text-cyan-400 font-black text-lg shrink-0">2.</span>
             <p className="text-sm font-medium leading-relaxed">Upload Image for Display Gifts, Also Video for Animation</p>
           </div>
           
           <div className="flex gap-3">
             <span className="text-cyan-400 font-black text-lg shrink-0">3.</span>
             <p className="text-sm font-medium leading-relaxed">Click on the Confirm & Pay and Then Upload Your Gifts</p>
           </div>
           
           <div className="flex gap-3">
             <span className="text-cyan-400 font-black text-lg shrink-0">4.</span>
             <p className="text-sm font-medium leading-relaxed">Make Sure Don't Exit the Gift Uploading Page. You Can Only Exit When Your Uploading is Complete and Click on the Submit Button for Submission</p>
           </div>
           
           <div className="flex gap-3">
             <span className="text-cyan-400 font-black text-lg shrink-0">5.</span>
             <p className="text-sm font-medium leading-relaxed">Display Time 7 Days. In Case if Rejected, Your Coins Will Be Returned to Your Coins Wallet Within 24 to 48 Hrs (Also Official Preview Time is 24 to 48 Hrs)</p>
           </div>
         </div>
       </div>

       {/* Confirm & Pay Button at Bottom */}
       <div className="p-4 border-t border-white/10 bg-[#0b0e14] sticky bottom-0">
         <button 
           onClick={handleConfirmAndPay}
           disabled={isProcessingCustom || (userProfile?.wallet?.coins || 0) < 50000}
           className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-sm shadow-lg active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest border-b-4 border-black/20 flex items-center justify-center gap-2"
         >
           {isProcessingCustom ? (
             <Loader className="h-5 w-5 animate-spin" />
           ) : (
             <>
               Confirm & Pay
               <div className="flex items-center gap-1">
                 <GoldenDollar />
                 <span className="text-yellow-200">50,000</span>
               </div>
             </>
           )}
         </button>
       </div>
     </SheetContent>
   </Sheet>

   {/* Custom Gift Link Overlay */}
   <AnimatePresence>
     {showCustomLink && (
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-[2000] bg-black/95 flex flex-col"
       >
         <div className="flex items-center justify-between p-4 border-b border-white/10">
           <span className="text-white font-bold text-lg">Customize Your Gift</span>
           <button 
             onClick={() => setShowCustomLink(false)}
             className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
           >
             <X className="h-5 w-5 text-white" />
           </button>
         </div>
         <div className="flex-1">
           <iframe 
             src="https://ajpep8qoykzh.jp.larksuite.com/share/base/form/shrjp2Z1VRCOBZBHRrYsBj2voGh"
             className="w-full h-full border-0"
             title="Custom Gift Form"
           />
         </div>
       </motion.div>
     )}
   </AnimatePresence>
  </>
 );
 }
