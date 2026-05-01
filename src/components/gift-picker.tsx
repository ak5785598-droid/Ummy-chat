'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader, Check, Zap } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, writeBatch, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEW PRINCESS PAGODA CASTLE SVG (Used for Icon & Animation) ---
const castleSvg = `
<svg class="castle" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wallPink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe8f7"/><stop offset="50%" stop-color="#ffb5e2"/><stop offset="100%" stop-color="#ff7ac1"/>
    </linearGradient>
    <linearGradient id="wallPinkDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f9bfe3"/><stop offset="100%" stop-color="#d659a8"/>
    </linearGradient>
    <linearGradient id="roofTeal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7d5eb6"/><stop offset="55%" stop-color="#4a2d7d"/><stop offset="100%" stop-color="#24124d"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff7d1"/><stop offset="30%" stop-color="#ffe08a"/><stop offset="65%" stop-color="#ffba3e"/><stop offset="100%" stop-color="#b87a1a"/>
    </linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e4d6f5"/><stop offset="100%" stop-color="#9c86c2"/>
    </linearGradient>
    <radialGradient id="pinkGlow" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#ff82c8" stop-opacity=".85"/><stop offset="100%" stop-color="#ff82c8" stop-opacity="0"/>
    </radialGradient>
    <filter id="goldGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <ellipse cx="400" cy="522" rx="305" ry="30" fill="url(#pinkGlow)" opacity=".55"/>
  <path d="M 62 545 L 738 545 L 760 565 L 40 565 Z" fill="#140a2a" opacity=".6"/>
  <path d="M 82 520 L 718 520 L 740 540 L 60 540 Z" fill="url(#stone)" stroke="#5a3f8a" stroke-width="2"/>

  <g>
    <rect x="150" y="330" width="140" height="185" rx="12" fill="url(#wallPink)" stroke="#d86aa9" stroke-width="3"/>
    <rect x="170" y="360" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="207" y="360" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="244" y="360" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="168" y="425" width="104" height="8" fill="#ffb0db" opacity=".3"/>
    <rect x="170" y="255" width="100" height="80" rx="9" fill="url(#wallPink)" stroke="#d86aa9" stroke-width="3"/>
    <path d="M130 335 Q220 296 310 335 L300 351 Q220 316 140 351 Z" fill="url(#roofTeal)" stroke="#1d0f3e" stroke-width="2"/>
    <path d="M122 330 C150 305 188 295 220 295 C252 295 290 305 318 330" fill="none" stroke="url(#gold)" stroke-width="9.5" stroke-linecap="round" filter="url(#goldGlow)"/>
    <circle cx="129" cy="332" r="5.5" fill="url(#gold)"/><circle cx="311" cy="332" r="5.5" fill="url(#gold)"/>
    <path d="M160 260 Q220 230 280 260 L272 273 Q220 247 168 273 Z" fill="url(#roofTeal)" stroke="#1d0f3e" stroke-width="2"/>
    <path d="M155 257 C180 236 200 230 220 230 C240 230 260 236 285 257" fill="none" stroke="url(#gold)" stroke-width="7.5" stroke-linecap="round" filter="url(#goldGlow)"/>
    <rect x="215" y="223" width="10" height="36" rx="3" fill="url(#gold)"/>
    <circle cx="220" cy="218" r="6.5" fill="#fff4cf" filter="url(#softGlow)"/>
  </g>

  <g>
    <rect x="510" y="330" width="140" height="185" rx="12" fill="url(#wallPink)" stroke="#d86aa9" stroke-width="3"/>
    <rect x="530" y="360" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="567" y="360" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="604" y="360" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="528" y="425" width="104" height="8" fill="#ffb0db" opacity=".3"/>
    <rect x="530" y="255" width="100" height="80" rx="9" fill="url(#wallPink)" stroke="#d86aa9" stroke-width="3"/>
    <path d="M490 335 Q580 296 670 335 L660 351 Q580 316 500 351 Z" fill="url(#roofTeal)" stroke="#1d0f3e" stroke-width="2"/>
    <path d="M482 330 C510 305 548 295 580 295 C612 295 650 305 678 330" fill="none" stroke="url(#gold)" stroke-width="9.5" stroke-linecap="round" filter="url(#goldGlow)"/>
    <circle cx="489" cy="332" r="5.5" fill="url(#gold)"/><circle cx="671" cy="332" r="5.5" fill="url(#gold)"/>
    <path d="M520 260 Q580 230 640 260 L632 273 Q580 247 528 273 Z" fill="url(#roofTeal)" stroke="#1d0f3e" stroke-width="2"/>
    <path d="M515 257 C540 236 560 230 580 230 C600 230 620 236 645 257" fill="none" stroke="url(#gold)" stroke-width="7.5" stroke-linecap="round" filter="url(#goldGlow)"/>
    <rect x="575" y="223" width="10" height="36" rx="3" fill="url(#gold)"/>
    <circle cx="580" cy="218" r="6.5" fill="#fff4cf" filter="url(#softGlow)"/>
  </g>

  <rect x="288" y="385" width="14" height="130" fill="url(#wallPinkDark)" stroke="#b85a96" stroke-width="2" rx="3"/>
  <rect x="498" y="385" width="14" height="130" fill="url(#wallPinkDark)" stroke="#b85a96" stroke-width="2" rx="3"/>
  <rect x="260" y="412" width="30" height="103" rx="6" fill="url(#wallPinkDark)" stroke="#b85a96" stroke-width="2"/>
  <rect x="510" y="412" width="30" height="103" rx="6" fill="url(#wallPinkDark)" stroke="#b85a96" stroke-width="2"/>

  <g>
    <rect x="300" y="270" width="200" height="245" rx="14" fill="url(#wallPink)" stroke="#d86aa9" stroke-width="3.5"/>
    <rect x="325" y="185" width="150" height="90" rx="10" fill="url(#wallPink)" stroke="#d86aa9" stroke-width="3"/>
    <rect x="350" y="115" width="100" height="75" rx="9" fill="url(#wallPink)" stroke="#d86aa9" stroke-width="3"/>
    
    <path d="M363 415 Q363 370 400 370 Q437 370 437 415 V485 H363 Z" fill="#3a0f38" stroke="url(#gold)" stroke-width="3"/>
    <path d="M375 485 V420 Q375 385 400 385 Q425 385 425 420 V485" fill="none" stroke="#5a1a52" stroke-width="1.5" opacity=".6"/>
    <circle cx="420" cy="448" r="3.2" fill="url(#gold)"/>
    
    <circle cx="400" cy="325" r="19" fill="#4a1643" stroke="url(#gold)" stroke-width="2.5"/>
    <circle cx="400" cy="325" r="13" fill="none" stroke="#7a2a6a" stroke-width="1" opacity=".6"/>
    <rect x="324" y="304" width="32" height="42" rx="16" fill="#4a1643" stroke="url(#gold)" stroke-width="2.2"/>
    <rect x="444" y="304" width="32" height="42" rx="16" fill="#4a1643" stroke="url(#gold)" stroke-width="2.2"/>
    <rect x="344" y="210" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="387" y="206" width="26" height="43" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <rect x="430" y="210" width="26" height="36" rx="13" fill="#4a1643" stroke="url(#gold)" stroke-width="2"/>
    <circle cx="400" cy="147" r="15" fill="#4a1643" stroke="url(#gold)" stroke-width="2.2"/>
    
    <path d="M268 276 Q400 224 532 276 L520 296 Q400 251 280 296 Z" fill="url(#roofTeal)" stroke="#1d0f3e" stroke-width="2.5"/>
    <path d="M258 270 C294 234 344 220 400 220 C456 220 506 234 542 270" fill="none" stroke="url(#gold)" stroke-width="12" stroke-linecap="round" filter="url(#goldGlow)"/>
    <circle cx="267" cy="273" r="7" fill="url(#gold)"/><circle cx="533" cy="273" r="7" fill="url(#gold)"/>
    
    <path d="M308 191 Q400 150 492 191 L482 208 Q400 173 318 208 Z" fill="url(#roofTeal)" stroke="#1d0f3e" stroke-width="2"/>
    <path d="M300 187 C333 158 368 150 400 150 C432 150 467 158 500 187" fill="none" stroke="url(#gold)" stroke-width="9.5" stroke-linecap="round" filter="url(#goldGlow)"/>
    <circle cx="308" cy="189" r="5.8" fill="url(#gold)"/><circle cx="492" cy="189" r="5.8" fill="url(#gold)"/>
    
    <path d="M334 121 Q400 86 466 121 L457 135 Q400 106 343 135 Z" fill="url(#roofTeal)" stroke="#1d0f3e" stroke-width="2"/>
    <path d="M327 117 C355 92 380 85 400 85 C420 85 445 92 473 117" fill="none" stroke="url(#gold)" stroke-width="8.5" stroke-linecap="round" filter="url(#goldGlow)"/>
    
    <rect x="392" y="52" width="16" height="46" rx="3" fill="url(#gold)" stroke="#8a5a1a" stroke-width="1"/>
    <path d="M364 60 Q400 26 436 60 L428 71 Q400 41 372 71 Z" fill="url(#roofTeal)" stroke="url(#gold)" stroke-width="3"/>
    <circle cx="400" cy="28" r="9" fill="#fff8d6" filter="url(#softGlow)"/>
    <path d="M396 28 L404 28 L402 14 L398 14 Z" fill="url(#gold)"/>
  </g>

  <path d="M180 510 Q200 500 220 510" fill="none" stroke="#ff8ac9" stroke-width="3" opacity=".7" stroke-linecap="round"/>
  <path d="M580 510 Q600 500 620 510" fill="none" stroke="#ff8ac9" stroke-width="3" opacity=".7" stroke-linecap="round"/>
</svg>
`;

