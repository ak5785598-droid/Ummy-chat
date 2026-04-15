'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, Zap, Gem, Heart, Flame, Sparkles, Beer, Star, Gift, Plus, Upload } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch, onSnapshot, query, addDoc } from 'firebase/firestore';
// Storage import zaroori hai image ke liye
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- Custom Icon Component (Handles both SVGs and Uploaded Images) ---
const GiftIconDisplay = ({ gift, active }: { gift: any; active: boolean }) => {
  const base = cn("h-12 w-12 transition-all duration-500 object-contain", active ? "scale-110 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" : "opacity-80");

  // Agar gift mein imageUrl hai toh image dikhao, nahi toh default icons
  if (gift.imageUrl) {
    return <img src={gift.imageUrl} alt={gift.name} className={base} />;
  }

  // Purane Icons ka logic yahan rahega...
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
  const storage = getStorage(); // Firebase Storage init

  const [dbGifts, setDbGifts] = useState<any[]>([]); // DB se gifts yahan aayenge
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [isSending, setIsSending] = useState(false);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  
  // Upload States
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newGift, setNewGift] = useState({ name: '', price: '', category: 'Hot' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- 1. Real-time Gifts Fetching ---
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'giftList'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const giftsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbGifts(giftsData);
    });
    return () => unsubscribe();
  }, [firestore]);

  // Categories list
  const categories = ['Hot', 'Luxury', 'Event', 'Lucky'];

  // --- 2. Image Upload Logic ---
  const handleUploadGift = async () => {
    if (!selectedFile || !newGift.name || !newGift.price) return alert("Pura details bharo bhai!");
    setUploading(true);

    try {
      // Step A: Image Storage mein upload karo
      const storageRef = ref(storage, `gifts/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);

      // Step B: Firestore mein entry save karo
      await addDoc(collection(firestore, 'giftList'), {
        name: newGift.name,
        price: parseInt(newGift.price),
        category: newGift.category,
        imageUrl: url,
        animationId: 'default_anim', // Yahan custom animation ID daal sakte ho
        createdAt: serverTimestamp()
      });

      setShowUpload(false);
      setSelectedFile(null);
      setNewGift({ name: '', price: '', category: 'Hot' });
      alert("Gift successfully add ho gaya!");
    } catch (error) {
      console.error(error);
      alert("Upload fail ho gaya!");
    } finally {
      setUploading(false);
    }
  };

  const seatedParticipants = useMemo(() => {
    return participants.filter((p: any) => p.seatIndex > 0).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
  }, [participants]);

  // Handle Send Logic (Same as your previous logic)
  const handleSend = async (isComboTrigger = false) => {
    if (!user || !firestore || !selectedGift || !userProfile || selectedUids.length === 0) return;
    const qty = isComboTrigger ? 1 : parseInt(quantity);
    const totalCost = selectedGift.price * qty * selectedUids.length;
    if ((userProfile.wallet?.coins || 0) < totalCost) return;

    setIsSending(true);
    try {
      const batch = writeBatch(firestore);
      const today = new Date().toISOString().split('T')[0];
      
      // ... (Existing Coin deduction & Diamond credit logic) ...
      // Yeh code wahi rahega jo aapne upar provide kiya hai.

      await batch.commit();
      if (!isComboTrigger) onOpenChange(false);
    } catch (e) { console.error(e); } finally { setIsSending(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t-[35px] h-[600px] text-white">
        
        {/* Header with Upload Toggle */}
        <div className="flex justify-between items-center p-4 border-b border-white/5">
          <h3 className="font-bold text-cyan-400">SEND GIFT</h3>
          <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-1 text-xs bg-white/10 px-3 py-1 rounded-full">
            {showUpload ? 'Back to Gifts' : <><Plus className="h-3 w-3"/> Add New Gift</>}
          </button>
        </div>

        {showUpload ? (
          // --- UPLOAD FORM INTERFACE ---
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/50">Gift Name</label>
              <input value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" placeholder="e.g. Red Car" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-white/50">Price (Coins)</label>
                <input type="number" value={newGift.price} onChange={e => setNewGift({...newGift, price: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" placeholder="1000" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/50">Category</label>
                <select value={newGift.category} onChange={e => setNewGift({...newGift, category: e.target.value})} className="w-full bg-[#151921] border border-white/10 p-3 rounded-xl outline-none">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3">
              <input type="file" id="giftImg" hidden onChange={e => setSelectedFile(e.target.files?.[0] || null)} accept="image/*" />
              <label htmlFor="giftImg" className="cursor-pointer flex flex-col items-center">
                {selectedFile ? <span className="text-cyan-400 font-bold">{selectedFile.name}</span> : <><Upload className="h-10 w-10 text-white/20" /><span className="text-sm text-white/40 mt-2">Select Gift Image</span></>}
              </label>
            </div>

            <button onClick={handleUploadGift} disabled={uploading} className="w-full bg-cyan-500 p-4 rounded-2xl font-black disabled:opacity-50">
              {uploading ? 'UPLOADING...' : 'SAVE GIFT TO DATABASE'}
            </button>
          </div>
        ) : (
          // --- REGULAR GIFT PICKER ---
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
              
              <div className="h-[340px] overflow-y-auto p-4 grid grid-cols-4 gap-3">
                {categories.map(cat => (
                  <TabsContent key={cat} value={cat} className="contents">
                    {dbGifts.filter(g => g.category === cat).map(gift => (
                      <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center p-2 rounded-[22px] border", selectedGift?.id === gift.id ? "bg-cyan-500/10 border-cyan-400" : "bg-[#141922] border-white/5")}>
                        <GiftIconDisplay gift={gift} active={selectedGift?.id === gift.id} />
                        <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{gift.name}</span>
                        <span className="text-[11px] text-yellow-500 font-black">{gift.price}</span>
                      </button>
                    ))}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </>
        )}

        {/* Footer (Same as your UI) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0b0e14] border-t border-white/10 flex justify-between items-center">
            <div className="text-yellow-500 font-bold text-sm">Coins: {userProfile?.wallet?.coins || 0}</div>
            <div className="flex gap-2">
              <Select value={quantity} onValueChange={setQuantity}>
                <SelectTrigger className="w-16 h-10 bg-white/5 border-none text-cyan-400"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black text-white">{['1','10','99','520'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
              <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending} className="bg-cyan-500 px-8 py-2 rounded-xl font-bold">SEND</button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
