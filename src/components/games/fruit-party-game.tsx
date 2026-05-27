'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, collection, setDoc, getDocs, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { X, Clock, Volume2, VolumeX, HelpCircle, Move } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- STRICT 6-DIGIT UNIQUE ID GENERATOR (No Repeating Digits) ---
const generateUnique6DigitId = () => {
  let digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let id = '';
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * digits.length);
    id += digits[randomIndex];
    digits.splice(randomIndex, 1);
  }
  return id;
};

// --- NUMBER FORMATTING ---
const formatKandM = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

// --- 3D GLOSSY GOLD COIN ---
const DollarCoin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="glossyGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff3a1" />
        <stop offset="30%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="80%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="innerGloss" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffebb5" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
      </linearGradient>
      <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="16" cy="16" r="15" fill="url(#glossyGold)" stroke="#92400e" strokeWidth="1" filter="url(#coinShadow)" />
    <circle cx="16" cy="16" r="13" fill="url(#innerGloss)" />
    <circle cx="16" cy="16" r="11" fill="none" stroke="#fffbeb" strokeWidth="0.8" opacity="0.6" />
    <text x="16" y="21.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#78350f" fontFamily="Arial" style={{ textShadow: '0px 1px 1px rgba(255,255,255,0.5)' }}>$</text>
  </svg>
);

