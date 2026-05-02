'use client'; 

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import {
  Volume2,
  VolumeX,
  X,
  Move,
  Plus,
  Clock,
  HelpCircle,
  ChevronLeft
} from 'lucide-react';
import { UmmyLogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// NAYA CHIPS DATA (Zebra Border logic is managed via component styling)
const CHIPS = [
 { value: 100, label: '100', hex: '#2563EB' },        // Blue
 { value: 1000, label: '1K', hex: '#F97316' },        // Orange
 { value: 50000, label: '50K', hex: '#EF4444' },      // Red
 { value: 100000, label: '100K', hex: '#0891B2' },    // Sea Blue
 { value: 500000, label: '500K', hex: '#EAB308' },    // Yellow
 { value: 1000000, label: '1M', hex: '#000000' },     // Black
 { value: 50000000, label: '50M', hex: '#166534' },   // Dark Green
 { value: 100000000, label: '100M', hex: '#7F1D1D' }, // Maroon
 { value: 500000000, label: '500M', hex: '#6B7280' }, // Grey
];

// Realistic Deck for Cards 
const DECK = [
  'A♠', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', '10♠', 'J♠', 'Q♠', 'K♠',
  'A♥', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥', '8♥', '9♥', '10♥', 'J♥', 'Q♥', 'K♥',
  'A♦', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '8♦', '9♦', '10♦', 'J♦', 'Q♦', 'K♦',
  'A♣', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣', '8♣', '9♣', '10♣', 'J♣', 'Q♣', 'K♣'
];

// --- ZEBRA CHIP COMPONENT ---
const PokerChip = ({ label, hex, isFloating }: { label: string, hex: string, isFloating: boolean }) => (
  <div 
    className={cn(
      "rounded-full flex items-center justify-center shadow-[0_3px_6px_rgba(0,0,0,0.6)] overflow-hidden", 
      isFloating ? "w-[16px] h-[16px]" : "w-8 h-8"
    )}
    style={{ background: `repeating-conic-gradient(${hex} 0 20deg, white 20deg 40deg)` }}
  >
    <div className="bg-white rounded-full w-[72%] h-[72%] flex items-center justify-center shadow-inner border border-black/10">
      <span className="font-extrabold" style={{ color: hex, fontSize: isFloating ? '4px' : '7.5px' }}>
        {label}
      </span>
    </div>
  </div>
);

// --- 3D BANNERS ---
const WolfBanner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 260" className={cn("drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wolfPole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8f5"/><stop offset="50%" stopColor="#b8b8b0"/><stop offset="100%" stopColor="#e9e9e4"/>
      </linearGradient>
      <linearGradient id="wolfGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9d0"/><stop offset="20%" stopColor="#ffd700"/><stop offset="50%" stopColor="#c99700"/><stop offset="80%" stopColor="#ffdf5f"/><stop offset="100%" stopColor="#7a5a00"/>
      </linearGradient>
      <linearGradient id="wolfSilver" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e8e6da"/><stop offset="35%" stopColor="#b8b6aa"/><stop offset="70%" stopColor="#8a8982"/><stop offset="100%" stopColor="#a5a49b"/>
      </linearGradient>
      <radialGradient id="wolfShine" cx="0.3" cy="0.15" r="0.7">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.45"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="dg-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4b4b4f"/><stop offset="25%" stopColor="#2a2a2e"/><stop offset="100%" stopColor="#0c0c0e"/>
      </linearGradient>
      <linearGradient id="dg-wing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a5a60"/><stop offset="100%" stopColor="#1f1f22"/>
      </linearGradient>
      <radialGradient id="dg-eye" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0%" stopColor="#e8ffbd"/><stop offset="30%" stopColor="#b6ff5a"/><stop offset="70%" stopColor="#7ed321"/><stop offset="100%" stopColor="#3d7a00"/>
      </radialGradient>
      <filter id="dg-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.6"/>
      </filter>
    </defs>
    <rect x="10" y="24" width="180" height="20" rx="10" fill="url(#wolfPole)"/>
    <rect x="36" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <rect x="70" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <rect x="110" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <rect x="144" y="24" width="20" height="20" fill="url(#wolfGold)"/>
    <path d="M10 34 L0 28 L10 16 L20 28 Z" fill="url(#wolfGold)"/>
    <path d="M190 34 L200 28 L190 16 L180 28 Z" fill="url(#wolfGold)"/>
    <rect x="22" y="44" width="14" height="168" rx="3" fill="#8c8c84" opacity="0.9"/>
    <rect x="164" y="44" width="14" height="168" rx="3" fill="#8c8c84" opacity="0.9"/>
    <ellipse cx="29" cy="216" rx="7" ry="10" fill="url(#wolfGold)"/>
    <ellipse cx="171" cy="216" rx="7" ry="10" fill="url(#wolfGold)"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#wolfSilver)" stroke="url(#wolfGold)" strokeWidth="3.5"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#wolfShine)"/>
    <g transform="translate(35, 60) scale(0.65)">
      <g filter="url(#dg-shadow)">
        <path d="M45 138 C12 125, 2 155, 28 172 L50 155 Z" fill="url(#dg-wing)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M155 138 C188 125, 198 155, 172 172 L150 155 Z" fill="url(#dg-wing)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      </g>
      <ellipse cx="100" cy="178" rx="54" ry="52" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="70" cy="210" rx="22" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="130" cy="210" rx="22" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="68" cy="185" rx="17" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="132" cy="185" rx="17" ry="26" fill="url(#dg-body)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="100" cy="88" rx="74" ry="64" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <path d="M42 48 C28 12, 58 2, 78 38 C70 52, 52 58, 42 48 Z" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <path d="M158 48 C172 12, 142 2, 122 38 C130 52, 148 58, 158 48 Z" fill="url(#dg-body)" stroke="#000" strokeWidth="3"/>
      <ellipse cx="65" cy="100" rx="29" ry="32" fill="url(#dg-eye)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="135" cy="100" rx="29" ry="32" fill="url(#dg-eye)" stroke="#000" strokeWidth="2.5"/>
      <ellipse cx="72" cy="110" rx="16" ry="20" fill="#000"/>
      <ellipse cx="128" cy="110" rx="16" ry="20" fill="#000"/>
    </g>
  </svg>
);

const LionBanner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 260" className={cn("drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lionPole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8f8f5"/><stop offset="50%" stopColor="#b8b8b0"/><stop offset="100%" stopColor="#e9e9e4"/>
      </linearGradient>
      <linearGradient id="lionGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9d0"/><stop offset="20%" stopColor="#ffd700"/><stop offset="50%" stopColor="#c99700"/><stop offset="80%" stopColor="#ffdf5f"/><stop offset="100%" stopColor="#7a5a00"/>
      </linearGradient>
      <linearGradient id="lionSplit" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#e6b422"/><stop offset="49.8%" stopColor="#b8860b"/><stop offset="50%" stopColor="#a10f0f"/><stop offset="100%" stopColor="#6a0000"/>
      </linearGradient>
      <linearGradient id="gd-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4de7b7"/><stop offset="40%" stopColor="#1db88f"/><stop offset="100%" stopColor="#0a6b50"/>
      </linearGradient>
      <linearGradient id="gd-belly" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffeb7a"/><stop offset="100%" stopColor="#ff9f1c"/>
      </linearGradient>
      <linearGradient id="gd-wing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffcb6b"/><stop offset="100%" stopColor="#ff8a00"/>
      </linearGradient>
      <linearGradient id="gd-horn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff6e0"/><stop offset="100%" stopColor="#c2b59a"/>
      </linearGradient>
      <radialGradient id="gd-eye" cx="0.5" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="#c7e2ff"/><stop offset="45%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1e3a8a"/>
      </radialGradient>
      <linearGradient id="gd-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.85"/><stop offset="30%" stopColor="#fff" stopOpacity="0.3"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
      <filter id="gd-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.5"/>
      </filter>
    </defs>
    <rect x="10" y="24" width="180" height="20" rx="10" fill="url(#lionPole)"/>
    <rect x="36" y="24" width="20" height="20" fill="#b71c1c"/>
    <rect x="70" y="24" width="20" height="20" fill="#b71c1c"/>
    <rect x="110" y="24" width="20" height="20" fill="#b71c1c"/>
    <rect x="144" y="24" width="20" height="20" fill="#b71c1c"/>
    <path d="M10 34 L0 28 L10 16 L20 28 Z" fill="url(#lionGold)"/>
    <path d="M190 34 L200 28 L190 16 L180 28 Z" fill="url(#lionGold)"/>
    <rect x="22" y="44" width="14" height="168" rx="3" fill="#5a0a0a" opacity="0.9"/>
    <rect x="164" y="44" width="14" height="168" rx="3" fill="#5a0a0a" opacity="0.9"/>
    <ellipse cx="29" cy="216" rx="7" ry="10" fill="url(#lionGold)"/>
    <ellipse cx="171" cy="216" rx="7" ry="10" fill="url(#lionGold)"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#lionSplit)" stroke="url(#lionGold)" strokeWidth="3.5"/>
    <g transform="translate(35, 60) scale(0.65)">
      <g filter="url(#gd-shadow)">
        <path d="M32 158 C18 168, 14 185, 28 198 C40 208, 52 200, 58 188" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3" strokeLinecap="round"/>
        <path d="M30 172 C22 180, 26 190, 40 194" fill="#ff8a00" stroke="#0b3d2e" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M58 138 C22 128, 4 152, 20 176 L62 156 Z" fill="url(#gd-wing)" stroke="#0b3d2e" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M142 138 C178 128, 196 152, 180 176 L138 156 Z" fill="url(#gd-wing)" stroke="#0b3d2e" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M25 155 Q40 148 58 152" fill="none" stroke="#0b3d2e" strokeWidth="2" opacity="0.7"/>
        <path d="M175 155 Q160 148 142 152" fill="none" stroke="#0b3d2e" strokeWidth="2" opacity="0.7"/>
      </g>
      <ellipse cx="68" cy="202" rx="23" ry="20" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3"/>
      <ellipse cx="132" cy="202" rx="23" ry="20" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3"/>
      <ellipse cx="100" cy="168" rx="44" ry="52" fill="url(#gd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <path d="M72 138 C70 168, 72 198, 100 212 C128 198, 130 168, 128 138 C115 132, 85 132, 72 138 Z" fill="url(#gd-belly)" stroke="#0b3d2e" strokeWidth="2.5"/>
      <path d="M75 156 Q100 166 125 156" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M74 176 Q100 186 126 176" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M78 194 Q100 202 122 194" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="66" cy="178" rx="13" ry="24" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3" transform="rotate(-12 66 178)"/>
      <ellipse cx="134" cy="178" rx="13" ry="24" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3" transform="rotate(12 134 178)"/>
      <path d="M50 52 C42 28, 36 12, 52 6 C66 1, 74 14, 70 34 L60 48 Z" fill="url(#gd-horn)" stroke="#0b3d2e" strokeWidth="3"/>
      <path d="M150 52 C158 28, 164 12, 148 6 C134 1, 126 14, 130 34 L140 48 Z" fill="url(#gd-horn)" stroke="#0b3d2e" strokeWidth="3"/>
      <path d="M45 22 Q53 27 61 22" fill="none" stroke="#9c8465" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M139 22 Q147 27 155 22" fill="none" stroke="#9c8465" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M90 30 C93 18, 99 12, 105 24" fill="#1db88f" stroke="#0b3d2e" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M106 28 C110 18, 118 15, 123 26" fill="#1db88f" stroke="#0b3d2e" strokeWidth="2.5" strokeLinejoin="round"/>
      <ellipse cx="100" cy="86" rx="68" ry="58" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="3.5"/>
      <path d="M34 78 C20 68, 14 84, 24 98 L40 90 Z" fill="url(#gd-wing)" stroke="#0b3d2e" strokeWidth="3"/>
      <path d="M166 78 C180 68, 186 84, 176 98 L160 90 Z" fill="url(#gd-wing)" stroke="#0b3d2e" strokeWidth="3"/>
      <ellipse cx="68" cy="86" rx="23" ry="27" fill="white" stroke="#0b3d2e" strokeWidth="2.5"/>
      <ellipse cx="132" cy="86" rx="23" ry="27" fill="white" stroke="#0b3d2e" strokeWidth="2.5"/>
      <ellipse cx="68" cy="92" rx="16" ry="19" fill="url(#gd-eye)"/>
      <ellipse cx="132" cy="92" rx="16" ry="19" fill="url(#gd-eye)"/>
      <ellipse cx="68" cy="96" rx="8" ry="11" fill="black"/>
      <ellipse cx="132" cy="96" rx="8" ry="11" fill="black"/>
      <circle cx="62" cy="80" r="4.5" fill="white"/>
      <circle cx="126" cy="80" r="4.5" fill="white"/>
      <circle cx="72" cy="85" r="2" fill="white" opacity="0.8"/>
      <circle cx="136" cy="85" r="2" fill="white" opacity="0.8"/>
      <ellipse cx="100" cy="116" rx="36" ry="24" fill="url(#gd-body)" stroke="#0b3d2e" strokeWidth="2"/>
      <ellipse cx="88" cy="112" rx="4" ry="3" fill="#0b3d2e"/>
      <ellipse cx="112" cy="112" rx="4" ry="3" fill="#0b3d2e"/>
      <path d="M76 120 Q100 134 124 120" fill="none" stroke="#0b3d2e" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M96 126 L100 132 L104 126 Z" fill="white" stroke="#0b3d2e" strokeWidth="1.5"/>
      <ellipse cx="56" cy="218" rx="5" ry="6" fill="#fbcfe8" stroke="#0b3d2e" strokeWidth="1.5"/>
      <ellipse cx="68" cy="221" rx="5.5" ry="6.5" fill="#fbcfe8" stroke="#0b3d2e" strokeWidth="1.5"/>
      <ellipse cx="80" cy="218" rx="5" ry="6" fill="#fbcfe8" stroke="#0b3d2e" strokeWidth="1.5"/>
      <ellipse cx="120" cy="218" rx="5" ry="6" fill="#fbcfe8" stroke="#0b3d2e" strokeWidth="1.5"/>
      <ellipse cx="132" cy="221" rx="5.5" ry="6.5" fill="#fbcfe8" stroke="#0b3d2e" strokeWidth="1.5"/>
      <ellipse cx="144" cy="218" rx="5" ry="6" fill="#fbcfe8" stroke="#0b3d2e" strokeWidth="1.5"/>
      <ellipse cx="76" cy="52" rx="28" ry="14" fill="url(#gd-gloss)" transform="rotate(-22 76 52)"/>
      <ellipse cx="124" cy="52" rx="22" ry="11" fill="url(#gd-gloss)" opacity="0.6" transform="rotate(18 124 52)"/>
      <ellipse cx="78" cy="150" rx="10" ry="24" fill="white" opacity="0.12" transform="rotate(-10 78 150)"/>
    </g>
  </svg>
);

const FishBanner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 260" className={cn("drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]", className)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fishPole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8f8f5"/><stop offset="50%" stopColor="#b8b8b0"/><stop offset="100%" stopColor="#e9e9e4"/>
      </linearGradient>
      <linearGradient id="fishGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9d0"/><stop offset="20%" stopColor="#ffd700"/><stop offset="50%" stopColor="#c99700"/><stop offset="80%" stopColor="#ffdf5f"/><stop offset="100%" stopColor="#7a5a00"/>
      </linearGradient>
      <linearGradient id="fishGreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0e9a4a"/><stop offset="40%" stopColor="#067a38"/><stop offset="100%" stopColor="#004d24"/>
      </linearGradient>
      <radialGradient id="fishShine" cx="0.25" cy="0.2" r="0.8">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.3"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="bpd-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a8fc8"/><stop offset="45%" stopColor="#2c4f7c"/><stop offset="100%" stopColor="#162e4d"/>
      </linearGradient>
      <linearGradient id="bpd-belly" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe4ec"/><stop offset="100%" stopColor="#ff9fba"/>
      </linearGradient>
      <linearGradient id="bpd-wing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffb8d1"/><stop offset="100%" stopColor="#ff5a93"/>
      </linearGradient>
      <linearGradient id="bpd-horn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffc1d5"/><stop offset="100%" stopColor="#ff7aa6"/>
      </linearGradient>
      <linearGradient id="bpd-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.9"/><stop offset="30%" stopColor="#fff" stopOpacity="0.3"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
      <filter id="bpd-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.45"/>
      </filter>
    </defs>
    <rect x="10" y="24" width="180" height="20" rx="10" fill="url(#fishPole)"/>
    <rect x="36" y="24" width="20" height="20" fill="#0a7a3a"/>
    <rect x="70" y="24" width="20" height="20" fill="#0a7a3a"/>
    <rect x="110" y="24" width="20" height="20" fill="#0a7a3a"/>
    <rect x="144" y="24" width="20" height="20" fill="#0a7a3a"/>
    <path d="M10 34 L0 28 L10 16 L20 28 Z" fill="url(#fishGold)"/>
    <path d="M190 34 L200 28 L190 16 L180 28 Z" fill="url(#fishGold)"/>
    <rect x="22" y="44" width="14" height="168" rx="3" fill="#00391b" opacity="0.9"/>
    <rect x="164" y="44" width="14" height="168" rx="3" fill="#00391b" opacity="0.9"/>
    <ellipse cx="29" cy="216" rx="7" ry="10" fill="url(#fishGold)"/>
    <ellipse cx="171" cy="216" rx="7" ry="10" fill="url(#fishGold)"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#fishGreen)" stroke="url(#fishGold)" strokeWidth="3.5"/>
    <path d="M30 44 H170 V170 Q170 202 100 240 Q30 202 30 170 Z" fill="url(#fishShine)"/>
    <g transform="translate(35, 60) scale(0.65)">
      <ellipse cx="100" cy="222" rx="50" ry="11" fill="#000" opacity="0.25"/>
      <g filter="url(#bpd-shadow)">
        <path d="M62 133 C28 117, 10 148, 26 174 C36 188, 52 180, 68 165 L62 133 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5" strokeLinejoin="round"/>
        <path d="M138 133 C172 117, 190 148, 174 174 C164 188, 148 180, 132 165 L138 133 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5" strokeLinejoin="round"/>
        <path d="M60 138 C38 128, 22 150, 32 168 L60 154 Z" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="2.5"/>
        <path d="M140 138 C162 128, 178 150, 168 168 L140 154 Z" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="2.5"/>
      </g>
      <ellipse cx="100" cy="176" rx="46" ry="48" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <ellipse cx="62" cy="206" rx="32" ry="22" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <ellipse cx="138" cy="206" rx="32" ry="22" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <ellipse cx="100" cy="172" rx="30" ry="38" fill="url(#bpd-belly)" stroke="#0d1f35" strokeWidth="2.5"/>
      <rect x="78" y="148" width="44" height="6" rx="3" fill="#ffabc6"/>
      <rect x="76" y="160" width="48" height="6" rx="3" fill="#ffabc6"/>
      <rect x="76" y="172" width="48" height="6" rx="3" fill="#ffabc6"/>
      <rect x="78" y="184" width="44" height="6" rx="3" fill="#ffabc6"/>
      <rect x="82" y="196" width="36" height="5" rx="2.5" fill="#ffabc6"/>
      <ellipse cx="72" cy="162" rx="14" ry="20" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3" transform="rotate(-18 72 162)"/>
      <ellipse cx="128" cy="162" rx="14" ry="20" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3" transform="rotate(18 128 162)"/>
      <path d="M60 50 C52 28, 64 16, 78 34 L70 50 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3"/>
      <path d="M140 50 C148 28, 136 16, 122 34 L130 50 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3"/>
      <path d="M64 46 C60 32, 68 24, 74 36 L68 44 Z" fill="url(#bpd-horn)" stroke="#0d1f35" strokeWidth="2"/>
      <path d="M136 46 C140 32, 132 24, 126 36 L132 44 Z" fill="url(#bpd-horn)" stroke="#0d1f35" strokeWidth="2"/>
      <path d="M94 58 L100 48 L106 58 L100 64 Z" fill="url(#bpd-horn)" stroke="#0d1f35" strokeWidth="2"/>
      <path d="M48 74 C36 66, 32 78, 42 86 L52 80 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="2.5"/>
      <path d="M44 88 C32 84, 28 96, 38 102 L48 94 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="2.5"/>
      <path d="M42 102 C32 100, 30 112, 40 116 L48 108 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="2.5"/>
      <path d="M152 74 C164 66, 168 78, 158 86 L148 80 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="2.5"/>
      <path d="M156 88 C168 84, 172 96, 162 102 L152 94 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="2.5"/>
      <path d="M158 102 C168 100, 170 112, 160 116 L152 108 Z" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="2.5"/>
      <path d="M46 76 C40 72, 38 78, 44 82" fill="url(#bpd-wing)"/>
      <path d="M42 90 C36 88, 34 94, 40 96" fill="url(#bpd-wing)"/>
      <path d="M42 104 C38 102, 36 108, 42 110" fill="url(#bpd-wing)"/>
      <path d="M154 76 C160 72, 162 78, 156 82" fill="url(#bpd-wing)"/>
      <path d="M158 90 C164 88, 166 94, 160 96" fill="url(#bpd-wing)"/>
      <path d="M158 104 C162 102, 164 108, 158 110" fill="url(#bpd-wing)"/>
      <ellipse cx="100" cy="92" rx="66" ry="56" fill="url(#bpd-body)" stroke="#0d1f35" strokeWidth="3.5"/>
      <ellipse cx="72" cy="90" rx="22" ry="26" fill="white" stroke="#0d1f35" strokeWidth="2.5"/>
      <ellipse cx="128" cy="90" rx="22" ry="26" fill="white" stroke="#0d1f35" strokeWidth="2.5"/>
      <ellipse cx="72" cy="98" rx="12" ry="15" fill="#0d1f35"/>
      <ellipse cx="128" cy="98" rx="12" ry="15" fill="#0d1f35"/>
      <circle cx="66" cy="82" r="5" fill="white"/>
      <circle cx="122" cy="82" r="5" fill="white"/>
      <circle cx="76" cy="90" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="132" cy="90" r="2.5" fill="white" opacity="0.9"/>
      <path d="M72 116 Q100 128 128 116" fill="none" stroke="#0d1f35" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="100" cy="112" rx="18" ry="8" fill="url(#bpd-body)" stroke="none"/>
      <ellipse cx="62" cy="214" rx="13" ry="9" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <circle cx="50" cy="204" r="4" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <circle cx="60" cy="200" r="4.5" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <circle cx="70" cy="204" r="4" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <ellipse cx="138" cy="214" rx="13" ry="9" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <circle cx="150" cy="204" r="4" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <circle cx="140" cy="200" r="4.5" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <circle cx="130" cy="204" r="4" fill="url(#bpd-wing)" stroke="#0d1f35" strokeWidth="1.5"/>
      <ellipse cx="74" cy="54" rx="26" ry="12" fill="url(#bpd-gloss)" transform="rotate(-20 74 54)"/>
      <ellipse cx="126" cy="54" rx="20" ry="10" fill="url(#bpd-gloss)" opacity="0.7" transform="rotate(20 126 54)"/>
      <ellipse cx="80" cy="148" rx="8" ry="20" fill="white" opacity="0.08" transform="rotate(-12 80 148)"/>
    </g>
  </svg>
);

const FACTIONS = [
 { id: 'WOLF', label: 'Wolf', Banner: WolfBanner },
 { id: 'LION', label: 'Lion', Banner: LionBanner },
 { id: 'FISH', label: 'Fish', Banner: FishBanner },
];

const evaluateHand = (cards: string[]) => {
  if (!cards || cards.length !== 3) return '';
  const values = cards.map(c => c.slice(0, -1)); 
  const counts: Record<string, number> = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount === 3) return 'Sequence'; 
  if (maxCount === 2) return 'Pair';
  return 'High';
};

