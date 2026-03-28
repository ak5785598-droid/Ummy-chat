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

const REACTIONS = ['😀', '😂', '😘', '🥰', '😎', '🤗', '😡', '😭', '💋', '😤', '👊', '😱' ];

interface RoomEmojiPickerDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 roomId: string;
}

/**
 * High-Fidelity Emoji Picker Dialog.
 * Allows tribe members to dispatch animated reactions that cover their seat.
 */
export function RoomEmojiPickerDialog({ open, onOpenChange, roomId }: RoomEmojiPickerDialogProps) {
 const { user } = useUser();
 const firestore = useFirestore();

 const handleSendEmoji = (emoji: string) => {
  if (!firestore || !roomId || !user) return;
  
  const pRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
  updateDocumentNonBlocking(pRef, { activeEmoji: emoji, updatedAt: serverTimestamp() });
  
  // Auto-clear active emoji after 5 seconds for visual focus
  setTimeout(() => {
   updateDocumentNonBlocking(pRef, { activeEmoji: null });
  }, 5000);
  
  onOpenChange(false);
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[350px] bg-[#121212]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-sans shadow-2xl animate-in slide-in-from-bottom-full duration-500">
    <DialogHeader className="p-6 pb-2">
     <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white/90">Reaction Sync</DialogTitle>
     <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-white/40">Select a vibe to cover your seat</DialogDescription>
    </DialogHeader>
    <div className="p-6 grid grid-cols-3 gap-4 pb-12">
      {REACTIONS.map((emoji) => (
       <button 
        key={emoji} 
        onClick={() => handleSendEmoji(emoji)}
        className="h-20 w-20 rounded-3xl bg-white/5 border-2 border-white/10 flex items-center justify-center text-5xl hover:bg-white/10 active:scale-90 transition-all shadow-xl"
       >
        {emoji}
       </button>
      ))}
    </div>
   </DialogContent>
  </Dialog>
 );
}