// --- CAFE ICON WITH 3D COFFEE CUP AND COUNTDOWN ---
const CafeShopIcon = ({ size = 150, countdown = 0, className = "" }: { size?: number; countdown?: number; className?: string }) => {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 24px 32px rgba(0,0,0,0.15))',
      }}
    >
      <style>{`
        @keyframes steamRise {
          0% { transform: translateY(4px) scale(0.96); opacity: 0; }
          15% { opacity: 0.9; }
          70% { opacity: 0.85; }
          100% { transform: translateY(-18px) scale(1.04); opacity: 0; }
        }
        .steam-path {
          animation: steamRise 2.2s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .s1 { animation-delay: 0s; }
        .s2 { animation-delay: 0.4s; }
        .s3 { animation-delay: 0.8s; }
      `}</style>
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="magenta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4da6" />
            <stop offset="52%" stopColor="#e91e8c" />
            <stop offset="100%" stopColor="#d31678" />
          </linearGradient>
          <linearGradient id="signTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="35%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff8d6" />
            <stop offset="100%" stopColor="#f9eab1" />
          </linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d0863f" />
            <stop offset="100%" stopColor="#b76e2d" />
          </linearGradient>
          <linearGradient id="woodDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a65a23" />
            <stop offset="100%" stopColor="#5a2e15" />
          </linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffdf7a" />
            <stop offset="100%" stopColor="#f5b833" />
          </linearGradient>
          <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1e1e" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e57a3d" />
            <stop offset="100%" stopColor="#b5521f" />
          </linearGradient>
          <radialGradient id="leaf" cx="0.35" cy="0.25" r="0.8">
            <stop offset="0%" stopColor="#1dd3b0" />
            <stop offset="55%" stopColor="#00b89c" />
            <stop offset="100%" stopColor="#00957e" />
          </radialGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9d7aff" />
            <stop offset="50%" stopColor="#6b6cf5" />
            <stop offset="100%" stopColor="#3d5ef2" />
          </linearGradient>
          <linearGradient id="saucerTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5dc"/>
            <stop offset="20%" stopColor="#fff5dc"/>
            <stop offset="100%" stopColor="#e8d4a8"/>
          </linearGradient>
          <linearGradient id="saucerSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8d0a1"/>
            <stop offset="100%" stopColor="#a67c48"/>
          </linearGradient>
          <linearGradient id="saucerInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5e4bd"/>
            <stop offset="100%" stopColor="#ddc08c"/>
          </linearGradient>
          <linearGradient id="cupBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fffaf0"/>
            <stop offset="18%" stopColor="#fffaf0"/>
            <stop offset="55%" stopColor="#fbf0d9"/>
            <stop offset="100%" stopColor="#f0e0b8"/>
          </linearGradient>
          <linearGradient id="cupShade" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#c9a87a"/>
            <stop offset="100%" stopColor="#f0e0b8" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f0e0b8"/>
            <stop offset="40%" stopColor="#fffaf0"/>
            <stop offset="100%" stopColor="#d8c096"/>
          </linearGradient>
          <radialGradient id="coffeeGrad" cx="0.5" cy="0.3" r="0.75">
            <stop offset="0%" stopColor="#6b2f15"/>
            <stop offset="55%" stopColor="#4a1f0f"/>
            <stop offset="100%" stopColor="#2b0e05"/>
          </radialGradient>
          <linearGradient id="coffeeRimLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a05e33" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#6b2f15" stopOpacity="0"/>
          </linearGradient>
          <filter id="bigShadow" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity="0.2" />
          </filter>
          <filter id="soft" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.22" />
          </filter>
          <filter id="cupShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <ellipse cx="256" cy="484" rx="172" ry="20" fill="#000" opacity="0.12" />

        <g filter="url(#bigShadow)">
          <rect x="28" y="402" width="456" height="86" rx="24" fill="url(#wood)" />
          <rect x="28" y="402" width="456" height="86" rx="24" stroke="#5a2e15" strokeWidth="4" fill="none" opacity="0.8" />
          <rect x="36" y="410" width="440" height="32" rx="16" fill="#fff" opacity="0.08" />
          <rect x="36" y="466" width="440" height="18" rx="9" fill="url(#gold)" />
          <rect x="36" y="466" width="440" height="9" fill="#fff" opacity="0.25" />
          <text x="256" y="459" fontFamily="'Nunito Black','Poppins','Arial Black',sans-serif" fontSize="30" fontWeight="900" fill="#5a2e15" textAnchor="middle" letterSpacing="0.3">Select Food</text>

          <rect x="60" y="128" width="392" height="28" rx="12" fill="url(#woodDark)" />
          <rect x="60" y="128" width="392" height="14" rx="12" fill="url(#gold)" />
          <rect x="68" y="152" width="376" height="268" rx="18" fill="url(#woodDark)" />
          <rect x="76" y="160" width="360" height="252" rx="14" fill="url(#wood)" />
          <rect x="88" y="172" width="336" height="228" rx="10" fill="url(#cream)" />
          <rect x="88" y="172" width="336" height="48" fill="#fff" opacity="0.15" />

          <rect x="216" y="180" width="80" height="54" rx="6" fill="#5a2e15" />
          <path d="M224 226 V200 A32 32 0 0 1 288 200 V226 Z" fill="#442009" />
          <path d="M227 224 V202 A29 29 0 0 1 285 202 V224 Z" fill="url(#glass)" />
          <path d="M226 215 Q256 198 286 215" fill="none" stroke="#5a2e15" strokeOpacity="0.5" strokeWidth="3" />
          <rect x="254" y="175" width="4" height="49" fill="#5a2e15" />
          <ellipse cx="256" cy="202" rx="26" ry="8" fill="#fff" opacity="0.18" />

          <rect x="100" y="250" width="312" height="136" rx="16" fill="#5a2e15" />
          <rect x="108" y="258" width="296" height="120" rx="12" fill="url(#window)" />
          <rect x="108" y="258" width="296" height="22" rx="12" fill="#fff" opacity="0.07" />
          <text x="256" y="345" fontFamily="'Montserrat Black','Inter','Arial Black',sans-serif" fontSize="100" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-3">{countdown}</text>

          <g filter="url(#soft)">
            <path d="M86 200 H426 V240 Q402 272 378 240 Q354 272 330 240 Q306 272 282 240 Q258 272 234 240 Q210 272 186 240 Q162 272 138 240 Q114 272 90 240 Z" fill="#e91e8c" />
            <path d="M86 200 H134 V240 Q114 272 90 240 V200" fill="#ff4da6" />
            <path d="M182 200 H230 V240 Q210 272 186 240 V200" fill="#ff4da6" />
            <path d="M278 200 H326 V240 Q306 272 282 240 V200" fill="#ff4da6" />
            <path d="M374 200 H422 V240 Q402 272 378 240 V200" fill="#ff4da6" />
            <rect x="84" y="192" width="344" height="16" rx="8" fill="#c1106a" />
            <rect x="86" y="194" width="340" height="8" rx="4" fill="#fff" opacity="0.18" />
            <path d="M90 240 Q114 262 138 240 M186 240 Q210 262 234 240 M282 240 Q306 262 330 240 M378 240 Q402 262 426 240" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" />
          </g>

          <g transform="translate(94,322)">
            <ellipse cx="38" cy="78" rx="26" ry="7" fill="#000" opacity="0.14" />
            <path d="M14 56 H62 L56 84 H20 Z" fill="url(#pot)" stroke="#7e3314" strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="12" y="50" width="52" height="10" rx="4" fill="#d4682e" />
            <rect x="14" y="52" width="48" height="4" fill="#fff" opacity="0.2" />
            <rect x="32" y="32" width="12" height="20" rx="3" fill="#8b4a1d" />
            <g fill="url(#leaf)">
              <circle cx="22" cy="24" r="20" />
              <circle cx="46" cy="20" r="19" />
              <circle cx="34" cy="6" r="22" />
              <circle cx="14" cy="12" r="13" opacity="0.9" />
            </g>
            <ellipse cx="28" cy="2" rx="9" ry="5" fill="#fff" opacity="0.28" />
          </g>

          <g transform="translate(338,322)">
            <ellipse cx="38" cy="78" rx="26" ry="7" fill="#000" opacity="0.14" />
            <path d="M14 56 H62 L56 84 H20 Z" fill="url(#pot)" stroke="#7e3314" strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="12" y="50" width="52" height="10" rx="4" fill="#d4682e" />
            <rect x="14" y="52" width="48" height="4" fill="#fff" opacity="0.2" />
            <rect x="32" y="32" width="12" height="20" rx="3" fill="#8b4a1d" />
            <g fill="url(#leaf)">
              <circle cx="22" cy="24" r="20" />
              <circle cx="46" cy="20" r="19" />
              <circle cx="34" cy="6" r="22" />
              <circle cx="14" cy="12" r="13" opacity="0.9" />
            </g>
            <ellipse cx="28" cy="2" rx="9" ry="5" fill="#fff" opacity="0.28" />
          </g>

          <g filter="url(#soft)">
            <rect x="76" y="34" width="360" height="112" rx="28" fill="#b21268" />
            <rect x="76" y="34" width="360" height="112" rx="28" fill="url(#magenta)" />
            <rect x="76" y="34" width="360" height="112" rx="28" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" fill="none" />
            <rect x="76" y="34" width="360" height="46" rx="28" fill="url(#signTop)" />

            <g transform="translate(112, 66) scale(0.2)">
              <ellipse cx="140" cy="192" rx="121" ry="30" fill="#7a542f" opacity="0.7" filter="url(#cupShadow)"/>
              <ellipse cx="140" cy="188" rx="123" ry="32" fill="url(#saucerSide)" />
              <ellipse cx="140" cy="174" rx="125" ry="36" fill="url(#saucerTop)" stroke="#fff7e0" strokeWidth="1.5"/>
              <ellipse cx="140" cy="176" rx="106" ry="27.5" fill="url(#saucerInner)"/>
              <ellipse cx="140" cy="172" rx="95" ry="22" fill="#fff9e8" opacity="0.3"/>
              <ellipse cx="140" cy="162" rx="110" ry="24" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2"/>

              <path d="M203 132.5 C231 126 253 144 248.5 170.5 C244 193 224.5 203.5 198 188 L207 178.5 C221 186.5 231.5 180 233.5 166.5 C235.5 152 222 140 207.5 144.5 L203 132.5 Z" fill="url(#handleGrad)" stroke="#d0b481" strokeWidth="1.3"/>
              <path d="M207 138 C220 136 229 143 228 156" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round"/>

              <path d="M66 124 C59 138 61 168 75 186.5 C79.5 192.5 107 196 135 196.5 C163 196 190.5 192.5 195 186.5 C209 168 211 138 204 124 C202 133 181 139 135 141 C89 139 68 133 66 124 Z" fill="url(#cupBody)" stroke="#f3e0b6" strokeWidth="1.2"/>
              <path d="M178 128 C197 135 206 152 203 174 C199 186 188 193 171 195.5 C184 190 195 177 196 159 C197 144 189 132 178 128 Z" fill="url(#cupShade)" opacity="0.85"/>

              <ellipse cx="86" cy="155" rx="13" ry="31" fill="#ffffff" opacity="0.22" filter="url(#cupShadow)"/>
              <path d="M70 132 C68 145 69 165 78 180" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" filter="url(#cupShadow)"/>

              <ellipse cx="135" cy="123.5" rx="69" ry="20.5" fill="#fffbf0" stroke="#e9d4a6" strokeWidth="1.2"/>
              <ellipse cx="135" cy="123.5" rx="69" ry="20.5" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1"/>
              <ellipse cx="135" cy="128" rx="60" ry="17" fill="#000" opacity="0.07"/>
              <path d="M69 123.5 A66 19 0 0 0 201 123.5 A58 15.5 0 0 1 77 123.5 A58 15.5 0 0 1 201 123.5" fill="#c9a87a" opacity="0.25"/>
              <ellipse cx="135" cy="126.5" rx="58.5" ry="15.8" fill="url(#coffeeGrad)"/>
              <ellipse cx="129" cy="121" rx="32" ry="6.5" fill="#894c28" opacity="0.4" filter="url(#cupShadow)"/>
              <ellipse cx="135" cy="120" rx="46" ry="10" fill="none" stroke="url(#coffeeRimLight)" strokeWidth="3" opacity="0.8"/>
              <ellipse cx="135" cy="126.5" rx="58.5" ry="15.8" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5"/>

              <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
                <path className="steam-path s1" d="M110 90 C106 80 118 72 113 62 C108 52 120 44 115 34" strokeWidth="13" strokeOpacity="0.92"/>
                <path className="steam-path s2" d="M140 84 C134 70 150 60 143 46 C136 32 152 22 145 8" strokeWidth="14" strokeOpacity="0.96"/>
                <path className="steam-path s3" d="M170 90 C166 80 178 72 173 62 C168 52 180 44 175 34" strokeWidth="13" strokeOpacity="0.92"/>
              </g>
              <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                <path className="steam-path s1" d="M110 90 C106 80 118 72 113 62 C108 52 120 44 115 34" strokeWidth="5"/>
                <path className="steam-path s2" d="M140 84 C134 70 150 60 143 46 C136 32 152 22 145 8" strokeWidth="5.5"/>
                <path className="steam-path s3" d="M170 90 C166 80 178 72 173 62 C168 52 180 44 175 34" strokeWidth="5"/>
              </g>
            </g>

            <text x="256" y="106" fontFamily="'Poppins','Fredoka One','Nunito','Arial Rounded MT Bold',sans-serif" fontSize="48" fontWeight="900" fill="#fff" letterSpacing="-1.5" textAnchor="middle">Café</text>
            <path d="M218 118 Q236 132 260 124 Q242 130 222 122 Q216 120 218 118 Z" fill="#fff" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// --- SMALL GLASS DOME ---
function GlassDomeSmall({ size = 72 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="glassBodySmall2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4fdff" stopOpacity="0.03" />
          <stop offset="52%" stopColor="#d7eff2" stopOpacity="0.09" />
          <stop offset="82%" stopColor="#a9d9e0" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7bc5cd" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id="glassRimSmall2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="18%" stopColor="#d8f2f5" stopOpacity="0.6" />
          <stop offset="65%" stopColor="#8cbdc3" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#5a9ca2" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="leftHLSmall2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="22%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="knobSmall2" cx="0.32" cy="0.27" r="0.7">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="15%" stopColor="#eaf8fa" stopOpacity="0.96" />
          <stop offset="45%" stopColor="#c1e5ea" stopOpacity="0.88" />
          <stop offset="82%" stopColor="#8ab6bc" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#5e8f95" stopOpacity="1" />
        </radialGradient>
        <linearGradient id="neckSmall2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6e9fa4" stopOpacity="0.9" />
          <stop offset="28%" stopColor="#e0f4f6" stopOpacity="0.98" />
          <stop offset="72%" stopColor="#e0f4f6" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#6e9fa4" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="baseSideSmall2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#40a6ad" />
          <stop offset="100%" stopColor="#2A7F84" />
        </linearGradient>
        <radialGradient id="baseTopSmall2" cx="0.5" cy="0.3" r="0.78">
          <stop offset="0%" stopColor="#73d3d9" />
          <stop offset="100%" stopColor="#5AC0C5" />
        </radialGradient>
        <filter id="b2s2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id="b4s2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" /></filter>
        <filter id="b8s2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="b12s2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>

      {/* BASE */}
      <ellipse cx="256" cy="410" rx="154" ry="25" fill="#0b2f33" opacity="0.18" filter="url(#b8s2)" />
      <g>
        <path d="M96 340a160 32 0 0 0 320 0v26a160 32 0 0 1-320 0z" fill="url(#baseSideSmall2)" />
        <ellipse cx="256" cy="340" rx="160" ry="32" fill="url(#baseTopSmall2)" />
        <ellipse cx="256" cy="340" rx="160" ry="32" fill="none" stroke="#185a5f" strokeOpacity="0.18" strokeWidth="2" />
        <ellipse cx="222" cy="326" rx="108" ry="17" fill="#ffffff" opacity="0.14" filter="url(#b8s2)" />
      </g>
      <ellipse cx="256" cy="335" rx="127" ry="21" fill="#0e4349" opacity="0.07" filter="url(#b4s2)" />
      <ellipse cx="256" cy="324" rx="129" ry="27" fill="#5AC0C5" opacity="0.07" filter="url(#b12s2)" />

      {/* LID */}
      <g>
        <path d="M118 333c0-61 13-121 44-173 30-50 68-76 94-80 26 4 64 30 94 80 31 52 44 112 44 173 0 4-5 8-19 10.5-31 5.5-86 8.5-119 8.5s-88-3-119-8.5c-14-2.5-19-6.5-19-10.5z" fill="url(#glassBodySmall2)" stroke="#e9f8fa" strokeOpacity="0.38" strokeWidth="1.6" />
        <path d="M310 142c27 36 47 86 55 155 1 17 1 31l-35 1.5s0-13-1-28c-5-63-22-110-45-142-8-11-16-20-24-27 16 0 33 3 49 9.5z" fill="#0f5258" opacity="0.055" filter="url(#b4s2)" />
        <path d="M158 316c2-50 12-107 37-159 6-12 13-23 21-33" fill="none" stroke="#143e43" opacity="0.05" strokeWidth="26" filter="url(#b8s2)" />

        <g>
          <path d="M112 332c0 13 32 24 144 24s144-11 144-24v10c0 14-35 26-144 26s-144-12-144-26z" fill="url(#glassRimSmall2)" opacity="0.95" />
          <ellipse cx="256" cy="332" rx="142.5" ry="11.8" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2.4" />
          <ellipse cx="256" cy="332" rx="138" ry="6.5" fill="#e6f9fb" opacity="0.55" filter="url(#b2s2)" />
        </g>

        <path d="M242 96c0-6 2-12.5 4.2-17.5h19.6c2.2 5 4.2 11.5 4.2 17.5v5.5h-28z" fill="url(#neckSmall2)" />
        <rect x="242" y="91" width="28" height="3" fill="#4a7f84" opacity="0.15" />

        <g>
          <circle cx="256" cy="57.5" r="22.5" fill="url(#knobSmall2)" stroke="#ccecf0" strokeOpacity="0.45" strokeWidth="1" />
          <ellipse cx="247.2" cy="47.5" rx="8.8" ry="6.2" fill="#ffffff" opacity="0.95" filter="url(#b2s2)" />
          <ellipse cx="264.8" cy="66.2" rx="4.2" ry="2.9" fill="#ffffff" opacity="0.48" filter="url(#b2s2)" />
          <ellipse cx="256" cy="57.5" rx="22" ry="22" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
        </g>

        <g>
          <path d="M129 310c2-57 14-117 43.5-172.5 20-37 48-61 74-71" fill="none" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" opacity="0.26" filter="url(#b4s2)" />
          <path d="M131 307c2-55 14-113 42.5-168 19.5-35 46-57.5 70.5-66" fill="none" stroke="url(#leftHLSmall2)" strokeWidth="13.5" strokeLinecap="round" opacity="0.92" />
          <path d="M134 305c2-53 13.5-110 41.5-164 19-33 44-54 67-62.5" fill="none" stroke="#ffffff" strokeWidth="4.8" strokeLinecap="round" opacity="0.99" />
        </g>

        <path d="M360 158c22 38 31.5 87 34.5 148.5" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.13" filter="url(#b4s2)" />
        <path d="M150 318c0-43 8-94 24-138" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.18" />
        <ellipse cx="270" cy="101" rx="16.5" ry="7.2" fill="#ffffff" opacity="0.19" transform="rotate(-19 270 101)" filter="url(#b4s2)" />
        <path d="M142 333c18-3.2 58-6.5 114-6.5s96 3.3 114 6.5" fill="none" stroke="#aee1e6" strokeOpacity="0.32" strokeWidth="3" filter="url(#b2s2)" />
      </g>
    </svg>
  );
}

// --- FRUIT DOME COMPONENT ---
function FruitDome({ emoji, multiplier, betAmount, isHighlighted, isSelected, isSpinning, onClick }: any) {
  const brightnessClass = isSpinning
    ? isHighlighted ? 'brightness-100 opacity-100' : 'brightness-50 opacity-60'
    : 'brightness-100 opacity-100';

  return (
    <motion.div
      className={`cursor-pointer transition-all duration-300 ${brightnessClass}`}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative w-[88px] h-[88px]">
          <div className="absolute inset-0 z-20 pointer-events-none">
            <GlassDomeSmall size={88} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-10 pb-[10px]">
            <span className="text-4xl drop-shadow-lg relative">{emoji}</span>
          </div>
        </div>
        <div
          className={`-mt-2.5 relative z-30 w-[60px] h-[18px] rounded-full flex items-center justify-between px-2 text-white text-[10px] font-bold border border-white/20 shadow-md transition-colors duration-200 ${
            isSelected ? 'bg-red-600' : 'bg-gradient-to-r from-purple-700 to-purple-500'
          }`}
        >
          <span className="text-[9px]">×{multiplier}</span>
          <div className="flex items-center gap-0.5">
            <DollarCoin className="w-2.5 h-2.5" />
            <span className="text-[9px]">{betAmount > 0 ? formatKandM(betAmount) : '0'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- SOUND EFFECTS ---
const SOUNDS = {
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  SPIN_START: 'https://assets.mixkit.co/active_storage/sfx/2009/2009-preview.mp3',
};

const ITEMS = [
  { id: 'broccoli', icon: '🥐', multiplier: 10 },
  { id: 'lettuce', icon: '🍔', multiplier: 15 },
  { id: 'carrot', icon: '🍦', multiplier: 25 },
  { id: 'corn', icon: '🍿', multiplier: 45 },
  { id: 'tomato', icon: '🍪', multiplier: 5 },
  { id: 'coconut', icon: '🍮', multiplier: 5 },
  { id: 'grapes', icon: '🥩', multiplier: 5 },
  { id: 'orange', icon: '🍟', multiplier: 5 },
];

const CHIPS = [
  { value: 100, label: '100' },
  { value: 1000, label: '1K' },
  { value: 100000, label: '100K' },
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
];

// --- HELPER COMPONENTS ---
const CountUpDisplay = ({ amount, duration = 900 }: { amount: number, duration?: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const start = 0;
    const t0 = performance.now();
    let rafId: number;

    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const currentVal = Math.round(start + (amount - start) * eased);
      if (node) node.textContent = formatKandM(currentVal);
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [amount, duration]);

  return <span ref={nodeRef} style={{ willChange: 'contents' }}>{formatKandM(0)}</span>;
};

const CoinIcon2 = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32">
    <defs>
      <linearGradient id="coinGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff9c4" />
        <stop offset="28%" stopColor="#ffd54f" />
        <stop offset="68%" stopColor="#f9a825" />
        <stop offset="100%" stopColor="#e65100" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="15" fill="url(#coinGold)" stroke="#b26a00" strokeWidth="1" />
    <circle cx="16" cy="16" r="12" fill="none" stroke="#ffecb3" strokeWidth="1" opacity=".55" />
    <text x="16" y="21.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#8a4a00" fontFamily="Arial">$</text>
  </svg>
);

const Confetti = ({ show }: { show: boolean }) => {
  const pieces = useMemo(() => Array.from({ length: 26 }).map((_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    background: `hsl(${38 + Math.random() * 30}, 100%, ${62 + Math.random() * 18}%)`,
    delay: `${Math.random() * 0.2}s`,
    rotate: `${Math.random() * 360}deg`
  })), []);

  if (!show) return null;
  return (
    <div className="confetti pointer-events-none" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
      {pieces.map((p) => (
        <i key={p.id} style={{ left: p.left, background: p.background, animationDelay: p.delay, transform: `rotate(${p.rotate})`, willChange: 'transform, opacity' }} />
      ))}
    </div>
  );
};

const Crown = ({ rank }: { rank: 1 | 2 | 3 }) => {
   const colors = {
    1: ['#fbbf24', '#b45309'],
    2: ['#e2e8f0', '#475569'],
    3: ['#d97706', '#78350f']
  }[rank];

  return (
    <svg viewBox="0 0 64 64" className="w-full h-full absolute inset-0 drop-shadow-md z-10" style={{ transform: 'translateY(-15px)' }}>
      <path d="M12 44 L16 20 L32 32 L48 20 L52 44 Z" fill={colors[0]} stroke={colors[1]} strokeWidth="2" strokeLinejoin="round"/>
      <ellipse cx="32" cy="44" rx="20" ry="4" fill={colors[0]} stroke={colors[1]} strokeWidth="2"/>
      <circle cx="16" cy="16" r="4" fill={colors[0]} stroke={colors[1]} strokeWidth="1.5"/>
      <circle cx="32" cy="28" r="4" fill={colors[0]} stroke={colors[1]} strokeWidth="1.5"/>
      <circle cx="48" cy="16" r="4" fill={colors[0]} stroke={colors[1]} strokeWidth="1.5"/>
      <text x="32" y="46" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Arial">{rank}</text>
    </svg>
  );
};

export const WinnerPopup = ({ winnerData, winnersList, activeWinnerIdx, setActiveWinnerIdx }: any) => {
  return (
    <>
      <AnimatePresence>
        {winnerData && (
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[210] flex justify-center pb-4 px-2"
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          >
              <div className="winning-card" style={{ transform: 'translateZ(0)' }}>
                  <Confetti show={true} />
                  
                  {/* Top Section: Your Win */}
                  <div className="tw-top">
                    <div className="tw-emoji-box flex items-center justify-center" onClick={() => navigator.vibrate?.(10)}>
                        {winnerData.bet === 0 ? (
                            <span className="text-[60px] filter drop-shadow-md">😴</span>
                        ) : (
                            <span className="text-[70px] filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                               {winnerData.emoji}
                            </span>
                        )}
                    </div>
                    
                    <div className="tw-stats">
                      <div className="tw-stat-row">
                        <span className="tw-stat-label">Your Prize:</span>
                        <CoinIcon2 className="tw-coin-icon" />
                        <span className="tw-stat-value"><CountUpDisplay amount={winnerData.win} /></span>
                      </div>
                      <div className="tw-stat-row">
                        <span className="tw-stat-label">Your Bet:</span>
                        <CoinIcon2 className="tw-coin-icon" />
                        <span className="tw-stat-value"><CountUpDisplay amount={winnerData.bet} /></span>
                      </div>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="tw-divider">
                    <div className="tw-divider-line tw-left"></div>
                    <div className="tw-divider-text">Top Winner</div>
                    <div className="tw-divider-line tw-right"></div>
                  </div>

                  {/* Leaderboard: Rank 2, 1, 3 Order */}
                  <div className="tw-winners">
                    {[
                      { rank: 2, data: winnersList[1], idx: 1 },
                      { rank: 1, data: winnersList[0], idx: 0 },
                      { rank: 3, data: winnersList[2], idx: 2 }
                    ].map((p) => (
                      <div
                        key={`rank-${p.rank}`}
                        className={`tw-player tw-rank-${p.rank} ${activeWinnerIdx === p.idx ? 'tw-active' : ''}`}
                        onClick={() => {
                          setActiveWinnerIdx(p.idx);
                          if(p.rank === 1) navigator.vibrate?.(30);
                        }}
                        style={{ opacity: 1, transform: 'translateZ(0)', willChange: 'transform' }}
                      >
                        <div className="tw-ring-container relative flex items-center justify-center">
                          {p.rank === 1 && <>
                            <div className="tw-sparkle tw-s1"></div>
                            <div className="tw-sparkle tw-s2"></div>
                            <div className="tw-sparkle tw-s3"></div>
                          </>}
                          
                          <div className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full overflow-hidden bg-slate-800 z-0 border border-white/10 shadow-inner flex items-center justify-center">
                            {p.data?.avatar ? (
                                <img src={p.data.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[20px] text-white/50">😴</span>
                            )}
                          </div>

                          <div className="relative z-10 w-full h-full" style={{ transform: 'translateZ(0)' }}>
                            <Crown rank={p.rank as 1|2|3} />
                          </div>
                        </div>
                        <div className="tw-player-name">{p.data ? p.data.name : 'Waiting...'}</div>
                        <div className="tw-player-prize">
                          <CoinIcon2 className="tw-coin-icon" />
                          <span><CountUpDisplay amount={p.data ? p.data.win : 0} duration={1100 + p.idx * 150} /></span>
                        </div>
                        <div className="tw-player-bet">Bet: {p.data ? formatKandM(p.data.bet || 0) : 0}</div>
                      </div>
                    ))}
                  </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .winning-card {
          height: 40vh; min-height: 320px; max-height: 420px; width: 100%; max-width: 100%;
          background: linear-gradient(180deg, rgba(28,22,34,.95) 0%, rgba(12,10,14,.98) 58%, #050507 100%);
          border: 1px solid rgba(232,200,120,.18); border-radius: 28px 28px 12px 12px;
          padding: clamp(12px,2vh,18px) clamp(14px,3vw,22px);
          display: flex; flex-direction: column; justify-content: space-between; position: relative;
          overflow: hidden; box-shadow: 0 0 0 1px rgba(255,255,255,.05) inset, 0 -15px 40px rgba(0,0,0,0.8), 0 -5px 15px rgba(0,0,0,0.6);
          isolation: isolate;
        }
        .winning-card::before { content: ""; position: absolute; inset: 0; background: radial-gradient(400px 120px at 50% 0%, rgba(232,200,120,.14), transparent 70%), radial-gradient(300px 200px at 80% 120%, rgba(255,180,60,.08), transparent 60%); pointer-events: none; z-index: 0; }
        
        .tw-top { display: flex; align-items: center; gap: 3.2vw; height: 35%; position: relative; z-index: 2; transform: translateZ(0); }
        .tw-emoji-box { width: 25%; min-width: 75px; aspect-ratio: 1; position: relative; flex-shrink: 0; cursor: pointer; transition: transform .3s; }
        .tw-emoji-box:active { transform: scale(.96); }
        
        .tw-stats { flex: 1; display: flex; flex-direction: column; gap: 1.1vh; justify-content: center; }
        .tw-stat-row { display: flex; align-items: center; gap: .6rem; background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.09); padding: .4rem .6rem; border-radius: 12px; font-size: clamp(12px, 2vh, 14px); font-weight: 650; box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 8px 18px rgba(0,0,0,.4); transition: transform .2s, border-color .2s; }
        .tw-stat-label { color: #f0eadd; min-width: 88px; }
        .tw-coin-icon { width: 2.2vh; height: 2.2vh; min-width: 16px; min-height: 16px; flex-shrink: 0; }
        .tw-stat-value { color: #fff; }
        
        .tw-divider { height: 17%; display: flex; align-items: center; justify-content: center; position: relative; margin: 0 0 .4vh 0; z-index: 2; transform: translateY(-12px); }
        .tw-divider-line { position: absolute; width: 29%; height: 2px; top: 50%; background: linear-gradient(90deg, transparent, #e8c878, transparent); }
        .tw-divider-line.tw-left { left: 0; transform: scaleX(-1); }
        .tw-divider-line.tw-right { right: 0; }
        .tw-divider-text { color: #e8c878; font-size: clamp(14px,2.4vh,18px); font-weight: 800; text-transform: uppercase; text-shadow: 0 1px 2px #000; padding: .15rem .7rem; background: radial-gradient(50% 120% at 50% 50%, rgba(232,200,120,.15), transparent 70%); border-radius: 8px; }
        
        .tw-winners { display: flex; justify-content: space-between; align-items: flex-end; height: 48%; gap: 2vw; position: relative; z-index: 2; }
        .tw-player { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; transition: transform .35s; }
        .tw-player.tw-rank-1 { transform: translateY(-1.1vh); }
        .tw-player.tw-rank-3 { transform: translateY(.45vh); }
        
        .tw-ring-container { width: 86%; max-width: 110px; aspect-ratio: 1; position: relative; transition: filter .3s; }
        .tw-player-name { font-size: clamp(11px,1.8vh,14px); font-weight: 650; margin-top: .7vh; color: #f5f3ef; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; max-width: 118px; }
        .tw-player-prize { display: flex; align-items: center; justify-content: center; gap: .35rem; margin-top: .4vh; font-size: clamp(12px,1.85vh,15px); font-weight: 700; color: #ffd166; }
        .tw-player-bet { font-size: clamp(9px,1.3vh,11px); color: #b9b9c2; margin-top: .2vh; font-weight: 500; }
        
        .confetti { position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: hidden; border-radius: 28px; }
        .confetti i { position: absolute; width: 6px; height: 10px; border-radius: 2px; opacity: 0; top: 38%; animation: conf 900ms cubic-bezier(.2,.7,.3,1) forwards; }
        @keyframes conf { 0%{opacity:1; transform:translateY(0) rotate(0) scale(1)} 100%{opacity:0; transform:translateY(90px) rotate(520deg) scale(.8)} }
      `}</style>
    </>
  );
};

// --- MAIN COMPONENT ---
export default function CarnivalFoodParty({ onClose, isOverlay, roomId }: { onClose?: () => void; isOverlay?: boolean; roomId?: string }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const dragControls = useDragControls();

  const roundDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', `fruit-party-round_${roomId || 'global'}`), [firestore, roomId || 'global']);
  const { data: roundData } = useDoc(roundDocRef);

  const [currentRoundId, setCurrentRoundId] = useState(() => generateUnique6DigitId());
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [spinTimeLeft, setSpinTimeLeft] = useState(0);
  const [selectedChip, setSelectedChip] = useState(1000);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [highlightIdxs, setHighlightIdxs] = useState<number[]>([]);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [isCoinsLoaded, setIsCoinsLoaded] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [history, setHistory] = useState<typeof ITEMS[0][]>([]);
  
  // States for Winner popup Leaderboard
  const [winnersList, setWinnersList] = useState<any[]>([]);
  const [activeWinnerIdx, setActiveWinnerIdx] = useState(0);

  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const movingIndexRef = useRef<number>(0);

  const playSound = (url: string, vol = 0.5) => {
    if (!isSoundOn) return;
    const audio = new Audio(url);
    audio.volume = vol;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (userProfile?.wallet?.coins !== undefined && !isCoinsLoaded) {
      setLocalCoins(userProfile.wallet.coins);
      setIsCoinsLoaded(true);
    }
  }, [userProfile, isCoinsLoaded]);

  // Init round doc on mount
  useEffect(() => {
    if (!firestore || !roundDocRef) return;
    getDoc(roundDocRef).then(snap => {
      if (!snap.exists()) {
        setDoc(roundDocRef, {
          status: 'betting',
          roundStartTime: Date.now(),
          roundId: generateUnique6DigitId(),
          createdAt: serverTimestamp()
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [firestore, roundDocRef]);

  // Betting timer — driven by round doc's roundStartTime
  useEffect(() => {
    if (gameState !== 'betting') return;
    if (!roundData?.roundStartTime) {
      // Fallback: local timer
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { startSpin(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    // Synced timer
    const BET_DUR = 30000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - roundData.roundStartTime;
      const remaining = Math.max(0, BET_DUR - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) { startSpin(); }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, roundData?.roundStartTime]);

  // --- GLOBAL BET SYNC LOGIC ---
  const handlePlaceBet = async (id: string) => {
    if (gameState !== 'betting' || !currentUser) return;
    if (localCoins < selectedChip) return;
    
    // Deduct locally
    setLocalCoins(prev => prev - selectedChip);
    
    // Deduct globally (atomic transaction)
    const userRef = doc(firestore, 'users', currentUser.uid);
    const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    try {
      await runTransaction(firestore as any, async (tx: any) => {
        tx.update(userRef, { 'wallet.coins': increment(-selectedChip) });
        tx.update(profileRef, { 'wallet.coins': increment(-selectedChip) });
      });
    } catch (e) {
      console.log('Bet deduction tx failed', e);
    }
    
    const newBetAmount = (myBets[id] || 0) + selectedChip;
    setMyBets(prev => ({ ...prev, [id]: newBetAmount }));

    // Send this bet to the Global Round Collection taaki Leaderboard ban sake
    try {
      const globalBetRef = doc(firestore, 'game_carnival', 'global_rounds', 'bets', `${currentRoundId}_${currentUser.uid}`);
      await setDoc(globalBetRef, {
        uid: currentUser.uid,
        name: currentUser.displayName || "Unknown Player",
        avatar: currentUser.photoURL || null,
        bets: {
           ...myBets,
           [id]: newBetAmount
        },
        roundId: currentRoundId,
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.log("Error syncing global bet", error);
    }
  };

  const startSpin = async () => {
    setGameState('spinning');
    playSound(SOUNDS.SPIN_START, 0.8);
    setSpinTimeLeft(10);

    // Determine winner: first writer via Firestore, else local
    let winningItemId: string;
    if (firestore && roundDocRef) {
      try {
        winningItemId = await runTransaction(firestore as any, async (tx: any) => {
          const snap = await tx.get(roundDocRef);
          if (snap.exists() && snap.data().winningItemId) {
            return snap.data().winningItemId as string;
          }
          const bytes = new Uint8Array(1);
          crypto.getRandomValues(bytes);
          const id = ITEMS[bytes[0] % ITEMS.length].id;
          tx.set(roundDocRef, {
            status: 'spinning',
            winningItemId: id,
          }, { merge: true });
          return id;
        });
      } catch {
        winningItemId = ITEMS[Math.floor(Math.random() * ITEMS.length)].id;
      }
    } else {
      const bytes = new Uint8Array(1);
      crypto.getRandomValues(bytes);
      winningItemId = ITEMS[bytes[0] % ITEMS.length].id;
    }

    const winningIdx = ITEMS.findIndex(item => item.id === winningItemId);
    const totalCycles = 2;
    const totalSteps = totalCycles * ITEMS.length + winningIdx;
    let step = 0;

    movingIndexRef.current = 0;
    setHighlightIdxs([0]);

    moveIntervalRef.current = setInterval(() => {
      const displayIdx = step % ITEMS.length;
      movingIndexRef.current = displayIdx;
      setHighlightIdxs([displayIdx]);
      playSound(SOUNDS.TICK, 0.3);
      step++;

      if (step >= totalSteps) {
        if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        finalizeResult(ITEMS[winningIdx]);
      }
    }, 500);

    countdownIntervalRef.current = setInterval(() => {
      setSpinTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
  };

  const finalizeResult = async (winningItem: typeof ITEMS[0]) => {
    const betOnItem = myBets[winningItem.id] || 0;
    const totalWinAmount = betOnItem * winningItem.multiplier;
    
    if (totalWinAmount > 0 && currentUser) {
      playSound(SOUNDS.WIN, 0.6);
      setLocalCoins(prev => prev + totalWinAmount);
      try {
        const userRef = doc(firestore, 'users', currentUser.uid);
        const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
        await runTransaction(firestore as any, async (tx: any) => {
          tx.update(userRef, { 'wallet.coins': increment(totalWinAmount) });
          tx.update(profileRef, { 'wallet.coins': increment(totalWinAmount) });
        });
      } catch (e) {
        console.log('Win credit tx failed', e);
      }
    }
    
    setWinnerData({ emoji: winningItem.icon, win: totalWinAmount, bet: betOnItem });

    // Update round doc status to result
    if (firestore && roundDocRef) {
      setDoc(roundDocRef, {
        status: 'result',
        winningItemId: winningItem.id,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }

    // --- FETCH GLOBAL TOP WINNERS FROM FIREBASE ---
    try {
      const betsCollection = collection(firestore, 'game_carnival', 'global_rounds', 'bets');
      const snapshot = await getDocs(betsCollection);
      
      let playersList: any[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.roundId === currentRoundId) {
            const userBetOnWin = data.bets[winningItem.id] || 0;
            const userWinAmount = userBetOnWin * winningItem.multiplier;
            
            // Push har us player ko jisne participate kiya is round me
            playersList.push({
                name: data.name,
                avatar: data.avatar,
                win: userWinAmount,
                bet: userBetOnWin, 
                uid: data.uid
            });
        }
      });

      // Agar data na mile toh apna current state fallback daal do
      if (playersList.length === 0 && currentUser) {
          playersList.push({ name: currentUser.displayName || "You", avatar: currentUser.photoURL || null, win: totalWinAmount, bet: betOnItem });
      }

      // Sort by highest Win (Jisne sabse zada bet lagakar jeeta ho)
      playersList.sort((a, b) => b.win - a.win);

      // Top 3 nikal lo
      const top3 = playersList.slice(0, 3);
      
      // Empty spaces null se fill kardo card UI maintain rakhne ke liye
      while(top3.length < 3) {
          top3.push(null);
      }

      setWinnersList(top3);
    } catch (error) {
      console.log("Leaderboard Fetch Error", error);
      // Fallback
      setWinnersList([
        { name: currentUser?.displayName || "You", avatar: currentUser?.photoURL || null, win: totalWinAmount, bet: betOnItem },
        null, null
      ]);
    }

    setActiveWinnerIdx(0);
    setHistory(prev => [winningItem, ...prev].slice(0, 5));
    setGameState('result');
    setShowWinnerPopup(true);

    // Resetting for Next Round
    setTimeout(() => {
      setShowWinnerPopup(false);
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      const nextId = generateUnique6DigitId();
      setCurrentRoundId(nextId);
      setTimeout(() => setWinnerData(null), 1000); 
      setHighlightIdxs([]);

      // Start next round in Firestore doc
      if (firestore && roundDocRef) {
        setDoc(roundDocRef, {
          status: 'betting',
          winningItemId: null,
          roundStartTime: Date.now(),
          roundId: nextId,
        }, { merge: true }).catch(() => {});
      }
    }, 6000);
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 100) {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <motion.div 
        variants={{
          initial: { opacity: 0, scale: 0.9, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
          exit: { opacity: 0, y: "100%", transition: { duration: 0.3 } }
        }}
        initial="initial"
        animate="animate"
        exit="exit"
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="h-[66vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#0f2b5e] text-white rounded-none shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: 'radial-gradient(circle at center, #1e40af 0%, #0f172a 100%)' }}
      >
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full z-30" />

        {/* Top bar */}
        <div className="w-full flex justify-between p-4 z-20">
          <div className="flex items-center gap-2">
            <button 
              onPointerDown={(e) => dragControls.start(e)} 
              className="w-8 h-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors"
            >
              <Move className="w-4 h-4 text-blue-400" />
            </button>
            <div className="relative flex items-center bg-[#1e293b] border border-white/10 rounded-full h-8 min-w-[100px] pl-8 pr-3 text-xs font-bold shadow-inner">
              <div className="absolute -left-1"><DollarCoin className="w-7 h-7" /></div>
              {localCoins.toLocaleString()}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button className="w-8 h-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors">
              <Clock className="w-4 h-4" />
            </button>
            <button onClick={() => setIsSoundOn(!isSoundOn)} className="w-8 h-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors">
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button className="w-8 h-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center hover:bg-[#2d3a4e] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game area */}
        <div className="relative w-full flex-1 flex items-center justify-center" style={{ minHeight: '340px' }}>
          
          {/* Central cafe icon */}
          <div 
            className="absolute z-0 opacity-90"
            style={{
              width: '150px',
              height: '150px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CafeShopIcon 
              size={150} 
              countdown={gameState === 'spinning' ? spinTimeLeft : timeLeft}
              className="w-full h-full drop-shadow-2xl"
            />
          </div>

          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90; 
            const radius = 130; 
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const isHighlighted = highlightIdxs.includes(idx);
            const isSelected = (myBets[item.id] || 0) > 0;
            
            return (
              <div
                key={item.id}
                className="absolute z-10"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <FruitDome
                  emoji={item.icon}
                  multiplier={item.multiplier}
                  betAmount={myBets[item.id] || 0}
                  isHighlighted={isHighlighted}
                  isSelected={isSelected}
                  isSpinning={gameState === 'spinning'}
                  onClick={() => handlePlaceBet(item.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Chips Bar */}
        <div className="px-4 pb-2 z-20 -mt-5">
          <div className="bg-gradient-to-r from-purple-800/90 to-purple-600/90 rounded-2xl p-1.5 border border-white/10">
            <div className="text-white text-[9px] font-bold mb-1 text-center tracking-wide">SELECT A CHIP & YOUR FOOD</div>
            <div className="flex justify-center gap-2">
              {CHIPS.map((chip) => (
                <motion.button
                  key={chip.value}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedChip(chip.value)}
                  className={`flex flex-col items-center justify-center w-[42px] h-[42px] rounded-md border-2 transition-all duration-200 ${
                    selectedChip === chip.value 
                      ? 'bg-red-600 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)] scale-105' 
                      : 'bg-blue-600/80 border-blue-400/40 hover:bg-blue-500/80'
                  }`}
                >
                  <DollarCoin className="w-3.5 h-3.5 mb-0.5" />
                  <span className="text-white text-[9px] font-extrabold">{chip.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Result History Bar */}
        <div className="px-4 pb-4 z-20 -mt-1">
          <div className="bg-gradient-to-r from-purple-900/80 to-purple-700/80 rounded-lg border border-white/10 py-1 px-2">
            <div className="flex items-center gap-2">
              <span className="text-white text-[9px] font-bold tracking-wider whitespace-nowrap">Result</span>
              <div className="flex gap-1 overflow-hidden">
                {history.length > 0 ? (
                  history.map((item, i) => (
                    <div key={i} className="w-6 h-6 bg-black/30 rounded flex items-center justify-center text-sm border border-white/10">
                      {item.icon}
                    </div>
                  ))
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center text-white/30 text-[10px]">-</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- WINNER POPUP --- */}
        <WinnerPopup 
          winnerData={showWinnerPopup ? winnerData : null} 
          winnersList={winnersList} 
          activeWinnerIdx={activeWinnerIdx} 
          setActiveWinnerIdx={setActiveWinnerIdx} 
        />
        
      </motion.div>
    </div>
  );
      }
