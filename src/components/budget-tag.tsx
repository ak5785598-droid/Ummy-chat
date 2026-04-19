'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Crown, Gem, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface BudgetTagProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'diamond' | 'silver' | 'purple' | 'emerald' | 'rose' | 'rainbow' | 'none';
  label?: string; // NEW: Allow custom text (like User ID)
}

/**
 * Maps spending amount to budget tier variants (For Creator Auto-Tiering)
 */
export function getTierVariant(spent: number): BudgetTagProps['variant'] {
  if (spent >= 1000000) return 'diamond';
  if (spent >= 500000) return 'emerald';
  if (spent >= 100000) return 'purple';
  if (spent >= 10000) return 'gold';
  return 'silver';
}

/**
 * Premium Sovereign / Budget Tag Component.
 * Supports prestigious Liquid Gold, Diamond, Silver, Purple, Emerald, Rose, and Rainbow variants.
 */
export function BudgetTag({ className, size = 'md', variant = 'gold', label }: BudgetTagProps) {
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.25 : 1;

  if (variant === 'none') {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span className={cn(
          "font-bold text-slate-500 uppercase tracking-tight",
          size === 'sm' ? "text-[11px]" : "text-[13px]"
        )}>
          {label || 'ID: ---'}
        </span>
      </div>
    );
  }

  const styles = {
    gold: {
      gradient: "from-[#fbbf24] via-[#f59e0b] to-[#b45309]",
      glow: "bg-amber-400/25",
      border: "border-yellow-400/30",
      icon: Crown,
      shimmer: "from-white/0 via-white/40 to-white/0",
      textColor: "text-amber-50"
    },
    diamond: {
      gradient: "from-[#22d3ee] via-[#0891b2] to-[#155e75]",
      glow: "bg-cyan-400/25",
      border: "border-cyan-400/30",
      icon: Gem,
      shimmer: "from-white/0 via-white/50 to-white/0",
      textColor: "text-cyan-50"
    },
    silver: {
      gradient: "from-[#94a3b8] via-[#475569] to-[#1e293b]",
      glow: "bg-slate-300/20",
      border: "border-slate-300/30",
      icon: ShieldCheck,
      shimmer: "from-white/0 via-white/30 to-white/0",
      textColor: "text-slate-50"
    },
    purple: {
      gradient: "from-[#a855f7] via-[#7e22ce] to-[#581c87]",
      glow: "bg-purple-400/25",
      border: "border-purple-400/30",
      icon: Sparkles,
      shimmer: "from-white/0 via-white/40 to-white/0",
      textColor: "text-purple-50"
    },
    emerald: {
      gradient: "from-[#10b981] via-[#059669] to-[#064e3b]",
      glow: "bg-emerald-400/25",
      border: "border-emerald-400/30",
      icon: Gem,
      shimmer: "from-white/0 via-white/40 to-white/0",
      textColor: "text-emerald-50"
    },
    rose: {
      gradient: "from-[#f43f5e] via-[#e11d48] to-[#881337]",
      glow: "bg-rose-400/25",
      border: "border-rose-400/30",
      icon: Crown,
      shimmer: "from-white/0 via-white/40 to-white/0",
      textColor: "text-rose-50"
    },
    rainbow: {
      gradient: "from-[#ff0000] via-[#ff00ff] to-[#0000ff] animate-gradient-x bg-[length:200%_200%]",
      glow: "bg-purple-500/30",
      border: "border-white/40",
      icon: Sparkles,
      shimmer: "from-white/0 via-white/60 to-white/0",
      textColor: "text-white"
    }
  };

  const current = styles[variant];
  const Icon = current.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("relative inline-flex items-center justify-center select-none group", className)} 
      style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}
    >
      {/* Outer Ambient Glow */}
      <div className={cn("absolute inset-[-4px] blur-xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000 rounded-full", current.glow)} />
      
      {/* Main Tag Container (Glassmorphism Base) */}
      <div className={cn(
        "relative flex items-center gap-2 pl-2 pr-4 py-0.5 bg-black/40 backdrop-blur-md rounded-[0.5rem] border-[1.5px] shadow-2xl overflow-hidden",
        current.border
      )}>
        {/* Liquid Gradient Layer */}
        <div className={cn("absolute inset-0 bg-gradient-to-b opacity-80", current.gradient)} />
        
        {/* Shine Animation Overlay */}
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          className={cn("absolute inset-0 w-full h-[200%] -top-1/2 -skew-x-[25deg] bg-gradient-to-r pointer-events-none z-10", current.shimmer)} 
        />
        
        {/* Premium Lustre Grain */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-10 mix-blend-overlay" />
        
        {/* Icon with Soft Glow */}
        <div className="relative shrink-0 flex items-center justify-center z-20 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
          <Icon className="h-3.5 w-3.5 text-white fill-white/10" strokeWidth={2.5} />
        </div>

        {/* Text */}
        <span className={cn(
          "relative z-20 font-black text-[10px] uppercase drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)] tracking-tighter whitespace-nowrap",
          current.textColor
        )}>
          {label || 'Budget'}
        </span>
        
        {/* Decorative Gem Sparkle */}
        <motion.div 
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-0 right-0 p-1 text-[8px] z-30"
        >
          ✨
        </motion.div>
      </div>
    </motion.div>
  );
}
