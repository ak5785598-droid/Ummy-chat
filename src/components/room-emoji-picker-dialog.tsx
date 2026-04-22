'use client';

import React from 'react';
import { 
 Dialog, 
 DialogContent, 
 DialogHeader, 
 DialogTitle 
} from '@/components/ui/dialog';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

// --- ULTRA HD 3D EMOJI DESIGNS (UNTOUCHED) ---
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
    case 'giftme':
    case 'welcome':
    case 'thanks':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <circle cx="32" cy="42" r="6" fill="#3E2723" />
          <circle cx="68" cy="42" r="6" fill="#3E2723" />
          <path d="M 42 62 Q 50 68 58 62" stroke="#3E2723" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="14" y="65" width="72" height="20" rx="4" fill="#D32F2F" />
          <text x="50" y="79" fontSize="9" fontWeight="900" fill="white" textAnchor="middle" style={{fontFamily: 'Arial Black'}}>{type === 'giftme' ? 'GIFT ME' : type.toUpperCase()}</text>
          <circle cx="14" cy="75" r="8" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
          <circle cx="86" cy="75" r="8" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );
    case 'irritated':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 25 35 Q 35 32 45 38" stroke="#3E2723" strokeWidth="3" fill="none" />
          <path d="M 55 38 Q 65 32 75 35" stroke="#3E2723" strokeWidth="3" fill="none" />
          <ellipse cx="35" cy="45" rx="6" ry="3" fill="#3E2723" />
          <ellipse cx="65" cy="45" rx="6" ry="3" fill="#3E2723" />
          <circle cx="47" cy="52" r="1.5" fill="#3E2723" />
          <circle cx="53" cy="52" r="1.5" fill="#3E2723" />
          <path d="M 50 82 Q 62 82 62 52" stroke="#FFD54F" strokeWidth="6" strokeLinecap="round" />
          <circle cx="62" cy="52" r="3" fill="#FFD54F" /> 
          <circle cx="50" cy="72" r="4" fill="#3E2723" />
        </svg>
      );
    case 'party':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <circle cx="32" cy="45" r="5" fill="#3E2723" />
          <circle cx="68" cy="45" r="5" fill="#3E2723" />
          <path d="M 45 68 Q 50 72 55 68" stroke="#3E2723" strokeWidth="3" fill="none" />
          <path d="M 50 70 L 85 85 L 85 75 Z" fill="#FF5252" stroke="#B71C1C" strokeWidth="1" />
          <rect x="20" y="20" width="4" height="4" fill="#FF4081" transform="rotate(45)" />
          <rect x="70" y="15" width="4" height="4" fill="#7C4DFF" transform="rotate(20)" />
          <circle cx="50" cy="15" r="2" fill="#00E676" />
        </svg>
      );
    case 'shisha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase />
          <path d="M 30 45 Q 40 38 50 45" stroke="#3E2723" strokeWidth="3" fill="none" />
          <path d="M 60 45 Q 70 38 80 45" stroke="#3E2723" strokeWidth="3" fill="none" />
          <rect x="75" y="40" width="10" height="40" rx="2" fill="#D32F2F" />
          <circle cx="80" cy="40" r="6" fill="#CFD8DC" />
          <path d="M 50 70 Q 60 85 75 60" stroke="#424242" strokeWidth="2" fill="none" />
          <circle cx="50" cy="70" r="6" fill="#3E2723" />
          <circle cx="50" cy="60" r="10" fill="white" opacity="0.6" filter="url(#blurBlush)" />
        </svg>
      );
    case 'laugh':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 22 40 Q 32 30 42 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 58 40 Q 68 30 78 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 25 55 Q 50 95 75 55 Z" fill="#3E2723" />
          <path d="M 30 57 Q 50 65 70 57 Z" fill="white" />
        </svg>
      );
    case 'anger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase anger />
          <path d="M 15 25 L 45 35 M 85 25 L 55 35" stroke="black" strokeWidth="6" strokeLinecap="round" />
          <circle cx="35" cy="48" r="10" fill="white" stroke="black" strokeWidth="1" />
          <circle cx="35" cy="48" r="5" fill="black" />
          <circle cx="65" cy="48" r="10" fill="white" stroke="black" strokeWidth="1" />
          <circle cx="65" cy="48" r="5" fill="black" />
          <path d="M 30 75 Q 50 65 70 75" stroke="black" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'thinking':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <g stroke="#424242" strokeWidth="2" fill="none">
            <circle cx="32" cy="38" r="14" fill="white" stroke="#90A4AE" />
            <path d="M 32 38 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0 m 3 0 a 7 7 0 1 1 14 0" />
            <circle cx="68" cy="38" r="14" fill="white" stroke="#90A4AE" />
            <path d="M 68 38 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0 m 3 0 a 7 7 0 1 1 14 0" />
          </g>
          <path d="M 40 70 Q 50 62 60 70" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 45 92 Q 40 78 55 78 Q 65 78 60 92 Z" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 25 40 Q 35 30 45 40 M 75 40 Q 65 30 55 40" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="35" cy="52" r="11" fill="white" stroke="#29B6F6" strokeWidth="1" />
          <circle cx="35" cy="55" r="8" fill="#29B6F6" opacity="0.6" />
          <circle cx="35" cy="52" r="6" fill="#212121" />
          <circle cx="65" cy="52" r="11" fill="white" stroke="#29B6F6" strokeWidth="1" />
          <circle cx="65" cy="55" r="8" fill="#29B6F6" opacity="0.6" />
          <circle cx="65" cy="52" r="6" fill="#212121" />
          <path d="M 40 80 Q 50 70 60 80" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'proud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {defs}
          <FaceBase blush />
          <path d="M 12 40 Q 20 35 50 38 Q 80 35 88 40 L 82 55 Q 65 60 50 48 Q 35 60 18 55 Z" fill="#212121" />
          <path d="M 25 65 Q 50 85 75 65" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'kissL':
    case 'kissR':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: type === 'kissR' ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase blush />
          <circle cx="32" cy="42" r="6" fill="#3E2723" />
          <circle cx="68" cy="42" r="6" fill="#3E2723" />
          <path d="M 50 55 C 60 52, 60 65, 50 65 C 60 65, 60 78, 50 75" stroke="#5D4037" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 75 35 A 6 6 0 0 1 87 35 A 6 6 0 0 1 99 35 Q 99 45 87 55 Q 75 45 75 35 Z" fill="#FF1744" />
        </svg>
      );
    case 'hitL':
    case 'hitR':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: type === 'hitR' ? 'scaleX(-1)' : 'none' }}>
          {defs}
          <FaceBase anger />
          <path d="M 25 35 L 42 45 M 75 35 L 58 45" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" />
          <circle cx="38" cy="50" r="5" fill="#3E2723" />
          <circle cx="62" cy="50" r="5" fill="#3E2723" />
          <path d="M 40 75 Q 50 68 60 75" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
          <g transform="translate(68, 15) rotate(15)">
            <rect x="8" y="15" width="6" height="25" rx="2" fill="#795548" />
            <rect x="0" y="0" width="22" height="15" rx="3" fill="#424242" />
          </g>
          <circle cx="80" cy="55" r="9" fill="url(#gradFace)" stroke="#E65100" strokeWidth="0.5" />
        </svg>
      );
    default: return null;
  }
};

