'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  Calendar,
  Loader,
  Armchair,
  Pencil
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
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

// Registries
import { MEDAL_REGISTRY, MedalConfig } from '@/constants/medals';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { VEHICLE_REGISTRY } from '@/constants/vehicles';

// ==========================================
// 1. BUDGET LEVEL BADGE (UPDATED - RED/ORANGE/YELLOW SVG)
// ==========================================
const BudgetLevelBadge = ({ level }: { level: number }) => {
  // Patti (width) reduced and height slightly reduced. 
  // If level < 1 (Level 0), we apply grayscale and slight opacity to make it colorless.
  return (
    <div className={cn("inline-flex items-center shrink-0", level < 1 && "grayscale opacity-75")}>
      <svg viewBox="0 0 280 120" style={{ height: '22px', width: 'auto' }} className="drop-shadow-md cursor-default transition-transform hover:-translate-y-[2px] hover:scale-[1.015]">
        <defs>
          <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e92848"/>
            <stop offset="50%" stopColor="#c4122f"/>
            <stop offset="100%" stopColor="#8f0a1f"/>
          </linearGradient>
          <linearGradient id="orangeBorder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffad42"/>
            <stop offset="50%" stopColor="#ff7e00"/>
            <stop offset="100%" stopColor="#d65a00"/>
          </linearGradient>
          <linearGradient id="orangeHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe0b3" stopOpacity="0.95"/>
            <stop offset="40%" stopColor="#ffcc80" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#ffad42" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="redGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.36"/>
            <stop offset="28%" stopColor="#ffffff" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="starTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff176"/>
            <stop offset="38%" stopColor="#ffeb3b"/>
            <stop offset="100%" stopColor="#ffca28"/>
          </linearGradient>
          <linearGradient id="starMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffeb3b"/>
            <stop offset="100%" stopColor="#ffca28"/>
          </linearGradient>
          <linearGradient id="starDeep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffca28"/>
            <stop offset="100%" stopColor="#ffa000"/>
          </linearGradient>
          <linearGradient id="starDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffa000"/>
            <stop offset="100%" stopColor="#c67100"/>
          </linearGradient>

          <filter id="badgeShadow" x="-30%" y="-40%" width="160%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#000" floodOpacity="0.75"/>
          </filter>
          <filter id="textShadow" x="-20%" y="-20%" width="140%" height="180%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="1.3" floodColor="#8f0a1f" floodOpacity="1"/>
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.55"/>
          </filter>
          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#ffb300" floodOpacity="0.45"/>
          </filter>
        </defs>

        <g filter="url(#badgeShadow)">
          {/* BANNER - Patti width further reduced */}
          <path d="M85 34 H235 L249 86 H85 Z" fill="none" stroke="#4a0a14" strokeWidth="14" strokeLinejoin="round" opacity="0.65"/>
          <path d="M85 34 H235 L249 86 H85 Z" fill="url(#redFill)" stroke="url(#orangeBorder)" strokeWidth="10" strokeLinejoin="round"/>
          <path d="M85 34 H235 L249 86 H85 Z" fill="none" stroke="url(#orangeHighlight)" strokeWidth="2.4" strokeLinejoin="round" opacity="0.92"/>
          <path d="M85 34 H235 L249 86 H85 Z" fill="url(#redGloss)" opacity="0.24"/>
          <path d="M85 38 H232 L245 82 H89 Z" fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" opacity="0.18"/>

          {/* PENTAGON */}
          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="none" stroke="#4a0a14" strokeWidth="14" strokeLinejoin="round" opacity="0.65"/>
          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="url(#redFill)" stroke="url(#orangeBorder)" strokeWidth="10" strokeLinejoin="round"/>
          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="none" stroke="url(#orangeHighlight)" strokeWidth="2.4" strokeLinejoin="round" opacity="0.92"/>
          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="url(#redGloss)" opacity="0.22"/>
          <path d="M66 12 L112 45 L93.5 98.5 L38.5 98.5 L20 45 Z" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.18"/>

          {/* STAR - 10 faceted triangles */}
          <g filter="url(#starGlow)" stroke="#b25f00" strokeOpacity="0.28" strokeWidth="0.6" strokeLinejoin="round">
            <path d="M66 60 L66 26 L74.229 48.674 Z" fill="url(#starTop)"/>
            <path d="M66 60 L57.771 48.674 L66 26 Z" fill="url(#starTop)"/>
            <path d="M66 60 L74.229 48.674 L98.34 49.494 Z" fill="url(#starMid)"/>
            <path d="M66 60 L33.663 49.494 L57.771 48.674 Z" fill="url(#starMid)"/>
            <path d="M66 60 L98.34 49.494 L79.315 64.326 Z" fill="url(#starMid)"/>
            <path d="M66 60 L52.685 64.326 L33.663 49.494 Z" fill="url(#starMid)"/>
            <path d="M66 60 L79.315 64.326 L85.985 87.506 Z" fill="url(#starDeep)"/>
            <path d="M66 60 L46.015 87.506 L52.685 64.326 Z" fill="url(#starDeep)"/>
            <path d="M66 60 L85.985 87.506 L66 74 Z" fill="url(#starDark)"/>
            <path d="M66 60 L66 74 L46.015 87.506 Z" fill="url(#starDark)"/>
          </g>

          {/* TEXT - Adjusted X dynamically since patti is smaller */}
          <text x="165" y="68.5" textAnchor="middle" fontFamily="Inter, 'Segoe UI Black', 'Arial Black', sans-serif" fontSize="36" fontWeight="900" letterSpacing="0.5" fill="#ffffff" stroke="#ff7e00" strokeWidth="2.8" strokeLinejoin="round" paintOrder="stroke" filter="url(#textShadow)">lv.{level}</text>
        </g>
      </svg>
    </div>
  );
};

