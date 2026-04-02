'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { ChevronLeft, RefreshCw, Heart, Trophy, Users, Star, Flame, Loader } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { GoldCoinIcon } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function CpChallengePage() {
 const router = useRouter();
 const firestore = useFirestore();
 
 const cpRankQuery = useMemoFirebase(() => {
   if (!firestore) return null;
   return query(
     collection(firestore, 'cpPairs'),
     orderBy('cpValue', 'desc'),
     limit(20)
   );
 }, [firestore]);

 const { data: rankings, isLoading } = useCollection(cpRankQuery);
 const backgroundAsset = PlaceHolderImages.find(img => img.id === 'cp-challenge-hero');

 return (
  <AppLayout fullScreen>
   <div className="h-[100dvh] w-full bg-[#1a0a1a] flex flex-col relative overflow-hidden font-sans text-white select-none">
    
    {/* 🎬 CINEMATIC HERO */}
    <div className="absolute top-0 left-0 w-full h-[50vh] z-0">
       <Image src={backgroundAsset?.imageUrl || ""} alt="Hero" fill className="object-cover opacity-60" />
       <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1a0a1a]" />
    </div>

    <header className="relative z-50 flex items-center justify-between p-6 pt-12">
      <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white ring-1 ring-white/10"><ChevronLeft className="h-6 w-6" /></button>
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-black uppercase tracking-[0.2em] italic text-rose-500">Love Arena</h1>
        <p className="text-[8px] font-bold uppercase tracking-widest text-white/50">Leaderboard</p>
      </div>
      <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white ring-1 ring-white/10"><RefreshCw className="h-6 w-6" /></button>
    </header>

    <main className="relative z-10 flex-1 flex flex-col">
       <div className="h-[25vh] flex flex-col items-center justify-center p-6 text-center">
          <Trophy className="h-14 w-14 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tight italic mt-2">Couple Challenge</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-1">Season 1: Global Resonance</p>
       </div>

       <div className="flex-1 bg-white/5 backdrop-blur-3xl rounded-t-[3.5rem] border-t border-white/10 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 pb-2">
             <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Rankings</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 flex items-center gap-2">
                  <Flame className="h-3 w-3" /> Live Sync
                </span>
             </div>
          </div>

          <ScrollArea className="flex-1 px-6 pb-32">
             {isLoading ? (
               <div className="py-20 flex flex-col items-center gap-4 opacity-40">
                  <Loader className="h-8 w-8 animate-spin text-rose-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Calibrating Ranks...</p>
               </div>
             ) : rankings?.length === 0 ? (
               <div className="py-20 text-center space-y-4 opacity-20">
                  <Heart className="h-12 w-12 mx-auto" />
                  <p className="font-black text-xs uppercase tracking-widest">No active challengers detected.</p>
               </div>
             ) : (
               <div className="space-y-4">
                  {rankings?.map((pair, index) => (
                    <RankItem key={pair.id} pair={pair} rank={index + 1} />
                  ))}
               </div>
             )}
          </ScrollArea>
       </div>
    </main>
   </div>
  </AppLayout>
 );
}

function RankItem({ pair, rank }: any) {
  const p1Id = pair.participantIds?.[0];
  const p2Id = pair.participantIds?.[1];

  const { userProfile: p1 } = useUserProfile(p1Id);
  const { userProfile: p2 } = useUserProfile(p2Id);

  const getRankStyle = (r: number) => {
    if (r === 1) return { color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    if (r === 2) return { color: 'text-slate-300', bg: 'bg-slate-300/10' };
    if (r === 3) return { color: 'text-amber-600', bg: 'bg-amber-600/10' };
    return { color: 'text-white/40', bg: 'bg-white/5' };
  };

  const style = getRankStyle(rank);

  return (
    <div className="flex items-center gap-4 bg-white/5 rounded-[2rem] p-3 border border-white/5 transition-all active:scale-[0.98]">
       <div className={cn("h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center font-black italic shadow-inner", style.bg, style.color)}>
          #{rank}
       </div>

       <div className="flex -space-x-3 shrink-0">
          <Avatar className="h-10 w-10 border-2 border-white/10 ring-2 ring-blue-500 shadow-xl">
             <AvatarImage src={p1?.avatarUrl} />
             <AvatarFallback>P1</AvatarFallback>
          </Avatar>
          <Avatar className="h-10 w-10 border-2 border-white/10 ring-2 ring-pink-500 shadow-xl">
             <AvatarImage src={p2?.avatarUrl} />
             <AvatarFallback>P2</AvatarFallback>
          </Avatar>
       </div>

       <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">
            {p1?.username || '...'} & {p2?.username || '...'}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
             <Star className="h-3 w-3 text-rose-500 fill-rose-500" />
             <span className="text-[9px] font-bold uppercase text-white/30 tracking-widest">Global Sensation</span>
          </div>
       </div>

       <div className="text-right">
          <div className="text-[13px] font-black text-rose-500 italic">{(pair.cpValue || 0).toLocaleString()}</div>
          <p className="text-[8px] font-black uppercase text-white/20">Love Score</p>
       </div>
    </div>
  );
}