// --- NEW FULL SCREEN CASTLE SCENE HTML CONTENT ---
// Playables SDK is completely removed. HTML logic merged directly.
const castleOverlayContent = `
  <div class="sky"></div>
  
  <div class="stars">
    <div class="star" style="left:8%;top:12%;animation-delay:0s"></div>
    <div class="star" style="left:15%;top:8%;animation-delay:.3s"></div>
    <div class="star" style="left:22%;top:18%;animation-delay:1.1s"></div>
    <div class="star" style="left:30%;top:5%;animation-delay:.7s"></div>
    <div class="star" style="left:37%;top:14%;animation-delay:2s"></div>
    <div class="star" style="left:44%;top:9%;animation-delay:1.5s"></div>
    <div class="star" style="left:52%;top:16%;animation-delay:.4s"></div>
    <div class="star" style="left:60%;top:7%;animation-delay:2.3s"></div>
    <div class="star" style="left:68%;top:20%;animation-delay:1.8s"></div>
    <div class="star" style="left:75%;top:11%;animation-delay:.9s"></div>
    <div class="star" style="left:83%;top:15%;animation-delay:2.6s"></div>
    <div class="star" style="left:90%;top:9%;animation-delay:1.2s"></div>
    <div class="star" style="left:5%;top:28%;animation-delay:.5s"></div>
    <div class="star" style="left:12%;top:35%;animation-delay:1.7s"></div>
    <div class="star" style="left:25%;top:32%;animation-delay:2.1s"></div>
    <div class="star" style="left:33%;top:40%;animation-delay:.2s"></div>
    <div class="star" style="left:41%;top:27%;animation-delay:1.4s"></div>
    <div class="star" style="left:48%;top:38%;animation-delay:2.8s"></div>
    <div class="star" style="left:56%;top:30%;animation-delay:.6s"></div>
    <div class="star" style="left:64%;top:36%;animation-delay:1.9s"></div>
    <div class="star" style="left:71%;top:26%;animation-delay:2.4s"></div>
    <div class="star" style="left:79%;top:33%;animation-delay:.8s"></div>
    <div class="star" style="left:87%;top:29%;animation-delay:1.6s"></div>
    <div class="star" style="left:93%;top:38%;animation-delay:2.2s"></div>
    <div class="star" style="left:18%;top:48%;animation-delay:.1s"></div>
    <div class="star" style="left:27%;top:52%;animation-delay:1.3s"></div>
    <div class="star" style="left:35%;top:46%;animation-delay:2.5s"></div>
    <div class="star" style="left:46%;top:51%;animation-delay:.7s"></div>
    <div class="star" style="left:54%;top:44%;animation-delay:1s"></div>
    <div class="star" style="left:62%;top:50%;animation-delay:2s"></div>
    <div class="star" style="left:70%;top:47%;animation-delay:.4s"></div>
    <div class="star" style="left:78%;top:54%;animation-delay:1.8s"></div>
    <div class="star" style="left:85%;top:49%;animation-delay:2.7s"></div>
    <div class="star" style="left:10%;top:60%;animation-delay:1.1s"></div>
    <div class="star" style="left:95%;top:58%;animation-delay:.3s"></div>
    <div class="star" style="left:40%;top:62%;animation-delay:2.9s"></div>
    <div class="star" style="left:58%;top:65%;animation-delay:1.5s"></div>
  </div>

  <div class="clouds">
    <div class="cloud c1"></div>
    <div class="cloud c2"></div>
    <div class="cloud c3"></div>
  </div>

  <div class="lanterns">
    <div class="lantern l1">
      <svg viewBox="0 0 40 68"><rect x="18.5" y="0" width="3" height="8" fill="#6b3a18" rx="1"/><rect x="12" y="7" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><rect x="8" y="12" width="24" height="26" rx="11" fill="#ff456e" stroke="#ffc2d1" stroke-width="1.2"/><line x1="20" y1="13" x2="20" y2="37" stroke="#ffd1dc" stroke-width=".7"/><rect x="12" y="38" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><path d="M20 43 C21 49 18 54 20 60" stroke="#ffb84d" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="20" cy="63" r="2.2" fill="#ffdf8a"/></svg>
    </div>
    <div class="lantern l2">
      <svg viewBox="0 0 40 68"><rect x="18.5" y="0" width="3" height="8" fill="#6b3a18" rx="1"/><rect x="12" y="7" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><rect x="8" y="12" width="24" height="26" rx="11" fill="#ff8a3d" stroke="#ffd5b5" stroke-width="1.2"/><line x1="20" y1="13" x2="20" y2="37" stroke="#ffe1c9" stroke-width=".7"/><rect x="12" y="38" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><path d="M20 43 C21 49 18 54 20 60" stroke="#ffb84d" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="20" cy="63" r="2.2" fill="#ffdf8a"/></svg>
    </div>
    <div class="lantern l3">
      <svg viewBox="0 0 40 68"><rect x="18.5" y="0" width="3" height="8" fill="#6b3a18" rx="1"/><rect x="12" y="7" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><rect x="8" y="12" width="24" height="26" rx="11" fill="#ff5faf" stroke="#ffc2e6" stroke-width="1.2"/><line x1="20" y1="13" x2="20" y2="37" stroke="#ffd1f0" stroke-width=".7"/><rect x="12" y="38" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><path d="M20 43 C21 49 18 54 20 60" stroke="#ffb84d" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="20" cy="63" r="2.2" fill="#ffdf8a"/></svg>
    </div>
    <div class="lantern l4">
      <svg viewBox="0 0 40 68"><rect x="18.5" y="0" width="3" height="8" fill="#6b3a18" rx="1"/><rect x="12" y="7" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><rect x="8" y="12" width="24" height="26" rx="11" fill="#ff6b81" stroke="#ffcbd3" stroke-width="1.2"/><line x1="20" y1="13" x2="20" y2="37" stroke="#ffe0e6" stroke-width=".7"/><rect x="12" y="38" width="16" height="5" rx="2" fill="#ffd37a" stroke="#b87a1a" stroke-width=".8"/><path d="M20 43 C21 49 18 54 20 60" stroke="#ffb84d" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="20" cy="63" r="2.2" fill="#ffdf8a"/></svg>
    </div>
  </div>

  <div class="ground-glow"></div>

  <div class="castle-container">
    <div class="castle-wrap">
      <div class="castle-glow"></div>
      ${castleSvg}
      <div class="sparkle-field">
        <span class="sp" style="left:18%;top:34%;animation-delay:0s"></span>
        <span class="sp" style="left:25%;top:21%;animation-delay:.4s"></span>
        <span class="sp" style="left:32%;top:28%;animation-delay:.8s"></span>
        <span class="sp" style="left:40%;top:16%;animation-delay:1.2s"></span>
        <span class="sp" style="left:48%;top:25%;animation-delay:1.6s"></span>
        <span class="sp" style="left:56%;top:19%;animation-delay:.2s"></span>
        <span class="sp" style="left:64%;top:31%;animation-delay:.6s"></span>
        <span class="sp" style="left:72%;top:23%;animation-delay:1s"></span>
        <span class="sp" style="left:80%;top:33%;animation-delay:1.4s"></span>
        <span class="sp" style="left:22%;top:56%;animation-delay:.3s"></span>
        <span class="sp" style="left:30%;top:63%;animation-delay:.7s"></span>
        <span class="sp" style="left:38%;top:59%;animation-delay:1.1s"></span>
        <span class="sp" style="left:46%;top:66%;animation-delay:1.5s"></span>
        <span class="sp" style="left:54%;top:61%;animation-delay:.5s"></span>
        <span class="sp" style="left:62%;top:68%;animation-delay:.9s"></span>
        <span class="sp" style="left:70%;top:62%;animation-delay:1.3s"></span>
        <span class="sp" style="left:15%;top:70%;animation-delay:.1s"></span>
        <span class="sp" style="left:85%;top:72%;animation-delay:.85s"></span>
        <span class="sp" style="left:28%;top:76%;animation-delay:1.7s"></span>
        <span class="sp" style="left:72%;top:78%;animation-delay:.65s"></span>
        <span class="sp" style="left:36%;top:42%;animation-delay:1.9s"></span>
        <span class="sp" style="left:64%;top:44%;animation-delay:.25s"></span>
        <span class="sp" style="left:48%;top:46%;animation-delay:1.45s"></span>
        <span class="sp" style="left:52%;top:39%;animation-delay:.95s"></span>
      </div>
    </div>
  </div>
`;

