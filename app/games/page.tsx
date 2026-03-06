'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GameControllerIcon } from "@/components/icons";
import { Play, Sparkles, Zap, Flame, Star, Trophy, Users, Camera, Loader, Box } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, orderBy } from 'firebase/firestore';
import { useGameLogoUpload } from '@/hooks/use-game-logo-upload';
import type { Game } from '@/lib/types';

const FALLBACK_GAMES: Game[] = [
  { id: 'fallback-fruit-slots', title: 'Fruit Slots', slug: 'fruit-slots', coverUrl: 'https://images.unsplash.com/photo-1611080634139-6c8821f5f6ca?q=80&w=1000', cost: 0, imageHint: '3d lemon fruit slots' },
  { id: 'fallback-ludo', title: 'Ludo Masters', slug: 'ludo', coverUrl: '', cost: 0, imageHint: '3d ludo board' },
  { id: 'fallback-fruit', title: 'Fruit Party', slug: 'fruit-party', coverUrl: 'https://images.unsplash.com/photo-1611080634139-6c8821f5f6ca?q=80&w=1000', cost: 0, imageHint: '3d fruit icons' },
  { id: 'fallback-wild', title: 'Wild Party', slug: 'forest-party', coverUrl: '', cost: 0, imageHint: '3d lion head' },
  { id: 'fallback-slot', title: 'Lucky Slot 777', slug: 'lucky-slot-777', coverUrl: '', cost: 0, imageHint: '3d slot machine' },
  { id: 'fallback-pyramid', title: 'Pyramid Battle', slug: 'pyramid-battle', coverUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=1000', cost: 0, imageHint: 'egyptian pyramid' },
  { id: 'fallback-teen', title: 'Dragon Battle', slug: 'teen-patti', coverUrl: '', cost: 0, imageHint: '3d dragon character' },
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
    const counts: Record<string, number> = {};
    FALLBACK_GAMES.forEach(g => {
      counts[g.slug] = Math.floor(Math.random() * 500) + 100;
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
    return FALLBACK_GAMES.map(fb => {
      const match = firestoreGames?.find(g => g.slug === fb.slug || g.id === fb.id);
      return match ? { ...fb, ...match } : fb;
    });
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
      const game = activeGames.find(g => g.id === selectedGameId);
      if (game) {
        uploadGameLogo(game, file);
      }
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0a0514] text-white relative perspective-1000 overflow-x-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

        <div className="relative z-10 space-y-10 max-w-7xl mx-auto p-6 pb-32">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-3xl shadow-[0_0_30px_rgba(147,51,234,0.3)] animate-pulse">
                 <Box className="h-10 w-10 text-white" />
              </div>
              <div>
                 <h1 className="font-headline text-5xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                   3D Tribe Arena
                 </h1>
                 <p className="text-muted-foreground font-body text-lg italic opacity-60">High-fidelity 3D frequencies. Play together.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="bg-white/5 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-black italic tracking-tight">12,450 LIVE</span>
               </div>
            </div>
          </header>

          <section className="space-y-12">
             <div className="flex items-center gap-3 px-2">
                <Zap className="h-6 w-6 text-yellow-500 fill-current animate-bounce" />
                <h3 className="font-headline text-2xl font-black uppercase italic tracking-widest text-white/80">Select Dimension</h3>
             </div>

             {isGamesLoading ? (
               <div className="flex justify-center py-20"><Loader className="animate-spin text-primary h-10 w-10" /></div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10 pt-4">
                  {activeGames.map((game) => (
                    <div key={game.id} className="group relative transition-all duration-500 transform-gpu preserve-3d hover:rotate-x-12 hover:rotate-y-6">
                      <Link href={`/games/${game.slug}`} className="block relative">
                        {/* 3D Depth Layer */}
                        <div className="absolute inset-0 bg-purple-600/20 rounded-[2.5rem] translate-z-[-20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-purple-500/50 group-hover:shadow-[0_40px_80px_rgba(168,85,247,0.3)] group-hover:-translate-y-4 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                           {game.coverUrl ? (
                             <Image 
                               src={game.coverUrl} 
                               alt={game.title} 
                               fill 
                               className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                               data-ai-hint={game.imageHint}
                             />
                           ) : (
                             <div className="flex flex-col items-center gap-2">
                                <GameControllerIcon className="h-16 w-16 text-white/20 group-hover:text-purple-500 transition-colors" />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-100 transition-opacity">Loading character...</span>
                             </div>
                           )}
                           
                           {/* High-fidelity glass overlay */}
                           <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0514] via-transparent to-transparent opacity-60" />
                           
                           {isAdmin && (
                             <button 
                               onClick={(e) => handleLogoChangeClick(e, game.id)}
                               className="absolute top-4 right-4 bg-black/60 p-2 rounded-full border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-primary hover:text-black"
                             >
                               {isUploading && selectedGameId === game.id ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                             </button>
                           )}

                           <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-xl">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[10px] font-black text-white/80">{(liveCounts[game.slug] || 100).toLocaleString()}</span>
                           </div>
                        </div>
                        
                        <div className="mt-6 px-2 space-y-1 text-center translate-z-[30px]">
                           <h4 className="font-black text-sm uppercase italic truncate group-hover:text-purple-400 transition-colors tracking-tighter drop-shadow-lg">{game.title}</h4>
                           <div className="flex items-center justify-center gap-2">
                              <div className="h-1 w-4 rounded-full bg-purple-500 group-hover:w-8 transition-all duration-500" />
                              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">3D Reality</span>
                           </div>
                        </div>
                      </Link>
                    </div>
                  ))}
               </div>
             )}
          </section>

          <section className="pt-20">
             <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-12 rounded-[4rem] border border-white/5 flex flex-col items-center text-center space-y-8 shadow-[0_0_100px_rgba(147,51,234,0.1)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="relative z-10">
                   <Trophy className="h-20 w-20 text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-4 relative z-10">
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter">Become an Arena Legend</h3>
                   <p className="text-white/60 max-w-md font-body text-lg italic">Top tribe members earn exclusive 3D avatar frames and elite badges every 24 hours. Reset at 11:59:59 IST.</p>
                </div>
                <div className="flex gap-6 relative z-10">
                   <Button variant="outline" className="rounded-full px-10 h-14 border-white/10 text-white font-black uppercase italic text-xs hover:bg-white/5 shadow-2xl">Ranking History</Button>
                   <Button className="rounded-full px-10 h-14 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase italic text-xs shadow-[0_10px_40px_rgba(147,51,234,0.4)] hover:scale-105 active:scale-95 transition-transform">Claim Rewards</Button>
                </div>
             </div>
          </section>

        </div>
      </div>
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-x-12 { transform: rotateX(12deg); }
        .rotate-y-6 { transform: rotateY(6deg); }
        .translate-z-[-20px] { transform: translateZ(-20px); }
        .translate-z-[30px] { transform: translateZ(30px); }
      `}</style>
    </AppLayout>
  );
}