// ==========================================
// 2. GLOSSY 3D ROLE TAGS
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
// 3. IDENTIFICATION BADGES
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
  <span className="text-[12px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md ml-0 backdrop-blur-sm border border-slate-200/50">
    ID: {idNum}
  </span>
);

// Country code to flag emoji mapping
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // STRICT ID LOCK: State ke through generate function ko sirf ek baar call kiya,
  // Taki agar profile.accountNumber na ho toh yeh lock ho jaye aur automatically change na ho.
  const [lockedFallbackId] = useState(() => generateUnique6DigitId());

  const images = profile?.spaceImages || [];

  useEffect(() => {
    if (!api || images.filter(Boolean).length <= 1) return;
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [api, images.filter(Boolean).length]);

  if (!profile) return null;

  const firestore = useFirestore();
  const medalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "medals"));
  }, [firestore]);
  const { data: firestoreMedals } = useCollection(medalsQuery);

  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {};

  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  const ownedFrames = ownedItems.filter((id: string) => AVATAR_FRAMES[id]);

  // Using ?? 0 ensures that if there's no budget it defaults to 0, activating the colorless state.
  const budgetLevel = profile.budgetLevel ?? profile.level?.budget ?? 0;
  
  // LOGIC APPLY: Pehle backend ki ID check karega, agar nahi hui toh locked fallback id use karega.
  const displayId = profile.accountNumber || lockedFallbackId;
  
  const countryFlag = getCountryFlagEmoji(profile.country || '');
  const hasOfficialTag = profile.isOfficial || profile.tags?.includes('Official');

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

            {/* Top Buttons - Back & (3-dot OR Pencil) */}
            <div className="absolute top-12 left-0 right-0 px-6 flex items-center justify-between z-[100]">
              <button onClick={() => onOpenChange(false)} className="text-white">
                <ChevronLeft className="h-6 w-6" />
              </button>
              {isOwnProfile ? (
                <button onClick={() => setEditDialogOpen(true)} className="text-white">
                  <Pencil className="h-6 w-6" />
                </button>
              ) : (
                <button className="text-white">
                  <MoreHorizontal className="h-6 w-6" />
                </button>
              )}
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

              <div className="text-center space-y-1.5 w-full">
                
                {/* 1) Name + Gender tag + Country Flag */}
                <div className="flex items-center justify-center gap-2 flex-wrap -mt-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h2>
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                  {countryFlag && (
                    <span className="text-xl leading-none shrink-0">{countryFlag}</span>
                  )}
                </div>

                {/* 2) ID */}
                <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
                  {hasOfficialTag ? (
                    <SVGA_GlossyID label={`ID: ${displayId}`} />
                  ) : profile.isBudget ? (
                    <SVGA_GlossyID label={`ID: ${displayId}`} />
                  ) : (
                    <StandardIDTag idNum={displayId} />
                  )}
                </div>

                {/* 3) Tags (Budget, Official, Seller) */}
                <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                  <BudgetLevelBadge level={budgetLevel} />
                  {hasOfficialTag && <SVGA_OfficialTag />}
                  {(profile.isSeller || profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t))) && (
                    <SVGA_SellerTag />
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
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

            {/* Top Contribution Section */}
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

            {/* Signature Bio */}
            <div className="mt-2 mb-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Signature Bio</h3>
              <div className="px-1">
                 <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                   {profile.bio || "Synchronized with the Ummy frequency."}
                 </p>
              </div>

              <div className="flex flex-wrap gap-4 px-1 mt-6">
                 {(profile.showBirthday !== false && !!profile.birthday) && (
                   <div className="flex items-center gap-1.5">
                     <Calendar className="h-3 w-3 text-slate-300" />
                     <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">{profile.birthday}</span>
                   </div>
                 )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100 my-2" />

            {/* TAB Navigation */}
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

            {/* TAB CONTENT Area */}
            <div className="min-h-[50vh] mt-4 w-full">
              {activeTab === 'medal' && (
                <ProfileSection isEmpty={medals.length === 0} emptyLabel="No Medal Earned">
                  {medals.map((medalId: string) => {
                    const fsMedal = firestoreMedals?.find((m: any) => m.id === medalId);
                    const staticMedal = MEDAL_REGISTRY[medalId];
                    const medal: MedalConfig | null = fsMedal
                      ? { id: fsMedal.id, name: fsMedal.name, imageUrl: fsMedal.imageUrl, description: fsMedal.description || '', tier: fsMedal.tier || 'common' }
                      : staticMedal || null;
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

        {/* Footer */}
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

        {/* Edit Profile Dialog */}
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
        />
      </DialogContent>
    </Dialog>
  );
}
