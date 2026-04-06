'use client';

import React from 'react';
import { 
 Dialog, 
 DialogContent, 
 DialogHeader, 
 DialogTitle, 
 DialogDescription 
} from '@/components/ui/dialog';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

// --- ULTRA HD 3D EMOJI DESIGNS ---

const EmojiHD = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* Premium 3D Gold/Yellow Gradient for Face */}
      <radialGradient id="gradFace" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="40%" stopColor="#FFD54F" />
        <stop offset="80%" stopColor="#FFB300" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>
      
      {/* Red gradient for anger/fuming */}
      <radialGradient id="gradAnger" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>

      {/* Glossy Top Reflection for 3D Effect */}
      <linearGradient id="shineTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.75" />
        <stop offset="30%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Shadow filter for 3D pop */}
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
      </filter>

      {/* Soft Blur for Blush */}
      <filter id="blurBlush" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );

  const FaceBase = ({ blush = false, anger = false }) => (
    <g filter="url(#dropShadow)">
      {/* Main Base */}
      <circle cx="50" cy="50" r="46" fill={anger ? "url(#gradAnger)" : "url(#gradFace)"} stroke={anger ? "#D32F2F" : "#F57F17"} strokeWidth="0.5" />
      {/* Top Gloss */}
      <circle cx="50" cy="46" r="42" fill="url(#shineTop)" />
      {/* Blush */}
      {blush && (
        <>
          <ellipse cx="22" cy="55" rx="9" ry="6" fill="#FF5252" opacity="0.45" filter="url(#blurBlush)" />
          <ellipse cx="78" cy="55" rx="9" ry="6" fill="#FF5252" opacity="0.45" filter="url(#blurBlush)" />
        </>
      )}
    </g>
  );

  const Anger💢Left = () => (
    <g stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" transform="translate(18, 55)">
      <path d="M0,5 L10,5 M5,0 L5,10 M2,2 L8,8 M2,8 L8,2" />
    </g>
  );

  const Anger💢Right = () => (
    <g stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" transform="translate(72, 55)">
      <path d="M0,5 L10,5 M5,0 L5,10 M2,2 L8,8 M2,8 L8,2" />
    </g>
  );

  const KissHeartsLeft = () => (
    <g filter="url(#dropShadow)" transform="translate(-5, 0)">
      <path d="M 75 35 A 6 6 0 0 1 87 35 A 6 6 0 0 1 99 35 Q 99 45 87 55 Q 75 45 75 35 Z" fill="#FF1744" />
      <path d="M 68 20 A 4 4 0 0 1 76 20 A 4 4 0 0 1 84 20 Q 84 26 76 32 Q 68 26 68 20 Z" fill="#FF1744" />
    </g>
  );

  const KissHeartsRight = () => (
    <g filter="url(#dropShadow)" transform="translate(5, 0) scale(-1, 1) translate(-100, 0)">
      <path d="M 75 35 A 6 6 0 0 1 87 35 A 6 6 0 0 1 99 35 Q 99 45 87 55 Q 75 45 75 35 Z" fill="#FF1744" />
      <path d="M 68 20 A 4 4 0 0 1 76 20 A 4 4 0 0 1 84 20 Q 84 26 76 32 Q 68 26 68 20 Z" fill="#FF1744" />
    </g>
  );

  const HammerPaddedL = () => (
    <g filter="url(#dropShadow)" transform="translate(68, 15) rotate(15)">
      <rect x="8" y="15" width="6" height="28" rx="2" fill="#795548" />
      <rect x="0" y="0" width="22" height="15" rx="3" fill="#424242" />
    </g>
  );

  const HammerPaddedR = () => (
    <g filter="url(#dropShadow)" transform="translate(10, 15) rotate(-15)">
      <rect x="8" y="15" width="6" height="28" rx="2" fill="#795548" />
      <rect x="0" y="0" width="22" height="15" rx="3" fill="#424242" />
    </g>
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <circle cx="32" cy="42" r="6" fill="#3E2723" />
          <circle cx="68" cy="42" r="6" fill="#3E2723" />
          <g filter="url(#dropShadow)">
            <rect x="14" y="60" width="72" height="20" rx="4" fill="#D32F2F" stroke="#B71C1C" strokeWidth="1" />
            <text x="50" y="74" fontSize="9" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type.toUpperCase()}</text>
          </g>
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 22 40 Q 32 30 42 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 58 40 Q 68 30 78 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 20 60 Q 18 68 22 72 Q 26 68 24 60 Z" fill="#29B6F6" opacity="0.9" />
          <path d="M 80 60 Q 78 68 82 72 Q 86 68 84 60 Z" fill="#29B6F6" opacity="0.9" />
          <path d="M 25 50 Q 50 95 75 50 Z" fill="#3E2723" />
          <path d="M 30 52 Q 50 60 70 52 Z" fill="white" />
          <path d="M 40 75 Q 50 65 60 75 Z" fill="#EF5350" />
        </svg>
      );

    case 'kissLeft':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 20 35 L 30 42 L 20 49" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 80 35 L 70 42 L 80 49" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 55 45 C 65 42, 65 55, 55 55 C 65 55, 65 68, 55 65" stroke="#5D4037" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <KissHeartsLeft />
        </svg>
      );

    case 'kissRight':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          {/* Flipped features */}
          <path d="M 20 35 L 30 42 L 20 49" transform="scale(-1, 1) translate(-50, 0)" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 80 35 L 70 42 L 80 49" transform="scale(-1, 1) translate(-150, 0)" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 45 45 C 35 42, 35 55, 45 55 C 35 55, 35 68, 45 65" stroke="#5D4037" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <KissHeartsRight />
        </svg>
      );

    case 'hammerLeft':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 25 35 L 42 45 M 75 35 L 58 45" stroke="#3E2723" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="38" cy="50" r="5" fill="#3E2723" />
          <circle cx="62" cy="50" r="5" fill="#3E2723" />
          <path d="M 40 75 Q 50 68 60 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Anger💢Left />
          <HammerPaddedL />
          <circle cx="80" cy="55" r="9" fill="url(#gradFace)" filter="url(#dropShadow)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'hammerRight':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          {/* Flipped angry brows and eyes */}
          <path d="M 25 35 L 42 45 M 75 35 L 58 45" transform="scale(-1, 1) translate(-100, 0)" stroke="#3E2723" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="38" cy="50" r="5" fill="#3E2723" />
          <circle cx="62" cy="50" r="5" fill="#3E2723" />
          <path d="M 40 75 Q 50 68 60 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Anger💢Right />
          <HammerPaddedR />
          <circle cx="20" cy="55" r="9" fill="url(#gradFace)" filter="url(#dropShadow)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <g filter="url(#dropShadow)">
            <path d="M 12 40 Q 20 35 50 38 Q 80 35 88 40 L 82 55 Q 65 60 50 48 Q 35 60 18 55 Z" fill="#212121" />
          </g>
          <path d="M 25 65 Q 50 85 75 65" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 35 70 Q 50 78 65 70" fill="white" />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 25 40 Q 35 30 45 40 M 75 40 Q 65 30 55 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="35" cy="52" r="10" fill="#212121" />
          <circle cx="65" cy="52" r="10" fill="#212121" />
          <path d="M 40 80 Q 50 70 60 80" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <g stroke="#757575" strokeWidth="3" fill="none">
            <circle cx="32" cy="38" r="12" />
            <circle cx="68" cy="38" r="12" />
          </g>
          <g stroke="#424242" strokeWidth="1.5" fill="none">
            <path d="M 32 38 m -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 m 3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0" />
            <path d="M 68 38 m -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 m 3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0" />
          </g>
          <path d="M 40 68 Q 45 62 50 68 T 60 68" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 45 90 Q 40 75 55 75 Q 65 75 60 90 Z" fill="url(#gradFace)" filter="url(#dropShadow)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'dance':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 25 45 Q 35 35 45 45 M 75 45 Q 65 35 55 45" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 28 55 Q 50 90 72 55 Z" fill="#3E2723" />
          <path d="M 32 58 Q 50 65 68 58 Z" fill="white" />
          <g filter="url(#dropShadow)">
            <path d="M 70 40 Q 80 25 90 35 L 85 45 Q 95 45 95 55 Q 85 60 70 50 Z" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
          </g>
          <g filter="url(#dropShadow)">
            <path d="M 30 75 Q 15 80 15 65 L 25 60 Q 15 50 25 45 Q 35 55 40 65 Z" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
          </g>
          <g strokeWidth="2" fill="none">
            <path d="M 25 25 L 35 20 M 25 25 L 25 35 M 35 20 L 35 30" stroke="#00E676" />
            <path d="M 70 15 L 80 10 L 80 25 M 70 15 L 70 30" stroke="#E91E63" />
            <path d="M 45 10 L 55 15 L 55 30 M 45 10 L 45 25" stroke="#29B6F6" />
          </g>
        </svg>
      );

    default: return null;
  }
};

