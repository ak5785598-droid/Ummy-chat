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
  occupantName?: string | null;
  occupantAvatarUrl?: string | null;
  canManage: boolean;
  currentUserId?: string;
  onLeaveSeat: (uid: string) => void;
  onKick: (uid: string, duration: number) => void;
  onSendGift?: (recipient: { uid: string; name: string; avatarUrl?: string }) => void;
}

/**
 * High-Fidelity Room Seat Menu.
 * Standardizes administrative labels: "Take mic", "Lock mic", "Invite to mic".
 */
export function RoomSeatMenuDialog({
  open,
  onOpenChange,
  seatIndex,
  roomId,
  isLocked,
  occupantUid,
  occupantName,
  occupantAvatarUrl,
  canManage,
  currentUserId,
  onLeaveSeat,
  onKick,
  onSendGift
}: RoomSeatMenuDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  if (seatIndex === null) return null;

  const handleTakeSeat = () => {
    if (!firestore || !currentUserId || !roomId) return;
    
    const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', currentUserId);
    setDocumentNonBlocking(participantRef, {
      seatIndex: seatIndex,
      isMuted: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    toast({ title: 'Seat Taken' });
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
          {(!occupantUid && (!isLocked || canManage)) && (
            <MenuItem label="Take mic" onClick={handleTakeSeat} />
          )}

          {canManage && (
            <MenuItem label="Invite to mic" onClick={() => { toast({ title: 'Invite Sent' }); onOpenChange(false); }} />
          )}

          {canManage && (
            <MenuItem 
              label={isLocked ? "Unlock mic" : "Lock mic"} 
              onClick={handleToggleLock}
            />
          )}

          {(canManage && occupantUid && occupantUid !== currentUserId) && (
            <MenuItem 
              label="Kick out" 
              onClick={() => onKick(occupantUid, 5)} 
              className="text-red-500" 
            />
          )}

          {(occupantUid && (occupantUid === currentUserId || canManage)) && (
            <MenuItem 
              label="Seat leave" 
              onClick={() => onLeaveSeat(occupantUid)} 
              className="text-orange-600" 
            />
          )}

          {canManage && (
            <MenuItem label="Mute" onClick={() => { toast({ title: 'Mute Frequency' }); onOpenChange(false); }} />
          )}

          {(occupantUid && onSendGift) && (
            <MenuItem 
              label="Send gift" 
              className="text-pink-600"
              onClick={() => {
                onSendGift({
                  uid: occupantUid,
                  name: occupantName || 'Tribe Member',
                  avatarUrl: occupantAvatarUrl || ''
                });
                onOpenChange(false);
              }} 
            />
          )}

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