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
      <radialGradient id="gradFace" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="40%" stopColor="#FFD54F" />
        <stop offset="80%" stopColor="#FFB300" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>
      
      <radialGradient id="gradAnger" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>

      <linearGradient id="shineTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.75" />
        <stop offset="30%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
      </filter>

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
          <rect x="14" y="60" width="72" height="20" rx="4" fill="#D32F2F" />
          <text x="50" y="74" fontSize="9" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type.toUpperCase()}</text>
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
          <path d="M 20 60 Q 18 68 22 72 Q 26 68 24 60 Z" fill="#29B6F6" />
          <path d="M 80 60 Q 78 68 82 72 Q 86 68 84 60 Z" fill="#29B6F6" />
          <path d="M 25 50 Q 50 95 75 50 Z" fill="#3E2723" />
          <path d="M 30 52 Q 50 60 70 52 Z" fill="white" />
        </svg>
      );

    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <g stroke="#546E7A" strokeWidth="2" fill="none">
            <circle cx="32" cy="38" r="13" fill="white" stroke="#90A4AE" />
            <path d="M 32 38 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 m 3 0 a 6 6 0 1 1 12 0" />
            <circle cx="68" cy="38" r="13" fill="white" stroke="#90A4AE" />
            <path d="M 68 38 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 m 3 0 a 6 6 0 1 1 12 0" />
          </g>
          <path d="M 42 68 Q 50 62 58 68" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 45 92 Q 40 78 55 78 Q 65 78 60 92 Z" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase anger />
          <path d="M 25 35 L 42 45 M 75 35 L 58 45" stroke="white" strokeWidth="5" strokeLinecap="round" />
          <circle cx="32" cy="52" r="5" fill="white" />
          <circle cx="68" cy="52" r="5" fill="white" />
          <path d="M 35 75 Q 50 65 65 75" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'kissL':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 20 38 L 30 45 L 20 52" stroke="#4E342E" strokeWidth="4" fill="none" />
          <path d="M 55 55 C 65 55, 65 68, 55 65" stroke="#D32F2F" strokeWidth="4" fill="none" />
          <path d="M 75 40 A 6 6 0 0 1 87 40 A 6 6 0 0 1 99 40 Q 99 50 87 60 Q 75 50 75 40 Z" fill="#FF1744" />
        </svg>
      );

    case 'kissR':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'scaleX(-1)' }}>
          {defs}
          <FaceBase blush />
          <path d="M 20 38 L 30 45 L 20 52" stroke="#4E342E" strokeWidth="4" fill="none" />
          <path d="M 55 55 C 65 55, 65 68, 55 65" stroke="#D32F2F" strokeWidth="4" fill="none" />
          <path d="M 75 40 A 6 6 0 0 1 87 40 A 6 6 0 0 1 99 40 Q 99 50 87 60 Q 75 50 75 40 Z" fill="#FF1744" />
        </svg>
      );

    case 'hitL':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase anger />
          <g transform="translate(68, 12) rotate(15)">
            <rect x="8" y="15" width="6" height="25" rx="2" fill="#795548" />
            <rect x="0" y="0" width="22" height="15" rx="3" fill="#424242" />
          </g>
          <circle cx="82" cy="55" r="8" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'hitR':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'scaleX(-1)' }}>
          {defs}
          <FaceBase anger />
          <g transform="translate(68, 12) rotate(15)">
            <rect x="8" y="15" width="6" height="25" rx="2" fill="#795548" />
            <rect x="0" y="0" width="22" height="15" rx="3" fill="#424242" />
          </g>
          <circle cx="82" cy="55" r="8" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 12 40 Q 20 35 50 38 Q 80 35 88 40 L 82 55 Q 65 60 50 48 Q 35 60 18 55 Z" fill="#212121" />
          <path d="M 30 68 Q 50 88 70 68" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 25 45 Q 35 35 45 45" stroke="#3E2723" strokeWidth="3" fill="none" />
          <path d="M 55 45 Q 65 35 75 45" stroke="#3E2723" strokeWidth="3" fill="none" />
          <circle cx="35" cy="55" r="6" fill="#3E2723" />
          <circle cx="65" cy="55" r="6" fill="#3E2723" />
          <path d="M 40 80 Q 50 70 60 80" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    default: return null;
  }
};

const REACTIONS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'kissL', label: 'Kiss L' },
  { id: 'kissR', label: 'Kiss R' },
  { id: 'hitL', label: 'Hit L' },
  { id: 'hitR', label: 'Hit R' },
  { id: 'proud', label: 'Proud' },
  { id: 'thinking', label: 'Think' },
  { id: 'anger', label: 'Anger' },
  { id: 'sad', label: 'Sad' },
];

export function RoomEmojiPickerDialog({ open, onOpenChange, roomId }: { open: boolean, onOpenChange: (open: boolean) => void, roomId: string }) {
 const { user } = useUser();
 const firestore = useFirestore();

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
   <DialogContent className="sm:max-w-[420px] bg-black/95 border-none p-0 rounded-t-[3rem] overflow-hidden text-white outline-none">
    <div className="flex flex-col max-h-[80vh]">
      <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mt-4 flex-shrink-0" />
      
      <DialogHeader className="p-6 pb-2 text-center flex-shrink-0">
       <DialogTitle className="text-3xl font-black italic tracking-tight">EMOJIS</DialogTitle>
       <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-white/40">Select a vibe to cover your seat</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        <div className="grid grid-cols-3 gap-y-12 gap-x-4 pb-12">
          {REACTIONS.map((item) => (
           <button 
             key={item.id} 
             onClick={() => handleSendEmoji(item.id)} 
             className="flex flex-col items-center gap-3 group transition-all active:scale-75"
           >
            <div className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-2xl group-hover:scale-125 duration-300">
              <EmojiHD type={item.id} />
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase group-hover:text-yellow-400">
              {item.label}
            </span>
           </button>
          ))}
        </div>
      </div>
    </div>
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    `}</style>
   </DialogContent>
  </Dialog>
 );
           }
