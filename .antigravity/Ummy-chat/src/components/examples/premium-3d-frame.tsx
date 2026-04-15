'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Premium3DFrameProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'gold' | 'neon' | 'diamond';
}

/**
 * Premium 3D Avatar Frame Example
 * Demonstrates 3D depth using advanced CSS gradients, box-shadows, and animations.
 */
export function Premium3DFrame({ 
  children, 
  className,
  variant = 'gold' 
}: Premium3DFrameProps) {
  
  const variants = {
    gold: {
      outer: "from-[#F9E58A] via-[#E8C27E] to-[#B38D4F]",
      inner: "border-[#C19A5B]/50",
      glow: "shadow-[0_0_30px_rgba(232,194,126,0.5)]",
      elements: "bg-[#F9E58A]"
    },
    neon: {
      outer: "from-[#A855F7] via-[#D946EF] to-[#7C3AED]",
      inner: "border-purple-400/50",
      glow: "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
      elements: "bg-[#D946EF]"
    },
    diamond: {
      outer: "from-[#BAE6FD] via-[#7DD3FC] to-[#0EA5E9]",
      inner: "border-blue-300/50",
      glow: "shadow-[0_0_30px_rgba(14,165,233,0.5)]",
      elements: "bg-[#7DD3FC]"
    }
  };

  const v = variants[variant];

  return (
    <div className={cn("relative p-2 flex items-center justify-center", className)}>
      {/* 3D Rotating Light Effect */}
      <div className={cn(
        "absolute inset-0 rounded-full animate-[spin_4s_linear_infinite] p-[2px] bg-gradient-to-tr",
        v.outer,
        v.glow
      )}>
        <div className="w-full h-full rounded-full bg-black/80 backdrop-blur-md" />
      </div>

      {/* Main Frame Body (3D Perspective) */}
      <div className={cn(
        "relative rounded-full border-[6px] shadow-2xl p-0.5",
        "bg-gradient-to-b", v.outer,
        "border-white/20"
      )}>
        <div className={cn(
          "rounded-full border-2 overflow-hidden",
          v.inner
        )}>
          {children}
        </div>
      </div>

      {/* Floating 3D Elements (Ornaments) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Ornament (e.g. Crown) */}
        <div className={cn(
          "absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg rotate-45 shadow-xl animate-bounce",
          "bg-gradient-to-br", v.outer, "border border-white/40"
        )}>
          <div className="w-full h-full flex items-center justify-center -rotate-45">
            <span className="text-sm">👑</span>
          </div>
        </div>

        {/* Side Crystals */}
        <div className={cn(
          "absolute top-1/4 -left-1 w-3 h-6 rounded-full blur-[1px] animate-pulse",
          v.elements
        )} />
        <div className={cn(
          "absolute bottom-1/4 -right-1 w-3 h-6 rounded-full blur-[1px] animate-pulse delay-500",
          v.elements
        )} />
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Example usage component
export default function ThreeDFrameDemo() {
  return (
    <div className="flex flex-wrap gap-12 p-20 bg-[#0f172a] items-center justify-center min-h-[400px]">
      <Premium3DFrame variant="gold">
        <div className="w-24 h-24 bg-slate-800 flex items-center justify-center text-3xl">👤</div>
      </Premium3DFrame>

      <Premium3DFrame variant="neon">
        <div className="w-24 h-24 bg-slate-800 flex items-center justify-center text-3xl">👤</div>
      </Premium3DFrame>

      <Premium3DFrame variant="diamond">
        <div className="w-24 h-24 bg-slate-800 flex items-center justify-center text-3xl">👤</div>
      </Premium3DFrame>
    </div>
  );
}
