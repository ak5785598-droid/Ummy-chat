'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Swords, 
  Flame, 
  Briefcase, 
  Sparkles, 
  HelpCircle, 
  Plus, 
  ChevronLeft, 
  Armchair, 
  Users, 
  Check, 
  X, 
  ClipboardList,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoomParticipant, Room } from '@/lib/types';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, increment, serverTimestamp, collection, Timestamp, addDoc } from 'firebase/firestore';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants?: RoomParticipant[];
  roomId?: string;
  room?: any;
}

/**
 * High-Fidelity Room Play Portal.
 * Features real-time participant selection, Battle setup, and the Majestic Lucky Bag.
 */
export function RoomPlayDialog({ open, onOpenChange, participants = [], roomId, room }: RoomPlayDialogProps) {
  const [view, setView] = useState<'grid' | 'battle' | 'selection' | 'rules' | 'lucky-bag' | 'lucky-bag-rules'>('grid');
  const [battleMode, setBattleMode] = useState<'Votes' | 'Coins'>('Votes');
  const [battleTime, setBattleTime] = useState('30 s');
  const [selectionSide, setSelectionSide] = useState<'BLUE' | 'RED'>('BLUE');
  
  const [luckyBagTab, setLuckyBagTab] = useState<'Normal' | 'Rain'>('Normal');
  const [selectedCoinPkg, setSelectedCoinPkg] = useState('n1');
  const [isSending, setIsSending] = useState(false);

  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [blueTeam, setBlueTeam] = useState<string[]>([]);
  const [redTeam, setRedTeam] = useState<string[]>([]);

  const options = [
    { 
      id: 'battle', 
      label: 'Battle', 
      onClick: () => setView('battle'),
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-red-500 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden group">
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              <Swords className="h-8 w-8 text-white drop-shadow-md animate-pulse" />
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    },
    { 
      id: 'calculator', 
      label: 'Calculator', 
      onClick: () => {},
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#3d2b1f] to-black p-0.5 border-2 border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4)] overflow-hidden group">
           <div className="w-full h-full flex items-center justify-center rounded-full bg-black/40">
              <Flame className="h-8 w-8 text-orange-500 fill-current animate-reaction-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    },
    { 
      id: 'lucky-bag', 
      label: 'Lucky Bag', 
      onClick: () => setView('lucky-bag'),
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#b88a44] to-[#5d4037] p-0.5 border-2 border-yellow-200/40 shadow-xl overflow-hidden group">
           <div className="w-full h-full flex items-center justify-center rounded-full bg-black/20">
              <div className="relative">
                 <Briefcase className="h-8 w-8 text-yellow-500 fill-amber-900/40" />
                 <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-black shadow-lg">
                    <span className="text-[8px] font-black text-black leading-none">$</span>
                 </div>
              </div>
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    }
  ];

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => setView('grid'), 300);
    }
    onOpenChange(open);
  };

  const rainPackages = [
    { id: 'r1', label: '2000', value: 2000 },
    { id: 'r2', label: '5000', value: 5000 },
    { id: 'r3', label: '10000', value: 10000 },
    { id: 'r4', label: '50000', value: 50000 },
    { id: 'r5', label: '80000', value: 80000 },
    { id: 'r6', label: '100000', value: 100000 },
  ];

  const normalPackages = [
    { id: 'n1', label: '5777', value: 5777 },
    { id: 'n2', label: '17777', value: 17777 },
    { id: 'n3', label: '99999', value: 99999 },
    { id: 'n4', label: '1777777', value: 1777777 }
  ];

  const activePackages = luckyBagTab === 'Normal' ? normalPackages : rainPackages;

  const handleSendLuckyBag = async () => {
    if (!user || !firestore || !userProfile || !roomId || !room) return;
    
    const pkg = activePackages.find(p => p.id === selectedCoinPkg);
    if (!pkg) return;

    if ((userProfile.wallet?.coins || 0) < pkg.value) {
      toast({ variant: 'destructive', title: 'Vault Empty', description: 'Recharge coins to send this bag.' });
      return;
    }

    setIsSending(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-pkg.value), updatedAt: serverTimestamp() });
      updateDocumentNonBlocking(profileRef, { 'wallet.coins': increment(-pkg.value), updatedAt: serverTimestamp() });

      // If it's a Normal Lucky Bag, trigger GLOBAL BROADCAST
      if (luckyBagTab === 'Normal') {
        const broadcastRef = collection(firestore, 'globalBroadcasts');
        await addDoc(broadcastRef, {
          roomId: roomId,
          roomNumber: room.roomNumber || '0000',
          senderId: user.uid,
          senderName: userProfile.username,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 5000)), // 5 seconds duration
          createdAt: serverTimestamp()
        });
      }

      // Dispatch System Message
      await addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
        type: luckyBagTab === 'Rain' ? 'lucky-rain' : 'lucky-bag',
        senderId: user.uid,
        senderName: userProfile.username,
        amount: pkg.value,
        timestamp: serverTimestamp(),
        bagId: `bag_${Date.now()}` // For grab logic synchronization
      });

      toast({ title: 'Dispatch Successful', description: `${luckyBagTab} frequency synchronized.` });
      handleClose(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Dispatch Failed' });
    } finally {
      setIsSending(false);
    }
  };

  const toggleSelection = (uid: string) => {
    const currentTeam = selectionSide === 'BLUE' ? blueTeam : redTeam;
    const setter = selectionSide === 'BLUE' ? setBlueTeam : setRedTeam;
    const otherTeam = selectionSide === 'BLUE' ? redTeam : blueTeam;
    if (otherTeam.includes(uid)) return;
    if (currentTeam.includes(uid)) setter(prev => prev.filter(id => id !== uid));
    else if (currentTeam.length < 5) setter(prev => [...prev, uid]);
  };

  const seatedParticipants = participants.filter(p => p.seatIndex > 0);
  const luckyBagBanner = PlaceHolderImages.find(img => img.id === 'lucky-bag-banner');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        
        {view === 'grid' && (
          <div className="animate-in fade-in duration-500">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white/90">Room Play</DialogTitle>
              <DialogDescription className="sr-only">Choose a room game or tool frequency.</DialogDescription>
            </DialogHeader>
            <div className="p-8 pt-2 pb-16">
               <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                  {options.map((opt) => (
                    <button key={opt.id} onClick={opt.onClick} className="flex flex-col items-center gap-3 shrink-0 active:scale-90 transition-transform">
                       <div className="relative p-4 bg-white/5 rounded-3xl border border-white/5 shadow-inner hover:bg-white/10 transition-colors">{opt.icon}</div>
                       <span className="text-sm font-black uppercase italic text-white/80 tracking-tight">{opt.label}</span>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        )}

        {view === 'lucky-bag' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 min-h-[650px] relative">
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute inset-0 bg-[#2d0a4a] opacity-90" />
               <div className="absolute top-0 left-0 w-full h-48 overflow-hidden">
                  {luckyBagBanner && <Image src={luckyBagBanner.imageUrl} alt="Coins" fill className="object-cover opacity-40 brightness-75 scale-110" data-ai-hint={luckyBagBanner.imageHint} />}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2d0a4a]" />
               </div>
            </div>
            <header className="p-6 pb-2 flex items-center justify-between relative z-10">
               <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10"><GoldCoinIcon className="h-4 w-4" /><span className="text-xs font-black text-white italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span></div>
               <h2 className="text-3xl font-black text-yellow-400 italic tracking-tighter" style={{ fontFamily: 'serif' }}>Lucky Bag</h2>
               <div className="flex gap-2">
                  <button onClick={() => setView('lucky-bag-rules')} className="p-2 bg-purple-900/40 rounded-xl border border-white/10"><HelpCircle className="h-5 w-5 text-yellow-400" /></button>
                  <button onClick={() => setView('grid')} className="p-2 bg-purple-900/40 rounded-xl border border-white/10"><X className="h-5 w-5 text-white/60" /></button>
               </div>
            </header>
            <main className="p-6 pt-2 space-y-8 relative z-10">
               <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-full border-2 border-white/10 flex items-center shadow-inner mt-4">
                  {['Normal', 'Rain'].map(tab => (
                    <button key={tab} onClick={() => { setLuckyBagTab(tab as any); setSelectedCoinPkg(tab === 'Normal' ? 'n1' : 'r1'); }} className={cn("flex-1 h-12 rounded-full font-black uppercase italic text-sm transition-all duration-500", luckyBagTab === tab ? "text-white bg-gradient-to-br from-[#6a11cb] via-[#2575fc] to-[#6a11cb] border-[3px] border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.6)]" : "text-white/40")}>{tab === 'Normal' ? 'Normal' : 'Lucky Rain'}</button>
                  ))}
               </div>
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-white/90">Total Coins</h3>
                  <div className="grid grid-cols-2 gap-3">
                     {activePackages.map((pkg) => (
                       <button key={pkg.id} onClick={() => setSelectedCoinPkg(pkg.id)} className={cn("h-16 rounded-2xl flex items-center justify-center gap-3 transition-all border-2", selectedCoinPkg === pkg.id ? "bg-gradient-to-r from-white via-indigo-100 to-white border-white shadow-xl" : "bg-white/5 border-white/5 hover:bg-white/10")}>
                          <GoldCoinIcon className="h-5 w-5" /><span className={cn("text-xl font-black italic tracking-tighter", selectedCoinPkg === pkg.id ? "text-black" : "text-white")}>{pkg.label}</span>
                       </button>
                     ))}
                  </div>
               </div>
               <div className="pt-10 pb-16"><Button onClick={handleSendLuckyBag} disabled={isSending} className="w-full h-16 rounded-[2rem] bg-gradient-to-r from-[#8e24aa] via-[#ab47bc] to-[#8e24aa] text-white border-2 border-purple-400/40 font-black uppercase italic text-2xl tracking-tighter shadow-xl active:scale-95 transition-all">{isSending ? <Loader className="animate-spin h-6 w-6" /> : 'SEND'}</Button></div>
            </main>
         </div>
        )}

        {view === 'lucky-bag-rules' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px] bg-gradient-to-b from-[#8e2de2] via-[#4a00e0] to-[#1a0a2e] relative overflow-hidden flex flex-col">
            <header className="p-6 flex items-center relative z-10">
               <button onClick={() => setView('lucky-bag')} className="h-10 w-10 rounded-full bg-[#4a00e0]/40 border border-white/20 flex items-center justify-center"><ChevronLeft className="h-6 w-6 text-yellow-400" /></button>
               <h2 className="text-3xl font-black text-yellow-400 italic tracking-tighter text-center flex-1 pr-10" style={{ fontFamily: 'serif' }}>Rules</h2>
            </header>
            <ScrollArea className="flex-1 p-8 pt-2 relative z-10">
               <div className="space-y-10 pb-20">
                  <section className="space-y-4"><h3 className="text-2xl font-black text-white italic tracking-tight">Lucky Bag</h3><ul className="space-y-4 pl-4">{["When a Lucky Bag pack is more than 7000 Coins, a chatroom broadcast will be sent;","A maximum of 10 Lucky Bags can exist in each room at the same time;","The maximum number of Coins sent per day is 200,000 Coins;"].map((rule, idx) => (<li key={idx} className="flex gap-3 text-sm font-medium text-white/90 leading-relaxed"><div className="h-1.5 w-1.5 rounded-full bg-white shrink-0 mt-2 shadow-[0_0_5px_white]" /><p>{rule}</p></li>)) }</ul></section>
               </div>
            </ScrollArea>
          </div>
        )}

        {view === 'battle' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="p-6 pb-2 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Battle</h2>
               </div>
               <button onClick={() => setView('rules')} className="p-1 hover:scale-110 transition-transform"><HelpCircle className="h-6 w-6 text-yellow-500" /></button>
            </header>
            <div className="p-6 space-y-8">
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Select People</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#004d40] via-[#006064] to-[#00acc1] border-2 border-cyan-400/20 shadow-2xl overflow-hidden group">
                        <SelectionPortal side="BLUE" team={blueTeam} onClick={() => { setSelectionSide('BLUE'); setView('selection'); }} participants={participants} />
                     </div>
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#4a0e0e] via-[#880e4f] to-[#b71c1c] border-2 border-red-400/20 shadow-2xl overflow-hidden group">
                        <SelectionPortal side="RED" team={redTeam} onClick={() => { setSelectionSide('RED'); setView('selection'); }} participants={participants} />
                     </div>
                  </div>
               </div>
               <div className="space-y-4"><h3 className="text-lg font-black uppercase tracking-tight text-white/90">Mode</h3><div className="flex gap-3">{['Votes', 'Coins'].map((m) => (<button key={m} onClick={() => setBattleMode(m as any)} className={cn("flex-1 h-12 rounded-2xl font-black uppercase italic text-sm transition-all border-2", battleMode === m ? "bg-emerald-600/80 border-emerald-400 text-white" : "bg-white/5 border-white/5 text-white/40")}>{m}</button>))}</div></div>
               <div className="pt-4 pb-10"><Button disabled={blueTeam.length === 0 || redTeam.length === 0} className="w-full h-16 rounded-[1.5rem] bg-emerald-800/80 text-emerald-400 font-black uppercase italic text-xl shadow-xl active:scale-95 transition-all">Start</Button></div>
            </div>
          </div>
        )}

        {view === 'selection' && (
          <div className={cn("animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px] relative flex flex-col", selectionSide === 'BLUE' ? "bg-[#004d4d]" : "bg-[#4a0e0e]")}>
            <header className="p-8 pb-4 flex items-center justify-between relative z-10"><div className="flex items-center gap-4"><button onClick={() => setView('battle')} className="p-1"><ChevronLeft className="h-8 w-8 text-white" /></button><h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Select People</h2></div><button onClick={() => setView('battle')} className="bg-white/10 px-6 py-2 rounded-full font-black uppercase text-[10px] italic border border-white/20">Done</button></header>
            <div className="flex-1 px-8 pb-10 relative z-10 flex flex-col min-h-0"><ScrollArea className="flex-1 bg-black/20 rounded-3xl border border-white/5 p-4">{seatedParticipants.length > 0 ? <div className="grid grid-cols-1 gap-2">{seatedParticipants.map((p) => { const isSelected = (selectionSide === 'BLUE' ? blueTeam : redTeam).includes(p.uid); return <button key={p.uid} onClick={() => toggleSelection(p.uid)} className={cn("flex items-center justify-between p-3 rounded-2xl transition-all border-2", isSelected ? (selectionSide === 'BLUE' ? "bg-cyan-500/20 border-cyan-400" : "bg-red-500/20 border-red-400") : "bg-white/5 border-white/5 hover:bg-white/10")}><div className="flex items-center gap-3"><Avatar className="h-10 w-10 border border-white/10"><AvatarImage src={p.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar><div className="text-left"><p className="font-black text-xs uppercase tracking-tight text-white">{p.name}</p></div></div>{isSelected ? <Check className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white/40" />}</button>; })}</div> : <p className="text-center py-10 opacity-20 italic">Nobody on mic</p>}</ScrollArea></div>
          </div>
        )}

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </DialogContent>
    </Dialog>
  );
}

function SelectionPortal({ side, team, onClick, participants }: any) {
  return (
    <button onClick={onClick} className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform">
      {team.length > 0 ? (
        <div className="flex -space-x-3">
          {team.slice(0, 3).map((uid: string) => {
            const p = participants.find((part: any) => part.uid === uid);
            return <Avatar key={uid} className="h-12 w-12 border-2 border-white/40 shadow-xl"><AvatarImage src={p?.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>;
          })}
        </div>
      ) : (
        <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border-2 border-white/20"><Plus className="h-6 w-6 text-white" /></div>
      )}
    </button>
  );
}
