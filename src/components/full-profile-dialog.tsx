'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Star,
  Sparkles,
  Calendar,
  Globe,
  Loader,
  Armchair
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { GoldCoinIcon } from '@/components/icons';

// Registries
import { MEDAL_REGISTRY } from '@/constants/medals';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { VEHICLE_REGISTRY } from '@/constants/vehicles';

// ==========================================
// 1. LEVEL BADGES (RICH & CHARM) - MERGED
// ==========================================

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

export const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-br from-amber-400 to-amber-600 pl-1 pr-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/10 -skew-x-[30deg]"></div>
    <StarIcon className="h-2.5 w-2.5 fill-white text-white" />
    <span className="text-[10px] font-outfit font-black text-white leading-none drop-shadow-sm">Lv.{level}</span>
  </div>
);

export const CharmLevelBadge = ({ level, className }: { level: number, className?: string }) => (
  <div className={cn("flex items-center gap-1 bg-gradient-to-br from-pink-400 to-rose-500 pl-1 pr-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0", className)}>
    <div className="absolute inset-0 bg-white/10 -skew-x-[30deg]"></div>
    <Sparkles className="h-2.5 w-2.5 fill-white text-white" />
    <span className="text-[10px] font-outfit font-black text-white leading-none drop-shadow-sm">Lv.{level}</span>
  </div>
);

// ==========================================
// 2. GLOSSY 3D ROLE TAGS - MERGED
// ==========================================

export const SVGA_OfficialTag = () => (
  <div className="relative inline-flex items-center h-[18px] rounded-md bg-gradient-to-r from-[#1DA1F2] to-[#0052CC] shadow-[0_2px_8px_rgba(0,82,204,0.25),inset_0_1px_2px_rgba(255,255,255,0.5)] px-1.5 border border-[#1DA1F2]/50 -ml-0.5 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[40%] bg-gradient-to-b from-white/60 to-transparent rounded-sm blur-[0.5px]" />
    <svg viewBox="0 0 24 24" className="w-3 h-3 relative z-10 drop-shadow-sm mr-1" fill="none">
       <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
    </svg>
    <span className="relative z-10 text-[9px] font-black text-white tracking-widest uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Official</span>
  </div>
);

export const SVGA_SellerTag = () => (
  <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#FFAE00] via-[#FFC300] to-[#FF9500] shadow-[0_2px_8px_rgba(255,149,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#FFE1A8] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="redBag" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5F5F" />
            <stop offset="100%" stopColor="#C81E1E" />
          </linearGradient>
        </defs>
        <path d="M20 8 C16 8 14 11 14 13 L26 13 C26 11 24 8 20 8 Z" fill="#991B1B" />
        <path d="M12 14 C12 14 8 20 8 28 C8 34 12 36 20 36 C28 36 32 34 32 28 C32 20 28 14 28 14 Z" fill="url(#redBag)" />
        <text x="20" y="30" fontSize="15" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>$</text>
        <ellipse cx="14" cy="22" rx="3" ry="1.5" fill="white" fillOpacity="0.4" transform="rotate(-20 14 22)" />
      </svg>
    </div>
    <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Seller</span>
  </div>
);

// ==========================================
// 3. IDENTIFICATION BADGES - MERGED
// ==========================================

