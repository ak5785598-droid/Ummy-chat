'use client';

import { useRoomContext } from './room-provider';
import { useRouter } from 'next/navigation';
import { Users, LogOut, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, serverTimestamp, increment } from 'firebase/firestore';
import { useMemo } from 'react';
import { RoomParticipant } from '@/lib/types';

/**
 * Global Mini-Player Overlay
 * Appears at the bottom of the screen when a room is minimized.
 */
export function RoomMiniPlayer() {
  const { minimizedRoom, setMinimizedRoom, setActiveRoom } = useRoomContext();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const roomId = minimizedRoom?.id;

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(collection(firestore, 'chatRooms', roomId, 'participants'));
  }, [firestore, roomId]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const activeMicsCount = useMemo(() => 
    participants?.filter(p => p.seatIndex > 0 && !p.isMuted).length || 0,
  [participants]);

  if (!minimizedRoom) return null;

  const handleReturn = () => {
    setActiveRoom(minimizedRoom);
    setMinimizedRoom(null);
    router.push(`/rooms/${minimizedRoom.slug || minimizedRoom.id}`);
  };

  const handleExit = () => {
    if (firestore && user && roomId) {
      const roomDocRef = doc(firestore, 'chatRooms', roomId);
      updateDocumentNonBlocking(roomDocRef, { 
        participantCount: increment(-1),
        updatedAt: serverTimestamp() 
      });

      const pRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
      deleteDocumentNonBlocking(pRef);
      
      const uRef = doc(firestore, 'users', user.uid);
      const profRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      updateDocumentNonBlocking(uRef, { currentRoomId: null, isOnline: false, updatedAt: serverTimestamp() });
      updateDocumentNonBlocking(profRef, { currentRoomId: null, isOnline: false, updatedAt: serverTimestamp() });
    }
    setMinimizedRoom(null);
  };

  return (
    <div className="fixed bottom-[4.5rem] left-2 right-2 z-[100] animate-in slide-in-from-bottom-2 duration-300">
      <div 
        className="bg-black/80 border border-white/5 rounded-full shadow-xl px-4 py-2 flex items-center justify-between backdrop-blur-xl"
        onClick={handleReturn}
      >
        
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer">
          <div className="relative shrink-0 flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {activeMicsCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="w-full h-full rounded-full border border-green-500 animate-ping" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-white/90 truncate max-w-[120px]">
              {minimizedRoom.title || 'Frequency'}
            </span>
            <div className="h-3 w-px bg-white/10" />
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest whitespace-nowrap">
              {participants?.length || 0} Listening
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); handleExit(); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white/40" />
          </button>
        </div>

      </div>
    </div>
  );
}
