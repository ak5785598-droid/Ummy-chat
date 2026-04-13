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
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Lock, Unlock, Mic, MicOff, LogOut, Gift } from 'lucide-react';

interface RoomSeatMenuDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 seatIndex: number | null;
 roomId: string;
 isLocked: boolean;
 isSeatMuted?: boolean;
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
 onTakeSeat: (seatIndex: number) => void;
 onToggleLock: (seatIndex: number, isLocked: boolean) => void;
 onToggleMute?: (uid: string, isMuted: boolean) => void;
 onToggleSeatMute?: (seatIndex: number, isMuted: boolean) => void;
 onSendGift?: (recipient: { uid: string; name: string; avatarUrl?: string }) => void;
 onOpenAudienceInvite?: () => void;
}

/**
 * Standard MenuItem for the Seat Dialoag.
 * Defined outside the main component to prevent event disconnection on re-render.
 */
const MenuItem = ({ label, icon: Icon, onClick, className, disabled }: { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean 
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    disabled={disabled}
    className={cn(
      "flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none",
      className
    )}
  >
    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100/50 shadow-sm">
      <Icon className="w-5 h-5 text-slate-600" />
    </div>
    <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{label}</span>
  </button>
);

/**
 * High-Fidelity Room Seat Menu.
 */
export function RoomSeatMenuDialog({
 open,
 onOpenChange,
 seatIndex,
 roomId,
 isLocked,
 isSeatMuted,
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
 onTakeSeat,
 onToggleLock,
 onToggleMute,
 onToggleSeatMute,
 onSendGift,
 onOpenAudienceInvite
}: RoomSeatMenuDialogProps) {
 if (seatIndex === null) return null;

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[300px] bg-white text-black p-4 rounded-[28px] border-none shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-200">
    <DialogHeader className="sr-only">
     <DialogTitle>Seat Options</DialogTitle>
     <DialogDescription>Manage seat frequency for slot {seatIndex}</DialogDescription>
    </DialogHeader>

    <div className="flex flex-col gap-4">
     {/* Grid Row: Max 4 buttons */}
     <div className="grid grid-cols-4 gap-2">
      {/* 1. Take mic / Leave seat */}
      {(!occupantUid && (!isLocked || canManage)) ? (
       <MenuItem label="Take mic" icon={Mic} onClick={() => onTakeSeat(seatIndex)} />
      ) : (occupantUid && (occupantUid === currentUserId || canManage)) ? (
       <MenuItem label="Leave" icon={LogOut} onClick={() => onLeaveSeat(occupantUid)} className="text-orange-600" />
      ) : (
       <div />
      )}

      {/* 2. Invite - Anyone can invite audience */}
      <MenuItem label="Invite" icon={UserPlus} onClick={() => { onOpenChange(false); onOpenAudienceInvite?.(); }} />

      {/* 3. Lock/Unlock (Admin Only) */}
      {canManage ? (
       <MenuItem 
        label={isLocked ? "Unlock" : "Lock"} 
        icon={isLocked ? Unlock : Lock}
        onClick={() => onToggleLock(seatIndex, isLocked)}
       />
      ) : (
       <div />
      )}

      {/* 4. Mute Seat (Admin Only) */}
      {canManage ? (
       <MenuItem 
        label={isSeatMuted ? "Unmute" : "Mute"} 
        icon={isSeatMuted ? Mic : MicOff}
        onClick={() => onToggleSeatMute && onToggleSeatMute(seatIndex, !!isSeatMuted)}
        className={isSeatMuted ? "text-green-600" : "text-red-500"}
       />
      ) : (
       <div />
      )}
     </div>

     {/* Lower Priority Options (only if occupant) */}
     {canManage && occupantUid && (
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-50">
       <MenuItem 
        label="Kick" 
        icon={LogOut}
        onClick={() => onKick(occupantUid, 5)} 
        className="text-red-500" 
       />
       {onSendGift && (
        <MenuItem 
         label="Gift" 
         icon={Gift}
         className="text-pink-600"
         onClick={() => {
          onSendGift({ uid: occupantUid, name: occupantName || 'Tribe Member', avatarUrl: occupantAvatarUrl || '' });
          onOpenChange(false);
         }} 
        />
       )}
      </div>
     )}
    </div>
   </DialogContent>
  </Dialog>
 );
}
