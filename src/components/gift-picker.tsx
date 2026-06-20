'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, X, Plus, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch, query, orderBy, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
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

// GIFT IMAGE COMPONENT
const GiftImage = ({ gift }: { gift: any }) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const cachedUrl = useCachedMedia(gift.imageUrl);

  useEffect(() => {
    if (!cachedUrl) { setProcessedUrl(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cachedUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx || canvas.width <= 0 || canvas.height <= 0 || isNaN(canvas.width) || isNaN(canvas.height)) { setProcessedUrl(null); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      const BLACK_THRESHOLD = 45;
      const BLACK_PIXEL_RATIO = 0.95;
      let topBlackCount = 0;
      for (let x = 0; x < width; x++) { const index = x * 4; const r = data[index]; const gVal = data[index + 1]; const b = data[index + 2]; if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) topBlackCount++; }
      const isTopBlack = topBlackCount / width >= BLACK_PIXEL_RATIO;
      let bottomBlackCount = 0;
      for (let x = 0; x < width; x++) { const index = ((height - 1) * width + x) * 4; const r = data[index]; const gVal = data[index + 1]; const b = data[index + 2]; if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) bottomBlackCount++; }
      const isBottomBlack = bottomBlackCount / width >= BLACK_PIXEL_RATIO;
      let leftBlackCount = 0;
      for (let y = 0; y < height; y++) { const index = (y * width) * 4; const r = data[index]; const gVal = data[index + 1]; const b = data[index + 2]; if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) leftBlackCount++; }
      const isLeftBlack = leftBlackCount / height >= BLACK_PIXEL_RATIO;
      let rightBlackCount = 0;
      for (let y = 0; y < height; y++) { const index = (y * width + (width - 1)) * 4; const r = data[index]; const gVal = data[index + 1]; const b = data[index + 2]; if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) rightBlackCount++; }
      const isRightBlack = rightBlackCount / height >= BLACK_PIXEL_RATIO;
      const hasBlackBorders = isTopBlack || isBottomBlack || isLeftBlack || isRightBlack;
      if (hasBlackBorders) { for (let i = 0; i < data.length; i += 4) { const r = data[i]; const gVal = data[i + 1]; const b = data[i + 2]; if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) { data[i + 3] = 0; } } ctx.putImageData(imageData, 0, 0); setProcessedUrl(canvas.toDataURL('image/png')); } else { setProcessedUrl(null); }
    };
    img.onerror = () => { setProcessedUrl(null); };
  }, [cachedUrl]);

  if (!gift.imageUrl) return <span className="text-4xl">🎁</span>;
  return <img src={processedUrl || cachedUrl} alt={gift.name} className="h-20 w-20 rounded-xl object-contain" />;
};

const QUANTITY_OPTIONS = ['1', '10', '99', '520', '1314'];

const getTodayString = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
  return istDate.toISOString().split('T')[0];
};

// ============ SMART REWARD LOGIC HELPER (CHANCES KAM) ============
const shouldGiveReward = (comboClickCount: number, giftPrice: number): boolean => {
  if (comboClickCount === 1) {
    return Math.random() < 0.10;
  }
  
  if (comboClickCount === 2) {
    return Math.random() < 0.08;
  }
  
  if (comboClickCount === 3 || comboClickCount === 4) {
    return false;
  }
  
  if (comboClickCount >= 5 && comboClickCount <= 10) {
    return Math.random() < 0.20;
  }
  
  if (comboClickCount > 10) {
    return Math.random() < 0.35;
  }
  
  if (giftPrice > 5000) {
    if (comboClickCount >= 3 && comboClickCount <= 6) {
      return Math.random() < 0.25;
    }
  }
  
  return Math.random() < 0.03;
};

