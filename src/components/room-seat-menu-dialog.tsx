'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface RoomSeatMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seatIndex: number | null;
  roomId: string;
  isLocked: boolean;
  occupantUid?: string | null;
  canManage: boolean;
  currentUserId?: string;
  onLeaveSeat: (uid: string) => void;
}

/**
 * High-Fidelity Room Seat Menu.
 * Re-engineered to match the provided tribal blueprint exactly.
 * Features absolute seat synchronization and Leave/Take logic.
 */
export function RoomSeatMenuDialog({
  open,
  onOpenChange,
  seatIndex,
  roomId,
  isLocked,
  occupantUid,
  canManage,
  currentUserId,
  onLeaveSeat
}: RoomSeatMenuDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  if (seatIndex === null) return null;

  const handleTakeSeat = () => {
    if (!firestore || !currentUserId || !roomId) return;
    
    // ATOMIC SYNC: Explicitly setting document to ensure the user takes the frequency slot
    const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', currentUserId);
    setDocumentNonBlocking(participantRef, {
      seatIndex: seatIndex,
      isMuted: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    toast({ title: 'Seat Taken', description: `Synchronized to position ${seatIndex}.` });
    onOpenChange(false);
  };

  const handleToggleLock = () => {
    if (!firestore || !roomId) return;
    
    const roomRef = doc(firestore, 'chatRooms', roomId);
    setDocumentNonBlocking(roomRef, {
      lockedSeats: isLocked ? arrayRemove(seatIndex) : arrayUnion(seatIndex),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    toast({ title: isLocked ? 'Mic Unlocked' : 'Mic Locked' });
    onOpenChange(false);
  };

  const MenuItem = ({ label, onClick, className }: { label: string; onClick?: () => void; className?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full py-5 text-center text-[17px] font-black tracking-tight text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0",
        className
      )}
    >
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black p-0 rounded-t-[2.5rem] border-none shadow-2xl overflow-hidden font-headline animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Seat Options</DialogTitle>
          <DialogDescription>Manage seat frequency for slot {seatIndex}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center">
          {/* Blueprint: Take Action - Show if empty and not locked (or admin) */}
          {(!occupantUid && (!isLocked || canManage)) && (
            <MenuItem label="Take" onClick={handleTakeSeat} />
          )}

          {/* Blueprint: Leave Action - Show if current user is the occupant */}
          {(occupantUid === currentUserId) && (
            <MenuItem label="Leave seat" onClick={() => onLeaveSeat(currentUserId)} className="text-red-500" />
          )}

          {/* Blueprint: Invite Action */}
          <MenuItem label="Invite" onClick={() => { toast({ title: 'Invite Frequency' }); onOpenChange(false); }} />

          {/* Blueprint: Mute Action */}
          <MenuItem label="Mute" onClick={() => { toast({ title: 'Mute Frequency' }); onOpenChange(false); }} />

          {/* Blueprint: Lock/Unlock Toggle */}
          {canManage && (
            <MenuItem 
              label={isLocked ? "Unlock the mic" : "Lock the mic"} 
              onClick={handleToggleLock}
            />
          )}

          {/* Blueprint: Cancel Action with clear separation */}
          <MenuItem 
            label="Cancel" 
            onClick={() => onOpenChange(false)} 
            className="text-gray-400 font-bold border-t-[6px] border-gray-50 mt-1" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
