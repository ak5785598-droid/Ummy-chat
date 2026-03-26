'use client';

import { X, LogOut, Minimize2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ExitRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  onMinimize: () => void;
}

/**
 * Custom Exit Dialog for Voice Rooms
 * Intercepts the back button to offer Minimize vs Exit.
 */
export function ExitRoomDialog({ isOpen, onClose, onConfirmExit, onMinimize }: ExitRoomDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] bg-gradient-to-br from-[#1a0b2e] to-[#2d0b4a] border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <DialogHeader className="flex flex-col items-center space-y-6">
          <div className="h-20 w-20 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
             <LogOut className="h-10 w-10 text-[#FFCC00]" />
          </div>
          <div className="space-y-2 text-center">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">
              Leaving the Frequency?
            </DialogTitle>
            <DialogDescription className="text-white/60 font-medium">
              You can exit completely or minimize the room to keep the audio playing while you use other apps.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-8">
          <button
            onClick={onMinimize}
            className="w-full h-16 rounded-2xl bg-[#FFCC00] text-black font-black uppercase tracking-wide flex items-center justify-center gap-3 shadow-[0_8px_0_#CCAA00] active:translate-y-1 active:shadow-none transition-all"
          >
            <Minimize2 className="h-5 w-5" />
            Minimize Room
          </button>
          
          <button
            onClick={onConfirmExit}
            className="w-full h-16 rounded-2xl bg-white/5 text-white/70 font-bold uppercase tracking-wide border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 mt-2"
          >
            <LogOut className="h-5 w-5" />
            Exit Completely
          </button>

          <button
            onClick={onClose}
            className="w-full h-12 text-sm font-semibold text-white/30 hover:text-white transition-colors"
          >
            Stay in Room
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
