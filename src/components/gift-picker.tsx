'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, Zap } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- CASTLE SVG FOR SMALL ICON (gift grid) ---
const castleSvg = `
  <svg viewBox="0 0 700 900" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="towerBase" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffafc"/><stop offset="35%" stop-color="#fff0f6"/><stop offset="100%" stop-color="#ffc4e1"/>
      </linearGradient>
      <linearGradient id="towerSide" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffe8f3"/><stop offset="50%" stop-color="#fff8f2"/><stop offset="100%" stop-color="#ffd9ec"/>
      </linearGradient>
      <linearGradient id="goldTrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff4d4"/><stop offset="30%" stop-color="#ffd9a0"/><stop offset="70%" stop-color="#e6a76a"/><stop offset="100%" stop-color="#c68a4f"/>
      </linearGradient>
      <linearGradient id="roofPink" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffc9e6"/><stop offset="50%" stop-color="#ff9dd1"/><stop offset="100%" stop-color="#ff6db5"/>
      </linearGradient>
      <linearGradient id="roofPurple" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e4caff"/><stop offset="100%" stop-color="#b883ff"/>
      </linearGradient>
      <radialGradient id="gemGlow" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="25%" stop-color="#ffe0f5"/><stop offset="60%" stop-color="#ffb7d5"/><stop offset="100%" stop-color="#ff5fa2" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="windowLight" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stop-color="#fff7d6"/><stop offset="40%" stop-color="#ffd6a0"/><stop offset="100%" stop-color="#ff8fb8" stop-opacity="0.6"/>
      </radialGradient>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
      <filter id="sharpGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <ellipse cx="350" cy="735" rx="285" ry="58" fill="#000" opacity="0.5" filter="url(#softGlow)"/>
    <!--... rest of your SVG paths... -->
    <g><circle cx="350" cy="147" r="28" fill="url(#gemGlow)" opacity="0.35" filter="url(#softGlow)"><animate attributeName="r" values="26;32;26" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.35;0.6;0.35" dur="3s" repeatCount="indefinite"/></circle></g>
  </svg>`;

// --- HIGH QUALITY 3D IMAGE FOR FULL SCREEN ---
const CASTLE_3D_IMAGE = '/castle-3d.png';

