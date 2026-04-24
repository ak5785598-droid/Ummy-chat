'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader, 
  ChevronLeft,
  Wallet, 
  Disc3, 
  Heart, 
  Ticket, 
  Theater, 
  Shirt, 
  CircleDollarSign, 
  MoreHorizontal,
  Pencil,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
  Users,
  Gem,
  Calendar,
  Globe,
  Phone,
  Camera,
  ShieldAlert,
  Medal as MedalIcon,
  DollarSign,
  HelpCircle,
  Check
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, deleteDocumentNonBlocking, setDocumentNonBlocking, useFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { DirectMessageDialog } from '@/components/direct-message-dialog';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { OfficialTag } from '@/components/official-tag';
import { SellerTag } from '@/components/seller-tag';
import { doc, serverTimestamp, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { SocialRelationsDialog } from '@/components/social-relations-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { SellerTransferDialog } from "@/components/seller-transfer-dialog";
import { BudgetTag } from "@/components/budget-tag";
import { FullProfileDialog } from '@/components/full-profile-dialog';
import { ReportUserDialog } from '@/components/report-user-dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MEDAL_REGISTRY } from '@/constants/medals';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { VEHICLE_REGISTRY } from '@/constants/vehicles';

// --- CUSTOM 3D SVGA GOLD COIN ICON ---
const SVGA_GoldDollar = () => (
  <div className="relative h-7 w-7 flex items-center justify-center rounded-full bg-gradient-to-b from-[#FFE770] via-[#FDB931] to-[#9E7302] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.2)]">
    <DollarSign className="h-4 w-4 text-[#5C4000] drop-shadow-sm" strokeWidth={3} />
    <div className="absolute top-0.5 left-1 w-2 h-1 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
);

// --- 3D GLOSSY CROWN (LEVEL) ICON ---
const SVGA_LevelCrown = ({ className }: { className?: string }) => (
  <div className={cn("relative h-8 w-8 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFC837" />
          <stop offset="50%" stopColor="#FF8008" />
          <stop offset="100%" stopColor="#FF6A00" />
        </linearGradient>
      </defs>
      <path 
        fill="url(#crownGradient)" 
        d="M5,16 L3,5 L8.5,10 L12,4 L15.5,10 L21,5 L19,16 L5,16 Z M5,19 L19,19 C19,20.1 18.1,21 17,21 L7,21 C5.9,21 5,20.1 5,19 Z" 
      />
      <rect x="9" y="13" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.4" />
    </svg>
    <div className="absolute top-1 right-2 w-1.5 h-1 bg-white/60 rounded-full blur-[1px] rotate-[20deg]" />
  </div>
);

// --- 3D GLOSSY STORE CART ICON ---
const SVGA_StoreCart = ({ className }: { className?: string }) => (
  <div className={cn("relative h-8 w-8 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#3a7bd5" />
        </linearGradient>
      </defs>
      <path 
        fill="url(#cartGradient)" 
        d="M7,18 C5.9,18 5.01,18.9 5.01,20 C5.01,21.1 5.9,22 7,22 C8.1,22 9,21.1 9,20 C9,18.9 8.1,18.1 7,18 Z M1,2 L1,4 L3,4 L6.6,11.59 L5.25,14.04 C5.09,14.32 5,14.65 5,15 C5,16.1 5.9,17 7,17 L19,17 L19,15 L7.42,15 C7.28,15 7.17,14.89 7.17,14.75 L7.2,14.63 L8.1,13 L15.55,13 C16.3,13 16.96,12.59 17.3,11.97 L20.88,5.48 C21.05,5.17 21,4.82 21,4.5 C21,4.22 20.78,4 20.5,4 L5.21,4 L4.27,2 L1,2 Z M17,18 C15.9,18 15.01,18.9 15.01,20 C15.01,21.1 15.9,22 17,22 C18.1,22 19,21.1 19,20 C19,18.9 18.1,18.1 17,18 Z" 
      />
    </svg>
    <div className="absolute top-2 left-2 w-2 h-1 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
);

// --- 3D GLOSSY PURPLE MEDAL ICON ---
const SVGA_MedalStar = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-lg">
      <defs>
        <linearGradient id="medalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <path d="M8,2 L16,2 L15,5 L9,5 Z" fill="#7E22CE" />
      <circle cx="12" cy="13" r="8" fill="url(#medalGradient)" />
      <path 
        fill="white" 
        fillOpacity="0.9"
        d="M12,9.5 L13.2,12.1 L16,12.4 L13.9,14.2 L14.5,17 L12,15.5 L9.5,17 L10.1,14.2 L8,12.4 L10.8,12.1 Z" 
      />
      <path 
        d="M7,10 A6,6 0 0 1 17,10" 
        fill="none" 
        stroke="white" 
        strokeWidth="0.5" 
        strokeLinecap="round" 
        className="opacity-40" 
      />
    </svg>
    <div className="absolute top-3 left-3 w-3 h-1.5 bg-white/30 rounded-full blur-[2px] rotate-[-25deg]" />
  </div>
);

// --- 3D GLOSSY TASK CLIPBOARD ICON ---
const SVGA_TaskClipboard = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="boardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
      <rect x="5" y="4" width="12" height="16" rx="2" fill="url(#boardGradient)" stroke="#CA8A04" strokeWidth="0.5" />
      <rect x="7" y="6" width="8" height="12" rx="1" fill="white" />
      <rect x="9" y="3" width="4" height="2" rx="0.5" fill="#94A3B8" />
      <path d="M8,9 L9,10 L11,8" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8,13 L9,14 L11,12" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(14, 10) rotate(15)">
        <rect x="0" y="0" width="3" height="10" rx="1.5" fill="#334155" />
        <rect x="0" y="4" width="3" height="1" fill="#FDE047" />
        <path d="M0,0 L1.5,-2 L3,0 Z" fill="#334155" />
      </g>
    </svg>
    <div className="absolute top-5 left-6 w-3 h-1.5 bg-white/50 rounded-full blur-[1px] rotate-[-10deg]" />
  </div>
);

// --- 3D GLOSSY INVITE FRIENDS (PINK ENVELOPE HEART) ---
const SVGA_InviteHeart = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="pinkBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF9EB5" />
          <stop offset="100%" stopColor="#FF5C8A" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#pinkBg)" />
      <path d="M8,14 L20,24 L32,14 V28 C32,29.1 31.1,30 30,30 H10 C8.9,30 8,29.1 8,28 V14 Z" fill="white" />
      <path d="M20,24 L8,14 H32 L20,24 Z" fill="#FFD1DC" />
      <path 
        fill="#FF5C8A" 
        d="M20,22 C20,22 18.5,20.5 17.5,20.5 C16.5,20.5 15.5,21.3 15.5,22.5 C15.5,24 18,26 20,27 C22,26 24.5,24 24.5,22.5 C24.5,21.3 23.5,20.5 22.5,20.5 C21.5,20.5 20,22 20,22 Z" 
      />
    </svg>
    <div className="absolute top-2 right-3 w-3 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[25deg]" />
  </div>
);

// --- 3D GLOSSY FAMILY SHIELD ---
const SVGA_FamilyShield = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>
      <path 
        fill="url(#bronzeGradient)" 
        d="M10,6 H30 V26 C30,26 20,34 20,34 C20,34 10,26 10,26 V6 Z" 
        stroke="#5D2E0A" 
        strokeWidth="1"
      />
      <rect x="8" y="4" width="24" height="4" rx="2" fill="#5D2E0A" />
      <circle cx="20" cy="16" r="3.5" fill="#FFE4D1" />
      <circle cx="14" cy="19" r="3.5" fill="#FFE4D1" opacity="0.8" />
      <circle cx="26" cy="19" r="3.5" fill="#FFE4D1" opacity="0.8" />
      <path d="M20,20 Q20,26 26,26 H14 Q20,26 20,20" fill="#FFE4D1" />
    </svg>
    <div className="absolute top-8 left-10 w-2 h-1 bg-white/30 rounded-full blur-[1px]" />
  </div>
);

// --- 3D GLOSSY BAG/SHIRT ICON ---
const SVGA_BagShirt = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="purpleShirt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B678FF" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
      <path 
        d="M10,12 L16,8 L24,8 L30,12 L34,22 L28,26 L28,34 C28,35.1 27.1,36 26,36 L14,36 C12.9,36 12,35.1 12,34 L12,26 L6,22 Z" 
        fill="url(#purpleShirt)" 
      />
      <path 
        d="M22,18 C22,18 26,18 26,22 C26,24 24,26 24,26 C24,26 22,24 22,22 Z" 
        fill="white" 
        opacity="0.8" 
      />
    </svg>
    <div className="absolute top-2 left-3 w-4 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[-15deg]" />
  </div>
);

