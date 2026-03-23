'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { AppLayout } from '@/components/layout/app-layout';
import { ChevronLeft, HelpCircle, Plus, Heart, Award, Home, CreditCard, Scroll, Loader, Gift as GiftIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { GoldCoinIcon } from '@/components/icons';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';

export default function CpHousePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const backgroundAsset = PlaceHolderImages.find(img => img.id === 'cp-house-bg');

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#fce4ec] flex flex-col relative overflow-hidden font-headline text-white select-none">
        <header className="relative z-50 flex items-center justify-between p-6 pt-12">
           <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full"><ChevronLeft className="h-6 w-6" /></button>
           <h1 className="text-2xl font-black uppercase italic tracking-tighter">Love house</h1>
           <button className="p-2 bg-white/20 rounded-full"><HelpCircle className="h-6 w-6" /></button>
        </header>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
           <div className="absolute inset-0 z-0">
              {backgroundAsset && <Image src={backgroundAsset.imageUrl} alt="Background" fill className="object-cover opacity-90" />}
           </div>
           <div className="relative z-10 text-center space-y-6">
              <Heart className="h-20 w-20 text-pink-500 mx-auto animate-bounce" />
              <h2 className="text-3xl font-black uppercase italic text-pink-600">Partner Frequency</h2>
              <Button className="bg-pink-500 rounded-full h-14 px-10 font-black uppercase italic shadow-xl">Connect Partner</Button>
           </div>
        </main>
      </div>
    </AppLayout>
  );
}