export const SVGA_GlossyID = ({ variant, label }: { variant?: string, label: string }) => {
  const idNum = label ? label.replace('ID: ', '').trim() : '000000';

  return (
    <div className="relative flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#6b1e60] via-[#912480] to-[#b33596] shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.4)] ml-1 pr-2.5 pl-[20px] border border-[#c157a8]">
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[30px] h-[30px] z-10 flex items-center justify-center">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBE3A4" />
              <stop offset="40%" stopColor="#D2923A" />
              <stop offset="60%" stopColor="#F9D479" />
              <stop offset="100%" stopColor="#B37322" />
            </linearGradient>
            <linearGradient id="purpleGem" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D57EEB" />
              <stop offset="50%" stopColor="#8A2387" />
              <stop offset="100%" stopColor="#4A00E0" />
            </linearGradient>
            <linearGradient id="textGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F3E5F5" />
              <stop offset="100%" stopColor="#D1A3D8" />
            </linearGradient>
            <linearGradient id="goldS" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF1AA" />
              <stop offset="100%" stopColor="#F3A92A" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <path d="M30 4 L54 18 L54 42 L30 56 L6 42 L6 18 Z" fill="url(#goldFrame)" />
          <path d="M30 8 L50 20 L50 40 L30 52 L10 40 L10 20 Z" fill="url(#purpleGem)" />
          <path d="M10 20 L30 8 L50 20 L30 28 Z" fill="white" fillOpacity="0.15" />

          <text x="30" y="38" fontFamily="sans-serif" fontWeight="900" fontSize="24" fill="url(#textGloss)" textAnchor="middle" letterSpacing="-1" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.6)' }}>ID</text>

          <path d="M18 45 C 24 58, 36 58, 42 45 C 36 52, 24 52, 18 45 Z" fill="url(#goldFrame)" />
          <path d="M22 43 L38 43 L34 54 L26 54 Z" fill="url(#goldFrame)" />

          <text x="30" y="52" fontFamily="sans-serif" fontWeight="900" fontSize="13" fill="url(#goldS)" textAnchor="middle" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>S</text>

          <path d="M 45 10 Q 48 10 48 7 Q 48 10 51 10 Q 48 10 48 13 Q 48 10 45 10 Z" fill="white" filter="url(#glow)"/>
          <path d="M 12 38 Q 14 38 14 36 Q 14 38 16 38 Q 14 38 14 40 Q 14 38 12 38 Z" fill="white" filter="url(#glow)"/>
        </svg>
      </div>
      <div className="absolute top-[1px] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[0.5px]" />
      <span className="relative z-10 text-[10px] font-bold text-white ml-1.5 tracking-[0.1em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {idNum}
      </span>
    </div>
  );
};

export const StandardIDTag = ({ idNum }: { idNum: string }) => (
  <span className="text-[12px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md ml-2 backdrop-blur-sm border border-slate-200/50">
    ID: {idNum}
  </span>
);

// Country code to flag emoji mapping (simple)
const getCountryFlagEmoji = (countryName: string): string => {
  if (!countryName) return '';
  const countryMap: Record<string, string> = {
    'India': '🇮🇳',
    'USA': '🇺🇸',
    'UK': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'South Korea': '🇰🇷',
    'Russia': '🇷🇺',
    'South Africa': '🇿🇦',
  };
  // fallback: try to match first word or return empty
  const matched = Object.entries(countryMap).find(([key]) =>
    countryName.toLowerCase().includes(key.toLowerCase())
  );
  return matched ? matched[1] : '';
};

const GIFT_REGISTRY: Record<string, any> = {
  'heart': { id: 'heart', name: 'Heart', price: 99, emoji: '❤️' },
  'cake': { id: 'cake', name: 'Cake', price: 499, emoji: '🍰' },
  'popcorn': { id: 'popcorn', name: 'Popcorn', price: 799, emoji: '🍿' },
  'donut': { id: 'donut', name: 'Donut', price: 299, emoji: '🍩' },
  'lollipop': { id: 'lollipop', name: 'Lollipop', price: 199, emoji: '🍭' },
  'apple': { id: 'apple', name: 'Apple', price: 100, emoji: '🍎' },
  'watermelon': { id: 'watermelon', name: 'Watermelon', price: 499, emoji: '🍉' },
  'mango': { id: 'mango', name: 'Mango', price: 999, emoji: '🥭' },
  'strawberry': { id: 'strawberry', name: 'Strawberry', price: 2999, emoji: '🍓' },
  'cherry': { id: 'cherry', name: 'Cherry', price: 5000, emoji: '🍒' },
  'dm': { id: 'dm', name: 'Ball', price: 700000, emoji: '🎸' },
  'tp': { id: 'tp', name: 'Guitar', price: 999999, emoji: '🎳' },
};

interface FullProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  stats: any;
  followData?: any;
  onFollow?: () => void;
  isProcessingFollow?: boolean;
  isOwnProfile?: boolean;
  onChat?: (recipient: any) => void;
}

