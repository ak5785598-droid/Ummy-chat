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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { RoomParticipant } from '@/lib/types';
import { UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoomAudienceInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seatIndex: number | null;
  roomId: string;
  participants: RoomParticipant[];
  inviterName: string;
  inviterAvatar?: string;
  inviterId: string;
}

/**
 * Audience Invite Dialog - Wafa Style
 * Shows audience members (not on seats) and allows inviting them to a specific seat
 */
export function RoomAudienceInviteDialog({
  open,
  onOpenChange,
  seatIndex,
  roomId,
  participants,
  inviterName,
  inviterAvatar,
  inviterId
}: RoomAudienceInviteDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  if (seatIndex === null) return null;

  // Filter audience - users in room but not on any seat (seatIndex is 0 or undefined)
  const audience = participants.filter(p => !p.seatIndex || p.seatIndex === 0);

  const handleInvite = async (user: RoomParticipant) => {
    if (!firestore || !roomId) return;

    // Create invitation notification
    await addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
      content: `${inviterName} invited you to join mic on seat #${seatIndex}`,
      senderId: 'SYSTEM_BOT',
      senderName: 'Ummy Chat',
      senderAvatar: 'https://img.icons8.com/isometric/512/invite.png',
      type: 'mic_invite',
      timestamp: serverTimestamp(),
      targetUid: user.uid,
      targetSeatIndex: seatIndex,
      inviterId: inviterId,
      inviterName: inviterName,
      inviterAvatar: inviterAvatar,
      processed: false
    });

    toast({ 
      title: 'Invite Sent', 
      description: `Invited ${user.name || 'User'} to seat #${seatIndex}` 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] bg-white text-black p-0 rounded-t-2xl border-none shadow-2xl overflow-hidden font-sans animate-in slide-in-from-bottom-full duration-300">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-800">
              Invite audience to Mic
            </DialogTitle>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <DialogDescription className="text-xs text-gray-500">
            Select a user to invite to seat #{seatIndex}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto">
          {audience.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <UserPlus className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">No audience in the room</p>
              <p className="text-xs text-gray-400 mt-1">Users not on seats will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {audience.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => handleInvite(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Avatar 
                    className="h-10 w-10 cursor-pointer active:scale-90 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/${user.uid}`);
                    }}
                  >
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                      {(user.name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400">Tap to invite</p>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <UserPlus className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