// --- 3D GLOSSY CP HEART ICON ---
const SVGA_CpHeart = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="cpPink" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9E" />
          <stop offset="100%" stopColor="#FF1463" />
        </linearGradient>
      </defs>
      <path 
        d="M20,34 C20,34 6,24 6,14 C6,8.5 10.5,4 16,4 C18.5,4 20,6 20,6 C20,6 21.5,4 24,4 C29.5,4 34,8.5 34,14 C34,24 20,34 20,34 Z" 
        fill="url(#cpPink)" 
      />
      <path 
        d="M12,18 L18,14 C19,13 21,13 22,14 L24,16 M14,22 L22,16 M16,26 L24,20 M18,30 L26,24" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
        opacity="0.9" 
      />
    </svg>
    <div className="absolute top-3 right-4 w-4 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[30deg]" />
  </div>
);

// --- 3D GLOSSY SELLER BAG (RED) ---
const SVGA_SellerBag = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-xl">
      <defs>
        <linearGradient id="sellerRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF5F5F" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
        <radialGradient id="bagGloss" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path 
        d="M20,6 C16,6 14,9 14,12 C14,14 16,15 18,15 L22,15 C24,15 26,14 26,12 C26,9 24,6 20,6 Z" 
        fill="#991B1B" 
      />
      <path 
        d="M10,16 C10,16 6,20 6,28 C6,34 10,36 20,36 C30,36 34,34 34,28 C34,20 30,16 30,16 L10,16 Z" 
        fill="url(#sellerRed)" 
      />
      <circle cx="20" cy="27" r="6" fill="white" fillOpacity="0.2" />
      <text x="20" y="31" fontSize="14" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>$</text>
      <ellipse cx="14" cy="22" rx="4" ry="2" fill="url(#bagGloss)" transform="rotate(-20, 14, 22)" />
    </svg>
  </div>
);

