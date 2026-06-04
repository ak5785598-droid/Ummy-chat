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

// ========== FLYING GIFT ANIMATION - Gift Image Bina Black Background ke Screen pe Udega ==========
const FlyingGiftAnimation = ({ gift, senderAvatar, targetPosition, onComplete }: {
  gift: any;
  senderAvatar: string;
  targetPosition: { x: number; y: number } | null;
  onComplete: () => void;
}) => {
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Start position - bottom center se shuru hoga
    setStartPos({
      x: window.innerWidth / 2 - 40,
      y: window.innerHeight - 200
    });

    // 2 second baad animation khatam
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!targetPosition) return null;

  return (
    <motion.div
      initial={{
        x: startPos.x,
        y: startPos.y,
        scale: 1,
        opacity: 1
      }}
      animate={{
        x: targetPosition.x - 30,
        y: targetPosition.y - 60,
        scale: 0.15,
        opacity: 0
      }}
      transition={{
        duration: 1.5,
        ease: "easeInOut",
        type: "spring",
        stiffness: 80,
        damping: 15
      }}
      className="fixed z-[2000] pointer-events-none"
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="relative"
      >
        {/* Gift Image - Bina kisi black background ke */}
        <img
          src={gift.imageUrl}
          alt={gift.name}
          className="h-20 w-20 object-contain drop-shadow-2xl"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.6))',
          }}
        />
        
        {/* Trail effect */}
        <motion.div
          animate={{ opacity: [0.6, 0], scale: [1, 2] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="absolute inset-0 rounded-full bg-cyan-400/30 blur-xl"
        />
      </motion.div>
    </motion.div>
  );
};

// ========== GIFT IMAGE COMPONENT - Bina Black Borders ke Clean Dikhega ==========
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

      // Top row check
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

      // Bottom row check
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

      // Left column check
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

      // Right column check
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
        // Black borders ko transparent karo
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const gVal = data[i + 1];
          const b = data[i + 2];
          if (r < BLACK_THRESHOLD && gVal < BLACK_THRESHOLD && b < BLACK_THRESHOLD) {
            data[i + 3] = 0; // Alpha zero = transparent
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setProcessedUrl(canvas.toDataURL('image/png'));
      } else {
        // Koi black border nahi, original image hi use karo
        setProcessedUrl(null);
      }
    };

    img.onerror = () => {
      setProcessedUrl(null);
    };
  }, [cachedUrl]);

  if (!gift.imageUrl) {
    return <span className="text-4xl">🎁</span>;
  }

  // Agar processed URL hai to wo use karo (black transparent), nahi to cached URL
  return (
    <img 
      src={processedUrl || cachedUrl} 
      alt={gift.name} 
      className="h-20 w-20 rounded-xl object-contain"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
      }}
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

// ============ NOTIFICATION PATTI COMPONENT ============
interface GiftNotification {
  id: string;
  senderAvatar: string;
  receiverAvatar: string;
  giftImage: string;
  multiplier: number;
}