// --- FULL SCREEN CASTLE ANIMATION ---
function PrincessCastleOverlay() {
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

  return (
    <div className="castle-overlay-container">
      <style>{`
       .castle-overlay-container {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none; touch-action: none; user-select: none;
          background: transparent;
        }
       .castle-stage { position:relative; width:100vw; height:100vh; max-width:440px; overflow:hidden; margin:0 auto; }
       .rays { position:absolute; width:200vmin; height:200vmin; top:42%; left:50%; transform:translate(-50%, -50%); background: repeating-conic-gradient(from 0deg, transparent 0deg 5deg, rgba(255,214,160,0.22) 5deg 9deg, transparent 9deg 14deg, rgba(255,183,213,0.18) 14deg 17deg, transparent 17deg 24deg, rgba(255,240,200,0.15) 24deg 27deg, transparent 27deg 36deg); border-radius:50%; filter:blur(14px); mix-blend-mode:screen; animation: spin 48s linear infinite, rayPulse 15s ease-in-out infinite; opacity:0.75; }
        @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes rayPulse { 0%,100% { opacity:0.3; transform:translate(-50%,-50%) scale(0.88) rotate(0deg); } 28% { opacity:1; transform:translate(-50%,-50%) scale(1.12) rotate(90deg); } 55% { opacity:0.85; transform:translate(-50%,-50%) scale(1.05) rotate(180deg); } }
       .aura { position:absolute; width:94%; height:68%; top:36%; left:50%; transform:translateX(-50%); background: radial-gradient(ellipse at center, rgba(255,210,235,0.45) 0%, rgba(255,183,213,0.32) 22%, rgba(255,214,160,0.25) 38%, rgba(185,122,255,0.18) 55%, transparent 72%); filter:blur(38px); mix-blend-mode:screen; animation: auraPulse 15s ease-in-out infinite; }
        @keyframes auraPulse { 0% { opacity:0; transform:translateX(-50%) scale(0.75); } 8% { opacity:1; } 25% { opacity:1; transform:translateX(-50%) scale(1.18); } 100% { opacity:0; transform:translateX(-50%) scale(0.78); } }
       .castle-scene { position:absolute; top:4%; left:50%; width:92%; height:80%; transform:translateX(-50%); perspective:1500px; z-index:10; }
       .castle-wrap { width:100%; height:100%; transform-style:preserve-3d; animation: castleFloat 15s cubic-bezier(0.45,0,0.55,1) infinite; will-change:transform, opacity, filter; }
        @keyframes castleFloat { 0% { opacity:0; transform:scale(0.76) rotateY(-22deg) rotateX(10deg) translateY(70px); filter:brightness(0.55) blur(8px); } 7% { opacity:1; filter:brightness(1) blur(0); } 18% { transform:scale(1.03) rotateY(9deg) rotateX(-3deg) translateY(-12px); } 32% { transform:scale(1.055) rotateY(14deg) rotateX(2deg) translateY(-18px); filter:brightness(1.15); } 51% { transform:scale(0.985) rotateY(-7deg) rotateX(-2deg) translateY(4px); } 84% { transform:scale(0.97) rotateY(-5deg) rotateX(1deg) translateY(6px); opacity:1; } 100% { opacity:0; transform:scale(0.76) rotateY(-22deg) rotateX(10deg) translateY(70px); filter:brightness(0.55) blur(8px); } }
       .castle-wrap img { width:100%; height:100%; object-fit:contain; overflow:visible; filter: drop-shadow(0 40px 80px rgba(0,0,0,0.75)) drop-shadow(0 0 50px rgba(255,183,213,0.35)) drop-shadow(0 0 80px rgba(255,214,160,0.2)); }
       .castle-glow { position:absolute; bottom:8%; left:50%; width:76%; height:28%; transform:translateX(-50%); background: radial-gradient(ellipse, rgba(255,214,160,0.6) 0%, rgba(255,183,213,0.4) 40%, transparent 70%); filter:blur(26px); mix-blend-mode:screen; animation: glowPulse 15s ease-in-out infinite; z-index:-1; }
        @keyframes glowPulse { 0%,100% { opacity:0.4; transform:translateX(-50%) scale(0.85); } 30% { opacity:1; transform:translateX(-50%) scale(1.1); } }
       .mist { position:absolute; bottom:-8%; left:50%; width:120%; height:36%; transform:translateX(-50%); background: radial-gradient(ellipse at 30% 50%, rgba(255,183,213,0.65) 0%, transparent 55%), radial-gradient(ellipse at 70% 40%, rgba(255,214,160,0.5) 0%, transparent 50%); filter:blur(32px); opacity:0.95; animation: mistFlow 15s ease-in-out infinite; z-index:12; mix-blend-mode:screen; }
        @keyframes mistFlow { 0%,100% { transform:translateX(-50%) translateY(25px) scale(0.92); opacity:0.6; } 22% { transform:translateX(-48%) translateY(-5px) scale(1.08); opacity:1; } }
       .particles,.sparkles,.hearts { position:absolute; inset:0; pointer-events:none; z-index:20; overflow:hidden; }
       .particle { position:absolute; bottom:-15px; background: radial-gradient(circle, #fff9e2 0%, #ffe4b0 30%, #ffb7d5 60%, transparent 75%); border-radius:50%; box-shadow: 0 0 6px #ffd6a0, 0 0 14px #ffb7d5; animation: floatUp linear infinite; }
        @keyframes floatUp { 0% { transform:translateY(0) translateX(0) scale(0); opacity:0; } 4% { opacity:1; transform:scale(1); } 100% { transform:translateY(-118vh) translateX(var(--x)) scale(0.3); opacity:0; } }
       .sparkle { position:absolute; color:#ffedc8; text-shadow: 0 0 8px #ffd6a0, 0 0 16px #ff8fc1; animation: twinkle ease-in-out infinite; }
        @keyframes twinkle { 0%,100% { opacity:0.15; transform:scale(0.5); } 20% { opacity:1; transform:scale(1.4) rotate(90deg); } }
       .heart { position:absolute; bottom:-30px; color:#ffb7d5; font-weight:bold; text-shadow: 0 0 10px #ff5fa2, 0 0 20px #ffd6a0; animation: heartFloat linear infinite; }
        @keyframes heartFloat { 0% { transform:translateY(0) translateX(0) scale(0); opacity:0; } 8% { opacity:0.95; transform:scale(1.1); } 100% { transform:translateY(-115vh) translateX(var(--hx)) scale(0.4); opacity:0; } }
       .title { position:absolute; bottom:6.5vh; left:50%; transform:translateX(-50%); width:92%; text-align:center; z-index:40; animation:titleReveal 15s ease-in-out infinite; }
        @keyframes titleReveal { 0%,5% { opacity:0; transform:translateX(-50%) translateY(30px); } 11%,80% { opacity:1; transform:translateX(-50%) translateY(0); } 90%,100% { opacity:0; transform:translateX(-50%) translateY(-20px); } }
       .title span { font-family: Georgia, serif; font-size: clamp(26px, 6.8vw, 38px); font-weight:700; letter-spacing:0.22em; background: linear-gradient(180deg, #fffffb 0%, #fff5e0 12%, #ffe3b3 28%, #ffd6a0 45%, #e9b26e 62%, #ffb7d5 92%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.85)) drop-shadow(0 0 18px rgba(255,214,160,0.75)); }
       .vignette { position:absolute; inset:0; background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 90%); pointer-events:none; z-index:50; }
      `}</style>

      <div className="castle-stage">
        <div className="rays"></div>
        <div className="aura"></div>
        <div className="castle-scene">
          <div className="castle-wrap">
            <img src={CASTLE_3D_IMAGE} alt="Princess Castle" />
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
    </div>
  );
}