// --- 3D GLOSSY SETTINGS (HEXAGON) ---
const SVGA_Settings = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-lg">
      <defs>
        <linearGradient id="settingsBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <path 
        d="M20,6 L32.99,13.5 V28.5 L20,36 L7.01,28.5 V13.5 L20,6 Z" 
        fill="url(#settingsBlue)" 
      />
      <circle cx="20" cy="21" r="5" fill="white" />
      <path 
        d="M12,14 Q20,10 28,14" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeOpacity="0.4" 
        fill="none" 
      />
    </svg>
  </div>
);

// --- 3D GLOSSY HELP CENTER (BLUE BUBBLE) - UPDATED TO MATCH IMAGE ---
const SVGA_HelpCenter = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="helpBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      {/* Speech Bubble Shape */}
      <path 
        d="M10,8 H30 C32.2,8 34,9.8 34,12 V26 C34,28.2 32.2,30 30,30 H22 L20,33 L18,30 H10 C7.8,30 6,28.2 6,26 V12 C6,9.8 7.8,8 10,8 Z" 
        fill="url(#helpBlue)" 
      />
      {/* Exclamation Mark */}
      <rect x="18.5" y="13" width="3" height="9" rx="1.5" fill="white" />
      <circle cx="20" cy="26" r="2" fill="white" />
      {/* Glossy Reflection */}
      <path 
        d="M10,12 Q20,9 30,12" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeOpacity="0.5" 
        fill="none" 
      />
    </svg>
  </div>
);

// --- 3D GLOSSY OFFICIAL USER (ORANGE) ---
const SVGA_OfficialUser = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="officialOrange" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="30" height="30" rx="10" fill="url(#officialOrange)" />
      <circle cx="20" cy="16" r="6" fill="white" />
      <path d="M10,30 C10,25 14,23 20,23 C26,23 30,25 30,30 V32 H10 V30 Z" fill="white" />
      <circle cx="30" cy="30" r="5" fill="#4ADE80" stroke="#FF8C00" strokeWidth="1.5" />
      <path d="M30,27 V33 M27,30 H33" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <div className="absolute top-3 left-3 w-3 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
);

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

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

