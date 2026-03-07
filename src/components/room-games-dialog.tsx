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

interface RoomGamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROOM_GAMES = [
  { id: 'fruit-party', name: 'Fruit Party', iconId: 'game-fruit-party', isNew: false, slug: 'fruit-party' },
  { id: 'dragon-battle', name: 'Dragon Battle', iconId: 'game-dragon-battle', isNew: false, slug: 'teen-patti' },
  { id: 'pyramid-battle', name: 'Pyramid Battle', iconId: 'game-pyramid-battle', isNew: false, slug: 'pyramid-battle' },
  { id: 'wild-party', name: 'Wild Party', iconId: 'game-wild-party', isNew: false, slug: 'forest-party' },
  { id: 'aladdin-slot', name: 'Aladdin Slot', iconId: 'game-aladdin-slot', isNew: false, slug: 'fruit-slots' },
  { id: 'jungle-slot', name: 'Jungle Slot', iconId: 'game-jungle-slot', isNew: true, slug: 'fruit-slots' },
  { id: 'lucky-roulette', name: 'Lucky Roulette', iconId: 'game-lucky-roulette', isNew: true, slug: 'fruit-slots' },
  { id: 'win-go', name: 'Win Go', iconId: 'game-win-go', isNew: true, slug: 'fruit-slots' },
  { id: 'ludo', name: 'Ludo', iconId: 'game-ludo', isNew: false, slug: 'ludo' },
];

/**
 * High-Fidelity Room Games Portal.
 * Mirrors the grid UI from the tribal blueprint.
 */
export function RoomGamesDialog({ open, onOpenChange }: RoomGamesDialogProps) {
  const router = useRouter();

  const handleGameClick = (slug: string) => {
    router.push(`/games/${slug}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="p-8 pb-2">
          <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-white/90">Games</DialogTitle>
          <DialogDescription className="sr-only">Choose a 3D frequency game.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 pb-12">
           <div className="grid grid-cols-4 gap-y-8 gap-x-3 pt-4">
              {ROOM_GAMES.map((game) => {
                const asset = PlaceHolderImages.find(img => img.id === game.iconId);
                return (
                  <button 
                    key={game.id} 
                    onClick={() => handleGameClick(game.slug)}
                    className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
                  >
                     <div className="relative">
                        <div className="h-16 w-16 rounded-[1.2rem] overflow-hidden border-2 border-white/10 shadow-lg group-hover:border-primary transition-all">
                           {asset && (
                             <Image 
                               src={asset.imageUrl} 
                               alt={game.name} 
                               width={64} 
                               height={64} 
                               className="object-cover"
                               data-ai-hint={asset.imageHint}
                             />
                           )}
                        </div>
                        {game.isNew && (
                          <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-400 to-red-500 px-1.5 py-0.5 rounded-full shadow-lg border border-white/20 z-10">
                             <span className="text-[7px] font-black text-white uppercase italic tracking-widest">New</span>
                          </div>
                        )}
                     </div>
                     <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter text-center leading-none truncate w-full px-1">
                        {game.name}
                     </span>
                  </button>
                );
              })}
           </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