const REACTIONS = [
  { id: 'giftme', label: 'Gift Me' },
  { id: 'welcome', label: 'Welcome' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'party', label: 'Party' },
  { id: 'shisha', label: 'Shisha' },
  { id: 'irritated', label: 'Irritated' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'anger', label: 'Anger' },
  { id: 'sad', label: 'Sad' },
  { id: 'proud', label: 'Proud' },
  { id: 'kissL', label: 'Kiss L' },
  { id: 'kissR', label: 'Kiss R' },
  { id: 'hitL', label: 'Hit L' },
  { id: 'hitR', label: 'Hit R' },
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
   <DialogContent className="fixed bottom-0 sm:max-w-[400px] bg-black/95 border-t border-yellow-500/30 p-0 rounded-t-[2.5rem] overflow-hidden text-white outline-none shadow-[0_-10px_40px_-15px_rgba(234,179,8,0.3)] translate-y-0 duration-300">
    <div className="flex flex-col h-full">
      {/* Visual Top Handle */}
      <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mt-4 mb-2 flex-shrink-0" />
      
      <DialogHeader className="p-4 pb-0 text-left flex-shrink-0">
       <div className="flex items-center gap-3 ml-2">
         {/* 😃 Smiley SVG Icon */}
         <svg width="32" height="32" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#FFD54F" stroke="#E65100" strokeWidth="2"/>
            <circle cx="35" cy="40" r="5" fill="#3E2723"/>
            <circle cx="65" cy="40" r="5" fill="#3E2723"/>
            <path d="M 30 65 Q 50 80 70 65" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round"/>
         </svg>

         {/* Star Icon with Eyes and Mouth (Custom SVG) */}
         <svg width="36" height="36" viewBox="0 0 100 100">
            <path d="M 50 5 L 63 38 L 98 38 L 70 58 L 80 95 L 50 75 L 20 95 L 30 58 L 2 38 L 37 38 Z" fill="#FFD54F" stroke="#E65100" strokeWidth="2" />
            <circle cx="42" cy="48" r="3.5" fill="#3E2723"/>
            <circle cx="58" cy="48" r="3.5" fill="#3E2723"/>
            <path d="M 44 62 Q 50 66 56 62" stroke="#3E2723" strokeWidth="2" fill="none" strokeLinecap="round"/>
         </svg>
       </div>
       {/* Hidden Title for Accessibility but removed from visual UI */}
       <DialogTitle className="sr-only">Emoji Picker</DialogTitle>
      </DialogHeader>

      {/* Grid Container (REACTIONS Logic untouched) */}
      <div className="h-[340px] overflow-y-auto px-6 py-4 custom-scrollbar">
        <div className="grid grid-cols-3 gap-y-10 gap-x-6 pt-4 pb-12">
          {REACTIONS.map((item) => (
           <button 
             key={item.id} 
             onClick={() => handleSendEmoji(item.id)} 
             className="flex flex-col items-center gap-2 group transition-all active:scale-90"
           >
            <div className="h-16 w-16 drop-shadow-2xl group-hover:scale-110 duration-200">
              <EmojiHD type={item.id} />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter group-hover:text-yellow-400 transition-colors">
              {item.label}
            </span>
           </button>
          ))}
        </div>
      </div>
    </div>
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234,179,8,0.3); border-radius: 10px; }
    `}</style>
   </DialogContent>
  </Dialog>
 );
}
