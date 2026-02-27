'use client';

import React from 'react';
import { useRoomContext } from '@/components/room-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Users, ChevronDown, Crown, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { EmojiReactionOverlay } from '@/components/emoji-reaction-overlay';

/**
 * High-Fidelity Golden Mic Icon for shining empty seats.
 */
const GoldenMicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="micGoldGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF281" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="url(#micGoldGradCompact)" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="url(#micGoldGradCompact)" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="23" stroke="url(#micGoldGradCompact)" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="23" x2="16" y2="23" stroke="url(#micGoldGradCompact)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * High-Fidelity Compact Room Overlay.
 * Mirroring the glossy, double-gold ring seat design with mic icons.
 */
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
    <div className="absolute top-0 left-0 right-0 z-[100] flex flex-col bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
      <div className="flex items-center justify-between p-3 pointer-events-auto">
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
        <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-black px-2 py-0">Live Frequency</Badge>
      </div>

      <div className="overflow-x-auto no-scrollbar p-2 pointer-events-auto">
        <div className="flex gap-4 px-2 min-w-max pb-4">
          {Array.from({ length: 13 }).map((_, i) => {
            const idx = i + 1; 
            const occupant = participants?.find(p => p.seatIndex === idx);
            const isLocked = activeRoom.lockedSeats?.includes(idx);
            const isMod = activeRoom.moderatorIds?.includes(occupant?.uid || '');
            const isOwner = occupant?.uid === activeRoom.ownerId;

            return (
              <div key={idx} className="relative flex flex-col items-center gap-1 shrink-0 w-16 h-20">
                <EmojiReactionOverlay emoji={occupant?.activeEmoji} size="sm" />
                <div className="relative">
                  {occupant && !occupant.isMuted && (
                    <div className={cn("absolute -inset-1 rounded-full border-2 animate-voice-wave", getWaveColor(occupant.activeWave))} />
                  )}
                  <AvatarFrame frameId={occupant?.activeFrame} size="sm">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center transition-all bg-gradient-to-br from-[#0a1a0a] to-[#020502] border-[3px] border-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.3),inset_0_0_4px_rgba(0,0,0,0.6),0_0_0_1px_#fbbf24]",
                      "relative overflow-hidden"
                    )}>
                      {/* Glossy High-Fidelity Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent rounded-full h-1/2 pointer-events-none z-10" />
                      
                      {occupant ? (
                        <Avatar className="h-full w-full p-0.5">
                          <AvatarImage src={occupant.avatarUrl} />
                          <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : isLocked ? <Lock className="h-4 w-4 text-red-500/40" /> : (
                        <div className="flex items-center justify-center w-full h-full">
                           <GoldenMicIcon className="h-6 w-6 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
                        </div>
                      )}
                    </div>
                  </AvatarFrame>
                  {occupant?.isMuted && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 border border-black shadow-lg">
                      <MicOff className="h-2 w-2 text-white" />
                    </div>
                  )}
                  {(isOwner || isMod) && (
                    <div className="absolute -top-0.5 -left-0.5 bg-yellow-500 rounded-full p-0.5 border border-black shadow-lg">
                      {isOwner ? <Crown className="h-2 w-2 text-black fill-current" /> : <ShieldCheck className="h-2 w-2 text-white fill-current" />}
                    </div>
                  )}
                </div>
                <span className={cn("text-[7px] font-black uppercase truncate w-14 text-center mt-1", occupant ? "text-[#fbbf24]" : "text-white/60")}>
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
