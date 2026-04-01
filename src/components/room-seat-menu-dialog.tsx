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
import { UserPlus, Lock, Unlock, Mic, MicOff, LogOut, Gift, X, Power } from 'lucide-react';

interface RoomSeatMenuDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 seatIndex: number | null;
 roomId: string;
 isLocked: boolean;
 occupantUid?: string | null;
 occupantName?: string | null;
 occupantAvatarUrl?: string | null;
 isMuted?: boolean;
 canManage: boolean;
 currentUserId?: string;
 currentUserName?: string | null;
 currentUserAvatarUrl?: string | null;
 onLeaveSeat: (uid: string) => void;
 onKick: (uid: string, duration: number) => void;
 onToggleMute?: (uid: string, isMuted: boolean) => void;
 onSendGift?: (recipient: { uid: string; name: string; avatarUrl?: string }) => void;
 onOpenAudienceInvite?: () => void;
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
 isMuted,
 canManage,
 currentUserId,
 currentUserName,
 currentUserAvatarUrl,
 onLeaveSeat,
 onKick,
 onToggleMute,
 onSendGift,
 onOpenAudienceInvite
}: RoomSeatMenuDialogProps) {
 const firestore = useFirestore();
 const { toast } = useToast();

 if (seatIndex === null) return null;

 const handleTakeSeat = () => {
  console.log('[SeatMenu] handleTakeSeat START:', { firestore: !!firestore, currentUserId, roomId, seatIndex, currentUserName });
  
  if (!firestore) {
    console.error('[SeatMenu] ERROR: firestore is null!');
    toast({ title: 'Error', description: 'Firestore not initialized', variant: 'destructive' });
    return;
  }
  if (!currentUserId) {
    console.error('[SeatMenu] ERROR: currentUserId is missing!');
    toast({ title: 'Error', description: 'User not logged in', variant: 'destructive' });
    return;
  }
  if (!roomId) {
    console.error('[SeatMenu] ERROR: roomId is missing!');
    toast({ title: 'Error', description: 'Room ID missing', variant: 'destructive' });
    return;
  }
  
  const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', currentUserId);
  console.log('[SeatMenu] Creating participant at:', `chatRooms/${roomId}/participants/${currentUserId}`);
  console.log('[SeatMenu] Participant data:', { seatIndex, isMuted: false, name: currentUserName });
  
  setDocumentNonBlocking(participantRef, {
   seatIndex: seatIndex,
   isMuted: false,
   name: currentUserName || 'Tribe Member',
   avatarUrl: currentUserAvatarUrl || null,
   uid: currentUserId,
   updatedAt: serverTimestamp()
  }, { merge: true });
  
  console.log('[SeatMenu] SUCCESS: Participant created!');
  toast({ title: 'Seat Taken', description: 'You are now on mic' });
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

 const MenuItem = ({ label, icon: Icon, onClick, className, disabled }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void; className?: string; disabled?: boolean }) => (
  <button
   onClick={onClick}
   disabled={disabled}
   className={cn(
    "flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none",
    className
   )}
  >
   <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
    <Icon className="w-4 h-4 text-gray-700" />
   </div>
   <span className="text-[9px] font-medium text-gray-600 whitespace-nowrap">{label}</span>
  </button>
 );

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="w-[200px] max-w-[200px] bg-white text-black p-1.5 rounded-md border-none shadow-2xl overflow-hidden font-sans">
    <DialogHeader className="sr-only">
     <DialogTitle>Seat Options</DialogTitle>
     <DialogDescription>Manage seat frequency for slot {seatIndex}</DialogDescription>
    </DialogHeader>

    {/* Wafa-style compact rectangular grid - always 4 buttons */}
    <div className="grid grid-cols-4 gap-1">
     {/* Always show Take mic for empty seat or Leave for occupied */}
     {(!occupantUid && (!isLocked || canManage)) && (
      <MenuItem label="Take mic" icon={Mic} onClick={handleTakeSeat} />
     )}

     {canManage && (
      <MenuItem label="Invite" icon={UserPlus} onClick={() => { onOpenChange(false); onOpenAudienceInvite?.(); }} />
     )}

     {canManage && (
      <MenuItem 
       label={isLocked ? "Unlock" : "Lock"} 
       icon={isLocked ? Unlock : Lock}
       onClick={handleToggleLock}
      />
     )}

     {/* 4th button: Mute/Unmute toggle - shows Mute when mic open, Unmute when mic muted */}
     {canManage && occupantUid && (
      <MenuItem 
       label={isMuted ? "Unmute" : "Mute"} 
       icon={isMuted ? Mic : MicOff}
       onClick={() => { onToggleMute?.(occupantUid, !!isMuted); onOpenChange(false); }}
       className={isMuted ? "text-green-600" : "text-red-500"}
      />
     )}
     {/* Empty placeholder for 4th position when no occupant - maintains grid layout */}
     {canManage && !occupantUid && (
      <div className="flex flex-col items-center gap-1 p-1.5">
       <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
        <Mic className="w-4 h-4 text-gray-300" />
       </div>
       <span className="text-[9px] font-medium text-gray-300 whitespace-nowrap">Mute</span>
      </div>
     )}

     {(canManage && occupantUid && occupantUid !== currentUserId) && (
      <MenuItem 
       label="Kick" 
       icon={LogOut}
       onClick={() => onKick(occupantUid, 5)} 
       className="text-red-500" 
      />
     )}

     {(occupantUid && (occupantUid === currentUserId || canManage)) && (
      <MenuItem 
       label="Leave" 
       icon={LogOut}
       onClick={() => onLeaveSeat(occupantUid)} 
       className="text-orange-600" 
      />
     )}

     {(occupantUid && onSendGift) && (
      <MenuItem 
       label="Gift" 
       icon={Gift}
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
    </div>
   </DialogContent>
  </Dialog>
 );
}