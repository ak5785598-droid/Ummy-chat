'use client';

import React from 'react';
import { useRoomContext } from '@/components/room-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Users, ChevronDown, Crown, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function CompactRoomView() {
  const { activeRoom, setIsMinimized } = useRoomContext();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !activeRoom?.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', activeRoom.id, 'participants'));
  }, [firestore, activeRoom?.id, currentUser]);

  const { data: participants } = useCollection(participantsQuery);
  const onlineCount = participants?.length || 0;

  if (!activeRoom) return null;

  const getWaveColor = (waveId?: string) => {
    switch(waveId) {
      case 'w1': return 'text-cyan-500';
      case 'w2': return 'text-orange-600';
      default: return 'text-primary';
    }
  };

  return (
    <div className="w-full bg-black/90 border-b border-white/10 flex flex-col h-[40vh] overflow-hidden relative z-50">
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setIsMinimized(false); router.push(`/rooms/${activeRoom.id}`); }} 
            className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-all"
          >
            <ChevronDown className="h-4 w-4 text-white" />
          </button>
          <div>
            <h2 className="text-xs font-black uppercase italic text-white truncate w-32">{activeRoom.title}</h2>
            <div className="flex items-center gap-2 text-[8px] font-bold text-white/40 uppercase">
              <Users className="h-2 w-2 text-pink-400" />
              <span>{onlineCount} Tribe</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-black px-2 py-0">Live Room</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-4 gap-x-2 gap-y-6 max-w-md mx-auto">
          {Array.from({ length: 12 }).map((_, i) => {
            const idx = i + 1; 
            const occupant = participants?.find(p => p.seatIndex === idx);
            const isLocked = activeRoom.lockedSeats?.includes(idx);
            const isMod = activeRoom.moderatorIds?.includes(occupant?.uid || '');
            const isOwner = occupant?.uid === activeRoom.ownerId;

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  {occupant && !occupant.isMuted && (
                    <div className={cn("absolute -inset-1.5 rounded-full border-2 animate-voice-wave", getWaveColor(occupant.activeWave))} />
                  )}
                  <AvatarFrame frameId={occupant?.activeFrame} size="sm">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center transition-all bg-black/30 backdrop-blur-lg border-2",
                      occupant ? "border-primary shadow-lg" : "border-white/10",
                    )}>
                      {occupant ? (
                        <Avatar className="h-full w-full p-0.5"><AvatarImage src={occupant.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                      ) : <Mic className="h-4 w-4 text-white/10" />}
                    </div>
                  </AvatarFrame>
                  {occupant?.isMuted && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 border border-black shadow-lg">
                      <MicOff className="h-2 w-2 text-white" />
                    </div>
                  )}
                  {isOwner ? (
                    <div className="absolute -top-0.5 -left-0.5 bg-yellow-500 rounded-full p-0.5 border border-black shadow-lg">
                      <Crown className="h-2 w-2 text-black fill-current" />
                    </div>
                  ) : isMod ? (
                    <div className="absolute -top-0.5 -left-0.5 bg-blue-500 rounded-full p-0.5 border border-black shadow-lg">
                      <ShieldCheck className="h-2 w-2 text-white fill-current" />
                    </div>
                  ) : null}
                </div>
                <span className="text-[7px] font-black uppercase text-white/60 truncate w-10 text-center">
                  {occupant ? occupant.name : `Slot ${idx}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
