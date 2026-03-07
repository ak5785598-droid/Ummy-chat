
'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { X, Gamepad2, Sparkles } from 'lucide-react';

interface RoomGamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROOM_GAMES = [
  { id: 'fruit-party', name: 'Fruit Party', iconId: 'game-fruit-party', isNew: false, slug: 'fruit-party' },
  { id: 'wild-party', name: 'Wild Party', iconId: 'game-wild-party', isNew: false, slug: 'forest-party' },
  { id: 'ludo', name: 'Ludo', iconId: 'game-ludo', isNew: false, slug: 'ludo' },
];

/**
 * High-Fidelity Room Games Portal.
 * Re-engineered for FULL SCREEN 3D dimension selection.
 */
export function RoomGamesDialog({ open, onOpenChange }: RoomGamesDialogProps) {
  const router = useRouter();

  const handleGameClick = (slug: string) => {
    router.push(`/games/${slug}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none bg-black/95 backdrop-blur-3xl border-none p-0 flex flex-col text-white font-headline shadow-2xl animate-in slide-in-from-bottom duration-500">
        {/* Sovereign Full Screen Header */}
        <DialogHeader className="p-6 pt-12 border-b border-white/5 flex flex-row items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-4">
             <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20 animate-pulse">
                <Gamepad2 className="h-7 w-7 text-black" />
             </div>
             <div>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Game Dimension</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Synchronize Your Reality</DialogDescription>
             </div>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 active:scale-90"
          >
             <X className="h-7 w-7 text-white/60" />
          </button>
        </DialogHeader>

        <ScrollArea className="flex-1">
           <div className="max-w-5xl mx-auto px-8 py-16">
              <div className="flex items-center gap-3 mb-12 px-2">
                 <Sparkles className="h-5 w-5 text-primary animate-reaction-pulse" />
                 <h3 className="text-xl font-black uppercase italic tracking-widest text-white/60">Active Frequencies</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10">
                 {ROOM_GAMES.map((game) => {
                   const asset = PlaceHolderImages.find(img => img.id === game.iconId);
                   return (
                     <button 
                       key={game.id} 
                       onClick={() => handleGameClick(game.slug)}
                       className="flex flex-col items-center gap-6 group active:scale-95 transition-transform"
                     >
                        <div className="relative w-full aspect-square">
                           {/* 3D Depth Layer */}
                           <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-2xl group-hover:border-primary transition-all group-hover:shadow-[0_0_40px_rgba(255,204,0,0.2)] bg-white/5">
                              {asset && (
                                <Image 
                                  src={asset.imageUrl} 
                                  alt={game.name} 
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                                  data-ai-hint={asset.imageHint}
                                  unoptimized // Ensures visual sync bypasses stale CDN caches
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                              
                              {/* Overlay Glow */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>

                           {game.isNew && (
                             <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-red-600 px-4 py-1 rounded-full shadow-xl border-2 border-white/20 z-10 animate-reaction-pulse">
                                <span className="text-[10px] font-black text-white uppercase italic tracking-widest">New</span>
                             </div>
                           )}
                        </div>

                        <div className="text-center space-y-2">
                           <span className="text-sm font-black text-white uppercase tracking-[0.2em] group-hover:text-primary transition-colors block">
                              {game.name}
                           </span>
                           <div className="flex items-center justify-center gap-2">
                              <div className="h-0.5 w-4 rounded-full bg-primary/40 group-hover:w-8 transition-all duration-500" />
                              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">3D Reality</span>
                           </div>
                        </div>
                     </button>
                   );
                 })}
              </div>
           </div>
        </ScrollArea>
        
        <footer className="p-10 text-center border-t border-white/5 bg-black/60 shrink-0">
           <div className="flex flex-col items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">Ummy 3D Graphics Engine Synchronized</p>
              <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-primary/20 w-1/2 animate-loading-bar" />
              </div>
           </div>
        </footer>

        <style jsx>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .animate-loading-bar {
            animation: loading-bar 2s infinite linear;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
