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
import { X, Gamepad2, Sparkles, Camera, Loader } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query } from 'firebase/firestore';
import { useGameLogoUpload } from '@/hooks/use-game-logo-upload';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

interface RoomGamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FALLBACK_GAMES = [
  { id: 'fishing-master', title: 'Fishing Master', iconId: 'underwater fishing arcade', isNew: true, slug: 'fishing-master' },
  { id: 'chirag-slot', title: 'Chirag Slot', iconId: 'game-aladdin', isNew: false, slug: 'chirag-slot' },
  { id: 'lion-fight', title: 'Lion Fight', iconId: 'game-lion-fight', isNew: false, slug: 'lion-fight' },
  { id: 'roulette', title: 'Roulette', iconId: 'game-roulette', isNew: false, slug: 'roulette' },
  { id: 'fruit-party', title: 'Fruit Party', iconId: 'game-fruit-party', isNew: false, slug: 'fruit-party' },
  { id: 'wild-party', title: 'Wild Party', iconId: 'game-wild-party', isNew: false, slug: 'forest-party' },
  { id: 'ludo', title: 'Ludo', iconId: 'game-ludo', isNew: false, slug: 'ludo' },
];

/**
 * High-Fidelity Room Games Portal.
 * Features the new Fishing Master flagship frequency.
 */
export function RoomGamesDialog({ open, onOpenChange }: RoomGamesDialogProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { isUploading, uploadGameLogo } = useGameLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameSlug, setSelectedGameSlug] = useState<string | null>(null);

  const isSovereign = user?.uid === CREATOR_ID;

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'games'));
  }, [firestore, user]);

  const { data: firestoreGames } = useCollection(gamesQuery);

  const activeGames = useMemo(() => {
    return FALLBACK_GAMES.map(fb => {
      const match = firestoreGames?.find(g => g.slug === fb.slug);
      return match ? { ...fb, ...match } : fb;
    });
  }, [firestoreGames]);

  const handleGameClick = (slug: string) => {
    router.push(`/games/${slug}`);
    onOpenChange(false);
  };

  const handleLogoChangeClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGameSlug(slug);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGameSlug) {
      const game = activeGames.find(g => g.slug === selectedGameSlug);
      if (game) {
        uploadGameLogo(game as any, file);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-none m-0 rounded-none bg-black/95 backdrop-blur-3xl border-none p-0 flex flex-col text-white font-headline shadow-2xl animate-in slide-in-from-bottom duration-500">
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

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
                 {activeGames.map((game) => {
                   const assetId = (game as any).iconId || `game-${game.slug}`;
                   const asset = PlaceHolderImages.find(img => img.id === assetId);
                   const displayUrl = (game as any).coverUrl || asset?.imageUrl || 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1000';

                   return (
                     <div 
                       key={game.slug} 
                       className="flex flex-col items-center gap-6 group relative"
                     >
                        <div className="relative w-full aspect-square">
                           <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           <button 
                             onClick={() => handleGameClick(game.slug)}
                             className="relative w-full h-full rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-2xl group-hover:border-primary transition-all group-hover:shadow-[0_0_40px_rgba(255,204,0,0.2)] bg-white/5 active:scale-95 transform-gpu"
                           >
                              {displayUrl ? (
                                <Image 
                                  key={displayUrl}
                                  src={displayUrl} 
                                  alt={game.title} 
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                                  unoptimized 
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full">
                                   <Gamepad2 className="h-12 w-12 text-white/20" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           </button>

                           {isSovereign && (
                             <button 
                               onClick={(e) => handleLogoChangeClick(e, game.slug)}
                               className="absolute top-2 right-2 bg-primary text-black p-2 rounded-full z-30 shadow-xl border border-white hover:scale-110 transition-all active:scale-90"
                             >
                                {isUploading && selectedGameSlug === game.slug ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                             </button>
                           )}

                           {(game as any).isNew && (
                             <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-red-600 px-4 py-1 rounded-full shadow-xl border-2 border-white/20 z-10 animate-reaction-pulse">
                                <span className="text-[10px] font-black text-white uppercase italic tracking-widest">New</span>
                             </div>
                           )}
                        </div>

                        <div className="text-center space-y-2">
                           <span className="text-sm font-black text-white uppercase tracking-[0.2em] group-hover:text-primary transition-colors block">
                              {game.title}
                           </span>
                           <div className="flex items-center justify-center gap-2">
                              <div className="h-0.5 w-4 rounded-full bg-primary/40 group-hover:w-8 transition-all duration-500" />
                              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">3D Reality</span>
                           </div>
                        </div>
                     </div>
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
