'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Compass, Loader } from 'lucide-react';

export default function DiscoverPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 text-center px-8 font-headline animate-in fade-in duration-1000">
        <div className="h-24 w-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-xl border-2 border-primary/20 animate-pulse">
          <Compass className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Discover Dimension</h1>
          <p className="text-muted-foreground font-body text-lg italic">The tribal radar is scanning for new frequencies...</p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/50 px-6 py-3 rounded-2xl border border-gray-100 shadow-inner">
           <Loader className="h-4 w-4 animate-spin text-primary" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Synchronizing Global Vibes</span>
        </div>
      </div>
    </AppLayout>
  );
}
