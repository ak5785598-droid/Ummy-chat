'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Heart, Crown, Users, Sparkles } from 'lucide-react';

/**
 * Premium Feature Cards for Home Screen.
 * Displays real-time data from Firestore (Ranking, Family, CP).
 */

// 1. RANKING CARD (TOP 3 GIVERS)
export function RankingCard() {
  const router = useRouter();
  const firestore = useFirestore();
  const richQuery = useMemoFirebase(() => !firestore ? null : query(
    collection(firestore, 'users'), 
    orderBy('wallet.dailySpent', 'desc'), 
    limit(3)
  ), [firestore]);
  const { data: topUsers } = useCollection(richQuery);

  return (
    <button 
      onClick={() => router.push('/leaderboard?type=rich')}
      className="group relative flex-1 aspect-[1/0.88] rounded-[1.2rem] bg-gradient-to-br from-[#ffd700] via-[#ff9800] to-[#f57c00] border-2 border-white/40 shadow-lg overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-end p-1.5"
    >
      <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
      <div className="absolute top-1.5 left-2 flex items-center gap-1">
         <Crown className="h-2.5 w-2.5 text-white fill-current" />
         <span className="text-white font-black uppercase text-[7px] tracking-widest italic drop-shadow-md">Ranking</span>
      </div>
      
      {/* Avatar Stack (The Podium) */}
      <div className="relative flex items-end justify-center h-full w-full pb-1">
         {topUsers?.[1] && (
           <Avatar className="h-6 w-6 border border-blue-200 -mr-2 shadow-lg scale-90">
             <AvatarImage src={topUsers[1].avatarUrl} /><AvatarFallback>2</AvatarFallback>
           </Avatar>
         )}
         {topUsers?.[0] && (
           <div className="relative z-10">
              <Avatar className="h-10 w-10 border-2 border-yellow-200 shadow-xl ring-2 ring-yellow-500/10">
                <AvatarImage src={topUsers[0].avatarUrl} /><AvatarFallback>1</AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 p-0.5 rounded-full shadow-lg border border-white">
                 <Crown className="h-2 w-2 text-white fill-current" />
              </div>
           </div>
         )}
         {topUsers?.[2] && (
           <Avatar className="h-6 w-6 border border-amber-500 -ml-2 shadow-lg scale-90">
             <AvatarImage src={topUsers[2].avatarUrl} /><AvatarFallback>3</AvatarFallback>
           </Avatar>
         )}
      </div>
    </button>
  );
}

// 2. FAMILY CARD (FEATURED GROUPS)
export function FamilyCard() {
  const router = useRouter();
  const firestore = useFirestore();
  const familiesQuery = useMemoFirebase(() => !firestore ? null : query(
    collection(firestore, 'families'), 
    orderBy('totalWealth', 'desc'), 
    limit(2)
  ), [firestore]);
  const { data: topFamilies } = useCollection(familiesQuery);

  return (
    <button 
      onClick={() => router.push('/families')}
      className="group relative flex-1 aspect-[1/0.88] rounded-[1.2rem] bg-gradient-to-br from-[#00c6ff] to-[#0072ff] border-2 border-white/40 shadow-lg overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-end p-1.5"
    >
      <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine delay-500" />
      <div className="absolute top-1.5 left-2 flex items-center gap-1">
         <Users className="h-2.5 w-2.5 text-white fill-current" />
         <span className="text-white font-black uppercase text-[7px] tracking-widest italic drop-shadow-md">Family</span>
      </div>
      
      <div className="relative flex items-center justify-center h-full w-full pb-1">
         <div className="relative">
            <Avatar className="h-8 w-8 border border-white/20 shadow-xl transform -rotate-12 translate-x-2 bg-blue-900/40">
              <AvatarImage src={topFamilies?.[1]?.bannerUrl || ""} />
              <AvatarFallback className="text-[10px] text-white">F2</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10 border-2 border-white shadow-2xl absolute top-0 left-0 bg-blue-900">
              <AvatarImage src={topFamilies?.[0]?.bannerUrl || ""} />
              <AvatarFallback className="text-[10px] text-white font-bold">F1</AvatarFallback>
            </Avatar>
         </div>
      </div>
    </button>
  );
}

// 3. CP CARD (COUPLE PAIR)
export function CpCard() {
  const router = useRouter();
  const firestore = useFirestore();
  const cpQuery = useMemoFirebase(() => !firestore ? null : query(
    collection(firestore, 'cpPairs'), 
    orderBy('cpValue', 'desc'), 
    limit(1)
  ), [firestore]);
  const { data: topCp } = useCollection(cpQuery);

  return (
    <button 
      onClick={() => router.push('/cp-challenge')}
      className="group relative flex-1 aspect-[1/0.88] rounded-[1.2rem] bg-gradient-to-br from-[#ff4e50] to-[#f9d423] border-2 border-white/40 shadow-lg overflow-hidden active:scale-95 transition-all flex flex-col items-center justify-end p-1.5"
    >
      <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine delay-700" />
      <div className="absolute top-1.5 left-2 flex items-center gap-1">
         <Heart className="h-2.5 w-2.5 text-white fill-current animate-pulse" />
         <span className="text-white font-black uppercase text-[7px] tracking-widest italic drop-shadow-md">CP Pair</span>
      </div>
      
      <div className="relative flex items-center justify-center h-full w-full pb-1">
         <div className="flex -space-x-3">
            <div className="relative p-0.5 bg-white rounded-full shadow-lg">
               <Avatar className="h-8 w-8 border border-pink-500 bg-pink-100/20">
                 <AvatarImage src={topCp?.[0]?.user1Avatar || ""} />
                 <AvatarFallback className="text-[10px] text-pink-700">P1</AvatarFallback>
               </Avatar>
            </div>
            <div className="relative z-10 p-0.5 bg-white rounded-full shadow-lg">
               <Avatar className="h-8 w-8 border border-red-500 bg-red-100/20">
                 <AvatarImage src={topCp?.[0]?.user2Avatar || ""} />
                 <AvatarFallback className="text-[10px] text-red-700">P2</AvatarFallback>
               </Avatar>
            </div>
         </div>
      </div>
    </button>
  );
}
