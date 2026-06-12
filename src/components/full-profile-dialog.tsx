'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import { CompactVideoAvatarFrame } from '@/components/compact-video-avatar-frame';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { GoldCoinIcon } from '@/components/icons';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, where, limit } from 'firebase/firestore';
import { calculateLevelProgress } from '@/lib/level-utils';
import { toast } from '@/hooks/use-toast';

// Registries
import { MEDAL_REGISTRY, MedalConfig } from '@/constants/medals';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { VEHICLE_REGISTRY } from '@/constants/vehicles';

// ==========================================
// 1. BUDGET LEVEL BADGE
// ==========================================
const BudgetLevelBadge = ({ level, imageUrl }: { level: number, imageUrl?: string | null }) => {
  if (imageUrl) {
    return (
      <div className={cn("relative inline-flex items-center justify-center shrink-0 w-16 h-8", level < 1 && "grayscale opacity-75")}>
        <img 
          src={imageUrl} 
          alt={`Level ${level}`} 
          className="absolute inset-0 w-full h-full object-contain filter drop-shadow-md"
        />
        <span className="relative z-10 text-[11px] font-black italic tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5 ml-2" style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.5)' }}>
          Lv.{level}
        </span>
      </div>
    );
  }

  // Fallback if no image
  return (
    <div className={cn("inline-flex items-center shrink-0", level < 1 && "grayscale opacity-75")}>
      <div className="relative flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-b from-[#e92848] via-[#c4122f] to-[#8f0a1f] border-2 border-[#ff7e00] shadow-md shadow-black/50">
        <span className="text-[12px] font-black italic tracking-wider text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.8)]">
          Lv.{level}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// 2. GLOSSY 3D ROLE TAGS (OFFICIAL TAG - AUR CHOTA 75x20)
// ==========================================

export const SVGA_OfficialTag = () => (
  <div className="v-badge shrink-0" role="img" aria-label="U Official" style={{
    width: '75px',      // Final chota size
    height: '20px',     // Final chota size
    borderRadius: '10px',
    padding: '1px',
    background: 'linear-gradient(180deg, #ffe8b8 0%, #f5c57a 30%, #e4a95a 70%, #d08c3a 100%)',
    boxShadow: 'inset 0 1px 0 #fff5d6, inset 0 -1px 1px #a66a1e, 0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.15)',
    position: 'relative',
  }}>
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: '9px',
      background: 'linear-gradient(180deg, #b82340 0%, #a81835 20%, #98142f 50%, #8a102b 85%, #7f0e27 100%)',
      boxShadow: 'inset 0 1px 1px rgba(255,200,210,0.22), inset 0 -1.5px 2px rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '19px',
    }}>
      {/* Top Gloss */}
      <div style={{
        content: '""',
        position: 'absolute',
        top: '0.5px',
        left: '8%',
        right: '8%',
        height: '45%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.03) 70%, transparent 100%)',
        borderRadius: '15px 15px 60px 60px / 8px 8px 20px 20px',
        pointerEvents: 'none',
      }} />
      {/* Bottom Shadow Line */}
      <div style={{
        content: '""',
        position: 'absolute',
        left: '14%',
        right: '14%',
        bottom: '1px',
        height: '0.5px',
        background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent)',
        opacity: 0.6,
      }} />
      
      {/* Medallion with U */}
      <div style={{
        position: 'absolute',
        left: '1.5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '17px',
        height: '17px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #ffc46a 0%, #ffb03a 35%, #f18c1f 65%, #d87312 100%)',
        border: '0.5px solid #e9a84a',
        boxShadow: '0 0 0 0.6px #3b1800, 0 0 0 1.5px #f3c26f, 0 0 0 2.2px #5b2700, inset 0 1.5px 2px rgba(255,255,225,0.7), inset 0 -2px 2.5px rgba(90,35,0,0.85), 0 0.8px 1px rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 3,
      }}>
        {/* Medallion Inner Gloss */}
        <div style={{
          content: '""',
          position: 'absolute',
          inset: '2px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.55), rgba(255,255,255,0.15) 38%, transparent 62%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }} />
        <span style={{
          fontFamily: "Georgia, 'Times New Roman', Times, serif",
          fontWeight: 900,
          fontSize: '12px',
          lineHeight: 1,
          position: 'relative',
          top: '-0.3px',
          background: 'linear-gradient(180deg, #fff9d1 0%, #ffe08a 25%, #f5c44e 55%, #e0a732 80%, #c98a1a 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textShadow: '0 0.5px 0 #fff7c8, 0 1px 0 #d9a43a, 0 1.5px 1px rgba(90,42,0,0.6), 0 2px 1.5px rgba(0,0,0,0.7)',
        }}>
          U
        </span>
      </div>
      
      {/* Official Label */}
      <span style={{
        fontFamily: "Georgia, 'Times New Roman', Times, serif",
        fontWeight: 900,
        fontSize: '11px',
        letterSpacing: '0.05px',
        lineHeight: 1,
        position: 'relative',
        top: '-0.5px',
        marginLeft: '1.5px',
        background: 'linear-gradient(180deg, #fff9d1 0%, #ffe08a 25%, #f5c44e 55%, #e0a732 80%, #c98a1a 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: '0 0.5px 0 #fff7c8, 0 1px 0 #d9a43a, 0 1.5px 1px rgba(90,42,0,0.6), 0 2px 1.5px rgba(0,0,0,0.7)',
      }}>
        Official
      </span>
    </div>
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
// 3. IDENTIFICATION BADGES (SILENT COPY - NO ICONS)
// ==========================================

export const SVGA_GlossyID = ({ variant, label }: { variant?: string, label: string }) => {
  const idNum = label ? label.replace('ID: ', '').trim() : '000000';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(idNum);
      toast({
        title: "Copied! 📋",
        description: `ID ${idNum} copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = idNum;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "Copied! 📋",
        description: `ID ${idNum} copied to clipboard`,
        duration: 2000,
      });
    }
  };

  return (
    <div 
      onClick={handleCopy}
      className="relative flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#6b1e60] via-[#912480] to-[#b33596] shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.4)] ml-1 pr-2.5 pl-[20px] border border-[#c157a8] cursor-pointer hover:scale-105 active:scale-95 transition-all group"
      title="Click to copy ID"
    >
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[30px] h-[30px] z-10 flex items-center justify-center pointer-events-none">
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
      <div className="absolute top-[1px] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[0.5px] pointer-events-none" />
      
      <span className="relative z-10 text-[10px] font-bold text-white ml-1.5 tracking-[0.1em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {idNum}
      </span>
    </div>
  );
};

export const StandardIDTag = ({ idNum }: { idNum: string }) => {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(idNum);
      toast({
        title: "Copied! 📋",
        description: `ID ${idNum} copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = idNum;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "Copied! 📋",
        description: `ID ${idNum} copied to clipboard`,
        duration: 2000,
      });
    }
  };

  return (
    <span 
      onClick={handleCopy}
      className="text-[12px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md ml-0 backdrop-blur-sm border border-slate-200/50 cursor-pointer hover:bg-slate-200/80 active:scale-95 transition-all inline-flex items-center gap-1"
      title="Click to copy ID"
    >
      ID: {idNum}
    </span>
  );
};

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
  displayID?: string;
  stats: any;
  followData?: any;
  onFollow?: () => void;
  isProcessingFollow?: boolean;
  isOwnProfile?: boolean;
  onChat?: (recipient: any) => void;
  displayId?: string;
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

