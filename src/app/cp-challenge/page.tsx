
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { ChevronLeft, RefreshCw, Heart, Trophy, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { GoldCoinIcon } from '@/components/icons';

/**
 * SVGA Petal Component.
 */
const Petal = ({ style }: { style: React.CSSProperties }) => (
  <div className="absolute pointer-events-none animate-petal-fall opacity-60 select-none z-40" style={style}>
    <svg viewBox="0 0 24 24" className="fill-pink-300 drop-shadow-md" width="16" height="16">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </div>
);

/**
 * Couple Challenge - High-Fidelity CP Leaderboard.
 * Re-engineered to handle empty states after clearing demo data.
 */
export default function CpChallengePage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 5, hours: 10, minutes: 2, seconds: 58 });
  const [activeTab, setActiveTab] = useState<'this' | 'last' | 'rewards'>('this');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const heroAsset = PlaceHolderImages.find(img => img.id === 'cp-challenge-hero');

  // LEADERBOARD CLEAR PROTOCOL: Removing all hardcoded users.
  const couples: any[] = [];

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#800020] flex flex-col relative overflow-hidden font-headline text-white select-none">
        
        {/* Cinematic Falling Petals (SVGA feel) */}
        <div className="absolute inset-0 z-40 pointer-events-none">
           {Array.from({ length: 15 }).map((_, i) => (
             <Petal key={i} style={{ 
               top: '-50px', 
               left: `${Math.random() * 100}%`, 
               animationDelay: `${Math.random() * 10}s`,
               animationDuration: `${8 + Math.random() * 10}s`
             }} />
           ))}
        </div>

        {/* Top Navigation Bar */}
        <header className="relative z-50 flex items-center justify-between p-6 pt-12">
           <button 
             onClick={() => router.back()} 
             className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg active:scale-90 transition-transform"
           >
              <ChevronLeft className="h-6 w-6" />
           </button>
           <h1 className="text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">Couple Challenge</h1>
           <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg">
              <RefreshCw className="h-6 w-6" />
           </button>
        </header>

        <ScrollArea className="flex-1">
           {/* Hero Section: Majestic Banner & Top Couple */}
           <div className="relative h-[55vh] flex flex-col items-center">
              {/* Romantic Illustration Background */}
              <div className="absolute inset-0 z-0">
                 {heroAsset && (
                   <Image 
                     src={heroAsset.imageUrl} 
                     alt="Challenge Hero" 
                     fill 
                     className="object-cover opacity-80" 
                     priority
                   />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#800020]/20 to-[#800020]" />
              </div>

              {/* Majestic Golden Title Banner (SVGA Shimmer) */}
              <div className="relative z-10 mt-4 animate-in slide-in-from-top-10 duration-1000">
                 <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-2xl animate-pulse rounded-full" />
                    <div className="relative bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] border-[3px] border-[#fde68a] px-12 py-3 rounded-full shadow-2xl animate-shimmer-gold overflow-hidden">
                       <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                         Couple Challenge
                       </h2>
                    </div>
                    {/* Floating Hearts under Banner */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                       <div className="bg-pink-500 p-1.5 rounded-full shadow-lg animate-reaction-heartbeat">
                          <Heart className="h-4 w-4 fill-current" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* No. 1 Couple Visual Synchronization */}
              <div className="relative z-10 flex-1 flex items-center justify-center w-full px-8">
                 {couples.length > 0 ? (
                   <div className="flex items-center gap-12 animate-in fade-in duration-700">
                      {/* User 1 */}
                      <div className="flex flex-col items-center gap-2">
                         <div className="relative">
                            <div className="h-24 w-24 rounded-full border-4 border-yellow-400 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-md">
                               <Avatar className="h-full w-full">
                                  <AvatarImage src={`https://picsum.photos/seed/u1_0/200`} />
                                  <AvatarFallback className="bg-slate-100 text-black">U</AvatarFallback>
                               </Avatar>
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black h-6 w-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-lg">1</div>
                         </div>
                         <div className="bg-black/40 backdrop-blur-md px-4 py-0.5 rounded-full border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-tight">{couples[0].name1}</p>
                         </div>
                      </div>

                      {/* Animated Pulse Hearts */}
                      <div className="relative">
                         <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-40 scale-150 animate-pulse" />
                         <span className="text-5xl drop-shadow-2xl animate-reaction-heartbeat block relative z-10">💕</span>
                      </div>

                      {/* User 2 */}
                      <div className="flex flex-col items-center gap-2">
                         <div className="relative">
                            <div className="h-24 w-24 rounded-full border-4 border-yellow-400 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-md">
                               <Avatar className="h-full w-full">
                                  <AvatarImage src={`https://picsum.photos/seed/u2_0/200`} />
                                  <AvatarFallback className="bg-slate-100 text-black">U</AvatarFallback>
                               </Avatar>
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black h-6 w-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-lg">1</div>
                         </div>
                         <div className="bg-black/40 backdrop-blur-md px-4 py-0.5 rounded-full border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                               <Heart className="h-2 w-2 text-red-500 fill-current" /> {couples[0].name2}
                            </p>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center space-y-4 opacity-40 animate-pulse">
                      <div className="h-24 w-24 rounded-full border-4 border-white/20 mx-auto flex items-center justify-center">
                         <Users className="h-10 w-10" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest italic">Awaiting Tribal Sync</p>
                   </div>
                 )}
              </div>

              {/* Countdown Sync Engine */}
              <div className="relative z-10 w-full max-w-xs px-4 mb-10">
                 <div className="bg-gradient-to-r from-red-600/80 via-red-500/80 to-red-600/80 backdrop-blur-xl border-2 border-white/20 rounded-full p-2 flex items-center justify-between shadow-2xl">
                    <span className="text-[10px] font-black uppercase italic tracking-widest pl-4">CountDown</span>
                    <div className="flex items-center gap-1.5">
                       <div className="flex flex-col items-center">
                          <div className="bg-red-700/80 rounded-lg px-2 py-1.5 font-black text-lg shadow-inner border border-black/10">{String(timeLeft.days).padStart(2, '0')}</div>
                          <span className="text-[6px] uppercase font-bold text-white/60">Days</span>
                       </div>
                       <span className="font-black text-white">:</span>
                       <div className="flex flex-col items-center">
                          <div className="bg-red-700/80 rounded-lg px-2 py-1.5 font-black text-lg shadow-inner border border-black/10">{String(timeLeft.hours).padStart(2, '0')}</div>
                          <span className="text-[6px] uppercase font-bold text-white/60">Hrs</span>
                       </div>
                       <span className="font-black text-white">:</span>
                       <div className="flex flex-col items-center">
                          <div className="bg-red-700/80 rounded-lg px-2 py-1.5 font-black text-lg shadow-inner border border-black/10">{String(timeLeft.minutes).padStart(2, '0')}</div>
                          <span className="text-[6px] uppercase font-bold text-white/60">Min</span>
                       </div>
                       <span className="font-black text-white">:</span>
                       <div className="flex flex-col items-center">
                          <div className="bg-red-700/80 rounded-lg px-2 py-1.5 font-black text-lg shadow-inner border border-black/10">{String(timeLeft.seconds).padStart(2, '0')}</div>
                          <span className="text-[6px] uppercase font-bold text-white/60">Sec</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Tabs Sync Control */}
           <div className="px-6 flex items-center justify-between gap-4 mb-6">
              <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/5 flex-1">
                 <button 
                   onClick={() => setActiveTab('this')}
                   className={cn(
                     "flex-1 py-2 rounded-full text-[10px] font-black uppercase italic transition-all",
                     activeTab === 'this' ? "bg-gradient-to-b from-red-400 to-red-600 shadow-lg text-white" : "text-white/40"
                   )}
                 >
                    This Week
                 </button>
                 <button 
                   onClick={() => setActiveTab('last')}
                   className={cn(
                     "flex-1 py-2 rounded-full text-[10px] font-black uppercase italic transition-all",
                     activeTab === 'last' ? "bg-gradient-to-b from-red-400 to-red-600 shadow-lg text-white" : "text-white/40"
                   )}
                 >
                    Last Week
                 </button>
              </div>
              <button 
                onClick={() => setActiveTab('rewards')}
                className="bg-gradient-to-b from-yellow-300 to-yellow-600 px-6 py-2 rounded-full text-[10px] font-black uppercase italic text-black shadow-xl"
              >
                 Rewards
              </button>
           </div>

           {/* Ranking Social Graph */}
           <div className="px-4 space-y-4 pb-32">
              {couples.length > 0 ? couples.map((couple, idx) => (
                <div key={idx} className="relative group active:scale-[0.98] transition-all">
                   {/* Main Couple Capsule */}
                   <div className="bg-gradient-to-br from-[#e11d48] to-[#881337] rounded-[2.5rem] p-4 pt-8 border-2 border-[#fb7185]/30 shadow-2xl relative overflow-hidden">
                      {/* Golden Corner Ornaments */}
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-yellow-400/40 rounded-tl-[2.5rem]" />
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-yellow-400/40 rounded-tr-[2.5rem]" />
                      
                      {/* Rank Label Tag */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2">
                         <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 px-8 py-1 rounded-b-xl shadow-lg border-x border-b border-yellow-200">
                            <span className="text-[10px] font-black text-black uppercase italic">No.{couple.rank} Couple</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between">
                         {/* User 1 Avatar */}
                         <div className="flex flex-col items-center gap-1.5">
                            <div className="relative">
                               <Avatar className="h-16 w-16 border-[3px] border-yellow-400/60 shadow-xl">
                                  <AvatarImage src={`https://picsum.photos/seed/u1_${idx}/200`} />
                                  <AvatarFallback>U</AvatarFallback>
                               </Avatar>
                               <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black h-5 w-5 rounded-full flex items-center justify-center font-black text-[10px] border-2 border-white">
                                  {couple.rank}
                               </div>
                            </div>
                            <span className="text-[9px] font-black uppercase truncate w-16 text-center text-white/80">{couple.name1}</span>
                         </div>

                         {/* Center Status Visual */}
                         <div className="flex flex-col items-center gap-2">
                            {couple.status === 'hearts' ? (
                              <div className="relative">
                                 <span className="text-4xl animate-reaction-pulse block">💕</span>
                                 <div className="absolute -top-1 -right-1 bg-yellow-400 h-2 w-2 rounded-full animate-ping" />
                              </div>
                            ) : (
                              <div className="flex gap-1 animate-in zoom-in">
                                 <div className="bg-red-400 p-1.5 rounded-lg rotate-[-10deg] shadow-lg border border-red-300">
                                    <Heart className="h-4 w-4 fill-white text-white" />
                                 </div>
                                 <div className="bg-pink-200 p-1.5 rounded-lg rotate-[10deg] shadow-lg border border-white">
                                    <Heart className="h-4 w-4 fill-white text-white" />
                                 </div>
                              </div>
                            )}
                            <div className="bg-black/20 backdrop-blur-md px-4 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-inner">
                               <GoldCoinIcon className="h-3.5 w-3.5" />
                               <span className="text-xs font-black italic text-yellow-400">{couple.score}</span>
                            </div>
                         </div>

                         {/* User 2 Avatar */}
                         <div className="flex flex-col items-center gap-1.5">
                            <div className="relative">
                               <Avatar className="h-16 w-16 border-[3px] border-yellow-400/60 shadow-xl">
                                  <AvatarImage src={`https://picsum.photos/seed/u2_${idx}/200`} />
                                  <AvatarFallback>U</AvatarFallback>
                               </Avatar>
                               <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black h-5 w-5 rounded-full flex items-center justify-center font-black text-[10px] border-2 border-white">
                                  {couple.rank}
                               </div>
                            </div>
                            <span className="text-[9px] font-black uppercase truncate w-16 text-center text-white/80">{couple.name2}</span>
                         </div>
                      </div>
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center bg-black/10 rounded-[2.5rem] border-2 border-dashed border-white/5 space-y-4">
                   <div className="h-16 w-16 bg-white/5 rounded-full mx-auto flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-white/20" />
                   </div>
                   <div className="space-y-1">
                      <p className="font-black uppercase italic text-white/40">No Rankings Yet</p>
                      <p className="text-[10px] text-white/20 uppercase font-bold">Launch a romantic frequency to top the charts.</p>
                   </div>
                </div>
              )}
           </div>
        </ScrollArea>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}

const ScrollArea = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("overflow-y-auto no-scrollbar", className)}>{children}</div>
);
