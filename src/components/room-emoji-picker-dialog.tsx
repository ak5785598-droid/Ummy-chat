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

// --- Improved 3D SVG Components ---

const Emoji3D = ({ type }: { type: string }) => {
  const yellowGrad = (
    <defs>
      <radialGradient id="yellowGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="70%" stopColor="#FBC02D" />
        <stop offset="100%" stopColor="#F9A825" />
      </radialGradient>
    </defs>
  );

  switch (type) {
    case 'welcome':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {yellowGrad}
          <circle cx="50" cy="42" r="32" fill="url(#yellowGrad)" />
          {/* Eyes */}
          <circle cx="42" cy="38" r="2.5" fill="#422200" />
          <circle cx="58" cy="38" r="2.5" fill="#422200" />
          {/* Smile */}
          <path d="M42 48 Q50 54 58 48" stroke="#422200" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Red Banner for Welcome */}
          <rect x="10" y="52" width="80" height="22" rx="6" fill="#E11D48" />
          <path d="M10 52 L90 52 L90 60 Q50 65 10 60 Z" fill="#BE123C" opacity="0.3" />
          <text x="50" y="67" fontSize="10" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>WELCOME</text>
        </svg>
      );
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {yellowGrad}
          <circle cx="50" cy="42" r="32" fill="url(#yellowGrad)" />
          <circle cx="42" cy="38" r="2.5" fill="#422200" />
          <circle cx="58" cy="38" r="2.5" fill="#422200" />
          {/* Red Banner for Thanks */}
          <rect x="12" y="52" width="76" height="22" rx="6" fill="#F43F5E" />
          <text x="50" y="67" fontSize="11" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>THANKS</text>
        </svg>
      );
    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {yellowGrad}
          <circle cx="50" cy="50" r="40" fill="url(#yellowGrad)" />
          <path d="M25 45 Q35 30 45 45 M55 45 Q65 30 75 45" fill="none" stroke="#422200" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 60 Q50 85 70 60 Z" fill="#422200" />
          <path d="M20 40 Q10 25 20 15 M80 40 Q90 25 80 15" stroke="#4FC3F7" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {yellowGrad}
          <circle cx="50" cy="50" r="40" fill="url(#yellowGrad)" />
          <path d="M30 40 L45 40 M55 40 L70 40" stroke="#422200" strokeWidth="5" strokeLinecap="round" />
          <rect x="32" y="50" width="8" height="35" rx="4" fill="#03A9F4" />
          <rect x="60" y="50" width="8" height="35" rx="4" fill="#03A9F4" />
        </svg>
      );
    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {yellowGrad}
          <circle cx="50" cy="50" r="40" fill="url(#yellowGrad)" />
          <rect x="20" y="35" width="60" height="18" rx="4" fill="#212121" />
          <path d="M30 65 Q50 78 70 65" stroke="#422200" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {yellowGrad}
          <circle cx="50" cy="50" r="40" fill="url(#yellowGrad)" />
          <path d="M30 45 Q37 35 45 45 M55 45 Q62 35 70 45" fill="none" stroke="#422200" strokeWidth="3" />
          <path d="M75 55 Q85 45 75 35 Q65 45 75 55" fill="#FF5252" />
          <path d="M45 65 Q50 70 55 65" stroke="#422200" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="orangeGrad"><stop offset="0%" stopColor="#FF7043"/><stop offset="100%" stopColor="#D84315"/></radialGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="url(#orangeGrad)" />
          <path d="M30 35 L45 45 M70 35 L55 45" stroke="white" strokeWidth="5" strokeLinecap="round" />
          <path d="M30 70 Q50 55 70 70" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {yellowGrad}
          <circle cx="50" cy="50" r="40" fill="url(#yellowGrad)" />
          <rect x="15" y="40" width="12" height="30" rx="6" fill="#D32F2F" />
          <rect x="73" y="40" width="12" height="30" rx="6" fill="#D32F2F" />
          <path d="M20 45 Q50 15 80 45" stroke="#D32F2F" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 65 Q50 75 60 65" stroke="#422200" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {yellowGrad}
          <circle cx="50" cy="50" r="40" fill="url(#yellowGrad)" />
          <circle cx="35" cy="45" r="5" fill="#422200" />
          <circle cx="65" cy="45" r="5" fill="#422200" />
          <path d="M35 70 Q50 60 65 70" fill="none" stroke="#422200" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'terror':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#90CAF9"/><stop offset="100%" stopColor="#1565C0"/></linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="url(#blueGrad)" />
          <circle cx="35" cy="40" r="8" fill="white" />
          <circle cx="65" cy="40" r="8" fill="white" />
          <circle cx="35" cy="40" r="3" fill="black" />
          <circle cx="65" cy="40" r="3" fill="black" />
          <ellipse cx="50" cy="70" rx="15" ry="10" fill="white" />
        </svg>
      );
    default:
      return null;
  }
};

const CUSTOM_REACTIONS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'cry', label: 'Cry' },
  { id: 'proud', label: 'Proud' },
  { id: 'kiss', label: 'Kiss' },
  { id: 'anger', label: 'Anger' },
  { id: 'music', label: 'Music' },
  { id: 'sad', label: 'Sad' },
  { id: 'terror', label: 'Terror' },
];

interface RoomEmojiPickerDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 roomId: string;
}

export function RoomEmojiPickerDialog({ open, onOpenChange, roomId }: RoomEmojiPickerDialogProps) {
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
   <DialogContent className="sm:max-w-[400px] bg-[#0A0A0A]/95 backdrop-blur-3xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-sans shadow-[0_-10px_50px_rgba(0,0,0,0.8)]">
    <DialogHeader className="p-8 pb-2 text-center">
     <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mb-6" />
     <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white/90">REACTION SYNC</DialogTitle>
     <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mt-1">Select a vibe to cover your seat</DialogDescription>
    </DialogHeader>

    <div className="p-6 grid grid-cols-3 gap-y-10 gap-x-4 pb-20 max-h-[75vh] overflow-y-auto">
      {CUSTOM_REACTIONS.map((item) => (
       <button 
        key={item.id} 
        onClick={() => handleSendEmoji(item.id)}
        className="flex flex-col items-center gap-3 group outline-none"
       >
        <div className="h-24 w-24 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:rotate-3">
          <Emoji3D type={item.id} />
        </div>
        <span className="text-[11px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">
          {item.label}
        </span>
       </button>
      ))}
    </div>
   </DialogContent>
  </Dialog>
 );
}
