'use client';

import React, { useEffect, useState, useRef } from 'react';
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
// 1. BUDGET LEVEL BADGE
// ==========================================
const BudgetLevelBadge = ({ level }: { level: number }) => {
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
          <path d="M85 34 H235 L249 86 H85 Z" fill="none" stroke="#4a0a14" strokeWidth="14" strokeLinejoin="round" opacity="0.65"/>
          <path d="M85 34 H235 L249 86 H85 Z" fill="url(#redFill)" stroke="url(#orangeBorder)" strokeWidth="10" strokeLinejoin="round"/>
          <path d="M85 34 H235 L249 86 H85 Z" fill="none" stroke="url(#orangeHighlight)" strokeWidth="2.4" strokeLinejoin="round" opacity="0.92"/>
          <path d="M85 34 H235 L249 86 H85 Z" fill="url(#redGloss)" opacity="0.24"/>
          <path d="M85 38 H232 L245 82 H89 Z" fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" opacity="0.18"/>

          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="none" stroke="#4a0a14" strokeWidth="14" strokeLinejoin="round" opacity="0.65"/>
          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="url(#redFill)" stroke="url(#orangeBorder)" strokeWidth="10" strokeLinejoin="round"/>
          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="none" stroke="url(#orangeHighlight)" strokeWidth="2.4" strokeLinejoin="round" opacity="0.92"/>
          <path d="M66 6 L117.35 43.31 L97.74 103.69 L34.26 103.69 L14.64 43.31 Z" fill="url(#redGloss)" opacity="0.22"/>
          <path d="M66 12 L112 45 L93.5 98.5 L38.5 98.5 L20 45 Z" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.18"/>

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
// CP CARD COMPONENT
// ==========================================
const CPCard = ({ avatarUrl, username }: { avatarUrl?: string; username?: string }) => {
  const playablesSDK = `// Playables SDK v1.0.0
// Game lifecycle bridge: rAF-based game-ready detection + event communication
(function() {
  'use strict';

  if (window.playablesSDK) return;

  var HANDLER_NAME = 'playablesGameEventHandler';
  var ANDROID_BRIDGE_NAME = '_MetaPlayablesBridge';
  var RAF_FRAME_THRESHOLD = 3;

  var gameReadySent = false;
  var firstInteractionSent = false;
  var errorSent = false;
  var frameCount = 0;
  var originalRAF = window.requestAnimationFrame;

  function hasIOSBridge() {
    return !!(window.webkit &&
              window.webkit.messageHandlers &&
              window.webkit.messageHandlers[HANDLER_NAME]);
  }

  function hasAndroidBridge() {
    return !!(window[ANDROID_BRIDGE_NAME] &&
              typeof window[ANDROID_BRIDGE_NAME].postEvent === 'function');
  }

  function isInIframe() {
    return !!(window.parent && window.parent !== window);
  }

  function sendEvent(eventName, payload) {
    var message = {
      type: eventName,
      payload: payload || {},
      timestamp: Date.now()
    };

    if (hasIOSBridge()) {
      try {
        window.webkit.messageHandlers[HANDLER_NAME].postMessage(message);
      } catch (e) { /* ignore */ }
      return;
    }

    if (hasAndroidBridge()) {
    try {
      var p = payload || {};
      p.__secureToken = window.__fbAndroidBridgeAuthToken || '';
      p.timestamp = message.timestamp;
      window[ANDROID_BRIDGE_NAME].postEvent(
        eventName,
        JSON.stringify(p)
      );
    } catch (e) { /* ignore */ }
    return;
  }

    if (isInIframe()) {
      try {
        window.parent.postMessage(message, '*');
      } catch (e) { /* ignore */ }
      return;
    }
  }

  function onFrame() {
    if (gameReadySent) return;

    frameCount++;
    if (frameCount >= RAF_FRAME_THRESHOLD) {
      gameReadySent = true;
      sendEvent('game_ready', {
        frame_count: frameCount,
        detected_at: Date.now()
      });
      return;
    }

    originalRAF.call(window, onFrame);
  }

  if (originalRAF) {
    window.requestAnimationFrame = function(callback) {
      if (!gameReadySent) {
        return originalRAF.call(window, function(timestamp) {
          frameCount++;
          if (frameCount >= RAF_FRAME_THRESHOLD && !gameReadySent) {
            gameReadySent = true;
            sendEvent('game_ready', {
              frame_count: frameCount,
              detected_at: Date.now()
            });
          }
          callback(timestamp);
        });
      }
      return originalRAF.call(window, callback);
    };
  }

  function setupFirstInteractionDetection() {
    var events = ['touchstart', 'mousedown', 'keydown'];

    function onFirstInteraction() {
      if (firstInteractionSent) return;
      firstInteractionSent = true;
      sendEvent('user_interaction_start', null);

      for (var i = 0; i < events.length; i++) {
        document.removeEventListener(events[i], onFirstInteraction, true);
      }
    }

    for (var i = 0; i < events.length; i++) {
      document.addEventListener(events[i], onFirstInteraction, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFirstInteractionDetection);
  } else {
    setupFirstInteractionDetection();
  }

  window.addEventListener('error', function(event) {
    if (errorSent) return;
    errorSent = true;
    sendEvent('error', {
      message: event.message || 'Unknown error',
      source: event.filename || '',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
      auto_captured: true
    });
  });

  window.addEventListener('unhandledrejection', function(event) {
    if (errorSent) return;
    errorSent = true;
    var reason = event.reason;
    sendEvent('error', {
      message: (reason instanceof Error) ? reason.message : String(reason),
      type: 'unhandled_promise_rejection',
      auto_captured: true
    });
  });

  window.playablesSDK = {
    complete: function(score) {
      sendEvent('game_ended', {
        score: score,
        completed: true
      });
    },

    error: function(message) {
      if (errorSent) return;
      errorSent = true;
      sendEvent('error', {
        message: message || 'Unknown error',
        auto_captured: false
      });
    },

    sendEvent: function(eventName, payload) {
      if (!eventName || typeof eventName !== 'string') return;
      sendEvent(eventName, payload);
    }
  };

  if (originalRAF) {
    originalRAF.call(window, onFrame);
  }
})();`;

  const touchPatch = `(function() {
  if (window.__playableTouchPatchInstalled) return;
  window.__playableTouchPatchInstalled = true;
  var origAdd = EventTarget.prototype.addEventListener;
  var blockedTypes = { touchstart: 1, touchmove: 1, wheel: 1 };
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (blockedTypes[type]) {
      if (options === undefined || options === null) {
        options = { passive: true };
      } else if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      } else {
        options = Object.assign({}, options, { passive: true });
      }
    }
    return origAdd.call(this, type, listener, options);
  };
})();`;

  const intlPatch = `window.Intl=window.Intl||{};Intl.t=function(s){return(Intl._locale&&Intl._locale[s])||s;};`;

  const clickHandler = `(function(){document.addEventListener("click",function(e){var a=e.target.closest("[data-product-id]");if(!a)return;e.preventDefault();var pid=a.getAttribute("data-product-id");if(pid)parent.postMessage({type:"ecto-artifact-link-click",productId:pid},"*")})})();`;

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
  .plus {
    position: absolute;
    top: 50%;
    width: 19.44%;
    max-width: 140px;
    aspect-ratio: 1;
    z-index: 3;
  }
  .plus.left {
    left: 18%;
    transform: translate(-50%, -58%);
  }
  .plus.right {
    left: 82%;
    transform: translate(-50%, -58%);
  }
  .plus svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }
  .plus circle {
    fill: rgba(255,255,255,0.06);
    stroke: rgba(255,255,255,0.95);
    stroke-width: 2.8;
    backdrop-filter: blur(2px);
  }
  .plus rect {
    fill: #FFFFFF;
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
    transform: translate(-50%, -50%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 19.44%;
    max-width: 140px;
  }
  .avatar-overlay img {
    width: 60%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.9);
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .avatar-overlay .avatar-fallback {
    width: 60%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    color: white;
    font-weight: 700;
    font-size: 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .avatar-overlay .username {
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    text-align: center;
    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 480px) {
    body { padding: 16px; }
    .avatar-overlay .username { font-size: 0.6rem; }
    .avatar-overlay img, .avatar-overlay .avatar-fallback { width: 55%; }
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

            {/* Left Plus - Now shows Avatar + Username */}
            <div className="avatar-overlay">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username || 'User'} />
              ) : (
                <div className="avatar-fallback">
                  {(username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="username">{username || 'User'}</span>
            </div>

            {/* Right Plus - kept as is */}
            <div className="plus right">
              <svg viewBox="0 0 140 140" fill="none">
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
// FRIENDSHIP CARD COMPONENT
// ==========================================
const FriendshipCard = () => {
  const styles = `
    .friendship-card-wrap {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .friendship-card {
      position: relative;
      width: 360px;
      height: auto;
      background: linear-gradient(180deg, #0a1835 0%, #0c1f46 22%, #112a63 45%, #153a8a 100%);
      border-left: 1.5px solid #d4b76a;
      border-right: 1.5px solid #d4b76a;
      border-bottom: 1.5px solid #d4b76a;
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 18px;
      box-shadow: 
        0 0 0 1px rgba(0,0,0,0.8) inset,
        0 10px 30px rgba(0,0,0,0.6),
        0 0 40px rgba(10,24,53,0.5);
      overflow: hidden;
      padding-bottom: 24px;
    }

    .friendship-card::before {
      content: '';
      position: absolute;
      inset: 1.5px;
      bottom: 1.5px;
      background: radial-gradient(ellipse 280px 220px at 50% 28%, rgba(90,140,255,0.18) 0%, rgba(60,100,200,0.08) 35%, transparent 70%);
      pointer-events: none;
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
    }

    .friendship-card::after {
      content: '';
      position: absolute;
      inset: 0;
      box-shadow: inset 0 0 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
      pointer-events: none;
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 18px;
    }

    .friendship-frame {
      position: relative;
      width: 100%;
      height: auto;
      z-index: 10;
      pointer-events: none;
      overflow: visible;
    }

    .friendship-slots {
      position: relative;
      z-index: 5;
      padding: 10px 30px 0;
      display: grid;
      grid-template-columns: repeat(3, 72px);
      justify-content: space-between;
      row-gap: 59px;
    }

    .friendship-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 72px;
    }

    .friendship-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(47, 70, 120, 0.7);
      border: 1px solid #4a5f92;
      box-shadow: 
        inset 0 4px 10px rgba(0,0,0,0.55),
        inset 0 -2px 4px rgba(120,160,255,0.08),
        inset 0 0 0 1px rgba(0,0,0,0.3),
        0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .friendship-circle::before {
      content: '';
      position: absolute;
      inset: 3px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.08), transparent 50%);
      pointer-events: none;
    }

    .friendship-plus {
      color: rgba(255,255,255,0.94);
      font-size: 40px;
      font-weight: 300;
      line-height: 1;
      transform: translateY(-1px);
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .friendship-label {
      margin-top: 10px;
      font-size: 14px;
      color: #e6e6e6;
      font-weight: 400;
      letter-spacing: 0.2px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.7);
    }

    @media (max-width: 380px) {
      .friendship-card {
        transform: scale(0.94);
        transform-origin: top center;
      }
    }
  `;

  return (
    <div className="mt-2 mb-4">
      <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Friendship 0/9</h3>
      <div className="friendship-card-wrap">
        <div className="friendship-card">
          <svg className="friendship-frame" viewBox="0 0 360 78" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldMain" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f0d98e"/>
                <stop offset="0.25" stopColor="#d4b76a"/>
                <stop offset="0.5" stopColor="#c5a45d"/>
                <stop offset="0.75" stopColor="#b8934a"/>
                <stop offset="1" stopColor="#8a6e38"/>
              </linearGradient>
              <linearGradient id="goldDark" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a47e37"/>
                <stop offset="1" stopColor="#6e531f"/>
              </linearGradient>
              <radialGradient id="gemBlue" cx="0.3" cy="0.2" r="0.8">
                <stop stopColor="#7aa4ff"/>
                <stop offset="0.3" stopColor="#4a7fff"/>
                <stop offset="0.7" stopColor="#3a6be0"/>
                <stop offset="1" stopColor="#1e3a7a"/>
              </radialGradient>
              <filter id="gemGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feFlood floodColor="#4a7fff" floodOpacity="0.6"/>
                <feComposite in2="blur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <rect x="1.5" y="17.5" width="357" height="2.5" fill="url(#goldMain)" rx="1.25"/>
            <rect x="1.5" y="17.5" width="357" height="1" fill="#f3e4b1" opacity="0.5"/>
            <rect x="1.5" y="17.5" width="1.5" height="62" fill="url(#goldMain)"/>
            <rect x="357" y="17.5" width="1.5" height="62" fill="url(#goldMain)"/>
            
            <g transform="translate(1.5, 17.5)">
              <path d="M0 0 L26 0 C26 0 26 6 22 10 C18.5 13.2 14 10 13 13 C13 11.5 15.5 9.5 16.5 6.5 C17 5 17 3 16 1.5 L2 1.5 C2 5.5 3.5 9 6.5 11.5 C2.5 9 0 4.5 0 0Z" fill="url(#goldMain)" stroke="#5a421a" strokeWidth="0.5"/>
              <path d="M0 0 L24 0 C24 0 23 4.5 20 7" stroke="#f0d98e" strokeWidth="0.7" opacity="0.7" fill="none"/>
              <circle cx="11" cy="11" r="5.8" fill="#0a1835" stroke="url(#goldDark)" strokeWidth="1.2"/>
              <circle cx="11" cy="11" r="4.3" fill="url(#gemBlue)" filter="url(#gemGlow)"/>
              <circle cx="9.8" cy="9.7" r="1.4" fill="#b8d4ff" opacity="0.9"/>
            </g>
            
            <g transform="translate(358.5, 17.5) scale(-1,1)">
              <path d="M0 0 L26 0 C26 0 26 6 22 10 C18.5 13.2 14 14 10 13 C13 11.5 15.5 9.5 16.5 6.5 C17 5 17 3 16 1.5 L2 1.5 C2 5.5 3.5 9 6.5 11.5 C2.5 9 0 4.5 0 0Z" fill="url(#goldMain)" stroke="#5a421a" strokeWidth="0.5"/>
              <path d="M0 0 L24 0 C24 0 23 4.5 20 7" stroke="#f0d98e" strokeWidth="0.7" opacity="0.7" fill="none"/>
              <circle cx="11" cy="11" r="5.8" fill="#0a1835" stroke="url(#goldDark)" strokeWidth="1.2"/>
              <circle cx="11" cy="11" r="4.3" fill="url(#gemBlue)" filter="url(#gemGlow)"/>
              <circle cx="9.8" cy="9.7" r="1.4" fill="#b8d4ff" opacity="0.9"/>
            </g>
            
            <g transform="translate(180, 0)">
              <path d="M-44 19.5 C-38 14 -28 11.5 -15 13.5 C-15 13.5 -11 9 -6 7.5 L0 4 L6 7.5 L11 9 L15 13.5 C28 11.5 38 14 44 19.5 C36 22 24 23.5 0 23.5 C-24 23.5 -36 22 -44 19.5Z" fill="#0a1020" opacity="0.5"/>
              <path d="M-44 18.5 C-36 12 -22 10 -12 13 L-8 10 L-4 8 L0 5 L4 8 L8 10 L12 13 C22 10 36 12 44 18.5 C38 21 26 22.5 14 22.8 L10 18 L6 15 L0 12 L-6 15 L-10 18 L-14 22.8 C-26 22.5 -38 21 -44 18.5Z" fill="url(#goldMain)" stroke="#5a421a" strokeWidth="0.6"/>
              <path d="M-41 17.5 C-32 12.5 -20 11.5 -12 13.5" stroke="#f0d98e" strokeWidth="1" fill="none" opacity="0.8"/>
              <path d="M41 17.5 C32 12.5 20 11.5 12 13.5" stroke="#f0d98e" strokeWidth="1" fill="none" opacity="0.8"/>
              <path d="M-12 13 C-18 8 -28 8.5 -37 4 C-31 10 -22 12.5 -14 13.5 L-10 11.5 C-11 10 -11.5 9 -12 8.5 V13Z" fill="#9c7a3c" stroke="#5f451e" strokeWidth="0.5"/>
              <path d="M12 13 C18 8 28 8.5 37 4 C31 10 22 12.5 14 13.5 L10 11.5 C11 10 11.5 9 12 8.5 V13Z" fill="#9c7a3c" stroke="#5f451e" strokeWidth="0.5"/>
              <path d="M-28 12 C-32 10 -35 8 -37 4.5 C-33 7 -30 8.5 -26 9.5" stroke="#d4b76a" strokeWidth="1" fill="none" opacity="0.9"/>
              <path d="M28 12 C32 10 35 8 37 4.5 C33 7 30 8.5 26 9.5" stroke="#d4b76a" strokeWidth="1" fill="none" opacity="0.9"/>
              <path d="M-9 7 L0 0.5 L9 7 L7.5 17.5 L0 22.5 L-7.5 17.5 Z" fill="url(#goldMain)" stroke="#3d2a12" strokeWidth="0.8"/>
              <path d="M-8 7.5 L0 2 L8 7.5 L7 16.5 L0 21 L-7 16.5 Z" fill="#7a5928" opacity="0.3"/>
              <path d="M-7.5 7.8 L0 1.5 L7.5 7.8" stroke="#f0d98e" strokeWidth="0.6" fill="none" opacity="0.7"/>
              
              <g filter="url(#gemGlow)">
                <path d="M0 2.5 L6.2 9.2 L0 20 L-6.2 9.2 Z" fill="#1a3a7a" stroke="#0e1f44" strokeWidth="0.5"/>
                <path d="M0 2.5 L6.2 9.2 L0 18.5 L-6.2 9.2 Z" fill="url(#gemBlue)"/>
                <path d="M0 2.5 L4.5 8.5 L0 12 L-4.5 8.5 Z" fill="#5a85ff" opacity="0.9"/>
                <path d="M0 2.5 L3 7 L0 9.5 L-3 7 Z" fill="#a8c4ff" opacity="0.95"/>
                <path d="M-1.5 5 L0 3.5 L1.5 5 L0 6.2 Z" fill="#e6f0ff"/>
              </g>
              
              <path d="M-6 18.5 C-3 20 3 20 6 18.5 C4 19.5 1.5 20 0 20 C-1.5 20 -4 19.5 -6 18.5Z" fill="#5a421a" opacity="0.8"/>
            </g>
          </svg>

          <div className="friendship-slots">
            {Array.from({ length: 10 }).map((_, i) => (
              <div className="friendship-slot" key={i}>
                <div className="friendship-circle"><span className="friendship-plus">+</span></div>
                <div className="friendship-label">Invite</div>
              </div>
            ))}
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

  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {};

  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  const ownedFrames = ownedItems.filter((id: string) => AVATAR_FRAMES[id]);

  const budgetLevel = profile.budgetLevel ?? profile.level?.budget ?? 0;
  
  const userId = profile?.id || profile?.uid || '';
  const deterministicId = getDeterministicFallbackId(userId);
  const displayId = displayID || displayIdProp || profile?.accountNumber || deterministicId;
  
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
                <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-xl relative">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold bg-slate-100 text-slate-400">{(profile.username || 'U').charAt(0)}</AvatarFallback>
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

                {/* ID */}
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

            {/* CP Card */}
            <CPCard avatarUrl={profile.avatarUrl} username={profile.username} />

            {/* Friendship Card - ADDED HERE BELOW CP CARD */}
            <FriendshipCard />

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
