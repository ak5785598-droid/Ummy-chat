'use client';

import { useRoomContext } from './room-provider';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PhoneOff, Maximize2, Users, Loader } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * Floating bar that appears when a room is minimized.
 */
export function FloatingRoomBar() {
  const { activeRoom, setActiveRoom, isMinimized, setIsMinimized } = useRoomContext();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !activeRoom?.id || !user) return null;
    return query(collection(firestore, 'chatRooms', activeRoom.id, 'participants'));
  }, [firestore, activeRoom?.id, user]);

  const { data: participants } = useCollection(participantsQuery);
  const onlineCount = participants?.length || 0;

  if (!activeRoom || !isMinimized) return null;

  // Don't show if we are actually on the room page (though context should handle this)
  if (pathname === `/rooms/${activeRoom.id}`) return null;

  const handleLeave = () => {
    if (firestore && user && activeRoom) {
      const participantRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);
      deleteDocumentNonBlocking(participantRef);
    }
    setActiveRoom(null);
    setIsMinimized(false);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    router.push(`/rooms/${activeRoom.id}`);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={handleMaximize}>
          <Avatar className="h-10 w-10 rounded-xl border border-primary/20">
            <AvatarImage src={activeRoom.coverUrl} />
            <AvatarFallback>UM</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate uppercase italic">{activeRoom.title}</p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary/80 uppercase">
               <Users className="h-3 w-3" />
               <span>{onlineCount} Tribe Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="rounded-full bg-white/10 text-white" onClick={handleMaximize}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-full bg-red-500/20 text-red-500" onClick={handleLeave}>
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