// --- FULL SCREEN CASTLE ANIMATION COMPONENT ---
function PrincessCastleOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none new-castle-scene-wrapper">
      <style>{`
        .new-castle-scene-wrapper { touch-action: none; user-select: none; }
        .new-castle-scene-wrapper .scene {
          position:relative;width:100vw;height:100vh;height:100dvh;overflow:hidden;
          perspective:1400px;perspective-origin:50% 35%;
          background: transparent;
        }
        .new-castle-scene-wrapper .sky {
          position:absolute;inset:0;
          background:linear-gradient(180deg, rgba(3,5,26,0.9) 0%, rgba(10,15,43,0.9) 12%, rgba(26,20,64,0.85) 28%, rgba(59,29,99,0.8) 48%, rgba(115,48,122,0.8) 68%, rgba(177,78,124,0.8) 84%, rgba(255,157,126,0.85) 100%);
        }
        .new-castle-scene-wrapper .sky::before {
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at 50% 115%,rgba(255,185,210,.55) 0%,rgba(255,130,170,.3) 28%,transparent 65%);
          mix-blend-mode:screen;
        }
        .new-castle-scene-wrapper .sky::after {
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at 50% -5%,rgba(160,190,255,.18) 0%,transparent 55%);
        }
        .new-castle-scene-wrapper .stars {position:absolute;inset:0;z-index:2}
        .new-castle-scene-wrapper .star {
          position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;
          box-shadow:0 0 6px 1px rgba(255,255,255,.85),0 0 14px 3px rgba(210,180,255,.45);
          animation:starTwinkle 5s ease-in-out infinite;
        }
        @keyframes starTwinkle{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1.35)}}

        .new-castle-scene-wrapper .clouds {position:absolute;inset:0;z-index:3;pointer-events:none}
        .new-castle-scene-wrapper .cloud {
          position:absolute;background:radial-gradient(ellipse at center,rgba(255,255,255,.24) 0%,rgba(255,210,235,.14) 40%,transparent 70%);
          border-radius:50%;filter:blur(26px);opacity:.58;
          animation:drift linear infinite;
        }
        .new-castle-scene-wrapper .c1 {top:14%;left:-50vw;width:46vw;height:120px;animation-duration:88s}
        .new-castle-scene-wrapper .c2 {top:30%;left:-60vw;width:58vw;height:150px;animation-duration:102s;animation-delay:-22s;opacity:.5}
        .new-castle-scene-wrapper .c3 {top:54%;left:-45vw;width:40vw;height:110px;animation-duration:94s;animation-delay:-46s;opacity:.45}
        @keyframes drift{to{transform:translateX(200vw)}}

        .new-castle-scene-wrapper .ground-glow {
          position:absolute;bottom:-20%;left:50%;transform:translateX(-50%);
          width:92vw;max-width:1200px;height:40vh;
          background:radial-gradient(ellipse,rgba(255,110,180,.38) 0%,rgba(180,70,140,.22) 35%,transparent 70%);
          filter:blur(32px);z-index:4;
        }

        .new-castle-scene-wrapper .lanterns {position:absolute;inset:0;z-index:9;pointer-events:none}
        .new-castle-scene-wrapper .lantern {
          position:absolute;width:44px;height:68px;
          filter:drop-shadow(0 0 16px rgba(255,90,130,.75)) drop-shadow(0 0 32px rgba(255,60,110,.35));
          animation:lanternFloat 5s ease-in-out infinite;
          transform-origin:50% 0;
        }
        .new-castle-scene-wrapper .l1 {left:7%;top:38%}
        .new-castle-scene-wrapper .l2 {right:9%;top:32%;animation-delay:.9s}
        .new-castle-scene-wrapper .l3 {left:19%;top:68%;animation-delay:1.7s;scale:.8}
        .new-castle-scene-wrapper .l4 {right:17%;top:71%;animation-delay:.4s;scale:.84}
        @keyframes lanternFloat{0%,100%{transform:translateY(0) rotate(-2.5deg)}50%{transform:translateY(-24px) rotate(3deg)}}
        .new-castle-scene-wrapper .l3,.new-castle-scene-wrapper .l4{animation-name:lanternFloat2}
        @keyframes lanternFloat2{0%,100%{transform:translateY(0) rotate(2deg)}50%{transform:translateY(-18px) rotate(-2deg)}}

        .new-castle-scene-wrapper .castle-container {
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:min(92vw,880px);height:min(75vh,640px);z-index:6;
        }
        .new-castle-scene-wrapper .castle-wrap {
          position:relative;width:100%;height:100%;
          transform-origin:50% 100%;
          animation:castleFloat 5s ease-in-out infinite;
          transform-style:preserve-3d;
        }
        @keyframes castleFloat{
          0%,100%{transform:translateY(0) rotateX(5deg)}
          50%{transform:translateY(-15px) rotateX(7.5deg)}
        }
        .new-castle-scene-wrapper .castle {
          width:100%;height:100%;display:block;
          filter:drop-shadow(0 22px 44px rgba(60,15,90,.55)) drop-shadow(0 0 60px rgba(255,120,190,.28));
        }
        .new-castle-scene-wrapper .castle-glow {
          position:absolute;bottom:6%;left:50%;transform:translateX(-50%);
          width:78%;height:24%;background:radial-gradient(ellipse,rgba(255,150,210,.52) 0%,transparent 68%);
          filter:blur(22px);z-index:-1;
        }

        .new-castle-scene-wrapper .sparkle-field {position:absolute;inset:0;z-index:12;pointer-events:none}
        .new-castle-scene-wrapper .sp {
          position:absolute;width:3px;height:3px;background:#fff;border-radius:50%;
          box-shadow:0 0 8px 2px #ff9ee5,0 0 16px 4px #ffd0f7,0 0 26px 7px rgba(255,150,220,.55);
          animation:sparkle 5s ease-in-out infinite;opacity:0;
        }
        @keyframes sparkle{
          0%,100%{opacity:0;transform:scale(.4)}
          8%{opacity:1;transform:scale(1.4)}
          18%{opacity:0;transform:scale(.5)}
          52%{opacity:0}
          60%{opacity:1;transform:scale(1.2)}
          70%{opacity:0;transform:scale(.3)}
        }

        @media (max-width:640px){
          .new-castle-scene-wrapper .castle-container{height:62vh;width:96vw;bottom:2vh}
          .new-castle-scene-wrapper .lantern{width:34px;height:54px}
          .new-castle-scene-wrapper .l1{left:4%;top:42%}.new-castle-scene-wrapper .l2{right:5%;top:38%}
          .new-castle-scene-wrapper .l3{left:11%;top:70%}.new-castle-scene-wrapper .l4{right:10%;top:73%}
          @keyframes castleFloat{0%,100%{transform:translateY(0) rotateX(5deg) scale(.97)}50%{transform:translateY(-10px) rotateX(7deg) scale(.99)}}
        }
      `}</style>
      <div className="scene" dangerouslySetInnerHTML={{ __html: castleOverlayContent }} />
    </div>
  );
}


