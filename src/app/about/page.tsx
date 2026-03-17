'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { UmmyLogoIcon } from '@/components/icons';
import { Card } from '@/components/ui/card';

/**
 * High-Fidelity Official About Dimension.
 * Mirrored exactly from the blueprint.
 */
export default function AboutPage() {
  const router = useRouter();

  return (
    <AppLayout hideSidebarOnMobile hideBottomNav>
      <div className="min-h-full bg-[#f8f9fa] font-headline flex flex-col animate-in fade-in duration-700 overflow-hidden relative">
        
        {/* Soft Ambient Header Background Sync */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#e0f2f1] to-transparent opacity-60" />

        <header className="relative z-50 p-6 pt-10 flex items-center justify-between">
           <button 
             onClick={() => router.back()} 
             className="p-2 -ml-2 hover:bg-white/40 rounded-full transition-all active:scale-90"
           >
              <ChevronLeft className="h-7 w-7 text-gray-800" />
           </button>
           <h1 className="text-xl font-black uppercase italic tracking-tight flex-1 text-center pr-10">About</h1>
        </header>

        <main className="relative z-50 flex-1 px-6 mt-4">
           <Card className="rounded-[2.5rem] bg-white border-none shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col items-center">
              <div className="pt-12 pb-16 flex flex-col items-center gap-4">
                 {/* High-Fidelity Mascot Frame */}
                 <div className="relative">
                    <div className="absolute inset-0 bg-pink-400/10 blur-2xl rounded-full" />
                    <div className="h-32 w-32 relative rounded-full overflow-hidden border-4 border-white shadow-2xl">
                       <UmmyLogoIcon className="h-full w-full" />
                    </div>
                 </div>

                 <div className="text-center space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">UMMY</h2>
                    <p className="text-sm font-bold text-gray-400">Current Version 1.03.20</p>
                 </div>
              </div>

              {/* Legal Protocols List */}
              <div className="w-full border-t border-gray-50">
                 <button 
                   onClick={() => router.push('/help-center')}
                   className="w-full flex items-center justify-between p-8 hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
                 >
                    <span className="text-lg font-black text-gray-700 italic tracking-tight">User Agreement</span>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                 </button>
              </div>
           </Card>
        </main>

        <footer className="p-10 text-center">
           <div className="inline-block h-1 w-12 bg-gray-200 rounded-full" />
        </footer>

      </div>
    </AppLayout>
  );
}
