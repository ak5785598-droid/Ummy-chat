'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment } from 'firebase/firestore';
import { X, Clock, Volume2, VolumeX, HelpCircle, Move } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- NUMBER FORMATTING ---
const formatKandM = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
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
const CafeShopIcon = ({ size = 140, countdown = 0, className = "" }: { size?: number; countdown?: number; className?: string }) => {
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
          {/* Main gradients used in the cafe building */}
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
          
          {/* Gradients for the 3D coffee cup */}
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

            {/* Static small cup logo */}
            <g transform="translate(112, 66) scale(0.2)">
              <ellipse cx="140" cy="192" rx="121" ry="30" fill="#7a542f" opacity="0.7" filter="url(#cupShadow)"/>
              <ellipse cx="140" cy="188" rx="123" ry="32" fill="url(#saucerSide)" />
              <ellipse cx="140" cy="174" rx="125" ry="36" fill="url(#saucerTop)" stroke="#fff7e0" strokeWidth="1.5"/>
              <ellipse cx="140" cy="176" rx="106" ry="27.5" fill="url(#saucerInner)"/>
              <ellipse cx="140" cy="172" rx="95" ry="22" fill="#fff9e8" opacity="0.3"/>
              <ellipse cx="140" cy="162" rx="110" ry="24" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2"/>

              <path d="M203 132.5 C231 126 253 144 248.5 170.5 C244 193 224.5 203.5 198 188 L207 178.5 C221 186.5 231.5 180 233.5 166.5 C235.5 152 222 140 207.5 144.5 L203 132.5 Z" 
                fill="url(#handleGrad)" stroke="#d0b481" strokeWidth="1.3"/>
              <path d="M207 138 C220 136 229 143 228 156" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round"/>

              <path d="M66 124 C59 138 61 168 75 186.5 C79.5 192.5 107 196 135 196.5 C163 196 190.5 192.5 195 186.5 C209 168 211 138 204 124 C202 133 181 139 135 141 C89 139 68 133 66 124 Z"
                fill="url(#cupBody)" stroke="#f3e0b6" strokeWidth="1.2"/>
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

// --- SMALL GLASS DOME (unchanged) ---
function GlassDomeSmall({ size = 56 }: { size?: number }) {
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

      {/* Shadow */}
      <ellipse cx="256" cy="410" rx="154" ry="25" fill="#0b2f33" opacity="0.18" filter="url(#b8s2)" />

      {/* Base (blue plate) */}
      <g>
        <path d="M96 340a160 32 0 0 0 320 0v26a160 32 0 0 1-320 0z" fill="url(#baseSideSmall2)" />
        <ellipse cx="256" cy="340" rx="160" ry="32" fill="url(#baseTopSmall2)" />
        <ellipse cx="256" cy="340" rx="160" ry="32" fill="none" stroke="#185a5f" strokeOpacity="0.18" strokeWidth="2" />
        <ellipse cx="222" cy="326" rx="108" ry="17" fill="#ffffff" opacity="0.14" filter="url(#b8s2)" />
      </g>

      {/* Inner shadow */}
      <ellipse cx="256" cy="335" rx="127" ry="21" fill="#0e4349" opacity="0.07" filter="url(#b4s2)" />

      {/* Glass body */}
      <path d="M118 333c0-61 13-121 44-173 30-50 68-76 94-80 26 4 64 30 94 80 31 52 44 112 44 173 0 4-5 8-19 10.5-31 5.5-86 8.5-119 8.5s-88-3-119-8.5c-14-2.5-19-6.5-19-10.5z" fill="url(#glassBodySmall2)" stroke="#e9f8fa" strokeOpacity="0.38" strokeWidth="1.6" />

      {/* Dark accent */}
      <path d="M310 142c27 36 47 86 55 155 1 17 1 31l-35 1.5s0-13-1-28c-5-63-22-110-45-142-8-11-16-20-24-27 16 0 33 3 49 9.5z" fill="#0f5258" opacity="0.055" filter="url(#b4s2)" />

      <path d="M158 316c2-50 12-107 37-159 6-12 13-23 21-33" fill="none" stroke="#143e43" opacity="0.05" strokeWidth="26" filter="url(#b8s2)" />

      {/* Glass rim */}
      <g>
        <path d="M112 332c0 13 32 24 144 24s144-11 144-24v10c0 14-35 26-144 26s-144-12-144-26z" fill="url(#glassRimSmall2)" opacity="0.95" />
        <ellipse cx="256" cy="332" rx="142.5" ry="11.8" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2.4" />
        <ellipse cx="256" cy="332" rx="138" ry="6.5" fill="#e6f9fb" opacity="0.55" filter="url(#b2s2)" />
      </g>

      {/* Neck */}
      <path d="M242 96c0-6 2-12.5 4.2-17.5h19.6c2.2 5 4.2 11.5 4.2 17.5v5.5h-28z" fill="url(#neckSmall2)" />
      <rect x="242" y="91" width="28" height="3" fill="#4a7f84" opacity="0.15" />

      {/* Knob */}
      <g>
        <circle cx="256" cy="57.5" r="22.5" fill="url(#knobSmall2)" stroke="#ccecf0" strokeOpacity="0.45" strokeWidth="1" />
        <ellipse cx="247.2" cy="47.5" rx="8.8" ry="6.2" fill="#ffffff" opacity="0.95" filter="url(#b2s2)" />
        <ellipse cx="264.8" cy="66.2" rx="4.2" ry="2.9" fill="#ffffff" opacity="0.48" filter="url(#b2s2)" />
        <ellipse cx="256" cy="57.5" rx="22" ry="22" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
      </g>

      {/* Left highlight */}
      <g>
        <path d="M129 310c2-57 14-117 43.5-172.5 20-37 48-61 74-71" fill="none" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" opacity="0.26" filter="url(#b4s2)" />
        <path d="M131 307c2-55 14-113 42.5-168 19.5-35 46-57.5 70.5-66" fill="none" stroke="url(#leftHLSmall2)" strokeWidth="13.5" strokeLinecap="round" opacity="0.92" />
        <path d="M134 305c2-53 13.5-110 41.5-164 19-33 44-54 67-62.5" fill="none" stroke="#ffffff" strokeWidth="4.8" strokeLinecap="round" opacity="0.99" />
      </g>

      {/* Right reflection */}
      <path d="M360 158c22 38 31.5 87 34.5 148.5" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.13" filter="url(#b4s2)" />
      <path d="M150 318c0-43 8-94 24-138" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.18" />

      <ellipse cx="270" cy="101" rx="16.5" ry="7.2" fill="#ffffff" opacity="0.19" transform="rotate(-19 270 101)" filter="url(#b4s2)" />
      <ellipse cx="256" cy="324" rx="129" ry="27" fill="#5AC0C5" opacity="0.07" filter="url(#b12s2)" />
      <path d="M142 333c18-3.2 58-6.5 114-6.5s96 3.3 114 6.5" fill="none" stroke="#aee1e6" strokeOpacity="0.32" strokeWidth="3" filter="url(#b2s2)" />
    </svg>
  );
}

// --- FRUIT DOME COMPONENT (compact with red glow on click) ---
function FruitDome({
  emoji,
  multiplier,
  betAmount,
  isHighlighted,
  isSelected,
  onClick,
}: {
  emoji: string;
  multiplier: number;
  betAmount: number;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      className="cursor-pointer"
      animate={isHighlighted ? { scale: 1.15, filter: 'drop-shadow(0 0 12px #fbbf24)' } : { scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="relative flex flex-col items-center">
        {/* Glass dome */}
        <div className="relative w-[56px] h-[56px]">
          <GlassDomeSmall size={56} />
          <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '6px' }}>
            <span className="text-2xl drop-shadow-lg" style={{ lineHeight: 1 }}>{emoji}</span>
          </div>
        </div>
        {/* Purple strip - bet patti, chhoti aur red on select */}
        <div className={`mt-[-4px] w-[56px] h-[15px] rounded-full flex items-center justify-between px-2 text-white text-[9px] font-bold border border-white/20 shadow-md transition-colors duration-200 ${
          isSelected ? 'bg-red-600' : 'bg-gradient-to-r from-purple-700 to-purple-500'
        }`}>
          <span className="text-[9px]">×{multiplier}</span>
          <div className="flex items-center gap-0.5">
            <DollarCoin className="w-2.5 h-2.5" />
            <span>{betAmount > 0 ? formatKandM(betAmount) : '0'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const SOUNDS = {
  BET: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  WHIRRING: 'https://assets.mixkit.co/active_storage/sfx/731/731-preview.mp3',
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

export default function CarnivalFoodParty({ onClose }: { onClose?: () => void }) {
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const dragControls = useDragControls();

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
  const [lastWinningItem, setLastWinningItem] = useState<typeof ITEMS[0] | null>(null);

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

  useEffect(() => {
    if (gameState !== 'betting') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { startSpin(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || !currentUser) return;
    if (localCoins < selectedChip) return;
    playSound(SOUNDS.BET, 0.9);
    setLocalCoins(prev => prev - selectedChip);
    const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(-selectedChip) });
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const startSpin = () => {
    setGameState('spinning');
    setSpinTimeLeft(10);
    playSound(SOUNDS.WHIRRING, 1.0);
    movingIndexRef.current = 0;
    setHighlightIdxs([0]);
    moveIntervalRef.current = setInterval(() => {
      const nextIndex = (movingIndexRef.current + 1) % ITEMS.length;
      movingIndexRef.current = nextIndex;
      setHighlightIdxs([nextIndex]);
      playSound(SOUNDS.TICK, 0.3);
    }, 900);
    countdownIntervalRef.current = setInterval(() => {
      setSpinTimeLeft(prev => {
        if (prev <= 1) {
          if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          finalizeResult(ITEMS[movingIndexRef.current]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finalizeResult = (winningItem: typeof ITEMS[0]) => {
    const betOnItem = myBets[winningItem.id] || 0;
    const totalWinAmount = betOnItem * winningItem.multiplier;
    if (totalWinAmount > 0 && currentUser) {
      playSound(SOUNDS.WIN, 0.6);
      setLocalCoins(prev => prev + totalWinAmount);
      const userProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      updateDocumentNonBlocking(userProfileRef, { 'wallet.coins': increment(totalWinAmount) });
    }
    setWinnerData({ emoji: winningItem.icon, win: totalWinAmount, bet: betOnItem });
    setLastWinningItem(winningItem);
    setGameState('result');
    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(30);
      setMyBets({});
      setWinnerData(null);
      setHighlightIdxs([]);
    }, 5000);
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
        className="h-[50vh] w-full max-w-lg mx-auto flex flex-col relative overflow-hidden bg-[#020617] text-white rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }}
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

        {/* Game area with cafe and food items */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          {/* Central Cafe – size 120 */}
          <div className="absolute w-[120px] h-[120px] z-0 opacity-90">
            <CafeShopIcon 
              size={120} 
              countdown={gameState === 'spinning' ? spinTimeLeft : timeLeft}
              className="w-full h-full drop-shadow-2xl"
            />
          </div>

          {/* Fruit items placed around – radius 95 for compactness */}
          {ITEMS.map((item, idx) => {
            const angle = (idx * 45) - 90;
            const radius = 95;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const isHighlighted = highlightIdxs.includes(idx);
            const isSelected = (myBets[item.id] || 0) > 0;
            
            return (
              <div
                key={item.id}
                className="absolute z-10"
                style={{
                  left: `calc(50% + ${x}px - 28px)`,
                  top: `calc(50% + ${y}px - 28px)`,
                }}
              >
                <FruitDome
                  emoji={item.icon}
                  multiplier={item.multiplier}
                  betAmount={myBets[item.id] || 0}
                  isHighlighted={isHighlighted}
                  isSelected={isSelected}
                  onClick={() => handlePlaceBet(item.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Chips Bar */}
        <div className="px-4 z-20">
          <div className="bg-gradient-to-r from-purple-800/90 to-purple-600/90 rounded-2xl p-2.5 border border-white/10">
            <div className="text-white text-[10px] font-bold mb-1.5 text-center tracking-wide">SELECT A CHIP & YOUR FOOD</div>
            <div className="flex justify-center gap-2">
              {CHIPS.map((chip) => (
                <motion.button
                  key={chip.value}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedChip(chip.value)}
                  className={`flex flex-col items-center justify-center w-[52px] h-[44px] rounded-xl border-2 transition-all duration-200 ${
                    selectedChip === chip.value 
                      ? 'bg-red-600 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)] scale-105' 
                      : 'bg-blue-600/80 border-blue-400/40 hover:bg-blue-500/80'
                  }`}
                >
                  <DollarCoin className="w-4 h-4 mb-0.5" />
                  <span className="text-white text-[10px] font-extrabold">{chip.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Strip */}
        <div className="px-4 pb-4 z-20 mt-1.5">
          <div className="bg-gradient-to-r from-purple-800/90 to-purple-600/90 rounded-full h-10 flex items-center justify-between px-4 border border-white/10">
            <span className="text-white text-[11px] font-bold tracking-wide">RESULT</span>
            <div className="flex items-center gap-1.5">
              {lastWinningItem ? (
                <>
                  <span className="text-lg">{lastWinningItem.icon}</span>
                  <span className="text-white text-[11px] font-bold">×{lastWinningItem.multiplier}</span>
                </>
              ) : (
                <span className="text-white/60 text-[10px]">Waiting...</span>
              )}
            </div>
          </div>
        </div>

        {/* Winner popup */}
        <AnimatePresence>
          {winnerData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center z-[50] bg-black/60 backdrop-blur-sm rounded-[40px]"
            >
              <div className="bg-gradient-to-b from-yellow-400 to-orange-600 p-6 rounded-[30px] text-center border-4 border-white shadow-[0_0_50px_rgba(251,191,36,0.5)]">
                <div className="text-5xl mb-1">{winnerData.emoji}</div>
                <div className="text-xl font-black text-white uppercase tracking-tighter">Winner!</div>
                <div className="flex items-center justify-center gap-2 text-3xl font-black text-white mt-1">
                  <DollarCoin className="w-8 h-8" />
                  {winnerData.win.toLocaleString()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
                }
