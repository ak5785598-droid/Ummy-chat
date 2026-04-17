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
 * Premium Feature Cards (Unique Overhaul).
 * - Tall layout (1 : 1.2)
 * - Large avatars (Real-time Display)
 * - Deeper, richer glossy colors.
 * - No heart frames for CP (Unique Branding).
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
      className="group relative flex-1 aspect-[1/1.2] rounded-[1.8rem] bg-gradient-to-br from-[#FFD54F] via-[#FFB300] to-[#F57C00] shadow-[0_8px_20px_-5px_rgba(245,124,0,0.3)] border-[3px] border-white/80 active:scale-95 transition-all flex flex-col items-center pt-3 p-2"
    >
      <div className="w-full flex justify-center mb-3">
         <span className="text-white font-black uppercase text-[10px] tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] flex items-center gap-1.5">
           <Crown className="h-3 w-3 fill-current" /> Ranking
         </span>
      </div>
      <div className="relative flex items-end justify-center w-full flex-1 pb-4 -space-x-2.5">
         {(isHydrated && topUsers?.[1]) && (
           <div className="relative">
             <Avatar className="h-8 w-8 border-2 border-white shadow-xl bg-slate-100 z-10"><AvatarImage src={topUsers[1].avatarUrl} /><AvatarFallback>2</AvatarFallback></Avatar>
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-[6px] font-bold px-1 rounded-full border border-white">2</div>
           </div>
         )}
         {(isHydrated && topUsers?.[0]) && (
           <div className="relative z-20 bottom-2.5">
             <Avatar className="h-10 w-10 border-2 border-white shadow-2xl bg-white"><AvatarImage src={topUsers[0].avatarUrl} /><AvatarFallback>1</AvatarFallback></Avatar>
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FFD700] text-amber-900 text-[8px] font-black px-1.5 rounded-full border-2 border-white shadow-md">1</div>
           </div>
         )}
         {(isHydrated && topUsers?.[2]) && (
           <div className="relative">
             <Avatar className="h-8 w-8 border-2 border-white shadow-xl bg-slate-100 z-10"><AvatarImage src={topUsers[2].avatarUrl} /><AvatarFallback>3</AvatarFallback></Avatar>
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[6px] font-bold px-1 rounded-full border border-white">3</div>
           </div>
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
      className="group relative flex-1 aspect-[1/1.2] rounded-[1.8rem] bg-gradient-to-br from-[#4FC3F7] via-[#0288D1] to-[#01579B] shadow-[0_8px_20px_-5px_rgba(1,87,155,0.3)] border-[3px] border-white/80 active:scale-95 transition-all flex flex-col items-center pt-3 p-2"
    >
      <div className="w-full flex justify-center mb-3">
         <span className="text-white font-black uppercase text-[10px] tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] flex items-center gap-1.5">
           <Users className="h-3 w-3 fill-current" /> Family
         </span>
      </div>
      <div className="relative flex items-center justify-center w-full flex-1 pb-4 -space-x-4">
         <div className="relative rotate-[-6deg] group-hover:rotate-0 transition-transform duration-500">
           <Avatar className="h-10 w-10 border-2 border-white/90 shadow-xl bg-blue-100/50"><AvatarImage src={(isHydrated && topFamilies?.[1]?.bannerUrl) || ""} /><AvatarFallback className="text-[6px]">F2</AvatarFallback></Avatar>
         </div>
         <div className="relative z-10 rotate-[6deg] scale-110 group-hover:rotate-0 transition-transform duration-500">
           <Avatar className="h-11 w-11 border-2 border-white shadow-2xl bg-blue-50"><AvatarImage src={(isHydrated && topFamilies?.[0]?.bannerUrl) || ""} /><AvatarFallback className="text-[6px]">F1</AvatarFallback></Avatar>
         </div>
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
      className="group relative flex-1 aspect-[1/1.2] rounded-[1.8rem] bg-gradient-to-br from-[#F06292] via-[#E91E63] to-[#880E4F] shadow-[0_8px_20px_-5px_rgba(136,14,79,0.3)] border-[3px] border-white/80 active:scale-95 transition-all flex flex-col items-center pt-3 p-2"
    >
      <div className="w-full flex justify-center mb-3">
         <span className="text-white font-black uppercase text-[10px] tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] flex items-center gap-1.5">
           <Heart className="h-3 w-3 fill-current" /> CP
         </span>
      </div>
      <div className="relative flex items-center justify-center w-full flex-1 pb-4">
         <div className="relative flex items-center -space-x-3">
            <div className="relative z-0 scale-95 group-hover:scale-100 transition-transform">
               <Avatar className="h-11 w-11 border-2 border-white/80 shadow-xl bg-pink-100/30"><AvatarImage src={(isHydrated && topCp?.[0]?.user1Avatar) || ""} /><AvatarFallback className="text-[6px]">P1</AvatarFallback></Avatar>
            </div>
            <div className="relative z-10 shadow-pink-900/40">
               <Avatar className="h-11 w-11 border-2 border-white/90 shadow-2xl bg-pink-100/30"><AvatarImage src={(isHydrated && topCp?.[0]?.user2Avatar) || ""} /><AvatarFallback className="text-[6px]">P2</AvatarFallback></Avatar>
            </div>
         </div>
      </div>
    </button>
  );
}
