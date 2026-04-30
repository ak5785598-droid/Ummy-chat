'use client';

import { useState, useEffect, useMemo } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { GoldCoinIcon, UmmyLogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const CHIPS = [
 { value: 10000, label: '10k', color: 'bg-[#00E5FF] border-[#00E5FF]/50 shadow-[#00E5FF]/40' },
 { value: 100000, label: '100k', color: 'bg-[#2196F3] border-[#2196F3]/50 shadow-[#2196F3]/40' },
 { value: 300000, label: '300k', color: 'bg-[#9C27B0] border-[#9C27B0]/50 shadow-[#9C27B0]/40' },
 { value: 1000000, label: '1000k', color: 'bg-[#F44336] border-[#F44336]/50 shadow-[#F44336]/40' },
 { value: 2000000, label: '2000k', color: 'bg-[#795548] border-[#795548]/50 shadow-[#795548]/40' },
 { value: 5000000, label: '5000k', color: 'bg-[#FFD700] border-[#FFD700]/50 shadow-[#FFD700]/40' },
];

// Realistic Deck for Cards 
const DECK = [
  'A♠', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', '10♠', 'J♠', 'Q♠', 'K♠',
  'A♥', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥', '8♥', '9♥', '10♥', 'J♥', 'Q♥', 'K♥',
  'A♦', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '8♦', '9♦', '10♦', 'J♦', 'Q♦', 'K♦',
  'A♣', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣', '8♣', '9♣', '10♣', 'J♣', 'Q♣', 'K♣'
];

// --- 3D BANNERS WITH DRAGONS INSIDE ---

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
      
      {/* Black Dragon Defs */}
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
    
    {/* PURANA KALA DRAGON INSIDE BANNER */}
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
      
      {/* Green Dragon Defs */}
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
    
    {/* NAYA GREEN 3D GLOSSY DRAGON INSIDE BANNER */}
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
      
      {/* Blue Pink Dragon Defs */}
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
    
    {/* NAYA BLUE PINK 3D GLOSSY DRAGON INSIDE BANNER */}
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
a
const FACTIONS = [
 { id: 'WOLF', label: 'Wolf', Banner: WolfBanner },
 { id: 'LION', label: 'Lion', Banner: LionBanner },
 { id: 'FISH', label: 'Fish', Banner: FishBanner },
];

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
  const [selectedChip, setSelectedChip] = useState(10000);
  const [myBets, setMyBets] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [totalPots, setTotalPots] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [history, setHistory] = useState<string[]>(['WOLF', 'LION', 'FISH', 'WOLF', 'LION']);
  const [isMuted, setIsMuted] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(true);
  const [cardReveal, setCardReveal] = useState<Record<string, string[]>>({});
  
  // Naya state sequence flip logic ke liye 
  const [revealedCardsCount, setRevealedCardsCount] = useState<number>(0);

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

  const startReveal = async () => {
   setGameState('reveal');
   setRevealedCardsCount(0); // Reset flips before sequence

   const newCards: Record<string, string[]> = {};
   FACTIONS.forEach(f => { 
       newCards[f.id] = [
           DECK[Math.floor(Math.random() * DECK.length)], 
           DECK[Math.floor(Math.random() * DECK.length)], 
           DECK[Math.floor(Math.random() * DECK.length)]
       ]; 
   });
   setCardReveal(newCards);

   // 1 By 1 Card flip logic - Sequence
   let currentFlip = 0;
   const flipInterval = setInterval(() => {
       currentFlip++;
       setRevealedCardsCount(currentFlip);
       if(currentFlip >= 9) clearInterval(flipInterval);
   }, 250); // Har card palatne ke beech 250ms ka gap

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

   // 3500ms wait taaki sb cards ache se reveal ho jaye
   setTimeout(() => { finalizeRound(winId); }, 3500);
  };

  const finalizeRound = (winId: string) => {
   setWinnerId(winId); 
   setHistory(prev => [winId,...prev.slice(0, 10)]); 
   setGameState('result');
   setRevealedCardsCount(9); // Ensure sab flips done hai

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
       setRevealedCardsCount(0); // Flip back to start state
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
  };

  return (
   <motion.div
     drag
     dragControls={dragControls}
     dragListener={false}
     dragMomentum={false}
     initial={isOverlay? { y: '10%' } : {}}
     className={cn(
       // UI Change 5: Game height fixed strictly to 50VH
       "h-[50vh] min-h-[50vh] max-h-[50vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#a22bb8] text-white select-none rounded-none border border-white/20 shadow-2xl transition-all duration-300"
     )}
   >
    {/* SMALL HEADER - Choti Size ki */}
    <header className="relative z-50 flex items-center justify-between p-2 pt-3 px-3">
      <div className="flex items-center gap-1.5">
        <button onPointerDown={(e) => dragControls.start(e)} className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-white/80 active:scale-90">
          <Move className="h-4 w-4" />
        </button>
        <div className="h-6 pl-1 pr-1 py-1 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-1.5 shadow-inner group">
          <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg">
            <GoldCoinIcon className="h-3 w-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white tracking-tight px-1">
            {(userProfile?.wallet?.coins || 0).toLocaleString()}
          </span>
          <button className="w-5 h-5 rounded-full bg-[#34d399] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <Plus className="h-2 w-2 stroke-[3px]" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg active:scale-90">
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

     {/* COUNTDOWN 3D GLOSSY BANNER - IMAGE JAISA */}
    <div className="relative z-40 flex justify-center -mt-1 px-4 pointer-events-none">
      <div className="relative w-[80%] max-w-[300px]">
        <svg viewBox="0 0 360 90" className="w-full h-[54px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]" xmlns="http://www.w3.org/2000/svg">
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
          <path d="M18 30 C18 12 32 6 50 6 H310 C328 6 342 12 342 30 V36 C342 18 328 12 310 12 H50 C32 12 18 18 18 36 Z" fill="url(#cd-shine)"/>
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
          <span className="text-white text-[22px] font-bold tracking-wide" style={{textShadow:'0 2px 3px rgba(0,0,0,0.85), 0 0 10px rgba(255,255,255,0.25)'}}>
            Countdown {timeLeft}s
          </span>
        </div>
      </div>
    </div>


    <main className="flex-1 flex flex-col pt-1 overflow-hidden relative z-10">
      {/* CARD GRID - Card & Grid Size Increased */}
      <div className="grid grid-cols-3 gap-2 px-4 h-20 shrink-0">
       {FACTIONS.map((f, factionIndex) => (
        <div key={f.id} className="flex flex-col items-center gap-1.5">
          <div className={cn(
            "w-full h-16 border-2 transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden bg-black/20 backdrop-blur-sm shadow-inner",
            "rounded-none",
            winnerId === f.id? "border-[#ffd700] bg-[#ffd700]/10 shadow-2xl" : "border-white/5"
          )}>
           <div className="flex gap-[2px] scale-100">
             {[0, 1, 2].map((i) => {
               // Global index to flip them one by one sequentially
               const globalCardIndex = factionIndex * 3 + i;
               const isFlipped = gameState !== 'betting' && revealedCardsCount > globalCardIndex;
               
               const cardText = cardReveal[f.id]?.[i] || '?';
               const isRedCard = cardText.includes('♥') || cardText.includes('♦');

               return (
                <div key={i} className={cn("w-8 h-12 rounded border border-white/10 transition-transform duration-300 transform-gpu preserve-3d flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-black", isFlipped ? "rotate-y-180" : "")}>
                 
                 {/* CARD FRONT - Real cards jaise number & icons */}
                 <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded">
                   <span className={cn("text-[14px] font-bold leading-none tracking-tighter", isRedCard ? "text-[#ef4444]" : "text-black")}>
                     {cardText}
                   </span>
                 </div>
                 
                 {/* CARD BACK */}
                 <div 
                   className="absolute inset-0 backface-hidden rounded border border-white/40 flex items-center justify-center shadow-inner" 
                   style={{ 
                     backgroundColor: '#dc2626', 
                     backgroundImage: 'radial-gradient(white 15%, transparent 16%), radial-gradient(white 15%, transparent 16%)', 
                     backgroundSize: '6px 6px', 
                     backgroundPosition: '0 0, 3px 3px' 
                   }}
                 >
                   <div className="bg-[#dc2626] rounded-full p-[1px] border border-white/40 shadow-sm">
                     <UmmyLogoIcon className="h-[8px] w-[8px] text-white" />
                   </div>
                 </div>

                </div>
               );
             })}
           </div>
          </div>
        </div>
       ))}
      </div>

      {/* BANNER SECTION WITH EXACT IMAGE TABLES */}
      <div className="flex justify-around items-end px-3 flex-1 pb-3 mt-1">
       {FACTIONS.map((f) => {
        const Icon = f.Banner;
        return (
         <div key={f.id} className="flex flex-col items-center w-[30%] max-w-[110px]">
           <div className={cn("relative transition-all duration-300", gameState!== 'betting' && "opacity-60")}>
             {/* Banner size increased to h-24 */}
             <Icon className="w-full h-24 drop-shadow-2xl" />
           </div>
           
           {/* UI Change 1: Table height increased, text fixed at bottom & shrinks on bet */}
           <button 
             onClick={() => handlePlaceBet(f.id)} 
             disabled={gameState !== 'betting'}
             className={cn(
               "w-full bg-[#481c1c] rounded-xl h-[48px] flex flex-col items-center justify-end pb-1.5 mt-1 transition-all duration-300 cursor-pointer shadow-lg",
               gameState === 'betting' ? "active:scale-95 hover:brightness-110" : "opacity-80 cursor-not-allowed"
             )}
           >
             <span className={cn("font-bold text-white tracking-wide leading-tight transition-all", (myBets[f.id] || 0) > 0 ? "text-[10px]" : "text-[12px]")}>
               Pot: {(totalPots[f.id] || 0)}
             </span>
             <span className={cn("font-bold text-[#ffd700] tracking-wide leading-tight mt-[1px] transition-all", (myBets[f.id] || 0) > 0 ? "text-[11px]" : "text-[13px]")}>
               You: {(myBets[f.id] || 0)}
             </span>
           </button>

         </div>
        )
       })}
      </div>
    </main>

    {/* HISTORY BAR */}
    <div className="w-full bg-black/30 backdrop-blur-md border-y border-white/10 py-1 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-50 shrink-0">
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

    {/* FOOTER CHIPS */}
    <footer className="p-2 py-3 bg-gradient-to-t from-black/60 to-transparent shrink-0 relative z-50">
      <div className="w-full flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
         {CHIPS.map(chip => (
          <button key={chip.value} onClick={() => setSelectedChip(chip.value)} className={cn("h-8 w-8 rounded-full flex flex-col items-center justify-center transition-all border-2 border-white/10 shrink-0 shadow-xl relative group overflow-hidden", chip.color, selectedChip === chip.value? "scale-110 border-white ring-2 ring-white/20 z-10" : "opacity-70 grayscale-[0.2]")}>
           <span className="text-[6px] font-bold text-white uppercase">{chip.label}</span>
          </button>
         ))}
      </div>
    </footer>

    <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }.rotate-y-180 { transform: rotateY(180deg); }.preserve-3d { transform-style: preserve-3d; }.backface-hidden { backface-visibility: hidden; }`}</style>
   </motion.div>
  );
}
