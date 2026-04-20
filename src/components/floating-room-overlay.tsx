'use client';

import { useRoomContext } from '@/components/room-provider';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

/**
 * FLOATING ROOM OVERLAY
 * A persistent UI bubble that appears when a room is minimized.
 * Supports background audio while navigating other pages.
 * Matches the 'mine' screenshot style with cyan borders and draggability.
 */
export function FloatingRoomOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    activeRoom, 
    minimizedRoom, 
    setMinimizedRoom, 
    setActiveRoom 
  } = useRoomContext();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  // Logic: Show bubble only if there is a minimized room AND we aren't currently in a full room page
  // ALSO, if there's an activeRoom but we've navigated away from the room page, we treat it as minimized.
  const roomToDisplay = activeRoom || minimizedRoom;
  const isInRoomPage = pathname?.startsWith('/rooms/');

  // We only show the bubble if:
  // 1. We have a session room.
  // 2. We are NOT on the room page itself.
  const shouldShow = !!roomToDisplay && !isInRoomPage;

  if (!shouldShow) return null;

  const handleReturn = () => {
    if (minimizedRoom) {
      setActiveRoom(minimizedRoom);
      setMinimizedRoom(null);
    }
    router.push(`/rooms/${roomToDisplay.slug || roomToDisplay.id}`);
  };

  const handleExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveRoom(null);
    setMinimizedRoom(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        initial={{ scale: 0, opacity: 0, x: 100 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0, opacity: 0, x: 100 }}
        className="fixed bottom-24 right-6 z-[200] touch-none"
      >
        <div className="relative group">
          {/* Main Bubble */}
          <button
            onClick={handleReturn}
            className={cn(
              "h-16 w-16 rounded-full border-[3px] border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden bg-slate-900 active:scale-95 transition-transform",
              "relative z-10"
            )}
          >
            {roomToDisplay.coverUrl ? (
              <Image 
                src={roomToDisplay.coverUrl} 
                alt="Room" 
                fill 
                className="object-cover brightness-110"
                unoptimized
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                <Home className="h-6 w-6 text-white" />
              </div>
            )}
            
            {/* Pulsing indicator */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-ping opacity-30" />
          </button>

          {/* Close Button (X) */}
          <button
            onClick={handleExit}
            className="absolute -top-1 -right-1 z-20 h-5 w-5 bg-black/80 text-white rounded-full flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-transform"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Label (Optional: Hidden until hover or just kept minimal) */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 hidden group-hover:block">
            <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Return to Room</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
