'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Users, Heart } from 'lucide-react';

/**
 * Premium Feature Cards (Compact Hago Style).
 * - Refined with larger avatars and spread-out positioning.
 * - Maintains top titles as requested.
 */

// 1. RANKING CARD
export function RankingCard() {
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);
  
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
      className="group relative flex-1 aspect-[1/0.75] rounded-[1.4rem] bg-gradient-to-br from-[#FFD54F] via-[#FFB300] to-[#F57C00] shadow-md border-2 border-white/90 active:scale-95 transition-all flex flex-col items-center pt-1.5 p-1 overflow-hidden"
    >
      <div className="w-full flex justify-center mb-0.5">
         <span className="text-white font-black uppercase text-[7px] tracking-widest drop-shadow-sm flex items-center gap-1">
           <Crown className="h-2 w-2 fill-current" /> Ranking
         </span>
      </div>
      <div className="relative flex items-end justify-center w-full h-full pb-0.5 -space-x-2.5">
         {(isHydrated && topUsers?.[1]) && (
           <Avatar className="h-9 w-9 border-2 border-white shadow-lg bg-slate-100 relative z-0 mb-0.5"><AvatarImage src={topUsers[1].avatarUrl} /><AvatarFallback>2</AvatarFallback></Avatar>
         )}
         {(isHydrated && topUsers?.[0]) && (
           <Avatar className="h-11 w-11 border-2 border-white shadow-xl bg-white relative z-10 bottom-1 ring-1 ring-yellow-400/20"><AvatarImage src={topUsers[0].avatarUrl} /><AvatarFallback>1</AvatarFallback></Avatar>
         )}
         {(isHydrated && topUsers?.[2]) && (
           <Avatar className="h-9 w-9 border-2 border-white shadow-lg bg-slate-100 relative z-0 mb-0.5"><AvatarImage src={topUsers[2].avatarUrl} /><AvatarFallback>3</AvatarFallback></Avatar>
         )}
      </div>
    </button>
  );
}

// 2. FAMILY CARD
export function FamilyCard() {
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);
  
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
      className="group relative flex-1 aspect-[1/0.75] rounded-[1.4rem] bg-gradient-to-br from-[#4FC3F7] via-[#0288D1] to-[#01579B] shadow-md border-2 border-white/90 active:scale-95 transition-all flex flex-col items-center pt-1.5 p-1 overflow-hidden"
    >
      <div className="w-full flex justify-center mb-0.5">
         <span className="text-white font-black uppercase text-[7px] tracking-widest drop-shadow-sm flex items-center gap-1">
           <Users className="h-2 w-2 fill-current" /> Family
         </span>
      </div>
      <div className="relative flex items-center justify-center w-full h-full pb-0.5 -space-x-1.5 px-1">
         <Avatar className="h-11 w-11 border-2 border-white shadow-lg bg-blue-100/30 transform -translate-x-1"><AvatarImage src={(isHydrated && topFamilies?.[1]?.bannerUrl) || ""} /><AvatarFallback className="text-[6px]">F2</AvatarFallback></Avatar>
         <Avatar className="h-11 w-11 border-2 border-white shadow-xl bg-blue-50 relative z-10 transform translate-x-1"><AvatarImage src={(isHydrated && topFamilies?.[0]?.bannerUrl) || ""} /><AvatarFallback className="text-[6px]">F1</AvatarFallback></Avatar>
      </div>
    </button>
  );
}

// 3. CP CARD
export function CpCard() {
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);
  
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
      className="group relative flex-1 aspect-[1/0.75] rounded-[1.4rem] bg-gradient-to-br from-[#F06292] via-[#E91E63] to-[#880E4F] shadow-md border-2 border-white/90 active:scale-95 transition-all flex flex-col items-center pt-1.5 p-1 overflow-hidden"
    >
      <div className="w-full flex justify-center mb-0.5">
         <span className="text-white font-black uppercase text-[7px] tracking-widest drop-shadow-sm flex items-center gap-1">
           <Heart className="h-2 w-2 fill-current" /> CP
         </span>
      </div>
      <div className="relative flex items-center justify-center w-full h-full pb-0.5 -space-x-1 px-1">
         <Avatar className="h-11 w-11 border-2 border-white shadow-lg bg-pink-100/30 transform -translate-x-1.5"><AvatarImage src={(isHydrated && topCp?.[0]?.user1Avatar) || ""} /><AvatarFallback className="text-[6px]">P1</AvatarFallback></Avatar>
         <Avatar className="h-11 w-11 border-2 border-white shadow-xl bg-pink-100/30 relative z-10 transform translate-x-1.5"><AvatarImage src={(isHydrated && topCp?.[0]?.user2Avatar) || ""} /><AvatarFallback className="text-[6px]">P2</AvatarFallback></Avatar>
      </div>
    </button>
  );
}
