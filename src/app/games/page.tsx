'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GameControllerIcon } from "@/components/icons";
import { Play, Sparkles, Zap, Flame, Star, Trophy, Users, Camera, Loader, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser, useMemoFirebase, useUserProfile } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useGameLogoUpload } from '@/hooks/use-game-logo-upload';

const FALLBACK_GAMES = [
  { id: 'fallback-ludo', title: 'Ludo Masters', slug: 'ludo', coverUrl: 'https://picsum.photos/seed/ludo-pro/600/600', imageHint: 'ludo board' },
  { id: 'fallback-fruit', title: 'Fruit Party', slug: 'fruit-party', coverUrl: 'https://picsum.photos/seed/fruit-party/600/600', imageHint: 'vibrant fruits' },
  { id: 'fallback-wild', title: 'Wild Party', slug: 'forest-party', coverUrl: 'https://picsum.photos/seed/forest-party/600/600', imageHint: 'forest animals' },
  { id: 'fallback-slot', title: 'Lucky Slot 777', slug: 'lucky-slot-777', coverUrl: 'https://picsum.photos/seed/lucky777/600/600', imageHint: 'lucky 777 slot' },
  { id: 'fallback-teen', title: 'Teen Patti', slug: 'teen-patti', coverUrl: 'https://picsum.photos/seed/teenpatti/600/600', imageHint: 'dragon card' },
];

export default function GamesPage() {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { isUploading, uploadGameLogo } = useGameLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Generate random live counts on client side only to avoid hydration mismatch
    const counts: Record<string, number> = {};
    FALLBACK_GAMES.forEach(g => {
      counts[g.id] = Math.floor(Math.random() * 500) + 100;
    });
    setLiveCounts(counts);
  }, []);

  const isAdmin = userProfile?.tags?.includes('Admin') || userProfile?.tags?.includes('Official');

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'games'), orderBy('title', 'asc'));
  }, [firestore, user]);

  const { data: firestoreGames, isLoading: isGamesLoading } = useCollection(gamesQuery);

  const activeGames = useMemo(() => {
    if (firestoreGames && firestoreGames.length > 0) return firestoreGames;
    return FALLBACK_GAMES;
  }, [firestoreGames]);

  const handleLogoChangeClick = (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGameId(gameId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGameId) {
      uploadGameLogo(selectedGameId, file);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0a0514] text-white relative">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

        <div className="relative z-10 space-y-10 max-w-7xl mx-auto p-6 pb-32">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-3xl shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                 <GameControllerIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                 <h1 className="font-headline text-5xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                   Tribe Game Zone
                 </h1>
                 <p className="text-muted-foreground font-body text-lg italic opacity-60">Infinite frequencies. One tribe.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="bg-white/5 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-black italic tracking-tight">12,450 LIVE</span>
               </div>
            </div>
          </header>

          <section className="space-y-8">
             <div className="flex items-center gap-3 px-2">
                <Flame className="h-6 w-6 text-orange-500 fill-current" />
                <h3 className="font-headline text-2xl font-black uppercase italic tracking-widest text-white/80">Active Frequencies</h3>
             </div>

             {isGamesLoading ? (
               <div className="flex justify-center py-20"><Loader className="animate-spin text-primary h-10 w-10" /></div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {activeGames.map((game, i) => (
                    <div key={game.id} className="group relative flex flex-col">
                      <Link href={`/games/${game.slug}`} className="block">
                        <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden border-2 border-white/5 shadow-xl transition-all duration-500 group-hover:border-purple-500 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] group-hover:-translate-y-2">
                           <Image 
                             src={game.coverUrl} 
                             alt={game.title} 
                             fill 
                             className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                             data-ai-hint={game.imageHint}
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0514] via-transparent to-transparent opacity-60" />
                           
                           {isAdmin && (
                             <button 
                               onClick={(e) => handleLogoChangeClick(e, game.id)}
                               className="absolute top-4 right-4 bg-black/60 p-2 rounded-full border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-primary hover:text-black"
                             >
                               {isUploading && selectedGameId === game.id ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                             </button>
                           )}

                           <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[10px] font-black text-white/80">{(liveCounts[game.id] || 100).toLocaleString()}</span>
                           </div>
                        </div>
                        
                        <div className="mt-4 px-2 space-y-1">
                           <h4 className="font-black text-sm uppercase italic truncate group-hover:text-purple-400 transition-colors">{game.title}</h4>
                           <div className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-white/20" />
                              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Skill Frequency</span>
                           </div>
                        </div>
                      </Link>
                    </div>
                  ))}
               </div>
             )}
          </section>

          <section className="pt-16">
             <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-12 rounded-[4rem] border border-white/5 flex flex-col items-center text-center space-y-6">
                <Trophy className="h-16 w-10 text-yellow-500" />
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Become a Frequency Master</h3>
                <p className="text-white/40 max-w-md font-body text-base">Top tribe members earn exclusive avatar frames and elite badges every 24 hours. Start your win streak today.</p>
                <div className="flex gap-4">
                   <Button variant="outline" className="rounded-full px-8 border-white/10 text-white/60 font-black uppercase italic text-xs hover:bg-white/5">Ranking History</Button>
                   <Button className="rounded-full px-8 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase italic text-xs shadow-xl shadow-purple-600/20">Claim Rewards</Button>
                </div>
             </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