// --- GOLDEN DOLLAR ICON COMPONENT ---
const GoldenDollar = () => (
  <div className="relative flex items-center justify-center">
    <div className="h-5 w-5 rounded-full bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 shadow-[0_0_8px_rgba(234,179,8,0.6)] border border-yellow-300/50 flex items-center justify-center">
      <span className="text- font-black text-black drop-shadow-sm">$</span>
    </div>
  </div>
);

// Fallback gifts if Firestore is empty (UPDATED PRICE TO 999999)
const FALLBACK_GIFTS: Record<string, any[]> = {
  'Hot': [
   { id: 'heart', name: 'Heart', price: 99, emoji: '❤️', animationId: 'heart_anim' },
   { id: 'rose', name: 'Rose', price: 10, emoji: '🌹', animationId: 'rose_anim' },
   ], 
  'Lucky': [
     { id: 'apple', name: 'Apple', price: 100, emoji: '🍎', animationId: 'apple_svga_3d', isLucky: true },
     ], 
  'Luxury': [
     { id: 'castle', name: 'Castle', price: 999999, animationId: 'princess_castle_anim' }, // Castle gift updated price & no emoji
     { id: 'dm', name: 'Guitar', price: 700000, emoji: '🎸', animationId: 'diamond' },
  ]
 };