// ============ COMBO PATTI (Non-Lucky: TOP RIGHT) ============
const ComboPatti = ({ 
  avatarUrl, 
  username,
  receiverName,
  giftImageUrl, 
  multiplier,
  isTopPosition = false,
}: { 
  avatarUrl: string;
  username: string;
  receiverName: string;
  giftImageUrl: string | null; 
  multiplier: number;
  isTopPosition?: boolean;
}) => {
  return (
    <motion.div
      initial={{ x: 500, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 500, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="fixed right-2 z-[1100] pointer-events-none"
      style={{ top: isTopPosition ? '12vh' : '62vh' }}
    >
      <div className="relative w-[320px] h-[48px] rounded-full bg-gradient-to-r from-[#FFF0A0] via-[#E6C14A] to-[#C99A2E] border border-[#B8860B]">
        <div className="absolute top-1 left-4 right-4 h-[1px] bg-white/40 rounded-full" />
        <div className="relative z-10 flex items-center gap-2 px-3 h-full">
          <div className="shrink-0">
            <Avatar className="h-7 w-7 border border-yellow-600/30">
              <AvatarImage src={avatarUrl} />
            </Avatar>
          </div>
          <div className="shrink-0 min-w-[35px] max-w-[45px]">
            <span className="text-[10px] font-black text-[#5C3D0E] truncate block leading-tight">{username}</span>
          </div>
          <div className="shrink-0 h-7 w-7 rounded-md bg-white/15 flex items-center justify-center overflow-hidden border border-yellow-400/20">
            {giftImageUrl ? <img src={giftImageUrl} alt="gift" className="h-5 w-5 object-contain" /> : <span className="text-sm">🎁</span>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[#5C3D0E] text-xs">→</span>
            <span className="text-[10px] font-black text-[#5C3D0E] truncate max-w-[50px] block leading-tight">{receiverName}</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-w-0">
            <motion.span 
              key={multiplier}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
              className="text-lg font-black text-[#3D2000] leading-none"
            >
              x{multiplier}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============ LUCKY PATTI (LEFT SIDE FULL PATTI) ============
const LuckyPatti = ({ 
  avatarUrl, 
  username,
  receiverName,
  giftImageUrl, 
  multiplier,
  totalWinAmount,
}: { 
  avatarUrl: string;
  username: string;
  receiverName: string;
  giftImageUrl: string | null; 
  multiplier: number;
  totalWinAmount: number;
}) => {
  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="fixed left-0 z-[1100] pointer-events-none"
      style={{ top: '65vh' }}
    >
      <div className="relative w-[240px] h-[48px] rounded-r-full bg-gradient-to-r from-[#FFF0A0] via-[#E6C14A] to-[#C99A2E] border border-[#B8860B] border-l-0 overflow-hidden shadow-lg">
        <div className="absolute top-1 left-4 right-4 h-[1px] bg-white/40 rounded-full" />
        <div className="relative z-10 flex items-center gap-1.5 px-2 h-full">
          <div className="shrink-0">
            <Avatar className="h-6 w-6 border border-yellow-600/30">
              <AvatarImage src={avatarUrl} />
            </Avatar>
          </div>
          <div className="shrink-0 min-w-[35px] max-w-[50px]">
            <span className="text-[9px] font-black text-[#5C3D0E] truncate block leading-tight">{username}</span>
          </div>
          <div className="shrink-0 h-6 w-6 rounded-md bg-white/15 flex items-center justify-center overflow-hidden border border-yellow-400/20">
            {giftImageUrl ? <img src={giftImageUrl} alt="gift" className="h-4 w-4 object-contain" /> : <span className="text-xs">🎁</span>}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-[#5C3D0E] text-[10px]">→</span>
            <span className="text-[9px] font-black text-[#5C3D0E] truncate max-w-[45px] block leading-tight">{receiverName}</span>
          </div>
          <div className="flex items-center justify-center min-w-[25px]">
            <motion.span 
              key={multiplier}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
              className="text-sm font-black text-[#3D2000] leading-none"
            >
              x{multiplier}
            </motion.span>
          </div>
          {totalWinAmount > 0 && (
            <div className="shrink-0 flex items-center gap-0.5 bg-[#3D2000]/15 rounded-full px-1.5 py-0.5">
              <GoldenDollar />
              <motion.span 
                key={totalWinAmount}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="text-[10px] font-black text-[#3D2000]"
              >
                +{totalWinAmount.toLocaleString()}
              </motion.span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
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
 const [showCustomLink, setShowCustomLink] = useState(false);
 const [isProcessingCustom, setIsProcessingCustom] = useState(false);
 const [showRulesSheet, setShowRulesSheet] = useState(false);
 const [showQuantityPopup, setShowQuantityPopup] = useState(false);
 
 const [comboState, setComboState] = useState<{
   show: boolean;
   multiplier: number;
   totalWinAmount: number;
   gift: any;
   isLucky: boolean;
   receiverName: string;
 } | null>(null);
 const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
 
 const accumulatedWinRef = useRef<number>(0);
 
 const [activeTab, setActiveTab] = useState('Hot');
 const [sheetOpen, setSheetOpen] = useState(false);
 
 const comboClicksRef = useRef<number>(0);
 const hasInitialized = useRef(false);
 const lastRecipientUid = useRef<string | null>(null);

 useEffect(() => { setSheetOpen(open); }, [open]);

 const giftsQuery = useMemoFirebase(() => {
   if (!firestore) return null;
   return query(collection(firestore, "giftList"), orderBy("createdAt", "desc"));
 }, [firestore]);

 const { data: dbGifts, isLoading: isGiftsLoading } = useCollection(giftsQuery);

 const GIFTS = useMemo(() => {
   const groups: Record<string, any[]> = { 'Hot': [], 'Lucky': [], 'Luxury': [], 'Event': [], 'Customized': [] };
   if (dbGifts && dbGifts.length > 0) {
     dbGifts.forEach((g: any) => {
       const cat = g.category || 'Hot';
       if (groups[cat]) groups[cat].push({ ...g, id: g.id || g.giftId });
       else { if (!groups['Event']) groups['Event'] = []; groups['Event'].push({ ...g, id: g.id || g.giftId }); }
     });
   }
   Object.keys(groups).forEach(key => { groups[key].sort((a, b) => { const aHasImage = !!a.imageUrl; const bHasImage = !!b.imageUrl; if (!aHasImage && bHasImage) return -1; if (aHasImage && !bHasImage) return 1; return 0; }); });
   return groups;
 }, [dbGifts]);

  const seatedParticipants = useMemo(() => {
    const seated = participants.filter((p: any) => p.seatIndex > 0).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
    const audience = participants.filter((p: any) => !p.seatIndex || p.seatIndex === 0);
    const list = [...seated, ...audience];
    if (initialRecipient && !list.some((p: any) => p.uid === initialRecipient.uid)) {
      const fullRecipient = participants.find((p: any) => p.uid === initialRecipient.uid) || initialRecipient;
      list.push(fullRecipient);
    }
    return list;
  }, [participants, initialRecipient]);

  const getReceiverName = useCallback(() => {
    if (selectedUids.length === 0) return 'Someone';
    if (selectedUids.length === seatedParticipants.length) return 'Everyone';
    const recipient = participants.find((p: any) => p.uid === selectedUids[0]);
    return recipient?.name || recipient?.username || 'Someone';
  }, [selectedUids, participants, seatedParticipants]);

 useEffect(() => {
  if (!sheetOpen) { hasInitialized.current = false; lastRecipientUid.current = null; setShowCustomLink(false); return; }
  if (initialRecipient) {
    const currentUid = initialRecipient.uid;
    if (lastRecipientUid.current !== currentUid) { setSelectedUids([currentUid]); lastRecipientUid.current = currentUid; hasInitialized.current = true; }
  } else if (!hasInitialized.current && seatedParticipants.length > 0) { setSelectedUids([seatedParticipants[0].uid]); hasInitialized.current = true; }
 }, [sheetOpen, initialRecipient?.uid, seatedParticipants]);

 useEffect(() => {
   const handlePopState = () => { if (showCustomLink) setShowCustomLink(false); };
   window.addEventListener('popstate', handlePopState);
   return () => window.removeEventListener('popstate', handlePopState);
 }, [showCustomLink]);

 useEffect(() => { return () => { if (comboTimerRef.current) clearTimeout(comboTimerRef.current); }; }, []);

 const handleCustomGiftClick = () => setShowRulesSheet(true);

 const handleConfirmAndPay = async () => {
    if (!user || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < 50000) return;
    if (isProcessingCustom) return;
    setIsProcessingCustom(true); setShowRulesSheet(false);
    try {
      const batch = writeBatch(firestore);
      const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const senderUserRef = doc(firestore, 'users', user.uid);
      batch.update(senderProfileRef, { 'wallet.coins': increment(-50000), updatedAt: serverTimestamp() });
      batch.update(senderUserRef, { 'wallet.coins': increment(-50000) });
      const requestRef = doc(collection(firestore, 'customizedGiftRequests'));
      batch.set(requestRef, { id: requestRef.id, uid: user.uid, username: userProfile.username || 'Tribe Member', accountNumber: userProfile.accountNumber || '', avatarUrl: userProfile.avatarUrl || '', coinsPaid: 50000, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await batch.commit();
      window.open('https://ajpep8qoykzh.jp.larksuite.com/share/base/form/shrjp2Z1VRCOBZBHRrYsBj2voGh', '_blank');
      setShowCustomLink(true);
      toast({ title: 'Customized Gift Requested', description: '50,000 coins deducted. Please fill out the form to upload your files!' });
    } catch (e) { console.error(e); toast({ variant: 'destructive', title: 'Request Failed', description: 'Could not process custom gift request. Please try again!' }); }
    finally { setIsProcessingCustom(false); }
  };

  // ============ CORE SEND LOGIC (Math.random FIX) ============
  const executeSend = useCallback(async (gift: any, qty: number, uids: string[], comboMultiplier: number = 1) => {
    const validUids = (uids || []).filter(uid => typeof uid === 'string' && uid.trim() !== '');
    if (!user || !firestore || !userProfile || validUids.length === 0) return null;
    const totalCost = gift.price * qty * validUids.length;
    if ((userProfile.wallet?.coins || 0) < totalCost) return null;
    try {
      const batch = writeBatch(firestore);
      const today = getTodayString();
      let winAmount = 0;
      let selectedMult = comboMultiplier;
      const isLuckyGift = gift.category === 'Lucky';
      
      if (isLuckyGift) {
        const shouldReward = shouldGiveReward(comboMultiplier, gift.price);
        
        if (shouldReward) {
          if (comboMultiplier <= 1) {
            // ✅ Math.random() - Vercel SSR safe
            const rand = Math.random();
            if (rand < 0.60) selectedMult = 1;
            else if (rand < 0.85) selectedMult = 2;
            else if (rand < 0.95) selectedMult = 3;
            else selectedMult = 5;
          }
          
          if (selectedMult >= 1) {
            const rawWin = gift.price * qty * selectedMult;
            winAmount = Math.min(rawWin, totalCost * 2);
          }
        }
      }

      const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const senderUserRef = doc(firestore, 'users', user.uid);
      const isSenderNewDay = (userProfile.wallet as any)?.lastDailyResetDate !== today;
      const coinAdjustment = winAmount - totalCost;
      const expAdjustment = Math.floor(totalCost / 5);
      
      batch.update(senderProfileRef, { 
        'wallet.coins': increment(coinAdjustment), 'wallet.totalSpent': increment(totalCost),
        'wallet.totalExp': increment(expAdjustment), 'wallet.dailySpent': isSenderNewDay ? totalCost : increment(totalCost),
        'wallet.lastDailyResetDate': today, updatedAt: serverTimestamp() 
      });
      batch.update(senderUserRef, { 
        'wallet.coins': increment(coinAdjustment), 'wallet.totalSpent': increment(totalCost),
        'wallet.totalExp': increment(expAdjustment), 'wallet.dailySpent': isSenderNewDay ? totalCost : increment(totalCost),
        'wallet.lastDailyResetDate': today
      });
      
      const diamondPerRecipient = Math.floor((gift.price * qty) * 0.4);
      validUids.forEach(uid => { const recProfileRef = doc(firestore, 'users', uid, 'profile', uid); batch.update(recProfileRef, { 'wallet.diamonds': increment(diamondPerRecipient), 'stats.dailyGiftsReceived': increment(diamondPerRecipient) }); });
      
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
          const getWeekNumber = (d: Date) => { const date = new Date(d.getTime()); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7); const week1 = new Date(date.getFullYear(), 0, 4); return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7); };
          const isSameWeek = lastUpdate.getFullYear() === now.getFullYear() && getWeekNumber(lastUpdate) === getWeekNumber(now);
          dailyAmountVal = isSameDay ? increment(totalCost) : totalCost;
          weeklyAmountVal = isSameWeek ? increment(totalCost) : totalCost;
        }
      } catch (e) { console.warn("Supporter lazy reset check failed:", e); }
      batch.set(supporterRef, { uid: user.uid, username: userProfile.username || 'Tribe Member', avatarUrl: userProfile.avatarUrl || null, amount: increment(totalCost), dailyAmount: dailyAmountVal, weeklyAmount: weeklyAmountVal, updatedAt: serverTimestamp() }, { merge: true });
      
      const roomRef = doc(firestore, 'chatRooms', roomId);
      batch.update(roomRef, { 'stats.totalGifts': increment(totalCost), 'stats.dailyGifts': increment(totalCost), 'rocket.progress': increment(totalCost) });
      
      try {
        const battleRef = doc(firestore, 'chatRooms', roomId, 'features', 'giftBattle');
        const battleSnap = await getDoc(battleRef);
        if (battleSnap.exists()) {
          const battleData = battleSnap.data();
          if (battleData.isActive) {
            let scoreLeftInc = 0, scoreRightInc = 0;
            if (battleData.leftUser?.uid && validUids.includes(battleData.leftUser.uid)) scoreLeftInc += totalCost;
            if (battleData.rightUser?.uid && validUids.includes(battleData.rightUser.uid)) scoreRightInc += totalCost;
            if (scoreLeftInc > 0 || scoreRightInc > 0) {
              const updates: Record<string, any> = {};
              if (scoreLeftInc > 0) updates.scoreLeft = increment(scoreLeftInc);
              if (scoreRightInc > 0) updates.scoreRight = increment(scoreRightInc);
              if (totalCost >= 500) updates.takeoverEffect = scoreLeftInc >= scoreRightInc ? 'gold' : 'cosmic';
              batch.update(battleRef, updates);
            }
          }
        }
      } catch (err) { console.warn("Failed to update Gift Battle scores:", err); }
      
      const firstRecipientUid = validUids[0];
      const recipientObj = participants.find((p: any) => p.uid === firstRecipientUid);
      const recipientSeat = recipientObj?.seatIndex || 1;
      const recipientName = recipientObj?.name || 'Someone';
      const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
      batch.set(msgRef, { type: 'gift', senderId: user.uid, senderName: userProfile.username, giftId: gift.id, giftName: gift.name, giftValue: totalCost, animationId: gift.animationId, imageUrl: gift.imageUrl || null, animationUrl: gift.animationUrl || null, videoUrl: gift.videoUrl || null, soundUrl: gift.soundUrl || null, tier: gift.tier || 'normal', recipientId: firstRecipientUid, receiverName: recipientName, recipientSeat: recipientSeat, text: `sent ${gift.name} x${qty} to ${recipientName}`, timestamp: serverTimestamp() });
      await batch.commit();
      return { winAmount, selectedMult, totalCost, isLuckyGift };
    } catch (e) { console.error("Send gift error:", e); throw e; }
  }, [user, firestore, userProfile, roomId, participants]);

  const startComboTimer = useCallback((gift: any, multiplier: number, totalWinAmount: number, isLucky: boolean, receiverName: string) => {
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    setComboState({ show: true, multiplier, totalWinAmount, gift, isLucky, receiverName });
    comboTimerRef.current = setTimeout(() => { 
      setComboState(null); 
      comboClicksRef.current = 0; 
      accumulatedWinRef.current = 0;
    }, 5000);
  }, []);

  const handleSend = async () => {
    if (!user || !firestore || !selectedGift || !userProfile || selectedUids.length === 0) return;
    if (isSending) return;
    setIsSending(true);
    try {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) { toast({ variant: 'destructive', title: 'Invalid Quantity' }); setIsSending(false); return; }
      const result = await executeSend(selectedGift, qty, selectedUids, 1);
      if (result) {
        setSheetOpen(false);
        onOpenChange(false);
        const rName = getReceiverName();
        comboClicksRef.current = 1;
        
        if (result.isLuckyGift && result.winAmount > 0) {
          accumulatedWinRef.current += result.winAmount;
        }
        
        startComboTimer(selectedGift, result.selectedMult, accumulatedWinRef.current, result.isLuckyGift, rName);
      }
    } catch (e) { console.error(e); toast({ variant: 'destructive', title: 'Send Failed' }); }
    finally { setIsSending(false); }
  };

  const handleComboPress = async () => {
    if (!comboState || isSending) return;
    comboClicksRef.current += 1;
    const newMultiplier = comboClicksRef.current;
    setIsSending(true);
    try {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) { toast({ variant: 'destructive', title: 'Invalid Quantity' }); setIsSending(false); return; }
      const result = await executeSend(comboState.gift, qty, selectedUids, newMultiplier);
      if (result) {
        const rName = getReceiverName();
        
        if (result.isLuckyGift && result.winAmount > 0) {
          accumulatedWinRef.current += result.winAmount;
        }
        
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        setComboState({ show: true, multiplier: newMultiplier, totalWinAmount: accumulatedWinRef.current, gift: comboState.gift, isLucky: result.isLuckyGift, receiverName: rName });
        comboTimerRef.current = setTimeout(() => { 
          setComboState(null); 
          comboClicksRef.current = 0; 
          accumulatedWinRef.current = 0;
        }, 5000);
      }
    } catch (e) { console.error(e); toast({ variant: 'destructive', title: 'Send Failed' }); }
    finally { setIsSending(false); }
  };

 return (
  <>
   <AnimatePresence mode="wait">
     {comboState?.show ? (
       comboState.isLucky ? (
         <LuckyPatti 
           key="lucky-combo"
           avatarUrl={userProfile?.avatarUrl || ''}
           username={userProfile?.username || 'User'}
           receiverName={comboState.receiverName}
           giftImageUrl={comboState.gift?.imageUrl || null}
           multiplier={comboState.multiplier}
           totalWinAmount={comboState.totalWinAmount}
         />
       ) : (
         <ComboPatti 
           key="normal-combo"
           avatarUrl={userProfile?.avatarUrl || ''}
           username={userProfile?.username || 'User'}
           receiverName={comboState.receiverName}
           giftImageUrl={comboState.gift?.imageUrl || null}
           multiplier={comboState.multiplier}
           isTopPosition={true}
         />
       )
     ) : null}
   </AnimatePresence>

   <AnimatePresence mode="wait">
     {comboState?.show ? (
       <motion.button key="combo-btn" initial={{ scale: 0, opacity: 0, rotate: -180 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0, rotate: 180 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
         onClick={handleComboPress} disabled={isSending}
         className="fixed right-6 bottom-32 z-[1000] h-20 w-20 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700 shadow-[0_0_40px_rgba(255,215,0,0.7)] border-[3px] border-yellow-200 flex items-center justify-center disabled:opacity-50 active:scale-90 transition-transform cursor-pointer">
         <motion.span key={`mult-${comboState.multiplier}`} initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 10 }} className="text-2xl font-black text-[#3D2000] drop-shadow-[0_2px_4px_rgba(255,240,160,0.8)]">x{comboState.multiplier}</motion.span>
         <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="absolute inset-0 rounded-full border-2 border-yellow-300/50" />
       </motion.button>
     ) : null}
   </AnimatePresence>

   <Sheet open={sheetOpen} onOpenChange={(val) => { setSheetOpen(val); if (!val) onOpenChange(false); }}>
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-2xl overflow-hidden text-white shadow-2xl pb-10 [&>button]:hidden">
     <AnimatePresence mode="wait">
       {showQuantityPopup && selectedGift && (
         <motion.div key="quantity-popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-end justify-center pb-24" onClick={() => setShowQuantityPopup(false)}>
           <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 w-[90%] max-w-sm shadow-2xl">
             <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white">Select Quantity</h3><button onClick={() => setShowQuantityPopup(false)} className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><X className="h-3.5 w-3.5 text-white/60" /></button></div>
             <div className="flex gap-2 justify-center">{QUANTITY_OPTIONS.map((q) => (<button key={q} onClick={() => { setQuantity(q); setShowQuantityPopup(false); }} className={cn("h-10 w-14 rounded-xl text-sm font-bold transition-all", quantity === q ? "bg-cyan-500/30 border border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80")}>x{q}</button>))}</div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>

     <div className="p-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-10 w-10 rounded-full border-2 font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length && seatedParticipants.length > 0 ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (<button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0"><Avatar className={cn("h-10 w-10 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>{selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}</button>))}
     </div>

     <Tabs defaultValue="Hot" className="w-full mt-2" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mx-4 bg-transparent p-1 flex justify-between gap-1">
       {['Hot', 'Lucky', 'Luxury', 'Event', 'Customized'].map(id => (<TabsTrigger key={id} value={id} className="text-white/60 text-sm font-bold px-3 py-1.5 rounded-none transition-all data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 bg-transparent border-b-2 border-transparent hover:text-white/80">{id}</TabsTrigger>))}
      </TabsList>
       <div className="h-[340px] overflow-y-auto no-scrollbar px-4 pt-2 pb-20 grid grid-cols-4 gap-x-3 gap-y-2 content-start">
        {isGiftsLoading ? (<div className="col-span-4 flex flex-col items-center justify-center py-10 gap-2"><Loader className="animate-spin text-cyan-400 h-6 w-6" /><span className="text-[11px] font-black text-white/20 uppercase tracking-widest">Loading Gifts...</span></div>) : (
          Object.entries(GIFTS).map(([cat, items]) => (
            <TabsContent key={cat} value={cat} className="contents">
              {cat === 'Customized' && (<button onClick={handleCustomGiftClick} disabled={isProcessingCustom || (userProfile?.wallet?.coins || 0) < 50000} className="flex flex-col items-center justify-center gap-2 p-3 w-full rounded-2xl border border-dashed border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed select-none text-left" style={{ gridColumn: 'span 1' }}><Plus className="h-6 w-6 text-blue-400 shrink-0" /><div className="text-center space-y-0.5"><span className="text-[11px] font-black text-blue-400 block uppercase tracking-wider">Request Custom Gift</span><span className="text-[9px] text-blue-300/80 block font-semibold">50,000 Coins / 7 Days</span></div></button>)}
              {items.length === 0 && cat !== 'Customized' ? (<div className="col-span-4 py-10 text-center opacity-30 font-bold uppercase tracking-widest">No Gifts in {cat}</div>) : (items.map(gift => (<button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center transition-all duration-300 relative py-1 rounded-xl", selectedGift?.id === gift.id ? "bg-white/10 scale-105" : "hover:bg-white/5")}><div className="h-20 w-20 flex items-center justify-center mb-1 filter drop-shadow-lg"><GiftImage gift={gift} /></div><span className="text-[12px] font-bold text-white/90 truncate w-full text-center">{gift.name}</span><div className="flex items-center gap-1.5 mt-0.5"><GoldenDollar /><span className="text-[11px] text-yellow-500 font-black leading-none">{gift.price.toLocaleString()}</span></div>{selectedGift?.id === gift.id && <div className="absolute -bottom-0.5 h-1.5 w-6 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}</button>)))}
            </TabsContent>
          ))
        )}
       </div>
     </Tabs>

     <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-[#0b0e14] flex items-center justify-between border-t border-white/10 shadow-2xl gap-3 z-20">
       <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-2.5 min-w-0 flex-shrink-0"><div className="shrink-0"><GoldenDollar /></div><span className="text-sm font-black text-yellow-500 truncate" title={(userProfile?.wallet?.coins || 0).toLocaleString()}>{(userProfile?.wallet?.coins || 0).toLocaleString()}</span></div>
       <AnimatePresence mode="wait">{selectedGift && (<motion.button key="qty-btn" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} onClick={() => setShowQuantityPopup(true)} className="h-11 px-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all shrink-0"><span className="text-sm font-bold text-white/80">x{quantity}</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></motion.button>)}</AnimatePresence>
       <button onClick={handleSend} disabled={!selectedGift || isSending || selectedUids.length === 0} className="h-11 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-sm shadow-lg active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest border-b-4 border-black/20 shrink-0">{isSending ? <Loader className="h-5 w-5 animate-spin" /> : 'SEND'}</button>
     </div>
    </SheetContent>
   </Sheet>

   <Sheet open={showRulesSheet} onOpenChange={setShowRulesSheet}>
     <SheetContent side="bottom" className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-2xl overflow-hidden text-white shadow-2xl max-h-[70vh] [&>button]:hidden">
       <div className="flex items-center gap-3 p-4 border-b border-white/10 sticky top-0 bg-[#0b0e14] z-10"><button onClick={() => setShowRulesSheet(false)} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all shrink-0"><ArrowLeft className="h-5 w-5 text-white" /></button><span className="text-lg font-bold text-white">Rules</span></div>
       <div className="overflow-y-auto p-5 space-y-6 text-white/90" style={{ maxHeight: 'calc(70vh - 70px - 80px)' }}><div className="space-y-4">{['Upload Your Imagination into Real World', 'Upload Image for Display Gifts, Also Video for Animation', 'Click on the Confirm & Pay and Then Upload Your Gifts', "Make Sure Don't Exit the Gift Uploading Page. You Can Only Exit When Your Uploading is Complete and Click on the Submit Button for Submission", 'Display Time 7 Days. In Case if Rejected, Your Coins Will Be Returned to Your Coins Wallet Within 24 to 48 Hrs (Also Official Preview Time is 24 to 48 Hrs)'].map((text, i) => (<div key={i} className="flex gap-3"><span className="text-cyan-400 font-black text-lg shrink-0">{i+1}.</span><p className="text-sm font-medium leading-relaxed">{text}</p></div>))}</div></div>
       <div className="p-4 border-t border-white/10 bg-[#0b0e14] sticky bottom-0"><button onClick={handleConfirmAndPay} disabled={isProcessingCustom || (userProfile?.wallet?.coins || 0) < 50000} className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-sm shadow-lg active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest border-b-4 border-black/20 flex items-center justify-center gap-2">{isProcessingCustom ? <Loader className="h-5 w-5 animate-spin" /> : <>Confirm & Pay <div className="flex items-center gap-1"><GoldenDollar /><span className="text-yellow-200">50,000</span></div></>}</button></div>
     </SheetContent>
   </Sheet>

   <AnimatePresence mode="wait">
     {showCustomLink && (<motion.div key="custom-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[2000] bg-black/95 flex flex-col"><div className="flex items-center justify-between p-4 border-b border-white/10"><span className="text-white font-bold text-lg">Customize Your Gift</span><button onClick={() => setShowCustomLink(false)} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><X className="h-5 w-5 text-white" /></button></div><div className="flex-1"><iframe src="https://ajpep8qoykzh.jp.larksuite.com/share/base/form/shrjp2Z1VRCOBZBHRrYsBj2voGh" className="w-full h-full border-0" title="Custom Gift Form"></iframe></div></motion.div>)}
   </AnimatePresence>
  </>
 );
         }
