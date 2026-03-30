'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';

/**
 * Premium Budget / Sovereign Tag Component.
 * Gold/Amber themed to indicate a "Budget" or "Official Spending" account.
 */
export function BudgetTag({ className, size = 'md' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) {
 const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.2 : 1;
 
 return (
  <div className={cn("relative inline-flex items-center justify-center select-none group", className)} style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}>
    {/* Outer Ambient Glow */}
    <div className="absolute inset-0 bg-amber-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    
    {/* Main Tag Container */}
    <div className={cn(
     "relative flex items-center gap-2 pl-2 pr-4 py-1 bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#b45309] rounded-xl border-[2px] border-white/50 shadow-[0_4px_12px_rgba(245,158,11,0.4)] overflow-hidden",
     "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:to-transparent before:h-1/2 before:z-10"
    )}>
     {/* Shine Animation */}
     <div className="absolute inset-0 w-full h-full bg-white/20 skew-x-[-20deg] -translate-x-[150%] group-hover:animate-shine pointer-events-none z-20" />
     
     {/* Icon */}
     <div className="relative shrink-0 flex items-center justify-center z-30">
       <Wallet className="h-4 w-4 text-white fill-white/20 drop-shadow-sm" />
     </div>

     {/* Text */}
     <span className="relative z-30 font-black text-[12px] uppercase text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] tracking-wider">
      Budget
     </span>
     
     {/* Decorative Sparkle */}
     <div className="absolute -top-1 -right-1 text-[8px] animate-pulse z-40">✨</div>
    </div>
  </div>
 );
}
