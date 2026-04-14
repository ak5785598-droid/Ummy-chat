'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { ChevronLeft, Crown, Star, Sparkles, Mic2, Gift, ShieldCheck, Zap, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';

/**
 * High-Fidelity SVIP Club Dimension.
 * Re-engineered with the "Ringneck Eagle" premium set.
 */
export default function SvipClubPage() {
 const router = useRouter();
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const [selectedLevel, setSelectedLevel] = useState(1);

 const RINGNECK_COLORS = {
  green: '#4ade80',
  turquoise: '#2dd4bf',
  blue: '#38bdf8',
  purple: '#a78bfa',
  yellow: '#facc15'
 };

 const SvipBadge = ({ level }: { level: number }) => (
  <div className={cn(
   "relative overflow-hidden px-4 py-1.5 rounded-full border-2 border-white/40 group animate-in fade-in duration-500 shadow-[0_0_20px_rgba(74,222,128,0.4)]",
   "bg-gradient-to-r from-[#4ade80] via-[#2dd4bf] to-[#38bdf8]"
  )}>
   <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
   <div className="flex items-center gap-2 relative z-10">
     <Zap className="h-3 w-3 text-white fill-current" />
     <span className="text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">SVIP {level}</span>
   </div>
  </div>
 );

 return (
  <AppLayout>
   <div className="min-h-full bg-[#0a0514] text-white font-sans relative flex flex-col pb-20 overflow-x-hidden animate-in fade-in duration-700">
    
    {/* Cinematic Header */}
    <header className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#0a0514] z-50">
      <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
       <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <h1 className="text-2xl font-bold uppercase tracking-tight">SVIP Club</h1>
      <div className="w-10" />
    </header>

    <main className="flex-1 p-6 space-y-10">
      {/* Preview Section */}
      <div className="flex flex-col items-center gap-8 relative py-10">
       {/* Radial Glow Backdrops */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-64 h-64 bg-[#4ade80]/10 blur-[100px] rounded-full animate-pulse" />
         <div className="w-48 h-40 bg-[#38bdf8]/10 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
       </div>

       <div className="relative z-10 flex flex-col items-center text-center gap-6">
         <AvatarFrame frameId="svip-eagle-1" size="xl" className="scale-125 mb-4">
          <Avatar className="h-24 w-32 border-4 border-white/5 shadow-2xl">
            <AvatarImage src={userProfile?.avatarUrl || undefined} />
            <AvatarFallback className="bg-slate-900 text-3xl">{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
         </AvatarFrame>

         <div className="space-y-2">
          <h2 className="text-3xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] to-[#38bdf8]">
            Ringneck Eagle
          </h2>
          <div className="flex justify-center"><SvipBadge level={1} /></div>
         </div>
       </div>
      </div>

      {/* Level Selection Frequency */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
       {[1, 2, 3, 4, 5, 6, 7].map(lvl => (
        <button 
         key={lvl}
         onClick={() => setSelectedLevel(lvl)}
         className={cn(
          "shrink-0 h-14 w-14 rounded-2xl border-2 flex items-center justify-center font-bold transition-all active:scale-90",
          selectedLevel === lvl 
           ? "bg-gradient-to-br from-[#4ade80] to-[#38bdf8] border-white shadow-lg scale-110" 
           : "bg-white/5 border-white/10 text-white/40"
         )}
        >
          {lvl}
        </button>
       ))}
      </div>

      {/* Benefits Grid */}
      <div className="space-y-6">
       <div className="flex items-center gap-3 ml-2">
         <ShieldCheck className="h-5 w-5 text-[#4ade80]" />
         <h3 className="text-lg font-bold uppercase tracking-tight">VIP Privileges</h3>
       </div>

       <div className="grid grid-cols-2 gap-4">
         {[
          { label: 'Ringneck Frame', icon: Crown, desc: 'Majestic Eagle Wings', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
          { label: 'Voice Wave', icon: Mic2, desc: 'Tropical Frequency', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
          { label: 'Entrance Sync', icon: Zap, desc: 'Royal Arrival VFX', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
          { label: 'Eagle Gaze', icon: Gift, desc: 'Exclusive Gift Item', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
          { label: 'Identity Card', icon: Heart, desc: 'Parrot Nameplate', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
          { label: 'Noble Rank', icon: Star, desc: 'Elite Reputation', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
         ].map((benefit, i) => (
          <div key={i} className={cn("p-5 rounded-3xl border-2 flex flex-col gap-3 relative overflow-hidden group", benefit.color)}>
           <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <benefit.icon className="h-6 w-6 relative z-10" />
           <div className="relative z-10">
             <p className="text-xs font-bold uppercase tracking-tight">{benefit.label}</p>
             <p className="text-[8px] font-bold opacity-60 uppercase mt-0.5 tracking-wider">{benefit.desc}</p>
           </div>
          </div>
         ))}
       </div>
      </div>
    </main>

    <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent z-[100]">
      <Button className="w-full h-16 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#2dd4bf] to-[#38bdf8] text-white font-bold uppercase text-xl shadow-xl shadow-green-900/40 active:scale-95 transition-all">
       Join SVIP Club
      </Button>
    </footer>

   </div>
   <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
  </AppLayout>
 );
}