const calculateAge = (birthday: string) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const GenderAgeTag = ({ gender, birthday }: { gender: string | null | undefined, birthday?: string }) => {
  const age = calculateAge(birthday || '');
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-sm shrink-0",
      gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
    )}>
      <span className="text-[11px] font-bold text-white leading-none">{gender === 'Female' ? '♀' : '♂'}</span>
      {age !== null && <span className="text-[11px] font-bold text-white leading-none">{age}</span>}
    </div>
  );
};

const ProfileSection = ({ children, isEmpty, emptyLabel }: { children: React.ReactNode, isEmpty: boolean, emptyLabel: string }) => (
  <div className="mt-4">
    {isEmpty ? (
      <div className="py-12 flex flex-col items-center justify-center gap-2 opacity-40">
        <Sparkles className="h-6 w-6 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{emptyLabel}</span>
      </div>
    ) : (
      <div className="grid grid-cols-4 gap-4">
        {children}
      </div>
    )}
  </div>
);

const generateUnique6DigitId = () => {
  const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums.slice(0, 6).join('');
};

export function FullProfileDialog({
  open,
  onOpenChange,
  profile,
  stats,
  followData,
  onFollow,
  isProcessingFollow,
  isOwnProfile,
  onChat
}: FullProfileDialogProps) {
  const [api, setApi] = useState<CarouselApi>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'medal' | 'vehicle' | 'frame' | 'gift'>('medal');
  const images = profile?.spaceImages || [];

  useEffect(() => {
    if (!api || images.filter(Boolean).length <= 1) return;
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [api, images.filter(Boolean).length]);

  if (!profile) return null;

  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {};

  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  const ownedFrames = ownedItems.filter((id: string) => AVATAR_FRAMES[id]);

  const richLevel = profile.richLevel || profile.level?.rich || 1;
  const charmLevel = profile.charmLevel || profile.level?.charm || 1;

  const displayId = profile.accountNumber || generateUnique6DigitId();
  const countryFlag = getCountryFlagEmoji(profile.country || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 w-full h-full max-w-none bg-white p-0 border-none m-0 rounded-none z-[150] overflow-hidden">
        <div className="w-full h-full overflow-y-auto no-scrollbar relative flex flex-col font-outfit">

          {/* Top Section - Background */}
          <div className="relative h-[35vh] w-full shrink-0 bg-slate-900 overflow-hidden">
            {images.filter(Boolean).length > 0 ? (
              <Carousel setApi={setApi} className="h-full w-full" opts={{ loop: true }}>
                <CarouselContent className="h-full ml-0">
                  {images.filter(Boolean).map((url: string, i: number) => (
                    <CarouselItem key={i} className="h-full pl-0 basis-full">
                      <img src={url} className="h-full w-full object-cover" alt="" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="h-full w-full relative">
                 <img
                   src={profile.avatarUrl}
                   className="h-full w-full object-cover"
                   alt="background-avatar"
                 />
              </div>
            )}

            <div className="absolute top-12 left-0 right-0 px-6 flex items-center justify-between z-[100]">
              <button onClick={() => onOpenChange(false)} className="h-10 w-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="h-10 w-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
          </div>

          {/* Content Section - Main Card - GLOSSY WHITE */}
          <div className="relative z-20 bg-white/98 backdrop-blur-2xl rounded-none px-6 pt-0 pb-32 mt-[-20px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-white/80 min-h-[70vh]">

            <div className="flex flex-col items-center">
              <div className="relative -mt-10 mb-1 z-30">
                <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-xl relative">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold bg-slate-100 text-slate-400">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </AvatarFrame>
              </div>

              <div className="text-center space-y-2.5 w-full">
                {/* 1) Name - unchanged */}
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h2>
                </div>

                {/* 2) Gender tag + country flag + ID (Budget/Non-Budget) - all in one row */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                  {countryFlag && (
                    <span className="text-xl leading-none shrink-0">{countryFlag}</span>
                  )}
                  {profile.isBudget ? (
                    <SVGA_GlossyID label={`ID: ${displayId}`} />
                  ) : (
                    <StandardIDTag idNum={displayId} />
                  )}
                </div>

                {/* 3) Rich/Charm level badges + all tags (Official, Seller) together */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <RichLevelBadge level={richLevel} />
                  <CharmLevelBadge level={charmLevel} />
                  {(profile.isOfficial || profile.tags?.includes('Official')) && (
                    <SVGA_OfficialTag />
                  )}
                  {(profile.isSeller || profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t))) && (
                    <SVGA_SellerTag />
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bar (unchanged) */}
            <div className="flex justify-between items-center py-5 mb-0 mx-[-24px]">
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.fans}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fans</span>
              </div>
              <div className="flex flex-col items-center text-slate-200 text-2xl font-thin">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.following}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Following</span>
              </div>
              <div className="flex flex-col items-center text-slate-200 text-2xl font-thin">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.friends}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Friend</span>
              </div>
               <div className="flex flex-col items-center text-slate-200 text-2xl font-thin">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.visitors}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visitors</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100 my-2" />

            {/* Top Contribution Section (unchanged) */}
            <div className="mt-2 mb-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Top Contribution</h3>
              <div className="flex items-end justify-center gap-4 mt-5">
                <div className="flex flex-col items-center justify-center space-y-1.5 -mb-2">
                  <div className="relative inline-block">
                    <div className="absolute -top-4 -left-2.5 z-30 -rotate-[22deg] text-xl drop-shadow-md">👑</div>
                    <div className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-[2px] border-[#F2D06B] bg-slate-50 shadow-md">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Armchair className="w-5 h-5 text-amber-200" fill="#F4D368" strokeWidth={1} />
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 uppercase">{profile.username || 'Empty'}</span>
                </div>

                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="relative inline-block">
                    <div className="absolute -top-3.5 -left-2 z-30 -rotate-[22deg] text-lg drop-shadow-md">👑</div>
                    <div className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-[2px] border-[#C0C0C0] bg-slate-100 shadow-inner">
                      <Armchair className="w-4 h-4 text-slate-300" fill="#C0C0C0" strokeWidth={1} />
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Empty</span>
                </div>

                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="relative inline-block">
                    <div className="absolute -top-3.5 -left-2 z-30 -rotate-[22deg] text-lg drop-shadow-md">👑</div>
                    <div className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-[2px] border-[#8B4513] bg-slate-100 shadow-inner">
                      <Armchair className="w-4 h-4 text-slate-300" fill="#A0522D" strokeWidth={1} />
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Empty</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100 my-2" />

            {/* Signature Bio (unchanged except we removed country from here since flag is now up top) */}
            <div className="mt-2 mb-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Signature Bio</h3>
              <div className="px-1">
                 <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                   {profile.bio || "Synchronized with the Ummy frequency."}
                 </p>
              </div>

              <div className="flex flex-wrap gap-4 px-1 mt-6">
                 {/* country ab yahan nahi dikhega, already flag upar hai - but agar koi extra info chahiye toh globe optional */}
                 {(profile.showBirthday !== false && !!profile.birthday) && (
                   <div className="flex items-center gap-1.5">
                     <Calendar className="h-3 w-3 text-slate-300" />
                     <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">{profile.birthday}</span>
                   </div>
                 )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100 my-2" />

            {/* TAB Navigation (unchanged) */}
            <div className="flex items-center justify-between mt-6 border-b border-slate-100 pb-0">
              {['medal', 'vehicle', 'frame', 'gift'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "text-[11px] font-black uppercase tracking-wider transition-all px-3 py-3 relative w-full text-center",
                    activeTab === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-t-md" />
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT Area (unchanged) */}
            <div className="min-h-[50vh] mt-4 w-full">
              {activeTab === 'medal' && (
                <ProfileSection isEmpty={medals.length === 0} emptyLabel="No Medal Earned">
                  {medals.map((medalId: string) => {
                    const medal = MEDAL_REGISTRY[medalId];
                    if (!medal) return null;
                    return (
                      <div key={medalId} className="flex flex-col items-center gap-1.5 p-1 group">
                        <img src={medal.imageUrl} alt={medal.name} className="h-12 w-12 object-contain group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase truncate w-full text-center tracking-tighter">{medal.name}</span>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}

              {activeTab === 'vehicle' && (
                <ProfileSection isEmpty={ownedVehicles.length === 0} emptyLabel="No Vehicle Owned">
                  {ownedVehicles.map((id: string) => {
                    const vehicle = VEHICLE_REGISTRY[id];
                    if (!vehicle) return null;
                    const isActive = profile.inventory?.activeVehicle === id;
                    return (
                      <div key={id} className="flex flex-col items-center gap-2 p-1 relative">
                        <div className="text-4xl py-1 animate-float">{vehicle.icon}</div>
                        <div className="flex flex-col items-center gap-1 w-full">
                          <span className="text-[8px] font-black text-slate-700 truncate uppercase tracking-tighter">{vehicle.name}</span>
                          <button className={cn(
                            "w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm border",
                            isActive ? "bg-emerald-500 text-white border-emerald-600" : "bg-slate-100 text-slate-400 border-slate-200"
                          )}>
                            {isActive ? 'Active' : (isOwnProfile ? 'Use' : 'Permanent')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}

              {activeTab === 'frame' && (
                <ProfileSection isEmpty={ownedFrames.length === 0} emptyLabel="No Frame Owned">
                  {ownedFrames.map((id: string) => {
                    const frame = AVATAR_FRAMES[id];
                    if (!frame) return null;
                    const isActive = profile.inventory?.activeFrame === id;
                    return (
                      <div key={id} className="flex flex-col items-center gap-2 p-1 relative">
                        <div className="h-12 w-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative shadow-sm">
                          {frame.imageUrl ? (
                            <img src={frame.imageUrl} className="w-full h-full object-cover scale-150" alt="" />
                          ) : (
                            <div className="w-full h-full opacity-50" style={{ background: frame.gradient }} />
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1 w-full">
                          <span className="text-[8px] font-black text-slate-700 truncate uppercase tracking-tighter">{frame.name}</span>
                          <button className={cn(
                            "w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm border",
                            isActive ? "bg-emerald-500 text-white border-emerald-600" : "bg-slate-100 text-slate-400 border-slate-200"
                          )}>
                            {isActive ? 'Active' : (isOwnProfile ? 'Use' : 'Permanent')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}

              {activeTab === 'gift' && (
                <ProfileSection isEmpty={Object.keys(receivedGifts).length === 0} emptyLabel="No Gift Received">
                  {Object.entries(receivedGifts).map(([giftId, count]: [string, any]) => {
                    const gift = GIFT_REGISTRY[giftId];
                    if (!gift) return null;
                    return (
                      <div key={giftId} className="flex flex-col items-center gap-1 p-1 relative">
                        <div className="absolute top-1 right-2 text-[10px] font-black text-pink-500 italic">x{count}</div>
                        <div className="text-3xl py-1">{gift.emoji}</div>
                        <div className="flex items-center gap-0.5 bg-slate-50 px-2 rounded-full border border-slate-100">
                          <GoldCoinIcon className="h-2 w-2" />
                          <span className="text-[9px] font-black text-slate-600">{gift.price}</span>
                        </div>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}
            </div>
          </div>
        </div>

        {/* Footer (unchanged) */}
        {!isOwnProfile && (
          <footer className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-white/95 backdrop-blur-md border-t border-slate-100 flex gap-4 z-[160]">
             <button
               onClick={onFollow}
               disabled={isProcessingFollow}
               className="flex-1 h-14 border-2 border-pink-500 text-pink-500 rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm active:scale-95 transition-all"
             >
               {isProcessingFollow ? <Loader className="h-5 w-5 animate-spin" /> : (
                 <>
                   <Heart className={cn("h-5 w-5", followData && "fill-current")} />
                   {followData ? "Joined" : "Follow"}
                 </>
               )}
             </button>
             <button
               onClick={() => {
                 if (onChat) {
                   onChat(profile);
                   onOpenChange(false);
                 } else {
                   router.push(`/messages?userId=${profile?.id || profile?.uid}`);
                 }
               }}
               className="flex-1 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm shadow-lg shadow-blue-200 active:scale-95 transition-all"
             >
               <MessageCircle className="h-5 w-5" />
               Chat
             </button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
            }
