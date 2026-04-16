'use client';

import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

interface RoomGamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGame?: (slug: string) => void;
  onToggleMiniPlayer?: () => void;
  roomHasMusic?: boolean;
  showMiniPlayer?: boolean;
}

const WORKING_GAMES = [
  { 
    id: 'carrom', 
    title: 'Carrom', 
    thumbnail: '/images/premium_3d_carrom_game_icon_1775544440234.png'
  },
  { 
    id: 'ludo', 
    title: 'Ludo', 
    thumbnail: '/images/premium_3d_ludo_game_icon_1775544459753.png'
  },
  { 
    id: 'chess', 
    title: 'Chess', 
    thumbnail: '/images/premium_3d_chess_game_icon_1775544479327.png'
  },
  { 
    id: 'fruit-party', 
    title: 'Fruit Party', 
    thumbnail: '/images/premium_3d_fruit_party_game_icon_1775544501942.png'
  },
  { 
    id: 'forest-party', 
    title: 'Forest Party', 
    thumbnail: '/images/premium_3d_forest_party_game_icon_1775544521843.png'
  },
  { 
    id: 'roulette', 
    title: 'Roulette', 
    thumbnail: '/images/premium_3d_roulette_game_icon.png'
  },
  { 
    id: 'teen-patti', 
    title: '3 Patti', 
    thumbnail: '/images/premium_3d_teen_patti_game_icon.png'
  },
];

export function RoomGamesDialog({ open, onOpenChange, onSelectGame }: RoomGamesDialogProps) {
  const router = useRouter();
  const { user } = useUser();

  const handleGameClick = (slug: string) => {
    if (onSelectGame) {
      onSelectGame(slug);
    } else {
      router.push(`/games/${slug}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        // z-[999] ensures this stays on top of the other control panel
        className="w-full max-w-[480px] rounded-t-[2.5rem] bg-[#0c0c14] border-t border-white/10 p-0 flex flex-col text-white overflow-hidden shadow-2xl fixed bottom-0 left-1/2 -translate-x-1/2 outline-none translate-y-0 z-[999]"
        style={{ 
          boxShadow: '0 -15px 50px rgba(0,0,0,0.9)',
          margin: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0
        }}
      >
        {/* Transparent Overlay for click-away */}
        <div className="fixed inset-0 bg-black/40 -z-10" onClick={() => onOpenChange(false)} />

        {/* Pull Bar */}
        <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Title Section */}
        <div className="px-6 pb-2 shrink-0">
          <h2 className="text-xl font-extrabold text-white/95 uppercase tracking-tighter">Games</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">Frequency-Ready Experiences</p>
        </div>

        {/* Games Grid - 2 Rows focus with Scroll */}
        <ScrollArea className="flex-1 px-4 pt-4 pb-8 max-h-[300px]">
          <div className="grid grid-cols-4 gap-y-6 gap-x-4 pb-10">
            {WORKING_GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameClick(game.id)}
                className="flex flex-col items-center gap-2 transition-all active:scale-90 group"
              >
                <div className="relative h-16 w-16 rounded-[1.4rem] overflow-hidden shadow-lg border border-white/10 bg-white/5">
                  <Image 
                    src={game.thumbnail} 
                    alt={game.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                  />
                  {/* Subtle Glow behind icons */}
                  <div className="absolute inset-0 bg-white/5 group-active:bg-white/10" />
                </div>
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-tight text-center truncate w-full">
                  {game.title}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Extra safe space at the very bottom for mobile home indicators */}
        <div className="h-4 w-full bg-[#0c0c14]" />
      </DialogContent>
    </Dialog>
  );
}

