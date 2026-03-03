
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Floating Heart Component for SVGA Animation feel.
 */
const FloatingHeart = ({ style }: { style: React.CSSProperties }) => (
  <div className="absolute pointer-events-none animate-reaction-float opacity-40 select-none" style={style}>
    <svg viewBox="0 0 24 24" className="fill-pink-400 drop-shadow-lg" width="24" height="24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </div>
);

/**
 * CP House - High-Fidelity Love House Dimension.
 * Re-engineered with SVGA-style background animation.
 */
export default function CpHousePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);

  const backgroundAsset = PlaceHolderImages.find(img => img.id === 'cp-house-bg');
  const ringAsset = PlaceHolderImages.find(img => img.id === 'propose-ring');

  const handleSendProposeRing = async () => {
    if (!user || !firestore || !userProfile) return;
    
    const ringCost = 100000;
    if ((userProfile.wallet?.coins || 0) < ringCost) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Head to the vault to recharge.' });
      return;
    }

    setIsSending(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);

      const updateData = {
        'wallet.coins': increment(-ringCost),
        'updatedAt': serverTimestamp()
      };

      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);

      // Trigger Cinematic SVGA-Style Animation
      setActiveGiftAnimation('propose-ring');
      setIsProposeDialogOpen(false);
      
      toast({ title: 'Propose Sent!', description: 'Your romantic vibe is synchronized.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Proposal Failed', description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#fce4ec] flex flex-col relative overflow-hidden font-headline text-white select-none">
        
        <GiftAnimationOverlay giftId={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />

        {/* Cinematic Romantic Background */}
        <div className="absolute inset-0 z-0">
           {backgroundAsset && (
             <Image 
               src={backgroundAsset.imageUrl} 
               alt="CP House Background" 
               fill 
               className="object-cover opacity-90 scale-105" 
               priority
             />
           )}
           {/* SVGA Floating Vibe Engine */}
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <FloatingHeart style={{ top: '15%', left: '10%', animationDelay: '0s', transform: 'scale(1.2)' }} />
              <FloatingHeart style={{ top: '40%', left: '85%', animationDelay: '1.5s', transform: 'scale(0.8)' }} />
              <FloatingHeart style={{ top: '70%', left: '15%', animationDelay: '3s', transform: 'scale(1.5)' }} />
              <FloatingHeart style={{ top: '25%', left: '70%', animationDelay: '0.5s', transform: 'scale(1)' }} />
              <FloatingHeart style={{ top: '80%', left: '60%', animationDelay: '2s', transform: 'scale(0.7)' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/10 to-[#880e4f]/40" />
           </div>
        </div>

        {/* Top Navigation Bar */}
        <header className="relative z-50 flex items-center justify-between p-6 pt-12">
           <button 
             onClick={() => router.back()} 
             className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white shadow-lg active:scale-90 transition-transform border border-white/10"
           >
              <ChevronLeft className="h-6 w-6" />
           </button>
           <h1 className="text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">Love house</h1>
           <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white shadow-lg border border-white/10">
              <HelpCircle className="h-6 w-6" />
           </button>
        </header>

        {/* CP Rank Badge */}
        <div className="relative z-50 flex justify-end px-6 mt-4">
           <div className="bg-gradient-to-r from-orange-400 to-orange-600 pl-4 pr-1 py-1 rounded-full flex items-center gap-2 shadow-xl border border-white/20">
              <span className="text-[10px] font-black uppercase italic tracking-widest text-white">CP Rank</span>
              <div className="bg-amber-200 rounded-full p-1 border border-amber-600 shadow-inner">
                 <Award className="h-3 w-3 text-amber-800" />
              </div>
           </div>
        </div>

        {/* Main Sync Portal: Dual Avatars */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-10">
           <div className="flex items-center gap-8 mb-12">
              {/* User Identity */}
              <div className="flex flex-col items-center gap-3">
                 <div className="relative">
                    <div className="h-28 w-28 rounded-full border-[6px] border-cyan-400 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-md">
                       <Avatar className="h-full w-full">
                          <AvatarImage src={userProfile?.avatarUrl} />
                          <AvatarFallback className="text-3xl bg-slate-100 text-black">{(userProfile?.username || 'U').charAt(0)}</AvatarFallback>
                       </Avatar>
                    </div>
                    <div className="absolute -top-2 -left-2 bg-cyan-500 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                       <span className="font-black text-xs">{(userProfile?.username || 'U').charAt(0)}</span>
                    </div>
                 </div>
                 <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 shadow-lg">
                    <p className="text-xs font-black uppercase tracking-tight truncate w-24 text-center">{userProfile?.username}</p>
                 </div>
              </div>

              {/* Heart Centerpiece */}
              <div className="relative">
                 <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-40 scale-150 animate-pulse" />
                 <span className="text-6xl drop-shadow-2xl filter saturate-150 animate-reaction-heartbeat block relative z-10">❤️</span>
              </div>

              {/* Partner Placeholder */}
              <div className="flex flex-col items-center gap-3">
                 <div 
                   className="relative group cursor-pointer active:scale-95 transition-transform"
                   onClick={() => setIsProposeDialogOpen(true)}
                 >
                    <div className="h-28 w-28 rounded-full border-[6px] border-white shadow-2xl flex items-center justify-center bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors">
                       <Plus className="h-12 w-12 text-white/60 group-hover:text-white transition-colors" />
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsProposeDialogOpen(true)}
                   className="bg-gradient-to-r from-orange-400 to-red-500 px-8 py-1.5 rounded-full font-black uppercase text-xs shadow-xl border border-white/20 active:scale-90 transition-transform"
                 >
                    ADD
                 </button>
              </div>
           </div>

           {/* CP Decoration Vault */}
           <div className="w-full max-w-sm px-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border-4 border-white/10">
                 {/* Decoration Header Pill */}
                 <div className="flex justify-center -mt-9 mb-8">
                    <div className="bg-gradient-to-r from-pink-400 to-pink-600 px-12 py-1.5 rounded-full shadow-lg border border-white/20">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">CP decoration</span>
                    </div>
                 </div>

                 {/* Icons Grid */}
                 <div className="grid grid-cols-5 gap-4">
                    {[
                      { label: 'CP token', icon: Heart, color: 'text-pink-400' },
                      { label: 'CP house', icon: Home, color: 'text-pink-400' },
                      { label: 'CP card', icon: CreditCard, color: 'text-pink-400' },
                      { label: 'Entry strip', icon: Scroll, color: 'text-pink-400' },
                      { label: 'Propose ring', icon: GiftIcon, color: 'text-pink-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer active:scale-90 transition-transform">
                         <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-md border border-pink-50 relative overflow-hidden group-hover:shadow-lg">
                            <div className="absolute inset-0 bg-pink-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <item.icon className={cn("h-7 w-7 relative z-10", item.color)} />
                         </div>
                         <span className="text-[8px] font-black uppercase text-white text-center leading-tight tracking-tighter drop-shadow-md">
                            {item.label}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </main>

        {/* Propose Ring Dialog */}
        <Dialog open={isProposeDialogOpen} onOpenChange={setIsProposeDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-10 duration-500 font-headline">
            <DialogHeader className="p-8 pb-4 text-center border-b">
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-pink-600">Propose Identity</DialogTitle>
              <DialogDescription className="sr-only">Sync with your partner using the elite Propose Ring.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-8 flex flex-col items-center">
               <div className="relative h-48 w-48 rounded-[2rem] overflow-hidden border-4 border-pink-100 shadow-xl bg-pink-50 flex items-center justify-center">
                  {ringAsset && (
                    <Image 
                      src={ringAsset.imageUrl} 
                      alt="Propose Ring" 
                      fill 
                      className="object-cover transition-transform group-hover:scale-110" 
                      data-ai-hint={ringAsset.imageHint} 
                    />
                  )}
               </div>
               
               <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Propose Ring</h3>
                  <div className="flex items-center justify-center gap-2 text-2xl font-black text-primary italic">
                     <GoldCoinIcon className="h-8 w-8" />
                     100,000
                  </div>
                  <p className="text-xs text-muted-foreground font-body italic max-w-[240px] mx-auto">
                    Synchronize your frequency with a partner. Triggers a full-screen box opening cinematic animation.
                  </p>
               </div>
            </div>
            <DialogFooter className="p-8 pt-0">
               <Button 
                 onClick={handleSendProposeRing}
                 disabled={isSending}
                 className="w-full h-16 rounded-[1.5rem] bg-gradient-to-r from-pink-500 to-red-600 text-white font-black uppercase italic text-xl shadow-xl shadow-pink-500/20 active:scale-95 transition-all"
               >
                  {isSending ? <Loader className="mr-2 h-6 w-6 animate-spin" /> : <Heart className="mr-2 h-6 w-6 fill-current" />}
                  Propose Now
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer Sync Indicator */}
        <footer className="relative z-50 p-10 text-center">
           <div className="inline-block h-1 w-12 bg-white/20 rounded-full" />
        </footer>

      </div>
    </AppLayout>
  );
}
