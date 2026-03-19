'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { UmmyLogoIcon } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

/**
 * High-Fidelity Official About Dimension.
 * Perfectly mirrored from the provided blueprint screenshot.
 */
export default function AboutPage() {
  const router = useRouter();
  const mascotAsset = PlaceHolderImages.find(img => img.id === 'ummy-mascot');

  return (
    <AppLayout hideSidebarOnMobile hideBottomNav fullScreen>
      <div className="min-h-full bg-[#f8f9fa] font-headline flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
        
        {/* Ambient Top Gradient Sync (Mint/Green vibe from reference) */}
        <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-[#e8f5e9] via-[#f1f8e9] to-transparent opacity-80" />

        <header className="relative z-50 p-6 pt-12 flex items-center">
           <button 
             onClick={() => router.back()} 
             className="p-1 -ml-1 hover:scale-110 transition-transform active:scale-90"
           >
              <ChevronLeft className="h-7 w-7 text-gray-800" strokeWidth={2.5} />
           </button>
           <h1 className="text-xl font-black text-gray-800 absolute left-1/2 -translate-x-1/2">About</h1>
        </header>

        <main className="relative z-50 flex-1 px-6 mt-4">
           <Card className="rounded-[2.5rem] bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col items-center">
              <div className="pt-14 pb-16 flex flex-col items-center gap-4 text-center">
                 {/* High-Fidelity Mascot Frame */}
                 <div className="relative">
                    <div className="absolute inset-0 bg-pink-400/5 blur-2xl rounded-full scale-150" />
                    <div className="h-32 w-32 relative rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-slate-50">
                       {mascotAsset ? (
                         <Image 
                           src={mascutAsset?.imageUrl || 'https://picsum.photos/seed/mascot/400/400'} 
                           alt="Ummy Mascot" 
                           fill 
                           className="object-cover" 
                           data-ai-hint="cute characters"
                           unoptimized
                         />
                       ) : (
                         <UmmyLogoIcon className="h-full w-full" />
                       )}
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">UMMY</h2>
                    <p className="text-[13px] font-bold text-gray-400 tracking-tight">Current Version 1.03.20</p>
                 </div>
              </div>

              {/* Protocol Menu Item */}
              <div className="w-full">
                 <button 
                   onClick={() => router.push('/help-center')}
                   className="w-full flex items-center justify-between p-10 py-12 hover:bg-gray-50 active:bg-gray-100 transition-all text-left group border-t border-gray-50"
                 >
                    <span className="text-[17px] font-black text-gray-700 italic tracking-tight">User Agreement</span>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                 </button>
              </div>
           </Card>
        </main>

        <footer className="p-12 text-center">
           <div className="inline-block h-1.5 w-14 bg-gray-100 rounded-full" />
        </footer>

      </div>
    </AppLayout>
  );
}