const MULTIPLIERS = [1, 2, 5, 10, 50, 100, 499, 999];

const getTodayString = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
    return istDate.toISOString().split('T')[0];
};

export function GiftPicker({ open, onOpenChange, roomId, recipient: initialRecipient, participants = [] }: any) {
 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid);
 const firestore = useFirestore();

 const [selectedGift, setSelectedGift] = useState<any>(null);
 const [quantity, setQuantity] = useState('1');
 const [isSending, setIsSending] = useState(false);
 const [selectedUids, setSelectedUids] = useState<string[]>([]);
 
 const [showCombo, setShowCombo] = useState(false);
 const [comboCount, setComboCount] = useState(0);
 const [toasts, setToasts] = useState<any[]>([]); 
 
 const [winData, setWinData] = useState<{ show: boolean, multiplier: number } | null>(null);

 // Added state to handle the local Castle animation overlay
 const [playCastleAnim, setPlayCastleAnim] = useState(false);

 const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

 // --- DYNAMIC GIFTS FETCH ---
 const giftsQuery = useMemoFirebase(() => {
   if (!firestore) return null;
   return query(collection(firestore, "giftList"), orderBy("createdAt", "desc"));
 }, [firestore]);

 const { data: dbGifts, isLoading: isGiftsLoading } = useCollection(giftsQuery);

 const GIFTS = useMemo(() => {
   if (!dbGifts || dbGifts.length === 0) return FALLBACK_GIFTS;
   
   const groups: Record<string, any[]> = {
     'Hot': [],
     'Lucky': [],
     'Luxury': [],
     'Event': []
   };

   dbGifts.forEach((g: any) => {
     const cat = g.category || 'Hot';
     if (groups[cat]) {
       groups[cat].push({
         ...g,
         id: g.id || g.giftId // ensure we have an ID
       });
     } else {
       // Fallback for custom categories
       if (!groups['Event']) groups['Event'] = [];
       groups['Event'].push(g);
     }
   });

   return groups;
 }, [dbGifts]);

 const seatedParticipants = useMemo(() => {
  return participants.filter((p: any) => p.seatIndex > 0).sort((a: any, b: any) => a.seatIndex - b.seatIndex);
 }, [participants]);

 useEffect(() => {
  if (open) {
   if (initialRecipient) setSelectedUids([initialRecipient.uid]);
   else if (seatedParticipants.length > 0) setSelectedUids([seatedParticipants[0].uid]);
  }
 }, [open, initialRecipient, seatedParticipants]);

 const handleSend = async (isComboTrigger = false) => {
  if (!user || !firestore || !selectedGift || !userProfile || selectedUids.length === 0) return;

  const qty = isComboTrigger ? 1 : parseInt(quantity);
  const totalCost = selectedGift.price * qty * selectedUids.length;
  
  if ((userProfile.wallet?.coins || 0) < totalCost) return;
  if (isSending) return;
  setIsSending(true);

  try {
   const batch = writeBatch(firestore);
   const today = getTodayString();
   
   let winAmount = 0;
   let selectedMult = 1;

   if (selectedGift.isLucky) {
      const rand = Math.random();
      if (rand < 0.7) selectedMult = 1;
      else if (rand < 0.85) selectedMult = 2;
      else if (rand < 0.93) selectedMult = 5;
      else if (rand < 0.97) selectedMult = 10;
      else selectedMult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
      
      if (selectedMult > 1) {
         winAmount = (selectedGift.price * qty) * selectedMult;
      }
   }

   const senderProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
   const senderUserRef = doc(firestore, 'users', user.uid);
   const isSenderNewDay = (userProfile.wallet as any)?.lastDailyResetDate !== today;
   
   const coinAdjustment = -totalCost + winAmount;

   batch.update(senderProfileRef, { 
     'wallet.coins': increment(coinAdjustment),
     'wallet.totalSpent': increment(totalCost),
     'wallet.dailySpent': isSenderNewDay ? totalCost : increment(totalCost),
     'wallet.lastDailyResetDate': today,
     updatedAt: serverTimestamp() 
   });
   
   batch.update(senderUserRef, { 
     'wallet.coins': increment(coinAdjustment),
     'wallet.dailySpent': isSenderNewDay ? totalCost : increment(totalCost),
     'wallet.lastDailyResetDate': today
    });

   const diamondPerRecipient = Math.floor((selectedGift.price * qty) * 0.4);
   
   selectedUids.forEach(uid => {
     const recProfileRef = doc(firestore, 'users', uid, 'profile', uid);
     const recUserRef = doc(firestore, 'users', uid);
     batch.update(recProfileRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       'stats.dailyGiftsReceived': increment(diamondPerRecipient)
     });
     batch.update(recUserRef, { 
       'wallet.diamonds': increment(diamondPerRecipient),
       'stats.dailyGiftsReceived': increment(diamondPerRecipient) 
     });
   });

   const roomRef = doc(firestore, 'chatRooms', roomId);
   batch.update(roomRef, {
     'stats.totalGifts': increment(totalCost),
     'stats.dailyGifts': increment(totalCost),
     'rocket.progress': increment(totalCost)
   });

   const firstRecipientUid = selectedUids[0];
   const recipientObj = participants.find((p: any) => p.uid === firstRecipientUid);
   const recipientSeat = recipientObj?.seatIndex || 1;
   const recipientName = recipientObj?.name || 'Someone';

   const msgRef = doc(collection(firestore, 'chatRooms', roomId, 'messages'));
    batch.set(msgRef, {
      type: 'gift',
      senderId: user.uid,
      senderName: userProfile.username,
      giftId: selectedGift.id,
      giftName: selectedGift.name,
      animationId: selectedGift.animationId,
      imageUrl: selectedGift.imageUrl || null,
      animationUrl: selectedGift.animationUrl || null,
      soundUrl: selectedGift.soundUrl || null,
      tier: selectedGift.tier || 'normal',
      recipientId: firstRecipientUid,
      receiverName: recipientName,
      recipientSeat: recipientSeat,
      text: `sent ${selectedGift.name} x${isComboTrigger ? 1 : qty} to ${recipientName}`,
      timestamp: serverTimestamp()
    });

   await batch.commit();

   // Trigger Castle Full Animation
   if (selectedGift.id === 'castle') {
     setPlayCastleAnim(true);
     setTimeout(() => setPlayCastleAnim(false), 15000); // 15 seconds run time
   }

   if (winAmount > 0) {
      setWinData({ show: true, multiplier: selectedMult });
      setTimeout(() => setWinData(null), 4000);
   }

   const newToastId = Date.now();
   setToasts(prev => [...prev, { id: newToastId, emoji: selectedGift.emoji || '🏰', qty: isComboTrigger ? comboCount + 1 : qty, username: userProfile.username, avatarUrl: userProfile.avatarUrl }].slice(-3));
   setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== newToastId)); }, 3000);

   setComboCount(prev => prev + 1);
   setShowCombo(true);
   if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
   comboTimerRef.current = setTimeout(() => { setShowCombo(false); setComboCount(0); }, 3000);

   if (!isComboTrigger && !selectedGift.isLucky && selectedGift.id !== 'castle') onOpenChange(false);
  } catch (e) { console.error(e); } finally { setIsSending(false); }
 };

 return (
  <>
   {/* --- FULL SCREEN OVERLAY RENDER FOR CASTLE --- */}
   {playCastleAnim && <PrincessCastleOverlay />}

   {/* --- 3D LUCKY WIN CARD (SLIM & SIDE SLIDE) --- */}
   <AnimatePresence>
     {winData?.show && (
       <motion.div 
         initial={{ x: -300, opacity: 0, rotateY: -30 }}
         animate={{ x: 20, opacity: 1, rotateY: 0 }}
         exit={{ x: -500, opacity: 0 }}
         className="fixed top-1/3 left-0 z-[1000] pointer-events-none"
       >
         <div className="relative w-60 h-36 bg-gradient-to-br from-blue-500 to-blue-800 rounded-r- border- border-white shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.3)] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-[-10deg] -translate-y-10" />
            <motion.span 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
              style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}
            >
              WIN x{winData.multiplier}
            </motion.span>
            <div className="mt-1 px-3 py-0.5 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
               <span className="text-white font-bold text- uppercase tracking-widest">Lucky Reward</span>
            </div>
         </div>
       </motion.div>
     )}
   </AnimatePresence>

   {/* SIDE NOTIFICATIONS (FIXED AT 70VH) */}
   <div className="fixed top- left-0 z-[700] flex flex-col gap-2 pointer-events-none">
     <AnimatePresence>
      {toasts.map((toast) => (
       <motion.div key={toast.id} initial={{ x: -100, opacity: 0 }} animate={{ x: 16, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-blue-600/95 backdrop-blur-md p-2 pr-6 rounded-r-full flex items-center gap-3 border-2 border-white shadow-[0_0_15px_rgba(37,99,235,0.6)]">
        <Avatar className="h-10 w-10 border-2 border-white"><AvatarImage src={toast.avatarUrl} /></Avatar>
        <div className="flex flex-col">
          <span className="text- font-bold text-white uppercase tracking-tight leading-none">{toast.username}</span>
          <div className="flex items-center gap-1">
            {/* Show Emoji OR a mini castle in toast */}
            {toast.emoji === '🏰' ? (
              <span className="text-lg">🏰</span> 
            ) : (
              <span className="text-lg">{toast.emoji}</span>
            )}
            <span className="text-sm font-black text-white italic">x{toast.qty}</span>
          </div>
        </div>
       </motion.div>
      ))}
     </AnimatePresence>
   </div>

   {/* COMBO BUTTON */}
   <AnimatePresence>
    {showCombo && (
     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-44 right-8 z-[600]">
      <button onClick={() => handleSend(true)} className="h-24 w-24 bg-blue-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(37,99,235,0.7)] flex flex-col items-center justify-center active:scale-90 transition-all">
       <Zap className="h-8 w-8 text-white fill-white animate-bounce" />
       <span className="text-2xl font-black text-white italic">{comboCount}x</span>
      </button>
     </motion.div>
    )}
   </AnimatePresence>

   <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" hideOverlay={true} className="sm:max-w-none w-full bg-[#0b0e14] border-t border-white/10 p-0 rounded-t- overflow-hidden text-white shadow-2xl h- pb-10 [&>button]:hidden">
     <div className="p-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/5">
      <button onClick={() => setSelectedUids(seatedParticipants.map((p:any)=>p.uid))} className={cn("h-10 w-10 rounded-full border-2 text- font-black shrink-0 transition-all", selectedUids.length === seatedParticipants.length ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" : "border-white/10 bg-white/5 text-white/40")}>ALL</button>
      {seatedParticipants.map((p: any) => (
       <button key={p.uid} onClick={() => setSelectedUids([p.uid])} className="relative shrink-0">
        <Avatar className={cn("h-10 w-10 border-2 transition-all", selectedUids.includes(p.uid) ? "border-cyan-400" : "border-transparent opacity-50")}><AvatarImage src={p.avatarUrl} /></Avatar>
        {selectedUids.includes(p.uid) && <div className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-black stroke-[4]" /></div>}
       </button>
      ))}
     </div>

     <Tabs defaultValue="Hot" className="w-full mt-2">
      <TabsList className="mx-4 bg-white/5 p-1 rounded-2xl flex justify-between border border-white/5">
       {['Hot', 'Lucky', 'Luxury', 'Event'].map(id => (
        <TabsTrigger key={id} value={id} className="text- font-black px-4 py-1.5 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500">{id}</TabsTrigger>
       ))}
      </TabsList>
      
       <div className="h- overflow-y-auto no-scrollbar px-4 pt-3 pb-20 grid grid-cols-4 gap-x-2 gap-y-4">
        {isGiftsLoading ? (
          <div className="col-span-4 flex flex-col items-center justify-center py-10 gap-2">
            <Loader className="animate-spin text-cyan-400 h-6 w-6" />
            <span className="text- font-black text-white/20 uppercase tracking-widest">Loading Gifts...</span>
          </div>
        ) : (
          Object.entries(GIFTS).map(([cat, items]) => (
            <TabsContent key={cat} value={cat} className="contents">
            {items.length === 0 ? (
               <div className="col-span-4 py-10 text-center opacity-30 text- font-bold uppercase tracking-widest">No Gifts in {cat}</div>
            ) : (
              items.map(gift => (
                <button key={gift.id} onClick={() => setSelectedGift(gift)} className={cn("flex flex-col items-center transition-all duration-300 relative py-1 rounded-lg", selectedGift?.id === gift.id ? "brightness-125 bg-white/10" : "opacity-70 hover:opacity-100")}>
                <div className="h-10 w-10 flex items-center justify-center mb-1 filter drop-shadow-md">
                  {gift.imageUrl ? (
                    <img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-contain" />
                  ) : gift.id === 'castle' ? (
                    /* CASTLE SVG UI INSTEAD OF EMOJI */
                    <div className="h-full w-full flex items-center justify-center scale-[1.8] drop-shadow-xl" dangerouslySetInnerHTML={{ __html: castleSvg }} />
                  ) : (
                    <span className="text-3xl">{gift.emoji}</span>
                  )}
                </div>
                <span className="text- font-bold text-white/90 truncate w-full text-center">{gift.name}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <GoldenDollar /> 
                  <span className="text- text-yellow-500 font-black">{gift.price}</span>
                </div>
                {selectedGift?.id === gift.id && <div className="absolute -bottom-1 h-1 w-4 bg-cyan-400 rounded-full" />}
                </button>
              ))
            )}
            </TabsContent>
          ))
        )}
       </div>
     </Tabs>

     <div className="absolute bottom-0 left-0 right-0 p-3 pb-safe bg-[#0b0e14] flex items-center justify-between border-t border-white/10 shadow-2xl">
      <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-2xl border border-white/5">
       <GoldenDollar />
       <span className="text-sm font-black text-yellow-500">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
       <Select value={quantity} onValueChange={setQuantity}>
         <SelectTrigger className="w-16 h-10 bg-white/5 border-white/10 rounded-2xl text-cyan-400 font-bold focus:ring-0"><SelectValue /></SelectTrigger>
         <SelectContent className="bg-[#151921] border-white/10 text-white font-bold">{['1','10','99','520','1314'].map(q=><SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
       </Select>
       <button onClick={() => handleSend(false)} disabled={!selectedGift || isSending || selectedUids.length === 0} className="h-10 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-xs shadow-lg active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest border-b-4 border-black/20">
         {isSending ? <Loader className="h-4 w-4 animate-spin" /> : 'SEND'}
       </button>
      </div>
     </div>
    </SheetContent>
   </Sheet>
  </>
 );
}
