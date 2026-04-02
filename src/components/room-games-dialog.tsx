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

// Quick actions like Wafa app
const QUICK_ACTIONS = [
  { id: 'clean', title: 'Clean', icon: Brush, color: 'bg-blue-500/20 text-blue-400' },
  { id: 'public-msg', title: 'Public Msg', icon: MessageSquare, color: 'bg-cyan-500/20 text-cyan-400', badge: true },
  { id: 'gift-effects', title: 'Gift Effects', icon: Gift, color: 'bg-pink-500/20 text-pink-400', badge: true },
];

// Working games only - NO FAKE ICONS
const WORKING_GAMES = [
  { id: 'music', title: 'Music', icon: Music, color: 'bg-red-500/20 text-red-400', hasMusic: true },
  { id: 'carrom', title: 'Carrom', icon: Dices, color: 'bg-orange-500/20 text-orange-400' },
  { id: 'ludo', title: 'Ludo', icon: Dice5, color: 'bg-green-500/20 text-green-400' },
  { id: 'chess', title: 'Chess', icon: Shield, color: 'bg-purple-500/20 text-purple-400' },
  { id: 'fruit-party', title: 'Fruit Party', icon: Heart, color: 'bg-pink-500/20 text-pink-400' },
  { id: 'forest-party', title: 'Forest Party', icon: Flame, color: 'bg-yellow-500/20 text-yellow-400' },
];

/**
 * Wafa-Style Room Games Portal - Bottom Sheet with no blur
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
    if (slug === 'music') {
      onToggleMiniPlayer?.();
      return;
    }
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
        className="w-full h-[85vh] max-w-none m-0 rounded-t-3xl bg-[#1a1a2e] border-none p-0 flex flex-col text-white overflow-hidden"
        style={{ 
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        }}
        // Override default dialog overlay to not blur
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Transparent overlay that doesn't blur background */}
        <div className="fixed inset-0 bg-black/40 z-[-1]" onClick={() => onOpenChange(false)} />
        {/* Handle bar like Wafa */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Quick Actions Row */}
        <div className="flex justify-center gap-6 px-4 py-4 border-b border-white/5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center relative", action.color)}>
                <action.icon className="h-7 w-7" />
                {action.badge && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                )}
              </div>
              <span className="text-[10px] text-white/70 font-medium">{action.title}</span>
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="grid grid-cols-4 gap-3">
              {/* Working Games Only - NO FAKE/PLACEHOLDER GAMES */}
              {WORKING_GAMES.map((game: any) => (
                <button
                  key={game.id}
                  onClick={() => handleGameClick(game.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95",
                    game.id === 'music' && showMiniPlayer
                      ? "bg-cyan-500/20 border border-cyan-500/50" 
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", game.color)}>
                    <game.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] text-white/70 font-medium text-center leading-tight">{game.title}</span>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Close button at bottom */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => onOpenChange(false)}
            className="w-full py-3 bg-white/10 rounded-xl text-white/70 font-medium text-sm active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
