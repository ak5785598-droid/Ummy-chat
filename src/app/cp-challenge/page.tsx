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

export default function CpChallengePage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 5, hours: 10, minutes: 2, seconds: 58 });
  const heroAsset = PlaceHolderImages.find(img => img.id === 'cp-challenge-hero');

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#800020] flex flex-col relative overflow-hidden font-headline text-white select-none">
        <header className="relative z-50 flex items-center justify-between p-6 pt-12">
           <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white"><ChevronLeft className="h-6 w-6" /></button>
           <h1 className="text-2xl font-black uppercase italic tracking-tighter">Couple Challenge</h1>
           <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white"><RefreshCw className="h-6 w-6" /></button>
        </header>

        <ScrollArea className="flex-1">
           <div className="relative h-[55vh] flex flex-col items-center justify-center">
              <div className="absolute inset-0 z-0">
                 {heroAsset && <Image src={heroAsset.imageUrl} alt="Hero" fill className="object-cover opacity-80" />}
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#800020]" />
              </div>
              <div className="relative z-10 text-center animate-pulse">
                 <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                 <p className="text-xl font-black uppercase italic tracking-widest">Awaiting Ranking Sync</p>
              </div>
           </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
