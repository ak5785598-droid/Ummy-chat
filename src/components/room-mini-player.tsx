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
    <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-[#1a0b2e] to-[#2d0b4a] border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center justify-between backdrop-blur-md">
        
        <div className="flex items-center gap-3 overflow-hidden" onClick={handleReturn}>
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-xl bg-[#FFCC00] flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-black" />
            </div>
            {activeMicsCount > 0 && (
              <div className="absolute -top-1 -right-1 flex gap-0.5">
                <span className="h-2 w-0.5 bg-green-400 animate-pulse" />
                <span className="h-3 w-0.5 bg-green-400 animate-pulse delay-75" />
                <span className="h-2 w-0.5 bg-green-400 animate-pulse delay-150" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-white truncate leading-tight">
              {minimizedRoom.title || 'Frequency'}
            </h3>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                Session Active • {participants?.length || 0} Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleReturn}
            className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-white/70" />
          </button>
          <button 
            onClick={handleExit}
            className="p-2.5 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>

      </div>
    </div>
  );
}
