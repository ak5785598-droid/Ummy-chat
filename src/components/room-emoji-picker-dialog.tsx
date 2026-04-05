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

// --- HYPER-DETAILED 3D EMOJI COMPONENTS (EXACT FACE MATCH FOCUS) ---

const Emoji3D = ({ type }: { type: string }) => {
  const defs = (
    <defs>
      {/* Premium Multi-Stage Sphere Gradient */}
      <radialGradient id="gradSphere" cx="40%" cy="30%" r="70%" fx="30%" fy="25%">
        <stop offset="0%" stopColor="#FFF9C4" /> {/* Center Bright Point */}
        <stop offset="50%" stopColor="#FFD600" /> {/* Base Yellow */}
        <stop offset="85%" stopColor="#F57C00" /> {/* Shade */}
        <stop offset="100%" stopColor="#AF4400" /> {/* Deep Outer Rim */}
      </radialGradient>

      {/* Glassy Gloss Layer for surface shine */}
      <linearGradient id="shineTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="30%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* **NEW FILTER FOR REALDEPTH FACE FEATURES** - THIS MAKES FACE FEATURES PERFECT */}
      <filter id="detailedFaceInclusion" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="blur"/>
        <feOffset dx="0" dy="0.8" result="offsetBlur"/>
        <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/>
      </filter>

      {/* Red Sphere for Anger */}
      <radialGradient id="gradRed" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FF8A80" />
        <stop offset="70%" stopColor="#E53935" />
        <stop offset="100%" stopColor="#B71C1C" />
      </radialGradient>
    </defs>
  );

  const FaceBase = ({ fillUrl }: { fillUrl: string }) => (
    <>
      <circle cx="50" cy="50" r="46" fill={fillUrl} stroke="#000" strokeWidth="0.5" strokeOpacity="0.05" />
      <circle cx="50" cy="50" r="46" fill="url(#shineTop)" />
    </>
  );

  const DetailedEye = ({ cx, cy }: { cx: number, cy: number }) => (
    <circle cx={cx} cy={cy} r="4" fill="#311F11" stroke="#4A2E19" strokeWidth="0.5" filter="url(#detailedFaceInclusion)" />
  );

  switch (type) {
    case 'welcome':
    case 'thanks':
      const isWelcome = type === 'welcome';
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          {/* Detailed Eyebrows and Mouth with Deep Face Depth */}
          <path d="M28 42 Q36 38 43 42" stroke="#311F11" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
          <path d="M57 42 Q64 38 72 42" stroke="#311F11" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
          <path d="M40 50 Q50 56 60 50" stroke="#311F11" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Banner with inner shadow & realistic curve from Image 1 */}
          <rect x="7" y="58" width="86" height="24" rx="12" fill={isWelcome ? "#E91E63" : "#EC407A"} stroke="#880E4F" strokeWidth="0.5" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))" />
          <text x="50" y="74" fontSize="10" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'system-ui, sans-serif' }}>{isWelcome ? 'WELCOME' : 'THANKS'}</text>
        </svg>
      );
    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <path d="M20 40 L35 48 M80 40 L65 48" stroke="#311F11" strokeWidth="6" strokeLinecap="round" />
          {/* Deep Mouth with shaded rim */}
          <path d="M28 58 Q50 85 72 58 Z" fill="#311F11" filter="url(#detailedFaceInclusion)" />
          {/* Realistic Bright Tears from 1st Image */}
          <path d="M15 35 Q5 20 20 12 M85 35 Q95 20 80 12" stroke="#00E5FF" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>
      );
    case 'cry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <path d="M30 42 L42 42 M58 42 L70 42" stroke="#311F11" strokeWidth="6" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
          {/* Saturated Deep Tears Pools */}
          <rect x="33" y="48" width="10" height="38" rx="5" fill="#00B0FF" stroke="#0277BD" strokeWidth="1" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
          <rect x="57" y="48" width="10" height="38" rx="5" fill="#00B0FF" stroke="#0277BD" strokeWidth="1" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
        </svg>
      );
    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <path d="M18 38 H82 V55 Q75 60 65 60 T50 55 T35 60 T20 60 V38 Z" fill="#263238" stroke="black" strokeWidth="0.5" filter="url(#detailedFaceInclusion)" />
          <path d="M35 70 Q50 80 65 70" stroke="#311F11" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
        </svg>
      );
    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <path d="M28 42 Q36 36 43 42" stroke="#311F11" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
          <path d="M57 42 Q64 36 72 42" stroke="#311F11" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
          <path d="M45 65 Q50 69 55 65" stroke="#311F11" strokeWidth="3" fill="none" filter="url(#detailedFaceInclusion)" />
          {/* Realistic Deep Red Heart from Image 1 */}
          <path d="M72 65 Q85 55 72 45 Q59 55 72 65" fill="#E91E63" stroke="#880E4F" strokeWidth="0.5" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
        </svg>
      );
    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradRed)" />
          <path d="M25 35 L48 48 M75 35 L52 48" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <path d="M32 75 Q50 60 68 75" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          {/* Curved Pink Headphones with inner depth from Image 1 */}
          <path d="M15 50 Q50 10 85 50" stroke="#EC407A" strokeWidth="9" fill="none" strokeLinecap="round" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
          <rect x="8" y="45" width="16" height="32" rx="8" fill="#EC407A" stroke="#880E4F" strokeWidth="0.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
          <rect x="76" y="45" width="16" height="32" rx="8" fill="#EC407A" stroke="#880E4F" strokeWidth="0.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
          <path d="M40 70 Q50 78 60 70" stroke="#311F11" strokeWidth="3.5" fill="none" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {defs}
          <FaceBase fillUrl="url(#gradSphere)" />
          <DetailedEye cx={35} cy={45} />
          <DetailedEye cx={65} cy={45} />
          <path d="M35 75 Q50 60 65 75" fill="none" stroke="#311F11" strokeWidth="5.5" strokeLinecap="round" filter="url(#detailedFaceInclusion)" />
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
   <DialogContent className="sm:max-w-[420px] bg-[#0A0A0A]/95 backdrop-blur-3xl border border-white/10 p-0 rounded-t-[3.5rem] overflow-hidden text-white shadow-2xl transition-all">
    <div className="flex flex-col h-full">
      {/* Visual Handle */}
      <div className="mx-auto w-14 h-1.5 bg-white/30 rounded-full mt-4" />
      
      <DialogHeader className="p-8 pb-2 text-center">
       <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white/95">REACTION SYNC</DialogTitle>
       <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Select a vibe to cover your seat</DialogDescription>
      </DialogHeader>

      <div className="p-6 grid grid-cols-3 gap-y-12 gap-x-6 pb-20 max-h-[75vh] overflow-y-auto scrollbar-hide">
        {CUSTOM_REACTIONS.map((item) => (
         <button 
          key={item.id} 
          onClick={() => handleSendEmoji(item.id)}
          className="flex flex-col items-center gap-3 group outline-none"
         >
          <div className="h-24 w-24 flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-120 group-active:scale-90 group-hover:-translate-y-3">
            <Emoji3D type={item.id} />
          </div>
          <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.15em] group-hover:text-yellow-400 group-hover:scale-110 transition-all">
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
