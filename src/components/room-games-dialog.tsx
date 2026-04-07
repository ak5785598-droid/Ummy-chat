'use client';

import React, { useState, useRef, useMemo } from 'react';
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
import { X, Gamepad2, Sparkles, Camera, Loader, Music, Brush, MessageSquare, Gift, Sword, Shield, Calculator, Image as ImageIcon, Hand, Dices, Leaf, Flame, Heart, CircleDollarSign, Diamond, TreePine, Dice5, Coins, Car, Tent } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useGameLogoUpload } from '@/hooks/use-game-logo-upload';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

interface RoomGamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGame?: (slug: string) => void;
  onToggleMiniPlayer?: () => void;
  roomHasMusic?: boolean;
  showMiniPlayer?: boolean;
}

// Premium 3D Game Assets
const WORKING_GAMES = [
  { 
    id: 'carrom', 
    title: 'Carrom', 
    thumbnail: '/images/premium_3d_carrom_game_icon_1775544440234.png',
    color: 'from-orange-500 to-orange-600' 
  },
  { 
    id: 'ludo', 
    title: 'Ludo', 
    thumbnail: '/images/premium_3d_ludo_game_icon_1775544459753.png',
    color: 'from-green-500 to-emerald-600' 
  },
  { 
    id: 'chess', 
    title: 'Chess', 
    thumbnail: '/images/premium_3d_chess_game_icon_1775544479327.png',
    color: 'from-purple-500 to-indigo-600' 
  },
  { 
    id: 'fruit-party', 
    title: 'Fruit Party', 
    thumbnail: '/images/premium_3d_fruit_party_game_icon_1775544501942.png',
    color: 'from-pink-500 to-rose-600' 
  },
  { 
    id: 'forest-party', 
    title: 'Forest Party', 
    thumbnail: '/images/premium_3d_forest_party_game_icon_1775544521843.png',
    color: 'from-yellow-500 to-amber-600' 
  },
];

/**
 * Modern Room Games Portal - Compact & Premium
 */
export function RoomGamesDialog({ open, onOpenChange, onSelectGame, onToggleMiniPlayer, roomHasMusic, showMiniPlayer }: RoomGamesDialogProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { isUploading, uploadGameLogo } = useGameLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameSlug, setSelectedGameSlug] = useState<string | null>(null);

  const isSovereign = user?.uid === CREATOR_ID;

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
        className="w-full max-h-[55vh] h-fit max-w-[480px] rounded-t-[2.5rem] bg-[#0c0c14] border-t border-white/10 p-0 flex flex-col text-white overflow-hidden shadow-2xl fixed bottom-0 left-1/2 -translate-x-1/2"
        style={{ 
          boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Transparent overlay that doesn't blur background */}
        <div className="fixed inset-0 bg-black/60 z-[-1]" onClick={() => onOpenChange(false)} />
        
        {/* Wafa-style Pull Bar */}
        <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* View Title */}
        <div className="px-6 pb-2 shrink-0">
          <h2 className="text-xl font-black text-white/90 uppercase tracking-tighter">Choose Your Tribe Game</h2>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">Frequency-Ready Experiences</p>
        </div>

        {/* Games Grid */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="grid grid-cols-4 gap-4 pb-4">
            {WORKING_GAMES.map((game: any) => (
              <button
                key={game.id}
                onClick={() => handleGameClick(game.id)}
                className="flex flex-col items-center gap-3 transition-all active:scale-90 group"
              >
                <div className="relative h-16 w-16 rounded-[1.4rem] overflow-hidden shadow-lg border border-white/5 bg-white/5">
                  <Image 
                    src={game.thumbnail} 
                    alt={game.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-tight text-center truncate w-full">
                  {game.title}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Close button at bottom */}
        <div className="p-5 pt-2 border-t border-white/5 bg-black/20 shrink-0">
          <button 
            onClick={() => onOpenChange(false)}
            className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all border border-white/5"
          >
            Purify View
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
