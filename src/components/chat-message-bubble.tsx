import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ChatMessageBubbleProps {
 bubbleId?: string | null;
 isMe: boolean;
 children: React.ReactNode;
 className?: string;
}

/**
 * Dynamic Chat Bubble renderer.
 * Applies CSS backgrounds, glowing borders, and floating decorators based on the bubble ID.
 */
export function ChatMessageBubble({ bubbleId, isMe, children, className }: ChatMessageBubbleProps) {
 // Default styling if no premium bubble is equipped
 if (!bubbleId || bubbleId === 'None') {
  return (
   <div className={cn(
    "px-3 py-2 rounded-2xl text-[13px] font-medium shadow-sm border max-w-[85%]",
    isMe ? "bg-[#00E676] text-black rounded-br-none border-[#00E676]/20 self-end" : "bg-white/15 text-white rounded-bl-none border-white/5 self-start",
    className
   )}>
    {children}
   </div>
  );
 }

 // Style configurations for the 20+ bubbles
 const styles: Record<string, { bg: string, text: string, border: string, shadow: string, decorator?: React.ReactNode }> = {
  'heart-bubble': {
   bg: 'bg-gradient-to-r from-pink-500 to-rose-400',
   text: 'text-white font-bold',
   border: 'border-pink-300',
   shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.5)]',
   decorator: <div className="absolute -top-2 -right-2 text-lg animate-bounce drop-shadow-md">💖</div>
  },
  'love-bubble': {
   bg: 'bg-gradient-to-br from-red-600 to-red-400',
   text: 'text-white font-bold',
   border: 'border-red-300',
   shadow: 'shadow-[0_0_20px_rgba(220,38,38,0.6)]',
   decorator: <div className="absolute -bottom-2 -left-2 text-xl drop-shadow-md">💌</div>
  },
  'evil-bubble': {
   bg: 'bg-[#1a0033]',
   text: 'text-purple-200',
   border: 'border-purple-600 border-[2px]',
   shadow: 'shadow-[0_0_15px_rgba(147,51,234,0.6)]',
   decorator: (
    <>
     <div className="absolute -top-3 left-1 text-xl">😈</div>
     <div className="absolute -bottom-1 -right-2 text-lg">🔱</div>
    </>
   )
  },
  'candy-bubble': {
   bg: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300',
   text: 'text-white font-bold drop-shadow-sm',
   border: 'border-white border-[2px] border-dashed',
   shadow: 'shadow-lg',
   decorator: <div className="absolute -bottom-2 -right-2 text-2xl animate-spin-slow">🍭</div>
  },
  'taurus-2025': {
   bg: 'bg-gradient-to-tr from-yellow-700 to-yellow-500',
   text: 'text-white font-bold',
   border: 'border-yellow-200',
   shadow: 'shadow-[0_0_10px_rgba(202,138,4,0.5)]',
   decorator: <div className="absolute top-1/2 -right-4 -translate-y-1/2 text-2xl">♉</div>
  },
  'cricket-2025': {
   bg: 'bg-gradient-to-r from-green-700 to-emerald-500',
   text: 'text-white font-bold',
   border: 'border-green-300',
   shadow: 'shadow-md',
   decorator: <div className="absolute -top-3 -right-2 text-xl animate-bounce">🏏</div>
  },
  'neon-cyber': {
   bg: 'bg-black/80 backdrop-blur-md',
   text: 'text-cyan-400 font-mono tracking-wide',
   border: 'border-cyan-400 border-[2px]',
   shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.8)]',
   decorator: <Sparkles className="absolute -top-2 -left-2 h-5 w-5 text-cyan-400 animate-pulse" />
  },
  'royal-gold': {
   bg: 'bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600',
   text: 'text-yellow-950 font-black',
   border: 'border-yellow-200 border-[2px]',
   shadow: 'shadow-[0_4px_15px_rgba(234,179,8,0.6)]',
   decorator: <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl drop-shadow-xl">👑</div>
  },
  'toxic-slime': {
   bg: 'bg-lime-900',
   text: 'text-lime-300 font-bold',
   border: 'border-lime-500 border-b-[4px]',
   shadow: 'shadow-[0_10px_20px_rgba(132,204,22,0.4)]',
   decorator: <div className="absolute -bottom-3 left-4 text-xl animate-pulse">💧</div>
  },
  'ice-crystal': {
   bg: 'bg-blue-900/80 backdrop-blur-md',
   text: 'text-cyan-100 font-medium',
   border: 'border-cyan-200 border-[2px]',
   shadow: 'shadow-[0_0_30px_rgba(165,243,252,0.6)]',
   decorator: <div className="absolute -top-2 -right-2 text-xl animate-pulse">❄️</div>
  },
  // Default fallback for dynamically generated ones
  'default-premium': {
   bg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
   text: 'text-white font-medium',
   border: 'border-purple-300',
   shadow: 'shadow-lg',
  }
 };

 const config = styles[bubbleId] || styles['default-premium'];

 return (
  <div className={cn(
   "relative px-4 py-2.5 rounded-2xl max-w-[85%] transition-all",
   isMe ? "self-end rounded-br-none" : "self-start rounded-bl-none",
   config.bg,
   config.text,
   config.border ? `border ${config.border}` : '',
   config.shadow,
   className
  )}>
   {config.decorator}
   <div className="relative z-10 leading-relaxed drop-shadow-sm">
    {children}
   </div>
  </div>
 );
}
