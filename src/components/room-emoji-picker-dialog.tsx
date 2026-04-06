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

// --- HD 3D EMOJI COMPONENTS (BASED ON YOUR IMAGES) ---

const EmojiHD = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* 3D Sphere Gradient */}
      <radialGradient id="gradFace" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="70%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57F17" />
      </radialGradient>
      
      {/* Glossy Top Shine */}
      <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.6" />
        <stop offset="50%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Hammer Gradient */}
      <linearGradient id="gradHammer" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#424242" />
        <stop offset="100%" stopColor="#111" />
      </linearGradient>

      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
        <feOffset dx="0" dy="2" />
        <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  );

  const FaceBase = () => (
    <>
      <circle cx="50" cy="50" r="45" fill="url(#gradFace)" filter="url(#shadow)" />
      <ellipse cx="45" cy="30" rx="25" ry="15" fill="url(#gloss)" opacity="0.4" />
    </>
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="32" cy="42" r="4.5" fill="black" />
          <circle cx="68" cy="42" r="4.5" fill="black" />
          <circle cx="28" cy="40" r="1.5" fill="white" />
          <circle cx="64" cy="40" r="1.5" fill="white" />
          <path d="M40 60 Q50 68 60 60" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="10" y="70" width="80" height="20" rx="4" fill="#E53935" filter="url(#shadow)" />
          <text x="50" y="84" fontSize="8" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type.toUpperCase()}</text>
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Laughing Eyes with Tears (Ref: img 1000097859) */}
          <path d="M25 45 Q35 30 45 45" stroke="#8B4513" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M55 45 Q65 30 75 45" stroke="#8B4513" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M20 55 Q50 95 80 55 Z" fill="#4E342E" />
          <path d="M30 57 Q50 65 70 57" fill="white" /> 
          <path d="M15 45 Q5 40 12 25 M85 45 Q95 40 88 25" stroke="#40C4FF" strokeWidth="6" strokeLinecap="round" />
          <circle cx="25" cy="60" r="8" fill="#FF7043" opacity="0.4" />
          <circle cx="75" cy="60" r="8" fill="#FF7043" opacity="0.4" />
        </svg>
      );

    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Eyes closed (Ref: img 1000097855) */}
          <path d="M20 45 L35 40 M20 40 L35 45" stroke="#4E342E" strokeWidth="3" />
          <path d="M65 45 L80 40 M65 40 L80 45" stroke="#4E342E" strokeWidth="3" />
          <path d="M45 70 Q50 60 55 70 Q50 75 45 70" fill="none" stroke="#8B4513" strokeWidth="3" />
          {/* Hearts */}
          <path d="M75 55 Q85 40 95 55 Q85 70 75 55" fill="#FF1744" filter="url(#shadow)" />
          <path d="M85 35 Q90 28 95 35 Q90 42 85 35" fill="#FF1744" />
        </svg>
      );

    case 'hammer': // Replacement for Anger (Ref: img 1000097856)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M30 35 L45 42 M70 35 L55 42" stroke="black" strokeWidth="5" strokeLinecap="round" />
          <circle cx="38" cy="55" r="5" fill="black" />
          <circle cx="62" cy="55" r="5" fill="black" />
          <path d="M40 80 Q50 70 60 80" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Hammer */}
          <rect x="75" y="20" width="20" height="12" rx="2" fill="url(#gradHammer)" transform="rotate(-20)" />
          <rect x="82" y="32" width="4" height="15" fill="#8D6E63" transform="rotate(-20)" />
          {/* Anger Symbol */}
          <path d="M15 55 L25 65 M25 55 L15 65" stroke="#FF3D00" strokeWidth="2" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M15 35 H85 L80 52 H20 Z" fill="#212121" filter="url(#shadow)" />
          <path d="M25 65 Q50 85 75 65" stroke="#8B4513" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M35 68 Q50 75 65 68" fill="white" />
        </svg>
      );

    case 'thinking': // New Emoji (Ref: img 1000097873)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="40" r="12" fill="none" stroke="#757575" strokeWidth="2" />
          <circle cx="65" cy="40" r="12" fill="none" stroke="#757575" strokeWidth="2" />
          <path d="M47 40 H53" stroke="#757575" strokeWidth="2" />
          <path d="M40 75 Q50 65 60 75" stroke="#4E342E" strokeWidth="3" fill="none" />
          {/* Hand on chin */}
          <path d="M45 85 Q55 95 65 80" stroke="#E65100" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );

    case 'dance': // New Emoji (Ref: img 1000097876)
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M25 45 Q35 35 45 45 M55 45 Q65 35 75 45" stroke="#4E342E" strokeWidth="4" strokeLinecap="round" />
          <path d="M35 60 Q50 85 65 60" fill="#4E342E" />
          {/* Hands dancing */}
          <path d="M10 60 Q5 80 20 85" stroke="url(#gradFace)" strokeWidth="8" strokeLinecap="round" filter="url(#shadow)" />
          <path d="M85 30 Q95 10 80 5" stroke="url(#gradFace)" strokeWidth="8" strokeLinecap="round" filter="url(#shadow)" />
          {/* Music Notes */}
          <text x="20" y="25" fill="#4CAF50" fontSize="12">♫</text>
          <text x="75" y="25" fill="#E91E63" fontSize="12">♪</text>
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <circle cx="35" cy="50" r="8" fill="black" />
          <circle cx="65" cy="50" r="8" fill="black" />
          <circle cx="32" cy="48" r="3" fill="white" />
          <circle cx="62" cy="48" r="3" fill="white" />
          <path d="M35 80 Q50 65 65 80" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="25" cy="65" r="7" fill="#FF7043" opacity="0.3" />
          <circle cx="75" cy="65" r="7" fill="#FF7043" opacity="0.3" />
        </svg>
      );
    default: return null;
  }
};

const CUSTOM_REACTIONS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'kiss', label: 'Kiss' },
  { id: 'hammer', label: 'Hammer' },
  { id: 'proud', label: 'Proud' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'dance', label: 'Dance' },
  { id: 'sad', label: 'Sad' },
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
   <DialogContent className="sm:max-w-[380px] bg-[#0a0a0a]/95 border-none p-0 rounded-t-[2.5rem] overflow-hidden text-white outline-none backdrop-blur-md">
    <div className="flex flex-col h-full">
      <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mt-4" />
      <DialogHeader className="p-8 pb-4 text-center">
       <DialogTitle className="text-3xl font-black tracking-[0.15em] italic text-white drop-shadow-md">EMOJIS</DialogTitle>
       <DialogDescription className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Select a vibe to cover your seat</DialogDescription>
      </DialogHeader>

      <div className="p-6 grid grid-cols-3 gap-y-12 gap-x-6 pb-16">
        {CUSTOM_REACTIONS.map((item) => (
         <button key={item.id} onClick={() => handleSendEmoji(item.id)} className="flex flex-col items-center gap-4 group transition-all active:scale-75">
          <div className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:-translate-y-2 duration-300 ease-out">
            <EmojiHD type={item.id} />
          </div>
          <span className="text-[11px] font-black text-white/20 uppercase tracking-widest group-hover:text-yellow-400 transition-colors">
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
