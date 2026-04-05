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

// --- BOLD & SHARP EMOJI COMPONENTS (EXACT 2ND IMAGE STYLE) ---

const Emoji3D = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* 2nd Image Realistic Gold Gradient */}
      <radialGradient id="gradSphere" cx="45%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFF176" />
        <stop offset="70%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57F17" />
      </radialGradient>
      
      {/* Glossy Top Overlay */}
      <linearGradient id="topShine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
        <stop offset="40%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Anger Red Gradient */}
      <radialGradient id="gradAnger" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#D50000" />
      </radialGradient>
    </defs>
  );

  const FaceBase = ({ fillUrl }: { fillUrl: string }) => (
    <>
      <circle cx="50" cy="50" r="46" fill={fillUrl} stroke="#C62828" strokeWidth="0.5" />
      <circle cx="50" cy="46" r="42" fill="url(#topShine)" />
    </>
  );

  // Reusable Eye Component for Sharpness
  const SharpEye = ({ cx, cy }: { cx: number, cy: number }) => (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="white" />
      <circle cx={cx} cy={cy} r="4" fill="black" />
      <circle cx={cx - 1.5} cy={cy - 1.5} r="1.5" fill="white" />
    </g>
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <SharpEye cx={35} cy={40} />
          <SharpEye cx={65} cy={40} />
          <path d="M40 52 Q50 60 60 52" stroke="black" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="10" y="62" width="80" height="22" rx="6" fill="#F44336" stroke="#B71C1C" strokeWidth="1" />
          <text x="50" y="78" fontSize="9" fontWeight="1000" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black, sans-serif'}}>{type.toUpperCase()}</text>
        </svg>
      );
    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <path d="M25 40 Q35 25 45 40 M55 40 Q65 25 75 40" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M25 55 Q50 85 75 55 Z" fill="#4E342E" stroke="black" strokeWidth="1" />
          <path d="M15 35 Q5 25 20 15 M85 35 Q95 25 80 15" stroke="#40C4FF" strokeWidth="7" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <path d="M25 45 Q50 40 75 45" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M35 55 Q50 85 65 55 Z" fill="#4E342E" />
          <path d="M30 45 V85 M70 45 V85" stroke="#03A9F4" strokeWidth="10" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <rect x="20" y="35" width="60" height="15" rx="2" fill="#212121" />
          <path d="M30 65 Q50 75 70 65" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <SharpEye cx={35} cy={40} />
          <path d="M60 40 Q65 35 70 40 T80 40" stroke="black" strokeWidth="3" fill="none" />
          <path d="M70 65 Q85 55 70 45 Q55 55 70 65" fill="#FF1744" />
        </svg>
      );
    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fillUrl="url(#gradAnger)" />
          <path d="M25 35 L45 45 M75 35 L55 45" stroke="black" strokeWidth="6" strokeLinecap="round" />
          <SharpEye cx={38} cy={52} />
          <SharpEye cx={62} cy={52} />
          <path d="M35 75 Q50 65 65 75" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <path d="M15 55 Q50 15 85 55" stroke="#F44336" strokeWidth="10" fill="none" />
          <rect x="5" y="50" width="15" height="30" rx="5" fill="#F44336" />
          <rect x="80" y="50" width="15" height="30" rx="5" fill="#F44336" />
          <path d="M40 65 Q50 72 60 65" stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <SharpEye cx={35} cy={45} />
          <SharpEye cx={65} cy={45} />
          <path d="M35 75 Q50 60 65 75" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
    default: return null;
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
   <DialogContent className="sm:max-w-[420px] bg-black/95 border-none p-0 rounded-t-[3rem] overflow-hidden text-white">
    <div className="flex flex-col h-full">
      <div className="mx-auto w-12 h-1 bg-white/20 rounded-full mt-3" />
      <DialogHeader className="p-6 pb-2 text-center">
       <DialogTitle className="text-xl font-bold tracking-tight">REACTION SYNC</DialogTitle>
       <DialogDescription className="text-[10px] uppercase tracking-widest text-white/40">Select a vibe to cover your seat</DialogDescription>
      </DialogHeader>

      <div className="p-6 grid grid-cols-3 gap-y-10 gap-x-4 pb-16">
        {CUSTOM_REACTIONS.map((item) => (
         <button key={item.id} onClick={() => handleSendEmoji(item.id)} className="flex flex-col items-center gap-2 group">
          <div className="h-20 w-20 transition-transform group-hover:scale-110 active:scale-95">
            <Emoji3D type={item.id} />
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase group-hover:text-white transition-colors">
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
