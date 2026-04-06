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
      {/* Premium 3D Gold Gradient for Face */}
      <radialGradient id="gradFace" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="40%" stopColor="#FFD54F" />
        <stop offset="80%" stopColor="#FFB300" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>
      
      {/* Anger Red Gradient */}
      <radialGradient id="gradAnger" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>

      {/* Glossy Reflection */}
      <linearGradient id="shineTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.75" />
        <stop offset="30%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* 3D Drop Shadow */}
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
      </filter>

      {/* Blush Filter */}
      <filter id="blurBlush" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );

  const FaceBase = ({ blush = false, anger = false }) => (
    <g filter="url(#dropShadow)">
      <circle cx="50" cy="50" r="46" fill={anger ? "url(#gradAnger)" : "url(#gradFace)"} stroke={anger ? "#D32F2F" : "#F57F17"} strokeWidth="0.5" />
      <circle cx="50" cy="46" r="42" fill="url(#shineTop)" />
      {blush && (
        <>
          <ellipse cx="22" cy="55" rx="9" ry="6" fill="#FF5252" opacity="0.45" filter="url(#blurBlush)" />
          <ellipse cx="78" cy="55" rx="9" ry="6" fill="#FF5252" opacity="0.45" filter="url(#blurBlush)" />
        </>
      )}
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
          {/* Hands holding board */}
          <circle cx="14" cy="70" r="8" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
          <circle cx="86" cy="70" r="8" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 22 40 Q 32 30 42 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 58 40 Q 68 30 78 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Tears dropped low */}
          <path d="M 20 60 Q 18 68 22 72 Q 26 68 24 60 Z" fill="#29B6F6" opacity="0.9" />
          <path d="M 80 60 Q 78 68 82 72 Q 86 68 84 60 Z" fill="#29B6F6" opacity="0.9" />
          <path d="M 25 50 Q 50 95 75 50 Z" fill="#3E2723" />
          <path d="M 30 52 Q 50 60 70 52 Z" fill="white" />
        </svg>
      );

    case 'kissLeft':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 20 35 L 30 42 L 20 49" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 80 35 L 70 42 L 80 49" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 55 45 C 65 42, 65 55, 55 55 C 65 55, 65 68, 55 65" stroke="#5D4037" strokeWidth="3" fill="none" />
          {/* Floating Heart Right */}
          <path d="M 75 35 A 6 6 0 0 1 87 35 A 6 6 0 0 1 99 35 Q 99 45 87 55 Q 75 45 75 35 Z" fill="#FF1744" filter="url(#dropShadow)" />
        </svg>
      );

    case 'kissRight':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <g transform="scale(-1, 1) translate(-100, 0)">
            <path d="M 20 35 L 30 42 L 20 49" stroke="#4E342E" strokeWidth="4" fill="none" />
            <path d="M 80 35 L 70 42 L 80 49" stroke="#4E342E" strokeWidth="4" fill="none" />
            <path d="M 55 45 C 65 42, 65 55, 55 55 C 65 55, 65 68, 55 65" stroke="#5D4037" strokeWidth="3" fill="none" />
            <path d="M 75 35 A 6 6 0 0 1 87 35 A 6 6 0 0 1 99 35 Q 99 45 87 55 Q 75 45 75 35 Z" fill="#FF1744" />
          </g>
        </svg>
      );

    case 'hammerLeft':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase anger blush={false} />
          <path d="M 25 35 L 42 45 M 75 35 L 58 45" stroke="#3E2723" strokeWidth="5" strokeLinecap="round" />
          {/* Hammer on Right Hand */}
          <g transform="translate(65, 10) rotate(20)" filter="url(#dropShadow)">
            <rect x="8" y="15" width="6" height="25" rx="2" fill="#795548" />
            <rect x="0" y="0" width="22" height="15" rx="3" fill="#424242" />
          </g>
          <circle cx="80" cy="55" r="9" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'hammerRight':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase anger blush={false} />
          <path d="M 25 35 L 42 45 M 75 35 L 58 45" stroke="#3E2723" strokeWidth="5" strokeLinecap="round" />
          {/* Hammer on Left Hand */}
          <g transform="translate(15, 10) rotate(-20)" filter="url(#dropShadow)">
            <rect x="8" y="15" width="6" height="25" rx="2" fill="#795548" />
            <rect x="0" y="0" width="22" height="15" rx="3" fill="#424242" />
          </g>
          <circle cx="20" cy="55" r="9" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 12 40 Q 20 35 50 38 Q 80 35 88 40 L 82 55 Q 65 60 50 48 Q 35 60 18 55 Z" fill="#212121" filter="url(#dropShadow)" />
          <path d="M 25 65 Q 50 85 75 65" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <circle cx="32" cy="38" r="12" fill="none" stroke="#757575" strokeWidth="3" />
          <circle cx="68" cy="38" r="12" fill="none" stroke="#757575" strokeWidth="3" />
          <path d="M 32 38 m -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0" stroke="#424242" fill="none" strokeWidth="1" />
          <path d="M 68 38 m -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0" stroke="#424242" fill="none" strokeWidth="1" />
          <path d="M 40 68 Q 50 62 60 68" stroke="#3E2723" strokeWidth="3" fill="none" />
          <path d="M 45 90 Q 40 75 55 75 Q 65 75 60 90 Z" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    default: return null;
  }
};

const REACTIONS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'kissLeft', label: 'Kiss L' },
  { id: 'kissRight', label: 'Kiss R' },
  { id: 'hammerLeft', label: 'Hit L' },
  { id: 'hammerRight', label: 'Hit R' },
  { id: 'proud', label: 'Proud' },
  { id: 'thinking', label: 'Think' },
];

export function RoomEmojiPickerDialog({ open, onOpenChange, roomId }: { open: boolean, onOpenChange: (open: boolean) => void, roomId: string }) {
 const { user } = useUser();
 const firestore = useFirestore();

 // Wahi original logic
 const handleSendEmoji = (emojiId: string) => {
  if (!firestore || !roomId || !user) return;
  const pRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
  updateDocumentNonBlocking(pRef, { 
    activeEmoji: emojiId, 
    updatedAt: serverTimestamp() 
  });
  onOpenChange(false);
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[380px] bg-black/95 border-none p-0 rounded-t-[3rem] overflow-hidden text-white outline-none">
    <div className="flex flex-col h-full">
      <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mt-4" />
      <DialogHeader className="p-6 pb-2 text-center">
       <DialogTitle className="text-3xl font-black italic tracking-tighter">EMOJIS</DialogTitle>
       <DialogDescription className="text-[10px] uppercase tracking-widest text-white/40">Select a vibe for your seat</DialogDescription>
      </DialogHeader>

      <div className="p-8 grid grid-cols-3 gap-y-12 gap-x-6 pb-16">
        {REACTIONS.map((item) => (
         <button key={item.id} onClick={() => handleSendEmoji(item.id)} className="flex flex-col items-center gap-3 group transition-all active:scale-75">
          <div className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-xl group-hover:scale-125 duration-300">
            <EmojiHD type={item.id} />
          </div>
          <span className="text-[10px] font-bold text-white/30 uppercase group-hover:text-yellow-400">
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