const getBudgetVariant = (profile: any) => {
  if (profile.id === CREATOR_ID || profile.tags?.includes('Official')) return 'rainbow';
  if (profile.idColor && profile.idColor !== 'none') return profile.idColor;
  return 'none';
};

const formatCompactNumber = (num: number) => {
  if (!num || num === 0) return '0';
  const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  return formatter.format(num);
};

const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 pl-1 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
    <StarIcon className="h-2 w-2 fill-white text-white" />
    <span className="text-[10px] font-outfit font-black text-white leading-none">Lv.{level}</span>
  </div>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 pl-1 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
    <Sparkles className="h-2 w-2 fill-white text-white" />
    <span className="text-[10px] font-outfit font-black text-white leading-none">Lv.{level}</span>
  </div>
);

const calculateAge = (birthday: string) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const GenderAgeTag = ({ gender, birthday }: { gender: string | null | undefined, birthday?: string }) => {
  const age = calculateAge(birthday || '');
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full shadow-sm shrink-0",
      gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
    )}>
      <span className="text-[10px] font-bold text-white leading-none">{gender === 'Female' ? '♀' : '♂'}</span>
      {age !== null && <span className="text-[10px] font-bold text-white leading-none">{age}</span>}
    </div>
  );
};

const StatItem = ({ label, value, onClick }: { label: string, value: number, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center py-1 active:scale-95 transition-transform min-w-[60px]">
    <span className="text-[20px] font-outfit font-semibold text-slate-900 leading-none mb-1">{formatCompactNumber(value)}</span>
    <span className="text-[9px] font-outfit font-black text-slate-400 tracking-wider uppercase">{label}</span>
  </button>
);

const IconButton = ({ icon: Icon, label, iconColor, onClick, customIcon: CustomIcon }: { icon?: any, label: string, iconColor?: string, onClick: () => void, customIcon?: any }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group">
    <div className="flex items-center justify-center py-1">
      {CustomIcon ? (
        <CustomIcon className="transition-all group-hover:scale-110" />
      ) : (
        <Icon className={cn("h-7 w-7 transition-all group-hover:scale-110", iconColor)} />
      )}
    </div>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive, extraColor, customIcon: CustomIcon }: { icon?: any, label: string, extra?: string, iconColor?: string, onClick: () => void, destructive?: boolean, extraColor?: string, customIcon?: any }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-4 pl-4 pr-3 hover:bg-slate-50/50 active:bg-slate-100/50 transition-all text-left group">
    <div className="flex items-center gap-4">
      <div className={cn("p-2 rounded-xl transition-colors", iconColor || "bg-slate-100 text-slate-400")}>
        {CustomIcon ? <CustomIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <span className={cn("font-medium text-[16px]", destructive ? "text-red-500" : "text-[#1F2937]")}>{label}</span>
    </div>
    <div className="flex items-center gap-1">
      {extra && <span className={cn("text-[11px] font-medium uppercase tracking-wider", extraColor || "text-slate-300")}>{extra}</span>}
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
    </div>
  </button>
);

const ProfileSection = ({ title, children, isEmpty, emptyLabel }: { title: string, children: React.ReactNode, isEmpty: boolean, emptyLabel: string }) => (
  <div className="mt-8">
    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] px-1 mb-4">{title}</h3>
    {isEmpty ? (
      <div className="py-8 flex flex-col items-center justify-center gap-2 opacity-40">
        <Sparkles className="h-5 w-5 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{emptyLabel}</span>
      </div>
    ) : (
      <div className="grid grid-cols-4 gap-4">
        {children}
      </div>
    )}
  </div>
);

