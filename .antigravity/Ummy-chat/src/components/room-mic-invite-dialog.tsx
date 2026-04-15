'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Mic, X, Check } from 'lucide-react';

interface RoomMicInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviterName: string;
  inviterAvatar?: string;
  targetSeatIndex: number;
  roomId: string;
  onAccept: (seatIndex: number) => void;
  onReject: () => void;
}

/**
 * Mic Invitation Dialog - Shows when user is invited to take a seat
 * Auto-closes after 10 seconds with countdown
 */
export function RoomMicInviteDialog({
  open,
  onOpenChange,
  inviterName,
  inviterAvatar,
  targetSeatIndex,
  roomId,
  onAccept,
  onReject
}: RoomMicInviteDialogProps) {
  const [countdown, setCountdown] = useState(10);
  const { toast } = useToast();

  // Reset countdown when dialog opens
  useEffect(() => {
    if (open) {
      setCountdown(10);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!open || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto close when countdown reaches 0
          onOpenChange(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, countdown, onOpenChange]);

  const handleAccept = () => {
    onAccept(targetSeatIndex);
    onOpenChange(false);
    toast({
      title: 'Seat Accepted',
      description: `You are now on seat #${targetSeatIndex}`
    });
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
    toast({
      title: 'Invitation Declined',
      description: 'You can take a seat anytime later'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] bg-white text-black p-0 rounded-2xl border-none shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-200">
        <DialogHeader className="sr-only">
          <DialogTitle>Mic Invitation</DialogTitle>
          <DialogDescription>You have been invited to take a seat</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center pt-6 pb-5 px-6">
          {/* Inviter Avatar */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={inviterAvatar || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                {(inviterName || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Inviter Name */}
          <h3 className="mt-3 text-lg font-bold text-gray-900">
            {inviterName || 'User'}
          </h3>

          {/* Invitation Message */}
          <p className="mt-2 text-sm text-gray-600 text-center leading-relaxed">
            inviting you to take mic and chat
          </p>

          {/* Seat Info */}
          <div className="mt-3 px-3 py-1.5 bg-primary/10 rounded-full">
            <span className="text-xs font-medium text-primary">
              Seat #{targetSeatIndex}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={handleReject}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm hover:bg-gray-200 active:scale-95 transition-all"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Agree ({countdown}s)
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
