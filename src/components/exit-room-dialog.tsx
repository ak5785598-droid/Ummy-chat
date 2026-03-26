'use client';

import { X, LogOut, Minimize2, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExitRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  onMinimize: () => void;
}

/**
 * Haza-Style Exit Overlay
 * Large circular buttons for Keep (Minimize) and Exit.
 */
export function ExitRoomDialog({ isOpen, onClose, onConfirmExit, onMinimize }: ExitRoomDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Background tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex flex-col items-center gap-16">
        
        {/* KEEP / MINIMIZE BUTTON */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="h-24 w-24 rounded-full bg-[#00E5FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:scale-110 active:scale-95 transition-all"
          >
            <Minimize2 className="h-10 w-10 text-white" />
          </button>
          <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Keep</span>
        </div>

        {/* EXIT BUTTON */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onConfirmExit(); }}
            className="h-24 w-24 rounded-full bg-[#00E5FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:scale-110 active:scale-95 transition-all"
          >
            <Power className="h-10 w-10 text-white" />
          </button>
          <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Exit</span>
        </div>

      </div>

      {/* Close indicator/shortcut */}
      <button 
        onClick={onClose}
        className="absolute bottom-12 p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"
      >
        <X className="h-6 w-6 text-white/70" />
      </button>

    </div>
  );
}