// --- GOLDEN DOLLAR ICON ---
const GoldenDollar = () => (
  <div className="relative flex items-center justify-center">
    <div className="h-5 w-5 rounded-full bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 shadow-[0_0_8px_rgba(234,179,8,0.6)] border border-yellow-300/50 flex items-center justify-center">
      <span className="text- font-black text-black drop-shadow-sm">$</span>
    </div>
  </div>
);

const FALLBACK_GIFTS: Record<string, any[]> = {
  'Hot': [
   { id: 'heart', name: 'Heart', price: 99, emoji: '❤️', animationId: 'heart_anim' },
   { id: 'rose', name: 'Rose', price: 10, emoji: '🌹', animationId: 'rose_anim' },
  ],
  'Lucky': [
   { id: 'apple', name: 'Apple', price: 100, emoji: '🍎', animationId: 'apple_svga_3d', isLucky: true },
  ],
  'Luxury': [
   { id: 'castle', name: 'Castle', price: 400000, animationId: 'princess_castle_anim' },
   { id: 'dm', name: 'Guitar', price: 700000, emoji: '🎸', animationId: 'diamond' },
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
 const [winData, setWinData] = useState<{ show: boolean, multiplier: number } | null>(null);
 const [playCastleAnim, setPlayCastleAnim] = useState(false);
 const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

 const giftsQuery = useMemoFirebase(() => {
   if (!firestore) return null;
   return query(collection(firestore, "giftList"), orderBy("createdAt", "desc"));
 }, [firestore]);

 const { data: dbGifts, isLoading: isGiftsLoading } = useCollection(giftsQuery);

 const GIFTS = useMemo(() => {
   if (!dbGifts || dbGifts.length === 0) return FALLBACK_GIFTS;
   const groups: Record<string, any[]> = { 'Hot': [], 'Lucky': [], 'Luxury': [], 'Event': [] };
   dbGifts.forEach((g: any) => {
     const cat = g.category || 'Hot';
     if (groups[cat]) groups[cat].push({...g, id: g.id || g.giftId });
     else { if (!groups['Event']) groups['Event'] = []; groups['Event'].push(g); }
   });
   return groups;
 }, [dbGifts]);

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
  if (isSending) return;
  setIsSending(true);
  try {
   const batch = writeBatch(firestore);
   const today = getTodayString();
   let winAmount = 0; let selectedMult = 1;
   if (selectedGift.isLucky) {
      const rand = Math.random();
      if (rand < 0.7) selectedMult = 1; else if (rand < 0.85) selectedMult = 2; else if (rand < 0.93) selectedMult = 5; else if (rand < 0.97) selectedMult = 10; else selectedMult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
      if (selectedMult > 1) winAmount = (selectedGift.price * qty) * selectedMult;
   }
   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);
   const isSenderNewDay = (userProfile.wallet as any)?.lastDailyResetDate!== today;
   const coinAdjustment = -totalCost + winAmount;
   batch.update(senderProfileRef, { 'wallet.coins': increment(coinAdjustment), 'wallet.totalSpent': increment(totalCost), 'wallet.dailySpent': isSenderNewDay? totalCost : increment(totalCost), 'wallet.lastDailyResetDate': today, updatedAt: serverTimestamp() });
   batch.update(senderUserRef, { 'wallet.coins': increment(coinAdjustment), 'wallet.dailySpent': isSenderNewDay? totalCost : increment(totalCost), 'wallet.lastDailyResetDate': today });
   const diamondPerRecipient = Math.floor((selectedGift.price * qty) * 0.4);
   selectedUids.forEach(uid => {
     const recProfileRef = doc(firestore, 'users', uid, 'profile', uid);
     const recUserRef = doc(firestore, 'users', uid);
     batch.update(recProfileRef, { 'wallet.diamonds': increment(diamondPerRecipient), 'stats.dailyGiftsReceived': increment(diamondPerRecipient) });
     batch.update(recUserRef, { 'wallet.diamonds': increment(diamondPerRecipient), 'stats.dailyGiftsReceived': increment(diamondPerRecipient) });
   });
   const roomRef = doc(firestore, 'chatRooms', roomId);
   batch.update(roomRef, { 'stats.totalGifts': increment(totalCost), 'stats.dailyGifts': increment(totalCost), 'rocket.progress': increment(totalCost) });
   const firstRecipientUid = selectedUids[0];
   const recipientObj = participants.find((p: any) => p.uid === firstRecipientUid);
   const recipientSeat = recipientObj?.seatIndex || 1;
   const recipientName = recipientObj?.name || 'Someone';
   const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
   batch.set(msgRef, { type: 'gift', senderId: user.uid, senderName: userProfile.username, giftId: selectedGift.id, giftName: selectedGift.name, animationId: selectedGift.animationId, imageUrl: selectedGift.imageUrl || null, animationUrl: selectedGift.animationUrl || null, soundUrl: selectedGift.soundUrl || null, tier: selectedGift.tier || 'normal', recipientId: firstRecipientUid, receiverName: recipientName, recipientSeat: recipientSeat, text: `sent ${selectedGift.name} x${isComboTrigger? 1 : qty} to ${recipientName}`, timestamp: serverTimestamp() });
   await batch.commit();

   if (selectedGift.id === 'castle') {
     setPlayCastleAnim(true);
     setTimeout(() => setPlayCastleAnim(false), 15000);
   }
   if (winAmount > 0) { setWinData({ show: true, multiplier: selectedMult }); setTimeout(() => setWinData(null), 4000); }
   const newToastId = Date.now();
   setToasts(prev => [...prev, { id: newToastId, emoji: selectedGift.emoji || '🏰', qty: isComboTrigger? comboCount + 1 : qty, username: userProfile.username, avatarUrl: userProfile.avatarUrl }].slice(-3));
   setTimeout(() => { setToasts(prev => prev.filter(t => t.id!== newToastId)); }, 3000);
   setComboCount(prev => prev + 1); setShowCombo(true);
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => { setShowCombo(false); setComboCount(0); }, 3000);
   if (!isComboTrigger &&!selectedGift.isLucky && selectedGift.id!== 'castle') onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   {playCastleAnim && <PrincessCastleOverlay />}
   <AnimatePresence>
     {winData?.show && (
       <motion.div initial={{ x: -300, opacity: 0, rotateY: -30 }} animate={{ x: 20, opacity: 1, rotateY: 0 }} exit={{ x: -500, opacity: 0 }} className="fixed top-1/3 left-0 z-[1000] pointer-events-none">
         <div className="relative w-60 h-36 bg-gradient-to-br from-blue-500 to-blue-800 rounded-r- border- border-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden">
            <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">WIN x{winData.multiplier}</motion.span>
         </div>
       </motion.div>
     )}
   </AnimatePresence>

   <div className="fixed top- left-0 z-[700] flex flex-col gap-2 pointer-events-none">
     <AnimatePresence>
      {toasts.map((toast) => (
       <motion.div key={toast.id} initial={{ x: -100, opacity: 0 }} animate={{ x: 16, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-blue-600/95 backdrop-blur-md p-2 pr-6 rounded-r-full flex items-center gap-3 border-2 border-white shadow-[0_0_15px_rgba(37,99,235,0.6)]">
        <Avatar className="h-10 w-10 border-2 border-white"><AvatarImage src={toast.avatarUrl} /></Avatar>
        <div className="flex flex-col">
          <span className="text- font-bold text-white uppercase">{toast.username}</span>
          <div className="flex items-center gap-1">
            {toast.emoji === '🏰'? <span className="text-lg">🏰</span> : <span className="text-lg">{toast.emoji}</span>}
            <span className="text-sm font-black text-white italic">x{toast.qty}</span>
          </div>
        </div>
       </motion.div>
      ))}
     </AnimatePresence>
   </div>

   <AnimatePresence>
    {showCombo && (
     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-44 right-8 z-[600]">
      <button onClick={() => handleSend(true)} className="h-24 w-24 bg-blue-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(37,99,235,0.7)] flex flex-col items-center justify-center active:scale-90">
       <Zap className="h-8 w-8 text-white fill-white animate-bounce" />
       <span className="text-2xl font-black text-white italic">{comboCount}x</span>
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t- overflow-hidden text-white shadow-2xl h- pb-10 [&>button]:hidden">
     <div className="p-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-10 w-10 rounded-full border-2 text- font-black shrink-0", selectedUids.length === seatedParticipants.length? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-10 w-10 border-2", selectedUids.includes(p.uid)? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

     <Tabs defaultValue="Hot" className="w-full mt-2">
      <TabsList className="mx-4 bg-white/5 p-1 rounded-2xl flex justify-between border border-white/5">
       {['Hot', 'Lucky', 'Luxury', 'Event'].map(id => (<TabsTrigger key={id} value={id} className="text- font-black px-4 py-1.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500">{id}</TabsTrigger>))}
      </TabsList>
       <div className="h- overflow-y-auto no-scrollbar px-4 pt-3 pb-20 grid grid-cols-4 gap-x-2 gap-y-4">
        {isGiftsLoading? (
          <div className="col-span-4 flex flex-col items-center justify-center py-10 gap-2"><Loader className="animate-spin text-cyan-400 h-6 w-6" /><span className="text- font-black text-white/20 uppercase">Loading Gifts...</span></div>
        ) : (
          Object.entries(GIFTS).map(([cat, items]) => (
            <TabsContent key={cat} value={cat} className="contents">
            {items.length === 0? (<div className="col-span-4 py-10 text-center opacity-30 text- font-bold uppercase">No Gifts in {cat}</div>) : (
              items.map(gift => (
                <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center transition-all duration-300 relative py-1 rounded-lg", selectedGift?.id === gift.id? "brightness-125 bg-white/10" : "opacity-70 hover:opacity-100")}>
                <div className="h-10 w-10 flex items-center justify-center mb-1 filter drop-shadow-md">
                  {gift.imageUrl? (<img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-contain" />) : gift.id === 'castle'? (<div className="h-full w-full flex items-center justify-center scale-150" dangerouslySetInnerHTML={{ __html: castleSvg }} />) : (<span className="text-3xl">{gift.emoji}</span>)}
                </div>
                <span className="text- font-bold text-white/90 truncate w-full text-center">{gift.name}</span>
                <div className="flex items-center gap-1 mt-0.5"><GoldenDollar /><span className="text- text-yellow-500 font-black">{gift.price}</span></div>
                {selectedGift?.id === gift.id && <div className="absolute -bottom-1 h-1 w-4 bg-cyan-400 rounded-full" />}
                </button>
              ))
            )}
            </TabsContent>
          ))
        )}
       </div>
     </Tabs>

     <div className="absolute bottom-0 left-0 right-0 p-3 pb-safe bg-[#0b0e14] flex items-center justify-between border-t border-white/10 shadow-2xl">
      <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-2xl border border-white/5"><GoldenDollar /><span className="text-sm font-black text-yellow-500">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span></div>
      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}><SelectTrigger className="w-16 h-10 bg-white/5 border-white/10 rounded-2xl text-cyan-400 font-bold"><SelectValue /></SelectTrigger><SelectContent className="bg-[#151921] border-white/10 text-white font-bold">{['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select>
       <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending || selectedUids.length === 0} className="h-10 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-xs shadow-lg active:scale-95 disabled:opacity-30 uppercase tracking-widest">{isSending? <Loader className="h-4 w-4 animate-spin" /> : 'SEND'}</button>
      </div>
     </div>
    </SheetContent>
   </Sheet>
  </>
 );
        }
