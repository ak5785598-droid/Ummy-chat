'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRoomContext } from '@/components/room-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * High-Fidelity Compact Room Overlay.
 * Re-engineered to only show the room header when inside games.
 * Seats have been removed as per the Sovereign visual protocol to maximize game arena visibility.
 */
export function CompactRoomView() {
  const { activeRoom, setIsMinimized } = useRoomContext();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  // DEFERRED IDENTITY SYNC: now set to null to prevent hydration discrepancy
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // SYNC INITIALIZATION: Initialize 'now' on client mount
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !activeRoom?.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', activeRoom.id, 'participants'));
  }, [firestore, activeRoom?.id, currentUser]);

  const { data: rawParticipants } = useCollection(participantsQuery);
  
  // ANTI-GHOST FILTER: Real-time UI purge for inactive participants
  const participants = useMemo(() => {
    if (!rawParticipants) return [];
    // GHOST IDENTITY RECOVERY: If 'now' is null, return raw data to match server render
    if (now === null) return rawParticipants;

    return rawParticipants.filter(p => {
      const lastSeen = (p as any).lastSeen?.toDate?.()?.getTime?.() || 0;
      if (!lastSeen) return true;
      return (now - lastSeen) < 65000;
    });
  }, [rawParticipants, now]);

  const onlineCount = participants.length;

  if (!activeRoom) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-[100] flex flex-col bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
      <div className="flex items-center justify-between p-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setIsMinimized(false); router.push(`/rooms/${activeRoom.id}`); }} 
            className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-all"
          >
            <ChevronDown className="h-4 w-4 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-lg border border-white/20 shadow-sm">
               <AvatarImage src={activeRoom.coverUrl} />
               <AvatarFallback>UM</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xs font-black uppercase italic text-white truncate w-32 leading-none mb-1">{activeRoom.title}</h2>
              <div className="flex items-center gap-2 text-[8px] font-bold text-white/40 uppercase">
                <Users className="h-2 w-2 text-pink-400" />
                <span>{onlineCount} Tribe</span>
              </div>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-black px-2 py-0">Live Frequency</Badge>
      </div>
    </div>
  );
}
