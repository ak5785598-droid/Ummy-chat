import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Heart, Star, Moon } from 'lucide-react';

interface ChatMessageBubbleProps {
 bubbleId?: string | null;
 isMe: boolean;
 children: React.ReactNode;
 className?: string;
}

/**
 * High-Fidelity Chat Bubble renderer.
 * Designed exactly like Wafa (pill-shaped, rich gradients, dynamic tails/decorators).
 */
export function ChatMessageBubble({ bubbleId, isMe, children, className }: ChatMessageBubbleProps) {
 if (!bubbleId || bubbleId === 'None') {
  return (
   <div className={cn(
    "px-3 py-1.5 rounded-2xl text-[13px] font-medium shadow-sm border max-w-full min-w-[50px] relative",
    isMe ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "bg-white/10 text-white border-white/5 backdrop-blur-md",
    className
   )}>
    {children}
   </div>
  );
 }

 // Style configurations for premium Wafa-style bubbles
 const styles: Record<string, { bg: string, text: string, border: string, shadow: string, decorator?: React.ReactNode, tailColor: string }> = {
  'heart-bubble': {
   bg: 'bg-gradient-to-r from-pink-500 to-rose-400',
   text: 'text-white font-bold',
   border: 'border-white border border-opacity-40',
   shadow: 'shadow-[0_4px_15px_rgba(236,72,153,0.4)]',
   tailColor: 'fill-rose-400',
   decorator: <div className="absolute -top-1.5 -right-2 text-lg drop-shadow-md animate-bounce">💖</div>
  },
  'love-bubble': {
   bg: 'bg-gradient-to-r from-red-600 to-red-500',
   text: 'text-white font-bold',
   border: 'border-white/30 border-2',
   shadow: 'shadow-[0_4px_15px_rgba(220,38,38,0.5)]',
   tailColor: 'fill-red-500',
   decorator: <div className="absolute top-1/2 -translate-y-1/2 -right-3 text-xl drop-shadow-lg">💌</div>
  },
  'evil-bubble': {
   bg: 'bg-gradient-to-r from-[#2a0845] to-[#6441A5]',
   text: 'text-purple-100 font-bold',
   border: 'border-purple-500 border-2',
   shadow: 'shadow-[0_4px_20px_rgba(147,51,234,0.5)]',
   tailColor: 'fill-[#6441A5]',
   decorator: (
    <>
     <div className="absolute -top-3 left-3 text-xl drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">😈</div>
     <div className="absolute -bottom-1 -right-2 text-lg drop-shadow-lg">🔱</div>
    </>
   )
  },
  'candy-bubble': {
   bg: 'bg-gradient-to-r from-[#ff9a9e] via-[#fecfef] to-[#ff9a9e]',
   text: 'text-pink-900 font-black',
   border: 'border-white border-2 border-dashed',
   shadow: 'shadow-[0_2px_10px_rgba(255,154,158,0.5)]',
   tailColor: 'fill-[#ff9a9e]',
   decorator: <div className="absolute top-1/2 -translate-y-1/2 -right-4 text-2xl animate-spin-slow drop-shadow-md">🍭</div>
  },
  'taurus-2025': {
   bg: 'bg-gradient-to-r from-[#F09819] to-[#EDDE5D]',
   text: 'text-yellow-950 font-black',
   border: 'border-white/50 border-2',
   shadow: 'shadow-[0_4px_15px_rgba(240,152,25,0.4)]',
   tailColor: 'fill-[#EDDE5D]',
   decorator: <div className="absolute top-1/2 -right-4 -translate-y-1/2 text-2xl drop-shadow-lg">♉</div>
  },
  'cricket-2025': {
   bg: 'bg-gradient-to-r from-teal-700 to-emerald-500',
   text: 'text-white font-bold tracking-wide',
   border: 'border-emerald-300 border-2',
   shadow: 'shadow-[0_4px_15px_rgba(16,185,129,0.4)]',
   tailColor: 'fill-emerald-500',
   decorator: <div className="absolute top-1/2 -translate-y-1/2 -right-3 text-xl">🏏</div>
  },
  'neon-cyber': {
   bg: 'bg-black/90 backdrop-blur-xl',
   text: 'text-[#00ffff] font-mono font-bold tracking-wider',
   border: 'border-[#00ffff] border-[2px]',
   shadow: 'shadow-[0_0_20px_rgba(0,255,255,0.6)]',
   tailColor: 'fill-[#00ffff]',
   decorator: <Sparkles className="absolute -top-2 -left-2 h-5 w-5 text-[#00ffff] animate-pulse drop-shadow-[0_0_5px_rgba(0,255,255,1)]" />
  },
  'royal-gold': {
   bg: 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728]',
   text: 'text-yellow-950 font-black uppercase tracking-tight',
   border: 'border-yellow-100 border-2 shadow-inner',
   shadow: 'shadow-[0_6px_20px_rgba(212,175,55,0.6)]',
   tailColor: 'fill-[#B38728]',
   decorator: <div className="absolute -top-5 right-2 text-2xl drop-shadow-xl z-20">👑</div>
  },
  'ice-crystal': {
   bg: 'bg-gradient-to-r from-cyan-300 to-blue-300',
   text: 'text-blue-950 font-bold',
   border: 'border-white border-[2px]',
   shadow: 'shadow-[0_0_20px_rgba(165,243,252,0.8)]',
   tailColor: 'fill-blue-300',
   decorator: <div className="absolute -top-2 -right-2 text-xl animate-pulse">❄️</div>
  },
  'default-premium': {
   bg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
   text: 'text-white font-bold',
   border: 'border-white/30 border-2',
   shadow: 'shadow-lg',
   tailColor: 'fill-purple-500',
  }
 };

 const config = styles[bubbleId] || styles['default-premium'];

 return (
  <div className={cn(
   "relative px-4 py-2 rounded-2xl max-w-full transition-all flex items-center min-h-[38px] min-w-[60px]",
   config.bg,
   config.text,
   config.border,
   config.shadow,
   className
  )}>
   {/* Pointy Talk Bubble Tail for realism */}
   <svg 
    viewBox="0 0 10 10" 
    className={cn(
     "absolute w-3 h-3 bottom-0 -left-1.5 translate-y-[-4px]", 
     config.tailColor
    )}
   >
     <path d="M0 0 L10 10 L0 10 Z" />
   </svg>

   {config.decorator}
   
   <div className="relative z-10 w-full whitespace-normal pr-3 overflow-visible break-all overflow-wrap-anywhere" style={{ overflowWrap: 'anywhere' }}>
    {children}
   </div>
  </div>
 );
}
