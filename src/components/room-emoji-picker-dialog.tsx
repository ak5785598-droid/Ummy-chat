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

// --- ULTIMATE 3D EMOJI COMPONENTS ---

const EmojiHD = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* Realistic Gold Gradient */}
      <radialGradient id="gradBody" cx="45%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="60%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#F57F17" />
      </radialGradient>
      
      {/* 3D Glossy Shine */}
      <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.7" />
        <stop offset="45%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Anger Red Gradient */}
      <radialGradient id="gradAnger" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>

      {/* Shadow for Depth */}
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
        <feOffset dx="0" dy="1.5" />
        <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  );

  const FaceBase = ({ anger = false }) => (
    <>
      <circle cx="50" cy="50" r="46" fill={anger ? "url(#gradAnger)" : "url(#gradBody)"} stroke={anger ? "#8B0000" : "#E65100"} strokeWidth="0.5" />
      <circle cx="50" cy="48" r="42" fill="url(#shine)" />
    </>
  );

  const RealisticEye = ({ cx, cy, watery = false }: { cx: number, cy: number, watery?: boolean }) => (
    <g filter="url(#softShadow)">
      <circle cx={cx} cy={cy} r="7.5" fill="white" />
      <circle cx={cx} cy={cy} r="4.5" fill="black" />
      <circle cx={cx - 1.8} cy={cy - 1.8} r="1.8" fill="white" />
      {watery && <path d={`M${cx-4} ${cy+3} Q${cx} ${cy+6} ${cx+4} ${cy+3}`} stroke="white" strokeWidth="1" fill="none" opacity="0.8"/>}
    </g>
  );

  const Hand = ({ x, y }: { x: number, y: number }) => (
    <g filter="url(#softShadow)">
      <circle cx={x} cy={y} r="7.5" fill="url(#gradBody)" stroke="#E65100" strokeWidth="0.5" />
      <path d={`M${x-3} ${y-1} Q${x} ${y+2} ${x+3} ${y-1}`} stroke="#E65100" fill="none" strokeWidth="1" />
    </g>
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase />
          <RealisticEye cx={35} cy={38} />
          <RealisticEye cx={65} cy={38} />
          <path d="M42 52 Q50 58 58 52" stroke="#4E342E" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="8" y="58" width="84" height="22" rx="4" fill="#D32F2F" stroke="#8B0000" strokeWidth="1" />
          <text x="50" y="73" fontSize="8" fontWeight="1000" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type.toUpperCase()}</text>
          <Hand x={15} y={75} />
          <Hand x={85} y={75} />
        </svg>
      );

    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M22 38 Q35 20 48 38 M52 38 Q65 20 78 38" stroke="#4E342E" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M20 50 Q50 95 80 50 Z" fill="#4E342E" />
          <path d="M28 52 Q50 64 72 52" fill="white" /> {/* Upper Teeth */}
          <path d="M15 35 Q5 25 18 10 M85 35 Q95 25 82 10" stroke="#40C4FF" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M25 45 Q50 35 75 45" stroke="#4E342E" strokeWidth="7" strokeLinecap="round" />
          <path d="M35 60 Q50 90 65 60 Z" fill="#4E342E" />
          <rect x="28" y="45" width="10" height="42" rx="5" fill="#03A9F4" opacity="0.8" />
          <rect x="62" y="45" width="10" height="42" rx="5" fill="#03A9F4" opacity="0.8" />
        </svg>
      );

    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M15 30 H85 L80 48 H20 Z" fill="#1A1A1A" filter="url(#softShadow)" /> {/* Sunglasses */}
          <path d="M28 65 Q50 82 72 65" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M35 67 Q50 75 65 67" fill="white" opacity="0.9" /> {/* Teeth peek */}
        </svg>
      );

    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <RealisticEye cx={32} cy={40} />
          <path d="M60 40 Q65 35 70 40 T80 40" stroke="black" strokeWidth="3" fill="none" />
          <path d="M68 75 Q88 65 68 50 Q48 65 68 75" fill="#FF1744" filter="url(#softShadow)" />
          <circle cx={40} cy={70} r="5" fill="#D32F2F" opacity="0.8" /> {/* Kiss Pought */}
        </svg>
      );

    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase anger />
          <path d="M20 28 L45 42 M80 28 L55 42" stroke="black" strokeWidth="8" strokeLinecap="round" />
          <RealisticEye cx={36} cy={55} />
          <RealisticEye cx={64} cy={55} />
          <path d="M30 82 Q50 68 70 82" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          {/* Headphones on TOP */}
          <path d="M12 45 Q50 -10 88 45" stroke="#D32F2F" strokeWidth="10" fill="none" />
          <rect x="5" y="42" width="18" height="30" rx="6" fill="#212121" />
          <rect x="77" y="42" width="18" height="30" rx="6" fill="#212121" />
          <RealisticEye cx={35} cy={52} />
          <RealisticEye cx={65} cy={52} />
          <path d="M42 70 Q50 78 58 70" stroke="#4E342E" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <RealisticEye cx={35} cy={48} watery />
          <RealisticEye cx={65} cy={48} watery />
          <path d="M30 80 Q50 62 70 80" stroke="#4E342E" strokeWidth="6" fill="none" strokeLinecap="round" />
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
   <DialogContent className="sm:max-w-[360px] bg-black/95 border-none p-0 rounded-t-[3rem] overflow-hidden text-white outline-none">
    <div className="flex flex-col h-full">
      <div className="mx-auto w-10 h-1 bg-white/20 rounded-full mt-3" />
      <DialogHeader className="p-6 pb-2 text-center">
       <DialogTitle className="text-2xl font-black tracking-widest italic">EMOJIS</DialogTitle>
       <DialogDescription className="text-[9px] uppercase tracking-[0.2em] text-white/40">Select a vibe to cover your seat</DialogDescription>
      </DialogHeader>

      <div className="p-6 grid grid-cols-3 gap-y-10 gap-x-4 pb-12">
        {CUSTOM_REACTIONS.map((item) => (
         <button key={item.id} onClick={() => handleSendEmoji(item.id)} className="flex flex-col items-center gap-3 group transition-transform active:scale-90">
          <div className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-2xl group-hover:scale-110 duration-200">
            <EmojiHD type={item.id} />
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase group-hover:text-yellow-400">
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