const NEW_REACTIONS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'kissLeft', label: 'Kiss L' }, // User Request: Add L
  { id: 'kissRight', label: 'Kiss R' }, // User Request: Add R
  { id: 'hammerLeft', label: 'Hit L' }, // User Request: Add L
  { id: 'hammerRight', label: 'Hit R' }, // User Request: Add R
  { id: 'proud', label: 'Proud' },
  { id: 'sad', label: 'Sad' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'dance', label: 'Dance' },
];

export function RoomEmojiPickerDialog({ open, onOpenChange, roomId }: { open: boolean, onOpenChange: (open: boolean) => void, roomId: string }) {
 const { user } = useUser();
 const firestore = useFirestore();

 const handleSendEmoji = (emojiId: string) => {
  if (!firestore || !roomId || !user) return;
  const pRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
  updateDocumentNonBlocking(pRef, { activeEmoji: emojiId, updatedAt: serverTimestamp() });
  onOpenChange(false);
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[380px] bg-black/95 border-none p-0 rounded-t-[3rem] overflow-hidden text-white outline-none">
    <div className="flex flex-col h-full">
      <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mt-4" />
      <DialogHeader className="p-6 pb-2 text-center">
       <DialogTitle className="text-3xl font-black italic tracking-tighter">EMOJIS</DialogTitle>
       <DialogDescription className="text-[10px] uppercase tracking-widest text-white/40">Select a vibe to cover your seat</DialogDescription>
      </DialogHeader>

      <div className="p-8 grid grid-cols-3 gap-y-12 gap-x-6 pb-16">
        {NEW_REACTIONS.map((item) => (
         <button key={item.id} onClick={() => handleSendEmoji(item.id)} className="flex flex-col items-center gap-3 group transition-all active:scale-75">
          <div className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-125 duration-300">
            <EmojiHD type={item.id} />
          </div>
          <span className="text-[11px] font-bold text-white/30 uppercase group-hover:text-yellow-400 transition-colors">
            {item.label}
          </span>
         </button>
        ))}
      </div>
    </div>
   </DialogContent>
  </Dialog>
 );
          }
 
