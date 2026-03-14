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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

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
 */
export default function CpChallengePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [timeLeft, setTimeLeft] = useState({ days: 5, hours: 10, minutes: 2, seconds: 58 });

  const rankingConfigRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'rankings'), [firestore]);
  const { data: rankingsConfig } = useDoc(rankingConfigRef);

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
  const couples: any[] = [];

  const cpBackground = rankingsConfig?.cp;

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#800020] flex flex-col relative overflow-hidden font-headline text-white select-none">
        
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
           <div className="relative h-[55vh] flex flex-col items-center">
              <div className="absolute inset-0 z-0">
                 {cpBackground ? (
                   <Image src={cpBackground} alt="Dynamic BG" fill className="object-cover opacity-80 animate-in fade-in duration-1000" unoptimized />
                 ) : heroAsset && (
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

              <div className="relative z-10 mt-4 animate-in slide-in-from-top-10 duration-1000">
                 <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-2xl animate-pulse rounded-full" />
                    <div className="relative bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] border-[3px] border-[#fde68a] px-12 py-3 rounded-full shadow-2xl animate-shimmer-gold overflow-hidden">
                       <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                         Couple Challenge
                       </h2>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                       <div className="bg-pink-500 p-1.5 rounded-full shadow-lg animate-reaction-heartbeat">
                          <Heart className="h-4 w-4 fill-current" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="relative z-10 flex-1 flex items-center justify-center w-full px-8">
                 <div className="text-center space-y-4 opacity-40 animate-pulse">
                    <div className="h-24 w-24 rounded-full border-4 border-white/20 mx-auto flex items-center justify-center">
                       <Users className="h-10 w-10" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest italic">Awaiting Ranking Sync</p>
                 </div>
              </div>

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

           <div className="px-4 space-y-4 pb-32">
              <div className="py-20 text-center bg-black/10 rounded-[2.5rem] border-2 border-dashed border-white/5 space-y-4">
                 <div className="h-16 w-16 bg-white/5 rounded-full mx-auto flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-white/20" />
                 </div>
                 <div className="space-y-1">
                    <p className="font-black uppercase italic text-white/40">No Rankings Yet</p>
                    <p className="text-[10px] text-white/20 uppercase font-bold">Launch a romantic frequency to top the charts.</p>
                 </div>
              </div>
           </div>
        </ScrollArea>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
