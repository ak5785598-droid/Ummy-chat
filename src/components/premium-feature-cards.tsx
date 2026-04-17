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
 * Premium Feature Cards (Refined Hago Style).
 * Titles at the top, actual data (avatars) below.
 * Taller cards for better visibility.
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
      className="group relative flex-1 aspect-[1/0.85] rounded-[1.5rem] bg-gradient-to-br from-[#FFF9C4] to-[#FFF176] shadow-md border-2 border-white/60 active:scale-95 transition-all flex flex-col items-center pt-2 p-1.5"
    >
      <div className="w-full flex justify-center mb-2">
         <span className="text-[#F9A825] font-black uppercase text-[9px] tracking-widest drop-shadow-sm flex items-center gap-1">
           <Crown className="h-2 w-2 fill-current" /> Ranking
         </span>
      </div>
      <div className="relative flex items-end justify-center w-full h-full pb-1 -space-x-2">
         {(isHydrated && topUsers?.[1]) && <Avatar className="h-7 w-7 border-2 border-white shadow-md relative z-0"><AvatarImage src={topUsers[1].avatarUrl} /><AvatarFallback>2</AvatarFallback></Avatar>}
         {(isHydrated && topUsers?.[0]) && <Avatar className="h-9 w-9 border-2 border-white shadow-lg relative z-10 bottom-1.5 ring-2 ring-yellow-400/20"><AvatarImage src={topUsers[0].avatarUrl} /><AvatarFallback>1</AvatarFallback></Avatar>}
         {(isHydrated && topUsers?.[2]) && <Avatar className="h-7 w-7 border-2 border-white shadow-md relative z-0"><AvatarImage src={topUsers[2].avatarUrl} /><AvatarFallback>3</AvatarFallback></Avatar>}
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
      className="group relative flex-1 aspect-[1/0.85] rounded-[1.5rem] bg-gradient-to-br from-[#E1F5FE] to-[#81D4FA] shadow-md border-2 border-white/60 active:scale-95 transition-all flex flex-col items-center pt-2 p-1.5"
    >
      <div className="w-full flex justify-center mb-2">
         <span className="text-[#0277BD] font-black uppercase text-[9px] tracking-widest drop-shadow-sm flex items-center gap-1">
           <Users className="h-2 w-2 fill-current" /> Family
         </span>
      </div>
      <div className="relative flex items-center justify-center w-full h-full pb-1 -space-x-3">
         <Avatar className="h-8 w-8 border-2 border-white shadow-md bg-blue-100/50"><AvatarImage src={(isHydrated && topFamilies?.[1]?.bannerUrl) || ""} /><AvatarFallback className="text-[6px]">F2</AvatarFallback></Avatar>
         <Avatar className="h-10 w-10 border-2 border-white shadow-lg bg-blue-200"><AvatarImage src={(isHydrated && topFamilies?.[0]?.bannerUrl) || ""} /><AvatarFallback className="text-[6px]">F1</AvatarFallback></Avatar>
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
      className="group relative flex-1 aspect-[1/0.85] rounded-[1.5rem] bg-gradient-to-br from-[#FCE4EC] to-[#F06292] shadow-md border-2 border-white/60 active:scale-95 transition-all flex flex-col items-center pt-2 p-1.5"
    >
      <div className="w-full flex justify-center mb-2">
         <span className="text-[#AD1457] font-black uppercase text-[9px] tracking-widest drop-shadow-sm flex items-center gap-1">
           <Heart className="h-2 w-2 fill-current" /> CP
         </span>
      </div>
      <div className="relative flex items-center justify-center w-full h-full pb-1 -space-x-1.5">
         <Avatar className="h-8 w-8 border-2 border-white shadow-md bg-pink-50"><AvatarImage src={(isHydrated && topCp?.[0]?.user1Avatar) || ""} /><AvatarFallback className="text-[6px]">P1</AvatarFallback></Avatar>
         <Avatar className="h-8 w-8 border-2 border-white shadow-md bg-pink-100"><AvatarImage src={(isHydrated && topCp?.[0]?.user2Avatar) || ""} /><AvatarFallback className="text-[6px]">P2</AvatarFallback></Avatar>
      </div>
    </button>
  );
}