const getDeterministicFallbackId = (userId: string) => {
  if (userId === '901piBzTQ0VzCtAvlyyobwvAaTs1') return '0000';
  let hash = 0;
  const str = userId || 'fallback';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash % 900000) + 100000).toString();
};

// ==========================================
// VIDEO FRAME COMPONENT
// ==========================================
const VideoFrame = ({ videoUrl }: { videoUrl: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, [videoUrl]);

  return (
    <div className="relative w-full h-full bg-transparent">
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{ background: 'transparent' }}
      />
    </div>
  );
};

// ==========================================
// CP CARD COMPONENT
// ==========================================
const CPCard = ({ avatarUrl, username }: { avatarUrl?: string; username?: string }) => {
  const heartGemSVG = `<svg viewBox="0 0 600 550" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Faceted Rose-Gold Heart Gem">
  <defs>
    <radialGradient id="rimGold" cx="0.28" cy="0.22" r="0.85">
      <stop offset="0%" stop-color="#fde1d2"/>
      <stop offset="25%" stop-color="#f8c7b5"/>
      <stop offset="55%" stop-color="#d48a78"/>
      <stop offset="85%" stop-color="#a05a4a"/>
      <stop offset="100%" stop-color="#7a3c2e"/>
    </radialGradient>
    <linearGradient id="bevelLight" x1="0" y1="0" x2="0.8" y2="0.8">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bevelDark" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="f1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#fde8ee"/><stop offset="100%" stop-color="#f5c2d0"/></linearGradient>
    <linearGradient id="f2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff5f8"/><stop offset="100%" stop-color="#e9a6b8"/></linearGradient>
    <linearGradient id="f3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbe0e7"/><stop offset="100%" stop-color="#d98ca2"/></linearGradient>
    <linearGradient id="f4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f0c1ce"/><stop offset="100%" stop-color="#b96b81"/></linearGradient>
    <linearGradient id="f5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e2a9b9"/><stop offset="100%" stop-color="#9d4f66"/></linearGradient>
    <linearGradient id="f6" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#d18fa3"/><stop offset="100%" stop-color="#7c2e48"/></linearGradient>
    <linearGradient id="f7" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#bc738a"/><stop offset="100%" stop-color="#672139"/></linearGradient>
    <linearGradient id="f8" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a4576f"/><stop offset="100%" stop-color="#54162a"/></linearGradient>
    <linearGradient id="f9" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8a2a44"/><stop offset="100%" stop-color="#3d0a18"/></linearGradient>
    <linearGradient id="f10" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffedf2"/><stop offset="100%" stop-color="#e2a0b2"/></linearGradient>
    <linearGradient id="f11" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f3cbd6"/><stop offset="100%" stop-color="#c27a8e"/></linearGradient>
    <linearGradient id="f12" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e4b0bf"/><stop offset="100%" stop-color="#9f5a70"/></linearGradient>
    <linearGradient id="f13" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#cc8ca2"/><stop offset="100%" stop-color="#7e3450"/></linearGradient>
    <linearGradient id="f14" x1="1" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#7a2540"/><stop offset="100%" stop-color="#4b0f24"/></linearGradient>
    <linearGradient id="f15" x1="1" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#5c142a"/><stop offset="100%" stop-color="#2a0712"/></linearGradient>
    <radialGradient id="centerGlow" cx="0.5" cy="0.38" r="0.65">
      <stop offset="0%" stop-color="#ffe4ec" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#e291a8" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#7a1e3e" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feBlend in="SourceGraphic" in2="b" mode="screen"/></filter>
    <filter id="specular" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <clipPath id="clipHeart"><path d="M300 457 C160 363 52 258 90 162 C117 93 207 73 280 121 C291 129 297 139 300 150 C303 139 309 129 320 121 C393 73 483 93 510 162 C548 258 440 363 300 457 Z"/></clipPath>
  </defs>

  <g clip-path="url(#clipHeart)">
    <polygon points="185,115 280,121 300,150 220,180" fill="url(#f1)"/>
    <polygon points="185,115 120,135 140,210 220,180" fill="url(#f2)"/>
    <polygon points="120,135 95,160 140,210" fill="url(#f3)"/>
    <polygon points="95,160 86,245 140,210" fill="url(#f4)"/>
    <polygon points="86,245 160,280 140,210" fill="url(#f5)"/>
    <polygon points="86,245 128,328 160,280" fill="url(#f6)"/>
    <polygon points="128,328 198,398 210,330 160,280" fill="url(#f7)"/>
    <polygon points="128,328 198,398 300,457 210,330" fill="url(#f8)"/>
    <polygon points="198,398 300,457 270,360" fill="url(#f9)"/>
    <polygon points="415,115 320,121 300,150 380,180" fill="url(#f10)"/>
    <polygon points="415,115 480,135 460,210 380,180" fill="url(#f11)"/>
    <polygon points="480,135 505,160 460,210" fill="url(#f12)"/>
    <polygon points="505,160 514,245 460,210" fill="url(#f13)"/>
    <polygon points="514,245 440,280 460,210" fill="url(#f5)"/>
    <polygon points="514,245 472,328 440,280" fill="url(#f6)"/>
    <polygon points="472,328 402,398 390,330 440,280" fill="url(#f7)"/>
    <polygon points="472,328 402,398 300,457 390,330" fill="url(#f14)"/>
    <polygon points="402,398 300,457 330,360" fill="url(#f15)"/>
    <polygon points="220,180 300,200 300,150" fill="url(#f2)" opacity="0.95"/>
    <polygon points="380,180 300,200 300,150" fill="url(#f10)" opacity="0.9"/>
    <polygon points="220,180 240,250 300,200" fill="url(#f3)"/>
    <polygon points="380,180 360,250 300,200" fill="url(#f11)"/>
    <polygon points="240,250 300,270 300,200" fill="url(#f4)"/>
    <polygon points="360,250 300,270 300,200" fill="url(#f12)"/>
    <polygon points="220,180 160,280 240,250" fill="url(#f4)"/>
    <polygon points="380,180 440,280 360,250" fill="url(#f13)"/>
    <polygon points="160,280 210,330 240,250" fill="url(#f6)"/>
    <polygon points="440,280 390,330 360,250" fill="url(#f13)"/>
    <polygon points="240,250 270,360 300,270" fill="url(#f7)"/>
    <polygon points="360,250 330,360 300,270" fill="url(#f14)"/>
    <polygon points="210,330 270,360 240,250" fill="url(#f7)"/>
    <polygon points="390,330 330,360 360,250" fill="url(#f14)"/>
    <polygon points="210,330 270,360 300,457" fill="url(#f8)"/>
    <polygon points="390,330 330,360 300,457" fill="url(#f15)"/>
  </g>

  <g clip-path="url(#clipHeart)">
    <polygon points="185,115 280,121 220,180" fill="#ffffff" opacity="0.58"/>
    <polygon points="185,115 120,135 140,210 220,180" fill="#ffffff" opacity="0.35"/>
    <polygon points="280,121 300,150 300,200 220,180" fill="#ffffff" opacity="0.22"/>
    <polygon points="402,398 472,328 514,245 440,280" fill="#000000" opacity="0.18"/>
    <polygon points="330,360 390,330 300,457" fill="#000000" opacity="0.22"/>
  </g>

  <ellipse cx="300" cy="255" rx="95" ry="75" fill="url(#centerGlow)" opacity="0.7" filter="url(#softGlow)"/>

  <g filter="url(#specular)">
    <circle cx="196" cy="126" r="5" fill="#ffffff" opacity="0.95"/>
    <circle cx="167" cy="152" r="3" fill="#ffffff" opacity="0.85"/>
    <circle cx="132" cy="188" r="2" fill="#ffffff" opacity="0.7"/>
    <path d="M274 108 l10 -4 2 11 -12 -7z" fill="#ffffff" opacity="0.9"/>
    <circle cx="248" cy="142" r="1.8" fill="#ffffff" opacity="0.8"/>
  </g>

  <path d="M300 488 C140 390 20 270 62 150 C92 75 195 48 272 103 C289 115 296 128 300 143 C304 128 311 115 328 103 C405 48 508 75 538 150 C580 270 460 390 300 488 Z M300 457 C160 363 52 258 90 162 C117 93 207 73 280 121 C291 129 297 139 300 150 C303 139 309 129 320 121 C393 73 483 93 510 162 C548 258 440 363 300 457 Z" fill="url(#rimGold)" fill-rule="evenodd" stroke="#6e3a2e" stroke-width="1.2"/>

  <path d="M300 457 C160 363 52 258 90 162 C117 93 207 73 280 121 C291 129 297 139 300 150 C303 139 309 129 320 121 C393 73 483 93 510 162 C548 258 440 363 300 457 Z" fill="none" stroke="url(#bevelLight)" stroke-width="9" stroke-linejoin="round" opacity="0.5"/>
  <path d="M300 488 C140 390 20 270 62 150 C92 75 195 48 272 103 C289 115 296 128 300 143 C304 128 311 115 328 103 C405 48 508 75 538 150 C580 270 460 390 300 488 Z" fill="none" stroke="#5a2a20" stroke-width="2.5" opacity="0.55"/>
  <path d="M62 150 C92 75 195 48 272 103 C289 115 296 128 300 143" fill="none" stroke="#ffe0d1" stroke-width="6" stroke-linecap="round" opacity="0.45" filter="url(#specular)"/>
</svg>`;

  const styles = `
    * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    background: #0F0F12;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    padding: 24px;
  }
  .wrapper {
    width: 720px;
    max-width: 92vw;
    aspect-ratio: 720 / 300;
    position: relative;
    filter: drop-shadow(0 24px 48px rgba(0,0,0,0.55));
  }
  .card {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .card-bg {
    position: absolute;
    inset: 0;
    border-radius: 26px;
    overflow: hidden;
    background: 
      linear-gradient(180deg, rgba(142,29,76,0.88) 0%, rgba(196,59,108,0.72) 100%),
      radial-gradient(ellipse 90% 75% at 50% 0%, #D44C7A 0%, #B53163 38%, #9A1F50 62%, #7A1741 100%);
    box-shadow: 
      inset 0 0 30px rgba(0,0,0,0.25),
      inset 0 1px 0 rgba(255,255,255,0.14),
      inset 0 -1px 2px rgba(0,0,0,0.25);
    z-index: 1;
  }
  .card::before {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 29px;
    padding: 3px;
    background: linear-gradient(90deg, #F7C49F, #E99B8E);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    z-index: 5;
  }
  .bokeh {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .icon-container {
    position: absolute;
    top: 50%;
    width: 19.44%;
    max-width: 140px;
    aspect-ratio: 1;
    z-index: 3;
    transform: translate(-50%, -58%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-container.left {
    left: 18%;
  }
  .icon-container.center {
    left: 50%;
  }
  .icon-container.right {
    left: 82%;
  }
  .icon-container svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }
  .plus-icon circle {
    fill: rgba(255,255,255,0.06);
    stroke: rgba(255,255,255,0.95);
    stroke-width: 2.8;
    backdrop-filter: blur(2px);
  }
  .plus-icon rect {
    fill: #FFFFFF;
  }
  .heart-icon svg {
    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
    transition: transform 0.2s ease;
  }
  .heart-icon:hover svg {
    transform: scale(1.05);
  }
  .tab {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 25%;
    max-width: 180px;
    aspect-ratio: 180 / 42;
    z-index: 6;
    pointer-events: none;
  }
  .tab svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
    filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));
  }
  .avatar-overlay {
    position: absolute;
    top: 50%;
    left: 18%;
    transform: translate(-50%, -58%);
    z-index: 10;
    width: 19.44%;
    max-width: 140px;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .avatar-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    border: 2.8px solid rgba(255,255,255,0.95);
    box-shadow: 0 4px 14px rgba(0,0,0,0.35);
    backdrop-filter: blur(2px);
    background: rgba(255,255,255,0.06);
  }
  .avatar-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .avatar-circle .avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    color: white;
    font-weight: 700;
    font-size: clamp(1.2rem, 3vw, 2.2rem);
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .avatar-name {
    position: absolute;
    bottom: -28px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: clamp(0.55rem, 1.5vw, 0.85rem);
    font-weight: 700;
    text-align: center;
    text-shadow: 0 2px 6px rgba(0,0,0,0.5);
    white-space: nowrap;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
  }
  @media (max-width: 480px) {
    body { padding: 16px; }
    .avatar-name { bottom: -22px; font-size: 0.55rem; }
  }
`;

  return (
    <div className="mt-2 mb-4">
      <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">CP Card</h3>
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className="wrapper" style={{ maxWidth: '100%', aspectRatio: '720 / 300' }}>
          <div className="card">
            <div className="card-bg">
              <svg className="bokeh" viewBox="0 0 720 300" preserveAspectRatio="none" aria-hidden="true">
                <g transform="translate(60,220) scale(0.8)" opacity="0.10" style={{ filter: 'blur(12px)' }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" transform="translate(-12,-12)" fill="#FF9EC2" />
                </g>
                <g transform="translate(640,210) scale(0.9)" opacity="0.10" style={{ filter: 'blur(12px)' }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" transform="translate(-12,-12)" fill="#FF9EC2" />
                </g>
              </svg>
            </div>

            <div className="avatar-overlay">
              <div className="avatar-circle">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username || 'User'} />
                ) : (
                  <div className="avatar-fallback">
                    {(username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="avatar-name">{username || 'User'}</span>
            </div>

            <div className="icon-container left">
              <svg viewBox="0 0 140 140" fill="none" className="plus-icon">
                <circle cx="70" cy="70" r="68" />
                <rect x="51" y="67.75" width="38" height="4.5" rx="2" />
                <rect x="67.75" y="51" width="4.5" height="38" rx="2" />
              </svg>
            </div>

            <div className="icon-container center heart-icon">
              <div dangerouslySetInnerHTML={{ __html: heartGemSVG }} />
            </div>

            <div className="icon-container right">
              <svg viewBox="0 0 140 140" fill="none" className="plus-icon">
                <circle cx="70" cy="70" r="68" />
                <rect x="51" y="67.75" width="38" height="4.5" rx="2" />
                <rect x="67.75" y="51" width="4.5" height="38" rx="2" />
              </svg>
            </div>

            <div className="tab">
              <svg viewBox="0 0 180 42" fill="none">
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FDE6A8" />
                    <stop offset="0.5" stopColor="#E9B96A" />
                    <stop offset="1" stopColor="#D68A32" />
                  </linearGradient>
                  <linearGradient id="goldStroke" x1="0" y1="0" x2="0" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFF3D1" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#D68A32" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path d="M10 0 H170 L158 28 Q90 38 22 28 L10 0 Z" fill="url(#gold)" stroke="url(#goldStroke)" strokeWidth="1" />
                <text x="90" y="20" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="20" fill="#5A2105" letterSpacing="0.5">CP</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export function FullProfileDialog({
  open,
  onOpenChange,
  profile,
  displayID,
  stats,
  followData,
  onFollow,
  isProcessingFollow,
  isOwnProfile,
  onChat,
  displayId: displayIdProp
}: FullProfileDialogProps) {
  const [api, setApi] = useState<CarouselApi>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'medal' | 'vehicle' | 'frame' | 'gift'>('medal');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const firestore = useFirestore();

  const images = profile?.spaceImages || [];

  useEffect(() => {
    if (!api || images.filter(Boolean).length <= 1) return;
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [api, images.filter(Boolean).length]);

  const medalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "medals"));
  }, [firestore]);
  const { data: firestoreMedals } = useCollection(medalsQuery);

  const levelsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "levels"));
  }, [firestore]);
  const { data: budgetLevelsData } = useCollection(levelsQuery);

  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {};

  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  const ownedFrames = ownedItems.filter((id: string) => AVATAR_FRAMES[id]);

  const calculatedLevelStats = calculateLevelProgress(profile.wallet?.totalExp || profile.wallet?.totalSpent || 0);
  const budgetLevel = profile.level?.rich || calculatedLevelStats.currentLevel || 1;
  
  const budgetImageUrl = useMemo(() => {
    if (!budgetLevelsData) return null;

    const isLevelInRange = (level: number, rangeStr: string): boolean => {
      if (!rangeStr) return false;
      const numbers = rangeStr.match(/\d+/g)?.map(Number);
      if (!numbers || numbers.length === 0) return false;
      if (numbers.length === 1) {
        return level === numbers[0];
      }
      const [start, end] = numbers;
      return level >= start && level <= end;
    };
    
    const budgetDocs = budgetLevelsData.filter((level: any) => {
      if (level.type) return level.type === "budget";
      return ("budget" in level) || (!("reward" in level) && !("frameId" in level));
    });
    
    const docData = budgetDocs.find((d: any) => isLevelInRange(budgetLevel, d.range));
    return docData?.imageUrl || docData?.image || null;
  }, [budgetLevelsData, budgetLevel]);
  
  const userId = profile?.id || profile?.uid || '';
  const deterministicId = getDeterministicFallbackId(userId);
  const displayId = displayID || displayIdProp || profile?.accountNumber || deterministicId;
  
  const countryFlag = getCountryFlagEmoji(profile.country || '');
  const hasOfficialTag = profile.isOfficial || profile.tags?.includes('Official');
  const isSeller = profile.isSeller || profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));

  const resolvedBackground = useMemo(() => {
    if (images.filter(Boolean).length > 0) {
      const firstImage = images[0];
      if (firstImage && (firstImage.endsWith('.mp4') || firstImage.endsWith('.webm') || firstImage.includes('video'))) {
        return { type: 'video', data: firstImage };
      }
      return { type: 'carousel', data: images.filter(Boolean) };
    }
    return { type: 'fallback', data: profile.avatarUrl };
  }, [images, profile.avatarUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 w-full h-full max-w-none bg-white p-0 border-none m-0 rounded-none z-[150] overflow-hidden">
        <div className="w-full h-full overflow-y-auto no-scrollbar relative flex flex-col font-outfit">

          {/* Top Section - Background */}
          <div className="relative h-[35vh] w-full shrink-0 bg-slate-900 overflow-hidden">
            {resolvedBackground.type === 'video' ? (
              <VideoFrame videoUrl={resolvedBackground.data as string} />
            ) : resolvedBackground.type === 'carousel' ? (
              <Carousel setApi={setApi} className="h-full w-full" opts={{ loop: true }}>
                <CarouselContent className="h-full ml-0">
                  {(resolvedBackground.data as string[]).map((url: string, i: number) => (
                    <CarouselItem key={i} className="h-full pl-0 basis-full">
                      {url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video') ? (
                        <VideoFrame videoUrl={url} />
                      ) : (
                        <img src={url} className="h-full w-full object-cover" alt="" />
                      )}
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : resolvedBackground.type === 'family' ? (
              <div className="h-full w-full relative">
                <img
                  src={resolvedBackground.data as string}
                  className="h-full w-full object-cover"
                  alt="family-banner"
                />
              </div>
            ) : resolvedBackground.type === 'cp' ? (
              <div className="h-full w-full bg-gradient-to-br from-pink-500 via-red-400 to-rose-500 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                  <svg className="w-64 h-64 text-white fill-current animate-pulse" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                  <div className="absolute top-10 left-[10%] animate-pulse"><Heart className="h-8 w-8 text-white fill-white" /></div>
                  <div className="absolute bottom-12 right-[15%] animate-pulse delay-500"><Heart className="h-10 w-10 text-white fill-white" /></div>
                  <div className="absolute top-24 right-[25%] animate-pulse delay-1000"><Heart className="h-6 w-6 text-white fill-white" /></div>
                </div>
                <div className="text-white/90 font-black text-sm uppercase tracking-[0.2em] relative z-10 flex flex-col items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  <Heart className="h-8 w-8 text-white fill-white animate-bounce" />
                  <span>CP Sanctuary</span>
                </div>
              </div>
            ) : resolvedBackground.type === 'official' ? (
              <div className="h-full w-full bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-700 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
                <Sparkles className="h-8 w-8 text-amber-200 animate-pulse mb-1" />
                <span className="text-amber-100 font-black text-[10px] tracking-[0.3em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Official Member</span>
              </div>
            ) : resolvedBackground.type === 'seller' ? (
              <div className="h-full w-full bg-gradient-to-br from-[#B87333] via-[#D27D2D] to-[#8B5A2B] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
                <Sparkles className="h-8 w-8 text-orange-200 animate-pulse mb-1" />
                <span className="text-orange-100 font-black text-[10px] tracking-[0.3em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Authorized Seller</span>
              </div>
            ) : resolvedBackground.type === 'host' ? (
              <div className="h-full w-full bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-6 left-[20%] w-1 h-1 bg-white rounded-full animate-ping" />
                  <div className="absolute top-16 right-[30%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <div className="absolute bottom-10 left-[40%] w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-700" />
                </div>
                <Sparkles className="h-8 w-8 text-purple-300 animate-pulse mb-1" />
                <span className="text-purple-100 font-black text-[10px] tracking-[0.3em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Super Host</span>
              </div>
            ) : (
              <div className="h-full w-full relative">
                 <img
                   src={resolvedBackground.data as string}
                   className="h-full w-full object-cover"
                   alt="background-avatar"
                 />
              </div>
            )}

            {/* Top Buttons */}
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

          {/* Content Section */}
          <div className="relative z-20 bg-white/98 backdrop-blur-2xl rounded-none px-6 pt-0 pb-32 mt-[-20px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-white/80 min-h-[70vh]">

            <div className="flex flex-col items-center">
              <div className="relative -mt-10 mb-1 z-30">
                <AvatarFrame 
                  frameId={profile.inventory?.activeFrame} 
                  frameMediaUrl={profile.inventory?.activeFrameMediaUrl}
                  size="xl"
                >
                  <Avatar className="h-[88px] w-[88px] border-2 border-white shadow-xl rounded-full ring-1 ring-slate-200">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-slate-100 text-slate-400">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </AvatarFrame>
              </div>

              <div className="text-center space-y-1.5 w-full">
                
                {/* Name + Gender + Flag */}
                <div className="flex items-center justify-center gap-2 flex-wrap -mt-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h2>
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                  {countryFlag && (
                    <span className="text-xl leading-none shrink-0">{countryFlag}</span>
                  )}
                </div>

                {/* ID - Silent click to copy */}
                <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
                  {hasOfficialTag ? (
                    <SVGA_GlossyID label={`ID: ${displayId}`} />
                  ) : profile.isBudget ? (
                    <SVGA_GlossyID label={`ID: ${displayId}`} />
                  ) : (
                    <StandardIDTag idNum={displayId} />
                  )}
                </div>

                {/* Tags */}
                <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                  <BudgetLevelBadge level={budgetLevel} imageUrl={budgetImageUrl} />
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

            {/* CP Card */}
            <CPCard avatarUrl={profile.avatarUrl} username={profile.username} />

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

            {/* TAB CONTENT */}
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