export default function ProfileView({ profileId, mode = 'public' }: { profileId: string; mode?: 'public' | 'editable' }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();

  const isOwnProfile = currentUser?.uid === profileId;

  const fansQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'followers'), where('followingId', '==', profileId));
  }, [firestore, profileId]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'followers'), where('followerId', '==', profileId));
  }, [firestore, profileId]);

  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'users', profileId, 'profileVisitors'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore, profileId]);

  const { data: fansData } = useCollection(fansQuery);
  const { data: followingData } = useCollection(followingQuery);
  const { data: visitorsData } = useCollection(visitorsQuery);

  const stats = useMemo(() => {
    const fans = fansData?.length || 0;
    const following = followingData?.length || 0;
    const visitors = visitorsData?.length || 0;
    const fanIds = new Set(fansData?.map(f => f.followerId) || []);
    const followingIds = followingData?.map(f => f.followingId) || [];
    const friends = followingIds.filter(id => fanIds.has(id)).length;
    return { fans, following, friends, visitors };
  }, [fansData, followingData, visitorsData]);

  const isAuthorizedAdmin = currentUser?.uid === CREATOR_ID || profile?.isAdmin === true;
  const isCertifiedSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || isAuthorizedAdmin;

  useEffect(() => {
    if (!firestore || !currentUser || !profileId || isOwnProfile) return;
    const recordVisit = async () => {
      try {
        const visitRef = doc(firestore, 'users', profileId, 'profileVisitors', currentUser.uid);
        await setDocumentNonBlocking(visitRef, { visitorId: currentUser.uid, timestamp: serverTimestamp() }, { merge: true });
      } catch (e) { console.error(e); }
    };
    recordVisit();
  }, [firestore, currentUser, profileId, isOwnProfile]);

  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: followData } = useDoc(followRef);

  const handleFollow = async () => {
    if (!firestore || !currentUser || !profileId || isProcessingFollow) return;
    setIsProcessingFollow(true);
    const fRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
    try {
      if (followData) {
        await deleteDocumentNonBlocking(fRef);
        toast({ title: 'Unfollowed' });
      } else {
        await setDocumentNonBlocking(fRef, { followerId: currentUser.uid, followingId: profileId, timestamp: serverTimestamp() }, { merge: true });
        toast({ title: 'Following' });
      }
    } catch (e) { console.error(e); } finally { setIsProcessingFollow(false); }
  };

  const handleCopyId = () => {
    const idToCopy = (!profile?.accountNumber || profile?.accountNumber === 'undefined' || profile?.accountNumber === 'UNDEFINED') ? (profile?.id || '') : profile?.accountNumber;
    if (!idToCopy) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy).then(() => {
        toast({ title: 'ID Copied' });
      }).catch(() => {});
    }
  };

  if (isUserLoading || isProfileLoading || !profile) return (
    <AppLayout>
      <div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4">
        <Loader className="animate-spin h-10 w-10 text-slate-300" />
        <p className="text-[10px] font-outfit font-black uppercase text-slate-400">Syncing Identity...</p>
      </div>
    </AppLayout>
  );

  const images = profile.spaceImages || [];
  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {};
  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  
  if (!isOwnProfile) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px] relative">
          <div className="relative h-[30vh] w-full shrink-0 bg-slate-900 overflow-hidden">
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
              <div className="h-full w-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-2 opacity-50">
                   <Camera className="h-8 w-8 text-white/40" />
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">No Space Photos</span>
                 </div>
              </div>
            )}
            <div className="absolute top-12 left-0 right-0 px-6 flex items-center justify-between z-[100]">
              <button onClick={() => router.back()} className="h-10 w-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10">
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10 outline-none">
                    <MoreHorizontal className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/80 backdrop-blur-3xl rounded-2xl border-white/20 shadow-2xl z-[200] p-1 font-outfit">
                  {!isOwnProfile && (
                    <DropdownMenuItem 
                      onClick={() => setReportOpen(true)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-red-50 focus:text-red-600 font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer text-slate-600"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Report User
                    </DropdownMenuItem>
                  )}
                  {isOwnProfile && (
                    <DropdownMenuItem 
                      onClick={() => router.push('/settings')}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-slate-50 font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer text-slate-600"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10 z-10" />
          </div>

          <div className="flex-1 mt-[-40px] relative z-20 bg-white rounded-t-[40px] px-6 pt-0 overflow-y-auto no-scrollbar pb-32">
            <div className="max-w-[440px] mx-auto">
              <div className="flex flex-col items-center">
                <div className="relative -mt-4 mb-1 z-30">
                  <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-2xl relative">
                      <AvatarImage src={profile.avatarUrl} className="object-cover" />
                      <AvatarFallback className="text-4xl font-bold bg-slate-50 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </AvatarFrame>
                </div>
                <div className="text-center space-y-2.5 w-full">
                  <div className="flex items-center justify-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h2>
                    <span className="text-xl">🇮🇳</span>
                    <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <RichLevelBadge level={profile.level?.rich || 1} />
                    <CharmLevelBadge level={profile.level?.charm || 1} />
                  </div>
                  <div className="flex justify-center items-center gap-2 h-8">
                    <BudgetTag variant="diamond" label={`ID: ${profile.accountNumber || profile.id.substring(0, 6)}`} size="sm" />
                    {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                    {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" />}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-5 mb-0 mx-[-24px]">
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('followers'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.fans}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fans</span>
                </div>
                <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('following'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.following}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Following</span>
                </div>
                <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('friends'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.friends}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Friend</span>
                </div>
                 <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.visitors}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visitors</span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-slate-50 my-2" />
              <div className="mt-2 mb-4">
                <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest px-1 opacity-70 mb-2">Signature Bio</h3>
                <div className="px-1"><p className="text-[13px] font-medium text-slate-500 leading-relaxed">{profile.bio || "Synchronized with the Ummy frequency."}</p></div>
              </div>
              <div className="h-[1px] w-full bg-slate-50 my-2" />

              <ProfileSection title="Medal" isEmpty={medals.length === 0} emptyLabel="No Medal Earned">
                {medals.map((medalId: string) => {
                  const medal = MEDAL_REGISTRY[medalId];
                  if (!medal) return null;
                  return (
                    <div key={medalId} className="flex flex-col items-center gap-1.5 p-1 group transition-all">
                      <img src={medal.imageUrl} alt={medal.name} className="h-12 w-12 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase truncate w-full text-center tracking-tighter">{medal.name}</span>
                    </div>
                  );
                })}
              </ProfileSection>

              <ProfileSection title="Vehicle" isEmpty={ownedVehicles.length === 0} emptyLabel="No Vehicle Owned">
                {ownedVehicles.map((id: string) => {
                  const vehicle = VEHICLE_REGISTRY[id];
                  if (!vehicle) return null;
                  const isActive = profile.inventory?.activeVehicle === id;
                  return (
                    <div key={id} className="flex flex-col items-center gap-2 p-1 relative">
                      <div className="text-4xl filter drop-shadow-md py-1 animate-float">{vehicle.icon}</div>
                      <div className="flex flex-col items-center gap-1 w-full">
                        <span className="text-[8px] font-black text-slate-600 truncate uppercase tracking-tighter">{vehicle.name}</span>
                        <button className={cn("w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm", isActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>Set</button>
                      </div>
                    </div>
                  );
                })}
              </ProfileSection>

              <ProfileSection title="Gift" isEmpty={Object.keys(receivedGifts).length === 0} emptyLabel="No Gift Received">
                {Object.entries(receivedGifts).map(([giftId, count]: [string, any]) => {
                  const gift = GIFT_REGISTRY[giftId];
                  if (!gift) return null;
                  return (
                    <div key={giftId} className="flex flex-col items-center gap-1 p-1 relative">
                      <div className="absolute top-1 right-2 text-[10px] font-black text-primary italic drop-shadow-sm">x{count}</div>
                      <div className="text-3xl filter drop-shadow-md py-1">{gift.emoji}</div>
                      <div className="flex items-center gap-0.5 bg-slate-50 px-2 rounded-full border border-slate-100">
                        <GoldCoinIcon className="h-2 w-2" />
                        <span className="text-[9px] font-black text-slate-900">{gift.price}</span>
                      </div>
                    </div>
                  );
                })}
              </ProfileSection>
            </div>
          </div>

          <footer className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-white/80 backdrop-blur-3xl z-[110] border-t border-slate-100 shadow-2xl">
            <div className="max-w-[440px] mx-auto flex gap-4 w-full">
              <button onClick={handleFollow} disabled={isProcessingFollow} className="flex-2 h-14 bg-slate-900 text-white rounded-3xl font-outfit font-black uppercase text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                 {isProcessingFollow ? <Loader className="animate-spin h-5 w-5" /> : (
                   <><Heart className={cn("h-5 w-5", followData && "fill-current text-rose-500")} />{followData ? "Joined" : "Join"}</>
                 )}
              </button>
              <DirectMessageDialog recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} trigger={
                <button className="flex-1 h-14 bg-white text-slate-900 border-2 border-slate-900 rounded-3xl font-outfit font-black uppercase text-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="h-5 w-5" />Chat
                </button>
              }/>
            </div>
          </footer>
        <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
        <FullProfileDialog open={fullViewOpen} onOpenChange={setFullViewOpen} profile={profile} stats={stats} followData={followData} onFollow={handleFollow} isProcessingFollow={isProcessingFollow} isOwnProfile={isOwnProfile} />
        <ReportUserDialog 
          open={reportOpen} 
          onOpenChange={setReportOpen} 
          targetUser={{ 
            uid: profile.id, 
            username: profile.username, 
            accountNumber: profile.accountNumber || profile.id.substring(0, 6) 
          }} 
        />
      </div>
    </AppLayout>
  );
}

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px] relative">
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#b28dff]/80 via-purple-100 to-white z-0 pointer-events-none" />

        <header className="absolute top-0 right-0 z-[100] bg-transparent px-6 pt-10 pb-0">
          <div className="flex items-center justify-end max-w-[440px] mx-auto">
             {isOwnProfile && (
               <EditProfileDialog profile={profile} trigger={
                 <button className="h-10 w-10 bg-slate-100/50 backdrop-blur-xl rounded-full flex items-center justify-center active:scale-90 transition-all shadow-sm border border-slate-200"><Pencil className="h-4 w-4 text-slate-600" /></button>
               }/>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-14 z-10 relative mt-2">
          <div className="max-w-[440px] mx-auto px-5">
            <div className="flex items-center gap-1 mb-0 pt-0">
              <div onClick={() => setFullViewOpen(true)} className="shrink-0 cursor-pointer active:scale-95 transition-transform">
                <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                  <Avatar className="h-[100px] w-[100px] border-2 border-white shadow-xl rounded-full ring-1 ring-slate-100">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-slate-50 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </AvatarFrame>
              </div>
              <div className="flex-1 min-w-0 -ml-1 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-[22px] font-bold text-slate-900 tracking-tighter leading-none truncate">{profile.username}</h2>
                  <span className="text-lg">🇮🇳</span>
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <RichLevelBadge level={profile.level?.rich || 1} />
                  <CharmLevelBadge level={profile.level?.charm || 1} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <div onClick={handleCopyId} className="cursor-pointer active:opacity-60 transition-opacity">
                    <BudgetTag variant={getBudgetVariant(profile)} label={`ID: ${(!profile.accountNumber || profile.accountNumber === 'undefined' || profile.accountNumber === 'UNDEFINED') ? profile.id.substring(0, 6) : profile.accountNumber}`} size="sm" />
                  </div>
                  {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                  {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" />}
                </div>
              </div>
            </div>

            <div className="flex justify-start gap-8 items-center py-2 px-1 border-b border-slate-50 mb-4 mt-[-5px] pl-1">
              <StatItem label="Fans" value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
              <StatItem label="Following" value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
              <StatItem label="Friends" value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
              <StatItem label="Visitors" value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
            </div>

            {isOwnProfile && (
              <div className="grid grid-cols-2 gap-2 mt-2 -mx-2">
                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#9E7302] rounded-[32px] p-4 shadow-[0_10px_20px_rgba(253,185,49,0.3)] active:scale-95 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2 relative z-10">
                    <SVGA_GoldDollar />
                    <span className="text-[10px] font-black text-[#5C4000] uppercase tracking-widest opacity-90">Coins</span>
                  </div>
                  <p className="font-black text-[20px] text-[#422E00] tracking-tighter leading-none absolute bottom-4 left-5 drop-shadow-sm">
                    {profile.wallet?.coins?.toFixed(1) || '0.0'}
                  </p>
                </div>

                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#00D2FF] via-[#3a7bd5] to-[#004e92] rounded-[32px] p-4 shadow-[0_10px_20px_rgba(58,123,213,0.3)] active:scale-95 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="h-7 w-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-[14px]">💎</div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-90">Diamonds</span>
                  </div>
                  <p className="font-black text-[20px] text-white tracking-tighter leading-none absolute bottom-4 left-5 drop-shadow-md">
                    {profile.wallet?.diamonds?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>
            )}

            <div onClick={() => router.push('/vips')} className="bg-[#0F1115] rounded-3xl p-4 shadow-2xl flex items-center justify-between cursor-pointer border border-[#1A1D23] active:scale-[0.98] transition-all group mt-3">
              <div className="flex items-center gap-4 relative z-10"><div className="h-10 w-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <SVGA_LevelCrown className="h-6 w-6" />
              </div><span className="text-[11px] font-black text-white uppercase tracking-widest">VIP Members</span></div>
              <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all" />
            </div>

            <div className="flex justify-between items-center px-4 mt-6">
              <IconButton 
                customIcon={SVGA_LevelCrown} 
                label="Level" 
                onClick={() => router.push('/level')} 
              />
              <IconButton 
                customIcon={SVGA_StoreCart} 
                label="Store" 
                onClick={() => router.push('/store')} 
              />
              <IconButton 
                customIcon={SVGA_MedalStar} 
                label="Medal" 
                onClick={() => router.push('/medals')} 
              />
              <IconButton 
                customIcon={SVGA_TaskClipboard} 
                label="Task" 
                onClick={() => router.push('/tasks')} 
              />
            </div>

            <div className="space-y-2 pt-6 pb-32">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem 
                  customIcon={SVGA_InviteHeart} 
                  label="Invite friends" 
                  iconColor="bg-pink-50" 
                  onClick={() => {}}
                />
                <ProfileMenuItem 
                  customIcon={SVGA_FamilyShield} 
                  label="Family" 
                  extra="TRIBAL UNITY" 
                  extraColor="text-indigo-500" 
                  iconColor="bg-orange-50" 
                  onClick={() => router.push('/families')} 
                />
                <ProfileMenuItem 
                  customIcon={SVGA_BagShirt} 
                  label="Bag" 
                  extra="INVENTORY" 
                  extraColor="text-purple-500" 
                  iconColor="bg-purple-50" 
                  onClick={() => router.push('/store')} 
                />
                <ProfileMenuItem 
                  customIcon={SVGA_CpHeart} 
                  label="Cp/friends" 
                  iconColor="bg-pink-50" 
                  onClick={() => router.push('/cp-house')} 
                />
                
                {isCertifiedSeller && (
                   <SellerTransferDialog trigger={
                     <ProfileMenuItem 
                        customIcon={SVGA_SellerBag} 
                        label="Seller center" 
                        iconColor="bg-red-50" 
                        onClick={() => {}} 
                      />
                   } />
                )}

                {isAuthorizedAdmin && (
                  <ProfileMenuItem 
                    customIcon={SVGA_OfficialUser} 
                    label="Official Centre" 
                    extra="Supreme Authority" 
                    extraColor="text-orange-600" 
                    iconColor="bg-orange-50" 
                    onClick={() => router.push('/official-center')} 
                  />
                )}
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem 
                  customIcon={SVGA_Settings} 
                  label="Settings" 
                  iconColor="bg-slate-50" 
                  onClick={() => router.push('/settings')} 
                />
                {/* Updated Help Center Icon to match Image UI */}
                <ProfileMenuItem 
                  customIcon={SVGA_HelpCenter} 
                  label="Help center" 
                  iconColor="bg-sky-50" 
                  onClick={() => router.push('/help-center')} 
                />
              </div>
            </div>
          </div>
        </div>

        <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
        <FullProfileDialog open={fullViewOpen} onOpenChange={setFullViewOpen} profile={profile} stats={stats} followData={followData} onFollow={handleFollow} isProcessingFollow={isProcessingFollow} isOwnProfile={isOwnProfile} />
        <ReportUserDialog 
          open={reportOpen} 
          onOpenChange={setReportOpen} 
          targetUser={{ 
            uid: profile.id, 
            username: profile.username, 
            accountNumber: profile.accountNumber || profile.id.substring(0, 6) 
          }} 
        />
      </div>
    </AppLayout>
  );
}