// --- NAYA MERGED WINNER OVERLAY COMPONENT ---
type Player = { rank: 1 | 2 | 3; name: string; prize: number; bet: number; };
const fallbackPlayers: Player[] = [
  { rank: 2, name: "Betnarmati Saru", prize: 140, bet: 50 },
  { rank: 1, name: "pihu", prize: 295, bet: 100 },
  { rank: 3, name: "Saksham Thakur", prize: 59, bet: 20 },
];

function ResultOverlay({ finalWinAmount, totalBet, winnerId }: { finalWinAmount: number, totalBet: number, winnerId: string | null }) {
  const [yourPrize, setYourPrize] = useState(0);
  const [yourBet, setYourBet] = useState(0);
  const [awake, setAwake] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<Record<number, number>>({1:0,2:0,3:0});
  const confettiRef = useRef<HTMLDivElement>(null);

  const winnerFaction = FACTIONS.find(f => f.id === winnerId);
  const WinnerBanner = winnerFaction?.Banner;

  const animate = (from: number, to: number, duration: number, onUpdate: (v:number)=>void) => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      onUpdate(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const burst = () => {
    const el = confettiRef.current;
    if (!el) return;
    el.innerHTML = "";
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("i");
      s.style.left = 5 + Math.random() * 90 + "%";
      s.style.background = `hsl(${38 + Math.random() * 30}, 100%, ${62 + Math.random() * 18}%)`;
      s.style.animationDelay = Math.random() * 0.2 + "s";
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handlePlayer = (p: Player) => {
    setActive(p.rank);
    animate(yourPrize, finalWinAmount, 650, setYourPrize);
    animate(yourBet, totalBet, 650, setYourBet);
    if (p.rank === 1) burst();
  };

  useEffect(() => {
    fallbackPlayers.forEach((p, i) => {
      setTimeout(() => {
        animate(0, p.prize, 1100 + i * 150, (v) =>
          setPrizes(prev => ({ ...prev, [p.rank]: v }))
        );
      }, 300);
    });
    const winner = fallbackPlayers.find(p => p.rank === 1)!;
    const t = setTimeout(() => {
        handlePlayer(winner);
        if(finalWinAmount > 0) burst();
    }, 1400);
    return () => clearTimeout(t);
  }, [finalWinAmount, totalBet]);

  return (
    <>
      <style>{`
        .result-wrap { width:100%; height:100%; display: flex; align-items: center; justify-content: center; position: relative; }
        .res-card {
          height:100%; width:100%;
          background: linear-gradient(180deg, rgba(28,22,34,.98) 0%, rgba(12,10,14,.98) 58%, #050507 100%);
          border:1px solid rgba(232,200,120,.2); border-radius:18px;
          padding: clamp(12px,2vh,18px) clamp(14px,3vw,22px);
          display:flex; flex-direction:column; justify-content:space-between;
          position:relative; overflow:hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,.05) inset, 0 24px 70px rgba(0,0,0,.85), 0 4px 12px rgba(0,0,0,.6);
          isolation:isolate; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Inter, sans-serif; color:#fff;
        }
        .res-card::before { content:""; position:absolute; inset:0; background: radial-gradient(400px 120px at 50% 0%, rgba(232,200,120,.18), transparent 70%), radial-gradient(300px 200px at 80% 120%, rgba(255,180,60,.12), transparent 60%); pointer-events:none; z-index:0; }
        .res-card::after { content:""; position:absolute; inset:-1px; border-radius:18px; background: linear-gradient(180deg, rgba(255,255,255,.15), rgba(255,255,255,0) 30%); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude; padding:1px; pointer-events:none; }
        .top { display:flex; align-items:center; gap:3.2vw; height:35%; position:relative; z-index:2; }
        .emoji-box { width:22%; min-width:70px; aspect-ratio:1; position:relative; flex-shrink:0; cursor:pointer; filter: drop-shadow(0 10px 20px rgba(0,0,0,.55)); transition:transform .3s; }
        .emoji-box:active { transform:scale(.96); }
        .emoji-box svg { width:100%; height:100%; }
        .zzz { position:absolute; right:-6px; top:-4px; pointer-events:none; }
        .zzz span { position:absolute; font-family:'Arial Black', Arial; font-weight:900; color:#5d4e36; opacity:0; animation:zzz 2.6s ease-in-out infinite; text-shadow:0 1px 0 rgba(0,0,0,.3); }
        .zzz span:nth-child(1){ font-size:22px; left:0; top:0; }
        .zzz span:nth-child(2){ font-size:15px; left:13px; top:-7px; animation-delay:.35s; }
        .zzz span:nth-child(3){ font-size:11px; left:23px; top:-14px; animation-delay:.7s; }
        @keyframes zzz { 0%{opacity:0; transform:translate(0,4px) rotate(-12deg)} 25%{opacity:1} 70%{opacity:.8} 100%{opacity:0; transform:translate(-2px,-16px) rotate(-12deg)} }
        .tear { animation:tear 2.4s ease-in infinite; transform-origin:70px 60px; }
        @keyframes tear { 0%,15%{transform:translateY(0); opacity:.95} 70%{opacity:.9} 100%{transform:translateY(7px); opacity:0} }
        .emoji-box.awake .zzz { display:none; }
        .emoji-box.awake .tear { animation:none; opacity:0; }
        .stats { flex:1; display:flex; flex-direction:column; gap:1.1vh; justify-content:center; }
        .stat-row { display:flex; align-items:center; gap:.7rem; background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02)); border:1px solid rgba(255,255,255,.09); padding:.45rem .75rem; border-radius:10px; font-size:clamp(12px,2vh,15px); font-weight:650; box-shadow:0 1px 0 rgba(255,255,255,.06) inset, 0 8px 18px rgba(0,0,0,.4); transition:transform .2s, border-color .2s; }
        .stat-row:hover { transform:translateY(-1px); border-color:rgba(232,200,120,.3); }
        .stat-label { color:#f0eadd; min-width:80px; opacity:.92; letter-spacing:.2px; }
        .coin-icon { width:2vh; height:2vh; min-width:16px; min-height:16px; flex-shrink:0; }
        .stat-row .coin-icon { animation:coinSpin 5.5s linear infinite; }
        @keyframes coinSpin { to { transform:rotateY(360deg) } }
        .stat-value { color:#fff; font-variant-numeric:tabular-nums; }
        .divider { height:17%; display:flex; align-items:center; justify-content:center; position:relative; margin:.4vh 0; z-index:2; }
        .divider-line { position:absolute; width:29%; height:2px; top:50%; background:linear-gradient(90deg, transparent, #e8c878, transparent); filter:drop-shadow(0 0 8px rgba(232,200,120,.45)); overflow:visible; }
        .divider-line.left { left:0; transform:scaleX(-1); }
        .divider-line.right { right:0; }
        .divider-line::after { content:""; position:absolute; width:0; height:0; border-left:7px solid #e8c878; border-top:3.5px solid transparent; border-bottom:3.5px solid transparent; top:-2.5px; right:-6px; filter:drop-shadow(0 0 4px rgba(232,200,120,.7)); animation:arrowPulse 2s ease-in-out infinite; }
        @keyframes arrowPulse { 0%,100%{opacity:.9; transform:translateX(0)} 50%{opacity:1; transform:translateX(2px)} }
        .divider-text { color:#e8c878; font-size:clamp(13px,2.2vh,16px); font-weight:800; letter-spacing:1px; text-transform:uppercase; text-shadow:0 1px 2px #000, 0 0 20px rgba(232,200,120,.4); padding:.15rem .7rem; background:radial-gradient(50% 120% at 50% 50%, rgba(232,200,120,.15), transparent 70%); border-radius:8px; }
        .winners { display:flex; justify-content:space-between; align-items:flex-end; height:48%; gap:2vw; position:relative; z-index:2; padding-bottom: 5px; }
        .player { flex:1; display:flex; flex-direction:column; align-items:center; text-align:center; cursor:pointer; transition:transform .35s cubic-bezier(.2,.8,.2,1); }
        .player:hover { transform:translateY(-3px); }
        .player.rank-1 { transform:translateY(-1vh); }
        .player.rank-3 { transform:translateY(.4vh); }
        .ring-container { width:86%; max-width:90px; aspect-ratio:1; position:relative; transition:filter .3s; }
        .ring-container > svg { width:100%; height:100%; overflow:visible; animation:float 4.5s ease-in-out infinite; }
        .player.rank-1 .ring-container > svg { animation-duration:4s; }
        .player.rank-2 .ring-container > svg { animation-delay:.3s; }
        .player.rank-3 .ring-container > svg { animation-delay:.6s; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .player-name { font-size:clamp(10px,1.6vh,12px); font-weight:650; margin-top:.5vh; color:#f5f3ef; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; max-width:118px; }
        .player-prize { display:flex; align-items:center; justify-content:center; gap:.25rem; margin-top:.3vh; font-size:clamp(11px,1.7vh,13px); font-weight:700; color:#ffd166; text-shadow:0 1px 3px rgba(0,0,0,.7); }
        .player-bet { font-size:clamp(9.5px,1.4vh,11px); color:#b9b9c2; margin-top:.2vh; font-weight:500; }
        .sparkle { position:absolute; width:4px; height:4px; background:#fff3c4; border-radius:50%; box-shadow:0 0 10px #ffd76a, 0 0 18px #ffb300; opacity:0; animation:spark 2.8s ease-in-out infinite; }
        @keyframes spark { 0%{opacity:0; transform:translateY(8px) scale(.5)} 20%{opacity:1} 80%{opacity:.7} 100%{opacity:0; transform:translateY(-18px) scale(1.1)} }
        .rank-1 .s1{ left:18%; top:28%; animation-delay:.2s }
        .rank-1 .s2{ right:14%; top:20%; animation-delay:1s }
        .rank-1 .s3{ left:25%; bottom:20%; animation-delay:1.7s }
        .confetti { position:absolute; inset:0; pointer-events:none; z-index:5; overflow:hidden; border-radius:18px; }
        .confetti i { position:absolute; width:6px; height:10px; border-radius:2px; opacity:0; top:38%; animation:conf 900ms cubic-bezier(.2,.7,.3,1) forwards; }
        @keyframes conf { 0%{opacity:1; transform:translateY(0) rotate(0) scale(1)} 100%{opacity:0; transform:translateY(90px) rotate(520deg) scale(.8)} }
      `}</style>

      <svg width="0" height="0" style={{position:'absolute'}}>
        <defs>
          <linearGradient id="coinGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff9c4"/>
            <stop offset="28%" stopColor="#ffd54f"/>
            <stop offset="68%" stopColor="#f9a825"/>
            <stop offset="100%" stopColor="#e65100"/>
          </linearGradient>
        </defs>
      </svg>

      <div className="result-wrap">
        <div className="res-card">
          <div className="confetti" ref={confettiRef} />

          <div className="top">
            {totalBet > 0 ? (
              <div className="emoji-box flex items-center justify-center transform transition-transform hover:scale-95 cursor-pointer relative">
                {WinnerBanner && <WinnerBanner className="w-[140%] h-[140%] drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] -mt-4 z-10" />}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-[2px] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  <span className={cn("text-[9px] font-black uppercase tracking-wider drop-shadow-md", finalWinAmount > 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                    {finalWinAmount > 0 ? "WINNER" : "LOST"}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`emoji-box ${awake ? 'awake' : ''}`} onClick={()=>{ setAwake(a=>!a); if(navigator.vibrate) navigator.vibrate(10); }}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="faceGrad" cx="0.3" cy="0.25" r="0.8">
                      <stop offset="0%" stopColor="#ffef9a"/><stop offset="42%" stopColor="#ffd54a"/><stop offset="100%" stopColor="#f9a825"/>
                    </radialGradient>
                    <filter id="faceSh"><feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.5"/></filter>
                  </defs>
                  <circle cx="50" cy="52" r="46" fill="url(#faceGrad)" filter="url(#faceSh)"/>
                  <ellipse cx="50" cy="80" rx="19" ry="6.5" fill="#000" opacity=".14"/>
                  <path d="M28 45 Q36 53 44 45" stroke="#5d4037" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                  <path d="M56 45 Q64 53 72 45" stroke="#5d4037" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                  <path d="M38 64 Q50 56 62 64" stroke="#bf360c" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  <path className="tear" d="M70 52 C76 58 78 66 72 74 C66 82 58 78 60 70 C62 64 66 58 70 52 Z" fill="#29b6f6" stroke="#0288d1" strokeWidth="1"/>
                  <ellipse cx="68" cy="62" rx="2.4" ry="3.3" fill="#b3e5fc" opacity=".85"/>
                </svg>
                <div className="zzz"><span>Z</span><span>z</span><span>z</span></div>
              </div>
            )}

            <div className="stats">
              <div className="stat-row">
                <span className="stat-label">Your Prize:</span>
                <svg className="coin-icon" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="url(#coinGold)" stroke="#b26a00" strokeWidth="1"/><circle cx="16" cy="16" r="12" fill="none" stroke="#ffecb3" strokeWidth="1" opacity=".55"/><text x="16" y="21.5" textAnchor="middle" fontSize="16" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text></svg>
                <span className="stat-value">{yourPrize}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Your Bet:</span>
                <svg className="coin-icon" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="url(#coinGold)" stroke="#b26a00" strokeWidth="1"/><circle cx="16" cy="16" r="12" fill="none" stroke="#ffecb3" strokeWidth="1" opacity=".55"/><text x="16" y="21.5" textAnchor="middle" fontSize="16" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text></svg>
                <span className="stat-value">{yourBet}</span>
              </div>
            </div>
          </div>

          <div className="divider">
            <div className="divider-line left"></div>
            <div className="divider-text">Top Winner</div>
            <div className="divider-line right"></div>
          </div>

          <div className="winners">
            {fallbackPlayers.sort((a,b)=> a.rank===1?-1: b.rank===1?1: a.rank-b.rank).map(p=>(
              <div key={p.rank} className={`player rank-${p.rank} ${active===p.rank?'active':''}`} onClick={()=>handlePlayer(p)}>
                <div className="ring-container">
                  {p.rank===1 && <><div className="sparkle s1"></div><div className="sparkle s2"></div><div className="sparkle s3"></div></>}
                  <svg viewBox="0 0 140 160">
                    <circle cx="70" cy="90" r={p.rank===1?50: p.rank===2?48:46} fill="none" stroke="#2f333a" strokeWidth="14" opacity=".45"/>
                    <circle cx="70" cy="90" r={p.rank===1?50: p.rank===2?48:46} fill="none" stroke={p.rank===1?"#ffc73a":p.rank===2?"#b6bcc6":"#c76d46"} strokeWidth="12"/>
                    <g transform="translate(104,124)"><circle r="16" fill={p.rank===1?"#ffc73a":p.rank===2?"#b6bcc6":"#c76d46"} /><text x="0" y="5" textAnchor="middle" fontSize="15" fontWeight="800" fill="white">{p.rank}</text></g>
                  </svg>
                </div>
                <div className="player-name">{p.name}</div>
                <div className="player-prize">
                  <svg className="coin-icon" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="url(#coinGold)" stroke="#b26a00" strokeWidth="1"/><text x="16" y="21.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text></svg>
                  <span>{prizes[p.rank]}</span>
                </div>
                <div className="player-bet">Bet: {p.bet}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// MAIN COMPONENT
interface TeenPattiGameContentProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function TeenPattiGameContent({ isOverlay = false, onClose }: TeenPattiGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'reveal' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(100); 
  const [myBets, setMyBets] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [totalPots, setTotalPots] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [history, setHistory] = useState<string[]>(['WOLF', 'LION', 'FISH', 'WOLF', 'LION']);
  const [isMuted, setIsMuted] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(true);
  const [cardReveal, setCardReveal] = useState<Record<string, string[]>>({});
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  
  const [revealedCardsCount, setRevealedCardsCount] = useState<number>(0);

  const [floatingChips, setFloatingChips] = useState<{
    id: string;
    factionId: string;
    chipDef: typeof CHIPS[0];
    offsetX: number;
    offsetY: number;
    rotation: number;
  }[]>([]);

  const winnersQuery = useMemoFirebase(() => {
     if (!firestore) return null;
     return query(
       collection(firestore, 'globalGameWins'),
       where('gameId', '==', 'teen-patti'),
       orderBy('timestamp', 'desc'),
       limit(5)
     );
   }, [firestore]);

   const { data: liveWins } = useCollection(winnersQuery);

  useEffect(() => { setTimeout(() => setIsLaunching(false), 1500); }, []);

  useEffect(() => {
   if (isLaunching) return;
   const interval = setInterval(() => {
    if (gameState === 'betting') {
     if (timeLeft > 0) setTimeLeft(prev => prev - 1);
     else startReveal();
    }
   }, 1000);
   return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  useEffect(() => {
    if (gameState !== 'betting' || isLaunching) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.5) { 
        const randomFaction = FACTIONS[Math.floor(Math.random() * FACTIONS.length)].id;
        const randomChip = CHIPS[Math.floor(Math.random() * 3)]; 
        spawnChip(randomFaction, randomChip, true);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [gameState, isLaunching]);

  const spawnChip = (factionId: string, chipDef: typeof CHIPS[0], isFake: boolean) => {
    const newChip = {
      id: Math.random().toString(36).substr(2, 9),
      factionId,
      chipDef,
      offsetX: (Math.random() - 0.5) * 20, // Offset reduced to keep inside the button
      offsetY: (Math.random() - 0.5) * 12, // Offset reduced
      rotation: (Math.random() - 0.5) * 60,
    };
    
    setFloatingChips(prev => {
      const next = [...prev, newChip];
      if (next.length > 40) return next.slice(next.length - 40); 
      return next;
    });

    if (isFake) {
      setTotalPots(prev => ({...prev, [factionId]: (prev[factionId] || 0) + chipDef.value}));
    }
  };

  const startReveal = async () => {
   setGameState('reveal');
   setRevealedCardsCount(0); 

   const newCards: Record<string, string[]> = {};
   FACTIONS.forEach(f => { 
       newCards[f.id] = [
           DECK[Math.floor(Math.random() * DECK.length)], 
           DECK[Math.floor(Math.random() * DECK.length)], 
           DECK[Math.floor(Math.random() * DECK.length)]
       ]; 
   });
   setCardReveal(newCards);

   let currentFlip = 0;
   const flipInterval = setInterval(() => {
       currentFlip++;
       setRevealedCardsCount(currentFlip);
       if(currentFlip >= 9) clearInterval(flipInterval);
   }, 1000);

   let winId = FACTIONS[Math.floor(Math.random() * FACTIONS.length)].id;
   if (firestore) {
    try {
     const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'teen-patti'));
     if (oracleSnap.exists() && oracleSnap.data().isActive) {
      winId = oracleSnap.data().forcedResult;
      updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'teen-patti'), { isActive: false });
     }
    } catch (e) {}
   }

   setTimeout(() => { finalizeRound(winId); }, 10000);
  };

  const finalizeRound = (winId: string) => {
   setWinnerId(winId); 
   setHistory(prev => [winId,...prev.slice(0, 10)]); 
   setGameState('result');
   setRevealedCardsCount(9); 

   // 1.95x LOGIC UPDATED
   const winAmount = (myBets[winId] || 0) * 1.95;

   if (winAmount > 0 && currentUser && firestore && userProfile) {
    const updateData = { 'wallet.coins': increment(Math.floor(winAmount)), 'stats.dailyGameWins': increment(Math.floor(winAmount)), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), { gameId: 'teen-patti', userId: currentUser.uid, username: userProfile?.username || 'Guest', avatarUrl: userProfile?.avatarUrl || null, amount: Math.floor(winAmount), timestamp: serverTimestamp() });
   }
   setTimeout(() => { 
       setMyBets({ WOLF: 0, LION: 0, FISH: 0 }); 
       setTotalPots({ WOLF: 0, LION: 0, FISH: 0 }); 
       setWinnerId(null); 
       setGameState('betting'); 
       setTimeLeft(20); 
       setCardReveal({}); 
       setRevealedCardsCount(0); 
       setFloatingChips([]); 
    }, 5000);
  };

  const handlePlaceBet = (id: string) => {
   if (gameState!== 'betting' ||!currentUser ||!userProfile) return;
   if ((userProfile.wallet?.coins || 0) < selectedChip) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
   const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
   setMyBets(prev => ({...prev, [id]: (prev[id] || 0) + selectedChip }));
   setTotalPots(prev => ({...prev, [id]: (prev[id] || 0) + selectedChip }));
   
   const chipDef = CHIPS.find(c => c.value === selectedChip) || CHIPS[0];
   spawnChip(id, chipDef, false);
  };

  // 1.95x LOGIC UPDATED
  const finalWinAmount = winnerId ? Math.floor((myBets[winnerId] || 0) * 1.95) : 0;
  const totalBetAmount = Object.values(myBets).reduce((a, b) => a + b, 0);

  return (
   <motion.div
     drag
     dragControls={dragControls}
     dragListener={false}
     dragMomentum={false}
     initial={isOverlay? { y: '10%' } : {}}
     className={cn(
       "h-[50vh] min-h-[50vh] max-h-[50vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden text-white select-none rounded-none border border-white/20 shadow-2xl transition-all duration-300"
     )}
     // CUSTOM GRADIENT BACKGROUND APPLIED HERE
     style={{ background: 'linear-gradient(to bottom, #3A0A2A, #5A0F7A, #8A2BE2, #C03FD6)' }}
   >
    <header className="relative z-50 flex items-center justify-between p-2 pt-3 px-3">
      <div className="flex items-center gap-1.5">
        <button 
          onPointerDown={(e) => dragControls.start(e)} 
          style={{ touchAction: 'none' }}
          className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-white/80 active:scale-90 cursor-grab active:cursor-grabbing"
        >
          <Move className="h-4 w-4" />
        </button>
        <div className="h-6 pl-1 pr-1 py-1 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-1.5 shadow-inner group">
          <svg viewBox="0 0 32 32" className="w-5 h-5 drop-shadow-md">
            <defs>
              <linearGradient id="topFloatingCoinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff9c4"/>
                <stop offset="28%" stopColor="#ffd54f"/>
                <stop offset="68%" stopColor="#f9a825"/>
                <stop offset="100%" stopColor="#e65100"/>
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="15" fill="url(#topFloatingCoinGrad)" stroke="#b26a00" strokeWidth="1"/>
            <circle cx="16" cy="16" r="12" fill="none" stroke="#ffecb3" strokeWidth="1" opacity=".55"/>
            <text x="16" y="21.5" textAnchor="middle" fontSize="16" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text>
          </svg>
          <span className="text-[10px] font-bold text-white tracking-tight px-1">
            {(userProfile?.wallet?.coins || 0).toLocaleString()}
          </span>
          <button className="w-5 h-5 rounded-full bg-[#34d399] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <Plus className="h-2 w-2 stroke-[3px]" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={() => setIsRulesOpen(true)} className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90">
          <Clock className="h-4 w-4 text-white/90" />
        </button>
        <button onClick={() => setIsMuted(!isMuted)} className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90">
          {isMuted? <VolumeX className="h-4 w-4 text-white/90" /> : <Volume2 className="h-4 w-4 text-white/90" />}
        </button>
        <button className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90">
          <HelpCircle className="h-4 w-4 text-white/90" />
        </button>
        <button onClick={() => (onClose? onClose() : router.back())} className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90 text-white/90">
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>

    <div className="relative z-40 flex justify-center -mt-1 px-1 pointer-events-none">
      <div className="relative w-full max-w-[420px] px-2">
        <svg viewBox="0 0 360 90" className="w-full h-[40px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cd-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6"/>
              <stop offset="12%" stopColor="#d946ef"/>
              <stop offset="35%" stopColor="#a21caf"/>
              <stop offset="70%" stopColor="#7e22ce"/>
              <stop offset="100%" stopColor="#581c87"/>
            </linearGradient>
            <linearGradient id="cd-border" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5d0fe"/>
              <stop offset="100%" stopColor="#c026d3"/>
            </linearGradient>
            <linearGradient id="cd-neon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67e8f9"/>
              <stop offset="100%" stopColor="#3b82f6"/>
            </linearGradient>
            <radialGradient id="cd-shine" cx="0.5" cy="0.05" r="0.9">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
            </radialGradient>
            <filter id="cd-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.9"/>
            </filter>
          </defs>
          <ellipse cx="180" cy="78" rx="135" ry="9" fill="#000" opacity="0.3"/>
          <path d="M18 30 C18 12 32 6 50 6 H310 C328 6 342 12 342 30 V48 C342 66 328 72 310 72 H50 C32 72 18 66 18 48 Z" fill="url(#cd-bg)" stroke="url(#cd-border)" strokeWidth="4" filter="url(#cd-glow)"/>
          <path d="M24 34 C24 18 36 14 52 14 H308 C324 14 336 18 336 34" fill="none" stroke="url(#cd-neon)" strokeWidth="2.2" opacity="0.95"/>
          <path d="M24 46 C24 60 36 64 52 64 H308 C324 64 336 60 336 46" fill="none" stroke="#e0f2fe" strokeWidth="1" opacity="0.5"/>
          <path d="M18 30 C18 12 32 6 50 6 H310 C328 6 342 12 342 30 V36 C342 18 328 12 310 12 H50 C32 12 18 36 Z" fill="url(#cd-shine)"/>
          <g>
            {[...Array(13)].map((_,i)=> {
              const x = 28 + i*24.5;
              return <circle key={i} cx={x} cy="14" r="3" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.8"/>
            })}
            {[...Array(13)].map((_,i)=> {
              const x = 28 + i*24.5;
              return <circle key={i} cx={x} cy="64" r="3" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.8"/>
            })}
            <circle cx="20" cy="30" r="2.7" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.7"/>
            <circle cx="20" cy="48" r="2.7" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.7"/>
            <circle cx="340" cy="30" r="2.7" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.7"/>
            <circle cx="340" cy="48" r="2.7" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.7"/>
          </g>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-[16px] font-bold tracking-wide" style={{textShadow:'0 2px 3px rgba(0,0,0,0.85), 0 0 10px rgba(255,255,255,0.25)'}}>
            Countdown {timeLeft}s
          </span>
        </div>
      </div>
    </div>

    <main className="flex-1 flex flex-col pt-1 overflow-hidden relative z-10">
      <div className="grid grid-cols-3 gap-2 px-4 h-24 shrink-0 relative z-10">
       {FACTIONS.map((f, factionIndex) => (
        <div key={f.id} className="flex flex-col items-center gap-1.5 relative">
          {/* TEXT UPDATED TO 1.95x */}
          <span className="text-[#ffd700] font-black text-[9px] mb-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            1.95×
          </span>
          <div className={cn(
            "w-full h-20 transition-all duration-500 flex flex-col items-center justify-center relative",
            winnerId === f.id ? "scale-110 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] z-10" : ""
          )}>
           <div className="flex -space-x-1.5 scale-100 relative">
             {[0, 1, 2].map((i) => {
               const globalCardIndex = factionIndex * 3 + i;
               const isFlipped = gameState !== 'betting' && revealedCardsCount > globalCardIndex;
               
               const cardText = cardReveal[f.id]?.[i] || '?';
               const isRedCard = cardText.includes('♥') || cardText.includes('♦');

               return (
                <div key={i} className={cn("w-10 h-16 rounded border border-white/10 transition-transform duration-300 transform-gpu preserve-3d flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-black shadow-lg relative -top-2.5", isFlipped ? "rotate-y-180" : "")}>
                 <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded">
                   <span className={cn("text-[18px] font-bold leading-none tracking-tighter", isRedCard ? "text-[#ef4444]" : "text-black")}>
                     {cardText}
                   </span>
                 </div>
                 <div 
                   className="absolute inset-0 backface-hidden rounded border border-white/40 flex items-center justify-center shadow-inner" 
                   style={{ 
                     backgroundColor: '#dc2626', 
                     backgroundImage: 'radial-gradient(white 15%, transparent 16%), radial-gradient(white 15%, transparent 16%)', 
                     backgroundSize: '6px 6px', 
                     backgroundPosition: '0 0, 3px 3px' 
                   }}
                 >
                   <div className="bg-[#dc2626] rounded-full p-[1.5px] border border-white/40 shadow-sm">
                     <UmmyLogoIcon className="h-[12px] w-[12px] text-white" />
                   </div>
                 </div>
                </div>
               );
             })}
             
             {gameState !== 'betting' && revealedCardsCount >= (factionIndex * 3) + 3 && cardReveal[f.id] && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="absolute inset-x-0 bottom-2 flex items-center justify-center z-30 pointer-events-none"
               >
                 <div className="bg-black/85 backdrop-blur-md border-t-2 border-b-2 border-[#ffd700] py-[3px] w-full shadow-[0_0_10px_rgba(255,215,0,0.8)] relative flex items-center justify-center">
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/30" />
                   <span className="text-[#ffd700] text-[10px] font-extrabold uppercase tracking-widest relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,1)' }}>
                     {evaluateHand(cardReveal[f.id])}
                   </span>
                 </div>
               </motion.div>
             )}
           </div>
          </div>
        </div>
       ))}
      </div>

      <div className="flex justify-center gap-4 items-end px-3 flex-1 pb-3 mt-1 relative">
       <div className="absolute inset-0 pointer-events-none z-20 flex justify-center gap-4 px-3 pb-3 items-end">
         <svg width="0" height="0" style={{position:'absolute'}}>
           <defs>
             <linearGradient id="floatingCoinGrad" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#fff9c4"/>
               <stop offset="28%" stopColor="#ffd54f"/>
               <stop offset="68%" stopColor="#f9a825"/>
               <stop offset="100%" stopColor="#e65100"/>
             </linearGradient>
           </defs>
         </svg>
         {FACTIONS.map(f => (
            <div key={`chips-${f.id}`} className="w-[28%] max-w-[110px] relative h-full">
               <AnimatePresence>
                  {floatingChips.filter(c => c.factionId === f.id).map(chip => (
                    <motion.div
                       key={chip.id}
                       initial={{ opacity: 0, y: 150, scale: 0.3 }}
                       animate={{ 
                          opacity: 1, 
                          y: -32 + chip.offsetY, 
                          x: chip.offsetX,
                          rotate: chip.rotation,
                          scale: 0.65 
                       }}
                       exit={{ opacity: 0, scale: 0 }}
                       transition={{ type: "spring", stiffness: 200, damping: 20 }}
                       className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
                    >
                       <svg viewBox="0 0 32 32" className="w-[20px] h-[20px] drop-shadow-md">
                         <circle cx="16" cy="16" r="15" fill="url(#floatingCoinGrad)" stroke="#b26a00" strokeWidth="1"/>
                         <circle cx="16" cy="16" r="12" fill="none" stroke="#ffecb3" strokeWidth="1" opacity=".55"/>
                         <text x="16" y="21.5" textAnchor="middle" fontSize="16" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text>
                       </svg>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         ))}
       </div>

       {FACTIONS.map((f) => {
        const Icon = f.Banner;
        return (
         <div key={f.id} className="flex flex-col items-center w-[28%] max-w-[110px] relative z-10">
           <div className="relative transition-all duration-300 -mt-5 pointer-events-none">
             <Icon className="w-full h-32 drop-shadow-2xl" />
           </div>
           
           <button 
             onClick={() => handlePlaceBet(f.id)} 
             disabled={gameState !== 'betting'}
             className={cn(
               "w-full bg-[#481c1c] rounded-xl h-[48px] flex flex-col items-center justify-end pb-1.5 -translate-y-1 transition-all duration-300 cursor-pointer shadow-lg relative overflow-hidden",
               gameState === 'betting' ? "active:scale-95 hover:brightness-110" : "opacity-80 cursor-not-allowed"
             )}
           >
             <div className="flex flex-col items-center leading-none mt-auto w-full px-1">
               <span className="font-semibold text-white/80 tracking-widest text-[7px] mb-[1.5px] truncate max-w-full">
                 POT: {(totalPots[f.id] || 0)}
               </span>
               <span className="font-extrabold text-[#ffd700] tracking-widest text-[8.5px] drop-shadow-md truncate max-w-full">
                 YOU: {(myBets[f.id] || 0)}
               </span>
             </div>
           </button>
         </div>
        )
       })}
      </div>
    </main>

    <div className="w-full bg-black/30 backdrop-blur-md border-y border-white/10 py-1 px-4 mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-50 shrink-0">
      <span className="text-[9px] font-bold text-white/50 uppercase whitespace-nowrap">History:</span>
      <div className="flex items-center gap-1.5">
        {history.map((winId, idx) => {
          const faction = FACTIONS.find(f => f.id === winId);
          const Icon = faction?.Banner;
          return (
            <div key={idx} className={cn(
              "w-6 h-6 rounded bg-black/40 border flex items-center justify-center shrink-0",
              idx === 0? "border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.5)]" : "border-white/10 opacity-60"
            )}>
              {Icon && <Icon className="w-4 h-4" />}
            </div>
          );
        })}
      </div>
    </div>

    <footer className="p-2 py-3 bg-gradient-to-t from-black/60 to-transparent shrink-0 relative z-50">
      <div className="w-full flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
         {CHIPS.map(chip => (
          <button 
             key={chip.value} 
             onClick={() => setSelectedChip(chip.value)} 
             className={cn(
               "transition-all shrink-0 rounded-full relative group", 
               selectedChip === chip.value? "scale-110 ring-2 ring-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "opacity-80 grayscale-[0.2]"
             )}
          >
             <PokerChip label={chip.label} hex={chip.hex} isFloating={false} />
          </button>
         ))}
      </div>
    </footer>

    <AnimatePresence>
      {gameState === 'result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-3"
        >
          <ResultOverlay finalWinAmount={finalWinAmount} totalBet={totalBetAmount} winnerId={winnerId} />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Rules Sheet */}
    <AnimatePresence>
      {isRulesOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-x-0 bottom-0 h-[30vh] min-h-[250px] bg-black border-t border-white/20 rounded-t-2xl z-[150] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.9)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 shrink-0">
            <button 
              onClick={() => setIsRulesOpen(false)} 
              className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-white font-bold tracking-widest uppercase absolute left-1/2 -translate-x-1/2">
              Rules
            </h2>
            <div className="w-8" />
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto no-scrollbar flex-1 text-white/80 space-y-4 text-[12px] font-medium leading-relaxed pb-6">
            <p>1. At the start of each round, A, B and C will each be dealt a hand of 3 cards.</p>
            <p>2. If the dragon you bet on has the biggest hand, you will win a reward of x1.95 of your bet amount.</p>
            <p>3. Hand Rankings: Set &gt; Pure Sequence &gt; Colour &gt; Sequence &gt; Pair &gt; High Card</p>
            <p>4. When the types are the same, compare the largest of the 3 cards.</p>
            <p>5. When the numbers are the same, compare the order of colour and size.</p>
            <p>6. Spades &gt; Hearts &gt; Plums &gt; Diamonds</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }.rotate-y-180 { transform: rotateY(180deg); }.preserve-3d { transform-style: preserve-3d; }.backface-hidden { backface-visibility: hidden; }`}</style>
   </motion.div>
  );
}