const GiftNotificationPatty = ({ notifications }: { notifications: GiftNotification[] }) => {
  const [currentBatch, setCurrentBatch] = useState<GiftNotification[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);

  useEffect(() => {
    if (notifications.length === 0) {
      setCurrentBatch([]);
      return;
    }

    // Max 5 dikhana hai ek saath
    const displayItems = notifications.slice(0, 5);
    setCurrentBatch(displayItems);
    setBatchIndex(prev => prev + 1);

    // 2 second baad remove kar dena
    const timeout = setTimeout(() => {
      setCurrentBatch([]);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [notifications]);

  return (
    <AnimatePresence>
      {currentBatch.length > 0 && (
        <motion.div
          key={batchIndex}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="fixed top-6 right-4 z-[1500] flex flex-col gap-2 max-w-[280px] w-full"
        >
          {currentBatch.map((notif, idx) => (
            <motion.div
              key={notif.id + idx}
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-blue-600/70 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-blue-400/30 shadow-2xl shadow-blue-500/20"
            >
              <Avatar className="h-8 w-8 shrink-0 border border-white/40">
                <AvatarImage src={notif.senderAvatar} />
              </Avatar>

              <span className="text-white text-xs font-bold">➤</span>

              <Avatar className="h-8 w-8 shrink-0 border border-white/40">
                <AvatarImage src={notif.receiverAvatar} />
              </Avatar>

              <div className="h-8 w-8 shrink-0 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                <img src={notif.giftImage} alt="gift" className="h-7 w-7 object-contain" />
              </div>

              {notif.multiplier > 1 && (
                <div className="bg-yellow-500/90 rounded-full px-2 py-0.5 text-[10px] font-black text-black">
                  x{notif.multiplier}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============ COMBO COUNTDOWN BUTTON - Sirf Lucky ke liye ============
const ComboCountdownButton = ({ onFinish, multiplier }: { onFinish: () => void; multiplier: number }) => {
  const [countdown, setCountdown] = useState(3);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (countdown <= 0) {
      onFinish();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onFinish]);

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (countdown / 3) * circumference;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      className="relative w-16 h-16 flex items-center justify-center"
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="3"
        />
        <circle
          ref={circleRef}
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="flex flex-col items-center justify-center z-10">
        <span className="text-white font-black text-lg leading-none">{countdown}</span>
        {multiplier > 1 && (
          <span className="text-yellow-400 font-black text-[8px] leading-none mt-0.5">x{multiplier}</span>
        )}
      </div>
    </motion.div>
  );
};

// ============ LUXURY SCROLL BANNER - Sirf Luxury tab ke liye ============
const LuxuryScrollBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-2 mt-1 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600/30 via-blue-500/20 to-blue-600/30 border border-blue-400/20 backdrop-blur-sm"
    >
      <motion.div
        animate={{ x: ['100%', '-100%'] }}
        transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
        className="whitespace-nowrap py-2 px-4"
      >
        <span className="text-blue-200 font-bold text-xs tracking-wider">
          💎 Premium Luxury Collection • Exclusive Gifts • Make Them Feel Special • Diamond Tier Rewards 💎
        </span>
      </motion.div>
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
 const [winData, setWinData] = useState<{ show: boolean, multiplier: number } | null>(null);
 const [showCustomLink, setShowCustomLink] = useState(false);
 const [isProcessingCustom, setIsProcessingCustom] = useState(false);
 const [showRulesSheet, setShowRulesSheet] = useState(false);
 const [notifications, setNotifications] = useState<GiftNotification[]>([]);
 const [showCombo, setShowCombo] = useState(false);
 const [comboMultiplier, setComboMultiplier] = useState(1);
 const [activeTab, setActiveTab] = useState('Hot');
 
 // ========== FLYING GIFT STATE ==========
 const [flyingGift, setFlyingGift] = useState<{
   gift: any;
   senderAvatar: string;
   targetPosition: { x: number; y: number };
 } | null>(null);

 const hasInitialized = useRef(false);
 const lastRecipientUid = useRef<string | null>(null);

 const giftsQuery = useMemoFirebase(() => {
   if (!firestore) return null;
   return query(collection(firestore, "giftList"), orderBy("createdAt", "desc"));
 }, [firestore]);

 const { data: dbGifts, isLoading: isGiftsLoading } = useCollection(giftsQuery);

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
    const seated = participants.filter((p: any) => p.seatIndex > 0).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
    const audience = participants.filter((p: any) => !p.seatIndex || p.seatIndex === 0);
    const list = [...seated, ...audience];

    if (initialRecipient && !list.some((p: any) => p.uid === initialRecipient.uid)) {
      const fullRecipient = participants.find((p: any) => p.uid === initialRecipient.uid) || initialRecipient;
      list.push(fullRecipient);
    }
    return list;
  }, [participants, initialRecipient]);

 useEffect(() => {
  if (!open) {
    hasInitialized.current = false;
    lastRecipientUid.current = null;
    setShowCustomLink(false);
    setFlyingGift(null);
    return;
  }

  if (initialRecipient) {
    const currentUid = initialRecipient.uid;
    if (lastRecipientUid.current !== currentUid) {
      setSelectedUids([currentUid]);
      lastRecipientUid.current = currentUid;
      hasInitialized.current = true;
    }
  } else if (!hasInitialized.current && seatedParticipants.length > 0) {
    setSelectedUids([seatedParticipants[0].uid]);
    hasInitialized.current = true;
  }
 }, [open, initialRecipient?.uid, seatedParticipants]);

 useEffect(() => {
   const handlePopState = () => {
     if (showCustomLink) {
       setShowCustomLink(false);
     }
   };

   window.addEventListener('popstate', handlePopState);
   return () => window.removeEventListener('popstate', handlePopState);
 }, [showCustomLink]);

 const handleCustomGiftClick = () => {
   setShowRulesSheet(true);
 };

 const handleConfirmAndPay = async () => {
    if (!user || !firestore || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < 50000) return;
    if (isProcessingCustom) return;

    setIsProcessingCustom(true);
    setShowRulesSheet(false);

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

      window.open(
        'https://ajpep8qoykzh.jp.larksuite.com/share/base/form/shrjp2Z1VRCOBZBHRrYsBj2voGh',
        '_blank'
      );

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

 const handleComboFinish = () => {
   setShowCombo(false);
 };

 // ========== TARGET AVATAR POSITION DHUNDHO - Jiske liye gift bhej rahe ho ==========
 const getTargetAvatarPosition = () => {
   if (selectedUids.length === 0) return null;
   
   const firstUid = selectedUids[0];
   const recipient = participants.find((p: any) => p.uid === firstUid);
   
   // Avatar element dhundo DOM mein
   if (recipient?.seatIndex) {
     const avatarElement = document.querySelector(`[data-avatar-uid="${firstUid}"]`);
     if (avatarElement) {
       const rect = avatarElement.getBoundingClientRect();
       return {
         x: rect.left + rect.width / 2,
         y: rect.top + rect.height / 2
       };
     }
   }
   
   // Fallback - top center
   return {
     x: window.innerWidth / 2,
     y: 120
   };
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

   // ========== FLYING GIFT ANIMATION TRIGGER KARO - Sirf agar imageUrl hai ==========
   if (selectedGift.imageUrl) {
     const targetPos = getTargetAvatarPosition();
     setFlyingGift({
       gift: selectedGift,
       senderAvatar: userProfile.avatarUrl || '',
       targetPosition: targetPos || { x: window.innerWidth / 2, y: 120 }
     });
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

   // --- NOTIFICATION PATTI + COMBO TRIGGER ---
   const giftCategory = selectedGift.category || 'Hot';
   
   // Notification sirf tab dikhao jab category Luxury nahi ho
   if (giftCategory !== 'Luxury') {
     const processedGiftImg = selectedGift.imageUrl || '';

     const newNotifs: GiftNotification[] = selectedUids.map((uid, idx) => {
       const rec = participants.find((p: any) => p.uid === uid);
       return {
         id: `${Date.now()}-${idx}`,
         senderAvatar: userProfile.avatarUrl || '',
         receiverAvatar: rec?.avatarUrl || '',
         giftImage: processedGiftImg,
         multiplier: selectedMult
       };
     });

     setNotifications(newNotifs);
   }

   // Combo button sirf Lucky gift ke liye dikhao
   if (selectedGift.isLucky) {
     setComboMultiplier(selectedMult);
     setShowCombo(true);
   }

   if (winAmount > 0) {
      setWinData({ show: true, multiplier: selectedMult });
      setTimeout(() => setWinData(null), 4000);
   }

   // Sheet close mat karo agar Lucky gift hai (combo ke liye)
   if (!selectedGift.isLucky) {
     // Thoda delay se close karo taki flying animation dikh jaye
     setTimeout(() => {
       onOpenChange(false);
     }, 500);
   }
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   {/* ========== FLYING GIFT ANIMATION RENDER ========== */}
   <AnimatePresence>
     {flyingGift && (
       <FlyingGiftAnimation
         gift={flyingGift.gift}
         senderAvatar={flyingGift.senderAvatar}
         targetPosition={flyingGift.targetPosition}
         onComplete={() => setFlyingGift(null)}
       />
     )}
   </AnimatePresence>

   <AnimatePresence>
     {winData?.show && (
       <motion.div
         initial={{ x: -300, opacity: 0, rotateY: -30 }}
         animate={{ x: 20, opacity: 1, rotateY: 0 }}
         exit={{ x: -500, opacity: 0 }}
         className="fixed top-1/3 left-0 z-[1000] pointer-events-none"
       >
         <div className="relative w-60 h-36 bg-gradient-to-br from-blue-500 to-blue-800 rounded-r-2xl border-2 border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.3)] flex flex-col items-center justify-center overflow-hidden">
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
               <span className="text-white font-bold text-xs uppercase tracking-widest">Lucky Reward</span>
            </div>
         </div>
       </motion.div>
     )}
   </AnimatePresence>

   {/* ========== NOTIFICATION PATTI - Top Right, Right se Left slide ========== */}
   <GiftNotificationPatty notifications={notifications} />

   {/* ========== COMBO COUNTDOWN BUTTON - Right Side Bottom Corner, Sirf Lucky ke liye ========== */}
   <AnimatePresence>
     {showCombo && (
       <div className="fixed bottom-6 right-4 z-[1500]">
         <ComboCountdownButton onFinish={handleComboFinish} multiplier={comboMultiplier} />
       </div>
     )}
   </AnimatePresence>

   <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-2xl overflow-hidden text-white shadow-2xl pb-10 [&>button]:hidden">
     <div className="p-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-10 w-10 rounded-full border-2 text-xs font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button 
         key={p.uid} 
         onClick={() => setSelectedUids([p.uid])} 
         className="relative shrink-0"
         data-avatar-uid={p.uid} // 👈 YEH ZAROORI HAI - Avatar ko DOM mein identify karne ke liye
       >
        <Avatar className={cn("h-10 w-10 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

     <Tabs defaultValue="Hot" value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
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

      {/* ========== LUXURY SCROLL BANNER - Sirf Luxury tab mein dikhega ========== */}
      {activeTab === 'Luxury' && <LuxuryScrollBanner />}

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
               <div className="col-span-4 py-10 text-center opacity-30 text-xs font-bold uppercase tracking-widest">No Gifts in {cat}</div>
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

        <TabsContent value="Customized" className="contents">
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

   <Sheet open={showRulesSheet} onOpenChange={setShowRulesSheet}>
     <SheetContent
       side="bottom"
       className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-2xl overflow-hidden text-white shadow-2xl max-h-[70vh] [&>button]:hidden"
     >
       <div className="flex items-center gap-3 p-4 border-b border-white/10 sticky top-0 bg-[#0b0e14] z-10">
         <button
           onClick={() => setShowRulesSheet(false)}
           className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all shrink-0"
         >
           <ArrowLeft className="h-5 w-5 text-white" />
         </button>
         <span className="text-lg font-bold text-white">Rules</span>
       </div>

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
