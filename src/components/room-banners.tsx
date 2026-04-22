'use client';

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import { Sparkles, Trophy, Rocket, Crown, Gift } from "lucide-react";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: any;
  action?: (type: string) => void;
}

interface RoomBannersProps {
  onOpenSupport?: () => void;
  onOpenSpin?: () => void;
  onOpenChest?: () => void;
}

const BANNERS: BannerSlide[] = [
  {
    id: 'weekly-star',
    title: 'Weekly Star',
    subtitle: '1:1.000.000',
    color: 'from-purple-600/80 via-indigo-600/80 to-purple-900/80',
    icon: Sparkles,
  },
  {
    id: 'aristocracy',
    title: 'Merge Aristocracy',
    subtitle: 'Exclusive Perks',
    color: 'from-blue-600/80 via-slate-800/80 to-blue-900/80',
    icon: Rocket,
  },
  {
    id: 'room-support',
    title: 'Room Support',
    subtitle: 'Champion Bonus',
    color: 'from-amber-500/80 via-orange-600/80 to-red-900/80',
    icon: Trophy,
  },
  {
    id: 'golden-chest',
    title: 'Golden Chest',
    subtitle: 'Win 50K Coins',
    color: 'from-yellow-600/80 via-amber-700/80 to-yellow-900/80',
    icon: Crown,
  },
  {
    id: 'lucky-spin',
    title: 'Lucky Spin',
    subtitle: 'Try Your Luck',
    color: 'from-rose-500/80 via-red-600/80 to-rose-900/80',
    icon: Gift,
  }
];

export function RoomBanners({ onOpenSupport, onOpenSpin, onOpenChest }: RoomBannersProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  return (
    <div className="w-[75px] group select-none">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-0">
          {BANNERS.map((banner) => (
            <CarouselItem key={banner.id} className="pl-0">
              <div 
                className={cn(
                  "relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.4)] border border-white/20 bg-gradient-to-br transition-all duration-300 active:scale-95 cursor-pointer",
                  banner.color
                )}
                onClick={() => {
                  if (banner.id === 'room-support') onOpenSupport?.();
                  if (banner.id === 'lucky-spin') onOpenSpin?.();
                  if (banner.id === 'golden-chest') onOpenChest?.();
                }}
              >
                {/* Visual Flair */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/40" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5 text-center">
                  <div className="mb-1 p-1 bg-white/20 rounded-lg backdrop-blur-md border border-white/10">
                    <banner.icon className="h-5 w-5 text-white drop-shadow-glow" />
                  </div>
                  <h4 className="text-[9px] font-black uppercase tracking-tighter text-white leading-tight mb-1 drop-shadow-md">
                    {banner.title}
                  </h4>
                  <div className="mt-auto bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5">
                    <span className="text-[7px] font-bold text-yellow-300/90 whitespace-nowrap">
                      {banner.subtitle}
                    </span>
                  </div>
                </div>

                {/* Animated Shine Effect */}
                <div className="absolute inset-x-0 h-10 -top-10 bg-white/10 blur-xl animate-[shine_3s_infinite]" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      {/* Pagination Dots (Compact) */}
      <div className="flex justify-center gap-1 mt-1.5 py-1">
        {BANNERS.map((_, i) => (
          <div 
            key={i} 
            className="h-1 w-1 rounded-full bg-white/20"
          />
        ))}
      </div>
    </div>
  );
}
