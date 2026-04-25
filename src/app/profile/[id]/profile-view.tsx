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
import { doc, serverTimestamp, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { SocialRelationsDialog } from '@/components/social-relations-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { SellerTransferDialog } from "@/components/seller-transfer-dialog";
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

// --- NEW 3D GLOSSY OFFICIAL & SELLER TAGS ---

const SVGA_OfficialTag = () => (
  <div className="relative inline-flex items-center h-[22px] rounded-md bg-gradient-to-r from-[#1DA1F2] to-[#0052CC] shadow-[0_2px_4px_rgba(0,82,204,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)] px-2 border border-[#1DA1F2]/50 ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[40%] bg-gradient-to-b from-white/50 to-transparent rounded-sm blur-[0.5px]" />
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 relative z-10 drop-shadow-sm mr-1" fill="none">
       <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
    </svg>
    <span className="relative z-10 text-[10px] font-black text-white tracking-widest uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Official</span>
  </div>
);

const SVGA_SellerTag = () => (
  <div className="relative inline-flex items-center h-[22px] rounded-full bg-gradient-to-r from-[#FFAE00] via-[#FFC300] to-[#FF9500] shadow-[0_2px_4px_rgba(255,149,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.8)] px-2.5 border border-[#FFE1A8] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/80 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[16px] h-[16px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
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
    <span className="relative z-10 text-[11px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
      Seller
    </span>
  </div>
);

const SVGA_VIPBanner = ({ onClick }: { onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="relative w-full h-[75px] rounded-[22px] overflow-hidden cursor-pointer active:scale-[0.97] transition-all duration-300 shadow-lg group mt-3 flex items-center px-4"
    style={{
      background: 'linear-gradient(90deg, #02C697 0%, #2087D6 50%, #9C3FE4 100%)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] -translate-x-[150%] group-hover:animate-shine-slow" />
    <div className="relative flex items-center h-full w-24 shrink-0">
      <div className="absolute left-10 scale-75 opacity-80 rotate-[5deg]">
        <svg width="45" height="50" viewBox="0 0 45 50">
          <defs>
            <linearGradient id="pinkBadge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF7EB3" />
              <stop offset="100%" stopColor="#E7227E" />
            </linearGradient>
          </defs>
          <path d="M22.5 0L45 12.5V37.5L22.5 50L0 37.5V12.5L22.5 0Z" fill="url(#pinkBadge)" />
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">VIP</text>
        </svg>
      </div>
      <div className="absolute left-5 scale-90 -rotate-[5deg]">
        <svg width="45" height="50" viewBox="0 0 45 50">
          <defs>
            <linearGradient id="blueBadge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4FACFE" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>
          </defs>
          <path d="M22.5 0L45 12.5V37.5L22.5 50L0 37.5V12.5L22.5 0Z" fill="url(#blueBadge)" />
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">VIP</text>
        </svg>
      </div>
      <div className="absolute left-0 z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <svg width="50" height="55" viewBox="0 0 50 55">
          <defs>
            <linearGradient id="greenBadge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5AF9B1" />
              <stop offset="100%" stopColor="#00AD69" />
            </linearGradient>
          </defs>
          <path d="M25 0L50 13.75V41.25L25 55L0 41.25V13.75L25 0Z" fill="url(#greenBadge)" stroke="white" strokeWidth="1.5" />
          <path d="M25 15 L18 25 L25 35 L32 25 Z" fill="white" fillOpacity="0.4" />
          <text x="50%" y="82%" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" style={{ letterSpacing: '1px' }}>VIP</text>
        </svg>
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-center ml-2 z-10">
      <div className="flex items-center gap-1">
        <h3 className="text-white font-black text-[18px] tracking-tight leading-tight">VIP Club</h3>
        <Sparkles className="h-3 w-3 text-white/70 animate-pulse" />
      </div>
      <p className="text-white/80 text-[10px] font-bold leading-tight mt-0.5">
        Upgrade to VIP and get free coins daily
      </p>
    </div>
    <div className="shrink-0 z-10">
      <div className="relative px-5 py-2.5 rounded-full bg-gradient-to-b from-[#FFE770] via-[#FDB931] to-[#9E7302] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] active:scale-90 transition-transform">
        <span className="text-[#5C4000] font-black text-[12px] uppercase">Get VIP</span>
        <div className="absolute top-1 left-2 right-2 h-1.5 bg-white/40 rounded-full blur-[0.5px]" />
      </div>
    </div>
    <div className="absolute top-2 right-12 opacity-40">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
  </div>
);

const SVGA_GlossyID = ({ variant, label }: { variant: string, label: string }) => {
  const idNum = label.replace('ID: ', '').trim();
  return (
    <div className="relative flex items-center h-[22px] rounded-full bg-gradient-to-r from-[#6b1e60] via-[#912480] to-[#b33596] shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)] ml-4 pr-3 pl-[24px] border border-[#c157a8]">
      <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-[38px] h-[38px] z-10 flex items-center justify-center">
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
      <span className="relative z-10 text-[11px] font-bold text-white ml-2 tracking-[0.1em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {idNum}
      </span>
    </div>
  );
};

const SVGA_GoldDollar = () => (
  <div className="relative h-7 w-7 flex items-center justify-center rounded-full bg-gradient-to-b from-[#FFE770] via-[#FDB931] to-[#9E7302] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.2)]">
    <DollarSign className="h-4 w-4 text-[#5C4000] drop-shadow-sm" strokeWidth={3} />
    <div className="absolute top-0.5 left-1 w-2 h-1 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
);

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
      <path fill="url(#crownGradient)" d="M5,16 L3,5 L8.5,10 L12,4 L15.5,10 L21,5 L19,16 L5,16 Z M5,19 L19,19 C19,20.1 18.1,21 17,21 L7,21 C5.9,21 5,20.1 5,19 Z" />
      <rect x="9" y="13" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.4" />
    </svg>
  </div>
);

const SVGA_StoreCart = ({ className }: { className?: string }) => (
  <div className={cn("relative h-8 w-8 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#3a7bd5" />
        </linearGradient>
      </defs>
      <path fill="url(#cartGradient)" d="M7,18 C5.9,18 5.01,18.9 5.01,20 C5.01,21.1 5.9,22 7,22 C8.1,22 9,21.1 9,20 C9,18.9 8.1,18.1 7,18 Z M1,2 L1,4 L3,4 L6.6,11.59 L5.25,14.04 C5.09,14.32 5,14.65 5,15 C5,16.1 5.9,17 7,17 L19,17 L19,15 L7.42,15 C7.28,15 7.17,14.89 7.17,14.75 L7.2,14.63 L8.1,13 L15.55,13 C16.3,13 16.96,12.59 17.3,11.97 L20.88,5.48 C21.05,5.17 21,4.82 21,4.5 C21,4.22 20.78,4 20.5,4 L5.21,4 L4.27,2 L1,2 Z M17,18 C15.9,18 15.01,18.9 15.01,20 C15.01,21.1 15.9,22 17,22 C18.1,22 19,21.1 19,20 C19,18.9 18.1,18.1 17,18 Z" />
    </svg>
  </div>
);

const SVGA_MedalStar = ({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-lg">
      <defs>
        <linearGradient id="medalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="13" r="8" fill="url(#medalGradient)" />
      <path fill="white" fillOpacity="0.9" d="M12,9.5 L13.2,12.1 L16,12.4 L13.9,14.2 L14.5,17 L12,15.5 L9.5,17 L10.1,14.2 L8,12.4 L10.8,12.1 Z" />
    </svg>
  </div>
);

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
    </svg>
  </div>
);

// --- MENU ICONS ---
const SVGA_InviteHeart = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md"><rect x="4" y="4" width="32" height="32" rx="10" fill="#FF5C8A" /><path d="M8,14 L20,24 L32,14 V28 C32,29.1 31.1,30 30,30 H10 C8.9,30 8,29.1 8,28 V14 Z" fill="white" /></svg>
  </div>
);
const SVGA_FamilyShield = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md"><path fill="#CD7F32" d="M10,6 H30 V26 C30,26 20,34 20,34 C20,34 10,26 10,26 V6 Z" /></svg>
  </div>
);
const SVGA_BagShirt = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md"><path d="M10,12 L16,8 L24,8 L30,12 L34,22 L28,26 L28,34 C28,35.1 27.1,36 26,36 L14,36 C12.9,36 12,35.1 12,34 L12,26 L6,22 Z" fill="#7E22CE" /></svg>
  </div>
);
const SVGA_CpHeart = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md"><path d="M20,34 C20,34 6,24 6,14 C6,8.5 10.5,4 16,4 C18.5,4 20,6 20,6 C20,6 21.5,4 24,4 C29.5,4 34,8.5 34,14 C34,24 20,34 20,34 Z" fill="#FF1463" /></svg>
  </div>
);
const SVGA_SellerBag = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-xl"><path d="M10,16 C10,16 6,20 6,28 C6,34 10,36 20,36 C30,36 34,34 34,28 C34,20 30,16 30,16 L10,16 Z" fill="#B91C1C" /><text x="20" y="31" fontSize="14" fontWeight="900" fill="white" textAnchor="middle">$</text></svg>
  </div>
);
const SVGA_Settings = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-lg"><path d="M20,6 L32.99,13.5 V28.5 L20,36 L7.01,28.5 V13.5 L20,6 Z" fill="#818CF8" /></svg>
  </div>
);
const SVGA_HelpCenter = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md"><path d="M10,8 H30 C32.2,8 34,9.8 34,12 V26 C34,28.2 32.2,30 30,30 H22 L20,33 L18,30 H10 C7.8,30 6,28.2 6,26 V12 C6,9.8 7.8,8 10,8 Z" fill="#0EA5E9" /></svg>
  </div>
);
const SVGA_OfficialUser = ({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md"><rect x="5" y="5" width="30" height="30" rx="10" fill="#FF8C00" /></svg>
  </div>
);

// --- HELPERS ---
const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';
const getBudgetVariant = (profile: any) => {
  if (profile.id === CREATOR_ID || profile.tags?.includes('Official')) return 'rainbow';
  return 'none';
};
const formatCompactNumber = (num: number) => {
  if (!num || num === 0) return '0';
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};
const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 pl-1 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
    <Sparkles className="h-2 w-2 fill-white text-white" />
    <span className="text-[10px] font-outfit font-black text-white leading-none">Lv.{level}</span>
  </div>
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
    <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full shadow-sm shrink-0", gender === 'Female' ? "bg-pink-500" : "bg-blue-500")}>
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
const IconButton = ({ customIcon: CustomIcon, label, onClick }: { customIcon: any, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group">
    <CustomIcon className="transition-all group-hover:scale-110" />
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </button>
);
const ProfileMenuItem = ({ customIcon: CustomIcon, label, extra, extraColor, onClick, destructive }: { customIcon: any, label: string, extra?: string, extraColor?: string, onClick: () => void, destructive?: boolean }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-4 pl-4 pr-3 hover:bg-slate-50/50 active:bg-slate-100/50 transition-all group">
    <div className="flex items-center gap-4">
      <CustomIcon />
      <span className={cn("font-medium text-[16px]", destructive ? "text-red-500" : "text-[#1F2937]")}>{label}</span>
    </div>
    <div className="flex items-center gap-1">
      {extra && <span className={cn("text-[11px] font-medium uppercase tracking-wider", extraColor || "text-slate-300")}>{extra}</span>}
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
    </div>
  </button>
);

// --- MAIN COMPONENT ---
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

  const isOwnProfile = currentUser?.uid === profileId;

  // Stats Queries
  const fansQuery = useMemoFirebase(() => !firestore || !profileId ? null : query(collection(firestore, 'followers'), where('followingId', '==', profileId)), [firestore, profileId]);
  const followingQuery = useMemoFirebase(() => !firestore || !profileId ? null : query(collection(firestore, 'followers'), where('followerId', '==', profileId)), [firestore, profileId]);
  const visitorsQuery = useMemoFirebase(() => !firestore || !profileId ? null : query(collection(firestore, 'users', profileId, 'profileVisitors'), orderBy('timestamp', 'desc'), limit(50)), [firestore, profileId]);

  const { data: fansData } = useCollection(fansQuery);
  const { data: followingData } = useCollection(followingQuery);
  const { data: visitorsData } = useCollection(visitorsQuery);

  const stats = useMemo(() => {
    const fans = fansData?.length || 0;
    const following = followingData?.length || 0;
    const visitors = visitorsData?.length || 0;
    const fanIds = new Set(fansData?.map(f => f.followerId) || []);
    const friends = (followingData?.map(f => f.followingId) || []).filter(id => fanIds.has(id)).length;
    return { fans, following, friends, visitors };
  }, [fansData, followingData, visitorsData]);

  const isAuthorizedAdmin = currentUser?.uid === CREATOR_ID || profile?.isAdmin === true;
  const isCertifiedSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || isAuthorizedAdmin;

  useEffect(() => {
    if (!firestore || !currentUser || !profileId || isOwnProfile) return;
    setDocumentNonBlocking(doc(firestore, 'users', profileId, 'profileVisitors', currentUser.uid), { visitorId: currentUser.uid, timestamp: serverTimestamp() }, { merge: true });
  }, [firestore, currentUser, profileId, isOwnProfile]);

  const followRef = useMemoFirebase(() => !firestore || !currentUser || !profileId || isOwnProfile ? null : doc(firestore, 'followers', `${currentUser.uid}_${profileId}`), [firestore, currentUser, profileId, isOwnProfile]);
  const { data: followData } = useDoc(followRef);

  const handleFollow = async () => {
    if (!firestore || !currentUser || !profileId || isProcessingFollow) return;
    setIsProcessingFollow(true);
    const fRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
    try {
      if (followData) { await deleteDocumentNonBlocking(fRef); toast({ title: 'Unfollowed' }); }
      else { await setDocumentNonBlocking(fRef, { followerId: currentUser.uid, followingId: profileId, timestamp: serverTimestamp() }, { merge: true }); toast({ title: 'Following' }); }
    } finally { setIsProcessingFollow(false); }
  };

  const handleCopyId = () => {
    const idToCopy = (!profile?.accountNumber || profile?.accountNumber === 'undefined') ? (profile?.id || '') : profile?.accountNumber;
    navigator.clipboard.writeText(idToCopy).then(() => toast({ title: 'ID Copied' }));
  };

  if (isUserLoading || isProfileLoading || !profile) return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4">
      <Loader className="animate-spin h-10 w-10 text-slate-300" />
      <p className="text-[10px] font-black uppercase text-slate-400">Syncing Identity...</p>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px] relative">
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#b28dff]/80 via-purple-100 to-white z-0" />

        <header className="absolute top-0 right-0 z-[100] px-6 pt-10">
          {isOwnProfile && <EditProfileDialog profile={profile} trigger={<button className="h-10 w-10 bg-white/50 backdrop-blur-xl rounded-full flex items-center justify-center border border-slate-200"><Pencil className="h-4 w-4" /></button>}/>}
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-14 z-10 relative">
          <div className="max-w-[440px] mx-auto px-5">
            <div className="flex items-center gap-1 mb-0">
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
                  <h2 className="text-[22px] font-bold text-slate-900 leading-none truncate">{profile.username}</h2>
                  <span className="text-lg">🇮🇳</span>
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                </div>
                {/* --- MODIFIED POSITION FOR RICH & CHARM BUDGET BADGES --- */}
                <div className="flex items-center gap-1.5 -mt-1">
                  <RichLevelBadge level={profile.level?.rich || 1} />
                  <CharmLevelBadge level={profile.level?.charm || 1} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  
                  <div onClick={handleCopyId} className="cursor-pointer active:opacity-60 transition-opacity">
                    {profile.tags?.includes('Official') || profile.id === CREATOR_ID ? (
                      <SVGA_GlossyID 
                        variant={getBudgetVariant(profile)} 
                        label={`ID: ${(!profile.accountNumber || profile.accountNumber === 'undefined') ? profile.id.substring(0, 6) : profile.accountNumber}`} 
                      />
                    ) : (
                      <span className="text-[12px] font-bold text-slate-500 ml-1 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200">
                        ID: {(!profile.accountNumber || profile.accountNumber === 'undefined') ? profile.id.substring(0, 6) : profile.accountNumber}
                      </span>
                    )}
                  </div>
                  
                  {profile.tags?.includes('Official') && <SVGA_OfficialTag />}
                  {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SVGA_SellerTag />}
                </div>
              </div>
            </div>

            <div className="flex justify-start gap-8 items-center py-2 px-1 border-b border-slate-50 mb-4 pl-1">
              <StatItem label="Fans" value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
              <StatItem label="Following" value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
              <StatItem label="Friends" value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
              <StatItem label="Visitors" value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
            </div>

            {isOwnProfile && (
              <div className="grid grid-cols-2 gap-2 mt-2 -mx-2">
                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#9E7302] rounded-2xl p-4 shadow-lg active:scale-95 transition-all cursor-pointer relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2"><SVGA_GoldDollar /><span className="text-[10px] font-black text-[#5C4000] uppercase opacity-90">Coins</span></div>
                  <p className="font-black text-[20px] text-[#422E00] absolute bottom-4 left-5">{profile.wallet?.coins?.toFixed(1) || '0.0'}</p>
                </div>
                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#00D2FF] via-[#3a7bd5] to-[#004e92] rounded-2xl p-4 shadow-lg active:scale-95 transition-all cursor-pointer relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2"><div className="h-7 w-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">💎</div><span className="text-[10px] font-black text-white uppercase opacity-90">Diamonds</span></div>
                  <p className="font-black text-[20px] text-white absolute bottom-4 left-5">{profile.wallet?.diamonds?.toFixed(1) || '0.0'}</p>
                </div>
              </div>
            )}

            <SVGA_VIPBanner onClick={() => router.push('/vips')} />

            <div className="flex justify-between items-center px-4 mt-6">
              <IconButton customIcon={SVGA_LevelCrown} label="Level" onClick={() => router.push('/level')} />
              <IconButton customIcon={SVGA_StoreCart} label="Store" onClick={() => router.push('/store')} />
              <IconButton customIcon={SVGA_MedalStar} label="Medal" onClick={() => router.push('/medals')} />
              <IconButton customIcon={SVGA_TaskClipboard} label="Task" onClick={() => router.push('/tasks')} />
            </div>

            <div className="space-y-2 pt-6 pb-32">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem customIcon={SVGA_InviteHeart} label="Invite friends" onClick={() => {}} />
                <ProfileMenuItem customIcon={SVGA_FamilyShield} label="Family" extra="TRIBAL UNITY" extraColor="text-indigo-500" onClick={() => router.push('/families')} />
                <ProfileMenuItem customIcon={SVGA_BagShirt} label="Bag" extra="INVENTORY" extraColor="text-purple-500" onClick={() => router.push('/store')} />
                <ProfileMenuItem customIcon={SVGA_CpHeart} label="Cp/friends" onClick={() => router.push('/cp-house')} />
                {isCertifiedSeller && <SellerTransferDialog trigger={<ProfileMenuItem customIcon={SVGA_SellerBag} label="Seller center" onClick={() => {}} />} />}
                {isAuthorizedAdmin && <ProfileMenuItem customIcon={SVGA_OfficialUser} label="Official Centre" extra="Supreme Authority" extraColor="text-orange-600" onClick={() => router.push('/admin')} />}
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem customIcon={SVGA_Settings} label="Settings" onClick={() => router.push('/settings')} />
                <ProfileMenuItem customIcon={SVGA_HelpCenter} label="Help center" onClick={() => router.push('/help-center')} />
              </div>
            </div>
          </div>
        </div>

        <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
        <FullProfileDialog open={fullViewOpen} onOpenChange={setFullViewOpen} profile={profile} stats={stats} followData={followData} onFollow={handleFollow} isProcessingFollow={isProcessingFollow} isOwnProfile={isOwnProfile} />
        <ReportUserDialog open={reportOpen} onOpenChange={setReportOpen} targetUser={{ uid: profile.id, username: profile.username, accountNumber: profile.accountNumber || profile.id.substring(0, 6) }} />
      </div>
    </AppLayout>
  );
}
