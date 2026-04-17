'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Premium Feature Cards (Mini-Block Version).
 * Simplified to match the new minimalist grid aesthetic.
 */

// 1. RANKING CARD
export function RankingCard() {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.push('/leaderboard?type=rich')}
      className="group relative flex-1 aspect-[1/0.6] rounded-[1.2rem] bg-gradient-to-br from-[#FFB800] to-[#FF8A00] shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center p-2"
    >
      <span className="text-white font-black uppercase text-[10px] tracking-widest drop-shadow-sm">Ranking</span>
    </button>
  );
}

// 2. CP CARD (Vibrant Pink as requested)
export function CpCard() {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.push('/cp-challenge')}
      className="group relative flex-1 aspect-[1/0.6] rounded-[1.2rem] bg-gradient-to-br from-[#FF4E8D] to-[#FF1F6D] shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center p-2"
    >
      <span className="text-white font-black uppercase text-[10px] tracking-widest drop-shadow-sm">CP</span>
    </button>
  );
}

// 3. FAMILY CARD
export function FamilyCard() {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.push('/families')}
      className="group relative flex-1 aspect-[1/0.6] rounded-[1.2rem] bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center p-2"
    >
      <span className="text-white font-black uppercase text-[10px] tracking-widest drop-shadow-sm">Family</span>
    </button>
  );
}
