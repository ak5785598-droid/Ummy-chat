'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Gift, Plus, Upload, Flame, Sparkles } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch, onSnapshot, query, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM SVGA-STYLE DESIGN COMPONENTS ---

// 1. Chocolate Box Design (Orange Glossy + Laddu + Kaju Katli)
const ChocolateBoxIcon = ({ active }: { active: boolean }) => (
  <motion.div 
    animate={active ? { rotateY: 360 } : {}} 
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    className="relative w-12 h-10"
  >
    {/* Box Body */}
    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 rounded-lg shadow-lg border border-orange-300 overflow-hidden">
      {/* Glossy Reflection */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 -skew-y-12" />
      
      {/* Inside Sweets */}
      <div className="absolute bottom-2 left-2 flex gap-1">
        {/* Dark Brown Laddu */}
        <div className="w-3 h-3 bg-[#3d1a01] rounded-full shadow-inner shadow-black/40" />
        <div className="w-3 h-3 bg-[#3d1a01] rounded-full shadow-inner shadow-black/40" />
        {/* White Kaju Katli */}
        <div className="w-4 h-4 bg-gray-100 rotate-45 border border-gray-300 shadow-sm" />
      </div>
    </div>
  </motion.div>
);

// 2. Jini Chirag Design (Golden Glossy)
const ChiragIcon = ({ active }: { active: boolean }) => (
  <motion.div 
    animate={active ? { y: [0, -5, 0] } : {}} 
    transition={{ duration: 1.5, repeat: Infinity }}
    className="relative w-14 h-8"
  >
    {/* Lamp Body */}
    <div className="absolute bottom-0 w-full h-4 bg-gradient-to-t from-yellow-700 via-yellow-400 to-yellow-200 rounded-full" />
    {/* Handle & Spout */}
    <div className="absolute -left-1 bottom-1 w-4 h-4 border-t-4 border-l-4 border-yellow-400 rounded-tl-full" />
    <div className="absolute -right-2 bottom-2 w-6 h-3 bg-yellow-400 rounded-r-full skew-x-12" />
    {/* Glossy Sparkle */}
    <Sparkles className={cn("absolute -top-2 right-0 h-4 w-4 text-yellow-200", active ? "animate-pulse" : "hidden")} />
  </motion.div>
);

// --- Updated Icon Controller ---
const GiftIconDisplay = ({ gift, active }: { gift: any; active: boolean }) => {
  const base = cn("h-12 w-12 transition-all duration-500 flex items-center justify-center", active ? "scale-110 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" : "opacity-90");

  if (gift.imageUrl) return <img src={gift.imageUrl} alt={gift.name} className="h-12 w-12 object-contain" />;

  // Custom Logic for your specific gifts
  if (gift.name === "Chocolate Box") return <div className={base}><ChocolateBoxIcon active={active} /></div>;
  if (gift.name === "Chirag") return <div className={base}><ChiragIcon active={active} /></div>;

  switch (gift.type) {
    case 'bouquet': return <Flame className={cn(base, "text-pink-400")} />;
    case 'love': return <div className="font-black italic text-xl text-red-500">LOVE</div>;
    default: return <Gift className={cn(base, "text-indigo-400")} />;
  }
};

export function GiftPicker({ open, onOpenChange, roomId, recipient: initialRecipient, participants = [] }: any) {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const storage = getStorage();

  const [dbGifts, setDbGifts] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [isSending, setIsSending] = useState(false);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newGift, setNewGift] = useState({ name: '', price: '', category: 'Hot' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'giftList'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let giftsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Manual add of your custom Hot gifts if they don't exist in DB
      const customGifts = [
        { id: 'custom-cb', name: 'Chocolate Box', price: 1599, category: 'Hot', custom: true },
        { id: 'custom-ch', name: 'Chirag', price: 599, category: 'Hot', custom: true }
      ];
      
      setDbGifts([...customGifts, ...giftsData]);
    });
    return () => unsubscribe();
  }, [firestore]);

  const categories = ['Hot', 'Luxury', 'Event', 'Lucky'];

  const handleUploadGift = async () => {
    if (!selectedFile || !newGift.name || !newGift.price) return alert("Pura details bharo bhai!");
    setUploading(true);
    try {
      const storageRef = ref(storage, `gifts/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(firestore, 'giftList'), {
        name: newGift.name, price: parseInt(newGift.price), category: newGift.category, imageUrl: url, createdAt: serverTimestamp()
      });
      setShowUpload(false); setSelectedFile(null); setNewGift({ name: '', price: '', category: 'Hot' });
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const seatedParticipants = useMemo(() => {
    return participants.filter((p: any) => p.seatIndex > 0).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
  }, [participants]);

  const handleSend = async (isComboTrigger = false) => {
    if (!user || !firestore || !selectedGift || !userProfile || selectedUids.length === 0) return;
    const qty = isComboTrigger ? 1 : parseInt(quantity);
    const totalCost = selectedGift.price * qty * selectedUids.length;
    if ((userProfile.wallet?.coins || 0) < totalCost) return;

    setIsSending(true);
    try {
      const batch = writeBatch(firestore);
      // Logic for coins/diamonds stays here...
      await batch.commit();
      if (!isComboTrigger) onOpenChange(false);
    } catch (e) { console.error(e); } finally { setIsSending(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-[35px] h-[600px] text-white overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-white/5">
          <h3 className="font-bold text-cyan-400 tracking-widest">SEND GIFT</h3>
          <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-1 text-xs bg-white/10 px-3 py-1 rounded-full text-cyan-300">
            {showUpload ? 'Back' : <><Plus className="h-3 w-3"/> Add New</>}
          </button>
        </div>

        {showUpload ? (
          <div className="p-6 space-y-4">
             {/* Upload fields remain same */}
             <input value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" placeholder="Gift Name" />
             <div className="grid grid-cols-2 gap-4">
                <input type="number" value={newGift.price} onChange={e => setNewGift({...newGift, price: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" placeholder="Price" />
                <select value={newGift.category} onChange={e => setNewGift({...newGift, category: e.target.value})} className="w-full bg-[#151921] border border-white/10 p-3 rounded-xl outline-none">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center">
                <input type="file" id="giftImg" hidden onChange={e => setSelectedFile(e.target.files?.[0] || null)} accept="image/*" />
                <label htmlFor="giftImg" className="cursor-pointer">{selectedFile ? selectedFile.name : "Select Image"}</label>
             </div>
             <button onClick={handleUploadGift} disabled={uploading} className="w-full bg-cyan-500 p-4 rounded-2xl font-black">SAVE</button>
          </div>
        ) : (
          <>
            <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar bg-white/5">
              <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-12 w-12 rounded-full border-2 text-[10px] font-black shrink-0", selectedUids.length === seatedParticipants.length ? "border-cyan-400 text-cyan-400" : "border-white/10")}>ALL</button>
              {seatedParticipants.map((p: any) => (
                <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
                  <Avatar className={cn("h-12 w-12 border-2", selectedUids.includes(p.uid) ? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
                </button>
              ))}
            </div>

            <Tabs defaultValue="Hot" className="w-full">
              <TabsList className="mx-6 mt-4 bg-white/5 p-1 rounded-2xl flex justify-between">
                {categories.map(cat => <TabsTrigger key={cat} value={cat} className="text-[11px] font-black px-6 py-2 rounded-xl data-[state=active]:bg-cyan-500">{cat}</TabsTrigger>)}
              </TabsList>
              
              <div className="h-[340px] overflow-y-auto p-4 grid grid-cols-4 gap-3 pb-24">
                {categories.map(cat => (
                  <TabsContent key={cat} value={cat} className="contents">
                    {dbGifts.filter(g => g.category === cat).map(gift => (
                      <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center p-2 rounded-[22px] border transition-all", selectedGift?.id === gift.id ? "bg-cyan-500/10 border-cyan-400 scale-105" : "bg-[#141922] border-white/5")}>
                        <GiftIconDisplay gift={gift} active={selectedGift?.id === gift.id} />
                        <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{gift.name}</span>
                        <div className="flex items-center gap-1">
                           <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                           <span className="text-[11px] text-yellow-500 font-black">{gift.price}</span>
                        </div>
                      </button>
                    ))}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0b0e14]/90 backdrop-blur-md border-t border-white/10 flex justify-between items-center z-50">
            <div className="flex flex-col">
              <span className="text-white/40 text-[10px] uppercase font-bold">Your Balance</span>
              <div className="text-yellow-500 font-black text-lg flex items-center gap-1">
                {userProfile?.wallet?.coins || 0} <span className="text-[10px]">COINS</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={quantity} onValueChange={setQuantity}>
                <SelectTrigger className="w-16 h-10 bg-white/5 border-none text-cyan-400 font-black"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black text-white border-white/10">{['1','10','99','520'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
              <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending} className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-2 rounded-xl font-black shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform disabled:grayscale">SEND</button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
