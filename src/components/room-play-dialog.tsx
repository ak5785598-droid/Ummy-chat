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
import { RoomParticipant } from '@/lib/types';
import { GoldCoinIcon } from '@/components/icons';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants?: RoomParticipant[];
}

/**
 * High-Fidelity Room Play Portal.
 * Features real-time participant selection, Battle setup, and the Majestic Lucky Bag.
 */
export function RoomPlayDialog({ open, onOpenChange, participants = [] }: RoomPlayDialogProps) {
  const [view, setView] = useState<'grid' | 'battle' | 'selection' | 'rules' | 'lucky-bag'>('grid');
  const [battleMode, setBattleMode] = useState<'Votes' | 'Coins'>('Votes');
  const [battleTime, setBattleTime] = useState('30 s');
  const [selectionSide, setSelectionSide] = useState<'BLUE' | 'RED'>('BLUE');
  
  // Lucky Bag State
  const [luckyBagTab, setLuckyBagTab] = useState<'Normal' | 'Rain'>('Normal');
  const [selectedCoinPkg, setSelectedCoinPkg] = useState('5777');

  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);

  // Team Selection State
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

  const toggleSelection = (uid: string) => {
    const currentTeam = selectionSide === 'BLUE' ? blueTeam : redTeam;
    const setter = selectionSide === 'BLUE' ? setBlueTeam : setRedTeam;
    const otherTeam = selectionSide === 'BLUE' ? redTeam : blueTeam;

    if (otherTeam.includes(uid)) return;

    if (currentTeam.includes(uid)) {
      setter(prev => prev.filter(id => id !== uid));
    } else {
      if (currentTeam.length < 5) {
        setter(prev => [...prev, uid]);
      }
    }
  };

  const seatedParticipants = participants.filter(p => p.seatIndex > 0);
  const luckyBagBanner = PlaceHolderImages.find(img => img.id === 'lucky-bag-banner');

  const rainPackages = [
    { id: 'r1', label: '2000' },
    { id: 'r2', label: '5000' },
    { id: 'r3', label: '10000' },
    { id: 'r4', label: '50000' },
    { id: 'r5', label: '80000' },
    { id: 'r6', label: '100000' },
  ];

  const normalPackages = [
    { id: 'n1', label: '5777' },
    { id: 'n2', label: '17777' },
    { id: 'n3', label: '99999' },
    { id: 'n4', label: '1777777' }
  ];

  const activePackages = luckyBagTab === 'Normal' ? normalPackages : rainPackages;

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
                    <button 
                      key={opt.id}
                      onClick={opt.onClick}
                      className="flex flex-col items-center gap-3 shrink-0 active:scale-90 transition-transform"
                    >
                       <div className="relative p-4 bg-white/5 rounded-3xl border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                          {opt.icon}
                       </div>
                       <span className="text-sm font-black uppercase italic text-white/80 tracking-tight">{opt.label}</span>
                    </button>
                  ))}
                  <div className="w-24 shrink-0" />
               </div>
            </div>
          </div>
        )}

        {view === 'lucky-bag' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 min-h-[650px] relative">
            {/* SVGA Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute inset-0 bg-[#2d0a4a] opacity-90" />
               <div className="absolute top-0 left-0 w-full h-48 overflow-hidden">
                  {luckyBagBanner && (
                    <Image 
                      src={luckyBagBanner.imageUrl} 
                      alt="Coins" 
                      fill 
                      className="object-cover opacity-40 brightness-75 scale-110"
                      data-ai-hint={luckyBagBanner.imageHint}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2d0a4a]" />
               </div>
               
               {/* Light Beams */}
               <div className="absolute top-0 left-[-20%] w-[150%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] animate-shine" style={{ animationDuration: '8s' }} />
               <div className="absolute top-0 left-[-10%] w-[150%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] animate-shine" style={{ animationDuration: '6s', animationDelay: '2s' }} />
               
               {/* Floating Sparkles */}
               {Array.from({length: 15}).map((_, i) => (
                 <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-20" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, animationDelay: `${Math.random()*5}s` }} />
               ))}
            </div>

            <header className="p-6 pb-2 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-2">
                  <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg cursor-pointer hover:bg-black/40 transition-all">
                     <GoldCoinIcon className="h-4 w-4" />
                     <span className="text-xs font-black text-white italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                     <ChevronRight className="h-3 w-3 text-white/40" />
                  </div>
               </div>
               
               <h2 className="text-3xl font-black text-yellow-400 italic tracking-tighter drop-shadow-md" style={{ fontFamily: 'serif' }}>Lucky Bag</h2>

               <div className="flex gap-2">
                  <button className="p-2 bg-purple-900/40 rounded-xl border border-white/10 hover:bg-purple-800 transition-colors">
                     <ClipboardList className="h-5 w-5 text-yellow-400" />
                  </button>
                  <button onClick={() => setView('rules')} className="p-2 bg-purple-900/40 rounded-xl border border-white/10 hover:bg-purple-800 transition-colors">
                     <HelpCircle className="h-5 w-5 text-yellow-400" />
                  </button>
                  <button onClick={() => setView('grid')} className="p-2 bg-purple-900/40 rounded-xl border border-white/10 hover:bg-purple-800 transition-colors ml-1">
                     <X className="h-5 w-5 text-white/60" />
                  </button>
               </div>
            </header>

            <main className="p-6 pt-2 space-y-8 relative z-10 flex flex-col">
               {/* Glossy Tab Switcher - Optimized for image design */}
               <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-full border-2 border-white/10 flex items-center shadow-inner mt-4">
                  <button 
                    onClick={() => setLuckyBagTab('Normal')}
                    className={cn(
                      "flex-1 h-12 rounded-full font-black uppercase italic text-sm transition-all duration-500 relative overflow-hidden",
                      luckyBagTab === 'Normal' ? "text-white bg-gradient-to-br from-[#6a11cb] via-[#2575fc] to-[#6a11cb] border-[3px] border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.6)]" : "text-white/40"
                    )}
                  >
                     {luckyBagTab === 'Normal' && <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />}
                     Normal
                  </button>
                  <button 
                    onClick={() => setLuckyBagTab('Rain')}
                    className={cn(
                      "flex-1 h-12 rounded-full font-black uppercase italic text-sm transition-all duration-500 relative overflow-hidden",
                      luckyBagTab === 'Rain' ? "text-white bg-gradient-to-br from-[#6a11cb] via-[#2575fc] to-[#6a11cb] border-[3px] border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.6)]" : "text-white/40"
                    )}
                  >
                     {luckyBagTab === 'Rain' && <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />}
                     Lucky Rain
                  </button>
               </div>

               {/* Total Coins Dimension */}
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-white/90 ml-1">Total Coins</h3>
                  <div className={cn(
                    "grid gap-3",
                    luckyBagTab === 'Normal' ? "grid-cols-2" : "grid-cols-2"
                  )}>
                     {activePackages.map((pkg) => (
                       <button 
                         key={pkg.id}
                         onClick={() => setSelectedCoinPkg(pkg.id)}
                         className={cn(
                           "h-16 rounded-2xl flex items-center justify-center gap-3 transition-all relative overflow-hidden border-2",
                           selectedCoinPkg === pkg.id 
                            ? "bg-gradient-to-r from-white via-indigo-100 to-white border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                            : "bg-white/5 border-white/5 hover:bg-white/10"
                         )}
                       >
                          <GoldCoinIcon className="h-5 w-5" />
                          <span className={cn(
                            "text-xl font-black italic tracking-tighter",
                            selectedCoinPkg === pkg.id ? "text-black" : "text-white"
                          )}>{pkg.label}</span>
                          
                          {/* Animated Shimmer for selection */}
                          {selectedCoinPkg === pkg.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine skew-x-[-30deg]" />
                          )}
                          
                          {/* High-Fidelity Holographic overlay for rain packages */}
                          {luckyBagTab === 'Rain' && selectedCoinPkg === pkg.id && (
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-purple-400/20 to-pink-400/20 opacity-40 animate-pulse pointer-events-none" />
                          )}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Conditional Notification Text for Rain */}
               {luckyBagTab === 'Rain' && (
                 <div className="bg-black/20 rounded-2xl p-4 border border-white/5 animate-in fade-in duration-700">
                    <p className="text-sm font-body italic text-white/60 leading-relaxed">
                      Sending 40000 Coins will trigger a flight notification.
                    </p>
                 </div>
               )}

               {/* Dropdown Syncs - Only visible in Normal mode per blueprint logic */}
               {luckyBagTab === 'Normal' && (
                 <div className="space-y-6 pt-2">
                    <div className="flex items-center justify-between gap-4">
                       <span className="text-base font-black uppercase italic text-white/80">Number of recipients</span>
                       <Select defaultValue="5">
                          <SelectTrigger className="w-24 h-10 rounded-xl bg-black/40 border-white/10 text-white font-black italic shadow-xl">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                             {['5', '10', '20', '50'].map(v => <SelectItem key={v} value={v} className="font-black italic">{v}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                       <span className="text-base font-black uppercase italic text-white/80">Countdown</span>
                       <Select defaultValue="Now">
                          <SelectTrigger className="w-28 h-10 rounded-xl bg-black/40 border-white/10 text-white font-black italic shadow-xl">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                             {['Now', '1 min', '5 min'].map(v => <SelectItem key={v} value={v} className="font-black italic">{v}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                       <div className="flex flex-col gap-1">
                          <span className="text-base font-black uppercase italic text-white/80">How to join</span>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Everyone can receive it.</p>
                       </div>
                       <Select defaultValue="Everyone">
                          <SelectTrigger className="w-32 h-10 rounded-xl bg-black/40 border-white/10 text-white font-black italic shadow-xl">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                             {['Everyone', 'Fans only', 'VIP only'].map(v => <SelectItem key={v} value={v} className="font-black italic">{v}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                 </div>
               )}

               {/* Send Sync Dispatch */}
               <div className="pt-10 pb-16">
                  <Button 
                    className="w-full h-16 rounded-[2rem] bg-gradient-to-r from-[#8e24aa] via-[#ab47bc] to-[#8e24aa] text-white border-2 border-purple-400/40 font-black uppercase italic text-2xl tracking-tighter shadow-[0_10px_40px_rgba(142,36,170,0.4)] active:scale-95 transition-all relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" style={{ animationDuration: '3s' }} />
                     SEND
                  </Button>
               </div>
            </main>
            
            {/* Pointed Bottom Ornaments per reference */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#2d0a4a] rotate-45 translate-y-4 border-r border-b border-white/5 z-0" />
          </div>
        )}

        {view === 'battle' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="p-6 pb-2 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-red-500 p-0.5 border border-white/20">
                     <div className="w-full h-full bg-black/40 rounded-full flex items-center justify-center">
                        <Swords className="h-5 w-5 text-white" />
                     </div>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Battle</h2>
               </div>
               <button onClick={() => setView('rules')} className="p-1 hover:scale-110 transition-transform"><HelpCircle className="h-6 w-6 text-yellow-500" /></button>
            </header>

            <div className="p-6 space-y-8">
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Select People</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#004d40] via-[#006064] to-[#00acc1] border-2 border-cyan-400/20 shadow-2xl overflow-hidden group">
                        <OrnateCorners color="#fbbf24" />
                        <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
                        <button onClick={() => { setSelectionSide('BLUE'); setView('selection'); }} className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform">
                           {blueTeam.length > 0 ? (
                             <div className="flex -space-x-3">
                                {blueTeam.slice(0, 3).map((uid) => {
                                  const p = participants.find(part => part.uid === uid);
                                  return (
                                    <Avatar key={uid} className="h-12 w-12 border-2 border-white/40 shadow-xl">
                                       <AvatarImage src={p?.avatarUrl} />
                                       <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                                {blueTeam.length > 3 && (
                                  <div className="h-12 w-12 rounded-full bg-black/60 border-2 border-white/40 flex items-center justify-center text-[10px] font-black">+{blueTeam.length - 3}</div>
                                )}
                             </div>
                           ) : (
                             <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border-2 border-white/20">
                                <Plus className="h-6 w-6 text-white" />
                             </div>
                           )}
                        </button>
                     </div>
                     
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#4a0e0e] via-[#880e4f] to-[#b71c1c] border-2 border-red-400/20 shadow-2xl overflow-hidden group">
                        <OrnateCorners color="#fbbf24" />
                        <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" style={{ animationDelay: '1s' }} />
                        <button onClick={() => { setSelectionSide('RED'); setView('selection'); }} className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform">
                           {redTeam.length > 0 ? (
                             <div className="flex -space-x-3">
                                {redTeam.slice(0, 3).map((uid) => {
                                  const p = participants.find(part => part.uid === uid);
                                  return (
                                    <Avatar key={uid} className="h-12 w-12 border-2 border-white/40 shadow-xl">
                                       <AvatarImage src={p?.avatarUrl} />
                                       <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                                {redTeam.length > 3 && (
                                  <div className="h-12 w-12 rounded-full bg-black/60 border-2 border-white/40 flex items-center justify-center text-[10px] font-black">+{redTeam.length - 3}</div>
                                )}
                             </div>
                           ) : (
                             <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border-2 border-white/20">
                                <Plus className="h-6 w-6 text-white" />
                             </div>
                           )}
                        </button>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Mode</h3>
                  <div className="flex gap-3">
                     {['Votes', 'Coins'].map((m) => (
                       <button 
                         key={m} 
                         onClick={() => setBattleMode(m as any)}
                         className={cn(
                           "flex-1 h-12 rounded-2xl font-black uppercase italic text-sm transition-all border-2",
                           battleMode === m ? "bg-emerald-600/80 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)]" : "bg-white/5 border-white/5 text-white/40"
                         )}
                       >
                          {m}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Time</h3>
                  <div className="grid grid-cols-3 gap-3">
                     {['30 s', '1 min', '5 min', '10 min', '15 min'].map((t) => (
                       <button 
                         key={t}
                         onClick={() => setBattleTime(t)}
                         className={cn(
                           "h-12 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all border-2",
                           battleTime === t ? "bg-emerald-600/80 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)]" : "bg-white/5 border-white/5 text-white/40"
                         )}
                       >
                          {t}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="pt-4 pb-10">
                  <Button 
                    disabled={blueTeam.length === 0 || redTeam.length === 0}
                    className="w-full h-16 rounded-[1.5rem] bg-emerald-800/80 hover:bg-emerald-700 text-emerald-400 border-2 border-yellow-500/40 font-black uppercase italic text-xl shadow-xl shadow-emerald-950/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                     Start
                  </Button>
               </div>
            </div>
          </div>
        )}

        {view === 'rules' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 min-h-[500px] bg-gradient-to-br from-[#064e3b] via-[#065f46] to-black relative">
            <div className="absolute inset-0 bg-white/5 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none" />
            
            <header className="p-6 border-b border-white/5 flex items-center relative z-10">
               <button onClick={() => setView('battle')} className="p-1 hover:scale-110 transition-transform">
                  <ChevronLeft className="h-8 w-8 text-white" />
               </button>
               <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter text-center flex-1 pr-8">Rules</h2>
            </header>
            
            <div className="p-10 space-y-16 relative z-10">
               <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-700">
                  <div className="flex items-center gap-4">
                     <span className="text-3xl drop-shadow-lg">🎫</span>
                     <h3 className="text-2xl font-black text-white tracking-tight">Number of votes</h3>
                  </div>
                  <p className="text-base font-body italic text-white/80 leading-relaxed pl-12">
                     PK according to number of votes received, 1 person 1 vote.
                  </p>
               </div>

               <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-1000">
                  <div className="flex items-center gap-4">
                     <span className="text-3xl drop-shadow-lg">🔥</span>
                     <h3 className="text-2xl font-black text-white tracking-tight">Number of coins</h3>
                  </div>
                  <p className="text-base font-body italic text-white/80 leading-relaxed pl-12">
                     PK according to number of coins received.
                  </p>
               </div>
            </div>

            <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
               <Swords className="w-[120%] h-[120%] text-white rotate-12" />
            </div>
          </div>
        )}

        {view === 'selection' && (
          <div className={cn(
            "animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px] max-h-[90vh] relative transition-colors duration-700 flex flex-col",
            selectionSide === 'BLUE' ? "bg-gradient-to-br from-[#002b2b] via-[#004d4d] to-black" : "bg-gradient-to-br from-[#4a0e0e] via-[#2d0707] to-black"
          )}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-10">
               <Swords className="w-[150%] h-[150%] text-white rotate-45" />
            </div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-white/5 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none" />

            <header className="p-8 pb-4 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                  <button onClick={() => setView('battle')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-8 w-8 text-white" /></button>
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 relative">
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                           <defs>
                              <linearGradient id="badgeGoldSelect" x1="0%" y1="0%" x2="100%" y2="100%">
                                 <stop offset="0%" stopColor="#FFF281" />
                                 <stop offset="50%" stopColor="#FFD700" />
                                 <stop offset="100%" stopColor="#B8860B" />
                              </linearGradient>
                           </defs>
                           <path d="M50 5 L85 20 L85 55 C85 75 50 95 50 95 C50 95 15 75 15 55 L15 20 Z" fill="url(#badgeGoldSelect)" stroke="#4d3a00" strokeWidth="1" />
                           <path d="M50 35 L60 55 L40 55 Z" fill="#4d3a00" />
                           <rect x="48" y="55" width="4" height="15" fill="#4d3a00" rx="2" />
                        </svg>
                     </div>
                     <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">Select People</h2>
                  </div>
               </div>
               <button 
                 onClick={() => setView('battle')}
                 className="bg-white/10 px-6 py-2 rounded-full font-black uppercase text-[10px] italic border border-white/20 active:scale-95 transition-all"
               >
                  Done
               </button>
            </header>

            <div className="p-8 pt-6 relative z-10 flex flex-col items-center">
               <div className="w-full space-y-8">
                  <div className="flex justify-center">
                     <SelectionSeat 
                       index={0} 
                       side={selectionSide} 
                       selectedUid={(selectionSide === 'BLUE' ? blueTeam : redTeam)[0]} 
                       onRemove={() => {
                         const setter = selectionSide === 'BLUE' ? setBlueTeam : setRedTeam;
                         setter(prev => { const n = [...prev]; n.splice(0, 1); return n; });
                       }}
                       participants={participants}
                     />
                  </div>

                  <div className="grid grid-cols-4 gap-4 w-full">
                     {[1, 2, 3, 4].map((i) => (
                       <div key={i} className="flex justify-center">
                          <SelectionSeat 
                            index={i} 
                            side={selectionSide} 
                            selectedUid={(selectionSide === 'BLUE' ? blueTeam : redTeam)[i]} 
                            onRemove={() => {
                              const setter = selectionSide === 'BLUE' ? setBlueTeam : setRedTeam;
                              setter(prev => { const n = [...prev]; n.splice(i, 1); return n; });
                            }}
                            participants={participants}
                          />
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex-1 px-8 pb-10 relative z-10 flex flex-col min-h-0">
               <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Tribe on Mic</span>
               </div>
               
               <ScrollArea className="flex-1 bg-black/20 rounded-3xl border border-white/5 p-4">
                  {seatedParticipants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                       {seatedParticipants.map((p) => {
                         const isSelectedOnCurrentSide = (selectionSide === 'BLUE' ? blueTeam : redTeam).includes(p.uid);
                         const isSelectedOnOtherSide = (selectionSide === 'BLUE' ? redTeam : blueTeam).includes(p.uid);
                         const currentTeam = selectionSide === 'BLUE' ? blueTeam : redTeam;

                         return (
                           <button 
                             key={p.uid}
                             disabled={isSelectedOnOtherSide || (currentTeam.length >= 5 && !isSelectedOnCurrentSide)}
                             onClick={() => toggleSelection(p.uid)}
                             className={cn(
                               "flex items-center justify-between p-3 rounded-2xl transition-all border-2",
                               isSelectedOnCurrentSide 
                                ? (selectionSide === 'BLUE' ? "bg-cyan-500/20 border-cyan-400" : "bg-red-500/20 border-red-400")
                                : "bg-white/5 border-white/5 hover:bg-white/10",
                               isSelectedOnOtherSide && "opacity-20 grayscale cursor-not-allowed"
                             )}
                           >
                              <div className="flex items-center gap-3">
                                 <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                                    <AvatarImage src={p.avatarUrl} />
                                    <AvatarFallback>U</AvatarFallback>
                                 </Avatar>
                                 <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-tight text-white">{p.name}</p>
                                    <p className="text-[8px] font-bold text-white/40 uppercase">Mic Slot {p.seatIndex}</p>
                                 </div>
                              </div>
                              {isSelectedOnCurrentSide ? (
                                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", selectionSide === 'BLUE' ? "bg-cyan-400" : "bg-red-400")}>
                                   <Check className="h-3 w-3 text-black" strokeWidth={4} />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full border-2 border-white/10 flex items-center justify-center">
                                   <Plus className="h-3 w-3 text-white/40" />
                                </div>
                              )}
                           </button>
                         );
                       })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                       <Armchair className="h-10 w-10 mb-2" />
                       <p className="text-[10px] font-black uppercase italic">Nobody sitting on mic</p>
                    </div>
                  )}
               </ScrollArea>
            </div>
          </div>
        )}

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </DialogContent>
    </Dialog>
  );
}

function SelectionSeat({ index, side, selectedUid, onRemove, participants }: any) {
  const p = participants.find((part: any) => part.uid === selectedUid);
  
  return (
    <div className="relative">
       <button 
         onClick={() => selectedUid && onRemove()}
         className={cn(
           "h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center transition-all relative z-10",
           "bg-black/40 border-2 backdrop-blur-md shadow-2xl",
           selectedUid 
            ? (side === 'BLUE' ? "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.4)]")
            : "border-white/5"
         )}
       >
          {p ? (
            <Avatar className="h-full w-full p-1">
               <AvatarImage src={p.avatarUrl} />
               <AvatarFallback>U</AvatarFallback>
            </Avatar>
          ) : (
            <Armchair className={cn("h-6 w-6", side === 'BLUE' ? "text-[#008b8b]" : "text-[#880e4f]")} />
          )}
       </button>
       {p && (
         <div className="absolute -top-1 -right-1 z-20 bg-black/80 rounded-full p-1 border border-white/20">
            <X className="h-2.5 w-2.5 text-white" />
         </div>
       )}
    </div>
  );
}

function OrnateCorners({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-60">
       <svg viewBox="0 0 40 40" className="absolute top-2 left-2 w-8 h-8" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
       <svg viewBox="0 0 40 40" className="absolute top-2 right-2 w-8 h-8 rotate-90" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
       <svg viewBox="0 0 40 40" className="absolute bottom-2 left-2 w-8 h-8 -rotate-90" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
       <svg viewBox="0 0 40 40" className="absolute bottom-2 right-2 w-8 h-8 rotate-180" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M 0 20 L 0 5 Q 0 0 5 0 L 20 0" strokeLinecap="round" />
          <circle cx="2" cy="2" r="1" fill={color} />
       </svg>
    </div>
  );
}