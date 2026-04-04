'use client';

import React from 'react';
import { Sparkles, Crown, Shield, Star, Trophy, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VipTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'SVIP';

interface VipBadgeProps {
  level?: number;
  tier?: VipTier;
  className?: string;
  showText?: boolean;
}

/**
 * Premium Elite Badge Component for Ummy Social.
 * Features luxury gradients and dynamic icons for VIP levels 1-10.
 */
export function VipBadge({ level = 0, tier, className, showText = true }: VipBadgeProps) {
  const [isHydrated, setIsHydrated] = React.useState(false);
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || (level === 0 && !tier)) return null;

  // Derive tier from level if not provided
  const activeTier = tier || (
    level >= 100 ? 'SVIP' :
    level >= 50 ? 'DIAMOND' :
    level >= 20 ? 'GOLD' :
    level >= 10 ? 'SILVER' : 
    'BRONZE'
  );

  const TIER_CONFIG: Record<VipTier, { bg: string, text: string, icon: any, label: string }> = {
    'BRONZE': { 
      bg: 'from-orange-700 via-orange-800 to-orange-900', 
      text: 'text-orange-200',
      icon: Shield,
      label: 'VIP'
    },
    'SILVER': { 
      bg: 'from-slate-400 via-slate-500 to-slate-600', 
      text: 'text-slate-100',
      icon: Star,
      label: 'VIP'
    },
    'GOLD': { 
      bg: 'from-yellow-400 via-amber-500 to-yellow-600', 
      text: 'text-amber-900',
      icon: Crown,
      label: 'VIP'
    },
    'DIAMOND': { 
      bg: 'from-blue-400 via-indigo-500 to-blue-600', 
      text: 'text-blue-50',
      icon: Trophy,
      label: 'VIP'
    },
    'SVIP': { 
      bg: 'from-purple-600 via-red-600 to-orange-600 animate-shimmer-gold', 
      text: 'text-white',
      icon: Zap,
      label: 'SVIP'
    }
  };

  const config = TIER_CONFIG[activeTier];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-sm border border-white/20 shadow-lg select-none relative overflow-hidden",
      "bg-gradient-to-r",
      config.bg,
      className
    )}>
      <Icon className={cn("h-3 w-3 fill-current", config.text)} />
      {showText && (
        <span className={cn("text-[8px] font-black uppercase tracking-tight", config.text)}>
          {config.label} {level > 0 ? level : ''}
        </span>
      )}
      <Sparkles className={cn("h-2.5 w-2.5 absolute -top-1 -right-1 opacity-50 animate-pulse", config.text)} />
      
      {activeTier === 'SVIP' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer-gold {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer-gold {
            background-size: 200% 100%;
            animation: shimmer-gold 2s linear infinite;
          }
        ` }} />
      )}
    </div>
  );
}
