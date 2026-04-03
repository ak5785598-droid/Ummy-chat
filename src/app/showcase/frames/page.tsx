'use client';

import React, { useState } from 'react';
import { AvatarFrame } from '@/components/avatar-frame';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function FrameShowcasePage() {
  const [search, setSearch] = useState('');
  const frames = Object.values(AVATAR_FRAMES);
  
  const filteredFrames = frames.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.tier.toLowerCase().includes(search.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'legendary': return 'text-orange-500';
      case 'mythic': return 'text-purple-500';
      case 'luxury': return 'text-yellow-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 pb-24 font-sans">
      <header className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-purple-500 mb-4">
          Elite Frame Armory
        </h1>
        <p className="text-slate-400 text-lg uppercase tracking-[0.2em] font-bold">
          19 Premium 3D Dimensions for the Digital Tribe
        </p>
        
        <div className="max-w-md mx-auto mt-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search Frame / Tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 rounded-full focus:border-purple-500 transition-all"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {filteredFrames.map((frame) => (
          <Card key={frame.id} className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl hover:border-slate-700 transition-all group overflow-visible">
            <CardContent className="p-6 pt-10 flex flex-col items-center gap-6">
              {/* Frame Preview */}
              <div className="relative transform group-hover:scale-110 transition-transform duration-500">
                <AvatarFrame frameId={frame.id} size="xl">
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">
                    👤
                  </div>
                </AvatarFrame>
              </div>

              {/* Info */}
              <div className="text-center space-y-1 w-full">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">{frame.name}</h3>
                <div className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 border border-white/5 inline-block",
                  getTierColor(frame.tier)
                )}>
                  {frame.tier}
                </div>
              </div>

              {/* Technical Tag */}
              <div className="mt-2 text-[8px] font-mono text-slate-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                ID: {frame.id} | Anim: {frame.animationType}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      {/* Background Decor */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

// Utility class merger helper
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
